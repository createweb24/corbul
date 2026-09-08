import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatDate, formatNumber, romanNumeral } from "@/lib/format";
import type { ArticleListDto, Locale } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { cn } from "./cn";
import { Cover } from "./Cover";
import { microcopy } from "./microcopy";

/**
 * Cardul de articol, în cele cinci registre din SPEC §5.
 *
 *   lead     — capul de pagină / capul de secțiune: copertă mare, titlu uriaș
 *   standard — cardul din grilă: copertă 16:9, titlu, lede, meta
 *   row      — listă orizontală (căutare, „articole conexe", pagini de autor)
 *   minimal  — doar tipografie, separat prin hairline (sidebar, „cele mai citite")
 *   quote    — opinie/analiză: titlul devine citat pe fundal ridicat
 *
 * Întregul card e o suprafață de clic: legătura din titlu se întinde peste
 * el prin `after:absolute after:inset-0`, deci nu punem alte legături înăuntru.
 */

export type CardVariant = "lead" | "standard" | "row" | "minimal" | "quote";

export interface CardProps {
  article: ArticleListDto;
  /**
   * Limba pentru dată și micro-etichete. Dacă lipsește, se ia din contextul
   * next-intl (`useLocale()`) — funcționează atât în componentele server
   * ne-async, cât și în cele client aflate sub `NextIntlClientProvider`.
   */
  locale?: Locale;
  variant?: CardVariant;
  className?: string;
  /** numerotare romană (I, II, III…) — pentru `minimal` */
  index?: number;
  showSummary?: boolean;
  showCover?: boolean;
  showAuthor?: boolean;
  showCategory?: boolean;
  headingLevel?: 2 | 3 | 4;
  /** suprascrie destinația implicită `/articol/{slug}` */
  href?: string;
  /** prioritate vizuală suplimentară pentru primul card dintr-o bandă */
  emphasis?: boolean;
}

/* ---------------------------------------------------------------- */

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function Sep() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-[3px] w-[3px] rotate-45 bg-line-2"
    />
  );
}

interface MetaProps {
  article: ArticleListDto;
  locale: Locale;
  showAuthor?: boolean;
  showViews?: boolean;
  className?: string;
}

function Meta({
  article,
  locale,
  showAuthor = true,
  showViews = true,
  className,
}: MetaProps) {
  const copy = microcopy(locale);
  return (
    <div
      className={cn(
        "meta flex flex-wrap items-center gap-x-2.5 gap-y-1",
        "[&>*]:whitespace-nowrap",
        className,
      )}
    >
      {showAuthor ? (
        <>
          <span className="text-fog">{article.author.name}</span>
          <Sep />
        </>
      ) : null}
      <time dateTime={article.publishedAt}>
        {formatDate(article.publishedAt, locale)}
      </time>
      <Sep />
      <span className="inline-flex items-center gap-1">
        <ClockIcon />
        {article.readMin} {copy.readMin}
      </span>
      {showViews && article.views > 0 ? (
        <>
          <Sep />
          <span
            className="inline-flex items-center gap-1"
            title={copy.views}
          >
            <EyeIcon />
            {formatNumber(article.views, locale)}
          </span>
        </>
      ) : null}
    </div>
  );
}

interface FlagsProps {
  article: ArticleListDto;
  locale: Locale;
  showCategory?: boolean;
  size?: "sm" | "md";
  className?: string;
}

