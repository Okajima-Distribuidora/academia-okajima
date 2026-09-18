import "server-only";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { databaseConfig } from "./config";

const shared = globalThis as typeof globalThis & {
  academiaPrisma?: PrismaClient;
};

export function getPrisma(): PrismaClient {
  if (!shared.academiaPrisma) {
    const config = databaseConfig(process.env.DATABASE_URL);
    const adapter = new PrismaMariaDb({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: config.connectionLimit,
    });

    shared.academiaPrisma = new PrismaClient({ adapter });
  }

  return shared.academiaPrisma;
}
