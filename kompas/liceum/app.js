// Kompas Liceum v1.8.2. Screens, soft school self-assessment, results and export. Kraków only; sciences and IT first.
import { provenStrengths } from '../core/scoring.js';
import { parseSaved } from '../core/export.js';
import { visibleActivities, profilesFor, scoreLiceum, examPoints, certificatePoints, scoredSubjects, shortlist, levers, effectivePoints, LEVEL_TXT, CHANCE_TXT, SUBJECT_NAME, checkClass } from './points.js';
import { icon } from '../studia/icons.js';
import { LILLUS } from './illus.js';
import { ILLUS } from '../studia/illus.js';

const $app = document.getElementById('app');
const TEST = new URLSearchParams(location.search).has('test');
let data, A, studiaOffers = [];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const f1 = n => Number(n).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f2 = n => Number(n).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const blank = () => ({ name: '', sort: {}, sortPos: 0, situations: {}, sitPos: 0, sliders: {}, values: [], strengths: [],
  points: { mode: 'soft', soft: { exam: {}, grades: {} }, exam: {}, grades: {}, stripe: false, volunteering: false, achievements: 0 }, area: null, checks: {}, reflection: {}, worlds: [], profile: null, likes: { profiles: [], schools: [], classes: [] } });

async function load() {
  const get = p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  const [dimensions, strengths, config, questions, opportunities, schools, sources, personas, profiles] = await Promise.all([
    '../core/dimensions.json', '../core/strengths.json', 'data/config.json', 'data/questions.json', 'data/opportunities.json',
    'data/db/pl/krakow/schools.json', 'data/sources.json', 'data/personas.json', 'data/profiles.json'].map(get));
  data = { dimensions, strengths, config, questions, opportunities, schools, sources, personas, profiles };
  // Studia programmes, to show what each area leads to after liceum (optional).
  studiaOffers = await fetch('../studia/data/db/pl/krakow/offers.json').then(r => (r.ok ? r.json() : [])).catch(() => []);
  A = blank();
  applyTheme(); applySkin();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  window.addEventListener('hashchange', render);
  render();
}

