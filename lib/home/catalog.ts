import "server-only";

import { sql } from "kysely";
import { getDb } from "@/lib/db";
import { videoWatchHref } from "@/lib/home/navigation";
import { getVimeoVideoPresentation } from "@/lib/vimeo/videos";

export interface HomeCategory {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  anchorId: string;
}

export interface HomeSubcategory {
  id: string;
  categoryId: string;
  slug: string;
  label: string;
  description: string | null;
}

export interface HomeCategoryNavigation extends HomeCategory {
  subcategories: HomeSubcategory[];
}

export interface FeaturedVideo {
  id: number;
  publicId: string;
  title: string;
  description: string;
  duration: string;
  categoryLabel: string | null;
  categorySlug: string | null;
  vimeoId: string | null;
  thumbnailUrl: string | null;
  mobileThumbnailUrl: string | null;
}

export interface RecentVideo extends FeaturedVideo {
  publishedLabel: string;
  viewsLabel: string;
}

export interface HomeSearchResult {
  id: number;
  title: string;
  href: string;
  thumbnailUrl: string | null;
}

export interface HomeCatalog {
  categories: HomeCategory[];
  featuredVideos: FeaturedVideo[];
  featuredSettings: HomeFeaturedSettings;
  categorySections: HomeCategorySection[];
}

export interface HomeFeaturedSettings {
  count: number;
  intervalSeconds: number;
}

export interface HomeCategorySection {
  category: HomeCategory;
  subcategories: HomeSubcategorySection[];
}

export interface HomeSubcategorySection {
  subcategory: HomeSubcategory;
  videos: RecentVideo[];
}

export interface RecentVideosPage {
  videos: RecentVideo[];
  currentPage: number;
  totalPages: number;
  totalVideos: number;
}

export const RECENT_VIDEOS_PAGE_SIZE = 20;
const HOME_FEATURED_COUNT_CONFIG = "home_featured_count";
const HOME_FEATURED_INTERVAL_CONFIG = "home_featured_interval_seconds";
const HOME_FEATURED_SELECTION_CONFIG = "home_featured_selection_saved";
const DEFAULT_HOME_FEATURED_COUNT = 3;
const DEFAULT_HOME_FEATURED_INTERVAL_SECONDS = 8;
const MIN_HOME_FEATURED_COUNT = 1;
const MAX_HOME_FEATURED_COUNT = 5;
const MIN_HOME_FEATURED_INTERVAL_SECONDS = 3;
const MAX_HOME_FEATURED_INTERVAL_SECONDS = 15;

export type CategoryVideoSort =
  | "nome-asc"
  | "nome-desc"
  | "data-asc"
  | "data-desc"
  | "duracao-asc"
  | "duracao-desc";

export interface CategoryVideosPage extends RecentVideosPage {
  category: HomeCategory;
  sort: CategoryVideoSort;
}

export interface VideoComment {
  id: number;
  authorName: string;
  authorInitials: string;
  text: string;
  publishedLabel: string;
  likesLabel: string;
}

export interface VideoWatchPage {
  category: HomeCategory;
  subcategories: HomeSubcategory[];
  video: RecentVideo;
  likesLabel: string;
  commentsLabel: string;
  comments: VideoComment[];
  relatedVideos: RecentVideo[];
}

const CATEGORY_VIDEO_SORTS = new Set<CategoryVideoSort>([
  "nome-asc",
  "nome-desc",
  "data-asc",
  "data-desc",
  "duracao-asc",
  "duracao-desc",
]);

export function formatViews(views: number): string {
  const safeViews = Number.isFinite(views) && views > 0 ? Math.floor(views) : 0;
  return `${new Intl.NumberFormat("pt-BR").format(safeViews)} ${safeViews === 1 ? "visualização" : "visualizações"}`;
}

export function normalizeCategoryRoute(value: string): string | null {
  const prefix = "categoria-";
  if (!value.startsWith(prefix)) return null;

  const slug = value.slice(prefix.length).trim();
  if (!slug || slug.includes("/") || slug.length > 160) return null;

  try {
    const decodedSlug = decodeURIComponent(slug);
    return decodedSlug.includes("/") || decodedSlug.includes("\\")
      ? null
      : decodedSlug;
  } catch {
    return null;
  }
}

