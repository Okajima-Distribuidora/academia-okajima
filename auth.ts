import "server-only";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  authenticateCredentials,
  currentIdentity,
} from "@/lib/auth/credentials";
import {
  academiaCookies,
  SESSION_MAX_AGE,
  safeAuthRedirect,
} from "@/lib/auth/options";
import { getLoginLimiter, RateLimitError } from "@/lib/auth/rate-limit";
import { createUsersRepository } from "@/lib/auth/users";
import { getDb } from "@/lib/db";

class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}
class LoginUnavailable extends CredentialsSignin {
  code = "unavailable";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  cookies: academiaCookies(
    process.env.AUTH_URL?.startsWith("https://") ??
      process.env.NODE_ENV === "production",
  ),
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "RCA ou e-mail", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(input) {
        try {
          return await authenticateCredentials(
            input,
            createUsersRepository(getDb()),
            getLoginLimiter(),
          );
        } catch (error) {
          if (error instanceof RateLimitError) throw new TooManyAttempts();
          // Never log an exception that may contain SQL, input or connection secrets.
          console.error("[academia-auth] login_unavailable");
          throw new LoginUnavailable();
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const id = user?.id ?? token.sub;
      if (!id) return null;
      try {
        const identity = await currentIdentity(
          id,
          createUsersRepository(getDb()),
        );
        return identity ? { sub: identity.id, identity } : null;
      } catch {
        console.error("[academia-auth] session_unavailable");
        return null;
      }
    },
    session({ session, token }) {
      // Only issued after jwt has supplied a live identity; fail closed otherwise.
      if (!token.identity) throw new Error("Sessão indisponível.");
      return { expires: session.expires, user: token.identity };
    },
    redirect: ({ url, baseUrl }) => safeAuthRedirect(url, baseUrl),
  },
  logger: {
    error(error) {
      if (error instanceof CredentialsSignin) return;
      console.error("[academia-auth] authentication_error");
    },
  },
});
