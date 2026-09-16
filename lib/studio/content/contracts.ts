import type { VideoUploadStatus } from "@/lib/db/types";

export type StudioContentType = "videos" | "shorts";
export type StudioVideoPrivacy = 0 | 1;

export interface StudioContentItem {
  id: number;
  publicId: string;
  title: string;
  description: string;
  duration: string;
  privacy: StudioVideoPrivacy;
  visibilityLabel: string;
  dateLabel: string;
  statusLabel: string;
  views: number;
  comments: number;
  likes: number;
  thumbnailUrl: string | null;
  vimeoId: string | null;
  uploadStatus: VideoUploadStatus;
  uploadActionStatus?: "cancelling";
  uploadStartedAt: string;
  uploadStatusUpdatedAt: string;
  processingStartedAt: string | null;
  readyAt: string | null;
  cancelledAt: string | null;
  uploadProgress?: number;
  uploadRemainingSeconds?: number | null;
}

export interface StudioContentPage {
  items: StudioContentItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
