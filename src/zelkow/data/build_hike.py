#!/usr/bin/env python3
"""Builds the flat hiking map: zelkow/hike.json + zelkow/hike-light.jpg + hike-dark.jpg
from osm.json and terrain/*.png (same downloads as build_map.py).

    python3 src/zelkow/data/build_hike.py        (from the repo root; needs Pillow, numpy, scipy, contourpy)

Coordinates in hike.json are metres: x = east, y = south, origin = centre of the box.
The five walks are defined at the bottom (WALKS); each is routed along real paths.
"""
import json, math, os, glob, heapq, re
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates, gaussian_filter
from scipy.spatial import cKDTree
import contourpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.join(HERE, '..', '..', '..', 'zelkow')

S, N, W, E = 50.100, 50.215, 19.730, 19.840          # same box as query.overpassql
LAT0, LON0 = (S + N) / 2, (W + E) / 2
MX = 111320 * math.cos(math.radians(LAT0))             # metres per degree of longitude
MZ = 110574                                            # metres per degree of latitude
HW, HH = (E - W) / 2 * MX, (N - S) / 2 * MZ
PX = 6.0                                               # metres per pixel in the base picture
STEP = 12.0                                            # metres per elevation cell


def xy(lat, lon):
    return ((lon - LON0) * MX, (LAT0 - lat) * MZ)


def inside(x, y, m=0.0):
    return -HW - m <= x <= HW + m and -HH - m <= y <= HH + m


def flat(pts, nd=0):
    out = []
    for p in pts:
        out += [round(p[0], nd) if nd else int(round(p[0])), round(p[1], nd) if nd else int(round(p[1]))]
    return out


# ------------------------------------------------------------------ elevation
Z = 13
tiles = {}
for p in glob.glob(os.path.join(HERE, 'terrain', '*.png')):
    z, tx, ty = map(int, os.path.basename(p)[:-4].split('_'))
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float64)
    tiles[(tx, ty)] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
tx0, tx1 = min(t[0] for t in tiles), max(t[0] for t in tiles)
ty0, ty1 = min(t[1] for t in tiles), max(t[1] for t in tiles)
mosaic = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256))
for (tx, ty), a in tiles.items():
    mosaic[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = a

NX, NY = int(2 * HW / STEP) + 1, int(2 * HH / STEP) + 1
gx = np.linspace(-HW, HW, NX)
gy = np.linspace(-HH, HH, NY)
GX, GY = np.meshgrid(gx, gy)
LON = LON0 + GX / MX
LAT = LAT0 - GY / MZ
n = 2 ** Z
fx = (LON + 180) / 360 * n
fy = (1 - np.arcsinh(np.tan(np.radians(LAT))) / np.pi) / 2 * n
elev = map_coordinates(mosaic, [fy * 256 - 0.5 - ty0 * 256, fx * 256 - 0.5 - tx0 * 256], order=1, mode='nearest')
elev_s = gaussian_filter(elev, 1.6)                     # smooth: the source data is coarse (~30 m)
EMIN, EMAX = float(elev_s.min()), float(elev_s.max())
print(f'elevation grid {NX}x{NY}, {EMIN:.0f}–{EMAX:.0f} m')


def height_at(x, y):
    i = (x + HW) / STEP; j = (y + HH) / STEP
    return float(map_coordinates(elev_s, [[j], [i]], order=1, mode='nearest')[0])


# ------------------------------------------------------------------ hillshade
ex = np.gradient(elev_s, STEP, axis=1)
ey = -np.gradient(elev_s, STEP, axis=0)                 # north is up
K = 2.0
nrm = np.sqrt((K * ex) ** 2 + (K * ey) ** 2 + 1)
alt, az = math.radians(42), math.radians(315)
L = (math.cos(alt) * math.sin(az), math.cos(alt) * math.cos(az), math.sin(alt))
shade = (-K * ex * L[0] - K * ey * L[1] + L[2]) / nrm
mult = np.clip(1 + 1.15 * (shade - math.sin(alt)), 0.52, 1.22)

# ------------------------------------------------------------------ OSM
osm = json.load(open(os.path.join(HERE, 'osm.json')))['elements']


def geom_xy(g):
    return [xy(p['lat'], p['lon']) for p in g if p]


def join_ways(ways):
    ways = [list(w) for w in ways if len(w) > 1]
    out = []
    key = lambda p: (round(p[0], 1), round(p[1], 1))
    while ways:
        cur = ways.pop(0)
        changed = True
        while changed:
            changed = False
            for k, w in enumerate(ways):
                if key(w[0]) == key(cur[-1]): cur += w[1:]
                elif key(w[-1]) == key(cur[-1]): cur += w[::-1][1:]
                elif key(w[-1]) == key(cur[0]): cur = w[:-1] + cur
                elif key(w[0]) == key(cur[0]): cur = w[::-1][:-1] + cur
                else: continue
                ways.pop(k); changed = True; break
        out.append(cur)
    return out


def rings(e):
    if e['type'] == 'way' and e.get('geometry'):
        return [geom_xy(e['geometry'])], []
    if e['type'] == 'relation':
        outer = [geom_xy(m['geometry']) for m in e.get('members', []) if m.get('geometry') and m.get('role') != 'inner']
        inner = [geom_xy(m['geometry']) for m in e.get('members', []) if m.get('geometry') and m.get('role') == 'inner']
        return join_ways(outer), join_ways(inner)
    return [], []


def rdp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]; bx, by = pts[b]; dx, dy = bx - ax, by - ay; Ln = math.hypot(dx, dy)
        dm, im = 0, -1
        for k in range(a + 1, b):
            d = abs((pts[k][0] - ax) * dy - (pts[k][1] - ay) * dx) / Ln if Ln > 1e-6 else math.hypot(pts[k][0] - ax, pts[k][1] - ay)
            if d > dm: dm, im = d, k
        if dm > tol and im > 0:
            keep[im] = True; stack += [(a, im), (im, b)]
    return [p for p, k in zip(pts, keep) if k]


