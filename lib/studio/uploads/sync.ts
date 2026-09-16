import "server-only";

import {
  findVideoUploadsByVimeoId,
  markVideoUploadRemoved,
  transitionVideoUploadStatus,
  updateVideoPresentation,
  type VideoUploadRecord,
} from "@/lib/studio/uploads/records";
import {
  deleteVimeoVideo,
  getVimeoVideoProcessingStatus,
} from "@/lib/vimeo/uploads";
import { refreshVimeoVideoPresentation } from "@/lib/vimeo/videos";
import type { VimeoWebhookEvent } from "@/lib/vimeo/webhooks";

export async function handleVimeoWebhookEvent(
  event: VimeoWebhookEvent,
  vimeoVideoId: string,
) {
  const records = await findVideoUploadsByVimeoId(vimeoVideoId);
  if (records.length === 0) return 0;

  if (event === "video-upload-failed") {
    await deleteVimeoVideo(vimeoVideoId);
    await Promise.all(records.map(markRemoved));
    return records.length;
  }

  if (event === "video-deleted") {
    await Promise.all(records.map(markRemoved));
    return records.length;
  }

  if (event === "video-transcode-playable") {
    await Promise.all(records.map(markProcessing));
    return records.length;
  }

  if (
    event === "video-transcode-fully-playable" ||
    event === "video-transcode-complete"
  ) {
    await completeVideoUpload(records, vimeoVideoId);
    return records.length;
  }

  if (event === "automatic-thumbnail-available" || event === "video-updated") {
    await syncPresentation(records, vimeoVideoId);
    return records.length;
  }

  return records.length;
}

export async function reconcileVideoUpload(record: VideoUploadRecord) {
  const status = await getVimeoVideoProcessingStatus(record.vimeo);
  if (status === "complete") {
    await completeVideoUpload([record], record.vimeo);
  } else if (status === "error") {
    await deleteVimeoVideo(record.vimeo);
    await markRemoved(record);
  }
  return status;
}

export async function completeVideoUpload(
  records: VideoUploadRecord[],
  vimeoVideoId: string,
) {
  await Promise.all(records.map(markReady));
  await syncPresentation(records, vimeoVideoId);
  return true;
}

async function markProcessing(record: VideoUploadRecord) {
  await transitionVideoUploadStatus({
    databaseVideoId: record.id,
    userId: record.user_id,
    vimeoVideoId: record.vimeo,
    from: ["uploading"],
    to: "processing",
  });
}

async function markReady(record: VideoUploadRecord) {
  await transitionVideoUploadStatus({
    databaseVideoId: record.id,
    userId: record.user_id,
    vimeoVideoId: record.vimeo,
    from: ["uploading", "processing"],
    to: "ready",
  });
}

async function markRemoved(record: VideoUploadRecord) {
  await markVideoUploadRemoved({
    databaseVideoId: record.id,
    userId: record.user_id,
    vimeoVideoId: record.vimeo,
    previousStatus: record.upload_status,
  });
}

async function syncPresentation(
  records: VideoUploadRecord[],
  vimeoVideoId: string,
) {
  const presentation = await refreshVimeoVideoPresentation(vimeoVideoId);
  if (!presentation) return;

  await Promise.all(
    records.map((record) =>
      updateVideoPresentation({
        databaseVideoId: record.id,
        vimeoVideoId,
        thumbnailUrl: presentation.thumbnailUrl,
        durationSeconds: presentation.duration,
      }),
    ),
  );
}
