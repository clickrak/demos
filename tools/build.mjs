#!/usr/bin/env node
// Builds the whole site from src/ and site.json:
//   - each demo: src/<demo>/app.jsx + demo.json  →  <demo>/index.html
//     (standalone page: React 18 from a CDN, the app compiled to plain
//      JavaScript and inlined, plus link-preview tags for LinkedIn & co.)
//   - or a hand-written page: src/<demo>/demo.json with "static": "app.html"
//   - the home page: index.html, one card per demo listed in site.json
//
// Usage (from the repo root):
//   (cd tools && npm install)
//   node tools/build.mjs              # everything
//   node tools/build.mjs <demo>       # one demo + the home page
//
// Link previews need full https:// addresses. They all come from "url" in
// site.json: change it there if the site moves, then rebuild.

import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "site.json"), "utf8"));
const BASE = site.url.replace(/\/+$/, "");

// React comes from the CDN as window.React / window.ReactDOM (UMD builds).
// React 19 no longer ships UMD files, so the demos stay on React 18.
const REACT_VERSION = "18.3.1";
const CDN = {
  react: {
    src: `https://cdn.jsdelivr.net/npm/react@${REACT_VERSION}/umd/react.production.min.js`,
    sri: "sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z",
  },
  reactDom: {
    src: `https://cdn.jsdelivr.net/npm/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js`,
    sri: "sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1",
  },
};

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Optional privacy-friendly visit counter (no cookies): set "goatcounter": "<code>"
// in site.json; stats are then at https://<code>.goatcounter.com
const counterTag = site.goatcounter
  ? `<script data-goatcounter="https://${site.goatcounter}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>\n`
  : "";
const svgIcon = (svg) => (svg ? `<link rel="icon" href="${esc(`data:image/svg+xml,${encodeURIComponent(svg)}`)}">\n` : "");

// Shared <head> tags for link previews. LinkedIn wants 1200×627 PNG/JPG.
function previewTags({ title, description, url, image, imageAlt, locale = "en_US" }) {
  return `<!-- Link preview for LinkedIn, Facebook, Slack, Teams, X. Addresses must be absolute. -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="627">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta property="og:locale" content="${esc(locale)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="twitter:image:alt" content="${esc(imageAlt)}">`;
}

// ---------------------------------------------------------------- demos ----

// Map "react" / "react-dom" imports to the CDN globals; refuse anything else
// so a missing library shows up here and not in a visitor's browser.
const reactGlobals = {
  name: "react-globals",
  setup(build) {
    build.onResolve({ filter: /^[^./]/ }, (args) => {
      if (/^react(-dom)?(\/.*)?$/.test(args.path)) return { path: args.path, namespace: "cdn-global" };
      return { errors: [{ text: `"${args.path}" is not available: only react and react-dom are loaded from the CDN.` }] };
    });
    build.onLoad({ filter: /.*/, namespace: "cdn-global" }, (args) => {
      if (args.path === "react") return { contents: "module.exports = window.React;", loader: "js" };
      if (args.path === "react-dom" || args.path === "react-dom/client") {
        return { contents: "module.exports = window.ReactDOM;", loader: "js" };
      }
      return { errors: [{ text: `"${args.path}" is not part of the React ${REACT_VERSION} UMD build.` }] };
    });
  },
};

function readDemo(demo) {
  const srcDir = path.join(ROOT, "src", demo);
  const cfg = JSON.parse(fs.readFileSync(path.join(srcDir, "demo.json"), "utf8"));
  return { demo, srcDir, cfg };
}

// A hand-written standalone page (no React): src/<demo>/<cfg.static>.
// The build only adds canonical, favicon and link-preview tags where the
// page has <!-- site-head -->, then copies it to <demo>/index.html.
function buildStatic(demo, srcDir, cfg) {
  const url = `${BASE}/${demo}/`;
  const src = fs.readFileSync(path.join(srcDir, cfg.static), "utf8");
  if (!src.includes("<!-- site-head -->")) throw new Error(`${demo}: ${cfg.static} has no <!-- site-head --> marker`);
  const head = `<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="${esc((cfg.theme || {}).background || "#ffffff")}">
${svgIcon(cfg.faviconSvg)}${previewTags({
    title: cfg.ogTitle || cfg.title,
    description: cfg.ogDescription || cfg.description,
    url,
    image: `${url}preview.png`,
    imageAlt: cfg.imageAlt,
    locale: cfg.locale,
  })}${counterTag}`;
  const html = src.replace("<!-- site-head -->", () => head);
  fs.mkdirSync(path.join(ROOT, demo), { recursive: true });
  fs.writeFileSync(path.join(ROOT, demo, "index.html"), html);
  console.log(`Built ${demo}/index.html (static, ${(html.length / 1024).toFixed(1)} KB)  ${url}`);
}

