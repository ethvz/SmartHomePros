// Key Fob (Vivint KF01): 29 x 64 x 11 mm. One continuous satin shell, charcoal key end / light-grey ring end split flush at a
// hairline, back-shell hairline at z = 3, three pill keys sitting DOWN in recessed pockets (tops 0.3 mm below the face) with
// printed light-grey legends and red dots, a debossed logo and a stadium key-ring slot with soft rounded edges.
// Lies face-up on the counter (origin on the counter, face toward +y, ring end toward +z), its ring end resting on a steel split
// ring that passes through the slot, with two house keys. Body modelled in mm (face +z), turned to lie flat, scaled to metres.
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
  const g = G(), W = 32, L = 64, D = 11, lift = 4.0;                        // ring end lifted 4 mm by the ring wire under it
  const F = G(); F.scale.setScalar(.001); g.add(F);
  const bare = (/[?&](bare|studio)=/.test(location.search) && !/[?&]full/.test(location.search));                          // bare: the fob alone, upright (face +z) for photo matching
  if (!bare) { F.rotation.x = -Math.PI / 2 - Math.atan(lift / L); F.position.y = lift / 2 * .001; }

  /* 1-3. shell */
  const grey = new THREE.MeshPhysicalMaterial({ color: 0x7a7a78, roughness: .55, clearcoat: .04, clearcoatRoughness: .6 });
  const shell = lineMat(grey, [{ ax: 'y', at: -10.8, B: 0x28292b, rB: .5, w: .4, col: 0x141414, k: 1 }, { ax: 'y', at: -11.15, w: .35, col: 0xf4f4f2, k: .6 },
    { ax: 'z', at: 3, w: .25, col: 0x303132, k: .6 }]);
  const pocketP = []; pocketP.push([0, 9.6], [0, 10.5]); for (let i = 1; i <= 6; i++) { const t = i / 6 * Math.PI / 2; pocketP.push([.5 * (1 - Math.cos(t)), 10.5 + .5 * Math.sin(t)]); }
  const keysY = [20.1, 10.2, .2];
  const loops = [{ type: 'outer', pts: pts(rr4(W, L, [11, 11, 11.5, 11.5]), 300), prof: uni(rrP(D, 2.5, 2.5, 8)) },
    ...keysY.map(y => ({ type: 'pocket', pts: offs(pts(H.rrShape(21.8, 7.1, 3.5), 110), 0, y), prof: uni(pocketP) })),
    { type: 'hole', pts: offs(pts(H.rrShape(19, 6.5, 2.6), 140), 0, -23), prof: uni(rrP(D, 1.5, 2.0, 7)) }];
  add(F, solid(loops, shell));

  /* 4-6. keys (recessed 0.3 mm), legends, red dots */
  const keyM = new THREE.MeshPhysicalMaterial({ color: 0x252628, roughness: .5 });
  for (const y of keysY) add(F, rslab(19.9, 5.6, 1.6, 2.79, .6, keyM), 0, y, D - .3 - .8);
  const leg = plane(24, 28, 50, (x, Pp) => { x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#8e8f90';
    x.font = '300 140px "Helvetica Neue", Helvetica, Arial, sans-serif';
    const fit = (s, x0, x1, y) => { const m = x.measureText(s).width, [a, b] = Pp(x0, y), [c] = Pp(x1, y); x.save(); x.translate(a, b); x.scale((c - a) / m, 1); x.fillText(s, 0, 4); x.restore(); };
    fit('DISARM', -5.6, 5.5, 20.1 - 10.2); fit('STAY', -3.9, 3.0, 0); fit('AWAY', -4.6, 3.6, .2 - 10.2);
    x.fillStyle = '#6e1416'; for (const y of [20.1 - 10.2, .2 - 10.2]) { const [a, b] = Pp(-7.0, y); x.beginPath(); x.arc(a, b, .8 * 50, 0, Math.PI * 2); x.fill(); } }, { r: .7 });
  add(F, leg, 0, 10.2, D - .3 + .02);

  /* 7. debossed logo on the grey end */
  const logo = plane(40, 12, 40, () => {}); add(F, logo, 0, -15.2, D + .02);
  whenImg(DEC.logo, img => { const x = logo.material.map.image.getContext('2d'); deboss(x, img, 800, 240, 28 * 40, 7,
    'rgba(10,10,10,.9)', 'rgba(255,255,255,.8)', 'rgba(0,0,0,.12)'); logo.material.map.needsUpdate = true; });

  if (bare) return g;
  /* 9. split ring (two coils of flat steel wire) through the slot and under the ring end, leaning over; two house keys on it */
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xcfd1d3, roughness: .2, metalness: 1, clearcoat: .3 });
  const steelD = steel.clone(); steelD.side = THREE.DoubleSide;
  const Rc = 11.5, prof = []; { const a = .5, b = .45, c = .3;                 // flat wire: 2.0 radial x 0.9 axial, rounded
    for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI * 2, cs = Math.cos(t), sn = Math.sin(t);
      prof.push(new THREE.Vector2(Rc + (1 - c) * Math.sign(cs) * Math.abs(cs) ** .45 + c * cs, b * Math.sign(sn) * Math.abs(sn) ** .45)); } }
  const coil = new THREE.LatheGeometry(prof.reverse(), 120);
  const piv = G(); piv.position.set(0, .001, .0325); piv.rotation.z = 30 * Math.PI / 180; g.add(piv);
  const RG = G(); RG.scale.setScalar(.001); RG.position.y = Rc * .001; piv.add(RG);
  for (const dx of [-.48, .48]) { const m = new THREE.Mesh(coil, steelD); m.rotation.z = Math.PI / 2; m.position.x = dx; RG.add(m); }
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xb8954f, roughness: .32, metalness: 1 }), nickel = new THREE.MeshPhysicalMaterial({ color: 0xbfc3c6, roughness: .26, metalness: 1 });
  const keyMesh = m => {                                       // house key lying flat, hole at the origin, blade along +x (mm, scaled to metres)
    const s = new THREE.Shape(); s.moveTo(-4, -10); s.lineTo(14, -10); s.quadraticCurveTo(18, -10, 18, -6); s.lineTo(18, -4); s.lineTo(21, -3.5); s.lineTo(21, 3.5); s.lineTo(18, 4);
    s.lineTo(18, 6); s.quadraticCurveTo(18, 10, 14, 10); s.lineTo(-4, 10); s.quadraticCurveTo(-8, 10, -8, 6); s.lineTo(-8, -6); s.quadraticCurveTo(-8, -10, -4, -10);
    const hole = new THREE.Path(); hole.absarc(0, 0, 2.8, 0, Math.PI * 2, true); s.holes.push(hole);
    const b = new THREE.Shape(); b.moveTo(21, 3); b.lineTo(55, 3); b.lineTo(58, 0); b.lineTo(55, -1.5);
    for (let i = 0; i < 5; i++) { const x = 52 - i * 6; b.lineTo(x, -1.5); b.lineTo(x - 2, -4.5); b.lineTo(x - 4, -1.5); } b.lineTo(21, -3); b.lineTo(21, 3);
    const kg = G(); kg.scale.setScalar(.001);
    for (const sh of [s, b]) { const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: true, bevelThickness: .25, bevelSize: .3, bevelSegments: 2, curveSegments: 16 }); geo.rotateX(-Math.PI / 2);
      const mm = new THREE.Mesh(geo, m); mm.castShadow = true; kg.add(mm); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6.2, .5, 8, 40), new THREE.MeshPhysicalMaterial({ color: 0x2b2c2e, roughness: .5 })); ring.rotation.x = Math.PI / 2; ring.position.set(4, 1.9, 0); kg.add(ring);   // rubber key-head ring
    return kg; };
  piv.updateMatrixWorld(true);
  const onRing = t => new THREE.Vector3(0, Rc * Math.sin(t), Rc * Math.cos(t)).applyMatrix4(RG.matrix).applyMatrix4(piv.matrix);
  for (const [t, yaw, m, dy] of [[.05, -1.2, brass, 0], [-.45, -2.1, nickel, -.0008]]) {
    const p = onRing(t), kg = G(); kg.position.copy(p); kg.position.y += dy; g.add(kg);
    const pitch = Math.asin(Math.min(.9, (kg.position.y - .0009) / .049));
    kg.rotation.set(0, yaw, -pitch); const k = keyMesh(m); k.position.set(0, -.0008, 0); kg.add(k); }
  return g;
};
