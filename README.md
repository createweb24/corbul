# Corbul.md

Portal premium de **analiză și investigație** din Republica Moldova, bilingv **română / rusă**.

Corbul.md publică anchete documentate, analize economico-juridice și instrumente
utile cititorului (calculatoare fiscale, curs BNM, vreme). Modelul de venit este
dublu: abonamentul **Corbul Premium** (Stripe Checkout, lunar sau anual) și
**parteneriatele B2B** (pachete de sponsorizare bronze / silver / gold).

Identitate vizuală: obsidian și auriu, tipografie serif editorială, numerotare
romană la capetele de secțiune — un dosar de investigație, nu un flux de știri.

---

## Stack

| Zonă | Tehnologii |
|---|---|
| Web | Next.js 15.5.25 (App Router, Turbopack), React 19.1, TypeScript 5, Tailwind CSS v4, next-intl 4 |
| API | NestJS 11, Prisma 6, PostgreSQL, Passport JWT, Stripe 18, bcryptjs |
| Monorepo | npm workspaces (`apps/*`), `npm-run-all` |

Fără biblioteci UI externe și fără imagini binare: tot vizualul este SVG generat,
tipografie și culoare.

---

## Pornire pas cu pas

Cerințe: **Node.js ≥ 20**, **PostgreSQL ≥ 14** pornit local.

```bash
# 1. baza de date (o singură dată)
createdb corbul

# 2. dependențe (din rădăcina monorepo-ului)
npm install

# 3. variabile de mediu
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
#   dacă serverul PostgreSQL cere autentificare pe rol, completează
#   utilizatorul în DATABASE_URL: postgresql://UTILIZATOR@localhost:5432/corbul

# 4. schema + conținutul editorial
npm run db:migrate     # creează tabelele (prisma migrate dev)
npm run db:seed        # 11 categorii, 6 autori, 24 articole, setări, admin

# 5. pornire (API + web în paralel)
npm run dev
```

- Web: <http://localhost:3100> (redirecționează spre `/ro`)
- API: <http://localhost:4100/api>
- Administrare: <http://localhost:3100/admin>

Alte comenzi utile:

```bash
npm run build        # build API + web
npm run stop         # eliberează porturile 3100 și 4100
npm run typecheck    # tsc --noEmit pe ambele aplicații
npm run db:studio    # Prisma Studio
npm run db:seed      # idempotent — se poate rula oricând
```

**Porturi ocupate.** `npm run dev` pică cu `EADDRINUSE` dacă pe 3100 sau 4100
rulează deja ceva (de obicei o pornire anterioară în mod producție). Rulează
întâi `npm run stop` — oprește doar procesele care *ascultă* pe cele două
porturi, nu și conexiunile browserului.

