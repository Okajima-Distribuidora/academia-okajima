import "server-only";

import { z } from "zod";

const vimeoPictureSizeSchema = z.object({
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  link: z.string().url(),
});

const vimeoVideoSchema = z.object({
  name: z.string(),
  duration: z.number().nonnegative(),
  pictures: z
    .object({
      sizes: z.array(vimeoPictureSizeSchema),
    })
    .nullable(),
});

const vimeoPictureSchema = z.object({
  uri: z.string(),
  active: z.boolean(),
  type: z.string().nullable().optional(),
  sizes: z.array(vimeoPictureSizeSchema),
});

const vimeoPicturesSchema = z.object({
  data: z.array(vimeoPictureSchema),
});

export interface VimeoVideoPresentation {
  name: string;
  duration: number;
  thumbnailUrl: string | null;
  mobileThumbnailUrl: string | null;
}

export interface VimeoVideoThumbnail {
  uri: string;
  active: boolean;
  type: string | null;
  thumbnailUrl: string | null;
}

function safeVimeoThumbnail(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "i.vimeocdn.com" ||
      !url.pathname.startsWith("/video/")
    ) {
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

type VimeoPictureSize = z.infer<typeof vimeoPictureSizeSchema>;

function selectLargestPicture(
  sizes: readonly VimeoPictureSize[],
): VimeoPictureSize | undefined {
  return [...sizes].sort((left, right) => right.width - left.width)[0];
}

export async function getVimeoVideoPresentation(
  videoId: string,
): Promise<VimeoVideoPresentation | null> {
  return fetchVimeoVideoPresentation(videoId, false);
}

export async function refreshVimeoVideoPresentation(
  videoId: string,
): Promise<VimeoVideoPresentation | null> {
  return fetchVimeoVideoPresentation(videoId, true);
}

async function fetchVimeoVideoPresentation(
  videoId: string,
  refresh: boolean,
): Promise<VimeoVideoPresentation | null> {
  if (!/^\d{6,12}$/.test(videoId)) return null;

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch(
      `https://api.vimeo.com/videos/${videoId}?fields=name,duration,pictures.sizes`,
      refresh
        ? {
            headers: {
              Accept: "application/vnd.vimeo.*+json;version=3.4",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        : {
            headers: {
              Accept: "application/vnd.vimeo.*+json;version=3.4",
              Authorization: `Bearer ${token}`,
            },
            next: {
              revalidate: 60 * 60,
              tags: [`vimeo-video:${videoId}`],
            },
          },
    );

    if (!response.ok) return null;

    const parsed = vimeoVideoSchema.safeParse(await response.json());
    if (!parsed.success) return null;

    const sizes = parsed.data.pictures?.sizes ?? [];
    const largestPicture = selectLargestPicture(sizes);

    return {
      name: parsed.data.name,
      duration: parsed.data.duration,
      thumbnailUrl: largestPicture
        ? safeVimeoThumbnail(largestPicture.link)
        : null,
      mobileThumbnailUrl: largestPicture
        ? safeVimeoThumbnail(largestPicture.link)
        : null,
    };
  } catch {
    console.error("[academia-vimeo] video_metadata_unavailable");
    return null;
  }
}

function readVimeoError(body: unknown): string {
  const parsed = z
    .object({
      error: z.string().optional(),
      message: z.string().optional(),
      developer_message: z.string().optional(),
    })
    .safeParse(body);

  if (!parsed.success)
    return "Não foi possível atualizar a miniatura no Vimeo.";

  return (
    parsed.data.developer_message ??
    parsed.data.message ??
    parsed.data.error ??
    "Não foi possível atualizar a miniatura no Vimeo."
  );
}

function mapVimeoPicture(
  picture: z.infer<typeof vimeoPictureSchema>,
): VimeoVideoThumbnail {
  const largestPicture = selectLargestPicture(picture.sizes);

  return {
    uri: picture.uri,
    active: picture.active,
    type: picture.type ?? null,
    thumbnailUrl: largestPicture
      ? safeVimeoThumbnail(largestPicture.link)
      : null,
  };
}

export async function listVimeoVideoThumbnails(
  videoId: string,
): Promise<VimeoVideoThumbnail[]> {
  if (!/^\d{6,12}$/.test(videoId)) return [];

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) return [];

  try {
    const response = await fetch(
      `https://api.vimeo.com/videos/${videoId}/pictures?fields=uri,active,type,sizes&per_page=10`,
      {
        headers: {
          Accept: "application/vnd.vimeo.*+json;version=3.4",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) return [];

    const parsed = vimeoPicturesSchema.safeParse(await response.json());
    if (!parsed.success) return [];

    return parsed.data.data.map(mapVimeoPicture);
  } catch {
    console.error("[academia-vimeo] video_thumbnails_unavailable");
    return [];
  }
}

export async function createVimeoVideoThumbnailFromTime(
  videoId: string,
  seconds: number,
): Promise<
  | { ok: true; thumbnail: VimeoVideoThumbnail | null }
  | { ok: false; message: string }
> {
  if (!/^\d{6,12}$/.test(videoId)) {
    return { ok: false, message: "Vídeo do Vimeo inválido." };
  }

  if (!Number.isFinite(seconds) || seconds < 0) {
    return { ok: false, message: "Tempo da miniatura inválido." };
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, message: "Token do Vimeo não configurado." };
  }

  try {
    const response = await fetch(
      `https://api.vimeo.com/videos/${videoId}/pictures`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.vimeo.*+json;version=3.4",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: true,
          time: Number(seconds.toFixed(3)),
        }),
      },
    );

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, message: readVimeoError(body) };
    }

    const parsed = vimeoPictureSchema.safeParse(body);

    return {
      ok: true,
      thumbnail: parsed.success ? mapVimeoPicture(parsed.data) : null,
    };
  } catch {
    console.error("[academia-vimeo] video_thumbnail_create_failed");
    return { ok: false, message: "Não foi possível falar com o Vimeo agora." };
  }
}
