# CORBUL.MD — Publicitate (bannere) + subsol extins

Contract obligatoriu. Se citește ÎMPREUNĂ cu `SPEC.md` (design system §5, stack §10bis, devieri acceptate §10ter).
Arhitectura o replică pe cea din proiectul clientului `/Users/bobernagadamian/GLOBAL_NEWS` (apps/api/src/ads, apps/web/src/components/AdSlot.tsx), adaptată la Corbul: **obsidian + auriu, fără culorile sau componentele de acolo**.

Porturi: API `4100`, web `3100`. Serverele rulează în `npm run dev` — **nu le reporni**.

---

## 1. Prisma — modele noi (proprietar: AGENT-ADS-API)

Se adaugă în `apps/api/prisma/schema.prisma`, fără a atinge modelele existente:

```prisma
model Advertiser {
  id          Int          @id @default(autoincrement())
  companyName String
  contactName String
  email       String       @unique
  phone       String?
  website     String?
  campaigns   AdCampaign[]
  createdAt   DateTime     @default(now())
}

model AdZone {
  id            Int        @id @default(autoincrement())
  key           String     @unique   // header_leaderboard, sidebar_top, sidebar_bottom, article_inline, home_infeed
  name          String
  width         Int
  height        Int
  adsenseSlotId String?
  priceMonthly  Int?                  // în bani (MDL × 100)
  active        Boolean    @default(true)
  order         Int        @default(0)
  banners       AdBanner[]
}

model AdCampaign {
  id           Int        @id @default(autoincrement())
  name         String
  status       String     @default("DRAFT") // DRAFT|PENDING_PAYMENT|ACTIVE|PAUSED|COMPLETED|CANCELLED
  startsAt     DateTime
  endsAt       DateTime
  advertiser   Advertiser @relation(fields: [advertiserId], references: [id], onDelete: Cascade)
  advertiserId Int
  stripeSessionId String?  @unique
  banners      AdBanner[]
  createdAt    DateTime   @default(now())
  @@index([status, startsAt, endsAt])
}

model AdBanner {
  id         Int           @id @default(autoincrement())
  name       String
  campaign   AdCampaign    @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  campaignId Int
  zone       AdZone        @relation(fields: [zoneId], references: [id])
  zoneId     Int
  imageUrl   String?
  html       String?       @db.Text
  targetUrl  String
  alt        String?
  weight     Int           @default(1)
  active     Boolean       @default(true)
  stats      AdStatDaily[]
  createdAt  DateTime      @default(now())
  @@index([zoneId, active])
}

model AdStatDaily {
  id          Int      @id @default(autoincrement())
  banner      AdBanner @relation(fields: [bannerId], references: [id], onDelete: Cascade)
  bannerId    Int
  date        DateTime @db.Date
  impressions Int      @default(0)
  clicks      Int      @default(0)
  @@unique([bannerId, date])
}
```

Migrare: `npx prisma migrate dev --name ads` (non-interactiv) + `npx prisma generate`, din `apps/api`.

**Seed** (`prisma/seed.ts`, idempotent, upsert pe `key`): cele 5 zone, în această ordine și cu aceste valori:

| key | name | w×h | priceMonthly (bani) | order |
|---|---|---|---|---|
| header_leaderboard | Bandă sub antet | 970×90 | 5000000 | 1 |
| home_infeed | În flux, prima pagină | 970×250 | 4500000 | 2 |
| article_inline | În corpul articolului | 728×90 | 3500000 | 3 |
| sidebar_top | Coloană laterală, sus | 300×250 | 3000000 | 4 |
| sidebar_bottom | Coloană laterală, jos | 300×600 | 4000000 | 5 |

Plus un advertiser demo („Casa de avocatură Lupu & Asociații", contact@lupu-asociatii.md), o campanie ACTIVE (start −7 zile, end +60 zile) și 2 bannere demo (`sidebar_top` și `header_leaderboard`). Bannerele demo **nu folosesc imagini externe**: câmpul `html` conține un mic marcaj propriu (fundal `--color-coal-2`, chenar auriu, text „Spațiu publicitar" + numele clientului), ca site-ul să arate complet fără rețea. `imageUrl` rămâne null.

