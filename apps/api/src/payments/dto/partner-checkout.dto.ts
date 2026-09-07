import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Locale } from './premium-checkout.dto';

export type PartnerTier = 'bronze' | 'silver' | 'gold';

/** Lungimea minimă se verifică pe textul real, nu pe spații. */
const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Site-ul partenerului: gol ⇒ `undefined`; fără schemă ⇒ prefixat cu
 * `https://`. Validarea de mai jos acceptă apoi doar http(s), deci un
 * `javascript:` nu ajunge niciodată în panou.
 */
const normalizeWebsite = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/** `POST /api/payments/partner/checkout` */
export class PartnerCheckoutDto {
  @Transform(trim)
  @IsString()
  @Length(2, 160, { message: 'Numele companiei este obligatoriu' })
  company!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 160, { message: 'Persoana de contact este obligatorie' })
  contactName!: string;

  @Transform(trim)
  @IsEmail({}, { message: 'Adresă de e-mail invalidă' })
  email!: string;

  @IsIn(['bronze', 'silver', 'gold'], {
    message: 'Pachetul trebuie să fie bronze, silver sau gold',
  })
  tier!: PartnerTier;

  // ValidationPipe rulează fără `enableImplicitConversion`: @Type e obligatoriu.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number;

  @Transform(normalizeWebsite)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Adresa site-ului trebuie să înceapă cu http:// sau https://' },
  )
  websiteUrl?: string;

  @IsOptional()
  @IsIn(['ro', 'ru'])
  locale?: Locale;
}
