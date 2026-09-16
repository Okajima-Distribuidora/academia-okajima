import { IconArrowRight, IconCategory, IconVideo } from "@tabler/icons-react";
import Link from "next/link";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { HomeCategory } from "@/lib/home/catalog";
import { categoryHref } from "@/lib/home/navigation";

export function CategoryChooser({
  categories,
}: {
  categories: HomeCategory[];
}) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="category-chooser-page flex min-w-0 flex-1 flex-col gap-8 p-5 outline-none sm:p-8 lg:px-10"
    >
      <header className="flex max-w-4xl flex-col gap-4">
        <span className="category-videos-icon" aria-hidden="true">
          <IconCategory stroke={1.8} />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase text-primary">
            Categorias
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Escolha uma categoria
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Navegue pelos conteúdos da Academia Okajima a partir dos temas
            disponíveis.
          </p>
        </div>
      </header>

      {categories.length > 0 ? (
        <ul
          className="category-chooser-grid"
          aria-label="Categorias disponíveis"
        >
          {categories.map((category) => (
            <li key={category.id} className="min-w-0">
              <Link
                href={categoryHref(category)}
                className="category-chooser-link"
              >
                <Card size="sm" className="category-chooser-card h-full">
                  <CardHeader>
                    <CardTitle>{category.label}</CardTitle>
                    <CardDescription>
                      {category.description ?? "Ver vídeos desta categoria."}
                    </CardDescription>
                    <CardAction>
                      <IconArrowRight aria-hidden="true" />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm font-medium text-primary">
                      Abrir categoria
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="min-h-80 flex-none py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconVideo aria-hidden="true" stroke={1.6} />
            </EmptyMedia>
            <EmptyTitle>Nenhuma categoria disponível</EmptyTitle>
            <EmptyDescription>
              As categorias da academia serão exibidas aqui quando forem
              cadastradas.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  );
}
