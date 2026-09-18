import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryVideosContent } from "@/components/home/category-videos-content";
import { requireUser } from "@/lib/auth/session";
import {
  getCategoryVideosPage,
  normalizeCategoryRoute,
} from "@/lib/home/catalog";
import { getCategoryProgressOverview } from "@/lib/home/video-progress";

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
}: PageProps<"/[categoryRoute]">) {
  const { categoryRoute } = await params;
  const slug = normalizeCategoryRoute(categoryRoute);
  if (!slug) notFound();

  const [page, user] = await Promise.all([
    getCategoryVideosPage(slug),
    requireUser(),
  ]);
  if (!page) notFound();

  const progress = await getCategoryProgressOverview({
    userId: Number(user.id),
    categoryId: Number(page.category.id),
  });

  return <CategoryVideosContent page={page} progress={progress} />;
}
