import "server-only";

import { getPrisma } from "@/lib/db/prisma";
import type { StudioCategory } from "@/lib/studio/categories/types";

export function slugifyCategoryName(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);

  return slug || "categoria";
}

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

function optionalText(formData: FormData, key: string): string | null {
  const value = requiredText(formData, key);
  return value ? value : null;
}

function optionalInteger(formData: FormData, key: string): number {
  const value = requiredText(formData, key);
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : 0;
}

async function uniqueCategorySlug(name: string): Promise<string> {
  const prisma = getPrisma();
  const base = slugifyCategoryName(name).slice(0, 130);
  let slug = base;
  let suffix = 2;

  while (await prisma.academy_categories.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`.slice(0, 140);
    suffix += 1;
  }

  return slug;
}

async function uniqueSubcategorySlug(
  categoryId: number,
  name: string,
): Promise<string> {
  const prisma = getPrisma();
  const base = slugifyCategoryName(name).slice(0, 130);
  let slug = base;
  let suffix = 2;

  while (
    await prisma.academy_subcategories.findUnique({
      where: { category_id_slug: { category_id: categoryId, slug } },
    })
  ) {
    slug = `${base}-${suffix}`.slice(0, 140);
    suffix += 1;
  }

  return slug;
}

export async function listStudioCategories(): Promise<StudioCategory[]> {
  const prisma = getPrisma();
  const categories = await prisma.academy_categories.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    include: {
      subcategories: {
        orderBy: [{ sort_order: "asc" }, { name: "asc" }],
        include: { _count: { select: { videos: true } } },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sort_order,
    isActive: category.is_active,
    subcategories: category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      categoryId: subcategory.category_id,
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description,
      sortOrder: subcategory.sort_order,
      isActive: subcategory.is_active,
      videosCount: subcategory._count.videos,
    })),
  }));
}

export async function createStudioCategory(formData: FormData): Promise<void> {
  const name = requiredText(formData, "name");
  if (!name) return;

  await getPrisma().academy_categories.create({
    data: {
      name: name.slice(0, 120),
      slug: await uniqueCategorySlug(name),
      description: optionalText(formData, "description"),
      sort_order: optionalInteger(formData, "sortOrder"),
      is_active: true,
    },
  });
}

export async function createStudioSubcategory(
  formData: FormData,
): Promise<void> {
  const categoryIdValue = requiredText(formData, "categoryId");
  const categoryId = Number(categoryIdValue);
  const name = requiredText(formData, "name");

  if (!name || !Number.isSafeInteger(categoryId) || categoryId < 1) return;

  await getPrisma().academy_subcategories.create({
    data: {
      category_id: categoryId,
      name: name.slice(0, 120),
      slug: await uniqueSubcategorySlug(categoryId, name),
      description: optionalText(formData, "description"),
      sort_order: optionalInteger(formData, "sortOrder"),
      is_active: true,
    },
  });
}
