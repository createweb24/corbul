import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Paginile publice folosesc ACEST Link (adaugă prefixul de limbă).
// Panoul de administrare folosește next/link obișnuit.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
