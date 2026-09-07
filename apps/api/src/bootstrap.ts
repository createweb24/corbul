import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';

/**
 * `TRUST_PROXY` — cui îi credem antetul `X-Forwarded-For` (Express
 * „trust proxy"). Fără el, în spatele nginx/Cloudflare `req.ip` ar fi IP-ul
 * proxy-ului și toți vizitatorii ar împărți aceeași cotă de rate-limit.
 *  • lipsă / `loopback` — doar proxy-uri locale (implicit);
 *  • `1`, `2`… — numărul de salturi de proxy;
 *  • `true` / `false` — tot / nimic;
 *  • orice altceva — listă de adrese sau subrețele, separate prin virgulă.
 */
export function trustProxySetting(
  raw: string | undefined,
): boolean | number | string {
  const value = raw?.trim();
  if (!value) return 'loopback';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

/** Antete de securitate minime pentru un API JSON — fără dependențe noi. */
function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}

/**
 * Adresele aplicației web permise la CORS. `WEB_URL` acceptă mai multe adrese
 * separate prin virgulă — același API poate servi și domeniul principal, și
 * unul de rezervă.
 */
export function webUrls(): string[] {
  const raw = process.env.WEB_URL ?? 'http://localhost:3100';
  return raw
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

/** Prima adresă configurată — cea folosită în loguri și la redirecturi. */
export function webUrl(): string {
  return webUrls()[0] ?? 'http://localhost:3100';
}

/**
 * Construiește aplicația Nest complet configurată, dar **fără** să o pună să
 * asculte pe un port. Așa o pot folosi și `main.ts` (proces care stă pornit),
 * și handlerul serverless din `api/`, cu exact aceleași setări.
 */
export async function createApp(): Promise<NestExpressApplication> {
  // rawBody: true — necesar pentru verificarea semnăturii webhook-ului Stripe
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', trustProxySetting(process.env.TRUST_PROXY));
  http.disable('x-powered-by');
  app.use(securityHeaders);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: webUrls(),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Reader-Token'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  return app;
}
