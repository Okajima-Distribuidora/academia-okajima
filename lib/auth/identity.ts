import type { Selectable } from "kysely";
import type { UsersTable } from "../db/types";
import { isLoginEmail } from "./validation";

export type Account = Selectable<UsersTable>;
export type AccountState = Omit<Account, "password">;
export interface AuthIdentity { id: string; name: string; email: string | null; codigorca: string }

export function canSignIn(account: AccountState): boolean {
  return account.active === 1 && account.two_factor === 0;
}

export function publicIdentity(account: AccountState): AuthIdentity {
  return {
    id: String(account.id), name: account.username || account.codigorca,
    email: isLoginEmail(account.email) ? account.email : null,
    codigorca: account.codigorca,
  };
}
