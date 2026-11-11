// Kompas Liceum: recruitment points and the class check. Pure functions, no DOM; used by app.js and tests/liceum.mjs.
// Rules as published for Kraków/Małopolska: 200 points = exam (100) + certificate (100).
// Exam: Polish and maths 0.35 × %, foreign language 0.30 × %. Certificate: four graded subjects (Polish, maths and two the class
// counts) at 18/17/14/8/2 points, special achievements up to 18, distinction 7, volunteering 3.
import { computeProfile, fitCard, band, pathsTo, reasonsFor, makeSlots } from '../core/scoring.js';

export const GRADE_PTS = { 6: 18, 5: 17, 4: 14, 3: 8, 2: 2 };
export const SUBJECT_NAME = { polski: 'język polski', matematyka: 'matematyka', angielski: 'język angielski', fizyka: 'fizyka', informatyka: 'informatyka',
  biologia: 'biologia', chemia: 'chemia', geografia: 'geografia', historia: 'historia' };

const pct = v => Math.max(0, Math.min(100, Number(v) || 0));

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
export function checkClass(p, cls, school) {
  const ex = examPoints(p && p.exam), ce = certificatePoints(p, cls);
  const complete = ex.entered && ce.missing.length === 0;
  const points = ex.total + ce.total;
  let level = 'unknown', margin = null, basis = null;
  if (complete) {
    if (cls.threshold != null) {
      margin = points - cls.threshold; basis = 'class';
      level = margin >= 6 ? 'over' : margin >= 0 ? 'near' : margin >= -6 ? 'close' : 'under';
    } else if (school.range) {
      basis = 'school';
      level = points >= school.range.max ? 'over' : points >= school.range.min ? 'range' : 'under';
    }
  }
  return { points, exam: ex, cert: ce, complete, level, margin, basis, missing: ce.missing, entered: ex.entered };
}

export const LEVEL_TXT = {
  over: 'powyżej zeszłorocznego progu', near: 'blisko progu, ale nad nim', close: 'tuż pod progiem', under: 'poniżej progu',
  range: 'w zakresie szkoły, próg klasy do sprawdzenia', unknown: 'wpisz punkty, żeby zobaczyć'
};

export function scoreLiceum(answers, data) {
  const profile = computeProfile(answers, data);
  const cards = data.opportunities.map(card => {
    const f = fitCard(profile, card, answers, data);
    const paths = pathsTo(card, profile, answers, data);
    const classes = [];
    for (const school of data.schools) for (const cls of school.classes) {
      const rank = cls.cards.indexOf(card.id);
      if (rank < 0) continue;
      classes.push({ school, cls, rank, check: checkClass(answers.points, cls, school) });
    }
    classes.sort((a, b) => (a.rank - b.rank) || ((a.cls.threshold == null) - (b.cls.threshold == null)) || ((b.cls.threshold ?? b.school.range.max) - (a.cls.threshold ?? a.school.range.max)));
    return { card, ...f, band: band(f.fit, data.config), paths, strengthsUsed: paths.filter(x => x.kind === 'strength'), reasons: reasonsFor(card, profile, answers, data), classes, offers: [], reachable: true, robust: 0 };
  });
  cards.sort((a, b) => (Math.abs(a.fit - b.fit) >= 1 ? b.fit - a.fit : (b.paths.length - a.paths.length) || (b.fit - a.fit)));
  return { profile, cards, slots: makeSlots(cards, profile, answers, data) };
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
    return closest.map(c => ({ role: 'do nadrobienia', c }));
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
