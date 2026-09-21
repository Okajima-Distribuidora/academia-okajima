import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authenticateCredentials,
  currentIdentity,
} from "../../lib/auth/credentials";
import type { Account } from "../../lib/auth/identity";
import {
  academiaCookies,
  SESSION_MAX_AGE,
  safeAuthRedirect,
} from "../../lib/auth/options";
import { PasswordUtils } from "../../lib/auth/password";
import {
  getLoginLimiter,
  LOCAL_ORIGIN,
  LOGIN_WINDOW_MS,
  LocalLoginLimiter,
  RateLimitError,
} from "../../lib/auth/rate-limit";
import type { UsersRepository } from "../../lib/auth/users";
import { credentialsSchema, isLoginEmail } from "../../lib/auth/validation";
import { databaseConfig } from "../../lib/db/config";
import { PHP_TEST_HASH, PHP_TEST_PASSWORD } from "./fixtures";

const account: Account = {
  id: 41,
  username: "Exibição",
  codigorca: "005420",
  email: "fixture@academia.test",
  password: PHP_TEST_HASH,
  active: 1,
  admin: 1,
  two_factor: 0,
};
const repository = (rows: Account[]): UsersRepository => ({
  findCandidates: async (id) =>
    rows.filter(
      (r) => r.codigorca === id || (isLoginEmail(id) && r.email === id),
    ),
  findById: async (id) => rows.find((r) => String(r.id) === id),
});
const login = (
  identifier: unknown,
  password: unknown,
  rows = [account],
  limiter = new LocalLoginLimiter(),
) =>
  authenticateCredentials({ identifier, password }, repository(rows), limiter);

