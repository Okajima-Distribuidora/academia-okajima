import { spawn } from "node:child_process";

import { config } from "dotenv";
import mysql from "mysql2/promise";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL nao foi encontrada em .env.local.");
  process.exit(1);
}

let connection;

try {
  connection = await mysql.createConnection(databaseUrl);
  const [rows] = await connection.query(
    "select version() as version, @@version_comment as comment",
  );
  const version = String(rows[0]?.version ?? "");
  const comment = String(rows[0]?.comment ?? "");

  if (version.startsWith("5.7.")) {
    console.error(
      [
        `Prisma Studio nao e compativel com o banco local atual: MySQL ${version} (${comment}).`,
        "O Studio usado pelo Prisma 7 consulta metadados com SQL que o MySQL 5.7 nao entende.",
        "Use um cliente MySQL comum para este banco legado ou rode o Studio contra um MySQL 8+.",
      ].join("\n"),
    );
    process.exit(1);
  }
} catch (error) {
  console.error(
    `Nao foi possivel verificar a versao do banco antes de abrir o Prisma Studio: ${error.message}`,
  );
  process.exit(1);
} finally {
  await connection?.end();
}

const prismaBin = process.platform === "win32" ? "prisma.cmd" : "prisma";
const child = spawn(prismaBin, ["studio"], {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
