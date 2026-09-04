import "server-only";

import { z } from "zod";

const vimeoVideoSchema = z.object({
  name: z.string(),
  duration: z.number().nonnegative(),
  pictures: z.object({
    sizes: z.array(z.object({
      width: z.number().nonnegative(),
      height: z.number().nonnegative(),
      link: z.string().url(),
    })),
  }).nullable(),
});

export interface VimeoVideoPresentation {
  name: string;
  duration: number;
  thumbnailUrl: string | null;
}

function safeVimeoThumbnail(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "i.vimeocdn.com" || !url.pathname.startsWith("/video/")) {
      return null;
    }

    // The CDN serves the same image without its regional query string. Keeping
    // it out lets next/image enforce an exact remote pattern.
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export async function getVimeoVideoPresentation(videoId: string): Promise<VimeoVideoPresentation | null> {
  if (!/^\d{6,12}$/.test(videoId)) return null;

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch(
      `https://api.vimeo.com/videos/${videoId}?fields=name,duration,pictures.sizes`,
      {
        headers: {
          Accept: "application/vnd.vimeo.*+json;version=3.4",
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 60 * 60 },
      },
    );

    if (!response.ok) return null;

    const parsed = vimeoVideoSchema.safeParse(await response.json());
    if (!parsed.success) return null;

    const largestPicture = parsed.data.pictures?.sizes
      .toSorted((left, right) => right.width - left.width)[0];

    return {
      name: parsed.data.name,
      duration: parsed.data.duration,
      thumbnailUrl: largestPicture ? safeVimeoThumbnail(largestPicture.link) : null,
    };
  } catch {
    console.error("[academia-vimeo] video_metadata_unavailable");
    return null;
  }
}
