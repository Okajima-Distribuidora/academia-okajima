import "server-only";

import { getDb } from "@/lib/db";
import { decodeLegacyText, extractVimeoId } from "@/lib/home/catalog";
import type { StudioCategoryStats } from "@/lib/studio/categories/types";
import { getVimeoVideoPresentation } from "@/lib/vimeo/videos";
import { getWatchTimeDailyHistory, getWatchTimeReport } from "./watch-time";

type StudioVideoRow = {
  id: number;
  title: string;
  time: number;
  views: number;
  vimeo: string;
  video_location: string;
};

type PublishedVideoRow = {
  ready_at: Date;
};

export interface StudioStats {
  latestVideo: {
    title: string;
    views: number;
    likes: number;
    comments: number;
    averageViewMinutes: number;
    thumbnailUrl: string | null;
  } | null;
  summary: {
    views: number;
    watchHours: number;
    watchHistory: Array<{ date: string; watchHours: number }>;
    totalVideos: number;
    viewHistory: Array<{
      date: string;
      views: number;
    }>;
    publishedVideoHistory: Array<{
      date: string;
      rangeLabel: string;
      videos: number;
    }>;
    topVideos: Array<{
      id: number;
      title: string;
      views: number;
      thumbnailUrl: string | null;
    }>;
  };
}

const ANALYTICS_TIME_ZONE = "America/Sao_Paulo";
const VIEW_HISTORY_DAYS = 28;
const PUBLISHED_VIDEO_BUCKET_DAYS = 5;

function analyticsDate(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function listAnalyticsDates(now = new Date()): string[] {
  return Array.from({ length: VIEW_HISTORY_DAYS }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (VIEW_HISTORY_DAYS - index - 1));
    return analyticsDate(date);
  });
}

async function getStudioViewHistory(
  categoryId?: number,
): Promise<Array<{ date: string; views: number }>> {
  const now = new Date();
  const dates = listAnalyticsDates(now);
  const earliestSeconds = Math.floor(
    new Date(`${dates[0]}T00:00:00-03:00`).getTime() / 1000,
  );
  const rows = await getDb()
    .selectFrom("views")
    .innerJoin("videos", "videos.id", "views.video_id")
    .select("views.time")
    .where("views.time", ">=", earliestSeconds)
    .where("videos.converted", "!=", 2)
    .where("videos.privacy", "=", 0)
    .where("videos.is_movie", "=", 0)
    .where("videos.live_time", "=", 0)
    .where("videos.approved", "=", 1)
    .where("videos.upload_status", "=", "ready")
    .where("videos.deleted_at", "is", null)
    .where("videos.is_short", "=", 0)
    .$if(categoryId !== undefined, (query) =>
      query.where("videos.id", "in", categoryVideoIds(categoryId as number)),
    )
    .execute();
  const totals = new Map(dates.map((date) => [date, 0]));

  for (const row of rows) {
    const date = analyticsDate(new Date(row.time * 1000));
    totals.set(date, (totals.get(date) ?? 0) + 1);
  }

  return dates.map((date) => ({ date, views: totals.get(date) ?? 0 }));
}

function addAnalyticsDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return analyticsDate(new Date(Date.UTC(year, month - 1, day + days, 12)));
}

function formatAnalyticsRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: ANALYTICS_TIME_ZONE,
  });
  const start = formatter.format(new Date(`${startDate}T12:00:00Z`));
  const end = formatter.format(new Date(`${endDate}T12:00:00Z`));

  return `${start} – ${end}`;
}

function getStudioPublishedVideoHistory(
  videos: PublishedVideoRow[],
  now = new Date(),
): Array<{ date: string; rangeLabel: string; videos: number }> {
  const publishedDates = videos
    .map((video) => analyticsDate(video.ready_at))
    .filter((date) => date <= analyticsDate(now))
    .sort();
  const firstDate = publishedDates[0];
  const lastDate = analyticsDate(now);
  if (!firstDate) return [];

  const totals = new Map<string, number>();
  for (const date of publishedDates) {
    totals.set(date, (totals.get(date) ?? 0) + 1);
  }

  const history: Array<{ date: string; rangeLabel: string; videos: number }> =
    [];
  for (
    let startDate = firstDate;
    startDate <= lastDate;
    startDate = addAnalyticsDays(startDate, PUBLISHED_VIDEO_BUCKET_DAYS)
  ) {
    const endDate = addAnalyticsDays(
      startDate,
      PUBLISHED_VIDEO_BUCKET_DAYS - 1,
    );
    let videosInPeriod = 0;

    for (let day = startDate; day <= endDate; day = addAnalyticsDays(day, 1)) {
      videosInPeriod += totals.get(day) ?? 0;
    }

    history.push({
      date: startDate,
      rangeLabel: formatAnalyticsRange(startDate, endDate),
      videos: videosInPeriod,
    });
  }

  return history;
}

