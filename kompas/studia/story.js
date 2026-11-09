// Kompas Studia results as a scroll story, in the style of the ion-trap demo:
// a sticky graphic on the left changes state as step cards scroll by on the right.
// Pure rendering + a small init; all data comes from app.js through ctx.

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
  let g = `<svg id="scene" class="scene" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kompas: twoje mocne strony wchodzą od dołu, kierunki wychodzą na północ, wschód, zachód i południe.">`;
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
  for (const [d, t] of [['n', 'N'], ['e', 'E'], ['s', 'S'], ['w', 'W']]) { const a = rad(ANG[d]); g += `<text class="card-pt" x="${f1(C.x + (R - 34) * Math.cos(a))}" y="${f1(C.y + (R - 34) * Math.sin(a) + 6)}" text-anchor="middle">${t}</text>`; }
  // petals: his six orientations, top two in colour
  const dims = r.profile.dims, top2 = r.profile.top.slice(0, 2);
  dims.forEach((d, k) => { const a = k * 60 + 30, v = r.profile.score[d], len = 22 + v * 0.92, main = top2.includes(d);
    const p = (ang, rr) => [C.x + rr * Math.cos(rad(ang)), C.y + rr * Math.sin(rad(ang))];
    const [tx, ty] = p(a, len), [lx, ly] = p(a - 13, len * .55), [rx, ry] = p(a + 13, len * .55);
    g += `<path class="petal${main ? ' main' : ''}" style="--k:${k}" d="M${C.x},${C.y} Q${f1(lx)},${f1(ly)} ${f1(tx)},${f1(ty)} Q${f1(rx)},${f1(ry)} ${C.x},${C.y}Z"/>`;
    if (main) { const [nx, ny] = p(a, len + 14); g += `<text class="petal-l" x="${f1(nx)}" y="${f1(ny + 4)}" text-anchor="middle">${esc(ctx.dimName(d).toLowerCase())}</text>`; }
  });
  // needle
  g += `<g class="needle" style="transform-origin:${C.x}px ${C.y}px"><polygon class="n-head" points="${C.x},${C.y - R + 30} ${C.x + 12},${C.y} ${C.x},${C.y + 9} ${C.x - 12},${C.y}"/><polygon class="n-tail" points="${C.x},${C.y + R - 40} ${C.x + 9},${C.y} ${C.x},${C.y - 6} ${C.x - 9},${C.y}"/></g><circle class="hub" cx="${C.x}" cy="${C.y}" r="7"/>`;
  // option labels
  for (const d of dirs) {
    const o = byDir[d]; if (!o) continue;
    const [lx, ly] = LP[d], name = o.quick ? 'Szybki start' : o.c.card.name, side = d === 'e' || d === 'w' || d === 's';
    const lines = wrap(name, side ? 16 : 20);
    const bx = d === 'w' ? lx - 14 : side ? lx + 14 : lx, by = side ? ly : ly + 30;
    const textX = d === 'w' ? lx - 34 : side ? lx + 34 : lx;
    const tag = d === 'e' ? 'Most' : d === 'w' ? 'Niespodzianka' : '';
    const nameY = side ? ly - 4 - (lines.length - 1) * 9.5 + (lines.length - 1) * 9.5 : ly - 8 - (lines.length - 1) * 19;
    g += `<g class="opt opt-${d}${o.quick ? ' quick' : ''}" data-explore="${esc(o.key)}" role="button" tabindex="0" aria-label="${esc(name)}: zobacz z bliska">
      <circle cx="${bx}" cy="${by}" r="15" style="fill:${o.color}"/><text class="ono" x="${bx}" y="${by + 5}" text-anchor="middle">${o.no}</text>
      <text class="oname" text-anchor="${anchor[d]}" style="fill:${o.quick ? 'var(--muted)' : o.color}">${side ? tspans(lines, textX, ly + 2, 19) : tspans(lines, textX, ly - 6 - (lines.length - 1) * 9.5, 19)}</text>
      ${tag ? `<text class="otag" x="${textX}" y="${ly + 2 + lines.length * 9.5 + 12}" text-anchor="${anchor[d]}">${esc(tag)}</text>` : ''}</g>`;
  }
  // strength pills
  strengths.forEach((s, i) => { const x = sx(i), name = ctx.strengthName(s.id), lines = wrap(name, 16);
    g += `<g class="spill sp-${s.id}" style="--i:${i}"><rect x="${f1(x - pillW / 2)}" y="${sy - 18}" width="${f1(pillW)}" height="${lines.length > 1 ? 50 : 36}" rx="18"/><text text-anchor="middle">${tspans(lines, x, sy + (lines.length > 1 ? 5 : 5), 17)}</text></g>`; });
  g += `<text class="scap" x="${W / 2}" y="${sy - 34}" text-anchor="middle">TWOJE MOCNE STRONY</text>`;
  return { svg: g + '</svg>', byDir };
}

