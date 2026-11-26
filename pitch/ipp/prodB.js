/* iPad portrait (html.ipp) behaviour: prodB group. Only act when document.documentElement.classList.contains("ipp"). */
(() => {
  const D = document, Q = s => D.querySelector(s);
  const isIPP = () => D.documentElement.classList.contains('ipp');
  const sv = (k, d) => { const st = Q('#stage'), v = st ? parseFloat(getComputedStyle(st).getPropertyValue(k)) : NaN; return isFinite(v) ? v : d; };
  const top0 = () => sv('--ippT', 96), foot = () => sv('--ippFoot', 84);
  const setP = (el, k, v) => { if (el && el.style.getPropertyValue(k) !== v) el.style.setProperty(k, v); };
  const setI = (el, k, v) => { if (el && (el.style.getPropertyValue(k) !== v || el.style.getPropertyPriority(k) !== 'important')) el.style.setProperty(k, v, 'important'); };
  const unset = (el, ...ks) => ks.forEach(k => { if (el && el.style.getPropertyValue(k)) el.style.removeProperty(k); });

  /* ---------- 360 spin: the landscape frame scaled to cover the upright screen ---------- */
  function spinFit() { const v = ((window.SH || 1485) / 1032).toFixed(4); ['#ocScroll', '#dbScroll'].forEach(q => setP(Q(q), '--spk', v)); }

  /* ---------- hero gallery photos + DBCP hero video: cropped so the product sits in the middle of the upright screen.
     FOC = the product's x centre as a fraction of each source picture ---------- */
  const FOC = { ocp: [.59, .75, .33, .70, .29, .66, .335], dbcp: [.585, .67, .60, .69, .60, .41, .71] };
  function focusOne(el, f, nw, nh, fw, fh) {
    if (!isIPP()) { if (el.__ippF) { el.__ippF = 0; el.style.removeProperty('object-position'); } return; }
    if (!nw || !nh || f == null) return;
    const k = Math.max(fw / nw, fh / nh), Wi = nw * k; if (Wi - fw < 1) return;
    const v = (Math.max(0, Math.min(1, (f * Wi - fw / 2) / (Wi - fw))) * 100).toFixed(1) + '% 50%';
    el.__ippF = 1; if (el.style.objectPosition !== v) el.style.objectPosition = v;
  }
  function galFocus() {
    const H = window.SH || 1485, cx = 1032;
    [['#ocScroll', 'ocp'], ['#dbScroll', 'dbcp']].forEach(([q, k]) => { const box = Q(q); if (!box) return;
      box.querySelectorAll('.hgl figure img').forEach((im, i) => {
        if (!im.__ippL) { im.__ippL = 1; im.addEventListener('load', () => focusOne(im, FOC[k][i], im.naturalWidth, im.naturalHeight, cx, window.SH || 1485)); }
        focusOne(im, FOC[k][i], im.naturalWidth, im.naturalHeight, cx, H); }); });
    const v = Q('#dbHv'); if (v) { if (!v.__ippL) { v.__ippL = 1; v.addEventListener('loadedmetadata', galFocus); } focusOne(v, .6, v.videoWidth || 1376, v.videoHeight || 1032, cx, H - foot() - 330); }
  }


  /* ---------- OCP / DBCP Highlights: media band between the heading and the 3-column list ---------- */
  function featLayout() {
    if (!isIPP()) return;
    [['#ocScroll', '#ocmPhone', '#ocmList', 920], ['#dbScroll', '#dbmPhone', '#dbmList', 372]].forEach(([bq, pq, lq, pw]) => {
      const box = Q(bq), ph = Q(pq), L = Q(lq); if (!box || !ph || !L) return;
      const sec = L.closest('.otab'), H = window.SH || 1485, pf = foot(), T = top0();
      const rows = Math.ceil(L.children.length / 3), bh = 58, listH = rows * bh + (rows - 1) * 6;
      const head = T + 214;
      /* 24/7 tab: the storage caption gets its own strip under the heading, and the band starts below it */
      const cap = sec.querySelector('.dbm-cap'), hd = sec.querySelector('.dbm-h'); let mt = head, capT = 0;
      if (cap && hd && cap.classList.contains('on')) { capT = hd.offsetTop + hd.offsetHeight + 18; mt = Math.max(head, capT + cap.offsetHeight + 22); }
      const mh = Math.max(320, H - pf - 18 - listH - 26 - mt), bw = 1032 - 96 - 30;
      let phs, phh;
      if (pw === 920) { const port = ph.classList.contains('port'); phs = port ? Math.min(mh / 732, 1.1) : Math.min(.86, bw / 920); phh = port ? 732 * phs : 454 * phs; }
      else { phs = Math.min(mh / 748, 1.12); phh = 748 * phs; }
      const v = { '--capT': capT + 'px', '--lbh': bh + 'px', '--mt': mt + 'px', '--mh': mh + 'px', '--phs': phs.toFixed(4), '--phh': phh.toFixed(1) + 'px' };
      if (pw === 372) { const pl = 96 + 44; v['--pl'] = pl + 'px'; v['--cl'] = (pl + 188 * phs).toFixed(1) + 'px'; v['--ct'] = Math.max(mt - 70 * phs, mt + phh / 2 - 482 * phs).toFixed(1) + 'px';
        /* balance() pins these inline with !important: put ours back (only when different, so the watcher settles) */
        setI(ph, 'left', pl + 'px'); const c = Q('#dbmCap'); setI(c, 'transform', 'none'); }
      Object.entries(v).forEach(([k, x]) => setP(sec, k, x));
    });
  }
  /* the page's own balance() re-places these with inline styles: lay ours out again whenever it does (writes go to the tab, not the watched nodes) */
  function featWatch() {
    ['#dbmPhone', '#dbmCap', '#ocmPhone', '#ocmCap'].forEach(q => { const el = Q(q); if (!el || el.__ippw) return; el.__ippw = 1;
      new MutationObserver(() => { if (isIPP()) featLayout(); }).observe(el, { attributes: true, attributeFilter: ['class', 'style'] }); });
    ['#ocmH', '#dbmH'].forEach(q => { const el = Q(q); if (!el || el.__ippw) return; el.__ippw = 1;
      new MutationObserver(() => { if (isIPP()) requestAnimationFrame(featLayout); }).observe(el, { childList: true }); });
  }


  /* ---------- OCP vs Arlo: a second, synced copy of the split clip so each half gets its own full-width row ---------- */
  function arloTwin() {
    const v = Q('#ocArloVid'); if (!v) return; let t = Q('#ocArloVid3');
    if (!isIPP()) { if (t && !t.paused) t.pause(); return; }
    if (!t) { t = v.cloneNode(false); t.id = 'ocArloVid3'; t.removeAttribute('style'); t.muted = true; t.setAttribute('aria-hidden', 'true'); v.after(t);
      const sync = () => { if (!isIPP()) return; if (Math.abs(t.currentTime - v.currentTime) > .12) { try { t.currentTime = v.currentTime; } catch (e) {} }
        if (v.paused !== t.paused) v.paused ? t.pause() : t.play().catch(() => {}); };
      ['play', 'pause', 'seeked', 'timeupdate'].forEach(ev => v.addEventListener(ev, sync)); }
    if (!t.getAttribute('src') && v.currentSrc) t.src = v.currentSrc;
  }


  /* ---------- Smart Actions: an oversized product render rises from the bottom-right edge under the list ---------- */
  function actBleed() {
    [['#ocScroll', 'assets/och/c0.webp?v=87'], ['#dbScroll', 'assets/db/dbcp_a1.webp?v=55']].forEach(([q, src]) => {
      const sec = Q(q + '>[data-t=act]'); if (!sec || sec.querySelector('.ippBleed')) return;
      const im = D.createElement('img'); im.className = 'ippBleed'; im.alt = ''; im.decoding = 'async'; im.loading = 'lazy'; im.src = src; im.draggable = false;
      sec.insertBefore(im, sec.firstChild); });
  }

  function featClear() {
    const ph = Q('#dbmPhone'); if (ph && ph.style.getPropertyValue('left') === '140px') ph.style.removeProperty('left');
    const c = Q('#dbmCap'); if (c && c.style.getPropertyValue('transform') === 'none') c.style.removeProperty('transform');
  }
  function layout() { galFocus(); arloTwin(); if (!isIPP()) { featClear(); return; } spinFit(); featLayout(); }
  function galEager(sec) { sec.querySelectorAll('.hgl img[loading=lazy]').forEach(im => { im.loading = 'eager'; }); }
  function secWatch() { ['#p-ocp', '#p-dbcp'].forEach(q => { const el = Q(q); if (!el || el.__ippo) return; el.__ippo = 1;
    /* writes only to children / other elements, never to the observed page's class */
    new MutationObserver(() => { if (isIPP() && el.classList.contains('on')) { requestAnimationFrame(layout); galEager(el); } }).observe(el, { attributes: true, attributeFilter: ['class'] }); }); }
  function boot() { actBleed(); secWatch(); featWatch(); layout(); }
  let raf = 0; const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => requestAnimationFrame(layout)); };
  addEventListener('resize', later); addEventListener('orientationchange', () => setTimeout(later, 300));
  if (window.visualViewport) visualViewport.addEventListener('resize', later);
  new MutationObserver(later).observe(D.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
  addEventListener('load', () => { boot(); later(); });
})();