def clip_line(pts, m=0.0):
    runs, cur = [], []
    for p in pts:
        if inside(p[0], p[1], m): cur.append(p)
        else:
            if len(cur) > 1: runs.append(cur)
            cur = []
    if len(cur) > 1: runs.append(cur)
    return runs


def length(pts):
    return sum(math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]) for k in range(len(pts) - 1))


# ---- land cover picture
CLASSES = [
    ('f', lambda t: t.get('landuse') == 'farmland'),
    ('m', lambda t: t.get('landuse') in ('meadow', 'grass', 'village_green', 'recreation_ground') or t.get('natural') == 'grassland'),
    ('o', lambda t: t.get('landuse') == 'orchard'),
    ('s', lambda t: t.get('natural') in ('scrub', 'heath')),
    ('w', lambda t: t.get('natural') == 'wood' or t.get('landuse') == 'forest'),
    ('r', lambda t: t.get('landuse') in ('residential', 'religious', 'cemetery', 'allotments')),
    ('y', lambda t: t.get('landuse') in ('farmyard', 'industrial', 'construction', 'quarry', 'commercial', 'retail')),
    ('a', lambda t: t.get('natural') == 'water' or t.get('landuse') in ('reservoir', 'basin') or t.get('waterway') == 'riverbank'),
    ('b', lambda t: t.get('natural') == 'bare_rock'),
]
PAL = {
    'light': {'.': '#f6f1df', 'f': '#f1ebc9', 'm': '#e1ecb9', 'o': '#dcebb0', 's': '#cadd9e', 'w': '#a6cf8a',
              'r': '#ecdcca', 'y': '#ddd6cb', 'a': '#8fd0f0', 'b': '#d3cdc2'},
    'dark': {'.': '#20271d', 'f': '#2a3120', 'm': '#2f3a24', 'o': '#33402a', 's': '#34462a', 'w': '#2b4a2b',
             'r': '#3b3229', 'y': '#35342f', 'a': '#1f4d6b', 'b': '#4b4a45'},
}
IW, IH = int(2 * HW / PX), int(2 * HH / PX)
idx = Image.new('L', (IW, IH), 0)
dr = ImageDraw.Draw(idx)
to_px = lambda p: ((p[0] + HW) / PX, (p[1] + HH) / PX)
for ci, (c, test) in enumerate(CLASSES, 1):
    for e in osm:
        t = e.get('tags', {})
        if not test(t) or e['type'] == 'node':
            continue
        outer, inner = rings(e)
        for r in outer:
            if len(r) > 2: dr.polygon([to_px(p) for p in r], fill=ci)
        for r in inner:
            if len(r) > 2: dr.polygon([to_px(p) for p in r], fill=0)
