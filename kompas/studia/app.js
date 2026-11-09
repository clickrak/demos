// Kompas Studia v0.1: flow test. Screens, navigation, results, export.
import { scoreAll, provenStrengths, pathSteps } from '../core/scoring.js';
import { buildMarkdown, fileName } from '../core/export.js';

const $app = document.getElementById('app');
const TEST = new URLSearchParams(location.search).has('test');
let data, A;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ name: '', certainty: null, direction: null, rozszerzenia: [], jezyki: { pl: 'bardzo dobry' }, sport: '',
  sort: {}, sortPos: 0, sliders: {}, values: [], strengths: [], scenario: null, neededWhere: null, homePlaces: [],
  studyLength: null, startMin: 30, doubt: null, doubtStrong: false, reflection: {}, canDo: '' });

async function load() {
  const get = p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  const [dimensions, strengths, config, questions, scenarios, opportunities, offers, campuses, sources, personas] = await Promise.all([
    '../core/dimensions.json', '../core/strengths.json', 'data/config.json', 'data/questions.json', 'data/scenarios.json',
    'data/opportunities.json', 'data/db/pl/krakow/offers.json', 'data/db/pl/krakow/campuses.json', 'data/sources.json', 'data/personas.json'
  ].map(get));
  data = { dimensions, strengths, config, questions, scenarios, opportunities, offers, campuses, sources, personas };
  A = blank();
  window.addEventListener('hashchange', render);
  render();
}

const save = () => {}; // v0.1 keeps answers in memory only; the .md export is the saved copy
const setA = (k, v) => { A[k] = v; save(); render(); };

// ---- screens ----------------------------------------------------------------
const screens = [
  { id: 'start', ch: null, view: vStart },
  { id: 'pewnosc', ch: 'ja', view: vCertainty, ok: () => A.certainty },
  { id: 'matura', ch: 'ja', view: vMatura },
  { id: 'jezyki', ch: 'ja', view: vLanguages },
  { id: 'zajecia', ch: 'ja', view: vSort, ok: () => A.sortPos >= data.questions.activities.length },
  { id: 'styl', ch: 'ja', view: vStyle },
  { id: 'wartosci', ch: 'ja', view: vValues, ok: () => A.values.length === 3 },
  { id: 'mocne', ch: 'ja', view: vStrengths, ok: () => provenStrengths(A).length === 5 },
  { id: 'odbicie', ch: 'ja', view: vReveal },
  { id: 'sily', ch: 'swiat', view: vForces },
  { id: 'sektory', ch: 'swiat', view: vSectors },
  { id: 'karty', ch: 'swiat', view: vCardsPreview },
  { id: 'dlugosc', ch: 'droga', view: vLength, ok: () => A.studyLength },
  { id: 'zasieg', ch: 'droga', view: vReach },
  { id: 'niepokoj', ch: 'droga', view: vDoubt },
  { id: 'refleksja', ch: 'droga', view: vReflection },
  { id: 'wyniki', ch: 'wyniki', view: vResults }
];

function current() {
  const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'start';
  return screens.find(s => s.id === id) || screens[0];
}

function render() {
  const s = current();
  document.querySelectorAll('.chapters span').forEach(el => el.classList.toggle('on', el.dataset.ch === s.ch));
  const i = screens.indexOf(s);
  const body = s.view();
  const nav = s.id === 'start' || s.id === 'wyniki' ? '' : `
    <div class="nav">
      <button class="btn ghost" data-go="${screens[i - 1].id}">Wstecz</button>
      <button class="btn" data-go="${screens[i + 1].id}" ${s.ok && !s.ok() ? 'disabled' : ''}>${s.id === 'refleksja' ? 'Pokaż wyniki' : 'Dalej'}</button>
    </div>`;
  const keep = document.activeElement && document.activeElement.id;
  const changed = $app.dataset.screen !== s.id;
  $app.innerHTML = `<div class="${changed ? 'fade' : ''}">${body}${nav}</div>`;
  $app.dataset.screen = s.id;
  if (changed) mapSel = null;
  if (changed) { window.scrollTo(0, 0); $app.focus({ preventScroll: true }); }
  else if (keep && document.getElementById(keep)) { const el = document.getElementById(keep); el.focus(); if (el.setSelectionRange && el.value) el.setSelectionRange(el.value.length, el.value.length); }
}