export function normalizeCategoryVideoSort(
  value: string | null | undefined,
): CategoryVideoSort {
  return CATEGORY_VIDEO_SORTS.has(value as CategoryVideoSort)
    ? (value as CategoryVideoSort)
    : "data-desc";
}

function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 120);
}

export function formatPublishedAt(
  timestamp: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const elapsedDays = Math.max(
    0,
    Math.floor((nowSeconds - timestamp) / 86_400),
  );
  if (elapsedDays === 0) return "hoje";
  if (elapsedDays < 30)
    return `há ${elapsedDays} ${elapsedDays === 1 ? "dia" : "dias"}`;

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12)
    return `há ${elapsedMonths} ${elapsedMonths === 1 ? "mês" : "meses"}`;

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

  return value.replace(
    /&(amp|apos|gt|lt|quot|#039);/gi,
    (entity, key: string) => entities[key.toLowerCase()] ?? entity,
  );
}

export function extractVimeoId(
  vimeo: string,
  videoLocation: string,
): string | null {
  const direct = vimeo.trim();
  if (/^\d{6,12}$/.test(direct)) return direct;

  let decoded = videoLocation;
  try {
    decoded = decodeURIComponent(videoLocation);
  } catch {
    // A malformed legacy value is simply not a playable Vimeo source.
  }

  const match = decoded.match(
    /(?:player\.)?vimeo\.com\/video\/(\d{6,12})(?:[/?#]|$)/i,
  );
  return match?.[1] ?? null;
}

export function normalizeVimeoWatchId(
  value: string | null | undefined,
): string | null {
  const vimeoId = (value ?? "").trim();
  return /^\d{6,12}$/.test(vimeoId) ? vimeoId : null;
}

function normalizeAnchorSegment(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "categoria"
  );
}

export function categoryAnchorId(
  category: Pick<HomeCategory, "id" | "slug">,
): string {
  return `categoria-${normalizeAnchorSegment(category.slug || category.id)}`;
}

function createCategory(row: {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}): HomeCategory {
  const category = {
    id: String(row.id),
    slug: row.slug.trim(),
    label: decodeLegacyText(row.name.trim()),
    description: row.description?.trim()
      ? decodeLegacyText(row.description.trim())
      : null,
  };

  return { ...category, anchorId: categoryAnchorId(category) };
}

interface PresentedVideoRow {
  id: number;
  video_id: string;
  title: string;
  description: string | null;
  duration: string;
  vimeo: string;
  video_location: string;
  time: number;
  views: number;
}

interface VideoCategorySummary {
  label: string;
  slug: string;
}

export async function listHomeCategories(): Promise<HomeCategory[]> {
  const rows = await getDb()
    .selectFrom("academy_categories")
    .select(["id", "name", "slug", "description"])
    .where("is_active", "=", 1)
    .orderBy("sort_order", "asc")
    .orderBy("name", "asc")
    .orderBy("id", "asc")
    .execute();

  return rows.map((row) => {
    return createCategory(row);
  });
}

function publicVideosQuery() {
  return getDb()
    .selectFrom("videos")
    .where("converted", "!=", 2)
    .where("privacy", "=", 0)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .where("approved", "=", 1)
    .where("upload_status", "=", "ready")
    .where("deleted_at", "is", null)
    .where("is_short", "=", 0);
}

function clampInteger(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isSafeInteger(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

async function readConfigNumber(
  name: string,
  min: number,
  max: number,
  fallback: number,
): Promise<number> {
  const row = await getDb()
    .selectFrom("config")
    .select("value")
    .where("name", "=", name)
    .orderBy("id", "asc")
    .executeTakeFirst();
  const parsed = Number.parseInt(row?.value ?? "", 10);

  return clampInteger(parsed, min, max, fallback);
}

async function getHomeFeaturedSettings(): Promise<HomeFeaturedSettings> {
  const [count, intervalSeconds] = await Promise.all([
    readConfigNumber(
      HOME_FEATURED_COUNT_CONFIG,
      MIN_HOME_FEATURED_COUNT,
      MAX_HOME_FEATURED_COUNT,
      DEFAULT_HOME_FEATURED_COUNT,
    ),
    readConfigNumber(
      HOME_FEATURED_INTERVAL_CONFIG,
      MIN_HOME_FEATURED_INTERVAL_SECONDS,
      MAX_HOME_FEATURED_INTERVAL_SECONDS,
      DEFAULT_HOME_FEATURED_INTERVAL_SECONDS,
    ),
  ]);

  return { count, intervalSeconds };
}

async function hasSavedFeaturedSelection(): Promise<boolean> {
  const row = await getDb()
    .selectFrom("config")
    .select("id")
    .where("name", "=", HOME_FEATURED_SELECTION_CONFIG)
    .executeTakeFirst();

  return Boolean(row);
}

async function listFeaturedVideoRows(settings: HomeFeaturedSettings) {
  const selectionSaved = await hasSavedFeaturedSelection();
  const selectedRows = selectionSaved
    ? await publicVideosQuery()
        .select([
          "id",
          "video_id",
          "title",
          "description",
          "duration",
          "vimeo",
          "video_location",
        ])
        .where("featured", ">", 0)
        .orderBy("featured", "asc")
        .orderBy("time", "desc")
        .orderBy("id", "desc")
        .limit(settings.count)
        .execute()
    : [];

  if (selectedRows.length >= settings.count) return selectedRows;

  const selectedIds = selectedRows.map((video) => video.id);
  let fallbackQuery = publicVideosQuery().select([
    "id",
    "video_id",
    "title",
    "description",
    "duration",
    "vimeo",
    "video_location",
  ]);

  if (selectedIds.length > 0) {
    fallbackQuery = fallbackQuery.where("id", "not in", selectedIds);
  }

  const fallbackRows = await fallbackQuery
    .orderBy(
      sql<number>`greatest(${sql.ref("publication_date")}, ${sql.ref("time")})`,
      "desc",
    )
    .orderBy("id", "desc")
    .limit(settings.count - selectedRows.length)
    .execute();

  return [...selectedRows, ...fallbackRows];
}

async function listSubcategories(
  categories: HomeCategory[],
): Promise<HomeSubcategory[]> {
  if (categories.length === 0) return [];

  const rows = await getDb()
    .selectFrom("academy_subcategories")
    .select(["id", "category_id", "name", "slug", "description"])
    .where("is_active", "=", 1)
    .where(
      "category_id",
      "in",
      categories.map((category) => Number(category.id)),
    )
    .orderBy("category_id", "asc")
    .orderBy("sort_order", "asc")
    .orderBy("name", "asc")
    .orderBy("id", "asc")
    .execute();

  return rows.map((row) => ({
    id: String(row.id),
    categoryId: String(row.category_id),
    slug: row.slug.trim(),
    label: decodeLegacyText(row.name.trim()),
    description: row.description?.trim()
      ? decodeLegacyText(row.description.trim())
      : null,
  }));
}

export async function listHomeCategoryNavigation(): Promise<
  HomeCategoryNavigation[]
> {
  const categories = await listHomeCategories();
  const subcategories = await listSubcategories(categories);
  const subcategoriesByCategory = new Map<string, HomeSubcategory[]>();

  for (const subcategory of subcategories) {
    const current = subcategoriesByCategory.get(subcategory.categoryId) ?? [];
    current.push(subcategory);
    subcategoriesByCategory.set(subcategory.categoryId, current);
  }

  return categories.map((category) => ({
    ...category,
    subcategories: subcategoriesByCategory.get(category.id) ?? [],
  }));
}

async function listSubcategoryVideos(subcategory: HomeSubcategory) {
  return publicVideosQuery()
    .innerJoin(
      "academy_video_subcategories",
      "academy_video_subcategories.video_id",
      "videos.id",
    )
    .select([
      "videos.id as id",
      "videos.video_id as video_id",
      "videos.title as title",
      "videos.description as description",
      "videos.duration as duration",
      "videos.vimeo as vimeo",
      "videos.video_location as video_location",
      "videos.time as time",
      "videos.views as views",
    ])
    .where(
      "academy_video_subcategories.subcategory_id",
      "=",
      Number(subcategory.id),
    )
    .orderBy("videos.time", "desc")
    .orderBy("videos.id", "desc")
    .limit(10)
    .execute();
}

async function listVideoCategorySummaries(
  videoIds: number[],
): Promise<Map<number, VideoCategorySummary>> {
  const ids = Array.from(new Set(videoIds));
  if (ids.length === 0) return new Map();

  const rows = await getDb()
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
      "academy_video_subcategories.video_id as videoId",
      "academy_categories.name as categoryName",
      "academy_categories.slug as categorySlug",
    ])
    .where("academy_video_subcategories.video_id", "in", ids)
    .where("academy_subcategories.is_active", "=", 1)
    .where("academy_categories.is_active", "=", 1)
    .orderBy("academy_categories.sort_order", "asc")
    .orderBy("academy_categories.name", "asc")
    .execute();

  const labels = new Map<number, VideoCategorySummary>();
  for (const row of rows) {
    if (!labels.has(row.videoId)) {
      labels.set(row.videoId, {
        label: decodeLegacyText(row.categoryName.trim()),
        slug: row.categorySlug.trim(),
      });
    }
  }

  return labels;
}

async function listCategorySections(
  categories: HomeCategory[],
): Promise<HomeCategorySection[]> {
  if (categories.length === 0) return [];

  const subcategories = await listSubcategories(categories);
  const subcategoriesByCategory = new Map<string, HomeSubcategory[]>();
  for (const subcategory of subcategories) {
    if (categories.some((category) => category.id === subcategory.categoryId)) {
      const current = subcategoriesByCategory.get(subcategory.categoryId) ?? [];
      current.push(subcategory);
      subcategoriesByCategory.set(subcategory.categoryId, current);
    }
  }

  const rowsBySubcategory = await Promise.all(
    subcategories.map(listSubcategoryVideos),
  );
  const videosBySubcategory = new Map<string, RecentVideo[]>();

  await Promise.all(
    subcategories.map(async (subcategory, index) => {
      const parent = categories.find(
        (category) => category.id === subcategory.categoryId,
      );
      const rows = rowsBySubcategory[index];
      const labels = new Map(
        rows
          .map((row) => [
            row.id,
            parent
              ? {
                  label: parent.label,
                  slug: parent.slug,
                }
              : null,
          ])
          .filter(
            (entry): entry is [number, VideoCategorySummary] =>
              entry[1] !== null,
          ),
      );
      videosBySubcategory.set(
        subcategory.id,
        await presentRecentVideos(rows, labels),
      );
    }),
  );

  return categories.flatMap((category) => {
    const sections = (subcategoriesByCategory.get(category.id) ?? []).flatMap(
      (subcategory) => {
        const videos = videosBySubcategory.get(subcategory.id) ?? [];
        return videos.length > 0 ? [{ subcategory, videos }] : [];
      },
    );

    return sections.length > 0 ? [{ category, subcategories: sections }] : [];
  });
}

export function normalizeRecentVideosPage(
  value: string | null | undefined,
): number {
  if (!value || !/^\d+$/.test(value)) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function orderCategoryVideos(
  query: ReturnType<typeof publicVideosQuery>,
  sort: CategoryVideoSort,
) {
  switch (sort) {
    case "nome-asc":
      return query.orderBy("title", "asc").orderBy("id", "asc");
    case "nome-desc":
      return query.orderBy("title", "desc").orderBy("id", "desc");
    case "data-asc":
      return query.orderBy("time", "asc").orderBy("id", "asc");
    case "duracao-asc":
      return query
        .orderBy(sql<number>`time_to_sec(videos.duration)`, "asc")
        .orderBy("id", "asc");
    case "duracao-desc":
      return query
        .orderBy(sql<number>`time_to_sec(videos.duration)`, "desc")
        .orderBy("id", "desc");
    case "data-desc":
    default:
      return query.orderBy("time", "desc").orderBy("id", "desc");
  }
}

async function presentRecentVideos(
  rows: readonly PresentedVideoRow[],
  categoryLabels: Map<number, VideoCategorySummary>,
): Promise<RecentVideo[]> {
  return Promise.all(
    rows.map(async (video): Promise<RecentVideo> => {
      const vimeoId = extractVimeoId(video.vimeo, video.video_location);
      const vimeo = vimeoId ? await getVimeoVideoPresentation(vimeoId) : null;

      return {
        id: video.id,
        publicId: video.video_id,
        title: decodeLegacyText(video.title.trim()),
        description: decodeLegacyText(video.description?.trim() ?? ""),
        duration: video.duration.trim(),
        categoryLabel: categoryLabels.get(video.id)?.label ?? null,
        categorySlug: categoryLabels.get(video.id)?.slug ?? null,
        vimeoId,
        thumbnailUrl: vimeo?.thumbnailUrl ?? null,
        mobileThumbnailUrl: vimeo?.mobileThumbnailUrl ?? null,
        publishedLabel: formatPublishedAt(video.time),
        viewsLabel: formatViews(video.views),
      };
    }),
  );
}

export async function getRecentVideosPage(
  requestedPage: number,
): Promise<RecentVideosPage> {
  const countRow = await publicVideosQuery()
    .select(({ fn }) => fn.countAll<number>().as("total"))
    .executeTakeFirst();
  const totalVideos = Number(countRow?.total ?? 0);
  const totalPages = Math.ceil(totalVideos / RECENT_VIDEOS_PAGE_SIZE);
  const currentPage = Math.min(
    Math.max(1, requestedPage),
    Math.max(1, totalPages),
  );
  const rows = await publicVideosQuery()
    .select([
      "id",
      "video_id",
      "title",
      "description",
      "duration",
      "vimeo",
      "video_location",
      "time",
      "views",
    ])
    .orderBy("time", "desc")
    .orderBy("id", "desc")
    .limit(RECENT_VIDEOS_PAGE_SIZE)
    .offset((currentPage - 1) * RECENT_VIDEOS_PAGE_SIZE)
    .execute();
  const categoryLabels = await listVideoCategorySummaries(
    rows.map((video) => video.id),
  );

  return {
    videos: await presentRecentVideos(rows, categoryLabels),
    currentPage,
    totalPages,
    totalVideos,
  };
}

export async function searchHomeVideos(
  query: string,
  limit = 8,
): Promise<HomeSearchResult[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  const safeLimit = clampInteger(limit, 1, 12, 8);

  if (normalizedQuery.length < 2) return [];

  const rows = await publicVideosQuery()
    .innerJoin(
      "academy_video_subcategories",
      "academy_video_subcategories.video_id",
      "videos.id",
    )
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
      "videos.id as id",
      "videos.video_id as video_id",
      "videos.title as title",
      "videos.description as description",
      "videos.duration as duration",
      "videos.vimeo as vimeo",
      "videos.video_location as video_location",
      "videos.time as time",
      "videos.views as views",
      "academy_categories.name as categoryName",
      "academy_categories.slug as categorySlug",
    ])
    .where("academy_subcategories.is_active", "=", 1)
    .where("academy_categories.is_active", "=", 1)
    .where("videos.title", "like", `%${normalizedQuery}%`)
    .orderBy("videos.title", "asc")
    .orderBy("videos.id", "desc")
    .limit(safeLimit * 3)
    .execute();

  const uniqueRows = new Map<number, (typeof rows)[number]>();
  for (const row of rows) {
    if (!uniqueRows.has(row.id)) uniqueRows.set(row.id, row);
    if (uniqueRows.size >= safeLimit) break;
  }

  const uniqueVideos = Array.from(uniqueRows.values());
  const categoryLabels = new Map<number, VideoCategorySummary>(
    uniqueVideos.map((video) => [
      video.id,
      {
        label: decodeLegacyText(video.categoryName.trim()),
        slug: video.categorySlug.trim(),
      },
    ]),
  );
  const videos = await presentRecentVideos(uniqueVideos, categoryLabels);

  return videos.flatMap((video) =>
    video.categorySlug && video.vimeoId
      ? [
          {
            id: video.id,
            title: video.title,
            href: videoWatchHref({ slug: video.categorySlug }, video),
            thumbnailUrl: video.thumbnailUrl,
          },
        ]
      : [],
  );
}

