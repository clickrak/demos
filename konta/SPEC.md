# Konta Inwestycyjne — spec

**Goal:** small static web app (GitHub Pages) that compares Polish investment vehicles and builds simple scenarios for a given capital and monthly contribution.

**Tech:** one page, plain HTML + CSS + vanilla JS, Chart.js (stored in `vendor/`, so it works offline), no backend, no build step. The user’s numbers never leave the browser; the only outside call is the site’s visit counter (GoatCounter, no cookies), added by the shared site template. UI in Polish, mobile friendly. All numbers live in `config.js` and are editable in the UI.

## User profile (fixed, simple)
Polish tax resident, umowa o pracę, gross salary 10 000 zł/month (≈ average), PIT 12%, age 40, saves 25 years. All values nominal, yearly compounding, contributions added at the start of each year.

## Vehicles and default assumptions (2027 rules)

| Vehicle | Limit / contribution | Tax rule (simplified) | Return p.a. |
|---|---|---|---|
| IKE | 30 099 zł / year | 0% after age 60, else 19% on gain | 7% (ETF World) |
| IKZE | 12 039,60 zł / year | 12% refund each year (reinvested in taxable ETF); 10% on whole payout after 65, else 12% PIT | 7% |
| OKI | no yearly limit | no Belka; 0,85% yearly tax on value above 100 000 zł | 7% |
| PPK | employee 2% + employer 1,5% of gross; state 250 zł once + 240 zł / year | 12% PIT on employer part; 0% after 60 | 5,5% |
| PPE | employer 3,5% of gross (toggle, default off) | 12% PIT on employer part; 0% after 60 | 5,5% |
| Obligacje EDO | no limit | 5,35% year 1, then inflation + 2%; 19% on interest at the end | inflation 3% |
| ETF World / EM (XTB) | no limit | 19% on gain at the end; 0% commission; TER 0,2% | 7% / 8% |

## 10 functionalities — status v0.1

| # | Functionality | v0.1 |
|---|---|---|
| F1 | Input panel: capital, monthly, salary, age, horizon (slider + number) | ✅ |
| F2 | Comparison table: limit, benefit, exit tax, lock-in, risk, description | ✅ |
| F3 | Each vehicle alone: same money, net after tax, “per 1 zł paid” (over-limit part → taxable ETF) | ✅ |
| F4 | Automatic waterfall in editable order (default IKZE → IKE → OKI up to 100k → ETF); PPK/PPE run beside it from salary | ✅ |
| F5 | Scenario builder: % split, 3 slots A/B/C with names | ✅ |
| F6 | Growth chart: Auto + A/B/C + “total paid in” line | ✅ |
| F7 | Result summary: paid in, gross, taxes, net, gain vs plain taxed ETF account | ✅ |
| F8 | Market presets (pessimistic / base / optimistic) + “today’s money” toggle | ✅ |
| F9 | Early withdrawal after N years: net per vehicle + which rule applies | ✅ |
| F10 | Editable assumptions, reset, localStorage + shareable URL, CSV export, disclaimer | ✅ |

Acceptance v0.1: 13/13 calculation tests pass (`tests.html` or `node tests.js`); no console errors; offline via `sw.js` on https.

Decisions taken in v0.1: PPE early payout shown as “not possible (transfer only)”; IKZE early payout taxed flat 12%; OKI tax computed on end-of-year value; EDO taxed once at the end (no 10-year roll-over); in “today’s money” mode own contributions stay nominal.

## v0.2 — UX review of v0.1 (16.11.2026)

**How it was checked:** v0.1 opened in Chrome at 1280×800 (desktop) and 390×844 (phone). Walked as each persona (Młody: 28 years, 5 000 zł, 500 zł/month; Średni: defaults; Senior: 60 years, 300 000 zł, 0 zł/month), then keyboard only, then with wrong inputs. All numbers below are measured on v0.1. The calculations are fine (13/13 tests); the problems are in how the user gets to the answer.

**Main finding:** the app is one long page of 8 stacked sections (4 540 px on desktop, 8 001 px on phone). The user types data at the top and the answer is 2 500 px lower (about 5 screens on a phone), inside a 6-column table. There is no start, no single answer, and no next step.

### Target user journey

