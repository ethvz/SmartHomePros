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
  const glassK = new THREE.MeshPhysicalMaterial({color:0x050506, roughness:.05, clearcoat:1, clearcoatRoughness:.02, specularIntensity:1});
  const satinK = new THREE.MeshPhysicalMaterial({color:0x151516, roughness:.42, metalness:.15, clearcoat:.3, clearcoatRoughness:.35});
  const lensM = new THREE.MeshPhysicalMaterial({color:0x0a0c12, roughness:.03, metalness:.2, clearcoat:1, clearcoatRoughness:0, iridescence:.25, iridescenceIOR:1.5, iridescenceThicknessRange:[200,320]});
  const dimK = mat(0x1e1e1f, {r:.35});

  // ---------------------------------------------------------------- mount (engineering CAD), decoded exactly like the inline model
  const C = { x:0, y:21, zf:46, r:18.6 };                   // collar: CAD front face z = 46; radius/axis matched to the side photo (CAD nut r16.4 reads small)
  if(OCPM){
    const mountMat = mountW.clone(); mountMat.side = THREE.DoubleSide;
    // hairline parting groove at z = 7 mm (wall-plate layer / front shell): same white both sides, fine dark line
    const mountSplit = H.splitMat(mountMat, mountMat, 'z', .007, .0003, 0x8a8c8f); mountSplit.side = THREE.DoubleSide;
    const grl = grilleMat(0xc4c6c8, [5.2,3.6]); grl.side = THREE.DoubleSide;
    const Mt = [mountSplit, grl, mountMat];
    const cad = add(g, G());
    for(const p of OCPM.parts){
      const geo = new THREE.BufferGeometry();
      const P = new Int16Array(OCPM.buf, p.p, p.nv*3), pos = new Float32Array(p.nv*3);
      for(let i=0;i<pos.length;i++) pos[i] = P[i]*OCPM.s;
      geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(OCPM.buf, p.n, p.nv*3),3,true));
      geo.setIndex(new THREE.BufferAttribute(p.i32 ? new Uint32Array(OCPM.buf, p.i, p.ni) : new Uint16Array(OCPM.buf, p.i, p.ni),1));
      if(p.g===1){ const uv = new Float32Array(p.nv*2); for(let i=0;i<p.nv;i++){ uv[2*i]=(pos[3*i]+.0354)/.0708; uv[2*i+1]=(pos[3*i+1]+.0493)/.0475; } geo.setAttribute('uv', new THREE.BufferAttribute(uv,2)); }
      const m = new THREE.Mesh(geo, Mt[p.g]); m.castShadow = m.receiveShadow = true; cad.add(m);
      const k = OCPM.parts.indexOf(p);
      if(k === 0) m.visible = false;                         // the CAD's inner chassis: a tab of it pokes out below the shell
      if(p.g === 2) m.visible = false;                       // CAD collar: replaced by the dimpled locking collar below
    }
    add(g, H.rslab(.074, .097, .002, .008, .0006, mountW), 0, -.0005, .001);   // flat back plate closing the mount against the wall
  } else {                                                    // offline fallback: plain mount block of the CAD size
    add(M, H.rslab(77, 99, 29, 10, 4, mountW), 0, 0, 14.5);
    add(M, H.rslab(71, 42, 1, 7, .4, grilleMat(0xc4c6c8,[60,36])), 0, -28, 29.1);
  }
  // inner wall behind the speaker grille (the CAD's hidden chassis used to fill it): white, so the side opening is not see-through
  add(M, H.rslab(70.6, 46, 12.5, 4, 1, mountW), 0, -26, 7.5);
  // microphone pinhole on the +x side, just above the grille, near the 7 mm seam
  { const ph = add(M, new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .4, 16), dimK), 38.45, -3, 15); ph.rotation.z = Math.PI/2; }

  // ---------------------------------------------------------------- dimpled locking collar (white, golf-ball dimples, real step at the root)
  {
    const zRoot = 27, zA = 29.8, zB = 44.2, zF = C.zf, R = C.r, bore = 12.1;
    // lathe: plain root band, dark shadow groove, (textured band added separately), plain front band, R1.5 front edge, front face, bore
    const prof = [[R-.2, zRoot], [R, zRoot+.2], [R, 29.2], [R-.35, 29.35], [R-.35, 29.65], [R, zA]];
    const L1 = new THREE.LatheGeometry(prof.map(([r,z]) => new THREE.Vector2(r, z)), 96);
    const front = [[R, zB], [R, zF-1.5]]; for(let i=1;i<=6;i++){ const a = i/6*Math.PI/2; front.push([R-1.5+1.5*Math.cos(a), zF-1.5+1.5*Math.sin(a)]); }
    front.push([bore+.8, zF], [bore+.1, zF-.4], [bore, zF-1.2], [bore, zF-6]);
    const L2 = new THREE.LatheGeometry(front.map(([r,z]) => new THREE.Vector2(r, z)), 96);
    const colM = new THREE.MeshPhysicalMaterial({color:0xeeeff0, roughness:.6, sheen:.3, sheenRoughness:.8, sheenColor:0xffffff});
    for(const L of [L1, L2]){ const m = add(M, new THREE.Mesh(L, colM), C.x, C.y, 0); m.rotation.x = Math.PI/2; m.castShadow = true; }
    // the bore floor in shadow
    add(M, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(bore, bore, .2, 48), mat(0x6c6e70,{r:.8}))), C.x, C.y, zF-6);
    // dimpled band: 54 dimples round x 8 staggered rows at 1.8 pitch, as a bump + shade texture
    const N = 54, rows = 8, pxP = 20, Wc = N*pxP, Hc = Math.round(rows*1.8/(2*Math.PI*R/N)*pxP);
    const cv = document.createElement('canvas'); cv.width = Wc; cv.height = Hc; const x = cv.getContext('2d');
    const cv2 = document.createElement('canvas'); cv2.width = Wc; cv2.height = Hc; const x2 = cv2.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0,0,Wc,Hc); x2.fillStyle = '#fff'; x2.fillRect(0,0,Wc,Hc);
    const rowH = Hc/rows, rD = pxP*1.0/(2*Math.PI*R/N)/2;
    for(let r=0;r<rows;r++) for(let i=-1;i<=N;i++){
      const cx = (i + (r%2)*.5 + .25)*pxP, cy = (r+.5)*rowH;
      const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rD); gr.addColorStop(0,'#000'); gr.addColorStop(.55,'#555'); gr.addColorStop(1,'#fff');
      x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, rD, 0, Math.PI*2); x.fill();
      const g2 = x2.createRadialGradient(cx, cy-rD*.25, 0, cx, cy, rD); g2.addColorStop(0,'#d4d5d6'); g2.addColorStop(.7,'#e4e5e6'); g2.addColorStop(1,'#fff');
      x2.fillStyle = g2; x2.beginPath(); x2.arc(cx, cy, rD, 0, Math.PI*2); x2.fill();
    }
    const bt = new THREE.CanvasTexture(cv); bt.wrapS = THREE.RepeatWrapping; bt.anisotropy = 8;
    const ct = new THREE.CanvasTexture(cv2); ct.wrapS = THREE.RepeatWrapping; ct.colorSpace = THREE.SRGBColorSpace; ct.anisotropy = 8;
    const dimM = new THREE.MeshPhysicalMaterial({color:0xeeeff0, map:ct, bumpMap:bt, bumpScale:2.2, roughness:.62, sheen:.3, sheenRoughness:.8, sheenColor:0xffffff});
    const band = add(M, new THREE.Mesh(new THREE.CylinderGeometry(R, R, zB-zA, 216, 1, true), dimM), C.x, C.y, (zA+zB)/2);
    band.rotation.x = Math.PI/2; band.castShadow = true;
  }

  // ---------------------------------------------------------------- head shell (head-local mm: face at z = 0, +z out of the glass)
  const Zb = -43.5, Rt = 16, Rs = 17, Rbt = 22, Rc = 13.5;
  const hwS = z => 42 - .16*Math.max(0, -z-2);
  const yTs = z => 42 - .16*Math.max(0, -z-2);
  const yBs = z => -(42 - .12*Math.max(0, -z-2));
  const ins = (R, z) => z >= Zb+R ? 0 : R - Math.sqrt(Math.max(0, R*R - (z-(Zb+R))**2));
  const sec = z => { const s = ins(Rs, z), t = ins(Rt, z), b = ins(Rbt, z); return {z, hw: hwS(z)-s, yT: yTs(z)-t, yB: yBs(z)+b, r: Math.max(.6, Rc - s)}; };
  const nA = 10, nS = 32;
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
  rings.push(R_(-3, 37.3, 9.8), R_(-3, 37.3, 9.8), R_(-.02, 37.5, 10), R_(-.02, 37.5, 10), R_(0, 37.6, 10.1), R_(0, 40, 11.5));   // recess floor, lip, front flat
  for(let i=1;i<=6;i++){ const a = i/6*Math.PI/2; const hw = 40 + 2*Math.sin(a); rings.push(R_(-2 + 2*Math.cos(a), hw, 11.5 + 2*Math.sin(a))); }  // R2 front edge
  rings.push(sec(-2.5)); split = rings.length - 1;                                                 // flush black/white colour split
  const zs = new Set(); for(let z=-3.5; z>Zb+Rbt; z-=1.6) zs.add(+z.toFixed(3));
  for(const R of [Rt, Rs, Rbt]) for(let i=0;i<=24;i++){ const a = i/24*Math.PI/2; zs.add(+(Zb + R*Math.cos(a)).toFixed(3)); }
  [...zs].sort((a,b) => b-a).forEach(z => { if(z < -2.6 && z >= Zb) rings.push(sec(z)); });
  const last = sec(Zb), yc = (last.yT + last.yB)/2;
  for(let i=1;i<=16;i++){ const f = 1 - i/16*.985; rings.push({z:Zb, hw:last.hw*f, yT: yc + (last.yT-yc)*f, yB: yc + (last.yB-yc)*f, r: Math.max(.3, last.r*f)}); }
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
  // neck slot: a 16 mm stadium recessed 2 mm, running down the lower back and round the bottom-back curve
  const cyB = yBs(Zb+Rbt) + Rbt, czB = Zb + Rbt, slot = [];
  for(let y=-10; y>cyB; y-=.5) slot.push([y, Zb]);
  for(let i=0;i<=40;i++){ const a = i/40*1.15; slot.push([cyB - Rbt*Math.sin(a), czB - Rbt*Math.cos(a)]); }
  { const P = hg.attributes.position, Nn = hg.attributes.normal;
    for(let i=0;i<P.count;i++){ const x = P.getX(i), y = P.getY(i), z = P.getZ(i); if(Math.abs(x) > 9 || y > -8 || z > -14) continue;
      let dm = 1e9; for(let k=0;k<slot.length-1;k++){ const [ay, az] = slot[k], [by, bz] = slot[k+1], vy = by-ay, vz = bz-az;
        const t = Math.max(0, Math.min(1, ((y-ay)*vy + (z-az)*vz)/(vy*vy+vz*vz))); dm = Math.min(dm, Math.hypot(y-ay-vy*t, z-az-vz*t)); }
      const d = Math.hypot(x, dm); const w = d >= 8.4 ? 0 : d <= 7.4 ? 1 : (t => t*t*(3-2*t))((8.4-d)/1);
      if(w > 0){ P.setXYZ(i, x - Nn.getX(i)*2*w, y - Nn.getY(i)*2*w, z - Nn.getZ(i)*2*w); } }
    hg.computeVertexNormals(); }
  const head = G();
  const shell = add(head, new THREE.Mesh(hg, [bezelK, shellW])); shell.castShadow = shell.receiveShadow = true;

  // light ring (flush, 75 -> 70, R10/R7, hairline gaps) and the front glass (70 x 70 R7, holes for the lens and the light sensor)
  { const s = rrShape(74.7, 74.7, 9.85); s.holes.push(rrShape(70.3, 70.3, 7.15));
    add(head, ext(s, 1.2, .12, PM.ring), 0, 0, -1.3);
    const gs = rrShape(70, 70, 7), lh = new THREE.Path(); lh.absarc(0, -17, 9.62, 0, Math.PI*2, true); gs.holes.push(lh);
    const sh = new THREE.Path(); sh.absarc(0, -30.5, 1.7, 0, Math.PI*2, true); gs.holes.push(sh);
    add(head, ext(gs, 1.2, .15, glassK), 0, 0, -1.2); }
  // lens: satin barrel flush to +0.3 with a soft chamfer inward, blue-black glass recessed ~2 mm with a concentric inner ring
  { const pr = [[6.1,-2.6],[6.35,-2.2],[8.1,-.25],[8.7,.24],[9.25,.3],[9.55,.12],[9.6,-1.3]];
    const b = add(head, new THREE.Mesh(new THREE.LatheGeometry(pr.map(([r,z]) => new THREE.Vector2(r, z)), 72), satinK), 0, -17, 0); b.rotation.x = Math.PI/2;
    add(head, dome(6.3, 1.25, lensM), 0, -17, -2.4);
    add(head, H.torus(3.7, .16, mat(0x2c3038,{r:.25,m:.6})), 0, -17, -1.35);
    add(head, dome(2.1, .5, mat(0x0a0c12,{r:.05,m:.3,x:{clearcoat:1}})), 0, -17, -1.2); }
  // light / IR sensor (recessed 0.3), mic pinholes, wordmark
  add(head, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, .4, 32), mat(0x1e1e1f,{r:.4}))), 0, -30.5, -.5);
  add(head, H.torus(1.2, .14, mat(0x3a3b3d,{r:.3,m:.4})), 0, -30.5, -.3);
  add(head, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .2, 24), mat(0x2a2a2c,{r:.08,x:{clearcoat:1}}))), 0, -30.5, -.25);
  for(const sx of [-25.5, 25.5]) add(head, H.faceZ(new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .1, 16), mat(0x1c1c1d,{r:.7}))), sx, -28.5, .02);
  add(head, decal(DEC.logo, 26, 6.5, {color:0xd8d8d8, r:.45}), 0, 1.5-.43, .03);

  // ---------------------------------------------------------------- ball, neck and pose
  const B = V3(0, C.y, 48.5), rBall = 11.5, up = 15*Math.PI/180, tilt = 30*Math.PI/180;
  const aT = .62, Th = V3(0, cyB - Rbt*Math.sin(aT), czB - Rbt*Math.cos(aT));              // neck target on the slot floor (head-local)
  const nT = V3(0, -Math.sin(aT), -Math.cos(aT)); Th.addScaledVector(nT, -2);
  const u = V3(0, Math.sin(up), Math.cos(up)), Dn = rBall + 6 + 2, Tm = B.clone().addScaledVector(u, Dn);
  head.rotation.x = tilt; head.updateMatrix();
  const Gp = Tm.clone().sub(Th.clone().applyEuler(head.rotation));
  add(M, head, Gp.x, Gp.y, Gp.z);
  const ballM = new THREE.MeshPhysicalMaterial({color:0xeeeff0, roughness:.38, clearcoat:.25, clearcoatRoughness:.35, sheen:.3, sheenColor:0xffffff});
  add(M, new THREE.Mesh(new THREE.SphereGeometry(rBall, 48, 32), ballM), B.x, B.y, B.z).castShadow = true;
  { const L = Dn + 2.5, pr = [[.01,5.5],[9.75,5.5],[9.1,7.5],[8.4,8.7],[7.9,9.5],[7.6,10.2],[7.5,11],[7.5,L],[.01,L]];
    const nk = add(M, new THREE.Mesh(new THREE.LatheGeometry(pr.map(([r,y]) => new THREE.Vector2(r, y)), 56), ballM), B.x, B.y, B.z);
    nk.quaternion.setFromUnitVectors(V3(0,1,0), u); nk.castShadow = true; }
  g.userData.headPose = { ball: B.clone().multiplyScalar(.001), glass: Gp.clone().multiplyScalar(.001) };
  return g;
};
