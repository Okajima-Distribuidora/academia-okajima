import assert from "node:assert/strict";
import test from "node:test";

import { removalStatusFor } from "../../lib/studio/uploads/lifecycle";

test("marks unfinished uploads as cancelled", () => {
  assert.equal(removalStatusFor("uploading"), "cancelled");
  assert.equal(removalStatusFor("processing"), "cancelled");
  assert.equal(removalStatusFor("cancelled"), "cancelled");
});

test("marks ready or already deleted videos as deleted", () => {
  assert.equal(removalStatusFor("ready"), "deleted");
  assert.equal(removalStatusFor("deleted"), "deleted");
});
