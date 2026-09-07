import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/**
 * Panoul de administrare (SPEC §4 — A2).
 * `AuthModule` aduce strategia JWT folosită de `JwtAuthGuard`,
 * `SettingsModule` aduce prețurile pentru venitul estimat din statistici.
 */
@Module({
  imports: [AuthModule, SettingsModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
