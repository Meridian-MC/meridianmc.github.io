#!/usr/bin/env python3
"""
Rebuild data.json from the live Meridian server.

Runs in CI (see .github/workflows/analytics.yml) on a schedule, and can be run
locally. Pulls a handful of files over FTP, queries the shop/economy databases,
and writes ../data.json. The workflow commits the result if it changed.

Environment:
    MC_FTP_HOST      default 6856.node.apexhosting.gdn
    MC_FTP_USER      default iakkovos.3360229
    MC_FTP_PASSWORD  required
    MC_PROFILE       default profile_orfqa

MySQL credentials are read from the server's own EzRTP config (pulled over FTP),
so rotating the DB password in-game is picked up automatically.
"""
import os, io, sys, json, re, time, ftplib, sqlite3, datetime, statistics, tempfile

HOST = os.environ.get("MC_FTP_HOST", "6856.node.apexhosting.gdn")
USER = os.environ.get("MC_FTP_USER", "iakkovos.3360229")
PW = os.environ.get("MC_FTP_PASSWORD")
PROFILE = os.environ.get("MC_PROFILE", "profile_orfqa")
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "data.json"))

# Optional: live server health (TPS + uptime) via RCON. If MC_RCON_PASSWORD is
# unset or the port is unreachable, data.server is left empty and the website
# just omits those two figures.
RCON_HOST = os.environ.get("MC_RCON_HOST", HOST)
RCON_PORT = int(os.environ.get("MC_RCON_PORT", "25575"))
RCON_PW = os.environ.get("MC_RCON_PASSWORD")

MIN_TRADERS, MIN_DAYS = 8, 14
BASKET = ["Wheat", "Iron Ingot", "Diamond", "Ender Pearl", "Oak Log"]
TRACKED = [
    ("Diamond", "each"), ("Netherite Ingot", "each"), ("Iron Ingot", "each"),
    ("Gold Ingot", "each"), ("Emerald", "each"), ("Ender Pearl", "each"),
    ("Enchanted Book", "each"), ("Totem of Undying", "each"),
    ("Shulker Box", "each"), ("Oak Log", "stack"), ("Wheat", "stack"),
    ("Blaze Rod", "each"), ("Nether Star", "each"),
]


def ftp_conn(attempts=3):
    if not PW:
        sys.exit(
            "MC_FTP_PASSWORD is not set. In CI it comes from the repository secret of "
            "the same name (Settings > Secrets and variables > Actions). Set it to the "
            "server's current FTP password."
        )
    last = None
    for i in range(attempts):
        try:
            f = ftplib.FTP(timeout=45)
            f.connect(HOST, 21)
            f.login(USER, PW)
            f.set_pasv(True)
            return f
        except ftplib.error_perm as e:
            # A rejected login will never succeed on retry, so fail loudly and say why.
            sys.exit(
                f"FTP rejected the login ({e}). MC_FTP_PASSWORD is almost certainly "
                "stale: update the repository secret to the server's current FTP password."
            )
        except Exception as e:
            last = e
            time.sleep(2 * (i + 1))
    sys.exit(f"FTP connection failed after {attempts} attempts: {last!r}")


def ftp_bytes(f, path, attempts=2):
    # Apex's FTP throws transient 4xx/550-style errors under load, so one retry
    # keeps a whole refresh from being lost to a single flaky read.
    last = None
    for i in range(attempts):
        try:
            buf = io.BytesIO()
            f.retrbinary("RETR /" + path.strip("/"), buf.write)
            return buf.getvalue()
        except ftplib.error_perm:
            raise            # genuinely absent file; callers already handle this
        except Exception as e:
            last = e
            time.sleep(1)
    raise last


def ftp_list(f, path):
    try:
        return [n for n, _ in f.mlsd("/" + path.strip("/"))]
    except ftplib.error_perm:
        return f.nlst("/" + path.strip("/"))


def gini(vals):
    v = sorted(x for x in vals if x is not None and x >= 0)
    n = len(v)
    if n < 2 or sum(v) == 0:
        return None
    return round((2 * sum(i * x for i, x in enumerate(v, 1))) / (n * sum(v)) - (n + 1) / n, 3)


def daily(pairs):
    b = {}
    for ts, val in pairs:
        d = datetime.datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d")
        b[d] = b.get(d, 0) + val
    return [[d, round(v, 2)] for d, v in sorted(b.items())]


