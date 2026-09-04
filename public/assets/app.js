// Mobile nav toggle
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('.nav-toggle');
  if (toggle) {
    document.querySelector('.nav-links')?.classList.toggle('open');
  }
});

// Click-to-copy server address
function initCopy() {
  const box = document.querySelector('[data-copy]');
  if (!box) return;
  const icon = box.querySelector('.copy-ico');
  box.addEventListener('click', async () => {
    const text = box.getAttribute('data-copy');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    showToast('Server address copied');
    box.classList.add('copied');
    clearTimeout(initCopy._t);
    initCopy._t = setTimeout(() => box.classList.remove('copied'), 1400);
  });
}

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 1800);
}

// Live Discord counts (public invite endpoint, CORS-enabled)
async function initDiscord() {
  const el = document.querySelector('[data-discord-invite]');
  if (!el) return;
  const code = el.getAttribute('data-discord-invite');
  try {
    const res = await fetch('https://discord.com/api/v10/invites/' + code + '?with_counts=true');
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    const online = el.querySelector('.dw-online');
    const total = el.querySelector('.dw-total');
    if (online && typeof data.approximate_presence_count === 'number') {
      online.textContent = data.approximate_presence_count.toLocaleString();
    }
    if (total && typeof data.approximate_member_count === 'number') {
      total.textContent = data.approximate_member_count.toLocaleString();
    }
    const icon = el.querySelector('.dw-icon');
    if (icon && data.guild && data.guild.id && data.guild.icon) {
      icon.src = 'https://cdn.discordapp.com/icons/' + data.guild.id + '/' + data.guild.icon + '.webp?size=128';
    }
  } catch {
    /* leave the static fallback values in place */
  }
}

// Live server status: player count + up/down from a public status ping,
// TPS + uptime from the analytics feed (present only when the refresh job has RCON).
async function initServerStatus() {
  const box = document.querySelector('[data-srv]');
  if (!box) return;
  const set = (sel, txt) => { const el = box.querySelector(sel); if (el != null) el.textContent = txt; };
  const show = (sel) => { const el = box.querySelector(sel); if (el) el.hidden = false; };

  try {
    const res = await fetch('https://api.mcstatus.io/v2/status/java/meridian-mc.net', { cache: 'no-store' });
    if (!res.ok) throw new Error();
    const d = await res.json();
    if (d && d.online) {
      box.dataset.state = 'online';
      set('[data-srv-state]', 'Online');
      const on = d.players && typeof d.players.online === 'number' ? d.players.online : 0;
      const mx = d.players && typeof d.players.max === 'number' ? d.players.max : 0;
      set('[data-srv-online]', on.toLocaleString());
      set('[data-srv-max]', mx.toLocaleString());
      show('[data-srv-players]');
    } else {
      box.dataset.state = 'offline';
      set('[data-srv-state]', 'Offline');
    }
  } catch {
    box.dataset.state = '';
    set('[data-srv-state]', 'Status unavailable');
  }

  try {
    const res = await fetch('/data.json', { cache: 'no-cache' });
    const d = await res.json();
    const s = (d && d.server) || {};
    if (s.tps != null) { set('[data-srv-tps-v]', Number(s.tps).toFixed(1)); show('[data-srv-tps]'); }
    if (s.started_at) {
      const started = Date.parse(s.started_at);
      if (!isNaN(started)) {
        let sec = Math.max(0, Math.floor((Date.now() - started) / 1000));
        const d1 = Math.floor(sec / 86400); sec -= d1 * 86400;
        const h = Math.floor(sec / 3600); sec -= h * 3600;
        const m = Math.floor(sec / 60);
        const parts = [];
        if (d1) parts.push(d1 + 'd');
        if (h || d1) parts.push(h + 'h');
        parts.push(m + 'm');
        set('[data-srv-uptime-v]', parts.slice(0, 2).join(' '));
        show('[data-srv-uptime]');
      }
    }
  } catch { /* no analytics feed yet */ }
}

// Open any accordion <details> that a link or hash targets, then scroll to it
// (browsers don't reliably auto-expand a closed <details> on their own).
function initAccordionLinks() {
  function openTarget(hash) {
    if (!hash || hash.length < 2) return;
    let target;
    try { target = document.querySelector(hash); } catch { return; }
    if (!target) return;
    const item = target.closest('.acc-item, details');
    if (item && !item.open) item.open = true;
  }
  openTarget(location.hash);
  window.addEventListener('hashchange', () => openTarget(location.hash));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash) {
      requestAnimationFrame(() => openTarget(url.hash));
    }
  });
}

