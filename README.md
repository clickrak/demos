# Demos

Small interactive web demos. Each folder is one demo, served as a plain static page.

| Demo | Folder |
|---|---|
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

## Link previews (LinkedIn)

LinkedIn builds the post card from the `og:` tags in each page. Those tags need full addresses, which come from `url` in `site.json`: if the site address changes, update it there and rebuild. After publishing, paste the page address into LinkedIn's [Post Inspector](https://www.linkedin.com/post-inspector/) to check the card and refresh LinkedIn's cache.

## Extended Lines: add or change photos

1. Add the photo to `PHOTOS` at the top of `src/extended-lines/analyse.py` with a small recipe
   (`edges` for crisp architecture, `mask` for silhouettes, `poly` for soft shapes like fog or skylines).
2. Run `python3 src/extended-lines/analyse.py /folder/with/originals --debug`
   (needs `pip install opencv-python-headless numpy`; `--debug` writes `/tmp/el_dbg_<id>.png` showing the lines found).
3. Optionally give it an artist preset in `PRESETS` in `app.jsx`, then build as usual.
