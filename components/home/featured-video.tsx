"use client";

import { IconPlayerPlay } from "@tabler/icons-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import type { FeaturedVideo as FeaturedVideoData } from "@/lib/home/catalog";
import { videoWatchHref } from "@/lib/home/navigation";
import { cn } from "@/lib/utils";
import lightLogo from "@/public/logo-titulo-light.png";

export function FeaturedVideo({
  activeIndex,
  progress,
  totalVideos,
  video,
  onPrevious,
  onNext,
}: {
  activeIndex: number;
  progress: number;
  totalVideos: number;
  video: FeaturedVideoData;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const watchHref =
    video.categorySlug && video.vimeoId
      ? videoWatchHref({ slug: video.categorySlug }, video)
      : null;

  return (
    <section
      className="home-featured-video relative isolate overflow-hidden bg-foreground text-primary-foreground"
      aria-labelledby="featured-video-title"
    >
      {video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt=""
          fill
          priority
          loading="eager"
          sizes="(max-width: 639px) 100vw, (max-width: 1279px) 85vw, 1200px"
          className="home-featured-image object-cover"
        />
      ) : null}
      <div
        className="home-featured-overlay absolute inset-0"
        aria-hidden="true"
      />
      <div className="home-featured-content relative flex h-full flex-col items-start justify-end px-6 pt-6 pb-5 sm:px-16 sm:pt-16 sm:pb-8 lg:px-14 lg:pt-14 lg:pb-8 xl:px-16 xl:pt-16 xl:pb-9">
        <div className="home-featured-copy">
          <Image
            src={lightLogo}
            alt="Academia Okajima"
            loading="eager"
            sizes="(max-width: 639px) 128px, 180px"
            className="home-featured-brand"
          />
          <h1 id="featured-video-title" className="home-featured-title">
            {video.title}
          </h1>
          {watchHref ? (
            <Link
              href={watchHref}
              className={cn(
                buttonVariants({ variant: "featured", size: "hero" }),
                "home-featured-action",
              )}
            >
              <IconPlayerPlay data-icon="inline-start" aria-hidden="true" />
              Começar a assistir
            </Link>
          ) : (
            <span
              className={cn(
                buttonVariants({ variant: "featured", size: "hero" }),
                "home-featured-action aria-disabled:pointer-events-none aria-disabled:opacity-50",
              )}
              aria-disabled
            >
              <IconPlayerPlay data-icon="inline-start" aria-hidden="true" />
              Em migração
            </span>
          )}
          {totalVideos > 1 ? (
            <div className="home-featured-progress" aria-hidden="true">
              {Array.from({ length: totalVideos }).map((_, index) => (
                <span
                  key={`${activeIndex}-${index}`}
                  className={cn(
                    "home-featured-progress-item",
                    index === activeIndex && "is-active",
                  )}
                >
                  <span
                    className="home-featured-progress-fill"
                    style={
                      index === activeIndex
                        ? { transform: `scaleX(${progress})` }
                        : undefined
                    }
                  />
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {totalVideos > 1 ? (
        <div className="home-featured-controls">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="home-featured-control"
            aria-label="Vídeo anterior em destaque"
            onClick={onPrevious}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="home-featured-control"
            aria-label="Próximo vídeo em destaque"
            onClick={onNext}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
