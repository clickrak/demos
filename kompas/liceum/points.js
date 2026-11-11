// Kompas Liceum: recruitment points and the class check. Pure functions, no DOM; used by app.js and tests/liceum.mjs.
// Rules as published for Kraków/Małopolska: 200 points = exam (100) + certificate (100).
// Exam: Polish and maths 0.35 × %, foreign language 0.30 × %. Certificate: four graded subjects (Polish, maths and two the class
// counts) at 18/17/14/8/2 points, special achievements up to 18, distinction 7, volunteering 3.
import { computeProfile, fitCard, band, pathsTo, reasonsFor, makeSlots } from '../core/scoring.js';

export const GRADE_PTS = { 6: 18, 5: 17, 4: 14, 3: 8, 2: 2 };
export const SUBJECT_NAME = { polski: 'język polski', matematyka: 'matematyka', angielski: 'język angielski', fizyka: 'fizyka', informatyka: 'informatyka',
  biologia: 'biologia', chemia: 'chemia', geografia: 'geografia', historia: 'historia', wos: 'wiedza o społeczeństwie' };

const pct = v => Math.max(0, Math.min(100, Number(v) || 0));

// What the kid told us, as numbers. Soft mode ("słabo / dobrze / świetnie") maps to a typical grade and exam percentage;
// exact mode uses the marks he typed. Subjects he skipped in soft mode count as "dobrze" and are listed as assumed.
export function effectivePoints(answers, config) {
  const p = answers.points || {}, soft = p.soft || {};
  const hasExact = Object.keys(p.exam || {}).length || Object.keys(p.grades || {}).length;
  const useSoft = p.mode === 'soft' || (p.mode !== 'exact' && !hasExact && (soft.exam || soft.grades));
  if (!useSoft) return { ...p, approx: false, assumed: [] };
  const map = (config && config.soft) || { slabo: { grade: 3, exam: 45 }, dobrze: { grade: 4, exam: 70 }, swietnie: { grade: 5, exam: 90 } };
  const exam = {}, grades = {}, assumed = [];
  for (const k of ['polski', 'matematyka', 'obcy']) { const l = (soft.exam || {})[k]; if (l && map[l]) exam[k] = map[l].exam; }
  const gs = soft.grades || {};
  for (const s of Object.keys(SUBJECT_NAME)) {
    const l = gs[s];
    if (l && map[l]) grades[s] = map[l].grade; else { grades[s] = map.dobrze.grade; if (!['polski', 'matematyka', 'angielski'].includes(s)) assumed.push(s); }
  }
  return { exam, grades, stripe: !!p.stripe, volunteering: !!p.volunteering, achievements: p.achievements || 0, approx: true, assumed };
}

export const CHANCE_TXT = { realna: 'realna szansa', zawalczenia: 'do zawalczenia', ambitna: 'ambitna', unknown: 'wpisz, jak ci idzie' };

export function examPoints(exam = {}) {
  const parts = { polski: 0.35 * pct(exam.polski), matematyka: 0.35 * pct(exam.matematyka), obcy: 0.3 * pct(exam.obcy) };
  const entered = ['polski', 'matematyka', 'obcy'].every(k => exam[k] !== undefined && exam[k] !== '' && exam[k] !== null);
  return { parts, total: parts.polski + parts.matematyka + parts.obcy, entered };
}

// Subjects a class counts on the certificate. Sourced when the school publishes them; otherwise an approximation, flagged.
export function scoredSubjects(cls) {
  if (cls.scored) return { list: cls.scored, sourced: true };
  const ext = (cls.extended || []).map(e => ({ 'język polski': 'polski', 'matematyka komputerowa': 'matematyka' }[e] || e));
  const extra = ext.filter(e => SUBJECT_NAME[e] && e !== 'matematyka' && e !== 'polski');
  const base = ['polski', 'matematyka'];
  const fill = cls.occupation ? ['angielski', 'informatyka'] : ['angielski'];
  return { list: [...new Set([...base, ...extra, ...fill])].slice(0, 4), sourced: false };
}

export function certificatePoints(p = {}, cls) {
  const sc = scoredSubjects(cls), g = p.grades || {};
  const missing = sc.list.filter(s => !GRADE_PTS[g[s]]);
  const subj = sc.list.reduce((t, s) => t + (GRADE_PTS[g[s]] || 0), 0);
  const extras = (p.stripe ? 7 : 0) + (p.volunteering ? 3 : 0) + Math.max(0, Math.min(18, Number(p.achievements) || 0));
  return { subj, extras, total: subj + extras, missing, scored: sc };
}

