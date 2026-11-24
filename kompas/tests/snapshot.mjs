// Polish output safety net (Studia v3.1): node kompas/tests/snapshot.mjs [--update]
// Builds the markdown export and the scoring result for every test kid and compares hashes with tests/snapshots/pl-export.json.
// While texts move into i18n files, the Polish output must stay identical.
import './_i18n.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { scoreAll, declarationHelp } from '../core/scoring.js';
import { buildMarkdown } from '../core/export.js';

const j = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const data = {
  dimensions: j('../core/dimensions.json'), strengths: j('../core/strengths.json'), config: j('../studia/data/config.json'),
  questions: j('../studia/data/questions.json'), opportunities: j('../studia/data/opportunities.json'),
  offers: j('../studia/data/db/pl/krakow/offers.json'), campuses: j('../studia/data/db/pl/krakow/campuses.json'),
  sources: j('../studia/data/sources.json'), scenarios: j('../studia/data/scenarios.json')
};
const h = s => createHash('sha1').update(s).digest('hex').slice(0, 12);
const out = {};
for (const p of j('../studia/data/personas.json')) {
  const r = scoreAll(p.answers, data);
  out[p.label || p.id] = {
    md: h(buildMarkdown(p.answers, r, data, '2026-11-21')),
    result: h(JSON.stringify(r)),
    decl: h(JSON.stringify(declarationHelp(r, p.answers, data)))
  };
}
const file = new URL('./snapshots/pl-export.json', import.meta.url);
if (process.argv.includes('--update') || !existsSync(file)) { writeFileSync(file, JSON.stringify(out, null, 1)); console.log('snapshot written:', Object.keys(out).length, 'kids'); process.exit(0); }
const old = JSON.parse(readFileSync(file)); let bad = 0;
for (const k of new Set([...Object.keys(old), ...Object.keys(out)])) for (const f of ['md', 'result', 'decl']) if (old[k]?.[f] !== out[k]?.[f]) { console.log('CHANGED', k, f); bad++; }
console.log(bad ? `${bad} Polish outputs changed` : `Polish snapshot unchanged (${Object.keys(out).length} kids)`);
process.exit(bad ? 1 : 0);