Setare nouă (tabela `Setting`): cheia `ads` → `{ adsenseClientId: string | null }`.

---

## 2. API — rute (proprietar: AGENT-ADS-API)

Modul `apps/api/src/ads/` (module, controller public, controller admin, service, DTO-uri). Se înregistrează în `app.module.ts`.

### Public
- `GET /api/ads/zones` → `AdZoneDto[]` = `{key, name, width, height, priceMonthly, order}` (doar `active: true`, ordonate după `order`).
- `GET /api/ads/serve/:zoneKey` → `ServedAdDto`, uniune discriminată:
  ```ts
  { provider: "DIRECT"; bannerId: number; zone: {key,width,height};
    imageUrl: string | null; html: string | null; alt: string | null; clickUrl: string }
  | { provider: "ADSENSE"; zone: {key,width,height}; client: string; slot: string }
  | { provider: "NONE"; zone: {key,width,height} | null }
  ```
  Logica, în ordine: zona activă → bannerele active ale campaniilor cu `status: "ACTIVE"` și `startsAt <= acum <= endsAt` → alegere ponderată după `weight` → înregistrează o afișare (`AdStatDaily`, upsert pe `bannerId_date`, data normalizată la miezul nopții UTC, fire-and-forget) → `DIRECT`. Altfel, dacă setarea `ads.adsenseClientId` există ȘI zona are `adsenseSlotId` → `ADSENSE`. Altfel `NONE`. Zonă inexistentă → `{provider:"NONE", zone:null}` cu **200**, nu 404 (o zonă lipsă nu trebuie să spargă pagina).
  `clickUrl` = `"/api/ads/click/" + bannerId` (cale relativă la API).
- `GET /api/ads/click/:bannerId` → **302** către `targetUrl`, după ce incrementează `clicks`. Banner inexistent/inactiv → 302 către `WEB_URL`.

### Admin (toate sub `JwtAuthGuard`, prefix `/api/admin/ads`)
- `GET|POST /zones`, `PUT|DELETE /zones/:id`
- `GET|POST /advertisers`, `PUT|DELETE /advertisers/:id`
- `GET|POST /campaigns`, `PUT|DELETE /campaigns/:id` (DELETE refuzat cu 409 dacă are bannere cu statistici)
- `GET|POST /banners`, `PUT|DELETE /banners/:id`
- `GET /stats?campaignId=&days=30` → `[{date, bannerId, bannerName, impressions, clicks}]`
- `GET /overview` → `{zones, advertisers, campaigns: {active, total}, banners: {active, total}, impressions30d, clicks30d, ctr}`

Validare `class-validator` pe toate DTO-urile; `targetUrl` trebuie să fie `http(s)://`; un banner are **fie** `imageUrl`, **fie** `html` (nu ambele goale); `weight` 1–100; datele campaniei: `endsAt > startsAt`.

---

## 3. Web — afișare (proprietar: AGENT-ADS-WEB)

