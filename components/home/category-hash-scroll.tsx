"use client";

import { useLenis } from "lenis/react";
import { useEffect } from "react";

export function CategoryHashScroll({ targetId }: { targetId: string | null }) {
  const lenis = useLenis();

  useEffect(() => {
    if (!targetId || !lenis) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      lenis.resize();
      lenis.scrollTo(target, { duration: 0.7 });
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}#${targetId}`,
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [lenis, targetId]);

  return null;
}
