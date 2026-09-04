import { IconVideo, IconFile, IconHelpCircle, IconSearch, IconDeviceMobile } from "@tabler/icons-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import type { HomeCatalog } from "@/lib/home/catalog";
import { getHomeSection } from "@/lib/home/navigation";
import { CategoryFilter } from "./category-filter";
import { HomeShowcase } from "./home-showcase";

export function HomeContent({
  section,
  query,
  catalog,
}: {
  section: ReturnType<typeof getHomeSection>;
  query: string;
  catalog: HomeCatalog | null;
}) {
  if (catalog) {
    return (
      <main id="conteudo" tabIndex={-1} className="home-content flex min-w-0 flex-1 flex-col outline-none">
        <CategoryFilter categories={catalog.categories} activeCategoryId={catalog.activeCategoryId} />
        {catalog.featuredVideo ? (
          <HomeShowcase
            key={catalog.activeCategoryId ?? "all"}
            featuredVideo={catalog.featuredVideo}
            recentVideos={catalog.recentVideos}
          />
        ) : (
          <Empty className="min-h-80 flex-none py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon"><IconVideo aria-hidden="true" stroke={1.6} /></EmptyMedia>
              <EmptyTitle>Nenhum vídeo disponível nesta categoria</EmptyTitle>
              <EmptyDescription>Escolha outra categoria para continuar explorando a academia.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    );
  }

  const isHelp = !query && section.id === "ajuda";
  const isFiles = !query && section.id === "arquivos";
  const Icon = query ? IconSearch : isHelp ? IconHelpCircle : isFiles ? IconFile : section.id === "shorts" ? IconDeviceMobile : IconVideo;
  return <main id="conteudo" tabIndex={-1} className="home-content flex min-w-0 flex-1 flex-col gap-8 p-5 outline-none sm:p-8 lg:px-10">
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{query ? "Pesquisa" : section.label}</h1>
      <p className="text-sm text-muted-foreground wrap-anywhere">
        {query ? <>Você pesquisou por “{query}”.</> : section.description}
      </p>
    </div>
    <Empty className="min-h-80 flex-none py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Icon aria-hidden="true" stroke={1.6} /></EmptyMedia>
        <EmptyTitle>{query ? "A pesquisa estará disponível em breve" : isHelp ? "A central de ajuda está sendo preparada" : isFiles ? "A área de arquivos está sendo preparada" : "Seu espaço de vídeos está sendo preparado"}</EmptyTitle>
        <EmptyDescription>
          {query ? "O campo já está pronto. A busca no catálogo será conectada na próxima etapa."
            : isHelp ? "As orientações e os canais de atendimento serão adicionados nas próximas etapas."
            : "Esta é a estrutura inicial da home. Os vídeos do Vimeo serão conectados na próxima etapa."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  </main>;
}
