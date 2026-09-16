import type { Metadata } from "next";
import Image from "next/image";
import {
  IconChartBar,
  IconChevronUp,
  IconClockHour4,
  IconHeart,
  IconEye,
  IconMessageCircle,
  IconVideo,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth/session";
import {
  formatStudioDecimal,
  formatStudioNumber,
  getStudioStats,
} from "@/lib/studio/stats";

export const metadata: Metadata = { title: "Academia Studio" };

export default async function StudioPage() {
  await requireUser();
  const stats = await getStudioStats();
  const latestVideoTitle =
    stats.latestVideo?.title ?? "Nenhum vídeo publicado pelo Studio ainda.";

  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="home-content flex flex-1 flex-col bg-soft outline-none"
    >
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-5 py-6 sm:px-8 lg:py-10">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(20rem,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho do último vídeo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                {stats.latestVideo?.thumbnailUrl ? (
                  <Image
                    src={stats.latestVideo.thumbnailUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 420px, calc(100vw - 2.5rem)"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="grid size-full place-items-center">
                    <IconVideo aria-hidden="true" stroke={1.8} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-white">
                    {latestVideoTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <IconChartBar aria-hidden="true" stroke={1.8} />
                  {formatStudioNumber(stats.latestVideo?.views ?? 0)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <IconMessageCircle aria-hidden="true" stroke={1.8} />
                  {formatStudioNumber(stats.latestVideo?.comments ?? 0)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <IconHeart aria-hidden="true" stroke={1.8} />
                  {formatStudioNumber(stats.latestVideo?.likes ?? 0)}
                </span>
                <IconChevronUp
                  className="ms-auto"
                  aria-hidden="true"
                  stroke={1.8}
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <StudioStatRow
                  icon={IconEye}
                  label="Visualizações"
                  value={formatStudioNumber(stats.latestVideo?.views ?? 0)}
                />
                <StudioStatRow
                  icon={IconHeart}
                  label="Curtidas"
                  value={formatStudioNumber(stats.latestVideo?.likes ?? 0)}
                />
                <StudioStatRow
                  icon={IconMessageCircle}
                  label="Comentários"
                  value={formatStudioNumber(stats.latestVideo?.comments ?? 0)}
                />
                <StudioStatRow
                  icon={IconClockHour4}
                  label="Duração média de visualização"
                  value={`${formatStudioDecimal(stats.latestVideo?.averageViewMinutes ?? 0)} min`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas do Studio</CardTitle>
              <CardDescription>
                Resumo geral dos conteúdos publicados.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <StudioStatRow
                  icon={IconEye}
                  label="Visualizações"
                  value={formatStudioNumber(stats.summary.views)}
                />
                <StudioStatRow
                  icon={IconClockHour4}
                  label="Tempo de exibição (horas)"
                  value={formatStudioDecimal(stats.summary.watchHours)}
                />
                <StudioStatRow
                  icon={IconVideo}
                  label="Total de vídeos postados"
                  value={formatStudioNumber(stats.summary.totalVideos)}
                />
              </div>

              <Separator />

              <section
                className="flex flex-col gap-3"
                aria-labelledby="studio-top-videos-title"
              >
                <div>
                  <h2 id="studio-top-videos-title" className="font-semibold">
                    Top vídeos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    5 conteúdos com mais visualizações
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {stats.summary.topVideos.length > 0 ? (
                    stats.summary.topVideos.map((video, index) => (
                      <StudioContentRow
                        key={video.id}
                        index={index + 1}
                        thumbnailUrl={video.thumbnailUrl}
                        title={video.title}
                        value={formatStudioNumber(video.views)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum vídeo publicado pelo Studio ainda.
                    </p>
                  )}
                </div>
              </section>

              <Button variant="secondary" className="self-start">
                <IconChartBar data-icon="inline-start" aria-hidden="true" />
                Ver estatísticas do canal
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function StudioStatRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof IconEye;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-sm">
      {Icon ? (
        <Icon
          className="shrink-0 text-muted-foreground"
          aria-hidden="true"
          stroke={1.8}
        />
      ) : null}
      <span className="min-w-0 flex-1 text-muted-foreground">{label}</span>
      <span className="shrink-0 font-semibold">{value}</span>
    </div>
  );
}

function StudioContentRow({
  index,
  thumbnailUrl,
  title,
  value,
}: {
  index: number;
  thumbnailUrl: string | null;
  title: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-sm">
      <span className="w-[1.125rem] shrink-0 text-center text-xs font-semibold text-muted-foreground">
        {index}
      </span>
      <span className="relative block h-8 w-14 shrink-0 overflow-hidden rounded bg-muted">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt=""
            width={56}
            height={32}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center">
            <IconVideo aria-hidden="true" stroke={1.8} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <span className="shrink-0 font-semibold">{value}</span>
    </div>
  );
}
