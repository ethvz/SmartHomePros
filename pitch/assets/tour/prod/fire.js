// fire: Vivint Smoke & CO Monitor (EC-FF345 alarm listener), 43.4 W x 76.2 H x 25.4 D mm (width from the photo, 0.57 of the height; spec sheet says 38.1). Back on the wall at z = 0, face toward +z.
// Built in millimetres inside a 0.001-scaled group. Outline = rectangle with crisp 45 deg corner chamfers (3 mm legs) through the full
// depth and a shallow 9 x 0.5 mm notch centred in the top edge (photo). A rear solid (small back edge round), the face plate (3.8 mm side
// roll-offs with a visible crease) and, above the plate's rounded top nose (the bright "rib" 7.6 mm below the top), a top strip set back
// and sloping away with an R1.5 top edge. One countersunk pinhole.
export default H => {
  const { THREE, G, add, ext, splitMat } = H;
  const outer = G(), g = G(); g.scale.setScalar(.001); outer.add(g);
  const W = 43.4, Ht = 76.2, X = W / 2, Y = Ht / 2, C = 3.0, NW = 4.5, ND = .5;
  const white = new THREE.MeshPhysicalMaterial({ color: 0xececee, roughness: .38, clearcoat: .35, clearcoatRoughness: .28 });

  // chamfered outline from y0 to y1; chTop/chBot: corner chamfers; notch: the 9 x 0.5 mm top-edge notch
  const outline = (y0, y1, chTop, chBot, notch) => { const s = new THREE.Shape();
    s.moveTo(-X + (chBot ? C : 0), y0); s.lineTo(X - (chBot ? C : 0), y0); if (chBot) s.lineTo(X, y0 + C);
    s.lineTo(X, y1 - (chTop ? C : 0)); if (chTop) s.lineTo(X - C, y1);
    if (notch) { s.lineTo(NW, y1); s.lineTo(NW, y1 - ND); s.lineTo(-NW, y1 - ND); s.lineTo(-NW, y1); }
    s.lineTo(-X + (chTop ? C : 0), y1); if (chTop) s.lineTo(-X, y1 - C);
    s.lineTo(-X, y0 + (chBot ? C : 0)); s.closePath(); return s; };

  const PH = Y - 27.8, RIB = Y - 7.3;                    // pinhole 27.8 mm below the top; face plate stops 7.6 mm below the top
  // rear solid: z 0 .. 20, back perimeter R 0.5
  add(g, ext(outline(-Y, Y, true, true, true), 20, .5, white));

  // face plate: z 8 .. 24.6; side roll-offs 3.8 wide x 1.4 deep (3 segments so the inner crease reads); its top edge is squeezed to
  // a 2.3 mm nose: that rounded nose is the bright band ("rib") across the top. Faint parting line 38 mm below the top (photo).
  const mask = (() => { const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, N, N); x.fillStyle = '#000'; x.beginPath(); x.arc(N / 2, N / 2, 1.3 / 4 * N, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;   // maps a 4 mm square round the pinhole
    t.repeat.set(1 / 4, 1 / 4); t.offset.set(2 / 4, (2 - PH) / 4); return t; })();
  const pm = splitMat(white, white, 'y', Y - 38, .22, 0xdcdddb); pm.alphaMap = mask; pm.alphaTest = .5;
  { const bs = 3.8, bt = 1.4, d = 16.6, nose = 2.3;
    const ps = new THREE.Shape(), Rc = 4.2;               // plate outline: bottom chamfers, top corners rounded so the nose band has round ends
    ps.moveTo(-X + C, -Y); ps.lineTo(X - C, -Y); ps.lineTo(X, -Y + C); ps.lineTo(X, RIB - Rc); ps.absarc(X - Rc, RIB - Rc, Rc, 0, Math.PI / 2, false);
    ps.lineTo(-X + Rc, RIB); ps.absarc(-X + Rc, RIB - Rc, Rc, Math.PI / 2, Math.PI, false); ps.lineTo(-X, -Y + C); ps.closePath();
    const ge = new THREE.ExtrudeGeometry(ps, { depth: d - 2 * bt, bevelEnabled: true, bevelThickness: bt,
      bevelSize: bs, bevelOffset: -bs, bevelSegments: 3, curveSegments: 16 });
    ge.translate(0, 0, bt);
    const p = ge.attributes.position;                    // squeeze the top-edge roll from 3.8 mm to the 1 mm nose
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > RIB - bs - 1e-4) p.setY(i, RIB - (RIB - y) * nose / bs); }
    ge.computeVertexNormals();
    add(g, new THREE.Mesh(ge, pm), 0, 0, 8); }

  // top strip: from the plate's nose to the top, set back to the end of the nose roll (z 23.2) and sloping back a further 1 mm
  // toward the top; R1.5 rounds (the highlight line just under the top edge). Its lower part is buried behind the plate.
  { const y0 = RIB - 2, d = 23.2, b = 1.5;
    const ge = new THREE.ExtrudeGeometry(outline(y0, Y, true, false, true), { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b,
      bevelSize: b, bevelOffset: -b, bevelSegments: 5, curveSegments: 12 });
    ge.translate(0, 0, b);
    const p = ge.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i), t = Math.max(0, (y - RIB) / (Y - RIB)); p.setZ(i, z - t * 1.0 * (z / d)); }
    ge.computeVertexNormals();
    add(g, new THREE.Mesh(ge, white)); }

  // pinhole: shallow countersink (dia 2.6, 0.15 deep) into a dark brown 2.0 mm bore (photo), 27.8 mm below the top
  { const V2 = (r, z) => new THREE.Vector2(r, z);
    const cs = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(1.32, 24.62), V2(1.15, 24.54), V2(1.03, 24.49), V2(1, 24.45)], 40), white), 0, PH, 0);
    cs.rotation.x = Math.PI / 2;
    const bore = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(1, 24.45), V2(1, 21.6), V2(0, 21.6)], 32),
      new THREE.MeshStandardMaterial({ color: 0x2a1e16, roughness: .9, envMapIntensity: .1, side: THREE.DoubleSide })), 0, PH, 0);
    bore.rotation.x = Math.PI / 2; }

  outer.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return outer;
};
