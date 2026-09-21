import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addWatchInterval,
  HOUR_MS,
  measuredPlaybackMs,
  watchBucketDeltas,
  watchDay,
} from "../../lib/home/watch-time-rules";

test("watch time: counts wall time, excludes seeks, stalls and suspended tabs", () => {
  assert.equal(measuredPlaybackMs(1000, 1, 1), 1000);
  assert.equal(measuredPlaybackMs(1000, 2, 2), 1000);
  assert.equal(measuredPlaybackMs(1000, 0, 1), 0);
  assert.equal(measuredPlaybackMs(1000, -10, 1), 0);
  assert.equal(measuredPlaybackMs(1000, 120, 1), 0);
  assert.equal(measuredPlaybackMs(15000, 15, 1), 0);
});

test("watch time: splits across UTC hour and São Paulo midnight", () => {
  const start = Date.parse("2026-09-21T02:59:30Z");
  const buckets = {};
  addWatchInterval(buckets, start, start + 60_000);
  const hours = Object.keys(buckets).map(Number);
  assert.equal(hours.length, 2);
  assert.deepEqual(Object.values(buckets), [30000, 30000]);
  assert.equal(watchDay(hours[0]), "2026-09-20");
  assert.equal(watchDay(hours[1]), "2026-09-21");
  assert.equal(hours[1] - hours[0], HOUR_MS);
});

test("watch time: cumulative retries do not double count and impossible buckets fail", () => {
  const start = Date.parse("2026-09-21T12:00:00Z");
  const previous = { [start]: 30000 };
  assert.deepEqual(
    watchBucketDeltas(previous, previous, start, start + 60000, start + 30000),
    [],
  );
  assert.deepEqual(
    watchBucketDeltas(
      previous,
      { [start]: 60000 },
      start,
      start + 60000,
      start + 30000,
    ),
    [{ hour: start, ms: 30000 }],
  );
  assert.throws(() =>
    watchBucketDeltas(previous, {}, start, start + 60000, start + 30000),
  );
  assert.throws(() =>
    watchBucketDeltas({}, { [start]: 60001 }, start, start + 60000, start),
  );
  assert.throws(() =>
    watchBucketDeltas(
      {},
      { [start + HOUR_MS]: 1 },
      start,
      start + 60000,
      start,
    ),
  );
  assert.throws(() =>
    watchBucketDeltas(
      previous,
      { [start]: 60000 },
      start,
      start + 60000,
      start + 59000,
    ),
  );
});
