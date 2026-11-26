// Doorbell Camera Pro (Gen 2): 132 x 43 x 35 mm, wall-mounted (back on the wall at z = 0, face toward +z, centred).
// Built in millimetres inside a 0.001-scaled group. Gloss-black front cap (7.1 mm deep, wraps the sides) and the white body share
// one outline at a flush hairline seam; the white body tapers toward the wall; the grey back plate rounds off into the wall.
// Only the lens bezel stands proud; the light ring is flush, the button and the mic holes are recessed.
export default H => {
  const { THREE, G, add } = H;
  const PI = Math.PI, DS = THREE.DoubleSide;
  const phys = (color, o) => new THREE.MeshPhysicalMaterial({ color, side: DS, ...o });

  /* ---------- helpers (mm) ---------- */
  // rounded-rect ring of points, CCW seen from +z, same count for every size so sections can be lofted
  // r may be [top, bottom] corner radii
  const rrPts = (w, h, r, cy = 0, n = 10) => {
    const cl = v => Math.max(1e-4, Math.min(v, w / 2 - 1e-4, h / 2 - 1e-4)), [rt, rb] = Array.isArray(r) ? r.map(cl) : [cl(r), cl(r)], P = [];
    for (const [sx, sy, a0, rr] of [[1, 1, 0, rt], [-1, 1, PI / 2, rt], [-1, -1, PI, rb], [1, -1, 1.5 * PI, rb]])
      for (let i = 0; i <= n; i++) { const a = a0 + i / n * PI / 2; P.push([sx * (w / 2 - rr) + rr * Math.cos(a), cy + sy * (h / 2 - rr) + rr * Math.sin(a)]); }
    return P;
  };
  const sub = (r, s) => Array.isArray(r) ? r.map(v => v - s) : r - s;
  const rrS = (w, h, r, cx = 0, cy = 0) => new THREE.Shape(rrPts(w, h, r, cy, 14).map(([x, y]) => new THREE.Vector2(x + cx, y)));
  const circ = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, 2 * PI, true); return p; };
  // loft through rounded-rect sections [z, w, h, r, cy]; flat caps on the ends asked for. groups: 0 = sides, 1 = caps
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
  // lathe round +z: pts [[r, z], ...]
  const lathe = (pts, m, seg = 96) => { const x = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z)), seg), m); x.rotation.x = PI / 2; return x; };
  const tube = (r, z0, z1, m) => lathe([[r, z0], [r, z1]], m, 48);
  const disc = (r0, r1, m) => new THREE.Mesh(new THREE.RingGeometry(r0, r1, 64), m);
  const pp = (wmm, hmm, draw) => { const p = H.printPlane(wmm / 1000, hmm / 1000, (x, P) => draw(x, (a, b) => P(a / 1000, b / 1000))); p.scale.setScalar(1000); return p; };

  /* ---------- materials ---------- */
  const glass = phys(0x050506, { roughness: .07, clearcoat: 1, clearcoatRoughness: .02, specularIntensity: 1, envMapIntensity: .35 });
  const white = phys(0xf2f2f0, { roughness: .45, clearcoat: .12, clearcoatRoughness: .5, sheen: .25, sheenRoughness: .8, sheenColor: 0xffffff });
  const plate = phys(0xe6e6e6, { roughness: .6, clearcoat: .05 });
  const plateL = H.splitMat(plate, plate, 'y', 29, .25, 0xa4a6a8);              // arch cap piece / bracket split on the sides
  const tabM = phys(0xe8e8e8, { roughness: .55 });
  const bezel = phys(0x0a0a0a, { roughness: .12, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: .7 });
  const smoke = phys(0x2a2a2e, { roughness: .1, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1 });
  const voidM = new THREE.MeshBasicMaterial({ color: 0x000000, side: DS });
  const btn = phys(0x0a0a0a, { roughness: .12, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1 });
  const lip = phys(0x0a0a0a, { roughness: .3 });
  const ringMat = (c, k) => new THREE.MeshStandardMaterial({ color: 0x000000, roughness: .35, emissive: c, emissiveIntensity: k, envMapIntensity: .1, toneMapped: false, side: DS });
  const ringIn = ringMat(0xff5c14, 1), ringOut = ringMat(0xff3c0a, 1), ringWall = ringMat(0xff4a1c, .4);
  const lensM = phys(0x05040a, { roughness: .02, metalness: .2, clearcoat: 1, clearcoatRoughness: 0, iridescence: .6, iridescenceIOR: 1.6, iridescenceThicknessRange: [250, 400], envMapIntensity: .8 });
  const glint = phys(0x2e2e34, { roughness: .05, clearcoat: 1, metalness: .3 });

  const out = G(), g = add(out, G()); g.scale.setScalar(.001);

  /* ---------- black front cap: z 28.0 -> 35.0, R2.5 rolled front edge ---------- */
  const ZF = 35, W = 43, HH = 132, R = [10, 10], RF = 1.3;              // R10 corners, R1.3 face-to-band roll
  const capS = [[28.0, W, HH, R], [ZF - RF, W, HH, R]];
  for (let i = 1; i <= 8; i++) { const a = i / 8 * PI / 2, s = RF * (1 - Math.cos(a)); capS.push([ZF - RF + RF * Math.sin(a), W - 2 * s, HH - 2 * s, sub(R, s)]); }
  add(g, shell(capS, glass, { front: false }));
  // flat glass face with real openings: lens, two mic holes, light ring
  const LY = 45.1, BY = -45;
  const face = rrS(W - 2 * RF, HH - 2 * RF, sub(R, RF));
  face.holes.push(circ(0, LY, 9.0), circ(-6.2, 20.6, .8), circ(6.2, 20.6, .8), circ(0, BY, 15.45));
  add(g, new THREE.Mesh(new THREE.ShapeGeometry(face, 48), glass), 0, 0, ZF);

  /* ---------- white body: z 9.05 -> 27.8, tapering toward the wall ---------- */
  const zb0 = 9.05, zb1 = 27.8, zr = zb0 + 6, Rp = 15.9;
  const planIn = z => { const u = Math.max(0, zr - z); return Rp - Math.sqrt(Math.max(0, Rp * Rp - u * u)); };   // plan rounding of body back + plate
  const bodyAt = z => { const t = (zb1 - z) / (zb1 - zb0); return { w: W - 1.4 * t - 2 * planIn(z), top: 66 - 2.6 * t, bot: -66 + 1.3 * t }; };
  const bS = []; for (let i = 0; i <= 18; i++) { const z = zb0 + (zb1 - zb0) * i / 18, b = bodyAt(z); bS.push([z, b.w, b.top - b.bot, R, (b.top + b.bot) / 2]); }
  const BOT = 32;                                                          // ring index of the flat bottom strip (BL end -> BR start)
  add(g, shell(bS, white, { skip: (k, i) => i === BOT }));
  // flat bottom strip rebuilt with real openings: three speaker slots and the release notch, dark floor 1 mm inside
  { const L = [], Rr = []; bS.forEach(([z, w, h, r, cy]) => { const P = rrPts(w, h, R, cy); L.push([P[BOT][0], z]); Rr.push([P[BOT + 1][0], z]); });
    const out = new THREE.Shape([...L, ...Rr.reverse()].map(([x, z]) => new THREE.Vector2(x, z)));
    const stad = (zc, len, wd) => { const p = new THREE.Path(); p.absarc(len / 2 - wd / 2, zc, wd / 2, -PI / 2, PI / 2, false); p.absarc(-len / 2 + wd / 2, zc, wd / 2, PI / 2, 1.5 * PI, false); return p; };
    for (const zc of [22.4, 19.7, 16.9]) out.holes.push(stad(zc, 19.5, .9));
    out.holes.push(new THREE.Path(rrS(6.5, 1.1, .2, 0, 27.2).getPoints()));
    const toBot = (geo, dy) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getY(i); p.setXYZ(i, x, bodyAt(z).bot + dy, z); } geo.computeVertexNormals(); return geo; };
    add(g, new THREE.Mesh(toBot(new THREE.ShapeGeometry(out, 24), 0), white));
    const fl = new THREE.Shape([...L].map(([x, z]) => new THREE.Vector2(x * .8, z)).concat([...L].reverse().map(([x, z]) => new THREE.Vector2(-x * .8, z))));
    add(g, new THREE.Mesh(toBot(new THREE.ShapeGeometry(fl, 8), .8), phys(0x4a4a4a, { roughness: .7 })));       // grey groove floors
    add(g, new THREE.Mesh(toBot(new THREE.ShapeGeometry(new THREE.Shape(rrS(6.6, 1.2, .2, 0, 27.2).getPoints()), 4), 1.2), phys(0x1a1a1a, { roughness: .8 }))); }
  // dark cores fill the hairline seams so they read as fine dark lines
  add(g, shell([[27.7, W - .6, HH - .6, sub(R, .3)], [28.1, W - .6, HH - .6, sub(R, .3)]], voidM));
  const br = bodyAt(zb0);
  add(g, shell([[8.6, br.w - .6, br.top - br.bot - .6, sub(R, .3), (br.top + br.bot) / 2], [9.2, br.w - .6, br.top - br.bot - .6, sub(R, .3), (br.top + br.bot) / 2]], voidM));

  /* ---------- back plate / bracket: z 2.2 -> 8.75, rounding into the wall ---------- */
  const pS = [], D = 7.75, ZB = 8.75 - D, SX = 7.0;                    // plate back face at z 1.0; pads reach the wall
  for (let i = 0; i <= 16; i++) { const a = i / 16 * PI / 2, k = 1 - Math.cos(a), z = 8.75 - D * Math.sin(a);
    const top = br.top - 9.0 * k, bot = br.bot + 9.5 * k;
    pS.push([z, br.w - 2 * SX * k, top - bot, R, (top + bot) / 2]); }
  add(g, shell(pS, [plateL, plate]));
  // back face: arch cap outline, pads, wire boss
  const wB = br.w - 2 * SX - 1;
  const bp2 = pp(wB, 40, (x, P) => { x.strokeStyle = '#b4b6b8'; x.lineWidth = 2.5; x.beginPath(); const o = -42;   // plane centre at y 42
    x.moveTo(...P(-wB / 2, 29 + o)); x.lineTo(...P(-13.5, 29 + o)); x.lineTo(...P(-13.5, 40 + o));
    const [cx, cy] = P(0, 40 + o); x.arc(cx, cy, 135, PI, 0, false); x.lineTo(...P(13.5, 29 + o)); x.lineTo(...P(wB / 2, 29 + o)); x.stroke(); });
  bp2.rotation.y = PI; add(g, bp2, 0, 42, ZB - .01);
  // wall pads stand 1 mm proud of the back face: small boss round the wire hole, slotted lower pad
  const upPad = rrS(14, 11, 5, 0, 36); upPad.holes.push(new THREE.Path(rrS(7, 4, 2, 0, 36).getPoints().reverse()));
  add(g, H.ext(upPad, ZB + .05, .3, plate));
  add(g, H.rslab(7, 4, .3, 1.9, .05, voidM), 0, 36, ZB - .4);
  const loPad = rrS(13, 23, 6.5, 0, -38); loPad.holes.push(new THREE.Path(rrS(4, 13, 2, 0, -38).getPoints().reverse()));
  add(g, H.ext(loPad, ZB + .05, .3, plate));
  add(g, H.rslab(4.2, 13.2, .3, 2, .05, phys(0xcfd0d0, { roughness: .7 })), 0, -38, ZB - .2);
  // terminal boss: raised rounded square, raised pill on it, two grey ringed terminals
  add(g, H.ext(rrS(18, 18, 4.5, 0, -3.5), .45, .15, plate), 0, 0, ZB - .4);
  add(g, H.ext(rrS(11, 5.5, 2.75, 0, -3.5), .45, .15, plate), 0, 0, ZB - .8);
  for (const x of [-2.8, 2.8]) { add(g, disc(.5, .9, phys(0x9a9a9a, { roughness: .4, metalness: .5 })), x, -3.5, ZB - .81).rotation.y = PI; add(g, disc(0, .5, voidM), x, -3.5, ZB - .81).rotation.y = PI; }

  /* ---------- bottom face: notch, speaker slots, security-screw tab ---------- */
  const slope = 1.3 / (zb1 - zb0), ybAt = z => bodyAt(z).bot;
  const bot = add(g, G(), 0, ybAt(18), 18); bot.rotation.x = Math.atan(slope);          // frame lying on the sloped bottom, +z toward the front
  // security-screw tab: level underside at y -66, hanging just below the sloped bottom (z 7..16)
  const tab = H.ext(rrS(10.7, 9, 2), 4, .3, tabM); tab.rotation.x = -PI / 2; add(g, tab, 0, -66, 11.5);
  const tp = pp(12, 10.5, (x, P) => { x.strokeStyle = '#cfd0d1'; x.lineWidth = 1.5; x.beginPath(); const [a, b] = P(-5.35, 4.5), [c, d] = P(5.35, -4.5); x.roundRect(a, b, c - a, d - b, 20); x.stroke();
      const [cx, cy] = P(0, 0); x.fillStyle = '#000'; x.beginPath(); x.arc(cx, cy, 19.5, 0, 2 * PI); x.fill(); });
  tp.rotation.x = PI / 2; add(g, tp, 0, -66.02, 11.5);

  /* ---------- lens: proud bezel, smoky window, recessed barrel and element ---------- */
  const L = add(g, G(), 0, LY, ZF);
  add(L, lathe([[8.25, .7], [8.25, 1.0], [9.45, 1.0], [9.85, .6], [9.85, -.6]], bezel));
  add(L, disc(4.15, 8.25, smoke), 0, 0, .7);
  add(L, tube(4.15, -.3, .7, bezel));
  add(L, disc(2.75, 4.15, voidM), 0, 0, -.3);
  add(L, tube(2.75, -.95, -.3, voidM));
  add(L, H.dome(2.75, .2, lensM), 0, 0, -.95);
  for (const r of [1.6, 2.3]) add(L, H.torus(r, .05, glint), 0, 0, -.9);
  add(L, disc(0, 9.0, voidM), 0, 0, -.65);

  /* ---------- mic / light-sensor holes (recessed) ---------- */
  for (const x of [-6.2, 6.2]) { add(g, tube(.8, ZF - 1.5, ZF, voidM), x, 20.6, 0); add(g, disc(0, .8, voidM), x, 20.6, ZF - 1.5); }

  /* ---------- wordmark (flush print) ---------- */
  add(g, H.decal(H.DEC.logo, 34, 8.5, { color: 0xd6d6d6, r: .4 }), 0, -19.5, ZF + .01);

  /* ---------- light ring (flush) + recessed doorbell button ---------- */
  const B = add(g, G(), 0, BY, ZF);
  add(B, lathe([[13.4, -.12], [13.45, -.02], [13.55, -.01], [14.3, -.01]], ringIn));
  add(B, lathe([[14.3, -.01], [15.3, -.01], [15.42, -.04], [15.45, -.15], [15.45, -1.6]], ringOut));
  add(B, tube(13.3, -1.15, -.12, ringWall));                                             // diffuser inner wall, lit
  add(B, lathe([[0, -2.1], [4, -1.97], [8, -1.65], [11, -1.3], [12.6, -1.13], [13.0, -1.12], [13.2, -1.2], [13.25, -1.4], [13.25, -2.8]], btn));   // dished button
  add(B, disc(13.25, 15.5, voidM), 0, 0, -1.6);
  g.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = false; } });
  return out;
};
