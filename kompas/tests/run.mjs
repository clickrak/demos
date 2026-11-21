// Runs the test personas through the scoring: node kompas/tests/run.mjs
import { readFileSync } from 'node:fs';
import { scoreAll, subjectFit, declarationHelp } from '../core/scoring.js';
import { buildMarkdown, parseSaved } from '../core/export.js';

const j = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const data = {
  dimensions: j('../core/dimensions.json'),
  strengths: j('../core/strengths.json'),
  config: j('../studia/data/config.json'),
  questions: j('../studia/data/questions.json'),
  opportunities: j('../studia/data/opportunities.json'),
  offers: j('../studia/data/db/pl/krakow/offers.json'),
  campuses: j('../studia/data/db/pl/krakow/campuses.json'),
  sources: j('../studia/data/sources.json')
};

// Data integrity: every link points somewhere.
let bad = 0;
const cardIds = new Set(data.opportunities.map(c => c.id));
const campusIds = new Set(data.campuses.map(c => c.id));
const strengthIds = new Set(data.strengths.map(s => s.id));
for (const o of data.offers) {
  for (const c of o.cards) if (!cardIds.has(c)) { console.log('bad card link', o.id, c); bad++; }
  if (!campusIds.has(o.campus)) { console.log('bad campus', o.id); bad++; }
}
const sourceIds = new Set(data.sources.map(s => s.id));
const seen = new Set();
for (const o of data.offers) {
  if (seen.has(o.id)) { console.log('duplicate offer id', o.id); bad++; } seen.add(o.id);
  if (o.sourceId && !sourceIds.has(o.sourceId)) { console.log('unknown source', o.id, o.sourceId); bad++; }
  if (o.status === 'sourced' && !o.sourceId) { console.log('sourced without source', o.id); bad++; }
  // Complete records: every offer names what it needs, how long it takes and what comes after it.
  for (const k of ['name', 'institution', 'kind', 'level', 'durationYears', 'requires', 'next']) if (o[k] === undefined || o[k] === '') { console.log('offer field missing', o.id, k); bad++; }
  if (!o.requires?.note) { console.log('offer without requirement note', o.id); bad++; }
  if (o.private && !o.cost) { console.log('private offer without cost note', o.id); bad++; }
}
const open = data.offers.filter(o => o.status !== 'sourced');
console.log(`offers: ${data.offers.length}, sourced: ${data.offers.length - open.length}` + (open.length ? `, to verify: ${open.map(o => o.id).join(', ')}` : ''));
for (const c of data.campuses) if (!data.offers.some(o => o.campus === c.id)) console.log('warning: campus without offers', c.id);
for (const c of data.opportunities) {
  if (!data.offers.some(o => o.cards.includes(c.id))) { console.log('card without Kraków offer', c.id); bad++; }
  if (c.demand && !sourceIds.has(c.demand.sourceId)) { console.log('unknown demand source', c.id); bad++; }
  for (const s of c.strengths) if (!strengthIds.has(s)) { console.log('bad strength', c.id, s); bad++; }
  for (const r of c.related) if (!cardIds.has(r)) { console.log('bad related', c.id, r); bad++; }
}

// Transport: every campus an offer uses should have stops and a time from Kraków Główny (warning only).
try {
  const tr = j('../studia/data/db/pl/krakow/transport.json');
  for (const id of new Set(data.offers.map(o => o.campus))) if (!tr.campuses[id]?.fromHub) console.log('warning: no transport data for campus', id);
} catch { console.log('warning: transport.json missing'); }

