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
    st.style.setProperty('--ppB', B + 'px'); st.style.setProperty('--ppFoot', (B + 68) + 'px'); st.style.setProperty('--ppHomeFoot', (B + 140) + 'px');
    tourInset();
  }

  /* ---- Home: All Products grid re-cut for an upright screen ----
     4 columns: Outdoor Camera | Spotlight, then Doorbell, Indoor, Smart Hub; then 3 rows of 5 smaller tiles */
  function ppGrid(Wd, Ht) {
    const G = 12, X0 = 16, Y0 = 50, Y1 = Ht - 10, w = Wd - 2 * X0, c4 = (w - 3 * G) / 4, c5 = (w - 4 * G) / 5, P = {};
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
    const pane = $('#homeAll'), Ht = (pane && pane.offsetHeight) || (window.SH - 148);
    const P = ppGrid(600, Ht);
    $$('#allTiles .ht[data-k]').forEach(el => { const r = P[el.dataset.k]; if (!r) return; const [x, y, w, h] = r;
      Object.assign(el.style, { left: x.toFixed(1) + 'px', top: y.toFixed(1) + 'px', width: w.toFixed(1) + 'px', height: h.toFixed(1) + 'px' }); });
    $$('#allTiles .ht.small').forEach(e => e.classList.remove('small'));
    Object.keys(P).forEach(k => { const r = P[k]; if (r[2] < 140) { const e = $('#allTiles .ht[data-k="' + k + '"]'); if (e) e.classList.add('small'); } });
  }
  const _hl = window.homeLayout;
  if (_hl) window.homeLayout = function () { _hl.apply(this, arguments); setGeo(); ppHome(); };

  /* ---- section nav: along the footer instead of a side rail ---- */
  let busy = false;
  function navMode() {
    if (busy) return; busy = true;
    try {
      const pp = PP(), home = bar.classList.contains('home'), items = [...rail.children].filter(e => e.matches('.bbtn') && e.id !== 'amtBtn');
      const flat = pp && !home && rail.classList.contains('pnav') && !bar.classList.contains('hx-ctr') && items.length > 0;
      if (rail.classList.contains('pph') !== flat) rail.classList.toggle('pph', flat);
      const ico = flat && (432 / Math.max(1, items.length)) < 66;
      if (rail.classList.contains('ico') !== ico) rail.classList.toggle('ico', ico);
      if (bar.classList.contains('ppnav') !== flat) bar.classList.toggle('ppnav', flat);
    } finally { busy = false; }
  }
  new MutationObserver(navMode).observe(rail, { childList: true, attributes: true, attributeFilter: ['class'] });
  new MutationObserver(navMode).observe(bar, { attributes: true, attributeFilter: ['class'] });

  /* drag along the footer nav to fly through the sections (taps still tap) */
  let drag = null;
  const itemAt = x => { const its = [...rail.querySelectorAll('.bbtn')]; let best = null, bd = 1e9;
    its.forEach(b => { const r = b.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - x); if (d < bd) { bd = d; best = b; } }); return best; };
  rail.addEventListener('touchstart', e => { if (!rail.classList.contains('pph') || e.touches.length !== 1) return; drag = { x0: e.touches[0].clientX, on: false, last: null }; }, { passive: true });
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
      if (PP()) d.style.setProperty('--fb', (parseFloat(getComputedStyle(st).getPropertyValue('--ppHomeFoot')) || 148) + 'px');
      else d.style.setProperty('--fb', '76px'); } catch (e) {}
  }
  const t3 = $('#tour3d');
  if (t3) new MutationObserver(() => { const f = $('#tour3d iframe'); if (f && !f.__pp) { f.__pp = 1; f.addEventListener('load', tourInset); } tourInset(); }).observe(t3, { childList: true });

  function all() { setGeo(); ppHome(); navMode(); tourInset(); }
  addEventListener('resize', () => { all(); setTimeout(all, 320); });
  addEventListener('orientationchange', () => setTimeout(all, 350));
  new MutationObserver(() => { navMode(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  all(); setTimeout(all, 400); setTimeout(all, 1200);
})();
