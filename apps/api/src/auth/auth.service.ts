import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { SlidingWindowLimiter } from '../common/rate-limit';
import { PrismaService } from '../prisma/prisma.service';

/** Conținutul token-ului JWT emis pentru panoul de administrare. */
export interface JwtPayload {
  /** id-ul din `AdminUser`, ca string (convenția `sub` din RFC 7519) */
  sub: string;
  email: string;
  name: string;
}

/** Utilizatorul atașat de Passport pe `request.user`. */
export interface AdminAuthUser {
  id: number;
  email: string;
  name: string;
}

/** Forma publică a administratorului — contract cu web (`AdminUserDto`). */
export interface AdminUserPublic {
  email: string;
  name: string;
}

export interface LoginResult {
  token: string;
  user: AdminUserPublic;
}

/** Încercări de autentificare permise per IP într-o fereastră de 15 minute. */
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** Costul bcrypt al parolelor din seed — hash-ul fals trebuie să-l egaleze. */
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /** Frânează ghicirea parolei contului unic de administrator. */
  private readonly loginLimiter = new SlidingWindowLimiter(
    LOGIN_MAX_ATTEMPTS,
    LOGIN_WINDOW_MS,
  );

  /**
   * Hash bcrypt real (60 de caractere), calculat o singură dată la pornire.
   * Pentru un e-mail inexistent comparăm parola cu el, ca durata răspunsului
   * să fie aceeași ca pentru un cont real — altfel conturile ar fi enumerabile.
   */
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {
    this.dummyHash = bcrypt.hash(`corbul-${Date.now()}`, BCRYPT_ROUNDS);
  }

  async login(
    email: string,
    password: string,
    ip = 'unknown',
  ): Promise<LoginResult> {
    if (!this.loginLimiter.take(ip)) {
      this.logger.warn(`Prea multe autentificări eșuate de la ${ip}`);
      throw new HttpException(
        'Prea multe încercări. Reîncearcă peste 15 minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // Același mesaj pentru „utilizator inexistent" și „parolă greșită”,
    // ca să nu se poată enumera conturile.
    const invalid = new UnauthorizedException('Email sau parolă incorecte');
    if (!user) {
      await bcrypt.compare(password, await this.dummyHash);
      throw invalid;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      this.logger.warn(`Autentificare eșuată pentru ${user.email}`);
      throw invalid;
    }

    const payload: JwtPayload = {
      sub: String(user.id),
      email: user.email,
      name: user.name,
    };

    return {
      token: await this.jwt.signAsync(payload),
      user: { email: user.email, name: user.name },
    };
  }

  /** `GET /api/auth/me` — reconfirmă din DB că administratorul mai există. */
  async profile(userId: number): Promise<AdminUserPublic> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!user) throw new UnauthorizedException('Sesiune invalidă');
    return user;
  }
}
