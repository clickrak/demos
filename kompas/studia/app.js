// Kompas Studia v3.1.0. Screens, navigation, results, export.
import { scoreAll, provenStrengths, pathSteps, planFocus, planItems, WHERE, isWhere, proofText, declarationHelp, compareIds, subjectFit } from '../core/scoring.js';
import { buildMarkdown, fileName, parseSaved, payLabel } from '../core/export.js';
import { icon, scenArt, FORCE_ICON } from './icons.js';
import { storyHtml, storyInit, storyClick } from './story.js';
import { ILLUS } from './illus.js';
import { actPicto, sitPicto } from './pictos.js';
import { t, plural, setLang, getLang, loadDict, normLang, HTML_LANG } from '../core/i18n.js';

const $app = document.getElementById('app');
const TEST = new URLSearchParams(location.search).has('test');
let data, A;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ lang: getLang(), name: '', certainty: null, direction: null, rozszerzenia: [], jezyki: { pl: 'bardzo dobry' }, sport: '',
  sort: {}, sortPos: 0, situations: {}, sitPos: 0, sliders: {}, values: [], strengths: [], scenario: null, neededWhere: null, homePlaces: [],
  studyLength: null, privateOk: null, startMin: 30, doubt: null, doubtStrong: false, reflection: {}, canDo: '', plan: null, checks: {}, stars: [], compare: [] });

async function load() {
  const get = p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  const [dimensions, strengths, config, questions, scenarios, opportunities, offers, campuses, sources, personas] = await Promise.all([
    '../core/dimensions.json', '../core/strengths.json', 'data/config.json', 'data/questions.json', 'data/scenarios.json',
    'data/opportunities.json', 'data/db/pl/krakow/offers.json', 'data/db/pl/krakow/campuses.json', 'data/sources.json', 'data/personas.json'
  ].map(get));
  data = { dimensions, strengths, config, questions, scenarios, opportunities, offers, campuses, sources, personas };
  // Stops, lines and times computed from the Kraków GTFS timetables (kompas/tools/transport.py); optional.
  data.transport = await fetch('data/db/pl/krakow/transport.json').then(r => (r.ok ? r.json() : null)).catch(() => null);
  for (const c of campuses) Object.assign(c, { tr: data.transport?.campuses?.[c.id] || null });
  // Interface texts: Polish is the base, Ukrainian overlays it (core/i18n.js). ?lang=ua (or uk) picks Ukrainian.
  const [pl, ua, cpl, cua] = await Promise.all(['i18n/pl.json', 'i18n/ua.json', '../core/i18n/pl.json', '../core/i18n/ua.json'].map(f => fetch(f).then(r => (r.ok ? r.json() : {})).catch(() => ({}))));
  loadDict('pl', { ...cpl, ...pl }); loadDict('ua', { ...cua, ...ua });
  setLang(new URLSearchParams(location.search).get('lang'));
  A = blank();
  applyStatic();
  applyTheme(); applySkin();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  window.addEventListener('hashchange', render);
  render();
}

// Answers stay in memory only (no browser storage); the downloaded .md file is the saved copy.
// The header shows a dot while there are answers not yet in a file, and leaving the page asks first.
const answersKey = () => JSON.stringify({ ...A, lang: undefined, lastScreen: undefined, sortPos: undefined, sitPos: undefined });
let savedSnap = null;
const hasAnswers = () => !!(A && (A.certainty || A.rozszerzenia.length || Object.keys(A.sort).length || A.strengths.length));
const isDirty = () => hasAnswers() && answersKey() !== savedSnap;
function updateSaveState() {
  document.querySelectorAll('[data-export="download"].savebtn, .sbar [data-export="download"]').forEach(b => b.classList.toggle('dirty', isDirty()));
}
const save = () => updateSaveState();
window.addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });
function toast(html) {
  const t = document.getElementById('toast'); if (!t) return;
  t.innerHTML = html; t.classList.add('on');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 5200);
}
const stamp = () => { const d = new Date(); return `${today()}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`; };
let theme = null;       // null follows the system; kept in memory only
// Optional skins: "neon" (cyberpunk) and "pop" (pop art). Kept in the address (?skin=…), not in browser storage.
const SKINS = [null, 'neon', 'pop'];
const skinName = k => t('skin.' + (k || 'calm'));
let skin = SKINS.includes(new URLSearchParams(location.search).get('skin')) ? new URLSearchParams(location.search).get('skin') : null;
let focusSel = null;    // a control to focus after the next re-render (keyboard users)
let tapSel = null;      // the control just tapped, so it can pop once after the re-render
let lastProg = { ch: null, w: 0 };
let drawOnce = true;    // the path map draws itself the first time the results open
let notice = '';        // one-time message shown at the top of the next screen
let prevFile = null;
let pendingOpen = null;
let storyCtx = null, storyCleanup = null;
let compassSel = null;  // option picked on the compass (card id or 'quick'); the compass stays on screen
let kierSel = null;     // option shown as a vertical road in "Twoje kierunki"
const seenParts = new Set(); // option to open and scroll to when the results show (from the compass)    // { date, snapshot, missing } after loading an old file

// Texts that sit in index.html (data-i18n, data-i18n-attr), the <html lang>, the title and the switch.
function applyStatic() {
  const lang = getLang();
  document.documentElement.lang = HTML_LANG[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(',').forEach(pair => { const [a, k] = pair.split(':'); el.setAttribute(a, t(k)); }));
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.desc', { v: data?.config?.appVersion || '' }));
  document.querySelectorAll('[data-uilang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.uilang === lang)));
  const u = new URL(location.href);
  if (lang === 'pl') u.searchParams.delete('lang'); else u.searchParams.set('lang', lang);
  history.replaceState(null, '', u);
}
function switchLang(l) {
  setLang(l); if (A) A.lang = getLang();
  applyStatic(); applyTheme(); applySkin(); render();
}

function applyTheme() {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme; else delete root.dataset.theme;
  const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.querySelectorAll('[data-themetoggle]').forEach(b => { b.setAttribute('aria-label', dark ? t('theme.toLight') : t('theme.toDark')); b.innerHTML = b.classList.contains('linkbtn') ? (dark ? t('theme.light') : t('theme.dark')) : dark ? ICON.sun : ICON.moon; });
}
function applySkin(animate) {
  const root = document.documentElement;
  if (skin) root.dataset.skin = skin; else delete root.dataset.skin;
  const next = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length];
  document.querySelectorAll('[data-skintoggle]').forEach(b => { b.setAttribute('aria-pressed', String(!!skin)); b.setAttribute('aria-label', t('skin.label', { cur: skinName(skin), next: skinName(next) })); b.title = t('skin.title', { cur: skinName(skin), next: skinName(next) }); b.innerHTML = ICON.palette; });
  document.querySelectorAll('[data-skinpick]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.skinpick || null) === skin)));
  const u = new URL(location.href);
  if (skin) u.searchParams.set('skin', skin); else u.searchParams.delete('skin');
  history.replaceState(null, '', u);
  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('skin-in'); void root.offsetWidth; root.classList.add('skin-in');
    clearTimeout(applySkin.h); applySkin.h = setTimeout(() => root.classList.remove('skin-in'), 700);
  }
}
const ICON = {
  palette: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7.2" r="1.2"/><circle cx="15" cy="7.4" r="1.2"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  save: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>'
};
const setA = (k, v) => { A[k] = v; save(); render(); };

// ---- screens ----------------------------------------------------------------
const screens = [
  { id: 'start', ch: null, view: vStart },
  { id: 'pewnosc', ch: 'ja', view: vCertainty, ok: () => A.certainty, hint: () => t('app.hint.certainty') },
  { id: 'matura', ch: 'ja', view: vMatura },
  { id: 'jezyki', ch: 'ja', view: vLanguages },
  { id: 'zajecia', ch: 'ja', view: vSort, ok: () => A.sortPos >= data.questions.activities.length, hint: () => t('app.hint.cards_left', { n: data.questions.activities.length - A.sortPos }) },
  { id: 'sytuacje', ch: 'ja', view: vSituations },
  { id: 'styl', ch: 'ja', view: vStyle },
  { id: 'wartosci', ch: 'ja', view: vValues, ok: () => A.values.length === 5, hint: () => t('app.hint.pick_more', { n: 5 - A.values.length }) },
  { id: 'mocne', ch: 'ja', view: vStrengths, ok: () => provenStrengths(A).length === 5, hint: () => A.strengths.length < 5 ? t('app.hint.pick_more', { n: 5 - A.strengths.length })
    : t('app.hint.strengths_where', { list: A.strengths.filter(x => !x.proof.trim()).map(x => nameOf(x.id)).join(', ') }) },
  { id: 'odbicie', ch: 'ja', view: vReveal },
  { id: 'sily', ch: 'swiat', view: vForces },
  { id: 'karty', ch: 'swiat', view: vCardsPreview },
  { id: 'dlugosc', ch: 'droga', view: vLength, ok: () => A.studyLength, hint: () => t('app.hint.length') },
  { id: 'zasieg', ch: 'droga', view: vReach },
  { id: 'niepokoj', ch: 'droga', view: vDoubt },
  { id: 'refleksja', ch: 'droga', view: vReflection },
  { id: 'kompas', ch: 'wyniki', view: vStory },
  { id: 'wyniki', ch: 'wyniki', view: vResults }
];
// Short name and rough minutes per question screen: the side rail and the "time left" line use them.
const META = {
  pewnosc: ['app.meta.certainty', .5], matura: ['app.meta.matura', .5], jezyki: ['app.meta.languages', 1], zajecia: ['app.meta.sort', 4], sytuacje: ['app.meta.situations', 2],
  styl: ['app.meta.style', 1.5], wartosci: ['app.meta.values', 1], mocne: ['app.meta.strengths', 4], odbicie: ['app.meta.reveal', .5],
  sily: ['app.meta.forces', 2], karty: ['app.meta.cards', 1.5],
  dlugosc: ['app.meta.length', 1], zasieg: ['app.meta.reach', .5], niepokoj: ['app.meta.doubt', 1], refleksja: ['app.meta.reflection', 2]
};
const CHAPTERS = [
  { id: 'ja', name: 'app.chapter.ja', sub: 'app.chapter.ja_sub' },
  { id: 'swiat', name: 'app.chapter.world', sub: 'app.chapter.world_sub' },
  { id: 'droga', name: 'app.chapter.road', sub: 'app.chapter.road_sub' }
];
const TICK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
let furthest = 0;       // the furthest screen he has reached; earlier screens count as visited
const stepDone = x => screens.indexOf(x) < furthest && (!x.ok || !!x.ok());
const minsLeft = i => Math.max(1, Math.round(screens.slice(i).reduce((t, x) => t + (META[x.id]?.[1] || 0), 0)));

// Side rail (desktop): the three chapters, the steps of the current one, and the time left.
function railHtml(s) {
  const i = screens.indexOf(s);
  const head = (c, k, all) => `<span class="rno">${all ? TICK : k + 1}</span><span class="rch-t"><b>${t(c.name)}</b><span>${t(c.sub)}</span></span>`;
  const chs = CHAPTERS.map((c, k) => {
    const list = screens.filter(x => x.ch === c.id), all = list.every(stepDone);
    if (c.id !== s.ch) return `<li class="rch${all ? ' done' : ''}"><button data-go="${list[0].id}">${head(c, k, all)}</button></li>`;
    return `<li class="rch on"><div class="rch-h">${head(c, k, false)}</div>
      <ol class="rsteps">${list.map(x => { const gap = x !== s && screens.indexOf(x) < furthest && x.ok && !x.ok();
        return `<li><button data-go="${x.id}" class="${x === s ? 'now' : stepDone(x) ? 'done' : gap ? 'gap' : 'todo'}" ${x === s ? 'aria-current="step"' : ''}>${t(META[x.id][0])}${gap ? '<span class="sr"> ' + t('app.rail.gap') + '</span>' : ''}</button></li>`; }).join('')}</ol></li>`;
  }).join('');
  return `<aside class="rail noprint" aria-label="${t('app.rail.label')}"><ol class="rchs">${chs}
    <li class="rch res"><button data-go="kompas"><span class="rno">${icon('compass', 'ico sm')}</span><span class="rch-t"><b>${t('app.chapter.results')}</b><span>${t('app.rail.results_sub')}</span></span></button></li></ol>
    <p class="rail-t">${t('app.rail.time_left', { n: minsLeft(i) })}</p></aside>`;
}

function current() {
  const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'start';
  return screens.find(s => s.id === id) || screens[0];
}

function render() {
  const s = current();
  document.querySelectorAll('.chapters [data-ch]').forEach(el => { el.classList.toggle('on', el.dataset.ch === s.ch); el.setAttribute('aria-current', el.dataset.ch === s.ch ? 'step' : 'false'); });
  const i = screens.indexOf(s);
  furthest = Math.max(furthest, i);
  const inQ = !!s.ch && s.ch !== 'wyniki';
  const body = s.view();
  const blocked = !!(s.ok && !s.ok());
  const nav = !inQ ? '' : `
    <div class="nav">
      <button class="btn ghost" data-go="${screens[i - 1].id}">${t('app.nav.back')}</button>
      <p class="navhint" id="navhint" role="status">${blocked && s.hint ? esc(s.hint()) : ''}</p>
      <button class="btn" data-go="${screens[i + 1].id}" ${blocked ? 'disabled' : ''} aria-describedby="navhint">${s.id === 'refleksja' ? t('app.nav.show_results') : t('app.nav.next')}</button>
    </div>`;
  const keep = document.activeElement && document.activeElement.id;
  const changed = $app.dataset.screen !== s.id;
  const prevIdx = screens.findIndex(x => x.id === $app.dataset.screen);
  const dir = !changed ? '' : prevIdx > i ? 'slide-b' : 'slide-f';
  const inCh = screens.filter(x => x.ch === s.ch && s.ch !== 'wyniki' && s.ch);
  const progW = inCh.length ? Math.round(100 * (inCh.indexOf(s) + 1) / inCh.length) : 0;
  const progFrom = lastProg.ch === s.ch ? lastProg.w : 0;
  lastProg = { ch: s.ch, w: progW };
  const prog = inCh.length ? `<div class="prog" aria-hidden="true"><i style="width:${progFrom}%" data-to="${progW}"></i></div>` : '';
  const crumb = inQ ? `<p class="crumb">${t('app.nav.crumb', { ch: t(CHAPTERS.find(c => c.id === s.ch).name), k: inCh.indexOf(s) + 1, n: inCh.length, m: minsLeft(i) })}</p>` : '';
  const note = notice ? `<p class="notice" role="status">${notice}</p>` : '';
  notice = '';
  if (s.id !== 'start') A.lastScreen = s.id;
  document.body.classList.remove('has-tabs');
  document.body.classList.toggle('in-q', inQ);
  document.body.classList.toggle('story', s.id === 'kompas' && !needResults());
  if (storyCleanup) { storyCleanup(); storyCleanup = null; }
  $app.innerHTML = inQ ? `<div class="qshell">${railHtml(s)}<div class="qmain ${dir}">${crumb}${prog}${note}${body}${nav}</div></div>` : `<div class="${dir}">${note}${body}</div>`;
  updateSaveState();
  const pi = $app.querySelector('.prog i[data-to]');
  if (pi) requestAnimationFrame(() => requestAnimationFrame(() => { pi.style.width = pi.dataset.to + '%'; }));
  if (tapSel) { $app.querySelector(tapSel)?.classList.add('pop'); tapSel = null; }
  if (focusSel) { $app.querySelector(focusSel)?.focus({ preventScroll: true }); focusSel = null; }
  if (changed) { const b = document.querySelector('.brand'); if (b) { b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); } }
  applySkin();
  if (s.id === 'kompas' && !needResults()) { applyTheme(); applySkin(); storyCleanup = storyInit($app, storyCtx); }
  if (s.id === 'wyniki' && pendingOpen) {
    const el = $app.querySelector(`[data-card="${pendingOpen}"]`); pendingOpen = null;
    if (el) { if (el.tagName === 'DETAILS') el.open = true; setTimeout(() => el.scrollIntoView({ block: 'start' }), 30); }
  }
  if (s.id === 'wyniki' && drawOnce && $app.querySelector('.pathmap svg.draw')) {
    drawOnce = false;
    setTimeout(() => $app.querySelector('.pathmap svg.draw')?.classList.remove('draw'), 3400);
  }
  $app.dataset.screen = s.id;
  if (changed) mapSel = null;
  if (changed) { window.scrollTo(0, 0); $app.focus({ preventScroll: true }); }
  else if (keep && document.getElementById(keep)) { const el = document.getElementById(keep); el.focus(); if (el.setSelectionRange && el.value) el.setSelectionRange(el.value.length, el.value.length); }
}

// Small "?" explanations for terms he may not know; plain details/summary, so it works with a keyboard too.
const GLOSS = {
  rozszerzenie: 'app.gloss.extended',
  deklaracja: 'app.gloss.declaration',
  licencjat: 'app.gloss.bachelor',
  inzynier: 'app.gloss.engineer',
  jednolite: 'app.gloss.long_master',
  policealna: 'app.gloss.post_secondary',
  most: 'app.gloss.bridge',
  szybki: 'app.gloss.quick',
  niespodzianka: 'app.gloss.surprise'
};
// A button plus a hidden span (both phrasing content), so it can sit inside a heading or a sentence.
const term = (key, label) => `<span class="term"><button class="termq" data-term aria-expanded="false" aria-label="${t('app.term.what', { label: esc(label || key) })}">?</button><span class="termtxt" hidden>${esc(t(GLOSS[key]))}</span></span>`;
const levelTerm = lvl => /policealna/.test(lvl) ? term('policealna', t('app.term.post_secondary')) : /licencjat|I stopnia/.test(lvl) ? term('licencjat', t('app.term.bachelor')) : /inżynier/.test(lvl) ? term('inzynier', t('app.term.engineer')) : /jednolite/.test(lvl) ? term('jednolite', t('app.term.long_master')) : '';

const chip = (attrs, label, on) => `<button class="chip" ${attrs} aria-pressed="${on ? 'true' : 'false'}">${label}</button>`;

