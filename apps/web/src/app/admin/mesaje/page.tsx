"use client";

/**
 * `/admin/mesaje` — corespondența redacției (SPEC §9):
 * mesajele din formularul de contact și cele trimise anonim.
 * Marcarea ca tratat și ștergerea trec doar prin Modal + Toast.
 */

import { useCallback, useEffect, useState } from "react";
import { formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/components/ui/cn";
import type { MessageDto, MessageKind } from "@/lib/types";
import { ConfirmDialog } from "../_components/Modal";
import { useToast } from "../_components/toast";
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  LoadingRows,
  PageHead,
  Panel,
  Select,
  TextInput,
} from "../_components/ui";
import { adminFetch, errorMessage } from "../_lib/session";
import { qs } from "@/lib/api";

type HandledFilter = "" | "true" | "false";

const KIND_LABEL: Record<MessageKind, string> = {
  contact: "Contact",
  tip: "Mesaj securizat",
};

export default function MesajePage() {
  const toast = useToast();

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<"" | MessageKind>("");
  const [handled, setHandled] = useState<HandledFilter>("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const [pendingDelete, setPendingDelete] = useState<MessageDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adminFetch<MessageDto[]>(
        `/admin/messages${qs({
          kind: kind || undefined,
          handled: handled || undefined,
          q: debounced || undefined,
          limit: 200,
        })}`,
      );
      setMessages(rows);
    } catch (caught) {
      setError(errorMessage(caught, "Mesajele nu au putut fi încărcate."));
    } finally {
      setLoading(false);
    }
  }, [kind, handled, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleHandled(message: MessageDto) {
    const next = !message.handled;
    setBusy(message.id);
    try {
      const saved = await adminFetch<MessageDto>(`/admin/messages/${message.id}`, {
        method: "PATCH",
        body: { handled: next },
      });
      setMessages((current) =>
        current.map((row) => (row.id === saved.id ? saved : row)),
      );
      toast.ok(next ? "Mesaj marcat ca tratat." : "Mesaj redeschis.");
    } catch (caught) {
      toast.error("Marcajul nu a fost salvat.", errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await adminFetch(`/admin/messages/${pendingDelete.id}`, { method: "DELETE" });
      setMessages((current) =>
        current.filter((row) => row.id !== pendingDelete.id),
      );
      toast.ok("Mesaj șters.");
      setPendingDelete(null);
    } catch (caught) {
      toast.error("Ștergerea a eșuat.", errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  }

  const unread = messages.filter((message) => !message.handled).length;

  return (
    <>
      <PageHead
        kicker="Corespondență"
        title="Mesaje primite"
        description="Sesizările primite prin formularul de contact și mesajele securizate trimise anonim de cititori. Tratează-le și marchează-le."
        action={
          unread > 0 ? (
            <Badge tone="warn">{unread} netratate</Badge>
          ) : (
            <Badge tone="ok">Toate tratate</Badge>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <TextInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Caută în subiect, expeditor sau text…"
            aria-label="Caută mesaje"
          />
        </div>
        <div className="w-44">
          <Select
            value={kind}
            aria-label="Tipul mesajului"
            onChange={(event) => setKind(event.target.value as "" | MessageKind)}
          >
            <option value="">Toate tipurile</option>
            <option value="contact">Contact</option>
            <option value="tip">Mesaje securizate</option>
          </Select>
        </div>
        <div className="w-44">
          <Select
            value={handled}
            aria-label="Starea mesajului"
            onChange={(event) => setHandled(event.target.value as HandledFilter)}
          >
            <option value="">Toate stările</option>
            <option value="false">Netratate</option>
            <option value="true">Tratate</option>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} onRetry={() => void load()} />
        </div>
      ) : null}

      <Panel>
        {loading && messages.length === 0 ? (
          <LoadingRows rows={5} />
        ) : messages.length === 0 ? (
          <EmptyState
            title="Nicio corespondență"
            message={
              kind || handled || debounced
                ? "Niciun mesaj nu corespunde filtrelor alese."
                : "Formularul de contact și caseta securizată sunt încă tăcute."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "px-4 py-4 transition-colors duration-200 sm:px-5",
                  message.handled ? "opacity-70" : "bg-coal",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 basis-72">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={message.kind === "tip" ? "gold" : "neutral"}>
                        {KIND_LABEL[message.kind]}
                      </Badge>
                      {message.handled ? (
                        <Badge tone="ok">Tratat</Badge>
                      ) : (
                        <Badge tone="warn">Netratat</Badge>
                      )}
                      <time
                        dateTime={message.createdAt}
                        title={formatDateTime(message.createdAt, "ro")}
                        className="meta"
                      >
                        {timeAgo(message.createdAt, "ro")}
                      </time>
                    </div>

                    <p className="mt-2 font-display text-base leading-snug text-ivory">
                      {message.subject?.trim() ||
                        (message.kind === "tip"
                          ? "Mesaj fără subiect"
                          : "Mesaj fără subiect")}
                    </p>

                    <p className="mt-1 text-[0.6875rem] text-mist">
                      {message.name?.trim() || "Expeditor anonim"}
                      {message.email ? (
                        <>
                          {" · "}
                          <a href={`mailto:${message.email}`} className="link-gold">
                            {message.email}
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant={message.handled ? "quiet" : "ghost"}
                      disabled={busy === message.id}
                      onClick={() => void toggleHandled(message)}
                    >
                      {message.handled ? "Redeschide" : "Marchează tratat"}
                    </Button>
                    <Button
                      size="sm"
                      variant="quiet"
                      className="text-mist hover:text-ember"
                      onClick={() => setPendingDelete(message)}
                      aria-label="Șterge mesajul"
                    >
                      Șterge
                    </Button>
                  </div>
                </div>

                <p className="mt-3 max-w-3xl whitespace-pre-wrap border-l border-line pl-4 font-serif text-[0.9375rem] leading-relaxed text-fog">
                  {message.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ConfirmDialog
        open={pendingDelete !== null}
        kicker="Operațiune ireversibilă"
        title="Ștergi mesajul?"
        message="Mesajul dispare definitiv din baza de date. Dacă e un pont pe care încă îl verifici, marchează-l ca tratat în loc să-l ștergi."
        confirmLabel="Șterge mesajul"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