// ---- state, theme, skin -------------------------------------------------------------------------------------------
const answersKey = () => JSON.stringify({ ...A, sortPos: undefined, sitPos: undefined });
let savedSnap = null, notice = '', theme = null;
const SKINS = ['neon', 'pop', null], SKIN_NAME = { null: 'Spokojny', neon: 'Neon', pop: 'Pop art' };
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
  document.querySelectorAll('[data-themetoggle]').forEach(b => { b.setAttribute('aria-label', dark ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'); b.innerHTML = b.classList.contains('linkbtn') ? (dark ? 'Jasny motyw' : 'Ciemny motyw') : dark ? ICON.sun : ICON.moon; });
}
function applySkin(animate) {
  const root = document.documentElement;
  if (skin) root.dataset.skin = skin; else delete root.dataset.skin;
  const next = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length];
  document.querySelectorAll('[data-skintoggle]').forEach(b => { b.setAttribute('aria-pressed', String(!!skin)); b.setAttribute('aria-label', `Wygląd: ${SKIN_NAME[skin]}. Zmień na: ${SKIN_NAME[next]}`); b.innerHTML = ICON.palette; });
  document.querySelectorAll('[data-skinpick]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.skinpick || null) === skin)));
  const u = new URL(location.href);
  if (skin === 'neon') u.searchParams.delete('skin'); else u.searchParams.set('skin', skin || 'calm');
  history.replaceState(null, '', u);
  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('skin-in'); void root.offsetWidth; root.classList.add('skin-in');
    clearTimeout(applySkin.h); applySkin.h = setTimeout(() => root.classList.remove('skin-in'), 700);
  }
}

// ---- screens ------------------------------------------------------------------------------------------------------
const acts = () => visibleActivities(A, data);
const syncSort = () => { const v = acts(), i = v.findIndex(x => !(x.id in A.sort)); A.sortPos = i < 0 ? v.length : i; };
const chip = (attrs, label, on) => `<button class="chip" ${attrs} aria-pressed="${on ? 'true' : 'false'}">${label}</button>`;
const nameOf = id => (data.strengths.find(s => s.id === id) || {}).name || id;
const screens = [
  { id: 'start', ch: null, view: vStart },
  { id: 'swiaty', ch: 'ja', view: vWorlds, ok: () => (A.worlds || []).length > 0, hint: () => 'Wybierz co najmniej jeden świat albo „wszystko po trochu”' },
  { id: 'zajecia', ch: 'ja', view: vSort, ok: () => A.sortPos >= acts().length, hint: () => `Zostało kart: ${acts().length - A.sortPos}` },
  { id: 'sytuacje', ch: 'ja', view: vSituations },
  { id: 'styl', ch: 'ja', view: vStyle },
  { id: 'wartosci', ch: 'ja', view: vValues, ok: () => A.values.length === 3, hint: () => `Wybierz jeszcze ${3 - A.values.length}` },
  { id: 'mocne', ch: 'ja', view: vStrengths, ok: () => provenStrengths(A).length === 3,
    hint: () => A.strengths.length < 3 ? `Wybierz jeszcze ${3 - A.strengths.length}` : `Zaznacz, gdzie to widać: ${A.strengths.filter(x => !x.proof.trim()).map(x => nameOf(x.id)).join(', ')}` },
  { id: 'szkola', ch: 'szkola', view: vSchool },
  { id: 'wyniki', ch: 'wyniki', view: vKompas },
  { id: 'profil', ch: 'wyniki', view: vProfile },
  { id: 'lista', ch: 'lista', view: vList },
  { id: 'szkoly', ch: 'szkoly', view: vSchools }
];
const STEP_TITLE = { swiaty: 'Twoje światy', zajecia: 'Co lubisz robić', sytuacje: 'Co robisz, gdy…', styl: 'Styl pracy', wartosci: 'Co jest ważne', mocne: 'Mocne strony', szkola: 'Jak ci idzie w szkole' };
const current = () => screens.find(s => s.id === ((location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'start')) || screens[0];
const hasWorlds = () => !Array.isArray(A.worlds) || A.worlds.length > 0;
const needResults = () => !(hasWorlds() && A.sortPos >= acts().length && A.values.length === 3 && provenStrengths(A).length === 3);

let lastProg = { ch: null, w: 0 };
function render() {
  const s = current(), i = screens.indexOf(s);
  document.querySelectorAll('.chapters [data-ch]').forEach(el => { el.classList.toggle('on', el.dataset.ch === s.ch); el.setAttribute('aria-current', el.dataset.ch === s.ch ? 'step' : 'false'); });
  const inQ = s.ch === 'ja' || s.ch === 'szkola';
  const list = screens.filter(x => x.ch === 'ja' || x.ch === 'szkola');
  const idx = list.indexOf(s);
  const blocked = !!(s.ok && !s.ok());
  const nav = !inQ ? '' : `<div class="nav"><button class="btn ghost" data-go="${screens[i - 1].id}">Wstecz</button>
    <p class="navhint" id="navhint" role="status">${blocked && s.hint ? esc(s.hint()) : s.id === 'szkola' ? 'Ten krok możesz pominąć' : ''}</p>
    <button class="btn" data-go="${screens[i + 1].id}" ${blocked ? 'disabled' : ''} aria-describedby="navhint">${s.id === 'szkola' ? 'Pokaż kompas' : 'Dalej'}</button></div>`;
  const progW = Math.round(100 * (idx + 1) / list.length), progFrom = inQ && lastProg.ch === 'q' ? lastProg.w : 0;
  lastProg = inQ ? { ch: 'q', w: progW } : { ch: null, w: 0 };
  const crumb = inQ ? `<p class="crumb2"><b>${STEP_TITLE[s.id]}</b> · krok ${idx + 1} z ${list.length}</p><div class="prog2" aria-hidden="true"><i style="width:${progFrom}%" data-to="${progW}"></i></div>` : '';
  const note = notice ? `<p class="notice" role="status">${notice}</p>` : ''; notice = '';
  if ((s.id === 'wyniki' || s.id === 'profil') && needResults()) { $app.innerHTML = vGate(); document.body.classList.remove('wide'); $app.dataset.screen = 'gate'; applySkin(); return; }
  const keep = document.activeElement && document.activeElement.id, changed = $app.dataset.screen !== s.id;
  const prevIdx = screens.findIndex(x => x.id === $app.dataset.screen);
  const dir = !changed ? '' : prevIdx > i ? 'slide-b' : 'slide-f';
  document.body.classList.toggle('wide', ['wyniki', 'profil', 'szkoly', 'lista'].includes(s.id));
  if (mapObj) { mapObj.remove(); mapObj = null; }
  mapEntries = null;
  $app.innerHTML = `<div class="qmain ${dir}">${crumb}${note}${s.view()}${nav}</div>`;
  $app.dataset.screen = s.id; $app.classList.toggle('still', !changed); save(); applySkin(); likeCount();
  const pi = $app.querySelector('.prog2 i[data-to]');
  if (pi) requestAnimationFrame(() => requestAnimationFrame(() => { pi.style.width = pi.dataset.to + '%'; }));
  if (changed) { const b = document.querySelector('.brand'); if (b) { b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); } }
  if (changed) { window.scrollTo(0, 0); $app.focus({ preventScroll: true }); }
  else if (keep && document.getElementById(keep)) { const el = document.getElementById(keep); el.focus(); if (el.setSelectionRange && el.value && el.type === 'text') el.setSelectionRange(el.value.length, el.value.length); }
  if (s.id === 'szkola') liveUpdate();
  if (mapEntries) { const m = mapEntries; mapEntries = null; initMap(m); }
}

function vGate() {
  const miss = [];
  if (!hasWorlds()) miss.push('wybór światów');
  if (A.sortPos < acts().length) miss.push('karty „Co lubisz robić”');
  if (A.values.length < 3) miss.push('trzy rzeczy, które są dla ciebie ważne');
  if (provenStrengths(A).length < 3) miss.push('trzy mocne strony');
  return `<h1>Najpierw kilka pytań</h1><p>Żeby pokazać klasy, które do ciebie pasują, brakuje jeszcze: ${miss.map(esc).join(', ')}.</p>
    <div class="actions"><button class="btn" data-go="${(A.worlds || []).length ? 'zajecia' : 'swiaty'}">Wróć do pytań</button></div>`;
}

function vStart() {
  const started = hasAnswers();
  const nCls = data.schools.reduce((t, x) => t + x.classes.length, 0);
  const steps = [['Ja', 'światy, które cię ciekawią, i co lubisz robić: same kliknięcia', 'ok. 8 min'], ['Szkoła', 'jak ci idzie: słabo, dobrze, świetnie', 'ok. 1 min'], ['Kompas', 'twoje kierunki, a potem szkoły i klasy w Krakowie', '']];
  return `<div class="hero">${ILLUS.start}<div>
    <span class="kicker2">Kompas Liceum · Kraków 2027</span>
    <h1>Jaka klasa pasuje do tego, co lubisz?</h1>
    <div class="compassnote"><b>To nie test i nie ocena.</b> To kompas: pokazuje kierunki, które warto odkryć, i klasy w Krakowie, które do nich prowadzą. Nie ma złych odpowiedzi, a punkty i szanse są tylko orientacyjne.</div>
    <p class="lead">Klikasz, przesuwasz i wybierasz. Nic nie musisz pisać. Na końcu zobaczysz kierunki oraz licea i technika, które są realne, a które ambitne.</p>
    ${started ? `<p><b>Masz już odpowiedzi.</b> ${needResults() ? 'Możesz dokończyć pytania.' : 'Twój kompas czeka.'}</p>` : ''}
    <div class="startcta">${started && !needResults() ? '<button class="btn big" data-go="wyniki">Mój kompas</button>' : ''}
      <button class="btn ${started && !needResults() ? 'ghost' : 'big'}" data-go="${started && (A.worlds || []).length ? 'zajecia' : 'swiaty'}">${started ? 'Wróć do pytań' : 'Zaczynamy'}</button>
      <button class="btn ghost" data-go="szkoly">Przeglądaj szkoły</button></div>
    <ol class="steps2">${steps.map((x, k) => `<li><span class="rno">${k + 1}</span><div><b>${x[0]}</b><span class="t">${x[1]}${x[2] ? ' · ' + x[2] : ''}</span></div></li>`).join('')}</ol>
    <div class="note2"><b>Co jest w bazie.</b> ${data.schools.length} szkół i ${nCls} klas w Krakowie: ścisłe, przyrodnicze, językowe, humanistyczne, biznesowe i techniczne. Klasy dwujęzyczne i sportowe dojdą w kolejnej wersji. Progi są z rekrutacji 2026, więc to orientacja, nie obietnica.</div>
    <div class="skinpick" role="group" aria-label="Wygląd aplikacji"><span class="small muted">Wygląd:</span>
      <button class="chip" data-skinpick="neon" aria-pressed="${skin === 'neon'}">Neon</button><button class="chip" data-skinpick="" aria-pressed="${!skin}">Spokojny</button><button class="chip" data-skinpick="pop" aria-pressed="${skin === 'pop'}">Pop art</button></div>
    ${TEST ? `<details class="card"><summary>Tryb testowy</summary><div class="actions">${data.personas.map(p => `<button class="btn ghost" data-persona="${p.id}">${esc(p.label)}</button>`).join('')}</div></details>` : ''}
  </div></div>`;
}

function vWorlds() {
  const w = A.worlds || [], all = w.includes('all');
  const tile = x => `<button class="wtile" data-world="${x.id}" aria-pressed="${!all && w.includes(x.id)}">${icon(x.icon, 'ico')}<b>${esc(x.name)}</b><span>${esc(x.hint)}</span></button>`;
  return `${ILLUS.zajecia}<h1>Co cię ciekawi?</h1><p class="muted">Wybierz światy, które cię przyciągają. Możesz kilka. Pokażemy ci pytania głównie z tych światów, a resztę po trochu.</p>
    <div class="wgrid">${data.questions.worlds.map(tile).join('')}</div>
    <div class="row-s"><button class="chip" data-world="all" aria-pressed="${all}">Nie wiem, pokaż wszystko po trochu</button></div>`;
}

function vSort() {
  const acts = visibleActivities(A, data), n = acts.length, pos = Math.min(A.sortPos, n);
  const dots = `<div class="dots" aria-hidden="true">${acts.map((_, i) => `<i class="${i < pos ? 'done' : ''}"></i>`).join('')}</div>`;
  if (pos >= n) {
    const liked = acts.filter(a => A.sort[a.id] === 1).map(a => `<li>${esc(a.text)}</li>`).join('');
    return `<h1>Co lubisz robić</h1><div class="card"><p>Lubisz:</p><ul>${liked || '<li class="muted">nic nie zaznaczyłeś, to też jest odpowiedź</li>'}</ul><button class="btn ghost" data-sortreset>Przejdź jeszcze raz</button></div>${dots}`;
  }
  const a = acts[pos];
  return `${A.sortPos === 0 ? `<div class="deskonly">${ILLUS.zajecia}</div>` : ''}<h1>Co lubisz robić</h1><p class="muted">Bez zastanawiania się. Chodzi o samą czynność, nie o zawód.<span class="touchonly"> Kartę możesz też przesunąć w prawo (lubię) albo w lewo (nie lubię).</span></p>
    <div class="card sort"><p class="sortcount">${pos + 1} z ${n}</p><div class="q">${esc(a.text)}</div>
      <div class="row"><button class="btn ghost" data-sortans="-1">nie lubię</button><button class="btn" data-sortans="1">lubię</button></div>
      <button class="chip" data-sortans="0" style="margin-top:12px">obojętne, pomiń</button>${pos > 0 ? '<button class="chip" data-sortback style="margin-top:12px">cofnij</button>' : ''}
      <p class="keys" aria-hidden="true"><kbd>←</kbd> nie lubię · <kbd>→</kbd> lubię · <kbd>↓</kbd> pomiń</p></div>${dots}`;
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
    return `<h1>Co robisz, gdy…</h1><div class="card"><p>Twoje wybory:</p><ul>${picked || '<li class="muted">wszystko pominięte, to też jest odpowiedź</li>'}</ul><button class="btn ghost" data-sitreset>Przejdź jeszcze raz</button></div>${dots}`;
  }
  const q = qs[pos];
  return `${A.sitPos === 0 ? `<div class="deskonly">${ILLUS.sytuacje}</div>` : ''}<h1>Co robisz, gdy…</h1><p class="muted">Wybierz to, co zrobiłbyś naprawdę, nie to, co wypada.</p>
    <div class="card"><p class="sortcount">${pos + 1} z ${n}</p><p class="q-s">${esc(q.text)}</p>
      <div class="chips stack">${q.answers.map(a => chip(`data-sitans="${a.id}"`, esc(a.text), A.situations[q.id] === a.id)).join('')}</div>
      <div class="row-s"><button class="chip" data-sitans="">pomiń</button>${pos > 0 ? '<button class="chip" data-sitback>cofnij</button>' : ''}</div></div>${dots}`;
}

function vStyle() {
  return `<h1>Jak lubisz pracować?</h1><p class="muted">Przesuń w stronę, która bardziej do ciebie pasuje. Środek też jest w porządku.</p>
    ${data.dimensions.workStyle.map(w => `<div class="slider"><div class="ends"><span>${w.left}</span><span>${w.right}</span></div>
      <input type="range" min="-3" max="3" step="1" id="sl-${w.id}" data-slider="${w.id}" value="${A.sliders[w.id] ?? 0}" aria-label="${w.left} albo ${w.right}"></div>`).join('')}`;
}

