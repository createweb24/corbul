import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Secretul de rezervă este public (stă în depozit și în `.env.example`):
 * bun doar pentru dezvoltare locală. În producție cere un secret real.
 */
export const JWT_FALLBACK_SECRET = 'corbul_dev_secret_schimba_in_productie';

/** Lungimea minimă acceptată în producție (32 de octeți hex = 64 caractere). */
const MIN_PRODUCTION_LENGTH = 32;

let warned = false;

/**
 * Secretul JWT efectiv. În `NODE_ENV=production` lipsa lui, valoarea de
 * rezervă sau un secret prea scurt opresc pornirea (altfel oricine ar putea
 * semna token-uri de administrator). În dezvoltare doar avertizează, o dată.
 */
export function resolveJwtSecret(config: ConfigService): string {
  const configured = config.get<string>('JWT_SECRET')?.trim() ?? '';
  const production = config.get<string>('NODE_ENV') === 'production';
  const weak =
    configured.length === 0 ||
    configured === JWT_FALLBACK_SECRET ||
    configured.length < MIN_PRODUCTION_LENGTH;

  if (production && weak) {
    throw new Error(
      'JWT_SECRET lipsește sau este slab: în producție setează un secret aleatoriu ' +
        `de cel puțin ${MIN_PRODUCTION_LENGTH} de caractere (ex. openssl rand -hex 32).`,
    );
  }

  if (weak && !warned) {
    warned = true;
    new Logger('Auth').warn(
      'JWT_SECRET lipsește sau este cel de rezervă — acceptat doar în dezvoltare. ' +
        'Generează unul real: openssl rand -hex 32',
    );
  }

  return configured.length > 0 ? configured : JWT_FALLBACK_SECRET;
}
