/* SHP page hero: a chunky low-poly street drawn behind the four app tiles. A Vivint rep in a green polo walks door to door,
   knocks, and a spinning gold coin pops out at every house; the street loops forever. Original art in a late-90s
   console-3D style, drawn with a tiny flat-shaded painter's renderer on a 2D canvas (no WebGL, no textures, no assets).
   Light on purpose: <=1.5 DPR, ~30 fps, paused when the page is hidden or the hero is scrolled away, one still frame
   for reduced motion. window.__hero = { t(sec) to jump, frame(), stop(), start(), info() } for scripted checks. */
(function () {
  var hero = document.querySelector('.hero'); if (!hero) return;
  var wrap = document.createElement('div'); wrap.className = 'hscene'; wrap.setAttribute('aria-hidden', 'true');
  var cv = document.createElement('canvas'); wrap.appendChild(cv); hero.insertBefore(wrap, hero.firstChild);
  var ctx = cv.getContext('2d', { alpha: false }); if (!ctx) return;
  var M = Math, sin = M.sin, cos = M.cos, PI = M.PI, max = M.max, min = M.min;

  /* ---------------- tiny math ---------------- */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { var l = M.sqrt(dot(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  // 3x4 matrices [a b c d / e f g h / i j k l]
  function mul(A, B) {
    return [A[0] * B[0] + A[1] * B[4] + A[2] * B[8], A[0] * B[1] + A[1] * B[5] + A[2] * B[9], A[0] * B[2] + A[1] * B[6] + A[2] * B[10], A[0] * B[3] + A[1] * B[7] + A[2] * B[11] + A[3],
            A[4] * B[0] + A[5] * B[4] + A[6] * B[8], A[4] * B[1] + A[5] * B[5] + A[6] * B[9], A[4] * B[2] + A[5] * B[6] + A[6] * B[10], A[4] * B[3] + A[5] * B[7] + A[6] * B[11] + A[7],
            A[8] * B[0] + A[9] * B[4] + A[10] * B[8], A[8] * B[1] + A[9] * B[5] + A[10] * B[9], A[8] * B[2] + A[9] * B[6] + A[10] * B[10], A[8] * B[3] + A[9] * B[7] + A[10] * B[11] + A[11]];
  }
  function T(x, y, z) { return [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z]; }
  function S(x, y, z) { return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0]; }
  function Ry(a) { var c = cos(a), s = sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]; }
  function Rz(a) { var c = cos(a), s = sin(a); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]; }
  function Rx(a) { var c = cos(a), s = sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]; }
  function ap(m, p) { return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3], m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7], m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11]]; }
  function ch(m) { for (var r = [], i = 1; i < arguments.length; i++) m = mul(m, arguments[i]); return m; }

  /* ---------------- meshes (convex, centred) ---------------- */
  var BOX = { v: [[-.5, -.5, -.5], [.5, -.5, -.5], [.5, .5, -.5], [-.5, .5, -.5], [-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]],
              f: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]] };
  // gable roof: ridge along x, base at y=0, width 1 (x) depth 1 (z) height 1
  var ROOF = { v: [[-.5, 0, -.5], [.5, 0, -.5], [.5, 0, .5], [-.5, 0, .5], [-.5, 1, 0], [.5, 1, 0]], f: [[0, 1, 5, 4], [3, 2, 5, 4], [0, 3, 4], [1, 2, 5], [0, 1, 2, 3]] };
  var ICO = (function () {
    var t = (1 + M.sqrt(5)) / 2, v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
    v = v.map(function (p) { var l = M.sqrt(dot(p, p)); return [p[0] / l / 2, p[1] / l / 2, p[2] / l / 2]; });
    return { v: v, f: [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]] };
  })();
  function cyl(n) {   // axis z, radius .5, length 1
    var v = [], f = [], a = [], b = [];
    for (var i = 0; i < n; i++) { var t = i / n * PI * 2 + PI / n; v.push([cos(t) / 2, sin(t) / 2, -.5], [cos(t) / 2, sin(t) / 2, .5]); a.push(i * 2); b.push(i * 2 + 1); f.push([i * 2, (i * 2 + 2) % (2 * n), (i * 2 + 3) % (2 * n), i * 2 + 1]); }
    f.push(a, b); return { v: v, f: f };
  }
  var COIN = cyl(12), FACE = (function () { var c = cyl(12); return { v: c.v, f: c.f.slice(-2) }; })();

  /* ---------------- light ---------------- */
  var L = norm([-.42, .8, .6]);
  function shade(c, n, k0) {
    var d = max(0, dot(n, L)), k = (k0 || .5) + .52 * d + .1 * max(0, n[1]);
    return 'rgb(' + min(255, c[0] * k | 0) + ',' + min(255, c[1] * k | 0) + ',' + min(255, c[2] * k | 0) + ')';
  }
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // turn a mesh + matrix into world faces {p, n, c, b}
  function emit(out, mesh, m, col, bias, jit, rng) {
    var w = mesh.v.map(function (p) { return ap(m, p); }), ctr = ap(m, [0, 0, 0]);
    if (mesh === ROOF) ctr = ap(m, [0, .33, 0]);
    for (var i = 0; i < mesh.f.length; i++) {
      var f = mesh.f[i], p = f.map(function (j) { return w[j]; }), n = norm(cross(sub(p[1], p[0]), sub(p[2], p[0])));
      var fc = cen(p); if (dot(n, sub(fc, ctr)) < 0) n = [-n[0], -n[1], -n[2]];
      var c = typeof col === 'function' ? col(i, n) : col;
      if (jit) { var j = 1 + (rng() - .5) * jit; c = [c[0] * j, c[1] * j, c[2] * j]; }
      out.push({ p: p, n: n, c: c, b: bias || 0, k: fc });
    }
  }
  function cen(p) { var x = 0, y = 0, z = 0; for (var i = 0; i < p.length; i++) { x += p[i][0]; y += p[i][1]; z += p[i][2]; } return [x / p.length, y / p.length, z / p.length]; }
  function quad(out, x0, y0, x1, y1, z, col, bias) {   // a flat decal on a +z facing wall
    out.push({ p: [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], n: [0, 0, 1], c: col, b: bias, k: [(x0 + x1) / 2, (y0 + y1) / 2, z] });
  }
  function boxAt(out, cx, cy, cz, sx, sy, sz, col, bias, extra) { emit(out, BOX, ch(T(cx, cy, cz), extra || S(1, 1, 1), S(sx, sy, sz)), col, bias); }

  /* ---------------- the street ---------------- */
  var P = 12, FRONT = -4, DOORX = 1.15, NV = 6;   // house spacing, front wall z, door offset, variants
  var WALL = [[255, 140, 105], [105, 185, 255], [255, 212, 92], [120, 222, 150], [186, 150, 255], [255, 168, 196]];
  var ROOFC = [[200, 62, 58], [64, 86, 160], [150, 84, 52], [44, 140, 112], [118, 66, 150], [86, 92, 118]];
  var DOORC = [[30, 104, 196], [214, 64, 64], [54, 150, 84], [232, 122, 40], [40, 58, 120], [196, 40, 92]];
  var TRIM = [250, 248, 240], GLASS = [120, 200, 255], LEAF = [[60, 196, 80], [40, 170, 96], [96, 206, 70]];
  function house(v) {
    var o = [], rng = rnd(v * 977 + 13), wc = WALL[v], rc = ROOFC[v];
    // main house: 6.4 wide, 5 deep, 3.2 tall, gable roof
    boxAt(o, 0, 1.6, FRONT - 2.5, 6.4, 3.2, 5, wc);
    emit(o, ROOF, ch(T(0, 3.2, FRONT - 2.5), S(7.2, 2.1, 6)), rc);
    boxAt(o, -1.9, 4.1, FRONT - 3.4, .7, 1.8, .7, [214, 120, 90]);   // brick chimney (behind the ridge line)
    boxAt(o, -1.9, 5.05, FRONT - 3.4, .86, .2, .86, [120, 70, 60]);
    // garage on the left: lower box with its own roof and a white door with panel lines
    boxAt(o, -5.1, 1.3, FRONT - 2.2, 3.8, 2.6, 4.4, wc.map(function (c) { return c * .92; }));
    emit(o, ROOF, ch(T(-5.1, 2.6, FRONT - 2.2), S(4.4, 1.3, 5.2)), rc.map(function (c) { return c * .9; }));
    var z = FRONT + .02;
    quad(o, -6.55, .05, -3.65, 2.15, z, TRIM, .05);
    for (var i = 0; i < 4; i++) quad(o, -6.45, .25 + i * .5, -3.75, .29 + i * .5, z + .01, [200, 200, 196], .08);
    // front: door + frame, porch step, two windows with frames and sills
    quad(o, DOORX - .72, 0, DOORX + .72, 2.36, z, TRIM, .05);
    quad(o, DOORX - .56, .05, DOORX + .56, 2.2, z + .01, [44, 26, 18], .07);   // dark doorway (seen when the door opens)
    boxAt(o, DOORX, .12, FRONT + .45, 2.0, .24, .9, [214, 210, 200]);
    [[-1.6, 1.25], [3.05, .7]].forEach(function (w) {
      var hw = w[1];
      quad(o, w[0] - hw - .14, .92, w[0] + hw + .14, 2.48, z, TRIM, .05);
      quad(o, w[0] - hw, 1.04, w[0] + hw, 2.36, z + .01, GLASS, .08);
      quad(o, w[0] - .04, 1.04, w[0] + .04, 2.36, z + .02, TRIM, .1);
      quad(o, w[0] - hw, 1.66, w[0] + hw, 1.74, z + .02, TRIM, .1);
      boxAt(o, w[0], .86, FRONT + .1, hw * 2 + .5, .12, .24, TRIM);
    });
    // shrubs under the big window, a tree between houses
    [[-2.4, .5], [-.8, .45]].forEach(function (b) { emit(o, ICO, ch(T(b[0], b[1] * .8, FRONT + .55), S(b[1] * 2.1, b[1] * 1.6, b[1] * 1.8)), LEAF[1], 0, .22, rng); });
    var tx = 5.4, tz = FRONT + 1.4;
    boxAt(o, tx, .9, tz, .34, 1.8, .34, [132, 86, 52]);
    emit(o, ICO, ch(T(tx, 2.6, tz), Ry(v), S(2.6, 2.3, 2.6)), LEAF[v % 3], 0, .25, rng);
    emit(o, ICO, ch(T(tx + .15, 3.75, tz - .1), Ry(v + 1), S(1.7, 1.6, 1.7)), LEAF[(v + 1) % 3], 0, .25, rng);
    // mailbox by the sidewalk
    boxAt(o, DOORX + 1.25, .5, .95, .12, 1.0, .12, [90, 70, 50]);
    boxAt(o, DOORX + 1.25, 1.08, .95, .34, .3, .55, [70, 80, 96]);
    boxAt(o, DOORX + 1.44, 1.2, .82, .04, .3, .08, [230, 50, 50]);
    o.forEach(function (f) { f.s = shade(f.c, f.n); });
    // the swinging door is drawn on its own
    return o;
  }
  var HOUSES = []; for (var hv = 0; hv < NV; hv++) HOUSES.push(house(hv));

  /* ---------------- the rep ---------------- */
  var POLO = [8, 214, 164], POLO2 = [4, 170, 130], SKIN = [244, 188, 146], HAIR = [74, 46, 28], PANTS = [44, 54, 80], SHOE = [236, 236, 232], LIME = [223, 255, 26];
  function rep(o, st) {
    // st: x, z, yaw, bob, sq (squash), legA, armA (swing), knock (0..1 right arm raise), up (arms up 0..1), blink
    var root = ch(T(st.x, st.y, st.z), Ry(st.yaw), S(1 / M.sqrt(st.sq), st.sq, 1 / M.sqrt(st.sq)));
    function part(m, cx, cy, cz, sx, sy, sz, col) { emit(o, BOX, ch(m, T(cx, cy, cz), S(sx, sy, sz)), col); }
    [1, -1].forEach(function (s) {   // legs: pivot at the hip, swing about z
      var leg = ch(root, T(0, .86, s * .17), Rz(s * st.legA));
      part(leg, 0, -.36, 0, .27, .72, .27, PANTS);
      part(leg, .07, -.78, 0, .44, .2, .3, SHOE);
    });
    part(root, 0, 1.2, 0, .5, .72, .74, POLO);                       // torso
    part(root, 0, .88, 0, .52, .1, .76, [34, 40, 56]);                // belt
    part(root, .2, 1.52, 0, .14, .1, .4, POLO2);                     // collar
    part(root, .26, 1.34, .2, .02, .14, .14, LIME);                  // badge
    [1, -1].forEach(function (s) {   // arms: s=1 near side (+z, holds the tablet), s=-1 far side (knocks)
      var fwd = -s * st.armA + (s < 0 ? st.knock * 1.65 : 0) + st.up * (s < 0 ? 2.7 : 1.2), side = .1 + st.up * .4;
      var a = ch(root, T(0, 1.5, s * .46), Rx(-s * side), Rz(fwd));
      part(a, 0, -.12, 0, .26, .28, .26, POLO);
      part(a, 0, -.42, 0, .2, .4, .2, SKIN);
      part(a, 0, -.68, 0, .26, .24, .26, SKIN);                      // big friendly hand
      if (s > 0) part(ch(a, T(.16, -.66, .06), Rz(-.15)), 0, 0, 0, .08, .56, .42, [30, 34, 40]);   // tablet
      if (s > 0) part(ch(a, T(.205, -.66, .06), Rz(-.15)), 0, 0, 0, .01, .48, .34, [60, 230, 190]);
    });
    var h = ch(root, T(0, 1.6, 0), Rz(st.nod || 0));
    part(h, .02, .34, 0, .6, .6, .6, SKIN);                         // head
    part(h, -.04, .67, 0, .66, .14, .66, HAIR);                      // hair
    part(h, -.27, .48, 0, .14, .34, .66, HAIR);
    part(h, .33, .43, .13, .04, st.blink ? .03 : .12, .07, [20, 20, 28]);   // eyes
    part(h, .33, .43, -.13, .04, st.blink ? .03 : .12, .07, [20, 20, 28]);
    part(h, .34, .3, 0, .1, .1, .1, [236, 160, 120]);                // nose
    part(h, .33, .17, 0, .03, .05, .22, [150, 50, 50]);              // smile
    part(h, .32, .24, .22, .02, .07, .1, [255, 150, 150]);           // cheeks
    part(h, .32, .24, -.22, .02, .07, .1, [255, 150, 150]);
    part(h, 0, .36, .32, .12, .16, .06, SKIN);                       // ears
    part(h, 0, .36, -.32, .12, .16, .06, SKIN);
  }

  /* ---------------- timeline: one house per cycle ---------------- */
  var SPD = 3.4, UP = 3.35, D = [P / SPD, .24, UP / 3, .8, 1.25, UP / 3, .24];   // walk, turn, up, knock, coin, down, turn
  var CYC = D.reduce(function (a, b) { return a + b; }, 0), LOOP = CYC * NV;
  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
  function state(t) {
    t = ((t % LOOP) + LOOP) % LOOP;
    var k = M.floor(t / CYC), u = t - k * CYC, dx = k * P + DOORX, s = { k: k, x: dx, y: 0, z: 0, yaw: 0, sq: 1, legA: 0, armA: 0, knock: 0, up: 0, door: 0, coin: -1, rings: [] };
    function walk(dist, len) { var a = min(1, dist / .35, (len - dist) / .35), ph = dist / .78 * PI; s.legA = sin(ph) * .62 * a; s.armA = sin(ph) * .55 * a; s.y = M.abs(sin(ph)) * .09 * a; s.sq = 1 + cos(ph * 2) * .035 * a; }
    var i = 0, e = D[0];
    if (u < e) { var w = u * SPD; s.x = dx - P + w; walk(w, P); }
    else if (u < (e += D[1])) { s.yaw = ease((u - e + D[1]) / D[1]) * PI / 2; }
    else if (u < (e += D[2])) { var g = (u - e + D[2]) * 3; s.yaw = PI / 2; s.z = -g; walk(g, UP); }
    else if (u < (e += D[3])) {
      var q = (u - e + D[3]) / D[3]; s.yaw = PI / 2; s.z = -UP;
      var hit = 0; [.16, .44].forEach(function (a) { var r = q - a; if (r > 0 && r < .28) { hit = max(hit, sin(r / .28 * PI)); if (r > .05) s.rings.push((r - .05) / .23); } });
      s.knock = ease(q / .12) * (1 - ease((q - .76) / .16)) * (.9 + .22 * hit); s.nod = -.06 * hit;
      s.door = q > .7 ? (q - .7) / .3 * .35 : 0;
    }
    else if (u < (e += D[4])) {
      var c = (u - e + D[4]) / D[4]; s.z = -UP; s.coin = c; s.door = .35 + .45 * ease(c * 3) - .8 * ease((c - .75) / .25);
      s.yaw = PI / 2 - ease(c / .2) * PI;                                           // turn to face the street
      var hp = (c - .22) / .42;                                                    // happy hop
      if (hp > 0 && hp < 1) { s.y = sin(hp * PI) * .55; s.sq = hp < .12 ? 1 - hp * 1.2 : 1 + .14 * sin(hp * PI); s.up = sin(hp * PI); s.legA = .25 * sin(hp * PI); }
      else if (hp >= 1 && hp < 1.25) { var l = (hp - 1) / .25; s.sq = 1 - .16 * sin(l * PI); }
      else if (hp <= 0 && c > .12) s.sq = 1 - .1 * sin((c - .12) / .1 * PI);
    }
    else if (u < (e += D[5])) { var g2 = (u - e + D[5]) * 3; s.yaw = -PI / 2; s.z = -UP + g2; walk(g2, UP); }
    else { s.yaw = -PI / 2 + ease((u - e) / D[6]) * PI / 2; }
    s.blink = (t % 3.7) < .12;
    s.cam = dx - P + (u / CYC) * P + 3.4;   // the camera glides at a constant speed; the rep leads, then the camera catches up
    return s;
  }

  /* ---------------- frame ---------------- */
  var W = 0, H = 0, dpr = 1, f = 300, cx = 0, cy = 0, cam = [0, 0, 0], R, U, F, ground = 0, now = 0, sk = 1;
  var CAMY = 3.7, CAMZ = 13.5, TY = 1.3, TZ = -3;
  function setCam(x) {
    cam = [x, CAMY, CAMZ]; F = norm([0, TY - CAMY, TZ - CAMZ]); R = norm(cross(F, [0, 1, 0])); U = cross(R, F);
  }
  function pr(p) { var d = sub(p, cam), z = dot(d, F); if (z < .05) z = .05; return [cx + f * dot(d, R) / z, cy - f * dot(d, U) / z, z]; }
  function frame(cards) {   // framing: sidewalk just above the tiles, roofs well under the header
    var hr = hero.getBoundingClientRect(), br = hero.querySelector('.brand'), cr = hero.querySelector('.cards');
    var top = br ? br.getBoundingClientRect().bottom - hr.top : 90, gy = cr ? cr.getBoundingClientRect().top - hr.top : H * .55;
    setCam(0); cx = 0; cy = 0; f = 1;
    var a = pr([0, 0, 0])[1], b = pr([0, 5.6, FRONT - 2.5])[1];
    var band = max(80, gy - top), span = min(band * .82, W * .4, 420);
    f = span / (a - b); cy = (gy - 4) - f * a; cx = W / 2; ground = gy;
    sk = f / 300;
  }
  function resize() {
    var r = hero.getBoundingClientRect(), w = M.round(r.width), h = M.round(r.height);
    dpr = min(1.5, window.devicePixelRatio || 1);
    if (w !== W || h !== H || cv.width !== M.round(w * dpr)) { W = w; H = h; cv.width = M.round(w * dpr); cv.height = M.round(h * dpr); }
    frame(); draw(now);
  }

  var CLOUDS = [], HILLS = [[], []];
  (function () { var r = rnd(7); for (var i = 0; i < 7; i++) CLOUDS.push({ x: r() * 1600, y: r(), s: .7 + r() * .7 });
    for (var l = 0; l < 2; l++) for (var j = 0; j < 24; j++) HILLS[l].push(.25 + r() * .75); })();

  function poly(pts, fill) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  function gq(x0, x1, z0, z1, fill, y) { y = y || 0; poly([pr([x0, y, z0]), pr([x1, y, z0]), pr([x1, y, z1]), pr([x0, y, z1])], fill); }
  function blob(x, z, rx, a) { var c = pr([x, 0, z]), e = pr([x + rx, 0, z]), rr = M.abs(e[0] - c[0]); ctx.globalAlpha = a; ctx.fillStyle = '#0b3a1c'; ctx.beginPath(); ctx.ellipse(c[0], c[1], rr, rr * .32, 0, 0, PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  function star(x, y, r, a) { ctx.globalAlpha = a; ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .22, y - r * .22); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .22, y + r * .22); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .22, y + r * .22); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .22, y - r * .22); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }

  function draw(t) {
    if (!W) return;
    var s = state(t); setCam(s.cam);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // sky
    var hz = pr([cam[0], 0, -4000])[1];
    var g = ctx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#1c5fd8'); g.addColorStop(.55, '#3d9cff'); g.addColorStop(1, '#a8e6ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz + 2);
    // clouds: chunky octagon puffs drifting slowly
    for (var i = 0; i < CLOUDS.length; i++) {
      var c = CLOUDS[i], span = W + 400, x = ((c.x - t * 6 * sk - s.cam * f * .04) % span + span) % span - 200, y = hz * (.12 + c.y * .55), r = 26 * c.s * max(.8, sk);
      [[0, 0, 1], [-1.1, .25, .75], [1.05, .2, .8], [.4, -.35, .7]].forEach(function (b) { oct(x + b[0] * r, y + b[1] * r, r * b[2], '#ffffff'); });
      ctx.fillStyle = 'rgba(160,205,245,.9)'; ctx.fillRect(x - r * 1.75, y + r * .45, r * 3.6, r * .32);
    }
    // faceted hills, two layers
    [[.03, 1.25, ['#5fb6a8', '#4e9f98'], 110], [.08, .9, ['#58c96a', '#3fae5a'], 80]].forEach(function (L2, l) {
      var step = L2[3] * max(.7, sk), off = -(s.cam * f * L2[0]) % (step * 24), x0 = off - step * 2, hs = HILLS[l];
      for (var j = 0; j < 30; j++) {
        var xa = x0 + j * step, xb = xa + step, ha = hs[(j + 240) % 24], hb = hs[(j + 241) % 24];
        var ya = hz - ha * step * L2[1] * .55, yb = hz - hb * step * L2[1] * .55;
        poly([[xa, ya], [xb, yb], [xb, hz + 4], [xa, hz + 4]], yb < ya ? L2[2][0] : L2[2][1]);
      }
    });
    // ground: checkered lawns, driveways, paths, sidewalk, road
    var reach = (W / 2) / f * 24 + 10, k0 = M.floor((s.cam - reach) / P) - 1, k1 = M.ceil((s.cam + reach) / P) + 1;
    gq(s.cam - 400, s.cam + 400, -900, -.9, '#4cc261');
    for (var k = k0; k <= k1; k++) {
      var hx = k * P;
      gq(hx - P / 2, hx + P / 2, -14, -.9, (k & 1) ? '#5fd36e' : '#52c764');
      gq(hx - 6.6, hx - 3.6, FRONT + .02, -.9, '#c9cbcf');                         // driveway
      gq(hx + DOORX - .55, hx + DOORX + .55, FRONT + .9, -.9, '#f1e2c4');          // front path
    }
    gq(s.cam - 400, s.cam + 400, -.9, .85, '#e6e6e2');                              // sidewalk
    for (k = k0; k <= k1; k++) for (var q = 0; q < 6; q++) { var sx = k * P + q * 2; gq(sx - .03, sx + .03, -.9, .85, '#c8c8c4'); }
    gq(s.cam - 400, s.cam + 400, .85, 1.6, '#4cc261');
    gq(s.cam - 400, s.cam + 400, 1.6, 1.75, '#bdbdb8');
    gq(s.cam - 400, s.cam + 400, 1.75, 30, '#4a4f5a');
    for (k = k0 * 2; k <= k1 * 2; k++) gq(k * P / 2 - 1.2, k * P / 2 + 1.2, 5.6, 5.9, '#ffd84a');
    for (k = k0; k <= k1; k++) { blob(k * P + 5.4, FRONT + 1.4, 2.2, .18); blob(k * P + DOORX + 1.25, .95, .4, .2); }
    blob(s.x, s.z, .62 / (1 + s.y * .8), .26);

    // objects: every face sorted far to near
    var faces = [];
    for (k = k0; k <= k1; k++) {
      var hf = HOUSES[((k % NV) + NV) % NV], ox = k * P;
      for (var n = 0; n < hf.length; n++) {
        var fc = hf[n], kx = fc.k[0] + ox, d = [kx - cam[0], fc.k[1] - cam[1], fc.k[2] - cam[2]];
        if (fc.n[0] * d[0] + fc.n[1] * d[1] + fc.n[2] * d[2] >= 0) continue;
        faces.push({ f: fc, o: ox, z: dot(d, F) - fc.b });
      }
    }
    var dyn = [];
    // the knocked door swings open (hinge on its left)
    var hk = s.k * P, dz = FRONT + .03, dw = 1.12, da = s.door * 1.4, hx0 = hk + DOORX - .56;
    var dm = ch(T(hx0, 0, dz), Ry(-da));
    for (k = k0; k <= k1; k++) {
      var m2 = k === s.k ? dm : T(k * P + DOORX - .56, 0, dz), dc = DOORC[((k % NV) + NV) % NV];
      emit(dyn, BOX, ch(m2, T(dw / 2, 1.1, .03), S(dw, 2.15, .06)), dc);
      emit(dyn, BOX, ch(m2, T(dw * .82, 1.05, .09), S(.1, .1, .06)), [250, 210, 80]);
    }
    if (s.door > 0) dyn.push({ p: [[hx0 + .02, .05, dz + .015], [hx0 + 1.1, .05, dz + .015], [hx0 + 1.1, 2.18, dz + .015], [hx0 + .02, 2.18, dz + .015]], n: [0, 0, 1], c: [255, 214, 130], b: .085 });
    rep(dyn, s);
    var coinP = null;
    if (s.coin >= 0) {
      var c3 = s.coin, rise = c3 < .32 ? 1 - M.pow(1 - c3 / .32, 3) : 1, out = ease((c3 - .8) / .2);
      var cyy = 2.25 + rise * 1.55 + sin(c3 * PI * 4) * .04 + out * .9, sc = (c3 < .05 ? c3 / .05 : 1) * (1 - out);
      coinP = [s.x, cyy, s.z + .1];
      if (sc > .01) {
        var spin = t * 9 + c3 * 6, cm = ch(T(coinP[0], coinP[1], coinP[2]), Ry(spin), S(.86 * sc, .86 * sc, .15 * sc));
        emit(dyn, COIN, cm, function (i2, nn) { return i2 >= 12 ? [255, 196, 36] : [214, 140, 18]; });
        emit(dyn, FACE, ch(cm, T(0, 0, 0), S(.66, .66, 1.12)), [255, 228, 104], .02);
        emit(dyn, BOX, ch(cm, T(0, 0, 0), S(.12, .42, 1.2)), [214, 150, 20], .04);
      }
    }
    for (n = 0; n < dyn.length; n++) {
      var df = dyn[n], dd = sub(df.k || cen(df.p), cam);
      if (dot(df.n, dd) >= 0) continue;
      faces.push({ f: df, o: 0, z: dot(dd, F) - df.b, d: 1 });
    }
    faces.sort(function (a, b) { return b.z - a.z; });
    for (n = 0; n < faces.length; n++) {
      var e = faces[n], p = e.f.p, o = e.o;
      ctx.beginPath();
      for (var j2 = 0; j2 < p.length; j2++) { var v = pr([p[j2][0] + o, p[j2][1], p[j2][2]]); j2 ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1]); }
      ctx.closePath(); ctx.fillStyle = e.d ? shade(e.f.c, e.f.n) : e.f.s; ctx.fill();
      if (e.d) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = .6; ctx.stroke(); }
    }
    // knock rings, sparkles
    var dp = pr([hk + DOORX, 1.5, FRONT + .1]);
    s.rings.forEach(function (r) { ctx.globalAlpha = (1 - r) * .8; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2 * max(.8, sk); ctx.beginPath(); ctx.arc(dp[0] + 6 * sk, dp[1], (8 + r * 26) * sk, -.9, .9); ctx.stroke(); ctx.globalAlpha = 1; });
    if (coinP) {
      var cp = pr(coinP), cr = f * .5 / cp[2], c4 = s.coin;
      if (c4 > .2 && c4 < .85) for (var si = 0; si < 4; si++) { var ang = t * 2.2 + si * PI / 2, tw = .5 + .5 * sin(t * 11 + si * 2); star(cp[0] + cos(ang) * cr * 1.7, cp[1] + sin(ang) * cr * 1.3, cr * (.28 + .3 * tw), .9 * tw); }
      if (c4 > .78) { var bq = (c4 - .78) / .22; for (si = 0; si < 8; si++) { var a2 = si * PI / 4 + .3; star(cp[0] + cos(a2) * cr * (.6 + bq * 2.4), cp[1] - cr * .9 * bq + sin(a2) * cr * (.6 + bq * 2.4), cr * .42 * (1 - bq), 1 - bq); } }
    }
  }
  function oct(x, y, r, fill) { var pts = []; for (var i = 0; i < 8; i++) { var a = i / 8 * PI * 2 + PI / 8; pts.push([x + cos(a) * r, y + sin(a) * r * .8]); } poly(pts, fill); }

  /* ---------------- loop: ~30 fps, only while visible ---------------- */
  var run = false, raf = 0, last = 0, onScreen = true, rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  var STILL = D[0] + D[1] + D[2] + D[3] + D[4] * .5 + CYC;   // rep mid-cheer, coin spinning over his head
  function tick(ts) {
    raf = requestAnimationFrame(tick);
    if (!last) last = ts;
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
  if (rm) (rm.addEventListener ? rm.addEventListener('change', sync) : rm.addListener(sync));
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var v = es[es.length - 1].isIntersecting; if (v !== onScreen) { onScreen = v; sync(); } }, { threshold: 0 }).observe(wrap);
  var rq = 0; function later() { if (!rq) rq = requestAnimationFrame(function () { rq = 0; resize(); }); }
  if ('ResizeObserver' in window) new ResizeObserver(later).observe(hero); else addEventListener('resize', later);
  now = (rm && rm.matches) ? STILL : D[0] * .55;
  resize(); sync();
  window.__hero = { t: function (x) { now = x; draw(now); }, frame: function () { return now; }, stop: function () { onScreen = false; sync(); }, start: function () { onScreen = true; sync(); },
    info: function () { return { W: W, H: H, dpr: dpr, cw: cv.width, ch: cv.height, f: f, run: run, cyc: CYC, still: STILL }; } };
})();
