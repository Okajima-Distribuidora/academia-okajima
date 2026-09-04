import "server-only";

import { getDb } from "@/lib/db";
import { getVimeoVideoPresentation } from "@/lib/vimeo/videos";

export interface HomeCategory {
  id: string;
  label: string;
}

export interface FeaturedVideo {
  id: number;
  publicId: string;
  title: string;
  description: string;
  duration: string;
  categoryLabel: string | null;
  vimeoId: string | null;
  thumbnailUrl: string | null;
}

export interface RecentVideo extends FeaturedVideo {
  publishedLabel: string;
  viewsLabel: string;
}

export interface HomeCatalog {
  categories: HomeCategory[];
  activeCategoryId: string | null;
  featuredVideo: FeaturedVideo | null;
  recentVideos: RecentVideo[];
}

export function formatViews(views: number): string {
  const safeViews = Number.isFinite(views) && views > 0 ? Math.floor(views) : 0;
  return `${new Intl.NumberFormat("pt-BR").format(safeViews)} ${safeViews === 1 ? "visualização" : "visualizações"}`;
}

export function formatPublishedAt(timestamp: number, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const elapsedDays = Math.max(0, Math.floor((nowSeconds - timestamp) / 86_400));
  if (elapsedDays === 0) return "hoje";
  if (elapsedDays < 30) return `há ${elapsedDays} ${elapsedDays === 1 ? "dia" : "dias"}`;

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) return `há ${elapsedMonths} ${elapsedMonths === 1 ? "mês" : "meses"}`;

  const elapsedYears = Math.floor(elapsedMonths / 12);
  return `há ${elapsedYears} ${elapsedYears === 1 ? "ano" : "anos"}`;
}

export function decodeLegacyText(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
    "#039": "'",
  };

  return value.replace(/&(amp|apos|gt|lt|quot|#039);/gi, (entity, key: string) => entities[key.toLowerCase()] ?? entity);
}

export function extractVimeoId(vimeo: string, videoLocation: string): string | null {
  const direct = vimeo.trim();
  if (/^\d{6,12}$/.test(direct)) return direct;

  let decoded = videoLocation;
  try {
    decoded = decodeURIComponent(videoLocation);
  } catch {
    // A malformed legacy value is simply not a playable Vimeo source.
  }

  const match = decoded.match(/(?:player\.)?vimeo\.com\/video\/(\d{6,12})(?:[/?#]|$)/i);
  return match?.[1] ?? null;
}

async function listCategories(): Promise<HomeCategory[]> {
  const db = getDb();
  const [rows, otherRow] = await Promise.all([
    db.selectFrom("langs")
      .select(["lang_key", "english"])
      .where("type", "=", "category")
      .orderBy("id", "asc")
      .execute(),
    db.selectFrom("langs")
      .select("english")
      .where("lang_key", "=", "other")
      .orderBy("id", "desc")
      .executeTakeFirst(),
  ]);

  const categories = rows.flatMap((row) => {
    const id = row.lang_key?.trim();
    const label = row.english?.trim();
    return id && /^\d+$/.test(id) && label ? [{ id, label }] : [];
  });

  const otherLabel = otherRow?.english?.trim();
  if (otherLabel) categories.push({ id: "0", label: otherLabel });
  return categories;
}

async function findFeaturedVideo(categoryId: string | null) {
  let query = getDb().selectFrom("videos")
    .select([
      "id",
      "video_id",
      "title",
      "description",
      "duration",
      "category_id",
      "vimeo",
      "video_location",
    ])
    .where("converted", "!=", 2)
    .where("privacy", "=", 0)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .where("approved", "=", 1)
    .where("is_short", "=", 0);

  if (categoryId !== null) query = query.where("category_id", "=", Number(categoryId));

  return query
    .orderBy("featured", "desc")
    .orderBy("time", "desc")
    .orderBy("id", "desc")
    .executeTakeFirst();
}

async function listRecentVideos(categoryId: string | null, featuredVideoId: number | null) {
  let query = getDb().selectFrom("videos")
    .select([
      "id",
      "video_id",
      "title",
      "description",
      "duration",
      "category_id",
      "vimeo",
      "video_location",
      "time",
      "views",
    ])
    .where("converted", "!=", 2)
    .where("privacy", "=", 0)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .where("approved", "=", 1)
    .where("is_short", "=", 0);

  if (categoryId !== null) query = query.where("category_id", "=", Number(categoryId));
  if (featuredVideoId !== null) query = query.where("id", "!=", featuredVideoId);

  return query
    .orderBy("time", "desc")
    .orderBy("id", "desc")
    .limit(8)
    .execute();
}

export async function getHomeCatalog(requestedCategoryId: string | null): Promise<HomeCatalog> {
  const categories = await listCategories();
  const activeCategoryId = categories.some(({ id }) => id === requestedCategoryId)
    ? requestedCategoryId
    : null;
  const video = await findFeaturedVideo(activeCategoryId);

  if (!video) return { categories, activeCategoryId, featuredVideo: null, recentVideos: [] };

  const recentRows = await listRecentVideos(activeCategoryId, video.id);
  const categoryLabels = new Map(categories.map((category) => [category.id, category.label]));
  const vimeoId = extractVimeoId(video.vimeo, video.video_location);
  const [vimeo, recentVideos] = await Promise.all([
    vimeoId ? getVimeoVideoPresentation(vimeoId) : null,
    Promise.all(recentRows.map(async (recentVideo): Promise<RecentVideo> => {
      const recentVimeoId = extractVimeoId(recentVideo.vimeo, recentVideo.video_location);
      const recentVimeo = recentVimeoId ? await getVimeoVideoPresentation(recentVimeoId) : null;

      return {
        id: recentVideo.id,
        publicId: recentVideo.video_id,
        title: decodeLegacyText(recentVideo.title.trim()),
        description: decodeLegacyText(recentVideo.description?.trim() ?? ""),
        duration: recentVideo.duration.trim(),
        categoryLabel: categoryLabels.get(String(recentVideo.category_id)) ?? null,
        vimeoId: recentVimeoId,
        thumbnailUrl: recentVimeo?.thumbnailUrl ?? null,
        publishedLabel: formatPublishedAt(recentVideo.time),
        viewsLabel: formatViews(recentVideo.views),
      };
    })),
  ]);

  return {
    categories,
    activeCategoryId,
    featuredVideo: {
      id: video.id,
      publicId: video.video_id,
      title: decodeLegacyText(video.title.trim()),
      description: decodeLegacyText(video.description?.trim() ?? ""),
      duration: video.duration,
      categoryLabel: categoryLabels.get(String(video.category_id)) ?? null,
      vimeoId,
      thumbnailUrl: vimeo?.thumbnailUrl ?? null,
    },
    recentVideos,
  };
}
