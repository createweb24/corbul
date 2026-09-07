/**
 * Contractul de date între API (NestJS) și web (Next.js) — SPEC §4.
 * Numele câmpurilor sunt LITERALE: serviciile din apps/api trebuie să
 * întoarcă exact aceste forme, deja localizate după parametrul `locale`.
 */

export type Locale = "ro" | "ru";

export type Plan = "monthly" | "annual";
export type PartnerTier = "bronze" | "silver" | "gold";
export type SubscriberStatus = "pending" | "active" | "canceled" | "past_due";
export type PartnerStatus = "pending" | "paid" | "active" | "expired";
export type MessageKind = "contact" | "tip";

/* ------------------------------------------------------------------ */
/* Conținut public                                                     */
/* ------------------------------------------------------------------ */

export interface SourceRef {
  label: string;
  url: string;
}

export interface ArticleAuthorRef {
  slug: string;
  name: string;
  initials: string;
}

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

export interface AuthorDto {
  slug: string;
  name: string;
  initials: string;
  role: string;
  bio: string;
  email: string;
  articleCount?: number;
}

export interface ArticleFullDto extends Omit<ArticleListDto, "author"> {
  content: string;
  /** true dacă articolul e premium și cititorul nu are abonament activ */
  contentIsTruncated: boolean;
  sources: SourceRef[];
  updatedAt: string | null;
  author: AuthorDto;
}

export interface CategoryDto {
  /** identificatorul numeric (aditiv la contractul §4; cerut de editorul admin) */
  id: number;
  slug: string;
  name: string;
  description: string;
  hue: number;
  order: number;
  count: number;
}

export interface AuthorWithArticlesDto extends AuthorDto {
  articles: ArticleListDto[];
}

/* ------------------------------------------------------------------ */
/* Liste, paginare, căutare                                            */
/* ------------------------------------------------------------------ */

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export type ArticleListResponse = PaginatedDto<ArticleListDto>;

export interface SearchResultDto {
  items: ArticleListDto[];
  total: number;
  q: string;
}

export interface HealthDto {
  ok: boolean;
  name: "corbul-api";
  articles: number;
}

export interface ViewCountDto {
  views: number;
}

/* ------------------------------------------------------------------ */
/* Setări publice                                                      */
/* ------------------------------------------------------------------ */

export interface LocalizedText {
  ro: string;
  ru: string;
}

export interface LocalizedList {
  ro: string[];
  ru: string[];
}

export interface PricingSettings {
  premiumMonthly: number;
  premiumAnnual: number;
  currency: string;
  tiers: Record<PartnerTier, number>;
}

export interface ContactSettings {
  email: string;
  phone: string;
  address_ro: string;
  address_ru: string;
}

/** Profilurile publice ale redacției — `sameAs` în JSON-LD (goale = lipsă). */
export interface SocialSettings {
  facebook: string;
  telegram: string;
  x: string;
  linkedin: string;
}

/** Răspunsul lui GET /api/settings — un obiect cu cheile seed-uite. */
export interface SettingsDto {
  tagline: LocalizedText;
  ticker: LocalizedList;
  pricing: PricingSettings;
  contact: ContactSettings;
  social: SocialSettings;
}

/* ------------------------------------------------------------------ */
/* Widgeturi (vreme + curs BNM)                                        */
/* ------------------------------------------------------------------ */

export interface WeatherDayDto {
  date: string;
  code: number;
  min: number;
  max: number;
}

export interface WeatherDto {
  tempC: number;
  code: number;
  windKmh: number;
  humidity: number;
  /** 4 zile; days[0] = azi */
  days: WeatherDayDto[];
}

export interface RateDto {
  code: string;
  nameRo: string;
  nameRu: string;
  /** MDL pentru 1 unitate de valută */
  rate: number;
  /** cursul de referință anterior (pentru săgeata ↑↓) */
  prev: number;
}

export interface WidgetsDto {
  weather: WeatherDto;
  rates: RateDto[];
  fetchedAt: string;
  /** true dacă s-au folosit valorile de rezervă */
  stale: boolean;
  /** data cursului BNM efectiv folosit (ISO `YYYY-MM-DD`); lipsă la rezervă */
  ratesDate?: string;
}

/* ------------------------------------------------------------------ */
/* Plăți, abonați, parteneri, mesaje                                   */
/* ------------------------------------------------------------------ */

export interface CheckoutResponseDto {
  /** null în modul demonstrativ (fără chei Stripe reale) */
  url: string | null;
  demo?: boolean;
  message?: string;
  /** identificatorul sesiunii demonstrative */
  sessionId?: string;
  /** în mod demonstrativ, calea care duce fluxul până la capăt */
  successUrl?: string;
}

export interface PaymentSessionDto {
  status: string;
  email: string | null;
  accessToken?: string;
}

export interface ReaderVerifyDto {
  active: boolean;
  plan: Plan | null;
  currentPeriodEnd: string | null;
}

export interface OkDto {
  ok: true;
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

/* ------------------------------------------------------------------ */
/* Autentificare + administrare                                        */
/* ------------------------------------------------------------------ */

export interface AdminUserDto {
  email: string;
  name: string;
}

export interface LoginResponseDto {
  token: string;
  user: AdminUserDto;
}

/** Articol în forma brută, nelocalizată — pentru editorul din admin. */
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

export type AdminArticleListResponse = PaginatedDto<AdminArticleDto>;

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

export interface SettingRowDto {
  key: string;
  value: unknown;
}

/* ------------------------------------------------------------------ */
/* Publicitate (ADS-SPEC §2)                                           */
/* ------------------------------------------------------------------ */

/** Cheile zonelor seed-uite. `string` rămâne acceptat: zonele se pot adăuga
 *  din panoul de administrare, iar web-ul nu trebuie recompilat pentru asta. */
export type AdZoneKey =
  | "header_leaderboard"
  | "home_infeed"
  | "article_inline"
  | "sidebar_top"
  | "sidebar_bottom";

/** `GET /api/ads/zones` — zonele active, ordonate după `order`. */
export interface AdZoneDto {
  key: string;
  name: string;
  width: number;
  height: number;
  /** în bani (MDL × 100); null dacă zona nu se vinde separat */
  priceMonthly: number | null;
  order: number;
}

/** Dimensiunile zonei, așa cum le întoarce ruta de servire. */
export interface ServedAdZoneRef {
  key: string;
  width: number;
  height: number;
}

export interface ServedDirectAdDto {
  provider: "DIRECT";
  bannerId: number;
  zone: ServedAdZoneRef;
  imageUrl: string | null;
  html: string | null;
  alt: string | null;
  /** cale relativă la API (`/api/ads/click/:bannerId`) */
  clickUrl: string;
}

export interface ServedAdsenseAdDto {
  provider: "ADSENSE";
  zone: ServedAdZoneRef;
  client: string;
  slot: string;
}

export interface ServedNoAdDto {
  provider: "NONE";
  /** null când zona nici nu există (răspuns 200, nu 404) */
  zone: ServedAdZoneRef | null;
}

/** `GET /api/ads/serve/:zoneKey` — uniune discriminată după `provider`. */
export type ServedAdDto = ServedDirectAdDto | ServedAdsenseAdDto | ServedNoAdDto;
