#!/usr/bin/env python3
"""Turns the raw downloads (osm.json + terrain/*.png) into zelkow/map.json,
the compact file the page loads.

    python3 src/zelkow/data/build_map.py        (from the repo root; needs Pillow)

World units: x = east, z = south, 1 unit = UNIT metres, origin = centre of the box.
"""
import json, math, os, glob, base64, io
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', '..', 'zelkow', 'map.json')

S, N, W, E = 50.143, 50.186, 19.750, 19.832     # crop of the downloaded box
UNIT = 90.0                                       # metres per world unit
VEX = 2.6                                         # vertical exaggeration
LAT0, LON0 = (S + N) / 2, (W + E) / 2
MX = 111320 * math.cos(math.radians(LAT0)) / UNIT  # units per degree lon
MZ = 110574 / UNIT                                 # units per degree lat
HX, HZ = (E - W) / 2 * MX, (N - S) / 2 * MZ        # half sizes in units


def xz(lat, lon):
    return ((lon - LON0) * MX, (LAT0 - lat) * MZ)


def inside(x, z, m=0.0):
    return -HX - m <= x <= HX + m and -HZ - m <= z <= HZ + m


def r2(v):
    return round(v, 2)


# ------------------------------------------------------------------ elevation
Z = 13
tiles = {}
for p in glob.glob(os.path.join(HERE, 'terrain', '*.png')):
    z, tx, ty = map(int, os.path.basename(p)[:-4].split('_'))
    tiles[(tx, ty)] = Image.open(p).convert('RGB').load()


def elev(lat, lon):
    n = 2 ** Z
    fx = (lon + 180) / 360 * n
    fy = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    def px(ix, iy):
        tx, ty = ix // 256, iy // 256
        r, g, b = tiles[(tx, ty)][ix % 256, iy % 256]
        return r * 256 + g + b / 256 - 32768
    X, Y = fx * 256 - 0.5, fy * 256 - 0.5
    x0, y0 = int(math.floor(X)), int(math.floor(Y)); ax, ay = X - x0, Y - y0
    return (px(x0, y0) * (1 - ax) * (1 - ay) + px(x0 + 1, y0) * ax * (1 - ay)
            + px(x0, y0 + 1) * (1 - ax) * ay + px(x0 + 1, y0 + 1) * ax * ay)


STEP = 0.33
NX, NZ = int(round(2 * HX / STEP)) + 1, int(round(2 * HZ / STEP)) + 1
raw = []
for j in range(NZ):
    for i in range(NX):
        x, z = -HX + 2 * HX * i / (NX - 1), -HZ + 2 * HZ * j / (NZ - 1)
        raw.append(elev(LAT0 - z / MZ, LON0 + x / MX))
EMIN, EMAX = min(raw), max(raw)
heights = [round((e - EMIN) / UNIT * VEX * 100) for e in raw]   # centi-units
print(f'terrain {NX}x{NZ}, {EMIN:.0f}–{EMAX:.0f} m')

# ------------------------------------------------------------------ OSM
osm = json.load(open(os.path.join(HERE, 'osm.json')))['elements']


def geom_xz(g):
    return [xz(p['lat'], p['lon']) for p in g if p]


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    ax, az = pts[0]; bx, bz = pts[-1]; dx, dz = bx - ax, bz - az; L = math.hypot(dx, dz) or 1e-9
    i, dmax = 0, 0
    for k in range(1, len(pts) - 1):
        d = abs((pts[k][0] - ax) * dz - (pts[k][1] - az) * dx) / L
        if d > dmax:
            i, dmax = k, d
    if dmax <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[:i + 1], tol)[:-1] + simplify(pts[i:], tol)


def clip_line(pts, m=0.3):
    """split a polyline into the runs that are inside the box"""
    runs, cur = [], []
    for p in pts:
        if inside(p[0], p[1], m):
            cur.append(p)
        else:
            if len(cur) > 1:
                runs.append(cur)
            cur = []
    if len(cur) > 1:
        runs.append(cur)
    return runs


def flat(pts):
    return [v for p in pts for v in (r2(p[0]), r2(p[1]))]


