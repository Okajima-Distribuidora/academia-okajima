import "server-only";

import { sql } from "kysely";

import { getDb } from "@/lib/db";
import type { VideoUploadStatus } from "@/lib/db/types";
import { decodeLegacyText, extractVimeoId } from "@/lib/home/catalog";
import type {
  StudioContentItem,
  StudioContentPage,
  StudioContentType,
  StudioVideoPrivacy,
} from "@/lib/studio/content/contracts";
import {
  getVimeoVideoPresentation,
  listVimeoVideoThumbnails,
  type VimeoVideoThumbnail,
} from "@/lib/vimeo/videos";

export const STUDIO_CONTENT_PAGE_SIZE = 30;

export type {
  StudioContentItem,
  StudioContentPage,
  StudioContentType,
} from "@/lib/studio/content/contracts";

export interface StudioVideoDetails {
  id: number;
  publicId: string;
  title: string;
  description: string;
  duration: string;
  privacy: number;
  visibilityLabel: string;
  statusLabel: string;
  dateLabel: string;
  views: number;
  comments: number;
  likes: number;
  vimeoId: string | null;
  thumbnailUrl: string | null;
  thumbnails: VimeoVideoThumbnail[];
  selectedSubcategoryId: number | null;
  categoryLabel: string | null;
}

export function getStudioContentType(
  value: string | string[] | undefined,
): StudioContentType {
  return (Array.isArray(value) ? value[0] : value) === "shorts"
    ? "shorts"
    : "videos";
}

export function getStudioContentPage(
  value: string | string[] | undefined,
): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawValue ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function formatStudioContentDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

export function getStudioVisibilityLabel(privacy: number): string {
  if (privacy === 0) return "Público";
  if (privacy === 1) return "Privado";
  return "Não listado";
}

function readOptionalText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalNumber(formData: FormData, key: string): number | null {
  const value = readOptionalText(formData, key);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeEditablePrivacy(value: number): StudioVideoPrivacy {
  return value === 1 ? 1 : 0;
}

export function getStudioStatusLabel(privacy: number): string {
  return getStudioVisibilityLabel(privacy);
}

export async function listStudioContent(
  type: StudioContentType,
  requestedPage = 1,
  options: {
    resolveVimeoPresentation?: boolean;
  } = {},
): Promise<StudioContentPage> {
  const isShort = type === "shorts" ? 1 : 0;
  const db = getDb();
  const totalRow = await db
    .selectFrom("videos")
    .select(({ fn }) => fn.countAll<number>().as("total"))
    .where("videos.converted", "!=", 2)
    .where("videos.is_movie", "=", 0)
    .where("videos.live_time", "=", 0)
    .where("videos.is_short", "=", isShort)
    .executeTakeFirst();
  const totalItems = Number(totalRow?.total ?? 0);
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / STUDIO_CONTENT_PAGE_SIZE),
  );
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  let contentQuery = db
    .selectFrom("videos")
    .select([
      "videos.id",
      "videos.video_id",
      "videos.title",
      "videos.description",
      "videos.thumbnail",
      "videos.duration",
      "videos.vimeo",
      "videos.video_location",
      "videos.time",
      "videos.publication_date",
      "videos.views",
      "videos.privacy",
      "videos.approved",
      "videos.active",
      "videos.upload_status",
      "videos.upload_started_at",
      "videos.upload_status_updated_at",
      "videos.processing_started_at",
      "videos.ready_at",
      "videos.cancelled_at",
    ])
    .select((eb) =>
      eb
        .selectFrom("comments")
        .select(({ fn }) => fn.countAll<number>().as("total"))
        .whereRef("comments.video_id", "=", "videos.id")
        .as("comments"),
    )
    .select((eb) =>
      eb
        .selectFrom("likes_dislikes")
        .select(({ fn }) => fn.countAll<number>().as("total"))
        .whereRef("likes_dislikes.video_id", "=", "videos.id")
        .where("likes_dislikes.type", "=", 1)
        .as("likes"),
    )
    .where("videos.converted", "!=", 2)
    .where("videos.is_movie", "=", 0)
    .where("videos.live_time", "=", 0)
    .where("videos.is_short", "=", isShort);

  contentQuery = contentQuery
    .orderBy(
      sql<number>`greatest(${sql.ref("videos.publication_date")}, ${sql.ref("videos.time")})`,
      "desc",
    )
    .orderBy("videos.id", "desc");

  const rows = await contentQuery
    .limit(STUDIO_CONTENT_PAGE_SIZE)
    .offset((page - 1) * STUDIO_CONTENT_PAGE_SIZE)
    .execute();

  const shouldResolveVimeo = options.resolveVimeoPresentation ?? true;
  const items = await Promise.all(
    rows.map(async (video) => {
      const vimeoId = extractVimeoId(video.vimeo, video.video_location);
      const vimeo =
        shouldResolveVimeo && vimeoId
          ? await getVimeoVideoPresentation(vimeoId)
          : null;
      const date = Math.max(video.publication_date, video.time);
      const uploadStatus = video.upload_status;
      const isPending =
        uploadStatus === "uploading" || uploadStatus === "processing";

      return {
        id: video.id,
        publicId: video.video_id,
        title: decodeLegacyText(video.title.trim()) || "Sem título",
        description:
          decodeLegacyText(video.description?.trim() ?? "") || "Sem descrição",
        duration: video.duration.trim(),
        privacy: normalizeEditablePrivacy(video.privacy),
        visibilityLabel: isPending
          ? "Pendente"
          : getStudioVisibilityLabel(video.privacy),
        dateLabel: formatStudioContentDate(date),
        statusLabel: getUploadStatusLabel(uploadStatus, video.privacy),
        views: Math.max(0, video.views),
        comments: Number(video.comments ?? 0),
        likes: Number(video.likes ?? 0),
        thumbnailUrl:
          vimeo?.thumbnailUrl ?? getPersistedThumbnailUrl(video.thumbnail),
        vimeoId,
        uploadStatus,
        uploadStartedAt: video.upload_started_at.toISOString(),
        uploadStatusUpdatedAt: video.upload_status_updated_at.toISOString(),
        processingStartedAt: video.processing_started_at?.toISOString() ?? null,
        readyAt: video.ready_at?.toISOString() ?? null,
        cancelledAt: video.cancelled_at?.toISOString() ?? null,
      };
    }),
  );

  return {
    items,
    page,
    pageSize: STUDIO_CONTENT_PAGE_SIZE,
    totalItems,
    totalPages,
  };
}

