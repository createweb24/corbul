import { IsEmail, IsIn, IsOptional } from 'class-validator';

/** `POST /api/newsletter` */
export class NewsletterDto {
  @IsEmail({}, { message: 'Adresă de e-mail invalidă' })
  email!: string;

  @IsOptional()
  @IsIn(['ro', 'ru'])
  locale?: 'ro' | 'ru';
}