def rings(e):
    if e['type'] == 'way' and e.get('geometry'):
        return [geom_xz(e['geometry'])], []
    if e['type'] == 'relation':
        outer = [geom_xz(m['geometry']) for m in e.get('members', []) if m.get('geometry') and m.get('role') != 'inner']
        inner = [geom_xz(m['geometry']) for m in e.get('members', []) if m.get('geometry') and m.get('role') == 'inner']
        return join_ways(outer, closed=True), join_ways(inner, closed=True)
    return [], []


def join_ways(ways, closed=False):
    """greedily join ways that share end points into longer lines / rings"""
    ways = [list(w) for w in ways if len(w) > 1]
    out = []
    key = lambda p: (round(p[0], 3), round(p[1], 3))
    while ways:
        cur = ways.pop(0)
        changed = True
        while changed:
            changed = False
            for k, w in enumerate(ways):
                if key(w[0]) == key(cur[-1]):
                    cur += w[1:]
                elif key(w[-1]) == key(cur[-1]):
                    cur += w[::-1][1:]
                elif key(w[-1]) == key(cur[0]):
                    cur = w[:-1] + cur
                elif key(w[0]) == key(cur[0]):
                    cur = w[::-1][:-1] + cur
                else:
                    continue
                ways.pop(k); changed = True; break
        out.append(cur)
    return out


# land cover raster
LC_RES = 0.25
LW, LH = int(2 * HX / LC_RES), int(2 * HZ / LC_RES)
CLASSES = [  # painted in this order, later wins
    ('f', lambda t: t.get('landuse') == 'farmland'),
    ('m', lambda t: t.get('landuse') in ('meadow', 'grass', 'village_green', 'recreation_ground') or t.get('natural') == 'grassland'),
    ('o', lambda t: t.get('landuse') == 'orchard'),
    ('s', lambda t: t.get('natural') in ('scrub', 'heath')),
    ('w', lambda t: t.get('natural') == 'wood' or t.get('landuse') == 'forest'),
    ('r', lambda t: t.get('landuse') in ('residential', 'religious', 'cemetery')),
    ('y', lambda t: t.get('landuse') in ('farmyard', 'industrial', 'construction', 'quarry', 'commercial')),
    ('a', lambda t: t.get('natural') == 'water' or t.get('landuse') in ('reservoir', 'basin')),
    ('b', lambda t: t.get('natural') == 'bare_rock'),
]
CODE = {c: i + 1 for i, (c, _) in enumerate(CLASSES)}
img = Image.new('L', (LW, LH), 0)
dr = ImageDraw.Draw(img)
to_px = lambda p: ((p[0] + HX) / LC_RES, (p[1] + HZ) / LC_RES)
for c, test in CLASSES:
    for e in osm:
        t = e.get('tags', {})
        if not test(t):
            continue
        outer, inner = rings(e)
        for r in outer:
            if len(r) > 2:
                dr.polygon([to_px(p) for p in r], fill=CODE[c])
        for r in inner:
            if len(r) > 2:
                dr.polygon([to_px(p) for p in r], fill=0)
LETTERS = '.' + ''.join(c for c, _ in CLASSES)
px = img.load()
landcover = ''.join(LETTERS[px[i, j]] for j in range(LH) for i in range(LW))

# buildings: oriented boxes
buildings = []
for e in osm:
    t = e.get('tags', {})
    if 'building' not in t or e['type'] != 'way' or not e.get('geometry'):
        continue
    pts = geom_xz(e['geometry'])
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) < 3:
        continue
    cx, cz = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
    if not inside(cx, cz, -0.2):
        continue
    best = None
    for k in range(len(pts)):  # longest edge gives the orientation
        a, b = pts[k], pts[(k + 1) % len(pts)]
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        if not best or L > best[0]:
            best = (L, math.atan2(b[0] - a[0], b[1] - a[1]))
    ang = best[1]; ca, sa = math.cos(ang), math.sin(ang)
    us = [(p[0] - cx) * sa + (p[1] - cz) * ca for p in pts]
    vs = [(p[0] - cx) * ca - (p[1] - cz) * sa for p in pts]
    l, w = max(us) - min(us), max(vs) - min(vs)
    area = l * w * UNIT * UNIT
    if area < 18:
        continue
    kind = 0
    if t.get('building') in ('church', 'chapel') or t.get('amenity') == 'place_of_worship':
        kind = 2
    elif area > 400 or t.get('building') in ('barn', 'farm_auxiliary', 'industrial', 'warehouse', 'school', 'commercial'):
        kind = 1
    buildings.append([r2(cx), r2(cz), round(l, 3), round(w, 3), round(ang, 2), kind])