function vStart() {
  const started = hasAnswers();
  const resume = screens.some(x => x.id === A.lastScreen) ? A.lastScreen : 'pewnosc';
  const cur = screens.find(x => x.id === resume);
  const mins = id => Math.round(screens.filter(x => x.ch === id).reduce((t, x) => t + META[x.id][1], 0));
  const done = id => started && screens.filter(x => x.ch === id).every(stepDone);
  const steps = CHAPTERS.map((c, k) => `<li class="${done(c.id) ? 'done' : ''}"><span class="rno">${done(c.id) ? TICK : k + 1}</span><div><b>${t(c.name)}</b><span>${t(c.sub)}</span></div><span class="cmin">${t('app.start.chapter_min', { n: mins(c.id) })}</span></li>`).join('')
    + `<li class="res"><span class="rno">${icon('compass', 'ico sm')}</span><div><b>${t('app.chapter.results')}</b><span>${t('app.start.results_sub')}</span></div></li>`;
  const where = cur?.ch && cur.ch !== 'wyniki' ? `${t(CHAPTERS.find(c => c.id === cur.ch).name)} · ${t(META[cur.id][0])}` : t('app.start.where_results');
  return `
    <div class="hero">${ILLUS.start}<div>
    <span class="kicker2">${t('app.start.kicker')}</span>
    <h1>${t('app.start.title')}</h1>
    <p class="lead">${t('app.start.lead')}</p>
    <ol class="chsteps">${steps}</ol>
    ${started ? `<p class="resume-l">${t('app.start.resume', { where: esc(where) })}</p>` : ''}
    <div class="startrow"><div><label class="field" for="name">${t('app.start.name_label')}</label>
      <input id="name" type="text" data-field="name" value="${esc(A.name)}" autocomplete="off"></div>
      <button class="btn big" data-go="${started ? resume : 'pewnosc'}">${started ? t('app.start.resume_btn') : t('app.start.begin')}</button></div>
    ${started && !needResults() && resume !== 'kompas' ? '<div class="actions"><button class="btn ghost" data-go="kompas">' + t('app.start.my_results') + '</button></div>' : ''}
    <p class="muted small">${t('app.start.note')}</p>
    <div class="savehelp">${ICON.save}<div><p>${t('app.start.save_help')}</p>
      <label class="btn ghost filebtn small-btn">${t('app.file.load_md')}<input type="file" accept=".md,text/markdown,text/plain" data-load></label></div></div>
    <div class="skinpick" role="group" aria-label="${t('app.start.skin_label')}">
      <span class="small muted">${t('app.start.skin_prefix')}</span>
      <button class="chip" data-skinpick="" aria-pressed="${!skin}">${t('skin.calm')}</button>
      <button class="chip" data-skinpick="neon" aria-pressed="${skin === 'neon'}">${t('skin.neon')}</button>
      <button class="chip" data-skinpick="pop" aria-pressed="${skin === 'pop'}">${t('skin.pop')}</button>
    </div></div></div>
    ${TEST ? `<details class="card noprint"><summary>Tryb testowy</summary>
      <p class="small muted">Wczytaj gotowe odpowiedzi, żeby obejrzeć wyniki bez wypełniania.</p>
      <div class="actions">${data.personas.map(p => `<button class="btn ghost" data-persona="${p.id}">${esc(p.label)}</button>`).join('')}</div>
    </details>` : ''}`;
}

function vCertainty() {
  const dir = A.certainty === 'pewny' ? `
    <p>${t('app.certainty.direction_q')}</p>
    <div class="chips">${data.opportunities.map(c => chip(`data-set="direction" data-val="${c.id}"`, esc(c.name), A.direction === c.id)).join('')}</div>` : '';
  return `${ILLUS.pewnosc}<h1>${t('app.certainty.title')}</h1>
    <div class="chips stack">${data.questions.certainty.map(c => chip(`data-set="certainty" data-val="${c.id}"`, c.label, A.certainty === c.id)).join('')}</div>${dir}`;
}

function vMatura() {
  return `${ILLUS.matura}<h1>${t('app.matura.title')}</h1>
    <p class="explain">${t('app.matura.explain')}</p>
    <div class="chips">${data.questions.subjects.map(s => chip(`data-toggle="rozszerzenia" data-val="${s}"`, s, A.rozszerzenia.includes(s))).join('')}</div>
    <p class="small muted">${t('app.matura.deadline', { term: term('deklaracja', t('app.term.declaration')), date: data.config.declarationDeadline })}</p>`;
}

const SPORTS = ['siłownia', 'bieganie', 'piłka', 'pływanie', 'wspinaczka', 'rower', 'sztuki walki', 'taniec', 'inne', 'nie trenuję'];
// The Polish texts above and the levels / places below are saved in the file, so they stay as identifiers; these maps give the displayed text.
const SPORT_KEY = { 'siłownia': 'app.sport.gym', 'bieganie': 'app.sport.running', 'piłka': 'app.sport.ball', 'pływanie': 'app.sport.swimming', 'wspinaczka': 'app.sport.climbing',
  'rower': 'app.sport.bike', 'sztuki walki': 'app.sport.martial', 'taniec': 'app.sport.dance', 'inne': 'app.sport.other', 'nie trenuję': 'app.sport.none' };
const sportLabel = v => SPORT_KEY[v] ? t(SPORT_KEY[v]) : v;
const LEVEL_KEY = { 'brak': 'app.level.none', 'podstawy': 'app.level.basic', 'komunikatywny': 'app.level.conversational', 'bardzo dobry': 'app.level.very_good' };
const levelLabel = v => LEVEL_KEY[v] ? t(LEVEL_KEY[v]) : v;
const WHERE_KEY = { 'w szkole': 'app.where.school', 'w sporcie': 'app.where.sport', 'w domu i rodzinie': 'app.where.family', 'w językach': 'app.where.languages', 'w pomaganiu innym': 'app.where.helping',
  'w hobby': 'app.where.hobby', 'w domu': 'app.where.home', 'z przyjaciółmi': 'app.where.friends', 'w grach i internecie': 'app.where.games' };
const whereLabel = w => WHERE_KEY[w] ? t(WHERE_KEY[w]) : w;
// A.sport stays one text: chosen chips first, then his own words. Parts that are not chips go back into the text field.
function sportParts() {
  const parts = splitList(A.sport);
  return { on: parts.filter(x => SPORTS.includes(x)), rest: parts.filter(x => !SPORTS.includes(x)).join(', ') };
}
const setSport = (on, rest) => { A.sport = [...on, String(rest || '').trim()].filter(Boolean).join(', '); };
function tapSport(v) {
  const { on, rest } = sportParts();
  let next = on.includes(v) ? on.filter(x => x !== v) : v === 'nie trenuję' ? [v] : [...on.filter(x => x !== 'nie trenuję'), v];
  next = SPORTS.filter(x => next.includes(x));
  setSport(next, rest); save(); render();
}
function vLanguages() {
  const rows = data.questions.languages.map((l, i) => { const lv = A.jezyki[l.id] || 'brak';
    return `<fieldset class="card langcard" style="border:1px solid var(--line)"><legend class="sr">${l.name}</legend>
      <h3>${i + 1}. ${l.name[0].toUpperCase() + l.name.slice(1)}</h3><p class="small muted">${t('app.languages.level', { lv: levelLabel(lv) })}</p>
      <div class="chips" role="radiogroup" aria-label="${t('app.languages.level_aria', { name: l.name })}">${data.questions.languageLevels.map(v => chip(`data-lang="${l.id}" data-val="${v}"`, levelLabel(v), lv === v)).join('')}</div></fieldset>`; }).join('');
  return `${ILLUS.jezyki}<h1>${t('app.languages.title')}</h1>
    <p>${t('app.languages.intro')}</p>${rows}
    <p class="field" id="sportq">${t('app.languages.sport_q')}</p>
    <div class="chips" role="group" aria-labelledby="sportq">${SPORTS.map(v => chip(`data-sport="${v}"`, sportLabel(v), sportParts().on.includes(v))).join('')}</div>
    <label class="small muted" for="sport">${t('app.languages.sport_when')}</label>
    <input id="sport" type="text" data-sportx value="${esc(sportParts().rest)}" placeholder="${t('app.languages.sport_ph')}">
    <p class="small muted">${t('app.languages.sport_note')}</p>`;
}

function vSort() {
  const acts = data.questions.activities, n = acts.length, pos = Math.min(A.sortPos, n);
  const dots = `<div class="dots" aria-hidden="true">${acts.map((_, i) => `<i class="${i < pos ? 'done' : ''}"></i>`).join('')}</div>`;
  if (pos >= n) {
    const liked = acts.filter(a => A.sort[a.id] === 1).map(a => `<li>${esc(a.text)}</li>`).join('');
    return `<h1>${t('app.sort.title')}</h1><div class="card"><p>${t('app.sort.you_like')}</p><ul>${liked || '<li class="muted">' + t('app.sort.none') + '</li>'}</ul>
      <button class="btn ghost" data-sortreset>${t('app.nav.again')}</button></div>${dots}`;
  }
  const a = acts[pos];
  return `${A.sortPos === 0 ? ILLUS.zajecia : ''}<h1>${t('app.sort.title')}</h1><p class="muted">${t('app.sort.intro')}</p>
    <div class="card sort"><p class="sortcount">${t('app.nav.n_of_m', { n: pos + 1, m: n })}</p>${actPicto(a)}<div class="q">${esc(a.text)}</div>
      <div class="row">
        <button class="btn ghost" data-sortans="-1">${t('app.sort.dislike')}</button>
        <button class="btn" data-sortans="1">${t('app.sort.like')}</button>
      </div>
      <button class="chip" data-sortans="0" style="margin-top:12px">${t('app.sort.skip')}</button>
      ${pos > 0 ? '<button class="chip" data-sortback style="margin-top:12px">' + t('app.nav.undo') + '</button>' : ''}
      <p class="keys" aria-hidden="true">${t('app.sort.keys')}</p>
    </div>${dots}`;
}

function vSituations() {
  const qs = data.questions.situations, n = qs.length, pos = Math.min(A.sitPos, n);
  const dots = `<div class="dots" aria-hidden="true">${qs.map((_, i) => `<i class="${i < pos ? 'done' : ''}"></i>`).join('')}</div>`;
  if (pos >= n) {
    const picked = qs.map(q => { const a = q.answers.find(x => x.id === A.situations[q.id]); return a ? `<li>${esc(a.text)}</li>` : ''; }).join('');
    return `<h1>${t('app.situations.title')}</h1><div class="card"><p>${t('app.situations.picks')}</p><ul>${picked || '<li class="muted">' + t('app.situations.none') + '</li>'}</ul>
      <button class="btn ghost" data-sitreset>${t('app.nav.again')}</button></div>${dots}`;
  }
  const q = qs[pos];
  return `${A.sitPos === 0 ? ILLUS.sytuacje : ''}<h1>${t('app.situations.title')}</h1><p class="muted">${t('app.situations.intro')}</p>
    <div class="card"><p class="sortcount">${t('app.nav.n_of_m', { n: pos + 1, m: n })}</p>${sitPicto(q)}<p class="q-s">${esc(q.text)}</p>
      <div class="chips stack">${q.answers.map(a => chip(`data-sitans="${a.id}"`, esc(a.text), A.situations[q.id] === a.id)).join('')}</div>
      <div class="row-s"><button class="chip" data-sitans="">${t('app.situations.skip')}</button>${pos > 0 ? '<button class="chip" data-sitback>' + t('app.nav.undo') + '</button>' : ''}</div>
    </div>${dots}`;
}

function sortAnswer(v) {
  const a = data.questions.activities[A.sortPos];
  if (!a) return;
  A.sort[a.id] = v; A.sortPos++; render();
}
// Swipe on the sort card: right = lubię, left = nie lubię.
let swipe = null;
document.addEventListener('pointerdown', e => { const c = e.target.closest('.card.sort'); if (c && !e.target.closest('button')) swipe = { x: e.clientX, c }; });
document.addEventListener('pointermove', e => { if (swipe) { const dx = e.clientX - swipe.x; swipe.c.style.transform = `translateX(${dx}px) rotate(${dx / 40}deg)`; swipe.c.dataset.lean = dx > 30 ? 'r' : dx < -30 ? 'l' : ''; } });
document.addEventListener('pointerup', e => { if (!swipe) return; const dx = e.clientX - swipe.x, c = swipe.c; swipe = null; c.style.transform = '';
  if (Math.abs(dx) > 70) sortAnswer(dx > 0 ? 1 : -1); else c.dataset.lean = ''; });
document.addEventListener('pointercancel', () => { if (swipe) { swipe.c.style.transform = ''; swipe = null; } });

function vStyle() {
  return `${ILLUS.styl}<h1>${t('app.style.title')}</h1><p class="muted">${t('app.style.intro')}</p>
    ${data.dimensions.workStyle.map(w => `<div class="slider"><div class="ends"><span>${w.left}</span><span>${w.right}</span></div>
      <input type="range" min="-3" max="3" step="1" id="sl-${w.id}" data-slider="${w.id}" value="${A.sliders[w.id] ?? 0}" aria-label="${t('app.style.either', { a: w.left, b: w.right })}"></div>`).join('')}`;
}

function vValues() {
  return `${ILLUS.wartosci}<h1>${t('app.values.title')}</h1><p>${t('app.values.intro', { n: A.values.length })}</p>
    <div class="chips">${data.dimensions.values.map(v => { const i = A.values.indexOf(v.id);
      return chip(`data-value="${v.id}"`, `${i >= 0 ? `<span class="n">${i + 1}.</span> ` : ''}${v.name}`, i >= 0); }).join('')}</div>`;
}

function vStrengths() {
  const picked = A.strengths.map(s => s.id);
  // Answered strengths shrink to one line ("Języki · w szkole [zmień]"); the "gdzie to widać?" block shows only for the rest.
  // A strength typed into right now stays open until the next re-render, so typing is never cut off.
  const list = A.strengths.map(s => { const st = data.strengths.find(x => x.id === s.id);
    const own = !!s.proof.trim() && !isWhere(s.proof);
    const name = esc(st.name.charAt(0).toUpperCase() + st.name.slice(1));
    if (s.proof.trim()) { const p = s.proof.trim(), short = p.length > 40 ? p.slice(0, 39).trimEnd() + '…' : p;
      return `<div class="strength done"><p class="sline"><b>${name}</b> · <span>${esc(short)}</span></p>
        <button class="btn ghost small-btn" data-reproof="${s.id}" aria-label="${t('app.strengths.reproof_aria', { name: esc(st.name) })}">${t('app.strengths.change')}</button></div>`; }
    return `<div class="strength"><p class="field" id="pl-${s.id}">${t('app.strengths.where_q', { name: esc(st.name.charAt(0).toUpperCase() + st.name.slice(1)) })}</p>
      <div class="chips" role="group" aria-labelledby="pl-${s.id}">${WHERE.map(w => chip(`data-where="${s.id}|${w}"`, whereLabel(w), s.proof === w)).join('')}</div>
      <details class="ownproof"${own ? ' open' : ''}><summary>${t('app.strengths.own')}</summary>
        <input id="pr-${s.id}" type="text" data-proof="${s.id}" value="${own ? esc(s.proof) : ''}" placeholder="${esc(st.example)}" aria-label="${t('app.strengths.own_aria', { name: esc(st.name) })}"></details></div>`; }).join('');
  return `<h1>${t('app.strengths.title')}</h1>
    <p>${t('app.strengths.intro', { n: A.strengths.length })}</p>
    <div class="chips">${data.strengths.map(s => chip(`data-strength="${s.id}"`, s.name, picked.includes(s.id))).join('')}</div>
    ${list ? `<div class="card slist">${list}</div>` : ''}
    <p class="small muted">${t('app.strengths.note')}</p>`;
}

function possibleStrengths(r) {
  const picked = new Set(A.strengths.map(s => s.id));
  const top = r.profile.top.slice(0, 2);
  return data.strengths.filter(s => !picked.has(s.id) && s.dims.some(d => top.includes(d))).slice(0, 2);
}

// "Kompas rośnie": a small compass on the last screen of each chapter, one more arc lit per chapter.
function growCompass(stage) {
  const names = CHAPTERS.map(c => t(c.name));
  const arc = (k, on) => { const a0 = (-90 + k * 120 + 6) * Math.PI / 180, a1 = (-90 + (k + 1) * 120 - 6) * Math.PI / 180, r = 34;
    return `<path d="M${(40 + r * Math.cos(a0)).toFixed(1)},${(40 + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 0 1 ${(40 + r * Math.cos(a1)).toFixed(1)},${(40 + r * Math.sin(a1)).toFixed(1)}" class="garc${on ? ' on' : ''}${k === stage - 1 ? ' now' : ''}" pathLength="1"/>`; };
  return `<div class="grow"><svg viewBox="0 0 80 80" aria-hidden="true">${[0, 1, 2].map(k => arc(k, k < stage)).join('')}<polygon points="40,14 45,40 40,44 35,40" class="gneedle"/><circle cx="40" cy="40" r="3"/></svg>
    <p>${stage < 3 ? t('app.grow.mid', { prev: names[stage - 1], next: names[stage] }) : t('app.grow.last')}</p>
    <button class="btn ghost savebtn small-btn" data-export="download">${ICON.save} ${t('app.grow.save')}</button></div>`;
}

function vReveal() {
  const r = scoreAll(A, data);
  const proven = provenStrengths(A).map(s => { const st = data.strengths.find(x => x.id === s.id);
    return `<li><b>${esc(st.name)}</b><span class="proof">${isWhere(s.proof) ? t('app.reveal.seen_where', { where: esc(whereLabel(s.proof.trim())) }) : t('app.reveal.seen_because', { proof: esc(s.proof) })}</span></li>`; }).join('');
  const maybe = possibleStrengths(r).map(s => `<li>${esc(s.name)} <span class="badge">${t('app.reveal.maybe_badge')}</span></li>`).join('');
  return `<span class="kicker2">${t('app.reveal.kicker')}</span><h1>${t('app.reveal.title')}</h1><p class="lead">${t('app.reveal.lead')}</p>
    <div class="card reveal"><ul>${proven}</ul></div>
    ${maybe ? `<p>${t('app.reveal.maybe_intro')}</p><div class="card"><ul>${maybe}</ul><p class="small muted">${t('app.reveal.maybe_note')}</p></div>` : ''}
    <p>${t('app.reveal.next')}</p>${growCompass(1)}`;
}

