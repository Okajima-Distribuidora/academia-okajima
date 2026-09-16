"use client";

import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconBadge4k,
  IconBadgeHd,
  IconBadgeSd,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconColumns3,
  IconPencil,
  IconUpload,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import { ConfigProvider as AntConfigProvider, Input as AntInput } from "antd";
import {
  type ChangeEvent,
  createContext,
  type DragEvent,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from "react";
import { Upload } from "tus-js-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StudioCategory } from "@/lib/studio/categories/types";
import { cn } from "@/lib/utils";

export type UploadStatus =
  | "idle"
  | "preparing"
  | "uploading"
  | "processing"
  | "cancelling"
  | "cancelled"
  | "complete"
  | "error";
type VideoQuality = "4K" | "FULLHD" | "HD" | "SD";
type UploadStep = "details" | "category";

type UploadDetailsDraft = {
  title: string;
  description: string;
  subcategoryIds: number[];
};

type CreateUploadResponse = {
  databaseVideoId: number;
  videoId: string;
  uploadLink: string;
};

type UploadHistoryItem = {
  id: string;
  file: File;
  title: string;
  description: string;
  quality: VideoQuality | null;
  status: UploadStatus;
  progress: number;
  remainingSeconds: number | null;
  errorMessage: string | null;
  databaseVideoId: number | null;
  vimeoVideoId: string | null;
  subcategoryIds: number[];
};

export type ActiveVideoUpload = {
  databaseVideoId: number;
  vimeoVideoId: string;
  title: string;
  status: UploadStatus;
  progress: number;
  remainingSeconds: number | null;
};

type VideoUploadDialogContextValue = {
  openDialog: () => void;
  activeUpload: ActiveVideoUpload | null;
  cancelUploadById: (
    databaseVideoId: number,
    vimeoVideoId: string,
  ) => Promise<void>;
};

const { TextArea: AntTextArea } = AntInput;

const VideoUploadDialogContext =
  createContext<VideoUploadDialogContextValue | null>(null);

export function VideoUploadDialogProvider({
  children,
  categories,
}: {
  children: ReactNode;
  categories: StudioCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(true);
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<UploadStep>("details");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quality, setQuality] = useState<VideoQuality | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subcategoryIds, setSubcategoryIds] = useState<number[]>([]);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingPollVersionRef = useRef(0);
  const uploadRef = useRef<Upload | null>(null);
  const databaseVideoIdRef = useRef<number | null>(null);
  const vimeoVideoIdRef = useRef<string | null>(null);
  const cancelRequestedRef = useRef(false);
  const pendingCloseDetailsRef = useRef<UploadDetailsDraft | null>(null);

  function getCurrentUploadSnapshot(): UploadHistoryItem | null {
    if (!file || !currentUploadId) return null;

    return {
      id: currentUploadId,
      file,
      title,
      description,
      quality,
      status,
      progress,
      remainingSeconds,
      errorMessage,
      databaseVideoId: databaseVideoIdRef.current,
      vimeoVideoId: vimeoVideoIdRef.current,
      subcategoryIds,
    };
  }

  function archiveCurrentUpload() {
    const item = getCurrentUploadSnapshot();
    if (!item) return;

    setHistory((currentHistory) => {
      const nextHistory = [...currentHistory, item];
      return nextHistory.slice(-7);
    });
  }

  function resetUpload() {
    processingPollVersionRef.current += 1;
    setFile(null);
    setTitle("");
    setDescription("");
    setQuality(null);
    setStatus("idle");
    setProgress(0);
    setRemainingSeconds(null);
    setErrorMessage(null);
    setCurrentUploadId(null);
    setViewingHistoryId(null);
    setActiveStep("details");
    setSubcategoryIds([]);
    setIsSavingDetails(false);
    uploadRef.current = null;
    databaseVideoIdRef.current = null;
    vimeoVideoIdRef.current = null;
    cancelRequestedRef.current = false;
    pendingCloseDetailsRef.current = null;
  }

  async function deleteUploadContainer(
    databaseVideoId: number,
    videoId: string,
  ) {
    const response = await fetch("/api/studio/videos/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ databaseVideoId, videoId }),
    });

    if (!response.ok) {
      throw new Error("Não foi possível remover o envio do Vimeo.");
    }
  }

  async function saveUploadDetailsAndClose(
    databaseVideoId: number,
    videoId: string,
    details: UploadDetailsDraft,
  ) {
    setIsSavingDetails(true);

    try {
      const response = await fetch("/api/studio/videos/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseVideoId,
          videoId,
          ...details,
        }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(
          result?.message ?? "Não foi possível salvar os detalhes do vídeo.",
        );
      }

      pendingCloseDetailsRef.current = null;
      setOpen(false);
    } catch (error) {
      pendingCloseDetailsRef.current = null;
      setActiveStep("details");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar os detalhes do vídeo.",
      );
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function monitorVimeoProcessing(
    databaseVideoId: number,
    videoId: string,
  ) {
    const pollVersion = processingPollVersionRef.current + 1;
    processingPollVersionRef.current = pollVersion;
    let consecutiveFailures = 0;

    while (processingPollVersionRef.current === pollVersion) {
      try {
        const response = await fetch(
          `/api/studio/videos/upload?databaseVideoId=${databaseVideoId}&videoId=${encodeURIComponent(videoId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Processing status request failed");

        const result = (await response.json()) as {
          status?: "in_progress" | "complete" | "error";
        };
        consecutiveFailures = 0;

        if (result.status === "complete") {
          setStatus("complete");
          return;
        }
        if (result.status === "error") {
          setStatus("error");
          setErrorMessage("O Vimeo não conseguiu processar este vídeo.");
          return;
        }
      } catch (error) {
        consecutiveFailures += 1;
        if (consecutiveFailures >= 6) {
          console.error("[academia-vimeo] processing_status_failed", error);
          setStatus("error");
          setErrorMessage(
            "Não foi possível confirmar o processamento do vídeo no Vimeo.",
          );
          return;
        }
      }

      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }
  }

  function finishCancellation() {
    setStatus("cancelled");
    setRemainingSeconds(null);
    setErrorMessage(null);
    uploadRef.current = null;
  }

  async function cancelUpload() {
    if (status === "cancelling") return;

    cancelRequestedRef.current = true;
    setStatus("cancelling");

    if (!databaseVideoIdRef.current || !vimeoVideoIdRef.current) return;

    try {
      await uploadRef.current?.abort(false);
      await deleteUploadContainer(
        databaseVideoIdRef.current,
        vimeoVideoIdRef.current,
      );
      finishCancellation();
    } catch (error) {
      console.error("[academia-vimeo] upload_cancellation_failed", error);
      cancelRequestedRef.current = false;
      setStatus("error");
      setErrorMessage("Não foi possível cancelar o envio. Tente novamente.");
    }
  }

  function openDialog() {
    setViewingHistoryId(null);
    setActiveStep("details");
    if (status === "complete" || status === "cancelled" || status === "error") {
      archiveCurrentUpload();
      resetUpload();
    }
    setOpen(true);
  }

  async function beginUpload(video: File) {
    const initialTitle = getTitleFromFilename(video.name);
    setHistoryVisible(true);
    setCurrentUploadId(crypto.randomUUID());
    setActiveStep("details");
    setSubcategoryIds([]);
    setFile(video);
    setTitle(initialTitle);
    setDescription("");
    setQuality(null);
    setStatus("preparing");
    setProgress(0);
    setRemainingSeconds(null);
    setErrorMessage(null);
    cancelRequestedRef.current = false;
    databaseVideoIdRef.current = null;
    vimeoVideoIdRef.current = null;

    void detectVideoQuality(video).then(setQuality);

    try {
      const response = await fetch("/api/studio/videos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: initialTitle, size: video.size }),
      });
      const result =
        (await response.json()) as Partial<CreateUploadResponse> & {
          message?: string;
        };

      if (!response.ok || !result.uploadLink) {
        throw new Error(result.message ?? "Não foi possível iniciar o envio.");
      }

      if (!result.videoId || !result.databaseVideoId) {
        throw new Error("O envio não retornou uma identificação válida.");
      }
      const videoId = result.videoId;
      const databaseVideoId = result.databaseVideoId;

      databaseVideoIdRef.current = databaseVideoId;
      vimeoVideoIdRef.current = videoId;
      if (cancelRequestedRef.current) {
        await deleteUploadContainer(databaseVideoId, videoId);
        finishCancellation();
        return;
      }

      const startedAt = performance.now();
      const upload = new Upload(video, {
        uploadUrl: result.uploadLink,
        retryDelays: null,
        storeFingerprintForResuming: false,
        removeFingerprintOnSuccess: true,
        onProgress(bytesUploaded, bytesTotal) {
          const nextProgress = Math.min(
            100,
            (bytesUploaded / bytesTotal) * 100,
          );
          const elapsedSeconds = (performance.now() - startedAt) / 1000;
          const bytesPerSecond =
            elapsedSeconds > 0 ? bytesUploaded / elapsedSeconds : 0;
          const secondsLeft =
            bytesPerSecond > 0
              ? Math.ceil((bytesTotal - bytesUploaded) / bytesPerSecond)
              : null;

          setStatus("uploading");
          setProgress(nextProgress);
          setRemainingSeconds(secondsLeft);
        },
        onSuccess() {
          setStatus("processing");
          setProgress(100);
          setRemainingSeconds(0);
          void monitorVimeoProcessing(databaseVideoId, videoId);
        },
        onError(error) {
          console.error("[academia-vimeo] browser_upload_failed", error);
          setStatus("error");
          setErrorMessage("O envio falhou. Tente enviar o arquivo novamente.");
          setRemainingSeconds(null);
        },
      });

      uploadRef.current = upload;
      upload.start();

      const pendingCloseDetails = pendingCloseDetailsRef.current;
      if (pendingCloseDetails) {
        void saveUploadDetailsAndClose(
          databaseVideoId,
          videoId,
          pendingCloseDetails,
        );
      }
    } catch (error) {
      if (pendingCloseDetailsRef.current) {
        pendingCloseDetailsRef.current = null;
        setIsSavingDetails(false);
      }
      if (cancelRequestedRef.current && !vimeoVideoIdRef.current) {
        finishCancellation();
        return;
      }
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o envio.",
      );
    }
  }

  function selectFirstVideo(files: FileList | File[]) {
    if (status !== "idle") return;
    const video = Array.from(files).find((candidate) =>
      candidate.type.startsWith("video/"),
    );
    if (video) void beginUpload(video);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (status !== "idle") return;
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null))
      return;
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFirstVideo(event.dataTransfer.files);
  }

  const currentUpload = getCurrentUploadSnapshot();
  const uploadItems = [
    ...history,
    ...(currentUpload ? [currentUpload] : []),
  ].slice(-8);
  const viewedUpload = viewingHistoryId
    ? (history.find((item) => item.id === viewingHistoryId) ?? null)
    : null;
  const dialogUpload = viewedUpload ?? currentUpload;

  function requestDialogClose() {
    if (isSavingDetails) return;
    if (!dialogUpload) {
      setOpen(false);
      return;
    }

    const details = {
      title: dialogUpload.title,
      description: dialogUpload.description,
      subcategoryIds: dialogUpload.subcategoryIds,
    };
    if (!dialogUpload.databaseVideoId || !dialogUpload.vimeoVideoId) {
      if (!viewedUpload && dialogUpload.status === "preparing") {
        pendingCloseDetailsRef.current = details;
        setIsSavingDetails(true);
        return;
      }

      setOpen(false);
      return;
    }

    void saveUploadDetailsAndClose(
      dialogUpload.databaseVideoId,
      dialogUpload.vimeoVideoId,
      details,
    );
  }

  function updateViewedUpload(
    uploadId: string,
    values: Partial<
      Pick<UploadHistoryItem, "title" | "description" | "subcategoryIds">
    >,
  ) {
    setHistory((currentHistory) =>
      currentHistory.map((item) =>
        item.id === uploadId ? { ...item, ...values } : item,
      ),
    );
  }

  function openUploadItem(uploadId: string) {
    setActiveStep("details");
    setViewingHistoryId(uploadId === currentUploadId ? null : uploadId);
    setOpen(true);
  }

  const activeUpload =
    currentUpload?.databaseVideoId && currentUpload.vimeoVideoId
      ? {
          databaseVideoId: currentUpload.databaseVideoId,
          vimeoVideoId: currentUpload.vimeoVideoId,
          title: currentUpload.title,
          status: currentUpload.status,
          progress: currentUpload.progress,
          remainingSeconds: currentUpload.remainingSeconds,
        }
      : null;

  async function cancelUploadById(
    databaseVideoId: number,
    vimeoVideoId: string,
  ) {
    if (
      databaseVideoIdRef.current === databaseVideoId &&
      vimeoVideoIdRef.current === vimeoVideoId
    ) {
      await cancelUpload();
      return;
    }

    await deleteUploadContainer(databaseVideoId, vimeoVideoId);
  }

  return (
    <VideoUploadDialogContext.Provider
      value={{ openDialog, activeUpload, cancelUploadById }}
    >
      {children}
      <Dialog
        open={open}
        disablePointerDismissal
        onOpenChange={(nextOpen) => {
          if (nextOpen) setOpen(true);
          else requestDialogClose();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="h-[calc(100dvh-1rem)] max-h-[50rem] max-w-[calc(100%-1rem)] grid-rows-[auto_auto_1fr_auto] gap-0 overflow-hidden rounded-lg p-0 sm:h-[calc(100dvh-2rem)] sm:max-w-240"
        >
          <DialogHeader className="flex-row items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle className="truncate text-lg">
                {dialogUpload
                  ? dialogUpload.title || dialogUpload.file.name
                  : "Enviar vídeos"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Envie um vídeo e preencha seus detalhes.
              </DialogDescription>
            </div>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Fechar envio de vídeo"
                  disabled={isSavingDetails}
                />
              }
            >
              <IconX aria-hidden="true" />
            </DialogClose>
          </DialogHeader>

          {dialogUpload ? (
            <UploadSteps
              currentStep={activeStep}
              onStepChange={setActiveStep}
            />
          ) : null}

          {dialogUpload ? (
            activeStep === "details" ? (
              <UploadDetails
                file={dialogUpload.file}
                title={dialogUpload.title}
                description={dialogUpload.description}
                status={dialogUpload.status}
                errorMessage={dialogUpload.errorMessage}
                vimeoVideoId={dialogUpload.vimeoVideoId}
                onTitleChange={(value) =>
                  viewedUpload
                    ? updateViewedUpload(viewedUpload.id, { title: value })
                    : setTitle(value)
                }
                onDescriptionChange={(value) =>
                  viewedUpload
                    ? updateViewedUpload(viewedUpload.id, {
                        description: value,
                      })
                    : setDescription(value)
                }
                onRetry={() => {
                  if (viewedUpload) return;
                  archiveCurrentUpload();
                  resetUpload();
                  window.setTimeout(
                    () => void beginUpload(dialogUpload.file),
                    0,
                  );
                }}
              />
            ) : (
              <UploadCategoryStep
                categories={categories}
                selectedIds={dialogUpload.subcategoryIds}
                onSelectionChange={(nextIds) =>
                  viewedUpload
                    ? updateViewedUpload(viewedUpload.id, {
                        subcategoryIds: nextIds,
                      })
                    : setSubcategoryIds(nextIds)
                }
              />
            )
          ) : (
            <div
              className={cn(
                "flex h-full min-h-0 flex-1 flex-col transition-colors",
                isDragging && "bg-muted/60",
              )}
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                  if (event.target.files) selectFirstVideo(event.target.files);
                  event.target.value = "";
                }}
              />
              <Empty className="h-full min-h-0 flex-1 rounded-none border-0 px-5 py-8">
                <EmptyHeader className="max-w-md gap-3">
                  <EmptyMedia className="mb-2 size-28 rounded-full bg-muted text-muted-foreground [&_svg]:size-12">
                    <IconUpload aria-hidden="true" stroke={1.6} />
                  </EmptyMedia>
                  <EmptyTitle className="text-base">
                    Arraste e solte um arquivo de vídeo para fazer o envio
                  </EmptyTitle>
                  <EmptyDescription>
                    Você também pode selecionar o vídeo no seu dispositivo.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    variant="inverse"
                    size="lg"
                    className="rounded-full px-5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar arquivo
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          )}

          {dialogUpload ? (
            <UploadFooter
              status={dialogUpload.status}
              progress={dialogUpload.progress}
              remainingSeconds={dialogUpload.remainingSeconds}
              quality={dialogUpload.quality}
              currentStep={activeStep}
              onStepChange={setActiveStep}
              isSaving={isSavingDetails}
              onFinish={requestDialogClose}
            />
          ) : (
            <footer className="px-5 py-5 text-center text-xs leading-relaxed text-muted-foreground sm:px-8">
              Ao enviar vídeos, você confirma que possui os direitos necessários
              sobre o conteúdo e autoriza seu processamento pela plataforma.
            </footer>
          )}
        </DialogContent>
      </Dialog>
      {!open && historyVisible && uploadItems.length > 0 ? (
        <UploadHistoryPanel
          items={uploadItems}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onOpenUpload={openUploadItem}
          onCancelUpload={() => void cancelUpload()}
          onDismiss={() => setHistoryVisible(false)}
        />
      ) : null}
    </VideoUploadDialogContext.Provider>
  );
}

function UploadSteps({
  currentStep,
  onStepChange,
}: {
  currentStep: UploadStep;
  onStepChange: (step: UploadStep) => void;
}) {
  const steps: Array<{ id: UploadStep; label: string }> = [
    { id: "details", label: "Detalhes" },
    { id: "category", label: "Categoria" },
  ];

  return (
    <nav className="border-b px-5 py-3 sm:px-8" aria-label="Etapas do vídeo">
      <ol className="relative grid grid-cols-2">
        <span
          aria-hidden="true"
          className="absolute top-11 right-1/4 left-1/4 h-px bg-border"
        />
        {steps.map((step) => {
          const active = currentStep === step.id;

          return (
            <li key={step.id} className="relative flex justify-center">
              <button
                type="button"
                className="flex min-w-28 flex-col items-center gap-2 rounded-sm px-3 py-1 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-current={active ? "step" : undefined}
                onClick={() => onStepChange(step.id)}
              >
                <span
                  className={cn(
                    "text-muted-foreground",
                    active && "text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative size-6 rounded-full border-4 border-background bg-muted-foreground ring-1 ring-border",
                    active && "bg-primary ring-2 ring-primary",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function UploadCategoryStep({
  categories,
  selectedIds,
  onSelectionChange,
}: {
  categories: StudioCategory[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}) {
  const activeCategories = categories
    .filter((category) => category.isActive)
    .map((category) => ({
      ...category,
      subcategories: category.subcategories.filter(
        (subcategory) => subcategory.isActive,
      ),
    }))
    .filter((category) => category.subcategories.length > 0);

  function toggleSubcategory(subcategoryId: number, checked: boolean) {
    onSelectionChange(
      checked
        ? [...new Set([...selectedIds, subcategoryId])]
        : selectedIds.filter((id) => id !== subcategoryId),
    );
  }

  return (
    <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold">Categoria</h2>
          <p className="text-sm text-muted-foreground">
            Selecione as subcategorias em que este vídeo será exibido.
          </p>
        </div>

        {activeCategories.length > 0 ? (
          <div className="flex flex-col gap-4">
            {activeCategories.map((category) => (
              <fieldset
                key={category.id}
                className="flex flex-col gap-3 rounded-md border bg-card p-4 text-card-foreground shadow-xs sm:p-5"
              >
                <legend className="px-1 text-sm font-semibold uppercase">
                  {category.name}
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {category.subcategories.map((subcategory) => {
                    const checked = selectedIds.includes(subcategory.id);

                    return (
                      <label
                        key={subcategory.id}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border bg-background px-3 py-2 transition-colors hover:bg-muted has-data-checked:border-primary has-data-checked:bg-primary/5"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(nextChecked) =>
                            toggleSubcategory(subcategory.id, nextChecked)
                          }
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {subcategory.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        ) : (
          <Empty className="min-h-48 border">
            <EmptyHeader>
              <EmptyTitle>Nenhuma subcategoria disponível</EmptyTitle>
              <EmptyDescription>
                Crie e ative uma subcategoria na área de categorias do Studio.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        <p className="text-sm text-muted-foreground">
          {selectedIds.length === 0
            ? "Nenhuma subcategoria selecionada."
            : `${selectedIds.length} ${selectedIds.length === 1 ? "subcategoria selecionada" : "subcategorias selecionadas"}.`}
        </p>
      </div>
    </div>
  );
}

function UploadDetails({
  file,
  title,
  description,
  status,
  errorMessage,
  vimeoVideoId,
  onTitleChange,
  onDescriptionChange,
  onRetry,
}: {
  file: File;
  title: string;
  description: string;
  status: UploadStatus;
  errorMessage: string | null;
  vimeoVideoId: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section
          className="flex min-w-0 flex-col gap-5"
          aria-labelledby="upload-details-title"
        >
          <h2 id="upload-details-title" className="text-2xl font-semibold">
            Detalhes
          </h2>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="upload-video-title">Título</FieldLabel>
              <Input
                id="upload-video-title"
                value={title}
                maxLength={100}
                onChange={(event) => onTitleChange(event.target.value)}
              />
              <span className="self-end text-xs tabular-nums text-muted-foreground">
                {title.length}/100
              </span>
            </Field>
            <Field>
              <FieldLabel htmlFor="upload-video-description">
                Descrição
              </FieldLabel>
              <AntConfigProvider
                theme={{
                  token: {
                    colorBgContainer: "var(--background)",
                    colorBorder: "var(--input)",
                    colorPrimary: "var(--primary)",
                    colorText: "var(--foreground)",
                    colorTextPlaceholder: "var(--muted-foreground)",
                  },
                  components: {
                    Input: {
                      activeBg: "var(--background)",
                      activeBorderColor: "var(--primary)",
                      activeShadow:
                        "0 0 0 3px color-mix(in srgb, var(--primary) 40%, transparent)",
                      hoverBg: "var(--background)",
                      hoverBorderColor: "var(--primary)",
                    },
                  },
                }}
              >
                <AntTextArea
                  id="upload-video-description"
                  value={description}
                  maxLength={5000}
                  showCount
                  allowClear
                  autoSize={{ minRows: 6, maxRows: 12 }}
                  className="upload-description-textarea"
                  placeholder="Adicione uma descrição sobre o vídeo."
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    onDescriptionChange(event.target.value)
                  }
                />
              </AntConfigProvider>
            </Field>
          </FieldGroup>
        </section>

        <aside
          className="h-fit overflow-hidden rounded-md bg-secondary shadow-md"
          aria-label="Arquivo em envio"
        >
          <div className="relative grid aspect-video place-items-center overflow-hidden bg-muted-foreground/25 px-5 text-center text-sm font-medium text-muted-foreground">
            {status === "complete" && vimeoVideoId ? (
              <iframe
                src={`https://player.vimeo.com/video/${vimeoVideoId}?autoplay=1&muted=1&playsinline=1&title=0&byline=0&portrait=0`}
                title={`Prévia do vídeo ${title || file.name}`}
                className="absolute inset-0 size-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : status === "error" ? (
              <div className="flex flex-col items-center gap-3">
                <IconAlertCircle aria-hidden="true" className="size-8" />
                <span>Falha no envio</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : status === "complete" ? (
              <div className="flex flex-col items-center gap-2">
                <IconCheck aria-hidden="true" className="size-8" />
                <span>Vídeo pronto</span>
              </div>
            ) : status === "processing" ? (
              <div className="flex flex-col items-center gap-2">
                <IconVideo aria-hidden="true" className="size-8" />
                <span>Processando no Vimeo...</span>
              </div>
            ) : (
              <span>
                {status === "cancelling"
                  ? "Cancelando envio..."
                  : status === "preparing"
                    ? "Preparando envio..."
                    : "Enviando vídeo..."}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-4 border-t border-border/60 bg-secondary p-4">
            <div>
              <p className="text-xs text-muted-foreground">Nome do arquivo</p>
              <p
                className="mt-1 truncate text-sm font-medium"
                title={file.name}
              >
                {file.name}
              </p>
            </div>
            {errorMessage ? (
              <p className="text-xs text-destructive">{errorMessage}</p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function UploadFooter({
  status,
  progress,
  remainingSeconds,
  quality,
  currentStep,
  isSaving,
  onStepChange,
  onFinish,
}: {
  status: UploadStatus;
  progress: number;
  remainingSeconds: number | null;
  quality: VideoQuality | null;
  currentStep: UploadStep;
  isSaving: boolean;
  onStepChange: (step: UploadStep) => void;
  onFinish: () => void;
}) {
  const roundedProgress = Math.round(progress);
  const statusText =
    status === "complete"
      ? "Vídeo pronto para reprodução."
      : status === "processing"
        ? "Upload concluído. Processando vídeo no Vimeo..."
        : status === "cancelled"
          ? "Envio cancelado."
          : status === "cancelling"
            ? "Cancelando envio..."
            : status === "error"
              ? "O envio não foi concluído."
              : status === "preparing"
                ? "Preparando envio..."
                : `Envio em ${roundedProgress}% · ${formatRemainingTime(remainingSeconds)}`;

  return (
    <footer className="border-t bg-background">
      <Progress
        value={progress}
        aria-label={`Progresso geral do envio: ${roundedProgress}%`}
        className="gap-0"
      />
      <div className="flex min-h-14 items-center gap-3 px-5 text-sm text-muted-foreground sm:px-6">
        <HoverCard>
          <HoverCardTrigger
            delay={100}
            closeDelay={150}
            render={
              <button
                type="button"
                className="grid size-8 shrink-0 place-items-center rounded-sm outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Ver progresso do envio"
              />
            }
          >
            <IconUpload aria-hidden="true" className="size-5" />
          </HoverCardTrigger>
          <HoverCardContent side="top" align="start" className="w-52 p-3">
            <div className="flex flex-col gap-1">
              <p className="font-medium">{getUploadPanelTitle(status)}</p>
              <p className="text-xs text-muted-foreground">
                {getUploadPanelProgress(status, roundedProgress)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getUploadPanelRemainingTime(status, remainingSeconds)}
              </p>
              <Progress
                value={progress}
                aria-label={`Envio em ${roundedProgress}%`}
                className="mt-3 gap-0"
              />
            </div>
          </HoverCardContent>
        </HoverCard>
        {quality ? <VideoQualityIcon quality={quality} /> : null}
        <span className="min-w-0 truncate">{statusText}</span>
        <div className="ms-auto flex shrink-0 items-center gap-2">
          {currentStep === "category" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => onStepChange("details")}
            >
              <IconArrowLeft data-icon="inline-start" aria-hidden="true" />
              Voltar
            </Button>
          ) : null}
          <Button
            type="button"
            size="default"
            disabled={isSaving}
            onClick={() =>
              currentStep === "details" ? onStepChange("category") : onFinish()
            }
          >
            {isSaving
              ? "Salvando..."
              : currentStep === "details"
                ? "Avançar"
                : "Concluir"}
          </Button>
        </div>
      </div>
    </footer>
  );
}

function UploadHistoryPanel({
  items,
  open,
  onOpenChange,
  onOpenUpload,
  onCancelUpload,
  onDismiss,
}: {
  items: UploadHistoryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenUpload: (uploadId: string) => void;
  onCancelUpload: () => void;
  onDismiss: () => void;
}) {
  const activeItem = [...items]
    .reverse()
    .find((item) =>
      ["preparing", "uploading", "processing", "cancelling"].includes(
        item.status,
      ),
    );
  const activeIndex = activeItem ? items.indexOf(activeItem) + 1 : null;

  return (
    <aside className="fixed right-4 bottom-4 z-40 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10">
      <div className="flex min-h-12 items-center">
        <button
          type="button"
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-4 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
        >
          <span className="font-semibold">
            {activeIndex
              ? activeItem?.status === "processing"
                ? `Processando ${activeIndex} de ${items.length}`
                : `Enviando ${activeIndex} de ${items.length}`
              : `${items.length} ${items.length === 1 ? "envio recente" : "envios recentes"}`}
          </span>
          {activeItem ? (
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {activeItem.status === "processing"
                ? "Processando no Vimeo..."
                : formatRemainingTime(activeItem.remainingSeconds)}
            </span>
          ) : (
            <span className="flex-1" />
          )}
          {open ? (
            <IconChevronDown aria-hidden="true" className="size-5 shrink-0" />
          ) : (
            <IconChevronUp aria-hidden="true" className="size-5 shrink-0" />
          )}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="me-2 shrink-0"
          aria-label="Fechar painel de uploads"
          onClick={onDismiss}
        >
          <IconX aria-hidden="true" />
        </Button>
      </div>
      {activeItem ? (
        <Progress
          value={activeItem.progress}
          aria-label={`Envio em ${Math.round(activeItem.progress)}%`}
          className="gap-0"
        />
      ) : null}
      {open ? (
        <div className="max-h-80 overflow-y-auto border-t">
          {items.map((item) => {
            const canCancel =
              item.id === activeItem?.id &&
              (item.status === "preparing" || item.status === "uploading");

            return (
              <div
                key={item.id}
                className="flex min-h-11 items-center border-b last:border-b-0 hover:bg-muted/60"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onClick={() => onOpenUpload(item.id)}
                >
                  <IconPencil
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {item.file.name}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {getHistoryStatusText(item)}
                  </span>
                </button>
                {canCancel ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="me-2 shrink-0"
                    aria-label={`Cancelar envio de ${item.file.name}`}
                    onClick={onCancelUpload}
                  >
                    <IconX aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}

function VideoQualityIcon({ quality }: { quality: VideoQuality }) {
  const QualityIcon =
    quality === "4K"
      ? IconBadge4k
      : quality === "HD"
        ? IconBadgeHd
        : IconBadgeSd;

  return (
    <QualityIcon
      aria-label={`Qualidade ${quality}`}
      className="size-6 shrink-0"
      stroke={1.7}
    />
  );
}

function getUploadPanelTitle(status: UploadStatus) {
  if (status === "complete") return "Vídeo pronto";
  if (status === "processing") return "Processando no Vimeo";
  if (status === "cancelled") return "Envio cancelado";
  if (status === "error") return "Falha no envio";
  if (status === "cancelling") return "Cancelando envio";
  if (status === "preparing") return "Preparando vídeo";
  return "Enviando vídeo";
}

function getUploadPanelProgress(status: UploadStatus, progress: number) {
  if (status === "complete") return "Pronto para reprodução";
  if (status === "processing") return "Upload concluído";
  if (status === "cancelled") return "Envio cancelado";
  if (status === "error") return `${progress}% enviado antes da falha`;
  if (status === "cancelling") return "Interrompendo o upload...";
  if (status === "preparing") return "Iniciando upload...";
  return `${progress}% concluído`;
}

function getUploadPanelRemainingTime(
  status: UploadStatus,
  remainingSeconds: number | null,
) {
  if (status === "complete") return "Envio finalizado";
  if (status === "processing") return "Aguardando o Vimeo finalizar";
  if (status === "cancelled") return "Envio interrompido";
  if (status === "error") return "Estimativa interrompida";
  if (status === "cancelling") return "Encerrando o envio...";
  if (status === "preparing") return "Calculando tempo restante...";
  return formatRemainingTime(remainingSeconds);
}

function getHistoryStatusText(item: UploadHistoryItem) {
  if (item.status === "complete") return "Vídeo pronto";
  if (item.status === "processing") return "Processando no Vimeo";
  if (item.status === "cancelled") return "Envio cancelado";
  if (item.status === "error") return "Falha no envio";
  if (item.status === "cancelling") return "Cancelando...";
  if (item.status === "preparing") return "Preparando...";
  return `${Math.round(item.progress)}% concluído`;
}

function getTitleFromFilename(filename: string) {
  const title = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  return (title || filename).slice(0, 100);
}

function detectVideoQuality(file: File): Promise<VideoQuality | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    const finish = (quality: VideoQuality | null) => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      resolve(quality);
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width >= 3840 || height >= 2160) finish("4K");
      else if (width >= 1280 || height >= 720) finish("HD");
      else finish("SD");
    };
    video.onerror = () => finish(null);
    video.src = objectUrl;
  });
}

function formatRemainingTime(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) {
    return "calculando tempo restante";
  }
  if (seconds < 60) {
    return `Tempo restante: ${Math.max(1, seconds)} segundos`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Tempo restante: ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}

export function useVideoUploadDialog() {
  const context = useContext(VideoUploadDialogContext);
  if (!context) {
    throw new Error(
      "useVideoUploadDialog must be used inside VideoUploadDialogProvider",
    );
  }
  return context.openDialog;
}

export function useVideoUploadState() {
  const context = useContext(VideoUploadDialogContext);
  if (!context) {
    throw new Error(
      "useVideoUploadState must be used inside VideoUploadDialogProvider",
    );
  }
  return context;
}

export function StudioVideoUploadButton() {
  const openDialog = useVideoUploadDialog();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            aria-label="Enviar vídeos"
            onClick={openDialog}
          />
        }
      >
        <IconUpload aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent side="bottom">Enviar vídeos</TooltipContent>
    </Tooltip>
  );
}
