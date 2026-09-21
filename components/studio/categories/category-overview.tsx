"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
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
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import type {
  StudioCategoryDetails,
  StudioCategoryStats,
} from "@/lib/studio/categories/types";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone: "America/Sao_Paulo",
});
const formatDate = (date: string) =>
  dateFormatter.format(new Date(`${date}T12:00:00Z`));
const chartConfig = {
  views: { label: "Visualizações", color: "var(--primary)" },
};

export function CategoryOverview({
  category,
  stats,
  children,
}: {
  category: StudioCategoryDetails;
  stats: StudioCategoryStats;
  children?: ReactNode;
}) {
  const metrics = [
    { label: "Visualizações", value: numberFormatter.format(stats.views) },
    {
      label: "Tempo de exibição",
      value:
        stats.watchHours === null
          ? "—"
          : `${stats.watchHours.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`,
    },
    {
      label: "Quantidade de vídeos",
      value: numberFormatter.format(stats.totalVideos),
    },
  ];
  const ticks = stats.viewHistory
    .filter(
      (_, index, history) =>
        index === 0 || index === history.length - 1 || index % 5 === 0,
    )
    .map((entry) => entry.date);

  return (
    <StudioPageFrame>
      <StudioPageHeader
        title={category.name}
        description="Acompanhe o desempenho dos vídeos de todas as subcategorias."
        actions={
          <Link
            href="/studio/categorias"
            className={buttonVariants({ variant: "outline" })}
          >
            <IconArrowLeft data-icon="inline-start" aria-hidden="true" />
            Voltar às categorias
          </Link>
        }
      />
      <Card className="pt-0">
        <dl className="grid grid-cols-3 border-b border-border">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 border-r border-border px-2 py-5 text-center last:border-r-0 sm:px-3",
                index === 0 && "bg-secondary",
              )}
            >
              <dt className="text-xs text-muted-foreground sm:text-sm">
                {metric.label}
              </dt>
              <dd className="text-xl font-semibold tabular-nums">
                {metric.value}
              </dd>
              {index === 1 && stats.watchHours === null && (
                <span className="text-xs text-muted-foreground">
                  Ainda indisponível
                </span>
              )}
            </div>
          ))}
        </dl>
        <CardContent className="flex flex-col gap-3">
          <div>
            <CardTitle>Visualizações</CardTitle>
            <CardDescription>
              Últimos 28 dias · Vídeos publicados de todas as subcategorias
            </CardDescription>
          </div>
          <ChartContainer
            config={chartConfig}
            className="h-56 w-full aspect-auto"
            aria-label="Visualizações diárias da categoria nos últimos 28 dias"
          >
            <LineChart
              accessibilityLayer
              data={stats.viewHistory}
              margin={{ left: 0, right: 8, top: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                ticks={ticks}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={formatDate}
              />
              <YAxis
                orientation="right"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as
                    | { date: string; views: number }
                    | undefined;
                  if (!active || !point) return null;
                  return (
                    <div className="grid gap-1 border bg-background px-3 py-2 text-sm shadow-sm">
                      <span className="text-muted-foreground">
                        {formatDate(point.date)}
                      </span>
                      <span className="font-medium">
                        Visualizações: {numberFormatter.format(point.views)}
                      </span>
                    </div>
                  );
                }}
              />
              <Line
                dataKey="views"
                type="linear"
                stroke="var(--color-views)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
          <p className="text-xs text-muted-foreground">
            Os indicadores acima mostram o total acumulado dos vídeos publicados
            da categoria. O tempo de exibição considera apenas o período após o
            início da medição.
          </p>
        </CardContent>
      </Card>
      {children}
    </StudioPageFrame>
  );
}
