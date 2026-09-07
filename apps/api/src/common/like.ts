/**
 * Prisma nu escapează metacaracterele LIKE (`%`, `_`, `\`) în `contains`
 * pe PostgreSQL: o căutare după „50%” sau „___” ar potrivi orice.
 * Escape-ul implicit al lui Postgres este backslash-ul.
 */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (char) => `\\${char}`);
}
