import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { encode } from "next-auth/jwt";
import { SESSION_MAX_AGE } from "../../lib/auth/options";

test("HTTP local: Credentials, CSRF, sessão, expiração, adulteração, update, logout e limite", {
  skip: process.env.AUTH_TEST_HTTP !== "1",
}, async () => {
  const base = "http://localhost:3000";
  assert.equal(
    process.env.AUTH_URL,
    base,
    "Execute apenas no servidor local esperado.",
  );
  const secret = process.env.AUTH_SECRET;
  const password = process.env.AUTH_DEV_SEED_PASSWORD;
  assert.ok(
    secret && password,
    "Configure o ambiente local sem imprimir segredos.",
  );
  const cookieName = "academia-okajima.session-token";
  let jar = new Map<string, string>();
  const request = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    const response = await fetch(base + path, {
      ...init,
      headers,
      redirect: "manual",
    });
    for (const line of response.headers.getSetCookie()) {
      const pair = line.split(";", 1)[0];
      const index = pair.indexOf("=");
      const name = pair.slice(0, index),
        value = pair.slice(index + 1);
      if (!value) jar.delete(name);
      else jar.set(name, value);
    }
    return response;
  };
  const csrf = async (): Promise<string> =>
    (await (await request("/api/auth/csrf")).json()).csrfToken;
  const signin = async (identifier: string, value: string, csrfToken = "") => {
    const body = new URLSearchParams({
      identifier,
      password: value,
      csrfToken: csrfToken || (await csrf()),
      callbackUrl: base + "/",
    });
    return request("/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Auth-Return-Redirect": "1",
      },
      body,
    });
  };
  const session = async () => (await request("/api/auth/session")).json();
  const anonymous = await request("/");
  assert.ok([302, 303, 307].includes(anonymous.status));
  assert.ok(anonymous.headers.get("location")?.includes("/login"));
  await signin("admin", password, "invalid-csrf");
  assert.equal(await session(), null);

  let userId = "";
  // More than five successful logins in one window must not lock the account.
  for (const identifier of Array.from({ length: 8 }, (_, i) =>
    i % 2 ? "admin@academia.test" : "admin",
  )) {
    const response = await signin(identifier, password);
    const result = await response.json();
    assert.equal(result.url, base + "/");
    const cookies = response.headers.getSetCookie();
    assert.ok(
      cookies.some(
        (v) =>
          v.startsWith(cookieName + "=") &&
          /HttpOnly/i.test(v) &&
          /SameSite=Lax/i.test(v),
      ),
    );
    const active = await session();
    assert.ok(active?.user?.id, "A conta local deve autenticar.");
    if (userId) assert.equal(active.user.id, userId);
    else userId = active.user.id;
    assert.deepEqual(Object.keys(active.user).sort(), [
      "codigorca",
      "email",
      "id",
      "isStudioAdmin",
      "name",
    ]);
    const remaining = (Date.parse(active.expires) - Date.now()) / 1000;
    assert.ok(remaining <= SESSION_MAX_AGE && remaining > SESSION_MAX_AGE - 10);
    assert.equal((await request("/")).status, 200);
  }
  const goodJar = new Map(jar);

  // Server-only identity is refreshed by ID, ignoring the submitted replacement.
  const update = await request("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      csrfToken: await csrf(),
      data: { user: { id: "999999", admin: 1 }, sub: "999999" },
    }),
  });
  assert.equal((await update.json()).user.id, userId);

  const renewed = await request("/api/auth/session");
  assert.ok(
    renewed.headers
      .getSetCookie()
      .some((line) => line.startsWith(cookieName + "=")),
  );

  const invalidTokens = [
    "invalid-token",
    await encode({
      secret,
      salt: cookieName,
      token: { sub: userId },
      maxAge: -120,
    }),
    await encode({
      secret: randomBytes(48).toString("base64url"),
      salt: cookieName,
      token: { sub: userId },
    }),
    await encode({ secret, salt: cookieName, token: { sub: "2147483647" } }),
  ];
  for (const token of invalidTokens) {
    jar = new Map([[cookieName, token]]);
    assert.equal(await session(), null);
    assert.ok([302, 303, 307].includes((await request("/")).status));
  }
  jar = new Map([["authjs.session-token", "unrelated-dashboard-cookie"]]);
  assert.equal(await session(), null);
  assert.equal(jar.get("authjs.session-token"), "unrelated-dashboard-cookie");

  jar = goodJar;
  const logout = await request("/api/auth/signout", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      csrfToken: await csrf(),
      callbackUrl: base + "/login",
    }),
  });
  assert.equal((await logout.json()).url, base + "/login");
  assert.equal(await session(), null);
  assert.ok([302, 303, 307].includes((await request("/")).status));

  const unknown = `qa-${randomBytes(5).toString("hex")}`;
  for (let i = 0; i < 6; i++) {
    const result = await (
      await signin(unknown, "synthetic-wrong-password")
    ).json();
    const url = new URL(result.url);
    assert.equal(url.searchParams.get("error"), "CredentialsSignin");
    assert.equal(
      url.searchParams.get("code"),
      i === 5 ? "rate_limited" : "credentials",
    );
  }
  assert.equal(await session(), null);
  const large = await request("/api/auth/callback/credentials", {
    method: "POST",
    body: "x".repeat(17000),
  });
  assert.equal(large.status, 413);
});
