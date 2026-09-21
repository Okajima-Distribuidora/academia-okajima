import assert from "node:assert/strict";
import test from "node:test";

import { updateStudioCategory } from "../../lib/studio/categories";

test("category edits validate input, preserve relationships and handle missing records and failures", async () => {
  const shared = globalThis as typeof globalThis & { academiaPrisma?: unknown };
  const previous = shared.academiaPrisma;
  let writes = 0;
  let exists = true;
  let fails = false;
  let saved: unknown;
  shared.academiaPrisma = {
    academy_categories: {
      updateMany: async (args: unknown) => {
        writes++;
        if (fails) throw new Error("Database unavailable");
        saved = args;
        return { count: exists ? 1 : 0 };
      },
    },
  };
  const form = (values: Record<string, string> = {}) => {
    const data = new FormData();
    for (const [key, value] of Object.entries({
      name: " Nova categoria ",
      description: " Texto ",
      sortOrder: "2",
      ...values,
    })) {
      data.set(key, value);
    }
    return data;
  };
  try {
    const invalidInputs: Record<string, string>[] = [
      { name: "   " },
      { name: "x".repeat(121) },
      { description: "x".repeat(501) },
      { sortOrder: "1.5" },
      { sortOrder: "2147483648" },
    ];
    for (const values of invalidInputs) {
      assert.equal(
        (await updateStudioCategory(7, form(values))).status,
        "error",
      );
    }
    assert.equal((await updateStudioCategory(-1, form())).status, "error");
    assert.equal(writes, 0);
    assert.equal((await updateStudioCategory(7, form())).status, "success");
    assert.deepEqual(saved, {
      where: { id: 7 },
      data: { name: "Nova categoria", description: "Texto", sort_order: 2 },
    });
    // Repeating the same save updates the existing category, without recreating links or a slug.
    assert.equal((await updateStudioCategory(7, form())).status, "success");
    assert.equal(writes, 2);
    exists = false;
    assert.equal((await updateStudioCategory(7, form())).status, "error");
    fails = true;
    await assert.rejects(
      updateStudioCategory(7, form()),
      /Database unavailable/,
    );
  } finally {
    shared.academiaPrisma = previous;
  }
});
