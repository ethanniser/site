import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
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
    // shikiConfig: {
    //   transformers: [transformerTwoslash()],
    // },
  },
  integrations: [
    mdx({
      extendMarkdownConfig: true,
    }),
    sitemap(),
    react(),
  ],
  output: "static",
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [], // useful for ngrok
    },
  },
});
