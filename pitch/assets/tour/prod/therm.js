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
    if(colFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, col.length/(prof.length*N)));   // rgb or rgba
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
  const cover = new THREE.MeshPhysicalMaterial({color:0xbababa, roughness:.7, sheen:.15, sheenRoughness:.85, sheenColor:0xffffff, clearcoat:.08, clearcoatRoughness:.35});
  const coverSide = cover.clone(); coverSide.color.set(0xffffff); coverSide.vertexColors = true;          // side band greyer than the face, blending over the roll
  const housing = new THREE.MeshPhysicalMaterial({color:0xcacac8, roughness:.56, clearcoat:.1, clearcoatRoughness:.5});
  const groove = new THREE.MeshStandardMaterial({color:0x666666, roughness:.8});
  const pocketM = housing.clone(); pocketM.side = THREE.DoubleSide;
  const hidden = new THREE.MeshBasicMaterial({visible:false});

  const g = G();
  const BX = [-48, -40, -32, -24, -16, -8, 0, 8, 16, 24, 32, 40, 48];          // extra points along the bottom for the light bar falloff
  const P = outline(W, W, 25, 3.1, [-9, 9], BX);

  /* ---- rear housing z 0 -> 14.2 (1.5 mm back roll), right-side window left open for the button pocket */
  const win = (mx, my, mz) => mx > W/2 - .01 && Math.abs(my) < 9 && mz > 3 && mz < 11;
  add(g, cap(P, 1.5, 0, housing, false));
  add(g, sweep(P, [...arc(1.5, 0, 0, 1.5, 6, true), [0, 3], [0, 11], [0, 13.95], [.07, 14.13], [.22, 14.2]], housing, win));
  /* ---- parting groove z 14.2 -> 15.9, 1.0 mm deep, grey */
  add(g, sweep(P, [[.22, 14.2], [1, 14.2]], groove));
  add(g, sweep(P, [[1, 14.2], [1, 15.9]], groove));
  add(g, sweep(P, [[1, 15.9], [.22, 15.9]], groove));
  /* ---- front cover z 15.9 -> 22.9, flush side wall, 3.5 mm soft front roll, flat face */
  { const cS = new THREE.Color(0x9c9c9a), cF = new THREE.Color(0xbababa), tmp = new THREE.Color();
    add(g, sweep(P, [[.22, 15.9], [.07, 15.97], [0, 16.15], ...arc(0, 19.4, 3.5, D, 12)], coverSide, null, (xx, yy, z) => { const f = Math.min(1, Math.max(0, (z - 19.4)/3.5)); tmp.copy(cS).lerp(cF, f*f); return [tmp.r, tmp.g, tmp.b]; })); }
  add(g, cap(P, 3.5, D, cover, true));

  /* ---- right-side button: pill 6 x 12 cap in a 7 x 13 hole with a 0.35 mm 45-degree chamfered lip, cap 0.3 mm below the wall, 0.25 mm dome */
  { const b = G(); b.rotation.y = Math.PI/2; add(g, b, W/2*k, 0, 7*k);
    const patch = new THREE.Shape([[-4,-9],[4,-9],[4,9],[-4,9]].map(([x,y]) => new THREE.Vector2(x,y))); patch.holes.push(pill(7.7, 13.7, 0, 0, true));
    const pg = new THREE.ShapeGeometry(patch, 32); pg.scale(k,k,k); add(b, new THREE.Mesh(pg, housing)).receiveShadow = true;
    const band = (A, zA, B, zB, m) => { const a = A.getSpacedPoints(120), c = B.getSpacedPoints(120), pos = [], idx = [], n = a.length;
      for(const q of a) pos.push(q.x*k, q.y*k, zA*k); for(const q of c) pos.push(q.x*k, q.y*k, zB*k);
      for(let i=0;i<n;i++){ const j = (i+1)%n; idx.push(i, j, n+i, j, n+j, n+i); }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setIndex(idx); gg.computeVertexNormals();
      return new THREE.Mesh(gg, m); };
    const chamM = new THREE.MeshStandardMaterial({color:0xb0b0ae, roughness:.75, side:THREE.DoubleSide});
    add(b, band(pill(7.7, 13.7), 0, pill(7.0, 13.0), -.35, chamM));                                   // chamfered lip
    add(b, band(pill(7.0, 13.0), -.35, pill(7.0, 13.0), -1.25, pocketM));                            // pocket wall, 0.9 deep
    const fg = new THREE.ShapeGeometry(pill(7.0, 13.0), 32); fg.scale(k,k,k); add(b, new THREE.Mesh(fg, new THREE.MeshStandardMaterial({color:0x9a9a98, roughness:.7})), 0, 0, -1.25*k);
    const cb = .45, cg = new THREE.ExtrudeGeometry(pill(6, 12), {depth:.1, bevelEnabled:true, bevelThickness:cb, bevelSize:cb, bevelOffset:-cb, bevelSegments:6, curveSegments:32});
    cg.translate(0, 0, cb - 1.0 - .3); cg.scale(k,k,k); const cm = add(b, new THREE.Mesh(cg, housing)); cm.castShadow = cm.receiveShadow = true; }

  /* ---- lit display: glyphs glowing white through the dead-front face (10 px per mm, 100 mm square) */
  { const N = 1000, cv = document.createElement('canvas'); cv.width = cv.height = 1024; const x = cv.getContext('2d'); x.setTransform(1.024, 0, 0, 1.024, 0, 0);   // 10 logical px per mm on a power-of-two canvas (mipmaps)
    const F = '"Vivint Sans", "Helvetica Neue", Helvetica, Arial, sans-serif', X = mm => N/2 + mm*10, Y = mm => N/2 - mm*10;
    const chev = (cy, up) => { const s = up ? 1 : -1; x.beginPath(); x.moveTo(X(-2.85), Y(cy - 1.4*s)); x.lineTo(X(0), Y(cy + 1.4*s)); x.lineTo(X(2.85), Y(cy - 1.4*s)); x.stroke(); };
    const flake = (cx, cy, r) => { for(let i=0;i<6;i++){ const a = Math.PI/2 + i*Math.PI/3, ca = Math.cos(a), sa = Math.sin(a);
        x.beginPath(); x.moveTo(X(cx), Y(cy)); x.lineTo(X(cx + ca*r), Y(cy + sa*r)); x.stroke();
        for(const f of [.66]) for(const sg of [-1, 1]){ const bx = cx + ca*r*f, by = cy + sa*r*f, b = a + sg*.75, L = r*.3;
          x.beginPath(); x.moveTo(X(bx), Y(by)); x.lineTo(X(bx + Math.cos(b)*L), Y(by + Math.sin(b)*L)); x.stroke(); } } };
    const num = (s, cx, cy, capH, wT, wt) => {            // digits sized by cap height and total ink width, tight tracking
      x.font = `${wt} 100px ${F}`; const asc = x.measureText('7').actualBoundingBoxAscent || 70, fs = 100*capH*10/asc; x.font = `${wt} ${fs}px ${F}`;
      x.textAlign = 'left'; x.textBaseline = 'alphabetic'; const ms = [...s].map(c => x.measureText(c)), iw = ms.map(m => m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
      const gap = s.length > 1 ? Math.max(capH*1.6, (wT*10 - iw.reduce((a, b) => a+b, 0))/(s.length-1)) : 0, wI = iw.reduce((a, b) => a+b, 0) + gap*(s.length-1); let px = X(cx) - wI/2;
      [...s].forEach((c, i) => { x.fillText(c, px + ms[i].actualBoundingBoxLeft, Y(cy) + capH*5); px += iw[i] + gap; }); };
    const flame = (cx, cy, h) => { const s2 = h/7.7; x.beginPath(); x.moveTo(X(cx), Y(cy - 3.85*s2));
      x.bezierCurveTo(X(cx - 3.2*s2), Y(cy - 3.6*s2), X(cx - 3*s2), Y(cy + .4*s2), X(cx - .6*s2), Y(cy + 3.85*s2));
      x.bezierCurveTo(X(cx - .5*s2), Y(cy + 1.6*s2), X(cx + .9*s2), Y(cy + 1.4*s2), X(cx + 1.2*s2), Y(cy + 2.2*s2));
      x.bezierCurveTo(X(cx + 3.4*s2), Y(cy - .2*s2), X(cx + 3*s2), Y(cy - 3.6*s2), X(cx), Y(cy - 3.85*s2)); x.stroke(); };
    const ST = {mode:'cool', current:73, setpoint:75, display:true};
    const big = () => { x.strokeStyle = x.fillStyle = '#fff'; x.lineCap = x.lineJoin = 'round';
      x.lineWidth = 13; chev(46.5, true); chev(-46.5, false); num(String(Math.round(ST.current)), 0, 2.4, 15.6, String(Math.round(ST.current)).length > 1 ? 23.7 : 11, 300); };
    const small = () => { x.strokeStyle = x.fillStyle = '#fff'; x.lineCap = x.lineJoin = 'round';
      x.lineWidth = 3; if(ST.mode === 'cool') flake(0, 18.3, 3.85); else if(ST.mode === 'heat') flame(0, 18.3, 7.7);
      if(ST.mode !== 'off') num(String(Math.round(ST.setpoint)), 0, -13.2, 6.0, 9.4, 500); };
    const draw = () => { x.clearRect(0, 0, N, N); x.fillStyle = 'rgba(255,255,255,0.004)'; x.fillRect(0, 0, N, N);   // white (near-zero alpha) under everything so edge texels filter to white, not grey
      if(!ST.display){ t && (t.needsUpdate = true); return; }
      const halo = (fn, blur, col) => { x.save(); x.translate(-4000, 0); x.shadowOffsetX = 4096; x.shadowColor = col; x.shadowBlur = blur; fn(); x.restore(); };   // shadow only, glyphs stay thin
      halo(big, 34, 'rgba(255,255,255,.75)'); halo(big, 12, 'rgba(255,255,255,.6)');
      x.save(); x.filter = 'blur(2px)'; x.globalAlpha = .6; big(); x.restore();            // light diffused through the dead-front
      big(); small(); };
    let t = null; draw();
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    if(document.fonts) Promise.all(['300', '400', '500', '600'].map(w => document.fonts.load(`${w} 60px "Vivint Sans"`))).then(() => { draw(); t.needsUpdate = true; }).catch(() => {});
    const m = new THREE.MeshBasicMaterial({map:t, transparent:true, depthWrite:false, toneMapped:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
    const dispMesh = add(g, new THREE.Mesh(new THREE.PlaneGeometry(.1, .1), m), 0, 0, (D + .03)*k);
    var display = { mesh:dispMesh, texture:t, canvas:cv, state:ST, redraw:() => { draw(); t.needsUpdate = true; } }; }

  /* ---- "vivint" printed grey on the cover (not lit), 12 x 3.4 mm at (0, -36.6) */
  { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const F = '"Vivint Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';
    const draw = () => { x.clearRect(0, 0, 256, 64); x.fillStyle = 'rgba(120,120,120,1)'; x.font = `500 100px ${F}`; const w0 = x.measureText('vivint').width;
      x.font = `500 ${100*232/w0}px ${F}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('vivint', 128, 34); t.needsUpdate = true; };
    draw(); if(document.fonts) document.fonts.load('500 60px "Vivint Sans"').then(draw).catch(() => {});
    add(g, new THREE.Mesh(new THREE.PlaneGeometry(.0132, .0033), new THREE.MeshStandardMaterial({map:t, transparent:true, opacity:.45, roughness:.7, depthWrite:false,
      polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2})), 0, -36.6*k, (D + .02)*k); }

  /* ---- status light: blue glow out of the BOTTOM of the groove only, strongest over the central ~70 mm */
  { const blue = new THREE.Color(0x2060ff), fall = x => { const a = Math.abs(x); return a < 30 ? 1 : a > 50 ? 0 : (t => 1 - t*t*(3-2*t))((a-30)/20); };
    const colFn = (xx, y) => { const f = y < -W/2 + 3 ? fall(xx) : 0; return [1, 1, 1, f]; };          // falloff as per-vertex alpha; the colour lives on the material
    const gm = new THREE.MeshBasicMaterial({color:blue, vertexColors:true, transparent:true, opacity:.95, depthWrite:false, toneMapped:false, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1});
    const bar = add(g, sweep(P, [[.98, 14.25], [.98, 15.85]], gm, (mx, my) => my > -W/2 + 3, colFn)); bar.castShadow = bar.receiveShadow = false;
    const lip = add(g, sweep(P, [[.3, 14.2], [.95, 14.2]], gm, (mx, my) => my > -W/2 + 3, colFn)); lip.material = gm.clone(); lip.material.opacity = .35; lip.castShadow = lip.receiveShadow = false;
    // soft fan on the wall below
    const c = document.createElement('canvas'), CW = 512, CH = 336; c.width = CW; c.height = CH; const x = c.getContext('2d'), id = x.createImageData(CW, CH);
    const stops = [[0, 1], [.28, .7], [.62, .3], [1, 0]], I = yn => { for(let i=1;i<stops.length;i++) if(yn <= stops[i][0]){ const [a0, v0] = stops[i-1], [a1, v1] = stops[i], t = (yn - a0)/(a1 - a0); return v0 + (v1 - v0)*t*t*(3 - 2*t); } return 0; };
    for(let py=0;py<CH;py++){ const yn = py/(CH-1), w = .42 + .58*yn, iv = I(yn);                 // soft downcast cone: widens as it falls, fades with distance
      for(let px=0;px<CW;px++){ const xn = (px/(CW-1))*2 - 1, h = Math.exp(-2.6*(xn/w)**2), o = (py*CW + px)*4;
        id.data[o] = id.data[o+1] = id.data[o+2] = 255; id.data[o+3] = Math.round(255*iv*h*(xn*xn < 1 ? 1 : 0)); } }
    x.putImageData(id, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const wash = new THREE.Mesh(new THREE.PlaneGeometry(.13, .085), new THREE.MeshBasicMaterial({color:blue, map:t, transparent:true, depthWrite:false, toneMapped:false}));   // normal blend: tints the wall a saturated blue/orange (additive washes out to white on a light wall)
    wash.position.set(0, (-W/2 + 2 - 42.5)*k, .4*k); wash.renderOrder = 2;
    bar.onBeforeRender = () => { if(!wash.parent) g.add(wash); };   // a wall effect: attached on the first frame so it stays out of the product's size/framing box
    var led = { meshes:[bar, lip, wash], material:gm, washMaterial:wash.material, colors:{cool:0x2060ff, heat:0xff6a10},
      setColor(hex){ gm.color.set(hex); lip.material.color.set(hex); wash.material.color.set(hex); },
      setIntensity(v){ gm.opacity = .95*v; lip.material.opacity = .35*v; wash.material.opacity = v; [bar, lip, wash].forEach(o => o.visible = v > 0); } };
  }
  /* ---- live state for the interactive demo: g.userData.parts.setState({mode:'cool'|'heat'|'off', setpoint, current, display}) */
  const setState = (o = {}) => { Object.assign(display.state, o); display.redraw();
    const mode = display.state.mode; if(mode === 'cool' || mode === 'heat'){ led.setColor(led.colors[mode]); led.setIntensity(1); } else led.setIntensity(0); };
  g.userData.parts = { display, led, setState, getState:() => ({...display.state}) };
  return g;
};
