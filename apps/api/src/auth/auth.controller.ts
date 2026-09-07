import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  AdminAuthUser,
  AdminUserPublic,
  AuthService,
  LoginResult,
} from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CurrentUser, JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * `POST /api/auth/login` → `{ token, user: { email, name } }`
   * Maximum 10 încercări pe IP la 15 minute; la depășire răspunde 429.
   */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Ip() ip: string): Promise<LoginResult> {
    return this.auth.login(dto.email, dto.password, ip || 'unknown');
  }

  /** `GET /api/auth/me` (Bearer) → `{ email, name }` */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AdminAuthUser): Promise<AdminUserPublic> {
    return this.auth.profile(user.id);
  }
}
