#!/usr/bin/env python3
"""Offline analysis for Extended Lines (run once per photo set).

Reads the original photos, and for each one writes:
  extended-lines/photos/<id>.jpg   web version (greyscale, 1600 px long side)
  src/extended-lines/photos.json   the line model: Hough lines, tones, edge strips

Usage (from the repo root):
  pip install opencv-python-headless numpy
  python3 src/extended-lines/analyse.py /path/to/originals [--debug]

Each photo has a small recipe below. "detect" picks how edges are found:
  edges  - Canny on a smoothed image (good for crisp architecture)
  mask   - split into dark / light first (Otsu), then find edges of that
           shape (good for silhouettes and railings)
  poly   - split into dark / light, then simplify the outlines into a
           polygon; its sides become the lines (good for soft, organic
           shapes: stone, trees in fog, where Hough finds little)
"""
import cv2, numpy as np, json, math, sys, os

PHOTOS = [
    # id, file, title, place / note, recipe
    ("organ",    "DSC_6137-EDIT.jpg",       "Organ",        "Church interior",  dict(detect="edges", blur=7, min_len=0.07, gap=4, max_lines=48)),
    ("alley",    "20180421_225002.jpg",     "Alley",        "Old town",         dict(detect="edges", blur=5, min_len=0.08, gap=6, max_lines=48)),
    ("railings", "DSC_0635.jpg",            "Railings",     "Stairs, low sun",  dict(detect="mask",  blur=5, min_len=0.06, gap=6, max_lines=30, clip=(0.0, 0.83))),
    ("stone",    "223_2398-1.jpg",          "Stone",        "Field, late summer", dict(detect="poly", blur=6, min_len=0.03, eps=0.008, max_lines=40, level=72)),
    ("grass",    "IMG_20231111_093248.jpg", "Grass in fog", "Meadow",           dict(detect="poly",  blur=4, min_len=0.025, eps=0.007, max_lines=40, level=30, clahe=3.0)),
    ("filharmonia", "IMG_20260613_223131.jpg", "Filharmonia", "Concert hall, before the rehearsal", dict(detect="edges", blur=5, min_len=0.07, gap=5, max_lines=50)),
]
LONG = 1600      # web size
WORK = 1400      # analysis size


