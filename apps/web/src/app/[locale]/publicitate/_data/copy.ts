import type { Locale } from "@/lib/types";

/**
 * Textele de interfață ale secțiunii comerciale.
 *
 * AGENT-SERVICES nu are voie să scrie în `messages/*.json` (ADS-SPEC §6.3),
 * așa că fiecare șir e ținut aici sub cheia i18n pe care o va primi când
 * proprietarul fișierelor de mesaje le adaugă. `adsText()` citește întâi din
 * next-intl (`t.has`) și cade pe varianta locală doar cât timp cheia lipsește
 * — paginile arată corect în ambele situații, fără să afișeze vreodată calea
 * cheii. Conținutul serviciilor NU trece pe aici: stă în `services.ts`.
 */

interface Bilingual {
  ro: string;
  ru: string;
}

export const AD_TEXT = {
  /* ---- comune ---------------------------------------------------- */
  "ads.kicker": { ro: "Publicitate", ru: "Реклама" },
  "ads.allServices": { ro: "Toate serviciile", ru: "Все услуги" },
  "ads.mediaKitLink": { ro: "Media kit", ru: "Медиакит" },
  "ads.priceFrom": { ro: "De la", ru: "От" },
  "ads.priceMonthly": { ro: "pe lună", ru: "в месяц" },
  /** sufixul de după sumă, la serviciile cu tarif lunar: „30 € / lună" */
  "ads.priceUnitMonth": { ro: "/ lună", ru: "/ месяц" },
  "ads.priceOnRequest": { ro: "Preț la cerere", ru: "Цена по запросу" },
  /**
   * `ads.vatNote` există deja în `messages/*.json` cu textul vechi, în lei, iar
   * fișierele de mesaje nu sunt ale noastre (ADS-SPEC §6.3). Grila fiind acum
   * în euro, folosim chei noi: cheia lipsind din mesaje, `adsText` cade pe
   * varianta de aici și pagina afișează moneda corectă.
   */
  "ads.priceNoteEur": {
    ro: "Prețurile sunt „de la”, în euro, fără TVA. Facturăm pe persoană juridică, cu contract.",
    ru: "Цены указаны «от», в евро, без НДС. Работаем по договору, с юридическими лицами.",
  },
  "ads.billingNote": {
    ro: "Facturarea se face în lei moldovenești, la cursul oficial BNM din ziua emiterii facturii.",
    ru: "Счёт выставляется в молдавских леях по официальному курсу НБМ на день выставления счёта.",
  },
  "ads.includesTitle": { ro: "Ce include", ru: "Что входит" },
  "ads.forWhomTitle": { ro: "Cui i se potrivește", ru: "Кому подходит" },
  "ads.turnaroundTitle": { ro: "Termen de livrare", ru: "Срок исполнения" },
  "ads.priceTitle": { ro: "Preț", ru: "Стоимость" },
  "ads.disclosureTitle": {
    ro: "Transparență editorială",
    ru: "Редакционная прозрачность",
  },
  "ads.quoteCta": { ro: "Cere ofertă", ru: "Запросить предложение" },
  "ads.otherServicesTitle": { ro: "Celelalte servicii", ru: "Другие услуги" },
  "ads.backToIndex": {
    ro: "Toate serviciile de publicitate",
    ru: "Все рекламные услуги",
  },
  "ads.contactEmailLabel": {
    ro: "Departamentul comercial",
    ru: "Коммерческий отдел",
  },

  /* ---- pagina-index ---------------------------------------------- */
  "ads.index.metaTitle": {
    ro: "Publicitate pe Corbul.md",
    ru: "Реклама на Corbul.md",
  },
  "ads.index.metaDescription": {
    ro: "Advertoriale, director de servicii profesionale, backlinkuri, guest posturi, promovare de evenimente și pachete de vizibilitate — cu marcaj clar și fără acoperire editorială de vânzare.",
    ru: "Адверториалы, каталог профессиональных услуг, обратные ссылки, гостевые публикации, продвижение мероприятий и пакеты видимости — с ясной маркировкой и без продажи редакционного освещения.",
  },
  "ads.index.title": {
    ro: "Publicitate pe Corbul.md",
    ru: "Реклама на Corbul.md",
  },
  "ads.index.subtitle": {
    ro: "Șase formate comerciale și cinci zone de banner, toate marcate ca atare. Vindem atenția unui public care citește documente până la capăt — nu vindem ceea ce scrie redacția despre dumneavoastră.",
    ru: "Шесть коммерческих форматов и пять баннерных зон — все с соответствующей маркировкой. Мы продаём внимание аудитории, которая дочитывает документы до конца, но не продаём то, что редакция пишет о вас.",
  },
  /* Variantele „14 servicii" ale antetului. Cheile fără sufix există deja în
     `messages/*.json` cu textul vechi, de șase formate; nu le putem edita
     acolo, așa că oferta extinsă are chei proprii. */
  "ads.index.metaDescription14": {
    ro: "Paisprezece formate comerciale pe Corbul.md: advertoriale, articole plătite, comunicate, guest posturi, backlinkuri, sponsorizări de newsletter, branded content, publicitate și PR local — cu marcaj clar și fără acoperire editorială de vânzare.",
    ru: "Четырнадцать коммерческих форматов на Corbul.md: адверториалы, платные статьи, пресс-релизы, гостевые публикации, обратные ссылки, спонсорство рассылки, брендированный контент, локальная реклама и PR — с ясной маркировкой и без продажи редакционного освещения.",
  },
  "ads.index.subtitle14": {
    ro: "Paisprezece formate comerciale, cinci zone de banner și native ads la cerere, toate marcate ca atare. Vindem atenția unui public care citește documente până la capăt — nu vindem ceea ce scrie redacția despre dumneavoastră.",
    ru: "Четырнадцать коммерческих форматов, пять баннерных зон и нативная реклама по запросу — всё с соответствующей маркировкой. Мы продаём внимание аудитории, которая дочитывает документы до конца, но не продаём то, что редакция пишет о вас.",
  },
  "ads.index.introTitle": {
    ro: "Cum lucrăm",
    ru: "Как мы работаем",
  },
  "ads.index.intro1": {
    ro: "Corbul.md își acoperă costurile din abonamente, parteneriate și publicitate. Partea comercială este condusă separat de redacție: departamentul comercial nu are acces la subiectele în lucru, iar redacția nu are acces la lista de clienți. Este singurul aranjament în care ambele părți își pot face treaba fără să mintă pe nimeni.",
    ru: "Corbul.md покрывает свои расходы за счёт подписок, партнёрств и рекламы. Коммерческое направление ведётся отдельно от редакции: коммерческий отдел не имеет доступа к темам в работе, а редакция — к списку клиентов. Это единственная схема, при которой обе стороны могут делать свою работу, никого не обманывая.",
  },
  "ads.index.intro2": {
    ro: "Practic, asta înseamnă trei reguli fixe: orice material plătit poartă marcajul „Conținut comercial”, orice legătură plătită poartă atributul rel=\"sponsored\", iar niciun contract nu conține vreo clauză despre acoperirea jurnalistică a clientului. Le găsiți repetate pe fiecare pagină de mai jos, pentru că sunt partea cea mai importantă a ofertei.",
    ru: "На практике это три неизменных правила: любой оплаченный материал помечен как «Коммерческий контент», любая оплаченная ссылка имеет атрибут rel=\"sponsored\", и ни в одном договоре нет положений о журналистском освещении клиента. Ниже вы встретите их на каждой странице — потому что это самая важная часть предложения.",
  },
  "ads.index.independenceTitle": {
    ro: "Ce nu se vinde",
    ru: "Что не продаётся",
  },
  "ads.index.independenceBody": {
    ro: "Nu vindem poziții în secțiunile editoriale, nu vindem tăcerea redacției și nu retragem, contra cost, materiale publicate. Nu acceptăm publicitate politică sau electorală, nici reclamă pentru operatori de jocuri de noroc fără licență, scheme de investiții cu randament garantat sau servicii de ștergere a informațiilor de interes public. Ne rezervăm dreptul de a refuza orice creație sau text, fără să motivăm.",
    ru: "Мы не продаём места в редакционных разделах, не продаём молчание редакции и не снимаем за плату уже опубликованные материалы. Мы не берём политическую и предвыборную рекламу, а также рекламу игорных операторов без лицензии, инвестиционных схем с гарантированной доходностью и услуг по удалению общественно значимой информации. Мы оставляем за собой право отклонить любой креатив или текст без объяснения причин.",
  },
  "ads.index.servicesTitle": {
    ro: "Servicii comerciale",
    ru: "Коммерческие услуги",
  },
  "ads.index.servicesIntro": {
    ro: "Fiecare serviciu are pagina lui, cu ce include, cui i se potrivește, termenul de livrare și mențiunea de transparență care i se aplică.",
    ru: "У каждой услуги есть своя страница: что входит, кому подходит, срок исполнения и относящаяся к ней оговорка о прозрачности.",
  },
  /* ---- „La cerere": bannere și native ads ------------------------- */
  "ads.index.onRequestTitle": { ro: "La cerere", ru: "По запросу" },
  "ads.index.onRequestIntro": {
    ro: "Două formate care nu au preț de grilă, pentru că se tarifează după volum, poziție și durată. Le calculăm la cerere, în aceeași zi.",
    ru: "Два формата без прайсовой цены: они тарифицируются по объёму, позиции и сроку. Рассчитываем по запросу, в тот же день.",
  },
  "ads.index.onRequest.banners.title": {
    ro: "Bannere",
    ru: "Баннеры",
  },
  "ads.index.onRequest.banners.body": {
    ro: "Zonele fixe de mai jos, rezervate pe săptămâni sau pe luni, cu rotație și limitare de frecvență. Tabelul arată tariful lunar de referință al fiecărei zone; prețul final depinde de perioadă, de volumul de afișări și de exclusivitate, așa că îl confirmăm la cerere. Fiecare afișare este contorizată de noi și raportată lunar, iar creațiile poartă marcajul „Publicitate” și nu pot imita interfața site-ului.",
    ru: "Фиксированные зоны, перечисленные ниже, бронируются на недели или месяцы, с ротацией и ограничением частоты. В таблице — ориентировочный месячный тариф каждой зоны; итоговая цена зависит от срока, объёма показов и эксклюзивности, поэтому мы подтверждаем её по запросу. Каждый показ считаем мы сами и отчитываемся ежемесячно, а креативы несут пометку «Реклама» и не могут имитировать интерфейс сайта.",
  },
  "ads.index.onRequest.native.title": {
    ro: "Native ads",
    ru: "Нативная реклама",
  },
  "ads.index.onRequest.native.body": {
    ro: "Blocuri promovate în fluxul de lectură, construite din titlu, imagine și o legătură către un material comercial. Poartă eticheta „Conținut comercial” în interiorul blocului, sunt vizibil despărțite de recomandările redacției și nu intră niciodată în listele editoriale. Se tarifează pe mia de afișări sau pe clic, cu volum minim convenit.",
    ru: "Промоблоки внутри потока чтения: заголовок, изображение и ссылка на коммерческий материал. Внутри блока — пометка «Коммерческий контент»; блоки визуально отделены от редакционных рекомендаций и никогда не попадают в редакционные подборки. Тарифицируются за тысячу показов или за клик, с согласованным минимальным объёмом.",
  },
  "ads.index.zonesTitle": {
    ro: "Zone de banner",
    ru: "Баннерные зоны",
  },
  "ads.index.zonesIntro": {
    ro: "Cinci poziții fixe, aceleași pentru toți clienții, cu dimensiunile și prețul lunar afișate public. Fiecare afișare este contorizată de noi și raportată lunar.",
    ru: "Пять фиксированных позиций, одинаковых для всех клиентов, с публично указанными размерами и месячной ценой. Каждый показ считаем мы сами и отчитываемся ежемесячно.",
  },
  "ads.index.zonesFooter": {
    ro: "Bannerele sunt marcate „Publicitate” deasupra creației și nu pot imita elementele de interfață ale site-ului sau formatul unei știri.",
    ru: "Баннеры помечены словом «Реклама» над креативом и не могут имитировать элементы интерфейса сайта или формат новости.",
  },
  "ads.index.whyTitle": { ro: "De ce Corbul.md", ru: "Почему Corbul.md" },
  "ads.index.whyIntro": {
    ro: "Nu avem cel mai mare trafic din Republica Moldova și nu îl căutăm. Avem un public îngust și scump: oameni care iau decizii cu bani și cu documente în față.",
    ru: "У нас не самый большой трафик в Молдове, и мы к нему не стремимся. У нас узкая и дорогая аудитория: люди, которые принимают решения, имея перед собой деньги и документы.",
  },
  "ads.index.why.legal.title": { ro: "Juridic", ru: "Юристы" },
  "ads.index.why.legal.body": {
    ro: "Avocați, juriști de corporație, executori și consilieri care urmăresc dosarele de corupție, achizițiile publice și practica instanțelor. Vin pentru documentele atașate materialelor, nu pentru titluri.",
    ru: "Адвокаты, корпоративные юристы, исполнители и советники, которые следят за коррупционными делами, госзакупками и судебной практикой. Они приходят за приложенными документами, а не за заголовками.",
  },
  "ads.index.why.finance.title": { ro: "Finanțe", ru: "Финансы" },
  "ads.index.why.finance.body": {
    ro: "Bancheri, analiști, contabili-șefi și consultanți fiscali. Rubrica „Economie și Finanțe” și instrumentele de calcul de pe site îi aduc înapoi săptămânal.",
    ru: "Банкиры, аналитики, главные бухгалтеры и налоговые консультанты. Рубрика «Экономика и финансы» и расчётные инструменты сайта возвращают их сюда еженедельно.",
  },
  "ads.index.why.industry.title": { ro: "Industrie și energie", ru: "Промышленность и энергетика" },
  "ads.index.why.industry.body": {
    ro: "Directori din energie, transport, agroindustrie și construcții, plus responsabilii lor de achiziții. Urmăresc licitațiile, tarifele și infrastructura — subiecte pe care le acoperim constant.",
    ru: "Руководители в энергетике, транспорте, агропроме и строительстве, а также их специалисты по закупкам. Они следят за тендерами, тарифами и инфраструктурой — темами, которые мы освещаем постоянно.",
  },
  "ads.index.why.consulting.title": { ro: "Consultanță", ru: "Консалтинг" },
  "ads.index.why.consulting.body": {
    ro: "Firme de audit, consultanți în management, agenții de comunicare și organizații de dezvoltare. Citesc pentru context și îl folosesc mai departe în rapoartele lor.",
    ru: "Аудиторские фирмы, управленческие консультанты, коммуникационные агентства и организации развития. Они читают ради контекста и переносят его в свои отчёты.",
  },
  "ads.index.contactTitle": {
    ro: "Discutăm o campanie",
    ru: "Обсудим кампанию",
  },
  "ads.index.contactBody": {
    ro: "Scrieți-ne ce vreți să obțineți și în ce interval. Răspundem cu o propunere concretă, cu formate, poziții și preț, în două zile lucrătoare. Dacă ceea ce ne cereți nu se poate face fără să încălcăm regulile de mai sus, v-o spunem direct.",
    ru: "Напишите, какого результата вы хотите и в какие сроки. В течение двух рабочих дней мы вернёмся с конкретным предложением — форматы, позиции, цена. Если задачу нельзя решить, не нарушив изложенных выше правил, мы скажем об этом прямо.",
  },

  /* ---- tabelul zonelor ------------------------------------------- */
  "ads.zones.zone": { ro: "Zonă", ru: "Зона" },
  "ads.zones.size": { ro: "Dimensiune", ru: "Размер" },
  "ads.zones.price": { ro: "Preț lunar", ru: "Цена в месяц" },
  "ads.zones.onRequest": { ro: "La cerere", ru: "По запросу" },

  /* ---- media kit -------------------------------------------------- */
  "ads.mediaKit.metaTitle": {
    ro: "Media kit — publicitate pe Corbul.md",
    ru: "Медиакит — реклама на Corbul.md",
  },
  "ads.mediaKit.metaDescription": {
    ro: "Cifrele de audiență ale Corbul.md, profilul cititorului, formatele publicitare disponibile, tarifele și condițiile editoriale.",
    ru: "Показатели аудитории Corbul.md, портрет читателя, доступные рекламные форматы, тарифы и редакционные условия.",
  },
  "ads.mediaKit.title": { ro: "Media kit", ru: "Медиакит" },
  "ads.mediaKit.subtitle": {
    ro: "Cifrele, publicul, formatele și condițiile — pe o singură pagină, actualizată trimestrial.",
    ru: "Цифры, аудитория, форматы и условия — на одной странице, обновляемой ежеквартально.",
  },
  "ads.mediaKit.audienceTitle": { ro: "Audiență", ru: "Аудитория" },
  "ads.mediaKit.audienceNote": {
    ro: "Date proprii de trafic, media ultimelor trei luni calendaristice. Măsurăm cu propria contorizare de afișări; nu folosim estimări de panel și nu rotunjim în sus.",
    ru: "Собственные данные о трафике, среднее за три последних календарных месяца. Мы считаем показы сами; панельные оценки не используем и вверх не округляем.",
  },
  "ads.mediaKit.readerTitle": { ro: "Profilul cititorului", ru: "Портрет читателя" },
  "ads.mediaKit.readerNote": {
    ro: "Structura publicului, din chestionarul anual al abonaților și din datele agregate de sesiune. Procentele sunt rotunjite la unitate.",
    ru: "Структура аудитории — по ежегодному опросу подписчиков и агрегированным данным сессий. Проценты округлены до целых.",
  },
  "ads.mediaKit.formatsTitle": { ro: "Formate disponibile", ru: "Доступные форматы" },
  "ads.mediaKit.formatsNote": {
    ro: "Creațiile se livrează în JPG, PNG sau HTML, sub 150 KB, cu o variantă pentru fiecare temă a site-ului (luminoasă și întunecată) sau cu fundal propriu.",
    ru: "Креативы принимаются в JPG, PNG или HTML, до 150 КБ, с вариантом для каждой темы сайта (светлой и тёмной) либо с собственным фоном.",
  },
  "ads.mediaKit.ratesTitle": { ro: "Tarife", ru: "Тарифы" },
  "ads.mediaKit.ratesNote": {
    ro: "Prețuri de pornire, în lei, fără TVA. Pachetele pe mai multe luni și combinațiile de formate se tarifează individual.",
    ru: "Стартовые цены в леях без НДС. Многомесячные пакеты и комбинации форматов тарифицируются индивидуально.",
  },
  /** varianta în euro; vezi nota de la `ads.priceNoteEur` */
  "ads.mediaKit.ratesNoteEur": {
    ro: "Prețuri de pornire, în euro, fără TVA. Facturarea se face în lei, la cursul oficial BNM din ziua emiterii facturii. Pachetele pe mai multe luni și combinațiile de formate se tarifează individual.",
    ru: "Стартовые цены в евро, без НДС. Счёт выставляется в леях по официальному курсу НБМ на день выставления счёта. Многомесячные пакеты и комбинации форматов тарифицируются индивидуально.",
  },
  "ads.mediaKit.termsTitle": { ro: "Condiții editoriale", ru: "Редакционные условия" },
  "ads.mediaKit.termsIntro": {
    ro: "Aceleași pentru toți clienții, indiferent de sumă. Fac parte din contract.",
    ru: "Одинаковы для всех клиентов, независимо от суммы. Являются частью договора.",
  },
  "ads.mediaKit.terms.t1": {
    ro: "Orice material plătit poartă marcajul „Conținut comercial” deasupra titlului și la finalul textului.",
    ru: "Любой оплаченный материал имеет пометку «Коммерческий контент» над заголовком и в конце текста.",
  },
  "ads.mediaKit.terms.t2": {
    ro: "Toate legăturile din conținut plătit poartă atributul rel=\"sponsored\". Nu vindem legături în articolele redacției.",
    ru: "Все ссылки в оплаченном контенте имеют атрибут rel=\"sponsored\". Ссылки в редакционных статьях не продаются.",
  },
  "ads.mediaKit.terms.t3": {
    ro: "Contractele comerciale nu conțin clauze despre acoperirea jurnalistică a clientului și nu pot fi invocate pentru a obține, opri sau amâna un material.",
    ru: "Коммерческие договоры не содержат положений о журналистском освещении клиента и не могут служить основанием получить, остановить или отсрочить материал.",
  },
  "ads.mediaKit.terms.t4": {
    ro: "Materialele comerciale sunt excluse din fluxul editorial, din Google News și din rubricile de investigație.",
    ru: "Коммерческие материалы исключены из редакционного потока, из Google News и из расследовательских рубрик.",
  },
  "ads.mediaKit.terms.t5": {
    ro: "Nu acceptăm publicitate politică sau electorală, jocuri de noroc fără licență, scheme de investiții cu randament garantat și servicii de ștergere a informațiilor publice.",
    ru: "Мы не принимаем политическую и предвыборную рекламу, игорные услуги без лицензии, инвестиционные схемы с гарантированной доходностью и услуги по удалению публичной информации.",
  },
  "ads.mediaKit.terms.t6": {
    ro: "Redacția poate scrie despre orice client comercial, în orice moment, fără preaviz și fără drept de vizionare a textului înainte de publicare.",
    ru: "Редакция вправе писать о любом коммерческом клиенте в любой момент — без предупреждения и без права предварительного просмотра текста.",
  },
  "ads.mediaKit.contactTitle": { ro: "Contact comercial", ru: "Коммерческие контакты" },
  "ads.mediaKit.contactBody": {
    ro: "Pentru oferte, disponibilitatea zonelor și machetele de creație, scrieți departamentului comercial. Redacția are o adresă separată, iar mesajele trimise acolo nu ajung la noi.",
    ru: "По предложениям, доступности зон и макетам креативов пишите в коммерческий отдел. У редакции отдельный адрес, и письма туда к нам не попадают.",
  },
} as const satisfies Record<string, Bilingual>;

