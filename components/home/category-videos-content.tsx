import { IconCategory, IconVideo } from "@tabler/icons-react";

import { CategoryHashScroll } from "@/components/home/category-hash-scroll";
import { VideoCarousel } from "@/components/home/video-carousel";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryVideosPage } from "@/lib/home/catalog";
import type { CategoryProgressOverview } from "@/lib/home/video-progress";

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
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex flex-col gap-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }, (_, cardIndex) => (
              <Skeleton
                key={cardIndex}
                className="h-44 w-72 shrink-0 rounded-lg"
              />
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}

export function CategoryVideosContent({
  page,
  progress,
  scrollTargetId = null,
}: {
  page: CategoryVideosPage;
  progress: CategoryProgressOverview;
  scrollTargetId?: string | null;
}) {
  const progressBySubcategory = new Map(
    progress.subcategories.map(
      ({ subcategoryId, progress: subcategoryProgress }) => [
        subcategoryId,
        subcategoryProgress,
      ],
    ),
  );

  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="category-videos-page flex min-w-0 flex-1 flex-col gap-8 p-5 outline-none sm:p-8 lg:px-10"
    >
      <header className="flex max-w-5xl flex-col gap-4">
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-sm font-semibold uppercase text-primary">
            Categoria
          </p>
          <div className="flex items-center gap-3">
            <span className="category-videos-icon" aria-hidden="true">
              <IconCategory stroke={1.8} />
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {page.category.label}
            </h1>
          </div>

          {page.category.description ? (
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {page.category.description}
            </p>
          ) : null}
          {progress.category.totalLessons > 0 ? (
            <Progress value={progress.category.percentage} className="max-w-md">
              <ProgressLabel>
                {progress.category.completedLessons} de{" "}
                {progress.category.totalLessons} aulas concluídas
              </ProgressLabel>
              <ProgressValue />
            </Progress>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {page.totalVideos > 0
              ? `${page.totalVideos} ${page.totalVideos === 1 ? "vídeo disponível" : "vídeos disponíveis"}`
              : "Nenhum vídeo encontrado nesta categoria"}
          </p>
        </div>
      </header>

      {page.subcategories.length > 0 ? (
        <div className="flex flex-col gap-8">
          {page.subcategories.map(({ subcategory, videos }) => (
            <VideoCarousel
              key={subcategory.id}
              headingId={`category-subcategory-${subcategory.id}-title`}
              listId={`category-subcategory-${subcategory.id}-videos`}
              title={subcategory.label}
              videos={videos}
              categorySlug={page.category.slug}
              progress={progressBySubcategory.get(Number(subcategory.id))}
            />
          ))}
        </div>
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
      <CategoryHashScroll targetId={scrollTargetId} />
    </main>
  );
}
