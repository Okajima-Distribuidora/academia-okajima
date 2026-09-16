"use client";

import {
  IconChartBar,
  IconClock,
  IconDotsVertical,
  IconLock,
  IconMessageCircle,
  IconPencil,
  IconPlayerPlay,
  IconUpload,
  IconVideo,
  IconWorld,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { StudioPageHeader } from "@/components/studio/layout/studio-page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import {
  useVideoUploadState,
} from "@/components/studio/uploads/video-upload-dialog";
import {
  useCancelStudioUpload,
  useStudioContent,
  useUpdateStudioVisibility,
} from "@/hooks/queries/use-studio-content";
import type {
  StudioContentItem,
  StudioContentPage,
  StudioContentType,
  StudioVideoPrivacy,
} from "@/lib/studio/content/contracts";
import {
  getUploadProgressLabel,
  isTransientUploadStatus,
  mergeActiveUpload,
} from "@/lib/studio/content/upload-view";

const tabs = [
  { value: "videos", label: "Vídeos" },
  { value: "shorts", label: "Shorts" },
] as const;

export function ContentManager({
  activeType,
  content,
}: {
  activeType: StudioContentType;
  content: StudioContentPage;
}) {
  const router = useRouter();
  const { activeUpload } = useVideoUploadState();
  const { data } = useStudioContent({
    type: activeType,
    page: content.page,
    initialData: content,
    activeUpload,
  });

  const items = data.items.map((item) =>
    content.page === 1 && activeType === "videos" && activeUpload?.databaseVideoId === item.id
      ? mergeActiveUpload(item, activeUpload)
      : item,
  );

  return (
    <>
      <header className="flex flex-col gap-5">
        <StudioPageHeader
          title="Conteúdo do canal"
          description="Gerencie os vídeos e shorts publicados na Academia Okajima."
        />
        <Tabs value={activeType} className="-mx-1">
          <TabsList variant="line" className="h-9">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                nativeButton={false}
                render={
                  <Link
                    href={getContentPageHref(tab.value, 1)}
                  />
                }
                className="px-1.5"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
        {items.length > 0 ? (
          <>
            <ContentTable items={items} />
            <ContentPagination
              activeType={activeType}
              content={data}
            />
          </>
        ) : (
          <Empty className="min-h-96 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconVideo aria-hidden="true" stroke={1.7} />
              </EmptyMedia>
              <EmptyTitle>
                Nenhum {activeType === "shorts" ? "short" : "vídeo"} encontrado
              </EmptyTitle>
              <EmptyDescription>
                Quando houver publicações deste tipo, elas aparecerão aqui para
                gestão.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </>
  );
}

function ContentPagination({
  activeType,
  content,
}: {
  activeType: StudioContentType;
  content: StudioContentPage;
}) {
  const firstItem =
    content.totalItems === 0 ? 0 : (content.page - 1) * content.pageSize + 1;
  const lastItem = Math.min(
    content.totalItems,
    content.page * content.pageSize,
  );
  const pages = getVisiblePages(content.page, content.totalPages);

  return (
    <footer className="flex min-h-16 shrink-0 flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <span>
        {firstItem}-{lastItem} de {formatStudioNumber(content.totalItems)}
      </span>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={getContentPageHref(
                activeType,
                Math.max(1, content.page - 1),
              )}
              aria-disabled={content.page <= 1}
              className={
                content.page <= 1 ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href={getContentPageHref(activeType, page)}
                  isActive={page === content.page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href={getContentPageHref(
                activeType,
                Math.min(content.totalPages, content.page + 1),
              )}
              aria-disabled={content.page >= content.totalPages}
              className={
                content.page >= content.totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </footer>
  );
}

function getContentPageHref(
  activeType: StudioContentType,
  page: number,
) {
  const params = new URLSearchParams();

  if (activeType === "shorts") params.set("tipo", "shorts");
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/studio/conteudo?${query}` : "/studio/conteudo";
}

function getVisiblePages(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, 4, "ellipsis", totalPages];
  if (currentPage >= totalPages - 2)
    return [
      1,
      "ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

function ContentTable({ items }: { items: StudioContentItem[] }) {
  const { cancelUploadById } = useVideoUploadState();
  const cancelUpload = useCancelStudioUpload();
  const updateVisibility = useUpdateStudioVisibility();
  const [pendingCancellation, setPendingCancellation] =
    useState<StudioContentItem | null>(null);
  const [pendingVisibility, setPendingVisibility] =
    useState<StudioContentItem | null>(null);
  const [selectedPrivacy, setSelectedPrivacy] =
    useState<StudioVideoPrivacy | null>(null);
  const cancellingId = cancelUpload.isPending
    ? (cancelUpload.variables?.item.id ?? null)
    : null;

  async function confirmCancellation() {
    if (!pendingCancellation?.vimeoId || cancellingId !== null) return;

    const item = pendingCancellation;
    const vimeoId = item.vimeoId as string;
    try {
      await cancelUpload.mutateAsync({
        item: { ...item, vimeoId },
        cancel: cancelUploadById,
      });
      setPendingCancellation(null);
    } catch {
      toast.add({
        title: "Não foi possível cancelar o envio",
        description: "O estado do vídeo será atualizado novamente.",
        type: "error",
      });
    }
  }

  function openVisibilityDialog(item: StudioContentItem) {
    setPendingVisibility(item);
    setSelectedPrivacy(item.privacy);
  }

  async function saveVisibility() {
    if (
      !pendingVisibility ||
      selectedPrivacy === null ||
      selectedPrivacy === pendingVisibility.privacy ||
      updateVisibility.isPending
    ) {
      return;
    }

    try {
      await updateVisibility.mutateAsync({
        item: pendingVisibility,
        privacy: selectedPrivacy,
      });
      setPendingVisibility(null);
      setSelectedPrivacy(null);
    } catch {
      toast.add({
        title: "Não foi possível alterar a visibilidade",
        description: "A configuração anterior foi restaurada.",
        type: "error",
      });
    }
  }

  return (
    <>
      <div className="min-w-0 flex-1 overflow-x-auto">
      <Table className="min-w-[72rem] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 px-4 sm:w-12 sm:px-5">
              <Checkbox
                aria-label="Selecionar todos os vídeos"
                nativeButton
                render={<button type="button" />}
              />
            </TableHead>
            <TableHead className="w-[42%] min-w-0">Vídeo</TableHead>
            <TableHead className="w-64">Avisos</TableHead>
            <TableHead className="w-32">Visibilidade</TableHead>
            <TableHead className="w-36">Data</TableHead>
            <TableHead className="w-28 text-right">
              Visualizações
            </TableHead>
            <TableHead className="w-28 text-right">
              Comentários
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="group/content-row h-[5.25rem]">
              <TableCell className="px-4 sm:px-5">
                <Checkbox
                  aria-label={`Selecionar ${item.title}`}
                  nativeButton
                  render={<button type="button" />}
                />
              </TableCell>
              <TableCell className="min-w-0">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="relative grid aspect-video w-28 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt=""
                        fill
                        sizes="7rem"
                        className="object-cover"
                      />
                    ) : (
                      <IconVideo aria-hidden="true" stroke={1.7} />
                    )}
                    {item.duration ? (
                      <span className="absolute right-1 bottom-1 rounded-sm bg-foreground px-1 py-0.5 text-[0.6875rem] font-semibold leading-none text-background">
                        {item.duration}
                      </span>
                    ) : null}
                  </span>
                  <div className="flex min-h-14 min-w-0 flex-1 flex-col justify-start gap-1 pt-0.5">
                    {isTransientUploadStatus(item.uploadStatus) ? (
                      <span className="line-clamp-1 text-sm font-semibold">
                        {item.title}
                      </span>
                    ) : (
                      <Link
                        href={`/studio/conteudo/${item.publicId}`}
                        className="line-clamp-1 text-sm font-semibold hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        {item.title}
                      </Link>
                    )}
                    <div className="h-7 min-w-0">
                      {item.uploadStatus === "uploading" ? (
                        <div className="flex h-7 min-w-0 items-center gap-2 text-xs text-muted-foreground">
                          <IconUpload aria-hidden="true" className="size-4 shrink-0" />
                          <span className="truncate">{getUploadProgressLabel(item)}</span>
                        </div>
                      ) : item.uploadStatus === "processing" ? (
                        <div className="flex h-7 items-center gap-2 text-xs text-muted-foreground">
                          <IconClock aria-hidden="true" className="size-4 shrink-0" />
                          <span>Processando vídeo...</span>
                        </div>
                      ) : item.uploadStatus === "cancelled" ? (
                        <span className="block text-xs leading-7 text-muted-foreground">
                          Envio cancelado
                        </span>
                      ) : (
                        <span className="block max-w-[32rem] truncate text-xs leading-7 text-muted-foreground group-hover/content-row:hidden group-focus-within/content-row:hidden">
                          {item.description}
                        </span>
                      )}
                      {item.uploadStatus === "ready" ? (
                        <div className="hidden h-8 items-center gap-1 group-hover/content-row:flex group-focus-within/content-row:flex">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          nativeButton={false}
                          render={
                            <Link href={`/studio/conteudo/${item.publicId}`} />
                          }
                          aria-label={`Editar ${item.title}`}
                        >
                          <IconPencil aria-hidden="true" className="size-4.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ver analytics de ${item.title}`}
                        >
                          <IconChartBar
                            aria-hidden="true"
                            className="size-4.5"
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ver comentários de ${item.title}`}
                        >
                          <IconMessageCircle
                            aria-hidden="true"
                            className="size-4.5"
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Abrir player de ${item.title}`}
                        >
                          <IconPlayerPlay
                            aria-hidden="true"
                            className="size-4.5"
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Mais ações para ${item.title}`}
                        >
                          <IconDotsVertical
                            aria-hidden="true"
                            className="size-4.5"
                          />
                        </Button>
                      </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <span className="block text-xs leading-snug">
                  {isTransientUploadStatus(item.uploadStatus)
                    ? "As verificações começarão após o envio"
                    : "-"}
                </span>
              </TableCell>
              <TableCell>
                {item.uploadStatus === "ready" ? (
                  <Popover
                    open={pendingVisibility?.id === item.id}
                    onOpenChange={(open) => {
                      if (open) {
                        openVisibilityDialog(item);
                      } else if (!updateVisibility.isPending) {
                        setPendingVisibility(null);
                        setSelectedPrivacy(null);
                      }
                    }}
                  >
                    <HoverCard>
                      <HoverCardTrigger render={<span className="inline-flex" />}>
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="lg"
                              className="max-w-full justify-start"
                              disabled={
                                updateVisibility.isPending &&
                                updateVisibility.variables?.item.id === item.id
                              }
                            />
                          }
                          aria-label={`${item.visibilityLabel}. Alterar visibilidade de ${item.title}`}
                        >
                          {item.privacy === 0 ? (
                            <IconWorld
                              data-icon="inline-start"
                              aria-hidden="true"
                            />
                          ) : (
                            <IconLock
                              data-icon="inline-start"
                              aria-hidden="true"
                            />
                          )}
                          <span className="truncate">
                            {item.visibilityLabel}
                          </span>
                        </PopoverTrigger>
                      </HoverCardTrigger>
                      <HoverCardContent
                        align="start"
                        side="top"
                        className="flex w-80 flex-col gap-2 p-3"
                      >
                        <p className="font-medium">
                          {item.privacy === 0
                            ? "Este vídeo está público"
                            : "Este vídeo está privado"}
                        </p>
                        <p className="text-muted-foreground">
                          {item.privacy === 0
                            ? "Os alunos com acesso à Academia podem encontrar e assistir a este vídeo."
                            : "Este vídeo não fica disponível no catálogo público da Academia."}
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                    <PopoverContent
                      align="start"
                      side="bottom"
                      sideOffset={6}
                      className="w-96 gap-4 p-4"
                    >
                      <PopoverHeader>
                        <PopoverTitle>Visibilidade do vídeo</PopoverTitle>
                        <PopoverDescription>
                          Defina quem poderá encontrar e assistir a este conteúdo.
                        </PopoverDescription>
                      </PopoverHeader>
                      <FieldSet className="rounded-lg border p-4">
                        <FieldLegend>Salvar ou publicar</FieldLegend>
                        <RadioGroup
                          value={String(selectedPrivacy ?? item.privacy)}
                          onValueChange={(value) =>
                            setSelectedPrivacy(value === "1" ? 1 : 0)
                          }
                          className="gap-4"
                        >
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              value="1"
                              id={`content-visibility-private-${item.id}`}
                            />
                            <FieldLabel
                              htmlFor={`content-visibility-private-${item.id}`}
                            >
                              Privado
                            </FieldLabel>
                          </Field>
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              value="0"
                              id={`content-visibility-public-${item.id}`}
                            />
                            <FieldLabel
                              htmlFor={`content-visibility-public-${item.id}`}
                            >
                              Público
                            </FieldLabel>
                          </Field>
                        </RadioGroup>
                      </FieldSet>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={updateVisibility.isPending}
                          onClick={() => {
                            setPendingVisibility(null);
                            setSelectedPrivacy(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          disabled={
                            updateVisibility.isPending ||
                            selectedPrivacy === null ||
                            selectedPrivacy === pendingVisibility?.privacy
                          }
                          onClick={() => void saveVisibility()}
                        >
                          {updateVisibility.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex min-w-0 items-center gap-2">
                    {isTransientUploadStatus(item.uploadStatus) ? (
                    <IconClock
                      aria-hidden="true"
                      className="size-4 shrink-0"
                      stroke={1.7}
                    />
                  ) : (
                    <IconLock
                      aria-hidden="true"
                      className="size-4 shrink-0"
                      stroke={1.7}
                    />
                  )}
                  <span className="truncate font-medium">
                    {item.visibilityLabel}
                  </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="whitespace-nowrap font-medium">
                    {item.dateLabel}
                  </span>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {item.statusLabel}
                  </span>
                </div>
              </TableCell>
              {item.uploadStatus === "uploading" && item.vimeoId ? (
                <TableCell colSpan={2} className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={cancellingId === item.id}
                    onClick={() => setPendingCancellation(item)}
                  >
                    {cancellingId === item.id ? "Cancelando..." : "Cancelar envio"}
                  </Button>
                </TableCell>
              ) : (
                <>
                  <TableCell className="text-right">
                    {formatStudioNumber(item.views)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatStudioNumber(item.comments)}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      <Dialog
        open={pendingCancellation !== null}
        onOpenChange={(open) => {
          if (!open && cancellingId === null) setPendingCancellation(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Cancelar envio?</DialogTitle>
            <DialogDescription>
              O arquivo deixará de ser enviado e não poderá ser retomado. O
              registro continuará disponível no histórico como cancelado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={cancellingId !== null} />}>
              Continuar envio
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={cancellingId !== null}
              onClick={() => void confirmCancellation()}
            >
              {cancellingId !== null ? "Cancelando..." : "Cancelar envio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

function formatStudioNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.max(0, value));
}
