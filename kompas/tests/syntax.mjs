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
}
{ // Liceum
  const cards = json['liceum/data/opportunities.json'] || [], src = ids(json['liceum/data/sources.json']);
  const schools = json['liceum/data/db/pl/krakow/schools.json'] || [];
  refs('liceum profile area', (json['liceum/data/profiles.json'] || []).flatMap(p => p.areas || []), ids(cards));
  refs('liceum class card', schools.flatMap(s => s.classes.flatMap(c => c.cards || [])), ids(cards));
  refs('liceum class source', schools.flatMap(s => s.classes.map(c => c.sourceId)), src);
  const codes = schools.flatMap(s => s.classes.map(c => s.id + '|' + c.code));
  if (new Set(codes).size !== codes.length) fail('liceum: a school has two classes with the same code');
}
console.log(bad ? `${bad} problem(s)` : `OK: ${files.filter(f => f.endsWith('.js')).length} scripts parse, ${Object.keys(json).length} data files valid, cross-references resolve`);
process.exit(bad ? 1 : 0);
