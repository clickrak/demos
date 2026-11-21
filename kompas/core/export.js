// Builds the markdown export. Everything happens in the browser; nothing is uploaded.
import { provenStrengths, proofText, pathSteps, planFocus, planItems, declarationHelp, subjectFit, compareIds } from './scoring.js';

const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
// "GUS, październik 2024" from a source's asOf ("2024-10"), so the words always match the data.
export function payLabel(src) {
  const m = /^(\d{4})-(\d{2})$/.exec(src?.asOf || '');
  return m ? `GUS, ${MONTHS[+m[2] - 1]} ${m[1]}` : 'GUS';
}

const bar = v => '█'.repeat(Math.round(v / 10)) + '░'.repeat(10 - Math.round(v / 10));

export function fileName(answers, today) {
  const n = (answers.name || 'ja').trim().toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, '-') || 'ja';
  return `kompas-${n}-${today}.md`;
}

export function buildMarkdown(answers, result, data, today) {
  const { profile, slots } = result;
  const L = [];
  const st = id => data.strengths.find(s => s.id === id);
  const camp = id => data.campuses.find(c => c.id === id);
  L.push(`# Kompas – ${answers.name || 'ja'}, ${today}`);
  L.push(`Ścieżka: wybór studiów · Język: PL · Wersja: v${data.config.appVersion}`, '');

  const complete = provenStrengths(answers).length > 0 && (answers.values || []).length > 0;
  if (!complete) {
    L.push('> Zapis postępu: wyniki pojawią się po rozdziale Ja. Wczytaj ten plik w Kompasie, żeby kontynuować.', '');
    L.push('<!-- dane do ponownego wczytania -->');
    L.push('```json', JSON.stringify({ app: 'kompas-studia', version: data.config.appVersion, dataVersion: data.config.dataVersion, date: today, snapshot: null, answers }, null, 1), '```');
    return L.join('\n');
  }
  L.push('## Moje mocne strony');
  provenStrengths(answers).forEach((s, i) => L.push(`${i + 1}. ${cap(st(s.id).name)} – ${proofText(s.proof)}`));
  L.push('', '## Mogę to zrobić, bo…', answers.canDo ? answers.canDo : '[dopisz jedno zdanie]', '');

  L.push('## Mój profil');
  for (const d of profile.top) L.push(`- ${data.dimensions.interests.find(x => x.id === d).name}: ${bar(profile.score[d])}`);
  const vals = (answers.values || []).map((v, i) => `${i + 1}. ${data.dimensions.values.find(x => x.id === v).name}`);
  if (vals.length) L.push(`Najważniejsze wartości: ${vals.join(', ')}`);
  L.push('');

  L.push('## Gdzie się przydam');
  const card = (title, c) => {
    if (!c) return;
    L.push(`### ${title}: ${c.card.name} – ${c.band}`);
    L.push(`Komu pomagam: ${c.card.whoYouHelp}`);
    L.push(`Co mi to daje: ${c.card.whatYouGet}`);
    if (c.card.pay) L.push(`Zarobki orientacyjnie: ${'$'.repeat(c.card.pay.band)} z $$$ (${payLabel((data.sources || []).find(x => x.id === c.card.pay.sourceId))}, grupa „${c.card.pay.group}”)`);
    if (c.strengthsUsed.length) L.push(`Moje mocne strony, które tu pracują: ${c.strengthsUsed.map(p => p.label).join(', ')}`);
    if (c.reasons.length) L.push(`Dlaczego: ${c.reasons.join('; ')}`);
    L.push(`Odporność na scenariusze: ${data.scenarios.scenarios.map(x => `${x.name}: ${c.card.robustness[x.id]}`).join(' · ')}`);
    const reach = c.offers.filter(o => o.check.reachable).map(o => `${o.offer.name} (${o.offer.institution})`);
    if (reach.length) L.push(`W Krakowie: ${reach.join('; ')}`);
    L.push('');
  };
  slots.best.forEach((c, i) => card(`${i + 1}`, c));
  card('Most', slots.most);
  if (slots.quick) {
    const o = slots.quick.o.offer;
    L.push(`### Szybki start: ${o.name}, ${o.institution} (${o.durationYears} lat do pierwszej pracy)`, '');
  }
  card('Niespodzianka', slots.surprise);

  // The plan: the option he checks first, with small dated steps; ticks come from the app.
  const focus = planFocus(slots, answers), checks = answers.checks || {};
  if (focus) {
    const fo = focus.o && focus.o.offer;
    L.push('## Mój plan');
    L.push(`Najpierw sprawdzam: ${focus.quick ? `Szybki start – ${fo.name}` : focus.c.card.name}${fo && !focus.quick ? ` (${fo.name}, ${fo.institution})` : ''}`);
    for (const it of planItems(focus, data)) L.push(`- [${checks[`plan:${focus.key}:${it.id}`] ? 'x' : ' '}] ${it.when}: ${it.text}`);
    L.push('');
    if (fo) { L.push('## Moja droga w czasie'); pathSteps(fo, camp(fo.campus)?.name).forEach(s => L.push(`- ${s}`)); L.push(''); }
  }

  // Starred offers (v2.2) and the declaration helper: which one extra extended subject opens most of them.
  const stars = (answers.stars || []).map(id => data.offers.find(o => o.id === id)).filter(Boolean);
  const ext = answers.rozszerzenia || [];
  const FIT = { 3: 'pasuje w pełni', 2: 'pasuje częściowo', 1: 'żaden mój przedmiot nie jest na liście', 0: 'wymaga zmiany w maturze' };
  if (stars.length) {
    L.push('## Moje gwiazdki');
    for (const o of stars) { const f = subjectFit(o, ext); L.push(`- ${o.name}, ${o.institution} · ${o.durationYears} ${o.durationYears < 5 ? 'lata' : 'lat'} · ${f === null ? 'nie zależy od rozszerzeń' : FIT[f]} · wymagania: ${o.requires?.note || '-'}`); }
    L.push('');
  }
  // Side by side (v2.4): the 2–3 starred offers he compares, one column each.
  const cmp = compareIds(answers, data).map(id => data.offers.find(o => o.id === id));
  if (cmp.length >= 2) {
    const cell = t => String(t ?? '-').replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ');
    const campOf = o => camp(o.campus);
    const rows = [
      ['Uczelnia', o => o.institution],
      ['Miejsce', o => campOf(o) ? `${campOf(o).name}, ${campOf(o).address}` : '-'],
      ['Długość', o => `${o.durationYears} ${o.durationYears < 5 ? 'lata' : 'lat'}, ${o.level}`],
      ['Moje przedmioty', o => { const f = subjectFit(o, ext); return f === null ? 'nie zależy od rozszerzeń' : FIT[f]; }],
      ['Wymagania', o => o.requires?.note],
      ['Próg 2026', o => o.threshold ? `${o.threshold.points} z ${o.threshold.max} pkt` : 'brak danych'],
      ['Uczelnia publiczna?', o => o.private ? 'prywatna, płatna' : 'publiczna'],
      ['Co dalej', o => o.next]];
    L.push('## Porównanie');
    L.push(`| | ${cmp.map(o => cell(o.name)).join(' | ')} |`, `|---|${cmp.map(() => '---').join('|')}|`);
    for (const [label, f] of rows) L.push(`| ${label} | ${cmp.map(o => cell(f(o))).join(' | ')} |`);
    L.push('');
  }
  if (ext.length) {
    const h = declarationHelp(result, answers, data);
    const name = o => `${o.name} (${o.institution})`;
    L.push('## Deklaracja maturalna: podpowiedź');
    L.push(`Liczone dla: ${h.basis === 'stars' ? `moich gwiazdek (${h.total})` : `kierunków z moich opcji (${h.total})`}. Moje rozszerzenia: ${ext.join(', ')}.`);
    L.push(`Pasują w pełni: ${h.full.length} · częściowo: ${h.part.length} · słabo: ${h.weak.length} · wymagają zmiany: ${h.closed.length} · nie zależą od rozszerzeń: ${h.free.length}`);
    for (const g of h.gains) L.push(`- + ${g.subject}: ${g.opens.length ? `otwiera ${g.opens.map(name).join('; ')}` : ''}${g.opens.length && g.better.length ? ' · ' : ''}${g.better.length ? `wzmacnia ${g.better.length}` : ''}`);
    if (!h.gains.length) L.push('- Żadne jedno dodatkowe rozszerzenie nic tu nie zmienia.');
    if (h.keep.length) L.push(`Nie skreślać: ${h.keep.map(k => `${k.subject} (liczy się w ${k.needed.length})`).join(', ')}`);
    L.push(`To podpowiedź, nie decyzja. Deklarację można zmienić do ${data.config.declarationDeadline}.`, '');
  }

  L.push('## Moje refleksje');
  for (const q of data.questions.reflection) {
    const a = (answers.reflection || {})[q.id];
    if (a) L.push(`**${q.text}** ${a}`);
  }
  const scen = (data.scenarios.scenarios || []).find(x => x.id === answers.scenario);
  L.push(`Mój główny scenariusz: ${scen ? scen.name : answers.scenario === '?' ? 'nie wiem, każdy jest możliwy' : '-'}`);
  L.push(`U siebie czuję się: ${(answers.homePlaces || []).join(', ') || '-'} · Chcę być potrzebny: ${answers.neededWhere || '-'}`, '');

  L.push('## Pytania do rozmowy z rodzicami');
  L.push('- Która mocna strona cię zaskoczyła?', '- Która opcja daje ci najwięcej energii?', '- Jaki jest najmniejszy krok, który zrobisz w tym miesiącu?', '');
  L.push('## Dla rodzica');
  L.push('Pytaj, nie mów. Reaguj na dowody, nie na opcję. Bez porównań między braćmi. Jeden mały krok w tym miesiącu.', '');

  // Raw answers (to reload) plus a snapshot of what he saw (to compare in 6 months, even if the model changes).
  const snapshot = complete ? { best: slots.best.map(c => c.card.id), most: slots.most?.card.id || null, surprise: slots.surprise?.card.id || null,
    quick: slots.quick?.o.offer.id || null, strengths: provenStrengths(answers).map(s => s.id) } : null;
  L.push('<!-- dane do ponownego wczytania -->');
  L.push('```json', JSON.stringify({ app: 'kompas-studia', version: data.config.appVersion, dataVersion: data.config.dataVersion, date: today, snapshot, answers }, null, 1), '```');
  return L.join('\n');
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Reads the answers back from an exported file. Looks only at the part after the reload marker and takes
// everything from the first "{" to the last "}", so stray backticks inside a typed answer cannot break it.
export function parseSaved(text) {
  const mark = '<!-- dane do ponownego wczytania -->';
  for (const at of [text.lastIndexOf(mark), text.lastIndexOf('```json')]) {
    if (at < 0) continue;
    const tail = text.slice(at), a = tail.indexOf('{'), b = tail.lastIndexOf('}');
    if (a < 0 || b <= a) continue;
    try { return JSON.parse(tail.slice(a, b + 1)); } catch { /* try the next anchor */ }
  }
  return null;
}
