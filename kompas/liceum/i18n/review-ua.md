# Kompas Liceum: Ukrainian interface for one read by a Ukrainian speaker (v2.15)

Made by AI (Claude), not yet read by a native speaker. Please read the Ukrainian column and write a better wording in the last column where it sounds wrong, stiff or too Polish. `{placeholders}` and HTML tags (`<b>`, `<br>`, `<span>`) must stay as they are.

Open the app in Ukrainian: https://clickrak.github.io/demos/kompas/liceum/?lang=ua (add `&test` to get the test kids under "Тестовий режим" on the start screen).

In v2.15 only the interface is Ukrainian. Questions, directions, profile names, class names and school names are still Polish (v2.16 translates the questions and directions; school and class names stay Polish on purpose).

## Screens to look at (phone and computer)

1. Start (`#/start`): title, the note "Це не тест", what is in the database.
2. Where (`#/gdzie`): Kraków or Tychy + GZM, districts, travel time note.
3. Questions (`#/swiaty`, `#/zajecia`, `#/sytuacje`, `#/styl`, `#/wartosci`, `#/mocne`): buttons, hints at the bottom, "крок 3 з 8".
4. School (`#/szkola`): слабо / добре / чудово, exact marks, bilingual classes, the parent note "Для батьків: як ми рахуємо".
5. Compass (`#/wyniki`): north / close alternatives, chance counts (реальні, варто поборотися, амбітні), plan until May 2027.
6. One profile (`#/profil`): filters, school cards, map, parent table.
7. My list (`#/lista`), parent summary (`#/rodzic`), all schools (`#/szkoly`), sources (`#/zrodla`).
8. The saved results file (button "Зберегти"): Markdown text in Ukrainian.

## Glossary (one wording per term)

| Polish | Ukrainian | explanation | correction |
|---|---|---|---|
| liceum | ліцей | Школа після 8 класу, яка веде до матури. Після матури можна вступати до вишу. |  |
| technikum | технікум | Школа з професією і матурою. Після 8 класу можна піти до технікуму замість ліцею. |  |
| szkoła branżowa | галузева школа | Школа, де вчать професії. Це ще один шлях після 8 класу, окрім ліцею й технікуму. |  |
| rozszerzenia | розширені предмети | Предмети, які в класі вивчають глибше. Вони залежать від профілю класу. |  |
| próg punktowy | прохідний бал | Найнижчий результат, який торік дав місце в класі. Цього року він буде іншим: зазвичай на кілька балів вище або нижче. |  |
| egzamin ósmoklasisty | іспит восьмикласника | Іспит після 8 класу з польської, математики та іноземної мови. Він дає до 100 балів для вступу. |  |
| świadectwo | свідоцтво | Документ з оцінками за 8 клас. Воно дає до 100 балів для вступу. Свідоцтво з відзнакою («червона смужка») додає 7 балів. |  |
| rekrutacja | вступна кампанія | Час, коли подають заяви до шкіл. Терміни щороку оголошує шкільний куратор, зазвичай у січні. |  |
| klasa dwujęzyczna | двомовний клас | Клас, де частина уроків, напр. географія чи біологія, проходить англійською. Крім балів, треба скласти мовний тест у школі. |  |
| kurator oświaty | шкільний куратор | Посадовець, який оголошує терміни вступної кампанії в регіоні. Їх варто дивитися на його сторінці. |  |
| punkty rekrutacyjne | вступні бали | З них складається результат для вступу, щонайбільше 200. Іспит восьмикласника дає до 100 балів, свідоцтво до 100 балів. |  |

## All interface texts (479 keys)