print(len(buildings), 'buildings')

# lines
ROADCLASS = {'primary': 0, 'secondary': 0, 'tertiary': 0, 'unclassified': 1, 'residential': 1, 'living_street': 1,
             'track': 2, 'path': 3, 'footway': 3, 'steps': 3, 'bridleway': 3, 'cycleway': 3}
roads = [[], [], [], []]
streams, cliffs, waters = [], [], []
for e in osm:
    t = e.get('tags', {})
    if e['type'] != 'way' or not e.get('geometry'):
        continue
    pts = geom_xz(e['geometry'])
    if t.get('highway') in ROADCLASS:
        for run in clip_line(simplify(pts, 0.04)):
            roads[ROADCLASS[t['highway']]].append(flat(run))
    elif t.get('waterway') in ('stream', 'river', 'ditch', 'drain', 'canal'):
        for run in clip_line(simplify(pts, 0.04)):
            streams.append(flat(run))
    if t.get('natural') == 'cliff':
        for run in clip_line(pts, 0):
            cliffs.append(flat(run))

# rock spires: along cliff lines and inside bare-rock areas
spires = []
def add_spire(x, z, s):
    for q in spires:
        if abs(q[0] - x) < 0.16 and abs(q[1] - z) < 0.16:
            return
    spires.append([r2(x), r2(z), r2(s)])
for c in cliffs:
    pts = list(zip(c[0::2], c[1::2]))
    L = sum(math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]) for k in range(len(pts) - 1))
    n = max(1, int(L / 0.22))
    acc, k = 0.0, 0
    for s in range(n + 1):
        d = L * s / n
        while k < len(pts) - 2 and acc + math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]) < d:
            acc += math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); k += 1
        seg = math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]) or 1
        f = min(1, (d - acc) / seg)
        add_spire(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f, 1.0)
for e in osm:
    t = e.get('tags', {})
    if t.get('natural') in ('bare_rock', 'rock', 'stone'):
        outer, _ = rings(e) if e['type'] != 'node' else ([[xz(e['lat'], e['lon'])]], [])
        for r in outer:
            if not r:
                continue
            cx, cz = sum(p[0] for p in r) / len(r), sum(p[1] for p in r) / len(r)
            if inside(cx, cz, -0.1):
                add_spire(cx, cz, 0.6 if t.get('natural') == 'stone' else 1.15)
print(len(spires), 'rock spires')

# named rocks for labels
named_rocks = {}
for e in osm:
    t = e.get('tags', {})
    if t.get('natural') in ('cliff', 'bare_rock', 'rock') and t.get('name'):
        outer, _ = rings(e)
        pts = [p for r in outer for p in r]
        if pts:
            nm = t['name'].strip()
            named_rocks.setdefault(nm, []).extend(pts)
rocks_named = []
for nm, pts in named_rocks.items():
    cx, cz = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
    if inside(cx, cz, -0.3):
        rocks_named.append([nm, r2(cx), r2(cz)])

# trails
trails = []
COL = {'red': '#d2453a', 'blue': '#3c74c9', 'yellow': '#e6b92e', 'green': '#3f9a4a', 'black': '#2b2b2b'}
for e in osm:
    t = e.get('tags', {})
    if t.get('type') != 'route' or t.get('route') not in ('hiking', 'bicycle'):
        continue
    ways = [geom_xz(m['geometry']) for m in e.get('members', []) if m['type'] == 'way' and m.get('geometry')]
    lines = []
    for ch in join_ways(ways):
        for run in clip_line(simplify(ch, 0.03), 0):
            if len(run) > 1:
                lines.append(flat(run))
    if lines:
        trails.append({'kind': t['route'], 'colour': COL.get(t.get('colour', ''), '#888888'), 'name': t.get('name', ''), 'lines': lines})
