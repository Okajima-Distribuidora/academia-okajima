import { IconArrowsSort, IconCategory, IconVideo } from "@tabler/icons-react";
import Link from "next/link";
import { Fragment } from "react";

import { RecentVideoCardContent } from "@/components/home/recent-video-card-content";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type CategoryVideosPage,
  RECENT_VIDEOS_PAGE_SIZE,
} from "@/lib/home/catalog";
import type { ModuleProgress } from "@/lib/home/module-progress";
import { categoryHref, videoWatchHref } from "@/lib/home/navigation";

const sortLabels = {
  "nome-asc": "Nome A-Z",
  "nome-desc": "Nome Z-A",
  "data-desc": "Mais recentes",
  "data-asc": "Mais antigos",
  "duracao-asc": "Menor duração",
  "duracao-desc": "Maior duração",
} as const;

function pageHref(
  basePath: string,
  page: number,
  sort: CategoryVideosPage["sort"],
) {
  const params = new URLSearchParams();
  if (page > 1) params.set("pagina", String(page));
  if (sort !== "data-desc") params.set("ordem", sort);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function visiblePages(currentPage: number, totalPages: number) {
  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

function CategoryPagination({ page }: { page: CategoryVideosPage }) {
  if (page.totalPages <= 1) return null;

  const basePath = categoryHref(page.category);
  const pages = visiblePages(page.currentPage, page.totalPages);

  return (
    <Pagination className="pt-2">
      <PaginationContent>
        {page.currentPage > 1 ? (
          <PaginationItem>
            <PaginationPrevious
              href={pageHref(basePath, page.currentPage - 1, page.sort)}
            />
          </PaginationItem>
        ) : null}
        {pages.map((pageNumber, index) => (
          <Fragment key={pageNumber}>
            {index > 0 && pageNumber - pages[index - 1] > 1 ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}
            <PaginationItem>
              <PaginationLink
                href={pageHref(basePath, pageNumber, page.sort)}
                isActive={pageNumber === page.currentPage}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          </Fragment>
        ))}
        {page.currentPage < page.totalPages ? (
          <PaginationItem>
            <PaginationNext
              href={pageHref(basePath, page.currentPage + 1, page.sort)}
            />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}

export function CategoryVideosSkeleton() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="category-videos-page flex min-w-0 flex-1 flex-col gap-8 p-5 outline-none sm:p-8 lg:px-10"
    >
      <header className="flex max-w-5xl flex-col gap-4">
        <Skeleton className="size-11 rounded-full" />
        <div className="flex max-w-3xl flex-col gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </header>
      <div className="flex flex-wrap items-end gap-3">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-24" />
      </div>
      <ul className="recent-videos-page-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="flex min-w-0 flex-col gap-3">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-3 w-2/3" />
          </li>
        ))}
      </ul>
    </main>
  );
}

export function CategoryVideosContent({
  page,
  moduleProgress,
}: {
  page: CategoryVideosPage;
  moduleProgress: ModuleProgress;
}) {
  const firstVideo =
    page.totalVideos === 0
      ? 0
      : (page.currentPage - 1) * RECENT_VIDEOS_PAGE_SIZE + 1;
  const lastVideo = Math.min(
    page.currentPage * RECENT_VIDEOS_PAGE_SIZE,
    page.totalVideos,
  );

  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="category-videos-page flex min-w-0 flex-1 flex-col gap-8 p-5 outline-none sm:p-8 lg:px-10"
    >
      <header className="flex max-w-5xl flex-col gap-4">
        <span className="category-videos-icon" aria-hidden="true">
          <IconCategory stroke={1.8} />
        </span>
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-sm font-semibold uppercase text-primary">Módulo</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {page.category.label}
          </h1>
          {page.category.description ? (
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {page.category.description}
            </p>
          ) : null}
          {moduleProgress.totalLessons > 0 ? (
            <Progress value={moduleProgress.percentage} className="max-w-md">
              <ProgressLabel>
                {moduleProgress.completedLessons} de{" "}
                {moduleProgress.totalLessons} aulas concluídas
              </ProgressLabel>
              <ProgressValue />
            </Progress>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {page.totalVideos > 0
              ? `${firstVideo}-${lastVideo} de ${page.totalVideos} vídeos`
              : "Nenhum vídeo encontrado neste módulo"}
          </p>
        </div>
      </header>

      <form action={categoryHref(page.category)}>
        <FieldGroup className="flex-row flex-wrap items-end gap-3">
          <Field className="w-auto gap-1">
            <FieldLabel htmlFor="category-video-sort">Ordenar por</FieldLabel>
            <NativeSelect
              id="category-video-sort"
              name="ordem"
              defaultValue={page.sort}
              aria-label="Ordenar vídeos da categoria"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Button type="submit" variant="outline">
            <IconArrowsSort data-icon="inline-start" aria-hidden="true" />
            Aplicar
          </Button>
        </FieldGroup>
      </form>

      {page.videos.length > 0 ? (
        <>
          <ul
            className="recent-videos-page-grid"
            aria-label={`Vídeos da categoria ${page.category.label}`}
          >
            {page.videos.map((video, index) => (
              <li key={video.id}>
                <Link
                  href={videoWatchHref(page.category, video)}
                  className="home-recent-card"
                  aria-label={`Abrir ${video.title}`}
                  aria-disabled={!video.vimeoId}
                >
                  <RecentVideoCardContent
                    video={video}
                    priority={index < 4}
                    sizes="(max-width: 639px) 92vw, (max-width: 1199px) 44vw, 24vw"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <CategoryPagination page={page} />
        </>
      ) : (
        <Empty className="min-h-80 flex-none py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconVideo aria-hidden="true" stroke={1.6} />
            </EmptyMedia>
            <EmptyTitle>Nenhum vídeo disponível nesta categoria</EmptyTitle>
            <EmptyDescription>
              Escolha outra categoria na barra lateral para continuar
              explorando.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  );
}
