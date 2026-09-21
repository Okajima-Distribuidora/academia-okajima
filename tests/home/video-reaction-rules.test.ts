import assert from "node:assert/strict";
import { test } from "node:test";

import { nextVideoReaction } from "../../lib/home/video-reaction-rules";

test("video reactions: seleciona e remove a mesma reação", () => {
  assert.equal(nextVideoReaction(null, "like"), "like");
  assert.equal(nextVideoReaction("like", "like"), null);
  assert.equal(nextVideoReaction(null, "dislike"), "dislike");
  assert.equal(nextVideoReaction("dislike", "dislike"), null);
});

test("video reactions: troca a reação ativa", () => {
  assert.equal(nextVideoReaction("like", "dislike"), "dislike");
  assert.equal(nextVideoReaction("dislike", "like"), "like");
});
