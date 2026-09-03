# Meridian — Cloudflare setup

Domain: **meridian-mc.net** (Cloudflare Registrar, zone Active)
MC server: Apex host — `172.240.14.185:25606` (Apex hostname: `lidl.mc.gg`)
Website: static site in `site/`, deploy to Cloudflare Pages

---

## 1. DNS — Minecraft connect address (`play.meridian-mc.net`)

Dashboard → **meridian-mc.net** → **DNS** → **Records** → **Add record**, twice:

### Record A (points the name at the server IP)
| Field | Value |
|---|---|
| Type | `A` |
| Name | `play` |
| IPv4 address | `172.240.14.185` |
| Proxy status | **DNS only** (grey cloud — MUST be off, Cloudflare proxy can't carry Minecraft traffic) |
| TTL | Auto |

### Record B (SRV — lets players connect without typing the port)
| Field | Value |
|---|---|
| Type | `SRV` |
| Name | `play` |
| Service | `_minecraft` |
| Protocol | `_tcp` |
| TTL | Auto |
| Priority | `0` |
| Weight | `5` |
| Port | `25606` |
| Target | `play.meridian-mc.net` |

After ~1–5 min, `play.meridian-mc.net` works as the server address in Java Edition.
Direct `172.240.14.185:25606` keeps working as a fallback.

> If Apex ever changes your server IP, update Record A. To avoid that, you can
> instead make Record A a `CNAME` with target `lidl.mc.gg` (still DNS only) — the
> SRV record stays the same.

---

## 2. Website — Cloudflare Workers (connected to Git)

Repo: `Meridian-MC/meridianmc.github.io`, branch `main`. Site files live at the
repo root; `wrangler.jsonc` deploys them as a static-assets Worker `meridianmc`.

### Cloudflare "Set up your application" screen
- Build command: **leave empty**
- Deploy command: leave default (`npx wrangler deploy`)
- Root directory: `/`
- Non-production branch builds: default
- Protect with Cloudflare Access: **unchecked**
- Create / Deploy → you get `https://meridianmc.<subdomain>.workers.dev`

### Attach the domain
In the `meridianmc` Worker → **Settings → Domains & Routes** → **Add** → Custom domain:
- `meridian-mc.net`
- `www.meridian-mc.net`

Cloudflare creates the DNS records and issues HTTPS automatically.

### Updating the site later
`git push` to `main` → Cloudflare auto-builds and deploys.

---

## 3. Content still to fill in

The rules/guide pages (`rules.html`, `war.html`, `lands.html`, `economy.html`)
have **draft placeholder content**. Replace with Meridian's real rules, plugin
commands, and numbers. Also replace the `#` Discord links with the real invite.
