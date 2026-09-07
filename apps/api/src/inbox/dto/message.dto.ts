import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export type MessageKind = 'contact' | 'tip';

/**
 * Câmpurile opționale ale formularelor sosesc frecvent ca șir gol sau doar
 * spații. `@IsOptional` nu ignoră `""`, deci le normalizăm la `undefined`
 * (după trim) — altfel un pont anonim ar fi respins cu 400 pentru „e-mail
 * invalid".
 */
const trimOrUndefined = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

/** Lungimea minimă se verifică pe textul real, nu pe spațiile din jur. */
const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * `POST /api/messages` — formularul de contact și caseta „Trimite un pont
 * securizat". Pentru `kind: 'tip'` niciun câmp de identitate nu e obligatoriu.
 */
export class CreateMessageDto {
  @IsIn(['contact', 'tip'], {
    message: 'Tipul mesajului trebuie să fie „contact" sau „tip"',
  })
  kind!: MessageKind;

  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Transform(trimOrUndefined)
  @IsOptional()
  @IsEmail({}, { message: 'Adresă de e-mail invalidă' })
  email?: string;

  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @Transform(trim)
  @IsString()
  @Length(10, 20000, {
    message: 'Mesajul trebuie să aibă cel puțin 10 caractere',
  })
  body!: string;
}
