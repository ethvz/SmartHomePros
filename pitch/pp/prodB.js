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
    const Dc = Math.min(2 * rx + 10, 2 * ry - 2 * R), kc = Dc / 550, c = w.querySelector('.aiC');
    Object.assign(c.style, { left: (cx - Dc / 2) + 'px', top: (cy - Dc / 2) + 'px', width: Dc + 'px', height: Dc + 'px', backgroundImage: `url(${IMG})`,
      backgroundSize: `${1376 * kc}px ${964 * kc}px`, backgroundPosition: `${-(687 - 275) * kc}px ${-(480 - 275) * kc}px` });
  }

  /* ---------- Compatibility: the landscape grid image cut into its brand cards and stacked ---------- */
  /* crop rects in the 2064x1446 artwork: [x, y, w, h, data-cm] */
  const CM = { vivint: [45, 210, 1975, 477], gig: [45, 715, 1100, 217, '2gig'], dsc: [45, 960, 1100, 217, 'dsc'], hon: [45, 1204, 1100, 217, 'honeywell'],
    adt: [1173, 715, 847, 217, 'adt'], ring: [1173, 963, 847, 217, 'ring'], ss: [1173, 1204, 340, 217, 'simplisafe'], xf: [1538, 1204, 482, 217, 'simplisafe'] };
  const ROWS = [['vivint'], ['gig'], ['dsc'], ['hon'], ['adt'], ['ring'], ['ss', 'xf']];
  const CIMG = 'assets/compat_grid.webp?v=176';
  function cmBuild() {
    const sec = Q('#p-compat'); if (!sec || Q('#cmPP')) return;
    const w = D.createElement('div'); w.id = 'cmPP';
    w.innerHTML = '<h2>Compatibility</h2>' + ROWS.map((r, i) => `<div class="cmR" style="--i:${i}">` + r.map(k => `<div class="cmC${CM[k][4] ? ' hot' : ''}" data-k="${k}"${CM[k][4] ? ` data-cm="${CM[k][4]}"` : ''}></div>`).join('') + '</div>').join('');
    sec.appendChild(w);
  }
  function cmLayout() {
    const w = Q('#cmPP'); if (!w || !isPP()) return;
    const H = avail(), top = H < 1080 ? 112 : 138, gap = H < 1080 ? 10 : 14, maxW = 568;
    w.style.height = H + 'px';
    /* natural heights at full width, then one scale so everything fits between the title and the footer */
    const rowH = r => { const tw = r.reduce((a, k) => a + CM[k][2], 0) + (r.length - 1) * 30; return maxW * CM[r[0]][3] / tw; };
    const sum = ROWS.reduce((a, r) => a + rowH(r), 0), f = Math.min(1, (H - top - 24 - gap * (ROWS.length - 1)) / sum), RW = maxW * f;
    let y = top;
    w.querySelectorAll('.cmR').forEach((row, i) => { const r = ROWS[i], h = rowH(r) * f, tw = r.reduce((a, k) => a + CM[k][2], 0) + (r.length - 1) * 30, s = RW / tw;
      Object.assign(row.style, { top: y + 'px', left: (600 - RW) / 2 + 'px', width: RW + 'px', height: h + 'px', gap: 30 * s + 'px' });
      row.querySelectorAll('.cmC').forEach(c => { const [x0, y0, cw, ch] = CM[c.dataset.k], k = h / ch;
        Object.assign(c.style, { width: cw * k + 'px', height: h + 'px', borderRadius: 34 * k + 'px', backgroundImage: `url(${CIMG})`,
          backgroundSize: `${2064 * k}px ${1446 * k}px`, backgroundPosition: `${-x0 * k}px ${-y0 * k}px` }); });
      y += h + gap; });
  }

  function layout() { if (!isPP()) return; aiLayout(); cmLayout(); }
  function boot() { aiBuild(); cmBuild(); layout(); }
  let raf = 0; const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => requestAnimationFrame(layout)); };
  addEventListener('resize', later); addEventListener('orientationchange', () => setTimeout(later, 300));
  if (window.visualViewport) visualViewport.addEventListener('resize', later);
  new MutationObserver(later).observe(D.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
  addEventListener('load', () => { boot(); later(); });
})();
