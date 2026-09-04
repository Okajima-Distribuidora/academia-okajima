export const homeSections = [
  { id: "home", label: "Home", description: "A visão geral da Academia Okajima." },
  { id: "recentes", label: "Vídeos recentes", description: "Os conteúdos mais recentes da academia estarão aqui." },
  { id: "em-alta", label: "Vídeos em alta", description: "Os conteúdos em destaque da academia estarão aqui." },
  { id: "mais-vistos", label: "Mais vistos", description: "Os vídeos mais assistidos da academia estarão aqui." },
  { id: "shorts", label: "Shorts", description: "Conteúdos rápidos para aprender no seu ritmo." },
  { id: "arquivos", label: "Arquivos", description: "Materiais e documentos da academia estarão disponíveis aqui." },
  { id: "ajuda", label: "Ajuda", description: "Um espaço para encontrar orientações sobre a academia." },
] as const;

export type HomeSectionId = (typeof homeSections)[number]["id"];

export function getHomeSection(value: string | null | undefined) {
  return homeSections.find((section) => section.id === value) ?? homeSections[0];
}

export function normalizeHomeSearch(value: string | null | undefined) {
  return (value ?? "").trim().slice(0, 120);
}

export function homeSectionHref(id: HomeSectionId) {
  return id === "home" ? "/" : `/?secao=${id}`;
}
