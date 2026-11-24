// Kompas Studia results as a scroll story, in the style of the ion-trap demo:
// a sticky graphic on the left changes state as step cards scroll by on the right.
// Pure rendering + a small init; all data comes from app.js through ctx.
import { t } from '../core/i18n.js';

const ANG = { n: 0, nne: 22.5, nnw: -22.5, e: 90, w: -90, s: 135 };
const rad = d => (d - 90) * Math.PI / 180;
const f1 = n => n.toFixed(1);

// ---------------------------------------------------------------- scene
// Inputs (strengths) enter the compass from below; outputs (options) leave it at N, NNE, NNW, E, W, S.
function sceneSvg(ctx) {
  const { r, esc, wrap, tspans } = ctx, W = 800, H = 720, C = { x: 400, y: 345 }, R = 168;
  const opts = ctx.options(r), byDir = {};
  const dirs = ['n', 'nne', 'nnw', 'e', 'w', 's'];
  opts.filter(o => !o.quick).forEach((o, i) => { byDir[['n', 'nne', 'nnw'][i] || (o.no === 'M' ? 'e' : 'w')] = o; });
  const q = opts.find(o => o.quick); if (q) byDir.s = q;
  const LP = { n: [400, 48], nnw: [140, 100], nne: [660, 100], e: [604, 345], w: [196, 345], s: [598, 552] };
  const anchor = { n: 'middle', nnw: 'middle', nne: 'middle', e: 'start', w: 'end', s: 'start' };
  const strengths = ctx.proven();
  const pillW = Math.min(150, (W - 40) / Math.max(1, strengths.length) - 10);
  const sx = i => 20 + (W - 40) / strengths.length * (i + .5), sy = 664;
  let g = `<svg id="scene" class="scene" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('story.scene.aria')}">`;
  // inputs: roads from each strength into the compass
  strengths.forEach((s, i) => { g += `<path class="in in-${s.id}" pathLength="1" d="M${f1(sx(i))},${sy - 18} C${f1(sx(i))},${sy - 120} ${C.x},${C.y + R + 90} ${C.x},${C.y + R - 4}"/>`; });
  // outputs: roads from the compass to each option label
  for (const d of dirs) {
    const o = byDir[d]; if (!o) continue;
    const a = rad(ANG[d]), x1 = C.x + (R + 4) * Math.cos(a), y1 = C.y + (R + 4) * Math.sin(a);
    const side = d === 'e' || d === 'w' || d === 's';
    const [lx, ly] = LP[d], ty = side ? ly : ly + 48;
    const tx = d === 'w' ? lx + 14 : side ? lx - 14 : lx;
    g += `<path class="out out-${d}${o.quick ? ' quick' : ''}" pathLength="1" style="stroke:${o.color}" d="M${f1(x1)},${f1(y1)} C${f1(C.x + (R + 60) * Math.cos(a))},${f1(C.y + (R + 60) * Math.sin(a))} ${f1(tx + (d === 's' ? -40 : 0))},${f1(ty + (side ? 0 : 30))} ${f1(tx)},${f1(ty)}"/>`;
  }
  // rose
  g += `<circle class="ring" cx="${C.x}" cy="${C.y}" r="${R}" pathLength="1"/><circle class="ring2" cx="${C.x}" cy="${C.y}" r="${R - 26}"/>`;
  for (let t = 0; t < 32; t++) { const a = rad(t * 11.25), L = t % 8 === 0 ? 16 : t % 4 === 0 ? 10 : 5;
    g += `<line class="tick${t % 8 === 0 ? ' long' : ''}" x1="${f1(C.x + (R - L) * Math.cos(a))}" y1="${f1(C.y + (R - L) * Math.sin(a))}" x2="${f1(C.x + (R - 1) * Math.cos(a))}" y2="${f1(C.y + (R - 1) * Math.sin(a))}"/>`; }
  for (const [deg, t] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) { const a = rad(deg); g += `<text class="card-pt" x="${f1(C.x + (R - 34) * Math.cos(a))}" y="${f1(C.y + (R - 34) * Math.sin(a) + 6)}" text-anchor="middle">${t}</text>`; }
  // needle
  g += `<g class="needle" style="transform-origin:${C.x}px ${C.y}px"><polygon class="n-head" points="${C.x},${C.y - R + 30} ${C.x + 12},${C.y} ${C.x},${C.y + 9} ${C.x - 12},${C.y}"/><polygon class="n-tail" points="${C.x},${C.y + 46} ${C.x + 7},${C.y} ${C.x},${C.y - 6} ${C.x - 7},${C.y}"/></g><circle class="hub" cx="${C.x}" cy="${C.y}" r="7"/>`;
  // option labels
  for (const d of dirs) {
    const o = byDir[d]; if (!o) continue;
    const [lx, ly] = LP[d], name = o.quick ? t('story.quick_start') : o.c.card.name, side = d === 'e' || d === 'w' || d === 's';
    const lines = wrap(name, side ? 16 : 20);
    const bx = d === 'w' ? lx - 14 : side ? lx + 14 : lx, by = side ? ly : ly + 30;
    const textX = d === 'w' ? lx - 34 : side ? lx + 34 : lx;
    const tag = d === 'e' ? t('story.tag.bridge') : d === 'w' ? t('story.tag.surprise') : '';
    const nameY = side ? ly - 4 - (lines.length - 1) * 9.5 + (lines.length - 1) * 9.5 : ly - 8 - (lines.length - 1) * 19;
    g += `<g class="opt opt-${d}${o.quick ? ' quick' : ''}" data-explore="${esc(o.key)}" role="button" tabindex="0" aria-label="${t('story.scene.opt_aria', { name: esc(name) })}">
      <circle cx="${bx}" cy="${by}" r="15" style="fill:${o.color}"/><text class="ono" x="${bx}" y="${by + 5}" text-anchor="middle">${o.no}</text>
      <text class="oname" text-anchor="${anchor[d]}" style="fill:${o.quick ? 'var(--muted)' : o.color}">${side ? tspans(lines, textX, ly + 2, 19) : tspans(lines, textX, ly - 6 - (lines.length - 1) * 9.5, 19)}</text>
      ${tag ? `<text class="otag" x="${textX}" y="${ly + 2 + lines.length * 9.5 + 12}" text-anchor="${anchor[d]}">${esc(tag)}</text>` : ''}</g>`;
  }
  // strength pills
  strengths.forEach((s, i) => { const x = sx(i), name = ctx.strengthName(s.id), lines = wrap(name, 16);
    g += `<g class="spill sp-${s.id}" style="--i:${i}"><rect x="${f1(x - pillW / 2)}" y="${sy - 18}" width="${f1(pillW)}" height="${lines.length > 1 ? 50 : 36}" rx="18"/><text text-anchor="middle">${tspans(lines, x, sy + (lines.length > 1 ? 5 : 5), 17)}</text></g>`; });
  g += `<text class="scap" x="${W / 2}" y="${sy - 34}" text-anchor="middle">${t('story.scene.strengths_cap')}</text>`;
  return { svg: g + '</svg>', byDir };
}

