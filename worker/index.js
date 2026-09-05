// Serves the site's static assets, plus one live endpoint.
//
// /api/data.json is fetched from the game server's own public webserver
// (squaremap already serves that directory, and the refresh job uploads there
// directly). Doing that fetch here rather than in the browser makes it
// server-to-server, so the game server needs no CORS header and the browser
// only ever makes a same-origin request. It also takes publishing off the
// critical path: fresh figures no longer need a commit and a site rebuild.
//
// The path deliberately does NOT collide with a static asset. Static assets
// are served before the Worker runs, and the `run_worker_first` option that
// would override that was silently ignored by the deploying wrangler, so a
// Worker route at /data.json never actually executed. A path with no asset
// behind it reaches the Worker without depending on that option at all.
//
// Every failure path falls back to the committed /data.json asset, so a game
// server that is down, slow, or serving nonsense changes nothing a visitor
// sees. This must never be able to make the site worse than the static build.

const LIVE_DATA_URL = "https://map.meridian-mc.net/data.json";
const FALLBACK_PATH = "/data.json";
const EDGE_TTL_SECONDS = 30;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/data.json" && request.method === "GET") {
      const live = await fetchLive();
      if (live) return live;
      // Serve the copy built into the site instead.
      const fallback = await env.ASSETS.fetch(new Request(new URL(FALLBACK_PATH, url), request));
      return new Response(fallback.body, {
        status: fallback.status,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=60",
          "x-meridian-data": "fallback",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};

async function fetchLive() {
  try {
    const res = await fetch(LIVE_DATA_URL, {
      cf: { cacheTtl: EDGE_TTL_SECONDS, cacheEverything: true },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;

    // Only serve it if it parses and looks like our payload. A half-written
    // upload or an error page must never reach the site as data.
    const body = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object" || !parsed.generated) return null;

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": `public, max-age=${EDGE_TTL_SECONDS}`,
        "x-meridian-data": "live",
      },
    });
  } catch {
    return null;
  }
}
