import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { AdsService } from './ads.service';
import {
  AdBannerDto,
  AdCampaignDto,
  AdminZoneDto,
  AdsOverviewDto,
  AdStatRowDto,
  AdvertiserDto,
  OkDto,
} from './ads.types';
import {
  AdBannersQueryDto,
  AdStatsQueryDto,
  CreateAdvertiserDto,
  CreateBannerDto,
  CreateCampaignDto,
  CreateZoneDto,
  UpdateAdvertiserDto,
  UpdateBannerDto,
  UpdateCampaignDto,
  UpdateZoneDto,
} from './dto/ads.dto';

/**
 * Gestiunea publicității (ADS-SPEC §2 — admin).
 * `JwtAuthGuard` la nivel de controller ⇒ TOATE rutele `/api/admin/ads/*`
 * sunt protejate. Rutele literale (`stats`, `overview`) sunt declarate
 * înaintea colecțiilor cu parametru, iar `:id` trece prin `ParseIdPipe`.
 */
@Controller('admin/ads')
@UseGuards(JwtAuthGuard)
export class AdsAdminController {
  constructor(private readonly ads: AdsService) {}

  /* --- rezumat și statistici --------------------------------------- */

  @Get('overview')
  overview(): Promise<AdsOverviewDto> {
    return this.ads.overview();
  }

  @Get('stats')
  stats(@Query() query: AdStatsQueryDto): Promise<AdStatRowDto[]> {
    return this.ads.stats(query);
  }

  /* --- zone -------------------------------------------------------- */

  @Get('zones')
  listZones(): Promise<AdminZoneDto[]> {
    return this.ads.listZones();
  }

  @Post('zones')
  createZone(@Body() dto: CreateZoneDto): Promise<AdminZoneDto> {
    return this.ads.createZone(dto);
  }

  @Put('zones/:id')
  updateZone(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateZoneDto,
  ): Promise<AdminZoneDto> {
    return this.ads.updateZone(id, dto);
  }

  @Delete('zones/:id')
  deleteZone(@Param('id', ParseIdPipe) id: number): Promise<OkDto> {
    return this.ads.deleteZone(id);
  }

  /* --- clienți ----------------------------------------------------- */

  @Get('advertisers')
  listAdvertisers(): Promise<AdvertiserDto[]> {
    return this.ads.listAdvertisers();
  }

  @Post('advertisers')
  createAdvertiser(@Body() dto: CreateAdvertiserDto): Promise<AdvertiserDto> {
    return this.ads.createAdvertiser(dto);
  }

  @Put('advertisers/:id')
  updateAdvertiser(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateAdvertiserDto,
  ): Promise<AdvertiserDto> {
    return this.ads.updateAdvertiser(id, dto);
  }

  @Delete('advertisers/:id')
  deleteAdvertiser(@Param('id', ParseIdPipe) id: number): Promise<OkDto> {
    return this.ads.deleteAdvertiser(id);
  }

  /* --- campanii ---------------------------------------------------- */

  @Get('campaigns')
  listCampaigns(): Promise<AdCampaignDto[]> {
    return this.ads.listCampaigns();
  }

  @Post('campaigns')
  createCampaign(@Body() dto: CreateCampaignDto): Promise<AdCampaignDto> {
    return this.ads.createCampaign(dto);
  }

  @Put('campaigns/:id')
  updateCampaign(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateCampaignDto,
  ): Promise<AdCampaignDto> {
    return this.ads.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  deleteCampaign(@Param('id', ParseIdPipe) id: number): Promise<OkDto> {
    return this.ads.deleteCampaign(id);
  }

  /* --- bannere ----------------------------------------------------- */

  @Get('banners')
  listBanners(@Query() query: AdBannersQueryDto): Promise<AdBannerDto[]> {
    return this.ads.listBanners(query);
  }

  @Post('banners')
  createBanner(@Body() dto: CreateBannerDto): Promise<AdBannerDto> {
    return this.ads.createBanner(dto);
  }

  @Put('banners/:id')
  updateBanner(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateBannerDto,
  ): Promise<AdBannerDto> {
    return this.ads.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  deleteBanner(@Param('id', ParseIdPipe) id: number): Promise<OkDto> {
    return this.ads.deleteBanner(id);
  }
}
