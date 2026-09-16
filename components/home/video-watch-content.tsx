import { IconThumbDown, IconThumbUp, IconVideo } from "@tabler/icons-react";
import Link from "next/link";

import { CommentTextArea } from "@/components/home/comment-text-area";
import { RecentVideoCardContent } from "@/components/home/recent-video-card-content";
import { VideoProgressPlayer } from "@/components/home/video-progress-player";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
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
                    <ButtonGroup
                      className="watch-reaction-group"
                      aria-label="Avaliar vídeo"
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="watch-reaction-like"
                      >
                        <IconThumbUp
                          data-icon="inline-start"
                          aria-hidden="true"
                        />
                        {page.likesLabel}
                      </Button>
                      <ButtonGroupSeparator />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-lg"
                        className="watch-reaction-dislike"
                        aria-label="Não gostei"
                      >
                        <IconThumbDown aria-hidden="true" />
                      </Button>
                    </ButtonGroup>
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

          <section
            className="watch-comments flex min-w-0 flex-col gap-5"
            aria-labelledby="watch-comments-title"
          >
            <div className="flex items-center gap-2">
              <h2
                id="watch-comments-title"
                className="text-xl font-semibold tracking-tight"
              >
                {page.commentsLabel}
              </h2>
            </div>

            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {viewerInitials}
                </AvatarFallback>
              </Avatar>
              <form className="flex min-w-0 flex-1 flex-col gap-3">
                <CommentTextArea />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost">
                    Cancelar
                  </Button>
                  <Button type="button">Comentar</Button>
                </div>
              </form>
            </div>

            {page.comments.length > 0 ? (
              <ul className="flex flex-col gap-5" aria-label="Comentários">
                {page.comments.map((comment) => (
                  <li key={comment.id} className="flex gap-3">
                    <Avatar>
                      <AvatarFallback>{comment.authorInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-sm font-semibold">
                        {comment.authorName}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {comment.publishedLabel}
                        </span>
                      </p>
                      <p className="text-sm leading-6">{comment.text}</p>
                      <span className="text-xs font-medium text-muted-foreground">
                        {comment.likesLabel}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        <RelatedVideos page={page} />
      </div>
    </main>
  );
}
