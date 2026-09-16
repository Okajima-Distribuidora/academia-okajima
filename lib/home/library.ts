import "server-only";

import { getDb } from "@/lib/db";
import { decodeLegacyText } from "@/lib/home/catalog";

export interface LibraryPage {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  pageType: number;
}

export function stripLegacyContent(value: string | null | undefined): string {
  return decodeLegacyText(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createLibraryExcerpt(
  value: string | null | undefined,
  maxLength = 180,
): string {
  const text = stripLegacyContent(value);
  if (text.length <= maxLength) return text;

  const slice = text.slice(0, maxLength).trimEnd();
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > maxLength * 0.65 ? lastSpace : slice.length).trimEnd()}...`;
}

export async function getLibraryPages(): Promise<LibraryPage[]> {
  const rows = await getDb()
    .selectFrom("custom_pages")
    .select(["id", "page_name", "page_title", "page_content", "page_type"])
    .where("page_name", "!=", "")
    .where("page_title", "!=", "")
    .orderBy("id", "asc")
    .limit(24)
    .execute();

  return rows.map((row) => ({
    id: row.id,
    slug: row.page_name.trim(),
    title: decodeLegacyText(row.page_title.trim()),
    excerpt:
      createLibraryExcerpt(row.page_content) ||
      "Material disponível para consulta na academia.",
    pageType: row.page_type,
  }));
}
