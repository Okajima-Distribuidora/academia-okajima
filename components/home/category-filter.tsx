import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { HomeCategory } from "@/lib/home/catalog";
import { cn } from "@/lib/utils";

export function CategoryFilter({
  categories,
  activeCategoryId,
}: {
  categories: HomeCategory[];
  activeCategoryId: string | null;
}) {
  const items = [{ id: null, label: "Tudo" }, ...categories];

  return (
    <nav aria-label="Categorias de vídeos" className="home-category-filter scroll-fade-x overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="home-category-track flex w-max gap-2">
        {items.map((category) => {
          const active = activeCategoryId === category.id;
          const href = category.id === null ? "/" : `/?categoria=${encodeURIComponent(category.id)}`;

          return (
            <Link
              key={category.id ?? "all"}
              href={href}
              aria-current={active ? "page" : undefined}
              data-active={active ? "" : undefined}
              className={cn(
                buttonVariants({ variant: active ? "inverse" : "secondary", size: "default" }),
                "home-category-link",
              )}
            >
              {category.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
