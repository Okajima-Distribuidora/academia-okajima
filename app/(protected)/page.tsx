import { requireUser } from "@/lib/auth/session";
import type { Metadata } from "next";
import { HomeContent } from "@/components/home/home-content";
import { getHomeCatalog } from "@/lib/home/catalog";
import { getHomeSection, normalizeHomeSearch } from "@/lib/home/navigation";

export const metadata: Metadata = { title: "Início" };

export default async function HomePage({ searchParams }: PageProps<"/">) {
  // The page guards its own data; the parent layout is not an authorization boundary.
  const [, params] = await Promise.all([requireUser(), searchParams]);
  const section = getHomeSection(Array.isArray(params.secao) ? params.secao[0] : params.secao);
  const query = normalizeHomeSearch(Array.isArray(params.q) ? params.q[0] : params.q);
  const requestedCategory = Array.isArray(params.categoria) ? params.categoria[0] : params.categoria;
  const catalog = !query && section.id === "home"
    ? await getHomeCatalog(requestedCategory ?? null)
    : null;

  return <HomeContent section={section} query={query} catalog={catalog} />;
}
