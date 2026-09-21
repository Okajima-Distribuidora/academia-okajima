"use client";

import {
  IconCategory,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconPencil,
  IconPlus,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import { StudioPageHeader } from "@/components/studio/layout/studio-page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StudioCategory } from "@/lib/studio/categories/types";
import { cn } from "@/lib/utils";

const visibleSubcategoriesLimit = 5;
const numberFormatter = new Intl.NumberFormat("pt-BR");

type CategoryAction = (formData: FormData) => Promise<void>;
type PageDirection = "next" | "previous";

export function CategoriesManager({
  categories,
  createCategoryAction,
  createSubcategoryAction,
}: {
  categories: StudioCategory[];
  createCategoryAction: CategoryAction;
  createSubcategoryAction: CategoryAction;
}) {
  const subcategoriesCount = categories.reduce(
    (total, category) => total + category.subcategories.length,
    0,
  );

  return (
    <>
      <StudioPageHeader
        title="Categorias"
        description="Gerencie a estrutura de categorias, subcategorias e vínculos dos vídeos no Studio."
        actions={<CreateCategoryDialog action={createCategoryAction} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StudioSummaryCard label="Categorias" value={categories.length} />
        <StudioSummaryCard label="Subcategorias" value={subcategoriesCount} />
      </div>

      {categories.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              createSubcategoryAction={createSubcategoryAction}
            />
          ))}
        </div>
      ) : (
        <Empty className="min-h-48 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconCategory aria-hidden="true" stroke={1.8} />
            </EmptyMedia>
            <EmptyTitle>Nenhuma categoria cadastrada.</EmptyTitle>
            <EmptyDescription>
              Crie a primeira categoria para começar a organizar as
              subcategorias do catálogo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}

function CreateCategoryDialog({ action }: { action: CategoryAction }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="self-start">
            <IconPlus data-icon="inline-start" aria-hidden="true" />
            Nova categoria
          </Button>
        }
      />
      <DialogContent>
        <form action={action}>
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
            <DialogDescription>
              A categoria agrupa subcategorias; o vídeo será vinculado nas
              subcategorias.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-2">
            <div className="grid gap-4 sm:grid-cols-[minmax(12rem,1fr)_7rem]">
              <Field>
                <FieldLabel htmlFor="category-name">Nome</FieldLabel>
                <Input
                  id="category-name"
                  name="name"
                  maxLength={120}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="category-sort-order">Ordem</FieldLabel>
                <Input
                  id="category-sort-order"
                  name="sortOrder"
                  type="number"
                  inputMode="numeric"
                  defaultValue="0"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="category-description">Descrição</FieldLabel>
              <Textarea
                id="category-description"
                name="description"
                maxLength={500}
                rows={3}
              />
              <FieldDescription>
                Texto curto para orientar a organização interna do Studio.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit">
              <IconPlus data-icon="inline-start" aria-hidden="true" />
              Criar categoria
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StudioSummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {numberFormatter.format(value)}
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function CategoryCard({
  category,
  createSubcategoryAction,
}: {
  category: StudioCategory;
  createSubcategoryAction: CategoryAction;
}) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<PageDirection>("next");
  const pageCount = Math.max(
    1,
    Math.ceil(category.subcategories.length / visibleSubcategoriesLimit),
  );
  const visibleSubcategories = category.subcategories.slice(
    page * visibleSubcategoriesLimit,
    page * visibleSubcategoriesLimit + visibleSubcategoriesLimit,
  );
  const videosCount = category.subcategories.reduce(
    (total, subcategory) => total + subcategory.videosCount,
    0,
  );

  return (
    <Card className="h-[37rem]">
      <CardHeader className="gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <CardTitle className="truncate font-semibold uppercase">
              {category.name}
            </CardTitle>
            <Badge variant={category.isActive ? "secondary" : "outline"}>
              {category.isActive ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          <CardDescription className="truncate">
            {category.description ?? category.slug}
          </CardDescription>
        </div>
        <CardAction className="flex items-center gap-2">
          <Link
            href={`/studio/categorias/${category.id}`}
            className={buttonVariants({ variant: "outline" })}
            aria-label={`Editar categoria ${category.name}`}
          >
            <IconEye data-icon="inline-start" aria-hidden="true" />
            Visualizar
          </Link>
          <CreateSubcategoryDialog
            category={category}
            action={createSubcategoryAction}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-h-16 items-center rounded-lg bg-muted/50 px-3">
            <div className="min-w-0">
              <p className="text-base font-semibold">
                {numberFormatter.format(category.subcategories.length)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                subcategorias
              </p>
            </div>
          </div>
          <div className="flex min-h-16 items-center rounded-lg bg-muted/50 px-3">
            <div className="min-w-0">
              <p className="text-base font-semibold">
                {numberFormatter.format(videosCount)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                vídeos vinculados
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-6 items-center justify-between gap-3">
          <p className="text-sm font-medium">Subcategorias</p>
        </div>

        <section
          className="h-[17.5rem] shrink-0 overflow-hidden"
          aria-label="Subcategorias"
        >
          <div
            key={page}
            className={cn(
              "flex flex-col gap-2.5 duration-200 animate-in fade-in-0",
              direction === "next"
                ? "slide-in-from-right-8"
                : "slide-in-from-left-8",
            )}
          >
            {visibleSubcategories.length > 0 ? (
              visibleSubcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  className="flex min-h-12 min-w-0 items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {subcategory.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {subcategory.slug}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {numberFormatter.format(subcategory.videosCount)}{" "}
                    {subcategory.videosCount === 1 ? "vídeo" : "vídeos"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg bg-muted/50 px-4 text-center text-sm text-muted-foreground">
                Esta categoria ainda não tem subcategorias.
              </div>
            )}
          </div>
        </section>
      </CardContent>

      <CardFooter className="min-h-14 justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Página {page + 1} de {pageCount}
        </span>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page === 0}
            onClick={() => {
              setDirection("previous");
              setPage((current) => Math.max(0, current - 1));
            }}
          >
            <IconChevronLeft aria-hidden="true" />
            <span className="sr-only">Página anterior</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page >= pageCount - 1}
            onClick={() => {
              setDirection("next");
              setPage((current) => Math.min(pageCount - 1, current + 1));
            }}
          >
            <IconChevronRight aria-hidden="true" />
            <span className="sr-only">Próxima página</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function CreateSubcategoryDialog({
  category,
  action,
}: {
  category: StudioCategory;
  action: CategoryAction;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="sm">
            <IconPlus data-icon="inline-start" aria-hidden="true" />
            Subcategoria
          </Button>
        }
      />
      <DialogContent>
        <form action={action}>
          <input type="hidden" name="categoryId" value={category.id} />
          <DialogHeader>
            <DialogTitle>Nova subcategoria</DialogTitle>
            <DialogDescription>
              Criar subcategoria em {category.name}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor={`subcategory-${category.id}-name`}>
                Nome
              </FieldLabel>
              <Input
                id={`subcategory-${category.id}-name`}
                name="name"
                maxLength={120}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <Field>
                <FieldLabel htmlFor={`subcategory-${category.id}-description`}>
                  Descrição
                </FieldLabel>
                <Input
                  id={`subcategory-${category.id}-description`}
                  name="description"
                  maxLength={500}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`subcategory-${category.id}-sort-order`}>
                  Ordem
                </FieldLabel>
                <Input
                  id={`subcategory-${category.id}-sort-order`}
                  name="sortOrder"
                  type="number"
                  inputMode="numeric"
                  defaultValue="0"
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit">
              <IconPlus data-icon="inline-start" aria-hidden="true" />
              Criar subcategoria
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
