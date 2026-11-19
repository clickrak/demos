// Kompas Liceum: data integrity, points arithmetic and test personas. Run: node kompas/tests/liceum.mjs
import { readFileSync } from 'node:fs';
import { scoreLiceum, examPoints, certificatePoints, checkClass, scoredSubjects, shortlist, effectivePoints, profilesFor } from '../liceum/points.js';

const j = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const data = {
  dimensions: j('../core/dimensions.json'), strengths: j('../core/strengths.json'), config: j('../liceum/data/config.json'),
  questions: j('../liceum/data/questions.json'), opportunities: j('../liceum/data/opportunities.json'),
  schools: j('../liceum/data/db/pl/krakow/schools.json'), sources: j('../liceum/data/sources.json'), profiles: j('../liceum/data/profiles.json')
};
// Towns (v2.0): Kraków stays the main data set for the checks below; other ready towns are checked further down.
const TOWN_BOX = { krakow: [49.95, 50.14, 19.75, 20.15], tychy: [50.05, 50.17, 18.90, 19.07], katowice: [50.15, 50.30, 18.90, 19.13], sosnowiec: [50.24, 50.34, 19.08, 19.30], gliwice: [50.25, 50.37, 18.55, 18.78] }; // lat min, lat max, lon min, lon max
const towns = (data.config.towns || []).filter(t => t.status === 'ready');
const allSchools = towns.flatMap(t => j(`../liceum/data/db/pl/${t.id}/schools.json`).map(s => ({ ...s, town: s.town || t.id })));
// Every direction belongs to exactly one compass profile.
for (const o of data.opportunities) { const n = data.profiles.filter(p => p.areas.includes(o.id)).length; if (n !== 1) fail('direction in', n, 'profiles:', o.id); }
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

// Soft mode: "słabo / dobrze / świetnie" map to typical marks and exam results.
const soft = effectivePoints({ points: { mode: 'soft', soft: { exam: { polski: 'dobrze', matematyka: 'swietnie', obcy: 'slabo' }, grades: { polski: 'dobrze', matematyka: 'swietnie', angielski: 'slabo' } } } }, data.config);
if (soft.exam.matematyka !== 90 || soft.exam.obcy !== 45 || soft.grades.matematyka !== 5 || soft.grades.angielski !== 3 || soft.grades.fizyka !== 4 || !soft.approx) fail('soft mapping', JSON.stringify(soft));
if (!soft.assumed.includes('fizyka')) fail('skipped subjects should be listed as assumed');
const hard = effectivePoints({ points: { exam: { polski: 50 }, grades: { polski: 5 } } }, data.config);
if (hard.approx || hard.exam.polski !== 50) fail('exact marks must win over soft defaults');
if (!data.schools.some(s => s.id === 'lo26')) fail('XXVI LO must be in the list');

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
    if (k.status === 'sourced' && k.threshold != null && s.range && (k.threshold < s.range.min - 0.01 || k.threshold > s.range.max + 0.01) && s.range.year === k.thresholdYear) fail('class threshold outside school range', s.id, k.code);
    for (const x of scoredSubjects(k).list) if (!subj.has(x)) fail('scored subject unknown', s.id, k.code, x);
  }
}
for (const s of data.schools) {
  if (!s.geo) fail('school without map position', s.id);
  else if (!(s.geo.lat > 49.95 && s.geo.lat < 50.14 && s.geo.lon > 19.75 && s.geo.lon < 20.15)) fail('school position outside Kraków', s.id);
}
console.log(`schools: ${data.schools.length}, classes: ${classes}, to verify in 2027: ${check}, areas: ${data.opportunities.length}`);

