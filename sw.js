/* Smart Home Pros: offline copy of the app picker only. Fast Pitch (pitch/) and Fast Recruit (recruit/) run their own offline helpers. */
const CACHE = 'shpc-12';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png', 'nav/shpnav.css', 'nav/shpnav.js',
  'pitch/assets/home2.webp', 'pitch/assets/vl/imagine.webp', 'pitch/assets/icon-192.png', 'recruit/a_470ace19f4f41e262a08af30291d0034.webp', 'recruit/icon.png', 'connect/bg.webp', 'connect/conveyour.jpg', 'connect/recruit_ho.jpg',
  'pitch/assets/fonts/VivintSans-Light.woff', 'pitch/assets/fonts/VivintSans-Regular.woff', 'pitch/assets/fonts/VivintSans-Medium.woff', 'pitch/assets/fonts/VivintSans-Bold.woff'];
/* announcements (index.html POSTS): the full picture and the small one */
['upgrade', 'drug', 'pulse', 'training', 'drop', 'fs-dth', 'fs-gm', 'race1', 'race2', 'race3', 'race4', 'race5', 'paddock', 'platinum', 'gold', 'silver', 'silver2',
 'smokeco', 'water', 'smartlock', 'appfeat', 'homeview', 'deter', 'comfort'].forEach(id => FILES.push('connect/ann/' + id + '.webp', 'connect/ann/c/' + id + '.webp'));
const ROOT = new URL('./', self.location).href;
/* SHP page extras: hero animation, More contacts (+ every vCard so Save to Contacts works offline) */
FILES.push('connect/hero/hero.js', 'connect/contacts.js', 'connect/contacts.css');
["1stop", "account-creations", "add-payment", "amigo", "arbitrations", "assets", "backends", "buyouts", "campus-recruiting", "citizens-one", "city-permitting", "claims-damages", "collections", "customer-care", "customer-loyalty", "customer-support", "employee-licensing", "energy-commissions", "fortiva-retail-credit", "friends-and-family", "front-desk", "genie-bar", "housing", "hr", "incentives", "insurance", "legal", "manual-onboarding", "military-customers", "moves", "opportunities", "pay", "qrf-inbox", "rep-pay", "retention", "sales-support", "screening", "service-desk", "sos", "special-accounts", "state-licensing", "strategic-business-development-sbd", "tax-help", "training", "travel", "vivint-gives-back", "vivint-sales-contacts"].forEach(f => FILES.push('connect/vcf/' + f + '.vcf'));
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
