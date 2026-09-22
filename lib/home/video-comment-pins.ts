import "server-only";

import { getDb } from "@/lib/db";

export async function setVideoCommentPin({
  userId,
  videoId,
  commentId,
  pinned,
}: {
  userId: number;
  videoId: number;
  commentId: number;
  pinned: boolean;
}) {
  const db = getDb();
  if (!pinned) {
    await db
      .deleteFrom("academy_video_comment_pins")
      .where("video_id", "=", videoId)
      .where("comment_id", "=", commentId)
      .execute();
    return true;
  }
  const comment = await db
    .selectFrom("comments")
    .select("id")
    .where("id", "=", commentId)
    .where("video_id", "=", videoId)
    .executeTakeFirst();
  if (!comment) return false;
  const now = new Date();
  await db
    .insertInto("academy_video_comment_pins")
    .values({
      video_id: videoId,
      comment_id: commentId,
      pinned_by_user_id: userId,
      pinned_at: now,
      updated_at: now,
    })
    .onDuplicateKeyUpdate({
      comment_id: commentId,
      pinned_by_user_id: userId,
      pinned_at: now,
      updated_at: now,
    })
    .execute();
  return true;
}
