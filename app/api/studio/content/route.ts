import { authorizeStudioRequest } from "@/lib/auth/session";
import {
  getStudioContentPage,
  getStudioContentType,
  listStudioContent,
} from "@/lib/studio/content";

export async function GET(request: Request) {
  const unauthorized = await authorizeStudioRequest();
  if (unauthorized) return unauthorized;

  const searchParams = new URL(request.url).searchParams;
  const content = await listStudioContent(
    getStudioContentType(searchParams.get("tipo") ?? undefined),
    getStudioContentPage(searchParams.get("pagina") ?? undefined),
    {
      resolveVimeoPresentation: false,
    },
  );

  return Response.json(content);
}
