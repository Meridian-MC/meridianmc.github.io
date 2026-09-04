import { defineConfig } from "astro/config";

// Static build, one .html file per page (not /page/index.html) so the output
// matches what Cloudflare is already serving today and no wrangler/asset
// config has to change on cutover.
export default defineConfig({
  site: "https://meridian-mc.net",
  trailingSlash: "never",
  build: {
    format: "file",
  },
});
