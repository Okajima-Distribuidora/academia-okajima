import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryVideosContent } from "@/components/home/category-videos-content";
import { requireUser } from "@/lib/auth/session";
import {
  getCategoryVideosPage,
  normalizeCategoryRoute,
  normalizeCategoryVideoSort,
  normalizeRecentVideosPage,
} from "@/lib/home/catalog";
import { getModuleProgress } from "@/lib/home/video-progress";

export async function generateMetadata({
  params,
}: PageProps<"/[categoryRoute]">): Promise<Metadata> {
  const { categoryRoute } = await params;
  const slug = normalizeCategoryRoute(categoryRoute);

  return {
    title: slug ? `Categoria ${slug}` : "Categoria",
  };
}

export default async function CategoryRoutePage({
  params,
  searchParams,
}: PageProps<"/[categoryRoute]">) {
  const [{ categoryRoute }, query] = await Promise.all([params, searchParams]);
  const slug = normalizeCategoryRoute(categoryRoute);
  if (!slug) notFound();

  const requestedPage = normalizeRecentVideosPage(
    Array.isArray(query.pagina) ? query.pagina[0] : query.pagina,
  );
  const requestedSort = normalizeCategoryVideoSort(
    Array.isArray(query.ordem) ? query.ordem[0] : query.ordem,
  );
  const [page, user] = await Promise.all([
    getCategoryVideosPage(slug, requestedPage, requestedSort),
    requireUser(),
  ]);
  if (!page) notFound();

  const moduleProgress = await getModuleProgress({
    userId: Number(user.id),
    categoryId: Number(page.category.id),
  });

  return <CategoryVideosContent page={page} moduleProgress={moduleProgress} />;
}
