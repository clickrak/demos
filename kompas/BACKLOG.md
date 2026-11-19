# Kompas backlog

Two parts:

1. **Kompas Liceum roadmap to v3.0** (set 19 Nov 2026). Releases in order, each task marked **Sonnet** or **Opus**.
2. **Small jobs** (D1–D8, U1–U7) left after the review of 13 Nov 2026. The roadmap points to them by id.

The same roadmap is in the spec doc (section "Kompas Liceum roadmap (19 Nov)").

## Part 1: Kompas Liceum roadmap to v3.0

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
| v2.7 | GZM part 2: next schools down the list; map filter by town | Sonnet |
| v2.8 | Review of questions and interests: languages, economy, sociology … not only science and IT | Opus |
| v2.9 | Ukrainian interface (school and class data stay Polish) | Opus + Sonnet |
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

**v2.6–v2.7 GZM**
- **G1 (Opus, v2.6) GZM ranked list.** All licea and technika in the GZM towns, ordered best to worst by **matura results**,
  with town, address and source. Main order: the Perspektywy "Ranking Maturalny" for licea and for technika (matura results only,
  no olympiads), newest edition (2026; perspektywy.pl). Schools not in it are placed by the otouczelnie.pl ranking for their town
  (matura pass rate + average Polish, maths and English at basic level; covers every school; already a Kompas source).
  Store both ranks and the source for each school. Store it as `kompas/liceum/data/db/pl/gzm/ranking.json`. It sets the order for G2 and G3.
- **G2 (Sonnet, v2.6) GZM schools, top of the list.** Same steps as T3 and M1, from the top of the ranked list.
- **G3 (Sonnet, v2.7) GZM schools, next on the list.** Same steps; plus a map filter by town.

**v2.8**
- **Q1 (Opus) Review of questions and interests.** Check worlds, activity cards, situations, strengths and directions for balance:
  languages, economy and business, sociology and psychology, law and media, arts. Add or rewrite cards; one test kid per world.

**v2.9**
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

### D8 (P3) Studia: check one offer
Confirm on the University of Agriculture (URK) site that "Inżynieria i gospodarka wodna" still recruits for 2027/28, and that
its entry in `offers.json` (subjects, length, link) matches. Fix or mark `"status": "check"`.

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