function vValues() {
  return `<h1>Co jest dla ciebie ważne w pracy?</h1><p>Wybierz trzy, w kolejności: najpierw najważniejsze. <span class="pickn">${A.values.length} z 3</span></p>
    <div class="chips">${data.dimensions.values.map(v => { const i = A.values.indexOf(v.id); return chip(`data-value="${v.id}"`, `${i >= 0 ? `<span class="n">${i + 1}.</span> ` : ''}${v.name}`, i >= 0); }).join('')}</div>`;
}

const WHERE = ['w szkole', 'w sporcie', 'w domu', 'w hobby', 'z przyjaciółmi', 'w grach i internecie'];
function vStrengths() {
  const picked = A.strengths.map(s => s.id);
  const list = A.strengths.map(s => { const st = data.strengths.find(x => x.id === s.id);
    return `<div class="strength"><p class="field">${esc(st.name)}: gdzie to widać?</p>
      <div class="chips">${WHERE.map(w => chip(`data-where="${s.id}|${w}"`, w, s.proof === w)).join('')}</div></div>`; }).join('');
  return `<h1>Twoje mocne strony</h1><p>Wybierz trzy rzeczy, które ci wychodzą, i kliknij, gdzie to widać. <span class="pickn">${A.strengths.length} z 3</span></p>
    <div class="chips">${data.strengths.map(s => chip(`data-strength="${s.id}"`, s.name, picked.includes(s.id))).join('')}</div>
    ${list ? `<div class="card">${list}</div>` : ''}`;
}

// ---- school self-assessment (soft by default, exact marks optional) -----------------------------------------------
const SOFT = [['slabo', 'słabo'], ['dobrze', 'dobrze'], ['swietnie', 'świetnie']];
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const hasExactData = () => Object.keys(A.points.exam || {}).length > 0 || Object.keys(A.points.grades || {}).length > 0;
const pMode = () => A.points.mode || (hasExactData() ? 'exact' : 'soft');
const eff = () => effectivePoints(A, data.config);
const hasInput = () => { if (pMode() === 'exact') return hasExactData(); const s = A.points.soft || {}; return Object.keys(s.exam || {}).length + Object.keys(s.grades || {}).length > 0; };
const softRow = (kind, key, label) => {
  const cur = ((A.points.soft || {})[kind] || {})[key];
  return `<div class="softrow"><span class="sl" id="sr-${kind}-${key}">${esc(label)}</span><div class="chips" role="group" aria-labelledby="sr-${kind}-${key}">${SOFT.map(([v, t]) => chip(`data-soft="${kind}:${key}:${v}"`, t, cur === v)).join('')}</div></div>`;
};
function parentNote() {
  const c = data.config, so = c.soft;
  return `<details class="parent"><summary>Dla rodziców: jak to liczymy</summary>
    <p class="small">Pytamy tylko o przedmioty. Odpowiedź o polskim, matematyce i angielskim liczymy też jako spodziewany wynik egzaminu ósmoklasisty. Odpowiedzi „słabo / dobrze / świetnie” zamieniamy na typowe wartości: <b>słabo</b> to ocena ${so.slabo.grade} i ok. ${so.slabo.exam}% na egzaminie, <b>dobrze</b> to ${so.dobrze.grade} i ok. ${so.dobrze.exam}%, <b>świetnie</b> to ${so.swietnie.grade} i ok. ${so.swietnie.exam}%. Przedmiot bez odpowiedzi liczymy jak „dobrze”.</p>
    <p class="small">Z tego powstaje szacunek punktów rekrutacyjnych (maksymalnie 200): egzamin ósmoklasisty daje do 100 pkt (polski 0,35, matematyka 0,35, język obcy 0,30 × wynik w procentach), świadectwo do 100 pkt (polski, matematyka i dwa przedmioty zależne od klasy: ocena 6 = 18, 5 = 17, 4 = 14, 3 = 8, 2 = 2 pkt) oraz dodatki za pasek, wolontariat i osiągnięcia.</p>
    <p class="small">Szacunek porównujemy z progami z rekrutacji ${esc(c.thresholdYear)}. Zapas co najmniej ${c.chanceMargin} pkt to <b>realna szansa</b>, od −${c.chanceMargin} do +${c.chanceMargin} pkt to <b>do zawalczenia</b>, niżej to <b>ambitna</b>. To orientacja do rozmowy, nie prognoza: progi zmieniają się co roku, a przed egzaminem nikt nie zna swojego wyniku. Dokładne punkty warto policzyć w drugim semestrze albo w oficjalnym kalkulatorze rekrutacji.</p></details>`;
}
function vSchool() {
  const p = A.points, ex = p.exam, g = p.grades, mode = pMode();
  const subj = data.questions.grades;
  const main = subj.filter(s => !['historia', 'wos'].includes(s)), rest = subj.filter(s => ['historia', 'wos'].includes(s));
  let body;
  if (mode === 'soft') {
    body = `<div class="card"><h3>Przedmioty</h3><p class="small muted">Jak ci idzie teraz? Strzał wystarczy. Zaznacz te, które chcesz, resztę pomiń.</p>
        ${main.map(s => softRow('grades', s, cap(SUBJECT_NAME[s]))).join('')}
        ${rest.length ? `<details><summary class="small">Pozostałe przedmioty</summary>${rest.map(s => softRow('grades', s, cap(SUBJECT_NAME[s]))).join('')}</details>` : ''}</div>
      <div class="card exactask"><h3>Masz już oceny z I semestru?</h3><p class="small">Jeśli tak, możesz wpisać dokładne oceny i wyniki. Nie musisz: do pierwszego przeglądu opcji wystarczy „słabo, dobrze, świetnie”.</p>
        <button class="btn ghost" data-mode="exact">Wpiszę dokładne oceny</button></div>`;
  } else {
    const exRow = (k, label, w) => `<label for="ex-${k}">${label} <span class="muted small">(waga ${w})</span></label>
      <input id="ex-${k}" type="number" inputmode="numeric" min="0" max="100" step="1" data-exam="${k}" value="${ex[k] ?? ''}" placeholder="%">`;
    const grades = subj.map(s => `<label for="gr-${s}">${esc(SUBJECT_NAME[s])}</label>
      <select id="gr-${s}" data-grade="${s}"><option value="">–</option>${[6, 5, 4, 3, 2].map(n => `<option value="${n}" ${g[s] === n ? 'selected' : ''}>${n}</option>`).join('')}</select>`).join('');
    body = `<div class="card"><h3>Egzamin ósmoklasisty</h3><p class="small muted">Wynik w procentach: z próbnego egzaminu albo spodziewany.</p>
        <div class="pgrid">${exRow('polski', 'Język polski', '0,35')}${exRow('matematyka', 'Matematyka', '0,35')}${exRow('obcy', 'Język obcy (angielski)', '0,30')}</div></div>
      <div class="card"><h3>Oceny z I semestru</h3><p class="small muted">Przedmiotów, których nie wpiszesz, nie liczymy.</p><div class="pgrid">${grades}</div></div>
      <div class="card"><h3>Dodatkowe punkty</h3>
        <label class="check2"><input type="checkbox" data-pt="stripe" ${p.stripe ? 'checked' : ''}> Świadectwo z wyróżnieniem (czerwony pasek)</label>
        <label class="check2"><input type="checkbox" data-pt="volunteering" ${p.volunteering ? 'checked' : ''}> Wolontariat wpisany na świadectwie</label>
        <div class="pgrid"><label for="ach">Osiągnięcia (konkursy, olimpiady, sport), do 18 pkt</label>
          <input id="ach" type="number" inputmode="numeric" min="0" max="18" step="1" data-pt="achievements" value="${p.achievements || 0}"></div></div>
      <div class="card exactask"><p class="small">Wolisz prościej? Wróć do odpowiedzi „słabo, dobrze, świetnie”.</p><button class="btn ghost" data-mode="soft">Wróć do prostej wersji</button></div>`;
  }
  return `${LILLUS.szkola}<h1>Jak ci idzie w szkole?</h1>
    <p>Nie liczymy dokładnych punktów. Zaznacz, jak się czujesz z danym przedmiotem, a przy klasach zobaczysz, które są <b>realne</b>, a które <b>ambitne</b>.</p>
    <div class="ptform">${body}</div>
    <div class="live" id="live" role="status" aria-live="polite"></div>
    ${parentNote()}`;
}
function liveUpdate() {
  const el = document.getElementById('live'); if (!el) return;
  if (pMode() === 'soft') {
    const s = A.points.soft || {}, n = Object.keys(s.exam || {}).length + Object.keys(s.grades || {}).length;
    el.innerHTML = n ? `<span>Zaznaczone odpowiedzi: <b>${n}</b>. Resztę możesz zostawić.</span>` : '<span class="muted">Możesz też przejść dalej bez zaznaczania: zobaczysz wtedy klasy bez oceny szans.</span>';
  } else {
    const ex = examPoints(A.points.exam), ce = certificatePoints(A.points, { scored: [] });
    el.innerHTML = ex.entered ? `<span>Egzamin: <b>${f1(ex.total)}</b> z 100 pkt · dodatki: <b>${ce.extras}</b> pkt. Punkty ze świadectwa liczymy osobno dla każdej klasy.</span>` : '<span class="muted">Wpisz wyniki z egzaminu, a tu zobaczysz sumę. Możesz też przejść dalej.</span>';
  }
}

