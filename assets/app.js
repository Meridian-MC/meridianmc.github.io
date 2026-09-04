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
    if (s.uptime) {
      // keep it short: first two time units only ("3 days 4 hours")
      const parts = String(s.uptime).match(/\d+\s*[a-z]+/gi) || [String(s.uptime)];
      set('[data-srv-uptime-v]', parts.slice(0, 2).join(' '));
      show('[data-srv-uptime]');
    }
  } catch { /* no analytics feed yet */ }
}

initCopy();
initDiscord();
initServerStatus();
