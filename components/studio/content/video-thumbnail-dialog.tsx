"use client";

import { IconPhoto, IconUpload } from "@tabler/icons-react";
import type Player from "@vimeo/player";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { VimeoVideoThumbnail } from "@/lib/vimeo/videos";

type CreateThumbnailAction = (
  seconds: number,
) => Promise<{ ok: true; message: string } | { ok: false; message: string }>;

const FRAME_STEP = 1 / 30;
const TIMELINE_STEP = 5 * 60;

export function VideoThumbnailDialog({
  title,
  duration,
  vimeoId,
  thumbnailUrl,
  thumbnails,
  createThumbnailAction,
}: {
  title: string;
  duration: string;
  vimeoId: string | null;
  thumbnailUrl: string | null;
  thumbnails: VimeoVideoThumbnail[];
  createThumbnailAction: CreateThumbnailAction;
}) {
  const [open, setOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(
    parseDuration(duration),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const playerRef = useRef<Player | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const seekVersionRef = useRef(0);

  const safeDuration = Math.max(durationSeconds, 1);
  const timelineFrames = useMemo(
    () => buildTimelineFrames(safeDuration),
    [safeDuration],
  );
  const activeThumbnailUrl =
    thumbnails.find((thumbnail) => thumbnail.active)?.thumbnailUrl ??
    thumbnailUrl;

  useEffect(() => {
    if (!open || !iframeRef.current || !vimeoId) return;

    let disposed = false;
    let player: Player | null = null;

    async function setupPlayer() {
      const VimeoPlayer = (await import("@vimeo/player")).default;
      if (!iframeRef.current || disposed) return;

      player = new VimeoPlayer(iframeRef.current);
      playerRef.current = player;

      try {
        await player.ready();
        const [loadedDuration, loadedCurrentTime] = await Promise.all([
          player.getDuration(),
          player.getCurrentTime(),
        ]);

        if (disposed) return;

        setDurationSeconds(
          Number.isFinite(loadedDuration) ? loadedDuration : safeDuration,
        );
        setCurrentTime(
          Number.isFinite(loadedCurrentTime) ? loadedCurrentTime : 0,
        );
        player.on("seeked", (data) => {
          if (!disposed) setCurrentTime(data.seconds);
        });
        player.on("timeupdate", (data) => {
          if (!disposed) setCurrentTime(data.seconds);
        });
      } catch {
        if (!disposed) {
          setMessage(
            "O player do Vimeo não ficou disponível para navegação neste ambiente.",
          );
        }
      }
    }

    void setupPlayer();

    return () => {
      disposed = true;
      playerRef.current = null;
      player?.unload().catch(() => undefined);
    };
  }, [open, safeDuration, vimeoId]);

  async function seekTo(seconds: number) {
    const nextTime = clamp(seconds, 0, safeDuration);
    const seekVersion = seekVersionRef.current + 1;
    seekVersionRef.current = seekVersion;
    setCurrentTime(nextTime);
    setMessage(null);

    try {
      const player = playerRef.current;

      if (!player) return;

      await player.setCurrentTime(nextTime);
      if (seekVersionRef.current !== seekVersion) return;

      await player.pause();
      if (seekVersionRef.current === seekVersion) {
        setCurrentTime(nextTime);
      }
    } catch {
      if (seekVersionRef.current === seekVersion) {
        setMessage("Não foi possível mover o player para esse ponto.");
      }
    }
  }

  function moveBy(step: number) {
    void seekTo(currentTime + step);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    moveBy(direction * (event.shiftKey ? 1 : FRAME_STEP));
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await createThumbnailAction(currentTime);
      setMessage(result.message);
      if (result.ok) {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        Adicionar miniatura
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[40rem]"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Adicionar miniatura</DialogTitle>
          <DialogDescription className="sr-only">
            Escolha um quadro do vídeo para criar uma nova miniatura.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="video" className="gap-3">
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="video">
              Selecionar a partir do vídeo
            </TabsTrigger>
            <TabsTrigger value="upload">Enviar imagem</TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="flex flex-col gap-3">
            <div className="relative grid aspect-video place-items-center overflow-hidden rounded-md bg-muted">
              {vimeoId ? (
                <iframe
                  ref={iframeRef}
                  src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0&controls=0&keyboard=0&autopause=0`}
                  title={title}
                  className="size-full"
                  allow="fullscreen; picture-in-picture"
                />
              ) : thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt=""
                  fill
                  sizes="40rem"
                  className="object-cover"
                />
              ) : (
                <IconPhoto aria-hidden="true" stroke={1.7} />
              )}
              <span className="absolute right-2 bottom-2 rounded-md bg-foreground/85 px-2 py-1 text-xs font-semibold text-background">
                {formatTimestamp(currentTime)} / {formatTimestamp(safeDuration)}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={safeDuration}
              step={FRAME_STEP}
              value={currentTime}
              onChange={(event) => void seekTo(Number(event.target.value))}
              aria-label="Tempo da miniatura"
              className="w-full accent-foreground"
            />

            <div className="relative overflow-x-auto rounded-md bg-muted">
              <div
                className="absolute inset-y-0 rounded-md ring-2 ring-primary"
                style={{
                  left: `${(currentTime / safeDuration) * 100}%`,
                  width: "3.5rem",
                  transform: "translateX(-50%)",
                }}
                aria-hidden="true"
              />
              <div
                className="grid h-12 min-w-full"
                style={{
                  gridTemplateColumns: `repeat(${timelineFrames.length}, minmax(3.5rem, 1fr))`,
                }}
              >
                {timelineFrames.map((frame) => (
                  <button
                    key={frame}
                    type="button"
                    className="relative min-w-0 overflow-hidden border-r bg-muted last:border-r-0"
                    onClick={() => void seekTo(frame)}
                    aria-label={`Ir para ${formatTimestamp(frame)}`}
                    title={formatTimestamp(frame)}
                  >
                    {activeThumbnailUrl ? (
                      <Image
                        src={activeThumbnailUrl}
                        alt=""
                        fill
                        sizes="6rem"
                        className="object-cover opacity-80"
                      />
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 bg-foreground/75 px-1 text-center text-[0.6rem] font-medium text-background">
                      {formatTimestamp(frame)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
              <p>Arraste para escolher um quadro.</p>
              <div className="grid gap-1">
                <ShortcutHint keys={["⇦", "⇨"]} label="passo de quadro" />
                <ShortcutHint
                  keys={["Shift", "+", "⇦", "⇨"]}
                  label="passo 1s"
                />
              </div>
            </div>

            {message ? (
              <p
                className={cn(
                  "text-sm",
                  message.includes("criada")
                    ? "text-muted-foreground"
                    : "text-destructive",
                )}
              >
                {message}
              </p>
            ) : null}
          </TabsContent>

          <TabsContent
            value="upload"
            className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/40 p-8 text-center"
          >
            <IconUpload aria-hidden="true" stroke={1.7} />
            <div className="flex flex-col gap-1">
              <p className="font-medium">Enviar imagem</p>
              <p className="max-w-sm text-muted-foreground">
                Esta opção fica preparada para a próxima etapa.
              </p>
            </div>
            <Button type="button" variant="outline" disabled>
              Selecionar arquivo
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!vimeoId || isPending}
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <span className="flex items-center gap-0.5">
        {keys.map((key, index) => (
          <kbd
            key={`${key}-${index}`}
            data-slot="kbd"
            className="inline-flex min-w-5 items-center justify-center rounded-sm border bg-background px-1 py-0.5 font-mono text-[0.75rem] leading-none text-foreground"
          >
            {key}
          </kbd>
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}

function parseDuration(value: string): number {
  const parts = value
    .split(":")
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));

  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];

  return Number.isFinite(parts[0]) ? parts[0] : 0;
}

function formatTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function buildTimelineFrames(duration: number): number[] {
  const safeDuration = Math.max(1, duration);
  const frames: number[] = [];

  for (let time = 0; time < safeDuration; time += TIMELINE_STEP) {
    frames.push(time);
  }

  const lastFrame = frames.at(-1);
  if (lastFrame == null || safeDuration - lastFrame > FRAME_STEP) {
    frames.push(safeDuration);
  }

  return frames;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
