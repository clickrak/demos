#!/usr/bin/env bash
# Downloads the map data for the Zelków demo. Runs on GitHub Actions
# (.github/workflows/zelkow-data.yml); can also be run by hand from the repo root.
#   osm.json         buildings, roads, water, forests, rocks, caves, trails (OpenStreetMap via Overpass)
#   terrain/*.png    elevation tiles (Terrarium encoding, AWS open data), zoom 13
set -euo pipefail
cd "$(dirname "$0")"
UA="clickrak-demos-zelkow (github.com/clickrak/demos)"

ok=0
for url in https://overpass-api.de/api/interpreter https://overpass.kumi.systems/api/interpreter https://maps.mail.ru/osm/tools/overpass/api/interpreter; do
  echo "Overpass: $url"
  if curl -fsS -m 300 -A "$UA" --data-urlencode "data@query.overpassql" -o osm.tmp "$url" && python3 -c "import json;d=json.load(open('osm.tmp'));assert d['elements']"; then
    mv osm.tmp osm.json; ok=1; break
  fi
  sleep 10
done
[ "$ok" = 1 ] || { echo "All Overpass servers failed"; exit 1; }
python3 -c "import json;print(len(json.load(open('osm.json'))['elements']),'OSM elements')"

# elevation tiles covering the same box
mkdir -p terrain
python3 - <<'PY' > tiles.txt
import math
S,W,N,E = 50.100,19.730,50.215,19.840
z=13
def tile(lat,lon):
    n=2**z; x=int((lon+180)/360*n); r=math.radians(lat)
    y=int((1-math.asinh(math.tan(r))/math.pi)/2*n); return x,y
x0,y0=tile(N,W); x1,y1=tile(S,E)
for x in range(x0,x1+1):
    for y in range(y0,y1+1): print(z,x,y)
PY
while read z x y; do
  curl -fsS -m 60 -A "$UA" -o "terrain/${z}_${x}_${y}.png" "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png"
done < tiles.txt
rm tiles.txt
ls -l terrain
