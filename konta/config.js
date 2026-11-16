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
    payoutAge: 65,    // age at payout (years of saving = payoutAge - age)
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
            exit: '10% od całej kwoty po 65. roku życia', lock: '65 lat', risk: 'wysokie*',
            desc: 'Konto emerytalne z ulgą w PIT już dziś. Podatek płacisz na końcu (10%).' },
    ike:  { name: 'IKE', limit: 'limits.ike', benefit: 'Brak podatku od zysku.',
            exit: '0% po 60. roku życia (wcześniej 19% od zysku)', lock: '60 lat', risk: 'wysokie*',
            desc: 'Konto emerytalne bez podatku Belki, jeśli wypłacisz po 60. roku życia.' },
    oki:  { name: 'OKI', limit: null, benefit: 'Brak podatku Belki; do 100 000 zł bez żadnego podatku.',
            exit: 'brak (podatek płacony co roku: 0,85% od nadwyżki ponad 100 000 zł)', lock: 'brak', risk: 'wysokie*',
            desc: 'Nowe konto od 2027. Pieniądze dostępne w każdej chwili.' },
    ppk:  { name: 'PPK', limit: null, benefit: 'Pracodawca dopłaca 1,5%, państwo 250 zł + 240 zł/rok.',
            exit: '0% po 60. roku życia', lock: '60 lat', risk: 'średnie',
            desc: 'Program w pracy: 2% pensji od Ciebie, reszta od pracodawcy i państwa.' },
    ppe:  { name: 'PPE', limit: null, benefit: 'Składkę płaci pracodawca (tu 3,5% pensji).',
            exit: '0% po 60. roku życia', lock: '60 lat (wcześniej tylko transfer)', risk: 'średnie',
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
    A: { name: 'Tylko ETF World', split: { ikze: 0, ike: 0, oki: 0, edo: 0, etfWorld: 100, etfEm: 0 }, capSplit: null },
    B: { name: 'IKZE + IKE', split: { ikze: 50, ike: 50, oki: 0, edo: 0, etfWorld: 0, etfEm: 0 }, capSplit: null },
    C: { name: 'Mix', split: { ikze: 20, ike: 40, oki: 0, edo: 20, etfWorld: 0, etfEm: 20 }, capSplit: null },
  };

  const DEFAULT_ORDER = ['ikze', 'ike', 'oki', 'etfWorld'];


  // v0.3 – personas (N1), guide (N5), glossary (U17)
  const PERSONAS = {
    mlody:  { name: 'Młody', range: '20–35 lat', desc: 'Pierwsza praca, mały kapitał. Chcę zobaczyć, ile da regularne odkładanie.',
              inp: { age: 28, capital: 5000, monthly: 500, payoutAge: 65 }, mode: 'simple', open: 'przewodnik', cta: 'Zacznij od 6 prostych pytań' },
    sredni: { name: 'Średni', range: '35–55 lat', desc: 'Stałe dochody i trochę oszczędności. Chcę wykorzystać limity i ulgi podatkowe.',
              inp: { age: 45, capital: 50000, monthly: 1500, payoutAge: 65 }, mode: 'advanced', open: 'dostosuj', cta: 'Przejdź do planu i podziału' },
    senior: { name: 'Senior', range: '55+ lat', desc: 'Blisko emerytury. Chcę wiedzieć, na ile lat starczy pieniędzy i jak je wypłacać.',
              inp: { age: 60, capital: 300000, monthly: 0, payoutAge: 65 }, mode: 'simple', open: 'wyplata', cta: 'Przejdź do wypłat' },
  };
  const GUIDE = [
    { key: 'salary', q: 'Ile zarabiasz brutto miesięcznie?', choices: [5000, 7500, 10000, 15000], unit: 'zł', min: 4000, max: 50000,
      help: 'Brutto to pensja przed odjęciem podatku i składek – ta kwota jest w umowie. Na konto dostajesz mniej (netto). Od pensji brutto liczymy wpłaty do PPK i zwrot podatku z IKZE.' },
    { key: 'monthly', q: 'Ile możesz odłożyć co miesiąc?', choices: [200, 500, 1000, 2000], unit: 'zł', min: 0, max: 20000,
      help: 'Dobry początek to około 10% pensji na rękę. Nawet mała kwota, wpłacana co miesiąc przez wiele lat, rośnie do dużej sumy.' },
    { key: 'capital', q: 'Czy masz już oszczędności na inwestycje?', choices: [0, 5000, 20000, 50000], labels: { 0: 'Nie' }, unit: 'zł', min: 0, max: 5000000,
      help: 'Najpierw odłóż poduszkę bezpieczeństwa: pieniądze na 3–6 miesięcy życia, trzymane poza inwestycjami. Tutaj wpisz tylko to, co możesz zainwestować na długo.' },
    { key: 'age', q: 'Ile masz lat?', choices: [25, 30, 35, 40, 45], unit: 'lat', min: 18, max: 75, other: 'Inny wiek',
      help: 'Czas jest ważniejszy niż kwota. Zyski dopisują się co roku do kapitału i same zaczynają zarabiać – to procent składany. Zakładamy wypłatę w wieku 65 lat (zmienisz to później).' },
    { key: 'risk', q: 'Jak spokojnie chcesz spać?', options: [['calm', 'Spokojnie', 'mniej wahań, niższy możliwy zysk'], ['mid', 'Pośrodku', 'trochę wahań'], ['bold', 'Odważnie', 'duże wahania, wyższy możliwy zysk']],
      help: 'Akcje (fundusze ETF) w długim czasie zwykle zarabiają więcej, ale ich wartość potrafi spaść nawet o kilkadziesiąt procent. Obligacje skarbowe rosną wolniej, ale spokojnie.' },
    { key: 'ppk', q: 'Czy jesteś w PPK?', options: [['yes', 'Tak'], ['no', 'Nie'], ['unknown', 'Nie wiem', 'przyjmiemy, że tak']],
      help: 'PPK to program oszczędzania w pracy. Ty wpłacasz 2% pensji, pracodawca dokłada 1,5%, a państwo 240 zł rocznie. Jeśli nie składałeś rezygnacji, najpewniej jesteś zapisany.' },
  ];
  // Risk answer -> split of the free money (rest of the vehicles = 0)
  // Investing style = % of each payment in EDO bonds; the rest fills IKZE -> IKE -> OKI -> ETF (U31)
  const STYLES = {
    calm: { name: 'Spokojnie', edo: 60, desc: '60% w obligacjach skarbowych EDO, 40% w akcjach (ETF) na kontach z ulgą.' },
    mid:  { name: 'Pośrodku', edo: 30, desc: '30% w obligacjach EDO, 70% w akcjach (ETF) na kontach z ulgą.' },
    bold: { name: 'Odważnie', edo: 0, desc: 'Wszystko w akcjach (ETF): najpierw IKZE, potem IKE, OKI i zwykłe konto.' },
  };
  const GLOSSARY = [
    { re: 'Belki|Belka', t: 'Podatek Belki', d: '19% podatku od zysku z inwestycji, np. ze sprzedaży ETF-u albo od odsetek. Płacisz go tylko od zysku, nie od wpłat.' },
    { re: 'PIT', t: 'PIT', d: 'Podatek dochodowy od pensji. Tutaj zakładamy pierwszy próg: 12%.' },
    { re: 'TER', t: 'TER', d: 'Roczny koszt funduszu ETF, pobierany automatycznie z jego wartości. 0,2% to 2 zł rocznie od każdego 1 000 zł.' },
    { re: 'brutto', t: 'Brutto', d: 'Kwota przed odjęciem podatków i składek. Netto („na rękę”) to kwota po ich odjęciu.' },
    { re: 'ETF-y|ETF', t: 'ETF', d: 'Fundusz, który kupuje naraz setki lub tysiące spółek z giełdy. ETF World to akcje z całego świata.' },
    { re: '„opakowania”', t: 'Opakowanie podatkowe', d: 'IKE, IKZE i OKI to konta z ulgą podatkową, a nie inwestycje. W środku kupujesz np. ETF albo obligacje.' },
    { re: 'inflacj[aiąęe]', t: 'Inflacja', d: 'Wzrost cen. Przy inflacji 3% za 100 zł kupisz za rok tyle, co dziś za 97 zł.' },
    { re: 'rynków wschodzących', t: 'Rynki wschodzące (EM)', d: 'Kraje rozwijające się, np. Chiny, Indie, Brazylia. Większy możliwy zysk i większe wahania.' },
  ];

  // Withdrawal (N2): account names and default order (taxed accounts first, IKE last)
  const WD_NAMES = { ike: 'IKE', ikze: 'IKZE', oki: 'OKI', ppk: 'PPK', ppe: 'PPE', edo: 'Obligacje EDO', etf: 'ETF (zwykłe konto)' };
  const WD_ORDER = ['etf', 'edo', 'oki', 'ikze', 'ppk', 'ppe', 'ike'];
  const WD_STRATEGIES = {
    fixed: 'Co miesiąc ta sama kwota na rękę. Sprawdzamy, do jakiego wieku wystarczy.',
    pct: 'Co roku wypłacasz stały procent tego, co jest na kontach. Pieniądze się nie kończą, ale kwota się zmienia.',
    spend: 'Wydajesz wszystko równo do wybranego wieku. Na koniec konta są puste.',
  };
  const api = { DEFAULT_CONFIG, DEFAULT_INPUT, PRESETS, FREE_VEHICLES, VEHICLES, DEFAULT_SCENARIOS, DEFAULT_ORDER, PERSONAS, GUIDE, STYLES, GLOSSARY, WD_NAMES, WD_ORDER, WD_STRATEGIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KI_CONFIG = api;
})(this);
