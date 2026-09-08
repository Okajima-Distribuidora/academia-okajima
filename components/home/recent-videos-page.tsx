import Link from "next/link";
import { IconChevronLeft, IconChevronRight, IconVideo, IconVideoOff } from "@tabler/icons-react";

import { RecentVideoCardContent } from "@/components/home/recent-video-card-content";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { RecentVideosPage as RecentVideosPageData } from "@/lib/home/catalog";
import { cn } from "@/lib/utils";

type PaginationItem = number | "ellipsis";

function paginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = [...new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
  const items: PaginationItem[] = [];

  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push("ellipsis");
    items.push(page);
  });

  return items;
}

function pageHref(page: number): string {
  return page === 1 ? "/?secao=recentes" : `/?secao=recentes&pagina=${page}`;
}

function RecentVideosPagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação de vídeos recentes" className="flex justify-center pt-2">
      <ul className="flex items-center gap-1">
        <li>
          {currentPage > 1 ? (
            <Link
              href={pageHref(currentPage - 1)}
              rel="prev"
              aria-label="Ir para a página anterior"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "px-2 sm:px-3")}
            >
              <IconChevronLeft data-icon="inline-start" aria-hidden="true" />
              <span className="hidden sm:inline">Anterior</span>
            </Link>
          ) : null}
        </li>
        {paginationItems(currentPage, totalPages).map((item, index) => item === "ellipsis" ? (
          <li key={`ellipsis-${index}`} aria-hidden="true" className="grid size-8 place-items-center text-muted-foreground">
            …
          </li>
        ) : (
          <li key={item}>
            <Link
              href={pageHref(item)}
              aria-label={`Ir para a página ${item}`}
              aria-current={item === currentPage ? "page" : undefined}
              className={buttonVariants({
                variant: item === currentPage ? "inverse" : "ghost",
                size: "icon",
              })}
            >
              {item}
            </Link>
          </li>
        ))}
        <li>
          {currentPage < totalPages ? (
            <Link
              href={pageHref(currentPage + 1)}
              rel="next"
              aria-label="Ir para a próxima página"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "px-2 sm:px-3")}
            >
              <span className="hidden sm:inline">Próxima</span>
              <IconChevronRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}

export function RecentVideosPage({ page }: { page: RecentVideosPageData }) {
  return (
    <main id="conteudo" tabIndex={-1} className="home-content flex min-w-0 flex-1 flex-col outline-none">
      <section className="recent-videos-page flex flex-1 flex-col gap-7 p-5 sm:p-8 lg:px-10" aria-labelledby="recent-videos-page-title">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <IconVideo aria-hidden="true" stroke={1.8} />
            <h1 id="recent-videos-page-title" className="text-2xl font-semibold tracking-tight">Vídeos recentes</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {page.totalVideos} {page.totalVideos === 1 ? "vídeo publicado" : "vídeos publicados"}, do mais novo ao mais antigo.
          </p>
        </header>

        {page.videos.length > 0 ? (
          <ul className="recent-videos-page-grid" aria-label="Vídeos recentes">
            {page.videos.map((video, index) => (
              <li key={video.id}>
                <article className="home-recent-card">
                  <RecentVideoCardContent
                    video={video}
                    priority={index < 4}
                    sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 44vw, 22vw"
                  />
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="min-h-80 flex-none py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon"><IconVideoOff aria-hidden="true" stroke={1.6} /></EmptyMedia>
              <EmptyTitle>Nenhum vídeo recente disponível</EmptyTitle>
              <EmptyDescription>Os novos conteúdos aparecerão aqui quando forem publicados.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        <RecentVideosPagination currentPage={page.currentPage} totalPages={page.totalPages} />
      </section>
    </main>
  );
}