def poly_lines(g, r):
    """Outline of the dark/light split, simplified to straight sides."""
    h, w = g.shape
    c = cv2.createCLAHE(r.get("clahe", 2.0), (8, 8)).apply(g)
    b = cv2.GaussianBlur(c, (0, 0), r["blur"])
    if "level" in r:
        _, m = cv2.threshold(b, int(np.percentile(b, r["level"])), 255, cv2.THRESH_BINARY)
    else:
        _, m = cv2.threshold(b, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    cs = [c for c in cs if cv2.contourArea(c) > 0.002 * w * h]
    out = []
    for cnt in cs:
        ap = cv2.approxPolyDP(cnt, r.get("eps", 0.006) * max(w, h), True).reshape(-1, 2)
        for i in range(len(ap)):
            (x1, y1), (x2, y2) = ap[i], ap[(i + 1) % len(ap)]
            # skip sides lying on the photo border: they are the frame, not the image
            if (x1 <= 2 and x2 <= 2) or (x1 >= w - 3 and x2 >= w - 3) or (y1 <= 2 and y2 <= 2) or (y1 >= h - 3 and y2 >= h - 3):
                continue
            ln = math.hypot(x2 - x1, y2 - y1)
            if ln >= r["min_len"] * max(w, h):
                out.append([int(x1), int(y1), int(x2), int(y2), ln, math.atan2(y2 - y1, x2 - x1) % math.pi])
    return out, m


def detect_lines(g, r):
    h, w = g.shape
    if r["detect"] == "poly":
        out, ed = poly_lines(g, r)
        out.sort(key=lambda l: -l[4])
        return out[:r["max_lines"]], ed
    if r["detect"] == "mask":
        b = cv2.medianBlur(g, r["blur"] | 1)
        _, m = cv2.threshold(b, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        ed = cv2.Canny(m, 50, 150)
    else:
        c = cv2.createCLAHE(r.get("clahe", 2.0), (8, 8)).apply(g)
        b = cv2.bilateralFilter(c, r["blur"] | 1, 40, 9) if r["blur"] > 3 else cv2.GaussianBlur(c, (3, 3), 0)
        b = cv2.medianBlur(b, r["blur"] | 1)
        v = float(np.median(b))
        ed = cv2.Canny(b, int(max(20, .66 * v)), int(min(255, 1.33 * v + 40)))
    if "clip" in r:  # only look inside a vertical band (fractions of height)
        y0, y1 = int(r["clip"][0] * h), int(r["clip"][1] * h)
        ed[:y0] = 0; ed[y1:] = 0
    L = cv2.HoughLinesP(ed, 1, np.pi / 360, 50,
                        minLineLength=int(r["min_len"] * max(w, h)), maxLineGap=r["gap"])
    out = []
    if L is not None:
        for x1, y1, x2, y2 in L.reshape(-1, 4).tolist():
            ln = math.hypot(x2 - x1, y2 - y1)
            out.append([x1, y1, x2, y2, ln, math.atan2(y2 - y1, x2 - x1) % math.pi])
    out.sort(key=lambda l: -l[4])
    kept = []
    for l in out:  # drop near-duplicates (same angle, nearly same line)
        mx, my = (l[0] + l[2]) / 2, (l[1] + l[3]) / 2
        dup = False
        for k in kept:
            da = abs(l[5] - k[5]); da = min(da, math.pi - da)
            d = abs((mx - k[0]) * math.sin(k[5]) - (my - k[1]) * math.cos(k[5]))
            if da < 0.06 and d < 14:
                dup = True; break
        if not dup:
            kept.append(l)
        if len(kept) >= r["max_lines"]:
            break
    return kept, ed


def strip(g, side, n=32):
    h, w = g.shape; vals = []
    for i in range(n):
        a, b = int(i / n * (w if side in ("top", "bottom") else h)), int((i + 1) / n * (w if side in ("top", "bottom") else h))
        if side == "top":    patch = g[:max(2, h // 30), a:b]
        if side == "bottom": patch = g[h - max(2, h // 30):, a:b]
        if side == "left":   patch = g[a:b, :max(2, w // 30)]
        if side == "right":  patch = g[a:b, w - max(2, w // 30):]
        vals.append(int(patch.mean()))
    return vals


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "."
    debug = "--debug" in sys.argv
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.abspath(os.path.join(here, "..", ".."))
    photo_dir = os.path.join(root, "extended-lines", "photos")
    os.makedirs(photo_dir, exist_ok=True)
    result = []
    for pid, fname, title, note, r in PHOTOS:
        im = cv2.imread(os.path.join(src, fname))
        if im is None:
            print("missing", fname); continue
        g0 = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
        web = cv2.resize(g0, None, fx=LONG / max(g0.shape), fy=LONG / max(g0.shape), interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(photo_dir, pid + ".jpg"), web, [cv2.IMWRITE_JPEG_QUALITY, 84, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
        g = cv2.resize(g0, None, fx=WORK / max(g0.shape), fy=WORK / max(g0.shape), interpolation=cv2.INTER_AREA)
        h, w = g.shape
        lines, ed = detect_lines(g, r)
        top = lines[0][4] if lines else 1
        tone = lambda x, y: int(g[int(min(h - 1, max(0, y))), int(min(w - 1, max(0, x)))])
        L = [{"x1": round(a / w, 4), "y1": round(b / h, 4), "x2": round(c / w, 4), "y2": round(d / h, 4),
              "s": round(ln / top, 3), "t": tone((a + c) / 2, (b + d) / 2)} for a, b, c, d, ln, _ in lines]
        result.append({"id": pid, "title": title, "note": note, "src": f"photos/{pid}.jpg",
                       "aspect": round(w / h, 4),
                       "tones": [int(np.percentile(g, p)) for p in (5, 50, 95)],
                       "edges": {s: strip(g, s) for s in ("top", "right", "bottom", "left")},
                       "lines": L})
        print(f"{pid:9s} {w}x{h}  {len(L):2d} lines")
        if debug:
            dbg = cv2.cvtColor(g, cv2.COLOR_GRAY2BGR) // 2
            for a, b, c, d, *_ in lines:
                cv2.line(dbg, (a, b), (c, d), (60, 60, 255), 3)
            cv2.imwrite(f"/tmp/el_dbg_{pid}.png", cv2.resize(dbg, None, fx=.3, fy=.3))
    with open(os.path.join(here, "photos.json"), "w") as f:
        json.dump(result, f, separators=(",", ":"))


if __name__ == "__main__":
    main()
