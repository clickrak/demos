#!/usr/bin/env python3
"""Fill `geo` (lat, lon) for Kraków schools from OpenStreetMap Nominatim. Run from the repo root.
Only schools without `geo` are queried (about 1 request per second, as the usage policy asks).
Tries the street address first, then the school name. Results outside Kraków are ignored."""
import json, time, urllib.parse, urllib.request, sys
P = 'kompas/liceum/data/db/pl/krakow/schools.json'
BOX = (49.95, 50.14, 19.75, 20.15)  # lat min, lat max, lon min, lon max
UA = 'kompas-liceum-geocoder/1.0 (https://github.com/clickrak/demos)'

def ask(q):
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({'q': q, 'format': 'json', 'limit': 3, 'countrycodes': 'pl'})
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30) as r:
        res = json.load(r)
    time.sleep(1.2)
    for x in res:
        lat, lon = float(x['lat']), float(x['lon'])
        if BOX[0] <= lat <= BOX[1] and BOX[2] <= lon <= BOX[3]:
            return round(lat, 5), round(lon, 5)
    return None

schools = json.load(open(P))
changed = 0
for s in schools:
    if s.get('geo'): continue
    queries = ([s['address']] if s.get('address') else []) + [f"{s['name']}, Kraków"]
    for q in queries:
        try: hit = ask(q)
        except Exception as e: print('error', s['id'], e, file=sys.stderr); hit = None
        if hit:
            s['geo'] = {'lat': hit[0], 'lon': hit[1], 'q': q}; changed += 1; print('ok', s['id'], hit, q); break
    else:
        print('NOT FOUND', s['id'])
json.dump(schools, open(P, 'w'), ensure_ascii=False, indent=1)
print('geocoded', changed)
