import { IsEmail, IsIn, IsOptional } from 'class-validator';

export type Plan = 'monthly' | 'annual';
export type Locale = 'ro' | 'ru';

/** `POST /api/payments/premium/checkout` */
export class PremiumCheckoutDto {
  @IsEmail({}, { message: 'Adresă de e-mail invalidă' })
  email!: string;

  @IsIn(['monthly', 'annual'], {
    message: 'Planul trebuie să fie „monthly" sau „annual"',
  })
  plan!: Plan;

  @IsOptional()
  @IsIn(['ro', 'ru'])
  locale?: Locale;
}
