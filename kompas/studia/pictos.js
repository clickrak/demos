// Small line pictures for the "Co lubisz robić" cards and the "Co robisz, gdy…" situations (v2.5).
// Same drawing style as icons.js (24×24, stroke = currentColor). Decorative: the card text stays the real content.
const svg = inner => `<svg class="picto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const ACT = {
  a1: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 8h18M8 4v13M13 4v13"/><circle cx="17.5" cy="17.5" r="3"/><path d="M19.6 19.6 22 22"/>', // bug in a sheet
  a2: '<circle cx="7" cy="8" r="2.5"/><circle cx="17" cy="8" r="2.5"/><path d="M3 19c0-3 1.8-5 4-5s4 2 4 5M13 19c0-3 1.8-5 4-5s4 2 4 5"/><path d="M10 4.5h4M12 2.5v4"/>', // explaining
  a3: '<path d="M4 20v-5a3 3 0 0 1 3-3h4"/><circle cx="8" cy="7" r="3"/><path d="M14 13h6v7h-6zM17 14.5v4M15 16.5h4"/>', // caring
  a4: '<path d="M3 20h18"/><path d="M6 20v-8h12v8M6 16h12"/><path d="M14 3l5 5-2 2-5-5zM12 5 7 10"/>', // build
  a5: '<path d="M4 20V4M4 20h16"/><circle cx="8" cy="15" r="1"/><circle cx="11" cy="11" r="1"/><circle cx="14" cy="13" r="1"/><circle cx="17" cy="8" r="1"/><path d="M7 17 18 6" stroke-dasharray="2 2"/>', // pattern
  a6: '<path d="M4 5h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9l-3 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M18 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v3l-3-3h-2"/>', // talk
  a7: '<path d="M3 5h8M7 3v2M4.5 5c.5 3 2.5 5 5.5 6M9.5 5c-.5 3-2.5 5-5.5 6"/><path d="m13 21 4-10 4 10M14.5 17.5h5"/>', // translate
  a8: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m8 15 2.5 2.5L16 13"/>', // plan
  a9: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>', // lab
  a10: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/><path d="M12 20h8"/>', // write
  a11: '<path d="M4 20V10M9 20V6M14 20v-8M19 20V4"/><path d="M3 20h18"/>', // track progress
  a12: '<circle cx="12" cy="5" r="2"/><path d="M12 7v6M8 21l4-8 4 8M7 10h10"/><path d="M4 13h2M18 13h2"/>', // lead warm-up
  a13: '<rect x="4" y="7" width="10" height="10" rx="1.5"/><path d="M14 10h3M14 14h3M7 4v3M11 4v3M7 17v3M11 17v3"/><path d="m18 6 3-3M19 3h2v2"/>', // take apart
  a14: '<path d="M3 11v2l11 5V6z"/><path d="M14 9a3 3 0 0 1 0 6"/><path d="M6 14l1 6h3l-1-5"/>', // convince
  a15: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 12h8M8 16h5"/>', // organise files
  a16: '<circle cx="12" cy="4" r="2"/><path d="M12 6v9M8 21l4-6 4 6M6 10l6-2 6 2"/><path d="M12 11.5c-.9-1.2-2.6-.5-2 .8l2 1.7 2-1.7c.6-1.3-1.1-2-2-.8z"/>', // brain
  a17: '<rect x="4" y="3" width="11" height="15" rx="1.5"/><path d="M7 7h5M7 10h5M7 13h3"/><circle cx="17.5" cy="15" r="2.5"/><path d="M14 21c.4-2 1.8-3 3.5-3s3.1 1 3.5 3"/>', // help with office
  a18: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="m8 9-2 2 2 2M16 9l2 2-2 2M13 8l-2 6"/><path d="M8 21h8"/>', // code
  a19: '<path d="M3 20l6-9 4 5 3-3 5 7z"/><circle cx="17" cy="6" r="2"/><path d="M5 8l1 1M8 5l.5 1.5"/>', // outdoors
  a20: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>', // world news
  a21: '<path d="M4 20V8l8-5 8 5v12"/><path d="M4 20h16"/><path d="M9 20v-6h6v6"/><path d="M16 11l3-3"/>', // draw a room
  a22: '<path d="M3 12l7-7h6l5 5v6l-7 7z" transform="scale(.92) translate(1 1)"/><circle cx="15" cy="8" r="1.4"/><path d="M8 13l3 3"/>', // price tag
  a23: '<rect x="3" y="7" width="13" height="10" rx="2"/><path d="m16 11 5-3v8l-5-3"/><circle cx="9.5" cy="12" r="2"/>', // film
  a24: '<rect x="2" y="6" width="20" height="12" rx="6"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="11" r="1"/><circle cx="18" cy="13" r="1"/>', // game design
  a25: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/><path d="M9 9l11-2"/>', // perform
  a26: '<path d="M12 21v-8"/><path d="M12 13c0-4 3-7 7-7 0 4-3 7-7 7zM12 15c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z"/><path d="M6 21h12"/>', // plants
  a27: '<path d="M12 3v18M7 21h10"/><path d="M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0zM19 7l-2.5 6a3 3 0 0 0 5 0z"/>', // scales
  a28: '<path d="M4 21V9l4-3v15M8 21V5l4-2 4 2v16M16 21V9l4 3v9M3 21h18"/><path d="M11 9h2M11 13h2"/>', // old building
  a29: '<path d="M4 11h16v2a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z"/><path d="M9 7c0-1.5 1-1.5 1-3M13 7c0-1.5 1-1.5 1-3"/><path d="M2 11h2M20 11h2"/>', // cook
  a30: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3"/><path d="m8 10 1.5 1.5L12 9M8 15l1.5 1.5L12 14M14 10.5h2M14 15.5h2"/>', // survey
  a31: '<path d="M4 4h16v16H4z"/><path d="M7 8h4M9 6v4M14 8h3M7 15l3 3M10 15l-3 3M14 15h3M14 17.5h3"/>',  // maths
  a32: '<path d="M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M6 13c2-3 5-4 8-3 2 .7 3 2 4 3-3 1-6 1-8 0"/><circle cx="15" cy="11" r=".6"/><path d="M5 9l1-1M8 6l.5-1.5"/>',
  a33: '<path d="M2 14l9-2 6-6c1-1 3-1 3 0s0 2-1 3l-6 6-2 9-2-1v-6l-4 1-1-2z"/>',
  a34: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V4h6v3M4 12h16"/><circle cx="17" cy="16" r="1"/>',
  a35: '<rect x="4" y="4" width="16" height="12" rx="1"/><path d="M4 13l4-4 3 3 3-2 6 5"/><circle cx="15" cy="8" r="1.4"/><path d="M8 20h8M12 16v4"/>',
  a36: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 12h6M10 15h6M10 18h3"/><circle cx="17" cy="18" r="3"/><path d="M19 20l2 2"/>',
  a37: '<path d="M3 21h18"/><rect x="5" y="9" width="14" height="12"/><path d="M5 9l7-5 7 5M5 15h14M12 9v12"/>',
  a38: '<path d="M4 4h16v4H4zM6 8v9h12V8"/><path d="M12 8v4"/><path d="M9 17l3-3 3 3"/><path d="M4 21h16"/>',
  a39: '<circle cx="7" cy="6" r="2.5"/><circle cx="15" cy="10" r="1.8"/><circle cx="20" cy="10" r="1.8"/><path d="M3 21v-5a4 4 0 0 1 8 0v5M13 21v-3a2 2 0 0 1 4 0v3M18 21v-3a2 2 0 0 1 4 0"/>',
  a40: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h4M7 13h4M7 17h4"/><path d="M14 13l2 2 4-4"/>',
  a41: '<circle cx="6" cy="7" r="2.5"/><circle cx="18" cy="7" r="2.5"/><path d="M2 21v-4a4 4 0 0 1 8 0v4M14 21v-4a4 4 0 0 1 8 0v4"/><path d="M10 11h4"/><path d="M12 9v4"/>',
  a42: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/>',
  a43: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  a44: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 9h8M8 12h8M8 15h5"/><circle cx="17" cy="17" r="3"/><path d="M19 19l2.5 2.5"/>',
  a45: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/><path d="M9 12h6M12 9v6"/>'
};
const SIT = {
  e1: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 20h10M12 16v4"/><path d="M8 9l2 2-2 2M12 13h4"/>', // group project
  e2: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 11v5M9.5 13.5h5"/>', // own project
  e3: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2"/><path d="M12 10v7M8.5 13.5h7"/>', // sprained ankle
  e4: '<path d="M4 20V10l4-3 4 3 4-3 4 3v10z"/><path d="M8 20v-5h3v5M14 13h3v3h-3z"/>', // city project
  e5: '<path d="M4 4h7v6H6l-2 2zM20 8h-7v6h5l2 2z"/><path d="M8 20h8M12 16v4"/>', // debate
  e6: '<path d="M3 17h18M5 17V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/><path d="M5 12h14"/>',  // class trip bus
  e7: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17"/><path d="M15 7l2-2M7 17l-2 2"/><path d="M9 9l6 6"/>',
  e8: '<path d="M4 20h16"/><rect x="5" y="9" width="14" height="8" rx="1"/><path d="M12 9v8M5 13h3M16 13h3"/><circle cx="12" cy="13" r="1.5"/><path d="M8 5h8"/>',
  e9: '<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5"/><path d="M12 5V2l3 1-3 1"/>' // school jubilee
};
// Colour from the card's main interest, so a row of cards reads at a glance (same line palette as the results).
const DIM_COLOR = { ana: 'var(--l0)', tec: 'var(--l1)', spo: 'var(--l2)', twr: 'var(--l3)', prz: 'var(--l4)', sys: 'var(--accent)' };
const mainDim = w => Object.entries(w || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
export const actPicto = a => ACT[a.id] ? `<span class="picto-w" style="--pc:${DIM_COLOR[mainDim(a.w)] || 'var(--accent)'}">${svg(ACT[a.id])}</span>` : '';
export const sitPicto = q => SIT[q.id] ? `<span class="picto-w sit">${svg(SIT[q.id])}</span>` : '';
export const PICTO_IDS = { act: Object.keys(ACT), sit: Object.keys(SIT) };
