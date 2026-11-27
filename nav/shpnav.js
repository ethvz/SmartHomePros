/* Smart Home Pros: shared navigation, one look in all three apps (see nav/shpnav.css).
   Included by index.html (the SHP page), pitch/index.html, and recruit/index.html (injected by tools/build.py).
   - App selector at the top of every menu: Home (the SHP page) | Fast Pitch | Fast Recruit | Pulse (opens outside) | The Playbook (soon).
     The current app is highlighted. Switching apps records shpc_last (the SHP page's "open on launch" uses it).
   - SHP page and Fast Recruit: the Vivint logo + hamburger in the bottom-left corner (Fast Pitch has its own footer).
   - SHP page: its own menu card (selector + the page's sections + Settings).
   - Fast Pitch: the selector goes under its menu header. Fast Recruit: into its menu (created on each open), revealed from the corner.
   window.SHPNav: { app, selector(), open(), close(), toast(msg) }. */
(function () {
  'use strict';
  if (window.SHPNav) return;
  var S = document.currentScript, ROOT = '';
  try { ROOT = new URL('../', S.src).href; } catch (e) { ROOT = location.href.replace(/[^/]*$/, '') + '../'; }
  var H = document.documentElement;
  var APP = (window.SHPC && window.SHPC.app) || (S && S.getAttribute('data-app')) || 'home';
  H.classList.add('shpn-' + APP);

  var LOGO = '<svg class="lg" viewBox="20 4 1620 380" aria-hidden="true"><path d="M1343.07 303.45c-21.88 0-39.58 17.52-39.58 39.15 0 21.62 17.69 39.15 39.58 39.15 21.82 0 39.58-17.53 39.58-39.15 0-21.63-17.76-39.15-39.58-39.15z"/><path d="M1462.07 45l-155.72 141.25v52.92c57.67-20.1 120.93 9.9 141.22 67 4.19 11.7 6.32 24.03 6.32 36.43 0 12.74-2.26 24.93-6.32 36.34h134.03c20.02 0 36.25-16.04 36.25-35.84v-156.85L1462.07 45z"/><path d="M353.81 5.85c-21.85 0-39.56 17.52-39.56 39.15 0 21.62 17.71 39.15 39.56 39.15 21.85 0 39.57-17.53 39.57-39.15 0-21.63-17.72-39.15-39.57-39.15z"/><path d="M353.81 113.32c-18.19 0-32.93 14.59-32.93 32.58v232.13h65.85V145.91c0-17.99-14.74-32.59-32.92-32.59z"/><path d="M741.61 5.85c-21.88 0-39.58 17.52-39.58 39.15 0 21.62 17.69 39.15 39.58 39.15 21.82 0 39.58-17.53 39.58-39.15 0-21.63-17.76-39.15-39.58-39.15z"/><path d="M741.61 113.32c-18.23 0-32.93 14.59-32.93 32.58v232.13h65.85V145.9c0-17.98-14.77-32.58-32.92-32.58z"/><path d="M1158.75 73.24c0-17.99-14.7-32.58-32.93-32.58-18.16 0-32.93 14.59-32.93 32.58v217.03c0 56.68 33.46 87.78 88.74 87.78h50.62v-56.97h-36.98c-25.34 0-36.45-14.02-36.45-36.09V174.4h73.44v-56.93h-73.37V73.24z"/><path d="M960.19 113.57c-38.65 0-63.86 20.48-74.7 39.99h-6.79v-7.66c0-17.99-14.77-32.58-32.93-32.58-18.23 0-32.93 14.59-32.93 32.58v232.13h67.52V231.71c0-33.08 26.27-58.16 58.74-58.16s53.21 21.58 53.21 53.67v150.82h65.85V212.75c0-56.13-37.12-99.18-97.91-99.18z"/><path d="M548.88 305.76h-4.14l-64.91-188.29h-70.64l86.31 228.93c10.8 28.23 42.67 42.46 71.19 31.78 14.78-5.54 26.46-17.07 32.07-31.68l86.77-229.03h-72.25z"/><path d="M225.45 117.47h72.24l-86.76 228.97c-10.77 28.21-42.61 42.44-71.11 31.78-14.85-5.55-26.57-17.17-32.15-31.88L21.41 117.47h70.65l64.86 188.29h4.19z"/></svg>';
  var SHPW = '<span class="shpn-word"><svg viewBox="1296 36 312 352" aria-hidden="true"><path d="M1343.07 303.45c-21.88 0-39.58 17.52-39.58 39.15 0 21.62 17.69 39.15 39.58 39.15 21.82 0 39.58-17.53 39.58-39.15 0-21.63-17.76-39.15-39.58-39.15z"/><path d="M1462.07 45l-155.72 141.25v52.92c57.67-20.1 120.93 9.9 141.22 67 4.19 11.7 6.32 24.03 6.32 36.43 0 12.74-2.26 24.93-6.32 36.34h134.03c20.02 0 36.25-16.04 36.25-35.84v-156.85L1462.07 45z"/></svg>SHP</span>';
  var IC = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 4.5l8 6.7V20h-5.4v-5.4H9.4V20H4z"/></svg>',
    pitch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2.8 5.2 13.4h6.1l-1 7.8 8-10.6h-6.1z"/></svg>',
    recruit: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.2" r="3.3"/><path d="M2.8 20c.4-3.5 3-6 6.2-6s5.8 2.5 6.2 6"/><circle cx="17.2" cy="9.4" r="2.5"/><path d="M16.6 14.3c2.6.2 4.4 2.4 4.7 5.2"/></svg>',
    pulse: '<svg viewBox="-12 -10 194 207" aria-hidden="true"><path class="f" d="M9 0H101Q107 0 111 4L166 59Q170 63 170 69V76Q170 90 156 90H90L4 4Q0 0 9 0Z"/><path class="f" d="M90 95V172Q90 187 75 187H15Q0 187 0 172V110Q0 95 15 95Z"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v14H7.5A2.5 2.5 0 0 0 5 19.5z"/><path d="M5 19.5A2.5 2.5 0 0 0 7.5 22H19v-5"/><path d="M9 7.5h6"/></svg>',
    ext: '<svg class="shpn-ext" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4"/></svg>',
    burger: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>',
    x: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>'
  };
  var PICK = (window.SHPC && window.SHPC.picker) || (ROOT + 'index.html?pick');
  var APPS = [
    { k: 'home', n: 'Home', url: APP === 'home' ? null : PICK },
    { k: 'pitch', n: 'Fast Pitch', url: ROOT + 'pitch/index.html' },
    { k: 'recruit', n: 'Fast Recruit', url: ROOT + 'recruit/index.html' },
    { k: 'pulse', n: 'Pulse', url: 'https://pulse.vivint.com', ext: 1 },
    { k: 'book', n: 'Playbook', soon: 'The Playbook' }
  ];

  /* ---------- small helpers ---------- */
  function toTop() { var el = document.querySelector('.app'); try { (el && el.scrollHeight > el.clientHeight ? el : window).scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { if (el) el.scrollTop = 0; scrollTo(0, 0); } }
  var toastEl = null;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'shpn-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
  }
  /* instant pressed state on touch (iOS only shows :active with a touch listener; this works everywhere) */
  function press(el) {
    var off = function () { setTimeout(function () { el.classList.remove('pressed'); }, 90); };
    el.addEventListener('pointerdown', function () { el.classList.add('pressed'); }, { passive: true });
    el.addEventListener('pointerup', off, { passive: true }); el.addEventListener('pointercancel', off, { passive: true }); el.addEventListener('pointerleave', off, { passive: true });
  }
  var leaving = false;
  function leave(url, el) {
    if (leaving) return; leaving = true;
    if (el) el.classList.add('busy');
    var f = document.createElement('div'); f.className = 'shpn-leave'; document.body.appendChild(f);
    requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.add('on'); }); });
    setTimeout(function () { location.href = url; }, 190);
  }
  addEventListener('pageshow', function (e) {   /* back from another app (back-forward cache): undo the fade */
    if (!e.persisted) return; leaving = false;
    [].forEach.call(document.querySelectorAll('.shpn-leave'), function (f) { f.remove(); });
    [].forEach.call(document.querySelectorAll('.shpn-app.busy'), function (b) { b.classList.remove('busy'); });
  });

  /* ---------- the app selector ---------- */
  function selector() {
    var w = document.createElement('div'); w.className = 'shpn-apps'; w.setAttribute('role', 'navigation'); w.setAttribute('aria-label', 'Apps');
    APPS.forEach(function (a) {
      var on = a.k === APP, el;
      if (a.ext) { el = document.createElement('a'); el.href = a.url; el.target = '_blank'; el.rel = 'noopener'; }
      else { el = document.createElement('button'); el.type = 'button'; }
      el.className = 'shpn-app' + (on ? ' on' : '') + (a.soon ? ' soon' : ''); el.dataset.shpnApp = a.k;
      el.setAttribute('aria-label', (a.k === 'home' ? 'Smart Home Pros home' : a.n) + (on ? ' (open now)' : a.soon ? ' (coming soon)' : a.ext ? ' (opens in Safari)' : ''));
      if (on) el.setAttribute('aria-current', 'page');
      el.innerHTML = IC[a.k] + '<span>' + a.n + '</span>' + (a.ext ? IC.ext : '') + (a.soon ? '<b class="shpn-soon">Soon</b>' : '');
      press(el);
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        if (a.ext) { setTimeout(close, 250); return; }   /* the link opens Pulse outside the app */
        e.preventDefault();
        if (on) { close(); if (APP === 'home') toTop(); return; }
        if (a.soon) { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); toast(a.soon + ' is coming soon'); return; }
        if (a.k === 'pitch' || a.k === 'recruit') try { localStorage.setItem('shpc_last', a.k); } catch (x) {}
        leave(a.url, el);
      });
      w.appendChild(el);
    });
    return w;
  }

  /* ---------- HOOK for full-screen sheets / modals: the corner hides while one is up ----------
     document.documentElement.classList.toggle('shp-sheet', open), or SHPNav.sheet(open) (counts nested sheets). */
  var sheets = 0;
  function sheet(open) { sheets = Math.max(0, sheets + (open ? 1 : -1)); var on = sheets > 0; if (H.classList.contains('shp-sheet') !== on) H.classList.toggle('shp-sheet', on); }

  /* ---------- close whichever menu is open ---------- */
  function close() {
    if (dw && dw.classList.contains('on')) return shpClose();
    if (APP === 'pitch') { if (typeof window.closeMenu === 'function') window.closeMenu(); return; }
    var x = document.querySelector('.dw .dw-x'); if (x) x.click();
  }

  /* ---------- the corner: hamburger + Vivint logo (SHP page, Fast Recruit) ---------- */
  var corner = null;
  function makeCorner(onMenu, onLogo, logoLabel, mark) {
    corner = document.createElement('div'); corner.className = 'shpn-corner';
    corner.innerHTML = '<button type="button" class="shpn-burger" aria-label="Menu" aria-expanded="false">' + IC.burger + '</button>'
      + '<button type="button" class="shpn-logo" aria-label="' + logoLabel + '">' + (mark || LOGO) + '</button>';
    var b = corner.querySelector('.shpn-burger'), l = corner.querySelector('.shpn-logo');
    press(b); press(l);
    b.addEventListener('click', function (e) { e.stopPropagation(); onMenu(); });
    l.addEventListener('click', function (e) { e.stopPropagation(); onLogo(); });
    document.body.appendChild(corner);
    return corner;
  }
  /* clip-path start: the card opens out of the hamburger */
  function fromBurger(card) {
    if (!corner) return;
    var b = corner.querySelector('.shpn-burger').getBoundingClientRect(), r = card.getBoundingClientRect();
    if (!r.width) return;
    card.style.setProperty('--ct', Math.max(0, b.top - r.top) + 'px'); card.style.setProperty('--cl', Math.max(0, b.left - r.left) + 'px');
    card.style.setProperty('--cr', Math.max(0, r.right - b.right) + 'px'); card.style.setProperty('--cb', Math.max(0, r.bottom - b.bottom) + 'px');
  }

  /* ---------- SHP page: its own menu ---------- */
  var dw = null, lastFocus = null;
  var SEC_IC = {
    links: '<svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
    calls: '<svg viewBox="0 0 24 24"><path d="M5 4h3.5l1.8 4.6-2.3 1.4a11 11 0 0 0 6 6l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    fb: '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/></svg>',
    set: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>',
    top: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>'
  };
  function shpBuild() {
    dw = document.createElement('div'); dw.className = 'shpn-dw'; dw.setAttribute('role', 'dialog'); dw.setAttribute('aria-modal', 'true'); dw.setAttribute('aria-label', 'Menu');
    dw.innerHTML = '<div class="shpn-scrim"></div><nav class="shpn-card"><div class="shpn-h">' + SHPW + '<span class="sub">Smart Home Pros</span>'
      + '<button type="button" class="shpn-x" aria-label="Close menu">' + IC.x + '</button></div></nav>';
    var card = dw.querySelector('.shpn-card');
    card.appendChild(selector());
    var lb = document.createElement('div'); lb.className = 'shpn-lb'; lb.textContent = 'On this page'; card.appendChild(lb);
    var g = document.createElement('div'); g.className = 'shpn-g'; card.appendChild(g);
    var items = [{ k: 'top', n: 'Apps', go: toTop }];
    [].forEach.call(document.querySelectorAll('.more .sec[data-k][data-n]'), function (sec) {
      items.push({ k: sec.dataset.k, n: sec.dataset.n, go: function () { var m = document.querySelector('.more'); if (m && m.classList) m.classList.add('open'); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    });
    items.push({ k: 'set', n: 'Settings', go: function () { if (window.shpcSettings) window.shpcSettings(); else { var gb = document.querySelector('.gear'); if (gb) gb.click(); } } });
    items.forEach(function (it) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'shpn-t'; b.innerHTML = (SEC_IC[it.k] || SEC_IC.top) + '<span>' + it.n + '</span>';
      press(b); b.addEventListener('click', function () { shpClose(); setTimeout(it.go, it.k === 'set' ? 120 : 260); }); g.appendChild(b);
    });
    dw.querySelector('.shpn-scrim').addEventListener('click', shpClose);
    var x = dw.querySelector('.shpn-x'); press(x); x.addEventListener('click', shpClose);
    document.body.appendChild(dw);
  }
  function shpOpen() {
    if (!dw) shpBuild();
    if (dw.classList.contains('on')) return shpClose();
    lastFocus = document.activeElement;
    var card = dw.querySelector('.shpn-card');
    dw.style.visibility = 'visible'; fromBurger(card); dw.style.visibility = '';
    void card.offsetWidth;
    dw.classList.add('on'); H.classList.add('shpn-open'); corner.querySelector('.shpn-burger').setAttribute('aria-expanded', 'true');
    setTimeout(function () { var c = dw.querySelector('.shpn-app.on') || dw.querySelector('.shpn-x'); try { c.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function shpClose() {
    if (!dw || !dw.classList.contains('on')) return;
    fromBurger(dw.querySelector('.shpn-card'));
    dw.classList.remove('on'); H.classList.remove('shpn-open'); corner.querySelector('.shpn-burger').setAttribute('aria-expanded', 'false');
    try { if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }

  /* ---------- Fast Pitch: the selector under its menu header (its drawer is built once, by the page's own script) ---------- */
  /* Fast Pitch nav reserve: a solid band behind the footer, and a spacer at the end of every scrolling page (shpnav.css) */
  function pitchReserve() {
    var st = document.getElementById('stage'); if (!st) return;
    if (!document.getElementById('shpnFoot')) { var f = document.createElement('div'); f.id = 'shpnFoot'; f.setAttribute('aria-hidden', 'true'); st.appendChild(f); }
    var pad = function (pg) {
      [pg].concat([].slice.call(pg.querySelectorAll('*'))).forEach(function (el) {
        if (el.__shpnPad || el.classList.contains('shpn-endpad')) return;
        var cs = getComputedStyle(el); if (!/(auto|scroll)/.test(cs.overflowY) || el.clientHeight < 200 || el.scrollHeight <= el.clientHeight + 4) return;
        el.__shpnPad = 1; var sp = document.createElement('div'); sp.className = 'shpn-endpad'; sp.setAttribute('aria-hidden', 'true'); el.appendChild(sp);
      });
    };
    var pages = document.querySelectorAll('#stage .page');
    var mo = new MutationObserver(function (recs) { recs.forEach(function (r) { var pg = r.target; if (pg.classList.contains('on') && !pg.__shpnSeen) { pg.__shpnSeen = 1; setTimeout(function () { pad(pg); pg.__shpnSeen = 0; }, 700); } }); });
    [].forEach.call(pages, function (pg) { mo.observe(pg, { attributes: true, attributeFilter: ['class'] }); if (pg.classList.contains('on')) setTimeout(function () { pad(pg); }, 900); });
  }
  function mountPitch() {
    var d = document.getElementById('drawer'); if (!d || d.querySelector('.shpn-apps')) return !!d;
    var h = d.querySelector('.m2-h'); if (!h) return false;
    h.after(selector()); return true;
  }

  /* ---------- Fast Recruit: corner + selector in its menu (rebuilt on every open) ---------- */
  var viaCorner = false;
  function frMenu() {
    var open = document.querySelector('.dw');
    if (open) { var x = open.querySelector('.dw-x'); if (x) x.click(); return; }
    viaCorner = true;
    var m = document.querySelector('#phdr .ph-menu');
    if (m) m.click();
    else { var ls = document.querySelectorAll('#frame .layer'), L = ls[ls.length - 1], b = L && L.querySelector('.board [data-x="Menu button"]'); if (b) b.click(); }
    setTimeout(function () { viaCorner = false; }, 0);
  }
  function frHome() {
    var open = document.querySelector('.dw'); if (open) { var x = open.querySelector('.dw-x'); if (x) x.click(); }
    var l = document.querySelector('#phdr .ph-logo');
    if (l && l.getAttribute('src')) { l.click(); return; }
    var ls = document.querySelectorAll('#frame .layer'), L = ls[ls.length - 1], im = L && L.querySelector('.board img[data-name="Vivint Logo"]'); if (im) im.click();
  }
  function frDecorate(m) {
    if (!m || !m.classList || !m.classList.contains('dw') || m.classList.contains('shpn')) return;
    m.classList.add('shpn');
    var inn = m.querySelector('.dw-in'); if (inn && !inn.querySelector('.shpn-apps')) inn.insertBefore(selector(), inn.firstChild);
    var pn = m.querySelector('.dw-panel');
    if (pn && corner) {   /* open out of the corner hamburger (it stays put; the menu card sits above it) */
      m.classList.add('shpn-rv');
      requestAnimationFrame(function () { fromBurger(pn); });
    }
    H.classList.add('shpn-open'); corner && corner.querySelector('.shpn-burger').setAttribute('aria-expanded', 'true');
  }
  function frWatch() {
    /* the menu is added straight to <body> on open and removed on close: watch <body>'s children only (no subtree) */
    var mo = new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var a = recs[i].addedNodes; for (var j = 0; j < a.length; j++) if (a[j].nodeType === 1 && a[j].classList.contains('dw')) frDecorate(a[j]);
        var r = recs[i].removedNodes; for (var k = 0; k < r.length; k++) if (r[k].nodeType === 1 && r[k].classList.contains('dw') && !document.querySelector('.dw')) {
          if (H.classList.contains('shpn-open')) H.classList.remove('shpn-open');
          corner && corner.querySelector('.shpn-burger').setAttribute('aria-expanded', 'false');
        }
      }
    });
    mo.observe(document.body, { childList: true });
    /* the menu closing: its class 'on' goes first (the card animates back into the corner), then it is removed */
    document.addEventListener('click', function (e) { var t = e.target; if (t && t.closest && t.closest('.dw-x, .dw-scrim') && H.classList.contains('shpn-open')) {
      var m = document.querySelector('.dw.shpn-rv .dw-panel'); if (m) fromBurger(m); H.classList.remove('shpn-open'); } }, true);
  }

  /* iPhone held upright: the corner (logo + hamburger) goes to the TOP left, clear of the status bar / Dynamic Island, and the
     menu opens downward from it. iPads and phones held sideways keep it bottom left. html.shpn-top marks the upright phone. */
  function topMode() {
    var ph = Math.min(screen.width || 9999, screen.height || 9999) < 500 || Math.min(innerWidth, innerHeight) < 500;
    var on = ph && innerHeight > innerWidth;
    if (H.classList.contains('shpn-top') !== on) H.classList.toggle('shpn-top', on);
  }
  topMode(); addEventListener('resize', topMode); addEventListener('orientationchange', function () { setTimeout(topMode, 200); });

  function init() {
    if (APP === 'pitch') {
      if (!mountPitch()) { var n = 0, iv = setInterval(function () { if (mountPitch() || ++n > 40) clearInterval(iv); }, 250); }
      pitchReserve();
    } else if (APP === 'recruit') {
      makeCorner(frMenu, frHome, 'Fast Recruit home'); frWatch();
      /* iPad / sideways: the bottom corner steps aside while a page scrolls down, back on the way up or at either end */
      var fq = 0, fe = null, fscr = function () { fq = 0; var el = fe; if (!el || H.classList.contains('shpn-top')) return;
        var y = el.scrollTop, ly = el.__shpnY || 0, max = el.scrollHeight - el.clientHeight, away = H.classList.contains('shpn-away');
        if (y - ly > 6 && y > 40 && y < max - 4) away = true; else if (ly - y > 6 || y <= 40 || y >= max - 4) away = false;
        if (Math.abs(y - ly) > 6 || y <= 40 || y >= max - 4) el.__shpnY = y;
        if (H.classList.contains('shpn-away') !== away) H.classList.toggle('shpn-away', away); };
      document.addEventListener('scroll', function (e) { var t = e.target; if (!t || t.nodeType !== 1 || t.clientHeight < 200) return; fe = t; if (!fq) fq = requestAnimationFrame(fscr); }, { capture: true, passive: true });
      var d0 = document.querySelector('.dw'); if (d0) frDecorate(d0);
    } else {
      /* SHP page (owner): no corner and no menu here. The page's own header (SHP title, announcements bell, settings gear) floats
         at the top instead: pinned while scrolling, frosted once the page moves, clear of the Dynamic Island (nav/shpnav.css).
         A spacer keeps the header's place in the hero so nothing below moves. */
      var brand = document.querySelector('.hero .brand');
      if (brand) {
        var sp = document.createElement('div'); sp.className = 'shpn-hdrsp'; sp.setAttribute('aria-hidden', 'true'); brand.parentNode.insertBefore(sp, brand);
        var fitH = function () { var h = brand.offsetHeight + 'px'; if (sp.style.height !== h) sp.style.height = h; };
        H.classList.add('shpn-float'); fitH(); if (window.ResizeObserver) new ResizeObserver(fitH).observe(brand); addEventListener('resize', fitH);
      }
      var app = document.querySelector('.app'), sq = 0, scr = function () { sq = 0;
        var on = Math.max(window.scrollY || 0, app ? app.scrollTop : 0) > 8;
        if (H.classList.contains('shpn-scrolled') !== on) H.classList.toggle('shpn-scrolled', on); };
      var onS = function () { if (!sq) sq = requestAnimationFrame(scr); };
      addEventListener('scroll', onS, { passive: true }); if (app) app.addEventListener('scroll', onS, { passive: true }); scr();
      /* the SHP page's Settings sheet: hide the corner while it is up (attribute writes only when the state differs) */
      /* (also the story viewer, the announcements grid, the quick-links drawer and the event panel: all toggle .on) */
      [].forEach.call(document.querySelectorAll('.sheet, .story, .annx, .drawer, .evp'), function (st) {
        var sync = function () { var on = st.classList.contains('on'); if (!!st.__shpn !== on) { st.__shpn = on; sheet(on); } };
        new MutationObserver(sync).observe(st, { attributes: true, attributeFilter: ['class'] }); sync(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.SHPNav = { app: APP, root: ROOT, selector: selector, close: close, toast: toast, sheet: sheet,
    open: function () { if (APP === 'home') shpOpen(); else if (APP === 'recruit') frMenu(); else if (typeof window.openMenu === 'function') window.openMenu(); } };
})();
