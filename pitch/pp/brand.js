/* iPhone portrait (html.pp) behaviour: brand group. Only act when document.documentElement.classList.contains("pp"). */
(() => {
  const D = document, H = D.documentElement, $ = (s, r = D) => r.querySelector(s), $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const pp = () => H.classList.contains('pp');
  const st = $('#stage'), scr = $('#screen');

  /* Brand sections sit at the stage's left edge in pp. #screen is offset by --gx (negative in pp), so measure it
     instead of assuming, in case the shell group moves #screen. */
  const offset = () => { if (!st || !scr) return; st.style.setProperty('--brx', (-scr.offsetLeft) + 'px'); };

  /* Safe area at the top, in stage px (the stage is scaled to the screen) */
  const probe = D.createElement('div'); probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);pointer-events:none;visibility:hidden';
  D.body.appendChild(probe);
  const safe = () => { if (!st) return; const k = st.getBoundingClientRect().width / (st.offsetWidth || 600) || 1;
    st.style.setProperty('--brsat', Math.round(probe.offsetHeight / k) + 'px'); };

  /* ===== Vivint Gives Back: rebuilt from the art's parts (photo crop + live stats) ===== */
  const gv = $('#p-gives');
  const ICON = {
    heart: '<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-4 3.8-6.2 7.5-6.2s6.7 2.2 7.5 6.2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l2.5 2.5"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M14 9.5h-2.6a1.3 1.3 0 0 0 0 2.6h1.2a1.3 1.3 0 0 1 0 2.6H10M12 8.5v1M12 14.7v1"/>' };
  const STATS = [['heart', 530310, '', '', 'People Impacted'], ['user', 73223, '', '', 'Volunteers'], ['clock', 331945, '', '', 'Hours'], ['cash', 35, '$', 'M', 'Raised']];
  if (gv && !$('.gvp', gv)) {
    gv.insertAdjacentHTML('beforeend', `<div class="gvp" aria-hidden="true">
      <div class="gvp-ph"><div class="gvp-img"></div></div>
      <div class="gvp-hd"><div class="gvp-eb">Vivint Gives Back</div><h1>$35M<br>Donated</h1><i class="gvp-heart"></i></div>
      <div class="gvp-cd"><div class="gvp-t">Vivint Gives Back at a glance</div><div class="gvp-g">${STATS.map(s =>
        `<div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON[s[0]]}</svg><b data-n="${s[1]}" data-pre="${s[2]}" data-suf="${s[3]}">${s[2]}${s[1].toLocaleString('en-US')}${s[3]}</b><span>${s[4]}</span></div>`).join('')}</div></div></div>`);
  }
  /* cover-crop the art's right half (the kids + cat) into the photo box, faces kept in view */
  const gvLayout = () => { const box = gv && $('.gvp-ph', gv), im = box && $('.gvp-img', box); if (!im || !pp()) return;
    const w = box.offsetWidth, h = box.offsetHeight; if (!w || !h) return;
    const RX = 1184, RW = 880, IH = 1446, IW = 2064, s = Math.max(w / RW, h / IH);
    const ox = Math.max(0, Math.min(RW * s - w, (RW * s - w) * 0.55)), oy = Math.max(0, Math.min(IH * s - h, 610 * s - h * 0.42));
    Object.assign(im.style, { width: IW * s + 'px', height: IH * s + 'px', transform: `translate(${-(RX * s + ox)}px,${-oy}px)` }); };
  const count = el => { const n = +el.dataset.n, pre = el.dataset.pre, suf = el.dataset.suf, t0 = performance.now(), T = 1300;
    const f = t => { const k = Math.min(1, (t - t0) / T), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + Math.round(n * e).toLocaleString('en-US') + suf; if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f); };

  /* ===== Yard sign: cut-out sign over a soft backdrop (the photo sign is far wider than an upright screen) ===== */
  const s1 = $('#p-sign .sgn-s');
  if (s1 && !$('.sgn-pp', s1)) s1.insertAdjacentHTML('beforeend', '<img class="sgn-pp" src="assets/ph/sign_r.webp?v=229" alt="" draggable="false">');

  /* keep the sign scroller on the right slide after a height change */
  const signFix = () => { const sc = $('#p-sign .sgn-sc'); if (sc && typeof signHouse !== 'undefined') sc.scrollTop = signHouse ? sc.clientHeight : 0; };

  const lay = () => { offset(); safe(); if (!pp()) return; gvLayout(); };
  let was = pp();
  addEventListener('resize', () => setTimeout(() => { lay(); if (pp() !== was) { was = pp(); signFix(); } else if (pp()) signFix(); }, 80));
  addEventListener('orientationchange', () => setTimeout(lay, 250));

  /* re-run when a brand page opens */
  const watch = (el, fn) => el && new MutationObserver(() => { if (el.classList.contains('on')) fn(); }).observe(el, { attributes: true, attributeFilter: ['class'] });
  let gvOn = false;
  if (gv) new MutationObserver(() => { const on = gv.classList.contains('on'); if (on && !gvOn) { lay(); if (pp()) $$('.gvp-g b', gv).forEach(count); } gvOn = on; }).observe(gv, { attributes: true, attributeFilter: ['class'] });
  ['#p-about', '#p-map', '#p-sign', '#p-history', '#p-install', '#p-awards', '#p-videos'].forEach(s => watch($(s), lay));
  lay(); requestAnimationFrame(lay);
})();
