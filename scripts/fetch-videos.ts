import { ytVideoRes, type Video } from "@/lib/schema";

const manualVideos: Video[] = [
  {
    kind: "youtube#searchResult",
    etag: "LvfBfb5dgArs_Sr4ZQPlgmxgQCw",
    id: { kind: "youtube#video", videoId: "S1YKKpLR7XI" },
    snippet: {
      publishedAt: "2025-03-09T00:34:55Z",
      channelId: "UCFvPgPdb_emE_bpMZq6hmJQ",
      title: "[EXTERNAL]You really need to try Effect ft. Ethan Niser",
      description:
        "Effect is one of those libraries I've been putting off learning for a while. It's an absurdly powerful, yet different way to write ...",
      thumbnails: {
        default: {
          url: "https://i.ytimg.com/vi/S1YKKpLR7XI/default.jpg",
          width: 120,
          height: 90,
        },
        medium: {
          url: "https://i.ytimg.com/vi/S1YKKpLR7XI/mqdefault.jpg",
          width: 320,
          height: 180,
        },
        high: {
          url: "https://i.ytimg.com/vi/S1YKKpLR7XI/hqdefault.jpg",
          width: 480,
          height: 360,
        },
      },
      channelTitle: "Davis",
      liveBroadcastContent: "none",
      publishTime: new Date("2025-03-09T00:34:55Z"),
    },
    external: true,
  },
];

const myVideos = await fetchVideosFromAPI();
const allVideos = myVideos
  .concat(manualVideos)
  .sort(
    (a, b) => b.snippet.publishTime.getTime() - a.snippet.publishTime.getTime(),
  );
await Bun.write("./src/lib/data/videos.json", JSON.stringify(allVideos));

export async function fetchVideosFromAPI(): Promise<Video[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", "UC1OBuTOu68SmE_8LfquGbSA");
  url.searchParams.set("key", import.meta.env.GOOGLE_API_KEY);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "50");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("failed to fetch videos", { cause: await res.text() });
  }
  const json = await res.json();
  await Bun.write("./src/lib/data/videos2.json", JSON.stringify(json));
  const parsed = ytVideoRes.parse(json);

  const videos = parsed.items
    .filter((item): item is Video => item.id.kind === "youtube#video")
    .sort(
      (a, b) =>
        b.snippet.publishTime.getTime() - a.snippet.publishTime.getTime(),
    );

  return videos;
}
