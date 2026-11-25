# Kompas backlog

Three parts:

1. **Kompas Liceum roadmap to v3.0** (set 19 Nov 2026). Releases in order, each task marked **Sonnet** or **Opus**.
2. **Small jobs** (D1–D8, U1–U7) left after the review of 13 Nov 2026. The roadmap points to them by id.
3. **Kompas Studia roadmap** (started 19 Nov 2026), at the end of this file. One minor release per night, focus by rotation.

**Top priority since 21 Nov 2026, 15:13: the coverage waves (next section). They come before every other task in Part 1 and Part 3, and UI/UX work waits until they are done.**

The Liceum roadmap is in the spec doc (section "Kompas Liceum roadmap (19 Nov)"); the Studia v3.0 goals are in "Kompas Studia roadmap: v3.0 goals (weekend review, 21 Nov)".

## Coverage waves (set 21 Nov 2026, 15:13; top priority for both apps)

> **Studia: waves done (3.0.0). Since 24 Nov 2026 the top priority for Studia is the Ukrainian version** (Part 3, section
> "Ukrainian version", releases v3.1–v3.6). Liceum waves continue unchanged in Part 1.

**Why.** The coverage radar (`python3 kompas/tools/coverage_radar.py`, added 21 Nov) scores 17 study fields from 0 to 4 for each app.
Both apps are strong in medicine, IT, economy, engineering and languages, and have holes elsewhere. The worst: a kid who picks the
humanities in Liceum (79 classes, level 4) lands in Studia with one history offer, and law is missing in both. Szymon: "it must be
addressed with high priority", in 3 waves per app, split by importance or number of students, covering **offers and discovery
questions**, UI/UX later.

**Levels.** 0 none · 1 data rows only, no own direction or card · 2 shared or thin card · 3 own card or direction and 3 or more items ·
4 own card or direction and 8+ programmes (Studia) or 15+ classes (Liceum).

**Baseline (21 Nov 2026, after Studia 2.6.0 and Liceum 2.9.0).**

| Field | Studia items | Studia level | Liceum items | Liceum level |
|---|---|---|---|---|
| Medycyna i zdrowie | 20 | 4 | 77 | 4 |
| Psychologia i nauki społeczne | 4 | 3 | 18 | 4 |
| Pedagogika i edukacja | 4 | 3 | 19 | 4 |
| Informatyka, dane, AI | 8 | 4 | 99 | 4 |
| Inżynieria i technika | 8 | 4 | 54 | 4 |
| Budownictwo i architektura | 1 | 1 | 6 | 3 |
| Nauki ścisłe | 2 | 2 | 131 | 4 |
| Przyroda i środowisko | 5 | 3 | 52 | 4 |
| Ekonomia i biznes | 9 | 4 | 56 | 4 |
| Prawo i administracja | 1 | 1 | 3 | 2 |
| Języki i filologie | 5 | 3 | 52 | 4 |
| Historia, filozofia, kultura | 1 | 2 | 79 | 4 |
| Media i komunikacja | 7 | 3 | 2 | 2 |
| Sztuka i design | 4 | 3 | 3 | 1 |
| Sport | 2 | 2 | 17 | 4 |
| Bezpieczeństwo i obronność | 3 | 3 | 9 | 1 |
| Turystyka i usługi | 1 | 2 | 8 | 1 |

(Liceum counts for "Nauki ścisłe" and "Historia" are inflated by broad cards; a class can count in several fields. Read the levels, not the counts.)

**CW0 result (21 Nov 2026): students per field, GUS.** GUS publishes field groups only at the broad ISCED-F level (no narrow fields in
the open signal reports). Students (shares, all of Poland, 31 Dec): 2024/25 business, administration and law 22.6%, social sciences,
journalism and information 14.2%, health and care 14.0%, engineering, manufacturing and construction 12.3% (`gus-sw-2024-25`);
2025/26: 22.1%, 14.7% health, 14.4% social, 12.3% engineering (`gus-sw-2025-26`, total 1,322.8 thousand; Małopolska 157,473).
Graduates in 2024 by all groups (`gus-sw-2024-25`, Tablica 2, total 291,986):

| Group (ISCED-F) | Graduates 2024 | Share | Our fields |
|---|---|---|---|
| Biznes, administracja i prawo | 71,882 | 24.6% | ECO, LAW |
| Zdrowie i opieka społeczna | 41,145 | 14.1% | MED |
| Technika, przemysł, budownictwo | 38,963 | 13.3% | ENG, BUD |
| Nauki społeczne, dziennikarstwo i informacja | 33,808 | 11.6% | PSY, MEDIA |
| Nauki humanistyczne i sztuka | 27,210 | 9.3% | HUM, LNG, ART |
| Usługi | 23,560 | 8.1% | TUR, SEC, SPO |
| Kształcenie | 17,656 | 6.0% | EDU |
| Technologie teleinformacyjne | 16,161 | 5.5% | INF |
| Nauki przyrodnicze, matematyka i statystyka | 10,307 | 3.5% | SCI, BIO |
| Rolnictwo | 4,852 | 1.7% | BIO (agri, vet) |

Order check: wave 1 stays (law sits in the biggest group, building and mechanics in the third). Humanities and arts (wave 2) and
services (wave 3: tourism, security, sport) are bigger groups than education; they keep their waves because education is only shared
today, while history, arts and security already have a card. No swap.

**v3.0 result (Studia), 21 Nov 2026, after 3.0.0.** Every Studia field is at level 3 or 4. Moved since 2.12.0: Psychologia i nauki
społeczne 7 → 9 items, level 3 → 4 (UJ Politologia, UKEN Praca socjalna). Liceum still has Bezpieczeństwo and Turystyka at 1 (Liceum waves).

| Field | Studia items | Studia level | Liceum items | Liceum level |
|---|---|---|---|---|
| Medycyna i zdrowie | 23 | 4 | 77 | 4 |
| Psychologia i nauki społeczne | 9 | 4 | 18 | 4 |
| Pedagogika i edukacja | 6 | 3 | 19 | 4 |
| Informatyka, dane, AI | 8 | 4 | 99 | 4 |
| Inżynieria i technika | 12 | 4 | 54 | 4 |
| Budownictwo i architektura | 7 | 3 | 6 | 3 |
| Nauki ścisłe | 6 | 3 | 131 | 4 |
| Przyroda i środowisko | 8 | 4 | 52 | 4 |
| Ekonomia i biznes | 9 | 4 | 56 | 4 |
| Prawo i administracja | 5 | 3 | 30 | 4 |
| Języki i filologie | 5 | 3 | 52 | 4 |
| Historia, filozofia, kultura | 5 | 3 | 79 | 4 |
| Media i komunikacja | 7 | 3 | 33 | 4 |
| Sztuka i design | 7 | 3 | 4 | 3 |
| Sport | 3 | 3 | 17 | 4 |
| Bezpieczeństwo i obronność | 3 | 3 | 9 | 1 |
| Turystyka i usługi | 3 | 3 | 8 | 1 |

**Liceum 2.11.0 (22 Nov 2026), radar re-run.** Liceum moved: Inżynieria i technika 54 → 55 items, Ekonomia i biznes 56 → 58,
Turystyka i usługi 8 → 10 (Technikum Mechaniczne nr 16); every level unchanged (both new directions sit in fields already at 4).
Still at 1 in Liceum: Bezpieczeństwo i obronność, Turystyka i usługi (wave 2, v2.12). Studia columns unchanged.

**Liceum 2.12.0 (25 Nov 2026), radar re-run.** Moved: Bezpieczeństwo i obronność level 1 → 3 (9 classes, direction `mundurowe`),
Turystyka i usługi 1 → 3 (10 classes, direction `turystyka`). Item counts unchanged. **Liceum now has every field at level 3 or more**
(Sztuka i design and Budownictwo stay at 3; art licea come with A2/A3 in v2.13). Studia columns unchanged.

**Rules for the waves.**
1. **Offer and questions together.** A new Studia card or Liceum direction is done only when (a) it has real offers or classes with a source,
   and (b) the discovery questions reach it: at least 2 activity cards and, where it fits, a strength, one test kid per new card ends with
   it in the top 3, and no card is top 3 for most kids (tests in `tests/run.mjs` and `tests/liceum.mjs`).
2. **UI/UX waits.** Until Studia v3.0 and Liceum v3.0 are released, no UI/UX or look work except bug fixes. Nightly planners skip the
   "UI/UX" focus and take the next wave task instead (Data → Questions and functionality → Data …).
3. **Order by importance and student numbers.** Wave 1 = the biggest groups of students and the biggest gaps; wave 3 = small fields.
   Task **CW0 (Sonnet)** writes the real enrolment per field here (GUS "Szkoły wyższe", latest year; MEN for technika) and may swap
   a card between waves if the numbers say so; the order below is the first estimate.
4. **Both apps agree.** A Liceum direction names the Studia cards it leads to (`studiaCards`); do the Studia wave N data release before
   or in the same week as Liceum wave N. Offers outside Kraków are allowed when a field is not taught in Kraków (Studia 2.6 rule).
5. **Radar after every release.** Run the script, paste the new table here, and say which fields moved.
6. **Done when:** every field is at level 3 or more in Studia, and in Liceum for every field that has classes in the data; every card or
   direction is reachable by the questions. Fields without any programme in Kraków (e.g. oceanography) may stay at 2 with a note.

**Szymon's confirmation (21 Nov 15:13):** all nine proposed Studia cards of SD1 go in (the three waves below); the tap cards are
approved; the order inside a wave may change after CW0.

### Studia waves (releases v2.7–v2.12, review v3.0)

| Wave | Cards (SD1 numbers) | Why first | Releases |
|---|---|---|---|
| 1 | **Prawo i administracja** (1) · **Architektura i budownictwo** (4) · **Mechanika, materiały i produkcja** (5) · **Edukacja i nauczanie** (8) | Largest student groups: law and administration, civil and mechanical engineering, teacher training; all level 1 or shared today | v2.7 Data, v2.8 Questions |
| 2 | **Społeczeństwo, polityka i praca socjalna** (7) · **Nauka i badania** (6) · **Sztuka, muzyka i scena** (2) · **Historia, kultura i dziedzictwo** (9a) | Mid-size fields, completely missing or only applied; arts need entrance-exam info | v2.9 Data, v2.10 Questions |
| 3 | **Żywienie i dietetyka** (3a) · **Weterynaria, zwierzęta i rolnictwo** (3b) · **Geografia, przestrzeń i planowanie** (9b) · deepen **Sport**, **Turystyka** | Small fields; also the thin cards that already exist | v2.11 Data, v2.12 Questions |
| review | Radar at level 3 everywhere; spec doc; Aleks sees the whole compass | | v3.0 |

Details: "Studia v2.7 … v3.0 tasks" at the end of Part 3. UI/UX items of the old v3.0 list move to v3.1–v3.3.

### Liceum waves (releases v2.10–v2.14, review v3.0)

| Wave | Directions | Why | Release |
|---|---|---|---|
| 1a | Arts world + profile "Artystyczny" · Health apart from biology · Law and media as two directions | Biggest holes in the questions (Q1a audit); health and law lead to large Studia fields | v2.10 |
| 1b | Mechanika, pojazdy i produkcja · Transport i logistyka | Technika with many students that sit under "elektronika" and "biznes" today | v2.11 |
| 2 | Art licea and music schools (entrance exams) · Mundurowe i bezpieczeństwo · Turystyka, hotelarstwo i gastronomia | Classes already in the data (9 uniformed, 8 tourism) but no direction of their own | v2.12 |
| 3 | Rolnictwo, żywność i przyroda stosowana · even worlds (Q4) · sports data (V1a, V1b) | Small groups; new technikum professions from Sept 2026 | v2.13 (direction) + v2.14 (rest) |
| review | Sports track and exact points (V1c); radar check | | v3.0 |

UI/UX moved after v3.0: calm look and exam taps v3.1, profile drawings v3.2, parent page v3.3, Ukrainian v3.4 (see "v3.0 tasks" below).

## Part 1: Kompas Liceum roadmap to v3.0

## Next minor: v2.13 (planned 2026-11-25)

Current `appVersion` 2.12.0; v2.12 was released today (25 Nov, commit 64d7703), so nothing is waiting and no plan is stacked.
The roadmap entry for v2.13 (11 tasks) is far too big for one night, so it is **split in two**: tonight = the database jobs that
v2.12 could not do (A2, L1-11) plus a first wave-3 slice that has classes to point to; **v2.14** = Q4, V1a, V1b, CD4, A3, L1-12
(see the release table). Reason for the wave-3 data task: today only **1 class** in the whole database fits the new direction
(Tychy, technik architektury krajobrazu i arborystyki), so W3L1 would get radar items only if a food or agri school goes in first.
**Web check done while planning (25 Nov, evening):** pages opened in this cloud run (gov.pl PLSP schedule page and an umtychy.pl PDF
both read), so the night run should be able to open sources; if a page still fails, skip that item and say so (rule: no fact without an opened page).
Q1 item 5 (extra situations) stays untouched. One commit per task (rule 8). Order: 1 → 2 → 3 → 4 → 5 → 6 (3 needs 2; 6 needs all).

