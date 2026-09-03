// Mobile nav toggle
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('.nav-toggle');
  if (toggle) {
    document.querySelector('.nav-links')?.classList.toggle('open');
  }
});

// Click-to-copy server IP
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
    box.classList.add('copied');
    const hint = box.querySelector('.copy-hint');
    const original = hint ? hint.textContent : '';
    if (hint) hint.textContent = 'Copied!';
    showToast('Server address copied to clipboard');
    setTimeout(() => {
      box.classList.remove('copied');
      if (hint) hint.textContent = original;
    }, 1600);
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
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2000);
}

initCopy();

// Live Discord member counts (public invite endpoint, CORS-enabled)
async function initDiscord() {
  const el = document.querySelector('[data-discord-invite]');
  if (!el) return;
  const code = el.getAttribute('data-discord-invite');
  const statsEl = el.querySelector('.d-stats');
  if (!statsEl) return;
  try {
    const res = await fetch('https://discord.com/api/v10/invites/' + code + '?with_counts=true');
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    const members = data.approximate_member_count;
    const online = data.approximate_presence_count;
    if (typeof members === 'number') {
      statsEl.innerHTML =
        '<span><span class="dot"></span>' + online.toLocaleString() + ' online</span>' +
        '<span>' + members.toLocaleString() + ' members</span>';
    }
  } catch {
    statsEl.textContent = 'Join the community';
  }
}

initDiscord();
