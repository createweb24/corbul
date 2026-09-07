/**
 * Transliterare + normalizare pentru slug-uri.
 * Acoperă diacriticele românești (ă â î ș ț, inclusiv variantele cu sedilă
 * din Unicode legacy) și alfabetul chirilic rusesc.
 */

const ROMANIAN_MAP: Record<string, string> = {
  ă: 'a',
  â: 'a',
  î: 'i',
  ș: 's',
  ş: 's', // s cu sedilă (legacy)
  ț: 't',
  ţ: 't', // t cu sedilă (legacy)
  Ă: 'a',
  Â: 'a',
  Î: 'i',
  Ș: 's',
  Ş: 's',
  Ț: 't',
  Ţ: 't',
};

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

const EXTRA_MAP: Record<string, string> = {
  ä: 'a',
  ö: 'o',
  ü: 'u',
  ß: 'ss',
  é: 'e',
  è: 'e',
  ê: 'e',
  ç: 'c',
  ñ: 'n',
  '&': '-si-',
  '@': '-at-',
  '№': 'nr',
};

export function transliterate(input: string): string {
  let out = '';
  for (const char of input) {
    const lower = char.toLowerCase();
    const mapped =
      ROMANIAN_MAP[char] ??
      CYRILLIC_MAP[lower] ??
      EXTRA_MAP[lower] ??
      undefined;
    out += mapped !== undefined ? mapped : char;
  }
  return out;
}

/**
 * „Rețeaua offshore & licitațiile" → „reteaua-offshore-si-licitatiile"
 */
export function slugify(input: string): string {
  return transliterate(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 120)
    .replace(/-+$/g, '');
}

/**
 * Garantează unicitatea față de o listă de slug-uri deja existente.
 */
export function uniqueSlug(input: string, taken: readonly string[]): string {
  const base = slugify(input) || 'articol';
  if (!taken.includes(base)) return base;
  let i = 2;
  while (taken.includes(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
