// fire: Vivint Smoke & CO Monitor (EC-FF345 alarm listener), 43.4 W x 76.2 H x 25.4 D mm (width from the photo, 0.57 of the height; spec sheet says 38.1). Back on the wall at z = 0, face toward +z.
// Built in millimetres inside a 0.001-scaled group. Outline = rectangle with crisp 45 deg corner chamfers (3 mm legs) through the full
// depth and a shallow 9 x 0.5 mm notch centred in the top edge (photo). Rear solid + plate body share the outline; the front is ONE
// height-field surface over that outline (so every change is flush): 2 mm side/edge roll-offs running unbroken round the chamfers, the
// face at z 24.6, a top strip (top 7.4 mm) set back 0.8 mm with a soft crease 3.6 mm below the top (the photo's highlight line), and an
// inset half-round rib 7.4-10.1 mm below the top, ending 4.4 mm in from each side (the photo's bright band). One countersunk pinhole.
export default H => {
  const { THREE, G, add, ext, splitMat } = H;
  const outer = G(), g = G(); g.scale.setScalar(.001); outer.add(g);
  const W = 43.4, Ht = 76.2, X = W / 2, Y = Ht / 2, C = 3.0, NW = 4.5, ND = .5;
  const white = new THREE.MeshPhysicalMaterial({ color: 0xa6a6ad, roughness: .3, clearcoat: .45, clearcoatRoughness: .25 });

  // outline polygon (CCW), with the top notch
  const OP = [[-X + C, -Y], [X - C, -Y], [X, -Y + C], [X, Y - C], [X - C, Y], [NW, Y], [NW, Y - ND], [-NW, Y - ND], [-NW, Y], [-X + C, Y], [-X, Y - C], [-X, -Y + C]];
  const shape = () => new THREE.Shape(OP.map(p => new THREE.Vector2(p[0], p[1])));
  // nearest point on the outline and signed distance (+ inside)
  const near = (x, y) => { let best = 1e9, bx = 0, by = 0, inside = false;
    for (let i = 0, j = OP.length - 1; i < OP.length; j = i++) { const [x1, y1] = OP[j], [x2, y2] = OP[i];
      if ((y2 > y) !== (y1 > y) && x < (x1 - x2) * (y - y2) / (y1 - y2) + x2) inside = !inside;
      const dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy))), px = x1 + t * dx, py = y1 + t * dy, d = Math.hypot(x - px, y - py);
      if (d < best) { best = d; bx = px; by = py; } }
    return { d: inside ? best : -best, bx, by }; };

  const PH = Y - 27.8, ZF = 24.6;                         // pinhole 27.8 mm below the top; face plane
  const BS = 2, BT = .9;                                  // edge roll-off: 2 mm wide, 0.9 mm deep (elliptical)
  const ss = (a, b, t) => { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
  const RY = Y - 8.75, RH = 1.35, RL = X - 4.4 - RH;     // rib: capsule centre line y, half height, half length
  const hf = (x, y) => {                                  // height of the front surface (inside the outline)
    let z = ZF;
    // top strip: set back 0.8; between 7.4 and 3.6 mm below the top it also tips back 0.4 toward the bottom; R0.4-ish crease at Y-3.6
    const u = Y - 3.6 - y, slope = .25 / 3.8, sp = .4 * Math.log1p(Math.exp(u / .4));          // softplus: a rounded crease
    const strip = ZF - .8 - slope * Math.min(sp, 3.8 + .4);
    z += (strip - ZF) * ss(Y - 7.4 - .35, Y - 7.4 + .35, y);
    // rib: half-round, 0.6 proud
    // rib: round-topped, 0.6 proud; its upper side is a half-round, its lower side runs out gently (no dark line under it, photo)
    const dx = Math.max(0, Math.abs(x) - RL), dr = Math.hypot(dx, y > RY ? y - RY : (y - RY) / 2);
    if (dr < RH) z = Math.max(z, ZF + .6 * (y > RY ? Math.sqrt(1 - (dr / RH) ** 2) : Math.cos(dr / RH * Math.PI / 2) ** 2 * .5 + .5 * Math.sqrt(1 - (dr / RH) ** 2)));
    // edge roll-off
    // a ~24 deg flat (faces the light like the photo's bright side strips), soft inner crease
    const { d } = near(x, y); if (d < BS) { const q = (BS - Math.max(0, d)) / BS; z -= BT * (Math.sqrt(q * q + .01) - .1) / (Math.sqrt(1.01) - .1); }
    return z; };

  // rear solid (z 0..20) and the plate body (z 8 .. ZF-BT) behind the front surface
  add(g, ext(shape(), 20, .5, white));
  const body = () => add(g, ext(shape(), ZF - BT - 8 + .02, .3, pm), 0, 0, 8);

  // pinhole mask (4 mm square round the hole), front surface material with the faint parting line 38 mm below the top
  const mask = (() => { const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, N, N); x.fillStyle = '#000'; x.beginPath(); x.arc(N / 2, N / 2, 1.3 / 4 * N, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.repeat.set(1 / 4, 1 / 4); t.offset.set(2 / 4, (2 - PH) / 4); return t; })();
  const pm = splitMat(white, white, 'y', Y - 38, .22, 0xa8a9a8); pm.alphaMap = mask; pm.alphaTest = .5;
  body();                                                 // plate body: same masked material, so the pinhole stays open through its front

  // front height field: 0.2 mm grid; points outside the outline are pulled onto it, so the edge is exact
  { const st = .2, nx = Math.ceil(W / st) + 2, ny = Math.ceil(Ht / st) + 2, pos = [], nor = [], uv = [], idx = [], e = .03;
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      let x = -X - st + i * (W + 2 * st) / nx, y = -Y - st + j * (Ht + 2 * st) / ny;
      const n = near(x, y); if (n.d < 0) { x = n.bx; y = n.by; }
      const xi = x - Math.sign(x) * 1e-3 * (n.d < 0), yi = y - Math.sign(y) * 1e-3 * (n.d < 0);
      pos.push(x, y, hf(xi, yi)); uv.push(x, y);
      const gx = (hf(xi + e, yi) - hf(xi - e, yi)) / (2 * e), gy = (hf(xi, yi + e) - hf(xi, yi - e)) / (2 * e), l = Math.hypot(gx, gy, 1);
      nor.push(-gx / l, -gy / l, 1 / l); }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const face = add(g, new THREE.Mesh(geo, pm)); face.userData.noSelfShadow = true; }

  // pinhole: shallow countersink (dia 2.6, 0.15 deep) into a dark brown 2.0 mm bore (photo), 27.8 mm below the top
  { const V2 = (r, z) => new THREE.Vector2(r, z);
    const cs = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(1.32, ZF + .02), V2(1.15, ZF - .06), V2(1.03, ZF - .11), V2(1, ZF - .15)], 40), white), 0, PH, 0);
    cs.rotation.x = Math.PI / 2;
    const bore = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(1, ZF - .15), V2(1, 21.6), V2(0, 21.6)], 32),
      new THREE.MeshStandardMaterial({ color: 0x2a1e16, roughness: .9, envMapIntensity: .1, side: THREE.DoubleSide })), 0, PH, 0);
    bore.rotation.x = Math.PI / 2; }

  // the big, nearly flat front is lit by direct light only (no self-shadow): a shadow map on it gives acne seams in the house
  outer.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = !o.userData.noSelfShadow; } });
  return outer;
};