function vScenarios() {
  const sc = data.scenarios.scenarios;
  return `<h1>${t('app.scenarios.title')}</h1>
    <p>${t('app.scenarios.intro')}</p>
    <div class="scen">${sc.map((x, i) => `<button class="scencard rise" style="--i:${i}" data-set="scenario" data-val="${x.id}" aria-pressed="${A.scenario === x.id}">
      ${scenArt(x.id)}<b>${esc(x.name)}</b><span class="small">${esc(x.text)}</span>${A.scenario === x.id ? '<span class="badge">' + t('app.scenarios.main_badge') + '</span>' : ''}</button>`).join('')}</div>
    <div class="chips">${chip('data-set="scenario" data-val="?"', t('app.scenarios.unknown'), A.scenario === '?')}</div>
    <p class="small muted">${t('app.scenarios.note')}</p>`;
}

let sectorSel = null; // sector highlighted on the Świat screen
const sec = id => data.scenarios.sectors.find(x => x.id === id);
function vForces() {
  const src = id => data.sources.find(s => s.id === id);
  const mine = null; // the main scenario is picked at the end, in "Przyszłość"
  return `<span class="kicker2">${t('app.forces.kicker')}</span><h1>${t('app.forces.title')}</h1>
    <p class="lead">${t('app.forces.lead')}</p>
    <div class="forces">${data.scenarios.forces.map((f, i) => { const s = src(f.sourceId), hot = sectorSel && f.sectors.includes(sectorSel);
      return `<div class="force rise${hot ? ' hot' : ''}${sectorSel && !hot ? ' dim' : ''}" style="--i:${i}">${icon(FORCE_ICON[f.id], 'ico big')}<div><h3>${esc(f.name)}</h3><p class="small">${esc(f.text)}</p>
        ${f.line && f.line !== f.text ? `<p class="small fline">${esc(f.line)}</p>` : ''}
        <p class="tags-l">${icon('route', 'ico sm')} ${t('app.forces.tap_hint')}</p>
        <div class="tags" aria-label="${t('app.forces.where_grows')}">${f.sectors.map(id => { const x = sec(id); return `<button class="tag-s sbtn-s${sectorSel === id ? ' on' : ''}" data-sector="${id}" data-from="force" aria-pressed="${sectorSel === id}" aria-controls="sec-${id}">${esc(x.name)} <span class="chev" aria-hidden="true">›</span></button>`; }).join('')}</div>
        <p class="small muted">${s ? `<a href="${s.url}" target="_blank" rel="noopener">${t('app.common.source')}</a>, ` : ''}${t('app.forces.as_of', { date: esc(f.asOf) })}</p></div></div>`; }).join('')}</div>
    <h2>${t('app.forces.where_grows')}</h2>
    <p class="small">${icon('route', 'ico sm')} ${t('app.forces.tap_sector')}</p>
    <div class="sectors">${data.scenarios.sectors.map((x, i) => { const why = data.scenarios.forces.filter(f => f.sectors.includes(x.id));
      const cards = x.cards.map(id => data.opportunities.find(c => c.id === id)).filter(Boolean), on = sectorSel === x.id;
      return `<div class="sectorw${on ? ' on' : ''}" id="sec-${x.id}"><button class="sector rise${on ? ' on' : ''}${sectorSel && !on ? ' dim' : ''}" style="--i:${i}" data-sector="${x.id}" aria-expanded="${on}">
        <span class="sec-h"><b>${esc(x.name)}</b><span class="sec-go">${on ? t('app.forces.collapse') : t('app.forces.see')} <span class="chev" aria-hidden="true">${on ? '⌃' : '›'}</span></span></span>
        <span class="small">${t('app.forces.why', { list: why.map(f => esc(f.name.toLowerCase())).join(', ') })}</span>
        ${on ? '' : `<span class="small muted">${plural(cards.length, 'app.forces.areas')}: ${cards.slice(0, 3).map(c => esc(c.name)).join(', ')}${cards.length > 3 ? '…' : ''}</span>`}</button>
        ${on ? `<div class="sec-more rise">${cards.map((c, k) => `<div class="area" style="--i:${k}"><span class="area-ico">${icon(c.cluster)}</span><div><h3>${esc(c.name)}</h3><p class="small">${esc(c.whoYouHelp)}</p>
          <p class="small muted">${esc(c.whyNeeded)}</p></div></div>`).join('')}
          <p class="small muted">${t('app.forces.match')}</p></div>` : ''}</div>`; }).join('')}</div>
    ${(() => { const inSector = new Set(data.scenarios.sectors.flatMap(x => x.cards)), rest = data.opportunities.filter(c => !inSector.has(c.id));
      return rest.length ? `<p class="small">${t('app.forces.rest', { list: rest.map(c => `<b>${esc(c.name)}</b>`).join(' · ') })}</p>` : ''; })()}
    <p class="small muted">${esc(data.scenarios.shrinking)}</p>
    <p class="lead">${t('app.forces.closing')}</p>`;
}

// "Gdzie można się przydać": the 6 areas that fit his Ja answers so far, filterable by his orientations and strengths.
let areaFilter = null;
function vCardsPreview() {
  const r = scoreAll(A, data), proven = provenStrengths(A);
  const dims = r.profile.top.slice(0, 2).map(d => data.dimensions.interests.find(x => x.id === d));
  const topOf = c => Object.keys(c.card.interests).sort((a, b) => c.card.interests[b] - c.card.interests[a]).slice(0, 2);
  let list = r.cards, label = t('app.cards.label_default');
  if (areaFilter?.startsWith('d:')) { const d = areaFilter.slice(2); list = r.cards.filter(c => topOf(c).includes(d)); label = t('app.cards.label_orientation', { name: dims.find(x => x.id === d)?.name.toLowerCase() }); }
  if (areaFilter?.startsWith('s:')) { const sid = areaFilter.slice(2); list = r.cards.filter(c => c.card.strengths.includes(sid)); label = t('app.cards.label_strength', { name: data.strengths.find(x => x.id === sid)?.name }); }
  const shown = list.slice(0, 6);
  const fchip = (key, text) => chip(`data-area="${key}"`, text, areaFilter === key);
  const answered = proven.length || Object.keys(A.sort).length;
  return `<h1>${t('app.cards.title')}</h1>
    <p>${answered ? t('app.cards.intro', { n: data.opportunities.length }) : t('app.cards.intro_empty')}</p>
    <div class="chips filt" role="group" aria-label="${t('app.cards.filter')}">${fchip('', t('app.cards.best'))}${dims.map(d => fchip('d:' + d.id, d.name.toLowerCase())).join('')}${proven.map(p => fchip('s:' + p.id, data.strengths.find(x => x.id === p.id).name)).join('')}</div>
    <p class="small muted" aria-live="polite">${esc(label)}</p>
    <div class="areas">${shown.map((c, i) => { const used = proven.filter(p => c.card.strengths.includes(p.id)).map(p => data.strengths.find(x => x.id === p.id).name);
      return `<div class="area rise" style="--i:${i}"><span class="area-ico">${icon(c.card.cluster)}</span><div><h3>${esc(c.card.name)}</h3><p class="small">${esc(c.card.whoYouHelp)}</p>
        ${used.length ? `<div class="tags">${used.map(u => `<span class="tag-s on">${esc(u)}</span>`).join('')}</div>` : ''}</div></div>`; }).join('')}</div>
    <details class="card"><summary>${t('app.cards.show_all', { n: data.opportunities.length })}</summary><ul class="cardlist">${data.opportunities.map(c => `<li><b>${esc(c.name)}</b><span class="small muted">${esc(c.whoYouHelp)}</span></li>`).join('')}</ul></details>${growCompass(2)}`;
}

const shortInst = n => n.replace(/^Uniwersytet Gdański.*$/, 'UG, Gdańsk').replace(/^Politechnika Rzeszowska$/, 'Politechnika Rzeszowska, Rzeszów').replace(/^Uniwersytet Jagielloński.*$/, 'UJ').replace(/^UJ Collegium Medicum$/, 'UJ CM').replace(/^Krakowska Medyczna Szkoła Policealna nr 1$/, 'Medyczna Szkoła Policealna nr 1')
  .replace(/^Uniwersytet Andrzeja Frycza Modrzewskiego$/, 'UAFM').replace(/^Politechnika Krakowska$/, 'PK').replace(/^Uniwersytet Rolniczy$/, 'UR').replace(/^Szkoła Aspirantów Państwowej Straży Pożarnej$/, 'SA PSP');