print(len(trails), 'trails in the box')

# points of interest
pois, places = [], []
for e in osm:
    t = e.get('tags', {})
    if e['type'] == 'node':
        x, z = xz(e['lat'], e['lon'])
    else:
        g = e.get('geometry') or []
        if not g:
            continue
        x = sum(xz(p['lat'], p['lon'])[0] for p in g) / len(g); z = sum(xz(p['lat'], p['lon'])[1] for p in g) / len(g)
    if not inside(x, z, -0.2):
        continue
    nm = t.get('name', '')
    if t.get('place') in ('village', 'hamlet') and e['type'] == 'node':
        places.append([nm, t['place'][0], r2(x), r2(z)])
        continue
    kind = None
    if t.get('natural') == 'cave_entrance': kind = 'cave'
    elif t.get('tourism') == 'viewpoint': kind = 'view'
    elif t.get('natural') == 'peak': kind = 'peak'
    elif t.get('natural') == 'spring': kind = 'spring'
    elif t.get('tourism') == 'picnic_site': kind = 'picnic'
    elif t.get('historic') == 'castle': kind = 'castle'
    elif t.get('historic') in ('wayside_shrine', 'wayside_cross'): kind = 'shrine'
    elif t.get('amenity') == 'place_of_worship' and e['type'] == 'way': kind = 'church'
    elif t.get('tourism') == 'attraction' and nm: kind = 'attraction'
    elif t.get('tourism') == 'camp_site': kind = 'camp'
    if kind:
        if t.get('ele'): nm = (nm + f' ({t["ele"]} m)').strip()
        pois.append([kind, nm, r2(x), r2(z)])

# ------------------------------------------------------------------ Zelków highlights
def poly_of(e):
    outer, _ = rings(e)
    return [r for r in outer if len(r) > 2]


def point_in(p, ring):
    x, z = p; c = False
    for k in range(len(ring)):
        (x1, z1), (x2, z2) = ring[k], ring[k - 1]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1 + 1e-12) + x1:
            c = not c
    return c


def centroid(pts):
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def elxz(e):
    if e['type'] == 'node':
        return xz(e['lat'], e['lon'])
    pts = [p for r in poly_of(e) for p in r] or geom_xz([g for m in e.get('members', []) for g in (m.get('geometry') or []) if g])
    return centroid(pts) if pts else None


schools, pitches, playgrounds, waters = [], [], [], []
for e in osm:
    t = e.get('tags', {})
    am, le = t.get('amenity'), t.get('leisure')
    if am in ('school', 'kindergarten'):
        c = elxz(e)
        if c and inside(*c, -0.2):
            schools.append({'name': t.get('name', ''), 'kind': am, 'x': r2(c[0]), 'z': r2(c[1]), 'rings': [flat(r) for r in poly_of(e)]})
    elif le in ('pitch', 'stadium'):
        for r in poly_of(e):
            c = centroid(r)
            if inside(*c, -0.2):
                pitches.append({'name': t.get('name', ''), 'sport': t.get('sport', ''), 'ring': flat(r)})
    elif le == 'playground':
        c = elxz(e)
        if c and inside(*c, -0.2):
            playgrounds.append({'x': r2(c[0]), 'z': r2(c[1]), 'ring': flat(poly_of(e)[0]) if poly_of(e) else []})
    if t.get('natural') == 'water' and e['type'] == 'way':
        for r in poly_of(e):
            c = centroid(r)
            if inside(*c, -0.2):
                waters.append({'name': t.get('name', ''), 'ring': flat(r)})
# buildings that belong to a school / kindergarten get their own colour
school_rings = [pairs for s in schools for pairs in [list(zip(f[0::2], f[1::2])) for f in s['rings']]]
for b in buildings:
    if any(point_in((b[0], b[1]), r) for r in school_rings) or any(math.hypot(b[0] - s['x'], b[1] - s['z']) < 0.12 for s in schools if not s['rings']):
        b[5] = 3

