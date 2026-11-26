// Vivint Glass Break Detector: 66 W x 99.1 H x 22.9 D mm, portrait, wall mounted (back at z=0, face +z).
// Grey back plate inset 0.5 mm behind a dark shadow gap, light-grey side shell and white front cap on ONE continuous wall
// (flush hairline at z=19.6), R16.5 squircle corners, R3.5 front roll, 1.8 mm dome, concave 26.5 mm mic dish (2.8 mm deep,
// matched to the render) with a 5.6 mm white bore and dark acoustic felt 1.3 mm down, recessed 21 x 6.5 TEST pill on the right side,
// fine bead-blast grain. Built in millimetres inside a 0.001-scaled group.
export default H => {
  const { THREE, G, add, printPlane, rslab } = H;
  const K = kit(THREE);
  const g = G(), u = add(g, G()); u.scale.setScalar(.001);
  const grain = K.noiseTex();

  const W = 66, HT = 99.1, R = 16.5;
  const ring = (d, z) => K.rr(W - 2 * d, HT - 2 * d, R - d, { nc: 18, ns: 8, p: 2.4 }).map(([x, y]) => [x, y, z]);

  /* side profile [inset, z]: plate (inset 0.5, R0.8 wall edge) -> dark shadow gap -> shell wall -> R3.5 roll (1.6 tall) */
  const prof = [];
  for (let i = 0; i <= 5; i++){ const a = i / 5 * Math.PI / 2; prof.push([.5 + .8 * (1 - Math.sin(a)), .8 * (1 - Math.cos(a))]); }
  prof.push([.5, 2.1], [.62, 2.25], [1.1, 2.3], [1.1, 2.55], [.25, 2.6], [.04, 2.72], [0, 2.9]);
  for (const z of [6, 10, 14, 17.5, 19.6, 19.8]) prof.push([0, z]);
  const RZ = 1.3, Z0 = 19.8;
  for (let i = 1; i <= 12; i++){ const a = i / 12 * Math.PI / 2; prof.push([3.5 * (1 - Math.cos(a)), Z0 + RZ * Math.sin(a)]); }
  const rings = prof.map(([d, z]) => ring(d, z));
  const FZ = Z0 + RZ, FX = W / 2 - 3.5, FY = HT / 2 - 3.5;
  const dome = (x, y) => { const r = Math.pow(Math.pow(Math.abs(x) / FX, 4) + Math.pow(Math.abs(y) / FY, 4), .25); return 1.8 * Math.pow(Math.max(0, 1 - r * r), 1.4); };

  /* face: from the edge of the flat to the dish rim (circle r 13.25), points matched by angle */
  const outer = rings[rings.length - 1], RD = 13.25;
  const rim = outer.map(([x, y]) => { const a = Math.atan2(y, x); return [RD * Math.cos(a), RD * Math.sin(a)]; });
  for (let k = 1; k <= 10; k++){ const t = k / 10, e = t;
    rings.push(outer.map(([x, y], i) => { const X = x + (rim[i][0] - x) * e, Y = y + (rim[i][1] - y) * e; return [X, Y, FZ + dome(X, Y)]; })); }

  const plate = 0xb9babd, shell = 0xc4c5c8, white = 0xf3f3f2;
  const PILL = { y: 0, z: 10, len: 21, wid: 6.5, gap: .35 };
  const pa = (PILL.len + 2 * PILL.gap) / 2 - (PILL.wid + 2 * PILL.gap) / 2, pr = (PILL.wid + 2 * PILL.gap) / 2;
  const cut = `vOP.x > 32.0 && length(vec2(vOP.z - ${PILL.z.toFixed(3)}, max(abs(vOP.y - ${PILL.y.toFixed(3)}) - ${pa.toFixed(3)}, 0.0))) < ${pr.toFixed(3)}`;
  const bodyM = K.bandMat({ color: plate, roughness: .6, bumpMap: grain, bumpScale: .12 }, 'z',
    [[2.42, shell, .55], [19.6, white, .48]], [['z', 2.42, .45, 0x3e4043, .9], ['z', 19.6, .25, 0x66696c, .8]], cut);
  const body = add(u, new THREE.Mesh(K.skin(rings, { start: true }), bodyM));
  body.castShadow = body.receiveShadow = true;

  /* concave spherical dish (2.8 deep at the centre), following the dome, crisp rim; white bore 1.0 deep, then a white ledge
     ringing the dark felt 1.3 below the dish floor */
  const DD = 2.8, SR = (RD * RD + DD * DD) / (2 * DD), sag = r => SR - Math.sqrt(SR * SR - r * r), D0 = sag(RD);
  const dz = (x, y) => { const r = Math.hypot(x, y); return FZ + dome(x, y) - (D0 - sag(r)); };
  const dish = [];
  for (const s of [1, .995, .96, .85, .74, .62, .5, .4, .3, 2.8 / RD]) dish.push(rim.map(([x, y]) => [x * s, y * s, dz(x * s, y * s)]));
  const hb = dish[dish.length - 1].map(([x, y, z]) => [x, y, z]);
  const zf = dz(0, 0);
  dish.push(hb.map(([x, y]) => [x, y, zf - .15]), hb.map(([x, y]) => [x, y, zf - 1.0]), hb.map(([x, y]) => [x, y, zf - 1.3]),
    hb.map(([x, y]) => [x * 2.2 / 2.8, y * 2.2 / 2.8, zf - 1.3]));
  const wm = new THREE.MeshPhysicalMaterial({ color: white, roughness: .3, envMapIntensity: 1.2, bumpMap: grain, bumpScale: .1 });
  const dg = K.skin(dish), dp = dg.attributes.position, dc = [];
  for (let i = 0; i < dp.count; i++){                 // baked occlusion: the upper-left inner wall (turned away from the room's light)
    const x = dp.getX(i), y = dp.getY(i), r = Math.hypot(x, y), q = r > 3 ? Math.max(0, (.75 * y - .45 * x) / r) : 0;   // and the rim shadow line
    const k = 1 - .18 * q * Math.pow(Math.min(1, r / RD), 1.2) - (r > RD * .95 ? .24 * q : 0); dc.push(k, k, k); }
  dg.setAttribute('color', new THREE.Float32BufferAttribute(dc, 3)); wm.vertexColors = true;
  add(u, new THREE.Mesh(dg, wm));
  add(u, new THREE.Mesh(new THREE.CircleGeometry(2.25, 40), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: .95,
    bumpMap: K.noiseTex(3), bumpScale: 1.2 })), 0, 0, zf - 1.27);

  /* TEST pill */
  K.pocket(u, K.pill(PILL.len + 2 * PILL.gap, PILL.wid + 2 * PILL.gap), 1.2, 'x', 33, PILL.y, PILL.z, 0x2e3033);
  const cap = add(u, rslab(PILL.wid, PILL.len, 2, PILL.wid / 2, .9, new THREE.MeshPhysicalMaterial({ color: shell, roughness: .5, bumpMap: grain, bumpScale: .12 })), 33 - .25 - 1, PILL.y, PILL.z);
  cap.rotation.y = Math.PI / 2;
  const tg = add(u, G(), 33 - .25 + .04, PILL.y, PILL.z); tg.rotation.y = Math.PI / 2;
  const tx = add(tg, printPlane(.014, .006, (x, Pp) => { x.fillStyle = '#6e6f72'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '400 25px "Vivint Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'; x.letterSpacing = '3px'; x.fillText('TEST', ...Pp(0, 0)); }));
  tx.scale.setScalar(1000); tx.rotation.z = -Math.PI / 2;
  return g;
};

