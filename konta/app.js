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
      mainScen: 'auto', showAll: false,
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

  function load() {
    let saved = null;
    try {
      const q = new URLSearchParams(location.search).get('s');
      if (q) saved = decode(q);
      else saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    } catch (e) { saved = null; }
    // v0.1 stored "years of saving"; v0.2 stores the payout age.
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
    return s;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ }
    try { history.replaceState(null, '', '?s=' + encodeURIComponent(encode(S)) + location.hash); } catch (e) { /* ignore */ }
  }

  const LIM = { capital: 5000000, monthly: 20000, salary: 50000 };
  let S = load();
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
      `<input type="number" id="${id}" inputmode="decimal" min="${l.min}" max="${l.max}" step="${opts.step}" value="${v0}" aria-describedby="${id}e">` +
      (opts.unit ? `<span class="muted">${opts.unit}</span>` : '') + '</div>' +
      (opts.range === false ? '' : `<input type="range" min="${l.min}" max="${opts.sliderMax || l.max}" step="${opts.step}" value="${v0}" aria-label="${esc(label)} – suwak">`) +
      `<p class="err" id="${id}e" hidden></p>`;
    const numEl = wrap.querySelector('input[type=number]'), rng = wrap.querySelector('input[type=range]'), err = wrap.querySelector('.err');
    const clear = () => { numEl.removeAttribute('aria-invalid'); err.hidden = true; };
    const show = v => { numEl.value = v; if (rng) rng.value = v; clear(); };
    numEl.addEventListener('input', () => {
      const v = parseFloat(numEl.value), { min, max } = lim();
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
      let v = parseFloat(numEl.value);
      if (isNaN(v)) v = get();
      v = clamp(v, min, max);
      const changed = v !== get();
      show(v); if (changed) onChange(v);
    });
    if (rng) rng.addEventListener('input', () => { const v = parseFloat(rng.value); numEl.value = v; clear(); onChange(v); });
    wrap.setValue = show;
    wrap.syncLimits = () => { const { min, max } = lim(); numEl.min = min; numEl.max = max; if (rng) rng.min = min; };
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
  const VIEWS = ['plan', 'produkty', 'zalozenia'];
  const ALIAS = { dane: 'plan', wynik: 'plan', dostosuj: 'plan', auto: 'plan', scenariusze: 'plan', wyniki: 'plan',
    porownanie: 'produkty', osobno: 'produkty', wczesniej: 'produkty', wyplata: 'produkty' };
  function route() {
    const h = location.hash.slice(1) || 'plan';
    view = VIEWS.includes(h) ? h : (ALIAS[h] || 'plan');
    document.querySelectorAll('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
    document.querySelectorAll('[data-tab]').forEach(a => {
      if (a.dataset.tab === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const target = ALIAS[h] ? $(h === 'wyplata' ? 'wczesniej' : h) : null;
    if (target) {
      if (target.closest('details')) target.closest('details').open = true;
      target.scrollIntoView();
      if (h === 'wynik') target.focus({ preventScroll: true });
    } else window.scrollTo(0, 0);
    if (view === 'plan') { if (chart) chart.resize(); if (barChart) barChart.resize(); }
    updateBar();
  }

  // ---------- Inputs ----------
  function renderInputs() {
    const box = $('inputs'); box.innerHTML = '';
    const add = (k, label, o, after) => {
      fields[k] = field(label, () => S.inp[k], o, v => { S.inp[k] = v; if (after) after(v); update(); });
      box.appendChild(fields[k]);
    };
    add('capital', 'Kapitał na start', { min: 0, max: LIM.capital, sliderMax: 500000, step: 1000, unit: 'zł' });
    add('monthly', 'Wpłata miesięczna', { min: 0, max: LIM.monthly, sliderMax: 10000, step: 100, unit: 'zł' });
    add('age', 'Twój wiek', { min: 18, max: 75, step: 1, unit: 'lat' }, v => {
      if (S.inp.payoutAge <= v) { S.inp.payoutAge = v + 1; fields.payoutAge.setValue(v + 1); }
      fields.payoutAge.syncLimits();
    });
    add('payoutAge', 'Wypłata w wieku', { min: () => S.inp.age + 1, max: 90, step: 1, unit: 'lat' });
    add('salary', 'Pensja brutto (miesięcznie)', { min: 4000, max: LIM.salary, sliderMax: 40000, step: 100, unit: 'zł' });
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
    ['etfWorld', 'etfEm', 'ppk', 'ppe', 'inflation'].forEach(k => { S.cfg.returns[k] = p[k]; });
    S.preset = key;
    renderSettings(); update();
  }

  // ---------- Scenarios ----------
  function computeScenarios() {
    const inp = calcInp();
    const out = { auto: { label: 'Auto-podział', res: K.runScenario(S.cfg, inp, K.waterfallAllocator(S.order)) } };
    SLOTS.forEach(s => { out[s] = { label: `${s}: ${S.scenarios[s].name}`, res: K.runScenario(S.cfg, inp, K.splitAllocator(S.scenarios[s].split)) }; });
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
    let more = `<dl class="trio"><div><dt>Wpłacasz</dt><dd>${zl(r.ownPaid)}</dd></div>` +
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
      const taxed = y1.etfWorld + y1.etfEm + y1.edo, room = Math.max(0, L.ikze - y1.ikze) + Math.max(0, L.ike - y1.ike);
      if (taxed > 1 && room > 1) tips.push([`W 1. roku <b>${zl(Math.min(taxed, room))}</b> trafia na konto z podatkiem, choć masz wolny limit IKZE lub IKE.`, 'adjust', 'Dostosuj podział']);
    }
    $('tips').innerHTML = tips.slice(0, 3).map(t => `<div class="tip"><span>${t[0]}</span><button data-act="${t[1]}">${t[2]}</button></div>`).join('');
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
    const labels = ys.map(y => y.age + ' l.').concat('po podatkach');
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
  function renderSummary(scen) {
    const f = realF(years()), keys = Object.keys(scen);
    const nets = keys.map(k => scen[k].res.net).sort((a, b) => b - a);
    const best = nets[0] - nets[1] > 1 ? keys.find(k => scen[k].res.net === nets[0]) : null; // no mark when equal
    const rows = keys.map(k => {
      const r = scen[k].res;
      return { cls: k === best ? 'best' : '', cells: [
        `<span class="tag" style="background:${COLORS[k]};color:#fff">${k === 'auto' ? 'Auto' : k}</span> ${esc(scen[k].label.replace(/^[ABC]: /, ''))}` +
          (k === best ? ' <span class="tag win">✓ najwięcej na rękę</span>' : ''),
        zl(r.ownPaid), zl(r.taxTotal * f), `<b>${zl(r.net * f)}</b>`,
        `<span>${signed(r.vsBaseline * f)}<br><span class="muted">(${r.vsBaselinePct >= 0 ? '+' : ''}${pct(r.vsBaselinePct)})</span></span>`] };
    });
    const b = scen.auto.res;
    rows.push({ cells: ['<span class="muted">Dla porównania: wszystko na zwykłym koncie ETF World</span>', zl(b.ownPaid), '', zl(b.baseline * f), ''] });
    table($('summaryTable'), ['Scenariusz', 'Twoje wpłaty', 'Podatki', 'Na rękę' + (S.realTerms ? ' (dziś)' : ''), 'Zysk vs zwykłe konto'],
      rows, { num: [1, 2, 3, 4], key: 3, caption: 'Wynik każdego scenariusza po podatkach' });
    const notes = new Set();
    keys.forEach(k => scen[k].res.notes.forEach(n => notes.add(n)));
    if (S.inp.ppkOn || S.inp.ppeOn) notes.add('„Twoje wpłaty” obejmują też Twoją składkę PPK i podatek od składek pracodawcy.');
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
    const y1 = scen.auto.res.years[0].contrib;
    const parts = C.FREE_VEHICLES.filter(k => y1[k] > 0.5).map(k => `${vname(k)} <b>${zl(y1[k])}</b>`);
    if (y1.ikze > 0.5) parts.push(`zwrot PIT ok. <b>${zl(S.cfg.tax.pit * y1.ikze)}</b>`);
    $('autoNow').innerHTML = parts.length ? 'W 1. roku: ' + parts.join(' · ') : 'W 1. roku: brak wpłat.';
  }
  function renderEditor() {
    const sc = S.scenarios[S.editSlot];
    document.querySelectorAll('.slot').forEach(b => { b.classList.toggle('active', b.dataset.slot === S.editSlot); b.setAttribute('aria-pressed', b.dataset.slot === S.editSlot); });
    $('scenName').value = sc.name;
    const box = $('splitEditor'); box.innerHTML = '';
    C.FREE_VEHICLES.forEach(k => box.appendChild(field(vname(k), () => sc.split[k] || 0, { min: 0, max: 100, step: 5, unit: '%' },
      v => { sc.split[k] = v; update(); })));
    renderSplitSum();
  }
  function renderSplitSum() {
    const sc = S.scenarios[S.editSlot];
    const sum = C.FREE_VEHICLES.reduce((s, k) => s + (Number(sc.split[k]) || 0), 0);
    const yearly = 12 * S.inp.monthly;
    const warn = ['ike', 'ikze'].filter(k => sum > 0 && yearly * (sc.split[k] || 0) / sum > S.cfg.limits[k] + 0.01)
      .map(k => `${vname(k)}: część ponad limit trafi do ETF World.`);
    $('splitSum').innerHTML = (sum === 100 ? 'Suma: 100%.' : `Suma: ${sum}% – przeliczamy proporcjonalnie do 100%.`) +
      ' Kapitał startowy dzielimy tak samo (w 1. roku limity też obowiązują). ' + warn.join(' ');
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

  // ---------- Render all ----------
  function renderResults() {
    const scen = computeScenarios();
    lastScen = scen;
    renderScenSelects(scen); renderPresets(); renderResult(scen); renderTips(scen);
    renderBars(scen); renderChart(scen); renderSummary(scen); renderYearTable(scen);
    renderOrder(scen); renderSplitSum(); renderCompare(); renderSingle(); renderEarly();
  }
  let pending = null;
  function update() {
    if (pending) cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => { pending = null; renderResults(); save(); });
  }
  function renderAll() { renderInputs(); renderEditor(); renderSettings(); renderResults(); }

  // ---------- Events ----------
  $('ppkOn').addEventListener('change', e => { S.inp.ppkOn = e.target.checked; update(); });
  $('ppeOn').addEventListener('change', e => { S.inp.ppeOn = e.target.checked; update(); });
  $('realTerms').addEventListener('change', e => { S.realTerms = e.target.checked; update(); });
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
    S = defaults();
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    renderAll(); save();
  });
  $('shareBtn').addEventListener('click', () => {
    save();
    const done = () => { $('shareInfo').textContent = 'Link skopiowany.'; };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, () => { $('shareInfo').textContent = location.href; });
    else $('shareInfo').textContent = location.href;
  });
  window.addEventListener('hashchange', route);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { cardVisible = es[0].isIntersecting; updateBar(); }, { rootMargin: '-60px 0px -60px 0px' }).observe($('wynik'));
  }

  renderAll();
  route();

  // Offline support (works on https, e.g. github.io)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline mode is optional */ });
  }
})();