// Full-screen compass: north = best option, NNE and NNW = the next two; the needle swings between the three
// and settles on north. Most (east), Niespodzianka (west) and Szybki start (south) sit in lighter type.
function vCompass() {
  if (provenStrengths(A).length < 1 || !A.values.length) return vResults();
  const r = scoreAll(A, data), s = r.slots;
  const firstStudy = c => c && (c.offers.find(o => o.check.reachable) || c.offers[0])?.offer;
  const item = (c, tag, dir, extra) => {
    if (!c) return `<div class="cdir ${dir} empty"></div>`;
    const o = extra ? s.quick.o.offer : firstStudy(c);
    const id = extra ? 'quick' : c.card.id;
    return `<button class="cdir ${dir}" data-pick="${id}" data-ang="${ANG[dir]}" aria-pressed="${compassSel === id}"><span class="ctag">${tag}</span><b>${esc(extra ? o.name : c.card.name)}</b>${o ? `<span class="small muted">${esc(extra ? shortInst(o.institution) : o.name + ', ' + shortInst(o.institution))}</span>` : ''}</button>`;
  };
  const [b1, b2, b3] = s.best;
  const ANG = { n: 0, nne: 22.5, nnw: -22.5, e: 90, w: -90, s: 180 };
  const C = 180, R = 118;
  const pt = (deg, r = R) => { const a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  const mark = (deg, cls, to) => { const [x, y] = pt(deg); return `<path class="lead ${cls}" d="M${x.toFixed(1)},${y.toFixed(1)} L${to[0]},${to[1]}"/><circle class="dot ${cls}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${cls === 'main' ? 6 : 4.5}"/>`; };
  let rose = '';
  for (let t = 0; t < 32; t++) { const deg = t * 11.25, long = t % 8 === 0, mid = t % 4 === 0, [x1, y1] = pt(deg, R - (long ? 16 : mid ? 11 : 6)), [x2, y2] = pt(deg, R - 1);
    rose += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="tick${long ? ' long' : ''}"/>`; }
  const L = (deg, t) => { const [x, y] = pt(deg, R - 32); return `<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle" class="cardinal">${t}</text>`; };
  const svg = `<svg class="bigcompass" viewBox="0 0 360 360" role="img" aria-label="${t('app.compass.aria', { a: esc(b1.card.name), b: esc(b2?.card.name || ''), c: esc(b3?.card.name || '') })}">
    ${mark(0, 'main', [180, 0])}${b2 ? mark(22.5, 'main', [300, 0]) : ''}${b3 ? mark(-22.5, 'main', [60, 0]) : ''}
    ${s.surprise ? mark(-90, 'side', [60, 360]) : ''}${s.quick ? mark(180, 'side', [180, 360]) : ''}${s.most ? mark(90, 'side', [300, 360]) : ''}
    <circle cx="${C}" cy="${C}" r="${R}" class="ring"/><circle cx="${C}" cy="${C}" r="${R - 24}" class="ring2"/>${rose}
    ${L(0, 'N')}${L(90, 'E')}${L(180, 'S')}${L(270, 'W')}
    <g class="needle-big${compassSel ? ' fixed' : ''}" ${compassSel ? `style="transform:rotate(${selAngle(s)}deg)"` : ''}><polygon points="${C},${C - R + 30} ${C + 11},${C} ${C},${C + 8} ${C - 11},${C}" class="n-head"/><polygon points="${C},${C + R - 38} ${C + 9},${C} ${C},${C - 6} ${C - 9},${C}" class="n-tail"/></g>
    <circle cx="${C}" cy="${C}" r="6" class="hub"/></svg>`;
  return `<section class="compass-screen">
    <p class="ctitle">${t('app.compass.title')}</p>
    <div class="cgrid ctop">${item(b3, '3 · NNW', 'nnw')}${item(b1, '1 · N', 'n')}${item(b2, '2 · NNE', 'nne')}</div>
    ${svg}
    <div class="cgrid cbot">${item(s.surprise, t('app.compass.tag_surprise'), 'w')}${s.quick ? item(s.quick.c, t('app.compass.tag_quick'), 's', true) : '<div class="cdir s empty"></div>'}${item(s.most, t('app.compass.tag_bridge'), 'e')}</div>
    <div id="cprev" class="cprev" aria-live="polite">${compassSel ? previewHtml(r, compassSel) : '<p class="clead">' + t('app.compass.lead') + '</p>'}</div>
    ${prevFile?.snapshot ? `<div class="cprev">${changesSince(r)}</div>` : ''}
    ${tilesHtml()}
  </section>`;
}

function vReach() {
  return `<h1>${t('app.reach.title')}</h1>
    <p>${t('app.reach.q1')}</p>
    <div class="chips">${data.questions.neededWhere.map(v => chip(`data-set="neededWhere" data-val="${v}"`, v, A.neededWhere === v)).join('')}</div>
    <p>${t('app.reach.home')}</p>
    <div class="chips">${data.questions.homePlaces.map(v => chip(`data-toggle="homePlaces" data-val="${v}"`, v, A.homePlaces.includes(v))).join('')}</div>
    <p class="small muted">${t('app.reach.note')}</p>`;
}

const START_MIN = [10, 20, 30, 45, 60, 90];
function vLength() {
  return `${ILLUS.dlugosc}<h1>${t('app.length.title')}</h1>
    <div class="chips stack">${data.questions.studyLength.map(o => chip(`data-set="studyLength" data-val="${o.id}"`, o.label, A.studyLength === o.id)).join('')}</div>
    <p class="explain">${t('app.length.explain')}</p>
    <p>${t('app.length.private_q')}</p>
    <div class="chips">${data.questions.privateOk.map(o => chip(`data-set="privateOk" data-val="${o.id}"`, o.label, A.privateOk === o.id)).join('')}</div>
    <p class="field" id="startq">${t('app.length.start_q')}</p>
    <div class="chips" role="radiogroup" aria-labelledby="startq">${START_MIN.map(m => chip(`data-set="startMin" data-val="${m}"`, t('app.length.min', { n: m }), Number(A.startMin) === m)).join('')}</div>
    ${START_MIN.includes(Number(A.startMin)) ? '' : `<p class="small muted">${t('app.length.from_file', { n: esc(A.startMin) })}</p>`}
    <p class="small muted">${t('app.length.note')}</p>`;
}

function vDoubt() {
  const d = data.questions.doubts.find(x => x.id === A.doubt);
  return `${ILLUS.niepokoj}<h1>${t('app.doubt.title')}</h1><p class="muted">${t('app.doubt.optional')}</p>
    <div class="chips stack">${data.questions.doubts.map(x => chip(`data-set="doubt" data-val="${x.id}"`, x.label, A.doubt === x.id)).join('')}</div>
    ${d ? `<div class="card fade"><p>${d.card}</p></div>
      <p>${t('app.doubt.how_much')}</p><div class="chips">${chip('data-strong="0"', t('app.doubt.little'), !A.doubtStrong)}${chip('data-strong="1"', t('app.doubt.very'), A.doubtStrong)}</div>` : ''}`;
}

// Lists kept as one text joined with ", " (reflection ideas, sport), so old files and the export stay the same.
const splitList = v => String(v || '').split(',').map(x => x.trim()).filter(Boolean);
// A tap on an idea: on → take it out; off → replace an empty field or one that holds only ideas, else add after ", ".
// "Mogę to zrobić, bo…" (v2.4, U3): up to 3 tap ideas built from his own answers. Same rule as the reflection ideas:
// a tap fills an empty field or one holding only ideas, otherwise it is added after ", "; his own words are never deleted.
const low1 = t => String(t || '').charAt(0).toLowerCase() + String(t || '').slice(1);
function candoTexts() {
  const s0 = provenStrengths(A)[0], v0 = (A.values || [])[0];
  const v = v0 && data.dimensions.values.find(x => x.id === v0);
  return [s0 && t('app.cando.can', { skill: low1(nameOf(s0.id)) }), v && t('app.cando.important', { value: low1(v.name) }),
    s0 && isWhere(s0.proof) && t('app.cando.already', { where: whereLabel(String(s0.proof).trim()) })].filter(Boolean);
}
function candoChips() {
  const ideas = candoTexts(), parts = splitList(A.canDo);
  return ideas.length ? `<div class="chips ideas" role="group" aria-label="${t('app.cando.chips_aria')}">${ideas.map((t, i) => chip(`data-cando="${i}"`, esc(t), parts.includes(t))).join('')}</div>` : '';
}
function tapCando(i) {
  const ideas = candoTexts(), idea = ideas[Number(i)]; if (!idea) return;
  const cur = String(A.canDo || ''), parts = splitList(cur);
  if (parts.includes(idea)) A.canDo = parts.filter(x => x !== idea).join(', ');
  else if (!cur.trim() || parts.every(x => ideas.includes(x))) A.canDo = idea;
  else A.canDo = cur.replace(/[\s,.;]+$/, '') + ', ' + idea;
  const now = splitList(A.canDo);
  document.querySelectorAll('#cando').forEach(el => { el.value = A.canDo; });
  document.querySelectorAll('[data-cando]').forEach(b => { const on = now.includes(ideas[Number(b.dataset.cando)]); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
  save();
}
function tapIdea(qid, idea) {
  const q = data.questions.reflection.find(x => x.id === qid); if (!q) return;
  const cur = String(A.reflection[qid] || ''), parts = splitList(cur);
  if (parts.includes(idea)) A.reflection[qid] = parts.filter(x => x !== idea).join(', ');
  else if (!cur.trim() || parts.every(x => (q.ideas || []).includes(x))) A.reflection[qid] = idea;
  else A.reflection[qid] = cur.replace(/[\s,.;]+$/, '') + ', ' + idea; // a last dot or comma gives way to the list separator
  save(); render();
}
function vReflection() {
  return `${ILLUS.refleksja}<h1>${t('app.reflection.title')}</h1><p class="muted">${t('app.reflection.intro')}</p>
    ${data.questions.reflection.map(q => { const parts = splitList(A.reflection[q.id]);
      return `<label class="field" for="rf-${q.id}">${q.text}</label>
      ${q.ideas?.length ? `<div class="chips ideas" role="group" aria-label="${t('app.reflection.ideas_aria')}">${q.ideas.map(v => chip(`data-idea="${q.id}" data-val="${esc(v)}"`, esc(v), parts.includes(v))).join('')}</div>` : ''}
      <textarea id="rf-${q.id}" data-refl="${q.id}" placeholder="${t('app.reflection.placeholder')}">${esc(A.reflection[q.id] || '')}</textarea>`; }).join('')}${growCompass(3)}`;
}

// ---- results ----------------------------------------------------------------
const campus = id => data.campuses.find(c => c.id === id);

function commute(c) {
  if (c.outside) return t('app.commute.outside', { city: c.city });
  const h = c.tr?.fromHub;
  if (!h) return t('app.commute.none');
  const base = Number(A.startMin) || 0;
  const lo = base + h.min, hi = base + Math.max(h.median, h.min + 5);
  return t('app.commute.range', { lo: lo, hi: hi });
}
const lineText = st => [st.tram.length ? t('app.transit.tram', { list: st.tram.join(', ') }) : '', st.bus.length ? t('app.transit.bus', { list: st.bus.join(', ') }) : ''].filter(Boolean).join('; ');
function transit(c) {
  if (c.outside) return '';
  const sts = (c.tr?.stops || []).filter(st => st.tram.length || st.bus.length).slice(0, 2);
  return sts.length ? sts.map(st => t('app.transit.stop', { name: esc(st.name), m: st.m, lines: esc(lineText(st)) })).join('; ') : t('app.transit.none');
}
const routeUrl = c => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.outside ? c.name + ', ' + c.city : c.address + ', Kraków')}&travelmode=transit`;

// Last year's threshold: the points of the last person admitted. Information only, not a requirement; not used in scoring.
function thresholdHtml(o) {
  const th = o.threshold;
  if (!th) return '';
  const src = data.sources.find(x => x.id === th.sourceId);
  return `<div class="small muted">${t('app.threshold.text', { year: th.year, points: th.points, max: th.max, round: th.round ? ` (${esc(th.round)})` : '' })}${src ? ` <a href="${src.url}" target="_blank" rel="noopener">${t('app.common.source')}</a>` : ''}</div>`;
}
// Star an offer: kept in his file (A.stars) and listed in the export. Toggled in place, so open cards stay open.
const starred = id => (A.stars || []).includes(id);
const starBtn = o => `<button class="starbtn" data-star="${esc(o.id)}" aria-pressed="${starred(o.id)}" aria-label="${starred(o.id) ? t('app.star.remove', { item: `${esc(o.name)}, ${esc(shortInst(o.institution))}` }) : t('app.star.add', { item: `${esc(o.name)}, ${esc(shortInst(o.institution))}` })}" title="${t('app.star.title')}">${starred(o.id) ? '★' : '☆'}</button>`;
function toggleStar(id) {
  A.stars = A.stars || [];
  const i = A.stars.indexOf(id);
  i >= 0 ? A.stars.splice(i, 1) : A.stars.push(id);
  const on = i < 0, o = data.offers.find(x => x.id === id);
  document.querySelectorAll(`[data-star="${CSS.escape(id)}"]`).forEach(b => {
    b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '★' : '☆';
    b.setAttribute('aria-label', on ? t('app.star.remove', { item: o ? `${o.name}, ${shortInst(o.institution)}` : id }) : t('app.star.add', { item: o ? `${o.name}, ${shortInst(o.institution)}` : id }));
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  });
  document.querySelectorAll('.starcount').forEach(el => { el.textContent = String(A.stars.length); });
  save();
  const w = document.getElementById('declwrap');
  if (w) w.innerHTML = declarationHtml(scoreAll(A, data));
  refreshCompare();
}
function offerHtml(o, chk) {
  const c = campus(o.campus);
  const route = routeUrl(c);
  return `<div class="offer">
    ${starBtn(o)}<b>${esc(o.name)}</b>, ${esc(o.institution)}<br>
    <span class="muted">${esc(o.level)} ${levelTerm(o.level)} · ${plural(o.durationYears, 'app.years', { n: String(o.durationYears).replace('.', ',') })}</span><br>
    ${chk.ok.map(t => `<span class="badge">${esc(t)}</span>`).join('')}${chk.blocked.map(t => `<span class="badge warn">${esc(t)}</span>`).join('')}${chk.flags.map(t => `<span class="badge warn">${esc(t)}</span>`).join('')}
    <div class="small">${t('app.offer.requires', { note: esc(o.requires.note || '-') })}</div>
    ${thresholdHtml(o)}
    ${chk.fix ? `<div class="small fix">${t('app.offer.fix', { fix: esc(chk.fix) })}</div>` : ''}
    <div class="small">${[`${esc(c.name)}${c.outside ? '' : `, ${esc(c.address)}`}`, transit(c), commute(c), `<a href="${route}" target="_blank" rel="noopener">${c.outside ? t('app.common.route_map') : t('app.common.route_plan')}</a>`].filter(Boolean).join(' · ')}</div>
  </div>`;
}

// Pay band per card: $ / $$ / $$$ relative to other jobs, from a dated GUS ranking. For reflection only.
const PAY_TXT = { 1: 'app.pay.low', 2: 'app.pay.mid', 3: 'app.pay.high' };
function payHtml(k) {
  if (!k.pay) return '';
  const src = data.sources.find(x => x.id === k.pay.sourceId);
  const b = k.pay.band;
  return `<span class="pay" aria-label="${t('app.pay.level_aria', { b: b })}"><b>${'$'.repeat(b)}</b><i>${'$'.repeat(3 - b)}</i></span> ${t(PAY_TXT[b])}
    <span class="small muted">${t('app.pay.note', { group: esc(k.pay.group), src: src ? `<a href="${src.url}" target="_blank" rel="noopener">${payLabel(src)}</a>` : 'GUS' })}</span>`;
}
function cardHtml(slot, c, open, scenario) {
  const k = c.card;
  const force = data.scenarios.forces.find(f => f.id === k.force);
  const conv = c.paths.length >= 2 ? `<p class="converge">${t('app.card.converge', { n: c.paths.length, list: c.paths.map(p => esc(p.label)).join(', ') })}</p>` : '';
  const reach = c.offers.filter(o => o.check.reachable), blocked = c.offers.filter(o => !o.check.reachable && !o.check.hidden), hidden = c.offers.filter(o => o.check.hidden);
  const first = reach[0]?.offer;
  const my = data.scenarios.scenarios.find(x => x.id === A.scenario);
  const need = my ? t('app.card.need_mine', { name: esc(my.name), value: esc(k.robustness[my.id]), others: data.scenarios.scenarios.filter(x => x !== my).map(x => `${esc(x.name)}: ${esc(k.robustness[x.id])}`).join(' · ') })
    : data.scenarios.scenarios.map(x => `${esc(x.name)}: ${esc(k.robustness[x.id])}`).join(' · ');
  const demand = k.demand ? (() => { const src = data.sources.find(x => x.id === k.demand.sourceId);
    return `<p class="small muted">${t('app.card.demand', { text: esc(k.demand.text) })}${src ? ` <a href="${src.url}" target="_blank" rel="noopener">${t('app.common.source')}</a>` : ''}</p>`; })() : '';
  const body = `
    <p class="small muted">${c.reasons.map(esc).join(' · ')}</p>${conv}
    <section class="grp"><h4>${t('app.card.you_and_job')}</h4><dl>
      <dt>${t('app.card.who')}</dt><dd>${esc(k.whoYouHelp)}</dd>
      <dt>${t('app.card.gives')}</dt><dd>${esc(k.whatYouGet)}</dd>
      ${k.pay ? `<dt>${t('app.card.pay')}</dt><dd>${payHtml(k)}</dd>` : ''}
      ${c.strengthsUsed.length ? `<dt>${t('app.card.strengths')}</dt><dd><div class="tags">${c.strengthsUsed.map(p => `<span class="tag-s on">${esc(p.label)}</span>`).join('')}</div></dd>` : ''}
      <dt>${t('app.card.day')}</dt><dd><ul>${k.dayInLife.map(d => `<li>${esc(d)}</li>`).join('')}</ul></dd>
      <dt>${t('app.card.growth')}</dt><dd><ol class="growth">${k.growth.map(g => `<li>${esc(g)}</li>`).join('')}</ol></dd>
      <dt>${t('app.card.roles')}</dt><dd>${esc(k.roles)}</dd></dl></section>
    <section class="grp"><h4>${t('app.card.future')}</h4><dl>
      <dt>${t('app.card.why')}</dt><dd>${esc(k.whyNeeded)}${force ? ` <span class="muted small">(${force.name.toLowerCase()})</span>` : ''}${demand}</dd>
      <dt>${t('app.card.need')}</dt><dd>${need}${k.robustnessNote ? ` <span class="muted small">${esc(k.robustnessNote)}</span>` : ''} <span class="muted small">${t('app.card.need_note')}</span></dd></dl></section>
    <section class="grp"><h4>${t('app.card.in_krakow')}</h4>${reach.map(o => offerHtml(o.offer, o.check)).join('')}${blocked.length ? `<p class="small muted">${t('app.card.blocked')}</p>${blocked.map(o => offerHtml(o.offer, o.check)).join('')}` : ''}${hidden.length ? `<details class="small"><summary>${t('app.card.private', { n: hidden.length })}</summary>${hidden.map(o => offerHtml(o.offer, o.check)).join('')}</details>` : ''}${!c.offers.length ? '<span class="muted">' + t('app.card.no_study') + '</span>' : ''}</section>
    <section class="grp"><h4>${t('app.card.path')}</h4>${first ? `<ul>${pathSteps(first, campus(first.campus).name).map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      <p><b>${t('app.card.experiment')}</b> ${esc(k.experiment)}</p></section>
    ${TEST ? `<p class="testv">fit ${c.fit.toFixed(1)} · int ${c.parts.interests.toFixed(2)} · styl ${c.parts.workStyle.toFixed(2)} · wart ${c.parts.values.toFixed(2)}</p>` : ''}`;
  return `<details class="card opt" data-card="${k.id}" ${open ? 'open' : ''}>
    <summary class="optsum"><span class="area-ico">${icon(k.cluster)}</span><span class="opthead"><span class="small muted">${slot} · ${esc(c.band)}${c.pinned ? ' · ' + t('app.card.pinned') : ''}</span><h3>${esc(k.name)}</h3><span class="small teaser">${esc(k.whoYouHelp)}</span></span></summary>${body}</details>`;
}

// Path map, left to right: his strengths (roots) → options → Kraków studies.
// Each shown option is one coloured line; its name is written on the line, so colour is never the only cue.
const LINE_COLORS = ['var(--l0)', 'var(--l1)', 'var(--l2)', 'var(--l3)', 'var(--l4)', 'var(--l5)'];

function wrap(text, max) {
  const words = String(text).split(' '), lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + ' ' + w).trim().length > max && cur) lines.push(w); else lines[lines.length - 1] = (cur + ' ' + w).trim();
  }
  return lines.slice(0, 3);
}
const tspans = (lines, x, y, lh = 15) => lines.map((l, i) => `<tspan x="${x}" y="${y + i * lh - (lines.length - 1) * lh / 2}">${esc(l)}</tspan>`).join('');

function pathMapSvg(r) {
  const s = r.slots;
  const rows = [...s.best.map(c => ({ c, slot: 'najlepsze' })), s.most && { c: s.most, slot: 'most' }, s.surprise && { c: s.surprise, slot: 'niespodzianka' }].filter(Boolean);
  const proven = provenStrengths(A).map(p => ({ id: p.id, name: data.strengths.find(x => x.id === p.id).name }));
  const topDims = r.profile.top.slice(0, 2).map(d => data.dimensions.interests.find(x => x.id === d).name.toLowerCase());
  const langs = [];
  for (const row of rows) for (const p of row.c.paths) if (p.kind === 'language' && !langs.find(l => l.id === p.id)) langs.push({ id: p.id, name: p.label });
  const roots = [...proven, ...langs, { id: '_int', name: t('app.map.interests', { dims: topDims.join(', ') }) }];

  // Studies column: up to 2 reachable offers per option, plus the quick start.
  const offers = [];
  rows.forEach((row, i) => {
    row.color = LINE_COLORS[i % LINE_COLORS.length];
    row.offers = row.c.offers.filter(o => o.check.reachable).slice(0, 2).map(o => o.offer);
    for (const o of row.offers) if (!offers.find(x => x.id === o.id)) offers.push(o);
  });
  if (s.quick && !offers.find(x => x.id === s.quick.o.offer.id)) offers.push(s.quick.o.offer);

  const W = 860, ROW = 62, CROW = 104, X1 = 200, X2 = 470, X3 = 640;
  const BODY = Math.max(roots.length * ROW, rows.length * CROW, offers.length * ROW);
  const H = BODY + 90;
  const ys = (n, step) => Array.from({ length: n }, (_, i) => 70 + (BODY - n * step) / 2 + i * step + step / 2);
  const yR = ys(roots.length, ROW), yC = ys(rows.length, CROW), yO = ys(offers.length, ROW);
  const curve = (x1, y1, x2, y2) => { const m = (x1 + x2) / 2; return `M${x1},${y1.toFixed(1)} C${m},${y1.toFixed(1)} ${m},${y2.toFixed(1)} ${x2},${y2.toFixed(1)}`; };

  // Which rows (options) touch each root and each offer: used to fade what is not on the selected road.
  const rootRows = roots.map(() => new Set()), offerRows = offers.map(() => new Set());
  const cls = set => [...set].map(i => 'r' + i).join(' ');
  let svg = `<svg class="${drawOnce ? 'draw' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${t('app.map.aria')}">`;
  svg += `<text x="20" y="28" class="col">${t('app.map.col_strengths')}</text><text x="${X2 - 90}" y="28" class="col">${t('app.map.col_options')}</text><text x="${X3 + 18}" y="28" class="col">${t('app.map.col_studies')}</text>`;

  rows.forEach((row, i) => {
    const ids = row.c.paths.filter(p => p.kind === 'strength' || p.kind === 'language').map(p => p.id);
    const fromDim = row.c.paths.some(p => p.kind === 'dimension') || !ids.length;
    const src = [...ids, ...(fromDim ? ['_int'] : [])];
    const w = row.slot === 'najlepsze' ? 5 : 3.5;
    for (const id of src) {
      const j = roots.findIndex(x => x.id === id);
      rootRows[j].add(i);
      const dash = id === '_int';
      svg += `<path class="seg r${i}${dash ? '' : ' solid'}" style="--d:${(i * 0.18).toFixed(2)}s" ${dash ? '' : 'pathLength="1"'} d="${curve(X1, yR[j], X2, yC[i])}" stroke="${row.color}" stroke-width="${w}" fill="none" ${dash ? 'stroke-dasharray="6 5"' : ''}/>`;
    }
    for (const o of row.offers) {
      const k = offers.findIndex(x => x.id === o.id);
      offerRows[k].add(i);
      svg += `<path class="seg r${i} solid" style="--d:${(0.7 + i * 0.18).toFixed(2)}s" pathLength="1" d="${curve(X2, yC[i], X3, yO[k])}" stroke="${row.color}" stroke-width="${w}" fill="none"/>`;
    }
  });
  if (s.quick) {
    const k = offers.findIndex(x => x.id === s.quick.o.offer.id), i = rows.findIndex(x => x.c === s.quick.c);
    if (i >= 0) { offerRows[k].add(i); svg += `<path class="seg r${i}" style="--d:1.4s" d="${curve(X2, yC[i], X3, yO[k])}" stroke="var(--muted)" stroke-width="2.5" fill="none" stroke-dasharray="2 5"/>`; }
  }

  roots.forEach((rt, j) => {
    svg += `<g class="node ${cls(rootRows[j])}" style="--d:0s"><text x="${X1 - 16}" y="${yR[j]}" text-anchor="end" class="lbl">${tspans(wrap(rt.name, 22), X1 - 16, yR[j] + 4)}</text>`;
    svg += `<circle cx="${X1}" cy="${yR[j]}" r="8" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/></g>`;
  });
  rows.forEach((row, i) => {
    const y = yC[i], label = row.slot === 'most' ? t('app.slot.bridge') : row.slot === 'niespodzianka' ? t('app.slot.surprise') : row.c.band;
    svg += `<g class="node stop r${i}" style="--d:${(0.4 + i * 0.18).toFixed(2)}s" data-maprow="${i}" data-color="${row.color}" role="button" tabindex="0" aria-label="${t('app.map.highlight', { name: esc(row.c.card.name) })}">`;
    svg += `<rect x="${X2 - 120}" y="${y - 58}" width="240" height="100" fill="transparent"/>`;
    svg += `<rect x="${X2 - 13}" y="${y - 13}" width="26" height="26" rx="13" fill="${row.color}" stroke="var(--card)" stroke-width="3"/>`;
    svg += `<text text-anchor="middle" class="stn" style="fill:${row.color}">${tspans(wrap(row.c.card.name, 26), X2, y - 32, 15)}</text>`;
    svg += `<text x="${X2}" y="${y + 30}" text-anchor="middle" class="tag">${esc(label)}</text></g>`;
  });
  offers.forEach((o, k) => {
    const quick = s.quick && s.quick.o.offer.id === o.id;
    svg += `<g class="node study ${cls(offerRows[k])}" style="--d:${(1.1 + k * 0.08).toFixed(2)}s"><circle cx="${X3}" cy="${yO[k]}" r="7" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`;
    svg += `<text class="lbl">${tspans([o.name, o.institution + (quick ? ' · ' + t('app.map.quick_start') : '')].flatMap(t => wrap(t, 30)).slice(0, 3), X3 + 16, yO[k] + 4)}</text></g>`;
  });

  return svg + '</svg>';
}

