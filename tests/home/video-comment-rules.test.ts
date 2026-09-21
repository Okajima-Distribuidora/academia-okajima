import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MAX_VIDEO_COMMENT_LENGTH,
  normalizeVideoCommentText,
} from "../../lib/home/video-comment-rules";

test("video comments: remove espaços externos e exige conteúdo", () => {
  assert.equal(normalizeVideoCommentText("  Ótimo conteúdo.  "), "Ótimo conteúdo.");
  assert.equal(normalizeVideoCommentText(" \n\t "), null);
});

test("video comments: respeita o limite do texto", () => {
  assert.equal(normalizeVideoCommentText("a".repeat(MAX_VIDEO_COMMENT_LENGTH))?.length, MAX_VIDEO_COMMENT_LENGTH);
  assert.equal(normalizeVideoCommentText("a".repeat(MAX_VIDEO_COMMENT_LENGTH + 1)), null);
});