export async function getCategoryVideosPage(
  categorySlug: string,
  requestedPage: number,
  requestedSort: CategoryVideoSort,
): Promise<CategoryVideosPage | null> {
  const row = await getDb()
    .selectFrom("academy_categories")
    .select(["id", "name", "slug", "description"])
    .where("slug", "=", categorySlug)
    .where("is_active", "=", 1)
    .executeTakeFirst();

  if (!row) return null;

  const categoryWithAnchor = createCategory(row);
  const videoIds = getDb()
    .selectFrom("academy_video_subcategories")
    .innerJoin(
      "academy_subcategories",
      "academy_subcategories.id",
      "academy_video_subcategories.subcategory_id",
    )
    .select("academy_video_subcategories.video_id")
    .where("academy_subcategories.category_id", "=", row.id)
    .where("academy_subcategories.is_active", "=", 1);

  const baseQuery = publicVideosQuery().where("id", "in", videoIds);
  const countRow = await baseQuery
    .select(({ fn }) => fn.countAll<number>().as("total"))
    .executeTakeFirst();
  const totalVideos = Number(countRow?.total ?? 0);
  const totalPages = Math.ceil(totalVideos / RECENT_VIDEOS_PAGE_SIZE);
  const currentPage = Math.min(
    Math.max(1, requestedPage),
    Math.max(1, totalPages),
  );
  const rows = await orderCategoryVideos(baseQuery, requestedSort)
    .select([
      "id",
      "video_id",
      "title",
      "description",
      "duration",
      "vimeo",
      "video_location",
      "time",
      "views",
    ])
    .limit(RECENT_VIDEOS_PAGE_SIZE)
    .offset((currentPage - 1) * RECENT_VIDEOS_PAGE_SIZE)
    .execute();

  const categoryLabels = new Map(
    rows.map((video) => [
      video.id,
      {
        label: categoryWithAnchor.label,
        slug: categoryWithAnchor.slug,
      },
    ]),
  );

  return {
    category: categoryWithAnchor,
    sort: requestedSort,
    videos: await presentRecentVideos(rows, categoryLabels),
    currentPage,
    totalPages,
    totalVideos,
  };
}

