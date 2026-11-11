// Kompas Liceum v1.4.0. Screens, soft school self-assessment, results and export. Kraków only; sciences and IT first.
import { provenStrengths } from '../core/scoring.js';
import { scoreLiceum, examPoints, certificatePoints, scoredSubjects, shortlist, levers, effectivePoints, LEVEL_TXT, CHANCE_TXT, SUBJECT_NAME } from './points.js';
import { icon } from '../studia/icons.js';
import { ILLUS } from '../studia/illus.js';

const $app = document.getElementById('app');
const TEST = new URLSearchParams(location.search).has('test');
let data, A, studiaOffers = [];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const f1 = n => Number(n).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f2 = n => Number(n).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const blank = () => ({ name: '', sort: {}, sortPos: 0, situations: {}, sitPos: 0, sliders: {}, values: [], strengths: [],
  points: { mode: 'soft', soft: { exam: {}, grades: {} }, exam: {}, grades: {}, stripe: false, volunteering: false, achievements: 0 }, area: null, checks: {}, reflection: {} });

async function load() {
  const get = p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  const [dimensions, strengths, config, questions, opportunities, schools, sources, personas] = await Promise.all([
    '../core/dimensions.json', '../core/strengths.json', 'data/config.json', 'data/questions.json', 'data/opportunities.json',
    'data/db/pl/krakow/schools.json', 'data/sources.json', 'data/personas.json'].map(get));
  data = { dimensions, strengths, config, questions, opportunities, schools, sources, personas };
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
const SKINS = [null, 'neon', 'pop'], SKIN_NAME = { null: 'Spokojny', neon: 'Neon', pop: 'Pop art' };
let skin = SKINS.includes(new URLSearchParams(location.search).get('skin')) ? new URLSearchParams(location.search).get('skin') : null;
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
  document.querySelectorAll('[data-themetoggle]').forEach(b => { b.setAttribute('aria-label', dark ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'); b.innerHTML = dark ? ICON.sun : ICON.moon; });
}
function applySkin(animate) {
  const root = document.documentElement;
  if (skin) root.dataset.skin = skin; else delete root.dataset.skin;
  const next = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length];
  document.querySelectorAll('[data-skintoggle]').forEach(b => { b.setAttribute('aria-pressed', String(!!skin)); b.setAttribute('aria-label', `Wygląd: ${SKIN_NAME[skin]}. Zmień na: ${SKIN_NAME[next]}`); b.innerHTML = ICON.palette; });
  document.querySelectorAll('[data-skinpick]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.skinpick || null) === skin)));
  const u = new URL(location.href);
  if (skin) u.searchParams.set('skin', skin); else u.searchParams.delete('skin');
  history.replaceState(null, '', u);
  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('skin-in'); void root.offsetWidth; root.classList.add('skin-in');
    clearTimeout(applySkin.h); applySkin.h = setTimeout(() => root.classList.remove('skin-in'), 700);
  }
}

// ---- screens ------------------------------------------------------------------------------------------------------
const chip = (attrs, label, on) => `<button class="chip" ${attrs} aria-pressed="${on ? 'true' : 'false'}">${label}</button>`;
const nameOf = id => (data.strengths.find(s => s.id === id) || {}).name || id;
const screens = [
  { id: 'start', ch: null, view: vStart },
  { id: 'zajecia', ch: 'ja', view: vSort, ok: () => A.sortPos >= data.questions.activities.length, hint: () => `Zostało kart: ${data.questions.activities.length - A.sortPos}` },
  { id: 'sytuacje', ch: 'ja', view: vSituations },
  { id: 'styl', ch: 'ja', view: vStyle },
  { id: 'wartosci', ch: 'ja', view: vValues, ok: () => A.values.length === 3, hint: () => `Wybierz jeszcze ${3 - A.values.length}` },
  { id: 'mocne', ch: 'ja', view: vStrengths, ok: () => provenStrengths(A).length === 3,
    hint: () => A.strengths.length < 3 ? `Wybierz jeszcze ${3 - A.strengths.length}` : `Dopisz przykład: ${A.strengths.filter(x => !x.proof.trim()).map(x => nameOf(x.id)).join(', ')}` },
  { id: 'szkola', ch: 'szkola', view: vSchool },
  { id: 'wyniki', ch: 'wyniki', view: vResults }
];
const STEP_TITLE = { zajecia: 'Co lubisz robić', sytuacje: 'Co robisz, gdy…', styl: 'Styl pracy', wartosci: 'Co jest ważne', mocne: 'Mocne strony', szkola: 'Jak ci idzie w szkole' };
const current = () => screens.find(s => s.id === ((location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'start')) || screens[0];
const needResults = () => !(A.sortPos >= data.questions.activities.length && A.values.length === 3 && provenStrengths(A).length === 3);

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
    <button class="btn" data-go="${screens[i + 1].id}" ${blocked ? 'disabled' : ''} aria-describedby="navhint">${s.id === 'szkola' ? 'Pokaż wyniki' : 'Dalej'}</button></div>`;
  const progW = Math.round(100 * (idx + 1) / list.length), progFrom = inQ && lastProg.ch === 'q' ? lastProg.w : 0;
  lastProg = inQ ? { ch: 'q', w: progW } : { ch: null, w: 0 };
  const crumb = inQ ? `<p class="crumb2"><b>${STEP_TITLE[s.id]}</b> · krok ${idx + 1} z ${list.length}</p><div class="prog2" aria-hidden="true"><i style="width:${progFrom}%" data-to="${progW}"></i></div>` : '';
  const note = notice ? `<p class="notice" role="status">${notice}</p>` : ''; notice = '';
  if (s.id === 'wyniki' && needResults()) { $app.innerHTML = vGate(); document.body.classList.remove('wide'); $app.dataset.screen = 'gate'; applySkin(); return; }
  const keep = document.activeElement && document.activeElement.id, changed = $app.dataset.screen !== s.id;
  const prevIdx = screens.findIndex(x => x.id === $app.dataset.screen);
  const dir = !changed ? '' : prevIdx > i ? 'slide-b' : 'slide-f';
  document.body.classList.toggle('wide', s.id === 'wyniki');
  if (mapObj) { mapObj.remove(); mapObj = null; }
  $app.innerHTML = `<div class="qmain ${dir}">${crumb}${note}${s.view()}${nav}</div>`;
  $app.dataset.screen = s.id; save(); applySkin();
  const pi = $app.querySelector('.prog2 i[data-to]');
  if (pi) requestAnimationFrame(() => requestAnimationFrame(() => { pi.style.width = pi.dataset.to + '%'; }));
  if (changed) { const b = document.querySelector('.brand'); if (b) { b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); } }
  if (changed) { window.scrollTo(0, 0); $app.focus({ preventScroll: true }); }
  else if (keep && document.getElementById(keep)) { const el = document.getElementById(keep); el.focus(); if (el.setSelectionRange && el.value && el.type === 'text') el.setSelectionRange(el.value.length, el.value.length); }
  if (s.id === 'szkola') liveUpdate();
  if (s.id === 'wyniki') { const r0 = scoreLiceum(A, data), id = (A.area && r0.cards.some(c => c.card.id === A.area)) ? A.area : r0.slots.best[0].card.id; initMap(r0.cards.find(c => c.card.id === id)); }
}

function vGate() {
  const miss = [];
  if (A.sortPos < data.questions.activities.length) miss.push('karty „Co lubisz robić”');
  if (A.values.length < 3) miss.push('trzy rzeczy, które są dla ciebie ważne');
  if (provenStrengths(A).length < 3) miss.push('trzy mocne strony z przykładem');
  return `<h1>Najpierw kilka pytań</h1><p>Żeby pokazać klasy, które do ciebie pasują, brakuje jeszcze: ${miss.map(esc).join(', ')}.</p>
    <div class="actions"><button class="btn" data-go="zajecia">Wróć do pytań</button></div>`;
}

function vStart() {
  const started = hasAnswers();
  const nCls = data.schools.reduce((t, x) => t + x.classes.length, 0);
  const steps = [['Ja', 'co lubisz, jak pracujesz, w czym jesteś dobry', 'ok. 8 min'], ['Szkoła', 'jak ci idzie w szkole, bez liczenia punktów', 'ok. 2 min'], ['Wyniki', 'kierunki, klasy w Krakowie i plan do maja 2027', '']];
  return `<div class="hero">${ILLUS.start}<div>
    <span class="kicker2">Kompas Liceum · Kraków 2027 · matematyka, informatyka, przyroda</span>
    <h1>Jaka klasa pasuje do tego, co lubisz?</h1>
    <p class="lead">Kilka pytań o to, co lubisz robić, i krótko o tym, jak ci idzie w szkole. Na końcu zobaczysz kierunki oraz klasy w krakowskich liceach i technikach, które są realne, a które ambitne.</p>
    <ol class="steps2">${steps.map((x, k) => `<li><span class="rno">${k + 1}</span><div><b>${x[0]}</b><span class="t">${x[1]}${x[2] ? ' · ' + x[2] : ''}</span></div></li>`).join('')}</ol>
    ${started ? '<p><b>Masz już odpowiedzi.</b> Możesz wrócić do pytań albo od razu do wyników.</p>' : ''}
    <div class="startrow"><div><label class="field" for="name">Imię <span class="muted">(opcjonalnie, tylko do nazwy pliku)</span></label>
      <input id="name" type="text" data-field="name" value="${esc(A.name)}" autocomplete="off"></div>
      <button class="btn big" data-go="zajecia">${started ? 'Wróć do pytań' : 'Zaczynamy'}</button></div>
    ${started && !needResults() ? '<div class="actions"><button class="btn ghost" data-go="wyniki">Moje wyniki</button></div>' : ''}
    <p class="muted small">Nie ma złych odpowiedzi. To punkt wyjścia do rozmowy z rodzicami i nauczycielami: nie test i nie wyrok.</p>
    <div class="note2"><b>Co jest w bazie.</b> ${data.schools.length} szkół i ${nCls} klas w Krakowie z matematyką, fizyką, informatyką, biologią, chemią i geografią. Progi są z rekrutacji 2026, więc to orientacja, nie obietnica.</div>
    <div class="skinpick" role="group" aria-label="Wygląd aplikacji"><span class="small muted">Wygląd:</span>
      <button class="chip" data-skinpick="" aria-pressed="${!skin}">Spokojny</button><button class="chip" data-skinpick="neon" aria-pressed="${skin === 'neon'}">Neon</button><button class="chip" data-skinpick="pop" aria-pressed="${skin === 'pop'}">Pop art</button></div>
    ${TEST ? `<details class="card"><summary>Tryb testowy</summary><div class="actions">${data.personas.map(p => `<button class="btn ghost" data-persona="${p.id}">${esc(p.label)}</button>`).join('')}</div></details>` : ''}
  </div></div>`;
}

function vSort() {
  const acts = data.questions.activities, n = acts.length, pos = Math.min(A.sortPos, n);
  const dots = `<div class="dots" aria-hidden="true">${acts.map((_, i) => `<i class="${i < pos ? 'done' : ''}"></i>`).join('')}</div>`;
  if (pos >= n) {
    const liked = acts.filter(a => A.sort[a.id] === 1).map(a => `<li>${esc(a.text)}</li>`).join('');
    return `<h1>Co lubisz robić</h1><div class="card"><p>Lubisz:</p><ul>${liked || '<li class="muted">nic nie zaznaczyłeś, to też jest odpowiedź</li>'}</ul><button class="btn ghost" data-sortreset>Przejdź jeszcze raz</button></div>${dots}`;
  }
  const a = acts[pos];
  return `${A.sortPos === 0 ? ILLUS.zajecia : ''}<h1>Co lubisz robić</h1><p class="muted">Bez zastanawiania się. Chodzi o samą czynność, nie o zawód. Kartę możesz też przesunąć w prawo (lubię) albo w lewo (nie lubię).</p>
    <div class="card sort"><p class="sortcount">${pos + 1} z ${n}</p><div class="q">${esc(a.text)}</div>
      <div class="row"><button class="btn ghost" data-sortans="-1">nie lubię</button><button class="btn" data-sortans="1">lubię</button></div>
      <button class="chip" data-sortans="0" style="margin-top:12px">obojętne, pomiń</button>${pos > 0 ? '<button class="chip" data-sortback style="margin-top:12px">cofnij</button>' : ''}
      <p class="keys" aria-hidden="true"><kbd>←</kbd> nie lubię · <kbd>→</kbd> lubię · <kbd>↓</kbd> pomiń</p></div>${dots}`;
}
function sortAnswer(v) { const a = data.questions.activities[A.sortPos]; if (!a) return; A.sort[a.id] = v; A.sortPos++; render(); }
let swipe = null;
document.addEventListener('pointerdown', e => { const c = e.target.closest('.card.sort'); if (c && !e.target.closest('button')) swipe = { x: e.clientX, c }; });
document.addEventListener('pointermove', e => { if (swipe) { const dx = e.clientX - swipe.x; swipe.c.style.transform = `translateX(${dx}px) rotate(${dx / 40}deg)`; swipe.c.dataset.lean = dx > 30 ? 'r' : dx < -30 ? 'l' : ''; } });
document.addEventListener('pointerup', e => { if (!swipe) return; const dx = e.clientX - swipe.x, c = swipe.c; swipe = null; c.style.transform = ''; if (Math.abs(dx) > 70) sortAnswer(dx > 0 ? 1 : -1); else c.dataset.lean = ''; });
document.addEventListener('pointercancel', () => { if (swipe) { swipe.c.style.transform = ''; swipe = null; } });
document.addEventListener('keydown', e => {
  if (current().id !== 'zajecia' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || A.sortPos >= data.questions.activities.length) return;
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
  return `${A.sitPos === 0 ? ILLUS.sytuacje : ''}<h1>Co robisz, gdy…</h1><p class="muted">Wybierz to, co zrobiłbyś naprawdę, nie to, co wypada.</p>
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

function vStrengths() {
  const picked = A.strengths.map(s => s.id);
  const list = A.strengths.map(s => { const st = data.strengths.find(x => x.id === s.id);
    return `<div class="strength"><label class="field" for="pr-${s.id}">${esc(st.name)}: kiedy to pokazałeś? Jedno zdanie wystarczy.</label>
      <input id="pr-${s.id}" type="text" data-proof="${s.id}" value="${esc(s.proof)}" placeholder="${esc(st.example)}"></div>`; }).join('');
  return `<h1>Twoje mocne strony</h1><p>Wybierz trzy rzeczy, które ci wychodzą. Do każdej dopisz jeden przykład z życia: szkoła, sport, dom, hobby. <span class="pickn">${A.strengths.length} z 3</span></p>
    <div class="chips">${data.strengths.map(s => chip(`data-strength="${s.id}"`, s.name, picked.includes(s.id))).join('')}</div>
    ${list ? `<div class="card">${list}</div>` : ''}<p class="small muted">Mocna strona liczy się dopiero z przykładem. Przykład nie musi być wielki.</p>`;
}

// ---- school self-assessment (soft by default, exact marks optional) -----------------------------------------------
const SOFT = [['slabo', 'słabo'], ['dobrze', 'dobrze'], ['swietnie', 'świetnie']];
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const hasExactData = () => Object.keys(A.points.exam || {}).length > 0 || Object.keys(A.points.grades || {}).length > 0;
const pMode = () => A.points.mode || (hasExactData() ? 'exact' : 'soft');
const eff = () => effectivePoints(A, data.config);
const hasInput = () => { const e = eff(); return Object.keys(e.exam || {}).length > 0 || Object.keys(e.grades || {}).length > 0; };
const softRow = (kind, key, label) => {
  const cur = ((A.points.soft || {})[kind] || {})[key];
  return `<div class="softrow"><span class="sl" id="sr-${kind}-${key}">${esc(label)}</span><div class="chips" role="group" aria-labelledby="sr-${kind}-${key}">${SOFT.map(([v, t]) => chip(`data-soft="${kind}:${key}:${v}"`, t, cur === v)).join('')}</div></div>`;
};
function parentNote() {
  const c = data.config, so = c.soft;
  return `<details class="parent"><summary>Dla rodziców: jak to liczymy</summary>
    <p class="small">Odpowiedzi „słabo / dobrze / świetnie” zamieniamy na typowe wartości: <b>słabo</b> to ocena ${so.slabo.grade} i ok. ${so.slabo.exam}% na egzaminie, <b>dobrze</b> to ${so.dobrze.grade} i ok. ${so.dobrze.exam}%, <b>świetnie</b> to ${so.swietnie.grade} i ok. ${so.swietnie.exam}%. Przedmiot bez odpowiedzi liczymy jak „dobrze”.</p>
    <p class="small">Z tego powstaje szacunek punktów rekrutacyjnych (maksymalnie 200): egzamin ósmoklasisty daje do 100 pkt (polski 0,35, matematyka 0,35, język obcy 0,30 × wynik w procentach), świadectwo do 100 pkt (polski, matematyka i dwa przedmioty zależne od klasy: ocena 6 = 18, 5 = 17, 4 = 14, 3 = 8, 2 = 2 pkt) oraz dodatki za pasek, wolontariat i osiągnięcia.</p>
    <p class="small">Szacunek porównujemy z progami z rekrutacji ${esc(c.thresholdYear)}. Zapas co najmniej ${c.chanceMargin} pkt to <b>realna szansa</b>, od −${c.chanceMargin} do +${c.chanceMargin} pkt to <b>do zawalczenia</b>, niżej to <b>ambitna</b>. To orientacja do rozmowy, nie prognoza: progi zmieniają się co roku, a przed egzaminem nikt nie zna swojego wyniku. Dokładne punkty warto policzyć w drugim semestrze albo w oficjalnym kalkulatorze rekrutacji.</p></details>`;
}
function vSchool() {
  const p = A.points, ex = p.exam, g = p.grades, mode = pMode();
  const subj = data.questions.grades;
  const main = subj.filter(s => !['historia', 'wos'].includes(s)), rest = subj.filter(s => ['historia', 'wos'].includes(s));
  let body;
  if (mode === 'soft') {
    body = `<div class="card"><h3>Egzamin ósmoklasisty</h3><p class="small muted">Jak myślisz, jak ci pójdzie? Strzał wystarczy, nic tu nie jest wiążące.</p>
        ${softRow('exam', 'polski', 'Język polski')}${softRow('exam', 'matematyka', 'Matematyka')}${softRow('exam', 'obcy', 'Język obcy (angielski)')}</div>
      <div class="card"><h3>Przedmioty w szkole</h3><p class="small muted">Jak ci idzie teraz? Zaznacz te, które znasz, resztę pomiń.</p>
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
  return `<h1>Jak ci idzie w szkole?</h1>
    <p>Nie liczymy tu dokładnych punktów, bo wyniki jeszcze nie są znane. Zaznacz, jak się czujesz z danym przedmiotem. Na tej podstawie pokażemy, które klasy są dla ciebie <b>realne</b>, a które <b>ambitne</b>. Cel to pomysły i opcje, nie przewidywanie wyniku.</p>
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
function vResults() {
  const r = scoreLiceum(A, data), s = r.slots;
  const shown = [...s.best, s.most, s.surprise].filter(Boolean);
  const selId = (A.area && r.cards.some(c => c.card.id === A.area)) ? A.area : s.best[0].card.id;
  const sel = r.cards.find(c => c.card.id === selId);
  const items = planItems(sel), sl = shortlist(r);
  const rows = sel.classes, more = rows.slice(8);
  const tag = c => c === s.most ? 'Most' : c === s.surprise ? 'Niespodzianka' : `Opcja ${s.best.indexOf(c) + 1}`;
  const stud = studiaFor(sel.card);
  const names = data.schools.map(x => x.short).join(', ');
  return `<div class="sectionhead"><h1>${esc(A.name ? A.name + ', oto' : 'Oto')} twoje kierunki</h1><button class="btn ghost" data-go="szkola">Zmień, jak ci idzie</button></div>
    <p class="lead">Kierunek to rodzaj pracy, który do ciebie pasuje. Z niego wynika klasa i szkoła. Zacznij od kierunku, nie od progu.</p>
    <div class="areas">${shown.map((c, i) => areaCard(tag(c), c, c.card.id === selId, i)).join('')}</div>
    <div class="extra"><label class="small" for="allareas">Inny kierunek:</label>
      <select id="allareas" data-areasel>${r.cards.map(c => `<option value="${c.card.id}" ${c.card.id === selId ? 'selected' : ''}>${esc(c.card.name)}</option>`).join('')}</select></div>

    <h2>Klasy w Krakowie: ${esc(sel.card.name.toLowerCase())}</h2>
    ${!hasInput() ? '<p class="note2">Nie zaznaczyłeś jeszcze, jak ci idzie w szkole, więc widzisz klasy bez oceny szans. <button class="linkbtn" data-go="szkola">Zaznacz, jak ci idzie</button></p>' : ''}
    <p class="small muted">Etykieta „realna”, „do zawalczenia” albo „ambitna” to orientacja na podstawie zeszłorocznych progów. Klasy z kierunkiem na pierwszym miejscu są u góry.</p>
    <ul class="cls">${rows.slice(0, 8).map(classRow).join('')}</ul>
    ${more.length ? `<details><summary>Jeszcze ${more.length} klas</summary><ul class="cls" style="margin-top:8px">${more.map(classRow).join('')}</ul></details>` : ''}
    ${parentTable(rows)}
    ${mapBlock(sel)}

    ${sl.length ? `<h2>Propozycja listy do wniosku</h2><p class="small muted">Z kierunku „${esc(s.best[0].card.name)}”. W rekrutacji wybierasz kilka klas i układasz je od najbardziej wymarzonej.</p>
      <div class="short">${sl.map(x => `<div class="card"><span class="role">${ROLE_TXT[x.role] || x.role}</span><h3>${esc(x.c.school.short)}</h3><p class="small">klasa ${esc(x.c.cls.code)} · ${esc(x.c.cls.label)}</p>${pill(x.c.check)}</div>`).join('')}</div>` : ''}

    <h2>Co potem</h2>
    <div class="card"><p>${esc(sel.card.afterSchool)}</p>
      ${stud.length ? `<p class="small muted">Przykłady z Kompasu Studia:</p><ul class="small">${stud.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="small muted">Za trzy lata sprawdzisz to dokładniej w <a href="../studia/">Kompasie Studia</a>.</p></div>

    <h2>Plan do maja 2027</h2>
    <ul class="plan">${items.map(it => `<li><input type="checkbox" id="pl-${it.id}" data-check="${sel.card.id}:${it.id}" ${A.checks[`${sel.card.id}:${it.id}`] ? 'checked' : ''}>
      <label for="pl-${it.id}"><span class="when">${esc(it.when)}</span>${esc(it.text)}</label></li>`).join('')}</ul>

    <h2>Czego jeszcze nie ma w bazie</h2>
    <p class="note2">Są: ${esc(names)}. Brakuje jeszcze m.in. XLI LO, XVI LO i kilku innych techników z informatyką (np. Technikum Komunikacyjnego nr 25). Progi klas oznaczone „do sprawdzenia” pochodzą z serwisów, które nie zawsze podają rok. Przed decyzją sprawdź je na stronie szkoły i w ogłoszeniu kuratora.</p>
    <div class="actions noprint"><button class="btn" data-export="download">Zapisz plik z wynikami</button><button class="btn ghost" data-export="print">Drukuj</button></div>
    <details class="card"><summary>Źródła</summary><ul class="small">${data.sources.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a> · stan ${esc(x.asOf)}</li>`).join('')}</ul></details>`;
}

// ---- map (Leaflet + OpenStreetMap tiles, loaded only when results open) ------------------------------------------------
let mapObj = null, leafletP = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return leafletP ||= new Promise((res, rej) => {
    const css = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css' });
    const js = Object.assign(document.createElement('script'), { src: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', onload: () => res(window.L), onerror: () => { leafletP = null; rej(new Error('leaflet')); } });
    document.head.append(css, js);
  });
}
const CHANCE_RANK = { realna: 3, zawalczenia: 2, ambitna: 1 };
function mapSchools(sel) {
  const by = new Map();
  for (const x of sel.classes) {
    const e = by.get(x.school.id) || { school: x.school, best: x.check.chance || 'unknown', classes: [] };
    if ((CHANCE_RANK[x.check.chance] || 0) > (CHANCE_RANK[e.best] || 0)) e.best = x.check.chance;
    e.classes.push(x); by.set(x.school.id, e);
  }
  return [...by.values()];
}
const dirUrl = s => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address || (s.name + ', Kraków'))}&travelmode=transit`;
function mapBlock(sel) {
  const list = mapSchools(sel);
  return `<h2>Mapa szkół</h2><p class="small muted">Szkoły z klasami z kierunku „${esc(sel.card.name.toLowerCase())}”. Kolor pinezki pokazuje najlepszą szansę w tej szkole. Położenie pochodzi z OpenStreetMap; dokładny dojazd sprawdź przyciskiem „Dojazd”.</p>
    <div class="mapbox" id="map" role="region" aria-label="Mapa szkół w Krakowie"><p class="mapfail muted small">Ładuję mapę…</p></div>
    <ol class="maplist">${list.map((e, i) => `<li><button class="mapnum ${e.best}" data-pin="${e.school.id}" aria-label="Pokaż na mapie: ${esc(e.school.short)}">${i + 1}</button>
      <div><b>${esc(e.school.short)}</b><div class="sub">${e.classes.map(x => esc(x.cls.code)).join(', ')}${e.school.address ? ' · ' + esc(e.school.address) : ''}</div></div>
      <a class="btn ghost small" href="${esc(dirUrl(e.school))}" target="_blank" rel="noopener">Dojazd</a></li>`).join('')}</ol>`;
}
function initMap(sel) {
  const box = document.getElementById('map'); if (!box) return;
  const list = mapSchools(sel);
  loadLeaflet().then(L => {
    if (!document.getElementById('map') || document.getElementById('map') !== box) return;
    if (mapObj) { mapObj.remove(); mapObj = null; }
    mapObj = L.map(box, { scrollWheelZoom: false }).setView([50.0647, 19.945], 12);
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
    if (pts.length > 1) mapObj.fitBounds(pts, { padding: [30, 30], maxZoom: 14 }); else if (pts.length) mapObj.setView(pts[0], 14);
    mapObj._pins = pins;
    const miss = list.filter(e => !e.school.geo).map(e => e.school.short);
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
    L.push('', '## Kierunki');
    [...s.best, s.most, s.surprise].filter(Boolean).forEach(c => L.push(`- ${c.card.name} – ${c.band}${c.reasons.length ? ` (${c.reasons.join('; ')})` : ''}`));
    const sel = r.cards.find(c => c.card.id === (A.area || s.best[0].card.id));
    L.push('', `## Klasy w Krakowie: ${sel.card.name}`);
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
  const m = text.match(/```json\s*([\s\S]*?)```/g);
  let obj = null;
  try { obj = m && JSON.parse(m[m.length - 1].replace(/^```json\s*/, '').replace(/```$/, '')); } catch { obj = null; }
  if (!obj || !obj.answers || obj.app !== 'kompas-liceum') { notice = 'To nie wygląda na plik z Kompasu Liceum. Wybierz plik pobrany z tej aplikacji.'; render(); return; }
  const a = Object.assign(blank(), obj.answers), missing = [];
  const has = (list, id) => list.some(x => x.id === id);
  const hadMode = (a.points || {}).mode;
  a.points = Object.assign(blank().points, a.points);
  if (!hadMode && (Object.keys(a.points.exam || {}).length || Object.keys(a.points.grades || {}).length)) a.points.mode = 'exact';
  a.strengths = (a.strengths || []).filter(x => has(data.strengths, x.id) || (missing.push('mocna strona: ' + x.id), false));
  a.values = (a.values || []).filter(v => has(data.dimensions.values, v) || (missing.push('wartość: ' + v), false));
  for (const k of Object.keys(a.sort || {})) if (!has(data.questions.activities, k)) { delete a.sort[k]; missing.push('czynność: ' + k); }
  for (const k of Object.keys(a.situations || {})) if (!has(data.questions.situations, k)) { delete a.situations[k]; missing.push('sytuacja: ' + k); }
  if (a.area && !has(data.opportunities, a.area)) { missing.push('kierunek: ' + a.area); a.area = null; }
  a.sortPos = Math.min(Object.keys(a.sort).length, data.questions.activities.length);
  a.sitPos = Object.keys(a.situations).length;
  A = a; savedSnap = answersKey();
  notice = `Wczytano plik z dnia ${esc(obj.date || '?')}.` + (missing.length ? ` Tych rzeczy nie ma już w bazie, więc je pominięto: ${missing.map(esc).join(', ')}.` : '');
  const target = needResults() ? '#/zajecia' : '#/wyniki';
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
  const t = e.target.closest('button, a'); if (!t || !data) return;
  const d = t.dataset;
  if (d.go) { e.preventDefault(); if (location.hash === '#/' + d.go) render(); else location.hash = '#/' + d.go; return; }
  if (d.sortans !== undefined) { sortAnswer(Number(d.sortans)); return; }
  if ('sortback' in d) { A.sortPos = Math.max(0, A.sortPos - 1); delete A.sort[data.questions.activities[A.sortPos].id]; render(); return; }
  if ('sortreset' in d) { A.sortPos = 0; render(); return; }
  if (d.sitans !== undefined) { const q = data.questions.situations[A.sitPos]; if (d.sitans) A.situations[q.id] = d.sitans; else delete A.situations[q.id]; A.sitPos++; render(); return; }
  if ('sitback' in d) { A.sitPos = Math.max(0, A.sitPos - 1); render(); return; }
  if ('sitreset' in d) { A.sitPos = 0; render(); return; }
  if (d.value) { const i = A.values.indexOf(d.value); if (i >= 0) A.values.splice(i, 1); else if (A.values.length < 3) A.values.push(d.value); save(); render(); return; }
  if (d.strength) { const i = A.strengths.findIndex(s => s.id === d.strength); if (i >= 0) A.strengths.splice(i, 1); else if (A.strengths.length < 3) A.strengths.push({ id: d.strength, proof: '' }); save(); render(); return; }
  if (d.area) { A.area = d.area; save(); render(); setTimeout(() => document.querySelector('.cls')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 30); return; }
  if (d.soft) { const [kind, key, val] = d.soft.split(':'), tgt = (A.points.soft[kind === 'exam' ? 'exam' : 'grades'] ||= {}); if (tgt[key] === val) delete tgt[key]; else tgt[key] = val; A.points.mode = 'soft'; save(); render(); return; }
  if (d.mode) { A.points.mode = d.mode; save(); render(); return; }
  if (d.pin) { const m = mapObj && mapObj._pins && mapObj._pins[d.pin]; if (m) { document.getElementById('map').scrollIntoView({ block: 'center', behavior: 'smooth' }); mapObj.setView(m.getLatLng(), 15); m.openPopup(); } return; }
  if (d.export) { doExport(d.export); return; }
  if ('themetoggle' in d) { const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; theme = dark ? 'light' : 'dark'; applyTheme(); return; }
  if ('skintoggle' in d) { skin = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length]; applySkin(true); return; }
  if (d.skinpick !== undefined) { skin = d.skinpick || null; applySkin(true); return; }
  if (d.persona) { const p = data.personas.find(x => x.id === d.persona); A = Object.assign(blank(), JSON.parse(JSON.stringify(p.answers))); A.points = Object.assign(blank().points, A.points); if (!A.points.mode && Object.keys(A.points.exam || {}).length) A.points.mode = 'exact'; A.sortPos = data.questions.activities.length; A.sitPos = data.questions.situations.length; if (location.hash === '#/wyniki') render(); else location.hash = '#/wyniki'; }
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
