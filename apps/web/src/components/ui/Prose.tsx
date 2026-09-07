import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Învelișul tipografic pentru corpul articolelor (Source Serif 4).
 * Stilurile sunt în `globals.css`, clasa `.prose-corbul` — aici doar
 * decidem între HTML-ul din baza de date și copii React.
 *
 * `html` vine din propriul CMS (câmpul `contentRo/contentRu`, editat doar
 * din panoul de administrare autentificat), deci inserarea directă e
 * intenționată — nu e conținut trimis de vizitatori.
 */

export interface ProseProps {
  html?: string | null;
  children?: ReactNode;
  className?: string;
  size?: "sm" | "base" | "lg";
  /** capitulară aurie pe primul paragraf (pagina de articol) */
  dropcap?: boolean;
  id?: string;
}

export function Prose({
  html,
  children,
  className,
  size = "base",
  dropcap = false,
  id,
}: ProseProps) {
  const classes = cn(
    "prose-corbul",
    size === "sm" ? "prose-sm" : size === "lg" ? "prose-lg" : undefined,
    dropcap ? "has-dropcap" : undefined,
    className,
  );

  if (typeof html === "string" && html.length > 0) {
    return (
      <div
        id={id}
        className={classes}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div id={id} className={classes}>
      {children}
    </div>
  );
}

export default Prose;
