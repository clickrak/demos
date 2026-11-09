"""Computes how to reach each Kompas campus by public transport in Kraków.

Runs in GitHub Actions (the app itself never calls anything outside):
  1. geocodes each campus address with OpenStreetMap Nominatim (once per address),
  2. downloads the official Kraków GTFS timetables (gtfs.ztp.krakow.pl),
  3. finds the nearest stops and their lines, and the travel time from
     Kraków Główny (stops named "Dworzec Główny…") on a weekday morning,
     with at most one change.
Writes kompas/studia/data/db/pl/krakow/transport.json.

Usage: python3 kompas/tools/transport.py
"""
import csv, io, json, math, re, statistics, sys, time, urllib.parse, urllib.request, zipfile
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'studia/data/db/pl/krakow'
OUT = DB / 'transport.json'
UA = {'User-Agent': 'kompas-demo/0.2 (+https://github.com/clickrak/demos)'}
GTFS_BASE = 'https://gtfs.ztp.krakow.pl/'
FEEDS = ['GTFS_KRK_T.zip', 'GTFS_KRK_A.zip']
DEPARTURES = [7 * 3600 + 30 * 60 + i * 600 for i in range(7)]  # 7:30 … 8:30
WALK = 1.2 / 1.25          # m/s, with a detour factor
TRANSFER_M, DEST_M, NEAR_M = 250, 700, 500


