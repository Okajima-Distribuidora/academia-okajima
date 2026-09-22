import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import {
  CommentPostLimitError,
  createVideoCommentReply,
} from "@/lib/home/video-comments";
import { MAX_VIDEO_COMMENT_LENGTH } from "@/lib/home/video-comment-rules";

const schema = z.object({
  videoId: z.number().int().positive(),
  commentId: z.number().int().positive(),
  parentReplyId: z.number().int().positive().nullable().optional(),
  text: z.string().max(MAX_VIDEO_COMMENT_LENGTH),
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
      { message: "A resposta informada é inválida." },
      { status: 400 },
    );
  try {
    const reply = await createVideoCommentReply({
      userId: Number(user.id),
      authorName: user.name,
      ...parsed.data,
    });
    if (!reply)
      return Response.json(
        { message: "O comentário informado é inválido." },
        { status: 400 },
      );
    return Response.json({ reply });
  } catch (error) {
    if (error instanceof CommentPostLimitError)
      return Response.json({ message: error.message }, { status: 429 });
    throw error;
  }
}
