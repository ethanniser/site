import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://ethanniser.dev",
  integrations: [mdx(), sitemap(), tailwind(), preact()],
  output: "server",
  adapter: cloudflare(),
});
