import "server-only";

export function databaseConfig(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL não configurada.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL inválida.");
  }
  const port = Number(url.port || "3306");
  const database = decodeURIComponent(url.pathname.slice(1));
  if (
    url.protocol !== "mysql:" ||
    !url.hostname ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !database ||
    url.search ||
    url.hash ||
    !url.username ||
    !url.password
  )
    throw new Error("DATABASE_URL inválida.");
  return {
    host: url.hostname,
    port,
    database,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    charset: "utf8mb4",
    // Vercel may run multiple serverless instances at once. Kysely and
    // Prisma each own a pool, so keep each pool to one connection to stay
    // within the shared MySQL account limit across instances.
    connectionLimit: 1,
    maxIdle: 1,
    idleTimeout: 60_000,
    connectTimeout: 5_000,
    waitForConnections: true,
    // Queries wait for the single connection instead of failing during a
    // burst of concurrent server-rendered requests. In mysql2, zero is
    // an unbounded queue.
    queueLimit: 0,
    multipleStatements: false,
  };
}
