// Runs the test personas through the scoring: node kompas/tests/run.mjs
import { readFileSync } from 'node:fs';
import { scoreAll, subjectFit, declarationHelp, compareIds } from '../core/scoring.js';
import { buildMarkdown, parseSaved } from '../core/export.js';
import { PICTO_IDS } from '../studia/pictos.js';

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
// Compare starred offers (v2.4): only starred ids, 2–3 of them, his pick kept, export table one column per offer.
const sc = { ...data, scenarios: j('../studia/data/scenarios.json') };
const aC = { ...structuredClone(pB.answers), stars: ['agh-informatyka', 'agh-cyber', 'pk-informatyka', 'uj-informatyka'], compare: ['pk-informatyka', 'uj-informatyka', 'gone'] };
ok(JSON.stringify(compareIds(aC, data)) === JSON.stringify(['pk-informatyka', 'uj-informatyka']), 'compare keeps his pick of starred offers');
ok(compareIds({ ...aC, compare: [] }, data).length === 3, 'compare defaults to the first 3 stars');
ok(compareIds({ ...aC, stars: ['agh-cyber'], compare: [] }, data).length === 0, 'one star: nothing to compare');
const mdC = buildMarkdown(aC, scoreAll(aC, data), sc, '2026-11-21');
const head = mdC.split('\n').find(l => l.startsWith('| | '));
ok(mdC.includes('## Porównanie') && head && head.split('|').length - 3 === 2, 'export compare table has one column per compared offer');
ok(JSON.stringify(parseSaved(mdC).answers.compare) === JSON.stringify(aC.compare), 'compare pick survives save and load');
// Coverage waves (v2.8+): each new card is in the top 3 of its own test kid, and no card is in the top 3 of more than half of the kids.
const OWN = { R: 'zywienie', S: 'weterynaria', T: 'geografia', N: 'spoleczenstwo', O: 'nauka', P: 'sztuka-scena', Q: 'historia', J: 'prawo', K: 'architektura', L: 'mechanika', M: 'edukacja', G: 'morze', H: 'lotnictwo', I: 'historia-sztuki', F: 'media-cyfrowe' };
const personas = j('../studia/data/personas.json'), topCount = {};
for (const p of personas) {
  const best = scoreAll(p.answers, data).slots.best.map(c => c.card.id);
  for (const id of best) topCount[id] = (topCount[id] || 0) + 1;
  if (OWN[p.id]) ok(best.includes(OWN[p.id]), `persona ${p.id} has ${OWN[p.id]} in the top 3`);
}
for (const [id, n] of Object.entries(topCount)) ok(n <= personas.length / 2, `card ${id} is top 3 for ${n} of ${personas.length} kids (max half)`);
for (const id of Object.values(OWN)) ok(data.opportunities.some(c => c.id === id), `card ${id} exists`);
console.log(`reachability: ${Object.keys(topCount).length} of ${data.opportunities.length} cards reach a top 3; most often: ${Object.entries(topCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k + ' ' + v).join(', ')}`);

// v2.5: every activity and situation card has its pictogram.
for (const a of data.questions.activities) ok(PICTO_IDS.act.includes(a.id), `activity ${a.id} has a pictogram`);
for (const q of data.questions.situations) ok(PICTO_IDS.sit.includes(q.id), `situation ${q.id} has a pictogram`);
console.log(`\ndeclaration helper: persona B best extra subject ${hB.gains[0]?.subject}, stars basis ${hS.total} offers`);

process.exit(bad ? 1 : 0);
