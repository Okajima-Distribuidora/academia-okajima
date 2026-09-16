import {
  IconBook2,
  IconCertificate,
  IconClipboardText,
  IconFileText,
  IconFolder,
  IconHeadset,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LibraryPage } from "@/lib/home/library";
import type { getHomeSection } from "@/lib/home/navigation";

const fallbackMaterials = [
  {
    title: "Materiais da academia",
    description:
      "Documentos e arquivos de apoio para acompanhar treinamentos e comunicados.",
    icon: IconFolder,
    label: "Base",
  },
  {
    title: "Guias comerciais",
    description:
      "Referencias rápidas para revisar processos, argumentos e boas práticas de atendimento.",
    icon: IconClipboardText,
    label: "Vendas",
  },
  {
    title: "Certificações",
    description:
      "Conteúdos de reforço para provas, trilhas internas e capacitações recorrentes.",
    icon: IconCertificate,
    label: "Trilhas",
  },
  {
    title: "Suporte",
    description:
      "Orientações para dúvidas operacionais e direcionamento dos canais de apoio.",
    icon: IconHeadset,
    label: "Ajuda",
  },
];

export function LibraryContent({
  section,
  pages,
}: {
  section: ReturnType<typeof getHomeSection>;
  pages: LibraryPage[];
}) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="home-content flex min-w-0 flex-1 flex-col gap-8 p-5 outline-none sm:p-8 lg:px-10"
    >
      <header className="flex max-w-4xl flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          Academia Okajima
        </Badge>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {section.label}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground wrap-anywhere">
            {section.description} Reunimos aqui documentos, guias e materiais de
            apoio para consulta rápida durante a rotina.
          </p>
        </div>
      </header>

      {pages.length > 0 ? (
        <section
          aria-labelledby="library-pages-title"
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-2">
            <IconBook2 aria-hidden="true" stroke={1.7} />
            <h2 id="library-pages-title" className="text-lg font-semibold">
              Materiais publicados
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => (
              <Card key={page.id} size="sm">
                <CardHeader>
                  <CardTitle>{page.title}</CardTitle>
                  <CardDescription>{page.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {page.excerpt}
                  </p>
                </CardContent>
                <CardFooter>
                  <Badge variant="outline">
                    {page.pageType === 1 ? "Completo" : "Conteúdo"}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="library-fallback-title"
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-2">
            <IconFileText aria-hidden="true" stroke={1.7} />
            <h2 id="library-fallback-title" className="text-lg font-semibold">
              Materiais em organização
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {fallbackMaterials.map((material) => {
              const Icon = material.icon;

              return (
                <Card key={material.title} size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon aria-hidden="true" stroke={1.7} />
                      {material.title}
                    </CardTitle>
                    <CardDescription>{material.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {material.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