def classify(vol_series, traders, span):
    if traders < MIN_TRADERS or span < MIN_DAYS or len(vol_series) < 14:
        return {"code": "INSUFFICIENT_DATA", "label": "Insufficient data",
                "note": f"Need {MIN_TRADERS}+ active traders and {MIN_DAYS}+ days of history. "
                        f"Currently {traders} traders / {span} days."}
    recent = sum(v for _, v in vol_series[-7:])
    prior = sum(v for _, v in vol_series[-14:-7]) or 1
    ch = (recent - prior) / abs(prior)
    if ch > 0.10:
        return {"code": "EXPANSION", "label": "Expansion", "note": f"Trade volume up {ch:.0%} week over week."}
    if ch > -0.05:
        return {"code": "STEADY", "label": "Steady", "note": f"Trade volume flat ({ch:+.0%}) week over week."}
    if ch > -0.25:
        return {"code": "COOLING", "label": "Cooling", "note": f"Trade volume down {abs(ch):.0%} week over week."}
    return {"code": "RECESSION", "label": "Recession", "note": f"Trade volume down {abs(ch):.0%} week over week."}


def parse_trade_log(raw):
    rows = []
    for line in raw.decode("utf8", "replace").splitlines():
        cells = [m.group(1) if m.group(1) is not None else m.group(2)
                 for m in re.finditer(r'"([^"]*)"|([^,]+)', line)]
        if len(cells) < 7:
            continue
        op, dtxt, player, amt = cells[1], cells[3], cells[4], cells[5]
        try:
            dt = datetime.datetime.strptime(dtxt.strip().split(" Coordinated")[0],
                                            "%A, %B %d, %Y, %I:%M:%S %p")
            amt = float(amt)
        except Exception:
            continue
        sign = 1 if op == "Add" else -1 if op == "Subtract" else 0
        rows.append((dt.replace(tzinfo=datetime.timezone.utc).timestamp(), player, sign * amt, op))
    return rows


# Lands lets players prefix a claim/nation name with a MiniMessage hex tag to
# set its map color, e.g. "<#FF5555>Halewick". Pull that out for both the
# clean display name and a CSS-ready accent color.
_COLOR_RE = re.compile(r"^<#([0-9A-Fa-f]{6})>\s*")


def _split_color(raw_name):
    raw_name = raw_name or ""
    m = _COLOR_RE.match(raw_name)
    if m:
        return _COLOR_RE.sub("", raw_name), "#" + m.group(1).upper()
    return raw_name, None


def lands_from_db(raw):
    fd, tmp = tempfile.mkstemp(suffix=".db")
    os.write(fd, raw)
    os.close(fd)
    con = sqlite3.connect(tmp)
    con.row_factory = sqlite3.Row
    lands, claims = [], {}
    for r in con.execute("SELECT * FROM lands_lands_claims"):
        claims[r["land"]] = int(r["chunks_amount"] or 0)
    for r in con.execute("SELECT * FROM lands_lands"):
        d = dict(r)
        area = {}
        try:
            area = json.loads(d.get("area") or "{}")
        except Exception:
            pass
        members = len((area.get("holder") or {}).get("trusted") or []) + 1
        name, color = _split_color(d.get("name"))
        lands.append({"id": d.get("ulid") or d.get("id"), "name": name, "color": color,
                      "type": (d.get("type") or "").lower(), "bank": float(d.get("balance") or 0),
                      "level": d.get("level") or 0, "members": members,
                      "chunks": claims.get(d.get("ulid") or d.get("id"), 0)})
    nations = []
    for r in con.execute("SELECT * FROM lands_nations"):
        name, color = _split_color(r["name"])
        nations.append({"name": name, "tag": r["tag"], "color": color})
    con.close()
    os.unlink(tmp)
    return lands, nations


def mdi(chunks, members, treasury, activity):
    t = min(chunks / 60, 1.0) or 0.001
    p = min(members / 15, 1.0) or 0.001
    w = min(treasury / 5_000_000, 1.0) or 0.001
    a = max(activity, 0.001)
    return {"mdi": round((t * p * w * a) ** 0.25, 3), "territory": round(t, 3),
            "population": round(p, 3), "wealth": round(w, 3), "activity": round(a, 3),
            "chunks": chunks, "members": members, "treasury": round(treasury, 2)}


