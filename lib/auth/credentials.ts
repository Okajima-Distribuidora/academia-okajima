import "server-only";
import { canSignIn, publicIdentity, type AuthIdentity } from "./identity";
import { PasswordUtils } from "./password";
import { LOCAL_ORIGIN, type LocalLoginLimiter } from "./rate-limit";
import type { UsersRepository } from "./users";
import { credentialsSchema } from "./validation";

export async function authenticateCredentials(
  input: unknown, users: UsersRepository, limiter: LocalLoginLimiter,
): Promise<AuthIdentity | null> {
  const reservations: Array<() => void> = [];
  let failedCredentials = false;
  const rejectCredentials = () => {
    failedCredentials = true;
    return null;
  };
  try {
    reservations.push(limiter.consumeOrigin(LOCAL_ORIGIN));
    const parsed = credentialsSchema.safeParse(input);
    if (!parsed.success) return rejectCredentials();
    const { identifier, password } = parsed.data;
    reservations.push(limiter.consumeIdentifier(LOCAL_ORIGIN, identifier));
    const candidates = await users.findCandidates(identifier);
    if (candidates.length !== 1) return rejectCredentials();
    const account = candidates[0];
    reservations.push(limiter.consumeAccount(LOCAL_ORIGIN, account.id));
    if (!canSignIn(account)) return rejectCredentials();
    if (!await PasswordUtils.comparePassword(password, account.password)) return rejectCredentials();
    return publicIdentity(account);
  } finally {
    // Success, unavailable services and requests rejected by the limiter do not
    // become credential failures. Pending requests still occupy their slots.
    if (!failedCredentials) for (const release of reservations) release();
  }
}

export async function currentIdentity(id: string, users: UsersRepository): Promise<AuthIdentity | null> {
  const account = await users.findById(id);
  return account && canSignIn(account) ? publicIdentity(account) : null;
}
