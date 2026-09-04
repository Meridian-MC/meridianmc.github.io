// FAQ content. One array, rendered by <FaqAccordion>. Add a question here
// and it appears in the right category automatically, no markup to hand-nest.
// `answer` is trusted HTML authored by us (links, <code>, lists), rendered
// with set:html in the component.

export interface FaqCategory {
  id: string;
  title: string;
  sub: string;
}

export interface FaqEntry {
  category: string; // matches FaqCategory.id
  id?: string;       // optional anchor, e.g. "jobs-q"
  question: string;
  answer: string;
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  { id: "starting", title: "Getting started", sub: "Connecting, and your first hour." },
  { id: "world", title: "The world", sub: "The map, the dimensions, and how combat is set up." },
  { id: "economy", title: "Economy", sub: "Money, the market, and land costs. Live figures are on the Economy page." },
];

export const FAQ: FaqEntry[] = [
  // ---- The world ----
  {
    category: "world",
    question: "How big is the map?",
    answer: `<p>The overworld is <span class="short">10,000 &times; 10,000 blocks</span>, centred on spawn: 5,000 blocks to the border in any direction. The border is a hard wall; you cannot build or travel past it.</p>`,
  },
  {
    category: "world",
    question: "Is the End open?",
    answer: `<p><span class="short">No</span>, the End is closed. Elytra and dragon trophies only enter the economy through what players already had, and stay rare on purpose. A handful of otherwise-impossible essentials (ender pearls, shulker shells, end stone, end rods, purpur, chorus fruit) are sold at the <a href="/faq#economy">Buy counter</a> so a closed End doesn't block ordinary building and storage.</p>`,
  },
  {
    category: "world",
    question: "Why is the Nether so small, and why does it get wiped?",
    answer: `<p>The Nether runs at Minecraft's normal 8:1 ratio, so a 10,000-wide overworld only gives a Nether about <span class="short">1,250 blocks</span> wide. That keeps netherite, blaze rods, and Nether loot genuinely scarce and worth trading for.</p>
<p>To stop that small space from being strip-mined flat and claimed wall to wall, the <span class="short">Nether resets on the 1st of every month</span>. Anything you leave there is gone at the reset. Raid it, don't live in it.</p>`,
  },
  {
    category: "world",
    question: "When does the Nether open?",
    answer: `<p>Not at launch. It opens on a fixed date afterward, announced server-wide when it happens.</p>`,
  },
  {
    category: "world",
    question: "Is PvP on?",
    answer: `<p>PvP is <span class="short">off for the opening period</span> so people can settle in. It is switched on server-wide once nations have formed, with advance notice. After that, PvP is allowed everywhere outside declared <a href="/war">wars</a>, under the <a href="/rules#pvp">PvP rules</a>.</p>`,
  },
  {
    category: "world",
    question: "How hard is the server?",
    answer: `<p>Normal difficulty survival, not hardcore. There is <span class="short">no keep-inventory</span> in the world, so dying in the wild means dropping your things where you fell. The only exceptions are inside spawn and during a formal war.</p>`,
  },
  {
    category: "world",
    question: "Can I fly?",
    answer: `<p><span class="short">No.</span> Flight is off everywhere, including inside your own claims. Meridian is a ground-level survival server.</p>`,
  },
  {
    category: "world",
    question: "Is there anti-cheat and x-ray protection?",
    answer: `<p>Yes. <a href="/#protection">GrimAC</a> covers movement, combat, and packet checks. On top of that the server hides ores from your client until you are near them, so x-ray shows you nothing, and using it is a ban.</p>`,
  },

  // ---- Getting started ----
  {
    category: "starting",
    question: "How do I connect?",
    answer: `<p>Java Edition, address <code>meridian-mc.net</code>. Clients from <code>1.8</code> to <code>26.2</code> work through ViaVersion and ViaBackwards. You need a genuine (premium) account.</p>`,
  },
  {
    category: "starting",
    question: "Is Meridian on Bedrock?",
    answer: `<p><span class="short">No</span>, Java Edition only. There's no Bedrock/console support planned: the plugins Meridian runs (Lands, QuickShop, the anti-cheat) don't have a cross-play path that holds up.</p>`,
  },
  {
    category: "starting",
    question: "Is there a whitelist?",
    answer: `<p>Before launch, yes. On launch day the whitelist comes off and anyone can connect at <code>meridian-mc.net</code>.</p>`,
  },
  {
    category: "starting",
    question: "What should I do first?",
    answer: `<p>Earn a little starting cash, then found a land with <code>/lands create &lt;name&gt;</code> and read the <a href="/lands">Lands guide</a>. Join a <a href="/faq#jobs-q">job</a> for early income, and skim the <a href="/commands">Commands</a> page.</p>`,
  },
  {
    category: "starting",
    question: "Can I use shaders or resource packs?",
    answer: `<p>Yes. Purely visual client mods (shaders, texture packs, zoom, minimaps of your <em>own</em> surroundings) are fine. The line is anything that gives a real advantage or shows you information you couldn't otherwise have, like x-ray packs or minimaps that reveal other players. See the <a href="/rules#client">Client rules</a> for the exact boundary.</p>`,
  },
  {
    category: "starting",
    question: "How do I use the live map?",
    answer: `<p><a href="https://map.meridian-mc.net">map.meridian-mc.net</a> is a live, top-down view of the explored world: claims, nation borders, and where towns have gone up. It updates automatically as the world is explored and built on.</p>`,
  },
  {
    category: "starting",
    question: "How do I report a bug, a griefer, or a bad actor?",
    answer: `<p>Open a ticket in <a href="https://discord.gg/beHD4TE3Td" rel="noopener">our Discord</a> with what happened and any evidence (screenshots, video, chat logs; see the <a href="/rules#moderation">Moderation rules</a> on what counts). Don't try to handle it yourself in-game.</p>`,
  },

  // ---- Economy ----
  {
    category: "economy",
    question: "What is the currency?",
    answer: `<p>One currency, written <code>$</code>, not tied to any item. Everyone starts with <span class="short">$2,500</span>. Check your balance with <code>/balance</code>; send money with <code>/pay &lt;player&gt; &lt;amount&gt;</code>.</p>`,
  },
  {
    category: "economy",
    question: "How do I make money?",
    answer: `<p>Three ways, roughly in order of how much they matter:</p>
<ul>
  <li><strong>Selling to other players.</strong> Chest shops are the real economy. Left-click a chest holding what you want to sell, work out what is in demand, and produce it.</li>
  <li><strong>Jobs.</strong> Miner, Farmer, Fisherman, Hunter, and Explorer pay small amounts for relevant actions. Early capital, not a wage: capped at <span class="short">$1,500 a day</span>.</li>
  <li><strong>The Sell counter.</strong> The server buys raw metals, minerals, and bottled experience (iron, gold, copper, coal, redstone, lapis, quartz, XP bottles) at a deliberately low floor price. It is a safety net so you are never fully broke, not a place to get rich. Players will pay more.</li>
</ul>`,
  },
  {
    category: "economy",
    question: "Is there a server shop?",
    answer: `<p>Two small counters, and that is all:</p>
<ul>
  <li><strong>Buy:</strong> emergency items like bread and torches, plus a few things a closed End otherwise makes impossible to get (ender pearls, shulker shells, end stone, end rods, purpur, chorus fruit). <span class="short">Buy-only</span>, priced at a premium so buying from a player is always cheaper where that's an option.</li>
  <li><strong>Sell:</strong> the server <span class="short">buys</span> raw metals, minerals, and bottled experience at a floor price. Sell-only.</li>
</ul>
<p>Everything interesting (diamonds, gear, enchanted books, potions, mob drops, elytra, dragon trophies) is <span class="short">player market only</span>. The server never buys or sells it.</p>`,
  },
  {
    category: "economy",
    question: "How much does land cost?",
    answer: `<p>Founding a land with <code>/lands create</code> is free and includes your <span class="short">first chunk free</span>. After that:</p>
<ul>
  <li>The next chunk costs <span class="short">$15,000</span>, and each one after rises by <span class="short">$3,000</span>, so bigger claims cost more to grow.</li>
  <li>Weekly upkeep is <span class="short">$1,500 per chunk</span>, taken from the shared land bank.</li>
  <li>Tiers and nation membership change these numbers. The full breakdown is in the <a href="/lands">Lands guide</a>.</li>
</ul>`,
  },
  {
    category: "economy",
    id: "jobs-q",
    question: "How do jobs work?",
    answer: `<p>Run <code>/jobs browse</code> and pick from Miner, Farmer, Fisherman, Hunter, and Explorer. You earn a small payout for actions that fit the job. Daily earnings are capped at <span class="short">$1,500</span>, and casual play lands well under that: treat jobs as a leg-up, not a living.</p>`,
  },
  {
    category: "economy",
    question: "How should I price my items?",
    answer: `<p>However you want. There is no fixed price list for anything traded player-to-player. Check a few shops, see what people charge, and price against that. The <a href="/economy#prices">Economy page</a> tracks the median for common goods.</p>`,
  },
  {
    category: "economy",
    question: "Can I move enchantments between items?",
    answer: `<p>Yes, that is what <a href="/#extract">ExtractableEnchantments</a> is for. Craft an Enchantment Extractor from four experience bottles, four lapis blocks, and a book, then drag it onto an enchanted item to pull one random enchantment off as a book. It always works and you keep the book, so a good enchantment on gear you are replacing becomes something to re-use or sell.</p>`,
  },
  {
    category: "economy",
    question: "Are villager trades limited?",
    answer: `<p>Yes, heavily. Villagers are a currency faucet and an enchantment shortcut that the player market can't compete with, so a lot is switched off:</p>
<ul>
  <li><strong>No enchanted books or enchanted gear</strong> from any villager. Those trades are removed entirely.</li>
  <li><strong>No re-rolling.</strong> Breaking and replacing a job-site block will not re-roll a villager's offers.</li>
  <li><strong>No discounts.</strong> Hero of the Village and cured-zombie price cuts do nothing here.</li>
  <li><strong>No diamond gear, no cleric ender pearls, no farmer emerald-for-crops.</strong> These are protected commodities, the same as the automated farms banned under the <a href="/rules#farms">Farms rule</a>.</li>
</ul>
<p>Ordinary trades (emeralds for produce, sticks, glass, and so on) work as normal.</p>`,
  },
  {
    category: "economy",
    question: "What about scamming?",
    answer: `<p>A mispriced shop sign is on the buyer to catch, that is fair game. Scamming through <strong>trust</strong> (taking payment and not delivering, fake middlemen, &ldquo;hold this for me&rdquo;) is a <a href="/rules">Rulebook</a> violation. For large deals, use a chest shop or ask staff to middleman.</p>`,
  },
];
