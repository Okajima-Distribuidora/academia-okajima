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

export type StudioVideoEditorSection = "details" | "comments";

interface StudioSidebarContextValue {
  activeEditorSection: StudioVideoEditorSection;
  setActiveEditorSection: Dispatch<SetStateAction<StudioVideoEditorSection>>;
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
  const [activeEditorSection, setActiveEditorSection] =
    useState<StudioVideoEditorSection>("details");
  const [videoDetails, setVideoDetails] =
    useState<StudioVideoSidebarDetails | null>(null);
  const value = useMemo(
    () => ({
      activeEditorSection,
      setActiveEditorSection,
      videoDetails,
      setVideoDetails,
    }),
    [activeEditorSection, videoDetails],
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
