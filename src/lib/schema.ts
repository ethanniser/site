import { z } from "zod";

export type Video = z.output<typeof ytVideoItem>;
export const ytVideoItem = z.object({
  kind: z.literal("youtube#searchResult"),
  etag: z.string(),
  id: z.object({ kind: z.literal("youtube#video"), videoId: z.string() }),
  snippet: z.object({
    publishedAt: z.string(),
    channelId: z.string(),
    title: z.string().transform((s) =>
      s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'"),
    ),
    description: z.string(),
    thumbnails: z.object({
      default: z.object({
        url: z.string(),
        width: z.number(),
        height: z.number(),
      }),
      medium: z.object({
        url: z.string(),
        width: z.number(),
        height: z.number(),
      }),
      high: z.object({
        url: z.string(),
        width: z.number(),
        height: z.number(),
      }),
    }),
    channelTitle: z.string(),
    liveBroadcastContent: z.string(),
    publishTime: z.string().transform((s) => new Date(s)),
  }),
  external: z.boolean().optional().default(false),
});

const ytChannelItem = z.object({
  kind: z.string(),
  etag: z.string(),
  id: z.object({ kind: z.literal("youtube#channel"), channelId: z.string() }),
  snippet: z.object({
    publishedAt: z.string(),
    channelId: z.string(),
    title: z.string(),
    description: z.string(),
    thumbnails: z.object({
      default: z.object({ url: z.string() }),
      medium: z.object({ url: z.string() }),
      high: z.object({ url: z.string() }),
    }),
    channelTitle: z.string(),
    liveBroadcastContent: z.string(),
    publishTime: z.string().transform((s) => new Date(s)),
  }),
});

export const ytVideoRes = z.object({
  kind: z.string(),
  etag: z.string(),
  regionCode: z.string(),
  pageInfo: z.object({ totalResults: z.number(), resultsPerPage: z.number() }),
  items: z.array(z.union([ytVideoItem, ytChannelItem])),
});
