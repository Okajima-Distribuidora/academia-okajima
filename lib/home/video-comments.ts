import "server-only";

import { getDb } from "@/lib/db";

import {
  formatPublishedAt,
  formatViews,
  type VideoComment,
} from "./catalog";
import { normalizeVideoCommentText } from "./video-comment-rules";

function initialsFrom(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A"
  );
}

export async function isPublicVideo(videoId: number) {
  return getDb()
    .selectFrom("videos")
    .select("id")
    .where("id", "=", videoId)
    .where("converted", "!=", 2)
    .where("privacy", "=", 0)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .where("approved", "=", 1)
    .where("upload_status", "=", "ready")
    .where("deleted_at", "is", null)
    .where("is_short", "=", 0)
    .executeTakeFirst();
}

export async function createVideoComment({
  userId,
  authorName,
  videoId,
  text: rawText,
}: {
  userId: number;
  authorName: string;
  videoId: number;
  text: string;
}): Promise<VideoComment | null> {
  const text = normalizeVideoCommentText(rawText);
  if (!text || !(await isPublicVideo(videoId))) return null;

  const time = Math.floor(Date.now() / 1_000);
  const result = await getDb()
    .insertInto("comments")
    .values({
      user_id: userId,
      video_id: videoId,
      post_id: 0,
      activity_id: 0,
      text,
      time,
      pinned: 0,
      likes: 0,
      dis_likes: 0,
    })
    .executeTakeFirstOrThrow();

  return {
    id: Number(result.insertId),
    authorName,
    authorInitials: initialsFrom(authorName),
    text,
    publishedLabel: formatPublishedAt(time),
    likesLabel: formatViews(0).replace("visualizações", "likes"),
  };
}
