"use client";

/**
 * `/admin/abonati` — cele două surse de venit (SPEC §1, §9):
 * abonamentele Premium venite prin Stripe și parteneriatele B2B, cu
 * schimbarea stării unui pachet direct din tabel.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { formatDateShort, formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/components/ui/cn";
import type {
  PartnerDto,
  PartnerStatus,
  PartnerTier,
  SubscriberDto,
  SubscriberStatus,
} from "@/lib/types";
import { useToast } from "../_components/toast";
import {
  Badge,
  EmptyState,
  ErrorNote,
  LoadingRows,
  PageHead,
  Panel,
  PanelHead,
  Select,
  TextInput,
  type BadgeTone,
} from "../_components/ui";
import { adminFetch, errorMessage, revalidateSite } from "../_lib/session";
import { qs } from "@/lib/api";

const SUBSCRIBER_STATUSES: SubscriberStatus[] = [
  "active",
  "pending",
  "past_due",
  "canceled",
];

const SUBSCRIBER_LABEL: Record<SubscriberStatus, string> = {
  active: "activ",
  pending: "în așteptare",
  past_due: "restanță",
  canceled: "anulat",
};

const SUBSCRIBER_TONE: Record<SubscriberStatus, BadgeTone> = {
  active: "ok",
  pending: "warn",
  past_due: "danger",
  canceled: "neutral",
};

const PARTNER_STATUSES: PartnerStatus[] = ["pending", "paid", "active", "expired"];

const PARTNER_LABEL: Record<PartnerStatus, string> = {
  pending: "în așteptare",
  paid: "plătit",
  active: "activ",
  expired: "expirat",
};

const PARTNER_TONE: Record<PartnerStatus, BadgeTone> = {
  pending: "warn",
  paid: "gold",
  active: "ok",
  expired: "neutral",
};

const TIER_LABEL: Record<PartnerTier, string> = {
  bronze: "Bronz",
  silver: "Argint",
  gold: "Aur",
};

const PLAN_LABEL: Record<string, string> = {
  monthly: "lunar",
  annual: "anual",
};

export default function AbonatiPage() {
  const toast = useToast();

  const [subscribers, setSubscribers] = useState<SubscriberDto[]>([]);
  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subscriberStatus, setSubscriberStatus] = useState<"" | SubscriberStatus>("");
  const [partnerStatus, setPartnerStatus] = useState<"" | PartnerStatus>("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busyPartner, setBusyPartner] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subscriberRows, partnerRows] = await Promise.all([
        adminFetch<SubscriberDto[]>(
          `/admin/subscribers${qs({
            status: subscriberStatus || undefined,
            q: debounced || undefined,
            limit: 200,
          })}`,
        ),
        adminFetch<PartnerDto[]>(
          `/admin/partners${qs({
            status: partnerStatus || undefined,
            q: debounced || undefined,
            limit: 200,
          })}`,
        ),
      ]);
      setSubscribers(subscriberRows);
      setPartners(partnerRows);
    } catch (caught) {
      setError(errorMessage(caught, "Datele nu au putut fi încărcate."));
    } finally {
      setLoading(false);
    }
  }, [subscriberStatus, partnerStatus, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changePartnerStatus(partner: PartnerDto, status: PartnerStatus) {
    if (status === partner.status) return;
    setBusyPartner(partner.id);
    try {
      const saved = await adminFetch<PartnerDto>(`/admin/partners/${partner.id}`, {
        method: "PATCH",
        body: { status },
      });
      setPartners((current) =>
        current.map((row) => (row.id === saved.id ? saved : row)),
      );
      toast.ok("Starea parteneriatului a fost schimbată.", `${partner.company} · ${PARTNER_LABEL[status]}`);
      // Partenerii activi apar pe site („Susținut de”) — invalidăm cache-ul.
      void revalidateSite();
    } catch (caught) {
      toast.error("Schimbarea stării a eșuat.", errorMessage(caught));
    } finally {
      setBusyPartner(null);
    }
  }

  const activeSubscribers = subscribers.filter((row) => row.status === "active").length;
  const activePartners = partners.filter((row) => row.status === "active").length;
  const partnerRevenue = partners
    .filter((row) => row.status === "active" || row.status === "paid")
    .reduce((sum, row) => sum + row.amountMdl, 0);

  return (
    <>
      <PageHead
        kicker="Venituri"
        title="Abonați și parteneri"
        description="Abonamentele Corbul Premium și pachetele de sponsorizare B2B, cu starea lor curentă în Stripe."
      />

      {/* Rezumat */}
      <div className="mb-5 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        <Summary label="Abonați activi" value={formatNumber(activeSubscribers, "ro")} />
        <Summary label="Total abonați" value={formatNumber(subscribers.length, "ro")} />
        <Summary label="Parteneri activi" value={formatNumber(activePartners, "ro")} />
        <Summary
          label="Încasat din parteneriate"
          value={formatMoney(partnerRevenue, "ro", "MDL")}
          accent
        />
      </div>

      {/* Filtre */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <TextInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Caută după e-mail sau companie…"
            aria-label="Caută abonați și parteneri"
          />
        </div>
        <div className="w-48">
          <Select
            value={subscriberStatus}
            aria-label="Starea abonaților"
            onChange={(event) =>
              setSubscriberStatus(event.target.value as "" | SubscriberStatus)
            }
          >
            <option value="">Abonați: toate stările</option>
            {SUBSCRIBER_STATUSES.map((status) => (
              <option key={status} value={status}>
                Abonați: {SUBSCRIBER_LABEL[status]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <Select
            value={partnerStatus}
            aria-label="Starea parteneriatelor"
            onChange={(event) =>
              setPartnerStatus(event.target.value as "" | PartnerStatus)
            }
          >
            <option value="">Parteneri: toate stările</option>
            {PARTNER_STATUSES.map((status) => (
              <option key={status} value={status}>
                Parteneri: {PARTNER_LABEL[status]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} onRetry={() => void load()} />
        </div>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* Abonați Premium                                               */}
      {/* ------------------------------------------------------------ */}
      <Panel className="mb-6">
        <PanelHead
          kicker="Corbul Premium"
          title="Abonați"
          action={
            <span className="meta">
              {subscribers.length} {subscribers.length === 1 ? "abonat" : "abonați"}
            </span>
          }
        />
        {loading && subscribers.length === 0 ? (
          <LoadingRows rows={4} />
        ) : subscribers.length === 0 ? (
          <EmptyState
            title="Niciun abonat"
            message="Abonamentele apar aici imediat ce Stripe confirmă o plată."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-2">
                  <Th>E-mail</Th>
                  <Th>Plan</Th>
                  <Th>Stare</Th>
                  <Th align="right">Valabil până la</Th>
                  <Th align="right">Înregistrat</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="transition-colors hover:bg-coal-2/40">
                    <td className="px-3 py-3 text-[0.8125rem] text-ivory">
                      {subscriber.email}
                    </td>
                    <td className="px-3 py-3 text-[0.8125rem] text-fog">
                      {subscriber.plan ? PLAN_LABEL[subscriber.plan] : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={SUBSCRIBER_TONE[subscriber.status]}>
                        {SUBSCRIBER_LABEL[subscriber.status]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-[0.8125rem] tabular text-fog">
                      {subscriber.currentPeriodEnd
                        ? formatDateShort(subscriber.currentPeriodEnd, "ro")
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-[0.8125rem] tabular text-mist">
                      {formatDateShort(subscriber.createdAt, "ro")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ------------------------------------------------------------ */}
      {/* Parteneri B2B                                                 */}
      {/* ------------------------------------------------------------ */}
      <Panel>
        <PanelHead
          kicker="Parteneriate B2B"
          title="Sponsori"
          action={
            <span className="meta">
              {partners.length} {partners.length === 1 ? "pachet" : "pachete"}
            </span>
          }
        />
        {loading && partners.length === 0 ? (
          <LoadingRows rows={4} />
        ) : partners.length === 0 ? (
          <EmptyState
            title="Niciun parteneriat"
            message="Pachetele cumpărate din pagina de abonament apar aici."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-2">
                  <Th>Companie</Th>
                  <Th>Pachet</Th>
                  <Th align="right">Sumă</Th>
                  <Th align="right">Perioadă</Th>
                  <Th>Stare</Th>
                  <Th align="right">Acțiune</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {partners.map((partner) => (
                  <tr key={partner.id} className="align-top transition-colors hover:bg-coal-2/40">
                    <td className="px-3 py-3">
                      <p className="text-[0.8125rem] font-semibold text-ivory">
                        {partner.company}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-mist">
                        {partner.contactName} · {partner.email}
                      </p>
                      {partner.websiteUrl ? (
                        <a
                          href={partner.websiteUrl}
                          target="_blank"
                          rel="noreferrer nofollow"
                          className="link-gold mt-0.5 block truncate text-[0.6875rem]"
                        >
                          {partner.websiteUrl}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={partner.tier === "gold" ? "gold" : "neutral"}>
                        {TIER_LABEL[partner.tier]}
                      </Badge>
                      <p className="mt-1 text-[0.6875rem] text-mist">
                        {partner.months}{" "}
                        {partner.months === 1 ? "lună" : partner.months < 20 ? "luni" : "de luni"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-[0.8125rem] tabular text-ivory">
                      {formatMoney(partner.amountMdl, "ro", "MDL")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-[0.75rem] tabular text-fog">
                      {partner.startsAt ? formatDateShort(partner.startsAt, "ro") : "—"}
                      {" → "}
                      {partner.endsAt ? formatDateShort(partner.endsAt, "ro") : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={PARTNER_TONE[partner.status]}>
                        {PARTNER_LABEL[partner.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className={cn("ml-auto w-40", busyPartner === partner.id && "opacity-50")}>
                        <Select
                          value={partner.status}
                          aria-label={`Starea parteneriatului ${partner.company}`}
                          disabled={busyPartner === partner.id}
                          onChange={(event) =>
                            void changePartnerStatus(
                              partner,
                              event.target.value as PartnerStatus,
                            )
                          }
                        >
                          {PARTNER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {PARTNER_LABEL[status]}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Th({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-2.5 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-mist",
        align === "right" && "text-right",
      )}
    >
      {children}
    </th>
  );
}

function Summary({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-coal px-4 py-4">
      <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-mist">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-xl leading-none tabular sm:text-2xl",
          accent ? "text-gold" : "text-ivory",
        )}
      >
        {value}
      </p>
    </div>
  );
}
