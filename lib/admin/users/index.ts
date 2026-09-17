import "server-only";

import { sql } from "kysely";
import { PasswordUtils } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { getPrisma } from "@/lib/db/prisma";
import { calculateModuleProgress } from "@/lib/home/module-progress";
import type {
  AdminUserCreated,
  AdminUserListItem,
  AdminUsersPage,
  AdminUsersStats,
} from "./contracts";
import type {
  AdminUserCreateInput,
  AdminUserPasswordResetInput,
  AdminUserUpdateInput,
} from "./validation";

export type {
  AdminUserCreated,
  AdminUserListItem,
  AdminUsersPage,
  AdminUsersStats,
} from "./contracts";

export const ADMIN_USERS_PAGE_SIZE = 30;
export const ADMIN_USERS_PAGE_SIZES = [20, 30, 40, 50] as const;

export interface AdminUserDetails extends AdminUserListItem {
  email: string;
  firstName: string;
  gender: "female" | "male";
  lastName: string;
  registeredAt: number;
  username: string;
}

export interface AdminUserLearningMetrics {
  completedVideos: number;
  watchedSeconds: number;
  recentVideos: AdminUserRecentVideo[];
}

export interface AdminUserCategoryProgress {
  completedVideos: number;
  id: number;
  name: string;
  percentage: number;
  totalVideos: number;
}

export interface AdminUserRecentVideo {
  completedAt: Date | null;
  duration: string;
  furthestPositionSeconds: number;
  id: number;
  lastWatchedAt: Date;
  title: string;
}

export interface AdminUsernameSuggestion {
  id: number;
  username: string;
}

export function getAdminUsersPage(
  value: string | string[] | undefined,
): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawValue ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function getAdminUsersPageSize(
  value: string | string[] | undefined,
): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const pageSize = Number.parseInt(rawValue ?? "", 10);

  return ADMIN_USERS_PAGE_SIZES.some((size) => size === pageSize)
    ? pageSize
    : ADMIN_USERS_PAGE_SIZE;
}

export function getAdminUsersSearch(
  value: string | string[] | undefined,
): string {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return rawValue?.trim().slice(0, 120) ?? "";
}

export async function listAdminUsers(
  requestedPage = 1,
  requestedPageSize = ADMIN_USERS_PAGE_SIZE,
  search = "",
): Promise<AdminUsersPage> {
  const prisma = getPrisma();
  const pageSize = ADMIN_USERS_PAGE_SIZES.some(
    (size) => size === requestedPageSize,
  )
    ? requestedPageSize
    : ADMIN_USERS_PAGE_SIZE;
  const normalizedSearch = search.trim().slice(0, 120);
  const where = normalizedSearch
    ? { username: { contains: normalizedSearch } }
    : undefined;
  const totalItems = await prisma.users.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const users = await prisma.users.findMany({
    where,
    select: {
      id: true,
      username: true,
      codigorca: true,
      active: true,
      admin: true,
      time: true,
    },
    orderBy: [{ time: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: users.map((user) => ({
      id: user.id,
      name: user.username.trim() || user.codigorca,
      rca: user.codigorca,
      registeredAt: user.time,
      isActive: user.active === 1,
      isAdmin: user.admin === 1,
    })),
    page,
    pageSize,
    search: normalizedSearch,
    totalItems,
    totalPages,
  };
}

export async function getAdminUsersStats(): Promise<AdminUsersStats> {
  const prisma = getPrisma();
  const [total, active] = await Promise.all([
    prisma.users.count(),
    prisma.users.count({ where: { active: 1 } }),
  ]);

  return {
    total,
    active,
    inactive: Math.max(0, total - active),
  };
}

export async function searchAdminUsernames(
  query: string,
  limit = 7,
): Promise<AdminUsernameSuggestion[]> {
  const normalizedQuery = query.trim().slice(0, 120);
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit)), 10);

  if (normalizedQuery.length < 2) return [];

  const users = await getPrisma().users.findMany({
    where: { username: { contains: normalizedQuery } },
    select: { id: true, username: true },
    orderBy: [{ username: "asc" }, { id: "desc" }],
    take: safeLimit,
  });

  return users.flatMap((user) => {
    const username = user.username.trim();
    return username ? [{ id: user.id, username }] : [];
  });
}

