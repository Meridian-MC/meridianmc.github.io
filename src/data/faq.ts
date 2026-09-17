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
    answer: `<p><span class="short">Yes</span>, PvP is live everywhere except inside spawn, which is a permanent safe zone. There is <span class="short">no keep-inventory</span> outside spawn, so losing a fight means dropping what you carried. Your things land in a death chest at the spot you died. <span class="short">Anyone can open it</span>, and it lasts <span class="short">10 minutes</span> before it breaks and spills whatever is left onto the ground, so get back to it before someone else does.</p>
<p>Claimed land is still protected: nobody can enter or take ground inside a claim except during a declared <a href="/war">war</a>. See the <a href="/rules#interaction">Interaction rules</a> for the exact boundaries.</p>`,
  },
  {
    category: "world",
    question: "What is the difficulty?",
    answer: `<p>The difficulty is <span class="short">Normal</span>. There is <span class="short">no keep-inventory</span> in the world, so dying in the wild means dropping your things where you fell. The only exceptions are inside spawn and during a formal war.</p>`,
  },
  {
    category: "world",
    question: "How do I get to my friends?",
    answer: `<p><code>/tpa &lt;player&gt;</code> asks to teleport to them and <code>/tpahere &lt;player&gt;</code> asks them to come to you; they answer with <code>/tpaccept</code>. Requests time out after two minutes, and there is a short warm-up before you go. <code>/back</code> returns you to where you last were, including your death point.</p>`,
  },
  {
    category: "world",
    question: "Is there voice chat?",
    answer: `<p><span class="short">Yes</span>, proximity voice chat. Install the <a href="https://modrinth.com/plugin/simple-voice-chat" target="_blank" rel="noopener">Simple Voice Chat</a> mod on your client (Fabric, Forge, NeoForge, and Quilt builds exist) and it connects automatically when you join. Press <kbd>V</kbd> in-game for the voice menu. You can also make group channels, which can be password-protected, so a land or nation can keep a private channel.</p>`,
  },
  {
    category: "world",
    question: "Can I trade with villagers?",
    answer: `<p><span class="short">No</span>, villager trading is disabled.</p>`,
  },
  {
    category: "world",
    question: "How do I get Mending?",
    answer: `<p><span class="short">Fishing.</span> With villager trading off, Mending comes from fishing, loot chests and player shops. Two things stack on every cast:</p>
<ul>
<li><strong>Vanilla treasure</strong> is unchanged: enchanted books (Mending included) are in the normal treasure pool, and Luck of the Sea raises it.</li>
<li><strong>mcMMO Treasure Hunter</strong> adds a second roll on top. It scales with your Fishing level; each treasure it gives has a chance to carry a Legendary-tier enchantment, and Mending is in that tier. As of 17 Sept these Legendary chances were raised by 50%.</li>
</ul>
<div class="tier-wrap"><table class="tier-table">
<thead><tr><th>Treasure Hunter rank</th><th>Fishing level</th><th>Treasure per cast</th><th>Legendary enchant on a treasure</th></tr></thead>
<tbody>
<tr><td>1</td><td>1</td><td>9%</td><td>0.08%</td></tr>
<tr><td>2</td><td>25</td><td>10%</td><td>0.08%</td></tr>
<tr><td>3</td><td>35</td><td>9%</td><td>0.15%</td></tr>
<tr><td>4</td><td>50</td><td>10%</td><td>0.38%</td></tr>
<tr><td>5</td><td>65</td><td>11%</td><td>0.75%</td></tr>
<tr><td>6</td><td>75</td><td>12%</td><td>1.5%</td></tr>
<tr><td>7</td><td>85</td><td>15%</td><td>2.25%</td></tr>
<tr><td>8</td><td>100</td><td>20%</td><td>3%</td></tr>
</tbody>
</table></div>
<p>A fished item that has Mending on it counts too: pull the enchantment off with a Disenchanting Brick and you have a Mending book. Check <code>/fishing</code> for your rank.</p>`,
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
    answer: `<p>Mine a little gold, then found a land with <code>/lands create &lt;name&gt;</code> and read the <a href="/claims">Claims guide</a>. <a href="/vote">Vote for the server</a> each day for crates, and skim the <a href="/commands">Commands</a> page. <code>/calc</code> is a calculator in chat if you need to work out farm rates or travel distances.</p>`,
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
    answer: `<p>Gold, written <strong>G</strong>. It is item-backed: 1 gold ingot is <span class="short">1 G</span> and 1 gold block is <span class="short">9 G</span>. Nuggets are not currency. There is no personal bank, so what you are carrying and what is in your land's bank <em>is</em> your balance, and gold in an ender chest can be kept but not spent.</p>`,
  },
  {
    category: "economy",
    question: "How do I make money?",
    answer: `<p>Three ways:</p>
<ul>
  <li><strong>Mining.</strong> Gold ore is the only real source of new gold entering the economy.</li>
  <li><strong>Voting.</strong> Vote on our four listing sites once a day each for crates.</li>
  <li><strong>Selling to other players.</strong> Chest shops are the player market. <code>/qs find &lt;item&gt;</code> locates nearby shops selling something.</li>
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
  <li>Every chunk after that costs a flat <span class="short">15 G</span>, paid from the land bank.</li>
  <li>Weekly upkeep is <span class="short">4 G per chunk</span>, also taken from the land bank. If the bank runs dry, upkeep goes unpaid and the land is at risk.</li>
  <li>You can own <span class="short">two lands</span>; each pays its own upkeep.</li>
  <li>Tiers change these numbers. The full breakdown is in the <a href="/claims">Claims guide</a>.</li>
</ul>`,
  },
  {
    category: "economy",
    question: "Can I extract enchantments from my items?",
    answer: `<p>Yes, that is what ExtractableEnchantments is for. Craft a Disenchanting Brick, then drag it onto an enchanted item to pull one random enchantment off as a book. See the <a href="/recipes">Recipes</a> page for the exact crafting grid.</p>`,
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