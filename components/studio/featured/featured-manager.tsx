"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconEye,
  IconGripVertical,
  IconPlayerPlay,
  IconTrash,
  IconVideo,
} from "@tabler/icons-react";
import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";

import { StudioPageHeader } from "@/components/studio/layout/studio-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import type {
  StudioFeaturedSettings,
  StudioFeaturedVideo,
} from "@/lib/studio/featured";
import { cn } from "@/lib/utils";
import lightLogo from "@/public/logo-light.png";

const MAX_FEATURED_VIDEOS = 5;
const MAX_FEATURED_INTERVAL_SECONDS = 15;
const MIN_FEATURED_INTERVAL_SECONDS = 3;
const DEFAULT_PREVIEW_VIDEOS = 3;
const FEATURED_VIDEOS_PAGE_SIZE = 20;

type VideoSortOption = "newest" | "oldest" | "title-asc" | "title-desc";

type SaveActionState = {
  message: string;
  savedCount?: number;
  savedIntervalSeconds?: number;
  savedVideoIds?: string;
  status: "idle" | "success" | "error";
  submittedAt: number;
};

const initialSaveActionState: SaveActionState = {
  message: "",
  status: "idle",
  submittedAt: 0,
};

function clampPreviewNumber(value: number, min: number, max: number): number {
  if (!Number.isSafeInteger(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function parseIntegerInput(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function FeaturedManager({
  settings,
  videos,
  updateSettingsAction,
  updateVideosAction,
}: {
  settings: StudioFeaturedSettings;
  videos: StudioFeaturedVideo[];
  updateSettingsAction: (formData: FormData) => Promise<void>;
  updateVideosAction: (formData: FormData) => Promise<void>;
}) {
  const initialSelectedIds = useMemo(() => {
    return videos
      .filter((video) => video.featuredOrder > 0)
      .sort((a, b) => a.featuredOrder - b.featuredOrder || b.id - a.id)
      .map((video) => video.id)
      .slice(0, MAX_FEATURED_VIDEOS);
  }, [videos]);
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [draftCount, setDraftCount] = useState(String(settings.count));
  const [draftIntervalSeconds, setDraftIntervalSeconds] = useState(
    String(settings.intervalSeconds),
  );
  const [sortOption, setSortOption] = useState<VideoSortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [settingsActionState, submitSettingsAction, isSavingSettings] =
    useActionState(
      async (
        state: SaveActionState,
        formData: FormData,
      ): Promise<SaveActionState> => {
        const count = parseIntegerInput(String(formData.get("count") ?? ""));
        const intervalSeconds = parseIntegerInput(
          String(formData.get("intervalSeconds") ?? ""),
        );

        try {
          await updateSettingsAction(formData);
          return {
            message: "Configuração salva com sucesso.",
            savedCount: count ?? state.savedCount,
            savedIntervalSeconds: intervalSeconds ?? state.savedIntervalSeconds,
            status: "success",
            submittedAt: Date.now(),
          };
        } catch {
          return {
            ...state,
            message: "Não foi possível salvar a configuração.",
            status: "error",
            submittedAt: Date.now(),
          };
        }
      },
      initialSaveActionState,
    );
  const [videosActionState, submitVideosAction, isSavingVideos] =
    useActionState(
      async (
        state: SaveActionState,
        formData: FormData,
      ): Promise<SaveActionState> => {
        const videoIds = String(formData.get("videoIds") ?? "");

        try {
          await updateVideosAction(formData);
          return {
            message: "Vídeos salvos com sucesso.",
            savedVideoIds: videoIds,
            status: "success",
            submittedAt: Date.now(),
          };
        } catch {
          return {
            ...state,
            message: "Não foi possível salvar os vídeos.",
            status: "error",
            submittedAt: Date.now(),
          };
        }
      },
      initialSaveActionState,
    );
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const videosById = useMemo(
    () => new Map(videos.map((video) => [video.id, video])),
    [videos],
  );
  const selectedVideos = selectedIds.flatMap((id) => {
    const video = videosById.get(id);
    return video ? [video] : [];
  });
  const listedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      if (sortOption === "title-asc") {
        return (
          a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }) ||
          b.sortDate - a.sortDate ||
          b.id - a.id
        );
      }
      if (sortOption === "title-desc") {
        return (
          b.title.localeCompare(a.title, "pt-BR", { sensitivity: "base" }) ||
          b.sortDate - a.sortDate ||
          b.id - a.id
        );
      }
      if (sortOption === "oldest") {
        return a.sortDate - b.sortDate || a.id - b.id;
      }
      return b.sortDate - a.sortDate || b.id - a.id;
    });
  }, [sortOption, videos]);
  const draftCountNumber = parseIntegerInput(draftCount);
  const draftIntervalSecondsNumber = parseIntegerInput(draftIntervalSeconds);
  const isCountValid =
    draftCountNumber !== null &&
    draftCountNumber >= 1 &&
    draftCountNumber <= MAX_FEATURED_VIDEOS;
  const isIntervalValid =
    draftIntervalSecondsNumber !== null &&
    draftIntervalSecondsNumber >= MIN_FEATURED_INTERVAL_SECONDS &&
    draftIntervalSecondsNumber <= MAX_FEATURED_INTERVAL_SECONDS;
  const savedCount = settingsActionState.savedCount ?? settings.count;
  const savedIntervalSeconds =
    settingsActionState.savedIntervalSeconds ?? settings.intervalSeconds;
  const settingsChanged =
    draftCountNumber !== null &&
    draftIntervalSecondsNumber !== null &&
    (draftCountNumber !== savedCount ||
      draftIntervalSecondsNumber !== savedIntervalSeconds);
  const canSaveSettings =
    isCountValid && isIntervalValid && settingsChanged && !isSavingSettings;
  const selectableLimit = savedCount;
  const defaultPreviewVideos = videos.slice(0, DEFAULT_PREVIEW_VIDEOS);
  const previewVideos =
    selectedVideos.length > 0 ? selectedVideos : defaultPreviewVideos;
  const previewVideosKey = previewVideos.map((video) => video.id).join(",");
  const totalAvailablePages = Math.max(
    1,
    Math.ceil(listedVideos.length / FEATURED_VIDEOS_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalAvailablePages);
  const paginatedListedVideos = listedVideos.slice(
    (safeCurrentPage - 1) * FEATURED_VIDEOS_PAGE_SIZE,
    safeCurrentPage * FEATURED_VIDEOS_PAGE_SIZE,
  );
  const previewIntervalSeconds = clampPreviewNumber(
    savedIntervalSeconds,
    MIN_FEATURED_INTERVAL_SECONDS,
    MAX_FEATURED_INTERVAL_SECONDS,
  );
  const selectedIdsKey = selectedIds.join(",");
  const savedSelectedIdsKey =
    videosActionState.savedVideoIds ?? initialSelectedIds.join(",");
  const videosChanged = selectedIdsKey !== savedSelectedIdsKey;
  const canSaveVideos = videosChanged && !isSavingVideos;

  useEffect(() => {
    if (settingsActionState.status === "idle") return;

    toast.add({
      title:
        settingsActionState.status === "success"
          ? "Configuração salva"
          : "Erro ao salvar",
      description: settingsActionState.message,
      type: settingsActionState.status,
    });
  }, [settingsActionState]);

  useEffect(() => {
    if (videosActionState.status === "idle") return;

    toast.add({
      title:
        videosActionState.status === "success"
          ? "Vídeos salvos"
          : "Erro ao salvar",
      description: videosActionState.message,
      type: videosActionState.status,
    });
  }, [videosActionState]);

  function addVideo(id: number) {
    setSelectedIds((current) => {
      if (current.includes(id) || current.length >= selectableLimit)
        return current;
      return [...current, id];
    });
    setCurrentPage((page) => Math.min(page, totalAvailablePages));
  }

  function removeVideo(id: number) {
    setSelectedIds((current) => current.filter((videoId) => videoId !== id));
  }

  function toggleVideo(id: number) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((videoId) => videoId !== id);
      }
      if (current.length >= selectableLimit) return current;
      return [...current, id];
    });
  }

  function moveVideo(id: number, direction: -1 | 1) {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length)
        return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setSelectedIds((current) => {
      const oldIndex = current.indexOf(Number(active.id));
      const newIndex = current.indexOf(Number(over.id));

      if (oldIndex < 0 || newIndex < 0) return current;

      return arrayMove(current, oldIndex, newIndex);
    });
  }

  return (
    <>
      <StudioPageHeader
        title="Destaque"
        description="Configure os vídeos que ficam em destaque na tela inicial para todos os usuários."
      />

      <div className="grid min-w-0 items-stretch gap-6 md:grid-cols-[23rem_minmax(0,1fr)]">
        <Card className="min-w-0">
          <form action={submitSettingsAction} className="flex h-full flex-col">
            <CardHeader className="gap-1 pb-5">
              <CardTitle>Configuração</CardTitle>
              <CardDescription className="text-xs">
                Duração da prévia.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-6">
              <FieldGroup className="gap-6">
                <Field className="gap-2.5">
                  <FieldLabel htmlFor="featured-count">
                    Quantidade de vídeos
                  </FieldLabel>
                  <Input
                    id="featured-count"
                    name="count"
                    type="number"
                    value={draftCount}
                    onChange={(event) => setDraftCount(event.target.value)}
                  />
                  <FieldDescription>
                    De 1 a 5 vídeos em destaque.
                  </FieldDescription>
                </Field>
                <Field className="gap-2.5">
                  <FieldLabel htmlFor="featured-interval">
                    Tempo de tela
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="featured-interval"
                      name="intervalSeconds"
                      type="number"
                      value={draftIntervalSeconds}
                      onChange={(event) =>
                        setDraftIntervalSeconds(event.target.value)
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      segundos
                    </span>
                  </div>
                  <FieldDescription>
                    De 3 a 15 segundos por vídeo.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-end pt-4">
              <Button type="submit" disabled={!canSaveSettings}>
                <IconCheck data-icon="inline-start" aria-hidden="true" />
                {isSavingSettings ? "Salvando..." : "Salvar configuração"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <PreviewCard
          key={previewVideosKey}
          intervalSeconds={previewIntervalSeconds}
          videos={previewVideos}
        />
      </div>

      <form action={submitVideosAction} className="min-w-0">
        <input type="hidden" name="videoIds" value={selectedIds.join(",")} />
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Vídeos do Destaque</CardTitle>
            <CardDescription>
              A ordem abaixo é a ordem da rotação. Selecione até{" "}
              {selectableLimit} vídeos públicos.
            </CardDescription>
            <CardAction>
              <Button type="submit" disabled={!canSaveVideos}>
                <IconCheck data-icon="inline-start" aria-hidden="true" />
                {isSavingVideos ? "Salvando..." : "Salvar vídeos"}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <section
              className="flex flex-col gap-3"
              aria-labelledby="selected-featured-title"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <h2
                  id="selected-featured-title"
                  className="text-sm font-medium"
                >
                  Vídeos selecionados
                </h2>
                <Badge variant="secondary">
                  {selectedVideos.length}/{selectableLimit} selecionados
                </Badge>
              </div>
              {selectedVideos.length > 0 ? (
                <DndContext
                  id="studio-featured-sortable"
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {selectedVideos.map((video, index) => (
                        <SelectedVideoRow
                          key={video.id}
                          video={video}
                          position={index + 1}
                          isFirst={index === 0}
                          isLast={index === selectedVideos.length - 1}
                          onMoveUp={() => moveVideo(video.id, -1)}
                          onMoveDown={() => moveVideo(video.id, 1)}
                          onRemove={() => removeVideo(video.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                    Nenhum vídeo em destaque.
                  </div>
                </div>
              )}
            </section>

            <section
              className="flex flex-col gap-3"
              aria-labelledby="available-featured-title"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <h2
                  id="available-featured-title"
                  className="text-sm font-medium"
                >
                  Lista de vídeos
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Filtro:</span>
                  <NativeSelect
                    size="sm"
                    aria-label="Ordenar vídeos"
                    value={sortOption}
                    onChange={(event) => {
                      setSortOption(event.target.value as VideoSortOption);
                      setCurrentPage(1);
                    }}
                  >
                    <NativeSelectOption value="newest">
                      Mais novo
                    </NativeSelectOption>
                    <NativeSelectOption value="oldest">
                      Mais velho
                    </NativeSelectOption>
                    <NativeSelectOption value="title-asc">
                      A-Z
                    </NativeSelectOption>
                    <NativeSelectOption value="title-desc">
                      Z-A
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table className="min-w-[34rem] table-fixed">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12" />
                      <TableHead>Vídeo</TableHead>
                      <TableHead className="w-32 text-start">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedListedVideos.map((video) => {
                      const isSelected = selectedIds.includes(video.id);
                      const isSelectionDisabled =
                        !isSelected && selectedIds.length >= selectableLimit;

                      return (
                        <TableRow key={video.id}>
                          <TableCell>
                            <Checkbox
                              aria-label={
                                isSelected
                                  ? `Remover ${video.title}`
                                  : `Adicionar ${video.title}`
                              }
                              checked={isSelected}
                              disabled={isSelectionDisabled}
                              nativeButton
                              render={
                                <button
                                  type="button"
                                  onClick={() => toggleVideo(video.id)}
                                />
                              }
                            />
                          </TableCell>
                          <TableCell className="min-w-0">
                            <VideoSummary video={video} />
                          </TableCell>
                          <TableCell className="text-start">
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected ? "outline" : "default"}
                              aria-label={
                                isSelected
                                  ? `${video.title} já selecionado`
                                  : `Selecionar ${video.title}`
                              }
                              disabled={isSelected || isSelectionDisabled}
                              onClick={() => addVideo(video.id)}
                            >
                              {isSelected ? "Selecionado" : "Selecionar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <FeaturedVideosPagination
                currentPage={safeCurrentPage}
                pageSize={FEATURED_VIDEOS_PAGE_SIZE}
                totalItems={listedVideos.length}
                totalPages={totalAvailablePages}
                onPageChange={setCurrentPage}
              />
            </section>
          </CardContent>
        </Card>
      </form>
    </>
  );
}

function PreviewCard({
  intervalSeconds,
  videos,
}: {
  intervalSeconds: number;
  videos: StudioFeaturedVideo[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeVideo = videos[activeIndex] ?? videos[0] ?? null;
  const totalVideos = videos.length;

  useEffect(() => {
    if (totalVideos <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % totalVideos);
    }, intervalSeconds * 1000);

    return () => window.clearInterval(intervalId);
  }, [intervalSeconds, totalVideos]);

  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader>
        <CardTitle>Prévia do Destaque</CardTitle>
      </CardHeader>
      <CardContent>
        <section
          className="relative aspect-video w-full overflow-hidden rounded-lg bg-foreground text-primary-foreground"
          aria-label="Preview da vitrine da home"
        >
          {activeVideo?.thumbnailUrl ? (
            <Image
              key={activeVideo.id}
              src={activeVideo.thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 30rem"
              className="object-cover object-[52%_44%]"
            />
          ) : (
            <div className="grid size-full place-items-center bg-foreground text-primary-foreground/70">
              <div className="flex flex-col items-center gap-2 text-sm font-medium">
                <IconVideo aria-hidden="true" stroke={1.7} />
                Nenhum vídeo público
              </div>
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, color-mix(in srgb, var(--hero-scrim) 72%, transparent) 0%, color-mix(in srgb, var(--hero-scrim) 32%, transparent) 28%, transparent 62%)",
            }}
            aria-hidden="true"
          />
          <div className="relative flex h-full flex-col items-start justify-end px-5 pt-5 pb-4">
            <div className="flex w-full max-w-[21rem] min-w-0 flex-col items-start gap-2">
              <Image
                src={lightLogo}
                alt="Academia Okajima"
                sizes="6rem"
                className="h-auto w-24"
              />
              <h2 className="max-w-[18ch] text-xl font-extrabold leading-none tracking-normal text-primary-foreground uppercase">
                {activeVideo?.title ?? "Vitrine da home"}
              </h2>
              <Button
                type="button"
                variant="featured"
                size="sm"
                className="h-9 rounded-none text-xs font-extrabold uppercase"
              >
                <IconPlayerPlay data-icon="inline-start" aria-hidden="true" />
                Começar a assistir
              </Button>
              {totalVideos > 1 ? (
                <div
                  className="flex w-full max-w-60 items-end gap-1.5 pt-1"
                  aria-hidden="true"
                >
                  {Array.from(
                    { length: Math.min(totalVideos, MAX_FEATURED_VIDEOS) },
                    (_, index) => (
                      <span
                        key={`${totalVideos}-${index}`}
                        className={cn(
                          "relative block h-0.5 w-8 flex-none overflow-hidden rounded-full bg-primary-foreground/50 opacity-80",
                          index === activeIndex
                            ? "h-1 w-16 bg-primary-foreground/35 opacity-100"
                            : null,
                        )}
                      >
                        {index === activeIndex ? (
                          <span
                            key={`${intervalSeconds}-${totalVideos}-${activeIndex}`}
                            className="absolute inset-0 block origin-left bg-primary"
                            style={{
                              animation: `studio-featured-preview-progress ${intervalSeconds}s linear infinite`,
                            }}
                          />
                        ) : null}
                      </span>
                    ),
                  )}
                </div>
              ) : null}
              <span className="text-[0.6875rem] font-semibold text-primary-foreground/75">
                Troca a cada {intervalSeconds}s
              </span>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function FeaturedVideosPagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {firstItem}-{lastItem} de {totalItems}
      </p>
      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <IconChevronLeft data-icon="inline-start" aria-hidden="true" />
              Anterior
            </Button>
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <PaginationItem key={page}>
                <Button
                  type="button"
                  variant={page === currentPage ? "outline" : "ghost"}
                  size="icon-sm"
                  aria-current={page === currentPage ? "page" : undefined}
                  aria-label={`Página ${page}`}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Próxima
              <IconChevronRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function SelectedVideoRow({
  video,
  position,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  video: StudioFeaturedVideo;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: video.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg border bg-card p-2",
        isDragging ? "opacity-70 shadow-md" : null,
      )}
    >
      <Button
        ref={setActivatorNodeRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        className="cursor-grab active:cursor-grabbing"
        aria-label={`Arrastar ${video.title}`}
        {...attributes}
        {...listeners}
      >
        <IconGripVertical aria-hidden="true" />
      </Button>
      <Badge variant="outline" className="h-7 min-w-7 rounded-lg px-2">
        {position}
      </Badge>
      <div className="min-w-0 flex-1">
        <VideoSummary video={video} compact />
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isFirst}
          aria-label={`Subir ${video.title}`}
          onClick={onMoveUp}
        >
          <IconArrowUp aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isLast}
          aria-label={`Descer ${video.title}`}
          onClick={onMoveDown}
        >
          <IconArrowDown aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remover ${video.title}`}
          onClick={onRemove}
        >
          <IconTrash aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function VideoSummary({
  video,
  compact = false,
}: {
  video: StudioFeaturedVideo;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "relative grid aspect-video shrink-0 place-items-center overflow-hidden rounded-md bg-muted",
          compact ? "w-20" : "w-24",
        )}
      >
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            sizes={compact ? "5rem" : "6rem"}
            className="object-cover"
          />
        ) : (
          <IconVideo aria-hidden="true" stroke={1.7} />
        )}
        {video.duration ? (
          <span className="absolute right-1 bottom-1 rounded-sm bg-foreground px-1 py-0.5 text-[0.625rem] font-semibold leading-none text-background">
            {video.duration}
          </span>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {video.title}
        </span>
        <span className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconClock aria-hidden="true" />
            {video.dateLabel}
          </span>
          <span className="flex items-center gap-1">
            <IconEye aria-hidden="true" />
            {video.viewsLabel}
          </span>
        </span>
      </span>
    </div>
  );
}
