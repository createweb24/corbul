"use client";

/**
 * Previzualizarea bannerului la dimensiunea reală a zonei.
 *
 * Cadrul are exact `width × height` din zonă; dacă nu încape în modal, se
 * micșorează proporțional (`transform: scale`) și se anunță procentul — astfel
 * proporțiile rămân cele de pe site, iar redactorul vede imediat dacă marcajul
 * depășește caseta. Culorile cadrului sunt tokeni, deci previzualizarea arată
 * corect în ambele teme.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";

export interface BannerPreviewProps {
  width: number;
  height: number;
  zoneName?: string;
  imageUrl?: string | null;
  html?: string | null;
  alt?: string | null;
}

export function BannerPreview({
  width,
  height,
  zoneName,
  imageUrl,
  html,
  alt,
}: BannerPreviewProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [available, setAvailable] = useState(0);
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    setImageBroken(false);
  }, [imageUrl]);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    setAvailable(element.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setAvailable(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const scale = available > 0 ? Math.min(1, available / safeWidth) : 1;
  const percent = Math.round(scale * 100);
  const hasContent = Boolean(imageUrl?.trim() || html?.trim());

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-fog">
          Previzualizare
        </p>
        <p className="font-mono text-[0.6875rem] text-mist">
          {zoneName ? `${zoneName} · ` : ""}
          {safeWidth} × {safeHeight} px
          {percent < 100 ? ` · afișat la ${percent}%` : ""}
        </p>
      </div>

      <div ref={frameRef} className="w-full">
        <div
          className={cn(
            "relative overflow-hidden border bg-coal-2",
            hasContent ? "border-line-2" : "border-dashed border-line",
          )}
          style={{ height: Math.round(safeHeight * scale) }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: safeWidth,
              height: safeHeight,
              transform: `scale(${scale})`,
            }}
          >
            {imageUrl?.trim() && !imageBroken ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl.trim()}
                alt={alt?.trim() || "Previzualizarea bannerului"}
                width={safeWidth}
                height={safeHeight}
                onError={() => setImageBroken(true)}
                className="block size-full object-contain"
              />
            ) : html?.trim() ? (
              <div
                className="size-full overflow-hidden"
                // Marcajul e scris de redacție în panou, nu vine din exterior;
                // previzualizarea trebuie să fie identică cu randarea de pe site.
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div className="flex size-full items-center justify-center px-4 text-center">
                <p className="font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-mist">
                  {imageBroken
                    ? "Imaginea nu a putut fi încărcată"
                    : "Fără conținut"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {imageBroken ? (
        <p className="mt-2 text-xs text-ember">
          Adresa imaginii nu răspunde. Verific-o înainte de salvare.
        </p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-mist">
          Cadrul are dimensiunea exactă a zonei. Ce depășește caseta va fi tăiat
          și pe site.
        </p>
      )}
    </div>
  );
}
