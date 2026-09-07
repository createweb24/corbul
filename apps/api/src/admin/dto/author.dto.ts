import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = (): PropertyDecorator =>
  Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  );

export class CreateAuthorDto {
  /** Dacă lipsește, se generează din `name` (transliterat, unic). */
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Numele este obligatoriu' })
  @MaxLength(120)
  name!: string;

  /** Dacă lipsește, se derivă din inițialele numelui. */
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(4)
  initials?: string;

  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Adresa de e-mail nu este validă' })
  @MaxLength(180)
  email!: string;

  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Rolul în română este obligatoriu' })
  @MaxLength(160)
  roleRo!: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(160)
  roleRu?: string;

  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Biografia în română este obligatorie' })
  @MaxLength(4000)
  bioRo!: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(4000)
  bioRu?: string;
}

export class UpdateAuthorDto {
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Numele nu poate fi gol' })
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(4)
  initials?: string;

  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Adresa de e-mail nu este validă' })
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(160)
  roleRo?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(160)
  roleRu?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(4000)
  bioRo?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(4000)
  bioRu?: string;
}
