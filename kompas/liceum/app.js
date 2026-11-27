// Kompas Liceum v2.15.0. Screens, soft school self-assessment, results and export. One area at a time (Kraków or Tychy); travel time from the kid's district.
import { provenStrengths } from '../core/scoring.js';
import { parseSaved } from '../core/export.js';
import { t, plural, setLang, getLang, loadDict, LOCALE, HTML_LANG } from '../core/i18n.js';
import { visibleActivities, profilesFor, scoreLiceum, examPoints, certificatePoints, scoredSubjects, effectivePoints, CHANCE_TXT, subjectName, checkClass, LANG_TXT, ENTRY_KIND } from './points.js';
import { icon } from '../studia/icons.js';
import { LILLUS } from './illus.js';
import { ILLUS } from '../studia/illus.js';

const $app = document.getElementById('app');
const TEST = new URLSearchParams(location.search).has('test');
let data, A, studiaOffers = [];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const f1 = n => Number(n).toLocaleString(LOCALE[getLang()], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f2 = n => Number(n).toLocaleString(LOCALE[getLang()], { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const blank = () => ({ name: '', sort: {}, sortPos: 0, situations: {}, sitPos: 0, sliders: {}, values: [], strengths: [],
  points: { mode: 'soft', soft: { exam: {}, grades: {} }, exam: {}, grades: {}, stripe: false, volunteering: false, achievements: 0 }, area: null, checks: {}, reflection: {}, worlds: [], region: 'krakow', from: null, bi: null, lastScreen: null, bigText: false, calm: false, profile: null, likes: { profiles: [], schools: [], classes: [] } });

async function load() {
  const get = p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  // Interface texts (v2.15, UA1): liceum/i18n/{pl,ua}.json over the shared core texts; ?lang=ua picks Ukrainian (core/i18n.js).
  // The shared drawings (studia/illus.js) read their few labels ("illus.*") from the Studia file; take only those (fix 2.14.0).
  const dictOf = p => fetch(p).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  const illusOf = d => Object.fromEntries(Object.entries(d).filter(([k]) => k.startsWith('illus.')));
  const [coreTxt, studiaTxt, licTxt, coreUa, studiaUa, licUa] = await Promise.all(['../core/i18n/pl.json', '../studia/i18n/pl.json', 'i18n/pl.json', '../core/i18n/ua.json', '../studia/i18n/ua.json', 'i18n/ua.json'].map(dictOf));
  loadDict('pl', { ...illusOf(studiaTxt), ...coreTxt, ...licTxt });
  loadDict('ua', { ...illusOf(studiaUa), ...coreUa, ...licUa });
  setLang(new URLSearchParams(location.search).get('lang'));
  const [dimensions, strengths, config, questions, opportunities, schools, sources, personas, profiles] = await Promise.all([
    '../core/dimensions.json', '../core/strengths.json', 'data/config.json', 'data/questions.json', 'data/opportunities.json',
    'data/db/pl/krakow/schools.json', 'data/sources.json', 'data/personas.json', 'data/profiles.json'].map(get));
  // Other towns: one schools.json per ready town, next to krakow/. A school without `town` is from Kraków (old data).
  const more = await Promise.all((config.towns || []).filter(t => t.status === 'ready' && t.id !== 'krakow').map(t => get(`data/db/pl/${t.id}/schools.json`)));
  // Waiting schools (v2.9, P9): "geoPending" = no checked map point yet; ignored everywhere until the geocoding Action clears it.
  const allSchools = [...schools, ...more.flat()].filter(x => !x.geoPending).map(x => (x.town ? x : { ...x, town: 'krakow' }));
  // Travel times (backlog M2): computed ahead by a GitHub Action from timetables; optional per town, no calls at run time.
  const travel = {};
  await Promise.all((config.towns || []).filter(t => t.status === 'ready').map(t => fetch(`data/db/pl/${t.id}/travel.json`).then(r => (r.ok ? r.json() : null)).then(j => { if (j) travel[t.id] = j; }).catch(() => {})));
  // Matura ranking (K2, G1): one ranked list per area, computed ahead; optional. rank[schoolId] = place in its list.
  const rank = {};
  await Promise.all([['krakow', 'krakow'], ['gzm', 'gzm']].map(([f, where]) => fetch(`data/db/pl/${f}/ranking.json`).then(r => (r.ok ? r.json() : null)).then(j => {
    if (!j) return;
    for (const [k, word] of [['licea', 'licea'], ['technika', 'technika']]) for (const x of j[k] || []) if (x.kompasId) rank[x.kompasId] = { order: x.order, total: j[k].length, word, where, p: x.perspektywy, o: x.otouczelnie, src: k === 'licea' ? [j.sourceIds.perspektywyLicea, j.sourceIds.otouLicea] : [j.sourceIds.perspektywyTechnika, j.sourceIds.otouTechnika] };
  }).catch(() => {})));
  const rankSrc = new Set(Object.values(rank).flatMap(r => r.src || []));
  data = { dimensions, strengths, config, questions, opportunities, schools: allSchools, allSchools, sources, personas, profiles, travel, rank, rankSrc };
  // Studia programmes, to show what each area leads to after liceum (optional).
  studiaOffers = await fetch('../studia/data/db/pl/krakow/offers.json').then(r => (r.ok ? r.json() : [])).catch(() => []);
  A = blank(); applyTowns();
  applyStatic(); applyTheme(); applySkin();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  window.addEventListener('hashchange', render);
  render();
}

// ---- state, theme, skin -------------------------------------------------------------------------------------------
const answersKey = () => JSON.stringify({ ...A, sortPos: undefined, sitPos: undefined, lastScreen: undefined, bigText: undefined, calm: undefined });
let savedSnap = null, notice = '', theme = null;
const SKINS = ['neon', 'pop', null], SKIN_NAME = k => t(`lic.skin.${k || 'calm'}`);
const skinQ = new URLSearchParams(location.search).get('skin');
let skin = skinQ === 'calm' ? null : skinQ && SKINS.includes(skinQ) ? skinQ : 'neon'; // neon is the default look
const hasAnswers = () => !!(A && (Object.keys(A.sort).length || A.values.length || A.strengths.length));
const isDirty = () => hasAnswers() && answersKey() !== savedSnap;
const save = () => document.querySelectorAll('.savebtn').forEach(b => b.classList.toggle('dirty', isDirty()));
window.addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });
function toast(html) {
  const t = document.getElementById('toast'); if (!t) return;
  t.innerHTML = html; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 5200);
}
const ICON = {
  sun: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  palette: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15.5" cy="7.5" r="1"/></svg>'
};
function applyTheme() {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme; else delete root.dataset.theme;
  const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.querySelectorAll('[data-themetoggle]').forEach(b => { b.setAttribute('aria-label', t(dark ? 'lic.theme.toLight' : 'lic.theme.toDark')); b.innerHTML = b.classList.contains('linkbtn') ? t(dark ? 'lic.theme.light' : 'lic.theme.dark') : dark ? ICON.sun : ICON.moon; });
}
// Texts that sit in index.html (data-i18n, data-i18n-attr), <html lang>, the title and the PL / UA switch (v2.15, copied from Studia).
function applyStatic() {
  const lang = getLang();
  document.documentElement.lang = HTML_LANG[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(',').forEach(pair => { const [a, k] = pair.split(':'); el.setAttribute(a, t(k)); }));
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('lic.meta.desc', { v: data?.config?.appVersion || '' }));
  document.querySelectorAll('[data-uilang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.uilang === lang)));
  document.querySelectorAll('[data-onlylang]').forEach(el => { el.hidden = !el.dataset.onlylang.split(' ').includes(lang); }); // the AI notice shows in Ukrainian only
  const u = new URL(location.href);
  if (lang === 'pl') u.searchParams.delete('lang'); else u.searchParams.set('lang', lang);
  history.replaceState(null, '', u);
}
function switchLang(l) { setLang(l); applyStatic(); applyTheme(); applySkin(); render(); }
// Comfort (backlog U1): bigger text and calmer motion, kept in the saved file.
const calm = () => !!(A && A.calm) || matchMedia('(prefers-reduced-motion: reduce)').matches;
function applyComfort() {
  const root = document.documentElement;
  root.classList.toggle('big', !!(A && A.bigText)); root.classList.toggle('calm', !!(A && A.calm));
  document.querySelectorAll('[data-big]').forEach(b => b.setAttribute('aria-pressed', String(!!A.bigText)));
  document.querySelectorAll('[data-calm]').forEach(b => b.setAttribute('aria-pressed', String(!!A.calm)));
}
function applySkin(animate) {
  const root = document.documentElement;
  if (skin) root.dataset.skin = skin; else delete root.dataset.skin;
  const next = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length];
  document.querySelectorAll('[data-skintoggle]').forEach(b => { b.setAttribute('aria-pressed', String(!!skin)); b.setAttribute('aria-label', t('lic.skin.label', { cur: SKIN_NAME(skin), next: SKIN_NAME(next) })); b.innerHTML = ICON.palette; });
  document.querySelectorAll('[data-skinpick]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.skinpick || null) === skin)));
  const u = new URL(location.href);
  if (skin === 'neon') u.searchParams.delete('skin'); else u.searchParams.set('skin', skin || 'calm');
  history.replaceState(null, '', u);
  if (animate && !calm()) {
    root.classList.remove('skin-in'); void root.offsetWidth; root.classList.add('skin-in');
    clearTimeout(applySkin.h); applySkin.h = setTimeout(() => root.classList.remove('skin-in'), 700);
  }
}

