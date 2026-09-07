# CORBUL.MD — SPECIFICAȚIE (contract obligatoriu între module)

Portal premium de **analiză și investigație**, Republica Moldova, bilingv **RO/RU**.

**Stack impus (identic cu proiectul GLOBAL_NEWS al clientului):**
React 19 + Next.js 15 (App Router, TypeScript, Tailwind v4, next-intl) · NestJS 11 · PostgreSQL + Prisma · Stripe

**Estetica trebuie să fie COMPLET DIFERITĂ de GLOBAL_NEWS.**
GLOBAL_NEWS = hârtie albă, roșu #d21f26, sans condensat, portal de știri rapide.
CORBUL.MD = **obsidian + auriu, serif editorial, dosar de investigație**. Referințe de prestigiu: The Economist, Financial Times, Le Monde Diplomatique — dar dark, cu identitate proprie de corb. Nimic din paleta, tipografia sau layout-ul GLOBAL_NEWS nu se reia.

Director: `/Users/bobernagadamian/CORBUL/`
Conținut editorial deja produs (24 articole RO+RU, 6 autori, setări): `/Users/bobernagadamian/CORBUL/.content/seed-content.json` — se consumă de seed-ul Prisma.

---

## 0. Reguli absolute pentru toți agenții

1. Citește TOT acest SPEC înainte de a scrie cod. Modulele sunt scrise în paralel de agenți diferiți; contractele (nume de fișiere, exporturi, rute API, props de componente, chei i18n, nume de modele Prisma) sunt **literale** — nu le reinterpreta, nu le „îmbunătăți".
2. Scrie **doar** fișierele care îți sunt atribuite în §2. Nu atinge fișierele altora. Dacă ai nevoie de ceva ce lipsește, presupune contractul din SPEC și notează în raport.
3. TypeScript strict peste tot. Zero `any` nemotivat. Zero erori de tip.
4. Tot textul de interfață trece prin next-intl (`ro.json` / `ru.json`). Conținutul editorial e în DB, cu traduceri.
5. Diacritice românești corecte (ă â î ș ț) și rusă reală (nu transliterare).
6. Fără biblioteci UI externe (shadcn, MUI, bootstrap). Fără librării de grafice. Tot ce se vede e scris de mână în Tailwind v4 + CSS. Iconițe: SVG inline scrise de tine.
7. Fără imagini binare în repo. Vizualul vine din SVG generat + tipografie + culoare.

---

## 1. Produs — ce este Corbul.md

Portal de jurnalism de investigație și analiză economico-juridică, cu **model de venit dublu**:

- **Abonament „Corbul Premium"** (Stripe Checkout, lunar/anual) — articolele marcate `premium` se afișează trunchiat (primele ~2 paragrafe) cu un paywall elegant; abonatul vede tot.
- **Parteneriate B2B** (clienți ideali: cabinete de avocatură, bănci/fintech, industrie, consultanță) — pachete de sponsorizare cumpărabile prin Stripe Checkout, cu badge „Susținut de" pe secțiuni.