export type AdTextKey = keyof typeof AD_TEXT;

/** Cheile i18n cerute proprietarului fișierelor de mesaje (ADS-SPEC §6.3). */
export const AD_TEXT_KEYS: AdTextKey[] = Object.keys(AD_TEXT) as AdTextKey[];

/** Minimul din traducătorul next-intl de care avem nevoie. */
export interface AdTranslator {
  (key: string): string;
  has(key: string): boolean;
}

/**
 * `s("ads.index.title")` — traducerea din next-intl dacă există, altfel
 * varianta locală. Nu întoarce niciodată calea cheii.
 */
export function adsText(
  locale: Locale,
  t: AdTranslator,
): (key: AdTextKey) => string {
  return (key) => {
    if (t.has(key)) {
      const value = t(key);
      if (value && value !== key) return value;
    }
    const entry = AD_TEXT[key];
    return locale === "ru" ? entry.ru : entry.ro;
  };
}

/* ------------------------------------------------------------------ */
/* Cifrele din media kit — date, nu interfață: nu trec prin next-intl. */
/* ------------------------------------------------------------------ */

export interface MediaKitStat {
  value: string;
  labelRo: string;
  labelRu: string;
}

export const MEDIA_KIT_STATS: MediaKitStat[] = [
  {
    value: "214 000",
    labelRo: "vizite pe lună",
    labelRu: "визитов в месяц",
  },
  {
    value: "128 500",
    labelRo: "cititori unici",
    labelRu: "уникальных читателей",
  },
  {
    value: "640 000",
    labelRo: "afișări de pagină",
    labelRu: "просмотров страниц",
  },
  {
    value: "4:12",
    labelRo: "durata medie a sesiunii",
    labelRu: "средняя длительность сессии",
  },
  {
    value: "11 400",
    labelRo: "abonați la buletin",
    labelRu: "подписчиков рассылки",
  },
  {
    value: "2 300",
    labelRo: "cititori Premium",
    labelRu: "читателей Premium",
  },
];

