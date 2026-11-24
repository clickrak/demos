// Kompas core: profile, fit, reasons, requirement checks and slots.
// Pure functions, no DOM: used by the apps and by tests/run.mjs in Node.
import { t } from './i18n.js';

const ROBUST = { wysoka: 3, 'średnia': 2, niska: 1 };

export function computeProfile(answers, data) {
  const dims = data.dimensions.interests.map(d => d.id);
  // Activities: lubię +1, obojętne 0, nie lubię -1, mapped to 0..100 per dimension.
  const raw = Object.fromEntries(dims.map(d => [d, 0]));
  const max = Object.fromEntries(dims.map(d => [d, 0]));
  for (const a of data.questions.activities) {
    const v = (answers.sort || {})[a.id] || 0;
    for (const [d, w] of Object.entries(a.w)) { raw[d] += v * w; max[d] += w; }
  }
  const act = {};
  for (const d of dims) act[d] = max[d] ? ((raw[d] + max[d]) / (2 * max[d])) * 100 : 50;

  // Situations: the chosen answer's weights against the best each situation could give a dimension.
  const sit = Object.fromEntries(dims.map(d => [d, 0]));
  const sitMax = Object.fromEntries(dims.map(d => [d, 0]));
  let sitN = 0;
  for (const q of data.questions.situations || []) {
    const pick = q.answers.find(a => a.id === (answers.situations || {})[q.id]);
    if (!pick) continue;
    sitN++;
    for (const d of dims) sitMax[d] += Math.max(...q.answers.map(a => a.w[d] || 0));
    for (const [d, w] of Object.entries(pick.w)) sit[d] += w;
  }
  const cfg = data.config;
  const sw = sitN ? (cfg.situationWeight ?? 0.3) : 0;
  const score = {};
  for (const d of dims) score[d] = (1 - sw) * act[d] + sw * (sitMax[d] ? (sit[d] / sitMax[d]) * 100 : 50);

  // Strengths with a proof boost the dimensions they map to, capped per dimension.
  const boost = Object.fromEntries(dims.map(d => [d, 0]));
  for (const s of provenStrengths(answers)) {
    const card = data.strengths.find(x => x.id === s.id);
    for (const d of card ? card.dims : []) boost[d] = Math.min(cfg.strengthBoostCap, boost[d] + cfg.strengthBoost);
  }
  for (const d of dims) score[d] = Math.max(0, Math.min(100, score[d] + boost[d]));

  // Centred on his own average, so someone who likes everything still gets a clear top two.
  const mean = dims.reduce((s, d) => s + score[d], 0) / dims.length;
  const centred = Object.fromEntries(dims.map(d => [d, score[d] - mean]));
  const top = [...dims].sort((a, b) => score[b] - score[a]);
  const answered = Object.values(answers.sort || {}).filter(v => v !== 0).length;
  return { dims, score, centred, top, mean, answered, confidence: confidence(answers, data) };
}

// Which blocks he answered. Skipped blocks lower the confidence line on the results.
export function confidence(answers, data) {
  const acts = data.questions.activities.length;
  const blocks = [
    { id: 'zajecia', label: t('core.confidence.sort'), ok: Object.keys(answers.sort || {}).length >= Math.ceil(acts * 0.6) },
    { id: 'sytuacje', label: t('core.confidence.situations'), ok: Object.keys(answers.situations || {}).length >= Math.min(3, (data.questions.situations || []).length) },
    { id: 'styl', label: t('core.confidence.style'), ok: Object.values(answers.sliders || {}).some(v => v !== 0) },
    { id: 'wartosci', label: t('core.confidence.values'), ok: (answers.values || []).length >= 3 },
    { id: 'mocne', label: t('core.confidence.strengths'), ok: provenStrengths(answers).length >= 3 },
    { id: 'matura', label: t('core.confidence.matura'), ok: (answers.rozszerzenia || []).length > 0 }
  ];
  const missing = blocks.filter(b => !b.ok);
  const level = missing.length === 0 ? 'wysoka' : missing.length <= 2 ? 'średnia' : 'niska';
  return { level, missing: missing.map(b => b.label) };
}

