import "server-only";
import type { Kysely } from "kysely";
import type { Database } from "../db/types";
import type { Account, AccountState } from "./identity";
import { isLoginEmail } from "./validation";

const STATE_COLUMNS = [
  "id",
  "username",
  "codigorca",
  "email",
  "active",
  "admin",
  "two_factor",
  "must_change_password",
] as const;
export interface UsersRepository {
  findCandidates(identifier: string): Promise<Account[]>;
  findById(id: string): Promise<AccountState | undefined>;
}

export function createUsersRepository(db: Kysely<Database>): UsersRepository {
  return {
    async findCandidates(identifier) {
      if (
        !identifier ||
        identifier.length > 255 ||
        (identifier.length > 32 && !isLoginEmail(identifier))
      )
        return [];
      return db
        .selectFrom("users")
        .select([...STATE_COLUMNS, "password"])
        .where((eb) =>
          eb.or([
            ...(identifier.length <= 32
              ? [eb("codigorca", "=", identifier)]
              : []),
            ...(isLoginEmail(identifier) ? [eb("email", "=", identifier)] : []),
          ]),
        )
        .limit(2)
        .execute();
    },
    async findById(id) {
      if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))
        return undefined;
      return db
        .selectFrom("users")
        .select(STATE_COLUMNS)
        .where("id", "=", Number(id))
        .executeTakeFirst();
    },
  };
}
