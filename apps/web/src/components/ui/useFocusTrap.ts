"use client";

import { useEffect, type RefObject } from "react";

/**
 * Capcană de focus pentru straturile modale (`Modal`, panoul mobil al
 * navigației): cât timp `active` e true, focusul intră în container,
 * Tab / Shift+Tab ciclează doar printre elementele focusabile dinăuntru,
 * iar la dezactivare focusul revine pe elementul care era activ înainte.
 *
 * Nu tratează Escape: fiecare strat decide singur cum se închide.
 */

export const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface FocusTrapOptions {
  /** elementul care primește focusul la deschidere (implicit: primul focusabil, apoi containerul) */
  initialFocus?: RefObject<HTMLElement | null>;
  /** readuce focusul pe elementul activ anterior la închidere (implicit true) */
  restoreFocus?: boolean;
}

function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((item) => item.offsetParent !== null || item === container);
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options: FocusTrapOptions = {},
): void {
  const { initialFocus, restoreFocus = true } = options;

  useEffect(() => {
    if (!active) return;

    const previouslyActive =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // focusul intră în strat după ce React a terminat de desenat
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const target =
        initialFocus?.current ??
        container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
        container;
      target.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;

      const items = focusableIn(container);
      if (items.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const inside = current instanceof Node && container.contains(current);

      if (event.shiftKey) {
        if (!inside || current === first || current === container) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inside || current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      if (restoreFocus && previouslyActive?.isConnected) {
        previouslyActive.focus();
      }
    };
  }, [active, containerRef, initialFocus, restoreFocus]);
}

export default useFocusTrap;