const chip = (attrs, label, on) => `<button class="chip" ${attrs} aria-pressed="${on ? 'true' : 'false'}">${label}</button>`;

function vStart() {
  return `
    <h1>Co już umiesz i gdzie się przydasz</h1>
    <p class="lead">Za chwilę zadamy ci kilka pytań. Nie ma złych odpowiedzi — chodzi o to, co cię naprawdę interesuje.</p>
    <p>Trzy krótkie rozdziały: <b>Ja</b> (twoje mocne strony), <b>Świat</b> (gdzie będą potrzebne) i <b>Droga</b> (jak tam dojść). Na końcu dostajesz plik, który zostaje u ciebie.</p>
    <p class="muted small">Jest wiele dobrych dróg, a wybór można korygować. To punkt wyjścia do rozmowy, nie test i nie wyrok. Odpowiedzi są tylko w tej karcie przeglądarki: po zamknięciu znikają, zostaje pobrany plik.</p>
    <label class="field" for="name">Imię (opcjonalnie, tylko do nazwy pliku)</label>
    <input id="name" type="text" data-field="name" value="${esc(A.name)}" autocomplete="off">
    <div class="actions">
      <button class="btn" data-go="pewnosc">${A.certainty ? 'Wróć do pytań' : 'Zaczynamy'}</button>
      ${A.certainty ? '<button class="btn ghost" data-go="wyniki">Moje wyniki</button>' : ''}
    </div>
    <details class="card noprint"><summary>Tryb testowy</summary>
      <p class="small muted">Wczytaj gotowe odpowiedzi, żeby obejrzeć wyniki bez wypełniania.</p>
      <div class="actions">${data.personas.map(p => `<button class="btn ghost" data-persona="${p.id}">${esc(p.label)}</button>`).join('')}</div>
    </details>`;
}

function vCertainty() {
  const dir = A.certainty === 'pewny' ? `
    <p>Który kierunek masz w głowie? Pokażemy go pierwszy, a obok dwa sąsiednie.</p>
    <div class="chips">${data.opportunities.map(c => chip(`data-set="direction" data-val="${c.id}"`, esc(c.name), A.direction === c.id)).join('')}</div>` : '';
  return `<h1>Jak pewny jesteś swojego kierunku?</h1>
    <div class="chips stack">${data.questions.certainty.map(c => chip(`data-set="certainty" data-val="${c.id}"`, c.label, A.certainty === c.id)).join('')}</div>${dir}`;
}

function vMatura() {
  return `<h1>Jakie przedmioty zdajesz na poziomie rozszerzonym?</h1>
    <p class="explain">Rozszerzenie to przedmiot na maturze na wyższym poziomie. Od niego zależy, na które kierunki możesz się dostać.</p>
    <div class="chips">${data.questions.subjects.map(s => chip(`data-toggle="rozszerzenia" data-val="${s}"`, s, A.rozszerzenia.includes(s))).join('')}</div>
    <p class="small muted">Deklarację można zmienić do ${data.config.declarationDeadline}. Potem już nie.</p>`;
}