**Build-ul are nevoie de API pornit.** Paginile publice își iau conținutul de
la `API_URL` în timpul build-ului. Dacă API-ul e oprit, build-ul trece, dar
paginile rămân cu stări goale („Echipa se completează") până la următoarea
revalidare. Ordinea corectă:

```bash
npm run db:seed
npm run start:api &     # sau: cd apps/api && node dist/main.js &
npm run build
```

---

## Variabile de mediu

**`apps/api/.env`**

| Cheie | Implicit | Rol |
|---|---|---|
| `DATABASE_URL` | `postgresql://localhost:5432/corbul?schema=public` | conexiunea PostgreSQL |
| `JWT_SECRET` | — | semnarea token-ului de administrator (7 zile). **Obligatoriu în producție**: ≥ 32 de octeți aleatori (`openssl rand -hex 32`); gol sau egal cu valoarea de rezervă din cod ⇒ API-ul refuză să pornească cu `NODE_ENV=production` |
| `WEB_URL` | `http://localhost:3100` | CORS + URL-urile de redirect Stripe |
| `PORT` | `4100` | portul API-ului |
| `TRUST_PROXY` | `loopback` | Express „trust proxy": în spatele nginx/Cloudflare pune `1` (un salt) sau adresele proxy-ului, altfel rate-limit-ul pe IP vede doar IP-ul proxy-ului |
| `STRIPE_SECRET_KEY` | `sk_test_placeholder` | lipsă/placeholder ⇒ **mod demonstrativ** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_placeholder` | verificarea semnăturii webhook-ului |

**`apps/web/.env.local`**

| Cheie | Implicit | Rol |
|---|---|---|
| `API_URL` | `http://localhost:4100/api` | fetch din componentele server |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4100/api` | fetch din browser și din panoul de administrare |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3100` | canonical, OpenGraph, sitemap |

---

## Structura proiectului

```
CORBUL/
├── .content/seed-content.json      conținutul editorial (RO+RU) consumat de seed
├── apps/api/                       NestJS 11
│   ├── prisma/schema.prisma        modelul de date
│   ├── prisma/seed.ts              seed idempotent
│   └── src/
│       ├── main.ts, app.module.ts
│       ├── prisma/                 PrismaService (modul global)
│       ├── common/slugify.ts       transliterare RO + chirilic
│       ├── articles|categories|authors|search/     conținut public
│       ├── auth|admin|settings/                    autentificare și administrare
│       └── widgets|payments|subscribers|inbox/     date live, Stripe, formulare
└── apps/web/                       Next.js 15
    ├── messages/ro.json, ru.json   textele de interfață (next-intl)
    └── src/
        ├── app/layout.tsx          root layout: fonturile și <html>/<body>
        ├── app/[locale]/           paginile publice (ro/ru)
        ├── app/admin/              panoul de administrare (doar RO)
        ├── components/ui|shell|widgets/
        ├── i18n/                   rutare bilingvă
        └── lib/                    api.ts, types.ts, format.ts, cover.ts
```

---

## API pe scurt

Prefix global `/api`, port `4100`.

**Public**

| Metodă | Rută | Rol |
|---|---|---|
| GET | `/health` | stare + numărul de articole |
| GET | `/articles` | listă paginată (`locale, category, page, perPage, featured, breaking`) |
| GET | `/articles/:slug` | articol complet (aplică paywall-ul) |
| POST | `/articles/:slug/view` | incrementează vizualizările |
| GET | `/articles/:slug/related` | articole conexe |
| GET | `/articles/most-read` | top vizualizări |
| GET | `/categories`, `/categories/:slug` | categorii, cu numărul de articole |
| GET | `/authors`, `/authors/:slug` | autori și articolele lor |
| GET | `/search?q=` | căutare în titlu, sumar și conținut, ambele limbi |
| GET | `/settings` | tagline, ticker, prețuri, date de contact, profiluri sociale (`social`) |
| GET | `/widgets` | vreme Chișinău + curs BNM (memorate 15 minute) |
| POST | `/newsletter`, `/messages` | abonare la newsletter, contact și ponturi |
| POST | `/payments/premium/checkout` · `/payments/partner/checkout` | sesiuni Stripe |
| POST | `/payments/webhook` | evenimente Stripe (raw body) |
| GET | `/payments/session/:id` | starea sesiunii + token-ul de cititor |
| POST | `/subscribers/verify` | validarea token-ului de abonat |

**Administrare** (`Authorization: Bearer <token>`)

`POST /auth/login` (maximum 10 încercări pe IP la 15 minute, apoi 429),
`GET /auth/me`, `GET /admin/stats`, CRUD pe `/admin/articles`,
`/admin/authors`, plus `/admin/messages`, `/admin/subscribers`,
`/admin/partners` și `PUT /admin/settings` (`{key, value}`; cheia `social`
acceptă doar adrese `https://`).

Reguli de protecție aplicate de API: paywall-ul cere abonament `active` **și**
neexpirat (`currentPeriodEnd`); rutele publice `related` și `view` ignoră
draft-urile; căutarea escapează metacaracterele LIKE; id-urile de rută sunt
limitate la intervalul `Int`; `X-Powered-By` este dezactivat și se trimit
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: no-referrer`.

**Revalidare web** — `POST /api/revalidate` pe aplicația web (port 3100), cu
același antet `Authorization: Bearer <token>`: validează token-ul prin
`GET /api/auth/me` și invalidează cache-ul (`settings`, `articles`,
`categories`, `authors`, `/`). Panoul o apelează automat după fiecare salvare.

---

## Panou de administrare

<http://localhost:3100/admin> — interfață în limba română, în afara rutării bilingve.

```
utilizator: admin@corbul.md
parolă:     corbul2026
```

Permite: statistici, editarea completă a articolelor pe tab-uri RO/RU (cu
previzualizarea copertei generate), CRUD pe autori, gestiunea abonaților și a
partenerilor, mesajele primite și setările portalului.

Acesta este **contul de instalare** creat de `npm run db:seed`
(`adminPassword` din `.content/seed-content.json`, implicit `corbul2026`);
pagina de autentificare nu îl afișează.

> Schimbă parola contului de instalare și `JWT_SECRET` (vezi
> [Variabile de mediu](#variabile-de-mediu)) înainte de orice instalare publică.

---

## Calculatoare fiscale

`/ro/instrumente` (respectiv `/ru/instrumente`) grupează șase instrumente:
salariu net ⇄ brut, devamare auto, TVA, convertor valutar BNM, credit cu
anuitate și impozit pe bunuri imobiliare. Parametrii fiscali (cote, scutiri,
coeficienți de vechime) sunt editabili în secțiunea „Avansat".

> **Disclaimer.** Rezultatele sunt **estimative** și au scop informativ. Cotele,
> scutirile și coeficienții se modifică prin lege; pentru decizii fiscale
> verificați legislația în vigoare și consultați un specialist. Corbul.md nu își
> asumă răspunderea pentru deciziile luate exclusiv pe baza acestor calcule.

---

## Bilingvism (RO / RU)

Rutare cu prefix explicit pentru ambele limbi: `/ro/...` și `/ru/...`
(`localePrefix: "always"`, limba implicită `ro`). Textele de interfață stau în
`apps/web/messages/ro.json` și `ru.json` — fișierele au exact aceleași chei.
Conținutul editorial este stocat bilingv în baza de date, iar API-ul întoarce
câmpurile deja localizate, după parametrul `locale`.

Panoul de administrare este intenționat monolingv (română) și trăiește în afara
segmentului `[locale]`.

---

## Stripe în mod demonstrativ

Dacă `STRIPE_SECRET_KEY` lipsește sau a rămas `sk_test_placeholder`, endpoint-urile
de checkout întorc `{ url: null, demo: true, message }`, iar interfața afișează un
mesaj elegant de „mod demonstrativ" în locul redirecționării. Webhook-ul răspunde
200 și doar loghează evenimentul. **Site-ul funcționează integral fără chei Stripe
reale** — abonamentele și parteneriatele se pot testa end-to-end doar prin
introducerea unor chei de test valide.

---

## Mențiune editorială

Textele, autorii, documentele și cifrele din `.content/seed-content.json` sunt
**ficțiune editorială**, create pentru demonstrarea produsului. Ele nu descriu
persoane, companii sau instituții reale și nu constituie afirmații jurnalistice.
Orice asemănare cu fapte reale este întâmplătoare.

---

© 2026 Corbul.md

---

## Punere online (Vercel + API separat)

Depozitul este un **monorepo**: `apps/web` (Next.js) și `apps/api` (NestJS).
Vercel rulează doar aplicația web; API-ul NestJS are nevoie de un proces care
stă pornit și de PostgreSQL, deci se găzduiește separat.

### 1. Frontend pe Vercel

În Vercel → **Project Settings → General**:

| Setare | Valoare |
|---|---|
| Root Directory | `apps/web` |
| Include files outside root directory | **activat** (monorepo cu npm workspaces) |
| Framework Preset | Next.js (detectat automat) |

**Dacă Root Directory rămâne rădăcina depozitului, Vercel nu găsește
aplicația Next și fiecare adresă întoarce 404-ul platformei**
(`404: NOT_FOUND`, cu un `ID: fra1::…`). Acesta este cel mai frecvent motiv
al unui deployment „gol".

Variabile de mediu (Settings → Environment Variables):

```
API_URL=https://<api-ul-tău>/api          # citit pe server
NEXT_PUBLIC_API_URL=https://<api-ul-tău>/api   # citit în browser (admin, reclame)
NEXT_PUBLIC_SITE_URL=https://<domeniul-tău>    # canonical, hreflang, sitemap, OG
```

### 2. Baza de date — Neon

<https://neon.tech> → proiect, regiunea Frankfurt. Planul gratuit nu expiră.

Un proiect Neon poate fi împărțit cu alte site-uri. Tabelele Corbul au nume
generice (`Article`, `Author`, `Category`, `Setting`, `Partner`, `Message`) care
se ciocnesc cu ale altor aplicații din schema `public`, așa că **Corbul stă
într-o schemă proprie, `corbul`**. Celelalte scheme rămân neatinse.

Din butonul **Connect** al proiectului copiază adresa și adaugă `&schema=corbul`:

```
DATABASE_URL=postgresql://USER:PAROLA@ep-….eu-central-1.aws.neon.tech/neondb?sslmode=require&schema=corbul
DIRECT_URL=aceeași valoare
```

Amândouă folosesc gazda **fără `-pooler`**. Pooler-ul Neon refuză parametrul de
pornire `search_path` (`unsupported startup parameter in options: search_path`),
deci cu o schemă separată conexiunea prin pooler nu merge. Nu se pierde nimic:
pooler-ul e util funcțiilor serverless, iar API-ul de pe Render e un proces care
stă pornit și își ține singur pool-ul de conexiuni.

Prima încărcare a datelor se poate face și de pe calculatorul local:

```
DATABASE_URL='…&schema=corbul' DIRECT_URL='…&schema=corbul' npm run db:deploy
DATABASE_URL='…&schema=corbul' DIRECT_URL='…&schema=corbul' npm run db:seed
```

Seed-ul este format numai din `upsert`: reluat, nu șterge și nu dublează nimic,
și nu atinge alte scheme din bază.

### 3. API-ul — Render

Depozitul conține `render.yaml`, deci nu trebuie configurat nimic manual:
render.com → **New → Blueprint** → alege depozitul. Render cere doar
variabilele marcate `sync: false` (cele două adrese Neon, `WEB_URL` și,
opțional, cheile Stripe), apoi rulează singur migrările și seed-ul.

Alternativ, manual, pe orice platformă cu proces persistent:

```
Build : npm install --include=dev && npm run build --workspace=api && npm run db:seed
Start : npm run start --workspace=api
```

Când serviciul e pornit, verifică <https://NUMELE.onrender.com/api/health> —
trebuie să întoarcă `{"ok":true,...,"articles":24}`.

### 4. Legarea celor două

În Vercel → Environment Variables:

```
API_URL=https://NUMELE.onrender.com/api
NEXT_PUBLIC_API_URL=https://NUMELE.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://DOMENIUL-TĂU
```

În Render, `WEB_URL` = adresa de pe Vercel (fără slash final), altfel CORS
respinge cererile din browser. Apoi **Redeploy** în Vercel.

> Planul gratuit Render adoarme serviciul după 15 minute fără trafic;
> prima cerere de după poate dura ~30 de secunde. Paginile publice tolerează
> asta (afișează stări goale și se completează la reîncărcare).

### 5. Fără API

Site-ul se randează și dacă API-ul lipsește — toate citirile de date sunt
tolerante la eroare — dar paginile vor arăta stări goale, iar panoul de
administrare nu se poate autentifica. Pentru o demonstrație completă,
pornește întâi API-ul.