// ---------------------------------------------------------------- tram timeline (reveals stop by stop)
function tramSvg(ctx, lines) {
  const { esc } = ctx;
  const SH = [[t('story.tram.d0'), t('story.tram.s0')], [t('story.tram.d1'), t('story.tram.s1')], [t('story.tram.d2'), t('story.tram.s2')], [t('story.tram.d3'), t('story.tram.s3')], [t('story.tram.d4'), t('story.tram.s4')]];
  const ends = [...new Set(lines.map(l => l.end))].sort();
  const rows = [...SH, ...ends.map(y => [String(y), t('story.tram.end')])];
  const n = lines.length, X0 = 250, DX = Math.min(70, 360 / Math.max(1, n - 1)), TOP = 80, RH = 64, W = Math.max(560, X0 + (n - 1) * DX + 60);
  const x = i => X0 + i * DX, y = k => TOP + k * RH, rowOf = l => SH.length + ends.indexOf(l.end);
  let g = `<svg id="tram" class="tram t-1" viewBox="0 0 ${W} ${TOP + rows.length * RH}" role="img" aria-label="${t('story.tram.aria')}">`;
  lines.forEach((l, i) => { g += `<g class="tbadge"><circle cx="${x(i)}" cy="30" r="17" style="fill:${l.color}"/><text x="${x(i)}" y="36" text-anchor="middle" class="tno">${l.no}</text></g>`;
    for (let k = 0; k < rowOf(l); k++) g += `<path class="tseg r${k + 1}" pathLength="1" d="M${x(i)},${y(k)} L${x(i)},${y(k + 1)}" style="stroke:${l.color}" ${l.quick ? 'stroke-dasharray=".08 .1"' : ''}/>`;
    g += `<path class="tseg r0" pathLength="1" d="M${x(i)},50 L${x(i)},${y(0)}" style="stroke:${l.color}"/>`; });
  rows.forEach(([d, sub], k) => {
    g += `<g class="trow r${k}"><text x="20" y="${y(k) - 2}" class="td">${esc(d)}</text><text x="20" y="${y(k) + 17}" class="ts">${esc(sub)}</text>`;
    if (k < SH.length) {
      g += `<rect class="station" x="${x(0) - 22}" y="${y(k) - 15}" width="${x(n - 1) - x(0) + 44}" height="30" rx="15"/>`;
      lines.forEach((l, i) => { const warn = k === 0 && (!l.chk.reachable || l.chk.soft);
        g += `<circle cx="${x(i)}" cy="${y(k)}" r="${warn ? 8 : 6}" class="${warn ? 'warnstop' : 'stop'}" style="stroke:${warn ? 'var(--warn)' : l.color}"/>`; });
    } else lines.forEach((l, i) => { if (rowOf(l) === k) g += `<circle cx="${x(i)}" cy="${y(k)}" r="13" style="fill:${l.color}"/><circle cx="${x(i)}" cy="${y(k)}" r="5" class="hole"/>`; });
    g += '</g>';
  });
  return g + '</svg>';
}

