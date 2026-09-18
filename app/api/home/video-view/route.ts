import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { recordVideoView } from "@/lib/home/video-views";

const viewSchema = z.object({
  videoId: z.number().int().positive(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) {
    return Response.json(
      { message: "Você precisa entrar novamente." },
      { status: 401 },
    );
  }

  const parsed = viewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { message: "A visualização informada é inválida." },
      { status: 400 },
    );
  }

  const result = await recordVideoView({
    userId: Number(user.id),
    videoId: parsed.data.videoId,
  });
  if (!result) {
    return Response.json({ message: "Vídeo não disponível." }, { status: 404 });
  }

  return Response.json(result);
}