// "Twoja droga" as tram lines: each option is a line and its stops are dated steps.
// Declaration, open days, matura, recruitment and the autumn start are shared stations every line
// passes through (a "przesiadka": changing line there is normal); the lines then end in different years.
function tramLines(r) {
  const s = r.slots, shown = [...s.best, s.most, s.surprise].filter(Boolean), lines = [];
  for (const c of [...s.best, s.most].filter(Boolean)) {
    const o = c.offers.find(x => x.check.reachable) || c.offers.find(x => !x.check.hidden);
    if (o) lines.push({ c, o: o.offer, chk: o.check, color: LINE_COLORS[shown.indexOf(c) % LINE_COLORS.length], name: c.card.name });
  }
  if (s.quick && !lines.some(l => l.o.id === s.quick.o.offer.id))
    lines.push({ c: s.quick.c, o: s.quick.o.offer, chk: s.quick.o.check, color: 'var(--muted)', name: t('app.slot.quick'), quick: true });
  for (const l of lines) l.end = 2027 + Math.ceil(l.o.durationYears);
  return lines;
}

const SHARED = [
  { key: 'dek', date: 'app.date.declaration', sub: 'app.tram.declaration' },
  { key: 'dni', date: 'app.date.open_days', sub: 'app.tram.open_days' },
  { key: 'mat', date: 'app.date.matura', sub: 'app.tram.matura' },
  { key: 'rek', date: 'app.date.recruitment', sub: 'app.tram.recruitment' },
  { key: 'start', date: 'app.date.start', sub: 'app.tram.start' }
];

function tramMapSvg(lines) {
  const ends = [...new Set(lines.map(l => l.end))].sort();
  const rows = [...SHARED.map(x => ({ key: x.key, date: t(x.date), sub: t(x.sub) })), ...ends.map(y => ({ key: 'e' + y, date: String(y), sub: t('app.tram.end') }))];
  const W = 360, X0 = 182, n = lines.length, DX = n > 1 ? Math.min(38, (W - 20 - X0) / (n - 1)) : 0, TOP = 58, RH = 50;
  const x = i => X0 + i * DX, y = k => TOP + rows.findIndex(r => r.key === k) * RH;
  const H = TOP + rows.length * RH;
  let svg = `<svg class="${drawOnce ? 'draw' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('app.tram.aria')}">`;
  lines.forEach((l, i) => {
    svg += `<g style="--d:${(i * 0.2).toFixed(1)}s"><circle cx="${x(i)}" cy="22" r="13" fill="${l.color}"/><text x="${x(i)}" y="27" text-anchor="middle" class="tno">${l.quick ? 'S' : i + 1}</text></g>`;
    svg += `<path class="tl solid" style="--d:${(0.2 + i * 0.2).toFixed(1)}s" pathLength="1" d="M${x(i)},${TOP - 14} L${x(i)},${y('e' + l.end)}" stroke="${l.color}" stroke-width="6" stroke-linecap="round" fill="none" ${l.quick ? 'stroke-dasharray="0.02 0.03"' : ''}/>`;
  });
  rows.forEach((r, k) => {
    const yy = TOP + k * RH;
    svg += `<text class="tlab"><tspan x="8" y="${yy - 3}" class="td">${esc(r.date)}</tspan><tspan x="8" y="${yy + 13}" class="ts">${esc(r.sub)}</tspan></text>`;
    const on = lines.map((l, i) => ({ l, i })).filter(({ l }) => k < SHARED.length || r.key === 'e' + l.end);
    if (k < SHARED.length && n) {
      svg += `<rect class="station" x="${x(0) - 13}" y="${yy - 11}" width="${x(n - 1) - x(0) + 26}" height="22" rx="11"/>`;
      for (const { l, i } of on) {
        const warn = r.key === 'dek' && (!l.chk.reachable || l.chk.soft);
        svg += `<circle cx="${x(i)}" cy="${yy}" r="${warn ? 6 : 4.5}" fill="${warn ? 'var(--warn)' : 'var(--card)'}" stroke="${warn ? 'var(--warn)' : l.color}" stroke-width="2.5"/>`;
      }
    } else for (const { l, i } of on) svg += `<g class="term" style="--d:${(1.2 + i * 0.2).toFixed(1)}s"><circle cx="${x(i)}" cy="${yy}" r="10" fill="${l.color}"/><circle cx="${x(i)}" cy="${yy}" r="4" fill="var(--card)"/></g>`;
  });
  return svg + '</svg>';
}

function tramLegend(lines) {
  return `<ol class="tramleg">${lines.map((l, i) => {
    const camp = campus(l.o.campus);
    const fix = !l.chk.reachable ? `<span class="badge warn">${t('app.tram.first', { what: esc(l.chk.blocked[0] || t('app.path.matura_change')) })}</span>` : l.chk.soft ? `<span class="badge warn">${t('app.tram.add_ext', { what: esc(l.chk.soft) })}</span>` : '';
    return `<li><span class="tno-b" style="background:${l.color}">${l.quick ? 'S' : i + 1}</span><div><b>${esc(l.name)}</b>${l.quick ? ` <span class="muted small">(${esc(l.c.card.name)})</span>` : ''}<br>
      <span class="small">${esc(l.o.name)}, ${esc(l.o.institution)} · ${plural(l.o.durationYears, 'app.years', { n: String(l.o.durationYears).replace('.', ',') })} · ${t('app.tram.end_ok', { y: l.end })}${l.o.next ? ` · ${t('app.tram.then', { next: esc(l.o.next) })}` : ''}</span> ${fix}
      <details class="small steps"><summary>${t('app.tram.steps')}</summary><ul>${pathSteps(l.o, camp?.name).map(t => `<li>${esc(t)}</li>`).join('')}</ul></details></div></li>`;
  }).join('')}</ol>`;
}

function changesSince(r) {
  if (!prevFile?.snapshot) return '';
  const s = r.slots, name = id => data.opportunities.find(c => c.id === id)?.name || id;
  const now = [...s.best, s.most, s.surprise].filter(Boolean).map(c => c.card.id);
  const old = [...(prevFile.snapshot.best || []), prevFile.snapshot.most, prevFile.snapshot.surprise].filter(Boolean);
  const added = now.filter(id => !old.includes(id)), gone = old.filter(id => !now.includes(id)), kept = now.filter(id => old.includes(id));
  return `<div class="card compare"><h3>${t('app.compare.changed', { date: esc(prevFile.date || t('app.compare.prev_file')) })}</h3><ul>
    ${kept.length ? `<li>${t('app.compare.kept', { list: kept.map(name).map(esc).join(', ') })}</li>` : ''}
    ${added.length ? `<li>${t('app.compare.added', { list: added.map(name).map(esc).join(', ') })}</li>` : ''}
    ${gone.length ? `<li>${t('app.compare.gone', { list: gone.map(name).map(esc).join(', ') })}</li>` : ''}
    ${!added.length && !gone.length ? '<li>' + t('app.compare.same') + '</li>' : ''}</ul>
    <p class="small muted">${t('app.compare.question')}</p></div>`;
}

// Angle of the picked direction, so the needle stays where he pointed it after a re-render.
function selAngle(s) {
  if (compassSel === 'quick') return 180;
  const i = s.best.findIndex(c => c.card.id === compassSel);
  if (i >= 0) return [0, 22.5, -22.5][i];
  if (s.most?.card.id === compassSel) return 90;
  if (s.surprise?.card.id === compassSel) return -90;
  return 0;
}

// The options shown in the results, in the same order and colours everywhere (compass, roads, tram lines).
function shownOptions(r) {
  const s = r.slots, out = [];
  s.best.forEach((c, i) => out.push({ c, key: c.card.id, no: String(i + 1), slot: t('app.slot.best'), color: LINE_COLORS[i] }));
  if (s.most) out.push({ c: s.most, key: s.most.card.id, no: 'M', slot: t('app.slot.bridge'), color: LINE_COLORS[3] });
  if (s.surprise) out.push({ c: s.surprise, key: s.surprise.card.id, no: 'N', slot: t('app.slot.surprise'), color: LINE_COLORS[4] });
  if (s.quick) out.push({ c: s.quick.c, key: 'quick', no: 'S', slot: t('app.slot.quick'), color: 'var(--muted)', quick: s.quick.o });
  return out;
}
const nameOf = id => data.strengths.find(x => x.id === id)?.name || id;

function previewHtml(r, key) {
  const o = shownOptions(r).find(x => x.key === key);
  if (!o) return '';
  const c = o.c, first = o.quick ? o.quick.offer : (c.offers.find(x => x.check.reachable) || c.offers[0])?.offer;
  const used = c.strengthsUsed.map(p => p.label);
  return `<div class="prevcard rise" style="--c:${o.color}">
    <div class="prevhead"><span class="tno-b" style="background:${o.color}">${o.no}</span><div><span class="ctag">${esc(o.slot)}</span>
      <h3>${esc(o.quick ? first.name : c.card.name)}</h3>${o.quick ? '' : `<span class="small muted">${esc(c.band)}</span>`}</div></div>
    <p class="small">${esc(o.quick ? t('app.preview.quick', { years: String(first.durationYears).replace('.', ','), area: c.card.name }) : c.card.whoYouHelp)}</p>
    ${used.length ? `<p class="small muted">${t('app.preview.strengths')}</p><div class="tags">${used.map(u => `<span class="tag-s on">${esc(u)}</span>`).join('')}</div>` : ''}
    ${first ? `<p class="small">${icon('school', 'ico sm')} ${esc(first.name)}, ${esc(shortInst(first.institution))} · ${plural(first.durationYears, 'app.years', { n: String(first.durationYears).replace('.', ',') })}</p>` : ''}
    <div class="actions"><button class="btn" data-goopt="${esc(key)}">${t('app.preview.show_road')}</button><button class="btn ghost" data-pick="">${t('app.preview.close')}</button></div></div>`;
}

const PARTS = [
  { id: 'w-mocne', title: 'app.part.strengths', sub: 'app.part.strengths_sub', ico: 'star', col: 'var(--l0)' },
  { id: 'w-kierunki', title: 'app.part.directions', sub: 'app.part.directions_sub', ico: 'route', col: 'var(--l2)' },
  { id: 'w-droga', title: 'app.part.path', sub: 'app.part.path_sub', ico: 'tram', col: 'var(--l1)' },
  { id: 'w-przyszlosc', title: 'app.part.future', sub: 'app.part.future_sub', ico: 'future', col: 'var(--l4)' },
  { id: 'w-plik', title: 'app.part.file', sub: 'app.part.file_sub', ico: 'file', col: 'var(--l3)' }
];

function tilesHtml() {
  const n = PARTS.filter(p => seenParts.has(p.id)).length;
  return `<div class="tiles-h"><h2>${t('app.tiles.title')}</h2><span class="small muted">${t('app.tiles.found', { n: n, total: PARTS.length })}</span></div>
    <div class="tiles">${PARTS.map((p, i) => `<button class="tile rise" style="--i:${i};--c:${p.col}" data-go="${p.id}">
      <span class="tile-ico">${icon(p.ico)}</span><span class="tile-t"><b>${t(p.title)}</b><span class="small">${t(p.sub)}</span></span>
      ${seenParts.has(p.id) ? `<span class="tile-ok" aria-label="${t('app.tiles.seen')}">${icon('check')}</span>` : i === 0 && !n ? '<span class="tile-start">' + t('app.tiles.start') + '</span>' : ''}</button>`).join('')}</div>`;
}

function tabBar(id) {
  const tabs = [['kompas', t('app.tab.compass'), 'compass'], ['w-mocne', t('app.tab.strengths'), 'star'], ['w-kierunki', t('app.tab.directions'), 'route'], ['w-droga', t('app.tab.path'), 'tram'], ['w-przyszlosc', t('app.tab.future'), 'future']];
  return `<nav class="tabbar noprint" aria-label="${t('app.tabs.label')}">${tabs.map(([k, l, ic]) => `<button data-go="${k}" ${k === id || (id === 'w-plik' && k === 'kompas') ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span></button>`).join('')}</nav>`;
}

// Bottom of each part: the next part in the suggested order, so the journey has a direction.
function nextPart(id) {
  const i = PARTS.findIndex(p => p.id === id), n = PARTS[i + 1];
  return `<div class="nextpart noprint">${n ? `<button class="btn" data-go="${n.id}">${t('app.part.next', { title: t(n.title) })}</button>` : ''}<button class="btn ghost" data-go="kompas">${icon('compass', 'ico sm')} ${t('app.tab.compass')}</button></div>`;
}
const needResults = () => provenStrengths(A).length < 1 || !A.values.length;
const partHead = (p, lead) => `<div class="parthead" style="--c:${p.col}"><span class="tile-ico">${icon(p.ico)}</span><div><h1>${t(p.title)}</h1><p class="small">${lead}</p></div></div>`;

// ---- Mocne strony: flip cards, profile bars, values, "Mogę to zrobić, bo…"
function vPartStrengths() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), opts = shownOptions(r).filter(o => !o.quick);
  const cards = provenStrengths(A).map((x, i) => {
    const leads = opts.filter(o => o.c.strengthsUsed.some(p => p.id === x.id));
    return `<button class="flip rise" style="--i:${i}" data-flip aria-pressed="false" aria-label="${t('app.pstrengths.flip_aria', { name: esc(nameOf(x.id)) })}">
      <span class="face front"><span class="star">${icon('star')}</span><b>${esc(nameOf(x.id))}</b><span class="small muted">${t('app.pstrengths.flip_hint')}</span></span>
      <span class="face back"><span class="small">${esc(proofText(x.proof))}</span>${leads.length ? `<span class="leads">${leads.map(o => `<span class="tno-b sm" style="background:${o.color}" title="${esc(o.c.card.name)}">${o.no}</span>`).join('')}<span class="small muted">${t('app.pstrengths.leads', { list: leads.map(o => o.no).join(', ') })}</span></span>` : ''}</span></button>`;
  }).join('');
  const dims = r.profile.top.map((d, i) => { const dim = data.dimensions.interests.find(x => x.id === d), v = Math.round(r.profile.score[d]);
    return `<div class="bar${i < 2 ? ' main' : ''}"><span class="bl">${esc(dim.name)}</span><span class="bt"><i style="width:${v}%;--i:${i}"></i></span><span class="bd small muted">${esc(dim.desc)}</span></div>`; }).join('');
  const vals = (A.values || []).map((v, i) => `<li><span class="vn">${i + 1}</span>${esc(data.dimensions.values.find(x => x.id === v).name)}</li>`).join('');
  return `${partHead(PARTS[0], t('app.pstrengths.lead'))}
    <div class="flips">${cards}</div>
    <h2>${t('app.pstrengths.profile')}</h2><p class="small muted">${t('app.pstrengths.profile_note')}</p>
    <div class="card bars">${dims}</div>
    <h2>${t('app.pstrengths.values')}</h2><ol class="vals">${vals}</ol>
    <h2>${t('app.cando.title')}</h2>
    <label class="field" for="cando">${t('app.cando.label')}</label>
    ${candoChips()}<input id="cando" type="text" data-field="canDo" value="${esc(A.canDo)}">
    ${nextPart('w-mocne')}`;
}

// ---- Kierunki: one option at a time as a vertical road, then its full card
function vPartDirections() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), opts = shownOptions(r);
  const sel = opts.find(o => o.key === kierSel) || opts[0];
  const card = sel.quick ? `<div class="card opt"><span class="ctag">${t('app.slot.quick')}</span><h3>${esc(sel.quick.offer.name)}</h3>
      <p>${esc(sel.quick.offer.institution)}. ${sel.quick.offer.next ? esc(sel.quick.offer.next) + '.' : ''}</p>${offerHtml(sel.quick.offer, sel.quick.check)}</div>`
    : cardHtml(sel.slot, sel.c, true, A.scenario);
  return `${partHead(PARTS[1], t('app.directions.lead'))}
    <div class="optpick" role="group" aria-label="${t('app.directions.pick_aria')}">${opts.map(o => `<button class="optchip" data-kier="${esc(o.key)}" aria-pressed="${o === sel}" style="--c:${o.color}"><span class="tno-b sm" style="background:${o.color}">${o.no}</span><span>${esc(o.quick ? t('app.slot.quick') : o.c.card.name)}</span></button>`).join('')}</div>
    ${confLine(r.profile.confidence)}
    <div class="card vroad">${vRoadSvg(sel)}</div>
    ${card}
    ${r.slots.rest.length ? `<details class="card"><summary>${t('app.directions.rest', { n: r.slots.rest.length })}</summary>${r.slots.rest.map(c => cardHtml(t('app.slot.other'), c, false, A.scenario)).join('')}</details>` : ''}
    ${nextPart('w-kierunki')}`;
}

