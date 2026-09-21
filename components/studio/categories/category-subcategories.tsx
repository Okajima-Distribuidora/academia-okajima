import { IconTag } from "@tabler/icons-react";
import { VideoCarousel } from "@/components/home/video-carousel";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { listStudioCategoryVideos } from "@/lib/studio/categories/videos";

type Subcategories = Awaited<ReturnType<typeof listStudioCategoryVideos>>;

export function CategorySubcategories({
  subcategories,
  categorySlug,
}: {
  subcategories: Subcategories;
  categorySlug: string;
}) {
  return (
    <Tabs defaultValue="videos">
      <TabsList variant="line" aria-label="Tipo de conteúdo da categoria">
        <TabsTrigger value="videos">Vídeos</TabsTrigger>
        <TabsTrigger value="shorts">Shorts</TabsTrigger>
      </TabsList>
      {(["videos", "shorts"] as const).map((type) => (
        <TabsContent key={type} value={type} className="pt-4">
          <SubcategoryList
            subcategories={subcategories.map((subcategory) => ({
              ...subcategory,
              videos: subcategory.videos.filter(
                (video) => video.isShort === (type === "shorts"),
              ),
            }))}
            categorySlug={categorySlug}
            type={type}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function SubcategoryList({
  subcategories,
  categorySlug,
  type,
}: {
  subcategories: Subcategories;
  categorySlug: string;
  type: "videos" | "shorts";
}) {
  if (!subcategories.length)
    return (
      <Empty className="min-h-48 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconTag aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Nenhuma subcategoria cadastrada</EmptyTitle>
          <EmptyDescription>
            As subcategorias e seus vídeos aparecerão aqui quando forem
            cadastrados.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  return (
    <div className="studio-category-subcategories flex min-w-0 flex-col gap-8">
      {subcategories.map((subcategory) => (
        <div key={subcategory.id} className="flex min-w-0 flex-col gap-3">
          {!subcategory.isActive && (
            <Badge variant="outline">Subcategoria inativa</Badge>
          )}
          {subcategory.videos.length ? (
            <VideoCarousel
              headingId={`studio-subcategory-${subcategory.id}-${type}-title`}
              listId={`studio-subcategory-${subcategory.id}-${type}-list`}
              title={subcategory.name}
              videos={subcategory.videos}
              categorySlug={categorySlug}
              destination="studio"
            />
          ) : (
            <section
              aria-labelledby={`studio-subcategory-${subcategory.id}-${type}-title`}
            >
              <div className="home-recent-heading">
                <span className="home-recent-heading-icon" aria-hidden="true">
                  <IconTag stroke={1.8} />
                </span>
                <div className="home-recent-heading-copy">
                  <h2
                    id={`studio-subcategory-${subcategory.id}-${type}-title`}
                    className="home-recent-heading-title"
                  >
                    {subcategory.name}
                  </h2>
                </div>
              </div>
              <Empty className="mt-3 min-h-32 border">
                <EmptyHeader>
                  <EmptyTitle>
                    {type === "shorts"
                      ? "Nenhum Short vinculado"
                      : "Nenhum vídeo vinculado"}
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            </section>
          )}
        </div>
      ))}
    </div>
  );
}
