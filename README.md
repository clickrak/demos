# Demos

Small interactive web demos. Each folder is one demo, served as a plain static page.

| Demo | Folder |
|---|---|
| Kompas Liceum: choosing a high school in Kraków, to go through with a parent (PL) | [`kompas/liceum/`](kompas/liceum/) |
| Kompas Studia: choosing what to study in Kraków (PL) | [`kompas/studia/`](kompas/studia/) |
| Odkryj Zelków: an isometric adventure map for kids around Zelków on the Kraków Jura (PL) | [`zelkow/`](zelkow/) |
| How to Catch an Atom: an interactive explainer of an ion-trap quantum computer (PL / EN) | [`ion-trap/`](ion-trap/) |
| Rhythm Cartography: 50 years of electronic music, mapped and playable | [`rhythm-cartography/`](rhythm-cartography/) |
| Extended Lines: black and white photographs whose geometry leaks onto the page | [`extended-lines/`](extended-lines/) |

## How it's organised

```
index.html                home page (generated)
preview.png               home page link preview, 1200×627
rhythm-cartography/
  index.html              the demo as one standalone page (generated)
  preview.png             link preview for LinkedIn, 1200×627
extended-lines/
  index.html              (generated)
  photos/*.jpg            web versions of the photos (written by analyse.py)
src/
  ion-trap/
    app.html              hand-written standalone page (no React): edit this one
    demo.json             "static": "app.html" + link-preview texts
    preview.html          design of preview.png
  extended-lines/
    analyse.py            offline step: finds the lines in each photo → photos.json
    photos.json           line model per photo (lines, tones, edge strips)
    app.jsx               the live pipeline: extend → deform → disperse → decompose + fill
  rhythm-cartography/
    app.jsx               React source: edit this one
    demo.json             title, texts and colours for the page
    preview.html          design of preview.png
  site-preview.html       design of the home page preview.png
site.json                 site name, address and list of demos
tools/                    build helpers (not needed for hosting)
```

Hosting needs no build step: serve the repo root as it is (GitHub Pages, Cloudflare Pages with no build command, or any static host). React 18 is loaded from cdn.jsdelivr.net; everything else is inside each page.

## Change or add a demo

A page that is edited in its own folder (like `kompas/liceum/`) can be listed too: give it a `src/<name>/demo.json` with `"page": "kompas/liceum"` and put `<!-- site-head --><!-- /site-head -->` in its `<head>`. The build only refreshes the link-preview and counter tags between those markers and shows the page on the home page; the preview image is `<page>/preview.png`.

A plain HTML page works too: put it in `src/<name>/app.html` with a `<!-- site-head -->` line in its `<head>`, and set `"static": "app.html"` in `demo.json`. The build adds the link-preview tags there and copies the page to `<name>/index.html`.

1. Put the React component in `src/<name>/app.jsx` (default export; only `react` can be imported) and a `demo.json` next to it (copy an existing one).
2. Add `<name>` to `demos` in `site.json`.
3. Build the pages:
   ```sh
   (cd tools && npm install)
   node tools/build.mjs
   ```
4. Make the preview image: design `src/<name>/preview.html` at 1200×627, then run
   `node tools/snap.mjs src/<name>/preview.html <name>/preview.png` (needs Google Chrome).
5. Commit and push.

## Zelków map

`src/zelkow/app.html` is a hand-written Three.js page (loaded from cdn.jsdelivr.net) that draws `zelkow/map.json`. The **🧭 Szlak** button switches to a flat hiking map (`src/zelkow/hike.js`, a plain 2D canvas with no animation, loaded only when you tap the button) that draws `zelkow/hike.json` on top of `zelkow/hike-light.jpg` / `hike-dark.jpg`. Open it directly with `/zelkow/#szlak`.

How the data gets there:
1. `src/zelkow/data/query.overpassql` is the OpenStreetMap query. Changing it (or one of the scripts) and pushing runs the GitHub Action **Zelków map data** (`.github/workflows/zelkow-data.yml`; it can also be started by hand from the Actions tab). It downloads the raw data and elevation tiles, runs the two build scripts and commits only the results. The raw `osm.json` (about 76 MB) is not kept in git (it is in `.gitignore`).
2. `python3 src/zelkow/data/build_map.py` (needs Pillow) turns it into `zelkow/map.json` for the 3D view: terrain heights, land cover, buildings, roads, streams, rocks, trails, bus 248, school, pitches, playgrounds, ponds.
3. `python3 src/zelkow/data/build_hike.py` (needs Pillow, numpy, scipy, contourpy) makes the flat map: contour lines, the two base pictures, roads, trails, places, and the five walks. **The walks are defined at the bottom of that script** (`WALKS`: waypoints by name or coordinates). Each one is routed along real roads and paths, and the script prints its length, climb and time.
4. `node tools/build.mjs` as usual.

The 8 star places (`SPOTS`), the activity tags (`ACTS`) and the "Mój Zelków" info pins (`INFO`) are at the top of the script in `app.html`. `app.html?preview` hides the controls; `zelkow/preview.png` is a 1200×627 screenshot of that.

## Link previews (LinkedIn)

LinkedIn builds the post card from the `og:` tags in each page. Those tags need full addresses, which come from `url` in `site.json`: if the site address changes, update it there and rebuild. After publishing, paste the page address into LinkedIn's [Post Inspector](https://www.linkedin.com/post-inspector/) to check the card and refresh LinkedIn's cache.

## Extended Lines: add or change photos

1. Add the photo to `PHOTOS` at the top of `src/extended-lines/analyse.py` with a small recipe
   (`edges` for crisp architecture, `mask` for silhouettes, `poly` for soft shapes like fog or skylines).
2. Run `python3 src/extended-lines/analyse.py /folder/with/originals --debug`
   (needs `pip install opencv-python-headless numpy`; `--debug` writes `/tmp/el_dbg_<id>.png` showing the lines found).
3. Optionally give it an artist preset in `PRESETS` in `app.jsx`, then build as usual.

## Visit statistics

Every page loads a small [GoatCounter](https://www.goatcounter.com) script (no cookies, no personal data). The code is set in `site.json` (`"goatcounter": "clickrak"`); stats are at https://clickrak.goatcounter.com. Remove that line and rebuild to turn it off.
