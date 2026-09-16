import "server-only";

import { z } from "zod";

const vimeoUploadResponseSchema = z.object({
  uri: z.string().regex(/^\/videos\/\d+$/),
  upload: z.object({
    approach: z.literal("tus"),
    upload_link: z.url(),
  }),
});

export type VimeoProcessingStatus = "in_progress" | "complete" | "error";

export async function createVimeoVideoUpload({
  title,
  size,
}: {
  title: string;
  size: number;
}) {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) throw new Error("VIMEO_ACCESS_TOKEN is not configured");

  const response = await fetch("https://api.vimeo.com/me/videos", {
    method: "POST",
    headers: {
      Accept: "application/vnd.vimeo.*+json;version=3.4",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: title,
      privacy: { view: "disable" },
      upload: { approach: "tus", size },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("[academia-vimeo] upload_container_creation_failed", {
      status: response.status,
    });
    throw new Error("Vimeo upload container creation failed");
  }

  const parsed = vimeoUploadResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    console.error("[academia-vimeo] invalid_upload_container_response");
    throw new Error("Vimeo returned an invalid upload response");
  }

  return {
    videoId: parsed.data.uri.slice("/videos/".length),
    uploadLink: parsed.data.upload.upload_link,
  };
}

export async function deleteVimeoVideo(videoId: string) {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) throw new Error("VIMEO_ACCESS_TOKEN is not configured");

  const response = await fetch(`https://api.vimeo.com/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/vnd.vimeo.*+json;version=3.4",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok && response.status !== 404) {
    console.error("[academia-vimeo] video_deletion_failed", {
      status: response.status,
    });
    throw new Error("Vimeo video deletion failed");
  }
}

export async function getVimeoVideoProcessingStatus(
  videoId: string,
): Promise<VimeoProcessingStatus> {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) throw new Error("VIMEO_ACCESS_TOKEN is not configured");

  const response = await fetch(
    `https://api.vimeo.com/videos/${videoId}?fields=status,transcode.status`,
    {
      headers: {
        Accept: "application/vnd.vimeo.*+json;version=3.4",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error("Vimeo processing status request failed");
  }

  const video = (await response.json()) as {
    status?: string;
    transcode?: { status?: string } | null;
  };

  if (video.transcode?.status === "complete" || video.status === "available") {
    return "complete";
  }
  if (
    video.transcode?.status === "error" ||
    ["failed", "transcoding_error", "uploading_error"].includes(
      video.status ?? "",
    )
  ) {
    return "error";
  }
  return "in_progress";
}