function vLanguages() {
  const rows = data.questions.languages.map((l, i) => { const lv = A.jezyki[l.id] || 'brak';
    return `<fieldset class="card langcard" style="border:1px solid var(--line)"><legend class="sr">${l.name}</legend>
      <h3>${i + 1}. ${l.name[0].toUpperCase() + l.name.slice(1)}</h3><p class="small muted">Twój poziom: <b>${lv}</b></p>
      <div class="chips" role="radiogroup" aria-label="Poziom: ${l.name}">${data.questions.languageLevels.map(v => chip(`data-lang="${l.id}" data-val="${v}"`, v, lv === v)).join('')}</div></fieldset>`; }).join('');
  return `<h1>Języki i sport</h1>
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
  return `<h1>Co lubisz robić</h1><p class="muted">Bez zastanawiania się. Chodzi o samą czynność, nie o zawód.</p>
    <div class="card sort"><div class="q">${esc(a.text)}</div>
      <div class="row">
        <button class="btn ghost" data-sortans="-1">nie lubię</button>
        <button class="btn" data-sortans="1">lubię</button>
      </div>
      <button class="chip" data-sortans="0" style="margin-top:12px">obojętne, pomiń</button>
      ${pos > 0 ? '<button class="chip" data-sortback style="margin-top:12px">cofnij</button>' : ''}
    </div>${dots}`;
}

function vStyle() {
  return `<h1>Jak lubisz pracować?</h1><p class="muted">Przesuń w stronę, która bardziej do ciebie pasuje. Środek też jest w porządku.</p>
    ${data.dimensions.workStyle.map(w => `<div class="slider"><div class="ends"><span>${w.left}</span><span>${w.right}</span></div>
      <input type="range" min="-3" max="3" step="1" id="sl-${w.id}" data-slider="${w.id}" value="${A.sliders[w.id] ?? 0}" aria-label="${w.left} albo ${w.right}"></div>`).join('')}`;
}

function vValues() {
  return `<h1>Co jest dla ciebie ważne w pracy?</h1><p>Wybierz trzy, w kolejności: najpierw najważniejsze.</p>
    <div class="chips">${data.dimensions.values.map(v => { const i = A.values.indexOf(v.id);
      return chip(`data-value="${v.id}"`, `${i >= 0 ? `<span class="n">${i + 1}.</span> ` : ''}${v.name}`, i >= 0); }).join('')}</div>`;
}

function vStrengths() {
  const picked = A.strengths.map(s => s.id);
  const list = A.strengths.map(s => { const st = data.strengths.find(x => x.id === s.id);
    return `<div class="strength"><label class="field" for="pr-${s.id}">${esc(st.name)}: kiedy to pokazałeś? Jedno zdanie wystarczy.</label>
      <input id="pr-${s.id}" type="text" data-proof="${s.id}" value="${esc(s.proof)}" placeholder="${esc(st.example)}"></div>`; }).join('');
  return `<h1>Twoje mocne strony</h1>
    <p>Wybierz 5 rzeczy, które ci wychodzą. Do każdej dopisz jeden przykład ze swojego życia: sport, szkoła, dom i rodzina, języki, pomoc innym.</p>
    <div class="chips">${data.strengths.map(s => chip(`data-strength="${s.id}"`, s.name, picked.includes(s.id))).join('')}</div>
    ${list ? `<div class="card">${list}</div>` : ''}
    <p class="small muted">Mocna strona liczy się dopiero z przykładem. Przykład nie musi być wielki.</p>`;
}

function possibleStrengths(r) {
  const picked = new Set(A.strengths.map(s => s.id));
  const top = r.profile.top.slice(0, 2);
  return data.strengths.filter(s => !picked.has(s.id) && s.dims.some(d => top.includes(d))).slice(0, 2);
}

function vReveal() {
  const r = scoreAll(A, data);
  const proven = provenStrengths(A).map(s => { const st = data.strengths.find(x => x.id === s.id);
    return `<li><b>${esc(st.name)}</b><span class="proof">Widać to po tym, że: ${esc(s.proof)}</span></li>`; }).join('');
  const maybe = possibleStrengths(r).map(s => `<li>${esc(s.name)} <span class="badge">możliwa mocna strona</span></li>`).join('');
  return `<h1>To już widać</h1><p class="lead">Twoje mocne strony, twoimi słowami:</p>
    <div class="card reveal"><ul>${proven}</ul></div>
    ${maybe ? `<p>Twoje odpowiedzi podpowiadają jeszcze:</p><div class="card"><ul>${maybe}</ul><p class="small muted">Jeśli przypomnisz sobie przykład, wróć i dopisz.</p></div>` : ''}
    <p>Teraz zobaczmy, gdzie te mocne strony będą potrzebne.</p>`;
}

function vForces() {
  const src = id => data.sources.find(s => s.id === id);
  return `<h1>Co będzie prawdą w każdym scenariuszu</h1>
    <p>Przyszłości nikt nie zna, ale te siły działają niezależnie od tego, co się wydarzy.</p>
    ${data.scenarios.forces.map(f => { const s = src(f.sourceId);
      return `<div class="card"><h3>${f.name}</h3><p>${f.text}</p><p class="small muted">${s ? `Źródło: <a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a>, ` : ''}stan na ${f.asOf}</p></div>`; }).join('')}`;
}

function vSectors() {
  return `<h1>Sektory z pracą na lata</h1>
    <div class="card"><ul>${data.scenarios.sectors.map(s => `<li>${s}</li>`).join('')}</ul></div>
    <p class="muted small">${data.scenarios.shrinking}</p>
    <p class="lead">Mniej ludzi do pracy oznacza, że każdy będzie bardziej potrzebny.</p>`;
}

function vCardsPreview() {
  return `<h1>Gdzie można się przydać</h1>
    <p>W tej wersji jest ${data.opportunities.length} obszarów. Za chwilę zobaczysz, które pasują do twoich mocnych stron.</p>
    ${data.opportunities.map(c => `<div class="card"><h3>${esc(c.name)}</h3><p class="small">${esc(c.whoYouHelp)}</p></div>`).join('')}`;
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
      <textarea id="rf-${q.id}" data-refl="${q.id}">${esc(A.reflection[q.id] || '')}</textarea>`).join('')}`;
}

// ---- results ----------------------------------------------------------------
const campus = id => data.campuses.find(c => c.id === id);

function commute(c) {
  const base = Number(A.startMin) || 0;
  const t = base + c.minFromHub;
  return `ok. ${t}–${t + 10} min${c.status === 'przyklad' ? ' (przykład)' : ''}`;
}

function offerHtml(o, chk) {
  const c = campus(o.campus);
  const route = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + ', Kraków')}`;
  return `<div class="offer">
    <b>${esc(o.name)}</b>, ${esc(o.institution)}<br>
    <span class="muted">${esc(o.level)} · ${String(o.durationYears).replace('.', ',')} ${o.durationYears < 5 ? 'lata' : 'lat'}</span><br>
    ${chk.ok.map(t => `<span class="badge">${esc(t)}</span>`).join('')}${chk.blocked.map(t => `<span class="badge warn">${esc(t)}</span>`).join('')}${chk.flags.map(t => `<span class="badge warn">${esc(t)}</span>`).join('')}
    <div class="small">Wymagania: ${esc(o.requires.note || '-')}</div>
    ${chk.fix ? `<div class="small fix">Co możesz zrobić: ${esc(chk.fix)}</div>` : ''}
    <div class="small">${esc(c.name)}, ${esc(c.address)} · ${esc(c.lines)} · z domu ${commute(c)} · <a href="${route}" target="_blank" rel="noopener">Zaplanuj dojazd</a></div>
  </div>`;
}

