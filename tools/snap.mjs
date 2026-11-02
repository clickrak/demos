#!/usr/bin/env node
// Renders a 1200×627 link-preview design (an HTML file) to a PNG with
// headless Chrome. LinkedIn's recommended size is 1200×627.
//
// Usage (from the repo root):
//   node tools/snap.mjs src/rhythm-cartography/preview.html rhythm-cartography/preview.png
//   node tools/snap.mjs src/site-preview.html preview.png
//
// Needs Google Chrome installed (or set CHROME_PATH).

import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: node tools/snap.mjs <design.html> <out.png>");
  process.exit(1);
}

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" },
);
const page = await browser.newPage({ viewport: { width: 1200, height: 627 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: output, type: "png" });
await browser.close();
console.log(`Saved ${output} (1200×627)`);
