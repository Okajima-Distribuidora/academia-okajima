import "server-only";

// This milestone must never connect to the legacy/production database.
export function localDatabaseConfig(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL não configurada.");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("DATABASE_URL inválida."); }
  if (url.protocol !== "mysql:" || url.hostname !== "127.0.0.1" ||
      url.port !== "3307" || url.pathname !== "/academia_local" ||
      url.search || url.hash || !url.username || !url.password) {
    throw new Error("Este marco permite apenas o MySQL local esperado.");
  }
  return {
    host: url.hostname, port: 3307, database: "academia_local",
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    charset: "utf8mb4", connectionLimit: 5, maxIdle: 5, idleTimeout: 60_000,
    connectTimeout: 5_000, waitForConnections: true, queueLimit: 20,
    multipleStatements: false,
  };
}
