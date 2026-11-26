// Spotlight Pro (Gen 3): an ATTACHMENT for the Outdoor Camera Pro. The camera (mount, collar, ball, head) is the ocp model
// unchanged; the Spotlight's bracket continues the mount's wall plate down the wall as a band flush with the mount sides, bends
// forward (J) into a thin tongue lying on top of a trapezoid LED light bar. Wall at z = 0, face +z.
// Authored in millimetres inside a group scaled to metres; origin = centre of the camera mount footprint (as in ocp).
export default H => {
  const { THREE, G, add, mat, ext, rr4 } = H;
  const g = H.models.ocp();                                  // identical camera + mount
  const M = add(g, G()); M.scale.setScalar(.001);
  const V2 = (x, y) => new THREE.Vector2(x, y);

  const white = new THREE.MeshPhysicalMaterial({color:0xecedee, roughness:.6, clearcoat:.08, clearcoatRoughness:.6, sheen:.3, sheenRoughness:.8, sheenColor:0xffffff});
  const barW = new THREE.MeshPhysicalMaterial({color:0xeeeff0, roughness:.5, clearcoat:.15, clearcoatRoughness:.45, sheen:.3, sheenRoughness:.7, sheenColor:0xffffff});
  const refl = new THREE.MeshPhysicalMaterial({color:0xf3f3f4, roughness:.7, sheen:.2, sheenColor:0xffffff});
  const capWall = new THREE.MeshPhysicalMaterial({color:0x8f9396, roughness:.7});
  const capFloor = new THREE.MeshPhysicalMaterial({color:0xc9ccce, roughness:.75});

  // ---------------------------------------------------------------- light bar section / plan parameters
  // top at y = -85 (at z = 20) sloping down toward the front (the whole bar, tongue and saddle are sheared, slope S), bottom
  // y = -152, faces leaning back 13 mm toward the bottom, near-semicircular back (rearmost z = 8), big round wing/back corners
  const zF = 91, yT = -85, yB = -152, lean = 13, S = .12, wing = V2(66, 47).normalize(), cW = wing.x*50 + wing.y*zF;
  const yc = (yT + yB)/2, ry = (yT - yB)/2;
  const zBack = y => 8 + 26*(1 - Math.sqrt(Math.max(0, 1 - ((y - yc)/ry)**2)));
  const Wb = 76.2, Tb = 10, Ro = 30, Ri = Ro - Tb, tT = 4, zTg = 74, yTop = -40;

  // sheared group for everything that sits on / is the bar: y' = y - S*(z - 20)
  const SG = new THREE.Group(); M.add(SG); SG.matrixAutoUpdate = false;
  SG.matrix.set(1,0,0,0, 0,1,-S,20*S, 0,0,1,0, 0,0,0,1);

  // ---------------------------------------------------------------- bracket: vertical band (flush with the mount's 76.2 mm plate) + J bend
  const yTg = yT - S*(Ro - 20);                               // tongue underside where the bend meets it (sheared bar top)
  { const s = new THREE.Shape();                              // profile in (u = z, v = y)
    s.moveTo(0, yTop); s.lineTo(0, yTg + Ro);
    s.absarc(Ro, yTg + Ro, Ro, Math.PI, 1.5*Math.PI, false);
    s.lineTo(Ro + 6, yTg - S*6); s.lineTo(Ro + 6, yTg - S*6 + tT); s.lineTo(Ro, yTg + tT);
    s.absarc(Ro, yTg + tT + Ri, Ri, 1.5*Math.PI, Math.PI, true);
    s.lineTo(Tb, yTop); s.lineTo(0, yTop);
    const j = ext(s, Wb, 3, white); j.geometry.rotateY(-Math.PI/2); j.geometry.translate(Wb/2, 0, 0); M.add(j); j.castShadow = j.receiveShadow = true;
    // thin tongue lying on the sloped bar top: plan rounded rectangle, R10 front corners, 4 mm thick (a real step), to z = 74
    const t = ext(rr4(Wb, zTg - Ro + 2, [10, 10, 0, 0], 0, (zTg + Ro - 2)/2), tT, 1.2, white);
    t.geometry.rotateX(Math.PI/2); t.geometry.translate(0, yT + tT, 0); SG.add(t); t.castShadow = t.receiveShadow = true;
  }

  // ---------------------------------------------------------------- light bar housing
  const lines = (d, y) => [ [wing.x, wing.y, cW - d], [0, 1, zF - d], [-wing.x, wing.y, cW - d], [0, -1, -zBack(y)] ];   // CCW by normal angle
  const RC = [4, 4, 6, 6];                                    // front corners R4; the round end in side view comes from the semicircular back
  const nC = 10, nE = 14, B = nC + nE, NP = 4*B;
  const outline = (d, y) => {                                 // rounded convex polygon from half-planes n.p <= c, fixed topology
    const L = lines(d, y), P = [];
    const isect = (a, b) => { const det = a[0]*b[1] - a[1]*b[0]; return [(a[2]*b[1] - b[2]*a[1])/det, (a[0]*b[2] - b[0]*a[2])/det]; };
    const arcs = L.map((a, k) => { const b = L[(k+1)%4], R = RC[k], c = isect([a[0],a[1],a[2]-R], [b[0],b[1],b[2]-R]);
      let a0 = Math.atan2(a[1], a[0]), a1 = Math.atan2(b[1], b[0]); while(a1 < a0) a1 += 2*Math.PI; return {c, R, a0, a1}; });
    arcs.forEach((A, k) => { for(let i=0;i<=nC;i++){ const t = A.a0 + (A.a1-A.a0)*i/nC; P.push([A.c[0] + A.R*Math.cos(t), A.c[1] + A.R*Math.sin(t)]); }
      const Bk = arcs[(k+1)%4], e0 = P[P.length-1], e1 = [Bk.c[0] + Bk.R*Math.cos(Bk.a0), Bk.c[1] + Bk.R*Math.sin(Bk.a0)];
      for(let i=1;i<nE;i++) P.push([e0[0] + (e1[0]-e0[0])*i/nE, e0[1] + (e1[1]-e0[1])*i/nE]); });
    return P; };
  // how much of the window-band recess each outline point gets: full on the front and wings, fading out just behind the
  // window's rear ends, none round the back (so the rear ends stay one clean round surface)
  const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t*t*(3 - 2*t);
  const recessW = i => { if(i < 2*B) { if(i >= B + nC + 1){ const j = i - (B + nC + 1); return sm((nE - 3 - j)/2); } return 1; }
    if(i >= 3*B + nC + 1){ const j = i - (3*B + nC + 1); return sm((j - 1)/2); } return 0; };
  const leanAt = y => lean*(yT - y)/(yT - yB);
  const dGlass = .6, dPlate = 1.6, band = 3.9;                 // window 0.6 under the lip, reflector face 1 mm behind it, housing behind the plates
  const wY0 = yT - 3, wY1 = yB + 3;
  const levels = [];                                          // [y, extra inset, recessed band?]
  for(let i=0;i<=6;i++){ const a = i/6*Math.PI/2; levels.push([yT - 2 + 2*Math.cos(a), 2 - 2*Math.sin(a), 0]); }      // top edge R2
  levels.push([wY0 + .3, 0, 0], [wY0 + .15, .3, 0], [wY0, band, 1]);
  for(let y = wY0 - 4; y > wY1 + 1; y -= 4) levels.push([y, band, 1]);
  levels.push([wY1, band, 1], [wY1 - .15, .3, 0], [wY1 - .3, 0, 0]);
  for(let i=0;i<=8;i++){ const a = i/8*Math.PI/2; levels.push([yB + 4 - 4*Math.sin(a), 4 - 4*Math.cos(a), 0]); }      // bottom edge R4
  const pos = [], idxA = [], idxB = [];
  for(const [y, d, f] of levels){ const P0 = outline(leanAt(y), y), P1 = outline(leanAt(y) + d, y);
    for(let i=0;i<NP;i++){ const w = f ? recessW(i) : 1;
      const q = d ? [P0[i][0] + (P1[i][0]-P0[i][0])*(f ? w : 1), P0[i][1] + (P1[i][1]-P0[i][1])*(f ? w : 1)] : P0[i];
      pos.push(q[0], y, q[1]); } }
  for(let r=0;r<levels.length-1;r++){ const into = (levels[r][2] && levels[r+1][2]) ? idxB : idxA;
    for(let i=0;i<NP;i++){ const a = r*NP+i, b = r*NP+(i+1)%NP, c = a+NP, d = b+NP; into.push(a,b,c, b,d,c); } }
  const cT = pos.length/3; pos.push(0, yT, 55); const cB = pos.length/3; pos.push(0, yB, 50);
  const oB = (levels.length-1)*NP; for(let i=0;i<NP;i++){ idxA.push(cT, (i+1)%NP, i); idxA.push(cB, oB+i, oB+(i+1)%NP); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  bg.setIndex([...idxA, ...idxB]); bg.addGroup(0, idxA.length, 0); bg.addGroup(idxA.length, idxB.length, 1); bg.computeVertexNormals();
  const bar = new THREE.Mesh(bg, [barW, capFloor]); bar.castShadow = bar.receiveShadow = true; SG.add(bar);

  // ---------------------------------------------------------------- LED faces: white reflector plate 1 mm behind the window with 3 real
  // capsule recesses (2.5 deep, darker walls, grey floor) x 2 clear TIR domes with a faceted core
  const lensM = new THREE.MeshPhysicalMaterial({color:0xffffff, transmission:.9, ior:1.49, thickness:3, roughness:.02, clearcoat:1, clearcoatRoughness:.02, envMapIntensity:1.4});
  const coreM = new THREE.MeshPhysicalMaterial({color:0x55595d, roughness:.08, metalness:.3, flatShading:true, clearcoat:1});
  const die = mat(0xefe9da, {r:.4, x:{emissive:0x2a2822}});
  const domeGeo = new THREE.SphereGeometry(5.1, 40, 16, 0, Math.PI*2, 0, Math.PI/2); domeGeo.scale(1, .56, 1);
  const coneGeo = new THREE.ConeGeometry(3.2, 2.4, 8, 1, true);
  const slant = Math.hypot(yT - yB, lean), dv = V2(lean, yT - yB).normalize();
  const sW = 36, faces = [
    { n: V2(0, 1), p: V2(0, zF), w: 94, cols: [-28, 0, 28] },
    { n: V2(wing.x, wing.y), p: V2(50 + wing.y*sW, zF - wing.x*sW), w: 60, cols: [-18, 0, 18] },
    { n: V2(-wing.x, wing.y), p: V2(-50 - wing.y*sW, zF - wing.x*sW), w: 60, cols: [-18, 0, 18] } ];
  const hW = (wY0 - wY1)*slant/(yT - yB) + 2, vMid = (yT - (wY0 + wY1)/2)/(yT - yB)*slant;
  for(const F of faces){
    const f = new THREE.Group(); SG.add(f);
    const t = new THREE.Vector3(F.n.y, 0, -F.n.x), nh = new THREE.Vector3(F.n.x, 0, F.n.y);
    const down = nh.clone().multiplyScalar(-dv.x).add(new THREE.Vector3(0, -dv.y, 0)).normalize();
    const up = down.clone().negate(), out = new THREE.Vector3().crossVectors(t, up).normalize();
    f.matrix.makeBasis(t, up, out); f.matrix.setPosition(new THREE.Vector3(F.p.x, yT, F.p.y).addScaledVector(down, vMid)); f.matrixAutoUpdate = false;
    const zp = -dPlate*dv.y, zfl = -band*dv.y;               // plate face, capsule floor (housing band) along the face normal
    const plate = new THREE.Shape(); { const w = F.w/2, h = hW/2; plate.moveTo(-w, -h); plate.lineTo(w, -h); plate.lineTo(w, h); plate.lineTo(-w, h); plate.lineTo(-w, -h); }
    for(const cx of F.cols){ const p = new THREE.Path(); p.absarc(cx, 12, 6.2, 0, Math.PI, false); p.absarc(cx, -12, 6.2, Math.PI, 2*Math.PI, false); p.closePath(); plate.holes.push(p); }
    const pg = new THREE.ExtrudeGeometry(plate, {depth:zp - zfl - 2*.5 + .2, bevelEnabled:true, bevelThickness:.5, bevelSize:.5, bevelOffset:-.5, bevelSegments:3, curveSegments:24});
    const pm = add(f, new THREE.Mesh(pg, [refl, capWall]), 0, 0, zfl - .2); pm.receiveShadow = true;
    for(const cx of F.cols) for(const cy of [-12, 12]){
      add(f, new THREE.Mesh(domeGeo, lensM), cx, cy, zfl + .05).rotation.x = Math.PI/2;
      add(f, new THREE.Mesh(coneGeo, coreM), cx, cy, zfl + 1.25).rotation.x = -Math.PI/2;
      add(f, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .2, 16), die)), cx, cy, zfl + .1); }
  }

  // ---------------------------------------------------------------- clear wraparound window: 0.6 under the lip, R10 corners, ends 7 mm before
  // each wing's round back end, 2 mm smoky cut edge all round
  { const chainAt = (d, y) => { const P = outline(d, y), ring = P.concat(P), out = [];
      for(let i = 3*B + nC + 1; i <= 6*B - 1; i++) out.push(ring[i]); return out; };   // right wing (from its back tangent) -> front -> left wing
    const sample = (C, u) => { const L = [0]; for(let i=1;i<C.length;i++) L.push(L[i-1] + Math.hypot(C[i][0]-C[i-1][0], C[i][1]-C[i-1][1]));
      const s = u*L[L.length-1]; let k = 1; while(k < L.length-1 && L[k] < s) k++; const fr = (s - L[k-1])/(L[k]-L[k-1] || 1);
      return [C[k-1][0] + (C[k][0]-C[k-1][0])*fr, C[k-1][1] + (C[k][1]-C[k-1][1])*fr, L[L.length-1]]; };
    const Lall = sample(chainAt(leanAt(yc), yc), 1)[2], u0 = 7/Lall, Ltot = Lall*(1 - 2*u0), Rw = 10, K = 220;
    const yTopAt = s => wY0 + .2 - (s < Rw ? Rw - Math.sqrt(Rw*Rw - (Rw - s)**2) : 0), yMid = (wY0 + wY1)/2;
    const glass = new THREE.MeshPhysicalMaterial({color:0xeef2f5, roughness:.03, metalness:0, transparent:true, opacity:.3, clearcoat:1, clearcoatRoughness:.02, specularIntensity:1, envMapIntensity:2.5, side:THREE.DoubleSide, depthWrite:false});
    const smoke = new THREE.MeshPhysicalMaterial({color:0x6e7174, roughness:.15, transparent:true, opacity:.9, clearcoat:.8, side:THREE.DoubleSide, depthWrite:false});
    const sheet = (rows, d, m, cols) => { const pos = [], idx = []; let R = 0;
      for(const v of cols){ const u = u0 + v*(1 - 2*u0), s = Math.min(v, 1 - v)*Ltot, ys = rows(s); R = ys.length;
        for(const y of ys){ const [x, z] = sample(chainAt(leanAt(y) + d, y), u); pos.push(x, y, z); } }
      for(let c=0;c<cols.length-1;c++) for(let r=0;r<R-1;r++){ const a = c*R+r, b = a+1, cc = a+R, dd = cc+1; idx.push(a,cc,b, b,cc,dd); }
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals();
      const m2 = new THREE.Mesh(ge, m); SG.add(m2); return m2; };
    const U = []; for(let i=0;i<=K;i++){ const v = i/K; U.push(.5 - .5*Math.cos(v*Math.PI)); }
    const span = s => { const t = yTopAt(s), b = 2*yMid - t; return [t, (t + yMid)/2, yMid, (b + yMid)/2, b]; };
    sheet(span, dGlass, glass, U).renderOrder = 2;
    sheet(s => { const t = yTopAt(s); return [t, t - 2]; }, dGlass - .05, smoke, U);
    sheet(s => { const b = 2*yMid - yTopAt(s); return [b + 2, b]; }, dGlass - .05, smoke, U);
    const eW = 2/Ltot; for(const [v0, v1] of [[0, eW], [1 - eW, 1]]){ const cols = []; for(let i=0;i<=6;i++) cols.push(v0 + (v1 - v0)*i/6); sheet(span, dGlass - .05, smoke, cols); }
  }

  // ---------------------------------------------------------------- saddle: the band's foot wraps 2.5 mm thick over the bar's rounded upper
  // back, a little wider than the band; recessed grey screw panel with two flush caps and a small slot below it (detail_backbar)
  { const sd = new THREE.Shape(), y0 = yT + 1, y1 = -109, n = 18, Ws = Wb + 6;
    for(let i=0;i<=n;i++){ const y = y0 + (y1-y0)*i/n; i ? sd.lineTo(zBack(y) - 2.5, y) : sd.moveTo(zBack(y) - 2.5, y); }
    for(let i=n;i>=0;i--){ const y = y0 + (y1-y0)*i/n; sd.lineTo(zBack(y) + .4, y); }
    const sm2 = ext(sd, Ws, 1.2, white); sm2.geometry.rotateY(-Math.PI/2); sm2.geometry.translate(Ws/2, 0, 0); SG.add(sm2); sm2.castShadow = true;
    const yP = -99, slope = (zBack(yP + .5) - zBack(yP - .5)), th = Math.atan2(-slope, 1), zP = zBack(yP) - 2.5;
    const pnl = new THREE.Group(); SG.add(pnl); pnl.position.set(0, yP, zP); pnl.rotation.x = Math.PI - th;   // +z of pnl = out of the saddle (back/down)
    add(pnl, H.rslab(61.4, 15.4, .8, 3.6, .2, mat(0x6f7275, {r:.7})), 0, 0, .25);            // shadow groove round the panel
    add(pnl, H.rslab(60, 14, .8, 3, .2, mat(0xaeb1b4, {r:.55})), 0, 0, .33);                  // the grey panel, ~1 mm below the saddle skin
    for(const sx of [-24, 24]) add(pnl, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(3, 3, .2, 32), mat(0xc3c6c8, {r:.45}))), sx, 0, .74);
    add(pnl, H.rslab(10, 1.5, .4, .7, .1, mat(0x2c2e30, {r:.8})), 0, -11, .2);                 // small slot below the panel
    // two Phillips wall screws on the band's back
    const scr = mat(0xb9bbbd, {r:.35, m:.6});
    for(const sx of [-27, 27]){ add(M, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .6, 24), scr)), sx, -56, -.2);
      for(const r of [0, Math.PI/2]){ const sl = add(M, new THREE.Mesh(new THREE.BoxGeometry(2.6, .45, .2), mat(0x55585b,{r:.6})), sx, -56, -.55); sl.rotation.z = r; } }
  }
  return g;
};