for (const p of j('../studia/data/personas.json')) {
  const r = scoreAll(p.answers, data);
  const s = r.slots;
  console.log(`\n${p.label}`);
  console.log('  top dims:', r.profile.top.slice(0, 3).join(', '));
  console.log('  ranking :', r.cards.map(c => `${c.card.id}:${c.fit.toFixed(0)}${c.reachable ? '' : '(blok)'}`).join('  '));
  console.log('  najlepsze:', s.best.map(c => c.card.id).join(', '));
  console.log('  most    :', s.most?.card.id, '| szybki start:', s.quick?.o.offer.name, '| niespodzianka:', s.surprise?.card.id || '-');
  const clusters = s.best.map(c => c.card.cluster);
  const okTop = (p.expect.topClusters ? p.expect.topClusters.includes(clusters[0]) : true)
    && (!p.expect.minClusters || new Set(clusters).size >= p.expect.minClusters) && (!s.quick || s.quick.o.offer.firstJob);
  const okNot = !(p.expect.notTop || []).some(id => s.best.some(c => c.card.id === id));
  console.log('  ' + (okTop && okNot ? 'PASS' : 'FAIL'));
  if (!(okTop && okNot)) bad++;
}
// Declaration helper (v2.2): subject fit scale, the best extra subject, stars, private offers, export round trip.
const ok = (cond, msg) => { if (!cond) { console.log('FAIL declaration:', msg); bad++; } };
const off = id => data.offers.find(o => o.id === id);
ok(subjectFit(off('ujcm-lekarski'), ['biologia']) === 0, 'medicine without chemistry is closed');
ok(subjectFit(off('ujcm-lekarski'), ['biologia', 'chemia', 'fizyka']) === 3, 'medicine with biology, chemistry, physics fits fully');
ok(subjectFit(off('ujcm-lekarski'), ['biologia', 'chemia']) === 1, 'medicine without maths or physics: none from the list');
ok(subjectFit(off('uj-psychologia'), ['polski']) === 2, 'psychology counts two from the list: one is part');
ok(subjectFit(off('uj-psychologia'), ['polski', 'biologia']) === 3, 'psychology with two from the list fits fully');
ok(subjectFit(off('ksm-higienistka'), []) === null, 'no-matura school does not depend on subjects');
ok(subjectFit(off('asp-wzornictwo'), ['matematyka']) === null, 'exam-only school does not depend on subjects');
const pB = j('../studia/data/personas.json').find(p => p.id === 'B');
const hB = declarationHelp(scoreAll(pB.answers, data), pB.answers, data);
ok(hB.basis === 'options' && hB.gains[0]?.subject === 'chemia' && hB.gains[0].opens.some(o => o.id === 'ujcm-farmacja'), 'persona B: chemistry opens pharmacy');
ok(hB.keep[0]?.subject === 'matematyka', 'persona B: keep maths first');
ok(hB.gains.every(g => !pB.answers.rozszerzenia.includes(g.subject)), 'never suggests a subject he already takes');
const aS = { ...structuredClone(pB.answers), stars: ['ujcm-lekarski', 'agh-informatyka', 'gone-offer'] };
const hS = declarationHelp(scoreAll(aS, data), aS, data);
ok(hS.basis === 'stars' && hS.total === 2, 'stars are the basis and unknown ids are skipped');
ok(hS.needMore.some(o => o.id === 'ujcm-lekarski'), 'medicine needs two new subjects for maths + physics');
const aP = { ...structuredClone(pB.answers), privateOk: 'nie', stars: ['uafm-lekarski', 'agh-informatyka'] };
ok(declarationHelp(scoreAll(aP, data), aP, data).total === 1, 'private offers he ruled out are left out');
const aE = { ...structuredClone(pB.answers), rozszerzenia: [] };
ok(Array.isArray(declarationHelp(scoreAll(aE, data), aE, data).gains), 'no extended subjects does not crash');
const md = buildMarkdown(aS, scoreAll(aS, data), { ...data, scenarios: j('../studia/data/scenarios.json') }, '2026-11-21');
ok(md.includes('## Moje gwiazdki') && md.includes('## Deklaracja maturalna: podpowiedź'), 'export lists stars and the declaration hint');
ok(JSON.stringify(parseSaved(md).answers.stars) === JSON.stringify(aS.stars), 'stars survive save and load');
console.log(`\ndeclaration helper: persona B best extra subject ${hB.gains[0]?.subject}, stars basis ${hS.total} offers`);

process.exit(bad ? 1 : 0);
