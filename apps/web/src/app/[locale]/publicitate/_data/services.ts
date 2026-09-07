import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/types";

/**
 * Cele paisprezece servicii comerciale ale Corbul.md (ADS-SPEC §7).
 *
 * Conținutul stă aici, nu în `messages/*.json`: sunt texte lungi, de vânzare,
 * pe care le editează redacția comercială, nu traducătorul de interfață.
 * Slug-urile sunt în română și rămân aceleași în ambele limbi, ca adresele
 * să fie stabile și citabile.
 *
 * Registrul textelor este cel al unui portal de investigație: fiecare
 * serviciu spune explicit că materialul este marcat drept comercial și că
 * redacția nu vinde acoperire editorială.
 *
 * Prețurile sunt afișate în euro, fără TVA: este moneda în care se negociază
 * grila. Facturarea rămâne în lei, la cursul BNM din ziua emiterii facturii —
 * mențiunea o poartă fiecare pagină, sub preț.
 */

/** Plată unică pentru o livrare sau tarif recurent, pe lună. */
export type AdPriceUnit = "once" | "month";

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
  /** preț „de la", în euro, fără TVA */
  priceFromEur: number;
  /** plată unică sau tarif lunar */
  priceUnit: AdPriceUnit;
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
    priceFromEur: 80,
    priceUnit: "once",
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
    slug: "articole-platite",
    nameRo: "Articole plătite",
    nameRu: "Платные статьи",
    leadRo:
      "Textul dumneavoastră, trimis gata scris: îl verificăm pentru conformitate, îl publicăm în secțiunea comercială și îl păstrăm la o adresă permanentă.",
    leadRu:
      "Ваш готовый текст: мы проверяем его на соответствие правилам, публикуем в коммерческом разделе и оставляем по постоянному адресу.",
    bodyRo: [
      "Formatul acesta pornește de la premisa că textul există deja — l-a scris agenția dumneavoastră sau departamentul propriu de comunicare — și că vă trebuie doar o publicație serioasă care să îl găzduiască, cu marcaj corect și cu o adresă care rezistă în timp. Nu îl rescriem și nu îi schimbăm mesajul; îl citim, îl verificăm și îl punem în pagină.",
      "Verificarea nu este o formalitate. Cerem sursă pentru fiecare cifră, tăiem afirmațiile despre concurenți nominalizați care nu pot fi susținute cu un document și refuzăm promisiunile de tipul „cel mai bun de pe piață” fără o măsurătoare în spate. Verificăm și dacă activitatea promovată are nevoie de o licență și dacă emitentul o are — pentru servicii financiare, medicale, farmaceutice și de asigurări este obligatoriu.",
      "Materialul apare în secțiunea comercială, cu eticheta „Conținut comercial” deasupra titlului și repetată la final, la o adresă proprie și permanentă. Nu intră în fluxul editorial, nu este trimis către Google News și nu apare în partea redacțională a buletinului. Toate legăturile din corpul lui poartă atributul rel=\"sponsored\".",
      "Ce nu se cumpără odată cu publicarea: o opinie a redacției despre dumneavoastră, o poziție în rubricile de investigație sau vreo formă de imunitate. Dacă a doua zi apare un subiect de interes public despre compania dumneavoastră, redacția îl scrie, iar articolul plătit rămâne unde este, neatins.",
    ],
    bodyRu: [
      "Этот формат исходит из того, что текст у вас уже есть — его написало ваше агентство или собственный отдел коммуникаций — и нужна лишь серьёзная площадка, которая его разместит: с корректной маркировкой и по адресу, который останется рабочим спустя годы. Мы не переписываем текст и не меняем его посыл; мы его читаем, проверяем и верстаем.",
      "Проверка — не формальность. Мы запрашиваем источник для каждой цифры, снимаем утверждения о названных конкурентах, которые нельзя подтвердить документом, и отклоняем обещания вроде «лучший на рынке» без измерения за ними. Проверяем и другое: требует ли продвигаемая деятельность лицензии и есть ли она у заказчика — для финансовых, медицинских, фармацевтических и страховых услуг это обязательно.",
      "Материал выходит в коммерческом разделе, с пометкой «Коммерческий контент» над заголовком и повторно в конце, по собственному постоянному адресу. Он не попадает в редакционный поток, не уходит в Google News и не появляется в редакционной части рассылки. Все ссылки внутри него имеют атрибут rel=\"sponsored\".",
      "Что не покупается вместе с публикацией: мнение редакции о вас, место в расследовательских рубриках и какая-либо неприкосновенность. Если завтра появится общественно значимая тема о вашей компании, редакция её напишет, а платная статья останется на своём месте — нетронутой.",
    ],
    includesRo: [
      "Publicarea unui text de 2 500–5 000 de semne, primit gata redactat, în română sau în rusă.",
      "Verificare de conformitate: cifre cu sursă, afirmații comerciale susținute, licențele cerute de lege.",
      "Adresă proprie și permanentă, cu marcajul „Conținut comercial” deasupra titlului.",
      "Până la trei imagini și două legături către site-ul dumneavoastră, cu rel=\"sponsored\".",
      "Un tur de corecturi și corectura ortografică a variantei finale.",
      "Raport la treizeci de zile: afișări, timp mediu de lectură și clicuri pe legături.",
    ],
    includesRu: [
      "Публикация текста объёмом 2 500–5 000 знаков, полученного в готовом виде, на румынском или русском.",
      "Проверка на соответствие: источники цифр, обоснованность коммерческих утверждений, требуемые законом лицензии.",
      "Собственный постоянный адрес с пометкой «Коммерческий контент» над заголовком.",
      "До трёх изображений и две ссылки на ваш сайт с атрибутом rel=\"sponsored\".",
      "Один круг правок и корректорская вычитка финального варианта.",
      "Отчёт через тридцать дней: показы, среднее время чтения и клики по ссылкам.",
    ],
    forWhomRo:
      "Companiilor și agențiilor care au textul scris și au nevoie de o platformă cu cititori profesioniști, nu de încă un redactor — plus de certitudinea că materialul va fi marcat corect.",
    forWhomRu:
      "Компаниям и агентствам, у которых текст уже написан и которым нужна площадка с профессиональной аудиторией, а не ещё один редактор, — и уверенность, что материал будет правильно помечен.",
    priceFromEur: 80,
    priceUnit: "once",
    turnaroundRo:
      "2 zile lucrătoare de la primirea textului final; 3 zile dacă este nevoie de traducere în a doua limbă.",
    turnaroundRu:
      "2 рабочих дня с момента получения финального текста; 3 дня, если нужен перевод на второй язык.",
    disclosureRo:
      "Articolele plătite poartă marcajul „Conținut comercial”, stau în afara fluxului editorial și a Google News, iar legăturile lor au atributul rel=\"sponsored\". Redacția nu vinde acoperire editorială și nu retrage, contra cost, materiale deja publicate.",
    disclosureRu:
      "Платные статьи снабжены пометкой «Коммерческий контент», находятся вне редакционного потока и вне Google News, а их ссылки имеют атрибут rel=\"sponsored\". Редакция не продаёт редакционное освещение и не снимает за плату уже опубликованные материалы.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "publicitate-prin-articole",
    nameRo: "Publicitate prin articole",
    nameRu: "Реклама через статьи",
    leadRo:
      "Un program de materiale comerciale întins pe câteva luni, cu un calendar de subiecte convenit dinainte și un preț pe material care scade cu volumul.",
    leadRu:
      "Программа коммерческих материалов на несколько месяцев: заранее согласованный календарь тем и цена за материал, снижающаяся с объёмом.",
    bodyRo: [
      "Un singur text face treaba unui anunț, nu a unei explicații. Când aveți de lămurit un subiect cu mai multe fețe — o schimbare de reglementare care vă afectează clienții, un produs cu trei categorii de utilizatori, o metodologie pe care concurenții o simplifică abuziv — vă trebuie o serie, nu o apariție. Programul acoperă de la trei până la opt materiale, publicate la intervale convenite.",
      "Calendarul se construiește pornind de la ceea ce caută publicul, nu de la calendarul dumneavoastră de comunicare. Fiecare material are un subiect propriu, o întrebare la care răspunde și o pagină-destinație proprie pe site-ul dumneavoastră. Materialele se leagă între ele și trimit către paginile potrivite, toate cu atributul rel=\"sponsored\".",
      "Toate aparițiile stau în secțiunea comercială, poartă marcajul „Conținut comercial” și rămân la adrese permanente. Raportul lunar arată, pentru fiecare material, afișările, sursele de trafic și clicurile — cifre din contorizarea noastră, nu estimări. Materialele slabe se văd imediat în raport, iar calendarul se corectează din mers.",
      "Programul nu include și nu poate include comentariul unui jurnalist din redacție, includerea în rubricile de investigație sau vreo formă de acoperire editorială. Dacă în timpul contractului redacția publică un material critic despre dumneavoastră, seria continuă neschimbată — sau se încheie, dacă așa decideți; ceea ce nu se întâmplă este ca articolul redacției să dispară.",
    ],
    bodyRu: [
      "Один текст выполняет работу объявления, а не объяснения. Когда нужно разобрать тему с несколькими гранями — изменение регулирования, задевающее ваших клиентов, продукт с тремя категориями пользователей, методику, которую конкуренты упрощают до передёргивания, — нужна серия, а не разовое появление. Программа охватывает от трёх до восьми материалов, выходящих с согласованным интервалом.",
      "Календарь строится от того, что ищет аудитория, а не от вашего календаря коммуникаций. У каждого материала своя тема, свой вопрос, на который он отвечает, и своя посадочная страница на вашем сайте. Материалы связаны между собой и ведут на нужные страницы — все ссылки с атрибутом rel=\"sponsored\".",
      "Все публикации находятся в коммерческом разделе, снабжены пометкой «Коммерческий контент» и остаются по постоянным адресам. Ежемесячный отчёт показывает по каждому материалу показы, источники трафика и клики — цифры из нашего счётчика, а не оценки. Слабые материалы видны в отчёте сразу, и календарь корректируется на ходу.",
      "Программа не включает и не может включать комментарий журналиста редакции, попадание в расследовательские рубрики или какое-либо редакционное освещение. Если во время действия договора редакция опубликует критический материал о вас, серия продолжится без изменений — или закончится, если вы так решите; чего не произойдёт, так это исчезновения редакционного материала.",
    ],
    includesRo: [
      "Calendar de trei până la opt materiale, convenit în scris înainte de prima publicare.",
      "Redactarea sau editarea fiecărui text, de 3 000–6 000 de semne, în limba aleasă.",
      "Legături între materialele seriei și către paginile dumneavoastră, cu rel=\"sponsored\".",
      "Marcaj „Conținut comercial” și adresă permanentă pentru fiecare apariție.",
      "O apariție pe lună în blocul comercial al buletinului săptămânal.",
      "Raport lunar pe fiecare material: afișări, surse de trafic, clicuri și evoluția în căutări.",
    ],
    includesRu: [
      "Календарь из трёх–восьми материалов, письменно согласованный до первой публикации.",
      "Написание или редактура каждого текста объёмом 3 000–6 000 знаков на выбранном языке.",
      "Ссылки между материалами серии и на ваши страницы с атрибутом rel=\"sponsored\".",
      "Пометка «Коммерческий контент» и постоянный адрес для каждой публикации.",
      "Одно появление в месяц в коммерческом блоке еженедельной рассылки.",
      "Ежемесячный отчёт по каждому материалу: показы, источники трафика, клики и динамика в поиске.",
    ],
    forWhomRo:
      "Companiilor cu un mesaj care nu încape într-un singur text — bănci care lansează o linie de produse, dezvoltatori, grupuri industriale, firme de consultanță care își explică metodologia.",
    forWhomRu:
      "Компаниям, чьё сообщение не умещается в один текст, — банкам, запускающим линейку продуктов, девелоперам, промышленным группам, консалтинговым фирмам, объясняющим свою методику.",
    priceFromEur: 80,
    priceUnit: "once",
    turnaroundRo:
      "Primul material apare în 5 zile lucrătoare de la aprobarea calendarului; următoarele, la intervalul convenit. Prețul este pe material, la o serie de minimum trei.",
    turnaroundRu:
      "Первый материал выходит в течение 5 рабочих дней после утверждения календаря, последующие — с согласованным интервалом. Цена указана за материал, при серии от трёх.",
    disclosureRo:
      "Fiecare material din serie este marcat „Conținut comercial”, stă în afara fluxului editorial și a Google News, iar legăturile lui poartă rel=\"sponsored\". Contractul nu conține și nu poate conține clauze despre acoperirea jurnalistică a clientului.",
    disclosureRu:
      "Каждый материал серии помечен как «Коммерческий контент», находится вне редакционного потока и вне Google News, а его ссылки имеют атрибут rel=\"sponsored\". Договор не содержит и не может содержать положений о журналистском освещении клиента.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "branded-content",
    nameRo: "Branded content",
    nameRu: "Брендированный контент",
    leadRo:
      "Un material produs de la zero de studioul comercial: documentare, interviuri, date prelucrate, fotografie și punere în pagină proprie — marcat, ca orice conținut plătit.",
    leadRu:
      "Материал, созданный с нуля коммерческой студией: сбор фактуры, интервью, обработанные данные, съёмка и собственная вёрстка — с пометкой, как любой оплаченный контент.",
    bodyRo: [
      "Este cel mai laborios format din ofertă și singurul în care producem materialul integral. Studioul comercial — o echipă separată, care lucrează exclusiv pe comenzi plătite și nu are acces la subiectele redacției — merge la fața locului, ia interviuri, adună datele, le verifică și construiește o pagină cu punere în scenă proprie.",
      "Standardul de exactitate este cel al redacției, chiar dacă echipa este alta. Fiecare cifră primește o sursă indicată sub grafic, fiecare citat este confirmat de persoana care l-a rostit, iar afirmațiile pe care nu le putem susține nu ajung în text — inclusiv atunci când sunt afirmațiile dumneavoastră despre dumneavoastră. Un material pe care nimeni nu-l citește până la capăt nu vă folosește la nimic, iar cititorii noștri detectează exagerarea din al doilea paragraf.",
      "Rezultatul este o pagină cu identitate proprie: text lung, grafice construite din datele dumneavoastră, cu metodologia declarată, galerie foto sau video, citate cu nume și funcție. Are variantă pentru tema luminoasă și pentru cea întunecată a site-ului, funcționează pe telefon și poartă, ca orice material plătit, marcajul „Conținut comercial” și legături cu rel=\"sponsored\".",
      "Aveți dreptul să citiți materialul înainte de publicare și să cereți corectarea faptelor care vă privesc — un drept pe care nu îl are niciun subiect al unui material editorial, tocmai pentru că acesta este un produs comercial, nu unul jurnalistic. Nu aveți, în schimb, dreptul de a decide ce scrie redacția despre dumneavoastră în restul site-ului, nici înainte, nici după campanie.",
    ],
    bodyRu: [
      "Это самый трудоёмкий формат в прайсе и единственный, где материал производим мы целиком. Коммерческая студия — отдельная команда, работающая исключительно по оплаченным заказам и не имеющая доступа к темам редакции, — выезжает на место, берёт интервью, собирает данные, проверяет их и собирает страницу с собственной подачей.",
      "Требования к точности — редакционные, хотя команда другая. У каждой цифры указан источник под графиком, каждая цитата подтверждена тем, кто её произнёс, а утверждения, которые мы не можем обосновать, в текст не попадают — в том числе когда это ваши утверждения о себе. Материал, который никто не дочитывает, вам ничего не даёт, а наши читатели распознают преувеличение со второго абзаца.",
      "Результат — страница с собственным обликом: длинный текст, графики, построенные на ваших данных с указанной методикой, фотогалерея или видео, цитаты с именем и должностью. Есть вариант для светлой и для тёмной темы сайта, страница работает на телефоне и, как любой оплаченный материал, несёт пометку «Коммерческий контент» и ссылки с rel=\"sponsored\".",
      "Вы вправе прочитать материал до публикации и потребовать исправления фактов, которые вас касаются, — права, которого нет ни у одного героя редакционного материала, именно потому, что это коммерческий продукт, а не журналистский. Но у вас нет права решать, что редакция напишет о вас в остальной части сайта — ни до кампании, ни после.",
    ],
    includesRo: [
      "Documentare la fața locului: până la patru interviuri și o sesiune foto sau video.",
      "Text de 6 000–12 000 de semne, produs de studioul comercial, în română și în rusă.",
      "Grafice construite din datele dumneavoastră, cu metodologia declarată sub fiecare.",
      "Punere în pagină proprie, cu variantă pentru tema luminoasă și cea întunecată.",
      "Marcaj „Conținut comercial”, adresă permanentă și legături cu rel=\"sponsored\".",
      "Distribuție: buletin, canale sociale marcate ca publicitate și o săptămână de rotație în zonele de banner.",
    ],
    includesRu: [
      "Работа на месте: до четырёх интервью и одна фото- или видеосъёмка.",
      "Текст объёмом 6 000–12 000 знаков, созданный коммерческой студией, на румынском и русском.",
      "Графики на основе ваших данных с указанием методики под каждым.",
      "Собственная вёрстка страницы с вариантом для светлой и тёмной темы.",
      "Пометка «Коммерческий контент», постоянный адрес и ссылки с атрибутом rel=\"sponsored\".",
      "Дистрибуция: рассылка, социальные каналы с пометкой «реклама» и неделя ротации в баннерных зонах.",
    ],
    forWhomRo:
      "Companiilor mari și organizațiilor care au de povestit un proces, nu un produs — o investiție industrială, o restructurare, un raport de sustenabilitate, un studiu propriu de piață.",
    forWhomRu:
      "Крупным компаниям и организациям, которым есть что рассказать о процессе, а не о продукте, — промышленная инвестиция, реструктуризация, отчёт об устойчивом развитии, собственное исследование рынка.",
    priceFromEur: 400,
    priceUnit: "once",
    turnaroundRo:
      "15–20 de zile lucrătoare de la brief: documentare, două runde de corecturi și punerea în pagină.",
    turnaroundRu:
      "15–20 рабочих дней с момента брифа: сбор материала, два круга правок и вёрстка.",
    disclosureRo:
      "Branded contentul este produs de studioul comercial, nu de redacție, și este marcat „Conținut comercial” pe toată lungimea paginii. Nu apare în fluxul editorial și în Google News, iar legăturile lui poartă rel=\"sponsored\". Dreptul de a citi textul înainte de publicare se aplică exclusiv acestui material plătit, nu și materialelor redacției.",
    disclosureRu:
      "Брендированный контент создаёт коммерческая студия, а не редакция; пометка «Коммерческий контент» сопровождает страницу по всей длине. Он не попадает в редакционный поток и в Google News, а его ссылки имеют атрибут rel=\"sponsored\". Право прочитать текст до публикации распространяется только на этот оплаченный материал, но не на материалы редакции.",
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
    priceFromEur: 30,
    priceUnit: "month",
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
    priceFromEur: 60,
    priceUnit: "once",
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
    slug: "link-building-local",
    nameRo: "Link building local",
    nameRu: "Локальный линкбилдинг",
    leadRo:
      "Un pachet de legături sponsorizate în materiale cu ancorare geografică reală — pentru companiile care se măsoară în căutări locale, nu în trafic național.",
    leadRu:
      "Пакет спонсорских ссылок в материалах с настоящей географической привязкой — для компаний, которые измеряются локальным поиском, а не национальным трафиком.",
    bodyRo: [
      "Pachetul cuprinde de la trei până la cinci legături plasate în materiale comerciale distincte, fiecare ancorat într-un context regional real: raionul în care aveți sediul, orașul în care deschideți, sectorul în care lucrați. Textele-ancoră numesc serviciul și locul, pentru că așa are sens fraza pentru un cititor — nu pentru că am număra cuvinte-cheie.",
      "Regula de bază rămâne cea de la orice legătură plătită: atribut rel=\"sponsored\", pagină-gazdă marcată „Conținut comercial”, zero excepții. Ce vă dă în plus ancorarea locală este contextul: o mențiune a firmei într-un material despre piața din regiunea dumneavoastră cântărește altfel decât o mențiune într-un text generic. Ce nu vă putem da este o poziție în rezultatele Google — nimeni nu poate, iar cine v-o promite vinde altceva decât spune.",
      "Înainte de plasare verificăm ce primește legătura: pagina-destinație trebuie să existe, să se încarce și să conțină efectiv informația despre localitatea invocată. Verificăm și coerența datelor de contact — denumire, adresă, telefon — între materialele pe care le plasăm, pentru că inconsecvența lor este cel mai frecvent motiv pentru care o firmă nu apare unde ar trebui. Paginile-clonă, adresele fictive și schemele de schimb de legături le refuzăm.",
      "Primiți lista completă a adreselor înainte de plată, iar legăturile rămân active cel puțin douăzeci și patru de luni. Nu lucrăm cu rețele private de bloguri, nu revindem plasări cumpărate în altă parte și nu vindem legături în articolele redacției — nici pentru un client local, nici pentru altul.",
    ],
    bodyRu: [
      "Пакет включает от трёх до пяти ссылок в разных коммерческих материалах, каждый из которых привязан к реальному региональному контексту: район, где у вас офис, город, где вы открываетесь, сектор, в котором вы работаете. Анкоры называют услугу и место — потому что так фраза осмысленна для читателя, а не потому, что мы считаем ключевые слова.",
      "Базовое правило то же, что и для любой оплаченной ссылки: атрибут rel=\"sponsored\", страница-носитель с пометкой «Коммерческий контент», без исключений. Локальная привязка добавляет контекст: упоминание компании в материале о рынке вашего региона весит иначе, чем упоминание в общем тексте. Чего мы дать не можем — позиции в выдаче Google; их не может дать никто, а тот, кто обещает, продаёт не то, о чём говорит.",
      "До размещения мы смотрим, что именно получает ссылку: страница назначения должна существовать, открываться и действительно содержать информацию о заявленном населённом пункте. Проверяем и единообразие контактных данных — название, адрес, телефон — между размещаемыми материалами: их разнобой чаще всего и мешает компании появляться там, где следует. Страницы-клоны, вымышленные адреса и схемы обмена ссылками мы отклоняем.",
      "Полный список адресов вы получаете до оплаты, а ссылки остаются активными не менее двадцати четырёх месяцев. Мы не работаем с сетями сателлитов, не перепродаём размещения, купленные в другом месте, и не продаём ссылки в редакционных статьях — ни локальному клиенту, ни любому другому.",
    ],
    includesRo: [
      "Trei până la cinci legături sponsorizate, în materiale comerciale distincte.",
      "Ancorare într-un context regional real: localitatea, raionul sau sectorul în care lucrați.",
      "Verificarea coerenței datelor de contact — denumire, adresă, telefon — între plasări.",
      "Atributul rel=\"sponsored\" pe fiecare legătură și marcaj „Conținut comercial” pe fiecare pagină-gazdă.",
      "Lista completă a adreselor, comunicată înainte de plată.",
      "Raport de indexare la treizeci de zile și legături active cel puțin douăzeci și patru de luni.",
    ],
    includesRu: [
      "От трёх до пяти спонсорских ссылок в разных коммерческих материалах.",
      "Привязка к реальному региональному контексту: населённый пункт, район или сектор вашей работы.",
      "Проверка единообразия контактных данных — название, адрес, телефон — между размещениями.",
      "Атрибут rel=\"sponsored\" на каждой ссылке и пометка «Коммерческий контент» на каждой странице-носителе.",
      "Полный список адресов, сообщённый до оплаты.",
      "Отчёт об индексации через тридцать дней и активность ссылок не менее двадцати четырёх месяцев.",
    ],
    forWhomRo:
      "Cabinetelor de avocatură cu birou într-un singur oraș, clinicilor private, firmelor de construcții, service-urilor și rețelelor regionale care își aduc clienții dintr-o singură zonă.",
    forWhomRu:
      "Адвокатским бюро с офисом в одном городе, частным клиникам, строительным компаниям, сервисам и региональным сетям, которые получают клиентов из одной зоны.",
    priceFromEur: 200,
    priceUnit: "once",
    turnaroundRo:
      "7 zile lucrătoare pentru întregul pachet, dacă materialele-gazdă există deja; 12 zile dacă le scriem noi.",
    turnaroundRu:
      "7 рабочих дней на весь пакет, если материалы-носители уже существуют; 12 дней, если мы пишем их сами.",
    disclosureRo:
      "Toate legăturile din pachet poartă rel=\"sponsored\" și stau în pagini marcate „Conținut comercial”. Nu vindem legături în articolele redacției, nu promitem poziții în rezultatele căutării și nu ștergem, contra cost, informații publicate.",
    disclosureRu:
      "Все ссылки пакета имеют атрибут rel=\"sponsored\" и находятся на страницах с пометкой «Коммерческий контент». Мы не продаём ссылки в редакционных статьях, не обещаем позиций в поисковой выдаче и не удаляем за плату опубликованную информацию.",
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
    priceFromEur: 100,
    priceUnit: "once",
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
    slug: "comunicate-de-presa",
    nameRo: "Comunicate de presă",
    nameRu: "Пресс-релизы",
    leadRo:
      "Comunicatul dumneavoastră, publicat integral în secțiunea de comunicate, fără intervenție asupra conținutului și cu marcaj comercial.",
    leadRu:
      "Ваш пресс-релиз, опубликованный целиком в разделе пресс-релизов: без вмешательства в содержание и с коммерческой маркировкой.",
    bodyRo: [
      "Este cel mai simplu și cel mai ieftin format din ofertă, pentru că nu conține muncă redacțională. Comunicatul apare așa cum ni l-ați trimis, în secțiunea dedicată: nu îl rescriem, nu îi punem un titlu de-al nostru, nu îl interpretăm și nu îi adăugăm context. Ce facem este să confirmăm cine îl emite.",
      "Confirmarea emitentului nu se negociază: cerem denumirea juridică, o persoană de contact și un canal oficial prin care putem verifica textul. Refuzăm comunicatele care conțin acuzații la adresa unor persoane nominalizate fără un document în spate, afirmații despre terți care nu pot fi verificate sau oferte pentru activități ce necesită o licență pe care emitentul nu o are. Un comunicat nu devine adevărat pentru că a fost plătit.",
      "Marcajul este cel obișnuit: „Conținut comercial”, secțiune separată, în afara fluxului editorial și a Google News, fără prezență în partea redacțională a buletinului, cu legături rel=\"sponsored\". Un comunicat publicat aici nu este o știre a Corbul.md și nu poate fi citat ca atare — nici de dumneavoastră, nici de altcineva.",
      "Dacă subiectul comunicatului este de interes public, redacția își va face propriul material, cu propriile surse și cu propriile întrebări. Plata pentru publicarea comunicatului nu cumpără acel material, nu îl grăbește și nu îl oprește; sunt două lucruri complet separate, iar noi le ținem separate inclusiv atunci când asta ne costă un client.",
    ],
    bodyRu: [
      "Это самый простой и самый недорогой формат в прайсе, потому что он не содержит редакционной работы. Пресс-релиз выходит в том виде, в каком вы его прислали, в отдельном разделе: мы его не переписываем, не ставим свой заголовок, не интерпретируем и не добавляем контекст. Что мы делаем — подтверждаем, кто его выпускает.",
      "Подтверждение отправителя не обсуждается: мы запрашиваем юридическое наименование, контактное лицо и официальный канал, по которому можем сверить текст. Мы отклоняем релизы с обвинениями в адрес названных лиц без документа, с непроверяемыми утверждениями о третьих сторонах и с предложениями услуг, требующих лицензии, которой у отправителя нет. Пресс-релиз не становится правдой оттого, что за него заплатили.",
      "Маркировка стандартная: «Коммерческий контент», отдельный раздел, вне редакционного потока и вне Google News, без присутствия в редакционной части рассылки, ссылки с атрибутом rel=\"sponsored\". Опубликованный здесь релиз не является новостью Corbul.md и не может цитироваться как таковая — ни вами, ни кем-либо ещё.",
      "Если тема релиза общественно значима, редакция сделает собственный материал — со своими источниками и своими вопросами. Оплата публикации релиза этот материал не покупает, не ускоряет и не останавливает; это две совершенно разные вещи, и мы держим их порознь даже тогда, когда это стоит нам клиента.",
    ],
    includesRo: [
      "Publicarea integrală a comunicatului, până la 3 000 de semne, în forma trimisă.",
      "Adresă permanentă în secțiunea de comunicate, cu marcajul „Conținut comercial”.",
      "Datele de contact ale emitentului și o legătură către site, cu rel=\"sponsored\".",
      "O imagine sau o siglă și, la cerere, un document atașat în format PDF.",
      "Verificarea identității emitentului înainte de publicare.",
      "Corectura ortografică, dacă o cereți — conținutul rămâne neschimbat.",
    ],
    includesRu: [
      "Публикация пресс-релиза целиком, до 3 000 знаков, в присланном виде.",
      "Постоянный адрес в разделе пресс-релизов с пометкой «Коммерческий контент».",
      "Контактные данные отправителя и ссылка на сайт с атрибутом rel=\"sponsored\".",
      "Изображение или логотип и, по запросу, приложенный документ в формате PDF.",
      "Проверка личности отправителя до публикации.",
      "Корректорская вычитка по вашей просьбе — содержание остаётся без изменений.",
    ],
    forWhomRo:
      "Instituțiilor, asociațiilor patronale, companiilor și birourilor de presă care trebuie să facă publică o poziție oficială, o numire sau un rezultat financiar, la o adresă citabilă.",
    forWhomRu:
      "Учреждениям, объединениям работодателей, компаниям и пресс-службам, которым нужно обнародовать официальную позицию, назначение или финансовый результат по цитируемому адресу.",
    priceFromEur: 50,
    priceUnit: "once",
    turnaroundRo:
      "24 de ore lucrătoare de la primirea comunicatului și confirmarea emitentului.",
    turnaroundRu:
      "24 рабочих часа с момента получения релиза и подтверждения отправителя.",
    disclosureRo:
      "Comunicatele sunt marcate „Conținut comercial”, stau într-o secțiune separată, în afara fluxului editorial și a Google News, iar legăturile lor poartă rel=\"sponsored\". Publicarea unui comunicat nu obligă redacția la nimic și nu o împiedică să scrie critic despre emitent.",
    disclosureRu:
      "Пресс-релизы помечены как «Коммерческий контент», размещаются в отдельном разделе вне редакционного потока и вне Google News, а их ссылки имеют атрибут rel=\"sponsored\". Публикация релиза ни к чему редакцию не обязывает и не мешает ей писать об отправителе критически.",
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
    priceFromEur: 40,
    priceUnit: "once",
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
    slug: "sponsorizare-newsletter",
    nameRo: "Sponsorizare newsletter",
    nameRu: "Спонсорство рассылки",
    leadRo:
      "Un bloc marcat în buletinul săptămânal al Corbul.md, un singur sponsor pe ediție, cu raport de deschideri și clicuri la 72 de ore.",
    leadRu:
      "Помеченный блок в еженедельной рассылке Corbul.md: один спонсор на выпуск и отчёт об открытиях и кликах через 72 часа.",
    bodyRo: [
      "Buletinul săptămânal adună selecția redacției pentru cei care nu au timp să treacă zilnic pe site: avocați, bancheri, contabili-șefi, funcționari și consultanți care l-au cerut ei înșiși. Sponsorizarea înseamnă un singur bloc, la un singur sponsor pe ediție, plasat după selecția editorială și despărțit vizibil de ea, cu eticheta „Publicitate” deasupra.",
      "Blocul are un titlu de până la 60 de semne, un text de până la 400, sigla și o singură legătură. Îl scrieți dumneavoastră sau îl scriem noi, dacă ne trimiteți brieful. Ce nu se vinde: subiectul mesajului, primul ecran al buletinului, poziția în selecția editorială și expedierile separate, „dedicate” — nu trimitem abonaților mesaje care conțin doar publicitate.",
      "Nu predăm lista de abonați nimănui, în nicio formă, și nu acceptăm în buletin pixeli de urmărire ai advertiserului sau ai agenției lui. Măsurarea este a noastră: raportăm trimiterile, deschiderile, clicurile pe legătura dumneavoastră și rata de dezabonare a ediției — inclusiv atunci când cifrele sunt sub media pe care ați sperat-o. Nu raportăm procente de industrie și nu rotunjim în sus.",
      "Selecția editorială a fiecărei ediții se face înainte ca redacția să afle cine este sponsorul săptămânii, iar prezența unui sponsor nu adaugă, nu scoate și nu mută niciun material din buletin.",
    ],
    bodyRu: [
      "Еженедельная рассылка собирает редакционную подборку для тех, у кого нет времени заходить на сайт каждый день: адвокатов, банкиров, главных бухгалтеров, чиновников и консультантов, которые сами на неё подписались. Спонсорство — это один блок, один спонсор на выпуск, размещённый после редакционной подборки и визуально отделённый от неё, с пометкой «Реклама» сверху.",
      "В блоке — заголовок до 60 знаков, текст до 400, логотип и одна ссылка. Текст пишете вы или пишем мы, если пришлёте бриф. Что не продаётся: тема письма, первый экран рассылки, место в редакционной подборке и отдельные, «выделенные» рассылки — писем, состоящих из одной рекламы, мы подписчикам не отправляем.",
      "Мы не передаём список подписчиков никому и ни в каком виде и не допускаем в рассылку трекинговые пиксели рекламодателя или его агентства. Измеряем мы сами: отчитываемся об отправках, открытиях, кликах по вашей ссылке и уровне отписок выпуска — в том числе когда цифры ниже ожидаемых. Отраслевых средних мы не приводим и вверх не округляем.",
      "Редакционная подборка каждого выпуска формируется до того, как редакция узнаёт, кто спонсор недели, и присутствие спонсора не добавляет, не убирает и не передвигает в рассылке ни один материал.",
    ],
    includesRo: [
      "Un bloc sponsorizat într-o ediție a buletinului săptămânal, marcat „Publicitate”.",
      "Titlu de până la 60 de semne, text de până la 400 și siglă, în limba ediției.",
      "O legătură urmărită către pagina dumneavoastră, cu etichetele de campanie convenite.",
      "Redactarea blocului de către noi, dacă trimiteți doar brieful.",
      "Exclusivitate: un singur sponsor pe ediție, fără alte blocuri comerciale.",
      "Raport la 72 de ore: trimiteri, deschideri, clicuri și rata de dezabonare a ediției.",
    ],
    includesRu: [
      "Спонсорский блок в одном выпуске еженедельной рассылки с пометкой «Реклама».",
      "Заголовок до 60 знаков, текст до 400 и логотип на языке выпуска.",
      "Отслеживаемая ссылка на вашу страницу с согласованными метками кампании.",
      "Написание блока с нашей стороны, если вы присылаете только бриф.",
      "Эксклюзивность: один спонсор на выпуск, без других коммерческих блоков.",
      "Отчёт через 72 часа: отправки, открытия, клики и уровень отписок выпуска.",
    ],
    forWhomRo:
      "Serviciilor profesionale, evenimentelor cu bilet, produselor financiare și programelor de formare care au nevoie de un singur contact bine țintit, nu de afișări în masă.",
    forWhomRu:
      "Профессиональным услугам, платным мероприятиям, финансовым продуктам и образовательным программам, которым нужен один точный контакт, а не массовые показы.",
    priceFromEur: 60,
    priceUnit: "once",
    turnaroundRo:
      "Rezervarea ediției se face cu 7 zile înainte; textul și sigla se trimit cu cel puțin 3 zile înainte de expediere.",
    turnaroundRu:
      "Выпуск бронируется за 7 дней; текст и логотип присылаются не позднее чем за 3 дня до отправки.",
    disclosureRo:
      "Blocul sponsorizat este marcat „Publicitate” și separat de selecția redacției, care se face independent de contractele comerciale. Nu vindem subiectul mesajului, nu facem expedieri exclusiv publicitare și nu punem la dispoziție lista de abonați.",
    disclosureRu:
      "Спонсорский блок помечен как «Реклама» и отделён от редакционной подборки, которая формируется независимо от коммерческих договоров. Мы не продаём тему письма, не делаем чисто рекламных рассылок и не предоставляем список подписчиков.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "publicitate-locala",
    nameRo: "Publicitate locală",
    nameRu: "Локальная реклама",
    leadRo:
      "Un pachet pentru o singură regiune: bannere afișate cititorilor din zona aleasă și un material comercial ancorat în contextul ei.",
    leadRu:
      "Пакет для одного региона: баннеры, показанные читателям выбранной зоны, и коммерческий материал, привязанный к её контексту.",
    bodyRo: [
      "Traficul național nu folosește la nimic unei firme care lucrează într-un singur raion. Pachetul limitează livrarea bannerelor la cititorii aflați în regiunea aleasă și o dublează cu un material comercial despre prezența dumneavoastră acolo — o deschidere, o investiție, un serviciu nou, o echipă locală.",
      "Delimitarea geografică se face după adresa IP a cititorului, la nivel de regiune. Este o aproximare și o numim așa: nu cumpărăm date de localizare, nu construim profiluri de utilizator și nu instalăm urmăritoare ale terților pe site pentru asta. Raportul de final arată onest câte dintre afișări au căzut efectiv în regiunea-țintă și câte în afara ei.",
      "Pachetul acoperă treizeci de zile de rotație în zonele alese, materialul comercial și, dacă promovați o deschidere sau un eveniment, o mențiune în agendă. Toate elementele poartă marcajele obișnuite: „Publicitate” deasupra creației, „Conținut comercial” pe material, rel=\"sponsored\" pe legături.",
      "Un lucru care trebuie spus direct, pentru că în presa regională se practică des contrariul: nu vindem „liniște” și nu vindem protecție. Faptul că o companie este client într-o regiune nu ne împiedică să scriem despre licitațiile din acea regiune, despre administrația ei sau despre client. Refuzăm și publicitatea electorală, indiferent cum este ambalată.",
    ],
    bodyRu: [
      "Национальный трафик бесполезен фирме, которая работает в одном районе. Пакет ограничивает показ баннеров читателями выбранного региона и дополняет их коммерческим материалом о вашем присутствии там — открытие, инвестиция, новая услуга, местная команда.",
      "Географическое ограничение работает по IP-адресу читателя, на уровне региона. Это приближение, и мы так его и называем: мы не покупаем данные о местоположении, не строим профили пользователей и не ставим ради этого сторонние трекеры на сайт. Итоговый отчёт честно показывает, сколько показов пришлось на целевой регион, а сколько — за его пределы.",
      "Пакет включает тридцать дней ротации в выбранных зонах, коммерческий материал и, если вы продвигаете открытие или мероприятие, упоминание в календаре. Все элементы несут обычные пометки: «Реклама» над креативом, «Коммерческий контент» на материале, rel=\"sponsored\" на ссылках.",
      "Одну вещь нужно сказать прямо, потому что в региональной прессе часто практикуют обратное: мы не продаём «тишину» и не продаём защиту. То, что компания является рекламодателем в регионе, не мешает нам писать о тендерах в этом регионе, о его администрации и о самом клиенте. Предвыборную рекламу мы тоже не берём — в какую бы упаковку она ни была завёрнута.",
    ],
    includesRo: [
      "Treizeci de zile de rotație în zonele de banner alese, limitate la regiunea convenită.",
      "Un material comercial de 3 000–5 000 de semne, ancorat în contextul local.",
      "Adaptarea creațiilor pentru tema luminoasă și cea întunecată, dacă nu le aveți.",
      "Marcaj „Publicitate” deasupra fiecărei creații și „Conținut comercial” pe material.",
      "Menționare în agendă, dacă promovați o deschidere sau un eveniment local.",
      "Raport final: afișări, clicuri, CTR și ponderea afișărilor căzute în regiunea-țintă.",
    ],
    includesRu: [
      "Тридцать дней ротации в выбранных баннерных зонах с ограничением по согласованному региону.",
      "Коммерческий материал объёмом 3 000–5 000 знаков, привязанный к местному контексту.",
      "Адаптация креативов под светлую и тёмную тему, если у вас их нет.",
      "Пометка «Реклама» над каждым креативом и «Коммерческий контент» на материале.",
      "Упоминание в календаре, если вы продвигаете открытие или локальное мероприятие.",
      "Итоговый отчёт: показы, клики, CTR и доля показов, пришедшихся на целевой регион.",
    ],
    forWhomRo:
      "Dezvoltatorilor imobiliari, rețelelor de retail, clinicilor private, fermelor mari și furnizorilor de servicii industriale care își aduc clienții dintr-o singură zonă.",
    forWhomRu:
      "Девелоперам, розничным сетям, частным клиникам, крупным фермам и поставщикам промышленных услуг, которые получают клиентов из одной зоны.",
    priceFromEur: 150,
    priceUnit: "once",
    turnaroundRo:
      "Campania pornește în 5 zile lucrătoare de la primirea creațiilor și a materialelor pentru text.",
    turnaroundRu:
      "Кампания стартует в течение 5 рабочих дней после получения креативов и материалов для текста.",
    disclosureRo:
      "Întregul pachet este publicitate și este marcat ca atare. Delimitarea geografică este aproximativă și se raportează ca atare. Nu vindem tăcerea redacției într-o regiune și nu acceptăm publicitate electorală.",
    disclosureRu:
      "Весь пакет является рекламой и помечен соответственно. Географическое ограничение приблизительно, и в отчёте оно указано именно так. Мы не продаём молчание редакции в регионе и не принимаем предвыборную рекламу.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "pr-local",
    nameRo: "PR local",
    nameRu: "Локальный PR",
    leadRo:
      "Un abonament lunar de prezență comercială într-o regiune: un material pe lună, rotație de bannere locală și consultanță de comunicare — fără nicio promisiune editorială.",
    leadRu:
      "Ежемесячная подписка на коммерческое присутствие в регионе: один материал в месяц, локальная ротация баннеров и консультации по коммуникации — без каких-либо редакционных обещаний.",
    bodyRo: [
      "Diferența dintre o apariție și o prezență este ritmul. Abonamentul acoperă, în fiecare lună, un material comercial la alegere — comunicat, advertorial sau interviu cu un director —, o rotație de bannere limitată la regiunea convenită și un loc fix în blocul comercial al buletinului. Contractul se face pe trei, șase sau douăsprezece luni și se poate întrerupe cu un preaviz de treizeci de zile.",
      "Partea de consultanță este cea pentru care companiile regionale plătesc de fapt: vă ajutăm să formulați mesaje care rezistă la o citire critică. Ce date puteți publica și ce date vă vor fi cerute mai departe, ce afirmații puteți susține cu un document, cum se răspunde public atunci când ceva a mers prost și de ce tăcerea costă, de regulă, mai mult decât un răspuns incomod. Consultăm; nu plasăm materiale în alte publicații și nu „aranjăm” nimic cu colegi din alte redacții.",
      "Aici trebuie spus fără menajamente ce nu cuprinde serviciul, pentru că exact aceste lucruri se vând sub numele de „PR local” în Republica Moldova: nu oferim acoperire favorabilă, nu oferim retragerea unui material publicat, nu oferim intermediere cu redacția și nu vindem tăcerea nimănui. Dacă cineva vă propune așa ceva în numele Corbul.md, minte — scrieți-ne, vrem să știm.",
      "Redacția află despre existența contractului la fel ca despre oricare altul: din lista contabilă, la sfârșit de lună. Nu are acces la ședințele de consultanță, iar consultanții nu au acces la subiectele în lucru. Raportul lunar rămâne verificabil: afișări, clicuri, materiale publicate, zone ocupate.",
    ],
    bodyRu: [
      "Разница между появлением и присутствием — в ритме. Подписка включает ежемесячно один коммерческий материал на выбор — пресс-релиз, адверториал или интервью с руководителем, — ротацию баннеров с ограничением по согласованному региону и постоянное место в коммерческом блоке рассылки. Договор заключается на три, шесть или двенадцать месяцев и расторгается с уведомлением за тридцать дней.",
      "Консультационная часть — это то, за что региональные компании платят на самом деле: мы помогаем формулировать сообщения, выдерживающие критическое прочтение. Какие данные можно публиковать и какие у вас после этого спросят, какие утверждения вы сможете подтвердить документом, как отвечать публично, когда что-то пошло не так, и почему молчание обычно обходится дороже неудобного ответа. Мы консультируем; мы не размещаем материалы в других изданиях и ничего не «улаживаем» с коллегами из других редакций.",
      "Здесь нужно без обиняков сказать, чего услуга не включает, — потому что именно это в Молдове и продают под названием «локальный PR»: мы не предлагаем благоприятного освещения, не предлагаем снятия опубликованного материала, не предлагаем посредничества с редакцией и не продаём ничьего молчания. Если кто-то предлагает вам подобное от имени Corbul.md — он лжёт; напишите нам, мы хотим об этом знать.",
      "О существовании договора редакция узнаёт так же, как о любом другом: из бухгалтерского списка в конце месяца. Доступа к консультационным встречам у неё нет, а у консультантов нет доступа к темам в работе. Ежемесячный отчёт остаётся проверяемым: показы, клики, опубликованные материалы, занятые зоны.",
    ],
    includesRo: [
      "Un material comercial pe lună — comunicat, advertorial sau interviu, la alegere.",
      "Rotație lunară de bannere, limitată la regiunea convenită, cu limitare de frecvență.",
      "Un loc fix, marcat, în blocul comercial al buletinului săptămânal.",
      "O ședință lunară de consultanță pe mesaje și pe comunicarea în situații dificile.",
      "Prioritate la rezervarea zonelor și a datelor de publicare, în limita disponibilului.",
      "Raport lunar: afișări, clicuri, materiale publicate și zonele ocupate.",
    ],
    includesRu: [
      "Один коммерческий материал в месяц — пресс-релиз, адверториал или интервью, на выбор.",
      "Ежемесячная ротация баннеров с ограничением по региону и по частоте показа.",
      "Постоянное помеченное место в коммерческом блоке еженедельной рассылки.",
      "Ежемесячная консультационная встреча по сообщениям и коммуникации в сложных ситуациях.",
      "Приоритет при бронировании зон и дат публикации в пределах доступного.",
      "Ежемесячный отчёт: показы, клики, опубликованные материалы и занятые зоны.",
    ],
    forWhomRo:
      "Companiilor regionale cu miză publică — fabrici, ferme mari, dezvoltatori, operatori privați de servicii comunale — care comunică lunar și vor s-o facă fără ambiguități.",
    forWhomRu:
      "Региональным компаниям с публичной значимостью — заводам, крупным фермам, девелоперам, частным операторам коммунальных услуг, — которые общаются с публикой ежемесячно и хотят делать это без двусмысленностей.",
    priceFromEur: 300,
    priceUnit: "month",
    turnaroundRo:
      "Prima lună începe în 7 zile lucrătoare de la semnare; materialele se planifică la începutul fiecărei luni.",
    turnaroundRu:
      "Первый месяц начинается в течение 7 рабочих дней после подписания; материалы планируются в начале каждого месяца.",
    disclosureRo:
      "PR local înseamnă vizibilitate comercială, nu influență. Toate aparițiile sunt marcate ca publicitate, iar contractul nu conține clauze despre acoperirea jurnalistică: redacția scrie despre client și despre regiunea lui exact ca despre oricine altcineva.",
    disclosureRu:
      "Локальный PR — это коммерческая видимость, а не влияние. Все размещения помечены как реклама, а договор не содержит положений о журналистском освещении: о клиенте и о его регионе редакция пишет ровно так же, как обо всех остальных.",
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
    priceFromEur: 250,
    priceUnit: "month",
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
  priceFromEur: number;
  priceUnit: AdPriceUnit;
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
    priceFromEur: service.priceFromEur,
    priceUnit: service.priceUnit,
    turnaround: ru ? service.turnaroundRu : service.turnaroundRo,
    disclosure: ru ? service.disclosureRu : service.disclosureRo,
  };
}

export function localizedAdServices(locale: Locale): LocalizedAdService[] {
  return AD_SERVICES.map((service) => localizeAdService(service, locale));
}

/**
 * Suma singură: „80 €" / „80 €" (ru). `narrowSymbol` pentru că ro-RO
 * scrie altfel „80 EUR", iar grila comercială se citește în simbol.
 */
export function formatEur(amount: number, locale: Locale): string {
  return formatMoney(amount, locale, "EUR", { currencyDisplay: "narrowSymbol" });
}

/**
 * Eticheta de preț a unui serviciu: „80 €" sau „30 € / lună".
 * Sufixul lunar vine din stratul de interfață (`ads.priceUnitMonth`), ca să
 * rămână traductibil; datele nu cunosc textele de interfață.
 */
export function formatServicePrice(
  service: Pick<LocalizedAdService, "priceFromEur" | "priceUnit">,
  locale: Locale,
  monthSuffix: string,
): string {
  const amount = formatEur(service.priceFromEur, locale);
  return service.priceUnit === "month" ? `${amount} ${monthSuffix}` : amount;
}
