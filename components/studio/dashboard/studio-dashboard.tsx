"use client";

import {
  IconClockHour4,
  IconEye,
  IconMessageCircle,
  IconThumbUp,
  IconVideo,
} from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StudioPageFrame } from "@/components/studio/layout/studio-page-frame";
import { StudioPageHeader } from "@/components/studio/layout/studio-page-header";
import { StudioVideoUploadButton } from "@/components/studio/uploads/video-upload-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type StudioStats = {
  latestVideo: {
    title: string;
    views: number;
    likes: number;
    comments: number;
    averageViewMinutes: number;
    thumbnailUrl: string | null;
  } | null;
  summary: {
    views: number;
    watchHours: number;
    totalVideos: number;
    viewHistory: Array<{
      date: string;
      views: number;
    }>;
    publishedVideoHistory: Array<{
      date: string;
      rangeLabel: string;
      videos: number;
    }>;
    topVideos: Array<{
      id: number;
      title: string;
      views: number;
      thumbnailUrl: string | null;
    }>;
  };
};

export function StudioDashboard({ stats }: { stats: StudioStats }) {
  return (
    <StudioPageFrame>
      <StudioPageHeader
        title="Dashboard"
        description="Acompanhe o desempenho dos vídeos da Academia em grupos de indicadores."
        actions={<StudioVideoUploadButton />}
      />

      <Tabs defaultValue="overview">
        <TabsList variant="line" aria-label="Categorias de métricas">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="reach">Alcance</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="retention">Retenção</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <OverviewMetricChart stats={stats} />

          <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Último vídeo publicado</CardTitle>
                <CardDescription>
                  Indicadores do desempenho do vídeo mais recente publicado pela
                  Academia.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <LatestVideo stats={stats} />
              </CardContent>
            </Card>
            <TopVideos stats={stats} />
          </div>
        </TabsContent>

        <TabsContent value="reach" className="pt-4">
          <DashboardGroup
            icon={IconEye}
            title="Alcance"
            description="Esta área reunirá a evolução de visualizações, espectadores únicos, fontes de tráfego e dispositivos de acesso."
          />
        </TabsContent>

        <TabsContent value="engagement" className="pt-4">
          <DashboardGroup
            icon={IconThumbUp}
            title="Engajamento"
            description="Esta área reunirá curtidas, comentários, compartilhamentos e a taxa de interação por vídeo."
          />
        </TabsContent>

        <TabsContent value="retention" className="pt-4">
          <DashboardGroup
            icon={IconClockHour4}
            title="Retenção"
            description="Esta área reunirá tempo médio assistido, taxa de conclusão e gráficos de retenção ao longo de cada vídeo."
          />
        </TabsContent>

        <TabsContent value="content" className="pt-4">
          <DashboardGroup
            icon={IconVideo}
            title="Conteúdo"
            description="Esta área reunirá frequência de publicação, desempenho por formato, categoria e comparativos entre vídeos."
          />
        </TabsContent>
      </Tabs>
    </StudioPageFrame>
  );
}

type OverviewMetric = "views" | "watchHours" | "videos";

type OverviewChartPoint = {
  date: string;
  tooltipDay: string;
  metric: number;
};

