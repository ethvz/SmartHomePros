/* iPhone portrait (html.pp) behaviour: shell group. Only act when document.documentElement.classList.contains("pp"). */
(function () {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const PP = () => document.documentElement.classList.contains('pp');
  const st = $('#stage'), bar = $('#bar'), rail = $('#barRight');
  if (!st || !bar || !rail) return;

  /* ---- footer geometry: lift the controls clear of the home indicator (stage px) ---- */
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  let geo = '';
  function setGeo() {
    if (!PP()) { if (geo) { ['--ppB', '--ppFoot', '--ppHomeFoot'].forEach(k => st.style.removeProperty(k)); geo = ''; } return; }
    const sc = (st.getBoundingClientRect().width / st.offsetWidth) || 1, sab = probe.offsetHeight / sc;
    const B = Math.round(Math.max(8, 6 + sab * 0.6)), sig = B + '';
    if (sig === geo) return; geo = sig;
    st.style.setProperty('--ppB', B + 'px'); st.style.setProperty('--ppFoot', (B + 76) + 'px'); st.style.setProperty('--ppHomeFoot', (B + 76) + 'px');   /* Home footer: one row now */
    tourInset();
  }

  /* ---- Home: All Products grid re-cut for an upright screen ----
     4 columns: Outdoor Camera | Spotlight, then Doorbell, Indoor, Smart Hub; then 3 rows of 5 smaller tiles */
  function ppGrid(Wd, Ht) {
    const G = 12, X0 = 16, Y0 = 84,   /* Y0: below the top corner (--ppNavT) */ Y1 = Ht - 10, w = Wd - 2 * X0, c4 = (w - 3 * G) / 4, c5 = (w - 4 * G) / 5, P = {};
    const avail = Y1 - Y0, sh = Math.round(Math.min(c5 / 0.74, (avail - 4 * G) * 0.2)), big = (avail - 3 * sh - 4 * G) / 2;
    P.ocp = [X0, Y0, 2 * c4 + G, big]; P.ocspot = [X0 + 2 * (c4 + G), Y0, 2 * c4 + G, big];
    const y2 = Y0 + big + G;
    P.dbcp = [X0, y2, c4, big]; P.icp = [X0 + c4 + G, y2, c4, big]; P.shp2 = [X0 + 2 * (c4 + G), y2, 2 * c4 + G, big];
    const y3 = y2 + big + G;
    [['keypad', 'app', 'lock', 'garage', 'therm'], ['plug', 'motion', 'glass', 'window', 'water'], ['smokeco', 'fire', 'pendant', 'fob', 'chime']]
      .forEach((r, ri) => r.forEach((k, ci) => P[k] = [X0 + ci * (c5 + G), y3 + ri * (sh + G), c5, sh]));
    return P;
  }
  function ppHome() {
    if (!PP()) return;
    const pane = $('#homeAll'), Ht = (pane && pane.offsetHeight) || (window.SH - 160);
    const P = ppGrid(600, Ht);
    $$('#allTiles .ht[data-k]').forEach(el => { const r = P[el.dataset.k]; if (!r) return; const [x, y, w, h] = r;
      Object.assign(el.style, { left: x.toFixed(1) + 'px', top: y.toFixed(1) + 'px', width: w.toFixed(1) + 'px', height: h.toFixed(1) + 'px' }); });
  }
  const _hl = window.homeLayout;
  if (_hl) window.homeLayout = function () { _hl.apply(this, arguments); setGeo(); ppHome(); };

  /* ---- Home button: every page but Home gets the Vivint house mark beside the burger (data-home = the logo's own action) ---- */
  if (!$('#ppHome')) {
    const burger = $('#burger');
    const hb = document.createElement('button');
    hb.id = 'ppHome'; hb.type = 'button'; hb.dataset.home = '1'; hb.setAttribute('aria-label', 'Home');
    hb.innerHTML = '<svg viewBox="1296 38 350 350" fill="currentColor" aria-hidden="true"><circle cx="1343.07" cy="342.6" r="39.6"/>' +
      '<path d="M1462.07 45l-155.72 141.25v52.92c57.67-20.1 120.93 9.9 141.22 67 4.19 11.7 6.32 24.03 6.32 36.43 0 12.74-2.26 24.93-6.32 36.34h134.03c20.02 0 36.25-16.04 36.25-35.84v-156.85L1462.07 45z"/></svg><span>Home</span>';
    (burger && burger.parentNode === bar) ? burger.after(hb) : bar.prepend(hb);
    /* instant press feedback (the tap itself is handled by the page's own [data-home] delegation) */
    hb.addEventListener('pointerdown', () => { hb.classList.add('pressed'); setTimeout(() => hb.classList.remove('pressed'), 180); }, { passive: true });
  }

  /* ---- top corner shade: content scrolling under the burger + logo (top left) never fights them ---- */
  if (!$('#ppTopShade')) { const sh = document.createElement('div'); sh.id = 'ppTopShade'; sh.setAttribute('aria-hidden', 'true'); st.appendChild(sh); }

  /* ---- section nav: along the footer instead of a side rail ---- */
  let busy = false;
  function navMode() {
    if (busy) return; busy = true;
    try {
      const pp = PP(), home = bar.classList.contains('home'), items = [...rail.children].filter(e => e.matches('.bbtn') && e.id !== 'amtBtn');
      const flat = pp && !home && rail.classList.contains('pnav') && !bar.classList.contains('hx-ctr') && items.length > 0;
      if (rail.classList.contains('pph') !== flat) rail.classList.toggle('pph', flat);
      /* the pill is 502 wide (492 inside): up to 7 named tabs; more = fixed 58px icon tabs that scroll sideways */
      const ico = flat && items.length > 7;
      if (rail.classList.contains('ico') !== ico) rail.classList.toggle('ico', ico);
      if (bar.classList.contains('ppnav') !== flat) bar.classList.toggle('ppnav', flat);
      if (bar.classList.contains('ppnologo')) bar.classList.remove('ppnologo');
    } finally { busy = false; }
    railView();
  }

  /* scrolling nav: keep the current tab in view (smoothly, only when it changes) and fade the edge(s) where tabs hide.
     Only inline style / scrollLeft are written here (no class or attribute the observers watch). */
  let lastOn = null;
  function railFade() {
    const sc = rail.classList.contains('pph') && rail.classList.contains('ico'), max = rail.scrollWidth - rail.clientWidth;
    const l = sc && rail.scrollLeft > 2 ? '28px' : '0px', r = sc && rail.scrollLeft < max - 2 ? '28px' : '0px';
    if (rail.style.getPropertyValue('--ppFL') !== l) rail.style.setProperty('--ppFL', l);
    if (rail.style.getPropertyValue('--ppFR') !== r) rail.style.setProperty('--ppFR', r);
  }
  function railView(force) {
    const sc = rail.classList.contains('pph') && rail.classList.contains('ico');
    if (!sc) { if (rail.scrollLeft) rail.scrollLeft = 0; lastOn = null; railFade(); return; }
    const on = rail.querySelector('.bbtn.on');
    if (on && (on !== lastOn || force)) {
      const first = lastOn === null; lastOn = on;
      const want = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, on.offsetLeft + on.offsetWidth / 2 - rail.clientWidth / 2));
      if (Math.abs(rail.scrollLeft - want) > 1) {
        const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
        rail.scrollTo({ left: want, behavior: first || rm ? 'auto' : 'smooth' });
      }
    }
    railFade();
  }
  rail.addEventListener('scroll', railFade, { passive: true });
  new MutationObserver(() => railView()).observe(rail, { subtree: true, attributes: true, attributeFilter: ['class'] });
  new MutationObserver(navMode).observe(rail, { childList: true, attributes: true, attributeFilter: ['class'] });
  new MutationObserver(navMode).observe(bar, { attributes: true, attributeFilter: ['class'] });

  /* drag along the footer nav to fly through the sections (taps still tap); a scrolling nav scrolls instead */
  let drag = null;
  const itemAt = x => { const its = [...rail.querySelectorAll('.bbtn')]; let best = null, bd = 1e9;
    its.forEach(b => { const r = b.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - x); if (d < bd) { bd = d; best = b; } }); return best; };
  rail.addEventListener('touchstart', e => { if (!rail.classList.contains('pph') || rail.classList.contains('ico') || e.touches.length !== 1) return; drag = { x0: e.touches[0].clientX, on: false, last: null }; }, { passive: true });
  rail.addEventListener('touchmove', e => { if (!drag) return; const x = e.touches[0].clientX;
    if (!drag.on && Math.abs(x - drag.x0) > 8) drag.on = true;
    if (!drag.on) return; e.preventDefault();
    const b = itemAt(x); if (b && b !== drag.last) { drag.last = b; rail.querySelectorAll('.bbtn.near').forEach(n => n.classList.remove('near')); b.classList.add('near'); b.click(); } }, { passive: false });
  const endDrag = () => { if (!drag) return; const was = drag.on; drag = null; rail.querySelectorAll('.bbtn.near').forEach(n => n.classList.remove('near'));
    if (was) { const kill = e => { e.stopPropagation(); e.preventDefault(); }; window.addEventListener('click', kill, true); setTimeout(() => window.removeEventListener('click', kill, true), 350); } };
  rail.addEventListener('touchend', endDrag); rail.addEventListener('touchcancel', endDrag);

  /* ---- 3D Home: the tour keeps its own controls clear of our (taller) footer ---- */
  function tourInset() {
    const f = $('#tour3d iframe'); if (!f) return;
    try { const d = f.contentDocument && f.contentDocument.documentElement; if (!d) return;
      if (PP()) d.style.setProperty('--fb', (parseFloat(getComputedStyle(st).getPropertyValue('--ppHomeFoot')) || 160) + 'px');
      else d.style.setProperty('--fb', '76px'); } catch (e) {}
  }
  const t3 = $('#tour3d');
  if (t3) new MutationObserver(() => { const f = $('#tour3d iframe'); if (f && !f.__pp) { f.__pp = 1; f.addEventListener('load', tourInset); } tourInset(); }).observe(t3, { childList: true });

  /* big tiles whose names are baked into the artwork (too small upright): the baked line is clipped off in CSS and a live label added */
  /* where the baked name sits in each artwork: cut below (fraction of the picture's height) or above */
  const BAKED = { 'tiles/ocp.webp': ['b', .855], 'tiles/ocspot.webp': ['b', .905], 'tiles/shp2_cam.webp': ['b', .905], 'tiles/keypad.webp': ['t', .09], 'tiles/app.webp': ['t', .09] };
  const BIGN = { ocp: 'Outdoor Camera Pro III', ocspot: 'Outdoor Camera Pro III with Spotlight', keypad: 'Keypad', app: 'Vivint App', shp2: 'Smart Hub Pro II' };
  const bakedOf = im => { const s = im.getAttribute('src') || ''; for (const k in BAKED) if (s.indexOf(k) >= 0) return BAKED[k]; return null; };
  /* clip the baked line off the picture as drawn (object-fit:contain leaves bands, so work in element px) */
  function clipBaked(im) {
    const b = bakedOf(im); if (!b) return;
    let want = '';
    if (PP() && im.naturalWidth && im.clientWidth) {
      const W = im.clientWidth, H = im.clientHeight, k = Math.min(W / im.naturalWidth, H / im.naturalHeight), h = im.naturalHeight * k, top = (H - h) / 2;
      want = b[0] === 'b' ? `inset(0 0 ${Math.max(0, H - (top + h * b[1])).toFixed(1)}px 0)` : `inset(${(top + h * b[1]).toFixed(1)}px 0 0 0)`;
    }
    if (im.style.clipPath !== want) im.style.clipPath = want;
  }
  const ro = new ResizeObserver(es => es.forEach(e => clipBaked(e.target)));
  function bigLabels() {
    $$('#allTiles .ht[data-k], .hcat .ht[data-k]').forEach(t => { const im = t.querySelector(':scope>img'); if (!im) return; const b = bakedOf(im); if (!b) return;
      if (!im.__ppc) { im.__ppc = 1; ro.observe(im); im.addEventListener('load', () => clipBaked(im)); }
      clipBaked(im);
      if (t.querySelector(':scope>.ppcl')) return;
      const d = document.createElement('div'); d.className = 'cl ppcl' + (b[0] === 't' ? ' top' : ''); d.textContent = BIGN[t.dataset.k] || ''; t.appendChild(d); });
  }

  /* Keypad and Vivint App: their landscape tiles run off the bottom edge (cut off in a small upright tile).
     Add the whole product (the same kind of cut-out the other tiles use) + a live name; CSS shows them only in pp */
  function wholeTiles() {
    $$('#allTiles .ht[data-k], .hcat .ht[data-k]').forEach(t => {
      const k = t.dataset.k;
      if (!WHOLE[k] || t.querySelector(':scope>.ppalt')) return;
      t.insertAdjacentHTML('beforeend', '<img class="cp ppalt pp-' + k + '" src="assets/cat/' + k + '.webp?v=176" alt="" draggable="false"><div class="cl ppalt">' + BIGN[k] + '</div>');
    });
    /* short names on the small All-grid tiles (pp only, via CSS attr()) */
    $$('#allTiles .ht[data-k] > .cl:not(.ppalt)').forEach(c => { const n = SHORT[c.parentNode.dataset.k]; if (n && c.dataset.pps !== n) c.dataset.pps = n; });
  }
  /* tiles shown as the whole cut-out product in pp (their landscape artwork bleeds off an edge, or carries a baked name) */
  const WHOLE = { keypad: 1, app: 1, ocp: 1, ocspot: 1 };
  const SHORT = { therm: 'Thermostat', glass: 'Glass Break', window: 'Door/Window' };

  function all() { setGeo(); ppHome(); navMode(); tourInset(); bigLabels(); wholeTiles(); }
  addEventListener('resize', () => { all(); setTimeout(all, 320); });
  addEventListener('orientationchange', () => setTimeout(all, 350));
  new MutationObserver(() => { navMode(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  all(); setTimeout(all, 400); setTimeout(all, 1200);
})();
