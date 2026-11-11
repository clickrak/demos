// Kompas Studia v1.1.1. Screens, navigation, results, export.
import { scoreAll, provenStrengths, pathSteps, planFocus, planItems } from '../core/scoring.js';
import { buildMarkdown, fileName } from '../core/export.js';
import { icon, scenArt, FORCE_ICON } from './icons.js';
import { storyHtml, storyInit, storyClick } from './story.js';
import { ILLUS } from './illus.js';

const $app = document.getElementById('app');
const TEST = new URLSearchParams(location.search).has('test');
let data, A;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ name: '', certainty: null, direction: null, rozszerzenia: [], jezyki: { pl: 'bardzo dobry' }, sport: '',
  sort: {}, sortPos: 0, situations: {}, sitPos: 0, sliders: {}, values: [], strengths: [], scenario: null, neededWhere: null, homePlaces: [],
  studyLength: null, privateOk: null, startMin: 30, doubt: null, doubtStrong: false, reflection: {}, canDo: '', plan: null, checks: {} });

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
  A = blank();
  applyTheme(); applySkin();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  window.addEventListener('hashchange', render);
  render();
}

// Answers stay in memory only (no browser storage); the downloaded .md file is the saved copy.
// The header shows a dot while there are answers not yet in a file, and leaving the page asks first.
const answersKey = () => JSON.stringify({ ...A, lastScreen: undefined, sortPos: undefined, sitPos: undefined });
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
const SKIN_NAME = { null: 'Spokojny', neon: 'Neon', pop: 'Pop art' };
let skin = SKINS.includes(new URLSearchParams(location.search).get('skin')) ? new URLSearchParams(location.search).get('skin') : null;
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
  document.querySelectorAll('[data-skintoggle]').forEach(b => { b.setAttribute('aria-pressed', String(!!skin)); b.setAttribute('aria-label', `Wygląd: ${SKIN_NAME[skin]}. Zmień na: ${SKIN_NAME[next]}`); b.title = `Wygląd: ${SKIN_NAME[skin]} (dotknij: ${SKIN_NAME[next]})`; b.innerHTML = ICON.palette; });
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
  { id: 'pewnosc', ch: 'ja', view: vCertainty, ok: () => A.certainty, hint: () => 'Wybierz jedną odpowiedź' },
  { id: 'matura', ch: 'ja', view: vMatura },
  { id: 'jezyki', ch: 'ja', view: vLanguages },
  { id: 'zajecia', ch: 'ja', view: vSort, ok: () => A.sortPos >= data.questions.activities.length, hint: () => `Zostało kart: ${data.questions.activities.length - A.sortPos}` },
  { id: 'sytuacje', ch: 'ja', view: vSituations },
  { id: 'styl', ch: 'ja', view: vStyle },
  { id: 'wartosci', ch: 'ja', view: vValues, ok: () => A.values.length === 5, hint: () => `Wybierz jeszcze ${5 - A.values.length}` },
  { id: 'mocne', ch: 'ja', view: vStrengths, ok: () => provenStrengths(A).length === 5, hint: () => A.strengths.length < 5 ? `Wybierz jeszcze ${5 - A.strengths.length}`
    : `Dopisz przykład: ${A.strengths.filter(x => !x.proof.trim()).map(x => nameOf(x.id)).join(', ')}` },
  { id: 'odbicie', ch: 'ja', view: vReveal },
  { id: 'sily', ch: 'swiat', view: vForces },
  { id: 'karty', ch: 'swiat', view: vCardsPreview },
  { id: 'dlugosc', ch: 'droga', view: vLength, ok: () => A.studyLength, hint: () => 'Wybierz, ile chcesz się uczyć' },
  { id: 'zasieg', ch: 'droga', view: vReach },
  { id: 'niepokoj', ch: 'droga', view: vDoubt },
  { id: 'refleksja', ch: 'droga', view: vReflection },
  { id: 'kompas', ch: 'wyniki', view: vStory },
  { id: 'wyniki', ch: 'wyniki', view: vResults }
];
// Short name and rough minutes per question screen: the side rail and the "time left" line use them.
const META = {
  pewnosc: ['Pewność', .5], matura: ['Matura', .5], jezyki: ['Języki i sport', 1], zajecia: ['Co lubisz robić', 3], sytuacje: ['Co robisz, gdy…', 1.5],
  styl: ['Styl pracy', 1.5], wartosci: ['Co jest ważne', 1], mocne: ['Mocne strony', 4], odbicie: ['To już widać', .5],
  sily: ['Świat za 10 lat', 2], karty: ['Gdzie możesz się przydać', 1.5],
  dlugosc: ['Ile nauki', 1], zasieg: ['Gdzie', .5], niepokoj: ['Co cię niepokoi', 1], refleksja: ['Chwila dla siebie', 2]
};
const CHAPTERS = [
  { id: 'ja', name: 'Ja', sub: 'co lubisz i co ci wychodzi' },
  { id: 'swiat', name: 'Świat', sub: 'gdzie to będzie potrzebne' },
  { id: 'droga', name: 'Droga', sub: 'ile nauki i co cię niepokoi' }
];
const TICK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
let furthest = 0;       // the furthest screen he has reached; earlier screens count as visited
const stepDone = x => screens.indexOf(x) < furthest && (!x.ok || !!x.ok());
const minsLeft = i => Math.max(1, Math.round(screens.slice(i).reduce((t, x) => t + (META[x.id]?.[1] || 0), 0)));

// Side rail (desktop): the three chapters, the steps of the current one, and the time left.
function railHtml(s) {
  const i = screens.indexOf(s);
  const head = (c, k, all) => `<span class="rno">${all ? TICK : k + 1}</span><span class="rch-t"><b>${c.name}</b><span>${c.sub}</span></span>`;
  const chs = CHAPTERS.map((c, k) => {
    const list = screens.filter(x => x.ch === c.id), all = list.every(stepDone);
    if (c.id !== s.ch) return `<li class="rch${all ? ' done' : ''}"><button data-go="${list[0].id}">${head(c, k, all)}</button></li>`;
    return `<li class="rch on"><div class="rch-h">${head(c, k, false)}</div>
      <ol class="rsteps">${list.map(x => { const gap = x !== s && screens.indexOf(x) < furthest && x.ok && !x.ok();
        return `<li><button data-go="${x.id}" class="${x === s ? 'now' : stepDone(x) ? 'done' : gap ? 'gap' : 'todo'}" ${x === s ? 'aria-current="step"' : ''}>${META[x.id][0]}${gap ? '<span class="sr"> (do uzupełnienia)</span>' : ''}</button></li>`; }).join('')}</ol></li>`;
  }).join('');
  return `<aside class="rail noprint" aria-label="Gdzie jesteś"><ol class="rchs">${chs}
    <li class="rch res"><button data-go="kompas"><span class="rno">${icon('compass', 'ico sm')}</span><span class="rch-t"><b>Wyniki</b><span>twój kompas i plan</span></span></button></li></ol>
    <p class="rail-t">Do wyników ok. ${minsLeft(i)} min</p></aside>`;
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
      <button class="btn ghost" data-go="${screens[i - 1].id}">Wstecz</button>
      <p class="navhint" id="navhint" role="status">${blocked && s.hint ? esc(s.hint()) : ''}</p>
      <button class="btn" data-go="${screens[i + 1].id}" ${blocked ? 'disabled' : ''} aria-describedby="navhint">${s.id === 'refleksja' ? 'Pokaż wyniki' : 'Dalej'}</button>
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
  const crumb = inQ ? `<p class="crumb"><b>${CHAPTERS.find(c => c.id === s.ch).name}</b> · krok ${inCh.indexOf(s) + 1} z ${inCh.length} · do wyników ok. ${minsLeft(i)} min</p>` : '';
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
  rozszerzenie: 'Przedmiot na maturze zdawany na wyższym poziomie. Uczelnie liczą go zwykle mocniej, a niektóre (np. UJ) liczą tylko ten poziom.',
  deklaracja: 'Lista przedmiotów i poziomów, które zdajesz na maturze. Można ją zmienić do 7 lutego 2027, potem już nie.',
  licencjat: 'Studia pierwszego stopnia, zwykle 3 lata. Po nich możesz pracować albo iść na 2-letnie magisterskie.',
  inzynier: 'Studia pierwszego stopnia na kierunku technicznym, zwykle 3,5 roku. Potem praca albo magisterskie.',
  jednolite: 'Studia magisterskie bez podziału na stopnie, 5–6 lat (np. psychologia, fizjoterapia, kierunek lekarski).',
  policealna: 'Bezpłatna szkoła publiczna po szkole średniej, 1–2,5 roku. Kończy się dyplomem technika i daje szybki start w pracy.',
  most: 'Opcja, która łączy twoje dwie główne orientacje, np. pracę z ludźmi i pracę z danymi.',
  szybki: 'Droga do pierwszej pracy w 3 lata albo krócej, która zostawia otwarte dalsze studia.',
  niespodzianka: 'Opcja spoza twoich głównych obszarów, która i tak dobrze pasuje. Warto ją sprawdzić, nawet jeśli na pierwszy rzut oka nie jest twoja.'
};
// A button plus a hidden span (both phrasing content), so it can sit inside a heading or a sentence.
const term = (key, label) => `<span class="term"><button class="termq" data-term aria-expanded="false" aria-label="Co to znaczy: ${esc(label || key)}">?</button><span class="termtxt" hidden>${esc(GLOSS[key])}</span></span>`;
const levelTerm = lvl => /policealna/.test(lvl) ? term('policealna', 'szkoła policealna') : /licencjat|I stopnia/.test(lvl) ? term('licencjat', 'licencjat') : /inżynier/.test(lvl) ? term('inzynier', 'studia inżynierskie') : /jednolite/.test(lvl) ? term('jednolite', 'jednolite magisterskie') : '';

const chip = (attrs, label, on) => `<button class="chip" ${attrs} aria-pressed="${on ? 'true' : 'false'}">${label}</button>`;

function vStart() {
  const started = hasAnswers();
  const resume = screens.some(x => x.id === A.lastScreen) ? A.lastScreen : 'pewnosc';
  const cur = screens.find(x => x.id === resume);
  const mins = id => Math.round(screens.filter(x => x.ch === id).reduce((t, x) => t + META[x.id][1], 0));
  const done = id => started && screens.filter(x => x.ch === id).every(stepDone);
  const steps = CHAPTERS.map((c, k) => `<li class="${done(c.id) ? 'done' : ''}"><span class="rno">${done(c.id) ? TICK : k + 1}</span><div><b>${c.name}</b><span>${c.sub}</span></div><span class="cmin">ok. ${mins(c.id)} min</span></li>`).join('')
    + `<li class="res"><span class="rno">${icon('compass', 'ico sm')}</span><div><b>Wyniki</b><span>kompas z kierunkami w Krakowie i plan pierwszych kroków</span></div></li>`;
  const where = cur?.ch && cur.ch !== 'wyniki' ? `${CHAPTERS.find(c => c.id === cur.ch).name} · ${META[cur.id][0]}` : 'wyniki';
  return `
    <div class="hero">${ILLUS.start}<div>
    <span class="kicker2">Kompas Studia · Kraków 2027</span>
    <h1>Co już umiesz i gdzie się przydasz</h1>
    <p class="lead">Około 20 minut pytań o to, co lubisz i co ci wychodzi. Na końcu zobaczysz kilka kierunków w Krakowie, które do ciebie pasują, i plan pierwszych małych kroków.</p>
    <ol class="chsteps">${steps}</ol>
    ${started ? `<p class="resume-l"><b>Masz już odpowiedzi.</b> Skończyłeś na: ${esc(where)}.</p>` : ''}
    <div class="startrow"><div><label class="field" for="name">Imię <span class="muted">(opcjonalnie, tylko do nazwy pliku)</span></label>
      <input id="name" type="text" data-field="name" value="${esc(A.name)}" autocomplete="off"></div>
      <button class="btn big" data-go="${started ? resume : 'pewnosc'}">${started ? 'Wróć tam, gdzie skończyłem' : 'Zaczynamy'}</button></div>
    ${started && !needResults() && resume !== 'kompas' ? '<div class="actions"><button class="btn ghost" data-go="kompas">Moje wyniki</button></div>' : ''}
    <p class="muted small">Nie ma złych odpowiedzi. Jest wiele dobrych dróg, a wybór można korygować: to punkt wyjścia do rozmowy, nie test i nie wyrok.</p>
    <div class="savehelp">${ICON.save}<div><p><b>Możesz przerwać w każdej chwili.</b> Przycisk <b>Zapisz</b> u góry pobiera plik z odpowiedziami. Nic nie jest nigdzie wysyłane. Żeby wrócić, wczytaj ten plik: zaczniesz tam, gdzie skończyłeś.</p>
      <label class="btn ghost filebtn small-btn">Wczytaj plik .md<input type="file" accept=".md,text/markdown,text/plain" data-load></label></div></div>
    <div class="skinpick" role="group" aria-label="Wygląd aplikacji">
      <span class="small muted">Wygląd:</span>
      <button class="chip" data-skinpick="" aria-pressed="${!skin}">Spokojny</button>
      <button class="chip" data-skinpick="neon" aria-pressed="${skin === 'neon'}">Neon</button>
      <button class="chip" data-skinpick="pop" aria-pressed="${skin === 'pop'}">Pop art</button>
    </div></div></div>
    ${TEST ? `<details class="card noprint"><summary>Tryb testowy</summary>
      <p class="small muted">Wczytaj gotowe odpowiedzi, żeby obejrzeć wyniki bez wypełniania.</p>
      <div class="actions">${data.personas.map(p => `<button class="btn ghost" data-persona="${p.id}">${esc(p.label)}</button>`).join('')}</div>
    </details>` : ''}`;
}

