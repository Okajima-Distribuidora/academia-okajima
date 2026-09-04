"use client";

import { useState } from "react";
import Image from "next/image";
import { IconPlayerPlayFilled, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import type { FeaturedVideo as FeaturedVideoData } from "@/lib/home/catalog";
import lightLogo from "@/public/logo-light.png";

export function FeaturedVideo({
  video,
  initiallyPlaying = false,
}: {
  video: FeaturedVideoData;
  initiallyPlaying?: boolean;
}) {
  const [playing, setPlaying] = useState(initiallyPlaying);
  const playerUrl = video.vimeoId
    ? `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`
    : null;

  if (playing && playerUrl) {
    return (
      <section className="home-featured-video relative overflow-hidden bg-foreground" aria-label={`Reproduzindo ${video.title}`}>
        <iframe
          src={playerUrl}
          title={video.title}
          className="absolute inset-0 size-full border-0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 rounded-full shadow-lg"
          aria-label="Fechar vídeo"
          onClick={() => setPlaying(false)}
        >
          <IconX aria-hidden="true" />
        </Button>
      </section>
    );
  }

  return (
    <section className="home-featured-video relative isolate overflow-hidden bg-foreground text-primary-foreground" aria-labelledby="featured-video-title">
      {video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt=""
          fill
          priority
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 85vw, 1200px"
          className="home-featured-image object-cover"
        />
      ) : null}
      <div className="home-featured-overlay absolute inset-0" aria-hidden="true" />
      <div className="home-featured-content relative flex h-full max-w-2xl flex-col items-start justify-end gap-5 p-6 sm:p-10 lg:justify-center lg:p-14 xl:p-16">
        <Image
          src={lightLogo}
          alt="Academia Okajima"
          sizes="(max-width: 639px) 112px, 144px"
          className="home-featured-brand"
        />
        <div className="flex flex-col gap-3">
          <h1 id="featured-video-title" className="home-featured-title">
            {video.title}
          </h1>
          {video.description ? <p className="home-featured-description line-clamp-2 max-w-xl">{video.description}</p> : null}
        </div>
        <Button type="button" variant="featured" size="hero" disabled={!playerUrl} onClick={() => setPlaying(true)}>
          <IconPlayerPlayFilled data-icon="inline-start" aria-hidden="true" />
          {playerUrl ? "Começar a assistir" : "Reprodução em migração"}
        </Button>
      </div>
    </section>
  );
}
