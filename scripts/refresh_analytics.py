#!/usr/bin/env python3
"""
Rebuild public/data.json from the live Meridian server.

Runs in CI (.github/workflows/analytics.yml) every 15 minutes, and can be run
locally. Reads the game server over FTP (+ QuickShop's MySQL, + optional RCON)
and writes public/data.json plus a few small state files under scripts/state/
that make the expensive parts incremental between runs.

The currency is Gold, an item currency (TheNewEconomy `Type: item`): gold
ingots (1 G) and gold blocks (9 G) sitting in the world ARE the money. There is
no ledger of balances anywhere - TNE's account files just say
INVENTORY_HOLDINGS and mean nothing while a player is offline. So the money
supply is counted the only way it can be: by reading the world.

    on hand      world/players/data/*.dat     inventories, armour/offhand
    ender chests world/players/data/*.dat     EnderItems (not spendable, but real)
    containers   dimensions/*/region/*.mca    chests, barrels, shulkers, hoppers...
    loose        dimensions/*/entities/*.mca  item frames, chest carts, dropped items
    land banks   Lands database_v2.db         the one virtual store (money leaves
                                              the world when deposited)

The overworld is ~4 GB of region files, so the scan is incremental: each file's
gold total is cached against its FTP mtime in scripts/state/world_gold.json and
only files that changed since the last run are re-read, within a per-run budget.
Coverage is published with the figures so a partial cache is never mistaken for
a small economy.

Environment:
    MC_FTP_HOST       default 6856.node.apexhosting.gdn
    MC_FTP_USER       default iakkovos.3360229
    MC_FTP_PASSWORD   required
    MC_PROFILE        the live server dir on the FTP root. Default: auto-detect,
                      the profile_* whose world/level.dat was written most
                      recently. Dead profiles stay readable, which once sent a
                      week of refreshes to the wrong one - never hardcode this.
    MC_PUBLISH_PATH   optional remote path to upload the finished file to;
                      `{profile}` is substituted, e.g.
                      {profile}/plugins/squaremap/web/data.json
    MC_SCAN_BUDGET_MB / MC_SCAN_BUDGET_FILES  per-run region scan budget
                      (default 400 MB / 40 files; set high for a cold start)
    MC_RCON_PASSWORD / MC_RCON_HOST / MC_RCON_PORT   optional, for TPS/uptime

MySQL credentials come from QuickShop's own config (pulled over FTP), so a
rotated DB password is picked up automatically.
"""
import base64
import datetime
import ftplib
import gzip
import io
import json
import os
import re
import sqlite3
import statistics
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mcnbt  # noqa: E402

HOST = os.environ.get("MC_FTP_HOST") or "6856.node.apexhosting.gdn"
USER = os.environ.get("MC_FTP_USER") or "iakkovos.3360229"
PW = os.environ.get("MC_FTP_PASSWORD") or None
PROFILE_OVERRIDE = os.environ.get("MC_PROFILE") or None
PUBLISH_PATH = os.environ.get("MC_PUBLISH_PATH") or None

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "public", "data.json")
STATE_DIR = os.path.join(ROOT, "scripts", "state")
WORLD_STATE = os.path.join(STATE_DIR, "world_gold.json")
LEDGER_STATE = os.path.join(STATE_DIR, "ledger.json")
HISTORY_STATE = os.path.join(STATE_DIR, "history.json")

# An unset GitHub secret arrives as an EMPTY STRING, not an absent variable, so
# os.environ.get(k, default) returns "" and never the default. `or` is what
# actually falls back; int("") would crash at import before any error handling.
SCAN_BUDGET_MB = float(os.environ.get("MC_SCAN_BUDGET_MB") or 400)
SCAN_BUDGET_FILES = int(os.environ.get("MC_SCAN_BUDGET_FILES") or 40)
RCON_HOST = os.environ.get("MC_RCON_HOST") or HOST
RCON_PORT = int(os.environ.get("MC_RCON_PORT") or 25575)
RCON_PW = os.environ.get("MC_RCON_PASSWORD") or None

# Gold launched with the profile switch. Anything logged before this is the
# old dollar economy and must never be mixed into a Gold series.
ERA_START = "2026-09-12"
ERA_START_TS = datetime.datetime(2026, 9, 12, tzinfo=datetime.timezone.utc).timestamp()

MIN_TRADERS, MIN_DAYS = 8, 14
GOLD = {"minecraft:gold_ingot": 1, "minecraft:gold_block": 9}
# Never price these: a shop selling gold for gold is noise, not a market.
UNTRACKED = {"minecraft:gold_ingot", "minecraft:gold_block", "minecraft:gold_nugget"}
# Components that don't change what an item IS. Anything else (stored
# enchantments, potion effects, a custom name) makes two shops' "Enchanted
# Book" or "Potion" different goods, and their prices can't be pooled.
COSMETIC_COMPONENTS = {"minecraft:lore", "minecraft:custom_data", "minecraft:repair_cost",
                       "minecraft:damage", "minecraft:rarity", "minecraft:enchantment_glint_override"}
