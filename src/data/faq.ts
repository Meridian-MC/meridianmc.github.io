// FAQ content. One array, rendered by <FaqAccordion>. Add a question here
// and it appears in the right category automatically, no markup to hand-nest.
// `answer` is trusted HTML authored by us (links, <code>, lists), rendered
// with set:html in the component.

import { DISCORD_INVITE_URL } from "../consts";

export interface FaqCategory {
  id: string;
  title: string;
  sub: string;
}

export interface FaqEntry {
  category: string; // matches FaqCategory.id
  id?: string;       // optional anchor, e.g. "voting-q"
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
    question: "Why is the Nether so small?",
    answer: `<p>The Nether runs at Minecraft's normal 8:1 ratio, and its border is set at <span class="short">1,200 blocks</span> across. That keeps netherite, blaze rods, and Nether loot genuinely scarce and worth trading for.</p>
<p>To stop that small space from being strip-mined flat and claimed wall to wall, the <span class="short">Nether resets on the 1st of every month</span>. Anything you leave there is gone at the reset. Raid it, don't live in it.</p>`,
  },
  {
    category: "world",
    question: "Is PvP on?",
    answer: `<p><span class="short">Yes</span>, PvP is live everywhere except inside spawn, which is a permanent safe zone. There is <span class="short">no keep-inventory</span> outside spawn, so losing a fight means dropping what you carried. Your things land in a <a href="/#protection">death chest</a> that only you can open for the first <span class="short">30 minutes</span>. After that anyone can loot it, and the chest itself stays for <span class="short">24 hours</span>, so you can come back for whatever is left.</p>
<p>Claimed land is still protected: nobody can enter or take ground inside a claim except during a declared <a href="/war">war</a>. Combat is governed by the <a href="/rules#pvp">PvP rules</a>: standard gear only, no crystal PvP, no one-shot combos.</p>`,
  },
  {
    category: "world",
    question: "What is the difficulty?",
    answer: `<p>Normal difficulty survival, not hardcore. There is <span class="short">no keep-inventory</span> in the world, so dying in the wild means dropping your things where you fell. The only exceptions are inside spawn and during a formal war.</p>`,
  },
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
    question: "What should I do first?",
    answer: `<p>Earn a little starting cash, then found a land with <code>/lands create &lt;name&gt;</code> and read the <a href="/lands">Lands guide</a>. <a href="/faq#voting-q">Vote for the server</a> each day for crates, and skim the <a href="/commands">Commands</a> page.</p>`,
  },
  {
    category: "starting",
    question: "Can I use shaders or resource packs?",
    answer: `<p>Yes. Purely visual client mods (shaders, texture packs, zoom, minimaps of your <em>own</em> surroundings) are fine. The line is anything that gives a real advantage or shows you information you couldn't otherwise have, like x-ray packs or minimaps that reveal other players. See the <a href="/rules#client">Client rules</a> for the exact boundary.</p>`,
  },
  {
    category: "starting",
    question: "How do I use the live map?",
    answer: `<p>The <a href="https://map.meridian-mc.net" target="_blank" rel="noopener">live map</a> opens in its own tab and shows a top-down view of the explored world: claims, nation borders, and where towns have gone up. It updates automatically as the world is explored and built on.</p>`,
  },
  {
    category: "starting",
    question: "How do I report a bug, a griefer, or a bad actor?",
    answer: `<p>Open a ticket in <a href="${DISCORD_INVITE_URL}" rel="noopener">our Discord</a> with what happened and any evidence (screenshots, video, chat logs; see the <a href="/rules#moderation">Moderation rules</a> on what counts). Don't try to handle it yourself in-game.</p>`,
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
  <li><strong>Selling to other players.</strong> Chest shops are the real economy. Run <code>/shops</code> to see every land tagged as a shop, work out what is in demand, and produce it. To open your own, left-click a chest while holding the item you want to sell.</li>
  <li><strong>Voting.</strong> Vote on our four listing sites once a day each. Every vote pays a <span class="short">Copper Crate</span>, and milestones at 25, 50 and 100 votes pay bigger ones. It is the only income that costs you nothing but a minute.</li>
  <li><strong>The Sell counter.</strong> The server buys raw metals and minerals (iron, gold, copper, coal, redstone, lapis, quartz, and more) at a deliberately low floor price. It is a safety net so you are never fully broke, not a place to get rich. Players will pay more.</li>
</ul>`,
  },
  {
    category: "economy",
    question: "Is there a server shop?",
    answer: `<p>Three counters in <code>/shop</code>:</p>
<ul>
  <li><strong>Buy:</strong> basics, End-only materials since the End is closed (ender pearls, shulker shells, end stone, end rods, purpur, chorus fruit), every armor trim smithing template, the rarest potion ingredients (phantom membrane, turtle scute, rabbit's foot), and the <strong>Enchantment Extractor</strong>. <span class="short">Buy-only</span>, priced at a premium so buying from a player is always cheaper where that's an option.</li>
  <li><strong>Sell:</strong> the server <span class="short">buys</span> raw metals and minerals at a floor price. Sell-only, and prices now <span class="short">drift down</span> the more of something the server has bought, so flooding a single ore stops paying.</li>
  <li><strong>Crates:</strong> Iron, Gold and Diamond crates, added straight to <code>/crates</code>.</li>
</ul>
<p>Everything interesting (diamonds, gear, enchanted books, potions, mob drops, elytra, dragon trophies) is <span class="short">player market only</span>. The server never buys or sells it.</p>`,
  },
  {
    category: "economy",
    question: "How much does land cost?",
    answer: `<p>Founding a land with <code>/lands create</code> is free and includes your <span class="short">first chunk free</span>. After that:</p>
<ul>
  <li>Every chunk after that costs a flat <span class="short">$250</span>, no matter how big your land gets. How many you can claim is capped separately: <span class="short">7 chunks</span> alone, plus <span class="short">7 more</span> for every player you trust.</li>
  <li>Weekly upkeep is <span class="short">$100 per chunk</span>, taken from the shared land bank.</li>
  <li>Tiers and nation membership change these numbers. The full breakdown is in the <a href="/lands">Lands guide</a>.</li>
</ul>`,
  },
  {
    category: "economy",
    id: "voting-q",
    question: "How does voting work, and what do crates give?",
    answer: `<p>Run <code>/vote</code> for the links. Each of the four listing sites can be voted on <span class="short">once every 24 hours</span>, and every vote pays one <strong>Copper Crate</strong>. Hitting 25, 50 and 100 total votes pays an Iron, Gold and Diamond crate respectively.</p>
<p>Crates never take an inventory slot. They are held for you, and you open them from <code>/crates</code> whenever you like. Prizes run from diamonds, gold and ender pearls up to armour trims, shulker shells, the netherite template, and <strong>Mending books</strong>. which matter because villager book trades are switched off, so Mending is genuinely scarce here. Every tier also carries a rare <span class="short">cash jackpot</span> worth more than the crate itself.</p>
<p>Iron, Gold and Diamond crates are also sold in <code>/shop</code> if you would rather buy than wait. Two further tiers, <strong>Quartz</strong> and the limited-edition <strong>Nether</strong> crate, unlock on <span class="short">Friday, September 11</span> for the Nether Event.</p>`,
  },
  {
    category: "economy",
    id: "ranks-q",
    question: "What are ranks, and what do they give?",
    answer: `<p>Four permanent upgrades, bought with <code>/ranks</code>. You are only ever charged the difference between your current tier and the one you are buying, so reaching a tier costs the same whether you climb the ladder or not, and no lower purchase is ever wasted.</p>
<ul>
  <li><strong>Citizen</strong>. <span class="short">$12,000</span>. 5 homes, 12-chunk land base, grey prefix.</li>
  <li><strong>Landholder</strong>. <span class="short">$30,000</span>. 7 homes, 17-chunk base, green prefix.</li>
  <li><strong>Magnate</strong>. <span class="short">$60,000</span>. 10 homes, 22-chunk base, gold prefix.</li>
  <li><strong>Sovereign</strong>. <span class="short">$120,000</span>. 15 homes, 30-chunk base, purple prefix.</li>
</ul>
<p>The chunk figure is a <span class="short">base</span>, not a cap. A land's real limit is the owner's base plus <span class="short">7 per trusted member</span>, and only the owner's rank sets the base, so a Landholder with three trusted players can claim 38 chunks.</p>
<p>Prices are deliberately steep. Ranks exist to pull large balances out of circulation, not as early progression.</p>`,
  },
  {
    category: "economy",
    id: "ore-pricing-q",
    question: "Why do ore prices keep changing?",
    answer: `<p>The Sell counter uses <strong>dynamic pricing</strong>. Every unit the server buys nudges that item's price down a little, so the more of one ore the server has absorbed, the less the next stack pays.</p>
<p>The effect is deliberately gentle at normal volumes. Selling a stack of 64 moves copper about <span class="short">1%</span> and iron about <span class="short">0.5%</span>, you will not notice it. It only bites at industrial scale, which is the point: it stops any single item being farmed into an unlimited money printer without punishing ordinary mining.</p>
<p>Each ore has its own floor, so prices cannot fall forever. <strong>Emerald</strong> is the tightest, because villager crop trading makes it the one ore obtainable in unlimited quantity without mining.</p>`,
  },
  {
    category: "economy",
    id: "vote-shop-q",
    question: "What is the vote shop?",
    answer: `<p>Every vote pays <span class="short">1 vote point</span> as well as a Copper Crate. With four listing sites that is a maximum of <span class="short">4 points a day</span>, so everything in <code>/voteshop</code> is really priced in days of voting.</p>
<ul>
  <li>8 Ender Pearls, 3 points, about a day</li>
  <li>4 Golden Apples, 4 points</li>
  <li>Iron Crate, 6 points</li>
  <li>Enchantment Extractor, 10 points</li>
  <li>Gold Crate, 16 points, about four days</li>
  <li>Netherite Template, 30 points</li>
  <li>Diamond Crate, 35 points, about nine days</li>
</ul>
<p>Nothing in the vote shop pays cash and nothing it gives can be sold to the server in bulk, so voting can never mint currency. Mending is deliberately absent: it stays a crate drop so it keeps its scarcity.</p>`,
  },
  {
    category: "economy",
    question: "How should I price my items?",
    answer: `<p>However you want. There is no fixed price list for anything traded player-to-player. Check a few shops, see what people charge, and price against that. The <a href="/economy#prices">Economy page</a> tracks the median for common goods.</p>`,
  },
  {
    category: "economy",
    question: "Can I extract enchantments from my items?",
    answer: `<p>Yes, that is what <a href="/#extract">ExtractableEnchantments</a> is for. Craft an Enchantment Extractor from four experience bottles, four lapis blocks, and a book, then drag it onto an enchanted item to pull one random enchantment off as a book. It always works and you keep the book, so a good enchantment on gear you are replacing becomes something to re-use or sell.</p>`,
  },
  {
    category: "economy",
    question: "Can I trade with villagers?",
    answer: `<p>Yes, heavily. Villagers are a currency faucet and an enchantment shortcut that the player market can't compete with, so a lot is switched off:</p>
<ul>
  <li><strong>No enchanted books or enchanted gear</strong> from any villager. Those trades are removed entirely.</li>
  <li><strong>No re-rolling.</strong> Breaking and replacing a job-site block will not re-roll a villager's offers.</li>
  <li><strong>No discounts.</strong> Hero of the Village and cured-zombie price cuts do nothing here.</li>
  <li><strong>No diamond gear and no cleric ender pearls.</strong> These are protected commodities, the same as the automated farms banned under the <a href="/rules#farms">Farms rule</a>.</li>
</ul>
<p>Everything else trades as it does in vanilla. Selling produce to a farmer still levels them up, which is how you reach their apple and golden carrot offers.</p>`,
  },
  {
    category: "economy",
    question: "Is scamming allowed?",
    answer: `<p>No. Taking payment and not delivering, fake middlemen, and &ldquo;hold this for me&rdquo; are all <a href="/rules">Rulebook</a> violations and are actioned.</p>
<p>A deal that both sides agreed to is a different thing. Trades between players are settled between players, not by staff, so use a chest shop for anything you want guaranteed, or ask staff to middleman a large one.</p>`
  },
];
