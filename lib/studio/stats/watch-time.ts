import "server-only";

import { type Kysely, sql } from "kysely";
import { getDb } from "@/lib/db";
import type { Database } from "@/lib/db/types";
import { HOUR_MS, hourStart } from "@/lib/home/watch-time-rules";

export interface WatchScope {
  videoId?: number;
  userId?: number;
  subcategoryId?: number;
  categoryId?: number;
  publishedOnly?: boolean;
}
export type WatchPeriod = "all" | "24h" | "7d" | "28d";

function scopedVideos(db: Kysely<Database>, scope: WatchScope) {
  let query = db.selectFrom("videos").select("videos.id");
  if (scope.videoId !== undefined)
    query = query.where("videos.id", "=", scope.videoId);
  if (scope.publishedOnly)
    query = query
      .where("converted", "!=", 2)
      .where("privacy", "=", 0)
      .where("is_movie", "=", 0)
      .where("live_time", "=", 0)
      .where("approved", "=", 1)
      .where("upload_status", "=", "ready")
      .where("deleted_at", "is", null)
      .where("is_short", "=", 0);
  if (scope.categoryId !== undefined || scope.subcategoryId !== undefined) {
    let links = db
      .selectFrom("academy_video_subcategories")
      .innerJoin(
        "academy_subcategories",
        "academy_subcategories.id",
        "academy_video_subcategories.subcategory_id",
      )
      .select("academy_video_subcategories.video_id");
    if (scope.categoryId !== undefined)
      links = links.where(
        "academy_subcategories.category_id",
        "=",
        scope.categoryId,
      );
    if (scope.subcategoryId !== undefined)
      links = links.where("academy_subcategories.id", "=", scope.subcategoryId);
    query = query.where("videos.id", "in", links);
  }
  return query;
}

export async function getWatchTimeReport(
  scope: WatchScope = {},
  period: WatchPeriod = "all",
  db: Kysely<Database> = getDb(),
  now = Date.now(),
) {
  const filtered =
    scope.publishedOnly ||
    scope.categoryId !== undefined ||
    scope.subcategoryId !== undefined;
  const end = hourStart(now);
  const hours = period === "24h" ? 24 : period === "7d" ? 168 : 672;
  const start = end - hours * HOUR_MS;
  const table =
    period === "all"
      ? "academy_video_watch_daily"
      : "academy_video_watch_hourly";
  let base = db.selectFrom(table);
  if (scope.userId !== undefined)
    base = base.where("user_id", "=", scope.userId);
  if (scope.videoId !== undefined)
    base = base.where("video_id", "=", scope.videoId);
  if (filtered) base = base.where("video_id", "in", scopedVideos(db, scope));
  // The current partial hour is excluded: these are explicitly closed hourly windows.
  if (period !== "all")
    base = base
      .where("hour_start_ms", ">=", start)
      .where("hour_start_ms", "<", end);
  const videos = await base
    .select(["video_id", sql<string>`sum(watched_ms)`.as("ms")])
    .groupBy("video_id")
    .execute();
  const totalMs = videos.reduce((sum, row) => sum + Number(row.ms), 0);
  return {
    period,
    from: period === "all" ? null : new Date(start).toISOString(),
    to:
      period === "all"
        ? new Date(now).toISOString()
        : new Date(end).toISOString(),
    precision: period === "all" ? "day" : "hour",
    timeZone: "America/Sao_Paulo",
    classification: "current",
    watchedMs: totalMs,
    watchHours: totalMs / HOUR_MS,
    videos: videos.map((row) => ({
      videoId: row.video_id,
      watchedMs: Number(row.ms),
      watchHours: Number(row.ms) / HOUR_MS,
    })),
  };
}

export async function getWatchTimeDailyHistory(
  scope: WatchScope,
  dates: string[],
  db: Kysely<Database> = getDb(),
) {
  if (!dates.length) return [];
  let query = db
    .selectFrom("academy_video_watch_daily")
    .select(["day", sql<string>`sum(watched_ms)`.as("ms")])
    .where("day", ">=", dates[0])
    .where("day", "<=", dates[dates.length - 1]);
  if (scope.videoId !== undefined)
    query = query.where("video_id", "=", scope.videoId);
  if (scope.userId !== undefined)
    query = query.where("user_id", "=", scope.userId);
  if (
    scope.publishedOnly ||
    scope.categoryId !== undefined ||
    scope.subcategoryId !== undefined
  )
    query = query.where("video_id", "in", scopedVideos(db, scope));
  const rows = await query.groupBy("day").execute();
  const totals = new Map(
    rows.map((row) => [row.day, Number(row.ms) / HOUR_MS]),
  );
  return dates.map((date) => ({ date, watchHours: totals.get(date) ?? 0 }));
}