| Step | The user asks | View | Must be true |
|---|---|---|---|
| 1 Start | “Is this for me?” | Start | 1 sentence, 3 persona cards, “Zacznij tutaj”. Shown on the first visit only; later visits open Plan with saved data |
| 2 Data | “What do you need from me?” | Przewodnik (N5) or Plan | max 5 fields visible, the rest under “Więcej opcji” |
| 3 Answer | “How much will I have?” | Plan | one big number, visible without scrolling, updates live |
| 4 Why | “Where does it come from?” | Plan | split: paid in / employer + state / market gain / tax; plan in 3 lines; up to 3 tips |
| 5 Explore | “What if…?” | Plan | change split, scenarios A/B/C, market, today’s money; the answer stays in view |
| 6 Products | “What is IKE, IKZE…?” | Produkty | comparison, each alone, early exit |
| 7 Payout | “How long will it last?” | Wypłata (N2) | monthly income, age when money ends |
| 8 Keep | “Can I save or send it?” | any | Zapisz .md, link, CSV |
| 9 Trust | “Can I believe it?” | Założenia | assumptions next to the number, sources, disclaimer on the result |

### U0. New page structure (build first: N1–N5 plug into it)

Replace the 8 stacked sections with 5 real views. One view is visible at a time, each has its own address, and the browser Back button works.

| View (address) | Contains |
|---|---|
| Start (`#start`) | personas (N1), entry to the guide (N5) |
| Plan (`#plan`) | inputs (F1, F8), result card, charts (F6), summary (F7); auto-split (F4) and scenarios (F5) under “Dostosuj podział” |
| Produkty (`#produkty`) | comparison (F2), each alone (F3), early exit (F9, now called “Wcześniejsza wypłata”) |
| Wypłata (`#wyplata`) | withdrawal scenarios (N2) |
| Założenia (`#zalozenia`) | assumptions (F10), sources (N4), save/load (N3), reset |

- **Navigation:** 5 tabs with a clear active state (`aria-current="page"`). On phone: a fixed bottom bar, icon + short label. Headings without numbers (“Twoje dane”, not “1. Twoje dane”) because numbers look like 8 steps to finish.
- **Result card** (top of Plan; on desktop ≥ 900 px in a right column next to the inputs): “W wieku 65 lat: **1 131 608 zł** na rękę”, then 3 small numbers: wpłacasz, od pracodawcy i państwa, zysk vs zwykłe konto ETF. Below: one line of assumptions (“ETF 7% rocznie, inflacja 3% · zmień”) and the short disclaimer.
- **Result bar:** sticky strip with the same main number and a scenario picker (Auto / A / B / C), shown on Plan and Produkty whenever the result card is out of view (top on desktop, above the bottom bar on phone).
- **Tips** under the result card: max 3, rule based, each with one button. Rules: PPK is off (“PPK to ok. X zł od pracodawcy i państwa” → Włącz); money goes to a taxed account while the IKZE or IKE limit is not used; payout before 60 or 65 (see U13); scenario A/B/C is more than 1% below Auto (“Auto-podział daje +X zł” → Pokaż).
- **Auto-split shows numbers:** under the order list, “W tym roku: IKZE 12 040 zł · IKE 19 960 zł · zwrot PIT ok. 1 445 zł”. Today it shows only the order.

### Findings and fixes

P1 = blocks the journey, fix before new features. P2 = fix in v0.2. P3 = nice to have.

