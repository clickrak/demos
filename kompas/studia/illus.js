// Line illustrations for the first screens. They draw themselves once (reduced motion: shown at once).
// One stroke colour per illustration from the line palette, so they match the results.
const draw = (vb, inner, label) => `<div class="illus" aria-hidden="true"><svg viewBox="${vb}" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</svg></div>`;
const P = (d, c, w = 3, i = 0) => `<path class="dl" style="--i:${i};stroke:${c}" stroke-width="${w}" pathLength="1" d="${d}"/>`;
const T = (x, y, t, c, i = 0, size = 13) => `<text class="dt" style="--i:${i};fill:${c}" x="${x}" y="${y}" font-size="${size}">${t}</text>`;

export const ILLUS = {
  // Start: a compass with three roads leaving it towards a school, people and the world.
  start: draw('0 0 520 300', `
    ${P('M30 262 H490', 'var(--line)', 2, 0)}
    ${P('M88 190 a62 62 0 1 0 124 0 a62 62 0 1 0 -124 0', 'var(--ink)', 3, 0)}
    ${P('M150 140 L162 190 L150 198 L138 190 Z', 'var(--l0)', 3, 2)}
    ${P('M150 128 V108 M150 252 V272 M88 190 H68 M212 190 H232', 'var(--muted)', 2, 1)}
    ${P('M190 150 C250 110 300 90 360 70', 'var(--l0)', 4, 3)}
    ${P('M205 180 C280 170 330 160 392 150', 'var(--l1)', 4, 4)}
    ${P('M200 215 C270 230 330 240 400 236', 'var(--l2)', 4, 5)}
    ${P('M362 70 l30 -14 l30 14 l-30 14 z M374 76 v16 c10 8 26 8 36 0 v-16', 'var(--l0)', 3, 6)}
    ${P('M401 140 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M425 144 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M396 172 c2 -12 26 -12 28 0 M424 172 c2 -9 18 -9 20 0', 'var(--l1)', 3, 7)}
    ${P('M414 236 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0 M414 236 H466 M440 210 c-12 14 -12 38 0 52 M440 210 c12 14 12 38 0 52', 'var(--l2)', 3, 8)}
    ${T(140, 95, 'N', 'var(--muted)', 2, 16)}`),
  // Certainty: a signpost with three arms, one still a question.
  pewnosc: draw('0 0 360 150', `
    ${P('M20 140 H340', 'var(--line)', 2)}
    ${P('M180 140 V20', 'var(--ink)', 4, 0)}
    ${P('M184 30 H270 l16 12 l-16 12 H184 Z', 'var(--l0)', 3, 1)}
    ${P('M176 64 H70 l-16 12 l16 12 H176 Z', 'var(--l1)', 3, 2)}
    ${P('M184 98 H250 l16 12 l-16 12 H184 Z', 'var(--l2)', 3, 3)}
    ${T(212, 47, 'wiem', 'var(--l0)', 4)}${T(78, 81, 'mam pomysł', 'var(--l1)', 5)}${T(208, 115, '?', 'var(--l2)', 6, 15)}`),
  // Matura: a stack of exam papers, a pen and a tick.
  matura: draw('0 0 360 150', `
    ${P('M20 140 H340', 'var(--line)', 2)}
    ${P('M110 128 L200 128 L210 40 L120 40 Z', 'var(--ink)', 3, 0)}
    ${P('M100 132 L190 132 L200 46', 'var(--muted)', 2, 1)}
    ${P('M134 62 H190 M132 78 H178 M130 94 H186', 'var(--muted)', 2, 2)}
    ${P('M140 108 l10 10 l20 -22', 'var(--l0)', 4, 3)}
    ${P('M236 126 L284 36 l10 5 L246 131 Z M236 126 l-4 12 l10 -7', 'var(--l1)', 3, 4)}
    ${T(214, 34, 'rozszerzenie', 'var(--l0)', 5, 12)}`),
  // Languages: overlapping speech bubbles.
  jezyki: draw('0 0 360 150', `
    ${P('M60 26 H180 a12 12 0 0 1 12 12 V82 a12 12 0 0 1 -12 12 H100 L76 112 V94 H60 a12 12 0 0 1 -12 -12 V38 a12 12 0 0 1 12 -12 Z', 'var(--l0)', 3, 0)}
    ${P('M170 56 H292 a12 12 0 0 1 12 12 V108 a12 12 0 0 1 -12 12 H280 V138 L256 120 H170 a12 12 0 0 1 -12 -12 V68 a12 12 0 0 1 12 -12 Z', 'var(--l2)', 3, 2)}
    ${T(78, 66, 'cześć · hello', 'var(--l0)', 3, 15)}${T(190, 96, 'привіт · hallo', 'var(--l2)', 4, 15)}`),
  // Activities: three cards fanned out.
  zajecia: draw('0 0 360 150', `
    ${P('M96 40 l70 -14 l18 92 l-70 14 Z', 'var(--l1)', 3, 0)}
    ${P('M146 24 h72 v96 h-72 Z', 'var(--l0)', 3, 1)}
    ${P('M200 30 l70 14 l-18 92 l-70 -14 Z', 'var(--l2)', 3, 2)}
    ${P('M182 60 c-6 -10 -20 -6 -18 5 c2 10 18 18 18 18 s16 -8 18 -18 c2 -11 -12 -15 -18 -5', 'var(--l0)', 3, 3)}
    ${P('M232 66 l10 -14 l10 6 l12 -16', 'var(--l2)', 3, 4)}
    ${P('M112 64 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M122 56 v-6 M122 82 v-6', 'var(--l1)', 3, 4)}
    ${T(120, 146, 'lubię · nie lubię · obojętne', 'var(--muted)', 5, 12)}`),
  // Situations: a path that forks, with a walker at the fork.
  sytuacje: draw('0 0 360 150', `
    ${P('M30 130 C110 130 150 110 180 82', 'var(--ink)', 4, 0)}
    ${P('M180 82 C210 54 250 36 330 30', 'var(--l0)', 4, 1)}
    ${P('M180 82 C220 92 270 104 330 112', 'var(--l1)', 4, 2)}
    ${P('M180 82 C200 50 210 30 220 14', 'var(--l2)', 4, 3)}
    ${P('M170 62 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M178 70 l-2 14 M176 84 l-6 12 M176 84 l6 12 M168 76 l14 -2', 'var(--ink)', 3, 4)}`)
  ,
  // Styl pracy: three sliders, each knob in a different place (no right answer).
  styl: draw('0 0 360 140', `
    ${P('M40 34 H320', 'var(--line)', 6, 0)}${P('M40 70 H320', 'var(--line)', 6, 0)}${P('M40 106 H320', 'var(--line)', 6, 0)}
    ${P('M40 34 H110', 'var(--l0)', 6, 1)}${P('M40 70 H250', 'var(--l1)', 6, 2)}${P('M40 106 H180', 'var(--l2)', 6, 3)}
    ${P('M110 34 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0', 'var(--l0)', 3, 4)}
    ${P('M250 70 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0', 'var(--l1)', 3, 5)}
    ${P('M180 106 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0', 'var(--l2)', 3, 6)}
    ${T(14, 39, 'sam', 'var(--muted)', 7, 11)}${T(326, 39, 'zespół', 'var(--muted)', 7, 11)}`),
  // Co jest ważne: five cards fanned out, the first one lifted with a heart.
  wartosci: draw('0 0 360 150', `
    ${P('M20 140 H340', 'var(--line)', 2, 0)}
    ${P('M60 132 l20 -80 l46 12 l-20 80 Z', 'var(--l4)', 3, 1)}
    ${P('M110 134 l8 -84 l46 4 l-8 84 Z', 'var(--l3)', 3, 2)}
    ${P('M196 138 l-8 -84 l46 -4 l8 84 Z', 'var(--l2)', 3, 3)}
    ${P('M254 136 l-20 -80 l46 -12 l20 80 Z', 'var(--l1)', 3, 4)}
    ${P('M150 104 V24 h56 v80 Z', 'var(--l0)', 4, 5)}
    ${P('M178 58 c-10 -12 -24 -2 -16 10 l16 14 l16 -14 c8 -12 -6 -22 -16 -10 Z', 'var(--l0)', 3, 6)}
    ${T(172, 98, '1', 'var(--l0)', 7, 14)}`),
  // Ile nauki: one road with three flags, short, middle and long, and a cap at the end.
  dlugosc: draw('0 0 360 140', `
    ${P('M20 112 C90 112 120 70 180 70 S280 40 340 40', 'var(--ink)', 4, 0)}
    ${P('M86 104 V64 l22 8 l-22 8', 'var(--l1)', 3, 1)}${T(70, 128, '2–2,5', 'var(--l1)', 2, 11)}
    ${P('M196 66 V26 l22 8 l-22 8', 'var(--l2)', 3, 3)}${T(184, 92, '3–3,5', 'var(--l2)', 4, 11)}
    ${P('M312 42 l22 -10 l22 10 l-22 10 Z M322 46 v12 c8 6 18 6 24 0 v-12', 'var(--l0)', 3, 5)}${T(310, 76, '5–6', 'var(--l0)', 6, 11)}`),
  // Niepokój: a cloud with a question mark, and the sun coming out behind it.
  niepokoj: draw('0 0 360 140', `
    ${P('M232 52 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0', 'var(--l3)', 3, 0)}
    ${P('M232 14 V4 M266 24 l8 -8 M278 52 h10 M198 24 l-8 -8', 'var(--l3)', 3, 1)}
    ${P('M110 112 h120 a26 26 0 0 0 0 -52 a36 36 0 0 0 -68 -6 a28 28 0 0 0 -52 58 Z', 'var(--ink)', 3, 2)}
    ${P('M160 74 a12 12 0 1 1 18 10 c-4 3 -6 5 -6 10', 'var(--l1)', 4, 3)}${P('M172 104 v1', 'var(--l1)', 5, 4)}`),
  // Chwila dla siebie: an open notebook, a pencil and a small light bulb.
  refleksja: draw('0 0 360 140', `
    ${P('M60 120 C100 108 140 108 180 120 C220 108 260 108 300 120 V40 C260 28 220 28 180 40 C140 28 100 28 60 40 Z M180 40 V120', 'var(--ink)', 3, 0)}
    ${P('M90 60 h60 M90 76 h50 M90 92 h56 M210 60 h60 M210 76 h40', 'var(--muted)', 2, 1)}
    ${P('M254 100 l40 -40 l8 8 l-40 40 l-12 4 Z', 'var(--l1)', 3, 2)}
    ${P('M300 22 a14 14 0 1 0 -22 12 v6 h16 v-6 a14 14 0 0 0 6 -12 Z M282 46 h12', 'var(--l3)', 3, 3)}`)
};