idx = np.asarray(idx)
LETTERS = '.' + ''.join(c for c, _ in CLASSES)
# hillshade multiplier at picture resolution
from scipy.ndimage import zoom
mm = zoom(mult, (IH / NY, IW / NX), order=1)[:IH, :IW]
if mm.shape != (IH, IW):
    mm = np.pad(mm, ((0, IH - mm.shape[0]), (0, IW - mm.shape[1])), mode='edge')
for theme, pal in PAL.items():
    lut = np.array([[int(pal[l][i:i + 2], 16) for i in (1, 3, 5)] for l in LETTERS], dtype=np.float64)
    rgb = lut[idx] * (mm[..., None] if theme == 'light' else (0.55 + 0.45 * mm[..., None]))
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(os.path.join(OUTDIR, f'hike-{theme}.jpg'), quality=80, optimize=True)
print('base pictures', IW, 'x', IH)

# ---- contours
cg = contourpy.contour_generator(gx, gy, elev_s)
minor, major = [], []
lv = int(math.ceil(EMIN / 10) * 10)
while lv < EMAX:
    for line in cg.lines(lv):
        pts = [(float(a), float(b)) for a, b in line]
        if len(pts) < 4 or length(pts) < 70:
            continue
        pts = rdp(pts, 2.5)
        if lv % 50 == 0:
            major.append([lv, flat(pts)])
        else:
            minor.append(flat(pts))
    lv += 10
print('contours', len(minor), 'minor', len(major), 'major')