/* ---- sensor kit (shared by the motion / glass / window / water modules; duplicated so each module stands alone) ---- */
function kit(THREE){
  /* rounded-rectangle outline, CCW from the right edge, fixed point count so rings line up. r = number or [tr, tl, bl, br];
     p = corner superellipse exponent (2 = circular arcs, >2 = continuous-curvature squircle); bow = top/bottom edges bulge */
  function rr(w, h, r, o = {}){
    const { nc = 16, ns = 6, p = 2, cx = 0, cy = 0, bow = 0 } = o;
    const R = (Array.isArray(r) ? r : [r, r, r, r]).map(v => Math.max(1e-4, Math.min(v, w / 2 - 1e-5, h / 2 - 1e-5)));
    const C = [[w / 2 - R[0], h / 2 - R[0]], [-w / 2 + R[1], h / 2 - R[1]], [-w / 2 + R[2], -h / 2 + R[2]], [w / 2 - R[3], -h / 2 + R[3]]];
    const map = (q, a, b) => [[a, b], [-b, a], [-a, -b], [b, -a]][q];
    const pts = [];
    for (let q = 0; q < 4; q++){
      for (let i = 0; i <= nc; i++){
        const t = i / nc * Math.PI / 2, a = Math.max(0, Math.cos(t)) ** (2 / p), b = Math.max(0, Math.sin(t)) ** (2 / p), [mx, my] = map(q, a, b);
        pts.push([C[q][0] + mx * R[q], C[q][1] + my * R[q]]);
      }
      const n = (q + 1) % 4, [sx, sy] = map(n, 1, 0), e = pts[pts.length - 1], s = [C[n][0] + sx * R[n], C[n][1] + sy * R[n]];
      for (let i = 1; i <= ns; i++){ const t = i / (ns + 1); pts.push([e[0] + (s[0] - e[0]) * t, e[1] + (s[1] - e[1]) * t]); }
    }
    if (bow) for (const q of pts) q[1] += bow * (1 - (q[0] / (w / 2)) ** 2) * q[1] / (h / 2);
    return pts.map(([x, y]) => [x + cx, y + cy]);
  }
  /* skin a list of equal-length rings [[x,y,z],...] into a smooth surface; start/end: true = flat fan cap at the centroid,
     or [x,y,z] for the fan centre. Ring order back -> front, points CCW seen from +z gives outward normals. */
  function skin(rings, o = {}){
    const n = rings[0].length, pos = [], idx = [], uv = [];
    const put = ([x, y, z]) => { pos.push(x, y, z); const t = o.uv ? o.uv(x, y, z) : [(x + z) * .01, (y + .7 * z) * .01]; uv.push(t[0], t[1]); return pos.length / 3 - 1; };
    for (const r of rings) for (const q of r) put(q);
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++){
      const a = k * n + i, b = k * n + (i + 1) % n, c = a + n, d = b + n; idx.push(a, b, c, b, d, c); }
    const fan = (k, cen, flip) => { const r = rings[k]; let c = cen;
      if (c === true){ c = [0, 0, 0]; for (const q of r){ c[0] += q[0] / n; c[1] += q[1] / n; c[2] += q[2] / n; } }
      const ci = put(c); for (let i = 0; i < n; i++){ const a = k * n + i, b = k * n + (i + 1) % n; flip ? idx.push(b, a, ci) : idx.push(a, b, ci); } };
    if (o.start) fan(0, o.start, true);
    if (o.end) fan(rings.length - 1, o.end, false);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals(); return geo;
  }
  /* one material whose colour/roughness changes in bands along an axis (flush colour splits), with fine dark parting lines,
     and an optional GLSL condition (object-space vOP, mm) that cuts a pocket opening out of the surface */
  function bandMat(base, axis, bands = [], lines = [], cut = null){
    const m = new THREE.MeshPhysicalMaterial(base);
    const C = h => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(5)},${c.g.toFixed(5)},${c.b.toFixed(5)})`; }, f = v => v.toFixed(5);
    let col = 'float rB = roughness;\n';
    for (const [at, c, r] of bands) col += `{ float fw = max(fwidth(vOP.${axis}), 1e-6); float s = smoothstep(-fw, fw, vOP.${axis} - ${f(at)});
      diffuseColor.rgb = mix(diffuseColor.rgb, ${C(c)}, s); rB = mix(rB, ${f(r)}, s); }\n`;
    for (const [ax, at, w, c, k] of lines) col += `{ float fw = max(fwidth(vOP.${ax}), 1e-6); float dd = abs(vOP.${ax} - ${f(at)});
      diffuseColor.rgb = mix(diffuseColor.rgb, ${C(c)}, (1.0 - smoothstep(${f(w / 2)} - fw, ${f(w / 2)} + fw, dd)) * ${f(k)}); }\n`;
    m.onBeforeCompile = sh => {
      sh.vertexShader = 'varying vec3 vOP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vOP = position;');
      sh.fragmentShader = 'varying vec3 vOP;\n' + sh.fragmentShader
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + (cut ? `if(${cut}) discard;` : ''))
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + col)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = rB;');
    };
    const key = 'band' + axis + JSON.stringify(bands) + JSON.stringify(lines) + cut;
    m.customProgramCacheKey = () => key;
    return m;
  }
  /* vertical stadium outline (length along Y) */
  function pill(len, wid){ const r = wid / 2, a = Math.max(1e-4, len / 2 - r), s = new THREE.Shape();
    s.absarc(0, a, r, 0, Math.PI, false); s.absarc(0, -a, r, Math.PI, 2 * Math.PI, false); return s; }
  /* pocket cup behind a cut opening: the shape extruded `depth` into the body, drawn inside-out so its walls and floor show.
     face: 'x' (side wall at x = at, shape in (z, y)), '-y' (underside at y = at, shape in (x, z)), 'z' (front at z = at, shape in (x, y)) */
  function pocket(parent, shape, depth, face, at, a, b, color){
    const geo = new THREE.ExtrudeGeometry(shape, { depth: depth + .15, bevelEnabled: false, curveSegments: 28 });
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: .85, side: THREE.BackSide }));
    if (face === 'x'){ geo.rotateY(Math.PI / 2); m.position.set(at - depth, a, b); }          // local X -> world -z, depth -> +x
    else if (face === '-y'){ geo.rotateX(Math.PI / 2); m.position.set(a, at + depth, b); }    // local Y -> world z, depth -> -y
    else m.position.set(a, b, at - depth);
    parent.add(m); return m;
  }
  /* soft vertical Fresnel facet bands (shading only) */
  function bandsTex(ao){
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'), im = x.createImageData(512, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 512; i++){
      const t = i / 512, P2 = Math.PI * 2, v = .5 * Math.sin(P2 * (2.3 * t + .13)) + .3 * Math.sin(P2 * (3.7 * t + .5)) + .2 * Math.sin(P2 * (5.9 * t + .8));   // non-periodic soft facets
      let l = 234 + v * 12 + 6 * Math.exp(-(((t - .5) / .3) ** 2));   // plus a broad centre lift
      if (ao){ const top = j / 256, side = Math.min(t, 1 - t), bot = 1 - top;            // shade under the cover's top lip and along the walls
        l *= (1 - .28 * Math.exp(-top / .06) - .1 * Math.exp(-top / .3) + .05 * Math.exp(-bot / .25)) * (1 - .12 * Math.exp(-side / .025)) * (1 - .06 * Math.exp(-bot / .03)); }
      const k = (j * 512 + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = Math.round(l); im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  /* fine bead-blast grain for bumpMap: smoothed noise, tiles every 128 px; at repeat 12 one pixel is about 0.07 mm */
  function noiseTex(rep = 12){
    const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
    const r = new Float32Array(N * N); for (let i = 0; i < r.length; i++) r[i] = Math.random();
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){ let v = 0;
      for (const [a, b, w] of [[0, 0, .4], [1, 0, .15], [-1, 0, .15], [0, 1, .15], [0, -1, .15]]) v += w * r[((j + b + N) % N) * N + (i + a + N) % N];
      const k = (j * N + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = Math.round(60 + v * 140); im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t;
  }
  return { rr, skin, bandMat, pill, pocket, bandsTex, noiseTex };
}
