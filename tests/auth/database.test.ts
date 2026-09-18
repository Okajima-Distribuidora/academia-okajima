import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool, type RowDataPacket } from "mysql2";
import { authenticateCredentials } from "../../lib/auth/credentials";
import { LocalLoginLimiter } from "../../lib/auth/rate-limit";
import { createUsersRepository } from "../../lib/auth/users";
import { databaseConfig } from "../../lib/db/config";
import type { Database } from "../../lib/db/types";
import { PHP_TEST_HASH, PHP_TEST_PASSWORD } from "./fixtures";

test("MySQL real: consultas em tabela TEMPORARY isolada, base original intacta", {
  skip: process.env.AUTH_TEST_DATABASE !== "1",
}, async () => {
  const config = databaseConfig(process.env.DATABASE_URL);
  const observer = createPool({ ...config, connectionLimit: 1 });
  const fingerprint = async () => {
    const [rows] = await observer
      .promise()
      .query("SELECT * FROM users ORDER BY id");
    return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  };
  const before = await fingerprint();
  const pool = createPool({ ...config, connectionLimit: 1 });
  const db = new Kysely<Database>({ dialect: new MysqlDialect({ pool }) });
  try {
    // Dedicated single connection: temporary users shadows the real table only here.
    const [schema] = await observer
      .promise()
      .query<RowDataPacket[]>("SHOW CREATE TABLE users");
    const ddl = schema[0]["Create Table"] as string;
    assert.ok(ddl.startsWith("CREATE TABLE `users` ("));
    await sql
      .raw(ddl.replace(/^CREATE TABLE /, "CREATE TEMPORARY TABLE "))
      .execute(db);
    await db
      .insertInto("users")
      .values([
        {
          id: 41,
          username: "Nome de exibição",
          codigorca: "005420",
          email: "fixture@academia.test",
          password: PHP_TEST_HASH,
          active: 1,
          admin: 1,
          two_factor: 0,
        },
        {
          id: 42,
          username: "Outra",
          codigorca: "outra",
          email: "0",
          password: PHP_TEST_HASH,
          active: 1,
          admin: 0,
          two_factor: 0,
        },
      ])
      .execute();
    const users = createUsersRepository(db);
    const login = (identifier: string) =>
      authenticateCredentials(
        { identifier, password: PHP_TEST_PASSWORD },
        users,
        new LocalLoginLimiter(),
      );
    assert.equal((await login("005420"))?.id, "41");
    assert.equal((await login("fixture@academia.test"))?.id, "41");
    for (const id of [
      "5420",
      "Nome de exibição",
      "0",
      "' OR 1=1 --",
      "x' UNION SELECT * FROM users --",
    ])
      assert.equal(await login(id), null);
    assert.equal(
      (await users.findCandidates("FIXTURE@ACADEMIA.TEST")).length,
      1,
    );
    assert.ok(!("password" in (await users.findById("41"))!));
    await db
      .updateTable("users")
      .set({ codigorca: "fixture@academia.test" })
      .where("id", "=", 42)
      .execute();
    assert.equal(await login("fixture@academia.test"), null);
    await db
      .updateTable("users")
      .set({ codigorca: "005420", active: 0 })
      .where("id", "=", 42)
      .execute();
    assert.equal(await login("005420"), null);
    assert.equal(await users.findById("41 OR 1=1"), undefined);
  } finally {
    await db.destroy(); // MySQL drops only this connection's temporary table.
    try {
      assert.ok(
        before === (await fingerprint()),
        "A base original deve permanecer intacta.",
      );
    } finally {
      await observer.promise().end();
    }
  }
});
