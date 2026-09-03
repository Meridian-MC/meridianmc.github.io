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

## 2. Website — Cloudflare Pages

### Deploy
1. Dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Project name: `meridian` → **Create project**.
3. Upload `meridian-site.zip` (or drag the **contents** of the `site/` folder so
   `index.html` sits at the top level).
4. **Deploy site**. You get `https://meridian.pages.dev`.

### Attach the domain
5. In the `meridian` project → **Custom domains** → **Set up a custom domain**.
6. Add `meridian-mc.net` → **Activate domain**. Cloudflare auto-creates the DNS record.
7. Repeat for `www.meridian-mc.net`.
8. (Optional) DNS → add a redirect rule or the `www`→apex redirect Pages offers.

HTTPS certs issue automatically within a few minutes.

### Updating the site later
Re-run **Upload assets** in the project for a new deployment, or connect a Git
repo / use `wrangler pages deploy site/` for one-command deploys.

---

## 3. Content still to fill in

The rules/guide pages (`rules.html`, `war.html`, `lands.html`, `economy.html`)
have **draft placeholder content**. Replace with Meridian's real rules, plugin
commands, and numbers. Also replace the `#` Discord links with the real invite.
