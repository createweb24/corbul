import { randomBytes } from 'node:crypto';

/** Token opac de cititor (hex, 32 de caractere) — SPEC §4. */
export function readerToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Identificator de sesiune pentru modul demonstrativ (fără chei Stripe).
 * Prefixul `demo_` este contractul pe care îl recunoaște
 * `GET /api/payments/session/:id`.
 */
export function demoSessionId(): string {
  return `demo_${randomBytes(12).toString('hex')}`;
}

export const DEMO_SESSION_PREFIX = 'demo_';

export function isDemoSessionId(id: string): boolean {
  return id.startsWith(DEMO_SESSION_PREFIX);
}
