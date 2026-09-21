import "server-only";

import { getDb } from "@/lib/db";

import type { VideoReaction, VideoReactionState } from "./video-reaction-rules";

export interface VideoReactionSummary {
  likesCount: number;
  viewerReaction: VideoReactionState;
}

function availableVideoQuery(videoId: number) {
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
    .where("is_short", "=", 0);
}

export async function getVideoReactionSummary({
  videoId,
  userId,
}: {
  videoId: number;
  userId: number;
}): Promise<VideoReactionSummary> {
  const [currentLikes, viewerReaction] = await Promise.all([
    getDb()
      .selectFrom("academy_video_reactions")
      .select(({ fn }) => fn.countAll<number>().as("total"))
      .where("video_id", "=", videoId)
      .where("reaction", "=", "like")
      .executeTakeFirst(),
    getDb()
      .selectFrom("academy_video_reactions")
      .select("reaction")
      .where("video_id", "=", videoId)
      .where("user_id", "=", userId)
      .executeTakeFirst(),
  ]);

  return {
    likesCount: Number(currentLikes?.total ?? 0),
    viewerReaction: viewerReaction?.reaction ?? null,
  };
}

export async function setVideoReaction({
  userId,
  videoId,
  reaction,
}: {
  userId: number;
  videoId: number;
  reaction: VideoReactionState;
}): Promise<VideoReactionSummary | null> {
  const video = await availableVideoQuery(videoId).executeTakeFirst();
  if (!video) return null;

  const now = new Date();
  await getDb()
    .transaction()
    .execute(async (trx) => {
      if (!reaction) {
        await trx
          .deleteFrom("academy_video_reactions")
          .where("user_id", "=", userId)
          .where("video_id", "=", videoId)
          .execute();
        return;
      }

      await trx
        .insertInto("academy_video_reactions")
        .values({
          user_id: userId,
          video_id: videoId,
          reaction,
          created_at: now,
          updated_at: now,
        })
        .onDuplicateKeyUpdate({ reaction, updated_at: now })
        .execute();
    });

  return getVideoReactionSummary({ videoId, userId });
}
