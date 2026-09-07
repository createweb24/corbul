"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { cn } from "./cn";
import { microcopy } from "./microcopy";
import { useFocusTrap } from "./useFocusTrap";
import type { Locale } from "@/lib/types";

/**
 * Fereastră modală — singura formă de dialog din proiect: `alert`, `confirm`
 * și `prompt` sunt interzise (SPEC §9).
 *
 * Escape închide, clicul pe fundal închide, derularea paginii se blochează cât
 * timp e deschisă, focusul intră în panou și e prins înăuntru (Tab ciclează).
 */

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** zona de acțiuni, lipită jos */
  footer?: ReactNode;
  size?: ModalSize;
  closeLabel?: string;
  hideClose?: boolean;
  /** dezactivează închiderea prin fundal/Escape (operațiuni în curs) */
  persistent?: boolean;
  className?: string;
  locale?: Locale;
}

const SIZES: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeLabel,
  hideClose = false,
  persistent = false,
  className,
  locale = "ro",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const copy = microcopy(locale);

  useEffect(() => {
    setMounted(true);
  }, []);

  const requestClose = useCallback(() => {
    if (!persistent) onClose();
  }, [onClose, persistent]);

  // capcana de focus (intrare, ciclare Tab, revenire la închidere)
  useFocusTrap(panelRef, open);

  // Escape
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      requestClose();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, requestClose]);

  // blocarea derulării paginii din spate
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const labelId = title ? "corbul-modal-title" : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6"
      role="presentation"
    >
      <div
        aria-hidden="true"
        onClick={requestClose}
        className="animate-fade fixed inset-0 bg-obsidian/82 backdrop-blur-[3px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        className={cn(
          "animate-rise relative z-10 flex w-full flex-col",
          "max-h-[92dvh] overflow-hidden border border-line-2 bg-coal shadow-panel",
          "rounded-t-[var(--radius)] sm:rounded-[var(--radius)]",
          SIZES[size],
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-gold via-gold/30 to-transparent"
        />

        {title || !hideClose ? (
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {title ? (
                <h2
                  id={labelId}
                  className="headline text-lg leading-snug sm:text-xl"
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-fog">
                  {description}
                </p>
              ) : null}
            </div>

            {hideClose ? null : (
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel ?? copy.close}
                className="-mt-1 -mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] border border-transparent text-mist transition-colors duration-200 hover:border-line-2 hover:bg-coal-2 hover:text-gold"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="square" />
                </svg>
              </button>
            )}
          </header>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-coal-2/60 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "gold" | "danger";
  loading?: boolean;
  locale?: Locale;
}

/** Confirmare de acțiune distructivă — înlocuiește `window.confirm`. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  loading = false,
  locale = "ro",
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      locale={locale}
      persistent={loading}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message ? (
        <p className="text-[0.9375rem] leading-relaxed text-fog">{message}</p>
      ) : null}
    </Modal>
  );
}

export default Modal;
