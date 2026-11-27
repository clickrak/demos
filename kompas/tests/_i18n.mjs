// Loads the Polish interface texts for node tests (the browser apps fetch the same files). Import this first.
import { readFileSync, existsSync } from 'node:fs';
import { loadDict, setLang } from '../core/i18n.js';
const f = p => { const u = new URL(p, import.meta.url); return existsSync(u) ? JSON.parse(readFileSync(u)) : {}; };
loadDict('pl', { ...f('../core/i18n/pl.json'), ...f('../studia/i18n/pl.json'), ...f('../liceum/i18n/pl.json') });
loadDict('ua', { ...f('../core/i18n/ua.json'), ...f('../studia/i18n/ua.json'), ...f('../liceum/i18n/ua.json') });
setLang(process.env.KOMPAS_LANG || 'pl');
