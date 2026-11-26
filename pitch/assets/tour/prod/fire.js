// fire: Vivint Smoke & CO Monitor (EC-FF345 alarm listener), 38.1 W x 76.2 H x 25.4 D mm. Back on the wall at z = 0, face toward +z.
// Built in millimetres inside a 0.001-scaled group. Outline = rectangle with crisp 45 deg corner chamfers (3 mm legs) through the full
// depth. A rear solid (small back edge round) and the face plate (broad soft roll-off, as the photo's side strips) share that outline.
// Across the top a rounded rib bar (square ends, 3 mm in from the sides) catches the light as in the photo. One countersunk pinhole.
export default H => {
  const { THREE, G, add, ext, splitMat } = H;
  const outer = G(), g = G(); g.scale.setScalar(.001); outer.add(g);
  const W = 38.1, Ht = 76.2, X = W / 2, Y = Ht / 2, C = 3.5;
  const white = new THREE.MeshPhysicalMaterial({ color: 0xefeff0, roughness: .34, clearcoat: .35, clearcoatRoughness: .28 });

  // chamfered outline; top/bottom limits so the face plate can stop at the step
  const outline = (y0, y1, chTop, chBot) => { const s = new THREE.Shape();
    s.moveTo(-X + (chBot ? C : 0), y0); s.lineTo(X - (chBot ? C : 0), y0); if (chBot) s.lineTo(X, y0 + C);
    s.lineTo(X, y1 - (chTop ? C : 0)); if (chTop) s.lineTo(X - C, y1); s.lineTo(-X + (chTop ? C : 0), y1); if (chTop) s.lineTo(-X, y1 - C);
    s.lineTo(-X, y0 + (chBot ? C : 0)); s.closePath(); return s; };

  // soft extrude: bevel bt deep and bs wide (wider roll-off than deep, like the photo's broad side strips), outline preserved
  const extS = (shape, d, bt, bs, m) => { const ge = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * bt, bevelEnabled: true, bevelThickness: bt,
    bevelSize: bs, bevelOffset: -bs, bevelSegments: 8, curveSegments: 12 }); ge.translate(0, 0, bt); return new THREE.Mesh(ge, m); };
  const PH = Y - 27.8;                                   // pinhole height (27.8 mm below the top, measured on the photo)
  // rear solid: z 0 .. 20, back perimeter R 0.5
  add(g, ext(outline(-Y, Y, true, true), 20, .5, white));
  // face plate: z 8 .. 24.6 with broad side roll-offs; faint parting line 38 mm below the top (photo)
  const mask = (() => { const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, N, N); x.fillStyle = '#000'; x.beginPath(); x.arc(N / 2, N / 2, 1.3 / 4 * N, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;   // maps a 4 mm square round the pinhole
    t.repeat.set(1 / 4, 1 / 4); t.offset.set(2 / 4, (2 - PH) / 4); return t; })();
  const pm = splitMat(white, white, 'y', Y - 38, .22, 0xdcdddb); pm.alphaMap = mask; pm.alphaTest = .5;
  add(g, extS(outline(-Y, Y, true, true), 16.6, 2.4, 3, pm), 0, 0, 8);
  // top rib: rounded bar 32 mm long (3 mm in from each side, square ends), 7.0-9.6 mm below the top, standing 0.8 mm proud (to 25.4)
  add(g, H.rslab(32, 2.6, 1.8, .35, .75, white), 0, Y - 8.3, 25.4 - .9);

  // pinhole: countersink (dia 2.6) into a dark 1.6 mm bore, 27.8 mm below the top (floor just above the hidden rear-solid face)
  { const V2 = (r, z) => new THREE.Vector2(r, z);
    const cs = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(1.32, 24.62), V2(1.05, 24.4), V2(.82, 24.05), V2(.8, 23.8)], 40), white), 0, PH, 0);
    cs.rotation.x = Math.PI / 2;
    const bore = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(.8, 23.8), V2(.8, 21.6), V2(0, 21.6)], 32),
      new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: .9, envMapIntensity: .1, side: THREE.DoubleSide })), 0, PH, 0);
    bore.rotation.x = Math.PI / 2; }

  outer.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return outer;
};