async function countVideoLikes(videoId: number): Promise<number> {
  const row = await getDb()
    .selectFrom("likes_dislikes")
    .select(({ fn }) => fn.countAll<number>().as("total"))
    .where("video_id", "=", videoId)
    .where("type", "=", 1)
    .executeTakeFirst();

  return Number(row?.total ?? 0);
}

async function listVideoComments(videoId: number): Promise<VideoComment[]> {
  const rows = await getDb()
    .selectFrom("comments")
    .leftJoin("users", "users.id", "comments.user_id")
    .select([
      "comments.id as id",
      "comments.text as text",
      "comments.time as time",
      "comments.likes as likes",
      "users.username as username",
      "users.first_name as firstName",
      "users.last_name as lastName",
    ])
    .where("comments.video_id", "=", videoId)
    .orderBy("comments.pinned", "desc")
    .orderBy("comments.time", "desc")
    .orderBy("comments.id", "desc")
    .limit(20)
    .execute();

  return rows.flatMap((comment) => {
    const text = decodeLegacyText(comment.text?.trim() ?? "");
    if (!text) return [];

    const authorName =
      [comment.firstName, comment.lastName]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(" ") ||
      comment.username?.trim() ||
      "Aluno";
    const initials =
      authorName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "A";

    return [
      {
        id: comment.id,
        authorName: decodeLegacyText(authorName),
        authorInitials: initials,
        text,
        publishedLabel: formatPublishedAt(comment.time),
        likesLabel: formatViews(comment.likes)
          .replace("visualizações", "likes")
          .replace("visualização", "like"),
      },
    ];
  });
}