function cardHtml(slot, c, open, scenario) {
  const k = c.card;
  const force = data.scenarios.forces.find(f => f.id === k.force);
  const conv = c.paths.length >= 2 ? `<p class="converge">Dotarłeś tu ${c.paths.length} drogami: ${c.paths.map(p => esc(p.label)).join(', ')}.</p>` : '';
  const reach = c.offers.filter(o => o.check.reachable), blocked = c.offers.filter(o => !o.check.reachable);
  const first = reach[0]?.offer;
  const body = `
    <p class="small muted">${c.reasons.map(esc).join(' · ')}</p>${conv}
    <dl>
      <dt>Komu pomagasz</dt><dd>${esc(k.whoYouHelp)}</dd>
      <dt>Co to daje tobie</dt><dd>${esc(k.whatYouGet)}</dd>
      <dt>Dlaczego będzie potrzebne</dt><dd>${esc(k.whyNeeded)}${force ? ` <span class="muted small">(${force.name.toLowerCase()})</span>` : ''}</dd>
      ${c.strengthsUsed.length ? `<dt>Twoje mocne strony, które tu pracują</dt><dd>${c.strengthsUsed.map(p => esc(p.label)).join(', ')}</dd>` : ''}
      <dt>Jak wygląda dzień pracy</dt><dd><ul>${k.dayInLife.map(d => `<li>${esc(d)}</li>`).join('')}</ul></dd>
      <dt>Jak tu rośniesz</dt><dd>${k.growth.map(esc).join(' → ')}</dd>
      <dt>Odporność na scenariusze</dt><dd>${data.scenarios.scenarios.map(x => `${esc(x.name)}: ${esc(k.robustness[x.id])}`).join(' · ')}${k.robustnessNote ? ` <span class="muted small">${esc(k.robustnessNote)}</span>` : ''} <span class="muted small">(propozycja do sprawdzenia)</span></dd>
      <dt>Przykładowe role</dt><dd>${esc(k.roles)}</dd>
      <dt>W Krakowie</dt><dd>${reach.map(o => offerHtml(o.offer, o.check)).join('')}${blocked.length ? `<p class="small muted">Wymagają zmiany w maturze:</p>${blocked.map(o => offerHtml(o.offer, o.check)).join('')}` : ''}${!c.offers.length ? '<span class="muted">brak danych w tej wersji</span>' : ''}</dd>
      ${first ? `<dt>Twoja droga</dt><dd><ul>${pathSteps(first, campus(first.campus).name).map(s => `<li>${esc(s)}</li>`).join('')}</ul></dd>` : ''}
      <dt>Mini-eksperyment na 30 dni</dt><dd>${esc(k.experiment)}</dd>
    </dl>
    ${TEST ? `<p class="testv">fit ${c.fit.toFixed(1)} · int ${c.parts.interests.toFixed(2)} · styl ${c.parts.workStyle.toFixed(2)} · wart ${c.parts.values.toFixed(2)}</p>` : ''}`;
  return `<details class="card opt" ${open ? 'open' : ''}>
    <summary><span class="badge slot">${slot}</span> <span class="badge">${esc(c.band)}</span>${c.pinned ? ' <span class="badge slot">twój kierunek</span>' : ''}<h3>${esc(k.name)}</h3></summary>${body}</details>`;
}

