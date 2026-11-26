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
  const reflDeep = new THREE.MeshPhysicalMaterial({color:0xf2f2f3, roughness:.75});
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
  const wY0 = yT - 2.6, wY1 = yB + 2.6, band = 2.4;                    // window band: the matte reflector sits 2.4 mm behind the flush window
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

  // ---------------------------------------------------------------- LED faces: the housing's window band is the matte reflector, 2.4 mm behind
  // the flush window; per face 3 vertical capsule recesses (shaded inset) x 2 faceted TIR lenses
  const lensC = new THREE.MeshPhysicalMaterial({color:0x8c9094, roughness:.04, metalness:.1, clearcoat:1, clearcoatRoughness:.02, flatShading:true, transparent:true, opacity:.85, envMapIntensity:1.5});
  const lensCore = new THREE.MeshPhysicalMaterial({color:0x3d4044, roughness:.1, metalness:.3, flatShading:true, clearcoat:1, envMapIntensity:1.4});
  const die = mat(0xe9e4d6, {r:.4, x:{emissive:0x2a2822}});
  const capTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 384; const x = c.getContext('2d');
    x.fillStyle = '#a9acaf'; x.fillRect(0, 0, 128, 384);
    for(let k=14;k>=0;k--){ const v = Math.round(0xa9 + (0xec - 0xa9)*(1 - k/14)); x.fillStyle = `rgb(${v},${v},${v+1})`;   // soft shadowed walls -> lit floor
      x.beginPath(); x.roundRect(k*2.2, k*2.2, 128 - k*4.4, 384 - k*4.4, 64 - k*2.2); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const capM = new THREE.MeshStandardMaterial({map:capTex, transparent:true, roughness:.8, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
  const capShape = (() => { const sh = new THREE.Shape(); sh.absarc(0, 12, 6, 0, Math.PI, false); sh.absarc(0, -12, 6, Math.PI, 2*Math.PI, false); sh.closePath(); return sh; })();
  const capGeo = new THREE.ShapeGeometry(capShape, 16); { const uv = capGeo.attributes.uv, P = capGeo.attributes.position; for(let i=0;i<uv.count;i++) uv.setXY(i, (P.getX(i)+6)/12, (P.getY(i)+18)/36); }
  const tirGeo = new THREE.SphereGeometry(5.2, 10, 4, 0, Math.PI*2, 0, Math.PI/2);  tirGeo.scale(1, .55, 1);   // faceted dome
  const coneGeo = new THREE.ConeGeometry(3.1, 2.2, 8, 1, true);
  const slant = Math.hypot(yT - yB, lean), dv = V2(lean, yT - yB).normalize();     // down-the-face direction: (inward lean, down)
  const sW = 32, faces = [
    { n: V2(0, 1), p: V2(0, zF), cols: [-28, 0, 28] },
    { n: V2(wing.x, wing.y), p: V2(50 + wing.y*sW, zF - wing.x*sW), cols: [-18, 0, 18] },
    { n: V2(-wing.x, wing.y), p: V2(-50 - wing.y*sW, zF - wing.x*sW), cols: [-18, 0, 18] } ];
  const vMid = (yT - (wY0 + wY1)/2)/(yT - yB)*slant;
  for(const F of faces){
    const f = new THREE.Group(); M.add(f);
    const t = new THREE.Vector3(F.n.y, 0, -F.n.x), nh = new THREE.Vector3(F.n.x, 0, F.n.y);
    const down = nh.clone().multiplyScalar(-dv.x).add(new THREE.Vector3(0, -dv.y, 0)).normalize();
    const up = down.clone().negate(), out = new THREE.Vector3().crossVectors(t, up).normalize();
    f.matrix.makeBasis(t, up, out); f.matrix.setPosition(new THREE.Vector3(F.p.x, yT, F.p.y).addScaledVector(down, vMid)); f.matrixAutoUpdate = false;
    const zr = -band*dv.y;                                     // reflector (housing band) surface along the face normal
    for(const cx of F.cols){
      add(f, new THREE.Mesh(capGeo, capM), cx, 0, zr + .25);
      for(const cy of [-12, 12]){
        const l = add(f, new THREE.Mesh(tirGeo, lensC), cx, cy, zr - .4); l.rotation.x = Math.PI/2;
        const cn = add(f, new THREE.Mesh(coneGeo, lensCore), cx, cy, zr + .4); cn.rotation.x = -Math.PI/2;
        add(f, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .2, 12), die)), cx, cy, zr - .5); } }
  }

  // ---------------------------------------------------------------- clear wraparound window, flush, with rounded corners and a smoky cut edge all round
  { const chainAt = (d, y) => {                               // the front + wing part of the outline (right wing end -> left wing end)
      const P = outline(d, y), B = nC + nE, out = [], ring = P.concat(P);
      const start = 3*B + nC + 1, end = 6*B - 1;
      for(let i=start;i<=end;i++) out.push(ring[i]);
      return out; };
    const sample = (C, u) => { const L = [0]; for(let i=1;i<C.length;i++) L.push(L[i-1] + Math.hypot(C[i][0]-C[i-1][0], C[i][1]-C[i-1][1]));
      const s = u*L[L.length-1]; let k = 1; while(k < L.length-1 && L[k] < s) k++; const f = (s - L[k-1])/(L[k]-L[k-1] || 1);
      return [C[k-1][0] + (C[k][0]-C[k-1][0])*f, C[k-1][1] + (C[k][1]-C[k-1][1])*f, L[L.length-1]]; };
    const Ltot = sample(chainAt(leanAt((wY0+wY1)/2), (wY0+wY1)/2), 1)[2], Rw = 6, K = 200;
    const yTopAt = s => wY0 + .2 - (s < Rw ? Rw - Math.sqrt(Rw*Rw - (Rw - s)**2) : 0);
    const glass = new THREE.MeshPhysicalMaterial({color:0xe9eef2, roughness:.04, metalness:0, transparent:true, opacity:.14, clearcoat:1, clearcoatRoughness:.02, specularIntensity:1, envMapIntensity:1.6, side:THREE.DoubleSide, depthWrite:false});
    const smoke = new THREE.MeshPhysicalMaterial({color:0x606366, roughness:.18, transparent:true, opacity:.85, clearcoat:.6, side:THREE.DoubleSide, depthWrite:false});
    // a sheet over the window region; rows(s) gives the y list for the column at arc length s from the nearest end
    const sheet = (rows, d, m, cols) => { const pos = [], idx = []; let R = 0;
      for(const u of cols){ const s = Math.min(u, 1-u)*Ltot, ys = rows(s); R = ys.length; for(const y of ys){ const [x, z] = sample(chainAt(leanAt(y) + d, y), u); pos.push(x, y, z); } }
      for(let c=0;c<cols.length-1;c++) for(let r=0;r<R-1;r++){ const a = c*R+r, b = a+1, cc = a+R, dd = cc+1; idx.push(a,cc,b, b,cc,dd); }
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals();
      return add(M, new THREE.Mesh(ge, m)); };
    const U = []; for(let i=0;i<=K;i++){ const v = i/K; U.push(.5 - .5*Math.cos(v*Math.PI)); }   // denser near the ends (rounded corners)
    const span = s => { const t = yTopAt(s), b = 2*((wY0+wY1)/2) - t; return [t, (t+b)/2, b]; };
    sheet(span, .12, glass, U).renderOrder = 2;
    const eW = 2.2/Ltot;                                      // smoky band: top + bottom borders, and the two vertical ends
    sheet(s => { const t = yTopAt(s); return [t, t - 2.2]; }, .07, smoke, U);
    sheet(s => { const b = 2*((wY0+wY1)/2) - yTopAt(s); return [b + 2.2, b]; }, .07, smoke, U);
    for(const [u0, u1] of [[0, eW], [1 - eW, 1]]){ const cols = []; for(let i=0;i<=6;i++) cols.push(u0 + (u1-u0)*i/6); sheet(span, .07, smoke, cols); }
  }

  // ---------------------------------------------------------------- grey screw panel on the bar's upper back (seen from behind / below),
  // and the two wall screws on the band's back (ocspot_back_1)
  { // bracket saddle: the band's foot wraps 2.5 mm thick over the bar's rounded upper back, down to y = -104 (detail_backbar)
    const sd = new THREE.Shape(), y0 = yT + 1, y1 = -107, n = 16, Ws = Wb + 8;   // a little wider than the band, blending round the bar
    for(let i=0;i<=n;i++){ const y = y0 + (y1-y0)*i/n; i ? sd.lineTo(zBack(y) - 2.5, y) : sd.moveTo(zBack(y) - 2.5, y); }
    for(let i=n;i>=0;i--){ const y = y0 + (y1-y0)*i/n; sd.lineTo(zBack(y) + .3, y); }
    const sm = ext(sd, Ws, 1.2, white); sm.geometry.rotateY(-Math.PI/2); sm.geometry.translate(Ws/2, 0, 0); M.add(sm); sm.castShadow = true; }
  { const yP = -99, th = .5, zP = zBack(yP) - 2.5;            // grey screw panel on the saddle's lower end
    const p = add(M, H.rslab(64, 18, 1.2, 3, .3, greyP), 0, yP + .3*Math.sin(th), zP - .3*Math.cos(th)); p.rotation.x = Math.PI + th;
    for(const sx of [-26, 26]) add(p, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, .3, 32), mat(0xd3d4d5,{r:.4}))), sx, 0, .65);
    const scr = mat(0xb9bbbd, {r:.35, m:.6});
    for(const sx of [-27, 27]){ const sc = add(M, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .6, 24), scr)), sx, -56, -.2);
      for(const r of [0, Math.PI/2]){ const sl = add(M, new THREE.Mesh(new THREE.BoxGeometry(2.6, .45, .2), mat(0x55585b,{r:.6})), sx, -56, -.55); sl.rotation.z = r; } } }
  return g;
};
