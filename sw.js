// service worker — version muvky3pa
const CACHE = 'blokcraft-muvky3pa';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-180.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(async (c) => {
  await c.addAll(CORE);
  // pre-cache every voice clip so speech works offline (failures are ignored; clips are cached on first play too)
  try { const idx = await (await fetch('audio/index.json')).json(); await c.put('./audio/index.json', new Response(JSON.stringify(idx), { headers: { 'content-type': 'application/json' } })); for (let i = 0; i < idx.keys.length; i += 20) await Promise.all(idx.keys.slice(i, i + 20).map((k) => c.add('./audio/' + k + '.mp3').catch(() => {}))); } catch (e) {}
})); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // network first for the page (to pick up updates), cache fallback offline
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req, { cache: 'no-cache' }).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put('./index.html', c)); return r; }).catch(() => caches.match('./index.html')));
      return;
    }
    // voice clips: cache on first play; everything else: cache first
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok && /\/audio\//.test(url.pathname)) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return r; })));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
