/**
 * Formele de răspuns ale zonei `/api/admin/*`.
 * Oglindesc LITERAL `apps/web/src/lib/types.ts` (contract SPEC §4).
 */

export type Locale = 'ro' | 'ru';
export type Plan = 'monthly' | 'annual';
export type PartnerTier = 'bronze' | 'silver' | 'gold';
export type SubscriberStatus = 'pending' | 'active' | 'canceled' | 'past_due';
export type PartnerStatus = 'pending' | 'paid' | 'active' | 'expired';
export type MessageKind = 'contact' | 'tip';

export interface SourceRef {
  label: string;
  url: string;
}

export interface ArticleAuthorRef {
  slug: string;
  name: string;
  initials: string;
}

/** Articol localizat — folosit doar în `stats.recent` (SPEC §4). */
export interface ArticleListDto {
  id: number;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  categoryName: string;
  categoryHue: number;
  author: ArticleAuthorRef;
  publishedAt: string;
  readMin: number;
  views: number;
  coverSeed: number;
  featured: boolean;
  breaking: boolean;
  premium: boolean;
  tags: string[];
}

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface OkDto {
  ok: true;
}

/** Articol BRUT, nelocalizat — pentru editorul din admin. */
export interface AdminArticleDto {
  id: number;
  slug: string;
  categoryId: number;
  authorId: number;
  titleRo: string;
  titleRu: string;
  summaryRo: string;
  summaryRu: string;
  contentRo: string;
  contentRu: string;
  tagsRo: string[];
  tagsRu: string[];
  sources: SourceRef[];
  coverSeed: number;
  featured: boolean;
  breaking: boolean;
  premium: boolean;
  published: boolean;
  views: number;
  readMin: number;
  publishedAt: string;
  updatedAt: string | null;
  createdAt: string;
  category?: { slug: string; nameRo: string; nameRu: string; hue: number };
  author?: { slug: string; name: string; initials: string };
}

export interface AdminAuthorDto {
  id: number;
  slug: string;
  name: string;
  initials: string;
  email: string;
  roleRo: string;
  roleRu: string;
  bioRo: string;
  bioRu: string;
  articleCount?: number;
}

export interface SubscriberDto {
  id: number;
  email: string;
  plan: Plan | null;
  status: SubscriberStatus;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface PartnerDto {
  id: number;
  company: string;
  email: string;
  contactName: string;
  tier: PartnerTier;
  months: number;
  amountMdl: number;
  status: PartnerStatus;
  websiteUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface MessageDto {
  id: number;
  kind: MessageKind;
  name: string | null;
  email: string | null;
  subject: string | null;
  body: string;
  handled: boolean;
  createdAt: string;
}

export interface CategoryCountDto {
  slug: string;
  name: string;
  count: number;
}

export interface AdminStatsDto {
  articles: number;
  published: number;
  premium: number;
  views: number;
  subscribers: { active: number; total: number };
  partners: { active: number; pending: number };
  messages: { unread: number };
  byCategory: CategoryCountDto[];
  recent: ArticleListDto[];
  latestSubscribers: SubscriberDto[];
  revenueMdl: number;
}
