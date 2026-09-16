export const VIDEO_COMPLETION_PERCENT = 0.95;
export const MAX_VIDEO_DURATION_SECONDS = 24 * 60 * 60;

export function normalizeVideoCheckpoint({
  positionSeconds,
  durationSeconds,
}: {
  positionSeconds: number;
  durationSeconds: number;
}) {
  if (
    !Number.isFinite(positionSeconds) ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    durationSeconds > MAX_VIDEO_DURATION_SECONDS
  ) {
    return null;
  }

  const duration = Math.floor(durationSeconds);
  if (duration <= 0) return null;

  return {
    positionSeconds: Math.min(
      Math.max(0, Math.floor(positionSeconds)),
      duration,
    ),
    durationSeconds: duration,
  };
}

export function isVideoCompleted(
  furthestPositionSeconds: number,
  durationSeconds: number,
) {
  return furthestPositionSeconds / durationSeconds >= VIDEO_COMPLETION_PERCENT;
}
