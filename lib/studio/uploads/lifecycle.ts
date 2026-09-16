import type { VideoUploadStatus } from "@/lib/db/types";

export function removalStatusFor(
  previousStatus: VideoUploadStatus,
): Extract<VideoUploadStatus, "cancelled" | "deleted"> {
  return previousStatus === "ready" || previousStatus === "deleted"
    ? "deleted"
    : "cancelled";
}
