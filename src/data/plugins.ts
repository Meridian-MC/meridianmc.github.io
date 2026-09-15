// Every plugin Meridian runs, grouped the way they actually govern the
// server. This is the one place that data lives; the homepage's featured
// writeups and the full registry are both generated from this array, so a
// version bump or a colour change only happens once.
//
// `featured` plugins get an icon, an accent colour, and the longer
// `description`. Everything else still appears in its category with a
// `blurb`, just without the extra weight.

export interface PluginEntry {
  id: string;
  name: string;
  version: string;
  category: string;
  blurb: string;
  featured?: boolean;
  colorVar?: string;       // CSS custom property, e.g. "--p-lands"
  icon?: string;            // /assets/pi/<icon>.png
  description?: string;     // longer writeup, featured only
  links?: { label: string; href: string }[];
}

export const CATEGORIES = [
  "Land, economy & progression",
  "Gameplay",
  "Protection & moderation",
  "World",
  "Chat, info & infrastructure",
] as const;

export const PLUGINS: PluginEntry[] = [
  // ---- Land, economy & progression ----
  {
    id: "lands",
    name: "Lands",
    version: "8.4.3",
    category: "Land, economy & progression",
    featured: true,
    colorVar: "--p-lands",
    icon: "/assets/pi/lands.png",
    blurb: "The land claim and nation system the entire server is built around.",
    description:
      "A GUI-driven land claim system. Players claim chunks to protect their builds and containers, then group lands into nations with capitals, taxes, upkeep, tiers, and tracked diplomacy. Each player can own up to two lands. Claims stay protected at all times except during a staff-approved war.",
    links: [
      { label: "Wiki", href: "https://wiki.incredibleplugins.com/lands/players" },
      { label: "SpigotMC", href: "https://www.spigotmc.org/resources/lands.53313/" },
    ],
  },
  {
    id: "tne",
    name: "TheNewEconomy",
    version: "0.1.5.0",
    category: "Land, economy & progression",
    featured: true,
    colorVar: "--p-tne",
    icon: "/assets/pi/tne.png",
    blurb: "Gold is the money. Ingots and blocks in your inventory are your balance.",
    description:
      "The economy runs on a physical gold standard. A gold ingot is 1 G and a gold block is 9 G, and the items themselves are the currency: there is no virtual balance, no server shop, and nothing is minted. Every G on the server was mined by a player. Shops, claims, and upkeep all take gold straight from your inventory or your land bank.",
    links: [{ label: "Wiki", href: "https://github.com/TheNewEconomy/EconomyCore/wiki" }],
  },
  {
    id: "quickshop",
    name: "QuickShop-Hikari",
    version: "6.3.0.2",
    category: "Land, economy & progression",
    featured: true,
    colorVar: "--p-quickshop",
    icon: "/assets/pi/quickshop.png",
    blurb: "Chest shops. The real economy.",
    description:
      "A chest shop plugin. Players sell or buy any item straight from a chest with no commands and no admin setup, priced in gold. These shops are the Meridian economy.",
    links: [
      { label: "Wiki", href: "https://quickshop-community.github.io/QuickShop-Hikari-Documents/" },
      { label: "Modrinth", href: "https://modrinth.com/plugin/quickshop-hikari" },
    ],
  },
  {
    id: "votingplugin",
    name: "VotingPlugin",
    version: "7.1.1",
    category: "Land, economy & progression",
    blurb: "Four vote sites a day. Every vote pays a crate, and milestones pay better ones.",
    links: [{ label: "SpigotMC", href: "https://www.spigotmc.org/resources/votingplugin.15358/" }],
  },
  {
    id: "crazycrates",
    name: "CrazyCrates",
    version: "26.1.2",
    category: "Land, economy & progression",
    blurb: "The crates you earn by voting, opened from /crates whenever you like.",
    links: [{ label: "SpigotMC", href: "https://www.spigotmc.org/resources/crazycrates.16789/" }],
  },
  {
    id: "vault",
    name: "VaultUnlocked",
    version: "2.20.2",
    category: "Land, economy & progression",
    blurb: "The economy API every plugin above hooks into. Invisible in play, nothing to configure or run.",
  },
  {
    id: "extract",
    name: "ExtractableEnchantments",
    version: "12.8",
    category: "Land, economy & progression",
    featured: true,
    colorVar: "--p-extract",
    icon: "/assets/pi/extractable.png",
    blurb: "Turns enchantments into a tradeable good.",
    description:
      "Craft a Disenchanting Brick from bricks and lapis blocks around a book, then drag it onto an enchanted item to pull one random enchantment off as a book. It always succeeds and you keep the book, so a spare Mending tool or an unwanted roll becomes something you can re-use or sell.",
    links: [{ label: "SpigotMC", href: "https://www.spigotmc.org/resources/extractable-enchantments-remove-enchantments-1-14-26-2.73954/" }],
  },
  {
    id: "ajleaderboards",
    name: "ajLeaderboards",
    version: "2.11.0",
    category: "Land, economy & progression",
    blurb: "Leaderboards for gold, playtime, and mcMMO levels, in-game and on signs.",
  },

  // ---- Gameplay ----
  {
    id: "brewing",
    name: "The Brewing Project",
    version: "3.3.3",
    category: "Gameplay",
    featured: true,
    colorVar: "--p-brew",
    icon: "/assets/pi/brewing.png",
    blurb: "A full rewrite of BreweryX, with real fermenting and barrel aging.",
    description:
      "The successor to Brewery and a full rewrite of BreweryX. Brew drinks with real fermenting, distilling, and barrel aging. Spring water and wheat become beer, and high-proof liquor only takes on its taste after years in an oak barrel. The reward is a diversity of potions whose effects create a drunkenness Minecraft has never had.",
    links: [
      { label: "Wiki", href: "https://docs.breweryteam.dev/docs/tbp" },
      { label: "Modrinth", href: "https://modrinth.com/plugin/the-brewing-project" },
    ],
  },
  {
    id: "mcmmo",
    name: "mcMMO",
    version: "2.2",
    category: "Gameplay",
    blurb: "RPG skills that level as you play: mining, fishing, combat, and more, each with perks. Fishing can pull up enchanted gear.",
    links: [{ label: "Wiki", href: "https://wiki.mcmmo.org/" }],
  },
  {
    id: "craftorithm",
    name: "Craftorithm",
    version: "1.14.0.0",
    category: "Gameplay",
    blurb: "Runs the server's custom crafting, smelting, and brewing recipes. The full list is on the Recipes page.",
    links: [{ label: "Recipes", href: "/recipes" }],
  },
  {
    id: "deathchest",
    name: "DeathChest",
    version: "n/a",
    category: "Gameplay",
    featured: true,
    colorVar: "--p-deathchest",
    icon: "/assets/pi/deathchest.svg",
    blurb: "A death doesn't have to mean losing everything to the dark.",
    description:
      "Your inventory drops into a chest at your death point instead of scattering across the ground. Anyone can open it, and it only lasts ten minutes before it breaks and spills what is left; this doesn't make death safe, it just makes death recoverable if you get back first.",
    links: [{ label: "SpigotMC", href: "https://www.spigotmc.org/resources/death-chest.101066/" }],
  },
  {
    id: "voicechat",
    name: "Simple Voice Chat",
    version: "2.6.23",
    category: "Gameplay",
    blurb: "Proximity voice chat, plus password-protected group channels for your land or nation. Needs the Simple Voice Chat mod on your client.",
    links: [{ label: "Modrinth", href: "https://modrinth.com/plugin/simple-voice-chat" }],
  },
  {
    id: "calcmod",
    name: "CalcMod",
    version: "1.5.2",
    category: "Gameplay",
    blurb: "A calculator in chat with Minecraft shortcuts: farm rates, travel distance, stack maths. /calc",
  },
  {
    id: "imageframe",
    name: "ImageFrame",
    version: "2026.1.4.0",
    category: "Gameplay",
    blurb: "Put any image from a URL onto item frames as a map. /imageframe create, with blank maps in hand.",
  },
  {
    id: "toolstats",
    name: "ToolStats",
    version: "2.0.7",
    category: "Gameplay",
    blurb: "Tracks how far a tool has mined and how many mobs a weapon has killed, shown in its tooltip.",
  },
  {
    id: "fancyholograms",
    name: "FancyHolograms",
    version: "2.11.0",
    category: "Gameplay",
    blurb: "The floating text signs around spawn: labels and notices.",
  },
  {
    id: "bottledexp",
    name: "BottledExp",
    version: "3.2.4.0",
    category: "Gameplay",
    blurb: "Lets you bottle your XP into stackable experience bottles instead of losing it on death. /bottle",
  },

  // ---- Protection & moderation ----
  {
    id: "protection",
    name: "CoreProtect & GrimAC",
    version: "25.0 / 2.3.74",
    category: "Protection & moderation",
    featured: true,
    colorVar: "--p-core",
    icon: "/assets/pi/coreprotect.png",
    blurb: "Block logging and anticheat.",
    description:
      "CoreProtect logs every block change, so griefing inside a claim can be traced and rolled back. GrimAC is the anticheat, covering movement, combat, and packet checks.",
    links: [
      { label: "CoreProtect", href: "https://modrinth.com/plugin/coreprotect" },
      { label: "GrimAC", href: "https://github.com/GrimAnticheat/Grim" },
    ],
  },
  {
    id: "inventoryrollback",
    name: "InventoryRollbackPlus",
    version: "1.8.4",
    category: "Protection & moderation",
    blurb: "Snapshots inventories on death, join, and quit, so staff can restore items lost to a bug.",
  },
  {
    id: "invsee",
    name: "InvSee++",
    version: "n/a",
    category: "Protection & moderation",
    blurb: "Lets staff inspect a player's inventory and ender chest while investigating reports.",
  },
  {
    id: "fawe",
    name: "FastAsyncWorldEdit",
    version: "2.15.4",
    category: "Protection & moderation",
    blurb: "The world-editing tool staff use to build and terraform spawn and other official structures.",
  },
  {
    id: "luckperms",
    name: "LuckPerms",
    version: "5.5.71",
    category: "Protection & moderation",
    blurb: "Manages every permission and rank on the server.",
  },
  {
    id: "plugman",
    name: "PlugManX",
    version: "3.1.0",
    category: "Protection & moderation",
    blurb: "Lets staff reload or disable a single plugin without restarting the server.",
  },

  // ---- World ----
  {
    id: "squaremap",
    name: "squaremap",
    version: "mc26.2-1.3.15",
    category: "World",
    blurb: "Powers the live map: every claim, nation border, and player marker, updated in real time.",
  },
  {
    id: "chunky",
    name: "Chunky",
    version: "1.5.3",
    category: "World",
    blurb: "Pre-generates the world ahead of players exploring it, so terrain loads instantly.",
  },
  {
    id: "chunkyborder",
    name: "ChunkyBorder",
    version: "1.2.23",
    category: "World",
    blurb: "Enforces the 10,000 × 10,000 world border and visualizes it in-game.",
  },

  // ---- Chat, info & infrastructure ----
  {
    id: "essentials",
    name: "EssentialsX",
    version: "2.22.1",
    category: "Chat, info & infrastructure",
    featured: true,
    colorVar: "--p-essentials",
    icon: "/assets/pi/essentials.png",
    blurb: "The core command suite.",
    description:
      "The core command suite: homes, teleport requests, mail, chat, and the everyday utility commands. It hands money matters to TheNewEconomy through Vault rather than running its own balances.",
    links: [
      { label: "essentialsx.net", href: "https://essentialsx.net" },
      { label: "Modrinth", href: "https://modrinth.com/plugin/essentialsx" },
    ],
  },
  {
    id: "essentialschat",
    name: "EssentialsX Chat",
    version: "2.22.1",
    category: "Chat, info & infrastructure",
    blurb: "Formats chat with rank prefixes and colours, paired with EssentialsX.",
  },
  {
    id: "discordsrv",
    name: "DiscordSRV",
    version: "1.30.5",
    category: "Chat, info & infrastructure",
    blurb: "Bridges in-game chat with Discord, and posts join and leave messages.",
  },
  {
    id: "interactivechat",
    name: "InteractiveChat",
    version: "2026.1.1.0",
    category: "Chat, info & infrastructure",
    blurb: "Hoverable item previews and inventory sharing in chat. Type [item] to show what's in your hand. Its PacketEvents and DiscordSRV add-ons run alongside it.",
  },
  {
    id: "tab",
    name: "TAB",
    version: "6.1.3",
    category: "Chat, info & infrastructure",
    blurb: "Controls the in-game tab list and scoreboard: server info, ping, and your stats at a glance.",
  },
  {
    id: "minimotd",
    name: "MiniMOTD",
    version: "2.2.4",
    category: "Chat, info & infrastructure",
    blurb: "The server list message and icon you see before connecting.",
  },
  {
    id: "votifier",
    name: "VotifierPlus",
    version: "1.4.3",
    category: "Chat, info & infrastructure",
    blurb: "Receives the votes from the listing sites and hands them to VotingPlugin.",
  },
  {
    id: "placeholderapi",
    name: "PlaceholderAPI",
    version: "2.12.3",
    category: "Chat, info & infrastructure",
    blurb: "Lets other plugins pull live stats (gold, mcMMO level, land tier) into chat, signs, and menus.",
  },
  {
    id: "protocollib",
    name: "ProtocolLib & packetevents",
    version: "n/a / 2.13.0",
    category: "Chat, info & infrastructure",
    blurb: "Shared packet-handling libraries several plugins above depend on.",
  },
  {
    id: "cmilib",
    name: "CMILib",
    version: "1.5.9.9",
    category: "Chat, info & infrastructure",
    blurb: "A shared utility library from the Zrips plugin suite.",
  },
  {
    id: "viaversion",
    name: "ViaVersion",
    version: "5.11.0",
    category: "Chat, info & infrastructure",
    blurb: "Lets Java clients from 1.8 through the current version connect to Meridian's 26.2 server.",
  },
  {
    id: "viabackwards",
    name: "ViaBackwards",
    version: "5.11.0",
    category: "Chat, info & infrastructure",
    blurb: "The companion to ViaVersion. Translates newer protocol features back down for older clients.",
  },
];

export const FEATURED_PLUGINS = PLUGINS.filter((p) => p.featured);
