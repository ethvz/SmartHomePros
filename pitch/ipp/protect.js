/* iPad portrait (html.ipp) behaviour: protect group. Only act when document.documentElement.classList.contains("ipp"). */
(function () {
  const isIPP = () => document.documentElement.classList.contains('ipp');
  const q = (s, r) => (r || document).querySelector(s), qa = (s, r) => [...(r || document).querySelectorAll(s)];
  const W = 1032;

  /* Protection: an oversized Outdoor Camera Pro peeks into the "more protection" card from its right edge (hidden off iPad portrait) */
  const ptab = q('#p-protection .ptab');
  if (ptab && !q('.ipBleed', ptab)) {
    const im = document.createElement('img'); im.className = 'ipBleed'; im.alt = ''; im.draggable = false; im.decoding = 'async'; im.loading = 'lazy';
    im.src = 'assets/cat/ocp.webp?v=176'; ptab.appendChild(im);
  }

  /* ---- crop composer: a landscape slide (1376 x 964, text baked in) is re-cut into crops stacked down the upright 1032-wide canvas.
     Text crops keep scale 1 (landscape text size); photos and products take the room that is left.
     Crop: [x, y, w, h, tw, y0, y1, cls, opt] in slide coordinates, tw = width on the stage. y0..y1: the crop may grow taller into
     leftover height inside that band. opt: g = may zoom up to g x (photos crop narrower around focal point f; with x / r it grows
     wider instead), x = fixed left edge on the stage, r = share of it kept past the right edge (oversized product bleeding off).
     The sub-tab row (NAV) is pinned just above the footer so its buttons never move between sub-slides. */
  const N1 = [[340, 774, 660, 160, 660, , , 'ft']], N3 = [[262, 774, 800, 160, 800, , , 'ft']];
  /* photo crops (fb) fade out at the bottom: the source slides' dark text mattes leave ragged blotches on the lower part of the photos.
     Products and faces stay left of the footer's section rail (~x 900 on the stage). Baked step lists are shown 1.15x. */
  const SPEC = {
    mon_hero: { html: '<div class="ipmon"><h2>The industry’s most trusted emergency support.</h2></div>', rows: [[[560, 60, 680, 520, W, 0, 964, 'fb']]] },
    mon_home: [[[100, 160, 720, 390, W, 132, 700, 'fb']], [[806, 214, 394, 466, 394, , , 'fe']], N1],
    mon_trained: [[[0, 150, 720, 400, W, 132, 640, 'fb']], [[730, 290, 600, 370, 600, , , 'fe']], N1],
    mon_911: [[[470, 0, 906, 470, W, 0, 470, 'fb']], [[700, 500, 560, 160, 560, , , 'fe']], N1],
    mon_simple: [[[0, 150, 700, 400, W, 132, 600, 'fb']], [[700, 390, 580, 290, 580, , , 'fe']], N1],
    mon_insurance: { bg: 1, rows: [[[60, 460, 760, 230, 760, , , 'fe', { x: 52 }]], [[640, 20, 736, 600, W, 0, 964, 'fb']]] },
    mon_breakin: [[[110, 236, 470, 418, 540, , , , { x: 46 }]], [[588, 140, 788, 600, 700, , , 'bl', { x: 196 }]], N3],
    mon_smoke: [[[110, 230, 560, 380, 644, , , , { x: 46 }]], [[716, 126, 660, 590, 560, , , 'bl', { x: 320 }]], N3],
    mon_water: [[[110, 270, 540, 320, 620, , , , { x: 46 }]], [[700, 160, 676, 440, 640, , , 'bl', { x: 250 }]], N3],
    mon_medical: [[[110, 270, 520, 330, 598, , , , { x: 46 }]], [[640, 250, 736, 420, W, 240, 760, 'fb']], N3],
    mon_duress: [[[110, 260, 540, 400, 620, , , , { x: 46 }]], [[660, 40, 716, 440, W, 0, 730, 'fb']], N3],
    mon_trusted: [[[80, 180, 900, 190, 900]], [[95, 415, 285, 385, 340], [408, 415, 285, 385, 340]], [[722, 415, 285, 385, 340], [1035, 415, 285, 385, 340]]],
    military_hero: { at: 'bottom', fade: 1, rows: [[[604, 272, 746, 692, W, 272, 964]]],
      html: '<div class="ipmil"><h2>We’re proud to protect those who sacrifice to protect us.</h2><ul><li>Special offers for deployed family members</li><li>24/7 monitoring and support</li><li>$4 million in charitable donations to military families</li></ul></div>' }
  };
  const GAP = 24;
  const insets = () => { const cs = getComputedStyle(q('#stage') || document.documentElement);
    const t = parseFloat(cs.getPropertyValue('--ippT')) || 96, f = parseFloat(cs.getPropertyValue('--ippFoot')) || 84;
    return { TOP: t + 8, BOT: f + 12 }; };
  const key = img => (img.getAttribute('src') || '').split('/').pop().split('.')[0];

  function layout(host) {
    const H = window.SH || 1485, box = host.querySelector(':scope>.ipx'); if (!box) return;
    const { TOP } = insets(), BOT = insets().BOT + (host.classList.contains('mtab') ? 40 : 0); /* monitoring: a strip for the next-section arrow */
    qa(':scope>.ipg', box).forEach(g => {
      const sp = SPEC[g.dataset.k], src = sp.rows || sp, hots = g._hots || [];
      const nav = src.length > 1 && (src[src.length - 1] === N1 || src[src.length - 1] === N3) ? src[src.length - 1].map(c => c.slice()) : null;
      const spec = (nav ? src.slice(0, -1) : src).map(r => r.map(c => c.slice()));
      const top = sp.html ? TOP + (g._htmlH || 0) + GAP : TOP;
      const rh = r => Math.max(...r.map(c => c[3] * c[4] / c[2]));
      const sum = () => spec.reduce((a, r) => a + rh(r), 0) + (spec.length - 1) * GAP;
      const navH = nav ? rh(nav) : 0, avail = H - top - BOT - (nav ? navH + GAP : 0);
      let extra = avail - sum();
      /* short screens: photos give up height first (down to 55%) before everything shrinks together */
      spec.forEach(r => r.forEach(c => { if (extra >= -1 || c[5] == null || r.length > 1) return;
        const s = c[4] / c[2], cut = Math.min(c[3] * .45, -extra / s); c[1] += cut / 2; c[3] -= cut; extra += cut * s; }));
      spec.forEach(r => r.forEach(c => { if (extra <= 1 || c[5] == null || r.length > 1) return;
        const s = c[4] / c[2], room = (c[6] - c[5]) - c[3]; if (room <= 0) return;
        const add = Math.min(room, extra / s), up = Math.min(c[1] - c[5], add / 2), dn = Math.min(c[6] - (c[1] + c[3]), add - up), up2 = Math.min(c[1] - c[5], add - dn);
        c[1] -= up2; c[3] += up2 + dn; extra -= (up2 + dn) * s; }));
      spec.forEach(r => r.forEach(c => { const o = c[8]; if (extra <= 1 || !o || !o.g || r.length > 1) return;
        const h = c[3] * c[4] / c[2], f = Math.min(o.g, (h + extra) / h); if (f <= 1.001) return;
        if (o.x != null || o.r != null) c[4] *= f; else { const cw = c[2] / f; c[0] += (c[2] - cw) * (o.f == null ? .5 : o.f); c[2] = cw; }
        extra -= h * (f - 1); }));
      const rows = spec.map(r => ({ cs: r, h: rh(r), w: r.reduce((a, c) => a + c[4], 0) + (r.length - 1) * GAP }));
      const tot = sum(), k = Math.min(1, avail / tot);
      const slot = Math.max(0, avail - tot * k) / (rows.length + 1);
      let y = sp.at === 'bottom' ? H - tot * k : top + slot;
      [...g.children].forEach(c => { if (!c.matches('.ipmil,.ipmon')) c.remove(); });
      if (sp.bg && !g.querySelector('.ipbg')) g.insertAdjacentHTML('afterbegin', `<div class="ipbg" style="background-image:url('${g.dataset.src}')"></div>`);
      const place = (r, kk, y0) => {
        let x = (W - r.w * kk) / 2;
        r.cs.forEach(([cx, cy, cw, ch, tw, , , fx, o]) => {
          if (o && o.x != null) x = o.x; else if (o && o.r != null) x = W - tw * kk * (1 - o.r);
          const s = tw * kk / cw, d = document.createElement('div'); d.className = 'ipc' + (sp.fade ? ' fade' : '') + (fx ? ' ' + fx : '');
          Object.assign(d.style, { left: x + 'px', top: y0 + (r.h * kk - ch * s) / 2 + 'px', width: cw * s + 'px', height: ch * s + 'px' });
          const im = document.createElement('img'); im.src = g.dataset.src; im.alt = ''; im.decoding = 'async'; im.draggable = false;
          Object.assign(im.style, { left: -cx * s + 'px', top: -cy * s + 'px', width: 1376 * s + 'px', height: 964 * s + 'px' });
          d.appendChild(im); g.appendChild(d);
          const ox = parseFloat(d.style.left), oy = parseFloat(d.style.top);
          hots.forEach(h => { const mx = h.x + h.w / 2, my = h.y + h.h / 2; if (mx < cx || mx > cx + cw || my < cy || my > cy + ch) return;
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
    if (host.querySelector(':scope>.ipx')) return;
    const imgs = qa(':scope>img.full', host).filter(i => SPEC[key(i)]); if (!imgs.length) return;
    const hots = qa(':scope>.hot', host).map(el => ({ el, x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: parseFloat(el.style.width), h: parseFloat(el.style.height) }));
    const box = document.createElement('div'); box.className = 'ipx';
    imgs.forEach(img => {
      const g = document.createElement('div'); g.className = 'ipg'; g.dataset.k = key(img); g.dataset.src = img.getAttribute('src'); g.hidden = img.hidden; g._hots = hots;
      const sp = SPEC[g.dataset.k]; if (sp.html) g.innerHTML = sp.html;
      box.appendChild(g);
      /* follow the slide's own sub-tab switching (it toggles [hidden] on the original images); only write when it differs */
      new MutationObserver(() => { const was = g.hidden; if (was === img.hidden) return; g.hidden = img.hidden; if (was && !g.hidden) { g.classList.remove('in'); void g.offsetWidth; g.classList.add('in'); } }).observe(img, { attributes: true, attributeFilter: ['hidden'] });
    });
    const sc = host.querySelector(':scope>.scroll'); sc ? host.insertBefore(box, sc) : host.appendChild(box);
    measureHtml(host); layout(host);
  }
  /* military: the heading block is live HTML; the photo goes under it */
  const measureHtml = host => qa('.ipg', host).forEach(g => { const m = g.querySelector('.ipmil,.ipmon'); if (m && m.offsetHeight) g._htmlH = m.offsetHeight; });

  const hosts = () => [...qa('#p-monitoring .mtab'), q('#p-military')].filter(Boolean);
  /* Protection: the "more protection" card starts just under the warranty list (CSS reads --iptT) */
  const fitProt = () => { const pg = q('#p-protection'), l = pg && q('.wlist', pg); if (!l || !isIPP() || !l.offsetHeight) return;
    const v = Math.round(l.offsetTop + l.offsetHeight + 36) + 'px'; if (pg.style.getPropertyValue('--iptT') !== v) pg.style.setProperty('--iptT', v); };
  let lastSig = '';
  function apply() {
    if (!isIPP()) return;
    const i = insets(), sig = [window.SH || 0, i.TOP, i.BOT].join();
    hosts().forEach(h => { if (!h.querySelector(':scope>.ipx')) build(h); else if (sig !== lastSig) { measureHtml(h); layout(h); } }); lastSig = sig; fitProt();
  }
  apply(); setTimeout(apply, 500); setTimeout(() => { lastSig = ''; apply(); }, 1500); /* fonts / shell insets settle */
  addEventListener('resize', () => setTimeout(apply, 60));
  addEventListener('orientationchange', () => setTimeout(apply, 400));
  { const pg = q('#p-protection'); if (pg) new MutationObserver(() => { if (pg.classList.contains('on')) requestAnimationFrame(fitProt); }).observe(pg, { attributes: true, attributeFilter: ['class'] });
    ['#p-military', '#p-monitoring'].forEach(id => { const pg = q(id); if (pg) new MutationObserver(() => { if (!pg.classList.contains('on') || !isIPP()) return;
      if (qa('.ipg', pg).some(g => g.querySelector('.ipmil,.ipmon') && !g._htmlH)) { lastSig = ''; requestAnimationFrame(apply); } }).observe(pg, { attributes: true, attributeFilter: ['class'] }); }); }
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
