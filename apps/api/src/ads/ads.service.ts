import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  AdBannerDto,
  AdCampaignDto,
  AdminZoneDto,
  AdsOverviewDto,
  AdStatRowDto,
  AdvertiserDto,
  AdZoneDto,
  CAMPAIGN_STATUSES,
  CampaignStatus,
  OkDto,
  ServedAdDto,
  ServedZoneDto,
} from './ads.types';
import {
  AdBannersQueryDto,
  AdStatsQueryDto,
  CreateAdvertiserDto,
  CreateBannerDto,
  CreateCampaignDto,
  CreateZoneDto,
  hasText,
  UpdateAdvertiserDto,
  UpdateBannerDto,
  UpdateCampaignDto,
  UpdateZoneDto,
} from './dto/ads.dto';

/* ------------------------------------------------------------------ */
/* Ajutoare                                                            */
/* ------------------------------------------------------------------ */

function iso(date: Date): string {
  return date.toISOString();
}

/** Ziua calendaristică a unei coloane `@db.Date`, ca `YYYY-MM-DD`. */
function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Miezul nopții UTC pentru ziua dată — cheia din `AdStatDaily`. */
function utcMidnight(reference: Date = new Date()): Date {
  return new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      reference.getUTCDate(),
    ),
  );
}

/** Miezul nopții UTC cu `days - 1` zile în urmă (fereastra include azi). */
function utcWindowStart(days: number): Date {
  const start = utcMidnight();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

/** Șir cu conținut → el însuși (curățat); orice altceva → `null`. */
function textOrNull(value: string | null | undefined): string | null {
  return hasText(value) ? value.trim() : null;
}

function isCampaignStatus(value: string): value is CampaignStatus {
  return (CAMPAIGN_STATUSES as readonly string[]).includes(value);
}

/** Statusul din DB e un `String` liber — îl readucem la uniunea din contract. */
function toCampaignStatus(value: string): CampaignStatus {
  return isCampaignStatus(value) ? value : 'DRAFT';
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function isMissingRecord(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

/* --- forme Prisma reutilizate ------------------------------------- */

const BANNER_INCLUDE = {
  zone: { select: { key: true, name: true, width: true, height: true } },
  campaign: { select: { name: true } },
} satisfies Prisma.AdBannerInclude;

type BannerRow = Prisma.AdBannerGetPayload<{ include: typeof BANNER_INCLUDE }>;

const OK: OkDto = { ok: true };

/* ------------------------------------------------------------------ */

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly config: ConfigService,
  ) {}

  /* ================================================================ */
  /* Public                                                            */
  /* ================================================================ */

  /** `GET /api/ads/zones` — doar zonele active, în ordinea de afișare. */
  async listPublicZones(): Promise<AdZoneDto[]> {
    const rows = await this.prisma.adZone.findMany({
      where: { active: true },
      select: {
        key: true,
        name: true,
        width: true,
        height: true,
        priceMonthly: true,
        order: true,
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
    return rows;
  }

  /**
   * `GET /api/ads/serve/:zoneKey` — ce se afișează într-o zonă.
   *
   * Ordinea: zonă activă → bannere active din campanii `ACTIVE` aflate în
   * perioadă → rotație ponderată → afișare înregistrată (fire-and-forget) →
   * `DIRECT`. Fără banner: `ADSENSE` dacă există și `ads.adsenseClientId`, și
   * `adsenseSlotId` pe zonă. Altfel `NONE`.
   *
   * Nu aruncă niciodată pentru o zonă lipsă: 200 + `{provider:'NONE', zone:null}`,
   * ca o zonă ștearsă să nu spargă pagina.
   */
  async serve(zoneKey: string): Promise<ServedAdDto> {
    const now = new Date();

    const zone = await this.prisma.adZone.findUnique({
      where: { key: zoneKey },
      select: {
        key: true,
        width: true,
        height: true,
        active: true,
        adsenseSlotId: true,
        banners: {
          where: {
            active: true,
            campaign: {
              status: 'ACTIVE',
              startsAt: { lte: now },
              endsAt: { gte: now },
            },
          },
          select: {
            id: true,
            imageUrl: true,
            html: true,
            alt: true,
            weight: true,
          },
        },
      },
    });

    if (!zone) return { provider: 'NONE', zone: null };

    const zoneInfo: ServedZoneDto = {
      key: zone.key,
      width: zone.width,
      height: zone.height,
    };

    if (!zone.active) return { provider: 'NONE', zone: zoneInfo };

    if (zone.banners.length > 0) {
      const banner = pickWeighted(zone.banners);
      // Afișarea nu blochează răspunsul și nu îl poate face să eșueze.
      void this.bumpStat(banner.id, 'impressions');
      return {
        provider: 'DIRECT',
        bannerId: banner.id,
        zone: zoneInfo,
        imageUrl: banner.imageUrl,
        html: banner.html,
        alt: banner.alt,
        clickUrl: `/api/ads/click/${banner.id}`,
      };
    }

    const client = await this.adsenseClientId();
    if (client && zone.adsenseSlotId) {
      return {
        provider: 'ADSENSE',
        zone: zoneInfo,
        client,
        slot: zone.adsenseSlotId,
      };
    }

    return { provider: 'NONE', zone: zoneInfo };
  }

  /**
   * `GET /api/ads/click/:bannerId` — incrementează clicurile și întoarce
   * destinația. Banner inexistent sau inactiv → adresa site-ului.
   */
  async click(bannerId: number): Promise<string> {
    const banner = await this.prisma.adBanner.findUnique({
      where: { id: bannerId },
      select: { targetUrl: true, active: true },
    });
    if (!banner || !banner.active) return this.webUrl();
    void this.bumpStat(bannerId, 'clicks');
    return banner.targetUrl;
  }

  /* ================================================================ */
  /* Admin — zone                                                      */
  /* ================================================================ */

  async listZones(): Promise<AdminZoneDto[]> {
    const rows = await this.prisma.adZone.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { banners: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      name: row.name,
      width: row.width,
      height: row.height,
      adsenseSlotId: row.adsenseSlotId,
      priceMonthly: row.priceMonthly,
      active: row.active,
      order: row.order,
      bannerCount: row._count.banners,
    }));
  }

  async createZone(dto: CreateZoneDto): Promise<AdminZoneDto> {
    try {
      const row = await this.prisma.adZone.create({
        data: {
          key: dto.key,
          name: dto.name,
          width: dto.width,
          height: dto.height,
          adsenseSlotId: textOrNull(dto.adsenseSlotId),
          priceMonthly: dto.priceMonthly ?? null,
          active: dto.active ?? true,
          order: dto.order ?? 0,
        },
      });
      return { ...toZoneDto(row), bannerCount: 0 };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`Cheia „${dto.key}" este deja folosită`);
      }
      throw error;
    }
  }

  async updateZone(id: number, dto: UpdateZoneDto): Promise<AdminZoneDto> {
    const existing = await this.prisma.adZone.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Zona nu există');

    try {
      const row = await this.prisma.adZone.update({
        where: { id },
        data: {
          key: dto.key,
          name: dto.name,
          width: dto.width,
          height: dto.height,
          adsenseSlotId:
            dto.adsenseSlotId === undefined
              ? undefined
              : textOrNull(dto.adsenseSlotId),
          priceMonthly:
            dto.priceMonthly === undefined ? undefined : dto.priceMonthly,
          active: dto.active,
          order: dto.order,
        },
        include: { _count: { select: { banners: true } } },
      });
      return { ...toZoneDto(row), bannerCount: row._count.banners };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`Cheia „${dto.key}" este deja folosită`);
      }
      throw error;
    }
  }

  /** Zona nu are `onDelete: Cascade` — refuzăm explicit, cu 409, nu cu 500. */
  async deleteZone(id: number): Promise<OkDto> {
    const banners = await this.prisma.adBanner.count({ where: { zoneId: id } });
    if (banners > 0) {
      throw new ConflictException(
        `Zona are ${banners} banner(e) și nu poate fi ștearsă`,
      );
    }
    try {
      await this.prisma.adZone.delete({ where: { id } });
    } catch (error) {
      if (isMissingRecord(error)) throw new NotFoundException('Zona nu există');
      throw error;
    }
    return OK;
  }

  /* ================================================================ */
  /* Admin — clienți                                                   */
  /* ================================================================ */

  async listAdvertisers(): Promise<AdvertiserDto[]> {
    const rows = await this.prisma.advertiser.findMany({
      orderBy: { companyName: 'asc' },
      include: { _count: { select: { campaigns: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      companyName: row.companyName,
      contactName: row.contactName,
      email: row.email,
      phone: row.phone,
      website: row.website,
      createdAt: iso(row.createdAt),
      campaignCount: row._count.campaigns,
    }));
  }

  async createAdvertiser(dto: CreateAdvertiserDto): Promise<AdvertiserDto> {
    try {
      const row = await this.prisma.advertiser.create({
        data: {
          companyName: dto.companyName,
          contactName: dto.contactName,
          email: dto.email,
          phone: textOrNull(dto.phone),
          website: textOrNull(dto.website),
        },
      });
      return { ...toAdvertiserDto(row), campaignCount: 0 };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `Există deja un client cu adresa ${dto.email}`,
        );
      }
      throw error;
    }
  }

  async updateAdvertiser(
    id: number,
    dto: UpdateAdvertiserDto,
  ): Promise<AdvertiserDto> {
    const existing = await this.prisma.advertiser.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Clientul nu există');

    try {
      const row = await this.prisma.advertiser.update({
        where: { id },
        data: {
          companyName: dto.companyName,
          contactName: dto.contactName,
          email: dto.email,
          phone: dto.phone === undefined ? undefined : textOrNull(dto.phone),
          website:
            dto.website === undefined ? undefined : textOrNull(dto.website),
        },
        include: { _count: { select: { campaigns: true } } },
      });
      return { ...toAdvertiserDto(row), campaignCount: row._count.campaigns };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `Există deja un client cu adresa ${dto.email ?? ''}`,
        );
      }
      throw error;
    }
  }

  /** Campaniile (și bannerele lor) cad în cascadă — o spune schema. */
  async deleteAdvertiser(id: number): Promise<OkDto> {
    try {
      await this.prisma.advertiser.delete({ where: { id } });
    } catch (error) {
      if (isMissingRecord(error)) {
        throw new NotFoundException('Clientul nu există');
      }
      throw error;
    }
    return OK;
  }

  /* ================================================================ */
  /* Admin — campanii                                                  */
  /* ================================================================ */

  async listCampaigns(): Promise<AdCampaignDto[]> {
    const rows = await this.prisma.adCampaign.findMany({
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
      include: {
        advertiser: { select: { companyName: true } },
        banners: {
          orderBy: { id: 'asc' },
          include: BANNER_INCLUDE,
        },
      },
    });

    const totals = await this.bannerTotals(
      rows.flatMap((row) => row.banners.map((banner) => banner.id)),
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: toCampaignStatus(row.status),
      startsAt: iso(row.startsAt),
      endsAt: iso(row.endsAt),
      advertiserId: row.advertiserId,
      advertiserName: row.advertiser.companyName,
      stripeSessionId: row.stripeSessionId,
      createdAt: iso(row.createdAt),
      banners: row.banners.map((banner) => toBannerDto(banner, totals)),
    }));
  }

  async createCampaign(dto: CreateCampaignDto): Promise<AdCampaignDto> {
    await this.requireAdvertiser(dto.advertiserId);

    const row = await this.prisma.adCampaign.create({
      data: {
        name: dto.name,
        advertiserId: dto.advertiserId,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        status: dto.status ?? 'DRAFT',
      },
      include: {
        advertiser: { select: { companyName: true } },
        banners: { include: BANNER_INCLUDE },
      },
    });

    return {
      id: row.id,
      name: row.name,
      status: toCampaignStatus(row.status),
      startsAt: iso(row.startsAt),
      endsAt: iso(row.endsAt),
      advertiserId: row.advertiserId,
      advertiserName: row.advertiser.companyName,
      stripeSessionId: row.stripeSessionId,
      createdAt: iso(row.createdAt),
      banners: [],
    };
  }

  async updateCampaign(
    id: number,
    dto: UpdateCampaignDto,
  ): Promise<AdCampaignDto> {
    const existing = await this.prisma.adCampaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campania nu există');

    if (dto.advertiserId !== undefined) {
      await this.requireAdvertiser(dto.advertiserId);
    }

    // `endsAt > startsAt` se verifică peste valorile ÎMBINATE: o cerere care
    // schimbă doar una dintre date nu are cum să fie validată în DTO.
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException(
        'Data de sfârșit trebuie să fie după data de început',
      );
    }

    const row = await this.prisma.adCampaign.update({
      where: { id },
      data: {
        name: dto.name,
        advertiserId: dto.advertiserId,
        startsAt: dto.startsAt ? startsAt : undefined,
        endsAt: dto.endsAt ? endsAt : undefined,
        status: dto.status,
      },
      include: {
        advertiser: { select: { companyName: true } },
        banners: { orderBy: { id: 'asc' }, include: BANNER_INCLUDE },
      },
    });

    const totals = await this.bannerTotals(
      row.banners.map((banner) => banner.id),
    );

    return {
      id: row.id,
      name: row.name,
      status: toCampaignStatus(row.status),
      startsAt: iso(row.startsAt),
      endsAt: iso(row.endsAt),
      advertiserId: row.advertiserId,
      advertiserName: row.advertiser.companyName,
      stripeSessionId: row.stripeSessionId,
      createdAt: iso(row.createdAt),
      banners: row.banners.map((banner) => toBannerDto(banner, totals)),
    };
  }

  /** Refuzat cu 409 dacă vreun banner al campaniei are deja statistici. */
  async deleteCampaign(id: number): Promise<OkDto> {
    const existing = await this.prisma.adCampaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campania nu există');

    const stats = await this.prisma.adStatDaily.count({
      where: { banner: { campaignId: id } },
    });
    if (stats > 0) {
      throw new ConflictException(
        'Campania are bannere cu statistici înregistrate și nu poate fi ștearsă. Treceți-o pe „COMPLETED" sau „CANCELLED".',
      );
    }

    await this.prisma.adCampaign.delete({ where: { id } });
    return OK;
  }

  /* ================================================================ */
  /* Admin — bannere                                                   */
  /* ================================================================ */

  async listBanners(query: AdBannersQueryDto): Promise<AdBannerDto[]> {
    const rows = await this.prisma.adBanner.findMany({
      where: {
        campaignId: query.campaignId,
        zoneId: query.zoneId,
      },
      orderBy: [{ zoneId: 'asc' }, { id: 'asc' }],
      include: BANNER_INCLUDE,
    });
    const totals = await this.bannerTotals(rows.map((row) => row.id));
    return rows.map((row) => toBannerDto(row, totals));
  }

  async createBanner(dto: CreateBannerDto): Promise<AdBannerDto> {
    await this.requireCampaign(dto.campaignId);
    await this.requireZone(dto.zoneId);

    const imageUrl = textOrNull(dto.imageUrl);
    const html = textOrNull(dto.html);
    if (!imageUrl && !html) {
      throw new BadRequestException(
        'Bannerul are nevoie fie de „imageUrl", fie de marcaj „html"',
      );
    }

    const row = await this.prisma.adBanner.create({
      data: {
        name: dto.name,
        campaignId: dto.campaignId,
        zoneId: dto.zoneId,
        imageUrl,
        html,
        targetUrl: dto.targetUrl,
        alt: textOrNull(dto.alt),
        weight: dto.weight ?? 1,
        active: dto.active ?? true,
      },
      include: BANNER_INCLUDE,
    });
    return toBannerDto(row, new Map());
  }

  async updateBanner(id: number, dto: UpdateBannerDto): Promise<AdBannerDto> {
    const existing = await this.prisma.adBanner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Bannerul nu există');

    if (dto.campaignId !== undefined) await this.requireCampaign(dto.campaignId);
    if (dto.zoneId !== undefined) await this.requireZone(dto.zoneId);

    // „Fie imagine, fie marcaj" se verifică peste valorile îmbinate.
    const imageUrl =
      dto.imageUrl === undefined ? existing.imageUrl : textOrNull(dto.imageUrl);
    const html = dto.html === undefined ? existing.html : textOrNull(dto.html);
    if (!imageUrl && !html) {
      throw new BadRequestException(
        'Bannerul are nevoie fie de „imageUrl", fie de marcaj „html"',
      );
    }

    const row = await this.prisma.adBanner.update({
      where: { id },
      data: {
        name: dto.name,
        campaignId: dto.campaignId,
        zoneId: dto.zoneId,
        imageUrl: dto.imageUrl === undefined ? undefined : imageUrl,
        html: dto.html === undefined ? undefined : html,
        targetUrl: dto.targetUrl,
        alt: dto.alt === undefined ? undefined : textOrNull(dto.alt),
        weight: dto.weight,
        active: dto.active,
      },
      include: BANNER_INCLUDE,
    });

    const totals = await this.bannerTotals([row.id]);
    return toBannerDto(row, totals);
  }

  /** Statisticile bannerului cad în cascadă (`onDelete: Cascade`). */
  async deleteBanner(id: number): Promise<OkDto> {
    try {
      await this.prisma.adBanner.delete({ where: { id } });
    } catch (error) {
      if (isMissingRecord(error)) {
        throw new NotFoundException('Bannerul nu există');
      }
      throw error;
    }
    return OK;
  }

  /* ================================================================ */
  /* Admin — statistici                                                */
  /* ================================================================ */

  /** `GET /api/admin/ads/stats?campaignId=&days=30` — fereastra include azi. */
  async stats(query: AdStatsQueryDto): Promise<AdStatRowDto[]> {
    const days = query.days ?? 30;
    const rows = await this.prisma.adStatDaily.findMany({
      where: {
        date: { gte: utcWindowStart(days) },
        ...(query.campaignId === undefined
          ? {}
          : { banner: { campaignId: query.campaignId } }),
      },
      select: {
        date: true,
        bannerId: true,
        impressions: true,
        clicks: true,
        banner: { select: { name: true } },
      },
      orderBy: [{ date: 'desc' }, { bannerId: 'asc' }],
      take: 2000,
    });

    return rows.map((row) => ({
      date: ymd(row.date),
      bannerId: row.bannerId,
      bannerName: row.banner.name,
      impressions: row.impressions,
      clicks: row.clicks,
    }));
  }

  /** `GET /api/admin/ads/overview` — cifrele de pe capul paginii de admin. */
  async overview(): Promise<AdsOverviewDto> {
    const since = utcWindowStart(30);

    const [
      zones,
      advertisers,
      campaignsTotal,
      campaignsActive,
      bannersTotal,
      bannersActive,
      totals,
    ] = await Promise.all([
      this.prisma.adZone.count(),
      this.prisma.advertiser.count(),
      this.prisma.adCampaign.count(),
      this.prisma.adCampaign.count({ where: { status: 'ACTIVE' } }),
      this.prisma.adBanner.count(),
      this.prisma.adBanner.count({ where: { active: true } }),
      this.prisma.adStatDaily.aggregate({
        where: { date: { gte: since } },
        _sum: { impressions: true, clicks: true },
      }),
    ]);

    const impressions30d = totals._sum.impressions ?? 0;
    const clicks30d = totals._sum.clicks ?? 0;

    return {
      zones,
      advertisers,
      campaigns: { active: campaignsActive, total: campaignsTotal },
      banners: { active: bannersActive, total: bannersTotal },
      impressions30d,
      clicks30d,
      ctr:
        impressions30d > 0
          ? Math.round((clicks30d / impressions30d) * 10000) / 100
          : 0,
    };
  }

  /* ================================================================ */
  /* Intern                                                            */
  /* ================================================================ */

  /**
   * Upsert pe `(bannerId, date)` cu data la miezul nopții UTC.
   * Fire-and-forget: o eroare de scriere nu are voie să strice afișarea.
   */
  private async bumpStat(
    bannerId: number,
    field: 'impressions' | 'clicks',
  ): Promise<void> {
    const date = utcMidnight();
    try {
      await this.prisma.adStatDaily.upsert({
        where: { bannerId_date: { bannerId, date } },
        create: {
          bannerId,
          date,
          impressions: field === 'impressions' ? 1 : 0,
          clicks: field === 'clicks' ? 1 : 0,
        },
        update: { [field]: { increment: 1 } },
      });
    } catch (error) {
      this.logger.warn(
        `Statistica ${field} pentru bannerul ${bannerId} nu a fost înregistrată: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** `ads` → `{adsenseClientId}`; orice altă formă e ignorată. */
  private async adsenseClientId(): Promise<string | null> {
    const value = await this.settings.getRaw('ads');
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }
    const client = (value as Record<string, unknown>).adsenseClientId;
    return hasText(client) ? client.trim() : null;
  }

  private webUrl(): string {
    return this.config.get<string>('WEB_URL') ?? 'http://localhost:3100';
  }

  /** Totalurile cumulate per banner (pentru tabelele din admin). */
  private async bannerTotals(
    bannerIds: number[],
  ): Promise<Map<number, { impressions: number; clicks: number }>> {
    const map = new Map<number, { impressions: number; clicks: number }>();
    if (bannerIds.length === 0) return map;

    const rows = await this.prisma.adStatDaily.groupBy({
      by: ['bannerId'],
      where: { bannerId: { in: bannerIds } },
      _sum: { impressions: true, clicks: true },
    });
    for (const row of rows) {
      map.set(row.bannerId, {
        impressions: row._sum.impressions ?? 0,
        clicks: row._sum.clicks ?? 0,
      });
    }
    return map;
  }

  private async requireAdvertiser(id: number): Promise<void> {
    const count = await this.prisma.advertiser.count({ where: { id } });
    if (count === 0) throw new NotFoundException('Clientul nu există');
  }

  private async requireCampaign(id: number): Promise<void> {
    const count = await this.prisma.adCampaign.count({ where: { id } });
    if (count === 0) throw new NotFoundException('Campania nu există');
  }

  private async requireZone(id: number): Promise<void> {
    const count = await this.prisma.adZone.count({ where: { id } });
    if (count === 0) throw new NotFoundException('Zona nu există');
  }
}

/* ------------------------------------------------------------------ */
/* Funcții pure                                                        */
/* ------------------------------------------------------------------ */

/**
 * Rotație ponderată: fiecare banner primește un segment proporțional cu
 * `weight` pe un interval de lungime `total`, iar zarul cade o singură dată.
 */
function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + Math.max(1, item.weight), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(1, item.weight);
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}

function toZoneDto(row: {
  id: number;
  key: string;
  name: string;
  width: number;
  height: number;
  adsenseSlotId: string | null;
  priceMonthly: number | null;
  active: boolean;
  order: number;
}): Omit<AdminZoneDto, 'bannerCount'> {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    width: row.width,
    height: row.height,
    adsenseSlotId: row.adsenseSlotId,
    priceMonthly: row.priceMonthly,
    active: row.active,
    order: row.order,
  };
}

function toAdvertiserDto(row: {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  website: string | null;
  createdAt: Date;
}): Omit<AdvertiserDto, 'campaignCount'> {
  return {
    id: row.id,
    companyName: row.companyName,
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    website: row.website,
    createdAt: iso(row.createdAt),
  };
}

function toBannerDto(
  row: BannerRow,
  totals: Map<number, { impressions: number; clicks: number }>,
): AdBannerDto {
  const total = totals.get(row.id);
  return {
    id: row.id,
    name: row.name,
    campaignId: row.campaignId,
    campaignName: row.campaign.name,
    zoneId: row.zoneId,
    zoneKey: row.zone.key,
    zoneName: row.zone.name,
    width: row.zone.width,
    height: row.zone.height,
    imageUrl: row.imageUrl,
    html: row.html,
    targetUrl: row.targetUrl,
    alt: row.alt,
    weight: row.weight,
    active: row.active,
    impressions: total?.impressions ?? 0,
    clicks: total?.clicks ?? 0,
    createdAt: iso(row.createdAt),
  };
}
