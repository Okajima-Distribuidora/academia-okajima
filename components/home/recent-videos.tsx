"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconVideo } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import type { RecentVideo } from "@/lib/home/catalog";
import { RecentVideoCardContent } from "./recent-video-card-content";

export function RecentVideos({
  videos,
  selectedVideoId,
  onSelect,
}: {
  videos: RecentVideo[];
  selectedVideoId: number;
  onSelect: (video: RecentVideo) => void;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollBackward, setCanScrollBackward] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const videoSetKey = videos.map((video) => video.id).join(":");

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    setCanScrollBackward(track.scrollLeft > 2);
    setCanScrollForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 2);
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
    const distance = cards[1] && cards[0]
      ? cards[1].offsetLeft - cards[0].offsetLeft
      : track.clientWidth * 0.8;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollBy({ left: distance * direction, behavior: reducedMotion ? "auto" : "smooth" });
  }

  if (videos.length === 0) return null;

  return (
    <section className="home-recent-videos" aria-labelledby="recent-videos-title">
      <div className="home-recent-heading flex items-center gap-2">
        <IconVideo aria-hidden="true" stroke={1.8} />
        <h2 id="recent-videos-title">Vídeos recentes</h2>
      </div>
      <div className="home-recent-carousel">
        <ul
          ref={trackRef}
          id="recent-videos-list"
          className="home-recent-track scroll-fade-x"
          aria-label="Lista de vídeos recentes"
        >
          {videos.map((video) => {
            const selected = selectedVideoId === video.id;

            return (
              <li key={video.id}>
                <button
                  type="button"
                  className="home-recent-card"
                  aria-label={`Reproduzir ${video.title}`}
                  aria-pressed={selected}
                  disabled={!video.vimeoId}
                  onClick={() => onSelect(video)}
                >
                  <RecentVideoCardContent video={video} />
                </button>
              </li>
            );
          })}
        </ul>
        {canScrollBackward ? (
          <Button
            type="button"
            variant="ghost"
            className="home-recent-control home-recent-previous h-[11.475rem] w-10 sm:h-[9.45rem]"
            aria-label="Mostrar vídeos recentes anteriores"
            aria-controls="recent-videos-list"
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
            aria-label="Mostrar mais vídeos recentes"
            aria-controls="recent-videos-list"
            onClick={() => scrollByCard(1)}
          >
            <IconChevronRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </section>
  );
}