`apps/web/src/components/ads/AdSlot.tsx` — **client component**:
- props: `{ zoneKey: string; className?: string; label?: boolean }`
- la montare cere `GET {NEXT_PUBLIC_API_URL}/ads/serve/{zoneKey}`; nu aruncă niciodată (eroare → nu randează nimic).
- **rezervă spațiul din prima**: containerul primește `aspect-ratio` sau înălțime minimă din dimensiunile zonei (valori implicite locale pentru cele 5 zone, ca să nu existe salt de layout — CLS — înainte de răspuns).
- `DIRECT`: dacă `imageUrl` → `<img>` (cu `alt`, `loading="lazy"`, `decoding="async"`); dacă `html` → `dangerouslySetInnerHTML`. Totul învelit într-un `<a href={API_URL + clickUrl}` `target="_blank"` `rel="sponsored noopener noreferrer">`.
- `ADSENSE`: inserează `<ins class="adsbygoogle">` + scriptul Google o singură dată pe pagină (`next/script`, `strategy="afterInteractive"`, `data-ad-client`). Dacă scriptul e blocat, spațiul rămâne gol, fără eroare.
- `NONE`: nu randează nimic (fără chenar gol).
- deasupra reclamei, o etichetă discretă „PUBLICITATE" / «РЕКЛАМА» (Archivo, 10px, `text-mist`, `tracking-[0.2em]`), afișată doar când există reclamă. Cheie i18n `ads.label`.
- respectă tema: chenarul și fundalul de rezervă folosesc `border-line` / `bg-coal`.

**Amplasare pe pagini** (AGENT-ADS-WEB modifică doar aceste fișiere):
- `app/[locale]/layout.tsx` — NU se atinge.
- `app/[locale]/page.tsx` (acasă): `header_leaderboard` imediat sub `Ticker` (adică primul element din pagină), `home_infeed` între banda „Economie și Finanțe" și următoarea.
- `app/[locale]/articol/[slug]/page.tsx`: `article_inline` după al treilea paragraf al conținutului (dacă articolul e trunchiat de paywall, se pune înainte de caseta de paywall).
- `components/widgets/Sidebar.tsx`: `sidebar_top` înaintea widgetului de vreme, `sidebar_bottom` după „Cele mai citite".
- `app/[locale]/[category]/page.tsx`: `header_leaderboard` sub titlul rubricii.

Tipurile `AdZoneDto` / `ServedAdDto` se adaugă **aditiv** în `apps/web/src/lib/types.ts`.
Cheile i18n noi (`ads.*`) se cer în raport, nu se scriu direct în `messages/*.json`.

---

## 4. Admin — gestiune (proprietar: AGENT-ADS-ADMIN)

`apps/web/src/app/admin/publicitate/` — o pagină cu file interne (fără rute noi): **Zone · Clienți · Campanii · Bannere · Statistici · AdSense**.
- Tabele în stilul existent din admin (`_components/ui.tsx`), formulare în `Modal`, confirmări cu `ConfirmModal`, feedback prin `useToast`. Fără `alert/confirm/prompt`.
- Campanii: selectare client, perioadă, status (select), listă de bannere ale campaniei cu adăugare/editare/ștergere în loc.
- Bannere: zonă, nume, `targetUrl`, `alt`, greutate, activ, și fie URL de imagine, fie marcaj HTML (textarea monospațiat) — cu **previzualizare live** la dimensiunea reală a zonei.
- Statistici: tabel pe zile + totaluri (afișări, clicuri, CTR) și bare CSS.
- AdSense: un câmp pentru `adsenseClientId` (salvat prin `PUT /api/admin/settings` cu cheia `ads`) și, pe fiecare zonă, `adsenseSlotId`.
- Se adaugă „Publicitate" în navigația din `_components/AdminShell.tsx` (singura modificare permisă acolo), cu o iconiță SVG proprie.

---

## 5. Subsol extins (proprietar: eu, agenții NU ating `SiteFooter.tsx` și `messages/*.json`)

Coloane noi: **Publicitate** (Advertoriale, Partener în director, Backlinkuri, Guest post, Promovare eveniment, Vizibilitate media, Toate serviciile, Media kit), **Contact** (Scrie redacției, Newsletter, redactia@corbul.md, publicitate@corbul.md), **Legal** (Termeni și condiții, Confidențialitate, Cookie-uri).

---

