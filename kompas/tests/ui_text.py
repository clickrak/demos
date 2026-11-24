"""Polish UI text snapshot (Studia v3.1+): python3 kompas/tests/ui_text.py [--update]
Loads three test kids into the app through the real "Wczytaj plik" input, visits every screen and hashes the visible text
(header, main, footer). While texts move to i18n files the Polish app must read exactly the same (tests/snapshots/pl-ui.json).
Needs: playwright, node. Starts its own static server."""
import json, hashlib, subprocess, sys, os, threading, http.server, functools, socketserver
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parent.parent
SNAP = ROOT / 'tests/snapshots/pl-ui.json'
KIDS = [0, 7, 21]  # indexes into personas.json
ROUTES = ['start','pewnosc','matura','jezyki','zajecia','sytuacje','styl','wartosci','mocne','odbicie','sily','karty','dlugosc','zasieg','niepokoj','refleksja','kompas','wyniki']
JS = """import {readFileSync} from 'node:fs';import {scoreAll} from '%s/core/scoring.js';import {buildMarkdown} from '%s/core/export.js';
const j=p=>JSON.parse(readFileSync('%s/'+p));
const data={dimensions:j('core/dimensions.json'),strengths:j('core/strengths.json'),config:j('studia/data/config.json'),questions:j('studia/data/questions.json'),opportunities:j('studia/data/opportunities.json'),offers:j('studia/data/db/pl/krakow/offers.json'),campuses:j('studia/data/db/pl/krakow/campuses.json'),sources:j('studia/data/sources.json'),scenarios:j('studia/data/scenarios.json')};
const P=j('studia/data/personas.json');const out=%s.map(i=>buildMarkdown(P[i].answers,scoreAll(P[i].answers,data),data,'2026-11-21'));console.log(JSON.stringify(out));""" % (ROOT, ROOT, ROOT, json.dumps(KIDS))
files = json.loads(subprocess.run(['node', '--input-type=module', '-e', JS], capture_output=True, text=True, check=True).stdout)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT))); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
h = lambda s: hashlib.sha1(s.encode()).hexdigest()[:12]
out = {}; texts = {}
lang = os.environ.get('UI_LANG', '')
with sync_playwright() as p:
    b = p.chromium.launch()
    for ki, md in zip(KIDS, files):
        pg = b.new_page(viewport={'width': 1280, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{port}/studia/index.html' + (f'?lang={lang}' if lang else '')); pg.wait_for_timeout(700)
        Path('/tmp/kid.md').write_text(md)
        pg.set_input_files('[data-load]', '/tmp/kid.md'); pg.wait_for_timeout(500)
        for r in ROUTES:
            pg.evaluate(f"location.hash='#/{r}'"); pg.wait_for_timeout(350)
            t = pg.evaluate("[...document.querySelectorAll('header.top, main, footer.foot')].map(e=>e.innerText).join('\\n')")
            out[f'{ki}/{r}'] = h(t); texts[f'{ki}/{r}'] = t
        if errs: print('JS errors', ki, errs[:2])
    b.close()
if lang: json.dump(texts, open('/tmp/ui_texts_%s.json' % lang, 'w'), ensure_ascii=False); print('texts dumped to /tmp/ui_texts_%s.json' % lang); sys.exit(0)
if '--update' in sys.argv or not SNAP.exists():
    SNAP.write_text(json.dumps(out, indent=1)); json.dump(texts, open('/tmp/ui_texts_pl_base.json', 'w'), ensure_ascii=False); print('snapshot written', len(out)); sys.exit(0)
old = json.loads(SNAP.read_text()); bad = [k for k in out if old.get(k) != out[k]]
print('Polish UI changed on: ' + ', '.join(bad) if bad else f'Polish UI text unchanged ({len(out)} screens)'); sys.exit(1 if bad else 0)
