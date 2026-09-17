import { IconCircleCheck, IconClock, IconHistory } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminUserLearningMetrics } from "@/lib/admin/users";

export function UserLearningMetrics({
  metrics,
}: {
  metrics: AdminUserLearningMetrics;
}) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="learning-title">
      <div>
        <h2
          className="text-xl font-semibold tracking-tight"
          id="learning-title"
        >
          Metricas do consumo
        </h2>
        <p className="text-sm text-muted-foreground">
          Resumo do progresso e dos últimos vídeos assistidos.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          description="Soma do total do tempo assistido em todos os vídeos."
          icon={IconClock}
          label="Tempo assistido"
          value={formatTotalWatchTime(metrics.watchedSeconds)}
        />
        <MetricCard
          description="Vídeos em que o usuário assistiu por completo."
          icon={IconCircleCheck}
          label="Vídeos concluídos"
          value={new Intl.NumberFormat("pt-BR").format(metrics.completedVideos)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHistory aria-hidden="true" />
            Histórico recente
          </CardTitle>
          <CardDescription>Os 10 últimos vídeos acessados.</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentVideos.length ? (
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Vídeo</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última visualização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="max-w-80 truncate font-medium">
                      {video.title}
                    </TableCell>
                    <TableCell>
                      {formatProgressTime(video.furthestPositionSeconds)} -{" "}
                      {formatProgressTime(parseDuration(video.duration))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={video.completedAt ? "success" : "secondary"}
                      >
                        {video.completedAt ? "Concluído" : "Em andamento"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatLastWatchedAt(video.lastWatchedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum vídeo assistido ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function MetricCard({
  description,
  icon: Icon,
  label,
  value,
}: {
  description: string;
  icon: typeof IconClock;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Icon aria-hidden="true" stroke={1.8} />
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function formatTotalWatchTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatProgressTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function parseDuration(duration: string): number {
  const parts = duration.split(":").map((part) => Number.parseInt(part, 10));

  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

function formatLastWatchedAt(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
