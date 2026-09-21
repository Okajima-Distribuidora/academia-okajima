"use client";

import { ReactLenis } from "lenis/react";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        smoothWheel: true,
        stopInertiaOnNavigate: true,
        prevent: (node) => node.closest("[data-lenis-prevent]") !== null,
      }}
    >
      {children}
    </ReactLenis>
  );
}