# ---- roads, paths, streams, cliffs
roads = {'major': [], 'street': [], 'track': [], 'path': []}
labels = {}
streams, cliffs = [], []
HW_MAJOR = {'primary', 'secondary', 'tertiary', 'trunk', 'primary_link', 'secondary_link', 'tertiary_link', 'trunk_link'}
HW_STREET = {'residential', 'unclassified', 'living_street', 'service'}
HW_PATH = {'path', 'footway', 'bridleway', 'cycleway', 'steps', 'pedestrian'}
for e in osm:
    t = e.get('tags', {})
    if e['type'] != 'way' or not e.get('geometry'):
        continue
    pts = geom_xy(e['geometry'])
    hw = t.get('highway')
    if hw:
        if t.get('footway') in ('sidewalk', 'crossing') or t.get('service') in ('driveway', 'parking_aisle') or hw in ('construction', 'proposed', 'platform'):
            continue
        cls = 'major' if hw in HW_MAJOR else 'street' if hw in HW_STREET else 'track' if hw == 'track' else 'path' if hw in HW_PATH else None
        if not cls:
            continue
        if cls == 'street' and length(pts) < 45:
            continue
        for run in clip_line(rdp(pts, 2.0), 0):
            roads[cls].append(flat(run))
        nm = t.get('name')
        if nm and cls in ('major', 'street') and length(pts) > 160:
            mid = pts[len(pts) // 2]; a, b = pts[max(0, len(pts) // 2 - 1)], pts[min(len(pts) - 1, len(pts) // 2 + 1)]
            ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
            if ang > 90: ang -= 180
            if ang < -90: ang += 180
            labels.setdefault((nm, round(mid[0] / 500), round(mid[1] / 500)), [nm, int(mid[0]), int(mid[1]), round(ang), 1 if cls == 'major' else 0])
    elif t.get('waterway') in ('stream', 'river', 'ditch', 'canal'):
        for run in clip_line(rdp(pts, 2.0), 0):
            streams.append(flat(run))
    elif t.get('natural') == 'cliff':
        for run in clip_line(rdp(pts, 2.0), 0):
            cliffs.append(flat(run))
labels = list(labels.values())
print({k: len(v) for k, v in roads.items()}, len(streams), 'streams', len(cliffs), 'cliffs', len(labels), 'street labels')

# ---- hiking / cycling routes
COL = {'red': '#d2453a', 'blue': '#2f6fd6', 'yellow': '#e6b92e', 'green': '#3f9a4a', 'black': '#2b2b2b'}
trails = []
for e in osm:
    t = e.get('tags', {})
    if e['type'] != 'relation' or t.get('route') not in ('hiking', 'bicycle'):
        continue
    ways = [geom_xy(m['geometry']) for m in e.get('members', []) if m['type'] == 'way' and m.get('geometry')]
    lines = []
    for ch in join_ways(ways):
        for run in clip_line(rdp(ch, 2.0), 0):
            lines.append(flat(run))
    if lines:
        trails.append({'kind': t['route'], 'colour': COL.get(t.get('colour', ''), '#888888'), 'name': t.get('name', ''), 'lines': lines})
print(len(trails), 'trails')

# ---- points of interest
pois, places = [], []
sports, schools, playgrounds, waters, jp2 = [], [], [], [], []


def centre(e):
    if e['type'] == 'node':
        return xy(e['lat'], e['lon'])
    g = e.get('geometry') or []
    if g:
        return (sum(xy(p['lat'], p['lon'])[0] for p in g) / len(g), sum(xy(p['lat'], p['lon'])[1] for p in g) / len(g))
    if e.get('members'):
        pts = [q for m in e['members'] if m.get('geometry') for q in geom_xy(m['geometry'])]
        if pts:
            return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
    return None


for e in osm:
    t = e.get('tags', {})
    c = centre(e)
    if not c or not inside(*c, -50):
        continue
    nm = t.get('name', '')
    if t.get('place') in ('village', 'hamlet') and e['type'] == 'node' and nm:
        places.append([nm, 1 if t['place'] == 'village' else 0, int(c[0]), int(c[1])])
        continue
    am, le = t.get('amenity'), t.get('leisure')
    if am in ('school', 'kindergarten'):
        rs = [flat(r) for r in rings(e)[0] if len(r) > 2]
        schools.append({'name': nm, 'kind': am, 'x': int(c[0]), 'y': int(c[1]), 'rings': rs})
        continue
    if le in ('pitch', 'stadium'):
        rs = [flat(r) for r in rings(e)[0] if len(r) > 2]
        sports.append({'name': nm, 'sport': t.get('sport', ''), 'x': int(c[0]), 'y': int(c[1]), 'rings': rs})
        continue
    if le == 'playground':
        rs = [flat(r) for r in rings(e)[0] if len(r) > 2]
        playgrounds.append({'x': int(c[0]), 'y': int(c[1]), 'rings': rs})
        continue
    if t.get('natural') == 'water' and e['type'] == 'way':
        waters.append({'name': nm, 'x': int(c[0]), 'y': int(c[1])})
    kind = None
    if t.get('natural') == 'cave_entrance': kind = 'cave'
    elif t.get('tourism') == 'viewpoint': kind = 'view'
    elif t.get('natural') == 'peak': kind = 'peak'
    elif t.get('natural') == 'spring': kind = 'spring'
    elif t.get('tourism') == 'picnic_site': kind = 'picnic'
    elif t.get('historic') == 'castle': kind = 'castle'
    elif t.get('historic') in ('wayside_shrine', 'wayside_cross'): kind = 'shrine'
    elif am == 'place_of_worship' and e['type'] == 'way' and nm: kind = 'church'
    elif t.get('tourism') == 'attraction' and nm: kind = 'attraction'
    elif t.get('tourism') == 'camp_site': kind = 'camp'
    elif am in ('restaurant', 'cafe', 'pub', 'bar', 'fast_food', 'ice_cream'): kind = 'food'
    elif t.get('natural') in ('bare_rock', 'cliff') and nm: kind = 'rock'
    if kind:
        if t.get('ele'): nm = (nm + f' ({t["ele"]} m)').strip()
        pois.append([kind, nm, int(c[0]), int(c[1])])

# the pond and merged rock names: keep one entry per name
seen, pois2 = set(), []
for p in pois:
    if p[0] == 'rock':
        if (p[1]) in seen: continue
        seen.add(p[1])
    pois2.append(p)
pois = pois2

for e in osm:
    t = e.get('tags', {})
    if e['type'] == 'way' and t.get('highway') and 'Jana Pawła' in t.get('name', '') and e.get('geometry'):
        pts = geom_xy(e['geometry'])
        if pts[len(pts) // 2][0] > xy(50.15, 19.785)[0] - 0:
            jp2.append(flat(rdp(pts, 2.0)))

# pond (the lake near the school) as polygon ring, for a crisp edge
ponds = []
for e in osm:
    t = e.get('tags', {})
    if t.get('natural') == 'water' and e['type'] == 'way' and e.get('geometry'):
        c = centre(e)
        if c and inside(*c, -50) and math.hypot(c[0] - xy(50.15976, 19.79682)[0], c[1] - xy(50.15976, 19.79682)[1]) < 400:
            ponds.append(flat(geom_xy(e['geometry'])))

# bus 248
bus = None
for e in osm:
    t = e.get('tags', {})
    if t.get('route') == 'bus' and t.get('ref') == '248' and 'Zelków Pętla' in t.get('to', ''):
        ways = [geom_xy(m['geometry']) for m in e['members'] if m['type'] == 'way' and m.get('geometry')]
        lines = [flat(run) for ch in join_ways(ways) for run in clip_line(rdp(ch, 2.0), 0)]
        stops = []
        names = {}
        for q in osm:
            tq = q.get('tags', {})
            if q['type'] == 'node' and tq.get('name') and (tq.get('highway') == 'bus_stop' or tq.get('public_transport') == 'platform'):
                names[q['id']] = tq['name']
        for m in e['members']:
            if m['type'] == 'node' and m.get('role', '').startswith('platform') and 'lat' in m:
                p = xy(m['lat'], m['lon'])
                if inside(*p, -50):
                    stops.append([names.get(m['ref'], ''), int(p[0]), int(p[1])])
        bus = {'ref': '248', 'lines': lines, 'stops': stops}
print('bus stops', len(bus['stops']) if bus else 0)

# ------------------------------------------------------------------ routing
WALKABLE_EXCLUDE = {'motorway', 'motorway_link', 'trunk', 'trunk_link', 'construction', 'proposed', 'platform', 'raceway', 'corridor'}
node_xy, adj = {}, {}


def add_edge(a, b, w):
    adj.setdefault(a, []).append((b, w))
    adj.setdefault(b, []).append((a, w))


# cost multipliers: [walking, cycling]; None = not allowed
MULT = {'primary': (3.0, 2.0), 'secondary': (2.4, 1.6), 'tertiary': (1.6, 1.15), 'primary_link': (3, 2), 'secondary_link': (2.4, 1.6),
        'tertiary_link': (1.6, 1.15), 'unclassified': (1.0, 1.0), 'residential': (1.0, 1.0), 'living_street': (1.0, 1.0),
        'service': (1.05, 1.05), 'track': (0.9, 1.1), 'path': (0.85, 2.2), 'footway': (0.9, 2.5), 'bridleway': (0.9, 1.6),
        'cycleway': (1.0, 0.8), 'pedestrian': (1.0, 3.0), 'steps': (1.6, None)}
graph = {0: {}, 1: {}}
for e in osm:
    t = e.get('tags', {})
    hw = t.get('highway')
    if e['type'] != 'way' or not hw or hw in WALKABLE_EXCLUDE or not e.get('geometry') or hw not in MULT:
        continue
    if t.get('access') in ('private', 'no') and t.get('foot') not in ('yes', 'designated'):
        continue
    nodes, g = e['nodes'], e['geometry']
    for k in range(len(nodes) - 1):
        if not g[k] or not g[k + 1]:
            continue
        a, b = nodes[k], nodes[k + 1]
        pa, pb = xy(g[k]['lat'], g[k]['lon']), xy(g[k + 1]['lat'], g[k + 1]['lon'])
        node_xy[a], node_xy[b] = pa, pb
        d = math.hypot(pa[0] - pb[0], pa[1] - pb[1])
        for mode in (0, 1):
            m = MULT[hw][mode]
            if m is None or (mode == 1 and t.get('bicycle') == 'no'):
                continue
            graph[mode].setdefault(a, []).append((b, d * m, d))
            graph[mode].setdefault(b, []).append((a, d * m, d))
# keep only the biggest connected piece of each network, so a waypoint never snaps onto an isolated stub
for mode in (0, 1):
    G = graph[mode]; seen = {}; comps = []
    for s0 in G:
        if s0 in seen: continue
        comp = [s0]; seen[s0] = len(comps); st = [s0]
        while st:
            u = st.pop()
            for v, _, _ in G[u]:
                if v not in seen:
                    seen[v] = len(comps); comp.append(v); st.append(v)
        comps.append(comp)
    big = max(range(len(comps)), key=lambda i: len(comps[i]))
    graph[mode] = {u: l for u, l in G.items() if seen[u] == big}
    print('network', mode, len(comps), 'pieces, main has', len(comps[big]), 'nodes')
ids = list(node_xy)
tree = cKDTree(np.array([node_xy[i] for i in ids]))


def snap(p, mode):
    dists, js = tree.query(p, k=40)
    for dd, j in zip(dists, js):
        if ids[j] in graph[mode]:
            return ids[j], float(dd)
    raise RuntimeError('no node near %r' % (p,))


def route(a, b, mode):
    """Dijkstra; returns the list of node ids"""
    G = graph[mode]
    dist = {a: 0.0}; prev = {}
    pq = [(0.0, a)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == b:
            break
        if d > dist.get(u, 1e18):
            continue
        for v, w, _ in G.get(u, ()):
            nd = d + w
            if nd < dist.get(v, 1e18):
                dist[v] = nd; prev[v] = u
                heapq.heappush(pq, (nd, v))
    if b not in dist:
        return None
    out = [b]
    while out[-1] != a:
        out.append(prev[out[-1]])
    return out[::-1]


# ------------------------------------------------------------------ lookups for waypoints
byid = {(e['type'], e['id']): e for e in osm}


def WAY(i):
    e = byid[('way', i)]; g = e['geometry']; p = g[len(g) // 2]
    return p['lat'], p['lon']


def NODE(i):
    e = byid[('node', i)]
    return e['lat'], e['lon']


def CEN(kind, i):
    c = centre(byid[(kind, i)])
    return LAT0 - c[1] / MZ, LON0 + c[0] / MX


POND = (50.15976, 19.79682)
castle = CEN('way', 1419360855)
# Restauracja Kluczwodzie (Kluczwody 18, Wierzchowie): at the exit of the valley, by the car park on the road to Wierzchowie.
# Position from the owner's Google Maps plus code 5R88+3G (9F2X5R88+3G); OSM has no entry for it.
rest = (50.16519, 19.81631, 'Restauracja Kluczwodzie')
if not any(p[0] == 'food' and 'Kluczwodzie' in p[1] for p in pois):
    rx, ry = xy(rest[0], rest[1])
    pois.append(['food', rest[2], int(rx), int(ry)])
print('restaurant:', rest)

SCHOOL = CEN('way', 322200496)
JKS = CEN('way', 198090786)
BOL_BUS = NODE(1357828900)                 # Bolechowice Centrum (bus 248)
BOL_CHURCH = CEN('way', 204305962)
SPRING = NODE(2147475354)                  # Źródło Będkówki
BRAMA_B = (50.1745, 19.7536)               # Brama Będkowska – approximate, to be confirmed
BEDKOWICE = NODE(2269867224)               # Będkowice Rynek
KOBYL = NODE(4540375448)                   # Dolina Kobylańska
BRAMA_BOL = (50.1495, 19.7890)             # Brama Bolechowicka (dolina Bolechowicka)
BEBLO = NODE(879155320)                    # Bębło Łabajowa
WIERZ = NODE(1357805915)                   # Jaskinia Wierzchowska Górna
BRZEZ = NODE(31902659)                     # Brzezinka
ZABIE = NODE(1710473689)                   # Zabierzów Rynek (bus 248 back to Zelków)
TERM = NODE(4998127823)                    # Zelków Pętla (bus 248 terminus)
STAW_BUS = NODE(3289610677)                # przystanek Zelków Staw (248 towards Kraków)

WALKS = [
    {'id': 'w1', 'mode': 0, 'level': 1, 'icon': '🧒',
     'title': 'Szkoła – staw', 'sub': 'Dla najmłodszych: krótki spacer do stawu i z powrotem',
     'points': [('Szkoła i przedszkole', SCHOOL, 'school'), ('Staw', POND, 'pond')],
     'back': 'Wracasz tą samą drogą.'},
    {'id': 'wbus', 'mode': 0, 'level': 1, 'icon': '🚌',
     'title': 'Lekcja autobusu', 'sub': 'Dla maluchów: szkoła, Sadowa, Widokowa, pętla, a stamtąd autobusem 248 z powrotem do stawu i szkoły.',
     'points': [('Szkoła i przedszkole', SCHOOL, 'school'), ('ul. Sadowa', WAY(42813167), 'street'), ('ul. Widokowa', WAY(174316050), 'street'),
                ('Pętla autobusu 248', TERM, 'bus'), ('Przystanek Zelków Staw', STAW_BUS, 'bus', 'bus'), ('Staw', POND, 'pond'), ('Szkoła i przedszkole', SCHOOL, 'school')],
     'bus': 'Z pętli jedziesz autobusem 248 do przystanku Zelków Staw (niebieska przerywana linia). Sprawdź rozkład!'},
    {'id': 'w2', 'mode': 0, 'level': 2, 'icon': '🌳',
     'title': 'Uliczki Zelkowa i zamek', 'sub': 'Staw, szkoła, Sadowa, Widokowa, Modrzewiowa i zamek w Białym Kościele',
     'points': [('Staw', POND, 'pond'), ('Szkoła', SCHOOL, 'school'), ('ul. Sadowa', WAY(42813167), 'street'),
                ('ul. Widokowa', WAY(174316050), 'street'), ('ul. Modrzewiowa', WAY(174322297), 'street'),
                ('Zamek w Białym Kościele', castle, 'castle')] + ([(rest[2], rest[:2], 'food')] if rest else []),
     'back': 'Do domu autobusem lub tą samą drogą.'},
    {'id': 'w3', 'mode': 0, 'level': 2, 'icon': '🚌',
     'title': 'Bębło, JKS i Bolechowice', 'sub': 'Graniczna do Bębła, potem w lewo do JKS i w dół do Bolechowic. Wracasz autobusem 248.',
     'points': [('Staw', POND, 'pond'), ('ul. Graniczna', WAY(198090760), 'street'), ('Bębło', BEBLO, 'village'),
                ('JKS Zelków', JKS, 'sport'), ('Kościół w Bolechowicach', BOL_CHURCH, 'church'), ('Przystanek Bolechowice Centrum', BOL_BUS, 'bus')],
     'bus': 'Z Bolechowic wracasz autobusem 248 (pod górę!).'},
    {'id': 'w4', 'mode': 0, 'level': 3, 'icon': '⛰️',
     'title': 'Duża pętla: doliny i źródło Będkówki', 'sub': 'Staw, Bębło, źródło Będkówki, Brama Będkowska, Będkowice, dolina Kobylańska, dolina Bolechowicka, JKS, staw',
     'points': [('Staw', POND, 'pond'), ('Bębło', BEBLO, 'village'), ('Źródło Będkówki', SPRING, 'spring'),
                ('Brama Będkowska', BRAMA_B, 'rock'), ('Będkowice', BEDKOWICE, 'village'), ('Dolina Kobylańska', KOBYL, 'valley'),
                ('Brama Bolechowicka', BRAMA_BOL, 'rock'), ('JKS Zelków', JKS, 'sport'), ('Staw', POND, 'pond')]},
    {'id': 'w5', 'mode': 1, 'level': 3, 'icon': '🚲',
     'title': 'Rowerem: Wierzchowie – Zabierzów', 'sub': 'Jaskinia Wierzchowska, Turystyczna do Bębła, Sportowa, źródło Będkówki, Brzezinka, Zabierzów. Wracasz autobusem.',
     'points': [('Jaskinia Wierzchowska Górna', WIERZ, 'cave'), ('ul. Turystyczna', WAY(1549877653), 'street'), ('ul. Sportowa (Bębło)', WAY(174322306), 'street'),
                ('Źródło Będkówki', SPRING, 'spring'), ('Będkowice', BEDKOWICE, 'village'), ('Brzezinka', BRZEZ, 'village'), ('Zabierzów Rynek', ZABIE, 'bus')],
     'bus': 'Z Zabierzowa wracasz autobusem 248 (przystanek Zabierzów Rynek).'},
]

walks_out = []
for w in WALKS:
    mode = w['mode']
    wp = [(pt[0], xy(*pt[1]), pt[2], pt[3] if len(pt) > 3 else 'walk') for pt in w['points']]
    legs = []                                   # (kind, [node ids])
    for k in range(len(wp) - 1):
        a, da = snap(wp[k][1], mode); b, db = snap(wp[k + 1][1], mode)
        path = route(a, b, mode)
        if not path:
            raise SystemExit(f"{w['id']}: no route {wp[k][0]} -> {wp[k + 1][0]}")
        legs.append((wp[k + 1][3], path))

    def sample(pts):
        out, acc, nxt = [], 0.0, 0.0
        for k in range(len(pts) - 1):
            seg = math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1])
            while nxt <= acc + seg:
                f = (nxt - acc) / (seg or 1)
                out.append(height_at(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f))
                nxt += 25
            acc += seg
        return out

    dist = 0.0; asc = 0.0; samples = []; bus_leg = False; full = []; legs_out = []
    for kind, nodes in legs:
        pts = [node_xy[i] for i in nodes]
        full += pts if not full else pts[1:]
        legs_out.append([kind, flat(rdp(pts, 1.5))])
        sm = sample(pts); samples += sm
        if kind == 'bus':
            bus_leg = True; continue
        dist += length(pts)
        ref = sm[0] if sm else 0
        for h in sm:
            if h - ref > 3: asc += h - ref; ref = h
            elif ref - h > 3: ref = h
    minutes = dist / 1000 / (4.2 if mode == 0 else 13) * 60 + asc / (10 if mode == 0 else 7)
    if bus_leg:
        minutes += 15                           # waiting + the ride
    if w['level'] == 1:
        minutes *= 1.5
    out_pts = rdp(full, 1.5)
    print(f"{w['id']}: {dist / 1000:.1f} km walking, +{asc:.0f} m, {minutes:.0f} min, {len(out_pts)} pts")
    step = max(1, len(samples) // 70)
    walks_out.append({
        'id': w['id'], 'mode': 'bike' if mode else 'walk', 'level': w['level'], 'icon': w['icon'], 'title': w['title'], 'sub': w['sub'],
        'km': round(dist / 1000, 1), 'up': int(round(asc, -1)), 'min': int(round(minutes / 5) * 5),
        'line': flat(out_pts), 'legs': legs_out, 'profile': [int(round(h)) for h in samples[::step]],
        'points': [[nm, int(p[0]), int(p[1]), kind] for nm, p, kind, _ in wp],
        'bus': w.get('bus', ''), 'back': w.get('back', ''),
    })

out = {
    'meta': {'bounds': [S, W, N, E], 'w': int(2 * HW), 'h': int(2 * HH), 'px': PX, 'emin': round(EMIN), 'emax': round(EMAX),
             'source': '© OpenStreetMap contributors (ODbL); elevation: Terrarium tiles, AWS Open Data'},
    'minor': minor, 'major': major, 'roads': roads, 'labels': labels, 'streams': streams, 'cliffs': cliffs, 'trails': trails,
    'pois': pois, 'places': places, 'schools': schools, 'sports': sports, 'playgrounds': playgrounds, 'ponds': ponds, 'jp2': jp2, 'bus': bus,
    'pond': [int(v) for v in xy(*POND)], 'walks': walks_out, 'restaurant': bool(rest),
}
with open(os.path.join(OUTDIR, 'hike.json'), 'w') as f:
    json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
print('hike.json', os.path.getsize(os.path.join(OUTDIR, 'hike.json')) // 1024, 'KB')
