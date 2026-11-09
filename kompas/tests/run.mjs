// Runs the test personas through the scoring: node kompas/tests/run.mjs
import { readFileSync } from 'node:fs';
import { scoreAll } from '../core/scoring.js';

const j = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const data = {
  dimensions: j('../core/dimensions.json'),
  strengths: j('../core/strengths.json'),
  config: j('../studia/data/config.json'),
  questions: j('../studia/data/questions.json'),
  opportunities: j('../studia/data/opportunities.json'),
  offers: j('../studia/data/db/pl/krakow/offers.json'),
  campuses: j('../studia/data/db/pl/krakow/campuses.json')
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
for (const c of data.opportunities) {
  for (const s of c.strengths) if (!strengthIds.has(s)) { console.log('bad strength', c.id, s); bad++; }
  for (const r of c.related) if (!cardIds.has(r)) { console.log('bad related', c.id, r); bad++; }
}

for (const p of j('../studia/data/personas.json')) {
  const r = scoreAll(p.answers, data);
  const s = r.slots;
  console.log(`\n${p.label}`);
  console.log('  top dims:', r.profile.top.slice(0, 3).join(', '));
  console.log('  ranking :', r.cards.map(c => `${c.card.id}:${c.fit.toFixed(0)}${c.reachable ? '' : '(blok)'}`).join('  '));
  console.log('  najlepsze:', s.best.map(c => c.card.id).join(', '));
  console.log('  most    :', s.most?.card.id, '| szybki start:', s.quick?.o.offer.name, '| niespodzianka:', s.surprise?.card.id || '-');
  const clusters = s.best.map(c => c.card.cluster);
  const okTop = p.expect.topClusters.includes(clusters[0]);
  const okNot = !(p.expect.notTop || []).some(id => s.best.some(c => c.card.id === id));
  console.log('  ' + (okTop && okNot ? 'PASS' : 'FAIL'));
  if (!(okTop && okNot)) bad++;
}
process.exit(bad ? 1 : 0);
