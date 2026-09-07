import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : '',
  )
  @IsEmail({}, { message: 'Adresa de e-mail nu este validă' })
  @MaxLength(180)
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Parola are minimum 6 caractere' })
  @MaxLength(200)
  password!: string;
}
