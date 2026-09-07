"use client";

/**
 * Notificările panoului (SPEC §9: „fără alert(), confirm(), prompt()").
 *
 * Sursa este `ToastProvider` / `useToast` din design system-ul comun (A4);
 * acest modul e doar stratul de adaptare, ca paginile din admin să apeleze
 * un API scurt (`toast.ok` / `toast.error`) fără să depindă de forma exactă
 * a contextului comun.
 */

import { useMemo } from "react";
import { useToast as useBaseToast } from "@/components/ui/Toast";

export { ToastProvider } from "@/components/ui/Toast";

export interface AdminToastApi {
  ok: (title: string, detail?: string) => void;
  error: (title: string, detail?: string) => void;
  info: (title: string, detail?: string) => void;
  warn: (title: string, detail?: string) => void;
}

export function useToast(): AdminToastApi {
  const base = useBaseToast();
  return useMemo<AdminToastApi>(
    () => ({
      ok: (title, detail) => void base.success(title, detail),
      error: (title, detail) => void base.error(title, detail),
      info: (title, detail) => void base.info(title, detail),
      warn: (title, detail) => void base.warn(title, detail),
    }),
    [base],
  );
}
