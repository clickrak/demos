// Cheap safety net: node kompas/tests/syntax.mjs
// 1) every app script parses (the persona tests never load app.js, so a typo there used to slip through),
// 2) every data file is valid JSON, 3) ids that point from one data file to another exist.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const walk = d => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'vendor' ? [] : walk(p)) : [p]; });
const files = ['core', 'studia', 'liceum'].flatMap(d => walk(join(root, d)));
let bad = 0;
const fail = m => { console.log('FAIL', m); bad++; };

for (const f of files.filter(f => f.endsWith('.js'))) {
  const r = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: readFileSync(f) });
  if (r.status !== 0) fail(`${f.slice(root.length)} does not parse: ${String(r.stderr).split('\n').slice(0, 4).join(' ')}`);
}
const json = {};
for (const f of files.filter(f => f.endsWith('.json'))) {
  try { json[f.slice(root.length)] = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { fail(`${f.slice(root.length)} is not valid JSON: ${e.message}`); }
}

const ids = list => new Set((list || []).map(x => x.id));
const refs = (what, wanted, known) => { for (const id of wanted) if (id && !known.has(id)) fail(`${what}: unknown id "${id}"`); };
{ // Studia
  const cards = json['studia/data/opportunities.json'] || [], sc = json['studia/data/scenarios.json'] || {}, src = ids(json['studia/data/sources.json']);
  const str = ids(json['core/strengths.json']);
  refs('studia sector card', (sc.sectors || []).flatMap(s => s.cards), ids(cards));
  refs('studia force sector', (sc.forces || []).flatMap(f => f.sectors), ids(sc.sectors));
  refs('studia card force', cards.map(c => c.force), ids(sc.forces));
  refs('studia force source', (sc.forces || []).map(f => f.sourceId), src);
  refs('studia card strength', cards.flatMap(c => c.strengths || []), str);
  for (const c of cards) if (!c.force) fail(`studia card "${c.id}" has no force`);
  const offers = json['studia/data/db/pl/krakow/offers.json'] || [];
  refs('studia offer source', offers.map(o => o.sourceId), src);
  for (const o of offers) if (o.url !== undefined && !/^https?:\/\//.test(o.url)) fail(`studia offer "${o.id}": url must be http(s)`); // v2.7: official page per offer
  for (const o of offers) if (o.threshold) { // ST2: last year's threshold, shown as information only
    const t = o.threshold;
    if (!Number.isInteger(t.year) || t.year < 2020) fail(`studia offer "${o.id}": threshold needs a year`);
    if (typeof t.points !== 'number' || typeof t.max !== 'number' || t.points < 0 || t.points > t.max) fail(`studia offer "${o.id}": threshold points must be between 0 and max`);
    if (!src.has(t.sourceId)) fail(`studia offer "${o.id}": threshold has unknown sourceId "${t.sourceId}"`);
  }
  for (const q of json['studia/data/questions.json']?.reflection || []) { // SU2: tap ideas are stored joined with ", "
    if (!Array.isArray(q.ideas) || q.ideas.length < 5 || q.ideas.length > 6) fail(`studia reflection "${q.id}": needs 5-6 ideas`);
    for (const v of q.ideas || []) if (typeof v !== 'string' || !v.trim() || v.includes(',') || v.length > 40) fail(`studia reflection "${q.id}": idea "${v}" must be short text without a comma`);
  }
}
{ // Liceum
  const cards = json['liceum/data/opportunities.json'] || [], src = ids(json['liceum/data/sources.json']);
  const schools = Object.entries(json).filter(([f]) => /^liceum\/data\/db\/pl\/[^/]+\/schools\.json$/.test(f)).flatMap(([, d]) => d || []);
  for (const s of schools) if (s.geoPending != null && (s.geoPending !== true || !/^\d{4}-\d{2}-\d{2}$/.test(s.geoPendingSince || ''))) fail(`liceum school "${s.id}": geoPending must be true and come with geoPendingSince YYYY-MM-DD`);
  for (const s of schools) if (s.www != null && !/^https?:\/\/\S+$/.test(s.www)) fail(`liceum school "${s.id}": www must start with https:// or http://`);
  // CW1 (v2.10): coverage radar field codes on every Liceum direction (`field`) and class (`fields`); see tools/coverage_radar.py.
  const FIELDS = new Set(['MED', 'PSY', 'EDU', 'INF', 'ENG', 'BUD', 'SCI', 'BIO', 'ECO', 'LAW', 'LNG', 'HUM', 'MEDIA', 'ART', 'SPO', 'SEC', 'TUR']);
  for (const c of cards) if (!Array.isArray(c.field) || !c.field.length || c.field.some(f => !FIELDS.has(f))) fail(`liceum direction "${c.id}": field must be a list of radar codes`);
  for (const s of schools) for (const c of s.classes) if (!Array.isArray(c.fields) || !c.fields.length || c.fields.some(f => !FIELDS.has(f))) fail(`liceum class "${s.id} ${c.code}": fields missing or unknown (run tools/coverage_radar.py --fill)`);
  refs('liceum profile area', (json['liceum/data/profiles.json'] || []).flatMap(p => p.areas || []), ids(cards));
  refs('liceum class card', schools.flatMap(s => s.classes.flatMap(c => c.cards || [])), ids(cards));
  refs('liceum class source', schools.flatMap(s => s.classes.map(c => c.sourceId)), src);
  const codes = schools.flatMap(s => s.classes.map(c => s.id + '|' + c.code));
  if (new Set(codes).size !== codes.length) fail('liceum: a school has two classes with the same code');
}
{ // Sources: every pointer (any key ending in sourceId or sourceIds) exists, and every source is used at least once
  const pointers = (v, out = []) => {
    if (Array.isArray(v)) v.forEach(x => pointers(x, out));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
      if (/sourceids?$/i.test(k)) [x].flat(Infinity).flatMap(y => y && typeof y === 'object' ? Object.values(y).flat() : [y]).forEach(y => y && out.push(y));
      else pointers(x, out);
    }
    return out;
  };
  for (const app of ['studia', 'liceum']) {
    const known = ids(json[`${app}/data/sources.json`]);
    const used = new Set(Object.entries(json).filter(([f]) => f.startsWith(app + '/') && f !== `${app}/data/sources.json`).flatMap(([, d]) => pointers(d)));
    for (const s of json[`${app}/data/sources.json`]) if (!/^\d{4}-\d{2}$/.test(String(s.asOf))) fail(`${app}: source "${s.id}" asOf "${s.asOf}" is not YYYY-MM`);
    refs(`${app} source pointer`, used, known);
    for (const id of known) if (!used.has(id)) fail(`${app}: source "${id}" is not used anywhere (attach it or delete it)`);
  }
}
console.log(bad ? `${bad} problem(s)` : `OK: ${files.filter(f => f.endsWith('.js')).length} scripts parse, ${Object.keys(json).length} data files valid, cross-references resolve, every source used`);
process.exit(bad ? 1 : 0);
