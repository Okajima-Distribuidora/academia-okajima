import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

export const vimeoWebhookEventSchema = z.enum([
  "automatic-thumbnail-available",
  "video-created",
  "video-deleted",
  "video-transcode-complete",
  "video-transcode-fully-playable",
  "video-transcode-playable",
  "video-updated",
  "video-upload-failed",
]);

export type VimeoWebhookEvent = z.infer<typeof vimeoWebhookEventSchema>;

export type VimeoWebhookMessage = {
  event: VimeoWebhookEvent;
  videoId: string;
};

export function isValidVimeoSignature({
  rawBody,
  signature,
  secret,
}: {
  rawBody: string;
  signature: string | null;
  secret: string;
}) {
  if (!signature || !secret) return false;

  const digest = createHmac("sha256", secret).update(rawBody).digest();
  const expectedSignatures = [
    digest.toString("hex"),
    digest.toString("base64"),
  ];
  const receivedSignatures = signature
    .split(",")
    .map((value) => value.trim().replace(/^(?:sha256=|v1=)/i, ""))
    .filter(Boolean);

  return receivedSignatures.some((received) =>
    expectedSignatures.some((expected) => safeEqual(received, expected)),
  );
}

export function parseVimeoWebhook(
  input: unknown,
  headerEvent?: string | null,
): VimeoWebhookMessage | null {
  if (!isRecord(input)) return null;

  const event = vimeoWebhookEventSchema.safeParse(
    headerEvent ??
      input.webhook_type ??
      input.type ??
      input.event_type ??
      input.event,
  );
  if (!event.success) return null;

  const videoId = findVideoId(input);
  return videoId ? { event: event.data, videoId } : null;
}

function findVideoId(payload: Record<string, unknown>): string | null {
  const data = isRecord(payload.data) ? payload.data : null;
  const video = isRecord(payload.video) ? payload.video : null;
  const dataVideo = data && isRecord(data.video) ? data.video : null;
  const resource = isRecord(payload.resource) ? payload.resource : null;
  const candidates = [
    payload.video_id,
    payload.videoId,
    payload.resource_key,
    payload.uri,
    payload.resource_uri,
    typeof payload.video === "string" ? payload.video : null,
    video?.id,
    video?.uri,
    data?.video_id,
    data?.videoId,
    data?.resource_key,
    data?.uri,
    data?.clip_uri,
    data?.video_uri,
    typeof data?.video === "string" ? data.video : null,
    dataVideo?.id,
    dataVideo?.uri,
    resource?.id,
    resource?.uri,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isSafeInteger(candidate)) {
      return String(candidate);
    }
    if (typeof candidate !== "string") continue;
    if (/^\d{6,12}$/.test(candidate)) return candidate;
    const match = candidate.match(/(?:^|\/)videos\/(\d{6,12})(?:$|[/?#])/);
    if (match) return match[1];
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
