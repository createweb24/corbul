import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  registerDecorator,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { INT32_MAX } from '../../common/int32';
import { CAMPAIGN_STATUSES, CampaignStatus } from '../ads.types';

/* ------------------------------------------------------------------ */
/* Ajutoare comune                                                     */
/* ------------------------------------------------------------------ */

/** Taie spațiile; lasă `null`/`undefined` neatinse (le tratează serviciul). */
const trim = (): PropertyDecorator =>
  Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  );

/** `true` pentru un șir cu conținut real (nu gol, nu doar spații). */
export function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/* --- adresă absolută http(s) -------------------------------------- */

@ValidatorConstraint({ name: 'isHttpUrl', async: false })
class HttpUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.trim() === '') return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `„${args.property}" trebuie să fie o adresă absolută http:// sau https://`;
  }
}

/** `targetUrl`, `imageUrl`, `website` — doar adrese absolute http(s). */
export function IsHttpUrl(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName as string,
      options,
      constraints: [],
      validator: HttpUrlConstraint,
    });
  };
}

/* --- „după data X" ------------------------------------------------ */

@ValidatorConstraint({ name: 'isAfterDate', async: false })
class AfterDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [other] = args.constraints as [string];
    const source = (args.object as Record<string, unknown>)[other];
    if (typeof value !== 'string' || typeof source !== 'string') return true;
    const end = Date.parse(value);
    const start = Date.parse(source);
    if (Number.isNaN(end) || Number.isNaN(start)) return true; // `IsDateString` semnalează
    return end > start;
  }

  defaultMessage(): string {
    return 'Data de sfârșit trebuie să fie după data de început';
  }
}

/** `endsAt` trebuie să fie strict după `startsAt`. */
export function IsAfterField(
  field: string,
  options?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName as string,
      options,
      constraints: [field],
      validator: AfterDateConstraint,
    });
  };
}

/* ------------------------------------------------------------------ */
/* Zone                                                                */
/* ------------------------------------------------------------------ */

/** Cheia zonei e folosită în URL-uri: doar litere mici, cifre și `_`. */
const ZONE_KEY_RE = /^[a-z0-9_]+$/;

export class CreateZoneDto {
  @trim()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  @Matches(ZONE_KEY_RE, {
    message: 'Cheia zonei acceptă doar litere mici, cifre și „_"',
  })
  key!: string;

  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Numele zonei este obligatoriu' })
  @MaxLength(120)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4000)
  width!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4000)
  height!: number;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(60)
  adsenseSlotId?: string | null;

  /** În bani (MDL × 100). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(INT32_MAX)
  priceMonthly?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  order?: number;
}

export class UpdateZoneDto {
  @IsOptional()
  @trim()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  @Matches(ZONE_KEY_RE, {
    message: 'Cheia zonei acceptă doar litere mici, cifre și „_"',
  })
  key?: string;

  @IsOptional()
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Numele zonei nu poate fi gol' })
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4000)
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4000)
  height?: number;

  /** `null` sau `""` golește câmpul. */
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(60)
  adsenseSlotId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(INT32_MAX)
  priceMonthly?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Clienți (advertiseri)                                               */
/* ------------------------------------------------------------------ */

const lower = (): PropertyDecorator =>
  Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

export class CreateAdvertiserDto {
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Denumirea companiei este obligatorie' })
  @MaxLength(160)
  companyName!: string;

  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Persoana de contact este obligatorie' })
  @MaxLength(120)
  contactName!: string;

  @lower()
  @IsEmail({}, { message: 'Adresa de e-mail nu este validă' })
  @MaxLength(180)
  email!: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @ValidateIf((_o, value) => hasText(value))
  @IsHttpUrl()
  @MaxLength(300)
  website?: string | null;
}

export class UpdateAdvertiserDto {
  @IsOptional()
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Denumirea companiei nu poate fi goală' })
  @MaxLength(160)
  companyName?: string;

  @IsOptional()
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Persoana de contact nu poate fi goală' })
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @lower()
  @IsEmail({}, { message: 'Adresa de e-mail nu este validă' })
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @ValidateIf((_o, value) => hasText(value))
  @IsHttpUrl()
  @MaxLength(300)
  website?: string | null;
}

/* ------------------------------------------------------------------ */
/* Campanii                                                            */
/* ------------------------------------------------------------------ */

export class CreateCampaignDto {
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Numele campaniei este obligatoriu' })
  @MaxLength(160)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  advertiserId!: number;

  @IsDateString({}, { message: 'Data de început nu este validă' })
  startsAt!: string;

  @IsDateString({}, { message: 'Data de sfârșit nu este validă' })
  @IsAfterField('startsAt')
  endsAt!: string;

  @IsOptional()
  @trim()
  @IsIn(CAMPAIGN_STATUSES, {
    message: `Statusul trebuie să fie unul dintre: ${CAMPAIGN_STATUSES.join(', ')}`,
  })
  status?: CampaignStatus;
}

export class UpdateCampaignDto {
  @IsOptional()
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Numele campaniei nu poate fi gol' })
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  advertiserId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Data de început nu este validă' })
  startsAt?: string;

  /** Comparația cu `startsAt` se face în serviciu, peste valorile îmbinate. */
  @IsOptional()
  @IsDateString({}, { message: 'Data de sfârșit nu este validă' })
  endsAt?: string;

  @IsOptional()
  @trim()
  @IsIn(CAMPAIGN_STATUSES, {
    message: `Statusul trebuie să fie unul dintre: ${CAMPAIGN_STATUSES.join(', ')}`,
  })
  status?: CampaignStatus;
}

/* ------------------------------------------------------------------ */
/* Bannere                                                             */
/* ------------------------------------------------------------------ */

const CREATIVE_MESSAGE =
  'Bannerul are nevoie fie de „imageUrl" (http/https), fie de marcaj „html"';

export class CreateBannerDto {
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Numele bannerului este obligatoriu' })
  @MaxLength(160)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  campaignId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  zoneId!: number;

  /**
   * Se validează când e trimis ȘI când e singura variantă posibilă (fără
   * `html`) — astfel „nici imagine, nici marcaj" cade cu un mesaj limpede.
   */
  @ValidateIf((o: CreateBannerDto) => !hasText(o.html) || hasText(o.imageUrl))
  @trim()
  @IsHttpUrl({ message: CREATIVE_MESSAGE })
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  html?: string | null;

  @trim()
  @IsHttpUrl()
  @MaxLength(600)
  targetUrl!: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(300)
  alt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Greutatea trebuie să fie între 1 și 100' })
  @Max(100, { message: 'Greutatea trebuie să fie între 1 și 100' })
  weight?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateBannerDto {
  @IsOptional()
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Numele bannerului nu poate fi gol' })
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  campaignId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  zoneId?: number;

  /** `null` sau `""` golește câmpul; serviciul verifică apoi îmbinarea. */
  @IsOptional()
  @ValidateIf((_o, value) => hasText(value))
  @trim()
  @IsHttpUrl()
  @MaxLength(600)
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  html?: string | null;

  @IsOptional()
  @trim()
  @IsHttpUrl()
  @MaxLength(600)
  targetUrl?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(300)
  alt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Greutatea trebuie să fie între 1 și 100' })
  @Max(100, { message: 'Greutatea trebuie să fie între 1 și 100' })
  weight?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/* ------------------------------------------------------------------ */
/* Interogări                                                          */
/* ------------------------------------------------------------------ */

export class AdStatsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  campaignId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

export class AdBannersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  campaignId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  zoneId?: number;
}
