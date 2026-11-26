// therm: Vivint Smart Thermostat (Element). 114.3 x 114.3 x 22.9 mm, back on the wall at z = 0, face toward +z, centred.
// One squircle footprint (25 mm continuous-curvature corners) swept through a side profile: white rear housing with a 1.5 mm
// back roll, a 1.7 mm recessed grey parting groove, a soft-touch cover with a 3.5 mm front roll and a flat dead-front face.
// Display on, cooling: up/down chevrons, snowflake, 73 current / 75 set glowing through the face, faint wordmark, blue status
// light shining out of the bottom of the groove and washing the wall below. Real recessed pill button on the right side.
export default H => {
  const { THREE, G, add } = H;
  const k = .001, W = 114.3, D = 22.9;                         // modelled in mm, built in metres

  /* ---- outline: square with superellipse corners (corner box c, exponent p), CCW, extra points on the straight edges */
  function outline(w, h, c, p, brkY = [], brkX = [], n = 30){
    const P = [], hx = w/2, hy = h/2, push = (x, y) => { const q = P[P.length-1]; if(!q || Math.hypot(q[0]-x, q[1]-y) > 1e-6) P.push([x, y]); };
    const corner = (cx, cy, a0) => { for(let i=0;i<=n;i++){ const t = a0 + i/n*Math.PI/2, co = Math.cos(t), si = Math.sin(t);
      push(cx + c*Math.sign(co)*Math.abs(co)**(2/p), cy + c*Math.sign(si)*Math.abs(si)**(2/p)); } };
    const ys = [...brkY].sort((a,b)=>a-b), xs = [...brkX].sort((a,b)=>b-a);
    push(hx, -(hy-c)); for(const y of ys) if(Math.abs(y) < hy-c) push(hx, y);                 // right edge, going up
    corner(hx-c, hy-c, 0);
    for(const x of xs) if(Math.abs(x) < hx-c) push(x, hy);                                     // top edge, going left
    corner(-(hx-c), hy-c, Math.PI/2);
    for(const y of [...ys].reverse()) if(Math.abs(y) < hy-c) push(-hx, y);                     // left edge, going down
    corner(-(hx-c), -(hy-c), Math.PI);
    for(const x of [...xs].reverse()) if(Math.abs(x) < hx-c) push(x, -hy);                     // bottom edge, going right
    corner(hx-c, -(hy-c), 1.5*Math.PI);
    if(Math.hypot(P[0][0]-P[P.length-1][0], P[0][1]-P[P.length-1][1]) < 1e-6) P.pop();
    return P;
  }
  const normals = P => P.map((p, i) => { const a = P[(i-1+P.length)%P.length], b = P[(i+1)%P.length], tx = b[0]-a[0], ty = b[1]-a[1], L = Math.hypot(tx, ty); return [ty/L, -tx/L]; });
  /* sweep the outline through a side profile [[inset, z], ...] (mm) -> smooth shell; skip(mx,my,mz) leaves a window open */
  function sweep(P, prof, m, skip, colFn){
    const N = P.length, Nn = normals(P), pos = [], col = [], idx = [];
    for(const [ins, z] of prof) for(let i=0;i<N;i++){ const x = P[i][0]-Nn[i][0]*ins, y = P[i][1]-Nn[i][1]*ins; pos.push(x*k, y*k, z*k); if(colFn) col.push(...colFn(x, y, z)); }
    for(let j=0;j<prof.length-1;j++) for(let i=0;i<N;i++){ const i2 = (i+1)%N;
      if(skip){ const mx = (P[i][0]+P[i2][0])/2, my = (P[i][1]+P[i2][1])/2, mz = (prof[j][1]+prof[j+1][1])/2; if(skip(mx, my, mz)) continue; }
      const a = j*N+i, b = j*N+i2, c = (j+1)*N+i2, d = (j+1)*N+i; idx.push(a,b,d, b,c,d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if(colFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals(); const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; return x;
  }
  /* flat cap over the outline inset by `ins` at height z; front = faces +z */
  function cap(P, ins, z, m, front){
    const N = P.length, Nn = normals(P), pos = [0, 0, z*k], idx = [];
    for(let i=0;i<N;i++) pos.push((P[i][0]-Nn[i][0]*ins)*k, (P[i][1]-Nn[i][1]*ins)*k, z*k);
    for(let i=0;i<N;i++){ const a = 1+i, b = 1+(i+1)%N; front ? idx.push(0, a, b) : idx.push(0, b, a); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; return x;
  }
  const arc = (ins0, z0, ins1, z1, n, firstIns) => {             // convex quarter-round between two profile points; firstIns: leaves along the inset axis
    const out = []; for(let i=0;i<=n;i++){ const t = i/n*Math.PI/2, s = Math.sin(t), c = 1 - Math.cos(t);
      out.push(firstIns ? [ins0 + (ins1-ins0)*s, z0 + (z1-z0)*c] : [ins0 + (ins1-ins0)*c, z0 + (z1-z0)*s]); }
    return out; };
  const pill = (w, h, cx = 0, cy = 0, hole) => { const r = w/2, s = hole ? new THREE.Path() : new THREE.Shape(), e = h/2 - r;
    s.absarc(cx, cy+e, r, 0, Math.PI, false); s.absarc(cx, cy-e, r, Math.PI, 2*Math.PI, false); return s; };

  /* ---- materials */
  const cover = new THREE.MeshPhysicalMaterial({color:0xe0e0de, roughness:.78, sheen:.45, sheenRoughness:.85, sheenColor:0xffffff, clearcoat:.04, clearcoatRoughness:.6});
  const housing = new THREE.MeshPhysicalMaterial({color:0xdddddb, roughness:.56, clearcoat:.1, clearcoatRoughness:.5});
  const groove = new THREE.MeshStandardMaterial({color:0x7c7c7c, roughness:.65});
  const pocketM = housing.clone(); pocketM.side = THREE.DoubleSide;
  const hidden = new THREE.MeshBasicMaterial({visible:false});

  const g = G();
  const BX = [-48, -40, -32, -24, -16, -8, 0, 8, 16, 24, 32, 40, 48];          // extra points along the bottom for the light bar falloff
  const P = outline(W, W, 25, 2.9, [-9, 9], BX);

  /* ---- rear housing z 0 -> 14.2 (1.5 mm back roll), right-side window left open for the button pocket */
  const win = (mx, my, mz) => mx > W/2 - .01 && Math.abs(my) < 9 && mz > 3 && mz < 11;
  add(g, cap(P, 1.5, 0, housing, false));
  add(g, sweep(P, [...arc(1.5, 0, 0, 1.5, 6, true), [0, 3], [0, 11], [0, 13.95], [.07, 14.13], [.22, 14.2]], housing, win));
  /* ---- parting groove z 14.2 -> 15.9, 1.0 mm deep, grey */
  add(g, sweep(P, [[.22, 14.2], [1, 14.2]], groove));
  add(g, sweep(P, [[1, 14.2], [1, 15.9]], groove));
  add(g, sweep(P, [[1, 15.9], [.22, 15.9]], groove));
  /* ---- front cover z 15.9 -> 22.9, flush side wall, 3.5 mm soft front roll, flat face */
  add(g, sweep(P, [[.22, 15.9], [.07, 15.97], [0, 16.15], ...arc(0, 19.4, 3.5, D, 12)], cover));
  add(g, cap(P, 3.5, D, cover, true));

  /* ---- right-side button: pill 12 x 6 in a 0.7 mm shadow ring, cap recessed 0.4 mm with a soft domed face */
  { const b = G(); b.rotation.y = Math.PI/2; add(g, b, W/2*k, 0, 7*k);
    const patch = new THREE.Shape([[-4,-9],[4,-9],[4,9],[-4,9]].map(([x,y]) => new THREE.Vector2(x,y))); patch.holes.push(pill(7.6, 13.6, 0, 0, true));
    const pg = new THREE.ShapeGeometry(patch, 32); pg.scale(k,k,k); add(b, new THREE.Mesh(pg, housing)).receiveShadow = true;
    const wg = new THREE.ExtrudeGeometry(pill(7.6, 13.6), {depth:1.6, bevelEnabled:false, curveSegments:32}); wg.translate(0, 0, -1.6); wg.scale(k,k,k);
    add(b, new THREE.Mesh(wg, [hidden, pocketM]));
    const fg = new THREE.ShapeGeometry(pill(7.6, 13.6), 32); fg.scale(k,k,k); add(b, new THREE.Mesh(fg, new THREE.MeshStandardMaterial({color:0xa8a8a6, roughness:.7})), 0, 0, -1.6*k);
    const cb = .45, cg = new THREE.ExtrudeGeometry(pill(6, 12), {depth:1.2-2*cb, bevelEnabled:true, bevelThickness:cb, bevelSize:cb, bevelOffset:-cb, bevelSegments:6, curveSegments:32});
    cg.translate(0, 0, cb - 1.2 - .4); cg.scale(k,k,k); const cm = add(b, new THREE.Mesh(cg, housing)); cm.castShadow = cm.receiveShadow = true; }

  /* ---- lit display: glyphs glowing white through the dead-front face (10 px per mm, 100 mm square) */
  { const N = 1000, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
    const F = '"Vivint Sans", "Helvetica Neue", Helvetica, Arial, sans-serif', X = mm => N/2 + mm*10, Y = mm => N/2 - mm*10;
    const chev = (cy, up) => { const s = up ? 1 : -1; x.beginPath(); x.moveTo(X(-2.85), Y(cy - 1.4*s)); x.lineTo(X(0), Y(cy + 1.4*s)); x.lineTo(X(2.85), Y(cy - 1.4*s)); x.stroke(); };
    const flake = (cx, cy, r) => { for(let i=0;i<6;i++){ const a = Math.PI/2 + i*Math.PI/3, ca = Math.cos(a), sa = Math.sin(a);
        x.beginPath(); x.moveTo(X(cx), Y(cy)); x.lineTo(X(cx + ca*r), Y(cy + sa*r)); x.stroke();
        for(const f of [.62]) for(const sg of [-1, 1]){ const bx = cx + ca*r*f, by = cy + sa*r*f, b = a + sg*.8, L = r*.27;
          x.beginPath(); x.moveTo(X(bx), Y(by)); x.lineTo(X(bx + Math.cos(b)*L), Y(by + Math.sin(b)*L)); x.stroke(); } } };
    const num = (s, cx, cy, capH, wT, wt) => {            // digits sized by cap height and total ink width, tight tracking
      x.font = `${wt} 100px ${F}`; const asc = x.measureText('7').actualBoundingBoxAscent || 70, fs = 100*capH*10/asc; x.font = `${wt} ${fs}px ${F}`;
      x.textAlign = 'left'; x.textBaseline = 'alphabetic'; const ms = [...s].map(c => x.measureText(c)), iw = ms.map(m => m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
      const gap = s.length > 1 ? Math.max(capH*1.6, (wT*10 - iw.reduce((a, b) => a+b, 0))/(s.length-1)) : 0, wI = iw.reduce((a, b) => a+b, 0) + gap*(s.length-1); let px = X(cx) - wI/2;
      [...s].forEach((c, i) => { x.fillText(c, px + ms[i].actualBoundingBoxLeft, Y(cy) + capH*5); px += iw[i] + gap; }); };
    const big = () => { x.strokeStyle = x.fillStyle = '#fff'; x.lineCap = x.lineJoin = 'round';
      x.lineWidth = 10; chev(46.5, true); chev(-46.5, false); num('73', 0, 2.4, 15.6, 23.7, 300); };
    const small = () => { x.strokeStyle = x.fillStyle = '#fff'; x.lineCap = x.lineJoin = 'round';
      x.lineWidth = 2.2; flake(0, 18.3, 3.85); num('75', 0, -13.2, 5.8, 9.4, 300); };
    const draw = () => { x.clearRect(0, 0, N, N);
      const halo = (fn, blur, col) => { x.save(); x.translate(-4000, 0); x.shadowOffsetX = 4000; x.shadowColor = col; x.shadowBlur = blur; fn(); x.restore(); };   // shadow only, glyphs stay thin
      halo(big, 34, 'rgba(255,255,255,.75)'); halo(big, 12, 'rgba(255,255,255,.6)');
      big(); small();
      x.save(); x.fillStyle = 'rgba(255,255,255,.1)'; x.font = `500 100px ${F}`; const w0 = x.measureText('vivint').width;  // faint wordmark
      x.font = `500 ${100*120/w0}px ${F}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('vivint', X(0), Y(-36.6)); x.restore(); };
    draw();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.premultiplyAlpha = true;
    if(document.fonts) Promise.all(['300', '400', '500'].map(w => document.fonts.load(`${w} 60px "Vivint Sans"`))).then(() => { draw(); t.needsUpdate = true; }).catch(() => {});
    const m = new THREE.MeshBasicMaterial({map:t, transparent:true, blending:THREE.CustomBlending, blendSrc:THREE.OneFactor, blendDst:THREE.OneMinusSrcAlphaFactor, depthWrite:false, toneMapped:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
    add(g, new THREE.Mesh(new THREE.PlaneGeometry(.1, .1), m), 0, 0, (D + .03)*k); }

  /* ---- status light: blue glow out of the BOTTOM of the groove only, strongest over the central ~70 mm */
  { const blue = new THREE.Color(0x4c7dff), fall = x => { const a = Math.abs(x); return a < 30 ? 1 : a > 50 ? 0 : (t => 1 - t*t*(3-2*t))((a-30)/20); };
    const colFn = (xx, y) => { const f = y < -W/2 + 3 ? fall(xx) : 0; return [blue.r*f*1.6, blue.g*f*1.6, blue.b*f*1.6]; };
    const gm = new THREE.MeshBasicMaterial({vertexColors:true, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1});
    const bar = add(g, sweep(P, [[.98, 14.25], [.98, 15.85]], gm, (mx, my) => my > -W/2 + 3, colFn)); bar.castShadow = bar.receiveShadow = false;
    const lip = add(g, sweep(P, [[.3, 14.2], [.95, 14.2]], gm, (mx, my) => my > -W/2 + 3, (xx, y, z) => colFn(xx, y).map(v => v*.45))); lip.castShadow = lip.receiveShadow = false;
    // soft fan on the wall below
    const c = document.createElement('canvas'); c.width = 512; c.height = 192; const x = c.getContext('2d');
    x.save(); x.translate(256, 0); x.scale(1, .42); const gr = x.createRadialGradient(0, 0, 0, 0, 0, 250);
    gr.addColorStop(0, 'rgba(76,125,255,.55)'); gr.addColorStop(.35, 'rgba(76,125,255,.3)'); gr.addColorStop(.7, 'rgba(76,125,255,.08)'); gr.addColorStop(1, 'rgba(76,125,255,0)');
    x.fillStyle = gr; x.fillRect(-256, 0, 512, 460); x.restore();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const wash = add(g, new THREE.Mesh(new THREE.PlaneGeometry(.11, .0413), new THREE.MeshBasicMaterial({map:t, transparent:true, depthWrite:false, toneMapped:false})), 0, (-W/2 + 3 - 20.6)*k, .4*k);
    wash.renderOrder = 2;
    wash.geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-.05, -.001, 0), new THREE.Vector3(.05, .001, .0001));   // a wall effect: keep it out of the product's framing box
  }
  return g;
};
