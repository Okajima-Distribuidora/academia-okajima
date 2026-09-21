import "server-only";

import { type Kysely, sql } from "kysely";
import { getDb } from "@/lib/db";
import type { Database } from "@/lib/db/types";
import {
  SESSION_IDLE_MS,
  SESSION_MAX_MS,
  type WatchBuckets,
  watchBucketDeltas,
  watchDay,
} from "./watch-time-rules";

export class WatchTimeError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function requirePlayable(db: Kysely<Database>, videoId: number) {
  const video = await db
    .selectFrom("videos")
    .select("id")
    .where("id", "=", videoId)
    .where("converted", "!=", 2)
    .where("privacy", "=", 0)
    .where("is_movie", "=", 0)
    .where("live_time", "=", 0)
    .where("approved", "=", 1)
    .where("upload_status", "=", "ready")
    .where("deleted_at", "is", null)
    .where("is_short", "=", 0)
    .executeTakeFirst();
  if (!video) throw new WatchTimeError(404, "Vídeo não disponível.");
}

export async function startWatchSession(
  userId: number,
  videoId: number,
  id: string,
  db: Kysely<Database> = getDb(),
  now = Date.now(),
) {
  return db.transaction().execute(async (trx) => {
    // Serialize starts and checkpoints for this user, including different videos/tabs.
    const user = await trx
      .selectFrom("users")
      .select("id")
      .where("id", "=", userId)
      .forUpdate()
      .executeTakeFirst();
    if (!user) throw new WatchTimeError(401, "Usuário não disponível.");
    await requirePlayable(trx, videoId);
    const existing = await trx
      .selectFrom("academy_video_watch_sessions")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    if (existing) {
      if (existing.user_id !== userId || existing.video_id !== videoId)
        throw new WatchTimeError(403, "Sessão inválida.");
      if (
        existing.status !== "active" ||
        now >= Number(existing.expires_at_ms) ||
        now - Number(existing.last_seen_at_ms) > SESSION_IDLE_MS
      )
        throw new WatchTimeError(410, "Sessão expirada.");
      return { id, startedAt: Number(existing.started_at_ms), serverNow: now };
    }
    // Request-driven state transition only; no deletion/retention job.
    await trx
      .updateTable("academy_video_watch_sessions")
      .set({ status: "expired", ended_at_ms: now })
      .where("user_id", "=", userId)
      .where("status", "=", "active")
      .where((eb) =>
        eb.or([
          eb("last_seen_at_ms", "<", now - SESSION_IDLE_MS),
          eb("expires_at_ms", "<=", now),
        ]),
      )
      .execute();
    const active = await trx
      .selectFrom("academy_video_watch_sessions")
      .select("id")
      .where("user_id", "=", userId)
      .where("status", "=", "active")
      .executeTakeFirst();
    if (active)
      throw new WatchTimeError(
        409,
        "Outra reprodução já está sendo contabilizada.",
      );
    await trx
      .insertInto("academy_video_watch_sessions")
      .values({
        id,
        user_id: userId,
        video_id: videoId,
        status: "active",
        started_at_ms: now,
        last_seen_at_ms: now,
        expires_at_ms: now + SESSION_MAX_MS,
        ended_at_ms: null,
        last_sequence: 0,
        watched_ms: 0,
        accepted_buckets: "{}",
      })
      .execute();
    return { id, startedAt: now, serverNow: now };
  });
}

export async function checkpointWatchSession(
  userId: number,
  input: {
    sessionId: string;
    sequence: number;
    buckets: WatchBuckets;
    close: boolean;
  },
  db: Kysely<Database> = getDb(),
  now = Date.now(),
) {
  return db.transaction().execute(async (trx) => {
    await trx
      .selectFrom("users")
      .select("id")
      .where("id", "=", userId)
      .forUpdate()
      .executeTakeFirst();
    const session = await trx
      .selectFrom("academy_video_watch_sessions")
      .selectAll()
      .where("id", "=", input.sessionId)
      .forUpdate()
      .executeTakeFirst();
    // Never recreate an unknown checkpoint, including one removed by future retention.
    if (!session) throw new WatchTimeError(410, "Sessão não disponível.");
    if (session.user_id !== userId)
      throw new WatchTimeError(403, "Sessão inválida.");
    if (input.sequence <= session.last_sequence)
      return { accepted: true, watchedMs: session.watched_ms };
    if (
      session.status !== "active" ||
      now >= Number(session.expires_at_ms) ||
      now - Number(session.last_seen_at_ms) > SESSION_IDLE_MS
    )
      throw new WatchTimeError(410, "Sessão expirada.");
    await requirePlayable(trx, session.video_id);
    let deltas: ReturnType<typeof watchBucketDeltas>;
    try {
      deltas = watchBucketDeltas(
        JSON.parse(session.accepted_buckets),
        input.buckets,
        Number(session.started_at_ms),
        now,
        Number(session.last_seen_at_ms),
      );
    } catch {
      throw new WatchTimeError(400, "Tempo de reprodução inválido.");
    }
    for (const { hour, ms } of deltas) {
      await trx
        .insertInto("academy_video_watch_hourly")
        .values({
          user_id: userId,
          video_id: session.video_id,
          hour_start_ms: hour,
          watched_ms: ms,
        })
        .onDuplicateKeyUpdate({ watched_ms: sql<number>`watched_ms + ${ms}` })
        .execute();
      await trx
        .insertInto("academy_video_watch_daily")
        .values({
          user_id: userId,
          video_id: session.video_id,
          day: watchDay(hour),
          watched_ms: ms,
        })
        .onDuplicateKeyUpdate({ watched_ms: sql<number>`watched_ms + ${ms}` })
        .execute();
    }
    const watchedMs = Object.values(input.buckets).reduce(
      (sum, ms) => sum + ms,
      0,
    );
    await trx
      .updateTable("academy_video_watch_sessions")
      .set({
        accepted_buckets: JSON.stringify(input.buckets),
        watched_ms: watchedMs,
        last_sequence: input.sequence,
        last_seen_at_ms: now,
        status: input.close ? "closed" : "active",
        ended_at_ms: input.close ? now : null,
      })
      .where("id", "=", session.id)
      .execute();
    return { accepted: true, watchedMs };
  });
}