// Vertical road for one option: strengths (top) → option → Kraków studies → example jobs. Fits a phone.
function vRoadSvg(o) {
  const c = o.c, W = 360, col = o.color;
  const roots = c.paths.filter(p => p.kind !== 'dimension').map(p => p.label.replace(/^język: /, 'język: '));
  if (!roots.length || c.paths.some(p => p.kind === 'dimension')) roots.push(t('app.path.own_interests'));
  const studies = o.quick ? [{ offer: o.quick.offer, check: o.quick.check }] : [...c.offers.filter(x => x.check.reachable), ...c.offers.filter(x => !x.check.reachable && !x.check.hidden)].slice(0, 3);
  const jobs = (o.quick ? [o.quick.offer.next || o.quick.offer.name] : c.card.roles.split(',')).map(t => t.trim()).filter(Boolean).slice(0, 4);
  // Lay pills out in centred rows.
  const pw = t => Math.min(W - 24, 22 + t.length * 7.1);
  const rows = (items, y0, gap = 8, rh = 40) => { const out = []; let row = [], w = 0;
    for (const t of items) { const x = pw(t); if (row.length && w + x + gap > W - 16) { out.push(row); row = []; w = 0; } row.push({ t, w: x }); w += x + gap; }
    if (row.length) out.push(row);
    const placed = [];
    out.forEach((rw, k) => { const tot = rw.reduce((a, b) => a + b.w, 0) + gap * (rw.length - 1); let x = (W - tot) / 2;
      for (const p of rw) { placed.push({ ...p, x, y: y0 + k * rh }); x += p.w + gap; } });
    return { placed, h: out.length * rh }; };
  const top = rows(roots, 48);
  const yS = 48 + top.h + 44, label = wrap(o.quick ? t('app.slot.quick') : c.card.name, 26);
  const yStud0 = yS + 100 + label.length * 17; // room for the curve to reach the trunk above the caption (2.5 fix)
  const SH = 50, studY = studies.map((_, i) => yStud0 + i * (SH + 10));
  const yJobs = yStud0 + studies.length * (SH + 10) + 44;
  const jb = rows(jobs, yJobs + 22);
  const H = yJobs + 22 + jb.h + 14;
  const curve = (x1, y1, x2, y2) => { const m = (y1 + y2) / 2; return `M${x1.toFixed(1)},${y1} C${x1.toFixed(1)},${m} ${x2.toFixed(1)},${m} ${x2.toFixed(1)},${y2}`; };
  let g = `<svg class="vdraw" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('app.road.aria', { roots: esc(roots.join(', ')), area: esc(c.card.name), studies: esc(studies.map(x => x.offer.name).join(', ')), jobs: esc(jobs.join(', ')) })}">`;
  g += `<text x="12" y="16" class="vcap">${t('app.map.col_strengths')}</text>`;
  top.placed.forEach((p, k) => { g += `<path class="vl" style="--d:${(k * 0.08).toFixed(2)}s" pathLength="1" d="${curve(p.x + p.w / 2, p.y + 15, W / 2, yS - 18)}" stroke="${col}"/>`; });
  top.placed.forEach(p => { g += `<g class="vpill"><rect x="${p.x}" y="${p.y - 15}" width="${p.w}" height="30" rx="15"/><text x="${p.x + p.w / 2}" y="${p.y + 5}" text-anchor="middle">${esc(p.t)}</text></g>`; });
  g += `<g class="vstation" style="--d:.5s"><circle cx="${W / 2}" cy="${yS}" r="18" fill="${col}"/><text x="${W / 2}" y="${yS + 6}" text-anchor="middle" class="vno">${o.no}</text>
    <text text-anchor="middle" class="vname" style="fill:${col}">${tspans(label, W / 2, yS + 36 + (label.length - 1) * 8.5, 17)}</text></g>`;
  const trunkX = 30, yName = yS + 30 + label.length * 17, yTurn = yStud0 - 34;
  // The curve reaches the trunk above the caption, and the caption sits right of the trunk, so the line never crosses text.
  g += `<path class="vl" style="--d:.7s" pathLength="1" d="M${W / 2},${yName} C${W / 2},${yTurn - 6} ${trunkX},${yName + 4} ${trunkX},${yTurn} L${trunkX},${yJobs - 10}" stroke="${col}"/>`;
  g += `<text x="${trunkX + 18}" y="${yStud0 - 12}" class="vcap">${t('app.road.where')}</text>`;
  studies.forEach((st, i) => { const y = studY[i], ok = st.check.reachable, warn = !ok || st.check.soft;
    g += `<g class="vstudy" style="--d:${(0.9 + i * 0.15).toFixed(2)}s" data-study="${esc(st.offer.id)}" role="button" tabindex="0" aria-expanded="false" aria-label="${t('app.road.study_aria', { name: esc(st.offer.name), inst: esc(st.offer.institution) })}"><path d="M${trunkX},${y + SH / 2} H${trunkX + 20}" stroke="${col}" class="vtick"/><circle cx="${trunkX}" cy="${y + SH / 2}" r="6" fill="var(--card)" stroke="${col}" stroke-width="3"/>
      <rect x="${trunkX + 20}" y="${y}" width="${W - trunkX - 32}" height="${SH}" rx="12" class="${warn ? 'warnbox' : ''}"/>
      <text x="${trunkX + 34}" y="${y + 21}" class="vst">${esc(st.offer.name.length > 30 ? st.offer.name.slice(0, 29) + '…' : st.offer.name)}</text>
      <text x="${W - 26}" y="${y + 30}" text-anchor="end" class="vmore">›</text>
      <text x="${trunkX + 34}" y="${y + 39}" class="vsub">${esc((t => t.length > 46 ? t.slice(0, 45) + '…' : t)(`${shortInst(st.offer.institution)} · ${plural(st.offer.durationYears, 'app.years', { n: String(st.offer.durationYears).replace('.', ',') })}${!ok ? ' · ' + t('app.road.needs_change') : st.check.soft ? ' · ' + t('app.road.add_ext') : ''}`))}</text></g>`; });
  if (!studies.length) g += `<text x="${trunkX + 20}" y="${yStud0 + 20}" class="vsub">${t('app.card.no_study')}</text>`;
  g += `<path class="vl" style="--d:1.3s" pathLength="1" d="M${trunkX},${yJobs - 10} C${trunkX},${yJobs + 4} ${W / 2},${yJobs - 4} ${W / 2},${yJobs + 6}" stroke="${col}"/>`;
  g += `<text x="12" y="${yJobs - 18}" class="vcap" text-anchor="start" dx="${trunkX + 10}">${o.quick ? t('app.road.first_job') : t('app.road.jobs')}</text>`;
  jb.placed.forEach((p, k) => { g += `<g class="vjob" style="--d:${(1.5 + k * 0.1).toFixed(2)}s"><rect x="${p.x}" y="${p.y - 15}" width="${p.w}" height="30" rx="8" style="stroke:${col}"/><text x="${p.x + p.w / 2}" y="${p.y + 5}" text-anchor="middle">${esc(p.t)}</text></g>`; });
  return g + '</svg>';
}

// ---- Deklaracja maturalna: which one extra extended subject opens most of what he cares about (v2.2)
const FIT_TXT = { 3: 'app.fit.full', 2: 'app.fit.part', 1: 'app.fit.weak', 0: 'app.fit.none' };
const offName = o => `${o.name} (${shortInst(o.institution)})`;
const nList = (list, max = 4) => esc(list.slice(0, max).map(offName).join(', ') + (list.length > max ? ` ${t('app.decl.and_more', { n: list.length - max })}` : ''));
// where: 'story' (the scroll page, link jumps to "Kierunki z bliska") or 'report' (the one-page report, link scrolls to "Opcje").
let declWhere = 'story';
function declarationHtml(r, where = declWhere) {
  declWhere = where;
  const h = declarationHelp(r, A, data), ext = A.rozszerzenia || [];
  const n = (A.stars || []).length;
  const link = where === 'story' ? '<button class="linkbtn" data-jump="s-kierunki">' + t('app.decl.link_close') + '</button> ' + t('app.decl.link_tap')
    : '<button class="linkbtn" data-scroll="r-opcje">' + t('app.decl.link_options') + '</button>';
  const basis = h.basis === 'stars'
    ? t('app.decl.basis_stars', { n: n, link: link })
    : t('app.decl.basis_nostars', { total: h.total, link: link });
  if (!ext.length) return `<h2 id="deklaracja">${t('app.decl.title_short')}</h2><div class="card decl"><p>${t('app.decl.no_ext')}</p>
    <div class="actions"><button class="btn" data-go="matura">${t('app.decl.mark_ext')}</button></div></div>`;
  const dep = h.full.length + h.part.length + h.weak.length + h.closed.length;
  const seg = (k, list, cls) => list.length ? `<span class="dseg ${cls}" style="flex:${list.length}" title="${t(FIT_TXT[k])}: ${list.length}"></span>` : '';
  const meter = dep ? `<div class="dmeter" aria-hidden="true">${seg(3, h.full, 'f3')}${seg(2, h.part, 'f2')}${seg(1, h.weak, 'f1')}${seg(0, h.closed, 'f0')}</div>` : '';
  const sum = [[h.full, t('app.decl.sum_full')], [h.part, t('app.decl.sum_part')], [h.weak, t('app.decl.sum_weak')], [h.closed, t('app.decl.sum_closed')]].filter(([l]) => l.length).map(([l, t]) => `<b>${l.length}</b> ${t}`).join(' · ');
  const gains = h.gains.length ? `<ol class="dgains">${h.gains.map((g, i) => `<li${i === 0 ? ' class="dbest"' : ''}><b>+ ${esc(g.subject)}</b>
      ${g.opens.length ? `<span class="small">${t('app.decl.opens', { n: g.opens.length, list: nList(g.opens) })}</span>` : ''}
      ${g.better.length ? `<span class="small muted">${t('app.decl.better', { n: g.better.length, list: nList(g.better) })}</span>` : ''}</li>`).join('')}</ol>`
    : `<p class="small">${h.needMore.length ? t('app.decl.none_more') : t('app.decl.none')}</p>`;
  const keep = h.keep.length ? `<p class="small"><b>${t('app.decl.keep')}</b> ${h.keep.map(k => t('app.decl.counts_in', { subject: esc(k.subject), n: k.needed.length })).join(', ')}.</p>` : '';
  const more = h.needMore.length ? `<p class="small muted">${t('app.decl.more', { list: nList(h.needMore, 3) })}</p>` : '';
  const rows = [...h.full.map(o => [o, 3]), ...h.part.map(o => [o, 2]), ...h.weak.map(o => [o, 1]), ...h.closed.map(o => [o, 0]), ...h.free.map(o => [o, null])];
  const list = `<details class="dlist"${h.basis === 'stars' ? ' open' : ''}><summary>${h.basis === 'stars' ? t('app.decl.list_stars') : t('app.decl.list_all')} (${rows.length})</summary><ul>${rows.map(([o, f]) => `<li>${starBtn(o)}<span><b>${esc(o.name)}</b>, ${esc(shortInst(o.institution))}<br>
      <span class="small ${f === 3 ? '' : 'muted'}">${f === null ? (o.requires?.noMatura ? t('app.decl.no_matura') : o.requires?.exam ? t('app.decl.exam') : t('app.decl.indep_db')) : t(FIT_TXT[f])} · ${esc(o.requires?.note || '')}</span></span></li>`).join('')}</ul></details>`;
  return `<h2 id="deklaracja">${t('app.decl.title')}</h2>
    <div class="card decl">
      <p class="small muted">${basis}</p>
      <p>${t('app.decl.mine', { list: esc(ext.join(', ')) })}${dep ? ` ${t('app.decl.fits', { sum: sum })}` : ''}${h.free.length ? ` <span class="small muted">${t('app.decl.free', { n: h.free.length })}</span>` : ''}</p>
      ${meter}
      <h3>${t('app.decl.one_more')}</h3>${gains}${keep}${more}${list}
      <p class="small muted">${t('app.decl.note', { date: esc(data.config.declarationDeadline) })}</p>
      <div class="actions"><button class="btn ghost" data-go="matura">${t('app.decl.change_ext')}</button></div>
    </div>`;
}

// ---- Porównanie: 2–3 starred offers side by side (v2.4). A table on wide screens, swipe cards on phones.
function compareRows() {
  const ext = A.rozszerzenia || [];
  return [
    [t('app.compare.row_inst'), o => { const c = campus(o.campus); return `${esc(o.institution)}${c ? `<br><span class="small muted">${esc(c.name)}, ${esc(c.address)}</span>` : ''}`; }],
    [t('app.compare.row_length'), o => `${plural(o.durationYears, 'app.years', { n: String(o.durationYears).replace('.', ',') })} · ${esc(o.level)}`],
    [t('app.compare.row_subjects'), o => { const f = subjectFit(o, ext); return `<b>${f === null ? (o.requires?.noMatura ? t('app.decl.no_matura') : o.requires?.exam ? t('app.compare.exam') : t('app.compare.indep')) : t(FIT_TXT[f])}</b><br><span class="small muted">${esc(o.requires?.note || '')}</span>`; }],
    [t('app.compare.row_threshold'), o => o.threshold ? `${t('app.compare.points', { p: o.threshold.points, m: o.threshold.max })}${o.threshold.round ? ` <span class="small muted">(${esc(o.threshold.round)})</span>` : ''}` : o.requires?.exam ? '<span class="badge warn">' + t('app.compare.exam_audition') + '</span>' : '<span class="muted">' + t('app.compare.no_data') + '</span>'],
    [t('app.compare.row_commute'), o => { const c = campus(o.campus); return c ? esc(commute(c)) : '-'; }],
    [t('app.compare.row_type'), o => o.private ? `${t('app.compare.private')}${o.cost ? `<br><span class="small muted">${esc(o.cost)}</span>` : ''}` : t('app.compare.public')],
    [t('app.compare.row_next'), o => esc(o.next || '-')]];
}
function compareHtml() {
  const stars = (A.stars || []).filter(id => data.offers.some(o => o.id === id));
  const head = '<h2 id="porownanie">' + t('app.compare.title') + '</h2>';
  if (stars.length < 2) return `${head}<div class="card cmp"><p class="small muted">${stars.length ? t('app.compare.one_more') : t('app.compare.none')}</p></div>`;
  const ids = compareIds(A, data), offs = ids.map(id => data.offers.find(o => o.id === id)), rows = compareRows();
  const pick = stars.length > 2 ? `<p class="small muted">${t('app.compare.pick')}</p><div class="chips" role="group" aria-label="${t('app.compare.pick_aria')}">${stars.map(id => { const o = data.offers.find(x => x.id === id), on = ids.includes(id);
    return `<button class="chip" data-cmp="${esc(id)}" aria-pressed="${on}" ${!on && ids.length >= 3 ? 'disabled' : ''}>${esc(o.name)} <span class="muted">${esc(shortInst(o.institution))}</span></button>`; }).join('')}</div>` : '';
  const table = `<div class="cmp-table"><table><thead><tr><td></td>${offs.map(o => `<th scope="col">${esc(o.name)}<br><span class="small muted">${esc(shortInst(o.institution))}</span></th>`).join('')}</tr></thead>
    <tbody>${rows.map(([l, f]) => `<tr><th scope="row">${l}</th>${offs.map(o => `<td>${f(o)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const cards = `<div class="cmp-cards" role="list">${offs.map(o => `<div class="cmp-card" role="listitem"><h3>${esc(o.name)}</h3><p class="small muted">${esc(shortInst(o.institution))}</p>
    <dl>${rows.map(([l, f]) => `<dt>${l}</dt><dd>${f(o)}</dd>`).join('')}</dl></div>`).join('')}</div>`;
  return `${head}<div class="card cmp">${pick}${table}${cards}${offs.length > 1 ? '<p class="small muted cmp-hint">' + t('app.compare.hint') + '</p>' : ''}</div>`;
}
function refreshCompare() { const w = document.getElementById('cmpwrap'); if (w) w.innerHTML = compareHtml(); }
function tapCompare(id) {
  const cur = compareIds(A, data), i = cur.indexOf(id);
  if (i >= 0) { if (cur.length <= 2) return; cur.splice(i, 1); } else if (cur.length < 3) cur.push(id);
  A.compare = cur; save(); refreshCompare();
  document.querySelector(`#cmpwrap [data-cmp="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
}

// ---- Droga przez studia: tram lines, next steps, places
function vPartPath() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), s = r.slots, lines = tramLines(r);
  const warn = lines.filter(l => !l.chk.reachable || l.chk.soft);
  const insts = [...new Set(lines.map(l => shortInst(l.o.institution)))].join(', ');
  const steps = [
    ['dek', t('app.date.declaration'), warn.length ? t('app.path.check_decl', { list: warn.map(l => `${l.quick ? 'S' : lines.indexOf(l) + 1} (${l.chk.soft ? t('app.path.add_ext', { w: l.chk.soft }) : l.chk.blocked[0] || t('app.path.matura_change')})`).join('; ') }) : t('app.path.check_decl_ok')],
    ['dni', t('app.date.open_days'), t('app.path.open_days', { insts: insts })],
    ['exp', t('app.path.date_exp'), t('app.path.exp', { text: s.best[0].card.experiment })],
    ['mat', t('app.date.matura'), t('app.path.matura')],
    ['rek', t('app.path.date_rec'), t('app.path.recruit')]
  ];
  A.checks = A.checks || {};
  const pins = [], seen = new Set();
  for (const l of lines) { const cp = campus(l.o.campus); if (cp && !seen.has(cp.id)) { seen.add(cp.id); pins.push({ cp, l }); } }
  return `${partHead(PARTS[2], t('app.path.lead'))}
    <div class="card trammap">${tramMapSvg(lines)}${tramLegend(lines)}</div>
    <div id="declwrap">${declarationHtml(r, 'report')}</div>
    <h2>${t('app.path.next_steps')}</h2><p class="small muted">${t('app.path.next_note')}</p>
    <ul class="checks">${steps.map(([k, d, t]) => `<li><label><input type="checkbox" data-check="${k}" ${A.checks[k] ? 'checked' : ''}><span><b>${d}</b> ${esc(t)}</span></label></li>`).join('')}</ul>
    <h2>${t('app.path.where')}</h2>
    <div class="places2">${pins.map(({ cp, l }) => `<div class="place"><span class="tno-b sm" style="background:${l.color}">${l.quick ? 'S' : lines.indexOf(l) + 1}</span><div><b>${esc(cp.name)}</b><br>
      <span class="small">${esc(cp.address)}</span><br><span class="small">${icon('tram', 'ico sm')} ${transit(cp)}</span><br><span class="small">${commute(cp)} · <a href="${routeUrl(cp)}" target="_blank" rel="noopener">${t('app.common.route_plan')}</a></span></div></div>`).join('')}</div>
    <p class="small muted">${data.transport ? t('app.path.transport', { asof: esc(data.transport.asOf), method: esc(data.transport.method) }) : ''}</p>
    <details class="card"><summary>${t('app.path.all_places', { n: data.campuses.length })}</summary><ul class="places">${[...data.campuses].sort((a, b) => a.name.localeCompare(b.name, 'pl')).map(c => `<li><b>${esc(c.name)}</b><br><span class="small">${esc(c.address)} · ${transit(c)} · ${commute(c)} · <a href="${routeUrl(c)}" target="_blank" rel="noopener">${t('app.common.route_plan')}</a></span></li>`).join('')}</ul></details>
    <div class="card"><h3>${t('app.path.germany_title')}</h3><p class="small">${t('app.path.germany')}</p></div>
    ${nextPart('w-droga')}`;
}