// ---- results ------------------------------------------------------------------------------------------------------
const pill = ch => `<span class="pill ${ch.chance || 'unknown'}">${esc(ch.chance && ch.chance !== 'unknown' ? CHANCE_TXT[ch.chance] : (hasInput() ? 'za mało danych o przedmiotach' : 'zaznacz, jak ci idzie'))}</span>`;

function classRow(x) {
  const { school, cls, check } = x;
  return `<li><div><span class="sch">${esc(school.short)}</span><span class="badge">${school.type === 'liceum' ? 'liceum' : 'technikum'}</span>
      <div class="sub">klasa ${esc(cls.code)} · ${esc(cls.label)}${cls.occupation ? ' (zawód + matura)' : ''}</div>
      ${school.address ? `<div class="sub">${esc(school.address)}</div>` : ''}
      ${cls.status !== 'sourced' ? '<div class="sub muted">dane do sprawdzenia w rekrutacji 2027</div>' : ''}</div>
    ${pill(check)}</li>`;
}

function parentTable(rows) {
  const e = eff(), th = x => x.cls.threshold != null ? f2(x.cls.threshold) : `zakres ${f2(x.school.range.min)}–${f2(x.school.range.max)}`;
  const pts = x => x.check.complete ? f1(x.check.points) : '–';
  const mg = x => x.check.margin != null ? `${x.check.margin >= 0 ? '+' : '−'}${f1(Math.abs(x.check.margin))}` : '–';
  return `<details class="parent"><summary>Dla rodziców: progi i szacunek punktów</summary>
    <p class="small">${hasInput() ? (e.approx ? 'Szacunek z odpowiedzi „słabo, dobrze, świetnie”.' : 'Policzone z dokładnych ocen i wyników.') : 'Nie ma jeszcze odpowiedzi o szkole, więc nie ma szacunku.'}
      ${e.assumed && e.assumed.length ? ` Przedmioty bez odpowiedzi liczone jak „dobrze”: ${e.assumed.map(s => esc(SUBJECT_NAME[s])).join(', ')}.` : ''}
      Progi z rekrutacji ${esc(data.config.thresholdYear)}; w 2027 mogą być inne.</p>
    <div class="tablewrap"><table class="ptable"><thead><tr><th>Szkoła i klasa</th><th>Próg</th><th>Szacunek</th><th>Różnica</th></tr></thead>
      <tbody>${rows.map(x => `<tr><td>${esc(x.school.short)} · ${esc(x.cls.code)}</td><td>${th(x)}</td><td>${pts(x)}</td><td>${mg(x)}</td></tr>`).join('')}</tbody></table></div>
    ${parentNote().replace('<details class="parent"><summary>Dla rodziców: jak to liczymy</summary>', '<div class="parentin">').replace(/<\/details>$/, '</div>')}</details>`;
}