# al. Jana Pawła II in Zelków (there is another one in Kobylany)
jp2 = []
for e in osm:
    t = e.get('tags', {})
    if e['type'] == 'way' and t.get('highway') and 'Jana Pawła' in t.get('name', '') and e.get('geometry'):
        pts = geom_xz(e['geometry'])
        if centroid(pts)[0] > xz(50.15, 19.785)[0]:
            jp2.append(flat(simplify(pts, 0.03)))

# bus 248: route line, its stops in the box, and where it leaves the map
bus = None
stops_all = {}
for e in osm:
    t = e.get('tags', {})
    if e['type'] == 'node' and (t.get('highway') == 'bus_stop' or t.get('public_transport') == 'platform') and t.get('name'):
        stops_all.setdefault(t['name'], []).append(xz(e['lat'], e['lon']))
for e in osm:
    t = e.get('tags', {})
    if t.get('route') == 'bus' and t.get('ref') == '248' and 'Zelków Pętla' in t.get('to', ''):
        ways = [geom_xz(m['geometry']) for m in e['members'] if m['type'] == 'way' and m.get('geometry')]
        lines = [run for ch in join_ways(ways) for run in clip_line(simplify(ch, 0.03), 0)]
        lines.sort(key=lambda r: -len(r))
        names = []
        for m in e['members']:
            if m['type'] == 'node' and m.get('role', '').startswith('platform') and 'lat' in m:
                p = xz(m['lat'], m['lon'])
                if inside(*p, -0.1):
                    nm = next((n for n, ps in stops_all.items() if any(math.hypot(p[0] - q[0], p[1] - q[1]) < 0.05 for q in ps)), '')
                    names.append([nm, r2(p[0]), r2(p[1])])
        exit_pt = None
        for ch in join_ways(ways):  # find where the raw line crosses the map edge
            for k in range(len(ch) - 1):
                a, b = ch[k], ch[k + 1]
                if inside(*a) != inside(*b):
                    i_, o_ = (a, b) if inside(*a) else (b, a)
                    lo, hi = 0.0, 1.0
                    for _ in range(30):
                        mid = (lo + hi) / 2
                        q = (i_[0] + (o_[0] - i_[0]) * mid, i_[1] + (o_[1] - i_[1]) * mid)
                        lo, hi = (mid, hi) if inside(*q) else (lo, mid)
                    q = (i_[0] + (o_[0] - i_[0]) * lo, i_[1] + (o_[1] - i_[1]) * lo)
                    d = math.hypot(o_[0] - i_[0], o_[1] - i_[1]) or 1
                    exit_pt = [r2(q[0]), r2(q[1]), r2((o_[0] - i_[0]) / d), r2((o_[1] - i_[1]) / d)]
        bus = {'ref': '248', 'from': t.get('from', ''), 'to': t.get('to', ''), 'lines': [flat(r) for r in lines], 'stops': names, 'exit': exit_pt}
print('schools', len(schools), 'pitches', len(pitches), 'playgrounds', len(playgrounds), 'waters', len(waters), 'jp2', len(jp2), 'bus stops', len(bus['stops']) if bus else 0)

out = {
    'zelkow': {'schools': schools, 'pitches': pitches, 'playgrounds': playgrounds, 'waters': waters, 'jp2': jp2, 'bus': bus},
    'meta': {'bounds': [S, W, N, E], 'unit': UNIT, 'vex': VEX, 'hx': r2(HX), 'hz': r2(HZ), 'emin': round(EMIN), 'emax': round(EMAX),
             'source': '© OpenStreetMap contributors (ODbL); elevation: Terrarium tiles, AWS Open Data (SRTM and others)'},
    'grid': {'nx': NX, 'nz': NZ, 'h': heights},
    'lc': {'w': LW, 'h': LH, 'res': LC_RES, 'd': landcover},
    'b': buildings, 'roads': roads, 'streams': streams, 'spires': spires,
    'trails': trails, 'pois': pois, 'places': places, 'rocks': rocks_named,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print(f'wrote {os.path.relpath(OUT)} ({os.path.getsize(OUT) / 1024:.0f} KB)')
