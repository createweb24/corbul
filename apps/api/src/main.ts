import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
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
function trustProxySetting(raw: string | undefined): boolean | number | string {
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

async function bootstrap(): Promise<void> {
  // rawBody: true — necesar pentru verificarea semnăturii webhook-ului Stripe
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', trustProxySetting(process.env.TRUST_PROXY));
  http.disable('x-powered-by');
  app.use(securityHeaders);

  app.setGlobalPrefix('api');

  const webUrl = process.env.WEB_URL ?? 'http://localhost:3100';
  app.enableCors({
    origin: webUrl,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Reader-Token'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4100);
  await app.listen(port);

  const logger = new Logger('Corbul');
  logger.log(`API Corbul.md pornit pe http://localhost:${port}/api`);
  logger.log(`CORS permis pentru ${webUrl}`);
}

void bootstrap();