1. [ ] **A2 (Sonnet) Art liceum and music school, Kraków.** Goal: add as waiting schools (`geoPending`, `geoPendingSince` = the run's
   date) Państwowe Liceum Sztuk Plastycznych im. J. Kluzy (licea order 34) and POSM II st. im. F. Chopina (order 36); OSM II st.
   (order 19) only if an official page names it, else skip and say so. Per school: full name, address, `www` (the gov.pl page),
   one class with `entry` (kind `plastyczny` / `muzyczny`, one-line note on what the exam is, from the school's page), `cards` to the
   arts directions, `fields` ART, `kompasId` in `krakow/ranking.json`. Known from the planner's read (to confirm on the page again):
   PLSP, ul. Mlaskotów 6, 30-117 Kraków; exam 2026/27 = oral test on art, drawing (A3, 90 min), painting (A3, 90 min), plasticine
   composition (90 min). Source pages: gov.pl/web/plastykkrakow "Szczegółowy harmonogram egzaminów … 2026/2027" and "Regulamin
   przyjmowania kandydatów do PLSP"; gov.pl/web/posmkrakow "Rekrutacja kandydatów na rok szkolny 2026/2027". No threshold; no 2027
   dates unless published. Facts not on a page = `"status": "check"`.
   Files: `krakow/schools.json`, `krakow/ranking.json`, `sources.json`. Check: three tests pass; ranking test "Kompas schools with a
   place: 49 of 53"; with the flags removed by hand (not committed) test kid P8 sees both under "Artystyczny" with the exam tag.
2. [ ] **K6 (Sonnet) Technikum Przemysłu Spożywczego nr 22 im. św. M. M. Kolbe (ZSPS), Kraków** (technika order 26; the only food
   technikum in Kraków, needed by task 3). Same steps as K4: waiting school, address, 2026/27 professions (e.g. technik technologii
   żywności, technik żywienia i usług gastronomicznych: only those the page lists) and thresholds only from an official page or
   otouczelnie (otouczelnie.pl/artykul/3007/Technika-w-Krakowie/1736/Technikum-Przemyslu-Spozywczego-nr-22-…-w-ZSPS; school domain
   hint zsps.krakow.pl, seen in search), `www` only if the page opens and names the school, `kompasId` in `krakow/ranking.json`,
   `fields`, no `cards` yet (task 3). Unconfirmed class facts stay "check".
   Files: `krakow/schools.json`, `krakow/ranking.json`, `sources.json`. Check: three tests pass; ranking 50 of 54 (51 of 55 with task 5).
3. [ ] **W3L1 + W3L2 (Opus) Direction "Rolnictwo, żywność i przyroda stosowana" and its classes.** Goal: one direction with card text,
   `field`, `afterSchool`, `studiaCards` (Studia `zywienie`, `weterynaria`, `geografia` where it fits), `worlds`, 3 tap cards (plants
   and animals, cooking and food, outdoor work) and one strength where it fits; set `cards` on the classes that fit: Tychy technik
   architektury krajobrazu i arborystyki, K6 classes, every "technik żywienia i usług gastronomicznych" class (second card, after
   `turystyka`); no class loses its old card. Test kid P16 (food/plants, either area) has it in the top 3; P1–P15 keep their north
   (list them in the commit); CD rule tests still pass. If fewer than 3 classes fit after task 2, still add the direction and say the
   radar item count in the release note (the field it maps to may already be at level 4).
   Files: `liceum/data/opportunities.json`, `profiles.json`, `questions.json`, school files (`cards` only), `tests/liceum.mjs`,
   `tools/questions_audit.py`. Check: three tests pass; `coverage_radar.py` run and pasted (rule 5).
4. [ ] **L1-11 (Sonnet) School links, batch 11 (5 schools), and the Tychy informator.** Goal: `www` for Technikum nr 6 Tychy (`ty-t6`;
   lead from 25 Nov: otouczelnie gives zs4.oswiata.tychy.pl, confirm on the page), `tm16` (hint zsm2krakow.pl), `lo31`, `lo15`, `lo12`;
   same rule as before (page opens and names the school, or `krk-siec-szkol` / BIP shows it); skip and list the rest.
   Tychy informator: **umtychy.pl/media/get/10016731 is the 2023/24 informator** (read on 25 Nov), so it cannot replace
   `ty-informator-2025`; look only for a 2026/27 one on oswiata.tychy.pl / umtychy.pl; otherwise keep the old one and say so.
   Files: `krakow/schools.json`, `tychy/schools.json`, `sources.json`. Check: syntax test; "strona szkoły" opens in a new tab on two cards;
   `python3 kompas/tools/old_sources.py` (Liceum line gone or explained).
5. [ ] **K5 (Sonnet) Technikum Poligraficzno-Medialne nr 20 im. Z. Klemensiewicza, Kraków** (technika order 8, highest-ranked public
   Kraków technikum missing). Same steps as K6; source otouczelnie.pl/artykul/3007/Technika-w-Krakowie/1443/…; `cards` media /
   informatyka. **Skip if the night runs short** (moves to v2.14, say so).
   Files: `krakow/schools.json`, `krakow/ranking.json`, `sources.json`. Check: three tests pass; ranking count +1.
6. [ ] **R2.13 (Opus) Review and release v2.13.0.** Review the Sonnet commits (sources open and say what the data says, no guessed
   threshold, no threshold next to `entry`, areas not mixed, new schools hidden while waiting); click-through at 375 and 1280 px in
   three looks with P8 (arts, Kraków) and P16, compass and map first; set 2.13.0 in the four places and `dataVersion`; radar re-run in
   "Coverage waves"; update "Database status" below; short "Kompas Liceum v2.13.0" in the spec doc; push; then check that the
   "Geocode schools" Action filled the new points and Kraków travel times (say which are still waiting).

**Database status (25 Nov 2026, evening, before 2.13).** No data change since 2.12.0. Run: the three tests (green), `coverage_radar.py`,
`old_sources.py`, a count over `schools.json`; "known" = otouczelnie 2026 lists in `krakow/ranking.json` (64 licea, 26 technika) and
`gzm/ranking.json` (114 licea, 96 technika), incl. private, sports and music schools.

| Area | Schools in DB / known | Public missing (next in order) | Missing `www` | Classes "check" | No threshold | No `scored` | No `extended` | Old sources (> 12 months) |
|---|---|---|---|---|---|---|---|---|
| Kraków | 51 / 90 | 13: PLSP 34, POSM 36 (→ A2), OSM II st. 19 (if a page exists); 10 technika: TPM 20 (→ K5), TPS 22 (→ K6), PGNiG 9, TEH 5, TG 11, TIŚ 13, TGH 10, TO 18, T 2, TEE 23 | 31 (`tm16`, `lo31`, `lo15`, `lo12` → L1-11; then `tl14`, `tee7`, `lo41`, `lo27`, `lo43` → L1-12) | 143 of 246 | 38 | 96 | 2 | 0 |
| Tychy | 10 / 13 | 0 | 1 (`ty-t6` → L1-11) | 42 of 42 | 26 (+16 from licea-progi.pl to confirm) | 33 | 6 | 1 (`ty-informator-2025`) |
| GZM other towns | 5 / 197 | PLSP Katowice (licea 39), POSM II st. Katowice, LSP Gliwice (87) → A3 (v2.14); the rest after v3.0 | 0 | 36 of 36 | 13 | 27 | 1 | 0 |

All 66 schools have an address, a map point and `geoChecked`; 0 waiting. Radar (Liceum): every field at level 3 or more (Sztuka,
Budownictwo, Bezpieczeństwo, Turystyka at 3). Stale Studia sources (6) belong to Part 3.

**News found while planning (25 Nov 2026, evening).**
- 2027/28 recruitment: still no Małopolska or Śląskie act; the newest Kraków act is zarządzenie 10/26 MKO for 2026/27
  (kuratorium.krakow.pl/wp-content/uploads/2026/01/zarzadzenie-10_26-mko-rekrutacja-2026-2027.pdf). Keep `recruitmentWindow`; expect January 2027.
- Kraków new liceum: no council resolution found in a BIP search; nothing to enter.
- Tychy: no 2027/28 page. The lead `umtychy.pl/media/get/10016731` is the city's informator for **2023/24** (opened tonight), not 2026/27; dropped.
- PLSP Kluzy: 2026/27 exam schedule page opened (exam 25–26 May 2026, results 29 May); no 2027/28 dates yet (expected spring 2027).
- New Kraków lead for wave 3: Technikum Przemysłu Spożywczego nr 22 (ZSPS) has an otouczelnie page and a school site (zsps.krakow.pl,
  statute dated 16 Apr 2026) → K6.

## Minor v2.12 (planned 2026-11-22, re-planned 2026-11-24, released 2026-11-25 as 2.12.0)

**Why a re-plan, not v2.13.** `appVersion` is still 2.11.0 and no Liceum commit has landed since the v2.12 plan of 22 Nov (no Liceum
commit on 23 or 24 Nov; the reason is not in the repo; 24 Nov went to Studia v3.1–v3.4, Ukrainian). So v2.12 was never released and no new plan is stacked.
The 22 Nov plan (6 tasks, three of them Opus with new structure) is trimmed so one midnight session can finish it:
- **A3** (art and music schools in Katowice and Gliwice) moves to **v2.13** (it needs A1 anyway and adds a second area's sources);
  the Gliwice Liceum Sztuk Plastycznych still has no official page in the 24 Nov search (only other towns' gov.pl/web/plastyk… pages).
- **L1-11** is cut to 5 links (was 10); the other 5 move to L1-12.
- **CD3** stays folded into W2L1 and R2.12, as planned.
- **New order: W2L1 first.** It closes the last two radar holes (Bezpieczeństwo 1, Turystyka 1) and does not need A1; if the night
  runs short, the release can go out with W2L1 + L1-11 and A1/A2 move to v2.13 (say so in the release note).
- R2.12 gets one small extra (see task 5): the Studia Ukrainian work changed shared code Liceum uses (`core/export.js`,
  `core/scoring.js`, new `core/i18n.js` loaded in `liceum/app.js`); tests are green, but no Liceum click-through has been done since.

K1-7 (Kraków class check) stays parked (many school pages; night runs could not open them). G3 and new GZM towns stay after v3.0.
The v3.0 plan is agreed; its open question (Q1 item 5, extra situations) is not touched. One commit per task (rule 8).
Order: 1 → 2 → 3 → 4 → 5 (3 needs 2; 5 needs all that landed).

1. [x] **W2L1 (Opus) Directions "Mundurowe i bezpieczeństwo" and "Turystyka, hotelarstwo i gastronomia" (+ CD3 tests).**
   Goal: two directions with card text, `field` (SEC / TUR), `afterSchool`, `studiaCards` (Studia Bezpieczeństwo, Turystyka cards),
   `worlds`, 3 activity cards each and one strength where it fits; set `cards` on the classes already in the data (9 uniformed classes
   incl. XXV LO, technik hotelarstwa, organizacji turystyki, żywienia i usług gastronomicznych, turystyczne classes; also the tm16
   organizacji turystyki class). Tone: no recruiting, only what the class is. No class loses its old card unless it was wrong (say which).
   Test kids P14 (uniformed, Kraków) and P15 (tourism/gastronomy, Tychy) have their direction in the top 3; P1–P13 keep their north
   (list them in the commit); the CD rule tests (2+ tap cards and a strength per direction; no profile north for more than a third of
   the kids) still pass.
   Files: `liceum/data/opportunities.json`, `profiles.json`, `questions.json`, school files (`cards` only), `tests/liceum.mjs`,
   `tools/questions_audit.py` (field list). Check: three tests pass; `python3 kompas/tools/coverage_radar.py` shows Bezpieczeństwo
   and Turystyka at level 3 or more in Liceum.
2. [x] **A1 (Opus) Schools with an entrance exam.** Goal: a class may have `entry: {kind: "plastyczny" | "muzyczny", note, sourceId}`
   instead of a threshold; the class card shows the tag "egzamin wstępny / przesłuchanie w szkole" (like the bilingual test tag),
   chances say "do sprawdzenia w szkole", never a number or a points gap; such classes count for the "Artystyczny" profile
   (`cards` → arts directions). Old saved files still load. No change to the points formula (only skip the threshold).
   Files: `liceum/app.js`, `liceum/points.js` (skip only), `tests/liceum.mjs`, `tests/syntax.mjs` (`entry.kind` in the list,
   `entry.sourceId` exists in `sources.json`, no `threshold` next to `entry`).
   Check: three tests pass; a temporary test class with `entry` (not committed) shows the tag and no points gap at 375 and 1280 px.
3. [ ] **A2 (Sonnet) → moved to v2.13 (25 Nov: pages could not be opened) Art liceum and music schools, Kraków.** Goal: add as waiting schools (`geoPending`, `geoPendingSince` = today)
   the state schools missing from `krakow/ranking.json`: Państwowe Liceum Sztuk Plastycznych im. J. Kluzy (licea order 34,
   gov.pl/web/plastykkrakow: "Szczegółowy harmonogram egzaminów … 2026/2027", "Regulamin przyjmowania kandydatów") and POSM II st.
   im. F. Chopina (order 36, gov.pl/web/posmkrakow: "Rekrutacja kandydatów na rok szkolny 2026/2027"; both pages still listed on
   24 Nov). Ogólnokształcąca Szkoła Muzyczna II st. (order 19) only if an official page names it (none found on 24 Nov; else skip
   and say so). Per school: full name, address, `www` (the gov.pl page), classes with `entry` (kind, a one-line note on what the exam
   is, from the school's rules), `cards` to the arts directions (plastyka / muzyka), `fields` ART, `kompasId` in `krakow/ranking.json`.
   Exam dates for 2027 only if published (expected spring 2027; otherwise none). No threshold. Facts not on the page = `"status": "check"`.
   Files: `krakow/schools.json`, `krakow/ranking.json`, `sources.json`. Check: three tests pass; ranking test "Kompas schools with a
   place: 49 of 53" (or 50 of 54 with OSM); with the flags removed by hand (not committed) test kid P8 sees them under "Artystyczny".
4. [ ] **L1-11 (Sonnet) → moved to v2.13 (25 Nov: pages could not be opened) School links, batch 11 (5 schools), and the Tychy informator.** Goal: `www` for up to 5 schools in this order:
   Technikum nr 6 Tychy (`ty-t6`), Technikum Mechaniczne nr 16 (`tm16`, hint zsm2krakow.pl), XXXI LO (`lo31`), XV LO (`lo15`),
   XII LO (`lo12`). Set `www` only after the page opens and names the school, or the city list `krk-siec-szkol` / BIP shows it;
   skip and list the rest. Also (D9 follow-up): replace `ty-informator-2025` (asOf 2025-05, 18 months, the one stale Liceum source)
   with the city's 2026/27 informator if an official umtychy.pl / oswiata.tychy.pl page has it (open umtychy.pl/media/get/10016731,
   which still comes up in the 24 Nov search); otherwise keep it and say so.
   Files: `krakow/schools.json`, `tychy/schools.json`, `sources.json`. Check: syntax test; "strona szkoły" opens in a new tab on two
   cards; `python3 kompas/tools/old_sources.py` (Liceum line gone or explained).
5. [x] **R2.12 (Opus) Review and release v2.12.0.** Review the Sonnet commits (sources open and say what the data says, no guessed
   thresholds and no threshold next to `entry`, areas not mixed, new schools hidden while waiting); run `tools/questions_audit.py`
   and paste the table under "Result 2.12.0" (rest of CD3); click-through at 375 and 1280 px in three looks with P8 (Kraków, arts),
   P14 and P15, compass and map first. **Extra (shared code):** in the same click-through, save the file from Liceum, reload it, and
   check the export text is Polish and complete (no raw i18n keys like `export.…`) after the Studia changes to `core/export.js` and
   `core/i18n.js`; fix in a 2.12.x commit if not. Set 2.12.0 in the four places and `dataVersion`; radar re-run pasted in "Coverage
   waves" (rule 5); update "Database status" below; short "Kompas Liceum v2.12.0" in the spec doc; push; then check that the
   "Geocode schools" Action filled the new points and Kraków travel times (say which are still waiting).

**Result 2.12.0 (25 Nov 2026).**
- W2L1: directions `mundurowe` ("Mundurowe i bezpieczeństwo", SEC, profile Sport, studiaCards sluzby + obronnosc) and `turystyka`
  ("Turystyka, hotelarstwo i gastronomia", TUR, profile Językowy, studiaCards turystyka + zywienie); 3 tap cards each (u1–u3 in world
  "Sport, ruch i służby", g1–g3 in "Języki, podróże i goście"). 22 directions, 63 tap cards. Profiles renamed "Sport, ruch i służby"
  and "Językowy: świat i turystyka". 18 classes linked (new card first, no old card removed): mundurowe 9 (XVI LO 1D 1F, XXV LO 1A–1F,
  Tychy IV LO 1P), turystyka 9 (XI LO 1B, XVI LO 1E, XXX LO 1G, tm16 1TT, teh4 1c, Tychy III LO 1T, T2 1T, T6 1T, T6 1Ż).
  Test kids P14 (uniformed, Kraków) → N Sport, mundurowe 1st; P15 (tourism, Tychy) → N Językowy, turystyka 1st; P1–P13 keep their north.
- A1: `entry {kind, note, sourceId}` on a class: tag "egzamin wstępny / przesłuchanie w szkole", chance "do sprawdzenia w szkole"
  (pill "w szkole"), never a number or gap; left out of the points shortlist; syntax and liceum tests. No real class has it yet (A2).
- **Skipped: A2 and L1-11.** The night run could not open any web page (fetch permission not answered, unattended run), and the rule is
  no school, link or source without an opened page. Both move to v2.13 unchanged; L1-11 note from the attempt: otouczelnie gives
  `https://www.zs4.oswiata.tychy.pl/` for Technikum nr 6 Tychy (to confirm on the page itself). `ty-informator-2025` still the one stale Liceum source.
- CD3 (folded in): audit below; CD rule tests green with 15 test kids (no profile north for more than 5).
- Review: three tests + snapshot green; headless Chromium click-through with P8, P14, P15 at 375 and 1280 px in three looks (kompas,
  profil, szkoły with map, światy, lista, rodzic): nothing wider than the screen, no script errors (only the known 404s for
  `travel.json` of towns without travel times, and map tiles blocked in the check). Temporary arts class with `entry` (not committed)
  shows the tag for P8 in every look. Export saved, text Polish and complete (no raw i18n keys), file loads back to the compass.

| | nauki ścisłe/IT | języki | ekonomia i biznes | socjologia i psychologia | prawo i media | sztuka | sport | opieka i zdrowie | praca rękami | ogólne | razem |
|---|---|---|---|---|---|---|---|---|---|---|---|
| światy | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 9 |
| czynności (wszystkie) | 12 | 4 | 8 | 4 | 7 | 6 | 6 | 4 | 9 | 3 | 63 |
| czynności: wspólny rdzeń | 2 | 0 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 3 | 10 |
| sytuacje | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 3 |
| mocne strony | 1 | 1 | 2 | 2 | 0 | 2 | 1 | 0 | 1 | 9 | 19 |
| kierunki | 8 | 2 | 2 | 1 | 3 | 1 | 2 | 1 | 2 | 0 | 22 |

czynności na świat: tech 7, natura 7, ludzie 4, jezyki 6, biznes 6, budowa 6, sport 6, spoleczenstwo 7, sztuka 5
(Audit field codes: mundurowe and u1–u3 count as sport, turystyka and g1 as języki, g2 praca rękami, g3 biznes.)

**Database status (25 Nov 2026, after 2.12.0).** Same "known" totals as below. Run: three tests, `coverage_radar.py`, `old_sources.py`, count over `schools.json`.

| Area | Schools in DB / known | Public missing (next in order) | Missing `www` | Classes "check" | No threshold | No `scored` | No `extended` | Old sources (> 12 months) |
|---|---|---|---|---|---|---|---|---|
| Kraków | 51 / 90 | 13: PLSP 34, POSM 36 (→ A2, v2.13; OSM II st. 19 if a page exists) + 10 technika (TPM 20 → K5 in v2.13, …) | 31 (`tm16`, `lo31`, `lo15`, `lo12` → L1-11 in v2.13) | 143 of 246 | 38 | 96 | 2 | 0 |
| Tychy | 10 / 13 | 0 | 1 (`ty-t6` → L1-11) | 42 of 42 | 26 (+16 from licea-progi.pl to confirm) | 33 | 6 | 1 (`ty-informator-2025`) |
| GZM other towns | 5 / 197 | PLSP Katowice, POSM II st. Katowice, LSP Gliwice → A3 (v2.13); the rest after v3.0 | 0 | 36 of 36 | 13 | 27 | 1 | 0 |

No data counts changed (only `cards` on 18 classes); 0 waiting schools. Radar (Liceum): every field at level 3 or more for the first time.

**News found while planning (24 Nov 2026; nothing new since 22 Nov).**
- 2027/28 recruitment: no Małopolska or Śląskie act yet; the newest Kraków act is still zarządzenie 10/26 MKO for 2026/27
  (kuratorium.krakow.pl/wp-content/uploads/2026/01/zarzadzenie-10_26-mko-rekrutacja-2026-2027.pdf). Keep `recruitmentWindow`;
  expect the 2027/28 acts in January 2027.
- Kraków new liceum: no council resolution found in the BIP search; nothing newer than Radio Kraków (17 Aug 2026).
- Tychy: no 2027/28 recruitment page; same two documents as on 22 Nov (umtychy.pl/media/get/10016731; tychy.esesja.pl KOKiS,
  August 2026) → open them in L1-11. No official 2026/27 Tychy thresholds (the 16 licea-progi.pl ones stay "check").
- Art and music schools: PLSP Kluzy (gov.pl/web/plastykkrakow, 2026/27 exam schedule) and POSM II st. Chopina (gov.pl/web/posmkrakow,
  "Rekrutacja kandydatów na rok szkolny 2026/2027", open day 7 Mar 2026) still online. No 2027/28 exam dates yet (expected spring 2027).
- Rough edge from 22 Nov (`krakow/travel.json` `asOf` = timetable day 2026-11-24): today, so no longer in the future; the rename to
  `serviceDay` can wait for a tidy-up.

**Database status (24 Nov 2026, before 2.12).** No Liceum data change since 2.11.0. Run on 24 Nov: the three tests (green),
`coverage_radar.py`, `old_sources.py`, and a count over `schools.json`. "Known" = otouczelnie 2026 lists in `krakow/ranking.json`
(64 licea, 26 technika) and `gzm/ranking.json` (114 licea, 96 technika), incl. private, sports and music schools.

| Area | Schools in DB / known | Public missing (next in order) | Missing `www` | Classes "check" | No threshold | No `scored` | No `extended` | Old sources (> 12 months) |
|---|---|---|---|---|---|---|---|---|
| Kraków | 51 / 90 | 13: 3 state art/music (PLSP 34, POSM 36 → A2; OSM II st. 19 if a page exists) + 10 technika (TPM 20 → K5 in v2.13, PGNiG, TEH 5, TG 11, TIŚ 13, TGH 10, TO 18, T 2, TEE 23, TPS 22) | 31 (`tm16`, `lo31`, `lo15`, `lo12` → L1-11; then `tl14`, `tee7`, `lo41`, `lo27`, `lo43` → L1-12) | 143 of 246 | 38 | 96 | 2 | 0 |
| Tychy | 10 / 13 | 0 | 1 (`ty-t6` → L1-11) | 42 of 42 | 26 (+16 from licea-progi.pl to confirm) | 33 | 6 | 1 (`ty-informator-2025` → L1-11) |
| GZM other towns | 5 / 197 | PLSP Katowice, POSM II st. Katowice, LSP Gliwice → A3 (moved to v2.13); the rest G3 and new towns after v3.0 | 0 | 36 of 36 | 13 | 27 | 1 | 0 |

All 66 schools have an address, a map point and `geoChecked`; 0 waiting. Radar (Liceum) below level 3: Bezpieczeństwo i
obronność (1), Turystyka i usługi (1) → W2L1 tonight. Stale Studia sources (6) belong to Part 3.

## Minor v2.11 (planned 2026-11-21, released 2026-11-22 as 2.11.0)

Current `appVersion` 2.10.0 at planning time; v2.10 is released (pushed 21 Nov as 2.10.0), so nothing is waiting and no plan is stacked.
Tonight follows the roadmap: **Wave 1b** (two new directions for the big technikum groups) fits one night, so it goes in whole,
plus two database tasks that feed it: the one missing public Kraków *mechanical* technikum, and the L1 links batch.
K1-7 (Kraków class check) stays open for a later night: it needs many pages opened, and the last two night runs could not open them.
New GZM schools (G3) and new towns stay after v3.0 (roadmap "Out of scope"). One commit per task (rule 8). Order: 1 → 2 → 3 → 4 → 5 → 6
(task 3 needs 1 and 2; task 5 needs 1 and 3).

1. [x] **W1L1 (Opus) Directions "Mechanika, pojazdy i produkcja" and "Transport i logistyka".** Goal: two new directions with own card
   text, `field` (ENG / ECO as the radar codes say), `afterSchool`, `studiaCards` (Studia wave 1 card "Mechanika, materiały i produkcja";
   logistics card), `worlds`; 3 activity cards each (e.g. take a machine apart and put it back; plan the route of a delivery) and one
   strength where it fits. Old saved files still load. Task text as in "v2.11 – Wave 1b" below.
   Files: `liceum/data/opportunities.json`, `profiles.json`, `questions.json`, `tests/liceum.mjs`.
   Check: three tests pass; a new test kid P12 (mechanical) has "Mechanika, pojazdy i produkcja" in N/NNE/NNW, P13 (logistics) has
   "Transport i logistyka" in the top 3; P1–P11 keep their north profile (list them in the commit message).
2. [x] **K4 (Sonnet) Technikum Mechaniczne nr 16 w ZSM nr 2, Kraków.** Goal: add the school as a waiting school (`geoPending`,
   `geoPendingSince` = today): address, professions for 2026/27 (watch for the 2026 profession names in "News found while planning",
   v2.8), all classes `"status": "check"` unless an official page confirms them, `kompasId` in `krakow/ranking.json` (technika order 18).
   Sources: otouczelnie school page (found 21 Nov: otouczelnie.pl/artykul/3007/Technika-w-Krakowie/1447/…) and the school or city page.
   No threshold unless an official page shows one. If no page can be opened, skip the task and say so (do not add a school without a source).
   Files: `krakow/schools.json`, `krakow/ranking.json`, `sources.json`.
   Check: three tests pass; ranking test shows "Kompas schools with a place: 47 of 51"; the school is hidden in `?test` until the "Geocode schools" Action runs.
3. [x] **W1L2 (Sonnet) Remap classes to the two new directions.** Goal: set `cards` on every technikum (and any liceum class) that fits:
   mechanik, mechatronik, pojazdów samochodowych, awionik, technologii drewna → mechanika; logistyk, spedytor, eksploatacji portów i
   terminali, transportu kolejowego → transport. Kraków (incl. K4), Tychy, Katowice, Gliwice, Sosnowiec; no class loses its old card
   unless it was wrong (say which in the commit message). Do not touch `status`, thresholds or `scored`.
   Files: all `liceum/data/db/pl/*/schools.json`. Check: three tests pass; `python3 kompas/tools/coverage_radar.py` shows both new
   fields at level 3 or more in Liceum; area check still "P7 classes outside the area: 0".
4. [x] **L1-10 (Sonnet) School links, batch 10.** Goal: `www` for up to 10 schools without one, in ranking order: II LO (`lo2`, hint
   sobieski.krakow.pl), VIII LO (`lo8`, hint viii-lo.krakow.pl), IV LO (`lo4`), XLII LO (`lo42`), XI LO (`lo11`, hint xilo.krakow.pl),
   IX LO (`lo9`), XX LO (`lo20`, xxlo-krakow.edu.pl from MCOO), XVII LO (`lo17`, hint liceum.zso7.pl), XXV LO (`lo25`, hint xxvlo.pl),
   Technikum nr 6 Tychy (`ty-t6`). Hints are from search results only: set `www` only after the page opens and names the school, or the
   city's list `krk-siec-szkol` / BIP shows it. Skip and list the rest.
   Files: `krakow/schools.json`, `tychy/schools.json`. Check: syntax test; "strona szkoły" opens in a new tab on two cards.
5. [x] **CD2 (Opus) Discovery check for wave 1b.** Same as CD1: each new direction has 2+ activity cards and a strength pointing to it,
   its test kid has it in the top 3, no direction is north for most test kids; run `tools/questions_audit.py` (add the new directions to
   its field list if needed) and paste the table under "v2.11" below. Files: `tests/liceum.mjs`, `tools/questions_audit.py`, `BACKLOG.md`.
   Check: three tests pass.
6. [x] **R2.11 (Opus) Review and release v2.11.0.** Review the Sonnet commits (sources open and say what the data says, no guessed
   thresholds, areas not mixed, K4 hidden while waiting), click-through at 375 and 1280 px in three looks with P12 (Kraków) and P7
   (Tychy), compass and map first; set 2.11.0 in the four places and `dataVersion`; radar re-run pasted in "Coverage waves" (rule 5);
   update the "Database status" table below; short "Kompas Liceum v2.11.0" in the spec doc; push; then check the "Geocode schools"
   Action filled K4's point and Kraków travel times (say if not).

**Result 2.11.0 (22 Nov 2026).**
- W1L1: directions `mechanika` ("Mechanika, pojazdy i produkcja", ENG) and `transport` ("Transport i logistyka", ECO), 3 tap cards each
  (k1–k3 in world "Budowanie, maszyny i pojazdy", t1–t3 in "Biznes, handel i logistyka"); profile Inżynierski now "budowa i maszyny",
  Ekonomiczny "biznes i logistyka". 20 directions, 57 tap cards. Test kids P12 (mechanical, Kraków) → N Inżynierski, mechanika 1st;
  P13 (logistics, Tychy) → N Ekonomiczny, transport 1st. P1–P11 keep their north.
- K4: Technikum Mechaniczne nr 16 (`tm16`, ZSM nr 2) added as a waiting school, 4 classes with 2026/27 thresholds from otouczelnie:
  pojazdów samochodowych 72.2, usług fryzjerskich 58.5, logistyk 75.85, organizacji turystyki 68.15. No mechanik/mechatronik class
  there in 2026/27 (surprise). `www` not set (zsm2krakow.pl could not be opened). Ranking: 47 of 51 linked.
- W1L2: 15 classes remapped: mechanika 10 (Kraków 8, Tychy 2), transport 4 (Kraków 2, Tychy 2), plus tm16. No card removed;
  robotyk keeps elektronika first. No class in the data for railway/road transport or spedytor.
- L1-10: `www` for 9 Kraków licea (II, IV, VIII, IX, XI, XVII, XX, XXV, XLII). Technikum nr 6 Tychy skipped (page blocked) → L1-11.
- CD2: audit table below; new test: no profile is North for more than a third of the 13 test kids (ścisły 3, inżynierski 2, humanistyczny 2).
- Radar (Liceum): Inżynieria 54 → 55, Ekonomia 56 → 58, Turystyka 8 → 10 items (tm16); levels unchanged. Below 3: Bezpieczeństwo (1),
  Turystyka (1) → wave 2 (v2.12).
- Review: three tests green; headless click-through (Chromium) with P12 and P13 at 375 and 1280 px in the three looks, compass, profile,
  schools/map, worlds and list: no page wider than the screen, no script errors. The map tiles were not loaded (no network in the check).

| | nauki ścisłe/IT | języki | ekonomia i biznes | socjologia i psychologia | prawo i media | sztuka | sport | opieka i zdrowie | praca rękami | ogólne | razem |
|---|---|---|---|---|---|---|---|---|---|---|---|
| światy | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 9 |
| czynności (wszystkie) | 12 | 3 | 7 | 4 | 7 | 6 | 3 | 4 | 8 | 3 | 57 |
| czynności: wspólny rdzeń | 2 | 0 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 3 | 10 |
| sytuacje | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 3 |
| mocne strony | 1 | 1 | 2 | 2 | 0 | 2 | 1 | 0 | 1 | 9 | 19 |
| kierunki | 8 | 1 | 2 | 1 | 3 | 1 | 1 | 1 | 2 | 0 | 20 |

czynności na świat: tech 7, natura 7, ludzie 4, jezyki 3, biznes 6, budowa 6, sport 3, spoleczenstwo 7, sztuka 5

**Moved forward to the next night:** L1-11 (Technikum nr 6 Tychy `ty-t6` and Technikum Mechaniczne nr 16 `tm16` links, then the next
Kraków schools without `www` in ranking order); K1-7 (Kraków class check) still open. Next minor: v2.12 (Wave 2) from "v3.0 tasks".

**News found while planning (21 Nov 2026).**
- 2027/28 recruitment: still no Małopolska or Śląskie act; the newest is still zarządzenie 10/26 MKO for 2026/27 (kuratorium.krakow.pl,
  January 2026). Expect the 2027/28 acts in January 2027. Keep `recruitmentWindow`.
- Kraków new liceum: nothing newer than Radio Kraków (17 Aug 2026). Tychy: no 2027/28 recruitment page and no 2026/27 informator found
  (keep `ty-informator-2025`, the one stale Liceum source).
- For wave 2 (A2, v2.12): Państwowe Liceum Sztuk Plastycznych im. J. Kluzy (gov.pl/web/plastykkrakow, exam schedule page for 2026/27)
  and POSM II st. im. F. Chopina (gov.pl/web/posmkrakow, "Rekrutacja kandydatów na rok szkolny 2026/2027") have official pages.

**Database status (22 Nov 2026, after 2.11.0).** Known total as in the v2.9 table (otouczelnie 2026 lists,
`krakow/ranking.json`, `gzm/ranking.json`). Run: the three tests, `coverage_radar.py`, `old_sources.py`, and a count over `schools.json`.

| Area | Schools in DB / known | Public missing | Missing `www` | Classes "check" | No threshold | No `scored` | No `extended` | Old sources (> 12 months) |
|---|---|---|---|---|---|---|---|---|
| Kraków | 51 / 90 | 10 technika (TPM 20, PGNiG, TEH 5, TG 11, TIŚ 13, TGH 10, TO 18, T 2, TEE 23, TPS 22) + 3 state art/music schools (A2, v2.12) | 31 | 143 of 246 | 38 | 96 | 2 | 0 |
| Tychy | 10 / 13 | 0 | 1 (`ty-t6`) | 42 of 42 | 26 (+16 from licea-progi.pl to confirm) | 33 | 6 | 1 (`ty-informator-2025`) |
| GZM other towns | 5 / 197 | 158 (G3 and new towns after v3.0) | 0 | 36 of 36 | 13 | 27 | 1 | 0 |

After the push the "Geocode schools" Action set `tm16`'s map point and Kraków travel times (commit 79d0d1c); 0 waiting. Radar (Liceum) below level 3: Bezpieczeństwo i obronność (1),
Turystyka i usługi (1) → wave 2 (v2.12). Studia stale sources (`uj-kampus`, `gus-2020`, `gus-2024`, `gus-sw-2024-25` …) belong to Part 3.

## Major v3.0 – plan (agreed 2026-11-21)

**Agreed with Szymon on 21 Nov 2026** (answers by tap). Nightly planners: take one minor per night from the table below, in order;
the usual release rules apply (one release at a time, Opus review at the end of each, three tests green, 375 and 1280 px in three looks).

**Goal.** v3.0 makes Kompas fair to every kind of kid: the questions are balanced (an arts world and profile, health, law vs media),
art and music schools are in the catalogue, sports classes have their own track, and points can be counted exactly. The app opens in
the calm look, with line drawings for the profiles, less typing and a one-page parent summary. The boys reacted most to the
**compass result** and the **schools map**: keep both at the centre, and test every change on those two screens.

**Szymon's answers.**
- Themes in: 1 sports classes + exact points, 5 fairer questions, 6 parent page, 8 tap exam %, plus **art schools** (his addition:
  art licea, music schools, and an arts world + profile leading to them).
- Look: **calm ("spokojny") becomes the default**; neon and pop stay as choices. No full redesign (theme 3 not picked).
- Illustrations: **line drawings, only a few**: one per profile (compass and profile screens), not for worlds.
- Kept: Ukrainian interface (not dropped; moves after v3.0, see below). **GoatCounter stays** on Kompas pages (rule 2 updated).
- Later (after v3.0): new areas (Kraków okolice towns, Chorzów, Tarnowskie Góry). Not picked: compass animation.

**Scope.** Arts world + 9th profile + arts directions; health direction apart from biology; law and media as two directions; worlds
evened out; art licea and music schools (Kraków and Tychy/GZM area towns already in the data) with entrance-exam info instead of a
threshold; calm look by default; exam % by taps; 9 profile drawings; one-page parent summary; sports track (fitness test) and exact
points option (after the 2027 rules are checked).

**Out of scope for v3.0.** New towns or areas; compass animation; full visual redesign; world illustrations; Ukrainian, English and
French interface (Ukrainian = v3.1, as I1/I2); G3 schools and new GZM towns (after v3.0). Data jobs K1, L1 continue as small extras
only when a night run can open the pages.

**Open questions (ask Szymon when convenient; do not block the plan).**
- Q1 item 5: add 2 situations (conflict in class, trip abroad)? Not answered; not in v3.0 unless he says yes.
- Arts as a 9th compass point changes the 8-wind compass: Q2 decides the layout (9 even points, or arts on the inner ring). Show
  Szymon a 375 px screenshot in the v2.10 release note.

**Q1a audit table (21 Nov 2026, `python3 kompas/tools/questions_audit.py`; restored here).**

| | nauki ścisłe/IT | języki | ekonomia i biznes | socjologia i psychologia | prawo i media | sztuka | sport | opieka i zdrowie | praca rękami | ogólne | razem |
|---|---|---|---|---|---|---|---|---|---|---|---|
| światy | 2 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 8 |
| czynności (wszystkie) | 12 | 3 | 4 | 4 | 3 | 1 | 3 | 2 | 5 | 3 | 40 |
| czynności: wspólny rdzeń | 2 | 0 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 3 | 10 |
| sytuacje | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 3 |
| mocne strony | 1 | 1 | 2 | 2 | 0 | 1 | 1 | 0 | 0 | 9 | 17 |
| kierunki | 7 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 0 | 14 |

Activities per world: tech 7, natura 5, ludzie 3, jezyki 3, biznes 3, budowa 3, sport 3, spoleczenstwo 3.

### v3.0 tasks (reordered 21 Nov 2026, 15:13: coverage waves first, UI/UX later)

**Szymon, 21 Nov 15:13: coverage of study directions is top priority; UI/UX and experience work waits.** The releases below keep the
task text agreed earlier but move it: questions and directions come first (waves 1–3, see "Coverage waves" at the top of this file),
then the sports track (v3.0), then the look and screens (v3.1–v3.3), then Ukrainian (v3.4). Old numbering v2.11–v2.15 no longer applies.
The 19 Nov table above (v2.10 = Ukrainian) is superseded as well.

**v2.10 – Wave 1a: fairer questions and the radar (night of 22 Nov)** — pushed 21 Nov 2026 as Liceum 2.10.0
0. [x] **CW1 (Sonnet) Coverage radar in the repo.** Goal: `kompas/tools/coverage_radar.py` (added 21 Nov) reads a `field` key from every
   Studia offer and card and every Liceum direction and class instead of its built-in id list; add `field` (one of the 17 field codes
   in the radar script) to all of them; test in `tests/syntax.mjs` that none is missing; paste the new table into "Coverage waves".
   Files: `studia/data/opportunities.json`, `studia/data/db/pl/krakow/offers.json`, `liceum/data/opportunities.json`, `tools/coverage_radar.py`,
   `tests/syntax.mjs`. Check: three tests pass; the script prints the same table as before.
1. [x] **Q2 (Opus) Arts world and profile.** Goal: a world "Sztuka i projektowanie" (5 activity cards: e.g. drawing, film/photo,
   music, design, stage), a 9th profile "Artystyczny" with directions (plastyka, film i media wizualne, muzyka, design i
   architektura wnętrz) and the strength "rysunek" linked to it; the compass shows 9 points (decide layout; still readable at 375 px).
   Old saved files still load (no arts answers = arts 0). Files: `liceum/data/questions.json`, `profiles.json`, `opportunities.json`,
   `core/scoring.js` only if needed, `liceum/app.js`, `liceum/liceum.css`, `tests/liceum.mjs`.
   Check: three tests pass; a new test kid P8 (arts) gets "Artystyczny" in the north; P1–P7 keep their north profile.
2. [x] **Q3 (Opus) Health, law and media.** Goal: direction "Zdrowie i opieka" (ratownictwo, pielęgniarstwo, fizjoterapia, dietetyka)
   apart from "biologia"; "spoleczenstwo" split into "Prawo i administracja" and "Media i komunikacja", each linked to the
   right classes (biol-chem, hum, media/dziennikarskie). Files: `opportunities.json`, `profiles.json`, `tests/liceum.mjs`.
   Check: three tests pass; P2 (health) sees "Zdrowie i opieka" on the profile screen; P5 still north "Języki".

4. [x] **CD1 (Opus) Discovery check for wave 1a.** Goal: with Q2 and Q3 in, every new or split direction (arts, health, law, media) is
   reachable: at least 2 activity cards and 1 strength point to it, one test kid per direction ends with it in the north or NNE/NNW.
   Run `kompas/tools/questions_audit.py`; write the new table here. Check: three tests pass.
5. [x] **R2.10 (Opus) Review and release v2.10.0** (screenshot of the 9-point compass at 375 px in the release note; radar re-run).

**Result 2.10.0 (21 Nov 2026).**
- CW1 done for Liceum (directions `field`, classes `fields`, `--fill` helper, syntax test). Studia `field` keys are left to the
  Studia session (the radar uses them when present); split agreed with Szymon 21 Nov: this session Liceum, the other Studia.
- 18 directions, 9 profiles, 9 worlds, 51 tap cards. `spoleczenstwo` was kept as "Historia i kultura" (history needs a home for wave 2)
  next to the new `prawo` and `media`; `biologia` is now "Biologia i laboratorium" next to `zdrowie`.
- Compass: 9 points, the new one at SE (140°) between E and S; readable at 375 px in all three looks.
- Test kids: P1–P7 keep their north; P8 arts → N Artystyczny; P9 health → N Przyrodniczy (zdrowie first); P10 law and P11 media →
  N Humanistyczny (prawo / media first). New tests: CD1 (2+ tap cards and a strength per direction; direction kid top 3) and old files.
- Radar (Liceum): Prawo i administracja 2 → 4 (30 classes), Media i komunikacja 2 → 4 (33), Sztuka i design 1 → 3 (4 classes:
  art licea come in wave 2). Still below 3: Bezpieczeństwo, Turystyka (wave 2).
- CD1 audit (`tools/questions_audit.py`):

| | nauki ścisłe/IT | języki | ekonomia i biznes | socjologia i psychologia | prawo i media | sztuka | sport | opieka i zdrowie | praca rękami | ogólne | razem |
|---|---|---|---|---|---|---|---|---|---|---|---|
| światy | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 9 |
| czynności (wszystkie) | 12 | 3 | 4 | 4 | 7 | 6 | 3 | 4 | 5 | 3 | 51 |
| czynności: wspólny rdzeń | 2 | 0 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 3 | 10 |
| sytuacje | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 3 |
| mocne strony | 1 | 1 | 2 | 2 | 0 | 2 | 1 | 0 | 1 | 9 | 19 |
| kierunki | 8 | 1 | 1 | 1 | 3 | 1 | 1 | 1 | 1 | 0 | 18 |

czynności na świat: tech 7, natura 7, ludzie 4, jezyki 3, biznes 3, budowa 3, sport 3, spoleczenstwo 7, sztuka 5

**v2.11 – Wave 1b: technika and the big engineering groups** — released 22 Nov 2026 as Liceum 2.11.0 (details: "Next minor: v2.11" at the top of Part 1)
1. **W1L1 (Opus) Directions "Mechanika, pojazdy i produkcja" and "Transport i logistyka".** Goal: two new directions (own card text,
   `afterSchool`, `studiaCards` pointing to the Studia wave 1 cards, `worlds`), linked to the technika that today sit under
   "elektronika" or "biznes": mechanik, mechatronik, pojazdów samochodowych, awionik, technologii drewna; logistyk, eksploatacji
   portów i terminali. Add 3 activity cards each (e.g. take a machine apart and put it back; plan the route of a delivery).
   Files: `opportunities.json`, `profiles.json` (area lists), `questions.json`, `tests/liceum.mjs`. Check: three tests pass; a test kid
   with mechanical answers has "Mechanika, pojazdy i produkcja" in the north or NNE/NNW; P1–P8 keep their north profile.
2. **W1L2 (Sonnet) Remap classes.** Goal: set `cards` on every technikum and liceum class that fits the two new directions in
   Kraków, Tychy and the GZM data; no class loses its old card unless it was wrong. Files: all `schools.json`. Check: three tests pass;
   radar shows both new fields at level 3 or more in Liceum.
3. **CD2 (Opus) Discovery check for wave 1b.** Same as CD1 for the two new directions.
4. **R2.11 (Opus) Review and release v2.11.0.**

**v2.12 – Wave 2: art and music schools, uniformed classes, tourism** — released 25 Nov 2026 as 2.12.0 (W2L1, A1, CD3; A2, A3, L1-11 → v2.13) (details and the task list to follow: "Next minor: v2.12" at the top of Part 1)
1. **A1 (Opus) Schools with an entrance exam.** Goal: a class can have `entry: {kind: "plastyczny" | "muzyczny", note, sourceId}`
   instead of a threshold; the card shows "egzamin wstępny / przesłuchanie w szkole" (like the bilingual test tag), chances use
   "do sprawdzenia w szkole", never a guessed number. Linked to the "Artystyczny" profile. Files: `liceum/app.js`, `points.js` (only
   to skip the threshold), `tests/liceum.mjs`, `tests/syntax.mjs`.
   Check: three tests pass; a temporary test class with `entry` shows the tag and no points gap.
2. **A2 (Sonnet) Art licea and music schools, Kraków.** Goal: the public art liceum/licea plastyczne and the music school(s) of the
   second degree in Kraków with general-education classes, from the school's own page or the city list (MKiDN schools count):
   address, profile, exam/audition dates for 2027 if published, `www`; add as waiting schools (`geoPending`) if no map point.
   Files: `krakow/schools.json`, `sources.json`. Check: three tests pass; P8 sees them under "Artystyczny".
3. **A3 (Sonnet) Art and music schools, Tychy + GZM towns in the data.** Same as A2 for Tychy, Katowice, Gliwice, Sosnowiec only
   (no new towns). Files: those `schools.json`, `sources.json`. Check: same; none appear in area Kraków.
4. **W2L1 (Opus) Directions "Mundurowe i bezpieczeństwo" and "Turystyka, hotelarstwo i gastronomia".** Goal: two directions with
   `afterSchool`, `studiaCards`, 3 activity cards each, linked to the classes that already exist in the data (9 uniformed classes,
   technik hotelarstwa, organizacji turystyki, żywienia i usług gastronomicznych, turystyczne classes). Tone: no recruiting, only
   what the class is. Files: `opportunities.json`, `profiles.json`, `questions.json`, `school files` (`cards`), `tests/liceum.mjs`.
   Check: three tests pass; radar shows both at level 3 or more.
5. **CD3 (Opus) Discovery check for wave 2** (arts school classes, uniformed, tourism). Same as CD1.
6. **R2.12 (Opus) Review and release v2.12.0.**

**v2.13 – Wave 3: applied nature, even worlds, sports data** — split on 25 Nov: v2.13 = W3L1, W3L2, A2, L1-11, K5 (+ new K6; task list in "Next minor: v2.13" at the top of Part 1); v2.14 = Q4, V1a, V1b, CD4, A3, L1-12
1. **W3L1 (Opus) Direction "Rolnictwo, żywność i przyroda stosowana".** Goal: agro-gardening, floristry, landscape architecture and
   arborist (new technikum professions from 1 Sept 2026, see "News found while planning"), food technology, veterinary and animals;
   `studiaCards` point to the Studia wave 3 cards; 3 activity cards (plants and animals, cooking, outdoor work). Files:
   `opportunities.json`, `profiles.json` (area list of "Przyrodniczy"), `questions.json`, `tests/liceum.mjs`. Check: three tests pass.
2. **W3L2 (Sonnet) Classes for it.** Goal: map the technika (żywienia, ogrodnik, agroogrodnictwa, krajobrazu, weterynaryjny if present)
   and any liceum class with an animals or plants profile. Files: `schools.json`. Check: radar shows the field at level 3 or more.
3. **Q4 (Opus) Even out the worlds.** Goal: 5 activities in each of the 9 worlds (add 2 each to jezyki, biznes, ludzie,
   spoleczenstwo, budowa, sport; trim tech from 7 to 5, keep the best two as strengths or directions). Re-run the audit script and
   update the table above. Files: `questions.json`, `kompas/tools/questions_audit.py`, `tests/liceum.mjs`.
   Check: three tests pass; audit shows 5 per world; P1–P8 north profiles listed in the commit message (say if one changed).
4. **V1a (Opus) 2027 rules check.** Goal: read the rules for sports classes (fitness test, extra criteria) and the exact points
   formula for 2027/28 (kuratorium Kraków and Katowice, MEN rozporządzenie); write the method in this file; add
   `sport: {test, sourceId}` to the class structure and the test. If the 2027/28 act is still not out, use 2026/27 and say so on screen.
   Files: `BACKLOG.md`, `tests/syntax.mjs`, `sources.json`. Check: three tests pass.
5. **V1b (Sonnet) Mark sports classes.** Goal: every sports / sports-championship class in Kraków and Tychy/GZM data gets `sport`
   with a source (e.g. Tychy IV LO 1MS); unconfirmed = "check". Files: school files, `sources.json`. Check: three tests pass.
6. **CD4 (Opus) Final discovery audit.** Goal: every direction (now about 24) is reachable and none is always on top: one test kid
   per direction, plus a rule test that no direction is the north profile for more than 3 of the 24 kids. Files: `tests/liceum.mjs`,
   `tools/questions_audit.py`. Check: three tests pass; table written here.
6a. **K5 (Sonnet, moved from v2.12) Technikum Poligraficzno-Medialne nr 20, Kraków** (technika order 8, the highest-ranked public
   Kraków technikum missing). Same steps as K4: waiting school, 2026/27 professions and thresholds only from an official page or
   otouczelnie, `kompasId` in `krakow/ranking.json`, classes `cards` (media, informatyka). Next after it: TG 11 and TGH 10 (tourism).
6a2. **A2 (Sonnet, moved from v2.12 on 25 Nov) Art liceum and music schools, Kraków.** Task text as in "Minor v2.12" task 3 (A1 is
   done, so `entry` is ready). Do it before A3. **L1-11 (Sonnet, moved from v2.12 on 25 Nov)** as in "Minor v2.12" task 4.
   Note for the planner: on 25 Nov the night run could not open any page (fetch permission not answered); check web access first.
6b. **A3 (Sonnet, moved from v2.12 on 24 Nov) Art and music schools in Katowice and Gliwice.** Task text as in the 22 Nov v2.12
   plan (git d47f557): PLSP Pankiewicza (gov.pl/web/plastykkatowice), POSM II st. Ułańska 7b (gov.pl/web/zpsmkatowice), LSP Gliwice only
   with an official page; needs A1 (`entry`).
7. **R2.13 (Opus) Review and release v2.13.0.**

**v3.0 – Coverage complete, sports track and exact points (night of 26 Nov)**
1. **V1c (Opus) Sports track and exact points.** Goal: Sport profile leads to sports classes with "test sprawnościowy w szkole";
   an option "policz dokładnie" (marks per subject by taps, exam %, extras) next to the quick estimate, using `points.js` checked
   against V1a. Files: `liceum/app.js`, `points.js`, `tests/liceum.mjs`. Check: test cases from the official example give the same points.
2. **R3.0 (Opus) Review and release v3.0.0.** Full click-through of all steps with P1–P8, compass and map first (the screens the boys
   like), 375 and 1280 px, three looks; version 3.0.0 in the four places; "Kompas Liceum v3.0.0" in the spec doc; tell Szymon.
   (Add to R3.0: run `python3 kompas/tools/coverage_radar.py`; Liceum must show level 3 or more for every field that has classes in the data.)

**v3.1 – Look and taps (UI/UX, paused until v3.0; night of 27 Nov)**
1. **U8 (Sonnet) Calm look by default.** Goal: no `?skin` and no saved choice = calm look; neon and pop stay in the look menu and in
   the saved file. Files: `liceum/app.js`, `liceum/index.html`. Check: fresh open shows calm; `?skin=neon` still works; 375/1280 px.
2. **U9 (Sonnet) Exam % by taps.** Goal: the three exam fields (and achievements) become chips or a slider (e.g. ok. 30 / 50 / 70 /
   90 %, step 5 on the slider); the number stays in the saved file as before. Files: `liceum/app.js`, `liceum/liceum.css`.
   Check: points result unchanged for P1–P8; no keyboard opens on phone; three tests pass.
3. **R3.1 (Opus) Review and release v3.1.0.**

**v3.2 – Profile drawings (UI/UX; night of 28 Nov)**
1. **IL1 (Opus) Style sheet and 3 drawings.** Goal: rules for profile drawings in the `illus.js` line style (viewBox, stroke
   widths, palette `--l0..--l5`, draw-once animation, off with "spokojniej"), written at the top of `illus.js`; drawings for
   Ścisły, Artystyczny, Ludzie. Shown on the north card of the compass and on the profile screen. Files: `liceum/illus.js`,
   `liceum/app.js`, `liceum/liceum.css`. Check: three looks + dark mode readable; nothing wider than 375 px.
2. **IL2 (Sonnet) The other 6 drawings** following IL1's sheet exactly. Files: `liceum/illus.js`. Check: same.
3. **R3.2 (Opus) Review and release v3.2.0.** The drawings now cover all profiles that exist after v3.0 (more than 9): IL2 draws the rest.

**v3.3 – Parent page (UI/UX; night of 29 Nov)**
1. **P2 (Opus) One-page parent summary.** Goal: fits one A4 page when printed: top 3 profiles (with drawing), liked classes with
   the kid's points next to the 2026 threshold (or "egzamin w szkole"), travel time, dates to May 2027; calm tone, no grading.
   Files: `liceum/app.js` (vParent), `liceum/liceum.css` (print). Check: print preview at A4 = 1 page for P1, P5 and P8.
2. **R3.3 (Opus) Review and release v3.3.0.**

**v3.4 – Ukrainian interface (was v2.10 / v3.1; after v3.3)**
1. **I1 (Opus)** texts in language files, **I2 (Sonnet)** Ukrainian translation; unchanged task text in "Part 1" above (I1, I2).

## Minor v2.9 (planned 2026-11-20, released 2026-11-21 as 2.9.0)

Current `appVersion` 2.8.1; v2.8 is released (2.8.0 and 2.8.1 pushed), so nothing is waiting. The roadmap entry for v2.9
(Q1 review of questions + new GZM towns) is big and needs design choices, so tonight takes **only a first slice of Q1** (an audit,
no card changes) and moves new GZM towns to v2.10. The main job is the **database**: four schools have waited since v2.8 because
the night run cannot reach Nominatim or the Kraków GTFS (checked again tonight: both still refused, as is otouczelnie.pl from
the shell). Task 1 removes that block without guessing a map point; tasks 2–3 then add the waiting schools.
One commit per task (rule 8), then the release step. Do them in this order (2 and 3 need 1).

1. [x] **P9 (Opus) Waiting schools ("geoPending").** Goal: a school may be added with `"geoPending": true` and no `geo`;
   the app ignores it everywhere (lists, map, compass, export) and the tests skip the map-point and travel-time checks for it,
   so the repo stays green until the "Geocode schools" Action fills the point. The Action (`geocode_schools.py --check`, then
   `liceum_travel.py` for Kraków) removes the flag only when `geo` is set, `geoChecked` is true and (Kraków) travel times exist.
   A test fails if a school has `geoPending` and also `geo` + `geoChecked` (flag left behind), or if a flag is older than
   30 days (`geoPendingSince`, `YYYY-MM-DD`), so a stuck school is noticed. No scoring change; no network call in the app.
   Files: `liceum/app.js` (where schools are loaded), `tests/liceum.mjs`, `tests/syntax.mjs`, `tools/geocode_schools.py`,
   `tools/liceum_travel.py`, a line in "Where things are" or Part 2 rules about the flag.
   Check: three tests pass; with a temporary test school marked pending (not committed) the tests pass and `?test` does not
   show it; with the flag removed and no `geo` the tests fail as before.
2. [x] **K3 (Sonnet) XVII LO and XXV LO, Kraków** (from v2.8; needs P9). Goal: add both as pending schools: address, `www`,
   2026/27 classes with sources (otouczelnie Kraków lists, school pages), `kompasId` in `krakow/ranking.json`. XVII LO bilingual
   French: mark the class only if a source says which one (B2 question). Unconfirmed class facts stay `"status": "check"`.
   Files: `krakow/schools.json`, `krakow/ranking.json`, `sources.json`.
   Check: three tests pass; ranking test shows 46 of 50 linked (was 44 of 48); both schools not visible in `?test` until the Action runs.
3. [x] **T6 (Sonnet) Technikum nr 6 Tychy** (from v2.8; needs P9). Goal: add as a pending school: ul. Browarowa 1A, 43-100 Tychy
   (otouczelnie), `www`, professions for 2026/27 from the school or city page (watch for the new 2026 profession names in the
   v2.8 news), `kompasId` in `gzm/ranking.json` (GZM technika order 67), Tychy note in `config.json` (6 of 6 technika).
   No threshold unless an official page shows one.
   Files: `tychy/schools.json`, `gzm/ranking.json`, `sources.json`, `config.json`.
   Check: three tests pass; "GZM ranking … linked to Kompas: 15".
4. [ ] **K1-7 (Sonnet) Kraków class check, batch 7.** Goal: the rest of batch 6 plus the next unchecked schools in
   `krakow/ranking.json` order: XIII LO (`lo13`, 5 check), II LO (`lo2`, 8), XXXI LO (`lo31`, 2), XV LO (`lo15`, 7),
   XII LO (`lo12`, 6); also VI LO 1C (artistic or bilingual?) and 1F. Same steps as D4; "check" → "sourced" only with an
   official page or otouczelnie confirming it. Also confirm on the school or city page where XXI LO (`lo21`) teaches and
   recruits for 2026/27: in April 2025 the council discussed merging it into Zespół Szkół Poligraficzno-Medialnych (Radio Kraków,
   30 Apr 2025); fix the address only with an official source.
   Files: `krakow/schools.json`, `sources.json`.
   Check: three tests pass; commit message says how many classes moved to "sourced".
5. [~] **L1-9 (Sonnet) School links, Kraków top of ranking.** Goal: `www` for 9 schools without one, in ranking order:
   V LO (`lo5`), I LO (`lo1`), VIII LO (`lo8`), II LO (`lo2`), IV LO (`lo4`), XLII LO (`lo42`), XI LO (`lo11`),
   IX LO (`lo9`), XX LO (`lo20`, www.xxlo-krakow.edu.pl from MCOO, could not be opened in v2.8). Official sites only
   (school site, BIP or the city's list `krk-siec-szkol`); skip a school whose site cannot be confirmed and say so.
   Files: `krakow/schools.json`. Check: syntax test; "strona szkoły" opens in a new tab on two cards.
6. [x] **Q1a (Opus) Questions audit, first slice of Q1.** Goal: count worlds, activity cards, situations, strengths and
   directions per field (science/IT, languages, economy and business, sociology and psychology, law and media, arts, sport,
   care and health, hands-on) and write a short table plus 3–5 concrete proposals in this file under v2.10 / Q1, as questions
   for Szymon. No card or scoring change tonight (design choices wait for his answer).
   Files: `BACKLOG.md` only (read `liceum/data/*.json`, `core/scoring.js`).
   Check: table numbers match a small script run (paste the command in the commit message); three tests still pass.
7. [x] **R2.9 (Opus) Review and release v2.9.0.** Review the Sonnet commits (sources open and say what the data says, no guessed
   thresholds, areas not mixed, pending schools hidden), click-through at 375 and 1280 px in three looks, set 2.9.0 in the four
   places, `dataVersion`, short "Kompas Liceum v2.9.0" in the spec doc, push. After the push, check the "Geocode schools" Action
   run: if it filled the three new points, say so; if not, list what is still pending.

**Done in 2.9.0 (21 Nov 2026).**
- P9: waiting schools. `"geoPending": true` + `geoPendingSince`; the app drops them at load, tests skip map/travel checks for them
  and fail if the flag is left behind or older than 30 days. `geocode_schools.py` clears the flag outside Kraków once `geo` +
  `geoChecked` are set; `liceum_travel.py` clears it in Kraków once every district has a time.
- K3: XVII LO (`lo17`, 4 classes, all "check": class codes not on the source; class 0 tagged preparatory bilingual French) and
  XXV LO (`lo25`, 6 uniformed/military classes, "sourced"; range min 62.4 because otouczelnie shows 0.00 for class 1C without a
  threshold) as waiting schools, source otouczelnie (`otou-lo17`, `otou-lo25`); ranking 46 of 50 linked. Addresses from otouczelnie
  (city list could not be opened); no `www`.
- T6: Technikum nr 6 Tychy (`ty-t6`, ZS nr 7, ul. Browarowa 1A) as a waiting school: technik hotelarstwa (1T) and technik żywienia
  i usług gastronomicznych (1Ż), both "check", source Wasza Edukacja (`we-ty-t6`); no threshold; GZM linked 15; Tychy note 6 of 6.
- L1-9 (part): `www` for I LO and V LO (school BIP pages on bip.krakow.pl).
- Q1a: audit table and 5 questions for Szymon, under v2.10 / Q1 below (`kompas/tools/questions_audit.py`).
- Review: three tests pass; click-through at 375 and 1280 px in three looks with P1 (Kraków) and P7 (Tychy): 48 and 14 schools
  shown, waiting schools hidden, nothing wider than the screen, no JS errors; with the flags removed by hand (not committed) the
  three schools show without errors. Schools-page text no longer says XVII and XXV LO are left out.

**Moved forward to v2.10 (not done on 21 Nov).** The night run's web pages need a permission nobody can answer at night: the
Sonnet agents' WebFetch calls were refused (and the shell cannot reach otouczelnie, Nominatim or GTFS).
- K1-7 (all): XIII LO, II LO, XXXI LO, XV LO, XII LO; VI LO 1C and 1F; XXI LO site question. Nothing changed.
- L1-9 rest: VIII LO, II LO, IV LO, XLII LO, XI LO, IX LO, XX LO (search hints: viii-lo.krakow.pl, sobieski.krakow.pl; not opened).
- To confirm: XVII LO class codes and which class is bilingual; full names (XXV LO may be "im. Stefana Żeromskiego", not opened);
  `www` for lo17, lo25 (hints liceum.zso7.pl, xxvlo.pl) and ty-t6; ty-t6 full name on an official page.
- Map points: done. The "Geocode schools" Action run after the push (commit 25aaa93) set and checked the three points, added
  Kraków travel times for lo17 and lo25 and removed all three flags; tests green, 0 waiting schools. All three are now live.

**Not tonight.** G3 (I LO Gliwice, Akademickie LO Pol. Śl., Technikum nr 17 Katowice, Technikum nr 8 Sosnowiec) moves to v2.10
with the new GZM towns, now that P9 lets schools wait for a point. Tychy: confirm the 16 licea-progi.pl thresholds and IV LO 1MS
when the city or schools publish 2027/28 info (nothing new found tonight). B2 open questions stay.

**News found while planning (20 Nov 2026).**
- 2027/28 recruitment dates are still not published. The newest Małopolska act is still zarządzenie 10/26 MKO for 2026/27
  (kuratorium.krakow.pl, January 2026); no new Tychy or Śląskie recruitment page for 2027/28 found. Keep `recruitmentWindow`.
- Kraków new liceum: still only "considering", no place or date (Radio Kraków, 17 Aug 2026). Nothing to enter.
- XXI LO (Mistrzejowice): merger with Zespół Szkół Poligraficzno-Medialnych discussed in April 2025, decision postponed while a
  new site was sought (Radio Kraków, 30 Apr 2025). Current state unknown → checked in K1-7.

**Database status (21 Nov 2026, after 2.9.0).** Known total = schools in the otouczelnie 2026 lists in the repo (Kraków lists;
Tychy and other GZM towns from `gzm/ranking.json`), including private, sports and music schools. "In DB" counts waiting schools.

| Area | Schools in DB / known | Waiting for map point | Public missing | Missing `www` | Classes "check" | No threshold | No `scored` | No `extended` | Old sources (> 12 months) |
|---|---|---|---|---|---|---|---|---|---|
| Kraków | 50 / 90 | 0 (lo17, lo25 live since 21 Nov) | 11 (technika) | 39 | 143 of 242 | 38 | 92 | 2 | 0 |
| Tychy | 10 / 13 | 0 (ty-t6 live since 21 Nov) | 0 | 1 | 42 of 42 | 26 (16 others from licea-progi.pl, to confirm) | 33 | 6 | 1 (`ty-informator-2025`, 18 months; no 2026/27 edition found) |
| GZM other towns | 5 / 197 | 0 | 158 | 0 | 36 of 36 | 13 | 27 | 1 | 0 |

All schools have an address, a map point and `geoChecked`. K1 so far: 18 of 50 Kraków schools checked; ranking links
46 of 50 Kraków and 15 GZM. Studia sources older than a year (`uj-kampus`, `gus-2020`, `gus-2024`) belong to Part 3.

## Minor v2.8 (planned 2026-11-19, released 2026-11-19 as 2.8.0)

Current `appVersion` 2.7.1. No earlier minor plan was waiting. v2.7.0 shipped K2 (Kraków ranking), not G3, so the next
roadmap entry is **GZM part 2 (G3)** plus the open K1 review. Q1 (review of questions, Opus, design choices) moves to v2.9.
Tonight is data plus one small screen change, mostly **Sonnet**. One commit per task (rule 8), then the release step.

1. [~] **K1-6 (Sonnet) Kraków class check, batch 6.** Goal: check the 2026/27 classes of the next 5 Kraków licea in ranking order:
   VI LO (`lo6`), III LO (`lo3`), XIII LO (`lo13`), XLIV LO (`lo44`), XX LO (`lo20`). Same steps as D4; move "check" →
   "sourced" only with an official page or otouczelnie confirming it; never guess a threshold. Also confirm whether XX LO still
   runs a bilingual class (open B2 question).
   Files: `liceum/data/db/pl/krakow/schools.json`, `liceum/data/sources.json`.
   Check: three tests pass; commit message says how many classes moved to "sourced".
2. [ ] **K3 (Sonnet) Two missing public Kraków licea.** Goal: add XVII LO im. Młodej Polski (otouczelnie Kraków rank 28; bilingual
   French, open B2 question) and XXV LO (rank 63): address, map point (`kompas/tools/geocode_schools.py`, then compare with the
   school site and set `geoChecked`), `www`, 2026/27 classes with sources, `kompasId` link in `krakow/ranking.json`.
   Unconfirmed class facts stay `"status": "check"`. Run `kompas/tools/liceum_travel.py` only if it works offline from the
   stored GTFS; otherwise leave travel times to the weekly job and say so.
   Files: `krakow/schools.json`, `krakow/ranking.json`, `sources.json`, maybe `krakow/travel.json`.
   Check: tests pass (ranking link and region test); open `?test`, area Kraków: both schools on the map and in lists.
3. [ ] **T6 (Sonnet) Tychy: Technikum nr 6 and 2026 thresholds.** Goal: add Technikum nr 6 (the one public Tychy school missing;
   GZM list order 67) the same way as T3/M1; then look for 2026/27 thresholds of all 9 Tychy schools on the schools' own
   pages ("progi punktowe 2026") or the city's recruitment page. Today 0 of 39 Tychy classes have a threshold. Enter only
   thresholds an official page shows; otherwise leave `null` and list the school in the commit message.
   Files: `liceum/data/db/pl/tychy/schools.json`, `gzm/ranking.json` (`kompasId`), `sources.json`, `config.json` (region note).
   Check: tests pass; `?test` with the Tychy test kid shows Technikum nr 6 on the map.
4. [ ] **G3 (Sonnet) GZM next schools.** Goal: the next public schools on `gzm/ranking.json` in towns already in the data:
   I LO Gliwice (licea order 5), Akademickie LO Politechniki Śląskiej (7), Technikum nr 17 ŚTZN Katowice (technika 2),
   Technikum nr 8 Sosnowiec (3). Same steps as T3 and M1; Katowice thresholds from `otou-ka-progi-2026`. New towns
   (Chorzów order 4, Tarnowskie Góry 8) wait: they need a `regions` change, which is an Opus step (now v2.10).
   Files: `gliwice/`, `katowice/`, `sosnowiec/schools.json`, `gzm/ranking.json`, `sources.json`, `config.json` (region note).
   Check: tests pass; area "Tychy i Metropolia": the four schools appear; none appear in area Kraków.
5. [x] **G4 (Sonnet) Map filter by town** (rest of roadmap G3). Goal: chips above the map in the Tychy + GZM area
   (`wszystkie`, Tychy, Katowice, Sosnowiec, Gliwice — built from `regions[].towns`, only towns with schools). A tap filters the
   map points only; lists stay as they are. Not shown in area Kraków (one town). No scoring change.
   Files: `liceum/app.js`, `liceum/liceum.css`.
   Check: click-through at 375 px and 1280 px in three looks; nothing wider than the screen.
6. [~] **L1-8 (Sonnet) School links.** Goal: `www` for 10 schools: the 5 from K1-6, plus Tychy IV LO, Technikum nr 1 and nr 2,
   and the missing Gliwice and Katowice links. Official sites only.
   Files: school files above. Check: syntax test (every `www` is http/https); "strona szkoły" opens in a new tab.
7. [x] **D9 (Sonnet) Source dates.** Goal: make `old_sources.py` meaningful: set `asOf` to `YYYY-MM` for the 6 Liceum and 2 Studia
   sources that say only `2026` (month = when the page was published or read, from the page); replace `ty-informator-2025` with
   the Tychy informator for 2026/27 if the city published it (otherwise keep it and note it); mark `gzm-rozporzadzenie-2017`
   as a legal act that is not stale (add `"stale": false` and let the script skip it). Add a check in `tests/syntax.mjs` that
   every `asOf` matches `YYYY-MM`. Studia `uj-kampus` and `gus-2020` stay for D7.
   Files: `liceum/data/sources.json`, `studia/data/sources.json`, `tools/old_sources.py`, `tests/syntax.mjs`.
   Check: `python3 kompas/tools/old_sources.py` lists only real old sources; three tests pass.
8. [x] **R2.8 (Opus) Review and release v2.8.0.** Review the Sonnet commits (sources open and say what the data says, no guessed
   thresholds, areas not mixed), click-through at 375 and 1280 px, set version 2.8.0 in the four places, `dataVersion`,
   short "Kompas Liceum v2.8.0" in the spec doc, push.

**Done in 2.8.0 (19 Nov 2026).**
- K1-6 (part): 4 of 5 schools checked (VI, III, XX, XLIV LO); 18 of 31 classes moved to "sourced"; III LO got the missing class 1B;
  XX LO and XLIV LO thresholds replaced with otouczelnie 2026/27 (conflicts gone). Year confirmed by matching the class
  min/max with the school range in `otou-progi-licea-2026`. XX LO: no bilingual class on otouczelnie for 2026/27 (aggregator only).
  Open: VI LO 1C (otouczelnie says general artistic, school file says bilingual English) and 1F (not on otouczelnie, kept as check).
- G4: town chips above the map in the Tychy + GZM area (in memory only; lists unchanged; none in Kraków).
- L1-8 (part): `www` for 9 schools (lo6, lo3, lo13, lo44, ty-lo4, ty-t1, ty-t2, gl-t1, ka-lo2). lo20 left out: the MCOO page lists
  www.xxlo-krakow.edu.pl, but the site could not be opened to confirm it.
- D9: 8 sources now `asOf` `2026-11` (month added to the repo; pages show no date); `gzm-rozporzadzenie-2017` has `"stale": false`
  and `old_sources.py` skips it; `tests/syntax.mjs` checks every `asOf` is `YYYY-MM`. No Tychy informator 2026/27 found yet.

**2.8.1 (20 Nov 2026), decided by Szymon: licea-progi.pl accepted as a source.** Tychy 2026/27 thresholds for 16 of 40
classes (II LO 6, III LO 4, IV LO 6) from licea-progi.pl (sources `lp-ty-lo2`, `lp-ty-lo3`, `lp-ty-lo4`, status "check";
field `thresholdSourceId`). All stay `"status": "check"` until an official page confirms them. IV LO got class 1MS
(sports, fitness test; profile and subjects to confirm). I LO: the page shows no 2026 class thresholds. Technika: the site has none.
Texts on the start, schools and parent pages now say where Tychy thresholds come from. **To confirm in a future release:**
the 16 thresholds and IV LO 1MS against school or city pages; sports classes as a track stay V1 (v3.0).

**Moved forward to the next Liceum release (not done on 19 Nov).**
- Night-run limits: the cloud run cannot reach Nominatim (map points) or gtfs.ztp.krakow.pl (Kraków travel times), and WebFetch
  could not open Wikipedia/Wikidata/OSM pages. Tests need a map point, `geoChecked` and (Kraków) travel times for every school,
  so no new school could be added safely. Fix: run these tasks where those hosts are reachable, or add the schools and let the
  "Geocode schools" Action fill points and times (tests fail until it finishes, so decide first).
- K1-6 rest: XIII LO (`lo13`) — otouczelnie page could not be read; III LO scored lists not on the page.
- K3: XVII LO and XXV LO (blocked by map point and travel time, above).
- T6: Technikum nr 6 Tychy (address found: ul. Browarowa 1A, 43-100 Tychy, otouczelnie; class list and map point missing).
  Tychy thresholds: done in 2.8.1 from licea-progi.pl (see above); technika and I LO still without.
- G3: I LO Gliwice (bilingual, IB), Akademickie LO Pol. Śl. (alogliwice.polsl.pl has listy_przyjetych_2026_27.pdf),
  Technikum nr 17 ŚTZN Katowice, Technikum nr 8 Sosnowiec — none added (no sourced map point).
- L1 rest: lo20 www (see above).

**News found while planning (19 Nov 2026), for the tasks above.**
- 2027/28 recruitment dates are not out yet. Małopolska set the 2026/27 dates in January 2026 (zarządzenie 10/26 MKO,
  kuratorium.krakow.pl); expect the 2027 one in January 2027. Keep `recruitmentWindow` as it is.
- New technikum professions from 1 Sept 2026 (MEN regulation of March 2026, Dz.U. 2026 poz. 404, per infor.pl): technik cyberbezpieczeństwa,
  technik optoelektroniki, technik optyki okularowej, technik agroogrodnictwa, technik aranżacji florystycznych, technik
  architektury krajobrazu i arborystyki; technik ogrodnik, technik optyk and technik architektury krajobrazu are being removed
  (rmf24.pl, 24 Mar 2026). When checking technika classes, watch for these names.
- Kraków may open a new liceum (Radio Kraków, 17 Aug 2026: 800 pupils without a place; no decision on place or date yet).
  Nothing to enter; check again in spring.

(The database status after 2.8.1 is now in the v2.9 section above.)

### Release rules

- **One release at a time, in order.** Every version (v1.9, v2.0, v2.1 …) is committed, pushed and live before the next one starts,
  so it can be reviewed on GitHub Pages.
- **Version number.** Set `appVersion` in `kompas/liceum/data/config.json`, the two places in `kompas/liceum/index.html` and line 1 of
  `kompas/liceum/app.js` to the release number (for example `2.1.0`). Fixes inside a release raise the last number.
- **Agents.** **Sonnet** = data entry and small screen changes with clear rules, a source for every fact and a test to pass.
  **Opus** = new structure in code or data, scoring, design choices, research where the order or method must be decided.
  At the end of each release an Opus agent reviews the Sonnet work (tests, a click-through at 375 px and 1280 px) before the push.
- **Spec doc.** After each release add a short "Kompas Liceum vX.Y.0" section to the spec doc and tick the task there.
- The rules for every task (below, under Part 2) apply here too: no personal data, no new network calls, a source for every fact.
- **Areas never mix** (set 19 Nov 2026, v2.0.1). The kid picks ONE area; schools outside it are ignored everywhere
  (compass, profiles, lists, likes, map, export). "Kraków i okolice" grows with towns of powiat krakowski
  (Skawina, Zabierzów …), never with Tychy. "Tychy i Metropolia (GZM)" grows with GZM towns. Areas are
  `regions` in `liceum/data/config.json`; a town belongs to one area only (tested).

### Releases

| Version | Main content | Agent |
|---|---|---|
| v1.9 | Small fixes: four missing addresses, one spelling for subjects, unused sources | Sonnet |
| v2.0 | Tychy: towns in the data, town choice at the start, Tychy schools, map and "Dojazd" | Opus + Sonnet |
| v2.1 | Location of every school checked one by one; travel time to school on the card | Opus + Sonnet |
| v2.2 | Parent summary: one printable page from the kid's file | Opus |
| v2.3 | Class data check, 5 schools at a time; yearly old-data check | Sonnet |
| v2.4 | Return to the same screen after loading a file; larger text and calmer motion | Sonnet |
| v2.5 | Bilingual classes: separate track, language test, own point scale | Opus + Sonnet |
| v2.6 | GZM part 1: ranked list of GZM licea and technika, best first; top schools go in | Opus + Sonnet |
| v2.7 | Kraków matura ranking on school cards (K2; done 2.7.0) and sources on every card (2.7.1) | Sonnet |
| v2.8 | Map filter by town, Kraków class check batch 6, links, source dates (2.8.0); new GZM/Kraków schools and Tychy thresholds moved on | Sonnet |
| v2.9 | Waiting schools (`geoPending`) so new schools can go in without a map point; XVII, XXV LO, Technikum nr 6 Tychy; Kraków class check batch 7; links; audit of questions (first slice of Q1) | Opus + Sonnet |
| v2.10 | Wave 1a: arts world + 9th profile, health, law vs media (Q2, Q3); radar tool in the repo (CW1); discovery check (CD1) | Opus + Sonnet |
| v2.11 | Wave 1b: directions Mechanika/pojazdy/produkcja and Transport/logistyka, classes remapped (W1L1, W1L2); Technikum Mechaniczne nr 16 Kraków (K4); links (L1-10) — released 22 Nov as 2.11.0 | Opus + Sonnet |
| v2.12 | Wave 2: Mundurowe, Turystyka and gastronomia (W2L1, CD3 folded in); entrance-exam classes (A1) — released 25 Nov as 2.12.0; A2 and L1-11 moved to v2.13 (web pages could not be opened that night) | Opus + Sonnet |
| v2.13 | Art liceum and music school Kraków (A2); Technikum Przemysłu Spożywczego nr 22 (K6); first wave-3 slice: direction Rolnictwo, żywność i przyroda stosowana with its classes (W3L1 + W3L2); links L1-11; Technikum Poligraficzno-Medialne nr 20 (K5, if time) — planned 25 Nov | Opus + Sonnet |
| v2.14 | Rest of wave 3: even worlds (Q4); sports rules and data (V1a, V1b); final discovery audit (CD4); art/music schools Katowice and Gliwice (A3); links L1-12; K5 if not done in v2.13. Split from v2.13 on 25 Nov (too big for one night); may still be trimmed (V1a/V1b can move to the v3.0 night) | Opus + Sonnet |
| v3.0 | Sports track and exact points (V1c); coverage review with the radar | Opus |
| v3.1 | UI/UX: calm look by default (U8), exam % by taps (U9) | Opus + Sonnet |
| v3.2 | UI/UX: line drawings for all profiles (IL1, IL2) | Opus + Sonnet |
| v3.3 | UI/UX: one-page parent summary (P2) | Opus |
| v3.4 | Ukrainian interface (I1, I2) | Opus + Sonnet |
| later | New areas (Kraków okolice towns, Chorzów, Tarnowskie Góry), G3 schools, Q1 extra situations if Szymon says yes | Opus + Sonnet |

Every v2 release also does **L1**: website links for 5–10 schools. English and French interface come after v3.4.

*Release table reordered on 21 Nov 2026, 15:13 (coverage waves). Task texts further down that still say v2.11, v3.1 etc. keep their wording; the order is the one in this table and in "v3.0 tasks".*

### Tasks

**Every release**
- **L1 (Sonnet) School links.** `www` for 5–10 schools per release and "strona szkoły" on the school card (details: D3).
  Kraków first, then Tychy, then GZM in ranking order. The first release with L1 also adds the link code and the test from D3.

**v1.9**
- **S1 (Sonnet) Missing addresses.** = D2.
- **S2 (Sonnet) Tidy data.** = D5 and D6.

**v2.0 Tychy**
- **T1 (Opus) Towns in the data.** Each school gets `town`. Tychy data goes in `kompas/liceum/data/db/pl/tychy/`, next to `krakow/`.
  The app loads the schools of the chosen town(s). Old saved files still load (no town = Kraków).
- **T2 (Opus) Town choice.** Chips at the start: Kraków, Tychy (later GZM towns). Kraków by default. Kept in the saved file.
- **T3 (Sonnet) Tychy schools.** All licea and technika in Tychy: classes, extended subjects, scored subjects, 2026/27 thresholds.
  Every fact has a source; otherwise `"status": "check"`. Never guess a threshold.
- **T4 (Sonnet) Map for the chosen town.** The map centres on the town; run `kompas/tools/geocode_schools.py` for Tychy addresses.
- **T5 (Sonnet) Tests.** A test kid from Tychy; a check that every school has a town and an address.

**v2.1 Location**
- **M1 (Sonnet) Check every school location.** Compare address and map point with the school's own site; set `"geoChecked": true`.
- **M2 (Opus) Travel time to school.** From the kid's district or town by public transport, on the school card and as a filter
  ("do 30 min"). Times are computed ahead (GitHub Action, like Studia's GTFS job) and stored in the repo; no calls when the app runs.

**v2.2**
- **P1 (Opus) Parent summary.** One printable page from the kid's file: compass, Moja lista, plan to May. Made in the browser
  (print to PDF), no sharing, no accounts.

**v2.3**
- **D1 (Sonnet) Class data check.** = D4, 5 schools per commit.
- **D2 (Sonnet) Old-data check.** A yearly GitHub Action that lists sources with `asOf` older than a year (opens an issue or fails a check).

**v2.4**
- **U1 (Sonnet) Comfort.** = U6, plus "większy tekst" and "spokojniej" (less motion) switches in the header, kept in the saved file.

**v2.5 Bilingual**
- **B1 (Opus) Bilingual track.** Read the 2027 rules for bilingual classes (language test, point scale). Add a separate track in scoring
  and on the profile screen. Kept simple: the kid says how the language goes (słabo / dobrze / świetnie), as elsewhere.
- **B2 (Sonnet) Bilingual classes.** All bilingual classes in Kraków and Tychy (for example XVII LO), with sources.
  Open after v2.5.0: XVII LO (French; sources do not say which first-year class is bilingual), and check whether XX LO, I LO and IX LO
  still run bilingual classes (they host bilingual matura exams). Tychy IV LO 1C: language not in the source.

**v2.6, v2.8 GZM**
- **G1 (Opus, v2.6) GZM ranked list.** All licea and technika in the GZM towns, ordered best to worst by **matura results**,
  with town, address and source. Main order: the Perspektywy "Ranking Maturalny" for licea and for technika (matura results only,
  no olympiads), newest edition (2026; perspektywy.pl). Schools not in it are placed by the otouczelnie.pl ranking for their town
  (matura pass rate + average Polish, maths and English at basic level; covers every school; already a Kompas source).
  Store both ranks and the source for each school. Store it as `kompas/liceum/data/db/pl/gzm/ranking.json`. It sets the order for G2 and G3.
- **G2 (Sonnet, v2.6) GZM schools, top of the list.** Same steps as T3 and M1, from the top of the ranked list.
- **G3 (Sonnet, v2.8) GZM schools, next on the list.** Same steps; plus a map filter by town.

**Kraków review (asked 19 Nov 2026; K2 in v2.7, K1 and K3 in v2.8)**
- **K1 (Sonnet) Kraków schools and classes review.** = D4 for Kraków: every school's 2026/27 classes against otouczelnie and the
  school site, 5 schools per commit; add missing classes, fix labels, move "check" to "sourced" where a source confirms it.
- **K2 (Sonnet) Kraków ranking info.** Same idea as G1: `kompas/liceum/data/db/pl/krakow/ranking.json` with the Perspektywy
  Ranking Maturalny 2026 rank (readable top ~200) and the otouczelnie Kraków 2026 rank for every school; show the rank on school
  cards (also for GZM schools), with source.

**v2.9 (first slice: Q1a audit), v2.10 (rest)**
- **Q1 (Opus) Review of questions and interests.** Check worlds, activity cards, situations, strengths and directions for balance:
  languages, economy and business, sociology and psychology, law and media, arts. Add or rewrite cards; one test kid per world.

**Q1a audit (21 Nov 2026, v2.9).** Made by `python3 kompas/tools/questions_audit.py` (read-only; the field of each item is set
by hand in the script; "ogólne" = style or skill that fits every field). Situations measure work style, not field.



What it shows: science/IT has 12 of 40 activities, 2 of 8 worlds and 7 of 14 directions; every other field has one direction.
A kid who picks "Komputery i technika" sees 7 world cards, a kid who picks "Języki i świat" sees 3. **Arts** has no world and no
direction (only a12 and the strength "rysunek"), although Kraków has artistic and media classes (e.g. VI LO 1C, XVII LO).
**Care and health** sits inside "biologia" (przyrodniczy). **Law** and **media** share one direction ("spoleczenstwo").

**Questions for Szymon** (answered 21 Nov 2026: 1–4 yes, 5 open; see "Major v3.0 – plan" at the top of Part 1):
1. Add an **arts** field: a world "Sztuka i projektowanie" and a direction (plastyka, film, design, architektura wnętrz) linked
   to artistic/media classes? Yes / no / later.
2. Split **care and health** from biology: a direction "Zdrowie i opieka" (ratownictwo, pielęgniarstwo, fizjoterapia, dietetyka)
   in the social or natural-science profile? Or keep it in "biologia"?
3. Split **law and media**: "Prawo i administracja" and "Media i komunikacja" as two directions, or keep one?
4. **Even out the worlds:** 5 activities in every world (add 2 each to languages, business, people, society, building, sport;
   trim tech to 5), so no world weighs more just by having more cards? This changes compass results a little for everyone.
5. **Situations:** add 2 situations (e.g. a conflict in class, a trip abroad) so that people, languages and business show up
   there too? They would stay style questions (same 6 interests), not field questions.

**v3.1 (was v2.11)**
- **I1 (Opus) Texts in language files.** All interface texts in one file per language; a language switch in the header.
  **Note (24 Nov 2026):** Studia builds the shared `kompas/core/i18n.js` (`t`, `plural`, fallback) in its v3.1 (Ukrainian track, Part 3). When this task comes, reuse it; do not write a second one.
- **I2 (Sonnet) Ukrainian translation.** Simple words for a 14-year-old; mark it for one read by a Ukrainian speaker.

**v3.0**
- **V1 (Opus) Sports classes and exact points.** A separate track for the fitness test; exact points counting as an option,
  after the 2027 rules are checked.

---

## Part 2: Small jobs (from the review of 13 Nov 2026)

Each one is mostly data entry or a small screen change. None needs new scoring logic.
Do them one at a time, in any order. Priority: **P1** helps the kids most, **P3** is tidying.
Liceum jobs (D2–D6, U6) are now scheduled in Part 1; Studia jobs stay here.

## Rules for every task

1. **No personal data** in this repo (it is public). No names, marks or answers of real people, also not in tests or examples.
2. **No new network calls** when the app runs. Allowed today: OpenStreetMap map tiles in Liceum, links that open only when tapped,
   and the site-wide GoatCounter visit counter (kept by Szymon, 21 Nov 2026). No other analytics, no cookies, no browser storage, no CDN scripts or fonts.
3. **Every fact needs a source.** Add the page to the app's `data/sources.json` (`id`, `url`, `title`, `asOf` as `YYYY-MM`, `status`)
   and point to it with `sourceId`. If you cannot confirm a fact on an official page, do not invent it: leave the field empty
   or keep `"status": "check"`.
4. **Do not change scoring** (`core/scoring.js`, `liceum/points.js`, weights in `config.json`) unless the task says so.
5. **Polish only, simple words.** Text is read by a 14-year-old and an 18-year-old. Short sentences. No grading tone
   ("to nie test"). Kids do not want to write: prefer chips, sliders and taps over text fields.
6. **Check before you commit**, from the repo root:
   ```
   node kompas/tests/syntax.mjs && node kompas/tests/run.mjs && node kompas/tests/liceum.mjs
   ```
   All three must exit with 0. Then open the changed screen at 375 px and 1280 px wide in all three looks
   (`?skin=neon`, `?skin=pop`, none) and make sure nothing is wider than the screen.
   Test people are under "Tryb testowy" on the start screen when the address has `?test`.
7. **After data changes** set `dataVersion` in that app's `data/config.json` to today's date. After screen changes raise the
   last number of `appVersion` and the same number in that app's `index.html` (two places) and in line 1 of `app.js`.
8. One task = one commit. Say in the commit message which task (for example `Kompas backlog D1`).

## Where things are

| What | File |
|---|---|
| Studia areas ("cards") | `kompas/studia/data/opportunities.json` |
| Studia study offers, campuses | `kompas/studia/data/db/pl/krakow/offers.json`, `campuses.json` |
| Studia forces and sectors | `kompas/studia/data/scenarios.json` |
| Studia questions | `kompas/studia/data/questions.json` |
| Liceum schools and classes | `kompas/liceum/data/db/pl/krakow/schools.json` |
| Liceum waiting schools (P9, v2.9) | same `schools.json` files: a new school without a checked map point gets `"geoPending": true` and `"geoPendingSince": "YYYY-MM-DD"` and no `geo`. The app and tests skip it until the "Geocode schools" Action sets `geo` + `geoChecked` (and Kraków travel times) and removes the flag. Tests fail if the flag is left behind or older than 30 days. |
| Sources | `kompas/studia/data/sources.json`, `kompas/liceum/data/sources.json` |
| Screens | `kompas/studia/app.js`, `kompas/studia/story.js`, `kompas/liceum/app.js` |
| Shared styles (both apps) | `kompas/studia/style.css`, `v11.css`, `skin-neon.css`, `skin-pop.css`; Liceum only: `kompas/liceum/liceum.css` |

---

## Data tasks

### D1 (P1) Studia: local demand for 17 areas
**Why.** 9 of 26 areas say how the Kraków job market looks ("deficyt", "równowaga"…). The other 17 show nothing.
**Areas without it:** rehabilitacja, farmacja, dane-medyczne, inz-biomed, sport, atom, cyber, automatyka, obronnosc, ukraina, ue,
logistyka, woda, laboratorium, media, handel, projektowanie.
**Steps.**
1. Use the newest "Barometr zawodów" for Kraków / Małopolska (barometrzawodow.pl) or the Kraków labour office report already
   used (`sourceId: "krk-orp-2026"`). Add a new source entry if you use a new page.
2. For each area add, next to `whyNeeded`:
   `"demand": { "level": "deficyt" | "równowaga" | "nadwyżka" | "mieszany", "text": "<one plain sentence about Kraków>", "sourceId": "<id>" }`
   Copy the style of `medycyna`. Use "mieszany" when the jobs inside one area differ.
3. If the report has no matching job, skip that area and list it in the commit message.
**Done when** each of the 17 has `demand` or is listed as "no data", and tests pass.
**Status: done in Studia 2.0.0** (16 areas; `inz-biomed` no data).

### D2 (P1) Liceum: four missing school addresses
**Schools:** `lo1`, `lo7`, `lo14`, `lo44` have `"address": null`. The "Dojazd" button then searches by school name only.
**Steps.** Take the address from the school's own website or BIP. Write it like the others: `"ul. Grzegórzecka 24, 31-531 Kraków"`.
Do not touch `geo`.
**Done when** no school has an empty address.

### D3 (P2) Liceum: school websites
**Why.** The plan says "wejdź na stronę szkoły", but the app has no link.
**Steps.**
1. Add `"www": "https://…"` to each of the 48 schools (official site only, `https` when it exists).
2. In `kompas/liceum/app.js`, function `schoolCard` (search `class="scard`), show a small link next to the address:
   `<a href="…" target="_blank" rel="noopener">strona szkoły</a>`, only when `www` is set. Pass the value through `esc()`.
3. In `kompas/tests/syntax.mjs` add a check that every `www` starts with `https://` or `http://`.
**Done when** every school card with a known site shows the link, and it opens in a new tab.

### D4 (P2) Liceum: confirm class data
**Now:** 225 classes; 205 have `"status": "check"`, 45 have no `threshold` (41 in licea, 4 in technika), 80 have no `scored` list.
**Steps (five schools per commit).**
1. Open the school's recruitment page for 2027/28. If it is not published yet, use 2026/27 and keep `"status": "check"`.
2. For each class check: `code`, `label`, `extended` (extended subjects), `scored` (the four subjects counted from the certificate),
   `threshold` and `thresholdYear` (lowest points admitted last year).
3. Subject words to use in `extended` and `scored`: `polski`, `matematyka`, `angielski`, `fizyka`, `informatyka`, `biologia`,
   `chemia`, `geografia`, `historia`, `wos`. Other languages: `j. niemiecki`, `j. francuski`, `j. hiszpański`, `j. włoski`.
4. When everything in a class is confirmed on an official page: `"status": "sourced"`, `"scoredSourced": true`, and `sourceId`
   pointing to that page.
**Done when** the commit message says how many classes moved from "check" to "sourced". Never guess a threshold.

### D5 (P3) Liceum: one spelling for subjects
**Now:** `extended` mixes `angielski` (74×) with `j. angielski` (52×), and `j. polski` (29×) with `język polski` (15×).
The code copes with it (see `scoredSubjects` in `liceum/points.js`), but the data is untidy.
**Steps.** Replace `j. angielski` → `angielski`, `j. polski` and `język polski` → `polski` in `extended` only. Change nothing else.
**Done when** `node kompas/tests/liceum.mjs` prints the same compass lines as before the change.

### D6 (P3) Sources nobody uses
**Studia:** otou-asp-aw, otou-dziennikarstwo-krk, otou-matura, otou-medyczne-krk, uj-kampus, uj-zasady-2026, zse1-bip.
**Liceum:** kurator-kryteria, lo7-oddzialy, otou-harmonogram-2026, otou-punkty, otou-tl14-klasy, radio-2023, zschk-klasy.
**Steps.** For each id search the app folder. If nothing points to it, either attach it where it belongs (for example
`lo7-oddzialy` to the lo7 classes, if the page really covers them) or delete the entry.
**Done when** every source is used at least once. Add that check to `kompas/tests/syntax.mjs`.

### D7 (P3) Studia: newer pay data
**Now:** pay bands (`pay.band` 1–3, `pay.group`) come from GUS, October 2020 (`sourceId: "gus-2020"`).
**Steps.** Find the newest GUS "Struktura wynagrodzeń według zawodów" (published every two years). For each `pay.group` look
up the average pay and compare it with the average for all jobs in the same table. Keep the band a card has now unless the new
table clearly moves that group (band 1 = clearly below the average, 2 = near it, 3 = clearly above). Add the new source and
update `sourceId`. The words "GUS, październik 2020" are written by hand in `studia/app.js` (`payHtml`) and `core/export.js`:
search for `październik 2020` and change both to the new month and year.
**Done when** all cards with `pay` point to the new source, or the task is closed with a note that no newer table exists.
**Status: part done in Studia 2.0.0** (4 of 26 cards on `gus-2024`; the rest needs the GUS XLSX table, see Part 3).

### D8 (P3) Studia: check one offer
Confirm on the University of Agriculture (URK) site that "Inżynieria i gospodarka wodna" still recruits for 2027/28, and that
its entry in `offers.json` (subjects, length, link) matches. Fix or mark `"status": "check"`.
**Status: marked "check" in Studia 2.0.0**; a hand check on the URK site is still open (Part 3).

---

## Small screen tasks (little logic)

### U1 (P1) Studia: minutes from home as chips
**Status: done in Studia 2.1.0** (20 Nov 2026).
**Where.** `kompas/studia/app.js`, screen "Gdzie chcesz być potrzebny?" (search `data-field="startMin"`). It is a number field.
**Do.** Replace it with chips: `10`, `20`, `30`, `45`, `60`, `90 min`. A tap sets `A.startMin`. Keep the same question text.
Use the existing `chip()` helper and the `data-set="startMin" data-val="30"` pattern used for `privateOk` on the same screen
(check that the handler stores a number; `commute()` does `Number(A.startMin)`, so a string is fine too).
**Done when** the screen has no keyboard input and the commute times in the results still change with the choice.

### U2 (P1) Studia: tap ideas for the three reflection questions
**Status: done in Studia 2.1.0** (20 Nov 2026).
**Where.** `vReflection` in `kompas/studia/app.js`; questions are in `questions.json` → `reflection` (f1, f2, f3).
**Do.** Add to each question in the data a list `"ideas": ["…", "…"]` (5–6 short answers a teenager could tap, for f1 for example
"w sporcie", "grając", "przy muzyce", "pomagając komuś", "ucząc się czegoś nowego"). Show them as chips above the text area.
A tap writes the idea into `A.reflection[q.id]` (tap again = clear). Keep the text area for kids who want to write.
**Done when** all three questions can be answered without typing and the answers appear in the exported file as before.

### U3 (P2) Studia: tap ideas for "Mogę to zrobić, bo…"
**Status: done in Studia 2.4.0** (21 Nov 2026).
**Where.** `data-field="canDo"` (two places in `kompas/studia/app.js`).
**Do.** Under the field show 3 chips built from his own answers, for example
`bo umiem: ${first strength}`, `bo ważne jest dla mnie: ${first value}`, `bo już to robię ${where}`. A tap fills the field.
**Done when** the sentence can be chosen with one tap and still edited by hand.

### U4 (P2) Studia: sport as chips
**Status: done in Studia 2.1.0** (20 Nov 2026).
**Where.** `data-field="sport"` on the "Języki i sport" screen.
**Do.** Chips: siłownia, bieganie, piłka, pływanie, wspinaczka, rower, sztuki walki, taniec, inne, nie trenuję (many can be on).
Store them joined with ", " in `A.sport`, so the export and old files keep working. Keep a short optional text field.

### U5 (P2) Studia: shorter strengths screen on phones
**Status: done in Studia 2.1.0** (20 Nov 2026).
**Now.** After picking 5 strengths, the phone screen shows 5 blocks × 6 chips and is long.
**Do.** Show the "gdzie to widać?" block only for strengths without an answer, plus a one-line summary for the answered ones
(`Języki · w szkole  [zmień]`). `[zmień]` clears `proof` for that strength.
**Done when** a fully answered screen fits in about two phone screens.

### U6 (P3) Liceum: return to the same screen after loading a file
**Now.** Loading a saved file opens the first unanswered step, or the compass. Studia remembers the exact screen (`A.lastScreen`).
**Do.** Copy that idea: store `A.lastScreen` on every screen change, use it in `loadFile` when it is a known screen.

### U7 (P3) Both: read all texts once for tone
Read every screen as the kid would. Fix long sentences, formal words and any sentence that sounds like a grade.
Do not change meaning or numbers. One commit per app, list the changed sentences in the message.

---

## Not for the cheap agent (needs a decision first)

- Bilingual classes (v2.5), sports classes and exact points (v3.0) are now in the Part 1 roadmap, as Opus tasks.
- Map tiles without OpenStreetMap (a static picture of Kraków) if "no outside calls at all" should also cover the map.
- Germany / abroad paths (kept open, low priority).

---

## Part 3: Kompas Studia roadmap

Started 19 Nov 2026 at `appVersion` 1.1.2. The first release of this cycle is **v2.0**, then v2.1, v2.2 …
Liceum has its own roadmap (Part 1); do not touch Liceum work here, but reuse shared code (`kompas/core`) and keep
`node kompas/tests/liceum.mjs` passing.

### Major goals

Set by the weekend review task (it writes this list; planners keep it and plan minors toward the current goal).
- **Current goal (Szymon, 24 Nov 2026, 15:45): the Ukrainian version of Studia, top priority.** Order he gave: (1) the main UI, (2) the questions,
  (3) courses (directions) and university descriptions, (4) a data stream that finds universities with a Ukraine-related education or a
  dedicated diploma. Releases v3.1–v3.6, see "Ukrainian version" below. The UI/UX items 10, 7, 11 move behind it (v3.7), travel from the
  centre is v3.8, the parent summary v3.9. **Exact thresholds, GUS pay and the points estimate wait for v4.0** (Szymon, 24 Nov).
  The card test is done: 3.0.0 has 42 of 42 cards in some test kid's top 3 (kids A–AD).
- Previous goal, done: **Studia waves (3.0.0, 21 Nov 2026):** every field at level 3 or more, every card in a test kid's top 3. Liceum waves continue in Part 1.
- Previous goal (changed by Szymon, 21 Nov 2026, 15:13): cover all study directions, in three waves (see "Coverage waves" at the top of this file), then v3.0 as the review.
- Previous goal (agreed in the weekend review, 21 Nov 2026), still valid after the waves: v3.0. **A wider compass and a choice before the
  declaration.** The cards cover the whole range of what kids like (also media, digital media, commerce), and by 7 Feb 2027
  Aleks can see which rozszerzenie opens his liked directions, star offers and compare them. Every fact still needs a fresh source.
- Previous goal (trustworthy Kraków facts) is kept as a rule, not as the main goal: items 5–6 finish it.

#### v3.0 main improvements (agreed 21 Nov 2026, in priority order)

**Reordered again 24 Nov 2026:** Ukrainian version first (v3.1–v3.6); items 10, 7, 11 (screen) = v3.7; item 12 = v3.8; item 9 = v3.9; items 5, 6, 8 = **v4.0**.

**Reordered 21 Nov 15:13.** Item 1 is now the three coverage waves (v2.7–v2.12). Items 5 (UJ thresholds, in v2.9) and 6 (GUS pay, in each Data release) and the data part of item 11 (`url` per offer; every new offer gets one) run inside the waves. The UI/UX and functionality items move after v3.0: **v3.1 UI/UX** = items 10, 7 and the screen part of 11; **v3.2 Functionality** = items 12 and 8; **v3.3 UI/UX** = item 9. Old "this week / next week" dates no longer apply.

**This week (from 22 Nov):**
1. [~] **Study directions review + media, digital media, commerce + broader interest cards** (Szymon's idea, top priority; 1a and 1b for media/commerce done in 2.3.0, rest waits for Szymon's pick) — Data + Functionality · L · Opus + Sonnet.
   Today 26 cards, mostly health, tech and security; "Co lubisz robić" has 23 activities, few for media, commerce, art, business.
   - a) Opus (Data night): map all study directions (Polish fields and disciplines + what Kraków universities really offer),
     table "covered / thin / missing" against the 26 cards. Write it in this file as a proposal of new or split cards
     (at least: digital media / games / UX, deeper media and commerce/marketing/business) and of new activity and situation
     cards for a broader centre of interest. **Szymon confirms the list** before code (ask in the plan; until then do b only for
     media, digital media and commerce).
   - b) Sonnet (Data): add the confirmed cards with Kraków offers, `requires`, sources; fill `media`, `handel` (offers, demand, pay).
   - c) Opus (Functionality/UI): add the new activity and situation cards (taps only) so each card can be reached; keep the
     scoring balanced (no card unreachable, no card always on top; test with the personas); tests in `tests/run.mjs`.
2. [x] **Declaration helper before 7 Feb 2027:** which rozszerzenie opens most of his liked directions — Functionality · M · Opus — **done in 2.2.0**
3. [x] **Star an offer:** kept in the saved file and listed in the export — Functionality · S · Sonnet — **done in 2.2.0**

**Next week (from 29 Nov):**
4. [x] **Compare 2–3 starred offers** side by side (done in 2.4.0) (subjects, threshold, length, commute) — UI/UX · M · Opus
5. UJ + UJ CM 2026 thresholds from UJ's own results pages (22 offers; v2.0 ST2 rest) — Data · M · Opus
6. GUS 2024 pay for the last 22 cards, then delete `gus-2020` (v2.0 ST3 rest) — Data · S · Sonnet
7. Sources page (all sources with `asOf`, like Liceum v2.7.1) + "Mogę to zrobić, bo…" chips (U3) — UI/UX · S · Sonnet
8. Points estimate: tap expected matura % → his points per offer next to the 2026 threshold — Functionality · L · Opus
9. Parent summary: one printable page for the family table — UI/UX · M · Opus (if no room, moves to v4.0)

**Added by Szymon, 21 Nov 14:43 (plan for v3.0):**
10. **Strengths as the foundation of the compass** — UI/UX · M · Opus. On the story's compass (`#s-kompas`, `sceneSvg` in
    `studia/story.js`) the strengths sit too close to the circle. Draw them a little apart, below the compass, as a base or
    foundation the directions grow from (e.g. a row of stones or a plinth with the 5 strengths, thin lines rising to the needle's
    directions). Keep the scroll steps and the highlight of inputs; check 375 and 1280 px in three looks.
11. **A link under each university or school, right in the "Kierunki" view** — Data + UI/UX · M · Sonnet (data) + Opus (screen).
    Today the study detail opens only after a tap on the road. Data: an official page `url` per offer (course or recruitment page of
    the university, not otouczelnie), 81 offers, as a new field next to `sourceId`; test that every offer has an http(s) `url`.
    Screen: under each study on the road and in the panel, the university and a visible "strona kierunku ↗" link (new tab), without
    opening the detail first. Same in the one-page report.
12. **Travel time counted from the centre, not from home** — Functionality · M · Opus. Today: "minutes from home to Dworzec Główny"
    plus the campus time from Dworzec. This penalises families living outside the centre (Szymon: "to not bias against żelków").
    New: the kid picks the start point, **Rynek Główny** or **Dworzec Główny** (chips), and times are shown as "z Rynku ok. 18–24 min";
    home minutes are no longer added (old files keep `startMin` but it is not used; a one-line note says so). Data: compute
    `fromRynek` next to `fromHub` with `kompas/tools/transport.py` from the stored Kraków GTFS (same method, stop "Rynek Główny" /
    nearest stops). Also in the compare table, "Kraków" map section and export.

**For v4.0 (set by Szymon 24 Nov 2026):** exact thresholds (item 5, SD5 UJ and UJ CM), GUS 2024 pay (item 6 and ST5), the points estimate (item 8).
Also later: open days 2027 (dropped from v3.0 by Szymon); more Kraków offers beyond item 1; other cities
(Katowice, Warsaw; Munich/Augsburg phase 2); U7 tone read; URK check if still open.

Planners: pick the next item of this list that fits tonight's focus (Data → UI/UX → Functionality). If nothing in "this week"
fits the focus, take the first "next week" item that does.
### Release rules

- **One release at a time, in order.** Every version is committed, pushed and live on GitHub Pages before the next one is planned.
  If the last planned release is not pushed yet, the planner does not plan a new one.
- **Version number.** Set the release number (for example `2.0.0`) in all places Studia shows it: `appVersion` in
  `kompas/studia/data/config.json`, two places in `kompas/studia/index.html` (meta description and `class="ver"`), and line 1
  of `kompas/studia/app.js`. Search the old number in `kompas/studia` to be sure none is left. Fixes inside a release raise the last number.
- **Agents.** **Sonnet** = data entry and small screen changes with clear rules, a source for every fact and a test to pass.
  **Opus** = new structure in code or data, scoring, design choices, research where the method must be decided.
  At the end of each release an Opus agent reviews the Sonnet work (tests, click-through at 375 px and 1280 px in three looks) before the push.
- **Focus by rotation:** Data → UI/UX → Functionality → Data … Skip a focus only when nothing useful is left in it (say why in the plan).
  **Suspended 24 Nov 2026:** the order of releases v3.1–v3.9 is fixed by the release table below (Ukrainian track first); the rotation applies again after v4.0.
- **Spec doc.** After each release add a short "Kompas Studia vX.Y.0" section to the spec doc ("Kompas – study & school choice app (spec)").
- The rules for every task (Part 2) apply: no personal data, no new network calls, a source for every fact, one task = one commit.
- **Liceum work may run the same night** (it also edits `kompas/studia/data/sources.json` in D9). `git pull --rebase` before
  starting and before pushing; keep both sides when merging.

### Releases

| Version | Focus | Main content | Agent | Status |
|---|---|---|---|---|
| v2.0 | Data | Kraków job demand for the 17 missing areas (D1); 2026 thresholds for UJ, UJ CM and AGH offers; newer GUS pay (D7); URK offer check (D8) | Sonnet + Opus | pushed 19 Nov 2026 as 2.0.0 (some items moved, see below) |
| v2.1 | UI/UX | Fewer keyboards: minutes from home as chips (U1), tap ideas for the reflection questions (U2), sport as chips (U4), shorter strengths screen on phones (U5) | Sonnet + Opus | pushed 20 Nov 2026 as 2.1.0 |
| v2.2 | Functionality | Star an offer (v3.0 item 3) and the declaration helper (v3.0 item 2) | Sonnet + Opus | pushed 21 Nov 2026 as 2.2.0 (built in the afternoon, at Szymon's request) |
| v2.3 | Data | Study directions map + card proposal (1a); digital media card and media/commerce offers (1b, part) | Opus + Sonnet | pushed 21 Nov 2026 as 2.3.0 (afternoon, at Szymon's request) |
| v2.4 | UI/UX | Compare 2–3 starred offers (v3.0 item 4); "Mogę to zrobić, bo…" chips (U3); a games/UX tap card (1c, agreed part) | Opus + Sonnet | pushed 21 Nov 2026 as 2.4.0 (afternoon, at Szymon's request) |
| v2.6 | Data + questions (top priority, Aleks's feedback) | New cards: sea and oceans, aviation, travel and tourism, art history; 4 offers (UG Gdańsk, PRz Rzeszów, UEK, UJ); 4 activities, 1 situation, 2 strengths; "historia sztuki" as a matura subject; offers outside Kraków | Opus | pushed 21 Nov 2026 as 2.6.0 |
| v2.5 | UI/UX + questions | Illustrations (pictograms on every activity and situation card, 5 more screen illustrations); question review for a broader range of interests (7 tap cards, 2 situations); fix: road line crossing the "Gdzie się uczyć" caption | Opus | pushed 21 Nov 2026 as 2.5.0 (Szymon replaced the points plan, 21 Nov 13:57) |
| v2.7 | Data (wave 1) | Cards Prawo i administracja, Architektura i budownictwo, Mechanika/materiały/produkcja, Edukacja i nauczanie with Kraków offers, sources, `url`, demand and GUS pay | Opus + Sonnet | pushed 21 Nov 2026 as 2.7.0 (afternoon, Szymon: "implement") |
| v2.8 | Questions + functionality (wave 1) | Activity and situation cards, test kids and reachability test for the 4 cards | Opus | pushed 21 Nov 2026 as 2.8.0 |
| v2.9 | Data (wave 2) | Cards Społeczeństwo/polityka/praca socjalna, Nauka i badania, Sztuka/muzyka/scena, Historia/kultura/dziedzictwo; UJ thresholds (item 5) | Opus + Sonnet | pushed 21 Nov 2026 as 2.9.0 (Szymon: "next wave"); UJ thresholds moved to v2.11 |
| v2.10 | Questions + functionality (wave 2) | Same for the 4 wave 2 cards; entrance exam tag for arts | Opus | pushed 21 Nov 2026 as 2.10.0 |
| v2.11 | Data (wave 3) | Cards Żywienie i dietetyka, Weterynaria/zwierzęta/rolnictwo, Geografia/przestrzeń/planowanie; deeper Sport and Turystyka | Opus + Sonnet | pushed 21 Nov 2026 as 2.11.0 |
| v2.12 | Questions + functionality (wave 3) | Same for the wave 3 cards | Opus | pushed 21 Nov 2026 as 2.12.0 |
| v3.0 | Review | Radar at level 3; spec doc; declaration helper checked with all cards; every card in a top 3 (10 test kids), demand and pay gaps, open offers (Politologia, Praca socjalna, 11 `check`), UJ thresholds if reachable | Opus + Sonnet | pushed 21 Nov 2026 as 3.0.0 (SD5 UJ thresholds and pay for 12 cards moved to v4.0 on 24 Nov) |
| v3.1 | Ukrainian 1a: foundation | `core/i18n.js`, texts out of the code into `pl.json` (Polish unchanged), language switch, `lang` in the file, Cyrillic fonts | Opus | **done 24 Nov 2026 (3.1.0)** |
| v3.2 | Ukrainian 1b: main UI | Ukrainian interface texts, glossary page, layout check, review sheet for a native reader | Sonnet + Opus | **done 24 Nov 2026 (3.2.0)** |
| v3.3 | Ukrainian 2: questions | Activities, situations, strengths, dimensions, scenarios, doubts and reflection prompts | Sonnet + Opus | **done 24 Nov 2026 (3.3.0)** |
| v3.4 | English (set by Szymon 24 Nov 2026, 17:19) | Interface, questions, strengths, dimensions, scenarios and the glossary in English (`?lang=en`, third chip EN); cards, offers and universities stay Polish | Sonnet + Opus | **done 24 Nov 2026** |
| v3.5 | Ukrainian 3a: directions | 42 cards (all texts); university names stay Polish in every language (Szymon, 24 Nov evening) | Sonnet + Opus | **done 24 Nov 2026 (3.5.0)** |
| v3.6 | Ukrainian 3b: studies | 126 offers (name, notes, next steps), subject names in `requires`, declaration helper and compare in Ukrainian | Sonnet + Opus | planned 24 Nov 2026; concrete plan 25 Nov 2026 (one session, see "v3.6 concrete plan") |
| v3.7 | Ukrainian 4: Ukraine data stream | Research and tags for Ukraine-related education and dedicated diplomas, filter and badges, certificate route page | Opus + Sonnet | planned 24 Nov 2026 |
| v3.8 | UI/UX (was v3.1) | Links in Kierunki with an official `url` per offer (11), strengths as the foundation (10), sources page (7) | Opus + Sonnet | moved behind the Ukrainian track 24 Nov 2026 (see "v3.7 tasks") |
| v3.9 | Functionality (was v3.2) | Travel time from Rynek or Dworzec (12) | Opus | after v3.7 |
| v3.10 | UI/UX (was v3.3) | Parent summary (9) | Opus | after v3.8 |
| v4.0 | Major | Exact thresholds (UJ and UJ CM, SD5), GUS 2024 pay (6, ST5), points estimate (8) | Opus + Sonnet | Szymon 24 Nov 2026: "can wait for 4.0" |

### v2.0 tasks (Data, planned 19 Nov 2026)

Current `appVersion` 1.1.2. No Part 3 existed, so this is the first release and starts with **Data**. Today 74 offers, all
`sourced`, none with a threshold; 17 of 26 areas have no `demand`; pay bands from GUS October 2020. Do them in this order;
one commit per task, then the release step.

1. [x] **ST1 (Sonnet) Kraków job demand for 17 areas** (= D1, all steps there).
   Where: `studia/data/opportunities.json`, `studia/data/sources.json`.
   Done when: each of the 17 areas (list in D1) has `demand` with a `sourceId`, or is named "no data" in the commit message; three tests pass;
   one card with new `demand` shows the line on the results page at 375 px.
2. [x] **ST2 (Opus) Thresholds 2026 for UJ, UJ CM and AGH offers.** The 33 offers of these three have no "how many points did the last
   person admitted have". Point scales differ (AGH counts up to 1000, UJ and CM use their own scales), so first decide one field shape, for example
   `"threshold": { "year": 2026, "points": 812, "max": 1000, "round": "I tura", "sourceId": "…" }`, and keep the scale with the number.
   Take numbers only from the university's own results page or otouczelnie "progi" pages (AGH:
   otouczelnie.pl/uczelnia_dzial/4290/…/progi; UJ: otouczelnie.pl/uczelnia_dzial/4297/…/progi); one source entry per page.
   No number found → no field (never guess). Show it in `offerHtml` (`studia/app.js`) as one small muted line, e.g.
   "W 2026 ostatnia przyjęta osoba: 812 z 1000 pkt", with the words "to informacja, nie wymóg". No scoring change; not in the compass.
   Add a test in `tests/syntax.mjs`: every `threshold` has `year`, `points` ≤ `max`, and a known `sourceId`.
   Where: `studia/data/db/pl/krakow/offers.json`, `studia/data/sources.json`, `studia/app.js`, `tests/syntax.mjs`.
   Done when: tests pass; commit message says how many of the 33 got a threshold; the line shows on an AGH offer at 375 and 1280 px in three looks.
3. [~] **ST3 (Sonnet) Newer GUS pay data** (= D7, all steps there; also replace "październik 2020" in `studia/app.js` and `core/export.js`).
   Where: `studia/data/opportunities.json`, `studia/data/sources.json`, `studia/app.js`, `core/export.js`.
   Done when: every card with `pay` points to the new GUS source (or D7 is closed with a note that no newer table exists);
   `grep -rn "październik 2020" kompas` finds nothing; tests pass.
4. [x] **ST4 (Sonnet) URK water engineering offer** (= D8).
   Where: `studia/data/db/pl/krakow/offers.json`, `studia/data/sources.json`.
   Done when: the offer matches the URK page for 2027/28 (or 2026/27 if 2027/28 is not out, then `"status": "check"`); tests pass.
5. [x] **SR2.0 (Opus) Review and release v2.0.0.** Review the Sonnet commits (sources open and say what the data says, no guessed numbers,
   no new network calls), click-through at 375 and 1280 px in three looks, set `2.0.0` in the four places, `dataVersion` to today,
   tick D1, D7, D8 in Part 2, mark v2.0 "pushed" in the table above, short "Kompas Studia v2.0.0" section in the spec doc, push.

**Done in 2.0.0 (19 Nov 2026).**
- ST1: 16 of 17 areas have `demand`, from the new source `barometr-krk-2026` (Barometr zawodów 2026, miasto Kraków, GUP Kraków).
  No data: `inz-biomed` (no biomedical engineer line in the barometer).
- ST2: field `threshold` `{year, points, max, round, sourceId}` and one muted line on the offer card. AGH 11 of 11
  (source `otou-agh-progi-2026`, I cykl, scale 0–1000; year cross-checked with maturalnie.pl). UJ and UJ CM 0 of 22.
- ST3 (part): new source `gus-2024` (GUS, October 2024, published February 2026). 4 cards moved (medycyna, dane-medyczne,
  software, cyber; band 3 confirmed). The month and year next to the pay band now come from the source (`payLabel` in
  `core/export.js`), so no hand-written "październik 2020" is left in code.
- ST4: `ur-woda` set to `"status": "check"` (card shows "dane do sprawdzenia").

**Moved to a later Studia release (next Data turn).**
- ST2 rest: UJ and UJ CM thresholds (22 offers). The otouczelnie UJ "progi" page does not show which year tab is selected or the
  scale, and two otouczelnie pages give different numbers for Kierunek lekarski (81,33 and 75,67). Use UJ's own results page,
  or a page that names the year and scale.
- ST3 rest: 22 cards still on `gus-2020`. Their groups are only in the GUS XLSX ("Tablica 5", file
  `struktura_wynagrodzen_wedlug_zawodow_za_pazdziernik_2024_r._tablice.xlsx` on stat.gov.pl), which the night run could not open.
  Then delete `gus-2020`.
- ST4 rest: confirm `ur-woda` on rekrutacja.urk.edu.pl (the site blocks automated reading). otouczelnie (no year) lists
  "biologia, chemia, fizyka z astronomią, geografia, informatyka lub matematyka" and no language rule; check which is right.

**Decided by Szymon (19 Nov 2026).**
- GoatCounter in `studia/index.html` stays (an accepted exception to rule 2). Do not remove it.
- 2026 thresholds are shown on offer cards (ST2), as one small muted line marked as information, not a requirement.

### v2.1 tasks (UI/UX, planned 20 Nov 2026)

Current `appVersion` 2.0.0, pushed and live (Pages build on `main` succeeded). The last release was **Data**, so tonight is
**UI/UX**. Theme: **fewer keyboards, more taps.** Four Studia screens still ask the kid to type or scroll a lot; all four have
clear rules in Part 2. No new facts, so no new sources; no scoring change. The Data leftovers of v2.0 (UJ thresholds, 22 GUS cards,
URK check) wait for the next Data turn (v2.3). Do them in this order; one commit per task, then the release step.

1. [x] **SU1 (Sonnet) Minutes from home as chips** (= U1, all steps there).
   Where: `studia/app.js` (search `data-field="startMin"`; click handler near `if (d.set)`).
   Note: the `data-set` handler clears a value when the same chip is tapped again (sets `null`). For `startMin` that would make the
   commute base 0, so either keep `startMin` out of the tap-again-to-clear rule (like `certainty`) or store a number and never `null`.
   Default stays 30 (the `30` chip is on at start).
   Done when: the screen has no number field; tapping `10` and then `90 min` changes the commute times on the results page;
   tapping the chosen chip again does not set 0; old saved files with any number (e.g. 25) still load (no chip on, times still use 25);
   three tests pass.
2. [x] **SU2 (Sonnet) Tap ideas for the three reflection questions** (= U2, all steps there).
   Where: `studia/data/questions.json` (`reflection` → `ideas`), `studia/app.js` (`vReflection`, click handler).
   Ideas are short, plain Polish, no grading tone, 5–6 per question. They are answer options, not facts, so they need no source.
   Idea text goes through `esc()`. If a kid typed his own text, a tap replaces it only when the field is empty or holds an idea;
   otherwise the tap adds the idea after `, ` (never delete what he wrote).
   Done when: all three questions can be answered with taps only; the chosen chip is visibly on; the export (`core/export.js`) shows
   the answers as before; at 375 px the chips wrap and nothing is wider than the screen; three tests pass.
3. [x] **SU3 (Sonnet) Sport as chips** (= U4, all steps there).
   Where: `studia/app.js` ("Języki i sport" screen, `data-field="sport"`; click handler).
   Store as text joined with `, ` in `A.sport`. On load, split `A.sport` by `,` to light the chips; any part that is not a chip
   goes into the short optional text field. "nie trenuję" turns the other chips off, and any other chip turns it off.
   Done when: sport can be set with taps only; an old file with `"sport": "siłownia od roku, wcześniej wspinaczka"` loads without
   losing text; the export shows the same `A.sport` string; three tests pass.
4. [x] **SU4 (Opus) Shorter strengths screen on phones** (= U5, all steps there).
   Where: `studia/app.js` (strengths proof block, search `data-where=` and `class="ownproof"`), `studia/style.css` or `v11.css` for the summary line.
   Opus because it changes how the screen is built and must keep the "own sentence" path (`ownproof`) and the step check
   (line with `Zaznacz, gdzie to widać`) working. Summary line: `Języki · w szkole  [zmień]`, own sentences cut to about 40 characters
   with `…`. `[zmień]` is a button (keyboard and screen reader friendly), clears `proof` for that strength and opens its block.
   Done when: with 5 strengths all answered, the screen at 375 px is at most about two phone screens tall (measure with Playwright,
   page height ≤ 2 × 812 px, write the number in the commit message); `[zmień]` works; the next step still unlocks only when all
   5 have a proof; works in three looks; three tests pass.
5. [x] **SR2.1 (Opus) Review and release v2.1.0.** Review the Sonnet commits (no new network calls, no typing needed on the four
   screens, old saved files still load, export unchanged in shape). Click through the whole Studia flow at 375 and 1280 px in three looks
   (`?skin=neon`, `?skin=pop`, none) with a test person (`?test`). Set `2.1.0` in the four places (search `2.0.0` in `kompas/studia`;
   `dataVersion` changes only if data changed: SU2 edits `questions.json`, so set it to the release date). Tick U1, U2, U4, U5 in Part 2,
   mark v2.1 "pushed" in the table above, add a short "Kompas Studia v2.1.0" section to the spec doc, `git pull --rebase`, push.

**Done in 2.1.0 (20 Nov 2026).** One release commit (the four tasks touch the same click handler).
- SU1: number field replaced by chips 10/20/30/45/60/90 min; `startMin` stays a number and is never cleared by a second tap.
  An old file with another number (e.g. 25) keeps it, lights no chip and shows "Z twojego pliku: 25 min".
- SU2: 6 `ideas` per reflection question in `questions.json`; a tap fills an empty field or one holding only an idea, otherwise adds
  after `, ` (a last `.` or `,` of his text gives way to the separator). Tap again takes the idea out. New check in `tests/syntax.mjs`.
- SU3: 10 sport chips; `A.sport` is still one text (chips first, then his own words). Parts that are not chips go to the optional field.
- SU4: answered strengths are one line (`Języki · w szkole  [zmień]`, own sentences cut at 40 characters). Persona A at 375 px:
  page height 1491 px (calm), 1484 (neon), 1606 (pop), all ≤ 1624.
- Review: three tests pass; click-through at 375 and 1280 px in three looks, nothing wider than the screen, no JS errors.
  The only console error is GoatCounter being blocked in the test sandbox (accepted exception, not new).

**Not in v2.1 (next UI/UX turn):** U3 ("Mogę to zrobić, bo…" chips, two places), U7 (tone read of all texts).
**Next Data turn (v2.3):** the three v2.0 leftovers above.

### v2.2 tasks (Functionality, planned and built 21 Nov 2026)

Current `appVersion` 2.1.0, pushed and live. The last release was **UI/UX**, so this one is **Functionality**. Szymon asked on
21 Nov at 13:29 to do today's release right away (after the weekend review), not at 21:45/22:45. From the agreed v3.0 list the
items that fit Functionality are **3 (star an offer)** and **2 (declaration helper)**. Item 1 is a Data night and waits for
Szymon to confirm the card list. No new facts, so no new sources; no scoring change.

1. [x] **SF1 (Sonnet) Star an offer.** A ☆ button (44 px) on every offer card (`offerHtml`), so it shows in the story's study
   detail, the one-page report and the old part screens. `A.stars` holds offer ids; it is in the saved file. Toggled in place
   (no re-render, open cards stay open). Loading a file drops ids that are no longer in the base and names them in the notice.
   Export: "## Moje gwiazdki" (name, institution, length, subject fit, requirement note).
   Where: `studia/app.js`, `studia/v11.css`, `core/export.js`.
   Done when: star on → `aria-pressed="true"` and ★; the declaration block switches to the stars; export lists them; reload keeps them.
2. [x] **SF2 (Opus) Declaration helper.** New story section "Deklaracja" (`#s-deklaracja`, also in the story menu and linked from
   the "Przystanek 1" step) and the same block in the one-page report (menu "Deklaracja").
   Logic in `core/scoring.js`: `subjectFit(offer, ext)` gives 0 closed (a required extended subject is missing), 1 none of his subjects
   on the list, 2 part (fewer than `count` from the list, or `main` missing), 3 full, `null` = does not depend on subjects
   (no matura, exam only, no rule). `declarationHelp()` takes his starred offers, or with no stars the offers of his shown options
   (best, most, surprise, quick start); private offers he ruled out are left out. For each subject he does not take it counts
   offers it **opens** (0 → more) or **strengthens**; shows the top 3, "Nie skreślaj" (his subjects that count somewhere), and offers
   that need two new subjects. Note: `countFrom.count` is used here; `checkOffer` still ignores it (left as is, no scoring change).
   Export: "## Deklaracja maturalna: podpowiedź".
   Where: `core/scoring.js`, `core/export.js`, `studia/app.js`, `studia/story.js`, `studia/v11.css`, `tests/run.mjs`.
   Done when: tests pass (13 new checks: fit scale, persona B → chemia opens farmacja, stars basis, private left out, export round trip).
3. [x] **SR2.2 (Opus) Review and release v2.2.0.**

**Done in 2.2.0 (21 Nov 2026).**
- Personas: A (biologia, polski) → + angielski opens Filologia angielska (UKEN) and strengthens 5; B (matematyka, fizyka) → + chemia
  opens farmacja and analityka; medicine needs two new subjects.
- Review: three tests pass; click-through with persona B at 375 and 1280 px in three looks (calm, neon, pop): star in the study detail,
  the block switches from "options" to "stars", report shows the stars; nothing wider than the screen; no JS errors (GoatCounter blocked in
  the sandbox only). Found and fixed: the first suggestion used class `top`, which is the page header class and hid it; now `dbest`.

**Next (rotation):** v2.3 = **Data**: v3.0 item 1a (map all study directions vs the 26 cards, propose new cards; Szymon confirms) and,
if time, the v2.0 leftovers (UJ thresholds, GUS 2024 pay). Tonight's 21:45 planner plans v2.3; v2.2 is already pushed.

### v2.3 tasks (Data, planned and built 21 Nov 2026)

Current `appVersion` 2.2.0, pushed. Last release Functionality, so this is **Data**. Asked by Szymon on 21 Nov, 13:40 ("run 2.3 now").
From the v3.0 list: **1a** (map of all study directions, proposal of new cards; Szymon confirms) and, as agreed, **1b only for
media, digital media and commerce** until he confirms the rest.

1. [x] **SD1 (Opus) Study directions map (1a).** Table below; proposal waits for Szymon.
2. [x] **SD2 (Sonnet) Digital media card + offers (1b).** New card `media-cyfrowe` "Media cyfrowe, gry i UX" (cluster media,
   force automatyzacja). Offers: AGH Tworzenie przestrzeni wirtualnych i gier, AGH Informatyka społeczna (also media),
   AGH Kulturoznawstwo (media), UJ Filmoznawstwo i wiedza o nowych mediach (media). Sources `otou-agh-wh`, `otou-uj-film`.
   No `demand` (the Kraków barometer PDF cannot be opened from the run; national poster lists "Graficy komputerowi", not used for Kraków)
   and no `pay` (GUS 2024 table still blocked, see ST3). UJ film threshold 84,0 on otouczelnie has no clear year: not entered.
3. [x] **SD3 (Sonnet) Commerce offers (1b).** UEK Global business services (also jezyki), Przedsiębiorczość i innowacje w gospodarce,
   Innowacje w biznesie, from the UEK 2026/27 rules table (`otou-uek-zasady-2026`, 33 courses with subjects; reusable for later cards).
4. [x] **SR2.3 (Opus) Review and release v2.3.0.**

**Done in 2.3.0.** 27 cards, 81 offers (+7), 43 sources (+3). Personas: D (draws, designs) gets `media-cyfrowe` as option 2;
E keeps `handel` first; A, B, C have it mid or low (no card always on top, none unreachable). Tests pass.

#### SD1: study directions against the cards (1a, for Szymon to confirm)

Base: the official Polish list of fields and disciplines (rozporządzenie MEiN 11.10.2022, Dz.U. 2022 poz. 2202, tekst jednolity
[Dz.U. 2025 poz. 211](https://api.sejm.gov.pl/eli/acts/DU/2025/211/text.pdf)): 10 fields, about 55 disciplines. "Covered" = a card with Kraków
offers; "thin" = touched by a card but no real home; "missing" = no card. Theology and canon law are left out on purpose.

| Field | Covered | Thin | Missing |
|---|---|---|---|
| Humanities | linguistics, Polish studies (`jezyki`, `mowa`) | literature, culture studies, art studies (`media`) | history, archaeology, philosophy, ethnology |
| Engineering | automation and electronics, computer engineering, safety, biomedical, environment and energy | architecture (`projektowanie`), transport (`logistyka`) | civil engineering, mechanical, materials, chemical engineering |
| Medical and health | medicine, pharmacy, health sciences, physical culture, medical biology | | |
| Family sciences | | (`mowa`, `psychologia`) | family and social work |
| Agriculture | | | food and nutrition (dietetics), agriculture and horticulture, forestry, animal husbandry |
| Veterinary | | | veterinary medicine (UR Kraków) |
| Social sciences | economics and finance, security, media, management, psychology, international relations | politics and administration (`ue`), pedagogy (`mowa`) | law, sociology, geography and spatial planning |
| Exact and natural | computer science, biotechnology | maths (`finanse`), physics (`atom`), chemistry and biology (`laboratorium`), earth sciences (`woda`) | astronomy, pure research as a path |
| Arts | | visual arts (`projektowanie`), film (`media-cyfrowe`) | music, theatre and acting |

**Proposed cards (Szymon picks; priority order is a suggestion).**
1. **Prawo i administracja**: law (UJ, UEK), administration; big and missing. Offers ready from UEK table + UJ.
2. **Sztuka, muzyka i scena**: Akademia Muzyczna, AST (acting), ASP fine arts; entrance exams (like `exam: true`).
3. **Żywienie i dietetyka** + **Weterynaria i zwierzęta**: UJ CM / UR dietetics, food technology, UR veterinary medicine (two cards or one "żywność, zwierzęta, natura").
4. **Architektura i budownictwo**: split from `projektowanie` (which keeps interiors and design); PK architecture, civil engineering.
5. **Mechanika, materiały i produkcja**: AGH/PK mechanical, materials, production management.
6. **Nauka i badania**: maths, physics, astronomy, chemistry, biology at UJ as a research path (today only applied cards).
7. **Społeczeństwo, polityka i praca socjalna**: sociology, political science, social work, family sciences.
8. **Edukacja i nauczanie**: split teacher paths from `mowa` (which keeps speech therapy).
9. **Historia, kultura i dziedzictwo** + **Geografia, przestrzeń i turystyka**: history, archaeology, heritage; spatial planning, tourism (UEK).

**Proposed tap cards** (activities; today 23, none for games, music, animals, law, history, food):
"Zaprojektować poziom gry albo ekran aplikacji i sprawdzić, czy ktoś się w nim nie gubi" (twr, tec) ·
"Zagrać, zaśpiewać albo zagrać rolę przed publicznością" (twr, spo) · "Zajmować się zwierzętami albo roślinami" (tec, spo) ·
"Znaleźć dziurę w regulaminie albo bronić czyjejś sprawy" (ana, prz) · "Odkryć historię starego miejsca albo przedmiotu" (ana, twr) ·
"Ugotować coś dla innych i dobrać, co komu służy" (spo, tec) · "Zrobić ankietę i sprawdzić, co ludzie naprawdę myślą" (ana, spo) ·
"Rozwiązać zadanie z matematyki, którego nikt w klasie nie umie" (ana).
Plus 1–2 situations (e.g. a school debate; a class trip to plan with a budget). Scoring check with one test kid per new card (1c).

**Open question for Szymon:** which of cards 1–9 go into v3.0 (and which wait for v4.0), and are the tap cards OK.

### v2.4 tasks (UI/UX, planned 21 Nov 2026)

Current `appVersion` 2.3.0, pushed. Last release Data, so this is **UI/UX**. "This week" items left are Data (1b rest, after
Szymon's pick) and 1c, so per the planner rule the first "next week" UI/UX item comes in: **item 4, compare starred offers**,
plus two small screen items with clear rules. No new facts, no scoring change (SU7 adds one tap card, scoring checked).
Built tonight by the 22:45 run (the 21:45 planner sees v2.4 planned and not pushed, and plans nothing new).
One commit per task, then the release step. `git pull --rebase` first (Liceum may run the same night).

1. [x] **SU5 (Opus) Compare 2–3 starred offers** (v3.0 item 4).
   Where: `studia/app.js` (new `compareHtml(r, where)` next to `declarationHtml`), `studia/story.js` (inside `#s-deklaracja`,
   under the helper, or its own band `#s-porownanie` + menu entry), the one-page report (`vResults`), `studia/v11.css`,
   `core/export.js`.
   What: shown when he has 2 or more stars. Chips above pick which 2–3 starred offers to compare (default: the first 3 stars;
   `A.compare` = list of offer ids, kept in the file; ids not starred any more are dropped). Rows (same order everywhere):
   uczelnia i kampus · długość (lata, poziom) · przedmioty (`subjectFit` words from v2.2 + `requires.note`) ·
   próg 2026 (`threshold` line or "brak danych") · dojazd (`commute()` + campus) · prywatna/publiczna · co dalej (`next`).
   Desktop (≥ 760 px): a real `<table>` with offers as columns, row headers `<th scope="row">`. Phone: one card per offer
   in a horizontal scroll-snap row (each card has all rows), no table wider than the screen. With 1 star: one line
   "Oznacz jeszcze jedną gwiazdkę, żeby porównać". Export: "## Porównanie" as a markdown table (rows × offers).
   Done when: persona B with 3 stars shows the table at 1280 px and 3 swipe cards at 375 px in three looks; un-starring an
   offer updates the comparison in place (same as `#declwrap`); export has the table; a file saved and loaded keeps `A.compare`;
   new checks in `tests/run.mjs` (compare ids subset of stars after load; export table has one column per compared offer).
2. [x] **SU6 (Sonnet) "Mogę to zrobić, bo…" chips** (= U3, Part 2). Two places: `#cando` in the story (`#s-plik`) and in
   `vPartStrengths`. Under the field 3 chips built from his answers: `bo umiem: ${first proven strength}`, `bo ważne jest dla
   mnie: ${first value}`, `bo już to robię ${proof place of the first strength}` (skip a chip if its part is empty). A tap fills
   an empty field or replaces a field that holds only a chip text; otherwise adds after `, ` (never delete his own words;
   same rule as SU2). Chip text through `esc()`. Done when: the sentence can be made with one tap and edited by hand;
   export unchanged in shape; 375 px chips wrap.
3. [x] **SU7 (Opus) Games/UX tap card** (part of 1c that is already agreed: digital media). Add to `questions.json`
   activities: `a24` "Zaprojektować poziom gry albo ekran aplikacji i sprawdzić, czy ktoś się w nim nie gubi" with dims
   `{"twr": 2, "tec": 1, "spo": 1}` (final weights by Opus after the scoring check). Old files with 23 sorted cards: on load,
   if all old cards are sorted and only new ones are missing, put `sortPos` on the first new card and show a one-line notice
   ("Doszła 1 nowa karta") instead of failing the step (search `a.sortPos = ` in `loadFile`). Scoring check: run the personas,
   `media-cyfrowe` must not jump to the top for A, B, C, E; D keeps it in the top 3. If needed add persona F
   ("gra i projektuje gry") to `personas.json` with `expect.topClusters: ["media"]`.
   Done when: three tests pass (persona expectations); the card shows in "Co lubisz robić" at 375 px; an old 2.3 file loads with the notice.
4. [x] **SR2.4 (Opus) Review and release v2.4.0.** Click-through at 375 and 1280 px in three looks (persona B with 3 stars, persona D);
   version 2.4.0 in the four places; `dataVersion` to the release date (SU7 changes `questions.json`); short "Kompas Studia v2.4.0"
   section in the spec doc; mark v2.4 pushed in the table; tick U3 in Part 2 and item 4 in Major goals; push.

**Done in 2.4.0 (21 Nov 2026).**
- SU5: "Porównaj gwiazdki" under the declaration helper (story `#cmpwrap`, also in the report). Chips pick 2–3 of his stars
  (`A.compare`; logic `compareIds` in `core/scoring.js`). Table at ≥ 760 px, swipe cards below; updates in place when a star changes.
  Export "## Porównanie" (no commute row: travel times are app-only). Note: when he stars from the helper's own list, the list
  switches to his stars, so the other offers leave that list; stars are meant to be added in "Kierunki z bliska".
- SU6: up to 3 chips under "Mogę to zrobić, bo…" (story, report, part screen), updated in place.
- SU7: `a24` (twr 2, tec 1, spo 1). New persona F "gra i projektuje gry" → media-cyfrowe, projektowanie, software (PASS);
  A–E unchanged. Old files: the new card is the only one left to sort, with a notice.
- Review: three tests pass (5 new compare checks, persona F); 375 and 1280 px in three looks; no JS errors.

**Not in v2.4:** sources page (item 7, next UI/UX turn), the other proposed tap cards (wait for Szymon's pick of cards 1–9).

### Points estimate (moved to later by Szymon, 21 Nov 2026; was the first v2.5 plan, kept for when it comes back)

Current `appVersion` 2.4.0, pushed. Last release UI/UX, so this is **Functionality**. Items 2, 3, 4 are done; item 1 (rest)
waits for Szymon's pick of cards 1–9; the only Functionality item left is **item 8, points estimate** (L, Opus). Too big for one
night for all universities, so v2.5 does **AGH only** (the 11 AGH offers already have a sourced 2026 threshold on the same
0–1000 scale). UJ and UJ CM follow when item 5 (their thresholds) is done. Core rule stays: Kompas is a compass, not a grade.
The estimate is a rough "orientacyjnie", never a promise, and never changes the scoring or the order of options.

Background (to confirm from the AGH rules, `agh-2027`): AGH ranks by a recruitment index (WR, max 1000), built from two groups
of main subjects with different weights plus double the basic-level maths points; each course's subjects for the two groups are
in Table 1 of the rules ([otouczelnie summary](https://www.otouczelnie.pl/uczelnia_dzial/11105/Zasady-rekrutacji-AGH-20252026),
[opinieouczelniach](https://opinieouczelniach.pl/uczelnia/akademia-gorniczo-hutnicza-im-stanislawa-staszica-w-krakowie/progi-punktowe/)).

1. [ ] **SF3 (Opus) AGH formula as data.** Read the AGH 2027/28 rules (`agh-2027`, uchwała Senatu, § 5 and Table 1) and write the
   exact WR formula: the weights of the two subject groups (G1/G2 or P1/P2), how basic and extended levels convert, the maths term,
   the cap at 1000. Store it once in `studia/data/config.json` as `pointRules.agh` `{ "sourceId": "agh-2027", "max": 1000, … }`
   and per AGH offer the subjects of each group (`points: { "rule": "agh", "g1": ["fizyka","informatyka"], "g2": [...] }`), taken from
   Table 1 (one source entry per page). Write `estimatePoints(offer, expected, config)` in `core/scoring.js`: picks the best subject
   per group from what he expects, returns `{ points, max, missing: [...] }` or `null` when the offer has no rule. If the rules use
   a choice he cannot express (e.g. a subject not in Kompas's list), say so in `missing`, never guess.
   Done when: unit checks in `tests/run.mjs` against 3 worked examples written from the rules (e.g. maths 80% ext + physics 70% ext);
   `syntax.mjs` checks that every `points.rule` exists in `pointRules` and every AGH offer has one.
2. [ ] **SF4 (Opus) "Ile mogę mieć punktów?" taps.** A small block in the declaration section (`#declwrap`, under the helper) and in
   the report: for each subject in his extended list plus basic maths, chips 30 / 40 / 50 / 60 / 70 / 80 / 90 / 100 % (no typing),
   stored as `A.expected = { "matematyka": { "level": "r", "pct": 70 }, … }` and kept in the file. Shown only when he has at least one
   starred AGH offer or an AGH offer in his options. Per AGH offer: "ok. 640 z 1000 pkt · próg 2026: 700 (I cykl)" with a plain-words
   gap ("brakuje ok. 60 pkt" / "powyżej progu z 2026") and the line "To szacunek: progi co roku są inne, a matura dopiero w maju 2027."
   Parent note (one line in "Dla rodzica"): the estimate is for planning, not for pressure.
   Also in "Porównaj gwiazdki" as a row "Twoje punkty (szacunek)" for AGH offers. Updates in place (no page jump), like `#declwrap`.
   Done when: persona B with expected maths 80 % and physics 70 % shows numbers that match the SF3 unit examples; changing a chip updates
   the line; an old file without `expected` loads; 375 and 1280 px in three looks.
3. [ ] **SF5 (Sonnet) Export and file.** Export "## Moje punkty (szacunek)": his expected % per subject and, per AGH offer, estimate vs
   2026 threshold; `A.expected` survives save and load (test).
4. [ ] **SR (Opus) Review and release.** Check the formula against the source once more (one worked example in the commit
   message); tests; click-through; version 2.5.0 in the four places; `dataVersion`; spec doc section; mark v2.5 pushed; push.

**Not in v2.5:** UJ / UJ CM / UEK formulas (after their thresholds, item 5), sources page (item 7), parent summary (item 9).
**Next by rotation:** v2.6 = Data (item 5 UJ thresholds, item 6 GUS 2024 pay, and the cards Szymon picks from 1–9).

### v2.5 tasks (built 21 Nov 2026, replacing the points plan)

Szymon, 21 Nov 13:57: "move counting points for later, make new 2.5 with more illustrations and question review to scope interest
and broader scope". Built the same afternoon. 14:00 bug report (phone screenshot): on the road view the line crosses the
"GDZIE SIĘ UCZYĆ W KRAKOWIE" caption; fixed in this release.

1. [x] **SV1 Pictograms** (`studia/pictos.js`): one line picture per activity card (31) and situation (6), 24×24 like `icons.js`,
   colour from the card's main interest. Test: every activity and situation has one (`tests/run.mjs`).
2. [x] **SV2 Screen illustrations** (`studia/illus.js`): styl (sliders), wartości (five cards), długość (road with 3 flags),
   niepokój (cloud and sun), refleksja (notebook). Now 11 of 16 question screens have one.
3. [x] **SQ1 Question review, broader interests** (from the 1a proposal, the tap-card part): activities a25 stage and music,
   a26 animals and plants, a27 rules and defending a cause, a28 history of places, a29 cooking for others, a30 surveys,
   a31 hard maths; situations e5 school debate, e6 class trip on a budget. Weight per interest now ana 15 · tec 16 · spo 16 ·
   twr 13 · prz 12 · sys 11 (was ana 10 · tec 15 · spo 13 · twr 12 · prz 10 · sys 8). All 6 personas still pass.
   Old files: notice "Od twojej wersji N nowych kart … i N nowe sytuacje …", only the new ones are asked.
   Time on the rail: "Co lubisz robić" 4 min, "Co robisz, gdy…" 2 min.
4. [x] **SB1 Fix road view**: the curve from the area to the trunk now ends above the caption; caption moved right of the trunk.
5. [x] **SR2.5 Review**: three tests pass; 375 and 1280 px in three looks on 7 question screens; old 2.4 file loads with the notice.

**2.5.1 (21 Nov 14:15, Szymon: "na świecie musi bardziej być oczywiste, że można kliknąć i zobaczyć, gdzie rośnie praca").**
On "Świat za 10 lat": each force has the line "Tu rośnie praca. Dotknij, żeby zobaczyć:" above real buttons (border, ›);
each sector has a "Zobacz ›" button, one soft pulse on the first one until something is opened; a tap opens the sector in place
with its areas (icon, who you help, why needed) and scrolls to it; "Zwiń" closes it. 375 and 1280 px in three looks.

**2.5.2 (21 Nov 14:43, Szymon: big fix).** "Porównaj gwiazdki" moved right after "Kierunki z bliska" as its own story section
(`#s-porownanie`) and into the top menu ("Porównaj"); in the report it comes right before the declaration helper and has a menu
entry. The hint points to "Kierunki" above. Checked 375 and 1280 px in three looks.

**Note:** the new tap cards widen the profile, but cards for law, arts, food, animals, history (proposal 1–9) still wait for
Szymon's pick, so for now these interests lead to the nearest existing cards.
**Next by rotation:** v2.6 = Data (item 5 UJ thresholds, item 6 GUS 2024 pay, and the cards Szymon picks).

### v2.6 tasks (built 21 Nov 2026, top priority: Aleks's feedback)

Aleks, relayed by Szymon at 14:57: nothing about the sea (oceanography, for Wiktoria), nothing about flying and travel (for Mateusz);
add something like art history (a friend is thinking about it); so also more skill/interest questions. "Do it now."

1. [x] **Cards (4):** `morze` "Morze, oceany i klimat" (cluster przyroda, force energia), `lotnictwo` "Lotnictwo, drony i kosmos"
   (technika, bezpieczenstwo), `turystyka` "Turystyka i podróże" (podroze, demografia), `historia-sztuki` "Historia sztuki, muzea i zabytki"
   (sztuka, automatyzacja). New cluster icons `przyroda`, `podroze`. No `demand` / `pay` yet (same blockers as `media-cyfrowe`).
2. [x] **Offers (4):** UG Oceanografia (Gdańsk; `otou-ug-oceanografia`), Politechnika Rzeszowska Lotnictwo i kosmonautyka
   (`otou-prz-lotnictwo`), UEK Turystyka i rekreacja (`otou-uek-zasady-2026`), UJ Historia sztuki (`otou-uj-hsz`; campus ul. Grodzka 53,
   `uj-ihs-adres`). Oceanography and aviation are not taught at public universities in Kraków, so these are the first offers **outside
   Kraków**: campuses with `outside: true` and `city`; the card says "poza Krakowem: Gdańsk, trzeba się przeprowadzić", the link
   says "Pokaż na mapie", the Kraków map skips them. The cards say plainly where it is studied.
3. [x] **Questions:** activities a32 sea and diving, a33 planes and rockets, a34 travel and cultures, a35 museums and epochs;
   situation e7 "a week and a ticket anywhere"; strengths `orientacja` (orientacja w terenie i na mapie) and `oko` (oko do sztuki i
   szczegółów) in `core/strengths.json` (shared with Liceum; Liceum tests pass). "historia sztuki" added to the matura subjects
   (also counted for AGH Tworzenie przestrzeni wirtualnych i gier and UJ Filmoznawstwo). Pictograms for all new cards.
4. [x] **Personas G (sea), H (flying, travel), I (art history):** each gets its card first (morze / lotnictwo / historia-sztuki).
   D now gets historia-sztuki in the top 3, E gets turystyka 2nd; all 9 personas pass.
5. [x] **Review:** three tests pass; 375 and 1280 px in three looks; fixed: long university names on the road are cut, no double
   "outside Kraków" text.

**Open:** `uj-ihs` has no travel data yet (needs a map point and the weekly transport job); no Kraków demand or GUS pay for the 4 new
cards; other sea-related Kraków options (e.g. geography, environmental studies at UJ/AGH) could be added as nearer alternatives.

### v2.7–v3.0 tasks: Studia coverage waves (planned 21 Nov 2026, 15:13)

Card shape, sources and tests are the same as in v2.3 and v2.6 (`studia/data/opportunities.json`, `offers.json`, `sources.json`,
`core/strengths.json`, `tests/run.mjs`). Every new offer: `requires` with subjects, `status`, `sourceId`, official `url` of the course or
recruitment page (item 11), threshold when an official page shows one (otherwise none, never guessed). Every new card: `field` (radar code),
Kraków `demand` with source and GUS 2024 `pay` (as D1/D7), `related`, `experiment`, `dayInLife`. Run `python3 kompas/tools/coverage_radar.py`
at the end and paste the table in "Coverage waves". One task = one commit.

**v2.7 – Wave 1 Data (night of 22 Nov)**
1. **CW0 (Sonnet) Enrolment per field.** Goal: students per field in Poland and in Małopolska (GUS, latest year) written as a table here;
   say if the wave order should change. Files: `BACKLOG.md`, `sources.json` (new source). Check: every number has a source id and a year.
2. [x] **SW1a (Opus) Four cards.** Goal: `prawo` "Prawo i administracja", `architektura` "Architektura i budownictwo" (split from `projektowanie`,
   which keeps interiors and design; move `pk-architektura` and set `related`), `mechanika` "Mechanika, materiały i produkcja",
   `edukacja` "Edukacja i nauczanie" (split from `mowa`, which keeps speech therapy; move teacher paths). Interests, workStyle, values,
   strengths per the existing method; no card gets more than 20 points above its neighbours on any interest. Check: tests pass.
3. [x] **SW1b (Sonnet) Offers, at least 4 per card.** Law and administration: UJ Prawo, UJ Administracja, and other Kraków law or
   administration courses the sources confirm (UAFM, UEK, UKEN: only if listed). Architecture and building: PK Architektura (moved),
   PK Budownictwo, geodesy and cartography, spatial planning, as far as Kraków universities offer them. Mechanics: AGH and PK
   mechanical engineering, materials engineering, production management. Education: UKEN and UJ pedagogy and teacher paths
   (early education, special needs), moved from `mowa`. Add `campus` entries with address and map point (`geocode_schools.py` style) and
   mark travel data as pending for the weekly job. Check: tests pass; each card has 4 or more offers with an http(s) `url`.
4. **SW1c (Sonnet) Demand and pay for the 4 cards** (D1 and D7 method): Kraków job demand with a source, GUS 2024 group and band.
   If no source, leave out and list in the commit message.
5. [x] **SR2.7 (Opus) Review and release v2.7.0:** version in the four places, 375 and 1280 px in three looks on the road view, spec doc
   "Kompas Studia v2.7.0", radar table.

**Done in 2.7.0 (21 Nov 2026, afternoon).** 35 cards, 98 offers.
- Cards: `prawo` (cluster prawo), `architektura` (cluster budowa; `pk-architektura` moved from `projektowanie`), `mechanika` (technika),
  `edukacja` (ludzie; `uken-pedagogika` and `uj-polonistyka-nauczycielska` moved from `mowa`, which is now "Logopedia i terapia mowy").
- Offers (13 new, each with `url` except PK Budownictwo, whose official page was not found in the run): prawo: UJ Prawo, UJ Administracja,
  UEK Prawo, UEK Administracja (+ ZSE1 administracja); architektura: PK Architektura, PK Budownictwo, AGH Budownictwo, UEK Gospodarka
  przestrzenna; mechanika: PK and AGH Mechanika i budowa maszyn, UEK Zarządzanie i inżynieria produkcji, UEK Inżynieria jakości produktu
  (`check`: length not confirmed); edukacja: UKEN Pedagogika, Pedagogika przedszkolna i wczesnoszkolna, Pedagogika specjalna, UJ polonistyka
  nauczycielska. New campus `uj-wpia` (ul. Gołębia 24). 10 new sources (otouczelnie). `tests/syntax.mjs`: every `url` is http(s).
- Radar (Studia): Prawo i administracja 1 → 3, Budownictwo i architektura 1 → 3, Pedagogika i edukacja 3 (4 → 6 items),
  Inżynieria 4 (8 → 12). All 9 personas still pass; A and C now see `edukacja` in their top 3.
- Not done, moved: **CW0** (enrolment per field, GUS) and **SW1c** (Kraków demand and GUS 2024 pay: barometer PDF and GUS tables
  cannot be opened from the run).
  **SW1c done 21 Nov (after 2.8.0):** demand from `korp-krk-2025-12` (GUP Kraków, Dec 2025, Barometr 2026 lists) and `barometr-krk-2026`;
  pay: prawo on `gus-2024` (15876,14 zł, band 3); architektura, mechanika, edukacja keep the 2020 group (no 2024 figure readable; redo with D7). `uj-wpia` and the new campuses wait for the weekly transport job.

**v2.8 – Wave 1 Questions and functionality (night of 23 Nov)**
1. [x] **SQ2a (Opus) Activities and situations for wave 1.** Goal: tap cards reaching the four cards: e.g. "Przeczytać umowę i znaleźć, co jest
   nie tak" (law; a27 already touches rules), "Narysować plan domu i pochodzić po budowie", "Rozebrać maszynę i złożyć ją z powrotem",
   "Wytłumaczyć coś młodszemu dziecku tak, żeby zrozumiało"; 4 to 6 new activities, 1 situation (e.g. a club meeting you must
   run), pictograms in `pictos.js`, strengths if one is missing. Weights as before. Check: tests pass.
2. [x] **SQ2b (Opus) Test kids and reachability.** Goal: personas J, K, L, M, one per new card, each gets "their" card in the top 3; new test
   in `tests/run.mjs`: every card is top 3 for at least one persona and no card is top 3 for more than half of them; old personas keep
   their first card. Old saved files: the notice "N nowych kart" lists only the new ones (as in 2.5). Check: tests pass.
3. [x] **SQ2c (Sonnet) Subjects and declaration helper.** Goal: matura subjects used by the new offers appear in the subject lists
   (WOS, geografia and others as needed); the declaration helper counts the new offers. Check: tests pass; helper output for persona J.
4. [x] **SR2.8 (Opus) Review and release v2.8.0** (radar; Liceum W1L1 `studiaCards` can now point to the new cards).

**Done in 2.8.0 (21 Nov 2026, afternoon).** 40 activities, 8 situations, 13 personas.
- Activities a36 contract or rules (law), a37 house or estate plan (architecture), a38 3D-printed working part (mechanics),
  a39 run activities for younger children (education), a40 make an office or school procedure simpler (administration);
  situation e8 "club meeting about a school pitch" (one answer per wave 1 card). Pictograms for all.
- Personas J (law), K (architecture), L (mechanics), M (education): each has its card **first**.
- New test in `tests/run.mjs`: each own card (F–M) is in its kid's top 3; no card is top 3 for more than half the kids
  (now max 3 of 13: edukacja, projektowanie, media-cyfrowe); 24 of 35 cards reach some top 3.
- Subjects: the new offers use only subjects already in the list (WOS, geografia, historia …); the declaration helper counts them.
- Checked 375 and 1280 px in three looks for J, K, L, M; no errors.

**v2.9 – Wave 2 Data (night of 24 Nov)**
1. **SW2a (Opus) Four cards.** `spoleczenstwo` "Społeczeństwo, polityka i praca socjalna" (sociology, political science, social work, family
   sciences; takes `uj-europeistyka` as `related`, not as home), `nauka` "Nauka i badania" (maths, physics, chemistry, biology, astronomy at
   UJ as a research path; the applied cards stay), `sztuka-scena` "Sztuka, muzyka i scena" (music academy, acting, fine arts; offers
   with `exam: true`: entrance exam or audition, no threshold, shown like the bilingual test tag), `historia` "Historia, kultura i
   dziedzictwo" (history, archaeology, philosophy, ethnology; `historia-sztuki` stays as a neighbour).
2. **SW2b (Sonnet) Offers, at least 3 per card.** Kraków: UJ Socjologia, Politologia, Praca socjalna (UKEN or other, if confirmed), UJ
   Matematyka, Fizyka, Chemia, Biologia, Astronomia; Akademia Muzyczna, Akademia Sztuk Teatralnych, ASP (Malarstwo, Grafika, Rzeźba);
   UJ Historia, Archeologia, Filozofia, Etnologia. Only what the official pages or otouczelnie confirm; audition dates in `next`.
3. **SW2c (Sonnet) Demand and pay** for the 4 cards (as SW1c).
4. **SD5 (Opus) UJ and UJ CM 2026 thresholds** from UJ's own results pages (v3.0 item 5): 22 old offers plus the new UJ offers.
5. **SR2.9 (Opus) Review and release v2.9.0.**

**Done in 2.9.0 (21 Nov 2026, evening).** 39 cards, 112 offers.
- Cards (each with `field`): `spoleczenstwo` (PSY), `nauka` (SCI), `sztuka-scena` (ART), `historia` (HUM).
- Offers (14 new, all with `url` and `field`): społeczeństwo: UJ Socjologia (`check`: subject list cut off in the source), AGH Socjologia,
  UEK Nauki społeczne stosowane; nauka: UJ Fizyka, UJ Astronomia, UJ Chemia, AGH Matematyka (`check`: subjects from the Kraków list);
  sztuka-scena: AST Aktorstwo, Akademia Muzyczna Instrumentalistyka, ASP Malarstwo, all `exam: true` (no threshold); historia: UJ Historia,
  UJ Archeologia (`check`), UJ Etnologia (also on spoleczenstwo), UJ Filozofia.
- New campuses: `uj-grodzka52`, `uj-wh`, `amuz`, `ast`, `asp-wm` (addresses with sources; travel data waits for the weekly job). 15 sources.
- Radar (Studia): Nauki ścisłe 2 → 3 (no longer "shared"), Sztuka 3 (4 → 7 items), Historia 3 (2 → 5), Psychologia i społeczne 3 (4 → 7).
  Below 3 now only Sport, Bezpieczeństwo, Turystyka (wave 3).
- Not done, moved: UJ Politologia and Praca socjalna (requirements not readable in the run), SW2c demand and pay, SD5 UJ thresholds → v2.11.
- Reachability today: `nauka` (G) and `historia` (I, D) reach a top 3; `spoleczenstwo` and `sztuka-scena` wait for their personas in v2.10.

**v2.10 – Wave 2 Questions and functionality (night of 25 Nov)**
1. **SQ3a (Opus) Activities and situations for wave 2:** e.g. "Zbadać, dlaczego ludzie się dzielą, i napisać o tym raport" (society),
   "Zrozumieć dowód z matematyki albo prawo fizyki" (science), "Przygotować występ i zagrać go przed ludźmi" (stage, may reuse a25),
   "Przeczytać stare dokumenty i ułożyć z nich historię" (history); 4 to 6 activities, 1 situation, pictograms, a strength if needed.
2. **SQ3b (Opus) Test kids and reachability** for the 4 cards (personas N, O, P, Q), same tests as SQ2b; check that personas A–M keep their
   first card.
3. **SQ3c (Sonnet) Entrance-exam tag** on offers with `exam: true` (card, road, compare table): "egzamin wstępny albo przesłuchanie",
   no points gap. Check: 375 and 1280 px.
4. **SR2.10 (Opus) Review and release v2.10.0.**

**Done in 2.10.0 (21 Nov 2026, evening).** 45 activities, 9 situations, 17 personas.
- Activities a41 inequality talks (society), a42 why nature works, atom to stars (science), a43 daily practice for the stage (stage arts),
  a44 archive documents, what really happened (history), a45 help someone find the right office or organisation (social work);
  situation e9 "school's 100th anniversary open day" (one answer per wave 2 card). Pictograms for all.
- Personas N (society), O (science), P (stage), Q (history): each has its own card **first**; A–M unchanged. 28 of 39 cards reach a top 3,
  max 4 of 17 kids per card.
- Entrance exam (SQ3c): one wording for all `exam: true` offers, "egzamin wstępny albo przesłuchanie" (was drawing and portfolio only),
  in the offer badge, the plan step and the compare table's threshold row ("decyduje egzamin" on the road).
- Checked 375 and 1280 px for N–Q, no script errors. Still open from v2.9: UJ Politologia, Praca socjalna, demand and pay, UJ thresholds.

**v2.11 – Wave 3 Data (night of 26 Nov)**
1. **SW3a (Opus) Three cards:** `zywienie` "Żywienie i dietetyka" (dietetics, food technology), `weterynaria` "Weterynaria, zwierzęta i rolnictwo"
   (UR Kraków: veterinary medicine, agriculture, horticulture, forestry, animal husbandry), `geografia` "Geografia, przestrzeń i planowanie"
   (geography, spatial planning, geoinformation). Thin cards: add the missing Sport and Turystyka offers (AWF and UEK courses, 3 or more each).
2. **SW3b (Sonnet) Offers** as above; **SW3c (Sonnet)** demand and pay.
3. **SR2.11 (Opus) Review and release v2.11.0.**

**Done in 2.11.0 (21 Nov 2026, evening).** 42 cards, 124 offers.
- Cards: `zywienie` (MED), `weterynaria` (BIO), `geografia` (BUD; `uek-gospodarka-przestrzenna` also points to it).
- Offers (12 new, all with `url` and `field`): UJ Dietetyka (`check`: campus), URK Dietetyka, URK Technologia żywności (`check`: length);
  URK Weterynaria (5,5 roku), Zootechnika, Rolnictwo; UJ Geografia i gospodarka przestrzenna, UKEN Geografia (`check`), UJ Geologia
  (`check`: second subject cut off); AWF Turystyka i rekreacja, Turystyka przygodowa (`check`), Trener zdrowia i sprawności fizycznej (`check`).
- New campus `uj-wgg` (ul. Gronostajowa 3a); URK offers use the main URK address for now. 13 sources.
- Radar (Studia): every field at level 3 or 4 (Sport 2 → 3, Turystyka 2 → 3, Budownictwo 4 → 7 items). Liceum still has
  Bezpieczeństwo and Turystyka at 1 (Liceum waves, Part 1).
- Not done: demand and pay for wave 2 and 3 cards; SD5 UJ thresholds (UJ results pages not opened in this run) → v3.0 list.

**v2.12 – Wave 3 Questions and functionality (night of 27 Nov)**
1. **SQ4a (Opus)** activities (cooking and nutrition, animals and plants already a26 and a29: check reach; maps and places), 1 situation,
   pictograms; **SQ4b (Opus)** test kids R, S, T and the reachability test for all cards (now about 43): none unreachable, none always on top.
2. **SR2.12 (Opus) Review and release v2.12.0.**

**Done in 2.12.0 (21 Nov 2026, evening).** 49 activities, 10 situations, 20 personas.
- Activities a46 read labels and plan a healthy week of meals (nutrition), a47 help with animals in a shelter, stable or vet (veterinary),
  a48 read maps and see why a city grows where it does (geography), a49 lead a group on a mountain trail or run a tent camp (tourism, sport);
  situation e10 "class week on a farm near Kraków" (food, animals, map and trails, evening programme). Pictograms for all.
- Personas R (nutrition), S (veterinary), T (geography): each has its own card **first**. C ("lubi wszystko") now starts with `zywienie`
  (same health group as before).
- Reachability: 32 of 42 cards are in some test kid's top 3; max 5 of 20 per card. **Not in any top 3 yet (for v3.0):** dane-medyczne,
  energetyka, jezyki, medycyna, obronnosc, pielegniarstwo, psychologia, sluzby, sport, woda. These are older cards without their own test kid,
  not cards that cannot be reached; v3.0 adds kids for them or explains why not.

**v3.0 – Coverage review (night of 28 Nov)**
1. [x] **SR3.0 (Opus):** radar at level 3 everywhere (or a written reason), spec doc section "Kompas Studia v3.0.0", declaration helper and star
   comparison checked with the new cards at 375 and 1280 px, "Kompas Studia v3.0.0"; tell Szymon with the radar table. Then the UI/UX items
   (v3.1–v3.3) in the order given above.

**Plan for v3.0 (planned 21 Nov 2026, night run; coded by the 22:45 task).** State before: 2.12.0 pushed; radar has every Studia field
at level 3 or 4 (Bezpieczeństwo and Turystyka are at 1 only in Liceum: Liceum waves, not this release); tests pass; 42 cards, 124 offers,
49 activities, 10 situations, 20 test kids; 32 of 42 cards reach a top 3. Open from the waves: 10 cards in no top 3; 12 cards with no
`demand` and no `pay`; UJ Politologia and Praca socjalna; 11 offers with `status: "check"`; SD5 UJ thresholds. This release closes them
and adds **no new cards, no new screens and no look changes** (UI/UX waits for v3.1). Order: SR3b and SR3c (data) → SR3a → SR3d → SR3.0.
One task = one commit; `git pull --rebase` before each push (Liceum may push the same night).

1. [x] **SR3a (Opus) Every card reaches a top 3.** Cards with no top 3 today: `dane-medyczne`, `energetyka`, `jezyki`, `medycyna`, `obronnosc`,
   `pielegniarstwo`, `psychologia`, `sluzby`, `sport`, `woda`. Add one test kid per card in `personas.json` (ids U, V, W, X, Y, Z, AA, AB,
   AC, AD; taps only: activities, situations, strengths, sliders; a short neutral label like "lubi pomagać chorym", no personal data).
   Each kid gets its card **first or top 3** with a fair answer set (answers a real kid with that interest would tap, not every card's
   one weird answer). If a card cannot get there, fix the weights first (at most ±10 on that card's own interests; no card more than
   20 points above its neighbours on any interest, the SW1a rule); do not add new questions; if still impossible, write the reason here.
   Then make the test in `tests/run.mjs` strict: **every** card (42 of 42) is top 3 for at least one kid; no card top 3 for more than half
   of the kids; A–T keep their current first card (list them in the test so a weight change cannot move them silently).
   Check: `node kompas/tests/run.mjs` says "42 of 42 cards"; the most frequent card stays at or under 5 of 30 if possible (write the number).
2. [x] **SR3b (Sonnet) Demand and pay for the cards that have none:** `media-cyfrowe`, `morze`, `lotnictwo`, `turystyka`, `historia-sztuki`,
   `spoleczenstwo`, `nauka`, `sztuka-scena`, `historia`, `zywienie`, `weterynaria`, `geografia` (and `demand` for `inz-biomed`).
   Demand: the Kraków lists already in `sources.json` (`barometr-krk-2026`, `korp-krk-2025-12`), same wording as SW1c. Pay: GUS 2024
   group and band (`gus-2024`) when the table shows a figure for the group; otherwise the 2020 group as for `architektura` (D7 method).
   Never a guessed band. A card with no source stays without the field; list those in the commit message and here.
   Check: `node kompas/tests/syntax.mjs` (every source used, every `sourceId` resolves).
3. [x] **SR3c (Sonnet) Close the open offers.**
   a) New offers for `spoleczenstwo`: **UJ Politologia** and **UJ Praca socjalna** (if UJ does not run praca socjalna in 2027, take UKEN
      or another public Kraków university that lists it). Each: `requires` from the official recruitment page (rekrutacja.uj.edu.pl or the
      university's own page) or otouczelnie, `status`, `sourceId` (new source with `asOf`), official `url`, `field: "PSY"`, `campus`
      (existing UJ campus if the address matches, otherwise a new one with address and source, travel marked pending), no threshold
      unless an official page shows one. The radar reads `field`; if an offer has none, add it to the mapping in
      `kompas/tools/coverage_radar.py`.
   b) Re-check the 11 offers with `status: "check"`: `ur-woda`, `uek-jakosc`, `uj-socjologia`, `agh-matematyka`, `uj-archeologia`,
      `uj-dietetyka`, `urk-technologia-zywnosci`, `uken-geografia`, `uj-geologia`, `awf-turystyka-przygodowa`, `awf-trener`, against the
      official page (subjects, length, campus). Confirmed → `sourced` with the new source; not confirmed → stays `check` with the reason
      in the commit message. Also find the official `url` for `pk-budownictwo`.
   Check: tests pass; radar re-run (Psychologia i nauki społeczne should go from 7 to 9 items).
4. [x] **SR3d (Opus, time box 20 min) SD5 UJ and UJ CM 2026 thresholds.** From UJ's results pages, or the otouczelnie "progi UJ 2026" page
   (same way as `otou-agh-progi-2026`). Only offers with a number on the page; store `year`, `points`, `max`, `round`, `sourceId` as for
   AGH (UJ points scale may differ: copy the page's maximum, never convert). If no page opens in the time box, move SD5 to v3.2 (it
   feeds the points estimate, item 8) and write that here.
5. [x] **SR3.0 (Opus) Review and release 3.0.0** (Szymon's text above, plus): radar re-run and the new table pasted in "Coverage waves" as
   "v3.0 result (Studia)" with the fields that moved; declaration helper output for 3 of the new kids; star and compare one offer from each
   wave (prawo, sztuka-scena with the exam tag, weterynaria) at 375 and 1280 px in three looks, no script errors; `node kompas/tests/liceum.mjs`
   still passes; version 3.0.0 in the four places; release table row v3.0 → pushed; "Major goals": waves done, next = v3.1 UI/UX
   (items 10, 7, screen part of 11); spec doc section "Kompas Studia v3.0.0" (Claude Docs); push to main.

**Done in 3.0.0 (21 Nov 2026, night).** 42 cards, 126 offers, 30 test kids.
- SR3a: test kids U–AD (dane-medyczne, energetyka, jezyki, medycyna, obronnosc, pielegniarstwo, psychologia, sluzby, sport, woda), taps only.
  Each has its card **first**; no weight change was needed. `tests/run.mjs` is strict now: 42 of 42 cards in some top 3, no card above
  half, A–AD keep their first card (listed in the test). Most frequent: `zywienie` 6 of 30 (X and AA have it third; could not get to 5
  with fair answers), `edukacja` 5.
- SR3b: Kraków demand for all 13 cards from `barometr-krk-2026` (deficit and surplus checked against the KORP Dec 2025 lists).
  **Pay not added** for media-cyfrowe, morze, lotnictwo, turystyka, historia-sztuki, spoleczenstwo, nauka, sztuka-scena, historia,
  zywienie, weterynaria, geografia: GUS 2024 Tablica 5 (xlsx) could not be opened and `gus-2020` has no figure for these groups.
  Moved to v3.1 (with the rest of item 6).
- SR3c: new offers UJ Politologia (`uj-insp`, ul. Reymonta 4) and UKEN Praca socjalna (`uken-izss`, os. Stalowe 17; UJ runs praca
  socjalna only as II stopnia). 10 of 11 `check` offers now `sourced` (official AGH, UEK, UKEN, AKF pages; otouczelnie 2026/27 for UJ
  and URK). Still `check`: `uj-dietetyka` (run by Wydział Lekarski UJ CM, place of classes not confirmed). `pk-budownictwo` has its `url`.
  AWF Kraków is now called Akademia Kultury Fizycznej (AKF); offers say so, the campus name stays for now. 8 superseded sources removed.
  The two new campuses wait for the weekly transport job.
- SR3d: **no 2026 UJ thresholds found** (otouczelnie and others show 2025/26 only; UJ pages refuse automated reading). SD5 moves to v3.2
  (it feeds the points estimate, item 8).
- SR3.0: radar table above ("v3.0 result"); declaration helper for X, AA, W; star and compare uj-prawo, ast-aktorstwo (exam tag),
  urk-weterynaria, uj-politologia at 375 and 1280 px in three looks: no page errors, nothing wider than the screen. Liceum tests pass.

**Not in v3.0 (moves to v3.1, decided by the planner unless Szymon says otherwise):** official `url` for the 86 older offers that have none
(item 11 data, done with its screen part in v3.1, Sonnet); GUS 2024 pay for the old cards still on `gus-2020` (item 6 rest, v3.1 Sonnet).

### Ukrainian version (set by Szymon 24 Nov 2026, 15:45; top priority, releases v3.1–v3.6)

> **Renumbered 24 Nov 2026 (17:19), English added.** v3.4 is now **English** (done, `?lang=en`). Wherever the Ukrainian section below says v3.4 read **v3.5** (cards in Ukrainian), v3.5 = **v3.6** (offers), v3.6 = **v3.7** (Ukraine data stream); the UI/UX plan v3.7/v3.8/v3.9 is now **v3.8/v3.9/v3.10**. Cards, offers and universities stay Polish in every language until their own release (Szymon: "by default polish ... for now").

**Goal.** A Ukrainian-speaking teenager can do the whole Studia flow (taps, story, Kierunki, report, file) in Ukrainian, and can see which
Kraków studies connect to Ukraine. Szymon's order: **(1) the main UI, (2) the questions, (3) courses and university descriptions,
(4) a data stream** that finds universities with an education or a dedicated diploma related to Ukraine. Thresholds and pay wait for v4.0.
Liceum is not part of this track (its own Ukrainian task I1/I2 stays in Part 1 and reuses what v3.1 builds).

**Decisions taken by the planner (safest reading; Szymon can change any of them, tell the planner in the plan message):**
- **UK-A One app, two languages.** A switch PL | UA in the header and a link `?lang=ua`; no second app. Polish stays the single source of
  truth for facts. Ukrainian is an **overlay**: UI texts in `studia/i18n/pl.json` and `ua.json` (key → text); data texts in
  `studia/i18n/ua/*.json` keyed by the same ids as the Polish data (only the text fields). A missing Ukrainian text falls back to Polish
  (never to an empty field), and a test prints how many are missing.
- **UK-B Polish names stay visible.** **University names stay in Polish, not translated, in every language (UA and EN; Szymon, 24 Nov 2026 evening).** Studies, exam and recruitment terms are written in Ukrainian with the official Polish
  name in brackets, for example "Ягеллонський університет (Uniwersytet Jagielloński)", because every recruitment page is in Polish.
  Addresses, links and source titles are not translated.
- **UK-C The language lives in the saved file** (`lang`); an old file without `lang` opens in Polish; the exported file and the report
  use the chosen language; loading never changes the answers (they are ids).
- **UK-D Reader.** A Ukrainian-speaking teenager who goes through the Polish school system, so the matura route stays as it is. The route of a
  newcomer with a Ukrainian school certificate (recognition, Polish language level) is a separate information page in v3.6 (UK-D3),
  **not** part of the scoring.
- **UK-E Who wrote the Ukrainian.** Claude, not a native speaker. Simple words for a 14–18-year-old (as Liceum I2). The footer says so
  ("Переклад зроблено за допомогою ШІ і ще не перевірений носієм мови") until a native speaker has read it; `tools/i18n_review.py`
  makes a two-column sheet (Polish | Ukrainian) for that reader, and `i18n/REVIEWED.md` lists what has been read and by when.
- **UK-F Fixed terms.** One glossary file (`studia/i18n/glossary.json`: matura, rozszerzenie, próg punktowy, rekrutacja, IRK, deklaracja,
  kierunek, licencjat …, each with one Ukrainian wording and one short explanation). Every translation uses it; the glossary page (v3.2)
  shows it.
- **UK-G New text rule (from v3.1 on).** Every new user-facing text goes through `t()` and has a Ukrainian string in the same release;
  the key-parity test fails otherwise. Plural forms use the shared helper (Polish and Ukrainian both have three forms, with different rules).
- **UK-H Agents.** Translation tasks are for **Sonnet** subagents (cheap, good at Ukrainian), always given the glossary and the Polish
  original; Opus reviews and fixes. (The 22/23 Nov night runs failed with "usage limit reached"; a lighter plan per night helps.)

**Facts found on 24 Nov 2026 (so the planner does not rediscover them).**
- `studia/fonts` has only **latin and latin-ext** files of Inter, Fraunces and JetBrains Mono: Ukrainian text would silently fall back to
  system fonts. Inter and JetBrains Mono have Cyrillic; **Fraunces has none**. The pop look uses Fraunces for headings
  (`skin-pop.css` line 30, `v11.css` line 53); neon uses Inter and the mono font in capitals.
- Polish text in code: `app.js` 306 lines, `story.js` 53, `index.html` 13, `illus.js` 6 (text inside the SVG illustrations),
  `core/scoring.js` 41 and `core/export.js` 29 (shared with Liceum: Liceum imports only `provenStrengths` and `parseSaved`).
- Data text: `opportunities.json` 79 KB (42 cards), `offers.json` 81 KB (126 offers), `questions.json` 17 KB, `scenarios.json` 3 KB,
  `core/strengths.json` 3 KB, `core/dimensions.json` 1 KB. Test kids (`personas.json`) are not translated.
- Existing Ukraine links: card `ukraina` ("Odbudowa Ukrainy i współpraca", languages `uk`, `en`) with two offers (`uj-filologia-ukrainska`,
  `uj-europeistyka`); the scenario "Pokój w Ukrainie…"; language code `uk` on cards.

**v3.1 – UK-1a Foundation: DONE 24 Nov 2026 (3.1.0).** The language code is **`ua`** (Szymon, 24 Nov 2026): file names `ua.json`, `studia/i18n/ua/`, `?lang=ua` (`?lang=uk` is accepted and turns into `ua`), the switch reads PL | UA; only `<html lang>` says `uk`. The card data language code `uk` is unchanged.
What shipped: `core/i18n.js` (t, plural, setLang, getLang, loadDict); all Polish text of `studia/app.js`, `story.js`, `illus.js`, `index.html` (`data-i18n`, `data-i18n-attr`) in `studia/i18n/pl.json` (682 keys) and of `core/scoring.js` and `core/export.js` in `core/i18n/pl.json` (164 keys; Liceum loads that file too, its behaviour is unchanged); switch with `?lang=ua`, `<html lang>`, title and meta description, `lang` saved in the file and restored on load; Cyrillic fonts (Inter 400/600, JetBrains Mono 500, Source Serif 4 as the Cyrillic heading face of Fraunces, OFL, all local); tests: `tests/snapshot.mjs` (Polish export and result hashes for 30 kids), `tests/ui_text.py` (Polish text of 18 screens x 3 kids; proved byte-identical to 3.0.0 before the version bump), i18n key checks in `tests/syntax.mjs` (every `t()` key exists, no unused key, ua keys subset of pl, strict parity once `ua.json` has keys; fragment files not allowed), `tests/_i18n.mjs` loads the dictionaries for node tests.
Notes for v3.2: `ua.json` is an empty stub, so `?lang=ua` still shows Polish text everywhere except the switch (fallback works, no errors). New helpers `langName(code)` and `whereLabel(value)` in `core/scoring.js`; `LANG_NAMES` values are getters. Places that show stored Polish identifiers (language levels, sports, WHERE places, robustness levels `wysoka`/`średnia`/`niska`) go through lookup keys: check them on every screen when translating. Plural rule (`plural()`) equals the Polish and Ukrainian rule; two known edge cases where the old Polish ternaries and the rule differ (0 areas, 22-24 areas) do not occur in the data. Compare `tests/ui_text.py` output with `UI_LANG=ua python3 kompas/tests/ui_text.py` (dumps to /tmp) to find Polish text left on a Ukrainian screen. The "Wczytano plik" notice sits under the sticky bar on the results page (older issue, not from this release).
Original task list for v3.1 (all done):
1. **UK1a (Opus) `kompas/core/i18n.js`.** `t(key, params)` with `{name}` placeholders, `setLang`, `getLang`, `plural(n, {one, few, many})` with
   the Polish and the Ukrainian rule, fallback to Polish. No network call (the files are fetched like the other data files). Used by
   Studia now and by Liceum later.
2. **UK1b (Opus) Texts out of the code.** Move every user-facing text of `studia/app.js`, `story.js`, `index.html`, `illus.js` and the Polish
   sentences produced in `core/scoring.js` and `core/export.js` into `studia/i18n/pl.json` (core functions return a key and params, or get
   `t`; Liceum's two imports must keep working and `node kompas/tests/liceum.mjs` must pass). Do it screen by screen, one commit per file.
   **Safety net first:** before touching anything, add a test that builds the markdown export and the declaration helper text for kids A–AD
   and compares with a stored snapshot (`tests/snapshots/pl-export.json`); after the refactor the Polish output must be identical.
3. **UK1c (Opus) Switch and file.** PL | UA switch in the header (two chips, 44 px high), `?lang=ua`, `<html lang>` set, `lang` in the saved file
   (`blank()`, `parseSaved`), loading keeps the language, document title translated.
4. **UK1d (Opus) Cyrillic fonts.** Add Cyrillic files next to the others (from the `@fontsource` packages on npm: Inter 400/600 and
   JetBrains Mono 500 cyrillic; one serif with Cyrillic and an open licence for headings in the pop look, for example Source Serif 4 or
   Literata), `@font-face` with `unicode-range`, licence files in `studia/fonts`, files stay local (no runtime network).
   Check headings in the default, pop and neon looks with a Ukrainian test string.
5. **UK1e (Opus) Keys for tests.** `tests/syntax.mjs`: `pl.json` and `ua.json` have the same keys (uk may be a stub in this release), no key is
   unused, every `t('…')` in the code exists in `pl.json`.
   Check: tests pass; Polish export snapshot unchanged; `?lang=ua` opens without errors (Polish text shows where Ukrainian is missing);
   click-through at 375 and 1280 px in three looks; Liceum tests pass. Version 3.1.0 in the four places and `dataVersion`.

**v3.2 – UK-1b Main UI in Ukrainian: DONE 24 Nov 2026 (3.2.0).** `studia/i18n/ua.json` (689 keys) and `core/i18n/ua.json` (164 keys) are complete and checked: strict key parity, same `{placeholders}` and HTML tags as Polish, no Polish letters outside brackets (`tests/syntax.mjs`). Translated by four Sonnet helpers with `studia/i18n/glossary.json` (25 terms, UK-F), reviewed by Opus for consistency (chapter names, terms). Footer AI notice and a glossary page "Словничок" (`#/slownik`, footer link) show in Ukrainian only. `plural()` now follows each language's rule (Ukrainian "one" = 1, 21, 31…) and a language may add `key.other` for fractions (`2,5 року`). `tools/i18n_review.py` writes `studia/i18n/review-ua.md` (Polish | Ukrainian | correction, for a native reader: Szymon's wife or Gemini); `studia/i18n/REVIEWED.md` is the log of what was read. Polish UI checked byte-identical to 3.1.0 on 54 screens; no horizontal overflow at 375 px in the three looks (the scrolling menus scroll as in Polish).
Still Polish in `?lang=ua` (data, comes in v3.3 to v3.5): question and answer texts, option labels (certainty, study length, reach), strength and dimension names, scenario texts, card and offer texts, institution names. Open wording questions from the translators for the reader: «післясередня школа (szkoła policealna)» is a coinage; «Міст» for the card "Most"; the line about EU citizens in the Germany note may not apply to every reader; "bl." abbreviation «бл. 15 хв».
Original task list for v3.2 (all done):
1. **UK2a (Sonnet, brief with glossary) `ua.json`** for all keys of `pl.json` (about 440 lines): story page, parts, buttons, notices, report,
   errors, file messages, plural forms, footer line (UK-E). Simple words; terms as in the glossary; no word-for-word Polish.
2. **UK2b (Opus) Glossary page** "Словничок" (footer link, same pattern as the sources page): matura, rozszerzenie, próg, rekrutacja, IRK,
   deklaracja maturalna, kierunek, licencjat, magister… each with the Polish term in brackets and one short explanation.
3. **UK2c (Opus) Layout.** Ukrainian words are about 10–15 % longer. Check 375 px, three looks: buttons, chips, the road, tables, the compass
   (the SVG text uses the `wrap` helper by number of characters: test with the longest Ukrainian strengths), the neon capitals.
4. **UK2d (Sonnet) `tools/i18n_review.py`** writes `i18n/review-uk.md`: a table with key, Polish, Ukrainian for a native reader; and
   `i18n/REVIEWED.md` (empty list of what was read).
   Check: key parity strict; no Polish letters (ą ć ę ł ń ó ś ź ż) in `ua.json` values except inside brackets or in the glossary
   (test with a short allow-list); `?lang=ua` shows no Polish UI text on the 12 screens; export and report in Ukrainian;
   375/1280 px, three looks, no script errors. Release 3.2.0.

**v3.3 – UK-2 Questions in Ukrainian: DONE 24 Nov 2026 (3.3.0).** Overlay files `studia/i18n/ua/{questions,strengths,dimensions,scenarios}.json` (same shape as the Polish data, only text fields, items matched by `id`) laid over the Polish data by `core/overlay.js`; missing texts stay Polish. In the app: `applyDataLang()` (on start, on language switch, on file load). Translated by four Sonnet helpers (49 activities, 10 situations with 4 answers each, certainty, study length, private/public, languages, 5 doubts with their answer cards, 3 reflection prompts with taps, 19 strengths with proofs in the present tense, interests/work-style/values, scenarios, forces, sectors) plus `subjectNames` (12 matura subjects) and `placeNames` (reach screen) written by Opus. Stored Polish identifiers (subjects, places) are shown through `nm('subject'|'place', id)` in `core/i18n.js`; answers and the saved file still hold the Polish ids, so a file made in one language opens in the other. Strict test in `tests/syntax.mjs`: every text field of every item has a Ukrainian text, no Polish letters outside brackets, forces keep their numbers, no overlay item without Polish original. `tools/i18n_review.py` now lists 270 data texts too (`review-ua.md`). Polish UI byte-identical to 3.2.0 on 54 screens; scoring unchanged (Polish snapshot of 30 kids).
Still Polish in `?lang=ua` (v3.4 and v3.5): card names and texts, offer and university names, source titles; the kid's own typed answers stay as typed.
Open wording for the reader: «установа» for «urząd»; «АЕС запізнюється» for «atom spóźniony»; «Лавірування» as a scenario name; «ВДЕ» for OZE.
Original task list for v3.3 (all done):
1. **UK3a (Sonnet) `studia/i18n/ua/questions.json`:** 49 activities, 10 situations with all answers, certainty, subjects (matura subjects with
   Polish name in brackets), languages and levels, doubts, reflection prompts, neededWhere, homePlaces, studyLength, privateOk.
2. **UK3b (Sonnet) Strengths and dimensions:** `core/strengths.json` (19 names and examples) and `core/dimensions.json` as overlay files
   (`studia/i18n/ua/strengths.json`, `dimensions.json`); `scenarios.json` (scenarios, forces, sectors, shrinking) as `uk/scenarios.json`.
3. **UK3c (Opus) Wiring and review.** The app reads the overlay when `lang=uk` (a small `tr(kind, id, field)` helper next to `t()`, falling
   back to Polish); review all Sonnet text against the glossary; the text inside `illus.js` illustrations goes through `t()` (UK1b).
   Check: test "every activity, situation, strength, dimension and scenario has a Ukrainian text" (strict in this release); personas results
   unchanged (scoring does not use text); `?lang=ua` through the whole question flow at 375 px; the long answers do not break the tap cards.
   Release 3.3.0.

**v3.4 – UK-3a Directions (cards) in Ukrainian.**
1. **UK4a (Sonnet, 3 batches of 14 cards) `studia/i18n/ua/opportunities.json`** keyed by card id: name, roles, whoYouHelp, whatYouGet, whyNeeded,
   dayInLife (3), growth (3), experiment, robustnessNote, demand text. The numbers and labels (demand level, force names, robustness
   A/B/C) use the glossary or `ua.json`.
2. ~~**UK4b**~~ **Dropped by Szymon (24 Nov 2026 evening): university names stay Polish in every language.** Old text: **UK4b (Sonnet) `studia/i18n/ua/institutions.json`:** about 25 universities and schools: Ukrainian name + official Polish name (rule UK-B),
   short forms used on the road (`shortInst` in `app.js`).
3. **UK4c (Opus) Wiring and review** (as UK3c); card names in the report, the compass, Kierunki and the compare table.
   Check: strict test "every card and institution has a Ukrainian entry"; no overlay id missing in the base data (rename safety);
   Polish snapshot unchanged. Release 3.4.0.

**v3.5 – UK-3a Directions (cards) in Ukrainian: DONE 24 Nov 2026 (3.5.0).** `studia/i18n/ua/opportunities.json` (42 cards: name, roles, whoYouHelp, whatYouGet, whyNeeded, demand text, dayInLife, growth, experiment, robustnessNote, GUS group as "Ukrainian (Polish)") written by three Sonnet helpers (14 cards each) and reviewed by Opus (fixes: "ШІ" instead of "AI" as in the footer, "Служби і рятувальна справа", "Програмування і ШІ", two wordings). Loaded **only for `?lang=ua`** (`applyDataLang()` lays it over `dataPl.opportunities`); English and Polish keep the Polish cards (English UI text checked identical to 3.4.0 on 54 screens). University names untouched (test). New strict test in `tests/syntax.mjs`: every card has every text field, list lengths and numbers equal, no Polish letters outside brackets and university names, no text left identical to Polish, no ids/codes in the overlay, no university name changed, card names not too long, no `en/opportunities.json`. `tests/snapshot.mjs` (V0) and `tests/ui_text.py` now ignore the version number, so a version bump no longer breaks them. Small fix: the strength line on the "mocne" screen showed the stored Polish place ("w językach") in Ukrainian; it now goes through `whereLabel` (Polish unchanged). Layout: `?lang=ua` at 375 and 1280 px in three looks, cards, compass, results: nothing wider than the screen, no script errors. Radar unchanged. `review-ua.md` now lists 862 data texts (cards included).
Open wording for the reader (cards): «парамедик» for «ratownik medyczny»; «медбрат» for «pielęgniarz»; «мундирні служби»; «у рівновазі» for demand «w równowadze»; «радник-юрист (radca prawny)»; «призначений вчитель (nauczyciel mianowany)»; «громада» for «gmina»; «група продовженого дня» for «świetlica».
Still Polish in `?lang=ua` (v3.6): offer names and notes, `requires` text, next steps; university names stay Polish for good.

**v3.5 concrete plan (planner, 24 Nov 2026 evening; this is the "v3.4 – UK-3a" list above, renumbered). Set `3.5.0`. All tasks done (V0 [x], V1 [x], V2 dropped, V3 [x], V4 [x], V5 [x]).**
State before: 3.4.0 pushed (English). Tests on 24 Nov: `syntax.mjs`, `run.mjs` (42 of 42 cards in a top 3), `liceum.mjs` and
`ui_text.py` (54 screens unchanged) pass; radar unchanged. **`snapshot.mjs` fails (30 kids, `md` only)**: the only difference is the
version line (`Wersja: v3.4.0`, `"version": "3.4.0"`), because the hashed export contains `appVersion` and 3.4.0 did not refresh the
snapshot. Not a real Polish change (checked with a diff of kid A against 3.3.0).
Size: one session, about 1.5 h, light (the 22/23 Nov runs hit the usage limit). Order: V0 → V1 (three Sonnet helpers in parallel) → V3 → V4 → V5 (V2 dropped). All must be in. Cards, offers and universities stay **Polish in English** (`?lang=en` must not change).
Scope of this release: card texts in Ukrainian; university names stay Polish. Not here: offer names, `requires.note`, `next` (v3.6), campus
names and addresses (stay Polish, UK-B), source titles (never translated).

- [x] **V0 (Opus, 10 min) Snapshot without the version.** In `tests/snapshot.mjs` hash the export with the version line and the
  `"version"` field replaced by a fixed text (so every version bump does not break it), then `--update` once and check that the
  `result` and `decl` hashes did not move. Commit "Kompas Studia v3.5 V0: Polish snapshot ignores the version number".
  Check: `node kompas/tests/snapshot.mjs` says "Polish snapshot unchanged (30 kids)".
- [x] **V1 (Sonnet x3, in parallel; Opus reviews) `studia/i18n/ua/opportunities.json`.** Same shape as `studia/data/opportunities.json`,
  items matched by `id`, only text fields: `name`, `roles`, `whoYouHelp`, `whatYouGet`, `whyNeeded`, `demand.text`, `dayInLife` (3),
  `growth` (3), `experiment`, `robustnessNote` (16 cards), `pay.group` (30 cards). Not: `id`, `cluster`, `force`, `values`, `strengths`,
  `related`, `languages`, `field`, `demand.level`, `robustness`, any `sourceId` (ids and codes stay as they are).
  Batches by position in the file: cards 1–14, 15–28, 29–42; each helper writes its own part file in the scratch folder and Opus joins
  them into one file (no fragment files in the repo, `syntax.mjs` forbids them). Brief for each helper: the Polish original of its
  14 cards, `studia/i18n/glossary.json`, the rules UK-B/UK-E/UK-F, "simple words for a 14–18-year-old, no grading tone, keep every
  number and the word Kraków, list lengths stay the same, university names stay exactly as in Polish (never translated), exam terms as in the glossary".
  Card names must stay short (they sit on the compass, the road and chips): at most about 1.3 x the Polish length.
  Check: list lengths equal; numbers equal (reuse the force-number check idea); no Polish letters outside brackets.
- **V2 dropped (Szymon, 24 Nov 2026 evening): university names stay in Polish in every language, not translated (also not in English).** No `institutions.json`; `institution` and `shortInst()` stay as they are. Test in V3: the Ukrainian card overlay must not change any university name that appears in a card text.
- [x] **V3 (Opus) Wiring.** In `studia/app.js` the startup loader asks for `opportunities` **only for `ua`** (no 404 for
  `en`); `applyDataLang()` lays `ua/opportunities.json` over `dataPl.opportunities` with `overlay()`. Offers and university names are
  not touched (they stay Polish). Polish and English get `dataPl` unchanged. Check that card names in the compass (`story.js` `sceneSvg`, `wrap` helper), Kierunki road
  (text is cut at 46 characters: check it does not cut inside the bracket badly), compare table, report and the markdown export show
  Ukrainian. Scoring uses ids only; if anything in `core/scoring.js` compares card or institution names, stop and keep Polish there.
  New user-facing text (if any, for example a hint "назви університетів також польською") goes through `t()` with a string in
  `pl.json`, `ua.json` **and** `en.json` (rule UK-G).
  Tests in `tests/syntax.mjs` (strict, same pattern as lines 120–146): every card has a Ukrainian entry with all the text fields above;
  no overlay id that is not in the Polish data (rename safety); no Polish letters outside brackets and outside university names
  (allow-list: the `institution` strings of `offers.json`). `tools/i18n_review.py`: add the card texts to `review-ua.md`.
- [x] **V4 (Opus, 15 min) Layout check.** `?lang=ua` at 375 and 1280 px, three looks (none, `?skin=pop`, `?skin=neon`): compass with the
  longest Ukrainian card names, a card detail, the Kierunki road and panel, compare table, report. No line wider than the screen, no
  script errors. Also open `?lang=en` once: cards still Polish, no errors.
- [x] **V5 (Opus) Review and release 3.5.0.** Read the Sonnet text against the glossary (terms the same in all three batches, for example
  the card names that also appear in the questions); run `snapshot.mjs`, `syntax.mjs`, `run.mjs`, `liceum.mjs`, `ui_text.py` (Polish 54
  screens unchanged) and also `UI_LANG=en python3 kompas/tests/ui_text.py` against 3.4.0 if easy (English must not change); radar re-run
  (should not move). Version 3.5.0 in the four places (search "3.4.0" in `kompas/studia`), then `node kompas/tests/snapshot.mjs`
  again (after V0 it must still pass). `REVIEWED.md`: one line "cards, written by AI, not yet read". Release table row
  v3.5 → done; short "Kompas Studia v3.5.0" section in the spec doc (Claude Docs). One task = one commit; `git pull --rebase` before
  pushing.
Decided by Szymon (24 Nov 2026 evening): university names, full and short, stay in Polish in every language.

**v3.5 – UK-3b Studies (offers) in Ukrainian.**
1. **UK5a (Sonnet, 3 batches of about 42 offers) `studia/i18n/ua/offers.json`** keyed by offer id: study name (rule UK-B: Ukrainian with the
   Polish name in brackets in the detail view), `requires.note`, `next`, any other note shown to the kid. Source titles and links stay as they are.
2. **UK5b (Opus) Subject names everywhere:** the declaration helper, compare table, `requires` text, plan steps and export use the Ukrainian
   subject names (matura subjects from UK3a); the "exam or audition" wording of arts offers; status labels ("do sprawdzenia").
3. **UK5c (Opus) Review** (as UK3c) and the review sheet updated (`tools/i18n_review.py` includes data text).
   Check: strict test "every offer has a Ukrainian entry"; star, compare and declaration helper in Ukrainian for 3 kids at 375 and 1280 px,
   three looks; Polish snapshot unchanged. Release 3.5.0.

**v3.6 concrete plan (planner, 25 Nov 2026; this is the "v3.5 – UK-3b Studies" list above, renumbered). Set `3.6.0`.**
State before: 3.5.0 pushed (Ukrainian cards). Tests on 25 Nov: `snapshot.mjs` (30 kids), `syntax.mjs`, `run.mjs` (42 of 42 cards in a top 3),
`liceum.mjs` pass; radar unchanged. **`ui_text.py` fails on `0/kompas`, `7/kompas`, `21/kompas` only**: the cause is the date line
"TWOJE WYNIKI · 25 LISTOPADA 2026" (the snapshot was taken on 24 Nov). Checked: the screen texts of 3.5.0 (`c40309c`), V0 (`9f27d9f`) and
`main` are identical apart from the version number, so the Polish app did not change; the test depends on today's date.
Data to translate (`studia/data/db/pl/krakow/offers.json`, 126 offers): `name` (103 different, longest 53 characters), `requires.note`
(126, about 11 000 characters), `next` (126, about 8 000 characters), `cost` (4 offers). About 22 000 characters in all, smaller than the cards.
Size: one session, about 1.5 h, light (no split needed). Order: W0 → W1 (three Sonnet helpers in parallel) while Opus does W2 and W3 → W4 → W5.
Offers and universities stay **Polish in English** (`?lang=en` must not change; no `en/offers.json`). University names stay Polish in every language.
Not in this release: the Ukraine data stream (v3.7), campus names and addresses, source titles, thresholds and pay (v4.0).

- [ ] **W0 (Opus, 10 min) `ui_text.py` without today's date.** Make the test independent of the day it runs: preferred, a fixed clock in the
  browser (Playwright `page.clock.set_fixed_time(...)` before `goto`, same day as the export date `2026-11-21`), otherwise normalise the
  results date line in the hashed text (as the version number is now). Before `--update`, compare the dumped Polish texts with the
  24 Nov ones and make sure the only difference is the date. Commit "Kompas Studia v3.6 W0: UI text snapshot ignores today's date".
  Check: `python3 kompas/tests/ui_text.py` says "Polish UI text unchanged (54 screens)", also when run twice.
- [ ] **W1 (Sonnet x3, in parallel; Opus reviews) `studia/i18n/ua/offers.json`.** A list like `offers.json`, items matched by `id`, only the
  text fields `name`, `requires.note`, `next`, `cost` (when the Polish has it). Not: `institution`, `level`, `kind`, `campus`, `cards`,
  `field`, `status`, `sourceId`, `url`, `threshold`, `requires.countFrom/must/main/...` (ids, subject ids and codes stay as they are).
  Batches by position in the file: offers 1–42, 43–84, 85–126; each helper writes its own part file in the scratch folder, Opus joins them
  (no fragment files in the repo). Brief for each helper: the Polish original of its 42 offers, `studia/i18n/glossary.json`, the subject
  names from `studia/i18n/ua/questions.json` (`subjectNames`), rules UK-B/UK-E/UK-F and: "simple words for a 14–18-year-old; `name` in
  Ukrainian only, **without** the Polish name in brackets (the app adds it in the detail), at most about 1.3 x the Polish length; university
  names stay exactly as in Polish; matura subjects as in `subjectNames`; recruitment terms (rozszerzenie, próg, IRK, egzamin wstępny,
  licencjat, inżynier, jednolite magisterskie, szkoła policealna, PSP) as in the glossary with the Polish term in brackets the first time
  in a text; keep every number, year, 'Kraków' and abbreviations". Same name → same translation (103 different names for 126 offers:
  give each helper the full list of names with their ids so repeated names match across batches).
  Check: every id present once; numbers equal; no Polish letters outside brackets and university names.
- [ ] **W2 (Opus, 15 min) Study level names.** `level` stays the Polish value (the regex in `levelTerm()` in `studia/app.js` and
  `kind === 'policealna'` in `core/scoring.js` use it). Add `levelNames` (the 9 different `level` values → Ukrainian) to
  `studia/i18n/ua/questions.json` next to `subjectNames`, register it with `setNames('level', …)` in `applyDataLang()` and show it with
  `nm('level', o.level)` in the offer detail (`app.js` about line 703), the compare row "length" (about line 1112) and the export compare
  (`core/export.js` line 94). Polish and English: `nm` falls back to the Polish value, so nothing changes there.
- [ ] **W3 (Opus) Wiring and tests.** `OV.ua` gets `'offers'` (English list unchanged); `dataPl` keeps the Polish `offers`; `applyDataLang()`
  lays `ua/offers.json` over `dataPl.offers` with `overlay()` (stars, compare and the saved file use ids, so a file made in one language
  opens in the other). In Ukrainian the offer detail and the compare table show the official Polish study name in brackets after the
  Ukrainian one (rule UK-B; small helper next to `shortInst`, reads `dataPl`); short places (road text cut at 30 characters, chips, compass
  extras) show only the Ukrainian name. If the bracket needs a new user-facing text, it goes through `t()` with strings in `pl.json`,
  `ua.json` **and** `en.json` (UK-G). Check that `core/scoring.js` steps and plan texts (`core.step.pol_next`, `core.plan.*`), the
  declaration helper list, star list, compare, report and the markdown export show the Ukrainian `name`/`note`/`next` (they take them from
  `data`); scoring itself uses ids and `kind` only.
  Tests in `tests/syntax.mjs` (same pattern as the cards, line 155 on): every offer has a Ukrainian entry with `name`, `requires.note`,
  `next`, and `cost` where the Polish has one; no overlay id missing in the Polish data; only those fields in the overlay; no Polish letters
  outside brackets and university names; `institution` never in the overlay; `levelNames` covers every `level` in `offers.json`;
  `studia/i18n/en/offers.json` must not exist. `tools/i18n_review.py`: add the offers and `levelNames` to `review-ua.md`.
- [ ] **W4 (Opus, 15 min) Layout check.** `?lang=ua` at 375 and 1280 px, three looks (none, `?skin=pop`, `?skin=neon`), with 3 test kids:
  Kierunki road and panel (long names cut well), offer detail with the Polish name in brackets, star list, declaration helper list,
  compare table (1280) and compare cards (375), plan steps, report, markdown export. No line wider than the screen, no script errors.
  Also `?lang=en` once: offers still Polish, no errors.
- [ ] **W5 (Opus) Review and release 3.6.0.** Read the Sonnet text against the glossary (same terms in the three batches; same names for
  the same Polish name; subject names as in `subjectNames`). Run `snapshot.mjs`, `syntax.mjs`, `run.mjs`, `liceum.mjs`, `ui_text.py`
  (Polish 54 screens unchanged) and `UI_LANG=en python3 kompas/tests/ui_text.py` compared with a dump from 3.5.0 (English must not
  change); radar re-run (must not move). Version 3.6.0 in the four places (search "3.5.0" in `kompas/studia`). `REVIEWED.md`: one line
  "offers, written by AI, not yet read". Release table row v3.6 → done; short "Kompas Studia v3.6.0" section in the spec doc
  ("Kompas – study & school choice app (spec)", Claude Docs). One task = one commit; `git pull --rebase` before pushing (Liceum may push
  the same night; keep both sides).
Safest reading used (Szymon can change it): the Ukrainian study name stands alone in lists and on the road; the Polish official name is
added in brackets only in the detail and the compare table.

**v3.6 – UK-4 Ukraine data stream (Opus research, Sonnet data entry; time-boxed per university).**
**Rules:** official pages only (university recruitment or international pages, faculty pages, official programme descriptions; otouczelnie only
as a pointer); every row has `sourceId`, `asOf`, `url`; **never from memory, never a guessed fact**; if a page cannot be opened, the row
stays out and is listed here. Kraków universities first (UJ, UJ CM, AGH, UEK, UKEN, PK, URK, AKF, ASP, AMUZ, AST, Ignatianum, KSM and the
rest in `campuses.json`); a programme outside Kraków only when it is not taught here (`outside: true`, `city`), in its own list.
1. **UK6a (Opus) Research table** written in this file ("Ukraine-linked education in Kraków, 2026/27") with columns: university, programme or
   offer, type, what exactly is Ukraine-related, language of teaching, source, status. Types:
   - **A** Ukrainian philology and Ukrainian or East-Slavic studies (UJ Filologia ukraińska is already in the data; check UKEN and the others);
   - **B** double or joint diplomas and exchange programmes with Ukrainian universities (partner, which diploma, since when);
   - **C** studies or courses taught in Ukrainian or in English for Ukrainian students; preparatory year and Polish-language courses
     (the language certificate level asked);
   - **D** admission route for a holder of a Ukrainian school certificate (recognition of the certificate, language level, special rules for
     Ukrainian citizens): per university or one general page, with sources, **not in the scoring**;
   - **E** scholarships and support aimed at Ukrainians (national and university; deadlines);
   - **F** studies linked to reconstruction and cooperation (the card `ukraina` and others, for example construction, energy, medicine with a
     Ukraine focus), only where an official page says so.
   Also check which language options for the matura exist for Ukrainian speakers (as a foreign language or a minority language) and write
   what the official source says.
2. **UK6b (Sonnet) Data.** New field on offers: `ukraine: { type: "A"|"B"|"C"|"E"|"F", partner?, note, sourceId, url }` (D is a page, not an
   offer field); new offers for programmes that are not yet in `offers.json` (the usual fields, `requires`, `url`, no threshold unless an
   official page shows one); new sources with `asOf`. Opus decides after UK6a whether a second card is needed (for example "Ukrainistyka
   i studia wschodnie"); a new card needs a test kid, an activity or situation to reach it, and the radar mapping.
3. **UK6c (Opus) Screen.** A tap chip "Пов'язано з Україною / Związane z Ukrainą" in Kierunki (filter), a small badge with the type on
   each tagged offer, a section in the report ("Україна: що є в Кракові"), one row in the compare table, and the information page for
   route D reachable from the footer (both languages; Polish text too). Ukrainian text from the start (rule UK-G), Polish original kept.
   Check: every `ukraine` entry has a `sourceId` that resolves and an http(s) `url` (test); types in the allowed list; radar re-run; the
   42 cards still reach a top 3 (+ the new card if any); tests pass; 375/1280 px, three looks, both languages. Release 3.6.0.

**After v3.6:** v3.7 (links in Kierunki, strengths as the foundation, sources page), v3.8 (travel from Rynek or Dworzec), v3.9 (parent summary),
then **v4.0** (exact thresholds, GUS pay, points estimate). The weekend review asks Szymon only about what is new.

**Open questions for Szymon (the plan runs with the safest reading above if he does not answer):**
1. Who will read the Ukrainian once for correctness (a friend, a teacher)? Until then the footer notice stays.
2. Is the reader a teenager in the Polish school system (assumed) or also a newcomer with a Ukrainian certificate? The second changes
   route D from one information page into a bigger stream.
3. Should "ukraiński" also appear as a language skill and a card interest for Polish speakers who want to study Ukrainian (assumed yes:
   type A and F offers work for both languages)?

### v3.7 tasks (was v3.1: UI/UX + data for item 11, planned 22 Nov 2026; moved behind the Ukrainian track on 24 Nov 2026)

> **Renumbered 24 Nov 2026.** This is now **v3.7** (set `3.7.0`). Wherever the text below says "v3.1" read "v3.7"; "v3.2" = v3.8, "v3.3" = v3.9.
> **ST5 (GUS pay) moved to v4.0 and is skipped here.** New rule from v3.1 on: every new user-facing text goes through `t()` and comes with a
> Ukrainian string in the same release (the key-parity test fails otherwise), so ST2 and ST4 add their texts to `pl.json` and `uk.json`.
> Not yet coded: the 22/23 Nov night runs failed with "usage limit reached".

**Why this release.** The coverage waves are done: 3.0.0 is pushed, the radar has every Studia field at level 3 or 4, and
`tests/run.mjs` says 42 of 42 cards reach a top 3 (re-checked 22 Nov: tests, syntax and Liceum tests pass). The wave rule "no UI/UX
until v3.0" no longer holds, so this release follows "Major goals": **v3.1 UI/UX = items 10, 7 and the screen part of 11**, plus the
data carried over from v3.0 (`url` for the older offers, GUS 2024 pay). No new cards, activities, situations or test kids in this
release (coverage is done), so the wave checks only need to stay green: 42 of 42 cards, no card top 3 for more than half the kids,
A–AD keep their first card, radar unchanged.

**State before (22 Nov 2026).** 3.0.0; 42 cards, 126 offers in `studia/data/db/pl/krakow/offers.json`, **85 offers without `url`**
(uj 14, agh 14, ujcm 10, uek 10, uken 10, pk 6, ksm 5, uafm 4, awf 3, ur 2, asp 2, and one each zse1, sapsp, ignatianum, ug, prz).
`tests/syntax.mjs` checks `url` only when it is there.

**Order (one session, about 2 hours).** ST1 → ST2 → ST3 → ST4 → ST5 (time box) → SR3.1. If time runs out, ST4 and ST5 move to v3.2;
ST1–ST3 and SR3.1 must be in. One task = one commit; `git pull --rebase` before each push (Liceum may push the same night).

1. **ST1 (Sonnet) Official `url` for the 85 offers (item 11, data).** For each offer without `url`, find the official course or
   recruitment page of the university (for example rekrutacja.uj.edu.pl, rekrutacja.agh.edu.pl, uek.krakow.pl, uken.krakow.pl,
   pk.edu.pl; for ug and prz their own sites), **not** otouczelnie or other lists. Put it in `url` next to `sourceId`. Work in batches by
   university (UJ + UJ CM, AGH, UEK, UKEN, PK, the rest); one commit per batch is fine ("Kompas Studia v3.1 ST1: url for N UJ offers").
   If no official page is found for an offer, leave `url` out and list the offer id in the commit message and here.
   Do not change `requires`, thresholds or `status` in this task (if a page shows something different, write it here as a note for later).
   When every offer has a `url`, make `tests/syntax.mjs` strict: every studia offer must have an http(s) `url`. If some are missing,
   keep the test as it is and add a printed count ("studia offers without url: N").
   Check: `node kompas/tests/syntax.mjs` passes; the count of offers without `url` is written here.
2. **ST2 (Opus) "strona kierunku ↗" right in the Kierunki view (item 11, screen).** In the Kierunki road (`app.js`, section
   "Kierunki: one option at a time as a vertical road", about line 944) and its side panel, show under each study the university name and
   a visible link "strona kierunku ↗" (`target="_blank" rel="noopener"`), without opening the detail first. Offers without `url` show the
   university name only (no dead link). Same link in the one-page report and in the compare table (one row "strona"). Tap target at least
   44 px high on phones; the link must not open the study detail (stop the click from reaching the road item).
   Check: 375 and 1280 px in three looks (default, pop, neon): no line wider than the screen, link opens in a new tab, no script errors.
3. **ST3 (Opus) Strengths as the foundation of the compass (item 10, Szymon's text above).** In `studia/story.js`, `sceneSvg` draws the
   strength pills at `sy = 664`, close under the circle, and roads go from each pill into the compass. Move the strengths lower and apart:
   a plinth (a flat base shape, theme colours from CSS variables) with the strengths as stones on it, and thin lines rising from each stone
   to the compass (keep the `in in-<id>` path classes, so the scroll highlight still works). Grow the SVG `viewBox` height as needed;
   with 1 to 5 strengths the stones stay centred; long names wrap (the existing `wrap` helper). Safest reading if Szymon does not answer:
   **one plinth with stones**, not separate pillars.
   Check: scroll steps still highlight the inputs; 375 and 1280 px in three looks; personas with 1 and with 5 strengths look right.
4. **ST4 (Sonnet) Sources page (item 7; U3 chips were already done in 2.4.0).** A page "Źródła danych" like Liceum's (`liceum/app.js`,
   about line 665: list of all sources with name, link, `asOf`, and how many marked "do sprawdzenia"), reached from a small link in the
   Studia footer or menu (one link, no new tab in the bottom bar). Reuse the Liceum text and markup where it fits; share a helper in
   `kompas/core` only if it stays simple, and keep `node kompas/tests/liceum.mjs` passing.
   Check: every source in `studia/data/sources.json` is listed once; links open in a new tab; 375 and 1280 px.
5. **ST5 (Sonnet, time box 15 min) GUS 2024 pay for cards still without pay (item 6 rest).** Cards without `pay`: media-cyfrowe, morze,
   lotnictwo, turystyka, historia-sztuki, spoleczenstwo, nauka, sztuka-scena, historia, zywienie, weterynaria, geografia; and the old cards
   on `gus-2020`. Same method as D7/SW1c: GUS 2024 table (`gus-2024`) when a figure for the group can be read, band from the existing scale;
   never a guessed band. If the GUS table (Tablica 5, xlsx) still cannot be opened, stop at the time box, change nothing and write that here.
6. **SR3.1 (Opus) Review and release 3.1.0.** Review the Sonnet work (ST1 links: open 5 at random and check they are the right course;
   ST4 page). `node kompas/tests/run.mjs` (still 42 of 42 cards, A–AD first cards unchanged), `syntax.mjs`, `liceum.mjs`; radar re-run
   (should not move; paste only if it does). Version 3.1.0 in the four places (`config.json`, two in `index.html`, line 1 of `app.js`;
   search for "3.0.0" in `kompas/studia`). Release table row v3.1 → pushed; spec doc section "Kompas Studia v3.1.0" (Claude Docs).
   Push to main.

**Not in v3.1:** travel from the centre (12) and points estimate (8, with SD5 UJ thresholds) → v3.2; parent summary (9) → v3.3.
