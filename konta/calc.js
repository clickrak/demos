// Konta Inwestycyjne – calculation engine. Pure functions, no DOM.
// Model (simple on purpose): yearly steps, money added at the start of each year,
// growth during the year, yearly taxes (OKI) and IKZE refund at the end of the year,
// exit taxes once at the end of the horizon.
(function (root) {
  'use strict';

  const FREE = ['ikze', 'ike', 'oki', 'edo', 'etfWorld', 'etfEm'];
  const ALL = ['ikze', 'ike', 'oki', 'edo', 'etfWorld', 'etfEm', 'ppk', 'ppe'];

  function emptyAlloc() { const a = {}; FREE.forEach(k => { a[k] = 0; }); return a; }

  function newPots() {
    return {
      ike: { v: 0, b: 0 }, ikze: { v: 0, b: 0 }, ikzeRefund: { v: 0, b: 0 }, oki: { v: 0, b: 0 },
      edo: { tr: [], b: 0 }, etfWorld: { v: 0, b: 0 }, etfEm: { v: 0, b: 0 },
      ppk: { own: 0, emp: 0, st: 0, bOwn: 0, bEmp: 0, bSt: 0 },
      ppe: { v: 0, b: 0 },
    };
  }

  const edoValue = p => p.edo.tr.reduce((s, t) => s + t.v, 0);
  const ppkValue = p => p.ppk.own + p.ppk.emp + p.ppk.st;

  function potValues(p) {
    return {
      ikze: p.ikze.v + p.ikzeRefund.v, ike: p.ike.v, oki: p.oki.v, edo: edoValue(p),
      etfWorld: p.etfWorld.v, etfEm: p.etfEm.v, ppk: ppkValue(p), ppe: p.ppe.v,
    };
  }

  // Caps IKE / IKZE at their yearly limits; the rest goes to the taxable ETF World account.
  function applyLimits(a, cfg) {
    const out = Object.assign(emptyAlloc(), a);
    ['ike', 'ikze'].forEach(k => {
      const lim = cfg.limits[k];
      if (out[k] > lim) { out.etfWorld += out[k] - lim; out[k] = lim; }
    });
    return out;
  }

  // ---- Allocators: (freeMoney, pots, year, cfg) -> { vehicle: amount } ----
  function singleAllocator(veh) {
    return free => { const a = emptyAlloc(); a[veh] = free; return a; };
  }

  function byPercent(split, money) {
    const a = emptyAlloc();
    const total = FREE.reduce((s, k) => s + (Number(split[k]) || 0), 0);
    if (total <= 0) { a.etfWorld = money; return a; }
    FREE.forEach(k => { a[k] = money * (Number(split[k]) || 0) / total; });
    return a;
  }
  // Fixed % split. Optional capSplit: the starting capital (year 1) is split differently.
  // parts = { capital, yearly } is passed by simulate().
  function splitAllocator(split, capSplit) {
    return (free, pots, year, cfg, parts) => {
      if (!capSplit || !parts || !(parts.capital > 0)) return byPercent(split, free);
      const a = byPercent(split, free - parts.capital), c = byPercent(capSplit, parts.capital);
      FREE.forEach(k => { a[k] += c[k]; });
      return a;
    };
  }

  // Fills vehicles in the given order. IKE/IKZE up to the yearly limit,
  // OKI up to the tax-free amount (100 000 zł of value), others without limit.
  function waterfallAllocator(order) {
    return (free, pots, year, cfg) => {
      const a = emptyAlloc();
      let rest = free;
      for (const k of order) {
        if (rest <= 0) break;
        let room = Infinity;
        if (k === 'ike' || k === 'ikze') room = cfg.limits[k];
        if (k === 'oki') room = Math.max(0, cfg.limits.okiExempt - pots.oki.v);
        const x = Math.min(rest, room);
        a[k] += x; rest -= x;
      }
      if (rest > 0) a.etfWorld += rest;
      return a;
    };
  }

  // Investing style: a share of the money goes to EDO bonds, the rest fills the accounts in order (with limits).
  function mixAllocator(edoShare, order) {
    const wf = waterfallAllocator(order);
    return (free, pots, year, cfg, parts) => {
      const s = Math.min(1, Math.max(0, edoShare || 0));
      const a = wf(free * (1 - s), pots, year, cfg, parts);
      a.edo += free * s;
      return a;
    };
  }

  // Year 1: where the yearly saving goes and where the starting capital goes (after limits).
  function firstYearSplit(cfg, inp, allocate) {
    const yearly = 12 * inp.monthly;
    const m = applyLimits(allocate(yearly, newPots(), 1, cfg, { capital: 0, yearly }), cfg);
    const t = applyLimits(allocate(inp.capital + yearly, newPots(), 1, cfg, { capital: inp.capital, yearly }), cfg);
    const capital = emptyAlloc();
    FREE.forEach(k => { capital[k] = Math.max(0, t[k] - m[k]); });
    return { yearly: m, capital };
  }

  // ---- Main simulation ----
  // inp: { capital, monthly, salary, age, horizon, ppkOn, ppeOn }
  function simulate(cfg, inp, allocate) {
    const p = newPots();
    const H = Math.max(1, Math.round(inp.horizon));
    const r = cfg.returns;
    const gWorld = r.etfWorld - cfg.ter;
    const gEm = r.etfEm - cfg.ter;
    const years = [];
    const ownByYear = [];
    let ownPaid = 0, okiTax = 0, ikzeRefundTotal = 0;

    for (let y = 1; y <= H; y++) {
      const free = (y === 1 ? inp.capital : 0) + 12 * inp.monthly;
      const a = applyLimits(allocate(free, p, y, cfg, { capital: y === 1 ? inp.capital : 0, yearly: 12 * inp.monthly }), cfg);

      // 1. Contributions (start of year)
      ['ike', 'ikze', 'oki', 'etfWorld', 'etfEm'].forEach(k => { p[k].v += a[k]; p[k].b += a[k]; });
      if (a.edo > 0) { p.edo.tr.push({ v: a.edo, held: 0 }); p.edo.b += a.edo; }
      let own = free;
      let ppkIn = 0, ppeIn = 0;
      if (inp.ppkOn) {
        const e = cfg.ppk.employee * inp.salary * 12;
        const m = cfg.ppk.employer * inp.salary * 12;
        const s = (y === 1 ? cfg.ppk.welcome : 0) + cfg.ppk.yearly;
        p.ppk.own += e; p.ppk.emp += m; p.ppk.st += s;
        p.ppk.bOwn += e; p.ppk.bEmp += m; p.ppk.bSt += s;
        own += e + cfg.tax.pit * m; // PIT on employer part is paid by the employee
        ppkIn = e + m + s;
      }
      if (inp.ppeOn) {
        const m = cfg.ppe.employer * inp.salary * 12;
        p.ppe.v += m; p.ppe.b += m;
        own += cfg.tax.pit * m;
        ppeIn = m;
      }
      ownPaid += own;
      ownByYear.push(own);

      // 2. Growth during the year
      ['ike', 'ikze', 'ikzeRefund', 'oki', 'etfWorld'].forEach(k => { p[k].v *= 1 + gWorld; });
      p.etfEm.v *= 1 + gEm;
      p.edo.tr.forEach(t => { t.v *= 1 + (t.held === 0 ? r.edoYear1 : r.inflation + r.edoMargin); t.held++; });
      p.ppk.own *= 1 + r.ppk; p.ppk.emp *= 1 + r.ppk; p.ppk.st *= 1 + r.ppk;
      p.ppe.v *= 1 + r.ppe;

      // 3. End of year: IKZE tax refund (reinvested in taxable ETF World), OKI asset tax
      const refund = cfg.tax.pit * a.ikze;
      p.ikzeRefund.v += refund; p.ikzeRefund.b += refund; ikzeRefundTotal += refund;
      const okiBase = cfg.okiEtfQualifies ? Math.max(0, p.oki.v - cfg.limits.okiExempt) : p.oki.v;
      const t = cfg.okiTaxRate * okiBase;
      p.oki.v -= t; okiTax += t;

      const values = potValues(p);
      years.push({
        year: y, age: inp.age + y, own, ownCum: ownPaid,
        contrib: Object.assign({}, a, { ppk: ppkIn, ppe: ppeIn }),
        values, total: ALL.reduce((s, k) => s + values[k], 0),
      });
    }

    const exit = exitTaxes(cfg, p, inp.age + H, okiTax);
    return { years, ownByYear, ownPaid, okiTax, ikzeRefundTotal, endAge: inp.age + H, end: endBalances(p), ...exit };
  }

  // ---- Withdrawal phase (N2) ----
  const WD_KEYS = ['ike', 'ikze', 'oki', 'ppk', 'ppe', 'edo', 'etf'];

  // Balances at the end of a saving simulation: value v and paid-in base b per account.
  function endBalances(p) {
    return {
      ike: { v: p.ike.v, b: p.ike.b }, ikze: { v: p.ikze.v, b: p.ikze.b }, oki: { v: p.oki.v, b: p.oki.b },
      ppk: { v: ppkValue(p), b: p.ppk.bOwn + p.ppk.bEmp + p.ppk.bSt }, ppe: { v: p.ppe.v, b: p.ppe.b },
      edo: { v: edoValue(p), b: p.edo.b },
      etf: { v: p.etfWorld.v + p.etfEm.v + p.ikzeRefund.v, b: p.etfWorld.b + p.etfEm.b + p.ikzeRefund.b },
    };
  }

  // Share of a gross withdrawal that goes to tax, for an account at a given age.
  function wdTaxRate(cfg, k, acc, age) {
    const T = cfg.tax;
    const gainShare = acc.v > 0 ? Math.max(0, (acc.v - acc.b) / acc.v) : 0;
    switch (k) {
      case 'ike': return age >= T.ikeFreeAge ? 0 : T.belka * gainShare;
      case 'ikze': return age >= T.ikzeFreeAge ? T.ikzeExit : T.pit;
      case 'oki': return 0;
      case 'ppk': return age >= T.ppkFreeAge ? 0 : T.belka * gainShare;
      case 'ppe': return age >= T.ppeFreeAge ? 0 : T.belka * gainShare;
      default: return T.belka * gainShare; // edo, etf
    }
  }

  // start: { ike: {v, b}, ... }  o: { age, strategy: 'fixed'|'pct'|'spend', monthly, indexed, pct, untilAge, order, maxAge }
  // Yearly steps: withdraw at the start of the year (in the given order of accounts), then the rest grows.
  function withdraw(cfg, start, o) {
    const r = cfg.returns, gEtf = r.etfWorld - cfg.ter;
    const rate = { ike: gEtf, ikze: gEtf, oki: gEtf, etf: gEtf, edo: r.inflation + r.edoMargin, ppk: r.ppk, ppe: r.ppe };
    const acc = {};
    WD_KEYS.forEach(k => { const s = start[k] || { v: 0, b: 0 }; acc[k] = { v: Math.max(0, s.v), b: Math.max(0, Math.min(s.b, s.v)) }; });
    const order = (o.order || []).filter(k => WD_KEYS.includes(k)).concat(WD_KEYS.filter(k => !(o.order || []).includes(k)));
    const maxAge = o.maxAge || 100;
    const total = () => WD_KEYS.reduce((s, k) => s + acc[k].v, 0);
    const years = [];
    let runsOutAge = null, taxTotal = 0, netTotal = 0;

    for (let t = 0, age = o.age; age <= maxAge; t++, age++) {
      const value = total();
      if (value < 1) { if (runsOutAge === null && o.strategy === 'fixed') runsOutAge = age; break; }
      let needNet = null, needGross = null;
      if (o.strategy === 'fixed') needNet = 12 * o.monthly * (o.indexed ? Math.pow(1 + r.inflation, t) : 1);
      else if (o.strategy === 'pct') needGross = o.pct * value;
      else {
        const n = o.untilAge - age + 1;
        if (n <= 0) break;
        needGross = n === 1 ? value : value * gEtf / ((1 + gEtf) * (1 - Math.pow(1 + gEtf, -n)));
      }
      let gross = 0, tax = 0, net = 0;
      const from = {};
      for (const k of order) {
        const a = acc[k];
        if (a.v <= 0.005) continue;
        if (needNet !== null && net >= needNet - 0.005) break;
        if (needGross !== null && gross >= needGross - 0.005) break;
        const tr = wdTaxRate(cfg, k, a, age);
        const want = needNet !== null ? (needNet - net) / (1 - tr) : needGross - gross;
        const g = Math.min(a.v, want);
        a.b -= a.b * (g / a.v); a.v -= g;
        gross += g; tax += g * tr; net += g * (1 - tr); from[k] = g;
      }
      // The rest grows during the year; OKI pays its yearly asset tax.
      WD_KEYS.forEach(k => { acc[k].v *= 1 + rate[k]; });
      const okiBase = cfg.okiEtfQualifies ? Math.max(0, acc.oki.v - cfg.limits.okiExempt) : acc.oki.v;
      const okiTax = cfg.okiTaxRate * okiBase;
      acc.oki.v -= okiTax; tax += okiTax;
      taxTotal += tax; netTotal += net;
      years.push({ age, gross, tax, net, left: total(), from });
      if (needNet !== null && net < needNet * 0.99) { runsOutAge = age; break; }
    }
    return { years, runsOutAge, taxTotal, netTotal, firstMonthly: years.length ? years[0].net / 12 : 0, startTotal: WD_KEYS.reduce((s, k) => s + Math.max(0, (start[k] || { v: 0 }).v), 0) };
  }

  // Exit taxes when everything is withdrawn at endAge.
  function exitTaxes(cfg, p, endAge, okiTax) {
    const T = cfg.tax;
    const belka = gain => T.belka * Math.max(0, gain);
    const per = {};
    const notes = [];
    const row = (k, gross, tax, extra) => { per[k] = Object.assign({ gross, tax, net: gross - tax }, extra || {}); };

    // earlyPenalty: extra tax paid only because the payout is before the age limits (60 / 65).
    let earlyPenalty = 0;
    if (endAge < T.ikeFreeAge) earlyPenalty += belka(p.ike.v - p.ike.b);
    if (endAge < T.ikzeFreeAge) earlyPenalty += Math.max(0, T.pit - T.ikzeExit) * p.ikze.v;
    row('ike', p.ike.v, endAge >= T.ikeFreeAge ? 0 : belka(p.ike.v - p.ike.b));
    const ikzeTax = endAge >= T.ikzeFreeAge ? T.ikzeExit * p.ikze.v : T.pit * p.ikze.v;
    row('ikze', p.ikze.v + p.ikzeRefund.v, ikzeTax + belka(p.ikzeRefund.v - p.ikzeRefund.b));
    row('oki', p.oki.v, 0, { paidDuring: okiTax });
    const ev = edoValue(p);
    row('edo', ev, belka(ev - p.edo.b));
    row('etfWorld', p.etfWorld.v, belka(p.etfWorld.v - p.etfWorld.b));
    row('etfEm', p.etfEm.v, belka(p.etfEm.v - p.etfEm.b));

    const k = p.ppk;
    const pv = ppkValue(p);
    if (endAge >= T.ppkFreeAge) row('ppk', pv, 0);
    else {
      const keep = 1 - cfg.ppk.earlyEmployerToZus;
      const loss = k.st + cfg.ppk.earlyEmployerToZus * k.emp; // state money lost, 30% of employer part to ZUS
      const gain = (k.own + keep * k.emp) - (k.bOwn + keep * k.bEmp);
      row('ppk', pv, loss + belka(gain));
      earlyPenalty += loss + belka(gain);
    }
    row('ppe', p.ppe.v, 0, endAge < T.ppeFreeAge && p.ppe.v > 0 ? { locked: true } : {});
    if (per.ppe.locked) notes.push('PPE: przed 60. rokiem życia nie można wypłacić (tylko transfer) – wartość pokazana bez podatku.');

    const gross = ALL.reduce((s, x) => s + per[x].gross, 0);
    const tax = ALL.reduce((s, x) => s + per[x].tax, 0);
    return { per, gross, exitTax: tax, taxTotal: tax + okiTax, net: gross - tax, notes, earlyPenalty };
  }

  // Baseline: the same own money each year, invested in a normal (taxable) ETF World account.
  function baselineNet(cfg, ownByYear) {
    const g = cfg.returns.etfWorld - cfg.ter;
    let v = 0, b = 0;
    ownByYear.forEach(x => { v = (v + x) * (1 + g); b += x; });
    return v - cfg.tax.belka * Math.max(0, v - b);
  }

  // Full result for a scenario, including comparison with the baseline.
  function runScenario(cfg, inp, allocate) {
    const res = simulate(cfg, inp, allocate);
    res.baseline = baselineNet(cfg, res.ownByYear);
    res.vsBaseline = res.net - res.baseline;
    res.vsBaselinePct = res.baseline > 0 ? res.vsBaseline / res.baseline : 0;
    res.grossShown = res.net + res.taxTotal; // value before all taxes (OKI tax is paid during the years)
    return res;
  }

  // F3 / F9: each vehicle alone. Free vehicles get capital + monthly (over-limit part -> ETF World).
  // PPK / PPE are salary based, shown separately with no free money.
  function compareSingle(cfg, inp, horizon) {
    const base = Object.assign({}, inp, { horizon });
    const rows = [];
    FREE.forEach(k => {
      const r = simulate(cfg, Object.assign({}, base, { ppkOn: false, ppeOn: false }), singleAllocator(k));
      const overflow = r.years.reduce((s, y) => s + (k !== 'etfWorld' ? y.contrib.etfWorld : 0), 0);
      rows.push({ key: k, own: r.ownPaid, gross: r.net + r.taxTotal, tax: r.taxTotal, net: r.net, overflow, endAge: r.endAge, notes: r.notes });
    });
    [['ppk', { ppkOn: true, ppeOn: false }], ['ppe', { ppkOn: false, ppeOn: true }]].forEach(([k, flags]) => {
      const r = simulate(cfg, Object.assign({}, base, { capital: 0, monthly: 0 }, flags), singleAllocator('etfWorld'));
      rows.push({ key: k, own: r.ownPaid, gross: r.net + r.taxTotal, tax: r.taxTotal, net: r.net, overflow: 0, endAge: r.endAge, notes: r.notes, salaryBased: true });
    });
    rows.forEach(r => { r.multiple = r.own > 0 ? r.net / r.own : 0; });
    return rows;
  }

  // Short text: which exit rule applies at a given age.
  function exitRule(k, endAge, cfg) {
    const T = cfg.tax;
    switch (k) {
      case 'ike': return endAge >= T.ikeFreeAge ? 'bez podatku (po 60)' : 'wcześniej: 19% od zysku';
      case 'ikze': return endAge >= T.ikzeFreeAge ? '10% od całości (po 65)' : 'wcześniej: PIT 12% od całości';
      case 'ppk': return endAge >= T.ppkFreeAge ? 'bez podatku (po 60)' : 'wcześniej: tracisz dopłaty państwa, 30% od pracodawcy do ZUS, 19% od zysku';
      case 'ppe': return endAge >= T.ppeFreeAge ? 'bez podatku (po 60)' : 'wcześniej: wypłata niemożliwa (tylko transfer)';
      case 'oki': return 'bez zmian (podatek płacony co roku)';
      case 'edo': return '19% od odsetek';
      default: return '19% od zysku';
    }
  }

  const realFactor = (cfg, years) => 1 / Math.pow(1 + cfg.returns.inflation, years);

  const api = {
    FREE, ALL, applyLimits, singleAllocator, splitAllocator, waterfallAllocator, mixAllocator, firstYearSplit, WD_KEYS, withdraw, wdTaxRate,
    simulate, baselineNet, runScenario, compareSingle, exitRule, realFactor,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KI_CALC = api;
})(this);
