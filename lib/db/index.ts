import "server-only";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { localDatabaseConfig } from "./config";
import type { Database } from "./types";

const shared = globalThis as typeof globalThis & { academiaDb?: Kysely<Database> };

export function getDb(): Kysely<Database> {
  if (!shared.academiaDb) {
    shared.academiaDb = new Kysely<Database>({
      dialect: new MysqlDialect({ pool: createPool(localDatabaseConfig(process.env.DATABASE_URL)) }),
    });
  }
  return shared.academiaDb;
}
