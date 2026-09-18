import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatStudioDecimal,
  formatStudioNumber,
} from "../../lib/studio/stats";

test("studio: formata números inteiros em pt-BR", () => {
  assert.equal(formatStudioNumber(0), "0");
  assert.equal(formatStudioNumber(1250), "1.250");
  assert.equal(formatStudioNumber(-1), "0");
});

test("studio: formata métricas decimais em pt-BR", () => {
  assert.equal(formatStudioDecimal(0), "0,0");
  assert.equal(formatStudioDecimal(1.25), "1,3");
  assert.equal(formatStudioDecimal(-1), "0,0");
});