// Path map, left to right: his strengths (roots) → options → Kraków studies.
// Each shown option is one coloured line; its name is written on the line, so colour is never the only cue.
const LINE_COLORS = ['#1f6f6b', '#b5562c', '#4a5fa8', '#7a6a1d', '#8a3f78', '#3d7a3a'];

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
  const roots = [...proven, { id: '_int', name: 'zainteresowania: ' + topDims.join(', ') }];

  // Studies column: up to 2 reachable offers per option, plus the quick start.
  const offers = [];
  rows.forEach((row, i) => {
    row.color = LINE_COLORS[i % LINE_COLORS.length];
    row.offers = row.c.offers.filter(o => o.check.reachable).slice(0, 2).map(o => o.offer);
    for (const o of row.offers) if (!offers.find(x => x.id === o.id)) offers.push(o);
  });
  if (s.quick && !offers.find(x => x.id === s.quick.o.offer.id)) offers.push(s.quick.o.offer);

  const W = 860, ROW = 62, CROW = 104, X1 = 200, X2 = 470, X3 = 640;
  const BODY = Math.max(roots.length * ROW, rows.length * CROW, offers.length * ROW), COMPASS = 120;
  const H = BODY + 80 + COMPASS;
  const ys = (n, step) => Array.from({ length: n }, (_, i) => 70 + (BODY - n * step) / 2 + i * step + step / 2);
  const yR = ys(roots.length, ROW), yC = ys(rows.length, CROW), yO = ys(offers.length, ROW);
  const curve = (x1, y1, x2, y2) => { const m = (x1 + x2) / 2; return `M${x1},${y1.toFixed(1)} C${m},${y1.toFixed(1)} ${m},${y2.toFixed(1)} ${x2},${y2.toFixed(1)}`; };

  // Which rows (options) touch each root and each offer: used to fade what is not on the selected road.
  const rootRows = roots.map(() => new Set()), offerRows = offers.map(() => new Set());
  const cls = set => [...set].map(i => 'r' + i).join(' ');
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Mapa dróg: od twoich mocnych stron, przez opcje, do kierunków w Krakowie. Wybierz opcję, żeby podświetlić jej drogi.">`;
  svg += `<text x="20" y="28" class="col">TWOJE MOCNE STRONY</text><text x="${X2 - 90}" y="28" class="col">GDZIE SIĘ PRZYDASZ</text><text x="${X3 + 18}" y="28" class="col">STUDIA W KRAKOWIE</text>`;

  rows.forEach((row, i) => {
    const ids = row.c.paths.filter(p => p.kind === 'strength').map(p => p.id);
    const fromDim = row.c.paths.some(p => p.kind === 'dimension') || !ids.length;
    const src = [...ids, ...(fromDim ? ['_int'] : [])];
    const w = row.slot === 'najlepsze' ? 5 : 3.5;
    for (const id of src) {
      const j = roots.findIndex(x => x.id === id);
      rootRows[j].add(i);
      svg += `<path class="seg r${i}" d="${curve(X1, yR[j], X2, yC[i])}" stroke="${row.color}" stroke-width="${w}" fill="none" ${id === '_int' ? 'stroke-dasharray="6 5"' : ''}/>`;
    }
    for (const o of row.offers) {
      const k = offers.findIndex(x => x.id === o.id);
      offerRows[k].add(i);
      svg += `<path class="seg r${i}" d="${curve(X2, yC[i], X3, yO[k])}" stroke="${row.color}" stroke-width="${w}" fill="none"/>`;
    }
  });
  if (s.quick) {
    const k = offers.findIndex(x => x.id === s.quick.o.offer.id), i = rows.findIndex(x => x.c === s.quick.c);
    if (i >= 0) { offerRows[k].add(i); svg += `<path class="seg r${i}" d="${curve(X2, yC[i], X3, yO[k])}" stroke="var(--muted)" stroke-width="2.5" fill="none" stroke-dasharray="2 5"/>`; }
  }

  roots.forEach((rt, j) => {
    svg += `<g class="node ${cls(rootRows[j])}"><text x="${X1 - 16}" y="${yR[j]}" text-anchor="end" class="lbl">${tspans(wrap(rt.name, 22), X1 - 16, yR[j] + 4)}</text>`;
    svg += `<circle cx="${X1}" cy="${yR[j]}" r="8" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/></g>`;
  });
  rows.forEach((row, i) => {
    const y = yC[i], label = row.slot === 'most' ? 'Most' : row.slot === 'niespodzianka' ? 'Niespodzianka' : row.c.band;
    svg += `<g class="node stop r${i}" data-maprow="${i}" data-color="${row.color}" role="button" tabindex="0" aria-label="Podświetl drogi: ${esc(row.c.card.name)}">`;
    svg += `<rect x="${X2 - 120}" y="${y - 58}" width="240" height="100" fill="transparent"/>`;
    svg += `<rect x="${X2 - 13}" y="${y - 13}" width="26" height="26" rx="13" fill="${row.color}" stroke="var(--card)" stroke-width="3"/>`;
    svg += `<text text-anchor="middle" class="stn" style="fill:${row.color}">${tspans(wrap(row.c.card.name, 26), X2, y - 32, 15)}</text>`;
    svg += `<text x="${X2}" y="${y + 30}" text-anchor="middle" class="tag">${esc(label)}</text></g>`;
  });
  offers.forEach((o, k) => {
    const quick = s.quick && s.quick.o.offer.id === o.id;
    svg += `<g class="node study ${cls(offerRows[k])}"><circle cx="${X3}" cy="${yO[k]}" r="7" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`;
    svg += `<text class="lbl">${tspans([o.name, o.institution + (quick ? ' · szybki start' : '')].flatMap(t => wrap(t, 30)).slice(0, 3), X3 + 16, yO[k] + 4)}</text></g>`;
  });

  // Compass: the needle points at the station of the most probable option (highest fit).
  const top = rows.reduce((b, row, i) => (row.c.fit > rows[b].c.fit ? i : b), 0);
  const cx = 70, cy = H - 62, R = 34;
  const ang = Math.atan2(yC[top] - cy, X2 - 16 - cx), deg = ang * 180 / Math.PI;
  svg += `<path class="seg r${top} hint-line" d="M${(cx + R * Math.cos(ang)).toFixed(1)},${(cy + R * Math.sin(ang)).toFixed(1)} L${X2 - 16},${yC[top].toFixed(1)}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="1 6" fill="none"/>`;
  svg += `<g class="compass-rose" data-maprow="${top}" role="button" tabindex="0" aria-label="Kompas wskazuje: ${esc(rows[top].c.card.name)}">`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/>`;
  for (let t = 0; t < 8; t++) { const a = t * Math.PI / 4, r1 = t % 2 ? R - 5 : R - 9;
    svg += `<line x1="${(cx + r1 * Math.cos(a)).toFixed(1)}" y1="${(cy + r1 * Math.sin(a)).toFixed(1)}" x2="${(cx + (R - 2) * Math.cos(a)).toFixed(1)}" y2="${(cy + (R - 2) * Math.sin(a)).toFixed(1)}" stroke="var(--muted)" stroke-width="1.5"/>`; }
  svg += `<g transform="rotate(${deg.toFixed(1)} ${cx} ${cy})"><polygon points="${cx + R - 6},${cy} ${cx},${cy - 6} ${cx},${cy + 6}" fill="${rows[top].color}"/><polygon points="${cx - R + 10},${cy} ${cx},${cy - 6} ${cx},${cy + 6}" fill="var(--check)"/></g>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--ink)"/></g>`;
  svg += `<text class="lbl"><tspan x="${cx + R + 16}" y="${cy - 8}" class="col">KOMPAS WSKAZUJE</tspan><tspan x="${cx + R + 16}" y="${cy + 12}" style="font-weight:700;fill:${rows[top].color}">${esc(rows[top].c.card.name)}</tspan><tspan x="${cx + R + 16}" y="${cy + 30}" class="tag">najbardziej prawdopodobna droga, nie jedyna</tspan></text>`;
  return svg + '</svg>';
}

