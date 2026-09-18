"use client";

import { useEffect } from "react";
import type { StudioVideoEditorSection } from "@/components/studio/layout/studio-sidebar-context";
import { useStudioSidebarState } from "@/components/studio/layout/studio-sidebar-context";

interface VideoEditorSidebarStateProps {
  initialSection: StudioVideoEditorSection;
  title: string;
  duration: string;
  vimeoId: string | null;
  thumbnailUrl: string | null;
}

export function VideoEditorSidebarState({
  initialSection,
  title,
  duration,
  vimeoId,
  thumbnailUrl,
}: VideoEditorSidebarStateProps) {
  const { setActiveEditorSection, setVideoDetails } = useStudioSidebarState();

  useEffect(() => {
    setActiveEditorSection(initialSection);
    setVideoDetails({ title, duration, vimeoId, thumbnailUrl });

    return () => {
      setActiveEditorSection("details");
      setVideoDetails(null);
    };
  }, [
    duration,
    initialSection,
    setActiveEditorSection,
    setVideoDetails,
    thumbnailUrl,
    title,
    vimeoId,
  ]);

  return null;
}
