import { IsString, MaxLength } from 'class-validator';

/**
 * `POST /api/subscribers/verify` — token opac din cookie-ul `corbul_reader`.
 * Deliberat permisiv: un token gol sau necunoscut întoarce `active: false`,
 * nu o eroare 400 (web-ul îl trimite direct din cookie).
 */
export class VerifyTokenDto {
  @IsString()
  @MaxLength(200)
  token!: string;
}
