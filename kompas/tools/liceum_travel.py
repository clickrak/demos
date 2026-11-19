"""Travel time by public transport from each Kraków district to each Kompas Liceum school.

Runs in GitHub Actions (the app itself never calls anything outside):
  1. finds a point for each of the 18 Kraków districts with OpenStreetMap Nominatim (once, cached in the output),
  2. downloads the official Kraków GTFS timetables (same feeds and method as tools/transport.py for Studia),
  3. for departures on a school-day morning (Tuesday 7:00-7:40) computes the fastest trip from the stops near
     the district point to the stops near each school, walking included, with at most one change.
Writes kompas/liceum/data/db/pl/krakow/travel.json: per school and district the median minutes.

Usage: python3 kompas/tools/liceum_travel.py
"""
import json, statistics, sys, time, urllib.parse
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from transport import get, dist, load_feed, GTFS_BASE, FEEDS  # noqa: E402  (shared with Studia)

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'liceum/data/db/pl/krakow'
OUT = DB / 'travel.json'
# The 18 districts of Kraków (Rada Miasta Krakowa, uchwała XXI/143/91; list on bip.krakow.pl).
DISTRICTS = [('I', 'Stare Miasto'), ('II', 'Grzegórzki'), ('III', 'Prądnik Czerwony'), ('IV', 'Prądnik Biały'),
             ('V', 'Krowodrza'), ('VI', 'Bronowice'), ('VII', 'Zwierzyniec'), ('VIII', 'Dębniki'),
             ('IX', 'Łagiewniki-Borek Fałęcki'), ('X', 'Swoszowice'), ('XI', 'Podgórze Duchackie'),
             ('XII', 'Bieżanów-Prokocim'), ('XIII', 'Podgórze'), ('XIV', 'Czyżyny'), ('XV', 'Mistrzejowice'),
             ('XVI', 'Bieńczyce'), ('XVII', 'Wzgórza Krzesławickie'), ('XVIII', 'Nowa Huta')]
KRK = (49.96, 50.13, 19.79, 20.22)
DEPARTURES = [7 * 3600 + i * 600 for i in range(5)]    # 7:00 ... 7:40, school starts around 8:00
WINDOW = (6 * 3600 + 45 * 60, 9 * 3600 + 30 * 60)       # only trips running then matter
WALK = 1.2 / 1.25                                        # m/s, with a detour factor
TRANSFER_M, ORIGIN_M, DEST_M = 250, 800, 700


def district_point(no, name):
    """Point of the district: the centre Nominatim gives for the district boundary."""
    for q in (f'Dzielnica {no} {name}, Kraków', f'{name}, Kraków'):
        time.sleep(1.1)
        res = json.loads(get('https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
            {'q': q, 'format': 'json', 'limit': 3, 'countrycodes': 'pl'})))
        for r in res:
            la, lo = float(r['lat']), float(r['lon'])
            if KRK[0] <= la <= KRK[1] and KRK[2] <= lo <= KRK[3]:
                return round(la, 5), round(lo, 5), q
    return None


def main():
    schools = [s for s in json.loads((DB / 'schools.json').read_text()) if s.get('geo')]
    prev = json.loads(OUT.read_text()) if OUT.exists() else {}
    known = {o['id']: o for o in prev.get('origins', [])}

    origins = []
    for i, (no, name) in enumerate(DISTRICTS, 1):
        oid = f'd{i:02d}'
        if oid in known and known[oid]['name'] == name:
            origins.append(known[oid]); continue
        p = district_point(no, name)
        if not p: print('NO POINT', no, name); continue
        origins.append({'id': oid, 'no': no, 'name': name, 'lat': p[0], 'lon': p[1], 'q': p[2]})
        print('district', no, name, p)

    stops, trips, infos = {}, {}, []
    for k, f in enumerate(FEEDS):
        s, t, info = load_feed(f, f'{k}:', 'tram' if f.endswith('_T.zip') else 'bus')
        stops.update(s); trips.update(t); infos.append(info)
    tripl = [rows for _, rows in trips.values() if rows and rows[0][2] <= WINDOW[1] and rows[-1][1] >= WINDOW[0]]
    print(len(stops), 'stops', len(tripl), 'morning trips')

    grid = defaultdict(list)
    key = lambda la, lo: (int(la / 0.00225), int(lo / 0.0035))
    for sid, (_, la, lo) in stops.items(): grid[key(la, lo)].append(sid)

    def near(la, lo, r):
        k, out, n = key(la, lo), [], int(r / 250) + 1
        for dx in range(-n, n + 1):
            for dy in range(-n, n + 1):
                for sid in grid.get((k[0] + dx, k[1] + dy), []):
                    d = dist((la, lo), stops[sid][1:])
                    if d <= r: out.append((d, sid))
        return sorted(out)

    foot = {sid: [(o, d) for d, o in near(la, lo, TRANSFER_M) if o != sid] for sid, (_, la, lo) in stops.items()}

    def walk_from(best):
        out = dict(best)
        for s, arr in best.items():
            for o, d in foot[s]:
                a = arr + d / WALK
                if a < out.get(o, 1e18): out[o] = a
        return out

    def run(start):  # start: {stop: time}; two rounds = at most one change
        best = walk_from(start); result = dict(best)
        for rnd in (1, 2):
            new, buf = {}, (0 if rnd == 1 else 60)
            for rows in tripl:
                on = False
                for s, a, dp in rows:
                    if on and a < result.get(s, 1e18) and a < new.get(s, 1e18): new[s] = a
                    if not on and s in best and best[s] + buf <= dp: on = True
            new = walk_from(new)
            for s, v in new.items():
                if v < result.get(s, 1e18): result[s] = v
            best = new
        return result

    dests = {s['id']: near(s['geo']['lat'], s['geo']['lon'], DEST_M) for s in schools}
    table = defaultdict(dict)
    for o in origins:
        src = near(o['lat'], o['lon'], ORIGIN_M) or near(o['lat'], o['lon'], 2000)[:3]
        per = defaultdict(list)
        for t0 in DEPARTURES:
            res = run({sid: t0 + d / WALK for d, sid in src})
            for s in schools:
                direct = dist((o['lat'], o['lon']), (s['geo']['lat'], s['geo']['lon'])) / WALK + t0
                opts = [res[x] + d / WALK for d, x in dests[s['id']] if x in res] + [direct]
                per[s['id']].append((min(opts) - t0) / 60)
        for sid, mins in per.items():
            table[sid][o['id']] = round(statistics.median(mins))
        print('origin', o['name'], 'done')

    out = {'asOf': infos[0]['serviceDay'], 'source': GTFS_BASE, 'feeds': [i['feed'] for i in infos],
           'method': 'z przystanków blisko środka dzielnicy, wtorek 7:00–7:40, komunikacja miejska z dojściem pieszo, najwyżej jedna przesiadka; mediana',
           'origins': origins, 'schools': table}
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print('schools', len(table))


if __name__ == '__main__':
    main()