function Flags({
  article,
  locale,
  showCategory = true,
  size = "sm",
  className,
}: FlagsProps) {
  if (!showCategory && !article.breaking && !article.premium) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {article.breaking ? (
        <Badge tone="breaking" size={size} locale={locale} />
      ) : null}
      {showCategory ? (
        <Badge tone="cat" hue={article.categoryHue} size={size}>
          {article.categoryName}
        </Badge>
      ) : null}
      {article.premium ? (
        <Badge tone="premium" size={size} locale={locale} />
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function Card({
  article,
  locale: localeProp,
  variant = "standard",
  className,
  index,
  showSummary,
  showCover,
  showAuthor = true,
  showCategory = true,
  headingLevel,
  href,
  emphasis = false,
}: CardProps) {
  // hook apelat necondiționat; valoarea e ignorată dacă `locale` a fost dat
  const contextLocale = useLocale();
  const locale: Locale =
    localeProp ?? (contextLocale === "ru" ? "ru" : "ro");

  const target = href ?? `/articol/${article.slug}`;
  const level = headingLevel ?? (variant === "lead" ? 2 : 3);
  const Heading = (level === 2 ? "h2" : level === 4 ? "h4" : "h3") as
    | "h2"
    | "h3"
    | "h4";

  const titleLink = (
    <Link
      href={target}
      className="title-link after:absolute after:inset-0 after:content-['']"
    >
      {article.title}
    </Link>
  );

  /* ------------------------------ lead ------------------------------ */
  if (variant === "lead") {
    const withCover = showCover ?? true;
    return (
      <article
        className={cn(
          "card-editorial group grid gap-6 overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-10",
          className,
        )}
      >
        {withCover ? (
          <Cover
            seed={article.coverSeed}
            hue={article.categoryHue}
            title={article.title}
            ratio="16 / 9"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/85 via-obsidian/10 to-transparent"
            />
            <Flags
              article={article}
              locale={locale}
              showCategory={showCategory}
              size="md"
              className="absolute top-4 left-4"
            />
          </Cover>
        ) : null}

        <div className="flex flex-1 flex-col gap-4">
          {!withCover ? (
            <Flags
              article={article}
              locale={locale}
              showCategory={showCategory}
              size="md"
            />
          ) : null}

          <Heading className="headline headline-tight text-[1.7rem] sm:text-[2.1rem] lg:text-[2.4rem]">
            {titleLink}
          </Heading>

          {(showSummary ?? true) && article.summary ? (
            <p className="clamp-3 font-serif text-[1.0625rem] leading-relaxed text-fog sm:text-lg">
              {article.summary}
            </p>
          ) : null}

          <div className="mt-auto flex items-center gap-3 pt-1">
            {showAuthor ? (
              <Avatar
                initials={article.author.initials}
                size="md"
                name={article.author.name}
              />
            ) : null}
            <Meta article={article} locale={locale} showAuthor={showAuthor} />
          </div>
        </div>
      </article>
    );
  }

  /* ------------------------------ row ------------------------------- */
  if (variant === "row") {
    const withCover = showCover ?? true;
    return (
      <article
        className={cn(
          "card-editorial group flex items-stretch gap-4 overflow-hidden p-3 sm:gap-5 sm:p-4",
          className,
        )}
      >
        {withCover ? (
          <Cover
            seed={article.coverSeed}
            hue={article.categoryHue}
            title={article.title}
            ratio="4 / 3"
            className="w-[104px] shrink-0 self-start border border-line sm:w-[168px]"
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Flags
            article={article}
            locale={locale}
            showCategory={showCategory}
          />
          <Heading className="headline text-[1.0625rem] leading-snug sm:text-xl">
            {titleLink}
          </Heading>
          {(showSummary ?? true) && article.summary ? (
            <p className="clamp-2 hidden font-serif text-[0.9375rem] leading-relaxed text-fog sm:block">
              {article.summary}
            </p>
          ) : null}
          <Meta
            article={article}
            locale={locale}
            showAuthor={showAuthor}
            className="mt-auto pt-1"
          />
        </div>
      </article>
    );
  }

  /* ---------------------------- minimal ----------------------------- */
  if (variant === "minimal") {
    return (
      <article
        className={cn(
          "group relative border-t border-line py-4 transition-colors duration-200 ease-editorial first:border-t-0 first:pt-0 hover:border-gold/40",
          className,
        )}
      >
        <div className="flex gap-3.5">
          {index !== undefined ? (
            <span
              aria-hidden="true"
              className="mt-[3px] w-7 shrink-0 text-right font-display text-[0.8125rem] font-semibold tracking-[0.06em] text-mist transition-colors duration-200 group-hover:text-gold"
            >
              {romanNumeral(index)}
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            {showCategory ? (
              <span
                className="kicker mb-1.5 block"
                style={{
                  color: `hsl(${((Math.round(article.categoryHue) % 360) + 360) % 360} 55% 68%)`,
                }}
              >
                {article.categoryName}
              </span>
            ) : null}

            <Heading className="headline text-[0.9375rem] leading-snug sm:text-base">
              {titleLink}
            </Heading>

            {(showSummary ?? false) && article.summary ? (
              <p className="clamp-2 mt-1.5 font-serif text-sm leading-relaxed text-fog">
                {article.summary}
              </p>
            ) : null}

            <Meta
              article={article}
              locale={locale}
              showAuthor={showAuthor}
              showViews={false}
              className="mt-1.5"
            />
          </div>
        </div>
      </article>
    );
  }

  /* ----------------------------- quote ------------------------------ */
  if (variant === "quote") {
    return (
      <article
        className={cn(
          "card-editorial group flex flex-col gap-4 bg-coal-2 p-6 sm:p-7",
          className,
        )}
      >
        <span aria-hidden="true" className="quote-mark" />

        <Heading className="headline text-[1.3rem] leading-[1.28] font-semibold italic sm:text-[1.45rem]">
          {titleLink}
        </Heading>

        {(showSummary ?? true) && article.summary ? (
          <p className="clamp-3 font-serif text-[0.9375rem] leading-relaxed text-fog">
            {article.summary}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
          <Avatar
            initials={article.author.initials}
            size="sm"
            name={article.author.name}
          />
          <div className="min-w-0">
            <span className="block truncate text-[0.8125rem] font-medium text-ivory">
              {article.author.name}
            </span>
            <span className="meta block">
              {article.categoryName} ·{" "}
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt, locale)}
              </time>
            </span>
          </div>
        </div>
      </article>
    );
  }

  /* ---------------------------- standard ---------------------------- */
  const withCover = showCover ?? true;
  return (
    <article
      className={cn(
        "card-editorial group flex flex-col overflow-hidden",
        emphasis ? "sm:col-span-2" : undefined,
        className,
      )}
    >
      {withCover ? (
        <Cover
          seed={article.coverSeed}
          hue={article.categoryHue}
          title={article.title}
          ratio="16 / 9"
          className="border-b border-line"
        >
          <Flags
            article={article}
            locale={locale}
            showCategory={showCategory}
            className="absolute top-3 left-3"
          />
        </Cover>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {!withCover ? (
          <Flags
            article={article}
            locale={locale}
            showCategory={showCategory}
          />
        ) : null}

        <Heading className="headline text-lg leading-snug sm:text-xl">
          {titleLink}
        </Heading>

        {(showSummary ?? true) && article.summary ? (
          <p className="clamp-3 font-serif text-[0.9375rem] leading-relaxed text-fog">
            {article.summary}
          </p>
        ) : null}

        <Meta
          article={article}
          locale={locale}
          showAuthor={showAuthor}
          className="mt-auto pt-1"
        />
      </div>
    </article>
  );
}

export default Card;