function vCertainty() {
  const dir = A.certainty === 'pewny' ? `
    <p>Który kierunek masz w głowie? Pokażemy go pierwszy, a obok dwa sąsiednie.</p>
    <div class="chips">${data.opportunities.map(c => chip(`data-set="direction" data-val="${c.id}"`, esc(c.name), A.direction === c.id)).join('')}</div>` : '';
  return `${ILLUS.pewnosc}<h1>Jak pewny jesteś swojego kierunku?</h1>
    <div class="chips stack">${data.questions.certainty.map(c => chip(`data-set="certainty" data-val="${c.id}"`, c.label, A.certainty === c.id)).join('')}</div>${dir}`;
}

function vMatura() {
  return `${ILLUS.matura}<h1>Jakie przedmioty zdajesz na poziomie rozszerzonym?</h1>
    <p class="explain">Rozszerzenie to przedmiot na maturze zdawany na wyższym poziomie. Od niego zależy, na które kierunki możesz się dostać. Uczelnie liczą go zwykle mocniej, a UJ liczy tylko ten poziom.</p>
    <div class="chips">${data.questions.subjects.map(s => chip(`data-toggle="rozszerzenia" data-val="${s}"`, s, A.rozszerzenia.includes(s))).join('')}</div>
    <p class="small muted">Deklarację ${term('deklaracja', 'deklaracja maturalna')} można zmienić do ${data.config.declarationDeadline}. Potem już nie.</p>`;
}

function vLanguages() {
  const rows = data.questions.languages.map((l, i) => { const lv = A.jezyki[l.id] || 'brak';
    return `<fieldset class="card langcard" style="border:1px solid var(--line)"><legend class="sr">${l.name}</legend>
      <h3>${i + 1}. ${l.name[0].toUpperCase() + l.name.slice(1)}</h3><p class="small muted">Twój poziom: <b>${lv}</b></p>
      <div class="chips" role="radiogroup" aria-label="Poziom: ${l.name}">${data.questions.languageLevels.map(v => chip(`data-lang="${l.id}" data-val="${v}"`, v, lv === v)).join('')}</div></fieldset>`; }).join('');
  return `${ILLUS.jezyki}<h1>Języki i sport</h1>
    <p>Jak dogadujesz się w każdym z tych języków? Wybierz poziom w każdym bloku. Języki otwierają drzwi, nigdy ich nie zamykają.</p>${rows}
    <label class="field" for="sport">Jaki sport uprawiasz albo uprawiałeś? Od kiedy, jak często?</label>
    <input id="sport" type="text" data-field="sport" value="${esc(A.sport)}" placeholder="np. siłownia od roku, wcześniej wspinaczka">
    <p class="small muted">Sport to dobre źródło dowodów na mocne strony, np. regularność albo wytrwałość.</p>`;
}

function vSort() {
  const acts = data.questions.activities, n = acts.length, pos = Math.min(A.sortPos, n);
  const dots = `<div class="dots" aria-hidden="true">${acts.map((_, i) => `<i class="${i < pos ? 'done' : ''}"></i>`).join('')}</div>`;
  if (pos >= n) {
    const liked = acts.filter(a => A.sort[a.id] === 1).map(a => `<li>${esc(a.text)}</li>`).join('');
    return `<h1>Co lubisz robić</h1><div class="card"><p>Lubisz:</p><ul>${liked || '<li class="muted">nic nie zaznaczyłeś, to też jest odpowiedź</li>'}</ul>
      <button class="btn ghost" data-sortreset>Przejdź jeszcze raz</button></div>${dots}`;
  }
  const a = acts[pos];
  return `${A.sortPos === 0 ? ILLUS.zajecia : ''}<h1>Co lubisz robić</h1><p class="muted">Bez zastanawiania się. Chodzi o samą czynność, nie o zawód. Kartę możesz też przesunąć w prawo (lubię) albo w lewo (nie lubię).</p>
    <div class="card sort"><p class="sortcount">${pos + 1} z ${n}</p><div class="q">${esc(a.text)}</div>
      <div class="row">
        <button class="btn ghost" data-sortans="-1">nie lubię</button>
        <button class="btn" data-sortans="1">lubię</button>
      </div>
      <button class="chip" data-sortans="0" style="margin-top:12px">obojętne, pomiń</button>
      ${pos > 0 ? '<button class="chip" data-sortback style="margin-top:12px">cofnij</button>' : ''}
      <p class="keys" aria-hidden="true"><kbd>←</kbd> nie lubię · <kbd>→</kbd> lubię · <kbd>↓</kbd> pomiń</p>
    </div>${dots}`;
}

