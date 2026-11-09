// Builds the markdown export. Everything happens in the browser; nothing is uploaded.
import { provenStrengths, pathSteps } from './scoring.js';

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
  L.push('Ścieżka: wybór studiów · Język: PL · Wersja: v0.2', '');

  const complete = provenStrengths(answers).length > 0 && (answers.values || []).length > 0;
  if (!complete) {
    L.push('> Zapis postępu: wyniki pojawią się po rozdziale Ja. Wczytaj ten plik w Kompasie, żeby kontynuować.', '');
    L.push('<!-- dane do ponownego wczytania -->');
    L.push('```json', JSON.stringify({ app: 'kompas-studia', version: '0.2', dataVersion: data.config.dataVersion, date: today, snapshot: null, answers }, null, 1), '```');
    return L.join('\n');
  }
  L.push('## Moje mocne strony');
  provenStrengths(answers).forEach((s, i) => L.push(`${i + 1}. ${cap(st(s.id).name)} – dowód: „${s.proof.trim()}”`));
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

  L.push('## Moja droga');
  const first = slots.best[0]?.offers.find(o => o.check.reachable)?.offer;
  if (first) pathSteps(first, camp(first.campus)?.name).forEach(s => L.push(`- [ ] ${s}`));
  L.push('');

  L.push('## Mój mini-eksperyment');
  if (slots.best[0]) L.push(`- [ ] W ciągu 30 dni: ${slots.best[0].card.experiment}`);
  L.push('');

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
  L.push('```json', JSON.stringify({ app: 'kompas-studia', version: '0.2', dataVersion: data.config.dataVersion, date: today, snapshot, answers }, null, 1), '```');
  return L.join('\n');
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