function areaCard(slotName, c, selected, i) {
  return `<article class="area" style="--i:${i}" ${selected ? 'aria-current="true"' : ''}><span class="kicker2">${slotName}</span>
    <h3>${c.card.icon ? icon(c.card.icon, 'ico') : ''}${esc(c.card.name)}</h3><span class="band2">${c.band}</span>
    ${c.reasons.length ? `<ul>${c.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    <p class="small">${esc(c.card.whoYouHelp)}</p>
    <details><summary class="small">Dzień z tej pracy</summary><ul class="small">${c.card.dayInLife.map(d => `<li>${esc(d)}</li>`).join('')}</ul></details>
    <button class="btn ${selected ? '' : 'ghost'}" data-area="${c.card.id}">${selected ? 'Pokazane niżej' : 'Pokaż klasy'}</button></article>`;
}

function studiaFor(card) {
  const seen = new Set(), out = [];
  for (const o of studiaOffers) if (o.cards.some(id => (card.studiaCards || []).includes(id))) {
    const key = o.name + o.institution; if (seen.has(key)) continue; seen.add(key);
    out.push(`${o.name} · ${o.institution} (${o.durationYears} ${o.durationYears === 1 ? 'rok' : o.durationYears < 5 ? 'lata' : 'lat'})`);
  }
  return out.slice(0, 5);
}

function planItems(sel) {
  const top = sel.classes.find(c => c.check.chance && c.check.chance !== 'unknown') || sel.classes[0];
  const out = [{ id: 'exp', when: 'w ciągu 30 dni', text: sel.card.experiment }];
  if (top) {
    out.push({ id: 'dni', when: 'grudzień 2026 – kwiecień 2027', text: `Idź na dzień otwarty albo wejdź na stronę: ${top.school.short}. Zapytaj, które oceny ze świadectwa liczy klasa ${top.cls.code} (${top.cls.label}) i jak wygląda zwykły tydzień nauki.` });
    const subs = scoredSubjects(top.cls).list.filter(s => !['polski', 'matematyka'].includes(s)).map(s => SUBJECT_NAME[s]);
    const subTxt = subs.length ? ` oraz z przedmiotów tej klasy (${subs.join(', ')})` : '';
    if (top.check.chance === 'ambitna') out.push({ id: 'pkt', when: 'do końca roku szkolnego', warn: true, text: `Klasa ${top.cls.code} jest na razie ambitna. Najwięcej pomoże matematyka i polski${subTxt}. W drugim semestrze wróć do Kompasu z dokładnymi ocenami.` });
    else if (top.check.chance) out.push({ id: 'pkt', when: 'do końca roku szkolnego', text: `Trzymaj poziom z matematyki i polskiego${subTxt}. W drugim semestrze sprawdź dokładniej, gdzie jesteś.` });
    else out.push({ id: 'pkt', when: 'w styczniu', text: 'Zaznacz w Kompasie, jak ci idzie w szkole, żeby zobaczyć, które klasy są realne, a które ambitne.' });
  }
  out.push({ id: 'zasady', when: 'styczeń 2027', text: `Sprawdź terminy rekrutacji 2027 na stronie Małopolskiego Kuratora Oświaty (${data.config.recruitmentWindow}) i regulamin każdej szkoły z twojej listy.` });
  out.push({ id: 'lista', when: 'przed złożeniem wniosku', text: 'Ułóż listę klas od wymarzonej do bezpiecznej: jedna ambitna, jedna realna, jedna z zapasem.' });
  out.push({ id: 'egz', when: data.config.examDates, text: 'Egzamin ósmoklasisty (polski, matematyka, język obcy).' });
  out.push({ id: 'talk', when: 'kiedy chcesz', text: 'Pokaż ten plan komuś, komu ufasz, i zapytaj, co o nim myśli.' });
  return out;
}

const ROLE_TXT = { ambitna: 'ambitna', realna: 'realna', bezpieczna: 'z zapasem' };

// ---- likes ("Moja lista"): profiles, schools and classes the kid wants to keep -----------------------------------
const L0 = () => (A.likes ||= { profiles: [], schools: [], classes: [] });
const KIND = { p: 'profiles', s: 'schools', c: 'classes' };
const liked = (k, id) => L0()[KIND[k]].includes(id);
const nLikes = () => { const l = L0(); return l.profiles.length + l.schools.length + l.classes.length; };
function likeCount() { document.querySelectorAll('[data-likecount]').forEach(el => { const n = nLikes(); el.textContent = n ? String(n) : ''; el.hidden = !n; }); }
const HEART = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 4.8 6.4 4.5c2-.2 3.6 1 4.6 2.5 1-1.5 2.6-2.7 4.6-2.5 3.4.3 5.2 3.8 3.6 6.9C19 15.6 12 20 12 20z"/></svg>';
const heart = (k, id, what) => `<button class="heart" data-like="${k}:${esc(id)}" aria-pressed="${liked(k, id)}" aria-label="${liked(k, id) ? 'Usuń z mojej listy' : 'Dodaj do mojej listy'}: ${esc(what)}" title="Moja lista">${HEART}</button>`;
const clsKey = x => `${x.school.id}|${x.cls.code}`;

// ---- the compass ---------------------------------------------------------------------------------------------------
function compassData() { const r = scoreLiceum(A, data); return { r, P: profilesFor(r, data) }; }
const CDEG = { N: 0, NNE: 27, NNW: -27, NE: 58, NW: -58, E: 96, W: -96, S: 180 };
function compassSvg(P, selId) {
  const cx = 250, cy = 222, R0 = 128, rad = d => (d - 90) * Math.PI / 180;
  const ticks = Array.from({ length: 16 }, (_, i) => { const d = i * 22.5, l = i % 4 === 0 ? 14 : i % 2 === 0 ? 9 : 5;
    return `<line x1="${cx + (R0 - l) * Math.cos(rad(d))}" y1="${cy + (R0 - l) * Math.sin(rad(d))}" x2="${cx + R0 * Math.cos(rad(d))}" y2="${cy + R0 * Math.sin(rad(d))}"/>`; }).join('');
  const pts = P.map((x, i) => {
    const d = CDEG[x.compass.pos] ?? x.compass.deg, px = cx + R0 * Math.cos(rad(d)), py = cy + R0 * Math.sin(rad(d));
    const r2 = R0 + (i === 0 ? 30 : 26), lx = cx + r2 * Math.cos(rad(d)), ly = cy + r2 * Math.sin(rad(d)) + 5;
    const anchor = Math.abs(d) < 10 || Math.abs(d) > 170 ? 'middle' : d > 0 ? 'start' : 'end';
    const size = i === 0 ? 14 : i < 3 ? 11 : 8;
    return `<g class="cpt ${i === 0 ? 'north' : i < 3 ? 'alt' : ''} ${x.profile.id === selId ? 'sel' : ''}" data-prof="${x.profile.id}" role="button" tabindex="0" aria-label="${x.compass.pos}, ${x.compass.label}: ${esc(x.profile.name)}">
      <line class="ray" x1="${cx}" y1="${cy}" x2="${px}" y2="${py}"/><circle class="hit" cx="${px}" cy="${py}" r="26"/><circle class="dot" cx="${px}" cy="${py}" r="${size}"/>
      <text x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(x.profile.short)}</text></g>`;
  }).join('');
  return `<div class="compass"><svg viewBox="0 0 500 440" role="group" aria-label="Kompas: profile od najlepiej do najmniej pasujących">
    <circle class="ring" cx="${cx}" cy="${cy}" r="${R0}"/><circle class="ring2" cx="${cx}" cy="${cy}" r="${R0 * 0.55}"/><g class="ticks">${ticks}</g>
    <g class="needle" style="transform-origin:${cx}px ${cy}px"><path d="M${cx} ${cy - R0 * 0.78} L${cx + 12} ${cy} L${cx} ${cy + 9} L${cx - 12} ${cy} Z" class="nN"/><path d="M${cx} ${cy + R0 * 0.5} L${cx + 8} ${cy} L${cx - 8} ${cy} Z" class="nS"/><circle cx="${cx}" cy="${cy}" r="6" class="hub"/></g>
    ${pts}
  </svg></div>`;
}
const fitWord = f => f >= 80 ? 'bardzo pasuje' : f >= 65 ? 'pasuje' : f >= 50 ? 'może pasować' : 'mniej pasuje';
function chanceSum(classes, compact) {
  const n = classes.length, m = new Set(classes.map(c => c.school.id)).size;
  if (!hasInput()) return `<span class="csum">${n} klas w ${m} szkołach</span>`;
  const k = { realna: 0, zawalczenia: 0, ambitna: 0 }; for (const c of classes) if (k[c.check.chance] !== undefined) k[c.check.chance]++;
  const part = (id, word) => `<span class="cd"><i class="d ${id}" aria-hidden="true"></i>${k[id]}${compact ? '' : ' ' + word}</span>`;
  return `<span class="csum" aria-label="Klasy: ${k.realna} realnych, ${k.zawalczenia} do zawalczenia, ${k.ambitna} ambitnych">${part('realna', 'realnych')}${part('zawalczenia', 'do zawalczenia')}${part('ambitna', 'ambitnych')}</span>`;
}
function profileCard(x, mode) {
  const reasons = ((x.areas[0] || {}).reasons || []).slice(0, mode === 'north' ? 3 : 2);
  const why = reasons.length ? `<ul class="small why">${reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : '';
  return `<article class="pcard ${mode}" style="--i:${['N', 'NNE', 'NNW'].indexOf(x.compass.pos) + 1}">
    <header><span class="kicker2">${x.compass.pos} · ${x.compass.label}</span>${heart('p', x.profile.id, x.profile.name)}</header>
    <h3>${icon(x.profile.icon, 'ico')}${esc(x.profile.name)}</h3>
    <div class="fitrow"><div class="fitbar" aria-hidden="true"><i style="width:${Math.round(x.fit)}%"></i></div><span class="small muted">${fitWord(x.fit)}</span></div>
    <p class="small">${esc(x.profile.desc)}</p>
    ${mode === 'north' ? why : (why ? `<details class="whyd"><summary class="small">Dlaczego?</summary>${why}</details>` : '')}
    ${x.areas.length > 1 ? `<div class="dirs">${x.areas.map(a => `<span class="dchip">${esc(a.card.name)}</span>`).join('')}</div>` : ''}
    <p class="small">${chanceSum(x.classes)}</p>
    <button class="btn ${mode === 'north' ? '' : 'ghost'}" data-prof="${x.profile.id}">Zobacz szkoły i klasy</button></article>`;
}
const profileRow = x => `<li class="prow"><button class="prowbtn" data-prof="${x.profile.id}"><span class="cposb">${x.compass.pos}</span>${icon(x.profile.icon, 'ico')}<b>${esc(x.profile.name)}</b>
    <span class="fitbar" aria-hidden="true"><i style="width:${Math.round(x.fit)}%"></i></span><span class="small muted fw">${fitWord(x.fit)}</span>${chanceSum(x.classes, true)}<span class="chev" aria-hidden="true">›</span></button>${heart('p', x.profile.id, x.profile.name)}</li>`;
const exportBox = label => `<div class="exportbox noprint"><div><label class="small" for="name">Imię <span class="muted">(opcjonalnie, do nazwy pliku)</span></label><input id="name" type="text" data-field="name" value="${esc(A.name)}" autocomplete="off"></div>
    <button class="btn" data-export="download">${label}</button><button class="btn ghost" data-export="print">Drukuj</button></div>`;
function vKompas() {
  const { P } = compassData(), top = P[0], selId = A.profile || top.profile.id;
  const sel = (P.find(x => x.profile.id === selId) || top), area = sel.areas[0];
  const items = planItems(area);
  return `<div class="khead"><h1>${esc(A.name ? A.name + ', twój' : 'Twój')} kompas</h1>
      <p class="lead">Północ to profil, który teraz najbardziej do ciebie pasuje. Tuż obok są dobre alternatywy. Kliknij punkt na kompasie albo kartę, żeby zobaczyć szkoły.</p></div>
    <div class="kgrid">${compassSvg(P, selId)}${profileCard(top, 'north')}</div>
    <h2>Bliskie alternatywy</h2>
    <div class="pcards two">${P.slice(1, 3).map(x => profileCard(x, 'alt')).join('')}</div>
    <h2>Dalej na kompasie</h2>
    <p class="small muted">Mniej pasują teraz, ale nic nie jest zamknięte.</p>
    <ul class="prows">${P.slice(3).map(profileRow).join('')}</ul>
    ${hasInput() ? `<p class="legend small"><span class="mapnum realna" aria-hidden="true"></span> realne klasy <span class="mapnum zawalczenia" aria-hidden="true"></span> do zawalczenia <span class="mapnum ambitna" aria-hidden="true"></span> ambitne</p>` : '<p class="note2">Zaznacz, jak ci idzie w szkole, a przy profilach zobaczysz, ile klas jest realnych. <button class="linkbtn" data-go="szkola">Zaznacz</button></p>'}
    ${nLikes() ? `<p class="note2">Na twojej liście: <b>${nLikes()}</b>. <button class="linkbtn" data-go="lista">Zobacz moją listę</button></p>` : '<p class="small muted">Serduszkiem dodajesz profil, szkołę albo klasę do swojej listy. Lista trafia do pliku z wynikami.</p>'}
    <details class="card plansec"><summary><b>Plan do maja 2027</b> <span class="small muted">dla profilu: ${esc(sel.profile.name)}</span></summary>
    <ul class="plan">${items.map(it => `<li><input type="checkbox" id="pl-${it.id}" data-check="${area.card.id}:${it.id}" ${A.checks[`${area.card.id}:${it.id}`] ? 'checked' : ''}>
      <label for="pl-${it.id}"><span class="when">${esc(it.when)}</span>${esc(it.text)}</label></li>`).join('')}</ul></details>
    ${exportBox('Zapisz plik z wynikami')}
    <div class="actions noprint"><button class="btn ghost small" data-go="swiaty">Zmień odpowiedzi</button><button class="btn ghost small" data-go="szkola">Zmień, jak ci idzie</button></div>
    ${parentNote()}
    <details class="card"><summary>Źródła</summary><ul class="small">${data.sources.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a> · stan ${esc(x.asOf)}</li>`).join('')}</ul></details>`;
}

// ---- one profile: its directions, then schools and classes ---------------------------------------------------------
function schoolGroups(rows, sort) {
  const by = new Map();
  for (const x of rows) { const g = by.get(x.school.id) || { school: x.school, rows: [] }; g.rows.push(x); by.set(x.school.id, g); }
  const score = sort === 'chance' ? g => Math.max(...g.rows.map(x => (CHANCE_RANK[x.check.chance] || 0) * 10 - x.rank))
    : g => Math.max(...g.rows.map(x => (CHANCE_RANK[x.check.chance] || 0) - x.rank * 10)); // default: best-matching direction first, then the chance
  return [...by.values()].map(g => ({ ...g, best: bestOf(g.rows) })).sort((a, b) => score(b) - score(a) || a.school.short.localeCompare(b.school.short, 'pl', { numeric: true }));
}
const street = s => (s.address || '').replace(/,?\s*\d\d-\d{3}\s*Kraków$/, '').replace(/,\s*Kraków$/, '');
function schoolCard(g, i) {
  return `<article class="scard ${liked('s', g.school.id) ? 'liked' : ''}" style="--i:${Math.min(i, 8)}">
    <header><div><h3>${esc(g.school.short)}</h3><p class="sub">${g.school.type}${g.school.address ? ' · ' + esc(street(g.school)) : ''}</p></div>${heart('s', g.school.id, g.school.short)}</header>
    ${g.rows.length ? `<ul class="srows">${g.rows.map(r => `<li><span class="code">${esc(r.cls.code)}</span><span class="lbl">${esc(r.cls.label)}</span>${hasInput() ? `<span class="pill ${r.check.chance || 'unknown'}">${esc(SHORT_CH[r.check.chance] || 'bez oceny')}</span>` : '<span></span>'}${heart('c', clsKey(r), `${g.school.short} ${r.cls.code}`)}</li>`).join('')}</ul>` : ''}
    ${g.school.note ? `<details class="snote"><summary class="small muted">Uwaga do danych</summary><p class="small muted">${esc(g.school.note)}</p></details>` : ''}
    <div class="scta"><button class="linkbtn" data-pin="${g.school.id}">Na mapie</button><a class="linkbtn" href="${esc(dirUrl(g.school))}" target="_blank" rel="noopener">Dojazd ↗</a></div></article>`;
}
function vProfile() {
  const { P } = compassData(), x = P.find(p => p.profile.id === A.profile) || P[0];
  const areaSel = x.areas.find(a => a.card.id === ui.parea) || null, focus = areaSel || x.areas[0];
  const rows = x.classes.filter(c => (!areaSel || c.cls.cards.includes(areaSel.card.id)) && rowPass(c));
  const groups = schoolGroups(rows, ui.sort), first = groups.slice(0, 12), rest = groups.slice(12);
  const stud = studiaFor(focus.card);
  const others = P.filter(p => p !== x).slice(0, 4);
  return `<p class="actions"><button class="btn ghost small" data-go="wyniki">← Wróć do kompasu</button></p>
    <div class="phead"><div><span class="kicker2">${x.compass.pos} · ${x.compass.label}</span>
      <h1>${icon(x.profile.icon, 'ico')}${esc(x.profile.name)} ${heart('p', x.profile.id, x.profile.name)}</h1>
      <p class="lead">${esc(x.profile.desc)}</p></div></div>
    ${x.areas.length > 1 ? `<div class="frow dirsel" role="group" aria-label="Kierunki w tym profilu"><span class="small muted">Kierunek:</span>
      <button class="chip" data-parea="" aria-pressed="${!areaSel}">wszystkie</button>${x.areas.map(a => `<button class="chip" data-parea="${a.card.id}" aria-pressed="${areaSel === a}">${esc(a.card.name)}</button>`).join('')}</div>` : ''}
    <details class="card focus"><summary><b>${esc(focus.card.name)}</b>: jak wygląda ta praca i co dalej</summary>
      <p class="small"><b>Przykładowe zawody:</b> ${esc(focus.card.roles)}</p><p class="small">${esc(focus.card.whoYouHelp)}</p>
      <ul class="small">${focus.card.dayInLife.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      <p class="small"><b>Spróbuj w 30 dni:</b> ${esc(focus.card.experiment)}</p><p class="small"><b>Po szkole:</b> ${esc(focus.card.afterSchool)}</p>
      ${stud.length ? `<p class="small muted">Studia w Krakowie (z Kompasu Studia): ${stud.map(esc).join('; ')}</p>` : ''}</details>
    <h2>Szkoły i klasy</h2>
    ${!hasInput() ? '<p class="note2">Zaznacz, jak ci idzie w szkole, a przy klasach pojawią się szanse. <button class="linkbtn" data-go="szkola">Zaznacz</button></p>' : ''}
    ${filterBar(false)}
    ${hasInput() ? `<div class="frow" role="group" aria-label="Kolejność"><span class="small muted">Najpierw:</span><button class="chip" data-sort="" aria-pressed="${ui.sort !== 'chance'}">najlepiej pasujące</button><button class="chip" data-sort="chance" aria-pressed="${ui.sort === 'chance'}">największa szansa</button></div>` : ''}
    <p class="count small" role="status">${groups.length} szkół · ${rows.length} klas${ui.type || ui.chance || ui.parea ? ' · <button class="linkbtn" data-fclear>wyczyść filtry</button>' : ''}</p>
    ${groups.length ? `<div class="scards">${first.map(schoolCard).join('')}</div>${rest.length ? `<details class="more"><summary>Pokaż jeszcze ${rest.length} szkół</summary><div class="scards">${rest.map(schoolCard).join('')}</div></details>` : ''}`
      : `<div class="empty">${LILLUS.pusto}<p>Nic nie pasuje do filtrów. <button class="linkbtn" data-fclear>Wyczyść filtry</button></p></div>`}
    ${groups.length ? mapBlock(groups.map(g => ({ school: g.school, classes: g.rows, best: g.best })), 'Szkoły z tego profilu.') : ''}
    ${parentTable(rows)}
    <h2>Inne kierunki na kompasie</h2>
    <div class="actions">${others.map(p => `<button class="btn ghost" data-prof="${p.profile.id}">${p.compass.pos} · ${esc(p.profile.short)}</button>`).join('')}<button class="btn ghost" data-go="wyniki">Cały kompas</button></div>`;
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
  return `<div class="rhead"><div><h1>Moja lista</h1><p class="lead">To, co ci się spodobało: profile, szkoły i klasy. Lista jest w pliku z wynikami, więc możesz ją pokazać rodzicom albo wrócić do niej później.</p></div>${LILLUS.szkoly}</div>
    ${empty ? `<div class="empty">${LILLUS.pusto}<p>Lista jest pusta. Na kompasie i przy szkołach kliknij serduszko, żeby coś tu dodać.</p><p><button class="btn" data-go="wyniki">Przejdź do kompasu</button></p></div>` : ''}
    ${profs.length ? `<h2>Profile</h2><ul class="prows">${profs.map(profileRow).join('')}</ul>` : ''}
    ${groups.length ? `<h2>Klasy</h2><div class="scards">${groups.map(schoolCard).join('')}</div>` : ''}
    ${schoolsOnly.length ? `<h2>Szkoły</h2><div class="scards">${schoolsOnly.map((s, i) => schoolCard({ school: s, rows: [], best: 'unknown' }, i)).join('')}</div>` : ''}
    ${groups.length || schoolsOnly.length ? mapBlock([...groups.map(g => ({ school: g.school, classes: g.rows, best: g.best })), ...schoolsOnly.map(s => ({ school: s, classes: [], best: 'unknown' }))], 'Szkoły z twojej listy.') : ''}
    ${empty ? '' : exportBox('Zapisz plik z listą')}`;
}

// ---- filters and the school catalogue ------------------------------------------------------------------------------
const ui = { q: '', type: '', subj: '', chance: '', parea: '', sort: '' };
const ROMAN = [[40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
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
const rowPass = x => (!ui.type || x.school.type === ui.type) && (!ui.chance || x.check.chance === ui.chance)
  && (!ui.subj || x.cls.cards.some(id => ((data.opportunities.find(o => o.id === id) || {}).worlds || []).includes(ui.subj)));
const SHORT_CH = { realna: 'realna', zawalczenia: 'do zawalczenia', ambitna: 'ambitna' };
const SUBJ_F = ['matematyka', 'informatyka', 'fizyka', 'biologia', 'chemia', 'geografia'];
function filterBar(full) {
  const c = (k, v, t) => `<button class="chip" data-f="${k}:${v}" aria-pressed="${ui[k] === v}">${t}</button>`;
  return `<div class="filters" role="group" aria-label="Filtry">
    ${full ? `<label class="srch"><span class="visually-hidden">Szukaj szkoły</span><input id="fq" type="search" data-filter="q" value="${esc(ui.q)}" placeholder="Szukaj: np. 31, Ingardena, programista" autocomplete="off"></label>` : ''}
    <div class="frow"><span class="small muted">Szkoła:</span>${c('type', '', 'wszystkie')}${c('type', 'liceum', 'liceum')}${c('type', 'technikum', 'technikum')}</div>
    ${full ? `<div class="frow"><span class="small muted">Świat:</span>${c('subj', '', 'każdy')}${data.questions.worlds.map(w => c('subj', w.id, esc(w.name))).join('')}</div>` : ''}
    ${hasInput() ? `<div class="frow"><span class="small muted">Szansa:</span>${c('chance', '', 'każda')}${c('chance', 'realna', 'realna')}${c('chance', 'zawalczenia', 'do zawalczenia')}${c('chance', 'ambitna', 'ambitna')}</div>` : ''}
  </div>`;
}
function vSchools() {
  const p = eff();
  const all = data.schools.map(school => ({ school, rows: school.classes.map(cls => ({ school, cls, check: checkClass(p, cls, school, data.config) })) }));
  const shown = all.filter(x => schoolMatch(x.school, ui.q)).map(x => ({ ...x, rows: x.rows.filter(rowPass) })).filter(x => x.rows.length)
    .sort((a, b) => a.school.type.localeCompare(b.school.type) || romanNo(a.school) - romanNo(b.school) || a.school.short.localeCompare(b.school.short, 'pl', { numeric: true }));
  const nCls = shown.reduce((t, x) => t + x.rows.length, 0);
  const entries = shown.map(x => ({ school: x.school, classes: x.rows, best: bestOf(x.rows) }));
  const card = (x, i) => schoolCard({ school: x.school, rows: x.rows, best: bestOf(x.rows) }, i);
  return `<div class="rhead"><div><h1>Szkoły w Krakowie</h1>
    <p class="lead">${data.schools.length} liceów i techników w Krakowie, wszystkie klasy oprócz dwujęzycznych i sportowych. ${hasInput() ? 'Etykiety szans liczymy z tego, jak ci idzie w szkole.' : 'Zaznacz, jak ci idzie w szkole, a zobaczysz też szanse.'}</p>
    ${needResults() ? '' : '<div class="actions"><button class="btn ghost" data-go="wyniki">Mój kompas</button></div>'}</div>${LILLUS.szkoly}</div>
    ${filterBar(true)}
    <p class="count small" role="status">Pokazano ${shown.length} z ${data.schools.length} szkół · ${nCls} klas${ui.q || ui.type || ui.subj || ui.chance ? ' · <button class="linkbtn" data-fclear>wyczyść filtry</button>' : ''}</p>
    ${shown.length ? `<div class="scards">${shown.map(card).join('')}</div>` : `<div class="empty">${LILLUS.pusto}<p>Nic nie pasuje. Tej szkoły może nie być w bazie: Kompas nie ma jeszcze klas dwujęzycznych, sportowych i szkół prywatnych. <button class="linkbtn" data-fclear>Wyczyść filtry</button></p></div>`}
    ${shown.length ? mapBlock(entries, 'Szkoły z listy powyżej.') : ''}
    <p class="note2">Nie ma jeszcze klas dwujęzycznych i sportowych (mają osobny test językowy albo sprawności, dojdą w kolejnej wersji). Pomijamy też XVII i XXV LO, szkoły sportowe, prywatne i technika bez kierunków z Kompasu (np. gastronomia).</p>`;
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
function mapSchools(rows) {
  const by = new Map();
  for (const x of rows) { const e = by.get(x.school.id) || { school: x.school, classes: [] }; e.classes.push(x); by.set(x.school.id, e); }
  return [...by.values()].map(e => ({ ...e, best: bestOf(e.classes) }));
}
let mapEntries = null;
const dirUrl = s => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address || (s.name + ', Kraków'))}&travelmode=transit`;
function mapBlock(list, intro) {
  mapEntries = list;
  return `<h2>Mapa szkół</h2><p class="small muted">${intro} Kolor pinezki pokazuje najlepszą szansę w tej szkole. Położenie pochodzi z OpenStreetMap; dokładny dojazd sprawdź przyciskiem „Dojazd”.</p>
    ${legend()}
    <div class="mapbox" id="map" role="region" aria-label="Mapa szkół w Krakowie"><p class="mapfail muted small">Ładuję mapę…</p></div>`;
}
const legend = () => `<p class="legend small"><span class="mapnum realna" aria-hidden="true"></span> realna <span class="mapnum zawalczenia" aria-hidden="true"></span> do zawalczenia <span class="mapnum ambitna" aria-hidden="true"></span> ambitna <span class="mapnum unknown" aria-hidden="true"></span> bez oceny</p>`;
function mapList(list) {
  return `<ol class="maplist">${list.map((e, i) => `<li><button class="mapnum ${e.best}" data-pin="${e.school.id}" aria-label="Pokaż na mapie: ${esc(e.school.short)}">${i + 1}</button>
      <div><b>${esc(e.school.short)}</b><div class="sub">${e.classes.map(x => esc(x.cls.code)).join(', ')}${e.school.address ? ' · ' + esc(e.school.address) : ''}</div></div>
      <a class="btn ghost small" href="${esc(dirUrl(e.school))}" target="_blank" rel="noopener">Dojazd</a></li>`).join('')}</ol>`;
}
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
        .bindPopup(`<b>${esc(e.school.short)}</b><br>${e.classes.slice(0, 6).map(x => `${esc(x.cls.code)}: ${esc(x.check.chance && x.check.chance !== 'unknown' ? CHANCE_TXT[x.check.chance] : 'bez oceny szans')}`).join('<br>')}`);
      pins[e.school.id] = m; pts.push([g.lat, g.lon]);
    });
    if (pts.length > 1) mapObj.fitBounds(pts, { padding: [30, 30], maxZoom: 14, animate: false }); else if (pts.length) mapObj.setView(pts[0], 14);
    mapObj._pins = pins;
    const miss = list.filter(e => !e.school.geo).map(e => e.school.short);
    if (!pts.length) mapObj.setView([50.0647, 19.945], 12);
    if (miss.length) box.insertAdjacentHTML('afterend', `<p class="small muted">Bez pinezki (brak położenia): ${miss.map(esc).join(', ')}.</p>`);
  }).catch(() => { const f = box.querySelector('.mapfail'); if (f) f.textContent = 'Nie udało się wczytać mapy. Lista poniżej ma przyciski „Dojazd”.'; });
}

