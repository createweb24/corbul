"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/types";
import { cn } from "./cn";
import { microcopy } from "./microcopy";
import { useToast } from "./Toast";

/**
 * Bara de distribuire de sub articol: Facebook, X, Telegram și copierea
 * linkului. Iconițele sunt desenate aici (SPEC §0.6 — fără biblioteci).
 *
 * `url` poate fi relativ: adresa absolută se completează după montare, din
 * `window.location`, ca serverul și clientul să randeze identic.
 */

export interface ShareRowProps {
  /** adresa articolului; dacă e relativă, se completează la montare */
  url: string;
  title?: string;
  /** eticheta din stânga („Distribuie") */
  label?: string;
  locale?: Locale;
  className?: string;
  copyLabel?: string;
  copiedLabel?: string;
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.63c-.29-.04-1.27-.13-2.41-.13-2.39 0-4.03 1.46-4.03 4.14V9.9H7.5V13h2.76v8h3.24Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M17.2 3h3.06l-6.69 7.64L21.5 21h-6.16l-4.83-6.3L4.98 21H1.92l7.15-8.17L2.2 3h6.31l4.37 5.77L17.2 3Zm-1.07 16.15h1.7L7.95 4.75H6.13l10 14.4Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M21.6 4.3 2.9 11.5c-.9.35-.9 1.62.02 1.93l4.63 1.55 1.77 5.35c.24.7 1.14.86 1.6.29l2.5-3.07 4.66 3.42c.6.44 1.45.11 1.6-.62l3.2-15.1c.17-.79-.6-1.45-1.28-1.17ZM8.9 14.2l9-5.6c.2-.13.4.15.23.3l-7.36 6.7c-.2.18-.32.43-.35.7l-.25 2.1-1.27-4.2Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.5 1.5" strokeLinecap="round" />
      <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.5-1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 12.5l5 5L20 6.5" strokeLinecap="square" />
    </svg>
  );
}

const ITEM = cn(
  "press inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)]",
  "border border-line bg-coal text-fog",
  "transition-colors duration-200 ease-editorial",
  "hover:border-gold/55 hover:bg-coal-2 hover:text-gold",
);

export function ShareRow({
  url,
  title = "",
  label,
  locale = "ro",
  className,
  copyLabel,
  copiedLabel,
}: ShareRowProps) {
  const copy = microcopy(locale);
  const [absolute, setAbsolute] = useState(url);
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    if (/^https?:/i.test(url)) {
      setAbsolute(url);
      return;
    }
    setAbsolute(new URL(url, window.location.href).toString());
  }, [url]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [copied]);

  const encoded = encodeURIComponent(absolute);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    {
      key: "facebook",
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      icon: <FacebookIcon />,
    },
    {
      key: "x",
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
      icon: <XIcon />,
    },
    {
      key: "telegram",
      name: "Telegram",
      href: `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`,
      icon: <TelegramIcon />,
    },
  ];

  const onCopy = async () => {
    const done = (ok: boolean) => {
      if (!ok) return;
      setCopied(true);
      success(copiedLabel ?? copy.copied);
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absolute);
        done(true);
        return;
      }
    } catch {
      // permisiune refuzată sau context nesecurizat — cădem pe varianta clasică
    }

    try {
      const helper = document.createElement("textarea");
      helper.value = absolute;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      document.body.removeChild(helper);
      done(true);
    } catch {
      done(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {label !== "" ? (
        <span className="kicker kicker-muted mr-1">{label ?? copy.share}</span>
      ) : null}

      {targets.map((target) => (
        <a
          key={target.key}
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          title={target.name}
          aria-label={target.name}
          className={ITEM}
        >
          {target.icon}
        </a>
      ))}

      <button
        type="button"
        onClick={onCopy}
        title={copyLabel ?? copy.copyLink}
        aria-label={copyLabel ?? copy.copyLink}
        className={cn(ITEM, copied ? "border-sage/60 text-sage" : undefined)}
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
      </button>
    </div>
  );
}

export default ShareRow;
