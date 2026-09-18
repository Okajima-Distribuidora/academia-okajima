export type StoredTusUpload = {
  metadata: Record<string, string>;
  creationTime: string;
};

export function selectTusUploadSession<T extends StoredTusUpload>(
  candidates: T[],
  identity: { databaseVideoId: number; vimeoVideoId: string },
): T | null {
  return (
    candidates
      .filter(
        (candidate) =>
          candidate.metadata.databaseVideoId ===
            String(identity.databaseVideoId) &&
          candidate.metadata.vimeoVideoId === identity.vimeoVideoId,
      )
      .sort(
        (left, right) =>
          Date.parse(right.creationTime) - Date.parse(left.creationTime),
      )[0] ?? null
  );
}
