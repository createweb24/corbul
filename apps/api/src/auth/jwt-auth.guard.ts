import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { AdminAuthUser } from './auth.service';

/**
 * Protejează tot ce e sub `/api/admin/*` (SPEC §4).
 * Token-ul vine ca `Authorization: Bearer <jwt>`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/** Cererea Express după ce garda a validat token-ul. */
export interface AuthenticatedRequest extends Request {
  user: AdminAuthUser;
}

/** `@CurrentUser() user: AdminAuthUser` în handlerele protejate. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminAuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
