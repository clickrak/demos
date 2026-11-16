// Konta Inwestycyjne – UI. Depends on KI_CONFIG (config.js), KI_CALC (calc.js), Chart (vendor).
(function () {
  'use strict';
  const C = window.KI_CONFIG, K = window.KI_CALC;
  const STORE_KEY = 'ki-state-v1';
  const SLOTS = ['A', 'B', 'C'];
  const COLORS = { auto: '#0f6e56', A: '#2563eb', B: '#d97706', C: '#9333ea', own: '#98a2b3' };

  const $ = id => document.getElementById(id);
  const clone = o => JSON.parse(JSON.stringify(o));
  const nf = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
  const zl = x => nf.format(Math.round(x)) + ' zł';
  const pct = (x, d = 1) => (x * 100).toLocaleString('pl-PL', { maximumFractionDigits: d }) + '%';
  const vname = k => C.VEHICLES[k].name;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const getPath = (o, p) => p.split('.').reduce((x, k) => x[k], o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };

  // ---------- State (F10: localStorage + URL) ----------
  function defaults() {
    return {
      inp: clone(C.DEFAULT_INPUT), cfg: clone(C.DEFAULT_CONFIG), scenarios: clone(C.DEFAULT_SCENARIOS),
      order: clone(C.DEFAULT_ORDER), realTerms: false, preset: 'base', earlyN: 10, editSlot: 'A', yearScen: 'auto',
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

  function load() {
    let saved = null;
    try {
      const q = new URLSearchParams(location.search).get('s');
      if (q) saved = decode(q);
      else saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    } catch (e) { saved = null; }
    const s = merge(defaults(), saved);
    s.order = s.order.filter(k => C.FREE_VEHICLES.includes(k));
    if (!s.order.length) s.order = clone(C.DEFAULT_ORDER);
    return s;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ }
    try { history.replaceState(null, '', '?s=' + encodeURIComponent(encode(S)) + location.hash); } catch (e) { /* ignore */ }
  }

  let S = load();
  let chart = null;
  let lastScen = null;

  // ---------- Small UI helpers ----------
  function field(label, value, opts, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const id = 'f' + Math.random().toString(36).slice(2, 8);
    wrap.innerHTML = `<label for="${id}">${esc(label)}</label><div class="pair">` +
      (opts.range === false ? '' : `<input type="range" min="${opts.min}" max="${opts.max}" step="${opts.step}" value="${value}" aria-label="${esc(label)}">`) +
      `<input type="number" id="${id}" min="${opts.min}" max="${opts.max}" step="${opts.step}" value="${value}">` +
      (opts.unit ? `<span class="muted">${opts.unit}</span>` : '') + '</div>';
    const inputs = wrap.querySelectorAll('input');
    inputs.forEach(el => el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      if (isNaN(v)) return;
      inputs.forEach(o => { if (o !== el) o.value = v; });
      onChange(v);
    }));
    return wrap;
  }
  function table(el, head, rows, opts = {}) {
    const th = head.map((h, i) => `<th class="${opts.num && opts.num.includes(i) ? 'num' : ''}">${h}</th>`).join('');
    const tr = rows.map(r => `<tr class="${r.cls || ''}">` + r.cells.map((c, i) =>
      `<td class="${opts.num && opts.num.includes(i) ? 'num' : ''}">${c}</td>`).join('') + '</tr>').join('');
    el.innerHTML = `<thead><tr>${th}</tr></thead><tbody>${tr}</tbody>`;
  }
  const signed = x => `<span class="${x >= 0 ? 'pos' : 'neg'}">${x >= 0 ? '+' : ''}${zl(x)}</span>`;
  const realF = years => (S.realTerms ? K.realFactor(S.cfg, years) : 1);

  // ---------- F1 inputs ----------
  function renderInputs() {
    const box = $('inputs'); box.innerHTML = '';
    const defs = [
      ['capital', 'Kapitał na start', { min: 0, max: 500000, step: 1000, unit: 'zł' }],
      ['monthly', 'Wpłata miesięczna', { min: 0, max: 10000, step: 100, unit: 'zł' }],
      ['salary', 'Pensja brutto (miesięcznie)', { min: 4000, max: 40000, step: 100, unit: 'zł' }],
      ['age', 'Twój wiek', { min: 18, max: 70, step: 1, unit: 'lat' }],
      ['horizon', 'Ile lat oszczędzasz', { min: 1, max: 40, step: 1, unit: 'lat' }],
    ];
    defs.forEach(([k, label, o]) => box.appendChild(field(label, S.inp[k], o, v => { S.inp[k] = v; update(); })));
    $('ppkOn').checked = S.inp.ppkOn; $('ppeOn').checked = S.inp.ppeOn; $('realTerms').checked = S.realTerms;
  }

  // ---------- F8 presets ----------
  function renderPresets() {
    document.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('active', b.dataset.preset === S.preset));
    const r = S.cfg.returns;
    $('presetInfo').textContent = `ETF World ${pct(r.etfWorld)}, ETF EM ${pct(r.etfEm)}, PPK ${pct(r.ppk)}, inflacja ${pct(r.inflation)}` +
      (S.preset === 'custom' ? ' (własne)' : '');
  }
  function applyPreset(key) {
    const p = C.PRESETS[key];
    ['etfWorld', 'etfEm', 'ppk', 'ppe', 'inflation'].forEach(k => { S.cfg.returns[k] = p[k]; });
    S.preset = key;
    renderSettings(); update();
  }

  // ---------- F2 comparison ----------
  function renderCompare() {
    const cfg = S.cfg;
    const riskCls = r => (r.startsWith('niskie') ? 'low' : r.startsWith('średnie') ? 'mid' : 'high');
    const limit = k => {
      const v = C.VEHICLES[k];
      if (v.limit) return getPath(cfg, v.limit).toLocaleString('pl-PL', { maximumFractionDigits: 2 }) + ' zł / rok';
      if (k === 'ppk') return `${pct(cfg.ppk.employee)} pensji (Ty) + ${pct(cfg.ppk.employer)} (pracodawca)`;
      if (k === 'ppe') return `${pct(cfg.ppe.employer)} pensji (pracodawca)`;
      if (k === 'oki') return `brak (bez podatku do ${zl(cfg.limits.okiExempt)})`;
      return 'brak';
    };
    const order = ['ikze', 'ike', 'oki', 'ppk', 'ppe', 'edo', 'etfWorld', 'etfEm'];
    table($('compareTable'), ['Produkt', 'Limit wpłat', 'Korzyść podatkowa', 'Podatek przy wypłacie', 'Dostęp', 'Ryzyko', 'W skrócie'],
      order.map(k => { const v = C.VEHICLES[k]; return { cells: [`<b>${v.name}</b>`, limit(k), v.benefit, v.exit, v.lock,
        `<span class="tag ${riskCls(v.risk)}">${v.risk}</span>`, v.desc] }; }));
  }

  // ---------- F3 single vehicle ----------
  function renderSingle() {
    const rows = K.compareSingle(S.cfg, S.inp, S.inp.horizon);
    const f = realF(S.inp.horizon);
    const freeRows = rows.filter(r => !r.salaryBased);
    const best = freeRows.reduce((a, b) => (b.net > a.net ? b : a));
    table($('singleTable'),
      ['Produkt', 'Twoje wpłaty', 'Wartość brutto', 'Podatki', 'Na rękę' + (S.realTerms ? ' (dziś)' : ''), 'Zysk netto', 'Na 1 zł wpłaty'],
      rows.map(r => ({
        cls: r === best ? 'best' : '',
        cells: [
          `<b>${vname(r.key)}</b>` + (r.overflow > 0 ? `<br><span class="muted">w tym ${zl(r.overflow)} ponad limit → ETF</span>` : '') +
            (r.salaryBased ? '<br><span class="muted">z pensji</span>' : ''),
          zl(r.own), zl(r.gross * f), zl(r.tax * f), `<b>${zl(r.net * f)}</b>`, signed(r.net * f - r.own),
          r.multiple ? (r.multiple * f).toLocaleString('pl-PL', { maximumFractionDigits: 2 }) + ' zł' : '–',
        ],
      })), { num: [1, 2, 3, 4, 5, 6] });
  }

  // ---------- F4 waterfall order ----------
  function renderOrder() {
    const ol = $('orderList');
    ol.innerHTML = S.order.map((k, i) => `<li><span>${vname(k)}</span>` +
      `<button data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="W górę">↑</button>` +
      `<button data-move="${i}" data-dir="1" ${i === S.order.length - 1 ? 'disabled' : ''} aria-label="W dół">↓</button>` +
      `<button data-remove="${i}" ${S.order.length === 1 ? 'disabled' : ''} aria-label="Usuń">✕</button></li>`).join('');
    const missing = C.FREE_VEHICLES.filter(k => !S.order.includes(k));
    $('orderAdd').innerHTML = missing.length ? missing.map(k => `<button data-add="${k}">+ ${vname(k)}</button>`).join(' ') : '<span class="muted">wszystkie dodane</span>';
  }

  // ---------- F5 scenario editor ----------
  function renderEditor() {
    const sc = S.scenarios[S.editSlot];
    document.querySelectorAll('.slot').forEach(b => b.classList.toggle('active', b.dataset.slot === S.editSlot));
    $('scenName').value = sc.name;
    const box = $('splitEditor'); box.innerHTML = '';
    C.FREE_VEHICLES.forEach(k => box.appendChild(field(vname(k), sc.split[k] || 0, { min: 0, max: 100, step: 5, unit: '%' },
      v => { sc.split[k] = v; renderSplitSum(); update(); })));
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

  // ---------- F6 chart, F7 summary, yearly table ----------
  function computeScenarios() {
    const out = { auto: { label: 'Auto (kolejność)', res: K.runScenario(S.cfg, S.inp, K.waterfallAllocator(S.order)) } };
    SLOTS.forEach(s => { out[s] = { label: `${s}: ${S.scenarios[s].name}`, res: K.runScenario(S.cfg, S.inp, K.splitAllocator(S.scenarios[s].split)) }; });
    return out;
  }

  function renderChart(scen) {
    const ys = scen.auto.res.years;
    const labels = ys.map(y => y.age + ' l.');
    const f = y => (S.realTerms ? K.realFactor(S.cfg, y) : 1);
    const datasets = Object.keys(scen).map(k => ({
      label: scen[k].label, data: scen[k].res.years.map(y => Math.round(y.total * f(y.year))),
      borderColor: COLORS[k], backgroundColor: COLORS[k], borderWidth: 2, pointRadius: 0, tension: 0.2,
    }));
    datasets.push({ label: 'Wpłacone (Twoje pieniądze)', data: ys.map(y => Math.round(y.ownCum)), borderColor: COLORS.own,
      backgroundColor: COLORS.own, borderDash: [6, 4], borderWidth: 2, pointRadius: 0 });
    if (typeof Chart === 'undefined') { $('chart').replaceWith(Object.assign(document.createElement('p'), { textContent: 'Nie udało się wczytać wykresu.' })); return; }
    if (chart) { chart.data.labels = labels; chart.data.datasets = datasets; chart.update('none'); return; }
    chart = new Chart($('chart'), {
      type: 'line', data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { tooltip: { callbacks: { label: c => `${c.dataset.label}: ${zl(c.parsed.y)}` } }, legend: { position: 'bottom' } },
        scales: { y: { ticks: { callback: v => nf.format(v / 1000) + ' tys.' } }, x: { ticks: { maxTicksLimit: 12 } } },
      },
    });
  }

  function renderSummary(scen) {
    const f = realF(S.inp.horizon);
    const keys = Object.keys(scen);
    const best = keys.reduce((a, b) => (scen[b].res.net > scen[a].res.net ? b : a));
    const rows = keys.map(k => {
      const r = scen[k].res;
      return { cls: k === best ? 'best' : '', cells: [
        `<span class="tag" style="background:${COLORS[k]};color:#fff">${k === 'auto' ? 'Auto' : k}</span> ${esc(scen[k].label.replace(/^[ABC]: /, ''))}`,
        zl(r.ownPaid), zl(r.grossShown * f), zl(r.taxTotal * f), `<b>${zl(r.net * f)}</b>`,
        signed(r.vsBaseline * f) + ` <span class="muted">(${r.vsBaselinePct >= 0 ? '+' : ''}${pct(r.vsBaselinePct)})</span>`] };
    });
    const b = scen.auto.res;
    rows.push({ cells: ['<span class="muted">Dla porównania: wszystko na zwykłym koncie ETF World</span>', zl(b.ownPaid), '', '', zl(b.baseline * f), ''] });
    table($('summaryTable'), ['Scenariusz', 'Twoje wpłaty', 'Wartość brutto', 'Podatki', 'Na rękę' + (S.realTerms ? ' (dziś)' : ''), 'Zysk vs zwykłe konto ETF'],
      rows, { num: [1, 2, 3, 4, 5] });
    const notes = new Set();
    keys.forEach(k => scen[k].res.notes.forEach(n => notes.add(n)));
    if (S.inp.ppkOn || S.inp.ppeOn) notes.add('„Twoje wpłaty” obejmują też Twoją składkę PPK i podatek od składek pracodawcy.');
    notes.add(`Wypłata w wieku ${b.endAge} lat.`);
    $('notes').innerHTML = [...notes].map(n => `<p>${esc(n)}</p>`).join('');
  }

  const YEAR_COLS = ['ikze', 'ike', 'oki', 'edo', 'etfWorld', 'etfEm', 'ppk', 'ppe'];
  function yearRows(res) {
    return res.years.map(y => [y.year, y.age, y.own, ...YEAR_COLS.map(k => y.contrib[k]), y.total]);
  }
  function renderYearTable(scen) {
    const sel = $('yearScen');
    sel.innerHTML = Object.keys(scen).map(k => `<option value="${k}" ${k === S.yearScen ? 'selected' : ''}>${esc(scen[k].label)}</option>`).join('');
    const res = (scen[S.yearScen] || scen.auto).res;
    table($('yearTable'), ['Rok', 'Wiek', 'Twoja wpłata', ...YEAR_COLS.map(k => vname(k).replace(' (XTB)', '')), 'Wartość razem'],
      yearRows(res).map(r => ({ cells: r.map((x, i) => (i < 2 ? x : (x ? nf.format(Math.round(x)) : '–'))) })),
      { num: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11] });
  }
  function downloadCsv() {
    if (!lastScen) return;
    const res = (lastScen[S.yearScen] || lastScen.auto).res;
    const head = ['Rok', 'Wiek', 'Twoja wplata', ...YEAR_COLS.map(k => 'Wplata ' + vname(k)), 'Wartosc razem'];
    const num = x => (typeof x === 'number' ? x.toFixed(2).replace('.', ',') : x);
    const csv = [head, ...yearRows(res)].map(r => r.map(num).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `konta-inwestycyjne-${S.yearScen}.csv`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- F9 early withdrawal ----------
  function renderEarly() {
    const N = S.earlyN, endAge = S.inp.age + N, f = realF(N);
    $('earlyN').value = N; $('earlyNVal').textContent = N; $('earlyAge').textContent = `Masz wtedy ${endAge} lat.`;
    const rows = K.compareSingle(S.cfg, S.inp, N);
    table($('earlyTable'), ['Produkt', 'Twoje wpłaty', 'Na rękę' + (S.realTerms ? ' (dziś)' : ''), 'Zysk netto', 'Zasada przy wypłacie'],
      rows.map(r => ({ cells: [`<b>${vname(r.key)}</b>`, zl(r.own), `<b>${zl(r.net * f)}</b>`, signed(r.net * f - r.own), K.exitRule(r.key, endAge, S.cfg)] })),
      { num: [1, 2, 3] });
  }

  // ---------- F10 settings ----------
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
      const val = getPath(S.cfg, path);
      if (type === 'bool') {
        const l = document.createElement('label'); l.className = 'check';
        l.innerHTML = `<input type="checkbox" ${val ? 'checked' : ''}> ${esc(label)}`;
        l.querySelector('input').addEventListener('change', e => { setPath(S.cfg, path, e.target.checked); update(); });
        box.appendChild(l); return;
      }
      const shown = type === 'pct' ? +(val * 100).toFixed(4) : val;
      const opts = { range: false, min: 0, max: type === 'zl' ? 1e7 : 100, step: type === 'pct' ? 0.05 : type === 'zl' ? 1 : 1, unit: type === 'pct' ? '%' : type === 'zl' ? 'zł' : 'lat' };
      box.appendChild(field(label, shown, opts, v => {
        setPath(S.cfg, path, type === 'pct' ? v / 100 : v);
        if (isPreset) { S.preset = 'custom'; renderPresets(); }
        update();
      }));
    });
  }

  // ---------- Render all ----------
  function renderResults() {
    const scen = computeScenarios();
    lastScen = scen;
    renderPresets(); renderCompare(); renderSingle(); renderOrder(); renderSplitSum();
    renderChart(scen); renderSummary(scen); renderYearTable(scen); renderEarly();
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
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('.slot').forEach(b => b.addEventListener('click', () => { S.editSlot = b.dataset.slot; renderEditor(); save(); }));
  $('scenName').addEventListener('input', e => { S.scenarios[S.editSlot].name = e.target.value || S.editSlot; update(); });
  $('orderList').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.move !== undefined) {
      const i = +b.dataset.move, j = i + (+b.dataset.dir);
      [S.order[i], S.order[j]] = [S.order[j], S.order[i]];
    } else if (b.dataset.remove !== undefined && S.order.length > 1) S.order.splice(+b.dataset.remove, 1);
    update();
  });
  $('orderAdd').addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (b) { S.order.push(b.dataset.add); update(); } });
  $('yearScen').addEventListener('change', e => { S.yearScen = e.target.value; update(); });
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

  renderAll();

  // Offline support (works on https, e.g. github.io)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline mode is optional */ });
  }
})();
