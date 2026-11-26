/* iPad portrait (html.ipp) behaviour: brand group. Only act when document.documentElement.classList.contains("ipp"). */
(() => {
  const D = document, H = D.documentElement, $ = (s, r = D) => r.querySelector(s), $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const ipp = () => H.classList.contains('ipp');
  const gv = $('#p-gives');

  /* Gives Back: pp/brand.js builds .gvp (photo box + headline + stats card) for every layout; here it is cover-cropped
     for the upright iPad: the art's right half (kids + cat), faces a little above the middle of the photo box */
  const gvLayout = () => { const box = gv && $('.gvp-ph', gv), im = box && $('.gvp-img', box); if (!im || !ipp()) return;
    const w = box.offsetWidth, h = box.offsetHeight; if (!w || !h) return;
    const RX = 1184, RW = 880, IH = 1446, IW = 2064, s = Math.max(w / RW, h / IH);
    const ox = Math.max(0, Math.min(RW * s - w, (RW * s - w) * 0.5)), oy = Math.max(0, Math.min(IH * s - h, 640 * s - h * 0.45));
    const tf = `translate(${-(RX * s + ox)}px,${-oy}px)`;
    if (im.style.transform !== tf) Object.assign(im.style, { width: IW * s + 'px', height: IH * s + 'px', transform: tf }); };
  const count = el => { const n = +el.dataset.n, pre = el.dataset.pre, suf = el.dataset.suf, t0 = performance.now(), T = 1300;
    const f = t => { const k = Math.min(1, (t - t0) / T), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + Math.round(n * e).toLocaleString('en-US') + suf; if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f); };

  /* keep the yard-sign scroller on the right slide after the height changes (rotation) */
  const signFix = () => { const sc = $('#p-sign .sgn-sc'); if (sc && typeof signHouse !== 'undefined') { const y = signHouse ? sc.clientHeight : 0; if (Math.abs(sc.scrollTop - y) > 2) sc.scrollTop = y; } };

  const lay = () => { if (!ipp()) return; gvLayout(); signFix(); };
  addEventListener('resize', () => setTimeout(lay, 90));
  addEventListener('orientationchange', () => setTimeout(lay, 260));

  /* Gives: lay out + count up when the page opens (pp/brand.js only counts in pp). The observer only reads the class. */
  let gvOn = false;
  if (gv) new MutationObserver(() => { const on = gv.classList.contains('on'); if (on && !gvOn && ipp()) { requestAnimationFrame(gvLayout); $$('.gvp-g b', gv).forEach(count); } gvOn = on; })
    .observe(gv, { attributes: true, attributeFilter: ['class'] });
  lay(); setTimeout(lay, 500);
})();
