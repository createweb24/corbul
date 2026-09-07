"use client";

/**
 * Editorul de articole (SPEC §9): modal cu tab-uri RO/RU, toate câmpurile
 * brute din `AdminArticleDto`, slug transliterat dar editabil, `coverSeed`
 * cu regenerare aleatorie și previzualizare live, comutatoare, etichete,
 * surse dinamice și validare completă înainte de salvare.
 */

import { useCallback, useMemo, useState } from "react";
import { slugify } from "@/lib/format";
import type { AdminArticleDto, AdminAuthorDto, SourceRef } from "@/lib/types";
import type { AdminCategory } from "../_lib/catalog";
import {
  isoToLocalInput,
  localInputToIso,
  nowLocalInput,
} from "../_lib/datetime";
import { adminFetch, errorMessage, revalidateSite } from "../_lib/session";
import { CoverPreview } from "./CoverPreview";
import { ConfirmDialog, Modal } from "./Modal";
import { useToast } from "./toast";
import {
  Button,
  Field,
  Select,
  Switch,
  TextArea,
  TextInput,
} from "./ui";

/* ------------------------------------------------------------------ */
/* Starea formularului                                                 */
/* ------------------------------------------------------------------ */

interface SourceRow extends SourceRef {
  /** cheie stabilă pentru React, independentă de conținut */
  key: number;
}

interface FormState {
  slug: string;
  slugTouched: boolean;
  categorySlug: string;
  authorId: string;
  titleRo: string;
  titleRu: string;
  summaryRo: string;
  summaryRu: string;
  contentRo: string;
  contentRu: string;
  tagsRo: string;
  tagsRu: string;
  sources: SourceRow[];
  coverSeed: number;
  readMin: string;
  publishedAt: string;
  featured: boolean;
  breaking: boolean;
  premium: boolean;
  published: boolean;
}

type Errors = Partial<Record<keyof FormState | "general", string>> & {
  sources?: string;
};

const MAX_TAGS = 24;
const MAX_SOURCES = 24;

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}

function tagsToText(tags: string[]): string {
  return tags.join(", ");
}

