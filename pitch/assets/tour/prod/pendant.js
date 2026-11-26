// Emergency Pendant (Vivint PB01): 31 x 54 x 11.5 mm chunky tag. One continuous satin shell, white body / light-grey cap split
// flush at a hairline, a wide conical dish with a flat grey button sitting flush with its floor, a funnelled lanyard hole and a
// debossed tone-on-tone logo on the cap, back-cover hairline with a pry notch. It hangs from a black wall hook on a braided black
// cord tied through its hole with a lark's head. Origin: the hook (on the wall, z = 0). Body modelled in mm, scaled to metres.
export default H => { const { THREE, G, add, rslab, rr4, DEC } = H;
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
      for (let i = 0; i < map.length; i++) { const e = map[i], o = pos.length / 3; pos.push(pos[e * 3], pos[e * 3 + 1], pos[e * 3 + 2]); col.push(col[e * 3], col[e * 3 + 1], col[e * 3 + 2]); map[i] = o; }   // flat caps get their own vertices (crisp normals, no streaks)
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
    const T = []; for (let i = 0; i <= st; i++) T.push(i / st); T.splice(1, 0, .03); T.splice(T.length - 1, 0, .97);   // fine first/last steps: tangent joins to the caps
    for (const u of T) { const t = u * Math.PI / 2; a.push([rb * (1 - Math.sin(t)), rb * (1 - Math.cos(t))]); }
    for (const u of T) { const t = u * Math.PI / 2; a.push([rf * (1 - Math.cos(t)), D - rf + rf * Math.sin(t)]); }
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
  const g = G(), drop = .13;                                                 // cap top hangs 130 mm below the hook
  const W = 31, HT = 53, D = 11;
  const B = G(); B.scale.setScalar(.001); B.position.set(0, -drop - HT / 2 * .001, .004); g.add(B);   // body: back centre origin, mm

  /* 1-3. shell: white body, grey cap above y = +10 (flush hairline), back-cover hairline at z = 2.5 */
  const body = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f2, roughness: .5, clearcoat: .06, clearcoatRoughness: .6 });
  const shell = lineMat(body, [{ ax: 'y', at: 9.5, B: 0x6e6e6c, rB: .55, w: .35, col: 0x5a5a58, k: 1 }, { ax: 'y', at: 9.15, w: .35, col: 0xffffff, k: .6 }, { ax: 'z', at: 2.5, w: .25, col: 0x8a8a88, k: .75 }]);
  const outerProf = (x, y, nx, ny) => { const u = sm(12, 27, y), rb = 2.5 + 1.6 * u, rf = 4.5, st = 8, out = [];
    const T = []; for (let i = 0; i <= st; i++) T.push(i / st); T.splice(1, 0, .03); T.splice(T.length - 1, 0, .97);
    for (const u of T) { const t = u * Math.PI / 2, d = rb * (1 - Math.sin(t)); out.push([x + nx * d, y + ny * d, rb * (1 - Math.cos(t))]); }
    for (const u of T) { const t = u * Math.PI / 2, d = rf * (1 - Math.cos(t)); out.push([x + nx * d, y + ny * d, D - rf + rf * Math.sin(t)]); }
    return out; };
  // 4. dish (pocket): cone from the button gap (r 6.25, 2 mm down) up to an 18 mm rim with a 1 mm fillet onto the face
  const dishP = [[-2.7, D - 4.1], [-2.7, D - 3.5], [-1.9, D - 2.45], [-1.0, D - 1.25], [-.3, D - .4], [-.08, D - .15], [.15, D - .03], [.4, D]];   // crisp ~53-degree cone, 3.5 mm deep, 0.4 mm rim fillet
  const loops = [
    { type: 'outer', pts: pts(rr4(W, HT, [12, 12, 10, 10]), 260), prof: outerProf },
    { type: 'pocket', pts: circ(0, -6.5, 9, 140), prof: uni(dishP), col: (k, K, v) => (.72 + .28 * sm(D - 3.5, D - .2, v[2])) * (1 - .45 * sm(-2, 8, v[1] + 6.5 - .5 * v[0]) * (1 - sm(D - .3, D, v[2]))) },
    { type: 'hole', pts: circ(0, 17.6, 3.0, 72), prof: uni(rrP(D, 1.0, 1.0, 9)) }];
  shell.vertexColors = true; add(B, solid(loops, shell, true));

  /* 5. button: flat light-grey disc flush with the dish floor, dark hairline gap */
  const btnM = new THREE.MeshPhysicalMaterial({ color: 0x8a8a88, roughness: .6, clearcoat: .05 });
  const btn = solid([{ type: 'outer', pts: circ(0, 0, 6, 96), prof: uni([[0, 0], [0, .5], [.08, .66], [.2, .7]]) }], btnM); add(B, btn, 0, -6.5, D - 4.2);
  add(B, new THREE.Mesh(new THREE.RingGeometry(5.98, 6.32, 96), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: .9 })), 0, -6.5, D - 4.05);

  /* 3. pry notch on the back-cover seam, bottom centre */
  const notch = plane(7, 1.6, 60, (x, Pp) => { const [a, b] = Pp(-3, .5), [c, d] = Pp(3, -.5), gr = x.createLinearGradient(0, b, 0, d);
    gr.addColorStop(0, 'rgba(60,60,58,.85)'); gr.addColorStop(1, 'rgba(150,150,148,.6)'); x.fillStyle = gr; x.beginPath(); x.roundRect(a, b, c - a, d - b, 18); x.fill(); });
  notch.rotation.x = Math.PI / 2; add(B, notch, 0, -HT / 2 - .02, 2.5);

  /* 7. debossed "vivint" on the cap (tone on tone) */
  const logo = plane(30, 10, 40, () => {});
  logo.material.roughness = .55; add(B, logo, 0, 11.4, D + .02);
  whenImg(DEC.logo, img => { const x = logo.material.map.image.getContext('2d'); x.clearRect(0, 0, 1200, 400); deboss(x, img, 600, 200, 24 * 40, 4,
    'rgba(30,30,30,.6)', 'rgba(255,255,255,.75)', 'rgba(0,0,0,.06)'); logo.material.map.needsUpdate = true; });

  if ((/[?&](bare|studio)=/.test(location.search) && !/[?&]full/.test(location.search))) return g;   // product-photo studio views: the pendant alone
  /* hook on the wall */
  const blk = new THREE.MeshPhysicalMaterial({ color: 0x161718, roughness: .42, metalness: .5, clearcoat: .3, clearcoatRoughness: .4 });
  add(g, rslab(.016, .034, .004, .003, .0012, blk), 0, 0, .002);
  const arm = new THREE.Mesh(new THREE.TorusGeometry(.009, .0024, 14, 36, Math.PI * 1.15), blk); arm.rotation.set(0, Math.PI / 2, Math.PI * 1.05); add(g, arm, 0, -.006, .012);

  /* 8. braided black cord: lark's head round the bar above the hole, both strands rising to the hook and over its cup */
  const braid = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#1c1d1f'; x.fillRect(0, 0, 64, 64);
    for (let i = -2; i < 6; i++) for (const s of [1, -1]) { x.strokeStyle = s > 0 ? '#3a3c3f' : '#2c2e31'; x.lineWidth = 7; x.beginPath();
      x.moveTo(i * 16, s > 0 ? 0 : 64); x.lineTo(i * 16 + 32, s > 0 ? 32 : 32); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const cordMat = len => { const t = braid.clone(); t.needsUpdate = true; t.repeat.set(len / .0032, 1);
    return new THREE.MeshStandardMaterial({ color: 0xffffff, map: t, bumpMap: t, bumpScale: 1.5, roughness: .85 }); };
  const r = .0016, toW = (x, y, z) => new THREE.Vector3(x * .001, -drop - HT / 2 * .001 + y * .001, .004 + z * .001);   // body mm -> group metres
  const cy = 23.55, cz = D / 2, ry = 4.55, rz = D / 2 + 1.6;
  for (const sx of [-1.45, 1.45]) {                                          // the two cord passes round the bar
    const L = []; for (let i = 0; i < 32; i++) { const t = i / 32 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      L.push(toW(sx, cy + ry * Math.sign(s) * Math.abs(s) ** (2 / 3.2), cz + rz * Math.sign(c) * Math.abs(c) ** (2 / 3.2))); }
    const cu = new THREE.CatmullRomCurve3(L, true, 'centripetal');
    add(g, new THREE.Mesh(new THREE.TubeGeometry(cu, 96, r, 10, true), cordMat(cu.getLength()))); }
  const top = toW(0, cy + ry, cz), S = [];
  const half = s => [[1.45 * s, 0, 0], [1.6 * s, .008, .0002], [3.2 * s, .04, .001], [5.2 * s, .085, .0017], [5.6 * s, .106, .0018], [4.2 * s, .1145, .0018], [2.2 * s, .1172, .0018]];
  for (const [x, y, z] of half(1)) S.push(new THREE.Vector3(x * .001, top.y + y, top.z + z));
  S.push(new THREE.Vector3(0, top.y + .1176, top.z + .0018));
  for (const [x, y, z] of half(-1).reverse()) S.push(new THREE.Vector3(x * .001, top.y + y, top.z + z));
  const sc = new THREE.CatmullRomCurve3(S, false, 'centripetal');
  add(g, new THREE.Mesh(new THREE.TubeGeometry(sc, 220, r, 10, false), cordMat(sc.getLength())));
  return g;
};