export async function getAdminUserDetails(
  userId: string,
): Promise<AdminUserDetails | null> {
  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id < 1) return null;

  const user = await getPrisma().users.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      codigorca: true,
      email: true,
      first_name: true,
      gender: true,
      last_name: true,
      active: true,
      admin: true,
      time: true,
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.username.trim() || user.codigorca,
    rca: user.codigorca,
    email: user.email.trim(),
    firstName: user.first_name.trim(),
    gender: user.gender === "female" ? "female" : "male",
    lastName: user.last_name.trim(),
    isActive: user.active === 1,
    isAdmin: user.admin === 1,
    registeredAt: user.time,
    username: user.username.trim(),
  };
}

export async function updateAdminUser(
  userId: string,
  input: AdminUserUpdateInput,
): Promise<AdminUserDetails | null> {
  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id < 1) return null;

  const existingUser = await getPrisma().users.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existingUser) return null;

  const user = await getPrisma().users.update({
    where: { id },
    data: {
      username: input.username,
      first_name: input.firstName,
      last_name: input.lastName,
      codigorca: input.rca,
      email: input.email,
      active: input.isActive ? 1 : 0,
      admin: input.isAdmin ? 1 : 0,
      gender: input.gender,
    },
    select: {
      id: true,
      username: true,
      codigorca: true,
      email: true,
      first_name: true,
      gender: true,
      last_name: true,
      active: true,
      admin: true,
      time: true,
    },
  });

  return {
    id: user.id,
    name: user.username.trim() || user.codigorca,
    rca: user.codigorca,
    email: user.email.trim(),
    firstName: user.first_name.trim(),
    gender: user.gender === "female" ? "female" : "male",
    lastName: user.last_name.trim(),
    isActive: user.active === 1,
    isAdmin: user.admin === 1,
    registeredAt: user.time,
    username: user.username.trim(),
  };
}

export async function resetAdminUserPassword(
  userId: string,
  input: AdminUserPasswordResetInput,
): Promise<boolean> {
  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id < 1) return false;

  const password = await PasswordUtils.hashPassword(input.password);
  const result = await getPrisma().users.updateMany({
    where: { id },
    data: {
      must_change_password: input.mustChangePassword,
      password,
    },
  });

  return result.count === 1;
}

export class AdminUserIdentifierConflictError extends Error {
  constructor() {
    super("O RCA ou e-mail informado já está em uso.");
    this.name = "AdminUserIdentifierConflictError";
  }
}

export async function createAdminUser(
  input: AdminUserCreateInput,
): Promise<AdminUserCreated> {
  const identifiers = [input.rca, ...(input.email ? [input.email] : [])];
  const prisma = getPrisma();
  const conflictingUser = await prisma.users.findFirst({
    where: {
      OR: [{ codigorca: { in: identifiers } }, { email: { in: identifiers } }],
    },
    select: { id: true },
  });

  if (conflictingUser) throw new AdminUserIdentifierConflictError();

  const now = new Date();
  const password = await PasswordUtils.hashPassword(input.password);
  const user = await prisma.users.create({
    data: {
      active: input.isActive ? 1 : 0,
      admin: input.isAdmin ? 1 : 0,
      codigorca: input.rca,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      password,
      must_change_password: input.mustChangePassword,
      registered: `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`,
      time: Math.floor(now.getTime() / 1000),
      two_factor: 0,
      username: input.username,
    },
    select: { id: true },
  });

  return {
    ...user,
    temporaryPassword: input.mustChangePassword ? input.password : null,
  };
}

