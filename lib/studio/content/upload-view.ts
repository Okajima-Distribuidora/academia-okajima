import type { ActiveVideoUpload } from "@/components/studio/uploads/video-upload-dialog";
import type { StudioContentItem } from "@/lib/studio/content/contracts";

export function isTransientUploadStatus(
  status: StudioContentItem["uploadStatus"],
) {
  return status === "uploading" || status === "processing";
}

export function shouldPollStudioContent(
  items: StudioContentItem[],
  activeUpload: ActiveVideoUpload | null,
) {
  return (
    items.some((item) => isTransientUploadStatus(item.uploadStatus)) ||
    activeUpload?.status === "preparing" ||
    activeUpload?.status === "uploading" ||
    activeUpload?.status === "processing" ||
    activeUpload?.status === "cancelling"
  );
}

export function mergeActiveUpload(
  item: StudioContentItem,
  activeUpload: ActiveVideoUpload,
): StudioContentItem {
  if (activeUpload.status === "processing") {
    return {
      ...item,
      title: activeUpload.title,
      uploadStatus: "processing",
      uploadActionStatus: undefined,
    };
  }
  if (activeUpload.status === "complete") {
    return {
      ...item,
      title: activeUpload.title,
      uploadStatus: "ready",
      uploadActionStatus: undefined,
    };
  }
  if (activeUpload.status === "cancelled") {
    return {
      ...item,
      title: activeUpload.title,
      uploadStatus: "cancelled",
      uploadActionStatus: undefined,
    };
  }
  return {
    ...item,
    title: activeUpload.title,
    uploadStatus: "uploading",
    uploadActionStatus:
      activeUpload.status === "cancelling" ? "cancelling" : undefined,
    uploadProgress: activeUpload.progress,
    uploadRemainingSeconds: activeUpload.remainingSeconds,
  };
}

export function getUploadProgressLabel(item: StudioContentItem) {
  if (item.uploadActionStatus === "cancelling") return "Cancelando envio...";
  if (item.uploadProgress == null) return "Enviando vídeo...";
  const progress = Math.max(0, Math.min(100, Math.round(item.uploadProgress)));
  const remaining = formatRemainingSeconds(item.uploadRemainingSeconds);
  return remaining
    ? `Envio em ${progress}% · ${remaining}`
    : `Envio em ${progress}%`;
}

function formatRemainingSeconds(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds < 60) return `Tempo restante: ${Math.ceil(seconds)}s`;
  const minutes = Math.ceil(seconds / 60);
  return `Tempo restante: ${minutes} min`;
}
