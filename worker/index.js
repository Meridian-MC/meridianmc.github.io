// Serves the site's static assets, with one exception: /data.json is fetched
// live from the game server's own public webserver (squaremap already serves
// that directory, and the refresh job uploads there directly).
//
// Doing the fetch here rather than in the browser means it is server-to-server,
// so no CORS header is needed on the game server and the browser only ever sees
// a same-origin request. It also takes publishing off the critical path: fresh
// figures no longer require a commit and a full site rebuild.
//
// Every failure path falls back to the copy built into the site, so a game
// server that is down, slow, or serving nonsense changes nothing a visitor
// sees. That fallback is the whole safety story here: this Worker must never
// be able to make the site worse than the static build alone.

const LIVE_DATA_URL = "https://map.meridian-mc.net/data.json";
const EDGE_TTL_SECONDS = 30;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/data.json" && request.method === "GET") {
      const live = await fetchLive(ctx);
      if (live) return live;
      // fall through to the committed copy
    }

    return env.ASSETS.fetch(request);
  },
};

async function fetchLive(ctx) {
  try {
    // Cache at the edge briefly so a burst of visitors doesn't turn into a
    // burst of requests against the game server.
    const res = await fetch(LIVE_DATA_URL, {
      cf: { cacheTtl: EDGE_TTL_SECONDS, cacheEverything: true },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;

    // Only serve it if it is actually parseable JSON with the shape we expect.
    // A half-written upload or an error page must not reach the site as data.
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