// ---------------------------------------------------------------- tram timeline (reveals stop by stop)
function tramSvg(ctx, lines) {
  const { esc } = ctx;
  const SH = [['do 7 lutego 2027', 'deklaracja maturalna'], ['marzec–kwiecień', 'dni otwarte'], ['maj 2027', 'matura'], ['lipiec–sierpień', 'rekrutacja i zapisy'], ['jesień 2027', 'start nauki']];
  const ends = [...new Set(lines.map(l => l.end))].sort();
  const rows = [...SH, ...ends.map(y => [String(y), 'dyplom, pierwsza praca'])];
  const n = lines.length, X0 = 250, DX = Math.min(70, 360 / Math.max(1, n - 1)), TOP = 80, RH = 64, W = Math.max(560, X0 + (n - 1) * DX + 60);
  const x = i => X0 + i * DX, y = k => TOP + k * RH, rowOf = l => SH.length + ends.indexOf(l.end);
  let g = `<svg id="tram" class="tram t-1" viewBox="0 0 ${W} ${TOP + rows.length * RH}" role="img" aria-label="Linie w czasie: kroki od dziś do pierwszej pracy dla każdej opcji.">`;
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
function krakowSvg(ctx, pins) {
  const { esc } = ctx, HUB = { lat: 50.0677, lon: 19.9476 };
  const pts = pins.filter(p => p.cp.tr?.lat);
  const all = [...pts.map(p => ({ lat: p.cp.tr.lat, lon: p.cp.tr.lon })), HUB];
  const k = Math.cos(50.06 * Math.PI / 180);
  const minX = Math.min(...all.map(a => a.lon * k)), maxX = Math.max(...all.map(a => a.lon * k));
  const minY = Math.min(...all.map(a => -a.lat)), maxY = Math.max(...all.map(a => -a.lat));
  const W = 640, H = 520, pad = 70, s = Math.min((W - 2 * pad) / Math.max(1e-4, maxX - minX), (H - 2 * pad) / Math.max(1e-4, maxY - minY));
  const P = a => [pad + (a.lon * k - minX) * s + ((W - 2 * pad) - (maxX - minX) * s) / 2, pad + (-a.lat - minY) * s + ((H - 2 * pad) - (maxY - minY) * s) / 2];
  const km = s * (1 / 111.32); // pixels per km (latitude degree ≈ 111 km)
  const [hx, hy] = P(HUB);
  let g = `<svg id="krk" class="krk" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schemat Krakowa: uczelnie twoich opcji i czas dojazdu z Dworca Głównego.">`;
  for (const m of [2, 4, 6]) g += `<circle class="kring" cx="${f1(hx)}" cy="${f1(hy)}" r="${f1(m * km)}"/><text class="kringl" x="${f1(hx + m * km * .707 + 4)}" y="${f1(hy - m * km * .707 - 4)}">${m} km</text>`;
  pts.forEach((p, i) => { const [x, y] = P(p.cp.tr); const t = p.cp.tr.fromHub;
    g += `<path class="kline" pathLength="1" style="stroke:${p.color};--i:${i}" d="M${f1(hx)},${f1(hy)} L${f1(x)},${f1(y)}"/>`;
    if (t && Math.hypot(x - hx, y - hy) > 90) g += `<text class="kmin" style="--i:${i}" x="${f1((hx + x) / 2)}" y="${f1((hy + y) / 2 - 6)}" text-anchor="middle">${t.median} min</text>`; });
  g += `<g class="khub"><circle cx="${f1(hx)}" cy="${f1(hy)}" r="10"/><text x="${f1(hx)}" y="${f1(hy + 28)}" text-anchor="middle">Dworzec Główny</text></g>`;
  pts.forEach((p, i) => { const [x, y] = P(p.cp.tr);
    g += `<g class="kpin" data-pin="${esc(p.cp.id)}" style="--i:${i}" tabindex="0" role="button" aria-label="${esc(p.cp.name)}"><circle class="kpulse" cx="${f1(x)}" cy="${f1(y)}" r="13" style="fill:${p.color}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="13" style="fill:${p.color}"/>
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
  const optLine = o => { const f = first(o); return f ? `${esc(f.name)}, ${esc(ctx.shortInst(f.institution))}` : 'brak kierunku w tej wersji'; };
  const badge = o => `<span class="nb" style="background:${o.color}">${o.no}</span>`;
  const warnLines = lines.filter(l => !l.chk.reachable || l.chk.soft);
  const insts = [...new Set(lines.map(l => ctx.shortInst(l.o.institution)))];
  const pins = [], seen = new Set();
  lines.forEach(l => { const cp = ctx.campus(l.o.campus); if (cp && !seen.has(cp.id)) { seen.add(cp.id); pins.push({ cp, color: l.color, no: l.no, short: l.o.institution, offer: l.o }); } });

  const step = (i, body, wide) => `<div class="step" data-step="${i}"><div class="scard${wide ? ' wide' : ''}">${body}</div></div>`;

  return `
  <div class="sprog" id="sprog"></div>
  <header class="sbar">
    <button class="pill" data-go="refleksja">← Pytania</button>
    <nav class="snav" aria-label="Części wyników">${[['s-kompas', 'Kompas'], ['s-kierunki', 'Kierunki'], ['s-droga', 'Droga'], ['s-krakow', 'Kraków'], ['s-przyszlosc', 'Przyszłość'], ['s-plik', 'Plik']].map(([id, t]) => `<a href="#/kompas" data-jump="${id}">${t}</a>`).join('')}</nav>
    <span class="sbar-r"><button class="pill icon" data-themetoggle aria-label="Zmień motyw"></button><button class="pill strong" data-export="download">Zapisz plik</button></span>
  </header>

  <section class="scrolly" id="s-kompas">
    <div class="sticky"><div class="graphic">${scene.svg}</div></div>
    <div class="steps">
      ${step(0, `<span class="kicker">Twoje wyniki · ${esc(ctx.today)}</span><h1>Twój kompas</h1>
        <p class="lead">Na podstawie tego, co o sobie powiedziałeś, kompas wskazuje kilka dobrych kierunków. Nie jedną odpowiedź i nie wyrok: mapę, z którą możesz pójść dalej.</p>
        <span class="cue">Przewijaj powoli ↓</span>`, true)}
      ${step(1, `<span class="kicker">Skąd to wiemy · 1</span><h3>Pięć twoich mocnych stron</h3>
        <p class="small muted">Każda z dowodem z twojego życia. To one wchodzą do kompasu.</p>
        <ul class="proofs">${strengths.map(x => `<li><b>${esc(ctx.strengthName(x.id))}</b><span>„${esc(x.proof)}”</span></li>`).join('')}</ul>`)}
      ${step(2, `<span class="kicker">Skąd to wiemy · 2</span><h3>Twoje orientacje</h3>
        <p>Płatki w środku kompasu to sześć rodzajów zajęć. Im dłuższy płatek, tym częściej wybierałeś takie czynności i sytuacje. Twoje dwa najmocniejsze: <b>${esc(dims[0].name.toLowerCase())}</b> i <b>${esc(dims[1].name.toLowerCase())}</b>.</p>
        <div class="minibars">${dims.map((x, i) => `<div class="mb${i < 2 ? ' main' : ''}"><span>${esc(x.name)}</span><i><b style="width:${x.v}%"></b></i></div>`).join('')}</div>
        <p class="small muted">Ważne dla ciebie: ${(ctx.A.values || []).map(ctx.valueName).map(esc).join(', ')}.</p>`)}
      ${step(3, `<span class="kicker">Północ · najlepsze dopasowanie</span><h3>${badge(o1)} ${esc(o1.c.card.name)}</h3>
        <p>${esc(o1.c.card.whoYouHelp)}</p>
        ${o1.c.strengthsUsed.length ? `<p class="small">Prowadzą tu: ${o1.c.strengthsUsed.map(p => `<span class="tag">${esc(p.label)}</span>`).join(' ')}</p>` : ''}
        <p class="small muted">${o1.c.reasons.map(esc).join(' · ')}</p>
        <p class="small">${icon('school', 'ico sm')} ${optLine(o1)}</p>`)}
      ${step(4, `<span class="kicker">NNE i NNW · dwa kolejne</span><h3>Trzy dobre drogi, nie jedna</h3>
        ${[o2, o3].filter(Boolean).map(o => `<div class="mini">${badge(o)}<div><b>${esc(o.c.card.name)}</b><span class="small">${esc(o.c.card.whoYouHelp)}</span><span class="small muted">${icon('school', 'ico sm')} ${optLine(o)}</span></div></div>`).join('')}
        <p class="small muted">Igła waha się między nimi, bo różnice są małe. To ty wybierasz, którą sprawdzić najpierw.</p>`)}
      ${step(5, `<span class="kicker">Wschód, zachód, południe</span><h3>Trzy inne spojrzenia</h3>
        ${most ? `<div class="mini">${badge(most)}<div><b>Most: ${esc(most.c.card.name)}</b><span class="small">Łączy twoje dwie główne orientacje.</span></div></div>` : ''}
        ${sur ? `<div class="mini">${badge(sur)}<div><b>Niespodzianka: ${esc(sur.c.card.name)}</b><span class="small">Spoza twoich głównych obszarów, a i tak pasuje.</span></div></div>` : ''}
        ${quick ? `<div class="mini">${badge(quick)}<div><b>Szybki start: ${esc(quick.quick.offer.name)}</b><span class="small">Pierwsza praca w ${String(quick.quick.offer.durationYears).replace('.', ',')} roku, dalsze studia zostają otwarte.</span></div></div>` : ''}`)}
      ${step(6, `<span class="kicker">Dalej</span><h3>Zobacz każdy kierunek z bliska</h3>
        <p>Dotknij nazwy na kompasie albo przewiń dalej: dla każdego kierunku pokażemy, którędy prowadzi droga, od twoich mocnych stron do studiów i zawodów.</p>
        <button class="sbtn" data-jump="s-kierunki">Kierunki z bliska ↓</button>`)}
    </div>
  </section>

  <section class="band" id="s-kierunki">
    <div class="wrap">
      <span class="kicker">Kierunki z bliska</span><h2>Od mocnych stron do zawodu</h2>
      <p class="lead">Wybierz kierunek po lewej. Droga czyta się z góry na dół: twoje mocne strony, obszar, studia w Krakowie, przykładowe zawody.</p>
      ${ctx.confLine(r.profile.confidence)}
      <div class="explore">
        <div class="elist" role="tablist" aria-label="Kierunki">${opts.map((o, i) => `<button role="tab" class="eitem" data-pickopt="${esc(o.key)}" aria-selected="${i === 0}" style="--c:${o.color}">${badge(o)}<span><b>${esc(o.quick ? 'Szybki start' : o.c.card.name)}</b><span class="small muted">${esc(o.slot)}</span></span></button>`).join('')}</div>
        <div class="epanel" id="epanel" role="tabpanel" aria-live="polite">${ctx.panelHtml(opts[0])}</div>
      </div>
    </div>
  </section>

  <section class="scrolly flip" id="s-droga">
    <div class="sticky"><div class="graphic">${tramSvg(ctx, lines)}</div></div>
    <div class="steps">
      ${step(0, `<span class="kicker">Twoja droga w czasie</span><h2>Linie jak tramwaje</h2>
        <p class="lead">Każdy kierunek to linia, a jej przystanki to kroki z datami. Do jesieni 2027 wszystkie linie jadą razem, więc przesiadka jest normalna.</p>
        <div class="legend">${lines.map(l => `<span>${badge(l)} ${esc(l.name)}</span>`).join('')}</div>`, true)}
      ${step(1, `<span class="kicker">Przystanek 1 · do 7 lutego 2027</span><h3>Deklaracja maturalna</h3>
        <p>Do tego dnia możesz zmienić przedmioty rozszerzone. Potem już nie.</p>
        ${warnLines.length ? `<div class="warnbox">${warnLines.map(l => `<p>${badge(l)} <b>${esc(l.name)}</b>: ${esc(l.chk.soft ? 'warto dopisać rozszerzenie: ' + l.chk.soft : l.chk.blocked[0] || 'wymaga zmiany w maturze')}</p>`).join('')}</div>` : '<p class="ok">Twoje linie nie wymagają zmian w deklaracji.</p>'}`)}
      ${step(2, `<span class="kicker">Przystanek 2 · marzec–kwiecień</span><h3>Dni otwarte</h3><p>Zobacz uczelnie na żywo: ${insts.map(esc).join(', ')}. Jedno popołudnie powie więcej niż strona internetowa.</p>
        <p class="small muted">Mini-eksperyment na 30 dni: ${esc(s.best[0].card.experiment)}</p>`)}
      ${step(3, `<span class="kicker">Przystanek 3 · maj 2027</span><h3>Matura</h3><p>To, co liczą uczelnie, to głównie przedmioty rozszerzone. UJ liczy tylko poziom rozszerzony.</p>`)}
      ${step(4, `<span class="kicker">Przystanek 4 · lipiec–sierpień</span><h3>Rekrutacja i zapisy</h3><p>Rejestracja na stronach uczelni, zwykle w czerwcu i lipcu. Szkoły policealne przyjmują zapisy latem.</p>`)}
      ${step(5, `<span class="kicker">Przystanek 5 · jesień 2027</span><h3>Start</h3>${lines.map(l => `<p class="small">${badge(l)} ${esc(l.o.name)}, ${esc(ctx.shortInst(l.o.institution))}</p>`).join('')}`)}
      ${step(6, `<span class="kicker">Koniec linii</span><h3>Dyplom i pierwsza praca</h3>${lines.map(l => `<p class="small">${badge(l)} ok. <b>${l.end}</b>${l.o.next ? ': ' + esc(l.o.next) : ''}</p>`).join('')}`)}
    </div>
  </section>

  <section class="band alt" id="s-krakow">
    <div class="wrap two">
      <div><span class="kicker">Kraków</span><h2>Gdzie to jest</h2>
        <p class="lead">Uczelnie twoich kierunków i czas dojazdu z Dworca Głównego w zwykły poranek. Dotknij punktu.</p>
        <div class="klist">${pins.map(p => `<div class="kitem" data-pinrow="${esc(p.cp.id)}">${badge(p)}<div><b>${esc(p.cp.name)}</b><span class="small">${esc(p.cp.address)}</span>
          <span class="small">${icon('tram', 'ico sm')} ${ctx.transit(p.cp)}</span><span class="small">${ctx.commute(p.cp)} · <a href="${ctx.routeUrl(p.cp)}" target="_blank" rel="noopener">Zaplanuj dojazd</a></span></div></div>`).join('')}</div>
        <p class="small muted">${ctx.transportNote()}</p></div>
      <div class="kmap">${krakowSvg(ctx, pins)}<p class="small muted center">Schemat, nie mapa: odległości w skali, bez ulic. Pełna mapa w wersji 1.0.</p></div>
    </div>
  </section>

  <section class="band" id="s-przyszlosc"><div class="wrap" id="futurewrap">${futureHtml(ctx)}</div></section>

  <section class="band alt" id="s-plik">
    <div class="wrap two">
      <div><span class="kicker">Twój plik</span><h2>Zabierz to ze sobą</h2>
        <p class="lead">Plik powstaje na tym urządzeniu i nigdzie nie jest wysyłany. Za pół roku wczytasz go i zobaczysz, co się zmieniło.</p>
        <label class="field" for="cando"><b>Mogę to zrobić, bo…</b> Dokończ jednym zdaniem; trafi na górę pliku.</label>
        <input id="cando" type="text" data-field="canDo" value="${esc(ctx.A.canDo)}">
        <div class="sactions"><button class="sbtn" data-export="download">Pobierz plik .md</button><button class="sbtn ghost" data-export="print">Drukuj / PDF</button><button class="sbtn ghost" data-export="copy">Kopiuj</button>
          <label class="sbtn ghost filebtn">Wczytaj starszy plik<input type="file" accept=".md,text/markdown,text/plain" data-load></label></div>
        <p id="msg" class="small muted" role="status"></p>
        ${ctx.changes()}</div>
      <div>${ctx.doubtHtml()}
        <div class="pcard"><h3>Dla rodzica</h3><ul><li>Pytaj, nie mów: „Co cię tu zaskoczyło?”</li><li>Reaguj na dowody, nie na opcję: dowody są jego, opcja może się zmienić.</li><li>Bez porównań między braćmi.</li><li>Jeden mały krok w tym miesiącu, nie ostateczny wybór.</li></ul></div>
        <button class="sbtn ghost" data-go="pewnosc">Zmień odpowiedzi</button></div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------- future (scenario pick at the end)
const NEED = { wysoka: 3, 'średnia': 2, niska: 1 };
export function futureHtml(ctx) {
  const { r, esc, icon, data, A } = ctx, sc = data.scenarios.scenarios, my = sc.find(x => x.id === A.scenario);
  const opts = ctx.options(r).filter(o => !o.quick);
  let res = '<p class="pick-hint">Wybierz scenariusz powyżej, a zobaczysz swoje kierunki w jego świetle.</p>';
  if (my) {
    const forces = data.scenarios.forces.filter(f => my.emphasis.includes(f.id));
    const ranked = [...opts].sort((a, b) => (NEED[b.c.card.robustness[my.id]] || 0) - (NEED[a.c.card.robustness[my.id]] || 0));
    const shown = new Set(opts.map(o => o.c.card.id));
    const extra = r.cards.filter(c => !shown.has(c.card.id) && c.card.robustness[my.id] === 'wysoka' && forces.some(f => f.id === c.card.force) && c.fit >= 55).slice(0, 3);
    res = `<div class="fgrid">
      <div><h3>Co w tym świecie waży najwięcej</h3>${forces.map((f, i) => `<div class="fforce" style="--i:${i}">${icon(ctx.FORCE_ICON[f.id], 'ico big')}<div><b>${esc(f.name)}</b><span class="small">${esc(f.text)}</span></div></div>`).join('')}</div>
      <div><h3>Twoje kierunki w tym świecie</h3>${ranked.map((o, i) => { const v = NEED[o.c.card.robustness[my.id]] || 0;
        return `<div class="fneed" style="--i:${i}"><span class="nb" style="background:${o.color}">${o.no}</span><span class="fn">${esc(o.c.card.name)}${o.c.card.robustnessNote ? `<span class="small muted">${esc(o.c.card.robustnessNote)}</span>` : ''}</span><span class="fbar"><b style="width:${v * 33.3}%;background:${o.color}"></b></span><span class="small">${esc(o.c.card.robustness[my.id])}</span></div>`; }).join('')}
        <p class="small muted">Dopasowanie do ciebie się nie zmienia; to tylko inne światło.</p>
        ${extra.length ? `<h3>Bardzo potrzebne tu i pasujące do ciebie</h3>${extra.map(c => `<div class="fextra">${icon(c.card.cluster)}<div><b>${esc(c.card.name)}</b><span class="small">${esc(c.card.whoYouHelp)}</span></div></div>`).join('')}` : ''}</div></div>`;
  }
  return `<span class="kicker">Przyszłość</span><h2>Jak będzie wyglądał świat za 10 lat?</h2>
    <p class="lead">Nikt nie wie. Wybierz scenariusz, który wydaje ci się najbardziej prawdopodobny: pokażemy tylko to, co w nim najważniejsze.</p>
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
  return () => { ios.forEach(io => io.disconnect()); window.removeEventListener('scroll', onScroll); };
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
  if (d.pin) { root.querySelectorAll('[data-pin]').forEach(p => p.classList.toggle('on', p.dataset.pin === d.pin)); return true; }
  if (d.scen) { ctx.A.scenario = ctx.A.scenario === d.scen ? null : d.scen; ctx.r = ctx.rescore(); root.querySelector('#futurewrap').innerHTML = futureHtml(ctx); return true; }
  return false;
}
