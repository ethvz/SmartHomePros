// Smart Plug (Vivint V-LPM1): 99 x 53 x 38 mm landscape soap-bar module plugged into the upper receptacle of the wall outlet.
// One satin-white shell with a variable front roll-off (wide at mid-edge, narrow at the corners: the "pinched" face), a flush
// button marked only by a hairline ring, an LED glowing through the shell, vent grooves on the top wall, a 12 mm end collar
// joined by a hairline, and the pass-through receptacle on a raised faceplate on the +x end, with a lamp cord plugged in.
// Modelled in millimetres inside a group scaled to metres. Origin: centre of the outlet plate, back on the wall (z = 0).
export default H => { const { THREE, G, add, rslab, rrShape } = H;
  /* ---- module helpers (self-contained copy) ---- */
  const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  /* profiled solid: loops (one 'outer' outline, through 'hole's, blind 'pocket's), each swept through rings [x,y,z] listed
     back -> front (pockets: floor -> face). prof(x,y,nx,ny) gets an outline point and its normal pointing INTO the material. */
  function solid(loops, m, useCol) {
    const pos = [], col = [], idx = [], info = [];
    for (const L of loops) {
      const p = L.pts.map(q => new THREE.Vector2(q.x, q.y));
      while (p.length > 2 && p[0].distanceTo(p[p.length - 1]) < 1e-6) p.pop();
      if (THREE.ShapeUtils.isClockWise(p)) p.reverse();
      const n = p.length, s = L.type === 'outer' ? 1 : -1;
      const R = p.map((q, i) => { const a = p[(i - 1 + n) % n], b = p[(i + 1) % n], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
        return L.prof(q.x, q.y, -ty / l * s, tx / l * s, i, n); });
      const K = R[0].length, base = pos.length / 3;
      for (let k = 0; k < K; k++) for (let i = 0; i < n; i++) { const v = R[i][k]; pos.push(v[0], v[1], v[2]); const c = L.col ? L.col(k, K, v) : 1; col.push(c, c, c); }
      for (let k = 0; k < K - 1; k++) for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = base + k * n + i, b = base + k * n + j, c = a + n, d = b + n;
        if (s > 0) idx.push(a, b, d, a, d, c); else idx.push(a, d, b, a, c, d); }
      info.push({ L, n, K, base });
    }
    const ring = (I, k) => { const a = []; for (let i = 0; i < I.n; i++) { const o = (I.base + k * I.n + i) * 3; a.push(new THREE.Vector2(pos[o], pos[o + 1])); } return a; };
    const cap = (C, k0, holes, up) => { const pts = [ring(C, k0)], map = []; for (let i = 0; i < C.n; i++) map.push(C.base + k0 * C.n + i);
      for (const [I, k] of holes) { pts.push(ring(I, k)); for (let i = 0; i < I.n; i++) map.push(I.base + k * I.n + i); }
      const all = pts.flat();
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(pts[0], pts.slice(1))) {
        const A = all[a], B = all[b], D = all[c], cr = (B.x - A.x) * (D.y - A.y) - (B.y - A.y) * (D.x - A.x);
        if ((cr > 0) === up) idx.push(map[a], map[b], map[c]); else idx.push(map[a], map[c], map[b]); } };
    const outer = info.find(I => I.L.type === 'outer'), thru = info.filter(I => I.L.type === 'hole'), pk = info.filter(I => I.L.type === 'pocket');
    if (outer) { cap(outer, 0, thru.map(I => [I, 0]), false);
      if (outer.L.fan) { const c = pos.length / 3, b0 = outer.base + (outer.K - 1) * outer.n; pos.push(...outer.L.fan); col.push(1, 1, 1);   // tiny last ring: fan to a centre vertex
        for (let i = 0; i < outer.n; i++) idx.push(b0 + i, b0 + (i + 1) % outer.n, c); }
      else cap(outer, outer.K - 1, [...thru, ...pk].map(I => [I, I.K - 1]), true); }
    for (const I of pk) cap(I, 0, [], true);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (useCol) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; return x;
  }
  const uni = P => (x, y, nx, ny) => P.map(([d, z]) => [x + nx * d, y + ny * d, z]);
  /* side profile: depth D, back round rb, front round rf (as [inset, z] back -> front) */
  const rrP = (D, rb, rf, st = 7) => { const a = [];
    for (let i = 0; i <= st; i++) { const t = i / st * Math.PI / 2; a.push([rb * (1 - Math.sin(t)), rb * (1 - Math.cos(t))]); }
    for (let i = 0; i <= st; i++) { const t = i / st * Math.PI / 2; a.push([rf * (1 - Math.cos(t)), D - rf + rf * Math.sin(t)]); }
    return a; };
  const pts = (shape, n) => shape.getSpacedPoints(n);
  const offs = (P, dx, dy) => P.map(q => new THREE.Vector2(q.x + dx, q.y + dy));
  const circ = (cx, cy, r, n = 64) => { const a = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; a.push(new THREE.Vector2(cx + r * Math.cos(t), cy + r * Math.sin(t))); } return a; };
  /* flush colour splits and hairlines on one mesh: L = [{ax, at, B?:colour above, rB?:roughness above, w?:line width, col?, k?}] (geometry units) */
  function lineMat(base, L) {
    const m = base.clone(), f = v => (+v).toFixed(6);
    m.onBeforeCompile = sh => {
      let c = '', r = '';
      L.forEach((l, i) => {
        sh.uniforms['uL' + i] = { value: new THREE.Color(l.col ?? 0x6a6d70) };
        if (l.B != null) sh.uniforms['uB' + i] = { value: new THREE.Color(l.B) };
        c += `{ float sd = vOP.${l.ax} - ${f(l.at)}; float fw = max(fwidth(sd), 1e-7);`;
        if (l.B != null) c += ` diffuseColor.rgb = mix(diffuseColor.rgb, uB${i}, smoothstep(-fw, fw, sd));`;
        if (l.w) c += ` diffuseColor.rgb = mix(diffuseColor.rgb, uL${i}, (1.0 - smoothstep(${f(l.w / 2)} - fw, ${f(l.w / 2)} + fw, abs(sd))) * ${f(l.k ?? .85)}${l.mask ? ' * float(' + l.mask + ')' : ''});`;
        c += ' }\n';
        if (l.rB != null) r += `{ float sd = vOP.${l.ax} - ${f(l.at)}; float fw = max(fwidth(sd), 1e-7); roughnessFactor = mix(roughnessFactor, ${f(l.rB)}, smoothstep(-fw, fw, sd)); }\n`;
      });
      sh.vertexShader = 'varying vec3 vOP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vOP = position;');
      sh.fragmentShader = 'varying vec3 vOP;\n' + L.map((l, i) => `uniform vec3 uL${i};` + (l.B != null ? ` uniform vec3 uB${i};` : '')).join('\n') + '\n' + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + c)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + r);
    };
    m.customProgramCacheKey = () => 'lm' + JSON.stringify(L);
    return m;
  }
  /* a transparent plane (w x h model units) you draw on with canvas 2D at ppu px per unit; P(x,y) maps units (centre, +y up) to px */
  function plane(w, h, ppu, draw, o = {}) {
    const W = Math.round(w * ppu), Hh = Math.round(h * ppu), c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d');
    const P = (mx, my) => [W / 2 + mx * ppu, Hh / 2 - my * ppu];
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const redraw = () => { x.clearRect(0, 0, W, Hh); draw(x, P, ppu); t.needsUpdate = true; };
    redraw();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: o.r ?? .55, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...(o.x || {}) }));
    m.userData.redraw = redraw; return m;
  }
  const whenImg = (tex, fn) => { const ok = () => tex && tex.image && tex.image.width > 0 && (tex.image.complete ?? true);
    if (ok()) return fn(tex.image); const iv = setInterval(() => { if (ok()) { clearInterval(iv); fn(tex.image); } }, 80); setTimeout(() => clearInterval(iv), 30000); };
  /* debossed artwork (white-on-transparent image): shadowed upper wall, lit lower lip, faintly darker floor. cx,cy,w in px; d = wall px */
  function deboss(x, img, cx, cy, w, d, sh = 'rgba(0,0,0,.34)', hi = 'rgba(255,255,255,.6)', fl = 'rgba(0,0,0,.05)') {
    const h = w * img.height / img.width, W = x.canvas.width, Hh = x.canvas.height;
    const mask = (dx, dy) => { const c = document.createElement('canvas'); c.width = W; c.height = Hh; c.getContext('2d').drawImage(img, cx - w / 2 + dx, cy - h / 2 + dy, w, h); return c; };
    const tint = (c, col) => { const g = c.getContext('2d'); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, W, Hh); return c; };
    const T = tint(mask(0, 0), hi), g = T.getContext('2d');
    g.globalCompositeOperation = 'source-atop'; g.drawImage(tint(mask(-d, -d), sh), 0, 0);
    const I = mask(d, d), gi = I.getContext('2d'); gi.globalCompositeOperation = 'destination-in'; gi.drawImage(mask(-d, -d), 0, 0);
    g.globalCompositeOperation = 'destination-out'; g.drawImage(I, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.drawImage(tint(I, fl), 0, 0);
    x.drawImage(T, 0, 0);
  }
  /* ---- end helpers ---- */
  const g = G(), Q = new URLSearchParams(location.search), bare = (/[?&](bare|studio)=/.test(location.search) && !/[?&]full/.test(location.search)), nocord = bare || Q.has('nocord');
  const P = G(); P.scale.setScalar(.001); P.position.y = .006; g.add(P);                  // body sits a little above the plate centre (upper receptacle)
  const W = 96, HH = 53, D = 38, R = 6, crown = .6;
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf1f0ee, roughness: .45, clearcoat: .08, clearcoatRoughness: .5, sheen: .25, sheenRoughness: .8, sheenColor: 0xffffff });

  /* 1-2. housing + collar: one shell, hairline at x = +36 */
  const hx = W / 2 - R, hy = HH / 2 - R;
  const wOf = (x, y) => {                                   // plan width of the front roll-off at an outline point
    if (Math.abs(x) <= hx + 1e-6 && Math.abs(y) > hy) { const t = (x + hx) / (2 * hx); return 3.8 + 6.7 * Math.sin(Math.PI * t); }
    if (Math.abs(y) <= hy + 1e-6) { const t = (y + hy) / (2 * hy); return 3.8 + 3.2 * Math.sin(Math.PI * t); }
    return 3.8; };
  const VX = []; for (let i = 0; i < 15; i++) VX.push(-37.5 + i * 67 / 14);       // vent grooves across the top wall (they notch the silhouette)
  const groove = (x, y) => { if (y < hy || Math.abs(x) > hx) return 0; let gmax = 0; for (const v of VX) gmax = Math.max(gmax, 1 - sm(.6, .85, Math.abs(x - v))); return gmax; };
  const shellProf = (x, y, nx, ny) => { const w = wOf(x, y), h = 1.05 * w + 1.2, out = [], g0 = 2.2 * groove(x, y);
    for (let i = 0; i <= 4; i++) { const t = i / 4 * Math.PI / 2, d = 1.5 * (1 - Math.sin(t)) + g0; out.push([x + nx * d, y + ny * d, 1.5 * (1 - Math.cos(t))]); }
    const gv = 2.2 * groove(x, y), zs = D - h, dr = z => .6 * sm(1.5, zs, z);        // 1-2 deg draft: the back is the widest part
    for (const [z, d] of [[1.8, gv], [2.3, gv], [zs - 1.8, gv], [zs - 1.1, 0]]) out.push([x + nx * (d + dr(z)), y + ny * (d + dr(z)), z]);
    for (let i = 0; i <= 12; i++) { const t = i / 12 * Math.PI / 2, d = .6 + (w - .6) * (1 - Math.pow(Math.cos(t), .83)); out.push([x + nx * d, y + ny * d, D - h + h * Math.pow(Math.sin(t), .83)]); }
    const bx = x + nx * w, by = y + ny * w;
    for (let j = 1; j <= 16; j++) { const f = 1 - .97 * Math.pow(j / 16, .8); out.push([bx * f, by * f, D + crown * (1 - f * f)]); }
    return out; };
  const shellMat = lineMat(white, [{ ax: 'x', at: 36, w: .3, col: 0x9c9c9a, k: .9, mask: 'vOP.z < 27.5' }]);
  add(P, solid([{ type: 'outer', pts: pts(rrShape(W, HH, R), 1100), prof: shellProf, fan: [0, 0, D + crown] }], shellMat));
  const zTop = D + crown;

  /* 4. flush button: hairline ring only.  5. LED glowing through the shell */
  const ringM = new THREE.MeshStandardMaterial({ color: 0x8e8e8e, roughness: .6, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  add(P, new THREE.Mesh(new THREE.RingGeometry(5.0, 5.28, 72), ringM), 0, -1, zTop + .03);
  add(P, new THREE.Mesh(new THREE.RingGeometry(5.28, 5.7, 72), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .3, transparent: true, opacity: .35,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })), 0, -1, zTop + .03);   // lit lip outside the gap
  const led = plane(6, 6, 40, (x, Pp) => { const [cx, cy] = Pp(0, 0), gr = x.createRadialGradient(cx, cy, 0, cx, cy, 60);
    gr.addColorStop(0, 'rgba(236,244,255,1)'); gr.addColorStop(.25, 'rgba(221,235,255,.85)'); gr.addColorStop(1, 'rgba(200,222,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 240, 240); },
    { x: { toneMapped: false } });
  add(P, led, 0, 9, zTop - .02);

  /* 6. vent grooves on the top wall (back half) */
  const vent = plane(72, 17, 20, (x, Pp) => { for (let i = 0; i < 15; i++) { const vx = -36 + i * 66 / 14 + 3;
      const [ax, ay] = Pp(vx - .75, 7), [bx, by] = Pp(vx + .75, -7), gr = x.createLinearGradient(ax, 0, bx, 0);
      gr.addColorStop(0, 'rgba(95,95,93,.75)'); gr.addColorStop(.55, 'rgba(150,150,148,.55)'); gr.addColorStop(1, 'rgba(255,255,255,.5)');
      x.fillStyle = gr; x.beginPath(); x.roundRect(ax, ay, bx - ax, by - ay, 15); x.fill(); } });
  

  /* 3. receptacle faceplate on the +x end: raised 3 mm, chamfered rim, NEMA 5-15R rotated (slots horizontal, ground toward the wall) */
  { const pp = [[0, 0], [0, 10.05], [.12, 10.25], [.68, 10.81], [.8, 11]];                // embedded 8 mm, proud 3 mm
    const slotProf = [[0, 4.5], [0, 10.6], [.15, 10.85], [.3, 11]];
    const U = []; { const r = 2.4, u0 = 7.25, u1 = 10.35; U.push(new THREE.Vector2(u0, -r));
      for (let i = 0; i <= 24; i++) { const t = -Math.PI / 2 + i / 24 * Math.PI; U.push(new THREE.Vector2(u1 + r * Math.cos(t), r * Math.sin(t))); }
      U.push(new THREE.Vector2(u0, r)); }
    const dense = a => { const s = new THREE.Shape(a); return pts(s, 90); };
    const deep = (k, K, v) => .16 + .84 * sm(5.2, 10.7, v[2]);
    const loops = [{ type: 'outer', pts: pts(rrShape(30, 27, 1), 160), prof: uni(pp) },
      { type: 'pocket', pts: offs(pts(rrShape(8, 2.2, .35), 80), -4, 6.35), prof: uni(slotProf), col: deep },
      { type: 'pocket', pts: offs(pts(rrShape(8, 2.2, .35), 80), -4, -6.35), prof: uni(slotProf), col: deep },
      { type: 'pocket', pts: dense(U), prof: uni(slotProf), col: deep }];
    const boss = solid(loops, white.clone(), true); boss.material.vertexColors = true;
    boss.rotation.y = Math.PI / 2; add(P, boss, 40, .5, 19); }

  /* 7. printed text: "Max. 330W / Incandescent" upside down under the faceplate; FCC block on the far end */
  const txt = plane(20, 7, 40, (x, Pp) => { x.save(); x.translate(...Pp(0, 0)); x.rotate(Math.PI); x.fillStyle = '#3a3a3a'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 120px "Helvetica Neue Condensed", "HelveticaNeue-CondensedBold", "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
    x.fillText('Max. 330W', 0, -62); x.fillText('Incandescent', 0, 62); x.restore(); }, { r: .5 });
  txt.rotation.y = Math.PI / 2; txt.scale.x = .92; add(P, txt, W / 2 + .03, -17.6, 19);
  const fcc = plane(40, 26, 20, (x) => { x.save(); x.translate(400, 260); x.rotate(-Math.PI / 2); x.fillStyle = 'rgba(42,42,42,.55)'; x.font = '400 20px "Helvetica Neue", Arial, sans-serif';
    const L = ['This device complies with Part 15 of the FCC Rules.', 'Operation is subject to the following two', 'conditions: (1) this device may not cause',
      'harmful interference, and (2) this device must', 'accept any interference received, including', 'interference that may cause undesired', 'operation.', 'FCC ID: XQH-LPM1   IC: 9863B-LPM1', 'Made in China'];
    L.forEach((s, i) => x.fillText(s, -230, -200 + i * 46)); x.restore(); }, { r: .5 });
  fcc.rotation.y = -Math.PI / 2; add(P, fcc, -W / 2 - .03, 0, 17);

  /* 8. prongs (into the receptacle, hidden in the wall) */
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9c3b4, roughness: .3, metalness: 1 });
  if (bare) return g;
  for (const x of [-6.35, 6.35]) add(P, new THREE.Mesh(new THREE.BoxGeometry(1.5, 6.3, 15.9), steel), x, 7, -7.9);
  add(P, new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 15.9, 20), steel), 0, -5, -7.9).rotation.x = Math.PI / 2;

  /* lamp cord plugged into the pass-through receptacle (dark brown/black, ribbed strain relief), running down to the floor */
  const cordM = new THREE.MeshPhysicalMaterial({ color: 0x2b2826, roughness: .5, clearcoat: .25, clearcoatRoughness: .4 });
  { const head = rslab(16, 21, 15, 3.5, 2.2, cordM); add(P, head, 51 + 8.4, .5, 23);
    for (const y of [-6.35, 6.35]) add(P, new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 6.5), steel), 50.5, y + .5, 23).rotation.y = Math.PI / 2;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 4, 14, 28), cordM); grip.rotation.z = -Math.PI / 2; add(P, grip, 67.4 + 7, .5, 23);
    for (let i = 0; i < 5; i++) { const r = 6.0 - i * .45, t = new THREE.Mesh(new THREE.TorusGeometry(r, .75, 10, 32), cordM); t.rotation.y = Math.PI / 2; add(P, t, 69.4 + i * 2.6, .5, 23); }
    const C = [[81, .5, 23], [88, .4, 22.6], [95, -3, 21.5], [100, -14, 19.5]];
    if (!nocord) C.push([103, -45, 16], [105, -120, 13], [106, -200, 12], [109, -219, 13], [118, -224.4, 20], [150, -224.4, 44]);
    const curve = new THREE.CatmullRomCurve3(C.map(a => new THREE.Vector3(...a)), false, 'centripetal');
    add(P, new THREE.Mesh(new THREE.TubeGeometry(curve, nocord ? 30 : 160, 2.3, 12, false), cordM)); }
  return g;
};
