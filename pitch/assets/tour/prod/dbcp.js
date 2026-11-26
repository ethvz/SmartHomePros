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
  const rrPts = (w, h, r, cy = 0, n = 10) => {
    r = Math.max(1e-4, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4)); const x = w / 2 - r, y = h / 2 - r, P = [];
    for (const [cx, cc, a0] of [[x, y, 0], [-x, y, PI / 2], [-x, -y, PI], [x, -y, 1.5 * PI]])
      for (let i = 0; i <= n; i++) { const a = a0 + i / n * PI / 2; P.push([cx + r * Math.cos(a), cy + cc + r * Math.sin(a)]); }
    return P;
  };
  const rrS = (w, h, r, cx = 0, cy = 0) => new THREE.Shape(rrPts(w, h, r, cy, 14).map(([x, y]) => new THREE.Vector2(x + cx, y)));
  const circ = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, 2 * PI, true); return p; };
  // loft through rounded-rect sections [z, w, h, r, cy]; flat caps on the ends asked for. groups: 0 = sides, 1 = caps
  function shell(secs, mats, { front = true, back = true } = {}) {
    secs = [...secs].sort((a, b) => a[0] - b[0]);
    const rings = secs.map(([z, w, h, r, cy]) => rrPts(w, h, r, cy || 0)), N = rings[0].length, pos = [], idx = [];
    rings.forEach((R, k) => R.forEach(([x, y]) => pos.push(x, y, secs[k][0])));
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) { const a = k * N + i, b = k * N + (i + 1) % N, c = a + N, d = b + N; idx.push(a, b, c, b, d, c); }
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
  const glass = phys(0x050506, { roughness: .04, clearcoat: 1, clearcoatRoughness: .02, specularIntensity: 1 });
  const glassL = H.splitMat(glass, glass, 'z', 32.5, .15, 0x000000);           // glass panel edge inside the black band
  const white = phys(0xf2f2f0, { roughness: .45, clearcoat: .12, clearcoatRoughness: .5, sheen: .25, sheenRoughness: .8, sheenColor: 0xffffff });
  const plate = phys(0xe6e6e6, { roughness: .6, clearcoat: .05 });
  const plateL = H.splitMat(plate, plate, 'y', 29, .25, 0xa4a6a8);              // arch cap piece / bracket split on the sides
  const tabM = phys(0xe8e8e8, { roughness: .55 });
  const bezel = phys(0x0a0a0a, { roughness: .12, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: .7 });
  const smoke = phys(0x161618, { roughness: .18, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: .45 });
  const voidM = new THREE.MeshStandardMaterial({ color: 0x030303, roughness: .9, side: DS });
  const btn = phys(0x0a0a0a, { roughness: .06, clearcoat: 1, clearcoatRoughness: .03 });
  const ringM = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: .35, emissive: 0xff4a1c, emissiveIntensity: 1.0, envMapIntensity: .15, toneMapped: false, side: DS });
  const lensM = phys(0x05040a, { roughness: .02, metalness: .2, clearcoat: 1, clearcoatRoughness: 0, iridescence: .55, iridescenceIOR: 1.6, iridescenceThicknessRange: [320, 460], envMapIntensity: .6 });

  const out = G(), g = add(out, G()); g.scale.setScalar(.001);

  /* ---------- black front cap: z 28.0 -> 35.0, R2.5 rolled front edge ---------- */
  const ZF = 35, W = 43, HH = 132, R = 10;
  const capS = [[28.0, W, HH, R], [32.5, W, HH, R]];
  for (let i = 1; i <= 9; i++) { const a = i / 9 * PI / 2, s = 2.5 * (1 - Math.cos(a)); capS.push([32.5 + 2.5 * Math.sin(a), W - 2 * s, HH - 2 * s, R - s]); }
  add(g, shell(capS, [glassL, glass], { front: false }));
  // flat glass face with real openings: lens, two mic holes, light ring
  const LY = 45.1, BY = -45;
  const face = rrS(W - 5, HH - 5, R - 2.5);
  face.holes.push(circ(0, LY, 9.0), circ(-6.2, 20.6, .8), circ(6.2, 20.6, .8), circ(0, BY, 15.45));
  add(g, new THREE.Mesh(new THREE.ShapeGeometry(face, 48), glass), 0, 0, ZF);

  /* ---------- white body: z 9.05 -> 27.8, tapering toward the wall ---------- */
  const zb0 = 9.05, zb1 = 27.8, bodyAt = z => { const t = (zb1 - z) / (zb1 - zb0); return { w: W - 1.4 * t, top: 66 - 2.6 * t, bot: -66 + 1.3 * t }; };
  const bS = []; for (let i = 0; i <= 6; i++) { const z = zb0 + (zb1 - zb0) * i / 6, b = bodyAt(z); bS.push([z, b.w, b.top - b.bot, R, (b.top + b.bot) / 2]); }
  add(g, shell(bS, white));
  // dark cores fill the hairline seams so they read as fine dark lines
  add(g, H.rslab(42.4, 131.4, 1.0, 9.7, .1, voidM), 0, 0, 27.9);
  const br = bodyAt(zb0); add(g, H.rslab(br.w - .6, br.top - br.bot - .6, .9, 9.7, .1, voidM), 0, (br.top + br.bot) / 2, 8.9);

  /* ---------- back plate / bracket: z 2.2 -> 8.75, rounding into the wall ---------- */
  const pS = [], D = 6.55;
  for (let i = 0; i <= 14; i++) { const a = i / 14 * PI / 2, s = D * Math.sin(a), z = 8.75 - s;
    const top = br.top - 7.0 * (1 - Math.cos(a)), bot = br.bot + 6.0 * (1 - Math.cos(a));
    const d = Math.max(0, s - 3.21), side = 4 - Math.sqrt(Math.max(0, 16 - d * d));
    pS.push([z, br.w - 2 * side, top - bot, R, (top + bot) / 2]); }
  add(g, shell(pS, [plateL, plate]));
  // back face: arch cap outline, pads, wire boss
  const yTopB = br.top - 7, wB = br.w - 3.6;
  const bp2 = pp(wB, 34, (x, P) => { x.strokeStyle = '#b4b6b8'; x.lineWidth = 2.5; x.beginPath(); const o = -41;   // plane centre at y 41
    x.moveTo(...P(-wB / 2, 29 + o)); x.lineTo(...P(-13.5, 29 + o)); x.lineTo(...P(-13.5, 41.5 + o));
    const [cx, cy] = P(0, 41.5 + o); x.arc(cx, cy, 135, PI, 0, false); x.lineTo(...P(13.5, 29 + o)); x.lineTo(...P(wB / 2, 29 + o)); x.stroke(); });
  bp2.rotation.y = PI; add(g, bp2, 0, 41, 2.19);
  const upPad = rrS(22, 14, 5, 0, 37); const wire = rrS(7, 4, 2, 0, 38); upPad.holes.push(new THREE.Path(wire.getPoints().reverse()));
  add(g, H.ext(upPad, 2.25, .5, plate));
  add(g, H.rslab(7, 4, .3, 1.9, .05, voidM), 0, 38, 1.2);
  const loPad = rrS(11, 21, 5.5, 0, -43.5); loPad.holes.push(new THREE.Path(rrS(4, 13, 2, 0, -43.5).getPoints().reverse()));
  add(g, H.ext(loPad, 2.25, .5, plate));
  add(g, H.rslab(4.2, 13.2, .3, 2, .05, phys(0xcfd0d0, { roughness: .7 })), 0, -43.5, 1.5);
  const boss = rrS(14.5, 14.5, 3, 0, -7); boss.holes.push(circ(-1.75, -7, .75), circ(1.75, -7, .75));
  const bm = add(g, H.ext(boss, 1.1, .3, plate), 0, 0, 1.15);
  for (const x of [-1.75, 1.75]) add(g, disc(0, .8, voidM), x, -7, 1.6).rotation.y = PI;

  /* ---------- bottom face: notch, speaker slots, security-screw tab ---------- */
  const slope = 1.3 / (zb1 - zb0), ybAt = z => bodyAt(z).bot;
  const bot = add(g, G(), 0, ybAt(18), 18); bot.rotation.x = Math.atan(slope);          // frame lying on the sloped bottom, +z toward the front
  const under = (p, z) => { p.rotation.x = PI / 2; add(bot, p, 0, -.03, (z - 18) / Math.cos(Math.atan(slope))); return p; };
  under(pp(22, 8, (x, P) => { for (const zz of [22.4, 19.7, 16.9]) { const [a, b] = P(-9.75, zz - 19.7), [c] = P(9.75, 0);
      x.fillStyle = '#0a0a0b'; x.beginPath(); x.roundRect(a - 4.5, b - 4.5, c - a + 9, 9, 4.5); x.fill();
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(a, b + 3, c - a, 1.5); } }), 19.7);
  under(pp(8, 2.4, (x, P) => { const [a, b] = P(-3.25, .6), [c, d] = P(3.25, -.6); x.fillStyle = '#5c5e60'; x.fillRect(a, b, c - a, d - b);
      x.fillStyle = '#b9bbbc'; x.fillRect(a + 4, b + 5, c - a - 8, d - b - 5); }), 27.2);
  // security-screw tab: flush with the bottom, carries on under the curved back plate as a small nub
  const tabS = rrS(10.7, 9.8, 2); const tab = H.ext(tabS, 3.5, .3, tabM); tab.rotation.x = -PI / 2;
  add(bot, tab, 0, -.04, (9 - 18) / Math.cos(Math.atan(slope)));
  const tz = (9 - 18) / Math.cos(Math.atan(slope));
  const tp = pp(12, 11, (x, P) => { x.strokeStyle = '#9fa1a3'; x.lineWidth = 3; x.beginPath(); const [a, b] = P(-5.5, 5.05), [c, d] = P(5.5, -5.05); x.roundRect(a, b, c - a, d - b, 22); x.stroke();
      const [cx, cy] = P(0, 0); const gr = x.createRadialGradient(cx, cy, 2, cx, cy, 20); gr.addColorStop(0, '#000'); gr.addColorStop(.75, '#111'); gr.addColorStop(1, '#3a3b3c');
      x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, 19.5, 0, 2 * PI); x.fill();
      x.fillStyle = '#2a2b2c'; for (let i = 0; i < 6; i++) { const a2 = i * PI / 3; x.beginPath(); x.arc(cx + 5 * Math.cos(a2), cy + 5 * Math.sin(a2), 2.2, 0, 2 * PI); x.fill(); } });
  tp.rotation.x = PI / 2; add(bot, tp, 0, -.08, tz);

  /* ---------- lens: proud bezel, smoky window, recessed barrel and element ---------- */
  const L = add(g, G(), 0, LY, ZF);
  add(L, lathe([[8.25, .7], [8.25, 1.0], [9.45, 1.0], [9.85, .6], [9.85, -.6]], bezel));
  add(L, disc(4.15, 8.25, smoke), 0, 0, .7);
  add(L, tube(4.15, -.3, .7, bezel));
  add(L, disc(2.75, 4.15, voidM), 0, 0, -.3);
  add(L, H.torus(3.45, .1, H.PM.grey), 0, 0, -.27);
  add(L, tube(2.75, -.85, -.3, voidM));
  add(L, H.dome(2.75, .45, lensM), 0, 0, -.85);
  add(L, disc(0, 9.0, voidM), 0, 0, -.65);

  /* ---------- mic / light-sensor holes (recessed) ---------- */
  for (const x of [-6.2, 6.2]) { add(g, tube(.8, ZF - 1, ZF, voidM), x, 20.6, 0); add(g, disc(0, .8, voidM), x, 20.6, ZF - 1); }

  /* ---------- wordmark (flush print) ---------- */
  add(g, H.decal(H.DEC.logo, 34, 8.5, { color: 0xd6d6d6, r: .4 }), 0, -19.5, ZF + .01);

  /* ---------- light ring (flush) + recessed doorbell button ---------- */
  const B = add(g, G(), 0, BY, ZF);
  add(B, lathe([[13.4, -.12], [13.45, -.02], [13.55, -.01], [15.3, -.01], [15.42, -.04], [15.45, -.15], [15.45, -1.6]], ringM));
  add(B, tube(13.3, -1.15, -.12, btn));
  add(B, lathe([[0, -1.45], [5, -1.4], [9, -1.27], [12.3, -1.1], [12.95, -1.07], [13.2, -1.14], [13.25, -1.3], [13.25, -2.6]], btn));
  add(B, disc(13.25, 15.5, voidM), 0, 0, -1.6);
  // soft additive glow just outside and inside the ring
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d');
  const gr = gx.createRadialGradient(128, 128, 0, 128, 128, 128), r0 = 15.375 / 19;
  gr.addColorStop(0, 'rgba(255,50,15,0)'); gr.addColorStop(r0 - .14, 'rgba(255,50,15,0)'); gr.addColorStop(r0, 'rgba(255,60,20,.45)');
  gr.addColorStop(r0 + .09, 'rgba(255,50,15,.12)'); gr.addColorStop(1, 'rgba(255,50,15,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 256, 256);
  const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
  add(B, new THREE.Mesh(new THREE.PlaneGeometry(38, 38), new THREE.MeshBasicMaterial({ map: gt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })), 0, 0, .04);

  g.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = false; } });
  return out;
};
