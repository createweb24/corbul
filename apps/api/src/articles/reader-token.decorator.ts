/**
 * `@ReaderToken()` — token-ul opac de cititor abonat, luat din antetul
 * `X-Reader-Token` sau din cookie-ul `corbul_reader` (SPEC §4, paywall).
 */

import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import { extractReaderToken } from './paywall';

export const ReaderToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return extractReaderToken(req);
  },
);
