import type { Metadata } from "next";
import { revalidatePath } from "next/cache";

import { CategoriesManager } from "@/components/studio/categories/categories-manager";
import { StudioPageFrame } from "@/components/studio/layout/studio-page-frame";
import { requireStudioUser } from "@/lib/auth/session";
import {
  createStudioCategory,
  createStudioSubcategory,
  listStudioCategories,
} from "@/lib/studio/categories";

export const metadata: Metadata = { title: "Categorias | Academia Studio" };

async function createCategoryAction(formData: FormData) {
  "use server";

  await requireStudioUser();
  await createStudioCategory(formData);
  revalidatePath("/studio/categorias");
}

async function createSubcategoryAction(formData: FormData) {
  "use server";

  await requireStudioUser();
  await createStudioSubcategory(formData);
  revalidatePath("/studio/categorias");
}

export default async function StudioCategoriesPage() {
  await requireStudioUser();
  const categories = await listStudioCategories();

  return (
    <StudioPageFrame>
      <CategoriesManager
        categories={categories}
        createCategoryAction={createCategoryAction}
        createSubcategoryAction={createSubcategoryAction}
      />
    </StudioPageFrame>
  );
}
