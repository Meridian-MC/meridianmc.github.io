import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// Static build, one .html file per page (not /page/index.html) so the output
// matches what Cloudflare is already serving today and no wrangler/asset
// config has to change on cutover.
//
// Tailwind v4 is wired through the Vite plugin rather than PostCSS or the old
// @astrojs/tailwind integration: v4 dropped tailwind.config.js entirely, so the
// theme lives in src/styles/app.css under @theme instead.
export default defineConfig({
  site: "https://meridian-mc.net",
  trailingSlash: "never",

  build: {
    format: "file",
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],
});