| key | Polski | Українська | correction |
|---|---|---|---|
| `lic.meta.title` | Kompas Liceum | Kompas Liceum |  |
| `lic.meta.desc` | Od tego, co lubisz, do klas w liceach i technikach w Krakowie albo w Tychach i Metropolii GZM. Wersja {v}. | Від того, що ти любиш, до класів у ліцеях (liceum) і технікумах (technikum) у Кракові або в Тихах і Метрополії GZM. Версія {v}. |  |
| `lic.nav.chapters` | Rozdziały | Розділи |  |
| `lic.nav.ja` | Ja | Я |  |
| `lic.nav.szkola` | Szkoła | Школа |  |
| `lic.nav.wyniki` | Kompas | Компас |  |
| `lic.nav.szkoly` | Szkoły | Школи |  |
| `lic.nav.lista` | Moja lista | Мій список |  |
| `lic.head.save` | Zapisz | Зберегти |  |
| `lic.head.save.title` | Pobierz plik z odpowiedziami, żeby wrócić później | Завантаж файл з відповідями, щоб повернутися пізніше |  |
| `lic.head.lang` | Język | Мова |  |
| `lic.head.comfort` | Wygodniej: większy tekst, mniej ruchu | Зручніше: більший текст, менше руху |  |
| `lic.head.comfort.title` | Większy tekst, mniej ruchu | Більший текст, менше руху |  |
| `lic.comfort.group` | Wygoda | Зручність |  |
| `lic.comfort.big` | większy tekst | більший текст |  |
| `lic.comfort.calm` | spokojniej (mniej ruchu) | спокійніше (менше руху) |  |
| `lic.loading` | Ładuję… | Завантажую… |  |
| `lic.foot.privacy` | Odpowiedzi są tylko w tej karcie przeglądarki. Zapisujesz je w pliku, który zostaje u ciebie. | Відповіді зберігаються лише в цій вкладці браузера. Ти можеш зберегти їх у файл, який залишається в тебе. |  |
| `lic.foot.save` | Zapisz postęp do pliku | Зберегти прогрес у файл |  |
| `lic.foot.load` | Wczytaj plik | Завантажити файл |  |
| `lic.foot.sources` | Źródła danych | Джерела даних |  |
| `lic.foot.ai` | Tłumaczenie zrobiła sztuczna inteligencja i nie przeczytał go jeszcze nikt, kto zna ukraiński jak ojczysty. | Переклад зроблено за допомогою ШІ і ще не перевірений носієм мови |  |
| `lic.foot.month` | listopad 2026 | листопад 2026 |  |
| `lic.foot.areas` | Kraków albo Tychy i GZM | Краків або Тихи і GZM |  |
| `lic.theme.toLight` | Włącz jasny motyw | Увімкнути світлу тему |  |
| `lic.theme.toDark` | Włącz ciemny motyw | Увімкнути темну тему |  |
| `lic.theme.light` | Jasny motyw | Світла тема |  |
| `lic.theme.dark` | Ciemny motyw | Темна тема |  |
| `lic.skin.calm` | Spokojny | Спокійний |  |
| `lic.skin.neon` | Neon | Неон |  |
| `lic.skin.pop` | Pop art | Поп-арт |  |
| `lic.skin.label` | Wygląd: {cur}. Zmień na: {next} | Вигляд: {cur}. Змінити на: {next} |  |
| `lic.skin.group` | Wygląd aplikacji | Вигляд застосунку |  |
| `lic.skin.pick` | Wygląd: | Вигляд: |  |
| `lic.region.krakow.name` | Kraków i okolice | Краків і околиці |  |
| `lic.region.krakow.in` | w Krakowie | у Кракові |  |
| `lic.region.krakow.later` | Skawina, Zabierzów i inne miejscowości powiatu krakowskiego dojdą później. | Скавіна, Заб'єжув та інші містечка Краківського повіту додамо пізніше. |  |
| `lic.region.krakow.curator` | Małopolskiego Kuratora Oświaty | Малопольського шкільного куратора (kurator oświaty) |  |
| `lic.region.krakow.window` | w 2026 rekrutacja trwała od 18 maja do 28 lipca; terminy na 2027 ogłasza Małopolski Kurator Oświaty, zwykle w styczniu | у 2026 вступна кампанія тривала з 18 травня до 28 липня; терміни на 2027 оголошує Малопольський шкільний куратор, зазвичай у січні |  |
| `lic.region.tychy.name` | Tychy i Metropolia (GZM) | Тихи і Метрополія (GZM) |  |
| `lic.region.tychy.in` | w Tychach i Metropolii | у Тихах і Метрополії |  |
| `lic.region.tychy.note` | Tychy (4 licea, 6 z 6 techników) i pierwsze szkoły z czołówki listy GZM: III, VIII i II LO w Katowicach, IV LO w Sosnowcu, Technikum nr 1 w Gliwicach. Kolejne dochodzą w kolejności z rankingu matur. | Тихи (4 ліцеї, 6 із 6 технікумів) і перші школи з початку списку GZM: III, VIII і II LO у Катовіце, IV LO у Сосновці, Технікум № 1 у Гливицях. Наступні додаються в порядку рейтингу матури. |  |
| `lic.region.tychy.later` | Następne szkoły GZM dochodzą według listy od najlepszych wyników matur. | Наступні школи GZM додаються за списком від найкращих результатів матури. |  |
| `lic.region.tychy.curator` | Śląskiego Kuratora Oświaty | Сілезького шкільного куратора (kurator oświaty) |  |
| `lic.town.krakow` | Kraków | Краків |  |
| `lic.town.tychy` | Tychy | Тихи |  |
| `lic.town.katowice` | Katowice | Катовіце |  |
| `lic.town.sosnowiec` | Sosnowiec | Сосновець |  |
| `lic.town.gliwice` | Gliwice | Гливиці |  |
| `lic.cfg.thresholdNote` | Próg to najniższy wynik, który dał miejsce w klasie w rekrutacji 2026. W 2027 będzie inny: zwykle o kilka punktów w górę lub w dół, w popularnych klasach więcej. | Прохідний бал (próg punktowy) — це найнижчий результат, який дав місце в класі під час вступної кампанії 2026. У 2027 він буде іншим: зазвичай на кілька балів вище або нижче, у популярних класах — більше. |  |
| `lic.cfg.examDates` | 10–12 maja 2027 | 10–12 травня 2027 |  |
| `lic.min` | ok. {m} min | бл. {m} хв |  |
| `lic.towns.aria` | Gdzie szukasz szkoły | Де ти шукаєш школу |  |
| `lic.bi.dw` | dwujęzyczna | двомовний |  |
| `lic.bi.mn` | międzynarodowa | міжнародний |  |
| `lic.bi.wst` | klasa wstępna | підготовчий |  |
| `lic.bi.title` | Trzeba zdać test w szkole | Треба скласти тест у школі |  |
| `lic.bi.test` | test w szkole | тест у школі |  |
| `lic.entry.tag` | egzamin wstępny / przesłuchanie w szkole | вступний іспит / прослуховування в школі |  |
| `lic.entry.plastyczny` | egzamin wstępny w szkole | вступний іспит у школі |  |
| `lic.entry.muzyczny` | przesłuchanie w szkole | прослуховування в школі |  |
| `lic.lang.test` | test językowy w szkole | мовний тест у школі |  |
| `lic.langtest.w-zasiegu` | test językowy w zasięgu | мовний тест тобі до снаги |  |
| `lic.langtest.do-pracy` | test językowy: trzeba popracować | мовний тест: треба попрацювати |  |
| `lic.langtest.trudny` | test językowy będzie trudny | мовний тест буде складним |  |
| `lic.langtest.predyspozycje` | test predyspozycji (nowy język od zera) | тест на схильність до мов (нова мова з нуля) |  |
| `lic.chance.realna` | realna szansa | реальний шанс |  |
| `lic.chance.zawalczenia` | do zawalczenia | варто поборотися |  |
| `lic.chance.ambitna` | ambitna | амбітний |  |
| `lic.chance.szkola` | do sprawdzenia w szkole | перевірити в школі |  |
| `lic.chance.unknown` | wpisz, jak ci idzie | напиши, як тобі йде |  |
| `lic.level.over` | powyżej zeszłorocznego progu | вище за торішній прохідний бал |  |
| `lic.level.near` | blisko progu, ale nad nim | близько до прохідного балу, але вище |  |
| `lic.level.close` | tuż pod progiem | трохи нижче за прохідний бал |  |
| `lic.level.under` | poniżej progu | нижче за прохідний бал |  |
| `lic.level.range` | w zakresie szkoły, próg klasy do sprawdzenia | у межах школи, прохідний бал класу треба перевірити |  |
| `lic.level.entry` | egzamin wstępny albo przesłuchanie w szkole, bez progu punktowego | вступний іспит або прослуховування в школі, без прохідного балу |  |
| `lic.level.unknown` | wpisz punkty, żeby zobaczyć | впиши бали, щоб побачити |  |
| `lic.subj.polski` | język polski | польська мова |  |
| `lic.subj.matematyka` | matematyka | математика |  |
| `lic.subj.angielski` | język angielski | англійська мова |  |
| `lic.subj.fizyka` | fizyka | фізика |  |
| `lic.subj.informatyka` | informatyka | інформатика |  |
| `lic.subj.biologia` | biologia | біологія |  |
| `lic.subj.chemia` | chemia | хімія |  |
| `lic.subj.geografia` | geografia | географія |  |
| `lic.subj.historia` | historia | історія |  |
| `lic.subj.wos` | wiedza o społeczeństwie | суспільствознавство |  |
| `lic.lever.grade` | ocena z przedmiotu „{subj}” o stopień wyżej ({a} → {b}) to {n} pkt | оцінка з предмета «{subj}» на один бал вище ({a} → {b}) дає {n} б. |  |
| `lic.lever.exam` | każde 10 punktów procentowych więcej z matematyki albo polskiego na egzaminie to 3,5 pkt, z języka obcego 3 pkt | кожні 10 відсоткових пунктів більше з математики або польської на іспиті дають 3,5 б., з іноземної мови — 3 б. |  |
| `lic.lever.stripe` | świadectwo z wyróżnieniem (czerwony pasek) to 7 pkt | свідоцтво з відзнакою («червона смужка») дає 7 б. |  |
| `lic.lever.volunteering` | wolontariat wpisany na świadectwie to 3 pkt | волонтерство, вписане у свідоцтво, дає 3 б. |  |
| `lic.compass.N` | północ: najlepiej pasuje | північ: пасує найкраще |  |
| `lic.compass.NNE` | bliska alternatywa | близька альтернатива |  |
| `lic.compass.NNW` | bliska alternatywa | близька альтернатива |  |
| `lic.compass.NE` | też warto zajrzeć | теж варто глянути |  |
| `lic.compass.NW` | też warto zajrzeć | теж варто глянути |  |
| `lic.compass.E` | dalej od ciebie | далі від тебе |  |
| `lic.compass.W` | dalej od ciebie | далі від тебе |  |
| `lic.compass.SE` | daleko od ciebie | далеко від тебе |  |
| `lic.compass.S` | najmniej pasuje teraz | зараз пасує найменше |  |
| `lic.hint.worlds` | Wybierz co najmniej jeden świat albo „wszystko po trochu” | Обери принаймні один світ або «усього потрошку» |  |
| `lic.hint.cards` | Zostało kart: {n} | Залишилося карток: {n} |  |
| `lic.hint.more` | Wybierz jeszcze {n} | Обери ще {n} |  |
| `lic.hint.where` | Zaznacz, gdzie to widać: {list} | Познач, де це видно: {list} |  |
| `lic.step.gdzie` | Gdzie szukasz szkoły | Де ти шукаєш школу |  |
| `lic.step.swiaty` | Twoje światy | Твої світи |  |
| `lic.step.zajecia` | Co lubisz robić | Що ти любиш робити |  |
| `lic.step.sytuacje` | Co robisz, gdy… | Що ти робиш, коли… |  |
| `lic.step.styl` | Styl pracy | Стиль роботи |  |
| `lic.step.wartosci` | Co jest ważne | Що важливо |  |
| `lic.step.mocne` | Mocne strony | Сильні сторони |  |
| `lic.step.szkola` | Jak ci idzie w szkole | Як тобі йде в школі |  |
| `lic.step.of` | krok {i} z {n} | крок {i} з {n} |  |
| `lic.nav.back` | Wstecz | Назад |  |
| `lic.nav.skip` | Ten krok możesz pominąć | Цей крок можна пропустити |  |
| `lic.nav.showCompass` | Pokaż kompas | До компаса |  |
| `lic.nav.next` | Dalej | Далі |  |
| `lic.gate.worlds` | wybór światów | вибір світів |  |
| `lic.gate.cards` | karty „Co lubisz robić” | картки «Що ти любиш робити» |  |
| `lic.gate.values` | trzy rzeczy, które są dla ciebie ważne | три речі, які для тебе важливі |  |
| `lic.gate.strengths` | trzy mocne strony | три сильні сторони |  |
| `lic.gate.title` | Najpierw kilka pytań | Спочатку кілька питань |  |
| `lic.gate.text` | Żeby pokazać klasy, które do ciebie pasują, brakuje jeszcze: {list}. | Щоб показати класи, які тобі пасують, ще бракує: {list}. |  |
| `lic.start.s1` | światy, które cię ciekawią, i co lubisz robić: same kliknięcia | світи, які тебе цікавлять, і що ти любиш робити: самі кліки |  |
| `lic.start.s1.time` | ok. 8 min | бл. 8 хв |  |
| `lic.start.s2` | jak ci idzie: słabo, dobrze, świetnie | як тобі йде: слабо, добре, чудово |  |
| `lic.start.s2.time` | ok. 1 min | бл. 1 хв |  |
| `lic.start.s3` | twoje kierunki, a potem szkoły i klasy {where} | твої напрями, а потім школи і класи {where} |  |
| `lic.start.kicker` | Kompas Liceum · rekrutacja 2027 | Kompas Liceum · вступна кампанія 2027 |  |
| `lic.start.title` | Jaka klasa pasuje do tego, co lubisz? | Який клас пасує до того, що ти любиш? |  |
| `lic.start.note` | <b>To nie test i nie ocena.</b> To kompas: pokazuje kierunki, które warto odkryć, i klasy, które do nich prowadzą. Nie ma złych odpowiedzi, a punkty i szanse są tylko orientacyjne. | <b>Це не тест і не оцінка.</b> Це компас: він показує напрями, які варто відкрити, і класи, що до них ведуть. Поганих відповідей немає, а бали й шанси лише орієнтовні. |  |
| `lic.start.lead` | Klikasz, przesuwasz i wybierasz. Nic nie musisz pisać. Na końcu zobaczysz kierunki oraz licea i technika, które są realne, a które ambitne. | Ти клацаєш, пересуваєш і обираєш. Нічого писати не треба. Наприкінці побачиш напрями та ліцеї й технікуми, які реальні, а які амбітні. |  |
| `lic.start.have` | Masz już odpowiedzi. | У тебе вже є відповіді. |  |
| `lic.start.finish` | Możesz dokończyć pytania. | Можеш дописати відповіді на питання. |  |
| `lic.start.waits` | Twój kompas czeka. | Твій компас чекає. |  |
| `lic.my.compass` | Mój kompas | Мій компас |  |
| `lic.start.back` | Wróć do pytań | Повернутися до питань |  |
| `lic.start.go` | Zaczynamy | Починаємо |  |
| `lic.start.browse` | Przeglądaj szkoły | Переглянути школи |  |
| `lic.start.db` | <b>Co jest w bazie.</b> {s} szkół i {c} klas (Kraków albo Tychy z Metropolią GZM, zawsze osobno): ścisłe, przyrodnicze, językowe, humanistyczne, biznesowe i techniczne. Klasy dwujęzyczne i międzynarodowe są osobną ścieżką (z testem językowym), sportowe dojdą później (jest już jedna, IV LO Tychy 1MS, do sprawdzenia). Progi są z rekrutacji 2026, więc to orientacja, nie obietnica. Progi liceów w Tychach są z prywatnej strony licea-progi.pl i są do sprawdzenia; technika w Tychach jeszcze bez progów. | <b>Що є в базі.</b> Шкіл: {s}, класів: {c} (Краків або Тихи з Метрополією GZM, завжди окремо): точні, природничі, мовні, гуманітарні, бізнесові й технічні. Двомовні та міжнародні класи — окремий шлях (з мовним тестом), спортивні додамо пізніше (один уже є, IV LO Tychy 1MS, його треба перевірити). Прохідні бали з вступної кампанії 2026, тож це орієнтир, а не обіцянка. Прохідні бали ліцеїв у Тихах узято з приватного сайту licea-progi.pl, їх треба перевірити; для технікумів у Тихах прохідних балів ще немає. |  |
| `lic.start.test` | Tryb testowy | Тестовий режим |  |
| `lic.towns.title` | Gdzie szukasz szkoły? | Де ти шукаєш школу? |  |
| `lic.towns.lead` | Wybierz jedno miejsce. Pokażemy szkoły i klasy tylko stamtąd. Zmienisz to w każdej chwili, także na liście szkół. | Обери одне місце. Ми покажемо школи й класи лише звідти. Це можна змінити будь-коли, також у списку шкіл. |  |
| `lic.towns.from` | Skąd będziesz jechać do szkoły? | Звідки ти їхатимеш до школи? |  |
| `lic.towns.fromLead` | Kliknij swoją dzielnicę. Przy każdej szkole pokażemy, ile mniej więcej trwa dojazd. Możesz pominąć. | Клацни свій район. Біля кожної школи ми покажемо, скільки приблизно триває дорога. Можна пропустити. |  |
| `lic.skip` | pomiń | пропустити |  |
| `lic.towns.how` | Liczymy komunikacją miejską z kilku miejsc w twojej dzielnicy, we wtorek rano (7:00–7:40), z dojściem pieszo. To tylko przybliżenie. Dokładny dojazd sprawdzisz tu: {links}. | Рахуємо міським транспортом з кількох місць у твоєму районі, у вівторок зранку (7:00–7:40), з пішим переходом. Це лише приблизно. Точну дорогу перевіриш тут: {links}. |  |
| `lic.towns.later` | Czas dojazdu dla tego miejsca dojdzie później. Dojazd sprawdzisz tu: {links}. | Час дороги для цього місця додамо пізніше. Дорогу перевіриш тут: {links}. |  |
| `lic.towns.none` | Jeśli twojego miasta jeszcze nie ma, wybierz najbliższe miejsce: kierunki na kompasie i tak będą twoje. | Якщо твого міста ще немає, обери найближче: напрями на компасі все одно будуть твої. |  |
| `lic.worlds.title` | Co cię ciekawi? | Що тебе цікавить? |  |
| `lic.worlds.lead` | Wybierz światy, które cię przyciągają. Możesz kilka. Pokażemy ci pytania głównie z tych światów, a resztę po trochu. | Обери світи, які тебе притягують. Можна кілька. Питання покажемо переважно з цих світів, а решту потрошку. |  |
| `lic.worlds.all` | Nie wiem, pokaż wszystko po trochu | Не знаю, покажіть усе потрошку |  |
| `lic.sort.liked` | Lubisz: | Тобі подобається: |  |
| `lic.sort.none` | nic nie zaznaczyłeś, to też jest odpowiedź | нічого не позначено, це теж відповідь |  |
| `lic.again` | Przejdź jeszcze raz | Пройти ще раз |  |
| `lic.sort.lead` | Bez zastanawiania się. Chodzi o samą czynność, nie o zawód. | Не роздумуй. Йдеться про саму дію, а не про професію. |  |
| `lic.sort.swipe` | Kartę możesz też przesunąć w prawo (lubię) albo w lewo (nie lubię). | Картку можна також посунути вправо (люблю) або вліво (не люблю). |  |
| `lic.of` | {i} z {n} | {i} з {n} |  |
| `lic.sort.no` | nie lubię | не люблю |  |
| `lic.sort.yes` | lubię | люблю |  |
| `lic.sort.skip` | obojętne, pomiń | байдуже, пропустити |  |
| `lic.undo` | cofnij | скасувати |  |
| `lic.sit.picked` | Twoje wybory: | Твій вибір: |  |
| `lic.sit.none` | wszystko pominięte, to też jest odpowiedź | усе пропущено, це теж відповідь |  |
| `lic.sit.lead` | Wybierz to, co zrobiłbyś naprawdę, nie to, co wypada. | Обери те, що ти справді зробив би, а не те, що годиться. |  |
| `lic.style.title` | Jak lubisz pracować? | Як ти любиш працювати? |  |
| `lic.style.lead` | Przesuń w stronę, która bardziej do ciebie pasuje. Środek też jest w porządku. | Посунь у той бік, який тобі більше пасує. Середина теж нормально. |  |
| `lic.style.or` | {a} albo {b} | {a} або {b} |  |
| `lic.values.title` | Co jest dla ciebie ważne w pracy? | Що для тебе важливе в роботі? |  |
| `lic.values.lead` | Wybierz trzy, w kolejności: najpierw najważniejsze. | Обери три, по черзі: спочатку найважливіше. |  |
| `lic.where.0` | w szkole | у школі |  |
| `lic.where.1` | w sporcie | у спорті |  |
| `lic.where.2` | w domu | удома |  |
| `lic.where.3` | w hobby | у хобі |  |
| `lic.where.4` | z przyjaciółmi | з друзями |  |
| `lic.where.5` | w grach i internecie | в іграх та інтернеті |  |
| `lic.str.where` | {name}: gdzie to widać? | {name}: де це видно? |  |
| `lic.str.title` | Twoje mocne strony | Твої сильні сторони |  |
| `lic.str.lead` | Wybierz trzy rzeczy, które ci wychodzą, i kliknij, gdzie to widać. | Обери три речі, які тобі вдаються, і клацни, де це видно. |  |
| `lic.soft.slabo` | słabo | слабо |  |
| `lic.soft.dobrze` | dobrze | добре |  |
| `lic.soft.swietnie` | świetnie | чудово |  |
| `lic.pn.title` | Dla rodziców: jak to liczymy | Для батьків: як ми рахуємо |  |
| `lic.pn.p1` | Pytamy tylko o przedmioty. Odpowiedź o polskim, matematyce i angielskim liczymy też jako spodziewany wynik egzaminu ósmoklasisty. Odpowiedzi „słabo / dobrze / świetnie” zamieniamy na typowe wartości: <b>słabo</b> to ocena {g1} i ok. {e1}% na egzaminie, <b>dobrze</b> to {g2} i ok. {e2}%, <b>świetnie</b> to {g3} i ok. {e3}%. Przedmiot bez odpowiedzi liczymy jak „dobrze”. | Ми питаємо лише про предмети. Відповідь про польську, математику й англійську рахуємо також як очікуваний результат іспиту восьмикласника (egzamin ósmoklasisty). Відповіді «слабо / добре / чудово» замінюємо типовими значеннями: <b>слабо</b> — це оцінка {g1} і бл. {e1}% на іспиті, <b>добре</b> — {g2} і бл. {e2}%, <b>чудово</b> — {g3} і бл. {e3}%. Предмет без відповіді рахуємо як «добре». |  |
| `lic.pn.p2` | Z tego powstaje szacunek punktów rekrutacyjnych (maksymalnie 200): egzamin ósmoklasisty daje do 100 pkt (polski 0,35, matematyka 0,35, język obcy 0,30 × wynik w procentach), świadectwo do 100 pkt (polski, matematyka i dwa przedmioty zależne od klasy: ocena 6 = 18, 5 = 17, 4 = 14, 3 = 8, 2 = 2 pkt) oraz dodatki za pasek, wolontariat i osiągnięcia. | З цього виходить розрахунок вступних балів (щонайбільше 200): іспит восьмикласника дає до 100 б. (польська 0,35, математика 0,35, іноземна мова 0,30 × результат у відсотках), свідоцтво (świadectwo) до 100 б. (польська, математика і два предмети, що залежать від класу: оцінка 6 = 18, 5 = 17, 4 = 14, 3 = 8, 2 = 2 б.), а також додаткові бали за відзнаку, волонтерство й досягнення. |  |
| `lic.pn.p3` | Szacunek porównujemy z progami z rekrutacji {year}. Zapas co najmniej {m} pkt to <b>realna szansa</b>, od −{m} do +{m} pkt to <b>do zawalczenia</b>, niżej to <b>ambitna</b>. To orientacja do rozmowy, nie prognoza: progi zmieniają się co roku, a przed egzaminem nikt nie zna swojego wyniku. Dokładne punkty warto policzyć w drugim semestrze albo w oficjalnym kalkulatorze rekrutacji. | Розрахунок ми порівнюємо з прохідними балами (próg punktowy) вступної кампанії (rekrutacja) {year}. Запас щонайменше {m} б. — це <b>реальний шанс</b>, від −{m} до +{m} б. — <b>варто поборотися</b>, нижче — <b>амбітний</b>. Це орієнтир для розмови, а не прогноз: прохідні бали щороку змінюються, а перед іспитом ніхто не знає свого результату. Точні бали варто порахувати в другому семестрі або в офіційному калькуляторі вступної кампанії. |  |
| `lic.pn.p4` | <b>Klasy dwujęzyczne i międzynarodowe.</b> Trzeba zdać sprawdzian kompetencji językowych; termin ustala szkoła (w 2026 np. VI LO: 3 czerwca dla klas międzynarodowych). Progi z Krakowa 2026 są w zwykłej skali do 200 pkt, więc porównujemy je jak inne. W niektórych miastach test dodaje punkty (np. jedno z warszawskich liceów: do 225 pkt), tam progi nie są porównywalne. Angielski „świetnie” = test w zasięgu, „dobrze” = trzeba popracować, „słabo” = test będzie trudny i szansę pokazujemy jako ambitną. Klasa wstępna uczy nowego języka od zera i ma test predyspozycji, a nie z angielskiego. | <b>Двомовні та міжнародні класи.</b> Треба скласти перевірку мовних навичок; термін визначає школа (у 2026, напр., VI LO: 3 червня для міжнародних класів). Прохідні бали з Кракова 2026 у звичайній шкалі до 200 б., тож ми порівнюємо їх, як інші. У деяких містах тест додає бали (напр., один із варшавських ліцеїв: до 225 б.), там прохідні бали не можна порівнювати. Англійська «чудово» = тест тобі до снаги, «добре» = треба попрацювати, «слабо» = тест буде складним, і шанс ми показуємо як амбітний. Підготовчий клас (klasa wstępna) вчить нової мови з нуля і має тест на схильність до мов, а не з англійської. |  |
| `lic.school.subjects` | Przedmioty | Предмети |  |
| `lic.school.subjectsLead` | Jak ci idzie teraz? Strzał wystarczy. Zaznacz te, które chcesz, resztę pomiń. | Як тобі йде зараз? Досить прикидки. Познач ті, що хочеш, решту пропусти. |  |
| `lic.school.other` | Pozostałe przedmioty | Інші предмети |  |
| `lic.school.haveGrades` | Masz już oceny z I semestru? | Маєш уже оцінки за I семестр? |  |
| `lic.school.haveGradesLead` | Jeśli tak, możesz wpisać dokładne oceny i wyniki. Nie musisz: do pierwszego przeglądu opcji wystarczy „słabo, dobrze, świetnie”. | Якщо так, можеш вписати точні оцінки й результати. Не обов'язково: для першого огляду варіантів досить «слабо, добре, чудово». |  |
| `lic.school.toExact` | Wpiszę dokładne oceny | Впишу точні оцінки |  |
| `lic.school.weight` | waga {w} | вага {w} |  |
| `lic.school.exam` | Egzamin ósmoklasisty | Іспит восьмикласника (egzamin ósmoklasisty) |  |
| `lic.school.examLead` | Wynik w procentach: z próbnego egzaminu albo spodziewany. | Результат у відсотках: з пробного іспиту або очікуваний. |  |
| `lic.school.exPl` | Język polski | Польська мова |  |
| `lic.school.exMat` | Matematyka | Математика |  |
| `lic.school.exLang` | Język obcy (angielski) | Іноземна мова (англійська) |  |
| `lic.school.grades` | Oceny z I semestru | Оцінки за I семестр |  |
| `lic.school.gradesLead` | Przedmiotów, których nie wpiszesz, nie liczymy. | Предмети, яких ти не впишеш, ми не рахуємо. |  |
| `lic.school.extra` | Dodatkowe punkty | Додаткові бали |  |
| `lic.school.stripe` | Świadectwo z wyróżnieniem (czerwony pasek) | Свідоцтво з відзнакою («червона смужка») |  |
| `lic.school.volunteering` | Wolontariat wpisany na świadectwie | Волонтерство, вписане у свідоцтво |  |
| `lic.school.ach` | Osiągnięcia (konkursy, olimpiady, sport), do 18 pkt | Досягнення (конкурси, олімпіади, спорт), до 18 б. |  |
| `lic.school.simpler` | Wolisz prościej? Wróć do odpowiedzi „słabo, dobrze, świetnie”. | Хочеш простіше? Повернись до відповідей «слабо, добре, чудово». |  |
| `lic.school.toSoft` | Wróć do prostej wersji | Повернутися до простої версії |  |
| `lic.school.bi` | Klasa dwujęzyczna? | Двомовний клас (klasa dwujęzyczna)? |  |
| `lic.school.biLead` | W klasie dwujęzycznej część lekcji (np. geografia, biologia) jest po angielsku. Żeby się dostać, trzeba mieć punkty jak zwykle <b>i zdać test językowy w szkole</b>. Klasa międzynarodowa jest prawie cała po angielsku. Szansę na test liczymy z tego, jak ci idzie angielski. | У двомовному класі частина уроків (напр., географія, біологія) англійською. Щоб вступити, треба мати бали як зазвичай <b>і скласти мовний тест у школі</b>. Міжнародний клас майже весь англійською. Шанс на тест ми рахуємо з того, як тобі йде англійська. |  |
| `lic.school.biAria` | Klasy dwujęzyczne | Двомовні класи |  |
| `lic.school.biNo` | nie szukam | не шукаю |  |
| `lic.school.biYes` | pokaż mi też klasy dwujęzyczne | покажіть мені й двомовні класи |  |
| `lic.school.title` | Jak ci idzie w szkole? | Як тобі йде в школі? |  |
| `lic.school.lead` | Nie liczymy dokładnych punktów. Zaznacz, jak się czujesz z danym przedmiotem, a przy klasach zobaczysz, które są <b>realne</b>, a które <b>ambitne</b>. | Ми не рахуємо точних балів. Познач, як ти почуваєшся з кожним предметом, а біля класів побачиш, які <b>реальні</b>, а які <b>амбітні</b>. |  |
| `lic.live.soft` | Zaznaczone odpowiedzi: <b>{n}</b>. Resztę możesz zostawić. | Позначених відповідей: <b>{n}</b>. Решту можна залишити. |  |
| `lic.live.softNone` | Możesz też przejść dalej bez zaznaczania: zobaczysz wtedy klasy bez oceny szans. | Можна також іти далі без позначок: тоді побачиш класи без оцінки шансів. |  |
| `lic.live.exact` | Egzamin: <b>{ex}</b> z 100 pkt · dodatki: <b>{extra}</b> pkt. Punkty ze świadectwa liczymy osobno dla każdej klasy. | Іспит: <b>{ex}</b> зі 100 б. · додаткові: <b>{extra}</b> б. Бали зі свідоцтва рахуємо окремо для кожного класу. |  |
| `lic.live.exactNone` | Wpisz wyniki z egzaminu, a tu zobaczysz sumę. Możesz też przejść dalej. | Впиши результати іспиту, і тут побачиш суму. Можна також іти далі. |  |
| `lic.pt.range` | zakres {a}–{b} | діапазон {a}–{b} |  |
| `lic.pt.nodata` | brak danych | немає даних |  |
| `lic.pt.title` | Dla rodziców: progi i szacunek punktów | Для батьків: прохідні бали і розрахунок балів |  |
| `lic.pt.soft` | Szacunek z odpowiedzi „słabo, dobrze, świetnie”. | Розрахунок з відповідей «слабо, добре, чудово». |  |
| `lic.pt.exact` | Policzone z dokładnych ocen i wyników. | Пораховано з точних оцінок і результатів. |  |
| `lic.pt.none` | Nie ma jeszcze odpowiedzi o szkole, więc nie ma szacunku. | Відповідей про школу ще немає, тож розрахунку немає. |  |
| `lic.pt.assumed` | Przedmioty bez odpowiedzi liczone jak „dobrze”: {list}. | Предмети без відповіді рахуємо як «добре»: {list}. |  |
| `lic.pt.year` | Progi z rekrutacji {year}; w 2027 mogą być inne. | Прохідні бали з вступної кампанії {year}; у 2027 можуть бути інші. |  |
| `lic.pt.h1` | Szkoła i klasa | Школа і клас |  |
| `lic.pt.h2` | Próg | Прохідний бал |  |
| `lic.pt.h3` | Szacunek | Розрахунок |  |
| `lic.pt.h4` | Różnica | Різниця |  |
| `lic.pt.plusTest` | (+ test) | (+ тест) |  |
| `lic.pt.plusExam` | (+ egzamin) | (+ іспит) |  |
| `lic.years.one` | {n} rok | {n} рік |  |
| `lic.years.few` | {n} lata | {n} роки |  |
| `lic.years.many` | {n} lat | {n} років |  |
| `lic.plan.exp.when` | w ciągu 30 dni | протягом 30 днів |  |
| `lic.plan.dni.when` | grudzień 2026 – kwiecień 2027 | грудень 2026 – квітень 2027 |  |
| `lic.plan.dni` | Idź na dzień otwarty albo wejdź na stronę: {school}. Zapytaj, które oceny ze świadectwa liczy klasa {code} ({label}) i jak wygląda zwykły tydzień nauki. | Піди на день відкритих дверей або зайди на сайт: {school}. Запитай, які оцінки зі свідоцтва враховує клас {code} ({label}) і як виглядає звичайний тиждень навчання. |  |
| `lic.plan.subs` |  oraz z przedmiotów tej klasy ({list}) | , а також з предметів цього класу ({list}) |  |
| `lic.plan.pkt.when` | do końca roku szkolnego | до кінця навчального року |  |
| `lic.plan.pkt.when0` | w styczniu | у січні |  |
| `lic.plan.pkt.amb` | Klasa {code} jest na razie ambitna. Najwięcej pomoże matematyka i polski{subs}. W drugim semestrze wróć do Kompasu z dokładnymi ocenami. | Клас {code} поки що амбітний. Найбільше допоможуть оцінки з математики і польської{subs}. У другому семестрі повернися до Компаса з точними оцінками. |  |
| `lic.plan.pkt.ok` | Trzymaj poziom z matematyki i polskiego{subs}. W drugim semestrze sprawdź dokładniej, gdzie jesteś. | Тримай рівень з математики і польської{subs}. У другому семестрі перевір точніше, де ти. |  |
| `lic.plan.pkt.none` | Zaznacz w Kompasie, jak ci idzie w szkole, żeby zobaczyć, które klasy są realne, a które ambitne. | Познач у Компасі, як тобі йде в школі, щоб побачити, які класи реальні, а які амбітні. |  |
| `lic.plan.zasady.when` | styczeń 2027 | січень 2027 |  |
| `lic.plan.curator` | kuratora oświaty | шкільного куратора (kurator oświaty) |  |
| `lic.plan.zasady` | Sprawdź terminy rekrutacji 2027 na stronie {curator}{window} i regulamin każdej szkoły z twojej listy. | Перевір терміни вступної кампанії 2027 на сторінці {curator}{window} і правила кожної школи зі свого списку. |  |
| `lic.plan.lista.when` | przed złożeniem wniosku | перед поданням заяви |  |
| `lic.plan.lista` | Ułóż listę klas od wymarzonej do bezpiecznej: jedna ambitna, jedna realna, jedna z zapasem. | Склади список класів від омріяного до надійного: один амбітний, один реальний, один із запасом. |  |
| `lic.plan.egz` | Egzamin ósmoklasisty (polski, matematyka, język obcy). | Іспит восьмикласника (польська, математика, іноземна мова). |  |
| `lic.plan.talk.when` | kiedy chcesz | коли захочеш |  |
| `lic.plan.talk` | Pokaż ten plan komuś, komu ufasz, i zapytaj, co o nim myśli. | Покажи цей план тому, кому довіряєш, і запитай, що він про нього думає. |  |
| `lic.like.remove` | Usuń z mojej listy | Прибрати з мого списку |  |
| `lic.like.add` | Dodaj do mojej listy | Додати до мого списку |  |
| `lic.k.svg` | Kompas: profile od najlepiej do najmniej pasujących | Компас: профілі від найкраще до найменше пасуючих |  |
| `lic.fit.4` | bardzo pasuje | дуже пасує |  |
| `lic.fit.3` | pasuje | пасує |  |
| `lic.fit.2` | może pasować | може пасувати |  |
| `lic.fit.1` | mniej pasuje | менше пасує |  |
| `lic.csum.classes.one` | {n} klas w {m} | {n} клас у {m} |  |
| `lic.csum.classes.few` | {n} klas w {m} | {n} класи у {m} |  |
| `lic.csum.classes.many` | {n} klas w {m} | {n} класів у {m} |  |
| `lic.csum.schools.one` | {n} szkołach | {n} школі |  |
| `lic.csum.schools.few` | {n} szkołach | {n} школах |  |
| `lic.csum.schools.many` | {n} szkołach | {n} школах |  |
| `lic.csum.realna.one` | {n} realnych | {n} реальний |  |
| `lic.csum.realna.few` | {n} realnych | {n} реальні |  |
| `lic.csum.realna.many` | {n} realnych | {n} реальних |  |
| `lic.csum.zawalczenia.one` | {n} do zawalczenia | {n} варто поборотися |  |
| `lic.csum.zawalczenia.few` | {n} do zawalczenia | {n} варто поборотися |  |
| `lic.csum.zawalczenia.many` | {n} do zawalczenia | {n} варто поборотися |  |
| `lic.csum.ambitna.one` | {n} ambitnych | {n} амбітний |  |
| `lic.csum.ambitna.few` | {n} ambitnych | {n} амбітні |  |
| `lic.csum.ambitna.many` | {n} ambitnych | {n} амбітних |  |
| `lic.csum.aria` | Klasy: {r}, {z}, {a} | Класи: {r}, {z}, {a} |  |
| `lic.k.why` | Dlaczego? | Чому? |  |
| `lic.k.see` | Zobacz szkoły i klasy | Дивитися школи і класи |  |
| `lic.ex.name` | Imię <span class="muted">(opcjonalnie, do nazwy pliku)</span> | Ім'я <span class="muted">(необов'язково, для назви файлу)</span> |  |
| `lic.ex.print` | Drukuj | Друкувати |  |
| `lic.ex.parent` | Podsumowanie dla rodzica | Підсумок для батьків |  |
| `lic.k.title` | Twój kompas | Твій компас |  |
| `lic.k.titleName` | {name}, twój kompas | {name}, твій компас |  |
| `lic.k.lead` | Północ to profil, który teraz najbardziej do ciebie pasuje. Tuż obok są dobre alternatywy. Kliknij punkt na kompasie albo kartę, żeby zobaczyć szkoły. | Північ — це профіль, який зараз найбільше тобі пасує. Поруч добрі альтернативи. Клацни точку на компасі або картку, щоб побачити школи. |  |
| `lic.k.alt` | Bliskie alternatywy | Близькі альтернативи |  |
| `lic.k.further` | Dalej na kompasie | Далі на компасі |  |
| `lic.k.furtherLead` | Mniej pasują teraz, ale nic nie jest zamknięte. | Зараз пасують менше, але нічого не закрито. |  |
| `lic.k.lg.r` | realne klasy | реальні класи |  |
| `lic.k.lg.z` | do zawalczenia | варто поборотися |  |
| `lic.k.lg.a` | ambitne | амбітні |  |
| `lic.k.mark` | Zaznacz, jak ci idzie w szkole, a przy profilach zobaczysz, ile klas jest realnych. | Познач, як тобі йде в школі, і біля профілів побачиш, скільки класів реальні. |  |
| `lic.mark` | Zaznacz | Позначити |  |
| `lic.k.onList` | Na twojej liście: <b>{n}</b>. | У твоєму списку: <b>{n}</b>. |  |
| `lic.k.seeList` | Zobacz moją listę | Дивитися мій список |  |
| `lic.k.hearts` | Serduszkiem dodajesz profil, szkołę albo klasę do swojej listy. Lista trafia do pliku z wynikami. | Сердечком ти додаєш профіль, школу або клас до свого списку. Список потрапляє у файл з результатами. |  |
| `lic.k.plan` | Plan do maja 2027 | План до травня 2027 |  |
| `lic.k.planFor` | dla profilu: {name} | для профілю: {name} |  |
| `lic.k.save` | Zapisz plik z wynikami | Зберегти файл з результатами |  |
| `lic.k.change` | Zmień odpowiedzi | Змінити відповіді |  |
| `lic.k.changeSchool` | Zmień, jak ci idzie | Змінити, як тобі йде |  |
| `lic.allSources` | Wszystkie źródła danych | Усі джерела даних |  |
| `lic.src.check` | do sprawdzenia | перевірити |  |
| `lic.rank.p` | Perspektywy, Ranking Maturalny 2026: miejsce {n} w Polsce | Perspektywy, Ranking Maturalny 2026: місце {n} у Польщі |  |
| `lic.rank.o` | otouczelnie.pl 2026: miejsce {n} w mieście lub województwie | otouczelnie.pl 2026: місце {n} у місті або воєводстві |  |
| `lic.rank.line` | Wyniki matur: <b>{order}.</b> z {total} {word} {where} | Результати матури: <b>{order}.</b> з {total} {word} {where} |  |
| `lic.rank.licea` | liceów | ліцеїв |  |
| `lic.rank.technika` | techników | технікумів |  |
| `lic.rank.in.krakow` | w Krakowie | у Кракові |  |
| `lic.rank.in.gzm` | w Metropolii GZM | у Метрополії GZM |  |
| `lic.rank.national` | w krajowym rankingu Perspektyw | у національному рейтингу Perspektyw |  |
| `lic.type.liceum` | liceum | ліцей |  |
| `lic.type.technikum` | technikum | технікум |  |
| `lic.sc.note` | Uwaga do danych | Примітка до даних |  |
| `lic.sc.onMap` | Na mapie | На мапі |  |
| `lic.sc.route` | Dojazd | Дорога |  |
| `lic.sc.www` | strona szkoły | сайт школи |  |
| `lic.backCompass` | Wróć do kompasu | Повернутися до компаса |  |
| `lic.p.dirsAria` | Kierunki w tym profilu | Напрями в цьому профілі |  |
| `lic.p.dir` | Kierunek: | Напрям: |  |
| `lic.all` | wszystkie | усі |  |
| `lic.p.focus` | <b>{name}</b>: jak wygląda ta praca i co dalej | <b>{name}</b>: як виглядає ця робота і що далі |  |
| `lic.p.roles` | Przykładowe zawody: | Приклади професій: |  |
| `lic.p.try` | Spróbuj w 30 dni: | Спробуй за 30 днів: |  |
| `lic.p.after` | Po szkole: | Після школи: |  |
| `lic.p.studia` | Studia w Krakowie (z Kompasu Studia): | Студії в Кракові (з Kompas Studia): |  |
| `lic.p.schools` | Szkoły i klasy | Школи і класи |  |
| `lic.p.mark` | Zaznacz, jak ci idzie w szkole, a przy klasach pojawią się szanse. | Познач, як тобі йде в школі, і біля класів з'являться шанси. |  |
| `lic.order` | Kolejność | Порядок |  |
| `lic.p.first` | Najpierw: | Спочатку: |  |
| `lic.p.best` | najlepiej pasujące | найкраще пасують |  |
| `lic.p.chance` | największa szansa | найбільший шанс |  |
| `lic.n.schools.one` | {n} szkół | {n} школа |  |
| `lic.n.schools.few` | {n} szkół | {n} школи |  |
| `lic.n.schools.many` | {n} szkół | {n} шкіл |  |
| `lic.n.classes.one` | {n} klas | {n} клас |  |
| `lic.n.classes.few` | {n} klas | {n} класи |  |
| `lic.n.classes.many` | {n} klas | {n} класів |  |
| `lic.f.clear` | wyczyść filtry | скинути фільтри |  |
| `lic.f.Clear` | Wyczyść filtry | Скинути фільтри |  |
| `lic.p.more.one` | Pokaż jeszcze {n} szkół | Показати ще {n} школу |  |
| `lic.p.more.few` | Pokaż jeszcze {n} szkół | Показати ще {n} школи |  |
| `lic.p.more.many` | Pokaż jeszcze {n} szkół | Показати ще {n} шкіл |  |
| `lic.p.empty` | Nic nie pasuje do filtrów. | Нічого не підходить під фільтри. |  |
| `lic.p.bi` | Klasy dwujęzyczne i międzynarodowe | Двомовні та міжнародні класи |  |
| `lic.p.biLead` | Osobna ścieżka: punkty jak zwykle <b>plus test językowy w szkole</b>. Szansę na test liczymy z tego, jak ci idzie angielski. | Окремий шлях: бали як зазвичай <b>плюс мовний тест у школі</b>. Шанс на тест ми рахуємо з того, як тобі йде англійська. |  |
| `lic.p.hide` | Ukryj | Сховати |  |
| `lic.p.biHidden` | W tym kierunku są też klasy dwujęzyczne lub międzynarodowe ({n}). Mają test językowy w szkole. | У цьому напрямі є також двомовні або міжнародні класи ({n}). У них є мовний тест у школі. |  |
| `lic.p.show` | Pokaż je | Показати їх |  |
| `lic.map.profile` | Szkoły z tego profilu. | Школи з цього профілю. |  |
| `lic.p.others` | Inne kierunki na kompasie | Інші напрями на компасі |  |
| `lic.p.whole` | Cały kompas | Увесь компас |  |
| `lic.ch.none` | bez oceny | без оцінки |  |
| `lic.ch.noneLong` | bez oceny szans | без оцінки шансів |  |
| `lic.pp.exam` | egzamin w szkole | іспит у школі |  |
| `lic.pp.no` | brak | немає |  |
| `lic.pp.print` | Drukuj albo zapisz jako PDF | Друкувати або зберегти як PDF |  |
| `lic.pp.title` | Kompas Liceum: podsumowanie dla rodzica | Kompas Liceum: підсумок для батьків |  |
| `lic.pp.from` | dojazd z: {from} | дорога з: {from} |  |
| `lic.pp.note` | To nie test i nie ocena. Kompas pokazuje kierunki do odkrycia. Punkty i szanse są orientacyjne. | Це не тест і не оцінка. Компас показує напрями, які варто відкрити. Бали й шанси лише орієнтовні. |  |
| `lic.pp.dirs` | Kompas: najbliższe kierunki | Компас: найближчі напрями |  |
| `lic.pp.further` | Dalej: | Далі: |  |
| `lic.pp.values` | Ważne w pracy | Важливе в роботі |  |
| `lic.pp.myList` | Moja lista: klasy | Мій список: класи |  |
| `lic.pp.toCheck` | Klasy do sprawdzenia: {name} | Класи, які треба перевірити: {name} |  |
| `lic.pp.h.school` | Szkoła | Школа |  |
| `lic.pp.h.class` | Klasa | Клас |  |
| `lic.pp.h.chance` | Szansa | Шанс |  |
| `lic.pp.h.th` | Próg {year} | Прохідний бал {year} |  |
| `lic.pp.likedSchools` | Szkoły z serduszkiem: {list}. | Школи із сердечком: {list}. |  |
| `lic.pp.likedProfiles` | Profile z serduszkiem: {list}. | Профілі із сердечком: {list}. |  |
| `lic.pp.plan` | Plan do maja | План до травня |  |
| `lic.pp.numbers` | Dla rodzica: skąd te liczby | Для батьків: звідки ці числа |  |
| `lic.pp.soft` | Szanse liczymy z odpowiedzi „słabo, dobrze, świetnie” (słabo = ocena 3 i ok. 45% na egzaminie, dobrze = 4 i ok. 70%, świetnie = 5 i ok. 90%). | Шанси ми рахуємо з відповідей «слабо, добре, чудово» (слабо = оцінка 3 і бл. 45% на іспиті, добре = 4 і бл. 70%, чудово = 5 і бл. 90%). |  |
| `lic.pp.exact` | Szanse liczymy z dokładnych ocen i wyników wpisanych w Kompasie. | Шанси ми рахуємо з точних оцінок і результатів, вписаних у Компасі. |  |
| `lic.pp.none` | Nie zaznaczono, jak idzie w szkole, więc bez szans. | Не позначено, як іде в школі, тому без шансів. |  |
| `lic.pp.tychy` | Progi liceów w Tychach są z prywatnej strony licea-progi.pl (do sprawdzenia); dla techników w Tychach i części szkół GZM progów jeszcze nie mamy. | Прохідні бали ліцеїв у Тихах узято з приватного сайту licea-progi.pl (їх треба перевірити); для технікумів у Тихах і частини шкіл GZM прохідних балів ще немає. |  |
| `lic.pp.check` | Dane klas oznaczone „do sprawdzenia” warto potwierdzić na stronie szkoły. Źródła: lista w Kompasie (strona „Źródła danych”). | Дані класів, позначені «перевірити», варто підтвердити на сайті школи. Джерела: список у Компасі (сторінка «Джерела даних»). |  |
| `lic.pp.travel` | Czas dojazdu to przybliżenie komunikacją miejską. | Час дороги — це приблизно, міським транспортом. |  |
| `lic.pp.talk` | Rozmowa: Która klasa daje najwięcej energii, a która tylko dobrze brzmi? Jaka klasa będzie bezpieczna i czy dziecko chce się w niej uczyć? | Розмова: Який клас дає найбільше енергії, а який лише гарно звучить? Який клас буде надійним і чи хоче дитина в ньому вчитися? |  |
| `lic.pp.foot` | Kompas Liceum v{v} · dane {d} · kompas z odpowiedzi dziecka, bez kont i bez wysyłania danych. | Kompas Liceum v{v} · дані {d} · компас з відповідей дитини, без облікових записів і без надсилання даних. |  |
| `lic.list.lead` | To, co ci się spodobało: profile, szkoły i klasy. Lista jest w pliku z wynikami, więc możesz ją pokazać rodzicom albo wrócić do niej później. | Те, що тобі сподобалося: профілі, школи і класи. Список є у файлі з результатами, тож можеш показати його батькам або повернутися до нього пізніше. |  |
| `lic.list.empty` | Lista jest pusta. Na kompasie i przy szkołach kliknij serduszko, żeby coś tu dodać. | Список порожній. На компасі та біля шкіл клацни сердечко, щоб щось сюди додати. |  |
| `lic.list.toCompass` | Przejdź do kompasu | Перейти до компаса |  |
| `lic.list.profiles` | Profile | Профілі |  |
| `lic.list.classes` | Klasy | Класи |  |
| `lic.map.list` | Szkoły z twojej listy. | Школи з твого списку. |  |
| `lic.list.save` | Zapisz plik z listą | Зберегти файл зі списком |  |
| `lic.short.realna` | realna | реальний |  |
| `lic.short.zawalczenia` | do zawalczenia | варто поборотися |  |
| `lic.short.ambitna` | ambitna | амбітний |  |
| `lic.short.szkola` | w szkole | у школі |  |
| `lic.short.none` | bez oceny | без оцінки |  |
| `lic.f.aria` | Filtry | Фільтри |  |
| `lic.f.search` | Szukaj szkoły | Шукати школу |  |
| `lic.f.searchPh` | Szukaj: np. 31, Ingardena, programista | Шукай: напр. 31, Ingardena, програміст |  |
| `lic.f.school` | Szkoła: | Школа: |  |
| `lic.f.world` | Świat: | Світ: |  |
| `lic.f.any` | każdy | будь-який |  |
| `lic.f.anyF` | każda | будь-яка |  |
| `lic.f.from` | Dojazd z: {from} | Дорога з: {from} |  |
| `lic.f.upto` | do {m} min | до {m} хв |  |
| `lic.f.classes` | Klasy: | Класи: |  |
| `lic.f.noTest` | bez testu językowego | без мовного тесту |  |
| `lic.f.bi` | dwujęzyczne i międzynarodowe | двомовні й міжнародні |  |
| `lic.f.chance` | Szansa: | Шанс: |  |
| `lic.srcg.rules` | Zasady rekrutacji, punkty, terminy | Правила вступної кампанії, бали, терміни |  |
| `lic.srcg.rank` | Rankingi matur | Рейтинги матури |  |
| `lic.srcg.krk` | Szkoły i klasy: Kraków | Школи і класи: Краків |  |
| `lic.srcg.gzm` | Szkoły i klasy: Tychy i Metropolia GZM | Школи і класи: Тихи і Метрополія GZM |  |
| `lic.srcg.other` | Kierunki, zawody, studia, dojazd i inne | Напрями, професії, студії, дорога та інше |  |
| `lic.src.lead` | Każda informacja w Kompasie ma źródło. Tu jest pełna lista: {n} źródeł, w tym {c} oznaczonych „do sprawdzenia” (z serwisów zbiorczych albo starszego roku). Przy każdej szkole w „Źródła danych” są te, które jej dotyczą. | Кожна інформація в Компасі має джерело. Ось повний список: джерел — {n}, з них {c} позначено «перевірити» (зі збірних сайтів або за старший рік). Біля кожної школи в «Джерела даних» є ті, що її стосуються. |  |
| `lic.src.search` | Szukaj źródła | Шукати джерело |  |
| `lic.src.searchPh` | Szukaj: np. otouczelnie, Tychy, progi | Шукай: напр. otouczelnie, Тихи, прохідні бали |  |
| `lic.src.empty` | Nic nie pasuje. | Нічого не підходить. |  |
| `lic.src.foot` | Kompas nie łączy się z tymi stronami w czasie działania: dane są zapisane w aplikacji, a źródła są do sprawdzenia przez ciebie. Daty to stan, z którego wzięliśmy dane. | Компас не під'єднується до цих сайтів під час роботи: дані записані в застосунку, а джерела ти можеш перевірити сам. Дати — це стан, з якого ми взяли дані. |  |
| `lic.sch.title` | Szkoły {where} | Школи {where} |  |
| `lic.sch.lead` | {n} liceów i techników {where}, wszystkie klasy oprócz sportowych (poza jedną w Tychach, do sprawdzenia). Klasy dwujęzyczne mają znaczek i test językowy w szkole. | Ліцеїв і технікумів {where}: {n}, усі класи, крім спортивних (окрім одного в Тихах, його треба перевірити). Двомовні класи мають значок і мовний тест у школі. |  |
| `lic.sch.chances` | Etykiety szans liczymy z tego, jak ci idzie w szkole. | Позначки шансів ми рахуємо з того, як тобі йде в школі. |  |
| `lic.sch.mark` | Zaznacz, jak ci idzie w szkole, a zobaczysz też szanse. | Познач, як тобі йде в школі, і побачиш також шанси. |  |
| `lic.sch.where` | Gdzie: | Де: |  |
| `lic.sch.order` | Kolejność: | Порядок: |  |
| `lic.sch.byNo` | numer szkoły | номер школи |  |
| `lic.sch.byMatura` | wyniki matur | результати матури |  |
| `lic.sch.count` | Pokazano {a} z {b} | Показано {a} з {b} |  |
| `lic.sch.empty` | Nic nie pasuje. Tej szkoły może nie być w bazie: Kompas nie ma jeszcze klas sportowych i szkół prywatnych. | Нічого не підходить. Можливо, цієї школи немає в базі: у Компасі ще немає спортивних класів і приватних шкіл. |  |
| `lic.map.above` | Szkoły z listy powyżej. | Школи зі списку вище. |  |
| `lic.sch.note` | Klas sportowych prawie nie ma (mają test sprawności); jedyna to IV LO Tychy 1MS, dopisana do sprawdzenia. Pomijamy też szkoły sportowe, prywatne i technika bez kierunków z Kompasu (w Krakowie np. gastronomia). Nowe szkoły pokazujemy dopiero wtedy, gdy sprawdzimy ich miejsce na mapie. | Спортивних класів майже немає (у них тест на фізичну підготовку); єдиний — IV LO Tychy 1MS, доданий як такий, що його треба перевірити. Ми також пропускаємо спортивні й приватні школи та технікуми без напрямів з Компаса (у Кракові, напр., гастрономія). Нові школи показуємо лише тоді, коли перевіримо їхнє місце на мапі. |  |
| `lic.map.town` | Miasto na mapie | Місто на мапі |  |
| `lic.map.title` | Mapa szkół | Мапа шкіл |  |
| `lic.map.lead` | Kolor pinezki pokazuje najlepszą szansę w tej szkole. Położenie pochodzi z OpenStreetMap. Dojazd sprawdzisz przyciskiem „Dojazd” albo tu: {links}. | Колір маркера показує найкращий шанс у цій школі. Розташування взято з OpenStreetMap. Дорогу перевіриш кнопкою «Дорога» або тут: {links}. |  |
| `lic.map.aria` | Mapa szkół {where} | Мапа шкіл {where} |  |
| `lic.map.loading` | Ładuję mapę… | Завантажую мапу… |  |
| `lic.map.nopin` | Bez pinezki (brak położenia): {list}. | Без маркера (немає розташування): {list}. |  |
| `lic.map.fail` | Nie udało się wczytać mapy. Lista poniżej ma przyciski „Dojazd”. | Не вдалося завантажити мапу. У списку нижче є кнопки «Дорога». |  |
| `lic.md.title` | # Kompas Liceum – {name}, {date} | # Kompas Liceum – {name}, {date} |  |
| `lic.md.me` | ja | я |  |
| `lic.md.path` | Ścieżka: wybór liceum i technikum, {where} · Wersja: v{v} | Шлях: вибір ліцею і технікуму, {where} · Версія: v{v} |  |
| `lic.md.progress` | > Zapis postępu: wyniki pojawią się po wypełnieniu pytań. Wczytaj ten plik w Kompasie, żeby kontynuować. | > Збереження прогресу: результати з'являться після заповнення питань. Завантаж цей файл у Компасі, щоб продовжити. |  |
| `lic.md.strengths` | ## Moje mocne strony | ## Мої сильні сторони |  |
| `lic.md.strength` | {i}. {name} – dowód: „{proof}” | {i}. {name} – доказ: «{proof}» |  |
| `lic.md.compass` | ## Mój kompas | ## Мій компас |  |
| `lic.md.list` | ## Moja lista | ## Мій список |  |
| `lic.md.lprofile` | - profil: {name} | - профіль: {name} |  |
| `lic.md.lschool` | - szkoła: {name} | - школа: {name} |  |
| `lic.md.travelFrom` | , dojazd {min} z: {from} | , дорога {min} з: {from} |  |
| `lic.md.lclass` | - klasa: {school}, {code} ({label}) | - клас: {school}, {code} ({label}) |  |
| `lic.md.classes` | ## Klasy {where}: {name} | ## Класи {where}: {name} |  |
| `lic.md.transit` | Dojazd: {list} | Дорога: {list} |  |
| `lic.md.year` | Progi z rekrutacji {year}. {note} | Прохідні бали з вступної кампанії {year}. {note} |  |
| `lic.md.class` | - {school}, klasa {code} ({label}) | - {school}, клас {code} ({label}) |  |
| `lic.md.travel` | , dojazd {min} | , дорога {min} |  |
| `lic.md.parents` | ## Dla rodziców: progi i szacunek | ## Для батьків: прохідні бали і розрахунок |  |
| `lic.md.soft` | Szacunek z odpowiedzi „słabo, dobrze, świetnie” (słabo = 3 i ok. 45%, dobrze = 4 i ok. 70%, świetnie = 5 i ok. 90%). | Розрахунок з відповідей «слабо, добре, чудово» (слабо = 3 і бл. 45%, добре = 4 і бл. 70%, чудово = 5 і бл. 90%). |  |
| `lic.md.none` | Brak odpowiedzi o szkole, więc bez szacunku. | Немає відповідей про школу, тож без розрахунку. |  |
| `lic.md.th.entry` | egzamin wstępny w szkole, bez progu | вступний іспит у школі, без прохідного балу |  |
| `lic.md.th` | próg {n} | прохідний бал {n} |  |
| `lic.md.th.range` | zakres szkoły {a}–{b} | діапазон школи {a}–{b} |  |
| `lic.md.th.none` | bez progu w źródłach | без прохідного балу в джерелах |  |
| `lic.md.thline` | - {school}, klasa {code}: {th} | - {school}, клас {code}: {th} |  |
| `lic.md.est` | , szacunek {n} | , розрахунок {n} |  |
| `lic.md.plan` | ## Mój plan | ## Мій план |  |
| `lic.md.talk` | ## Pytania do rozmowy z rodzicami | ## Питання для розмови з батьками |  |
| `lic.md.q1` | - Która klasa daje ci najwięcej energii, a która tylko dobrze brzmi? | - Який клас дає тобі найбільше енергії, а який лише гарно звучить? |  |
| `lic.md.q2` | - Co zrobisz w tym miesiącu, żeby przybliżyć się do wybranej klasy? | - Що ти зробиш цього місяця, щоб наблизитися до обраного класу? |  |
| `lic.md.q3` | - Jaką klasę wpiszesz jako bezpieczną i czy chcesz w niej się uczyć? | - Який клас ти впишеш як надійний і чи хочеш у ньому вчитися? |  |
| `lic.md.data` | <!-- dane do ponownego wczytania --> | <!-- дані для повторного завантаження --> |  |
| `lic.load.bad` | To nie wygląda na plik z Kompasu Liceum. Wybierz plik pobrany z tej aplikacji. | Це не схоже на файл з Kompas Liceum. Вибери файл, завантажений з цього застосунку. |  |
| `lic.load.m.strength` | mocna strona:  | сильна сторона:  |  |
| `lic.load.m.value` | wartość:  | цінність:  |  |
| `lic.load.m.activity` | czynność:  | дія:  |  |
| `lic.load.m.situation` | sytuacja:  | ситуація:  |  |
| `lic.load.m.area` | kierunek:  | напрям:  |  |
| `lic.load.ok` | Wczytano plik z dnia {date}. | Завантажено файл від {date}. |  |
| `lic.load.missing` | Tych rzeczy nie ma już w bazie, więc je pominięto: {list}. | Цих речей уже немає в базі, тому їх пропущено: {list}. |  |
| `lic.load.last` | Wracasz tam, gdzie skończyłeś. | Повертаємося до місця, де закінчилися відповіді. |  |
| `lic.load.open` | Wracasz do pierwszego kroku, który czeka na odpowiedź. | Повертаємося до першого кроку, який чекає на відповідь. |  |
| `lic.save.msg` | Plik zapisany. | Файл збережено. |  |
| `lic.save.toast` | <b>Zapisano:</b> {name}<br><span>Plik jest w folderze Pobrane. Żeby wrócić, wczytaj go na ekranie startowym.</span> | <b>Збережено:</b> {name}<br><span>Файл у папці «Завантаження». Щоб повернутися, завантаж його на початковому екрані.</span> |  |
| `lic.loadFail` | Nie udało się wczytać danych ({err}). Odśwież stronę. | Не вдалося завантажити дані ({err}). Онови сторінку. |  |
| `lic.years.other` | (fractions) | {n} року |  |
