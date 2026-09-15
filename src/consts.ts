// Site-wide constants. Single source so a changed number or link only needs
// editing once. The Astro migration exists specifically to kill this kind
// of drift (see: commands.astro used to say nation creation cost $7.5M while
// lands.astro said $3.5M: same fact, two answers).

export const SITE_NAME = "Meridian";
export const SITE_URL = "https://meridian-mc.net";
export const SERVER_ADDRESS = "meridian-mc.net";
export const MAP_URL = "https://map.meridian-mc.net";

// The server itself runs 26.2. ViaVersion and ViaBackwards let older clients
// connect, so the joinable range is much wider than the server version alone.
export const SERVER_VERSION = "26.2";
export const CLIENT_MIN_VERSION = "1.8";
export const DISCORD_INVITE_CODE = "beHD4TE3Td";
export const DISCORD_INVITE_URL = `https://discord.gg/${DISCORD_INVITE_CODE}`;


// Economy figures referenced in prose outside the Claims guide (commands.astro,
// war.astro). The Claims guide (src/pages/claims.astro) remains the canonical
// breakdown with full context; these are just the headline numbers. Gold is
// item-backed (1 ingot = 1 G, 1 block = 9 G); sources are Lands/config.yml
// and Lands/Modules/Nations/nations.yml on the server.
export const ECON = {
  chunkCost: "15 G",
  landUpkeepPerChunk: "4 G",
  nationCreateCost: "100 G",
  nationUpkeepPerChunk: "3 G",
};
