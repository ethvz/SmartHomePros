// fire: Vivint Smoke & CO Monitor (EC-FF345 alarm listener), 38.1 W x 76.2 H x 25.4 D mm. Back on the wall at z = 0, face toward +z.
// Built in millimetres inside a 0.001-scaled group. Outline = rectangle with crisp 45 deg corner chamfers (3 mm legs) through the full
// depth. A rear solid (small back edge round) and a front solid (soft front roll-off) share that outline; the face plate stands 1.4 mm
// proud of the top strip, so its rounded top edge reads as the bright step rib 7.6-10.2 mm below the top. One pinhole with a countersink.
export default H => {
  const { THREE, G, add, ext, splitMat } = H;
  const outer = G(), g = G(); g.scale.setScalar(.001); outer.add(g);
  const W = 38.1, Ht = 76.2, X = W / 2, Y = Ht / 2, C = 3;
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf3f3f1, roughness: .34, clearcoat: .35, clearcoatRoughness: .28 });

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
  // front solid (top strip level): z 8 .. 23.0, soft roll-off; the top strip slopes back a further 1 mm toward the top edge
  const SY = Y - 10.3;                                   // step line (face plate top edge)
  { const f = add(g, extS(outline(-Y, Y, true, true), 15, 2.2, 3, white), 0, 0, 8);
    const p = f.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i); if (y > SY - 2 && z > 10) p.setZ(i, z - Math.max(0, (y - SY) / 10.3) * 1.0); }
    f.geometry.computeVertexNormals(); }
  // face plate: z 8 .. 25.4, same sides/bottom outline, stops at the step; faint parting line 38 mm below the top (photo)
  const mask = (() => { const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, N, N); x.fillStyle = '#000'; x.beginPath(); x.arc(N / 2, N / 2, 1.3 / 4 * N, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;   // maps a 4 mm square round the pinhole
    t.repeat.set(1 / 4, 1 / 4); t.offset.set(2 / 4, (2 - PH) / 4); return t; })();
  const pm = splitMat(white, white, 'y', Y - 38, .22, 0xdcdddb); pm.alphaMap = mask; pm.alphaTest = .5;
  add(g, extS(outline(-Y, SY, false, true), 17.4, 2.4, 3, pm), 0, 0, 8);

  // pinhole: countersink (dia 2.6) into a dark 1.6 mm bore, 27.8 mm below the top (floor just above the inner front solid face)
  { const V2 = (r, z) => new THREE.Vector2(r, z);
    const cs = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(1.32, 25.42), V2(1.05, 25.2), V2(.82, 24.85), V2(.8, 24.6)], 40), white), 0, PH, 0);
    cs.rotation.x = Math.PI / 2;
    const bore = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(.8, 24.6), V2(.8, 23.1), V2(0, 23.1)], 32),
      new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: .9, envMapIntensity: .1, side: THREE.DoubleSide })), 0, PH, 0);
    bore.rotation.x = Math.PI / 2; }

  outer.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return outer;
};
