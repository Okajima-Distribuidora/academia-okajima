import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import {
  checkpointWatchSession,
  startWatchSession,
  WatchTimeError,
} from "@/lib/home/watch-time";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    sessionId: z.string().uuid(),
    videoId: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("checkpoint"),
    sessionId: z.string().uuid(),
    sequence: z.number().int().min(1).max(2147483647),
    buckets: z
      .record(
        z.string().regex(/^\d{13}$/),
        z.number().int().min(0).max(3600000),
      )
      .refine((b) => Object.keys(b).length <= 25),
    close: z.boolean(),
  }),
]);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return Response.json({ message: "Origem inválida." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword)
    return Response.json({ message: "Entre novamente." }, { status: 401 });
  const body = await request.text();
  if (body.length > 4096)
    return Response.json({ message: "Envio muito grande." }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return Response.json({ message: "JSON inválido." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success)
    return Response.json({ message: "Dados inválidos." }, { status: 400 });
  try {
    const input = parsed.data;
    return Response.json(
      input.action === "start"
        ? await startWatchSession(
            Number(user.id),
            input.videoId,
            input.sessionId,
          )
        : await checkpointWatchSession(Number(user.id), input),
    );
  } catch (error) {
    if (error instanceof WatchTimeError)
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    console.error(
      "watch-time: falha ao persistir reprodução",
      error instanceof Error ? error.name : "unknown",
    );
    return Response.json({ message: "Tente novamente." }, { status: 503 });
  }
}
