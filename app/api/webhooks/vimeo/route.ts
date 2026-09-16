import { handleVimeoWebhookEvent } from "@/lib/studio/uploads/sync";
import { isValidVimeoSignature, parseVimeoWebhook } from "@/lib/vimeo/webhooks";

export const runtime = "nodejs";

const maxPayloadBytes = 64 * 1024;

export async function POST(request: Request) {
  const expectedSecret = process.env.VIMEO_WEBHOOK_SECRET ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxPayloadBytes) {
    return Response.json({ message: "Payload muito grande." }, { status: 413 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody) > maxPayloadBytes) {
    return Response.json({ message: "Payload muito grande." }, { status: 413 });
  }

  const signature =
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-vimeo-signature");
  if (
    !isValidVimeoSignature({
      rawBody,
      signature,
      secret: expectedSecret,
    })
  ) {
    return Response.json(
      { message: "Webhook não autorizado." },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ message: "Payload inválido." }, { status: 400 });
  }

  const message = parseVimeoWebhook(
    payload,
    request.headers.get("x-vimeo-event"),
  );
  if (!message) {
    return Response.json({ message: "Evento inválido." }, { status: 400 });
  }

  try {
    const recordsUpdated = await handleVimeoWebhookEvent(
      message.event,
      message.videoId,
    );
    return Response.json({ received: true, recordsUpdated });
  } catch (error) {
    console.error("[academia-vimeo] webhook_processing_failed", {
      event: message.event,
      videoId: message.videoId,
      error,
    });
    return Response.json(
      { message: "Não foi possível processar o evento." },
      { status: 500 },
    );
  }
}