// ---- Przyszłość: the scenario pick, at the end. Shows only what matters in the chosen scenario.
const NEED = { wysoka: 3, 'średnia': 2, niska: 1 };
function vPartFuture() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), sc = data.scenarios.scenarios, my = sc.find(x => x.id === A.scenario);
  const opts = shownOptions(r).filter(o => !o.quick);
  let body = '<p class="lead center">' + t('app.future.lead') + '</p>';
  if (my) {
    const forces = data.scenarios.forces.filter(f => my.emphasis.includes(f.id));
    const ranked = [...opts].sort((a, b) => (NEED[b.c.card.robustness[my.id]] || 0) - (NEED[a.c.card.robustness[my.id]] || 0));
    const shownIds = new Set(opts.map(o => o.c.card.id));
    const extra = r.cards.filter(c => !shownIds.has(c.card.id) && c.card.robustness[my.id] === 'wysoka' && forces.some(f => f.id === c.card.force) && c.fit >= 55).slice(0, 3);
    const meter = v => `<span class="meter m${NEED[v] || 0}" aria-label="${t('app.future.need_aria', { v: esc(v) })}"><i></i><i></i><i></i></span>`;
    body = `<h2>${t('app.future.weighs')}</h2>
      <div class="forces">${forces.map((f, i) => `<div class="force hot rise" style="--i:${i}">${icon(FORCE_ICON[f.id], 'ico big')}<div><h3>${esc(f.name)}</h3><p class="small">${esc(f.text)}</p></div></div>`).join('')}</div>
      <h2>${t('app.future.your_options', { name: esc(my.name) })}</h2><p class="small muted">${t('app.future.options_note')}</p>
      <div class="needlist">${ranked.map((o, i) => `<div class="needrow rise" style="--i:${i}"><span class="tno-b sm" style="background:${o.color}">${o.no}</span><span class="nn">${esc(o.c.card.name)}${o.c.card.robustnessNote ? `<span class="small muted">${esc(o.c.card.robustnessNote)}</span>` : ''}</span>${meter(o.c.card.robustness[my.id])}</div>`).join('')}</div>
      ${extra.length ? `<h2>${t('app.future.extra')}</h2><div class="areas">${extra.map((c, i) => `<div class="area rise" style="--i:${i}"><span class="area-ico">${icon(c.card.cluster)}</span><div><h3>${esc(c.card.name)}</h3><p class="small">${esc(c.card.whoYouHelp)}</p><span class="small muted">${esc(c.band)}</span></div></div>`).join('')}</div>` : ''}`;
  }
  return `${partHead(PARTS[3], t('app.future.lead_part'))}
    <div class="scen">${sc.map((x, i) => `<button class="scencard rise" style="--i:${i}" data-set="scenario" data-val="${x.id}" aria-pressed="${A.scenario === x.id}">
      ${scenArt(x.id)}<b>${esc(x.name)}</b><span class="small">${esc(x.text)}</span>${A.scenario === x.id ? '<span class="badge">' + t('app.scenarios.main_badge') + '</span>' : ''}</button>`).join('')}</div>
    ${body}
    ${nextPart('w-przyszlosc')}`;
}

// ---- Twój plik
function vPartFile() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), doubt = data.questions.doubts.find(d => d.id === A.doubt);
  return `${partHead(PARTS[4], t('app.file.lead'))}
    ${changesSince(r)}
    <div class="actions"><button class="btn" data-export="download">${t('app.file.download')}</button><button class="btn ghost" data-export="copy">${t('app.file.copy')}</button>
      <button class="btn ghost" data-export="print">${t('app.file.print')}</button><button class="btn ghost" data-go="wyniki">${t('app.file.full_report')}</button></div>
    <p id="msg" class="small muted" role="status"></p>
    <div class="card loadcard"><h3>${t('app.file.older')}</h3><label class="btn ghost filebtn">${t('app.file.load_md')}<input type="file" accept=".md,text/markdown,text/plain" data-load></label></div>
    ${doubt ? `<div class="card"><h3>${t('app.doubt.worry')}</h3><p>${doubt.card}</p>${A.doubtStrong ? '<p class="notice">' + t('app.doubt.help') + '</p>' : ''}</div>` : ''}
    <details class="card"><summary>${t('app.parent.title')}</summary><ul>
      <li>${t('app.parent.ask')}</li>
      <li>${t('app.parent.evidence')}</li>
      <li>${t('app.parent.siblings')}</li>
      <li>${t('app.parent.step')}</li></ul></details>
    <div class="actions"><button class="btn ghost" data-go="pewnosc">${t('app.file.change_answers')}</button></div>
    ${nextPart('w-plik')}`;
}

// ---- results story (story.js renders; app.js provides data and helpers)
function makeStoryCtx() {
  const ctx = {
    data, A, esc, icon, scenArt, FORCE_ICON, wrap, tspans, shortInst, campus, transit, commute, routeUrl, confLine,
    today: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }),
    rescore: () => scoreAll(A, data),
    proven: () => provenStrengths(A),
    options: r => shownOptions(r),
    strengthName: id => nameOf(id), proofText,
    dimName: d => data.dimensions.interests.find(x => x.id === d)?.name || d,
    valueName: v => data.dimensions.values.find(x => x.id === v)?.name || v,
    tramLines: r => { const opts = shownOptions(r);
      return tramLines(r).map(l => { const o = opts.find(x => l.quick ? x.quick : (!x.quick && x.c === l.c)); return { ...l, no: o?.no || '?', color: o?.color || l.color }; }); },
    panelHtml: o => panelHtml(o),
    planHtml: () => planHtml(ctx.r),
    touch: () => save(),
    studyHtml: id => studyHtml(id),
    declHtml: () => declarationHtml(ctx.r, 'story'),
    cmpHtml: () => compareHtml(),
    candoChips: () => candoChips(),
    transportNote: () => data.transport ? t('app.path.transport', { asof: esc(data.transport.asOf), method: esc(data.transport.method) }) : '',
    changes: () => changesSince(ctx.r),
    doubtHtml: () => { const d = data.questions.doubts.find(x => x.id === A.doubt);
      return d ? `<div class="pcard"><h3>${t('app.doubt.worry')}</h3><p>${d.card}</p>${A.doubtStrong ? '<p class="small">' + t('app.doubt.help') + '</p>' : ''}</div>` : ''; }
  };
  ctx.r = scoreAll(A, data);
  return ctx;
}
// Shown instead of the results while the two things the compass needs are still missing.
function vGate() {
  const rows = [
    ['mocne', t('app.gate.strengths'), provenStrengths(A).length >= 1, true],
    ['wartosci', t('app.gate.values'), A.values.length > 0, true],
    ['zajecia', t('app.gate.sort'), Object.keys(A.sort).length >= 12, false],
    ['sytuacje', t('app.gate.situations'), Object.keys(A.situations).length >= 3, false],
    ['matura', t('app.gate.matura'), A.rozszerzenia.length > 0, false]];
  return `<div class="gate"><span class="kicker2">${t('app.gate.kicker')}</span><h1>${t('app.gate.title')}</h1>
    <p class="lead">${t('app.gate.lead')}</p>
    <ul class="gatelist">${rows.map(([go, label, ok, must]) => `<li class="${ok ? 'ok' : must ? 'must' : ''}"><span class="rno">${ok ? TICK : ''}</span><span>${label}${must ? '' : ' <span class="muted small">' + t('app.gate.optional') + '</span>'}</span>${ok ? '' : `<button class="btn ${must ? '' : 'ghost'} small-btn" data-go="${go}">${must ? t('app.gate.complete') : t('app.gate.add')}</button>`}</li>`).join('')}</ul>
    <div class="actions"><button class="btn ghost" data-go="${A.certainty ? 'mocne' : 'pewnosc'}">${t('app.gate.back')}</button></div></div>`;
}
function vStory() {
  if (needResults()) return vGate();
  storyCtx = makeStoryCtx();
  return storyHtml(storyCtx);
}

// "Twój plan": he picks the option to check first and ticks off small dated steps; both go into his file.
function planHtml(r) {
  const opts = shownOptions(r), focus = planFocus(r.slots, A);
  if (!focus) return '';
  const cur = opts.find(o => o.key === focus.key) || opts[0], f = focus.o?.offer;
  const items = planItems(focus, data), key = it => `plan:${focus.key}:${it.id}`;
  const done = items.filter(it => A.checks?.[key(it)]).length;
  return `<span class="kicker">${t('app.plan.kicker')}</span><h2>${t('app.plan.title')}</h2>
    <p class="lead">${t('app.plan.lead')}</p>
    <div class="plan">
      <div class="plan-pick"><h3>${t('app.plan.pick')}</h3>
        <div class="plan-opts" role="radiogroup" aria-label="${t('app.plan.pick_aria')}">${opts.map(o => `<button role="radio" class="eitem" data-planfocus="${esc(o.key)}" aria-checked="${o.key === focus.key}" style="--c:${o.color}"><span class="nb" style="background:${o.color}">${o.no}</span><span><b>${esc(o.quick ? t('app.slot.quick') : o.c.card.name)}</b><span class="small muted">${esc(o.quick ? o.quick.offer.name : o.slot)}</span></span></button>`).join('')}</div>
        <p class="small muted">${t('app.plan.not_decision')}</p></div>
      <div class="plan-list" style="--c:${cur.color}"><span class="kicker" style="color:${cur.color}">${t('app.plan.first')}</span><h3>${esc(focus.quick ? f.name : focus.c.card.name)}</h3>
        ${f ? `<p class="small muted">${icon('school', 'ico sm')} ${esc(f.name)}, ${esc(shortInst(f.institution))} · ${plural(f.durationYears, 'app.years', { n: String(f.durationYears).replace('.', ',') })}</p>` : ''}
        <ul class="plan-items">${items.map(it => `<li class="${it.warn ? 'warn' : ''}"><label><input type="checkbox" data-check="${esc(key(it))}" ${A.checks?.[key(it)] ? 'checked' : ''}><span><span class="when">${esc(it.when)}</span>${esc(it.text)}${it.url ? ` <a href="${esc(it.url)}" target="_blank" rel="noopener">${t('app.plan.open')}</a>` : ''}</span></label></li>`).join('')}</ul>
        <p class="small muted plan-n" aria-live="polite">${t('app.plan.done', { n: done, m: items.length })}</p></div>
    </div>`;
}

const studyHint = () => `<h4>${t('app.card.in_krakow')}</h4><p class="small muted">${t('app.panel.study_hint')}</p>`;
// Details of one study, shown under the road only after he clicks it.
function studyHtml(id) {
  const r = storyCtx.r, q = r.slots.quick;
  const hit = q && q.o.offer.id === id ? q.o : r.cards.flatMap(c => c.offers).find(x => x.offer.id === id);
  return hit ? `<div class="sdet"><button class="sdet-x" data-study="${esc(id)}" aria-label="${t('app.study.close')}">×</button>${offerHtml(hit.offer, hit.check)}</div>` : '';
}

// One option in the explorer: its vertical road on the left, what it means on the right.
function panelHtml(o) {
  const c = o.c, k = c.card;
  if (o.quick) {
    const f = o.quick.offer;
    return `<div class="pgrid"><div class="proad vroad">${vRoadSvg(o)}<div class="studydetail" aria-live="polite"></div></div><div class="pinfo"><span class="kicker" style="color:${o.color}">${t('app.slot.quick')}</span><h3>${esc(f.name)}</h3>
      <p>${esc(f.institution)}. ${t('app.panel.first_job', { years: String(f.durationYears).replace('.', ',') })}${f.next ? ' ' + t('app.panel.then', { next: esc(f.next) }) : ''}</p>
      <p class="small muted">${t('app.panel.links', { name: esc(k.name) })}</p>${studyHint()}</div></div>`;
  }
  const reach = c.offers.filter(x => x.check.reachable), blocked = c.offers.filter(x => !x.check.reachable && !x.check.hidden);
  const src = k.demand && data.sources.find(x => x.id === k.demand.sourceId);
  const my = data.scenarios.scenarios.find(x => x.id === A.scenario);
  return `<div class="pgrid"><div class="proad vroad">${vRoadSvg(o)}<div class="studydetail" aria-live="polite"></div></div><div class="pinfo">
    <span class="kicker" style="color:${o.color}">${esc(o.slot)} · ${esc(c.band)}</span><h3>${esc(k.name)}</h3>
    <p>${esc(k.whoYouHelp)}</p><p class="small muted">${c.reasons.map(esc).join(' · ')}</p>
    <h4>${t('app.card.gives')}</h4><p>${esc(k.whatYouGet)}</p>
    ${k.pay ? `<h4>${t('app.card.pay')}</h4><p>${payHtml(k)}</p>` : ''}
    <h4>${t('app.card.day')}</h4><ul>${k.dayInLife.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
    <h4>${t('app.card.growth')}</h4><ol>${k.growth.map(g => `<li>${esc(g)}</li>`).join('')}</ol>
    <h4>${t('app.card.why')}</h4><p>${esc(k.whyNeeded)}</p>${k.demand ? `<p class="small muted">${t('app.card.demand', { text: esc(k.demand.text) })}${src ? ` <a href="${src.url}" target="_blank" rel="noopener">${t('app.common.source')}</a>` : ''}</p>` : ''}
    <p class="small">${my ? t('app.panel.need_mine', { name: esc(my.name), value: esc(k.robustness[my.id]) }) : t('app.panel.need_all', { list: data.scenarios.scenarios.map(x => `${esc(x.name)} ${esc(k.robustness[x.id])}`).join(' · ') })}</p>
    ${c.offers.length ? studyHint() : '<h4>' + t('app.card.in_krakow') + '</h4><p class="muted">' + t('app.card.no_study') + '</p>'}
    <h4>${t('app.panel.experiment')}</h4><p>${esc(k.experiment)}</p></div></div>`;
}

function confLine(c) {
  return `<p class="conf small">${t('app.conf.head', { level: c.level })} ${c.missing.length ? t('app.conf.low', { list: c.missing.map(esc).join(', ') }) : t('app.conf.full')}</p>`;
}

