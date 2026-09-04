// Every plugin Meridian runs, grouped the way they actually govern the
// server. This is the one place that data lives — the homepage's featured
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
    version: "8.2.4",
    category: "Land, economy & progression",
    featured: true,
    colorVar: "--p-lands",
    icon: "/assets/pi/lands.png",
    blurb: "The land claim and nation system the entire server is built around.",
    description:
      "A GUI-driven land claim system. Players claim chunks to protect their builds and containers, then group lands into nations with capitals, taxes, upkeep, tiers, and tracked diplomacy. Claims stay protected at all times except during a staff-approved war.",
    links: [
      { label: "Wiki", href: "https://wiki.incredibleplugins.com/lands/players" },
      { label: "SpigotMC", href: "https://www.spigotmc.org/resources/lands.53313/" },
    ],
  },
  {
    id: "quickshop",
    name: "QuickShop-Hikari",
    version: "6.3.0.1",
    category: "Land, economy & progression",
    featured: true,
    colorVar: "--p-quickshop",
    icon: "/assets/pi/quickshop.png",
    blurb: "Chest shops — the real economy.",
    description:
      "A chest shop plugin. Players sell or buy any item straight from a chest with no commands and no admin setup. These shops are the Meridian economy.",
    links: [
      { label: "Wiki", href: "https://quickshop-community.github.io/QuickShop-Hikari-Documents/" },
      { label: "Modrinth", href: "https://modrinth.com/plugin/quickshop-hikari" },
    ],
  },
  {
    id: "market",
    name: "EconomyShopGUI",
    version: "7.2.1",
    category: "Land, economy & progression",
    featured: true,
    colorVar: "--p-market",
    icon: "/assets/pi/market.png",
    blurb: "The two small server-run counters — Buy and Sell.",
    description:
      "A GUI-based server shop, kept deliberately small: a buy-only counter for emergency items and a few things the closed End otherwise makes impossible to get, and a sell counter where the server buys raw metals, minerals, and bottled experience at a floor price. Everything else stays on the player market.",
    links: [{ label: "SpigotMC", href: "https://www.spigotmc.org/resources/economyshopgui.69927/" }],
  },
  {
    id: "jobs",
    name: "Jobs Reborn",
    version: "5.2.6.6",
    category: "Land, economy & progression",
    featured: true,
    colorVar: "--p-jobs",
    icon: "/assets/pi/jobs.png",
    blurb: "Early capital, not a wage.",
    description:
      "Pays players money and experience for in-game actions. Meridian runs five jobs (Miner, Farmer, Fisherman, Hunter, Explorer) with a daily payout cap of $1,500, meant as starter capital rather than a wage. Run /jobs browse to sign up.",
    links: [{ label: "SpigotMC", href: "https://www.spigotmc.org/resources/jobs-reborn.4216/" }],
  },
  {
    id: "vault",
    name: "Vault",
    version: "—",
    category: "Land, economy & progression",
    blurb: "The economy API every plugin above hooks into. Invisible in play — nothing to configure or run.",
  },
  {
    id: "trademanager",
    name: "TradeManager",
    version: "2.0.2",
    category: "Land, economy & progression",
    blurb: "Governs villager trades and secure player-to-player trading. Enchanted books and gear are stripped from every villager — see the FAQ.",
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
      "Craft an Enchantment Extractor from four experience bottles, four lapis blocks, and a book, then drag it onto an enchanted item to pull one random enchantment off as a book. It always succeeds and you keep the book, so a spare Mending tool or an unwanted roll becomes something you can re-use or sell.",
    links: [{ label: "SpigotMC", href: "https://www.spigotmc.org/resources/extractable-enchantments-remove-enchantments-1-14-26-2.73954/" }],
  },
  {
    id: "ajleaderboards",
    name: "ajLeaderboards",
    version: "2.11.0",
    category: "Land, economy & progression",
    blurb: "Leaderboards for balance, playtime, and job levels — in-game and on signs.",
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
    id: "deathchest",
    name: "DeathChest",
    version: "—",
    category: "Gameplay",
    blurb: "Your inventory drops into a chest at your death point instead of scattering — recoverable, not erased.",
  },
  {
    id: "ezrtp",
    name: "EzRTP",
    version: "3.4.3",
    category: "Gameplay",
    blurb: "Random-teleports you into unclaimed wilderness — how most players leave spawn. A few uses a day.",
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
    blurb: "The floating text signs around spawn — labels, notices, NPC name tags.",
  },
  {
    id: "fancynpcs",
    name: "FancyNpcs",
    version: "2.11.0",
    category: "Gameplay",
    blurb: "The NPCs stationed around spawn — the dockside captain, the tavern keeper, and a few others who explain the basics.",
  },
  {
    id: "bottledexp",
    name: "BottledExp",
    version: "3.2.4.0",
    category: "Gameplay",
    blurb: "Lets you bottle your XP into stackable experience bottles instead of losing it on death — and turns grinding into a good the Sell counter will buy.",
  },

  // ---- Protection & moderation ----
  {
    id: "protection",
    name: "CoreProtect & GrimAC",
    version: "CoreProtect 25.0 · Grim 2.3.74",
    category: "Protection & moderation",
    featured: true,
    colorVar: "--p-core",
    icon: "/assets/pi/coreprotect.png",
    blurb: "Block logging and anticheat.",
    description:
      "CoreProtect logs every block change, so griefing inside a claim can be traced and rolled back. GrimAC is the anticheat, covering movement, combat, and packet checks, alongside NoChatReports for chat.",
    links: [
      { label: "CoreProtect", href: "https://modrinth.com/plugin/coreprotect" },
      { label: "GrimAC", href: "https://github.com/GrimAnticheat/Grim" },
    ],
  },
  {
    id: "worldguard",
    name: "WorldGuard",
    version: "7.0.18",
    category: "Protection & moderation",
    blurb: "Defines protected regions like spawn, where building and PvP are off regardless of who owns the land.",
  },
  {
    id: "worldedit",
    name: "WorldEdit",
    version: "7.4.5",
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
    id: "nochatreports",
    name: "NoChatReports",
    version: "2.7.8",
    category: "Protection & moderation",
    blurb: "Strips Mojang's chat-report metadata so client-side chat logging works normally.",
  },

  // ---- World ----
  {
    id: "squaremap",
    name: "squaremap",
    version: "mc26.2-1.3.15",
    category: "World",
    blurb: "Powers the live map — every claim, nation border, and player marker, updated in real time.",
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
    version: "1.2.33",
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
      "The core command suite: homes, warps, kits, mail, chat, and the /pay and /balance economy commands. Vault sits behind it and links the currency to every other plugin here.",
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
    blurb: "Bridges in-game chat with Discord, and posts join/leave and shop-transaction logs.",
  },
  {
    id: "interactivechat",
    name: "InteractiveChat",
    version: "2026.1.1.0",
    category: "Chat, info & infrastructure",
    blurb: "Hoverable item previews and inventory sharing in chat — type [item] to show what's in your hand.",
  },
  {
    id: "tab",
    name: "TAB",
    version: "6.1.2",
    category: "Chat, info & infrastructure",
    blurb: "Controls the in-game tab list and scoreboard — server info, ping, and your stats at a glance.",
  },
  {
    id: "minimotd",
    name: "MiniMOTD",
    version: "2.2.4",
    category: "Chat, info & infrastructure",
    blurb: "The server list message and icon you see before connecting.",
  },
  {
    id: "placeholderapi",
    name: "PlaceholderAPI",
    version: "2.12.3",
    category: "Chat, info & infrastructure",
    blurb: "Lets other plugins pull live stats — balance, job level, land tier — into chat, signs, and menus.",
  },
  {
    id: "protocollib",
    name: "ProtocolLib",
    version: "—",
    category: "Chat, info & infrastructure",
    blurb: "A shared packet-handling library several plugins above depend on.",
  },
  {
    id: "cmilib",
    name: "CMILib",
    version: "1.5.9.9",
    category: "Chat, info & infrastructure",
    blurb: "A shared utility library Jobs Reborn depends on.",
  },
  {
    id: "viaversion",
    name: "ViaVersion",
    version: "5.12.0",
    category: "Chat, info & infrastructure",
    blurb: "Lets Java clients from 1.8 through the current version connect to Meridian's 26.2 server.",
  },
  {
    id: "viabackwards",
    name: "ViaBackwards",
    version: "5.11.0",
    category: "Chat, info & infrastructure",
    blurb: "The companion to ViaVersion — translates newer protocol features back down for older clients.",
  },
];

export const FEATURED_PLUGINS = PLUGINS.filter((p) => p.featured);
