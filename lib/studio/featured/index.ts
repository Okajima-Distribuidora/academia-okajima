import "server-only";

import { sql } from "kysely";

import { getDb } from "@/lib/db";
import { decodeLegacyText, extractVimeoId } from "@/lib/home/catalog";
import { formatStudioContentDate } from "@/lib/studio/content";
import { formatStudioNumber } from "@/lib/studio/stats";
import { getVimeoVideoPresentation } from "@/lib/vimeo/videos";

export const HOME_FEATURED_COUNT_CONFIG = "home_featured_count";
export const HOME_FEATURED_INTERVAL_CONFIG = "home_featured_interval_seconds";
export const HOME_FEATURED_SELECTION_CONFIG = "home_featured_selection_saved";
export const DEFAULT_HOME_FEATURED_COUNT = 3;
export const DEFAULT_HOME_FEATURED_INTERVAL_SECONDS = 8;
export const MIN_HOME_FEATURED_COUNT = 1;
export const MAX_HOME_FEATURED_COUNT = 5;
export const MIN_HOME_FEATURED_INTERVAL_SECONDS = 3;
export const MAX_HOME_FEATURED_INTERVAL_SECONDS = 15;

export interface StudioFeaturedSettings {
  count: number;
  intervalSeconds: number;
}

export interface StudioFeaturedVideo {
  id: number;
  publicId: string;
  title: string;
  description: string;
  duration: string;
  sortDate: number;
  dateLabel: string;
  viewsLabel: string;
  featuredOrder: number;
  thumbnailUrl: string | null;
}

