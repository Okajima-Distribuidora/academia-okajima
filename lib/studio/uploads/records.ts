import "server-only";

import { randomUUID } from "node:crypto";

import { getDb } from "@/lib/db";
import type { VideoUploadStatus } from "@/lib/db/types";
import { removalStatusFor } from "./lifecycle";

type UploadRecordIdentity = {
  databaseVideoId: number;
  userId: number;
  vimeoVideoId: string;
};

export type VideoUploadRecord = {
  id: number;
  user_id: number;
  vimeo: string;
  upload_status: VideoUploadStatus;
};

export async function createVideoUploadRecord({
  userId,
  title,
  size,
  vimeoVideoId,
}: {
  userId: number;
  title: string;
  size: number;
  vimeoVideoId: string;
}) {
  const now = new Date();
  const result = await getDb()
    .insertInto("videos")
    .values({
      video_id: randomUUID().replaceAll("-", ""),
      user_id: userId,
      title,
      size,
      vimeo: vimeoVideoId,
      active: 0,
      converted: 0,
      approved: 0,
      upload_status: "uploading",
      time: Math.floor(now.getTime() / 1000),
      upload_started_at: now,
      upload_status_updated_at: now,
    })
    .executeTakeFirstOrThrow();

  return Number(result.insertId);
}

export async function findVideoUploadRecord({
  databaseVideoId,
  userId,
  vimeoVideoId,
}: UploadRecordIdentity) {
  return getDb()
    .selectFrom("videos")
    .select(["id", "upload_status"])
    .where("id", "=", databaseVideoId)
    .where("user_id", "=", userId)
    .where("vimeo", "=", vimeoVideoId)
    .executeTakeFirst();
}

export async function findVideoUploadsByVimeoId(
  vimeoVideoId: string,
): Promise<VideoUploadRecord[]> {
  return getDb()
    .selectFrom("videos")
    .select(["id", "user_id", "vimeo", "upload_status"])
    .where("vimeo", "=", vimeoVideoId)
    .orderBy("id", "desc")
    .execute();
}

export async function listVideoUploadsForReconciliation(
  limit = 25,
): Promise<VideoUploadRecord[]> {
  return getDb()
    .selectFrom("videos")
    .select(["id", "user_id", "vimeo", "upload_status"])
    .where((eb) =>
      eb.or([
        eb("upload_status", "=", "processing"),
        eb.and([
          eb("upload_status", "=", "ready"),
          eb.or([
            eb("duration", "=", "00:00"),
            eb("thumbnail", "=", "upload/photos/thumbnail.jpg"),
          ]),
        ]),
      ]),
    )
    .where("vimeo", "!=", "")
    .orderBy("upload_status_updated_at", "asc")
    .limit(limit)
    .execute();
}

export async function transitionVideoUploadStatus({
  databaseVideoId,
  userId,
  vimeoVideoId,
  from,
  to,
}: UploadRecordIdentity & {
  from: VideoUploadStatus[];
  to: Extract<VideoUploadStatus, "processing" | "ready">;
}) {
  const now = new Date();
  const timestamps =
    to === "processing"
      ? { processing_started_at: now }
      : { ready_at: now, converted: 1, approved: 1 };

  await getDb()
    .updateTable("videos")
    .set({
      upload_status: to,
      upload_status_updated_at: now,
      ...timestamps,
    })
    .where("id", "=", databaseVideoId)
    .where("user_id", "=", userId)
    .where("vimeo", "=", vimeoVideoId)
    .where("upload_status", "in", from)
    .execute();
}

export async function markVideoUploadRemoved({
  databaseVideoId,
  userId,
  vimeoVideoId,
  previousStatus,
}: UploadRecordIdentity & { previousStatus: VideoUploadStatus }) {
  if (previousStatus === "cancelled" || previousStatus === "deleted") return;

  const now = new Date();
  const removalStatus = removalStatusFor(previousStatus);
  const isDeletion = removalStatus === "deleted";
  await getDb()
    .updateTable("videos")
    .set({
      active: 0,
      upload_status: removalStatus,
      upload_status_updated_at: now,
      ...(isDeletion ? { deleted_at: now } : { cancelled_at: now }),
    })
    .where("id", "=", databaseVideoId)
    .where("user_id", "=", userId)
    .where("vimeo", "=", vimeoVideoId)
    .where("upload_status", "=", previousStatus)
    .execute();
}

export async function updateVideoPresentation({
  databaseVideoId,
  vimeoVideoId,
  thumbnailUrl,
  durationSeconds,
}: {
  databaseVideoId: number;
  vimeoVideoId: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
}) {
  const duration = formatDuration(durationSeconds);
  const db = getDb();
  await db
    .updateTable("videos")
    .set({ duration })
    .where("id", "=", databaseVideoId)
    .where("vimeo", "=", vimeoVideoId)
    .execute();

  if (thumbnailUrl) {
    await db
      .updateTable("videos")
      .set({ thumbnail: thumbnailUrl })
      .where("id", "=", databaseVideoId)
      .where("vimeo", "=", vimeoVideoId)
      .execute();
  }
}

export async function updateVideoUploadDetails({
  databaseVideoId,
  userId,
  vimeoVideoId,
  title,
  description,
  subcategoryIds,
}: UploadRecordIdentity & {
  title: string;
  description: string;
  subcategoryIds: number[];
}): Promise<"updated" | "not_found" | "invalid_subcategories"> {
  const uniqueSubcategoryIds = [...new Set(subcategoryIds)];

  return getDb()
    .transaction()
    .execute(async (trx) => {
      const video = await trx
        .selectFrom("videos")
        .select("id")
        .where("id", "=", databaseVideoId)
        .where("user_id", "=", userId)
        .where("vimeo", "=", vimeoVideoId)
        .executeTakeFirst();
      if (!video) return "not_found";

      if (uniqueSubcategoryIds.length > 0) {
        const validSubcategories = await trx
          .selectFrom("academy_subcategories")
          .select("id")
          .where("id", "in", uniqueSubcategoryIds)
          .where("is_active", "=", 1)
          .execute();
        if (validSubcategories.length !== uniqueSubcategoryIds.length) {
          return "invalid_subcategories";
        }
      }

      await trx
        .updateTable("videos")
        .set({ title, description })
        .where("id", "=", databaseVideoId)
        .execute();

      await trx
        .deleteFrom("academy_video_subcategories")
        .where("video_id", "=", databaseVideoId)
        .execute();

      if (uniqueSubcategoryIds.length > 0) {
        await trx
          .insertInto("academy_video_subcategories")
          .values(
            uniqueSubcategoryIds.map((subcategoryId) => ({
              video_id: databaseVideoId,
              subcategory_id: subcategoryId,
              created_at: new Date(),
            })),
          )
          .execute();
      }

      return "updated";
    });
}

function formatDuration(durationSeconds: number) {
  const totalSeconds = Math.max(0, Math.round(durationSeconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? [hours, minutes, seconds]
        .map((part) => String(part).padStart(2, "0"))
        .join(":")
    : [minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
