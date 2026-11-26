/* SHP page hero: a pixel-art side-scroller behind the four app tiles. A Vivint rep (green polo, tablet) walks a
   cookie-cutter street, steps up to every door, knocks, and a spinning coin pops out, arcs up and flies into the coin
   counter. The street loops forever. All art is original and drawn in code (sprite strings + pixel rects); nothing is
   loaded. It renders to a tiny low-res canvas (about 200-400 px wide) scaled up with crisp pixels, at ~30 fps, paused
   when the page is hidden or the hero is scrolled away, and holds one still frame for reduced motion.
   window.__hero = { t(sec), stop(), start(), info() } for scripted checks. */
(function () {
  var hero = document.querySelector('.hero'); if (!hero) return;
  var wrap = document.createElement('div'); wrap.className = 'hscene'; wrap.setAttribute('aria-hidden', 'true');
  var cv = document.createElement('canvas'); wrap.appendChild(cv); hero.insertBefore(wrap, hero.firstChild);
  var ctx = cv.getContext('2d', { alpha: false }); if (!ctx) return;
  var M = Math, floor = M.floor, round = M.round, sin = M.sin, min = M.min, max = M.max, PI = M.PI;
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }

  /* ---------------- palette ---------------- */
  var K = '#1b1f2e', PAL = { K: K, H: '#6b3a1e', S: '#ffc08a', s: '#e0915e', W: '#ffffff', G: '#05e5af', g: '#03a07c', L: '#dfff1a',
    P: '#2e3f78', p: '#1f2c58', T: '#2b2f3e', Q: '#8ff7e0', Y: '#ffd23f', y: '#e09a12', o: '#b86e0a', w: '#fff6c2' };
  function spr(rows, x0, y0, c) {   // paint a sprite string block
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) { var k = rows[y][x]; if (k !== '.') R(c, x0 + x, y0 + y, 1, 1, PAL[k]); }
  }

  /* ---------------- the rep (14 x 23): head 10 rows, torso 7, legs 4 ---------------- */
  var HEAD = {
    side: ['....KKKKKK....', '...KHHHHHHK...', '..KHHHHHHHHK..', '..KHHHHSSSSK..', '..KHHHSSSWKSK.', '..KHsHSSSWKSK.', '..KHSSSSSSSSSK', '..KSSSSSSKKKK.', '...KSSSSSSSK..', '....KKKKKKK...'],
    front: ['....KKKKKK....', '...KHHHHHHK...', '..KHHHHHHHHK..', '..KHSSSSSSHK..', '.KSSWKSSWKSSK.', '.KsSWKSSWKSsK.', '..KSSSSSSSSK..', '..KSSKKKKSSK..', '...KSSSSSSK...', '....KKKKKK....'],
    back: ['....KKKKKK....', '...KHHHHHHK...', '..KHHHHHHHHK..', '..KHHHHHHHHK..', '.KSHHHHHHHHSK.', '.KsHHHHHHHHsK.', '..KHHHHHHHHK..', '..KSHHHHHHSK..', '...KSSSSSSK...', '....KKKKKK....'] };
  var BODY = {
    side: ['....KGGGGGK...', '...KGGGGGGGK..', '...KGgGGLGGK..', '...KGgGGGGSTTK', '...KGgGGGGSTQK', '...KGSKGGGKTTK', '...KPPPPPPPK..'],
    front: ['....KKGGKK....', '...KGGSSGGK...', '...KGGGGGLK...', '...KGGGGGGK...', '...KGGGGGGK...', '...KKKKKKKK...', '...KPPPPPPK...'],
    back: ['....KKGGKK....', '...KGGGGGGK...', '...KGGGGGGK...', '...KGGGGGGK...', '...KGgGGgGK...', '...KKKKKKKK...', '...KPPPPPPK...'] };
  var LEGS = {
    a: ['...KPPKKppK...', '..KPPK..KppK..', '.KPPK....KppK.', '.KWWK....KWWWK'],
    b: ['....KPPppK....', '....KPPpK.....', '....KPPpK.....', '....KWWWWK....'],
    a2: ['...KppKKPPK...', '..KppK..KPPK..', '.KppK....KPPK.', '.KWWK....KWWWK'],
    st: ['...KPPKKPPK...', '...KPPKKPPK...', '...KPPKKPPK...', '..KWWWKKWWWK..'],
    st2: ['...KPPKKPPK...', '...KPPKKPPK...', '...KPPK.KWWK..', '..KWWWK.......'],
    jump: ['...KPPKKPPK...', '..KWWWKKWWWK..', '..............', '..............'] };
  var ARM_DN = ['.K.', 'KGK', 'KGK', 'KgK', 'KSK', 'KSK', '.K.'], ARM_UP = ['.K.', 'KSK', 'KSK', 'KgK', 'KGK', 'KGK', 'KGK', '.K.'];
  function rep(head, body, legs, bob, arms, tab) {   // -> 14 x 23 canvas, feet on the last row
    var c = mk(14, 23), x = c.getContext('2d'), top = 23 - 21 - (bob || 0);
    spr(LEGS[legs], 0, 19, x);
    spr(BODY[body], 0, top + 10, x);
    spr(HEAD[head], 0, top, x);
    (arms || []).forEach(function (a) { spr(a[0] ? ARM_UP : ARM_DN, a[1], top + 10 + (a[0] ? -6 + (a[2] || 0) : 0), x); });
    if (tab) spr(['KKKK', 'KQQK', 'KQQK', 'KKKK'], 0, top + 1, x);
    return c;
  }
  var DN = [[0, 1], [0, 10]];
  var SP = {
    walk: [rep('side', 'side', 'a', 0), rep('side', 'side', 'b', 1), rep('side', 'side', 'a2', 0), rep('side', 'side', 'b', 1)],
    back: [rep('back', 'back', 'st', 0, DN), rep('back', 'back', 'st2', 1, DN)],
    knock: [rep('back', 'back', 'st', 0, [[0, 1], [1, 10, 0]]), rep('back', 'back', 'st', 0, [[0, 1], [1, 10, 2]])],
    front: [rep('front', 'front', 'st', 0, DN), rep('front', 'front', 'st2', 1, DN)],
    cheer: rep('front', 'front', 'jump', 0, [[1, 1], [1, 10]], true) };

  /* ---------------- coin: width-squash spin frames (8 x 10) ---------------- */
  var COIN = [8, 6, 4, 2, 4, 6].map(function (w, i) {
    var c = mk(8, 10), x = c.getContext('2d');
    for (var r = 0; r < 10; r++) {
      var e = 1 - M.pow((r - 4.5) / 5, 2), hw = M.max(.5, w / 2 * M.sqrt(e)), a = round(4 - hw), b = round(4 + hw);
      if (b - a < 1) { a = 3; b = 5; }
      R(x, a, r, b - a, 1, K);
      if (r > 0 && r < 9 && b - a > 2) {
        R(x, a + 1, r, b - a - 2, 1, i > 3 ? PAL.y : PAL.Y);
        if (b - a > 4) { R(x, a + 1, r, 1, 1, PAL.w); R(x, b - 2, r, 1, 1, PAL.o); if (w === 8 && r > 2 && r < 7) R(x, 4, r, 1, 1, PAL.o); }
      } else if (r > 0 && r < 9) R(x, a, r, b - a, 1, PAL.y);
    }
    return c;
  });

  /* ---------------- houses: one cookie cutter, five paint jobs (96 x 58, base on the last row) ---------------- */
  var HW = 96, HH = 58, DOORX = 71, PS = 118;   // door centre in the house, house spacing
  var PAINT = [['#ff8a65', '#d9684a', '#c23b4a', '#8e2a3a', '#2f6fd6', '#2152a8'], ['#6ab8ff', '#4a90d9', '#3a4f9c', '#2c3c7a', '#e04848', '#a83030'],
    ['#ffd65c', '#d9ac3a', '#b0592f', '#7f3e22', '#2f9a58', '#217040'], ['#7fe0a0', '#55b87a', '#2c7f6e', '#1f5f52', '#e8822a', '#b05e18'],
    ['#c5a2ff', '#9874e0', '#5d3f96', '#462e75', '#d63a78', '#a02656']];
  var TRIM = '#fff8ec', GL = '#9fe3ff', GL2 = '#59b4e0';
  function window_(c, x, y, w, h) {
    R(c, x - 1, y - 1, w + 2, h + 2, TRIM); R(c, x, y, w, h, K); R(c, x + 1, y + 1, w - 2, h - 2, GL);
    R(c, x + 1, y + h - 3, w - 2, 2, GL2);
    R(c, x + (w >> 1), y + 1, 1, h - 2, TRIM); R(c, x + 1, y + (h >> 1), w - 2, 1, TRIM);
    R(c, x + 2, y + 2, 2, 1, '#fff'); R(c, x + 2, y + 3, 1, 1, '#fff');
    R(c, x - 2, y + h + 1, w + 4, 2, TRIM); R(c, x - 2, y + h + 3, w + 4, 1, K);
  }
  var HOUSES = PAINT.map(function (p) {
    var cn = mk(HW, HH), c = cn.getContext('2d'), b = HH;   // b: one past the bottom row
    // garage (left) with a shallow roof and a panelled door
    R(c, 0, b - 26, 31, 26, K); R(c, 1, b - 25, 29, 25, p[1]);
    for (var i = b - 22; i < b; i += 4) R(c, 1, i, 29, 1, p[0]);
    R(c, 0, b - 30, 32, 5, K); R(c, 1, b - 29, 30, 3, p[2]); R(c, 1, b - 27, 30, 1, p[3]);
    R(c, 4, b - 20, 22, 20, K); R(c, 5, b - 19, 20, 19, '#f4f1ea');
    for (i = b - 15; i < b; i += 4) R(c, 5, i, 20, 1, '#c9c3b6');
    // chimney (behind the roof)
    R(c, 71, b - 54, 9, 14, K); R(c, 72, b - 53, 7, 13, '#c8664e'); R(c, 72, b - 50, 7, 1, '#9c4a38'); R(c, 72, b - 46, 7, 1, '#9c4a38'); R(c, 70, b - 55, 11, 2, K);
    // house body with siding lines
    R(c, 27, b - 32, 67, 32, K); R(c, 28, b - 31, 65, 31, p[0]);
    for (i = b - 28; i < b; i += 4) R(c, 28, i, 65, 1, p[1]);
    // gable roof: a pixel staircase with shingle rows
    for (var r = 0; r <= 20; r++) {
      var y = b - 52 + r, hw = 2 + round(r * 1.6), cx = 60;
      R(c, cx - hw - 1, y, hw * 2 + 3, 1, K);
      if (r > 0 && r < 20) R(c, cx - hw, y, hw * 2 + 1, 1, r % 4 === 3 ? p[3] : p[2]);
    }
    R(c, 56, b - 46, 9, 7, K); R(c, 57, b - 45, 7, 5, TRIM); R(c, 60, b - 45, 1, 5, K); R(c, 57, b - 43, 7, 1, K);   // attic vent
    // front door with frame, panels and knob; porch step
    R(c, 64, b - 21, 15, 21, TRIM); R(c, 65, b - 20, 13, 20, K); R(c, 66, b - 19, 11, 19, p[4]);
    R(c, 67, b - 17, 4, 7, p[5]); R(c, 72, b - 17, 4, 7, p[5]); R(c, 67, b - 8, 4, 6, p[5]); R(c, 72, b - 8, 4, 6, p[5]);
    R(c, 75, b - 10, 1, 1, PAL.Y);
    R(c, 61, b - 2, 21, 2, '#d8d4c8'); R(c, 61, b - 3, 21, 1, K);
    window_(c, 33, b - 25, 22, 13); window_(c, 82, b - 25, 8, 13);
    return cn;
  });
  function openDoor(c, x, b, amt) {   // a warm doorway; the slab swings in
    R(c, x + 66, b - 19, 11, 19, '#ffcf6b'); R(c, x + 66, b - 19, 11, 2, '#e0a040');
    var w = max(2, round(11 * (1 - amt))); R(c, x + 66, b - 19, w, 19, K); R(c, x + 66, b - 19, w - 1, 19, '#3a2a40');
  }

  /* ---------------- props ---------------- */
  function blobs(w, h, list, cols, outline) {   // rasterised circle clusters: clouds, trees, bushes
    var cn = mk(w, h), c = cn.getContext('2d'), inside = function (x, y) { for (var i = 0; i < list.length; i++) { var q = list[i], dx = x + .5 - q[0], dy = y + .5 - q[1]; if (dx * dx + dy * dy <= q[2] * q[2]) return q; } return null; };
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var q = inside(x, y);
      if (q) { var lit = (x + .5 - q[0]) + (y + .5 - q[1]) < -q[2] * .45, dk = y > h * cols[3]; R(c, x, y, 1, 1, lit ? cols[2] : dk ? cols[1] : cols[0]); if (!lit && !dk && (x * 7 + y * 3) % 11 === 0) R(c, x, y, 1, 1, cols[1]); }
      else if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) R(c, x, y, 1, 1, outline);
    }
    return cn;
  }
  var CLOUD = blobs(34, 15, [[8, 9, 5.5], [16, 7, 6.8], [25, 8.5, 6], [13, 11, 4], [21, 11, 4.2]], ['#ffffff', '#d4ecff', '#ffffff', .78], '#7fbef0');
  var CLOUD2 = blobs(22, 11, [[6, 7, 4.2], [12, 5.5, 5], [17, 7, 4]], ['#ffffff', '#d4ecff', '#ffffff', .75], '#7fbef0');
  var TREE = (function () {
    var cn = mk(26, 34), c = cn.getContext('2d');
    R(c, 11, 18, 5, 16, K); R(c, 12, 18, 3, 16, '#8a5a34'); R(c, 12, 18, 1, 16, '#a8744a');
    c.drawImage(blobs(26, 24, [[13, 9, 8], [7, 14, 6.5], [19, 14, 6.5], [13, 16, 6]], ['#3cc85a', '#24994a', '#7ce06a', .7], K), 0, 0);
    return cn;
  })();
  var BUSH = blobs(16, 9, [[4.5, 5.5, 3.8], [8, 4.5, 4.2], [11.5, 5.5, 3.8]], ['#34b856', '#228a42', '#6ad466', .72], K);

  // far hills + a distant row of rooftops, pre-rendered as seamless strips
  var STRIP = 480;
  function strip(fn, h) { var cn = mk(STRIP, h), c = cn.getContext('2d'); fn(c, h); return cn; }
  var HILLS = strip(function (c, h) {
    for (var x = 0; x < STRIP; x++) {
      var t = x / STRIP * PI * 2, y = round(h - 9 - 6 * sin(t * 3) - 4 * sin(t * 7 + 1) - 2 * sin(t * 13 + 2));
      R(c, x, y, 1, h - y, '#7fd09c'); R(c, x, y, 1, 1, '#b2ecc2'); if ((x + y) % 5 === 0) R(c, x, y + 3, 1, 1, '#6bbd89');
    }
  }, 26);
  var PEAKS = strip(function (c, h) {   // far faceted mountains with snow caps
    var pk = [], r = 11;
    for (var i = 0; i < 9; i++) { r = (r * 16807) % 2147483647; pk.push([i * STRIP / 9 + (r % 30), 18 + (r % 26)]); }
    for (var x = 0; x < STRIP; x++) {
      var best = 0, side = 0;
      pk.forEach(function (q) { for (var w = -1; w <= 1; w++) { var d = x - q[0] - w * STRIP, v = q[1] - M.abs(d) * .9; if (v > best) { best = v; side = d; } } });
      var y = round(h - best); if (y >= h) continue;
      R(c, x, y, 1, h - y, side < 0 ? '#8fa9ea' : '#7590d6');
      if (best > 24) R(c, x, y, 1, min(4, best - 24), side < 0 ? '#f4f8ff' : '#d6e2fb');
    }
  }, 46);
  var ROWS = strip(function (c, h) {
    for (var i = 0; i < STRIP / 24; i++) {
      var x = i * 24 + 2, wh = 6 + (i * 5 % 3), col = ['#6aa3d6', '#5f97cc', '#74acdc'][i % 3];
      for (var r = 0; r < 6; r++) R(c, x + 6 - r * 1.4 | 0, h - wh - 6 + r, 8 + r * 2.8 | 0, 1, '#4d82b8');
      R(c, x, h - wh, 17, wh, col); R(c, x + 3, h - wh + 2, 2, 2, '#c7e4ff'); R(c, x + 11, h - wh + 2, 2, 2, '#c7e4ff');
      R(c, x + 18, h - 5, 6, 5, '#4f9c74');
    }
  }, 18);

  /* ---------------- pixel font for the coin counter (3 x 5, original) ---------------- */
  var FONT = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111',
    6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111', x: '000101010101000' };
  function text(s, x, y, b, col) {
    for (var i = 0; i < s.length; i++) { var g = FONT[s[i]]; for (var j = 0; j < 15; j++) if (g[j] === '1') R(ctx, x + i * 4 * b + (j % 3) * b, y + floor(j / 3) * b, b, b, col); }
  }

  /* ---------------- timeline: one house per cycle ---------------- */
  var SPD = 46, D = [PS / SPD, .32, .85, 1.35, .32, .12];   // walk, step up, knock, coin, step down, pause
  var CYC = D.reduce(function (a, b) { return a + b; }), COINAT = D[0] + D[1] + D[2], GOT = COINAT + D[3] * .78;
  var LEAD = (PS - D[0] / CYC * PS) / 2;
  function ease(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }

  /* ---------------- layout ---------------- */
  var W = 0, H = 0, S = 2, LW = 0, LH = 0, G = 0, now = 0, cnt = { x: 0, y: 0, b: 1 };
  function layout() {
    var hr = hero.getBoundingClientRect(), br = hero.querySelector('.brand'), cr = hero.querySelector('.cards');
    var bb = br ? br.getBoundingClientRect() : { bottom: hr.top + 90, right: hr.right - 20 }, gy = cr ? cr.getBoundingClientRect().top - hr.top : hr.height * .55;
    W = round(hr.width); H = round(hr.height);
    var band = max(60, gy - (bb.bottom - hr.top));
    S = max(2, min(6, round(min(band / 88, W / (H > W && W >= 700 ? 200 : 270)))));   // iPad portrait: bigger pixels, the street fills the band
    LW = M.ceil(W / S); LH = M.ceil(H / S);
    if (cv.width !== LW || cv.height !== LH) { cv.width = LW; cv.height = LH; }
    var cw = LW * S + 'px', ch = LH * S + 'px'; if (cv.style.width !== cw || cv.style.height !== ch) { cv.style.width = cw; cv.style.height = ch; }
    G = floor((gy - 2) / S) - 8;   // sidewalk top: the 8-row sidewalk ends just above the tiles
    cnt.b = max(1, round(18 / (5 * S)));
    cnt.y = round((bb.bottom - hr.top + 12) / S); cnt.x = floor((bb.right - hr.left) / S);
    var ft = round(gy + 4) + 'px'; if (wrap.style.getPropertyValue('--ft') !== ft) wrap.style.setProperty('--ft', ft);
    ctx.imageSmoothingEnabled = false;
  }

  /* ---------------- frame ---------------- */
  var SKY = ['#2f6fe8', '#4389f2', '#5ea4fa', '#7dbfff', '#a3dbff'];
  function draw(t) {
    if (!LW) return;
    var k = floor(t / CYC), u = t - k * CYC, cam = k * PS + DOORX + (u / CYC) * PS - PS + LEAD, ox = round(LW / 2 - cam);
    var hz = G - 16, i, x, y;
    // sky in dithered bands
    var bh = max(1, hz / SKY.length);
    for (i = 0; i < SKY.length; i++) { y = round(i * bh); R(ctx, 0, y, LW, round((i + 1) * bh) - y + 1, SKY[i]); if (i) for (x = (y & 1); x < LW; x += 2) R(ctx, x, y, 1, 1, SKY[i - 1]); }
    // clouds drift on their own and a little with the camera
    var nc = max(4, min(12, round(hz / 18)));
    for (i = 0; i < nc; i++) {
      var span = LW + 80, cxp = ((i * 97 + 40 - t * (2 + i % 3) - cam * .08) % span + span) % span - 40;
      var cyp = round((hz - 40) * (.12 + ((i * 37) % 70) / 100));
      ctx.drawImage(i % 2 ? CLOUD2 : CLOUD, round(cxp), cyp);
    }
    // parallax strips
    var o1 = ((-round(cam * .2)) % STRIP + STRIP) % STRIP, o2 = ((-round(cam * .45)) % STRIP + STRIP) % STRIP;
    var o0 = ((-round(cam * .08)) % STRIP + STRIP) % STRIP;
    // layers rise above the rooftops; each one's base is filled down to the lawn so nothing floats in the gaps
    var yP = hz - 46 - 34, yH = hz - 26 - 16, yR = hz - 18 - 6;
    for (x = o0 - STRIP; x < LW; x += STRIP) ctx.drawImage(PEAKS, x, yP);
    R(ctx, 0, yP + 46, LW, hz - yP - 46, '#7590d6');
    for (x = o1 - STRIP; x < LW; x += STRIP) ctx.drawImage(HILLS, x, yH);
    R(ctx, 0, yH + 26, LW, hz - yH - 26, '#7fd09c');
    for (x = o2 - STRIP; x < LW; x += STRIP) ctx.drawImage(ROWS, x, yR);
    R(ctx, 0, yR + 18, LW, hz - yR - 18, '#6bbd89');
    // lawn with mown stripes, sidewalk, curb, road
    R(ctx, 0, hz, LW, G - hz, '#4cc85e');
    for (x = ((ox % 16) + 16) % 16 - 16; x < LW; x += 16) R(ctx, x, hz, 8, G - hz, '#58d26a');
    R(ctx, 0, hz, LW, 1, '#3aa84e');
    R(ctx, 0, G, LW, 8, '#e4e2da'); R(ctx, 0, G, LW, 1, '#ffffff'); R(ctx, 0, G + 7, LW, 1, '#b8b6ae');
    for (x = ((ox % 12) + 12) % 12; x < LW; x += 12) R(ctx, x, G + 1, 1, 6, '#c2c0b8');
    R(ctx, 0, G + 8, LW, 2, '#8d8f96'); R(ctx, 0, G + 10, LW, LH - G - 10, '#2a2e38');

    var base = G - 6, k0 = floor((cam - LW / 2 - HW - 40) / PS), k1 = M.ceil((cam + LW / 2 + 20) / PS);
    var s = state(u, k);
    for (var h = k0; h <= k1; h++) {
      var hx = h * PS + ox, v = ((h % 5) + 5) % 5;
      R(ctx, hx + DOORX - 5, base, 11, G - base, '#f1e2c4'); R(ctx, hx + DOORX - 5, base, 1, G - base, '#d8c4a0');   // path
      R(ctx, hx + 5, base, 20, G - base, '#c9cbcf');                                                                   // driveway
      for (x = hx + 96; x < hx + 116; x += 3) { R(ctx, x, base - 9, 2, 9, TRIM); R(ctx, x, base - 10, 1, 1, TRIM); }   // picket fence
      R(ctx, hx + 95, base - 6, 22, 1, TRIM); R(ctx, hx + 95, base - 3, 22, 1, TRIM);
      ctx.drawImage(HOUSES[v], hx, base - HH);
      if (h === k && s.door > 0) openDoor(ctx, hx, base, s.door);
      ctx.drawImage(BUSH, hx + 34, base - 7); ctx.drawImage(BUSH, hx + 46, base - 6);
      ctx.drawImage(TREE, hx + 93, base - 31);
      R(ctx, hx + 84, G - 9, 2, 10, K); R(ctx, hx + 80, G - 14, 9, 6, K); R(ctx, hx + 81, G - 13, 7, 4, '#4a5a78'); R(ctx, hx + 88, G - 15, 1, 4, '#e04848');   // mailbox
    }
    // the rep, with a blob shadow
    var rx = round(s.x + ox), fy = round(s.fy);
    ctx.globalAlpha = .28; R(ctx, rx - 5, round(s.gy), 10, 2, '#000'); R(ctx, rx - 4, round(s.gy) + 2, 8, 1, '#000'); ctx.globalAlpha = 1;
    ctx.drawImage(s.spr, rx - 7, fy - 22);
    if (s.knockFx) { var kx = rx + 6, ky = fy - 22; R(ctx, kx + 3, ky - 1, 2, 1, '#fff'); R(ctx, kx + 4, ky + 2, 3, 1, '#fff'); R(ctx, kx + 3, ky + 5, 2, 1, '#fff'); }
    // the coin and its sparkles
    var got = max(0, floor((t - GOT) / CYC) + 1), b = cnt.b, str = '' + min(got, 99999), tw2 = str.length * 4 * b - b;
    var ph = max(14, 5 * b + 6), pw = tw2 + 19, px = cnt.x - pw, py = cnt.y;   // the counter plate
    if (s.coin >= 0) {
      var c = s.coin, ccx, ccy, sx = rx - 4;
      if (c < .28) { var e = 1 - M.pow(1 - c / .28, 3); ccx = sx + e * 3; ccy = fy - 22 - e * 20; }
      else if (c < .62) { ccx = sx + 3; ccy = fy - 42 + round(sin((c - .28) * 18)); }
      else { var f = ease((c - .62) / .16); ccx = sx + 3 + (px + 3 - sx - 3) * f; ccy = fy - 42 + (py + ((ph - 10) >> 1) - fy + 42) * f - sin(f * PI) * 10; }
      if (c < .78) ctx.drawImage(COIN[floor(t * 14) % 6], round(ccx), round(ccy));
      if (c > .2 && c < .7) for (i = 0; i < 3; i++) { var a = t * 3 + i * 2.1, tw = (floor(t * 8) + i) % 3; sparkle(round(ccx + 4 + M.cos(a) * 9), round(ccy + 5 + sin(a) * 8), tw); }
    }
    // coin counter: a Vivint-green pill with the coin and the count in the pixel font
    var bump = (s.coin > .78 && s.coin < .9) ? -1 : 0, y0 = py + bump;
    R(ctx, px + 1, y0 + 1, pw, ph, 'rgba(0,0,0,.3)');                         // soft drop
    R(ctx, px + 1, y0, pw - 2, ph, '#05e5af'); R(ctx, px, y0 + 1, pw, ph - 2, '#05e5af');
    R(ctx, px + 2, y0 + 1, pw - 4, 1, '#8ff7e0'); R(ctx, px + 1, y0 + ph - 2, pw - 2, 1, '#03b88c');
    ctx.drawImage(COIN[0], px + 3, y0 + ((ph - 10) >> 1));
    text(str, px + 14, y0 + ((ph - 5 * b) >> 1), b, '#04241e');
    if (s.coin > .78 && s.coin < .95) sparkle(px + 7, y0 + (ph >> 1), floor(t * 10) % 3);
  }
  function sparkle(x, y, f) {
    var c = f === 2 ? PAL.Y : '#ffffff', r = f === 1 ? 3 : 2;
    R(ctx, x - r, y, r * 2 + 1, 1, c); R(ctx, x, y - r, 1, r * 2 + 1, c); if (f === 1) R(ctx, x, y, 1, 1, PAL.Y);
  }
  function state(u, k) {
    var door = k * PS + DOORX, s = { x: door, fy: G + 6, gy: G + 6, spr: SP.front[0], coin: -1, door: 0, knockFx: false }, e = 0;
    if (u < (e += D[0])) { s.x = door - PS + SPD * u; s.spr = SP.walk[floor(u * 9) % 4]; }
    else if (u < (e += D[1])) { var q = (u - e + D[1]) / D[1]; s.fy = s.gy = G + 6 - q * 11; s.spr = SP.back[floor(q * 4) % 2]; }
    else if (u < (e += D[2])) { var q2 = (u - e + D[2]) / D[2], kk = floor(q2 * 6); s.fy = s.gy = G - 5; s.spr = kk === 0 || kk === 5 ? SP.back[0] : SP.knock[kk % 2]; s.knockFx = kk % 2 === 0 && kk > 0 && kk < 5; }
    else if (u < (e += D[3])) {
      var c = (u - e + D[3]) / D[3]; s.fy = s.gy = G - 5; s.coin = c; s.door = ease(c / .15) * (1 - ease((c - .82) / .18)) * .85;
      if (c < .14) s.spr = SP.back[0];
      else if (c < .24) s.spr = SP.front[0];
      else if (c < .62) { s.spr = SP.cheer; s.fy -= sin((c - .24) / .38 * PI) * 7; }
      else s.spr = SP.front[0];
    }
    else if (u < (e += D[4])) { var q3 = (u - e + D[4]) / D[4]; s.fy = s.gy = G - 5 + q3 * 11; s.spr = SP.front[floor(q3 * 4) % 2]; }
    else s.spr = SP.walk[0];
    return s;
  }

  /* ---------------- loop: ~30 fps, only while visible ---------------- */
  var run = false, raf = 0, last = 0, onScreen = true, rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  var STILL = CYC * 4 + COINAT + D[3] * .45;   // mid-cheer, coin spinning, a few coins on the counter
  function tick(ts) {
    raf = requestAnimationFrame(tick);
    if (!last) { last = ts; return; }
    var dt = ts - last; if (dt < 31) return;
    last = ts; now += min(dt, 100) / 1000; draw(now);
  }
  function want() { return onScreen && !document.hidden && !(rm && rm.matches); }
  function sync() {
    if (want() && !run) { run = true; last = 0; raf = requestAnimationFrame(tick); }
    else if (!want() && run) { run = false; cancelAnimationFrame(raf); }
    if (rm && rm.matches) { now = STILL; draw(now); }
  }
  document.addEventListener('visibilitychange', sync);
  addEventListener('pagehide', function () { run = false; cancelAnimationFrame(raf); });
  addEventListener('pageshow', sync);
  if (rm) (rm.addEventListener ? rm.addEventListener('change', sync) : rm.addListener && rm.addListener(sync));
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var v = es[es.length - 1].isIntersecting; if (v !== onScreen) { onScreen = v; sync(); } }).observe(wrap);
  var rq = 0; function later() { if (!rq) rq = requestAnimationFrame(function () { rq = 0; layout(); draw(now); }); }
  if ('ResizeObserver' in window) new ResizeObserver(later).observe(hero); else addEventListener('resize', later);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  now = (rm && rm.matches) ? STILL : D[0] * .35;
  layout(); draw(now); sync();
  window.__hero = { t: function (x) { now = x; draw(now); }, stop: function () { onScreen = false; sync(); }, start: function () { onScreen = true; sync(); },
    info: function () { return { W: W, H: H, S: S, LW: LW, LH: LH, G: G, run: run, cyc: CYC, still: STILL, coinAt: COINAT }; } };
})();
