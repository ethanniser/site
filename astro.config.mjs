import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import remarkToc from "remark-toc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import tailwindcss from "@tailwindcss/vite";
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
    react(),
  ],
  output: "server",
  adapter: cloudflare({
    imageService: "cloudflare",
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