async function listVideoSubcategories(
  videoId: number,
  categoryId: string,
): Promise<HomeSubcategory[]> {
  const rows = await getDb()
    .selectFrom("academy_video_subcategories")
    .innerJoin(
      "academy_subcategories",
      "academy_subcategories.id",
      "academy_video_subcategories.subcategory_id",
    )
    .select([
      "academy_subcategories.id as id",
      "academy_subcategories.category_id as categoryId",
      "academy_subcategories.name as name",
      "academy_subcategories.slug as slug",
      "academy_subcategories.description as description",
    ])
    .where("academy_video_subcategories.video_id", "=", videoId)
    .where("academy_subcategories.category_id", "=", Number(categoryId))
    .where("academy_subcategories.is_active", "=", 1)
    .orderBy("academy_subcategories.sort_order", "asc")
    .orderBy("academy_subcategories.name", "asc")
    .orderBy("academy_subcategories.id", "asc")
    .execute();

  return rows.map((row) => ({
    id: String(row.id),
    categoryId: String(row.categoryId),
    slug: row.slug.trim(),
    label: decodeLegacyText(row.name.trim()),
    description: row.description?.trim()
      ? decodeLegacyText(row.description.trim())
      : null,
  }));
}

export async function getVideoWatchPage(
  categorySlug: string,
  vimeoId: string,
): Promise<VideoWatchPage | null> {
  const categoryRow = await getDb()
    .selectFrom("academy_categories")
    .select(["id", "name", "slug", "description"])
    .where("slug", "=", categorySlug)
    .where("is_active", "=", 1)
    .executeTakeFirst();

  if (!categoryRow) return null;

  const category = createCategory(categoryRow);
  const encodedVimeoPath = `%2Fvideo%2F${vimeoId}%`;
  const plainVimeoPath = `%/video/${vimeoId}%`;
  const videoIds = getDb()
    .selectFrom("academy_video_subcategories")
    .innerJoin(
      "academy_subcategories",
      "academy_subcategories.id",
      "academy_video_subcategories.subcategory_id",
    )
    .select("academy_video_subcategories.video_id")
    .where("academy_subcategories.category_id", "=", categoryRow.id)
    .where("academy_subcategories.is_active", "=", 1);
  const videoRow = await publicVideosQuery()
    .select([
      "id",
      "video_id",
      "title",
      "description",
      "duration",
      "vimeo",
      "video_location",
      "time",
      "views",
    ])
    .where("id", "in", videoIds)
    .where((eb) =>
      eb.or([
        eb("vimeo", "=", vimeoId),
        eb("video_location", "like", encodedVimeoPath),
        eb("video_location", "like", plainVimeoPath),
      ]),
    )
    .executeTakeFirst();

  if (!videoRow) return null;

  const relatedRows = await publicVideosQuery()
    .where("id", "in", videoIds)
    .where("id", "!=", videoRow.id)
    .select([
      "id",
      "video_id",
      "title",
      "description",
      "duration",
      "vimeo",
      "video_location",
      "time",
      "views",
    ])
    .orderBy("time", "desc")
    .orderBy("id", "desc")
    .limit(12)
    .execute();
  const categoryLabels = new Map(
    [videoRow, ...relatedRows].map((video) => [
      video.id,
      {
        label: category.label,
        slug: category.slug,
      },
    ]),
  );
  const [video, relatedVideos, likes, comments, subcategories] =
    await Promise.all([
      presentRecentVideos([videoRow], categoryLabels).then(
        ([presented]) => presented,
      ),
      presentRecentVideos(relatedRows, categoryLabels),
      countVideoLikes(videoRow.id),
      listVideoComments(videoRow.id),
      listVideoSubcategories(videoRow.id, category.id),
    ]);

  if (!video?.vimeoId) return null;

  return {
    category,
    subcategories,
    video,
    likesLabel: formatViews(likes)
      .replace("visualizações", "likes")
      .replace("visualização", "like"),
    commentsLabel: `${new Intl.NumberFormat("pt-BR").format(comments.length)} ${comments.length === 1 ? "comentário" : "comentários"}`,
    comments,
    relatedVideos,
  };
}

