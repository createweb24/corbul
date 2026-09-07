/**
 * Micro-etichete implicite pentru primitivele din `ui/`.
 *
 * Regula generală a proiectului este ca tot textul de interfață să treacă
 * prin next-intl (SPEC §0.4). Primitivele de aici sunt însă folosite și în
 * afara provider-ului (panoul de administrare, stări de eroare) și trebuie
 * să rămână corecte în ambele limbi chiar dacă apelantul nu trimite nimic.
 *
 * De aceea: FIECARE dintre aceste texte poate fi suprascris printr-un prop
 * (`label`, `linkLabel`, `closeLabel`, `copyLabel`…). Ele sunt doar valori
 * de rezervă, nu o a doua sursă de adevăr.
 */

import type { Locale } from "@/lib/types";

export interface Microcopy {
  readMin: string;
  views: string;
  breaking: string;
  premium: string;
  all: string;
  previous: string;
  next: string;
  page: string;
  pagination: string;
  close: string;
  share: string;
  copyLink: string;
  copied: string;
  loading: string;
  required: string;
}

const RO: Microcopy = {
  readMin: "min",
  views: "vizualizări",
  breaking: "Ultima oră",
  premium: "Premium",
  all: "Toate",
  previous: "Înapoi",
  next: "Înainte",
  page: "Pagina",
  pagination: "Paginare",
  close: "Închide",
  share: "Distribuie",
  copyLink: "Copiază linkul",
  copied: "Link copiat",
  loading: "Se încarcă",
  required: "obligatoriu",
};

const RU: Microcopy = {
  readMin: "мин",
  views: "просмотров",
  breaking: "Срочно",
  // numele produsului se scrie identic în ambele limbi (ca în ru.json)
  premium: "Premium",
  all: "Все",
  previous: "Назад",
  next: "Вперёд",
  page: "Страница",
  pagination: "Постраничная навигация",
  close: "Закрыть",
  share: "Поделиться",
  copyLink: "Скопировать ссылку",
  copied: "Ссылка скопирована",
  loading: "Загрузка",
  required: "обязательно",
};

export function microcopy(locale: Locale | string | undefined): Microcopy {
  return locale === "ru" ? RU : RO;
}

export default microcopy;