MAX_TRACKED_ITEMS = 16

UTC = datetime.timezone.utc


def now_iso():
    return datetime.datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def day_of(ts):
    return datetime.datetime.fromtimestamp(ts, UTC).strftime("%Y-%m-%d")


# --------------------------------------------------------------------------- FTP

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
            f = ftplib.FTP(timeout=60)
            f.connect(HOST, 21)
            f.login(USER, PW)
            f.set_pasv(True)
            return f
        except ftplib.error_perm as e:
            # A rejected login will never succeed on retry, so fail loudly and say why.
            sys.exit(
                f"FTP rejected the login ({e}). The credential is wrong: check "
                "MC_FTP_PASSWORD_2 (or MC_FTP_PASSWORD) against the server's "
                "current FTP password. This is an auth rejection, not a network "
                "or IP restriction - the runners reach Apex fine."
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


def ftp_listing(f, path):
    """[(name, size, mtime_str)] for the files in a remote directory."""
    out = []
    try:
        for name, facts in f.mlsd("/" + path.strip("/")):
            if facts.get("type") == "file":
                out.append((name, int(facts.get("size") or 0), facts.get("modify") or ""))
    except ftplib.error_perm:
        return []
    return out


def ftp_dirs(f, path):
    try:
        return [n for n, facts in f.mlsd("/" + path.strip("/"))
                if facts.get("type") == "dir" and n not in (".", "..")]
    except ftplib.error_perm:
        return []


def detect_profile(f):
    """The live server is the profile_* whose world/level.dat was saved last."""
    if PROFILE_OVERRIDE:
        return PROFILE_OVERRIDE
    best, best_m = None, ""
    for d in ftp_dirs(f, "/"):
        if not d.startswith("profile_"):
            continue
        for name, _, m in ftp_listing(f, f"{d}/world"):
            if name == "level.dat" and m > best_m:
                best, best_m = d, m
    if not best:
        sys.exit("No profile_*/world/level.dat found on the FTP root; set MC_PROFILE.")
    age_h = (datetime.datetime.now(UTC)
             - datetime.datetime.strptime(best_m[:14], "%Y%m%d%H%M%S").replace(tzinfo=UTC)
             ).total_seconds() / 3600
    print(f"profile {best} (level.dat {age_h:.1f}h old)")
    return best


# --------------------------------------------------------------------------- state

def load_state(path, default):
    try:
        with open(path) as fh:
            return json.load(fh)
    except Exception:
        return default


def save_state(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(obj, fh, indent=1, sort_keys=True)
    os.replace(tmp, path)


# --------------------------------------------------------------------------- gold counting

def item_gold(it):
    """Gold value of one item stack, including anything nested inside it
    (shulker boxes carry `minecraft:container`, bundles `bundle_contents`)."""
    if not isinstance(it, dict):
        return 0
    g = GOLD.get(it.get("id"), 0) * int(it.get("count", 1) or 0)
    comp = it.get("components") or {}
    if isinstance(comp, dict):
        for sub in comp.get("minecraft:container") or []:
            if isinstance(sub, dict):
                g += item_gold(sub.get("item"))
        for sub in comp.get("minecraft:bundle_contents") or []:
            g += item_gold(sub)
    return g


def items_gold(items):
    return sum(item_gold(it) for it in items) if isinstance(items, list) else 0


def block_entity_gold(be):
    # Chests, barrels, shulker boxes, hoppers, droppers, dispensers, furnaces,
    # crafters, campfires and chiseled bookshelves all keep `Items`; a
    # decorated pot keeps a single `item`. Vaults and trial spawners hold loot
    # tables, not player gold, and have neither key.
    g = items_gold(be.get("Items"))
    g += item_gold(be.get("item"))
    return g


# Storage entities: anything a player deliberately puts items into. Mobs with
# an `Inventory` (piglins admiring ingots, villagers, allays) are excluded on
# purpose - that gold is transient and not a player's.
def entity_gold(e):
    eid = e.get("id") or ""
    if eid in ("minecraft:item", "minecraft:item_frame", "minecraft:glow_item_frame"):
        return item_gold(e.get("Item"))
    if "Items" in e and (eid.endswith("_minecart") or eid.endswith("_boat") or eid.endswith("_raft")
                         or eid in ("minecraft:donkey", "minecraft:mule", "minecraft:llama",
                                    "minecraft:trader_llama", "minecraft:camel", "minecraft:horse")):
        return items_gold(e.get("Items"))
    return 0


def scan_region_file(raw, kind):
    """(gold, holders) for one region/entities file."""
    gold = holders = 0
    for _, _, chunk in mcnbt.region_chunks(raw):
        if kind == "region":
            for be in chunk.get("block_entities") or []:
                g = block_entity_gold(be)
                if g:
                    gold += g
                    holders += 1
        else:
            for e in chunk.get("Entities") or []:
                g = entity_gold(e)
                if g:
                    gold += g
                    holders += 1
    return gold, holders


def scan_world(f, profile, state):
    """Incrementally refresh the per-file gold cache for every dimension.

    Returns (containers_gold, loose_gold, coverage). Files whose mtime matches
    the cache are trusted; changed files are re-read newest-first within the
    budget; never-seen files come first of all so a cold cache converges.
    """
    files = state.setdefault("files", {})
    listing = {}
    base = f"{profile}/world/dimensions"
    for ns in ftp_dirs(f, base):
        for dim in ftp_dirs(f, f"{base}/{ns}"):
            for kind in ("region", "entities"):
                for name, size, m in ftp_listing(f, f"{base}/{ns}/{dim}/{kind}"):
                    if name.endswith(".mca"):
                        listing[f"{ns}/{dim}/{kind}/{name}"] = (size, m)

    # Drop cache entries for files that no longer exist.
    for key in [k for k in files if k not in listing]:
        del files[key]

    never, changed = [], []
    for key, (size, m) in listing.items():
        cached = files.get(key)
        if cached and cached.get("mtime") == m:
            continue
        (changed if cached else never).append((m, key, size))
    # Never-scanned files first so a cold cache converges; then the most
    # recently written files, which are where the gold is moving.
    queue = sorted(never, key=lambda t: t[1]) + sorted(changed, key=lambda t: t[0], reverse=True)

    spent_mb, spent_files = 0.0, 0
    for m, key, size in queue:
        if spent_files >= SCAN_BUDGET_FILES or spent_mb + size / 1e6 > SCAN_BUDGET_MB:
            break
        kind = key.split("/")[2]
        try:
            raw = ftp_bytes(f, f"{base}/{key}")
        except Exception as e:
            print("  skip", key, type(e).__name__)
            continue
        gold, holders = scan_region_file(raw, kind)
        files[key] = {"mtime": m, "size": size, "gold": gold, "holders": holders,
                      "scanned_at": now_iso()}
        spent_mb += size / 1e6
        spent_files += 1
    print(f"world scan: {spent_files} files / {spent_mb:.0f} MB read, "
          f"{len(queue) - spent_files} still pending")

    containers = loose = 0
    fresh = stale = unscanned = 0
    for key, (size, m) in listing.items():
        c = files.get(key)
        if not c:
            unscanned += 1
            continue
        if c.get("mtime") == m:
            fresh += 1
        else:
            stale += 1
        if key.split("/")[2] == "region":
            containers += c.get("gold", 0)
        else:
            loose += c.get("gold", 0)
    coverage = {"files": len(listing), "fresh": fresh, "stale": stale, "unscanned": unscanned}
    return containers, loose, coverage


def scan_players(f, profile, state):
    """Gold on hand + in ender chests per player, incrementally by file mtime."""
    players = state.setdefault("players", {})
    listing = {name[:-4]: (size, m)
               for name, size, m in ftp_listing(f, f"{profile}/world/players/data")
               if name.endswith(".dat")}
    for uuid in [u for u in players if u not in listing]:
        del players[uuid]
    n = 0
    for uuid, (size, m) in listing.items():
        cached = players.get(uuid)
        if cached and cached.get("mtime") == m:
            continue
        try:
            p = mcnbt.parse_gz(ftp_bytes(f, f"{profile}/world/players/data/{uuid}.dat"))
        except Exception as e:
            print("  skip player", uuid, type(e).__name__)
            continue
        on_hand = items_gold(p.get("Inventory"))
        eq = p.get("equipment")
        if isinstance(eq, dict):
            on_hand += sum(item_gold(v) for v in eq.values())
        players[uuid] = {"mtime": m, "on_hand": on_hand, "ender": items_gold(p.get("EnderItems")),
                         "name": cached.get("name") if cached else None}
        n += 1
    print(f"players: {len(listing)} tracked, {n} re-read")
    return players


def resolve_names(f, profile, players, lands_names):
    """uuid -> name from usercache.json, then Lands' player table, then the
    cached value. Anything still unknown is left as its short uuid."""
    names = {}
    try:
        for row in json.loads(ftp_bytes(f, f"{profile}/usercache.json").decode("utf8", "replace")):
            if row.get("uuid") and row.get("name"):
                names[row["uuid"]] = row["name"]
    except Exception:
        pass
    for uuid, rec in players.items():
        nm = names.get(uuid) or lands_names.get(uuid) or rec.get("name")
        rec["name"] = nm


# --------------------------------------------------------------------------- Lands

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


def fetch_lands_db(f, profile):
    """Lands runs SQLite in WAL mode, and the WAL can hold days of changes the
    main file doesn't have yet. Both are pulled side by side so SQLite replays
    it; reading database_v2.db alone silently returns the last checkpoint."""
    d = tempfile.mkdtemp()
    base = f"{profile}/plugins/Lands/Data/database_v2.db"
    with open(os.path.join(d, "database_v2.db"), "wb") as fh:
        fh.write(ftp_bytes(f, base))
    try:
        wal = ftp_bytes(f, base + "-wal")
        with open(os.path.join(d, "database_v2.db-wal"), "wb") as fh:
            fh.write(wal)
    except ftplib.error_perm:
        pass
    return os.path.join(d, "database_v2.db")


def lands_from_db(path):
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    claims = {}
    for r in con.execute("SELECT land, chunks_amount FROM lands_lands_claims"):
        claims[r["land"]] = claims.get(r["land"], 0) + int(r["chunks_amount"] or 0)

    player_names = {}
    try:
        for r in con.execute("SELECT uuid, name FROM lands_players"):
            player_names[r["uuid"]] = r["name"]
    except sqlite3.Error:
        pass

    def _members(area_json, members_col):
        # Lands 8.4 keeps a members list column; older rows only have the
        # trusted list inside the area JSON. The owner counts as a member.
        try:
            m = json.loads(members_col or "null")
            if isinstance(m, list) and m:
                return len(m)
        except (ValueError, TypeError):
            pass
        try:
            holder = json.loads(area_json or "{}").get("holder") or {}
            return len(holder.get("trusted") or []) + 1
        except (ValueError, TypeError):
            return 1

    def _owner_of(area_json):
        # Members live under area.holder.trusted as "<uuid>:<roleUlid>" pairs;
        # the owner is the one whose role has type 4.
        try:
            holder = json.loads(area_json or "{}").get("holder") or {}
            owner_roles = {x["ulid"] for x in holder.get("roles", []) if x.get("type") == 4}
            for entry in holder.get("trusted", []):
                uuid, _, role = entry.partition(":")
                if role in owner_roles:
                    return player_names.get(uuid)
        except (ValueError, TypeError, KeyError):
            pass
        return None

    def _ts(v):
        try:
            n = int(v)
        except (TypeError, ValueError):
            return None
        if n > 1e12:
            n //= 1000
        return n if n > 1e9 else None

    def _iso(t):
        return datetime.datetime.fromtimestamp(t, UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

    lands, events, owner_by_ulid = [], [], {}
    cols = {r[1] for r in con.execute("PRAGMA table_info(lands_lands)")}
    for r in con.execute("SELECT * FROM lands_lands"):
        d = dict(r)
        name, color = _split_color(d.get("name"))
        owner = _owner_of(d.get("area"))
        owner_by_ulid[d["ulid"]] = owner
        lands.append({"id": d["ulid"], "name": name, "color": color,
                      "type": (d.get("type") or "").lower(),
                      "bank": float(d.get("balance") or 0),
                      "level": d.get("level") or 0,
                      "members": _members(d.get("area"), d.get("members") if "members" in cols else None),
                      "nation": d.get("nation") if d.get("nation") not in (None, "None", "") else None,
                      "chunks": claims.get(d["ulid"], 0)})
        t = _ts(d.get("created_at"))
        if t:
            ev = {"type": "land", "at": _iso(t), "_t": t, "text": f"{name} was founded"}
            if owner:
                ev["owner"] = owner
            events.append(ev)

    nations = []
    for r in con.execute("SELECT * FROM lands_nations"):
        d = dict(r)
        name, color = _split_color(d.get("name"))
        nations.append({"id": d["ulid"], "name": name, "tag": d.get("tag") if d.get("tag") not in (None, "None") else None,
                        "color": color, "capital": d.get("capital")})
        t = _ts(d.get("created_at"))
        if t:
            ev = {"type": "nation", "at": _iso(t), "_t": t, "text": f"{name} was formed"}
            owner = owner_by_ulid.get(d.get("capital"))
            if owner:
                ev["owner"] = owner
            events.append(ev)

    try:
        for r in con.execute("SELECT * FROM lands_wars"):
            d = dict(r)
            t = _ts(d.get("started_at") or d.get("created_at"))
            a = _split_color(str(d.get("attacker") or ""))[0]
            b = _split_color(str(d.get("defender") or ""))[0]
            if t and a and b:
                events.append({"type": "war", "at": _iso(t), "_t": t,
                               "text": f"{a} declared war on {b}"})
    except sqlite3.Error:
        pass
    con.close()
    events.sort(key=lambda e: -e["_t"])
    for e in events:
        e.pop("_t", None)
    return lands, nations, events[:20], player_names


def mdi(chunks, members, treasury, activity):
    # Ceilings sized for a 20-50 player server on a Gold economy: a chunk
    # costs 4 G and a nation 100 G, so 1,000 G banked is a rich nation.
    t = min(chunks / 60, 1.0) or 0.001
    p = min(members / 15, 1.0) or 0.001
    w = min(treasury / 1000, 1.0) or 0.001
    a = max(activity, 0.001)
    return {"mdi": round((t * p * w * a) ** 0.25, 3), "territory": round(t, 3),
            "population": round(p, 3), "wealth": round(w, 3), "activity": round(a, 3),
            "chunks": chunks, "members": members, "treasury": round(treasury, 2)}


# --------------------------------------------------------------------------- TNE ledger

_TNE_RE = {
    "time": re.compile(r"^time:\s*(\d+)", re.M),
    "type": re.compile(r"^type:\s*(\S+)", re.M),
    "id": re.compile(r"^\s{2}id:\s*(\S+)", re.M),
    "mod": re.compile(r"^\s+modifier:\s*'?(-?[\d.]+)'?", re.M),
}


def update_ledger(f, profile, ledger, max_files=400):
    """TNE writes one YAML file per Vault transaction. Every plugin that moves
    Gold goes through Vault (shops, Lands claims and upkeep, /pay, vote
    rewards), so this is the complete record of gold changing hands. Files are
    immutable once written, so only unseen ids are fetched and the daily
    aggregates are kept in scripts/state/ledger.json."""
    seen = ledger.setdefault("seen", {})
    days = ledger.setdefault("days", {})
    recent = ledger.setdefault("recent", [])
    listing = ftp_listing(f, f"{profile}/plugins/TheNewEconomy/transactions")
    new = [n for n, _, _ in listing if n.endswith(".yml") and n[:-4] not in seen]
    batch, n_read = [], 0
    for name in sorted(new)[:max_files]:
        try:
            txt = ftp_bytes(f, f"{profile}/plugins/TheNewEconomy/transactions/{name}").decode("utf8", "replace")
        except Exception:
            continue
        seen[name[:-4]] = 1
        n_read += 1
        t = _TNE_RE["time"].search(txt)
        ty = _TNE_RE["type"].search(txt)
        pid = _TNE_RE["id"].search(txt)
        mod = _TNE_RE["mod"].search(txt)
        if t and ty and mod and ty.group(1) in ("take", "give"):
            batch.append((int(t.group(1)) / 1000, pid.group(1) if pid else "", ty.group(1),
                          abs(float(mod.group(1)))))

    # A withdrawal that fails against the item currency is retried by the
    # caller and TNE logs every attempt: one nation founding showed up as 53
    # identical 350 G takes inside a minute, with the holdings unchanged each
    # time. Same player, same direction, same amount within two minutes is
    # counted once. `recent` carries the last day across runs so a burst
    # split by a run boundary is still collapsed.
    horizon = time.time() - 86400
    recent[:] = [r for r in recent if r[0] >= horizon]
    # Retry bursts are also the signature of the 09-12 phantom-deposit exploit
    # (TNE said "took 350" without taking anything, Lands credited it every
    # time), so the collapsed count is kept per burst for the operator report.
    bursts = ledger.setdefault("bursts", [])
    bursts[:] = [b for b in bursts if b[0] >= horizon]
    for ts, pid, ty, amt in sorted(batch):
        if ts < ERA_START_TS:
            continue
        hit = next((r for r in recent if r[1] == pid and r[2] == ty and r[3] == amt and abs(ts - r[0]) <= 120), None)
        if hit:
            b = next((b for b in bursts if b[0] == hit[0] and b[1] == pid and b[2] == ty and b[3] == amt), None)
            if b:
                b[4] += 1
            else:
                bursts.append([hit[0], pid, ty, amt, 2])
            continue
        recent.append([ts, pid, ty, amt])
        day = days.setdefault(day_of(ts), {"spent": 0.0, "received": 0.0, "count": 0, "players": []})
        day["spent" if ty == "take" else "received"] = round(day["spent" if ty == "take" else "received"] + amt, 2)
        day["count"] += 1
        if pid and pid not in day["players"]:
            day["players"].append(pid)
    print(f"ledger: {len(listing)} transactions on server, {n_read} new, {len(new) - n_read} pending")
    return ledger


# --------------------------------------------------------------------------- QuickShop (MySQL)

def _pretty(material):
    return " ".join(w.capitalize() for w in re.sub(r"^minecraft:", "", material).split("_"))


def quickshop(f, profile):
    """Live asking prices (median per item across active selling shops) and the
    purchase log since the Gold era: per-day volume, per-item daily candles."""
    try:
        cfg = ftp_bytes(f, f"{profile}/plugins/QuickShop-Hikari/config.yml").decode("utf8", "replace")
    except ftplib.error_perm:
        return None
    m = re.search(r"^database:\n(.*?)(?=^\S)", cfg, re.M | re.S)
    if not m:
        return None
    block = m.group(1)

    def opt(k):
        r = re.search(rf"^\s+{k}:\s*(\S+)", block, re.M)
        return r.group(1).strip("'\"") if r else None

    if opt("mysql") != "true":
        return None
    try:
        import pymysql
    except ImportError:
        print("pymysql not installed; skipping shop data")
        return None
    prefix = opt("prefix") or "qs_"
    if prefix == "none":
        prefix = ""
    try:
        con = pymysql.connect(host=opt("host"), port=int(opt("port") or 3306), user=opt("user"),
                              password=opt("password"), database=opt("database"), connect_timeout=15)
    except Exception as e:
        print("mysql connect failed:", type(e).__name__)
        return None
    cur = con.cursor()

    # Item id per shop data row, decoded from the gzip+base64 NBT blob. Only
    # plain, fungible items get an id; a stack with real components is a
    # different good from its bare namesake and is left out of pricing.
    item_of = {}
    cur.execute(f"SELECT id, item FROM `{prefix}data`")
    for did, blob in cur.fetchall():
        try:
            it = mcnbt.parse(gzip.decompress(base64.b64decode(blob)))
        except Exception:
            continue
        comps = it.get("components") or {}
        if isinstance(comps, dict) and set(comps) - COSMETIC_COMPONENTS:
            continue
        item_of[did] = it.get("id")

    # Asking prices from shops that actually exist in the world (data rows
    # outlive their shops, so join through the shop map).
    asks, sellers = {}, {}
    cur.execute(f"SELECT d.id, d.price, d.type, d.owner FROM `{prefix}data` d "
                f"JOIN `{prefix}shops` s ON s.data = d.id "
                f"JOIN `{prefix}shop_map` mp ON mp.shop = s.id "
                f"WHERE d.shop_state = 'active' AND d.type = 0")
    for did, price, _, owner in cur.fetchall():
        item = item_of.get(did)
        if not item or item in UNTRACKED or not price:
            continue
        asks.setdefault(item, []).append(float(price))
        sellers.setdefault(item, set()).add(owner)

    # Purchases: money is the total paid, amount the item count.
    per_day, per_item_day, buyers_by_day = {}, {}, {}
    cur.execute(f"SELECT time, data, amount, money, buyer FROM `{prefix}log_purchase` "
                f"WHERE type LIKE 'PURCHASE%%' AND money > 0 AND time >= %s", (ERA_START,))
    for t, did, amount, money, buyer in cur.fetchall():
        day = t.strftime("%Y-%m-%d") if hasattr(t, "strftime") else str(t)[:10]
        money, amount = float(money), int(amount or 0)
        per_day[day] = round(per_day.get(day, 0.0) + money, 2)
        buyers_by_day.setdefault(day, set()).add(buyer)
        try:
            item = item_of.get(int(did))
        except (TypeError, ValueError):
            item = None
        if item and amount and item not in UNTRACKED:
            e = per_item_day.setdefault(item, {}).setdefault(day, {"qty": 0, "value": 0.0, "unit": []})
            e["qty"] += amount
            e["value"] = round(e["value"] + money, 2)
            e["unit"].append(money / amount)
    con.close()

    return {"asks": asks, "sellers": {k: len(v) for k, v in sellers.items()},
            "per_day": per_day, "per_item_day": per_item_day,
            "buyers_by_day": {k: sorted(v) for k, v in buyers_by_day.items()}}


# --------------------------------------------------------------------------- RCON

def _rcon(cmd):
    """One RCON command -> decoded reply text ('' on any failure)."""
    import socket
    import struct

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
    units = {"day": 86400, "hour": 3600, "minute": 60, "second": 1}
    return sum(int(n) * units[u] for n, u in re.findall(r"(\d+)\s*(day|hour|minute|second)s?", txt))


def server_health():
    """TPS + when the server started, from the RCON `uptime` command (CMILib).
    The site computes a live uptime from started_at. {} when RCON isn't set up."""
    if not RCON_PW:
        return {}
    txt = _rcon("uptime")
    if not txt:
        return {}
    out = {"checked": now_iso()}
    m = re.search(r"Uptime:\s*([^\r\n]+)", txt)
    if m:
        secs = _uptime_seconds(m.group(1))
        if secs:
            out["started_at"] = (datetime.datetime.now(UTC) - datetime.timedelta(seconds=secs)
                                 ).strftime("%Y-%m-%dT%H:%M:%SZ")
    m = re.search(r"TPS\s*[=:]\s*([\d.]+)", txt)
    if m:
        out["tps"] = float(m.group(1))
    return out


# --------------------------------------------------------------------------- assembly

def gini(vals):
    v = sorted(x for x in vals if x is not None and x >= 0)
    n = len(v)
    if n < 2 or sum(v) == 0:
        return None
    return round((2 * sum(i * x for i, x in enumerate(v, 1))) / (n * sum(v)) - (n + 1) / n, 3)


def classify(vol_series, traders, span):
    if traders < MIN_TRADERS or span < MIN_DAYS or len(vol_series) < 14:
        return {"code": "INSUFFICIENT_DATA", "label": "Insufficient data",
                "note": f"Gold launched {ERA_START}. Needs {MIN_TRADERS}+ active traders and "
                        f"{MIN_DAYS}+ days of history; currently {traders} traders / {span} days."}
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


def days_between(a, b):
    da = datetime.datetime.strptime(a, "%Y-%m-%d")
    db = datetime.datetime.strptime(b, "%Y-%m-%d")
    return (db - da).days


def main():
    f = ftp_conn()
    profile = detect_profile(f)
    today = datetime.datetime.now(UTC).strftime("%Y-%m-%d")

    world_state = load_state(WORLD_STATE, {})
    ledger = load_state(LEDGER_STATE, {})
    history = load_state(HISTORY_STATE, {"supply": {}, "prices": {}})

    # --- Lands (banks, registry, events)
    try:
        lands, nations, events, lands_names = lands_from_db(fetch_lands_db(f, profile))
    except (ftplib.error_perm, sqlite3.Error) as e:
        print("lands unavailable:", type(e).__name__, e)
        lands, nations, events, lands_names = [], [], [], {}

    # --- Gold in the world
    players = scan_players(f, profile, world_state)
    resolve_names(f, profile, players, lands_names)
    containers, loose, coverage = scan_world(f, profile, world_state)
    save_state(WORLD_STATE, world_state)

    # --- Gold changing hands
    ledger = update_ledger(f, profile, ledger)
    save_state(LEDGER_STATE, ledger)
    shop = quickshop(f, profile)
    f.quit()

    # --- Supply
    on_hand = sum(p["on_hand"] for p in players.values())
    ender = sum(p["ender"] for p in players.values())
    banks = sum(l["bank"] for l in lands)
    total = on_hand + ender + containers + loose + banks
    cov_pct = round(100 * (coverage["fresh"] + coverage["stale"]) / max(coverage["files"], 1), 1)
    supply = {
        "total": round(total, 2),
        "on_hand": on_hand, "ender_chests": ender,
        "containers": containers, "loose": loose,
        "land_banks": round(banks, 2),
        "coverage": dict(coverage, percent=cov_pct),
    }
    # One point per day, the latest run wins. Partial cold caches are recorded
    # with their coverage so the chart can be read honestly.
    history["supply"][today] = {"total": supply["total"], "on_hand": on_hand, "ender": ender,
                                "containers": containers, "loose": loose, "banks": round(banks, 2),
                                "coverage": cov_pct, "at": now_iso()}
    supply_series = [[d, v["total"]] for d, v in sorted(history["supply"].items()) if d >= ERA_START]

    # --- Flow (TNE) and trade (QuickShop)
    flow_days = {d: v for d, v in ledger.get("days", {}).items() if d >= ERA_START}
    flow_series = [[d, v["spent"], v["received"]] for d, v in sorted(flow_days.items())]
    last7 = [d for d in sorted(flow_days) if days_between(d, today) < 7]
    active_traders = len({p for d in last7 for p in flow_days[d]["players"]})
    spent_7d = round(sum(flow_days[d]["spent"] for d in last7), 2)
    received_7d = round(sum(flow_days[d]["received"] for d in last7), 2)

    vol_series = [[d, v] for d, v in sorted((shop or {}).get("per_day", {}).items())]
    trade_7d = round(sum(v for d, v in vol_series if days_between(d, today) < 7), 2)
    span = days_between(ERA_START, today)

    # --- Prices: today's asking prices go into history; series/changes come out.
    # An asking price above all the gold in existence is a joke or a
    # placeholder, not a market, so it is dropped before the median is taken.
    # The floor covers a cold cache that hasn't counted the world yet.
    items = []
    if shop:
        cap = max(supply["total"], 1000)
        asks = {k: [p for p in v if p <= cap] for k, v in shop["asks"].items()}
        asks = {k: v for k, v in asks.items() if v}
        history["prices"].setdefault(today, {})
        for item, vals in asks.items():
            history["prices"][today][item] = round(statistics.median(vals), 2)
        ranked = sorted(asks.items(), key=lambda kv: (-len(kv[1]), kv[0]))[:MAX_TRACKED_ITEMS]
        for item, vals in ranked:
            series = [[d, ph[item]] for d, ph in sorted(history["prices"].items())
                      if item in ph and days_between(d, today) < 30]
            price = round(statistics.median(vals), 2)
            week_ago = next((v for d, v in series if days_between(d, today) <= 7), None)
            change = round((price - week_ago) / week_ago, 4) if week_ago else 0.0
            candles, vol_qty, vol_val = [], 0, 0.0
            for d, e in sorted(shop["per_item_day"].get(item, {}).items()):
                u = e["unit"]
                candles.append({"t": d, "o": round(u[0], 2), "h": round(max(u), 2),
                                "l": round(min(u), 2), "c": round(u[-1], 2), "v": e["qty"]})
                if days_between(d, today) < 1:
                    vol_qty += e["qty"]
                    vol_val += e["value"]
            items.append({"name": _pretty(item), "unit": "each", "price": price,
                          "change_7d": change, "shops": len(vals),
                          "sellers": shop["sellers"].get(item, 0),
                          "series": series, "candles": candles[-30:],
                          "volume_24h_qty": vol_qty, "volume_24h_value": round(vol_val, 2)})
    # Price index: the tracked basket's mean price, base 100 on its first day.
    price_index = {"value": None, "series": [], "note": "Turns on once asking prices have a day of history."}
    if items:
        names = [i["name"] for i in items]
        by_day = {}
        for d, ph in sorted(history["prices"].items()):
            vals = [ph[k] for k in ph if _pretty(k) in names]
            if vals:
                by_day[d] = statistics.mean(vals)
        if len(by_day) >= 2:
            base = next(iter(by_day.values()))
            series = [[d, round(100 * v / base, 1)] for d, v in by_day.items()]
            price_index = {"value": series[-1][1], "series": series,
                           "note": f"Basket of {len(names)} shop items, base 100 on {next(iter(by_day))}."}
    save_state(HISTORY_STATE, history)

    # --- Wealth: gold a player carries (inventory + ender chest). Gold in
    # chests can't be attributed to a person from the world alone.
    held = {p["name"] or uuid[:8]: p["on_hand"] + p["ender"] for uuid, p in players.items()}
    held_vals = list(held.values())

    lands_by_nation = {}
    for l in lands:
        if l.get("nation"):
            lands_by_nation.setdefault(l["nation"], []).append(l)
    nation_rows = []
    for n in nations:
        ls = lands_by_nation.get(n["id"], [])
        nation_rows.append(dict(name=n["name"], tag=n["tag"], color=n.get("color"),
                                lands=len(ls),
                                **mdi(sum(l["chunks"] for l in ls), sum(l["members"] for l in ls),
                                      sum(l["bank"] for l in ls), 1.0 if ls else 0.0)))

    data = {
        "generated": now_iso(),
        "meta": {"players_tracked": len(players), "active_traders": active_traders, "data_days": span,
                 "sufficient": active_traders >= MIN_TRADERS and span >= MIN_DAYS, "demo": False,
                 "profile": profile, "era_start": ERA_START,
                 "thresholds": {"min_traders": MIN_TRADERS, "min_days": MIN_DAYS}},
        "economy": {
            "currency": {"name": "Gold", "symbol": "G", "ingot": 1, "block": 9},
            "classification": classify(vol_series, active_traders, span),
            "supply": supply,
            # Kept for older readers of this file; the same number as supply.total.
            "money_supply_players": supply["total"],
            "money_supply_series": supply_series,
            "flow": {"series": flow_series, "spent_7d": spent_7d, "received_7d": received_7d,
                     "transactions": sum(v["count"] for v in flow_days.values())},
            "trade_volume_series": vol_series,
            "trade_volume_7d": trade_7d,
            "chest_shop_transactions": sum(1 for d in (shop or {}).get("per_item_day", {}).values() for _ in d),
            "gini": gini(held_vals),
            "price_index": price_index,
            "items": items,
        },
        "wealth": {
            "top": sorted(({"name": k, "balance": v} for k, v in held.items()),
                          key=lambda x: -x["balance"])[:15],
            "median": round(statistics.median(held_vals), 2) if held_vals else 0,
            "mean": round(statistics.mean(held_vals), 2) if held_vals else 0,
        },
        "server": server_health(),
        "nations": nation_rows,
        "lands": sorted(({"name": l["name"], "type": l["type"], "chunks": l["chunks"],
                          "members": l["members"], "bank": round(l["bank"], 2), "level": l["level"],
                          "color": l.get("color")}
                         for l in lands), key=lambda x: -x["chunks"]),
        "events": events,
    }
    with open(OUT, "w") as fh:
        json.dump(data, fh, indent=2)
    print("wrote", OUT, "| supply", supply["total"], "G |", f"coverage {cov_pct}%",
          "| players", len(players), "| lands", len(lands), "| nations", len(nation_rows),
          "| MEI", data["economy"]["classification"]["code"])

    # Optionally publish straight to the server's own public webserver
    # (squaremap already serves that directory), so the site can read fresh
    # figures without a commit and a full site rebuild for every change.
    # Best-effort: a failure here must never fail the refresh itself.
    if PUBLISH_PATH:
        remote = PUBLISH_PATH.replace("{profile}", profile)
        try:
            f2 = ftp_conn()
            with open(OUT, "rb") as fh:
                f2.storbinary("STOR /" + remote.strip("/"), fh)
            f2.quit()
            print("published ->", remote)
        except Exception as e:
            print("publish skipped:", type(e).__name__, e)


def write_status(ok, detail=""):
    """Record the outcome next to the data so a failing refresh is diagnosable
    from the repo itself. Never write anything derived from a credential."""
    for secret in (PW, RCON_PW):
        if secret:
            detail = detail.replace(secret, "***")
    detail = detail[:300]
    path = os.path.join(os.path.dirname(OUT), "data-status.json")
    at = now_iso()
    # Keep the old timestamp when nothing about the outcome changed, so an
    # unchanged status doesn't produce a commit on every single run.
    try:
        with open(path) as fh:
            prev = json.load(fh)
        if prev.get("ok") == ok and prev.get("detail") == detail:
            at = prev.get("at", at)
    except Exception:
        pass
    with open(path, "w") as fh:
        json.dump({"ok": ok, "at": at, "credential": os.environ.get("MC_FTP_SOURCE") or "local",
                   "detail": detail}, fh, indent=2)


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        write_status(False, str(e.code) if e.code not in (None, 0) else "")
        raise
    except Exception as e:
        write_status(False, f"{type(e).__name__}: {e}")
        raise
    else:
        write_status(True, "")
