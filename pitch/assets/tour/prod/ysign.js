// Yard Sign: a 12 in (305 mm) round aluminium sign, 1 mm thick with a crisp white edge, printed both sides with the owner's
// artwork (orange field, white border ring, "Protected by / vivint / 855.484.8468 | vivint.com") in satin reflective vinyl,
// bolted to the front of a 19 mm square white post that runs on above it to a black square cap. Two empty mounting holes.
// Origin at the ground on the post axis, +z out of the sign face. Modelled in mm inside a group scaled to metres.
export default H => { const { THREE, G, add, rbox, photoTex } = H;
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
    if (outer) { cap(outer, 0, thru.map(I => [I, 0]), false); cap(outer, outer.K - 1, [...thru, ...pk].map(I => [I, I.K - 1]), true); }
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
        if (l.w) c += ` diffuseColor.rgb = mix(diffuseColor.rgb, uL${i}, (1.0 - smoothstep(${f(l.w / 2)} - fw, ${f(l.w / 2)} + fw, abs(sd))) * ${f(l.k ?? .85)});`;
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
  const g = G(), S = G(); S.scale.setScalar(.001); g.add(S);
  const Rd = 152.5, yC = 800, zB = 9.55, T = 1;

  /* post (buried 60 mm) and cap */
  const postM = new THREE.MeshPhysicalMaterial({ color: 0xedede9, roughness: .6, clearcoat: .1, clearcoatRoughness: .6 });
  add(S, rbox(19, 1023.5, 19, 1, postM), 0, (963.5 - 60) / 2, 0);
  const capM = new THREE.MeshPhysicalMaterial({ color: 0x141516, roughness: .5, clearcoat: .15, clearcoatRoughness: .5 });
  add(S, rbox(22.5, 32, 22.5, 1.25, capM), 0, 962 + 16, 0);
  const grime = plane(19, 90, 6, (x) => { const gr = x.createLinearGradient(0, 0, 0, 540); gr.addColorStop(0, 'rgba(120,120,115,.22)'); gr.addColorStop(1, 'rgba(120,120,115,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 114, 540); for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(110,110,105,.12)'; x.fillRect(10 + i * 11 % 90, 20 + i * 37 % 200, 3 + i % 3, 18 + i * 7 % 30); } }, { r: .6 });
  for (const s of [1, -1]) { const p = grime.clone(); p.rotation.y = s > 0 ? 0 : Math.PI; add(S, p, 0, 963.5 - 45, s * 9.52); }

  /* sign disc: real holes, white edge, artwork on both faces (back reads correctly from behind) */
  const sh = new THREE.Shape(); sh.absarc(0, 0, Rd, 0, Math.PI * 2, false);
  for (const y of [131, -133]) { const h = new THREE.Path(); h.absarc(0, y, 2.5, 0, Math.PI * 2, true); sh.holes.push(h); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: T - .4, bevelEnabled: true, bevelThickness: .2, bevelSize: .2, bevelOffset: -.2, bevelSegments: 2, curveSegments: 160 });
  geo.translate(0, 0, .2);
  { const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv, Ra = Rd / .985;   // crop the artwork's grey cut line
    for (let i = 0; i < p.count; i++) { const nz = n.getZ(i); if (Math.abs(nz) < .9) continue;
      uv.setXY(i, .5 + (nz > 0 ? 1 : -1) * p.getX(i) / (2 * Ra), .5 + p.getY(i) / (2 * Ra)); } uv.needsUpdate = true; }
  const peel = (() => { const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), d = x.createImageData(N, N);
    for (let i = 0; i < N * N; i++) { const v = 128 + (Math.random() - .5) * 90; d.data.set([v, v, v, 255], i * 4); } x.putImageData(d, 0, 0);
    x.filter = 'blur(2px)'; x.drawImage(c, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); return t; })();
  const art = photoTex('ysign');
  const face = new THREE.MeshStandardMaterial({ map: art, color: 0xe4e4e4, roughness: .5, envMapIntensity: .5, bumpMap: peel, bumpScale: .6 });
  const edge = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, roughness: .35, metalness: .3 });
  const disc = new THREE.Mesh(geo, [face, edge]); disc.castShadow = disc.receiveShadow = true; add(S, disc, 0, yC, zB);
  return g;
};
