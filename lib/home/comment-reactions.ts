import "server-only";

import { getDb } from "@/lib/db";

export type CommentReaction = "like" | "dislike" | null;

export async function setCommentReaction({
  userId,
  commentId,
  reaction,
}: {
  userId: number;
  commentId: number;
  reaction: CommentReaction;
}): Promise<boolean> {
  const exists = await getDb()
    .selectFrom("comments")
    .select("id")
    .where("id", "=", commentId)
    .executeTakeFirst();
  if (!exists) return false;
  const now = new Date();
  await getDb()
    .transaction()
    .execute(async (trx) => {
      if (!reaction)
        return trx
          .deleteFrom("academy_video_comment_reactions")
          .where("user_id", "=", userId)
          .where("comment_id", "=", commentId)
          .execute();
      return trx
        .insertInto("academy_video_comment_reactions")
        .values({
          user_id: userId,
          comment_id: commentId,
          reaction,
          created_at: now,
          updated_at: now,
        })
        .onDuplicateKeyUpdate({ reaction, updated_at: now })
        .execute();
    });
  return true;
}

export async function setCommentReplyReaction({
  userId,
  replyId,
  reaction,
}: {
  userId: number;
  replyId: number;
  reaction: CommentReaction;
}): Promise<boolean> {
  const exists = await getDb()
    .selectFrom("academy_video_comment_replies")
    .select("id")
    .where("id", "=", replyId)
    .executeTakeFirst();
  if (!exists) return false;
  const now = new Date();
  await getDb()
    .transaction()
    .execute(async (trx) => {
      if (!reaction)
        return trx
          .deleteFrom("academy_video_comment_reply_reactions")
          .where("user_id", "=", userId)
          .where("reply_id", "=", replyId)
          .execute();
      return trx
        .insertInto("academy_video_comment_reply_reactions")
        .values({
          user_id: userId,
          reply_id: replyId,
          reaction,
          created_at: now,
          updated_at: now,
        })
        .onDuplicateKeyUpdate({ reaction, updated_at: now })
        .execute();
    });
  return true;
}
