import { buttonVariants } from "@/components/ui/button";
import type { HomeCategory } from "@/lib/home/catalog";
import { cn } from "@/lib/utils";

export function CategoryFilter({ categories }: { categories: HomeCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Categorias de vídeos"
      className="home-category-filter scroll-fade-x overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="home-category-track flex w-max gap-2">
        {categories.map((category) => (
          <a
            key={category.id}
            href={`#${category.anchorId}`}
            className={cn(
              buttonVariants({ variant: "secondary", size: "default" }),
              "home-category-link",
            )}
          >
            {category.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