// ---- export / load ------------------------------------------------------------------------------------------------
function buildMarkdown() {
  const r = scoreLiceum(A, data), s = r.slots, L = [];
  L.push(`# Kompas Liceum – ${A.name || 'ja'}, ${today()}`, `Ścieżka: wybór liceum i technikum, Kraków · Wersja: v${data.config.appVersion}`, '');
  if (needResults()) {
    L.push('> Zapis postępu: wyniki pojawią się po wypełnieniu pytań. Wczytaj ten plik w Kompasie, żeby kontynuować.', '');
  } else {
    L.push('## Moje mocne strony');
    provenStrengths(A).forEach((x, i) => L.push(`${i + 1}. ${nameOf(x.id)} – dowód: „${x.proof.trim()}”`));
    const P = profilesFor(r, data);
    L.push('', '## Mój kompas');
    P.forEach(x => L.push(`- ${x.compass.pos}: ${x.profile.name} – ${fitWord(x.fit)}${x.compass.pos === 'N' && x.areas[0].reasons.length ? ` (${x.areas[0].reasons.join('; ')})` : ''}`));
    const lk = L0(), lr = likedRows();
    if (nLikes()) {
      L.push('', '## Moja lista');
      lk.profiles.forEach(id => { const p = data.profiles.find(x => x.id === id); if (p) L.push(`- profil: ${p.name}`); });
      lk.schools.forEach(id => { const sc = data.schools.find(x => x.id === id); if (sc) L.push(`- szkoła: ${sc.short}${sc.address ? ', ' + sc.address : ''}`); });
      lr.forEach(x => L.push(`- klasa: ${x.school.short}, ${x.cls.code} (${x.cls.label}): ${x.check.chance && x.check.chance !== 'unknown' ? CHANCE_TXT[x.check.chance] : 'bez oceny szans'}`));
    }
    const selP = P.find(x => x.profile.id === A.profile) || P[0], sel = { card: selP.areas[0].card, classes: selP.classes };
    L.push('', `## Klasy w Krakowie: ${selP.profile.name}`);
    L.push(`Progi z rekrutacji ${data.config.thresholdYear}. ${data.config.thresholdNote}`);
    for (const x of sel.classes.slice(0, 12)) L.push(`- ${x.school.short}, klasa ${x.cls.code} (${x.cls.label}): ${x.check.chance && x.check.chance !== 'unknown' ? CHANCE_TXT[x.check.chance] : 'bez oceny szans'}`);
    L.push('', '## Dla rodziców: progi i szacunek', hasInput() ? (eff().approx ? 'Szacunek z odpowiedzi „słabo, dobrze, świetnie” (słabo = 3 i ok. 45%, dobrze = 4 i ok. 70%, świetnie = 5 i ok. 90%).' : 'Policzone z dokładnych ocen i wyników.') : 'Brak odpowiedzi o szkole, więc bez szacunku.', '');
    for (const x of sel.classes.slice(0, 12)) {
      const th = x.cls.threshold != null ? `próg ${f2(x.cls.threshold)}` : `zakres szkoły ${f2(x.school.range.min)}–${f2(x.school.range.max)}`;
      L.push(`- ${x.school.short}, klasa ${x.cls.code}: ${th}${x.check.complete ? `, szacunek ${f1(x.check.points)}` : ''}`);
    }
    L.push('', '## Mój plan');
    const checks = A.checks || {};
    for (const it of planItems(sel)) L.push(`- [${checks[`${sel.card.id}:${it.id}`] ? 'x' : ' '}] ${it.when}: ${it.text}`);
    L.push('', '## Pytania do rozmowy z rodzicami', '- Która klasa daje ci najwięcej energii, a która tylko dobrze brzmi?', '- Co zrobisz w tym miesiącu, żeby przybliżyć się do wybranej klasy?', '- Jaką klasę wpiszesz jako bezpieczną i czy chcesz w niej się uczyć?', '');
  }
  L.push('<!-- dane do ponownego wczytania -->', '```json', JSON.stringify({ app: 'kompas-liceum', version: data.config.appVersion, dataVersion: data.config.dataVersion, date: today(), answers: A }, null, 1), '```');
  return L.join('\n');
}
function fileName() { const n = (A.name || 'ja').trim().toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, '-') || 'ja'; return `kompas-liceum-${n}-${today()}.md`; }

