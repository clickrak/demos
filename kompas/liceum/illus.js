// Line illustrations for Kompas Liceum, in the same style as Studia (illus.js): strokes draw themselves once,
// colours come from the line palette (--l0..--l5), so every skin (calm, neon, pop) recolours them.
const draw = (vb, inner) => `<div class="illus" aria-hidden="true"><svg viewBox="${vb}" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</svg></div>`;
const P = (d, c, w = 3, i = 0) => `<path class="dl" style="--i:${i};stroke:${c}" stroke-width="${w}" pathLength="1" d="${d}"/>`;
const T = (x, y, t, c, i = 0, size = 13) => `<text class="dt" style="--i:${i};fill:${c}" x="${x}" y="${y}" font-size="${size}">${t}</text>`;
const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const LILLUS = {
  // School step: a report card with three bars (słabo / dobrze / świetnie) and a pencil ticking one.
  szkola: draw('0 0 520 260', `
    ${P('M30 238 H490', 'var(--line)', 2, 0)}
    ${P('M120 30 H330 V230 H120 Z', 'var(--ink)', 3, 0)}
    ${P('M145 62 H250 M145 84 H210', 'var(--muted)', 3, 1)}
    ${P('M150 200 V170 H180 V200', 'var(--l3)', 4, 2)}
    ${P('M200 200 V140 H230 V200', 'var(--l0)', 4, 3)}
    ${P('M250 200 V108 H280 V200', 'var(--l1)', 4, 4)}
    ${P('M145 210 H305', 'var(--muted)', 2, 2)}
    ${P('M360 190 L440 70 L462 84 L382 204 L356 214 Z M432 82 L454 96', 'var(--l2)', 3, 5)}
    ${P('M372 120 l14 14 l26 -30', 'var(--l5)', 4, 6)}
    ${T(150, 225, 'słabo', 'var(--muted)', 6, 11)}${T(200, 225, 'dobrze', 'var(--muted)', 6, 11)}${T(248, 225, 'świetnie', 'var(--muted)', 6, 11)}`),

  // School catalogue: a small Kraków skyline (two church towers, Wawel tower, blocks) with map pins over it.
  szkoly: draw('0 0 520 250', `
    ${P('M20 228 H500', 'var(--line)', 2, 0)}
    ${P('M60 228 V170 H100 V228 M70 170 V150 H90 V170', 'var(--muted)', 3, 1)}
    ${P('M140 228 V110 L152 84 L164 110 V228 M176 228 V126 L186 106 L196 126 V228 M140 150 H196', 'var(--ink)', 3, 1)}
    ${P('M230 228 V160 H300 V228 M245 160 V140 L265 120 L285 140 V160', 'var(--muted)', 3, 2)}
    ${P('M330 228 V150 H390 V228 M342 170 H352 M368 170 H378 M342 196 H352 M368 196 H378', 'var(--muted)', 3, 2)}
    ${P('M420 228 V120 L440 96 L460 120 V228 M432 140 H448', 'var(--ink)', 3, 3)}
    ${P('M110 228 C 200 248 320 206 470 236', 'var(--l0)', 4, 3)}
    ${P('M168 40 c-16 0 -26 12 -26 26 c0 20 26 40 26 40 c0 0 26 -20 26 -40 c0 -14 -10 -26 -26 -26 z ' + circle(168, 66, 8), 'var(--l1)', 3, 4)}
    ${P('M300 70 c-13 0 -21 10 -21 21 c0 16 21 32 21 32 c0 0 21 -16 21 -32 c0 -11 -8 -21 -21 -21 z ' + circle(300, 91, 6), 'var(--l5)', 3, 5)}
    ${P('M430 34 c-11 0 -18 8 -18 18 c0 14 18 28 18 28 c0 0 18 -14 18 -28 c0 -10 -7 -18 -18 -18 z ' + circle(430, 52, 5), 'var(--l3)', 3, 6)}`),

  // Results: compass needle pointing along a road to a flag on a hill.
  wyniki: draw('0 0 520 240', `
    ${P('M20 220 H500', 'var(--line)', 2, 0)}
    ${P(circle(110, 140, 56), 'var(--ink)', 3, 0)}
    ${P('M110 92 V80 M110 200 V188 M58 140 H46 M174 140 H162', 'var(--muted)', 2, 1)}
    ${P('M110 140 L150 104 L118 148 Z', 'var(--l1)', 3, 2)}
    ${P('M110 140 L70 176 L102 132 Z', 'var(--muted)', 3, 2)}
    ${P('M170 190 C240 200 290 150 350 140 C390 134 410 120 430 96', 'var(--l0)', 4, 3)}
    ${P('M330 220 C370 170 420 100 470 220', 'var(--l2)', 3, 4)}
    ${P('M430 96 V40 M430 40 L466 52 L430 64', 'var(--l3)', 3, 5)}
    ${P('M200 60 l6 -12 l6 12 l12 6 l-12 6 l-6 12 l-6 -12 l-12 -6 z', 'var(--l5)', 2, 6)}`),

  // Nothing found: a magnifying glass over an empty card.
  pusto: draw('0 0 300 150', `
    ${P('M40 30 H190 V130 H40 Z', 'var(--muted)', 3, 0)}
    ${P('M60 60 H150 M60 82 H120', 'var(--line)', 3, 1)}
    ${P(circle(200, 80, 34), 'var(--l0)', 4, 2)}
    ${P('M224 104 L262 140', 'var(--l1)', 6, 3)}`)
};