export function formatStudioNumber(value: number): string {
  const safeValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return new Intl.NumberFormat("pt-BR").format(safeValue);
}

export function formatStudioDecimal(value: number): string {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(safeValue);
}

async function listStudioVideos(
  categoryId?: number,
): Promise<StudioVideoRow[]> {
  return getDb()
    .selectFrom("videos")
    .select(["id", "title", "time", "views", "vimeo", "video_location"])
    .where("converted", "!=", 2)
    .where("privacy", "=", 0)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .where("approved", "=", 1)
    .where("upload_status", "=", "ready")
    .where("deleted_at", "is", null)
    .$if(categoryId !== undefined, (query) =>
      query
        .where("id", "in", categoryVideoIds(categoryId as number))
        .where("is_short", "=", 0),
    )
    .execute();
}

function categoryVideoIds(categoryId: number) {
  // IN avoids counting a video more than once across subcategories.
  return getDb()
    .selectFrom("academy_video_subcategories")
    .innerJoin(
      "academy_subcategories",
      "academy_subcategories.id",
      "academy_video_subcategories.subcategory_id",
    )
    .select("academy_video_subcategories.video_id")
    .where("academy_subcategories.category_id", "=", categoryId);
}

export async function getStudioCategoryStats(
  categoryId: number,
): Promise<StudioCategoryStats> {
  if (!Number.isSafeInteger(categoryId) || categoryId < 1)
    throw new Error("Categoria inválida.");
  const [videos, viewHistory, watchReport] = await Promise.all([
    listStudioVideos(categoryId),
    getStudioViewHistory(categoryId),
    getWatchTimeReport({ categoryId, publishedOnly: true }),
  ]);
  return {
    views: videos.reduce((total, video) => total + Math.max(0, video.views), 0),
    watchHours: watchReport.watchHours,
    totalVideos: videos.length,
    viewHistory,
  };
}

async function listPublishedVideos(): Promise<PublishedVideoRow[]> {
  return getDb()
    .selectFrom("videos")
    .select("ready_at")
    .where("converted", "!=", 2)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .where("upload_status", "=", "ready")
    .where("ready_at", "is not", null)
    .execute() as Promise<PublishedVideoRow[]>;
}

export async function getStudioStats(): Promise<StudioStats> {
  const [videos, viewHistory, publishedVideos, watchReport, watchHistory] =
    await Promise.all([
      listStudioVideos(),
      getStudioViewHistory(),
      listPublishedVideos(),
      getWatchTimeReport({ publishedOnly: true }),
      getWatchTimeDailyHistory({ publishedOnly: true }, listAnalyticsDates()),
    ]);
  const publishedVideoHistory = getStudioPublishedVideoHistory(publishedVideos);
  const latestVideo =
    [...videos].sort((a, b) => b.time - a.time || b.id - a.id)[0] ?? null;
  const topVideoRows = [...videos]
    .sort((a, b) => b.views - a.views || b.time - a.time || b.id - a.id)
    .slice(0, 5);
  const topVideos = await Promise.all(
    topVideoRows.map(async (video) => {
      const vimeoId = extractVimeoId(video.vimeo, video.video_location);
      const vimeo = vimeoId ? await getVimeoVideoPresentation(vimeoId) : null;

      return {
        id: video.id,
        title: decodeLegacyText(video.title.trim()),
        views: video.views,
        thumbnailUrl: vimeo?.thumbnailUrl ?? null,
      };
    }),
  );
  const latestVimeoId = latestVideo
    ? extractVimeoId(latestVideo.vimeo, latestVideo.video_location)
    : null;
  const latestVimeo = latestVimeoId
    ? await getVimeoVideoPresentation(latestVimeoId)
    : null;

  return {
    latestVideo: latestVideo
      ? {
          title: decodeLegacyText(latestVideo.title.trim()),
          views: latestVideo.views,
          likes: 0,
          comments: 0,
          averageViewMinutes: 0,
          thumbnailUrl: latestVimeo?.thumbnailUrl ?? null,
        }
      : null,
    summary: {
      views: videos.reduce(
        (total, video) => total + Math.max(0, video.views),
        0,
      ),
      watchHours: watchReport.watchHours,
      watchHistory,
      totalVideos: publishedVideos.length,
      viewHistory,
      publishedVideoHistory,
      topVideos,
    },
  };
}