const LEVEL = { brak: 0, podstawy: 1, komunikatywny: 2, 'bardzo dobry': 3 };
// Language codes are identifiers; the shown names come from the dictionary (getters, so the export keeps its shape).
export const LANG_NAMES = {};
for (const code of ['en', 'de', 'uk', 'fr']) Object.defineProperty(LANG_NAMES, code, { get: () => t('core.lang.' + code), enumerable: true });
export const langName = code => LANG_NAMES[code];
// Languages at a working level (komunikatywny or better) that this card can use.
export function workingLanguages(card, answers) {
  return (card.languages || []).filter(l => (LEVEL[(answers.jezyki || {})[l]] || 0) >= 2);
}

// Where a strength shows. Tapped instead of typed (kids do not want to write); a typed sentence is still welcome.
export const WHERE = ['w szkole', 'w sporcie', 'w domu i rodzinie', 'w językach', 'w pomaganiu innym', 'w hobby'];
const TAPPED_LIST = [...WHERE, 'w domu', 'z przyjaciółmi', 'w grach i internecie']; // plus the Liceum list
const TAPPED = new Set(TAPPED_LIST);
// Shown text of a tapped place; the stored value (identifier) stays Polish.
export const whereLabel = p => t('core.where.' + TAPPED_LIST.indexOf(String(p || '').trim()));
export const isWhere = p => TAPPED.has(String(p || '').trim());
// How a proof reads in a sentence: "widać to w sporcie" for a tapped place, the quoted sentence for a typed one.
export const proofText = p => (isWhere(p) ? t('core.proof.seen', { where: whereLabel(p) }) : t('core.proof.typed', { text: String(p || '').trim() }));

export function provenStrengths(answers) {
  return (answers.strengths || []).filter(s => s.proof && s.proof.trim().length > 0);
}

function centre(vec, dims) {
  const m = dims.reduce((s, d) => s + (vec[d] || 0), 0) / dims.length;
  return Object.fromEntries(dims.map(d => [d, (vec[d] || 0) - m]));
}

function cosine(a, b, dims) {
  let ab = 0, aa = 0, bb = 0;
  for (const d of dims) { ab += a[d] * b[d]; aa += a[d] ** 2; bb += b[d] ** 2; }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}

export function fitCard(profile, card, answers, data) {
  const dims = profile.dims;
  const cc = centre(card.interests, dims);
  const interests = (cosine(profile.centred, cc, dims) + 1) / 2;

  const axes = Object.keys(card.workStyle || {});
  const sl = answers.sliders || {};
  const workStyle = axes.length
    ? 1 - axes.reduce((s, ax) => s + Math.abs((sl[ax] || 0) - card.workStyle[ax]), 0) / axes.length / 6
    : 0.5;

  // Values: his top picks weighted 5, 4, 3, 2, 1 against the best the card's values could score.
  const vals = (answers.values || []).slice(0, 5);
  const wts = [5, 4, 3, 2, 1];
  const matchedValues = vals.filter(v => card.values.includes(v));
  const best = wts.slice(0, Math.min(card.values.length, vals.length)).reduce((a, b) => a + b, 0) || 1;
  const values = Math.min(1, vals.reduce((s, v, i) => s + (card.values.includes(v) ? wts[i] : 0), 0) / best);

  const w = data.config.weights;
  const langs = workingLanguages(card, answers);
  const langBoost = Math.min(data.config.languageBoostCap ?? 6, langs.length * (data.config.languageBoost ?? 3));
  const fit = Math.min(100, 100 * (w.interests * interests + w.workStyle * workStyle + w.values * values) + langBoost);
  return { fit, parts: { interests, workStyle, values, langBoost }, matchedValues, langs };
}

export function band(fit, config) {
  return config.bands.find(b => fit >= b.min).label;
}