## 6. Reguli comune
1. TypeScript strict, zero `any` nemotivat, `npx tsc --noEmit -p apps/web` / `-p apps/api` trebuie să treacă la finalul muncii tale (rulează din rădăcina proiectului).
2. Scrii DOAR fișierele zonei tale. `apps/web/src/lib/types.ts` se editează **aditiv** (citește-l imediat înainte de scriere).
3. Nu atingi `messages/ro.json` / `ru.json` — raportezi cheile necesare cu textele RO și RU.
4. Nu repornești serverele, nu rulezi `npm run build` (o fac eu la final).
5. Nu lași date de test în baza de date.
6. Design: obsidian + auriu, Playfair/Source Serif/Archivo, `--radius 4px`, componente din `components/ui`. Site-ul are **temă luminoasă și întunecată** — folosește DOAR tokeni (`bg-coal`, `text-ivory`, `border-line`, `text-gold`…), niciodată culori scrise de mână, altfel elementul va arăta greșit în tema luminoasă. Pentru text închis pe auriu plin: `bg-gold-solid text-on-gold`.

---

## 7. Pagini de serviciu (proprietar: AGENT-SERVICES)

Fiecare serviciu de publicitate are pagina lui, care îl explică. Bilingv RO/RU.

**Rute** (sub `app/[locale]/publicitate/`):
- `/publicitate` — pagina-index „Toate serviciile": intro, grila celor 6 servicii (card cu nume, o frază, preț de la), zonele de banner disponibile cu dimensiuni și preț (din `GET /api/ads/zones`), secțiune „De ce Corbul.md" (audiență: juriști, finanțe, industrie, consultanță), formular de contact comercial.
- `/publicitate/[serviciu]` — pagina fiecărui serviciu, cu `generateStaticParams` peste cele 6 slug-uri.
- `/publicitate/media-kit` — pagină separată: cifre despre audiență, profilul cititorului, formate disponibile, tarife, condiții editoriale, contact.

**Cele 6 servicii** (slug RO, folosit în ambele limbi):
`advertoriale`, `partener-in-director`, `backlinkuri`, `guest-post`, `promovare-eveniment`, `vizibilitate-media`.

**Conținutul** stă într-un modul propriu, `app/[locale]/publicitate/_data/services.ts`, NU în `messages/*.json`:
```ts
export interface AdService {
  slug: string;
  nameRo: string; nameRu: string;
  leadRo: string; leadRu: string;            // o frază, pentru card
  bodyRo: string[]; bodyRu: string[];        // 3–5 paragrafe de explicație
  includesRo: string[]; includesRu: string[];// ce include, 4–6 puncte
  forWhomRo: string; forWhomRu: string;      // cui i se potrivește
  priceFromMdl: number;                      // preț „de la", în lei
  turnaroundRo: string; turnaroundRu: string;// termen de livrare
  disclosureRo: string; disclosureRu: string;// mențiunea de transparență editorială
}
export const AD_SERVICES: AdService[] = [ ... ];
```
Textul trebuie să fie **real și profesionist**, în registrul unui portal de investigații care își păstrează independența: fiecare serviciu explică limpede că materialele comerciale sunt marcate ca atare și că redacția nu vinde acoperire editorială. Ex. la `advertoriale`: marcaj „Conținut comercial", link `rel="sponsored"`, fără promisiuni de poziționare în secțiunile editoriale.

**Fiecare pagină de serviciu conține**: kicker „Publicitate", titlu, lead, corpul explicativ, „Ce include" (listă), „Cui i se potrivește", preț de la + termen, caseta de transparență editorială (chenar auriu), buton „Cere ofertă" → `/contact?subiect=<slug>`, legături către celelalte servicii, și `AdSlot` pentru zona `article_inline` la final.

**SEO**: `generateMetadata` prin `buildMetadata` (title unic, description, canonical, hreflang ro/ru), JSON-LD `Service` cu `provider` = nodul organizației (`organizationNode` din `app/_lib/site.ts`) și `offers.price`. Paginile intră în `sitemap.ts` (proprietar: AGENT-SERVICES poate edita `app/sitemap.ts` **aditiv**).

Design: aceleași componente `components/ui`, tokeni de temă (funcționează în ambele teme), fără culori scrise de mână.
