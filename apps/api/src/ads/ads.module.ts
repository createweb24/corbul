import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { AdsAdminController } from './ads-admin.controller';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

/**
 * Publicitate (ADS-SPEC §2).
 * `AuthModule` aduce strategia JWT folosită de `JwtAuthGuard` pe rutele de
 * admin, `SettingsModule` aduce cheia `ads` (clientul AdSense).
 * `PrismaModule` e `@Global()`, deci nu se importă explicit.
 */
@Module({
  imports: [AuthModule, SettingsModule],
  controllers: [AdsController, AdsAdminController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