export async function getHomeCatalog(): Promise<HomeCatalog> {
  const [categories, featuredSettings] = await Promise.all([
    listHomeCategories(),
    getHomeFeaturedSettings(),
  ]);
  const [featuredRows, categorySections] = await Promise.all([
    listFeaturedVideoRows(featuredSettings),
    listCategorySections(categories),
  ]);

  const categoryLabels = await listVideoCategorySummaries(
    featuredRows.map((video) => video.id),
  );
  const featuredVideos = await Promise.all(
    featuredRows.map(async (video) => {
      const vimeoId = extractVimeoId(video.vimeo, video.video_location);
      const vimeo = vimeoId ? await getVimeoVideoPresentation(vimeoId) : null;

      return {
        id: video.id,
        publicId: video.video_id,
        title: decodeLegacyText(video.title.trim()),
        description: decodeLegacyText(video.description?.trim() ?? ""),
        duration: video.duration,
        categoryLabel: categoryLabels.get(video.id)?.label ?? null,
        categorySlug: categoryLabels.get(video.id)?.slug ?? null,
        vimeoId,
        thumbnailUrl: vimeo?.thumbnailUrl ?? null,
        mobileThumbnailUrl: vimeo?.mobileThumbnailUrl ?? null,
      };
    }),
  );

  return {
    categories,
    featuredVideos,
    featuredSettings,
    categorySections,
  };
}
