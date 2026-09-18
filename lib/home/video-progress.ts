import "server-only";

import { sql } from "kysely";

import { getDb } from "@/lib/db";
import {
  calculateModuleProgress,
  type ModuleProgress,
} from "./module-progress";
import {
  isVideoCompleted,
  normalizeVideoCheckpoint,
} from "./video-progress-rules";

export interface VideoProgressSnapshot {
  resumePositionSeconds: number;
  furthestPositionSeconds: number;
  completedAt: Date | null;
}

export interface CategoryProgressOverview {
  category: ModuleProgress;
  subcategories: Array<{
    subcategoryId: number;
    progress: ModuleProgress;
  }>;
}

export async function getModuleProgress({
  userId,
  categoryId,
}: {
  userId: number;
  categoryId: number;
}): Promise<ModuleProgress> {
  const row = await getDb()
    .selectFrom("academy_video_subcategories")
    .innerJoin(
      "academy_subcategories",
      "academy_subcategories.id",
      "academy_video_subcategories.subcategory_id",
    )
    .innerJoin("videos", "videos.id", "academy_video_subcategories.video_id")
    .leftJoin("academy_video_progress", (join) =>
      join
        .onRef("academy_video_progress.video_id", "=", "videos.id")
        .on("academy_video_progress.user_id", "=", userId),
    )
    .select([
      sql<number>`count(distinct ${sql.ref("videos.id")})`.as("totalLessons"),
      sql<number>`count(distinct case when ${sql.ref("academy_video_progress.completed_at")} is not null then ${sql.ref("videos.id")} end)`.as(
        "completedLessons",
      ),
    ])
    .where("academy_subcategories.category_id", "=", categoryId)
    .where("academy_subcategories.is_active", "=", 1)
    .where("videos.converted", "!=", 2)
    .where("videos.privacy", "=", 0)
    .where("videos.is_movie", "=", 0)
    .where("videos.live_time", "=", 0)
    .where("videos.approved", "=", 1)
    .where("videos.upload_status", "=", "ready")
    .where("videos.deleted_at", "is", null)
    .where("videos.is_short", "=", 0)
    .executeTakeFirst();

  return calculateModuleProgress(
    Number(row?.completedLessons ?? 0),
    Number(row?.totalLessons ?? 0),
  );
}

export async function getCategoryProgressOverview({
  userId,
  categoryId,
}: {
  userId: number;
  categoryId: number;
}): Promise<CategoryProgressOverview> {
  const [category, subcategories] = await Promise.all([
    getModuleProgress({ userId, categoryId }),
    getDb()
      .selectFrom("academy_subcategories")
      .innerJoin(
        "academy_video_subcategories",
        "academy_video_subcategories.subcategory_id",
        "academy_subcategories.id",
      )
      .innerJoin("videos", "videos.id", "academy_video_subcategories.video_id")
      .leftJoin("academy_video_progress", (join) =>
        join
          .onRef("academy_video_progress.video_id", "=", "videos.id")
          .on("academy_video_progress.user_id", "=", userId),
      )
      .select([
        "academy_subcategories.id as subcategoryId",
        sql<number>`count(distinct ${sql.ref("videos.id")})`.as("totalLessons"),
        sql<number>`count(distinct case when ${sql.ref("academy_video_progress.completed_at")} is not null then ${sql.ref("videos.id")} end)`.as(
          "completedLessons",
        ),
      ])
      .where("academy_subcategories.category_id", "=", categoryId)
      .where("academy_subcategories.is_active", "=", 1)
      .where("videos.converted", "!=", 2)
      .where("videos.privacy", "=", 0)
      .where("videos.is_movie", "=", 0)
      .where("videos.live_time", "=", 0)
      .where("videos.approved", "=", 1)
      .where("videos.upload_status", "=", "ready")
      .where("videos.deleted_at", "is", null)
      .where("videos.is_short", "=", 0)
      .groupBy("academy_subcategories.id")
      .execute(),
  ]);

  return {
    category,
    subcategories: subcategories.map((subcategory) => ({
      subcategoryId: subcategory.subcategoryId,
      progress: calculateModuleProgress(
        Number(subcategory.completedLessons),
        Number(subcategory.totalLessons),
      ),
    })),
  };
}

export async function getVideoProgress({
  userId,
  videoId,
}: {
  userId: number;
  videoId: number;
}): Promise<VideoProgressSnapshot | null> {
  const row = await getDb()
    .selectFrom("academy_video_progress")
    .select([
      "resume_position_seconds",
      "furthest_position_seconds",
      "completed_at",
    ])
    .where("user_id", "=", userId)
    .where("video_id", "=", videoId)
    .executeTakeFirst();

  if (!row) return null;

  return {
    resumePositionSeconds: row.resume_position_seconds,
    furthestPositionSeconds: row.furthest_position_seconds,
    completedAt: row.completed_at,
  };
}

export async function saveVideoProgress({
  userId,
  videoId,
  positionSeconds,
  durationSeconds,
}: {
  userId: number;
  videoId: number;
  positionSeconds: number;
  durationSeconds: number;
}): Promise<VideoProgressSnapshot | null> {
  const checkpoint = normalizeVideoCheckpoint({
    positionSeconds,
    durationSeconds,
  });
  if (!checkpoint) return null;

  const now = new Date();
  const completesAt = isVideoCompleted(
    checkpoint.positionSeconds,
    checkpoint.durationSeconds,
  )
    ? now
    : null;

  await getDb()
    .insertInto("academy_video_progress")
    .values({
      user_id: userId,
      video_id: videoId,
      resume_position_seconds: checkpoint.positionSeconds,
      furthest_position_seconds: checkpoint.positionSeconds,
      completed_at: completesAt,
      last_watched_at: now,
      created_at: now,
      updated_at: now,
    })
    .onDuplicateKeyUpdate({
      resume_position_seconds: checkpoint.positionSeconds,
      furthest_position_seconds: sql<number>`greatest(furthest_position_seconds, values(furthest_position_seconds))`,
      completed_at: sql<Date | null>`coalesce(completed_at, case when values(furthest_position_seconds) / ${checkpoint.durationSeconds} >= 0.95 then values(updated_at) else null end)`,
      last_watched_at: now,
      updated_at: now,
    })
    .execute();

  return getVideoProgress({ userId, videoId });
}