// ---- area: the kid picks ONE area (Kraków and towns around it, or Tychy and later GZM). Schools outside it are ignored
// everywhere: scoring, compass, lists, likes, map and export. Areas never mix.
const TOWNS = () => data.config.towns || [{ id: 'krakow', name: 'Kraków', in: 'w Krakowie', status: 'ready' }];
// Names of areas and towns: Polish from config.json; another language may give its own in lic.region.* / lic.town.* (v2.15).
const tOr = (key, pl) => (getLang() === 'pl' || t(key) === key ? pl : t(key));
const townName = tw => tOr(`lic.town.${tw.id}`, tw.name);
const townOf = id => TOWNS().find(t => t.id === id) || TOWNS()[0];
const REGIONS = () => (data.config.regions || [{ id: 'krakow', name: 'Kraków', in: 'w Krakowie', towns: ['krakow'], status: 'ready' }]).filter(r => r.status === 'ready');
const region = () => REGIONS().find(r => r.id === (A && A.region)) || REGIONS()[0];
const selTowns = () => region().towns;
function applyTowns() { const w = selTowns(); data.schools = data.allSchools.filter(s => w.includes(s.town)); }
const townsIn = () => tOr(`lic.region.${region().id}.in`, region().in);
const townNames = () => tOr(`lic.region.${region().id}.name`, region().name);
// Travel time from the kid's district to a school, in minutes (null when unknown or no district chosen).
const origins = () => selTowns().flatMap(t => (data.travel[t] && data.travel[t].origins) || []);
const fromName = () => (origins().find(o => o.id === A.from) || {}).name || '';
const mins = school => { const t = data.travel[school.town]; const v = A.from && t && t.schools[school.id] && t.schools[school.id][A.from]; return v == null || v === false ? null : v; };
const minTxt = school => { const m = mins(school); return m == null ? '' : t('lic.min', { m }); };
const transitLinks = () => (region().transit || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)} ↗</a>`).join(' · ');
const regionChips = () => `<div class="chips" role="radiogroup" aria-label="${t('lic.towns.aria')}">${REGIONS().map(r =>
  `<button class="chip" role="radio" data-region="${r.id}" aria-checked="${region().id === r.id}" aria-pressed="${region().id === r.id}">${esc(tOr(`lic.region.${r.id}.name`, r.name))}</button>`).join('')}</div>`;

// ---- screens ------------------------------------------------------------------------------------------------------
const acts = () => visibleActivities(A, data);
const syncSort = () => { const v = acts(), i = v.findIndex(x => !(x.id in A.sort)); A.sortPos = i < 0 ? v.length : i; };
// Bilingual track (v2.5): a small tag on every bilingual, international or preparatory class, and the test note.
const BI_KEY = { 'dwujęzyczna': 'dw', 'międzynarodowa': 'mn', 'wstępna': 'wst' };
const BI_TAG = kind => t(`lic.bi.${BI_KEY[kind] || 'dw'}`);
// Entrance exam (v2.12, A1): art and music schools get the tag "egzamin wstępny / przesłuchanie w szkole" in the same place.
const ENTRY_TAG = () => t('lic.entry.tag');
const entryKind = k => (ENTRY_KIND[k] !== `lic.entry.${k}` ? ENTRY_KIND[k] : ENTRY_TAG());
const entryTag = cls => cls.entry ? `<span class="bitag entrytag" title="${esc(entryKind(cls.entry.kind))}${cls.entry.note ? ': ' + esc(cls.entry.note) : ''}">${ENTRY_TAG()}</span>` : '';
const biTag = cls => (cls.bilingual ? `<span class="bitag" title="${t('lic.bi.title')}">${esc(BI_TAG(cls.bilingual.kind))}${cls.bilingual.lang ? ' · ' + esc(cls.bilingual.lang) : ''}</span>` : '') + entryTag(cls);
const biText = cls => (cls.bilingual ? ` [${BI_TAG(cls.bilingual.kind)}${cls.bilingual.lang ? ', ' + cls.bilingual.lang : ''}, ${t('lic.bi.test')}]` : '') + (cls.entry ? ` [${entryKind(cls.entry.kind)}]` : '');
const langNote = check => check && check.lang && check.lang.test ? LANG_TXT[check.lang.test] : check && check.lang ? t('lic.lang.test') : '';
const chip = (attrs, label, on) => `<button class="chip" ${attrs} aria-pressed="${on ? 'true' : 'false'}">${label}</button>`;
const nameOf = id => (data.strengths.find(s => s.id === id) || {}).name || id;
const screens = [
  { id: 'start', ch: null, view: vStart },
  { id: 'gdzie', ch: 'ja', view: vTowns },
  { id: 'swiaty', ch: 'ja', view: vWorlds, ok: () => (A.worlds || []).length > 0, hint: () => t('lic.hint.worlds') },
  { id: 'zajecia', ch: 'ja', view: vSort, ok: () => A.sortPos >= acts().length, hint: () => t('lic.hint.cards', { n: acts().length - A.sortPos }) },
  { id: 'sytuacje', ch: 'ja', view: vSituations },
  { id: 'styl', ch: 'ja', view: vStyle },
  { id: 'wartosci', ch: 'ja', view: vValues, ok: () => A.values.length === 3, hint: () => t('lic.hint.more', { n: 3 - A.values.length }) },
  { id: 'mocne', ch: 'ja', view: vStrengths, ok: () => provenStrengths(A).length === 3,
    hint: () => A.strengths.length < 3 ? t('lic.hint.more', { n: 3 - A.strengths.length }) : t('lic.hint.where', { list: A.strengths.filter(x => !x.proof.trim()).map(x => nameOf(x.id)).join(', ') }) },
  { id: 'szkola', ch: 'szkola', view: vSchool },
  { id: 'wyniki', ch: 'wyniki', view: vKompas },
  { id: 'profil', ch: 'wyniki', view: vProfile },
  { id: 'lista', ch: 'lista', view: vList },
  { id: 'rodzic', ch: 'wyniki', view: vParent },
  { id: 'szkoly', ch: 'szkoly', view: vSchools },
  { id: 'zrodla', ch: null, view: vSources }
];
const STEP_TITLE = id => t(`lic.step.${id}`);
const current = () => screens.find(s => s.id === ((location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'start')) || screens[0];
const hasWorlds = () => !Array.isArray(A.worlds) || A.worlds.length > 0;
const needResults = () => !(hasWorlds() && A.sortPos >= acts().length && A.values.length === 3 && provenStrengths(A).length === 3);

let lastProg = { ch: null, w: 0 };
function render() {
  const s = current(), i = screens.indexOf(s);
  applyComfort();
  document.querySelectorAll('.chapters [data-ch]').forEach(el => { el.classList.toggle('on', el.dataset.ch === s.ch); el.setAttribute('aria-current', el.dataset.ch === s.ch ? 'step' : 'false'); });
  const inQ = s.ch === 'ja' || s.ch === 'szkola';
  const list = screens.filter(x => x.ch === 'ja' || x.ch === 'szkola');
  const idx = list.indexOf(s);
  const blocked = !!(s.ok && !s.ok());
  const nav = !inQ ? '' : `<div class="nav"><button class="btn ghost" data-go="${screens[i - 1].id}">${t('lic.nav.back')}</button>
    <p class="navhint" id="navhint" role="status">${blocked && s.hint ? esc(s.hint()) : s.id === 'szkola' ? t('lic.nav.skip') : ''}</p>
    <button class="btn" data-go="${screens[i + 1].id}" ${blocked ? 'disabled' : ''} aria-describedby="navhint">${s.id === 'szkola' ? t('lic.nav.showCompass') : t('lic.nav.next')}</button></div>`;
  const progW = Math.round(100 * (idx + 1) / list.length), progFrom = inQ && lastProg.ch === 'q' ? lastProg.w : 0;
  lastProg = inQ ? { ch: 'q', w: progW } : { ch: null, w: 0 };
  const crumb = inQ ? `<p class="crumb2"><b>${STEP_TITLE(s.id)}</b> · ${t('lic.step.of', { i: idx + 1, n: list.length })}</p><div class="prog2" aria-hidden="true"><i style="width:${progFrom}%" data-to="${progW}"></i></div>` : '';
  const note = notice ? `<p class="notice" role="status">${notice}</p>` : ''; notice = '';
  if ((s.id === 'wyniki' || s.id === 'profil' || s.id === 'rodzic') && needResults()) { $app.innerHTML = vGate(); document.body.classList.remove('wide'); $app.dataset.screen = 'gate'; applySkin(); return; }
  const keep = document.activeElement && document.activeElement.id, changed = $app.dataset.screen !== s.id;
  const prevIdx = screens.findIndex(x => x.id === $app.dataset.screen);
  const dir = !changed || calm() ? '' : prevIdx > i ? 'slide-b' : 'slide-f';
  if (s.id !== 'start' && s.id !== 'rodzic') A.lastScreen = s.id;
  document.body.classList.toggle('wide', ['wyniki', 'profil', 'szkoly', 'lista'].includes(s.id));
  if (mapObj) { mapObj.remove(); mapObj = null; }
  mapEntries = null;
  $app.innerHTML = `<div class="qmain ${dir}">${crumb}${note}${s.view()}${nav}</div>`;
  $app.dataset.screen = s.id; $app.classList.toggle('still', !changed); save(); applySkin(); likeCount();
  const pi = $app.querySelector('.prog2 i[data-to]');
  if (pi) requestAnimationFrame(() => requestAnimationFrame(() => { pi.style.width = pi.dataset.to + '%'; }));
  if (changed && !calm()) { const b = document.querySelector('.brand'); if (b) { b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); } }
  if (changed) { window.scrollTo(0, 0); $app.focus({ preventScroll: true }); }
  else if (keep && document.getElementById(keep)) { const el = document.getElementById(keep); el.focus(); if (el.setSelectionRange && el.value && el.type === 'text') el.setSelectionRange(el.value.length, el.value.length); }
  if (s.id === 'szkola') liveUpdate();
  if (mapEntries) { const m = mapEntries; mapEntries = null; initMap(m); }
}

function vGate() {
  const miss = [];
  if (!hasWorlds()) miss.push(t('lic.gate.worlds'));
  if (A.sortPos < acts().length) miss.push(t('lic.gate.cards'));
  if (A.values.length < 3) miss.push(t('lic.gate.values'));
  if (provenStrengths(A).length < 3) miss.push(t('lic.gate.strengths'));
  return `<h1>${t('lic.gate.title')}</h1><p>${t('lic.gate.text', { list: miss.map(esc).join(', ') })}</p>
    <div class="actions"><button class="btn" data-go="${(A.worlds || []).length ? 'zajecia' : 'swiaty'}">${t('lic.start.back')}</button></div>`;
}

function vStart() {
  const started = hasAnswers();
  const steps = [[t('lic.nav.ja'), t('lic.start.s1'), t('lic.start.s1.time')], [t('lic.nav.szkola'), t('lic.start.s2'), t('lic.start.s2.time')], [t('lic.nav.wyniki'), t('lic.start.s3', { where: townsIn() }), '']];
  return `<div class="hero">${ILLUS.start}<div>
    <span class="kicker2">${t('lic.start.kicker')}</span>
    <h1>${t('lic.start.title')}</h1>
    <div class="compassnote">${t('lic.start.note')}</div>
    <p class="lead">${t('lic.start.lead')}</p>
    ${started ? `<p><b>${t('lic.start.have')}</b> ${needResults() ? t('lic.start.finish') : t('lic.start.waits')}</p>` : ''}
    <div class="startcta">${started && !needResults() ? `<button class="btn big" data-go="wyniki">${t('lic.my.compass')}</button>` : ''}
      <button class="btn ${started && !needResults() ? 'ghost' : 'big'}" data-go="${started && (A.worlds || []).length ? 'zajecia' : 'gdzie'}">${started ? t('lic.start.back') : t('lic.start.go')}</button>
      <button class="btn ghost" data-go="szkoly">${t('lic.start.browse')}</button></div>
    <ol class="steps2">${steps.map((x, k) => `<li><span class="rno">${k + 1}</span><div><b>${x[0]}</b><span class="t">${x[1]}${x[2] ? ' · ' + x[2] : ''}</span></div></li>`).join('')}</ol>
    <div class="note2">${t('lic.start.db', { s: data.allSchools.length, c: data.allSchools.reduce((n, x) => n + x.classes.length, 0) })}</div>
    <div class="skinpick" role="group" aria-label="${t('lic.skin.group')}"><span class="small muted">${t('lic.skin.pick')}</span>
      <button class="chip" data-skinpick="neon" aria-pressed="${skin === 'neon'}">${SKIN_NAME('neon')}</button><button class="chip" data-skinpick="" aria-pressed="${!skin}">${SKIN_NAME(null)}</button><button class="chip" data-skinpick="pop" aria-pressed="${skin === 'pop'}">${SKIN_NAME('pop')}</button></div>
    ${TEST ? `<details class="card"><summary>${t('lic.start.test')}</summary><div class="actions">${data.personas.map(p => `<button class="btn ghost" data-persona="${p.id}">${esc(p.label)}</button>`).join('')}</div></details>` : ''}
  </div></div>`;
}

function vTowns() {
  const r = region();
  return `${ILLUS.start}<h1>${t('lic.towns.title')}</h1><p class="muted">${t('lic.towns.lead')}</p>
    ${regionChips()}
    ${r.note ? `<p class="small muted">${esc(tOr(`lic.region.${r.id}.note`, r.note))}</p>` : ''}${r.later ? `<p class="small muted">${esc(tOr(`lic.region.${r.id}.later`, r.later))}</p>` : ''}
    ${origins().length ? `<h2>${t('lic.towns.from')}</h2><p class="muted">${t('lic.towns.fromLead')}</p>
      <div class="chips">${origins().map(o => chip(`data-from="${o.id}"`, esc(o.name), A.from === o.id)).join('')}${chip('data-from=""', t('lic.skip'), !A.from)}</div>
      <p class="small muted">${t('lic.towns.how', { links: transitLinks() })}</p>`
      : `<p class="small muted">${t('lic.towns.later', { links: transitLinks() })}</p>`}
    <p class="note2">${t('lic.towns.none')}</p>`;
}

function vWorlds() {
  const w = A.worlds || [], all = w.includes('all');
  const tile = x => `<button class="wtile" data-world="${x.id}" aria-pressed="${!all && w.includes(x.id)}">${icon(x.icon, 'ico')}<b>${esc(x.name)}</b><span>${esc(x.hint)}</span></button>`;
  return `${ILLUS.zajecia}<h1>${t('lic.worlds.title')}</h1><p class="muted">${t('lic.worlds.lead')}</p>
    <div class="wgrid">${data.questions.worlds.map(tile).join('')}</div>
    <div class="row-s"><button class="chip" data-world="all" aria-pressed="${all}">${t('lic.worlds.all')}</button></div>`;
}

function vSort() {
  const acts = visibleActivities(A, data), n = acts.length, pos = Math.min(A.sortPos, n);
  const dots = `<div class="dots" aria-hidden="true">${acts.map((_, i) => `<i class="${i < pos ? 'done' : ''}"></i>`).join('')}</div>`;
  if (pos >= n) {
    const liked = acts.filter(a => A.sort[a.id] === 1).map(a => `<li>${esc(a.text)}</li>`).join('');
    return `<h1>${t('lic.step.zajecia')}</h1><div class="card"><p>${t('lic.sort.liked')}</p><ul>${liked || `<li class="muted">${t('lic.sort.none')}</li>`}</ul><button class="btn ghost" data-sortreset>${t('lic.again')}</button></div>${dots}`;
  }
  const a = acts[pos];
  return `${A.sortPos === 0 ? `<div class="deskonly">${ILLUS.zajecia}</div>` : ''}<h1>${t('lic.step.zajecia')}</h1><p class="muted">${t('lic.sort.lead')}<span class="touchonly"> ${t('lic.sort.swipe')}</span></p>
    <div class="card sort"><p class="sortcount">${t('lic.of', { i: pos + 1, n })}</p><div class="q">${esc(a.text)}</div>
      <div class="row"><button class="btn ghost" data-sortans="-1">${t('lic.sort.no')}</button><button class="btn" data-sortans="1">${t('lic.sort.yes')}</button></div>
      <button class="chip" data-sortans="0" style="margin-top:12px">${t('lic.sort.skip')}</button>${pos > 0 ? `<button class="chip" data-sortback style="margin-top:12px">${t('lic.undo')}</button>` : ''}
      <p class="keys" aria-hidden="true"><kbd>←</kbd> ${t('lic.sort.no')} · <kbd>→</kbd> ${t('lic.sort.yes')} · <kbd>↓</kbd> ${t('lic.skip')}</p></div>${dots}`;
}
function sortAnswer(v) { const a = acts()[A.sortPos]; if (!a) return; A.sort[a.id] = v; A.sortPos++; render(); }
let swipe = null;
document.addEventListener('pointerdown', e => { const c = e.target.closest('.card.sort'); if (c && !e.target.closest('button')) swipe = { x: e.clientX, c }; });
document.addEventListener('pointermove', e => { if (swipe) { const dx = e.clientX - swipe.x; swipe.c.style.transform = `translateX(${dx}px) rotate(${dx / 40}deg)`; swipe.c.dataset.lean = dx > 30 ? 'r' : dx < -30 ? 'l' : ''; } });
document.addEventListener('pointerup', e => { if (!swipe) return; const dx = e.clientX - swipe.x, c = swipe.c; swipe = null; c.style.transform = ''; if (Math.abs(dx) > 70) sortAnswer(dx > 0 ? 1 : -1); else c.dataset.lean = ''; });
document.addEventListener('pointercancel', () => { if (swipe) { swipe.c.style.transform = ''; swipe = null; } });
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('g[data-prof]')) { e.preventDefault(); e.target.closest('g[data-prof]').dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
  if (current().id !== 'zajecia' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || A.sortPos >= acts().length) return;
  const m = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 0 }[e.key]; if (m !== undefined) { e.preventDefault(); sortAnswer(m); }
});

function vSituations() {
  const qs = data.questions.situations, n = qs.length, pos = Math.min(A.sitPos, n);
  const dots = `<div class="dots" aria-hidden="true">${qs.map((_, i) => `<i class="${i < pos ? 'done' : ''}"></i>`).join('')}</div>`;
  if (pos >= n) {
    const picked = qs.map(q => { const a = q.answers.find(x => x.id === A.situations[q.id]); return a ? `<li>${esc(a.text)}</li>` : ''; }).join('');
    return `<h1>${t('lic.step.sytuacje')}</h1><div class="card"><p>${t('lic.sit.picked')}</p><ul>${picked || `<li class="muted">${t('lic.sit.none')}</li>`}</ul><button class="btn ghost" data-sitreset>${t('lic.again')}</button></div>${dots}`;
  }
  const q = qs[pos];
  return `${A.sitPos === 0 ? `<div class="deskonly">${ILLUS.sytuacje}</div>` : ''}<h1>${t('lic.step.sytuacje')}</h1><p class="muted">${t('lic.sit.lead')}</p>
    <div class="card"><p class="sortcount">${t('lic.of', { i: pos + 1, n })}</p><p class="q-s">${esc(q.text)}</p>
      <div class="chips stack">${q.answers.map(a => chip(`data-sitans="${a.id}"`, esc(a.text), A.situations[q.id] === a.id)).join('')}</div>
      <div class="row-s"><button class="chip" data-sitans="">${t('lic.skip')}</button>${pos > 0 ? `<button class="chip" data-sitback>${t('lic.undo')}</button>` : ''}</div></div>${dots}`;
}

function vStyle() {
  return `<h1>${t('lic.style.title')}</h1><p class="muted">${t('lic.style.lead')}</p>
    ${data.dimensions.workStyle.map(w => `<div class="slider"><div class="ends"><span>${w.left}</span><span>${w.right}</span></div>
      <input type="range" min="-3" max="3" step="1" id="sl-${w.id}" data-slider="${w.id}" value="${A.sliders[w.id] ?? 0}" aria-label="${t('lic.style.or', { a: w.left, b: w.right })}"></div>`).join('')}`;
}

function vValues() {
  return `<h1>${t('lic.values.title')}</h1><p>${t('lic.values.lead')} <span class="pickn">${t('lic.of', { i: A.values.length, n: 3 })}</span></p>
    <div class="chips">${data.dimensions.values.map(v => { const i = A.values.indexOf(v.id); return chip(`data-value="${v.id}"`, `${i >= 0 ? `<span class="n">${i + 1}.</span> ` : ''}${v.name}`, i >= 0); }).join('')}</div>`;
}

// "Where it shows": the Polish words are stored in the answers file (proof); the screen shows them in the chosen language.
const WHERE = ['w szkole', 'w sporcie', 'w domu', 'w hobby', 'z przyjaciółmi', 'w grach i internecie'];
const whereTxt = w => (WHERE.includes(w) ? t(`lic.where.${WHERE.indexOf(w)}`) : w);
function vStrengths() {
  const picked = A.strengths.map(s => s.id);
  const list = A.strengths.map(s => { const st = data.strengths.find(x => x.id === s.id);
    return `<div class="strength"><p class="field">${t('lic.str.where', { name: esc(st.name) })}</p>
      <div class="chips">${WHERE.map(w => chip(`data-where="${s.id}|${w}"`, whereTxt(w), s.proof === w)).join('')}</div></div>`; }).join('');
  return `<h1>${t('lic.str.title')}</h1><p>${t('lic.str.lead')} <span class="pickn">${t('lic.of', { i: A.strengths.length, n: 3 })}</span></p>
    <div class="chips">${data.strengths.map(s => chip(`data-strength="${s.id}"`, s.name, picked.includes(s.id))).join('')}</div>
    ${list ? `<div class="card">${list}</div>` : ''}`;
}

// ---- school self-assessment (soft by default, exact marks optional) -----------------------------------------------
const SOFT = ['slabo', 'dobrze', 'swietnie'];
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const hasExactData = () => Object.keys(A.points.exam || {}).length > 0 || Object.keys(A.points.grades || {}).length > 0;
const pMode = () => A.points.mode || (hasExactData() ? 'exact' : 'soft');
const eff = () => effectivePoints(A, data.config);
const hasInput = () => { if (pMode() === 'exact') return hasExactData(); const s = A.points.soft || {}; return Object.keys(s.exam || {}).length + Object.keys(s.grades || {}).length > 0; };
const softRow = (kind, key, label) => {
  const cur = ((A.points.soft || {})[kind] || {})[key];
  return `<div class="softrow"><span class="sl" id="sr-${kind}-${key}">${esc(label)}</span><div class="chips" role="group" aria-labelledby="sr-${kind}-${key}">${SOFT.map(v => chip(`data-soft="${kind}:${key}:${v}"`, t(`lic.soft.${v}`), cur === v)).join('')}</div></div>`;
};
function parentNote() {
  const c = data.config, so = c.soft;
  return `<details class="parent"><summary>${t('lic.pn.title')}</summary>
    <p class="small">${t('lic.pn.p1', { g1: so.slabo.grade, e1: so.slabo.exam, g2: so.dobrze.grade, e2: so.dobrze.exam, g3: so.swietnie.grade, e3: so.swietnie.exam })}</p>
    <p class="small">${t('lic.pn.p2')}</p>
    <p class="small">${t('lic.pn.p3', { year: esc(c.thresholdYear), m: c.chanceMargin })}</p>
    <p class="small">${t('lic.pn.p4')}</p></details>`;
}
function vSchool() {
  const p = A.points, ex = p.exam, g = p.grades, mode = pMode();
  const subj = data.questions.grades;
  const main = subj.filter(s => !['historia', 'wos'].includes(s)), rest = subj.filter(s => ['historia', 'wos'].includes(s));
  let body;
  if (mode === 'soft') {
    body = `<div class="card"><h3>${t('lic.school.subjects')}</h3><p class="small muted">${t('lic.school.subjectsLead')}</p>
        ${main.map(s => softRow('grades', s, cap(subjectName(s)))).join('')}
        ${rest.length ? `<details><summary class="small">${t('lic.school.other')}</summary>${rest.map(s => softRow('grades', s, cap(subjectName(s)))).join('')}</details>` : ''}</div>
      <div class="card exactask"><h3>${t('lic.school.haveGrades')}</h3><p class="small">${t('lic.school.haveGradesLead')}</p>
        <button class="btn ghost" data-mode="exact">${t('lic.school.toExact')}</button></div>`;
  } else {
    const exRow = (k, label, w) => `<label for="ex-${k}">${label} <span class="muted small">(${t('lic.school.weight', { w })})</span></label>
      <input id="ex-${k}" type="number" inputmode="numeric" min="0" max="100" step="1" data-exam="${k}" value="${ex[k] ?? ''}" placeholder="%">`;
    const grades = subj.map(s => `<label for="gr-${s}">${esc(subjectName(s))}</label>
      <select id="gr-${s}" data-grade="${s}"><option value="">–</option>${[6, 5, 4, 3, 2].map(n => `<option value="${n}" ${g[s] === n ? 'selected' : ''}>${n}</option>`).join('')}</select>`).join('');
    body = `<div class="card"><h3>${t('lic.school.exam')}</h3><p class="small muted">${t('lic.school.examLead')}</p>
        <div class="pgrid">${exRow('polski', t('lic.school.exPl'), '0,35')}${exRow('matematyka', t('lic.school.exMat'), '0,35')}${exRow('obcy', t('lic.school.exLang'), '0,30')}</div></div>
      <div class="card"><h3>${t('lic.school.grades')}</h3><p class="small muted">${t('lic.school.gradesLead')}</p><div class="pgrid">${grades}</div></div>
      <div class="card"><h3>${t('lic.school.extra')}</h3>
        <label class="check2"><input type="checkbox" data-pt="stripe" ${p.stripe ? 'checked' : ''}> ${t('lic.school.stripe')}</label>
        <label class="check2"><input type="checkbox" data-pt="volunteering" ${p.volunteering ? 'checked' : ''}> ${t('lic.school.volunteering')}</label>
        <div class="pgrid"><label for="ach">${t('lic.school.ach')}</label>
          <input id="ach" type="number" inputmode="numeric" min="0" max="18" step="1" data-pt="achievements" value="${p.achievements || 0}"></div></div>
      <div class="card exactask"><p class="small">${t('lic.school.simpler')}</p><button class="btn ghost" data-mode="soft">${t('lic.school.toSoft')}</button></div>`;
  }
  const bi = `<div class="card bicard"><h3>${t('lic.school.bi')}</h3>
      <p class="small">${t('lic.school.biLead')}</p>
      <div class="chips" role="radiogroup" aria-label="${t('lic.school.biAria')}">${chip('data-bi="nie" role="radio"', t('lic.school.biNo'), A.bi !== 'tak')}${chip('data-bi="tak" role="radio"', t('lic.school.biYes'), A.bi === 'tak')}</div></div>`;
  return `${LILLUS.szkola}<h1>${t('lic.school.title')}</h1>
    <p>${t('lic.school.lead')}</p>
    <div class="ptform">${body.replace('<div class="card exactask">', bi + '<div class="card exactask">')}</div>
    <div class="live" id="live" role="status" aria-live="polite"></div>
    ${parentNote()}`;
}
function liveUpdate() {
  const el = document.getElementById('live'); if (!el) return;
  if (pMode() === 'soft') {
    const s = A.points.soft || {}, n = Object.keys(s.exam || {}).length + Object.keys(s.grades || {}).length;
    el.innerHTML = n ? `<span>${t('lic.live.soft', { n })}</span>` : `<span class="muted">${t('lic.live.softNone')}</span>`;
  } else {
    const ex = examPoints(A.points.exam), ce = certificatePoints(A.points, { scored: [] });
    el.innerHTML = ex.entered ? `<span>${t('lic.live.exact', { ex: f1(ex.total), extra: ce.extras })}</span>` : `<span class="muted">${t('lic.live.exactNone')}</span>`;
  }
}

// ---- results ------------------------------------------------------------------------------------------------------

function parentTable(rows) {
  const e = eff(), th = x => x.cls.threshold != null ? f2(x.cls.threshold) : x.school.range ? t('lic.pt.range', { a: f2(x.school.range.min), b: f2(x.school.range.max) }) : t('lic.pt.nodata');
  const pts = x => x.check.complete ? f1(x.check.points) : '–';
  const mg = x => x.check.margin != null ? `${x.check.margin >= 0 ? '+' : '−'}${f1(Math.abs(x.check.margin))}` : '–';
  return `<details class="parent"><summary>${t('lic.pt.title')}</summary>
    <p class="small">${hasInput() ? (e.approx ? t('lic.pt.soft') : t('lic.pt.exact')) : t('lic.pt.none')}
      ${e.assumed && e.assumed.length ? ` ${t('lic.pt.assumed', { list: e.assumed.map(s => esc(subjectName(s))).join(', ') })}` : ''}
      ${t('lic.pt.year', { year: esc(data.config.thresholdYear) })}</p>
    <div class="tablewrap"><table class="ptable"><thead><tr><th>${t('lic.pt.h1')}</th><th>${t('lic.pt.h2')}</th><th>${t('lic.pt.h3')}</th><th>${t('lic.pt.h4')}</th></tr></thead>
      <tbody>${rows.map(x => `<tr><td>${esc(x.school.short)} · ${esc(x.cls.code)}${x.cls.bilingual ? ` ${t('lic.pt.plusTest')}` : ''}${x.cls.entry ? ` ${t('lic.pt.plusExam')}` : ''}</td><td>${th(x)}</td><td>${pts(x)}</td><td>${mg(x)}</td></tr>`).join('')}</tbody></table></div>
    ${parentNote().replace(`<details class="parent"><summary>${t('lic.pn.title')}</summary>`, '<div class="parentin">').replace(/<\/details>$/, '</div>')}</details>`;
}

function studiaFor(card) {
  const seen = new Set(), out = [];
  for (const o of studiaOffers) if (o.cards.some(id => (card.studiaCards || []).includes(id))) {
    const key = o.name + o.institution; if (seen.has(key)) continue; seen.add(key);
    out.push(`${o.name} · ${o.institution} (${plural(o.durationYears, 'lic.years')})`);
  }
  return out.slice(0, 5);
}

function planItems(sel) {
  const top = sel.classes.find(c => c.check.chance && c.check.chance !== 'unknown' && c.check.chance !== 'szkola') || sel.classes[0];
  const out = [{ id: 'exp', when: t('lic.plan.exp.when'), text: sel.card.experiment }];
  if (top) {
    out.push({ id: 'dni', when: t('lic.plan.dni.when'), text: t('lic.plan.dni', { school: top.school.short, code: top.cls.code, label: top.cls.label }) });
    const subs = scoredSubjects(top.cls).list.filter(s => !['polski', 'matematyka'].includes(s)).map(s => subjectName(s));
    const subTxt = subs.length ? t('lic.plan.subs', { list: subs.join(', ') }) : '';
    if (top.check.chance === 'ambitna') out.push({ id: 'pkt', when: t('lic.plan.pkt.when'), warn: true, text: t('lic.plan.pkt.amb', { code: top.cls.code, subs: subTxt }) });
    else if (top.check.chance) out.push({ id: 'pkt', when: t('lic.plan.pkt.when'), text: t('lic.plan.pkt.ok', { subs: subTxt }) });
    else out.push({ id: 'pkt', when: t('lic.plan.pkt.when0'), text: t('lic.plan.pkt.none') });
  }
  out.push({ id: 'zasady', when: t('lic.plan.zasady.when'), text: t('lic.plan.zasady', { curator: region().curator ? tOr(`lic.region.${region().id}.curator`, region().curator) : t('lic.plan.curator'), window: region().recruitmentWindow ? ` (${tOr(`lic.region.${region().id}.window`, region().recruitmentWindow)})` : '' }) });
  out.push({ id: 'lista', when: t('lic.plan.lista.when'), text: t('lic.plan.lista') });
  out.push({ id: 'egz', when: tOr('lic.cfg.examDates', data.config.examDates), text: t('lic.plan.egz') });
  out.push({ id: 'talk', when: t('lic.plan.talk.when'), text: t('lic.plan.talk') });
  return out;
}

// ---- likes ("Moja lista"): profiles, schools and classes the kid wants to keep -----------------------------------
const L0 = () => (A.likes ||= { profiles: [], schools: [], classes: [] });
const KIND = { p: 'profiles', s: 'schools', c: 'classes' };
const liked = (k, id) => L0()[KIND[k]].includes(id);
const nLikes = () => { const l = L0(); return l.profiles.length + l.schools.length + l.classes.length; };
function likeCount() { document.querySelectorAll('[data-likecount]').forEach(el => { const n = nLikes(); el.textContent = n ? String(n) : ''; el.hidden = !n; }); }
const HEART = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 4.8 6.4 4.5c2-.2 3.6 1 4.6 2.5 1-1.5 2.6-2.7 4.6-2.5 3.4.3 5.2 3.8 3.6 6.9C19 15.6 12 20 12 20z"/></svg>';
const heart = (k, id, what) => `<button class="heart" data-like="${k}:${esc(id)}" aria-pressed="${liked(k, id)}" aria-label="${t(liked(k, id) ? 'lic.like.remove' : 'lic.like.add')}: ${esc(what)}" title="${t('lic.nav.lista')}">${HEART}</button>`;
const clsKey = x => `${x.school.id}|${x.cls.code}`;

// ---- the compass ---------------------------------------------------------------------------------------------------
function compassData() { const r = scoreLiceum(A, data); return { r, P: profilesFor(r, data) }; }
const CDEG = { N: 0, NNE: 27, NNW: -27, NE: 58, NW: -58, E: 96, W: -96, SE: 140, S: 180 };
function compassSvg(P, selId) {
  const cx = 250, cy = 222, R0 = 128, rad = d => (d - 90) * Math.PI / 180;
  const ticks = Array.from({ length: 16 }, (_, i) => { const d = i * 22.5, l = i % 4 === 0 ? 14 : i % 2 === 0 ? 9 : 5;
    return `<line x1="${cx + (R0 - l) * Math.cos(rad(d))}" y1="${cy + (R0 - l) * Math.sin(rad(d))}" x2="${cx + R0 * Math.cos(rad(d))}" y2="${cy + R0 * Math.sin(rad(d))}"/>`; }).join('');
  const pts = P.map((x, i) => {
    const d = CDEG[x.compass.pos] ?? x.compass.deg, px = cx + R0 * Math.cos(rad(d)), py = cy + R0 * Math.sin(rad(d));
    const r2 = R0 + (i === 0 ? 30 : 26), lx = cx + r2 * Math.cos(rad(d)), ly = cy + r2 * Math.sin(rad(d)) + 5;
    const anchor = Math.abs(d) < 10 || Math.abs(d) > 170 ? 'middle' : d > 0 ? 'start' : 'end';
    const size = i === 0 ? 14 : i < 3 ? 11 : 8;
    return `<g class="cpt ${i === 0 ? 'north' : i < 3 ? 'alt' : ''} ${x.profile.id === selId ? 'sel' : ''}" data-prof="${x.profile.id}" role="button" tabindex="0" aria-label="${x.compass.pos}, ${cLabel(x)}: ${esc(x.profile.name)}">
      <line class="ray" x1="${cx}" y1="${cy}" x2="${px}" y2="${py}"/><circle class="hit" cx="${px}" cy="${py}" r="26"/><circle class="dot" cx="${px}" cy="${py}" r="${size}"/>
      <text x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(x.profile.short)}</text></g>`;
  }).join('');
  return `<div class="compass"><svg viewBox="0 0 500 440" role="group" aria-label="${t('lic.k.svg')}">
    <circle class="ring" cx="${cx}" cy="${cy}" r="${R0}"/><circle class="ring2" cx="${cx}" cy="${cy}" r="${R0 * 0.55}"/><g class="ticks">${ticks}</g>
    <g class="needle" style="transform-origin:${cx}px ${cy}px"><path d="M${cx} ${cy - R0 * 0.78} L${cx + 12} ${cy} L${cx} ${cy + 9} L${cx - 12} ${cy} Z" class="nN"/><path d="M${cx} ${cy + R0 * 0.5} L${cx + 8} ${cy} L${cx - 8} ${cy} Z" class="nS"/><circle cx="${cx}" cy="${cy}" r="6" class="hub"/></g>
    ${pts}
  </svg></div>`;
}
const fitWord = f => t(f >= 80 ? 'lic.fit.4' : f >= 65 ? 'lic.fit.3' : f >= 50 ? 'lic.fit.2' : 'lic.fit.1');
const cLabel = x => t(`lic.compass.${x.compass.pos}`);
function chanceSum(classes, compact) {
  const n = classes.length, m = new Set(classes.map(c => c.school.id)).size;
  if (!hasInput()) return `<span class="csum">${plural(n, 'lic.csum.classes', { m: plural(m, 'lic.csum.schools') })}</span>`;
  const k = { realna: 0, zawalczenia: 0, ambitna: 0 }; for (const c of classes) if (k[c.check.chance] !== undefined) k[c.check.chance]++;
  const part = id => `<span class="cd"><i class="d ${id}" aria-hidden="true"></i>${k[id]}${compact ? '' : ' ' + plural(k[id], `lic.csum.${id}`).replace(/^\S+\s/, '')}</span>`;
  return `<span class="csum" aria-label="${t('lic.csum.aria', { r: plural(k.realna, 'lic.csum.realna'), z: plural(k.zawalczenia, 'lic.csum.zawalczenia'), a: plural(k.ambitna, 'lic.csum.ambitna') })}">${part('realna')}${part('zawalczenia')}${part('ambitna')}</span>`;
}
function profileCard(x, mode) {
  const reasons = ((x.areas[0] || {}).reasons || []).slice(0, mode === 'north' ? 3 : 2);
  const why = reasons.length ? `<ul class="small why">${reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : '';
  return `<article class="pcard ${mode}" style="--i:${['N', 'NNE', 'NNW'].indexOf(x.compass.pos) + 1}">
    <header><span class="kicker2">${x.compass.pos} · ${cLabel(x)}</span>${heart('p', x.profile.id, x.profile.name)}</header>
    <h3>${icon(x.profile.icon, 'ico')}${esc(x.profile.name)}</h3>
    <div class="fitrow"><div class="fitbar" aria-hidden="true"><i style="width:${Math.round(x.fit)}%"></i></div><span class="small muted">${fitWord(x.fit)}</span></div>
    <p class="small">${esc(x.profile.desc)}</p>
    ${mode === 'north' ? why : (why ? `<details class="whyd"><summary class="small">${t('lic.k.why')}</summary>${why}</details>` : '')}
    ${x.areas.length > 1 ? `<div class="dirs">${x.areas.map(a => `<span class="dchip">${esc(a.card.name)}</span>`).join('')}</div>` : ''}
    <p class="small">${chanceSum(x.classes)}</p>
    <button class="btn ${mode === 'north' ? '' : 'ghost'}" data-prof="${x.profile.id}">${t('lic.k.see')}</button></article>`;
}
const profileRow = x => `<li class="prow"><button class="prowbtn" data-prof="${x.profile.id}"><span class="cposb">${x.compass.pos}</span>${icon(x.profile.icon, 'ico')}<b>${esc(x.profile.name)}</b>
    <span class="fitbar" aria-hidden="true"><i style="width:${Math.round(x.fit)}%"></i></span><span class="small muted fw">${fitWord(x.fit)}</span>${chanceSum(x.classes, true)}<span class="chev" aria-hidden="true">›</span></button>${heart('p', x.profile.id, x.profile.name)}</li>`;
