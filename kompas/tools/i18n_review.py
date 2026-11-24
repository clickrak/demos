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
groups = {}
for k in pl: groups.setdefault(k.split('.')[0] if '.' in k else 'other', []).append(k)
out = ['# Kompas Studia: Ukrainian text for review', '',
       'Read the right column. Write a better wording in the last column where it sounds wrong, stiff or too Polish.',
       'HTML tags (`<b>`, `<a ...>`) and `{placeholders}` must stay as they are.', '',
       f'Keys: {len(pl)}, translated: {sum(1 for k in pl if k in ua)}.', '',
       '| key | Polski | Українська | correction |', '|---|---|---|---|', *rows, '']
(R / 'studia/i18n/review-ua.md').write_text('\n'.join(out))
print(f'review-ua.md written: {len(pl)} keys')
