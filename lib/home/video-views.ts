import "server-only";

import { sql } from "kysely";

import { getDb } from "@/lib/db";

export const VIDEO_VIEW_COOLDOWN_SECONDS = 24 * 60 * 60;

export async function recordVideoView({
  userId,
  videoId,
  nowSeconds = Math.floor(Date.now() / 1000),
}: {
  userId: number;
  videoId: number;
  nowSeconds?: number;
}): Promise<{ counted: boolean; totalViews: number } | null> {
  const cutoffSeconds = nowSeconds - VIDEO_VIEW_COOLDOWN_SECONDS;

  return getDb()
    .transaction()
    .execute(async (trx) => {
      const video = await trx
        .selectFrom("videos")
        .select(["id", "views"])
        .where("id", "=", videoId)
        .where("converted", "!=", 2)
        .where("privacy", "=", 0)
        .where("is_movie", "=", 0)
        .where("live_time", "=", 0)
        .where("approved", "=", 1)
        .where("is_short", "=", 0)
        .forUpdate()
        .executeTakeFirst();
      if (!video) return null;

      const recentView = await trx
        .selectFrom("views")
        .select("id")
        .where("video_id", "=", videoId)
        .where("user_id", "=", userId)
        .where("time", ">", cutoffSeconds)
        .limit(1)
        .executeTakeFirst();
      if (recentView) {
        return { counted: false, totalViews: Math.max(0, video.views) };
      }

      await trx
        .insertInto("views")
        .values({ video_id: videoId, user_id: userId, time: nowSeconds })
        .execute();
      await trx
        .updateTable("videos")
        .set({ views: sql<number>`views + 1` })
        .where("id", "=", videoId)
        .execute();

      return { counted: true, totalViews: Math.max(0, video.views) + 1 };
    });
}
