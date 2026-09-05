// Site-wide constants. Single source so a changed number or link only needs
// editing once. The Astro migration exists specifically to kill this kind
// of drift (see: commands.astro used to say nation creation cost $7.5M while
// lands.astro said $3.5M: same fact, two answers).

export const SITE_NAME = "Meridian";
export const SITE_URL = "https://meridian-mc.net";
export const SERVER_ADDRESS = "meridian-mc.net";
export const MAP_URL = "https://map.meridian-mc.net";
export const DISCORD_INVITE_CODE = "beHD4TE3Td";
export const DISCORD_INVITE_URL = `https://discord.gg/${DISCORD_INVITE_CODE}`;

// Live analytics feed, published straight to the game server's own webserver so
// fresh figures reach the site without a commit and a full rebuild per change.
// The site tries this first and silently falls back to the committed
// /data.json, so an unreachable server changes nothing a visitor can see.
//
// Leave EMPTY until Cloudflare sends CORS for the map hostname (or routes
// meridian-mc.net/data.json to it). Until then the browser blocks the
// cross-origin read and logs an error on every page load.
export const LIVE_DATA_URL = "";

// Economy figures referenced in prose outside the Lands guide (commands.astro,
// war.astro). The Lands guide (src/pages/lands.astro) remains the canonical
// breakdown with full context; these are just the headline numbers.
export const ECON = {
  startingBalance: "$2,500",
  jobsDailyCap: "$1,500",
  firstPaidChunk: "free",
  chunkIncrease: "$400",
  landUpkeepPerChunk: "$50",
  nationCreateCost: "$3,500,000",
  nationUpkeepPerChunk: "$400",
  warAttackerMinBank: "$50,000",
};
