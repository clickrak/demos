// Kompas core: profile, fit, reasons, requirement checks and slots.
// Pure functions, no DOM: used by the apps and by tests/run.mjs in Node.

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
    { id: 'zajecia', label: 'co lubisz robić', ok: Object.keys(answers.sort || {}).length >= Math.ceil(acts * 0.6) },
    { id: 'sytuacje', label: 'sytuacje', ok: Object.keys(answers.situations || {}).length >= Math.min(3, (data.questions.situations || []).length) },
    { id: 'styl', label: 'styl pracy', ok: Object.values(answers.sliders || {}).some(v => v !== 0) },
    { id: 'wartosci', label: 'wartości', ok: (answers.values || []).length >= 3 },
    { id: 'mocne', label: 'mocne strony z przykładem', ok: provenStrengths(answers).length >= 3 },
    { id: 'matura', label: 'przedmioty rozszerzone', ok: (answers.rozszerzenia || []).length > 0 }
  ];
  const missing = blocks.filter(b => !b.ok);
  const level = missing.length === 0 ? 'wysoka' : missing.length <= 2 ? 'średnia' : 'niska';
  return { level, missing: missing.map(b => b.label) };
}

const LEVEL = { brak: 0, podstawy: 1, komunikatywny: 2, 'bardzo dobry': 3 };
export const LANG_NAMES = { en: 'angielski', de: 'niemiecki', uk: 'ukraiński', fr: 'francuski' };
// Languages at a working level (komunikatywny or better) that this card can use.
export function workingLanguages(card, answers) {
  return (card.languages || []).filter(l => (LEVEL[(answers.jezyki || {})[l]] || 0) >= 2);
}

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
  for (const l of workingLanguages(card, answers)) paths.push({ kind: 'language', id: 'lang-' + l, label: 'język: ' + LANG_NAMES[l] });
  const cardTop = Object.keys(card.interests).sort((a, b) => card.interests[b] - card.interests[a]).slice(0, 2);
  for (const d of profile.top.slice(0, 2)) {
    if (cardTop.includes(d)) {
      const dim = data.dimensions.interests.find(x => x.id === d);
      paths.push({ kind: 'dimension', id: d, label: 'zainteresowanie: ' + dim.name.toLowerCase() });
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
    .map(x => `bo zaznaczyłeś: „${x.a.text.replace(/\.$/, '')}”`);
  const sitPick = (data.questions.situations || [])
    .map(q => q.answers.find(a => a.id === (answers.situations || {})[q.id]))
    .filter(Boolean)
    .map(a => ({ a, s: Object.entries(a.w).reduce((t, [d, w]) => t + w * cc[d], 0) }))
    .filter(x => x.s > 0).sort((x, y) => y.s - x.s)[0];
  if (sitPick && liked.length < 2) liked.push(`bo w sytuacji wybrałeś: „${sitPick.a.text.replace(/\.$/, '')}”`);
  const v = (answers.values || []).find(id => card.values.includes(id));
  if (v) liked.push(`bo ważne jest dla ciebie: ${data.dimensions.values.find(x => x.id === v).name}`);
  const l = workingLanguages(card, answers)[0];
  if (l) liked.push(`bo mówisz po ${{ en: 'angielsku', de: 'niemiecku', uk: 'ukraińsku', fr: 'francusku' }[l]}`);
  return liked.slice(0, 3);
}

// Requirement check of one offer against his extended subjects and preferred study length.
export function checkOffer(offer, answers, config) {
  const ext = answers.rozszerzenia || [];
  const r = offer.requires || {};
  const out = { ok: [], blocked: [], flags: [], fix: null };
  if (r.noMatura) out.ok.push('matura niewymagana');
  for (const s of r.extended || []) {
    if (ext.includes(s)) out.ok.push(`masz rozszerzenie: ${s}`);
    else out.blocked.push(`wymaga rozszerzonej: ${s}, której nie zdajesz`);
  }
  if (r.must) {
    for (const s of r.must) if (ext.includes(s)) out.ok.push(`masz rozszerzenie: ${s}`);
  }
  if (r.countFrom) {
    const hit = r.countFrom.filter(s => ext.includes(s));
    if (hit.length) out.ok.push(`z listy masz rozszerzenie: ${hit.join(', ')}`);
    else out.flags.push('żaden z twoich przedmiotów rozszerzonych nie jest na liście; sprawdź, jak uczelnia liczy poziom podstawowy');
  }
  if (out.blocked.length) {
    out.fix = `Możesz dopisać rozszerzenie w deklaracji do ${config.declarationDeadline} albo zdać je jako absolwent w maju 2028 (matura dla absolwentów jest dostępna przez 5 lat).`;
  }
  const len = answers.studyLength;
  if (len === 'krotko' && offer.durationYears > config.quickStartMaxYears) out.flags.push('dłuższa droga, niż chcesz teraz');
  if (len === 'srednio' && offer.durationYears > 5) out.flags.push('trochę dłużej niż 5 lat');
  if (offer.private) {
    if (answers.privateOk === 'nie') { out.hidden = true; out.flags.push('uczelnia prywatna, płatna: wybrałeś tylko publiczne'); }
    else out.flags.push('uczelnia prywatna: studia są płatne');
  }
  if (offer.status !== 'sourced') out.flags.push('dane do sprawdzenia na stronie rekrutacji 2027');
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
      robust: Object.values(card.robustness).reduce((s, v) => s + (ROBUST[v] || 0), 0)
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
    .flatMap(c => c.offers.filter(o => o.offer.durationYears <= data.config.quickStartMaxYears && o.check.reachable).map(o => ({ c, o })))
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
    steps.push('maj 2027: matura (szkoła policealna jej nie wymaga, ale zostawia otwarte studia)');
    steps.push('lipiec–sierpień 2027: zapis do szkoły policealnej');
    steps.push('wrzesień 2027: start nauki' + (campusName ? `, ${campusName}` : ''));
    const end = 2027 + Math.ceil(offer.durationYears);
    steps.push(`ok. ${end}: dyplom technika i pierwsza praca`);
    if (offer.next) steps.push(`potem: ${offer.next}`);
  } else {
    steps.push('do 7 lutego 2027: sprawdź deklarację maturalną pod ten kierunek');
    steps.push('marzec–kwiecień 2027: dzień otwarty: ' + offer.institution);
    steps.push('maj 2027: matura; lipiec 2027: rekrutacja');
    steps.push('październik 2027: start studiów');
    const end = 2027 + Math.ceil(offer.durationYears);
    steps.push(`ok. ${end}: dyplom i pierwsza praca` + (offer.next ? ` (albo: ${offer.next})` : ''));
  }
  return steps.slice(0, 5);
}