| ID | Problem in v0.1 (measured) | Fix | Prio |
|---|---|---|---|
| U1 | Answer is far from the inputs: results start 2 513 px down on desktop, 4 131 px on phone | U0: result card + sticky result bar | P1 |
| U2 | “Tabs” are jump links: no active state, they scroll away; on phone 833 px of links in a 358 px strip with no sign that more exist | U0 navigation | P1 |
| U3 | First screen is a form (5 fields, 3 checkboxes, 3 buttons) with no explanation of what the user will get | Start view (N1, N5) | P1 |
| U4 | No headline answer: it is one row of five in a table | U0 result card | P1 |
| U5 | Auto-split shows the order but not the amounts or the IKZE refund | U0 “Auto-split shows numbers” | P2 |
| U6 | Phone: all 5 tables are wider than the screen (541–853 px in a 320 px box); in “Każdy osobno” and “Wyniki” the key column “Na rękę” is off screen | Under 700 px show each row as a card: name, big “Na rękę”, one line “wpłaty X · podatki Y”, the rest under “Więcej”. F2 becomes an accordion per product | P1 |
| U7 | Touch targets: 87 of 87 controls are under 44 px (buttons 35 px high, ↑ ↓ ✕ are 31×27, checkboxes 13×13) | Min 44×44 px on touch screens; checkboxes become switches or full-width rows | P1 |
| U8 | Inputs use 15 px text, so iPhone Safari zooms the page on every tap; notes are 12,5–13,6 px | Inputs 16 px, body 16 px, notes min 14 px | P1 |
| U9 | Chart: 4 lines within a few % of each other overlap; on phone the legend and axis labels take about half of the 260 px box | Chart 1: horizontal bars “Na rękę” per scenario + zwykłe konto ETF, value at the end of each bar. Chart 2: growth of the chosen scenario + “wpłacone” line; button “Porównaj wszystkie”. Legend as chips above the chart; lines differ by dash pattern, not only colour | P2 |
| U10 | Desktop: sliders are 50 px wide (5 fields in one row), impossible to set | Slider under the number field, min 160 px wide; max 3 fields per row | P1 |
| U11 | No validation: −500 zł/month, age 90 and capital 2 000 000 zł are accepted and calculated; an empty field silently keeps the old value | Limit to min/max when the user leaves the field, short message under it (“Wpisz kwotę od 0 do 500 000 zł”), `aria-invalid`; wrong values never reach the calculation | P1 |
| U12 | Number format: fields show “20000” and “12039.6” (dot); tables show “1510 zł” next to “19 960 zł” | Text fields with `inputmode="decimal"`, shown as “20 000” and “12 039,60”; accept spaces and comma; `useGrouping: 'always'` everywhere | P2 |
| U13 | “Ile lat oszczędzasz” hides the payout age. Młody (28 + 35 years) ends at 63, so IKZE is taxed 12% instead of 10% (122 043 zł tax in “Każdy osobno”); the only sign is a grey note “Wypłata w wieku 63 lat” | Replace the field with “Wypłata w wieku” (default 65; years are calculated). If under 60 or 65: warning on the result card with what it costs and a button “Ustaw 65 lat” | P1 |
| U14 | Empty state: capital 0 and 0 zł/month gives four identical scenarios, the “best” highlight on a 0 zł row and “+71,4%” | Message “Wpisz kapitał lub wpłatę miesięczną”; no highlight when results are equal | P2 |
| U15 | “Twoje wpłaty” also contains the PPK contribution and PIT on the employer part: Senior with 300 000 zł and 0 zł/month sees 313 080 zł | Two lines: “Z Twojej kieszeni” and “Z pensji (PPK)” | P2 |
| U16 | “Każdy osobno” marks ETF EM in green as best only because it assumes 8%; it reads like advice. “Na 1 zł wpłaty” shows 17,99 zł for PPE and 3,68 zł for PPK because the employer pays | No “best” mark between assets of different risk; show the range (pessimistic–optimistic) in each row. For PPK and PPE show “w tym od pracodawcy i państwa: X zł” instead of “na 1 zł” | P1 |
| U17 | Words with no explanation: Belka, PIT, TER, brutto, ETF, EM, “opakowanie”, “r.ż.” | One `GLOSSARY` list in `config.js`; words get a dotted underline, tap or Enter opens a 1–2 sentence note, Esc closes. Write “roku życia” in full | P2 |
| U18 | Chart shows value before tax (1 220 377 zł), the table after tax (1 131 608 zł): two answers for one scenario | The end of each line is marked “po podatkach: X zł” and equals the table | P1 |
| U19 | Disclaimer and assumptions are only at the very bottom | Short disclaimer and assumption line on the result card (U0) | P2 |
| U20 | A market button overwrites hand-typed returns with no warning; “Przywróć domyślne” deletes named scenarios at once | After both: message “Przywrócono · Cofnij” for 8 seconds | P2 |
| U21 | The address bar is rewritten on every change (about 1 350 characters). Opening someone’s link replaces your own saved plan on the first change | Clean address; “Kopiuj link” builds the link (store only values that differ from defaults). Opened from a link: banner “Oglądasz udostępniony plan · Zapisz jako mój · Wróć do mojego” | P2 |
| U22 | Keyboard: 54 Tab presses to reach the results; after ↑ ↓ ✕ the focus jumps back to the top of the page; focus ring on the green header is 1 px dark on dark green | Skip link “Przejdź do wyniku”; focus stays on the moved item; focus ring 2 px, visible on every background | P2 |
| U23 | Screen reader: result changes are not announced; tables have no caption and no `scope`; nav has no label; “best” is shown by colour only | `aria-live="polite"` on the result card (wait 500 ms after the last change); captions and `scope`; `aria-label` on nav; text mark “✓ najwięcej na rękę” | P2 |
| U24 | Contrast: field borders 1,25:1 (need 3:1); “v0.1” 3,9:1 and “← Demos” 4,3:1 (need 4,5:1); chart orange 3,2:1 and grey 2,6:1 | New colour tokens: text ≥ 4,5:1, borders and chart lines ≥ 3:1 | P2 |
| U25 | No dark mode; smooth scrolling ignores “reduce motion”; printing gives raw pages | `prefers-reduced-motion`; print style for the Plan view; dark mode with `prefers-color-scheme` | P3 |
| U26 | Name clash: F9 uses “Wcześniejsza wypłata” and `#wyplata`; N2 adds “Wypłata kapitału” | F9 moves to Produkty as `#wczesniej`; `#wyplata` is only N2 | P1 |