function loadFile(text) {
  const obj = parseSaved(text);
  if (!obj || !obj.answers || obj.app !== 'kompas-liceum') { notice = 'To nie wygląda na plik z Kompasu Liceum. Wybierz plik pobrany z tej aplikacji.'; render(); return; }
  const a = Object.assign(blank(), obj.answers), missing = [];
  const has = (list, id) => list.some(x => x.id === id);
  const hadMode = (a.points || {}).mode;
  a.points = Object.assign(blank().points, a.points);
  if (!hadMode && (Object.keys(a.points.exam || {}).length || Object.keys(a.points.grades || {}).length)) a.points.mode = 'exact';
  a.strengths = (a.strengths || []).filter(x => has(data.strengths, x.id) || (missing.push('mocna strona: ' + x.id), false));
  a.values = (a.values || []).filter(v => has(data.dimensions.values, v) || (missing.push('wartość: ' + v), false));
  if (!Array.isArray(obj.answers.worlds)) a.worlds = ['all']; // files from before v1.7
  for (const k of Object.keys(a.sort || {})) if (!has(data.questions.activities, k)) { delete a.sort[k]; missing.push('czynność: ' + k); }
  for (const k of Object.keys(a.situations || {})) if (!has(data.questions.situations, k)) { delete a.situations[k]; missing.push('sytuacja: ' + k); }
  if (a.area && !has(data.opportunities, a.area)) { missing.push('kierunek: ' + a.area); a.area = null; }
  { const v = visibleActivities(a, data), i = v.findIndex(x => !(x.id in a.sort)); a.sortPos = i < 0 ? v.length : i; }
  a.sitPos = Object.keys(a.situations).length;
  A = a; savedSnap = answersKey();
  notice = `Wczytano plik z dnia ${esc(obj.date || '?')}.` + (missing.length ? ` Tych rzeczy nie ma już w bazie, więc je pominięto: ${missing.map(esc).join(', ')}.` : '');
  const open = screens.find(s => s.ok && !s.ok()); // first step that still needs an answer
  const target = '#/' + (open ? open.id : 'wyniki');
  notice += open ? ' Wracasz do pierwszego kroku, który czeka na odpowiedź.' : '';
  if (location.hash === target) render(); else location.hash = target;
}

