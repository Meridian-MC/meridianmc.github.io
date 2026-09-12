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
    answer: `<p>The overworld is <span class="short">10,000 &times; 10,000 blocks</span>. You cannot travel past the world border.</p>`,
  },
  {
    category: "world",
    question: "Is the End open?",
    answer: `<p><span class="short">No</span>, the End is closed. There are, however, custom recipes for End items and blocks &mdash; see the <a href="/recipes">Recipes</a> page.</p>`,
  },
  {
    category: "world",
    question: "Why is the Nether so small?",
    answer: `<p>The Nether runs at Minecraft's normal 8:1 ratio, and its border is set at <span class="short">1,200 blocks</span> across. Because of this, the Nether resets on the 1st of every month.</p>`,
  },
  {
    category: "world",
    question: "Is PvP on?",
    answer: `<p><span class="short">Yes</span>, PvP is live everywhere except inside spawn, which is a permanent safe zone. There is <span class="short">no keep-inventory</span> outside spawn, so losing a fight means dropping what you carried. Your things land in a <a href="/#protection">death chest</a> that only you can open for the first <span class="short">30 minutes</span>. After that anyone can loot it, and the chest itself stays for <span class="short">24 hours</span>, so you can come back for whatever is left.</p>
<p>Claimed land is still protected: nobody can enter or take ground inside a claim except during a declared <a href="/war">war</a>. See the <a href="/rules#interaction">Interaction rules</a> for the exact boundaries.</p>`,
  },
  {
    category: "world",
    question: "What is the difficulty?",
    answer: `<p>The difficulty is <span class="short">Easy mode</span>. There is <span class="short">no keep-inventory</span> in the world, so dying in the wild means dropping your things where you fell. The only exceptions are inside spawn and during a formal war.</p>`,
  },
  {
    category: "world",
    question: "Can I trade with villagers?",
    answer: `<p><span class="short">No</span>, villager trading is disabled.</p>`,
  },
  {
    category: "starting",
    question: "How do I join?",
    answer: `<p>Versions <code>1.8</code> through <code>26.2</code>, Java Edition. Any launcher works (Lunar or Prism is recommended). Premium Minecraft is required. The IP is <code>meridian-mc.net</code>.</p>`,
  },
  {
    category: "starting",
    question: "Is Meridian on Bedrock?",
    answer: `<p><span class="short">No</span>, Java Edition only. There's no Bedrock support planned currently.</p>`,
  },
  {
    category: "starting",
    question: "What should I do first?",
    answer: `<p>Earn a little starting cash, then found a land with <code>/lands create &lt;name&gt;</code> and read the <a href="/lands">Lands guide</a>. <a href="/faq#voting-q">Vote for the server</a> each day for crates, and skim the <a href="/commands">Commands</a> page.</p>`,
  },
  {
    category: "starting",
    question: "Are mods, shaders, or resource packs allowed?",
    answer: `<p><span class="short">Yes</span>, as long as they do not provide you with information you otherwise couldn't have. This does not apply to minimaps like Xaero's or Journeymap. See the <a href="/rules#cheats">Cheats rules</a> for the exact boundary.</p>`,
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
    answer: `<p>Gold, written <strong>G</strong>. It is item-backed: 1 gold ingot is <span class="short">1 G</span>. There is no personal bank, so what you are carrying and what is in your land's bank <em>is</em> your balance.</p>`,
  },
  {
    category: "economy",
    question: "How do I make money?",
    answer: `<p>Three ways:</p>
<ul>
  <li><strong>Mining.</strong> Gold ore is the only real source of new gold entering the economy.</li>
  <li><strong>Voting.</strong> Vote on our four listing sites once a day each for crates.</li>
  <li><strong>Selling to other players.</strong> Chest shops are the player market. Run <code>/shops</code> to see every land tagged as a shop.</li>
</ul>`,
  },
  {
    category: "economy",
    question: "Is there a server shop?",
    answer: `<p><span class="short">No.</span> Everything trades player-to-player through chest shops. The server never buys or sells anything.</p>`,
  },
  {
    category: "economy",
    question: "How much does land cost?",
    answer: `<p>Founding a land with <code>/lands create</code> includes your <span class="short">first chunk free</span>. After that:</p>
<ul>
  <li>Every chunk after that costs a flat <span class="short">5 G</span>.</li>
  <li>Weekly upkeep is <span class="short">2 G per chunk</span>, taken from the land bank.</li>
  <li>Tiers change these numbers. The full breakdown is in the <a href="/lands">Claims guide</a>.</li>
</ul>`,
  },
  {
    category: "economy",
    id: "voting-q",
    question: "How does voting work, and what do crates give?",
    answer: `<p>Run <code>/vote</code> for the links. Each of the four listing sites can be voted on <span class="short">once every 24 hours</span>, and every vote pays a crate. Voting milestones pay better crates the more you vote.</p>
<p>Crates never take an inventory slot. They are held for you, and you open them from <code>/crates</code> whenever you like.</p>`,
  },
  {
    category: "economy",
    question: "Can I extract enchantments from my items?",
    answer: `<p>Yes, that is what <a href="/#extract">ExtractableEnchantments</a> is for. Craft an Enchantment Extractor, then drag it onto an enchanted item to pull one random enchantment off as a book. See the <a href="/recipes">Recipes</a> page for the exact crafting grid.</p>`,
  },
  {
    category: "economy",
    question: "Is scamming allowed?",
    answer: `<p>No. Taking payment and not delivering, fake middlemen, and &ldquo;hold this for me&rdquo; are all <a href="/rules">Rulebook</a> violations and are actioned. Scamming through trust is explicitly banned.</p>
<p>A deal that both sides agreed to is a different thing. Trades between players are settled between players, not by staff, so use a chest shop for anything you want guaranteed, or ask staff to middleman a large one.</p>`,
  },
  {
    category: "economy",
    question: "How should I price my items?",
    answer: `<p>However you want. There is no fixed price list for anything traded player-to-player. Check a few shops, see what people charge, and price against that. The <a href="/economy#prices">Economy page</a> tracks the median for common goods.</p>`,
  },
];