function vResults() {
  if (provenStrengths(A).length < 1 || !A.values.length) {
    return `<h1>Jeszcze trochę</h1><p>Wyniki pojawią się, gdy przejdziesz przez rozdział Ja (mocne strony i wartości).</p><button class="btn" data-go="pewnosc">Wracam do pytań</button>`;
  }
  const r = scoreAll(A, data), s = r.slots, sc = A.scenario || 'B';
  const proven = provenStrengths(A).map(x => `<li><b>${esc(data.strengths.find(y => y.id === x.id).name)}</b><span class="proof">${esc(x.proof)}</span></li>`).join('');
  const quick = s.quick ? (() => { const o = s.quick.o.offer;
    return `<div class="card opt"><span class="badge slot">Szybki start</span><h3>${esc(o.name)}</h3>
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
    <h1>Twój kompas</h1>
    <h2>Twoje mocne strony</h2><div class="card reveal"><ul>${proven}</ul></div>
    <h2>Twoje drogi</h2>
    <p class="muted small">Od lewej: twoje mocne strony, w środku opcje, po prawej konkretne studia. Każda opcja to osobna linia. Grubsza linia to najlepsze dopasowanie, przerywana to droga przez twoje zainteresowania. Kompas wskazuje najbardziej prawdopodobną drogę.</p>
    <p class="small">Wybierz, gdzie się przydasz, żeby podświetlić drogi:</p>
    <div class="chips maprows noprint">${[...s.best, s.most, s.surprise].filter(Boolean).map((c, i) => `<button class="chip" data-maprow="${i}" aria-pressed="false">${esc(c.card.name)}</button>`).join('')}</div>
    <div class="card pathmap"><div class="scroll" tabindex="0" aria-label="Mapa dróg, przewiń w bok">${pathMapSvg(r)}</div>
      <p class="small muted hint">Przesuń palcem w bok, żeby zobaczyć całą mapę.</p>
      <div class="studies small" aria-live="polite"></div>
      <details class="twin"><summary>Ta sama mapa jako tekst</summary><ul>${twin}</ul></details></div>

    <h2>Gdzie się przydasz</h2>
    <p class="muted small">Bez liczb: każda opcja pokazuje, dlaczego się pojawiła. Otwarte są najwyżej trzy karty naraz.</p>
    ${s.best.map((c, i) => cardHtml('Najlepsze dopasowanie', c, i === 0, sc)).join('')}
    ${s.most ? cardHtml('Most: łączy twoje dwa główne zainteresowania', s.most, false, sc) : ''}
    ${quick}
    ${s.surprise ? cardHtml('Niespodzianka: może cię zaskoczyć', s.surprise, false, sc) : ''}
    ${s.rest.length ? `<details class="card"><summary>Pokaż więcej (${s.rest.length})</summary>${s.rest.map(c => cardHtml('Inna opcja', c, false, sc)).join('')}</details>` : ''}

    <h2>Gdzie to jest</h2>
    <div class="card"><ul class="places">${pins.map(p => `<li><b>${esc(p.c.name)}</b><br><span class="small">${esc(p.c.address)} · ${esc(p.c.lines)} · z domu ${commute(p.c)} · <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.c.address + ', Kraków')}" target="_blank" rel="noopener">Zaplanuj dojazd</a></span></li>`).join('')}</ul>
      <p class="small muted">Czasy dojazdu w tej wersji są przykładowe. Mapa Krakowa pojawi się w wersji 1.0.</p></div>

    <div class="card"><h3>Niemcy i dalej</h3>
      <p>Polska matura daje bezpośredni wstęp na niemieckie uczelnie. Większość studiów licencjackich jest po niemiecku (poziom C1), wiele magisterskich po angielsku. Obywatele UE nie płacą czesnego na uczelniach publicznych w Bawarii, tylko opłatę semestralną. Jedna z dróg: licencjat w Krakowie, magisterka w Monachium. Szczegóły pojawią się w kolejnej wersji.</p></div>

    ${doubt ? `<div class="card"><h3>To, co cię niepokoi</h3><p>${doubt.card}</p>
      ${A.doubtStrong ? '<p class="notice">Jeśli ten niepokój zostaje z tobą na dłużej, porozmawiaj z doradcą zawodowym w szkole albo w bezpłatnej poradni psychologiczno-pedagogicznej. To normalne, że przy takim wyborze pomaga człowiek, a nie aplikacja.</p>' : ''}</div>` : ''}

    <h2>Mogę to zrobić, bo…</h2>
    <label class="field" for="cando">Dokończ jednym zdaniem. Trafi na górę twojego pliku.</label>
    <input id="cando" type="text" data-field="canDo" value="${esc(A.canDo)}">

    <h2>Twój plik</h2>
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
  const g = e.target.closest && e.target.closest('[data-maprow]');
  if (g && g.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectRow(Number(g.dataset.maprow)); }
});
document.addEventListener('click', e => {
  const g = e.target.closest('[data-maprow]');
  if (g) { selectRow(Number(g.dataset.maprow)); return; }
  const t = e.target.closest('button');
  if (!t) return;
  const d = t.dataset;
  if (d.go) { location.hash = '#/' + d.go; return; }
  if (d.set) { setA(d.set, A[d.set] === d.val && d.set !== 'certainty' && d.set !== 'studyLength' ? null : d.val); return; }
  if (d.toggle) { const arr = A[d.toggle]; const i = arr.indexOf(d.val); i >= 0 ? arr.splice(i, 1) : arr.push(d.val); save(); render(); return; }
  if (d.lang) { A.jezyki[d.lang] = d.val; save(); render(); return; }
  if (d.sortans !== undefined) { const a = data.questions.activities[A.sortPos]; A.sort[a.id] = Number(d.sortans); A.sortPos++; save(); render(); return; }
  if (d.sortback !== undefined) { A.sortPos = Math.max(0, A.sortPos - 1); save(); render(); return; }
  if (d.sortreset !== undefined) { A.sortPos = 0; save(); render(); return; }
  if (d.value) { const i = A.values.indexOf(d.value); if (i >= 0) A.values.splice(i, 1); else if (A.values.length < 3) A.values.push(d.value); save(); render(); return; }
  if (d.strength) { const i = A.strengths.findIndex(s => s.id === d.strength); if (i >= 0) A.strengths.splice(i, 1); else if (A.strengths.length < 5) A.strengths.push({ id: d.strength, proof: '' }); save(); render(); return; }
  if (d.strong !== undefined) { setA('doubtStrong', d.strong === '1'); return; }
  if (d.persona) { const p = data.personas.find(x => x.id === d.persona); A = Object.assign(blank(), structuredClone(p.answers), { sortPos: data.questions.activities.length }); save(); location.hash = '#/wyniki'; render(); return; }
  if (d.export) doExport(d.export);
});

