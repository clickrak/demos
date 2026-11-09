// Answers live in memory; a copy goes to this device's storage when it is available.
// Storage can be blocked (private window); the app works without it.
export function makeStore(key) {
  return {
    load() { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } },
    save(v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage blocked: keep going */ } },
    clear() { try { localStorage.removeItem(key); } catch { /* ignore */ } }
  };
}
