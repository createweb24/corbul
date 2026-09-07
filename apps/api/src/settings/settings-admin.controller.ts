import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingsService } from './settings.service';
import { SettingRowDto, SettingsDto } from './settings.types';

/** `/api/admin/settings` — protejat de `JwtAuthGuard` (SPEC §4). */
@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class SettingsAdminController {
  constructor(private readonly settings: SettingsService) {}

  /** Comoditate pentru editorul de setări: aceeași formă ca ruta publică. */
  @Get()
  getAll(): Promise<SettingsDto> {
    return this.settings.getAll();
  }

  @Put()
  update(@Body() dto: UpdateSettingDto): Promise<SettingRowDto> {
    return this.settings.set(dto.key, dto.value);
  }
}
