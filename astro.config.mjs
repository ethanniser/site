import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import remarkToc from "remark-toc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://ethanniser.dev",
  markdown: {
    remarkPlugins: [remarkToc],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            linkedheading: true,
          },
        },
      ],
    ],
  },
  integrations: [
    mdx({
      extendMarkdownConfig: true,
    }),
    sitemap(),
    tailwind(),
    react(),
  ],
  output: "server",
  adapter: cloudflare({
    imageService: "cloudflare",
  }),
});
