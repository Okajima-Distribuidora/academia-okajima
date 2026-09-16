import assert from "node:assert/strict";
import test from "node:test";

import type { ActiveVideoUpload } from "../../components/studio/uploads/video-upload-dialog";
import type { StudioContentItem } from "../../lib/studio/content";
import { getStudioStatusLabel } from "../../lib/studio/content";
import {
  getUploadProgressLabel,
  mergeActiveUpload,
  shouldPollStudioContent,
} from "../../lib/studio/content/upload-view";

const item: StudioContentItem = {
  id: 42,
  publicId: "public-id",
  title: "Vídeo",
  description: "Descrição",
  duration: "00:00",
  privacy: 1,
  visibilityLabel: "Pendente",
  dateLabel: "15 set. 2026",
  statusLabel: "Enviando",
  views: 0,
  comments: 0,
  likes: 0,
  thumbnailUrl: null,
  vimeoId: "123456",
  uploadStatus: "uploading",
  uploadStartedAt: "2026-09-15T12:00:00.000Z",
  uploadStatusUpdatedAt: "2026-09-15T12:00:00.000Z",
  processingStartedAt: null,
  readyAt: null,
  cancelledAt: null,
};

function activeUpload(
  values: Partial<ActiveVideoUpload> = {},
): ActiveVideoUpload {
  return {
    databaseVideoId: 42,
    vimeoVideoId: "123456",
    title: "Vídeo atualizado",
    status: "uploading",
    progress: 19.4,
    remainingSeconds: 121,
    ...values,
  };
}

test("mescla porcentagem e tempo do TUS sem persistir no item", () => {
  const merged = mergeActiveUpload(item, activeUpload());
  assert.equal(merged.uploadProgress, 19.4);
  assert.equal(merged.uploadRemainingSeconds, 121);
  assert.equal(
    getUploadProgressLabel(merged),
    "Envio em 19% · Tempo restante: 3 min",
  );
});

test("converte os estados finais locais para o ciclo persistido", () => {
  assert.equal(
    mergeActiveUpload(item, activeUpload({ status: "complete" })).uploadStatus,
    "ready",
  );
  assert.equal(
    mergeActiveUpload(item, activeUpload({ status: "cancelled" })).uploadStatus,
    "cancelled",
  );
});

test("mantém cancelling como estado transitório somente da interface", () => {
  const cancelling = mergeActiveUpload(
    item,
    activeUpload({ status: "cancelling" }),
  );
  assert.equal(cancelling.uploadStatus, "uploading");
  assert.equal(cancelling.uploadActionStatus, "cancelling");
  assert.equal(getUploadProgressLabel(cancelling), "Cancelando envio...");
});

test("polling para quando não há uploads transitórios", () => {
  const cancelled = { ...item, uploadStatus: "cancelled" as const };
  assert.equal(
    shouldPollStudioContent([cancelled], activeUpload({ status: "cancelled" })),
    false,
  );
  assert.equal(shouldPollStudioContent([item], null), true);
});

test("status final segue a visibilidade e não o campo legado active", () => {
  assert.equal(getStudioStatusLabel(0), "Público");
  assert.equal(getStudioStatusLabel(1), "Privado");
  assert.equal(getStudioStatusLabel(2), "Não listado");
});
