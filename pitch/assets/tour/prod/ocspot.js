// Spotlight Pro (Gen 3): an ATTACHMENT for the Outdoor Camera Pro. The camera (mount, collar, ball, head) is the ocp model
// unchanged; the Spotlight's bracket takes the place of the mount's wall plate, runs down the wall as a 77 mm band flush with
// the mount sides, bends forward (J) into a tongue lying on top of a trapezoid LED light bar. Wall at z = 0, face +z.
// Authored in millimetres inside a group scaled to metres; origin = centre of the camera mount footprint (as in ocp).
export default H => {
  const { THREE, G, add, mat, ext, rr4 } = H;
  const g = H.models.ocp();                                  // identical camera + mount
  const M = add(g, G()); M.scale.setScalar(.001);
  const V2 = (x, y) => new THREE.Vector2(x, y);

  const white = new THREE.MeshPhysicalMaterial({color:0xecedee, roughness:.6, clearcoat:.08, clearcoatRoughness:.6, sheen:.3, sheenRoughness:.8, sheenColor:0xffffff});
  const barW = new THREE.MeshPhysicalMaterial({color:0xeeeff0, roughness:.5, clearcoat:.15, clearcoatRoughness:.45, sheen:.3, sheenRoughness:.7, sheenColor:0xffffff});
  const refl = new THREE.MeshPhysicalMaterial({color:0xf4f4f4, roughness:.75, sheen:.2, sheenColor:0xffffff});
  const reflDeep = new THREE.MeshPhysicalMaterial({color:0xd9dadc, roughness:.7});
  const greyP = mat(0xbec0c2, {r:.55});

  // ---------------------------------------------------------------- bracket: vertical band + J bend (side profile extruded across 77 mm)
  const Wb = 77, yTop = -40, yTg = -85, tT = 6, Tb = 10, Ro = 24, Ri = Ro - Tb, zTg = 74;
  { const s = new THREE.Shape();                              // profile in (u = z, v = y): band 10 thick, outer bend R24, tongue 6 thick
    s.moveTo(0, yTop); s.lineTo(0, yTg + Ro);
    s.absarc(Ro, yTg + Ro, Ro, Math.PI, 1.5*Math.PI, false); // outer bend -> tongue underside
    s.lineTo(Ro + 8, yTg); s.lineTo(Ro + 8, yTg + tT);       // overlaps the tongue plate
    s.lineTo(Ro, yTg + tT);
    s.absarc(Ro, yTg + tT + Ri, Ri, 1.5*Math.PI, Math.PI, true);   // inner bend
    s.lineTo(Tb, yTop); s.lineTo(0, yTop);
    const j = ext(s, Wb, 3, white); j.geometry.rotateY(-Math.PI/2); j.geometry.translate(Wb/2, 0, 0); M.add(j); j.castShadow = j.receiveShadow = true;
    // tongue: plan rounded rectangle (R8 front corners) 77 wide lying on the bar top (a real 7 mm step), running forward to z = 74
    const t = ext(rr4(Wb, zTg - Ro, [8, 8, 0, 0], 0, (zTg + Ro)/2), tT, 1.5, white);   // shape (x, z)
    t.geometry.rotateX(Math.PI/2); t.geometry.translate(0, yTg + tT, 0);   // shape y -> z; thickness runs down to the bar top
    M.add(t); t.castShadow = t.receiveShadow = true;
  }

  // ---------------------------------------------------------------- light bar housing
  // plan (x, z): centre face z = 88 (~80 wide), wings back to (+-88, 20), rounded back; section: top y = -84, bottom y = -150,
  // the back a half-ellipse (rearmost z = 8 at mid height), all three LED faces leaning back 12 mm toward the bottom.
  const zF = 91, yT = -85, yB = -152, lean = 13, wing = V2(66, 47).normalize(), cW = wing.x*50 + wing.y*zF;   // centre face ~100 wide, wings ~54 deg to the wall (front photo)
  const zBack = y => 20 - 14*Math.sqrt(Math.max(0, 1 - ((y+118.5)/33.5)**2));   // half-ellipse back, rearmost z = 6
  const lines = (d, y) => [ [wing.x, wing.y, cW - d], [0, 1, zF - d], [-wing.x, wing.y, cW - d], [0, -1, -zBack(y)] ];   // CCW by normal angle
  const RC = [4, 4, 4, 4];                                    // corner radii: front corners R4; the wings run right back to the rounded (half-ellipse) back
  const nC = 10, nE = 14;
  const outline = (d, y) => {                                 // rounded convex polygon from half-planes n.p <= c, fixed topology
    const L = lines(d, y), P = [];
    const isect = (a, b) => { const det = a[0]*b[1] - a[1]*b[0]; return [(a[2]*b[1] - b[2]*a[1])/det, (a[0]*b[2] - b[0]*a[2])/det]; };
    const arcs = L.map((a, k) => { const b = L[(k+1)%4], R = RC[k], c = isect([a[0],a[1],a[2]-R], [b[0],b[1],b[2]-R]);
      let a0 = Math.atan2(a[1], a[0]), a1 = Math.atan2(b[1], b[0]); while(a1 < a0) a1 += 2*Math.PI; return {c, R, a0, a1}; });
    arcs.forEach((A, k) => { for(let i=0;i<=nC;i++){ const t = A.a0 + (A.a1-A.a0)*i/nC; P.push([A.c[0] + A.R*Math.cos(t), A.c[1] + A.R*Math.sin(t)]); }
      const B = arcs[(k+1)%4], e0 = P[P.length-1], e1 = [B.c[0] + B.R*Math.cos(B.a0), B.c[1] + B.R*Math.sin(B.a0)];
      for(let i=1;i<nE;i++) P.push([e0[0] + (e1[0]-e0[0])*i/nE, e0[1] + (e1[1]-e0[1])*i/nE]); });
    return P; };
  const NP = 4*(nC+1+nE-1);
  const leanAt = y => lean*(yT - y)/(yT - yB);
  const wY0 = yT - 2.6, wY1 = yB + 2.6, band = 7;                      // window band: housing sits 7 mm back, behind the reflector plates
  const levels = [];
  for(let i=0;i<=6;i++){ const a = i/6*Math.PI/2; levels.push([yT - 1.5 + 1.5*Math.cos(a), 1.5 - 1.5*Math.sin(a), 0]); }    // top edge R1.5 (no lip)
  levels.push([wY0+.3, 0, 0], [wY0+.15, .3, 0], [wY0, band, 1]);
  for(let y = wY0 - 4; y > wY1 + 1; y -= 4) levels.push([y, band, 1]);
  levels.push([wY1, band, 1], [wY1-.15, .3, 0], [wY1-.3, 0, 0]);
  for(let i=0;i<=6;i++){ const a = i/6*Math.PI/2; levels.push([yB + 1.5 - 1.5*Math.sin(a), 1.5 - 1.5*Math.cos(a), 0]); }   // bottom edge R1.5
  const pos = [], idxA = [], idxB = [];
  for(const [y, d] of levels) for(const [x, z] of outline(leanAt(y) + d, y)) pos.push(x, y, z);
  for(let r=0;r<levels.length-1;r++){ const into = (levels[r][2] && levels[r+1][2]) ? idxB : idxA;
    for(let i=0;i<NP;i++){ const a = r*NP+i, b = r*NP+(i+1)%NP, c = a+NP, d = b+NP; into.push(a,b,c, b,d,c); } }
  const cT = pos.length/3; pos.push(0, yT, 50); const cB = pos.length/3; pos.push(0, yB, 45);
  const oB = (levels.length-1)*NP; for(let i=0;i<NP;i++){ idxA.push(cT, (i+1)%NP, i); idxA.push(cB, oB+i, oB+(i+1)%NP); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  bg.setIndex([...idxA, ...idxB]); bg.addGroup(0, idxA.length, 0); bg.addGroup(idxA.length, idxB.length, 1); bg.computeVertexNormals();
  const bar = new THREE.Mesh(bg, [barW, reflDeep]); bar.castShadow = bar.receiveShadow = true; M.add(bar);

  // ---------------------------------------------------------------- LED faces: reflector plate with 3 capsule recesses x 2 LED domes, per face
  const ledM = new THREE.MeshPhysicalMaterial({color:0x6f7275, roughness:.05, metalness:.1, clearcoat:1, clearcoatRoughness:.03, transmission:.0, sheen:.2});
  const ledIn = mat(0x55585b, {r:.3});
  const slant = Math.hypot(yT - yB, lean), dv = V2(lean, yT - yB).normalize();     // down-the-face direction: (inward lean, down)
  // faces: horizontal outward normal, top-edge centre point (x, z), usable width, column offsets
  const sW = 32, faces = [                                    // wings: plate centred 29 mm back along the wing from the front corner
    { n: V2(0, 1), p: V2(0, zF), w: 94, cols: [-28, 0, 28] },
    { n: V2(wing.x, wing.y), p: V2(50 + wing.y*sW, zF - wing.x*sW), w: 58, cols: [-18, 0, 18] },
    { n: V2(-wing.x, wing.y), p: V2(-50 - wing.y*sW, zF - wing.x*sW), w: 58, cols: [-18, 0, 18] } ];
  const hW = (wY0 - wY1), vMid = (yT - (wY0 + wY1)/2)/(yT - yB)*slant;               // window height, slanted distance to its middle
  for(const F of faces){
    const f = new THREE.Group(); M.add(f);
    // face frame: x = along the face (to the viewer's right), y = up the face, z = out of the face
    const t = new THREE.Vector3(F.n.y, 0, -F.n.x), nh = new THREE.Vector3(F.n.x, 0, F.n.y);
    const down = nh.clone().multiplyScalar(-dv.x).add(new THREE.Vector3(0, -dv.y, 0)).normalize();   // down the leaning face
    const up = down.clone().negate(), out = new THREE.Vector3().crossVectors(t, up).normalize();
    f.matrix.makeBasis(t, up, out); f.matrix.setPosition(new THREE.Vector3(F.p.x, yT, F.p.y).addScaledVector(down, vMid)); f.matrixAutoUpdate = false;
    const insetR = 2.2;                                       // reflector surface ~2 mm behind the flush outer window
    const plate = new THREE.Shape(); { const w = F.w/2, h = hW/2; plate.moveTo(-w, -h); plate.lineTo(w, -h); plate.lineTo(w, h); plate.lineTo(-w, h); plate.lineTo(-w, -h); }
    for(const cx of F.cols){ const p = new THREE.Path(); p.absarc(cx, 12, 6, 0, Math.PI, false); p.absarc(cx, -12, 6, Math.PI, 2*Math.PI, false); p.closePath(); plate.holes.push(p); }
    const pm = ext(plate, 2.5, .5, refl); add(f, pm, 0, 0, -insetR - 2.5); pm.castShadow = false; pm.receiveShadow = true;
    for(const cx of F.cols) for(const cy of [-12, 12]){
      add(f, H.dome(4.5, 2.2, ledM), cx, cy, -insetR - 2.5 - .2);
      add(f, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .2, 20), ledIn)), cx, cy, -insetR - 2.5 + .9);
    }
  }

  // ---------------------------------------------------------------- clear wraparound window (recessed 0.8) with a smoky edge band
  { const chainAt = (d, y) => {                               // the front + wing part of the outline (right wing end -> left wing end)
      const P = outline(d, y), B = nC + nE, out = [], ring = P.concat(P);   // blocks: arc k + edge along line k+1
      const start = 3*B + nC + 2, end = 6*B - 2;              // right wing (just inside its rear end) -> front -> left wing
      for(let i=start;i<=end;i++) out.push(ring[i]);
      return out; };
    const glass = new THREE.MeshPhysicalMaterial({color:0xe9eef2, roughness:.04, metalness:0, transparent:true, opacity:.32, clearcoat:1, clearcoatRoughness:.02, specularIntensity:1, envMapIntensity:1.6, side:THREE.DoubleSide, depthWrite:false});
    const smoke = new THREE.MeshPhysicalMaterial({color:0x606366, roughness:.18, transparent:true, opacity:.85, clearcoat:.6, side:THREE.DoubleSide});
    const strip = (yA, yB2, m, dE = 0) => { const lv = [yA, (yA+yB2)/2, yB2], pos = [], idx = []; let n = 0;
      for(const y of lv){ const C = chainAt(leanAt(y) + .12 - dE, y); n = C.length; for(const [x, z] of C) pos.push(x, y, z); }
      for(let r=0;r<lv.length-1;r++) for(let i=0;i<n-1;i++){ const a = r*n+i, b = a+1, c = a+n, d = c+1; idx.push(a,b,c, b,d,c); }
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals();
      return add(M, new THREE.Mesh(ge, m)); };
    strip(wY0 + .2, wY1 - .2, glass).renderOrder = 2;                 // flush outer window over the whole band
    strip(wY0 + .2, wY0 - 2, smoke, .06); strip(wY1 + 2, wY1 - .2, smoke, .06);
  }

  // ---------------------------------------------------------------- grey screw panel on the bar's upper back (seen from behind / below),
  // and the two wall screws on the band's back (ocspot_back_1)
  { const yP = -97, th = .33, zP = zBack(yP);                 // on the bar's upper back, under the bracket saddle
    const p = add(M, H.rslab(64, 18, 1.2, 3, .3, greyP), 0, yP + .3*Math.sin(th), zP - .3*Math.cos(th)); p.rotation.x = Math.PI + th;
    for(const sx of [-26, 26]) add(p, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, .3, 32), mat(0xd3d4d5,{r:.4}))), sx, 0, .65);
    const scr = mat(0xb9bbbd, {r:.35, m:.6});
    for(const sx of [-27, 27]){ const sc = add(M, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .6, 24), scr)), sx, -56, -.2);
      for(const r of [0, Math.PI/2]){ const sl = add(M, new THREE.Mesh(new THREE.BoxGeometry(2.6, .45, .2), mat(0x55585b,{r:.6})), sx, -56, -.55); sl.rotation.z = r; } } }
  return g;
};