// ---------------------------------------------------------------- Kraków schematic
// To scale, without streets: the Vistula and the Main Square give the orientation, rings mark 2, 4 and 6 km
// from Kraków Główny. Each campus has its name and morning travel time written next to its pin.
const WISLA = [[19.870, 50.042], [19.895, 50.048], [19.913, 50.0535], [19.928, 50.053], [19.9335, 50.0505], [19.9345, 50.047], [19.940, 50.044], [19.9455, 50.044],
  [19.953, 50.0462], [19.962, 50.0515], [19.975, 50.056], [19.990, 50.0565], [20.010, 50.053], [20.035, 50.049], [20.070, 50.052]];
const RYNEK = { lat: 50.0617, lon: 19.9373 };
function krakowSvg(ctx, pins) {
  const { esc, wrap } = ctx, HUB = { lat: 50.0677, lon: 19.9476 };
  const pts = pins.filter(p => p.cp.tr?.lat);
  const all = [...pts.map(p => ({ lat: p.cp.tr.lat, lon: p.cp.tr.lon })), HUB, RYNEK];
  const k = Math.cos(50.06 * Math.PI / 180);
  let minX = Math.min(...all.map(a => a.lon * k)), maxX = Math.max(...all.map(a => a.lon * k));
  let minY = Math.min(...all.map(a => -a.lat)), maxY = Math.max(...all.map(a => -a.lat));
  // Never zoom in closer than about 3 km across, so two nearby campuses do not fill the whole frame.
  const grow = (lo, hi, min) => { const d = Math.max(0, min - (hi - lo)) / 2; return [lo - d, hi + d]; };
  [minX, maxX] = grow(minX, maxX, .028); [minY, maxY] = grow(minY, maxY, .028);
  const W = 760, H = 600, padX = 200, padY = 64, s = Math.min((W - 2 * padX) / (maxX - minX), (H - 2 * padY) / (maxY - minY));
  const P = a => [padX + (a.lon * k - minX) * s + ((W - 2 * padX) - (maxX - minX) * s) / 2, padY + (-a.lat - minY) * s + ((H - 2 * padY) - (maxY - minY) * s) / 2];
  const km = s / 111.32; // pixels per km (one degree of latitude is about 111 km)
  const [hx, hy] = P(HUB), [rx, ry] = P(RYNEK);
  let g = `<svg id="krk" class="krk" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('story.krk.aria')}">
    <defs><clipPath id="krkclip"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22"/></clipPath></defs>
    <rect class="kframe" x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22"/><g clip-path="url(#krkclip)">`;
  const wp = WISLA.map(([lon, lat]) => P({ lat, lon }));
  let d = `M${f1(wp[0][0])},${f1(wp[0][1])}`;
  for (let i = 1; i < wp.length - 1; i++) { const mx = (wp[i][0] + wp[i + 1][0]) / 2, my = (wp[i][1] + wp[i + 1][1]) / 2; d += ` Q${f1(wp[i][0])},${f1(wp[i][1])} ${f1(mx)},${f1(my)}`; }
  d += ` L${f1(wp[wp.length - 1][0])},${f1(wp[wp.length - 1][1])}`;
  g += `<path class="kriver" d="${d}"/>`;
  const wl = wp.filter(([x, y]) => x > 60 && x < W - 90 && y > 30 && y < H - 20).pop();
  if (wl) g += `<text class="kriverl" x="${f1(wl[0] + 8)}" y="${f1(wl[1] + 26)}">${t('story.krk.vistula')}</text>`;
  for (const m of [2, 4, 6]) g += `<circle class="kring" cx="${f1(hx)}" cy="${f1(hy)}" r="${f1(m * km)}"/><text class="kringl" x="${f1(hx + m * km * .707 + 5)}" y="${f1(hy + m * km * .707 + 12)}">${t('story.krk.km', { m })}</text>`;
  const rynekFree = pts.every(p => { const [x, y] = P(p.cp.tr); return Math.hypot(x - rx, y - ry) > 34; });
  g += `<rect class="krynek" x="${f1(rx - 6)}" y="${f1(ry - 6)}" width="12" height="12" rx="2"/>${rynekFree ? `<text class="krynekl" x="${f1(rx)}" y="${f1(ry + 22)}" text-anchor="middle">${t('story.krk.rynek')}</text>` : ''}`;
  pts.forEach((p, i) => { const [x, y] = P(p.cp.tr);
    g += `<path class="kline" pathLength="1" style="stroke:${p.color};--i:${i}" d="M${f1(hx)},${f1(hy)} L${f1(x)},${f1(y)}"/>`; });
  g += '</g>';
  g += `<g class="khub"><circle cx="${f1(hx)}" cy="${f1(hy)}" r="9"/><text x="${f1(hx + 14)}" y="${f1(hy - 10)}">${t('story.krk.hub')}</text></g>`;
  // Labels stand in a column beside the cloud of pins (left of it, or right of it for campuses east of the station),
  // each joined to its pin by a thin leader, so names never cover pins or each other.
  const lab = pts.map((p, i) => { const [x, y] = P(p.cp.tr); return { p, i, x, y, left: x < hx, lines: wrap(p.cp.name, 22).slice(0, 2) }; });
  for (const side of [true, false]) {
    const col = lab.filter(l => l.left === side).sort((a, b) => a.y - b.y);
    if (!col.length) continue;
    const edge = side ? Math.min(...col.map(l => l.x)) - 34 : Math.max(...col.map(l => l.x), hx + 120) + 34;
    const hs = col.map(l => 24 + l.lines.length * 16), total = hs.reduce((a, b) => a + b, 0);
    let y0 = Math.max(20, Math.min(H - 12 - total, col.reduce((t, l) => t + l.y, 0) / col.length - total / 2));
    col.forEach((l, j) => { l.tx = edge; l.ly = y0 + 16; y0 += hs[j]; });
  }
  lab.forEach(l => { const tm = l.p.cp.tr.fromHub, anchor = l.left ? 'end' : 'start', n = l.lines.length, my = l.ly + (n - 1) * 8 + 2;
    g += `<g class="klabel" style="--i:${l.i}"><path class="klead" style="stroke:${l.p.color}" d="M${f1(l.x)},${f1(l.y)} L${f1(l.tx + (l.left ? 8 : -8))},${f1(my)}"/>
      <text class="kname" text-anchor="${anchor}">${l.lines.map((ln, j) => `<tspan x="${f1(l.tx)}" y="${f1(l.ly + j * 16)}">${esc(ln)}</tspan>`).join('')}</text>
      ${tm ? `<text class="kmin" text-anchor="${anchor}" x="${f1(l.tx)}" y="${f1(l.ly + n * 16)}">${t('story.krk.min_from_hub', { min: tm.median })}</text>` : ''}</g>`; });
  pts.forEach((p, i) => { const [x, y] = P(p.cp.tr);
    g += `<g class="kpin" data-pin="${esc(p.cp.id)}" style="--i:${i}" tabindex="0" role="button" aria-label="${esc(p.cp.name)}"><circle class="kpulse" cx="${f1(x)}" cy="${f1(y)}" r="14" style="fill:${p.color}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="14" style="fill:${p.color}"/>
      <text x="${f1(x)}" y="${f1(y + 4.5)}" text-anchor="middle" class="kno">${esc(p.no)}</text></g>`; });
  return g + '</svg>';
}

