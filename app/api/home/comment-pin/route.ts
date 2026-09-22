import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { setVideoCommentPin } from "@/lib/home/video-comment-pins";

const schema = z.object({
  videoId: z.number().int().positive(),
  commentId: z.number().int().positive(),
  pinned: z.boolean(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword)
    return Response.json(
      { message: "Você precisa entrar novamente." },
      { status: 401 },
    );
  if (!user.isStudioAdmin)
    return Response.json(
      { message: "Você não tem permissão para fixar comentários." },
      { status: 403 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { message: "A fixação informada é inválida." },
      { status: 400 },
    );
  const updated = await setVideoCommentPin({
    userId: Number(user.id),
    ...parsed.data,
  });
  if (!updated)
    return Response.json(
      { message: "O comentário informado é inválido." },
      { status: 404 },
    );
  return Response.json({ ok: true });
}
