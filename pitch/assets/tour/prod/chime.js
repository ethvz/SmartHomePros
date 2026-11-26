// chime: Vivint Chime Extender. 48.3 x 91.4 x 31.3 mm plug-in speaker. Back on the outlet at z = 0 (prongs go into the wall,
// toward -z), speaker toward +z, centred. One white shell swept through a side profile: a big R~10 pillow round the back,
// straight sides, a small rounded front lip (1.7 mm rim); a 0.3 mm dark gap; then a light heather-grey knitted fabric panel
// 0.5 mm below the rim. Recessed pill button on the left side, grey "vivint" on the right side, two nickel blades low on the back.
export default H => {
  const { THREE, G, add } = H;
  const k = .001, W = 48.3, Ht = 91.4, D = 31.3;               // modelled in mm, built in metres

  function outline(w, h, c, p, brkY = [], n = 26){
    const P = [], hx = w/2, hy = h/2, push = (x, y) => { const q = P[P.length-1]; if(!q || Math.hypot(q[0]-x, q[1]-y) > 1e-6) P.push([x, y]); };
    const corner = (cx, cy, a0) => { for(let i=0;i<=n;i++){ const t = a0 + i/n*Math.PI/2, co = Math.cos(t), si = Math.sin(t);
      push(cx + c*Math.sign(co)*Math.abs(co)**(2/p), cy + c*Math.sign(si)*Math.abs(si)**(2/p)); } };
    const ys = [...brkY].sort((a,b)=>a-b);
    push(hx, -(hy-c)); for(const y of ys) if(Math.abs(y) < hy-c) push(hx, y);
    corner(hx-c, hy-c, 0); corner(-(hx-c), hy-c, Math.PI/2);
    for(const y of [...ys].reverse()) if(Math.abs(y) < hy-c) push(-hx, y);
    corner(-(hx-c), -(hy-c), Math.PI); corner(hx-c, -(hy-c), 1.5*Math.PI);
    if(Math.hypot(P[0][0]-P[P.length-1][0], P[0][1]-P[P.length-1][1]) < 1e-6) P.pop();
    return P;
  }
  const normals = P => P.map((p, i) => { const a = P[(i-1+P.length)%P.length], b = P[(i+1)%P.length], tx = b[0]-a[0], ty = b[1]-a[1], L = Math.hypot(tx, ty); return [ty/L, -tx/L]; });
  function sweep(P, prof, m, skip){
    const N = P.length, Nn = normals(P), pos = [], idx = [];
    for(const [ins, z] of prof) for(let i=0;i<N;i++) pos.push((P[i][0]-Nn[i][0]*ins)*k, (P[i][1]-Nn[i][1]*ins)*k, z*k);
    for(let j=0;j<prof.length-1;j++) for(let i=0;i<N;i++){ const i2 = (i+1)%N;
      if(skip){ const mx = (P[i][0]+P[i2][0])/2, my = (P[i][1]+P[i2][1])/2, mz = (prof[j][1]+prof[j+1][1])/2; if(skip(mx, my, mz)) continue; }
      const a = j*N+i, b = j*N+i2, c = (j+1)*N+i2, d = (j+1)*N+i; idx.push(a,b,d, b,c,d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; return x;
  }
  function cap(P, ins, z, m, front){
    const N = P.length, Nn = normals(P), pos = [0, 0, z*k], idx = [];
    for(let i=0;i<N;i++) pos.push((P[i][0]-Nn[i][0]*ins)*k, (P[i][1]-Nn[i][1]*ins)*k, z*k);
    for(let i=0;i<N;i++){ const a = 1+i, b = 1+(i+1)%N; front ? idx.push(0, a, b) : idx.push(0, b, a); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; return x;
  }
  const offsetShape = (P, ins) => { const Nn = normals(P); return new THREE.Shape(P.map((p, i) => new THREE.Vector2(p[0]-Nn[i][0]*ins, p[1]-Nn[i][1]*ins))); };
  const pill = (w, h, hole) => { const r = w/2, s = hole ? new THREE.Path() : new THREE.Shape(), e = h/2 - r;
    s.absarc(0, e, r, 0, Math.PI, false); s.absarc(0, -e, r, Math.PI, 2*Math.PI, false); return s; };

  /* ---- materials */
  const shell = new THREE.MeshPhysicalMaterial({color:0xf2f2f0, roughness:.5, clearcoat:.12, clearcoatRoughness:.45, sheen:.25, sheenRoughness:.7, sheenColor:0xffffff});
  const pocketM = shell.clone(); pocketM.side = THREE.DoubleSide;
  const hidden = new THREE.MeshBasicMaterial({visible:false});
  const dark = new THREE.MeshStandardMaterial({color:0x1c1c1c, roughness:.8});

  const g = G();
  const P = outline(W, Ht, 14.5, 2.1, [-12.5, 12.5]);

  /* ---- shell: back pillow (superellipse c 10.5, p 1.8), straight sides, small front lip rolling into a 1.7 mm rim */
  const prof = [];
  for(let i=0;i<=16;i++){ const t = i/16*Math.PI/2, c = 10.5, p = 1.8;                     // inset vs z round the back edge
    const u = Math.cos(t)**(2/p), v = Math.sin(t)**(2/p); prof.push([c*(1-v), c*(1-u)]); }
  prof.push([0, 11.4], [0, 18.4], [0, 30.8]);
  for(let i=1;i<=8;i++){ const t = i/8*Math.PI/2; prof.push([.5*(1-Math.cos(t)), 30.8 + .5*Math.sin(t)]); }       // R0.5 front roll to the crest near the outer edge
  const win = (mx, my, mz) => mx < -W/2 + .01 && Math.abs(my) < 12.5 && mz > 11.4 && mz < 18.4;
  add(g, cap(P, 10.5, 0, shell, false));
  add(g, sweep(P, prof, shell, win));
  const bezel = new THREE.MeshPhysicalMaterial({color:0xc2c2c0, roughness:.6, clearcoat:.08});
  add(g, sweep(P, [[.5, 31.3], [1.85, 30.2]], bezel));                                                         // straight bezel sloping down and in from the crest to the fabric
  add(g, sweep(P, [[1.85, 30.2], [1.85, 30.0]], dark));
  add(g, sweep(P, [[1.85, 30.0], [2.6, 30.0]], dark));                                                         // dark floor (the hairline gap) at the bezel foot

  /* ---- fabric grille: inset 2.0, face 0.5 mm below the rim crest, edge wrapped soft */
  { const N = 2048, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
    const T = 40.8, cols = 48, rows = 68, cw = N/cols, rh = N/rows;                          // 40.8 mm tile: rib columns 0.85 mm, rows 0.6 mm
    let seed = 11; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
    const TAU = Math.PI*2, heather = (px, py) => { const u = px/N*TAU, v = py/N*TAU;               // low-frequency mottling that still tiles
      return .95 + .018*Math.sin(3*u + 1.3) * Math.cos(2*v + .4) + .013*Math.sin(5*u + 2*v + 2.1) + .01*Math.cos(4*v - 3*u + .7) + .008*Math.sin(7*v + 1.1); };
    x.fillStyle = '#3c3c3c'; x.fillRect(0, 0, N, N);
    for(let r=-1;r<=rows;r++) for(let q=0;q<cols;q++){
      const cx = q*cw + cw/2, cy = r*rh + rh/2, h = heather(cx, cy);
      for(const side of [-1, 1]){                                                                  // two interlocking loops per stitch, nearly vertical
        const roll = rnd(); let v = 200 + rnd()*14; if(roll < .04) v = 172 + rnd()*12; else if(roll > .94) v = 236 + rnd()*14; v *= h;
        x.save(); x.translate(cx + side*cw*.2 + (rnd() - .5)*2*.08*N/T, cy); x.rotate(side*.25);
        const gr = x.createLinearGradient(-cw*.23, 0, cw*.23, 0), e = `rgb(${v*.8|0},${v*.8|0},${v*.8|0})`, m = `rgb(${v|0},${v|0},${v|0})`;
        gr.addColorStop(0, e); gr.addColorStop(.5, m); gr.addColorStop(1, e);
        x.fillStyle = gr; x.beginPath(); x.ellipse(0, 0, cw*.23, rh*.75, 0, 0, TAU); x.fill(); x.restore(); }
      if(rnd() < .7){ x.fillStyle = '#262626'; x.beginPath(); x.ellipse(q*cw, cy + rh/2 + (q%2)*rh/2, cw*.12, rh*.55, 0, 0, TAU); x.fill(); }   // staggered, irregular slit pores   // see-through slit pore between columns (0.25 x 0.45 mm)
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1/T, 1/T); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const bt = new THREE.CanvasTexture(c); bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.copy(t.repeat); bt.anisotropy = 16;
    const fab = new THREE.MeshPhysicalMaterial({color:0xc2c2c2, map:t, bumpMap:bt, bumpScale:1.5, roughness:.95, sheen:.6, sheenRoughness:.9, sheenColor:0xcfcfcf, envMapIntensity:.5});
    const b = .3, fg = new THREE.ExtrudeGeometry(offsetShape(P, 2.1), {depth:.9-2*b, bevelEnabled:true, bevelThickness:b, bevelSize:b, bevelOffset:-b, bevelSegments:4, curveSegments:24});
    fg.translate(0, 0, 29.2 + b); fg.scale(k, k, k); const fm = add(g, new THREE.Mesh(fg, fab)); fm.receiveShadow = true; }

  /* ---- status LED behind the fabric, top centre (lit: soft white dot diffused through the weave; nothing protrudes) */
  { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), mm = 128/4;     // 4 mm plane, 32 px/mm
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(.35, 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    x.globalCompositeOperation = 'lighter';                                                          // light escaping through the slit pores, strongest in the ~2 mm core
    for(let cy=-.3; cy<4.3; cy+=.6) for(let cx=0; cx<4.3; cx+=.85){ const d = Math.hypot(cx-2, cy-2), a = Math.max(0, 1 - d/1.6);
      if(a <= 0) continue; x.fillStyle = `rgba(255,255,255,${a})`; x.beginPath(); x.ellipse(cx*mm, cy*mm, .14*mm, .24*mm, 0, 0, Math.PI*2); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const led = add(g, new THREE.Mesh(new THREE.PlaneGeometry(.004, .004), new THREE.MeshBasicMaterial({map:t, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, opacity:.3*2,
      polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3})), 0, (Ht/2 - 10)*k, (30.1 + .02)*k); led.renderOrder = 3;
    g.userData.parts = { led: { mesh:led, material:led.material, setColor(hex){ led.material.color.set(hex); }, setIntensity(v){ led.material.opacity = .6*v; led.visible = v > 0; } } }; }

  /* ---- left-side button: pill 21 x 5, 0.4 mm groove, cap 0.15 mm below the wall */
  { const b = G(); b.rotation.y = -Math.PI/2; add(g, b, -W/2*k, 0, 14.9*k);
    const patch = new THREE.Shape([[-3.5,-12.5],[3.5,-12.5],[3.5,12.5],[-3.5,12.5]].map(([x,y]) => new THREE.Vector2(x,y))); patch.holes.push(pill(5.8, 21.8, true));
    const pg = new THREE.ShapeGeometry(patch, 32); pg.scale(k,k,k); add(b, new THREE.Mesh(pg, shell)).receiveShadow = true;
    const wg = new THREE.ExtrudeGeometry(pill(5.8, 21.8), {depth:1.2, bevelEnabled:false, curveSegments:32}); wg.translate(0, 0, -1.2); wg.scale(k,k,k);
    add(b, new THREE.Mesh(wg, [hidden, pocketM]));
    const fl = new THREE.ShapeGeometry(pill(5.8, 21.8), 32); fl.scale(k,k,k); add(b, new THREE.Mesh(fl, new THREE.MeshStandardMaterial({color:0x6c6c6a, roughness:.7})), 0, 0, -1.2*k);
    const cb = .35, cg = new THREE.ExtrudeGeometry(pill(5, 21), {depth:1-2*cb, bevelEnabled:true, bevelThickness:cb, bevelSize:cb, bevelOffset:-cb, bevelSegments:5, curveSegments:32});
    cg.translate(0, 0, cb - 1 - .15); cg.scale(k,k,k); const cm = add(b, new THREE.Mesh(cg, shell)); cm.castShadow = cm.receiveShadow = true; }

  /* ---- right-side wordmark, reading bottom to top, light grey print */
  { const cc = document.createElement('canvas'); cc.width = 80; cc.height = 160;                  // 10 px/mm: 8 x 16 mm plane
    const t = new THREE.CanvasTexture(cc); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const y = cc.getContext('2d');
    const draw2 = () => { y.clearRect(0, 0, 80, 160); y.save(); y.translate(40, 80); y.rotate(-Math.PI/2); y.fillStyle = '#dededc';
      const F = '"Vivint Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'; y.font = `500 100px ${F}`; const w0 = y.measureText('vivint').width;
      y.font = `500 ${100*145/w0}px ${F}`; y.textAlign = 'center'; y.textBaseline = 'middle'; y.fillText('vivint', 0, 3); y.restore(); t.needsUpdate = true; };
    draw2(); if(document.fonts) document.fonts.load('600 60px "Vivint Sans"').then(draw2).catch(() => {});
    const m = new THREE.MeshStandardMaterial({map:t, transparent:true, roughness:.5, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
    const pl = add(g, new THREE.Mesh(new THREE.PlaneGeometry(.008, .016), m), (W/2 + .03)*k, 0, 16*k); pl.rotation.y = Math.PI/2; }

  /* ---- AC plug: two flat nickel blades, vertical, 12.7 mm apart, 21 mm above the bottom edge, rounded tips with a 3 mm hole */
  { const bc = document.createElement('canvas'); bc.width = 16; bc.height = 256; const bx = bc.getContext('2d');      // brushed grain along the blade length
    let sd = 5; const rr = () => (sd = (sd*16807) % 2147483647) / 2147483647;
    for(let y=0;y<256;y++){ const v = 150 + rr()*90 | 0; bx.fillStyle = `rgb(${v},${v},${v})`; bx.fillRect(0, y, 16, 1); }
    const brush = new THREE.CanvasTexture(bc); brush.wrapS = brush.wrapT = THREE.RepeatWrapping; brush.repeat.set(1/20, 1/40);
    const nickel = new THREE.MeshPhysicalMaterial({color:0xe0e0de, metalness:.55, roughness:.3, roughnessMap:brush, bumpMap:brush, bumpScale:.15, clearcoat:.15});
    for(const sx of [-1, 1]){ const s = new THREE.Shape(), L = 16.5, h = 3.2, r = 1.2;              // (u = distance from the back face, v = y)
      s.moveTo(-.5, -h); s.lineTo(L-r, -h); s.absarc(L-r, -h+r, r, -Math.PI/2, 0, false); s.lineTo(L, h-r); s.absarc(L-r, h-r, r, 0, Math.PI/2, false); s.lineTo(-.5, h); s.closePath();
      const hole = new THREE.Path(); hole.absarc(L-4, 0, 1.5, 0, Math.PI*2, true); s.holes.push(hole);
      const bb = .2, bg = new THREE.ExtrudeGeometry(s, {depth:1.5-2*bb, bevelEnabled:true, bevelThickness:bb, bevelSize:bb, bevelOffset:-bb, bevelSegments:2, curveSegments:20});
      bg.translate(0, 0, bb - .75); bg.scale(k, k, k);
      const m = add(g, new THREE.Mesh(bg, nickel), sx*6.35*k, -24.8*k, 0); m.rotation.y = Math.PI/2;        // local x (u) -> world -z, local z -> world x
      m.castShadow = m.receiveShadow = true; } }
  return g;
};
