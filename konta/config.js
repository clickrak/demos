// Konta Inwestycyjne – default assumptions (2027 rules). All values are editable in the UI.
// Percent values are stored as fractions (0.07 = 7%).
(function (root) {
  'use strict';

  const DEFAULT_CONFIG = {
    limits: { ike: 30099, ikze: 12039.6, okiExempt: 100000 },
    okiTaxRate: 0.0085,
    okiEtfQualifies: true, // TO VERIFY: do foreign UCITS ETFs count as "qualified assets" in OKI?
    tax: { pit: 0.12, belka: 0.19, ikzeExit: 0.10, ikeFreeAge: 60, ikzeFreeAge: 65, ppkFreeAge: 60, ppeFreeAge: 60 },
    ppk: { employee: 0.02, employer: 0.015, welcome: 250, yearly: 240, earlyEmployerToZus: 0.30 },
    ppe: { employer: 0.035 },
    returns: { etfWorld: 0.07, etfEm: 0.08, ppk: 0.055, ppe: 0.055, inflation: 0.03, edoYear1: 0.0535, edoMargin: 0.02 },
    ter: 0.002,
  };

  const DEFAULT_INPUT = {
    capital: 20000,   // zł available today
    monthly: 1000,    // zł per month
    salary: 10000,    // gross zł per month (≈ average wage 2027)
    age: 40,
    horizon: 25,
    ppkOn: true,
    ppeOn: false,
  };

  const PRESETS = {
    pessimistic: { label: 'Pesymistyczny', etfWorld: 0.04, etfEm: 0.03, ppk: 0.035, ppe: 0.035, inflation: 0.04 },
    base:        { label: 'Bazowy',        etfWorld: 0.07, etfEm: 0.08, ppk: 0.055, ppe: 0.055, inflation: 0.03 },
    optimistic:  { label: 'Optymistyczny', etfWorld: 0.09, etfEm: 0.10, ppk: 0.07,  ppe: 0.07,  inflation: 0.025 },
  };

  // Vehicles funded from "free money" (capital + monthly contribution).
  const FREE_VEHICLES = ['ikze', 'ike', 'oki', 'edo', 'etfWorld', 'etfEm'];

  const VEHICLES = {
    ikze: { name: 'IKZE', limit: 'limits.ikze', benefit: 'Wpłatę odliczasz od dochodu – co roku wraca 12% wpłaty (PIT).',
            exit: '10% od całej kwoty po 65 r.ż.', lock: '65 lat', risk: 'wysokie*',
            desc: 'Konto emerytalne z ulgą w PIT już dziś. Podatek płacisz na końcu (10%).' },
    ike:  { name: 'IKE', limit: 'limits.ike', benefit: 'Brak podatku od zysku.',
            exit: '0% po 60 r.ż. (wcześniej 19% od zysku)', lock: '60 lat', risk: 'wysokie*',
            desc: 'Konto emerytalne bez podatku Belki, jeśli wypłacisz po 60. roku życia.' },
    oki:  { name: 'OKI', limit: null, benefit: 'Brak podatku Belki; do 100 000 zł bez żadnego podatku.',
            exit: 'brak (podatek płacony co roku: 0,85% od nadwyżki ponad 100 000 zł)', lock: 'brak', risk: 'wysokie*',
            desc: 'Nowe konto od 2027. Pieniądze dostępne w każdej chwili.' },
    ppk:  { name: 'PPK', limit: null, benefit: 'Pracodawca dopłaca 1,5%, państwo 250 zł + 240 zł/rok.',
            exit: '0% po 60 r.ż.', lock: '60 lat', risk: 'średnie',
            desc: 'Program w pracy: 2% pensji od Ciebie, reszta od pracodawcy i państwa.' },
    ppe:  { name: 'PPE', limit: null, benefit: 'Składkę płaci pracodawca (tu 3,5% pensji).',
            exit: '0% po 60 r.ż.', lock: '60 lat (wcześniej tylko transfer)', risk: 'średnie',
            desc: 'Program emerytalny pracodawcy – tylko jeśli firma go oferuje.' },
    edo:  { name: 'Obligacje EDO', limit: null, benefit: 'Ochrona przed inflacją: inflacja + 2%.',
            exit: '19% od odsetek', lock: '10 lat (wcześniej z opłatą)', risk: 'niskie',
            desc: '10-letnie obligacje skarbowe. 5,35% w 1. roku, potem inflacja + 2%.' },
    etfWorld: { name: 'ETF World (XTB)', limit: null, benefit: 'Brak. Prowizja 0%, niski koszt (TER 0,2%).',
            exit: '19% od zysku', lock: 'brak', risk: 'wysokie',
            desc: 'Fundusz indeksowy na akcje z całego świata, na zwykłym koncie.' },
    etfEm: { name: 'ETF EM (XTB)', limit: null, benefit: 'Brak. Prowizja 0%, niski koszt (TER 0,2%).',
            exit: '19% od zysku', lock: 'brak', risk: 'bardzo wysokie',
            desc: 'Fundusz na akcje z rynków wschodzących. Większe wahania.' },
  };

  const DEFAULT_SCENARIOS = {
    A: { name: 'Tylko ETF World', split: { ikze: 0, ike: 0, oki: 0, edo: 0, etfWorld: 100, etfEm: 0 } },
    B: { name: 'IKZE + IKE', split: { ikze: 50, ike: 50, oki: 0, edo: 0, etfWorld: 0, etfEm: 0 } },
    C: { name: 'Mix', split: { ikze: 20, ike: 40, oki: 0, edo: 20, etfWorld: 0, etfEm: 20 } },
  };

  const DEFAULT_ORDER = ['ikze', 'ike', 'oki', 'etfWorld'];

  const api = { DEFAULT_CONFIG, DEFAULT_INPUT, PRESETS, FREE_VEHICLES, VEHICLES, DEFAULT_SCENARIOS, DEFAULT_ORDER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KI_CONFIG = api;
})(this);
