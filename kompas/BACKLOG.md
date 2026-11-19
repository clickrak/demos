# Kompas backlog

Three parts:

1. **Kompas Liceum roadmap to v3.0** (set 19 Nov 2026). Releases in order, each task marked **Sonnet** or **Opus**.
2. **Small jobs** (D1–D8, U1–U7) left after the review of 13 Nov 2026. The roadmap points to them by id.
3. **Kompas Studia roadmap** (started 19 Nov 2026), at the end of this file. One minor release per night, focus by rotation.

The same roadmap is in the spec doc (section "Kompas Liceum roadmap (19 Nov)").

## Part 1: Kompas Liceum roadmap to v3.0

## Next minor: v2.8 (planned 2026-11-19, released 2026-11-19 as 2.8.0)

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
   (Chorzów order 4, Tarnowskie Góry 8) wait: they need a `regions` change, which is an Opus step in v2.9.
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

**Moved forward to the next Liceum release (not done on 19 Nov).**
- Night-run limits: the cloud run cannot reach Nominatim (map points) or gtfs.ztp.krakow.pl (Kraków travel times), and WebFetch
  could not open Wikipedia/Wikidata/OSM pages. Tests need a map point, `geoChecked` and (Kraków) travel times for every school,
  so no new school could be added safely. Fix: run these tasks where those hosts are reachable, or add the schools and let the
  "Geocode schools" Action fill points and times (tests fail until it finishes, so decide first).
- K1-6 rest: XIII LO (`lo13`) — otouczelnie page could not be read; III LO scored lists not on the page.
- K3: XVII LO and XXV LO (blocked by map point and travel time, above).
- T6: Technikum nr 6 Tychy (address found: ul. Browarowa 1A, 43-100 Tychy, otouczelnie; class list and map point missing).
  Tychy thresholds 2026/27: 0 of 39; no official or otouczelnie page shows them. licea-progi.pl has IV LO 2026 numbers
  (1C 186.45, 1B 151.05, 1A 144.1, 1D 127.45, 1P 71.45; also a class 1MS) — not entered: private site, needs Szymon's decision.
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

**Database status (19 Nov 2026, after 2.8.0).** Known total = schools in the otouczelnie 2026 lists already in the repo (Kraków lists;
Tychy and other GZM towns from `gzm/ranking.json`), including private, sports and music schools.

| Area | Schools in DB / known | Public missing | Missing `www` | Classes "check" | No threshold | No `scored` | Old or badly dated sources |
|---|---|---|---|---|---|---|---|
| Kraków | 48 / 90 | 13 (XVII, XXV LO; 11 technika) | 39 | 139 of 232 | 37 | 82 | 0 |
| Tychy | 9 / 13 | 1 (Technikum nr 6) | 0 | 39 of 39 | 39 | 30 | 1 (`ty-informator-2025`, no 2026/27 edition yet) |
| GZM other towns | 5 / 197 | 158 | 0 | 36 of 36 | 13 | 27 | 0 |

All schools in the DB have an address, a map point and `geoChecked`. K1 so far: 18 of 48 Kraków schools checked (batches 1–6; XIII LO still open).

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
| v2.9 | Review of questions and interests: languages, economy, sociology … not only science and IT; new GZM towns in `regions` | Opus |
| v2.10 | Ukrainian interface (school and class data stay Polish) | Opus + Sonnet |
| v3.0 | Sports classes and exact points counting | Opus |

Every v2 release also does **L1**: website links for 5–10 schools. English and French interface come after v3.0.

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

**v2.9**
- **Q1 (Opus) Review of questions and interests.** Check worlds, activity cards, situations, strengths and directions for balance:
  languages, economy and business, sociology and psychology, law and media, arts. Add or rewrite cards; one test kid per world.

**v2.10**
- **I1 (Opus) Texts in language files.** All interface texts in one file per language; a language switch in the header.
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
2. **No new network calls** when the app runs. Allowed today: OpenStreetMap map tiles in Liceum, and links that open only when tapped.
   No analytics, no cookies, no browser storage, no CDN scripts or fonts.
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
**Where.** `kompas/studia/app.js`, screen "Gdzie chcesz być potrzebny?" (search `data-field="startMin"`). It is a number field.
**Do.** Replace it with chips: `10`, `20`, `30`, `45`, `60`, `90 min`. A tap sets `A.startMin`. Keep the same question text.
Use the existing `chip()` helper and the `data-set="startMin" data-val="30"` pattern used for `privateOk` on the same screen
(check that the handler stores a number; `commute()` does `Number(A.startMin)`, so a string is fine too).
**Done when** the screen has no keyboard input and the commute times in the results still change with the choice.

### U2 (P1) Studia: tap ideas for the three reflection questions
**Where.** `vReflection` in `kompas/studia/app.js`; questions are in `questions.json` → `reflection` (f1, f2, f3).
**Do.** Add to each question in the data a list `"ideas": ["…", "…"]` (5–6 short answers a teenager could tap, for f1 for example
"w sporcie", "grając", "przy muzyce", "pomagając komuś", "ucząc się czegoś nowego"). Show them as chips above the text area.
A tap writes the idea into `A.reflection[q.id]` (tap again = clear). Keep the text area for kids who want to write.
**Done when** all three questions can be answered without typing and the answers appear in the exported file as before.

### U3 (P2) Studia: tap ideas for "Mogę to zrobić, bo…"
**Where.** `data-field="canDo"` (two places in `kompas/studia/app.js`).
**Do.** Under the field show 3 chips built from his own answers, for example
`bo umiem: ${first strength}`, `bo ważne jest dla mnie: ${first value}`, `bo już to robię ${where}`. A tap fills the field.
**Done when** the sentence can be chosen with one tap and still edited by hand.

### U4 (P2) Studia: sport as chips
**Where.** `data-field="sport"` on the "Języki i sport" screen.
**Do.** Chips: siłownia, bieganie, piłka, pływanie, wspinaczka, rower, sztuki walki, taniec, inne, nie trenuję (many can be on).
Store them joined with ", " in `A.sport`, so the export and old files keep working. Keep a short optional text field.

### U5 (P2) Studia: shorter strengths screen on phones
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
- **Current major goal (until the weekend review sets one):** v3.0. Trustworthy Kraków facts behind every result
  (every offer, demand line and pay band with a fresh source), so Aleks can act on the results for matura 2027 choices.

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
- **Spec doc.** After each release add a short "Kompas Studia vX.Y.0" section to the spec doc ("Kompas – study & school choice app (spec)").
- The rules for every task (Part 2) apply: no personal data, no new network calls, a source for every fact, one task = one commit.
- **Liceum work may run the same night** (it also edits `kompas/studia/data/sources.json` in D9). `git pull --rebase` before
  starting and before pushing; keep both sides when merging.

### Releases

| Version | Focus | Main content | Agent | Status |
|---|---|---|---|---|
| v2.0 | Data | Kraków job demand for the 17 missing areas (D1); 2026 thresholds for UJ, UJ CM and AGH offers; newer GUS pay (D7); URK offer check (D8) | Sonnet + Opus | pushed 19 Nov 2026 as 2.0.0 (some items moved, see below) |

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