def mysql_from_rtp(rtp_text):
    u = re.search(r'mysql-url:\s*"?jdbc:mysql://([^:/"]+):(\d+)/', rtp_text)
    user = re.search(r'mysql-user:\s*"?([^"\s]+)', rtp_text)
    pw = re.search(r'mysql-password:\s*"([^"]+)"', rtp_text)
    if not (u and user and pw):
        return None
    try:
        import pymysql
    except ImportError:
        return None
    try:
        con = pymysql.connect(host=u.group(1), port=int(u.group(2)), user=user.group(1),
                              password=pw.group(1), database=user.group(1), connect_timeout=15)
    except Exception:
        return None
    cur = con.cursor()
    cur.execute("SHOW TABLES")
    tables = {r[0].lower() for r in cur.fetchall()}
    out = {"items": [], "container_30d": None, "qs_tx": None}

    # QuickShop-Hikari shop prices: qs_data holds item + price for live shops.
    data_t = next((t for t in tables if re.fullmatch(r"qs_.*data", t)), None)
    if data_t:
        try:
            cur.execute(f"SELECT data FROM `{data_t}`")
            prices = {}
            for (blob,) in cur.fetchall():
                try:
                    j = json.loads(blob)
                except Exception:
                    continue
                item = (j.get("item") or {}).get("type") or j.get("item_type")
                price = j.get("price")
                if item and price:
                    prices.setdefault(_pretty(item), []).append(float(price))
            for name, unit in TRACKED:
                vals = prices.get(name)
                if vals:
                    out["items"].append({"name": name, "unit": unit,
                                         "price": round(statistics.median(vals), 2),
                                         "change_7d": 0.0, "shops": len(vals), "series": []})
        except Exception:
            pass
    log_t = next((t for t in tables if t.startswith("qs_") and ("log" in t or "purchase" in t)), None)
    if log_t:
        try:
            cur.execute(f"SELECT count(*) FROM `{log_t}`")
            out["qs_tx"] = cur.fetchone()[0]
        except Exception:
            pass
    if "co_container" in tables:
        try:
            cur.execute("SELECT count(*) FROM co_container WHERE time > UNIX_TIMESTAMP() - 30*86400")
            out["container_30d"] = cur.fetchone()[0]
        except Exception:
            pass
    con.close()
    return out


def _pretty(material):
    return " ".join(w.capitalize() for w in re.sub(r"^minecraft:", "", material).split("_"))


def _rcon(cmd):
    """One RCON command -> decoded reply text ('' on any failure)."""
    import socket, struct

    def pkt(pid, ptype, body):
        d = struct.pack("<ii", pid, ptype) + body.encode("utf8") + b"\x00\x00"
        return struct.pack("<i", len(d)) + d

    try:
        s = socket.create_connection((RCON_HOST, RCON_PORT), timeout=12)
        s.settimeout(12)
        s.sendall(pkt(1, 3, RCON_PW))
        s.recv(4096)
        s.sendall(pkt(2, 2, cmd))
        s.sendall(pkt(3, 2, ""))
        buf = b""
        while b"\x00\x00" not in buf[10:] or len(buf) < 14:
            chunk = s.recv(4096)
            if not chunk:
                break
            buf += chunk
            if len(buf) > 32768:
                break
        s.close()
    except Exception:
        return ""
    return re.sub(r"\xa7.", "", buf.decode("utf8", "replace"))


def _uptime_seconds(txt):
    """'2 days 4 hours 5 minutes 3 seconds' -> seconds."""
    units = {"day": 86400, "hour": 3600, "minute": 60, "second": 1}
    total = 0
    for n, u in re.findall(r"(\d+)\s*(day|hour|minute|second)s?", txt):
        total += int(n) * units[u]
    return total


