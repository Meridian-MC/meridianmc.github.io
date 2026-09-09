import { useEffect, useState } from "react";

/**
 * Live server state, rendered as an inline strip inside the hero console.
 *
 * Three sources, tried in order, because each knows something the others do not:
 *   1. mcsrvstat.us: player count, straight from the server list ping.
 *   2. mcstatus.io: same data, different provider. One of them is usually up.
 *
 * A failed ping degrades to "Status unavailable" rather than an empty strip.
 */

type Status = "loading" | "online" | "offline" | "unavailable";

interface State {
  status: Status;
  online: number | null;
  max: number | null;
}

interface Ping {
  online: number | null;
  max: number | null;
  offline: boolean;
}

const ADDRESS = "meridian-mc.net";
const REFRESH_MS = 60_000;

async function pingMcSrvStat(signal: AbortSignal): Promise<Ping> {
  const r = await fetch(`https://api.mcsrvstat.us/3/${ADDRESS}`, { signal, cache: "no-store" });
  if (!r.ok) throw new Error(`mcsrvstat ${r.status}`);
  const d = await r.json();
  if (!d?.online) return { online: null, max: null, offline: true };
  return { online: d.players?.online ?? 0, max: d.players?.max ?? 0, offline: false };
}

async function pingMcStatusIo(signal: AbortSignal): Promise<Ping> {
  const r = await fetch(`https://api.mcstatus.io/v2/status/java/${ADDRESS}`, { signal, cache: "no-store" });
  if (!r.ok) throw new Error(`mcstatus ${r.status}`);
  const d = await r.json();
  if (!d?.online) return { online: null, max: null, offline: true };
  return { online: d.players?.online ?? 0, max: d.players?.max ?? 0, offline: false };
}

export default function ServerStatus() {
  const [s, setS] = useState<State>({ status: "loading", online: null, max: null });

  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      let players: Ping | null = null;
      for (const ping of [pingMcSrvStat, pingMcStatusIo]) {
        try {
          players = await ping(ac.signal);
          break;
        } catch {
          /* fall through to the next provider */
        }
      }
      if (ac.signal.aborted) return;

      if (!players) setS({ status: "unavailable", online: null, max: null });
      else if (players.offline) setS({ status: "offline", online: null, max: null });
      else setS({ status: "online", online: players.online, max: players.max });
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      ac.abort();
      clearInterval(id);
    };
  }, []);

  const label: string = {
    loading: "Checking status",
    online: "Online",
    offline: "Offline",
    unavailable: "Status unavailable",
  }[s.status];

  const dot: string = {
    loading: "bg-ink-3",
    online: "bg-ok",
    offline: "bg-p-essentials",
    unavailable: "bg-ink-3",
  }[s.status];

  return (
    <div
      className="flex flex-wrap items-center gap-x-7 gap-y-2 font-mono text-[0.84rem]"
      aria-live="polite"
    >
      <p className="flex items-center gap-2.5 text-ink">
        <span className={`inline-block h-2 w-2 shrink-0 ${dot}`} aria-hidden="true" />
        {label}
      </p>

      {s.status === "online" && (
        <p className="tabular-nums text-ink-2">
          <span className="text-ink">{s.online?.toLocaleString()}</span>
          <span className="text-ink-3">/{s.max?.toLocaleString()}</span> players
        </p>
      )}

    </div>
  );
}
