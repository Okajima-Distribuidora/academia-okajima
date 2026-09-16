export interface StudioSubcategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  videosCount: number;
}

export interface StudioCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  subcategories: StudioSubcategory[];
}
