import type { Metadata } from "next";
import Image from "next/image";
import {
  IconChartBar,
  IconClockHour4,
  IconEye,
  IconUsers,
  IconVideo,
} from "@tabler/icons-react";
import metricsEmptyDark from "@/public/illustrations/metrics-empty-dark.png";
import metricsEmptyLight from "@/public/illustrations/metrics-empty-light.png";
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

export const metadata: Metadata = { title: "Academia Studio" };

export default async function StudioPage() {
  await requireUser();

  return <main id="conteudo" tabIndex={-1} className="home-content flex flex-1 flex-col bg-soft outline-none">
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-5 py-6 sm:px-8 lg:py-10">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.82fr)]">
        <Card className="min-h-[29rem]">
          <CardHeader>
            <CardTitle>Ainda não temos métricas para mostrar</CardTitle>
            <CardDescription>Quando os vídeos tiverem dados consolidados, o resumo do desempenho aparece aqui.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <Image
              src={metricsEmptyLight}
              alt=""
              width={280}
              height={210}
              className="w-full max-w-72 object-contain dark:hidden"
              priority
            />
            <Image
              src={metricsEmptyDark}
              alt=""
              width={280}
              height={210}
              className="hidden w-full max-w-72 object-contain dark:block"
              priority
            />
            <div className="flex max-w-sm flex-col gap-2">
              <p className="text-base font-medium">Sem métricas por enquanto</p>
              <p className="text-sm text-muted-foreground">Assim que houver dados suficientes, este painel passa a exibir visualizações, tempo de exibição e desempenho dos conteúdos.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas do canal</CardTitle>
            <CardDescription>Resumo inicial da Academia Okajima.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inscritos atuais</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">0</p>
              </div>
              <div className="grid size-11 place-items-center rounded-full bg-muted">
                <IconUsers aria-hidden="true" stroke={1.8} />
              </div>
            </div>

            <Separator />

            <section className="flex flex-col gap-3" aria-labelledby="studio-summary-title">
              <div>
                <h2 id="studio-summary-title" className="font-semibold">Resumo</h2>
                <p className="text-sm text-muted-foreground">Últimos 28 dias</p>
              </div>
              <MetricRow icon={IconEye} label="Visualizações" value="0" />
              <MetricRow icon={IconClockHour4} label="Tempo de exibição" value="0,0 h" />
            </section>

            <Separator />

            <section className="flex flex-col gap-3" aria-labelledby="studio-main-content-title">
              <div>
                <h2 id="studio-main-content-title" className="font-semibold">Conteúdo principal</h2>
                <p className="text-sm text-muted-foreground">Últimas 48 horas · Visualizações</p>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <IconVideo aria-hidden="true" stroke={1.8} />
                <p className="text-sm text-muted-foreground">Nenhum vídeo publicado pelo Studio ainda.</p>
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

function MetricRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconEye;
  label: string;
  value: string;
}) {
  return <div className="flex items-center gap-3">
    <Icon aria-hidden="true" stroke={1.8} />
    <span className="min-w-0 flex-1 text-sm">{label}</span>
    <span className="text-sm font-semibold">{value}</span>
  </div>;
}
