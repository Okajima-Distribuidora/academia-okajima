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
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    connectTimeout: 5_000,
    waitForConnections: true,
    queueLimit: 20,
    multipleStatements: false,
  };
}
