// Meridian analytics — reads /data.json (rebuilt from the live server) and renders
// the economy dashboard and the nation registry. No dependencies.

(function () {
  var root = document.querySelector("[data-analytics]");
  if (!root) return;

  fetch("/data.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(render)
    .catch(function () {
      root.querySelectorAll("[data-slot]").forEach(function (el) {
        el.innerHTML = '<p class="c-empty">Live data is unavailable right now.</p>';
      });
    });

  var MEI_ORDER = ["RECESSION", "COOLING", "STEADY", "EXPANSION"];

  function money(n) {
    if (n == null) return "—";
    var s = n < 0 ? "-$" : "$"; n = Math.abs(n);
    if (n >= 1e9) return s + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return s + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return s + (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + "k";
    return s + n.toFixed(0);
  }
  function intf(n) { return n == null ? "—" : Number(n).toLocaleString(); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function tile(val, lab, sub) {
    return '<div class="stat"><div class="s-val">' + val + '</div><div class="s-lab">' +
      lab + '</div><div class="s-sub">' + (sub || "") + "</div></div>";
  }

  function lineChart(series, fmt) {
    if (!series || series.length < 2) return null;
    var W = 600, H = 150, p = 6;
    var vals = series.map(function (d) { return d[1]; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) max = min + 1;
    var x = function (i) { return p + (i / (series.length - 1)) * (W - 2 * p); };
    var y = function (v) { return p + (H - 2 * p) * (1 - (v - min) / (max - min)); };
    var d = series.map(function (s, i) { return (i ? "L" : "M") + x(i).toFixed(1) + "," + y(s[1]).toFixed(1); }).join("");
    var grid = [0.5].map(function (f) {
      var yy = (p + (H - 2 * p) * f).toFixed(1);
      return '<line class="gridline" x1="' + p + '" y1="' + yy + '" x2="' + (W - p) + '" y2="' + yy + '"/>';
    }).join("");
    return {
      svg: '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' + grid +
        '<line class="gridline" x1="' + p + '" y1="' + (H - p) + '" x2="' + (W - p) + '" y2="' + (H - p) + '"/>' +
        '<path class="series-area" d="' + d + "L" + x(series.length - 1).toFixed(1) + "," + (H - p) + "L" + p + "," + (H - p) + 'Z"/>' +
        '<path class="series-line" d="' + d + '"/></svg>',
      range: '<span>' + series[0][0].slice(5) + " · " + fmt(min) + '</span><span>' +
        series[series.length - 1][0].slice(5) + " · " + fmt(max) + "</span>",
    };
  }

  function barChart(series, fmt) {
    if (!series || !series.length) return null;
    var W = 600, H = 150, p = 6;
    var vals = series.map(function (d) { return d[1]; });
    var max = Math.max.apply(null, vals) || 1;
    var bw = (W - 2 * p) / series.length;
    var bars = series.map(function (s, i) {
      var h = (s[1] / max) * (H - 2 * p);
      return '<rect class="bar" x="' + (p + i * bw + bw * 0.12).toFixed(1) + '" y="' + (H - p - h).toFixed(1) +
        '" width="' + (bw * 0.76).toFixed(1) + '" height="' + Math.max(h, 0.5).toFixed(1) + '"/>';
    }).join("");
    return {
      svg: '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' +
        '<line class="gridline" x1="' + p + '" y1="' + (H - p) + '" x2="' + (W - p) + '" y2="' + (H - p) + '"/>' +
        bars + "</svg>",
      range: '<span>' + series[0][0].slice(5) + '</span><span>peak ' + fmt(max) + "</span>",
    };
  }

  function sparkline(series) {
    if (!series || series.length < 2) return "";
    var W = 96, H = 26, p = 2;
    var v = series.map(function (d) { return d[1]; });
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v);
    if (mn === mx) mx = mn + 1;
    var d = series.map(function (s, i) {
      var x = p + (i / (series.length - 1)) * (W - 2 * p);
      var y = p + (H - 2 * p) * (1 - (s[1] - mn) / (mx - mn));
      return (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
    }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none"><path d="' + d + '"/></svg>';
  }

  function fillChart(slot, chart, emptyMsg) {
    var el = root.querySelector("[data-slot=" + slot + "]");
    if (!el) return;
    if (!chart) { el.innerHTML = '<div class="c-empty">' + emptyMsg + "</div>"; return; }
    el.innerHTML = '<div class="c-plot">' + chart.svg + '</div><div class="c-range">' + chart.range + "</div>";
  }

  function render(d) {
    var stamp = document.querySelector("[data-stamp]");
    if (stamp) {
      stamp.textContent = "Rebuilt from the live server · " + d.generated.replace("T", " ").replace("Z", " UTC");
      if (d.meta && d.meta.demo) stamp.insertAdjacentHTML("afterend", '<span class="demo-flag">sample data</span>');
    }

    // ---- economy ----
    if (d.economy) {
      var e = d.economy, m = d.meta, w = d.wealth;
      var mei = root.querySelector("[data-slot=mei]");
      if (mei) {
        var c = e.classification;
        var idx = MEI_ORDER.indexOf(c.code);
        mei.setAttribute("data-code", c.code);
        var gauge = "";
        if (idx >= 0) {
          var pct = ((idx + 0.5) / MEI_ORDER.length) * 100;
          gauge =
            '<div class="mei-gauge">' +
              '<div class="mei-gauge-track"><span class="mei-gauge-marker" style="left:' + pct.toFixed(1) + '%"></span></div>' +
              '<div class="mei-gauge-labels">' + MEI_ORDER.map(function (k) {
                var name = k.charAt(0) + k.slice(1).toLowerCase();
                return '<span' + (k === c.code ? ' class="on"' : "") + ">" + name + "</span>";
              }).join("") +
              "</div>" +
            "</div>";
        }
        mei.innerHTML =
          '<div class="mei-top"><span class="mei-label">' + esc(c.label) + '</span>' +
          '<span class="mei-note">' + esc(c.note) + "</span></div>" + gauge;
      }
      var stats = root.querySelector("[data-slot=econ-stats]");
      if (stats) {
        stats.innerHTML =
          tile(money(e.money_supply_players), "Player money supply", "all players") +
          tile(money(e.trade_volume_7d), "Trade volume · 7d", "player + shop") +
          tile(e.gini == null ? "—" : e.gini.toFixed(2), "Wealth Gini", "0 equal · 1 concentrated") +
          tile(e.price_index && e.price_index.value != null ? e.price_index.value.toFixed(1) : "—", "Price index", "base 100 at launch") +
          tile(money(w.median), "Median balance", "typical player") +
          tile(intf(m.players_tracked), "Players tracked", m.active_traders + " trading");
      }
      fillChart("supply-chart", lineChart(e.money_supply_series, money), "Starts once players trade.");
      fillChart("price-chart", lineChart(e.price_index && e.price_index.series, function (v) { return v.toFixed(0); }),
        (e.price_index && e.price_index.note) || "Needs shop price history.");
      fillChart("volume-chart", barChart(e.trade_volume_series, money), "No trade recorded yet.");

      var it = root.querySelector("[data-slot=item-table]");
      if (it) {
        var items = e.items || [];
        if (!items.length) {
          it.innerHTML = '<p class="c-empty">Item prices appear once chest-shop sales are being logged.</p>';
        } else {
          it.innerHTML = '<div class="itable-wrap"><table class="itable"><thead><tr>' +
            '<th>Item</th><th style="text-align:right">Median price</th><th style="text-align:right">7d</th><th>30-day trend</th><th style="text-align:right">Shops</th>' +
            "</tr></thead><tbody>" +
            items.map(function (x) {
              var dir = x.change_7d > 0.005 ? "up" : x.change_7d < -0.005 ? "down" : "flat";
              var arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "·";
              return "<tr><td class=\"i-name\">" + esc(x.name) + '<span class="i-unit">/ ' + esc(x.unit) + "</span></td>" +
                '<td class="i-price">' + money(x.price) + "</td>" +
                '<td class="i-chg ' + dir + '">' + arrow + " " + Math.abs(x.change_7d * 100).toFixed(1) + "%</td>" +
                '<td class="i-spark ' + dir + '">' + sparkline(x.series) + "</td>" +
                '<td class="i-shops">' + intf(x.shops) + "</td></tr>";
            }).join("") + "</tbody></table></div>";
        }
      }

      var wt = root.querySelector("[data-slot=wealth-table]");
      if (wt) {
        wt.innerHTML = !w.top.length ? '<p class="c-empty">No player balances yet.</p>' :
          '<div class="dtable-wrap"><table class="dtable"><thead><tr><th class="rank">#</th><th>Player</th><th style="text-align:right">Balance</th></tr></thead><tbody>' +
          w.top.map(function (p, i) {
            return '<tr><td class="rank">' + (i + 1) + "</td><td>" + esc(p.name) + '</td><td class="num">' + money(p.balance) + "</td></tr>";
          }).join("") + "</tbody></table></div>";
      }
    }

    // ---- nations ----
    var ng = root.querySelector("[data-slot=nation-grid]");
    if (ng) {
      var ns = (d.nations || []).slice().sort(function (a, b) { return b.mdi - a.mdi; });
      ng.innerHTML = !ns.length ? '<p class="c-empty">No nations founded yet.</p>' :
        ns.map(function (n, i) {
          var bars = [["Territory", n.territory], ["Population", n.population], ["Wealth", n.wealth], ["Activity", n.activity]]
            .map(function (b) {
              return '<div class="idx-bar"><span>' + b[0] + '</span><span class="track"><span class="fill" style="width:' +
                Math.round(b[1] * 100) + '%"></span></span><span class="v">' + b[1].toFixed(2) + "</span></div>";
            }).join("");
          return '<div class="ncard"><div class="n-top"><span class="n-name">' + esc(n.name || "—") +
            '</span><span class="n-rank">#' + (i + 1) + '</span></div>' +
            '<div class="n-mdi">' + n.mdi.toFixed(3) + '</div><div class="n-mdi-lab">Development index</div>' +
            '<div class="n-facts"><span><b>' + intf(n.chunks) + "</b> chunks</span><span><b>" + intf(n.members) +
            "</b> members</span><span><b>" + money(n.treasury) + "</b></span></div>" + bars + "</div>";
        }).join("");
    }
    var lt = root.querySelector("[data-slot=land-table]");
    if (lt) {
      var ls = d.lands || [];
      lt.innerHTML = !ls.length ? '<p class="c-empty">No lands claimed yet.</p>' :
        '<div class="dtable-wrap"><table class="dtable"><thead><tr><th>Land</th><th>Tier</th><th style="text-align:right">Chunks</th><th style="text-align:right">Members</th><th style="text-align:right">Bank</th></tr></thead><tbody>' +
        ls.map(function (l) {
          return "<tr><td>" + esc(l.name || "—") + "</td><td>" + esc(String(l.type || "—").toLowerCase()) +
            '</td><td class="num">' + intf(l.chunks) + '</td><td class="num">' + intf(l.members) +
            '</td><td class="num">' + money(l.bank) + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }
  }
})();
