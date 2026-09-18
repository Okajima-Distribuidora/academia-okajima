import {
  IconBooks,
  IconDeviceMobile,
  IconSearch,
  IconVideo,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { HomeCatalog, HomeSearchResult } from "@/lib/home/catalog";
import type { LibraryPage } from "@/lib/home/library";
import { getHomeSection } from "@/lib/home/navigation";
import { CategoryChooser } from "./category-chooser";
import { HomeShowcase } from "./home-showcase";
import { LibraryContent } from "./library-content";

export function HomeContent({
  section,
  query,
  catalog,
  libraryPages,
  searchResults,
}: {
  section: ReturnType<typeof getHomeSection>;
  query: string;
  catalog: HomeCatalog | null;
  libraryPages: LibraryPage[] | null;
  searchResults: HomeSearchResult[];
}) {
  if (query) {
    return (
      <main
        id="conteudo"
        tabIndex={-1}
        className="home-content search-results-page flex min-w-0 flex-1 flex-col gap-8 p-5 outline-none sm:p-8 lg:px-10"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Pesquisa</h1>
          <p className="text-sm text-muted-foreground wrap-anywhere">
            Você pesquisou por “{query}”.
          </p>
        </div>
        {searchResults.length > 0 ? (
          <ul className="search-results-grid">
            {searchResults.map((result) => (
              <li key={result.id}>
                <Link
                  href={result.href}
                  className="search-result-card"
                  aria-label={`Abrir ${result.title}`}
                >
                  <span className="search-result-thumbnail">
                    {result.thumbnailUrl ? (
                      <Image
                        src={result.thumbnailUrl}
                        alt={result.title}
                        fill
                        sizes="(max-width: 639px) 92vw, (max-width: 1199px) 22rem, 25vw"
                        loading={"eager"}
                        className="search-result-image object-cover"
                      />
                    ) : (
                      <IconVideo
                        className="search-result-placeholder"
                        aria-hidden="true"
                        stroke={1.4}
                      />
                    )}
                  </span>
                  <strong>{result.title}</strong>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="min-h-80 flex-none py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconSearch aria-hidden="true" stroke={1.6} />
              </EmptyMedia>
              <EmptyTitle>Nenhum vídeo encontrado</EmptyTitle>
              <EmptyDescription>
                Tente pesquisar por outro nome de vídeo.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    );
  }

  if (catalog) {
    if (section.id === "categoria") {
      return <CategoryChooser categories={catalog.categories} />;
    }

    return (
      <main
        id="conteudo"
        tabIndex={-1}
        className="home-content flex min-w-0 flex-1 flex-col outline-none"
      >
        {catalog.featuredVideos.length > 0 ? (
          <HomeShowcase
            key="catalog"
            featuredVideos={catalog.featuredVideos}
            featuredSettings={catalog.featuredSettings}
            categorySections={catalog.categorySections}
          />
        ) : (
          <Empty className="min-h-80 flex-none py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconVideo aria-hidden="true" stroke={1.6} />
              </EmptyMedia>
              <EmptyTitle>Nenhum vídeo disponível nesta categoria</EmptyTitle>
              <EmptyDescription>
                Escolha outra categoria para continuar explorando a academia.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    );
  }

  if (!query && section.id === "biblioteca" && libraryPages) {
    return <LibraryContent section={section} pages={libraryPages} />;
  }

  const isLibrary = !query && section.id === "biblioteca";
  const Icon = isLibrary
    ? IconBooks
    : section.id === "shorts"
      ? IconDeviceMobile
      : IconVideo;
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="home-content flex min-w-0 flex-1 flex-col gap-8 p-5 outline-none sm:p-8 lg:px-10"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {section.label}
        </h1>
        <p className="text-sm text-muted-foreground wrap-anywhere">
          {section.description}
        </p>
      </div>
      <Empty className="min-h-80 flex-none py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon aria-hidden="true" stroke={1.6} />
          </EmptyMedia>
          <EmptyTitle>
            {isLibrary
              ? "A biblioteca está sendo preparada"
              : "Seu espaço de vídeos está sendo preparado"}
          </EmptyTitle>
          <EmptyDescription>
            Esta é a estrutura inicial da home. Os vídeos do Vimeo serão
            conectados na próxima etapa.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  );
}