const exportBox = label => `<div class="exportbox noprint"><div><label class="small" for="name">${t('lic.ex.name')}</label><input id="name" type="text" data-field="name" value="${esc(A.name)}" autocomplete="off"></div>
    <button class="btn" data-export="download">${label}</button><button class="btn ghost" data-export="print">${t('lic.ex.print')}</button>${needResults() ? '' : `<button class="btn ghost" data-go="rodzic">${t('lic.ex.parent')}</button>`}</div>`;
function vKompas() {
  const { P } = compassData(), top = P[0], selId = A.profile || top.profile.id;
  const sel = (P.find(x => x.profile.id === selId) || top), area = sel.areas[0];
  const items = planItems(area);
  return `<div class="khead"><h1>${A.name ? t('lic.k.titleName', { name: esc(A.name) }) : t('lic.k.title')}</h1>
      <p class="lead">${t('lic.k.lead')}</p></div>
    <div class="kgrid">${compassSvg(P, selId)}${profileCard(top, 'north')}</div>
    <h2>${t('lic.k.alt')}</h2>
    <div class="pcards two">${P.slice(1, 3).map(x => profileCard(x, 'alt')).join('')}</div>
    <h2>${t('lic.k.further')}</h2>
    <p class="small muted">${t('lic.k.furtherLead')}</p>
    <ul class="prows">${P.slice(3).map(profileRow).join('')}</ul>
    ${hasInput() ? `<p class="legend small"><span class="mapnum realna" aria-hidden="true"></span> ${t('lic.k.lg.r')} <span class="mapnum zawalczenia" aria-hidden="true"></span> ${t('lic.k.lg.z')} <span class="mapnum ambitna" aria-hidden="true"></span> ${t('lic.k.lg.a')}</p>` : `<p class="note2">${t('lic.k.mark')} <button class="linkbtn" data-go="szkola">${t('lic.mark')}</button></p>`}
    ${nLikes() ? `<p class="note2">${t('lic.k.onList', { n: nLikes() })} <button class="linkbtn" data-go="lista">${t('lic.k.seeList')}</button></p>` : `<p class="small muted">${t('lic.k.hearts')}</p>`}
    <details class="card plansec"><summary><b>${t('lic.k.plan')}</b> <span class="small muted">${t('lic.k.planFor', { name: esc(sel.profile.name) })}</span></summary>
    <ul class="plan">${items.map(it => `<li><input type="checkbox" id="pl-${it.id}" data-check="${area.card.id}:${it.id}" ${A.checks[`${area.card.id}:${it.id}`] ? 'checked' : ''}>
      <label for="pl-${it.id}"><span class="when">${esc(it.when)}</span>${esc(it.text)}</label></li>`).join('')}</ul></details>
    ${exportBox(t('lic.k.save'))}
    <div class="actions noprint"><button class="btn ghost small" data-go="swiaty">${t('lic.k.change')}</button><button class="btn ghost small" data-go="szkola">${t('lic.k.changeSchool')}</button></div>
    ${parentNote()}
    <p class="small"><button class="linkbtn" data-go="zrodla">${t('lic.allSources')}</button></p>`;
}