def get(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            print('retry', url, e, file=sys.stderr); time.sleep(3 * (i + 1))
    raise SystemExit(f'cannot fetch {url}')


def dist(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371000 * 2 * math.asin(math.sqrt(h))


KRK = (49.96, 50.13, 19.79, 20.22)  # lat min/max, lon min/max
GEO_VERSION = 2
EXPAND = [(r'^al\. Mickiewicza', 'aleja Adama Mickiewicza'), (r'^al\. Jana Pawła II', 'aleja Jana Pawła II'),
          (r'^al\.\s*', 'aleja '), (r'^ul\.\s*', ''), (r'^os\.\s*', 'osiedle '), (r'^pl\.\s*', 'plac ')]


def geocode(addr):
    street = addr
    for pat, rep in EXPAND:
        street, n = re.subn(pat, rep, street)
        if n: break
    q = urllib.parse.urlencode({'street': street, 'city': 'Kraków', 'country': 'Polska', 'format': 'json', 'limit': 1,
                                'viewbox': f'{KRK[2]},{KRK[1]},{KRK[3]},{KRK[0]}', 'bounded': 1})
    time.sleep(1.1)  # Nominatim usage policy: at most one request per second
    res = json.loads(get('https://nominatim.openstreetmap.org/search?' + q))
    if res:
        la, lo = float(res[0]['lat']), float(res[0]['lon'])
        if KRK[0] <= la <= KRK[1] and KRK[2] <= lo <= KRK[3]: return la, lo
    return None


def locate(c):
    """Geocoded position, checked against a hand-set one (c['geo']) when the record has it."""
    g = geocode(c['address'])
    hand = (c['geo']['lat'], c['geo']['lon']) if c.get('geo') else None
    if g and hand and dist(g, hand) > 300:
        print('  geocode differs from hand-set position by', round(dist(g, hand)), 'm; using hand-set', c['id'])
        return hand[0], hand[1], 'hand'
    if g: return g[0], g[1], 'osm'
    if hand: return hand[0], hand[1], 'hand'
    return None, None, None


def secs(t):
    h, m, s = t.split(':'); return int(h) * 3600 + int(m) * 60 + int(s)


def load_feed(name, prefix, mode):
    z = zipfile.ZipFile(io.BytesIO(get(GTFS_BASE + name)))
    rd = lambda f: csv.DictReader(io.TextIOWrapper(z.open(f), encoding='utf-8-sig'))
    files = set(z.namelist())
    # Service day: the next Tuesday the feed covers.
    cal = list(rd('calendar.txt')) if 'calendar.txt' in files else []
    exc = list(rd('calendar_dates.txt')) if 'calendar_dates.txt' in files else []
    d = date.today()
    while d.weekday() != 1: d += timedelta(days=1)
    ds = d.strftime('%Y%m%d')
    active = {c['service_id'] for c in cal if c['tuesday'] == '1' and c['start_date'] <= ds <= c['end_date']}
    for e in exc:
        if e['date'] == ds: (active.add if e['exception_type'] == '1' else active.discard)(e['service_id'])
    routes = {r['route_id']: (r.get('route_short_name') or r['route_id'], mode) for r in rd('routes.txt')}
    trips = {t['trip_id']: routes[t['route_id']] for t in rd('trips.txt') if t['service_id'] in active}
    stops = {prefix + s['stop_id']: (s['stop_name'], float(s['stop_lat']), float(s['stop_lon'])) for s in rd('stops.txt')}
    seq = defaultdict(list)
    for st in rd('stop_times.txt'):
        if st['trip_id'] in trips:
            seq[prefix + st['trip_id']].append((int(st['stop_sequence']), prefix + st['stop_id'], secs(st['arrival_time']), secs(st['departure_time'])))
    tr = {}
    for tid, rows in seq.items():
        rows.sort()
        tr[tid] = (trips[tid[len(prefix):]], [(s, a, dp) for _, s, a, dp in rows])
    info = {'serviceDay': d.isoformat(), 'feed': name}
    return stops, tr, info


def main():
    campuses = json.loads((DB / 'campuses.json').read_text())
    prev = json.loads(OUT.read_text()) if OUT.exists() else {'campuses': {}}

    # 1. Coordinates: reuse earlier geocoding while the address and method are unchanged.
    for c in campuses:
        p = prev['campuses'].get(c['id'], {})
        if p.get('address') == c['address'] and p.get('geoVersion') == GEO_VERSION and p.get('geo') and p.get('handGeo') == c.get('geo'):
            c['lat'], c['lon'], c['how'] = p['lat'], p['lon'], p['geo']
        else:
            c['lat'], c['lon'], c['how'] = locate(c)
        print('geo', c['id'], c['lat'], c['lon'], c['how'])

    # 2. Timetables.
    stops, trips, infos = {}, {}, []
    for i, f in enumerate(FEEDS):
        s, t, info = load_feed(f, f'{i}:', 'tram' if f.endswith('_T.zip') else 'bus')
        stops.update(s); trips.update(t); infos.append(info)
    print(len(stops), 'stops', len(trips), 'trips')

    lines_at = defaultdict(set)
    for (rname, rtype), rows in trips.values():
        for s, _, _ in rows: lines_at[s].add((rtype, rname))

    # Footpaths between nearby stops (grid of ~250 m cells).
    grid = defaultdict(list)
    key = lambda la, lo: (int(la / 0.00225), int(lo / 0.0035))
    for sid, (_, la, lo) in stops.items(): grid[key(la, lo)].append(sid)
    def near(la, lo, r):
        k = key(la, lo); out = []
        for dx in (-3, -2, -1, 0, 1, 2, 3):
            for dy in (-3, -2, -1, 0, 1, 2, 3):
                for sid in grid.get((k[0] + dx, k[1] + dy), []):
                    d = dist((la, lo), stops[sid][1:])
                    if d <= r: out.append((d, sid))
        return sorted(out)
    foot = {sid: [(o, d) for d, o in near(la, lo, TRANSFER_M) if o != sid] for sid, (_, la, lo) in stops.items()}

    hub = [sid for sid, (n, _, _) in stops.items() if n.startswith('Dworzec Główny')]
    print('hub stops', len(hub))
    tripl = list(trips.values())

    def walk_from(best):
        out = dict(best)
        for s, (arr, via) in best.items():
            for o, d in foot[s]:
                a = arr + d / WALK
                if a < out.get(o, (1e18,))[0]: out[o] = (a, via)
        return out

    def run(t0):
        best = walk_from({s: (t0, ()) for s in hub})
        result = dict(best)
        for rnd in (1, 2):
            new = {}
            buf = 0 if rnd == 1 else 60
            for (rname, rtype), rows in tripl:
                board = None
                for s, a, dp in rows:
                    if board is not None:
                        cand = (a, board + ((rtype, rname),))
                        if a < result.get(s, (1e18,))[0] and a < new.get(s, (1e18,))[0]: new[s] = cand
                    if board is None and s in best and best[s][0] + buf <= dp:
                        board = best[s][1]
            new = walk_from(new)
            for s, v in new.items():
                if v[0] < result.get(s, (1e18,))[0]: result[s] = v
            best = new
        return result

    runs = [(t0, run(t0)) for t0 in DEPARTURES]

    out = {'asOf': infos[0]['serviceDay'], 'source': GTFS_BASE, 'feeds': [i['feed'] for i in infos],
           'method': 'z przystanków Dworzec Główny, wtorek rano 7:30–8:30, najwyżej jedna przesiadka', 'campuses': {}}
    for c in campuses:
        if c['lat'] is None: continue
        pos = (c['lat'], c['lon'])
        dest = near(*pos, DEST_M)
        times, vias = [], defaultdict(int)
        for t0, res in runs:
            opts = [(res[s][0] + d / WALK - t0, res[s][1]) for d, s in dest if s in res]
            if opts:
                m, via = min(opts); times.append(m / 60); vias[via] += 1
        # Nearest stops, one entry per stop name (tram and bus platforms often share a name).
        byname = {}
        for d, s in near(*pos, NEAR_M):
            e = byname.setdefault(stops[s][0], {'m': d, 'lines': set()})
            e['lines'] |= lines_at[s]
        # Day lines only: trams 1–59 and buses 100–599 (higher numbers are night, replacement or special lines).
        def day(l, mode):
            if not l.isdigit(): return True
            n = int(l); return n < 60 if mode == 'tram' else 100 <= n < 600
        ns = []
        for n, e in sorted(byname.items(), key=lambda x: x[1]['m'])[:3]:
            ls = sorted(e['lines'], key=lambda x: (len(x[1]), x[1]))
            ns.append({'name': n, 'm': round(e['m'] / 10) * 10, 'tram': [l for t, l in ls if t == 'tram' and day(l, t)],
                       'bus': [l for t, l in ls if t == 'bus' and day(l, t)][:6]})
        via = max(vias, key=vias.get) if vias else ()
        out['campuses'][c['id']] = {
            'address': c['address'], 'lat': round(c['lat'], 5), 'lon': round(c['lon'], 5), 'geo': c['how'], 'geoVersion': GEO_VERSION, 'handGeo': c.get('geo'),
            'stops': ns,
            'fromHub': {'min': round(min(times)), 'median': round(statistics.median(times)), 'via': [list(v) for v in via]} if times else None
        }
        print(c['id'], out['campuses'][c['id']]['fromHub'], ns[:1])
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    import urllib.parse  # noqa: E402
    main()