const regionTowns = id => ((data.config.regions || []).find(r => r.id === id) || { towns: ['krakow'] }).towns;
const forKid = a => (a.region && a.region !== 'krakow' ? { ...data, schools: allSchools.filter(s => regionTowns(a.region).includes(s.town)) } : data);
// Areas never mix: no town may sit in two areas.
{ const t = (data.config.regions || []).flatMap(r => r.towns); if (new Set(t).size !== t.length) fail('a town is in two areas'); }
for (const p of j('../liceum/data/personas.json')) {
  const r = scoreLiceum(p.answers, forKid(p.answers)), s = r.slots;
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
// A soft-mode persona: no marks typed, only how it feels. Must still produce classes with a chance label and no crash.
const p0 = j('../liceum/data/personas.json')[1];
const softAns = { ...p0.answers, points: { mode: 'soft', soft: { exam: { polski: 'dobrze', matematyka: 'dobrze', obcy: 'swietnie' }, grades: { polski: 'dobrze', matematyka: 'dobrze', angielski: 'swietnie', biologia: 'swietnie', chemia: 'swietnie' } } } };
const rs = scoreLiceum(softAns, data), c0 = rs.slots.best[0].classes[0];
console.log('\nSoft-mode check:', rs.slots.best[0].card.id, c0.school.short, c0.cls.code, c0.check.chance, rs.points.approx);
if (!rs.points.approx || !['realna', 'zawalczenia', 'ambitna'].includes(c0.check.chance)) fail('soft mode should give a chance label');
// Compass: the expected North for each test kid.
const NORTH = { P7: ['scisly', 'inzynierski'], P1: ['scisly'], P2: ['spoleczny', 'przyrodniczy'], P3: ['scisly', 'inzynierski'], P4: ['scisly'], P5: ['jezykowy', 'spoleczny'], P6: ['ekonomiczny', 'inzynierski'] };
for (const p of j('../liceum/data/personas.json')) {
  const P = profilesFor(scoreLiceum(p.answers, forKid(p.answers)), forKid(p.answers));
  console.log(`Kompas ${p.id}:`, P.map(x => `${x.compass.pos} ${x.profile.id} ${Math.round(x.fit)}`).join(' · '));
  if (NORTH[p.id] && !NORTH[p.id].includes(P[0].profile.id)) fail('compass north for', p.id, 'is', P[0].profile.id);
  if (!P[0].classes.length) fail('north profile without classes for', p.id);
}
// Every school in every town: a town, an address, a map point inside that town, sources and links that resolve.
const ids = new Set();
for (const s of allSchools) {
  if (ids.has(s.id)) fail('school id used twice across towns', s.id); ids.add(s.id);
  if (!towns.some(t => t.id === s.town)) fail('school without a known town', s.id);
  if (!s.address) fail('school without an address', s.id);
  if (s.addressSourceId && !srcIds.has(s.addressSourceId)) fail('address source', s.id);
  const b = TOWN_BOX[s.town];
  if (!s.geo) fail('school without map position', s.id);
  else if (b && !(s.geo.lat > b[0] && s.geo.lat < b[1] && s.geo.lon > b[2] && s.geo.lon < b[3])) fail('school position outside its town', s.id);
  for (const k of s.classes) {
    if (!srcIds.has(k.sourceId)) fail('class source', s.id, k.code);
    for (const c of k.cards) if (!cardIds.has(c)) fail('class card link', s.id, k.code, c);
    if (k.threshold != null && !(k.threshold > 0 && k.threshold <= 200)) fail('threshold range', s.id, k.code);
    for (const x of scoredSubjects(k).list) if (!subj.has(x)) fail('scored subject unknown', s.id, k.code, x);
  }
}
// M1: every map point was checked against the street address (geoChecked, set by the geocoding Action).
for (const s of allSchools) if (!s.geoChecked) fail('map point not checked against the address (run the geocoding Action)', s.id);
// M2: travel times, where a town has them: a time for every school and district, in a sane range.
import { existsSync } from 'node:fs';
for (const t of towns) {
  const f = new URL(`../liceum/data/db/pl/${t.id}/travel.json`, import.meta.url); if (!existsSync(f)) continue;
  const tr = JSON.parse(readFileSync(f)), mine = allSchools.filter(s => s.town === t.id);
  if (!tr.origins || tr.origins.length < 1) fail('travel without origins', t.id);
  for (const s of mine) for (const o of tr.origins || []) { const m = (tr.schools[s.id] || {})[o.id]; if (!(m >= 1 && m <= 180)) fail('travel time missing or odd', t.id, s.id, o.id, m); }
  console.log(`Travel ${t.id}: ${tr.origins.length} districts × ${mine.length} schools, as of ${tr.asOf}`);
}
// The test kid from Tychy only gets Tychy classes.
const p7 = j('../liceum/data/personas.json').find(p => p.id === 'P7');
if (!p7) fail('test kid from Tychy (P7) missing');
else { const r7 = scoreLiceum(p7.answers, forKid(p7.answers)); const wrong = r7.cards.flatMap(c => c.classes).filter(c => !regionTowns('tychy').includes(c.school.town)); // Tychy + GZM, never Kraków
  console.log(`\nTychy + GZM check: ${allSchools.filter(s => regionTowns('tychy').includes(s.town)).length} schools, P7 classes outside the area: ${wrong.length}`);
  if (wrong.length) fail('P7 got classes outside Tychy and GZM'); }

// Bilingual track (v2.5): bilingual classes are tagged and sourced, only shown when the kid asks, and a weak English
// answer makes the chance "ambitna" (the language test), except in preparatory classes.
const biCls = allSchools.flatMap(s => s.classes.filter(c => c.bilingual).map(c => ({ s, c })));
for (const { s, c } of biCls) {
  const b = c.bilingual;
  if (!['dwujęzyczna', 'międzynarodowa', 'wstępna'].includes(b.kind)) fail('bilingual kind', s.id, c.code, b.kind);
  if (!(b.lang === null || typeof b.lang === 'string')) fail('bilingual lang', s.id, c.code);
  if (!new Set((data.sources.sources || data.sources).map(x => x.id)).has(b.sourceId)) fail('bilingual source', s.id, c.code, b.sourceId);
}
for (const t of ['krakow', 'tychy']) if (!biCls.some(x => x.s.town === t)) fail('no bilingual classes in', t);
{ const p1 = j('../liceum/data/personas.json')[0], kid = { ...p1.answers, region: 'krakow' };
  const n = a => scoreLiceum(a, forKid(a)).cards.flatMap(c => c.classes).filter(c => c.cls.bilingual).length;
  if (n({ ...kid, bi: null })) fail('bilingual classes shown without asking');
  if (!n({ ...kid, bi: 'tak' })) fail('bilingual classes missing after asking'); }
{ const bi = { scored: ['polski', 'matematyka', 'angielski', 'geografia'], threshold: 120, bilingual: { lang: 'angielski', kind: 'dwujęzyczna' } };
  const pts = g => ({ exam: { polski: 90, matematyka: 90, obcy: 90 }, grades: { polski: 6, matematyka: 6, angielski: g, geografia: 6 } });
  const weak = checkClass(pts(3), bi, {}, data.config), good = checkClass(pts(6), bi, {}, data.config);
  if (weak.chance !== 'ambitna' || weak.lang.test !== 'trudny') fail('weak English should make a bilingual class ambitna', weak.chance);
  if (good.chance !== 'realna' || good.lang.test !== 'w-zasiegu') fail('good English: bilingual chance as usual', good.chance);
  const prep = checkClass(pts(3), { ...bi, bilingual: { lang: 'hiszpański', kind: 'wstępna' } }, {}, data.config);
  if (prep.chance !== 'realna') fail('preparatory class does not depend on English', prep.chance); }
console.log(`Bilingual: ${biCls.length} classes (${biCls.filter(x => x.s.town === 'krakow').length} Kraków, ${biCls.filter(x => x.s.town !== 'krakow').length} Tychy + GZM)`);
// GZM ranked list (v2.6, G1): two lists, ordered, every school in a GZM gmina, both ranks kept, Tychy linked to Kompas.
{ const R = j('../liceum/data/db/pl/gzm/ranking.json');
  const GZM = ['Bytom', 'Chorzów', 'Dąbrowa Górnicza', 'Gliwice', 'Katowice', 'Mysłowice', 'Piekary Śląskie', 'Ruda Śląska', 'Siemianowice Śląskie', 'Sosnowiec', 'Świętochłowice', 'Tychy', 'Zabrze',
    'Będzin', 'Bieruń', 'Czeladź', 'Imielin', 'Knurów', 'Lędziny', 'Łaziska Górne', 'Mikołów', 'Pyskowice', 'Radzionków', 'Sławków', 'Tarnowskie Góry', 'Wojkowice',
    'Bobrowniki', 'Bojszowy', 'Chełm Śląski', 'Gierałtowice', 'Kobiór', 'Mierzęcice', 'Ożarowice', 'Pilchowice', 'Psary', 'Rudziniec', 'Siewierz', 'Sośnicowice', 'Świerklaniec', 'Wyry', 'Zbrosławice'];
  if (GZM.length !== 41) fail('GZM list should have 41 gminas');
  for (const [k, type] of [['licea', 'liceum'], ['technika', 'technikum']]) {
    const L = R[k] || []; if (L.length < 50) fail('GZM ranking too short', k, L.length);
    L.forEach((x, i) => {
      if (x.order !== i + 1) fail('GZM order', k, x.name);
      if (x.type !== type || !GZM.includes(x.gmina)) fail('GZM school type or gmina', k, x.name, x.gmina);
      if (!x.otouczelnie || !(x.otouczelnie.rank > 0)) fail('GZM school without otouczelnie rank', x.name);
      if (/doros|zaoczn/i.test(x.name)) fail('adult school in GZM list', x.name);
    });
    const withP = L.filter(x => x.perspektywy).length;
    if (L.slice(0, withP).some(x => !x.perspektywy)) fail('Perspektywy schools must come first', k);
  }
  const tyIds = allSchools.filter(s => regionTowns('tychy').includes(s.town)).map(s => s.id), linked = [...R.licea, ...R.technika].map(x => x.kompasId).filter(Boolean);
  for (const id of linked) if (!tyIds.includes(id)) fail('GZM kompasId unknown', id);
  console.log(`GZM ranking: ${R.licea.length} licea, ${R.technika.length} technika; linked to Kompas: ${linked.length}`); }
process.exit(bad ? 1 : 0);