async function doExport(kind) {
  const msg = document.getElementById('fmsg');
  if (kind === 'download') {
    const md = buildMarkdown(), url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' })), name = fileName();
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (msg) msg.textContent = 'Plik zapisany.';
    savedSnap = answersKey(); save();
    toast(`<b>Zapisano:</b> ${esc(name)}<br><span>Plik jest w folderze Pobrane. Żeby wrócić, wczytaj go na ekranie startowym.</span>`);
  } else {
    const closed = [...document.querySelectorAll('details:not([open])')]; closed.forEach(d => { d.open = true; }); window.print(); closed.forEach(d => { d.open = false; });
  }
}

// ---- events -------------------------------------------------------------------------------------------------------
document.addEventListener('click', e => {
  const t = e.target.closest('button, a, [data-prof]'); if (!t || !data) return;
  const d = t.dataset;
  if (d.go) { e.preventDefault(); if (location.hash === '#/' + d.go) render(); else location.hash = '#/' + d.go; return; }
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
  if (d.area) { A.area = d.area; save(); render(); setTimeout(() => document.querySelector('.cls')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 30); return; }
  if (d.soft) { const [kind, key, val] = d.soft.split(':'), tgt = (A.points.soft[kind === 'exam' ? 'exam' : 'grades'] ||= {}); if (tgt[key] === val) delete tgt[key]; else tgt[key] = val; A.points.mode = 'soft'; save(); render(); return; }
  if (d.mode) { A.points.mode = d.mode; save(); render(); return; }
  if (d.prof) { A.profile = d.prof; ui.parea = ''; save(); if (location.hash === '#/profil') render(); else location.hash = '#/profil'; return; }
  if (d.parea !== undefined) { ui.parea = d.parea; render(); return; }
  if (d.sort !== undefined) { ui.sort = d.sort; render(); return; }
  if (d.like) {
    const k = d.like[0], id = d.like.slice(2), arr = L0()[KIND[k]], i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id); save();
    if (current().id === 'lista') { render(); return; }
    const on = i < 0;   // update hearts in place, so the page and the map do not jump
    document.querySelectorAll('[data-like]').forEach(b => { if (b.dataset.like === d.like) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', (on ? 'Usuń z mojej listy' : 'Dodaj do mojej listy') + b.getAttribute('aria-label').replace(/^[^:]*/, '')); } });
    if (k === 's') document.querySelectorAll('.scard').forEach(c => { if (c.querySelector(`[data-like="s:${CSS.escape(id)}"]`)) c.classList.toggle('liked', on); });
    likeCount(); return;
  }
  if (d.f) { const [k, v] = d.f.split(':'); ui[k] = ui[k] === v ? '' : v; render(); return; }
  if ('fclear' in d) { Object.assign(ui, { q: '', type: '', subj: '', chance: '', parea: '' }); render(); return; }
  if (d.pin) { const m = mapObj && mapObj._pins && mapObj._pins[d.pin]; if (m) { document.getElementById('map').scrollIntoView({ block: 'center', behavior: 'smooth' }); mapObj.setView(m.getLatLng(), 15); m.openPopup(); } return; }
  if (d.export) { doExport(d.export); return; }
  if ('themetoggle' in d) { const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; theme = dark ? 'light' : 'dark'; applyTheme(); return; }
  if ('skintoggle' in d) { skin = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length]; applySkin(true); return; }
  if (d.skinpick !== undefined) { skin = d.skinpick || null; applySkin(true); return; }
  if (d.persona) { const p = data.personas.find(x => x.id === d.persona); A = Object.assign(blank(), JSON.parse(JSON.stringify(p.answers))); if (!Array.isArray(p.answers.worlds)) delete A.worlds; A.points = Object.assign(blank().points, A.points); if (!(p.answers.points || {}).mode && Object.keys(A.points.exam || {}).length) A.points.mode = 'exact'; A.sortPos = acts().length; A.sitPos = data.questions.situations.length; if (location.hash === '#/wyniki') render(); else location.hash = '#/wyniki'; }
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

load().catch(err => { $app.innerHTML = `<p>Nie udało się wczytać danych (${esc(err.message)}). Odśwież stronę.</p>`; });