document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.field) { A[d.field] = d.field === 'startMin' ? Number(t.value) : t.value; save(); if (t.id === 'name' || t.id === 'cando' || t.id === 'sport' || t.id === 'start') return; }
  if (d.slider) { A.sliders[d.slider] = Number(t.value); save(); return; }
  if (d.proof) { const s = A.strengths.find(x => x.id === d.proof); s.proof = t.value; save();
    const ok = provenStrengths(A).length === 5; const next = $app.querySelector('.nav .btn:not(.ghost)'); if (next) next.disabled = !ok; return; }
  if (d.refl) { A.reflection[d.refl] = t.value; save(); }
});

async function doExport(kind) {
  const r = scoreAll(A, data), md = buildMarkdown(A, r, data, today());
  const msg = document.getElementById('msg');
  if (kind === 'download') {
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: fileName(A, today()) });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    msg.textContent = 'Plik zapisany.';
  } else if (kind === 'copy') {
    try { await navigator.clipboard.writeText(md); msg.textContent = 'Skopiowane.'; } catch { msg.textContent = 'Nie udało się skopiować. Użyj „Pobierz plik”.'; }
  } else {
    document.querySelectorAll('details').forEach(d => d.open = true);
    window.print();
  }
}

load().catch(err => { $app.innerHTML = `<p>Nie udało się wczytać danych (${esc(err.message)}). Odśwież stronę.</p>`; });
