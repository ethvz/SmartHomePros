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

  /* Protection: an oversized Outdoor Camera Pro peeks into the "more protection" card from its right edge (hidden off phone-portrait) */
  const ptab = q('#p-protection .ptab');
  if (ptab && !q('.ppBleed', ptab)) {
    const im = document.createElement('img'); im.className = 'ppBleed'; im.alt = ''; im.draggable = false; im.decoding = 'async';
    im.src = 'assets/cat/ocp.webp?v=176'; ptab.appendChild(im);
  }

  /* ---- crop composer: a landscape slide (1376 x 964, text baked in) is re-cut into stacked crops that fill the upright screen.
     A spec is a list of rows; a row is a list of crops [x, y, w, h, tw] in slide coordinates, tw = width on the stage.
     Rows are stacked and centred in the space between the title (top) and the footer (bottom); everything shrinks
     together if the screen is short. Tap targets (.hot) that fall inside a crop are cloned onto it. */
  /* A crop may carry [.., y0, y1]: the rows' leftover height is given to that crop by showing more of the picture above
     and below it, but never outside y0..y1 (so baked-in text next to it stays out). bg: a blurred, dimmed copy of the
     slide fills the screen behind the crops. 8th item: extra class on the crop.
     A crop's 9th item is options: g = may zoom in up to g x to fill leftover height (the picture is cropped narrower around
     the focal point f, 0..1 of its width; with x set it grows wider instead), x = fixed left edge on the stage: the crop may
     run past the right edge (oversized product "bleeding" off the screen), bl = ease it in from the edge.
     The sub-tab row (S1/S3) is pinned just above the footer so the buttons never move between sub-slides. */
  const S1 = [[350, 768, 640, 166, 600]], S3 = [[280, 768, 784, 166, 600]];
  const SPEC = {
    mon_hero: [[[70, 215, 585, 215, 560]], [[660, 60, 716, 904, 600, 0, 964]]],
    mon_home: [[[180, 130, 640, 510, 600, 122, 762, , { g: 1.7, f: .47 }]], [[828, 222, 372, 450, 400]], S1],
    mon_trained: [[[0, 0, 700, 640, 600, 0, 762, , { g: 1.7, f: .74 }]], [[730, 290, 580, 370, 560]], S1],
    mon_911: [[[460, 0, 916, 500, 600, 0, 498, , { g: 1.9, f: .74 }]], [[700, 500, 560, 160, 560]], S1],
    mon_simple: [[[0, 0, 700, 700, 600, 0, 762, , { g: 1.7, f: .36 }]], [[700, 390, 580, 290, 560]], S1],
    mon_insurance: { bg: 1, rows: [[[60, 0, 780, 964, 600]]] },
    mon_breakin: [[[110, 236, 440, 418, 540]], [[588, 140, 788, 600, 720, , , 'bl', { x: 34, g: 1.3 }]], S3],
    mon_smoke: [[[110, 230, 560, 380, 600]], [[716, 126, 660, 590, 700, , , 'bl', { x: 96, g: 1.3 }]], S3],
    mon_water: [[[110, 270, 540, 320, 600]], [[700, 160, 676, 440, 800, , , 'bl', { x: -30, g: 1.3 }]], S3],
    mon_medical: [[[110, 270, 540, 330, 600]], [[640, 0, 736, 720, 600, 0, 762, , { g: 1.8, f: .56 }]], S3],
    mon_duress: [[[110, 260, 540, 400, 600]], [[660, 0, 716, 740, 600, 0, 762, , { g: 1.8, f: .57 }]], S3],
    mon_trusted: [[[80, 180, 900, 190, 600]], [[95, 415, 285, 385, 290], [408, 415, 285, 385, 290]], [[722, 415, 285, 385, 290], [1035, 415, 285, 385, 290]]],
    military_hero: { at: 'bottom', fade: 1, rows: [[[700, 275, 676, 689, 720]]],
      html: '<div class="ppmil"><h2>We’re proud to protect those who sacrifice to protect us.</h2><ul><li>Special offers for deployed family members</li><li>24/7 monitoring and support</li><li>$4 million in charitable donations to military families</li></ul></div>' }
  };
  const GAP = 18;
  /* top: clear the section title and the status bar (brand.js publishes --brsat, the top safe area in stage px); bottom: the footer */
  const insets = () => { const cs = getComputedStyle(q('#stage') || document.documentElement);
    const sat = parseFloat(cs.getPropertyValue('--brsat')) || 0, foot = parseFloat(cs.getPropertyValue('--ppFoot')) || 76;
    return { TOP: Math.max(96, sat + 30), BOT: foot + 10 }; };
  const key = img => (img.getAttribute('src') || '').split('/').pop().split('.')[0];

  function layout(host) {
    const H = window.SH || 1032, ppx = host.querySelector(':scope>.ppx'); if (!ppx) return;
    const { TOP } = insets(), BOT = insets().BOT + (host.classList.contains('mtab') ? 44 : 0); /* monitoring: a strip for the next-section arrow */
    qa(':scope>.ppg', ppx).forEach(g => {
      const sp = SPEC[g.dataset.k], src = sp.rows || sp, hots = g._hots || [];
      const nav = src.length > 1 && (src[src.length - 1] === S1 || src[src.length - 1] === S3) ? src[src.length - 1].map(c => c.slice()) : null;
      const spec = (nav ? src.slice(0, -1) : src).map(r => r.map(c => c.slice()));
      const rh = r => Math.max(...r.map(c => c[3] * c[4] / c[2]));
      const sum = () => spec.reduce((a, r) => a + rh(r), 0) + (spec.length - 1) * GAP;
      const navH = nav ? rh(nav) : 0, avail = H - TOP - BOT - (nav ? navH + GAP : 0);
      /* 1: grow the crops that allow it (more picture above/below) into the leftover height */
      let extra = avail - sum();
      spec.forEach(r => r.forEach(c => { if (extra <= 1 || c[5] == null || r.length > 1) return;
        const s = c[4] / c[2], room = (c[6] - c[5]) - c[3]; if (room <= 0) return;
        const add = Math.min(room, extra / s), up = Math.min(c[1] - c[5], add / 2), dn = Math.min(c[6] - (c[1] + c[3]), add - up), up2 = Math.min(c[1] - c[5], add - dn);
        c[1] -= up2; c[3] += up2 + dn; extra -= (up2 + dn) * s; }));
      /* 2: then zoom in (photos crop narrower around their focal point; edge-bleed products grow past the edge) */
      spec.forEach(r => r.forEach(c => { const o = c[8]; if (extra <= 1 || !o || !o.g || r.length > 1) return;
        const h = c[3] * c[4] / c[2], f = Math.min(o.g, (h + extra) / h); if (f <= 1.001) return;
        if (o.x != null) c[4] *= f; else { const cw = c[2] / f; c[0] += (c[2] - cw) * (o.f == null ? .5 : o.f); c[2] = cw; }
        extra -= h * (f - 1); }));
      const rows = spec.map(r => ({ cs: r, h: rh(r), w: r.reduce((a, c) => a + c[4], 0) + (r.length - 1) * GAP }));
      const tot = sum(), k = Math.min(1, avail / tot);
      /* leftover height is shared out evenly above, between and below the rows */
      const slot = nav ? Math.max(0, avail - tot * k) / (rows.length + 1) : 0;
      let y = sp.at === 'bottom' ? H - tot * k : TOP + (nav ? slot : Math.max(0, (avail - tot * k) / 2));
      g.innerHTML = (sp.bg ? `<div class="ppbg" style="background-image:url('${g.dataset.src}')"></div>` : '') + (sp.html || '');
      const place = (r, kk, y0) => {
        let x = (600 - r.w * kk) / 2;
        r.cs.forEach(([cx, cy, cw, ch, tw, , , fx, o]) => {
          if (o && o.x != null) x = o.x;
          const s = tw * kk / cw, d = document.createElement('div'); d.className = 'ppc' + (sp.fade ? ' fade' : '') + (fx ? ' ' + fx : '');
          Object.assign(d.style, { left: x + 'px', top: y0 + (r.h * kk - ch * s) / 2 + 'px', width: cw * s + 'px', height: ch * s + 'px' });
          const im = document.createElement('img'); im.src = g.dataset.src; im.alt = ''; im.decoding = 'async'; im.draggable = false;
          Object.assign(im.style, { left: -cx * s + 'px', top: -cy * s + 'px', width: 1376 * s + 'px', height: 964 * s + 'px' });
          d.appendChild(im); g.appendChild(d);
          const ox = parseFloat(d.style.left), oy = parseFloat(d.style.top);
          hots.forEach(h => { /* clone tap targets whose centre is inside this crop */
            const mx = h.x + h.w / 2, my = h.y + h.h / 2; if (mx < cx || mx > cx + cw || my < cy || my > cy + ch) return;
            const c = h.el.cloneNode(false); c.removeAttribute('style');
            Object.assign(c.style, { left: ox + (h.x - cx) * s + 'px', top: oy + (h.y - cy) * s + 'px', width: h.w * s + 'px', height: h.h * s + 'px' });
            g.appendChild(c); });
          x += tw * kk + GAP; });
      };
      rows.forEach(r => { place(r, k, y); y += r.h * k + GAP + slot; });
      if (nav) place({ cs: nav, h: navH, w: nav[0][4] }, 1, H - BOT - navH);
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
      new MutationObserver(() => { const was = g.hidden; if (was === img.hidden) return; g.hidden = img.hidden; if (was && !g.hidden) { g.classList.remove('in'); void g.offsetWidth; g.classList.add('in'); } }).observe(img, { attributes: true, attributeFilter: ['hidden'] });
    });
    const sc = host.querySelector(':scope>.scroll'); sc ? host.insertBefore(ppx, sc) : host.appendChild(ppx);
    layout(host);
  }

  const hosts = () => [...qa('#p-monitoring .mtab'), q('#p-military')].filter(Boolean);
  /* Protection: the "more protection" card starts just under the warranty list (CSS reads --ptT) */
  const fitProt = () => { const pg = q('#p-protection'), l = pg && q('.wlist', pg); if (!l || !isPP()) return;
    const v = Math.round(l.offsetTop + l.offsetHeight + 28) + 'px'; if (l.offsetHeight && pg.style.getPropertyValue('--ptT') !== v) pg.style.setProperty('--ptT', v); };
  let lastSig = '';
  function apply() {
    if (!isPP()) return;
    const i = insets(), sig = [window.SH || 0, i.TOP, i.BOT].join(); /* re-lay out only when the height or the insets change */
    hosts().forEach(h => { if (!h.querySelector(':scope>.ppx')) build(h); else if (sig !== lastSig) layout(h); }); lastSig = sig; fitProt();
  }
  apply(); setTimeout(apply, 500); /* again once brand.js has published --brsat */
  addEventListener('resize', () => setTimeout(apply, 60));
  addEventListener('orientationchange', () => setTimeout(apply, 400));
  { const pg = q('#p-protection'); if (pg) new MutationObserver(() => { if (pg.classList.contains('on')) requestAnimationFrame(fitProt); }).observe(pg, { attributes: true, attributeFilter: ['class'] }); }
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
