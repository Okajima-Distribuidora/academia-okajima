"use client";

import type { PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const PREVIEW_DELAY_MS = 250;

function shouldLoadHoverPreview() {
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function VideoHoverPreview({
  title,
  vimeoId,
}: {
  title: string;
  vimeoId: string | null;
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const previewUrl = useMemo(() => {
    if (!vimeoId) return null;

    const params = new URLSearchParams({
      background: "1",
      autoplay: "1",
      muted: "1",
      loop: "1",
      controls: "0",
      title: "0",
      byline: "0",
      portrait: "0",
      autopause: "0",
      dnt: "1",
      playsinline: "1",
      max_quality: "360p",
    });

    return `https://player.vimeo.com/video/${vimeoId}?${params.toString()}`;
  }, [vimeoId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!previewUrl) return null;

  function clearPreviewTimer() {
    if (!timeoutRef.current) return;

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  function handlePointerEnter(event: PointerEvent<HTMLSpanElement>) {
    if (event.pointerType !== "mouse" || !shouldLoadHoverPreview()) return;

    clearPreviewTimer();
    timeoutRef.current = window.setTimeout(() => {
      setVisible(true);
      timeoutRef.current = null;
    }, PREVIEW_DELAY_MS);
  }

  function handlePointerLeave() {
    clearPreviewTimer();
    setVisible(false);
  }

  return (
    <span
      className={
        visible ? "home-video-preview is-active" : "home-video-preview"
      }
      aria-hidden="true"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {visible ? (
        <iframe
          src={previewUrl}
          title={`Preview de ${title}`}
          className="home-video-preview-frame"
          loading="lazy"
          tabIndex={-1}
          allow="autoplay; fullscreen; picture-in-picture"
        />
      ) : null}
    </span>
  );
}
