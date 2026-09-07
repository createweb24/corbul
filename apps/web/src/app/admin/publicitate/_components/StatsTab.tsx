"use client";

/**
 * Fila „Statistici" — afișări și clicuri pe zile, cu totaluri, CTR și bare CSS.
 * Sursa este `GET /api/admin/ads/stats?campaignId=&days=`; datele lipsă nu
 * lasă tabelul gol fără explicație, ci o stare vizibilă de eroare cu reluare.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { qs } from "@/lib/api";
import { formatDateShort, formatNumber } from "@/lib/format";
import {
  Button,
  EmptyState,
  ErrorNote,
  LoadingRows,
  Panel,
  PanelHead,
  Select,
} from "../../_components/ui";
import { adminFetch, errorMessage } from "../../_lib/session";
import { formatCtr } from "../_lib/labels";
import { toStatRows } from "../_lib/normalize";
import type { AdStatRowDto } from "../_lib/types";
import type { AdsStore } from "../_lib/store";
import { StatCell, TableScroll, Th } from "./bits";

const RANGES = [7, 30, 90] as const;

interface Bucket {
  key: string;
  label: string;
  impressions: number;
  clicks: number;
}

export function StatsTab({ store }: { store: AdsStore }) {
  const { campaigns } = store;

  const [campaignId, setCampaignId] = useState("");
  const [days, setDays] = useState<number>(30);
  const [rows, setRows] = useState<AdStatRowDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await adminFetch<unknown>(
        `/admin/ads/stats${qs({ campaignId: campaignId || undefined, days })}`,
      );
      setRows(toStatRows(raw));
    } catch (caught) {
      setError(errorMessage(caught, "Statisticile nu au putut fi încărcate."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    let impressions = 0;
    let clicks = 0;
    for (const row of rows) {
      impressions += row.impressions;
      clicks += row.clicks;
    }
    return { impressions, clicks };
  }, [rows]);

  const byDay = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    for (const row of rows) {
      const bucket = map.get(row.date) ?? {
        key: row.date,
        label: formatDateShort(`${row.date}T12:00:00.000Z`, "ro"),
        impressions: 0,
        clicks: 0,
      };
      bucket.impressions += row.impressions;
      bucket.clicks += row.clicks;
      map.set(row.date, bucket);
    }
    return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
  }, [rows]);

  const byBanner = useMemo<Bucket[]>(() => {
    const map = new Map<number, Bucket>();
    for (const row of rows) {
      const bucket = map.get(row.bannerId) ?? {
        key: String(row.bannerId),
        label: row.bannerName,
        impressions: 0,
        clicks: 0,
      };
      bucket.impressions += row.impressions;
      bucket.clicks += row.clicks;
      map.set(row.bannerId, bucket);
    }
    return [...map.values()].sort((a, b) => b.impressions - a.impressions);
  }, [rows]);

  const maxDayImpressions = Math.max(1, ...byDay.map((bucket) => bucket.impressions));
  const maxBannerImpressions = Math.max(
    1,
    ...byBanner.map((bucket) => bucket.impressions),
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-60">
          <Select
            value={campaignId}
            aria-label="Filtrează după campanie"
            onChange={(event) => setCampaignId(event.target.value)}
          >
            <option value="">Toate campaniile</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select
            value={String(days)}
            aria-label="Perioada"
            onChange={(event) => setDays(Number(event.target.value))}
          >
            {RANGES.map((range) => (
              <option key={range} value={range}>
                Ultimele {range} zile
              </option>
            ))}
          </Select>
        </div>
        <Button variant="ghost" loading={loading} onClick={() => void load()}>
          Reîmprospătează
        </Button>
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} onRetry={() => void load()} />
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        <StatCell
          label="Afișări"
          value={formatNumber(totals.impressions, "ro")}
          note={`ultimele ${days} zile`}
          loading={loading}
        />
        <StatCell
          label="Clicuri"
          value={formatNumber(totals.clicks, "ro")}
          note="pe toate bannerele din selecție"
          loading={loading}
        />
        <StatCell
          label="CTR"
          value={formatCtr(totals.clicks, totals.impressions)}
          note="clicuri / afișări"
          accent
          loading={loading}
        />
        <StatCell
          label="Zile cu date"
          value={formatNumber(byDay.length, "ro")}
          note={`${byBanner.length} bannere cu activitate`}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHead kicker="Evoluție" title="Pe zile" />
          {loading && byDay.length === 0 ? (
            <LoadingRows rows={6} />
          ) : byDay.length === 0 ? (
            <EmptyState
              title="Nicio afișare înregistrată"
              message="Statisticile apar după ce site-ul servește primul banner din perioada aleasă."
            />
          ) : (
            <TableScroll minWidth="min-w-[34rem]">
              <thead>
                <tr className="border-b border-line-2">
                  <Th>Ziua</Th>
                  <Th align="right">Afișări</Th>
                  <Th align="right">Clicuri</Th>
                  <Th align="right">CTR</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byDay.map((bucket) => (
                  <tr key={bucket.key} className="transition-colors hover:bg-coal-2/40">
                    <td className="px-3 py-2.5">
                      <p className="text-[0.8125rem] tabular text-ivory">
                        {bucket.label}
                      </p>
                      <span
                        aria-hidden="true"
                        className="mt-1.5 block h-1 w-full bg-coal-2"
                      >
                        <span
                          className="block h-full bg-gold/70 transition-[width] duration-500"
                          style={{
                            width: `${Math.max(
                              2,
                              Math.round(
                                (bucket.impressions / maxDayImpressions) * 100,
                              ),
                            )}%`,
                          }}
                        />
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[0.8125rem] tabular text-fog">
                      {formatNumber(bucket.impressions, "ro")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[0.8125rem] tabular text-fog">
                      {formatNumber(bucket.clicks, "ro")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[0.8125rem] tabular text-gold">
                      {formatCtr(bucket.clicks, bucket.impressions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          )}
        </Panel>

        <Panel>
          <PanelHead kicker="Clasament" title="Pe bannere" />
          {loading && byBanner.length === 0 ? (
            <LoadingRows rows={5} />
          ) : byBanner.length === 0 ? (
            <EmptyState
              title="Niciun banner cu activitate"
              message="Alege altă perioadă sau altă campanie."
            />
          ) : (
            <ul className="flex flex-col gap-3 px-4 py-5 sm:px-5">
              {byBanner.map((bucket) => (
                <li key={bucket.key} className="grid grid-cols-[1fr_auto] gap-x-3">
                  <p className="truncate text-[0.8125rem] text-ivory" title={bucket.label}>
                    {bucket.label}
                  </p>
                  <p className="text-[0.8125rem] tabular text-fog">
                    {formatNumber(bucket.impressions, "ro")} ·{" "}
                    <span className="text-gold">
                      {formatCtr(bucket.clicks, bucket.impressions)}
                    </span>
                  </p>
                  <span
                    aria-hidden="true"
                    className="col-span-2 mt-1.5 block h-1 bg-coal-2"
                  >
                    <span
                      className="block h-full bg-gold/70 transition-[width] duration-500"
                      style={{
                        width: `${Math.max(
                          2,
                          Math.round(
                            (bucket.impressions / maxBannerImpressions) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </span>
                  <p className="col-span-2 mt-1 text-[0.6875rem] text-mist">
                    {formatNumber(bucket.clicks, "ro")}{" "}
                    {bucket.clicks === 1 ? "clic" : "clicuri"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
