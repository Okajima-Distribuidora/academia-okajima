import type { Metadata } from "next";
import {
  IconChartBar,
  IconClockHour4,
  IconHeart,
  IconEye,
  IconMessageCircle,
  IconPlayerPlay,
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
import { formatStudioDecimal, formatStudioNumber, getStudioStats } from "@/lib/studio/stats";

export const metadata: Metadata = { title: "Academia Studio" };

export default async function StudioPage() {
  await requireUser();
  const stats = await getStudioStats();

  return <main id="conteudo" tabIndex={-1} className="home-content flex flex-1 flex-col bg-soft outline-none">
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-5 py-6 sm:px-8 lg:py-10">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.82fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho do último vídeo</CardTitle>
            <CardDescription className="truncate">
              {stats.latestVideo?.title ?? "Nenhum vídeo publicado pelo Studio ainda."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <StudioMetricCard
                icon={IconEye}
                label="Visualizações"
                value={formatStudioNumber(stats.latestVideo?.views ?? 0)}
              />
              <StudioMetricCard
                icon={IconHeart}
                label="Curtidas"
                value={formatStudioNumber(stats.latestVideo?.likes ?? 0)}
              />
              <StudioMetricCard
                icon={IconMessageCircle}
                label="Comentários"
                value={formatStudioNumber(stats.latestVideo?.comments ?? 0)}
              />
              <StudioMetricCard
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
            <CardDescription>Resumo geral dos conteúdos publicados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <StudioMetricCard
                icon={IconEye}
                label="Visualizações"
                value={formatStudioNumber(stats.summary.views)}
              />
              <StudioMetricCard
                icon={IconClockHour4}
                label="Tempo de exibição"
                value={`${formatStudioDecimal(stats.summary.watchHours)} h`}
              />
              <StudioMetricCard
                icon={IconVideo}
                label="Vídeos postados"
                value={formatStudioNumber(stats.summary.totalVideos)}
              />
            </div>

            <Separator />

            <section className="flex flex-col gap-3" aria-labelledby="studio-most-viewed-title">
              <div>
                <h2 id="studio-most-viewed-title" className="font-semibold">Vídeo mais visto</h2>
                <p className="text-sm text-muted-foreground">Conteúdo com maior número de visualizações</p>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <IconPlayerPlay aria-hidden="true" stroke={1.8} />
                <p className="min-w-0 truncate text-sm font-medium">
                  {stats.summary.mostViewedVideoTitle ?? "Nenhum vídeo publicado pelo Studio ainda."}
                </p>
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
  </main>;
}

function StudioMetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconEye;
  label: string;
  value: string;
}) {
  return <div className="flex min-w-0 items-start gap-3 rounded-lg bg-muted p-3">
    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-background">
      <Icon aria-hidden="true" stroke={1.8} />
    </div>
    <div className="min-w-0">
      <p className="truncate text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  </div>;
}
