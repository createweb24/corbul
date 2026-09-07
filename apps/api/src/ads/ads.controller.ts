import { Controller, Get, Param, Redirect } from '@nestjs/common';

import { ParseIdPipe } from '../common/parse-id.pipe';
import { AdsService } from './ads.service';
import { AdZoneDto, ServedAdDto } from './ads.types';

/**
 * Zona publică a publicității (ADS-SPEC §2).
 * Rutele literale sunt declarate înaintea celor cu parametru.
 *
 * Niciuna dintre rute nu trebuie să poată sparge o pagină: o zonă lipsă
 * întoarce 200 cu `provider: 'NONE'`, iar un banner lipsă redirecționează
 * spre site în loc să dea 404.
 */
@Controller('ads')
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  /** `GET /api/ads/zones` — zonele active, pentru pagina de publicitate. */
  @Get('zones')
  zones(): Promise<AdZoneDto[]> {
    return this.ads.listPublicZones();
  }

  /** `GET /api/ads/serve/:zoneKey` — ce se afișează într-o zonă. */
  @Get('serve/:zoneKey')
  serve(@Param('zoneKey') zoneKey: string): Promise<ServedAdDto> {
    return this.ads.serve(zoneKey);
  }

  /** `GET /api/ads/click/:bannerId` — 302 spre destinație, cu click contorizat. */
  @Get('click/:bannerId')
  @Redirect(undefined, 302)
  async click(
    @Param('bannerId', ParseIdPipe) bannerId: number,
  ): Promise<{ url: string; statusCode: number }> {
    const url = await this.ads.click(bannerId);
    return { url, statusCode: 302 };
  }
}