def server_health():
    """TPS + when the server started, from the RCON `uptime` command (CMILib).
    The site computes a live uptime from started_at. {} when RCON isn't set up."""
    if not RCON_PW:
        return {}
    txt = _rcon("uptime")
    if not txt:
        return {}
    out = {"checked": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    m = re.search(r"Uptime:\s*([^\r\n]+)", txt)
    if m:
        secs = _uptime_seconds(m.group(1))
        if secs:
            out["started_at"] = (datetime.datetime.now(datetime.timezone.utc)
                                 - datetime.timedelta(seconds=secs)).strftime("%Y-%m-%dT%H:%M:%SZ")
    m = re.search(r"TPS\s*[=:]\s*([\d.]+)", txt)
    if m:
        out["tps"] = float(m.group(1))
    return out


def main():
    f = ftp_conn()
    P = f"{PROFILE}/plugins"
    balances = {}
    for name in ftp_list(f, f"{P}/Essentials/userdata"):
        if not name.endswith(".yml"):
            continue
        txt = ftp_bytes(f, f"{P}/Essentials/userdata/{name}").decode("utf8", "replace")
        nm = re.search(r"last-account-name:\s*(.+)", txt)
        mo = re.search(r"^\s*money:\s*'?([-\d.]+)'?", txt, re.M)
        if nm and mo:
            balances[nm.group(1).strip()] = float(mo.group(1))
    try:
        trades = parse_trade_log(ftp_bytes(f, f"{P}/Essentials/trade.log"))
    except ftplib.error_perm:
        trades = []
    try:
        lands, nations = lands_from_db(ftp_bytes(f, f"{P}/Lands/Data/database_v2.db"))
    except ftplib.error_perm:
        lands, nations = [], []
    try:
        rtp = ftp_bytes(f, f"{P}/EzRTP/rtp.yml").decode("utf8", "replace")
    except ftplib.error_perm:
        rtp = ""
    f.quit()

    my = mysql_from_rtp(rtp) if rtp else None

    real = [t for t in trades if t[3] in ("Add", "Subtract") and abs(t[2]) < 100_000]
    ts = [t[0] for t in trades] or [datetime.datetime.now(datetime.timezone.utc).timestamp()]
    span = max(1, round((max(ts) - min(ts)) / 86400))
    traders = len({t[1] for t in real})
    vol_series = daily([(t[0], abs(t[2])) for t in real])
    run, supply = 0, []
    for d, v in daily([(t[0], t[2]) for t in trades]):
        run += v
        supply.append([d, round(run, 2)])

    lands_by_nation = {}  # membership not stored simply here; treat lands unattached for now
    nation_rows = []
    for nrec in nations:
        ls = lands_by_nation.get(nrec["name"], [])
        nation_rows.append(dict(name=nrec["name"], tag=nrec["tag"], color=nrec.get("color"),
                                **mdi(sum(l["chunks"] for l in ls),
                                      sum(l["members"] for l in ls),
                                      sum(l["bank"] for l in ls),
                                      1.0 if ls else 0.0)))

    data = {
        "generated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "meta": {"players_tracked": len(balances), "active_traders": traders, "data_days": span,
                 "sufficient": traders >= MIN_TRADERS and span >= MIN_DAYS, "demo": False,
                 "thresholds": {"min_traders": MIN_TRADERS, "min_days": MIN_DAYS}},
        "economy": {
            "classification": classify(vol_series, traders, span),
            "money_supply_players": round(sum(balances.values()), 2),
            "money_supply_series": supply,
            "trade_volume_series": vol_series,
            "trade_volume_7d": round(sum(v for _, v in vol_series[-7:]), 2),
            "server_shop_transactions": (my or {}).get("qs_tx") or 0,
            "gini": gini(list(balances.values())),
            "price_index": {"value": None, "series": [],
                            "note": "Turns on once chest-shop prices have history."},
            "items": (my or {}).get("items", []),
        },
        "wealth": {
            "top": sorted(({"name": k, "balance": round(v, 2)} for k, v in balances.items()),
                          key=lambda x: -x["balance"])[:15],
            "median": round(statistics.median(balances.values()), 2) if balances else 0,
            "mean": round(statistics.mean(balances.values()), 2) if balances else 0,
        },
        "server": server_health(),
        "nations": nation_rows,
        "lands": sorted(({"name": l["name"], "type": l["type"], "chunks": l["chunks"],
                          "members": l["members"], "bank": round(l["bank"], 2), "level": l["level"]}
                         for l in lands), key=lambda x: -x["chunks"]),
    }
    json.dump(data, open(OUT, "w"), indent=2)
    print("wrote", OUT, "| MEI", data["economy"]["classification"]["code"],
          "| players", data["meta"]["players_tracked"], "| nations", len(nation_rows))


def write_status(ok, detail=""):
    """Record the outcome next to the data so a failing refresh is diagnosable
    from the repo itself. Never write anything derived from a credential."""
    for secret in (PW, RCON_PW):
        if secret:
            detail = detail.replace(secret, "***")
    json.dump(
        {"ok": ok,
         "at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
         "credential": os.environ.get("MC_FTP_SOURCE", "local"),
         "detail": detail[:300]},
        open(os.path.join(os.path.dirname(OUT), "data-status.json"), "w"),
        indent=2,
    )


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        # sys.exit("message") from the checks above: a real, explained failure.
        write_status(False, str(e.code) if e.code not in (None, 0) else "")
        raise
    except Exception as e:
        write_status(False, f"{type(e).__name__}: {e}")
        raise
    else:
        write_status(True, "")
