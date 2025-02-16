import { ytVideoRes, type Video, ytVideoItem } from "@/schema";
import { createClient } from "redis";
import { z } from "zod";

function getApiKey() {
  if (import.meta.env.GOOGLE_API_KEY) {
    return import.meta.env.GOOGLE_API_KEY;
  } else {
    throw new Error("no google api key found");
  }
}

const redis = await createClient().connect();

export async function getVideos({
  limit,
}: {
  limit: number | undefined;
}): Promise<Video[]> {
  try {
    const cached = await redis.get("videos");
    return z.array(ytVideoItem).parse(JSON.parse(cached ?? ""));
  } catch (e) {
    console.error("failed to get cached videos", e);
  }
  try {
    throw new Error("waiting for rate limit");
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", "UC1OBuTOu68SmE_8LfquGbSA");
    url.searchParams.set("key", getApiKey());
    url.searchParams.set("maxResults", "50");
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("failed to fetch videos", { cause: await res.text() });
    }
    const json = await res.json();
    const parsed = ytVideoRes.parse(json);

    const videos = parsed.items
      .filter((item): item is Video => item.id.kind === "youtube#video")
      .sort(
        (a, b) =>
          b.snippet.publishTime.getTime() - a.snippet.publishTime.getTime(),
      )
      .slice(0, limit ?? parsed.items.length);

    await redis.set("videos", JSON.stringify(videos), {
      EX: 60 * 15, // 15 minutes
    });
    return videos;
  } catch (e) {
    console.error(e);
    return [];
  }
}
