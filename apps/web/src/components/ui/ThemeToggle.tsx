"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "./ThemeScript";

/**
 * Comutator temă luminoasă / întunecată.
 *
 * Ambele pictograme și ambele etichete se randează întotdeauna; CSS-ul
 * (`.theme-only-dark` / `.theme-only-light` din globals.css) arată perechea
 * potrivită, în funcție de `data-theme` de pe <html>. Astfel serverul poate
 * trimite același HTML indiferent de temă, deci nu există dezacord de
 * hidratare și butonul arată corect chiar înainte ca React să pornească.
 *
 * Preferința explicită se ține în localStorage. Cât timp cititorul nu a ales
 * nimic, tema urmează sistemul, inclusiv dacă acesta se schimbă în timpul
 * vizitei (trecerea automată zi/noapte a sistemului de operare).
 */

export type Theme = "light" | "dark";

export interface ThemeToggleProps {
  /** eticheta pentru „treci pe luminos" (citită de cititoarele de ecran) */
  labelToLight: string;
  /** eticheta pentru „treci pe întunecat" */
  labelToDark: string;
  className?: string;
}

/**
 * Tema în vigoare: alegerea explicită de pe <html>, iar în lipsa ei
 * preferința sistemului — exact ordinea pe care o aplică și CSS-ul.
 * Fără al doilea pas, primul clic ar părea că nu face nimic pentru un
 * cititor al cărui sistem e pe luminos.
 */
function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const chosen = document.documentElement.getAttribute("data-theme");
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeToggle({
  labelToLight,
  labelToDark,
  className,
}: ThemeToggleProps) {
  // `mounted` doar pentru aria-pressed: valoarea reală se citește din DOM,
  // pe care scriptul din <body> a stabilit-o deja înainte de hidratare.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  // fără alegere explicită, tema urmează sistemul și în timpul vizitei
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        stored = null;
      }
      if (stored === "light" || stored === "dark") return;
      const next: Theme = event.matches ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      setTheme(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === "light" ? "dark" : "light";
    const root = document.documentElement;

    // tranziție scurtă doar pe suprafețele mari, apoi se scoate, ca navigarea
    // ulterioară să nu tragă după ea animații de culoare
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", next);
    window.setTimeout(() => root.classList.remove("theme-switching"), 260);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // navigare privată sau stocare blocată: tema se aplică oricum pe sesiune
    }
    setTheme(next);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === "light"}
      className={[
        "group inline-flex items-center gap-1.5 text-mist transition-colors duration-200",
        "hover:text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold",
        className ?? "",
      ].join(" ")}
    >
      {/* soare — se vede în tema întunecată, unde apăsarea duce spre luminos */}
      <svg
        viewBox="0 0 24 24"
        width={15}
        height={15}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        aria-hidden="true"
        className="theme-only-dark"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6 6 18M18 6l1.6-1.6" />
      </svg>

      {/* lună — se vede în tema luminoasă */}
      <svg
        viewBox="0 0 24 24"
        width={15}
        height={15}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="theme-only-light"
      >
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
      </svg>

      <span className="sr-only theme-only-dark">{labelToLight}</span>
      <span className="sr-only theme-only-light">{labelToDark}</span>
    </button>
  );
}

export default ThemeToggle;