// Cmd+K / Ctrl+K quick-jump palette. Static index, no build step or backend.
const CMDK_INDEX = [
  { label: 'Home', href: '/' },
  { label: 'Frontier report', href: '/#frontier' },
  { label: "What's different here", href: '/#different' },
  { label: 'Plugins', href: '/#plugins' },
  { label: 'Rules: Community', href: '/rules#community' },
  { label: 'Rules: Player vs. Player', href: '/rules#pvp' },
  { label: 'Rules: Lands & Nations', href: '/rules#lands' },
  { label: 'Rules: Client', href: '/rules#client' },
  { label: 'Rules: Farms', href: '/rules#farms' },
  { label: 'Rules: Moderation', href: '/rules#moderation' },
  { label: 'Lands: Claiming', href: '/lands#lands' },
  { label: 'Lands: Nations', href: '/lands#nations' },
  { label: 'Lands: Vassals', href: '/lands#vassals' },
  { label: 'Lands: Nation registry', href: '/lands#registry' },
  { label: 'Warfare', href: '/war' },
  { label: 'Economy: State of the economy', href: '/economy#state' },
  { label: 'Economy: Wealth', href: '/economy#wealth' },
  { label: 'Economy: Markets', href: '/economy#markets' },
  { label: 'Economy: Item prices & volume', href: '/economy#prices' },
  { label: 'Economy: How money moves', href: '/economy#flow' },
  { label: 'Economy: Money & trade', href: '/economy#money' },
  { label: 'FAQ: Getting started', href: '/faq#starting' },
  { label: 'FAQ: The world', href: '/faq#world' },
  { label: 'FAQ: Economy', href: '/faq#economy' },
  { label: 'Commands: Getting around', href: '/commands#getting-around' },
  { label: 'Commands: Homes & personal', href: '/commands#personal' },
  { label: 'Commands: Communication', href: '/commands#chat' },
  { label: 'Commands: Economy & shops', href: '/commands#economy' },
  { label: 'Commands: Jobs', href: '/commands#jobs' },
  { label: 'Commands: Land & nation', href: '/commands#land' },
  { label: 'Commands: Warfare', href: '/commands#war' },
  { label: 'Live Map', href: '/map' },
];

function initCommandPalette() {
  const overlay = document.querySelector('[data-cmdk]');
  if (!overlay) return;
  const input = overlay.querySelector('[data-cmdk-input]');
  const results = overlay.querySelector('[data-cmdk-results]');
  let active = 0;
  let shown = [];

  function render(list) {
    shown = list;
    active = 0;
    results.innerHTML = !list.length
      ? '<div class="cmdk-empty">No matches.</div>'
      : list.map((item, i) =>
          `<a href="${item.href}" class="cmdk-item${i === 0 ? ' on' : ''}" data-i="${i}">${item.label}</a>`
        ).join('');
  }

  function filter(q) {
    q = q.trim().toLowerCase();
    if (!q) return render(CMDK_INDEX.slice(0, 10));
    render(CMDK_INDEX.filter((item) => item.label.toLowerCase().includes(q)));
  }

  function highlight(i) {
    const items = results.querySelectorAll('.cmdk-item');
    items.forEach((el) => el.classList.remove('on'));
    if (items[i]) { items[i].classList.add('on'); items[i].scrollIntoView({ block: 'nearest' }); }
    active = i;
  }

  function open() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    filter('');
    input.focus();
  }
  function close() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    input.value = '';
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.hidden ? open() : close();
    } else if (e.key === 'Escape' && !overlay.hidden) {
      close();
    }
  });
  document.querySelectorAll('[data-cmdk-open]').forEach((btn) => btn.addEventListener('click', open));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  input.addEventListener('input', () => filter(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(active + 1, shown.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(active - 1, 0)); }
    else if (e.key === 'Enter') {
      const item = shown[active];
      if (item) { close(); location.href = item.href; }
    }
  });
}

initCopy();
initDiscord();
initServerStatus();
initAccordionLinks();
initCommandPalette();
