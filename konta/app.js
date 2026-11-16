// Konta Inwestycyjne – UI. Depends on KI_CONFIG (config.js), KI_CALC (calc.js), Chart (vendor).
(function () {
  'use strict';
  const C = window.KI_CONFIG, K = window.KI_CALC;
  const STORE_KEY = 'ki-state-v1';
  const SLOTS = ['A', 'B', 'C'];
  const COLORS = { auto: '#0f6e56', A: '#2563eb', B: '#b45309', C: '#9333ea', own: '#667085', base: '#667085' };
  const DASH = { auto: [], A: [8, 4], B: [2, 3], C: [10, 3, 2, 3] };

  const $ = id => document.getElementById(id);
  const clone = o => JSON.parse(JSON.stringify(o));
  const nf = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0, useGrouping: 'always' });
  const num = x => nf.format(Math.round(x)).replace(/ /g, ' ');
  const zl = x => num(x) + ' zł';
  // Numbers in fields: shown as "20 000" / "12 039,6"; spaces and comma accepted when typing.
  const fmt = v => Number(v).toLocaleString('pl-PL', { maximumFractionDigits: 4, useGrouping: 'always' }).replace(/\u00a0/g, ' ');
  const parseNum = s => { const t = String(s).replace(/[\s\u00a0]/g, '').replace(',', '.'); return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN; };
  const pct = (x, d = 1) => (x * 100).toLocaleString('pl-PL', { maximumFractionDigits: d }) + '%';
  const vname = k => C.VEHICLES[k].name;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const strip = s => String(s).replace(/<[^>]*>/g, '');
  const getPath = (o, p) => p.split('.').reduce((x, k) => x[k], o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };

  // ---------- State (localStorage + URL) ----------
  function defaults() {
    return {
      inp: clone(C.DEFAULT_INPUT), cfg: clone(C.DEFAULT_CONFIG), scenarios: clone(C.DEFAULT_SCENARIOS),
      order: clone(C.DEFAULT_ORDER), realTerms: false, preset: 'base', earlyN: 10, editSlot: 'A', yearScen: 'auto',
      mainScen: 'auto', showAll: false, persona: '', touched: false, mode: 'simple', style: 'bold',
      wd: { source: 'plan', own: { ike: 0, ikze: 0, oki: 0, ppk: 0, ppe: 0, edo: 0, etf: 0 }, gainPct: 30, startAge: 65,
        strategy: 'fixed', monthly: 4000, indexed: true, pct: 4, untilAge: 90, order: clone(C.WD_ORDER) },
      guide: { step: 0, ans: { salary: -1, monthly: -1, capital: -1, age: -1, risk: '', ppk: '' } },
    };
  }
  function merge(base, over) {
    if (!over || typeof over !== 'object') return base;
    Object.keys(base).forEach(k => {
      if (!(k in over)) return;
      const b = base[k], o = over[k];
      if (Array.isArray(b)) { if (Array.isArray(o)) base[k] = o; }
      else if (b && typeof b === 'object') base[k] = merge(b, o);
      else if (typeof o === typeof b) base[k] = o;
    });
    return base;
  }
  const encode = s => btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  const decode = t => JSON.parse(decodeURIComponent(escape(atob(t))));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function normalize(saved) {
    // v0.1 stored "years of saving"; v0.2+ stores the payout age.
    if (saved && saved.inp && typeof saved.inp.horizon === 'number' && typeof saved.inp.payoutAge !== 'number') {
      saved.inp.payoutAge = (Number(saved.inp.age) || C.DEFAULT_INPUT.age) + saved.inp.horizon;
    }
    const s = merge(defaults(), saved);
    s.order = s.order.filter(k => C.FREE_VEHICLES.includes(k));
    if (!s.order.length) s.order = clone(C.DEFAULT_ORDER);
    s.inp.capital = clamp(s.inp.capital, 0, LIM.capital); s.inp.monthly = clamp(s.inp.monthly, 0, LIM.monthly);
    s.inp.salary = clamp(s.inp.salary, 4000, LIM.salary); s.inp.age = clamp(s.inp.age, 18, 75);
    s.inp.payoutAge = clamp(s.inp.payoutAge, s.inp.age + 1, 90);
    if (!['auto', 'A', 'B', 'C'].includes(s.mainScen)) s.mainScen = 'auto';
    if (!C.PERSONAS[s.persona]) s.persona = '';
    if (!['simple', 'advanced'].includes(s.mode)) s.mode = 'simple';
    if (!C.STYLES[s.style]) s.style = 'bold';
    if (s.mode === 'simple') s.mainScen = 'auto';
    if (!['plan', 'own'].includes(s.wd.source)) s.wd.source = 'plan';
    if (!C.WD_STRATEGIES[s.wd.strategy]) s.wd.strategy = 'fixed';
    s.wd.order = s.wd.order.filter(k => C.WD_ORDER.includes(k)).concat(C.WD_ORDER.filter(k => !s.wd.order.includes(k)));
    return s;
  }
  const readOwn = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } };
  const cleanUrl = () => { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ } };
  // A link (?s=) shows a shared plan. It never overwrites the user's own saved plan without asking (U21).
  let shared = false, firstVisit = false;
  function load() {
    const own = readOwn();
    let link = null;
    try { const q = new URLSearchParams(location.search).get('s'); if (q) link = decode(q); } catch (e) { link = null; }
    firstVisit = !own && !link;
    const sOwn = normalize(own);
    if (!link) return sOwn;
    const sLink = normalize(link);
    if (own && JSON.stringify(sLink) === JSON.stringify(sOwn)) { cleanUrl(); return sOwn; } // old self-written link
    shared = true;
    return sLink;
  }
  function save() {
    if (shared) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ }
  }
  // Only values that differ from the defaults go into a shared link.
  const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
  function diff(x, d) {
    const out = {};
    Object.keys(x).forEach(k => {
      if (JSON.stringify(x[k]) === JSON.stringify(d[k])) return;
      out[k] = isObj(x[k]) && isObj(d[k]) ? diff(x[k], d[k]) : x[k];
    });
    return out;
  }
  const shareUrl = () => location.origin + location.pathname + '?s=' + encodeURIComponent(encode(diff(S, defaults()))) + '#plan';

  const LIM = { capital: 5000000, monthly: 20000, salary: 50000 };
  let S = load();
  let wdChart = null, lastWd = null;
  let chart = null, barChart = null, lastScen = null, cardVisible = true, view = 'plan', liveTimer = null;
  const fields = {};

  // Input for calc.js: years of saving come from the payout age.
  const years = () => Math.max(1, S.inp.payoutAge - S.inp.age);
  const calcInp = () => Object.assign({}, S.inp, { horizon: years() });
  const realF = y => (S.realTerms ? K.realFactor(S.cfg, y) : 1);

  // ---------- Field with validation (number + optional slider) ----------
  // opts: { min, max (number or function), step, unit, range: false, sliderMax }
  function field(label, get, opts, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const id = 'f' + Math.random().toString(36).slice(2, 8);
    const lim = () => ({ min: typeof opts.min === 'function' ? opts.min() : opts.min, max: typeof opts.max === 'function' ? opts.max() : opts.max });
    const l = lim(), v0 = get();
    wrap.innerHTML = `<label for="${id}">${esc(label)}</label><div class="pair">` +
      `<input type="text" id="${id}" inputmode="decimal" autocomplete="off" value="${fmt(v0)}" aria-describedby="${id}e">` +
      (opts.unit ? `<span class="muted">${opts.unit}</span>` : '') + '</div>' +
      (opts.hint ? `<p class="hint">${opts.hint}</p>` : '') +
      (opts.range === false ? '' : `<input type="range" min="${l.min}" max="${opts.sliderMax || l.max}" step="${opts.step}" value="${v0}" aria-label="${esc(label)} – suwak">`) +
      `<p class="err" id="${id}e" hidden></p>`;
    const numEl = wrap.querySelector('input[type=text]'), rng = wrap.querySelector('input[type=range]'), err = wrap.querySelector('.err');
    const clear = () => { numEl.removeAttribute('aria-invalid'); err.hidden = true; };
    const show = v => { numEl.value = fmt(v); if (rng) rng.value = v; clear(); };
    numEl.addEventListener('input', () => {
      const v = parseNum(numEl.value), { min, max } = lim();
      if (isNaN(v) || v < min || v > max) {
        numEl.setAttribute('aria-invalid', 'true');
        err.textContent = `Wpisz wartość od ${num(min)} do ${num(max)}${opts.unit ? ' ' + opts.unit : ''}.`;
        err.hidden = false;
        return; // wrong values never reach the calculation
      }
      clear(); if (rng) rng.value = v; onChange(v);
    });
    numEl.addEventListener('blur', () => {
      const { min, max } = lim();
      let v = parseNum(numEl.value);
      if (isNaN(v)) v = get();
      v = clamp(v, min, max);
      const changed = v !== get();
      show(v); if (changed) onChange(v);
    });
    if (rng) rng.addEventListener('input', () => { const v = parseFloat(rng.value); numEl.value = fmt(v); clear(); onChange(v); });
    wrap.setValue = show;
    wrap.syncLimits = () => { if (rng) rng.min = lim().min; };
    return wrap;
  }
  function table(el, head, rows, opts = {}) {
    const nums = opts.num || [];
    const th = head.map((h, i) => `<th scope="col" class="${nums.includes(i) ? 'num' : ''}">${h}</th>`).join('');
    const tr = rows.map(r => `<tr class="${r.cls || ''}">` + r.cells.map((c, i) => {
      const cls = [nums.includes(i) ? 'num' : '', i === 0 ? 'title' : '', i === opts.key ? 'key' : ''].join(' ').trim();
      return `<td class="${cls}" data-label="${esc(strip(head[i]))}">${c}</td>`;
    }).join('') + '</tr>').join('');
    el.innerHTML = (opts.caption ? `<caption class="sr">${esc(opts.caption)}</caption>` : '') + `<thead><tr>${th}</tr></thead><tbody>${tr}</tbody>`;
  }
  const signed = x => `<span class="${x >= 0 ? 'pos' : 'neg'}">${x >= 0 ? '+' : '−'}${zl(Math.abs(x))}</span>`;

  // ---------- Views (hash routing) ----------
  const VIEWS = ['start', 'przewodnik', 'plan', 'produkty', 'wyplata', 'zalozenia'];
  const ALIAS = { dane: 'plan', wynik: 'plan', dostosuj: 'plan', auto: 'plan', scenariusze: 'plan', wyniki: 'plan',
    porownanie: 'produkty', osobno: 'produkty', wczesniej: 'produkty', podzial: 'plan' };
  function route() {
    const h = location.hash.slice(1) || (firstVisit ? 'start' : 'plan');
    view = VIEWS.includes(h) ? h : (ALIAS[h] || 'plan');
    document.querySelectorAll('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
    document.querySelectorAll('[data-tab]').forEach(a => {
      if (a.dataset.tab === (view === 'przewodnik' ? 'start' : view)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const target = ALIAS[h] ? $(h) : null;
    if (target) {
      if (target.closest('details')) target.closest('details').open = true;
      target.scrollIntoView();
      if (h === 'wynik') target.focus({ preventScroll: true });
    } else window.scrollTo(0, 0);
    if (view === 'plan') { if (chart) chart.resize(); if (barChart) barChart.resize(); }
    if (view === 'przewodnik') renderGuide();
    if (view === 'wyplata' && wdChart) wdChart.resize();
    updateBar();
  }

  // ---------- Inputs ----------
  function renderInputs() {
    const box = $('inputs'); box.innerHTML = '';
    const add = (k, label, o, after) => {
      fields[k] = field(label, () => S.inp[k], o, v => { S.inp[k] = v; S.touched = true; if (after) after(v); update(); });
      box.appendChild(fields[k]);
    };
    add('capital', 'Kapitał na start', { min: 0, max: LIM.capital, sliderMax: 500000, step: 1000, unit: 'zł', hint: 'Jednorazowo, w 1. roku.' });
    add('monthly', 'Odkładasz miesięcznie', { min: 0, max: LIM.monthly, sliderMax: 10000, step: 100, unit: 'zł', hint: 'Twoje pieniądze, poza PPK.' });
    add('age', 'Twój wiek', { min: 18, max: 75, step: 1, unit: 'lat' }, v => {
      if (S.inp.payoutAge <= v) { S.inp.payoutAge = v + 1; fields.payoutAge.setValue(v + 1); }
      fields.payoutAge.syncLimits();
    });
    add('payoutAge', 'Wypłata w wieku', { min: () => S.inp.age + 1, max: 90, step: 1, unit: 'lat', hint: 'Bez podatku: IKE od 60 lat; IKZE z podatkiem 10% od 65 lat.' });
    add('salary', 'Pensja brutto (miesięcznie)', { min: 4000, max: LIM.salary, sliderMax: 40000, step: 100, unit: 'zł', hint: 'Od niej liczymy PPK i zwrot podatku z IKZE.' });
    $('ppkOn').checked = S.inp.ppkOn; $('ppeOn').checked = S.inp.ppeOn; $('realTerms').checked = S.realTerms; $('showAll').checked = S.showAll;
  }

  // ---------- Market presets ----------
  function renderPresets() {
    document.querySelectorAll('[data-preset]').forEach(b => {
      b.classList.toggle('active', b.dataset.preset === S.preset);
      b.setAttribute('aria-pressed', b.dataset.preset === S.preset);
    });
    const r = S.cfg.returns;
    $('presetInfo').textContent = `Zakładamy rocznie: ETF World ${pct(r.etfWorld)}, ETF EM ${pct(r.etfEm)}, PPK ${pct(r.ppk)}, inflacja ${pct(r.inflation)}` +
      (S.preset === 'custom' ? ' (własne).' : '.');
  }
  const withPreset = key => { const c = clone(S.cfg); Object.assign(c.returns, C.PRESETS[key], { edoYear1: c.returns.edoYear1, edoMargin: c.returns.edoMargin }); delete c.returns.label; return c; };
  function applyPreset(key) {
    const p = C.PRESETS[key];
    const snap = S.preset === 'custom' ? clone(S) : null;
    ['etfWorld', 'etfEm', 'ppk', 'ppe', 'inflation'].forEach(k => { S.cfg.returns[k] = p[k]; });
    S.preset = key;
    renderSettings(); update();
    if (snap) toast('Zmieniono Twoje własne stopy zwrotu.', snap);
  }

  // ---------- Scenarios ----------
  const allocFor = k => (k === 'auto' ? K.mixAllocator(C.STYLES[S.style].edo / 100, S.order)
    : K.splitAllocator(S.scenarios[k].split, S.scenarios[k].capSplit));
  function computeScenarios() {
    const inp = calcInp();
    const out = { auto: { label: 'Auto-podział', res: K.runScenario(S.cfg, inp, allocFor('auto')) } };
    SLOTS.forEach(s => { out[s] = { label: `${s}: ${S.scenarios[s].name}`, res: K.runScenario(S.cfg, inp, allocFor(s)) }; });
    return out;
  }
  function renderScenSelects(scen) {
    const fill = (el, val) => { el.innerHTML = Object.keys(scen).map(k => `<option value="${k}" ${k === val ? 'selected' : ''}>${esc(scen[k].label)}</option>`).join(''); };
    fill($('mainScen'), S.mainScen); fill($('barScen'), S.mainScen); fill($('yearScen'), S.yearScen);
  }
  // Money that comes from the employer and the state (PPK, PPE), nominal.
  function employerMoney(onlyPpk, forcePpk) {
    const H = years(), c = S.cfg, sal = S.inp.salary * 12;
    let x = 0;
    if (S.inp.ppkOn || forcePpk) x += H * (c.ppk.employer * sal + c.ppk.yearly) + c.ppk.welcome;
    if (S.inp.ppeOn && !onlyPpk) x += H * c.ppe.employer * sal;
    return x;
  }
  const isEmpty = () => S.inp.capital === 0 && S.inp.monthly === 0;

  // ---------- Result card, sticky bar, tips ----------
  function renderResult(scen) {
    const r = scen[S.mainScen].res, f = realF(years()), T = S.cfg.tax;
    const when = `W wieku ${r.endAge} lat` + (S.realTerms ? ' (w dzisiejszych złotówkach)' : '');
    $('resultBody').innerHTML = `<p class="eyebrow">${when}</p><p class="big">${zl(r.net * f)} <span>na rękę</span></p>`;
    const pocket = S.inp.capital + 12 * S.inp.monthly * years();
    let more = `<dl class="trio"><div><dt>Z Twojej kieszeni</dt><dd>${zl(pocket)}</dd></div>` +
      (r.ownPaid - pocket > 1 ? `<div><dt>Z pensji (PPK)</dt><dd>${zl(r.ownPaid - pocket)}</dd></div>` : '') +
      `<div><dt>Od pracodawcy i państwa</dt><dd>${zl(employerMoney())}</dd></div>` +
      `<div><dt>Zysk vs zwykłe konto ETF</dt><dd>${signed(r.vsBaseline * f)}</dd></div></dl>`;
    if (isEmpty()) more += '<div class="warn" role="note">Wpisz kapitał na start lub wpłatę miesięczną. Teraz wynik pokazuje tylko pieniądze z pensji (PPK, PPE).</div>';
    if (r.earlyPenalty > 1) {
      const to = Math.max(T.ikzeFreeAge, S.inp.age + 1);
      more += `<div class="warn" role="note"><b>Wypłata w wieku ${r.endAge} lat jest za wczesna na pełne ulgi.</b> ` +
        `IKE i PPK: bez podatku od ${T.ikeFreeAge} lat, IKZE: 10% od ${T.ikzeFreeAge} lat. Kosztuje to ok. <b>${zl(r.earlyPenalty * f)}</b> więcej podatku.` +
        `<button class="primary" data-act="payout" data-age="${to}">Ustaw ${to} lat</button></div>`;
    }
    const rt = S.cfg.returns;
    more += `<p class="muted">Zakładamy: ETF World ${pct(rt.etfWorld)} rocznie, inflacja ${pct(rt.inflation)}. <a href="#zalozenia">Zmień założenia</a>. ` +
      '<a class="go" href="#wyplata">Ile to miesięcznie i na ile lat? →</a><br>' +
      'To uproszczony szacunek, nie porada inwestycyjna.</p>';
    $('resultMore').innerHTML = more;
    $('barText').innerHTML = `<b>${zl(r.net * f)}</b> na rękę · ${r.endAge} lat`;
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { $('live').textContent = `${when}: ${zl(r.net * f)} na rękę.`; }, 600);
  }
  function updateBar() { $('bar').hidden = !(view === 'produkty' || (view === 'plan' && !cardVisible)); }

  function renderTips(scen) {
    const k = S.mainScen, r = scen[k].res, f = realF(years()), tips = [];
    if (!S.inp.ppkOn) tips.push([`W PPK dostajesz ok. <b>${zl(employerMoney(true, true))}</b> od pracodawcy i państwa przez ${years()} lat.`, 'ppk', 'Włącz PPK']);
    const better = scen.auto.res.net - r.net;
    if (k !== 'auto' && better > r.net * 0.01) tips.push([`Auto-podział daje <b>${signed(better * f)}</b> więcej niż ten scenariusz.`, 'auto', 'Pokaż Auto-podział']);
    else if (!isEmpty()) {
      const y1 = r.years[0].contrib, L = S.cfg.limits;
      const taxed = y1.etfWorld + y1.etfEm, room = Math.max(0, L.ikze - y1.ikze) + Math.max(0, L.ike - y1.ike);
      if (S.mode === 'advanced' && taxed > 1 && room > 1) tips.push([`W 1. roku <b>${zl(Math.min(taxed, room))}</b> trafia na konto z podatkiem, choć masz wolny limit IKZE lub IKE.`, 'adjust', 'Dostosuj podział']);
    }
    $('tips').innerHTML = tips.slice(0, 3).map(t => `<div class="tip"><span>${t[0]}</span><button data-act="${t[1]}">${t[2]}</button></div>`).join('');
  }

  // ---------- Mode, PPK group, investing style (U27, U30, U31) ----------
  function renderMode() {
    document.body.classList.toggle('simple', S.mode === 'simple');
    document.querySelectorAll('[data-mode]').forEach(b => { b.classList.toggle('active', b.dataset.mode === S.mode); b.setAttribute('aria-pressed', b.dataset.mode === S.mode); });
    $('modeInfo').textContent = S.mode === 'simple' ? 'Jeden plan i najważniejsze liczby.'
      : 'Dodatkowo: scenariusze A, B, C, kolejność kont, osobny podział kapitału, tabela rok po roku.';
  }
  function renderSalaryInfo() {
    const c = S.cfg, sal = S.inp.salary;
    const me = c.ppk.employee * sal, er = c.ppk.employer * sal;
    $('ppkInfo').innerHTML = S.inp.ppkOn
      ? `Co miesiąc z pensji: Ty ${pct(c.ppk.employee)} = <b>${zl(me)}</b>, pracodawca ${pct(c.ppk.employer)} = <b>${zl(er)}</b>, państwo <b>${zl(c.ppk.yearly)}</b> rocznie (+${zl(c.ppk.welcome)} na start). ` +
        `<b>To dodatkowo</b> – nie z kwoty, którą odkładasz. Od części pracodawcy płacisz PIT (ok. ${zl(c.tax.pit * er)} miesięcznie).`
      : `Wyłączone. W PPK pracodawca i państwo dokładają ok. ${zl(er + c.ppk.yearly / 12)} miesięcznie.`;
    const pe = c.ppe.employer * sal;
    $('ppeInfo').innerHTML = S.inp.ppeOn
      ? `Pracodawca wpłaca ${pct(c.ppe.employer)} pensji = <b>${zl(pe)}</b> miesięcznie, dodatkowo. Ty płacisz od tego tylko PIT (ok. ${zl(c.tax.pit * pe)}).`
      : 'Tylko jeśli Twoja firma ma pracowniczy program emerytalny.';
  }
  function renderStyle() {
    document.querySelectorAll('[data-style]').forEach(b => { b.classList.toggle('active', b.dataset.style === S.style); b.setAttribute('aria-pressed', b.dataset.style === S.style); });
    $('styleInfo').textContent = C.STYLES[S.style].desc + (S.mode === 'advanced' ? ' Dotyczy Auto-podziału.' : '');
  }

  // ---------- Where the money goes (U28) ----------
  const VCOL = { ikze: '#0f6e56', ike: '#2563eb', oki: '#7c3aed', edo: '#b45309', etfWorld: '#475569', etfEm: '#be185d',
    ppkOwn: '#0e7490', ppkEmp: '#0891b2', ppkState: '#155e75', ppe: '#4d7c0f' };
  function flowBlock(title, groups) {
    const items = [].concat(...groups.map(g => g.items)), total = items.reduce((s, x) => s + x[1], 0) || 1;
    return `<p class="flowtitle">${title}</p><div class="fbar" aria-hidden="true">` +
      items.map(x => `<span style="flex:${x[1].toFixed(2)};background:${x[2]}" title="${esc(x[0])}"></span>`).join('') + '</div><ul class="flowlist">' +
      groups.map(g => (g.name ? `<li class="grp">${g.name}${g.note ? ` <small>${g.note}</small>` : ''}</li>` : '') +
        g.items.map(x => `<li><i style="background:${x[2]}"></i><span>${esc(x[0])}</span><b>${zl(x[1])}</b><em>${Math.round(100 * x[1] / total)}%</em></li>`).join('')).join('') + '</ul>';
  }
  function renderFlow(scen) {
    const k = S.mainScen, c = S.cfg, sal = S.inp.salary, L = c.limits;
    const sp = K.firstYearSplit(c, calcInp(), allocFor(k));
    $('flowScen').textContent = (S.mode === 'advanced' ? `${scen[k].label}. ` : '') + 'Podział w 1. roku. Procent liczymy od całej kwoty w danym bloku.';
    const own = C.FREE_VEHICLES.filter(v => sp.yearly[v] > 0.5).map(v => [vname(v), sp.yearly[v] / 12, VCOL[v]]);
    const fromSal = [];
    if (S.inp.ppkOn) fromSal.push([`PPK – Ty (${pct(c.ppk.employee)} pensji)`, c.ppk.employee * sal, VCOL.ppkOwn],
      [`PPK – pracodawca (${pct(c.ppk.employer)})`, c.ppk.employer * sal, VCOL.ppkEmp], [`PPK – państwo (${zl(c.ppk.yearly)} rocznie)`, c.ppk.yearly / 12, VCOL.ppkState]);
    if (S.inp.ppeOn) fromSal.push([`PPE – pracodawca (${pct(c.ppe.employer)})`, c.ppe.employer * sal, VCOL.ppe]);
    const groups = [];
    if (own.length) groups.push({ name: `Twoja wpłata: ${zl(S.inp.monthly)}`, items: own });
    if (fromSal.length) groups.push({ name: 'Z pensji, dodatkowo', note: '– nie z kwoty, którą odkładasz', items: fromSal });
    const total = [].concat(...groups.map(g => g.items)).reduce((s, x) => s + x[1], 0);
    let html = groups.length ? flowBlock(`Co miesiąc razem: ${zl(total)}`, groups) : '<p>Brak wpłat miesięcznych.</p>';
    if (S.inp.capital > 0) {
      const cap = C.FREE_VEHICLES.filter(v => sp.capital[v] > 0.5).map(v => [vname(v), sp.capital[v], VCOL[v]]);
      html += flowBlock(`Kapitał na start: ${zl(S.inp.capital)} (jednorazowo)`, [{ items: cap }]);
    }
    const notes = [];
    ['ikze', 'ike'].forEach(v => { if (sp.yearly[v] + sp.capital[v] >= L[v] - 1) notes.push(`${vname(v)}: roczny limit ${zl(L[v])} (ok. ${zl(L[v] / 12)} miesięcznie) jest wykorzystany – reszta idzie dalej.`); });
    const ikze = sp.yearly.ikze + sp.capital.ikze;
    if (ikze > 0.5) notes.push(`Zwrot PIT z IKZE: ok. ${zl(c.tax.pit * ikze)} rocznie (doliczamy go na zwykłe konto ETF).`);
    if (k === 'auto' && sp.capital.ike + sp.capital.ikze > 0.5 && S.inp.monthly > 0) notes.push('Kapitał na start najpierw wypełnia wolny limit IKZE i IKE w 1. roku.');
    $('flow').innerHTML = html + notes.map(n => `<p class="hint">${n}</p>`).join('');
  }

  // ---------- Charts ----------
  const endLabels = {
    id: 'endLabels',
    afterDatasetsDraw(ch) {
      const { ctx, chartArea } = ch; const meta = ch.getDatasetMeta(0);
      ctx.save(); ctx.font = '600 13px system-ui, sans-serif'; ctx.textBaseline = 'middle';
      meta.data.forEach((bar, i) => {
        const txt = zl(ch.data.datasets[0].data[i]), w = ctx.measureText(txt).width;
        const inside = bar.x + w + 8 > chartArea.right;
        ctx.fillStyle = inside ? '#fff' : '#1d2433'; ctx.textAlign = inside ? 'right' : 'left';
        ctx.fillText(txt, inside ? bar.x - 6 : bar.x + 6, bar.y);
      });
      ctx.restore();
    },
  };
  function renderBars(scen) {
    if (typeof Chart === 'undefined') return;
    const f = realF(years()), keys = Object.keys(scen);
    const labels = keys.map(k => scen[k].label).concat('Zwykłe konto ETF');
    const data = keys.map(k => Math.round(scen[k].res.net * f)).concat(Math.round(scen.auto.res.baseline * f));
    const colors = keys.map(k => COLORS[k]).concat(COLORS.base);
    if (barChart) { barChart.data.labels = labels; barChart.data.datasets[0].data = data; barChart.update('none'); return; }
    barChart = new Chart($('barChart'), {
      type: 'bar', data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4 }] }, plugins: [endLabels],
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => zl(c.parsed.x) } } },
        scales: { x: { beginAtZero: true, ticks: { callback: v => num(v / 1000) + ' tys.', maxTicksLimit: 6 } }, y: { ticks: { font: { size: 13 } } } },
      },
    });
  }
  function renderChart(scen) {
    if (typeof Chart === 'undefined') { document.querySelectorAll('.chartbox').forEach(b => { b.innerHTML = '<p>Nie udało się wczytać wykresu.</p>'; }); return; }
    const H = years(), ys = scen.auto.res.years;
    const labels = ys.map(y => y.age + ' l.').concat('netto');
    const f = y => (S.realTerms ? K.realFactor(S.cfg, y) : 1);
    const keys = S.showAll ? Object.keys(scen) : [S.mainScen];
    const datasets = keys.map(k => ({
      label: scen[k].label, data: scen[k].res.years.map(y => Math.round(y.total * f(y.year))).concat(Math.round(scen[k].res.net * f(H))),
      borderColor: COLORS[k], backgroundColor: COLORS[k], borderDash: DASH[k], borderWidth: 2.5, tension: 0.15,
      pointRadius: c => (c.dataIndex === labels.length - 1 ? 5 : 0),
    }));
    datasets.push({ label: 'Wpłacone (Twoje pieniądze)', data: ys.map(y => Math.round(y.ownCum)).concat(Math.round(ys[H - 1].ownCum)),
      borderColor: COLORS.own, backgroundColor: COLORS.own, borderDash: [4, 4], borderWidth: 2, pointRadius: 0 });
    if (chart) { chart.data.labels = labels; chart.data.datasets = datasets; chart.update('none'); return; }
    chart = new Chart($('chart'), {
      type: 'line', data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
        plugins: { tooltip: { callbacks: { label: c => `${c.dataset.label}: ${zl(c.parsed.y)}` } },
          legend: { position: 'top', align: 'start', labels: { usePointStyle: true, pointStyle: 'line', boxWidth: 34, font: { size: 13 } } } },
        scales: { y: { ticks: { callback: v => num(v / 1000) + ' tys.' } }, x: { ticks: { maxTicksLimit: 8, maxRotation: 0 } } },
      },
    });
  }

  // ---------- Summary and yearly table ----------
  function ownCell(own) {
    const pocket = S.inp.capital + 12 * S.inp.monthly * years();
    return own - pocket > 1 ? `<span>${zl(pocket)}<br><span class="muted">+ z pensji ${zl(own - pocket)}</span></span>` : zl(own);
  }
  function renderSummary(scen) {
    const f = realF(years()), keys = Object.keys(scen);
    const nets = keys.map(k => scen[k].res.net).sort((a, b) => b - a);
    const best = nets[0] - nets[1] > 1 ? keys.find(k => scen[k].res.net === nets[0]) : null; // no mark when equal
    const rows = keys.map(k => {
      const r = scen[k].res;
      return { cls: k === best ? 'best' : '', cells: [
        `<span class="tag" style="background:${COLORS[k]};color:#fff">${k === 'auto' ? 'Auto' : k}</span> ${esc(scen[k].label.replace(/^[ABC]: /, ''))}` +
          (k === best ? ' <span class="tag win">✓ najwięcej na rękę</span>' : ''),
        ownCell(r.ownPaid), zl(r.taxTotal * f), `<b>${zl(r.net * f)}</b>`,
        `<span>${signed(r.vsBaseline * f)}<br><span class="muted">(${r.vsBaselinePct >= 0 ? '+' : ''}${pct(r.vsBaselinePct)})</span></span>`] };
    });
    const b = scen.auto.res;
    rows.push({ cells: ['<span class="muted">Dla porównania: wszystko na zwykłym koncie ETF World</span>', ownCell(b.ownPaid), '', zl(b.baseline * f), ''] });
    table($('summaryTable'), ['Scenariusz', 'Twoje wpłaty', 'Podatki', 'Na rękę' + (S.realTerms ? ' (dziś)' : ''), 'Zysk vs zwykłe konto'],
      rows, { num: [1, 2, 3, 4], key: 3, caption: 'Wynik każdego scenariusza po podatkach' });
    const notes = new Set();
    keys.forEach(k => scen[k].res.notes.forEach(n => notes.add(n)));
    if (S.inp.ppkOn || S.inp.ppeOn) notes.add('„Z pensji” to Twoja składka PPK i podatek od składek pracodawcy.');
    $('notes').innerHTML = [...notes].map(n => `<p>${esc(n)}</p>`).join('');
  }

  const YEAR_COLS = ['ikze', 'ike', 'oki', 'edo', 'etfWorld', 'etfEm', 'ppk', 'ppe'];
  const yearRows = res => res.years.map(y => [y.year, y.age, y.own, ...YEAR_COLS.map(k => y.contrib[k]), y.total]);
  function renderYearTable(scen) {
    const res = (scen[S.yearScen] || scen.auto).res;
    table($('yearTable'), ['Rok', 'Wiek', 'Twoja wpłata', ...YEAR_COLS.map(k => vname(k).replace(' (XTB)', '')), 'Wartość razem'],
      yearRows(res).map(r => ({ cells: r.map((x, i) => (i < 2 ? x : (x ? num(x) : '–'))) })),
      { num: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], caption: 'Wpłaty i wartość rok po roku' });
  }
  function downloadCsv() {
    if (!lastScen) return;
    const res = (lastScen[S.yearScen] || lastScen.auto).res;
    const head = ['Rok', 'Wiek', 'Twoja wplata', ...YEAR_COLS.map(k => 'Wplata ' + vname(k)), 'Wartosc razem'];
    const n = x => (typeof x === 'number' ? x.toFixed(2).replace('.', ',') : x);
    const csv = [head, ...yearRows(res)].map(r => r.map(n).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `konta-inwestycyjne-${S.yearScen}.csv`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- Auto-split order + scenario editor ----------
  function renderOrder(scen) {
    $('orderList').innerHTML = S.order.map((k, i) => `<li><span>${vname(k)}</span>` +
      `<button data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="${vname(k)}: w górę">↑</button>` +
      `<button data-move="${i}" data-dir="1" ${i === S.order.length - 1 ? 'disabled' : ''} aria-label="${vname(k)}: w dół">↓</button>` +
      `<button data-remove="${i}" ${S.order.length === 1 ? 'disabled' : ''} aria-label="${vname(k)}: usuń">✕</button></li>`).join('');
    const missing = C.FREE_VEHICLES.filter(k => !S.order.includes(k));
    $('orderAdd').innerHTML = missing.length ? missing.map(k => `<button data-add="${k}">+ ${vname(k)}</button>`).join(' ') : '<span class="muted">wszystkie dodane</span>';
  }
  function renderEditor() {
    const sc = S.scenarios[S.editSlot];
    document.querySelectorAll('.slot').forEach(b => { b.classList.toggle('active', b.dataset.slot === S.editSlot); b.setAttribute('aria-pressed', b.dataset.slot === S.editSlot); });
    $('scenName').value = sc.name;
    const box = $('splitEditor'); box.innerHTML = '';
    C.FREE_VEHICLES.forEach(k => box.appendChild(field(vname(k), () => sc.split[k] || 0, { min: 0, max: 100, step: 5, unit: '%' },
      v => { sc.split[k] = v; update(); })));
    const capOn = !!sc.capSplit;
    $('capOwn').checked = capOn; $('capBox').hidden = !capOn;
    const cb = $('capEditor'); cb.innerHTML = '';
    if (capOn) C.FREE_VEHICLES.forEach(k => cb.appendChild(field(vname(k), () => sc.capSplit[k] || 0, { min: 0, max: 100, step: 5, unit: '%' },
      v => { sc.capSplit[k] = v; update(); })));
    renderSplitSum();
  }
  function renderSplitSum() {
    const sc = S.scenarios[S.editSlot];
    const sum = C.FREE_VEHICLES.reduce((s, k) => s + (Number(sc.split[k]) || 0), 0);
    const yearly = 12 * S.inp.monthly;
    const warn = ['ike', 'ikze'].filter(k => sum > 0 && yearly * (sc.split[k] || 0) / sum > S.cfg.limits[k] + 0.01)
      .map(k => `${vname(k)}: część ponad limit trafi do ETF World.`);
    $('splitSum').innerHTML = (sum === 100 ? 'Suma: 100%.' : `Suma: ${sum}% – przeliczamy proporcjonalnie do 100%.`) +
      (sc.capSplit ? ' ' : ' Kapitał na start dzielimy tak samo (w 1. roku limity też obowiązują). ') + warn.join(' ');
    if (sc.capSplit) {
      const cs = C.FREE_VEHICLES.reduce((s, k) => s + (Number(sc.capSplit[k]) || 0), 0);
      $('capSum').textContent = (cs === 100 ? 'Suma: 100%.' : `Suma: ${cs}% – przeliczamy proporcjonalnie do 100%.`) + ' Limity IKE i IKZE w 1. roku obejmują wpłaty i kapitał razem; nadwyżka trafia do ETF World.';
    }
  }

  // ---------- Produkty: comparison, each alone, early payout ----------
  function renderCompare() {
    const cfg = S.cfg;
    const riskCls = r => (r.startsWith('niskie') ? 'low' : r.startsWith('średnie') ? 'mid' : 'high');
    const limit = k => {
      const v = C.VEHICLES[k];
      if (v.limit) return getPath(cfg, v.limit).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/ /g, ' ') + ' zł / rok';
      if (k === 'ppk') return `${pct(cfg.ppk.employee)} pensji (Ty) + ${pct(cfg.ppk.employer)} (pracodawca)`;
      if (k === 'ppe') return `${pct(cfg.ppe.employer)} pensji (pracodawca)`;
      if (k === 'oki') return `brak (bez podatku do ${zl(cfg.limits.okiExempt)})`;
      return 'brak';
    };
    const order = ['ikze', 'ike', 'oki', 'ppk', 'ppe', 'edo', 'etfWorld', 'etfEm'];
    table($('compareTable'), ['Produkt', 'W skrócie', 'Limit wpłat', 'Korzyść podatkowa', 'Podatek przy wypłacie', 'Dostęp', 'Ryzyko'],
      order.map(k => { const v = C.VEHICLES[k]; return { cells: [`<b>${v.name}</b>`, v.desc, limit(k), v.benefit, v.exit, v.lock,
        `<span class="tag ${riskCls(v.risk)}">${v.risk}</span>`] }; }), { caption: 'Porównanie produktów' });
  }
  function renderSingle() {
    const H = years(), inp = calcInp(), f = realF(H);
    const rows = K.compareSingle(S.cfg, inp, H);
    const range = ['pessimistic', 'optimistic'].map(p => { const c = withPreset(p); const fr = S.realTerms ? K.realFactor(c, H) : 1; return K.compareSingle(c, inp, H).map(r => r.net * fr); });
    const sal = S.inp.salary * 12, c = S.cfg;
    const fromOthers = { ppk: H * (c.ppk.employer * sal + c.ppk.yearly) + c.ppk.welcome, ppe: H * c.ppe.employer * sal };
    table($('singleTable'),
      ['Produkt', 'Twoje wpłaty', 'Wartość brutto', 'Podatki', 'Na rękę' + (S.realTerms ? ' (dziś)' : ''), 'Słabszy – lepszy rynek', 'Na 1 zł wpłaty'],
      rows.map((r, i) => ({ cells: [
        `<b>${vname(r.key)}</b>` + (r.overflow > 0 ? `<br><span class="muted">w tym ${zl(r.overflow)} ponad limit → ETF</span>` : '') +
          (r.salaryBased ? `<br><span class="muted">z pensji; w tym od pracodawcy i państwa: ${zl(fromOthers[r.key])}</span>` : ''),
        zl(r.own), zl(r.gross * f), zl(r.tax * f), `<b>${zl(r.net * f)}</b>`,
        `${num(Math.min(range[0][i], range[1][i]))} – ${zl(Math.max(range[0][i], range[1][i]))}`,
        r.salaryBased || !r.multiple ? '–' : (r.multiple * f).toLocaleString('pl-PL', { maximumFractionDigits: 2 }) + ' zł',
      ] })), { num: [1, 2, 3, 4, 5, 6], key: 4, caption: 'Każdy produkt osobno' });
  }
  function renderEarly() {
    const N = S.earlyN, endAge = S.inp.age + N, f = realF(N);
    $('earlyN').value = N; $('earlyNVal').textContent = N; $('earlyAge').textContent = `Masz wtedy ${endAge} lat.`;
    const rows = K.compareSingle(S.cfg, calcInp(), N);
    table($('earlyTable'), ['Produkt', 'Twoje wpłaty', 'Na rękę' + (S.realTerms ? ' (dziś)' : ''), 'Zysk netto', 'Zasada przy wypłacie'],
      rows.map(r => ({ cells: [`<b>${vname(r.key)}</b>`, zl(r.own), `<b>${zl(r.net * f)}</b>`, signed(r.net * f - r.own), K.exitRule(r.key, endAge, S.cfg)] })),
      { num: [1, 2, 3], key: 2, caption: 'Wcześniejsza wypłata' });
  }

  // ---------- Założenia ----------
  const SETTINGS = [
    ['limits.ike', 'Limit IKE (zł/rok)', 'zl'], ['limits.ikze', 'Limit IKZE (zł/rok)', 'zl'],
    ['limits.okiExempt', 'OKI – kwota bez podatku (zł)', 'zl'], ['okiTaxRate', 'OKI – podatek od nadwyżki', 'pct'],
    ['okiEtfQualifies', 'OKI – ETF-y objęte zwolnieniem (do sprawdzenia)', 'bool'],
    ['tax.pit', 'Stawka PIT', 'pct'], ['tax.belka', 'Podatek Belki', 'pct'], ['tax.ikzeExit', 'IKZE – podatek przy wypłacie', 'pct'],
    ['tax.ikeFreeAge', 'IKE – wiek wypłaty bez podatku', 'num'], ['tax.ikzeFreeAge', 'IKZE – wiek wypłaty (10%)', 'num'],
    ['tax.ppkFreeAge', 'PPK – wiek wypłaty bez podatku', 'num'],
    ['ppk.employee', 'PPK – składka Twoja', 'pct'], ['ppk.employer', 'PPK – składka pracodawcy', 'pct'],
    ['ppk.welcome', 'PPK – dopłata powitalna (zł)', 'zl'], ['ppk.yearly', 'PPK – dopłata roczna (zł)', 'zl'],
    ['ppk.earlyEmployerToZus', 'PPK – część od pracodawcy do ZUS przy wcześniejszej wypłacie', 'pct'],
    ['ppe.employer', 'PPE – składka pracodawcy', 'pct'],
    ['returns.etfWorld', 'Zwrot ETF World (rocznie)', 'pct', true], ['returns.etfEm', 'Zwrot ETF EM (rocznie)', 'pct', true],
    ['returns.ppk', 'Zwrot PPK (rocznie)', 'pct', true], ['returns.ppe', 'Zwrot PPE (rocznie)', 'pct', true],
    ['returns.inflation', 'Inflacja (rocznie)', 'pct', true], ['returns.edoYear1', 'EDO – oprocentowanie 1. rok', 'pct'],
    ['returns.edoMargin', 'EDO – marża ponad inflację', 'pct'], ['ter', 'Koszt ETF (TER)', 'pct'],
  ];
  function renderSettings() {
    const box = $('settings'); box.innerHTML = '';
    SETTINGS.forEach(([path, label, type, isPreset]) => {
      if (type === 'bool') {
        const l = document.createElement('label'); l.className = 'check';
        l.innerHTML = `<input type="checkbox" ${getPath(S.cfg, path) ? 'checked' : ''}> ${esc(label)}`;
        l.querySelector('input').addEventListener('change', e => { setPath(S.cfg, path, e.target.checked); update(); });
        box.appendChild(l); return;
      }
      const get = () => (type === 'pct' ? +(getPath(S.cfg, path) * 100).toFixed(4) : getPath(S.cfg, path));
      const opts = { range: false, min: 0, max: type === 'zl' ? 1e7 : 100, step: type === 'pct' ? 0.05 : 1, unit: type === 'pct' ? '%' : type === 'zl' ? 'zł' : 'lat' };
      box.appendChild(field(label, get, opts, v => {
        setPath(S.cfg, path, type === 'pct' ? v / 100 : v);
        if (isPreset) S.preset = 'custom';
        update();
      }));
    });
  }

  // ---------- Wypłata: withdrawal phase (N2, U32) ----------
  const wdName = k => C.WD_NAMES[k];
  // Starting balances and age: from the plan (chosen scenario) or typed in.
  function wdStart(scen) {
    const W = S.wd;
    if (W.source === 'plan') {
      const r = scen[S.mainScen].res;
      return { start: r.end, age: r.endAge, offset: years(), label: scen[S.mainScen].label };
    }
    const g = W.gainPct / 100, start = {};
    C.WD_ORDER.forEach(k => { const v = W.own[k] || 0; start[k] = { v, b: k === 'ikze' ? v : v * (1 - g) }; });
    return { start, age: W.startAge, offset: 0 };
  }
  const wdOpts = (age, extra) => Object.assign({ age, strategy: S.wd.strategy, monthly: S.wd.monthly, indexed: S.wd.indexed,
    pct: S.wd.pct / 100, untilAge: S.wd.untilAge, order: S.wd.order, maxAge: 100 }, extra || {});
  // Highest monthly amount (net) that lasts until toAge.
  function sustainable(st, toAge) {
    let lo = 0, hi = Math.max(1000, st.total);
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const r = K.withdraw(S.cfg, st.start, wdOpts(st.age, { strategy: 'fixed', monthly: mid, maxAge: toAge }));
      if (r.runsOutAge === null) lo = mid; else hi = mid;
    }
    return Math.floor(lo / 50) * 50;
  }
  function renderWdInputs() {
    const W = S.wd;
    document.querySelectorAll('[data-wdsrc]').forEach(b => { b.classList.toggle('active', b.dataset.wdsrc === W.source); b.setAttribute('aria-pressed', b.dataset.wdsrc === W.source); });
    document.querySelectorAll('[data-wdstr]').forEach(b => { b.classList.toggle('active', b.dataset.wdstr === W.strategy); b.setAttribute('aria-pressed', b.dataset.wdstr === W.strategy); });
    $('wdStrInfo').textContent = C.WD_STRATEGIES[W.strategy];
    const src = $('wdSrc'); src.innerHTML = '';
    if (W.source === 'own') {
      const box = document.createElement('div'); box.className = 'grid';
      box.appendChild(field('Wiek na start wypłat', () => W.startAge, { min: 40, max: 95, step: 1, unit: 'lat', range: false }, v => { W.startAge = v; update(); }));
      C.WD_ORDER.forEach(k => box.appendChild(field(wdName(k), () => W.own[k] || 0, { min: 0, max: 1e8, step: 1000, unit: 'zł', range: false }, v => { W.own[k] = v; update(); })));
      box.appendChild(field('Ile z tego to zysk', () => W.gainPct, { min: 0, max: 100, step: 5, unit: '%', range: false,
        hint: 'Część wartości, która jest zyskiem (a nie wpłatami). Od niej liczymy 19% podatku Belki na zwykłym koncie i w EDO.' }, v => { W.gainPct = v; update(); }));
      src.appendChild(box);
    } else src.innerHTML = '<p class="hint" id="wdSrcInfo"></p>';
    const st = $('wdStr'); st.innerHTML = '';
    if (W.strategy === 'fixed') {
      st.appendChild(field('Na rękę miesięcznie', () => W.monthly, { min: 100, max: 100000, sliderMax: 20000, step: 100, unit: 'zł' }, v => { W.monthly = v; update(); }));
      const l = document.createElement('label'); l.className = 'check';
      l.innerHTML = `<input type="checkbox" ${W.indexed ? 'checked' : ''}> Kwota rośnie co roku razem z inflacją`;
      l.querySelector('input').addEventListener('change', e => { W.indexed = e.target.checked; update(); });
      st.appendChild(l);
      const b = document.createElement('button'); b.type = 'button'; b.dataset.wdfit = '90'; b.textContent = 'Dobierz kwotę, która wystarczy do 90 lat';
      st.appendChild(b);
    } else if (W.strategy === 'pct') {
      st.appendChild(field('Wypłacasz rocznie', () => W.pct, { min: 1, max: 20, step: 0.5, unit: '%', hint: 'Często podaje się 4% jako bezpieczną stawkę.' }, v => { W.pct = v; update(); }));
    } else {
      st.appendChild(field('Wydaj wszystko do wieku', () => W.untilAge, { min: () => (lastScen ? wdStart(lastScen).age + 1 : 41), max: 100, step: 1, unit: 'lat' }, v => { W.untilAge = v; update(); }));
    }
  }
  function renderWdOrder() {
    const o = S.wd.order;
    $('wdOrder').innerHTML = o.map((k, i) => `<li><span>${wdName(k)}</span>` +
      `<button data-wdmove="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="${wdName(k)}: wcześniej">↑</button>` +
      `<button data-wdmove="${i}" data-dir="1" ${i === o.length - 1 ? 'disabled' : ''} aria-label="${wdName(k)}: później">↓</button></li>`).join('');
  }
  function renderWd(scen) {
    const W = S.wd, st = wdStart(scen);
    st.total = C.WD_ORDER.reduce((s, k) => s + Math.max(0, (st.start[k] || { v: 0 }).v), 0);
    if (W.source === 'plan' && $('wdSrcInfo')) {
      const parts = C.WD_ORDER.filter(k => st.start[k].v > 0.5).map(k => `<li>${wdName(k)}: ${zl(st.start[k].v)}</li>`).join('');
      $('wdSrcInfo').innerHTML = `${S.mode === 'advanced' ? st.label + ', w' : 'W'} wieku ${st.age} lat masz na kontach <b>${zl(st.total)}</b> (przed podatkiem; podatek liczymy przy każdej wypłacie). Zmienisz to w zakładce <a href="#plan">Plan</a>.<ul class="srclist">${parts}</ul>`;
    }
    const r = K.withdraw(S.cfg, st.start, wdOpts(st.age));
    lastWd = r;
    const defl = t => (S.realTerms ? K.realFactor(S.cfg, st.offset + t) : 1);
    const today = t => K.realFactor(S.cfg, st.offset + t);
    let html;
    if (st.total < 1) {
      html = '<p class="big">0 zł</p><div class="warn">Brak pieniędzy na kontach. Wpisz kwoty albo zmień plan.</div>';
    } else {
      const first = r.firstMonthly;
      html = `<p class="eyebrow">Od ${st.age} lat, na rękę${S.realTerms ? ' (w dzisiejszych złotówkach)' : ''}</p><p class="big">${zl(first * defl(0))} <span>miesięcznie</span></p>`;
      const last = r.years[r.years.length - 1];
      if (W.strategy === 'fixed') {
        html += r.runsOutAge ? `<p class="line2">Pieniądze wystarczą do <b>${r.runsOutAge}. roku życia</b>.</p>`
          : `<p class="line2">Pieniądze wystarczą <b>ponad 100. rok życia</b>. Zostaje ok. ${zl(last.left * defl(r.years.length))}.</p>`;
      } else if (W.strategy === 'pct') {
        const at85 = r.years.find(y => y.age === 85);
        html += `<p class="line2">Pieniądze się nie kończą${at85 ? `; w wieku 85 lat ok. <b>${zl(at85.net / 12 * defl(85 - st.age))}</b> miesięcznie` : ''}.</p>`;
      } else html += `<p class="line2">Do <b>${W.untilAge}. roku życia</b>, potem konta są puste.</p>`;
      html += `<dl class="trio"><div><dt>Na kontach na start</dt><dd>${zl(st.total)}</dd></div>` +
        `<div><dt>Podatki przy wypłatach</dt><dd>${zl(r.taxTotal)}</dd></div>` +
        `<div><dt>Pierwsza wypłata w dzisiejszych zł</dt><dd>${zl(first * today(0))}</dd></div></dl>`;
      if (W.strategy === 'fixed' && r.runsOutAge && r.runsOutAge < 90) {
        html += `<div class="warn" role="note"><b>Pieniądze skończą się w wieku ${r.runsOutAge} lat.</b> Do 90 lat wystarczy ok. <b>${zl(sustainable(st, 90))}</b> miesięcznie.` +
          '<button class="primary" data-wdfit="90">Ustaw tę kwotę</button></div>';
      }
      if (st.age < S.cfg.tax.ikeFreeAge) html += `<div class="warn" role="note">Wypłata przed ${S.cfg.tax.ikeFreeAge}. rokiem życia: IKE i PPK tracą ulgę, IKZE płaci pełny PIT.</div>`;
      const has = k => st.start[k] && st.start[k].v > 0.5, T = S.cfg.tax, notes = [];
      if (has('ikze')) notes.push(`IKZE: ${pct(T.ikzeExit)} podatku od każdej wypłaty po ${T.ikzeFreeAge}. roku życia.`);
      if (has('ike')) notes.push(`IKE: bez podatku po ${T.ikeFreeAge}. roku życia.`);
      if (has('ppk')) notes.push(`PPK: bez podatku po ${T.ppkFreeAge}. roku życia, jeśli 75% wypłacasz w co najmniej 120 ratach – tutaj wypłacamy stopniowo.`);
      if (has('etf') || has('edo')) notes.push(`ETF i obligacje: ${pct(T.belka, 0)} podatku Belki od części zysku w każdej wypłacie.`);
      if (has('oki')) notes.push(`OKI: dalej ${pct(S.cfg.okiTaxRate, 2)} rocznie od wartości ponad ${zl(S.cfg.limits.okiExempt)}.`);
      html += `<p class="muted">${notes.join(' ')} Pieniądze, których jeszcze nie wypłacasz, dalej pracują (Rynek: ${pct(S.cfg.returns.etfWorld)} rocznie dla ETF). To uproszczony szacunek, nie porada.</p>`;
      clearTimeout(wdLiveTimer);
      wdLiveTimer = setTimeout(() => { $('wdLive').textContent = `Od ${st.age} lat: ${zl(first)} miesięcznie na rękę.`; }, 600);
    }
    $('wdBody').innerHTML = html;
    renderWdOrder();
    // chart + table
    const labels = r.years.map(y => y.age + ' l.');
    const left = r.years.map((y, i) => Math.round(y.left * defl(i + 1))), inc = r.years.map((y, i) => Math.round(y.net / 12 * defl(i)));
    table($('wdTable'), ['Wiek', 'Wypłata brutto (rok)', 'Podatek', 'Na rękę miesięcznie', 'Zostało'],
      r.years.map((y, i) => ({ cells: [y.age, zl(y.gross * defl(i)), zl(y.tax * defl(i)), `<b>${zl(y.net / 12 * defl(i))}</b>`, zl(y.left * defl(i + 1))] })),
      { num: [1, 2, 3, 4], caption: 'Wypłaty rok po roku' });
    if (typeof Chart === 'undefined') return;
    const data = { labels, datasets: [
      { type: 'line', label: 'Zostało na kontach', data: left, borderColor: COLORS.auto, backgroundColor: COLORS.auto, borderWidth: 2.5, pointRadius: 0, yAxisID: 'y' },
      { type: 'bar', label: 'Na rękę miesięcznie', data: inc, backgroundColor: '#93c5b4', yAxisID: 'y1' },
    ] };
    if (wdChart) { wdChart.data = data; wdChart.update('none'); return; }
    wdChart = new Chart($('wdChart'), { data, options: {
      responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', align: 'start', labels: { font: { size: 13 } } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${zl(c.parsed.y)}` } } },
      scales: { y: { position: 'left', beginAtZero: true, ticks: { callback: v => num(v / 1000) + ' tys.' } },
        y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { callback: v => num(v) + ' zł' } },
        x: { ticks: { maxTicksLimit: 8, maxRotation: 0 } } } } });
  }
  let wdLiveTimer = null;
  document.querySelectorAll('[data-wdsrc]').forEach(b => b.addEventListener('click', () => {
    S.wd.source = b.dataset.wdsrc;
    if (S.wd.source === 'own' && !C.WD_ORDER.some(k => S.wd.own[k] > 0) && lastScen) {
      const e = lastScen[S.mainScen].res.end; C.WD_ORDER.forEach(k => { S.wd.own[k] = Math.round(e[k].v / 1000) * 1000; });
      S.wd.startAge = S.inp.payoutAge; // start from the plan's numbers, then edit
    }
    renderWdInputs(); update();
  }));
  document.querySelectorAll('[data-wdstr]').forEach(b => b.addEventListener('click', () => { S.wd.strategy = b.dataset.wdstr; renderWdInputs(); update(); }));
  document.querySelector('[data-view="wyplata"]').addEventListener('click', e => {
    const b = e.target.closest('[data-wdfit], [data-wdmove]'); if (!b) return;
    if (b.dataset.wdfit) {
      const st = wdStart(lastScen); st.total = C.WD_ORDER.reduce((s, k) => s + Math.max(0, st.start[k].v), 0);
      S.wd.strategy = 'fixed'; S.wd.monthly = Math.max(100, sustainable(st, +b.dataset.wdfit));
      renderWdInputs(); renderResults(); save(); $('wdResult').focus({ preventScroll: true }); return;
    }
    const i = +b.dataset.wdmove, j = i + (+b.dataset.dir), o = S.wd.order;
    [o[i], o[j]] = [o[j], o[i]];
    renderResults(); save();
    let t = $('wdOrder').querySelector(`[data-wdmove="${j}"][data-dir="${b.dataset.dir}"]`);
    if (t && t.disabled) t = t.parentElement.querySelector('button:not([disabled])');
    if (t) t.focus();
  });

  // ---------- Toast with undo (U20) ----------
  let toastTimer = null, toastSnap = null;
  function toast(msg, snap) {
    toastSnap = snap; $('toastText').textContent = msg; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; toastSnap = null; }, 8000);
  }
  $('toastUndo').addEventListener('click', () => {
    if (toastSnap) { S = toastSnap; toastSnap = null; renderAll(); save(); }
    $('toast').hidden = true;
  });

  // ---------- Shared-link banner (U21) ----------
  function renderShared() { $('sharedBanner').hidden = !shared; }
  $('sharedKeep').addEventListener('click', () => { shared = false; cleanUrl(); save(); renderShared(); });
  $('sharedBack').addEventListener('click', () => { shared = false; cleanUrl(); S = normalize(readOwn()); renderAll(); save(); renderShared(); });

  // ---------- Start: personas (N1) ----------
  function renderStart() {
    $('personas').innerHTML = Object.keys(C.PERSONAS).map(k => { const p = C.PERSONAS[k]; return `<button class="persona" data-persona="${k}" aria-pressed="${S.persona === k}">` +
      `<b>${p.name}</b><small>${p.range}</small><span>${p.desc}</span>` +
      `<span class="muted">Przykład: ${num(p.inp.age)} lat, ${zl(p.inp.capital)} na start, ${zl(p.inp.monthly)} miesięcznie</span><em>${p.cta} →</em></button>`; }).join('');
    const chip = $('personaChip');
    chip.hidden = !S.persona;
    if (S.persona) chip.textContent = `Profil: ${C.PERSONAS[S.persona].name} · zmień`;
  }
  $('personas').addEventListener('click', e => {
    const b = e.target.closest('[data-persona]'); if (!b) return;
    const k = b.dataset.persona, p = C.PERSONAS[k];
    if (S.touched && !window.confirm('Zastąpić Twoje dane przykładowymi?')) return;
    Object.assign(S.inp, p.inp); S.persona = k; S.touched = false; S.mode = p.mode;
    if (p.mode === 'simple') S.mainScen = 'auto';
    if (p.open === 'przewodnik') S.guide = defaults().guide;
    renderAll(); save();
    if (p.open === 'dostosuj') $('dostosuj').open = true;
    if (p.open === 'wyplata') { // start with an amount that lasts until 90
      const st = wdStart(lastScen); st.total = C.WD_ORDER.reduce((s, k) => s + Math.max(0, st.start[k].v), 0);
      S.wd.strategy = 'fixed'; S.wd.monthly = Math.max(100, sustainable(st, 90)); renderWdInputs(); renderResults(); save();
    }
    location.hash = p.open === 'przewodnik' ? '#przewodnik' : p.open === 'wyplata' ? '#wyplata' : '#plan';
  });

  // ---------- Guide for beginners (N5) ----------
  const round1000 = x => zl(Math.round(x / 1000) * 1000);
  function applyGuide() {
    const a = S.guide.ans;
    S.inp.salary = a.salary; S.inp.monthly = a.monthly; S.inp.capital = a.capital; S.inp.age = a.age;
    S.inp.payoutAge = Math.max(65, a.age + 1);
    S.inp.ppkOn = a.ppk !== 'no';
    S.style = C.STYLES[a.risk] ? a.risk : 'mid';
    S.mainScen = 'auto'; S.mode = 'simple'; S.touched = true;
    renderAll(); save();
  }
  function renderGuide() {
    const g = S.guide, n = C.GUIDE.length, box = $('guide');
    if (g.step >= n) { renderGuideResult(); return; }
    const st = C.GUIDE[g.step], cur = g.ans[st.key];
    const opts = st.options ? st.options.map(o => ({ v: o[0], l: o[1], s: o[2] }))
      : st.choices.map(c => ({ v: c, l: (st.labels && st.labels[c]) || `${num(c)} ${st.unit}` }));
    const custom = st.choices && cur >= 0 && !st.choices.includes(cur);
    box.innerHTML = `<p class="muted">Pytanie ${g.step + 1} / ${n}</p><h2 id="guideQ" tabindex="-1">${st.q}</h2><div class="choices">` +
      opts.map(o => `<button class="choice${cur === o.v ? ' active' : ''}" data-v="${o.v}">${o.l}${o.s ? `<small>${o.s}</small>` : ''}</button>`).join('') +
      (st.choices ? `<button class="choice${custom ? ' active' : ''}" data-other>${st.other || 'Inna kwota'}${custom ? `<small>teraz: ${num(cur)} ${st.unit}</small>` : ''}</button>` : '') + '</div>' +
      (st.choices ? `<form id="guideOther" hidden><label for="guideNum">Wpisz (${st.unit}):</label><div class="row"><input id="guideNum" type="text" inputmode="decimal" autocomplete="off" aria-describedby="guideErr"><button class="primary">Dalej</button></div><p class="err" id="guideErr" hidden></p></form>` : '') +
      `<details><summary>Co to znaczy?</summary><p>${st.help}</p></details>` +
      `<div class="row">${g.step > 0 ? '<button data-back>← Wstecz</button>' : ''}</div>`;
  }
  function guideAnswer(v) {
    const g = S.guide; g.ans[C.GUIDE[g.step].key] = v; g.step++;
    if (g.step >= C.GUIDE.length) applyGuide(); else save();
    renderGuide(); const h = $('guideQ'); if (h) h.focus();
  }
  function renderGuideResult() {
    const H = years(), inp = calcInp(), al = allocFor('auto'), c = S.cfg;
    const run = cfg => K.runScenario(cfg, inp, al);
    const r = run(c), real = r.net * K.realFactor(c, H);
    const lo = run(withPreset('pessimistic')).net, hi = run(withPreset('optimistic')).net;
    const sp = K.firstYearSplit(c, inp, al);
    const lines = [S.inp.ppkOn ? `Zostań w PPK – co miesiąc pracodawca i państwo dokładają ok. ${zl(c.ppk.employer * S.inp.salary + c.ppk.yearly / 12)}, poza Twoją wpłatą.`
      : 'Rozważ PPK – pracodawca i państwo dokładają do Twoich wpłat.'];
    const mon = C.FREE_VEHICLES.filter(v => sp.yearly[v] > 0.5).map(v => `${vname(v)} ok. ${zl(sp.yearly[v] / 12)}` +
      (v === 'ikze' ? ` (odzyskasz ok. ${zl(c.tax.pit * sp.yearly.ikze)} rocznie w PIT)` : ''));
    if (mon.length) lines.push('Co miesiąc: ' + mon.join(', ') + '.');
    const cap = C.FREE_VEHICLES.filter(v => sp.capital[v] > 0.5).map(v => `${vname(v)} ${zl(sp.capital[v])}`);
    if (cap.length) lines.push(`Kapitał na start: ${cap.join(', ')}.`);
    lines.push(`Styl „${C.STYLES[S.style].name}”: ${C.STYLES[S.style].desc}`);
    $('guide').innerHTML = `<p class="muted">Twój wynik</p><h2 id="guideQ" tabindex="-1">W wieku ${r.endAge} lat możesz mieć ok. <span class="pos">${round1000(r.net)}</span></h2>` +
      `<p>To ok. <b>${round1000(real)}</b> w dzisiejszych pieniądzach, czyli ok. <b>${zl(Math.round(real / 240 / 100) * 100)} miesięcznie</b> przez 20 lat emerytury.</p>` +
      `<h3>Prosty plan</h3><ol class="planlist">${lines.map(x => `<li>${x}</li>`).join('')}</ol>` +
      `<p>Rynek bywa różny: w gorszym scenariuszu ok. <b>${round1000(Math.min(lo, hi))}</b>, w lepszym ok. <b>${round1000(Math.max(lo, hi))}</b>.</p>` +
      '<div class="row"><a class="btn primary" href="#plan">Zobacz szczegóły</a><button data-restart>Zacznij od nowa</button></div>' +
      '<p class="muted">Kwoty po podatkach, zaokrąglone do tysięcy. To uproszczony szacunek, nie porada inwestycyjna.</p>';
  }
  $('guide').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const st = C.GUIDE[S.guide.step];
    if (b.dataset.v !== undefined) guideAnswer(st.choices ? +b.dataset.v : b.dataset.v);
    else if (b.dataset.other !== undefined) { $('guideOther').hidden = false; $('guideNum').focus(); }
    else if (b.dataset.back !== undefined) { S.guide.step--; save(); renderGuide(); $('guideQ').focus(); }
    else if (b.dataset.restart !== undefined) { S.guide = defaults().guide; save(); renderGuide(); $('guideQ').focus(); }
  });
  $('guide').addEventListener('submit', e => {
    e.preventDefault();
    const st = C.GUIDE[S.guide.step], v = parseNum($('guideNum').value), err = $('guideErr');
    if (isNaN(v) || v < st.min || v > st.max) {
      $('guideNum').setAttribute('aria-invalid', 'true');
      err.textContent = `Wpisz wartość od ${num(st.min)} do ${num(st.max)} ${st.unit}.`; err.hidden = false; return;
    }
    guideAnswer(v);
  });

  // ---------- Glossary (U17): dotted words open a short note ----------
  const GL = C.GLOSSARY.map(g => Object.assign({ rx: new RegExp('(^|[^\\p{L}])(' + g.re + ')(?![\\p{L}])', 'u') }, g));
  function glossify(root) {
    if (!root) return;
    GL.forEach((g, gi) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) {
        if (n.parentElement.closest('.gl, button, a, select, label, summary, caption, .sr')) continue;
        const m = g.rx.exec(n.nodeValue); if (!m) continue;
        const mid = n.splitText(m.index + m[1].length); mid.splitText(m[2].length);
        const s = document.createElement('span');
        s.className = 'gl'; s.tabIndex = 0; s.setAttribute('role', 'button'); s.setAttribute('aria-expanded', 'false'); s.dataset.gl = gi;
        mid.parentNode.replaceChild(s, mid); s.appendChild(mid);
        break; // one mark per word per block is enough
      }
    });
  }
  let glOpen = null;
  function closeGl() { if (glOpen) glOpen.setAttribute('aria-expanded', 'false'); glOpen = null; $('glPop').hidden = true; }
  function openGl(el) {
    if (glOpen === el) { closeGl(); return; }
    closeGl();
    const g = GL[+el.dataset.gl], pop = $('glPop');
    pop.innerHTML = `<b>${esc(g.t)}</b>${esc(g.d)}`; pop.hidden = false;
    const r = el.getBoundingClientRect();
    pop.style.top = (r.bottom + window.scrollY + 6) + 'px';
    pop.style.left = Math.max(12, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 12)) + 'px';
    el.setAttribute('aria-expanded', 'true'); glOpen = el;
  }
  document.addEventListener('click', e => { const el = e.target.closest('.gl'); if (el) openGl(el); else closeGl(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeGl();
    else if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('gl')) { e.preventDefault(); openGl(e.target); }
  });
  const glossTables = () => ['compareTable', 'singleTable', 'earlyTable', 'summaryTable', 'notes', 'resultMore', 'wdBody'].forEach(id => glossify($(id)));

  // ---------- Render all ----------
  function renderResults() {
    renderMode(); renderSalaryInfo(); renderStyle();
    const scen = computeScenarios();
    lastScen = scen;
    renderScenSelects(scen); renderPresets(); renderResult(scen); renderTips(scen);
    renderFlow(scen); renderBars(scen); renderChart(scen); renderWd(scen); renderSummary(scen); renderYearTable(scen);
    renderOrder(scen); renderSplitSum(); renderCompare(); renderSingle(); renderEarly();
    closeGl(); glossTables();
  }
  let pending = null;
  function update() {
    if (pending) cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => { pending = null; renderResults(); save(); });
  }
  function renderAll() { renderInputs(); renderEditor(); renderSettings(); renderWdInputs(); renderResults(); renderStart(); renderShared(); }

  // ---------- Events ----------
  $('ppkOn').addEventListener('change', e => { S.inp.ppkOn = e.target.checked; update(); });
  $('ppeOn').addEventListener('change', e => { S.inp.ppeOn = e.target.checked; update(); });
  $('realTerms').addEventListener('change', e => { S.realTerms = e.target.checked; update(); });
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    S.mode = b.dataset.mode; if (S.mode === 'simple') S.mainScen = 'auto'; update();
  }));
  document.querySelectorAll('[data-style]').forEach(b => b.addEventListener('click', () => { S.style = b.dataset.style; S.touched = true; update(); }));
  $('capOwn').addEventListener('change', e => {
    const sc = S.scenarios[S.editSlot]; sc.capSplit = e.target.checked ? clone(sc.split) : null; renderEditor(); update();
  });
  $('showAll').addEventListener('change', e => { S.showAll = e.target.checked; update(); });
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('.slot').forEach(b => b.addEventListener('click', () => { S.editSlot = b.dataset.slot; renderEditor(); save(); }));
  $('scenName').addEventListener('input', e => { S.scenarios[S.editSlot].name = e.target.value || S.editSlot; update(); });
  ['mainScen', 'barScen'].forEach(id => $(id).addEventListener('change', e => { S.mainScen = e.target.value; update(); }));
  $('yearScen').addEventListener('change', e => { S.yearScen = e.target.value; update(); });
  // Actions from the result card and tips
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'payout') { S.inp.payoutAge = +b.dataset.age; fields.payoutAge.setValue(S.inp.payoutAge); }
    else if (act === 'ppk') { S.inp.ppkOn = true; $('ppkOn').checked = true; }
    else if (act === 'auto') S.mainScen = 'auto';
    else if (act === 'adjust') { $('dostosuj').open = true; $('dostosuj').scrollIntoView(); $('dostosuj').querySelector('summary').focus(); return; }
    renderResults(); save();
    $('wynik').focus({ preventScroll: true }); // keep keyboard focus near the result
  });
  $('orderList').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    let sel = null;
    if (b.dataset.move !== undefined) {
      const i = +b.dataset.move, j = i + (+b.dataset.dir);
      [S.order[i], S.order[j]] = [S.order[j], S.order[i]];
      sel = `[data-move="${j}"][data-dir="${b.dataset.dir}"]`;
    } else if (b.dataset.remove !== undefined && S.order.length > 1) { S.order.splice(+b.dataset.remove, 1); sel = `[data-remove="${Math.min(+b.dataset.remove, S.order.length - 1)}"]`; }
    renderResults(); save();
    // keep focus on the moved item (the list is re-drawn)
    let t = sel && $('orderList').querySelector(sel);
    if (t && t.disabled) t = t.parentElement.querySelector('button:not([disabled])');
    if (t) t.focus();
  });
  $('orderAdd').addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    S.order.push(b.dataset.add); renderResults(); save();
    const t = $('orderAdd').querySelector('button') || $('orderList').querySelector('li:last-child button:not([disabled])');
    if (t) t.focus();
  });
  $('csvBtn').addEventListener('click', downloadCsv);
  $('earlyN').addEventListener('input', e => { S.earlyN = +e.target.value; update(); });
  $('resetBtn').addEventListener('click', () => {
    const snap = clone(S);
    S = defaults();
    renderAll(); save();
    toast('Przywrócono ustawienia domyślne.', snap);
  });
  $('shareBtn').addEventListener('click', () => {
    const url = shareUrl();
    const done = () => { $('shareInfo').textContent = 'Link skopiowany.'; };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => { $('shareInfo').textContent = url; });
    else $('shareInfo').textContent = url;
  });
  window.addEventListener('hashchange', route);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { cardVisible = es[0].isIntersecting; updateBar(); }, { rootMargin: '-60px 0px -60px 0px' }).observe($('wynik'));
  }

  renderAll();
  document.querySelectorAll('main p.muted, footer p').forEach(p => { if (!p.id) glossify(p); });
  save(); // after the first visit the app opens on Plan
  route();

  // Offline support (works on https, e.g. github.io)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline mode is optional */ });
  }
})();
