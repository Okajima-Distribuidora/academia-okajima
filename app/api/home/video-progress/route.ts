import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { saveVideoProgress } from "@/lib/home/video-progress";

const checkpointSchema = z.object({
  videoId: z.number().int().positive(),
  positionSeconds: z.number().finite().min(0),
  durationSeconds: z.number().finite().positive(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { message: "Você precisa entrar novamente." },
      { status: 401 },
    );
  }

  const parsed = checkpointSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { message: "O progresso informado é inválido." },
      { status: 400 },
    );
  }

  const video = await getDb()
    .selectFrom("videos")
    .select("id")
    .where("id", "=", parsed.data.videoId)
    .where("converted", "!=", 2)
    .where("privacy", "=", 0)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .where("approved", "=", 1)
    .where("upload_status", "=", "ready")
    .where("deleted_at", "is", null)
    .where("is_short", "=", 0)
    .executeTakeFirst();
  if (!video) {
    return Response.json({ message: "Vídeo não disponível." }, { status: 404 });
  }

  const progress = await saveVideoProgress({
    userId: Number(user.id),
    ...parsed.data,
  });
  if (!progress) {
    return Response.json(
      { message: "O progresso informado é inválido." },
      { status: 400 },
    );
  }

  return Response.json({
    resumePositionSeconds: progress.resumePositionSeconds,
    furthestPositionSeconds: progress.furthestPositionSeconds,
    completedAt: progress.completedAt?.toISOString() ?? null,
  });
}
