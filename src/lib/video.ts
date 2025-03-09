import { type Video, ytVideoItem } from "@/lib/schema";
import { z } from "zod";
import fs from "fs";

export async function getVideos({
  limit,
}: {
  limit?: number | undefined;
}): Promise<Video[]> {
  const json = fs.readFileSync("src/lib/data/videos.json", "utf8");
  const videos = z.array(ytVideoItem).parse(JSON.parse(json));
  return videos
    .sort(
      (a, b) =>
        b.snippet.publishTime.getTime() - a.snippet.publishTime.getTime(),
    )
    .slice(0, limit ?? videos.length);
}
