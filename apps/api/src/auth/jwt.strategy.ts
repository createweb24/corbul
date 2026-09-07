import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AdminAuthUser, JwtPayload } from './auth.service';
import { resolveJwtSecret } from './jwt-secret';

export { JWT_FALLBACK_SECRET } from './jwt-secret';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(config),
    });
  }

  validate(payload: JwtPayload): AdminAuthUser {
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id <= 0) {
      throw new UnauthorizedException('Token invalid');
    }
    return { id, email: payload.email, name: payload.name };
  }
}
