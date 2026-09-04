import "server-only";
export const SESSION_MAX_AGE = 8 * 60 * 60;

export function academiaCookies(secure: boolean) {
  const options = { httpOnly: true, sameSite: "lax" as const, path: "/", secure };
  return {
    sessionToken: { name: `${secure ? "__Secure-" : ""}academia-okajima.session-token`, options },
    callbackUrl: { name: `${secure ? "__Secure-" : ""}academia-okajima.callback-url`, options },
    csrfToken: { name: `${secure ? "__Host-" : ""}academia-okajima.csrf-token`, options },
  };
}

export function safeAuthRedirect(url: string, baseUrl: string) {
  try {
    const target = new URL(url, baseUrl);
    if (target.origin === new URL(baseUrl).origin && ["/", "/login"].includes(target.pathname)) {
      return `${baseUrl}${target.pathname}`;
    }
  } catch { /* Untrusted redirect: use the fixed home page. */ }
  return `${baseUrl}/`;
}
