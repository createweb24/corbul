import { Module } from '@nestjs/common';

import { WidgetsController } from './widgets.controller';
import { WidgetsService } from './widgets.service';

/** Widgeturi publice: vreme (Open-Meteo) + curs oficial (BNM). */
@Module({
  controllers: [WidgetsController],
  providers: [WidgetsService],
  exports: [WidgetsService],
})
export class WidgetsModule {}