Plus: newsletter, formular de sesizări („Trimite un pont securizat"), instrumente fiscale, widgeturi live (vreme, curs BNM, ceas), panou de administrare complet.

### Categorii (ordinea = ordinea din meniu). `slug` e cheia peste tot.

| slug | RO | RU | hue |
|---|---|---|---|
| investigatii | Investigații | Расследования | 42 |
| politica | Politică | Политика | 0 |
| economie | Economie | Экономика | 145 |
| energie | Energie | Энергетика | 28 |
| juridic | Juridic | Юридическое | 210 |
| finante | Finanțe | Финансы | 165 |
| infrastructura | Infrastructură | Инфраструктура | 260 |
| coruptie | Corupție | Коррупция | 355 |
| analize | Analize | Аналитика | 190 |
| opinie | Opinie | Мнение | 300 |
| business-public | Business public | Госбизнес | 85 |

`hue` = nuanță HSL folosită pentru accentul de categorie și pentru coperta SVG generată.

---

## 2. Harta fișierelor și proprietarii

```
CORBUL/
├── package.json                       ← A0 (workspaces: apps/*)
├── README.md                          ← A0
├── .gitignore                         ← A0
├── .content/seed-content.json         ← EXISTĂ (nu se modifică)
├── apps/api/                          ← NestJS
│   ├── package.json, tsconfig*.json, nest-cli.json, .env, .env.example   ← A0
│   ├── prisma/schema.prisma           ← A0
│   ├── prisma/seed.ts                 ← A0
│   └── src/
│       ├── main.ts, app.module.ts     ← A0
│       ├── prisma/prisma.service.ts, prisma.module.ts   ← A0
│       ├── articles/                  ← A1
│       ├── categories/                ← A1
│       ├── authors/                   ← A1
│       ├── search/                    ← A1
│       ├── auth/                      ← A2
│       ├── admin/                     ← A2
│       ├── settings/                  ← A2
│       ├── widgets/                   ← A3
│       ├── payments/                  ← A3
│       ├── subscribers/               ← A3
│       └── inbox/                     ← A3  (newsletter, contact, ponturi)
└── apps/web/                          ← Next.js
    ├── package.json, tsconfig.json, next.config.ts, postcss.config.mjs,
    │   .env.local, .env.example, eslint.config.mjs                        ← A0
    ├── messages/ro.json, messages/ru.json                                  ← A5
    ├── src/i18n/routing.ts, request.ts   ← A0
    ├── src/middleware.ts                 ← A0
    ├── src/lib/api.ts, types.ts, format.ts, cover.ts   ← A0
    ├── src/app/globals.css               ← A4
    ├── src/components/ui/*               ← A4
    ├── src/components/shell/*            ← A5
    ├── src/components/widgets/*          ← A5
    ├── src/app/[locale]/layout.tsx + paginile publice  ← A6
    ├── src/app/[locale]/instrumente/*    ← A7
    ├── src/app/admin/*                   ← A8
    ├── src/app/sitemap.ts, robots.ts, opengraph-image.tsx  ← A6
    └── src/app/layout.tsx                ← A0 (root layout minimal)
```

**A0 = agentul de fundație.** Rulează SINGUR, primul. Toți ceilalți depind de el.

---

## 3. Contract de date — Prisma (proprietar: A0)

Baza `corbul` există deja pe `postgresql://localhost:5432/corbul`.

```prisma
model Category {
  id           Int      @id @default(autoincrement())
  slug         String   @unique
  hue          Int
  order        Int
  nameRo       String
  nameRu       String
  descRo       String
  descRu       String
  articles     Article[]
}

model Author {
  id        Int      @id @default(autoincrement())
  slug      String   @unique      // 'ana-corbeanu'
  name      String
  initials  String
  email     String
  roleRo    String
  roleRu    String
  bioRo     String   @db.Text
  bioRu     String   @db.Text
  articles  Article[]
}

model Article {
  id          Int       @id @default(autoincrement())
  slug        String    @unique
  categoryId  Int
  category    Category  @relation(fields: [categoryId], references: [id])
  authorId    Int
  author      Author    @relation(fields: [authorId], references: [id])
  titleRo     String
  titleRu     String
  summaryRo   String    @db.Text
  summaryRu   String    @db.Text
  contentRo   String    @db.Text     // HTML
  contentRu   String    @db.Text
  tagsRo      String[]
  tagsRu      String[]
  sources     Json                    // [{label, url}]
  coverSeed   Int
  featured    Boolean   @default(false)
  breaking    Boolean   @default(false)
  premium     Boolean   @default(false)
  published   Boolean   @default(true)
  views       Int       @default(0)
  readMin     Int       @default(5)
  publishedAt DateTime
  updatedAt   DateTime? 
  createdAt   DateTime  @default(now())
  @@index([categoryId, publishedAt])
  @@index([publishedAt])
}

model AdminUser {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String                  // bcrypt
  name      String
  createdAt DateTime @default(now())
}

model Subscriber {                  // abonați Premium (Stripe)
  id                   Int       @id @default(autoincrement())
  email                String    @unique
  stripeCustomerId     String?
  stripeSubscriptionId String?
  plan                 String?    // 'monthly' | 'annual'
  status               String     @default("pending") // pending|active|canceled|past_due
  currentPeriodEnd     DateTime?
  accessToken          String    @unique  // token opac pt. cititor (cookie)
  createdAt            DateTime  @default(now())
}

model Partner {                     // pachete de sponsorizare B2B
  id                Int      @id @default(autoincrement())
  company           String
  email             String
  contactName       String
  tier              String          // 'bronze' | 'silver' | 'gold'
  months            Int      @default(1)
  amountMdl         Int
  status            String   @default("pending") // pending|paid|active|expired
  stripeSessionId   String?
  startsAt          DateTime?
  endsAt            DateTime?
  websiteUrl        String?
  createdAt         DateTime @default(now())
}

model NewsletterSignup {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  locale    String   @default("ro")
  createdAt DateTime @default(now())
}

model Message {                     // contact + ponturi (tips)
  id        Int      @id @default(autoincrement())
  kind      String            // 'contact' | 'tip'
  name      String?
  email     String?
  subject   String?
  body      String   @db.Text
  handled   Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Setting {
  key   String @id
  value Json
}
```

**Setting-uri seed-uite** (cheie → valoare):
`tagline` → `{ro, ru}` · `ticker` → `{ro: string[], ru: string[]}` · `pricing` → `{premiumMonthly: 149, premiumAnnual: 1490, currency:'MDL', tiers:{bronze:9900, silver:19900, gold:39900}}` · `contact` → `{email, phone, address_ro, address_ru}`.

**Seed (`prisma/seed.ts`)**: citește `../../../.content/seed-content.json`, creează cele 11 categorii (descrieri RO/RU de 1 frază scrise de A0), cei 6 autori, cele 24 articole (mapare: `title_ro`→`titleRo`, `date`→`publishedAt`, `author` slug → `authorId`, `category` slug → `categoryId`). Marchează `premium: true` pe articolele din `investigatii` și `analize` care au `featured` fals (≈6 articole) — restul rămân libere. Creează `AdminUser` `admin@corbul.md` / parolă `corbul2026` (bcrypt). Idempotent (`upsert`).

---

## 4. Contract API — NestJS (`http://localhost:4100`, prefix global `/api`)

Portul API = **4100**, web = **3100** (ca să nu intre în conflict cu GLOBAL_NEWS pe 4000/3000).
`main.ts`: `setGlobalPrefix('api')`, CORS pentru `WEB_URL`, `ValidationPipe({whitelist:true, transform:true})`, raw body doar pe `/api/payments/webhook`.

### Public (A1)
- `GET /api/health` → `{ok, name:'corbul-api', articles:number}`
- `GET /api/articles?locale=ro&category=&page=1&perPage=12&featured=&breaking=` → `{items: ArticleListDto[], total, page, perPage, pages}`
- `GET /api/articles/:slug?locale=ro` → `ArticleFullDto` (404 dacă lipsește)
- `POST /api/articles/:slug/view` → `{views}`
- `GET /api/articles/:slug/related?locale=ro&limit=3` → `ArticleListDto[]`
- `GET /api/articles/most-read?locale=ro&limit=6` → `ArticleListDto[]`
- `GET /api/categories?locale=ro` → `CategoryDto[]` (cu `count`)
- `GET /api/categories/:slug?locale=ro` → `CategoryDto`
- `GET /api/authors?locale=ro` → `AuthorDto[]` (cu `articleCount`)
- `GET /api/authors/:slug?locale=ro` → `AuthorDto & {articles: ArticleListDto[]}`
- `GET /api/search?q=&locale=ro&page=1` → `{items, total, q}` (caută în title/summary/content ambele limbi, `mode:'insensitive'`)

**DTO-uri de răspuns** (numele câmpurilor sunt contract pentru web):
```ts
ArticleListDto = { id, slug, title, summary, categorySlug, categoryName, categoryHue,
                   author:{slug,name,initials}, publishedAt, readMin, views,
                   coverSeed, featured, breaking, premium, tags: string[] }
ArticleFullDto = ArticleListDto & { content: string, contentIsTruncated: boolean,
                   sources:[{label,url}], updatedAt, author: AuthorDto }
CategoryDto    = { slug, name, description, hue, order, count }
AuthorDto      = { slug, name, initials, role, bio, email, articleCount? }
```
Localizarea se face **în service** (alege `titleRo`/`titleRu` după `locale`), web-ul primește câmpuri deja localizate.

**Paywall (A1):** dacă `article.premium` și cererea nu are cookie/`X-Reader-Token` valid de abonat activ → `content` = doar primele 2 paragrafe `<p>` din HTML + `contentIsTruncated: true`. Verificarea token-ului: `Subscriber.accessToken` cu `status='active'`. Altfel conținut integral, `contentIsTruncated:false`.

### Auth + Admin (A2)
- `POST /api/auth/login` `{email,password}` → `{token, user:{email,name}}` (JWT, `JWT_SECRET`, 7 zile)
- `GET /api/auth/me` (Bearer) → `{email,name}`
- Guard `JwtAuthGuard` pe tot ce e `/api/admin/*`.
- `GET /api/admin/stats` → `{articles, published, premium, views, subscribers:{active,total}, partners:{active,pending}, messages:{unread}, byCategory:[{slug,name,count}], recent: ArticleListDto[8], latestSubscribers, revenueMdl}`
- `GET /api/admin/articles?q=&category=&page=` → listă completă **neLocalizată** (`titleRo,titleRu,…` brute) pentru editor
- `POST /api/admin/articles` · `PUT /api/admin/articles/:id` · `DELETE /api/admin/articles/:id`
- `PATCH /api/admin/articles/:id/flags` `{featured?,breaking?,premium?,published?}`
- `GET/POST/PUT/DELETE /api/admin/authors` (CRUD complet)
- `GET /api/admin/messages` · `PATCH /api/admin/messages/:id` `{handled}` · `DELETE`
- `GET /api/admin/subscribers` · `GET /api/admin/partners` · `PATCH /api/admin/partners/:id` `{status}`
- `GET /api/settings` (public) · `PUT /api/admin/settings` `{key, value}`

### Widgets, plăți, inbox (A3)
- `GET /api/widgets` — cache în memorie **15 min**, formă exactă:
```ts
{ weather: { tempC:number, code:number, windKmh:number, humidity:number,
             days:[{date:string, code:number, min:number, max:number}] },   // 4 zile, days[0]=azi
  rates: [{ code:'EUR', nameRo, nameRu, rate:number, prev:number }, …],      // EUR,USD,RON,RUB,UAH,GBP — MDL per 1 unitate
  fetchedAt: string, stale: boolean }
```
  Surse: **BNM** `https://www.bnm.md/ro/official_exchange_rates?get_xml=1&date=DD.MM.YYYY` (XML parsat cu regex pe `<Valute>`: `CharCode`, `Nominal`, `Value`; `prev` = al doilea fetch pe o dată cu 3 zile în urmă) și **Open-Meteo** `https://api.open-meteo.com/v1/forecast?latitude=47.0105&longitude=28.8638&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FChisinau&forecast_days=4`. Timeout 5s (AbortController). La eroare → `FALLBACK` (EUR 19.42/19.38, USD 16.61/16.55, RON 3.90/3.89, RUB 0.205/0.207, UAH 0.401/0.399, GBP 22.41/22.30; vreme 21°C, code 2) + `stale:true`. **Nu aruncă niciodată.**
- `POST /api/payments/premium/checkout` `{email, plan:'monthly'|'annual', locale}` → `{url}` (Stripe Checkout Session, mode `subscription`, `price_data` construit din setarea `pricing`, currency `mdl`, `success_url = WEB_URL/{locale}/abonament/succes?session_id={CHECKOUT_SESSION_ID}`, `cancel_url = …/abonament`)
- `POST /api/payments/partner/checkout` `{company, contactName, email, tier, months, websiteUrl?, locale}` → `{url}` (mode `payment`, creează `Partner` status `pending`)
- `POST /api/payments/webhook` — raw body, `stripe.webhooks.constructEvent` cu `STRIPE_WEBHOOK_SECRET`; `checkout.session.completed` → activează `Subscriber` (generează `accessToken` hex 32) sau `Partner` (status `paid`+`active`, `startsAt/endsAt`); `customer.subscription.updated|deleted` → sincronizează `status`/`currentPeriodEnd`.
- `GET /api/payments/session/:id` → `{status, email, accessToken?}` — pagina de succes preia token-ul și îl pune în cookie.
- `POST /api/subscribers/verify` `{token}` → `{active:boolean, plan, currentPeriodEnd}`
- `POST /api/newsletter` `{email, locale}` → `{ok:true}` (upsert, ignoră duplicat)
- `POST /api/messages` `{kind:'contact'|'tip', name?, email?, subject?, body}` → `{ok:true}` (rate-limit simplu în memorie: max 5/IP/oră)

**Dacă Stripe nu e configurat** (`STRIPE_SECRET_KEY` lipsă sau începe cu `sk_test_placeholder`): endpoint-urile de checkout întorc `{url: null, demo:true, message}` iar web-ul afișează un mesaj elegant „mod demonstrativ" în loc să crape. Webhook-ul răspunde 200 și loghează. **Site-ul trebuie să funcționeze impecabil fără chei Stripe reale.**

---

## 5. Design system (proprietar: A4 — `globals.css` + `src/components/ui/*`)

### Paletă — tokens `@theme` Tailwind v4 în `globals.css`
```
--color-obsidian: #0b0d12   fundal pagină
--color-coal:     #12151d   suprafețe/carduri
--color-coal-2:   #191d28   suprafețe ridicate / hover
--color-line:     #262c3a   borduri fine
--color-line-2:   #333a4c   borduri accentuate
--color-ivory:    #f3f0e7   text principal
--color-fog:      #9aa2b5   text secundar
--color-mist:     #6b7288   meta / terțiar
--color-gold:     #d4af37   accent de brand
--color-gold-2:   #b28e2b   accent hover
--color-ember:    #e0564e   breaking / distructiv
--color-sage:     #5fae7f   succes / creștere
```
Dark permanent — **nu există temă luminoasă**. `--radius: 4px` (colțuri aproape drepte: eleganță tipografică, nu rotunjimi de aplicație).

### Tipografie (`next/font/google` în root layout, expuse ca variabile CSS)
- **Playfair Display** (600/700/800 + italic) → `--font-display` — titluri, masthead
- **Source Serif 4** (400/600 + italic) → `--font-serif` — corpul articolelor
- **Archivo** (400/500/600/700) → `--font-sans` — UI, navigație, cifre, etichete
Kickere/etichete: Archivo uppercase, `tracking-[0.18em]`, auriu, mic. Titluri: Playfair, `tracking-tight`, mari și îndrăznețe.

### Reguli vizuale
Linii fine aurii ca element de brand. Numerotare **romană** la capetele de secțiune (CSS counters). Chenar dublu auriu pe secțiunea de investigații. Hover pe card: fundal `--coal-2` + linie aurie sus, tranziție 200ms. Animații discrete (fade/rise 200–300ms), respectă `prefers-reduced-motion`. Scrollbar webkit stilizat. `::selection` auriu. Focus vizibil accesibil. Stiluri `@media print` pentru articole (fundal alb, text negru) — detaliu de prestigiu.

### Componente UI (A4) — `src/components/ui/`
Toate **server components** dacă nu au nevoie de state; cele interactive au `'use client'`.
`Container.tsx`, `SectionHead.tsx` (`{title, kicker?, href?, roman?}`), `Card.tsx` (variante `lead|standard|row|minimal|quote` prin prop `variant`), `Badge.tsx` (`{tone:'cat'|'breaking'|'premium'|'ok'|'warn', hue?}`), `Avatar.tsx` (`{initials, size}`), `Button.tsx` (`{variant:'gold'|'ghost'|'danger', size, as}`), `Cover.tsx` (randează SVG-ul din `lib/cover.ts`), `Field.tsx` (input/select/textarea stilizate, cu label și eroare), `Modal.tsx` (client), `Toast.tsx` + `ToastProvider` (client, context `useToast()`), `Skeleton.tsx`, `Divider.tsx`, `Prose.tsx` (wrapper pentru HTML-ul articolului), `EmptyState.tsx`, `Pagination.tsx`, `ShareRow.tsx` (client), `RavenMark.tsx` (silueta SVG de corb, prop `size` — element de brand, folosit în masthead, footer, favicon, loading).

### `lib/cover.ts` (A0 scrie contractul, A4 rafinează vizualul)
```ts
export function coverSvg(seed: number, hue: number, opts?: {w?:number; h?:number; title?:string}): string
```
SVG determinist, editorial abstract: fundal gradient obsidian, pattern geometric derivat din `seed % 6` (diagonale / cercuri concentrice / bare verticale / valuri / grilă / raze), accente în `hue` + auriu, siluetă discretă de corb la opacitate ~0.12. Fără text. Folosit ca `dangerouslySetInnerHTML` în `Cover.tsx` și ca imagine OG.

---

## 6. Shell + widgeturi (A5) — `src/components/shell/*`, `src/components/widgets/*`, `messages/*.json`

### Structura shell-ului (în `[locale]/layout.tsx`, montat de A6, componentele scrise de A5)
1. **`TopBar`** (client) — stânga: data completă localizată + ceas live `HH:MM:SS` (interval 1s); centru: vremea compactă (iconiță + °C) și EUR/USD compact; dreapta: link Instrumente, Contact, `LanguageSwitcher` (RO|RU), link discret Admin.
2. **`Masthead`** — `RavenMark` + logotip „CORBUL" cu „.md" auriu, tagline din setări, buton „Abonează-te" auriu (spre `/abonament`), lupă de căutare.
3. **`MainNav`** (client pentru starea activă + meniu mobil) — Acasă + cele 11 categorii; burger sub 1024px cu panou lateral.
4. **`Ticker`** — etichetă „ULTIMA ORĂ"/«СРОЧНО» + bandă rulantă infinită (conținut dublat, CSS `translateX(-50%)`, pauză la hover) din setarea `ticker` + titlurile `breaking`.
5. **`SiteFooter`** — 4 coloane (despre + RavenMark, categorii, pagini, contact + newsletter), disclaimer editorial, `© 2026 Corbul.md`.

### Widgeturi — `src/components/widgets/`
`Sidebar.tsx` compune: `WeatherWidget` (Chișinău: acum + 4 zile, iconițe SVG proprii pe coduri WMO), `RatesWidget` (tabel BNM cu săgeți ↑↓ colorate față de `prev`, data cursului, + `MiniConverter` bidirecțional live), `MostRead` (top 6, numerotat I–VI), `NewsletterBox` (POST `/api/newsletter`, toast), `SupportBox` (card auriu „Susține jurnalismul independent" → `/abonament`).
Datele vin dintr-un singur fetch server-side către `/api/widgets` (`next: {revalidate: 900}`) pasat ca props; ceasul și convertorul sunt client.

### i18n
`messages/ro.json` + `messages/ru.json` — chei ierarhice: `nav`, `common`, `home`, `article`, `category`, `search`, `about`, `team`, `contact`, `subscribe`, `tools`, `widgets`, `footer`, `errors`. **Ambele fișiere trebuie să aibă exact aceleași chei.** Locale implicit `ro`, prefix `always` (`/ro/...`, `/ru/...`), `localePrefix: 'always'`.

---

## 7. Pagini publice (A6) — `src/app/[locale]/`

Toate sunt **server components** care fac fetch prin `lib/api.ts` (helper `apiFetch<T>(path, {revalidate})` cu `API_URL`), cu `generateMetadata` (title, description, OG, twitter, canonical + `alternates.languages` ro/ru) și JSON-LD unde e cazul.

- `page.tsx` **acasă**: hero (breaking/featured principal, copertă mare, kicker, titlu Playfair uriaș, lede, autor+dată) + 3 featured lateral; secțiunea **„Investigațiile Corbului"** cu chenar auriu dublu (3 carduri); benzi tematice numerotate roman: Politică · Economie+Finanțe · Energie+Infrastructură · Juridic+Corupție; bandă **Opinie & Analize** (carduri-citat pe `--coal-2` cu ghilimele mari); grid principal cu `Sidebar`. JSON-LD `WebSite` + `Organization`. Fără să repete același articol în hero și în prima secțiune.
- `[category]/page.tsx` — dinamic pe slug (validare contra listei; `notFound()` altfel): titlu + descriere, primul articol ca lead mare, restul grid, paginare, sidebar.
- `articol/[slug]/page.tsx` — breadcrumb, kicker categorie, titlu, lede, meta (avatar autor, dată+oră `<time dateTime>`, timp de citire, vizualizări, „Actualizat"), copertă mare, `Prose` cu conținutul, **paywall** dacă `contentIsTruncated` (gradient de estompare + card auriu „Continuă cu Corbul Premium" cu prețuri și buton), `TrustBox` (✓ Verificat editorial + lista de surse — EEAT), etichete, `ShareRow` (Facebook/X/Telegram/copiază link), caseta autorului, 3 articole conexe, sidebar. Înregistrează vizualizarea (client, o dată). JSON-LD `NewsArticle` complet (+ `isAccessibleForFree`, `hasPart` pentru paywall). `generateStaticParams` nu e obligatoriu; `revalidate: 300`.
- `cautare/page.tsx` — câmp mare, rezultate `Card variant="row"` cu termenul evidențiat `<mark>` auriu, contor, stare goală elegantă.
- `despre/page.tsx` — misiune, **principii editoriale numerotate** (independență, verificare din două surse, corecții publice, separarea faptelor de opinii, transparența finanțării), politica de corecții, finanțare, echipa pe scurt. Pagina-cheie pentru EEAT.
- `echipa/page.tsx` — carduri autori (avatar mare, nume, rol, bio, email, nr. articole, link spre articolele lor).
- `autor/[slug]/page.tsx` — profil + articolele autorului.
- `contact/page.tsx` — date de contact, formular (validare client + POST `/api/messages`), casetă distinctă **„Trimite un pont securizat"** cu accent auriu (`kind:'tip'`, fără câmpuri obligatorii de identitate, notă despre confidențialitate).
- `abonament/page.tsx` — pagina Premium: două planuri (lunar/anual, economie evidențiată la anual), ce include, FAQ, formular email → POST `/api/payments/premium/checkout` → redirect Stripe (sau mesaj demo); secțiune separată **„Parteneriate"** cu cele 3 pachete B2B (bronze/silver/gold) și formular → `/api/payments/partner/checkout`. Argumentație orientată spre clienții ideali: juridic, finanțe, industrie, consultanță.
- `abonament/succes/page.tsx` — confirmă sesiunea (`/api/payments/session/:id`), setează cookie-ul de cititor (`corbul_reader`, 180 zile) și confirmă elegant.
- `not-found.tsx` + `error.tsx` — pagini de eroare pe identitatea vizuală (corb + auriu).
- `sitemap.ts` (toate paginile × ro/ru + articole + categorii), `robots.ts`, `opengraph-image.tsx` (folosește `coverSvg`).

---

## 8. Instrumente fiscale (A7) — `src/app/[locale]/instrumente/`

Pagină cu navigație verticală (tab-uri) + panou activ; deep-link `?tool=`. Toate textele prin next-intl (cheile `tools.*`, adăugate de A7 în AMBELE fișiere de mesaje — singura excepție de la proprietatea A5 asupra `messages/`, sub cheia `tools`). Calculatoarele sunt **client components** care recalculează live; parametrii fiscali sunt **editabili** într-o secțiune „Avansat" pliabilă; fiecare are disclaimer vizibil („estimativ; verificați legislația în vigoare").

1. **Salariu net ⇄ brut** — impozit pe venit 12%, asigurare medicală angajat 9%, scutire personală **2 475 MDL/lună** (= 29 700 lei/an, art. 33 Cod fiscal, confirmat pentru 2026; implicite editabile); ambele direcții (net→brut prin căutare binară); detaliere completă + cost total angajator (CAS 24%).
2. **Devamare auto** — tip motor (benzină/diesel/hibrid/electric), cm³, an fabricație, valoare vamală EUR → accize pe trepte de capacitate × coeficient de vechime (tabel editabil), electric scutit, TVA 20%, taxă proceduri vamale 0,4% **plafonată la 1 800 EUR** (Legea 212/2023); acciza pe matricea reală **MDL/cm³ × vechime** (Anexa 2, Titlul IV Cod fiscal), nu EUR/cm³; conversie EUR→MDL din `/api/widgets`; detaliere pe linii; marcat clar ESTIMATIV.
3. **TVA** — adaugă/extrage, cote **20/12/8** (art. 96 Cod fiscal; cota de 6 % nu există) + personalizată.
4. **Convertor valutar BNM** — orice→orice prin MDL, cu data cursului.
5. **Credit (anuitate)** — rată lunară, total plătit, total dobândă + grafic de amortizare din bare CSS pe ani.
6. **Impozit pe bunuri imobiliare** — valoare × cotă (implicit 0,1%), anual + trimestrial.

Numere formatate cu `Intl.NumberFormat` (`ro-RO` / `ru-RU` după locale).

---

## 9. Panou de administrare (A8) — `src/app/admin/`

**În afara `[locale]`** (interfață doar în română), shell propriu (fără header/footer public). Client components + fetch direct la API cu `Authorization: Bearer`.
- `/admin` — **login** (card centrat, RavenMark, email+parolă, implicit `admin@corbul.md` / `corbul2026`); token în `localStorage['corbul_admin_token']`; redirect spre panou.
- `/admin/panou` — statistici (carduri: articole, vizualizări, abonați activi, venit estimat MDL, mesaje necitite), grafic cu bare CSS pe categorii, ultimele 8 articole, ultimii abonați, badge stare API.
- `/admin/articole` — tabel (titlu, categorie, autor, dată, vizualizări, comutatoare inline ★ featured / ⚡ breaking / ◆ premium / publicat), căutare + filtru; editor în modal cu **tab-uri RO/RU** (titlu, sumar, conținut HTML în textarea monospațiat), categorie, autor, dată, slug autogenerat (cu transliterarea diacriticelor) editabil, `coverSeed` cu buton 🎲 și **previzualizare live** a copertei, comutatoare, etichete, surse dinamice (label+url), validare; ștergere cu modal propriu de confirmare.
- `/admin/autori` — CRUD complet.
- `/admin/abonati` — abonați Premium (email, plan, status, perioadă) + parteneri B2B (companie, pachet, sumă, status, acțiuni de activare/expirare).
- `/admin/mesaje` — contact și ponturi, marcare ca tratat, ștergere.
- `/admin/setari` — tagline RO/RU, elemente ticker RO/RU (unul pe linie), prețuri (premium + pachete), date de contact.

**Fără `alert()`, `confirm()`, `prompt()` nicăieri** — doar `Toast` și `Modal`. Design la fel de premium ca partea publică (obsidian + auriu), nu „panou de admin generic".

---

## 10. SEO / EEAT (transversal)
Title unic + meta description pe fiecare pagină; OG + Twitter card; canonical + `hreflang` ro/ru pe toate; un singur `<h1>`; ierarhie semantică `h2/h3`; `<article>`, `<time dateTime>`, `<nav aria-label>`; JSON-LD `NewsArticle` (articol), `WebSite`+`SearchAction`+`Organization` (acasă), `BreadcrumbList`, `Person` (autor), `FAQPage` (abonament). Semnale de încredere: caseta de surse, pagina de principii editoriale, autori cu biografii și date de contact, politica de corecții, data actualizării.

---

## 10bis. Note de stack — confirmate din proiectul de referință al clientului

Pattern-uri validate în `/Users/bobernagadamian/GLOBAL_NEWS` (aceleași versiuni). Respectă-le, evită capcanele:

**NestJS**
- `NestFactory.create(AppModule, { rawBody: true })` este TOT ce trebuie pentru semnătura webhook-ului Stripe — fără middleware custom. În controller: `@Req() req: RawBodyRequest<Request>` + `@Headers('stripe-signature')`.
- `PrismaModule` marcat `@Global()`, provides + exports `PrismaService` → serviciile îl injectează fără import explicit.
- `PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy`.
- Stripe opțional la runtime: în constructor `const key = config.get('STRIPE_SECRET_KEY'); this.stripe = key ? new Stripe(key) : null`.
- `@nestjs/config` este `^4.0.2` (nu ^11). `JwtModule.registerAsync` cu `ConfigService`, `expiresIn: '7d'`.
- **Ordinea rutelor contează**: declară `@Get('most-read')`, `@Get('admin/all')` etc. ÎNAINTE de `@Get(':slug')`, altfel sunt înghițite.
- tsconfig api: `module: commonjs`, `target: ES2022`, `experimentalDecorators`, `emitDecoratorMetadata`, `strictNullChecks`, include `src` + `prisma`.

**Next.js 15 / React 19**
- `params` și `searchParams` sunt **Promise** — obligatoriu `const { locale } = await params`.
- `setRequestLocale(locale)` în fiecare layout și pagină (necesar pentru randare statică).
- `NextIntlClientProvider` **fără** prop `messages` (v4 le ia din context).
- `next.config.ts` într-un monorepo are nevoie de `turbopack: { root: path.join(process.cwd(), '../..') }`, altfel Turbopack alege greșit rădăcina.
- `postcss.config.mjs` = `{ plugins: ['@tailwindcss/postcss'] }`. **Nu există `tailwind.config.js`** în Tailwind v4 — tot design system-ul stă în `@theme` din `globals.css`.
- Fonturile: `next/font/google` cu `display:'swap'`, `subsets: ['latin','latin-ext','cyrillic']` (chirilica e obligatorie pentru RU), expuse ca variabile CSS pe `<html className>`.
- `src/i18n/navigation.ts` cu `createNavigation(routing)` — paginile publice folosesc **acest** `Link`, nu `next/link`. Adminul folosește `next/link` normal.
- Middleware-ul i18n exclude explicit adminul: matcher `"/((?!api|admin|_next|_vercel|.*\\..*).*)"`.
- Adminul e un **root layout paralel** cu propriul `<html lang="ro">` și `<body>` + `robots: {index:false}`.
- Helperele de fetch server-side **înghit erorile și întorc `null`** — build-ul nu trebuie să depindă de disponibilitatea API-ului. Toate call-site-urile folosesc `?? []` sau `if (!x) notFound()`.
- Două căi de fetch separate: server components → `API_URL`; client/admin → `NEXT_PUBLIC_API_URL`.
- La `useParams` în admin: `useParams<{id: string}>()` (client), nu `params` promise.
- ICU plural în română are categoria `few`: `"{count, plural, one {# articol} few {# articole} other {# de articole}}"`.

## 10ter. Devieri „as-built" acceptate (NU sunt defecte)

Implementarea reală diferă de textul de mai sus în câteva locuri; acestea sunt intenționate și verificate:
- Identificatorii interni ai instrumentelor sunt englezești (`salary, customs, vat, converter, credit, property`); `?tool=` acceptă și aliasurile din SPEC (`salariu, devamare, tva, valutar, credit, imobil`) plus echivalentele ruse, prin `resolveToolId`.
- `POST/PUT /api/admin/articles` primesc `categoryId` și `authorId` numerice (nu slug-uri); rutele de listare admin (`messages`, `subscribers`, `partners`) întorc array-uri simple, nepaginate; există în plus `GET /api/admin/settings`, `GET /api/admin/articles/:id`, `GET /api/admin/authors/:id`.
- `GET /api/health` trăiește în `articles/health.controller.ts`, nu într-un modul separat.
- `GET /api/search` întoarce `{items, total, q}`; web-ul calculează paginile din `total`.
- `PUT /api/admin/settings` întoarce `{key, value}`.
- Newsletter-ul din subsol folosește textele `footer.newsletter.*`, cele din sidebar `widgets.newsletter.*`.

## 11. Definiția lui „gata"
`npm install` din rădăcină trece · `npm run db:migrate` + `npm run db:seed` populează baza · `npm run build` trece pe ambele apps fără erori TS · `npm run dev` pornește API 4100 + web 3100 · toate paginile se randează în RO și RU fără erori în consolă · adminul face CRUD real în DB · calculatoarele calculează corect · widgeturile afișează date live (sau fallback marcat) · fluxurile Stripe funcționează în mod demo fără chei · zero `any` nemotivat · design coerent premium dark pe absolut toate paginile, responsive.
