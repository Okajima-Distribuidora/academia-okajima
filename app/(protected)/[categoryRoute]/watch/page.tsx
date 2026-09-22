import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VideoWatchContent } from "@/components/home/video-watch-content";
import { requireUser } from "@/lib/auth/session";
import {
  getVideoWatchPage,
  normalizeCategoryRoute,
  normalizeVimeoWatchId,
} from "@/lib/home/catalog";
import { getVideoProgress } from "@/lib/home/video-progress";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[categoryRoute]/watch">): Promise<Metadata> {
  const [{ categoryRoute }, query] = await Promise.all([params, searchParams]);
  const categorySlug = normalizeCategoryRoute(categoryRoute);
  const vimeoId = normalizeVimeoWatchId(
    Array.isArray(query.v) ? query.v[0] : query.v,
  );
  if (!categorySlug || !vimeoId) return { title: "Vídeo" };

  const page = await getVideoWatchPage(categorySlug, vimeoId);
  return { title: page?.video.title ?? "Vídeo" };
}

export default async function VideoWatchRoute({
  params,
  searchParams,
}: PageProps<"/[categoryRoute]/watch">) {
  const [{ categoryRoute }, query] = await Promise.all([params, searchParams]);
  const categorySlug = normalizeCategoryRoute(categoryRoute);
  const vimeoId = normalizeVimeoWatchId(
    Array.isArray(query.v) ? query.v[0] : query.v,
  );
  const autoPlay =
    (Array.isArray(query.autoplay) ? query.autoplay[0] : query.autoplay) ===
    "1";
  if (!categorySlug || !vimeoId) notFound();

  const user = await requireUser();
  const page = await getVideoWatchPage(
    categorySlug,
    vimeoId,
    Number(user.id),
    user.isStudioAdmin,
  );
  if (!page) notFound();

  const progress = await getVideoProgress({
    userId: Number(user.id),
    videoId: page.video.id,
  });

  return (
    <VideoWatchContent
      page={page}
      viewer={{ name: user.name, rca: user.codigorca }}
      resumePositionSeconds={progress?.resumePositionSeconds ?? 0}
      isStudioAdmin={user.isStudioAdmin}
      autoPlay={autoPlay}
    />
  );
}
