/** Concatenare de clase — fără dependențe externe (SPEC §0.6). */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  let out = "";
  for (const value of values) {
    if (!value) continue;
    out = out ? `${out} ${value}` : value;
  }
  return out;
}

export default cn;
