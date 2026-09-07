import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  ContactSettings,
  DEFAULT_SETTINGS,
  LocalizedList,
  LocalizedText,
  PartnerTier,
  PricingSettings,
  SettingRowDto,
  SettingsDto,
  SOCIAL_KEYS,
  SocialSettings,
} from './settings.types';

type PlainObject = Record<string, unknown>;

function isObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

const TIERS: PartnerTier[] = ['bronze', 'silver', 'gold'];

/** Doar adrese absolute `https://` cu un host real. */
function isHttpsUrl(value: string): boolean {
  if (!value.startsWith('https://')) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Interfețele TS n-au index signature, deci nu satisfac `InputJsonObject`.
 * Valorile de aici sunt construite din primitive JSON, deci conversia e sigură.
 */
function toJson(value: object): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** `GET /api/settings` — întotdeauna cele 5 chei, cu valori de rezervă. */
  async getAll(): Promise<SettingsDto> {
    const rows = await this.prisma.setting.findMany();
    const map = new Map<string, Prisma.JsonValue>(
      rows.map((row) => [row.key, row.value]),
    );

    return {
      tagline: this.normalizeTagline(map.get('tagline')),
      ticker: this.normalizeTicker(map.get('ticker')),
      pricing: this.normalizePricing(map.get('pricing')),
      contact: this.normalizeContact(map.get('contact')),
      social: this.normalizeSocial(map.get('social')),
    };
  }

  /** Prețurile normalizate — folosite de statistici și de checkout (A3). */
  async getPricing(): Promise<PricingSettings> {
    const row = await this.prisma.setting.findUnique({
      where: { key: 'pricing' },
    });
    return this.normalizePricing(row?.value);
  }

  /** Valoarea brută a unei chei, așa cum e stocată. */
  async getRaw(key: string): Promise<Prisma.JsonValue | null> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return row ? row.value : null;
  }

  /** `PUT /api/admin/settings` `{key, value}` — upsert cu validare de formă. */
  async set(key: string, value: unknown): Promise<SettingRowDto> {
    const normalized = this.validateValue(key, value);
    const row = await this.prisma.setting.upsert({
      where: { key },
      update: { value: normalized },
      create: { key, value: normalized },
    });
    return { key: row.key, value: row.value };
  }

  /* ---------------------------------------------------------------- */
  /* Normalizare (citire tolerantă)                                    */
  /* ---------------------------------------------------------------- */

  private normalizeTagline(value: unknown): LocalizedText {
    const fallback = DEFAULT_SETTINGS.tagline;
    if (!isObject(value)) return fallback;
    return {
      ro: asString(value.ro, fallback.ro),
      ru: asString(value.ru, fallback.ru),
    };
  }

  private normalizeTicker(value: unknown): LocalizedList {
    if (!isObject(value)) return { ro: [], ru: [] };
    return { ro: asStringList(value.ro), ru: asStringList(value.ru) };
  }

  private normalizePricing(value: unknown): PricingSettings {
    const fallback = DEFAULT_SETTINGS.pricing;
    if (!isObject(value)) return { ...fallback, tiers: { ...fallback.tiers } };

    const rawTiers = isObject(value.tiers) ? value.tiers : {};
    const tiers = TIERS.reduce<Record<PartnerTier, number>>(
      (acc, tier) => {
        acc[tier] = Math.round(asNumber(rawTiers[tier], fallback.tiers[tier]));
        return acc;
      },
      { ...fallback.tiers },
    );

    return {
      premiumMonthly: asNumber(value.premiumMonthly, fallback.premiumMonthly),
      premiumAnnual: asNumber(value.premiumAnnual, fallback.premiumAnnual),
      currency: asString(value.currency, fallback.currency),
      tiers,
    };
  }

  private normalizeContact(value: unknown): ContactSettings {
    const fallback = DEFAULT_SETTINGS.contact;
    if (!isObject(value)) return { ...fallback };
    return {
      email: asString(value.email, fallback.email),
      phone: asString(value.phone, fallback.phone),
      address_ro: asString(value.address_ro, fallback.address_ro),
      address_ru: asString(value.address_ru, fallback.address_ru),
    };
  }

  /** Adrese absente ⇒ șir gol; doar string-urile sunt păstrate. */
  private normalizeSocial(value: unknown): SocialSettings {
    const fallback = DEFAULT_SETTINGS.social;
    const source = isObject(value) ? value : {};
    return SOCIAL_KEYS.reduce<SocialSettings>(
      (acc, key) => {
        acc[key] = asString(source[key], fallback[key]).trim();
        return acc;
      },
      { ...fallback },
    );
  }

  /* ---------------------------------------------------------------- */
  /* Validare (scriere strictă)                                        */
  /* ---------------------------------------------------------------- */

  private validateValue(key: string, value: unknown): Prisma.InputJsonValue {
    switch (key) {
      case 'tagline': {
        if (!isObject(value) || typeof value.ro !== 'string') {
          throw new BadRequestException('tagline: se așteaptă {ro, ru}');
        }
        const tagline: LocalizedText = {
          ro: value.ro,
          ru: asString(value.ru, value.ro),
        };
        return toJson(tagline);
      }
      case 'ticker': {
        if (!isObject(value) || !Array.isArray(value.ro)) {
          throw new BadRequestException(
            'ticker: se așteaptă {ro: string[], ru: string[]}',
          );
        }
        const ticker: LocalizedList = {
          ro: asStringList(value.ro),
          ru: asStringList(value.ru),
        };
        return toJson(ticker);
      }
      case 'pricing': {
        if (!isObject(value)) {
          throw new BadRequestException('pricing: se așteaptă un obiect');
        }
        const pricing = this.normalizePricing(value);
        if (pricing.premiumMonthly <= 0 || pricing.premiumAnnual <= 0) {
          throw new BadRequestException('pricing: prețurile trebuie să fie > 0');
        }
        if (TIERS.some((tier) => pricing.tiers[tier] <= 0)) {
          throw new BadRequestException(
            'pricing: pachetele de parteneriat trebuie să fie > 0',
          );
        }
        return toJson({ ...pricing, tiers: { ...pricing.tiers } });
      }
      case 'contact': {
        if (!isObject(value) || typeof value.email !== 'string') {
          throw new BadRequestException(
            'contact: se așteaptă {email, phone, address_ro, address_ru}',
          );
        }
        return toJson(this.normalizeContact(value));
      }
      case 'social': {
        if (!isObject(value)) {
          throw new BadRequestException(
            'social: se așteaptă {facebook, telegram, x, linkedin}',
          );
        }
        const social = this.normalizeSocial(value);
        const invalid = SOCIAL_KEYS.some(
          (key) => social[key] !== '' && !isHttpsUrl(social[key]),
        );
        if (invalid) {
          throw new BadRequestException(
            'social: adresele trebuie să fie https://…',
          );
        }
        return toJson(social);
      }
      default: {
        // Chei suplimentare: acceptăm orice JSON serializabil.
        if (value === undefined) {
          throw new BadRequestException('Valoarea setării lipsește');
        }
        return value as Prisma.InputJsonValue;
      }
    }
  }
}
