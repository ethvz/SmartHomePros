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

  // rear solid: z 0 .. 20, back perimeter R 0.5
  add(g, ext(outline(-Y, Y, true, true), 20, .5, white));
  // front solid (top strip level): z 8 .. 24.0, soft 2.4 roll-off; the top strip slopes back a further 1 mm toward the top edge
  const SY = Y - 10.3;                                   // step line (face plate top edge)
  { const f = add(g, ext(outline(-Y, Y, true, true), 16, 2.4, white), 0, 0, 8);
    const p = f.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i); if (y > SY - 2 && z > 10) p.setZ(i, z - Math.max(0, (y - SY) / 10.3) * 1.0); }
    f.geometry.computeVertexNormals(); }
  // face plate: z 8 .. 25.4, same sides/bottom outline, stops at the step; faint parting line 45 mm below the top
  const mask = (() => { const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, N, N); x.fillStyle = '#000'; x.beginPath(); x.arc(N / 2, N / 2, 1.3 / 4 * N, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;   // maps a 4 mm square round the pinhole
    t.repeat.set(1 / 4, 1 / 4); t.offset.set(2 / 4, (2 - 11.6) / 4); return t; })();
  const pm = splitMat(white, white, 'y', Y - 45, .22, 0xdcdddb); pm.alphaMap = mask; pm.alphaTest = .5;
  add(g, ext(outline(-Y, SY, false, true), 17.4, 2.4, pm), 0, 0, 8);

  // pinhole: countersink (dia 2.6) into a dark 1.6 mm bore, 26.5 mm below the top
  { const V2 = (r, z) => new THREE.Vector2(r, z);
    const cs = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(1.32, 25.42), V2(1.05, 25.2), V2(.82, 24.85), V2(.8, 24.6)], 40), white), 0, 11.6, 0);
    cs.rotation.x = Math.PI / 2;
    const bore = add(g, new THREE.Mesh(new THREE.LatheGeometry([V2(.8, 24.6), V2(.8, 14), V2(0, 14)], 32),
      new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: .9, envMapIntensity: .1, side: THREE.DoubleSide })), 0, 11.6, 0);
    bore.rotation.x = Math.PI / 2; }

  outer.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return outer;
};