export async function getAdminUserLearningMetrics(
  userId: number,
): Promise<AdminUserLearningMetrics> {
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return { completedVideos: 0, watchedSeconds: 0, recentVideos: [] };
  }

  const prisma = getPrisma();
  const [progress, completedVideos, recentVideos] = await Promise.all([
    prisma.academy_video_progress.aggregate({
      where: { user_id: userId },
      _sum: { furthest_position_seconds: true },
    }),
    prisma.academy_video_progress.count({
      where: { user_id: userId, completed_at: { not: null } },
    }),
    prisma.academy_video_progress.findMany({
      where: { user_id: userId },
      orderBy: { last_watched_at: "desc" },
      take: 10,
      select: {
        completed_at: true,
        furthest_position_seconds: true,
        id: true,
        last_watched_at: true,
        video: { select: { duration: true, title: true } },
      },
    }),
  ]);

  return {
    completedVideos,
    watchedSeconds: Math.max(0, progress._sum.furthest_position_seconds ?? 0),
    recentVideos: recentVideos.map((progressItem) => ({
      completedAt: progressItem.completed_at,
      duration: progressItem.video.duration.trim() || "00:00",
      furthestPositionSeconds: Math.max(
        0,
        progressItem.furthest_position_seconds,
      ),
      id: progressItem.id,
      lastWatchedAt: progressItem.last_watched_at,
      title: progressItem.video.title.trim() || "Vídeo sem título",
    })),
  };
}

export async function listAdminUserCategoryProgress(
  userId: number,
): Promise<AdminUserCategoryProgress[]> {
  if (!Number.isSafeInteger(userId) || userId < 1) return [];

  const rows = await getDb()
    .selectFrom("academy_categories")
    .innerJoin(
      "academy_subcategories",
      "academy_subcategories.category_id",
      "academy_categories.id",
    )
    .innerJoin(
      "academy_video_subcategories",
      "academy_video_subcategories.subcategory_id",
      "academy_subcategories.id",
    )
    .innerJoin("videos", "videos.id", "academy_video_subcategories.video_id")
    .leftJoin("academy_video_progress", (join) =>
      join
        .onRef("academy_video_progress.video_id", "=", "videos.id")
        .on("academy_video_progress.user_id", "=", userId),
    )
    .select([
      "academy_categories.id as categoryId",
      "academy_categories.name as categoryName",
      "academy_categories.sort_order as sortOrder",
      sql<number>`count(distinct ${sql.ref("videos.id")})`.as("totalVideos"),
      sql<number>`count(distinct case when ${sql.ref("academy_video_progress.completed_at")} is not null then ${sql.ref("videos.id")} end)`.as(
        "completedVideos",
      ),
    ])
    .where("academy_categories.is_active", "=", 1)
    .where("academy_subcategories.is_active", "=", 1)
    .where("videos.converted", "!=", 2)
    .where("videos.privacy", "=", 0)
    .where("videos.is_movie", "=", 0)
    .where("videos.live_time", "=", 0)
    .where("videos.approved", "=", 1)
    .where("videos.upload_status", "=", "ready")
    .where("videos.deleted_at", "is", null)
    .where("videos.is_short", "=", 0)
    .groupBy([
      "academy_categories.id",
      "academy_categories.name",
      "academy_categories.sort_order",
    ])
    .orderBy("academy_categories.sort_order")
    .orderBy("academy_categories.name")
    .execute();

  return rows.map((row) => {
    const progress = calculateModuleProgress(
      Number(row.completedVideos ?? 0),
      Number(row.totalVideos ?? 0),
    );

    return {
      completedVideos: progress.completedLessons,
      id: row.categoryId,
      name: row.categoryName.trim() || "Categoria sem nome",
      percentage: progress.percentage,
      totalVideos: progress.totalLessons,
    };
  });
}