// Routes into a card: his proven strengths it uses, and his top-2 interest dimensions
// that are also among the card's top-2.
export function pathsTo(card, profile, answers, data) {
  const paths = [];
  for (const s of provenStrengths(answers)) {
    if (card.strengths.includes(s.id)) {
      const st = data.strengths.find(x => x.id === s.id);
      paths.push({ kind: 'strength', id: s.id, label: st ? st.name : s.id });
    }
  }
  for (const l of workingLanguages(card, answers)) paths.push({ kind: 'language', id: 'lang-' + l, label: t('core.path.language', { lang: String(LANG_NAMES[l]) }) });
  const cardTop = Object.keys(card.interests).sort((a, b) => card.interests[b] - card.interests[a]).slice(0, 2);
  for (const d of profile.top.slice(0, 2)) {
    if (cardTop.includes(d)) {
      const dim = data.dimensions.interests.find(x => x.id === d);
      paths.push({ kind: 'dimension', id: d, label: t('core.path.interest', { name: dim.name.toLowerCase() }) });
    }
  }
  return paths;
}

export function reasonsFor(card, profile, answers, data) {
  const cc = centre(card.interests, profile.dims);
  const liked = data.questions.activities
    .filter(a => (answers.sort || {})[a.id] === 1)
    .map(a => ({ a, s: Object.entries(a.w).reduce((t, [d, w]) => t + w * cc[d], 0) }))
    .filter(x => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .slice(0, 2)
    .map(x => t('core.reason.liked', { text: x.a.text.replace(/\.$/, '') }));
  const sitPick = (data.questions.situations || [])
    .map(q => q.answers.find(a => a.id === (answers.situations || {})[q.id]))
    .filter(Boolean)
    .map(a => ({ a, s: Object.entries(a.w).reduce((t, [d, w]) => t + w * cc[d], 0) }))
    .filter(x => x.s > 0).sort((x, y) => y.s - x.s)[0];
  if (sitPick && liked.length < 2) liked.push(t('core.reason.situation', { text: sitPick.a.text.replace(/\.$/, '') }));
  const v = (answers.values || []).find(id => card.values.includes(id));
  if (v) liked.push(t('core.reason.value', { name: data.dimensions.values.find(x => x.id === v).name }));
  const l = workingLanguages(card, answers)[0];
  if (l) liked.push(t('core.reason.language', { lang: t('core.lang_adv.' + l) }));
  return liked.slice(0, 3);
}

// Requirement check of one offer against his extended subjects and preferred study length.
export function checkOffer(offer, answers, config) {
  const ext = answers.rozszerzenia || [];
  const r = offer.requires || {};
  const out = { ok: [], blocked: [], flags: [], fix: null };
  if (r.noMatura) out.ok.push(t('core.check.no_matura'));
  // Art, music and drama schools: an entrance exam or audition decides (portfolio, playing, acting); subjects count little or not at all.
  if (r.exam) out.flags.push(t('core.check.exam'));
  for (const s of r.extended || []) {
    if (ext.includes(s)) out.ok.push(t('core.check.has_ext', { subject: s }));
    else out.blocked.push(t('core.check.missing_ext', { subject: s }));
  }
  if (r.must) {
    for (const s of r.must) if (ext.includes(s)) out.ok.push(t('core.check.has_ext', { subject: s }));
  }
  if (r.main) {
    if (ext.includes(r.main)) out.ok.push(t('core.check.has_main', { subject: r.main }));
    else { out.flags.push(t('core.check.missing_main', { subject: r.main })); out.soft = r.main; }
  }
  if (r.countFrom) {
    const hit = r.countFrom.filter(s => ext.includes(s));
    if (hit.length) out.ok.push(t('core.check.from_list', { subjects: hit.join(', ') }));
    else out.flags.push(t('core.check.none_on_list'));
  }
  if (!out.blocked.length && out.soft) {
    out.fix = t('core.check.fix_soft', { subject: out.soft, deadline: config.declarationDeadline });
  }
  if (out.blocked.length) {
    out.fix = t('core.check.fix_blocked', { deadline: config.declarationDeadline });
  }
  const len = answers.studyLength;
  if (len === 'krotko' && offer.durationYears > config.quickStartMaxYears) out.flags.push(t('core.check.longer_quick'));
  if (len === 'srednio' && offer.durationYears > 5) out.flags.push(t('core.check.longer_five'));
  if (offer.private) {
    if (answers.privateOk === 'nie') { out.hidden = true; out.flags.push(t('core.check.private_hidden')); }
    else out.flags.push(t('core.check.private_paid'));
  }
  if (offer.status !== 'sourced') out.flags.push(t('core.check.unsourced'));
  out.reachable = out.blocked.length === 0 && !out.hidden;
  return out;
}

export function scoreAll(answers, data) {
  const profile = computeProfile(answers, data);
  const cards = data.opportunities.map(card => {
    const f = fitCard(profile, card, answers, data);
    const offers = data.offers.filter(o => o.cards.includes(card.id)).map(o => ({ offer: o, check: checkOffer(o, answers, data.config) }));
    const paths = pathsTo(card, profile, answers, data);
    return {
      card, ...f, band: band(f.fit, data.config), paths,
      strengthsUsed: paths.filter(p => p.kind === 'strength'),
      reasons: reasonsFor(card, profile, answers, data),
      offers,
      reachable: offers.length === 0 || offers.some(o => o.check.reachable),
      // Future need: his chosen main scenario when he picked one, else all three together. Never part of the fit.
      robust: answers.scenario && card.robustness[answers.scenario] ? 3 * (ROBUST[card.robustness[answers.scenario]] || 0) : Object.values(card.robustness).reduce((s, v) => s + (ROBUST[v] || 0), 0)
    };
  });
  cards.sort(compareCards);
  return { profile, cards, slots: makeSlots(cards, profile, answers, data) };
}

function compareCards(a, b) {
  if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
  // Fits within 1 point count as a tie: more paths, more proven strengths, more future need.
  if (Math.abs(a.fit - b.fit) >= 1) return b.fit - a.fit;
  return (b.paths.length - a.paths.length) || (b.strengthsUsed.length - a.strengthsUsed.length) || (b.robust - a.robust) || (b.fit - a.fit);
}

export function makeSlots(cards, profile, answers, data) {
  const byId = id => cards.find(c => c.card.id === id);
  let best;
  if (answers.certainty === 'pewny' && answers.direction && byId(answers.direction)) {
    const pinned = byId(answers.direction);
    const neighbours = pinned.card.related.map(byId).filter(Boolean);
    best = [pinned, ...neighbours].slice(0, 3);
    best.forEach((c, i) => { c.pinned = i === 0; });
  } else {
    best = cards.slice(0, 3);
    if (answers.certainty !== 'pewny' && new Set(best.map(c => c.card.cluster)).size < 2) {
      const other = cards.find(c => !best.includes(c) && c.card.cluster !== best[0].card.cluster);
      if (other) best = [best[0], best[1], other];
    }
  }
  const used = new Set(best.map(c => c.card.id));

  const [d1, d2] = profile.top;
  const most = cards
    .filter(c => !used.has(c.card.id))
    .map(c => ({ c, s: Math.min(c.card.interests[d1], c.card.interests[d2]) }))
    .sort((x, y) => (y.s - x.s) || (y.c.fit - x.c.fit))[0]?.c || null;
  if (most) used.add(most.card.id);

  const quick = cards
    .flatMap(c => c.offers.filter(o => o.offer.firstJob && o.offer.durationYears <= data.config.quickStartMaxYears && o.check.reachable).map(o => ({ c, o })))
    .sort((x, y) => (y.c.fit - x.c.fit) || (x.o.offer.durationYears - y.o.offer.durationYears))[0] || null;

  const bestClusters = new Set(best.map(c => c.card.cluster));
  const surprise = cards.find(c => !used.has(c.card.id) && !bestClusters.has(c.card.cluster) && c.fit >= data.config.surpriseMinFit) || null;
  if (surprise) used.add(surprise.card.id);

  const rest = cards.filter(c => !used.has(c.card.id));
  return { best, most, quick, surprise, rest, dims: [d1, d2] };
}

// "Twoja droga": 4–5 small dated steps from today to a first job.
export function pathSteps(offer, campusName) {
  const steps = [];
  if (offer.kind === 'policealna') {
    steps.push(t('core.step.pol_matura'));
    steps.push(t('core.step.pol_signup'));
    steps.push(campusName ? t('core.step.pol_start_campus', { campus: campusName }) : t('core.step.pol_start'));
    const end = 2027 + Math.ceil(offer.durationYears);
    steps.push(t('core.step.pol_end', { year: end }));
    if (offer.next) steps.push(t('core.step.pol_next', { next: offer.next }));
  } else {
    steps.push(t('core.step.uni_declaration'));
    steps.push(t('core.step.uni_open_day', { institution: offer.institution }));
    steps.push(t('core.step.uni_matura'));
    steps.push(t('core.step.uni_start'));
    const end = 2027 + Math.ceil(offer.durationYears);
    steps.push(offer.next ? t('core.step.uni_end_next', { year: end, next: offer.next }) : t('core.step.uni_end', { year: end }));
  }
  return steps.slice(0, 5);
}

// The option he wants to check first: card id of a shown slot, or 'quick'. Falls back to the best fit.
export function planFocus(slots, answers) {
  const key = answers.plan && answers.plan.focus;
  if (key === 'quick' && slots.quick) return { key, c: slots.quick.c, o: slots.quick.o, quick: true };
  const c = [...slots.best, slots.most, slots.surprise].filter(Boolean).find(x => x.card.id === key) || slots.best[0];
  if (!c) return null;
  const o = c.offers.find(x => x.check.reachable) || c.offers.find(x => !x.check.hidden) || null;
  return { key: c.card.id, c, o, quick: false };
}

// "Mój plan": a few small, dated steps for the option he checks first. Not a choice, an experiment.
// Each item has a stable id, so ticks survive in the saved file.
export function planItems(focus, data) {
  if (!focus) return [];
  const { c, o } = focus, f = o && o.offer, chk = o && o.check, cfg = data.config, out = [];
  out.push({ id: 'exp', when: t('core.plan.exp_when'), text: c.card.experiment });
  if (f && f.requires.exam) {
    out.push({ id: 'teczka', when: t('core.plan.exam_when'), text: t('core.plan.exam_text', { note: f.requires.note }) });
  } else if (f && f.kind !== 'policealna') {
    const fix = chk && (chk.blocked.length || chk.soft) ? chk.fix : null;
    out.push({ id: 'dek', when: t('core.plan.declaration_when', { deadline: cfg.declarationDeadline }), warn: !!fix,
      text: fix || t('core.plan.declaration_text', { name: f.name, institution: f.institution, note: f.requires.note || t('core.plan.declaration_note_default') }) });
  }
  if (f) {
    const src = data.sources.find(s => s.id === f.sourceId);
    out.push({ id: 'www', when: t('core.plan.web_when'), text: t('core.plan.web_text', { name: f.name, institution: f.institution }), url: src ? src.url : null });
    out.push(f.kind === 'policealna'
      ? { id: 'dni', when: t('core.plan.school_when'), text: t('core.plan.school_text', { institution: f.institution }) }
      : { id: 'dni', when: t('core.plan.open_day_when'), text: t('core.plan.open_day_text', { institution: f.institution }) });
  }
  out.push({ id: 'talk', when: t('core.plan.talk_when'), text: t('core.plan.talk_text') });
  return out;
}

// ---- Declaration helper (Studia v2.2) ---------------------------------------
// How well his extended subjects fit one offer's subject rules, on a small scale (information, not a prediction):
// 0 = closed (an extended subject it requires is missing), 1 = none of his extended subjects is on its list,
// 2 = fits in part (fewer listed subjects than it counts, or the main subject is missing), 3 = fits fully.
// null = the offer does not depend on extended subjects (no matura, entrance exam only, or no rule in the data).
export function subjectFit(offer, ext) {
  const r = offer.requires || {};
  const hasRule = (r.extended || []).length || r.main || (r.countFrom || []).length;
  if (r.noMatura || !hasRule) return null;
  if ((r.extended || []).some(s => !ext.includes(s))) return 0;
  let fit = 3;
  if (r.countFrom?.length) {
    const hit = r.countFrom.filter(s => ext.includes(s)).length;
    const need = Math.min(r.count || 1, r.countFrom.length);
    if (!hit) fit = 1; else if (hit < need) fit = 2;
  }
  if (r.main && !ext.includes(r.main)) fit = Math.min(fit, 2);
  return fit;
}

// Which one extra extended subject opens or strengthens most of the offers he cares about.
// Targets: his starred offers; with no stars, the offers of the options he was shown (best, most, surprise, quick start).
// Private offers he ruled out are left out. Nothing here changes the scoring or the order of the options.
export function declarationHelp(result, answers, data) {
  const ext = answers.rozszerzenia || [];
  const stars = (answers.stars || []).filter(id => data.offers.some(o => o.id === id));
  const s = result.slots;
  let basis, offers;
  if (stars.length) { basis = 'stars'; offers = stars.map(id => data.offers.find(o => o.id === id)); }
  else {
    basis = 'options';
    const cards = [...s.best, s.most, s.surprise].filter(Boolean);
    offers = [...new Map([...cards.flatMap(c => c.offers.map(x => x.offer)), ...(s.quick ? [s.quick.o.offer] : [])].map(o => [o.id, o])).values()];
  }
  offers = offers.filter(o => !(o.private && answers.privateOk === 'nie'));
  const now = offers.map(o => ({ o, fit: subjectFit(o, ext) }));
  const free = now.filter(x => x.fit === null).map(x => x.o);
  const dep = now.filter(x => x.fit !== null);
  const count = f => dep.filter(x => x.fit === f).map(x => x.o);
  const gains = (data.questions.subjects || []).filter(sub => !ext.includes(sub)).map(sub => {
    const plus = [...ext, sub], opens = [], better = [];
    for (const x of dep) {
      const f = subjectFit(x.o, plus);
      if (f > x.fit) (x.fit === 0 ? opens : better).push(x.o);
    }
    return { subject: sub, opens, better, score: 3 * opens.length + better.length };
  }).filter(g => g.score > 0).sort((a, b) => b.score - a.score || b.opens.length - a.opens.length || a.subject.localeCompare(b.subject, 'pl'));
  // A subject he already takes is "needed" for an offer when dropping it would lower the fit there.
  const keep = ext.map(sub => {
    const minus = ext.filter(x => x !== sub);
    return { subject: sub, needed: dep.filter(x => subjectFit(x.o, minus) < x.fit).map(x => x.o) };
  }).filter(k => k.needed.length).sort((a, b) => b.needed.length - a.needed.length);
  // Closed offers no single extra subject opens (for example medicine needs both biology and chemistry).
  const opened = new Set(gains.flatMap(g => g.opens.map(o => o.id)));
  const needMore = count(0).filter(o => !opened.has(o.id));
  return { basis, total: offers.length, full: count(3), part: count(2), weak: count(1), closed: count(0), free, gains: gains.slice(0, 3), keep, needMore };
}

// ---- Compare starred offers (Studia v2.4) -----------------------------------
// The 2–3 starred offers he compares: his own pick (answers.compare) while they are still starred, else his first 3 stars.
export function compareIds(answers, data) {
  const stars = (answers.stars || []).filter(id => data.offers.some(o => o.id === id));
  let ids = (answers.compare || []).filter(id => stars.includes(id));
  if (ids.length < 2) ids = [...new Set([...ids, ...stars])];
  return stars.length >= 2 ? ids.slice(0, 3) : [];
}
