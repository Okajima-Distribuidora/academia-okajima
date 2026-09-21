"use client";

import {
  IconChevronLeft,
  IconChevronRight,
  IconTag,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { RecentVideoCardContent } from "@/components/home/recent-video-card-content";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import type { RecentVideo } from "@/lib/home/catalog";
import type { ModuleProgress } from "@/lib/home/module-progress";
import { videoWatchHref } from "@/lib/home/navigation";
import { cn } from "@/lib/utils";

interface HeadingIconProps {
  "aria-hidden"?: boolean | "true" | "false";
  stroke?: number;
}

export function VideoCarousel({
  headingId,
  listId,
  title,
  description,
  HeadingIcon = IconTag,
  videos,
  categorySlug,
  progress,
  progressClassName,
  destination = "watch",
}: {
  headingId: string;
  listId: string;
  title: string;
  description?: string | null;
  HeadingIcon?: ComponentType<HeadingIconProps>;
  videos: RecentVideo[];
  categorySlug: string;
  progress?: ModuleProgress;
  progressClassName?: string;
  destination?: "watch" | "studio";
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollBackward, setCanScrollBackward] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const videoSetKey = videos.map((video) => video.id).join(":");

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    setCanScrollBackward(track.scrollLeft > 2);
    setCanScrollForward(
      track.scrollLeft + track.clientWidth < track.scrollWidth - 2,
    );
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(track);
    track.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();

    return () => {
      resizeObserver.disconnect();
      track.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollTo({ left: 0 });
    requestAnimationFrame(updateScrollState);
  }, [updateScrollState, videoSetKey]);

  function scrollByCard(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;

    const cards = track.querySelectorAll<HTMLElement>(":scope > li");
    const distance =
      cards[1] && cards[0]
        ? cards[1].offsetLeft - cards[0].offsetLeft
        : track.clientWidth * 0.8;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    const nextScrollLeft = Math.min(
      maxScrollLeft,
      Math.max(0, track.scrollLeft + distance * direction),
    );
    const remainingDistance =
      direction === 1
        ? maxScrollLeft - nextScrollLeft
        : nextScrollLeft;
    const targetScrollLeft =
      remainingDistance < distance
        ? direction === 1
          ? maxScrollLeft
          : 0
        : nextScrollLeft;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    track.scrollTo({
      left: targetScrollLeft,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  if (videos.length === 0) return null;

  return (
    <section className="home-recent-videos" aria-labelledby={headingId}>
      <div className="home-recent-heading">
        <span className="home-recent-heading-icon" aria-hidden="true">
          <HeadingIcon stroke={1.8} />
        </span>
        <div className="home-recent-heading-copy">
          <h2 id={headingId} className="home-recent-heading-title">
            {title}
          </h2>
          {description ? (
            <p className="home-recent-heading-description">{description}</p>
          ) : null}
        </div>
      </div>
      {progress && progress.totalLessons > 0 ? (
        <Progress
          value={progress.percentage}
          className={cn("mb-3 max-w-md", progressClassName)}
        >
          <ProgressLabel>
            {progress.completedLessons} de {progress.totalLessons} aulas
            concluídas
          </ProgressLabel>
          <ProgressValue />
        </Progress>
      ) : null}
      <div className="home-recent-carousel">
        <ul
          ref={trackRef}
          id={listId}
          className="home-recent-track scroll-fade-x"
          aria-label={`Lista de vídeos: ${title}`}
        >
          {videos.map((video) => (
            <li key={video.id}>
              <Link
                href={
                  destination === "studio"
                    ? `/studio/conteudo/${encodeURIComponent(video.publicId)}`
                    : videoWatchHref({ slug: categorySlug }, video)
                }
                className="home-recent-card"
                aria-label={`Abrir ${video.title}`}
                aria-disabled={destination === "watch" && !video.vimeoId}
              >
                <RecentVideoCardContent video={video} />
              </Link>
            </li>
          ))}
        </ul>
        {canScrollBackward ? (
          <Button
            type="button"
            variant="ghost"
            className="home-recent-control home-recent-previous h-[11.475rem] w-10 sm:h-[9.45rem]"
            aria-label={`Mostrar vídeos anteriores de ${title}`}
            aria-controls={listId}
            onClick={() => scrollByCard(-1)}
          >
            <IconChevronLeft data-icon="inline-start" aria-hidden="true" />
          </Button>
        ) : null}
        {canScrollForward ? (
          <Button
            type="button"
            variant="ghost"
            className="home-recent-control home-recent-next h-[11.475rem] w-10 sm:h-[9.45rem]"
            aria-label={`Mostrar mais vídeos de ${title}`}
            aria-controls={listId}
            onClick={() => scrollByCard(1)}
          >
            <IconChevronRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </section>
  );
}