// Points of the candidate in one class and how they sit against last year's threshold.
export function checkClass(p, cls, school, config) {
  const ex = examPoints(p && p.exam), ce = certificatePoints(p, cls);
  const complete = ex.entered && ce.missing.length === 0;
  const points = ex.total + ce.total;
  const cm = (config && config.chanceMargin) || 8;
  let level = 'unknown', margin = null, basis = null, chance = 'unknown';
  if (complete) {
    if (cls.threshold != null) {
      margin = points - cls.threshold; basis = 'class';
      level = margin >= 6 ? 'over' : margin >= 0 ? 'near' : margin >= -6 ? 'close' : 'under';
      chance = margin >= cm ? 'realna' : margin >= -cm ? 'zawalczenia' : 'ambitna';
    } else if (school.range) {
      basis = 'school';
      level = points >= school.range.max ? 'over' : points >= school.range.min ? 'range' : 'under';
      chance = points >= school.range.max ? 'realna' : points >= school.range.min ? 'zawalczenia' : 'ambitna';
    }
  }
  return { points, exam: ex, cert: ce, complete, level, margin, basis, chance, missing: ce.missing, entered: ex.entered, approx: !!(p && p.approx) };
}

export const LEVEL_TXT = {
  over: 'powyżej zeszłorocznego progu', near: 'blisko progu, ale nad nim', close: 'tuż pod progiem', under: 'poniżej progu',
  range: 'w zakresie szkoły, próg klasy do sprawdzenia', unknown: 'wpisz punkty, żeby zobaczyć'
};

// Worlds (v1.7): the kid first picks the worlds that attract him. Only those question cards are shown, plus a common
// core. No pick (or "show me a bit of everything") shows the core and two cards from each world. Old answer files
// without the field see every card, as before.
export function visibleActivities(answers, data) {
  const all = data.questions.activities, w = answers.worlds;
  if (!Array.isArray(w)) return all;
  const core = all.filter(a => !a.worlds);
  if (!w.length || w.includes('all')) {
    const seen = {};
    return all.filter(a => !a.worlds || a.worlds.some(x => (seen[x] = (seen[x] || 0) + 1) <= 2));
  }
  return all.filter(a => !a.worlds || a.worlds.some(x => w.includes(x)));
}
export function worldBonus(card, answers, config) {
  const w = answers.worlds;
  if (!Array.isArray(w) || !w.length || w.includes('all')) return 0;
  return (card.worlds || []).some(x => w.includes(x)) ? (config.worldBoost ?? 8) : 0;
}

export function scoreLiceum(answers, data) {
  const pts = effectivePoints(answers, data.config);
  const dataV = { ...data, questions: { ...data.questions, activities: visibleActivities(answers, data) } };
  const profile = computeProfile(answers, dataV);
  const cards = data.opportunities.map(card => {
    const f = fitCard(profile, card, answers, dataV);
    const wb = worldBonus(card, answers, data.config);
    if (wb) { f.fit = Math.min(100, f.fit + wb); f.parts = { ...f.parts, world: wb }; }
    const paths = pathsTo(card, profile, answers, dataV);
    const classes = [];
    for (const school of data.schools) for (const cls of school.classes) {
      const rank = cls.cards.indexOf(card.id);
      if (rank < 0) continue;
      classes.push({ school, cls, rank, check: checkClass(pts, cls, school, data.config) });
    }
    classes.sort((a, b) => (a.rank - b.rank) || ((a.cls.threshold == null) - (b.cls.threshold == null)) || ((b.cls.threshold ?? b.school.range.max) - (a.cls.threshold ?? a.school.range.max)));
    return { card, ...f, band: band(f.fit, data.config), paths, strengthsUsed: paths.filter(x => x.kind === 'strength'), reasons: reasonsFor(card, profile, answers, dataV), classes, offers: [], reachable: true, robust: 0 };
  });
  cards.sort((a, b) => (Math.abs(a.fit - b.fit) >= 1 ? b.fit - a.fit : (b.paths.length - a.paths.length) || (b.fit - a.fit)));
  return { profile, cards, slots: makeSlots(cards, profile, answers, dataV), points: pts };
}