function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[,\n]/)) {
    const tag = raw.trim().replace(/\s+/g, " ");
    if (!tag) continue;
    const key = tag.toLocaleLowerCase("ro");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

let sourceKey = 1;

function toSourceRows(sources: SourceRef[]): SourceRow[] {
  return sources.map((source) => ({ ...source, key: sourceKey++ }));
}

/**
 * Aceeași formulă ca `estimateReadMin` din API (cuvinte / 200, între 2 și
 * 60), ca hint-ul din editor să prezică exact valoarea salvată când câmpul
 * „Minute de citit” e lăsat gol.
 */
export function estimateReadMin(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
  return Math.max(2, Math.min(60, Math.round(words / 200) || 2));
}

/** Amprenta conținutului editabil — pentru detectarea modificărilor nesalvate. */
function snapshot(form: FormState): string {
  return JSON.stringify({
    ...form,
    // starea internă a slugului nu e o modificare de conținut
    slugTouched: undefined,
    sources: form.sources.map((row) => [row.label, row.url]),
  });
}

function initialState(
  article: AdminArticleDto | null,
  categories: AdminCategory[],
  authors: AdminAuthorDto[],
): FormState {
  if (article) {
    return {
      slug: article.slug,
      slugTouched: true,
      categorySlug:
        article.category?.slug ??
        categories.find((category) => category.id === article.categoryId)?.slug ??
        "",
      authorId: String(article.authorId),
      titleRo: article.titleRo,
      titleRu: article.titleRu,
      summaryRo: article.summaryRo,
      summaryRu: article.summaryRu,
      contentRo: article.contentRo,
      contentRu: article.contentRu,
      tagsRo: tagsToText(article.tagsRo),
      tagsRu: tagsToText(article.tagsRu),
      sources: toSourceRows(article.sources),
      coverSeed: article.coverSeed,
      readMin: String(article.readMin),
      publishedAt: isoToLocalInput(article.publishedAt),
      featured: article.featured,
      breaking: article.breaking,
      premium: article.premium,
      published: article.published,
    };
  }

  return {
    slug: "",
    slugTouched: false,
    categorySlug: categories[0]?.slug ?? "",
    authorId: authors[0] ? String(authors[0].id) : "",
    titleRo: "",
    titleRu: "",
    summaryRo: "",
    summaryRu: "",
    contentRo: "<p></p>",
    contentRu: "",
    tagsRo: "",
    tagsRu: "",
    sources: [],
    coverSeed: randomSeed(),
    // gol = API-ul estimează automat din conținut (cuvinte / 200)
    readMin: "",
    publishedAt: nowLocalInput(),
    featured: false,
    breaking: false,
    premium: false,
    published: true,
  };
}

/* ------------------------------------------------------------------ */
/* Componenta                                                          */
/* ------------------------------------------------------------------ */

export interface ArticleEditorProps {
  /** `null` = articol nou */
  article: AdminArticleDto | null;
  categories: AdminCategory[];
  authors: AdminAuthorDto[];
  onClose: () => void;
  onSaved: (article: AdminArticleDto, created: boolean) => void;
}

export function ArticleEditor({
  article,
  categories,
  authors,
  onClose,
  onSaved,
}: ArticleEditorProps) {
  const toast = useToast();
  const [initial] = useState<FormState>(() =>
    initialState(article, categories, authors),
  );
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [tab, setTab] = useState<"ro" | "ru">("ro");
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const isNew = article === null;
  const dirty = useMemo(
    () => snapshot(form) !== snapshot(initial),
    [form, initial],
  );
  const estimatedReadMin = useMemo(
    () => estimateReadMin(form.contentRo),
    [form.contentRo],
  );

  /** Închiderea cere confirmare dacă există modificări nesalvate. */
  function requestClose() {
    if (saving) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  }

  const patch = useCallback((changes: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...changes }));
  }, []);

  const category = useMemo(
    () => categories.find((item) => item.slug === form.categorySlug),
    [categories, form.categorySlug],
  );
  const hue = category?.hue ?? 42;

  /* -------------------------------------------------------------- */
  /* Câmpuri derivate                                                */
  /* -------------------------------------------------------------- */

  function onTitleRoChange(value: string) {
    setForm((current) => ({
      ...current,
      titleRo: value,
      slug: current.slugTouched ? current.slug : slugify(value),
    }));
  }

  function regenerateSlug() {
    patch({ slug: slugify(form.titleRo), slugTouched: false });
  }

  function updateSource(key: number, changes: Partial<SourceRef>) {
    setForm((current) => ({
      ...current,
      sources: current.sources.map((row) =>
        row.key === key ? { ...row, ...changes } : row,
      ),
    }));
  }

  function addSource() {
    setForm((current) =>
      current.sources.length >= MAX_SOURCES
        ? current
        : {
            ...current,
            sources: [...current.sources, { key: sourceKey++, label: "", url: "" }],
          },
    );
  }

  function removeSource(key: number) {
    setForm((current) => ({
      ...current,
      sources: current.sources.filter((row) => row.key !== key),
    }));
  }

  /* -------------------------------------------------------------- */
  /* Validare                                                        */
  /* -------------------------------------------------------------- */

  function validate(): { errors: Errors; publishedAtIso: string | null } {
    const found: Errors = {};

    if (!form.titleRo.trim()) found.titleRo = "Titlul în română este obligatoriu.";
    else if (form.titleRo.trim().length > 300) found.titleRo = "Maximum 300 de caractere.";

    if (form.titleRu.trim().length > 300) found.titleRu = "Maximum 300 de caractere.";

    if (!form.summaryRo.trim()) found.summaryRo = "Sumarul în română este obligatoriu.";
    else if (form.summaryRo.trim().length > 2000) found.summaryRo = "Maximum 2 000 de caractere.";

    if (form.summaryRu.trim().length > 2000) found.summaryRu = "Maximum 2 000 de caractere.";

    const contentRo = form.contentRo.replace(/<[^>]*>/g, "").trim();
    if (!contentRo) found.contentRo = "Conținutul în română este obligatoriu.";

    const slug = form.slug.trim();
    if (!slug) found.slug = "Slugul este obligatoriu.";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      found.slug = "Doar litere mici fără diacritice, cifre și cratime.";
    else if (slug.length > 160) found.slug = "Maximum 160 de caractere.";

    if (!form.categorySlug) found.categorySlug = "Alege o categorie.";
    else if (!category) found.categorySlug = "Categoria nu mai există.";
    else if (!Number.isInteger(category.id))
      // apărare la runtime: un API mai vechi, fără `id` în CategoryDto
      found.categorySlug =
        "API-ul nu a trimis identificatorul categoriei. Reîncarcă pagina sau actualizează API-ul.";

    const authorId = Number(form.authorId);
    if (!form.authorId || !Number.isInteger(authorId) || authorId < 1)
      found.authorId = "Alege un autor.";

    if (form.readMin.trim()) {
      const readMin = Number(form.readMin);
      if (!Number.isInteger(readMin) || readMin < 1 || readMin > 120)
        found.readMin = "Între 1 și 120 de minute (sau gol = estimat automat).";
    }

    if (
      !Number.isInteger(form.coverSeed) ||
      form.coverSeed < 0 ||
      form.coverSeed > 1_000_000
    )
      found.coverSeed = "Între 0 și 1 000 000.";

    const publishedAtIso = localInputToIso(form.publishedAt);
    if (!publishedAtIso) found.publishedAt = "Data publicării nu este validă.";

    if (parseTags(form.tagsRo).length > MAX_TAGS)
      found.tagsRo = `Maximum ${MAX_TAGS} etichete.`;
    if (parseTags(form.tagsRu).length > MAX_TAGS)
      found.tagsRu = `Maximum ${MAX_TAGS} etichete.`;

    const bad = form.sources.find(
      (row) => !row.label.trim() || !/^https?:\/\/\S+$/i.test(row.url.trim()),
    );
    if (bad)
      found.sources =
        "Fiecare sursă are nevoie de o etichetă și de o adresă completă (http:// sau https://).";
    if (form.sources.length > MAX_SOURCES)
      found.sources = `Maximum ${MAX_SOURCES} surse.`;

    return { errors: found, publishedAtIso };
  }

  const roHasError = Boolean(
    errors.titleRo || errors.summaryRo || errors.contentRo || errors.tagsRo,
  );
  const ruHasError = Boolean(errors.titleRu || errors.summaryRu || errors.tagsRu);

  /* -------------------------------------------------------------- */
  /* Salvare                                                         */
  /* -------------------------------------------------------------- */

  async function save() {
    if (saving) return;
    const { errors: found, publishedAtIso } = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      if (found.titleRo || found.summaryRo || found.contentRo || found.tagsRo) {
        setTab("ro");
      } else if (found.titleRu || found.summaryRu || found.tagsRu) {
        setTab("ru");
      }
      toast.error("Formularul are câmpuri de corectat.");
      return;
    }

    const categoryId = category?.id;
    if (!categoryId || !publishedAtIso) return;

    const titleRu = form.titleRu.trim();
    const summaryRu = form.summaryRu.trim();
    const contentRu = form.contentRu.trim();
    const tagsRu = parseTags(form.tagsRu);
    const requestedSlug = form.slug.trim();

    const payload: Record<string, unknown> = {
      slug: requestedSlug,
      categoryId,
      authorId: Number(form.authorId),
      titleRo: form.titleRo.trim(),
      summaryRo: form.summaryRo.trim(),
      contentRo: form.contentRo,
      tagsRo: parseTags(form.tagsRo),
      sources: form.sources.map((row) => ({
        label: row.label.trim(),
        url: row.url.trim(),
      })),
      coverSeed: form.coverSeed,
      publishedAt: publishedAtIso,
      featured: form.featured,
      breaking: form.breaking,
      premium: form.premium,
      published: form.published,
    };

    // Gol înseamnă „preia varianta română" (la creare) sau „păstrează ce
    // există" (la actualizare) — nu trimitem niciodată un text rusesc gol.
    if (titleRu) payload.titleRu = titleRu;
    if (summaryRu) payload.summaryRu = summaryRu;
    if (contentRu) payload.contentRu = contentRu;
    // Etichetele RU: la creare doar dacă există (altfel API-ul preia RO);
    // la editare doar dacă s-au schimbat față de ce era salvat.
    if (isNew ? tagsRu.length > 0 : form.tagsRu !== initial.tagsRu) {
      payload.tagsRu = tagsRu;
    }
    // Timpul de citire: gol = estimat de API din conținut (cuvinte / 200).
    if (form.readMin.trim()) payload.readMin = Number(form.readMin);

    setSaving(true);
    try {
      const saved = article
        ? await adminFetch<AdminArticleDto>(`/admin/articles/${article.id}`, {
            method: "PUT",
            body: payload,
          })
        : await adminFetch<AdminArticleDto>("/admin/articles", {
            method: "POST",
            body: payload,
          });
      toast.ok(
        isNew ? "Articol creat." : "Modificările au fost salvate.",
        saved.titleRo,
      );
      if (saved.slug !== requestedSlug) {
        toast.warn(
          "Slugul era deja folosit.",
          `Articolul a fost salvat la /${saved.slug}.`,
        );
      }
      void revalidateSite();
      onSaved(saved, isNew);
    } catch (caught) {
      const message = errorMessage(caught, "Salvarea a eșuat.");
      setErrors((current) => ({ ...current, general: message }));
      toast.error("Salvarea a eșuat.", message);
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------------------------------------- */
  /* Randare                                                         */
  /* -------------------------------------------------------------- */

  const tabButton = (value: "ro" | "ru", label: string, flagged: boolean) => (
    <button
      key={value}
      type="button"
      onClick={() => setTab(value)}
      aria-selected={tab === value}
      role="tab"
      className={
        "relative -mb-px border-b-2 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-200 " +
        (tab === value
          ? "border-gold text-gold"
          : "border-transparent text-mist hover:text-ivory")
      }
    >
      {label}
      {flagged ? (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1.5 size-1.5 rounded-full bg-ember"
        />
      ) : null}
    </button>
  );

  return (
    <Modal
      open
      onClose={requestClose}
      busy={saving}
      size="xl"
      kicker={article ? `Articol #${article.id}` : "Material nou"}
      title={isNew ? "Adaugă un articol" : form.titleRo || "Editează articolul"}
      footer={
        <>
          {errors.general ? (
            <p className="mr-auto max-w-md text-xs leading-relaxed text-ember">
              {errors.general}
            </p>
          ) : dirty ? (
            <p className="mr-auto text-[0.6875rem] uppercase tracking-[0.14em] text-mist">
              Modificări nesalvate
            </p>
          ) : null}
          <Button variant="ghost" onClick={requestClose} disabled={saving}>
            Renunță
          </Button>
          <Button variant="gold" loading={saving} onClick={() => void save()}>
            {isNew ? "Creează articolul" : "Salvează"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* ---------------------------------------------------------- */}
        {/* Conținut, pe limbi                                          */}
        {/* ---------------------------------------------------------- */}
        <div className="min-w-0">
          <div role="tablist" aria-label="Limba conținutului" className="mb-5 flex border-b border-line">
            {tabButton("ro", "Română", roHasError)}
            {tabButton("ru", "Русский", ruHasError)}
          </div>

          {tab === "ro" ? (
            <div className="flex flex-col gap-4">
              <Field label="Titlu (RO)" htmlFor="titleRo" required error={errors.titleRo}>
                <TextInput
                  id="titleRo"
                  value={form.titleRo}
                  invalid={Boolean(errors.titleRo)}
                  onChange={(event) => onTitleRoChange(event.target.value)}
                  placeholder="Rețeaua offshore din spatele licitațiilor publice"
                />
              </Field>

              <Field
                label="Sumar (RO)"
                htmlFor="summaryRo"
                required
                error={errors.summaryRo}
                hint={`${form.summaryRo.trim().length} / 2000 de caractere — apare pe carduri și în meta description.`}
              >
                <TextArea
                  id="summaryRo"
                  rows={3}
                  value={form.summaryRo}
                  invalid={Boolean(errors.summaryRo)}
                  onChange={(event) => patch({ summaryRo: event.target.value })}
                />
              </Field>

              <Field
                label="Conținut HTML (RO)"
                htmlFor="contentRo"
                required
                error={errors.contentRo}
                hint="Etichete acceptate: <p>, <h2>, <h3>, <blockquote>, <ul>, <ol>, <a>, <strong>, <em>."
              >
                <TextArea
                  id="contentRo"
                  rows={16}
                  mono
                  spellCheck={false}
                  value={form.contentRo}
                  invalid={Boolean(errors.contentRo)}
                  onChange={(event) => patch({ contentRo: event.target.value })}
                  className="min-h-72"
                />
              </Field>

              <Field
                label="Etichete (RO)"
                htmlFor="tagsRo"
                error={errors.tagsRo}
                hint="Separate prin virgulă. Maximum 24."
              >
                <TextInput
                  id="tagsRo"
                  value={form.tagsRo}
                  invalid={Boolean(errors.tagsRo)}
                  onChange={(event) => patch({ tagsRo: event.target.value })}
                  placeholder="achiziții publice, offshore, energie"
                />
              </Field>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="border border-line-2 bg-coal-2 px-3 py-2 text-xs leading-relaxed text-fog">
                Câmpurile rusești lăsate goale preiau automat varianta română la
                creare, iar la editare păstrează textul existent.
              </p>

              <Field label="Заголовок (RU)" htmlFor="titleRu" error={errors.titleRu}>
                <TextInput
                  id="titleRu"
                  value={form.titleRu}
                  invalid={Boolean(errors.titleRu)}
                  onChange={(event) => patch({ titleRu: event.target.value })}
                  placeholder="Офшорная сеть за публичными тендерами"
                />
              </Field>

              <Field
                label="Краткое содержание (RU)"
                htmlFor="summaryRu"
                error={errors.summaryRu}
                hint={`${form.summaryRu.trim().length} / 2000 de caractere.`}
              >
                <TextArea
                  id="summaryRu"
                  rows={3}
                  value={form.summaryRu}
                  invalid={Boolean(errors.summaryRu)}
                  onChange={(event) => patch({ summaryRu: event.target.value })}
                />
              </Field>

              <Field
                label="Текст HTML (RU)"
                htmlFor="contentRu"
                hint="Aceleași etichete ca la varianta română."
              >
                <TextArea
                  id="contentRu"
                  rows={16}
                  mono
                  spellCheck={false}
                  value={form.contentRu}
                  onChange={(event) => patch({ contentRu: event.target.value })}
                  className="min-h-72"
                />
              </Field>

              <Field
                label="Метки (RU)"
                htmlFor="tagsRu"
                error={errors.tagsRu}
                hint="Separate prin virgulă. Maximum 24."
              >
                <TextInput
                  id="tagsRu"
                  value={form.tagsRu}
                  invalid={Boolean(errors.tagsRu)}
                  onChange={(event) => patch({ tagsRu: event.target.value })}
                  placeholder="госзакупки, офшоры, энергетика"
                />
              </Field>
            </div>
          )}

          {/* Surse — comune ambelor limbi */}
          <div className="mt-7 border-t border-line pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="kicker">Surse verificabile</p>
                <p className="mt-1 text-xs text-mist">
                  Apar în caseta de încredere de sub articol.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={addSource}
                disabled={form.sources.length >= MAX_SOURCES}
              >
                + Adaugă sursă
              </Button>
            </div>

            {form.sources.length === 0 ? (
              <p className="border border-dashed border-line px-3 py-4 text-center text-xs text-mist">
                Nicio sursă adăugată.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {form.sources.map((row, index) => (
                  <li
                    key={row.key}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
                  >
                    <TextInput
                      value={row.label}
                      aria-label={`Eticheta sursei ${index + 1}`}
                      placeholder="Registrul de stat"
                      invalid={Boolean(errors.sources) && !row.label.trim()}
                      onChange={(event) =>
                        updateSource(row.key, { label: event.target.value })
                      }
                    />
                    <TextInput
                      value={row.url}
                      type="url"
                      inputMode="url"
                      spellCheck={false}
                      aria-label={`Adresa sursei ${index + 1}`}
                      placeholder="https://…"
                      invalid={
                        Boolean(errors.sources) &&
                        !/^https?:\/\/\S+$/i.test(row.url.trim())
                      }
                      onChange={(event) =>
                        updateSource(row.key, { url: event.target.value })
                      }
                    />
                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => removeSource(row.key)}
                      aria-label={`Șterge sursa ${index + 1}`}
                      className="sm:h-auto"
                    >
                      Șterge
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {errors.sources ? (
              <p className="mt-2 text-xs text-ember">{errors.sources}</p>
            ) : null}
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* Coloana de setări                                           */}
        {/* ---------------------------------------------------------- */}
        <aside className="flex flex-col gap-4 lg:border-l lg:border-line lg:pl-6">
          <Field label="Categorie" htmlFor="categorySlug" required error={errors.categorySlug}>
            <Select
              id="categorySlug"
              value={form.categorySlug}
              invalid={Boolean(errors.categorySlug)}
              onChange={(event) => patch({ categorySlug: event.target.value })}
            >
              <option value="">— alege —</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Autor" htmlFor="authorId" required error={errors.authorId}>
            <Select
              id="authorId"
              value={form.authorId}
              invalid={Boolean(errors.authorId)}
              onChange={(event) => patch({ authorId: event.target.value })}
            >
              <option value="">— alege —</option>
              {authors.map((author) => (
                <option key={author.id} value={String(author.id)}>
                  {author.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Slug"
            htmlFor="slug"
            required
            error={errors.slug}
            hint="Se generează din titlul RO, cu diacriticele transliterate."
          >
            <div className="flex gap-2">
              <TextInput
                id="slug"
                value={form.slug}
                mono
                spellCheck={false}
                invalid={Boolean(errors.slug)}
                onChange={(event) =>
                  patch({ slug: event.target.value, slugTouched: true })
                }
              />
              <Button
                size="md"
                variant="ghost"
                onClick={regenerateSlug}
                aria-label="Regenerează slugul din titlu"
                className="shrink-0 px-2.5"
              >
                ↻
              </Button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Publicat la" htmlFor="publishedAt" required error={errors.publishedAt}>
              <TextInput
                id="publishedAt"
                type="datetime-local"
                value={form.publishedAt}
                invalid={Boolean(errors.publishedAt)}
                onChange={(event) => patch({ publishedAt: event.target.value })}
              />
            </Field>
            <Field
              label="Minute de citit"
              htmlFor="readMin"
              error={errors.readMin}
              hint={
                form.readMin.trim()
                  ? undefined
                  : `Gol = estimat automat (≈ ${estimatedReadMin} min).`
              }
            >
              <TextInput
                id="readMin"
                type="number"
                min={1}
                max={120}
                value={form.readMin}
                placeholder={`≈ ${estimatedReadMin}`}
                invalid={Boolean(errors.readMin)}
                onChange={(event) => patch({ readMin: event.target.value })}
              />
            </Field>
          </div>

          {/* Copertă generată */}
          <div>
            <p className="mb-1.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-fog">
              Copertă
            </p>
            <CoverPreview
              seed={form.coverSeed}
              hue={hue}
              title={form.titleRo || "Copertă Corbul.md"}
            />
            <div className="mt-2 flex gap-2">
              <TextInput
                type="number"
                min={0}
                max={1_000_000}
                value={String(form.coverSeed)}
                aria-label="Seed-ul copertei"
                invalid={Boolean(errors.coverSeed)}
                onChange={(event) =>
                  patch({ coverSeed: Math.trunc(Number(event.target.value) || 0) })
                }
              />
              <Button
                variant="ghost"
                onClick={() => patch({ coverSeed: randomSeed() })}
                aria-label="Generează un seed nou"
                className="shrink-0 px-3 text-sm"
              >
                🎲
              </Button>
            </div>
            {errors.coverSeed ? (
              <p className="mt-1.5 text-xs text-ember">{errors.coverSeed}</p>
            ) : null}
          </div>

          {/* Comutatoare */}
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <Switch
              checked={form.published}
              onChange={(next) => patch({ published: next })}
              label="Publicat"
              hint="Vizibil pe site"
            />
            <Switch
              checked={form.featured}
              onChange={(next) => patch({ featured: next })}
              label="★ Featured"
              hint="Candidat pentru hero și secțiunile principale"
            />
            <Switch
              checked={form.breaking}
              onChange={(next) => patch({ breaking: next })}
              label="⚡ Breaking"
              hint="Intră în banda de ultimă oră"
            />
            <Switch
              checked={form.premium}
              onChange={(next) => patch({ premium: next })}
              label="◆ Premium"
              hint="Conținut trunchiat pentru neabonați"
            />
          </div>
        </aside>
      </div>

      {/* Protecția conținutului nesalvat — niciodată `confirm()` */}
      <ConfirmDialog
        open={discardOpen}
        kicker="Modificări nesalvate"
        title="Renunți la modificări?"
        message="Textul introdus în acest editor nu a fost salvat și se va pierde."
        confirmLabel="Renunță la modificări"
        cancelLabel="Continuă editarea"
        onConfirm={() => {
          setDiscardOpen(false);
          onClose();
        }}
        onCancel={() => setDiscardOpen(false)}
      />
    </Modal>
  );
}
