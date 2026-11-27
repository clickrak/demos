"""Liceum UI text snapshot (v2.15, UA1): python3 kompas/tests/liceum_ui.py [--update]
Opens Kompas Liceum with ?test, loads test kids through the "Tryb testowy" buttons, visits every screen and hashes the visible
text (header, main, footer) and the downloaded results file. While texts move to liceum/i18n/pl.json the Polish app must read
exactly the same (tests/snapshots/liceum-pl-ui.json). UI_LANG=ua dumps the Ukrainian texts to the scratch file instead.
Needs: playwright. Starts its own static server."""
import re, json, hashlib, sys, os, threading, http.server, functools, socketserver, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parent.parent
SNAP = ROOT / 'tests/snapshots/liceum-pl-ui.json'
KIDS = ['P1', 'P4', 'P7', 'P8']  # exact marks, soft answers, Tychy, entrance-exam classes
ROUTES = ['start', 'gdzie', 'swiaty', 'zajecia', 'sytuacje', 'styl', 'wartosci', 'mocne', 'szkola', 'wyniki', 'profil', 'lista', 'rodzic', 'szkoly', 'zrodla']
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT))); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
h = lambda s: hashlib.sha1(s.encode()).hexdigest()[:12]
lang = os.environ.get('UI_LANG', '')
TXT = "(()=>{const hid=[...document.querySelectorAll('[data-onlylang][hidden], [data-langsw]')].map(e=>[e,e.parentNode,e.nextSibling]);hid.forEach(([e])=>e.remove());const out=[...document.querySelectorAll('header.top, main, footer.foot')].map(e=>e.innerText).join('\\n')+'\\n@attrs\\n'+[...document.querySelectorAll('header.top [aria-label], header.top [title], main [aria-label], main [title], main [placeholder], footer.foot [aria-label], footer.foot [title], .comfortbar [aria-label], .comfortbar button')].filter(e=>!e.closest('[data-langsw]')).map(e=>[e.getAttribute('aria-label'),e.getAttribute('title'),e.getAttribute('placeholder'),e.closest('.comfortbar')?e.textContent:''].filter(Boolean).join(' | ')).join('\\n')+'\\n@title '+document.title;hid.forEach(([e,p,n])=>p.insertBefore(e,n));return out})()"
clean = lambda t: re.sub(r'v\d+\.\d+\.\d+', 'vX.Y.Z', '\n'.join(l.strip() for l in t.split('\n') if l.strip()))
out, texts, errs = {}, {}, []
def visit(pg, key, r):
    pg.evaluate(f"location.hash='#/{r}'"); pg.wait_for_timeout(300)
    t = clean(pg.evaluate(TXT)); out[f'{key}/{r}'] = h(t); texts[f'{key}/{r}'] = t
with sync_playwright() as p:
    b = p.chromium.launch()
    def page():
        pg = b.new_page(viewport={'width': 1280, 'height': 900}, accept_downloads=True)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route(re.compile(r'tile\.openstreetmap|goatcounter|gc\.zgo'), lambda route: route.abort())  # no network in the test
        pg.clock.set_fixed_time('2026-11-21T12:00:00')
        pg.goto(f'http://127.0.0.1:{port}/liceum/index.html?test' + (f'&lang={lang}' if lang else '')); pg.wait_for_timeout(800)
        return pg
    pg = page()  # no answers: every screen, the gate included
    for r in ROUTES: visit(pg, 'empty', r)
    pg.close()
    for kid in KIDS:
        pg = page()
        pg.evaluate("location.hash='#/start'"); pg.wait_for_timeout(200)
        pg.click('details.card summary'); pg.click(f'[data-persona="{kid}"]'); pg.wait_for_timeout(500)
        pg.evaluate("location.hash='#/profil'"); pg.wait_for_timeout(400)
        for sel in ['.phead [data-like]', '.scard [data-like^="s:"]', '.srows [data-like^="c:"]']:  # fill "Moja lista"
            el = pg.query_selector(sel)
            if el: el.click(); pg.wait_for_timeout(100)
        for r in ROUTES: visit(pg, kid, r)
        pg.evaluate("location.hash='#/wyniki'"); pg.wait_for_timeout(300)
        with pg.expect_download() as dl: pg.click('.exportbox [data-export="download"]')
        md = Path(dl.value.path()).read_text(encoding='utf-8')
        md = re.sub(r'v\d+\.\d+\.\d+', 'vX.Y.Z', re.sub(r'"(version|dataVersion)": "[^"]*"', r'"\1": "-"', md))
        out[f'{kid}/export'] = h(md); texts[f'{kid}/export'] = md
        pg.close()
    b.close()
if errs: print('JS errors:', errs[:3])
dump = Path(tempfile.gettempdir()) / f'liceum_ui_{lang or "pl"}.json'
json.dump(texts, open(dump, 'w'), ensure_ascii=False, indent=1)
if lang: print('texts dumped to', dump); sys.exit(1 if errs else 0)
if '--update' in sys.argv or not SNAP.exists():
    SNAP.write_text(json.dumps(out, indent=1)); print('snapshot written', len(out)); sys.exit(0)
old = json.loads(SNAP.read_text()); bad = [k for k in sorted(set(old) | set(out)) if old.get(k) != out.get(k)]
print('Polish Liceum UI changed on: ' + ', '.join(bad) if bad else f'Polish Liceum UI text unchanged ({len(out)} screens and files)')
sys.exit(1 if bad or errs else 0)
