// Kompas Liceum v1.2.0. Screens, points form, results and export. Kraków only; sciences and IT first.
import { provenStrengths } from '../core/scoring.js';
import { scoreLiceum, examPoints, certificatePoints, scoredSubjects, shortlist, levers, LEVEL_TXT, SUBJECT_NAME } from './points.js';

const $app = document.getElementById('app');
const TEST = new URLSearchParams(location.search).has('test');
let data, A, studiaOffers = [];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const f1 = n => Number(n).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f2 = n => Number(n).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const blank = () => ({ name: '', sort: {}, sortPos: 0, situations: {}, sitPos: 0, sliders: {}, values: [], strengths: [],
  points: { exam: {}, grades: {}, stripe: false, volunteering: false, achievements: 0, skipped: false }, area: null, checks: {}, reflection: {} });

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
function applySkin() {
  const root = document.documentElement;
  if (skin) root.dataset.skin = skin; else delete root.dataset.skin;
  const next = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length];
  document.querySelectorAll('[data-skintoggle]').forEach(b => { b.setAttribute('aria-pressed', String(!!skin)); b.setAttribute('aria-label', `Wygląd: ${SKIN_NAME[skin]}. Zmień na: ${SKIN_NAME[next]}`); b.innerHTML = ICON.palette; });
  document.querySelectorAll('[data-skinpick]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.skinpick || null) === skin)));
  const u = new URL(location.href);
  if (skin) u.searchParams.set('skin', skin); else u.searchParams.delete('skin');
  history.replaceState(null, '', u);
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
  { id: 'punkty', ch: 'punkty', view: vPoints },
  { id: 'wyniki', ch: 'wyniki', view: vResults }
];
const STEP_TITLE = { zajecia: 'Co lubisz robić', sytuacje: 'Co robisz, gdy…', styl: 'Styl pracy', wartosci: 'Co jest ważne', mocne: 'Mocne strony', punkty: 'Twoje punkty' };
const current = () => screens.find(s => s.id === ((location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'start')) || screens[0];
const needResults = () => !(A.sortPos >= data.questions.activities.length && A.values.length === 3 && provenStrengths(A).length === 3);

function render() {
  const s = current(), i = screens.indexOf(s);
  document.querySelectorAll('.chapters [data-ch]').forEach(el => { el.classList.toggle('on', el.dataset.ch === s.ch); el.setAttribute('aria-current', el.dataset.ch === s.ch ? 'step' : 'false'); });
  const inQ = s.ch === 'ja' || s.ch === 'punkty';
  const list = screens.filter(x => x.ch === 'ja' || x.ch === 'punkty');
  const idx = list.indexOf(s);
  const blocked = !!(s.ok && !s.ok());
  const nav = !inQ ? '' : `<div class="nav"><button class="btn ghost" data-go="${screens[i - 1].id}">Wstecz</button>
    <p class="navhint" id="navhint" role="status">${blocked && s.hint ? esc(s.hint()) : ''}</p>
    <button class="btn" data-go="${screens[i + 1].id}" ${blocked ? 'disabled' : ''} aria-describedby="navhint">${s.id === 'punkty' ? 'Pokaż wyniki' : 'Dalej'}</button></div>`;
  const crumb = inQ ? `<p class="crumb2"><b>${STEP_TITLE[s.id]}</b> · krok ${idx + 1} z ${list.length}</p><div class="prog2" aria-hidden="true"><i style="width:${Math.round(100 * (idx + 1) / list.length)}%"></i></div>` : '';
  const note = notice ? `<p class="notice" role="status">${notice}</p>` : ''; notice = '';
  if (s.id === 'wyniki' && needResults()) { $app.innerHTML = vGate(); document.body.classList.remove('wide'); $app.dataset.screen = 'gate'; applySkin(); return; }
  const keep = document.activeElement && document.activeElement.id, changed = $app.dataset.screen !== s.id;
  document.body.classList.toggle('wide', s.id === 'wyniki');
  $app.innerHTML = `${crumb}${note}${s.view()}${nav}`;
  $app.dataset.screen = s.id; save(); applySkin();
  if (changed) { window.scrollTo(0, 0); $app.focus({ preventScroll: true }); }
  else if (keep && document.getElementById(keep)) { const el = document.getElementById(keep); el.focus(); if (el.setSelectionRange && el.value && el.type === 'text') el.setSelectionRange(el.value.length, el.value.length); }
  if (s.id === 'punkty') liveUpdate();
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
  const steps = [['Ja', 'co lubisz, jak pracujesz, w czym jesteś dobry', 'ok. 8 min'], ['Punkty', 'twoje oceny i wynik egzaminu, żeby porównać je z progami', 'ok. 3 min'], ['Wyniki', 'kierunki, klasy w Krakowie z progami i plan do maja 2027', '']];
  return `<div class="hero2"><span class="kicker2">Kompas Liceum · Kraków 2027 · matematyka, informatyka, przyroda</span>
    <h1>Jaka klasa pasuje do tego, co lubisz?</h1>
    <p class="lead">Kilka pytań o to, co lubisz robić, i twoje punkty z egzaminu ósmoklasisty. Na końcu zobaczysz kierunki, klasy w krakowskich liceach i technikach oraz to, ile punktów brakuje albo zostaje ci zapasu.</p>
    <ol class="steps2">${steps.map((x, k) => `<li><span class="rno">${k + 1}</span><div><b>${x[0]}</b><span class="t">${x[1]}${x[2] ? ' · ' + x[2] : ''}</span></div></li>`).join('')}</ol>
    ${started ? '<p><b>Masz już odpowiedzi.</b> Możesz wrócić do pytań albo od razu do wyników.</p>' : ''}
    <div class="startrow"><div><label class="field" for="name">Imię <span class="muted">(opcjonalnie, tylko do nazwy pliku)</span></label>
      <input id="name" type="text" data-field="name" value="${esc(A.name)}" autocomplete="off"></div>
      <button class="btn big" data-go="zajecia">${started ? 'Wróć do pytań' : 'Zaczynamy'}</button></div>
    ${started && !needResults() ? '<div class="actions"><button class="btn ghost" data-go="wyniki">Moje wyniki</button></div>' : ''}
    <p class="muted small">Nie ma złych odpowiedzi. To punkt wyjścia do rozmowy z rodzicami i nauczycielami, nie test i nie wyrok.</p>
    <div class="note2"><b>Co jest w bazie.</b> Siedem liceów i dwa technika w Krakowie z klasami z matematyką, fizyką, informatyką, biologią, chemią i geografią. Progi punktowe są z rekrutacji 2026, a w 2027 będą trochę inne. Resztę szkół dodamy w kolejnych wersjach.</div>
    <div class="skinpick" role="group" aria-label="Wygląd aplikacji"><span class="small muted">Wygląd:</span>
      <button class="chip" data-skinpick="" aria-pressed="${!skin}">Spokojny</button><button class="chip" data-skinpick="neon" aria-pressed="${skin === 'neon'}">Neon</button><button class="chip" data-skinpick="pop" aria-pressed="${skin === 'pop'}">Pop art</button></div>
    ${TEST ? `<details class="card"><summary>Tryb testowy</summary><div class="actions">${data.personas.map(p => `<button class="btn ghost" data-persona="${p.id}">${esc(p.label)}</button>`).join('')}</div></details>` : ''}
  </div>`;
}

function vSort() {
  const acts = data.questions.activities, n = acts.length, pos = Math.min(A.sortPos, n);
  const dots = `<div class="dots" aria-hidden="true">${acts.map((_, i) => `<i class="${i < pos ? 'done' : ''}"></i>`).join('')}</div>`;
  if (pos >= n) {
    const liked = acts.filter(a => A.sort[a.id] === 1).map(a => `<li>${esc(a.text)}</li>`).join('');
    return `<h1>Co lubisz robić</h1><div class="card"><p>Lubisz:</p><ul>${liked || '<li class="muted">nic nie zaznaczyłeś, to też jest odpowiedź</li>'}</ul><button class="btn ghost" data-sortreset>Przejdź jeszcze raz</button></div>${dots}`;
  }
  const a = acts[pos];
  return `<h1>Co lubisz robić</h1><p class="muted">Bez zastanawiania się. Chodzi o samą czynność, nie o zawód. Kartę możesz też przesunąć w prawo (lubię) albo w lewo (nie lubię).</p>
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
  return `<h1>Co robisz, gdy…</h1><p class="muted">Wybierz to, co zrobiłbyś naprawdę, nie to, co wypada.</p>
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

// ---- points -------------------------------------------------------------------------------------------------------
function vPoints() {
  const p = A.points, ex = p.exam, g = p.grades;
  const exRow = (k, label, w) => `<label for="ex-${k}">${label} <span class="muted small">(waga ${w})</span></label>
    <input id="ex-${k}" type="number" inputmode="numeric" min="0" max="100" step="1" data-exam="${k}" value="${ex[k] ?? ''}" placeholder="%">`;
  const grades = data.questions.grades.map(s => `<label for="gr-${s}">${esc(SUBJECT_NAME[s])}</label>
    <select id="gr-${s}" data-grade="${s}"><option value="">–</option>${[6, 5, 4, 3, 2].map(n => `<option value="${n}" ${g[s] === n ? 'selected' : ''}>${n}</option>`).join('')}</select>`).join('');
  return `<h1>Twoje punkty</h1>
    <p>Do liceum i technikum liczy się do 200 punktów: 100 z egzaminu ósmoklasisty i 100 ze świadectwa. Wpisz wynik, który masz albo którego się spodziewasz. W listopadzie to tylko szacunek, ale pokaże, gdzie jesteś względem progów. Zmienisz go w każdej chwili.</p>
    <div class="ptform">
      <div class="card"><h3>Egzamin ósmoklasisty</h3><p class="small muted">Spodziewany wynik w procentach. Próbny egzamin też się nadaje.</p>
        <div class="pgrid">${exRow('polski', 'Język polski', '0,35')}${exRow('matematyka', 'Matematyka', '0,35')}${exRow('obcy', 'Język obcy (angielski)', '0,30')}</div></div>
      <div class="card"><h3>Oceny na świadectwie</h3><p class="small muted">Aktualne albo spodziewane oceny. Każda klasa liczy polski, matematykę i dwa inne przedmioty.</p>
        <div class="pgrid">${grades}</div></div>
      <div class="card"><h3>Dodatkowe punkty</h3>
        <label class="check2"><input type="checkbox" data-pt="stripe" ${p.stripe ? 'checked' : ''}> Świadectwo z wyróżnieniem (czerwony pasek): 7 pkt</label>
        <label class="check2"><input type="checkbox" data-pt="volunteering" ${p.volunteering ? 'checked' : ''}> Wolontariat wpisany na świadectwie: 3 pkt</label>
        <div class="pgrid"><label for="ach">Osiągnięcia (konkursy, olimpiady, sport), do 18 pkt</label>
          <input id="ach" type="number" inputmode="numeric" min="0" max="18" step="1" data-pt="achievements" value="${p.achievements || 0}"></div>
        <p class="small muted">Osiągnięcia liczą się tylko, jeśli są wpisane na świadectwie.</p></div>
      <div class="card"><h3>Jak to czytać</h3><p class="small">Próg to najniższy wynik, który w zeszłym roku dał miejsce w klasie. Prawdziwy próg w 2027 będzie inny, często o kilka punktów. Dlatego Kompas pokazuje, czy jesteś nad progiem, blisko niego czy pod nim, a nie „dostaniesz się” albo „nie dostaniesz się”.</p>
        <p class="small muted">Nie masz jeszcze ocen? Pomiń ten krok: zobaczysz klasy bez porównania z progami.</p></div>
    </div>
    <div class="live" id="live" role="status" aria-live="polite"></div>`;
}
function liveUpdate() {
  const el = document.getElementById('live'); if (!el) return;
  const ex = examPoints(A.points.exam), ce = certificatePoints(A.points, { scored: [] });
  el.innerHTML = ex.entered
    ? `<div><span class="muted small">Egzamin</span><br><b>${f1(ex.total)}</b> <span class="muted small">z 100</span></div>
       <div><span class="muted small">Dodatkowe punkty</span><br><b>${ce.extras}</b> <span class="muted small">z 28</span></div>
       <div class="parts">Punkty ze świadectwa zależą od klasy, więc kompas policzy je osobno dla każdej.</div>`
    : '<span class="muted">Wpisz trzy wyniki z egzaminu, a tu zobaczysz sumę. Możesz też przejść dalej bez punktów.</span>';
}
const pointsEntered = () => examPoints(A.points.exam).entered;

// ---- results ------------------------------------------------------------------------------------------------------
const pill = ch => {
  const t = ch.level === 'unknown' ? (pointsEntered() ? `wpisz ocenę: ${ch.missing.map(s => SUBJECT_NAME[s]).join(', ')}` : 'wpisz punkty') : LEVEL_TXT[ch.level];
  const m = ch.margin != null ? ` (${ch.margin >= 0 ? '+' : '−'}${f1(Math.abs(ch.margin))} pkt)` : '';
  return `<span class="pill ${ch.level}">${esc(t)}${m}</span>`;
};

function classRow(x) {
  const { school, cls, check } = x;
  const th = cls.threshold != null ? `próg ${cls.thresholdYear}: <b>${f2(cls.threshold)}</b>` : `próg klasy do sprawdzenia · zakres szkoły ${f2(school.range.min)}–${f2(school.range.max)} (${school.range.year})`;
  const scored = scoredSubjects(cls);
  const mine = check.complete ? `Twoje punkty w tej klasie: <b>${f1(check.points)}</b>` : `Twoje punkty: ${pointsEntered() ? 'brakuje ocen' : 'jeszcze nie wpisane'}`;
  return `<li><div><span class="sch">${esc(school.short)}</span><span class="badge">${school.type === 'liceum' ? 'liceum' : 'technikum'}</span>
      <div class="sub">klasa ${esc(cls.code)} · ${esc(cls.label)}${cls.occupation ? ' (zawód + matura)' : ''}</div>
      ${school.address ? `<div class="sub">${esc(school.address)}</div>` : ''}</div>
    <div class="sub">${th}<br>${mine}${check.complete && !scored.sourced ? ' <span title="Szkoła podaje, które oceny liczy. Tu to przybliżenie.">(przybliżenie)</span>' : ''}${cls.status !== 'sourced' ? '<br><span class="muted">dane do sprawdzenia w rekrutacji 2027</span>' : ''}</div>
    ${pill(check)}</li>`;
}

function areaCard(slotName, c, selected) {
  return `<article class="area" ${selected ? 'aria-current="true"' : ''}><span class="kicker2">${slotName}</span><h3>${esc(c.card.name)}</h3><span class="band2">${c.band}</span>
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

function planItems(sel, r) {
  const top = sel.classes.find(c => c.check.complete && c.cls.threshold != null) || sel.classes[0];
  const out = [{ id: 'exp', when: 'w ciągu 30 dni', text: sel.card.experiment }];
  if (top) {
    out.push({ id: 'dni', when: 'grudzień 2026 – kwiecień 2027', text: `Idź na dzień otwarty albo wejdź na stronę: ${top.school.short}. Zapytaj, które oceny ze świadectwa liczy klasa ${top.cls.code} (${top.cls.label}) i jak wygląda zwykły tydzień nauki.` });
    if (top.check.complete && top.check.margin != null && top.check.margin < 0) {
      const lv = levers(A.points, top.cls).map(l => l.text);
      out.push({ id: 'pkt', when: 'do końca roku szkolnego', warn: true, text: `Brakuje około ${f1(-top.check.margin)} pkt do zeszłorocznego progu klasy ${top.cls.code}. Co daje punkty: ${lv.join('; ')}.` });
    } else if (top.check.complete) {
      out.push({ id: 'pkt', when: 'do końca roku szkolnego', text: `Trzymaj poziom: masz ${f1(top.check.points)} pkt, zeszłoroczny próg klasy ${top.cls.code} to ${f2(top.cls.threshold)}. Zapas może zniknąć, jeśli próg wzrośnie.` });
    } else {
      out.push({ id: 'pkt', when: 'w styczniu', text: 'Wpisz w Kompasie oceny i wynik próbnego egzaminu, żeby zobaczyć, gdzie jesteś względem progów.' });
    }
  }
  out.push({ id: 'zasady', when: 'styczeń 2027', text: `Sprawdź terminy rekrutacji 2027 na stronie Małopolskiego Kuratora Oświaty (${data.config.recruitmentWindow}) i regulamin każdej szkoły z twojej listy.` });
  out.push({ id: 'lista', when: 'przed złożeniem wniosku', text: 'Ułóż listę klas od wymarzonej do bezpiecznej: jedna ambitna, jedna realna, jedna z zapasem punktów.' });
  out.push({ id: 'egz', when: data.config.examDates, text: 'Egzamin ósmoklasisty (polski, matematyka, język obcy).' });
  out.push({ id: 'talk', when: 'kiedy chcesz', text: 'Pokaż ten plan komuś, komu ufasz, i zapytaj, co o nim myśli.' });
  return out;
}

function vResults() {
  const r = scoreLiceum(A, data), s = r.slots;
  const shown = [...s.best, s.most, s.surprise].filter(Boolean);
  const selId = (A.area && r.cards.some(c => c.card.id === A.area)) ? A.area : s.best[0].card.id;
  const sel = r.cards.find(c => c.card.id === selId);
  const items = planItems(sel, r), sl = shortlist(r);
  const rows = sel.classes, more = rows.slice(8);
  const tag = c => c === s.most ? 'Most' : c === s.surprise ? 'Niespodzianka' : `Opcja ${s.best.indexOf(c) + 1}`;
  const stud = studiaFor(sel.card);
  const noPts = !pointsEntered();
  return `<div class="sectionhead"><h1>${esc(A.name ? A.name + ', oto' : 'Oto')} twoje kierunki</h1><button class="btn ghost" data-go="punkty">Zmień punkty</button></div>
    <p class="lead">Kierunek to rodzaj pracy, który do ciebie pasuje. Z niego wynika klasa i szkoła. Zacznij od kierunku, nie od progu.</p>
    <div class="areas">${shown.map(c => areaCard(tag(c), c, c.card.id === selId)).join('')}</div>
    <div class="extra"><label class="small" for="allareas">Inny kierunek:</label>
      <select id="allareas" data-areasel>${r.cards.map(c => `<option value="${c.card.id}" ${c.card.id === selId ? 'selected' : ''}>${esc(c.card.name)}</option>`).join('')}</select></div>

    <h2>Klasy w Krakowie: ${esc(sel.card.name.toLowerCase())}</h2>
    ${noPts ? '<p class="note2">Nie wpisałeś jeszcze punktów, więc widzisz klasy i zeszłoroczne progi bez porównania. <button class="linkbtn" data-go="punkty">Wpisz punkty</button></p>' : ''}
    <p class="small muted">${esc(data.config.thresholdNote)} Klasy z kierunkiem na pierwszym miejscu są u góry.</p>
    <ul class="cls">${rows.slice(0, 8).map(classRow).join('')}</ul>
    ${more.length ? `<details><summary>Jeszcze ${more.length} klas</summary><ul class="cls" style="margin-top:8px">${more.map(classRow).join('')}</ul></details>` : ''}

    ${sl.length ? `<h2>Propozycja listy do wniosku</h2><p class="small muted">Z kierunku „${esc(s.best[0].card.name)}”. W rekrutacji wybierasz kilka klas i układasz je od najbardziej wymarzonej.</p>
      <div class="short">${sl.map(x => `<div class="card"><span class="role">${x.role}</span><h3>${esc(x.c.school.short)}</h3><p class="small">klasa ${esc(x.c.cls.code)} · ${esc(x.c.cls.label)}</p>${pill(x.c.check)}</div>`).join('')}</div>` : ''}

    <h2>Co potem</h2>
    <div class="card"><p>${esc(sel.card.afterSchool)}</p>
      ${stud.length ? `<p class="small muted">Przykłady z Kompasu Studia:</p><ul class="small">${stud.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="small muted">Za trzy lata sprawdzisz to dokładniej w <a href="../studia/">Kompasie Studia</a>.</p></div>

    <h2>Plan do maja 2027</h2>
    <ul class="plan">${items.map(it => `<li><input type="checkbox" id="pl-${it.id}" data-check="${sel.card.id}:${it.id}" ${A.checks[`${sel.card.id}:${it.id}`] ? 'checked' : ''}>
      <label for="pl-${it.id}"><span class="when">${esc(it.when)}</span>${esc(it.text)}</label></li>`).join('')}</ul>

    <h2>Czego jeszcze nie ma w bazie</h2>
    <p class="note2">Są: I, II, IV, V, VII, VIII i IX LO oraz Technikum Łączności nr 14 i Technikum Elektryczno-Elektroniczne nr 7. Brakuje jeszcze m.in. III, VI, X, XIII i XLII LO oraz Technikum Energetyczno-Elektronicznego nr 9 i Technikum Chemicznego nr 3 w ZSC. Progi klas oznaczone „do sprawdzenia” pochodzą z serwisu, który nie podaje roku. Przed decyzją sprawdź je na stronie szkoły i w ogłoszeniu kuratora.</p>
    <div class="actions noprint"><button class="btn" data-export="download">Zapisz plik z wynikami</button><button class="btn ghost" data-export="print">Drukuj</button></div>
    <details class="card"><summary>Źródła</summary><ul class="small">${data.sources.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a> · stan ${esc(x.asOf)}</li>`).join('')}</ul></details>`;
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
    for (const x of sel.classes.slice(0, 12)) {
      const th = x.cls.threshold != null ? `próg ${f2(x.cls.threshold)}` : `zakres szkoły ${f2(x.school.range.min)}–${f2(x.school.range.max)}`;
      L.push(`- ${x.school.short}, klasa ${x.cls.code} (${x.cls.label}): ${th}${x.check.complete ? `, moje punkty ${f1(x.check.points)} – ${LEVEL_TXT[x.check.level]}` : ''}`);
    }
    L.push('', '## Mój plan');
    const checks = A.checks || {};
    for (const it of planItems(sel, r)) L.push(`- [${checks[`${sel.card.id}:${it.id}`] ? 'x' : ' '}] ${it.when}: ${it.text}`);
    L.push('', '## Pytania do rozmowy z rodzicami', '- Która klasa daje ci najwięcej energii, a która tylko dobrze brzmi?', '- Co zrobisz w tym miesiącu, żeby zbliżyć się do progu?', '- Jaką klasę wpiszesz jako bezpieczną i czy chcesz w niej się uczyć?', '');
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
  a.points = Object.assign(blank().points, a.points);
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
  if (d.export) { doExport(d.export); return; }
  if ('themetoggle' in d) { const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; theme = dark ? 'light' : 'dark'; applyTheme(); return; }
  if ('skintoggle' in d) { skin = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length]; applySkin(); return; }
  if (d.skinpick !== undefined) { skin = d.skinpick || null; applySkin(); return; }
  if (d.persona) { const p = data.personas.find(x => x.id === d.persona); A = Object.assign(blank(), JSON.parse(JSON.stringify(p.answers))); A.sortPos = data.questions.activities.length; A.sitPos = data.questions.situations.length; location.hash = '#/wyniki'; render(); }
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
