"use client";

/**
 * `/admin/autori` — CRUD complet pe semnăturile redacției (SPEC §9).
 * Autorii sunt un semnal EEAT: nume, rol, biografie și e-mail public, în
 * ambele limbi.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { slugify } from "@/lib/format";
import type { AdminAuthorDto } from "@/lib/types";
import { ConfirmDialog, Modal } from "../_components/Modal";
import { useToast } from "../_components/toast";
import {
  Button,
  EmptyState,
  ErrorNote,
  Field,
  LoadingRows,
  PageHead,
  Panel,
  TextArea,
  TextInput,
} from "../_components/ui";
import { adminFetch, errorMessage, revalidateSite } from "../_lib/session";

interface AuthorForm {
  name: string;
  slug: string;
  slugTouched: boolean;
  initials: string;
  initialsTouched: boolean;
  email: string;
  roleRo: string;
  roleRu: string;
  bioRo: string;
  bioRu: string;
}

type AuthorErrors = Partial<Record<keyof AuthorForm | "general", string>>;

function deriveInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return words.map((word) => word.charAt(0).toLocaleUpperCase("ro")).join("");
}

function emptyForm(): AuthorForm {
  return {
    name: "",
    slug: "",
    slugTouched: false,
    initials: "",
    initialsTouched: false,
    email: "",
    roleRo: "",
    roleRu: "",
    bioRo: "",
    bioRu: "",
  };
}

/** Amprenta conținutului editabil — pentru detectarea modificărilor nesalvate. */
function snapshot(form: AuthorForm): string {
  return JSON.stringify({
    ...form,
    slugTouched: undefined,
    initialsTouched: undefined,
  });
}

function formFrom(author: AdminAuthorDto): AuthorForm {
  return {
    name: author.name,
    slug: author.slug,
    slugTouched: true,
    initials: author.initials,
    initialsTouched: true,
    email: author.email,
    roleRo: author.roleRo,
    roleRu: author.roleRu,
    bioRo: author.bioRo,
    bioRu: author.bioRu,
  };
}

