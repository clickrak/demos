// Kompas Liceum: data integrity, points arithmetic and test personas. Run: node kompas/tests/liceum.mjs
import { readFileSync } from 'node:fs';
import { scoreLiceum, examPoints, certificatePoints, checkClass, scoredSubjects, shortlist } from '../liceum/points.js';

const j = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const data = {
  dimensions: j('../core/dimensions.json'), strengths: j('../core/strengths.json'), config: j('../liceum/data/config.json'),
  questions: j('../liceum/data/questions.json'), opportunities: j('../liceum/data/opportunities.json'),
  schools: j('../liceum/data/db/pl/krakow/schools.json'), sources: j('../liceum/data/sources.json')
};
let bad = 0;
const fail = (...m) => { console.log('FAIL', ...m); bad++; };

// Points arithmetic against the published rules.
const ex = examPoints({ polski: 100, matematyka: 100, obcy: 100 });
if (Math.round(ex.total) !== 100) fail('exam max should be 100, got', ex.total);
const cls0 = { extended: ['matematyka', 'fizyka'], scored: ['polski', 'matematyka', 'angielski', 'fizyka'] };
const top = certificatePoints({ grades: { polski: 6, matematyka: 6, angielski: 6, fizyka: 6 }, stripe: true, volunteering: true, achievements: 18 }, cls0);
if (top.total !== 100) fail('certificate max should be 100, got', top.total);
if (certificatePoints({ grades: { polski: 4, matematyka: 3, angielski: 5, fizyka: 2 } }, cls0).total !== 14 + 8 + 17 + 2) fail('grade points 4/3/5/2');
if (certificatePoints({ achievements: 40 }, { scored: [] }).total !== 18) fail('achievements are capped at 18');

// Links and completeness.
const cardIds = new Set(data.opportunities.map(c => c.id)), srcIds = new Set(data.sources.map(s => s.id)), strIds = new Set(data.strengths.map(s => s.id));
const valueIds = new Set(data.dimensions.values.map(v => v.id)), subj = new Set(data.questions.grades);
for (const c of data.opportunities) {
  for (const s of c.strengths) if (!strIds.has(s)) fail('card strength', c.id, s);
  for (const v of c.values) if (!valueIds.has(v)) fail('card value', c.id, v);
  for (const r of c.related) if (!cardIds.has(r)) fail('card related', c.id, r);
  if (!data.schools.some(s => s.classes.some(k => k.cards.includes(c.id)))) fail('area without a Kraków class', c.id);
  for (const k of ['whoYouHelp', 'whatYouGet', 'experiment', 'afterSchool', 'dayInLife']) if (!c[k] || !c[k].length) fail('card field missing', c.id, k);
}
let classes = 0, check = 0;
const seen = new Set();
for (const s of data.schools) {
  if (seen.has(s.id)) fail('duplicate school', s.id); seen.add(s.id);
  if (!s.range || !srcIds.has(s.range.sourceId)) fail('school range source', s.id);
  if (s.range && !(s.range.min > 0 && s.range.max <= 200 && s.range.min <= s.range.max)) fail('school range values', s.id);
  for (const k of s.classes) {
    classes++; if (k.status !== 'sourced') check++;
    if (!srcIds.has(k.sourceId)) fail('class source', s.id, k.code);
    for (const c of k.cards) if (!cardIds.has(c)) fail('class card link', s.id, k.code, c);
    if (k.threshold != null && !(k.threshold > 0 && k.threshold <= 200)) fail('threshold range', s.id, k.code);
    if (k.threshold != null && s.range && (k.threshold < s.range.min - 0.01 || k.threshold > s.range.max + 0.01) && s.range.year === k.thresholdYear) fail('class threshold outside school range', s.id, k.code);
    for (const x of scoredSubjects(k).list) if (!subj.has(x)) fail('scored subject unknown', s.id, k.code, x);
  }
}
console.log(`schools: ${data.schools.length}, classes: ${classes}, to verify in 2027: ${check}, areas: ${data.opportunities.length}`);

for (const p of j('../liceum/data/personas.json')) {
  const r = scoreLiceum(p.answers, data), s = r.slots;
  console.log(`\n${p.label}`);
  console.log('  ranking :', r.cards.map(c => `${c.card.id}:${c.fit.toFixed(0)}`).join('  '));
  console.log('  najlepsze:', s.best.map(c => c.card.id).join(', '), '| most:', s.most?.card.id, '| niespodzianka:', s.surprise?.card.id || '-');
  const first = s.best[0];
  const okTop = (p.expect.topClusters || []).includes(first.card.cluster);
  const okNot = !(p.expect.notTop || []).some(id => s.best[0].card.id === id);
  const mine = first.classes.slice(0, 6).map(c => `${c.school.short} ${c.cls.code} ${c.cls.label}: ${c.check.points.toFixed(1)} pkt (${c.check.level}${c.check.margin != null ? ' ' + c.check.margin.toFixed(1) : ''})`);
  console.log('  klasy   :', mine.join(' | '));
  const labels = first.classes.slice(0, 6).map(c => c.cls.label);
  const okClass = !p.expect.classContains || p.expect.classContains.some(x => labels.includes(x));
  const sl = shortlist(r, p.answers);
  console.log('  lista   :', sl.map(x => `${x.role}: ${x.c.school.short} ${x.c.cls.code}`).join(' | ') || '-');
  const ok = okTop && okNot && okClass;
  console.log('  ' + (ok ? 'PASS' : 'FAIL'), ok ? '' : `(top ${okTop}, not ${okNot}, class ${okClass})`);
  if (!ok) bad++;
}
process.exit(bad ? 1 : 0);
