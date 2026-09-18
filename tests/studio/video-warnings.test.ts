import assert from "node:assert/strict";
import test from "node:test";
import { getStudioVideoWarnings } from "../../lib/studio/content/warnings";

test("returns every missing video metadata warning", () => {
  assert.deepEqual(
    getStudioVideoWarnings({
      hasCategory: false,
      description: "",
    }),
    ["missing-category", "missing-description"],
  );
});

test("returns no warnings when the video metadata is complete", () => {
  assert.deepEqual(
    getStudioVideoWarnings({
      hasCategory: true,
      description: "Descrição do vídeo",
    }),
    [],
  );
});

test("treats a whitespace-only description as missing", () => {
  assert.deepEqual(
    getStudioVideoWarnings({
      hasCategory: true,
      description: "   ",
    }),
    ["missing-description"],
  );
});