export async function updateStudioVideoPrivacy(
  publicId: string,
  privacy: StudioVideoPrivacy,
): Promise<boolean> {
  const video = await getDb()
    .selectFrom("videos")
    .select("id")
    .where("video_id", "=", publicId)
    .where("converted", "!=", 2)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .executeTakeFirst();

  if (!video) return false;

  await getDb()
    .updateTable("videos")
    .set({ privacy })
    .where("id", "=", video.id)
    .executeTakeFirst();

  return true;
}

function getUploadStatusLabel(
  uploadStatus: VideoUploadStatus,
  privacy: number,
) {
  if (uploadStatus === "uploading") return "Enviando";
  if (uploadStatus === "processing") return "Processando";
  if (uploadStatus === "cancelled") return "Envio cancelado";
  if (uploadStatus === "deleted") return "Apagado";
  return getStudioStatusLabel(privacy);
}

function getPersistedThumbnailUrl(thumbnail: string): string | null {
  if (thumbnail === "upload/photos/thumbnail.jpg") return null;
  return /^https?:\/\//i.test(thumbnail) ? thumbnail : null;
}

export async function getStudioVideoDetails(
  publicId: string,
): Promise<StudioVideoDetails | null> {
  const video = await getDb()
    .selectFrom("videos")
    .select([
      "videos.id",
      "videos.video_id",
      "videos.title",
      "videos.description",
      "videos.duration",
      "videos.vimeo",
      "videos.video_location",
      "videos.time",
      "videos.publication_date",
      "videos.views",
      "videos.privacy",
      "videos.approved",
      "videos.active",
    ])
    .select((eb) =>
      eb
        .selectFrom("comments")
        .select(({ fn }) => fn.countAll<number>().as("total"))
        .whereRef("comments.video_id", "=", "videos.id")
        .as("comments"),
    )
    .select((eb) =>
      eb
        .selectFrom("likes_dislikes")
        .select(({ fn }) => fn.countAll<number>().as("total"))
        .whereRef("likes_dislikes.video_id", "=", "videos.id")
        .where("likes_dislikes.type", "=", 1)
        .as("likes"),
    )
    .where("videos.video_id", "=", publicId)
    .where("videos.converted", "!=", 2)
    .where("videos.is_movie", "=", 0)
    .where("videos.live_time", "=", 0)
    .executeTakeFirst();

  if (!video) return null;

  const selectedSubcategory = await getDb()
    .selectFrom("academy_video_subcategories")
    .innerJoin(
      "academy_subcategories",
      "academy_subcategories.id",
      "academy_video_subcategories.subcategory_id",
    )
    .innerJoin(
      "academy_categories",
      "academy_categories.id",
      "academy_subcategories.category_id",
    )
    .select([
      "academy_video_subcategories.subcategory_id",
      "academy_categories.name as categoryName",
      "academy_subcategories.name as subcategoryName",
    ])
    .where("academy_video_subcategories.video_id", "=", video.id)
    .orderBy("academy_categories.sort_order", "asc")
    .orderBy("academy_subcategories.sort_order", "asc")
    .orderBy("academy_subcategories.name", "asc")
    .executeTakeFirst();
  const vimeoId = extractVimeoId(video.vimeo, video.video_location);
  const [vimeo, thumbnails] = vimeoId
    ? await Promise.all([
        getVimeoVideoPresentation(vimeoId),
        listVimeoVideoThumbnails(vimeoId),
      ])
    : [null, []];
  const date = Math.max(video.publication_date, video.time);

  return {
    id: video.id,
    publicId: video.video_id,
    title: decodeLegacyText(video.title.trim()) || "Sem título",
    description: decodeLegacyText(video.description?.trim() ?? ""),
    duration: video.duration.trim(),
    privacy: normalizeEditablePrivacy(video.privacy),
    visibilityLabel: getStudioVisibilityLabel(video.privacy),
    dateLabel: formatStudioContentDate(date),
    statusLabel: getStudioStatusLabel(video.privacy),
    views: Math.max(0, video.views),
    comments: Number(video.comments ?? 0),
    likes: Number(video.likes ?? 0),
    vimeoId,
    thumbnailUrl: vimeo?.thumbnailUrl ?? null,
    thumbnails,
    selectedSubcategoryId: selectedSubcategory?.subcategory_id ?? null,
    categoryLabel: selectedSubcategory
      ? `${decodeLegacyText(selectedSubcategory.categoryName.trim())} / ${decodeLegacyText(selectedSubcategory.subcategoryName.trim())}`
      : null,
  };
}