export default function AutoriPage() {
  const toast = useToast();
  const [authors, setAuthors] = useState<AdminAuthorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<AdminAuthorDto | null | undefined>(
    undefined,
  );
  const [form, setForm] = useState<AuthorForm>(emptyForm);
  const [initialForm, setInitialForm] = useState<AuthorForm>(emptyForm);
  const [errors, setErrors] = useState<AuthorErrors>({});
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<AdminAuthorDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dirty = snapshot(form) !== snapshot(initialForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adminFetch<AdminAuthorDto[]>("/admin/authors");
      setAuthors(
        rows.slice().sort((a, b) => a.name.localeCompare(b.name, "ro")),
      );
    } catch (caught) {
      setError(errorMessage(caught, "Autorii nu au putut fi încărcați."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openEditor(author: AdminAuthorDto | null) {
    const next = author ? formFrom(author) : emptyForm();
    setForm(next);
    setInitialForm(next);
    setErrors({});
    setDiscardOpen(false);
    setEditing(author);
  }

  /** Închiderea cere confirmare dacă există modificări nesalvate. */
  function requestClose() {
    if (saving) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    setEditing(undefined);
  }

  function patch(changes: Partial<AuthorForm>) {
    setForm((current) => ({ ...current, ...changes }));
  }

  function onNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.slugTouched ? current.slug : slugify(value),
      initials: current.initialsTouched ? current.initials : deriveInitials(value),
    }));
  }

  function validate(): AuthorErrors {
    const found: AuthorErrors = {};
    if (!form.name.trim()) found.name = "Numele este obligatoriu.";
    else if (form.name.trim().length > 120) found.name = "Maximum 120 de caractere.";

    const slug = form.slug.trim();
    if (!slug) found.slug = "Slugul este obligatoriu.";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      found.slug = "Doar litere mici fără diacritice, cifre și cratime.";

    const initials = form.initials.trim();
    if (!initials) found.initials = "Inițialele sunt obligatorii.";
    else if (initials.length > 4) found.initials = "Maximum 4 caractere.";

    const email = form.email.trim();
    if (!email) found.email = "E-mailul este obligatoriu.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      found.email = "Adresa nu pare validă.";

    if (!form.roleRo.trim()) found.roleRo = "Rolul în română este obligatoriu.";
    if (!form.bioRo.trim()) found.bioRo = "Biografia în română este obligatorie.";
    else if (form.bioRo.trim().length > 4000) found.bioRo = "Maximum 4 000 de caractere.";
    if (form.bioRu.trim().length > 4000) found.bioRu = "Maximum 4 000 de caractere.";

    return found;
  }

  async function save() {
    if (saving || editing === undefined) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Formularul are câmpuri de corectat.");
      return;
    }

    const payload: Record<string, unknown> = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      initials: form.initials.trim(),
      email: form.email.trim().toLowerCase(),
      roleRo: form.roleRo.trim(),
      bioRo: form.bioRo.trim(),
    };
    const roleRu = form.roleRu.trim();
    const bioRu = form.bioRu.trim();
    if (roleRu) payload.roleRu = roleRu;
    if (bioRu) payload.bioRu = bioRu;

    setSaving(true);
    try {
      const saved = editing
        ? await adminFetch<AdminAuthorDto>(`/admin/authors/${editing.id}`, {
            method: "PUT",
            body: payload,
          })
        : await adminFetch<AdminAuthorDto>("/admin/authors", {
            method: "POST",
            body: payload,
          });
      toast.ok(editing ? "Autor actualizat." : "Autor adăugat.", saved.name);
      setEditing(undefined);
      void revalidateSite();
      await load();
    } catch (caught) {
      const message = errorMessage(caught, "Salvarea a eșuat.");
      setErrors((current) => ({ ...current, general: message }));
      toast.error("Salvarea a eșuat.", message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await adminFetch(`/admin/authors/${pendingDelete.id}`, { method: "DELETE" });
      toast.ok("Autor șters.", pendingDelete.name);
      setPendingDelete(null);
      void revalidateSite();
      await load();
    } catch (caught) {
      toast.error("Ștergerea a eșuat.", errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHead
        kicker="Semnături"
        title="Autori"
        description="Fiecare material poartă un nume, un rol și o biografie verificabilă — baza încrederii editoriale."
        action={
          <Button variant="gold" onClick={() => openEditor(null)}>
            + Autor nou
          </Button>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} onRetry={() => void load()} />
        </div>
      ) : null}

      <Panel>
        {loading && authors.length === 0 ? (
          <LoadingRows rows={5} />
        ) : authors.length === 0 ? (
          <EmptyState
            title="Niciun autor"
            message="Adaugă prima semnătură a redacției."
            action={
              <Button variant="gold" onClick={() => openEditor(null)}>
                + Autor nou
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {authors.map((author) => (
              <li
                key={author.id}
                className="flex flex-wrap items-start gap-4 px-4 py-4 transition-colors duration-200 hover:bg-coal-2/40 sm:px-5"
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center border border-gold/40 bg-gold/8 font-display text-sm font-semibold tracking-wide text-gold"
                >
                  {author.initials}
                </span>

                <div className="min-w-0 flex-1 basis-64">
                  <p className="font-display text-base leading-tight text-ivory">
                    {author.name}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] text-fog">{author.roleRo}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-mist">
                    <span className="font-mono">/{author.slug}</span>
                    <span>{author.email}</span>
                    {typeof author.articleCount === "number" ? (
                      <span>
                        {author.articleCount === 1
                          ? "1 articol"
                          : author.articleCount < 20
                            ? `${author.articleCount} articole`
                            : `${author.articleCount} de articole`}
                      </span>
                    ) : null}
                  </p>
                  {author.bioRo ? (
                    <p className="clamp-2 mt-2 max-w-2xl text-[0.8125rem] leading-relaxed text-mist">
                      {author.bioRo}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/ro/autor/${author.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-mist transition-colors hover:text-gold"
                  >
                    Vezi
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => openEditor(author)}>
                    Editează
                  </Button>
                  <Button
                    size="sm"
                    variant="quiet"
                    className="text-mist hover:text-ember"
                    onClick={() => setPendingDelete(author)}
                  >
                    Șterge
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* -------------------------------------------------------------- */}
      {/* Editor                                                          */}
      {/* -------------------------------------------------------------- */}
      {editing !== undefined ? (
        <Modal
          open
          onClose={requestClose}
          busy={saving}
          size="lg"
          kicker={editing ? `Autor #${editing.id}` : "Semnătură nouă"}
          title={editing ? editing.name : "Adaugă un autor"}
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
              <Button
                variant="ghost"
                onClick={requestClose}
                disabled={saving}
              >
                Renunță
              </Button>
              <Button variant="gold" loading={saving} onClick={() => void save()}>
                {editing ? "Salvează" : "Creează autorul"}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Field label="Nume complet" htmlFor="author-name" required error={errors.name}>
                <TextInput
                  id="author-name"
                  value={form.name}
                  invalid={Boolean(errors.name)}
                  onChange={(event) => onNameChange(event.target.value)}
                  placeholder="Ana Corbeanu"
                />
              </Field>
              <Field label="Inițiale" htmlFor="author-initials" required error={errors.initials}>
                <TextInput
                  id="author-initials"
                  value={form.initials}
                  maxLength={4}
                  invalid={Boolean(errors.initials)}
                  onChange={(event) =>
                    patch({ initials: event.target.value, initialsTouched: true })
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Slug"
                htmlFor="author-slug"
                required
                error={errors.slug}
                hint="Se generează din nume, transliterat."
              >
                <TextInput
                  id="author-slug"
                  mono
                  spellCheck={false}
                  value={form.slug}
                  invalid={Boolean(errors.slug)}
                  onChange={(event) =>
                    patch({ slug: event.target.value, slugTouched: true })
                  }
                />
              </Field>
              <Field label="E-mail public" htmlFor="author-email" required error={errors.email}>
                <TextInput
                  id="author-email"
                  type="email"
                  spellCheck={false}
                  value={form.email}
                  invalid={Boolean(errors.email)}
                  onChange={(event) => patch({ email: event.target.value })}
                  placeholder="ana@corbul.md"
                />
              </Field>
            </div>

            <div className="grid gap-5 border-t border-line pt-5 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <p className="kicker">Română</p>
                <Field label="Rol (RO)" htmlFor="author-roleRo" required error={errors.roleRo}>
                  <TextInput
                    id="author-roleRo"
                    value={form.roleRo}
                    invalid={Boolean(errors.roleRo)}
                    onChange={(event) => patch({ roleRo: event.target.value })}
                    placeholder="Reporter de investigație"
                  />
                </Field>
                <Field label="Biografie (RO)" htmlFor="author-bioRo" required error={errors.bioRo}>
                  <TextArea
                    id="author-bioRo"
                    rows={7}
                    value={form.bioRo}
                    invalid={Boolean(errors.bioRo)}
                    onChange={(event) => patch({ bioRo: event.target.value })}
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-4">
                <p className="kicker">Русский</p>
                <Field
                  label="Роль (RU)"
                  htmlFor="author-roleRu"
                  error={errors.roleRu}
                  hint="Gol = se preia varianta română."
                >
                  <TextInput
                    id="author-roleRu"
                    value={form.roleRu}
                    onChange={(event) => patch({ roleRu: event.target.value })}
                    placeholder="Репортёр-расследователь"
                  />
                </Field>
                <Field label="Биография (RU)" htmlFor="author-bioRu" error={errors.bioRu}>
                  <TextArea
                    id="author-bioRu"
                    rows={7}
                    value={form.bioRu}
                    invalid={Boolean(errors.bioRu)}
                    onChange={(event) => patch({ bioRu: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Protecția conținutului nesalvat din editor */}
      <ConfirmDialog
        open={discardOpen}
        kicker="Modificări nesalvate"
        title="Renunți la modificări?"
        message="Datele introduse în acest formular nu au fost salvate și se vor pierde."
        confirmLabel="Renunță la modificări"
        cancelLabel="Continuă editarea"
        onConfirm={() => {
          setDiscardOpen(false);
          setEditing(undefined);
        }}
        onCancel={() => setDiscardOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        kicker="Operațiune ireversibilă"
        title="Ștergi autorul?"
        message={
          <>
            <strong className="text-ivory">{pendingDelete?.name}</strong> va fi
            eliminat din redacție. Autorii care au articole publicate nu pot fi
            șterși — mută întâi materialele către altă semnătură.
          </>
        }
        confirmLabel="Șterge autorul"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
