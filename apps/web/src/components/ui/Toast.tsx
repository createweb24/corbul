"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

/**
 * Notificări efemere. Împreună cu `Modal`, înlocuiesc complet `alert()` —
 * niciun dialog nativ în proiect (SPEC §9).
 *
 * Montare: `<ToastProvider>` în shell-ul public și în cel de administrare.
 * Folosire:
 *   const { toast, success, error } = useToast();
 *   success("Salvat", "Articolul a fost publicat.");
 *   toast({ title: "Ceva n-a mers", tone: "error", duration: 6000 });
 */

export type ToastTone = "ok" | "error" | "info" | "warn";

export interface ToastOptions {
  title?: string;
  description?: string;
  tone?: ToastTone;
  /** ms; 0 = rămâne până la închidere manuală */
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
  title: string;
  tone: ToastTone;
}

export interface ToastApi {
  toast: (input: string | ToastOptions, tone?: ToastTone) => string;
  /** alias pentru `toast` */
  push: (input: string | ToastOptions, tone?: ToastTone) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warn: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const NOOP: ToastApi = {
  toast: () => "",
  push: () => "",
  success: () => "",
  error: () => "",
  info: () => "",
  warn: () => "",
  dismiss: () => undefined,
  clear: () => undefined,
};

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Fără provider, API-ul e inert: o componentă precum `ShareRow` nu trebuie
 * să dea eroare doar pentru că a fost montată în afara shell-ului.
 */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP;
}

const DEFAULT_DURATION = 4500;

const TONE_STYLES: Record<ToastTone, { bar: string; icon: string }> = {
  ok: { bar: "bg-sage", icon: "text-sage" },
  error: { bar: "bg-ember", icon: "text-ember" },
  warn: { bar: "bg-gold-2", icon: "text-gold-2" },
  info: { bar: "bg-gold", icon: "text-gold" },
};

function ToneIcon({ tone }: { tone: ToastTone }) {
  const common = {
    viewBox: "0 0 24 24",
    className: cn("h-4 w-4 shrink-0", TONE_STYLES[tone].icon),
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    "aria-hidden": true,
    focusable: "false" as const,
  };

  if (tone === "ok") {
    return (
      <svg {...common}>
        <path d="M4 12.5l5 5L20 6.5" strokeLinecap="square" />
      </svg>
    );
  }
  if (tone === "error") {
    return (
      <svg {...common}>
        <path d="M12 7v6.5M12 17.2v.2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  if (tone === "warn") {
    return (
      <svg {...common}>
        <path d="M12 3.5 22 20H2L12 3.5Z" strokeLinejoin="round" />
        <path d="M12 9.5v4.2M12 17.2v.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.4v.2" strokeLinecap="round" />
    </svg>
  );
}

export interface ToastProviderProps {
  children?: ReactNode;
  /** poziția stivei; implicit jos-dreapta */
  position?: "bottom-right" | "bottom-center" | "top-right";
  closeLabel?: string;
}

export function ToastProvider({
  children,
  position = "bottom-right",
  closeLabel = "×",
}: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const counter = useRef(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    setMounted(true);
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    setItems([]);
  }, []);

  const toast = useCallback(
    (input: string | ToastOptions, tone?: ToastTone): string => {
      const options: ToastOptions =
        typeof input === "string" ? { title: input } : input;
      counter.current += 1;
      const id = `t${counter.current}`;
      const item: ToastItem = {
        id,
        title: options.title ?? "",
        description: options.description,
        tone: tone ?? options.tone ?? "info",
        duration: options.duration ?? DEFAULT_DURATION,
      };

      // maximum trei simultan — restul se scurg de jos
      setItems((current) => [...current.slice(-2), item]);

      if (item.duration && item.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), item.duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      push: toast,
      success: (title, description) =>
        toast({ title, description, tone: "ok" }),
      error: (title, description) =>
        toast({ title, description, tone: "error", duration: 6500 }),
      info: (title, description) => toast({ title, description, tone: "info" }),
      warn: (title, description) => toast({ title, description, tone: "warn" }),
      dismiss,
      clear,
    }),
    [toast, dismiss, clear],
  );

  const anchor =
    position === "bottom-center"
      ? "bottom-4 left-1/2 -translate-x-1/2 items-center"
      : position === "top-right"
        ? "top-4 right-4 items-end"
        : "bottom-4 right-4 items-end";

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted
        ? createPortal(
            <div
              aria-live="polite"
              aria-atomic="false"
              className={cn(
                "pointer-events-none fixed z-[200] flex max-w-[calc(100vw-2rem)] flex-col gap-2.5",
                anchor,
              )}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  role={item.tone === "error" ? "alert" : "status"}
                  className="animate-rise pointer-events-auto relative flex w-[min(23rem,calc(100vw-2rem))] gap-3 overflow-hidden rounded-[var(--radius)] border border-line-2 bg-coal py-3 pr-3 pl-4 shadow-panel"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-y-0 left-0 w-[2px]",
                      TONE_STYLES[item.tone].bar,
                    )}
                  />
                  <ToneIcon tone={item.tone} />

                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-[0.8125rem] leading-snug font-semibold text-ivory">
                      {item.title}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-[0.75rem] leading-relaxed text-fog">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => dismiss(item.id)}
                    aria-label={closeLabel}
                    className="-mt-0.5 h-6 w-6 shrink-0 rounded-[2px] text-mist transition-colors duration-200 hover:bg-coal-2 hover:text-gold"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="mx-auto h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="square" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
