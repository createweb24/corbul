/**
 * Corbul.md — DTO-uri de query pentru rutele publice.
 *
 * `ValidationPipe` rulează cu `{ whitelist: true, transform: true }` și
 * FĂRĂ `enableImplicitConversion` (vezi notele A0), deci fiecare câmp
 * numeric/boolean are nevoie de transformarea lui explicită.
 */

import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { Locale } from '../article.types';

/** `'1' | 'true' | 'yes' | 'on'` → true · `'0' | 'false' | …` → false. */
export function toOptionalBoolean({
  value,
}: TransformFnParams): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim().toLowerCase();
  if (raw === '') return undefined;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return undefined;
}

/** Numere din query-string; valorile invalide devin `undefined` (→ implicit). */
export function toOptionalInt({
  value,
}: TransformFnParams): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

/** Aduce o valoare opțională în intervalul permis, cu implicit la lipsă. */
export function clampInt(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

/** Doar `locale` — pentru rutele care nu au alți parametri. */
export class LocaleQuery {
  @IsOptional()
  @IsIn(['ro', 'ru'])
  locale?: Locale;
}

export class ListArticlesQuery extends LocaleQuery {
  /** slug-ul categoriei */
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  @Min(1)
  @Max(48)
  perPage?: number;

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  breaking?: boolean;
}

export class LimitQuery extends LocaleQuery {
  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  @Min(1)
  @Max(24)
  limit?: number;
}

export class SearchQuery extends LocaleQuery {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  @Min(1)
  @Max(48)
  perPage?: number;
}
