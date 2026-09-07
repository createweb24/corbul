/** Formele setărilor publice — oglindesc `SettingsDto` din web (SPEC §3/§4). */

export type PartnerTier = 'bronze' | 'silver' | 'gold';

export interface LocalizedText {
  ro: string;
  ru: string;
}

export interface LocalizedList {
  ro: string[];
  ru: string[];
}

export interface PricingSettings {
  premiumMonthly: number;
  premiumAnnual: number;
  currency: string;
  tiers: Record<PartnerTier, number>;
}

export interface ContactSettings {
  email: string;
  phone: string;
  address_ro: string;
  address_ru: string;
}

/** Profilurile sociale ale redacției — `sameAs` în nodul Organization (EEAT). */
export interface SocialSettings {
  facebook: string;
  telegram: string;
  x: string;
  linkedin: string;
}

export const SOCIAL_KEYS: readonly (keyof SocialSettings)[] = [
  'facebook',
  'telegram',
  'x',
  'linkedin',
];

/** Răspunsul lui `GET /api/settings` — exact aceste 5 chei. */
export interface SettingsDto {
  tagline: LocalizedText;
  ticker: LocalizedList;
  pricing: PricingSettings;
  contact: ContactSettings;
  social: SocialSettings;
}

export interface SettingRowDto {
  key: string;
  value: unknown;
}

export const DEFAULT_SETTINGS: SettingsDto = {
  tagline: {
    ro: 'Jurnalism de investigație și analiză din Republica Moldova',
    ru: 'Журналистика расследований и аналитика из Республики Молдова',
  },
  ticker: { ro: [], ru: [] },
  pricing: {
    premiumMonthly: 149,
    premiumAnnual: 1490,
    currency: 'MDL',
    tiers: { bronze: 9900, silver: 19900, gold: 39900 },
  },
  contact: {
    email: 'redactia@corbul.md',
    phone: '+373 22 84 19 60',
    address_ro: 'Chișinău, Republica Moldova',
    address_ru: 'Кишинёв, Республика Молдова',
  },
  social: { facebook: '', telegram: '', x: '', linkedin: '' },
};