function vSituations() {
  const qs = data.questions.situations, n = qs.length, pos = Math.min(A.sitPos, n);
  const dots = `<div class="dots" aria-hidden="true">${qs.map((_, i) => `<i class="${i < pos ? 'done' : ''}"></i>`).join('')}</div>`;
  if (pos >= n) {
    const picked = qs.map(q => { const a = q.answers.find(x => x.id === A.situations[q.id]); return a ? `<li>${esc(a.text)}</li>` : ''; }).join('');
    return `<h1>Co robisz, gdy…</h1><div class="card"><p>Twoje wybory:</p><ul>${picked || '<li class="muted">wszystko pominięte, to też jest odpowiedź</li>'}</ul>
      <button class="btn ghost" data-sitreset>Przejdź jeszcze raz</button></div>${dots}`;
  }
  const q = qs[pos];
  return `${A.sitPos === 0 ? ILLUS.sytuacje : ''}<h1>Co robisz, gdy…</h1><p class="muted">Wybierz to, co zrobiłbyś naprawdę, nie to, co wypada.</p>
    <div class="card"><p class="sortcount">${pos + 1} z ${n}</p><p class="q-s">${esc(q.text)}</p>
      <div class="chips stack">${q.answers.map(a => chip(`data-sitans="${a.id}"`, esc(a.text), A.situations[q.id] === a.id)).join('')}</div>
      <div class="row-s"><button class="chip" data-sitans="">pomiń</button>${pos > 0 ? '<button class="chip" data-sitback>cofnij</button>' : ''}</div>
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
  return `<h1>Jak lubisz pracować?</h1><p class="muted">Przesuń w stronę, która bardziej do ciebie pasuje. Środek też jest w porządku.</p>
    ${data.dimensions.workStyle.map(w => `<div class="slider"><div class="ends"><span>${w.left}</span><span>${w.right}</span></div>
      <input type="range" min="-3" max="3" step="1" id="sl-${w.id}" data-slider="${w.id}" value="${A.sliders[w.id] ?? 0}" aria-label="${w.left} albo ${w.right}"></div>`).join('')}`;
}

function vValues() {
  return `<h1>Co jest dla ciebie ważne w pracy?</h1><p>Wybierz pięć, w kolejności: najpierw najważniejsze. <span class="pickn">${A.values.length} z 5</span></p>
    <div class="chips">${data.dimensions.values.map(v => { const i = A.values.indexOf(v.id);
      return chip(`data-value="${v.id}"`, `${i >= 0 ? `<span class="n">${i + 1}.</span> ` : ''}${v.name}`, i >= 0); }).join('')}</div>`;
}

function vStrengths() {
  const picked = A.strengths.map(s => s.id);
  const list = A.strengths.map(s => { const st = data.strengths.find(x => x.id === s.id);
    return `<div class="strength"><label class="field" for="pr-${s.id}">${esc(st.name)}: kiedy to pokazałeś? Jedno zdanie wystarczy.</label>
      <input id="pr-${s.id}" type="text" data-proof="${s.id}" value="${esc(s.proof)}" placeholder="${esc(st.example)}"></div>`; }).join('');
  return `<h1>Twoje mocne strony</h1>
    <p>Wybierz 5 rzeczy, które ci wychodzą. Do każdej dopisz jeden przykład ze swojego życia: sport, szkoła, dom i rodzina, języki, pomoc innym. <span class="pickn">${A.strengths.length} z 5</span></p>
    <div class="chips">${data.strengths.map(s => chip(`data-strength="${s.id}"`, s.name, picked.includes(s.id))).join('')}</div>
    ${list ? `<div class="card">${list}</div>` : ''}
    <p class="small muted">Mocna strona liczy się dopiero z przykładem. Przykład nie musi być wielki.</p>`;
}

function possibleStrengths(r) {
  const picked = new Set(A.strengths.map(s => s.id));
  const top = r.profile.top.slice(0, 2);
  return data.strengths.filter(s => !picked.has(s.id) && s.dims.some(d => top.includes(d))).slice(0, 2);
}

// "Kompas rośnie": a small compass on the last screen of each chapter, one more arc lit per chapter.
function growCompass(stage) {
  const names = ['Ja', 'Świat', 'Droga'];
  const arc = (k, on) => { const a0 = (-90 + k * 120 + 6) * Math.PI / 180, a1 = (-90 + (k + 1) * 120 - 6) * Math.PI / 180, r = 34;
    return `<path d="M${(40 + r * Math.cos(a0)).toFixed(1)},${(40 + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 0 1 ${(40 + r * Math.cos(a1)).toFixed(1)},${(40 + r * Math.sin(a1)).toFixed(1)}" class="garc${on ? ' on' : ''}${k === stage - 1 ? ' now' : ''}" pathLength="1"/>`; };
  return `<div class="grow"><svg viewBox="0 0 80 80" aria-hidden="true">${[0, 1, 2].map(k => arc(k, k < stage)).join('')}<polygon points="40,14 45,40 40,44 35,40" class="gneedle"/><circle cx="40" cy="40" r="3"/></svg>
    <p><b>Kompas rośnie.</b> ${stage < 3 ? `Rozdział ${names[stage - 1]} za tobą, przed tobą: ${names[stage]}` : 'To ostatnie pytania, potem wyniki'}. Dobry moment, żeby zapisać postęp.</p>
    <button class="btn ghost savebtn small-btn" data-export="download">${ICON.save} Zapisz</button></div>`;
}

function vReveal() {
  const r = scoreAll(A, data);
  const proven = provenStrengths(A).map(s => { const st = data.strengths.find(x => x.id === s.id);
    return `<li><b>${esc(st.name)}</b><span class="proof">Widać to po tym, że: ${esc(s.proof)}</span></li>`; }).join('');
  const maybe = possibleStrengths(r).map(s => `<li>${esc(s.name)} <span class="badge">możliwa mocna strona</span></li>`).join('');
  return `<span class="kicker2">Koniec rozdziału Ja</span><h1>To już widać</h1><p class="lead">Twoje mocne strony, twoimi słowami:</p>
    <div class="card reveal"><ul>${proven}</ul></div>
    ${maybe ? `<p>Twoje odpowiedzi podpowiadają jeszcze:</p><div class="card"><ul>${maybe}</ul><p class="small muted">Jeśli przypomnisz sobie przykład, wróć i dopisz.</p></div>` : ''}
    <p>Teraz zobaczmy, gdzie te mocne strony będą potrzebne.</p>${growCompass(1)}`;
}

function vScenarios() {
  const sc = data.scenarios.scenarios;
  return `<h1>Świat za 10 lat</h1>
    <p>Nikt nie wie, jak będzie. Oto trzy możliwe scenariusze, wszystkie równie poważne. Który wydaje ci się najbardziej prawdopodobny?</p>
    <div class="scen">${sc.map((x, i) => `<button class="scencard rise" style="--i:${i}" data-set="scenario" data-val="${x.id}" aria-pressed="${A.scenario === x.id}">
      ${scenArt(x.id)}<b>${esc(x.name)}</b><span class="small">${esc(x.text)}</span>${A.scenario === x.id ? '<span class="badge">mój główny scenariusz</span>' : ''}</button>`).join('')}</div>
    <div class="chips">${chip('data-set="scenario" data-val="?"', 'nie wiem, każdy jest możliwy', A.scenario === '?')}</div>
    <p class="small muted">To scenariusz, nie prognoza. Twój wybór nie zmienia dopasowania; pokazuje tylko, która przyszła potrzeba jest ważna dla ciebie, i trafia do twojego pliku.</p>`;
}

let sectorSel = null; // sector highlighted on the Świat screen
const sec = id => data.scenarios.sectors.find(x => x.id === id);
function vForces() {
  const src = id => data.sources.find(s => s.id === id);
  const mine = null; // the main scenario is picked at the end, in "Przyszłość"
  return `<span class="kicker2">Rozdział Świat</span><h1>Świat za 10 lat</h1>
    <p class="lead">Uczysz się teraz, żeby być gotowym na świat, który za 10 lat będzie wyglądał tak. Na to się przygotowujesz:</p>
    <div class="forces">${data.scenarios.forces.map((f, i) => { const s = src(f.sourceId), hot = sectorSel && f.sectors.includes(sectorSel);
      return `<div class="force rise${hot ? ' hot' : ''}${sectorSel && !hot ? ' dim' : ''}" style="--i:${i}">${icon(FORCE_ICON[f.id], 'ico big')}<div><h3>${esc(f.name)}</h3><p class="small">${esc(f.text)}</p>
        ${f.line && f.line !== f.text ? `<p class="small fline">${esc(f.line)}</p>` : ''}
        <div class="tags" aria-label="Gdzie rośnie praca">${f.sectors.map(id => { const x = sec(id); return `<button class="tag-s sbtn-s${sectorSel === id ? ' on' : ''}" data-sector="${id}" aria-pressed="${sectorSel === id}">→ ${esc(x.name)}</button>`; }).join('')}</div>
        <p class="small muted">${s ? `<a href="${s.url}" target="_blank" rel="noopener">źródło</a>, ` : ''}stan na ${esc(f.asOf)}</p></div></div>`; }).join('')}</div>
    <h2>Gdzie rośnie praca</h2>
    <p class="small muted">Każdy sektor rośnie z powodu jednej lub kilku sił powyżej. Dotknij sektora, żeby zobaczyć, skąd się bierze.</p>
    <div class="sectors">${data.scenarios.sectors.map((x, i) => { const why = data.scenarios.forces.filter(f => f.sectors.includes(x.id));
      const cards = x.cards.map(id => data.opportunities.find(c => c.id === id)).filter(Boolean);
      return `<button class="sector rise${sectorSel === x.id ? ' on' : ''}${sectorSel && sectorSel !== x.id ? ' dim' : ''}" style="--i:${i}" data-sector="${x.id}" aria-pressed="${sectorSel === x.id}">
        <b>${esc(x.name)}</b><span class="small">Dlaczego rośnie: ${why.map(f => esc(f.name.toLowerCase())).join(', ')}</span>
        <span class="small muted">Na przykład: ${cards.slice(0, 4).map(c => esc(c.name)).join(', ')}</span></button>`; }).join('')}</div>
    <p class="small muted">${esc(data.scenarios.shrinking)}</p>
    <p class="lead">Mniej ludzi do pracy oznacza, że każdy będzie bardziej potrzebny. Zobaczmy, gdzie przydadzą się twoje mocne strony.</p>`;
}

// "Gdzie można się przydać": the 6 areas that fit his Ja answers so far, filterable by his orientations and strengths.
let areaFilter = null;
function vCardsPreview() {
  const r = scoreAll(A, data), proven = provenStrengths(A);
  const dims = r.profile.top.slice(0, 2).map(d => data.dimensions.interests.find(x => x.id === d));
  const topOf = c => Object.keys(c.card.interests).sort((a, b) => c.card.interests[b] - c.card.interests[a]).slice(0, 2);
  let list = r.cards, label = 'Pasują do twoich odpowiedzi z rozdziału Ja';
  if (areaFilter?.startsWith('d:')) { const d = areaFilter.slice(2); list = r.cards.filter(c => topOf(c).includes(d)); label = `Orientacja: ${dims.find(x => x.id === d)?.name.toLowerCase()}`; }
  if (areaFilter?.startsWith('s:')) { const sid = areaFilter.slice(2); list = r.cards.filter(c => c.card.strengths.includes(sid)); label = `Gdzie przyda się: ${data.strengths.find(x => x.id === sid)?.name}`; }
  const shown = list.slice(0, 6);
  const fchip = (key, text) => chip(`data-area="${key}"`, text, areaFilter === key);
  const answered = proven.length || Object.keys(A.sort).length;
  return `<h1>Gdzie możesz się przydać</h1>
    <p>${answered ? 'Z 23 obszarów pokazujemy sześć, które najlepiej pasują do tego, co już o sobie powiedziałeś. Dotknij orientacji albo mocnej strony, żeby zobaczyć inne.' : 'Odpowiedz najpierw na pytania z rozdziału Ja, a pokażemy obszary dopasowane do ciebie.'}</p>
    <div class="chips filt" role="group" aria-label="Filtruj obszary">${fchip('', 'najlepiej pasujące')}${dims.map(d => fchip('d:' + d.id, d.name.toLowerCase())).join('')}${proven.map(p => fchip('s:' + p.id, data.strengths.find(x => x.id === p.id).name)).join('')}</div>
    <p class="small muted" aria-live="polite">${esc(label)}</p>
    <div class="areas">${shown.map((c, i) => { const used = proven.filter(p => c.card.strengths.includes(p.id)).map(p => data.strengths.find(x => x.id === p.id).name);
      return `<div class="area rise" style="--i:${i}"><span class="area-ico">${icon(c.card.cluster)}</span><div><h3>${esc(c.card.name)}</h3><p class="small">${esc(c.card.whoYouHelp)}</p>
        ${used.length ? `<div class="tags">${used.map(u => `<span class="tag-s on">${esc(u)}</span>`).join('')}</div>` : ''}</div></div>`; }).join('')}</div>
    <details class="card"><summary>Pokaż wszystkie 23 obszary</summary><ul class="cardlist">${data.opportunities.map(c => `<li><b>${esc(c.name)}</b><span class="small muted">${esc(c.whoYouHelp)}</span></li>`).join('')}</ul></details>${growCompass(2)}`;
}

const shortInst = n => n.replace(/^Uniwersytet Jagielloński.*$/, 'UJ').replace(/^UJ Collegium Medicum$/, 'UJ CM').replace(/^Krakowska Medyczna Szkoła Policealna nr 1$/, 'Medyczna Szkoła Policealna nr 1')
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
  const svg = `<svg class="bigcompass" viewBox="0 0 360 360" role="img" aria-label="Kompas wskazuje północ: ${esc(b1.card.name)}; obok: ${esc(b2?.card.name || '')} i ${esc(b3?.card.name || '')}.">
    ${mark(0, 'main', [180, 0])}${b2 ? mark(22.5, 'main', [300, 0]) : ''}${b3 ? mark(-22.5, 'main', [60, 0]) : ''}
    ${s.surprise ? mark(-90, 'side', [60, 360]) : ''}${s.quick ? mark(180, 'side', [180, 360]) : ''}${s.most ? mark(90, 'side', [300, 360]) : ''}
    <circle cx="${C}" cy="${C}" r="${R}" class="ring"/><circle cx="${C}" cy="${C}" r="${R - 24}" class="ring2"/>${rose}
    ${L(0, 'N')}${L(90, 'E')}${L(180, 'S')}${L(270, 'W')}
    <g class="needle-big${compassSel ? ' fixed' : ''}" ${compassSel ? `style="transform:rotate(${selAngle(s)}deg)"` : ''}><polygon points="${C},${C - R + 30} ${C + 11},${C} ${C},${C + 8} ${C - 11},${C}" class="n-head"/><polygon points="${C},${C + R - 38} ${C + 9},${C} ${C},${C - 6} ${C - 9},${C}" class="n-tail"/></g>
    <circle cx="${C}" cy="${C}" r="6" class="hub"/></svg>`;
  return `<section class="compass-screen">
    <p class="ctitle">Twój kompas</p>
    <div class="cgrid ctop">${item(b3, '3 · NNW', 'nnw')}${item(b1, '1 · N', 'n')}${item(b2, '2 · NNE', 'nne')}</div>
    ${svg}
    <div class="cgrid cbot">${item(s.surprise, 'W · Niespodzianka', 'w')}${s.quick ? item(s.quick.c, 'S · Szybki start', 's', true) : '<div class="cdir s empty"></div>'}${item(s.most, 'E · Most', 'e')}</div>
    <div id="cprev" class="cprev" aria-live="polite">${compassSel ? previewHtml(r, compassSel) : '<p class="clead">Trzy dobre drogi, nie jedna. Dotknij kierunku, a kompas pokaże, dokąd prowadzi.</p>'}</div>
    ${prevFile?.snapshot ? `<div class="cprev">${changesSince(r)}</div>` : ''}
    ${tilesHtml()}
  </section>`;
}

function vReach() {
  return `<h1>Gdzie chcesz być potrzebny?</h1>
    <p>Gdzie chciałbyś być potrzebny za 10 lat?</p>
    <div class="chips">${data.questions.neededWhere.map(v => chip(`data-set="neededWhere" data-val="${v}"`, v, A.neededWhere === v)).join('')}</div>
    <p>Gdzie czujesz się u siebie? <span class="muted small">(opcjonalnie, możesz wybrać kilka; nie wpływa na wyniki)</span></p>
    <div class="chips">${data.questions.homePlaces.map(v => chip(`data-toggle="homePlaces" data-val="${v}"`, v, A.homePlaces.includes(v))).join('')}</div>
    <p class="small muted">W tej wersji pokazujemy uczelnie w Krakowie. Inne miejsca pojawią się później.</p>`;
}

function vLength() {
  return `<h1>Ile chcesz się uczyć?</h1>
    <div class="chips stack">${data.questions.studyLength.map(o => chip(`data-set="studyLength" data-val="${o.id}"`, o.label, A.studyLength === o.id)).join('')}</div>
    <p class="explain">Krótka droga, np. szkoła policealna (1–2,5 roku, bezpłatna, bez matury) albo 3-letni licencjat, to pełnoprawna opcja. Zostawia otwarte dalsze studia.</p>
    <p>Czy bierzesz pod uwagę uczelnie prywatne? Są płatne.</p>
    <div class="chips">${data.questions.privateOk.map(o => chip(`data-set="privateOk" data-val="${o.id}"`, o.label, A.privateOk === o.id)).join('')}</div>
    <label class="field" for="start">Ile minut jedziesz z domu na Dworzec Główny?</label>
    <input id="start" type="number" min="0" max="180" data-field="startMin" value="${esc(A.startMin)}" inputmode="numeric">
    <p class="small muted">Liczymy z tego czas dojazdu na uczelnię. Zostaje na tym urządzeniu.</p>`;
}

function vDoubt() {
  const d = data.questions.doubts.find(x => x.id === A.doubt);
  return `<h1>Co cię najbardziej niepokoi w tym wyborze?</h1><p class="muted">Opcjonalnie. Możesz to pominąć.</p>
    <div class="chips stack">${data.questions.doubts.map(x => chip(`data-set="doubt" data-val="${x.id}"`, x.label, A.doubt === x.id)).join('')}</div>
    ${d ? `<div class="card fade"><p>${d.card}</p></div>
      <p>Jak mocno to cię męczy?</p><div class="chips">${chip('data-strong="0"', 'trochę', !A.doubtStrong)}${chip('data-strong="1"', 'bardzo', A.doubtStrong)}</div>` : ''}`;
}

function vReflection() {
  return `<h1>Chwila dla siebie</h1><p class="muted">Opcjonalnie. Te odpowiedzi nie są oceniane, trafiają tylko do twojego pliku.</p>
    ${data.questions.reflection.map(q => `<label class="field" for="rf-${q.id}">${q.text}</label>
      <textarea id="rf-${q.id}" data-refl="${q.id}">${esc(A.reflection[q.id] || '')}</textarea>`).join('')}${growCompass(3)}`;
}

// ---- results ----------------------------------------------------------------
const campus = id => data.campuses.find(c => c.id === id);

function commute(c) {
  const h = c.tr?.fromHub;
  if (!h) return 'czas dojazdu: brak danych';
  const base = Number(A.startMin) || 0;
  const lo = base + h.min, hi = base + Math.max(h.median, h.min + 5);
  return `z domu ok. ${lo}–${hi} min`;
}
const lineText = st => [st.tram.length ? `tramwaje ${st.tram.join(', ')}` : '', st.bus.length ? `autobusy ${st.bus.join(', ')}` : ''].filter(Boolean).join('; ');
function transit(c) {
  const sts = (c.tr?.stops || []).filter(st => st.tram.length || st.bus.length).slice(0, 2);
  return sts.length ? sts.map(st => `przystanek ${esc(st.name)} (${st.m} m): ${esc(lineText(st))}`).join('; ') : 'linie: brak danych';
}
const routeUrl = c => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address + ', Kraków')}&travelmode=transit`;

function offerHtml(o, chk) {
  const c = campus(o.campus);
  const route = routeUrl(c);
  return `<div class="offer">
    <b>${esc(o.name)}</b>, ${esc(o.institution)}<br>
    <span class="muted">${esc(o.level)} ${levelTerm(o.level)} · ${String(o.durationYears).replace('.', ',')} ${o.durationYears < 5 ? 'lata' : 'lat'}</span><br>
    ${chk.ok.map(t => `<span class="badge">${esc(t)}</span>`).join('')}${chk.blocked.map(t => `<span class="badge warn">${esc(t)}</span>`).join('')}${chk.flags.map(t => `<span class="badge warn">${esc(t)}</span>`).join('')}
    <div class="small">Wymagania: ${esc(o.requires.note || '-')}</div>
    ${chk.fix ? `<div class="small fix">Co możesz zrobić: ${esc(chk.fix)}</div>` : ''}
    <div class="small">${esc(c.name)}, ${esc(c.address)} · ${transit(c)} · ${commute(c)} · <a href="${route}" target="_blank" rel="noopener">Zaplanuj dojazd</a></div>
  </div>`;
}

// Pay band per card: $ / $$ / $$$ relative to other jobs, from a dated GUS ranking. For reflection only.
const PAY_TXT = { 1: 'niższe niż w wielu zawodach', 2: 'blisko środka', 3: 'wyższe niż w większości zawodów' };
function payHtml(k) {
  if (!k.pay) return '';
  const src = data.sources.find(x => x.id === k.pay.sourceId);
  const b = k.pay.band;
  return `<span class="pay" aria-label="poziom zarobków ${b} z 3"><b>${'$'.repeat(b)}</b><i>${'$'.repeat(3 - b)}</i></span> ${PAY_TXT[b]}
    <span class="small muted">Typowa pensja na etacie w grupie „${esc(k.pay.group)}”, w porównaniu z innymi zawodami (${src ? `<a href="${src.url}" target="_blank" rel="noopener">GUS, październik 2020</a>` : 'GUS'}). Liczy się też to, co lubisz robić.</span>`;
}
function cardHtml(slot, c, open, scenario) {
  const k = c.card;
  const force = data.scenarios.forces.find(f => f.id === k.force);
  const conv = c.paths.length >= 2 ? `<p class="converge">Dotarłeś tu ${c.paths.length} drogami: ${c.paths.map(p => esc(p.label)).join(', ')}.</p>` : '';
  const reach = c.offers.filter(o => o.check.reachable), blocked = c.offers.filter(o => !o.check.reachable && !o.check.hidden), hidden = c.offers.filter(o => o.check.hidden);
  const first = reach[0]?.offer;
  const my = data.scenarios.scenarios.find(x => x.id === A.scenario);
  const need = my ? `w twoim scenariuszu („${esc(my.name)}”): <b>${esc(k.robustness[my.id])}</b>; w pozostałych: ${data.scenarios.scenarios.filter(x => x !== my).map(x => `${esc(x.name)}: ${esc(k.robustness[x.id])}`).join(' · ')}`
    : data.scenarios.scenarios.map(x => `${esc(x.name)}: ${esc(k.robustness[x.id])}`).join(' · ');
  const demand = k.demand ? (() => { const src = data.sources.find(x => x.id === k.demand.sourceId);
    return `<p class="small muted">Kraków 2026: ${esc(k.demand.text)}${src ? ` <a href="${src.url}" target="_blank" rel="noopener">źródło</a>` : ''}</p>`; })() : '';
  const body = `
    <p class="small muted">${c.reasons.map(esc).join(' · ')}</p>${conv}
    <section class="grp"><h4>Ty i ta praca</h4><dl>
      <dt>Komu pomagasz</dt><dd>${esc(k.whoYouHelp)}</dd>
      <dt>Co to daje tobie</dt><dd>${esc(k.whatYouGet)}</dd>
      ${k.pay ? `<dt>Zarobki, orientacyjnie</dt><dd>${payHtml(k)}</dd>` : ''}
      ${c.strengthsUsed.length ? `<dt>Twoje mocne strony, które tu pracują</dt><dd><div class="tags">${c.strengthsUsed.map(p => `<span class="tag-s on">${esc(p.label)}</span>`).join('')}</div></dd>` : ''}
      <dt>Jak wygląda dzień pracy</dt><dd><ul>${k.dayInLife.map(d => `<li>${esc(d)}</li>`).join('')}</ul></dd>
      <dt>Jak tu rośniesz</dt><dd><ol class="growth">${k.growth.map(g => `<li>${esc(g)}</li>`).join('')}</ol></dd>
      <dt>Przykładowe role</dt><dd>${esc(k.roles)}</dd></dl></section>
    <section class="grp"><h4>Przyszłość</h4><dl>
      <dt>Dlaczego będzie potrzebne</dt><dd>${esc(k.whyNeeded)}${force ? ` <span class="muted small">(${force.name.toLowerCase()})</span>` : ''}${demand}</dd>
      <dt>Przyszła potrzeba</dt><dd>${need}${k.robustnessNote ? ` <span class="muted small">${esc(k.robustnessNote)}</span>` : ''} <span class="muted small">(ocena orientacyjna)</span></dd></dl></section>
    <section class="grp"><h4>W Krakowie</h4>${reach.map(o => offerHtml(o.offer, o.check)).join('')}${blocked.length ? `<p class="small muted">Wymagają zmiany w maturze:</p>${blocked.map(o => offerHtml(o.offer, o.check)).join('')}` : ''}${hidden.length ? `<details class="small"><summary>Uczelnie prywatne (${hidden.length}), wybrałeś tylko publiczne</summary>${hidden.map(o => offerHtml(o.offer, o.check)).join('')}</details>` : ''}${!c.offers.length ? '<span class="muted">brak kierunku w Krakowie w bazie</span>' : ''}</section>
    <section class="grp"><h4>Twoja droga</h4>${first ? `<ul>${pathSteps(first, campus(first.campus).name).map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      <p><b>Mini-eksperyment na 30 dni:</b> ${esc(k.experiment)}</p></section>
    ${TEST ? `<p class="testv">fit ${c.fit.toFixed(1)} · int ${c.parts.interests.toFixed(2)} · styl ${c.parts.workStyle.toFixed(2)} · wart ${c.parts.values.toFixed(2)}</p>` : ''}`;
  return `<details class="card opt" data-card="${k.id}" ${open ? 'open' : ''}>
    <summary class="optsum"><span class="area-ico">${icon(k.cluster)}</span><span class="opthead"><span class="small muted">${slot} · ${esc(c.band)}${c.pinned ? ' · twój kierunek' : ''}</span><h3>${esc(k.name)}</h3><span class="small teaser">${esc(k.whoYouHelp)}</span></span></summary>${body}</details>`;
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
  const roots = [...proven, ...langs, { id: '_int', name: 'zainteresowania: ' + topDims.join(', ') }];

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
  let svg = `<svg class="${drawOnce ? 'draw' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Mapa dróg: od twoich mocnych stron, przez opcje, do kierunków w Krakowie. Wybierz opcję, żeby podświetlić jej drogi.">`;
  svg += `<text x="20" y="28" class="col">TWOJE MOCNE STRONY</text><text x="${X2 - 90}" y="28" class="col">GDZIE SIĘ PRZYDASZ</text><text x="${X3 + 18}" y="28" class="col">STUDIA W KRAKOWIE</text>`;

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
    const y = yC[i], label = row.slot === 'most' ? 'Most' : row.slot === 'niespodzianka' ? 'Niespodzianka' : row.c.band;
    svg += `<g class="node stop r${i}" style="--d:${(0.4 + i * 0.18).toFixed(2)}s" data-maprow="${i}" data-color="${row.color}" role="button" tabindex="0" aria-label="Podświetl drogi: ${esc(row.c.card.name)}">`;
    svg += `<rect x="${X2 - 120}" y="${y - 58}" width="240" height="100" fill="transparent"/>`;
    svg += `<rect x="${X2 - 13}" y="${y - 13}" width="26" height="26" rx="13" fill="${row.color}" stroke="var(--card)" stroke-width="3"/>`;
    svg += `<text text-anchor="middle" class="stn" style="fill:${row.color}">${tspans(wrap(row.c.card.name, 26), X2, y - 32, 15)}</text>`;
    svg += `<text x="${X2}" y="${y + 30}" text-anchor="middle" class="tag">${esc(label)}</text></g>`;
  });
  offers.forEach((o, k) => {
    const quick = s.quick && s.quick.o.offer.id === o.id;
    svg += `<g class="node study ${cls(offerRows[k])}" style="--d:${(1.1 + k * 0.08).toFixed(2)}s"><circle cx="${X3}" cy="${yO[k]}" r="7" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`;
    svg += `<text class="lbl">${tspans([o.name, o.institution + (quick ? ' · szybki start' : '')].flatMap(t => wrap(t, 30)).slice(0, 3), X3 + 16, yO[k] + 4)}</text></g>`;
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
    lines.push({ c: s.quick.c, o: s.quick.o.offer, chk: s.quick.o.check, color: 'var(--muted)', name: 'Szybki start', quick: true });
  for (const l of lines) l.end = 2027 + Math.ceil(l.o.durationYears);
  return lines;
}

const SHARED = [
  { key: 'dek', date: 'do 7 lutego 2027', sub: 'deklaracja maturalna' },
  { key: 'dni', date: 'marzec–kwiecień', sub: 'dni otwarte' },
  { key: 'mat', date: 'maj 2027', sub: 'matura' },
  { key: 'rek', date: 'lipiec–sierpień', sub: 'rekrutacja i zapisy' },
  { key: 'start', date: 'jesień 2027', sub: 'start nauki' }
];

function tramMapSvg(lines) {
  const ends = [...new Set(lines.map(l => l.end))].sort();
  const rows = [...SHARED, ...ends.map(y => ({ key: 'e' + y, date: String(y), sub: 'dyplom, pierwsza praca' }))];
  const W = 360, X0 = 182, n = lines.length, DX = n > 1 ? Math.min(38, (W - 20 - X0) / (n - 1)) : 0, TOP = 58, RH = 50;
  const x = i => X0 + i * DX, y = k => TOP + rows.findIndex(r => r.key === k) * RH;
  const H = TOP + rows.length * RH;
  let svg = `<svg class="${drawOnce ? 'draw' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Linie w czasie: kroki od dziś do pierwszej pracy dla każdej opcji. Ten sam opis jest pod mapą jako tekst.">`;
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
    const fix = !l.chk.reachable ? `<span class="badge warn">najpierw: ${esc(l.chk.blocked[0] || 'zmiana w maturze')}</span>` : l.chk.soft ? `<span class="badge warn">warto dopisać rozszerzenie: ${esc(l.chk.soft)}</span>` : '';
    return `<li><span class="tno-b" style="background:${l.color}">${l.quick ? 'S' : i + 1}</span><div><b>${esc(l.name)}</b>${l.quick ? ` <span class="muted small">(${esc(l.c.card.name)})</span>` : ''}<br>
      <span class="small">${esc(l.o.name)}, ${esc(l.o.institution)} · ${String(l.o.durationYears).replace('.', ',')} ${l.o.durationYears < 5 ? 'lata' : 'lat'} · koniec ok. ${l.end}${l.o.next ? ` · potem: ${esc(l.o.next)}` : ''}</span> ${fix}
      <details class="small steps"><summary>Kroki</summary><ul>${pathSteps(l.o, camp?.name).map(t => `<li>${esc(t)}</li>`).join('')}</ul></details></div></li>`;
  }).join('')}</ol>`;
}

function changesSince(r) {
  if (!prevFile?.snapshot) return '';
  const s = r.slots, name = id => data.opportunities.find(c => c.id === id)?.name || id;
  const now = [...s.best, s.most, s.surprise].filter(Boolean).map(c => c.card.id);
  const old = [...(prevFile.snapshot.best || []), prevFile.snapshot.most, prevFile.snapshot.surprise].filter(Boolean);
  const added = now.filter(id => !old.includes(id)), gone = old.filter(id => !now.includes(id)), kept = now.filter(id => old.includes(id));
  return `<div class="card compare"><h3>Co się zmieniło od ${esc(prevFile.date || 'poprzedniego pliku')}</h3><ul>
    ${kept.length ? `<li>Zostało: ${kept.map(name).map(esc).join(', ')}</li>` : ''}
    ${added.length ? `<li>Nowe: ${added.map(name).map(esc).join(', ')}</li>` : ''}
    ${gone.length ? `<li>Tym razem nie ma: ${gone.map(name).map(esc).join(', ')}</li>` : ''}
    ${!added.length && !gone.length ? '<li>Te same opcje co poprzednio. To też coś mówi.</li>' : ''}</ul>
    <p class="small muted">Pytanie do siebie: co zmieniło się u ciebie przez ten czas?</p></div>`;
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
  s.best.forEach((c, i) => out.push({ c, key: c.card.id, no: String(i + 1), slot: 'Najlepsze dopasowanie', color: LINE_COLORS[i] }));
  if (s.most) out.push({ c: s.most, key: s.most.card.id, no: 'M', slot: 'Most', color: LINE_COLORS[3] });
  if (s.surprise) out.push({ c: s.surprise, key: s.surprise.card.id, no: 'N', slot: 'Niespodzianka', color: LINE_COLORS[4] });
  if (s.quick) out.push({ c: s.quick.c, key: 'quick', no: 'S', slot: 'Szybki start', color: 'var(--muted)', quick: s.quick.o });
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
    <p class="small">${esc(o.quick ? `Pierwsza praca po ${String(first.durationYears).replace('.', ',')} latach, dalsze studia zostają otwarte. Łączy się z obszarem: ${c.card.name}.` : c.card.whoYouHelp)}</p>
    ${used.length ? `<p class="small muted">Prowadzą tu twoje mocne strony:</p><div class="tags">${used.map(u => `<span class="tag-s on">${esc(u)}</span>`).join('')}</div>` : ''}
    ${first ? `<p class="small">${icon('school', 'ico sm')} ${esc(first.name)}, ${esc(shortInst(first.institution))} · ${String(first.durationYears).replace('.', ',')} ${first.durationYears < 5 ? 'lata' : 'lat'}</p>` : ''}
    <div class="actions"><button class="btn" data-goopt="${esc(key)}">Pokaż drogę</button><button class="btn ghost" data-pick="">Zamknij</button></div></div>`;
}

const PARTS = [
  { id: 'w-mocne', title: 'Twoje mocne strony', sub: 'karty z twoimi dowodami', ico: 'star', col: 'var(--l0)' },
  { id: 'w-kierunki', title: 'Twoje kierunki', sub: 'drogi od mocnych stron do zawodów', ico: 'route', col: 'var(--l2)' },
  { id: 'w-droga', title: 'Twoja droga przez studia', sub: 'kroki z datami i dojazd', ico: 'tram', col: 'var(--l1)' },
  { id: 'w-przyszlosc', title: 'Przyszłość', sub: 'twoje opcje w trzech scenariuszach', ico: 'future', col: 'var(--l4)' },
  { id: 'w-plik', title: 'Twój plik', sub: 'zapisz, wydrukuj, wróć za pół roku', ico: 'file', col: 'var(--l3)' }
];

function tilesHtml() {
  const n = PARTS.filter(p => seenParts.has(p.id)).length;
  return `<div class="tiles-h"><h2>Co chcesz zobaczyć?</h2><span class="small muted">odkryto ${n} z ${PARTS.length}</span></div>
    <div class="tiles">${PARTS.map((p, i) => `<button class="tile rise" style="--i:${i};--c:${p.col}" data-go="${p.id}">
      <span class="tile-ico">${icon(p.ico)}</span><span class="tile-t"><b>${p.title}</b><span class="small">${p.sub}</span></span>
      ${seenParts.has(p.id) ? `<span class="tile-ok" aria-label="obejrzane">${icon('check')}</span>` : i === 0 && !n ? '<span class="tile-start">zacznij tutaj</span>' : ''}</button>`).join('')}</div>`;
}

function tabBar(id) {
  const t = [['kompas', 'Kompas', 'compass'], ['w-mocne', 'Mocne', 'star'], ['w-kierunki', 'Kierunki', 'route'], ['w-droga', 'Droga', 'tram'], ['w-przyszlosc', 'Przyszłość', 'future']];
  return `<nav class="tabbar noprint" aria-label="Części wyników">${t.map(([k, l, ic]) => `<button data-go="${k}" ${k === id || (id === 'w-plik' && k === 'kompas') ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span></button>`).join('')}</nav>`;
}

// Bottom of each part: the next part in the suggested order, so the journey has a direction.
function nextPart(id) {
  const i = PARTS.findIndex(p => p.id === id), n = PARTS[i + 1];
  return `<div class="nextpart noprint">${n ? `<button class="btn" data-go="${n.id}">Dalej: ${n.title} →</button>` : ''}<button class="btn ghost" data-go="kompas">${icon('compass', 'ico sm')} Kompas</button></div>`;
}
const needResults = () => provenStrengths(A).length < 1 || !A.values.length;
const partHead = (p, lead) => `<div class="parthead" style="--c:${p.col}"><span class="tile-ico">${icon(p.ico)}</span><div><h1>${p.title}</h1><p class="small">${lead}</p></div></div>`;

// ---- Mocne strony: flip cards, profile bars, values, "Mogę to zrobić, bo…"
function vPartStrengths() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), opts = shownOptions(r).filter(o => !o.quick);
  const cards = provenStrengths(A).map((x, i) => {
    const leads = opts.filter(o => o.c.strengthsUsed.some(p => p.id === x.id));
    return `<button class="flip rise" style="--i:${i}" data-flip aria-pressed="false" aria-label="${esc(nameOf(x.id))}: odwróć kartę">
      <span class="face front"><span class="star">${icon('star')}</span><b>${esc(nameOf(x.id))}</b><span class="small muted">dotknij, żeby odwrócić</span></span>
      <span class="face back"><span class="small">„${esc(x.proof)}”</span>${leads.length ? `<span class="leads">${leads.map(o => `<span class="tno-b sm" style="background:${o.color}" title="${esc(o.c.card.name)}">${o.no}</span>`).join('')}<span class="small muted">prowadzi do ${leads.length === 1 ? 'opcji' : 'opcji'} ${leads.map(o => o.no).join(', ')}</span></span>` : ''}</span></button>`;
  }).join('');
  const dims = r.profile.top.map((d, i) => { const dim = data.dimensions.interests.find(x => x.id === d), v = Math.round(r.profile.score[d]);
    return `<div class="bar${i < 2 ? ' main' : ''}"><span class="bl">${esc(dim.name)}</span><span class="bt"><i style="width:${v}%;--i:${i}"></i></span><span class="bd small muted">${esc(dim.desc)}</span></div>`; }).join('');
  const vals = (A.values || []).map((v, i) => `<li><span class="vn">${i + 1}</span>${esc(data.dimensions.values.find(x => x.id === v).name)}</li>`).join('');
  return `${partHead(PARTS[0], 'To nie są wyniki testu, tylko twoje własne przykłady. Dotknij karty, żeby zobaczyć dowód i dokąd prowadzi.')}
    <div class="flips">${cards}</div>
    <h2>Twój profil</h2><p class="small muted">Im dłuższy pasek, tym częściej wybierałeś takie czynności i sytuacje. Dwa pierwsze to twoje główne orientacje.</p>
    <div class="card bars">${dims}</div>
    <h2>Co jest dla ciebie ważne</h2><ol class="vals">${vals}</ol>
    <h2>Mogę to zrobić, bo…</h2>
    <label class="field" for="cando">Dokończ jednym zdaniem. Trafi na górę twojego pliku.</label>
    <input id="cando" type="text" data-field="canDo" value="${esc(A.canDo)}">
    ${nextPart('w-mocne')}`;
}

// ---- Kierunki: one option at a time as a vertical road, then its full card
function vPartDirections() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), opts = shownOptions(r);
  const sel = opts.find(o => o.key === kierSel) || opts[0];
  const card = sel.quick ? `<div class="card opt"><span class="ctag">Szybki start</span><h3>${esc(sel.quick.offer.name)}</h3>
      <p>${esc(sel.quick.offer.institution)}. ${sel.quick.offer.next ? esc(sel.quick.offer.next) + '.' : ''}</p>${offerHtml(sel.quick.offer, sel.quick.check)}</div>`
    : cardHtml(sel.slot, sel.c, true, A.scenario);
  return `${partHead(PARTS[1], 'Wybierz opcję. Czytaj z góry na dół: twoje mocne strony prowadzą do obszaru, obszar do studiów w Krakowie, a studia do przykładowych zawodów.')}
    <div class="optpick" role="group" aria-label="Wybierz opcję">${opts.map(o => `<button class="optchip" data-kier="${esc(o.key)}" aria-pressed="${o === sel}" style="--c:${o.color}"><span class="tno-b sm" style="background:${o.color}">${o.no}</span><span>${esc(o.quick ? 'Szybki start' : o.c.card.name)}</span></button>`).join('')}</div>
    ${confLine(r.profile.confidence)}
    <div class="card vroad">${vRoadSvg(sel)}</div>
    ${card}
    ${r.slots.rest.length ? `<details class="card"><summary>Pozostałe obszary (${r.slots.rest.length})</summary>${r.slots.rest.map(c => cardHtml('Inna opcja', c, false, A.scenario)).join('')}</details>` : ''}
    ${nextPart('w-kierunki')}`;
}

// Vertical road for one option: strengths (top) → option → Kraków studies → example jobs. Fits a phone.
function vRoadSvg(o) {
  const c = o.c, W = 360, col = o.color;
  const roots = c.paths.filter(p => p.kind !== 'dimension').map(p => p.label.replace(/^język: /, 'język: '));
  if (!roots.length || c.paths.some(p => p.kind === 'dimension')) roots.push('twoje zainteresowania');
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
  const yS = 48 + top.h + 44, label = wrap(o.quick ? 'Szybki start' : c.card.name, 26);
  const yStud0 = yS + 72 + label.length * 17;
  const SH = 50, studY = studies.map((_, i) => yStud0 + i * (SH + 10));
  const yJobs = yStud0 + studies.length * (SH + 10) + 44;
  const jb = rows(jobs, yJobs + 22);
  const H = yJobs + 22 + jb.h + 14;
  const curve = (x1, y1, x2, y2) => { const m = (y1 + y2) / 2; return `M${x1.toFixed(1)},${y1} C${x1.toFixed(1)},${m} ${x2.toFixed(1)},${m} ${x2.toFixed(1)},${y2}`; };
  let g = `<svg class="vdraw" viewBox="0 0 ${W} ${H}" role="img" aria-label="Droga: ${esc(roots.join(', '))} prowadzą do: ${esc(c.card.name)}; studia: ${esc(studies.map(x => x.offer.name).join(', '))}; zawody: ${esc(jobs.join(', '))}.">`;
  g += `<text x="12" y="16" class="vcap">TWOJE MOCNE STRONY</text>`;
  top.placed.forEach((p, k) => { g += `<path class="vl" style="--d:${(k * 0.08).toFixed(2)}s" pathLength="1" d="${curve(p.x + p.w / 2, p.y + 15, W / 2, yS - 18)}" stroke="${col}"/>`; });
  top.placed.forEach(p => { g += `<g class="vpill"><rect x="${p.x}" y="${p.y - 15}" width="${p.w}" height="30" rx="15"/><text x="${p.x + p.w / 2}" y="${p.y + 5}" text-anchor="middle">${esc(p.t)}</text></g>`; });
  g += `<g class="vstation" style="--d:.5s"><circle cx="${W / 2}" cy="${yS}" r="18" fill="${col}"/><text x="${W / 2}" y="${yS + 6}" text-anchor="middle" class="vno">${o.no}</text>
    <text text-anchor="middle" class="vname" style="fill:${col}">${tspans(label, W / 2, yS + 36 + (label.length - 1) * 8.5, 17)}</text></g>`;
  g += `<text x="12" y="${yStud0 - 16}" class="vcap">GDZIE SIĘ UCZYĆ W KRAKOWIE</text>`;
  const trunkX = 30;
  g += `<path class="vl" style="--d:.7s" pathLength="1" d="M${W / 2},${yS + 32 + label.length * 17} C${W / 2},${yStud0 - 20} ${trunkX},${yStud0 - 40} ${trunkX},${studY[0] || yStud0} L${trunkX},${yJobs - 10}" stroke="${col}"/>`;
  studies.forEach((st, i) => { const y = studY[i], ok = st.check.reachable, warn = !ok || st.check.soft;
    g += `<g class="vstudy" style="--d:${(0.9 + i * 0.15).toFixed(2)}s" data-study="${esc(st.offer.id)}" role="button" tabindex="0" aria-expanded="false" aria-label="${esc(st.offer.name)}, ${esc(st.offer.institution)}: pokaż szczegóły"><path d="M${trunkX},${y + SH / 2} H${trunkX + 20}" stroke="${col}" class="vtick"/><circle cx="${trunkX}" cy="${y + SH / 2}" r="6" fill="var(--card)" stroke="${col}" stroke-width="3"/>
      <rect x="${trunkX + 20}" y="${y}" width="${W - trunkX - 32}" height="${SH}" rx="12" class="${warn ? 'warnbox' : ''}"/>
      <text x="${trunkX + 34}" y="${y + 21}" class="vst">${esc(st.offer.name.length > 30 ? st.offer.name.slice(0, 29) + '…' : st.offer.name)}</text>
      <text x="${W - 26}" y="${y + 30}" text-anchor="end" class="vmore">›</text>
      <text x="${trunkX + 34}" y="${y + 39}" class="vsub">${esc(shortInst(st.offer.institution))} · ${String(st.offer.durationYears).replace('.', ',')} ${st.offer.durationYears < 5 ? 'lata' : 'lat'}${!ok ? ' · wymaga zmiany w maturze' : st.check.soft ? ' · warto dopisać rozszerzenie' : ''}</text></g>`; });
  if (!studies.length) g += `<text x="${trunkX + 20}" y="${yStud0 + 20}" class="vsub">brak kierunku w Krakowie w bazie</text>`;
  g += `<path class="vl" style="--d:1.3s" pathLength="1" d="M${trunkX},${yJobs - 10} C${trunkX},${yJobs + 4} ${W / 2},${yJobs - 4} ${W / 2},${yJobs + 6}" stroke="${col}"/>`;
  g += `<text x="12" y="${yJobs - 18}" class="vcap" text-anchor="start" dx="${trunkX + 10}">${o.quick ? 'PIERWSZA PRACA' : 'PRZYKŁADOWE ZAWODY'}</text>`;
  jb.placed.forEach((p, k) => { g += `<g class="vjob" style="--d:${(1.5 + k * 0.1).toFixed(2)}s"><rect x="${p.x}" y="${p.y - 15}" width="${p.w}" height="30" rx="8" style="stroke:${col}"/><text x="${p.x + p.w / 2}" y="${p.y + 5}" text-anchor="middle">${esc(p.t)}</text></g>`; });
  return g + '</svg>';
}

// ---- Droga przez studia: tram lines, next steps, places
function vPartPath() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), s = r.slots, lines = tramLines(r);
  const warn = lines.filter(l => !l.chk.reachable || l.chk.soft);
  const insts = [...new Set(lines.map(l => shortInst(l.o.institution)))].join(', ');
  const steps = [
    ['dek', 'do 7 lutego 2027', warn.length ? `Sprawdź deklarację maturalną: ${warn.map(l => `${l.quick ? 'S' : lines.indexOf(l) + 1} (${l.chk.soft ? 'dopisz rozszerzenie: ' + l.chk.soft : l.chk.blocked[0] || 'zmiana w maturze'})`).join('; ')}.` : 'Sprawdź deklarację maturalną: twoje linie nie wymagają zmian.'],
    ['dni', 'marzec–kwiecień', `Dni otwarte: ${insts}.`],
    ['exp', 'w ciągu 30 dni', `Mini-eksperyment: ${s.best[0].card.experiment}`],
    ['mat', 'maj 2027', 'Matura.'],
    ['rek', 'czerwiec–lipiec', 'Rekrutacja na studia (rejestracja na stronach uczelni) albo zapisy do szkoły policealnej.']
  ];
  A.checks = A.checks || {};
  const pins = [], seen = new Set();
  for (const l of lines) { const cp = campus(l.o.campus); if (cp && !seen.has(cp.id)) { seen.add(cp.id); pins.push({ cp, l }); } }
  return `${partHead(PARTS[2], 'Każda opcja to linia tramwajowa, a jej przystanki to kroki z datami. Do jesieni 2027 wszystkie linie jadą razem, więc przesiadka jest normalna.')}
    <div class="card trammap">${tramMapSvg(lines)}${tramLegend(lines)}</div>
    <h2>Najbliższe kroki</h2><p class="small muted">Odhacz, co już zrobione. Zapisuje się tylko w tej karcie.</p>
    <ul class="checks">${steps.map(([k, d, t]) => `<li><label><input type="checkbox" data-check="${k}" ${A.checks[k] ? 'checked' : ''}><span><b>${d}</b> ${esc(t)}</span></label></li>`).join('')}</ul>
    <h2>Gdzie to jest</h2>
    <div class="places2">${pins.map(({ cp, l }) => `<div class="place"><span class="tno-b sm" style="background:${l.color}">${l.quick ? 'S' : lines.indexOf(l) + 1}</span><div><b>${esc(cp.name)}</b><br>
      <span class="small">${esc(cp.address)}</span><br><span class="small">${icon('tram', 'ico sm')} ${transit(cp)}</span><br><span class="small">${commute(cp)} · <a href="${routeUrl(cp)}" target="_blank" rel="noopener">Zaplanuj dojazd</a></span></div></div>`).join('')}</div>
    <p class="small muted">${data.transport ? `Przystanki, linie i czasy z oficjalnego rozkładu jazdy Krakowa (rozkład na ${esc(data.transport.asOf)}): ${esc(data.transport.method)}, plus twój dojazd na Dworzec Główny. Przed wyjazdem sprawdź trasę.` : ''}</p>
    <details class="card"><summary>Wszystkie miejsca w bazie (${data.campuses.length})</summary><ul class="places">${[...data.campuses].sort((a, b) => a.name.localeCompare(b.name, 'pl')).map(c => `<li><b>${esc(c.name)}</b><br><span class="small">${esc(c.address)} · ${transit(c)} · ${commute(c)} · <a href="${routeUrl(c)}" target="_blank" rel="noopener">Zaplanuj dojazd</a></span></li>`).join('')}</ul></details>
    <div class="card"><h3>Niemcy i dalej</h3><p class="small">Polska matura daje bezpośredni wstęp na niemieckie uczelnie. Większość licencjatów jest po niemiecku (C1), wiele magisterskich po angielsku. Obywatele UE nie płacą czesnego na publicznych uczelniach w Bawarii, tylko opłatę semestralną. Jedna z dróg: licencjat w Krakowie, magisterka w Monachium.</p></div>
    ${nextPart('w-droga')}`;
}

// ---- Przyszłość: the scenario pick, at the end. Shows only what matters in the chosen scenario.
const NEED = { wysoka: 3, 'średnia': 2, niska: 1 };
function vPartFuture() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), sc = data.scenarios.scenarios, my = sc.find(x => x.id === A.scenario);
  const opts = shownOptions(r).filter(o => !o.quick);
  let body = '<p class="lead center">Wybierz scenariusz, który wydaje ci się najbardziej prawdopodobny.</p>';
  if (my) {
    const forces = data.scenarios.forces.filter(f => my.emphasis.includes(f.id));
    const ranked = [...opts].sort((a, b) => (NEED[b.c.card.robustness[my.id]] || 0) - (NEED[a.c.card.robustness[my.id]] || 0));
    const shownIds = new Set(opts.map(o => o.c.card.id));
    const extra = r.cards.filter(c => !shownIds.has(c.card.id) && c.card.robustness[my.id] === 'wysoka' && forces.some(f => f.id === c.card.force) && c.fit >= 55).slice(0, 3);
    const meter = v => `<span class="meter m${NEED[v] || 0}" aria-label="potrzeba: ${esc(v)}"><i></i><i></i><i></i></span>`;
    body = `<h2>Co w tym scenariuszu waży najwięcej</h2>
      <div class="forces">${forces.map((f, i) => `<div class="force hot rise" style="--i:${i}">${icon(FORCE_ICON[f.id], 'ico big')}<div><h3>${esc(f.name)}</h3><p class="small">${esc(f.text)}</p></div></div>`).join('')}</div>
      <h2>Twoje opcje w scenariuszu „${esc(my.name)}”</h2><p class="small muted">Od najbardziej potrzebnych. Dopasowanie do ciebie się nie zmienia; to tylko inne światło.</p>
      <div class="needlist">${ranked.map((o, i) => `<div class="needrow rise" style="--i:${i}"><span class="tno-b sm" style="background:${o.color}">${o.no}</span><span class="nn">${esc(o.c.card.name)}${o.c.card.robustnessNote ? `<span class="small muted">${esc(o.c.card.robustnessNote)}</span>` : ''}</span>${meter(o.c.card.robustness[my.id])}</div>`).join('')}</div>
      ${extra.length ? `<h2>Bardzo potrzebne w tym scenariuszu i pasujące do ciebie</h2><div class="areas">${extra.map((c, i) => `<div class="area rise" style="--i:${i}"><span class="area-ico">${icon(c.card.cluster)}</span><div><h3>${esc(c.card.name)}</h3><p class="small">${esc(c.card.whoYouHelp)}</p><span class="small muted">${esc(c.band)}</span></div></div>`).join('')}</div>` : ''}`;
  }
  return `${partHead(PARTS[3], 'Na koniec zabawa w przyszłość. Wybierz scenariusz: zobaczysz tylko to, co w nim najważniejsze, i swoje opcje w tym świetle.')}
    <div class="scen">${sc.map((x, i) => `<button class="scencard rise" style="--i:${i}" data-set="scenario" data-val="${x.id}" aria-pressed="${A.scenario === x.id}">
      ${scenArt(x.id)}<b>${esc(x.name)}</b><span class="small">${esc(x.text)}</span>${A.scenario === x.id ? '<span class="badge">mój główny scenariusz</span>' : ''}</button>`).join('')}</div>
    ${body}
    ${nextPart('w-przyszlosc')}`;
}

// ---- Twój plik
function vPartFile() {
  if (needResults()) return vResults();
  const r = scoreAll(A, data), doubt = data.questions.doubts.find(d => d.id === A.doubt);
  return `${partHead(PARTS[4], 'Plik powstaje na tym urządzeniu i nigdzie nie jest wysyłany. Za pół roku wczytasz go i zobaczysz, co się zmieniło.')}
    ${changesSince(r)}
    <div class="actions"><button class="btn" data-export="download">Pobierz plik .md</button><button class="btn ghost" data-export="copy">Kopiuj do schowka</button>
      <button class="btn ghost" data-export="print">Drukuj / PDF</button><button class="btn ghost" data-go="wyniki">Cały raport na jednej stronie</button></div>
    <p id="msg" class="small muted" role="status"></p>
    <div class="card loadcard"><h3>Masz starszy plik?</h3><label class="btn ghost filebtn">Wczytaj plik .md<input type="file" accept=".md,text/markdown,text/plain" data-load></label></div>
    ${doubt ? `<div class="card"><h3>To, co cię niepokoi</h3><p>${doubt.card}</p>${A.doubtStrong ? '<p class="notice">Jeśli ten niepokój zostaje z tobą na dłużej, porozmawiaj z doradcą zawodowym w szkole albo w bezpłatnej poradni psychologiczno-pedagogicznej.</p>' : ''}</div>` : ''}
    <details class="card"><summary>Dla rodzica</summary><ul>
      <li>Pytaj, nie mów: „Co cię tu zaskoczyło?” działa lepiej niż „Widzisz, mówiłem”.</li>
      <li>Reaguj na dowody, nie na opcję: dowody są jego, opcja może się zmienić.</li>
      <li>Bez porównań między braćmi; każdy plik należy do właściciela.</li>
      <li>Umówcie się na jeden mały krok w tym miesiącu, nie na ostateczny wybór.</li></ul></details>
    <div class="actions"><button class="btn ghost" data-go="pewnosc">Zmień odpowiedzi</button></div>
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
    strengthName: id => nameOf(id),
    dimName: d => data.dimensions.interests.find(x => x.id === d)?.name || d,
    valueName: v => data.dimensions.values.find(x => x.id === v)?.name || v,
    tramLines: r => { const opts = shownOptions(r);
      return tramLines(r).map(l => { const o = opts.find(x => l.quick ? x.quick : (!x.quick && x.c === l.c)); return { ...l, no: o?.no || '?', color: o?.color || l.color }; }); },
    panelHtml: o => panelHtml(o),
    planHtml: () => planHtml(ctx.r),
    touch: () => save(),
    studyHtml: id => studyHtml(id),
    transportNote: () => data.transport ? `Przystanki, linie i czasy z oficjalnego rozkładu jazdy Krakowa (rozkład na ${esc(data.transport.asOf)}): ${esc(data.transport.method)}, plus twój dojazd na Dworzec Główny. Przed wyjazdem sprawdź trasę.` : '',
    changes: () => changesSince(ctx.r),
    doubtHtml: () => { const d = data.questions.doubts.find(x => x.id === A.doubt);
      return d ? `<div class="pcard"><h3>To, co cię niepokoi</h3><p>${d.card}</p>${A.doubtStrong ? '<p class="small">Jeśli ten niepokój zostaje z tobą na dłużej, porozmawiaj z doradcą zawodowym w szkole albo w bezpłatnej poradni psychologiczno-pedagogicznej.</p>' : ''}</div>` : ''; }
  };
  ctx.r = scoreAll(A, data);
  return ctx;
}
// Shown instead of the results while the two things the compass needs are still missing.
function vGate() {
  const rows = [
    ['mocne', 'Mocne strony: co najmniej jedna z przykładem', provenStrengths(A).length >= 1, true],
    ['wartosci', 'Co jest dla ciebie ważne w pracy', A.values.length > 0, true],
    ['zajecia', 'Co lubisz robić', Object.keys(A.sort).length >= 12, false],
    ['sytuacje', 'Co robisz, gdy…', Object.keys(A.situations).length >= 3, false],
    ['matura', 'Przedmioty rozszerzone', A.rozszerzenia.length > 0, false]];
  return `<div class="gate"><span class="kicker2">Wyniki</span><h1>Jeszcze dwie rzeczy</h1>
    <p class="lead">Kompas potrzebuje twoich mocnych stron i tego, co jest dla ciebie ważne. Reszta go wyostrza, ale nie jest konieczna.</p>
    <ul class="gatelist">${rows.map(([go, t, ok, must]) => `<li class="${ok ? 'ok' : must ? 'must' : ''}"><span class="rno">${ok ? TICK : ''}</span><span>${t}${must ? '' : ' <span class="muted small">(opcjonalnie)</span>'}</span>${ok ? '' : `<button class="btn ${must ? '' : 'ghost'} small-btn" data-go="${go}">${must ? 'Uzupełnij' : 'Dodaj'}</button>`}</li>`).join('')}</ul>
    <div class="actions"><button class="btn ghost" data-go="${A.certainty ? 'mocne' : 'pewnosc'}">Wracam do pytań</button></div></div>`;
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
  return `<span class="kicker">Twój plan</span><h2>Nie wybór. Kilka małych kroków.</h2>
    <p class="lead">Nie musisz dziś decydować. Wybierz jeden kierunek, który sprawdzisz najpierw, i zrób kilka małych rzeczy. Potem wróć i zobacz, co się zmieniło.</p>
    <div class="plan">
      <div class="plan-pick"><h3>Który kierunek sprawdzasz najpierw?</h3>
        <div class="plan-opts" role="radiogroup" aria-label="Kierunek do sprawdzenia">${opts.map(o => `<button role="radio" class="eitem" data-planfocus="${esc(o.key)}" aria-checked="${o.key === focus.key}" style="--c:${o.color}"><span class="nb" style="background:${o.color}">${o.no}</span><span><b>${esc(o.quick ? 'Szybki start' : o.c.card.name)}</b><span class="small muted">${esc(o.quick ? o.quick.offer.name : o.slot)}</span></span></button>`).join('')}</div>
        <p class="small muted">To nie jest decyzja. Za miesiąc możesz sprawdzić następny.</p></div>
      <div class="plan-list" style="--c:${cur.color}"><span class="kicker" style="color:${cur.color}">Sprawdzam najpierw</span><h3>${esc(focus.quick ? f.name : focus.c.card.name)}</h3>
        ${f ? `<p class="small muted">${icon('school', 'ico sm')} ${esc(f.name)}, ${esc(shortInst(f.institution))} · ${String(f.durationYears).replace('.', ',')} ${f.durationYears < 5 ? 'lata' : 'lat'}</p>` : ''}
        <ul class="plan-items">${items.map(it => `<li class="${it.warn ? 'warn' : ''}"><label><input type="checkbox" data-check="${esc(key(it))}" ${A.checks?.[key(it)] ? 'checked' : ''}><span><span class="when">${esc(it.when)}</span>${esc(it.text)}${it.url ? ` <a href="${esc(it.url)}" target="_blank" rel="noopener">Otwórz stronę</a>` : ''}</span></label></li>`).join('')}</ul>
        <p class="small muted plan-n" aria-live="polite">Zrobione: ${done} z ${items.length}. Plan zapisuje się w twoim pliku.</p></div>
    </div>`;
}

const STUDY_HINT = '<h4>W Krakowie</h4><p class="small muted">Kliknij uczelnię w części „Gdzie się uczyć w Krakowie”, a pod drogą pojawią się szczegóły: wymagania, dojazd i co możesz zrobić, jeśli czegoś brakuje.</p>';
// Details of one study, shown under the road only after he clicks it.
function studyHtml(id) {
  const r = storyCtx.r, q = r.slots.quick;
  const hit = q && q.o.offer.id === id ? q.o : r.cards.flatMap(c => c.offers).find(x => x.offer.id === id);
  return hit ? `<div class="sdet"><button class="sdet-x" data-study="${esc(id)}" aria-label="Zamknij szczegóły">×</button>${offerHtml(hit.offer, hit.check)}</div>` : '';
}

// One option in the explorer: its vertical road on the left, what it means on the right.
function panelHtml(o) {
  const c = o.c, k = c.card;
  if (o.quick) {
    const f = o.quick.offer;
    return `<div class="pgrid"><div class="proad vroad">${vRoadSvg(o)}<div class="studydetail" aria-live="polite"></div></div><div class="pinfo"><span class="kicker" style="color:${o.color}">Szybki start</span><h3>${esc(f.name)}</h3>
      <p>${esc(f.institution)}. Pierwsza praca po ${String(f.durationYears).replace('.', ',')} latach, a dalsze studia zostają otwarte.${f.next ? ' Potem: ' + esc(f.next) + '.' : ''}</p>
      <p class="small muted">Łączy się z obszarem: ${esc(k.name)}.</p>${STUDY_HINT}</div></div>`;
  }
  const reach = c.offers.filter(x => x.check.reachable), blocked = c.offers.filter(x => !x.check.reachable && !x.check.hidden);
  const src = k.demand && data.sources.find(x => x.id === k.demand.sourceId);
  const my = data.scenarios.scenarios.find(x => x.id === A.scenario);
  return `<div class="pgrid"><div class="proad vroad">${vRoadSvg(o)}<div class="studydetail" aria-live="polite"></div></div><div class="pinfo">
    <span class="kicker" style="color:${o.color}">${esc(o.slot)} · ${esc(c.band)}</span><h3>${esc(k.name)}</h3>
    <p>${esc(k.whoYouHelp)}</p><p class="small muted">${c.reasons.map(esc).join(' · ')}</p>
    <h4>Co to daje tobie</h4><p>${esc(k.whatYouGet)}</p>
    ${k.pay ? `<h4>Zarobki, orientacyjnie</h4><p>${payHtml(k)}</p>` : ''}
    <h4>Jak wygląda dzień pracy</h4><ul>${k.dayInLife.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
    <h4>Jak tu rośniesz</h4><ol>${k.growth.map(g => `<li>${esc(g)}</li>`).join('')}</ol>
    <h4>Dlaczego będzie potrzebne</h4><p>${esc(k.whyNeeded)}</p>${k.demand ? `<p class="small muted">Kraków 2026: ${esc(k.demand.text)}${src ? ` <a href="${src.url}" target="_blank" rel="noopener">źródło</a>` : ''}</p>` : ''}
    <p class="small">Przyszła potrzeba${my ? ` w scenariuszu „${esc(my.name)}”: <b>${esc(k.robustness[my.id])}</b>` : `: ${data.scenarios.scenarios.map(x => `${esc(x.name)} ${esc(k.robustness[x.id])}`).join(' · ')}`}</p>
    ${c.offers.length ? STUDY_HINT : '<h4>W Krakowie</h4><p class="muted">brak kierunku w Krakowie w bazie</p>'}
    <h4>Mini-eksperyment na 30 dni</h4><p>${esc(k.experiment)}</p></div></div>`;
}

function confLine(c) {
  return `<p class="conf small"><b>Pewność wyników: ${c.level}.</b> ${c.missing.length ? `Niższa, bo pominąłeś: ${c.missing.map(esc).join(', ')}. Możesz wrócić i uzupełnić.` : 'Odpowiedziałeś na wszystkie bloki.'}</p>`;
}

function vResults() {
  if (needResults()) return vGate();
  const r = scoreAll(A, data), s = r.slots, sc = A.scenario || 'B';
  const proven = provenStrengths(A).map(x => `<li><b>${esc(data.strengths.find(y => y.id === x.id).name)}</b><span class="proof">${esc(x.proof)}</span></li>`).join('');
  const quick = s.quick ? (() => { const o = s.quick.o.offer;
    return `<div class="card opt" data-card="quick"><span class="badge slot">Szybki start</span><h3>${esc(o.name)}</h3>
      <p>${esc(o.institution)}. Pierwsza praca po ${String(o.durationYears).replace('.', ',')} ${o.durationYears < 5 ? 'latach' : 'latach'}, a dalsze studia zostają otwarte.${o.next ? ' ' + esc(o.next) + '.' : ''}</p>
      ${offerHtml(o, s.quick.o.check)}<p class="small muted">Łączy się z kartą: ${esc(s.quick.c.card.name)}.</p></div>`; })() : '';

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
  const twin = [...s.best, s.most, s.surprise].filter(Boolean).map(c => `<li>${c.paths.length ? c.paths.map(p => esc(p.label)).join(' + ') : 'twoje zainteresowania'} → <b>${esc(c.card.name)}</b> → ${c.offers.filter(o => o.check.reachable).slice(0, 2).map(o => esc(o.offer.name + ', ' + o.offer.institution)).join('; ') || 'brak kierunku bez zmian w maturze'}</li>`).join('');

  return `
    <h1>Cały raport</h1><p class="small muted noprint">Wszystko na jednej stronie, gotowe do druku. <button class="linkbtn" data-go="kompas">Wróć do kompasu</button></p>
    ${changesSince(r)}
    <nav class="rmenu noprint" aria-label="Części wyników"><button data-go="kompas">Kompas</button>${[['r-mocne', 'Mocne strony'], ['r-drogi', 'Drogi'], ['r-opcje', 'Opcje'], ['r-linie', 'Linie'], ['r-miejsca', 'Miejsca'], ['r-plik', 'Plik']].map(([id, t]) => `<button data-scroll="${id}">${t}</button>`).join('')}</nav>
    <h2 id="r-mocne">Twoje mocne strony</h2><div class="card reveal screen-only"><ul>${proven}</ul></div>
    <section class="print-only cutouts"><p class="small">Wytnij karty i połóż je na stole podczas rozmowy.</p><div class="cut">${provenStrengths(A).map(x => `<div class="cutcard"><b>${esc(data.strengths.find(y => y.id === x.id).name)}</b><span>${esc(x.proof)}</span></div>`).join('')}</div></section>
    <h2 id="r-drogi">Twoje drogi</h2>
    <p class="muted small">Od lewej: twoje mocne strony, w środku opcje, po prawej konkretne studia. Każda opcja to osobna linia. Grubsza linia to najlepsze dopasowanie, przerywana to droga przez twoje zainteresowania.</p>
    <p class="small noprint">Wybierz, gdzie się przydasz, żeby podświetlić drogi:</p>
    <div class="chips maprows noprint">${[...s.best, s.most, s.surprise].filter(Boolean).map((c, i) => `<button class="chip" data-maprow="${i}" aria-pressed="false">${esc(c.card.name)}</button>`).join('')}</div>
    <div class="card pathmap"><div class="scroll" tabindex="0" aria-label="Mapa dróg, przewiń w bok">${pathMapSvg(r)}</div>
      <p class="small muted hint">Przesuń palcem w bok, żeby zobaczyć całą mapę.</p>
      <div class="studies small" aria-live="polite"></div>
      <details class="twin noprint"><summary>Ta sama mapa jako tekst</summary><ul>${twin}</ul></details></div>

    <h2 class="pb" id="r-opcje">Gdzie się przydasz</h2>
    <p class="muted small">Bez liczb: każda opcja pokazuje, dlaczego się pojawiła. Najpierw trzy najlepsze dopasowania, potem Most ${term('most', 'Most')}, Szybki start ${term('szybki', 'Szybki start')} i Niespodzianka ${term('niespodzianka', 'Niespodzianka')}.</p>
    ${confLine(r.profile.confidence)}
    ${s.best.map((c, i) => cardHtml('Najlepsze dopasowanie', c, i === 0, sc)).join('')}
    ${s.most ? cardHtml('Most', s.most, false, sc) : ''}
    ${quick}
    ${s.surprise ? cardHtml('Niespodzianka', s.surprise, false, sc) : ''}
    ${s.rest.length ? `<details class="card"><summary>Pokaż więcej (${s.rest.length})</summary>${s.rest.map(c => cardHtml('Inna opcja', c, false, sc)).join('')}</details>` : ''}

    <h2 id="r-linie">Twoje linie w czasie</h2>
    <p class="muted small">Każda opcja to linia tramwajowa, a jej przystanki to kroki z datami. Wspólne przystanki to przesiadki: do jesieni 2027 wszystkie drogi biegną razem, więc zmiana linii jest normalna. Pomarańczowy przystanek oznacza, że przed 7 lutego coś warto zmienić w deklaracji.</p>
    <div class="card trammap">${tramMapSvg(tramLines(r))}${tramLegend(tramLines(r))}</div>

    <h2 id="r-miejsca">Gdzie to jest</h2>
    <div class="card"><ul class="places">${pins.map(p => `<li><b>${esc(p.c.name)}</b><br><span class="small">${esc(p.c.address)} · ${transit(p.c)} · ${commute(p.c)} · <a href="${routeUrl(p.c)}" target="_blank" rel="noopener">Zaplanuj dojazd</a></span></li>`).join('')}</ul>
      <p class="small muted">${data.transport ? `Przystanki, linie i czasy policzone z oficjalnego rozkładu jazdy Krakowa (GTFS, rozkład na ${esc(data.transport.asOf)}): ${esc(data.transport.method)}, plus twój dojazd na Dworzec Główny. Linie i objazdy się zmieniają, więc przed wyjazdem sprawdź trasę.` : 'Czasy dojazdu są jeszcze liczone.'}</p></div>
    <details class="card allplaces"><summary>Wszystkie miejsca w bazie (${data.campuses.length})</summary><ul class="places">${[...data.campuses].sort((a, b) => a.name.localeCompare(b.name, 'pl')).map(c => `<li><b>${esc(c.name)}</b>${c.status === 'do sprawdzenia' ? ' <span class="badge warn">adres do sprawdzenia</span>' : ''}<br><span class="small">${esc(c.address)} · ${transit(c)} · ${commute(c)} · <a href="${routeUrl(c)}" target="_blank" rel="noopener">Zaplanuj dojazd</a></span></li>`).join('')}</ul></details>

    <div class="card"><h3>Niemcy i dalej</h3>
      <p>Polska matura daje bezpośredni wstęp na niemieckie uczelnie. Większość studiów licencjackich jest po niemiecku (poziom C1), wiele magisterskich po angielsku. Obywatele UE nie płacą czesnego na uczelniach publicznych w Bawarii, tylko opłatę semestralną. Jedna z dróg: licencjat w Krakowie, magisterka w Monachium. Szczegóły pojawią się w kolejnej wersji.</p></div>

    ${doubt ? `<div class="card"><h3>To, co cię niepokoi</h3><p>${doubt.card}</p>
      ${A.doubtStrong ? '<p class="notice">Jeśli ten niepokój zostaje z tobą na dłużej, porozmawiaj z doradcą zawodowym w szkole albo w bezpłatnej poradni psychologiczno-pedagogicznej. To normalne, że przy takim wyborze pomaga człowiek, a nie aplikacja.</p>' : ''}</div>` : ''}

    <h2>Mogę to zrobić, bo…</h2>
    <label class="field" for="cando">Dokończ jednym zdaniem. Trafi na górę twojego pliku.</label>
    <input id="cando" type="text" data-field="canDo" value="${esc(A.canDo)}">

    <h2 id="r-plik">Twój plik</h2>
    <p>Plik powstaje na tym urządzeniu i nigdzie nie jest wysyłany. Za pół roku możesz do niego wrócić.</p>
    <div class="actions">
      <button class="btn" data-export="download">Pobierz plik .md</button>
      <button class="btn ghost" data-export="copy">Kopiuj do schowka</button>
      <button class="btn ghost" data-export="print">Drukuj / PDF</button>
    </div>
    <p id="msg" class="small muted" role="status"></p>

    <details class="card"><summary>Dla rodzica</summary><ul>
      <li>Pytaj, nie mów: „Co cię tu zaskoczyło?” działa lepiej niż „Widzisz, mówiłem”.</li>
      <li>Reaguj na dowody, nie na opcję: dowody są jego, opcja może się zmienić.</li>
      <li>Bez porównań między braćmi; każdy plik należy do właściciela.</li>
      <li>Umówcie się na jeden mały krok w tym miesiącu, nie na ostateczny wybór.</li>
      <li>Jeśli niepokój jest silny, doradca zawodowy w szkole albo bezpłatna poradnia psychologiczno-pedagogiczna.</li></ul></details>
    <div class="actions noprint"><button class="btn ghost" data-go="pewnosc">Zmień odpowiedzi</button></div>`;
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
    list.innerHTML = names.length ? `<b>Studia na tej drodze:</b><ul>${names.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '';
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
  if (d.skintoggle !== undefined) { skin = SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length]; applySkin(true); return; }
  if (d.skinpick !== undefined) { skin = d.skinpick || null; applySkin(true); return; }
  const tk = ['set', 'toggle', 'value', 'strength', 'lang', 'sector'].find(k => d[k] !== undefined);
  if (tk) tapSel = `[data-${tk}="${CSS.escape(d[tk])}"]` + (d.val !== undefined ? `[data-val="${CSS.escape(d.val)}"]` : '');
  if (d.themetoggle !== undefined) { const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; theme = dark ? 'light' : 'dark'; applyTheme(); return; }
  if (d.term !== undefined) { const open = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', String(open)); t.nextElementSibling.hidden = !open; return; }
  if (d.go) { location.hash = '#/' + d.go; return; }
  if (d.scroll) { document.getElementById(d.scroll)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
  if (d.sector !== undefined) { sectorSel = sectorSel === d.sector ? null : d.sector; render(); return; }
  if (d.area !== undefined) { areaFilter = d.area || null; render(); return; }
  if (d.pick !== undefined) { pickDirection(d.pick, Number(t.dataset.ang)); return; }
  if (d.goopt) { kierSel = d.goopt; location.hash = '#/w-kierunki'; return; }
  if (d.kier) { kierSel = d.kier; render(); return; }
  if (d.flip !== undefined) { t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true')); return; }
  if (d.set) { setA(d.set, A[d.set] === d.val && d.set !== 'certainty' && d.set !== 'studyLength' ? null : d.val); return; }
  if (d.toggle) { const arr = A[d.toggle]; const i = arr.indexOf(d.val); i >= 0 ? arr.splice(i, 1) : arr.push(d.val); save(); render(); return; }
  if (d.lang) { A.jezyki[d.lang] = d.val; save(); render(); return; }
  if (d.sortans !== undefined) { sortAnswer(Number(d.sortans)); return; }
  if (d.sitans !== undefined) { const q = data.questions.situations[A.sitPos]; if (d.sitans) A.situations[q.id] = d.sitans; else delete A.situations[q.id]; A.sitPos++; render(); return; }
  if (d.sitback !== undefined) { A.sitPos = Math.max(0, A.sitPos - 1); render(); return; }
  if (d.sitreset !== undefined) { A.sitPos = 0; render(); return; }
  if (d.sortback !== undefined) { A.sortPos = Math.max(0, A.sortPos - 1); save(); render(); return; }
  if (d.sortreset !== undefined) { A.sortPos = 0; save(); render(); return; }
  if (d.value) { const i = A.values.indexOf(d.value); if (i >= 0) A.values.splice(i, 1); else if (A.values.length < 5) A.values.push(d.value); save(); render(); return; }
  if (d.strength) { const i = A.strengths.findIndex(s => s.id === d.strength); if (i >= 0) A.strengths.splice(i, 1); else if (A.strengths.length < 5) A.strengths.push({ id: d.strength, proof: '' }); save(); render(); return; }
  if (d.strong !== undefined) { setA('doubtStrong', d.strong === '1'); return; }
  if (d.persona) { const p = data.personas.find(x => x.id === d.persona); A = Object.assign(blank(), structuredClone(p.answers), { sortPos: data.questions.activities.length, sitPos: data.questions.situations.length }); furthest = screens.length; save(); location.hash = '#/kompas'; render(); return; }
  if (d.export) doExport(d.export);
});

document.addEventListener('change', e => {
  if (!e.target.matches('[data-check]')) return;
  A.checks = A.checks || {}; A.checks[e.target.dataset.check] = e.target.checked; save();
  const list = e.target.closest('.plan-list'), n = list?.querySelector('.plan-n');
  if (n) n.textContent = `Zrobione: ${list.querySelectorAll('input:checked').length} z ${list.querySelectorAll('input[data-check]').length}. Plan zapisuje się w twoim pliku.`;
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
  prev.innerHTML = compassSel ? previewHtml(r, compassSel) : '<p class="clead">Trzy dobre drogi, nie jedna. Dotknij kierunku, a kompas pokaże, dokąd prowadzi.</p>';
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
  const m = text.match(/```json\s*([\s\S]*?)```/g);
  let obj = null;
  try { obj = m && JSON.parse(m[m.length - 1].replace(/^```json\s*/, '').replace(/```$/, '')); } catch { obj = null; }
  if (!obj || !obj.answers || !String(obj.app || '').startsWith('kompas-studia')) {
    notice = 'To nie wygląda na plik z Kompasu Studia. Wybierz plik pobrany z tej aplikacji.'; render(); return;
  }
  const a = Object.assign(blank(), obj.answers), missing = [];
  const has = (list, id) => list.some(x => x.id === id);
  a.strengths = (a.strengths || []).filter(x => has(data.strengths, x.id) || (missing.push('mocna strona: ' + x.id), false));
  a.values = (a.values || []).filter(v => has(data.dimensions.values, v) || (missing.push('wartość: ' + v), false));
  for (const k of Object.keys(a.sort || {})) if (!has(data.questions.activities, k)) { delete a.sort[k]; missing.push('czynność: ' + k); }
  for (const k of Object.keys(a.situations || {})) if (!has(data.questions.situations, k)) { delete a.situations[k]; missing.push('sytuacja: ' + k); }
  if (a.direction && !has(data.opportunities, a.direction)) { missing.push('kierunek: ' + a.direction); a.direction = null; }
  const snap = obj.snapshot || null;
  if (snap) for (const id of [...(snap.best || []), snap.most, snap.surprise].filter(Boolean)) if (!has(data.opportunities, id)) missing.push('opcja: ' + id);
  a.sortPos = Object.keys(a.sort).length >= data.questions.activities.length ? data.questions.activities.length : Object.keys(a.sort).length;
  a.sitPos = Object.keys(a.situations).length;
  A = a;
  prevFile = { date: obj.date, snapshot: snap, missing };
  notice = `Wczytano plik z dnia ${esc(obj.date || '?')}.` + (missing.length ? ` Tych rzeczy nie ma już w bazie, więc je pominięto: ${missing.map(esc).join(', ')}.` : '');
  drawOnce = true;
  savedSnap = answersKey();
  const done = provenStrengths(A).length && A.values.length;
  const target = '#/' + (screens.some(x => x.id === A.lastScreen) ? A.lastScreen : done ? 'kompas' : 'pewnosc');
  furthest = done ? screens.length : screens.findIndex(x => '#/' + x.id === target);
  notice += ` Wracasz tam, gdzie skończyłeś.`;
  if (location.hash === target) render(); else location.hash = target;
}

document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.field) { A[d.field] = d.field === 'startMin' ? Number(t.value) : t.value; save(); if (t.id === 'name' || t.id === 'cando' || t.id === 'sport' || t.id === 'start') return; }
  if (d.slider) { A.sliders[d.slider] = Number(t.value); save(); return; }
  if (d.proof) { const s = A.strengths.find(x => x.id === d.proof); s.proof = t.value; save();
    const ok = provenStrengths(A).length === 5; const next = $app.querySelector('.nav .btn:not(.ghost)'); if (next) next.disabled = !ok;
    const h = document.getElementById('navhint'); if (h) h.textContent = ok ? '' : current().hint(); return; }
  if (d.refl) { A.reflection[d.refl] = t.value; save(); }
});

async function doExport(kind) {
  const r = scoreAll(A, data), md = buildMarkdown(A, r, data, today());
  const msg = document.getElementById('msg') || document.getElementById('fmsg');
  if (kind === 'download') {
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    const name = fileName(A, stamp());
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (msg) msg.textContent = 'Plik zapisany.';
    savedSnap = answersKey(); updateSaveState();
    toast(`<b>Zapisano:</b> ${esc(name)}<br><span>Plik jest w folderze Pobrane. Żeby wrócić, wczytaj go na ekranie startowym.</span>`);
  } else if (kind === 'copy') {
    try { await navigator.clipboard.writeText(md); msg.textContent = 'Skopiowane.'; } catch { msg.textContent = 'Nie udało się skopiować. Użyj „Pobierz plik”.'; }
  } else {
    if (current().id !== 'wyniki') { location.hash = '#/wyniki'; setTimeout(() => doExport('print'), 500); return; }
    const closed = [...document.querySelectorAll('details:not([open])')];
    closed.forEach(d => d.open = true);
    window.print();
    closed.forEach(d => d.open = false);
  }
}

load().catch(err => { $app.innerHTML = `<p>Nie udało się wczytać danych (${esc(err.message)}). Odśwież stronę.</p>`; });
