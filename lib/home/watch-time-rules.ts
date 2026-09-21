export const HOUR_MS = 3_600_000;
export const SESSION_MAX_MS = 24 * HOUR_MS;
export const SESSION_IDLE_MS = 120_000;
export type WatchBuckets = Record<string, number>;

export function hourStart(ms: number): number {
  return Math.floor(ms / HOUR_MS) * HOUR_MS;
}

export function watchDay(hourMs: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(hourMs));
}

// Split a measured interval at UTC hour boundaries, including midnight in São Paulo.
export function addWatchInterval(
  buckets: WatchBuckets,
  start: number,
  end: number,
) {
  start = Math.floor(start);
  end = Math.floor(end);
  while (start < end) {
    const hour = hourStart(start);
    const until = Math.min(end, hour + HOUR_MS);
    buckets[hour] = (buckets[hour] ?? 0) + until - start;
    start = until;
  }
}

export function watchBucketDeltas(
  previous: WatchBuckets,
  next: WatchBuckets,
  startedAt: number,
  now: number,
  lastSeenAt: number,
) {
  if (Object.keys(next).length > 25) throw new Error("Invalid buckets");
  const deltas: Array<{ hour: number; ms: number }> = [];
  let delta = 0;
  for (const [key, value] of Object.entries(previous)) {
    if ((next[key] ?? -1) < value) throw new Error("Decreasing total");
  }
  for (const [key, value] of Object.entries(next)) {
    const hour = Number(key);
    const capacity = Math.max(
      0,
      Math.min(now, hour + HOUR_MS) - Math.max(startedAt, hour),
    );
    if (
      !Number.isSafeInteger(hour) ||
      String(hour) !== key ||
      hour % HOUR_MS !== 0 ||
      hour < hourStart(startedAt) ||
      hour > hourStart(now) ||
      !Number.isSafeInteger(value) ||
      value < 0 ||
      value > capacity
    )
      throw new Error("Invalid interval");
    const ms = value - (previous[key] ?? 0);
    if (ms > 0) {
      deltas.push({ hour, ms });
      delta += ms;
    }
  }
  // Small clock/network tolerance, never more than elapsed time over the whole session.
  const total = Object.values(next).reduce((sum, value) => sum + value, 0);
  if (delta > now - lastSeenAt + 2000 || total > now - startedAt)
    throw new Error("Impossible elapsed time");
  return deltas;
}

// A stalled timeupdate, seek or suspended tab must never become viewing time.
export function measuredPlaybackMs(
  elapsedMs: number,
  mediaDeltaSeconds: number,
  rate: number,
): number {
  if (
    elapsedMs <= 0 ||
    elapsedMs > 5000 ||
    rate <= 0 ||
    mediaDeltaSeconds <= 0 ||
    mediaDeltaSeconds > (elapsedMs / 1000) * rate + 1
  )
    return 0;
  return Math.floor(Math.min(elapsedMs, (mediaDeltaSeconds / rate) * 1000));
}
