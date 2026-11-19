#!/usr/bin/env python3
"""Fill `geo` (lat, lon) for Kompas Liceum schools from OpenStreetMap Nominatim. Run from the repo root.
Works for every town folder in kompas/liceum/data/db/pl/<town>/schools.json that has a box below.
Only schools without `geo` are queried (about 1 request per second, as the usage policy asks).
Tries the street address first, then the school name. Results outside the town box are ignored.
Usage: geocode_schools.py [town ...] [--redo]   (no town = all towns)"""
import json, re, time, urllib.parse, urllib.request, sys, os
ROOT = 'kompas/liceum/data/db/pl'
TOWNS = {  # name used in queries, box: lat min, lat max, lon min, lon max
    'krakow': ('Kraków', (49.95, 50.14, 19.75, 20.15)),
    'tychy': ('Tychy', (50.05, 50.17, 18.90, 19.07)),
}
UA = 'kompas-liceum-geocoder/1.1 (https://github.com/clickrak/demos)'

def ask(q, box):
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({'q': q, 'format': 'json', 'limit': 3, 'countrycodes': 'pl'})
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30) as r:
        res = json.load(r)
    time.sleep(1.2)
    for x in res:
        lat, lon = float(x['lat']), float(x['lon'])
        if box[0] <= lat <= box[1] and box[2] <= lon <= box[3]:
            return round(lat, 5), round(lon, 5)
    return None

REDO = '--redo' in sys.argv
wanted = [a for a in sys.argv[1:] if not a.startswith('--')] or sorted(TOWNS)
total = 0
for town in wanted:
    P = f'{ROOT}/{town}/schools.json'
    if not os.path.exists(P): continue
    name, box = TOWNS[town]
    schools = json.load(open(P, encoding='utf8'))
    changed = 0
    for s in schools:
        if s.get('geo') and not (REDO or s['geo'].get('q', '') == f"{s['name']}, {name}" and s.get('address')): continue
        street = re.sub(r',?\s*\d\d-\d{3}\s*' + re.escape(name), '', s.get('address') or '').strip(', ')
        plain = re.sub(r'^(ul\.|al\.|os\.|pl\.)\s*', '', street)
        bare = re.sub(r'\s+\d+\w*$', '', plain)   # street without the house number (street centre, less exact)
        queries = ([f'{street}, {name}', f'{plain}, {name}', f'{bare}, {name}'] if street else []) + [f"{s['short']}, {name}", f"{s['name']}, {name}"]
        for q in queries:
            try: hit = ask(q, box)
            except Exception as e: print('error', s['id'], e, file=sys.stderr); hit = None
            if hit:
                s['geo'] = {'lat': hit[0], 'lon': hit[1], 'q': q}; changed += 1; print('ok', s['id'], hit, q); break
        else:
            print('NOT FOUND', s['id'])
    if changed:
        open(P, 'w', encoding='utf8').write(json.dumps(schools, ensure_ascii=False, indent=1))
    total += changed
print('geocoded', total)
