import { notFound } from "next/navigation";

/**
 * Catch-all pentru `/admin/<orice-necunoscut>`: declanșează `not-found.tsx`
 * din segmentul admin, ca 404-ul să fie pe identitatea panoului (în română),
 * nu pagina generică a Next.
 */
export default function AdminCatchAll(): never {
  notFound();
}
