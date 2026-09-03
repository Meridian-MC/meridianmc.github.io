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

initCopy();
initDiscord();
