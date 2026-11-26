// smokeco: Vivint Smoke & CO Detector (VS-SMKCO2-345), 142 mm dia x 61 mm. Wall/ceiling side at z = 0, room side toward +z.
// Built in millimetres inside a 0.001-scaled group. Body = lathe (base seam hairline, fillet), face annulus = a polar grid whose
// height follows a gentle dome plus the half-moon scoop; holes (sounder openings) are cut by an alpha mask, and the flush pads,
// LED window, icon and printing are one planar canvas map, so every colour change is flush with the surface.
export default H => {
  const { THREE, G, add, mat, splitMat, maxAniso } = H;
  const outer = G(), g = G(); g.scale.setScalar(.001); outer.add(g);
  const D2R = Math.PI / 180, V2 = (r, z) => new THREE.Vector2(r, z);

  /* ---------- materials */
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f2, roughness: .26, clearcoat: .55, clearcoatRoughness: .18 });
  const capM = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f6, roughness: .4, clearcoat: .25, clearcoatRoughness: .35 });
  const dark = mat(0x2b2b2b, { r: .7 }), fin = mat(0x4a4a4a, { r: .55 }), inner = mat(0x343536, { r: .8 });

  /* ---------- face surface: dome + scoop (mm) */
  const RL = 40, RF = 63;                                  // face annulus: lip ... fillet start
  const faceZ = r => 36.3 + 2.4 * (1 - Math.min(1, Math.max(0, (r - RL) / (RF - RL))) ** 2);
  const SC = { x: -51.5, y: 0, R: 10.5, d: 2.5 };          // half-moon scoop at 9 o'clock
  const surfZ = (x, y) => { const r = Math.hypot(x, y); let z = faceZ(r);
    const q = ((x - SC.x) ** 2 + (y - SC.y) ** 2) / SC.R ** 2; if (q < 1) z -= SC.d * (1 - q) ** 1.15; return z; };

  /* ---------- body lathe: back, base seam, straight side, fillet into the face */
  const prof = [V2(0, 0), V2(69.6, 0), V2(70.7, .25), V2(71, 1), V2(71, 2.85), V2(70.7, 2.9), V2(70.7, 3.1), V2(71, 3.15)];
  { const P0 = V2(71, 3.15), P1 = V2(71, 28);              // straight cylinder, then a cubic fillet meeting the face slope
    prof.push(P1); const s = -2.4 * 2 / (RF - RL), L = 3.6, n = Math.hypot(1, s);
    const A = P1, B = V2(71, 32.2), D = V2(RF, faceZ(RF)), C = V2(RF + L / n, D.y + L * s / n);   // C: outward along the face tangent
    for (let i = 1; i <= 18; i++) { const t = i / 18, u = 1 - t;
      prof.push(V2(u*u*u*A.x + 3*u*u*t*B.x + 3*u*t*t*C.x + t*t*t*D.x, u*u*u*A.y + 3*u*u*t*B.y + 3*u*t*t*C.y + t*t*t*D.y)); } }
  const bodyM = splitMat(white, white, 'y', 3, .3, 0xb0b0b0);
  const body = add(g, new THREE.Mesh(new THREE.LatheGeometry(prof, 180), bodyM));
  body.rotation.x = Math.PI / 2;

  /* ---------- openings (outline polygons in face XY, mm) */
  const rrPts = (u0, u1, v0, v1, R, phi) => {             // rounded rect in a radial frame: u radial, v tangential; R=[u0v0,u1v0,u1v1,u0v1]
    const c = Math.cos(phi * D2R), s = Math.sin(phi * D2R), out = [];
    const C = [[u0 + R[0], v0 + R[0], Math.PI], [u1 - R[1], v0 + R[1], 1.5 * Math.PI], [u1 - R[2], v1 - R[2], 0], [u0 + R[3], v1 - R[3], .5 * Math.PI]];
    C.forEach(([cu, cv, a0], i) => { const r = R[i]; for (let k = 0; k <= 10; k++) { const a = a0 + k / 10 * Math.PI / 2;
      const u = cu + r * Math.cos(a), v = cv + r * Math.sin(a); out.push([u * c - v * s, u * s + v * c]); } });
    return out; };
  const holes = [
    { pts: rrPts(42, 46.6, -10.5, 10.5, [2.2, 2.2, 2.2, 2.2], 0), phi: 0, u: [42, 46.6], v: 10.5 },
    { pts: rrPts(49.2, 54.4, -9, 9, [1.6, 5.2, 5.2, 1.6], 0), phi: 0, u: [49.2, 54.4], v: 9 },
    { pts: rrPts(43.6, 48.2, -6.8, 6.8, [2.2, 2.2, 2.2, 2.2], 180), phi: 180, u: [43.6, 48.2], v: 6.8 },
  ];

  /* ---------- canvases: printed map + hole mask, planar over the 142 mm disc */
  const SZ = 142, N = 2048, k = N / SZ, P = (x, y) => [N / 2 + x * k, N / 2 - y * k];
  const cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
  const mk = document.createElement('canvas'); mk.width = mk.height = 1024; const m = mk.getContext('2d');
  x.fillStyle = '#f4f4f2'; x.fillRect(0, 0, N, N); m.fillStyle = '#fff'; m.fillRect(0, 0, 1024, 1024);
  const pathPts = (c, pts, sc) => { c.beginPath(); pts.forEach(([px, py], i) => { const X = 512 + px * sc, Y = 512 - py * sc; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
  m.fillStyle = '#000'; for (const h of holes) { pathPts(m, h.pts, 1024 / SZ); m.fill(); }
  // polar "quarter-tab" pad: r0..r1, a0..a1 (deg), corner radii [r0a0, r1a0, r1a1, r0a1] (mm)
  const polarPad = (r0, r1, a0, a1, R) => { const pts = [], seg = (fn, n) => { for (let i = 0; i <= n; i++) pts.push(fn(i / n)); };
    const pol = (r, a) => [r * Math.cos(a * D2R), r * Math.sin(a * D2R)];
    // walk the polar rectangle as a dense polyline, then round corners by cutting and curving
    const edge = []; const n = 40;
    for (let i = 0; i < n; i++) edge.push(pol(r0, a0 + (a1 - a0) * i / n));
    for (let i = 0; i < n; i++) edge.push(pol(r0 + (r1 - r0) * i / n, a1));
    for (let i = 0; i < n; i++) edge.push(pol(r1, a1 + (a0 - a1) * i / n));
    for (let i = 0; i < n; i++) edge.push(pol(r1 + (r0 - r1) * i / n, a0));
    const corners = [0, n, 2 * n, 3 * n], Rc = [R[0], R[3], R[2], R[1]];
    const L = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    const res = [];
    for (let ci = 0; ci < 4; ci++) { const s0 = corners[ci], s1 = corners[(ci + 1) % 4] || 4 * n, r = Rc[ci], rn = Rc[(ci + 1) % 4];
      const c0 = edge[s0 % (4 * n)], c1 = edge[(s1) % (4 * n)];
      let a = s0, b = s1;                                  // skip the points inside each corner radius
      while (a < b && L(edge[a % (4 * n)], c0) < r) a++;
      const segEnd = []; let bb = b; while (bb > a && L(edge[bb % (4 * n)], c1) < rn) bb--;
      // corner curve into this edge start
      const prevEnd = res.length ? res[res.length - 1] : null;
      if (prevEnd) { const cc = c0, e = edge[a % (4 * n)]; for (let t = 1; t <= 8; t++) { const T = t / 8, u = 1 - T;
        res.push([u * u * prevEnd[0] + 2 * u * T * cc[0] + T * T * e[0], u * u * prevEnd[1] + 2 * u * T * cc[1] + T * T * e[1]]); } }
      for (let i = a; i <= bb; i++) res.push(edge[i % (4 * n)]);
    }
    { const prevEnd = res[res.length - 1], cc = edge[0], e = res[0]; for (let t = 1; t < 8; t++) { const T = t / 8, u = 1 - T;
      res.push([u * u * prevEnd[0] + 2 * u * T * cc[0] + T * T * e[0], u * u * prevEnd[1] + 2 * u * T * cc[1] + T * T * e[1]]); } }
    return res; };
  const drawPts = (pts) => { x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(...P(px, py)) : x.moveTo(...P(px, py))); x.closePath(); };
  const pad = (pts, fill) => { drawPts(pts); x.fillStyle = fill; x.fill(); x.lineWidth = .32 * k; x.strokeStyle = '#2a2a2a'; x.stroke(); };
  // CO pad (big round corner outer / away from the LED), LED window, FIRE pad (mirror)
  const coPts = polarPad(44.6, 55.4, 125, 139.6, [1.2, 1.4, 6.5, 1.2]);
  const fiPts = polarPad(44.6, 55.4, 100.4, 115, [1.2, 6.5, 1.4, 1.2]);
  pad(coPts, '#626466'); pad(fiPts, '#626466');
  { const ledPts = polarPad(46.6, 54, 117.2, 122.8, [1.4, 1.4, 1.4, 1.4]); pad(ledPts, '#505355');
    x.fillStyle = '#626567'; drawPts(polarPad(48.2, 52.4, 118.4, 121.6, [.8, .8, .8, .8])); x.fill(); }
  // soft sheen on the smoked pads (lighter toward their outer edge)
  for (const pts of [coPts, fiPts]) { x.save(); drawPts(pts); x.clip();
    const [gx0, gy0] = P(0, 0); const gr = x.createRadialGradient(gx0, gy0, 44 * k, gx0, gy0, 56 * k);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.10)'); x.fillStyle = gr; x.fillRect(0, 0, N, N); x.restore(); }
  // printed text: straight lines tangent to the circle, letters' tops toward the centre, condensed caps
  const txt = (s, r, phi, cap, w = 400, col = '#8f8f8f', cond = .8) => { const [px, py] = P(r * Math.cos(phi * D2R), r * Math.sin(phi * D2R));
    x.save(); x.translate(px, py); x.rotate(Math.atan2(-Math.cos(phi * D2R), -Math.sin(phi * D2R))); x.scale(cond, 1);
    x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `${w} ${Math.round(cap * k / .72)}px "Helvetica Neue", Helvetica, Arial, sans-serif`; x.fillText(s, 0, 0); x.restore(); };
  txt('CO', 57.6, 141, 2.4); txt('FIRE/FEU', 58, 108, 2.2);
  txt('TEST/ HUSH', 52.6, 95.5, 1.9); txt('TEST/SILENCIEUX', 55.3, 95.5, 1.9);
  txt('GREEN/VERT - OK', 51.2, 154, 1.55); txt('YLW - FAULT JUANE - PANNE', 53.8, 154.5, 1.55); txt('RED - ALARM ROUGE - ALARME', 56.4, 155, 1.55);
  txt('ENTRETIEN - 1 BIP', 52, 22, 1.55); txt('FEU ALARME - 3 BIPS', 54.7, 22.5, 1.55); txt('MONOXYDE DE CARBONE - 4 BIPS', 57.4, 23, 1.55);
  txt('SERVICE - 1 BEEP', 52, -22, 1.55); txt('FIRE ALARM - 3 BEEPS', 54.7, -22.5, 1.55); txt('CARBON MONOXIDE ALARM - 4 BEEPS', 57.4, -23, 1.55);
  txt('ATTENTION', 44.6, 239, 4.3, 400, '#8a8a8a', .9); txt('NOTICE', 50.3, 239.5, 3, 400, '#8f8f8f', .85); txt('SUPPLÉMENTAIRE AU DOS', 55, 240, 2.9, 400, '#8f8f8f', .85);
  txt('CAUTION', 44.6, 299.5, 4.3, 400, '#8a8a8a', .9); txt('ADDITIONAL', 50.3, 299.5, 3, 400, '#8f8f8f', .85); txt('MARKINGS ON BACK', 55, 299, 2.9, 400, '#8f8f8f', .85);
  // no-paint icon: ring, brush + roller, slash
  { const [cx, cy] = P(50.5 * Math.cos(57 * D2R), 50.5 * Math.sin(57 * D2R)), R = 6.5 * k; x.save(); x.translate(cx, cy);
    x.strokeStyle = x.fillStyle = '#4a4a4a'; x.lineWidth = 1 * k; x.beginPath(); x.arc(0, 0, R - .5 * k, 0, Math.PI * 2); x.stroke();
    x.save(); x.beginPath(); x.arc(0, 0, R - 1 * k, 0, Math.PI * 2); x.clip(); const u = k;
    x.fillRect(-3.2 * u, -3.6 * u, 6.4 * u, 2.2 * u);                       // roller
    x.fillRect(2.6 * u, -2.8 * u, .8 * u, 2.4 * u); x.fillRect(-.4 * u, -.8 * u, 3.8 * u, .7 * u); x.fillRect(-.4 * u, -.8 * u, .8 * u, 3 * u);
    x.beginPath(); x.moveTo(-1.2 * u, 2.2 * u); x.lineTo(.8 * u, 2.2 * u); x.lineTo(.5 * u, 4.6 * u); x.lineTo(-.9 * u, 4.6 * u); x.closePath(); x.fill();   // brush
    x.restore(); x.lineWidth = 1 * k; x.beginPath(); x.moveTo(-R * .68, -R * .68); x.lineTo(R * .68, R * .68); x.stroke(); x.restore(); }
  // pinhole at 6 o'clock
  { x.fillStyle = '#1e1e1e'; x.beginPath(); x.arc(...P(0, -64.5), .75 * k, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = .25 * k; x.beginPath(); x.arc(...P(0, -64.5), 1.05 * k, 0, Math.PI * 2); x.stroke(); }
  const tex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = Math.min(8, maxAniso); return t; };
  const mapT = tex(cv); mapT.colorSpace = THREE.SRGBColorSpace; const maskT = tex(mk);

  /* ---------- face grid r = RL..RF, z from surfZ, planar UVs, analytic-ish normals */
  { const NR = 60, NA = 540, pos = [], nor = [], uv = [], idx = [], e = .05;
    for (let i = 0; i <= NR; i++) { const r = RL + (RF - RL) * (i / NR);
      for (let j = 0; j <= NA; j++) { const a = j / NA * Math.PI * 2, X = r * Math.cos(a), Y = r * Math.sin(a), Z = surfZ(X, Y);
        pos.push(X, Y, Z); uv.push(X / SZ + .5, Y / SZ + .5);
        const dx = (surfZ(X + e, Y) - surfZ(X - e, Y)) / (2 * e), dy = (surfZ(X, Y + e) - surfZ(X, Y - e)) / (2 * e), l = Math.hypot(dx, dy, 1);
        nor.push(-dx / l, -dy / l, 1 / l); } }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, d, b, a, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const fm = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: mapT, alphaMap: maskT, alphaTest: .5, roughness: .26, clearcoat: .55, clearcoatRoughness: .18, side: THREE.DoubleSide });
    add(g, new THREE.Mesh(geo, fm)); }

  /* ---------- sounder openings: dark walls, floor and fins */
  for (const h of holes) { const pts = h.pts, n = pts.length, cz = surfZ(...pts[0]) - 5.2, pos = [], idx = [];
    for (let i = 0; i < n; i++) { const [X, Y] = pts[i]; pos.push(X, Y, surfZ(X, Y) + .05, X, Y, cz); }
    for (let i = 0; i < n; i++) { const a = 2 * i, b = 2 * ((i + 1) % n); idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setIndex(idx); wg.computeVertexNormals();
    add(g, new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: .8, side: THREE.DoubleSide })));
    const fl = add(g, new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(p => V2(p[0], p[1])))), dark)); fl.position.z = cz;
    const c = Math.cos(h.phi * D2R), s = Math.sin(h.phi * D2R), um = (h.u[0] + h.u[1]) / 2, ul = h.u[1] - h.u[0] - .4;
    for (const f of [-.5, 0, .5]) { const v = f * h.v, X = um * c - v * s, Y = um * s + v * c, top = surfZ(X, Y) - 1.4;
      const b = add(g, new THREE.Mesh(new THREE.BoxGeometry(ul, 1.6, 3.6), fin), X, Y, top - 1.8); b.rotation.z = h.phi * D2R; } }

  /* ---------- well lip, well wall + floor (dark below), insect mesh band, chamber rings, dark interior */
  { const f = faceZ(RL), lp = [V2(30, 33.6), V2(38.2, 33.6), V2(39.2, 33.8), V2(39.2, f - 1.3), V2(39.35, f - .65), V2(39.7, f - .2), V2(RL, f)].reverse();
    const lm = splitMat(inner, white, 'y', f - 1.6, .001, 0x343536); const lip = add(g, new THREE.Mesh(new THREE.LatheGeometry(lp, 180), lm)); lip.rotation.x = Math.PI / 2; }
  { // fine square-weave mesh, with the light grey tabs behind it at each spoke gap
    const W = 4096, Hh = 208, c = document.createElement('canvas'); c.width = W; c.height = Hh; const y = c.getContext('2d');
    const circ = 2 * Math.PI * 38, pxmm = W / circ; y.fillStyle = '#1c1c1c'; y.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 6; i++) { const u = ((i * 60 + 0) / 360) * W; y.fillStyle = '#8e8e8e'; y.fillRect(u - 1.5 * pxmm, Hh * .14, 3 * pxmm, 9 * pxmm); }
    y.strokeStyle = 'rgba(92,92,92,.9)'; y.lineWidth = .14 * pxmm; const pitch = .4 * pxmm;
    for (let u = 0; u < W; u += pitch) { y.beginPath(); y.moveTo(u, 0); y.lineTo(u, Hh); y.stroke(); }
    for (let v = 0; v < Hh; v += pitch) { y.beginPath(); y.moveTo(0, v); y.lineTo(W, v); y.stroke(); }
    const t = tex(c); t.colorSpace = THREE.SRGBColorSpace;
    const mg = new THREE.CylinderGeometry(38, 38, 12.4, 180, 1, true); mg.rotateX(Math.PI / 2); mg.translate(0, 0, 33.6 + 6.2);
    // cylinder UV u starts at +z (pre-rotation) i.e. -y here; rotate so the tabs sit at 0, 60, 120 ... degrees
    const mesh = add(g, new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ map: t, roughness: .75, metalness: .1 }))); mesh.rotation.z = -Math.PI / 2; }
  { const cp = [V2(38.2, 45.8), V2(37.6, 46.3), V2(35.4, 46.3), V2(34.9, 46.5), V2(34.7, 47), V2(34.7, 49.2), V2(34.4, 49.6), V2(32.2, 49.6), V2(31.7, 49.9),
      V2(31.5, 50.5), V2(31.5, 52.1), V2(31.3, 52.7), V2(30.8, 53), V2(30.3, 52.8), V2(30.1, 52.2), V2(30.05, 51.4)];
    const ch = add(g, new THREE.Mesh(new THREE.LatheGeometry(cp, 180), white)); ch.rotation.x = Math.PI / 2;
    const dk = [V2(30.05, 51.4), V2(29.6, 50.6), V2(0, 50.6)];
    const di = add(g, new THREE.Mesh(new THREE.LatheGeometry(dk, 120), mat(0x3a3b3c, { r: .85 }))); di.rotation.x = Math.PI / 2; }

  /* ---------- floating cap (TEST/HUSH button) with a shallow centre dimple */
  { const cp = [V2(0, 54.2), V2(25.8, 54.2), V2(26.6, 54.45), V2(26.95, 55), V2(27, 55.6), V2(27, 57.5), V2(26.9, 58.2), V2(26.6, 58.7), V2(26.1, 59.05),
      V2(25.2, 59.25), V2(22, 59.6), V2(17, 60), V2(11, 60.35), V2(6, 60.55), V2(4.7, 60.6), V2(4.5, 60.57), V2(4.1, 60.42), V2(3.3, 60.26), V2(2, 60.15), V2(0, 60.1)];
    const cap = add(g, new THREE.Mesh(new THREE.LatheGeometry(cp, 160), capM)); cap.rotation.x = Math.PI / 2; }

  /* ---------- six arched spokes: foot on the face, arc up and in, joining the cap rim */
  { const s = new THREE.Shape(); const f0 = faceZ(44.2) - 1.5, f1 = faceZ(48.4) - 1.5;
    s.moveTo(25.5, 55.2); s.lineTo(37.5, 55.2); s.bezierCurveTo(42.2, 55.2, 44.2, 52.5, 44.2, 47); s.lineTo(44.2, f0); s.lineTo(48.4, f1); s.lineTo(48.4, 47.5);
    s.bezierCurveTo(48.4, 55.6, 44.6, 58.6, 37.5, 58.6); s.lineTo(25.5, 58.6); s.lineTo(25.5, 55.2);
    const bv = .9, W0 = 9.2;
    const sg = new THREE.ExtrudeGeometry(s, { depth: W0 - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelOffset: -bv, bevelSegments: 4, curveSegments: 20 });
    sg.translate(0, 0, -(W0 - 2 * bv) / 2);
    const p = sg.attributes.position;                       // taper: 9.2 mm wide at the foot -> 7 mm at the cap
    for (let i = 0; i < p.count; i++) { const r = p.getX(i), t = Math.min(1, Math.max(0, (r - 26) / (48.4 - 26))); p.setZ(i, p.getZ(i) * (.76 + .24 * t)); }
    sg.computeVertexNormals();
    for (const a of [90, 30, -30, -90, 150, 210]) { const c = Math.cos(a * D2R), sn = Math.sin(a * D2R);
      const M = new THREE.Matrix4().makeBasis(new THREE.Vector3(c, sn, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(sn, -c, 0));
      const sp = add(g, new THREE.Mesh(sg, white)); sp.applyMatrix4(M); } }

  outer.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return outer;
};