test("bcrypt PHP 2y custo 10 é verificado sem editar prefixo", async () => {
  assert.equal(
    await PasswordUtils.comparePassword(PHP_TEST_PASSWORD, PHP_TEST_HASH),
    true,
  );
  assert.equal(
    await PasswordUtils.comparePassword("incorreta", PHP_TEST_HASH),
    false,
  );
});
test("novos hashes 2b custo 12, salt aleatório e entrada original", async () => {
  const password = "  aspas'\\&{{teste}}\n日本  ";
  const [a, b] = await Promise.all([
    PasswordUtils.hashPassword(password),
    PasswordUtils.hashPassword(password),
  ]);
  assert.ok(a.startsWith("$2b$12$") && b.startsWith("$2b$12$"));
  assert.ok(a !== b);
  assert.equal(await PasswordUtils.comparePassword(password, a), true);
  assert.equal(await PasswordUtils.comparePassword(password, b), true);
  assert.equal(await PasswordUtils.comparePassword(password.trim(), a), false);
});
test("72 bytes UTF-8: aceita limite e recusa truncamento na criação", async () => {
  const exact = "é".repeat(36);
  assert.equal(Buffer.byteLength(exact), 72);
  assert.equal(
    await PasswordUtils.comparePassword(
      exact,
      await PasswordUtils.hashPassword(exact),
    ),
    true,
  );
  await assert.rejects(PasswordUtils.hashPassword(exact + "a"));
  await assert.rejects(PasswordUtils.hashPassword("a".repeat(73)));
  await assert.rejects(PasswordUtils.hashPassword(""));
});
test("não aplica fallback PT_Secure nem aceita outros algoritmos", async () => {
  const transformed = await PasswordUtils.hashPassword("teste&amp;123");
  assert.equal(
    await PasswordUtils.comparePassword("teste&123", transformed),
    false,
  );
  for (const hash of [
    null,
    "",
    "senha",
    "a".repeat(40),
    "$2y$10$malformado",
    "$2x$10$" + "a".repeat(53),
    "$2b$99$" + "a".repeat(53),
  ]) {
    assert.equal(await PasswordUtils.comparePassword("senha", hash), false);
  }
});
test("RCA e e-mail retornam mesma identidade mínima; RCA mantém zeros", async () => {
  const rca = await login("  005420  ", PHP_TEST_PASSWORD);
  const email = await login(account.email, PHP_TEST_PASSWORD);
  assert.deepEqual(rca, {
    id: "41",
    name: "Exibição",
    codigorca: "005420",
    email: account.email,
    isStudioAdmin: true,
  });
  assert.deepEqual(email, rca);
  assert.equal(await login("5420", PHP_TEST_PASSWORD), null);
});
test("identidade expõe permissão de Studio somente para admin legado", async () => {
  assert.equal(
    (await login(account.codigorca, PHP_TEST_PASSWORD, [account]))
      ?.isStudioAdmin,
    true,
  );
  assert.equal(
    (
      await login(account.codigorca, PHP_TEST_PASSWORD, [
        { ...account, admin: 0 },
      ])
    )?.isStudioAdmin,
    false,
  );
});
test("não usa username, telefone, e-mail marcador ou SQL como identificadores extras", async () => {
  for (const input of [
    "Exibição",
    "11999999999",
    "0",
    "' OR 1=1 --",
    "desconhecido",
  ]) {
    assert.equal(
      await login(input, PHP_TEST_PASSWORD, [{ ...account, email: "0" }]),
      null,
    );
  }
});
test("recusa senha errada, campos ausentes, tipos errados e limites de entrada", async () => {
  for (const [id, password] of [
    [account.codigorca, "errada"],
    [undefined, undefined],
    [1, PHP_TEST_PASSWORD],
    [account.codigorca, ""],
    ["x".repeat(256), "x"],
    [account.codigorca, "a".repeat(1025)],
  ]) {
    assert.equal(await login(id, password), null);
  }
  assert.equal(
    credentialsSchema.parse({ identifier: " 005420 ", password: " a " })
      .password,
    " a ",
  );
});
test("recusa active != 1 e two_factor != 0 sem revelar motivo", async () => {
  for (const state of [
    { active: 0 },
    { active: 2 },
    { two_factor: 1 },
    { two_factor: 2 },
  ]) {
    assert.equal(
      await login(account.codigorca, PHP_TEST_PASSWORD, [
        { ...account, ...state },
      ]),
      null,
    );
  }
});
test("duplicidade e colisão RCA/email nunca são desempatadas pela senha/estado", async () => {
  assert.equal(
    await login(account.codigorca, PHP_TEST_PASSWORD, [
      account,
      { ...account, id: 42, active: 0 },
    ]),
    null,
  );
  assert.equal(
    await login(account.email, PHP_TEST_PASSWORD, [
      account,
      {
        ...account,
        id: 42,
        codigorca: account.email,
        email: "outra@academia.test",
        password: "inválido",
      },
    ]),
    null,
  );
});
test("estado vivo: mudança de e-mail mantém ID; remoção, desativação e 2FA recusam", async () => {
  const rows = [{ ...account }];
  const users = repository(rows);
  rows[0].email = "novo@academia.test";
  assert.equal((await currentIdentity("41", users))?.email, rows[0].email);
  rows[0].active = 0;
  assert.equal(await currentIdentity("41", users), null);
  rows[0].active = 1;
  rows[0].two_factor = 1;
  assert.equal(await currentIdentity("41", users), null);
  rows.pop();
  assert.equal(await currentIdentity("41", users), null);
});
test("falha de banco nunca libera acesso", async () => {
  const users: UsersRepository = {
    findCandidates: async () => {
      throw Error("offline");
    },
    findById: async () => {
      throw Error("offline");
    },
  };
  await assert.rejects(
    authenticateCredentials(
      { identifier: "005420", password: "x" },
      users,
      new LocalLoginLimiter(),
    ),
  );
  await assert.rejects(currentIdentity("41", users));
});
test("limite por conta cobre alternância RCA/email; libera depois do TTL", async () => {
  let now = 0;
  const limiter = new LocalLoginLimiter(() => now);
  for (let i = 0; i < 5; i++)
    await login(
      i % 2 ? account.email : account.codigorca,
      "errada",
      [account],
      limiter,
    );
  await assert.rejects(
    login(account.email, PHP_TEST_PASSWORD, [account], limiter),
    RateLimitError,
  );
  now += LOGIN_WINDOW_MS;
  assert.equal(
    (await login(account.codigorca, PHP_TEST_PASSWORD, [account], limiter))?.id,
    "41",
  );
});
test("limites agregado, identificador e capacidade são fechados", () => {
  const limiter = new LocalLoginLimiter();
  for (let i = 0; i < 30; i++) limiter.consumeOrigin("origem");
  assert.throws(() => limiter.consumeOrigin("origem"), RateLimitError);
  for (let i = 0; i < 5; i++) limiter.consumeIdentifier("outra", "ADMIN");
  assert.throws(
    () => limiter.consumeIdentifier("outra", "admin"),
    RateLimitError,
  );
  const tiny = new LocalLoginLimiter(Date.now, 1);
  tiny.consumeOrigin("a");
  assert.throws(() => tiny.consumeOrigin("b"), RateLimitError);
});
test("35 logins corretos na mesma janela não esgotam nenhum limite", async () => {
  const limiter = new LocalLoginLimiter(() => 0);
  for (let i = 0; i < 35; i++) {
    const identifier = i % 2 ? account.email : account.codigorca;
    assert.equal(
      (await login(identifier, PHP_TEST_PASSWORD, [account], limiter))?.id,
      "41",
    );
  }
});
test("sucessos não consomem vagas nem apagam falhas anteriores da conta", async () => {
  const limiter = new LocalLoginLimiter();
  for (let i = 0; i < 4; i++)
    assert.equal(
      await login(account.codigorca, "errada", [account], limiter),
      null,
    );
  for (let i = 0; i < 3; i++) {
    assert.equal(
      (await login(account.email, PHP_TEST_PASSWORD, [account], limiter))?.id,
      "41",
    );
  }
  assert.equal(await login(account.email, "errada", [account], limiter), null);
  await assert.rejects(
    login(account.codigorca, PHP_TEST_PASSWORD, [account], limiter),
    RateLimitError,
  );
});
test("sucesso não zera o limite agregado de falhas de outros identificadores", async () => {
  const limiter = new LocalLoginLimiter();
  for (let i = 0; i < 29; i++)
    assert.equal(await login(`desconhecido-${i}`, "errada", [], limiter), null);
  assert.equal(
    (await login(account.codigorca, PHP_TEST_PASSWORD, [account], limiter))?.id,
    "41",
  );
  assert.equal(await login("outra-falha", "errada", [], limiter), null);
  await assert.rejects(
    login(account.codigorca, PHP_TEST_PASSWORD, [account], limiter),
    RateLimitError,
  );
});
test("requisições simultâneas reservam vagas antes da consulta e liberam no sucesso", async () => {
  const limiter = new LocalLoginLimiter();
  let unblock!: () => void;
  const gate = new Promise<void>((resolve) => {
    unblock = resolve;
  });
  let queries = 0;
  const users: UsersRepository = {
    ...repository([account]),
    findCandidates: async () => {
      queries++;
      await gate;
      return [account];
    },
  };
  const input = { identifier: account.codigorca, password: PHP_TEST_PASSWORD };
  const pending = Array.from({ length: 5 }, () =>
    authenticateCredentials(input, users, limiter),
  );
  try {
    await assert.rejects(
      authenticateCredentials(input, users, limiter),
      RateLimitError,
    );
    assert.equal(queries, 5);
  } finally {
    unblock();
  }
  assert.ok(
    (await Promise.all(pending)).every((identity) => identity?.id === "41"),
  );
  assert.equal(
    (await login(account.codigorca, PHP_TEST_PASSWORD, [account], limiter))?.id,
    "41",
  );
});
test("falhas operacionais liberam as reservas sem liberar acesso", async () => {
  const limiter = new LocalLoginLimiter();
  const users: UsersRepository = {
    ...repository([account]),
    findCandidates: async () => {
      throw new Error("offline");
    },
  };
  for (let i = 0; i < 35; i++) {
    await assert.rejects(
      authenticateCredentials(
        { identifier: account.codigorca, password: "x" },
        users,
        limiter,
      ),
      /offline/,
    );
  }
  assert.equal(
    (await login(account.codigorca, PHP_TEST_PASSWORD, [account], limiter))?.id,
    "41",
  );
});
test("pedidos já bloqueados não acumulam reservas parciais na origem", async () => {
  const limiter = new LocalLoginLimiter();
  for (let i = 0; i < 5; i++)
    assert.equal(await login("desconhecido", "errada", [], limiter), null);
  for (let i = 0; i < 35; i++) {
    await assert.rejects(
      login("desconhecido", "errada", [], limiter),
      RateLimitError,
    );
  }
  assert.equal(
    (await login(account.codigorca, PHP_TEST_PASSWORD, [account], limiter))?.id,
    "41",
  );
});
test("liberação é idempotente, recupera capacidade e não altera uma nova janela", () => {
  const limiter = new LocalLoginLimiter();
  const release = limiter.consumeIdentifier(LOCAL_ORIGIN, "admin");
  for (let i = 0; i < 4; i++) limiter.consumeIdentifier(LOCAL_ORIGIN, "admin");
  release();
  release();
  limiter.consumeIdentifier(LOCAL_ORIGIN, "admin");
  assert.throws(
    () => limiter.consumeIdentifier(LOCAL_ORIGIN, "admin"),
    RateLimitError,
  );

  const tiny = new LocalLoginLimiter(Date.now, 1);
  tiny.consumeOrigin("a")();
  assert.doesNotThrow(() => tiny.consumeOrigin("b"));

  let now = 0;
  const timed = new LocalLoginLimiter(() => now);
  const lateRelease = timed.consumeIdentifier(LOCAL_ORIGIN, "admin");
  now += LOGIN_WINDOW_MS;
  for (let i = 0; i < 5; i++) timed.consumeIdentifier(LOCAL_ORIGIN, "admin");
  lateRelease();
  assert.throws(
    () => timed.consumeIdentifier(LOCAL_ORIGIN, "admin"),
    RateLimitError,
  );
});
test("o cache da política nova é reutilizado entre chamadas", () => {
  assert.equal(getLoginLimiter(), getLoginLimiter());
});
test("aceita uma URL MySQL completa e recusa formatos inválidos", () => {
  const url = "mysql://synthetic:synthetic@127.0.0.1:3307/academia_local";
  assert.equal(databaseConfig(url).connectionLimit, 1);
  assert.deepEqual(databaseConfig("mysql://user:pass@db.example.test:3306/production"), {
    host: "db.example.test",
    port: 3306,
    database: "production",
    user: "user",
    password: "pass",
    charset: "utf8mb4",
    connectionLimit: 1,
    maxIdle: 1,
    idleTimeout: 60_000,
    connectTimeout: 5_000,
    waitForConnections: true,
    queueLimit: 0,
    multipleStatements: false,
  });
  for (const invalid of [
    undefined,
    "inválida",
    url + "?host=example.test",
    url.replace("mysql:", "postgres:"),
    "mysql://user:pass@/database",
  ]) {
    assert.throws(() => databaseConfig(invalid));
  }
});
test("cookies próprios seguros, sessão 8h e redirects restritos", () => {
  assert.equal(SESSION_MAX_AGE, 28800);
  for (const secure of [false, true]) {
    const cookies = academiaCookies(secure);
    for (const cookie of Object.values(cookies)) {
      assert.ok(cookie.name.includes("academia-okajima."));
      assert.deepEqual(cookie.options, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure,
      });
    }
    assert.equal(cookies.csrfToken.name.startsWith("__Host-"), secure);
  }
  for (const url of [
    "https://evil.test/",
    "//evil.test/",
    "/outra",
    "/login?callbackUrl=https://evil.test",
  ]) {
    const result = safeAuthRedirect(url, "http://localhost:3000");
    assert.ok(
      ["http://localhost:3000/", "http://localhost:3000/login"].includes(
        result,
      ),
    );
  }
});
