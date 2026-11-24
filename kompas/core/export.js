// Builds the markdown export. Everything happens in the browser; nothing is uploaded.
import { provenStrengths, proofText, pathSteps, planFocus, planItems, declarationHelp, subjectFit, compareIds } from './scoring.js';
import { t, plural } from './i18n.js';

// "GUS, październik 2024" from a source's asOf ("2024-10"), so the words always match the data.
export function payLabel(src) {
  const m = /^(\d{4})-(\d{2})$/.exec(src?.asOf || '');
  return m ? t('core.pay.source_date', { month: t('core.month.' + (+m[2] - 1)), year: m[1] }) : t('core.pay.source');
}

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
  L.push(t('core.export.title', { name: answers.name || t('core.export.name_default'), today }));
  L.push(t('core.export.meta', { version: data.config.appVersion }), '');

  const complete = provenStrengths(answers).length > 0 && (answers.values || []).length > 0;
  if (!complete) {
    L.push(t('core.export.progress_note'), '');
    L.push('<!-- dane do ponownego wczytania -->');
    L.push('```json', JSON.stringify({ app: 'kompas-studia', version: data.config.appVersion, dataVersion: data.config.dataVersion, date: today, snapshot: null, answers }, null, 1), '```');
    return L.join('\n');
  }
  L.push(t('core.export.h_strengths'));
  provenStrengths(answers).forEach((s, i) => L.push(t('core.export.strength_line', { n: i + 1, name: cap(st(s.id).name), proof: proofText(s.proof) })));
  L.push('', t('core.export.h_cando'), answers.canDo ? answers.canDo : t('core.export.cando_placeholder'), '');

  L.push(t('core.export.h_profile'));
  for (const d of profile.top) L.push(t('core.export.profile_line', { name: data.dimensions.interests.find(x => x.id === d).name, bar: bar(profile.score[d]) }));
  const vals = (answers.values || []).map((v, i) => t('core.export.value_item', { n: i + 1, name: data.dimensions.values.find(x => x.id === v).name }));
  if (vals.length) L.push(t('core.export.values_line', { values: vals.join(', ') }));
  L.push('');

  L.push(t('core.export.h_where'));
  const card = (title, c) => {
    if (!c) return;
    L.push(t('core.export.card_head', { title, name: c.card.name, band: c.band }));
    L.push(t('core.export.who_help', { text: c.card.whoYouHelp }));
    L.push(t('core.export.what_get', { text: c.card.whatYouGet }));
    if (c.card.pay) L.push(t('core.export.pay', { dollars: '$'.repeat(c.card.pay.band), source: payLabel((data.sources || []).find(x => x.id === c.card.pay.sourceId)), group: c.card.pay.group }));
    if (c.strengthsUsed.length) L.push(t('core.export.strengths_work', { list: c.strengthsUsed.map(p => p.label).join(', ') }));
    if (c.reasons.length) L.push(t('core.export.why', { list: c.reasons.join('; ') }));
    L.push(t('core.export.robust', { list: data.scenarios.scenarios.map(x => t('core.export.robust_item', { name: x.name, level: c.card.robustness[x.id] })).join(' · ') }));
    const reach = c.offers.filter(o => o.check.reachable).map(o => t('core.export.offer_label', { name: o.offer.name, institution: o.offer.institution }));
    if (reach.length) L.push(t('core.export.in_krakow', { list: reach.join('; ') }));
    L.push('');
  };
  slots.best.forEach((c, i) => card(`${i + 1}`, c));
  card(t('core.export.card_most'), slots.most);
  if (slots.quick) {
    const o = slots.quick.o.offer;
    L.push(t('core.export.quick_head', { name: o.name, institution: o.institution, years: o.durationYears }), '');
  }
  card(t('core.export.card_surprise'), slots.surprise);

  // The plan: the option he checks first, with small dated steps; ticks come from the app.
  const focus = planFocus(slots, answers), checks = answers.checks || {};
  if (focus) {
    const fo = focus.o && focus.o.offer;
    L.push(t('core.export.h_plan'));
    L.push(t('core.export.first_check', { target: focus.quick ? t('core.export.first_quick', { name: fo.name }) : focus.c.card.name, extra: fo && !focus.quick ? t('core.export.first_extra', { name: fo.name, institution: fo.institution }) : '' }));
    for (const it of planItems(focus, data)) L.push(t('core.export.plan_item', { mark: checks[`plan:${focus.key}:${it.id}`] ? 'x' : ' ', when: it.when, text: it.text }));
    L.push('');
    if (fo) { L.push(t('core.export.h_path')); pathSteps(fo, camp(fo.campus)?.name).forEach(s => L.push(`- ${s}`)); L.push(''); }
  }

  // Starred offers (v2.2) and the declaration helper: which one extra extended subject opens most of them.
  const stars = (answers.stars || []).map(id => data.offers.find(o => o.id === id)).filter(Boolean);
  const ext = answers.rozszerzenia || [];
  const FIT = { 3: t('core.fit.full'), 2: t('core.fit.part'), 1: t('core.fit.none'), 0: t('core.fit.closed') };
  const years = n => plural(n, 'core.years');
  if (stars.length) {
    L.push(t('core.export.h_stars'));
    for (const o of stars) { const f = subjectFit(o, ext); L.push(t('core.export.star_line', { name: o.name, institution: o.institution, years: years(o.durationYears), fit: f === null ? t('core.export.no_ext_dependence') : FIT[f], note: o.requires?.note || '-' })); }
    L.push('');
  }
  // Side by side (v2.4): the 2–3 starred offers he compares, one column each.
  const cmp = compareIds(answers, data).map(id => data.offers.find(o => o.id === id));
  if (cmp.length >= 2) {
    const cell = t => String(t ?? '-').replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ');
    const campOf = o => camp(o.campus);
    const rows = [
      [t('core.export.cmp_institution'), o => o.institution],
      [t('core.export.cmp_place'), o => campOf(o) ? `${campOf(o).name}, ${campOf(o).address}` : '-'],
      [t('core.export.cmp_length'), o => t('core.export.cmp_duration', { years: years(o.durationYears), level: o.level })],
      [t('core.export.cmp_subjects'), o => { const f = subjectFit(o, ext); return f === null ? t('core.export.no_ext_dependence') : FIT[f]; }],
      [t('core.export.cmp_requirements'), o => o.requires?.note],
      [t('core.export.cmp_threshold'), o => o.threshold ? t('core.export.threshold_value', { points: o.threshold.points, max: o.threshold.max }) : t('core.export.no_data')],
      [t('core.export.cmp_public'), o => o.private ? t('core.export.private_paid') : t('core.export.public')],
      [t('core.export.cmp_next'), o => o.next]];
    L.push(t('core.export.h_compare'));
    L.push(`| | ${cmp.map(o => cell(o.name)).join(' | ')} |`, `|---|${cmp.map(() => '---').join('|')}|`);
    for (const [label, f] of rows) L.push(`| ${label} | ${cmp.map(o => cell(f(o))).join(' | ')} |`);
    L.push('');
  }
  if (ext.length) {
    const h = declarationHelp(result, answers, data);
    const name = o => t('core.export.offer_label', { name: o.name, institution: o.institution });
    L.push(t('core.export.h_declaration'));
    L.push(t('core.export.decl_for', { basis: h.basis === 'stars' ? t('core.export.decl_basis_stars', { total: h.total }) : t('core.export.decl_basis_options', { total: h.total }), subjects: ext.join(', ') }));
    L.push(t('core.export.decl_counts', { full: h.full.length, part: h.part.length, weak: h.weak.length, closed: h.closed.length, free: h.free.length }));
    for (const g of h.gains) L.push(t('core.export.gain_line', { subject: g.subject, parts: `${g.opens.length ? t('core.export.gain_opens', { list: g.opens.map(name).join('; ') }) : ''}${g.opens.length && g.better.length ? ' · ' : ''}${g.better.length ? t('core.export.gain_better', { n: g.better.length }) : ''}` }));
    if (!h.gains.length) L.push(t('core.export.gain_none'));
    if (h.keep.length) L.push(t('core.export.keep_line', { list: h.keep.map(k => t('core.export.keep_item', { subject: k.subject, n: k.needed.length })).join(', ') }));
    L.push(t('core.export.decl_note', { deadline: data.config.declarationDeadline }), '');
  }

  L.push(t('core.export.h_reflections'));
  for (const q of data.questions.reflection) {
    const a = (answers.reflection || {})[q.id];
    if (a) L.push(`**${q.text}** ${a}`);
  }
  const scen = (data.scenarios.scenarios || []).find(x => x.id === answers.scenario);
  L.push(t('core.export.scenario_line', { scenario: scen ? scen.name : answers.scenario === '?' ? t('core.export.scenario_unknown') : '-' }));
  L.push(t('core.export.home_line', { places: (answers.homePlaces || []).join(', ') || '-', needed: answers.neededWhere || '-' }), '');

  L.push(t('core.export.h_parents_talk'));
  L.push(t('core.export.q1'), t('core.export.q2'), t('core.export.q3'), '');
  L.push(t('core.export.h_parent'));
  L.push(t('core.export.parent_text'), '');

  // Raw answers (to reload) plus a snapshot of what he saw (to compare in 6 months, even if the model changes).
  const snapshot = complete ? { best: slots.best.map(c => c.card.id), most: slots.most?.card.id || null, surprise: slots.surprise?.card.id || null,
    quick: slots.quick?.o.offer.id || null, strengths: provenStrengths(answers).map(s => s.id) } : null;
  L.push('<!-- dane do ponownego wczytania -->');
  L.push('```json', JSON.stringify({ app: 'kompas-studia', version: data.config.appVersion, dataVersion: data.config.dataVersion, date: today, snapshot, answers }, null, 1), '```');
  return L.join('\n');
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Reads the answers back from an exported file. Looks only at the part after the reload marker and takes
// everything from the first "{" to the last "}", so stray backticks inside a typed answer cannot break it.
export function parseSaved(text) {
  const mark = '<!-- dane do ponownego wczytania -->';
  for (const at of [text.lastIndexOf(mark), text.lastIndexOf('```json')]) {
    if (at < 0) continue;
    const tail = text.slice(at), a = tail.indexOf('{'), b = tail.lastIndexOf('}');
    if (a < 0 || b <= a) continue;
    try { return JSON.parse(tail.slice(a, b + 1)); } catch { /* try the next anchor */ }
  }
  return null;
}
