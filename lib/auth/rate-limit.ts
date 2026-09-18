import "server-only";
import { createHmac, randomBytes } from "node:crypto";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export class RateLimitError extends Error {}

// Single-process development only. All clients share one trusted local origin.
// Do not accept X-Forwarded-For until a production proxy contract is defined.
export const LOCAL_ORIGIN = "local-development";
export class LocalLoginLimiter {
  private readonly buckets = new Map<
    string,
    { count: number; until: number }
  >();
  private readonly key = randomBytes(32);
  constructor(
    private readonly now = Date.now,
    private readonly maxEntries = 10_000,
  ) {}

  private consume(scope: string, value: string, limit: number): () => void {
    const now = this.now();
    for (const [key, entry] of this.buckets)
      if (entry.until <= now) this.buckets.delete(key);
    const key = createHmac("sha256", this.key)
      .update(JSON.stringify([scope, value]))
      .digest("hex");
    let entry = this.buckets.get(key);
    if (!entry) {
      // Fail closed at capacity; never evict a live limit to allow more attempts.
      if (this.buckets.size >= this.maxEntries) throw new RateLimitError();
      entry = { count: 0, until: now + LOGIN_WINDOW_MS };
      this.buckets.set(key, entry);
    }
    if (entry.count >= limit) throw new RateLimitError();
    entry.count++;

    // Reserve before async work to prevent parallel requests bypassing the limit.
    // Release only this attempt on success/operational error, never other failures.
    let released = false;
    return () => {
      if (released) return;
      released = true;
      // A late result must not decrement a replacement bucket after its TTL.
      if (this.buckets.get(key) !== entry) return;
      entry.count--;
      if (entry.count === 0) this.buckets.delete(key);
    };
  }

  consumeOrigin(origin: string) {
    return this.consume("origin", origin, 30);
  }
  consumeIdentifier(origin: string, identifier: string) {
    return this.consume(
      "identifier",
      JSON.stringify([origin, identifier.toLowerCase()]),
      5,
    );
  }
  consumeAccount(origin: string, id: number) {
    // RCA/email and collation aliases share this second limit before bcrypt.
    return this.consume("account", JSON.stringify([origin, id]), 5);
  }
}

// New cache namespace: the old counter included successes and cannot be migrated.
// Reset once when upgrading, then preserve failed-attempt limits across hot reloads.
const shared = globalThis as typeof globalThis & {
  academiaFailedLoginLimiterV2?: LocalLoginLimiter;
};
export function getLoginLimiter() {
  return (shared.academiaFailedLoginLimiterV2 ??= new LocalLoginLimiter());
}
