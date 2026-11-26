/* iPhone portrait (html.pp) behaviour: protect group. Only act when document.documentElement.classList.contains("pp"). */
(function () {
  const isPP = () => document.documentElement.classList.contains('pp');
  const q = (s, r) => (r || document).querySelector(s), qa = (s, r) => [...(r || document).querySelectorAll(s)];

  /* NRG: wrap the blocks in .ppw (display:contents off phone-portrait, a flex column on it) */
  const nrg = q('#p-nrg');
  if (nrg && !q('.ppw', nrg)) {
    const w = document.createElement('div'); w.className = 'ppw';
    qa(':scope>:not(.ng-bg)', nrg).forEach(el => w.appendChild(el)); nrg.appendChild(w);
  }

  /* ---- crop composer: a landscape slide (1376 x 964, text baked in) is re-cut into stacked crops that fill the upright screen.
     A spec is a list of rows; a row is a list of crops [x, y, w, h, tw] in slide coordinates, tw = width on the stage.
     Rows are stacked and centred in the space between the title (top) and the footer (bottom); everything shrinks
     together if the screen is short. Tap targets (.hot) that fall inside a crop are cloned onto it. */
  const S1 = [[350, 768, 640, 166, 600]], S3 = [[280, 768, 784, 166, 600]];
  const SPEC = {
    mon_hero: [[[70, 215, 600, 215, 560]], [[660, 60, 716, 904, 600]]],
    mon_home: [[[180, 130, 640, 510, 600]], [[830, 225, 370, 445, 370]], S1],
    mon_trained: [[[0, 0, 700, 640, 600]], [[730, 290, 580, 370, 560]], S1],
    mon_911: [[[460, 0, 916, 500, 600]], [[700, 500, 560, 160, 560]], S1],
    mon_simple: [[[0, 0, 700, 700, 600]], [[700, 390, 580, 290, 560]], S1],
    mon_insurance: [[[60, 0, 780, 964, 600]]],
    mon_breakin: [[[110, 240, 440, 410, 440]], [[580, 150, 796, 580, 600]], S3],
    mon_smoke: [[[110, 230, 560, 380, 600]], [[740, 130, 540, 580, 480]], S3],
    mon_water: [[[110, 270, 540, 320, 600]], [[640, 190, 680, 480, 560]], S3],
    mon_medical: [[[110, 270, 540, 330, 600]], [[640, 0, 736, 720, 600]], S3],
    mon_duress: [[[110, 260, 540, 400, 600]], [[660, 0, 716, 740, 600]], S3],
    mon_trusted: [[[80, 180, 900, 190, 600]], [[95, 415, 285, 385, 290], [408, 415, 285, 385, 290]], [[722, 415, 285, 385, 290], [1035, 415, 285, 385, 290]]],
    military_hero: { at: 'bottom', fade: 1, rows: [[[700, 275, 676, 689, 720]]],
      html: '<div class="ppmil"><h2>We\u2019re proud to protect those who sacrifice to protect us.</h2><ul><li>Special offers for deployed family members</li><li>24/7 monitoring and support</li><li>$4 million in charitable donations to military families</li></ul></div>' }
  };
  const GAP = 18, TOP = 96, BOT = 84;
  const key = img => (img.getAttribute('src') || '').split('/').pop().split('.')[0];

  function layout(host) {
    const H = window.SH || 1032, ppx = host.querySelector(':scope>.ppx'); if (!ppx) return;
    qa(':scope>.ppg', ppx).forEach(g => {
      const sp = SPEC[g.dataset.k], spec = sp.rows || sp, hots = g._hots || [];
      const rows = spec.map(r => ({ cs: r, h: Math.max(...r.map(c => c[3] * c[4] / c[2])), w: r.reduce((a, c) => a + c[4], 0) + (r.length - 1) * GAP }));
      const tot = rows.reduce((a, r) => a + r.h, 0) + (rows.length - 1) * GAP, avail = H - TOP - BOT, k = Math.min(1, avail / tot);
      let y = sp.at === 'bottom' ? H - tot * k : TOP + Math.max(0, (avail - tot * k) / 2);
      g.innerHTML = sp.html || '';
      rows.forEach(r => {
        let x = (600 - r.w * k) / 2;
        r.cs.forEach(([cx, cy, cw, ch, tw]) => {
          const s = tw * k / cw, d = document.createElement('div'); d.className = 'ppc' + (sp.fade ? ' fade' : '');
          Object.assign(d.style, { left: x + 'px', top: y + (r.h * k - ch * s) / 2 + 'px', width: cw * s + 'px', height: ch * s + 'px' });
          const im = document.createElement('img'); im.src = g.dataset.src; im.alt = ''; im.decoding = 'async'; im.draggable = false;
          Object.assign(im.style, { left: -cx * s + 'px', top: -cy * s + 'px', width: 1376 * s + 'px', height: 964 * s + 'px' });
          d.appendChild(im); g.appendChild(d);
          const ox = parseFloat(d.style.left), oy = parseFloat(d.style.top);
          hots.forEach(h => { /* clone tap targets whose centre is inside this crop */
            const mx = h.x + h.w / 2, my = h.y + h.h / 2; if (mx < cx || mx > cx + cw || my < cy || my > cy + ch) return;
            const c = h.el.cloneNode(false); c.removeAttribute('style');
            Object.assign(c.style, { left: ox + (h.x - cx) * s + 'px', top: oy + (h.y - cy) * s + 'px', width: h.w * s + 'px', height: h.h * s + 'px' });
            g.appendChild(c); });
          x += tw * k + GAP; });
        y += r.h * k + GAP; });
    });
  }

  function build(host) {
    if (host.querySelector(':scope>.ppx')) return;
    const imgs = qa(':scope>img.full', host).filter(i => SPEC[key(i)]); if (!imgs.length) return;
    const hots = qa(':scope>.hot', host).map(el => ({ el, x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: parseFloat(el.style.width), h: parseFloat(el.style.height) }));
    const ppx = document.createElement('div'); ppx.className = 'ppx';
    imgs.forEach(img => {
      const g = document.createElement('div'); g.className = 'ppg'; g.dataset.k = key(img); g.dataset.src = img.getAttribute('src'); g.hidden = img.hidden; g._hots = hots;
      ppx.appendChild(g);
      /* follow the slide's own sub-tab switching (it toggles [hidden] on the original images) */
      new MutationObserver(() => { const was = g.hidden; g.hidden = img.hidden; if (was && !g.hidden) { g.classList.remove('in'); void g.offsetWidth; g.classList.add('in'); } }).observe(img, { attributes: true, attributeFilter: ['hidden'] });
    });
    const sc = host.querySelector(':scope>.scroll'); sc ? host.insertBefore(ppx, sc) : host.appendChild(ppx);
    layout(host);
  }

  const hosts = () => [...qa('#p-monitoring .mtab'), q('#p-military')].filter(Boolean);
  let lastH = 0;
  function apply() {
    if (!isPP()) return;
    const H = window.SH || 0; hosts().forEach(h => { if (!h.querySelector(':scope>.ppx')) build(h); else if (H !== lastH) layout(h); }); lastH = H;
  }
  apply();
  addEventListener('resize', () => setTimeout(apply, 60));
  addEventListener('orientationchange', () => setTimeout(apply, 400));
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
