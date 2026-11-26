// Outdoor Camera Pro (Gen 3). Wall-mounted: back on the wall at z = 0, face toward +z, origin = centre of the mount footprint.
// Mount = engineering CAD (H.OCPM), with a dimpled locking collar; ball + short neck into a recessed slot in the lower back of a
// shallow (42 mm) rounded-square head. Everything below is authored in millimetres inside a group scaled to metres.
export default H => {
  const { THREE, G, add, mat, PM, OCPM, DEC, decal, dome, ext, rrShape, grilleMat } = H;
  const g = G(), M = add(g, G()); M.scale.setScalar(.001);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------------------------------------------------------------- materials
  const shellW = new THREE.MeshPhysicalMaterial({color:0xeeeff0, roughness:.46, clearcoat:.18, clearcoatRoughness:.45, sheen:.35, sheenRoughness:.7, sheenColor:0xffffff});
  const mountW = new THREE.MeshPhysicalMaterial({color:0xecedee, roughness:.62, clearcoat:.08, clearcoatRoughness:.6, sheen:.3, sheenRoughness:.8, sheenColor:0xffffff});
  const bezelK = new THREE.MeshPhysicalMaterial({color:0x0b0b0c, roughness:.1, clearcoat:1, clearcoatRoughness:.04, specularIntensity:1});
  const glassK = new THREE.MeshPhysicalMaterial({color:0x000000, roughness:.03, specularIntensity:.32, specularColor:0x9a9a9a, envMapIntensity:1});   // near-black; F90 held down so it isn't pale at grazing angles
  const satinK = new THREE.MeshPhysicalMaterial({color:0x0e0e0f, roughness:.5, metalness:0, specularIntensity:.4, envMapIntensity:.15, side:THREE.DoubleSide});   // satin ring: rougher / duller than the glass
  const lensM = new THREE.MeshPhysicalMaterial({color:0x141a26, roughness:.03, metalness:.2, clearcoat:1, clearcoatRoughness:0, envMapIntensity:4, iridescence:.25, iridescenceIOR:1.5, iridescenceThicknessRange:[200,320]});
  const dimK = mat(0x1e1e1f, {r:.35});

  // ---------------------------------------------------------------- mount (engineering CAD), decoded exactly like the inline model
  const C = { x:0, y:21, zf:46, r:19.3 };                   // collar: CAD front face z = 46; Ø38.6 / axis from the side photos (CAD nut r16.4 reads small)
  const keepTris = (I, pos, keep) => { const out = []; for(let t=0;t<I.length;t+=3){ const a = I[t], b = I[t+1], c = I[t+2];
    if(keep(pos[3*a+2], pos[3*b+2], pos[3*c+2], a)) out.push(a, b, c); } return new Uint32Array(out); };
  const SX = 77/70.6;                                         // the CAD front shell (70.6 wide) reads ~9 % narrow against the photos: mount is 77
  if(OCPM){
    const mountMat = mountW.clone(); mountMat.side = THREE.DoubleSide;
    const grl = grilleMat(0xc4c6c8, [6.5,4.5]); grl.side = THREE.DoubleSide;
    const Mt = [mountMat, grl, mountMat];
    const cad = add(g, G());
    for(const p of OCPM.parts){
      const k = OCPM.parts.indexOf(p);
      if(k === 0 || k === 1 || p.g === 2) continue;          // inner chassis (its tab pokes out below), the wall-plate clip (stands proud at the top) and the CAD collar (replaced below)
      const geo = new THREE.BufferGeometry();
      const P = new Int16Array(OCPM.buf, p.p, p.nv*3), pos = new Float32Array(p.nv*3);
      for(let i=0;i<pos.length;i++) pos[i] = P[i]*OCPM.s;
      if(p.g === 1){ const Ng = new Int8Array(OCPM.buf, p.n, p.nv*3); for(let i=0;i<p.nv;i++){ pos[3*i] *= SX*.988;   // grille scaled with the shell, ~.5 inside its sides
        if(pos[3*i+2] < .016) pos[3*i+2] = .016; } }   // the grille starts 16 mm off the wall: clamp (no sawtooth); the white strip covers z 7-16
      if(p.g === 0) for(let i=0;i<p.nv;i++){                 // shell: one flush outline from the wall to the front, 77 wide
        let x = pos[3*i]*SX, y = pos[3*i+1], z = pos[3*i+2];
        if(z < .0128) x = Math.max(-.0385, Math.min(.0385, x));   // the CAD's wider back flange pulled in to the shell's 77 mm outline
        if(z < .020) y = Math.min(.0440, y);                        // one flat top end from the wall to the R10 front corner (no step at the seam)
        if(y > .036 && z > .021 && z < .04){ const dy = y - .036, dz = z - .021, L = Math.hypot(dy, dz); if(L > .010){ y = .036 + dy*.010/L; z = .021 + dz*.010/L; } }   // top-front corner R10
        pos[3*i] = x; pos[3*i+1] = y; pos[3*i+2] = z; }
      geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(OCPM.buf, p.n, p.nv*3),3,true));
      let I = p.i32 ? new Uint32Array(OCPM.buf, p.i, p.ni) : new Uint16Array(OCPM.buf, p.i, p.ni);
      const Nr0 = new Int8Array(OCPM.buf, p.n, p.nv*3);
      if(p.g !== 1) I = keepTris(I, pos, (a, b, c) => Math.max(a, b, c) > .0072);            // shell: drop the CAD wall-plate layer (z < 7), rebuilt flush below
      geo.setIndex(new THREE.BufferAttribute(I,1));
      if(p.g===1){ const uv = new Float32Array(p.nv*2), Nr = new Int8Array(OCPM.buf, p.n, p.nv*3);   // grille: project the hole pattern per face (front / sides / bottom) so the wrap keeps round holes
        for(let i=0;i<p.nv;i++){ const nx = Math.abs(Nr[3*i])/127, ny = Math.abs(Nr[3*i+1])/127;
          uv[2*i] = nx > .6 ? pos[3*i+2]/.0708 : (pos[3*i]+.0385)/.0770; uv[2*i+1] = ny > .6 ? pos[3*i+2]/.0475 : (pos[3*i+1]+.0493)/.0475; }
        geo.setAttribute('uv', new THREE.BufferAttribute(uv,2)); }
      const m = new THREE.Mesh(geo, Mt[p.g]); m.castShadow = m.receiveShadow = true; cad.add(m);
    }
  } else {                                                    // offline fallback: plain mount block of the CAD size
    add(M, H.rslab(77, 99, 29, 10, 4, mountW), 0, 0, 14.5);
    add(M, H.rslab(71, 42, 1, 7, .4, grilleMat(0xc4c6c8,[60,36])), 0, -28, 29.1);
  }
  // wall-plate layer (z 0 -> 7): a 3 mm rim with exactly the shell's outline (77 x 95.1, R10), rounded R1 at the wall, so plate and
  // shell are one flush surface with only the hairline parting line at z = 7; open toward the wall (the back cavity below)
  { const s = rrShape(77, 93.5, 10); s.holes.push(rrShape(71, 87.5, 7));
    const wp = add(M, ext(s, 6.85, 1, mountW), 0, -2.75, 0); g.userData.wallPlate = wp; }   // top y 44.0 = the shell's top end (clamped to match)
  // white shell sides/bottom between the 7 mm seam and the side grille (which starts 16 mm off the wall)
  { const s = H.rr4(77, 48, [3, 3, 10, 10], 0, -25.5); s.holes.push(H.rr4(74.6, 46.6, [1.8, 1.8, 8.8, 8.8], 0, -25.4));
    add(M, ext(s, 8.95, .3, mountW), 0, 0, 7.05);             // ends exactly at the grille's back edge (z 16)
    add(M, H.rslab(70, 1.6, 14, .6, .3, mountW), 0, -47.4, 15);       // liner inside the bottom rim (hides the grille's back faces)
    add(M, H.rslab(74, 2, 9, .8, .4, mountW), 0, -48.5, 11.5); }        // closes the mount's bottom end between z 7 and 16
  // back of the mount (open toward the wall, ocp_back_1 / detail_back): floor 15 mm in, thin centre plate (face 6 mm off the wall),
  // four tall U-shaped screw towers with real keyholes, channel walls, the brass insert tube standing 4 mm proud, cable slot
  { const inner = new THREE.MeshPhysicalMaterial({color:0xd6d7d8, roughness:.6, side:THREE.DoubleSide});
    const dark = mat(0x2e3032, {r:.85});
    add(M, H.rslab(74.5, 92.5, 1, 9, .3, inner), 0, -1.95, 15.5);                      // cavity floor
    const plateM = new THREE.MeshPhysicalMaterial({color:0xe7e8e9, roughness:.55, side:THREE.DoubleSide});
    add(M, H.rslab(42, 58, 2, 3, .5, plateM), 0, 11, 7);                               // centre plate, face at z = 6
    add(M, H.rslab(38, 54, 9, 3, .5, inner), 0, 11, 11.5);                             // its supports down to the floor
    const keyhole = (cx, cy) => { const p = new THREE.Path(), a0 = Math.atan2(-1.561, 1.25);
      p.moveTo(cx + 1.25, cy - 3.6); p.lineTo(cx + 1.25, cy - .061); p.absarc(cx, cy + 1.5, 2, a0, Math.PI - a0, false); p.lineTo(cx - 1.25, cy - 3.6); p.lineTo(cx + 1.25, cy - 3.6); return p; };
    for(const [bx, by] of [[-28, 30], [28, 26], [-28, -5], [28, -9]]){                // big U clips, 12 x 14, open to the rim
      const sg = Math.sign(bx), sh = H.rr4(12, 14, sg < 0 ? [6, 3, 3, 6] : [3, 6, 6, 3], bx + sg*1.5, by);
      sh.holes.push(keyhole(bx, by));
      add(M, ext(sh, 13.2, .6, inner), 0, 0, 2);                                      // tower: z 2 -> 15.2
      add(M, H.rslab(5, 8.5, .4, 1, .1, mat(0x6a6c6e, {r:.8})), bx, by, 4.2); }      // keyhole backing ~2 mm deep
    for(const rx of [-21.5, 21.5]) add(M, H.rslab(1.8, 58, 12, .8, .4, inner), rx, 10, 9.3);   // channel walls
    const brass = new THREE.MeshPhysicalMaterial({color:0xc9a866, roughness:.28, metalness:.9});
    const tube = new THREE.LatheGeometry([[2.2,0],[2.2,4],[2.6,4.5],[4.1,4.5],[4.5,4.1],[4.5,0]].map(([r,y]) => new THREE.Vector2(r, y)), 48);
    { const t = add(M, new THREE.Mesh(tube, brass), 0, 6, 6); t.rotation.x = -Math.PI/2; }   // brass tube OD 9, 4.5 mm proud of the plate
    add(M, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .1, 24), dark)), 0, 6, 4);
    { const sl = add(M, H.rslab(3.5, 9, .2, 1.75, .05, dark), -6, -6, 5.9); sl.rotation.z = Math.PI/2; } }
  // microphone pinhole on the +x side, just above the grille, near the 7 mm seam
  { const ph = add(M, new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .4, 16), dimK), 38.52, -3, 13); ph.rotation.z = Math.PI/2; }

  // ---------------------------------------------------------------- dimpled locking collar (white, golf-ball dimples, real step at the root)
  {
    const zRoot = 27, zA = 29, zB = 43.4, zF = C.zf, R = C.r, bore = 12.8;
    // lathe: plain root band, dark shadow groove, (textured band added separately), plain front band, R1.5 front edge, front face, bore
    const prof = [[R-.2, zRoot], [R, zRoot+.2], [R, 28.4], [R-.35, 28.55], [R-.35, 28.85], [R, zA]];
    const L1 = new THREE.LatheGeometry(prof.map(([r,z]) => new THREE.Vector2(r, z)), 96);
    const front = [[R, zB], [R, zF-2.5]]; for(let i=1;i<=8;i++){ const a = i/8*Math.PI/2; front.push([R-2.5+2.5*Math.cos(a), zF-2.5+2.5*Math.sin(a)]); }
    front.push([bore+.8, zF], [bore+.1, zF-.4], [bore, zF-1.2], [bore, zF-6]);
    const L2 = new THREE.LatheGeometry(front.map(([r,z]) => new THREE.Vector2(r, z)), 96);
    const colM = new THREE.MeshPhysicalMaterial({color:0xeeeff0, roughness:.6, sheen:.3, sheenRoughness:.8, sheenColor:0xffffff});
    for(const L of [L1, L2]){ const m = add(M, new THREE.Mesh(L, colM), C.x, C.y, 0); m.rotation.x = Math.PI/2; m.castShadow = true; }
    // the bore floor in shadow
    add(M, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(bore, bore, .2, 48), mat(0x6c6e70,{r:.8}))), C.x, C.y, zF-6);
    // dimpled band: 54 dimples round x 8 staggered rows at 1.8 pitch, as a bump + shade texture
    const N = 54, rows = 9, pxP = 20, Wc = N*pxP, Hc = Math.round(rows*1.6/(2*Math.PI*R/N)*pxP);
    const cv = document.createElement('canvas'); cv.width = Wc; cv.height = Hc; const x = cv.getContext('2d');
    const cv2 = document.createElement('canvas'); cv2.width = Wc; cv2.height = Hc; const x2 = cv2.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0,0,Wc,Hc); x2.fillStyle = '#fff'; x2.fillRect(0,0,Wc,Hc);
    const rowH = Hc/rows, rD = pxP*1.2/(2*Math.PI*R/N)/2;
    for(let r=0;r<rows;r++) for(let i=-1;i<=N;i++){
      const cx = (i + (r%2)*.5 + .25)*pxP, cy = (r+.5)*rowH;
      const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rD); gr.addColorStop(0,'#000'); gr.addColorStop(.55,'#555'); gr.addColorStop(1,'#fff');
      x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, rD, 0, Math.PI*2); x.fill();
      const g2 = x2.createRadialGradient(cx, cy-rD*.25, 0, cx, cy, rD); g2.addColorStop(0,'#b9bbbd'); g2.addColorStop(.6,'#cfd1d3'); g2.addColorStop(1,'#fff');
      x2.fillStyle = g2; x2.beginPath(); x2.arc(cx, cy, rD, 0, Math.PI*2); x2.fill();
    }
    const bt = new THREE.CanvasTexture(cv); bt.wrapS = THREE.RepeatWrapping; bt.anisotropy = 8;
    const ct = new THREE.CanvasTexture(cv2); ct.wrapS = THREE.RepeatWrapping; ct.colorSpace = THREE.SRGBColorSpace; ct.anisotropy = 8;
    const dimM = new THREE.MeshPhysicalMaterial({color:0xeeeff0, map:ct, bumpMap:bt, bumpScale:2.2, roughness:.62, sheen:.3, sheenRoughness:.8, sheenColor:0xffffff});
    const band = add(M, new THREE.Mesh(new THREE.CylinderGeometry(R, R, zB-zA, 216, 1, true), dimM), C.x, C.y, (zA+zB)/2);
    band.rotation.x = Math.PI/2; band.castShadow = true;
  }

  // ---------------------------------------------------------------- head shell (head-local mm: face at z = 0, +z out of the glass)
  const Zb = -43.5, Rt = 16, Rs = 17, Rbt = 22, Rc = 17;   // plan corner R17: the corner close-up reads rounder than the R13 spec
  const hwS = z => 42 - .16*Math.max(0, -z-2);
  const yTs = z => 42 - .16*Math.max(0, -z-2);
  const yBs = z => -(42 - .12*Math.max(0, -z-2));
  const ins = (R, z) => z >= Zb+R ? 0 : R - Math.sqrt(Math.max(0, R*R - (z-(Zb+R))**2));
  const sec = z => { const s = ins(Rs, z), t = ins(Rt, z), b = ins(Rbt, z); return {z, hw: hwS(z)-s, yT: yTs(z)-t, yB: yBs(z)+b, r: Math.max(.6, Rc - s)}; };
  const nA = 16, nS = 32;
  const ringPts = ({z, hw, yT, yB, r}) => {           // rounded rect, fixed topology: 4 x (arc nA + side nS) points, CCW from +x
    const cy = (yT+yB)/2, w2 = hw, h2 = (yT-yB)/2; r = Math.min(r, w2-.01, h2-.01);
    const cs = [[w2-r, h2-r], [-(w2-r), h2-r], [-(w2-r), -(h2-r)], [w2-r, -(h2-r)]], P = [];
    for(let k=0;k<4;k++){ const [ax, ay] = cs[k], [bx, by] = cs[(k+1)%4], a0 = k*Math.PI/2;
      for(let i=0;i<nA;i++){ const a = a0 + i/nA*Math.PI/2; P.push([ax + r*Math.cos(a), cy + ay + r*Math.sin(a), z]); }
      const a1 = a0 + Math.PI/2, sx = ax + r*Math.cos(a1), sy = ay + r*Math.sin(a1), ex = bx + r*Math.cos(a1), ey = by + r*Math.sin(a1);
      for(let i=0;i<nS;i++){ const t = i/nS; P.push([sx + (ex-sx)*t, cy + sy + (ey-sy)*t, z]); } }
    return P; };
  const rings = []; let split = 0;
  const R_ = (z, hw, r) => ({z, hw, yT: hw, yB: -hw, r});
  rings.push(R_(-3, 37.3, 13.8), R_(-3, 37.3, 13.8), R_(-.02, 37.5, 14), R_(-.02, 37.5, 14), R_(0, 37.6, 14.1), R_(0, 40, 15));   // recess floor, lip, front flat
  for(let i=1;i<=6;i++){ const a = i/6*Math.PI/2; const hw = 40 + 2*Math.sin(a); rings.push(R_(-2 + 2*Math.cos(a), hw, 15 + 2*Math.sin(a))); }  // R2 front edge
  rings.push(sec(-2.5)); split = rings.length - 1;                                                 // flush black/white colour split
  const zs = new Set(); for(let z=-3.5; z>Zb+Rbt; z-=1.6) zs.add(+z.toFixed(3));
  for(const R of [Rt, Rs, Rbt]) for(let i=0;i<=60;i++){ const a = i/60*Math.PI/2; zs.add(+(Zb + R*Math.cos(a)).toFixed(3)); }
  [...zs].sort((a,b) => b-a).forEach(z => { if(z < -2.6 && z >= Zb) rings.push(sec(z)); });
  const last = sec(Zb), yc = (last.yT + last.yB)/2;
  for(let i=1;i<=40;i++){ const f = 1 - i/40*.985; rings.push({z:Zb, hw:last.hw*f, yT: yc + (last.yT-yc)*f, yB: yc + (last.yB-yc)*f, r: Math.max(.3, last.r*f)}); }
  const NP = 4*(nA+nS), pos = [];
  for(const r of rings) for(const p of ringPts(r)) pos.push(...p);
  const capF = pos.length/3; pos.push(0, 0, -3);
  const capB = pos.length/3; pos.push(0, yc, Zb);
  const idxK = [], idxW = [];
  for(let r=0;r<rings.length-1;r++) for(let i=0;i<NP;i++){ const a = r*NP+i, b = r*NP+(i+1)%NP, c = a+NP, d = b+NP; (r < split ? idxK : idxW).push(a,c,b, b,c,d); }
  for(let i=0;i<NP;i++){ idxK.push(capF, i, (i+1)%NP); const o = (rings.length-1)*NP; idxW.push(capB, o+(i+1)%NP, o+i); }
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hg.setIndex([...idxK, ...idxW]); hg.addGroup(0, idxK.length, 0); hg.addGroup(idxK.length, idxW.length, 1);
  hg.computeVertexNormals();
  const cyB = yBs(Zb+Rbt) + Rbt, czB = Zb + Rbt;
  const head = G();
  const shell = add(head, new THREE.Mesh(hg, [bezelK, shellW])); shell.castShadow = shell.receiveShadow = true;


  // light ring (flush, 75 -> 70, R10/R7, hairline gaps) and the front glass (70 x 70 R7, holes for the lens and the light sensor)
  { const s = rrShape(74.7, 74.7, 13.85); s.holes.push(rrShape(70.3, 70.3, 11.15));
    add(head, ext(s, 1.2, .12, PM.ring), 0, 0, -1.3);
    const gs = rrShape(70, 70, 11), lh = new THREE.Path(); lh.absarc(0, -17, 9.84, 0, Math.PI*2, true); gs.holes.push(lh);
    const sh = new THREE.Path(); sh.absarc(0, -30.5, 1.7, 0, Math.PI*2, true); gs.holes.push(sh);
    add(head, ext(gs, 1.2, .15, glassK), 0, 0, -1.2); }
  // lens: satin barrel flush to +0.3 with a soft chamfer inward, blue-black glass recessed ~2 mm with a concentric inner ring
  { const pr = [[6.2,-2.6],[6.4,-2],[9.3,.25],[9.55,.3],[9.75,.15],[9.82,-1.3]];   // lens bezel Ø19.6 with a straight conical chamfer down to the lens (detail_lens)
    const b = add(head, new THREE.Mesh(new THREE.LatheGeometry(pr.map(([r,z]) => new THREE.Vector2(r, z)), 72), satinK), 0, -17, 0); b.rotation.x = Math.PI/2;
    add(head, dome(6.2, 2.6, lensM), 0, -17, -2.9);   // one big glossy blue-black lens dome
  }
  // light / IR sensor (recessed 0.3), mic pinholes, wordmark
  add(head, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, .4, 32), mat(0x1e1e1f,{r:.4}))), 0, -30.5, -.5);
  add(head, H.torus(1.2, .14, mat(0x3a3b3d,{r:.3,m:.4})), 0, -30.5, -.3);
  add(head, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .2, 24), mat(0x2a2a2c,{r:.08,x:{clearcoat:1}}))), 0, -30.5, -.25);
  for(const sx of [-25.5, 25.5]) add(head, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .1, 16), mat(0x1c1c1d,{r:.7}))), sx, -28.5, .02);
  add(head, decal(DEC.logo, 27, 6.75, {color:0xe6e6e6, r:.45}), 0, -.6-.45, .03);   // wordmark ~16 mm above the lens centre (between detail_lens and front_1)

  // ---------------------------------------------------------------- ball, neck and pose
  const B = V3(0, C.y, 49.5), rBall = 12.2, up = 15*Math.PI/180, tilt = +(new URLSearchParams(location.search).get('ocppitch') || 30)*Math.PI/180;   // studio-only ?ocppitch= to match posed photos
  const aT = .62, Th = V3(0, cyB - Rbt*Math.sin(aT), czB - Rbt*Math.cos(aT));              // neck target on the slot floor (head-local)
  const nT = V3(0, -Math.sin(aT), -Math.cos(aT)); Th.addScaledVector(nT, -2);
  const u = V3(0, Math.sin(up), Math.cos(up)), Dn = rBall + 8 + 2, Tm = B.clone().addScaledVector(u, Dn);
  head.rotation.x = tilt; head.updateMatrix();
  const Gp = Tm.clone().sub(Th.clone().applyEuler(head.rotation));
  // the head + neck swivel on the ball: a pivot at the ball centre (studio-only ?ocpyaw=deg turns it, to match photos with a turned head)
  const piv = add(M, G(), B.x, B.y, B.z), qy = +(new URLSearchParams(location.search).get('ocpyaw') || 0);
  piv.rotation.y = qy*Math.PI/180;
  add(piv, head, Gp.x - B.x, Gp.y - B.y, Gp.z - B.z);
  // the neck runs straight out of the ball along the collar axis (detail_sidejoint, side_2) into the slot on the head's
  // lower back: find where that line meets the head shell, then sink the neck 2 mm into the slot
  const hInv = new THREE.Quaternion().setFromEuler(head.rotation).invert(), toHead = P => P.clone().sub(Gp).applyQuaternion(hInv);
  let tHit = 30; for(let t = 0; t < 60; t += .1){ const h = toHead(B.clone().add(V3(0, 0, t))); if(h.z <= 0 && h.z >= Zb && h.y >= sec(h.z).yB){ tHit = t; break; } }
  const Ln = tHit + 2, hitH = toHead(B.clone().add(V3(0, 0, tHit)));
  { // funnel: the head's lower back flows into the neck with a concave blend (no slot edge, no pad): shell vertices near the
    // neck axis are pulled back along it, 3 mm at the neck, easing (smoothstep) to nothing 13 mm out
    const Ah = toHead(B), dh = V3(0, 0, 1).applyQuaternion(hInv), Pp = hg.attributes.position, w = V3(0, 0, 0);
    for(let i=0;i<Pp.count;i++){ w.set(Pp.getX(i), Pp.getY(i), Pp.getZ(i)).sub(Ah); const t = w.dot(dh);
      if(t <= 0 || t > tHit + 14) continue; const r = w.clone().addScaledVector(dh, -t).length(); if(r >= 13) continue;
      const u = Math.max(0, (r - 8)/5), k = 3*(1 - u*u*(3 - 2*u));
      Pp.setXYZ(i, Pp.getX(i) - dh.x*k, Pp.getY(i) - dh.y*k, Pp.getZ(i) - dh.z*k); }
    hg.computeVertexNormals(); }
  const ballM = new THREE.MeshPhysicalMaterial({color:0xeeeff0, roughness:.38, clearcoat:.25, clearcoatRoughness:.35, sheen:.3, sheenColor:0xffffff});
  add(M, new THREE.Mesh(new THREE.SphereGeometry(rBall, 48, 32), ballM), B.x, B.y, B.z).castShadow = true;
  { const L = Ln + .5, pr = [[.01,7],[8,7],[8,L],[.01,L]];   // straight Ø16 neck, no flares
    const nk = add(piv, new THREE.Mesh(new THREE.LatheGeometry(pr.map(([r,y]) => new THREE.Vector2(r, y)), 56), ballM), 0, 0, 0);
    nk.quaternion.setFromUnitVectors(V3(0,1,0), V3(0,0,1)); nk.castShadow = true; }
  g.userData.headPose = { ball: B.clone().multiplyScalar(.001), glass: Gp.clone().multiplyScalar(.001) };
  return g;
};
