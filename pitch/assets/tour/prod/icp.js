// Indoor Camera Pro: 106.7 x 66 x 66 mm, stands on a table (base bottom at y = 0, base centre / tilt hinge at x = z = 0, face +z).
// Built in millimetres inside a 0.001-scaled group (V2 renders). Black rounded-square base with a turntable and tilt knuckle, one
// closed stirrup loop of soft bar folded once (leaning back, then vertical behind the head) wrapping a mushroom hub on the head back;
// grey pillow-backed head with a flush gloss-black front.
export default H => {
  const { THREE, G, add } = H;
  const PI = Math.PI, DS = THREE.DoubleSide;
  const phys = (color, o) => new THREE.MeshPhysicalMaterial({ color, side: DS, ...o });

  /* ---------- helpers (mm) ---------- */
  const rrPts = (w, h, r, cy = 0, n = 10) => {
    r = Math.max(1e-4, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4)); const x = w / 2 - r, y = h / 2 - r, P = [];
    for (const [cx, cc, a0] of [[x, y, 0], [-x, y, PI / 2], [-x, -y, PI], [x, -y, 1.5 * PI]])
      for (let i = 0; i <= n; i++) { const a = a0 + i / n * PI / 2; P.push([cx + r * Math.cos(a), cy + cc + r * Math.sin(a)]); }
    return P;
  };
  const rrS = (w, h, r, cx = 0, cy = 0) => new THREE.Shape(rrPts(w, h, r, cy, 14).map(([x, y]) => new THREE.Vector2(x + cx, y)));
  const circ = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, 2 * PI, true); return p; };
  function shell(secs, mats, { front = true, back = true, skip = null } = {}) {
    secs = [...secs].sort((a, b) => a[0] - b[0]);
    const rings = secs.map(([z, w, h, r, cy]) => rrPts(w, h, r, cy || 0)), N = rings[0].length, pos = [], idx = [];
    rings.forEach((R, k) => R.forEach(([x, y]) => pos.push(x, y, secs[k][0])));
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) { if (skip && skip(k, i)) continue; const a = k * N + i, b = k * N + (i + 1) % N, c = a + N, d = b + N; idx.push(a, b, c, b, d, c); }
    const nSide = idx.length;
    const cap = (k, flip) => { const R = rings[k], z = secs[k][0], c0 = pos.length / 3; let cx = 0, cy = 0;
      R.forEach(([x, y]) => { cx += x / N; cy += y / N; }); pos.push(cx, cy, z); R.forEach(([x, y]) => pos.push(x, y, z));
      for (let i = 0; i < N; i++) { const a = c0 + 1 + i, b = c0 + 1 + (i + 1) % N; flip ? idx.push(c0, b, a) : idx.push(c0, a, b); } };
    if (back) cap(0, true); if (front) cap(rings.length - 1, false);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    g.addGroup(0, nSide, 0); g.addGroup(nSide, idx.length - nSide, 1); g.computeVertexNormals();
    return new THREE.Mesh(g, Array.isArray(mats) ? mats : [mats, mats]);
  }
  const lathe = (pts, m, seg = 96) => { const x = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z)), seg), m); x.rotation.x = PI / 2; return x; };
  const tube = (r, z0, z1, m) => lathe([[r, z0], [r, z1]], m, 32);
  const disc = (r0, r1, m) => new THREE.Mesh(new THREE.RingGeometry(r0, r1, 64), m);
  const pp = (wmm, hmm, draw) => { const p = H.printPlane(wmm / 1000, hmm / 1000, (x, P) => draw(x, (a, b) => P(a / 1000, b / 1000))); p.scale.setScalar(1000); return p; };

  /* ---------- materials ---------- */
  const satin = phys(0x1d1e20, { roughness: .55, envMapIntensity: .4, specularIntensity: .5 });
  const foot = phys(0x2e2f31, { roughness: .72 });
  const pivot = phys(0x2a2b2d, { roughness: .4, clearcoat: .2 });
  const grey = phys(0x4b4c4f, { roughness: .6, sheen: .35, sheenRoughness: .7, sheenColor: 0x9a9ca0 });
  const glass = phys(0x050506, { roughness: .04, clearcoat: 1, clearcoatRoughness: .02, specularIntensity: 1, envMapIntensity: .6 });
  const discM = phys(0x1c1c1f, { roughness: .05, clearcoat: 1, clearcoatRoughness: .02 });
  const barrel = phys(0x0b0b0c, { roughness: .1, clearcoat: 1 });
  const voidM = new THREE.MeshStandardMaterial({ color: 0x030303, roughness: .9, side: DS });
  const btnM = phys(0x45464a, { roughness: .55, sheen: .3, sheenColor: 0x8a8c90 });
  const lensM = phys(0x04050a, { roughness: .02, metalness: .2, clearcoat: 1, clearcoatRoughness: 0, iridescence: .45, iridescenceIOR: 1.6, iridescenceThicknessRange: [300, 420], envMapIntensity: .6 });
  const ledM = new THREE.MeshStandardMaterial({ color: 0x3cff6a, emissive: 0x3cff6a, emissiveIntensity: 1.6, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });

  const out = G(), g = add(out, G()); g.scale.setScalar(.001);

  /* ---------- base: 65 x 65 R14 body on an inset 60 x 60 foot, turntable on top ---------- */
  const bs = add(g, G()); bs.rotation.x = -PI / 2;                       // loft z -> world y
  add(bs, shell([[0, 59, 59, 11.5], [.45, 60, 60, 12], [2.7, 60, 60, 12]], foot));
  const bS = [];
  for (let i = 0; i <= 6; i++) { const a = i / 6 * PI / 2, s = 2.5 * (1 - Math.sin(a)); bS.push([5.1 - 2.5 * Math.cos(a), 65 - 2 * s, 65 - 2 * s, 14 - s]); }
  for (let i = 1; i <= 9; i++) { const a = i / 9 * PI / 2, s = 4.5 * (1 - Math.cos(a)); bS.push([7.3 + 4.5 * Math.sin(a), 65 - 2 * s, 65 - 2 * s, 14 - s]); }
  add(bs, shell(bS, satin));
  add(g, new THREE.Mesh(new THREE.LatheGeometry([[0, 12.4], [14.6, 12.4], [14.88, 12.33], [15, 12.15], [15, 11.6]].map(([r, y]) => new THREE.Vector2(r, y)), 96), satin));
  add(g, disc(15, 15.4, voidM), 0, 11.82, 0).rotation.x = -PI / 2;

  /* ---------- tilt knuckle: rounded-top tab 22 x 9, split into interleaved knuckles ---------- */
  const kS = (hw, y0, yc) => { const s = new THREE.Shape(); s.moveTo(-hw, y0); s.lineTo(hw, y0); s.lineTo(hw, yc); s.absarc(0, yc, hw, 0, PI, false); s.lineTo(-hw, y0); return s; };
  const kOut = H.splitMat(satin, satin, 'y', 17, .25, 0x050505);
  for (const [x0, len, m] of [[-11, 4.9, kOut], [-5.9, 11.8, satin], [6.1, 4.9, kOut]]) {
    const k = add(g, H.ext(kS(4.5, 12.4, 16.5), len, .55, m), x0, 0, 0); k.rotation.y = PI / 2; }
  { const k = add(g, H.ext(kS(4.1, 12.6, 16.5), 21.4, .2, voidM), -10.7, 0, 0); k.rotation.y = PI / 2; }
  for (const s of [-1, 1]) { const c = add(g, H.cyl(3.5, .6, pivot, 48), s * 11, 15, 0); c.rotation.z = PI / 2;
    add(g, H.torus(3.5, .12, pivot), s * 11.3, 15, 0).rotation.y = PI / 2; }

  /* ---------- the rod loop: one closed stirrup, folded once ---------- */
  const th = 28 * PI / 180, Rb = 10, y0 = 22.7, zV = -17.3;
  const v1 = (-zV + Rb * (Math.cos(th) - 1)) / Math.sin(th), v2 = v1 + Rb * th;
  const Y1 = y0 + v1 * Math.cos(th), Z1 = -v1 * Math.sin(th), Y2 = Y1 + Rb * Math.sin(th), HC = 76.2, vc = v2 + (HC - Y2);
  const fold = v => { if (v <= v1) return [y0 + v * Math.cos(th), -v * Math.sin(th), th];
    if (v <= v2) { const f = th - (v - v1) / Rb; return [Y1 + Rb * (Math.sin(th) - Math.sin(f)), Z1 + Rb * (Math.cos(th) - Math.cos(f)), f]; }
    return [Y2 + (v - v2), zV, 0]; };
  const P2 = [], seg = (pts) => { for (const p of pts) if (!P2.length || Math.hypot(p[0] - P2[P2.length - 1][0], p[1] - P2[P2.length - 1][1]) > 1e-6) P2.push(p); };
  const line = (a, b, n) => { const r = []; for (let i = 0; i <= n; i++) r.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return r; };
  const arc = (cx, cy, r, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };
  const LW = 16.8, CR = 4.5;
  seg(line([-LW + CR, 0], [LW - CR, 0], 30)); seg(arc(LW - CR, CR, CR, -PI / 2, 0, 12));
  seg(line([LW, CR], [LW, vc], 90)); seg(arc(0, vc, LW, 0, PI, 64));
  seg(line([-LW, vc], [-LW, CR], 90)); seg(arc(-LW + CR, CR, CR, PI, 1.5 * PI, 12));
  if (Math.hypot(P2[0][0] - P2[P2.length - 1][0], P2[0][1] - P2[P2.length - 1][1]) < 1e-6) P2.pop();
  const prof = rrPts(4.5, 6, 2, 0, 5), K = P2.length, NP = prof.length, pos = [], idx = [];
  for (let i = 0; i < K; i++) {
    const [u, v] = P2[i], a = P2[(i + K - 1) % K], b = P2[(i + 1) % K];
    let tu = b[0] - a[0], tv = b[1] - a[1]; const tl = Math.hypot(tu, tv); tu /= tl; tv /= tl;
    const mu = tv, mv = -tu;                                             // in-plane normal
    const [Y, Z, f] = fold(v), ev = [0, Math.cos(f), -Math.sin(f)], N3 = [0, Math.sin(f), Math.cos(f)];
    const M3 = [mu, mv * ev[1], mv * ev[2]];
    for (const [p, q] of prof) pos.push(u + p * M3[0] + q * N3[0], Y + p * M3[1] + q * N3[1], Z + p * M3[2] + q * N3[2]);
  }
  for (let i = 0; i < K; i++) for (let j = 0; j < NP; j++) { const a = i * NP + j, b = i * NP + (j + 1) % NP, c = ((i + 1) % K) * NP + j, d = ((i + 1) % K) * NP + (j + 1) % NP; idx.push(a, c, b, b, c, d); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
  add(g, new THREE.Mesh(rg, satin));

  /* ---------- head ---------- */
  const hd = add(g, G(), 0, HC, 0), ZF = 23.8;
  const gS = [[20.7, 60, 60, 12, 0], [3, 60, 60, 12, 0]];
  for (let i = 1; i <= 14; i++) { const a = i / 14 * PI / 2, k = 1 - Math.cos(a), iT = 17 * k, iB = 15 * k, iS = 17 * k;
    gS.push([3 - 17.2 * Math.sin(a), 60 - 2 * iS, 60 - iT - iB, 12 - 4 * k, (iB - iT) / 2]); }
  add(hd, shell(gS, grey, { skip: (k, i) => k === 14 && i === 32 }));     // flat bottom strip z 3..20.7 rebuilt below with real holes
  { const S = new THREE.Shape([[-18, 3], [18, 3], [18, 20.7], [-18, 20.7]].map(([x, z]) => new THREE.Vector2(x, z)));
    [8, 9, 10, 11, 10, 9, 8].forEach((n, r) => { for (let i = 0; i < n; i++) S.holes.push(circ((i - (n - 1) / 2) * 2.75, 10.8 + (r - 3) * 2.38, .7)); });
    const toB = (geo, y) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i), y, p.getY(i)); geo.computeVertexNormals(); return geo; };
    add(hd, new THREE.Mesh(toB(new THREE.ShapeGeometry(S, 12), -30), grey));
    const fl = new THREE.Shape(); fl.absellipse(0, 10.8, 16.5, 9, 0, 2 * PI, false);
    add(hd, new THREE.Mesh(toB(new THREE.ShapeGeometry(fl, 32), -29.1), voidM)); }
  const cS = [[20.9, 60, 60, 12], [22.6, 60, 60, 12]];
  for (let i = 1; i <= 8; i++) { const a = i / 8 * PI / 2, s = 1.2 * (1 - Math.cos(a)); cS.push([22.6 + 1.2 * Math.sin(a), 60 - 2 * s, 60 - 2 * s, 12 - s]); }
  add(hd, shell(cS, glass, { front: false }));
  add(hd, H.rslab(59.4, 59.4, 1.0, 11.7, .1, voidM), 0, 0, 20.8);          // fills the hairline seam
  const face = rrS(57.6, 57.6, 10.8); face.holes.push(circ(0, 0, 16.12), circ(-21.6, 0, .5), circ(21.6, 0, .5));
  add(hd, new THREE.Mesh(new THREE.ShapeGeometry(face, 48), glass), 0, 0, ZF);
  // lens surround disc (flush), stepped barrel, recessed glass
  const ld = new THREE.Shape(); ld.absarc(0, 0, 16, 0, 2 * PI, false); ld.holes.push(circ(0, 0, 8.5), circ(0, -12.4, .6));
  add(hd, new THREE.Mesh(new THREE.ShapeGeometry(ld, 64), discM), 0, 0, ZF - .005);
  add(hd, disc(15.6, 16.6, voidM), 0, 0, ZF - .35);
  add(hd, lathe([[8.5, -.005], [8.45, -.1], [8.2, -.5], [4.8, -.5], [4.5, -.65], [4.5, -1.7]], barrel), 0, 0, ZF);
  add(hd, disc(0, 4.6, voidM), 0, 0, ZF - 1.7);
  add(hd, H.dome(4.5, .75, lensM), 0, 0, ZF - 1.7);
  add(hd, H.torus(3.1, .09, H.PM.grey), 0, 0, ZF - 1.25);
  add(hd, tube(.6, ZF - .8, ZF, voidM), 0, -12.4, 0); add(hd, disc(0, .6, voidM), 0, -12.4, ZF - .8);
  for (const x of [-21.6, 21.6]) { add(hd, tube(.5, ZF - .8, ZF, voidM), x, 0, 0); add(hd, disc(0, .5, voidM), x, 0, ZF - .8); }
  add(hd, new THREE.Mesh(new THREE.CircleGeometry(1, 32), ledM), 0, 21.7, ZF + .01);
  add(hd, H.decal(H.DEC.logo, 19, 4.75, { color: 0xcfd0d2, r: .4 }), 0, -21.5, ZF + .01);
  // top button: raised stadium with a hairline gap
  const tb = add(hd, H.ext(rrS(15, 6.5, 3.25), 1.2, .3, btnM), 0, 29.2, 7.8); tb.rotation.x = -PI / 2;
  const tg = add(hd, pp(16.5, 8, (x, P) => { const [a, b] = P(-7.75, 3.5), [c, d] = P(7.75, -3.5); x.fillStyle = '#18191a'; x.beginPath(); x.roundRect(a, b, c - a, d - b, 35); x.fill(); }), 0, 30.02, 7.8);
  tg.rotation.x = -PI / 2;
  // speaker grille (hex holes) and microSD flap on the bottom
  const sd = add(hd, pp(22, 9, (x, P) => { const [a, b] = P(-10, 3.25), [c, d] = P(10, -3.25);
    x.fillStyle = '#55565a'; x.strokeStyle = '#2a2b2d'; x.lineWidth = 2.5; x.beginPath(); x.roundRect(a, b, c - a, d - b, 30); x.fill(); x.stroke();
    const [e, f] = P(-3, 3.25), [h, k] = P(3, 1.75); x.fillStyle = '#2f3032'; x.beginPath(); x.roundRect(e, f, h - e, k - f, 6); x.fill(); }), 0, -30.0, 1.6);
  sd.rotation.x = PI / 2;

  /* ---------- back hub: mushroom pivot holding the loop arch ---------- */
  const hb = [[0, -19.4], [4.25, -19.4], [4.45, -19.6], [6.3, -23.9], [6.6, -24.2], [12.8, -24.2]];
  for (let i = 1; i <= 8; i++) { const t = i / 8 * PI / 2; hb.push([12.8 + 2.7 * Math.sin(t), -21.5 - 2.7 * Math.cos(t)]); }
  for (let i = 1; i <= 6; i++) { const t = i / 6 * PI / 2; hb.push([14.5 + Math.cos(t), -21.5 + Math.sin(t)]); }
  hb.push([14.4, -20.5], [14.4, -11.5]);
  add(hd, lathe(hb, satin));
  add(hd, H.rslab(5, 3.5, .4, .8, .1, voidM), 0, 0, -19.35);

  g.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = false; } });
  return out;
};