export interface ReaderProfileGroup {
  titleRo: string;
  titleRu: string;
  rows: { labelRo: string; labelRu: string; share: number }[];
}

export const READER_PROFILE: ReaderProfileGroup[] = [
  {
    titleRo: "Domeniu de activitate",
    titleRu: "Сфера деятельности",
    rows: [
      { labelRo: "Juridic", labelRu: "Право", share: 24 },
      { labelRo: "Finanțe și bănci", labelRu: "Финансы и банки", share: 21 },
      { labelRo: "Administrație publică", labelRu: "Госуправление", share: 17 },
      { labelRo: "Industrie și energie", labelRu: "Промышленность и энергетика", share: 15 },
      { labelRo: "Consultanță și audit", labelRu: "Консалтинг и аудит", share: 12 },
      { labelRo: "Altele", labelRu: "Прочее", share: 11 },
    ],
  },
  {
    titleRo: "Vârstă",
    titleRu: "Возраст",
    rows: [
      { labelRo: "25–34 de ani", labelRu: "25–34 года", share: 26 },
      { labelRo: "35–44 de ani", labelRu: "35–44 года", share: 31 },
      { labelRo: "45–54 de ani", labelRu: "45–54 года", share: 22 },
      { labelRo: "55 de ani și peste", labelRu: "55 лет и старше", share: 13 },
      { labelRo: "18–24 de ani", labelRu: "18–24 года", share: 8 },
    ],
  },
  {
    titleRo: "Geografie",
    titleRu: "География",
    rows: [
      { labelRo: "Chișinău", labelRu: "Кишинёв", share: 58 },
      { labelRo: "Restul Republicii Moldova", labelRu: "Остальная Молдова", share: 27 },
      { labelRo: "Diaspora", labelRu: "Диаспора", share: 15 },
    ],
  },
  {
    titleRo: "Limba de citire",
    titleRu: "Язык чтения",
    rows: [
      { labelRo: "Română", labelRu: "Румынский", share: 68 },
      { labelRo: "Rusă", labelRu: "Русский", share: 32 },
    ],
  },
];

/** Adresa departamentului comercial (ADS-SPEC §5). */
export const ADS_EMAIL = "publicitate@corbul.md";