### UI rules (all views)
- One main number per view; one main button per view.
- Money is always written “1 510 zł”; percent “5,5%”; tabular digits in tables.
- Text 16 px, notes min 14 px; touch targets min 44 px on phone, 32 px on desktop.
- Never colour alone: add a word or an icon.
- Plain Polish, short sentences, no shortcuts without explanation.
- Every changed input updates the result in under 100 ms; nothing reloads.

### Acceptance — UX (check at 390×844 and 1280×800)
1. After any input change on Plan the main number is visible without scrolling.
2. On phone no side scrolling is needed to read “Na rękę” anywhere.
3. All controls are at least 44×44 px on phone; no input has text under 16 px.
4. Wrong or empty input shows a message and does not change the result.
5. Payout age under 65 with IKZE in the plan shows the warning and the fix button.
6. Chart end values equal the “Na rękę” values in the table.
7. The address has no `?s=` unless the page was opened from a shared link.
8. Keyboard only: skip link reaches the result; focus is never lost after an action.
9. Lighthouse accessibility score at least 95 on Plan and Produkty; no console errors.
10. First visit opens Start; second visit opens Plan with the saved data.

### UX review 2 — feedback on v0.3 (16.11.2026)

The app is still hard to read for a beginner: it is not clear where the money comes from and where it goes. Goal: simple by default, more control for advanced users. Personas choose the level.

| ID | Problem in v0.3 | Fix | Prio |
|---|---|---|---|
| U27 | It is not clear that PPK is calculated from the salary and comes **on top** of the monthly saving | Group “Z pensji – automatycznie” under the inputs with live amounts: “Ty 2% = 200 zł · pracodawca 1,5% = 150 zł · państwo 240 zł/rok. To dodatkowo, nie z kwoty, którą odkładasz.” Labels: “Odkładasz miesięcznie (poza PPK)”, salary hint “Od niej liczymy PPK i zwrot z IKZE” | P1 |
| U28 | The split is invisible: the user cannot see e.g. “PPK 20%, IKZE 50%, IKE 30%” | Card “Gdzie trafiają pieniądze” next to the result: a stacked bar + list for **one month** (own saving and money from salary, two groups) and for **the starting capital**: name, zł, % of the total. Values for year 1; a note when a yearly limit is full (“IKZE: limit 12 040 zł rocznie, ok. 1 003 zł miesięcznie”) | P1 |
| U29 | The starting capital always follows the same split as the monthly saving | Auto-podział: capital fills the free limit room of year 1 first (as now) and is shown as its own row in U28. Scenarios A/B/C: option “Kapitał na start dziel inaczej” with its own % (`capSplit`, empty = same as monthly) | P2 |
| U30 | Beginner and advanced user see the same dense screen | Switch “Widok: Prosty / Zaawansowany” at the top of Plan; persona sets it (Młody and Senior → Prosty, Średni → Zaawansowany), guide ends in Prosty. **Prosty:** inputs, PPK group, style, market, result card, U28 card, growth chart. **Zaawansowany** adds: scenario picker, scenarios A/B/C with capital split, comparison chart and table, order of accounts, yearly table, CSV | P1 |
| U31 | The guide’s risk answer overwrote scenario A, and with big capital the “calm” mix sent the over-limit part to ETF (stocks) | “Jak inwestować: Spokojnie / Pośrodku / Odważnie” = share of EDO bonds in the Auto-podział (60% / 30% / 0%); the rest follows the order IKZE → IKE → OKI → ETF with limits. Same control in the guide and on Plan | P1 |
| U32 | Withdrawal (N2) must not be hidden inside Plan | Separate tab “Wypłata” in the main navigation (5 items: Start, Plan, Produkty, Wypłata, Założenia) | P1 |

