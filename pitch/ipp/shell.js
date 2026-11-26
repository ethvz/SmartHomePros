/* iPad portrait (html.ipp) behaviour: shell group. Only act when document.documentElement.classList.contains("ipp"). */
(function () {
  const H = document.documentElement, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const IPP = () => H.classList.contains('ipp');
  const st = $('#stage');

  /* ---- All Products grid on the upright stage: the landscape grid's three columns become two, so every tile keeps
     roughly its landscape size and the grid runs down to the footer:
       row 1  Outdoor Camera Pro            | Doorbell | Indoor
       row 2  3 x 3 sensors                 | Smart Hub, then Keypad | App
       row 3  Lock | Garage / Therm | Plug  | Outdoor Camera Pro with Spotlight                                          ---- */
  const grid = () => {
    const SH = window.SH || 1485, W = 1032, G = 14, X0 = 20.6, Y0 = 51;
    const foot = parseFloat(getComputedStyle(st).getPropertyValue('--ippFoot')) || 84;
    const Y1 = SH - foot, cw = (W - 2 * X0 - G) / 2, half = (cw - G) / 2, x1 = X0 + cw + G;
    const A = Y1 - Y0 - 2 * G, h1 = Math.round(A * 0.29), h2 = Math.round(A * 0.40), h3 = A - h1 - h2;
    const y2 = Y0 + h1 + G, y3 = y2 + h2 + G, P = {};
    P.ocp = [X0, Y0, cw, h1]; P.dbcp = [x1, Y0, half, h1]; P.icp = [x1 + half + G, Y0, half, h1];
    const sw = (cw - 2 * G) / 3, sh = (h2 - 2 * G) / 3;
    [['motion', 'glass', 'window'], ['water', 'smokeco', 'fire'], ['pendant', 'fob', 'chime']].forEach((r, ri) =>
      r.forEach((k, ci) => P[k] = [X0 + ci * (sw + G), y2 + ri * (sh + G), sw, sh]));
    const kh = Math.round((h2 - G) * 0.45), hh = h2 - G - kh;
    P.shp2 = [x1, y2, cw, hh]; P.keypad = [x1, y2 + hh + G, half, kh]; P.app = [x1 + half + G, y2 + hh + G, half, kh];
    const rh = (h3 - G) / 2;
    P.lock = [X0, y3, half, rh]; P.garage = [X0 + half + G, y3, half, rh]; P.therm = [X0, y3 + rh + G, half, rh]; P.plug = [X0 + half + G, y3 + rh + G, half, rh];
    P.ocspot = [x1, y3, cw, h3];
    return P;
  };
  /* ---- whole products: the landscape artwork of these tiles is cropped (camera heads, keypad/app bottoms, hub frame) and
     carries a baked-in name. Add the whole cut-out (assets/cat, same kind as every other tile) + a live name;
     ipp/shell.css shows them only in ipp, sized like the other cut-outs. Built once, never rewritten. ---- */
  const NAME = { ocp: 'Outdoor Camera Pro III', ocspot: 'Outdoor Camera Pro III with Spotlight', keypad: 'Keypad', app: 'Vivint App', shp2: 'Smart Hub Pro II' };
  const HUB = { all: 'shp2_home', sensors: 'shp2_sens', smart: 'shp2_home', cams: 'shp2_cam' };
  const whole = () => {
    $$('#allTiles .ht[data-k], .hcat .ht[data-k]').forEach(t => {
      const k = t.dataset.k; if (!NAME[k] || t.querySelector(':scope>.ippalt')) return;
      const pane = t.closest('.hcat'), src = k === 'shp2' ? HUB[pane ? pane.dataset.c : 'all'] : k;
      t.insertAdjacentHTML('beforeend', '<img class="cp ippalt ipp-' + k + '" src="assets/cat/' + src + '.webp?v=176" alt="" draggable="false"><div class="cl ippalt">' + NAME[k] + '</div>');
    });
  };
  whole();

  const orig = window.homeLayout;
  if (typeof orig === 'function') {
    window.homeLayout = function () {
      orig.apply(this, arguments);
      if (!IPP()) return;
      const P = grid();
      $$('#allTiles .ht[data-k]').forEach(el => { const r = P[el.dataset.k]; if (!r) return; const [x, y, w, h] = r;
        Object.assign(el.style, { left: x.toFixed(1) + 'px', top: y.toFixed(1) + 'px', width: w.toFixed(1) + 'px', height: h.toFixed(1) + 'px' }); });
    };
    /* landscape <-> portrait: the class flips inside fit(), which then calls homeLayout; also catch a later --ippFoot change */
    window.homeLayout();
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => window.homeLayout(), 120); });
    setTimeout(() => window.homeLayout(), 600);
  }
})();
