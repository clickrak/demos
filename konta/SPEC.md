# Konta Inwestycyjne — spec

**Goal:** small static web app (GitHub Pages) that compares Polish investment vehicles and builds simple scenarios for a given capital and monthly contribution.

**Tech:** one page, plain HTML + CSS + vanilla JS, Chart.js (stored in `vendor/`, so it works offline), no backend, no build step, no tracking. UI in Polish, mobile friendly. All numbers live in `config.js` and are editable in the UI.

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

## v0.2 — new features (requested)

**N1. Personas (start screen).** User picks one of 3 profiles; it sets default inputs and which tabs come first.

| Persona | Typical user | Main goal | Default inputs | Tabs first |
|---|---|---|---|---|
| Młody (20–35) | first job, small capital | plan and simulate | age 28, capital 5 000 zł, 500 zł/month, 35 years | Porównanie, Scenariusze |
| Średni (35–55) | stable income, some savings | simulate and optimise (use limits, IKZE refund) | age 45, capital 50 000 zł, 1 500 zł/month, 20 years | Auto-podział, Wyniki |
| Senior (55+) | close to retirement | plan retirement, optimise withdrawals | age 60, capital 300 000 zł, 0 zł/month | Wypłata kapitału |

**N2. New tab “Wypłata kapitału” (withdrawal scenarios).**
- Start: capital at retirement taken from the saving result, or typed in, split by account (IKE, IKZE, OKI, PPK, PPE, EDO, ETF).
- Strategies: fixed monthly amount (indexed by inflation or not); fixed % per year (e.g. 4%); “spend all by age X”.
- Order of withdrawal between accounts (e.g. taxable ETF first, IKE last), editable like the auto-split order.
- Tax rules per account: IKE 0%, IKZE 10% (whole or spread over years), PPK 25% at once + 75% in at least 120 instalments, OKI asset tax continues, ETF/EDO 19% on the gain part of each withdrawal.
- Output: net monthly income, age when money runs out, taxes paid, chart of the remaining capital; same 3 market presets.

**N3. Save and load as Markdown.** “Zapisz .md” downloads one file: readable summary (inputs, assumptions, results table, sources date) plus the full app state in a front-matter block (YAML or JSON) so “Wczytaj .md” can restore it. Works offline, nothing is sent anywhere.

**N4. New tab “Źródła” (sources to check).** List of official sources behind every number: what it backs, link, date last checked, status (✅ checked / ⚠️ to verify). Kept in one file (`sources.js`) so it is easy to update every year (limits change each November). Items marked ⚠️ also show a small warning next to the number in the app.

**N5. Guide for beginners (“Przewodnik”).** Default view for the Młody persona (N1), also reachable from a “Zacznij tutaj” button. One simple question per screen, answers by clicking a choice (with “inna kwota” for typing), progress dots, back button. Every question has a “Co to znaczy?” link that opens a 2–3 sentence explanation in plain words.

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
- Buttons: “Zobacz szczegóły” (opens the full app with these inputs filled in), “Zapisz .md” (N3), “Zacznij od nowa”.
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
- [ ] **N1 Personas** (start screen, 3 profiles, defaults + tab order).
- [ ] **N2 Withdrawal tab** (strategies, account order, tax per account, “money lasts until age X”).
- [ ] **N3 Markdown save/load** (summary + state in front matter, round-trip test).
- [ ] **N4 Sources tab** (`sources.js`, status per figure, ⚠️ markers in the UI).
- [ ] **N5 Beginner guide** (6 click questions with “Co to znaczy?”, result card with approx. capital at 65, monthly income, simple plan, range, link to full app).
- [ ] **OKI:** confirm whether foreign UCITS ETFs count for the 100 000 zł exemption (now a config flag, default yes); tax on average value, not end-of-year value.
- [ ] **EDO:** roll over every 10 years with Belka at each maturity; early redemption fee (3 zł per 100 zł bond, max the interest).
- [ ] **IKZE:** refund arrives the next year (May), not at year end; early payout at PIT scale instead of flat 12%.
- [ ] **Second PIT bracket (32%)** for salary above 120 000 zł/year → IKZE refund 32%.
- [ ] **PPK details:** contribution range (0,5–4% employee, 1,5–4% employer), condition for the yearly 240 zł bonus, 25% lump sum + 75% in 120 instalments.
- [ ] **Choose asset inside each wrapper** (e.g. EDO or ETF EM inside IKE/IKZE) — now always ETF World.
- [ ] **Risk view:** “best” is only the highest return; add a range (e.g. simple Monte Carlo or bad/good-year band) so ETF EM does not look like a free win.
- [ ] **Today’s money:** also deflate own contributions for a fair real-gain number.
- [ ] Generate F2 texts (12%, 250 zł, 3,5%) from config, not hard-coded strings.
- [ ] Monthly instead of yearly contributions (small difference, more realistic).
- [ ] Payout phase: monthly income from the pot after retirement.
- [ ] Couple mode (two people = double IKE/IKZE/OKI limits).
- [ ] GitHub Action that runs `node tests.js` on every push.

## Out of scope
Self-employment limits (IKZE 18 059,40 zł), currency risk, fees other than TER, inheritance, real broker data.
