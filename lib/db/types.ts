import type { Generated } from "kysely";

export interface UsersTable {
  id: Generated<number>;
  username: string;
  codigorca: string;
  email: string;
  password: string | null;
  active: number;
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
  video_id: string;
  title: string;
  description: string | null;
  thumbnail: string;
  video_location: string;
  vimeo: string;
  duration: string;
  converted: number;
  category_id: number;
  featured: number;
  privacy: number;
  approved: number;
  is_movie: number;
  is_short: number;
  live_time: number;
  time: number;
  views: number;
}

export interface Database {
  langs: LangsTable;
  users: UsersTable;
  videos: VideosTable;
}
