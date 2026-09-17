import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export const SESSION_COOKIE = 'contextos_session';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
export function hashPassword(password: string, salt = randomBytes(16).toString('hex')): string {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: string, encoded: string): boolean {
  const [salt, expected] = encoded.split(':');
  if (!salt || !expected) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), scryptSync(password, salt, 64));
}
