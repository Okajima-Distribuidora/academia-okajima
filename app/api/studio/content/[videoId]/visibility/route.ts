import { z } from "zod";

import { authorizeStudioRequest } from "@/lib/auth/session";
import {
  getStudioVisibilityLabel,
  updateStudioVideoPrivacy,
} from "@/lib/studio/content";

const visibilityRequestSchema = z.object({
  privacy: z.union([z.literal(0), z.literal(1)]),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/studio/content/[videoId]/visibility">,
) {
  const unauthorized = await authorizeStudioRequest();
  if (unauthorized) return unauthorized;

  const body = visibilityRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!body.success) {
    return Response.json(
      { message: "A visibilidade informada é inválida." },
      { status: 400 },
    );
  }

  const { videoId } = await context.params;
  const updated = await updateStudioVideoPrivacy(videoId, body.data.privacy);
  if (!updated) {
    return Response.json({ message: "Vídeo não encontrado." }, { status: 404 });
  }

  return Response.json({
    privacy: body.data.privacy,
    visibilityLabel: getStudioVisibilityLabel(body.data.privacy),
  });
}
