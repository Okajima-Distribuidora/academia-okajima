import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import {
  CommentPostLimitError,
  createVideoComment,
  isPublicVideo,
} from "@/lib/home/video-comments";
import { MAX_VIDEO_COMMENT_LENGTH } from "@/lib/home/video-comment-rules";
import {
  listVideoCommentsPage,
  type VideoCommentCursor,
} from "@/lib/home/catalog";

const commentSchema = z.object({
  videoId: z.number().int().positive(),
  text: z.string().max(MAX_VIDEO_COMMENT_LENGTH),
});

const commentsPageSchema = z
  .object({
    videoId: z.coerce.number().int().positive(),
    cursorPinned: z.coerce.number().int().nonnegative().optional(),
    cursorTime: z.coerce.number().int().nonnegative().optional(),
    cursorId: z.coerce.number().int().positive().optional(),
  })
  .refine(
    ({ cursorPinned, cursorTime, cursorId }) => {
      const values = [cursorPinned, cursorTime, cursorId];
      return (
        values.every((value) => value === undefined) ||
        values.every((value) => value !== undefined)
      );
    },
    { message: "O cursor dos comentários é inválido." },
  );

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) {
    return Response.json(
      { message: "Você precisa entrar novamente." },
      { status: 401 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const parsed = commentsPageSchema.safeParse({
    videoId: searchParams.get("videoId"),
    cursorPinned: searchParams.get("cursorPinned") ?? undefined,
    cursorTime: searchParams.get("cursorTime") ?? undefined,
    cursorId: searchParams.get("cursorId") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { message: "A página de comentários informada é inválida." },
      { status: 400 },
    );
  }
  if (!(await isPublicVideo(parsed.data.videoId))) {
    return Response.json({ message: "Vídeo não disponível." }, { status: 404 });
  }

  const cursor: VideoCommentCursor | null =
    parsed.data.cursorId === undefined
      ? null
      : {
          pinned: parsed.data.cursorPinned!,
          time: parsed.data.cursorTime!,
          id: parsed.data.cursorId,
        };
  return Response.json(
    await listVideoCommentsPage({
      videoId: parsed.data.videoId,
      cursor,
      viewerId: Number(user.id),
      includeHidden: user.isStudioAdmin,
    }),
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) {
    return Response.json(
      { message: "Você precisa entrar novamente." },
      { status: 401 },
    );
  }

  const parsed = commentSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { message: "O comentário informado é inválido." },
      { status: 400 },
    );
  }

  let comment;
  try {
    comment = await createVideoComment({
      userId: Number(user.id),
      authorName: user.name,
      ...parsed.data,
    });
  } catch (error) {
    if (error instanceof CommentPostLimitError)
      return Response.json({ message: error.message }, { status: 429 });
    throw error;
  }
  if (!comment) {
    return Response.json(
      { message: "O comentário ou vídeo informado é inválido." },
      { status: 400 },
    );
  }

  return Response.json({ comment });
}
