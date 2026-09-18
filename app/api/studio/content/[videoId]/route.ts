import { authorizeStudioRequest } from "@/lib/auth/session";
import { deleteStudioVideo } from "@/lib/studio/content";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/studio/content/[videoId]">,
) {
  const unauthorized = await authorizeStudioRequest();
  if (unauthorized) return unauthorized;

  const { videoId } = await context.params;

  try {
    const deleted = await deleteStudioVideo(videoId);
    if (!deleted) {
      return Response.json({ message: "Vídeo não encontrado." }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch {
    return Response.json(
      { message: "Não foi possível excluir o vídeo." },
      { status: 502 },
    );
  }
}
