// The four listing sites, straight out of VotingPlugin/VoteSites.yml, and the
// vote shop straight out of Shop.yml. Costs are in vote points, and since four
// sites can each be voted once a day, points per day caps at four: the "days"
// column is what that price actually costs you in real time.
export const VOTE_SITES = [
  { name: "MinecraftServers.org", host: "minecraftservers.org", url: "https://minecraftservers.org/server/692916" },
  { name: "Minecraft-MP", host: "minecraft-mp.com", url: "https://minecraft-mp.com/server-s363666" },
  { name: "TopMinecraftServers", host: "topminecraftservers.org", url: "https://topminecraftservers.org/vote/44466" },
  { name: "MineRank", host: "minerank.com", url: "https://www.minerank.com/meridian" },
];

export const VOTE_SHOP = [
  { item: "8 Ender Pearls", cost: 3, icon: "ender_pearl" },
  { item: "4 Golden Apples", cost: 4, icon: "golden_apple" },
  { item: "Iron Crate", cost: 6, icon: "iron_ingot" },
  { item: "Enchantment Extractor", cost: 10, icon: "enchanted_book" },
  { item: "Gold Crate", cost: 16, icon: "gold_ingot" },
  { item: "Netherite Upgrade Template", cost: 30, icon: "netherite_upgrade_smithing_template" },
  { item: "Diamond Crate", cost: 35, icon: "diamond" },
];
