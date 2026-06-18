// Server-only helpers for the cookie that grants access to a password-protected
// public report. The cookie value is an HMAC over the token + password hash, so
// it cannot be forged and is invalidated when the password changes.
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.NEXTAUTH_SECRET ?? "reisebericht-dev-secret";

export function shareCookieName(token: string): string {
  return `share-access-${token}`;
}

export function signShareAccess(token: string, passwordHash: string): string {
  return createHmac("sha256", SECRET)
    .update(`${token}:${passwordHash}`)
    .digest("hex");
}

export function verifyShareAccess(
  token: string,
  passwordHash: string,
  cookieValue: string | undefined,
): boolean {
  if (!cookieValue) return false;
  const expected = signShareAccess(token, passwordHash);
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
