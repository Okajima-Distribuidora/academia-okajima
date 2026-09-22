import "server-only";

import { getDb } from "@/lib/db";

export async function setVideoCommentVisibility({
  userId,
  videoId,
  commentId,
  hidden,
}: {
  userId: number;
  videoId: number;
  commentId: number;
  hidden: boolean;
}) {
  const db = getDb();
  const comment = await db
    .selectFrom("comments")
    .select("id")
    .where("id", "=", commentId)
    .where("video_id", "=", videoId)
    .executeTakeFirst();
  if (!comment) return false;

  const now = new Date();
  if (hidden) {
    await db
      .insertInto("academy_video_comment_moderation")
      .values({
        comment_id: commentId,
        video_id: videoId,
        is_hidden: 1,
        hidden_at: now,
        hidden_by_user_id: userId,
        restored_at: null,
        restored_by_user_id: null,
        updated_at: now,
      })
      .onDuplicateKeyUpdate({
        is_hidden: 1,
        hidden_at: now,
        hidden_by_user_id: userId,
        restored_at: null,
        restored_by_user_id: null,
        updated_at: now,
      })
      .execute();
  } else {
    await db
      .insertInto("academy_video_comment_moderation")
      .values({
        comment_id: commentId,
        video_id: videoId,
        is_hidden: 0,
        hidden_at: null,
        hidden_by_user_id: null,
        restored_at: now,
        restored_by_user_id: userId,
        updated_at: now,
      })
      .onDuplicateKeyUpdate({
        is_hidden: 0,
        restored_at: now,
        restored_by_user_id: userId,
        updated_at: now,
      })
      .execute();
  }
  return true;
}
