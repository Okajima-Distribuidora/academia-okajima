import { IconVideo } from "@tabler/icons-react";
import Link from "next/link";

import { RecentVideoCardContent } from "@/components/home/recent-video-card-content";
import { VideoComments } from "@/components/home/video-comments";
import { VideoProgressPlayer } from "@/components/home/video-progress-player";
import { VideoReactions } from "@/components/home/video-reactions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { VideoWatchPage } from "@/lib/home/catalog";
import { videoWatchHref } from "@/lib/home/navigation";

interface WatchViewer {
  name: string;
  rca: string;
}

function initialsFrom(value: string, fallback = "AO") {
  return (
    Array.from(value.trim().replace(/\s+/g, ""))
      .slice(0, 2)
      .join("")
      .toUpperCase() || fallback
  );
}

function userInitials(viewer: WatchViewer) {
  return initialsFrom(viewer.name || viewer.rca, "US");
}

function RelatedVideos({ page }: { page: VideoWatchPage }) {
  return (
    <aside
      className="watch-related flex min-w-0 flex-col gap-4"
      aria-labelledby="related-videos-title"
    >
      <h2 id="related-videos-title" className="text-base font-semibold">
        Vídeos relacionados
      </h2>
      <Separator />
      {page.relatedVideos.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {page.relatedVideos.map((video) => (
            <li key={video.id}>
              <Link
                href={videoWatchHref(page.category, video)}
                className="watch-related-card"
                aria-label={`Abrir ${video.title}`}
              >
                <RecentVideoCardContent
                  video={video}
                  sizes="(max-width: 1023px) 46vw, 168px"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="min-h-52 flex-none py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconVideo aria-hidden="true" stroke={1.6} />
            </EmptyMedia>
            <EmptyTitle>Sem relacionados</EmptyTitle>
            <EmptyDescription>
              Outros vídeos desta categoria aparecerão aqui.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </aside>
  );
}

export function VideoWatchSkeleton() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="watch-page min-w-0 flex-1 p-4 outline-none sm:p-6 lg:p-8"
    >
      <div className="watch-layout">
        <div className="watch-primary">
          <section className="watch-main flex min-w-0 flex-col gap-5">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-7 w-5/6" />
              <div className="watch-video-toolbar">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="flex gap-0">
                  <Skeleton className="h-9 w-28 rounded-full" />
                  <Skeleton className="h-9 w-12 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
          </section>

          <section className="watch-comments flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-36" />
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="watch-related flex min-w-0 flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="aspect-video w-40 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}

export function VideoWatchContent({
  page,
  viewer,
  resumePositionSeconds,
  isStudioAdmin,
}: {
  page: VideoWatchPage;
  viewer: WatchViewer;
  resumePositionSeconds: number;
  isStudioAdmin: boolean;
}) {
  const categoryInitials = initialsFrom(page.category.label);
  const viewerInitials = userInitials(viewer);

  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="watch-page min-w-0 flex-1 p-4 outline-none sm:p-6 lg:p-8"
    >
      <div className="watch-layout">
        <div className="watch-primary">
          <section className="watch-main flex min-w-0 flex-col gap-5">
            <VideoProgressPlayer
              videoId={page.video.id}
              vimeoId={page.video.vimeoId!}
              title={page.video.title}
              resumePositionSeconds={resumePositionSeconds}
              isStudioAdmin={isStudioAdmin}
            />

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {page.video.title}
                </h1>
                <div className="watch-video-toolbar">
                  <div className="watch-category-summary">
                    <Avatar size="lg" aria-hidden="true">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {categoryInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="truncate text-base font-semibold uppercase">
                        {page.category.label}
                      </p>
                      {page.subcategories.length > 0 ? (
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          {page.subcategories.map((subcategory) => (
                            <Badge key={subcategory.id} variant="secondary">
                              {subcategory.label}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="watch-actions">
                    <VideoReactions
                      videoId={page.video.id}
                      initialLikesCount={page.likesCount}
                      initialReaction={page.viewerReaction}
                    />
                  </div>
                </div>
              </div>
            </div>

            <section className="watch-description">
              <p className="watch-description-meta">
                {page.video.viewsLabel} · {page.video.publishedLabel}
              </p>
              {page.video.description ? <p>{page.video.description}</p> : null}
            </section>
          </section>

          <VideoComments
            videoId={page.video.id}
            viewerInitials={viewerInitials}
            initialComments={page.comments}
            initialNextCursor={page.commentsNextCursor}
          />
        </div>

        <RelatedVideos page={page} />
      </div>
    </main>
  );
}