// ---------------------------------------------------------------- page
export function storyHtml(ctx) {
  const { r, esc, icon } = ctx, s = r.slots;
  const opts = ctx.options(r), scene = sceneSvg(ctx), lines = ctx.tramLines(r);
  const strengths = ctx.proven();
  const o1 = opts[0], o2 = opts[1], o3 = opts[2];
  const most = opts.find(o => o.no === 'M'), sur = opts.find(o => o.no === 'N'), quick = opts.find(o => o.quick);
  const dims = r.profile.top.map(d => ({ d, name: ctx.dimName(d), v: Math.round(r.profile.score[d]) }));
  const first = o => o.quick ? o.quick.offer : (o.c.offers.find(x => x.check.reachable) || o.c.offers[0])?.offer;
  const optLine = o => { const f = first(o); return f ? `${esc(f.name)}, ${esc(ctx.shortInst(f.institution))}` : t('story.opt.none'); };
  const badge = o => `<span class="nb" style="background:${o.color}">${o.no}</span>`;
  const warnLines = lines.filter(l => !l.chk.reachable || l.chk.soft);
  const insts = [...new Set(lines.map(l => ctx.shortInst(l.o.institution)))];
  const pins = [], seen = new Set();
  lines.forEach(l => { const cp = ctx.campus(l.o.campus); if (cp && !seen.has(cp.id)) { seen.add(cp.id); pins.push({ cp, color: l.color, no: l.no, short: l.o.institution, offer: l.o }); } });

  const step = (i, body, wide) => `<div class="step" data-step="${i}"><div class="scard${wide ? ' wide' : ''}">${body}</div></div>`;

  return `
  <div class="sprog" id="sprog"></div>
  <header class="sbar">
    <button class="pill" data-go="refleksja">${t('story.back_questions')}</button>
    <nav class="snav" aria-label="${t('story.nav.aria')}">${[['s-kompas', t('story.nav.kompas')], ['s-kierunki', t('story.nav.kierunki')], ['s-porownanie', t('story.nav.porownanie')], ['s-droga', t('story.nav.droga')], ['s-deklaracja', t('story.nav.deklaracja')], ['s-krakow', t('story.nav.krakow')], ['s-przyszlosc', t('story.nav.przyszlosc')], ['s-plan', t('story.nav.plan')], ['s-plik', t('story.nav.plik')]].map(([id, label]) => `<a href="#/kompas" data-jump="${id}">${label}</a>`).join('')}</nav>
    <span class="sbar-r"><button class="pill icon" data-skintoggle aria-label="${t('story.skin_toggle')}"></button><button class="pill icon" data-themetoggle aria-label="${t('story.theme_toggle')}"></button><button class="pill strong" data-export="download">${t('story.save_file')}</button></span>
  </header>

  <section class="scrolly" id="s-kompas">
    <div class="sticky"><div class="graphic">${scene.svg}</div></div>
    <div class="steps">
      ${step(0, `<span class="kicker">${t('story.hero.kicker', { date: esc(ctx.today) })}</span><h1>${t('story.hero.title')}</h1>
        <p class="lead">${t('story.hero.lead')}</p>
        <span class="cue">${t('story.hero.cue')}</span>`, true)}
      ${step(1, `<span class="kicker">${t('story.proof.kicker')}</span><h3>${t('story.proof.title')}</h3>
        <p class="small muted">${t('story.proof.note')}</p>
        <ul class="proofs">${strengths.map(x => `<li><b>${esc(ctx.strengthName(x.id))}</b><span>${esc(ctx.proofText(x.proof))}</span></li>`).join('')}</ul>`)}
      ${step(2, `<span class="kicker">${t('story.dims.kicker')}</span><h3>${t('story.dims.title')}</h3>
        <p>${t('story.dims.text', { a: esc(dims[0].name.toLowerCase()), b: esc(dims[1].name.toLowerCase()) })}</p>
        <div class="minibars">${dims.map((x, i) => `<div class="mb${i < 2 ? ' main' : ''}"><span>${esc(x.name)}</span><i><b style="width:${x.v}%"></b></i></div>`).join('')}</div>
        <p class="small muted">${t('story.dims.values', { list: (ctx.A.values || []).map(ctx.valueName).map(esc).join(', ') })}</p>`)}
      ${step(3, `<span class="kicker">${t('story.n.kicker')}</span><h3>${badge(o1)} ${esc(o1.c.card.name)}</h3>
        <p>${esc(o1.c.card.whoYouHelp)}</p>
        ${o1.c.strengthsUsed.length ? `<p class="small">${t('story.n.leading', { tags: o1.c.strengthsUsed.map(p => `<span class="tag">${esc(p.label)}</span>`).join(' ') })}</p>` : ''}
        <p class="small muted">${o1.c.reasons.map(esc).join(' · ')}</p>
        <p class="small">${icon('school', 'ico sm')} ${optLine(o1)}</p>`)}
      ${step(4, `<span class="kicker">${t('story.nne.kicker')}</span><h3>${t('story.nne.title')}</h3>
        ${[o2, o3].filter(Boolean).map(o => `<div class="mini">${badge(o)}<div><b>${esc(o.c.card.name)}</b><span class="small">${esc(o.c.card.whoYouHelp)}</span><span class="small muted">${icon('school', 'ico sm')} ${optLine(o)}</span></div></div>`).join('')}
        <p class="small muted">${t('story.nne.note')}</p>`)}
      ${step(5, `<span class="kicker">${t('story.ews.kicker')}</span><h3>${t('story.ews.title')}</h3>
        ${most ? `<div class="mini">${badge(most)}<div><b>${t('story.most.name', { name: esc(most.c.card.name) })}</b><span class="small">${t('story.most.text')}</span></div></div>` : ''}
        ${sur ? `<div class="mini">${badge(sur)}<div><b>${t('story.surprise.name', { name: esc(sur.c.card.name) })}</b><span class="small">${t('story.surprise.text')}</span></div></div>` : ''}
        ${quick ? `<div class="mini">${badge(quick)}<div><b>${t('story.quick.name', { name: esc(quick.quick.offer.name) })}</b><span class="small">${t('story.quick.text', { years: String(quick.quick.offer.durationYears).replace('.', ',') })}</span></div></div>` : ''}`)}
      ${step(6, `<span class="kicker">${t('story.next.kicker')}</span><h3>${t('story.next.title')}</h3>
        <p>${t('story.next.text')}</p>
        <button class="sbtn" data-jump="s-kierunki">${t('story.next.button')}</button>
        <p class="small muted">${t('story.next.short')}</p>`)}
    </div>
  </section>

  <section class="band" id="s-kierunki">
    <div class="wrap">
      <span class="kicker">${t('story.dirs.kicker')}</span><h2>${t('story.dirs.title')}</h2>
      <p class="lead">${t('story.dirs.lead')}</p>
      ${ctx.confLine(r.profile.confidence)}
      <div class="explore">
        <div class="elist" role="tablist" aria-label="${t('story.dirs.aria')}">${opts.map((o, i) => `<button role="tab" class="eitem" data-pickopt="${esc(o.key)}" aria-selected="${i === 0}" style="--c:${o.color}">${badge(o)}<span><b>${esc(o.quick ? t('story.quick_start') : o.c.card.name)}</b><span class="small muted">${esc(o.slot)}</span></span></button>`).join('')}</div>
        <div class="epanel" id="epanel" role="tabpanel" aria-live="polite">${ctx.panelHtml(opts[0])}</div>
      </div>
    </div>
  </section>

  <section class="band alt" id="s-porownanie"><div class="wrap"><span class="kicker">${t('story.cmp.kicker')}</span><div id="cmpwrap">${ctx.cmpHtml()}</div></div></section>

  <section class="scrolly flip" id="s-droga">
    <div class="sticky"><div class="graphic">${tramSvg(ctx, lines)}</div></div>
    <div class="steps">
      ${step(0, `<span class="kicker">${t('story.route.kicker')}</span><h2>${t('story.route.title')}</h2>
        <p class="lead">${t('story.route.lead')}</p>
        <div class="legend">${lines.map(l => `<span>${badge(l)} ${esc(l.name)}</span>`).join('')}</div>`, true)}
      ${step(1, `<span class="kicker">${t('story.stop1.kicker')}</span><h3>${t('story.stop1.title')}</h3>
        <p>${t('story.stop1.text')}</p>
        ${warnLines.length ? `<div class="warnbox">${warnLines.map(l => `<p>${badge(l)} <b>${esc(l.name)}</b>: ${esc(l.chk.soft ? t('story.stop1.soft', { soft: l.chk.soft }) : l.chk.blocked[0] || t('story.stop1.change'))}</p>`).join('')}</div>` : `<p class="ok">${t('story.stop1.ok')}</p>`}
        <p class="small"><a href="#/kompas" data-jump="s-deklaracja">${t('story.stop1.link')}</a></p>`)}
      ${step(2, `<span class="kicker">${t('story.stop2.kicker')}</span><h3>${t('story.stop2.title')}</h3><p>${t('story.stop2.text', { list: insts.map(esc).join(', ') })}</p>
        <p class="small muted">${t('story.stop2.experiment', { text: esc(s.best[0].card.experiment) })}</p>`)}
      ${step(3, `<span class="kicker">${t('story.stop3.kicker')}</span><h3>${t('story.stop3.title')}</h3><p>${t('story.stop3.text')}</p>`)}
      ${step(4, `<span class="kicker">${t('story.stop4.kicker')}</span><h3>${t('story.stop4.title')}</h3><p>${t('story.stop4.text')}</p>`)}
      ${step(5, `<span class="kicker">${t('story.stop5.kicker')}</span><h3>${t('story.stop5.title')}</h3>${lines.map(l => `<p class="small">${badge(l)} ${esc(l.o.name)}, ${esc(ctx.shortInst(l.o.institution))}</p>`).join('')}`)}
      ${step(6, `<span class="kicker">${t('story.end.kicker')}</span><h3>${t('story.end.title')}</h3>${lines.map(l => `<p class="small">${badge(l)} ${t('story.end.ok', { year: l.end })}${l.o.next ? ': ' + esc(l.o.next) : ''}</p>`).join('')}`)}
    </div>
  </section>

  <section class="band" id="s-deklaracja"><div class="wrap" id="declwrap">${ctx.declHtml()}</div></section>

  <section class="band alt" id="s-krakow">
    <div class="wrap two">
      <div><span class="kicker">${t('story.krakow.kicker')}</span><h2>${t('story.krakow.title')}</h2>
        <p class="lead">${t('story.krakow.lead')}</p>
        <div class="klist">${pins.map(p => `<div class="kitem" data-pinrow="${esc(p.cp.id)}">${badge(p)}<div><b>${esc(p.cp.name)}</b><span class="small">${esc(p.cp.address)}</span>
          <span class="small">${icon('tram', 'ico sm')} ${ctx.transit(p.cp)}</span><span class="small">${ctx.commute(p.cp)} · <a href="${ctx.routeUrl(p.cp)}" target="_blank" rel="noopener">${t('story.krakow.route')}</a></span></div></div>`).join('')}</div>
        <p class="small muted">${ctx.transportNote()}</p></div>
      <div class="kmap">${krakowSvg(ctx, pins)}<p class="small muted center">${t('story.krakow.caption')}</p></div>
    </div>
  </section>

  <section class="band" id="s-przyszlosc"><div class="wrap" id="futurewrap">${futureHtml(ctx)}</div></section>

  <section class="band alt" id="s-plan"><div class="wrap" id="planwrap">${ctx.planHtml()}</div></section>

  <section class="band" id="s-plik">
    <div class="wrap two">
      <div><span class="kicker">${t('story.file.kicker')}</span><h2>${t('story.file.title')}</h2>
        <p class="lead">${t('story.file.lead')}</p>
        <label class="field" for="cando">${t('story.file.cando')}</label>
        ${ctx.candoChips()}<input id="cando" type="text" data-field="canDo" value="${esc(ctx.A.canDo)}">
        <div class="sactions"><button class="sbtn" data-export="download">${t('story.file.download')}</button><button class="sbtn ghost" data-export="print">${t('story.file.print')}</button><button class="sbtn ghost" data-export="copy">${t('story.file.copy')}</button>
          <label class="sbtn ghost filebtn">${t('story.file.load')}<input type="file" accept=".md,text/markdown,text/plain" data-load></label></div>
        <p id="msg" class="small muted" role="status"></p>
        ${ctx.changes()}</div>
      <div>${ctx.doubtHtml()}
        <div class="pcard"><h3>${t('story.parent.title')}</h3><ul><li>${t('story.parent.1')}</li><li>${t('story.parent.2')}</li><li>${t('story.parent.3')}</li><li>${t('story.parent.4')}</li></ul></div>
        <button class="sbtn ghost" data-go="pewnosc">${t('story.change_answers')}</button></div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------- future (scenario pick at the end)
const NEED = { wysoka: 3, 'średnia': 2, niska: 1 };
// Display text for the (identifier) levels above; the level itself stays as stored in the cards.
const needLabel = lvl => ({ wysoka: t('story.need.wysoka'), 'średnia': t('story.need.srednia'), niska: t('story.need.niska') })[lvl] ?? lvl;
export function futureHtml(ctx) {
  const { r, esc, icon, data, A } = ctx, sc = data.scenarios.scenarios, my = sc.find(x => x.id === A.scenario);
  const opts = ctx.options(r).filter(o => !o.quick);
  let res = `<p class="pick-hint">${t('story.future.hint')}</p>`;
  if (my) {
    const forces = data.scenarios.forces.filter(f => my.emphasis.includes(f.id));
    const ranked = [...opts].sort((a, b) => (NEED[b.c.card.robustness[my.id]] || 0) - (NEED[a.c.card.robustness[my.id]] || 0));
    const shown = new Set(opts.map(o => o.c.card.id));
    const extra = r.cards.filter(c => !shown.has(c.card.id) && c.card.robustness[my.id] === 'wysoka' && forces.some(f => f.id === c.card.force) && c.fit >= 55).slice(0, 3);
    res = `<div class="fgrid">
      <div><h3>${t('story.future.forces')}</h3>${forces.map((f, i) => `<div class="fforce" style="--i:${i}">${icon(ctx.FORCE_ICON[f.id], 'ico big')}<div><b>${esc(f.name)}</b><span class="small">${esc(f.text)}</span></div></div>`).join('')}</div>
      <div><h3>${t('story.future.yours')}</h3>${ranked.map((o, i) => { const v = NEED[o.c.card.robustness[my.id]] || 0;
        return `<div class="fneed" style="--i:${i}"><span class="nb" style="background:${o.color}">${o.no}</span><span class="fn">${esc(o.c.card.name)}${o.c.card.robustnessNote ? `<span class="small muted">${esc(o.c.card.robustnessNote)}</span>` : ''}</span><span class="fbar"><b style="width:${v * 33.3}%;background:${o.color}"></b></span><span class="small">${esc(needLabel(o.c.card.robustness[my.id]))}</span></div>`; }).join('')}
        <p class="small muted">${t('story.future.note')}</p>
        ${extra.length ? `<h3>${t('story.future.extra')}</h3>${extra.map(c => `<div class="fextra">${icon(c.card.cluster)}<div><b>${esc(c.card.name)}</b><span class="small">${esc(c.card.whoYouHelp)}</span></div></div>`).join('')}` : ''}</div></div>`;
  }
  return `<span class="kicker">${t('story.future.kicker')}</span><h2>${t('story.future.title')}</h2>
    <p class="lead">${t('story.future.lead')}</p>
    <div class="scen3">${sc.map(x => `<button class="scen-b" data-scen="${x.id}" aria-pressed="${A.scenario === x.id}">${ctx.scenArt(x.id)}<b>${esc(x.name)}</b><span class="small">${esc(x.text)}</span></button>`).join('')}</div>
    <div class="fres">${res}</div>`;
}

// ---------------------------------------------------------------- behaviour
export function storyInit(root, ctx) {
  const scene = root.querySelector('#scene'), tram = root.querySelector('#tram');
  const scrolly = (sec, on) => {
    const steps = [...sec.querySelectorAll('.step')];
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { steps.forEach(s => s.classList.toggle('active', s === e.target)); on(+e.target.dataset.step); } }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
    return io;
  };
  const ios = [];
  ios.push(scrolly(root.querySelector('#s-kompas'), i => { scene.setAttribute('class', `scene st${i}`); highlightInputs(i); }));
  ios.push(scrolly(root.querySelector('#s-droga'), i => {
    const lim = i >= 6 ? 99 : i - 1;
    tram.querySelectorAll('.tseg, .trow').forEach(el => { const k = +([...el.classList].find(c => /^r\d+$/.test(c)) || 'r99').slice(1); el.classList.toggle('on', k <= lim); });
  }));
  // Strength roads light up for the options on screen.
  const opts = ctx.options(ctx.r);
  function highlightInputs(i) {
    const used = new Set();
    const on = i === 3 ? opts.slice(0, 1) : i >= 4 ? opts.slice(0, 3) : [];
    on.forEach(o => !o.quick && o.c.strengthsUsed.forEach(p => used.add(p.id)));
    scene.querySelectorAll('.spill, .in').forEach(el => { const id = [...el.classList].find(c => c.startsWith('sp-') || c.startsWith('in-'))?.slice(3);
      el.classList.toggle('dim', i >= 3 && !used.has(id)); });
  }
  // Progress bar and section links.
  const bar = root.querySelector('#sprog');
  const onScroll = () => { const h = document.documentElement; bar.style.width = (100 * h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) + '%'; };
  window.addEventListener('scroll', onScroll, { passive: true });
  const links = [...root.querySelectorAll('.snav a')];
  const secIo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.dataset.jump === e.target.id)); }), { rootMargin: '-50% 0px -50% 0px' });
  root.querySelectorAll('section[id]').forEach(s => secIo.observe(s));
  ios.push(secIo);
  // Kraków: dots and list highlight each other.
  const hl = id => { root.querySelectorAll('[data-pin]').forEach(p => p.classList.toggle('on', p.dataset.pin === id)); root.querySelectorAll('[data-pinrow]').forEach(p => p.classList.toggle('on', p.dataset.pinrow === id)); };
  root.addEventListener('mouseover', e => { const p = e.target.closest('[data-pin],[data-pinrow]'); if (p) hl(p.dataset.pin || p.dataset.pinrow); });
  // Reveal-on-view for bands (fade up), like the ion-trap sections.
  const rev = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .15 });
  root.querySelectorAll('.band, .kmap').forEach(b => rev.observe(b));
  ios.push(rev);
  // Keyboard: Enter or Space on the SVG buttons (compass directions, studies, map pins).
  const onKey = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-study],[data-explore],[data-pin]')) { e.preventDefault(); storyClick(e.target, root, ctx); } };
  root.addEventListener('keydown', onKey);
  return () => { ios.forEach(io => io.disconnect()); window.removeEventListener('scroll', onScroll); root.removeEventListener('keydown', onKey); };
}

// Clicks inside the story that only change part of the page (no full re-render, so the scroll stays put).
export function storyClick(t, root, ctx) {
  const d = t.dataset;
  if (d.jump) { root.querySelector('#' + d.jump)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return true; }
  if (d.pickopt !== undefined || d.explore !== undefined) {
    const key = d.pickopt ?? d.explore, o = ctx.options(ctx.r).find(x => x.key === key);
    if (!o) return true;
    root.querySelectorAll('.eitem').forEach(b => b.setAttribute('aria-selected', String(b.dataset.pickopt === key)));
    root.querySelector('#epanel').innerHTML = ctx.panelHtml(o);
    if (d.explore !== undefined) root.querySelector('#s-kierunki').scrollIntoView({ behavior: 'smooth' });
    return true;
  }
  if (d.study) {
    const panel = t.closest('.pgrid') || root, box = panel.querySelector('.studydetail'), was = box.dataset.open === d.study;
    panel.querySelectorAll('.vstudy').forEach(g => { const on = !was && g.dataset.study === d.study; g.classList.toggle('sel', on); g.setAttribute('aria-expanded', String(on)); });
    box.dataset.open = was ? '' : d.study;
    box.innerHTML = was ? '' : ctx.studyHtml(d.study);
    if (!was) box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    return true;
  }
  if (d.pin) { root.querySelectorAll('[data-pin]').forEach(p => p.classList.toggle('on', p.dataset.pin === d.pin)); return true; }
  if (d.scen) { ctx.A.scenario = ctx.A.scenario === d.scen ? null : d.scen; ctx.r = ctx.rescore(); ctx.touch(); root.querySelector('#futurewrap').innerHTML = futureHtml(ctx); return true; }
  if (d.planfocus !== undefined) { ctx.A.plan = { focus: d.planfocus }; ctx.touch(); root.querySelector('#planwrap').innerHTML = ctx.planHtml();
    root.querySelector(`[data-planfocus="${CSS.escape(d.planfocus)}"]`)?.focus({ preventScroll: true }); return true; }
  return false;
}
