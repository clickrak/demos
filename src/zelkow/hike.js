// Flat hiking map ("Szlak") for the Zelków page.
// A plain 2D canvas: no 3D, no animation loop. It only redraws when you pan, zoom or pick a walk.
// Data: hike.json (contours, roads, trails, places, 5 walks) and hike-light.jpg / hike-dark.jpg (land cover + hill shading).

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const safe = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };

const KIND = {
  cave: ['🦇', 'Jaskinia', 0.14], view: ['🔭', 'Punkt widokowy', 0.12], peak: ['⛰️', 'Szczyt', 0.1], spring: ['💧', 'Źródło', 0.18],
  church: ['⛪', 'Kościół', 0.16], castle: ['🏰', 'Zamek', 0.08], camp: ['⛺', 'Kemping', 0.2], food: ['🍴', 'Coś do jedzenia', 0.16],
  picnic: ['🧺', 'Miejsce na piknik', 0.22], attraction: ['⭐', 'Ciekawe miejsce', 0.22], shrine: ['🕯️', 'Kapliczka', 0.6],
};
const LEVEL = { 1: '🟢 łatwy, dla maluchów', 2: '🟡 średni', 3: '🔴 duża wyprawa' };
const TASKS = {
  w1: 'Policz kaczki na stawie, a potem znajdź wejście do szkoły.',
  w2: 'Na każdej z trzech ulic znajdź tabliczkę z nazwą i zrób jej zdjęcie.',
  w3: 'Policz przystanki autobusu 248, które miniesz po drodze.',
  w4: 'Przy źródle Będkówki zrób zdjęcie i wypatruj skałek na horyzoncie.',
  w5: 'Przy jaskini tylko patrzymy z zewnątrz! Zrób zdjęcie wejścia.',
};
const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`;
const fmtKm = k => k.toFixed(1).replace('.', ',') + ' km';

export async function createHike({ canvas, ui, toast, onKicker }) {
  const data = await (await fetch('hike.json')).json();
  const M = data.meta;
  const ctx = canvas.getContext('2d');
  const walksBar = ui.querySelector('#wkbar'), panel = ui.querySelector('#wp'), scaleEl = ui.querySelector('#hscale');
  const imgs = {};
  const loadImg = theme => imgs[theme] ??= new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `hike-${theme}.jpg`; });

  // ---- prepare data: bounding boxes so that off-screen lines are skipped
  const prep = list => list.map(p => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; } return { p, x0, y0, x1, y1 }; });
  const L = {
    minor: prep(data.minor), major: data.major.map(([lv, p]) => ({ lv, ...prep([p])[0] })),
    streams: prep(data.streams), cliffs: prep(data.cliffs),
    major_r: prep(data.roads.major), street: prep(data.roads.street), track: prep(data.roads.track), path: prep(data.roads.path),
    jp2: prep(data.jp2), bus: prep(data.bus?.lines || []),
    trails: data.trails.map(t => ({ ...t, lines: prep(t.lines) })),
  };
  const walks = data.walks.map((w, i) => ({ ...w, n: i + 1, ...prep([w.line])[0] }));
  const rocks = data.pois.filter(p => p[0] === 'rock');
  const pois = data.pois.filter(p => p[0] !== 'rock' && KIND[p[0]]);
  // one school marker (kindergarten and school share the buildings)
  const school = data.schools.find(s => /Zespół Szkolno/.test(s.name)) || data.schools.find(s => s.kind === 'school');
  const jks = data.sports.find(s => /Jurajski Klub/.test(s.name));
  const terminus = data.bus?.stops.find(s => /Zelków Pętla/.test(s[0]));
  const foxSpot = (data.pois.find(p => /Łabajowa/.test(p[1])) || data.pois.find(p => p[0] === 'peak') || ['', '', 0, 0]);
  const FOCUS = [data.pond[0] + 120, data.pond[1] - 60];

  // ---- view
  const view = { cx: FOCUS[0], cy: FOCUS[1], s: 0.12 };
  let W = 0, H = 0, dpr = 1, sel = null, dirty = true, anim = null, hits = [], shown = false, theme = 'light', baseImg = null;
  const minS = () => Math.max(0.035, Math.max(W / M.w, H / M.h) * 0.9);
  const MAXS = 1.8;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    view.s = clamp(view.s, minS(), MAXS); invalidate();
  };
  const sx = x => (x - view.cx) * view.s + W / 2, sy = y => (y - view.cy) * view.s + H / 2;
  const wx = px => (px - W / 2) / view.s + view.cx, wy = py => (py - H / 2) / view.s + view.cy;
  const keepIn = () => {
    const hw = W / 2 / view.s, hh = H / 2 / view.s;
    view.cx = hw >= M.w / 2 ? 0 : clamp(view.cx, -M.w / 2 + hw, M.w / 2 - hw);
    view.cy = hh >= M.h / 2 ? 0 : clamp(view.cy, -M.h / 2 + hh, M.h / 2 - hh);
  };
  let raf = 0;
  function invalidate() { dirty = true; if (!raf && shown) raf = requestAnimationFrame(draw); }

  function goTo(cx, cy, s, ms = 450) {
    s = clamp(s, minS(), MAXS);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) ms = 0;
    if (!ms) { Object.assign(view, { cx, cy, s }); keepIn(); return invalidate(); }
    anim = { t0: performance.now(), ms, from: { ...view }, to: { cx, cy, s } };
    invalidate();
  }
  function fitBox(x0, y0, x1, y1, padBottom = 0, padLeft = 0) {
    const top = 120, side = 28, left = side + padLeft, bw = Math.max(x1 - x0, 800), bh = Math.max(y1 - y0, 800);
    const aw = W - left - side, ah = H - top - padBottom - 20;
    const s = Math.min(aw / bw, ah / bh);
    const midY = top + (H - top - padBottom) / 2, midX = left + aw / 2;
    goTo((x0 + x1) / 2 - (midX - W / 2) / s, (y0 + y1) / 2 - (midY - H / 2) / s, s);
  }

  // ---- colours
  const C = () => theme === 'dark' ? {
    halo: '#1a2218', text: '#e9ebdf', soft: '#b7c4ad', minor: 'rgba(214,190,140,.22)', major: 'rgba(214,190,140,.5)', contourText: '#cdb98f',
    roadCase: '#12180f', major: '#8a8f7c', street: '#5c6652', track: '#a99a76', path: '#cfc7a8', stream: '#4f9cc4', cliff: '#d8d2c2', water: '#6fb3d6', place: '#f3f1e2',
  } : {
    halo: '#fbf8ec', text: '#253022', soft: '#4d5a45', minor: 'rgba(150,108,60,.30)', major: 'rgba(130,88,40,.62)', contourText: '#7c5a2c',
    roadCase: '#9a917c', major: '#ffffff', street: '#ffffff', track: '#9b6b32', path: '#6b4a24', stream: '#4aa3d4', cliff: '#6e6659', water: '#2f8fc4', place: '#1f2a1c',
  };

  // ---- drawing helpers
  function lines(list, bounds) {
    ctx.beginPath();
    for (const o of list) {
      if (o.x1 < bounds[0] || o.x0 > bounds[2] || o.y1 < bounds[1] || o.y0 > bounds[3]) continue;
      const p = o.p; ctx.moveTo(p[0], p[1]);
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    }
  }
  const stroke = (list, bounds, color, px, dash) => {
    lines(list, bounds); ctx.strokeStyle = color; ctx.lineWidth = px / view.s; ctx.setLineDash(dash ? dash.map(d => d / view.s) : []); ctx.stroke();
  };
  const polyPath = (rings) => { ctx.beginPath(); for (const r of rings) { ctx.moveTo(r[0], r[1]); for (let i = 2; i < r.length; i += 2) ctx.lineTo(r[i], r[i + 1]); ctx.closePath(); } };

  const placed = [];
  const free = (x, y, w, h) => { for (const r of placed) if (x < r[2] && x + w > r[0] && y < r[3] && y + h > r[1]) return false; return true; };
  const FONT = (px, wt = 800, it = false) => `${it ? 'italic ' : ''}${wt} ${px}px Nunito, system-ui, sans-serif`;
  function label(text, x, y, { px = 12, wt = 800, color, it = false, force = false, dy = 0, hit } = {}) {
    ctx.font = FONT(px, wt, it);
    const w = ctx.measureText(text).width, h = px + 2, x0 = x - w / 2, y0 = y + dy - h / 2;
    if (!force && !free(x0 - 2, y0 - 1, w + 4, h + 2)) return false;
    placed.push([x0 - 2, y0 - 1, x0 + w + 2, y0 + h + 1]);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = col.halo; ctx.strokeText(text, x0, y0 + h / 2 + 0.5);
    ctx.fillStyle = color || col.text; ctx.fillText(text, x0, y0 + h / 2 + 0.5);
    if (hit) hits.push({ x, y: y + dy, r: Math.max(w / 2, 14), ...hit });
    return true;
  }
  function icon(emoji, x, y, { size = 18, bg = true, force = false, hit, ring } = {}) {
    const r = size / 2 + 3;
    if (!force && !free(x - r, y - r, 2 * r, 2 * r)) return false;
    placed.push([x - r, y - r, x + r, y + r]);
    if (bg) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = theme === 'dark' ? '#253022ee' : '#fffdf3ee'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = ring || (theme === 'dark' ? '#9cc490' : '#4f7a45'); ctx.setLineDash([]); ctx.stroke(); }
    ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.fillText(emoji, x, y + 1);
    if (hit) hits.push({ x, y, r: r + 6, ...hit });
    return true;
  }
  let col = C();

  // ---- main draw
  function draw(now) {
    raf = 0;
    if (!shown) return;
    if (anim) {
      const k = clamp((now - anim.t0) / anim.ms, 0, 1), e = ease(k);
      view.cx = anim.from.cx + (anim.to.cx - anim.from.cx) * e; view.cy = anim.from.cy + (anim.to.cy - anim.from.cy) * e;
      view.s = Math.exp(Math.log(anim.from.s) + (Math.log(anim.to.s) - Math.log(anim.from.s)) * e);
      if (k >= 1) anim = null;
    }
    keepIn();
    col = C(); hits = []; placed.length = 0;
    const s = view.s;
    const b = [wx(-40), wy(-40), wx(W + 40), wy(H + 40)];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = theme === 'dark' ? '#20271d' : '#f6f1df'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (W / 2 - view.cx * s), dpr * (H / 2 - view.cy * s));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (baseImg) { ctx.imageSmoothingQuality = 'high'; ctx.drawImage(baseImg, -M.w / 2, -M.h / 2, M.w, M.h); }

    // contours and water
    stroke(L.minor, b, col.minor, 0.7);
    stroke(L.major, b, col.major, 1.2);
    stroke(L.streams, b, col.stream, clamp(5 * s, 1.1, 2.6));
    for (const p of data.ponds) { polyPath([p]); ctx.fillStyle = col.water + '55'; ctx.fill(); ctx.strokeStyle = col.water; ctx.lineWidth = 1.5 / s; ctx.setLineDash([]); ctx.stroke(); }

    // sport, school, playgrounds (Zelków highlights)
    for (const sp of data.sports) if (sp.rings.length) { polyPath(sp.rings); ctx.fillStyle = sp === jks ? '#5bbf5bcc' : '#7dcf7daa'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4 / s; ctx.setLineDash([]); ctx.stroke(); }
    for (const pg of data.playgrounds) if (pg.rings.length) { polyPath(pg.rings); ctx.fillStyle = '#f5b04acc'; ctx.fill(); }
    for (const sc of data.schools) if (sc.rings.length) { polyPath(sc.rings); ctx.fillStyle = '#ffd166cc'; ctx.fill(); ctx.strokeStyle = '#d4552f'; ctx.lineWidth = 1.8 / s; ctx.setLineDash([]); ctx.stroke(); }

    // cliffs (rock walls)
    stroke(L.cliffs, b, col.cliff, clamp(9 * s, 1.6, 3.4));

    // roads
    const rw = (m, lo, hi) => clamp(m * s, lo, hi);
    stroke(L.major_r, b, col.roadCase, rw(13, 3.6, 12)); stroke(L.street, b, col.roadCase, rw(8, 2.2, 8));
    stroke(L.major_r, b, col.major, rw(11, 2.6, 10)); stroke(L.street, b, col.street, rw(6.5, 1.5, 6.5));
    stroke(L.jp2, b, '#f0b429', rw(11, 3, 10));
    stroke(L.track, b, col.track, rw(4, 1.2, 3), [5, 3]);
    stroke(L.path, b, col.path, rw(3, 1, 2.2), [2, 3]);
    // bus 248
    stroke(L.bus, b, '#2f6fd6', 2, [7, 5]);

    // marked trails: colour as on the signs; hiking = solid, cycling = dashed
    for (const t of L.trails) {
      const w = clamp(7 * s, 2.6, 5);
      stroke(t.lines, b, theme === 'dark' ? '#10150e' : '#ffffffd0', w + 2.4);
      stroke(t.lines, b, t.colour, w, t.kind === 'bicycle' ? [7, 5] : null);
    }

    // walks
    if (sel) drawWalk(sel, b);
    else for (const w of walks) stroke([w], b, '#ff7a1a99', 2.2, [4, 4]);
    ctx.restore();

    // ---- screen space: icons and names (most important first)
    ctx.setLineDash([]);
    const P = (x, y) => [sx(x), sy(y)];
    const onScreen = (x, y, m = 30) => x > -m && x < W + m && y > -m && y < H + m;

    if (sel) {
      sel.points.forEach(([nm, x, y, kind], i) => {
        const last = i === sel.points.length - 1;
        if (last && i > 0 && Math.hypot(x - sel.points[0][1], y - sel.points[0][2]) < 40) return;
        const [px, py] = P(x, y); if (!onScreen(px, py)) return;
        placed.push([px - 13, py - 13, px + 13, py + 13]);
        ctx.beginPath(); ctx.arc(px, py, 12, 0, 7); ctx.fillStyle = '#ff5a1f'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.font = FONT(13, 900); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), px, py + 0.5);
        hits.push({ x: px, y: py, r: 20, text: `${i + 1}. ${nm}` });
      });
      sel.points.forEach(([nm, x, y], i) => {
        const last = i === sel.points.length - 1;
        if (last && i > 0 && Math.hypot(x - sel.points[0][1], y - sel.points[0][2]) < 40) return;
        const [px, py] = P(x, y); if (onScreen(px, py)) label(nm + (i === 0 && sel.points.length > 2 && Math.hypot(x - sel.points.at(-1)[1], y - sel.points.at(-1)[2]) < 40 ? ' (start i meta)' : ''), px, py, { px: 13, force: true, dy: 24, color: col.text });
      });
    }

    // landmarks of Zelków (names show up when you zoom in a little)
    const T = s >= 0.16 && !sel;
    if (school) { const [px, py] = P(school.x, school.y); if (onScreen(px, py)) { icon('🏫', px, py, { size: 22, force: true, ring: '#d4552f', hit: { text: '🏫 Zespół Szkolno-Przedszkolny: szkoła i przedszkole w jednym miejscu.' } }); T && label('Szkoła i przedszkole', px, py, { px: 12, dy: 22, force: true }); } }
    { const [px, py] = P(data.pond[0], data.pond[1]); if (onScreen(px, py)) { icon('🦆', px, py, { size: 20, force: true, ring: '#2f8fc4', hit: { text: '🦆 Staw w Zelkowie. Policz kaczki!' } }); T && label('Staw', px, py, { px: 12, dy: 21, force: true, color: '#1f6f99' }); } }
    if (jks) { const [px, py] = P(jks.x, jks.y); if (onScreen(px, py)) { icon('⚽', px, py, { size: 20, force: true, ring: '#2d7a2d', hit: { text: '⚽ JKS Zelków: stadion i boisko.' } }); T && label('JKS', px, py, { px: 12, dy: 21, force: true, color: '#2d7a2d' }); } }
    for (const pg of data.playgrounds) { const [px, py] = P(pg.x, pg.y); if (onScreen(px, py) && s > 0.09) icon('🛝', px, py, { size: 19, ring: '#e09a2e', hit: { text: '🛝 Plac zabaw.' } }); }
    if (terminus) { const [px, py] = P(terminus[1], terminus[2]); if (onScreen(px, py)) { icon('🚌', px, py, { size: 20, force: true, ring: '#2f6fd6', hit: { text: '🚌 Pętla autobusu 248: stąd jedzie do Krakowa Bronowic Małych. Rozkład sprawdź przed wyprawą.' } }); T && label('Zelków Pętla · 248', px, py, { px: 11, dy: 21, force: true, color: '#1d4f91' }); } }
    if (s > 0.1) for (const st of data.bus?.stops || []) { if (st === terminus || !st[0]) continue; const [px, py] = P(st[1], st[2]); if (onScreen(px, py) && s > 0.22) icon('🚏', px, py, { size: 13, bg: false, hit: { text: '🚏 ' + st[0] } }); }

    // places, then points of interest
    for (const [nm, big, x, y] of data.places) {
      const [px, py] = P(x, y); if (!onScreen(px, py, 80)) continue;
      const isZ = nm === 'Zelków';
      label(isZ ? 'ZELKÓW' : nm, px, py, { px: isZ ? 20 : big ? 15 : 12, wt: 900, color: col.place, force: isZ && !sel, it: !big });
    }
    for (const p of pois) {
      const [k, nm, x, y] = p, [em, kn, minS_] = KIND[k];
      if (s < minS_) continue;
      const [px, py] = P(x, y); if (!onScreen(px, py)) continue;
      const say = `${em} ${kn}${nm ? ': ' + nm : ''}`;
      if (icon(em, px, py, { size: 17, hit: { text: say } }) && nm && s > 0.2) label(nm, px, py, { px: 11, dy: 18, color: col.soft });
    }
    if (s > 0.38) for (const [, nm, x, y] of rocks) { const [px, py] = P(x, y); if (onScreen(px, py)) label(nm, px, py, { px: 11, wt: 700, it: true, color: theme === 'dark' ? '#cfc7b0' : '#6a5e48', hit: { text: '🪨 Skałka: ' + nm } }); }
    if (s > 0.5) for (const [nm, x, y, ang] of data.labels) {
      const [px, py] = P(x, y); if (!onScreen(px, py)) continue;
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang * Math.PI / 180);
      ctx.font = FONT(10.5, 700); const w = ctx.measureText(nm).width;
      if (free(px - w / 2, py - 7, w, 14)) { placed.push([px - w / 2, py - 7, px + w / 2, py + 7]); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = col.halo; ctx.strokeText(nm, -w / 2, 0); ctx.fillStyle = col.soft; ctx.fillText(nm, -w / 2, 0); }
      ctx.restore();
    }
    if (s > 0.2) for (const o of L.major) {
      if (o.x1 < b[0] || o.x0 > b[2] || o.y1 < b[1] || o.y0 > b[3]) continue;
      const i = (o.p.length / 2 >> 1) * 2, px = sx(o.p[i]), py = sy(o.p[i + 1]);
      if (onScreen(px, py)) label(String(o.lv), px, py, { px: 10, wt: 800, color: col.contourText });
    }

    // the fox and the bus hide on the map
    if (s > 0.28) {
      const [px, py] = P(foxSpot[2] + 60, foxSpot[3] + 40);
      if (onScreen(px, py)) icon('🦊', px, py, { size: 15, bg: false, force: true, hit: { fox: true, text: '' } });
    }

    // scale bar
    const nice = [50, 100, 200, 500, 1000, 2000, 5000].find(m => m * s >= 70) || 5000;
    scaleEl.innerHTML = `<i style="width:${Math.round(nice * s)}px"></i>${nice >= 1000 ? nice / 1000 + ' km' : nice + ' m'}`;
    if (anim) raf = requestAnimationFrame(draw);
  }

  function drawWalk(w, b) {
    const s = view.s, p = w.p;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.setLineDash([]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9 / s; ctx.stroke();
    ctx.strokeStyle = w.mode === 'bike' ? '#e8461a' : '#ff6a1a'; ctx.lineWidth = 5 / s; ctx.stroke();
    // little arrows show the direction
    const every = Math.max(220, 110 / s); let acc = every / 2;
    for (let i = 0; i < p.length - 2; i += 2) {
      const dx = p[i + 2] - p[i], dy = p[i + 3] - p[i + 1], d = Math.hypot(dx, dy); if (!d) continue;
      let t = acc;
      while (t < d) {
        const x = p[i] + dx * t / d, y = p[i + 1] + dy * t / d;
        if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) {
          const a = Math.atan2(dy, dx), r = 4.6 / s;
          ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * 0.8, r * 0.85); ctx.lineTo(-r * 0.8, -r * 0.85); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
        }
        t += every;
      }
      acc = t - d;
    }
  }

  // ---- input: drag, pinch, wheel, tap
  const ptrs = new Map(); let tapStart = null, pinch = null;
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); anim = null;
    tapStart = ptrs.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 } : null;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s }; }
  });
  canvas.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    if (ptrs.size === 1) {
      view.cx -= (e.clientX - p.x) / view.s; view.cy -= (e.clientY - p.y) / view.s;
      if (tapStart) tapStart.moved += Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y);
    }
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      zoomAt(mx, my, clamp(pinch.s * d / pinch.d, minS(), MAXS));
    }
    invalidate();
  });
  const up = e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (tapStart && ptrs.size === 0 && tapStart.moved < 8 && performance.now() - tapStart.t < 500) tap(e.clientX, e.clientY);
    tapStart = null;
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  function zoomAt(px, py, s2) { const x = wx(px), y = wy(py); view.s = s2; view.cx = x - (px - W / 2) / s2; view.cy = y - (py - H / 2) / s2; }
  canvas.addEventListener('wheel', e => { e.preventDefault(); anim = null; zoomAt(e.clientX, e.clientY, clamp(view.s * Math.exp(-e.deltaY * 0.0016), minS(), MAXS)); invalidate(); }, { passive: false });
  const zoomBy = f => goTo(view.cx, view.cy, view.s * f, 250);
  ui.querySelector('#hzin')?.addEventListener('click', () => zoomBy(1.6));
  ui.querySelector('#hzout')?.addEventListener('click', () => zoomBy(1 / 1.6));
  addEventListener('resize', () => shown && resize());
  new MutationObserver(() => { const t = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; if (t !== theme) setTheme(t); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let foxSays = 0;
  function tap(x, y) {
    let best = null, bd = 1e9;
    for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < h.r + 6 && d < bd) { best = h; bd = d; } }
    if (!best) return;
    if (best.fox) {
      const found = safe.get('zelkow-hike-fox');
      safe.set('zelkow-hike-fox', '1');
      toast(found ? ['🦊 Lisek Zelek: „Jestem tu, ale najlepiej zobaczysz mnie w świecie 3D.”', '🦊 Lisek: „Kto znalazł lisa, ten ma dobre oko do szlaków!”'][foxSays++ % 2] : '🦊 Znalazłeś Liska Zeleka! Ma dobre oko do szlaków. Zajrzyj do świata 3D, tam wędruje po szlaku.', 3600);
      return;
    }
    if (best.text) toast(best.text, 3000);
  }

  // ---- walks UI
  const kmH = w => `${fmtKm(w.km)} · ${fmtMin(w.min)}`;
  walksBar.innerHTML = walks.map(w => `<button class="wk" data-w="${w.id}" aria-pressed="false"><span class="n">${w.n}</span><span class="t"><b>${w.icon} ${w.title}</b><small>${kmH(w)} · ${w.mode === 'bike' ? '🚲' : '🥾'}</small></span></button>`).join('');
  walksBar.querySelectorAll('.wk').forEach(b => b.onclick = () => select(b.dataset.w === sel?.id ? null : b.dataset.w));

  function profileSvg(w) {
    const pr = w.profile, lo = Math.min(...pr), hi = Math.max(...pr), n = pr.length - 1 || 1;
    const pts = pr.map((h, i) => `${(i / n * 300).toFixed(1)},${(38 - (h - lo) / ((hi - lo) || 1) * 32).toFixed(1)}`);
    return `<svg viewBox="0 0 300 44" preserveAspectRatio="none" role="img" aria-label="Profil wysokości trasy"><polygon points="0,44 ${pts.join(' ')} 300,44" fill="#9cc49055"/><polyline points="${pts.join(' ')}" fill="none" stroke="#9cc490" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div class="pr"><span>najniżej ${lo} m</span><span>najwyżej ${hi} m n.p.m.</span></div>`;
  }
  function select(id) {
    sel = id ? walks.find(w => w.id === id) : null;
    walksBar.querySelectorAll('.wk').forEach(b => b.setAttribute('aria-pressed', b.dataset.w === id));
    if (!sel) { panel.hidden = true; ui.classList.remove('has-panel'); goTo(FOCUS[0], FOCUS[1], defaultScale()); invalidate(); return; }
    const w = sel;
    const todo = w.id === 'w2' && !data.restaurant ? '<p class="note">🍴 Restauracji na końcu trasy jeszcze nie ma na mapie. Powiedz, którą wybrać.</p>' : '';
    const approx = w.points.some(p => p[0] === 'Brama Będkowska') ? '<p class="note">📍 Brama Będkowska jest zaznaczona orientacyjnie.</p>' : '';
    panel.innerHTML = `
      <div class="wp-top"><div class="ico">${w.icon}</div><div><div class="kicker">Spacer ${w.n} · ${LEVEL[w.level]}</div><h3>${w.title}</h3></div><button class="x" aria-label="Zamknij" id="wpx">×</button></div>
      <div class="stats"><b>${w.mode === 'bike' ? '🚲' : '🥾'} ${fmtKm(w.km)}</b><b>⏱ ${fmtMin(w.min)}</b><b>⬆ ${w.up} m</b><button class="tg" id="wptg" aria-expanded="false">Szczegóły ▾</button></div>
      <div class="more">
        ${profileSvg(w)}
        <p>${w.sub}</p>
        <ol class="stops">${w.points.map(p => `<li>${p[0]}</li>`).join('')}</ol>
        <div class="task"><span>Zadanie po drodze</span>${TASKS[w.id]}</div>
        ${w.bus ? `<p class="note">🚌 ${w.bus}</p>` : ''}${w.back ? `<p class="note">↩ ${w.back}</p>` : ''}${todo}${approx}
        <p class="fine">Dłuższe trasy tylko z dorosłym. Weź wodę, sprawdź pogodę i godzinę ostatniego autobusu.</p>
      </div>
      <div class="row"><button class="nav" id="wprev" aria-label="Poprzedni spacer">‹</button><button class="go" id="wpgo">Pokaż całą trasę</button><button class="nav" id="wnext" aria-label="Następny spacer">›</button></div>`;
    panel.classList.toggle('open', innerWidth >= 900 && innerHeight >= 760);
    const tg = panel.querySelector('#wptg'), sync = () => { const o = panel.classList.contains('open'); tg.textContent = o ? 'Mniej ▴' : 'Szczegóły ▾'; tg.setAttribute('aria-expanded', o); };
    tg.onclick = () => { panel.classList.toggle('open'); sync(); panel.scrollTop = 0; };
    sync();
    panel.hidden = false; ui.classList.add('has-panel'); panel.scrollTop = 0;
    panel.querySelector('#wpx').onclick = () => select(null);
    panel.querySelector('#wprev').onclick = () => select(walks[(walks.indexOf(w) + walks.length - 1) % walks.length].id);
    panel.querySelector('#wnext').onclick = () => select(walks[(walks.indexOf(w) + 1) % walks.length].id);
    panel.querySelector('#wpgo').onclick = () => fitWalk(w);
    fitWalk(w);
    walksBar.querySelector(`[data-w="${id}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
  function fitWalk(w) {
    const wide = innerWidth >= 900, bar = (walksBar.offsetHeight || 60) + 22;
    if (wide) fitBox(w.x0, w.y0, w.x1, w.y1, bar, ui.classList.contains('has-panel') ? 420 : 0);
    else fitBox(w.x0, w.y0, w.x1, w.y1, ui.classList.contains('has-panel') ? Math.min(panel.offsetHeight || 0, H * 0.5) + bar : bar);
  }
  const defaultScale = () => clamp(W / 2300, minS(), 0.5);

  async function setTheme(t) {
    theme = t;
    try { baseImg = await loadImg(t); } catch { baseImg = null; }
    invalidate();
  }

  return {
    async show() {
      shown = true; canvas.hidden = false; ui.hidden = false;
      resize();
      if (!this._init) { this._init = true; view.s = defaultScale(); }
      theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      await setTheme(theme);
      onKicker?.('Idziemy na spacer!');
      invalidate();
    },
    hide() { shown = false; canvas.hidden = true; ui.hidden = true; onKicker?.(null); },
    select,
  };
}
