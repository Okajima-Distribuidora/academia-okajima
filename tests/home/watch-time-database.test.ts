import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import { databaseConfig } from "../../lib/db/config";
import type { Database } from "../../lib/db/types";
import {
  checkpointWatchSession,
  startWatchSession,
} from "../../lib/home/watch-time";
import {
  getWatchTimeDailyHistory,
  getWatchTimeReport,
} from "../../lib/studio/stats/watch-time";

test("watch time MySQL: atomic accumulation, retry, concurrent sends, scopes, expiration and rollback", {
  skip: !process.env.DATABASE_URL,
}, async () => {
  const db = new Kysely<Database>({
    dialect: new MysqlDialect({
      pool: createPool(databaseConfig(process.env.DATABASE_URL)),
    }),
  });
  try {
    // Single dedicated connection; every table used is TEMPORARY and shadows real data.
    const migration = await readFile(
      "prisma/migrations/20260922000000_add_video_watch_time/migration.sql",
      "utf8",
    );
    for (const statement of migration
      .split(";")
      .filter((part) => part.trim())) {
      await sql
        .raw(statement.replace("CREATE TABLE", "CREATE TEMPORARY TABLE"))
        .execute(db);
    }
    await sql`CREATE TEMPORARY TABLE users (id INT PRIMARY KEY) ENGINE=InnoDB`.execute(
      db,
    );
    await sql`INSERT INTO users VALUES (1),(2)`.execute(db);
    await sql`CREATE TEMPORARY TABLE videos (id INT PRIMARY KEY, converted INT DEFAULT 1, privacy INT DEFAULT 0,
      is_movie INT DEFAULT 0, live_time INT DEFAULT 0, approved INT DEFAULT 1, upload_status VARCHAR(20) DEFAULT 'ready',
      deleted_at DATETIME NULL, is_short INT DEFAULT 0) ENGINE=InnoDB`.execute(
      db,
    );
    await sql`INSERT INTO videos(id) VALUES (10),(11)`.execute(db);
    await sql`CREATE TEMPORARY TABLE academy_subcategories (id INT PRIMARY KEY, category_id INT) ENGINE=InnoDB`.execute(
      db,
    );
    await sql`INSERT INTO academy_subcategories VALUES (101,1),(102,1),(103,2)`.execute(
      db,
    );
    await sql`CREATE TEMPORARY TABLE academy_video_subcategories (video_id INT, subcategory_id INT) ENGINE=InnoDB`.execute(
      db,
    );
    await sql`INSERT INTO academy_video_subcategories VALUES (10,101),(10,102),(11,103)`.execute(
      db,
    );
    const now = Date.parse("2026-09-21T02:59:30Z");
    const id = "00000000-0000-4000-8000-000000000001";
    const first = await startWatchSession(1, 10, id, db, now);
    assert.equal(
      (await startWatchSession(1, 10, id, db, now + 1000)).startedAt,
      first.startedAt,
    );
    await assert.rejects(startWatchSession(1, 11, "other", db, now + 1000));
    const buckets = {
      [Date.parse("2026-09-21T02:00:00Z")]: 30000,
      [Date.parse("2026-09-21T03:00:00Z")]: 30000,
    };
    const input = { sessionId: id, sequence: 1, buckets, close: false };
    await Promise.all([
      checkpointWatchSession(1, input, db, now + 60000),
      checkpointWatchSession(1, input, db, now + 60000),
    ]);
    await assert.rejects(checkpointWatchSession(2, input, db, now + 60000));
    const reportNow = Date.parse("2026-09-21T04:35:00Z");
    for (const period of ["all", "24h", "7d", "28d"] as const) {
      const report = await getWatchTimeReport(
        { categoryId: 1 },
        period,
        db,
        reportNow,
      );
      assert.equal(report.watchedMs, 60000);
      assert.equal(report.videos.length, 1);
      if (period !== "all") assert.equal(report.to, "2026-09-21T04:00:00.000Z");
    }
    assert.equal(
      (await getWatchTimeReport({ categoryId: 2 }, "all", db)).watchedMs,
      0,
    );
    assert.equal(
      (await getWatchTimeReport({ userId: 2 }, "all", db)).watchedMs,
      0,
    );
    assert.equal(
      (await getWatchTimeReport({ subcategoryId: 102 }, "all", db)).watchedMs,
      60000,
    );
    const days = await getWatchTimeDailyHistory(
      { videoId: 10 },
      ["2026-09-20", "2026-09-21"],
      db,
    );
    assert.deepEqual(
      days.map((day) => Math.round(day.watchHours * 3600000)),
      [30000, 30000],
    );
    await checkpointWatchSession(
      1,
      { ...input, sequence: 2, close: true },
      db,
      now + 61000,
    );
    await assert.rejects(
      checkpointWatchSession(1, { ...input, sequence: 3 }, db, now + 62000),
    );
    const nextId = "00000000-0000-4000-8000-000000000002";
    await startWatchSession(1, 11, nextId, db, now + 62000);
    // Force daily write failure AFTER the hourly write, to prove the entire transaction rolls back.
    await sql`SET SESSION sql_mode = 'STRICT_ALL_TABLES'`.execute(db);
    await sql`ALTER TABLE academy_video_watch_daily MODIFY watched_ms SMALLINT UNSIGNED NOT NULL`.execute(
      db,
    );
    const next = {
      sessionId: nextId,
      sequence: 1,
      buckets: { [Date.parse("2026-09-21T03:00:00Z")]: 70000 },
      close: false,
    };
    await assert.rejects(checkpointWatchSession(1, next, db, now + 132000));
    assert.equal(
      (await getWatchTimeReport({ videoId: 11 }, "24h", db, reportNow))
        .watchedMs,
      0,
    );
    const session = await db
      .selectFrom("academy_video_watch_sessions")
      .select("last_sequence")
      .where("id", "=", nextId)
      .executeTakeFirstOrThrow();
    assert.equal(session.last_sequence, 0);
    await sql`ALTER TABLE academy_video_watch_daily MODIFY watched_ms BIGINT NOT NULL`.execute(
      db,
    );
    await checkpointWatchSession(1, next, db, now + 132000);
    assert.equal(
      (await getWatchTimeReport({ videoId: 11 }, "all", db)).watchedMs,
      70000,
    );
    await assert.rejects(
      checkpointWatchSession(1, { ...next, sequence: 2 }, db, now + 300000),
    );
    await startWatchSession(1, 10, "replacement", db, now + 300000);
    await assert.rejects(
      checkpointWatchSession(1, { ...next, sequence: 2 }, db, now + 301000),
    );
    await assert.rejects(
      checkpointWatchSession(
        1,
        { ...input, sessionId: "deleted" },
        db,
        now + 301000,
      ),
    );
    await sql`UPDATE videos SET deleted_at = NOW() WHERE id=10`.execute(db);
    assert.equal(
      (await getWatchTimeReport({ videoId: 10 }, "all", db)).watchedMs,
      60000,
    );
    assert.equal(
      (
        await getWatchTimeReport(
          { videoId: 10, publishedOnly: true },
          "all",
          db,
        )
      ).watchedMs,
      0,
    );
  } finally {
    await db.destroy();
  }
});
