"use client";

import type Player from "@vimeo/player";
import { useEffect, useMemo, useRef } from "react";
import { createVideoWatchTracker } from "@/lib/home/watch-time-client";

const CHECKPOINT_INTERVAL_SECONDS = 15;
const MINIMUM_CHECKPOINT_DELTA_SECONDS = 5;

export function VideoProgressPlayer({
  videoId,
  vimeoId,
  title,
  resumePositionSeconds,
  isStudioAdmin,
  autoPlay = false,
  onEnded,
}: {
  videoId: number;
  vimeoId: string;
  title: string;
  resumePositionSeconds: number;
  isStudioAdmin: boolean;
  autoPlay?: boolean;
  onEnded?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const latestPositionRef = useRef(0);
  const durationRef = useRef(0);
  const savedPositionRef = useRef(resumePositionSeconds);
  const playerRef = useRef<Player | null>(null);
  const viewRequestedRef = useRef(false);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const playerUrl = useMemo(() => {
    const params = new URLSearchParams({
      title: "0",
      byline: "0",
      portrait: "0",
      controls: "1",
      fullscreen: "1",
      pip: "1",
      audio_track: "1",
      keyboard: isStudioAdmin ? "1" : "0",
      skipping_forward: isStudioAdmin ? "1" : "0",
      speed: isStudioAdmin ? "1" : "0",
    });
    return `https://player.vimeo.com/video/${vimeoId}?${params.toString()}`;
  }, [isStudioAdmin, vimeoId]);

  useEffect(() => {
    if (!iframeRef.current) return;

    let disposed = false;
    let player: Player | null = null;
    const watch = createVideoWatchTracker(videoId);
    let wantsPlaying = false;
    let seeking = false;
    let buffering = false;

    function checkpoint(useBeacon = false) {
      const positionSeconds = latestPositionRef.current;
      const durationSeconds = durationRef.current;
      if (
        !Number.isFinite(positionSeconds) ||
        !Number.isFinite(durationSeconds) ||
        durationSeconds <= 0
      )
        return;
      if (
        !useBeacon &&
        Math.abs(positionSeconds - savedPositionRef.current) <
          MINIMUM_CHECKPOINT_DELTA_SECONDS
      )
        return;

      const payload = JSON.stringify({
        videoId,
        positionSeconds,
        durationSeconds,
      });
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/home/video-progress",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        void fetch("/api/home/video-progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: useBeacon,
        }).catch(() => undefined);
      }
      savedPositionRef.current = positionSeconds;
    }

    function recordView() {
      if (viewRequestedRef.current) return;
      viewRequestedRef.current = true;

      void fetch("/api/home/video-view", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoId }),
      }).catch(() => {
        viewRequestedRef.current = false;
      });
    }

    async function setup() {
      const VimeoPlayer = (await import("@vimeo/player")).default;
      if (!iframeRef.current || disposed) return;

      player = new VimeoPlayer(iframeRef.current);
      playerRef.current = player;
      try {
        await player.ready();
        const duration = await player.getDuration();
        if (disposed) return;
        durationRef.current = duration;
        latestPositionRef.current = Math.min(resumePositionSeconds, duration);
        if (
          resumePositionSeconds > 0 &&
          resumePositionSeconds < duration - 30
        ) {
          await player.setCurrentTime(resumePositionSeconds);
        }
        player.on("timeupdate", (event) => {
          watch.sample(event.seconds);
          latestPositionRef.current = event.seconds;
          durationRef.current = event.duration;
        });
        player.on("play", recordView);
        player.on("play", () => {
          wantsPlaying = true;
        });
        player.on("playing", () => {
          wantsPlaying = true;
          watch.playing(!seeking && !buffering);
        });
        player.on("seeking", () => {
          seeking = true;
          watch.playing(false);
        });
        player.on("seeked", () => {
          seeking = false;
          watch.playing(wantsPlaying && !buffering);
        });
        player.on("bufferstart", () => {
          buffering = true;
          watch.playing(false);
        });
        player.on("bufferend", () => {
          buffering = false;
          watch.playing(wantsPlaying && !seeking);
        });
        player.on("playbackratechange", (event) =>
          watch.rate(event.playbackRate),
        );
        player.on("pause", () => {
          wantsPlaying = false;
          watch.playing(false, true);
          checkpoint();
        });
        player.on("ended", () => {
          wantsPlaying = false;
          watch.playing(false, true);
          checkpoint();
          onEndedRef.current?.();
        });
        player.on("error", () => {
          wantsPlaying = false;
          watch.playing(false, true);
        });
        watch.rate(await player.getPlaybackRate());
        if (!(await player.getPaused())) {
          wantsPlaying = true;
          watch.playing(true);
        }
        if (autoPlay) {
          await player.play().catch(() => undefined);
        }
      } catch {
        // O vídeo continua disponível pelo iframe mesmo se a integração falhar.
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "hidden") return;
      watch.hide();
      void playerRef.current?.pause();
      checkpoint(true);
    }

    function onPageHide() {
      watch.hide();
      checkpoint(true);
    }

    const interval = window.setInterval(
      () => checkpoint(),
      CHECKPOINT_INTERVAL_SECONDS * 1000,
    );
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    void setup();

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      checkpoint(true);
      disposed = true;
      watch.dispose();
      playerRef.current = null;
      player?.unload().catch(() => undefined);
    };
  }, [autoPlay, resumePositionSeconds, videoId]);

  return (
    <div className="watch-player">
      <iframe
        ref={iframeRef}
        src={playerUrl}
        title={title}
        className="absolute inset-0 size-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}