function clampInteger(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isSafeInteger(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function readFormNumber(
  formData: FormData,
  key: string,
  min: number,
  max: number,
  fallback: number,
): number {
  const value = formData.get(key);
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;

  return clampInteger(parsed, min, max, fallback);
}

async function readConfigNumber(
  name: string,
  min: number,
  max: number,
  fallback: number,
): Promise<number> {
  const row = await getDb()
    .selectFrom("config")
    .select("value")
    .where("name", "=", name)
    .orderBy("id", "asc")
    .executeTakeFirst();
  const parsed = Number.parseInt(row?.value ?? "", 10);

  return clampInteger(parsed, min, max, fallback);
}

export async function getStudioFeaturedSettings(): Promise<StudioFeaturedSettings> {
  const [count, intervalSeconds] = await Promise.all([
    readConfigNumber(
      HOME_FEATURED_COUNT_CONFIG,
      MIN_HOME_FEATURED_COUNT,
      MAX_HOME_FEATURED_COUNT,
      DEFAULT_HOME_FEATURED_COUNT,
    ),
    readConfigNumber(
      HOME_FEATURED_INTERVAL_CONFIG,
      MIN_HOME_FEATURED_INTERVAL_SECONDS,
      MAX_HOME_FEATURED_INTERVAL_SECONDS,
      DEFAULT_HOME_FEATURED_INTERVAL_SECONDS,
    ),
  ]);

  return { count, intervalSeconds };
}

export function publicFeaturedVideosQuery() {
  return getDb()
    .selectFrom("videos")
    .where("videos.converted", "!=", 2)
    .where("videos.privacy", "=", 0)
    .where("videos.is_movie", "=", 0)
    .where("videos.live_time", "=", 0)
    .where("videos.approved", "=", 1)
    .where("videos.upload_status", "=", "ready")
    .where("videos.deleted_at", "is", null)
    .where("videos.is_short", "=", 0);
}

export async function listStudioFeaturedVideos(): Promise<
  StudioFeaturedVideo[]
> {
  const selectionSaved = await getDb()
    .selectFrom("config")
    .select("id")
    .where("name", "=", HOME_FEATURED_SELECTION_CONFIG)
    .executeTakeFirst();
  const rows = await publicFeaturedVideosQuery()
    .select([
      "videos.id",
      "videos.video_id",
      "videos.title",
      "videos.description",
      "videos.duration",
      "videos.vimeo",
      "videos.video_location",
      "videos.publication_date",
      "videos.time",
      "videos.views",
      "videos.featured",
    ])
    .orderBy(
      sql<number>`case when ${sql.ref("videos.featured")} > 0 then 0 else 1 end`,
      "asc",
    )
    .orderBy("videos.featured", "asc")
    .orderBy(
      sql<number>`greatest(${sql.ref("videos.publication_date")}, ${sql.ref("videos.time")})`,
      "desc",
    )
    .orderBy("videos.id", "desc")
    .execute();

  return Promise.all(
    rows.map(async (video) => {
      const vimeoId = extractVimeoId(video.vimeo, video.video_location);
      const vimeo = vimeoId ? await getVimeoVideoPresentation(vimeoId) : null;
      const date = Math.max(video.publication_date, video.time);

      return {
        id: video.id,
        publicId: video.video_id,
        title: decodeLegacyText(video.title.trim()) || "Sem título",
        description:
          decodeLegacyText(video.description?.trim() ?? "") || "Sem descrição",
        duration: video.duration.trim(),
        sortDate: date,
        dateLabel: formatStudioContentDate(date),
        viewsLabel: formatStudioNumber(video.views),
        featuredOrder: selectionSaved ? Math.max(0, video.featured) : 0,
        thumbnailUrl: vimeo?.thumbnailUrl ?? null,
      };
    }),
  );
}

async function setConfigValue(name: string, value: string): Promise<void> {
  const db = getDb();
  const rows = await db
    .selectFrom("config")
    .select("id")
    .where("name", "=", name)
    .orderBy("id", "asc")
    .execute();

  if (rows.length === 0) {
    await db.insertInto("config").values({ name, value }).executeTakeFirst();
    return;
  }

  const [first, ...duplicates] = rows;
  await db
    .updateTable("config")
    .set({ value })
    .where("id", "=", first.id)
    .executeTakeFirst();

  if (duplicates.length > 0) {
    await db
      .deleteFrom("config")
      .where("name", "=", name)
      .where(
        "id",
        "in",
        duplicates.map((row) => row.id),
      )
      .execute();
  }
}

export async function updateStudioFeaturedSettings(
  formData: FormData,
): Promise<void> {
  const count = readFormNumber(
    formData,
    "count",
    MIN_HOME_FEATURED_COUNT,
    MAX_HOME_FEATURED_COUNT,
    DEFAULT_HOME_FEATURED_COUNT,
  );
  const intervalSeconds = readFormNumber(
    formData,
    "intervalSeconds",
    MIN_HOME_FEATURED_INTERVAL_SECONDS,
    MAX_HOME_FEATURED_INTERVAL_SECONDS,
    DEFAULT_HOME_FEATURED_INTERVAL_SECONDS,
  );

  await Promise.all([
    setConfigValue(HOME_FEATURED_COUNT_CONFIG, String(count)),
    setConfigValue(HOME_FEATURED_INTERVAL_CONFIG, String(intervalSeconds)),
  ]);
}

function readSelectedVideoIds(formData: FormData): number[] {
  const rawValue = formData.get("videoIds");
  const ids =
    typeof rawValue === "string"
      ? rawValue.split(",").map((value) => Number.parseInt(value, 10))
      : [];
  const uniqueIds = new Set<number>();

  for (const id of ids) {
    if (Number.isSafeInteger(id) && id > 0) {
      uniqueIds.add(id);
    }
    if (uniqueIds.size >= MAX_HOME_FEATURED_COUNT) break;
  }

  return [...uniqueIds];
}

export async function updateStudioFeaturedVideos(
  formData: FormData,
): Promise<void> {
  const selectedIds = readSelectedVideoIds(formData);
  const db = getDb();
  const publicRows =
    selectedIds.length > 0
      ? await publicFeaturedVideosQuery()
          .select("videos.id")
          .where("videos.id", "in", selectedIds)
          .execute()
      : [];
  const publicIds = new Set(publicRows.map((row) => row.id));
  const safeIds = selectedIds.filter((id) => publicIds.has(id));

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable("videos")
      .set({ featured: 0 })
      .where("converted", "!=", 2)
      .where("is_movie", "=", 0)
      .where("live_time", "=", 0)
      .where("is_short", "=", 0)
      .where("featured", ">", 0)
      .execute();

    for (const [index, id] of safeIds.entries()) {
      await trx
        .updateTable("videos")
        .set({ featured: index + 1 })
        .where("id", "=", id)
        .where("privacy", "=", 0)
        .where("approved", "=", 1)
        .where("upload_status", "=", "ready")
        .where("deleted_at", "is", null)
        .where("converted", "!=", 2)
        .where("is_movie", "=", 0)
        .where("live_time", "=", 0)
        .where("is_short", "=", 0)
        .executeTakeFirst();
    }
  });
  await setConfigValue(HOME_FEATURED_SELECTION_CONFIG, "1");
}
