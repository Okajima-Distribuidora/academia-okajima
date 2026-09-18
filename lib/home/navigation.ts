export const homeSections = [
  {
    id: "home",
    label: "Home",
    description: "A visão geral da Academia Okajima.",
  },
  {
    id: "categoria",
    label: "Categoria",
    description: "Navegue pelos conteúdos organizados por categoria.",
  },
  {
    id: "shorts",
    label: "Shorts",
    description: "Conteúdos rápidos para aprender no seu ritmo.",
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    description: "Materiais e documentos da academia estarão disponíveis aqui.",
  },
] as const;

export type HomeSectionId = (typeof homeSections)[number]["id"];

export function getHomeSection(value: string | null | undefined) {
  return (
    homeSections.find((section) => section.id === value) ?? homeSections[0]
  );
}

export function normalizeHomeSearch(value: string | null | undefined) {
  return (value ?? "").trim().slice(0, 120);
}

export function homeSectionHref(id: HomeSectionId) {
  if (id === "categoria") return "/?secao=categoria";
  return id === "home" ? "/" : `/?secao=${id}`;
}

export function categoryHref(category: { slug: string }) {
  return `/categoria-${encodeURIComponent(category.slug)}`;
}

export function videoWatchHref(
  category: { slug: string },
  video: { vimeoId: string | null },
) {
  return video.vimeoId
    ? `${categoryHref(category)}/watch?v=${encodeURIComponent(video.vimeoId)}`
    : categoryHref(category);
}
