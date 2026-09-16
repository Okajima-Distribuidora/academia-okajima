import "server-only";

import { getDb } from "@/lib/db";
import { decodeLegacyText, extractVimeoId } from "@/lib/home/catalog";
import { getVimeoVideoPresentation } from "@/lib/vimeo/videos";

type StudioVideoRow = {
  id: number;
  title: string;
  time: number;
  views: number;
  vimeo: string;
  video_location: string;
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
    totalVideos: number;
    topVideos: Array<{
      id: number;
      title: string;
      views: number;
      thumbnailUrl: string | null;
    }>;
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
    .select(["id", "title", "time", "views", "vimeo", "video_location"])
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
  const topVideoRows = [...videos]
    .sort((a, b) => b.views - a.views || b.time - a.time || b.id - a.id)
    .slice(0, 5);
  const topVideos = await Promise.all(topVideoRows.map(async (video) => {
    const vimeoId = extractVimeoId(video.vimeo, video.video_location);
    const vimeo = vimeoId ? await getVimeoVideoPresentation(vimeoId) : null;

    return {
      id: video.id,
      title: decodeLegacyText(video.title.trim()),
      views: video.views,
      thumbnailUrl: vimeo?.thumbnailUrl ?? null,
    };
  }));
  const latestVimeoId = latestVideo ? extractVimeoId(latestVideo.vimeo, latestVideo.video_location) : null;
  const latestVimeo = latestVimeoId ? await getVimeoVideoPresentation(latestVimeoId) : null;

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
      views: videos.reduce((total, video) => total + Math.max(0, video.views), 0),
      watchHours: 0,
      totalVideos: videos.length,
      topVideos,
    },
  };
}