function vResults() {
  if (needResults()) return vGate();
  const r = scoreAll(A, data), s = r.slots, sc = A.scenario || 'B';
  const proven = provenStrengths(A).map(x => `<li><b>${esc(data.strengths.find(y => y.id === x.id).name)}</b><span class="proof">${esc(proofText(x.proof))}</span></li>`).join('');
  const quick = s.quick ? (() => { const o = s.quick.o.offer;
    return `<div class="card opt" data-card="quick"><span class="badge slot">${t('app.slot.quick')}</span><h3>${esc(o.name)}</h3>
      <p>${esc(o.institution)}. ${t('app.panel.first_job', { years: String(o.durationYears).replace('.', ',') })}${o.next ? ' ' + esc(o.next) + '.' : ''}</p>
      ${offerHtml(o, s.quick.o.check)}<p class="small muted">${t('app.results.linked', { name: esc(s.quick.c.card.name) })}</p></div>`; })() : '';

  // Map pins: the campuses of reachable offers in the shown slots.
  const shown = [...s.best, s.most, s.surprise].filter(Boolean);
  const pins = [], seen = new Set();
  for (const c of shown) for (const o of c.offers) {
    const cp = campus(o.offer.campus);
    if (seen.has(cp.id)) continue; seen.add(cp.id);
    pins.push({ c: cp, color: s.best.includes(c) ? 'var(--strong)' : 'var(--good)', label: `${o.offer.institution}` });
  }
  if (s.quick && !seen.has(s.quick.o.offer.campus)) pins.push({ c: campus(s.quick.o.offer.campus), color: 'var(--good)' });

  const doubt = data.questions.doubts.find(d => d.id === A.doubt);
  const twin = [...s.best, s.most, s.surprise].filter(Boolean).map(c => `<li>${c.paths.length ? c.paths.map(p => esc(p.label)).join(' + ') : t('app.path.own_interests')} → <b>${esc(c.card.name)}</b> → ${c.offers.filter(o => o.check.reachable).slice(0, 2).map(o => esc(o.offer.name + ', ' + o.offer.institution)).join('; ') || t('app.results.no_study')}</li>`).join('');

  return `
    <h1>${t('app.results.title')}</h1><p class="small muted noprint">${t('app.results.intro')}</p>
    ${changesSince(r)}
    <nav class="rmenu noprint" aria-label="${t('app.tabs.label')}"><button data-go="kompas">${t('app.tab.compass')}</button>${[['r-mocne', t('app.rmenu.strengths')], ['r-drogi', t('app.rmenu.roads')], ['r-opcje', t('app.rmenu.options')], ['porownanie', t('app.rmenu.compare')], ['deklaracja', t('app.rmenu.declaration')], ['r-linie', t('app.rmenu.lines')], ['r-miejsca', t('app.rmenu.places')], ['r-plik', t('app.rmenu.file')]].map(([id, t]) => `<button data-scroll="${id}">${t}</button>`).join('')}</nav>
    <h2 id="r-mocne">${t('app.results.strengths')}</h2><div class="card reveal screen-only"><ul>${proven}</ul></div>
    <section class="print-only cutouts"><p class="small">${t('app.results.cutouts')}</p><div class="cut">${provenStrengths(A).map(x => `<div class="cutcard"><b>${esc(data.strengths.find(y => y.id === x.id).name)}</b><span>${esc(proofText(x.proof))}</span></div>`).join('')}</div></section>
    <h2 id="r-drogi">${t('app.results.roads')}</h2>
    <p class="muted small">${t('app.results.roads_note')}</p>
    <p class="small noprint">${t('app.results.pick_map')}</p>
    <div class="chips maprows noprint">${[...s.best, s.most, s.surprise].filter(Boolean).map((c, i) => `<button class="chip" data-maprow="${i}" aria-pressed="false">${esc(c.card.name)}</button>`).join('')}</div>
    <div class="card pathmap"><div class="scroll" tabindex="0" aria-label="${t('app.results.map_aria')}">${pathMapSvg(r)}</div>
      <p class="small muted hint">${t('app.results.map_hint')}</p>
      <div class="studies small" aria-live="polite"></div>
      <details class="twin noprint"><summary>${t('app.results.map_text')}</summary><ul>${twin}</ul></details></div>

    <h2 class="pb" id="r-opcje">${t('app.results.options')}</h2>
    <p class="muted small">${t('app.results.options_note', { most: term('most', t('app.term.bridge')), quick: term('szybki', t('app.term.quick')), surprise: term('niespodzianka', t('app.term.surprise')) })}</p>
    ${confLine(r.profile.confidence)}
    ${s.best.map((c, i) => cardHtml(t('app.slot.best'), c, i === 0, sc)).join('')}
    ${s.most ? cardHtml(t('app.slot.bridge'), s.most, false, sc) : ''}
    ${quick}
    ${s.surprise ? cardHtml(t('app.slot.surprise'), s.surprise, false, sc) : ''}
    ${s.rest.length ? `<details class="card"><summary>${t('app.results.more', { n: s.rest.length })}</summary>${s.rest.map(c => cardHtml(t('app.slot.other'), c, false, sc)).join('')}</details>` : ''}

    <div id="cmpwrap">${compareHtml()}</div>
    <div id="declwrap">${declarationHtml(r, 'report')}</div>
    <h2 id="r-linie">${t('app.results.lines')}</h2>
    <p class="muted small">${t('app.results.lines_note')}</p>
    <div class="card trammap">${tramMapSvg(tramLines(r))}${tramLegend(tramLines(r))}</div>

    <h2 id="r-miejsca">${t('app.path.where')}</h2>
    <div class="card"><ul class="places">${pins.map(p => `<li><b>${esc(p.c.name)}</b><br><span class="small">${esc(p.c.address)} · ${transit(p.c)} · ${commute(p.c)} · <a href="${routeUrl(p.c)}" target="_blank" rel="noopener">${t('app.common.route_plan')}</a></span></li>`).join('')}</ul>
      <p class="small muted">${data.transport ? t('app.results.transport', { asof: esc(data.transport.asOf), method: esc(data.transport.method) }) : t('app.results.no_times')}</p></div>
    <details class="card allplaces"><summary>${t('app.path.all_places', { n: data.campuses.length })}</summary><ul class="places">${[...data.campuses].sort((a, b) => a.name.localeCompare(b.name, 'pl')).map(c => `<li><b>${esc(c.name)}</b>${c.status === 'do sprawdzenia' ? ' <span class="badge warn">' + t('app.results.addr_check') + '</span>' : ''}<br><span class="small">${esc(c.address)} · ${transit(c)} · ${commute(c)} · <a href="${routeUrl(c)}" target="_blank" rel="noopener">${t('app.common.route_plan')}</a></span></li>`).join('')}</ul></details>

    <div class="card"><h3>${t('app.path.germany_title')}</h3>
      <p>${t('app.results.germany')}</p></div>

    ${doubt ? `<div class="card"><h3>${t('app.doubt.worry')}</h3><p>${doubt.card}</p>
      ${A.doubtStrong ? '<p class="notice">' + t('app.doubt.help_long') + '</p>' : ''}</div>` : ''}

    <h2>${t('app.cando.title')}</h2>
    <label class="field" for="cando">${t('app.cando.label')}</label>
    ${candoChips()}<input id="cando" type="text" data-field="canDo" value="${esc(A.canDo)}">

    <h2 id="r-plik">${t('app.results.file')}</h2>
    <p>${t('app.results.file_note')}</p>
    <div class="actions">
      <button class="btn" data-export="download">${t('app.file.download')}</button>
      <button class="btn ghost" data-export="copy">${t('app.file.copy')}</button>
      <button class="btn ghost" data-export="print">${t('app.file.print')}</button>
    </div>
    <p id="msg" class="small muted" role="status"></p>

    <details class="card"><summary>${t('app.parent.title')}</summary><ul>
      <li>${t('app.parent.ask')}</li>
      <li>${t('app.parent.evidence')}</li>
      <li>${t('app.parent.siblings')}</li>
      <li>${t('app.parent.step')}</li>
      <li>${t('app.parent.if_strong')}</li></ul></details>
    <div class="actions noprint"><button class="btn ghost" data-go="pewnosc">${t('app.file.change_answers')}</button></div>`;
}

// ---- events -----------------------------------------------------------------
// Path map selection: highlight one option's roads, fade the rest. Tapping it again shows all.
let mapSel = null;
function selectRow(i) {
  mapSel = mapSel === i ? null : i;
  const svg = $app.querySelector('.pathmap svg');
  if (!svg) return;
  svg.classList.toggle('sel', mapSel !== null);
  const stop = svg.querySelector(`.stop[data-maprow="${mapSel}"]`);
  if (stop) svg.style.setProperty('--selc', stop.dataset.color);
  svg.querySelectorAll('.seg, .node').forEach(el => el.classList.toggle('on', mapSel !== null && el.classList.contains('r' + mapSel)));
  $app.querySelectorAll('.maprows .chip').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.maprow) === mapSel)));
  // Bring the studies column into view (on a phone the map scrolls sideways).
  const sc = $app.querySelector('.pathmap .scroll');
  if (sc && mapSel !== null) sc.scrollTo({ left: sc.scrollWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const list = $app.querySelector('.pathmap .studies');
  if (list) {
    const names = mapSel === null ? [] : [...svg.querySelectorAll('.study.on .lbl')].map(t => [...t.querySelectorAll('tspan')].map(x => x.textContent).join(', '));
    list.innerHTML = names.length ? `<b>${t('app.map.studies')}</b><ul>${names.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '';
  }
}
document.addEventListener('keydown', e => {
  if (current().id === 'zajecia' && A.sortPos < data.questions.activities.length && !e.target.closest('input, textarea')) {
    const v = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 0 }[e.key];
    if (v !== undefined) { e.preventDefault(); sortAnswer(v); return; }
  }
  const g = e.target.closest && e.target.closest('[data-maprow]');
  if (g && g.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectRow(Number(g.dataset.maprow)); return; }
  // Enter moves on when nothing else has the focus (the page itself, not a field or a button).
  if (e.key === 'Enter' && document.body.classList.contains('in-q') && !e.target.closest('input, textarea, button, a, summary, select, [role="button"]')) {
    const next = $app.querySelector('.nav .btn:not(.ghost):not(:disabled)');
    if (next) { e.preventDefault(); next.click(); }
  }
});
document.addEventListener('click', e => {
  const g = e.target.closest('[data-maprow]');
  if (g) { selectRow(Number(g.dataset.maprow)); return; }
  if (current().id === 'kompas' && storyCtx) {
    const st = e.target.closest('[data-jump],[data-explore],[data-pin],[data-pickopt],[data-scen],[data-study],[data-planfocus]');
    if (st && storyClick(st, $app, storyCtx)) { e.preventDefault(); return; }
  }
  const t = e.target.closest('button');
  if (!t) return;
  const d = t.dataset;
  if (d.uilang !== undefined) { switchLang(d.uilang); return; }
  if (d.skintoggle !== undefined) { skin = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length]; applySkin(true); return; }
  if (d.skinpick !== undefined) { skin = d.skinpick || null; applySkin(true); return; }
  const tk = ['set', 'toggle', 'value', 'strength', 'lang', 'sector', 'sport', 'idea'].find(k => d[k] !== undefined);
  if (tk) tapSel = `[data-${tk}="${CSS.escape(d[tk])}"]` + (d.val !== undefined ? `[data-val="${CSS.escape(d.val)}"]` : '');
  if (d.themetoggle !== undefined) { const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; theme = dark ? 'light' : 'dark'; applyTheme(); return; }
  if (d.term !== undefined) { const open = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', String(open)); t.nextElementSibling.hidden = !open; return; }
  if (d.go) { location.hash = '#/' + d.go; return; }
  if (d.scroll) { document.getElementById(d.scroll)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
  if (d.sector !== undefined) { sectorSel = sectorSel === d.sector ? null : d.sector; render();
    if (sectorSel) setTimeout(() => document.getElementById('sec-' + sectorSel)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: d.from === 'force' ? 'start' : 'nearest' }), 30);
    return; }
  if (d.area !== undefined) { areaFilter = d.area || null; render(); return; }
  if (d.pick !== undefined) { pickDirection(d.pick, Number(t.dataset.ang)); return; }
  if (d.goopt) { kierSel = d.goopt; location.hash = '#/w-kierunki'; return; }
  if (d.kier) { kierSel = d.kier; render(); return; }
  if (d.star) { toggleStar(d.star); return; }
  if (d.cmp) { tapCompare(d.cmp); return; }
  if (d.cando !== undefined) { tapCando(d.cando); return; }
  if (d.flip !== undefined) { t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true')); return; }
  if (d.set) { // startMin is a number and is never cleared (an empty base would make the commute times start at 0)
    if (d.set === 'startMin') { setA('startMin', Number(d.val)); return; }
    setA(d.set, A[d.set] === d.val && d.set !== 'certainty' && d.set !== 'studyLength' ? null : d.val); return; }
  if (d.sport) { tapSport(d.sport); return; }
  if (d.idea) { tapIdea(d.idea, d.val); return; }
  if (d.reproof) { const s = A.strengths.find(x => x.id === d.reproof); if (s) s.proof = ''; focusSel = `[data-where^="${CSS.escape(d.reproof)}|"]`; save(); render(); return; }
  if (d.toggle) { const arr = A[d.toggle]; const i = arr.indexOf(d.val); i >= 0 ? arr.splice(i, 1) : arr.push(d.val); save(); render(); return; }
  if (d.lang) { A.jezyki[d.lang] = d.val; save(); render(); return; }
  if (d.sortans !== undefined) { sortAnswer(Number(d.sortans)); return; }
  if (d.sitans !== undefined) { const q = data.questions.situations[A.sitPos]; if (d.sitans) A.situations[q.id] = d.sitans; else delete A.situations[q.id]; A.sitPos++; render(); return; }
  if (d.sitback !== undefined) { A.sitPos = Math.max(0, A.sitPos - 1); render(); return; }
  if (d.sitreset !== undefined) { A.sitPos = 0; render(); return; }
  if (d.sortback !== undefined) { A.sortPos = Math.max(0, A.sortPos - 1); save(); render(); return; }
  if (d.sortreset !== undefined) { A.sortPos = 0; save(); render(); return; }
  if (d.value) { const i = A.values.indexOf(d.value); if (i >= 0) A.values.splice(i, 1); else if (A.values.length < 5) A.values.push(d.value); save(); render(); return; }
  if (d.where) { const [id, w] = d.where.split('|'), s = A.strengths.find(x => x.id === id); if (s) s.proof = s.proof === w ? '' : w; save(); render(); return; }
  if (d.strength) { const i = A.strengths.findIndex(s => s.id === d.strength); if (i >= 0) A.strengths.splice(i, 1); else if (A.strengths.length < 5) A.strengths.push({ id: d.strength, proof: '' }); save(); render(); return; }
  if (d.strong !== undefined) { setA('doubtStrong', d.strong === '1'); return; }
  if (d.persona) { const p = data.personas.find(x => x.id === d.persona); A = Object.assign(blank(), structuredClone(p.answers), { sortPos: data.questions.activities.length, sitPos: data.questions.situations.length }); furthest = screens.length; save(); location.hash = '#/kompas'; render(); return; }
  if (d.export) doExport(d.export);
});

document.addEventListener('change', e => {
  if (!e.target.matches('[data-check]')) return;
  A.checks = A.checks || {}; A.checks[e.target.dataset.check] = e.target.checked; save();
  const list = e.target.closest('.plan-list'), n = list?.querySelector('.plan-n');
  if (n) n.textContent = t('app.plan.done', { n: list.querySelectorAll('input:checked').length, m: list.querySelectorAll('input[data-check]').length });
});

// Compass: turn the needle to the picked direction and show a preview below; the compass itself stays.
function pickDirection(key, ang) {
  compassSel = key || null;
  const needle = $app.querySelector('.needle-big'), prev = $app.querySelector('#cprev');
  if (!needle || !prev) { render(); return; }
  const r = scoreAll(A, data);
  needle.classList.toggle('fixed', !!compassSel);
  needle.style.transform = compassSel ? `rotate(${isNaN(ang) ? selAngle(r.slots) : ang}deg)` : '';
  $app.querySelectorAll('.cdir').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pick === compassSel)));
  prev.innerHTML = compassSel ? previewHtml(r, compassSel) : '<p class="clead">' + t('app.compass.lead') + '</p>';
  if (compassSel) setTimeout(() => prev.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' }), 60);
}

document.addEventListener('change', async e => {
  if (!e.target.matches('[data-load]')) return;
  const f = e.target.files && e.target.files[0];
  if (f) loadFile(await f.text());
  e.target.value = '';
});

// "Wczytaj poprzedni wynik": restore answers from the JSON block at the end of an exported file.
function loadFile(text) {
  const obj = parseSaved(text);
  if (!obj || !obj.answers || !String(obj.app || '').startsWith('kompas-studia')) {
    notice = t('app.file.not_kompas'); render(); return;
  }
  const a = Object.assign(blank(), obj.answers), missing = [];
  if (obj.answers.lang) { setLang(obj.answers.lang); a.lang = getLang(); applyStatic(); applyTheme(); applySkin(); } // loading keeps the saved language
  else a.lang = getLang();
  const has = (list, id) => list.some(x => x.id === id);
  a.strengths = (a.strengths || []).filter(x => has(data.strengths, x.id) || (missing.push(t('app.file.missing_strength', { id: x.id })), false));
  a.values = (a.values || []).filter(v => has(data.dimensions.values, v) || (missing.push(t('app.file.missing_value', { id: v })), false));
  for (const k of Object.keys(a.sort || {})) if (!has(data.questions.activities, k)) { delete a.sort[k]; missing.push(t('app.file.missing_activity', { id: k })); }
  for (const k of Object.keys(a.situations || {})) if (!has(data.questions.situations, k)) { delete a.situations[k]; missing.push(t('app.file.missing_situation', { id: k })); }
  a.stars = (Array.isArray(a.stars) ? a.stars : []).filter(id => has(data.offers, id) || (missing.push(t('app.file.missing_star', { id: id })), false));
  a.compare = (Array.isArray(a.compare) ? a.compare : []).filter(id => a.stars.includes(id));
  if (a.direction && !has(data.opportunities, a.direction)) { missing.push(t('app.file.missing_direction', { id: a.direction })); a.direction = null; }
  const snap = obj.snapshot || null;
  if (snap) for (const id of [...(snap.best || []), snap.most, snap.surprise].filter(Boolean)) if (!has(data.opportunities, id)) missing.push(t('app.file.missing_option', { id: id }));
  a.sortPos = Object.keys(a.sort).length >= data.questions.activities.length ? data.questions.activities.length : Object.keys(a.sort).length;
  // Cards added in a later version (e.g. a24 in 2.4): the file has answers for all older cards, so "Co lubisz robić" asks only the new ones.
  const newActs = data.questions.activities.filter(x => !(x.id in a.sort)).length;
  const newSits = (data.questions.situations || []).filter(x => !(x.id in (a.situations || {}))).length;
  const oldFile = Object.keys(a.sort).length >= 20; // a finished file from an older version, not a half-done one
  const newNote = oldFile && (newActs || newSits) ? ` ${t('app.file.new_since', { list: [newActs && plural(newActs, 'app.file.new_cards'), newSits && plural(newSits, 'app.file.new_sits')].filter(Boolean).join(` ${t('app.file.and')} `) })}` : '';
  a.sitPos = Object.keys(a.situations).length;
  A = a;
  prevFile = { date: obj.date, snapshot: snap, missing };
  notice = t('app.file.loaded', { date: esc(obj.date || '?') }) + (missing.length ? ` ${t('app.file.missing', { list: missing.map(esc).join(', ') })}` : '') + newNote;
  drawOnce = true;
  savedSnap = answersKey();
  const done = provenStrengths(A).length && A.values.length;
  const target = '#/' + (screens.some(x => x.id === A.lastScreen) ? A.lastScreen : done ? 'kompas' : 'pewnosc');
  furthest = done ? screens.length : screens.findIndex(x => '#/' + x.id === target);
  notice += ` ${t('app.file.back_to')}`;
  if (location.hash === target) render(); else location.hash = target;
}

document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.field) { A[d.field] = d.field === 'startMin' ? Number(t.value) : t.value; save(); if (t.id === 'name' || t.id === 'cando') return; }
  if (d.slider) { A.sliders[d.slider] = Number(t.value); save(); return; }
  if (d.proof) { const s = A.strengths.find(x => x.id === d.proof); s.proof = t.value; save();
    t.closest('.strength')?.querySelectorAll('[data-where]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    const ok = provenStrengths(A).length === 5; const next = $app.querySelector('.nav .btn:not(.ghost)'); if (next) next.disabled = !ok;
    const h = document.getElementById('navhint'); if (h) h.textContent = ok ? '' : current().hint(); return; }
  if (d.refl) { A.reflection[d.refl] = t.value; save(); return; }
  if (d.sportx !== undefined) { setSport(sportParts().on, t.value); save(); }
});

async function doExport(kind) {
  const r = scoreAll(A, data), md = buildMarkdown(A, r, data, today());
  const msg = document.getElementById('msg') || document.getElementById('fmsg');
  if (kind === 'download') {
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    const name = fileName(A, stamp());
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (msg) msg.textContent = t('app.file.saved');
    savedSnap = answersKey(); updateSaveState();
    toast(t('app.file.saved_toast', { name: esc(name) }));
  } else if (kind === 'copy') {
    try { await navigator.clipboard.writeText(md); msg.textContent = t('app.file.copied'); } catch { msg.textContent = t('app.file.copy_failed'); }
  } else {
    if (current().id !== 'wyniki') { location.hash = '#/wyniki'; setTimeout(() => doExport('print'), 500); return; }
    const closed = [...document.querySelectorAll('details:not([open])')];
    closed.forEach(d => d.open = true);
    window.print();
    closed.forEach(d => d.open = false);
  }
}

load().catch(err => { $app.innerHTML = `<p>Nie udało się wczytać danych (${esc(err.message)}). Odśwież stronę.</p>`; });
