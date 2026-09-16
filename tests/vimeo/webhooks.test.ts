import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  isValidVimeoSignature,
  parseVimeoWebhook,
} from "../../lib/vimeo/webhooks";

test("validates Vimeo HMAC signatures over the unmodified body", () => {
  const rawBody = '{"type":"video-created"}';
  const secret = "same-secret";
  const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

  assert.equal(isValidVimeoSignature({ rawBody, signature, secret }), true);
  assert.equal(
    isValidVimeoSignature({
      rawBody,
      signature: `sha256=${signature}`,
      secret,
    }),
    true,
  );
  assert.equal(
    isValidVimeoSignature({ rawBody: `${rawBody} `, signature, secret }),
    false,
  );
  assert.equal(
    isValidVimeoSignature({ rawBody, signature: null, secret }),
    false,
  );
});

test("parses Vimeo events with top-level and nested video identifiers", () => {
  assert.deepEqual(
    parseVimeoWebhook({
      type: "video-transcode-complete",
      video: { uri: "/videos/123456789" },
    }),
    { event: "video-transcode-complete", videoId: "123456789" },
  );
  assert.deepEqual(
    parseVimeoWebhook({
      event_type: "automatic-thumbnail-available",
      data: { resource_key: "987654321" },
    }),
    { event: "automatic-thumbnail-available", videoId: "987654321" },
  );
  assert.deepEqual(
    parseVimeoWebhook({
      webhook_type: "video-deleted",
      data: {
        clip_uri: "/videos/456789123",
        video_uri: "/videos/456789123",
      },
      timestamp: 1789412698,
    }),
    { event: "video-deleted", videoId: "456789123" },
  );
});

test("accepts the event header and rejects unsupported or incomplete payloads", () => {
  assert.deepEqual(
    parseVimeoWebhook(
      { resource_uri: "https://api.vimeo.com/videos/123456789" },
      "video-transcode-fully-playable",
    ),
    { event: "video-transcode-fully-playable", videoId: "123456789" },
  );
  assert.equal(
    parseVimeoWebhook({ type: "live-event-started", video_id: "123456789" }),
    null,
  );
  assert.equal(parseVimeoWebhook({ type: "video-transcode-complete" }), null);
});
