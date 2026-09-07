import { Controller, Get } from '@nestjs/common';

import { SettingsService } from './settings.service';
import { SettingsDto } from './settings.types';

/** `GET /api/settings` — public (tagline, ticker, prețuri, contact). */
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getAll(): Promise<SettingsDto> {
    return this.settings.getAll();
  }
}