// A short list to apply with: the classes of his best area, from a stretch to a safe one.
// When nothing is within reach yet, the three closest classes, marked as "do nadrobienia".
export function shortlist(result) {
  const top = result.slots.best[0];
  if (!top) return [];
  const withPts = top.classes.filter(c => c.check.complete && c.cls.threshold != null);
  if (!withPts.length) return [];
  const sorted = [...withPts].sort((a, b) => (b.cls.threshold - a.cls.threshold));
  const pick = [];
  const stretch = sorted.find(c => c.check.margin < 0 && c.check.margin >= -8);
  const likely = sorted.find(c => c.check.margin >= 0 && c.check.margin < 6);
  const safe = [...sorted].reverse().find(c => c.check.margin >= 6);
  for (const [role, c] of [['ambitna', stretch], ['realna', likely], ['bezpieczna', safe]]) if (c && !pick.some(x => x.c === c)) pick.push({ role, c });
  if (!pick.length) {
    const closest = [...withPts].sort((a, b) => b.check.margin - a.check.margin).slice(0, 3);
    return closest.map(c => ({ role: 'ambitna', c }));
  }
  return pick;
}

// Plain ways to add points, from the published rules: what one step up is worth.
export function levers(p = {}, cls) {
  const out = [];
  const sc = scoredSubjects(cls).list, g = p.grades || {};
  for (const s of sc) {
    const cur = g[s];
    if (cur && cur < 6) out.push({ text: `ocena z przedmiotu „${SUBJECT_NAME[s]}” o stopień wyżej (${cur} → ${cur + 1}) to ${GRADE_PTS[cur + 1] - GRADE_PTS[cur]} pkt`, pts: GRADE_PTS[cur + 1] - GRADE_PTS[cur] });
  }
  out.sort((a, b) => b.pts - a.pts);
  out.push({ text: 'każde 10 punktów procentowych więcej z matematyki albo polskiego na egzaminie to 3,5 pkt, z języka obcego 3 pkt', pts: 3.5 });
  if (!p.stripe) out.push({ text: 'świadectwo z wyróżnieniem (czerwony pasek) to 7 pkt', pts: 7 });
  if (!p.volunteering) out.push({ text: 'wolontariat wpisany na świadectwie to 3 pkt', pts: 3 });
  return out.slice(0, 4);
}

// ---- the compass (v1.8) -------------------------------------------------------------------------------------------
// Eight high-level profiles group the 14 directions. The best profile points North, the next two are the close
// alternatives (NNE, NNW), and the least fitting one sits in the South. Only the order matters, not exact numbers.
export const COMPASS = [
  { pos: 'N', deg: 0, label: 'północ: najlepiej pasuje' }, { pos: 'NNE', deg: 22.5, label: 'bliska alternatywa' }, { pos: 'NNW', deg: -22.5, label: 'bliska alternatywa' },
  { pos: 'NE', deg: 50, label: 'też warto zajrzeć' }, { pos: 'NW', deg: -50, label: 'też warto zajrzeć' }, { pos: 'E', deg: 95, label: 'dalej od ciebie' },
  { pos: 'W', deg: -95, label: 'dalej od ciebie' }, { pos: 'S', deg: 180, label: 'najmniej pasuje teraz' }
];
export function profilesFor(result, data) {
  const byId = Object.fromEntries(result.cards.map(c => [c.card.id, c]));
  const list = data.profiles.map(p => {
    const areas = p.areas.map(id => byId[id]).filter(Boolean).sort((a, b) => b.fit - a.fit);
    const fit = areas.length ? 0.8 * areas[0].fit + 0.2 * areas.reduce((s, a) => s + a.fit, 0) / areas.length : 0;
    const seen = new Map();
    for (const a of areas) for (const x of a.classes) {
      const k = x.school.id + '|' + x.cls.code, prev = seen.get(k);
      if (!prev || x.rank < prev.rank) seen.set(k, { ...x, area: a.card.id });
    }
    return { profile: p, fit, areas, classes: [...seen.values()] };
  }).sort((a, b) => b.fit - a.fit);
  list.forEach((x, i) => { x.compass = COMPASS[Math.min(i, COMPASS.length - 1)]; });
  return list;
}
