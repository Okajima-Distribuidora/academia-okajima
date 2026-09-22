import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import {
  setCommentReaction,
  setCommentReplyReaction,
} from "@/lib/home/comment-reactions";

const schema = z.object({
  target: z.enum(["comment", "reply"]),
  id: z.number().int().positive(),
  reaction: z.enum(["like", "dislike"]).nullable(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword)
    return Response.json(
      { message: "Você precisa entrar novamente." },
      { status: 401 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { message: "A reação informada é inválida." },
      { status: 400 },
    );
  const updated =
    parsed.data.target === "comment"
      ? await setCommentReaction({
          userId: Number(user.id),
          commentId: parsed.data.id,
          reaction: parsed.data.reaction,
        })
      : await setCommentReplyReaction({
          userId: Number(user.id),
          replyId: parsed.data.id,
          reaction: parsed.data.reaction,
        });
  if (!updated)
    return Response.json(
      { message: "O item não está disponível." },
      { status: 404 },
    );
  return Response.json({ ok: true });
}
