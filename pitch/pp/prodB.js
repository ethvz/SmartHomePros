/* iPhone portrait (html.pp) behaviour: prodB group. Only act when document.documentElement.classList.contains("pp"). */
(() => {
  const D = document, Q = s => D.querySelector(s);
  const isPP = () => D.documentElement.classList.contains('pp');
  const avail = () => { const st = Q('#stage'), f = st ? parseFloat(getComputedStyle(st).getPropertyValue('--ppFoot')) : NaN; return (window.SH || 1230) - (isFinite(f) ? f : 76); };          /* stage px between the top safe edge and the footer */

  /* ---------- AI wheel: the landscape wheel re-drawn as a tall ellipse of bubbles cut from the same artwork ---------- */
  const AIK = ['vprotect', 'comfort', 'sound', 'package', 'vehicle', 'aivideo', 'holiday', 'homehighlights', 'person', 'faces', 'spotlight', 'deter'];
  const AIXY = { person: [348, 632], homehighlights: [470, 780], holiday: [660, 846], aivideo: [844, 814], vehicle: [990, 694], package: [1052, 518],
    sound: [1022, 330], comfort: [894, 184], vprotect: [718, 116], deter: [534, 154], spotlight: [386, 270], faces: [320, 444] };
  const AICOL = { comfort: '#d0213f', sound: '#e24bb8', package: '#f07a38', vehicle: '#f07a38' };
  const IMG = 'assets/ai_wheel.webp?v=176';
  function aiBuild() {
    const sec = Q('#p-ai'); if (!sec || Q('#aiPP')) return;
    /* the real bubble centres come from the hotspot layer the page builds (AI table), so they stay in sync */
    D.querySelectorAll('#aiHot [data-ai]').forEach(h => { AIXY[h.dataset.ai] = [parseFloat(h.style.left) + 66, parseFloat(h.style.top) + 66]; });
    const w = D.createElement('div'); w.id = 'aiPP';
    w.innerHTML = '<svg class="aiRing"></svg><div class="aiC"></div>' +
      AIK.filter(k => AIXY[k]).map((k, i) => `<div class="aiB" data-ai="${k}" style="--i:${i}"><i></i></div>`).join('');
    sec.appendChild(w);
  }
  function aiLayout() {
    const w = Q('#aiPP'); if (!w || !isPP()) return;
    const H = avail(), W = 600, R = H < 1080 ? 62 : 68, cx = W / 2, cy = H / 2 + 4;
    const rx = W / 2 - R - 14, ry = H / 2 - R - 26;
    w.style.height = H + 'px';
    /* equal arc-length spacing round the ellipse, clockwise from the top */
    const N = 720, pts = []; let L = 0, prev = null;
    for (let j = 0; j <= N; j++) { const t = -Math.PI / 2 + j / N * 2 * Math.PI, p = [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
      if (prev) L += Math.hypot(p[0] - prev[0], p[1] - prev[1]); pts.push([p[0], p[1], L]); prev = p; }
    const bs = [...w.querySelectorAll('.aiB')], n = bs.length, at = s => { s = ((s % L) + L) % L; let j = 0; while (j < N && pts[j + 1][2] < s) j++; return pts[j]; };
    const pos = bs.map((b, i) => at((i + .5) / n * L - L / n / 2 + L / n * .5));
    bs.forEach((b, i) => { const [x, y] = pos[i], [ox, oy] = AIXY[b.dataset.ai], k = R / 66;
      Object.assign(b.style, { left: (x - R) + 'px', top: (y - R) + 'px', width: 2 * R + 'px', height: 2 * R + 'px' });
      Object.assign(b.firstChild.style, { backgroundImage: `url(${IMG})`, backgroundSize: `${1376 * k}px ${964 * k}px`,
        backgroundPosition: `${-(ox - 66) * k}px ${-(oy - 66) * k}px` }); });
    /* ring: one arc per gap, blending the two neighbours' colours */
    const col = k => AICOL[k] || '#2fd9a0';
    let defs = '', paths = '';
    for (let i = 0; i < n; i++) { const a = bs[i].dataset.ai, b = bs[(i + 1) % n].dataset.ai, s0 = (i + .5) / n * L, s1 = (i + 1.5) / n * L;
      let d = ''; for (let s = s0; s <= s1 + .1; s += 6) { const p = at(s); d += (d ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
      const p0 = at(s0), p1 = at(s1);
      defs += `<linearGradient id="aiG${i}" gradientUnits="userSpaceOnUse" x1="${p0[0]}" y1="${p0[1]}" x2="${p1[0]}" y2="${p1[1]}"><stop offset=".3" stop-color="${col(a)}"/><stop offset=".7" stop-color="${col(b)}"/></linearGradient>`;
      paths += `<path d="${d}" stroke="url(#aiG${i})"/>`; }
    const svg = w.querySelector('.aiRing'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = `<defs>${defs}</defs><g fill="none" stroke-width="5" stroke-linecap="round">${paths}</g>`;
    /* centre: the "Vivint AI Technologies" swirl, cut from the artwork (centre 687,480, radius ~275) */
    /* sized so the "Vivint AI Technologies" words sit between the two side columns of bubbles, never under them */
    const Dc = Math.min(2 * (rx - R) + 40, 2 * ry - 2 * R), kc = Dc / 550, c = w.querySelector('.aiC');
    Object.assign(c.style, { left: (cx - Dc / 2) + 'px', top: (cy - Dc / 2) + 'px', width: Dc + 'px', height: Dc + 'px', backgroundImage: `url(${IMG})`,
      backgroundSize: `${1376 * kc}px ${964 * kc}px`, backgroundPosition: `${-(687 - 275) * kc}px ${-(480 - 275) * kc}px` });
  }

  /* ---------- Compatibility: the landscape grid image cut into brand cards, stacked, every device drawn at ONE scale ---------- */
  /* the Vivint card is cut whole; each other card is cut into its logo and its row of devices (artwork px, 2064x1446),
     re-centred on a white card as wide as the screen, so a panel is the same size whichever brand card it sits in */
  const CMV = [45, 210, 1975, 477];
  const CMS = { gig: { y: [715, 931], lg: [56, 186], dv: [186, 1112], cm: '2gig' }, dsc: { y: [960, 1180], lg: [56, 186], dv: [186, 1115], cm: 'dsc' },
    hon: { y: [1204, 1420], lg: [56, 186], dv: [186, 1106], cm: 'honeywell' }, adt: { y: [715, 931], lg: [1184, 1314], dv: [1322, 1910], cm: 'adt' },
    ring: { y: [965, 1180], lg: [1184, 1314], dv: [1375, 1915], cm: 'ring' }, ss: { y: [1206, 1420], dv: [1190, 1495], cm: 'simplisafe' },
    xf: { y: [1206, 1420], dv: [1550, 2004], cm: 'simplisafe' } };
  const ROWS = [['vivint'], ['gig'], ['dsc'], ['hon'], ['adt'], ['ring'], ['ss', 'xf']];
  const CIMG = 'assets/compat_grid.webp?v=176';
  function cmBuild() {
    const sec = Q('#p-compat'); if (!sec || Q('#cmPP')) return;
    const w = D.createElement('div'); w.id = 'cmPP';
    w.innerHTML = '<h2>Compatibility</h2>' + ROWS.map((r, i) => `<div class="cmR" style="--i:${i}">` + r.map(k => k === 'vivint' ? '<div class="cmC cmV" data-k="vivint"></div>'
      : `<div class="cmC hot" data-k="${k}" data-cm="${CMS[k].cm}">${CMS[k].lg ? '<i class="cmL"></i>' : ''}<i class="cmD"></i></div>`).join('') + '</div>').join('');
    sec.appendChild(w);
  }
  function cmLayout() {
    const w = Q('#cmPP'); if (!w || !isPP()) return;
    const H = avail(), top = H < 1080 ? 112 : 138, maxW = 568, LG = 140, PAD = 14;
    w.style.height = H + 'px';
    /* one device scale for every small card, set by the widest card (logo column + devices) */
    let s = maxW / (LG + Math.max(...['gig', 'dsc', 'hon', 'adt', 'ring'].map(k => CMS[k].dv[1] - CMS[k].dv[0])) + PAD), sv = maxW / CMV[2];
    const hs = () => 208 * s, gap0 = H < 1080 ? 10 : 14;
    const need = CMV[3] * sv + 6 * hs() + 6 * gap0, room = H - top - 20, g = Math.min(1, room / need);
    s *= g; sv *= g; const RW = maxW * g, gap = Math.min(gap0 + (g === 1 ? (room - need) / 7 : 0), 24), set = (el, o) => Object.assign(el.style, o);
    let y = top + (g === 1 ? Math.max(0, room - need - 6 * (gap - gap0)) / 3 : 0);
    w.querySelectorAll('.cmR').forEach((row, i) => {
      const r = ROWS[i], h = r[0] === 'vivint' ? CMV[3] * sv : hs();
      set(row, { top: y + 'px', left: (600 - RW) / 2 + 'px', width: RW + 'px', height: h + 'px', gap: gap + 'px' });
      const tot = r.reduce((a, k) => a + (k === 'vivint' ? 1 : CMS[k].dv[1] - CMS[k].dv[0]), 0);
      row.querySelectorAll('.cmC').forEach(c => {
        const k = c.dataset.k;
        if (k === 'vivint') { const [x0, y0] = CMV;
          return set(c, { width: RW + 'px', height: h + 'px', borderRadius: 34 * sv + 'px', backgroundImage: `url(${CIMG})`, backgroundSize: `${2064 * sv}px ${1446 * sv}px`, backgroundPosition: `${-x0 * sv}px ${-y0 * sv}px` }); }
        const m = CMS[k], cw = r.length > 1 ? (RW - gap * (r.length - 1)) * (m.dv[1] - m.dv[0]) / tot : RW, y0 = m.y[0] + 4, ch = (m.y[1] - m.y[0] - 8) * s;
        set(c, { width: cw + 'px', height: h + 'px', borderRadius: 34 * s + 'px' });
        const crop = (el, x0, x1, left) => set(el, { left: left + 'px', top: (h - ch) / 2 + 'px', width: (x1 - x0) * s + 'px', height: ch + 'px', backgroundImage: `url(${CIMG})`,
          backgroundSize: `${2064 * s}px ${1446 * s}px`, backgroundPosition: `${-x0 * s}px ${-y0 * s}px` });
        const lg = c.querySelector(".cmL"), L = m.lg ? LG * s : 0;
        if (lg) crop(lg, m.lg[0], m.lg[1], 10 * s);
        crop(c.querySelector(".cmD"), m.dv[0], m.dv[1], L + (cw - L - (m.dv[1] - m.dv[0]) * s) / 2);
      });
      y += h + gap; });
  }

  /* ---------- OCP / DBCP Highlights: media band between the title and the 2-column list ---------- */
  function featLayout() {
    [['#ocScroll', '#ocmPhone', '#ocmList', 920, 454], ['#dbScroll', '#dbmPhone', '#dbmList', 372, 748]].forEach(([bq, pq, lq, pw, phh0]) => {
      const box = Q(bq), ph = Q(pq), L = Q(lq); if (!box || !ph || !L) return;
      const sec = L.closest('.otab'), H = window.SH || 1230, st = Q('#stage'), pf = parseFloat(getComputedStyle(st).getPropertyValue('--ppFoot')) || 76;
      const rows = Math.ceil(L.children.length / 2), bh = H >= 1200 ? 66 : 60, listH = rows * bh + (rows - 1) * 6;
      const head = H < 1100 ? 168 : 186, mt = head, mh = Math.max(240, H - pf - 14 - listH - 18 - mt);
      let phs, phh;
      if (pw === 920) { const port = ph.classList.contains('port'); phs = port ? mh / 732 : 560 / 920; phh = port ? mh : 454 * phs; }
      else { phs = Math.min(mh / 748, 330 / 372); phh = 748 * phs; }
      const v = { '--lbh': bh + 'px', '--mt': mt + 'px', '--mh': mh + 'px', '--phs': phs.toFixed(4), '--phh': phh.toFixed(1) + 'px' };
      if (pw === 372) { const pl = 16; v['--cl'] = (pl + 372 * phs + 6).toFixed(1) + 'px';
        if (ph.style.getPropertyValue('left') !== pl + 'px') ph.style.setProperty('left', pl + 'px', 'important');
        const c = Q('#dbmCap'); if (c && c.style.getPropertyValue('transform') !== 'none') c.style.setProperty('transform', 'none', 'important'); }
      Object.entries(v).forEach(([k, x]) => sec.style.setProperty(k, x));
    });
  }
  /* the page's own balance() re-places these with inline !important styles: put ours back whenever it does */
  function featWatch() {
    ['#dbmPhone', '#dbmCap', '#ocmPhone'].forEach(q => { const el = Q(q); if (!el || el.__ppw) return; el.__ppw = 1;
      new MutationObserver(() => { if (isPP()) featLayout(); }).observe(el, { attributes: true, attributeFilter: ['style', 'class'] }); });
  }
  function featClear() {
    D.querySelectorAll('#ocScroll>.dbm,#dbScroll>.dbm').forEach(s => ['--lbh', '--mt', '--mh', '--phs', '--phh', '--cl'].forEach(k => s.style.removeProperty(k)));
    const ph = Q('#dbmPhone'); if (ph && ph.style.getPropertyValue('left') === '16px') ph.style.removeProperty('left');
  }


  /* ---------- Specs strips: panes are 600 wide here, so the strip steps by its pane width (.wide) and drags 1:1 with the finger ---------- */
  function stripMode() {
    D.querySelectorAll('#ocScroll>[data-t=specs] .strip,#dbScroll>[data-t=specs] .strip').forEach(st => {
      const on = isPP(); if (st.classList.contains('wide') === on && st.__ppw === on) return;
      st.classList.toggle('wide', on); st.__ppw = on;
      /* keep the pane the pill shows */ const sec = st.closest('[data-t]'), pill = sec && sec.querySelector('.spill'), i = pill && pill.querySelectorAll('button')[1] && pill.querySelectorAll('button')[1].classList.contains('on') ? 1 : 0;
      st.style.transition = 'none'; st.style.transform = `translate3d(${-(on ? 600 : 1376) * i}px,0,0)`;
    });
  }
  function stripDrag(box) {
    if (!box || box.__ppd) return; box.__ppd = 1; let d = null;
    box.addEventListener('pointerdown', e => { if (!isPP()) return; const sec = e.target.closest('[data-t]'), st = sec && sec.querySelector(':scope>.strip'); if (!st) { d = null; return; }
      const m = new DOMMatrix(getComputedStyle(st).transform); d = { sec, st, x: e.clientX, y: e.clientY, p0: -m.m41 / 600, k: sec.getBoundingClientRect().width / 600, ax: null }; }, { passive: true });
    /* runs after the page's own handler (registered earlier on the same box) and re-places the strip at finger speed */
    box.addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.ax) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; d.ax = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; }
      if (d.ax !== 'x') return; let p = d.p0 - dx / d.k / 600; if (p < 0) p *= .3; if (p > 1) p = 1 + (p - 1) * .3;
      d.st.style.transition = 'none'; d.st.style.transform = `translate3d(${-600 * p}px,0,0)`; }, { passive: true });
    const end = () => { d = null; }; box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  }


  /* ---------- History: if the grid is taller than the screen (small phones), scale it to fit ---------- */
  function histFit() {
    const hx = Q('#ocHist'); if (!hx) return;
    if (!isPP()) { hx.style.removeProperty('transform'); return; }
    hx.style.transform = ''; const H = avail() - 10, last = hx.lastElementChild; let h = last ? last.offsetTop + last.offsetHeight + 8 : 0;
    /* the footage notes hang below their grid (absolute), so measure them too */
    const fn = hx.querySelector('.fnote'), r0 = hx.getBoundingClientRect(), z = r0.width / (hx.offsetWidth || 1);
    if (fn && fn.offsetParent && z > 0) h = Math.max(h, (fn.getBoundingClientRect().bottom - r0.top) / z + 8);
    if (h > H && h > 0) { const k = H / h; hx.style.transformOrigin = '50% 0'; hx.style.transform = `scale(${k.toFixed(4)})`; }
  }
  function histWatch() { const hx = Q('#ocHist'); if (!hx || hx.__ppw) return; hx.__ppw = 1; new MutationObserver(() => requestAnimationFrame(histFit)).observe(hx, { childList: true }); }


  /* ---------- OCP vs Arlo: a second, synced copy of the split clip so each half gets its own full-width row ---------- */
  function arloTwin() {
    const v = Q('#ocArloVid'); if (!v) return; let t = Q('#ocArloVid2');
    if (!isPP()) { if (t) t.pause(); return; }
    if (!t) { t = v.cloneNode(false); t.id = 'ocArloVid2'; t.removeAttribute('style'); t.muted = true; v.after(t);
      const sync = () => { if (!isPP()) return; if (Math.abs(t.currentTime - v.currentTime) > .12) { try { t.currentTime = v.currentTime; } catch (e) {} }
        if (v.paused !== t.paused) v.paused ? t.pause() : t.play().catch(() => {}); };
      ['play', 'pause', 'seeked', 'timeupdate'].forEach(ev => v.addEventListener(ev, sync)); }
    if (!t.src && v.currentSrc) t.src = v.currentSrc;
  }

  /* ---------- focal points: every hero gallery photo (and the DBCP hero video) is cropped so the product sits in the
     horizontal centre of the upright screen. FOC = the product x centre as a fraction of each source picture (for close-ups wider
     than the screen, the camera head, so the face is whole and the mount runs off the edge) ---------- */
  const FOC = { ocp: [.59, .75, .33, .70, .29, .66, .335], dbcp: [.585, .67, .60, .69, .60, .41, .71] };
  function focusOne(el, f, nw, nh, fh) {
    if (!isPP()) { if (el.style.objectPosition) el.style.removeProperty('object-position'); return; }
    const Fw = 600, Fh = fh || window.SH || 1230; if (!nw || !nh || f == null) return;
    const k = Math.max(Fw / nw, Fh / nh), Wi = nw * k; if (Wi - Fw < 1) return;
    const v = (Math.max(0, Math.min(1, (f * Wi - Fw / 2) / (Wi - Fw))) * 100).toFixed(1) + '% 50%';
    if (el.style.objectPosition !== v) el.style.objectPosition = v;
  }
  function galFocus() {
    [['#ocScroll', 'ocp'], ['#dbScroll', 'dbcp']].forEach(([q, k]) => { const box = Q(q); if (!box) return;
      box.querySelectorAll('.hgl figure img').forEach((im, i) => {
        if (!im.__ppf) { im.__ppf = 1; im.addEventListener('load', () => focusOne(im, FOC[k][i], im.naturalWidth, im.naturalHeight)); }
        focusOne(im, FOC[k][i], im.naturalWidth, im.naturalHeight); }); });
    const v = Q('#dbHv'); if (v) { if (!v.__ppf) { v.__ppf = 1; v.addEventListener('loadedmetadata', galFocus); } focusOne(v, .6, v.videoWidth || 1376, v.videoHeight || 1032, avail() - 330); }
  }

  /* ---------- Compare: rival products drawn at one visual size (equal area) rather than each squeezed to its well ---------- */
  function wellFit() {
    D.querySelectorAll('#ocScroll .dbwell img,#dbScroll .dbwell img').forEach(im => {
      if (!im.__ppw) { im.__ppw = 1; im.addEventListener('load', wellFit); }
      const props = ['width', 'height', 'left', 'top'];
      if (!isPP()) { props.forEach(p => im.style.getPropertyValue(p) && im.style.removeProperty(p)); return; }
      const w = im.parentNode, W = w.offsetWidth, H = w.offsetHeight, a = im.naturalWidth / im.naturalHeight; if (!W || !H || !a) return;
      const C = Math.min(W, H) * (W < H ? 1.08 : .92);        /* sqrt(area) every product gets, then shrunk to fit the well if needed */
      let pw = C * Math.sqrt(a), ph = C / Math.sqrt(a); const f = Math.min(1, W * 1.08 / pw, H / ph); pw *= f; ph *= f;
      const v = { width: pw.toFixed(1) + 'px', height: ph.toFixed(1) + 'px', left: ((W - pw) / 2).toFixed(1) + 'px', top: ((H - ph) / 2).toFixed(1) + 'px' };
      props.forEach(p => { if (im.style.getPropertyValue(p) !== v[p]) im.style.setProperty(p, v[p], 'important'); });
    });
  }

  /* ---------- Smart Actions: an oversized product render peeks in from the right edge beside the headline ---------- */
  function actBleed() {
    [['#ocScroll', 'assets/och/c0.webp?v=87', 'oc'], ['#dbScroll', 'assets/db/dbcp_a1.webp?v=55', 'db']].forEach(([q, src, k]) => {
      const sec = Q(q + '>[data-t=act]'); if (!sec || sec.querySelector('.ppBleed')) return;
      const im = D.createElement('img'); im.className = 'ppBleed ' + k; im.alt = ''; im.decoding = 'async'; im.src = src; im.draggable = false;
      sec.insertBefore(im, sec.firstChild); });
  }

  function spinFit() { const v = (avail() / 1032).toFixed(4); ['#ocScroll', '#dbScroll'].forEach(q => { const b = Q(q); if (b && b.style.getPropertyValue('--spk') !== v) b.style.setProperty('--spk', v); }); }

  function layout() { stripMode(); if (!isPP()) { featClear(); histFit(); arloTwin(); galFocus(); wellFit(); return; } aiLayout(); cmLayout(); featLayout(); spinFit(); histFit(); arloTwin(); galFocus(); wellFit(); }
  /* the gallery photos are lazy: once their product page is open, fetch them all so a dot-jump never shows a black slide */
  function galEager(sec) { sec.querySelectorAll('.hgl img[loading=lazy]').forEach(im => { im.loading = 'eager'; }); }
  function secWatch() { ['#p-ocp', '#p-dbcp'].forEach(q => { const el = Q(q); if (!el || el.__ppo) return; el.__ppo = 1;
    /* the wells only have a size once their page is shown: re-fit then (writes only to the images, never to the observed page) */
    new MutationObserver(() => { if (isPP() && el.classList.contains('on')) { requestAnimationFrame(wellFit); galEager(el); } }).observe(el, { attributes: true, attributeFilter: ['class'] }); }); }
  function boot() { aiBuild(); cmBuild(); actBleed(); secWatch(); if (isPP()) D.querySelectorAll('#p-ocp.on,#p-dbcp.on').forEach(galEager); featWatch(); histWatch(); stripDrag(Q('#ocScroll')); stripDrag(Q('#dbScroll')); layout(); }
  let raf = 0; const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => requestAnimationFrame(layout)); };
  addEventListener('resize', later); addEventListener('orientationchange', () => setTimeout(later, 300));
  if (window.visualViewport) visualViewport.addEventListener('resize', later);
  new MutationObserver(later).observe(D.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
  addEventListener('load', () => { boot(); later(); });
})();
