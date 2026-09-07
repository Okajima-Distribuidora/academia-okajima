import "server-only";

import { getDb } from "@/lib/db";
import { decodeLegacyText } from "@/lib/home/catalog";

type StudioVideoRow = {
  id: number;
  title: string;
  time: number;
  views: number;
};

export interface StudioStats {
  latestVideo: {
    title: string;
    views: number;
    likes: number;
    comments: number;
    averageViewMinutes: number;
  } | null;
  summary: {
    views: number;
    watchHours: number;
    totalVideos: number;
    mostViewedVideoTitle: string | null;
  };
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

async function listStudioVideos(): Promise<StudioVideoRow[]> {
  return getDb().selectFrom("videos")
    .select(["id", "title", "time", "views"])
    .where("converted", "!=", 2)
    .where("privacy", "=", 0)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .where("approved", "=", 1)
    .execute();
}

export async function getStudioStats(): Promise<StudioStats> {
  const videos = await listStudioVideos();
  const latestVideo = [...videos].sort((a, b) => b.time - a.time || b.id - a.id)[0] ?? null;
  const mostViewedVideo = [...videos].sort((a, b) => b.views - a.views || b.time - a.time || b.id - a.id)[0] ?? null;

  return {
    latestVideo: latestVideo
      ? {
        title: decodeLegacyText(latestVideo.title.trim()),
        views: latestVideo.views,
        likes: 0,
        comments: 0,
        averageViewMinutes: 0,
      }
      : null,
    summary: {
      views: videos.reduce((total, video) => total + Math.max(0, video.views), 0),
      watchHours: 0,
      totalVideos: videos.length,
      mostViewedVideoTitle: mostViewedVideo ? decodeLegacyText(mostViewedVideo.title.trim()) : null,
    },
  };
}
