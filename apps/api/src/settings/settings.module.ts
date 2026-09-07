import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SettingsAdminController } from './settings-admin.controller';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

/**
 * Setările portalului (SPEC §4 — A2).
 * `GET /api/settings` public · `GET|PUT /api/admin/settings` protejat.
 * `SettingsService` e exportat: A3 îl poate folosi pentru prețurile Stripe.
 */
@Module({
  imports: [AuthModule],
  controllers: [SettingsController, SettingsAdminController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
