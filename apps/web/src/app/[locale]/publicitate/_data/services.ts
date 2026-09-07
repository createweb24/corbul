import type { Locale } from "@/lib/types";

/**
 * Cele șase servicii comerciale ale Corbul.md (ADS-SPEC §7).
 *
 * Conținutul stă aici, nu în `messages/*.json`: sunt texte lungi, de vânzare,
 * pe care le editează redacția comercială, nu traducătorul de interfață.
 * Slug-urile sunt în română și rămân aceleași în ambele limbi, ca adresele
 * să fie stabile și citabile.
 *
 * Registrul textelor este cel al unui portal de investigație: fiecare
 * serviciu spune explicit că materialul este marcat drept comercial și că
 * redacția nu vinde acoperire editorială.
 */

export interface AdService {
  slug: string;
  nameRo: string;
  nameRu: string;
  /** o frază, pentru cardul din grilă */
  leadRo: string;
  leadRu: string;
  /** 3–5 paragrafe de explicație */
  bodyRo: string[];
  bodyRu: string[];
  /** ce include, 4–6 puncte */
  includesRo: string[];
  includesRu: string[];
  /** cui i se potrivește */
  forWhomRo: string;
  forWhomRu: string;
  /** preț „de la", în lei moldovenești */
  priceFromMdl: number;
  /** termen de livrare */
  turnaroundRo: string;
  turnaroundRu: string;
  /** mențiunea de transparență editorială */
  disclosureRo: string;
  disclosureRu: string;
}