// ---- one profile: its directions, then schools and classes ---------------------------------------------------------
function schoolGroups(rows, sort) {
  const by = new Map();
  for (const x of rows) { const g = by.get(x.school.id) || { school: x.school, rows: [] }; g.rows.push(x); by.set(x.school.id, g); }
  const score = sort === 'chance' ? g => Math.max(...g.rows.map(x => (CHANCE_RANK[x.check.chance] || 0) * 10 - x.rank))
    : g => Math.max(...g.rows.map(x => (CHANCE_RANK[x.check.chance] || 0) - x.rank * 10)); // default: best-matching direction first, then the chance
  return [...by.values()].map(g => ({ ...g, best: bestOf(g.rows) })).sort((a, b) => score(b) - score(a) || a.school.short.localeCompare(b.school.short, 'pl', { numeric: true }));
}
// ---- sources (v2.7.1): every fact links to where it comes from; one page lists them all ------------------------------
const SRC = () => (data._src ||= Object.fromEntries((Array.isArray(data.sources) ? data.sources : data.sources.sources || []).map(x => [x.id, x])));
const srcIds = (v, out = new Set()) => {
  if (Array.isArray(v)) v.forEach(x => srcIds(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (/sourceids?$/i.test(k)) [x].flat(Infinity).flatMap(y => y && typeof y === 'object' ? Object.values(y).flat() : [y]).forEach(y => y && out.add(y)); else srcIds(x, out); }
  return out;
};
const schoolSrc = s => { const ids = srcIds(s); ((data.rank || {})[s.id] || {}).src?.forEach(id => id && ids.add(id)); return [...ids].map(id => SRC()[id]).filter(Boolean); };
const srcLink = x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a> <span class="muted">· ${esc(x.asOf || '')}${x.status === 'check' ? ` · ${t('lic.src.check')}` : ''}</span>`;
const rankTitle = r => [r.p ? t('lic.rank.p', { n: r.p.rank }) : '', r.o ? t('lic.rank.o', { n: r.o.rank }) : ''].filter(Boolean).join('; ');
const rankLine = s => { const r = data.rank && data.rank[s.id]; return r ? `<p class="small rankl" title="${esc(rankTitle(r))}">${t('lic.rank.line', { order: r.order, total: r.total, word: t(`lic.rank.${r.word}`), where: esc(t(`lic.rank.in.${r.where}`)) })}${r.p ? ` · ${t('lic.rank.national')}` : ''}</p>` : ''; };
const street = s => (s.address || '').replace(/,?\s*\d\d-\d{3}\s+[^,]+$/, '').replace(/,\s*(Kraków|Tychy)$/, '');
function schoolCard(g, i) {
  return `<article class="scard ${liked('s', g.school.id) ? 'liked' : ''}" style="--i:${Math.min(i, 8)}">
    <header><div><h3>${esc(g.school.short)}</h3><p class="sub">${t(`lic.type.${g.school.type}`)}${g.school.address ? ' · ' + esc(street(g.school)) : ''}${selTowns().length > 1 ? ' · ' + esc(townName(townOf(g.school.town))) : ''}${mins(g.school) != null ? ` · <b class="tmin">${minTxt(g.school)}</b>` : ''}</p></div>${heart('s', g.school.id, g.school.short)}</header>
    ${rankLine(g.school)}
    ${g.rows.length ? `<ul class="srows">${g.rows.map(r => `<li><span class="code">${esc(r.cls.code)}</span><span class="lbl">${esc(r.cls.label)}${biTag(r.cls)}${hasInput() && r.check.lang && r.check.lang.test ? `<span class="small muted lnote">${esc(langNote(r.check))}</span>` : ''}</span>${hasInput() ? `<span class="pill ${r.check.chance || 'unknown'}">${esc(SHORT_CH(r.check.chance))}</span>` : '<span></span>'}${heart('c', clsKey(r), `${g.school.short} ${r.cls.code}`)}</li>`).join('')}</ul>` : ''}
    ${g.school.note ? `<details class="snote"><summary class="small muted">${t('lic.sc.note')}</summary><p class="small muted">${esc(g.school.note)}</p></details>` : ''}
    <details class="snote"><summary class="small muted">${t('lic.foot.sources')}</summary><ul class="small srcl">${schoolSrc(g.school).map(x => `<li>${srcLink(x)}</li>`).join('')}</ul></details>
    <div class="scta"><button class="linkbtn" data-pin="${g.school.id}">${t('lic.sc.onMap')}</button><a class="linkbtn" href="${esc(dirUrl(g.school))}" target="_blank" rel="noopener">${t('lic.sc.route')} ↗</a>${g.school.www ? `<a class="linkbtn" href="${esc(g.school.www)}" target="_blank" rel="noopener">${t('lic.sc.www')} ↗</a>` : ''}</div></article>`;
}
function vProfile() {
  const { P } = compassData(), x = P.find(p => p.profile.id === A.profile) || P[0];
  const areaSel = x.areas.find(a => a.card.id === ui.parea) || null, focus = areaSel || x.areas[0];
  const rowsAll = x.classes.filter(c => (!areaSel || c.cls.cards.includes(areaSel.card.id)) && rowPass(c));
  const rows = rowsAll.filter(c => !c.cls.bilingual), biRows = rowsAll.filter(c => c.cls.bilingual);
  const groups = schoolGroups(rows, ui.sort), first = groups.slice(0, 12), rest = groups.slice(12), biGroups = schoolGroups(biRows, ui.sort);
  const cardIds = (areaSel ? [areaSel] : x.areas).map(a => a.card.id);
  const biHidden = A.bi === 'tak' ? 0 : data.schools.reduce((t, s) => t + s.classes.filter(c => c.bilingual && c.cards.some(id => cardIds.includes(id))).length, 0);
  const stud = studiaFor(focus.card);
  const others = P.filter(p => p !== x).slice(0, 4);
  return `<p class="actions"><button class="btn ghost small" data-go="wyniki">← ${t('lic.backCompass')}</button></p>
    <div class="phead"><div><span class="kicker2">${x.compass.pos} · ${cLabel(x)}</span>
      <h1>${icon(x.profile.icon, 'ico')}${esc(x.profile.name)} ${heart('p', x.profile.id, x.profile.name)}</h1>
      <p class="lead">${esc(x.profile.desc)}</p></div></div>
    ${x.areas.length > 1 ? `<div class="frow dirsel" role="group" aria-label="${t('lic.p.dirsAria')}"><span class="small muted">${t('lic.p.dir')}</span>
      <button class="chip" data-parea="" aria-pressed="${!areaSel}">${t('lic.all')}</button>${x.areas.map(a => `<button class="chip" data-parea="${a.card.id}" aria-pressed="${areaSel === a}">${esc(a.card.name)}</button>`).join('')}</div>` : ''}
    <details class="card focus"><summary>${t('lic.p.focus', { name: esc(focus.card.name) })}</summary>
      <p class="small"><b>${t('lic.p.roles')}</b> ${esc(focus.card.roles)}</p><p class="small">${esc(focus.card.whoYouHelp)}</p>
      <ul class="small">${focus.card.dayInLife.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      <p class="small"><b>${t('lic.p.try')}</b> ${esc(focus.card.experiment)}</p><p class="small"><b>${t('lic.p.after')}</b> ${esc(focus.card.afterSchool)}</p>
      ${stud.length ? `<p class="small muted">${t('lic.p.studia')} ${stud.map(esc).join('; ')}</p>` : ''}</details>
    <h2>${t('lic.p.schools')}</h2>
    ${!hasInput() ? `<p class="note2">${t('lic.p.mark')} <button class="linkbtn" data-go="szkola">${t('lic.mark')}</button></p>` : ''}
    ${filterBar(false)}
    ${hasInput() ? `<div class="frow" role="group" aria-label="${t('lic.order')}"><span class="small muted">${t('lic.p.first')}</span><button class="chip" data-sort="" aria-pressed="${ui.sort !== 'chance'}">${t('lic.p.best')}</button><button class="chip" data-sort="chance" aria-pressed="${ui.sort === 'chance'}">${t('lic.p.chance')}</button></div>` : ''}
    <p class="count small" role="status">${plural(groups.length, 'lic.n.schools')} · ${plural(rows.length, 'lic.n.classes')}${ui.type || ui.chance || ui.parea || ui.travel ? ` · <button class="linkbtn" data-fclear>${t('lic.f.clear')}</button>` : ''}</p>
    ${groups.length ? `<div class="scards">${first.map(schoolCard).join('')}</div>${rest.length ? `<details class="more"><summary>${plural(rest.length, 'lic.p.more')}</summary><div class="scards">${rest.map(schoolCard).join('')}</div></details>` : ''}`
      : `<div class="empty">${LILLUS.pusto}<p>${t('lic.p.empty')} <button class="linkbtn" data-fclear>${t('lic.f.Clear')}</button></p></div>`}
    ${biGroups.length ? `<h2 class="bih">${t('lic.p.bi')}</h2><p class="small">${t('lic.p.biLead')} <button class="linkbtn" data-bi="nie">${t('lic.p.hide')}</button></p>
      <div class="scards">${biGroups.map(schoolCard).join('')}</div>` : biHidden ? `<p class="note2">${t('lic.p.biHidden', { n: biHidden })} <button class="linkbtn" data-bi="tak">${t('lic.p.show')}</button></p>` : ''}
    ${groups.length + biGroups.length ? mapBlock([...groups, ...biGroups].map(g => ({ school: g.school, classes: g.rows, best: g.best })), t('lic.map.profile')) : ''}
    ${parentTable(rowsAll)}
    <h2>${t('lic.p.others')}</h2>
    <div class="actions">${others.map(p => `<button class="btn ghost" data-prof="${p.profile.id}">${p.compass.pos} · ${esc(p.profile.short)}</button>`).join('')}<button class="btn ghost" data-go="wyniki">${t('lic.p.whole')}</button></div>`;
}

// ---- parent summary (backlog P1): one printable page from the kid's answers; print or save as PDF in the browser ------
function vParent() {
  const { r, P } = compassData(), l = L0(), liked = likedRows();
  const north = P[0], sel = P.find(x => x.profile.id === A.profile) || north;
  const rows = (liked.length ? liked : sel.classes.slice(0, 6)).slice(0, 8);
  const chance = x => (x.check.chance && x.check.chance !== 'unknown' ? CHANCE_TXT[x.check.chance] : t('lic.ch.none'));
  const th = x => (x.cls.entry ? t('lic.pp.exam') : x.cls.threshold != null ? f2(x.cls.threshold) : t('lic.pp.no'));
  const vals = A.values.map(v => (data.dimensions.values.find(x => x.id === v) || {}).name || v);
  const checks = A.checks || {}, plan = planItems({ card: sel.areas[0].card, classes: sel.classes });
  const likedSchools = l.schools.map(id => data.schools.find(s => s.id === id)).filter(s => s && !liked.some(x => x.school.id === s.id));
  return `<div class="parentpage">
    <p class="noprint actions"><button class="btn" data-print>${t('lic.pp.print')}</button><button class="btn ghost" data-go="wyniki">← ${t('lic.backCompass')}</button></p>
    <header class="pp-head"><h1>${t('lic.pp.title')}</h1>
      <p>${A.name ? `<b>${esc(A.name)}</b> · ` : ''}${today()} · ${esc(townNames())}${A.from && fromName() ? ` · ${t('lic.pp.from', { from: esc(fromName()) })}` : ''}</p>
      <p class="small">${t('lic.pp.note')}</p></header>
    <section><h2>${t('lic.pp.dirs')}</h2><ol class="pp-dirs">${P.slice(0, 3).map((x, i) => `<li><b>${x.compass.pos} · ${esc(x.profile.name)}</b> (${fitWord(x.fit)})${!i && x.areas[0].reasons.length ? `<br><span class="small">${esc(x.areas[0].reasons.join('; '))}</span>` : ''}</li>`).join('')}</ol>
      <p class="small">${t('lic.pp.further')} ${P.slice(3).map(x => `${x.compass.pos} ${esc(x.profile.short || x.profile.name)}`).join(' · ')}</p></section>
    <section class="pp-two"><div><h2>${t('lic.step.mocne')}</h2><ul>${provenStrengths(A).map(x => `<li>${esc(nameOf(x.id))}: ${esc(whereTxt(x.proof.trim()))}</li>`).join('')}</ul></div>
      <div><h2>${t('lic.pp.values')}</h2><ol>${vals.map(v => `<li>${esc(v)}</li>`).join('')}</ol></div></section>
    <section><h2>${liked.length ? t('lic.pp.myList') : t('lic.pp.toCheck', { name: esc(sel.profile.name) })}</h2>
      <table class="pp-table"><thead><tr><th>${t('lic.pp.h.school')}</th><th>${t('lic.pp.h.class')}</th><th>${t('lic.pp.h.chance')}</th><th>${t('lic.pp.h.th', { year: esc(data.config.thresholdYear) })}</th>${A.from ? `<th>${t('lic.sc.route')}</th>` : ''}</tr></thead>
      <tbody>${rows.map(x => `<tr><td>${esc(x.school.short)}</td><td>${esc(x.cls.code)} ${esc(x.cls.label)}${esc(biText(x.cls))}</td><td>${esc(chance(x))}</td><td>${th(x)}</td>${A.from ? `<td>${mins(x.school) != null ? minTxt(x.school) : '–'}</td>` : ''}</tr>`).join('')}</tbody></table>
      ${likedSchools.length ? `<p class="small">${t('lic.pp.likedSchools', { list: likedSchools.map(s => esc(s.short)).join(', ') })}</p>` : ''}
      ${l.profiles.length ? `<p class="small">${t('lic.pp.likedProfiles', { list: l.profiles.map(id => esc((data.profiles.find(p => p.id === id) || {}).name || id)).join(', ') })}</p>` : ''}</section>
    <section><h2>${t('lic.pp.plan')}</h2><ul class="pp-plan">${plan.map(it => `<li>${checks[`${sel.areas[0].card.id}:${it.id}`] ? '☑' : '☐'} <b>${esc(it.when)}:</b> ${esc(it.text)}</li>`).join('')}</ul></section>
    <section class="pp-note"><h2>${t('lic.pp.numbers')}</h2>
      <p class="small">${hasInput() ? (eff().approx ? t('lic.pp.soft') : t('lic.pp.exact')) : t('lic.pp.none')}
      ${esc(tOr('lic.cfg.thresholdNote', data.config.thresholdNote))} ${region().id !== 'krakow' ? t('lic.pp.tychy') : ''} ${t('lic.pp.check')}
      ${A.from ? t('lic.pp.travel') : ''}</p>
      <p class="small">${t('lic.pp.talk')}</p></section>
    <p class="small muted">${t('lic.pp.foot', { v: esc(data.config.appVersion), d: esc(data.config.dataVersion) })}</p>
  </div>`;
}

// ---- Moja lista ----------------------------------------------------------------------------------------------------
function likedRows() {
  const p = eff(), l = L0(), out = [];
  for (const key of l.classes) { const [sid, code] = key.split('|'), school = data.schools.find(s => s.id === sid), cls = school && school.classes.find(c => c.code === code);
    if (cls) out.push({ school, cls, rank: 0, check: checkClass(p, cls, school, data.config) }); }
  return out;
}
function vList() {
  const { P } = compassData(), l = L0(), rows = likedRows();
  const profs = P.filter(x => l.profiles.includes(x.profile.id));
  const schoolsOnly = l.schools.filter(id => !rows.some(r => r.school.id === id)).map(id => data.schools.find(s => s.id === id)).filter(Boolean);
  const groups = schoolGroups(rows);
  const empty = !profs.length && !rows.length && !schoolsOnly.length;
  return `<div class="rhead"><div><h1>${t('lic.nav.lista')}</h1><p class="lead">${t('lic.list.lead')}</p></div>${LILLUS.szkoly}</div>
    ${empty ? `<div class="empty">${LILLUS.pusto}<p>${t('lic.list.empty')}</p><p><button class="btn" data-go="wyniki">${t('lic.list.toCompass')}</button></p></div>` : ''}
    ${profs.length ? `<h2>${t('lic.list.profiles')}</h2><ul class="prows">${profs.map(profileRow).join('')}</ul>` : ''}
    ${groups.length ? `<h2>${t('lic.list.classes')}</h2><div class="scards">${groups.map(schoolCard).join('')}</div>` : ''}
    ${schoolsOnly.length ? `<h2>${t('lic.nav.szkoly')}</h2><div class="scards">${schoolsOnly.map((s, i) => schoolCard({ school: s, rows: [], best: 'unknown' }, i)).join('')}</div>` : ''}
    ${groups.length || schoolsOnly.length ? mapBlock([...groups.map(g => ({ school: g.school, classes: g.rows, best: g.best })), ...schoolsOnly.map(s => ({ school: s, classes: [], best: 'unknown' }))], t('lic.map.list')) : ''}
    ${empty ? '' : exportBox(t('lic.list.save'))}`;
}

// ---- filters and the school catalogue ------------------------------------------------------------------------------
const ui = { q: '', type: '', subj: '', chance: '', parea: '', sort: '', travel: '', bi: '' };
const ROMAN = [[40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const rankNo = s => ((data.rank || {})[s.id] || { order: 999 }).order;
const romanNo = s => { if (s.type !== 'liceum') return 0; const r = s.short.split(' ')[0]; for (let n = 1; n < 60; n++) if (toRoman(n) === r) return n; return 99; };
const toRoman = n => { let o = ''; for (const [v, r] of ROMAN) while (n >= v) { o += r; n -= v; } return o; };
const fold = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase();
function schoolMatch(school, q) {
  q = q.trim(); if (!q) return true;
  const num = q.match(/^(\d{1,2})(\s*lo)?$/i);
  if (num) return school.type === 'liceum' && school.short.split(' ')[0] === toRoman(Number(num[1]));
  const hay = fold([school.name, school.short, school.address, ...school.classes.map(c => c.label + ' ' + (c.occupation || ''))].join(' '));
  return fold(q).split(/\s+/).every(w => hay.includes(w));
}
const rowPass = x => (!ui.bi || (ui.bi === 'dw') === !!x.cls.bilingual) && (!ui.travel || (mins(x.school) != null && mins(x.school) <= Number(ui.travel))) && (!ui.type || x.school.type === ui.type) && (!ui.chance || x.check.chance === ui.chance)
  && (!ui.subj || x.cls.cards.some(id => ((data.opportunities.find(o => o.id === id) || {}).worlds || []).includes(ui.subj)));
const SHORT_CH = c => t(['realna', 'zawalczenia', 'ambitna', 'szkola'].includes(c) ? `lic.short.${c}` : 'lic.short.none');
const SUBJ_F = ['matematyka', 'informatyka', 'fizyka', 'biologia', 'chemia', 'geografia'];
function filterBar(full) {
  const c = (k, v, t) => `<button class="chip" data-f="${k}:${v}" aria-pressed="${ui[k] === v}">${t}</button>`;
  return `<div class="filters" role="group" aria-label="${t('lic.f.aria')}">
    ${full ? `<label class="srch"><span class="visually-hidden">${t('lic.f.search')}</span><input id="fq" type="search" data-filter="q" value="${esc(ui.q)}" placeholder="${t('lic.f.searchPh')}" autocomplete="off"></label>` : ''}
    <div class="frow"><span class="small muted">${t('lic.f.school')}</span>${c('type', '', t('lic.all'))}${c('type', 'liceum', t('lic.type.liceum'))}${c('type', 'technikum', t('lic.type.technikum'))}</div>
    ${full ? `<div class="frow"><span class="small muted">${t('lic.f.world')}</span>${c('subj', '', t('lic.f.any'))}${data.questions.worlds.map(w => c('subj', w.id, esc(w.name))).join('')}</div>` : ''}
    ${A.from && origins().length ? `<div class="frow"><span class="small muted">${t('lic.f.from', { from: esc(fromName()) })}</span>${c('travel', '', t('lic.f.any'))}${c('travel', '30', t('lic.f.upto', { m: 30 }))}${c('travel', '45', t('lic.f.upto', { m: 45 }))}</div>` : ''}
    ${full ? `<div class="frow"><span class="small muted">${t('lic.f.classes')}</span>${c('bi', '', t('lic.all'))}${c('bi', 'bez', t('lic.f.noTest'))}${c('bi', 'dw', t('lic.f.bi'))}</div>` : ''}
    ${hasInput() ? `<div class="frow"><span class="small muted">${t('lic.f.chance')}</span>${c('chance', '', t('lic.f.anyF'))}${c('chance', 'realna', t('lic.short.realna'))}${c('chance', 'zawalczenia', t('lic.short.zawalczenia'))}${c('chance', 'ambitna', t('lic.short.ambitna'))}</div>` : ''}
  </div>`;
}
function vSources() {
  const all = Object.values(SRC()), q = fold(ui.srcq || '');
  const used = (list) => new Set(list.flatMap(s => [...srcIds(s)]));
  const krk = used(data.allSchools.filter(s => s.town === 'krakow')), gzm = used(data.allSchools.filter(s => s.town !== 'krakow'));
  const rules = srcIds(data.config), ranks = data.rankSrc || new Set();
  const group = id => ranks.has(id) ? 'rank' : rules.has(id) ? 'rules' : krk.has(id) ? 'krk' : gzm.has(id) ? 'gzm' : 'other';
  const G = ['rules', 'rank', 'krk', 'gzm', 'other'].map(g => [g, t(`lic.srcg.${g}`)]);
  const shown = all.filter(x => !q || fold(x.title + ' ' + x.url).includes(q));
  const nCheck = all.filter(x => x.status === 'check').length;
  return `<p class="actions noprint"><button class="btn ghost small" data-go="szkoly">← ${t('lic.nav.szkoly')}</button><button class="btn ghost small" data-go="wyniki">${t('lic.my.compass')}</button></p>
    <h1>${t('lic.foot.sources')}</h1>
    <p class="lead">${t('lic.src.lead', { n: all.length, c: nCheck })}</p>
    <label class="srch"><span class="visually-hidden">${t('lic.src.search')}</span><input id="srcq" type="search" data-filter="srcq" value="${esc(ui.srcq || '')}" placeholder="${t('lic.src.searchPh')}" autocomplete="off"></label>
    ${G.map(([g, name]) => { const L = shown.filter(x => group(x.id) === g); return L.length ? `<section class="card"><h2>${name} <span class="small muted">(${L.length})</span></h2><ul class="small srcl">${L.map(x => `<li>${srcLink(x)}</li>`).join('')}</ul></section>` : ''; }).join('')}
    ${shown.length ? '' : `<p class="empty">${t('lic.src.empty')}</p>`}
    <p class="small muted">${t('lic.src.foot')}</p>`;
}
function vSchools() {
  const p = eff();
  const all = data.schools.map(school => ({ school, rows: school.classes.map(cls => ({ school, cls, check: checkClass(p, cls, school, data.config) })) }));
  const shown = all.filter(x => schoolMatch(x.school, ui.q)).map(x => ({ ...x, rows: x.rows.filter(rowPass) })).filter(x => x.rows.length)
    .sort((a, b) => a.school.type.localeCompare(b.school.type) || (ui.sort === 'matura' ? rankNo(a.school) - rankNo(b.school) : 0) || romanNo(a.school) - romanNo(b.school) || a.school.short.localeCompare(b.school.short, 'pl', { numeric: true }));
  const nCls = shown.reduce((t, x) => t + x.rows.length, 0);
  const entries = shown.map(x => ({ school: x.school, classes: x.rows, best: bestOf(x.rows) }));
  const card = (x, i) => schoolCard({ school: x.school, rows: x.rows, best: bestOf(x.rows) }, i);
  return `<div class="rhead"><div><h1>${t('lic.sch.title', { where: townsIn() })}</h1>
    <p class="lead">${t('lic.sch.lead', { n: data.schools.length, where: townsIn() })} ${hasInput() ? t('lic.sch.chances') : t('lic.sch.mark')}</p>
    ${needResults() ? '' : `<div class="actions"><button class="btn ghost" data-go="wyniki">${t('lic.my.compass')}</button></div>`}</div>${LILLUS.szkoly}</div>
    <div class="frow"><span class="small muted">${t('lic.sch.where')}</span>${regionChips()}</div>
    ${filterBar(true)}
    <div class="frow" role="group" aria-label="${t('lic.order')}"><span class="small muted">${t('lic.sch.order')}</span><button class="chip" data-sort="" aria-pressed="${ui.sort !== 'matura'}">${t('lic.sch.byNo')}</button><button class="chip" data-sort="matura" aria-pressed="${ui.sort === 'matura'}">${t('lic.sch.byMatura')}</button></div>
    <p class="count small" role="status">${t('lic.sch.count', { a: shown.length, b: plural(data.schools.length, 'lic.n.schools') })} · ${plural(nCls, 'lic.n.classes')}${ui.q || ui.type || ui.subj || ui.chance || ui.travel || ui.bi ? ` · <button class="linkbtn" data-fclear>${t('lic.f.clear')}</button>` : ''}</p>
    ${shown.length ? `<div class="scards">${shown.map(card).join('')}</div>` : `<div class="empty">${LILLUS.pusto}<p>${t('lic.sch.empty')} <button class="linkbtn" data-fclear>${t('lic.f.Clear')}</button></p></div>`}
    ${shown.length ? mapBlock(entries, t('lic.map.above')) : ''}
    <p class="small"><button class="linkbtn" data-go="zrodla">${t('lic.allSources')}</button></p>
    <p class="note2">${t('lic.sch.note')}${region().note ? ' ' + esc(tOr(`lic.region.${region().id}.note`, region().note)) : ''}</p>`;
}

// ---- map (Leaflet from vendor/, OpenStreetMap tiles; loaded only when a map is on screen) ------------------------------------------------
let mapObj = null, leafletP = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return leafletP ||= new Promise((res, rej) => {
    const css = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'vendor/leaflet/leaflet.css' });
    const js = Object.assign(document.createElement('script'), { src: 'vendor/leaflet/leaflet.js', onload: () => res(window.L), onerror: () => { leafletP = null; rej(new Error('leaflet')); } });
    document.head.append(css, js);
  });
}
const CHANCE_RANK = { realna: 3, zawalczenia: 2, ambitna: 1 };
function bestOf(classes) { let b = 'unknown'; for (const x of classes) if ((CHANCE_RANK[x.check.chance] || 0) > (CHANCE_RANK[b] || 0)) b = x.check.chance; return b; }
let mapEntries = null;
const dirUrl = s => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address || (s.name + ', ' + townOf(s.town).name))}&travelmode=transit`; // Polish town name: it is an address
// Town filter above the map (v2.8): only when the area has more than one town with schools in this list. Memory only (ui).
function mapTowns(list) {
  const have = new Set(list.map(e => e.school.town));
  return selTowns().filter(t => have.has(t));
}
function mapTownChips(list) {
  const towns = mapTowns(list);
  if (towns.length < 2) { ui.mapTown = ''; return ''; }
  if (!towns.includes(ui.mapTown)) ui.mapTown = '';
  return `<div class="chips maptowns" role="group" aria-label="${t('lic.map.town')}">${chip('data-maptown=""', t('lic.all'), !ui.mapTown)}${towns.map(tw => chip(`data-maptown="${esc(tw)}"`, esc(townName(townOf(tw))), ui.mapTown === tw)).join('')}</div>`;
}
function applyMapTown() {
  if (!mapObj || !mapObj._pins) return;
  const pts = [];
  for (const id of Object.keys(mapObj._pins)) {
    const m = mapObj._pins[id], on = !ui.mapTown || m._town === ui.mapTown;
    if (on) { if (!mapObj.hasLayer(m)) m.addTo(mapObj); pts.push(m.getLatLng()); } else { m.closePopup(); if (mapObj.hasLayer(m)) mapObj.removeLayer(m); }
  }
  if (pts.length > 1) mapObj.fitBounds(pts, { padding: [30, 30], maxZoom: 14, animate: false }); else if (pts.length) mapObj.setView(pts[0], 14);
}
function mapBlock(list, intro) {
  mapEntries = list;
  return `<h2>${t('lic.map.title')}</h2><p class="small muted">${intro} ${t('lic.map.lead', { links: transitLinks() })}</p>
    ${mapTownChips(list)}${legend()}
    <div class="mapbox" id="map" role="region" aria-label="${t('lic.map.aria', { where: townsIn() })}"><p class="mapfail muted small">${t('lic.map.loading')}</p></div>`;
}
const legend = () => `<p class="legend small"><span class="mapnum realna" aria-hidden="true"></span> ${t('lic.short.realna')} <span class="mapnum zawalczenia" aria-hidden="true"></span> ${t('lic.short.zawalczenia')} <span class="mapnum ambitna" aria-hidden="true"></span> ${t('lic.short.ambitna')} <span class="mapnum unknown" aria-hidden="true"></span> ${t('lic.short.none')}</p>`;
function initMap(list) {
  const box = document.getElementById('map'); if (!box) return;
  loadLeaflet().then(L => {
    if (!document.getElementById('map') || document.getElementById('map') !== box) return;
    if (mapObj) { mapObj.remove(); mapObj = null; }
    mapObj = L.map(box, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([50.0647, 19.945], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(mapObj);
    box.querySelector('.mapfail')?.remove();
    const pts = [], pins = {};
    list.forEach((e, i) => {
      const g = e.school.geo; if (!g) return;
      const icon = L.divIcon({ className: '', html: `<span class="pin ${e.best}">${i + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14] });
      const m = L.marker([g.lat, g.lon], { icon, title: e.school.short }).addTo(mapObj)
        .bindPopup(`<b>${esc(e.school.short)}</b>${mins(e.school) != null ? ` · ${minTxt(e.school)}` : ''}<br>${e.classes.slice(0, 6).map(x => `${esc(x.cls.code)}: ${esc(x.check.chance && x.check.chance !== 'unknown' ? CHANCE_TXT[x.check.chance] : t('lic.ch.noneLong'))}`).join('<br>')}`);
      m._town = e.school.town; pins[e.school.id] = m; pts.push([g.lat, g.lon]);
    });
    if (pts.length > 1) mapObj.fitBounds(pts, { padding: [30, 30], maxZoom: 14, animate: false }); else if (pts.length) mapObj.setView(pts[0], 14);
    mapObj._pins = pins;
    if (ui.mapTown) applyMapTown();
    const miss = list.filter(e => !e.school.geo).map(e => e.school.short);
    if (!pts.length) mapObj.setView([50.0647, 19.945], 12);
    if (miss.length) box.insertAdjacentHTML('afterend', `<p class="small muted">${t('lic.map.nopin', { list: miss.map(esc).join(', ') })}</p>`);
  }).catch(() => { const f = box.querySelector('.mapfail'); if (f) f.textContent = t('lic.map.fail'); });
}

// ---- export / load ------------------------------------------------------------------------------------------------
function buildMarkdown() {
  const r = scoreLiceum(A, data), s = r.slots, L = [];
  L.push(t('lic.md.title', { name: A.name || t('lic.md.me'), date: today() }), t('lic.md.path', { where: townNames(), v: data.config.appVersion }), '');
  if (needResults()) {
    L.push(t('lic.md.progress'), '');
  } else {
    L.push(t('lic.md.strengths'));
    provenStrengths(A).forEach((x, i) => L.push(t('lic.md.strength', { i: i + 1, name: nameOf(x.id), proof: whereTxt(x.proof.trim()) })));
    const P = profilesFor(r, data);
    L.push('', t('lic.md.compass'));
    P.forEach(x => L.push(`- ${x.compass.pos}: ${x.profile.name} – ${fitWord(x.fit)}${x.compass.pos === 'N' && x.areas[0].reasons.length ? ` (${x.areas[0].reasons.join('; ')})` : ''}`));
    const lk = L0(), lr = likedRows();
    if (nLikes()) {
      L.push('', t('lic.md.list'));
      lk.profiles.forEach(id => { const p = data.profiles.find(x => x.id === id); if (p) L.push(t('lic.md.lprofile', { name: p.name })); });
      lk.schools.forEach(id => { const sc = data.schools.find(x => x.id === id); if (sc) L.push(`${t('lic.md.lschool', { name: sc.short })}${sc.address ? ', ' + sc.address : ''}${mins(sc) != null ? t('lic.md.travelFrom', { min: minTxt(sc), from: fromName() }) : ''}`); });
      lr.forEach(x => L.push(`${t('lic.md.lclass', { school: x.school.short, code: x.cls.code, label: x.cls.label })}${biText(x.cls)}: ${x.check.chance && x.check.chance !== 'unknown' ? CHANCE_TXT[x.check.chance] : t('lic.ch.noneLong')}`));
    }
    const selP = P.find(x => x.profile.id === A.profile) || P[0], sel = { card: selP.areas[0].card, classes: selP.classes };
    L.push('', t('lic.md.classes', { where: townsIn(), name: selP.profile.name }));
    if (region().transit) L.push(t('lic.md.transit', { list: region().transit.map(l => `${l.name} ${l.url}`).join(', ') }));
    L.push(t('lic.md.year', { year: data.config.thresholdYear, note: tOr('lic.cfg.thresholdNote', data.config.thresholdNote) }));
    for (const x of sel.classes.slice(0, 12)) L.push(`${t('lic.md.class', { school: x.school.short, code: x.cls.code, label: x.cls.label })}${biText(x.cls)}: ${x.check.chance && x.check.chance !== 'unknown' ? CHANCE_TXT[x.check.chance] : t('lic.ch.noneLong')}${mins(x.school) != null ? t('lic.md.travel', { min: minTxt(x.school) }) : ''}`);
    L.push('', t('lic.md.parents'), hasInput() ? (eff().approx ? t('lic.md.soft') : t('lic.pt.exact')) : t('lic.md.none'), '');
    for (const x of sel.classes.slice(0, 12)) {
      const th = x.cls.entry ? t('lic.md.th.entry') : x.cls.threshold != null ? t('lic.md.th', { n: f2(x.cls.threshold) }) : x.school.range ? t('lic.md.th.range', { a: f2(x.school.range.min), b: f2(x.school.range.max) }) : t('lic.md.th.none');
      L.push(`${t('lic.md.thline', { school: x.school.short, code: x.cls.code, th })}${x.check.complete ? t('lic.md.est', { n: f1(x.check.points) }) : ''}`);
    }
    L.push('', t('lic.md.plan'));
    const checks = A.checks || {};
    for (const it of planItems(sel)) L.push(`- [${checks[`${sel.card.id}:${it.id}`] ? 'x' : ' '}] ${it.when}: ${it.text}`);
    L.push('', t('lic.md.talk'), t('lic.md.q1'), t('lic.md.q2'), t('lic.md.q3'), '');
  }
  L.push(t('lic.md.data'), '```json', JSON.stringify({ app: 'kompas-liceum', version: data.config.appVersion, dataVersion: data.config.dataVersion, date: today(), answers: A }, null, 1), '```');
  return L.join('\n');
}
function fileName() { const n = (A.name || 'ja').trim().toLowerCase().replace(/[^a-z0-9ąćęłńóśźżа-яёіїєґ]+/gi, '-') || 'ja'; return `kompas-liceum-${n}-${today()}.md`; }

function loadFile(text) {
  const obj = parseSaved(text);
  if (!obj || !obj.answers || obj.app !== 'kompas-liceum') { notice = t('lic.load.bad'); render(); return; }
  const a = Object.assign(blank(), obj.answers), missing = [];
  const has = (list, id) => list.some(x => x.id === id);
  const hadMode = (a.points || {}).mode;
  a.points = Object.assign(blank().points, a.points);
  if (!hadMode && (Object.keys(a.points.exam || {}).length || Object.keys(a.points.grades || {}).length)) a.points.mode = 'exact';
  a.strengths = (a.strengths || []).filter(x => has(data.strengths, x.id) || (missing.push(t('lic.load.m.strength') + x.id), false));
  a.values = (a.values || []).filter(v => has(data.dimensions.values, v) || (missing.push(t('lic.load.m.value') + v), false));
  if (!Array.isArray(obj.answers.worlds)) a.worlds = ['all']; // files from before v1.7
  if (!REGIONS().some(r => r.id === a.region)) a.region = Array.isArray(a.towns) && a.towns.length === 1 && a.towns[0] === 'tychy' ? 'tychy' : 'krakow'; // v2.0.0 files had towns[]; older: Kraków
  delete a.towns;
  if (!['tak', 'nie'].includes(a.bi)) a.bi = null; // files from before v2.5
  { const ok = ((data.config.regions || []).find(r => r.id === a.region) || { towns: [] }).towns.flatMap(t => (data.travel[t] && data.travel[t].origins) || []); if (!ok.some(o => o.id === a.from)) a.from = null; }
  for (const k of Object.keys(a.sort || {})) if (!has(data.questions.activities, k)) { delete a.sort[k]; missing.push(t('lic.load.m.activity') + k); }
  for (const k of Object.keys(a.situations || {})) if (!has(data.questions.situations, k)) { delete a.situations[k]; missing.push(t('lic.load.m.situation') + k); }
  if (a.area && !has(data.opportunities, a.area)) { missing.push(t('lic.load.m.area') + a.area); a.area = null; }
  { const v = visibleActivities(a, data), i = v.findIndex(x => !(x.id in a.sort)); a.sortPos = i < 0 ? v.length : i; }
  a.sitPos = Object.keys(a.situations).length;
  A = a; applyTowns(); savedSnap = answersKey();
  notice = t('lic.load.ok', { date: esc(obj.date || '?') }) + (missing.length ? ` ${t('lic.load.missing', { list: missing.map(esc).join(', ') })}` : '');
  const last = screens.find(s => s.id === a.lastScreen && s.id !== 'start'); // U6: back to the screen the kid left
  const open = screens.find(s => s.ok && !s.ok()); // otherwise: first step that still needs an answer
  const target = '#/' + (last ? last.id : open ? open.id : 'wyniki');
  notice += last ? ` ${t('lic.load.last')}` : open ? ` ${t('lic.load.open')}` : '';
  if (location.hash === target) render(); else location.hash = target;
}

async function doExport(kind) {
  const msg = document.getElementById('fmsg');
  if (kind === 'download') {
    const md = buildMarkdown(), url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' })), name = fileName();
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (msg) msg.textContent = t('lic.save.msg');
    savedSnap = answersKey(); save();
    toast(t('lic.save.toast', { name: esc(name) }));
  } else {
    const closed = [...document.querySelectorAll('details:not([open])')]; closed.forEach(d => { d.open = true; }); window.print(); closed.forEach(d => { d.open = false; });
  }
}

// ---- events -------------------------------------------------------------------------------------------------------
document.addEventListener('click', e => {
  const el = e.target.closest('button, a, [data-prof]'); if (!el || !data) return;
  const d = el.dataset;
  if (d.uilang !== undefined) { switchLang(d.uilang); return; }
  if (d.go) { e.preventDefault(); if (location.hash === '#/' + d.go) render(); else location.hash = '#/' + d.go; return; }
  if (d.region) { A.region = d.region; applyTowns(); if (!origins().some(o => o.id === A.from)) { A.from = null; ui.travel = ''; } save(); render(); return; }
  if (d.from !== undefined) { A.from = d.from || null; if (!A.from) ui.travel = ''; save(); render(); return; }
  if (d.world) { let w = A.worlds || []; if (d.world === 'all') w = w.includes('all') ? [] : ['all']; else { w = w.filter(x => x !== 'all'); w = w.includes(d.world) ? w.filter(x => x !== d.world) : [...w, d.world]; } A.worlds = w; syncSort(); save(); render(); return; }
  if (d.where) { const [id, w] = d.where.split('|'), s = A.strengths.find(x => x.id === id); if (s) s.proof = s.proof === w ? '' : w; save(); render(); return; }
  if (d.sortans !== undefined) { sortAnswer(Number(d.sortans)); return; }
  if ('sortback' in d) { A.sortPos = Math.max(0, A.sortPos - 1); delete A.sort[acts()[A.sortPos].id]; render(); return; }
  if ('sortreset' in d) { A.sortPos = 0; render(); return; }
  if (d.sitans !== undefined) { const q = data.questions.situations[A.sitPos]; if (d.sitans) A.situations[q.id] = d.sitans; else delete A.situations[q.id]; A.sitPos++; render(); return; }
  if ('sitback' in d) { A.sitPos = Math.max(0, A.sitPos - 1); render(); return; }
  if ('sitreset' in d) { A.sitPos = 0; render(); return; }
  if (d.value) { const i = A.values.indexOf(d.value); if (i >= 0) A.values.splice(i, 1); else if (A.values.length < 3) A.values.push(d.value); save(); render(); return; }
  if (d.strength) { const i = A.strengths.findIndex(s => s.id === d.strength); if (i >= 0) A.strengths.splice(i, 1); else if (A.strengths.length < 3) A.strengths.push({ id: d.strength, proof: '' }); save(); render(); return; }
  if (d.area) { A.area = d.area; save(); render(); setTimeout(() => document.querySelector('.cls')?.scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' }), 30); return; }
  if (d.soft) { const [kind, key, val] = d.soft.split(':'), tgt = (A.points.soft[kind === 'exam' ? 'exam' : 'grades'] ||= {}); if (tgt[key] === val) delete tgt[key]; else tgt[key] = val; A.points.mode = 'soft'; save(); render(); return; }
  if (d.mode) { A.points.mode = d.mode; save(); render(); return; }
  if (d.bi) { A.bi = d.bi; save(); render(); return; }
  if (d.prof) { A.profile = d.prof; ui.parea = ''; save(); if (location.hash === '#/profil') render(); else location.hash = '#/profil'; return; }
  if (d.parea !== undefined) { ui.parea = d.parea; render(); return; }
  if (d.sort !== undefined) { ui.sort = d.sort; render(); return; }
  if (d.like) {
    const k = d.like[0], id = d.like.slice(2), arr = L0()[KIND[k]], i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id); save();
    if (current().id === 'lista') { render(); return; }
    const on = i < 0;   // update hearts in place, so the page and the map do not jump
    document.querySelectorAll('[data-like]').forEach(b => { if (b.dataset.like === d.like) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', t(on ? 'lic.like.remove' : 'lic.like.add') + b.getAttribute('aria-label').replace(/^[^:]*/, '')); } });
    if (k === 's') document.querySelectorAll('.scard').forEach(c => { if (c.querySelector(`[data-like="s:${CSS.escape(id)}"]`)) c.classList.toggle('liked', on); });
    likeCount(); return;
  }
  if (d.f) { const [k, v] = d.f.split(':'); ui[k] = ui[k] === v ? '' : v; render(); return; }
  if ('fclear' in d) { Object.assign(ui, { q: '', type: '', subj: '', chance: '', parea: '', travel: '', bi: '' }); render(); return; }
  if (d.maptown !== undefined) {
    ui.mapTown = d.maptown;
    document.querySelectorAll('[data-maptown]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.maptown === ui.mapTown)));
    applyMapTown(); return;
  }
  if (d.pin) { const m = mapObj && mapObj._pins && mapObj._pins[d.pin]; if (m) { if (!mapObj.hasLayer(m)) { ui.mapTown = ''; document.querySelectorAll('[data-maptown]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.maptown === ''))); applyMapTown(); } document.getElementById('map').scrollIntoView({ block: 'center', behavior: calm() ? 'auto' : 'smooth' }); mapObj.setView(m.getLatLng(), 15); m.openPopup(); } return; }
  if (d.export) { doExport(d.export); return; }
  if ('print' in d) { window.print(); return; }
  if ('comfort' in d) { const bar = document.getElementById('comfortbar'); if (bar) { bar.hidden = !bar.hidden; el.setAttribute('aria-expanded', String(!bar.hidden)); } return; }
  if ('big' in d) { A.bigText = !A.bigText; applyComfort(); save(); return; }
  if ('calm' in d) { A.calm = !A.calm; applyComfort(); save(); return; }
  if ('themetoggle' in d) { const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; theme = dark ? 'light' : 'dark'; applyTheme(); return; }
  if ('skintoggle' in d) { skin = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length]; applySkin(true); return; }
  if (d.skinpick !== undefined) { skin = d.skinpick || null; applySkin(true); return; }
  if (d.persona) { const p = data.personas.find(x => x.id === d.persona); A = Object.assign(blank(), JSON.parse(JSON.stringify(p.answers))); if (!Array.isArray(p.answers.worlds)) delete A.worlds; A.points = Object.assign(blank().points, A.points); if (!(p.answers.points || {}).mode && Object.keys(A.points.exam || {}).length) A.points.mode = 'exact'; A.sortPos = acts().length; A.sitPos = data.questions.situations.length; applyTowns(); if (location.hash === '#/wyniki') render(); else location.hash = '#/wyniki'; }
});
document.addEventListener('change', e => {
  const t = e.target, d = t.dataset;
  if (d.load !== undefined && t.files && t.files[0]) { const rd = new FileReader(); rd.onload = () => loadFile(String(rd.result)); rd.readAsText(t.files[0]); t.value = ''; return; }
  if (d.grade) { if (t.value) A.points.grades[d.grade] = Number(t.value); else delete A.points.grades[d.grade]; save(); liveUpdate(); return; }
  if (d.pt === 'stripe' || d.pt === 'volunteering') { A.points[d.pt] = t.checked; save(); liveUpdate(); return; }
  if (d.areasel !== undefined) { A.area = t.value; save(); render(); return; }
  if (d.check) { A.checks[d.check] = t.checked; save(); }
});
document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.filter) { ui[d.filter] = t.value; clearTimeout(window._fq); window._fq = setTimeout(render, 180); return; }
  if (d.field) { A[d.field] = t.value; save(); return; }
  if (d.slider) { A.sliders[d.slider] = Number(t.value); save(); return; }
  if (d.exam) { if (t.value === '') delete A.points.exam[d.exam]; else A.points.exam[d.exam] = Math.max(0, Math.min(100, Number(t.value))); save(); liveUpdate(); return; }
  if (d.pt === 'achievements') { A.points.achievements = Math.max(0, Math.min(18, Number(t.value) || 0)); save(); liveUpdate(); return; }
  if (d.proof) {
    const s = A.strengths.find(x => x.id === d.proof); s.proof = t.value; save();
    const ok = provenStrengths(A).length === 3, next = $app.querySelector('.nav .btn:not(.ghost)'); if (next) next.disabled = !ok;
    const h = document.getElementById('navhint'); if (h) h.textContent = ok ? '' : current().hint();
  }
});

load().catch(err => { $app.innerHTML = `<p>${t('lic.loadFail', { err: esc(err.message) })}</p>`; });
