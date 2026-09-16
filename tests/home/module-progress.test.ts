import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateModuleProgress } from "../../lib/home/module-progress";

test("module progress: calcula o percentual a partir das aulas concluídas", () => {
  assert.deepEqual(calculateModuleProgress(4, 6), {
    completedLessons: 4,
    totalLessons: 6,
    percentage: 66.7,
  });
});

test("module progress: evita percentuais inválidos", () => {
  assert.deepEqual(calculateModuleProgress(4, 0), {
    completedLessons: 0,
    totalLessons: 0,
    percentage: 0,
  });
  assert.deepEqual(calculateModuleProgress(8, 6), {
    completedLessons: 6,
    totalLessons: 6,
    percentage: 100,
  });
});
