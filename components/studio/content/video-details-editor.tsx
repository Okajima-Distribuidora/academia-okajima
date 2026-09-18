"use client";

import {
  IconArrowLeft,
  IconCopy,
  IconEye,
  IconMessageCircle,
  IconPhoto,
  IconThumbUp,
  IconVideo,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { VideoEditorSidebarState } from "@/components/studio/content/video-editor-sidebar-state";
import { VideoThumbnailDialog } from "@/components/studio/content/video-thumbnail-dialog";
import { VideoWarningIcons } from "@/components/studio/content/video-warning-icons";
import { StudioPageHeader } from "@/components/studio/layout/studio-page-header";
import { useStudioSidebarState } from "@/components/studio/layout/studio-sidebar-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { StudioVideoDetails } from "@/lib/studio/content";

type UpdateVideoAction = (formData: FormData) => Promise<void>;
type CreateThumbnailAction = (
  seconds: number,
) => Promise<{ ok: true; message: string } | { ok: false; message: string }>;

const studioNumberFormatter = new Intl.NumberFormat("pt-BR");

function formatStudioNumber(value: number) {
  return studioNumberFormatter.format(Math.max(0, value));
}

export function VideoDetailsEditor({
  video,
  initialSection,
  updateVideoAction,
  createThumbnailAction,
}: {
  video: StudioVideoDetails;
  initialSection: "details" | "comments";
  updateVideoAction: UpdateVideoAction;
  createThumbnailAction: CreateThumbnailAction;
}) {
  const { activeEditorSection } = useStudioSidebarState();

  return (
    <div className="flex min-h-full min-w-0 flex-1 bg-background">
      <VideoEditorSidebarState
        initialSection={initialSection}
        title={video.title}
        duration={video.duration}
        vimeoId={video.vimeoId}
        thumbnailUrl={video.thumbnailUrl}
      />
      {activeEditorSection === "comments" ? (
        <VideoCommentsSection video={video} />
      ) : (
        <form
          action={updateVideoAction}
          className="flex min-w-0 flex-1 flex-col"
        >
          <header className="sticky top-0 flex min-h-24 items-start justify-between gap-4 border-b bg-background/95 px-5 pt-5 pb-4 backdrop-blur sm:px-8 sm:pt-8 lg:px-10 lg:pt-10">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                nativeButton={false}
                render={<Link href="/studio/conteudo" />}
                aria-label="Voltar para conteúdo"
              >
                <IconArrowLeft aria-hidden="true" />
              </Button>
              <StudioPageHeader
                title="Detalhes do vídeo"
                description={`Editando: ${video.title}`}
              />
            </div>
            <Button type="submit" className="shrink-0">
              Salvar
            </Button>
          </header>

          <div className="grid min-w-0 flex-1 gap-8 px-5 py-5 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-10 lg:py-10">
            <section className="min-w-0">
              <FieldGroup className="gap-6">
                <Field>
                  <FieldLabel htmlFor="video-title">
                    Título (obrigatório)
                  </FieldLabel>
                  <Input
                    id="video-title"
                    name="title"
                    maxLength={100}
                    defaultValue={video.title}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="video-description">Descrição</FieldLabel>
                  <Textarea
                    id="video-description"
                    name="description"
                    rows={9}
                    defaultValue={video.description}
                    placeholder="Adicione uma descrição para o vídeo"
                    className="min-h-56"
                  />
                </Field>

                <FieldSet>
                  <FieldLegend>Privacidade</FieldLegend>
                  <RadioGroup
                    key={video.privacy}
                    name="privacy"
                    defaultValue={String(video.privacy)}
                    className="gap-3"
                  >
                    <Field orientation="horizontal">
                      <RadioGroupItem value="0" id="privacy-public" />
                      <FieldLabel
                        htmlFor="privacy-public"
                        className="font-medium"
                      >
                        Público
                      </FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="1" id="privacy-private" />
                      <FieldLabel
                        htmlFor="privacy-private"
                        className="font-medium"
                      >
                        Privado
                      </FieldLabel>
                    </Field>
                  </RadioGroup>
                </FieldSet>

                <section className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Miniatura</h2>
                    <p className="text-sm text-muted-foreground">
                      Escolha uma imagem a partir do vídeo.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="relative grid aspect-video w-full max-w-72 place-items-center overflow-hidden rounded-md border bg-muted">
                      {video.thumbnailUrl ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt=""
                          fill
                          sizes="18rem"
                          loading="eager"
                          className="object-cover"
                        />
                      ) : (
                        <IconPhoto aria-hidden="true" stroke={1.7} />
                      )}
                    </div>
                    <VideoThumbnailDialog
                      title={video.title}
                      duration={video.duration}
                      vimeoId={video.vimeoId}
                      thumbnailUrl={video.thumbnailUrl}
                      thumbnails={video.thumbnails}
                      createThumbnailAction={createThumbnailAction}
                    />
                  </div>
                </section>
              </FieldGroup>
            </section>

            <aside className="flex min-w-0 flex-col gap-5">
              <section className="overflow-hidden rounded-lg border bg-card">
                <div className="relative grid aspect-video place-items-center bg-muted">
                  {video.vimeoId ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${video.vimeoId}?title=0&byline=0&portrait=0`}
                      title={video.title}
                      className="size-full"
                      allow="fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt=""
                      fill
                      loading="eager"
                      sizes="22rem"
                      className="object-cover"
                    />
                  ) : (
                    <IconVideo aria-hidden="true" stroke={1.7} />
                  )}
                </div>
                <div className="flex flex-col gap-4 p-4">
                  <InfoBlock
                    label="Link do vídeo"
                    value={`/studio/conteudo/${video.publicId}`}
                    actionIcon
                  />
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <InfoMetric
                      icon={IconEye}
                      label="Views"
                      value={formatStudioNumber(video.views)}
                    />
                    <InfoMetric
                      icon={IconMessageCircle}
                      label="Comentários"
                      value={formatStudioNumber(video.comments)}
                    />
                    <InfoMetric
                      icon={IconThumbUp}
                      label="Likes"
                      value={formatStudioNumber(video.likes)}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border p-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  Avisos
                </p>
                <div className="mt-3">
                  <VideoWarningIcons warnings={video.warnings} />
                </div>
              </section>

              <section className="rounded-lg border p-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  Visibilidade
                </p>
                <p className="mt-2 text-base font-semibold">
                  {video.visibilityLabel}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {video.statusLabel}
                </p>
              </section>
            </aside>
          </div>
        </form>
      )}
    </div>
  );
}

function VideoCommentsSection({ video }: { video: StudioVideoDetails }) {
  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 flex min-h-24 items-start gap-4 border-b bg-background/95 px-5 pt-5 pb-4 backdrop-blur sm:px-8 sm:pt-8 lg:px-10 lg:pt-10">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          nativeButton={false}
          render={<Link href="/studio/conteudo" />}
          aria-label="Voltar para conteúdo"
        >
          <IconArrowLeft aria-hidden="true" />
        </Button>
        <StudioPageHeader
          title="Comentários"
          description={`${formatStudioNumber(video.comments)} ${video.comments === 1 ? "comentário" : "comentários"} em ${video.title}`}
        />
      </header>

      <section className="flex w-full max-w-4xl flex-col gap-5 px-5 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        {video.commentsList.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Exibindo os 20 comentários mais recentes.
            </p>
            <ul className="flex flex-col divide-y" aria-label="Comentários">
              {video.commentsList.map((comment) => (
                <li key={comment.id} className="flex gap-4 py-5 first:pt-0">
                  <Avatar>
                    <AvatarFallback>{comment.authorInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{comment.authorName}</p>
                      <span className="text-xs text-muted-foreground">
                        {comment.publishedLabel}
                      </span>
                    </div>
                    <p className="text-sm leading-6 whitespace-pre-wrap">
                      {comment.text}
                    </p>
                    <Badge variant="secondary" className="self-start">
                      {comment.likesLabel}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconMessageCircle aria-hidden="true" stroke={1.7} />
              </EmptyMedia>
              <EmptyTitle>Nenhum comentário</EmptyTitle>
              <EmptyDescription>
                Os comentários publicados neste vídeo aparecerão aqui.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </main>
  );
}

function InfoBlock({
  label,
  value,
  actionIcon = false,
}: {
  label: string;
  value: string;
  actionIcon?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        <p className="truncate text-sm font-medium">{value}</p>
        {actionIcon ? (
          <IconCopy
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        ) : null}
      </div>
    </div>
  );
}

function InfoMetric({
  icon: Icon,
  value,
}: {
  icon: typeof IconEye;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md bg-muted/60 px-2 py-2">
      <Icon
        aria-hidden="true"
        stroke={1.7}
        className="shrink-0 text-muted-foreground"
      />
      <p className="truncate font-semibold">{value}</p>
    </div>
  );
}