## v0.2 — new features (requested)

**N1. Personas (Start view).** User picks one of 3 profiles; it sets default inputs and which view opens. The chosen persona stays visible as a chip in the header (“Profil: Młody · zmień”). Changing it when the user already typed data asks first: “Zastąpić Twoje dane przykładowymi?”.

| Persona | Typical user | Main goal | Default inputs | Opens on |
|---|---|---|---|---|
| Młody (20–35) | first job, small capital | plan and simulate | age 28, capital 5 000 zł, 500 zł/month, payout at 65 | Przewodnik (N5), then Plan |
| Średni (35–55) | stable income, some savings | simulate and optimise (use limits, IKZE refund) | age 45, capital 50 000 zł, 1 500 zł/month, payout at 65 | Plan, with “Dostosuj podział” open and tips visible |
| Senior (55+) | close to retirement | plan retirement, optimise withdrawals | age 60, capital 300 000 zł, 0 zł/month, payout at 65 | Wypłata |

Note from the review: the old Młody default (35 years from age 28) ended at 63 and triggered the higher IKZE tax (U13), so all personas now use a payout age.

**N2. New view “Wypłata” (withdrawal scenarios, `#wyplata`).**
- Start: capital at retirement taken from the saving result, or typed in, split by account (IKE, IKZE, OKI, PPK, PPE, EDO, ETF).
- Strategies: fixed monthly amount (indexed by inflation or not); fixed % per year (e.g. 4%); “spend all by age X”.
- Order of withdrawal between accounts (e.g. taxable ETF first, IKE last), editable like the auto-split order.
- Tax rules per account: IKE 0%, IKZE 10% (whole or spread over years), PPK 25% at once + 75% in at least 120 instalments, OKI asset tax continues, ETF/EDO 19% on the gain part of each withdrawal.
- Output: net monthly income, age when money runs out, taxes paid, chart of the remaining capital; same 3 market presets.
- UX: same pattern as Plan: one main number on a result card (“**X zł miesięcznie** na rękę, wystarczy do **Y** roku życia”), inputs next to it, details below. Senior lands here with the capital typed in per account, because a person close to retirement already has money on existing accounts (v0.1 treats all capital as new cash).

**N3. Save and load as Markdown.** “Zapisz .md” downloads one file: readable summary (inputs, assumptions, results table, sources date) plus the full app state in a front-matter block (YAML or JSON) so “Wczytaj .md” can restore it. Works offline, nothing is sent anywhere.

**N4. Sources list “Źródła” (inside the Założenia view).** List of official sources behind every number: what it backs, link, date last checked, status (✅ checked / ⚠️ to verify). Kept in one file (`sources.js`) so it is easy to update every year (limits change each November). Items marked ⚠️ also show a small warning next to the number in the app.

**N5. Guide for beginners (“Przewodnik”).** Default view for the Młody persona (N1), also reachable from a “Zacznij tutaj” button. One simple question per screen, answers by clicking a choice (with “inna kwota” for typing), progress shown as “2 / 6”, back button that keeps the answers. Choices are big buttons (min 56 px high); a click goes to the next question, no extra “Dalej”. Answers are saved after each step, so a reload continues where the user stopped. Every question has a “Co to znaczy?” link that opens a 2–3 sentence explanation in plain words.

