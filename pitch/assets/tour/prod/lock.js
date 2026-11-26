// Smart Lock: Kwikset Home Connect 620 Contemporary, matte black (finish 514).
// Exterior: 70.6 x 109.5 mm flat escutcheon on a rubber gasket, Kwikset logo button, ten raised frosted keys, bell-shaped
// deadbolt rose with a SmartKey plug and three hidden status LEDs. Interior (other side of the door, facing -z): 66.5 x 147 mm
// housing with a gloss battery cover, matte lower panel, status LED and a sloped thumb-turn on a ringed rose.
// Plus one matte-black lever on each face of the door below the deadbolt (these replace the door group's plain levers).
// Scene: group origin sits 15 mm (world) in front of the door; the model is scaled x1.45, so in these local units the exterior
// door face is z = -0.01034 and the interior door face z = -0.05172.
export default H => {
  const { THREE, G, add, rslab, rbox, printPlane, splitMat } = H;
  const g = G(), mm = v => v / 1000;
  const ZO = -0.01034, ZI = -0.05172, ROSE_Y = mm(-24.1);

  /* ---------- helpers ---------- */
  const noiseTex = (() => { const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), d = x.createImageData(N, N);
    for (let i = 0; i < N * N; i++) { const v = 118 + Math.random() * 30 + (Math.random() < .08 ? 30 : 0); d.data[i*4] = d.data[i*4+1] = d.data[i*4+2] = v; d.data[i*4+3] = 255; }
    x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(90, 90); return t; })();
  const powder = new THREE.MeshPhysicalMaterial({ color: 0x161617, roughness: .76, metalness: .15, bumpMap: noiseTex, bumpScale: .9 });
  const powderL = powder.clone(); powderL.bumpMap = null; powderL.roughness = .93; powderL.metalness = .1;                      // lathe parts (their UVs would stretch the grain)
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: .9 });
  const gapM = new THREE.MeshStandardMaterial({ color: 0x070707, roughness: .9 });
  const keyM = new THREE.MeshPhysicalMaterial({ color: 0xeeeeec, roughness: .5, sheen: .6, sheenRoughness: .5, sheenColor: 0xffffff, clearcoat: .15, clearcoatRoughness: .5,
    emissive: 0xf4f8f2, emissiveIntensity: .05 });
  const rimM = new THREE.MeshPhysicalMaterial({ color: 0x707272, roughness: .7 });
  const keyS = splitMat(rimM, keyM, 'z', mm(1.33), 1e-6, 0x707272), btnS = splitMat(rimM, keyM, 'z', mm(.88), 1e-6, 0x707272);
  const plugM = new THREE.MeshPhysicalMaterial({ color: 0x18181a, roughness: .45, metalness: .2, envMapIntensity: .5 });
  const softA = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, '#fff'); gr.addColorStop(.45, '#aaa'); gr.addColorStop(1, '#000'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const ledOff = new THREE.MeshStandardMaterial({ color: 0x2a2a2b, roughness: .95, alphaMap: softA, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  // the gloss cover gets its own studio-style reflection: dark surroundings with one tall softbox just to the viewer's left of the
  // inside-of-the-door view direction (world -z), so the convex cover always carries a vertical highlight band, in the studio and in the house
  const glossEnv = (() => { const W = 1024, Hh = 512, c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d');
    const bg = x.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#3a3a3a'); bg.addColorStop(.5, '#1c1c1c'); bg.addColorStop(1, '#0c0c0c'); x.fillStyle = bg; x.fillRect(0, 0, W, Hh);
    const band = (u0, u1, a) => { const gr = x.createLinearGradient(u0 * W, 0, u1 * W, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.3, `rgba(255,255,255,${a})`);
      gr.addColorStop(.7, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(u0 * W, Hh * .22, (u1 - u0) * W, Hh * .56); };
    band(.245, .305, 1); band(.2, .225, .3); band(.755, .79, .95);   // main softbox (inside view), a weak fill, and the same box for the outside view
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const glossM = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: .05, metalness: .1, clearcoat: 1, clearcoatRoughness: .03, specularIntensity: 1, envMap: glossEnv, envMapIntensity: 1.6 });
  const ledOn = new THREE.MeshPhysicalMaterial({ color: 0x3a3a3b, roughness: .3, clearcoat: .6 });   // status LED, off (lights green when active)

  // rounded-rect outline points (4 corners x (nc+1)), CCW from the right side
  const rrPts = (w, h, r, nc = 8) => { r = Math.max(1e-6, Math.min(r, w / 2, h / 2)); const x = w / 2 - r, y = h / 2 - r, P = [];
    for (const [cx, cy, a0] of [[x, y, 0], [-x, y, Math.PI / 2], [-x, -y, Math.PI], [x, -y, 1.5 * Math.PI]])
      for (let i = 0; i <= nc; i++) { const a = a0 + i / nc * Math.PI / 2; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return P; };
  // smooth shell through rings of equal point count; caps optional
  const ringMesh = (rings, m, capFront = true) => { const n = rings[0].length, pos = [], idx = [];
    for (const R of rings) for (const p of R) pos.push(...p);
    for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < n; i++) { const a = r * n + i, b = r * n + (i + 1) % n, c = a + n, d = b + n; idx.push(a, b, c, b, d, c); }
    if (capFront) { const R = rings[rings.length - 1]; let cx = 0, cy = 0, cz = 0; for (const p of R) { cx += p[0] / n; cy += p[1] / n; cz += p[2] / n; }
      const ci = pos.length / 3; pos.push(cx, cy, cz); const base = (rings.length - 1) * n; for (let i = 0; i < n; i++) idx.push(base + i, base + (i + 1) % n, ci); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const me = new THREE.Mesh(geo, m); me.castShadow = me.receiveShadow = true; return me; };
  // a moulded key: rounded-rect footprint, sides rising to rim height hr, edge round er, then a gentle crown (top at hr + crown)
  const pillowZ = (hr, er, crown, half) => d => d < er ? hr - er + Math.sqrt(Math.max(0, er * er - (er - d) ** 2)) : hr + crown * (1 - (1 - Math.min(1, (d - er) / Math.max(1e-6, half - er))) ** 2);
  const pillow = (w, h, r, hr, er, crown, m, sink = mm(.4)) => { const half = Math.min(w, h) / 2, zf = pillowZ(hr, er, crown, half), rings = [];
    const ring = (d, z) => rrPts(w - 2 * d, h - 2 * d, r - d).map(([x, y]) => [x, y, z]);
    rings.push(ring(0, -sink));
    for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; rings.push(ring(er * (1 - Math.cos(a)), hr - er + er * Math.sin(a))); }
    for (let i = 1; i <= 8; i++) { const d = er + (half - er) * (i / 8) * .985; rings.push(ring(d, zf(d))); }
    const me = ringMesh(rings, m); me.userData.zf = zf; return me; };
  // a key with a 45-degree-ish chamfer: vertical sides to hs, a chamfer cw wide and ch tall (small rounds at both breaks), flat-ish crown
  const chamZ = (hs, cw, ch, crown, half) => d => d < cw ? hs + ch * d / cw : hs + ch + crown * (1 - (1 - Math.min(1, (d - cw) / Math.max(1e-6, half - cw))) ** 2);
  const chamKey = (w, h, r, hs, cw, ch, crown, m, sink = mm(.4)) => { const half = Math.min(w, h) / 2, zf = chamZ(hs, cw, ch, crown, half), rings = [];
    const ring = (d, z) => rrPts(w - 2 * d, h - 2 * d, r - d).map(([x, y]) => [x, y, z]);
    rings.push(ring(0, -sink), ring(0, hs - mm(.12)), ring(mm(.025), hs - mm(.02)), ring(mm(.08), hs + ch * mm(.08) / cw * .8));
    for (let i = 1; i <= 4; i++) { const d = mm(.08) + (cw - mm(.16)) * i / 4; rings.push(ring(d, hs + ch * d / cw)); }
    rings.push(ring(cw - mm(.02), hs + ch - mm(.008)), ring(cw + mm(.06), zf(cw + mm(.06))));
    for (let i = 1; i <= 8; i++) { const d = cw + mm(.06) + (half - cw - mm(.06)) * (i / 8) * .985; rings.push(ring(d, zf(d))); }
    const me = ringMesh(rings, m); me.userData.zf = zf; return me; };
  // signed inset of (x,y) from a rounded-rect edge (positive inside)
  const inset = (x, y, w, h, r) => { const qx = Math.abs(x) - (w / 2 - r), qy = Math.abs(y) - (h / 2 - r);
    return -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r); };
  // printed artwork that follows a curved top: a subdivided transparent plane lifted to zfn(x,y)
  const conform = (pl, zfn, seg = 24) => { const p = pl.geometry.parameters, geo = new THREE.PlaneGeometry(p.width, p.height, seg, seg), a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) a.setZ(i, zfn(a.getX(i), a.getY(i)) + mm(.03)); geo.computeVertexNormals(); pl.geometry.dispose(); pl.geometry = geo; return pl; };
  // lathe from [r,z] (mm) facing +z; phi measured from +y going toward -x? (three: angle 0 points -y after the turn)
  const lathe = (pts, m, seg = 128, phiStart = 0, phiLen = Math.PI * 2) => { const geo = new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(mm(r), mm(z))), seg, phiStart, phiLen);
    const me = new THREE.Mesh(geo, m); me.rotation.x = Math.PI / 2; me.castShadow = me.receiveShadow = true; return me; };
  const FONT = '"Vivint Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';

  /* ================= EXTERIOR ================= */
  const PART = new URLSearchParams(location.search).get('part');   // DEBUG
  const ex = add(g, G(), 0, 0, ZO);
  add(ex, rslab(mm(69.6), mm(108.5), mm(1.5), mm(1.5), mm(.4), rubber), 0, 0, mm(.75));          // gasket, inset 0.5 mm
  const PF = mm(12.5);                                                                               // plate front face
  add(ex, rslab(mm(70.6), mm(109.5), mm(11), mm(1.5), mm(1.0), powder), 0, 0, mm(1.5 + 5.5));      // flat escutcheon

  // Kwikset logo button (raised 1.0 mm, frosted white, in a 0.4 mm dark gap)
  add(ex, rslab(mm(19.3), mm(10.5), mm(.2), mm(2.7), mm(.05), gapM), 0, mm(41.8), PF + mm(.02));
  const parts = { keys: [], led: [] };                                   // interactive hooks for the 3D Home demo (group.userData.parts)
  const kb = add(ex, chamKey(mm(18.3), mm(9.5), mm(2.2), mm(.45), mm(1.0), mm(.45), mm(.1), splitMat(rimM, keyM, 'z', mm(.88), 1e-6, 0x707272)), 0, mm(41.8), PF);
  parts.button = kb;
  add(ex, conform(printPlane(mm(16), mm(7), (x, P) => { x.fillStyle = '#121212'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'italic 900 35px "Helvetica Neue", Helvetica, Arial, sans-serif'; x.save(); x.translate(...P(0, mm(.1))); x.scale(1.0, 1); x.fillText('Kwikset', 0, 0);
    x.strokeStyle = '#121212'; x.lineWidth = 1.6; x.lineJoin = 'round'; x.strokeText('Kwikset', 0, 0); x.restore(); }),
    (px, py) => kb.userData.zf(inset(px, py, mm(18.3), mm(9.5), mm(2.2)))), 0, mm(41.8), PF);

  // ten keys, 2 rows x 5, raised 1.5 mm with a 0.3 mm crown
  const KW = mm(6.8), KH = mm(11.6), KR = mm(2.0);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
    const x = mm((c - 2) * 10.45), y = mm(r ? 11.9 : 27.2), digit = String((r * 5 + c + 1) % 10);
    add(ex, rslab(KW + mm(1.0), KH + mm(1.0), mm(.2), KR + mm(.5), mm(.05), gapM), x, y, PF + mm(.02));
    const k = add(ex, chamKey(KW, KH, KR, mm(.85), mm(.9), mm(.5), mm(.15), splitMat(rimM, keyM, 'z', mm(1.33), 1e-6, 0x707272)), x, y, PF);   // own material per key so each can light up
    k.name = 'key' + digit; parts.keys.push(k);
    add(ex, conform(printPlane(mm(6), mm(7), (cx, P) => { cx.fillStyle = '#141414'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
      cx.font = '700 66px ' + FONT; cx.fillText(digit, ...P(0, mm(-2.3))); }), (px, py) => k.userData.zf(inset(px, py, KW, KH, KR))), x, y, PF);
  }

  // deadbolt rose: concave foot fillet, bell shoulder, flat front disc, groove, SmartKey plug
  const rose = [[26.5, 12.3], [26.2, 12.5]];
  for (let i = 1; i <= 6; i++) { const a = i / 6 * Math.PI / 2; rose.push([26.2 - Math.sin(a), 13.5 - Math.cos(a)]); }
  // bell: convex quarter ellipse (steep at the foot, flattening toward the disc), then a 1.5 mm round into the flat front disc
  const bell = t => [17.9 + 7.3 * Math.cos(t), 13.5 + 16.75 * Math.sin(t)];
  for (let i = 1; i <= 24; i++) rose.push(bell(i / 24 * Math.PI / 2));
  for (let i = 1; i <= 6; i++) { const q = i / 6 * Math.PI / 2; rose.push([16.4 + 1.5 * Math.cos(q), 30.25 + 1.5 * Math.sin(q)]); }
  rose.push([14, 31.75], [9.7, 31.75], [9.62, 31.55], [9.55, 30.9], [9.0, 30.6], [0, 30.6]);
  add(ex, lathe(rose, powderL), 0, ROSE_Y, 0);
  add(ex, lathe([[9.0, 30.4], [9.0, 31.45], [8.7, 31.75], [0, 31.75]], plugM, 96), 0, ROSE_Y, 0);
  { const ring = new THREE.Mesh(new THREE.RingGeometry(mm(8.95), mm(9.62), 96), gapM); add(ex, ring, 0, ROSE_Y, mm(30.95)); }
  // three hidden status LEDs on the top of the shoulder (11, 12, 1 o'clock)
  for (const deg of [-20, 0, 20]) {
    const pts = []; for (let i = 0; i <= 6; i++) { const [r, z] = bell((.78 + i / 6 * .2) * Math.PI / 2); pts.push([r + .03, z + .03]); }
    const w = 4 / 19.5;
    parts.led.push(add(ex, lathe(pts, ledOff.clone(), 8, Math.PI + deg * Math.PI / 180 - w / 2, w), 0, ROSE_Y, 0));
  }
  // SmartKey keyway printed into the plug face
  const kw = add(ex, printPlane(mm(16), mm(16), (x, P) => { x.fillStyle = '#000'; x.strokeStyle = '#000'; x.lineWidth = 3;
    const R = (cx, cy, w, h, r) => { const [px, py] = P(mm(cx), mm(cy)); x.beginPath(); x.roundRect(px - w * 5, py - h * 5, w * 10, h * 10, r * 10); };
    R(0, -2.8, 1.3, 11.6, .3); x.fill();                                   // vertical slot
    R(0, 4.2, 2.4, 2.4, .25); x.stroke();                                // little square at the top
    { const [px, py] = P(0, mm(-2.6)); x.beginPath(); x.arc(px, py, 27, 0, Math.PI * 2); x.fill(); }   // round hole
    R(.9, -6.6, 1.5, 1.4, .2); x.fill();                                // jog at the bottom of the slot
    R(-4.5, -3.0, .9, 2.4, .45); x.fill();                               // SmartKey re-key tool hole
    { const [px, py] = P(0, mm(-2.6)); x.fillStyle = '#3c3c3c'; x.beginPath();   // the pin: a grey crescent on the right inside the solid black hole
      x.arc(px, py, 26, -Math.PI / 3, Math.PI / 3); x.arc(px + 4, py, 18, Math.PI / 3, -Math.PI / 3, true); x.closePath(); x.fill(); }
    x.strokeStyle = '#2a2a2a'; x.lineWidth = 1; R(0, 1.6, 1.3, 2.8, .2); x.stroke(); R(0, -7.6, 1.3, 1.6, .2); x.stroke();
    x.strokeStyle = '#5a5a5a'; x.lineWidth = 2.2; R(0, 4.2, 2.4, 2.4, .25); x.stroke(); }),
    0, ROSE_Y, mm(31.78));
  kw.material.roughness = 1; kw.material.envMapIntensity = 0;   // the keyway is a hole: no sheen on it

  /* ================= INTERIOR (other side of the door) ================= */
  // built facing +z with the turn rose at the origin, then turned 180 deg about y onto the interior door face
  const inn = add(g, G(), 0, ROSE_Y, ZI); inn.rotation.y = Math.PI;
  const CY = mm(42.5);                                                                                 // housing centre, 42.5 mm above the rose
  add(inn, rslab(mm(69), mm(147), mm(21.7), mm(2.5), mm(.9), powder), 0, CY, mm(10.85));            // housing (its side rails show beside the cover)
  add(inn, rslab(mm(67.6), mm(145.6), mm(1.2), mm(2), mm(.3), rubber), 0, CY, mm(.4));              // dark back edge on the door
  // gloss battery cover, top part between the rails
  const covTop = mm(115.5), covBot = mm(39.6);
  // piano-gloss cover, cylindrically convex across its width (1.2 mm crown) so it always carries a reflection band
  const CW = mm(58.2), CH = covTop - covBot, CZ = mm(20.5), HZ = mm(2.3), ER = mm(.8), CR = mm(1.2);
  const crownX = x => CR * (1 - Math.min(1, (2 * x / CW) ** 2));
  { // cross-section across the width (flat back, eased side edges, cylindrical crown), extruded along the height with soft ends:
    // a single smooth surface along y, so the reflection band has no triangulation creases
    const sh = new THREE.Shape(), n = 64, hw = CW / 2;
    sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(hw, HZ - ER);
    for (let i = 1; i <= 8; i++) { const a = i / 8 * Math.PI / 2; sh.lineTo(hw - ER + ER * Math.cos(a), HZ - ER + ER * Math.sin(a) + crownX(hw - ER + ER * Math.cos(a))); }
    for (let i = 1; i < n; i++) { const x = hw - ER - (CW - 2 * ER) * i / n; sh.lineTo(x, HZ + crownX(x)); }
    for (let i = 0; i < 8; i++) { const a = Math.PI / 2 + i / 8 * Math.PI / 2; sh.lineTo(-hw + ER + ER * Math.cos(a), HZ - ER + ER * Math.sin(a) + crownX(-hw + ER + ER * Math.cos(a))); }
    sh.lineTo(-hw, HZ - ER); sh.lineTo(-hw, 0);
    const b = mm(.6), geo = new THREE.ExtrudeGeometry(sh, { depth: CH - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * .6, bevelOffset: -b * .6, bevelSegments: 6, curveSegments: 4 });
    geo.rotateX(Math.PI / 2); geo.translate(0, CH / 2 - b, 0); geo.computeVertexNormals();
    const cov = new THREE.Mesh(geo, glossM); cov.castShadow = cov.receiveShadow = true; add(inn, cov, 0, (covTop + covBot) / 2, CZ); }
  { const logo = printPlane(mm(30), mm(7), (x, P) => { x.fillStyle = '#f4f4f4'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = 'italic 800 64px "Helvetica Neue", Helvetica, Arial, sans-serif'; x.save(); x.translate(...P(0, 0)); x.scale(1.05, 1); x.fillText('Kwikset', 0, 0); x.restore(); });
    logo.material.emissive = new THREE.Color(0xffffff); logo.material.emissiveIntensity = .35;   // printed white reads even on the dark door at night
    add(inn, conform(logo, px => crownX(px)), 0, mm(46.0), CZ + HZ); }
  for (const sx of [-1, 1]) add(inn, rslab(mm(5.0), mm(145.5), mm(.9), mm(.6), mm(.44), glossM), sx * mm(31.6), CY, mm(21.6));   // side rails with bright eased edges
  { const hl = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, emissive: 0x6a6a6e, roughness: .3 });   // thin bright highlight lines on the rail edges
    for (const sx of [-1, 1]) for (const ex of [-2.25, 2.25]) add(inn, rbox(mm(.3), mm(144.5), mm(.3), mm(.12), hl), sx * mm(31.6) + mm(ex), CY, mm(21.98)); }
  // matte lower panel (a touch prouder than the cover), hairline seam under the cover
  const panTop = mm(39.2), panBot = mm(-27.0), PZ = mm(24.2);
  add(inn, rslab(mm(57.8), panTop - panBot, mm(3.4), mm(1.2), mm(.9), powder), 0, (panTop + panBot) / 2, PZ - mm(1.7));
  // status LED (lit green, as in the 2025 render)
  parts.interiorLed = add(inn, rslab(mm(8), mm(2.6), mm(.6), mm(1.3), mm(.2), ledOn), 0, mm(25.0), PZ - mm(.12));
  add(inn, rslab(mm(8.8), mm(3.4), mm(.2), mm(1.7), mm(.05), gapM), 0, mm(25.0), PZ + mm(.02));
  // thumb-turn rose: raised ring with a groove
  add(inn, lathe([[11.2, 23.9], [11.0, 24.6], [10.8, 25.1], [10.3, 25.45], [9.0, 25.5], [8.7, 25.45], [8.6, 25.0], [8.2, 24.95], [8.1, 25.3], [7.8, 25.5], [0, 25.5]], powderL), 0, 0, 0);
  // thumb-turn: 10 mm wide, 41 mm long, its face sloping out toward the bottom (9 mm proud at the top, 13 mm at the bottom)
  { const s = new THREE.Shape(), T = mm(17.2), B = mm(-21.2), r = mm(1.6);
    const pts = [[0, T], [mm(8.6), T], [mm(12.8), B], [0, B]];
    s.moveTo(0, T); s.lineTo(mm(8.6) - r, T); s.quadraticCurveTo(mm(8.6), T, mm(8.6) + r * .1, T - r);
    s.lineTo(mm(12.8) - r * .05, B + r); s.quadraticCurveTo(mm(12.8), B, mm(12.8) - r, B); s.lineTo(0, B); s.lineTo(0, T);
    const geo = new THREE.ExtrudeGeometry(s, { depth: mm(10) - mm(2.0), bevelEnabled: true, bevelThickness: mm(1.0), bevelSize: mm(1.0), bevelOffset: -mm(1.0), bevelSegments: 5, curveSegments: 12 });
    geo.translate(0, 0, mm(1.0));
    geo.applyMatrix4(new THREE.Matrix4().set(0, 0, -1, mm(5), 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1)); geo.computeVertexNormals();
    const bar = new THREE.Mesh(geo, powder); bar.castShadow = bar.receiveShadow = true;
    const turn = add(inn, G(), 0, 0, 0); add(turn, bar, 0, 0, mm(24.6)); parts.turn = parts.bolt = turn; void pts; }   // rotate turn.rotation.z (about the deadbolt axis) to lock/unlock

  /* ================= LEVERS (one per side, square rose, slim rectangular lever toward the hinge side) ================= */
  const lever = dir => { const l = G();
    add(l, rslab(mm(62), mm(62), mm(8), mm(7), mm(2.2), powder), 0, 0, mm(4));
    add(l, lathe([[12.5, 7.6], [11.5, 8.4], [10.2, 9.4], [9.4, 11], [9.2, 13], [9.2, 38.5], [8.8, 39.2], [0, 39.2]], powderL, 64), 0, 0, 0);
    add(l, rbox(mm(118), mm(16), mm(11.5), mm(4.2), powder), dir * mm(47), 0, mm(44.2));
    return l; };
  const LY = -0.1241;                                                     // world FL+1.0, where the door group draws its plain levers
  add(g, lever(-1), 0, LY, ZO);
  const li = add(g, lever(1), 0, LY, ZI); li.rotation.y = Math.PI;        // turned to face into the house; arm still points to the hinge side
  if (PART === 'ext') { inn.visible = false; g.children.filter(c => c !== ex).forEach(c => g.remove(c)); }   // DEBUG
  if (PART === 'int') { g.remove(ex); g.children.filter(c => c !== inn).forEach(c => g.remove(c)); }   // DEBUG
  g.userData.parts = parts;
  return g;
};