const overviewChartConfig = {
  metric: {
    label: "Métrica",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const chartDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

function OverviewMetricChart({ stats }: { stats: StudioStats }) {
  const [metric, setMetric] = useState<OverviewMetric>("views");
  const metrics = {
    views: {
      label: "Visualizações",
      value: formatStudioNumber(stats.summary.views),
      description: "Total de todos os vídeos publicados",
      chartValue: stats.summary.views,
    },
    watchHours: {
      label: "Tempo de exibição",
      value: `${formatStudioDecimal(stats.summary.watchHours)} h`,
      description: "Tempo total assistido",
      chartValue: stats.summary.watchHours,
    },
    videos: {
      label: "Vídeos publicados",
      value: formatStudioNumber(stats.summary.totalVideos),
      description: "Publicações em períodos de cinco dias",
      chartValue: stats.summary.totalVideos,
    },
  } satisfies Record<
    OverviewMetric,
    { label: string; value: string; description: string; chartValue: number }
  >;
  const activeMetric = metrics[metric];
  const chartData: OverviewChartPoint[] =
    metric === "videos"
      ? stats.summary.publishedVideoHistory.map((entry) => ({
          date: entry.date,
          tooltipDay: entry.rangeLabel,
          metric: entry.videos,
        }))
      : stats.summary.viewHistory.map((entry, index, history) => {
          const formattedDay = chartDateFormatter.format(
            new Date(`${entry.date}T12:00:00Z`),
          );

          return {
            date: entry.date,
            tooltipDay: formattedDay,
            metric:
              metric === "views"
                ? entry.views
                : index === history.length - 1
                  ? activeMetric.chartValue
                  : 0,
          };
        });
  const axisTickDates = chartData
    .filter(
      (_, index, history) =>
        index === 0 ||
        index === history.length - 1 ||
        index % (metric === "videos" ? 4 : 5) === 0,
    )
    .map((entry) => entry.date);

  return (
    <Card>
      <ToggleGroup
        value={[metric]}
        onValueChange={(values) => {
          const nextMetric = values[0];
          if (nextMetric) setMetric(nextMetric as OverviewMetric);
        }}
        spacing={0}
        aria-label="Métrica exibida no gráfico"
        className="grid w-full grid-cols-3 border-b border-border"
      >
        {(
          Object.entries(metrics) as Array<
            [OverviewMetric, (typeof metrics)[OverviewMetric]]
          >
        ).map(([key, item]) => (
          <ToggleGroupItem
            key={key}
            value={key}
            className="h-auto min-w-0 cursor-pointer flex-col items-center gap-1 rounded-none border-r border-border px-3 py-5 text-center last:border-r-0 aria-pressed:bg-secondary aria-pressed:text-foreground aria-pressed:hover:bg-secondary"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-xl font-semibold tabular-nums">
              {item.value}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div>
            <CardTitle>{activeMetric.label}</CardTitle>
            <CardDescription>{activeMetric.description}</CardDescription>
          </div>
          <ChartContainer
            config={overviewChartConfig}
            className="h-56 w-full aspect-auto"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 0, right: 8, top: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                ticks={axisTickDates}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) =>
                  chartDateFormatter.format(new Date(`${value}T12:00:00Z`))
                }
              />
              <YAxis
                orientation="right"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                allowDecimals={metric === "watchHours"}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as
                    | OverviewChartPoint
                    | undefined;
                  if (!active || !point) return null;

                  return (
                    <div className="grid gap-1 border bg-background px-3 py-2 text-sm shadow-sm">
                      <span className="text-muted-foreground">
                        {point.tooltipDay}
                      </span>
                      <span className="font-medium">
                        {activeMetric.label}:{" "}
                        {formatOverviewMetricValue(metric, point.metric)}
                      </span>
                    </div>
                  );
                }}
              />
              <Line
                dataKey="metric"
                type="linear"
                stroke="var(--color-metric)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function LatestVideo({ stats }: { stats: StudioStats }) {
  const video = stats.latestVideo;

  if (!video) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum vídeo publicado pela Academia ainda.
      </p>
    );
  }

  return (
    <>
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            loading="eager"
            sizes="(min-width: 1280px) 520px, calc(100vw - 2.5rem)"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <IconVideo aria-hidden="true" stroke={1.8} />
          </div>
        )}
      </div>
      <p className="font-medium">{video.title}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <VideoMetric
          icon={IconEye}
          label="Visualizações"
          value={formatStudioNumber(video.views)}
        />
        <VideoMetric
          icon={IconThumbUp}
          label="Curtidas"
          value={formatStudioNumber(video.likes)}
        />
        <VideoMetric
          icon={IconMessageCircle}
          label="Comentários"
          value={formatStudioNumber(video.comments)}
        />
      </div>
    </>
  );
}

function TopVideos({ stats }: { stats: StudioStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vídeos com mais visualizações</CardTitle>
        <CardDescription>
          Rank dos vídeos publicados pela Academia com maior número de
          visualizações.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {stats.summary.topVideos.length > 0 ? (
          stats.summary.topVideos.map((video, index) => (
            <VideoRow
              key={video.id}
              index={index + 1}
              thumbnailUrl={video.thumbnailUrl}
              title={video.title}
              views={formatStudioNumber(video.views)}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum vídeo publicado pela Academia ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function VideoMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconEye;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="text-muted-foreground" aria-hidden="true" stroke={1.8} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}

function DashboardGroup({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof IconEye;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Dados em preparação</EmptyTitle>
            <EmptyDescription>
              A estrutura desta categoria está pronta para receber os
              indicadores e gráficos quando a fonte analítica estiver
              disponível.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}

function VideoRow({
  index,
  thumbnailUrl,
  title,
  views,
}: {
  index: number;
  thumbnailUrl: string | null;
  title: string;
  views: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-sm">
      <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
        {index}
      </span>
      <span className="relative block h-9 w-16 shrink-0 overflow-hidden rounded bg-muted">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            sizes="4rem"
            loading="eager"
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center">
            <IconVideo aria-hidden="true" stroke={1.8} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <span className="shrink-0 font-medium">{views}</span>
    </div>
  );
}

function formatStudioNumber(value: number): string {
  const safeValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return new Intl.NumberFormat("pt-BR").format(safeValue);
}

function formatStudioDecimal(value: number): string {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(safeValue);
}

function formatOverviewMetricValue(metric: OverviewMetric, value: number) {
  return metric === "watchHours"
    ? `${formatStudioDecimal(value)} h`
    : formatStudioNumber(value);
}
