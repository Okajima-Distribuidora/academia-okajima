import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isVideoCompleted,
  normalizeVideoCheckpoint,
} from "../../lib/home/video-progress-rules";

test("video progress: conclui a aula ao alcançar 95%", () => {
  assert.equal(isVideoCompleted(1_140, 1_200), true);
  assert.equal(isVideoCompleted(1_139, 1_200), false);
});

test("video progress: limita a posição à duração informada", () => {
  assert.deepEqual(
    normalizeVideoCheckpoint({
      positionSeconds: 1_500.8,
      durationSeconds: 1_200.5,
    }),
    { positionSeconds: 1_200, durationSeconds: 1_200 },
  );
  assert.equal(
    normalizeVideoCheckpoint({ positionSeconds: 1, durationSeconds: 0 }),
    null,
  );
});
