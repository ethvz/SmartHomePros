// Vivint Door & Window Sensor + magnet, install pose on the window sash's bottom rail (back at z=0, face +z, long axis along x).
// Sensor 68.6 x 27.9 x 12.7 mm, magnet 47.5 x 14.2 x 12.7 mm (as deep as the sensor, as the official renders and photos show; the
// website's 7.1 mm does not match them): satin grey bases and white caps on ONE continuous wall each (flush hairline splits at the
// same height, 9.7), R8.3 / R4.7 plan corners, R2.6 front rolls into faces with a 0.3 mm crown. The sensor's alignment notch is a
// dark 2.9 mm slot up the full grey side facing the magnet, which sits centred below it with a 2.8 mm gap.
// Built in millimetres inside a 0.001-scaled group.
export default H => {
  const { THREE, G, add } = H;
  const K = kit(THREE);
  const g = G(), u = add(g, G()); u.scale.setScalar(.001);
  const grain = K.noiseTex();
  const grey = 0xa9aaad, white = 0xe9e9e7;

  /* one two-tone part: plan L x Wd, corner R, back edge rb, split at zs, front roll rf, 0.3 mm crown, total depth D */
  const part = (L, Wd, R, D, rb, zs, rf, cut, extra = []) => {
    const ring = (d, z) => K.rr(L - 2 * d, Wd - 2 * d, R - d, { nc: 16, ns: 10 }).map(([x, y]) => [x, y, z]);
    const prof = [], DF = D - .3;
    for (let i = 0; i <= 5; i++){ const a = i / 5 * Math.PI / 2; prof.push([rb * (1 - Math.sin(a)), rb * (1 - Math.cos(a))]); }
    for (const z of [...extra, zs, DF - rf]) prof.push([0, z]);
    for (let i = 1; i <= 12; i++){ const a = i / 12 * Math.PI / 2; prof.push([rf * (1 - Math.cos(a)), DF - rf + rf * Math.sin(a)]); }
    const rings = prof.map(([d, z]) => ring(d, z)), top = rings[rings.length - 1];
    for (const s of [.8, .55, .3]) rings.push(top.map(([x, y]) => [x * s, y * s, DF + .3 * (1 - s * s)]));
    const m = K.bandMat({ color: grey, roughness: .42, clearcoat: .2, clearcoatRoughness: .5, bumpMap: grain, bumpScale: .1 }, 'z',
      [[zs, white, .5]], [['z', zs, .2, 0x55585b, .85]], cut);
    const mesh = new THREE.Mesh(K.skin(rings, { start: true, end: [0, 0, D] }), m);
    mesh.castShadow = mesh.receiveShadow = true; return mesh;
  };

  /* sensor, with the alignment notch (2.9 wide, 1.3 deep) cut into the bottom (-y) side at mid-length: open at the mounting
     surface, running up the whole grey side to a rounded end just under the cap seam */
  const NW = 1.45, ZS = 9.7, ZC = ZS - NW, SW = 27.9;
  const cut = `vOP.y < -${(SW / 2 - 1).toFixed(3)} && ((abs(vOP.x) < ${NW} && vOP.z < ${ZC.toFixed(3)}) || length(vec2(vOP.x, vOP.z - ${ZC.toFixed(3)})) < ${NW})`;
  add(u, part(68.6, SW, 8.3, 12.7, .8, ZS, 2.6, cut, [2.5, 6]));
  const U = new THREE.Shape(); U.moveTo(-NW, -.5); U.lineTo(-NW, ZC); U.absarc(0, ZC, NW, Math.PI, 0, true); U.lineTo(NW, -.5); U.lineTo(-NW, -.5);
  K.pocket(u, U, 1.3, '-y', -SW / 2, 0, 0, 0x808285);

  /* magnet right below (centred on the sensor, 2.8 mm gap), its long side facing the notch */
  add(u, part(47.5, 14.2, 4.7, 12.7, .6, ZS, 2.6, null, [2.5, 6]), 0, -(SW / 2 + 2.8 + 7.1), 0);
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
      const t = i / 512, v = Math.sin(t * Math.PI * 2 * 2.5 + .6) * .5 + Math.sin(t * Math.PI * 2 * 5 + 2) * .15;
      let l = 230 + v * 22;
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