| Step | Question | Choices | “Co to znaczy?” explains |
|---|---|---|---|
| 1 | Ile zarabiasz brutto miesięcznie? | 5 000 / 7 500 / 10 000 / 15 000 zł / inna | brutto vs netto; why it matters (PPK, IKZE refund) |
| 2 | Ile możesz odłożyć co miesiąc? | 200 / 500 / 1 000 / 2 000 zł / inna | tip: start with ~10% of net pay; small amounts grow a lot over time |
| 3 | Czy masz już oszczędności? | nie / 5 000 / 20 000 / 50 000 zł / inna | keep an emergency fund (3–6 months of costs) outside investments |
| 4 | Ile masz lat? | 25 / 30 / 35 / 40 / 45 / inna (retirement fixed at 65, editable later) | why time matters more than amount (compound interest) |
| 5 | Jak spokojnie chcesz spać? | Spokojnie / Pośrodku / Odważnie | risk: ups and downs; maps to mix: more EDO / mixed / mostly ETF |
| 6 | Czy jesteś w PPK? | tak / nie / nie wiem (→ assume yes) | what PPK is; employer + state money |

Result screen (one card, big numbers):
- “W wieku 65 lat możesz mieć ok. **X zł**” (net after tax) and “to ok. **Y zł** w dzisiejszych pieniądzach”.
- “To ok. **Z zł miesięcznie** przez 20 lat emerytury” (simple split of the real value, no interest; refined later by N2).
- Suggested plan in 3 lines, from the auto-split (e.g. “1. Zostań w PPK. 2. IKZE do 1 000 zł/mies. – odzyskasz 12% w PIT. 3. Reszta: IKE.”).
- Range with the 3 market presets: “w gorszym scenariuszu A zł, w lepszym B zł”.
- Buttons: “Zobacz szczegóły” (main button; opens the Plan view with these inputs filled in), “Zapisz .md” (N3), “Zacznij od nowa”.
- The card is the same component as the result card on Plan (U0), so the numbers and wording are identical in both places.
- Rules: plain Polish, no jargon without explanation, numbers rounded to thousands, disclaimer visible on the result screen.

Seed list for N4 (to check against official pages):
| Figure | Official source |
|---|---|
| IKE 30 099 zł, IKZE 12 039,60 zł (2027) | Monitor Polski – obwieszczenie MRPiPS z 30.10.2026; ustawa o IKE i IKZE (isap.sejm.gov.pl) |
| OKI: 100 000 zł exemption, 0,85% tax in 2027, which assets qualify | ustawa o OKI (isap.sejm.gov.pl), gov.pl/web/finanse — ⚠️ ETF eligibility |
| EDO 5,35% year 1, inflation + 2%; early redemption fee | obligacjeskarbowe.pl, list emisyjny MF (current month) |
| PPK rates, 250 zł + 240 zł state bonus, early withdrawal rules | mojeppk.pl, ustawa o PPK (isap.sejm.gov.pl) |
| PPE rules, payout at 60 | ustawa o pracowniczych programach emerytalnych (isap.sejm.gov.pl), KNF |
| PIT 12% / 32%, Belka 19% | ustawa o PIT (isap.sejm.gov.pl), podatki.gov.pl |
| Average wage forecast 10 033 zł (2027) | Monitor Polski obwieszczenie / ustawa budżetowa 2027 |

## TODO — next version (v0.2)

Keep the calculation tests green in every release. Each release = bump the version in the header and in `sw.js`, run `node tests.js`, push to `main` (GitHub Pages deploys it).

### Release plan

