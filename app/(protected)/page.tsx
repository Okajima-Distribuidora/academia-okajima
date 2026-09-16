import type { Metadata } from "next";
import { HomeContent } from "@/components/home/home-content";
import { requireUser } from "@/lib/auth/session";
import { getHomeCatalog, searchHomeVideos } from "@/lib/home/catalog";
import { getLibraryPages } from "@/lib/home/library";
import { getHomeSection, normalizeHomeSearch } from "@/lib/home/navigation";

export const metadata: Metadata = { title: "Início" };

export default async function HomePage({ searchParams }: PageProps<"/">) {
  // The page guards its own data; the parent layout is not an authorization boundary.
  const [, params] = await Promise.all([requireUser(), searchParams]);
  const section = getHomeSection(
    Array.isArray(params.secao) ? params.secao[0] : params.secao,
  );
  const query = normalizeHomeSearch(
    Array.isArray(params.q) ? params.q[0] : params.q,
  );
  const catalog =
    !query && (section.id === "home" || section.id === "categoria")
      ? await getHomeCatalog()
      : null;
  const searchResults = query ? await searchHomeVideos(query, 24) : [];
  const libraryPages =
    !query && section.id === "biblioteca" ? await getLibraryPages() : null;

  return (
    <HomeContent
      section={section}
      query={query}
      catalog={catalog}
      libraryPages={libraryPages}
      searchResults={searchResults}
    />
  );
}
