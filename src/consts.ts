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

// Economy figures referenced in prose outside the Lands guide (commands.astro,
// war.astro). The Lands guide (src/pages/lands.astro) remains the canonical
// breakdown with full context; these are just the headline numbers.
export const ECON = {
  startingBalance: "$2,500",
  jobsDailyCap: "$1,500",
  firstPaidChunk: "$15,000",
  chunkIncrease: "$3,000",
  landUpkeepPerChunk: "$1,500",
  nationCreateCost: "$3,500,000",
  nationUpkeepPerChunk: "$4,000",
  warAttackerMinBank: "$50,000",
};
