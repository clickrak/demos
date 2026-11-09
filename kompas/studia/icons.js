// Line icons for Kompas, one accent colour, drawn with currentColor. Inline SVG, no images.
const svg = (inner, vb = '0 0 24 24', cls = 'ico') =>
  `<svg class="${cls}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const P = {
  ludzie: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 20c.3-2.6 2-4.5 4.3-4.5 1.4 0 2.5.6 3.2 1.5"/>',
  jezyki: '<path d="M4 4h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M17 8h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-4-3h-3a2 2 0 0 1-2-1.6"/>',
  zdrowie: '<path d="M12 20s-7-4.4-9-9a4.5 4.5 0 0 1 9-2 4.5 4.5 0 0 1 9 2c-2 4.6-9 9-9 9z"/><path d="M6 12h3l1.5-3 2 5 1.5-2H18"/>',
  analityka: '<path d="M4 20V4M4 20h16"/><path d="M7 15l4-4 3 3 5-6"/>',
  technika: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  bezpieczenstwo: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  ruch: '<circle cx="15" cy="4.5" r="2"/><path d="M7 21l3.5-6 3 2.5V22M9 10l3.5-2.5 3 3 3.5 1M12.5 7.5 10.5 13M4.5 13l3-3"/>',
  organizacja: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h4a3 3 0 0 1 3 3V14"/>',
  demografia: '<circle cx="6" cy="9" r="2"/><circle cx="12" cy="7" r="2.5"/><circle cx="18" cy="9" r="2"/><path d="M2.5 18c.5-2.5 2-4 3.5-4M21.5 18c-.5-2.5-2-4-3.5-4M7 19c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5"/>',
  starzenie: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
  energia: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  automatyzacja: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  woda: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'
};
P.bezpieczenstwoF = P.bezpieczenstwo;

const SCEN = {
  A: '<path d="M2 34h60"/><circle cx="14" cy="13" r="5"/><path d="M14 4v2M14 20v2M5 13h2M21 13h2M7.6 6.6l1.4 1.4M19 18l1.4 1.4M7.6 19.4 9 18M19 8l1.4-1.4"/><path d="M45 34V15M45 15l-8-5M45 15l8-5M45 15V6"/><path d="M27 34l5-7 5 7"/>',
  B: '<path d="M2 34h60"/><path d="M4 27l8-6 6 5 8-10 7 7 9-9 8 6 9-4"/><path d="M41 9a5 5 0 0 1 9 1 4 4 0 0 1 1 8H39a4 4 0 0 1 2-9z"/>',
  C: '<path d="M2 34h60"/><path d="M20 6l9 3v7c0 5-4 9-9 10-5-1-9-5-9-10V9z"/><path d="M46 8v18M40 20l6 6 6-6"/>'
};

export const icon = (name, cls) => svg(P[name] || P.technika, '0 0 24 24', cls || 'ico');
export const scenArt = id => svg(SCEN[id] || '', '0 0 64 40', 'scenart');
export const FORCE_ICON = { demografia: 'demografia', starzenie: 'starzenie', energia: 'energia', bezpieczenstwo: 'bezpieczenstwo', automatyzacja: 'automatyzacja' };
