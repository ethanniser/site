import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import reunmediaogImages from "@reunmedia/astro-og-images";
import { readFile } from "node:fs/promises";

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
    reunmediaogImages({
      fonts: [
        {
          name: "Berkeley Mono",
          data: await readFile("./public/fonts/BerkeleyMono-Regular.ttf"),
        },
        {
          name: "Berkeley Mono Bold",
          data: await readFile("./public/fonts/BerkeleyMono-Bold.ttf"),
        },
      ],
    }),
  ],
  output: "static",
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [], // useful for ngrok
    },
  },
});
