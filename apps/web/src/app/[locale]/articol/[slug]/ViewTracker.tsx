"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import type { ViewCountDto } from "@/lib/types";

/**
 * Înregistrează o vizualizare, o singură dată pe articol și pe sesiune.
 * Nu randează nimic și nu afectează niciodată randarea paginii: orice
 * eroare de rețea este ignorată în tăcere.
 */
export default function ViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const key = `corbul_view_${slug}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage indisponibil (mod privat) — numărăm oricum o dată
    }

    void apiFetch<ViewCountDto>(`/articles/${slug}/view`, {
      method: "POST",
    }).catch(() => {
      /* ignorat intenționat */
    });
  }, [slug]);

  return null;
}
