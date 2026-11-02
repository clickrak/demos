import React, { useEffect, useRef, useState, useCallback } from "react";
import PHOTOS from "./photos.json";

/* ============================================================
   EXTENDED LINES — photographs whose geometry leaks onto the page
   Pipeline per photo:
     analyse.py (offline): Hough / outline polygon → lines + tones
     here (live):  Extend → Deform → Disperse → Decompose,  plus a Fill
   ============================================================ */

// ---------------------------------------------------------------- recipe ----

const MODES = {
  extend: ["straight", "strength", "snap"],
  deform: ["none", "bend", "wave", "gravity"],
  disperse: ["none", "echoes", "fan", "scatter"],
  fill: ["none", "tonal", "tiles", "mirror"],
  ground: ["auto", "dark", "light"],
};

const MODE_HELP = {
  straight: "lines keep their path",
  strength: "strong lines reach further",
  snap: "angles drift toward clean 15° steps",
  none: "off",
  bend: "lines curve more with distance",
  wave: "a slow wave grows with distance",
  gravity: "lines lean toward your pointer",
  echoes: "parallel copies, like ripples",
  fan: "each line opens into a fan",
  scatter: "lines break apart and drift",
  tonal: "edge tones continue as stepped bands",
  tiles: "edge tiles repeat and dissolve",
  mirror: "the photo folds outward and decays",
  auto: "from the photo's tones",
  dark: "dark",
  light: "light",
};

// The artist's version of each photo. Visitors can change it, then reset.
const PRESETS = {
  organ: { extend: "strength", deform: "none", disperse: "echoes", fill: "tonal", abstraction: 0.62, frame: 0.52, light: true },
  alley: { extend: "snap", deform: "none", disperse: "echoes", fill: "tiles", abstraction: 0.58, frame: 0.56 },
  skyline: { extend: "straight", deform: "wave", disperse: "none", fill: "mirror", abstraction: 0.55, frame: 0.54 },
  railings: { extend: "straight", deform: "none", disperse: "echoes", fill: "tonal", abstraction: 0.66, frame: 0.52 },
  stone: { extend: "strength", deform: "bend", disperse: "fan", fill: "tiles", abstraction: 0.56, frame: 0.5 },
  grass: { extend: "strength", deform: "wave", disperse: "scatter", fill: "mirror", abstraction: 0.5, frame: 0.5 },
  filharmonia: { extend: "strength", deform: "bend", disperse: "echoes", fill: "tonal", abstraction: 0.56, frame: 0.54 },
};

const BASE = {
  abstraction: 0.6, frame: 0.52, density: 1,
  extend: "straight", deform: "none", disperse: "none", fill: "none", ground: "auto",
  extendAmt: 1, deformAmt: 1, disperseAmt: 1, fadeAmt: 1, fillAmt: 1,
  decompose: true, light: false, speed: 1, seed: 1, ox: 0, oy: 0,
};

const presetFor = (id) => ({ ...BASE, ...(PRESETS[id] || {}) });

// short keys for shareable links
const KEYS = {
  abstraction: "a", frame: "f", density: "n", extend: "e", deform: "d", disperse: "s", fill: "l", ground: "g",
  extendAmt: "ea", deformAmt: "da", disperseAmt: "sa", fadeAmt: "fa", fillAmt: "la",
  decompose: "x", light: "li", speed: "v", seed: "r", ox: "ox", oy: "oy",
};

function encodeState(id, s) {
  const p = presetFor(id);
  const parts = [];
  for (const [k, short] of Object.entries(KEYS)) {
    if (s[k] === p[k]) continue;
    const v = typeof s[k] === "boolean" ? (s[k] ? 1 : 0) : typeof s[k] === "number" ? +s[k].toFixed(3) : s[k];
    parts.push(`${short}=${v}`);
  }
  return `#${id}${parts.length ? "?" + parts.join("&") : ""}`;
}

function decodeHash(hash) {
  const [idPart, q] = hash.replace(/^#/, "").split("?");
  const idx = PHOTOS.findIndex((p) => p.id === idPart);
  if (idx < 0) return null;
  const s = presetFor(PHOTOS[idx].id);
  if (q) {
    const inv = Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [v, k]));
    for (const pair of q.split("&")) {
      const [sk, raw] = pair.split("=");
      const k = inv[sk];
      if (!k || raw == null) continue;
      if (typeof BASE[k] === "boolean") s[k] = raw === "1";
      else if (typeof BASE[k] === "number") { const n = parseFloat(raw); if (isFinite(n)) s[k] = n; }
      else if (MODES[k] && MODES[k].includes(raw)) s[k] = raw;
    }
  }
  return { idx, s };
}

// ----------------------------------------------------------------- utils ----

