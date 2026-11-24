// Overlays (Studia v3.3): a language file with the same shape as a data file, holding only the text fields.
// Arrays of objects are matched by `id`; arrays of strings are replaced when the length matches; objects merge by key;
// anything missing in the overlay stays Polish (never an empty field). New keys (for example subjectNames) are added.
export function overlay(base, ov) {
  if (ov === undefined || ov === null) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(ov)) return base;
    if (base.length && base[0] && typeof base[0] === 'object' && 'id' in base[0]) {
      const m = new Map(ov.filter(x => x && x.id !== undefined).map(x => [x.id, x]));
      return base.map(b => overlay(b, m.get(b.id)));
    }
    return ov.length === base.length && ov.every(x => typeof x === 'string' && x.trim()) ? ov : base;
  }
  if (base && typeof base === 'object') {
    if (typeof ov !== 'object' || Array.isArray(ov)) return base;
    const out = { ...base };
    for (const k of Object.keys(ov)) out[k] = k in base ? overlay(base[k], ov[k]) : ov[k];
    return out;
  }
  return typeof ov === 'string' && ov.trim() ? ov : base;
}
