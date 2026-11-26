// Garage Door Controller: Chamberlain myQ Smart Garage Control hub (MYQ-G0401), 98.4 x 98.4 x 31 mm (depth measured from the angled photos; listings say 38 mm incl. the bracket).
// One moulded superellipse body (n = 3, no straight sides): grey base flaring 1.9 mm out to the wall, flush colour split at
// z = 10 mm into the white cover, big R6 roll into a gently domed face. A real 6 mm deep soft-walled light well holds a raised
// frosted lens over a 3 x 4 LED array; printed CHAMBERLAIN, zig-zag vent slots, myQ connected, three near-flush pill buttons
// with hairline grooves, and the ribbed power-cord boot on the right side with the white cord running down the wall.
export default H => {
  const { THREE, G, add, splitMat, printPlane } = H;
  const g = G(), mm = v => v / 1000;

  /* ---------- helpers ---------- */
  const rrPts = (w, h, r, nc = 10) => { r = Math.max(1e-6, Math.min(r, w / 2, h / 2)); const x = w / 2 - r, y = h / 2 - r, P = [];
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
  const pillow = (w, h, r, hr, er, crown, m, sink = mm(.6)) => { const half = Math.min(w, h) / 2, zf = pillowZ(hr, er, crown, half), rings = [];
    const ring = (d, z) => rrPts(w - 2 * d, h - 2 * d, r - d).map(([x, y]) => [x, y, z]);
    rings.push(ring(0, -sink));
    for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; rings.push(ring(er * (1 - Math.cos(a)), hr - er + er * Math.sin(a))); }
    for (let i = 1; i <= 8; i++) { const d = er + (half - er) * (i / 8) * .985; rings.push(ring(d, zf(d))); }
    const me = ringMesh(rings, m); me.userData.zf = zf; return me; };
  const conform = (pl, zfn, seg = 32) => { const p = pl.geometry.parameters, geo = new THREE.PlaneGeometry(p.width, p.height, seg, seg), a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) a.setZ(i, zfn(a.getX(i), a.getY(i)) + mm(.03)); geo.computeVertexNormals(); pl.geometry.dispose(); pl.geometry = geo; return pl; };
  const sq = (a, t) => { const c = Math.cos(t), s = Math.sin(t); return [a * Math.sign(c) * Math.abs(c) ** (2 / 3), a * Math.sign(s) * Math.abs(s) ** (2 / 3)]; };   // superellipse n = 3
  const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  /* ---------- materials ---------- */
  const grey = new THREE.MeshPhysicalMaterial({ color: 0xb9b9b7, roughness: .58, clearcoat: .05 });
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf1f1ef, roughness: .4, clearcoat: .15, clearcoatRoughness: .45 });
  const bodyM = splitMat(grey, white, 'z', mm(10), mm(.2), 0x8e8e8c);
  const lensM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, clearcoat: 1, clearcoatRoughness: .05, transparent: true, opacity: .12, depthWrite: false });
  const boardM = new THREE.MeshStandardMaterial({ color: 0x3e443c, roughness: .7 });
  const ledM = new THREE.MeshPhysicalMaterial({ color: 0xe2bb48, roughness: .35, emissive: 0xffc540, emissiveIntensity: .3, clearcoat: .6 });
  const ledFrameM = new THREE.MeshStandardMaterial({ color: 0xf2f0e8, roughness: .5 });
  const btnM = white.clone(), outlineM = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const cordM = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f2, roughness: .45, clearcoat: .2 });

  /* ---------- body + face + light well: one watertight shell ---------- */
  const N = 160, A0 = 49.2, A1 = 46.4, RR = 5.5, ZV = 24.0, ZE = 29.5, AF = A1 - RR;        // AF: where the roll meets the face
  const dome = (x, y) => { const rho = Math.cbrt(Math.abs(x) ** 3 + Math.abs(y) ** 3); return ZE + 1.5 * (1 - Math.min(1, rho / AF) ** 2); };   // mm
  const T = [...Array(N)].map((_, i) => i / N * Math.PI * 2);
  const ringA = (a, z) => T.map(t => { const [x, y] = sq(a, t); return [mm(x), mm(y), mm(z)]; });
  const rings = [];
  for (let i = 0; i <= 5; i++) { const q = i / 5 * Math.PI / 2; rings.push(ringA(A0 - 1.5 * (1 - Math.sin(q)), 1.5 * (1 - Math.cos(q)))); }
  for (let i = 1; i <= 8; i++) { const t = i / 8; rings.push(ringA(A0 - (A0 - A1) * t ** 1.5, 1.5 + 8.5 * t)); }
  rings.push(ringA(A1, 15), ringA(A1, 19.5), ringA(A1, ZV));
  for (let i = 1; i <= 10; i++) { const q = i / 10 * Math.PI / 2; rings.push(ringA(A1 - RR * (1 - Math.cos(q)), ZV + RR * Math.sin(q))); }
  // pocket opening: rounded rect 34 x 32, r 10, centred (0, 1); each face ray runs from the pocket centre to the outer ring point
  const PC = [0, -.5], PW = 35.5, PH = 34, PR = 10.5;
  const inRR = (x, y) => { const qx = Math.abs(x - PC[0]) - (PW / 2 - PR), qy = Math.abs(y - PC[1]) - (PH / 2 - PR); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - PR; };
  const outer = T.map(t => sq(AF, t));
  const inner = outer.map(([ox, oy]) => { const dx = ox - PC[0], dy = oy - PC[1]; let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; inRR(PC[0] + dx * m, PC[1] + dy * m) < 0 ? lo = m : hi = m; } return [PC[0] + dx * lo, PC[1] + dy * lo]; });
  const FK = 16;
  for (let k = 1; k <= FK; k++) { const s = k / FK, e = s; rings.push(outer.map(([ox, oy], i) => { const x = ox + (inner[i][0] - ox) * e, y = oy + (inner[i][1] - oy) * e; return [mm(x), mm(y), mm(dome(x, y))]; })); }
  // light well: a shallow soft dish (1.5 mm), then a sharp rounded-square hole 25 x 25 (r 6) with near-vertical walls down to the floor
  const HW = 25, HR = 6, ZF = ZE - 8, DD = 2.2;
  const inHole = (x, y) => { const qx = Math.abs(x - PC[0]) - (HW / 2 - HR), qy = Math.abs(y - PC[1]) - (HW / 2 - HR); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - HR; };
  const hole = inner.map(([ix, iy]) => { const dx = ix - PC[0], dy = iy - PC[1]; let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; inHole(PC[0] + dx * m, PC[1] + dy * m) < 0 ? lo = m : hi = m; } return [PC[0] + dx * lo, PC[1] + dy * lo]; });
  const top = inner.map(([x, y]) => dome(x, y));
  for (let k = 1; k <= 8; k++) { const t = k / 8, dep = DD * (1 - Math.cos(t * Math.PI / 2)) ** .9;   // dish: tangent to the face, steepening toward the hole
    rings.push(inner.map(([x, y], i) => [mm(x + (hole[i][0] - x) * t), mm(y + (hole[i][1] - y) * t), mm(top[i] - dep)])); }
  const nBody = rings.length;                                                                // rings so far: shell, face and dish (up to the hole edge)
  for (const [s2, dz] of [[.999, .05], [.996, .22], [.99, 3], [.99, 6.6], [.985, 7.0], [.97, 7.4]])   // crisp edge, vertical wall, small floor round
    rings.push(hole.map(([x, y], i) => [mm(PC[0] + (x - PC[0]) * s2), mm(PC[1] + (y - PC[1]) * s2), mm(Math.max(ZF, top[i] - DD - dz))]));
  for (const s2 of [.7, .4, .12]) rings.push(hole.map(([x, y]) => [mm(PC[0] + (x - PC[0]) * s2), mm(PC[1] + (y - PC[1]) * s2), mm(ZF)]));
  add(g, ringMesh(rings.slice(0, nBody), bodyM, false, true));
  { // hole walls and floor: same white plastic, darkened toward the floor (baked ambient occlusion) like the shadowed well in the photos
    const wm = ringMesh(rings.slice(nBody - 1), new THREE.MeshPhysicalMaterial({ color: 0xd4d1c4, roughness: .45, vertexColors: true }), true, false);
    const pa = wm.geometry.attributes.position, col = [], zTop = mm(dome(0, PC[1]) - DD);
    const n = hole.length;
    for (let i = 0; i < pa.count; i++) { const t = Math.min(1, Math.max(0, (pa.getZ(i) - mm(ZF)) / (zTop - mm(ZF)))), top = Math.max(0, (pa.getY(i) - mm(PC[1])) / mm(HW / 2));
      let f = (.8 + .2 * t ** 1.5) * (1 - .12 * top * (1 - t * .5));                                     // darker toward the floor, and more on the top wall (shadowed from above)
      if (Math.floor(i / n) === 1) f = .5;                                                                // 0.3 mm dark line right under the hole edge (0x6a6a66 on 0xd4d1c4)
      col.push(f, f, f); }
    wm.geometry.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); add(g, wm); }

  /* ---------- LED board, 12 separate SMD packages, clear lens ---------- */
  const lc = [0, mm(PC[1])], faceC = dome(0, PC[1]);
  add(g, H.rslab(mm(15.4), mm(13.6), mm(.6), mm(.8), mm(.15), boardM), lc[0], lc[1], mm(ZF + .3));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = mm((c - 1.5) * 3.9), y = lc[1] + mm((1 - r) * 4.6);
    add(g, H.rslab(mm(3.0), mm(3.4), mm(.5), mm(.25), mm(.1), ledFrameM), x, y, mm(ZF + .85));
    add(g, H.rslab(mm(2.4), mm(2.8), mm(.2), mm(.2), mm(.05), ledM), x, y, mm(ZF + 1.06)); }
  { const lens = H.rslab(mm(24), mm(24), mm(2.5), mm(5.5), mm(.4), lensM); lens.castShadow = false; lens.renderOrder = 2; lens.material = [lensM, new THREE.MeshPhysicalMaterial({ color: 0x8c9090, roughness: .2, clearcoat: .5 })];   // caps clear, sides show the block's thickness
    add(g, lens, lc[0], lc[1], mm(faceC - 4 - 1.25));
    const bev = new THREE.Mesh(new THREE.ShapeGeometry((() => { const o = new THREE.Shape(rrPts(mm(24), mm(24), mm(5.5)).map(([a, b]) => new THREE.Vector2(a, b))); o.holes.push(new THREE.Path(rrPts(mm(23.2), mm(23.2), mm(5.1)).map(([a, b]) => new THREE.Vector2(a, b)))); return o; })()),
      new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: .2, transparent: true, opacity: .75 }));
    add(g, bev, lc[0], lc[1], mm(faceC - 4 + .01)); }   // the lens's bright 0.4 mm bevel edge

  /* ---------- printing (conformed to the dome) ---------- */
  const printAt = (cx, cy, w, h, draw) => add(g, conform(printPlane(mm(w), mm(h), draw), (px, py) => mm(dome(cx + px * 1000, cy + py * 1000))), mm(cx), mm(cy), 0);
  printAt(0, 35.0, 50, 6, (c, P) => {                                                         // CHAMBERLAIN, its E drawn as three detached bars
    c.fillStyle = '#6a6a6a'; c.textBaseline = 'alphabetic'; c.font = '500 34px ' + FONT;
    const parts = ['C', 'H', 'A', 'M', 'B', 'E', 'R', 'L', 'A', 'I', 'N'], sp = 7, wE = 22;
    const ws = parts.map(ch => ch === 'E' ? wE : c.measureText(ch).width * 1.18); const tot = ws.reduce((a, b) => a + b, 0) + sp * (parts.length - 1);
    const k = 435 / tot; let [x, y] = P(mm(-21.75), mm(-1.2)); c.save(); c.translate(x, y); c.scale(k, 1);
    let cx = 0; parts.forEach((ch, i) => { if (ch === 'E') { for (const b of [0, 1, 2]) c.fillRect(cx + 1, -33 + b * 13.2, wE - 3, 5.5); }
      else { c.save(); c.translate(cx, 0); c.scale(1.18, 1); c.fillText(ch, 0, 0); c.restore(); } cx += ws[i] + sp; });
    c.restore(); c.font = '400 9px ' + FONT; c.beginPath(); const [rx, ry] = P(mm(22.4), mm(-.6)); c.arc(rx, ry, 4.6, 0, Math.PI * 2); c.lineWidth = .9; c.strokeStyle = '#6e6e6e'; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('R', rx, ry + .5); });
  printAt(0, 25, 34, 10, (c, P) => {                                                          // vent slots: light dimples + dark through-holes, zig-zag
    const slot = (x, y, dark) => { const [px, py] = P(mm(x), mm(y)); const w = 11, h = 30;
      if (dark) { c.fillStyle = '#1a1a1a'; c.beginPath(); c.roundRect(px - w / 2, py - h / 2, w, h, w / 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.roundRect(px - w / 2 + 1, py + h / 2 - 5, w - 2, 4, 2); c.fill(); return; }
      const gr = c.createLinearGradient(px, py - h / 2, px, py + h / 2); gr.addColorStop(0, 'rgba(95,95,93,.9)'); gr.addColorStop(.45, 'rgba(165,165,163,.7)'); gr.addColorStop(1, 'rgba(225,225,223,.35)');
      c.fillStyle = gr; c.beginPath(); c.roundRect(px - w / 2, py - h / 2, w, h, w / 2); c.fill();
      c.strokeStyle = 'rgba(150,150,148,.55)'; c.lineWidth = 1.2; c.stroke(); };
    for (const x of [-12.6, -4.2, 4.2, 12.6]) { slot(x, 2.8, false); slot(x, -2.7, false); }
    for (const x of [-8.4, 0, 8.4]) slot(x, .6, true); });
  printAt(31.0, -.6, 24, 14, (c, P) => {                                                      // myQ connected
    c.fillStyle = '#858585'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    let [x, y] = P(mm(-7.3), mm(.5)); c.font = '200 56px ' + FONT; c.fillText('my', x, y); const wmy = c.measureText('my').width;
    c.font = '700 60px ' + FONT; c.fillText('Q', x + wmy + 1, y); const wq = c.measureText('Q').width;
    c.font = '400 14px ' + FONT; c.fillText('®', x + wmy + wq + 1, y - 37);
    c.fillStyle = '#8c8c8c'; c.font = '500 23px ' + FONT; c.textAlign = 'center'; [x, y] = P(mm(-.5), mm(-4.3)); c.fillText('connected™', x, y); });

  /* ---------- three near-flush pill buttons ---------- */
  const icon = [
    (c, x, y) => { c.strokeRect(x - 5, y - 5, 10, 10); },
    (c, x, y) => { c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(x + 6 * Math.cos(a), y + 6 * Math.sin(a)); c.lineTo(x + 8.5 * Math.cos(a), y + 8.5 * Math.sin(a)); c.stroke(); } },
    (c, x, y) => { c.beginPath(); c.roundRect(x - 5, y - 11, 10, 9, 2.5); c.roundRect(x - 5, y + 2, 10, 9, 2.5); c.stroke(); }];
  [-18.6, 0, 18.6].forEach((bx, i) => { const by = -32.6, bz = dome(bx, by);
    const bg = add(g, G(), mm(bx), mm(by), mm(bz));                      // follows the domed face: tilted to its local slope
    bg.rotation.x = Math.atan((dome(bx, by + .5) - dome(bx, by - .5)) / 1); bg.rotation.y = -Math.atan((dome(bx + .5, by) - dome(bx - .5, by)) / 1);
    { const sh = new THREE.Shape(rrPts(mm(6.6), mm(10.6), mm(3.3)).map(([a, b]) => new THREE.Vector2(a, b))), hp = new THREE.Path(rrPts(mm(6.0), mm(10.0), mm(3.0)).map(([a, b]) => new THREE.Vector2(a, b)));
      sh.holes.push(hp); add(bg, new THREE.Mesh(new THREE.ShapeGeometry(sh), outlineM), 0, 0, mm(.03)); }   // single crisp groove line
    add(bg, pillow(mm(6), mm(10), mm(3), mm(.22), mm(.2), mm(.1), btnM), 0, 0, mm(-.02));
    add(bg, conform(printPlane(mm(5), mm(8), (c, P) => { c.strokeStyle = '#777'; c.lineWidth = 2.4; const [x, y] = P(0, mm(-1.2)); icon[i](c, x, y); }), () => mm(.32)), 0, 0, mm(-.02)); });

  /* ---------- power cord: ribbed boot out of the right side, white cord down the wall ---------- */
  { const prof = [[3.05, -1.0], [3.05, 1.0]]; for (let k = 0; k < 5; k++) { const y0 = 1.8 + k * 2.6; prof.push([2.95 - k * .1, y0], [3.3 - k * .1, y0 + .6], [3.3 - k * .1, y0 + 1.3], [2.95 - k * .1, y0 + 1.9]); }
    prof.push([2.3, 15.0], [1.9, 15.7], [1.6, 16.0], [0, 16.1]);
    const boot = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(mm(r), mm(y))), 48), cordM); boot.rotation.z = -Math.PI / 2; boot.castShadow = true;
    add(g, boot, mm(47.95), mm(-1.5), mm(6.5));
    const sock = new THREE.Mesh(new THREE.RingGeometry(mm(3.05), mm(3.8), 48), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    sock.rotation.y = Math.PI / 2; add(g, sock, mm(47.97), mm(-1.5), mm(6.5));   // dark socket round the boot
    const curve = new THREE.CatmullRomCurve3([[63.6, -1.5, 6.5], [67, -3.5, 6.0], [69.5, -11, 5.2], [70.5, -25, 3.2], [70.6, -50, 2.0], [70.4, -80, 1.9]].map(([x, y, z]) => new THREE.Vector3(mm(x), mm(y), mm(z))));
    const cord = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, mm(1.5), 16, false), cordM); cord.castShadow = true; cord.scale.z = .55; add(g, cord);   // flat twin-lead
    if (new URLSearchParams(location.search).get('part') === 'nocord') { g.remove(cord); g.remove(boot); g.remove(sock); } }   // DEBUG
  return g;
};
