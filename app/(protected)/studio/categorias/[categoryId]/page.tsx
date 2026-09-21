import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryOverview } from "@/components/studio/categories/category-overview";
import { CategorySubcategories } from "@/components/studio/categories/category-subcategories";
import { requireStudioUser } from "@/lib/auth/session";
import { getStudioCategory } from "@/lib/studio/categories";
import { listStudioCategoryVideos } from "@/lib/studio/categories/videos";
import { getStudioCategoryStats } from "@/lib/studio/stats";

export const metadata: Metadata = {
  title: "Dados da categoria | Academia Studio",
};

export default async function StudioCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  await requireStudioUser();
  const { categoryId } = await params;
  if (!/^\d+$/.test(categoryId)) notFound();
  const id = Number(categoryId);
  const category = await getStudioCategory(id);
  if (!category) notFound();
  const [stats, subcategories] = await Promise.all([
    getStudioCategoryStats(id),
    listStudioCategoryVideos(category),
  ]);
  return (
    <CategoryOverview category={category} stats={stats}>
      <CategorySubcategories
        subcategories={subcategories}
        categorySlug={category.slug}
      />
    </CategoryOverview>
  );
}
