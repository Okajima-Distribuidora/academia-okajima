import "server-only";

import { getDb } from "@/lib/db";

import { formatPublishedAt, formatViews, type VideoComment } from "./catalog";
import { normalizeVideoCommentText } from "./video-comment-rules";

export const VIDEO_COMMENT_POST_LIMIT = 10;
const VIDEO_COMMENT_POST_WINDOW_MS = 24 * 60 * 60 * 1_000;

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
    .transaction()
    .execute(async (trx) => {
      await consumeCommentPostQuota(trx, userId);
      return trx
        .insertInto("comments")
        .values({
          user_id: userId,
          video_id: videoId,
          post_id: 0,
          activity_id: 0,
          text,
          time,
          pinned: "0",
          likes: 0,
          dis_likes: 0,
        })
        .executeTakeFirstOrThrow();
    });

  return {
    id: Number(result.insertId),
    authorName,
    authorInitials: initialsFrom(authorName),
    text,
    publishedLabel: formatPublishedAt(time),
    likesLabel: "0 likes",
    likesCount: 0,
    dislikesCount: 0,
    viewerReaction: null,
    isPinned: false,
    isHidden: false,
    replies: [],
  };
}

export async function createVideoCommentReply({
  userId,
  authorName,
  videoId,
  commentId,
  parentReplyId,
  text: rawText,
}: {
  userId: number;
  authorName: string;
  videoId: number;
  commentId: number;
  parentReplyId?: number | null;
  text: string;
}) {
  const text = normalizeVideoCommentText(rawText);
  if (!text || !(await isPublicVideo(videoId))) return null;
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const comment = await trx
        .selectFrom("comments")
        .select("id")
        .where("id", "=", commentId)
        .where("video_id", "=", videoId)
        .executeTakeFirst();
      if (!comment) return null;
      if (parentReplyId) {
        const parent = await trx
          .selectFrom("academy_video_comment_replies")
          .select("id")
          .where("id", "=", parentReplyId)
          .where("comment_id", "=", commentId)
          .where("video_id", "=", videoId)
          .executeTakeFirst();
        if (!parent) return null;
      }
      await consumeCommentPostQuota(trx, userId);
      return trx
        .insertInto("academy_video_comment_replies")
        .values({
          comment_id: commentId,
          parent_reply_id: parentReplyId ?? null,
          user_id: userId,
          video_id: videoId,
          text,
          created_at: new Date(),
        })
        .executeTakeFirstOrThrow();
    });
  if (!result) return null;
  return {
    id: Number(result.insertId),
    commentId,
    parentReplyId: parentReplyId ?? null,
    authorName,
    authorInitials: initialsFrom(authorName),
    replyToAuthorName: null,
    text,
    publishedLabel: "agora",
    likesCount: 0,
    dislikesCount: 0,
    viewerReaction: null,
  };
}

async function consumeCommentPostQuota(
  trx: ReturnType<typeof getDb>,
  userId: number,
) {
  const now = new Date();
  await trx
    .insertInto("academy_video_comment_post_rate_limits")
    .values({
      user_id: userId,
      window_started_at: now,
      post_count: 0,
      updated_at: now,
    })
    .onDuplicateKeyUpdate({ user_id: userId })
    .execute();
  const current = await trx
    .selectFrom("academy_video_comment_post_rate_limits")
    .selectAll()
    .where("user_id", "=", userId)
    .forUpdate()
    .executeTakeFirst();
  if (!current)
    throw new Error("Não foi possível registrar o limite de comentários.");
  const elapsed = now.getTime() - current.window_started_at.getTime();
  if (elapsed >= VIDEO_COMMENT_POST_WINDOW_MS) {
    await trx
      .updateTable("academy_video_comment_post_rate_limits")
      .set({ window_started_at: now, post_count: 1, updated_at: now })
      .where("user_id", "=", userId)
      .execute();
    return;
  }
  if (current.post_count >= VIDEO_COMMENT_POST_LIMIT)
    throw new CommentPostLimitError();
  await trx
    .updateTable("academy_video_comment_post_rate_limits")
    .set({ post_count: current.post_count + 1, updated_at: now })
    .where("user_id", "=", userId)
    .execute();
}

export class CommentPostLimitError extends Error {
  constructor() {
    super("Você atingiu o limite de 10 comentários nas últimas 24 horas.");
  }
}
