import type { Metadata } from "next";
import { revalidatePath, updateTag } from "next/cache";
import { notFound } from "next/navigation";

import { VideoDetailsEditor } from "@/components/studio/content/video-details-editor";
import { requireStudioUser } from "@/lib/auth/session";
import {
  getStudioVideoDetails,
  updateStudioVideoDetails,
} from "@/lib/studio/content";
import { createVimeoVideoThumbnailFromTime } from "@/lib/vimeo/videos";

export const metadata: Metadata = {
  title: "Detalhes do vídeo | Academia Studio",
};

export default async function StudioVideoDetailsPage({
  params,
  searchParams,
}: PageProps<"/studio/conteudo/[videoId]">) {
  await requireStudioUser();
  const { videoId } = await params;
  const query = await searchParams;
  const initialSection = query.aba === "comentarios" ? "comments" : "details";
  const video = await getStudioVideoDetails(videoId);

  if (!video) notFound();

  async function updateVideoAction(formData: FormData) {
    "use server";

    await requireStudioUser();
    await updateStudioVideoDetails(videoId, formData);
    revalidatePath("/studio/conteudo");
    revalidatePath(`/studio/conteudo/${videoId}`);
  }

  async function createThumbnailAction(seconds: number) {
    "use server";

    await requireStudioUser();
    const currentVideo = await getStudioVideoDetails(videoId);

    if (!currentVideo?.vimeoId) {
      return {
        ok: false as const,
        message: "Este vídeo não tem ID do Vimeo configurado.",
      };
    }

    const result = await createVimeoVideoThumbnailFromTime(
      currentVideo.vimeoId,
      seconds,
    );

    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }

    revalidatePath("/studio/conteudo");
    revalidatePath(`/studio/conteudo/${videoId}`);
    updateTag(`vimeo-video:${currentVideo.vimeoId}`);

    return { ok: true as const, message: "Miniatura criada no Vimeo." };
  }

  return (
    <VideoDetailsEditor
      video={video}
      initialSection={initialSection}
      updateVideoAction={updateVideoAction}
      createThumbnailAction={createThumbnailAction}
    />
  );
}
