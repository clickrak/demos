#!/usr/bin/env python3
"""Writes kompas/studia/i18n/review-ua.md: a Polish | Ukrainian table for a native reader (UK-E).
Usage: python3 kompas/tools/i18n_review.py   (rerun after any change to ua.json)
The reader writes corrections in the last column; REVIEWED.md lists what has been read and by whom."""
import json, re
from pathlib import Path
R = Path(__file__).resolve().parent.parent
def load(p):
    f = R / p
    return json.loads(f.read_text()) if f.exists() else {}
pl = {**load('core/i18n/pl.json'), **load('studia/i18n/pl.json')}
ua = {**load('core/i18n/ua.json'), **load('studia/i18n/ua.json')}
cell = lambda s: re.sub(r'\s+', ' ', s).replace('|', '\\|')
rows = [f'| `{k}` | {cell(pl[k])} | {cell(ua.get(k, "(missing)"))} |  |' for k in pl]
# Data texts (overlays): questions, strengths, dimensions, scenarios. Walk the Ukrainian overlay and print the Polish original next to it.
def walk(path, base, ov, out):
    if isinstance(ov, dict):
        for k, v in ov.items():
            walk(f'{path}.{k}', (base or {}).get(k) if isinstance(base, dict) else None, v, out)
    elif isinstance(ov, list):
        byid = {x.get('id'): x for x in base} if isinstance(base, list) and base and isinstance(base[0], dict) else {}
        for i, v in enumerate(ov):
            if isinstance(v, dict) and 'id' in v: walk(f'{path}[{v["id"]}]', byid.get(v['id']), {k: x for k, x in v.items() if k != 'id'}, out)
            else: out.append((f'{path}[{i}]', base[i] if isinstance(base, list) and i < len(base) else '', v))
    elif isinstance(ov, str):
        out.append((path, base if isinstance(base, str) else (f'(Polish name: {path.rsplit(".", 1)[-1]})' if base is None else ''), ov))
data_rows = []
for name, src in (('questions', 'studia/data/questions.json'), ('strengths', 'core/strengths.json'), ('dimensions', 'core/dimensions.json'), ('scenarios', 'studia/data/scenarios.json')):
    walk(name, load(src), load(f'studia/i18n/ua/{name}.json'), data_rows)
rows += [f'| `{k}` | {cell(a)} | {cell(b)} |  |' for k, a, b in data_rows]
groups = {}
for k in pl: groups.setdefault(k.split('.')[0] if '.' in k else 'other', []).append(k)
out = ['# Kompas Studia: Ukrainian text for review', '',
       'Read the right column. Write a better wording in the last column where it sounds wrong, stiff or too Polish.',
       'HTML tags (`<b>`, `<a ...>`) and `{placeholders}` must stay as they are.', '',
       f'Interface keys: {len(pl)}, translated: {sum(1 for k in pl if k in ua)}. Data texts: {len(data_rows)}.', '',
       '| key | Polski | Українська | correction |', '|---|---|---|---|', *rows, '']
(R / 'studia/i18n/review-ua.md').write_text('\n'.join(out))
print(f'review-ua.md written: {len(pl)} keys + {len(data_rows)} data texts')
