import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { setVideoReaction } from "@/lib/home/video-reactions";

const reactionSchema = z.object({
  videoId: z.number().int().positive(),
  reaction: z.enum(["like", "dislike"]).nullable(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) {
    return Response.json(
      { message: "Você precisa entrar novamente." },
      { status: 401 },
    );
  }

  const parsed = reactionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { message: "A reação informada é inválida." },
      { status: 400 },
    );
  }

  const summary = await setVideoReaction({
    userId: Number(user.id),
    ...parsed.data,
  });
  if (!summary) {
    return Response.json({ message: "Vídeo não disponível." }, { status: 404 });
  }

  return Response.json(summary);
}
