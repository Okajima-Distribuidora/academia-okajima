import "server-only";

import { getDb } from "@/lib/db";
import { PasswordUtils } from "./password";

export async function changeTemporaryPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  if (!/^[1-9]\d*$/.test(userId) || !Number.isSafeInteger(Number(userId))) {
    return false;
  }

  const passwordHash = await PasswordUtils.hashPassword(password);
  const result = await getDb()
    .updateTable("users")
    .set({ must_change_password: 0, password: passwordHash })
    .where("id", "=", Number(userId))
    .where("must_change_password", "=", 1)
    .executeTakeFirst();

  return Number(result.numUpdatedRows) === 1;
}
