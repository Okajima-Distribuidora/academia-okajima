import type { AuthIdentity } from "@/lib/auth/identity";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User { codigorca: string }
  interface Session { user: AuthIdentity }
}
declare module "next-auth/jwt" {
  interface JWT { identity?: AuthIdentity }
}