async function buildDemo(demo) {
  const { srcDir, cfg } = readDemo(demo);
  if (cfg.static) return buildStatic(demo, srcDir, cfg);
  const entryFile = path.join(srcDir, cfg.entry || "app.jsx");

  // Mount the demo's default export, with a small error screen so a crash
  // shows a message instead of a blank page.
  const entry = `
import React from "react";
import App from ${JSON.stringify(entryFile)};

class Guard extends React.Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error(err); }
  render() {
    if (!this.state.failed) return this.props.children;
    return React.createElement("div", { className: "boot" },
      React.createElement("div", { className: "boot-msg" },
        "Something went wrong. ",
        React.createElement("a", { href: location.href }, "Reload the page")));
  }
}

window.ReactDOM.createRoot(document.getElementById("root"))
  .render(React.createElement(Guard, null, React.createElement(App)));
`;

  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: srcDir, sourcefile: "entry.jsx", loader: "jsx" },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: ["es2019"], // keeps older iPhones (Safari 13) working
    charset: "utf8",
    legalComments: "none",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    loader: { ".jsx": "jsx", ".js": "jsx" },
    plugins: [reactGlobals],
    logLevel: "warning",
  });

  // Never let the inlined code close the <script> tag early.
  const js = result.outputFiles[0].text.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");

  const url = `${BASE}/${demo}/`;
  const t = cfg.theme || {};
  const bg = t.background || "#0b0e1a";
  const fg = t.text || "#e8eaf6";
  const muted = t.muted || "#8a91b4";
  const link = t.link || fg;
  const fonts = cfg.fonts || [];
  const fontTags = fonts.length
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
      fonts.map((href) => `<link rel="stylesheet" href="${esc(href)}">`).join("\n") + "\n"
    : "";

  const html = `<!doctype html>
<html lang="${esc(cfg.lang || "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(cfg.pageTitle || cfg.title)}</title>
<meta name="description" content="${esc(cfg.description)}">
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="${esc(bg)}">
<meta name="color-scheme" content="dark">
${svgIcon(cfg.faviconSvg)}
${previewTags({
    title: cfg.ogTitle || cfg.title,
    description: cfg.ogDescription || cfg.description,
    url,
    image: `${url}preview.png`,
    imageAlt: cfg.imageAlt,
    locale: cfg.locale,
  })}
${fontTags}<style>
  html, body { margin: 0; background: ${bg}; color: ${fg}; }
  body { min-height: 100vh; min-height: 100dvh; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  .boot { min-height: 100vh; min-height: 100dvh; display: grid; place-items: center; padding: 24px; box-sizing: border-box;
          font: 14px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: ${muted}; text-align: center; }
  .boot-msg { max-width: 30rem; }
  .boot a { color: ${link}; }
</style>
${counterTag}</head>
<body>
<div id="root"><div class="boot">Loading…</div></div>
<noscript><div class="boot"><div class="boot-msg">This demo needs JavaScript.</div></div></noscript>
<script src="${CDN.react.src}" integrity="${CDN.react.sri}" crossorigin="anonymous"></script>
<script src="${CDN.reactDom.src}" integrity="${CDN.reactDom.sri}" crossorigin="anonymous"></script>
<script>
// iPhone: let Web Audio play even when the phone is set to silent.
try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
if (!window.React || !window.ReactDOM) {
  document.getElementById("root").innerHTML =
    '<div class="boot"><div class="boot-msg">Could not load React from cdn.jsdelivr.net. ' +
    'Check your connection or ad blocker, then <a href="">reload the page</a>.</div></div>';
} else {
// ---- ${demo}: compiled from src/${demo}/${path.basename(entryFile)} by tools/build.mjs ----
${js}
}
</script>
</body>
</html>
`;

  fs.mkdirSync(path.join(ROOT, demo), { recursive: true });
  fs.writeFileSync(path.join(ROOT, demo, "index.html"), html);
  console.log(`Built ${demo}/index.html (${(html.length / 1024).toFixed(1)} KB)  ${url}`);
}

// ------------------------------------------------------------ home page ----

