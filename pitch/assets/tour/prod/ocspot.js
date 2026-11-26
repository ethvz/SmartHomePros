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
  const zF = 93, yT = -85, yB = -152, lean = 13, leanW = 6, S = .12, wing = V2(.93, .37).normalize(), cW = wing.x*61 + wing.y*zF;   // centre face 122 at the top, wings ~68 deg to the wall
  const yc = (yT + yB)/2, ry = (yT - yB)/2;
  const zBack = y => 8 + 28*(1 - Math.sqrt(Math.max(0, 1 - ((y - yc)/ry)**2)));   // near-semicircular back
  const Wb = 77, Tb = 10, Ro = 30, Ri = Ro - Tb, tT = 4, zTg = 74, yTop = -46.2;   // band starts just inside the mount's rim (no notch)

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
    const j = ext(s, Wb, 3, white);
    j.geometry.rotateY(-Math.PI/2); j.geometry.translate(Wb/2, 0, 0); M.add(j); j.castShadow = j.receiveShadow = true;
    add(M, H.rslab(Wb, 14, 7, 3, 1, white), 0, -49.5 - 4, 3.5);   // transition block under the mount: R1 wall-side edges like the plate, so no notch where band and mount meet
    { const f7 = new THREE.Shape(), r7 = 7; f7.moveTo(Tb - .5, -49.4); f7.lineTo(Tb + r7, -49.4);   // R7 concave fillet: band front meets the mount's bottom end
      for(let k=1;k<=10;k++){ const a = Math.PI/2*k/10; f7.lineTo(Tb + r7 - r7*Math.sin(a), -49.4 - r7 + r7*Math.cos(a)); }
      f7.lineTo(Tb - .5, -49.4 - r7); f7.lineTo(Tb - .5, -49.4);
      const fm7 = ext(f7, Wb, 1, white); fm7.geometry.rotateY(-Math.PI/2); fm7.geometry.translate(Wb/2, 0, 0); M.add(fm7); }
    // thin tongue lying on the sloped bar top: plan rounded rectangle, R10 front corners, 4 mm thick (a real step), to z = 74
    const t = ext(rr4(Wb, zTg - Ro + 2, [10, 10, 0, 0], 0, (zTg + Ro - 2)/2), tT, 1.2, white);
    t.geometry.rotateX(Math.PI/2); t.geometry.translate(0, yT + tT, 0);
    { const Pt = t.geometry.attributes.position;                // taper: 4 mm thick, thinning to 2 mm over the last 15 mm
      for(let i=0;i<Pt.count;i++){ const z = Pt.getZ(i); if(z > zTg - 15){ const f = 1 - .5*(z - (zTg - 15))/15; Pt.setY(i, yT + (Pt.getY(i) - yT)*f); } }
      t.geometry.computeVertexNormals(); }
    SG.add(t); t.castShadow = t.receiveShadow = true;
    // true R10 fillet (rolling ball) where the outer bend meets the saddle on the bar's back: no ledge or fin from behind
    { const Cb = V2(Ro, yTg + Ro), rf = 10, sad = yu => { const z = zBack(yu) - 2.5; return V2(z, yu - S*(z - 20)); };
      let best = null;
      for(let yu = yT + 1; yu > -112; yu -= .05){ const P = sad(yu), Q = sad(yu - .05), T = Q.clone().sub(P).normalize(); let N = V2(-T.y, T.x); if(N.x > 0) N.negate();
        const Fc = P.clone().addScaledVector(N, rf); if(Fc.distanceTo(Cb) >= Ro + rf){ best = {P, Fc}; } else if(best) break; }
      let Pc = null; for(let th = Math.PI; th < 1.5*Math.PI; th += .002){ const b = V2(Ro + Ro*Math.cos(th), yTg + Ro + Ro*Math.sin(th)), yu = b.y + S*(b.x - 20); if(b.x >= zBack(yu) - 2.5){ Pc = b; break; } }
      if(best && Pc){ const { P, Fc } = best, T1 = Cb.clone().add(Fc.clone().sub(Cb).multiplyScalar(Ro/(Ro + rf)));
        let a0 = Math.atan2(P.y - Fc.y, P.x - Fc.x), a1 = Math.atan2(T1.y - Fc.y, T1.x - Fc.x); while(a1 - a0 > Math.PI) a1 -= 2*Math.PI; while(a0 - a1 > Math.PI) a1 += 2*Math.PI;
        const fs = new THREE.Shape(); fs.moveTo(T1.x, T1.y); fs.lineTo(Pc.x + .3, Pc.y + .3); fs.lineTo(P.x, P.y);
        for(let k=1;k<=16;k++){ const a = a0 + (a1 - a0)*k/16; fs.lineTo(Fc.x + rf*Math.cos(a), Fc.y + rf*Math.sin(a)); }
        const fm = ext(fs, Wb, .8, white); fm.geometry.rotateY(-Math.PI/2); fm.geometry.translate(Wb/2, 0, 0); M.add(fm); } }
  }

  // ---------------------------------------------------------------- light bar housing
  const lines = (d, y) => [ [wing.x, wing.y, cW - d[1]], [0, 1, zF - d[0]], [-wing.x, wing.y, cW - d[1]], [0, -1, -zBack(y)] ];   // d = [centre inset, wing inset]   // CCW by normal angle
  const RC = [8, 8, 9, 9];                                  // front corners R8, rounded wing/back ends
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
  const recessW = i => { if(i < 2*B) { if(i >= B + nC + 1){ const j = i - (B + nC + 1); return sm((nE - 3 - j)/5); } return 1; }
    if(i >= 3*B + nC + 1){ const j = i - (3*B + nC + 1); return sm((j - 1)/5); } return 0; };
  const LA = (y, e = 0) => { const t = (yT - y)/(yT - yB); return [lean*t + e, leanW*t + e]; };   // insets [centre, wing] at height y
  const dGlass = .6, dPlate = 1.6, band = 3.9;                 // window 0.6 under the lip, reflector face 1 mm behind it, housing behind the plates
  const wY0 = yT - 4.5, wY1 = yB + 4.5;
  const levels = [];                                          // [y, extra inset, recessed band?]
  for(let i=0;i<=8;i++){ const a = i/8*Math.PI/2; levels.push([yT - 4 + 4*Math.cos(a), 4 - 4*Math.sin(a), 0]); }      // top edge R4
  levels.push([wY0 + .3, 0, 0], [wY0 + .15, .3, 0], [wY0, band, 1]);
  for(let y = wY0 - 4; y > wY1 + 1; y -= 4) levels.push([y, band, 1]);
  levels.push([wY1, band, 1], [wY1 - .15, .3, 0], [wY1 - .3, 0, 0]);
  for(let i=0;i<=8;i++){ const a = i/8*Math.PI/2; levels.push([yB + 4 - 4*Math.sin(a), 4 - 4*Math.cos(a), 0]); }      // bottom edge R4
  const pos = [], idxA = [], idxB = [];
  for(const [y, d, f] of levels){ const P0 = outline(LA(y), y), P1 = outline(LA(y, d), y);
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
  const lensM = new THREE.MeshPhysicalMaterial({color:0x9aa0a6, roughness:.03, metalness:.05, clearcoat:1, clearcoatRoughness:.02, transparent:true, opacity:.35, specularIntensity:1, envMapIntensity:2.5, depthWrite:false});   // clear grey glass
  const coreM = new THREE.MeshPhysicalMaterial({color:0x24272a, roughness:.08, metalness:.3, flatShading:true, clearcoat:1});
  const die = mat(0xefe9da, {r:.4, x:{emissive:0x2a2822}});
  const domeGeo = new THREE.SphereGeometry(5.1, 40, 16, 0, Math.PI*2, 0, Math.PI/2); domeGeo.scale(1, .56, 1);
  const coneGeo = new THREE.ConeGeometry(3.8, 2.4, 8, 1, true);
  const wallM = new THREE.MeshPhysicalMaterial({vertexColors:true, roughness:.7});          // capsule walls shaded floor -> lip
  const sW = 32, fc = V2(61, zF), wd = V2(wing.y, -wing.x), faces = [
    { n: V2(0, 1), p: V2(0, zF), w: 108, cols: [-28, 0, 28], ln: lean },
    { n: V2(wing.x, wing.y), p: V2(fc.x + wd.x*sW, fc.y + wd.y*sW), w: 50, cols: [-18, 0, 18], ln: leanW },
    { n: V2(-wing.x, wing.y), p: V2(-fc.x - wd.x*sW, fc.y + wd.y*sW), w: 50, cols: [-18, 0, 18], ln: leanW } ];
  for(const F of faces){
    const slant = Math.hypot(yT - yB, F.ln), dv = V2(F.ln, yT - yB).normalize();
    const hW = (wY0 - wY1)*slant/(yT - yB) + 2, vMid = (yT - (wY0 + wY1)/2)/(yT - yB)*slant;
    const f = new THREE.Group(); SG.add(f);
    const t = new THREE.Vector3(F.n.y, 0, -F.n.x), nh = new THREE.Vector3(F.n.x, 0, F.n.y);
    const down = nh.clone().multiplyScalar(-dv.x).add(new THREE.Vector3(0, -dv.y, 0)).normalize();
    const up = down.clone().negate(), out = new THREE.Vector3().crossVectors(t, up).normalize();
    f.matrix.makeBasis(t, up, out); f.matrix.setPosition(new THREE.Vector3(F.p.x, yT, F.p.y).addScaledVector(down, vMid)); f.matrixAutoUpdate = false;
    const zp = -dPlate*dv.y, zfl = -band*dv.y;               // plate face, capsule floor (housing band) along the face normal
    const plate = new THREE.Shape(); { const w = F.w/2, h = hW/2; plate.moveTo(-w, -h); plate.lineTo(w, -h); plate.lineTo(w, h); plate.lineTo(-w, h); plate.lineTo(-w, -h); }
    for(const cx of F.cols){ const p = new THREE.Path(); p.absarc(cx, 12, 6.2, 0, Math.PI, false); p.absarc(cx, -12, 6.2, Math.PI, 2*Math.PI, false); p.closePath(); plate.holes.push(p); }
    const pg = new THREE.ExtrudeGeometry(plate, {depth:zp - zfl - 2*.5 + .2, bevelEnabled:true, bevelThickness:.5, bevelSize:.5, bevelOffset:-.5, bevelSegments:3, curveSegments:24});
    { const P = pg.attributes.position, col = new Float32Array(P.count*3), D = zp - zfl + .2, a = new THREE.Color(0x8f9396), b = new THREE.Color(0xe6e7e8), c = new THREE.Color();
      for(let i=0;i<P.count;i++){ c.copy(a).lerp(b, Math.max(0, Math.min(1, P.getZ(i)/D))); col[3*i] = c.r; col[3*i+1] = c.g; col[3*i+2] = c.b; }
      pg.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    const pm = add(f, new THREE.Mesh(pg, [refl, wallM]), 0, 0, zfl - .2); pm.receiveShadow = true;
    for(const cx of F.cols) for(const cy of [-12, 12]){
      const dmesh = add(f, new THREE.Mesh(domeGeo, lensM), cx, cy, zfl + .05); dmesh.rotation.x = Math.PI/2; dmesh.renderOrder = 1;
      add(f, new THREE.Mesh(coneGeo, coreM), cx, cy, zfl + 1.25).rotation.x = -Math.PI/2;
      add(f, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .2, 16), die)), cx, cy, zfl + .1); }
  }

  // ---------------------------------------------------------------- clear wraparound window: 0.6 under the lip, R10 corners, ends 4 mm before
  // each wing's round back end, 2 mm smoky cut edge all round
  { const chainAt = (d, y) => { const P = outline(d, y), ring = P.concat(P), out = [];
      for(let i = 3*B + nC + 1; i <= 6*B - 1; i++) out.push(ring[i]); return out; };   // right wing (from its back tangent) -> front -> left wing
    const sample = (C, u) => { const L = [0]; for(let i=1;i<C.length;i++) L.push(L[i-1] + Math.hypot(C[i][0]-C[i-1][0], C[i][1]-C[i-1][1]));
      const s = u*L[L.length-1]; let k = 1; while(k < L.length-1 && L[k] < s) k++; const fr = (s - L[k-1])/(L[k]-L[k-1] || 1);
      return [C[k-1][0] + (C[k][0]-C[k-1][0])*fr, C[k-1][1] + (C[k][1]-C[k-1][1])*fr, L[L.length-1]]; };
    const Lall = sample(chainAt(LA(yc), yc), 1)[2], Ltot = Lall - 8, Rw = 10, K = 220;   // window length fixed: its ends are vertical lines 7 mm before the wing ends at mid height
    const yTopAt = s => wY0 + .2 - (s < Rw ? Rw - Math.sqrt(Rw*Rw - (Rw - s)**2) : 0), yMid = (wY0 + wY1)/2;
    const glass = new THREE.MeshPhysicalMaterial({color:0xeef2f5, roughness:.03, metalness:0, transparent:true, opacity:.3, clearcoat:1, clearcoatRoughness:.02, specularIntensity:1, envMapIntensity:2.5, side:THREE.DoubleSide, depthWrite:false});
    const smoke = new THREE.MeshPhysicalMaterial({color:0x55585b, roughness:.15, clearcoat:.8, side:THREE.DoubleSide});
    const sheet = (rows, d, m, cols) => { const pos = [], idx = []; let R = 0;
      for(const v of cols){ const s = Math.min(v, 1 - v)*Ltot, ys = rows(s); R = ys.length;
        for(const y of ys){ const C = chainAt(LA(y, d), y), Ly = sample(C, 1)[2], u = .5 + (v - .5)*Ltot/Ly; const [x, z] = sample(C, u); pos.push(x, y, z); } }
      for(let c=0;c<cols.length-1;c++) for(let r=0;r<R-1;r++){ const a = c*R+r, b = a+1, cc = a+R, dd = cc+1; idx.push(a,cc,b, b,cc,dd); }
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals();
      const m2 = new THREE.Mesh(ge, m); SG.add(m2); return m2; };
    const U = []; for(let i=0;i<=K;i++){ const v = i/K; U.push(.5 - .5*Math.cos(v*Math.PI)); }
    const span = s => { const t = yTopAt(s), b = 2*yMid - t; return [t, (t + yMid)/2, yMid, (b + yMid)/2, b]; };
    sheet(span, dGlass, glass, U).renderOrder = 2;
    { // smoky cut edge: one closed 2 mm ribbon swept round the window outline (straight runs, R10 corners, vertical ends)
      const L2 = [], push = (a, y) => { const q = L2[L2.length - 1]; if(!q || Math.hypot(q[0] - a, q[1] - y) > 1e-3) L2.push([a, y]); };
      const Ks = 160, vv = i => .5 - .5*Math.cos(Math.PI*i/Ks), bot = s2 => 2*yMid - yTopAt(s2);
      for(let i=0;i<=Ks;i++){ const v = vv(i); push(v*Ltot, yTopAt(Math.min(v, 1 - v)*Ltot)); }      // top, left -> right
      { const t1 = yTopAt(0), b1 = bot(0); for(let k=1;k<8;k++) push(Ltot, t1 + (b1 - t1)*k/8); }    // right end, down
      for(let i=Ks;i>=0;i--){ const v = vv(i); push(v*Ltot, bot(Math.min(v, 1 - v)*Ltot)); }        // bottom, right -> left
      { const t1 = yTopAt(0), b1 = bot(0); for(let k=1;k<8;k++) push(0, b1 + (t1 - b1)*k/8); }       // left end, up
      const n2 = L2.length, map = (sa, y) => { const C = chainAt(LA(y, dGlass - .05), y), Ly = sample(C, 1)[2]; const [x, z] = sample(C, .5 + (sa/Ltot - .5)*Ltot/Ly); return [x, y, z]; };
      const pos = [], idx = [];
      for(let i=0;i<n2;i++){ const a = L2[(i - 1 + n2) % n2], b = L2[(i + 1) % n2], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
        const nx = ty/tl, ny = -tx/tl, P = L2[i];                                            // inward normal of the clockwise loop
        pos.push(...map(P[0], P[1]), ...map(P[0] + 2*nx, P[1] + 2*ny)); }
      for(let i=0;i<n2;i++){ const o = 2*i, o2 = 2*((i + 1) % n2); idx.push(o, o2, o + 1, o2, o2 + 1, o + 1); }
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals();
      SG.add(new THREE.Mesh(ge, smoke)); }
  }

  // ---------------------------------------------------------------- saddle: the band's foot wraps 2.5 mm thick over the bar's rounded upper
  // back, a little wider than the band; recessed grey screw panel with two flush caps and a small slot below it (detail_backbar)
  { const Ws = 85, pT = -93.5, pB = -105.5, wP = 62, y0 = yT + 1, y1 = -110;
    const prof = (ya, yb, off) => { const sd = new THREE.Shape(), n = Math.max(4, Math.round((ya - yb)/1.2));
      for(let i=0;i<=n;i++){ const y = ya + (yb-ya)*i/n; i ? sd.lineTo(zBack(y) - off, y) : sd.moveTo(zBack(y) - off, y); }
      for(let i=n;i>=0;i--){ const y = ya + (yb-ya)*i/n; sd.lineTo(zBack(y) + .4, y); } return sd; };
    const piece = (sh, w, xc, m, b = 1.2) => { const e = ext(sh, w, b, m); e.geometry.rotateY(-Math.PI/2); e.geometry.translate(w/2 + xc, 0, 0); SG.add(e); e.castShadow = true; return e; };
    piece(prof(y0, pT, 2.5), Ws, 0, white, 2); piece(prof(pB, y1, 2.5), Ws, 0, white, 2);
    const sw = (Ws - wP)/2; for(const sg of [-1, 1]) piece(prof(pT, pB, 2.5), sw, sg*(wP/2 + sw/2), white, .8);
    piece(prof(pT + .2, pB - .2, 1.5), wP - .4, 0, mat(0xaeb1b4, {r:.55}), .4);              // grey screw panel, 1 mm below the saddle skin
    const yP = (pT + pB)/2, slope = (zBack(yP + .5) - zBack(yP - .5)), th = Math.atan2(-slope, 1);
    const pnl = new THREE.Group(); SG.add(pnl); pnl.position.set(0, yP, zBack(yP) - 1.5); pnl.rotation.x = Math.PI - th;   // +z of pnl = out of the saddle
    for(const sx of [-24, 24]) add(pnl, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(3, 3, .2, 32), mat(0xc3c6c8, {r:.45}))), sx, 0, .02);
    { const ys = -108, ths = Math.atan2(-(zBack(ys + .5) - zBack(ys - .5)), 1), q = new THREE.Group(); SG.add(q); q.position.set(0, ys, zBack(ys) - 2.5); q.rotation.x = Math.PI - ths;
      add(q, H.rslab(10, 1.5, .4, .7, .1, mat(0x2c2e30, {r:.8})), 0, 0, -.1); }            // small slot below the panel
    // two Phillips wall screws on the band's back
    const scr = mat(0xb9bbbd, {r:.35, m:.6});
    for(const sx of [-27, 27]){ add(M, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .6, 24), scr)), sx, -56, -.2);
      for(const r of [0, Math.PI/2]){ const sl = add(M, new THREE.Mesh(new THREE.BoxGeometry(2.6, .45, .2), mat(0x55585b,{r:.6})), sx, -56, -.55); sl.rotation.z = r; } }
  }
  return g;
};
