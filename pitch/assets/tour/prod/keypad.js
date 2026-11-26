// Keypad: Vivint wireless keypad, 80.0 x 150.1 x 14 mm (depth taken from the photos/renders: the spec sheet's 26.7 mm does not match them). One moulded body: grey back shell that flares out 2.1 mm toward the
// wall, flush colour split at z = 8.7 mm into the white front cover (vertical band, R3 roll into a flat face). Soft-dome keys only
// 0.8 mm proud with hairline outlines, a flush frosted motion lens, three emergency keys recessed in dark sloped rings with
// dished tops, printed legends and wordmark, downcast-light slot under the bottom, buzzer holes on the right side.
export default H => {
  const { THREE, G, add, splitMat, printPlane } = H;
  const g = G(), mm = v => v / 1000;

  /* ---------- helpers ---------- */
  const rrPts = (w, h, r, nc = 12) => { r = Math.max(1e-6, Math.min(r, w / 2, h / 2)); const x = w / 2 - r, y = h / 2 - r, P = [];
    for (const [cx, cy, a0] of [[x, y, 0], [-x, y, Math.PI / 2], [-x, -y, Math.PI], [x, -y, 1.5 * Math.PI]])
      for (let i = 0; i <= nc; i++) { const a = a0 + i / nc * Math.PI / 2; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return P; };
  const ringMesh = (rings, m, capFront = true, capBack = false) => { const n = rings[0].length, pos = [], idx = [];
    for (const R of rings) for (const p of R) pos.push(...p);
    for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < n; i++) { const a = r * n + i, b = r * n + (i + 1) % n, c = a + n, d = b + n; idx.push(a, b, c, b, d, c); }
    const cap = (ri, flip) => { const R = rings[ri]; let cx = 0, cy = 0, cz = 0; for (const p of R) { cx += p[0] / n; cy += p[1] / n; cz += p[2] / n; }
      const base = pos.length / 3; for (const p of R) pos.push(...p); const ci = pos.length / 3; pos.push(cx, cy, cz);
      for (let i = 0; i < n; i++) flip ? idx.push(base + (i + 1) % n, base + i, ci) : idx.push(base + i, base + (i + 1) % n, ci); };
    if (capFront) cap(rings.length - 1, false); if (capBack) cap(0, true);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const me = new THREE.Mesh(geo, m); me.castShadow = me.receiveShadow = true; return me; };
  const pillowZ = (hr, er, crown, half) => d => d < er ? hr - er + Math.sqrt(Math.max(0, er * er - (er - d) ** 2)) : hr + crown * (1 - (1 - Math.min(1, (d - er) / Math.max(1e-6, half - er))) ** 2);
  const pillow = (w, h, r, hr, er, crown, m, sink = mm(.4)) => { const half = Math.min(w, h) / 2, zf = pillowZ(hr, er, crown, half), rings = [];
    const ring = (d, z) => rrPts(w - 2 * d, h - 2 * d, r - d).map(([x, y]) => [x, y, z]);
    rings.push(ring(0, -sink));
    for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; rings.push(ring(er * (1 - Math.cos(a)), hr - er + er * Math.sin(a))); }
    for (let i = 1; i <= 10; i++) { const d = er + (half - er) * (i / 10) * .985; rings.push(ring(d, zf(d))); }
    const me = ringMesh(rings, m); me.userData.zf = zf; return me; };
  const inset = (x, y, w, h, r) => { const qx = Math.abs(x) - (w / 2 - r), qy = Math.abs(y) - (h / 2 - r);
    return -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r); };
  const conform = (pl, zfn, seg = 24) => { const p = pl.geometry.parameters, geo = new THREE.PlaneGeometry(p.width, p.height, seg, seg), a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) a.setZ(i, zfn(a.getX(i), a.getY(i)) + mm(.03)); geo.computeVertexNormals(); pl.geometry.dispose(); pl.geometry = geo; return pl; };
  const lathe = (pts, m, seg = 96) => { const geo = new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(mm(r), mm(z))), seg);
    const me = new THREE.Mesh(geo, m); me.rotation.x = Math.PI / 2; me.castShadow = me.receiveShadow = true; return me; };
  const FONT = '"Vivint Sans", "Circular Std", "Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif';

  /* ---------- materials ---------- */
  const grey = new THREE.MeshPhysicalMaterial({ color: 0x9d9d9a, roughness: .62, clearcoat: .05 });
  const white = new THREE.MeshPhysicalMaterial({ color: 0xeeeeed, roughness: .45, clearcoat: .1, clearcoatRoughness: .5 });
  const body = splitMat(grey, white, 'z', mm(8.7), mm(.35), 0x6e6e6c);
  const faceM = white.clone();
  const keyM = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f3, roughness: .5, sheen: .5, sheenRoughness: .6, sheenColor: 0xffffff, clearcoat: .1, clearcoatRoughness: .6 });
  const hair = new THREE.MeshStandardMaterial({ color: 0xa9a9a9, roughness: .7 });
  const ringM = new THREE.MeshStandardMaterial({ color: 0x2f3031, roughness: .8, side: THREE.DoubleSide });
  const lensM = new THREE.MeshPhysicalMaterial({ color: 0x96989a, roughness: .75, sheen: .3, sheenColor: 0xffffff });
  const lightM = new THREE.MeshPhysicalMaterial({ color: 0xdcdedb, roughness: .4, emissive: 0x83f4b8, emissiveIntensity: .0 });
  const holeM = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: .9 });

  /* ---------- body ---------- */
  const W = 80.0, Hh = 150.1, FZ = mm(14.0), rings = [];
  const ring = (d, r, z) => rrPts(mm(W - 2 * d), mm(Hh - 2 * d), mm(r)).map(([x, y]) => [x, y, mm(z)]);
  for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI / 2; const d = 1.5 * (1 - Math.sin(a)); rings.push(ring(d, 14.3 - d, 1.5 * (1 - Math.cos(a)))); }
  for (let i = 1; i <= 10; i++) { const t = i / 10, d = 2.1 * t * t; rings.push(ring(d, 14.3 - 2.1 * t, 1.5 + 7.2 * t)); }
  rings.push(ring(2.1, 12.2, 9.9), ring(2.1, 12.2, 11.0));
  for (let i = 1; i <= 8; i++) { const a = i / 8 * Math.PI / 2, d = 2.1 + 3 * (1 - Math.cos(a)); rings.push(ring(d, 12.2 - 3 * (1 - Math.cos(a)), 11.0 + 3 * Math.sin(a))); }
  add(g, ringMesh(rings, body, false, true));
  // flat face with the three emergency openings
  const ER = 7.65, EY = -52.4, EX = [-21.1, 0, 21.1];
  { const R = rings[rings.length - 1], s = new THREE.Shape(R.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const x of EX) { const h = new THREE.Path(); h.absarc(mm(x), mm(EY), mm(ER), 0, Math.PI * 2, true); s.holes.push(h); }
    const geo = new THREE.ShapeGeometry(s, 48); const f = new THREE.Mesh(geo, faceM); f.receiveShadow = true; add(g, f, 0, 0, FZ); }

  /* ---------- keys ---------- */
  const keyAt = (x, y, w, h, r, label, font, dy = 0) => {
    const ol = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(rrPts(mm(w + .5), mm(h + .5), mm(r + .25)).map(([a, b]) => new THREE.Vector2(a, b)))), hair);
    add(g, ol, mm(x), mm(y), FZ + mm(.02));
    const k = add(g, pillow(mm(w), mm(h), mm(r), mm(.45), mm(.45), mm(.35), keyM), mm(x), mm(y), FZ);
    if (label) add(g, conform(printPlane(mm(Math.min(w, 20)), mm(h * .7), (c, P) => { c.fillStyle = '#363636'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.font = font; c.fillText(label, ...P(0, mm(dy))); }), (px, py) => k.userData.zf(inset(px + 0, py, mm(w), mm(h), mm(r)))), mm(x), mm(y), FZ);
    return k; };
  keyAt(-16.7, 56.6, 23.4, 14.3, 7.15, 'Stay', '500 46px ' + FONT, -1.65);
  keyAt(16.7, 56.6, 23.4, 14.3, 7.15, 'Away', '500 46px ' + FONT, -1.65);
  const CX = [-21.1, 0, 21.1], RY = [35.4, 14.3, -6.8, -27.9], D = 14.35;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) keyAt(CX[c], RY[r], D, D, D / 2, String(r * 3 + c + 1), '400 64px ' + FONT, -2.25);
  keyAt(CX[0], RY[3], D, D, D / 2, 'Clear', '400 44px ' + FONT, -1.5);
  keyAt(CX[1], RY[3], D, D, D / 2, '0', '400 64px ' + FONT, -2.25);
  { // tactile dot above the 5
    const zf = (D / 2 - 3.0); const kz = (mm(.45) + mm(.35) * (1 - (1 - Math.min(1, (mm(zf) - mm(.45)) / (mm(D / 2) - mm(.45)))) ** 2));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(mm(.4), 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), keyM); dot.rotation.x = Math.PI / 2; dot.scale.set(1, .75, 1);
    add(g, dot, mm(CX[1]), mm(RY[1] + 3.0), FZ + kz - mm(.02)); }
  // motion lens, flush (0.2 mm proud), frosted grey
  { const l = new THREE.Mesh(new THREE.CylinderGeometry(mm(7.15), mm(7.15), mm(.5), 64), lensM); l.rotation.x = Math.PI / 2; add(g, l, mm(CX[2]), mm(RY[3]), FZ - mm(.05));
    add(g, lathe([[7.15, -.3], [7.15, .12], [7.0, .2], [0, .2]], lensM, 64), mm(CX[2]), mm(RY[3]), FZ); }

  /* ---------- emergency keys ---------- */
  const icons = [
    (c, P) => { const [x, y] = P(0, 0); c.beginPath(); c.moveTo(x, y - 24); c.quadraticCurveTo(x + 10, y - 17, x + 19, y - 19); c.lineTo(x + 19, y - 4);   // police badge with star
      c.quadraticCurveTo(x + 19, y + 15, x, y + 24); c.quadraticCurveTo(x - 19, y + 15, x - 19, y - 4); c.lineTo(x - 19, y - 19); c.quadraticCurveTo(x - 10, y - 17, x, y - 24); c.closePath(); c.stroke();
      c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 3.4 : 8; c.lineTo(x + rr * Math.cos(a), y + 1 + rr * Math.sin(a)); } c.closePath(); c.stroke(); },
    (c, P) => { const [x, y] = P(0, 0); c.beginPath();                                                                     // medical plus
      for (const [a, b] of [[-7, -22], [7, -22], [7, -7], [22, -7], [22, 7], [7, 7], [7, 22], [-7, 22], [-7, 7], [-22, 7], [-22, -7], [-7, -7]]) c.lineTo(x + a, y + b); c.closePath(); c.stroke(); },
    (c, P) => { const [x, y] = P(0, 0); c.beginPath(); c.moveTo(x, y + 23);                                                // flame with inner flame
      c.bezierCurveTo(x - 22, y + 22, x - 20, y - 2, x - 6, y - 23); c.bezierCurveTo(x - 4, y - 10, x + 4, y - 9, x + 8, y - 16); c.bezierCurveTo(x + 22, y - 1, x + 21, y + 22, x, y + 23); c.stroke();
      c.beginPath(); c.moveTo(x, y + 21); c.bezierCurveTo(x - 9, y + 20, x - 8, y + 8, x - 1, y + 1); c.bezierCurveTo(x + 1, y + 7, x + 6, y + 8, x + 6, y + 12); c.bezierCurveTo(x + 8, y + 17, x + 5, y + 21, x, y + 21); c.stroke(); }];
  const dish = r => -1.0 - .6 * (1 - Math.min(1, (r / 5.7)) ** 2);
  EX.forEach((x, i) => {
    add(g, lathe([[ER, .02], [ER - .15, -.05], [6.15, -1.0], [6.15, -2.6]], ringM), mm(x), mm(EY), FZ);            // dark conical bezel
    const prof = [[6.1, -2.6], [6.1, -1.2], [6.0, -1.03], [5.75, -1.0]]; for (let k = 1; k <= 10; k++) { const r = 5.7 * (1 - k / 10); prof.push([r, dish(r)]); }
    add(g, lathe(prof, keyM), mm(x), mm(EY), FZ);                                                                       // concave white button
    add(g, conform(printPlane(mm(7), mm(7), (c, P) => { c.strokeStyle = '#4a4a4a'; c.lineWidth = 4; c.lineJoin = c.lineCap = 'round'; icons[i](c, P); }),
      (px, py) => mm(dish(Math.hypot(px, py) * 1000))), mm(x), mm(EY), FZ);
  });

  /* ---------- printing on the face ---------- */
  add(g, printPlane(mm(20), mm(6), (c, P) => { c.fillStyle = '#8a8a8a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '700 40px ' + FONT; const w = c.measureText('vivint').width; c.save(); c.translate(...P(0, 0)); c.scale(125 / w, 125 / w * .95); c.fillText('vivint', 0, 0); c.restore(); }),
    0, mm(-67.6), FZ + mm(.03));

  /* ---------- downcast light (bottom face) and buzzer holes (right side) ---------- */
  { const sh = new THREE.Shape(rrPts(mm(40), mm(2), mm(1)).map(([a, b]) => new THREE.Vector2(a, b)));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: mm(.4), bevelEnabled: true, bevelThickness: mm(.15), bevelSize: mm(.15), bevelOffset: -mm(.15), bevelSegments: 3 });
    const m = new THREE.Mesh(geo, lightM); m.rotation.x = Math.PI / 2 + .28; add(g, m, 0, mm(-74.55 + .45), mm(5)); }
  for (let k = -1; k <= 1; k++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(mm(.5), mm(.5), mm(.6), 20), holeM); h.scale.set(1.6, 1, 1); h.rotation.z = Math.PI / 2; h.rotation.y = -.28;
    add(g, h, mm(39.5 - .25), mm(-3 + k * 2.8), mm(5)); }
  return g;
};
