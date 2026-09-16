import type { Generated } from "kysely";

export interface UsersTable {
  id: Generated<number>;
  username: string;
  codigorca: string;
  email: string;
  password: string | null;
  first_name: Generated<string>;
  last_name: Generated<string>;
  avatar: Generated<string>;
  active: number;
  admin: number;
  two_factor: number;
}

export interface LangsTable {
  id: Generated<number>;
  lang_key: string | null;
  type: string;
  english: string | null;
}

export interface VideosTable {
  id: Generated<number>;
  video_id: Generated<string>;
  user_id: Generated<number>;
  title: Generated<string>;
  description: Generated<string | null>;
  thumbnail: Generated<string>;
  video_location: Generated<string>;
  vimeo: Generated<string>;
  duration: Generated<string>;
  size: Generated<string | number | bigint>;
  active: Generated<number>;
  converted: Generated<number>;
  category_id: Generated<number>;
  featured: Generated<number>;
  privacy: Generated<number>;
  approved: Generated<number>;
  is_movie: Generated<number>;
  is_short: Generated<number>;
  live_time: Generated<number>;
  time: Generated<number>;
  publication_date: Generated<number>;
  views: Generated<number>;
  upload_status: Generated<VideoUploadStatus>;
  upload_started_at: Generated<Date>;
  upload_status_updated_at: Generated<Date>;
  processing_started_at: Date | null;
  ready_at: Date | null;
  cancelled_at: Date | null;
  deleted_at: Date | null;
}

export type VideoUploadStatus =
  | "uploading"
  | "processing"
  | "ready"
  | "cancelled"
  | "deleted";

export interface AcademyCategoriesTable {
  id: Generated<number>;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface AcademySubcategoriesTable {
  id: Generated<number>;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface AcademyVideoSubcategoriesTable {
  video_id: number;
  subcategory_id: number;
  created_at: Date;
}

export interface AcademyVideoProgressTable {
  id: Generated<number>;
  user_id: number;
  video_id: number;
  resume_position_seconds: number;
  furthest_position_seconds: number;
  completed_at: Date | null;
  last_watched_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ViewsTable {
  id: Generated<number>;
  video_id: number;
  fingerprint: Generated<string>;
  user_id: Generated<number>;
  time: number;
}

export interface CommentsTable {
  id: Generated<number>;
  user_id: number;
  video_id: number | null;
  post_id: number;
  activity_id: number;
  text: string | null;
  time: number;
  pinned: number | null;
  likes: number;
  dis_likes: number;
}

export interface CustomPagesTable {
  id: Generated<number>;
  page_name: string;
  page_title: string;
  page_content: string | null;
  page_type: number;
}

export interface LikesDislikesTable {
  id: Generated<number>;
  user_id: number;
  video_id: number;
  post_id: number;
  activity_id: number;
  type: number;
  time: number;
}

export interface ConfigTable {
  id: Generated<number>;
  name: string;
  value: string;
}

export interface Database {
  academy_categories: AcademyCategoriesTable;
  academy_subcategories: AcademySubcategoriesTable;
  academy_video_subcategories: AcademyVideoSubcategoriesTable;
  academy_video_progress: AcademyVideoProgressTable;
  comments: CommentsTable;
  config: ConfigTable;
  custom_pages: CustomPagesTable;
  likes_dislikes: LikesDislikesTable;
  langs: LangsTable;
  users: UsersTable;
  videos: VideosTable;
  views: ViewsTable;
}
