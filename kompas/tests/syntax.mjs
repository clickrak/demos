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
  { const noUrl = offers.filter(o => !o.url); console.log(`studia offers without url: ${noUrl.length}${noUrl.length ? ' (' + noUrl.map(o => o.id).join(', ') + ')' : ''}`); } // v3.8: printed count, strict when 0
  for (const o of offers) if (o.ukraine !== undefined) { // v3.7: Ukraine-linked offer (A philology, B joint diploma, C taught in Ukrainian/English, F reconstruction)
    const u = o.ukraine, keys = ['type', 'note', 'sourceId', 'url', 'partner'];
    if (!u || typeof u !== 'object') { fail(`studia offer "${o.id}": ukraine must be an object`); continue; }
    for (const k of Object.keys(u)) if (!keys.includes(k)) fail(`studia offer "${o.id}": ukraine must not hold "${k}"`);
    if (!['A', 'B', 'C', 'F'].includes(u.type)) fail(`studia offer "${o.id}": ukraine.type must be A, B, C or F`);
    if (typeof u.note !== 'string' || !u.note.trim() || u.note.length > 170) fail(`studia offer "${o.id}": ukraine.note must be 1–170 characters`);
    if (!src.has(u.sourceId)) fail(`studia offer "${o.id}": ukraine has unknown sourceId "${u.sourceId}"`);
    if (!/^https?:\/\//.test(u.url || '')) fail(`studia offer "${o.id}": ukraine.url must be http(s)`);
    if (u.partner !== undefined && (typeof u.partner !== 'string' || !u.partner.trim())) fail(`studia offer "${o.id}": ukraine.partner must be text`);
  }
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
  // Entrance exam (v2.12, A1): entry.kind from the list, entry.sourceId in sources.json, never a threshold next to it.
  for (const s of schools) for (const c of s.classes) if (c.entry) {
    if (!['plastyczny', 'muzyczny'].includes(c.entry.kind)) fail(`liceum class "${s.id} ${c.code}": entry.kind must be plastyczny or muzyczny`);
    if (!src.has(c.entry.sourceId)) fail(`liceum class "${s.id} ${c.code}": entry.sourceId not in sources.json`);
    if (c.threshold != null) fail(`liceum class "${s.id} ${c.code}": no threshold next to entry`);
  }
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
{ // Studia interface texts: pl.json is the base; ua.json and en.json need exactly the same keys once they have any (rule UK-G).
  const pl = { ...json['core/i18n/pl.json'], ...json['studia/i18n/pl.json'] };
  for (const f of Object.keys(json)) if (/i18n\/frag-/.test(f)) fail(`i18n: fragment file ${f} must be merged into pl.json`);
  const plKeys = new Set(Object.keys(pl));
  const code = files.filter(f => /studia\/[^/]+\.(js|html)$/.test(f) || f.endsWith('core/scoring.js') || f.endsWith('core/export.js')).map(f => readFileSync(f, 'utf8')).join('\n');
  const used = new Set(), bases = new Set();
  for (const m of code.matchAll(/\bt\(\s*'([\w.]+)'/g)) used.add(m[1]);
  for (const m of code.matchAll(/\bplural\([^,]+,\s*'([\w.]+)'/g)) bases.add(m[1]);
  for (const m of code.matchAll(/data-i18n="([\w.]+)"/g)) used.add(m[1]);
  for (const m of code.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(',')) used.add(pair.split(':')[1]);
  // Keys built at run time: t('skin.' + name) or t(`core.lang.${code}`) count as using every key with that prefix.
  const dynamic = new Set();
  for (const m of code.matchAll(/\bt\(\s*'([\w.]+\.)'\s*\+/g)) dynamic.add(m[1]);
  for (const m of code.matchAll(/\bt\(\s*`([\w.]+\.)\$\{/g)) dynamic.add(m[1]);
  for (const m of code.matchAll(/'((?:app|core|story|illus)\.[\w.]*\.)'\s*\+/g)) dynamic.add(m[1]);
  for (const k of used) if (!plKeys.has(k) && !k.endsWith('.')) fail(`i18n: t('${k}') is not in pl.json`);
  for (const b of bases) for (const f of ['one', 'few', 'many']) if (!plKeys.has(`${b}.${f}`)) fail(`i18n: plural '${b}' lacks ${b}.${f} in pl.json`);
  for (const k of plKeys) if (!used.has(k) && !['\'', '"', '`'].some(q => code.includes(q + k + q)) && ![...dynamic].some(d => k.startsWith(d)) && ![...bases].some(b => k.startsWith(b + '.'))) fail(`i18n: key "${k}" in pl.json is not used in the code`);
  for (const [k, v] of Object.entries(pl)) if (typeof v !== 'string') fail(`i18n: pl.json "${k}" is not a string`);
  const ph = v => (String(v).match(/\{\w+\}/g) || []).sort().join(','), tags = v => (String(v).match(/<\/?[a-z][^>]*>/gi) || []).join('');
  const PROPER = /Kraków|KRAKÓW|Główny|Małopolska|Łódź|Wisła/g, POL = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/, CYR = /[Ѐ-ӿ]/;
  for (const lg of ['ua', 'en']) {
    const tr = { ...json[`core/i18n/${lg}.json`], ...json[`studia/i18n/${lg}.json`] }, keys = Object.keys(tr);
    for (const k of keys) if (!plKeys.has(k) && !(k.endsWith('.other') && plKeys.has(k.replace(/\.other$/, '.one')))) fail(`i18n: ${lg}.json has a key pl.json does not: ${k}`);
    if (!keys.length) { console.log(`note: ${lg}.json is still a stub`); continue; }
    for (const k of plKeys) if (!(k in tr)) fail(`i18n: ${lg}.json misses "${k}"`);
    for (const k of keys) if (k in pl) {
      const v = tr[k];
      if (typeof v !== 'string' || !v.trim()) { fail(`i18n: ${lg} "${k}" is empty or not a string`); continue; }
      if (ph(v) !== ph(pl[k])) fail(`i18n: ${lg} "${k}" placeholders differ: ${ph(pl[k])} vs ${ph(v)}`);
      if (tags(v) !== tags(pl[k])) fail(`i18n: ${lg} "${k}" HTML tags differ from Polish`);
      const text = v.replace(/\([^)]*\)/g, '').replace(/<[^>]*>/g, '').replace(lg === 'en' ? PROPER : /$^/, '');
      if (POL.test(text)) fail(`i18n: ${lg} "${k}" has Polish letters outside brackets: ${v.slice(0, 60)}`);
      if (lg === 'en' && CYR.test(v)) fail(`i18n: en "${k}" has Cyrillic letters`);
      if (lg === 'en' && k.endsWith('.few') && v !== tr[k.replace(/\.few$/, '.many')]) fail(`i18n: en "${k}" must equal the .many form`);
    }
  }
}
for (const lg of ['ua', 'en']) { // Overlays of the data texts (v3.3, English v3.4): every text field of every item must have a translation (strict).
  const q = json['studia/data/questions.json'] || {}, sc = json['studia/data/scenarios.json'] || {}, str = json['core/strengths.json'] || [], dim = json['core/dimensions.json'] || {};
  const oq = json[`studia/i18n/${lg}/questions.json`], os = json[`studia/i18n/${lg}/strengths.json`], od = json[`studia/i18n/${lg}/dimensions.json`], osc = json[`studia/i18n/${lg}/scenarios.json`];
  const PL = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/, CY = /[\u0400-\u04FF]/, clean = v => String(v).replace(/\([^)]*\)/g, '');
  const bad = (what, v) => (typeof v !== 'string' || !v.trim()) ? fail(`overlay: ${what} has no ${lg} text`) : PL.test(clean(v).replace(lg === 'en' ? /Kraków|KRAKÓW|Główny|Małopolska|Łódź|Wisła/g : /$^/, '')) ? fail(`overlay: ${lg} ${what} has Polish letters: ${v.slice(0, 50)}`) : (lg === 'en' && CY.test(v)) ? fail(`overlay: en ${what} has Cyrillic letters`) : 0;
  const cover = (what, base, ov, fields) => {
    const m = new Map((ov || []).map(x => [x.id, x]));
    for (const b of base || []) { const o = m.get(b.id); if (!o) { fail(`overlay: ${lg} ${what} "${b.id}" is missing`); continue; }
      for (const f of fields) { if (Array.isArray(b[f])) { if (!Array.isArray(o[f]) || o[f].length !== b[f].length) fail(`overlay: ${what} "${b.id}".${f} list length differs`); else o[f].forEach(x => bad(`${what} "${b.id}".${f}`, x)); } else bad(`${what} "${b.id}".${f}`, o[f]); } }
    for (const o of ov || []) if (!(base || []).some(b => b.id === o.id)) fail(`overlay: ${what} "${o.id}" is not in the Polish data`);
  };
  if (!oq || !os || !od || !osc) fail(`overlay: studia/i18n/${lg}/{questions,strengths,dimensions,scenarios}.json must exist`);
  else {
    cover('activity', q.activities, oq.activities, ['text']);
    cover('situation', q.situations, oq.situations, ['text']);
    for (const x of q.situations || []) cover(`situation ${x.id} answer`, x.answers, (oq.situations || []).find(o => o.id === x.id)?.answers, ['text']);
    for (const k of ['certainty', 'studyLength', 'privateOk']) cover(k, q[k], oq[k], ['label']);
    cover('doubt', q.doubts, oq.doubts, ['label', 'card']);
    for (const pl of [...(q.neededWhere || []), ...(q.homePlaces || [])]) bad(`place "${pl}"`, oq.placeNames?.[pl]);
    cover('language', q.languages, oq.languages, ['name']); cover('reflection', q.reflection, oq.reflection, ['text', 'ideas']);
    for (const sub of q.subjects || []) bad(`subject "${sub}"`, oq.subjectNames?.[sub]);
    cover('strength', str, os, ['name', 'example']);
    cover('interest', dim.interests, od.interests, ['name', 'desc']); cover('workStyle', dim.workStyle, od.workStyle, ['left', 'right']);
    cover('value', dim.values, od.values, Object.keys((dim.values || [{}])[0]).filter(k => k !== 'id'));
    cover('scenario', sc.scenarios, osc.scenarios, ['name', 'text']); cover('force', sc.forces, osc.forces, ['name', 'text', 'line']); cover('sector', sc.sectors, osc.sectors, ['name']);
    bad('scenarios.shrinking', osc.shrinking);
    const nums = v => (String(v).match(/\d+/g) || []).join(',');
    for (const f of sc.forces || []) { const o = (osc.forces || []).find(x => x.id === f.id); if (o && nums(f.text) !== nums(o.text)) fail(`overlay: force "${f.id}" numbers differ: ${nums(f.text)} vs ${nums(o.text)}`); }
  }
  // Cards (v3.5): Ukrainian only; English keeps the Polish cards. University names stay Polish and are allowed as they are.
  const opp = json['studia/data/opportunities.json'] || [], oo = json[`studia/i18n/${lg}/opportunities.json`];
  if (lg === 'en' && oo) fail('overlay: studia/i18n/en/opportunities.json must not exist (cards stay Polish in English)');
  if (lg === 'ua') {
    if (!oo) fail('overlay: studia/i18n/ua/opportunities.json must exist');
    else {
      const insts = [...new Set((json['studia/data/db/pl/krakow/offers.json'] || []).map(o => o.institution).filter(Boolean))].sort((a, b) => b.length - a.length);
      const strip = v => insts.reduce((x, n) => x.split(n).join(''), String(v));
      const textF = ['name', 'roles', 'whoYouHelp', 'whatYouGet', 'whyNeeded', 'dayInLife', 'growth', 'experiment'];
      const m = new Map(oo.map(x => [x.id, x])), nums = v => (String(v).match(/\d+/g) || []).sort().join(',');
      for (const c of opp) {
        const o = m.get(c.id); if (!o) { fail(`overlay: ua card "${c.id}" is missing`); continue; }
        const pairs = [...textF.filter(f => c[f] !== undefined).map(f => [f, c[f], o[f]]), ...(c.robustnessNote ? [['robustnessNote', c.robustnessNote, o.robustnessNote]] : []),
          ['demand.text', c.demand?.text, o.demand?.text], ...(c.pay?.group ? [['pay.group', c.pay.group, o.pay?.group]] : [])];
        for (const [f, pv, uv] of pairs) {
          if (Array.isArray(pv)) { if (!Array.isArray(uv) || uv.length !== pv.length) { fail(`overlay: card "${c.id}".${f} list length differs`); continue; } uv.forEach(x => bad(`card "${c.id}".${f}`, strip(x))); }
          else bad(`card "${c.id}".${f}`, typeof uv === 'string' ? strip(uv) || uv : uv);
          if ([].concat(uv || []).some((x, i) => x === [].concat(pv)[i] && /[a-z]{4}/i.test(x))) fail(`overlay: card "${c.id}".${f} is still the Polish text`);
          if (nums([].concat(pv)) !== nums([].concat(uv || []))) fail(`overlay: card "${c.id}".${f} numbers differ`);
        }
        for (const n of insts) if ([].concat(...pairs.map(p => p[1])).join(' ').includes(n) && ![].concat(...pairs.map(p => p[2] || [])).join(' ').includes(n)) fail(`overlay: card "${c.id}" changed the university name "${n}"`);
        for (const k of ['cluster', 'force', 'values', 'strengths', 'related', 'languages', 'field', 'robustness', 'interests', 'workStyle']) if (k in o) fail(`overlay: ua card "${c.id}" must not hold "${k}" (ids and codes stay Polish)`);
        if (o.name && o.name.length > Math.max(20, 1.4 * c.name.length)) fail(`overlay: ua card "${c.id}" name too long for the compass`);
      }
      for (const o of oo) if (!opp.some(c => c.id === o.id)) fail(`overlay: ua card "${o.id}" is not in the Polish data`);
    }
  }
}
{ // Offers (v3.6): Ukrainian only (studia/i18n/ua/offers.json); English keeps the Polish offers. University names stay Polish.
  const offs = json['studia/data/db/pl/krakow/offers.json'] || [], ou = json['studia/i18n/ua/offers.json'], lv = json['studia/i18n/ua/questions.json']?.levelNames || {};
  if (json['studia/i18n/en/offers.json']) fail('overlay: studia/i18n/en/offers.json must not exist (offers stay Polish in English)');
  if (!ou) fail('overlay: studia/i18n/ua/offers.json must exist');
  else {
    const PL = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/, nums = v => (String(v).match(/\d+/g) || []).sort().join(',');
    const insts = [...new Set(offs.map(o => o.institution).filter(Boolean)), 'Szkoła Aspirantów PSP'].sort((a, b) => b.length - a.length);
    const strip = v => insts.reduce((x, n) => x.split(n).join(''), String(v)).replace(/\([^)]*\)/g, '');
    const m = new Map(), seen = new Set();
    for (const o of ou) { if (seen.has(o.id)) fail(`overlay: ua offer "${o.id}" twice`); seen.add(o.id); m.set(o.id, o);
      for (const k of Object.keys(o)) if (!['id', 'name', 'requires', 'next', 'cost', 'ukraine'].includes(k)) fail(`overlay: ua offer "${o.id}" must not hold "${k}" (only name, requires.note, next, cost, ukraine.note)`);
      if (o.ukraine && (typeof o.ukraine !== 'object' || Object.keys(o.ukraine).some(k => k !== 'note'))) fail(`overlay: ua offer "${o.id}" ukraine may hold only "note"`);
      if (o.requires && Object.keys(o.requires).some(k => k !== 'note')) fail(`overlay: ua offer "${o.id}" requires may hold only "note"`);
      if (!offs.some(b => b.id === o.id)) fail(`overlay: ua offer "${o.id}" is not in the Polish data`); }
    for (const b of offs) {
      const o = m.get(b.id); if (!o) { fail(`overlay: ua offer "${b.id}" is missing`); continue; }
      const pairs = [['name', b.name, o.name], ['requires.note', b.requires?.note, o.requires?.note], ['next', b.next, o.next], ...(b.cost ? [['cost', b.cost, o.cost]] : []), ...(b.ukraine ? [['ukraine.note', b.ukraine.note, o.ukraine?.note]] : [])];
      if (!b.ukraine && o.ukraine) fail(`overlay: ua offer "${b.id}" has a ukraine note the Polish has not`);
      if (!b.cost && o.cost) fail(`overlay: ua offer "${b.id}" has a cost the Polish has not`);
      for (const [f, pv, uv] of pairs) {
        if (pv === undefined) continue;
        if (typeof uv !== 'string' || !uv.trim()) { fail(`overlay: ua offer "${b.id}".${f} is empty`); continue; }
        if (PL.test(strip(uv))) fail(`overlay: ua offer "${b.id}".${f} has Polish letters outside brackets: ${uv.slice(0, 50)}`);
        if (uv === pv && pv !== 'Global business services' && /[ąćęłńóśźż]|[a-z]{5} [a-z]{3}/i.test(pv)) fail(`overlay: ua offer "${b.id}".${f} is still the Polish text`);
        if (nums(pv) !== nums(uv)) fail(`overlay: ua offer "${b.id}".${f} numbers differ: ${nums(pv)} vs ${nums(uv)}`);
      }
      for (const n of insts) if ([b.requires?.note, b.next].join(' ').includes(n) && ![o.requires?.note, o.next].join(' ').includes(n)) fail(`overlay: ua offer "${b.id}" changed the university name "${n}"`);
      if (o.name.length > Math.max(24, 1.4 * b.name.length)) fail(`overlay: ua offer "${b.id}" name too long (${o.name.length})`);
      if (!lv[b.level]) fail(`overlay: levelNames has no Ukrainian name for "${b.level}"`);
    }
    const names = new Map(); for (const b of offs) { const u = m.get(b.id)?.name; if (names.has(b.name) && names.get(b.name) !== u) fail(`overlay: the study name "${b.name}" has two Ukrainian names`); names.set(b.name, u); }
  }
}
console.log(bad ? `${bad} problem(s)` : `OK: ${files.filter(f => f.endsWith('.js')).length} scripts parse, ${Object.keys(json).length} data files valid, cross-references resolve, every source used`);
process.exit(bad ? 1 : 0);
