# Demos

Small interactive web demos. Each folder is one demo, served as a plain static page.

| Demo | Folder |
|---|---|
| Rhythm Cartography: 50 years of electronic music, mapped and playable | [`rhythm-cartography/`](rhythm-cartography/) |

## How it's organised

```
index.html                home page (generated)
preview.png               home page link preview, 1200×627
rhythm-cartography/
  index.html              the demo as one standalone page (generated)
  preview.png             link preview for LinkedIn, 1200×627
src/
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
