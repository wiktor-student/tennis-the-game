import { createHash, randomBytes, randomInt } from 'node:crypto';

export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newSeed(): string {
  return randomBytes(16).toString('hex');
}

export function defaultDisplayName(): string {
  return `Kibic ${randomInt(1000, 9999)}`;
}
