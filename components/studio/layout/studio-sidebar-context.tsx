"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";

export interface StudioVideoSidebarDetails {
  title: string;
  duration: string;
  vimeoId: string | null;
  thumbnailUrl: string | null;
}

interface StudioSidebarContextValue {
  videoDetails: StudioVideoSidebarDetails | null;
  setVideoDetails: Dispatch<SetStateAction<StudioVideoSidebarDetails | null>>;
}

const StudioSidebarContext = createContext<StudioSidebarContextValue | null>(
  null,
);

export function StudioSidebarStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [videoDetails, setVideoDetails] =
    useState<StudioVideoSidebarDetails | null>(null);
  const value = useMemo(
    () => ({ videoDetails, setVideoDetails }),
    [videoDetails],
  );

  return (
    <StudioSidebarContext.Provider value={value}>
      {children}
    </StudioSidebarContext.Provider>
  );
}

export function useStudioSidebarState() {
  const context = useContext(StudioSidebarContext);
  if (!context) {
    throw new Error(
      "useStudioSidebarState must be used within StudioSidebarStateProvider.",
    );
  }

  return context;
}
