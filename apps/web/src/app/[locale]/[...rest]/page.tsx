import { notFound } from "next/navigation";

/**
 * Prinde orice cale fără rută sub `/ro` sau `/ru` și o trimite la
 * `[locale]/not-found.tsx`, ca 404-ul să fie cel al site-ului (tradus,
 * în shell-ul complet), nu pagina generică a framework-ului.
 */
export default function CatchAllPage() {
  notFound();
}
