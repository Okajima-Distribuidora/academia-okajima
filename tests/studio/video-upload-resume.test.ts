import assert from "node:assert/strict";
import test from "node:test";

import { selectTusUploadSession } from "../../lib/studio/uploads/resume";

const identity = { databaseVideoId: 42, vimeoVideoId: "123456789" };

test("seleciona somente a sessão TUS do registro e vídeo corretos", () => {
  const selected = selectTusUploadSession(
    [
      {
        metadata: { databaseVideoId: "41", vimeoVideoId: "123456789" },
        creationTime: "2026-09-16T10:00:00.000Z",
      },
      {
        metadata: { databaseVideoId: "42", vimeoVideoId: "123456789" },
        creationTime: "2026-09-16T11:00:00.000Z",
      },
    ],
    identity,
  );

  assert.equal(selected?.metadata.databaseVideoId, "42");
});

test("prefere a sessão TUS compatível mais recente", () => {
  const selected = selectTusUploadSession(
    [
      {
        metadata: { databaseVideoId: "42", vimeoVideoId: "123456789" },
        creationTime: "2026-09-16T11:00:00.000Z",
        marker: "old",
      },
      {
        metadata: { databaseVideoId: "42", vimeoVideoId: "123456789" },
        creationTime: "2026-09-16T12:00:00.000Z",
        marker: "new",
      },
    ],
    identity,
  );

  assert.equal(selected?.marker, "new");
});

test("não reutiliza uma sessão TUS sem os metadados esperados", () => {
  assert.equal(
    selectTusUploadSession(
      [{ metadata: {}, creationTime: "2026-09-16T12:00:00.000Z" }],
      identity,
    ),
    null,
  );
});
