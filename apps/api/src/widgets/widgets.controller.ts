import { Controller, Get } from '@nestjs/common';

import { WidgetsService } from './widgets.service';
import { Widgets } from './widgets.types';

@Controller('widgets')
export class WidgetsController {
  constructor(private readonly widgets: WidgetsService) {}

  /**
   * `GET /api/widgets` — vremea la Chișinău + cursul oficial BNM.
   * Cache în memorie 15 minute; nu eșuează niciodată (valori de rezervă
   * marcate cu `stale: true`).
   */
  @Get()
  summary(): Promise<Widgets> {
    return this.widgets.summary();
  }
}