function buildHome() {
  const cards = site.demos
    .map((d) => readDemo(d))
    .map(({ demo, cfg }) => {
      const tags = (cfg.tags || []).map((t) => `<li>${esc(t)}</li>`).join("");
      return `
      <a class="item" href="${esc(demo)}/">
        <img src="${esc(demo)}/preview.png" width="1200" height="627" alt="" loading="lazy">
        <div class="body">
          <h2>${esc(cfg.title)}</h2>
          <p>${esc(cfg.cardText || cfg.description)}</p>
          ${tags ? `<ul class="tags" aria-label="Topics">${tags}</ul>` : ""}
          <span class="open">Open the demo <span aria-hidden="true">→</span></span>
        </div>
      </a>`;
    })
    .join("\n");

  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#151824"/><g fill="#3a405c"><circle cx="18" cy="18" r="5"/><circle cx="46" cy="18" r="5"/><circle cx="18" cy="46" r="5"/><circle cx="46" cy="32" r="5"/></g><circle cx="32" cy="18" r="5" fill="#3de1ad"/><circle cx="18" cy="32" r="5" fill="#ff5c8a"/><circle cx="32" cy="32" r="5" fill="#ffc94d"/><circle cx="32" cy="46" r="5" fill="#5ca8ff"/><circle cx="46" cy="46" r="5" fill="#b57bff"/></svg>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.name)}</title>
<meta name="description" content="${esc(site.tagline)}">
<link rel="canonical" href="${esc(BASE)}/">
<meta name="color-scheme" content="light dark">
${svgIcon(icon)}
${previewTags({
    title: site.name,
    description: site.tagline,
    url: `${BASE}/`,
    image: `${BASE}/preview.png`,
    imageAlt: site.imageAlt,
  })}
<style>
  :root {
    --bg: #f5f3ee; --surface: #ffffff; --text: #15171c; --muted: #5b5f6d; --line: #e2dfd7;
    --accent: #2f4ae0; --shadow: 0 18px 40px -24px rgb(20 22 40 / .35);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0c0e16; --surface: #141724; --text: #eaebf3; --muted: #9a9fb6; --line: #252a3c;
      --accent: #8fa2ff; --shadow: 0 18px 40px -24px rgb(0 0 0 / .8);
    }
  }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  }
  .wrap { max-width: 1000px; margin: 0 auto; padding: 64px 16px 40px; }
  header h1 { font-size: clamp(2.4rem, 7vw, 3.6rem); line-height: 1; letter-spacing: -0.035em; margin: 0 0 14px; }
  header p { margin: 0; max-width: 34rem; color: var(--muted); font-size: 1.08rem; }
  .list { display: grid; gap: 20px; margin-top: 44px; }
  .item {
    display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); align-items: stretch;
    background: var(--surface); border: 1px solid var(--line); border-radius: 18px; overflow: hidden;
    color: inherit; text-decoration: none;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }
  .item:hover { transform: translateY(-2px); box-shadow: var(--shadow); border-color: color-mix(in srgb, var(--accent) 35%, var(--line)); }
  .item:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
  .item img { display: block; width: 100%; height: 100%; aspect-ratio: 1200 / 627; object-fit: cover; background: #0b0e1a; }
  .body { display: flex; flex-direction: column; justify-content: center; gap: 10px; padding: 26px 28px; }
  .body h2 { margin: 0; font-size: 1.45rem; line-height: 1.2; letter-spacing: -0.015em; }
  .body p { margin: 0; color: var(--muted); }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 2px 0 0; padding: 0; list-style: none; }
  .tags li { font-size: .78rem; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 1px 10px; }
  .open { margin-top: 6px; font-weight: 650; color: var(--accent); }
  footer {
    display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px;
    margin-top: 64px; padding-top: 20px; border-top: 1px solid var(--line); color: var(--muted); font-size: .88rem;
  }
  footer a { color: inherit; }
  @media (max-width: 720px) {
    .wrap { padding-top: 44px; }
    .item { grid-template-columns: 1fr; }
    .item img { height: auto; }
    .body { padding: 20px; }
  }
  @media (prefers-reduced-motion: reduce) { .item { transition: none; } .item:hover { transform: none; } }
</style>
${counterTag}</head>
<body>
  <div class="wrap">
    <header>
      <h1>${esc(site.name)}</h1>
      <p>${esc(site.tagline)}</p>
    </header>
    <main class="list">
${cards}
    </main>
    <footer>
      <span>Static pages · nothing to install, no sign-up</span>
      ${site.repo ? `<a href="${esc(site.repo)}">Source on GitHub</a>` : ""}
    </footer>
  </div>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, "index.html"), html);
  console.log(`Built index.html (home, ${site.demos.length} demo${site.demos.length === 1 ? "" : "s"})  ${BASE}/`);
}

// ----------------------------------------------------------------- main ----

const only = process.argv[2];
for (const demo of only ? [only] : site.demos) await buildDemo(demo);
buildHome();
