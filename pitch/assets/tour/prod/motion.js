// Vivint Motion Sensor (VS-PIR300): 70 W x 78.5 H x 50 D mm, wall mounted (back at z=0, face +z).
// Grey body and white front cover share ONE continuous side wall (flush hairline split at z=35.5), R15 squircle corners,
// top/bottom bowed 1 mm, R7-8 front roll into a 2.5 mm crowned face, Fresnel lens recessed 1 mm behind a thin inner lip, mounting-plate step at the back, tone-on-tone wordmark,
// recessed TEST pill on the right side. Built in millimetres inside a 0.001-scaled group.
export default H => {
  const { THREE, G, add, DEC, decal, printPlane, rslab } = H;
  const K = kit(THREE);
  const g = G(), u = add(g, G()); u.scale.setScalar(.001);
  const grain = K.noiseTex();                                          // fine bead-blast texture on every moulded surface

  const W = 70, HT = 76.5, RC = 17, P = 2.5, BOW = 1;                     // squircle corners read as R15; bow brings H to 78.5
  const ring = (d, z) => K.rr(W - 2 * d, HT - 2 * d, RC - d, { p: P, bow: BOW * (1 - d / 20) }).map(([x, y]) => [x, y, z]);

  /* crown of the front face: 0 (with zero slope) at the edge of the flat, 2.5 mm at the centre (front-most z = 50) */
  const RR = 7, FX = W / 2 - RR, FY = HT / 2 - RR, FZ = 47.5;
  const crown = (x, y) => { const r = Math.pow(Math.pow(Math.abs(x) / FX, 4) + Math.pow(Math.abs(y) / FY, 4), .25); return 2.5 * Math.pow(Math.max(0, 1 - r * r), 1.5); };

  /* side profile [inset, z]: mounting plate inset 0.4 (R0.4 at the wall) with a shadow step at z 1.9, straight wall,
     front roll 7 in x 6 (z 41.5 to 47.5) */
  const prof = [];
  for (let i = 0; i <= 4; i++){ const a = i / 4 * Math.PI / 2; prof.push([.4 + .4 * (1 - Math.sin(a)), .4 * (1 - Math.cos(a))]); }
  prof.push([.4, 1.7], [.75, 1.82], [.75, 1.98], [.2, 2.08], [.04, 2.2], [0, 2.4]);
  for (const z of [9, 17, 26, 35.5, 38.5, 41.5]) prof.push([0, z]);
  for (let i = 1; i <= 14; i++){ const a = i / 14 * Math.PI / 2; prof.push([RR * (1 - Math.cos(a)), 41.5 + 6 * Math.sin(a)]); }
  const rings = prof.map(([d, z]) => ring(d, z));

  /* face: from the edge of the flat to the lens opening (top R4, bottom R6), then the 1.5 mm recess wall */
  const outer = rings[rings.length - 1];
  const LX = 54, LY0 = -10.5, LY1 = 27.7, LCY = (LY0 + LY1) / 2;
  const lensO = K.rr(LX, LY1 - LY0, [4, 4, 6, 6], { cy: LCY });
  const LR = .6, lensG = K.rr(LX + 2 * LR, LY1 - LY0 + 2 * LR, [4 + LR, 4 + LR, 6 + LR, 6 + LR], { cy: LCY });   // opening lip rolls R1.4 into the recess
  for (let k = 1; k <= 8; k++){ const t = k / 8;
    rings.push(outer.map(([x, y], i) => { const X = x + (lensG[i][0] - x) * t, Y = y + (lensG[i][1] - y) * t; return [X, Y, FZ + crown(X, Y)]; })); }
  for (let i = 1; i <= 6; i++){ const a = i / 6 * Math.PI / 2, f = Math.sin(a);
    rings.push(lensG.map(([x, y], j) => { const X = x + (lensO[j][0] - x) * f, Y = y + (lensO[j][1] - y) * f, gx = lensG[j][0], gy = lensG[j][1]; return [X, Y, FZ + crown(gx, gy) - LR * (1 - Math.cos(a))]; })); }
  const lip = rings[rings.length - 1];
  rings.push(lip.map(([x, y, z]) => [x, y, z - .4]), lip.map(([x, y, z]) => [x, y, z - .75]));   // inner lip wall, then the lens

  const grey = 0x929397, white = 0xf2f2f0;
  const PILL = { y: 8, z: 14.5, len: 21, wid: 7.5, gap: .45 };
  const pa = (PILL.len + 2 * PILL.gap) / 2 - (PILL.wid + 2 * PILL.gap) / 2, pr = (PILL.wid + 2 * PILL.gap) / 2;
  const cut = `vOP.x > 34.0 && length(vec2(vOP.z - ${PILL.z.toFixed(3)}, max(abs(vOP.y - ${PILL.y.toFixed(3)}) - ${pa.toFixed(3)}, 0.0))) < ${pr.toFixed(3)}`;
  const bodyM = K.bandMat({ color: grey, roughness: .6, bumpMap: grain, bumpScale: .15 }, 'z',
    [[35.5, white, .5]], [['z', 1.9, .3, 0x3e4043, .8], ['z', 35.5, .3, 0x5b5e61, .85]], cut);
  const body = add(u, new THREE.Mesh(K.skin(rings, { start: true }), bodyM));
  body.castShadow = body.receiveShadow = true;

  /* Fresnel lens: frosted neutral grey (a hint of lavender), broad soft vertical facet bands (about +/-6 %), shade under the top lip; follows the crown 1 mm down */
  const lensRings = [];
  for (const s of [1, .92, .8, .65, .5, .35, .2, .08]) lensRings.push(lensO.map(([x, y]) => { const X = x * s, Y = LCY + (y - LCY) * s; return [X, Y, FZ + crown(X, Y) - 1.0 + .2 * (1 - (X / 27) ** 2)]; }));
  const lensM = new THREE.MeshPhysicalMaterial({ color: 0xa9a8b0, roughness: .62, map: K.bandsTex(true), specularIntensity: .15 });
  add(u, new THREE.Mesh(K.skin(lensRings, { end: [0, LCY, FZ + crown(0, LCY) - .8], uv: (x, y) => [(x + LX / 2) / LX, (y - LY0) / (LY1 - LY0)] }), lensM));

  /* wordmark, tone-on-tone, flush on the crowned face */
  add(u, decal(DEC.logo, 36, 9, { color: 0xbcbdc0, r: .5 }), 0, -25.4, FZ + crown(0, -25.4) + .25);

  /* TEST pill: dark gap ring pocket (1.5 mm deep), grey cap with a soft 0.35 edge whose top is 0.25 mm below the side surface,
     printed TEST reading downward */
  K.pocket(u, K.pill(PILL.len + 2 * PILL.gap, PILL.wid + 2 * PILL.gap), 1.5, 'x', 35, PILL.y, PILL.z, 0x2e3033);
  const cap = add(u, rslab(PILL.wid, PILL.len, 2, PILL.wid / 2, .35, new THREE.MeshPhysicalMaterial({ color: grey, roughness: .45, bumpMap: grain, bumpScale: .15 })), 35 - .25 - 1, PILL.y, PILL.z);
  cap.rotation.y = Math.PI / 2;
  const tg = add(u, G(), 35 - .25 + .04, PILL.y, PILL.z); tg.rotation.y = Math.PI / 2;
  const tx = add(tg, printPlane(.014, .006, (x, Pp) => { x.fillStyle = '#6e6f72'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '400 24px "Vivint Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'; x.letterSpacing = '3px'; x.fillText('TEST', ...Pp(0, 0)); }));
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