export async function updateStudioVideoDetails(
  publicId: string,
  formData: FormData,
): Promise<void> {
  const title = readOptionalText(formData, "title").slice(0, 100);
  const description = readOptionalText(formData, "description");
  const privacy = Number(formData.get("privacy"));
  const subcategoryId = readOptionalNumber(formData, "subcategoryId");

  if (!title) {
    throw new Error("Título obrigatório.");
  }

  const db = getDb();
  const video = await db
    .selectFrom("videos")
    .select(["id"])
    .where("video_id", "=", publicId)
    .executeTakeFirst();

  if (!video) {
    throw new Error("Vídeo não encontrado.");
  }

  const safeSubcategoryId = subcategoryId
    ? await db
        .selectFrom("academy_subcategories")
        .select("id")
        .where("id", "=", subcategoryId)
        .executeTakeFirst()
    : null;

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable("videos")
      .set({
        title,
        description,
        privacy: normalizeEditablePrivacy(privacy),
      })
      .where("id", "=", video.id)
      .executeTakeFirst();

    await trx
      .deleteFrom("academy_video_subcategories")
      .where("video_id", "=", video.id)
      .execute();

    if (safeSubcategoryId) {
      await trx
        .insertInto("academy_video_subcategories")
        .values({
          video_id: video.id,
          subcategory_id: safeSubcategoryId.id,
          created_at: new Date(),
        })
        .executeTakeFirst();
    }
  });
}
