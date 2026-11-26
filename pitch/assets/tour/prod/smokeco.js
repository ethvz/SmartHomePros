// smokeco: Vivint Smoke & CO Detector (VS-SMKCO2-345), 142 mm dia x ~71 mm (spec sheet says 61; the reference photos show a deeper body and taller cage). Wall/ceiling side at z = 0, room side toward +z.
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
  const dark = mat(0x111111, { r: .8 }), fin = mat(0x0c0c0c, { r: .8 }), inner = mat(0x343536, { r: .8 });

  /* ---------- face surface: dome + scoop (mm) */
  // ZB: body side 3 mm taller than the spec sheet (photos show a deeper body); LIFT: chamber/cage/cap raised to the photos' proportions.
  // Face annulus RL..RF: a rounded R2.5 lip rolls from r 45.5 (where the pads begin, photo) down into the chamber well at r 43, then the
  // gentle dome out to RF.
  const RL = 43, LR = 2.5, DL = 43, RF = 67, LIFT = 7, ZB = 3;
  const lipD = r => r >= RL + LR ? 0 : LR - Math.sqrt(Math.max(0, LR * LR - (RL + LR - r) ** 2));
  const faceZ = r => ZB + 36.3 + 2.4 * (1 - Math.min(1, Math.max(0, (r - DL) / (RF - DL))) ** 2) - lipD(r);
  const SC = { x: -48.5, y: 0, R: 13.5, d: 3.5 };       // half-moon scoop at 9 o'clock (crisp outer arc)
  const surfZ = (x, y) => { const r = Math.hypot(x, y); let z = faceZ(Math.max(r, RL));
    const q = ((x - SC.x) ** 2 + (y - SC.y) ** 2) / SC.R ** 2; if (q < 1) { const ed = SC.R * (1 - Math.sqrt(q)), w = Math.min(1, ed / .8); z -= SC.d * (1 - q) ** .35 * w * w * (3 - 2 * w); } return z; };   // 0.8 mm rounded rim

  /* ---------- body lathe: back, base seam, straight side, fillet into the face */
  const prof = [V2(0, 0), V2(69.6, 0), V2(70.7, .25), V2(71, 1), V2(71, 2.85), V2(70.7, 2.9), V2(70.7, 3.1), V2(71, 3.15)];
  { const P0 = V2(71, 3.15), P1 = V2(71, 28 + ZB);              // straight cylinder, then a cubic fillet meeting the face slope
    prof.push(P1); const s = -2.4 * 2 / (RF - DL), L = 2.2, n = Math.hypot(1, s);
    const A = P1, B = V2(71, 32.2 + ZB), D = V2(RF, faceZ(RF)), C = V2(RF + L / n, D.y + L * s / n);   // C: outward along the face tangent
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
  // sounder D at 3 o'clock: a circular segment (flat side inward at r 51.3, 24 mm chord, 7.3 mm deep, photo), corners eased
  const dPts = (() => { const u0 = 51.3, h = 7.3, c = 12, R = (c * c + h * h) / (2 * h), uc = u0 + h - R, a = Math.asin(c / R), out = [], e = .9;
    for (let i = 0; i <= 40; i++) { const t = -a + (2 * a) * i / 40; out.push([uc + R * Math.cos(t), R * Math.sin(t)]); }
    const end = out[out.length - 1]; out.push([u0 + e * .4, c - e]); out.push([u0, c - e * 1.6]); out.push([u0, -c + e * 1.6]); out.push([u0 + e * .4, -c + e]);
    return out; })();
  // bend a (u radial, v tangential) outline round the centre so its inner and outer sides are concentric arcs (photo slots are curved)
  const bend = (pts, phi, um) => pts.map(([x0, y0]) => { const c = Math.cos(phi * D2R), s = Math.sin(phi * D2R), u = x0 * c + y0 * s, v = -x0 * s + y0 * c, a = phi * D2R + v / um;
    return [u * Math.cos(a), u * Math.sin(a)]; });
  const holes = [
    { pts: bend(rrPts(44.2, 50.2, -11.7, 11.7, [1.2, 1.2, 1.2, 1.2], 0), 0, 47.2), phi: 0, u: [44.2, 50.2], v: 11.7 },
    { pts: bend(dPts, 0, 51.3), phi: 0, u: [51.3, 58.6], v: 12, d: 1 },
    { pts: bend(rrPts(44, 50.4, -12.5, 12.5, [1.2, 1.2, 1.2, 1.2], 180), 180, 47.2), phi: 180, u: [44, 50.4], v: 12.5 },
  ];

  /* ---------- canvases: printed map + hole mask, planar over the 142 mm disc */
  const SZ = 142, N = 2048, k = N / SZ, P = (x, y) => [N / 2 + x * k, N / 2 - y * k];
  const cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
  const MK = 2048, mk = document.createElement('canvas'); mk.width = mk.height = MK; const m = mk.getContext('2d');   // hole mask (anti-aliased via alphaToCoverage; 2048 keeps iPad memory sane)
  x.fillStyle = '#f4f4f2'; x.fillRect(0, 0, N, N); m.fillStyle = '#fff'; m.fillRect(0, 0, MK, MK);
  const pathPts = (c, pts, sc) => { c.beginPath(); pts.forEach(([px, py], i) => { const X = MK / 2 + px * sc, Y = MK / 2 - py * sc; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
  m.fillStyle = '#000'; for (const h of holes) { pathPts(m, h.pts, MK / SZ); m.fill(); }
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
  // CO pad (big round corner outer / away from the LED), LED window, FIRE pad (mirror); they start right where the lip rolls over (photo)
  const coPts = polarPad(45.5, 59.3, 124.6, 138.6, [1.2, 1.4, 7, 1.2]);
  const fiPts = polarPad(45.5, 59.3, 100.8, 115.2, [1.2, 7, 1.4, 1.2]);
  pad(coPts, '#45474a'); pad(fiPts, '#45474a');
  const ledPts = polarPad(47.8, 55.9, 116.8, 122.8, [1.4, 1.4, 1.4, 1.4]); pad(ledPts, '#46494b');
  x.fillStyle = '#626567'; drawPts(polarPad(49.5, 54, 118.1, 121.5, [.8, .8, .8, .8])); x.fill();
  // soft sheen on the smoked pads (lighter toward their outer edge) and a thin darker lip on the side away from the light (glossy insert edge)
  for (const pts of [coPts, fiPts, ledPts]) { x.save(); drawPts(pts); x.clip();
    const [gx0, gy0] = P(0, 0); const gr = x.createRadialGradient(gx0, gy0, 45.5 * k, gx0, gy0, 59.3 * k);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.10)'); x.fillStyle = gr; x.fillRect(0, 0, N, N);
    x.translate(0, -.3 * k); drawPts(pts); x.lineWidth = .6 * k; x.strokeStyle = 'rgba(20,20,22,.55)'; x.stroke(); x.restore(); }
  // printed text: straight lines tangent to the circle, letters' tops toward the centre, condensed caps
  const txt = (s, r, phi, cap, w = 500, col = '#5e5e5e', cond = .86) => { const [px, py] = P(r * Math.cos(phi * D2R), r * Math.sin(phi * D2R));
    x.save(); x.translate(px, py); x.rotate(Math.atan2(-Math.cos(phi * D2R), -Math.sin(phi * D2R))); x.scale(cond, 1);
    x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `${w} ${Math.round(cap * k / .72)}px "Helvetica Neue", Helvetica, Arial, sans-serif`; x.fillText(s, 0, 0); x.restore(); };
  txt('CO', 61.2, 131.5, 2.4); txt('FIRE/FEU', 60.8, 111.5, 2.2);
  txt('TEST/ HUSH', 54.6, 93, 1.9); txt('TEST/SILENCIEUX', 57.6, 93.5, 1.9);
  txt('GREEN/VERT - OK', 51.6, 160, 1.6); txt('YLW - FAULT JUANE - PANNE', 54.1, 160, 1.6); txt('RED - ALARM ROUGE - ALARME', 56.6, 160, 1.6);
  txt('ENTRETIEN - 1 BIP', 52, 22, 1.75); txt('FEU ALARME - 3 BIPS', 54.7, 22.5, 1.75); txt('MONOXYDE DE CARBONE - 4 BIPS', 57.4, 23, 1.75);
  txt('SERVICE - 1 BEEP', 52, -22, 1.75); txt('FIRE ALARM - 3 BEEPS', 54.7, -22.5, 1.75); txt('CARBON MONOXIDE ALARM - 4 BEEPS', 57.4, -23, 1.75);
  txt('ATTENTION', 46.4, 239, 4.3, 500, '#555', 1); txt('NOTICE', 51.3, 239.5, 3.2, 500, '#5a5a5a', 1); txt('SUPPLÉMENTAIRE AU DOS', 55.8, 240, 3.1, 500, '#5a5a5a', 1);
  txt('CAUTION', 46.4, 299.5, 4.3, 500, '#555', 1); txt('ADDITIONAL', 51.3, 299.5, 3.2, 500, '#5a5a5a', 1); txt('MARKINGS ON BACK', 55.8, 299, 3.1, 500, '#5a5a5a', 1);
  // no-paint icon (photo: centre r 52, 60 deg from the top spoke; ring 8.6 mm radius, 1.3 mm line): a paintbrush tilted ~27 deg -
  // roller-like bar with a knob on top, a dark head with a white paint "crown" in it, a short neck and a tear-drop handle with a hole -
  // crossed by the slash from 10 to 4 o'clock
  { const [cx, cy] = P(52 * Math.cos(60 * D2R), 52 * Math.sin(60 * D2R)), R = 8.6 * k, u = k; x.save(); x.translate(cx, cy);
    x.strokeStyle = x.fillStyle = '#3e3e3e'; x.lineWidth = 1.3 * k; x.beginPath(); x.arc(0, 0, R - .65 * k, 0, Math.PI * 2); x.stroke();
    x.save(); x.beginPath(); x.arc(0, 0, R - 1.2 * k, 0, Math.PI * 2); x.clip(); x.rotate(27 * D2R);
    x.beginPath(); x.roundRect(-3.4 * u, -5.9 * u, 7.2 * u, 1.5 * u, .7 * u); x.fill(); x.beginPath(); x.arc(-3.5 * u, -5.15 * u, 1.05 * u, 0, Math.PI * 2); x.fill();   // top bar + knob
    x.fillRect(-2.9 * u, -4.0 * u, 6 * u, 3.0 * u);                                                                                             // head
    x.fillStyle = '#f4f4f2'; x.beginPath(); x.moveTo(-2.2 * u, -1.6 * u); x.lineTo(-2.2 * u, -3.0 * u); x.lineTo(-1.3 * u, -2.2 * u); x.lineTo(-.3 * u, -3.4 * u);
    x.lineTo(.7 * u, -2.3 * u); x.lineTo(1.6 * u, -3.2 * u); x.lineTo(2.4 * u, -2.1 * u); x.lineTo(2.4 * u, -1.6 * u); x.closePath(); x.fill();   // paint crown
    x.fillStyle = '#3e3e3e'; x.fillRect(-.55 * u, -1.1 * u, 1.3 * u, 2.2 * u);                                                                   // neck
    x.beginPath(); x.moveTo(-.55 * u, .9 * u); x.lineTo(.75 * u, .9 * u); x.bezierCurveTo(2.3 * u, 2.4 * u, 2 * u, 5.4 * u, .1 * u, 5.4 * u);
    x.bezierCurveTo(-1.8 * u, 5.4 * u, -2.1 * u, 2.4 * u, -.55 * u, .9 * u); x.fill();                                                          // tear-drop handle
    x.fillStyle = '#f4f4f2'; x.beginPath(); x.arc(.1 * u, 4.2 * u, .38 * u, 0, Math.PI * 2); x.fill();
    x.restore(); const sa = 22 * D2R; x.lineWidth = 1.3 * k; x.beginPath(); x.moveTo(-R * Math.cos(sa), -R * Math.sin(sa)); x.lineTo(R * Math.cos(sa), R * Math.sin(sa)); x.stroke(); x.restore(); }
  // pinhole at 6 o'clock
  { const [hx, hy] = P(0, -66.2), pg = x.createRadialGradient(hx + .3 * k, hy + .5 * k, .2 * k, hx, hy, 2.1 * k);
    pg.addColorStop(0, '#5e5f61'); pg.addColorStop(.55, '#3c3d3f'); pg.addColorStop(1, '#222324');
    x.fillStyle = pg; x.beginPath(); x.arc(hx, hy, 2.1 * k, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = .25 * k; x.beginPath(); x.arc(hx, hy, 2.05 * k, 0, Math.PI * 2); x.stroke(); }
  const tex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = Math.min(8, maxAniso); return t; };
  const mapT = tex(cv); mapT.colorSpace = THREE.SRGBColorSpace; const maskT = tex(mk);

  /* ---------- face grid r = RL..RF, z from surfZ, planar UVs, analytic-ish normals */
  { const NR = 120, NA = 1440, pos = [], nor = [], uv = [], idx = [], e = .05;
    for (let i = 0; i <= NR; i++) { const r = RL + (RF - RL) * (i / NR) ** 1.6;
      for (let j = 0; j <= NA; j++) { const a = j / NA * Math.PI * 2, X = r * Math.cos(a), Y = r * Math.sin(a), Z = surfZ(X, Y);
        pos.push(X, Y, Z); uv.push(X / SZ + .5, Y / SZ + .5);
        const dx = (surfZ(X + e, Y) - surfZ(X - e, Y)) / (2 * e), dy = (surfZ(X, Y + e) - surfZ(X, Y - e)) / (2 * e), l = Math.hypot(dx, dy, 1);
        nor.push(-dx / l, -dy / l, 1 / l); } }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, d, b, a, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const fm = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: mapT, alphaMap: maskT, alphaTest: .5, roughness: .26, clearcoat: .55, clearcoatRoughness: .18, side: THREE.DoubleSide, alphaToCoverage: true });
    add(g, new THREE.Mesh(geo, fm)); }

  /* ---------- sounder openings: 0.6 mm rounded white rim, dark wall, near-black floor and two deep fins */
  const wallM = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: .8, side: THREE.DoubleSide });
  for (const h of holes) { const pts = h.pts, n = pts.length; let ar = 0;
    for (let i = 0; i < n; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n]; ar += x1 * y2 - x2 * y1; }
    const sg = ar > 0 ? 1 : -1, inn = pts.map((p, i) => { const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1;
      return [-ty / l * sg, tx / l * sg]; });                // inward unit normal per point
    const cz = surfZ(...pts[0]) - 5.2, rimPts = [], rp = [], ri = [], RIM = .6, NS = 4;
    for (let i = 0; i < n; i++) { const [X, Y] = pts[i], [nx, ny] = inn[i], z0 = surfZ(X, Y);
      rp.push(X - nx * .2, Y - ny * .2, z0 - .04);            // tucked under the face edge, so the anti-aliased hole edge only ever shows the rim
      for (let k2 = 0; k2 <= NS; k2++) { const t = k2 / NS * Math.PI / 2; rp.push(X + nx * RIM * Math.sin(t), Y + ny * RIM * Math.sin(t), z0 - .01 - RIM * (1 - Math.cos(t))); }
      rimPts.push([X + nx * RIM, Y + ny * RIM, z0 - RIM]); }
    for (let i = 0; i < n; i++) { const a = i * (NS + 2), b = ((i + 1) % n) * (NS + 2); for (let k2 = 0; k2 <= NS; k2++) ri.push(a + k2, a + k2 + 1, b + k2, b + k2, a + k2 + 1, b + k2 + 1); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri); rg.computeVertexNormals();
    add(g, new THREE.Mesh(rg, new THREE.MeshPhysicalMaterial({ color: 0xf4f4f2, roughness: .26, clearcoat: .55, clearcoatRoughness: .18, side: THREE.DoubleSide })));
    const pos = [], idx = [];
    for (const [X, Y, Z] of rimPts) pos.push(X, Y, Z, X, Y, cz);
    for (let i = 0; i < n; i++) { const a = 2 * i, b = 2 * ((i + 1) % n); idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setIndex(idx); wg.computeVertexNormals();
    add(g, new THREE.Mesh(wg, wallM));
    const fl = add(g, new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(rimPts.map(p => V2(p[0], p[1])))), dark)); fl.position.z = cz;
    const c = Math.cos(h.phi * D2R), s = Math.sin(h.phi * D2R), um = (h.u[0] + h.u[1]) / 2, ul = h.u[1] - h.u[0] - 1.6;
    for (const f of [-.5, .5]) { const v = f * h.v * (h.d ? .6 : 1), X = um * c - v * s, Y = um * s + v * c, top = surfZ(X, Y) - 4.2;
      const b = add(g, new THREE.Mesh(new THREE.BoxGeometry(ul, 1.6, 2.2), fin), X, Y, top - 1.1); b.rotation.z = h.phi * D2R; } }

  // the cup inside the lip is shaded grey in the photos (no AO in the renderer, so it is baked into the colour)
  const cupM = new THREE.MeshPhysicalMaterial({ color: 0xd6d6d6, roughness: .32, clearcoat: .4, clearcoatRoughness: .25 });
  /* ---------- well lip, well wall + floor (dark below), insect mesh band, chamber rings, dark interior */
  { const f = faceZ(RL), lp = [V2(30, 33.6 + ZB), V2(43.6, 33.6 + ZB), V2(44.3, 33.9 + ZB), V2(RL, Math.min(f, 34.6 + ZB)), V2(RL, f + .02)].reverse();   // well wall under the lip
    const lip = add(g, new THREE.Mesh(new THREE.LatheGeometry(lp, 180), cupM)); lip.rotation.x = Math.PI / 2; }
  { // fine square-weave mesh, with the light grey tabs behind it at each spoke gap
    const W = 8192, circ = 2 * Math.PI * 40.5, pxmm = W / circ, Hh = Math.round(9 * pxmm), c = document.createElement('canvas'); c.width = W; c.height = Hh; const y = c.getContext('2d');
    y.fillStyle = '#4a4b4c'; y.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 6; i++) { const u = ((i * 60 + 0) / 360) * W; y.fillStyle = '#7a7a7a'; y.fillRect(u - 1.5 * pxmm, Hh * .14, 3 * pxmm, 6 * pxmm); }
    y.strokeStyle = 'rgba(110,111,112,.6)'; y.lineWidth = .14 * pxmm; const pitch = .5 * pxmm;   // >= 8 px pitch: no moire with mipmaps
    for (let u = 0; u < W; u += pitch) { y.beginPath(); y.moveTo(u, 0); y.lineTo(u, Hh); y.stroke(); }
    for (let v = 0; v < Hh; v += pitch) { y.beginPath(); y.moveTo(0, v); y.lineTo(W, v); y.stroke(); }
    const t = tex(c); t.colorSpace = THREE.SRGBColorSpace;
    const mg = new THREE.CylinderGeometry(40.5, 40.5, 9, 180, 1, true); mg.rotateX(Math.PI / 2); mg.translate(0, 0, ZB + 33.6 + 4.5);   // top 2 mm lower: hidden under the lip
    // cylinder UV u starts at +z (pre-rotation) i.e. -y here; rotate so the tabs sit at 0, 60, 120 ... degrees
    const mesh = add(g, new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ map: t, roughness: .75, metalness: .1 }))); mesh.rotation.z = -Math.PI / 2; }
  // chamber: base ring A (r 37-43), stepped ring, ring B pulled in to r 31.5 with its top 1 mm under the cap (only a thin shadow line
  // straight on); the grey insect-mesh disc inside it (#9a9c9e, so the slot reads as shade, not a black line) shows only at an angle
  { const cp = [V2(41.2, 44.2), V2(42.6, 44.5), V2(42.6, 44.9), V2(42.2, 45.3), V2(37, 45.3), V2(36.6, 46.6), V2(36.4, 46), V2(36.4, 45.6), V2(36.2, 46), V2(35.5, 46.1),
      V2(32.2, 46.4), V2(31.7, 46.8), V2(31.5, 47.4), V2(31.5, 50.6), V2(31.3, 51.3), V2(31, 51.5), V2(30.6, 51.3), V2(30.4, 50.7), V2(30.35, 50)];   // ring B top 1 mm under the cap
    const ch = add(g, new THREE.Mesh(new THREE.LatheGeometry(cp.map((p, i) => V2(p.x, p.y + ZB + (i > 5 ? LIFT : 0))), 180), cupM)); ch.rotation.x = Math.PI / 2;
    const mc = document.createElement('canvas'); mc.width = mc.height = 256; const mx = mc.getContext('2d'); mx.fillStyle = '#9a9c9e'; mx.fillRect(0, 0, 256, 256);
    mx.strokeStyle = 'rgba(70,71,72,.6)'; mx.lineWidth = 1.2; for (let i = 0; i < 256; i += 4) { mx.beginPath(); mx.moveTo(i, 0); mx.lineTo(i, 256); mx.moveTo(0, i); mx.lineTo(256, i); mx.stroke(); }
    const mt = tex(mc); mt.colorSpace = THREE.SRGBColorSpace; mt.wrapS = mt.wrapT = THREE.RepeatWrapping; mt.repeat.set(3, 3);
    const dk = [V2(30.35, 50), V2(30, 49.2), V2(0, 49.2)];
    const di = add(g, new THREE.Mesh(new THREE.LatheGeometry(dk.map(p => V2(p.x, p.y + ZB + LIFT)), 120), new THREE.MeshStandardMaterial({ map: mt, roughness: .8 }))); di.rotation.x = Math.PI / 2; }

  /* ---------- floating cap (TEST/HUSH button) with a shallow centre dimple */
  // a drum: 6 mm straight side (r 29.2), R2 into a top domed +1 mm at the centre, 9 mm centre dish 0.9 deep with a crisp R0.3 edge
  { const cp = [V2(0, 52.5), V2(27.6, 52.5), V2(28.6, 52.7), V2(29.1, 53.2), V2(29.2, 54)];
    for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; cp.push(V2(27.2 + 2 * Math.cos(a), 58.5 + 2 * Math.sin(a))); }
    cp.push(V2(22, 60.8), V2(16, 61.1), V2(10, 61.32), V2(5.1, 61.43), V2(4.75, 61.4), V2(4.55, 61.28), V2(4.4, 61.0), V2(3.9, 60.74), V2(2.6, 60.6), V2(0, 60.55));
    const cap = add(g, new THREE.Mesh(new THREE.LatheGeometry(cp.map(p => V2(p.x, p.y + ZB + LIFT)), 160), capM)); cap.rotation.x = Math.PI / 2; }

  /* ---------- six arched spokes: foot on the face, arc up and in, joining the cap rim */
  // each spoke leaves the cap's side wall below its top (inner end buried in the cap) and drops in one convex arc to its foot on the lip;
  // nothing stands outside the cap at cap height. Chunky strap: 4.5-4.8 mm radial.
  { const s = new THREE.Shape(); const f0 = faceZ(44.6) - 1.5, f1 = faceZ(49.6) - 1.2;
    // one even bowl in side view: the outer edge runs diagonally from the foot to the cap side, meeting it ~1.5 mm under the cap face
    s.moveTo(27, 65); s.bezierCurveTo(37, 64.5, 44.6, 60, 44.6, f0 + 3); s.lineTo(44.6, f0); s.lineTo(49.6, f1);
    s.bezierCurveTo(48.5, f1 + 7, 38, 67.8, 27, 69.5); s.lineTo(27, 65);
    const bv = .9, W0 = 9.6;
    const sg = new THREE.ExtrudeGeometry(s, { depth: W0 - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelOffset: -bv, bevelSegments: 4, curveSegments: 20 });
    sg.translate(0, 0, -(W0 - 2 * bv) / 2);
    const p = sg.attributes.position;                       // taper: 9.6 mm wide at the foot -> ~7 mm at the cap (photo front: 8-8.8 at r 45)
    for (let i = 0; i < p.count; i++) { const r = p.getX(i), t = Math.min(1, Math.max(0, (r - 27) / (49.6 - 27))); p.setZ(i, p.getZ(i) * (.72 + .28 * t)); }
    sg.computeVertexNormals();
    { const nn = sg.attributes.normal, col = [];             // side walls (normal across the strap) 0.85: the straps read as solid
      for (let i = 0; i < nn.count; i++) { const v = Math.abs(nn.getZ(i)) > .7 ? .85 : 1; col.push(v, v, v); }
      sg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); }
    const spM = white.clone(); spM.vertexColors = true;
    for (const a of [90, 30, -30, -90, 150, 210]) { const c = Math.cos(a * D2R), sn = Math.sin(a * D2R);
      const M = new THREE.Matrix4().makeBasis(new THREE.Vector3(c, sn, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(sn, -c, 0));
      const sp = add(g, new THREE.Mesh(sg, spM)); sp.applyMatrix4(M); } }

  outer.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return outer;
};
