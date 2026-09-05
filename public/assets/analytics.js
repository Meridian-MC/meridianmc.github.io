// Meridian analytics. Reads /data.json (rebuilt from the live server) and renders
// the economy dashboard and the nation registry. No dependencies.

(function () {
  // The ticker lives in the site header on every page; the rest of this file
  // (MEI, charts, tables, nation registry) only renders where [data-analytics]
  // exists (economy.astro, lands.astro).
  var root = document.querySelector("[data-analytics]");

  // Try each configured source in turn, newest-first, and fall back to the
  // copy committed alongside the site if the live one can't be reached.
  function fetchData(urls, i) {
    i = i || 0;
    if (i >= urls.length) return Promise.reject(new Error("no source"));
    return fetch(urls[i], { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () { return fetchData(urls, i + 1); });
  }

  fetchData(window.MERIDIAN_DATA_URLS || ["/data.json"])
    .then(render)
    .catch(function () {
      document.querySelectorAll("[data-slot]").forEach(function (el) {
        if (el.matches("[data-slot=ticker]")) { el.innerHTML = ""; return; }
        el.innerHTML = '<p class="c-empty">Live data is unavailable right now.</p>';
      });
    });

  var MEI_ORDER = ["RECESSION", "COOLING", "STEADY", "EXPANSION"];

  function money(n) {
    if (n == null) return "n/a";
    var s = n < 0 ? "-$" : "$"; n = Math.abs(n);
    if (n >= 1e9) return s + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return s + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return s + (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + "k";
    return s + n.toFixed(0);
  }
  function intf(n) { return n == null ? "n/a" : Number(n).toLocaleString(); }
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
      range: '<span>' + series[0][0].slice(5) + ": " + fmt(min) + '</span><span>' +
        series[series.length - 1][0].slice(5) + ": " + fmt(max) + "</span>",
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

  // ---- price ticker (scrolling strip) ----
  function renderTicker(el, items) {
    if (!el) return;
    if (!items || !items.length) { el.innerHTML = ""; return; }
    var row = items.map(function (x) {
      var dir = x.change_7d > 0.005 ? "up" : x.change_7d < -0.005 ? "down" : "flat";
      var sign = x.change_7d > 0 ? "+" : "";
      return '<span class="ticker-item ' + dir + '">' + esc(x.name) + " " +
        '<b>' + money(x.price) + "</b> " +
        '<span class="ticker-chg">' + sign + (x.change_7d * 100).toFixed(1) + "%</span></span>" +
        '<span class="ticker-sep" aria-hidden="true">&bull;</span>';
    }).join("");
    el.innerHTML = '<div class="ticker-track">' + row + row + "</div>";
  }

  // ---- candlestick chart ----
  function candleSvg(candles) {
    var W = 720, H = 240, padT = 12, padB = 12;
    var n = candles.length;
    var highs = candles.map(function (c) { return c.h; });
    var lows = candles.map(function (c) { return c.l; });
    var max = Math.max.apply(null, highs), min = Math.min.apply(null, lows);
    if (max === min) { max += 1; min -= 1; }
    var pad = (max - min) * 0.1; max += pad; min -= pad;
    var innerH = H - padT - padB;
    var y = function (v) { return padT + innerH * (1 - (v - min) / (max - min)); };
    var slot = W / n;
    var bw = Math.max(2, Math.min(16, slot * 0.56));
    var grid = [0.25, 0.5, 0.75].map(function (f) {
      var yy = (padT + innerH * f).toFixed(1);
      return '<line class="gridline" x1="0" y1="' + yy + '" x2="' + W + '" y2="' + yy + '"/>';
    }).join("");
    var bars = candles.map(function (c, i) {
      var cx = slot * (i + 0.5);
      var up = c.c >= c.o;
      var bodyTop = y(Math.max(c.o, c.c)), bodyBot = y(Math.min(c.o, c.c));
      var bodyH = Math.max(1.2, bodyBot - bodyTop);
      var cls = up ? "up" : "down";
      return '<line class="candle-wick ' + cls + '" x1="' + cx.toFixed(1) + '" x2="' + cx.toFixed(1) +
        '" y1="' + y(c.h).toFixed(1) + '" y2="' + y(c.l).toFixed(1) + '"/>' +
        '<rect class="candle-body ' + cls + '" x="' + (cx - bw / 2).toFixed(1) + '" y="' + bodyTop.toFixed(1) +
        '" width="' + bw.toFixed(1) + '" height="' + bodyH.toFixed(1) + '"></rect>';
    }).join("");
    return { svg: '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' + grid + bars + "</svg>",
             hi: max - pad, lo: min + pad };
  }

  function initCandles(root2, items) {
    var el = root2.querySelector("[data-slot=candles]");
    if (!el) return;
    var withCandles = (items || []).filter(function (x) { return x.candles && x.candles.length; });
    if (!withCandles.length) {
      el.innerHTML = '<p class="c-empty">Candles appear once shop sales are being logged.</p>';
      return;
    }
    var WINDOWS = { "24H": 2, "7D": 7, "30D": 30 };
    var state = { item: withCandles[0], win: "7D" };

    el.innerHTML =
      '<div class="candle-head">' +
        '<div class="candle-picker" data-picker></div>' +
        '<div class="candle-tabs" data-tabs>' +
          Object.keys(WINDOWS).map(function (k) {
            return '<button type="button" class="ctab' + (k === state.win ? " on" : "") + '" data-win="' + k + '">' + k + "</button>";
          }).join("") +
        "</div>" +
      "</div>" +
      '<div class="candle-plot" data-plot></div>' +
      '<div class="candle-range" data-range></div>';

    var pickerEl = el.querySelector("[data-picker]");
    pickerEl.innerHTML = withCandles.map(function (x, i) {
      return '<button type="button" class="cpick' + (i === 0 ? " on" : "") + '" data-name="' + esc(x.name) + '">' + esc(x.name) + "</button>";
    }).join("");

    function draw() {
      var n = WINDOWS[state.win];
      var candles = state.item.candles.slice(-n);
      var chart = candleSvg(candles);
      el.querySelector("[data-plot]").innerHTML = chart.svg;
      var dir = state.item.change_7d > 0.005 ? "up" : state.item.change_7d < -0.005 ? "down" : "flat";
      var sign = state.item.change_7d > 0 ? "+" : "";
      el.querySelector("[data-range]").innerHTML =
        '<span>' + candles[0].t + " &ndash; " + candles[candles.length - 1].t + "</span>" +
        '<span class="candle-hilo">H ' + money(chart.hi) + " &middot; L " + money(chart.lo) + "</span>" +
        '<span class="ticker-chg ' + dir + '">' + sign + (state.item.change_7d * 100).toFixed(1) + "% / 7d</span>";
    }

    pickerEl.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".cpick");
      if (!btn) return;
      pickerEl.querySelectorAll(".cpick").forEach(function (b) { b.classList.toggle("on", b === btn); });
      state.item = withCandles.filter(function (x) { return x.name === btn.getAttribute("data-name"); })[0];
      draw();
    });
    el.querySelector("[data-tabs]").addEventListener("click", function (ev) {
      var btn = ev.target.closest(".ctab");
      if (!btn) return;
      el.querySelectorAll(".ctab").forEach(function (b) { b.classList.toggle("on", b === btn); });
      state.win = btn.getAttribute("data-win");
      draw();
    });
    draw();
  }

  // ---- volume leaders ----
  function renderVolume(el, items) {
    if (!el) return;
    var top = (items || []).filter(function (x) { return x.volume_24h_value; })
      .slice().sort(function (a, b) { return b.volume_24h_value - a.volume_24h_value; }).slice(0, 8);
    if (!top.length) { el.innerHTML = '<p class="c-empty">No trade volume recorded yet.</p>'; return; }
    el.innerHTML = '<div class="dtable-wrap"><table class="dtable"><thead><tr><th>Item</th><th style="text-align:right">Qty, 24h</th><th style="text-align:right">Value, 24h</th></tr></thead><tbody>' +
      top.map(function (x) {
        return "<tr><td>" + esc(x.name) + '</td><td class="num">' + intf(x.volume_24h_qty) +
          '</td><td class="num">' + money(x.volume_24h_value) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function avatar(name) {
    return '<img class="p-avatar" src="https://mc-heads.net/avatar/' + encodeURIComponent(name) + '/24" alt="" width="24" height="24" loading="lazy">';
  }

  function relTime(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return "";
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 90) return "just now";
    var m = Math.round(s / 60); if (m < 60) return m + "m ago";
    var h = Math.round(m / 60); if (h < 48) return h + "h ago";
    return Math.round(h / 24) + "d ago";
  }

  var EVENT_LABEL = { nation: "Nation", land: "Land", war: "War" };

  // Homepage "server pulse": lands/nations counts + a recent-events feed.
  // Independent of [data-analytics], since the homepage has no dashboard root.
  function renderPulse(d) {
    var statsEl = document.querySelector("[data-slot=pulse-stats]");
    if (statsEl) {
      var lands = d.lands || [], nations = d.nations || [];
      var chunks = lands.reduce(function (s, l) { return s + (l.chunks || 0); }, 0);
      var joined = (d.meta && d.meta.players_tracked) || 0;
      statsEl.innerHTML =
        tile(intf(lands.length), "Lands founded") +
        tile(intf(nations.length), "Nations formed") +
        tile(intf(chunks), "Chunks claimed") +
        tile(intf(joined), "Unique players");
    }
    var feedEl = document.querySelector("[data-slot=pulse-feed]");
    if (feedEl) {
      var events = d.events || [];
      feedEl.innerHTML = !events.length ? '<p class="c-empty">No events yet, check back once the server is live.</p>' :
        events.slice(0, 6).map(function (ev) {
          var label = EVENT_LABEL[ev.type] || ev.type;
          return '<div class="pulse-row pulse-' + esc(ev.type) + '"><span class="pulse-tag">' + esc(label) +
            '</span><span class="pulse-text">' + esc(ev.text) + '</span><span class="pulse-time">' + relTime(ev.at) + "</span></div>";
        }).join("");
    }
  }

  function render(d) {
    renderPulse(d);
    // Header ticker: every page, independent of the [data-analytics] root.
    if (d.economy && d.economy.items) {
      renderTicker(document.querySelector("[data-slot=ticker]"), d.economy.items);
    }
    if (!root) return;

    // Freshness. The page stays clean while the feed is healthy and says so
    // plainly when it isn't, so a broken refresh job can't quietly serve
    // month-old figures as if they were live.
    var staleBox = document.querySelector("[data-stale]");
    if (staleBox && d.generated) {
      var ageHours = (Date.now() - Date.parse(d.generated)) / 3600000;
      if (d.meta && d.meta.demo) {
        staleBox.textContent = "Sample data, not live server figures.";
        staleBox.hidden = false;
      } else if (ageHours > 3) {
        staleBox.textContent =
          "These figures last refreshed " + relTime(d.generated) + ". The live feed looks interrupted.";
        staleBox.hidden = false;
      }
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
          tile(money(e.trade_volume_7d), "Trade volume, 7 days", "player + shop") +
          tile(e.gini == null ? "n/a" : e.gini.toFixed(2), "Wealth Gini", "0 is equal, 1 is concentrated") +
          tile(e.price_index && e.price_index.value != null ? e.price_index.value.toFixed(1) : "n/a", "Price index", "base 100 at launch") +
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
            return '<tr><td class="rank">' + (i + 1) + '</td><td class="p-cell">' + avatar(p.name) + " " + esc(p.name) +
              '</td><td class="num">' + money(p.balance) + "</td></tr>";
          }).join("") + "</tbody></table></div>";
      }

      renderVolume(root.querySelector("[data-slot=volume-table]"), e.items);
      initCandles(root, e.items);
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
          var style = /^#[0-9a-f]{6}$/i.test(n.color || "") ? ' style="--p:' + n.color + '"' : "";
          return '<div class="ncard' + (i === 0 ? " ncard-top" : "") + '"' + style + '>' +
            (i === 0 ? '<span class="n-crown">Top nation</span>' : "") +
            '<div class="n-top"><span class="n-name">' + esc(n.name || "Unnamed") +
            '</span><span class="n-rank">#' + (i + 1) + '</span></div>' +
            '<div class="n-mdi">' + n.mdi.toFixed(3) + '</div><div class="n-mdi-lab">Development index</div>' +
            '<div class="n-facts"><span><b>' + intf(n.chunks) + "</b> chunks</span><span><b>" + intf(n.members) +
            "</b> members</span><span><b>" + money(n.treasury) + "</b> treasury</span><span><b>" +
            money(n.members ? n.treasury / n.members : 0) + "</b> / capita</span></div>" + bars + "</div>";
        }).join("");
    }
    var lt = root.querySelector("[data-slot=land-table]");
    if (lt) {
      var ls = d.lands || [];
      lt.innerHTML = !ls.length ? '<p class="c-empty">No lands claimed yet.</p>' :
        '<div class="dtable-wrap"><table class="dtable"><thead><tr><th>Land</th><th>Tier</th><th style="text-align:right">Chunks</th><th style="text-align:right">Members</th><th style="text-align:right">Bank</th></tr></thead><tbody>' +
        ls.map(function (l) {
          return "<tr><td>" + esc(l.name || "Unnamed") + "</td><td>" + esc(String(l.type || "n/a").toLowerCase()) +
            '</td><td class="num">' + intf(l.chunks) + '</td><td class="num">' + intf(l.members) +
            '</td><td class="num">' + money(l.bank) + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }
  }
})();
