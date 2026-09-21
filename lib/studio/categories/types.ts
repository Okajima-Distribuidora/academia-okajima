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

export interface CategoryEditState {
  status: "idle" | "success" | "error";
  message: string;
}

export type StudioCategoryDetails = Omit<StudioCategory, "subcategories">;

export interface StudioCategoryStats {
  views: number;
  watchHours: number | null;
  totalVideos: number;
  viewHistory: Array<{ date: string; views: number }>;
}