| Release | Name | Content | Status |
|---|---|---|---|
| v0.2 | Struktura | U0 page structure (views Plan, Produkty, Założenia; result card; result bar; tips; auto-split amounts) + all P1 fixes (U6, U7, U8, U10, U11, U13, U16, U18, U26) + U9 charts, U19 | ✅ 16.11.2026 |
| v0.3 | Start | N5 guide, N1 personas (Start view) + P2 fixes U12, U14, U15, U17, U20, U21. Until v0.4: Senior opens Plan, the guide has no “Zapisz .md” | ✅ 16.11.2026 |
| v0.4 | Przejrzystość | U27–U31: PPK from salary on top, “Gdzie trafiają pieniądze”, capital split, Prosty / Zaawansowany, investing style | ✅ 16.11.2026 |
| v0.5 | Wypłata | N2 as a separate tab (U32); Senior opens it | ⏳ |
| v0.6 | Zapis i źródła | N3 Markdown save/load, N4 sources + U22–U24 rest, Lighthouse ≥ 95 | ⏳ |
| v0.7 | Dokładność | U25 + calculation details (OKI, EDO, IKZE, PIT 32%, PPK, asset choice, risk view, monthly steps, couple mode, CI) | ⏳ |

- [x] **U0 Page structure** (5 views with addresses, tabs / bottom bar, result card, sticky result bar, tips, auto-split amounts).
- [x] **UX P1 fixes:** U1–U4 (done by U0), U6 tables as cards on phone, U7 touch targets, U8 text sizes, U10 sliders, U11 validation, U13 payout age + warning, U16 no “best” between different risks, U18 chart = table, U26 rename F9.
- [x] **UX P2 fixes, part 1 (v0.2–v0.3):** U5, U9 charts, U12 number format, U14 empty state, U15 split “Twoje wpłaty”, U17 glossary, U19, U20 undo, U21 clean address + shared-link banner.
- [ ] **UX P2 fixes, part 2 (v0.4):** U22–U24 keyboard, screen reader, contrast (skip link, focus after reorder, captions and `scope` are already in; still open: full contrast pass, Lighthouse ≥ 95).
- [x] **UX review 2 (v0.4):** U27 PPK group, U28 “Gdzie trafiają pieniądze”, U29 capital split (`capSplit`), U30 Prosty / Zaawansowany, U31 style = EDO share in Auto-podział (`mixAllocator`).
- [ ] **UX P3:** U25 reduced motion, print style, dark mode.
- [ ] **UX acceptance:** checks 1–8 and 10 pass in v0.3 (automated, Chrome, 390×844 and 1280×800); check 9 (Lighthouse) is still to run.
- [x] **N1 Personas** (Start view, 3 profiles, defaults with payout age, opening view, persona chip). Open: Senior → Wypłata when N2 exists.
- [ ] **N2 Withdrawal view** (strategies, account order, tax per account, “money lasts until age X”).
- [ ] **N3 Markdown save/load** (summary + state in front matter, round-trip test).
- [ ] **N4 Sources list** (`sources.js`, status per figure, ⚠️ markers in the UI).
- [x] **N5 Beginner guide** (6 click questions with “Co to znaczy?”, result card with approx. capital at 65, monthly income, simple plan, range, link to full app).
- [ ] **OKI:** confirm whether foreign UCITS ETFs count for the 100 000 zł exemption (now a config flag, default yes); tax on average value, not end-of-year value.
- [ ] **EDO:** roll over every 10 years with Belka at each maturity; early redemption fee (3 zł per 100 zł bond, max the interest).
- [ ] **IKZE:** refund arrives the next year (May), not at year end; early payout at PIT scale instead of flat 12%.
- [ ] **Second PIT bracket (32%)** for salary above 120 000 zł/year → IKZE refund 32%.
- [ ] **PPK details:** contribution range (0,5–4% employee, 1,5–4% employer), condition for the yearly 240 zł bonus, 25% lump sum + 75% in 120 instalments.
- [ ] **Choose asset inside each wrapper** (e.g. EDO or ETF EM inside IKE/IKZE) — now always ETF World.
- [ ] **Risk view:** “best” is only the highest return; add a range (e.g. simple Monte Carlo or bad/good-year band) so ETF EM does not look like a free win. (First step is U16: range from the 3 presets.)
- [ ] **Today’s money:** also deflate own contributions for a fair real-gain number.
- [ ] Generate F2 texts (12%, 250 zł, 3,5%) from config, not hard-coded strings.
- [ ] Monthly instead of yearly contributions (small difference, more realistic).
- [ ] Couple mode (two people = double IKE/IKZE/OKI limits).
- [ ] GitHub Action that runs `node tests.js` on every push.

## Out of scope
Self-employment limits (IKZE 18 059,40 zł), currency risk, fees other than TER, inheritance, real broker data.
