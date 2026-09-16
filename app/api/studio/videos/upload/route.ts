import { z } from "zod";

import { authorizeStudioRequest, getCurrentUser } from "@/lib/auth/session";
import {
  createVideoUploadRecord,
  findVideoUploadRecord,
  markVideoUploadRemoved,
  transitionVideoUploadStatus,
  updateVideoUploadDetails,
} from "@/lib/studio/uploads/records";
import { completeVideoUpload } from "@/lib/studio/uploads/sync";
import {
  createVimeoVideoUpload,
  deleteVimeoVideo,
  getVimeoVideoProcessingStatus,
} from "@/lib/vimeo/uploads";

const createUploadSchema = z.object({
  title: z.string().trim().min(1).max(100),
  size: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

const cancelUploadSchema = z.object({
  databaseVideoId: z.number().int().positive(),
  videoId: z.string().regex(/^\d+$/),
});

const processingStatusSchema = z.object({
  databaseVideoId: z.coerce.number().int().positive(),
  videoId: z.string().regex(/^\d+$/),
});

const updateUploadDetailsSchema = z.object({
  databaseVideoId: z.number().int().positive(),
  videoId: z.string().regex(/^\d+$/),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5000),
  subcategoryIds: z.array(z.number().int().positive()).max(100),
});

export async function GET(request: Request) {
  const unauthorized = await authorizeStudioRequest();
  if (unauthorized) return unauthorized;

  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Não autorizado." }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const identity = processingStatusSchema.safeParse({
    databaseVideoId: searchParams.get("databaseVideoId"),
    videoId: searchParams.get("videoId"),
  });
  if (!identity.success) {
    return Response.json(
      { message: "A identificação do vídeo é inválida." },
      { status: 400 },
    );
  }

  try {
    const record = await findVideoUploadRecord({
      ...identity.data,
      userId: Number(user.id),
      vimeoVideoId: identity.data.videoId,
    });
    if (!record) {
      return Response.json(
        { message: "Envio não encontrado." },
        { status: 404 },
      );
    }

    const status = await getVimeoVideoProcessingStatus(identity.data.videoId);
    if (status === "in_progress") {
      await transitionVideoUploadStatus({
        databaseVideoId: identity.data.databaseVideoId,
        userId: Number(user.id),
        vimeoVideoId: identity.data.videoId,
        from: ["uploading"],
        to: "processing",
      });
    } else if (status === "complete") {
      const completed = await completeVideoUpload(
        [
          {
            id: identity.data.databaseVideoId,
            user_id: Number(user.id),
            vimeo: identity.data.videoId,
            upload_status: record.upload_status,
          },
        ],
        identity.data.videoId,
      );
      return Response.json({ status: completed ? "complete" : "in_progress" });
    }
    return Response.json({ status });
  } catch {
    return Response.json(
      { message: "Não foi possível consultar o processamento no Vimeo." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await authorizeStudioRequest();
  if (unauthorized) return unauthorized;
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Não autorizado." }, { status: 401 });

  const body = createUploadSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json(
      { message: "Os dados do vídeo são inválidos." },
      { status: 400 },
    );
  }

  try {
    const upload = await createVimeoVideoUpload(body.data);
    try {
      const databaseVideoId = await createVideoUploadRecord({
        userId: Number(user.id),
        title: body.data.title,
        size: body.data.size,
        vimeoVideoId: upload.videoId,
      });
      return Response.json({ ...upload, databaseVideoId }, { status: 201 });
    } catch (error) {
      console.error("[academia-vimeo] upload_record_creation_failed", error);
      await deleteVimeoVideo(upload.videoId).catch((cleanupError) => {
        console.error(
          "[academia-vimeo] upload_compensation_failed",
          cleanupError,
        );
      });
      throw error;
    }
  } catch {
    return Response.json(
      { message: "Não foi possível preparar o envio para o Vimeo." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await authorizeStudioRequest();
  if (unauthorized) return unauthorized;
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Não autorizado." }, { status: 401 });

  const body = updateUploadDetailsSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json(
      { message: "Os detalhes do vídeo são inválidos." },
      { status: 400 },
    );
  }

  try {
    const result = await updateVideoUploadDetails({
      databaseVideoId: body.data.databaseVideoId,
      userId: Number(user.id),
      vimeoVideoId: body.data.videoId,
      title: body.data.title,
      description: body.data.description,
      subcategoryIds: body.data.subcategoryIds,
    });
    if (result === "not_found") {
      return Response.json(
        { message: "Envio não encontrado." },
        { status: 404 },
      );
    }
    if (result === "invalid_subcategories") {
      return Response.json(
        { message: "Uma ou mais subcategorias são inválidas." },
        { status: 400 },
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return Response.json(
      { message: "Não foi possível salvar os detalhes do vídeo." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await authorizeStudioRequest();
  if (unauthorized) return unauthorized;
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ message: "Não autorizado." }, { status: 401 });

  const body = cancelUploadSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json(
      { message: "Os dados do vídeo são inválidos." },
      { status: 400 },
    );
  }

  try {
    const identity = {
      databaseVideoId: body.data.databaseVideoId,
      userId: Number(user.id),
      vimeoVideoId: body.data.videoId,
    };
    const record = await findVideoUploadRecord(identity);
    if (!record) {
      return Response.json(
        { message: "Envio não encontrado." },
        { status: 404 },
      );
    }

    await deleteVimeoVideo(body.data.videoId);
    await markVideoUploadRemoved({
      ...identity,
      previousStatus: record.upload_status,
    });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json(
      { message: "Não foi possível cancelar o envio no Vimeo." },
      { status: 502 },
    );
  }
}
