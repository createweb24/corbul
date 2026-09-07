/**
 * Limitele coloanelor `Int` din Prisma (int4 în PostgreSQL). Un id peste
 * această valoare ajunge la driver și produce 500 în loc de 400/404.
 */
export const INT32_MAX = 2_147_483_647;

/** `true` pentru un întreg pozitiv care încape într-un `Int` Prisma. */
export function isDatabaseId(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= INT32_MAX;
}