export const AD_SERVICES: AdService[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: "advertoriale",
    nameRo: "Advertoriale",
    nameRu: "Адверториалы",
    leadRo:
      "Un material comercial scris la standardul redacției, publicat cu marcajul „Conținut comercial” și păstrat permanent la o adresă proprie.",
    leadRu:
      "Коммерческий материал, написанный по редакционным стандартам: публикуется с пометкой «Коммерческий контент» и остаётся на сайте по собственному постоянному адресу.",
    bodyRo: [
      "Advertorialul este formatul prin care o companie își poate spune povestea pe larg în paginile Corbul.md. Îl scrieți dumneavoastră sau îl scriem noi, pe baza informațiilor pe care ni le furnizați; în ambele cazuri textul trece prin aceeași corectură și aceeași verificare de fapte ca orice alt material publicat aici. Cifrele trebuie să aibă o sursă indicabilă, afirmațiile despre concurenți trebuie să fie demonstrabile, iar promisiunile comerciale trebuie formulate astfel încât un cititor rezonabil să nu fie indus în eroare.",
      "Materialul apare la o adresă proprie, într-o secțiune distinctă de publicitate, cu eticheta „Conținut comercial” afișată deasupra titlului și repetată la finalul textului. Nu îl amestecăm în fluxul de investigații, nu îl trimitem către Google News și nu îl prezentăm niciodată drept produs al redacției. Toate legăturile externe din corpul lui poartă atributul rel=\"sponsored\", conform regulilor Google privind conținutul plătit.",
      "Promovarea inclusă este onestă și limitată: o poziție în lista materialelor comerciale, o apariție în bara laterală, o postare pe canalele noastre sociale marcată ca publicitate și un loc în buletinul săptămânal, într-un bloc separat de partea editorială. Ce nu vindem, în nicio variantă de preț: primul loc din pagina principală, includerea în rubrica „Investigațiile Corbului” și orice formă de influență asupra a ceea ce scriem despre dumneavoastră în restul site-ului.",
      "Textul rămâne online pe termen nelimitat, cu adresa lui stabilă, și poate fi actualizat o dată în primele douăsprezece luni fără cost suplimentar. Dacă între timp redacția publică un material critic despre compania dumneavoastră, advertorialul rămâne unde este — cele două lucruri nu se anulează reciproc și niciunul nu se negociază prin celălalt.",
    ],
    bodyRu: [
      "Адверториал — это формат, в котором компания может подробно рассказать о себе на страницах Corbul.md. Текст пишете вы или пишем мы по вашим материалам; в обоих случаях он проходит ту же вычитку и ту же проверку фактов, что и любая другая публикация на сайте. У цифр должен быть источник, утверждения о конкурентах должны быть доказуемы, а коммерческие обещания сформулированы так, чтобы не вводить читателя в заблуждение.",
      "Материал выходит по собственному адресу, в отдельном рекламном разделе, с пометкой «Коммерческий контент» над заголовком и повторно в конце текста. Мы не смешиваем его с потоком расследований, не отдаём в Google News и никогда не выдаём за работу редакции. Все внешние ссылки внутри него имеют атрибут rel=\"sponsored\" — как того требуют правила Google для оплаченного контента.",
      "Продвижение, входящее в пакет, честное и ограниченное: место в списке коммерческих материалов, показ в боковой колонке, пост в наших социальных каналах с пометкой «реклама» и упоминание в еженедельной рассылке — в блоке, отделённом от редакционного. Чего мы не продаём ни за какие деньги: первое место на главной, попадание в рубрику «Расследования Corbul» и любое влияние на то, что мы пишем о вас в остальной части сайта.",
      "Текст остаётся в сети бессрочно, по неизменному адресу, и в течение первых двенадцати месяцев может быть один раз обновлён бесплатно. Если за это время редакция опубликует критический материал о вашей компании, адверториал останется на месте: одно не отменяет другого и одно не является предметом торга за другое.",
    ],
    includesRo: [
      "Text de 4 000–8 000 de semne, redactat sau editat de redacție, în română sau în rusă.",
      "Adresă proprie și permanentă pe corbul.md, cu marcajul „Conținut comercial” deasupra titlului.",
      "Până la cinci imagini, un video încorporat și o galerie de documente, dacă susțin textul.",
      "Legături către site-ul dumneavoastră, cu atributul rel=\"sponsored\".",
      "O postare pe canalele Corbul.md, marcată ca publicitate, și un loc în buletinul săptămânal.",
      "O actualizare gratuită a textului în primele douăsprezece luni de la publicare.",
    ],
    includesRu: [
      "Текст объёмом 4 000–8 000 знаков, написанный или отредактированный редакцией, на румынском или русском.",
      "Собственный постоянный адрес на corbul.md с пометкой «Коммерческий контент» над заголовком.",
      "До пяти изображений, встроенное видео и галерея документов, если они подкрепляют текст.",
      "Ссылки на ваш сайт с атрибутом rel=\"sponsored\".",
      "Пост в каналах Corbul.md с пометкой «реклама» и место в еженедельной рассылке.",
      "Одно бесплатное обновление текста в течение первых двенадцати месяцев после публикации.",
    ],
    forWhomRo:
      "Companiilor care au ceva concret de explicat — un raport anual, o investiție, o schimbare de acționariat, o poziție într-un dosar public — și care preferă un text documentat unui banner.",
    forWhomRu:
      "Компаниям, которым есть что объяснить по существу — годовой отчёт, инвестиция, смена собственника, позиция по публичному делу, — и которые предпочитают аргументированный текст баннеру.",
    priceFromMdl: 12000,
    turnaroundRo:
      "5 zile lucrătoare de la primirea materialelor; 2 zile pentru textele livrate gata scrise.",
    turnaroundRu:
      "5 рабочих дней с момента получения материалов; 2 дня, если текст передан готовым.",
    disclosureRo:
      "Advertorialele sunt marcate „Conținut comercial”, stau în afara fluxului editorial și a Google News, iar legăturile lor poartă rel=\"sponsored\". Redacția nu vinde acoperire editorială: un contract de publicitate nu oprește, nu amână și nu modifică un material jurnalistic despre client.",
    disclosureRu:
      "Адверториалы помечены как «Коммерческий контент», находятся вне редакционного потока и вне Google News, а их ссылки имеют атрибут rel=\"sponsored\". Редакция не продаёт редакционное освещение: рекламный договор не останавливает, не откладывает и не меняет журналистский материал о клиенте.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "partener-in-director",
    nameRo: "Partener în director",
    nameRu: "Партнёр в каталоге",
    leadRo:
      "O fișă permanentă în directorul de servicii profesionale al Corbul.md, cu descriere, domenii de practică și legătură directă.",
    leadRu:
      "Постоянная карточка в каталоге профессиональных услуг Corbul.md — с описанием, направлениями работы и прямой ссылкой.",
    bodyRo: [
      "Directorul Corbul.md este o listă scurtă și verificată de case de avocatură, cabinete de audit, consultanți fiscali, experți tehnici și birouri de traduceri autorizate — exact serviciile pe care cititorii noștri le caută după ce termină de citit un dosar. Nu este un catalog deschis, în care se intră cu o plată și un formular: fiecare fișă este verificată înainte de publicare.",
      "Verificarea înseamnă că cerem și confirmăm datele elementare: denumirea juridică și IDNO, adresa reală a biroului, licențele sau autorizațiile invocate, iar pentru profesiile reglementate — înscrierea în registrul de profil. Nu evaluăm calitatea serviciilor, nu acordăm note și nu recomandăm pe nimeni; verificăm doar că firma există exact așa cum se prezintă.",
      "Fișa cuprinde o descriere de până la 900 de semne, domeniile de practică, limbile de lucru, datele de contact și legătura către site. În interiorul fiecărei rubrici fișele sunt afișate în ordine alfabetică — nu există poziții cumpărate și nu există „primul rezultat”. Cititorul poate filtra după domeniu.",
      "Directorul este, în întregime, spațiu comercial și este marcat ca atare. Prezența unei firme acolo nu îi conferă niciun statut editorial: nu devine „partener al redacției”, nu este citată preferențial ca sursă și nu capătă vreun drept asupra a ceea ce publicăm despre ea sau despre clienții ei.",
    ],
    bodyRu: [
      "Каталог Corbul.md — это короткий и проверенный список адвокатских бюро, аудиторских компаний, налоговых консультантов, технических экспертов и бюро авторизованных переводов, то есть именно тех услуг, которые наши читатели ищут, дочитав очередное досье. Это не открытый справочник, куда попадают по заявке и оплате: каждая карточка проверяется до публикации.",
      "Проверка означает, что мы запрашиваем и подтверждаем базовые данные: юридическое наименование и IDNO, фактический адрес офиса, заявленные лицензии или разрешения, а для регулируемых профессий — наличие в профильном реестре. Мы не оцениваем качество услуг, не выставляем оценок и никого не рекомендуем; мы лишь удостоверяемся, что компания существует именно в том виде, в каком себя представляет.",
      "Карточка содержит описание до 900 знаков, направления практики, рабочие языки, контакты и ссылку на сайт. Внутри каждой рубрики карточки выводятся по алфавиту — купленных позиций и «первого результата» здесь нет. Читатель может отфильтровать список по направлению.",
      "Каталог целиком является рекламным пространством и помечен как таковое. Присутствие компании в нём не даёт ей никакого редакционного статуса: она не становится «партнёром редакции», не получает преимущества как источник и не приобретает прав на то, что мы пишем о ней или о её клиентах.",
    ],
    includesRo: [
      "Fișă permanentă, timp de douăsprezece luni, în rubrica potrivită a directorului.",
      "Descriere de până la 900 de semne, în română și în rusă, plus sigla companiei.",
      "Verificarea datelor publice: denumire juridică, IDNO, licențe, registre de profil.",
      "Legătură directă către site-ul dumneavoastră și buton de contact.",
      "Două actualizări ale fișei pe an, incluse în preț.",
      "Raport trimestrial cu afișările și clicurile pe fișa dumneavoastră.",
    ],
    includesRu: [
      "Постоянная карточка в соответствующей рубрике каталога сроком на двенадцать месяцев.",
      "Описание до 900 знаков на румынском и русском, а также логотип компании.",
      "Проверка публичных данных: юридическое наименование, IDNO, лицензии, профильные реестры.",
      "Прямая ссылка на ваш сайт и кнопка связи.",
      "Два обновления карточки в год, включённые в стоимость.",
      "Ежеквартальный отчёт о показах и переходах по вашей карточке.",
    ],
    forWhomRo:
      "Caselor de avocatură, birourilor de audit și contabilitate, consultanților fiscali și experților tehnici — profesiile pe care cititorii noștri le caută imediat după ce citesc un dosar.",
    forWhomRu:
      "Адвокатским бюро, аудиторским и бухгалтерским фирмам, налоговым консультантам и техническим экспертам — тем профессиям, которые наши читатели ищут сразу после прочтения досье.",
    priceFromMdl: 4800,
    turnaroundRo:
      "3 zile lucrătoare de la confirmarea datelor firmei; verificarea se face înainte de facturare.",
    turnaroundRu:
      "3 рабочих дня после подтверждения данных компании; проверка проводится до выставления счёта.",
    disclosureRo:
      "Directorul este spațiu publicitar, marcat pe fiecare pagină. Verificăm datele formale ale firmei, dar nu îi garantăm serviciile și nu o recomandăm. Includerea în director nu influențează în niciun fel materialele redacției.",
    disclosureRu:
      "Каталог — рекламное пространство, помеченное на каждой странице. Мы проверяем формальные данные компании, но не гарантируем качество её услуг и не рекомендуем её. Присутствие в каталоге никак не влияет на материалы редакции.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "backlinkuri",
    nameRo: "Backlinkuri",
    nameRu: "Обратные ссылки",
    leadRo:
      "Legături contextuale către site-ul dumneavoastră, plasate în conținut comercial marcat și declarate corect motoarelor de căutare.",
    leadRu:
      "Контекстные ссылки на ваш сайт — в помеченном коммерческом материале и с корректной разметкой для поисковых систем.",
    bodyRo: [
      "Vindem legături doar în interiorul conținutului comercial, marcat ca atare, și doar cu atributul rel=\"sponsored\". Este singura formă compatibilă cu regulile Google privind legăturile plătite și singura care nu vă expune la o retrogradare peste șase luni. O ofertă de „link editorial dofollow într-un articol de știri” este, tehnic, o încălcare a acelor reguli — noi nu o facem, indiferent de sumă și indiferent de cine o cere.",
      "Ceea ce obțineți rămâne, totuși, real: un domeniu de presă cu istoric, cu trafic uman și cu un profil tematic clar — economie, drept, energie, administrație publică. Acestea sunt semnalele care contează pentru relevanță. Textul-ancoră se convine împreună, fraza din jurul lui trebuie să aibă sens pentru un cititor, iar pagina-destinație trebuie să existe și să funcționeze.",
      "Nu acceptăm legături către operatori de jocuri de noroc fără licență, scheme de investiții cu randament garantat, farmacii online neautorizate, servicii de „curățare a reputației” prin ștergerea informațiilor publice sau site-uri care republică fără drept conținutul altora. Refuzăm și plasările în rețele private de bloguri (PBN), pentru că le compromit pe ale noastre.",
      "Fiecare legătură rămâne activă cel puțin douăzeci și patru de luni, iar adresa exactă a paginii vă este comunicată înainte de plată. Dacă retragem vreodată un material comercial — de exemplu, pentru că o informație din el s-a dovedit falsă — vă anunțăm în scris și compensăm plasarea.",
    ],
    bodyRu: [
      "Мы размещаем ссылки только внутри коммерческого контента, помеченного как таковой, и только с атрибутом rel=\"sponsored\". Это единственный формат, совместимый с правилами Google об оплаченных ссылках, и единственный, который не обернётся понижением через полгода. Предложение «редакционная dofollow-ссылка в новостной статье» — это, технически, нарушение этих правил; мы так не работаем, независимо от суммы и от того, кто просит.",
      "При этом вы получаете вполне реальный актив: медийный домен с историей, живым трафиком и понятной тематикой — экономика, право, энергетика, госуправление. Именно эти сигналы работают на релевантность. Анкор согласовывается заранее, окружающая фраза должна быть осмысленной для читателя, а страница назначения — существовать и открываться.",
      "Мы не размещаем ссылки на игорных операторов без лицензии, инвестиционные схемы с «гарантированной доходностью», нелицензированные онлайн-аптеки, услуги по «чистке репутации» через удаление публичной информации и сайты, перепубликующие чужой контент без прав. Отказываем и в размещении в сетях сателлитов (PBN) — они портят и наш профиль тоже.",
      "Каждая ссылка остаётся активной не менее двадцати четырёх месяцев, а точный адрес страницы сообщается вам до оплаты. Если мы когда-либо снимем коммерческий материал — например, потому что сведения в нём оказались недостоверными, — мы письменно уведомим вас и компенсируем размещение.",
    ],
    includesRo: [
      "Una până la trei legături contextuale, într-un material comercial nou sau existent.",
      "Atributul rel=\"sponsored\" și marcajul „Conținut comercial” pe pagina-gazdă.",
      "Text-ancoră convenit în prealabil, în limba materialului.",
      "Adresa exactă a paginii, comunicată înainte de plată.",
      "Garanția că legătura rămâne activă cel puțin douăzeci și patru de luni.",
      "Un raport de indexare la treizeci de zile după publicare.",
    ],
    includesRu: [
      "От одной до трёх контекстных ссылок в новом или уже опубликованном коммерческом материале.",
      "Атрибут rel=\"sponsored\" и пометка «Коммерческий контент» на странице размещения.",
      "Заранее согласованный анкорный текст на языке материала.",
      "Точный адрес страницы, сообщённый до оплаты.",
      "Гарантия, что ссылка останется активной не менее двадцати четырёх месяцев.",
      "Отчёт об индексации через тридцать дней после публикации.",
    ],
    forWhomRo:
      "Agențiilor de marketing și companiilor care își construiesc un profil de legături curat și au nevoie de un domeniu de presă real, nu de o rețea de site-uri făcute pentru motoare.",
    forWhomRu:
      "Маркетинговым агентствам и компаниям, которые выстраивают чистый ссылочный профиль и которым нужен настоящий медийный домен, а не сетка сайтов под поисковики.",
    priceFromMdl: 3600,
    turnaroundRo:
      "2 zile lucrătoare pentru plasarea într-un material existent; 5 zile pentru un material nou.",
    turnaroundRu:
      "2 рабочих дня для размещения в существующем материале; 5 дней, если материал создаётся с нуля.",
    disclosureRo:
      "Toate legăturile plătite poartă rel=\"sponsored\" și stau în pagini marcate „Conținut comercial”. Nu vindem legături în articolele redacției și nu ștergem, contra cost, informații publicate — cererile de acest fel sunt refuzate din start.",
    disclosureRu:
      "Все оплаченные ссылки имеют атрибут rel=\"sponsored\" и находятся на страницах с пометкой «Коммерческий контент». Мы не продаём ссылки в редакционных статьях и не удаляем за плату опубликованную информацию — такие запросы отклоняются сразу.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "guest-post",
    nameRo: "Guest post",
    nameRu: "Гостевая публикация",
    leadRo:
      "Un text semnat de un specialist din afara redacției, publicat în secțiunea de opinii comerciale, cu autorul și afilierea lui declarate.",
    leadRu:
      "Текст за подписью внешнего специалиста — в разделе коммерческих мнений, с указанием автора и его аффилиации.",
    bodyRo: [
      "Guest postul este, înainte de toate, un text de autor: un avocat explică o modificare legislativă, un auditor descrie o capcană contabilă frecventă, un inginer energetician comentează condițiile unei licitații. Are valoare pentru cititor doar dacă are un autor real, cu nume, funcție și afiliere afișate deschis — și numai așa îl publicăm.",
      "Diferența față de advertorial este a subiectului: aici se vinde expertiza, nu produsul. Textul poate menționa compania autorului în nota biografică și poate conține o legătură către ea, dar corpul materialului nu este o prezentare comercială. Dacă textul primit este, în realitate, o broșură, îl transformăm de comun acord în advertorial sau îl refuzăm.",
      "Redactăm împreună. Verificăm trimiterile la actele normative citate, cerem sursă pentru fiecare cifră și tăiem afirmațiile pe care autorul nu le poate susține public. Autorul păstrează controlul asupra tezei sale; noi păstrăm controlul asupra exactității. Dacă nu ajungem la un text corect, restituim plata.",
      "Materialul apare în secțiunea „Opinii comerciale”, vizibil separată de rubrica „Opinie & Analize” a redacției, cu mențiunea „Material comercial. Opiniile aparțin autorului”. Nu îl semnăm cu numele redacției, nu îl prezentăm ca poziție a Corbul.md și nu îl folosim ca argument în materialele noastre.",
    ],
    bodyRu: [
      "Гостевая публикация — это прежде всего авторский текст: адвокат разбирает поправку в законодательстве, аудитор описывает типичную бухгалтерскую ловушку, инженер-энергетик комментирует условия тендера. Она имеет ценность для читателя только при наличии реального автора — с именем, должностью и открыто указанной аффилиацией. Только в таком виде мы её публикуем.",
      "Отличие от адверториала — в предмете: здесь продаётся экспертиза, а не продукт. Текст может упоминать компанию автора в биографической справке и содержать ссылку на неё, но сам материал не является коммерческой презентацией. Если присланный текст на деле оказывается буклетом, мы по согласованию переводим его в формат адверториала или отказываем.",
      "Мы редактируем текст вместе с автором: проверяем отсылки к нормативным актам, запрашиваем источник для каждой цифры и убираем утверждения, которые автор не готов подтвердить публично. За тезис отвечает автор, за точность — мы. Если корректный текст не получается, оплату возвращаем.",
      "Материал выходит в разделе «Коммерческие мнения», визуально отделённом от редакционной рубрики «Мнения и аналитика», с пометкой «Коммерческий материал. Мнение принадлежит автору». Мы не подписываем его именем редакции, не выдаём за позицию Corbul.md и не ссылаемся на него в своих материалах.",
    ],
    includesRo: [
      "Text de 3 000–6 000 de semne, semnat, cu fotografia și nota biografică a autorului.",
      "Editare redacțională și verificarea trimiterilor la actele normative citate.",
      "O legătură către compania sau cabinetul autorului, cu atributul rel=\"sponsored\".",
      "Publicare la o adresă permanentă, în secțiunea de opinii comerciale.",
      "Traducerea în a doua limbă a site-ului, la cerere.",
      "Distribuire pe canalele Corbul.md, marcată drept material comercial.",
    ],
    includesRu: [
      "Текст объёмом 3 000–6 000 знаков за подписью автора, с фотографией и биографической справкой.",
      "Редакционная правка и проверка отсылок к цитируемым нормативным актам.",
      "Одна ссылка на компанию или бюро автора с атрибутом rel=\"sponsored\".",
      "Публикация по постоянному адресу в разделе коммерческих мнений.",
      "Перевод на второй язык сайта — по запросу.",
      "Распространение в каналах Corbul.md с пометкой «коммерческий материал».",
    ],
    forWhomRo:
      "Profesioniștilor care vor să fie cunoscuți pentru ceea ce știu — avocați, auditori, fiscaliști, ingineri, economiști — și companiilor care își promovează experții, nu ofertele.",
    forWhomRu:
      "Профессионалам, которые хотят быть известны тем, что они знают, — адвокатам, аудиторам, налоговикам, инженерам, экономистам — и компаниям, продвигающим своих экспертов, а не свои прайсы.",
    priceFromMdl: 6000,
    turnaroundRo:
      "4 zile lucrătoare de la primirea textului, incluzând un tur de corecturi.",
    turnaroundRu:
      "4 рабочих дня с момента получения текста, включая один круг правок.",
    disclosureRo:
      "Guest posturile stau într-o secțiune separată de opiniile redacției, poartă mențiunea „Material comercial” și numele autorului. Redacția nu își asumă tezele autorului și nu oferă, în schimbul publicării, acoperire editorială.",
    disclosureRu:
      "Гостевые публикации размещаются отдельно от редакционных мнений, снабжены пометкой «Коммерческий материал» и именем автора. Редакция не разделяет позицию автора и не предоставляет взамен редакционного освещения.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "promovare-eveniment",
    nameRo: "Promovare eveniment",
    nameRu: "Продвижение мероприятия",
    leadRo:
      "Un pachet pentru conferințe, forumuri și lansări: anunț, prezență în agendă, rotație de bannere și, opțional, o relatare comercială după.",
    leadRu:
      "Пакет для конференций, форумов и презентаций: анонс, место в календаре, ротация баннеров и, по желанию, коммерческий отчёт после.",
    bodyRo: [
      "Pachetul acoperă tot ciclul unui eveniment profesional: anunțul publicat cu trei–patru săptămâni înainte, prezența în agenda de pe site până la data desfășurării, o rotație de bannere în săptămâna dinaintea lui și, dacă doriți, un material de relatare publicat după. Fiecare element poate fi luat și separat.",
      "Anunțul conține exact ce îi trebuie cuiva care decide dacă merge: programul, lista vorbitorilor confirmați, locul, prețul biletelor și legătura de înscriere. Îl scriem noi, pe baza materialelor dumneavoastră, ca să fie lizibil și verificabil, nu ca să fie entuziast. Superlativele nedovedite se taie la redactare.",
      "Relatarea de după eveniment este tot material comercial și este marcată ca atare. Dacă redacția decide independent că evenimentul merită acoperire jurnalistică, o va face separat, cu propriul reporter, fără legătură cu contractul — și fără să vă ceară dreptul de a citi textul înainte de publicare.",
      "Nu promovăm evenimente ai căror organizatori nu pot fi identificați, seminarii de „educație investițională” care vând scheme cu randament garantat și nici evenimente de campanie electorală: publicitatea politică are un regim legal propriu, pe care nu îl deservim.",
    ],
    bodyRu: [
      "Пакет закрывает весь цикл профессионального мероприятия: анонс за три-четыре недели, присутствие в календаре событий на сайте вплоть до даты проведения, ротация баннеров в течение недели перед ним и, по желанию, отчётный материал после. Любой элемент можно заказать и отдельно.",
      "Анонс содержит ровно то, что нужно человеку, решающему, идти ему или нет: программу, список подтверждённых спикеров, место, цену билетов и ссылку на регистрацию. Мы пишем его сами по вашим материалам — так, чтобы он был читаемым и проверяемым, а не восторженным. Недоказуемые превосходные степени убираются при редактуре.",
      "Отчёт после мероприятия — тоже коммерческий материал и помечается соответственно. Если редакция самостоятельно сочтёт, что событие заслуживает журналистского освещения, она сделает это отдельно, силами своего репортёра, вне связи с договором — и без предварительного согласования текста с вами.",
      "Мы не продвигаем мероприятия, организаторов которых невозможно установить, семинары «инвестиционного просвещения», продающие схемы с гарантированной доходностью, и мероприятия предвыборных кампаний: у политической рекламы отдельный правовой режим, и мы её не обслуживаем.",
    ],
    includesRo: [
      "Anunțul evenimentului: program, vorbitori, loc, preț și legătură de înscriere.",
      "Prezență în agenda evenimentelor până la data desfășurării.",
      "Rotație de bannere în zonele de pe prima pagină, în săptămâna dinaintea evenimentului.",
      "O postare de anunț și una de memento pe canalele Corbul.md, marcate ca publicitate.",
      "Menționare în buletinul editorial, în blocul comercial.",
      "Opțional: material de relatare după eveniment, marcat „Conținut comercial”.",
    ],
    includesRu: [
      "Анонс мероприятия: программа, спикеры, место, цена и ссылка на регистрацию.",
      "Присутствие в календаре событий вплоть до даты проведения.",
      "Ротация баннеров в зонах главной страницы в течение недели перед мероприятием.",
      "Анонсирующий и напоминающий посты в каналах Corbul.md с пометкой «реклама».",
      "Упоминание в редакционной рассылке, в коммерческом блоке.",
      "Опционально: отчётный материал после мероприятия с пометкой «Коммерческий контент».",
    ],
    forWhomRo:
      "Organizatorilor de conferințe profesionale, camerelor de comerț, asociațiilor patronale, instituțiilor financiare și companiilor care lansează un produs sau un raport public.",
    forWhomRu:
      "Организаторам профессиональных конференций, торговым палатам, объединениям работодателей, финансовым институтам и компаниям, представляющим продукт или публичный отчёт.",
    priceFromMdl: 9500,
    turnaroundRo:
      "Anunțul intră online în 3 zile lucrătoare; rezervarea zonelor de banner se face cu minimum 10 zile înainte.",
    turnaroundRu:
      "Анонс выходит в течение 3 рабочих дней; баннерные зоны бронируются не позднее чем за 10 дней.",
    disclosureRo:
      "Întregul pachet este publicitate și este marcat „Conținut comercial”. Contractul nu obligă redacția să acopere jurnalistic evenimentul și nu o împiedică să scrie critic despre el sau despre organizatorii lui.",
    disclosureRu:
      "Весь пакет является рекламой и помечен как «Коммерческий контент». Договор не обязывает редакцию освещать мероприятие журналистски и не мешает ей писать о нём или об организаторах критически.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "vizibilitate-media",
    nameRo: "Vizibilitate media",
    nameRu: "Медийная видимость",
    leadRo:
      "Un abonament lunar care combină zonele de banner, un material comercial pe lună și prezența în buletin, cu raportare verificabilă.",
    leadRu:
      "Ежемесячный пакет: баннерные зоны, один коммерческий материал в месяц и присутствие в рассылке — с проверяемой отчётностью.",
    bodyRo: [
      "Este pachetul pentru cine nu vrea să negocieze fiecare apariție separat: un contract pe trei, șase sau douăsprezece luni, cu un volum lunar convenit de afișări în zonele de banner, un material comercial pe lună și un loc fix, marcat, în buletinul editorial. Prețul scade cu durata angajamentului.",
      "Volumul de afișări se stabilește la semnare și se distribuie pe zonele alese, cu limitare de frecvență, ca să nu obosim același cititor. Dacă într-o lună nu atingem volumul convenit, îl reportăm în luna următoare sau vă restituim diferența — la alegerea dumneavoastră. Nu vindem „afișări nelimitate” și nu raportăm cifre pe care nu le putem dovedi.",
      "Raportul lunar arată afișările și clicurile pentru fiecare banner în parte, materialele publicate și zonele ocupate. Cifrele provin din contorizarea noastră proprie, nu dintr-o estimare de audiență și nu dintr-un instrument al furnizorului de creație.",
      "Un contract de lungă durată nu cumpără nimic din partea editorială — regula rămâne aceeași și în luna a douăsprezecea: dacă apare un subiect de interes public despre compania dumneavoastră, îl publicăm, iar contractul continuă sau se încheie, după cum decideți. Preferăm de fiecare dată să pierdem un client decât un material.",
    ],
    bodyRu: [
      "Это пакет для тех, кто не хочет обсуждать каждое размещение отдельно: договор на три, шесть или двенадцать месяцев с согласованным месячным объёмом показов в баннерных зонах, одним коммерческим материалом в месяц и постоянным помеченным блоком в редакционной рассылке. Чем длиннее срок, тем ниже цена.",
      "Объём показов фиксируется при подписании и распределяется по выбранным зонам с ограничением частоты, чтобы не утомлять одного и того же читателя. Если в каком-то месяце мы не выберем согласованный объём, он переносится на следующий месяц или разница возвращается — по вашему выбору. Мы не продаём «безлимитные показы» и не отчитываемся цифрами, которые не можем подтвердить.",
      "Ежемесячный отчёт показывает показы и клики по каждому баннеру, опубликованные материалы и занятые зоны. Цифры берутся из нашего собственного счётчика, а не из оценки аудитории и не из инструмента подрядчика по креативу.",
      "Долгосрочный договор не покупает ничего в редакционной части — правило остаётся тем же и на двенадцатый месяц: если появится общественно значимая тема о вашей компании, мы её опубликуем, а договор продолжится или закончится по вашему решению. Мы каждый раз предпочтём потерять клиента, а не материал.",
    ],
    includesRo: [
      "Contract pe 3, 6 sau 12 luni, cu volum lunar de afișări convenit în scris.",
      "Prezență în zonele de banner alese, cu rotație și limitare de frecvență.",
      "Un material comercial pe lună — advertorial sau guest post, la alegere.",
      "Un loc fix, marcat, în buletinul editorial săptămânal.",
      "Raport lunar cu afișări, clicuri și CTR pe fiecare banner.",
      "Consultanță de creație și, la nevoie, realizarea bannerelor de către noi.",
    ],
    includesRu: [
      "Договор на 3, 6 или 12 месяцев с письменно согласованным месячным объёмом показов.",
      "Присутствие в выбранных баннерных зонах с ротацией и ограничением частоты.",
      "Один коммерческий материал в месяц — адверториал или гостевая публикация, на выбор.",
      "Постоянный помеченный блок в еженедельной редакционной рассылке.",
      "Ежемесячный отчёт: показы, клики и CTR по каждому баннеру.",
      "Консультация по креативу и, при необходимости, изготовление баннеров с нашей стороны.",
    ],
    forWhomRo:
      "Băncilor, companiilor de asigurări, operatorilor din energie, grupurilor industriale și caselor de avocatură mari — cui îi trebuie prezență constantă, nu o singură apariție.",
    forWhomRu:
      "Банкам, страховым компаниям, энергетическим операторам, промышленным группам и крупным адвокатским бюро — тем, кому нужно постоянное присутствие, а не разовое появление.",
    priceFromMdl: 24000,
    turnaroundRo:
      "Campania pornește în 7 zile lucrătoare de la semnare și de la primirea creațiilor.",
    turnaroundRu:
      "Кампания стартует в течение 7 рабочих дней после подписания и получения креативов.",
    disclosureRo:
      "Toate aparițiile din pachet sunt marcate ca publicitate. Contractul nu include, nu implică și nu poate fi interpretat drept acoperire editorială: redacția scrie despre clienții săi comerciali exact ca despre oricine altcineva.",
    disclosureRu:
      "Все размещения в пакете помечены как реклама. Договор не включает, не подразумевает и не может толковаться как редакционное освещение: о своих коммерческих клиентах редакция пишет ровно так же, как обо всех остальных.",
  },
];

