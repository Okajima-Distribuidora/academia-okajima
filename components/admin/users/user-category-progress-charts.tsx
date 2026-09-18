"use client";

import { Label, Pie, PieChart, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { AdminUserCategoryProgress } from "@/lib/admin/users";

const categoryProgressChartConfig = {
  completed: {
    label: "Concluído",
    color: "var(--primary)",
  },
  remaining: {
    label: "Restante",
    color: "var(--muted)",
  },
} satisfies ChartConfig;

export function UserCategoryProgressCharts({
  categories,
}: {
  categories: AdminUserCategoryProgress[];
}) {
  if (!categories.length) return null;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="categories-title">
      <div>
        <h2
          className="text-xl font-semibold tracking-tight"
          id="categories-title"
        >
          Progresso por categoria
        </h2>
        <p className="text-sm text-muted-foreground">
          Percentual de vídeos concluídos em cada categoria.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <CategoryProgressChart category={category} key={category.id} />
        ))}
      </div>
    </section>
  );
}

function CategoryProgressChart({
  category,
}: {
  category: AdminUserCategoryProgress;
}) {
  const chartData = [
    {
      name: "Concluído",
      value: category.percentage,
      fill: "var(--color-completed)",
    },
    {
      name: "Restante",
      value: Math.max(0, 100 - category.percentage),
      fill: "var(--color-remaining)",
    },
  ];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="truncate">{category.name}</CardTitle>
        <CardDescription>
          {category.completedVideos} de {category.totalVideos} vídeos concluídos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ChartContainer
            className="h-40 w-full aspect-auto"
            config={categoryProgressChartConfig}
          >
            <PieChart accessibilityLayer>
              <Tooltip
                content={({ active }) =>
                  active ? (
                    <div className="border bg-background px-3 py-2 text-sm shadow-sm">
                      {category.percentage}% concluído
                    </div>
                  ) : null
                }
              />
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={48}
                outerRadius={64}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                <Label value={`${category.percentage}%`} position="center" />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
