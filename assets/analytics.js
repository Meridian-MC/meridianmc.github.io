// Meridian analytics — reads /data.json (regenerated from the live server) and
// renders the economy dashboard and the nation registry. No dependencies.

(function () {
  var root = document.querySelector("[data-analytics]");
  if (!root) return;

  fetch("/data.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("no data"); return r.json(); })
    .then(render)
    .catch(function () {
      root.querySelectorAll("[data-slot]").forEach(function (el) {
        el.innerHTML = '<p class="c-empty">Data unavailable right now.</p>';
      });
    });

  function fmtMoney(n) {
    if (n == null) return "—";
    var neg = n < 0; n = Math.abs(n);
    var s;
    if (n >= 1e9) s = (n / 1e9).toFixed(2) + "B";
    else if (n >= 1e6) s = (n / 1e6).toFixed(2) + "M";
    else if (n >= 1e3) s = (n / 1e3).toFixed(1) + "k";
    else s = n.toFixed(0);
    return (neg ? "-$" : "$") + s;
  }
  function fmtInt(n) { return n == null ? "—" : n.toLocaleString(); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function lineChart(series, opts) {
    opts = opts || {};
    var W = 640, H = 160, pad = { t: 8, r: 8, b: 20, l: 8 };
    if (!series || series.length < 2) {
      return '<div class="c-empty">' + (opts.empty || "Not enough history yet.") + "</div>";
    }
    var vals = series.map(function (d) { return d[1]; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { max = min + 1; }
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    var x = function (i) { return pad.l + (i / (series.length - 1)) * iw; };
    var y = function (v) { return pad.t + ih - ((v - min) / (max - min)) * ih; };
    var line = series.map(function (d, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(d[1]).toFixed(1); }).join(" ");
    var area = line + " L" + x(series.length - 1).toFixed(1) + " " + (pad.t + ih) + " L" + pad.l + " " + (pad.t + ih) + " Z";
    var first = series[0][0].slice(5), last = series[series.length - 1][0].slice(5);
    return '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img">' +
      '<line class="gridline" x1="' + pad.l + '" y1="' + (pad.t + ih) + '" x2="' + (W - pad.r) + '" y2="' + (pad.t + ih) + '"/>' +
      '<path class="series-area" d="' + area + '"/>' +
      '<path class="series-line" d="' + line + '"/>' +
      '<text class="tick" x="' + pad.l + '" y="' + (H - 6) + '">' + first + "</text>" +
      '<text class="tick" x="' + (W - pad.r) + '" y="' + (H - 6) + '" text-anchor="end">' + last + "</text>" +
      "</svg>";
  }

  function barChart(series, opts) {
    opts = opts || {};
    var W = 640, H = 160, pad = { t: 8, r: 8, b: 20, l: 8 };
    if (!series || !series.length) {
      return '<div class="c-empty">' + (opts.empty || "No activity recorded yet.") + "</div>";
    }
    var vals = series.map(function (d) { return d[1]; });
    var max = Math.max.apply(null, vals) || 1;
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    var bw = iw / series.length;
    var bars = series.map(function (d, i) {
      var h = (d[1] / max) * ih;
      return '<rect class="bar" x="' + (pad.l + i * bw + bw * 0.15).toFixed(1) + '" y="' + (pad.t + ih - h).toFixed(1) +
        '" width="' + (bw * 0.7).toFixed(1) + '" height="' + Math.max(h, 0).toFixed(1) + '"/>';
    }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img">' +
      '<line class="gridline" x1="' + pad.l + '" y1="' + (pad.t + ih) + '" x2="' + (W - pad.r) + '" y2="' + (pad.t + ih) + '"/>' +
      bars +
      '<text class="tick" x="' + pad.l + '" y="' + (H - 6) + '">' + series[0][0].slice(5) + "</text>" +
      '<text class="tick" x="' + (W - pad.r) + '" y="' + (H - 6) + '" text-anchor="end">' + series[series.length - 1][0].slice(5) + "</text>" +
      "</svg>";
  }

  function idxBars(n) {
    var parts = [
      ["Territory", n.territory], ["Population", n.population],
      ["Wealth", n.wealth], ["Activity", n.activity],
    ];
    return '<div class="idx-bars">' + parts.map(function (p) {
      return '<div class="idx-bar"><span>' + p[0] + '</span>' +
        '<span class="track"><span class="fill" style="width:' + Math.round(p[1] * 100) + '%"></span></span></div>';
    }).join("") + "</div>";
  }

  function render(d) {
    var stamp = root.querySelector("[data-stamp]");
    if (stamp) stamp.textContent = "Live data · generated " + d.generated.replace("T", " ").replace("Z", " UTC");

    // ---- economy ----
    var mei = root.querySelector("[data-slot=mei]");
    if (mei && d.economy) {
      var c = d.economy.classification;
      mei.setAttribute("data-code", c.code);
      mei.innerHTML = '<span class="dot"></span><span class="mei-label">' + c.label +
        '</span><span class="mei-note">' + c.note + "</span>";
    }
    var stats = root.querySelector("[data-slot=econ-stats]");
    if (stats && d.economy) {
      var e = d.economy, m = d.meta, w = d.wealth;
      stats.innerHTML = "";
      [
        ["s-money", fmtMoney(e.money_supply_players), "Player money supply", "excludes staff grants"],
        ["s-vol", fmtMoney(e.trade_volume_7d), "Trade volume, 7d", "player-to-player + shops"],
        ["s-gini", e.gini == null ? "—" : e.gini.toFixed(2), "Wealth Gini", "0 = equal, 1 = concentrated"],
        ["s-med", fmtMoney(w.median), "Median balance", "typical player"],
        ["s-shop", fmtInt(e.server_shop_transactions), "Server-shop buys", "all time"],
        ["s-players", fmtInt(m.players_tracked), "Players tracked", m.active_traders + " trading"],
      ].forEach(function (row) {
        stats.appendChild(el("div", "stat",
          '<div class="s-val">' + row[1] + '</div><div class="s-lab">' + row[2] + '</div><div class="s-sub">' + row[3] + "</div>"));
      });
    }
    var sup = root.querySelector("[data-slot=supply-chart]");
    if (sup) sup.innerHTML = lineChart(d.economy.money_supply_series, { empty: "Money supply history starts once players trade." });
    var vol = root.querySelector("[data-slot=volume-chart]");
    if (vol) vol.innerHTML = barChart(d.economy.trade_volume_series, { empty: "No trade recorded yet." });

    var wt = root.querySelector("[data-slot=wealth-table]");
    if (wt) {
      if (!d.wealth.top.length) { wt.innerHTML = '<p class="c-empty">No player balances yet.</p>'; }
      else {
        wt.innerHTML = '<div class="dtable-wrap"><table class="dtable"><thead><tr><th class="rank">#</th><th>Player</th><th style="text-align:right">Balance</th></tr></thead><tbody>' +
          d.wealth.top.map(function (p, i) {
            return "<tr><td class=\"rank\">" + (i + 1) + "</td><td>" + escapeHtml(p.name) + '</td><td class="num">' + fmtMoney(p.balance) + "</td></tr>";
          }).join("") + "</tbody></table></div>";
      }
    }

    // ---- nations ----
    var nt = root.querySelector("[data-slot=nation-table]");
    if (nt) {
      var ns = (d.nations || []).slice().sort(function (a, b) { return b.mdi - a.mdi; });
      if (!ns.length) { nt.innerHTML = '<p class="c-empty">No nations founded yet.</p>'; }
      else {
        nt.innerHTML = '<div class="dtable-wrap"><table class="dtable"><thead><tr><th class="rank">#</th><th>Nation</th><th>MDI</th><th>Sub-indices</th><th style="text-align:right">Chunks</th><th style="text-align:right">Members</th><th style="text-align:right">Treasury</th></tr></thead><tbody>' +
          ns.map(function (n, i) {
            return "<tr><td class=\"rank\">" + (i + 1) + "</td><td>" + escapeHtml(n.name || "—") +
              '</td><td><span class="mdi-score">' + n.mdi.toFixed(3) + "</span></td><td>" + idxBars(n) +
              '</td><td class="num">' + fmtInt(n.chunks) + '</td><td class="num">' + fmtInt(n.members) +
              '</td><td class="num">' + fmtMoney(n.treasury) + "</td></tr>";
          }).join("") + "</tbody></table></div>";
      }
    }
    var lt = root.querySelector("[data-slot=land-table]");
    if (lt) {
      var ls = d.lands || [];
      if (!ls.length) { lt.innerHTML = '<p class="c-empty">No lands claimed yet.</p>'; }
      else {
        lt.innerHTML = '<div class="dtable-wrap"><table class="dtable"><thead><tr><th>Land</th><th>Tier</th><th style="text-align:right">Chunks</th><th style="text-align:right">Members</th><th style="text-align:right">Bank</th></tr></thead><tbody>' +
          ls.map(function (l) {
            return "<tr><td>" + escapeHtml(l.name || "—") + "</td><td>" + escapeHtml(String(l.type || "").toLowerCase() || "—") +
              '</td><td class="num">' + fmtInt(l.chunks) + '</td><td class="num">' + fmtInt(l.members) +
              '</td><td class="num">' + fmtMoney(l.bank) + "</td></tr>";
          }).join("") + "</tbody></table></div>";
      }
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
})();
