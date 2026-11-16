# Konta Inwestycyjne v0.1

Simple calculator comparing IKE, IKZE, OKI, PPK, PPE, EDO bonds and ETF World / EM (XTB) for a Polish employee. Static site, no build step.

## Run locally
```
python3 -m http.server 8000   # then open http://localhost:8000
node tests.js                 # calculation tests
```

## Deploy to GitHub Pages
1. Push this folder to a repo (files at the root).
2. Settings → Pages → Deploy from branch → `main` / root.

## Files
- `config.js` – all assumptions (limits, taxes, returns, presets, texts)
- `calc.js` – pure calculation functions
- `app.js` – UI
- `tests.js` / `tests.html` – tests
- `sw.js` – offline cache (bump `VERSION` when files change)
- `SPEC.md` – spec, status and TODO for next version

To nie jest porada inwestycyjna.
