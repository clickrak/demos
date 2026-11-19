"""Backlog D2: list Kompas sources whose `asOf` (YYYY-MM) is more than 12 months old.

Run by .github/workflows/kompas-old-sources.yml once a year (and by hand). It prints the old sources per app and
exits with 1 when there are any, so the workflow fails and GitHub notifies the repo owner.
Usage: python3 kompas/tools/old_sources.py [--months 12]
"""
import json, sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
months = int(sys.argv[sys.argv.index('--months') + 1]) if '--months' in sys.argv else 12
t = date.today(); now = t.year * 12 + t.month - 1
old = []
for app in ('liceum', 'studia'):
    for s in json.loads((ROOT / app / 'data/sources.json').read_text(encoding='utf8')):
        try: y, m = map(int, s['asOf'].split('-')[:2])
        except Exception: old.append((app, s['id'], s.get('asOf'), s['url'], 'asOf not YYYY-MM')); continue
        age = now - (y * 12 + m - 1)
        if age > months: old.append((app, s['id'], s['asOf'], s['url'], f'{age} months'))
for app, sid, asof, url, why in old: print(f'OLD {app:7} {sid:28} asOf {asof}  ({why})  {url}')
print(f'{len(old)} source(s) older than {months} months' if old else f'All sources are newer than {months} months.')
sys.exit(1 if old else 0)
