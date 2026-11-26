// Vivint Water Sensor (VS-FLD001): 63.5 mm square puck, 25.4 mm tall, lying on the floor (base at y=0, top toward +y).
// Four stainless dome feet (probes), a white base with a deep elliptical tuck-under, a REAL recessed groove (1.7 tall, 1.2 deep)
// between base and lid, a flush lid with an R3 top roll and an almost flat top. Plan corners R13.5.
// Built in millimetres inside a 0.001-scaled group; profiles are made with height along z, then stood up (z -> +y).
export default H => {
  const { THREE, G, add } = H;
  const K = kit(THREE);
  const g = G(), u = add(g, G()); u.scale.setScalar(.001);

  const S = 63.5, R = 13.5;
  const ring = (d, h, k = .77) => K.rr(S - 2 * d, S - 2 * d, R - d * k, { nc: 20, ns: 8 }).map(([x, y]) => [x, y, h]);
  const up = geo => { geo.rotateX(-Math.PI / 2); return geo; };
  const white = 0xf1f1ef, lidW = 0xf3f3f1;

  /* base: flat underside (41.5 square, R5) at 2.0, quarter-ellipse tuck (11.0 in, 11.2 up), straight wall, 0.3 chamfer */
  const base = [];
  for (let i = 0; i <= 14; i++){ const a = i / 14 * Math.PI / 2; base.push(ring(11 * (1 - Math.sin(a)), 2 + 11.2 * (1 - Math.cos(a)))); }
  base.push(ring(0, 14.3), ring(0, 16.9), ring(.12, 17.22), ring(.3, 17.3));
  const baseM = K.bandMat({ color: white, roughness: .5, sheen: .3, sheenRoughness: .8, sheenColor: 0xffffff }, 'y', [], [['y', 14.3, .1, 0xc9c9c7, .5]]);
  const b = add(u, new THREE.Mesh(up(K.skin(base, { start: [0, 0, 2] })), baseM)); b.castShadow = b.receiveShadow = true;

  /* groove: ledge, rounded inner corners, recessed wall 1.2 in, lid underside */
  const gr = [ring(.3, 17.3), ring(.85, 17.3), ring(1.12, 17.38), ring(1.2, 17.6), ring(1.2, 18.7), ring(1.12, 18.92), ring(.85, 19.0), ring(.2, 19.0)];
  add(u, new THREE.Mesh(up(K.skin(gr)), new THREE.MeshPhysicalMaterial({ color: 0xbebebb, roughness: .65 })));

  /* lid: flush with the base wall, straight to 22.4, R3 roll into a top with a 0.3 crown */
  const lid = [ring(.2, 19.0), ring(.05, 19.08), ring(0, 19.25), ring(0, 22.4)];
  for (let i = 1; i <= 12; i++){ const a = i / 12 * Math.PI / 2; lid.push(ring(3 * (1 - Math.cos(a)), 22.4 + 2.7 * Math.sin(a), .9)); }
  const top = lid[lid.length - 1];
  for (const s of [.8, .55, .3]) lid.push(top.map(([x, y]) => [x * s, y * s, 25.1 + .3 * (1 - s * s)]));
  const lm = new THREE.MeshPhysicalMaterial({ color: lidW, roughness: .45, sheen: .3, sheenRoughness: .8, sheenColor: 0xffffff });
  const l = add(u, new THREE.Mesh(up(K.skin(lid, { end: [0, 0, 25.4] })), lm)); l.castShadow = l.receiveShadow = true;

  /* four brushed-steel dome feet, 7.3 mm across, 2 mm tall */
  const fr = 3.65, fh = 2, sr = (fr * fr + fh * fh) / (2 * fh), th = Math.acos((sr - fh) / sr);
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xa7abb0, metalness: .9, roughness: .35 });
  for (const x of [-16.7, 16.7]) for (const z of [-16.7, 16.7]){
    const f = add(u, new THREE.Mesh(new THREE.SphereGeometry(sr, 32, 10, 0, Math.PI * 2, 0, th), steel), x, sr, z); f.rotation.x = Math.PI; }
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
    const put = ([x, y, z]) => { pos.push(x, y, z); const t = o.uv ? o.uv(x, y, z) : [x * .01, y * .01]; uv.push(t[0], t[1]); return pos.length / 3 - 1; };
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
      const t = i / 512, v = Math.sin(t * Math.PI * 2 * 6.5) * .5 + Math.sin(t * Math.PI * 2 * 13) * .12;
      let l = 240 + v * 2.5;
      if (ao){ const top = j / 256, side = Math.min(t, 1 - t), bot = 1 - top;            // shade under the cover's top lip and along the walls
        l *= (1 - .3 * Math.exp(-top / .035) - .1 * Math.exp(-top / .3) + .05 * Math.exp(-bot / .25)) * (1 - .12 * Math.exp(-side / .025)) * (1 - .06 * Math.exp(-bot / .03)); }
      const k = (j * 512 + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = Math.round(l); im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function noiseTex(){
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), im = x.createImageData(64, 64);
    for (let k = 0; k < im.data.length; k += 4){ const v = 90 + Math.random() * 120; im.data[k] = im.data[k + 1] = im.data[k + 2] = v; im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  return { rr, skin, bandMat, pill, pocket, bandsTex, noiseTex };
}
