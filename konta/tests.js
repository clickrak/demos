// Tests for calc.js. Run in browser (tests.html) or in Node: `node tests.js`.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./config.js') : root.KI_CONFIG;
  const K = isNode ? require('./calc.js') : root.KI_CALC;

  const results = [];
  const clone = o => JSON.parse(JSON.stringify(o));
  const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
  function test(name, fn) {
    try { fn(); results.push({ name, ok: true }); }
    catch (e) { results.push({ name, ok: false, msg: e.message }); }
  }
  function eq(actual, expected, label, tol) {
    if (!near(actual, expected, tol)) throw new Error(`${label}: got ${actual.toFixed(2)}, expected ${expected.toFixed(2)}`);
  }

  const cfg = clone(C.DEFAULT_CONFIG);
  const inp = (o) => Object.assign({ capital: 0, monthly: 0, salary: 10000, age: 40, horizon: 1, ppkOn: false, ppeOn: false }, o);
  const g = cfg.returns.etfWorld - cfg.ter; // 6.8%

  test('ETF World: 10 000 zł for 1 year, 19% tax on gain', () => {
    const r = K.simulate(cfg, inp({ capital: 10000 }), K.singleAllocator('etfWorld'));
    eq(r.gross, 10680, 'gross'); eq(r.net, 10000 + 680 * 0.81, 'net');
  });

  test('ETF World: 12 000 zł/year for 25 years = annuity formula', () => {
    const r = K.simulate(cfg, inp({ monthly: 1000, horizon: 25 }), K.singleAllocator('etfWorld'));
    const fv = 12000 * ((Math.pow(1 + g, 25) - 1) / g) * (1 + g);
    eq(r.gross, fv, 'gross'); eq(r.net, fv - 0.19 * (fv - 300000), 'net');
  });

  test('IKE: no tax at 65, 19% on gain at 50', () => {
    const r65 = K.simulate(cfg, inp({ monthly: 1000, horizon: 25 }), K.singleAllocator('ike'));
    eq(r65.exitTax, 0, 'tax at 65');
    const r50 = K.simulate(cfg, inp({ monthly: 1000, horizon: 10 }), K.singleAllocator('ike'));
    eq(r50.exitTax, 0.19 * (r50.gross - 120000), 'tax at 50');
  });

  test('IKE: over-limit money goes to ETF World', () => {
    const r = K.simulate(cfg, inp({ capital: 40000 }), K.singleAllocator('ike'));
    eq(r.years[0].contrib.ike, 30099, 'ike'); eq(r.years[0].contrib.etfWorld, 9901, 'etf');
  });

  test('IKZE: 12% refund each year, 10% tax at 65', () => {
    const r = K.simulate(cfg, inp({ monthly: 1000, horizon: 25 }), K.singleAllocator('ikze'));
    eq(r.ikzeRefundTotal, 12000 * 0.12 * 25, 'refund total');
    const main = 12000 * ((Math.pow(1 + g, 25) - 1) / g) * (1 + g);
    // refund of year y is added at end of year y and grows (25 - y) years
    let refund = 0; for (let y = 1; y <= 25; y++) refund += 1440 * Math.pow(1 + g, 25 - y);
    eq(r.gross, main + refund, 'gross');
    eq(r.exitTax, 0.10 * main + 0.19 * (refund - 36000), 'exit tax');
  });

  test('OKI: 0,85% only on value above 100 000 zł', () => {
    const c = clone(cfg); c.returns.etfWorld = 0; c.ter = 0;
    const r = K.simulate(c, inp({ capital: 200000 }), K.singleAllocator('oki'));
    eq(r.okiTax, 850, 'oki tax'); eq(r.net, 199150, 'net');
  });

  test('OKI: whole value taxed if ETF does not qualify', () => {
    const c = clone(cfg); c.returns.etfWorld = 0; c.ter = 0; c.okiEtfQualifies = false;
    const r = K.simulate(c, inp({ capital: 200000 }), K.singleAllocator('oki'));
    eq(r.okiTax, 1700, 'oki tax');
  });

  test('PPK: yearly amounts at 10 000 zł gross', () => {
    const r = K.simulate(cfg, inp({ ppkOn: true }), K.singleAllocator('etfWorld'));
    eq(r.years[0].contrib.ppk, 2400 + 1800 + 250 + 240, 'in'); eq(r.ownPaid, 2400 + 0.12 * 1800, 'own');
    eq(r.per.ppk.gross, 4690 * 1.055, 'gross');
    const r65 = K.simulate(cfg, inp({ ppkOn: true, horizon: 25 }), K.singleAllocator('etfWorld'));
    eq(r65.per.ppk.tax, 0, 'no tax at 65');
  });

  test('PPK: early withdrawal loses state money and 30% of employer part', () => {
    const r = K.simulate(cfg, inp({ ppkOn: true }), K.singleAllocator('etfWorld'));
    const f = 1.055, loss = 490 * f + 0.3 * 1800 * f, gain = (2400 * f + 0.7 * 1800 * f) - (2400 + 0.7 * 1800);
    eq(r.per.ppk.tax, loss + 0.19 * gain, 'early tax+loss');
  });

  test('EDO: 5,35% in year 1, then inflation + 2%', () => {
    const r = K.simulate(cfg, inp({ capital: 10000, horizon: 2 }), K.singleAllocator('edo'));
    eq(r.gross, 10000 * 1.0535 * 1.05, 'gross');
  });

  test('Waterfall: IKZE -> IKE -> OKI (up to 100k) -> ETF', () => {
    const r = K.simulate(cfg, inp({ capital: 200000 }), K.waterfallAllocator(['ikze', 'ike', 'oki', 'etfWorld']));
    const a = r.years[0].contrib;
    eq(a.ikze, 12039.6, 'ikze'); eq(a.ike, 30099, 'ike'); eq(a.oki, 100000, 'oki'); eq(a.etfWorld, 200000 - 142138.6, 'etf');
  });

  test('Baseline: 100% ETF World without PPK = baseline (gain 0)', () => {
    const r = K.runScenario(cfg, inp({ capital: 20000, monthly: 1000, horizon: 25 }), K.splitAllocator({ etfWorld: 100 }));
    eq(r.vsBaseline, 0, 'vs baseline');
  });

  test('Split: percentages are normalised', () => {
    const a = K.splitAllocator({ ike: 1, etfWorld: 3 })(1000);
    eq(a.ike, 250, 'ike'); eq(a.etfWorld, 750, 'etf');
  });

  test('Early penalty: 0 at 65, IKZE 2 pp. of the pot at 63', () => {
    const at65 = K.simulate(cfg, inp({ monthly: 500, age: 40, horizon: 25 }), K.singleAllocator('ikze'));
    eq(at65.earlyPenalty, 0, 'penalty at 65');
    const at63 = K.simulate(cfg, inp({ monthly: 500, age: 40, horizon: 23 }), K.singleAllocator('ikze'));
    const pot = 6000 * ((Math.pow(1 + g, 23) - 1) / g) * (1 + g);
    eq(at63.earlyPenalty, 0.02 * pot, 'penalty at 63');
  });

  test('Style: 0% bonds = waterfall; 60% bonds puts 60% of each year in EDO', () => {
    const i = inp({ capital: 20000, monthly: 1500, horizon: 10 }), order = ['ikze', 'ike', 'oki', 'etfWorld'];
    const w = K.simulate(cfg, i, K.waterfallAllocator(order)), m0 = K.simulate(cfg, i, K.mixAllocator(0, order));
    eq(m0.net, w.net, 'same as waterfall');
    const m6 = K.simulate(cfg, i, K.mixAllocator(0.6, order));
    eq(m6.years[1].contrib.edo, 0.6 * 18000, 'edo year 2'); eq(m6.years[1].contrib.ikze, 0.4 * 18000, 'ikze year 2');
  });

  test('Capital split: capital goes by capSplit, monthly by split', () => {
    const r = K.simulate(cfg, inp({ capital: 10000, monthly: 1000 }), K.splitAllocator({ ike: 100 }, { edo: 100 }));
    eq(r.years[0].contrib.ike, 12000, 'ike'); eq(r.years[0].contrib.edo, 10000, 'edo');
  });

  test('First-year split: Auto puts monthly in IKZE first, capital in IKE', () => {
    const s = K.firstYearSplit(cfg, inp({ capital: 20000, monthly: 1500 }), K.waterfallAllocator(['ikze', 'ike', 'oki', 'etfWorld']));
    eq(s.yearly.ikze, 12039.6, 'ikze'); eq(s.yearly.ike, 18000 - 12039.6, 'ike monthly'); eq(s.capital.ike, 20000, 'ike capital');
  });

  test('Withdraw: 0% return, IKE only, 1 000 zł/month lasts exactly 10 years', () => {
    const c0 = clone(cfg); Object.assign(c0.returns, { etfWorld: 0, inflation: 0 }); c0.ter = 0;
    const r = K.withdraw(c0, { ike: { v: 120000, b: 100000 } }, { age: 65, strategy: 'fixed', monthly: 1000, indexed: false, order: ['ike'] });
    eq(r.years.length, 10, 'years'); eq(r.taxTotal, 0, 'no tax after 60'); eq(r.runsOutAge, 75, 'runs out at 75');
  });

  test('Withdraw: IKZE after 65 pays 10% of each payout; ETF pays 19% of the gain part', () => {
    const c0 = clone(cfg); Object.assign(c0.returns, { etfWorld: 0, inflation: 0 }); c0.ter = 0;
    const r = K.withdraw(c0, { ikze: { v: 100000, b: 100000 } }, { age: 66, strategy: 'pct', pct: 0.1, order: ['ikze'], maxAge: 66 });
    eq(r.years[0].gross, 10000, 'gross'); eq(r.years[0].tax, 1000, 'ikze tax');
    const e = K.withdraw(c0, { etf: { v: 100000, b: 50000 } }, { age: 66, strategy: 'pct', pct: 0.1, order: ['etf'], maxAge: 66 });
    eq(e.years[0].tax, 10000 * 0.5 * 0.19, 'etf tax on gain share');
  });

  test('Withdraw: "spend until age" empties the accounts at that age', () => {
    const r = K.withdraw(cfg, { etf: { v: 500000, b: 300000 } }, { age: 65, strategy: 'spend', untilAge: 85, order: ['etf'] });
    eq(r.years.length, 21, 'years 65..85'); eq(r.years[20].left, 0, 'empty at 85', 1);
  });

  test('Saving result exposes account balances for the withdrawal', () => {
    const r = K.simulate(cfg, inp({ capital: 10000, horizon: 1 }), K.singleAllocator('ike'));
    eq(r.end.ike.v, 10680, 'ike value'); eq(r.end.ike.b, 10000, 'ike base');
  });

  const failed = results.filter(r => !r.ok);
  if (isNode) {
    results.forEach(r => console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name}${r.ok ? '' : ' -> ' + r.msg}`));
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    process.exitCode = failed.length ? 1 : 0;
  } else {
    root.KI_TEST_RESULTS = results;
  }
})(this);
