"use client";

import { useRef, useState } from "react";

import type { FeaturedVideo as FeaturedVideoData, RecentVideo } from "@/lib/home/catalog";
import { FeaturedVideo } from "./featured-video";
import { RecentVideos } from "./recent-videos";

interface Selection {
  autoplay: boolean;
  nonce: number;
  video: FeaturedVideoData;
}

export function HomeShowcase({
  featuredVideo,
  recentVideos,
}: {
  featuredVideo: FeaturedVideoData;
  recentVideos: RecentVideo[];
}) {
  const [selection, setSelection] = useState<Selection>({
    autoplay: false,
    nonce: 0,
    video: featuredVideo,
  });
  const showcaseRef = useRef<HTMLDivElement>(null);

  function selectVideo(video: RecentVideo) {
    setSelection((current) => ({ autoplay: true, nonce: current.nonce + 1, video }));
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      showcaseRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }

  return (
    <div ref={showcaseRef} className="home-showcase">
      <FeaturedVideo
        key={`${selection.video.id}-${selection.nonce}`}
        video={selection.video}
        initiallyPlaying={selection.autoplay}
      />
      <RecentVideos
        videos={recentVideos}
        selectedVideoId={selection.video.id}
        onSelect={selectVideo}
      />
    </div>
  );
}
