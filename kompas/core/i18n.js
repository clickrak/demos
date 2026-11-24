// Kompas i18n (Studia v3.1). Two languages: 'pl' (default) and 'ua' (Ukrainian).
// Texts live in JSON files (key -> string with {name} placeholders). A missing key in the active language falls back to Polish,
// a key missing everywhere returns the key itself so the gap is visible. No network call here: the app fetches the files like other data.
export const LANGS = ['pl', 'ua'];
export const HTML_LANG = { pl: 'pl', ua: 'uk' }; // value for <html lang>
const dict = { pl: {}, ua: {} };
let lang = 'pl';

export const normLang = l => { l = String(l || '').toLowerCase(); return l === 'uk' ? 'ua' : LANGS.includes(l) ? l : 'pl'; };
export const getLang = () => lang;
export function setLang(l) { lang = normLang(l); return lang; }
export function loadDict(l, obj) { dict[normLang(l)] = obj || {}; }

const fill = (s, p) => (p ? s.replace(/\{(\w+)\}/g, (m, k) => (p[k] === undefined ? m : p[k])) : s);
export function t(key, params) {
  const s = dict[lang][key] ?? dict.pl[key];
  return s === undefined ? key : fill(s, params);
}
export const has = (key, l = lang) => dict[l][key] !== undefined;

// Plural form. forms: { one, few, many } (a string, or a key). Polish and Ukrainian share the same three-way rule for whole numbers:
// 1 -> one; 2-4 (not 12-14) -> few; everything else -> many.
export function pluralForm(n) {
  n = Math.abs(Math.trunc(Number(n) || 0));
  const m10 = n % 10, m100 = n % 100;
  if (n === 1) return 'one';
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'few';
  return 'many';
}
// plural(n, 'key') looks up key.one / key.few / key.many and fills {n}.
export function plural(n, key, params) {
  return t(`${key}.${pluralForm(n)}`, { n, ...(params || {}) });
}
