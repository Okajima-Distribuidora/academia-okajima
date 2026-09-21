import "server-only";

import { getPrisma } from "@/lib/db/prisma";
import { decodeLegacyText, presentRecentVideos } from "@/lib/home/catalog";

export async function listStudioCategoryVideos(category: {
  id: number;
  name: string;
  slug: string;
}) {
  const subcategories = await getPrisma().academy_subcategories.findMany({
    where: { category_id: category.id },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }, { id: "asc" }],
    include: {
      videos: {
        where: {
          video: {
            deleted_at: null,
            upload_status: { notIn: ["deleted", "cancelled"] },
          },
        },
        orderBy: [{ video: { time: "desc" } }, { video_id: "desc" }],
        select: {
          video: {
            select: {
              id: true,
              video_id: true,
              title: true,
              description: true,
              duration: true,
              vimeo: true,
              video_location: true,
              time: true,
              views: true,
              is_short: true,
            },
          },
        },
      },
    },
  });
  // Resolve presentation once per video, even when linked to several subcategories.
  const rows = [
    ...new Map(
      subcategories.flatMap((subcategory) =>
        subcategory.videos.map(({ video }) => [video.id, video] as const),
      ),
    ).values(),
  ];
  const videos = await presentRecentVideos(
    rows,
    new Map(
      rows.map((video) => [
        video.id,
        { label: decodeLegacyText(category.name), slug: category.slug },
      ]),
    ),
  );
  const byId = new Map(videos.map((video) => [video.id, video]));
  return subcategories.map((subcategory) => ({
    id: subcategory.id,
    name: decodeLegacyText(subcategory.name),
    isActive: subcategory.is_active,
    videos: subcategory.videos.flatMap(({ video }) => {
      const presented = byId.get(video.id);
      return presented ? [{ ...presented, isShort: video.is_short === 1 }] : [];
    }),
  }));
}
