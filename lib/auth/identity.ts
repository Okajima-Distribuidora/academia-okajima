import { isLoginEmail } from "./validation";

export interface Account {
  id: number;
  username: string;
  codigorca: string;
  email: string;
  password: string | null;
  active: number;
  admin: number;
  two_factor: number;
  must_change_password?: number;
}

export type AccountState = Omit<Account, "password">;
export interface AuthIdentity {
  id: string;
  name: string;
  email: string | null;
  codigorca: string;
  isStudioAdmin: boolean;
  mustChangePassword?: true;
}

export function canSignIn(account: AccountState): boolean {
  return account.active === 1 && account.two_factor === 0;
}

export function canAccessStudio(account: AccountState): boolean {
  return canSignIn(account) && account.admin === 1;
}

export function publicIdentity(account: AccountState): AuthIdentity {
  return {
    id: String(account.id),
    name: account.username || account.codigorca,
    email: isLoginEmail(account.email) ? account.email : null,
    codigorca: account.codigorca,
    isStudioAdmin: account.admin === 1,
    ...(account.must_change_password === 1 ? { mustChangePassword: true } : {}),
  };
}
