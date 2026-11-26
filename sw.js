/* SmartHomePros Connect: offline copy of the app picker only. Fast Pitch (pitch/) and Fast Recruit (recruit/) run their own offline helpers. */
const CACHE = 'shpc-5';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png',
  'pitch/assets/home2.webp', 'pitch/assets/vl/imagine.webp', 'pitch/assets/icon-192.png', 'recruit/a_470ace19f4f41e262a08af30291d0034.webp', 'recruit/icon.png', 'connect/bg.webp',
  'pitch/assets/fonts/VivintSans-Light.woff', 'pitch/assets/fonts/VivintSans-Regular.woff', 'pitch/assets/fonts/VivintSans-Medium.woff', 'pitch/assets/fonts/VivintSans-Bold.woff'];
/* announcements (index.html POSTS): the full picture and the small one */
['upgrade', 'drug', 'pulse', 'training', 'drop', 'fs-dth', 'fs-gm', 'race1', 'race2', 'race3', 'race4', 'race5', 'paddock', 'platinum', 'gold', 'silver', 'silver2',
 'smokeco', 'water', 'smartlock', 'appfeat', 'homeview', 'deter', 'comfort'].forEach(id => FILES.push('connect/ann/' + id + '.webp', 'connect/ann/c/' + id + '.webp'));
const ROOT = new URL('./', self.location).href;
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('shpc-') && k !== CACHE) await caches.delete(k);   // only its own: the apps keep theirs
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url); u.search = ''; u.hash = '';
  if (!FILES.some(f => new URL(f, ROOT).href === u.href)) return;   // everything else (the two apps) is left alone
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try { const r = await fetch(req, { cache: 'no-store' }); if (r && r.ok) c.put(u.href, r.clone()); return r; }
    catch (err) { return (await c.match(u.href)) || (await c.match(ROOT)) || Response.error(); }
  })());
});
