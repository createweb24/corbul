import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Author,
  Message,
  Partner,
  Prisma,
  Subscriber,
} from '@prisma/client';

import { isDatabaseId } from '../common/int32';
import { escapeLike } from '../common/like';
import { slugify, uniqueSlug } from '../common/slugify';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  AdminArticleDto,
  AdminAuthorDto,
  AdminStatsDto,
  ArticleListDto,
  CategoryCountDto,
  MessageDto,
  MessageKind,
  PaginatedDto,
  PartnerDto,
  PartnerStatus,
  PartnerTier,
  Plan,
  SourceRef,
  SubscriberDto,
  SubscriberStatus,
} from './admin.types';
import {
  AdminArticleQueryDto,
  ArticleFlagsDto,
  CreateArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';
import {
  MessagesQueryDto,
  PartnersQueryDto,
  SubscribersQueryDto,
} from './dto/moderation.dto';

/* ------------------------------------------------------------------ */
/* Forme Prisma                                                        */
/* ------------------------------------------------------------------ */

const ARTICLE_INCLUDE = {
  category: { select: { slug: true, nameRo: true, nameRu: true, hue: true } },
  author: { select: { slug: true, name: true, initials: true } },
} satisfies Prisma.ArticleInclude;

type ArticleWithRefs = Prisma.ArticleGetPayload<{
  include: typeof ARTICLE_INCLUDE;
}>;

type SubscriberRow = Subscriber;
type PartnerRow = Partner;
type MessageRow = Message;
type AuthorRow = Author;

/* ------------------------------------------------------------------ */
/* Coerciții de uniuni (DB stochează string-uri libere)                */
/* ------------------------------------------------------------------ */

const SUBSCRIBER_STATUSES: readonly SubscriberStatus[] = [
  'pending',
  'active',
  'canceled',
  'past_due',
];
const PARTNER_STATUSES: readonly PartnerStatus[] = [
  'pending',
  'paid',
  'active',
  'expired',
];
const PARTNER_TIERS: readonly PartnerTier[] = ['bronze', 'silver', 'gold'];
const PLANS: readonly Plan[] = ['monthly', 'annual'];
const MESSAGE_KINDS: readonly MessageKind[] = ['contact', 'tip'];

function asSubscriberStatus(value: string): SubscriberStatus {
  return SUBSCRIBER_STATUSES.includes(value as SubscriberStatus)
    ? (value as SubscriberStatus)
    : 'pending';
}

function asPartnerStatus(value: string): PartnerStatus {
  return PARTNER_STATUSES.includes(value as PartnerStatus)
    ? (value as PartnerStatus)
    : 'pending';
}

function asPartnerTier(value: string): PartnerTier {
  return PARTNER_TIERS.includes(value as PartnerTier)
    ? (value as PartnerTier)
    : 'bronze';
}

function asPlan(value: string | null): Plan | null {
  if (value === null) return null;
  return PLANS.includes(value as Plan) ? (value as Plan) : null;
}

function asMessageKind(value: string): MessageKind {
  return MESSAGE_KINDS.includes(value as MessageKind)
    ? (value as MessageKind)
    : 'contact';
}

function iso(date: Date): string {
  return date.toISOString();
}

function isoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/** `sources` e `Json` în DB — îl aducem la `SourceRef[]` fără să crape. */
function parseSources(value: Prisma.JsonValue): SourceRef[] {
  if (!Array.isArray(value)) return [];
  const out: SourceRef[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const label = typeof record.label === 'string' ? record.label : '';
    const url = typeof record.url === 'string' ? record.url : '';
    if (label || url) out.push({ label, url });
  }
  return out;
}

/** `true` pentru coliziunea de unicitate Prisma (`P2002`). */
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/** De câte ori reîncercăm un `create` când slug-ul e luat între timp. */
const SLUG_RETRIES = 3;

/** Etichetele RU cad pe cele RO când lipsesc sau sunt goale. */
function tagsOrFallback(tags: string[] | undefined, fallback: string[]): string[] {
  const cleaned = (tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

/** Estimare de timp de lectură din HTML (≈200 cuvinte/minut). */
function estimateReadMin(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
  return Math.max(2, Math.min(60, Math.round(words / 200) || 2));
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /* ================================================================ */
  /* Statistici                                                        */
  /* ================================================================ */

  async stats(): Promise<AdminStatsDto> {
    const [
      articles,
      published,
      premium,
      viewsAgg,
      subscribersTotal,
      subscribersActive,
      activeByPlan,
      partnersActive,
      partnersPending,
      partnerRevenue,
      unreadMessages,
      categories,
      grouped,
      recentRows,
      latestSubscribers,
      pricing,
    ] = await Promise.all([
      this.prisma.article.count(),
      this.prisma.article.count({ where: { published: true } }),
      this.prisma.article.count({ where: { premium: true } }),
      this.prisma.article.aggregate({ _sum: { views: true } }),
      this.prisma.subscriber.count(),
      this.prisma.subscriber.count({ where: { status: 'active' } }),
      this.prisma.subscriber.groupBy({
        by: ['plan'],
        where: { status: 'active' },
        _count: { _all: true },
      }),
      this.prisma.partner.count({ where: { status: 'active' } }),
      this.prisma.partner.count({ where: { status: 'pending' } }),
      this.prisma.partner.aggregate({
        _sum: { amountMdl: true },
        where: { status: { in: ['paid', 'active'] } },
      }),
      this.prisma.message.count({ where: { handled: false } }),
      this.prisma.category.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.article.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
      }),
      this.prisma.article.findMany({
        include: ARTICLE_INCLUDE,
        orderBy: { publishedAt: 'desc' },
        take: 8,
      }),
      this.prisma.subscriber.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.settings.getPricing(),
    ]);

    const countByCategoryId = new Map<number, number>(
      grouped.map((row) => [row.categoryId, row._count._all]),
    );

    const byCategory: CategoryCountDto[] = categories.map((category) => ({
      slug: category.slug,
      name: category.nameRo,
      count: countByCategoryId.get(category.id) ?? 0,
    }));

    // Venit estimat = abonații activi × prețul planului + parteneriate plătite.
    let subscriptionRevenue = 0;
    for (const row of activeByPlan) {
      const price =
        asPlan(row.plan) === 'annual'
          ? pricing.premiumAnnual
          : pricing.premiumMonthly;
      subscriptionRevenue += price * row._count._all;
    }
    const revenueMdl = Math.round(
      subscriptionRevenue + (partnerRevenue._sum.amountMdl ?? 0),
    );

    return {
      articles,
      published,
      premium,
      views: viewsAgg._sum.views ?? 0,
      subscribers: { active: subscribersActive, total: subscribersTotal },
      partners: { active: partnersActive, pending: partnersPending },
      messages: { unread: unreadMessages },
      byCategory,
      recent: recentRows.map((row) => this.toArticleList(row)),
      latestSubscribers: latestSubscribers.map((row) => this.toSubscriber(row)),
      revenueMdl,
    };
  }

  /* ================================================================ */
  /* Articole                                                          */
  /* ================================================================ */

  async listArticles(
    query: AdminArticleQueryDto,
  ): Promise<PaginatedDto<AdminArticleDto>> {
    const page = Math.max(1, query.page ?? 1);
    const perPage = Math.min(100, Math.max(1, query.perPage ?? 20));

    const where: Prisma.ArticleWhereInput = {};

    const q = escapeLike(query.q?.trim() ?? '');
    if (q) {
      where.OR = [
        { titleRo: { contains: q, mode: 'insensitive' } },
        { titleRu: { contains: q, mode: 'insensitive' } },
        { summaryRo: { contains: q, mode: 'insensitive' } },
        { summaryRu: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const category = query.category?.trim();
    if (category) {
      // Id numeric doar dacă încape într-un `Int` Prisma; altfel e tratat
      // ca slug (și nu potrivește nimic) în loc să producă 500.
      if (/^\d+$/.test(category) && isDatabaseId(Number(category))) {
        where.categoryId = Number(category);
      } else {
        where.category = { slug: category };
      }
    }

    const [total, rows] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        include: ARTICLE_INCLUDE,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return {
      items: rows.map((row) => this.toAdminArticle(row)),
      total,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  async getArticle(id: number): Promise<AdminArticleDto> {
    const row = await this.prisma.article.findUnique({
      where: { id },
      include: ARTICLE_INCLUDE,
    });
    if (!row) throw new NotFoundException('Articolul nu există');
    return this.toAdminArticle(row);
  }

  async createArticle(dto: CreateArticleDto): Promise<AdminArticleDto> {
    await this.assertCategory(dto.categoryId);
    await this.assertAuthor(dto.authorId);

    const tagsRo = tagsOrFallback(dto.tagsRo, []);
    const data: Omit<Prisma.ArticleUncheckedCreateInput, 'slug'> = {
      categoryId: dto.categoryId,
      authorId: dto.authorId,
      titleRo: dto.titleRo,
      titleRu: dto.titleRu?.trim() || dto.titleRo,
      summaryRo: dto.summaryRo,
      summaryRu: dto.summaryRu?.trim() || dto.summaryRo,
      contentRo: dto.contentRo,
      contentRu: dto.contentRu?.trim() || dto.contentRo,
      tagsRo,
      // Editorul trimite mereu `tagsRu: []` — array-ul gol înseamnă „lipsă".
      tagsRu: tagsOrFallback(dto.tagsRu, tagsRo),
      sources: (dto.sources ?? []) as unknown as Prisma.InputJsonValue,
      coverSeed: dto.coverSeed ?? Math.floor(Math.random() * 100_000),
      readMin: dto.readMin ?? estimateReadMin(dto.contentRo),
      views: dto.views ?? 0,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
      featured: dto.featured ?? false,
      breaking: dto.breaking ?? false,
      premium: dto.premium ?? false,
      published: dto.published ?? true,
    };

    // Slug-ul unic e calculat înainte de `create`; două creări simultane cu
    // același titlu pot alege același slug — la P2002 recalculăm și reîncercăm.
    const source = dto.slug || dto.titleRo;
    for (let attempt = 1; ; attempt += 1) {
      const slug = await this.uniqueArticleSlug(source);
      try {
        const row = await this.prisma.article.create({
          data: { ...data, slug },
          include: ARTICLE_INCLUDE,
        });
        return this.toAdminArticle(row);
      } catch (error) {
        if (!isUniqueViolation(error) || attempt >= SLUG_RETRIES) {
          throw this.conflictOr(error, `Slug-ul „${slug}" este deja folosit`);
        }
      }
    }
  }

  async updateArticle(
    id: number,
    dto: UpdateArticleDto,
  ): Promise<AdminArticleDto> {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Articolul nu există');

    if (dto.categoryId !== undefined) await this.assertCategory(dto.categoryId);
    if (dto.authorId !== undefined) await this.assertAuthor(dto.authorId);

    const data: Prisma.ArticleUpdateInput = { updatedAt: new Date() };

    // Slug-ul se schimbă doar dacă e trimis explicit (URL-urile publice
    // nu trebuie să se mute la fiecare corectură de titlu).
    if (dto.slug !== undefined) {
      const base = dto.slug.trim() || dto.titleRo || existing.titleRo;
      data.slug = await this.uniqueArticleSlug(base, id);
    }

    if (dto.categoryId !== undefined) {
      data.category = { connect: { id: dto.categoryId } };
    }
    if (dto.authorId !== undefined) {
      data.author = { connect: { id: dto.authorId } };
    }
    // Câmpurile RU golite cad pe varianta RO (ca la creare), altfel pagina
    // /ru/ ar avea <h1> gol sau conținut lipsă.
    const titleRo = dto.titleRo ?? existing.titleRo;
    const summaryRo = dto.summaryRo ?? existing.summaryRo;
    const contentRo = dto.contentRo ?? existing.contentRo;
    const tagsRo =
      dto.tagsRo !== undefined ? tagsOrFallback(dto.tagsRo, []) : existing.tagsRo;

    if (dto.titleRo !== undefined) data.titleRo = titleRo;
    if (dto.titleRu !== undefined) data.titleRu = dto.titleRu.trim() || titleRo;
    if (dto.summaryRo !== undefined) data.summaryRo = summaryRo;
    if (dto.summaryRu !== undefined) {
      data.summaryRu = dto.summaryRu.trim() || summaryRo;
    }
    if (dto.contentRo !== undefined) data.contentRo = contentRo;
    if (dto.contentRu !== undefined) {
      data.contentRu = dto.contentRu.trim() || contentRo;
    }
    if (dto.tagsRo !== undefined) data.tagsRo = tagsRo;
    if (dto.tagsRu !== undefined) data.tagsRu = tagsOrFallback(dto.tagsRu, tagsRo);
    if (dto.sources !== undefined) {
      data.sources = dto.sources as unknown as Prisma.InputJsonValue;
    }
    if (dto.coverSeed !== undefined) data.coverSeed = dto.coverSeed;
    if (dto.readMin !== undefined) data.readMin = dto.readMin;
    if (dto.views !== undefined) data.views = dto.views;
    if (dto.publishedAt !== undefined) {
      data.publishedAt = new Date(dto.publishedAt);
    }
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.breaking !== undefined) data.breaking = dto.breaking;
    if (dto.premium !== undefined) data.premium = dto.premium;
    if (dto.published !== undefined) data.published = dto.published;

    const row = await this.prisma.article.update({
      where: { id },
      data,
      include: ARTICLE_INCLUDE,
    });
    return this.toAdminArticle(row);
  }

  async setArticleFlags(
    id: number,
    dto: ArticleFlagsDto,
  ): Promise<AdminArticleDto> {
    const data: Prisma.ArticleUpdateInput = {};
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.breaking !== undefined) data.breaking = dto.breaking;
    if (dto.premium !== undefined) data.premium = dto.premium;
    if (dto.published !== undefined) data.published = dto.published;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Niciun comutator de modificat');
    }

    try {
      const row = await this.prisma.article.update({
        where: { id },
        data,
        include: ARTICLE_INCLUDE,
      });
      return this.toAdminArticle(row);
    } catch (error) {
      throw this.notFoundOr(error, 'Articolul nu există');
    }
  }

  async deleteArticle(id: number): Promise<{ ok: true }> {
    try {
      await this.prisma.article.delete({ where: { id } });
      return { ok: true };
    } catch (error) {
      throw this.notFoundOr(error, 'Articolul nu există');
    }
  }

  /* ================================================================ */
  /* Autori                                                            */
  /* ================================================================ */

  async listAuthors(): Promise<AdminAuthorDto[]> {
    const rows = await this.prisma.author.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: true } } },
    });
    return rows.map((row) => ({
      ...this.toAuthor(row),
      articleCount: row._count.articles,
    }));
  }

  async getAuthor(id: number): Promise<AdminAuthorDto> {
    const row = await this.prisma.author.findUnique({
      where: { id },
      include: { _count: { select: { articles: true } } },
    });
    if (!row) throw new NotFoundException('Autorul nu există');
    return { ...this.toAuthor(row), articleCount: row._count.articles };
  }

  async createAuthor(dto: CreateAuthorDto): Promise<AdminAuthorDto> {
    const data: Omit<Prisma.AuthorCreateInput, 'slug'> = {
      name: dto.name,
      initials: dto.initials?.trim() || this.initialsOf(dto.name),
      email: dto.email,
      roleRo: dto.roleRo,
      roleRu: dto.roleRu?.trim() || dto.roleRo,
      bioRo: dto.bioRo,
      bioRu: dto.bioRu?.trim() || dto.bioRo,
    };

    const source = dto.slug || dto.name;
    for (let attempt = 1; ; attempt += 1) {
      const slug = await this.uniqueAuthorSlug(source);
      try {
        const row = await this.prisma.author.create({ data: { ...data, slug } });
        return { ...this.toAuthor(row), articleCount: 0 };
      } catch (error) {
        if (!isUniqueViolation(error) || attempt >= SLUG_RETRIES) {
          throw this.conflictOr(error, `Slug-ul „${slug}" este deja folosit`);
        }
      }
    }
  }

  async updateAuthor(id: number, dto: UpdateAuthorDto): Promise<AdminAuthorDto> {
    const existing = await this.prisma.author.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Autorul nu există');

    const data: Prisma.AuthorUpdateInput = {};
    if (dto.slug !== undefined) {
      const base = dto.slug.trim() || dto.name || existing.name;
      data.slug = await this.uniqueAuthorSlug(base, id);
    }
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.initials !== undefined) {
      data.initials = dto.initials.trim() || this.initialsOf(dto.name ?? existing.name);
    }
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.roleRo !== undefined) data.roleRo = dto.roleRo;
    if (dto.roleRu !== undefined) data.roleRu = dto.roleRu;
    if (dto.bioRo !== undefined) data.bioRo = dto.bioRo;
    if (dto.bioRu !== undefined) data.bioRu = dto.bioRu;

    const row = await this.prisma.author.update({
      where: { id },
      data,
      include: { _count: { select: { articles: true } } },
    });
    return { ...this.toAuthor(row), articleCount: row._count.articles };
  }

  async deleteAuthor(id: number): Promise<{ ok: true }> {
    const count = await this.prisma.article.count({ where: { authorId: id } });
    if (count > 0) {
      throw new ConflictException(
        `Autorul are ${count} articole — reatribuie-le înainte de ștergere`,
      );
    }
    try {
      await this.prisma.author.delete({ where: { id } });
      return { ok: true };
    } catch (error) {
      throw this.notFoundOr(error, 'Autorul nu există');
    }
  }

  /* ================================================================ */
  /* Mesaje                                                            */
  /* ================================================================ */

  async listMessages(query: MessagesQueryDto): Promise<MessageDto[]> {
    const where: Prisma.MessageWhereInput = {};
    if (query.kind) where.kind = query.kind;
    if (query.handled !== undefined) where.handled = query.handled;
    const q = escapeLike(query.q?.trim() ?? '');
    if (q) {
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(500, query.limit ?? 200),
    });
    return rows.map((row) => this.toMessage(row));
  }

  async setMessageHandled(id: number, handled: boolean): Promise<MessageDto> {
    try {
      const row = await this.prisma.message.update({
        where: { id },
        data: { handled },
      });
      return this.toMessage(row);
    } catch (error) {
      throw this.notFoundOr(error, 'Mesajul nu există');
    }
  }

  async deleteMessage(id: number): Promise<{ ok: true }> {
    try {
      await this.prisma.message.delete({ where: { id } });
      return { ok: true };
    } catch (error) {
      throw this.notFoundOr(error, 'Mesajul nu există');
    }
  }

  /* ================================================================ */
  /* Abonați și parteneri                                              */
  /* ================================================================ */

  async listSubscribers(query: SubscribersQueryDto): Promise<SubscriberDto[]> {
    const where: Prisma.SubscriberWhereInput = {};
    if (query.status) where.status = query.status;
    const q = escapeLike(query.q?.trim() ?? '');
    if (q) where.email = { contains: q, mode: 'insensitive' };

    const rows = await this.prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(500, query.limit ?? 200),
    });
    return rows.map((row) => this.toSubscriber(row));
  }

  async listPartners(query: PartnersQueryDto): Promise<PartnerDto[]> {
    const where: Prisma.PartnerWhereInput = {};
    if (query.status) where.status = query.status;
    const q = escapeLike(query.q?.trim() ?? '');
    if (q) {
      where.OR = [
        { company: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.partner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(500, query.limit ?? 200),
    });
    return rows.map((row) => this.toPartner(row));
  }

  /**
   * Schimbă statusul unui partener. La activare completează automat
   * intervalul de sponsorizare; la expirare închide un interval încă deschis.
   */
  async setPartnerStatus(
    id: number,
    status: PartnerStatus,
  ): Promise<PartnerDto> {
    const existing = await this.prisma.partner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Partenerul nu există');

    const data: Prisma.PartnerUpdateInput = { status };
    const now = new Date();

    if (status === 'active') {
      const startsAt = existing.startsAt ?? now;
      data.startsAt = startsAt;
      if (!existing.endsAt) {
        const endsAt = new Date(startsAt);
        endsAt.setMonth(endsAt.getMonth() + Math.max(1, existing.months));
        data.endsAt = endsAt;
      }
    } else if (status === 'expired') {
      const endsAt = existing.endsAt;
      data.endsAt = endsAt !== null && endsAt < now ? endsAt : now;
    }

    const row = await this.prisma.partner.update({ where: { id }, data });
    return this.toPartner(row);
  }

  /* ================================================================ */
  /* Helperi                                                           */
  /* ================================================================ */

  private async assertCategory(categoryId: number): Promise<void> {
    const found = await this.prisma.category.count({
      where: { id: categoryId },
    });
    if (found === 0) {
      throw new BadRequestException(`Categoria #${categoryId} nu există`);
    }
  }

  private async assertAuthor(authorId: number): Promise<void> {
    const found = await this.prisma.author.count({ where: { id: authorId } });
    if (found === 0) {
      throw new BadRequestException(`Autorul #${authorId} nu există`);
    }
  }

  /** Slug unic: `titlu`, `titlu-2`, `titlu-3`… */
  private async uniqueArticleSlug(
    source: string,
    excludeId?: number,
  ): Promise<string> {
    const base = slugify(source) || 'articol';
    const rows = await this.prisma.article.findMany({
      where: {
        slug: { startsWith: base },
        ...(excludeId === undefined ? {} : { id: { not: excludeId } }),
      },
      select: { slug: true },
    });
    return uniqueSlug(base, rows.map((row) => row.slug));
  }

  private async uniqueAuthorSlug(
    source: string,
    excludeId?: number,
  ): Promise<string> {
    const base = slugify(source) || 'autor';
    const rows = await this.prisma.author.findMany({
      where: {
        slug: { startsWith: base },
        ...(excludeId === undefined ? {} : { id: { not: excludeId } }),
      },
      select: { slug: true },
    });
    return uniqueSlug(base, rows.map((row) => row.slug));
  }

  private initialsOf(name: string): string {
    const parts = name
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const letters = parts.slice(0, 2).map((part) => part[0].toUpperCase());
    return letters.join('') || name.slice(0, 2).toUpperCase() || '??';
  }

  /** Traduce coliziunile de unicitate Prisma (`P2002`) în 409. */
  private conflictOr(error: unknown, message: string): Error {
    if (isUniqueViolation(error)) return new ConflictException(message);
    return error instanceof Error ? error : new Error(String(error));
  }

  /** Traduce erorile Prisma „record not found” în 404. */
  private notFoundOr(error: unknown, message: string): Error {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return new NotFoundException(message);
    }
    return error instanceof Error ? error : new Error(String(error));
  }

  /* --- mapări ------------------------------------------------------ */

  private toAdminArticle(row: ArticleWithRefs): AdminArticleDto {
    return {
      id: row.id,
      slug: row.slug,
      categoryId: row.categoryId,
      authorId: row.authorId,
      titleRo: row.titleRo,
      titleRu: row.titleRu,
      summaryRo: row.summaryRo,
      summaryRu: row.summaryRu,
      contentRo: row.contentRo,
      contentRu: row.contentRu,
      tagsRo: row.tagsRo,
      tagsRu: row.tagsRu,
      sources: parseSources(row.sources),
      coverSeed: row.coverSeed,
      featured: row.featured,
      breaking: row.breaking,
      premium: row.premium,
      published: row.published,
      views: row.views,
      readMin: row.readMin,
      publishedAt: iso(row.publishedAt),
      updatedAt: isoOrNull(row.updatedAt),
      createdAt: iso(row.createdAt),
      category: {
        slug: row.category.slug,
        nameRo: row.category.nameRo,
        nameRu: row.category.nameRu,
        hue: row.category.hue,
      },
      author: {
        slug: row.author.slug,
        name: row.author.name,
        initials: row.author.initials,
      },
    };
  }

  /** Varianta localizată RO — panoul de administrare e monolingv. */
  private toArticleList(row: ArticleWithRefs): ArticleListDto {
    return {
      id: row.id,
      slug: row.slug,
      title: row.titleRo,
      summary: row.summaryRo,
      categorySlug: row.category.slug,
      categoryName: row.category.nameRo,
      categoryHue: row.category.hue,
      author: {
        slug: row.author.slug,
        name: row.author.name,
        initials: row.author.initials,
      },
      publishedAt: iso(row.publishedAt),
      readMin: row.readMin,
      views: row.views,
      coverSeed: row.coverSeed,
      featured: row.featured,
      breaking: row.breaking,
      premium: row.premium,
      tags: row.tagsRo,
    };
  }

  private toAuthor(row: AuthorRow): AdminAuthorDto {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      initials: row.initials,
      email: row.email,
      roleRo: row.roleRo,
      roleRu: row.roleRu,
      bioRo: row.bioRo,
      bioRu: row.bioRu,
    };
  }

  private toSubscriber(row: SubscriberRow): SubscriberDto {
    return {
      id: row.id,
      email: row.email,
      plan: asPlan(row.plan),
      status: asSubscriberStatus(row.status),
      currentPeriodEnd: isoOrNull(row.currentPeriodEnd),
      createdAt: iso(row.createdAt),
    };
  }

  private toPartner(row: PartnerRow): PartnerDto {
    return {
      id: row.id,
      company: row.company,
      email: row.email,
      contactName: row.contactName,
      tier: asPartnerTier(row.tier),
      months: row.months,
      amountMdl: row.amountMdl,
      status: asPartnerStatus(row.status),
      websiteUrl: row.websiteUrl,
      startsAt: isoOrNull(row.startsAt),
      endsAt: isoOrNull(row.endsAt),
      createdAt: iso(row.createdAt),
    };
  }

  private toMessage(row: MessageRow): MessageDto {
    return {
      id: row.id,
      kind: asMessageKind(row.kind),
      name: row.name,
      email: row.email,
      subject: row.subject,
      body: row.body,
      handled: row.handled,
      createdAt: iso(row.createdAt),
    };
  }
}
