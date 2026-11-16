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

  function splitAllocator(split) {
    const total = FREE.reduce((s, k) => s + (Number(split[k]) || 0), 0);
    return free => {
      const a = emptyAlloc();
      if (total <= 0) { a.etfWorld = free; return a; }
      FREE.forEach(k => { a[k] = free * (Number(split[k]) || 0) / total; });
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
      const a = applyLimits(allocate(free, p, y, cfg), cfg);

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
    return { years, ownByYear, ownPaid, okiTax, ikzeRefundTotal, endAge: inp.age + H, ...exit };
  }

  // Exit taxes when everything is withdrawn at endAge.
  function exitTaxes(cfg, p, endAge, okiTax) {
    const T = cfg.tax;
    const belka = gain => T.belka * Math.max(0, gain);
    const per = {};
    const notes = [];
    const row = (k, gross, tax, extra) => { per[k] = Object.assign({ gross, tax, net: gross - tax }, extra || {}); };

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
    }
    row('ppe', p.ppe.v, 0, endAge < T.ppeFreeAge && p.ppe.v > 0 ? { locked: true } : {});
    if (per.ppe.locked) notes.push('PPE: przed 60 r.ż. nie można wypłacić (tylko transfer) – wartość pokazana bez podatku.');

    const gross = ALL.reduce((s, x) => s + per[x].gross, 0);
    const tax = ALL.reduce((s, x) => s + per[x].tax, 0);
    return { per, gross, exitTax: tax, taxTotal: tax + okiTax, net: gross - tax, notes };
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
    FREE, ALL, applyLimits, singleAllocator, splitAllocator, waterfallAllocator,
    simulate, baselineNet, runScenario, compareSingle, exitRule, realFactor,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KI_CALC = api;
})(this);
