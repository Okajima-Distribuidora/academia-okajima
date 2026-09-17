import "server-only";
import { randomInt } from "node:crypto";
import * as bcrypt from "bcryptjs";

export const PASSWORD_HASH_COST = 12;
const BCRYPT_FORMAT = /^\$2[aby]\$(0[4-9]|[12][0-9]|3[01])\$[./A-Za-z0-9]{53}$/;

export class PasswordUtils {
  static generateTemporaryPassword(): string {
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    return Array.from(
      { length: 18 },
      () => alphabet[randomInt(alphabet.length)],
    ).join("");
  }

  static async hashPassword(password: string): Promise<string> {
    if (
      typeof password !== "string" ||
      !password.length ||
      bcrypt.truncates(password)
    ) {
      throw new Error("A senha nova deve ter entre 1 e 72 bytes UTF-8.");
    }
    return bcrypt.hash(password, PASSWORD_HASH_COST);
  }

  static async comparePassword(
    password: string,
    hash: string | null,
  ): Promise<boolean> {
    if (
      typeof password !== "string" ||
      !password.length ||
      typeof hash !== "string" ||
      !BCRYPT_FORMAT.test(hash)
    )
      return false;
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
}