const MAX_FRAME = 0.6;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
function hash(...n) {
  let h = 2166136261;
  for (const x of n) { h ^= Math.floor(x * 1000) | 0; h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

// Decay levels of each photo, built once: blurred and pixel-block versions.
function buildLevels(img) {
  const mk = (scale, posterize) => {
    const w = Math.max(2, Math.round(img.naturalWidth * scale));
    const h = Math.max(2, Math.round(img.naturalHeight * scale));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.imageSmoothingQuality = "high";
    x.drawImage(img, 0, 0, w, h);
    if (posterize) {
      try {
        const d = x.getImageData(0, 0, w, h);
        for (let i = 0; i < d.data.length; i += 4) {
          const v = Math.round(d.data[i] / 255 * (posterize - 1)) / (posterize - 1) * 255;
          d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        }
        x.putImageData(d, 0, 0);
      } catch (e) { /* tainted canvas: keep the plain version */ }
    }
    return c;
  };
  return { full: img, soft: mk(1 / 10, 0), blocks: mk(1 / 40, 4) };
}

// --------------------------------------------------------------- render ----

function layout(W, H, photo, s, mobile) {
  const fr = clamp(s.frame, 0.15, MAX_FRAME); // never more than 60% of the window
  const maxW = W * fr;
  const maxH = H * fr;
  let pw = maxW, ph = pw / photo.aspect;
  if (ph > maxH) { ph = maxH; pw = ph * photo.aspect; }
  const cx = W / 2 + s.ox * W;
  const cy = H / 2 + s.oy * H;
  return { x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph };
}

function groundOf(photo, s) {
  if (s.ground === "dark") return false;
  if (s.ground === "light") return true;
  return photo.tones[1] > 165;
}

// Fill layer: drawn into its own canvas, rebuilt only when settings change.
function drawFill(ctx, W, H, r, photo, lv, s, light) {
  const A = s.abstraction;
  const amt = clamp((A - 0.08) / 0.55) * s.fillAmt;
  if (s.fill === "none" || amt <= 0.001 || !lv) return;
  const D = Math.hypot(W, H);

  if (s.fill === "tonal") {
    // edge tones continue outward as stepped bands that fade into the ground
    const bands = 7;
    const reach = (0.18 + 0.7 * amt) * D * 0.55;
    const sides = [
      ["top", photo.edges.top, (i, n, k) => [r.x + i / n * r.w, r.y - (k + 1) * reach / bands, r.w / n + 0.6, reach / bands + 0.6]],
      ["bottom", photo.edges.bottom, (i, n, k) => [r.x + i / n * r.w, r.y + r.h + k * reach / bands, r.w / n + 0.6, reach / bands + 0.6]],
      ["left", photo.edges.left, (i, n, k) => [r.x - (k + 1) * reach / bands, r.y + i / n * r.h, reach / bands + 0.6, r.h / n + 0.6]],
      ["right", photo.edges.right, (i, n, k) => [r.x + r.w + k * reach / bands, r.y + i / n * r.h, reach / bands + 0.6, r.h / n + 0.6]],
    ];
    for (const [, vals, rect] of sides) {
      const n = vals.length;
      for (let k = 0; k < bands; k++) {
        const fade = Math.pow(1 - k / bands, 1.7) * 0.58 * amt;
        for (let i = 0; i < n; i++) {
          // neighbours blend more the further out the band sits
          const span = Math.round(k * 0.9);
          let sum = 0, cnt = 0;
          for (let j = -span; j <= span; j++) { const v = vals[clamp(i + j, 0, n - 1)]; sum += v; cnt++; }
          const v = Math.round(sum / cnt);
          ctx.fillStyle = `rgba(${v},${v},${v},${fade.toFixed(3)})`;
          ctx.fillRect(...rect(i, n, k));
        }
      }
    }
    return;
  }

  if (s.fill === "tiles") {
    const T = Math.max(24, Math.min(r.w, r.h) / 5);
    const nx = Math.ceil(r.w / T), ny = Math.ceil(r.h / T);
    const tw = r.w / nx, th = r.h / ny;
    const maxRing = Math.ceil(Math.max(W, H) / Math.min(tw, th));
    const rings = Math.max(1, Math.round(amt * maxRing * 0.42));
    const iw = lv.full.naturalWidth, ih = lv.full.naturalHeight;
    for (let gy = -rings; gy < ny + rings; gy++) {
      for (let gx = -rings; gx < nx + rings; gx++) {
        if (gx >= 0 && gx < nx && gy >= 0 && gy < ny) continue;
        const ring = Math.max(gx < 0 ? -gx : gx - nx + 1, gy < 0 ? -gy : gy - ny + 1);
        const x = r.x + gx * tw, y = r.y + gy * th;
        if (x > W || y > H || x + tw < 0 || y + th < 0) continue;
        const sx = clamp(gx, 0, nx - 1), sy = clamp(gy, 0, ny - 1);
        const a = amt * Math.pow(1 - ring / (rings + 1), 1.4);
        const gap = Math.min(tw, th) * 0.04 * ring;
        ctx.globalAlpha = a * (ring === 1 ? 0.42 : 0.32);
        if (ring <= 3) {
          const src = ring === 1 ? lv.full : ring === 2 ? lv.soft : lv.blocks;
          const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
          const k = sw / iw;
          ctx.imageSmoothingEnabled = ring !== 3;
          ctx.drawImage(src, sx * tw / r.w * iw * k, sy * th / r.h * ih * k, tw / r.w * iw * k, th / r.h * ih * k,
            x + gap / 2, y + gap / 2, tw - gap, th - gap);
        } else {
          const edge = gy < 0 ? photo.edges.top : gy >= ny ? photo.edges.bottom : gx < 0 ? photo.edges.left : photo.edges.right;
          const pos = gy < 0 || gy >= ny ? (sx + 0.5) / nx : (sy + 0.5) / ny;
          const v = edge[Math.floor(pos * edge.length)];
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          const shrink = Math.min(0.7, 0.08 * ring);
          ctx.fillRect(x + tw * shrink / 2, y + th * shrink / 2, tw * (1 - shrink), th * (1 - shrink));
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    return;
  }

  if (s.fill === "mirror") {
    // accordion folds: each fold is flipped, fainter, and further decayed
    const folds = Math.max(1, Math.round(1 + amt * 3));
    const draw = (src, fx, fy, k) => {
      const ox = fx, oy = fy;
      const x = r.x + ox * r.w, y = r.y + oy * r.h;
      if (x > W || y > H || x + r.w < 0 || y + r.h < 0) return;
      const flipX = Math.abs(ox) % 2 === 1, flipY = Math.abs(oy) % 2 === 1;
      ctx.save();
      ctx.translate(x + (flipX ? r.w : 0), y + (flipY ? r.h : 0));
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.globalAlpha = amt * 0.46 * Math.pow(0.55, k - 1);
      ctx.imageSmoothingEnabled = src !== lv.blocks;
      ctx.drawImage(src, 0, 0, r.w, r.h);
      ctx.restore();
    };
    for (let fy = -folds; fy <= folds; fy++) {
      for (let fx = -folds; fx <= folds; fx++) {
        const k = Math.max(Math.abs(fx), Math.abs(fy));
        if (k === 0) continue;
        draw(k === 1 ? lv.soft : lv.blocks, fx, fy, k + (fx && fy ? 0.6 : 0));
      }
    }
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    // wash toward the ground so the folds read as background
    const g = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.4, r.x + r.w / 2, r.y + r.h / 2, D * 0.6);
    const bg = light ? "236,234,229" : "10,10,11";
    g.addColorStop(0, `rgba(${bg},0)`);
    g.addColorStop(1, `rgba(${bg},0.85)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

// exit distance of a ray from inside a rectangle (slab method)
function exitDist(px, py, dx, dy, r) {
  let t = Infinity;
  if (dx > 1e-6) t = Math.min(t, (r.x + r.w - px) / dx);
  if (dx < -1e-6) t = Math.min(t, (r.x - px) / dx);
  if (dy > 1e-6) t = Math.min(t, (r.y + r.h - py) / dy);
  if (dy < -1e-6) t = Math.min(t, (r.y - py) / dy);
  return Math.max(0, isFinite(t) ? t : 0);
}

const SNAP = Math.PI / 12;

function drawLines(ctx, W, H, r, photo, s, light, t, intro, pointer) {
  const A = s.abstraction;
  const ext = smooth(clamp(A / 0.5)) * s.extendAmt;
  if (ext <= 0.001) return;
  const def = clamp((A - 0.3) / 0.6) * s.deformAmt;
  const dis = clamp((A - 0.22) / 0.7) * s.disperseAmt;
  const fad = s.decompose ? (0.45 + 0.75 * A) * s.fadeAmt : 0;
  const D = Math.hypot(W, H);
  const grow = easeOut(intro);
  const ink = light ? "18,18,20" : "236,236,232";
  const lines = photo.lines.slice(0, Math.max(1, Math.ceil(photo.lines.length * s.density)));
  const sweepX = s.light ? ((t * 0.045 * Math.max(0.25, s.speed)) % 1.6 - 0.3) * W : null;
  const px = pointer ? pointer.x : W / 2, py = pointer ? pointer.y : H / 2;
  const N = 40, C = 10;
  ctx.lineCap = "round";

  lines.forEach((ln, li) => {
    const x1 = r.x + ln.x1 * r.w, y1 = r.y + ln.y1 * r.h;
    const x2 = r.x + ln.x2 * r.w, y2 = r.y + ln.y2 * r.h;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const baseW = 0.6 + 1.5 * ln.s;
    const baseA = 0.28 + 0.6 * ln.s;
    let lenK = 1;
    if (s.extend === "strength") lenK = 0.18 + 0.82 * Math.pow(ln.s, 1.3);
    const L = ext * lenK * D * 0.75 * grow;
    if (L < 2) return;
    const phase = hash(s.seed, li, 3) * Math.PI * 2;
    const sign = hash(s.seed, li, 7) > 0.5 ? 1 : -1;

    [[x2, y2, (x2 - x1) / len, (y2 - y1) / len], [x1, y1, (x1 - x2) / len, (y1 - y2) / len]].forEach(([sx, sy, dx, dy], end) => {
      const te = exitDist(sx, sy, dx, dy, r);
      const ex = sx + dx * te, ey = sy + dy * te;
      // centre path of the ray, with snap + deform applied
      const a0 = Math.atan2(dy, dx);
      const aSnap = Math.round(a0 / SNAP) * SNAP;
      const pts = new Array(N + 1);
      let cx = ex, cy = ey;
      for (let k = 0; k <= N; k++) {
        const u = (k / N) * L;
        let ang = a0;
        if (s.extend === "snap") ang = lerp(a0, aSnap, smooth(clamp(u / (D * 0.35))));
        const ddx = Math.cos(ang), ddy = Math.sin(ang);
        if (k > 0) { cx += ddx * (L / N); cy += ddy * (L / N); }
        let x = cx, y = cy;
        const nx = -ddy, ny = ddx, q = u / D;
        if (s.deform === "bend") { const o = def * sign * q * q * D * 0.9; x += nx * o; y += ny * o; }
        if (s.deform === "wave") {
          const o = def * Math.sin(u * 0.011 + t * 0.7 * s.speed + phase) * q * D * 0.12;
          x += nx * o; y += ny * o;
        }
        if (s.deform === "gravity") { const g = def * 0.55 * Math.pow(k / N, 2); x = lerp(x, px, g); y = lerp(y, py, g); }
        // a little parallax: far parts move against the pointer
        if (pointer) { x -= (px - W / 2) * q * 0.05; y -= (py - H / 2) * q * 0.05; }
        pts[k] = { x, y, nx, ny, u };
      }

      // dispersion variants
      const m = s.disperse === "none" ? 0 : Math.round(dis * (s.disperse === "scatter" ? 4 : 5));
      for (let j = 0; j <= m; j++) {
        const vA = j === 0 ? 1 : Math.pow(1 - j / (m + 1), 1.2) * 0.8;
        const vW = Math.pow(0.82, j);
        const side = j % 2 ? 1 : -1;
        const step = Math.ceil(j / 2);
        for (let c = 0; c < C; c++) {
          const k0 = Math.floor((c / C) * N), k1 = Math.floor(((c + 1) / C) * N);
          const um = pts[Math.floor((k0 + k1) / 2)].u;
          const f = clamp((um / (D * 0.6)) * fad);
          let alpha = baseA * vA * (s.decompose ? Math.pow(1 - f, 1.2) : 1 - 0.55 * (um / L));
          if (sweepX != null) {
            const mx = pts[k0].x;
            alpha *= 0.55 + 0.9 * Math.exp(-Math.pow((mx - sweepX) / (W * 0.16), 2));
          }
          if (alpha < 0.01) continue;
          // scatter: each chunk drifts off the line, more the further out
          let offN = 0, offT = 0;
          if (s.disperse === "echoes" && j > 0) offN = side * step * (3 + 26 * dis * (um / D + 0.05));
          if (s.disperse === "scatter") {
            const h1 = hash(s.seed, li, end, j, c);
            offN = (h1 - 0.5) * dis * (um / D) * D * 0.18 * (j + 1);
            offT = Math.sin(t * 0.25 * s.speed + h1 * 6.28) * dis * 10 * (um / D) * 4;
          }
          ctx.beginPath();
          for (let k = k0; k <= k1; k++) {
            const p = pts[k];
            let x = p.x, y = p.y;
            if (s.disperse === "fan" && j > 0) {
              const ang = side * step * 0.035 * dis;
              x += p.nx * Math.tan(ang) * p.u; y += p.ny * Math.tan(ang) * p.u;
            } else {
              x += p.nx * offN - p.ny * offT; y += p.ny * offN + p.nx * offT;
            }
            if (k === k0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.lineWidth = Math.max(0.35, baseW * vW * (1 - 0.65 * f));
          if (s.decompose && f > 0.18) {
            const g = clamp((f - 0.18) / 0.55);
            ctx.setLineDash([lerp(16, 0.01, g), lerp(4, 9 + 6 * g, g)]);
          } else ctx.setLineDash([]);
          ctx.strokeStyle = `rgba(${ink},${alpha.toFixed(3)})`;
          ctx.stroke();
        }
      }
    });
  });
  ctx.setLineDash([]);
}

// ----------------------------------------------------------------- UI bits ----

const FONT_SERIF = '"Instrument Serif", "Iowan Old Style", Georgia, serif';
const FONT_MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

function Seg({ value, options, onChange, light }) {
  return (
    <div className="el-seg" role="radiogroup">
      {options.map((o) => (
        <button key={o} role="radio" aria-checked={value === o} className={value === o ? "on" : ""}
          title={MODE_HELP[o]} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

function Slider({ label, value, min = 0, max = 1, step = 0.01, onChange, hint }) {
  return (
    <label className="el-slider">
      <span className="el-sl-head"><span>{label}</span><span className="el-num">{hint ?? Math.round(value * 100)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}

function LineThumb({ photo }) {
  const w = 100, h = 100 / photo.aspect;
  return (
    <svg viewBox={`-30 ${-30} ${w + 60} ${h + 60}`} className="el-thumb" aria-hidden="true">
      <rect x="0" y="0" width={w} height={h} className="el-thumb-frame" />
      {photo.lines.map((l, i) => {
        const x1 = l.x1 * w, y1 = l.y1 * h, x2 = l.x2 * w, y2 = l.y2 * h;
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
        const e = 40 * l.s;
        return <line key={i} x1={x1 - dx / L * e} y1={y1 - dy / L * e} x2={x2 + dx / L * e} y2={y2 + dy / L * e}
          strokeWidth={0.3 + 0.9 * l.s} opacity={0.35 + 0.65 * l.s} />;
      })}
    </svg>
  );
}

// ------------------------------------------------------------------- app ----

export default function App() {
  const init = (typeof location !== "undefined" && decodeHash(location.hash)) || { idx: 0, s: presetFor(PHOTOS[0].id) };
  const [idx, setIdx] = useState(init.idx);
  const [s, setS] = useState(() => {
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduce ? { ...init.s, speed: 0 } : init.s;
  });
  const [panel, setPanel] = useState(false);
  const [index, setIndex] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [idle, setIdle] = useState(false);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(0);
  const [size, setSize] = useState({ W: 800, H: 600 });

  const canvasRef = useRef(null);
  const fillRef = useRef(null);
  const imgs = useRef({});
  const sRef = useRef(s);
  const idxRef = useRef(idx);
  const introRef = useRef(0);
  const pointerRef = useRef(null);
  const rectRef = useRef(null);
  const dragRef = useRef(null);
  const fillKey = useRef("");
  sRef.current = s;
  idxRef.current = idx;

  const photo = PHOTOS[idx];
  const mobile = size.W < 720;
  const light = groundOf(photo, s);
  const set = useCallback((patch) => setS((p) => ({ ...p, ...patch })), []);

  // preload photos + their decay levels
  useEffect(() => {
    PHOTOS.forEach((p) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { imgs.current[p.id] = { img, lv: buildLevels(img) }; fillKey.current = ""; setLoaded((n) => n + 1); };
      img.src = p.src;
    });
  }, []);

  const go = useCallback((n) => {
    const i = (n + PHOTOS.length) % PHOTOS.length;
    setIdx(i);
    setS((prev) => ({ ...presetFor(PHOTOS[i].id), speed: prev.speed === 0 ? 0 : 1 }));
    introRef.current = 0;
    setIndex(false);
    try { history.replaceState(null, "", `#${PHOTOS[i].id}`); } catch (e) {}
  }, []);

  // size
  useEffect(() => {
    const on = () => setSize({ W: window.innerWidth, H: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  // keyboard
  useEffect(() => {
    const on = (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName) && e.target.type !== "range") return;
      if (e.key === "ArrowRight") go(idxRef.current + 1);
      else if (e.key === "ArrowLeft") go(idxRef.current - 1);
      else if (e.key === "i") setIndex((v) => !v);
      else if (e.key === "c") setPanel((v) => !v);
      else if (e.key === "h") setHidden((v) => !v);
      else if (e.key === " ") { e.preventDefault(); setS((p) => ({ ...p, speed: p.speed ? 0 : 1 })); }
      else if (e.key === "Escape") { setIndex(false); setPanel(false); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [go]);

  // UI fades when idle
  useEffect(() => {
    let tm;
    const wake = () => { setIdle(false); clearTimeout(tm); tm = setTimeout(() => setIdle(true), 3500); };
    wake();
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => { clearTimeout(tm); window.removeEventListener("pointermove", wake); window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", wake); };
  }, []);

  // animation loop
  useEffect(() => {
    let raf, last = performance.now(), clock = 0;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = sRef.current;
      const ph = PHOTOS[idxRef.current];
      clock += dt * (st.speed || 0);
      introRef.current = st.speed === 0 ? 1 : Math.min(1, introRef.current + dt / 1.8);
      const cv = canvasRef.current;
      if (cv) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const W = window.innerWidth, H = window.innerHeight;
        if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
          cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
          fillKey.current = "";
        }
        const ctx = cv.getContext("2d");
        const lgt = groundOf(ph, st);
        const r = layout(W, H, ph, st, W < 720);
        rectRef.current = r;
        const entry = imgs.current[ph.id];

        // fill layer cache
        const key = [ph.id, W, H, st.fill, st.fillAmt, st.abstraction, st.frame, st.ox, st.oy, lgt, !!entry].join("|");
        if (key !== fillKey.current) {
          fillKey.current = key;
          const fc = fillRef.current || (fillRef.current = document.createElement("canvas"));
          fc.width = cv.width; fc.height = cv.height;
          const fx = fc.getContext("2d");
          fx.setTransform(dpr, 0, 0, dpr, 0, 0);
          fx.clearRect(0, 0, W, H);
          drawFill(fx, W, H, r, ph, entry && entry.lv, st, lgt);
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = lgt ? "#ECEAE5" : "#0A0A0B";
        ctx.fillRect(0, 0, cv.width, cv.height);
        const intro = introRef.current;
        ctx.globalAlpha = easeOut(clamp(intro * 1.6));
        ctx.drawImage(fillRef.current, 0, 0);
        ctx.globalAlpha = 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // lines, clipped so they appear to leave the photo at its edge
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.rect(r.x + r.w, r.y, -r.w, r.h);
        ctx.clip("evenodd");
        drawLines(ctx, W, H, r, ph, st, lgt, clock, intro, pointerRef.current);
        ctx.restore();

        // the photo, breathing very slightly
        if (entry) {
          const br = 1 + 0.006 * Math.sin(clock * 0.35);
          const bw = r.w * br, bh = r.h * br;
          ctx.globalAlpha = easeOut(clamp(intro * 2.2));
          ctx.save();
          ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
          ctx.drawImage(entry.img, r.x - (bw - r.w) / 2, r.y - (bh - r.h) / 2, bw, bh);
          ctx.restore();
          ctx.globalAlpha = 1;
        }

        // moving light
        if (st.light) {
          const sx = ((clock * 0.045 * Math.max(0.25, st.speed || 0.25)) % 1.6 - 0.3) * W;
          const g = ctx.createLinearGradient(sx - W * 0.25, 0, sx + W * 0.25, H * 0.3);
          const c = lgt ? "255,255,255" : "255,255,245";
          g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.5, `rgba(${c},${lgt ? 0.12 : 0.06})`); g.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // pointer: gravity / parallax, drag the photo, swipe between photos
  const onDown = (e) => {
    const r = rectRef.current;
    const inside = r && e.clientX >= r.x && e.clientX <= r.x + r.w && e.clientY >= r.y && e.clientY <= r.y + r.h;
    dragRef.current = { x: e.clientX, y: e.clientY, ox: sRef.current.ox, oy: sRef.current.oy, photo: inside, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY };
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (d.photo) set({ ox: clamp(d.ox + dx / window.innerWidth, -0.4, 0.4), oy: clamp(d.oy + dy / window.innerHeight, -0.4, 0.4) });
  };
  const onUp = (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (e.pointerType !== "mouse") pointerRef.current = null;
    if (!d || d.photo) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(idxRef.current + (dx < 0 ? 1 : -1));
  };

  const share = async () => {
    const url = location.href.split("#")[0] + encodeState(photo.id, s);
    try { history.replaceState(null, "", encodeState(photo.id, s)); } catch (e) {}
    try { await navigator.clipboard.writeText(url); setToast("Link copied: it opens this exact version"); }
    catch (e) { setToast("Link is in the address bar"); }
    setTimeout(() => setToast(""), 2400);
  };

  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const theme = light
    ? { fg: "#141416", muted: "rgba(20,20,22,.55)", line: "rgba(20,20,22,.16)", glass: "rgba(236,234,229,.82)" }
    : { fg: "#ECECE8", muted: "rgba(236,236,232,.55)", line: "rgba(236,236,232,.16)", glass: "rgba(14,14,16,.78)" };
  const uiOpacity = hidden ? 0 : panel || index ? 1 : idle ? 0.08 : 0.32;

  return (
    <div className="el-root" style={{ "--fg": theme.fg, "--muted": theme.muted, "--line": theme.line, "--glass": theme.glass, background: light ? "#ECEAE5" : "#0A0A0B" }}>
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="el-canvas" style={{ cursor: dragRef.current?.photo ? "grabbing" : "default" }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") pointerRef.current = null; }}
        aria-label={`${photo.title}. Photograph with its lines extended onto the page.`} role="img" />

      {loaded === 0 && <div className="el-loading">Loading photographs…</div>}

      <div className="el-ui" style={{ opacity: uiOpacity, pointerEvents: hidden ? "none" : undefined }}>
        <header className="el-top">
          <div className="el-brand">Extended Lines</div>
          <div className="el-top-actions">
            <button onClick={() => setIndex(true)}>Index</button>
            <button onClick={() => setPanel((v) => !v)} aria-expanded={panel}>Controls</button>
          </div>
        </header>

        <footer className="el-bottom">
          <div className="el-caption">
            <div className="el-num-big">{roman[idx]} <span>/ {roman[PHOTOS.length - 1]}</span></div>
            <h1>{photo.title}</h1>
            <div className="el-note">{photo.note}</div>
          </div>
          <div className="el-main-controls">
            <label className="el-dial">
              <span className="el-dial-ends"><span>photo</span><span>abstraction</span></span>
              <input type="range" min="0" max="1" step="0.005" value={s.abstraction}
                onChange={(e) => set({ abstraction: parseFloat(e.target.value) })} aria-label="Abstraction" />
            </label>
            <label className="el-dial el-dial-small">
              <span className="el-dial-ends"><span>small frame</span><span>large</span></span>
              <input type="range" min="0.2" max={MAX_FRAME} step="0.005" value={s.frame}
                onChange={(e) => set({ frame: parseFloat(e.target.value) })} aria-label="Frame size" />
            </label>
          </div>
          <nav className="el-nav">
            <button onClick={() => go(idx - 1)} aria-label="Previous photo">←</button>
            <button onClick={() => go(idx + 1)} aria-label="Next photo">→</button>
          </nav>
        </footer>
      </div>

      {panel && !hidden && (
        <aside className="el-panel" aria-label="Controls">
          <div className="el-panel-head">
            <span>Pipeline</span>
            <button onClick={() => setPanel(false)} aria-label="Close controls">×</button>
          </div>
          <div className="el-chain">
            {["lines", s.extend, s.deform, s.disperse, s.decompose ? "decay" : "—", s.fill].map((n, i) => (
              <span key={i}>{i > 0 && <i>→</i>}<b className={n === "none" || n === "—" ? "off" : ""}>{n}</b></span>
            ))}
          </div>

          <section>
            <h3><em>0</em> Lines <small>from the offline Hough / outline pass</small></h3>
            <Slider label="density" value={s.density} min={0.1} onChange={(v) => set({ density: v })}
              hint={`${Math.max(1, Math.ceil(photo.lines.length * s.density))} / ${photo.lines.length}`} />
          </section>
          <section>
            <h3><em>1</em> Extend</h3>
            <Seg value={s.extend} options={MODES.extend} onChange={(v) => set({ extend: v })} />
            <Slider label="reach" value={s.extendAmt} max={1.5} onChange={(v) => set({ extendAmt: v })} />
          </section>
          <section>
            <h3><em>2</em> Deform</h3>
            <Seg value={s.deform} options={MODES.deform} onChange={(v) => set({ deform: v })} />
            {s.deform !== "none" && <Slider label="amount" value={s.deformAmt} max={2} onChange={(v) => set({ deformAmt: v })} />}
          </section>
          <section>
            <h3><em>3</em> Disperse</h3>
            <Seg value={s.disperse} options={MODES.disperse} onChange={(v) => set({ disperse: v })} />
            {s.disperse !== "none" && <Slider label="amount" value={s.disperseAmt} max={2} onChange={(v) => set({ disperseAmt: v })} />}
          </section>
          <section>
            <h3><em>4</em> Decompose <small>line → dashes → dots → nothing</small></h3>
            <Seg value={s.decompose ? "on" : "off"} options={["on", "off"]} onChange={(v) => set({ decompose: v === "on" })} />
            {s.decompose && <Slider label="speed of decay" value={s.fadeAmt} min={0.2} max={2} onChange={(v) => set({ fadeAmt: v })} />}
          </section>
          <section>
            <h3><em>5</em> Fill <small>the ground around the photo</small></h3>
            <Seg value={s.fill} options={MODES.fill} onChange={(v) => set({ fill: v })} />
            {s.fill !== "none" && <Slider label="amount" value={s.fillAmt} max={1.5} onChange={(v) => set({ fillAmt: v })} />}
          </section>
          <section>
            <h3>Stage</h3>
            <div className="el-row"><span className="el-lab">ground</span><Seg value={s.ground} options={MODES.ground} onChange={(v) => set({ ground: v })} /></div>
            <div className="el-row"><span className="el-lab">moving light</span><Seg value={s.light ? "on" : "off"} options={["on", "off"]} onChange={(v) => set({ light: v === "on" })} /></div>
            <Slider label="motion" value={s.speed} max={3} onChange={(v) => set({ speed: v })} hint={s.speed === 0 ? "frozen" : `${s.speed.toFixed(1)}×`} />
            <p className="el-tip">Drag the photo to move it: the lines re-extend from the new spot.</p>
          </section>
          <div className="el-panel-actions">
            <button onClick={() => set({ seed: Math.floor(Math.random() * 9999) + 2 })}>New variation</button>
            <button onClick={() => { setS({ ...presetFor(photo.id), speed: s.speed }); introRef.current = 0; }}>Artist's version</button>
            <button onClick={share}>Copy link</button>
          </div>
          <p className="el-keys">← → photos · space pause · c controls · i index · h hide</p>
        </aside>
      )}

      {index && (
        <div className="el-index" role="dialog" aria-label="Index of photographs">
          <div className="el-index-head">
            <span>Index</span>
            <button onClick={() => setIndex(false)} aria-label="Close index">×</button>
          </div>
          <div className="el-index-grid">
            {PHOTOS.map((p, i) => (
              <button key={p.id} className={i === idx ? "cur" : ""} onClick={() => go(i)}>
                <LineThumb photo={p} />
                <span className="el-index-cap"><b>{roman[i]}</b> {p.title}</span>
              </button>
            ))}
          </div>
          <p className="el-index-foot">Only the lines found in each photograph. Choose one to see it.</p>
        </div>
      )}

      {toast && <div className="el-toast" role="status">{toast}</div>}
    </div>
  );
}

const CSS = `
.el-root { position: fixed; inset: 0; overflow: hidden; color: var(--fg); font-family: ${FONT_MONO}; transition: background .6s; }
.el-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
.el-loading { position: absolute; inset: 0; display: grid; place-items: center; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.el-ui { position: absolute; inset: 0; pointer-events: none; transition: opacity .8s; }
.el-ui:hover, .el-ui:focus-within { opacity: 1 !important; transition: opacity .25s; }
.el-ui > * { pointer-events: auto; }
.el-root button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; padding: 0; }
.el-top { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center;
  padding: max(14px, env(safe-area-inset-top)) 16px 0; font-size: 9px; letter-spacing: .18em; text-transform: uppercase; }
.el-top-actions { display: flex; gap: 14px; }
.el-top-actions button { letter-spacing: .18em; text-transform: uppercase; font-size: 9px; color: var(--muted); padding: 6px 0; }
.el-top-actions button:hover, .el-top-actions button[aria-expanded="true"] { color: var(--fg); }
.el-bottom { position: absolute; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: 1fr auto auto; align-items: end; gap: 18px;
  padding: 0 16px max(14px, env(safe-area-inset-bottom)); }
.el-caption h1 { font-family: ${FONT_SERIF}; font-weight: 400; font-size: 20px; line-height: 1; margin: 3px 0 3px; letter-spacing: 0; }
.el-num-big { font-size: 9px; letter-spacing: .18em; }
.el-num-big span, .el-note { color: var(--muted); }
.el-note { font-size: 9px; letter-spacing: .06em; }
.el-main-controls { display: grid; gap: 2px; width: min(170px, 30vw); }
.el-dial { display: grid; gap: 0; }
.el-dial-ends { display: flex; justify-content: space-between; font-size: 8px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.el-nav { display: flex; gap: 2px; }
.el-nav button { width: 28px; height: 28px; border: 0; font-size: 12px; color: var(--muted); }
.el-nav button:hover { color: var(--fg); }
.el-root input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 24px; background: transparent; margin: 0; cursor: pointer; }
.el-root input[type=range]::-webkit-slider-runnable-track { height: 1px; background: var(--line); }
.el-root input[type=range]::-moz-range-track { height: 1px; background: var(--line); }
.el-root input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: -7px; border-radius: 50%; background: var(--fg); border: 0; }
.el-root input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--fg); border: 0; }
.el-root input[type=range]:focus-visible { outline: 1px dashed var(--fg); outline-offset: 2px; }
.el-dial input[type=range] { height: 18px; }
.el-dial input[type=range]::-webkit-slider-thumb { width: 8px; height: 8px; margin-top: -4px; }
.el-dial input[type=range]::-moz-range-thumb { width: 8px; height: 8px; }
.el-panel { position: absolute; top: 56px; right: 16px; bottom: 120px; width: 330px; overflow-y: auto; background: var(--glass);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px 18px; font-size: 11px; }
.el-panel-head, .el-index-head { display: flex; justify-content: space-between; align-items: center; letter-spacing: .16em; text-transform: uppercase; font-size: 11px; }
.el-panel-head button, .el-index-head button { font-size: 20px; line-height: 1; width: 32px; height: 32px; }
.el-chain { display: flex; flex-wrap: wrap; gap: 2px 0; margin: 10px 0 6px; font-size: 10px; }
.el-chain i { font-style: normal; color: var(--muted); margin: 0 5px; }
.el-chain b { font-weight: 500; }
.el-chain b.off { color: var(--muted); text-decoration: line-through; }
.el-panel section { border-top: 1px solid var(--line); padding: 12px 0 4px; }
.el-panel h3 { font-family: ${FONT_SERIF}; font-weight: 400; font-size: 19px; margin: 0 0 8px; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.el-panel h3 em { font-family: ${FONT_MONO}; font-style: normal; font-size: 10px; color: var(--muted); }
.el-panel h3 small { font-family: ${FONT_MONO}; font-size: 10px; color: var(--muted); }
.el-seg { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.el-seg button { border: 1px solid var(--line); border-radius: 999px; padding: 5px 10px; font-size: 10.5px; letter-spacing: .04em; min-height: 28px; }
.el-seg button.on { background: var(--fg); color: var(--glass); border-color: var(--fg); }
.el-seg button:not(.on):hover { border-color: var(--fg); }
.el-slider { display: block; margin: 4px 0; }
.el-sl-head { display: flex; justify-content: space-between; color: var(--muted); font-size: 10.5px; }
.el-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.el-row .el-seg { margin: 0; }
.el-lab { color: var(--muted); min-width: 82px; }
.el-tip, .el-keys { color: var(--muted); font-size: 10px; line-height: 1.5; margin: 8px 0 0; }
.el-panel-actions { display: flex; flex-wrap: wrap; gap: 6px; border-top: 1px solid var(--line); padding-top: 12px; margin-top: 8px; }
.el-panel-actions button { border: 1px solid var(--fg); border-radius: 999px; padding: 7px 12px; font-size: 10.5px; min-height: 32px; }
.el-panel-actions button:hover { background: var(--fg); color: var(--glass); }
.el-index { position: absolute; inset: 0; background: var(--glass); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
  padding: max(18px, env(safe-area-inset-top)) 22px 22px; overflow-y: auto; }
.el-index-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 18px; margin-top: 22px; }
.el-index-grid button { display: grid; gap: 8px; text-align: left; border: 1px solid transparent; border-radius: 10px; padding: 10px; transition: border-color .2s; }
.el-index-grid button:hover, .el-index-grid button.cur { border-color: var(--line); }
.el-thumb { width: 100%; height: 180px; }
.el-thumb line { stroke: var(--fg); stroke-linecap: round; }
.el-thumb-frame { fill: none; stroke: var(--line); stroke-width: .5; }
.el-index-cap { font-size: 11px; letter-spacing: .06em; }
.el-index-cap b { font-weight: 400; color: var(--muted); margin-right: 6px; }
.el-index-foot { color: var(--muted); font-size: 10.5px; margin-top: 20px; }
.el-toast { position: absolute; left: 50%; top: 64px; transform: translateX(-50%); background: var(--fg); color: var(--glass); font-size: 11px; padding: 8px 14px; border-radius: 999px; }
@media (max-width: 720px) {
  .el-bottom { grid-template-columns: 1fr auto; gap: 6px 12px; }
  .el-caption { grid-column: 1 / 2; }
  .el-nav { grid-column: 2 / 3; grid-row: 1; align-self: end; }
  .el-main-controls { grid-column: 1 / -1; width: 46vw; }
  .el-dial-small { display: none; }
  .el-caption h1 { font-size: 18px; }
  .el-panel { top: auto; left: 0; right: 0; bottom: 0; width: auto; max-height: 62dvh; border-radius: 16px 16px 0 0; border-left: 0; border-right: 0; border-bottom: 0;
    padding-bottom: max(18px, env(safe-area-inset-bottom)); }
  .el-index-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .el-thumb { height: 120px; }
}
@media (prefers-reduced-motion: reduce) { .el-ui, .el-root { transition: none; } }
`;