/** Slug-urile, în ordinea de afișare — folosite de `generateStaticParams`. */
export const AD_SERVICE_SLUGS: string[] = AD_SERVICES.map(
  (service) => service.slug,
);

export function getAdService(slug: string): AdService | undefined {
  return AD_SERVICES.find((service) => service.slug === slug);
}

export function isAdServiceSlug(slug: string): boolean {
  return AD_SERVICE_SLUGS.includes(slug);
}

/** Forma unui serviciu redusă la o singură limbă — ce consumă paginile. */
export interface LocalizedAdService {
  slug: string;
  name: string;
  lead: string;
  body: string[];
  includes: string[];
  forWhom: string;
  priceFromMdl: number;
  turnaround: string;
  disclosure: string;
}

export function localizeAdService(
  service: AdService,
  locale: Locale,
): LocalizedAdService {
  const ru = locale === "ru";
  return {
    slug: service.slug,
    name: ru ? service.nameRu : service.nameRo,
    lead: ru ? service.leadRu : service.leadRo,
    body: ru ? service.bodyRu : service.bodyRo,
    includes: ru ? service.includesRu : service.includesRo,
    forWhom: ru ? service.forWhomRu : service.forWhomRo,
    priceFromMdl: service.priceFromMdl,
    turnaround: ru ? service.turnaroundRu : service.turnaroundRo,
    disclosure: ru ? service.disclosureRu : service.disclosureRo,
  };
}

export function localizedAdServices(locale: Locale): LocalizedAdService[] {
  return AD_SERVICES.map((service) => localizeAdService(service, locale));
}
