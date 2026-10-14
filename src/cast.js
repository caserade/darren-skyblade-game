/* CAST: the three big Cloud Utopia monsters from Michael's approved concept sheets (numbers: data/cast.js).
     skydrake     Stormbelly / Sky Drake    flies, circles, swoops; tail whip on the ground
     heavyweight  Stormbelly / Heavyweight  telegraphed stomp + shockwave, long recovery; belly slam up close
     chomprex     Chomp Rex / Grin          ground scrape, straight charge, bite
   Bodies are sculpted skinned meshes (assets/cast_models.js, made by tools/sculpt_cast.py). Animation is done
   here as pose functions (CAST_POSES), the same ones tests/cast_export.js bakes into the rigged .glb files.
   The two Stormbellies use the 7 weight stages (src/weight.js): they eat snack bushes and swell, up to stage 7.
   combat.js hands monsters to castUpdate() / castHit(); adventure.js calls castAdvUpdate() every frame. */
const CAST = { spawn: {}, saveT: 0 };
const CD = t => DATA.cast[t];

/* ---------- model ---------- */
function castBytes(s) {
  const bin = atob(s),
    u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
const CAST_GEO = {};
function castGeometry(type, lod) {
  const key = type + (lod ? '_lod1' : '');
  if (CAST_GEO[key]) return CAST_GEO[key];
  const M = lod && window.CAST_MODELS[type].lod1 ? window.CAST_MODELS[type].lod1 : window.CAST_MODELS[type],
    n = M.count,
    q = new Uint16Array(castBytes(M.pos).buffer),
    pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < 3; k++) pos[i * 3 + k] = M.lo[k] + (q[i * 3 + k] / 65535) * (M.hi[k] - M.lo[k]);
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  const ib = castBytes(M.idx).buffer;
  g.setIndex(new T.BufferAttribute(M.idx32 ? new Uint32Array(ib) : new Uint16Array(ib), 1));
  g.setAttribute('color', new T.BufferAttribute(castBytes(M.col), 3, true));
  g.setAttribute('skinIndex', new T.BufferAttribute(new Uint16Array(castBytes(M.skI)), 4));
  g.setAttribute('skinWeight', new T.BufferAttribute(castBytes(M.skW), 4, true));
  g.setAttribute('aBelly', new T.BufferAttribute(castBytes(M.belly), 1, true));
  g.setAttribute('aFat', new T.BufferAttribute(castBytes(M.fat), 1, true));
  g.setAttribute('aFdir', new T.BufferAttribute(new Int8Array(castBytes(M.fdir).buffer), 3, true));
  if (M.uv) {
    // UV-unwrapped mesh with baked colour + normal maps: normals come from the sculpt (no seams at UV splits)
    const u = new Uint16Array(castBytes(M.uv).buffer),
      uv = new Float32Array(u.length);
    for (let i = 0; i < u.length; i++) uv[i] = u[i] / 65535;
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const nb = new Int8Array(castBytes(M.nrm).buffer),
      nf = new Float32Array(nb.length);
    for (let i = 0; i < nb.length; i++) nf[i] = nb[i] / 127;
    g.setAttribute('normal', new T.BufferAttribute(nf, 3));
    g.normalizeNormals();
    g.computeTangents();
    g.userData.tex = M.tex;
  } else g.computeVertexNormals();
  return (CAST_GEO[key] = g);
}
const CAST_TEX = {};
function castTexture(uri, srgb) {
  if (CAST_TEX[uri]) return CAST_TEX[uri];
  const t = new T.TextureLoader().load(uri);
  if (srgb) t.encoding = T.sRGBEncoding;
  t.anisotropy = 4;
  return (CAST_TEX[uri] = t);
}
function castMaterial(U, tex) {
  const m = new T.MeshPhysicalMaterial({ vertexColors: !tex, roughness: 0.66, metalness: 0, clearcoat: 0.06, clearcoatRoughness: 0.6, skinning: true });
  if (tex) {
    // baked 1K colour atlas + tangent-space normal map (scales, plates, folds, creases from the sculpt)
    m.map = castTexture(tex.map, true);
    m.normalMap = castTexture(tex.normal, false);
    m.vertexTangents = true;
    U.uBump.value = 0;
  }
  m.extensions = { derivatives: true };
  if (window.ENV_TEX) {
    m.envMap = window.ENV_TEX;
    m.envMapIntensity = 0.35;
  }
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float aBelly; attribute float aFat; attribute vec3 aFdir;
        uniform float uW; uniform float uStuff; uniform float uRip; uniform float uT; uniform vec3 uJig;
        varying vec3 vObjP; varying float vBl;`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = vec3(position);
        float bl = aBelly, bj = bl * bl;
        // weight stage: the whole body fattens a little, the belly a lot (capped: uW is at most 1)
        transformed += aFdir * (aFat * uW * 0.34 + bl * (uW * 0.75 + uStuff * 0.2));
        transformed.y -= bj * uW * 0.14;
        transformed += uJig * bl * (1.0 + uW * 0.8);
        transformed += aFdir * sin(dot(position, vec3(5.0, 7.0, 3.0)) - uT * 12.0) * uRip * bj;
        vObjP = position; vBl = bl;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uBump; uniform float uFlash; uniform vec3 uFlashC; varying vec3 vObjP; varying float vBl;
        float cScale(vec3 p) { p *= 21.0; return sin(p.x + sin(p.y * 0.7)) * sin(p.y * 1.13 + sin(p.z * 0.6)) * sin(p.z + sin(p.x * 0.8)); }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          float h = cScale(vObjP) * (1.0 - vBl * 0.85);
          vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
          vec2 dH = vec2(dFdx(h), dFdy(h));
          vec3 R1 = cross(sy, normal), R2 = cross(normal, sx);
          float det = dot(sx, R1);
          normal = normalize(abs(det) * normal - sign(det) * (dH.x * R1 + dH.y * R2) * uBump);
        }`,
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uFlashC * uFlash;')
      .replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
        { float rim = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
          reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.8, 0.85, 1.0) * rim * 0.3; }`,
      );
  };
  m.customProgramCacheKey = () => 'cast-body' + (tex ? '-tex' : '');
  return m;
}
function castEyeTex(iris, angry) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#fff8ea';
  x.fillRect(0, 0, 256, 128);
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 30);
  g.addColorStop(0, '#fff6c0');
  g.addColorStop(0.5, iris);
  g.addColorStop(1, '#5a3008');
  x.fillStyle = g;
  x.beginPath();
  x.arc(64, 64, 30, 0, TAU);
  x.fill();
  x.fillStyle = '#140a06';
  x.beginPath();
  if (angry) x.ellipse(64, 64, 7, 18, 0, 0, TAU);
  else x.arc(64, 64, 12, 0, TAU);
  x.fill();
  x.fillStyle = '#fff';
  x.beginPath();
  x.arc(55, 54, 6, 0, TAU);
  x.fill();
  const t = new T.CanvasTexture(c);
  t.encoding = T.sRGBEncoding;
  return t;
}
function castTube(pts, r0, r1, segs, rad) {
  const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))),
    g = new T.TubeGeometry(curve, segs, 1, rad, false),
    p = g.attributes.position,
    v = new T.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs,
      c = curve.getPointAt(t),
      r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c);
      p.setXYZ(k, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
}
// a tapered tube through a polyline with sharp corners (zigzag horns)
function castZigzag(pts, r0, r1, rad) {
  const path = new T.CurvePath(),
    V = pts.map(p => new T.Vector3(p[0], p[1], p[2]));
  for (let i = 0; i < V.length - 1; i++) path.add(new T.LineCurve3(V[i], V[i + 1]));
  const segs = (V.length - 1) * 8,
    g = new T.TubeGeometry(path, segs, 1, rad, false),
    p = g.attributes.position,
    v = new T.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs,
      c = path.getPointAt(Math.min(t, 0.9999)),
      r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c);
      p.setXYZ(k, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
}
// a unit box with rounded edges (teeth)
let CAST_RBOX = null;
function castRoundBox() {
  if (CAST_RBOX) return CAST_RBOX;
  const g = new T.BoxGeometry(1, 1, 1, 3, 3, 2),
    p = g.attributes.position,
    v = new T.Vector3(),
    s = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    s.copy(v).normalize().multiplyScalar(0.62);
    v.lerp(s, 0.45);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return (CAST_RBOX = g);
}
// bat wings: one skinned membrane per side on the same skeleton, plus bony arms and fingers
const WING_SPEC = {
  skydrake: {
    bones: ['wing1', 'wing2', 'wing3'],
    tips: [[2.3, 4.05, -0.95], [2.75, 3.0, -1.0], [2.35, 2.2, -0.95]],
    attach: [0.42, 2.15, -0.58],
  },
  heavyweight: {
    bones: ['wing1', 'wing2', 'wing2'],
    tips: [[1.35, 3.12, -0.92], [1.62, 2.6, -0.92], [1.3, 2.18, -0.88]],
    attach: [0.62, 2.05, -0.68],
  },
};
function buildWings(type, D, M, skeleton) {
  const S = WING_SPEC[type];
  if (!S) return;
  const C = CD(type).colors,
    BI = {};
  M.bones.forEach((b, i) => (BI[b.name] = i));
  const P0 = n => M.bones[BI[n]].pos;
  const memM = new T.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.62, side: T.DoubleSide, skinning: true, transparent: true, opacity: 0.95, sheen: new T.Color(C.wing).multiplyScalar(0.25) }),
    wingDark = new T.Color(C.wing).multiplyScalar(0.62),
    wingLight = new T.Color(C.wing).lerp(new T.Color(0xffffff), 0.18),
    boneM = toy(new T.Color(C.bone).getHex(), { roughness: 0.6, clearcoat: 0.05 });
  for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
    const m = p => [s * p[0], p[1], p[2]],
      // the tips are given before the model was stood on the ground: lift them by the same amount
      lift = p => [p[0], p[1] + (M.dy || 0), p[2]],
      // bone positions are already per side; only the tips and the body attach point are given for the left wing
      sh = P0(S.bones[0] + side),
      el = P0(S.bones[1] + side),
      wr = S.bones[2] === S.bones[1] ? P0(S.bones[1] + side).map((v, i) => v + (m(lift(S.tips[0]))[i] - v) * 0.35) : P0(S.bones[2] + side),
      tips = S.tips.map(t => m(lift(t))),
      at = m(lift(S.attach)),
      pos = [],
      sk = [],
      sw = [],
      idx = [];
    const cols = [];
    const add = (p, b1, b2, w2, shade) => {
      const k = shade === undefined ? 1 : shade,
        cc = wingDark.clone().lerp(wingLight, k);
      cols.push(cc.r, cc.g, cc.b);
      pos.push(p[0], p[1], p[2]);
      sk.push(BI[b1], BI[b2 || b1], 0, 0);
      sw.push(1 - (w2 || 0), w2 || 0, 0, 0);
      return pos.length / 3 - 1;
    };
    const fb = S.bones[2] + side,
      iW = add(wr, S.bones[1] + side, null, 0, 0),
      ring = [];
    // trailing edge: tip0 -> scallop -> tip1 -> scallop -> tip2 -> scallop -> body attach
    const pts = [tips[0], tips[1], tips[2], at];
    for (let k = 0; k < 3; k++) {
      const a = pts[k],
        b = pts[k + 1];
      for (let j = 0; j < 6; j++) {
        const u = j / 6,
          p = a.map((v, i) => v + (b[i] - v) * u),
          // scallop curves the edge in towards the wrist
          q = p.map((v, i) => v + (wr[i] - v) * Math.sin(u * PI) * 0.16);
        ring.push(k < 2 ? add(q, fb) : add(q, fb, 'chest', u));
      }
    }
    ring.push(add(at, 'chest', null, 0, 0.3));
    ring.push(add(el.map((v, i) => v * 0.6 + at[i] * 0.4), S.bones[1] + side, 'chest', 0.5, 0.2));
    ring.push(add(el, S.bones[1] + side, null, 0, 0));
    for (let i = 0; i < ring.length - 1; i++) idx.push(iW, ring[i], ring[i + 1]);
    idx.push(iW, ring[ring.length - 1], ring[0]);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(sk, 4));
    g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
    g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const mem = new T.SkinnedMesh(g, memM);
    mem.bind(skeleton, D.mesh.matrixWorld);
    mem.frustumCulled = false;
    mem.castShadow = true;
    D.body.add(mem);
    D.wingMeshes.push(mem);
    // bony arm and fingers ride their bones
    const bw = n => P0(n),
      local = (bone, p) => {
        const b = bw(bone);
        return [p[0] - b[0], p[1] - b[1], p[2] - b[2]];
      };
    const arm1 = new T.Mesh(castTube([local(S.bones[0] + side, sh), local(S.bones[0] + side, el)], 0.07, 0.05, 6, 8), boneM);
    D.B[S.bones[0] + side].add(arm1);
    const arm2 = new T.Mesh(castTube([local(S.bones[1] + side, el), local(S.bones[1] + side, wr)], 0.05, 0.04, 6, 8), boneM);
    D.B[S.bones[1] + side].add(arm2);
    for (const t of tips) {
      const f = new T.Mesh(castTube([local(fb, wr), local(fb, t)], 0.04, 0.012, 8, 6), boneM);
      D.B[fb].add(f);
      f.castShadow = true;
    }
    arm1.castShadow = arm2.castShadow = true;
  }
}
function buildCastModel(type, opts) {
  const M = window.CAST_MODELS && window.CAST_MODELS[type];
  if (!M) return null;
  const C = CD(type).colors,
    U = {
      uW: { value: 0 },
      uStuff: { value: 0 },
      uJig: { value: new T.Vector3() },
      uRip: { value: 0 },
      uT: { value: 0 },
      uBump: { value: 0.004 },
      uFlash: { value: 0 },
      uFlashC: { value: new T.Color(1, 1, 1) },
    };
  const bones = [],
    B = {},
    BW = {};
  for (const b of M.bones) {
    const bone = new T.Bone();
    bone.name = b.name;
    const pp = b.parent >= 0 ? M.bones[b.parent].pos : [0, 0, 0];
    bone.position.set(b.pos[0] - pp[0], b.pos[1] - pp[1], b.pos[2] - pp[2]);
    if (b.parent >= 0) bones[b.parent].add(bone);
    bones.push(bone);
    B[b.name] = bone;
    BW[b.name] = b.pos;
  }
  // the light mesh on Low graphics (or when asked for), the full one otherwise
  const lod = opts && opts.lod !== undefined ? opts.lod : SETTINGS.gfx === 'low' ? 1 : 0;
  const geo = castGeometry(type, lod),
    mesh = new T.SkinnedMesh(geo, castMaterial(U, geo.userData.tex));
  mesh.name = type + '_body';
  mesh.add(bones[0]);
  mesh.updateMatrixWorld(true);
  const skeleton = new T.Skeleton(bones);
  mesh.bind(skeleton);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  const root = new T.Group(),
    body = new T.Group();
  body.add(mesh);
  root.add(body);
  const D = { type, root, body, mesh, B, BW, U, skeleton, eyes: [], lids: [], wingMeshes: [], shell: new T.Object3D(), rot: {} };
  const A = M.anchors,
    at = (bone, p) => {
      const g = new T.Group(),
        b = BW[bone];
      g.position.set(p[0] - b[0], p[1] - b[1], p[2] - b[2]);
      B[bone].add(g);
      return g;
    };
  // eyes with heavy, angry lids (body coloured)
  const eyeM = new T.MeshPhysicalMaterial({ map: castEyeTex(C.eye, type !== 'heavyweight'), roughness: 0.15, clearcoat: 1 }),
    lidM = new T.MeshStandardMaterial({ color: new T.Color(C.lid).convertSRGBToLinear().multiplyScalar(0.8), roughness: 0.8, side: T.DoubleSide }),
    er = type === 'skydrake' ? 0.085 : 0.09,
    eyeG = new T.SphereGeometry(er, 24, 16),
    lidG = new T.SphereGeometry(er * 1.08, 24, 10, 0, TAU, 0, PI * 0.5);
  for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
    const g = at('head', A['eye' + side]),
      e = new T.Mesh(eyeG, eyeM);
    e.rotation.y = s * 0.35;
    g.add(e);
    const lid = new T.Mesh(lidG, lidM);
    lid.rotation.order = 'YZX';
    lid.rotation.y = s * 0.35;
    lid.userData.s = s;
    g.add(lid);
    D.eyes.push(e);
    D.lids.push(lid);
  }
  // horns: Sky Drake's are gold angular zigzags, Heavyweight's short swept ochre hooks
  const hornM = toy(new T.Color(C.horn || '#ffffff').getHex(), { roughness: 0.42, metalness: 0.3, clearcoat: 0.25 });
  if (type === 'skydrake')
    for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
      const pts = [[0, -0.05, 0.03], [s * 0.03, 0.2, -0.03], [s * 0.13, 0.3, -0.13], [s * 0.07, 0.52, -0.2], [s * 0.17, 0.66, -0.33], [s * 0.13, 0.9, -0.44]];
      at('head', A['horn' + side]).add(new T.Mesh(castZigzag(pts, 0.085, 0.008, 10), hornM));
    }
  if (type === 'heavyweight')
    for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
      const pts = [[0, -0.05, 0.03], [s * 0.15, 0.12, -0.08], [s * 0.31, 0.2, -0.24], [s * 0.43, 0.25, -0.47]];
      at('head', A['horn' + side]).add(new T.Mesh(castTube(pts, 0.13, 0.014, 24, 14), hornM));
    }
  // back spines: thick, swept-back fins with rounded edges along the neck, back and tail
  const spM = new T.MeshStandardMaterial({ color: new T.Color(A.spineCol || C.spine).convertSRGBToLinear(), roughness: 0.6, envMapIntensity: 0.4 }),
    finShape = new T.Shape();
  finShape.moveTo(-0.55, 0);
  finShape.quadraticCurveTo(-0.45, 0.55, -0.12, 1.0); // front edge curves up to the tip
  finShape.quadraticCurveTo(0.12, 0.45, 0.55, 0); // back edge sweeps down towards the tail
  finShape.lineTo(-0.55, 0);
  const spG = new T.ExtrudeGeometry(finShape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 2, curveSegments: 5 });
  spG.translate(0, -0.08, -0.08);
  const up = new T.Vector3(0, 1, 0),
    V = new T.Vector3(),
    Xa = new T.Vector3(),
    Za = new T.Vector3(),
    Mx = new T.Matrix4(),
    SP = A.spines || [];
  for (let i = 0; i < SP.length; i++) {
    const sp = SP[i],
      g = at(sp.b, sp.p),
      c = new T.Mesh(spG, spM),
      n = new T.Vector3(sp.n[0], sp.n[1], sp.n[2]).normalize(),
      a = SP[Math.max(0, i - 1)].p,
      b = SP[Math.min(SP.length - 1, i + 1)].p;
    // fin plane: up along the surface normal, length along the spine (pointing towards the tail)
    Xa.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (Xa.lengthSq() < 1e-8) Xa.set(0, 0, -1);
    Xa.addScaledVector(n, -Xa.dot(n)).normalize();
    Za.crossVectors(Xa, n).normalize();
    Mx.makeBasis(Xa, n, Za);
    c.quaternion.setFromRotationMatrix(Mx);
    c.scale.set(sp.s * 1.45, sp.s * 1.85, sp.s * 0.62);
    c.position.addScaledVector(n, -sp.s * 0.12);
    g.add(c);
  }
  // claws: one on every toe and finger, curving down like a hook
  const clawM = new T.MeshPhysicalMaterial({ color: new T.Color(A.clawCol || '#222222').convertSRGBToLinear(), roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  for (const cl of A.claws || []) {
    const g = at(cl.b, cl.p),
      d = V.set(cl.d[0], cl.d[1], cl.d[2]).normalize().clone(),
      L = cl.s * 1.25,
      down = new T.Vector3(0, -1, 0).addScaledVector(d, d.y).normalize(),
      p1 = d.clone().multiplyScalar(L * 0.55).addScaledVector(down, L * 0.05),
      p2 = d.clone().multiplyScalar(L * 0.95).addScaledVector(down, L * 0.38),
      c = new T.Mesh(castTube([[0, 0, 0], [p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z]], cl.s * 0.34, cl.s * 0.03, 8, 8), clawM);
    g.add(c);
  }
  // fangs (Sky Drake, pointing down) and tusks (Heavyweight, up out of the jaw)
  const toothM = toy(new T.Color(C.fang || C.tooth || '#ffffff').getHex(), { roughness: 0.3, clearcoat: 0.35 });
  if (type === 'skydrake' || type === 'heavyweight')
    for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
      const sd = type === 'skydrake',
        f = new T.Mesh(new T.ConeGeometry(sd ? 0.035 : 0.065, sd ? 0.15 : 0.22, 12), toothM);
      if (sd) f.rotation.x = PI;
      else {
        f.position.y = 0.09;
        f.rotation.z = -s * 0.25;
      }
      at(sd ? 'head' : 'jaw', A['fang' + side]).add(f);
    }
  if (type === 'chomprex') {
    // two even rows of big rounded teeth around the lips that meet in a clenched grin
    // (positions, widths and heights come from the sculpt script, so they sit exactly on the lip planes)
    const tg = castRoundBox();
    for (const [row, bone, dir] of [[A.teethUp, 'head', -1], [A.teethLo, 'jaw', 1]])
      for (const tt of row || []) {
        const t = new T.Mesh(tg, toothM),
          tx = -tt.d[2],
          tz = tt.d[0];
        t.scale.set(tt.w, tt.h, 0.075);
        t.rotation.y = Math.atan2(-tz, tx);
        at(bone, [tt.p[0], tt.p[1] + dir * (tt.h * 0.5 - 0.02), tt.p[2]]).add(t);
      }
  }
  root.traverse(o => o.isMesh && (o.castShadow = true));
  buildWings(type, D, M, skeleton);
  return D;
}

/* ---------- pose functions (shared by the game and the .glb export) ---------- */
// each returns { bones: { name: [rx, ry, rz] }, y, pitch, roll } for clip time t (seconds)
const sinp = (t, f, o) => Math.sin(t * TAU * f + (o || 0));
function legsWalk(Q, t, f, amp, digi, sides) {
  for (const [s, side] of sides || [[1, 'L'], [-1, 'R']]) {
    const ph = t * TAU * f + (s > 0 ? 0 : PI),
      th = -Math.sin(ph) * amp,
      sh = 0.15 + Math.max(0, Math.cos(ph)) * amp * 0.9;
    Q['thigh' + side] = [th, 0, 0];
    Q['shin' + side] = [sh, 0, 0];
    if (digi) {
      Q['ankle' + side] = [-sh * 0.7, 0, 0];
      Q['toe' + side] = [-(th + sh * 0.3) * 0.8, 0, 0];
    } else Q['foot' + side] = [-(th + sh) * 0.85, 0, 0];
  }
}
function tailWave(Q, n, t, f, amp, lift) {
  for (let i = 1; i <= n; i++) Q['tail' + i] = [lift || 0, Math.sin(t * TAU * f - i * 0.7) * amp * (0.5 + i / n), 0];
}
function wingsFlap(Q, t, f, amp, spread) {
  for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
    const a = Math.sin(t * TAU * f);
    Q['wing1' + side] = [0, s * (spread || 0), s * (a * amp)];
    Q['wing2' + side] = [0, s * 0.1, s * Math.sin(t * TAU * f - 0.6) * amp * 0.5];
    Q['wing3' + side] = [0, 0, s * Math.sin(t * TAU * f - 1.1) * amp * 0.4];
  }
}
function wingsFold(Q, k) {
  for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
    Q['wing1' + side] = [0, s * 0.9 * k, -s * 0.3 * k];
    Q['wing2' + side] = [0, s * 0.6 * k, -s * 0.4 * k];
    Q['wing3' + side] = [0, s * 0.4 * k, -s * 0.3 * k];
  }
}
const env = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const CAST_CLIPS = {
  // name: [duration (s), loops, gameplay events { name: time }]
  all: {
    idle: [2.4, true],
    walk: [1.2, true],
    turn: [1.0, true],
    hit: [0.45, false],
    stagger: [1.6, true],
    recover: [0.8, false],
    death: [2.2, false, { down: 1.2 }],
  },
  skydrake: {
    flyIdle: [0.8, true],
    takeoff: [1.0, false, { liftoff: 0.35 }],
    land: [0.6, false, { touchdown: 0.45 }],
    attackWindup: [0.9, false],
    attack: [0.6, false, { impact: 0.6 }],
    tailWindup: [0.7, false],
    tailWhip: [0.5, false, { hit: 0.2 }],
  },
  heavyweight: {
    heavyWalk: [1.5, true],
    stompWindup: [1.1, false, { stomp: 1.1 }],
    stompImpact: [0.35, false, { impact: 0.05 }],
    stompRecovery: [1.9, true],
    slamWindup: [0.6, false],
    slam: [0.45, false, { impact: 0.2 }],
  },
  chomprex: {
    chargeWindup: [0.8, false, { go: 0.8 }],
    charge: [0.5, true],
    biteWindup: [0.45, false],
    bite: [0.3, false, { snap: 0.08 }],
    recovery: [1.2, true],
  },
};
function castPose(type, clip, t) {
  const Q = {},
    R = { bones: Q, y: 0, pitch: 0, roll: 0 },
    A = type === 'skydrake',
    H = type === 'heavyweight',
    X = type === 'chomprex',
    digi = !H,
    nt = A ? 6 : 5,
    neck = A ? ['neck1', 'neck2', 'neck3'] : ['neck'];
  const breathe = Math.sin(t * TAU * 0.45);
  const base = () => {
    Q.spine = [breathe * 0.02, 0, 0];
    Q.chest = [breathe * 0.015, 0, 0];
    tailWave(Q, nt, t, 0.35, 0.06, 0);
    if (A) {
      Q.neck1 = [0.02 * breathe, 0, 0];
      Q.neck3 = [-0.03 * breathe, 0, 0];
      wingsFold(Q, 0.35);
    }
    if (H) wingsFold(Q, 0.2);
    for (const side of ['L', 'R']) {
      const s = side === 'L' ? 1 : -1;
      Q['arm' + side] = [-0.1 + breathe * 0.03, 0, s * (H ? 0.25 : 0.12)];
      Q['forearm' + side] = [X ? -0.5 : -0.3, 0, 0];
    }
    Q.jaw = [X ? 0.05 + Math.max(0, breathe) * 0.04 : 0.02, 0, 0];
    R.y = breathe * 0.015;
  };
  base();
  switch (clip) {
    case 'idle':
      Q.head = [Math.sin(t * TAU * 0.2) * 0.05, Math.sin(t * TAU * 0.13) * 0.15, 0];
      break;
    case 'walk':
    case 'heavyWalk':
    case 'turn': {
      const f = clip === 'turn' ? 1.0 : H ? 1 / 1.5 : 1 / 1.2,
        amp = clip === 'turn' ? 0.22 : H ? 0.38 : 0.5;
      legsWalk(Q, t, f, amp, digi);
      R.y = Math.abs(Math.sin(t * TAU * f)) * (H ? 0.1 : 0.07) - (H ? 0.05 : 0.03);
      R.roll = Math.sin(t * TAU * f) * (H ? 0.07 : 0.035);
      Q.hips = [0, Math.sin(t * TAU * f) * 0.08, Math.sin(t * TAU * f) * (H ? 0.06 : 0.03)];
      Q.spine = [0.02, -Math.sin(t * TAU * f) * 0.05, 0];
      tailWave(Q, nt, t, f, 0.12, X ? 0.05 : 0);
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) Q['arm' + side] = [Math.sin(t * TAU * f + (s > 0 ? PI : 0)) * 0.25, 0, s * (H ? 0.25 : 0.12)];
      if (clip === 'turn') Q.spine = [0, 0.25, 0];
      Q.head = [0.03 * Math.sin(t * TAU * f * 2), clip === 'turn' ? 0.3 : 0, 0];
      break;
    }
    case 'hit': {
      const k = Math.sin(env(t, 0, 0.45) * PI);
      Q.spine = [-0.22 * k, 0, 0.08 * k];
      Q.head = [-0.35 * k, 0.2 * k, 0];
      Q.jaw = [0.35 * k, 0, 0];
      R.pitch = -0.06 * k;
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) Q['arm' + side] = [-0.4 * k, 0, s * 0.5 * k];
      break;
    }
    case 'stagger':
      Q.spine = [0.25, 0, Math.sin(t * TAU * 1.25) * 0.14];
      Q.head = [0.45, Math.sin(t * TAU * 0.6) * 0.4, Math.sin(t * TAU * 1.25) * 0.15];
      Q.jaw = [0.35, 0, 0];
      R.y = -0.18;
      R.roll = Math.sin(t * TAU * 0.625) * 0.08;
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
        Q['thigh' + side] = [-0.35, 0, s * 0.08];
        Q['shin' + side] = [0.55, 0, 0];
        if (digi) Q['ankle' + side] = [-0.3, 0, 0];
        Q['arm' + side] = [0.4, 0, s * 0.35];
      }
      tailWave(Q, nt, t, 0.6, 0.1, -0.05);
      break;
    case 'recover': {
      const k = 1 - env(t, 0, 0.8);
      Q.spine = [0.2 * k, 0, 0];
      Q.head = [0.35 * k, Math.sin(t * TAU * 2.5) * 0.35 * k, 0];
      R.y = -0.15 * k;
      break;
    }
    case 'death': {
      const k = env(t, 0, 1.2),
        e = k * k * (3 - 2 * k);
      R.roll = e * 1.45;
      R.y = -e * 0.35;
      R.pitch = Math.sin(env(t, 0, 0.4) * PI) * -0.15;
      Q.head = [-0.4 * Math.sin(env(t, 0, 0.5) * PI) + 0.25 * e, 0, 0.3 * e];
      Q.jaw = [0.5 * e, 0, 0];
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
        Q['thigh' + side] = [-0.4 * e, 0, s * 0.2 * e];
        Q['shin' + side] = [0.3 * e, 0, 0];
        Q['arm' + side] = [0.2 * e, 0, s * 0.6 * e];
      }
      tailWave(Q, nt, t * 0.3, 0.2, 0.05 * (1 - e), 0);
      if (WING_SPEC[type]) wingsFold(Q, 0.35 + e * 0.4);
      break;
    }
    // ----- Sky Drake
    case 'flyIdle':
      wingsFlap(Q, t, 1.25, 0.75, 0.1);
      legsTuck(Q);
      R.y = Math.sin(t * TAU * 1.25 + 1.6) * 0.12;
      R.pitch = 0.12;
      tailWave(Q, nt, t, 0.6, 0.08, 0.05);
      Q.neck1 = [-0.1, 0, 0];
      Q.head = [0.15, 0, 0];
      break;
    case 'takeoff': {
      const k = env(t, 0, 0.35);
      if (t < 0.35) {
        for (const side of ['L', 'R']) {
          Q['thigh' + side] = [-0.55 * k, 0, 0];
          Q['shin' + side] = [0.95 * k, 0, 0];
          Q['ankle' + side] = [-0.5 * k, 0, 0];
        }
        R.y = -0.45 * k;
        wingsFlap(Q, 0.25, 1, 1.0 * k, 0.1);
      } else {
        wingsFlap(Q, t - 0.35, 1.6, 0.95, 0.1);
        legsTuck(Q, env(t, 0.35, 1));
        R.pitch = 0.15;
      }
      break;
    }
    case 'land': {
      const k = env(t, 0, 0.45);
      wingsFlap(Q, 0.5 + t * 0.3, 1, 0.6 * (1 - k), 0.3);
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) Q['wing1' + side] = [0, s * -0.4, s * (0.7 - 0.6 * k)];
      for (const side of ['L', 'R']) {
        Q['thigh' + side] = [-0.5 + 0.5 * k, 0, 0];
        Q['shin' + side] = [0.3 + 0.5 * Math.sin(k * PI), 0, 0];
      }
      R.y = -0.3 * Math.sin(env(t, 0.4, 0.6) * PI);
      R.pitch = -0.15 * (1 - k);
      break;
    }
    case 'attackWindup': {
      const k = env(t, 0, 0.5);
      wingsFlap(Q, t, 1.8, 0.5, -0.1);
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) Q['wing1' + side] = [0, s * -0.2, s * (0.9 + Math.sin(t * TAU * 1.8) * 0.4)];
      R.pitch = -0.28 * k;
      Q.neck1 = [-0.1 * k, 0, 0];
      Q.neck2 = [-0.08 * k, 0, 0];
      Q.neck4 = [0.25 * k, 0, 0];
      Q.head = [0.15 * k, 0, 0];
      Q.jaw = [0.55 * k, 0, 0];
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
        Q['thigh' + side] = [-0.9 * k, 0, s * 0.1];
        Q['shin' + side] = [0.4, 0, 0];
        Q['arm' + side] = [-0.9 * k, 0, s * 0.4 * k];
      }
      tailWave(Q, nt, t, 1, 0.15, 0.2);
      break;
    }
    case 'attack': {
      const k = env(t, 0, 0.6);
      wingsFold(Q, 0.8);
      R.pitch = 0.55 - k * 0.6;
      Q.neck1 = [0.25, 0, 0];
      Q.neck2 = [0.15, 0, 0];
      Q.head = [0.1, 0, 0];
      Q.jaw = [0.6, 0, 0];
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
        Q['thigh' + side] = [-1.1, 0, s * 0.15];
        Q['shin' + side] = [0.3, 0, 0];
        Q['arm' + side] = [-1.2, 0, s * 0.3];
      }
      tailWave(Q, nt, t, 2, 0.08, 0.15);
      break;
    }
    case 'tailWindup': {
      const k = env(t, 0, 0.7);
      Q.spine = [0, 0.5 * k, 0];
      Q.hips = [0, 0.3 * k, 0];
      for (let i = 1; i <= nt; i++) Q['tail' + i] = [0.08, 0.32 * k, 0];
      Q.head = [0, -0.6 * k, 0];
      Q.neck2 = [0, -0.3 * k, 0];
      break;
    }
    case 'tailWhip': {
      const k = env(t, 0, 0.3);
      Q.spine = [0, 0.5 - 1.1 * k, 0];
      Q.hips = [0, 0.3 - 0.8 * k, 0];
      for (let i = 1; i <= nt; i++) Q['tail' + i] = [0.05, 0.32 - 0.75 * env(t, 0.02 * i, 0.25 + 0.03 * i), 0];
      Q.head = [0, 0.2 * k, 0];
      break;
    }
    // ----- Heavyweight
    case 'stompWindup': {
      const k = env(t, 0, 1.1),
        e = k * k * (3 - 2 * k);
      Q.thighL = [-1.0 * e, 0, 0.12 * e];
      Q.shinL = [1.05 * e, 0, 0];
      Q.footL = [-0.2 * e, 0, 0];
      Q.thighR = [0.05, 0, -0.05];
      R.roll = -0.12 * e;
      R.pitch = -0.1 * e;
      R.y = 0.12 * e;
      Q.armL = [-0.3 * e, 0, 0.8 * e];
      Q.armR = [-0.3 * e, 0, -0.8 * e];
      Q.head = [-0.3 * e, 0, 0];
      Q.jaw = [0.3 * e, 0, 0];
      tailWave(Q, nt, t, 0.8, 0.08, 0.15 * e);
      break;
    }
    case 'stompImpact': {
      const k = env(t, 0, 0.08),
        s2 = Math.sin(env(t, 0, 0.35) * PI);
      Q.thighL = [-1.0 + 1.1 * k, 0, 0.12];
      Q.shinL = [1.05 - 1.0 * k, 0, 0];
      R.y = -0.18 * s2;
      R.roll = -0.12 * (1 - k);
      Q.spine = [0.2 * s2, 0, 0];
      Q.armL = [0.2, 0, 0.5 * (1 - k)];
      Q.armR = [0.2, 0, -0.5 * (1 - k)];
      Q.jaw = [0.45, 0, 0];
      Q.head = [0.25 * s2, 0, 0];
      break;
    }
    case 'stompRecovery': {
      const pant = Math.sin(t * TAU * 1.6);
      Q.spine = [0.28, 0, 0];
      Q.chest = [0.1 + pant * 0.04, 0, 0];
      Q.head = [0.38, Math.sin(t * TAU * 0.3) * 0.15, 0];
      Q.jaw = [0.3 + pant * 0.1, 0, 0];
      R.y = -0.12;
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
        Q['arm' + side] = [0.35, 0, s * 0.2];
        Q['forearm' + side] = [-0.1, 0, 0];
        Q['thigh' + side] = [-0.2, 0, s * 0.06];
        Q['shin' + side] = [0.3, 0, 0];
      }
      tailWave(Q, nt, t, 0.4, 0.04, -0.08);
      break;
    }
    case 'slamWindup': {
      const k = env(t, 0, 0.6);
      Q.spine = [-0.3 * k, 0, 0];
      R.pitch = -0.18 * k;
      Q.head = [-0.2 * k, 0, 0];
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) Q['arm' + side] = [0.5 * k, 0, s * 0.6 * k];
      break;
    }
    case 'slam': {
      const k = env(t, 0, 0.2),
        b = Math.sin(env(t, 0, 0.45) * PI);
      Q.spine = [-0.3 + 0.75 * k, 0, 0];
      R.pitch = -0.18 + 0.45 * k;
      R.y = -0.1 * b;
      Q.head = [0.2 * k, 0, 0];
      Q.jaw = [0.4 * k, 0, 0];
      for (const [s, side] of [[1, 'L'], [-1, 'R']]) Q['arm' + side] = [-0.7 * k, 0, s * 0.3];
      break;
    }
    // ----- Chomp Rex
    case 'chargeWindup': {
      const k = env(t, 0, 0.25);
      R.pitch = 0.18 * k;
      R.y = -0.25 * k;
      for (const side of ['L', 'R']) {
        Q['thigh' + side] = [-0.35 * k, 0, 0];
        Q['shin' + side] = [0.65 * k, 0, 0];
        Q['ankle' + side] = [-0.35 * k, 0, 0];
      }
      Q.thighR = [-0.35 * k + Math.sin(t * TAU * 3.5) * 0.35, 0, 0];
      Q.neck = [0.25 * k, 0, 0];
      Q.head = [-0.15 * k, 0, 0];
      Q.jaw = [0.55 * Math.sin(env(t, 0.15, 0.7) * PI), 0, 0];
      tailWave(Q, nt, t, 1.2, 0.1, 0.12 * k);
      break;
    }
    case 'charge':
      legsWalk(Q, t, 2, 0.75, true);
      R.pitch = 0.2;
      R.y = Math.abs(Math.sin(t * TAU * 2)) * 0.14 - 0.08;
      Q.neck = [0.3, 0, 0];
      Q.head = [-0.1, 0, 0];
      Q.jaw = [0.2, 0, 0];
      tailWave(Q, nt, t, 2, 0.06, 0.1);
      break;
    case 'biteWindup': {
      const k = env(t, 0, 0.45);
      Q.neck = [-0.25 * k, 0, 0];
      Q.head = [-0.3 * k, 0, 0];
      Q.jaw = [0.85 * k, 0, 0];
      R.pitch = -0.08 * k;
      break;
    }
    case 'bite': {
      const k = env(t, 0, 0.08);
      Q.neck = [-0.25 + 0.6 * k, 0, 0];
      Q.head = [-0.3 + 0.55 * k, 0, 0];
      Q.jaw = [0.85 * (1 - k), 0, 0];
      R.pitch = 0.1 * k;
      break;
    }
    case 'recovery': {
      const pant = Math.sin(t * TAU * 1.8);
      Q.neck = [0.2, 0, 0];
      Q.head = [0.15, Math.sin(t * TAU * 0.4) * 0.2, 0];
      Q.jaw = [0.3 + pant * 0.12, 0, 0];
      R.y = -0.1;
      break;
    }
  }
  // brows: angry by default, furrowed hard on every wind-up, raised when staggered or dying
  const furrow = /Windup|windup/.test(clip) ? 0.32 : clip === 'stagger' || clip === 'death' || clip === 'recover' ? -0.18 : clip === 'hit' ? 0.25 : 0.12;
  Q.browL = [0, 0, furrow];
  Q.browR = [0, 0, -furrow];
  // belly: breathes, and bounces on impacts (the game adds its spring wobble on top)
  const thud = clip === 'stompImpact' || clip === 'land' || clip === 'slam' ? Math.sin(env(t, 0, 0.35) * PI * 2) * 0.05 : 0;
  Q.belly = [breathe * 0.015 + thud + (clip.indexOf('alk') > 0 || clip === 'charge' ? Math.sin(t * TAU * 2) * 0.02 : 0), 0, 0];
  return R;
}
function legsTuck(Q, k) {
  k = k === undefined ? 1 : k;
  for (const [s, side] of [[1, 'L'], [-1, 'R']]) {
    Q['thigh' + side] = [-0.65 * k, 0, s * 0.08 * k];
    Q['shin' + side] = [0.95 * k, 0, 0];
    Q['ankle' + side] = [-0.45 * k, 0, 0];
    Q['toe' + side] = [0.3 * k, 0, 0];
  }
}
function castClipLen(type, clip) {
  const c = CAST_CLIPS.all[clip] || CAST_CLIPS[type][clip];
  return c ? c[0] : 1;
}
function castApplyPose(D, R, rdt, speed) {
  const k = rdt === undefined ? 1 : Math.min(1, rdt * (speed || 12));
  for (const n in D.B) {
    const b = D.B[n],
      q = R.bones[n] || [0, 0, 0];
    b.rotation.x += (q[0] - b.rotation.x) * k;
    b.rotation.y += (q[1] - b.rotation.y) * k;
    b.rotation.z += (q[2] - b.rotation.z) * k;
  }
  D.body.position.y += (R.y - D.body.position.y) * k;
  D.body.rotation.x += (R.pitch - D.body.rotation.x) * k;
  D.body.rotation.z += (R.roll - D.body.rotation.z) * k;
}

/* ---------- monster definitions for combat.js ---------- */
for (const type in DATA.cast) {
  const c = DATA.cast[type];
  EDEF[type] = { name: c.name, hp: c.hp, r: c.r, h: c.h, w: 9, sc: c.scale || 1, monster: true, build: () => buildCastModel(type) };
  DATA.enemies[type] = { name: c.name, hp: c.hp, poise: c.poise };
}
function castWeight(e) {
  const W = e.c.weight;
  return W ? stageInfo(W.stages, e.wt) : null;
}
function castStageMul(e, key) {
  const W = e.c.weight,
    SI = castWeight(e);
  return W && SI ? 1 + (W.perStage[key] || 0) * SI.k : 1;
}

/* ---------- AI (called from updateEnemy for monsters) ---------- */
function castSet(e, st, clip) {
  e.st = st;
  e.t = 0;
  e.clip = clip || st;
  e.ct = 0;
}
function castInit(e) {
  e.c = CD(e.type);
  e.init = true;
  e.ct = 0;
  e.clip = 'idle';
  e.J = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
  e.rip = 0;
  e.blinkT = 2;
  UNLOCKS.cast = UNLOCKS.cast || {};
  e.wt = e.c.weight ? (UNLOCKS.cast[e.type] === undefined ? e.c.weight.start : UNLOCKS.cast[e.type]) : 0;
  e.stage = castWeight(e) ? castWeight(e).k : 0;
  e.vis = castWeight(e) ? castWeight(e).size : 0;
  e.baseMax = e.max;
  e.max = e.hp = Math.round(e.baseMax * castStageMul(e, 'hp'));
  e.fly = 0;
  e.aware = false;
  e.cd = 2;
  e.phaseT = 0;
  castSet(e, 'spawn', 'idle');
}
function castKick(e, x, y, z, r) {
  e.J.vx += x;
  e.J.vy += y;
  e.J.vz += z;
  e.rip = Math.min(0.025, e.rip + (r || 0));
}
function castHit(e, dmg, A, nx, nz) {
  // big monsters only stagger when their poise breaks; otherwise they flinch and keep going
  e.poiseV -= dmg * (A.hs >= 6 || A.kd ? 1.6 : 1);
  e.flinchT = 0.25;
  castKick(e, -nx * 0.4, -0.3, -nz * 0.4, 0.008);
  if (e.poiseV <= 0 && e.st !== 'stagger' && e.st !== 'dead') {
    e.poiseV = e.poise * castStageMul(e, 'hp');
    if (e.fly > 0.5) e.fly = 0; // a stunned flyer drops out of the sky
    castSet(e, 'stagger');
    floatText(e.x, e.y + e.h + 0.6, e.z, 'STAGGER!', 'big');
    G.shake = Math.max(G.shake || 0, 0.3);
  }
  e.aware = true;
  return dmg;
}
function castDamage(e, key) {
  return e.c.attacks[key].dmg * castStageMul(e, 'damage');
}
function castTurn(e, a, k, dt) {
  e.face += angDiff(e.face, a) * Math.min(1, k * dt);
}
function castMove(e, dx, dz, sp, dt) {
  const d = Math.hypot(dx, dz);
  if (d < 0.01) return 0;
  const m = Math.min(d, sp * dt);
  e.x += (dx / d) * m;
  e.z += (dz / d) * m;
  return m;
}
function castUpdate(e, s) {
  const dt = s / 60,
    M = e.m;
  if (!M) return;
  if (!e.init) castInit(e);
  const c = e.c,
    dP = Math.hypot(P.x - e.x, P.z - e.z),
    toP = Math.atan2(P.x - e.x, P.z - e.z),
    sp = c.speed * castStageMul(e, 'speed'),
    pAlive = P.st !== 'dead' && G.mode === 'play';
  e.t += dt;
  e.ct += dt;
  // ----- death
  if (!e.alive) {
    if (e.st !== 'dead') castSet(e, 'dead', 'death');
    e.fly = Math.max(0, e.fly - dt * 2);
    e.y = Math.max(0, e.y - dt * 6);
    if (e.t > 3.2) {
      const k = Math.max(0, 1 - (e.t - 3.2) / 0.8);
      M.root.scale.setScalar(e.sc * (0.2 + 0.8 * k));
      if (k <= 0) {
        scene.remove(M.root);
        e.gone = true;
      }
    }
    castAnimate(e, dt);
    return;
  }
  // ----- weight: slim down slowly, eat bushes (Stormbellies)
  const W = c.weight;
  if (W) {
    e.wt = Math.max(0, e.wt - (W.slimPerMinute / 60) * dt);
    const SI = castWeight(e);
    if (SI.k !== e.stage) {
      const ratio = e.hp / e.max;
      e.max = Math.round(e.baseMax * castStageMul(e, 'hp'));
      e.hp = Math.max(1, Math.round(e.max * ratio));
      if (SI.k > e.stage && dP < 40) {
        floatText(e.x, e.y + e.h + 1, e.z, c.name.split(' ').pop() + ' grew: ' + SI.name + ' (' + (SI.k + 1) + '/' + WEIGHT_STAGES + ')', 'big');
        castKick(e, 0, -1.4, 0.4, 0.02);
      }
      e.stage = SI.k;
    }
    e.vis = damp(e.vis, SI.size, 1.5, dt);
    CAST.saveT -= dt;
    if (CAST.saveT <= 0) {
      CAST.saveT = 6;
      UNLOCKS.cast[e.type] = Math.round(e.wt * 1000) / 1000;
      saveUnlocks();
    }
  }
  const R = c.attacks,
    rMul = castStageMul(e, 'radius');
  e.cd = Math.max(0, e.cd - dt);
  if (!e.aware && pAlive && dP < c.aggro && P.y < 12) {
    e.aware = true;
    banner(c.name, W ? 'Weight stage ' + (castWeight(e).k + 1) + '/' + WEIGHT_STAGES + ': ' + castWeight(e).name : 'Big monster', 140);
    sfx('roar');
  }
  if (e.aware && (dP > c.aggro * 2.2 || !pAlive)) e.aware = false;
  switch (e.st) {
    case 'spawn':
      M.root.scale.setScalar(e.sc * Math.min(1, 0.2 + e.t * 1.6));
      if (e.t > 0.5) castSet(e, 'idle');
      break;
    case 'idle':
    case 'roam': {
      // calm: wander, or waddle to a ripe snack bush and eat it
      if (e.aware) {
        castSet(e, 'chase', 'walk');
        break;
      }
      let goal = e.goal;
      if (W && !e.bush && e.wt < 1 && typeof DUMP !== 'undefined') {
        for (const b of DUMP.bushes) if (b.ripe && b.def.island === c.island) e.bush = b;
      }
      if (e.bush) {
        if (!e.bush.ripe) e.bush = null;
        else goal = [e.bush.def.x, e.bush.def.z];
      }
      if (!goal || Math.hypot(goal[0] - e.x, goal[1] - e.z) < 0.5) {
        if (e.bush && goal && Math.hypot(goal[0] - e.x, goal[1] - e.z) < 2.2) {
          castSet(e, 'eat', 'idle');
          break;
        }
        if (e.t > 3) {
          const I = e.home,
            a = rnd(TAU),
            r = rnd(0.1, 0.55) * I.r;
          e.goal = [I.x + Math.cos(a) * r, I.z + Math.sin(a) * r];
          e.t = 0;
        }
        e.clip = 'idle';
      } else {
        const dx = goal[0] - e.x,
          dz = goal[1] - e.z;
        if (Math.hypot(dx, dz) < (e.bush ? 2.0 : 0.5)) {
          if (e.bush) castSet(e, 'eat', 'idle');
          else e.goal = null;
        } else {
          castTurn(e, Math.atan2(dx, dz), 2.5, dt);
          castMove(e, Math.sin(e.face), Math.cos(e.face), sp * 0.5, dt);
          e.clip = e.type === 'heavyweight' ? 'heavyWalk' : 'walk';
          e.walkSp = sp * 0.5;
        }
      }
      break;
    }
    case 'eat': {
      const b = e.bush;
      e.clip = 'idle';
      e.eating = true;
      if (b) castTurn(e, Math.atan2(b.def.x - e.x, b.def.z - e.z), 4, dt);
      if (e.aware) {
        e.eating = false;
        castSet(e, 'chase', 'walk');
        break;
      }
      if (e.t > 2.2) {
        e.eating = false;
        if (b && b.ripe) {
          b.ripe = false;
          b.t = b.def.regrow;
          b.shake = 1;
          b.fruits.forEach(f => (f.visible = false));
          e.wt = Math.min(1, e.wt + W.perBush);
          castKick(e, 0, -0.6, 0.8, 0.012);
          if (dP < 30) floatText(e.x, e.y + e.h + 0.4, e.z, '*CHOMP*', 'say');
        }
        e.bush = null;
        castSet(e, 'idle');
      }
      break;
    }
    case 'chase': {
      if (!e.aware) {
        castSet(e, 'idle');
        break;
      }
      castTurn(e, toP, 3, dt);
      e.clip = e.type === 'heavyweight' ? 'heavyWalk' : 'walk';
      if (e.type === 'skydrake') {
        if (e.phaseT > R.groundTime && e.cd <= 0) {
          e.phaseT = 0;
          castSet(e, 'takeoff');
          break;
        }
        e.phaseT += dt;
        if (dP < R.tail.r * rMul * 0.85 && e.cd <= 0) {
          castSet(e, 'tailWind', 'tailWindup');
          mark(e.x, e.z, R.tail.r * rMul, R.tail.wind * 60, 0xff2a10);
          break;
        }
        if (dP > 3) castMove(e, Math.sin(e.face), Math.cos(e.face), sp, dt);
        else e.clip = 'idle';
      } else if (e.type === 'heavyweight') {
        if (e.cd <= 0 && dP < R.slam.r * rMul && Math.random() < 0.5) {
          castSet(e, 'slamWind', 'slamWindup');
          break;
        }
        if (e.cd <= 0 && dP < 7) {
          castSet(e, 'stompWind', 'stompWindup');
          mark(e.x, e.z, R.stomp.r * rMul, R.stomp.wind * 60, 0xff2a10);
          break;
        }
        if (dP > 2.4) castMove(e, Math.sin(e.face), Math.cos(e.face), sp, dt);
        else e.clip = 'idle';
      } else {
        if (e.cd <= 0 && dP < R.bite.r) {
          castSet(e, 'biteWind', 'biteWindup');
          break;
        }
        if (e.cd <= 0 && dP > 5 && dP < 18 && Math.abs(angDiff(e.face, toP)) < 0.3) {
          castSet(e, 'chargeWind', 'chargeWindup');
          e.chargeDir = toP;
          sfx('roar');
          break;
        }
        if (dP > 3) castMove(e, Math.sin(e.face), Math.cos(e.face), sp, dt);
        else e.clip = 'idle';
      }
      e.walkSp = sp;
      break;
    }
    // ----- Sky Drake
    case 'takeoff':
      if (e.t > 0.35) {
        e.fly = Math.min(1, e.fly + dt * 1.6);
        if (e.t < 0.45) burst(puffs, e.x, 0.3, e.z, 10, 5, 0.6, 0xffffff, 1.4, { a: 0.6 });
      }
      if (e.t > 1.0) castSet(e, 'fly', 'flyIdle');
      break;
    case 'fly': {
      // circle above Darren, then swoop
      e.fly = 1;
      const a = Math.atan2(e.x - P.x, e.z - P.z) + dt * 0.45,
        gx = P.x + Math.sin(a) * 9,
        gz = P.z + Math.cos(a) * 9;
      castMove(e, gx - e.x, gz - e.z, sp * 2.2, dt);
      castTurn(e, Math.atan2(gx - e.x, gz - e.z) + 0.3, 3, dt);
      if (e.t > R.flyTime || !e.aware) {
        if (!e.aware) castSet(e, 'land');
        else {
          castSet(e, 'swoopWind', 'attackWindup');
          e.target = [P.x, P.z];
        }
      }
      break;
    }
    case 'swoopWind':
      castTurn(e, toP, 5, dt);
      if (e.t < R.swoop.wind - 0.3) e.target = [P.x, P.z];
      if (Math.floor(e.t * 10) !== Math.floor((e.t - dt) * 10)) mark(e.target[0], e.target[1], R.swoop.r * rMul, 8, 0xff2a10);
      if (e.t > R.swoop.wind) {
        castSet(e, 'swoop', 'attack');
        e.from = [e.x, e.z];
      }
      break;
    case 'swoop': {
      const k = Math.min(1, e.t / 0.6);
      e.x = e.from[0] + (e.target[0] - e.from[0]) * k;
      e.z = e.from[1] + (e.target[1] - e.from[1]) * k;
      e.fly = 1 - k;
      castTurn(e, Math.atan2(e.target[0] - e.from[0], e.target[1] - e.from[1]), 8, dt);
      if (k >= 1) {
        const rr = R.swoop.r * rMul;
        ring(e.x, 0.12, e.z, 0.5, rr * 3, 0.4, 0x9fd8ff, 0);
        dust(e.x, e.z, 22);
        sfx('slam');
        G.shake = Math.max(G.shake || 0, 0.5);
        castKick(e, 0, -1.6, 0, 0.02);
        if (Math.hypot(P.x - e.x, P.z - e.z) < rr && P.y < 2.2) hurtP(e, castDamage(e, 'swoop'), e.x, e.z, true);
        castSet(e, 'land');
        e.cd = 2.5;
      }
      break;
    }
    case 'land':
      e.fly = Math.max(0, e.fly - dt * 2.5);
      if (e.t > 0.6 && e.fly <= 0) {
        castSet(e, 'recover', 'recover');
        e.recT = 1.0;
      }
      break;
    case 'tailWind':
      if (e.t > R.tail.wind) castSet(e, 'tailWhip', 'tailWhip');
      break;
    case 'tailWhip':
      if (!e.hitDone && e.t > 0.2) {
        e.hitDone = true;
        sfx('heavy');
        if (dP < R.tail.r * rMul && P.y < 1.6) hurtP(e, castDamage(e, 'tail'), e.x, e.z, true);
      }
      if (e.t > 0.5) {
        e.hitDone = false;
        castSet(e, 'recover');
        e.recT = R.tail.rec;
        e.cd = 2;
      }
      break;
    // ----- Heavyweight
    case 'stompWind':
      castTurn(e, toP, 1.5, dt);
      if (e.t > R.stomp.wind) {
        castSet(e, 'stomp', 'stompImpact');
        const rr = R.stomp.r * rMul;
        ring(e.x, 0.12, e.z, 0.6, R.stomp.ring * 0.6, 1.5, 0xffd08a, castDamage(e, 'stomp') * 0.6);
        dust(e.x, e.z, 30);
        sfx('slam');
        G.shake = Math.max(G.shake || 0, 0.8);
        castKick(e, 0, -2.2, 0, 0.03);
        if (dP < rr && P.y < 1) hurtP(e, castDamage(e, 'stomp'), e.x, e.z, true);
      }
      break;
    case 'stomp':
      if (e.t > 0.35) {
        castSet(e, 'recover', 'stompRecovery');
        e.recT = R.stomp.rec;
        e.cd = 1.5;
      }
      break;
    case 'slamWind':
      castTurn(e, toP, 3, dt);
      if (e.t > R.slam.wind) castSet(e, 'slam', 'slam');
      break;
    case 'slam':
      if (!e.hitDone && e.t > 0.2) {
        e.hitDone = true;
        castKick(e, 0, -1.2, 1.5, 0.02);
        dust(e.x + Math.sin(e.face) * 1.5, e.z + Math.cos(e.face) * 1.5, 14);
        sfx('heavy');
        const fx = e.x + Math.sin(e.face) * 1.4,
          fz = e.z + Math.cos(e.face) * 1.4;
        if (Math.hypot(P.x - fx, P.z - fz) < R.slam.r * rMul && P.y < 1.5) hurtP(e, castDamage(e, 'slam'), e.x, e.z, true);
      }
      if (e.t > 0.45) {
        e.hitDone = false;
        castSet(e, 'recover');
        e.recT = R.slam.rec;
        e.cd = 1.2;
      }
      break;
    // ----- Chomp Rex
    case 'chargeWind':
      castTurn(e, e.chargeDir, 6, dt);
      if (e.t < 0.5) e.chargeDir = toP;
      if (Math.random() < 0.3) dust(e.x - Math.sin(e.face) * 0.8, e.z - Math.cos(e.face) * 0.8, 1);
      if (e.t > R.charge.wind) castSet(e, 'charge', 'charge');
      break;
    case 'charge': {
      const moved = castMove(e, Math.sin(e.face), Math.cos(e.face), R.charge.speed, dt);
      if (Math.random() < 0.5) dust(e.x, e.z, 1);
      const hit = Math.hypot(P.x - e.x, P.z - e.z) < e.r + 0.9 && P.y < 2;
      if (hit && !e.hitDone) {
        e.hitDone = true;
        hurtP(e, castDamage(e, 'charge'), e.x, e.z, true);
      }
      if (e.t > R.charge.time || (levelEnemyAtEdge(e) && e.t > 0.2) || moved < 1e-3) {
        e.hitDone = false;
        castSet(e, 'biteWind', 'biteWindup');
      }
      break;
    }
    case 'biteWind':
      castTurn(e, toP, 4, dt);
      if (e.t > R.bite.wind) castSet(e, 'bite', 'bite');
      break;
    case 'bite':
      if (!e.hitDone && e.t > 0.08) {
        e.hitDone = true;
        sfx('clang');
        const hx = e.x + Math.sin(e.face) * 2.6,
          hz = e.z + Math.cos(e.face) * 2.6;
        if (Math.hypot(P.x - hx, P.z - hz) < 1.8 && P.y < 4) hurtP(e, castDamage(e, 'bite'), e.x, e.z, true);
      }
      if (e.t > 0.3) {
        e.hitDone = false;
        castSet(e, 'recover', 'recovery');
        e.recT = R.bite.rec;
        e.cd = 1.4;
      }
      break;
    // ----- shared
    case 'recover':
      if (e.t > (e.recT || 1)) castSet(e, e.aware ? 'chase' : 'idle', e.aware ? 'walk' : 'idle');
      break;
    case 'stagger':
      if (e.t > 1.6) {
        castSet(e, 'recover', 'recover');
        e.recT = 0.8;
      }
      break;
    case 'stun': // combat.js may set this for heavy hits: treat it as a flinch
      castSet(e, e.aware ? 'chase' : 'idle', 'walk');
      break;
  }
  // flying height (Sky Drake), ground otherwise
  e.y = e.fly * c.flyHeight || 0;
  if (e.st === 'takeoff' || e.st === 'land' || e.st === 'fly' || e.st === 'swoopWind' || e.st === 'swoop') e.y = e.fly * (c.flyHeight || 0);
  levelClampEnemy(e);
  // keep Darren out of the body
  const br = e.r + 0.45;
  if (dP < br && dP > 0.001 && P.y < e.y + e.h * 0.7 && P.y > e.y - 1) {
    P.x = e.x + ((P.x - e.x) / dP) * br;
    P.z = e.z + ((P.z - e.z) / dP) * br;
  }
  castAnimate(e, dt);
}
function castClipNow(e) {
  // which pose to show: the state clip, or the hit flinch on top of walking
  if (e.flinchT > 0 && (e.clip === 'idle' || e.clip === 'walk' || e.clip === 'heavyWalk')) return 'hit';
  return e.clip;
}
function castAnimate(e, dt) {
  const M = e.m,
    c = e.c;
  e.flinchT = Math.max(0, (e.flinchT || 0) - dt);
  M.root.position.set(e.x, e.y, e.z);
  M.root.rotation.y = e.face;
  let clip = castClipNow(e),
    t = e.ct;
  if (clip === 'hit') t = 0.45 - e.flinchT * 1.8;
  if (clip === 'walk' || clip === 'heavyWalk') t = (e.wph = (e.wph || 0) + dt * Math.max(0.5, (e.walkSp || c.speed) / c.speed));
  if (clip === 'idle' && e.eating) t = e.ct;
  const R = castPose(e.type, clip, t);
  // eating: head down, chomping
  if (e.eating) {
    R.bones.head = [0.5, 0, 0];
    R.bones.jaw = [Math.abs(Math.sin(e.ct * 9)) * 0.45, 0, 0];
    if (R.bones.neck1) R.bones.neck1 = [0.35, 0, 0];
    if (R.bones.neck) R.bones.neck = [0.35, 0, 0];
  }
  // look at Darren while calm or chasing
  if (e.alive && (clip === 'idle' || clip === 'walk' || clip === 'heavyWalk') && !e.eating) {
    const yaw = clamp(angDiff(e.face, Math.atan2(P.x - e.x, P.z - e.z)), -0.7, 0.7);
    const h = R.bones.head || [0, 0, 0];
    R.bones.head = [h[0], h[1] + yaw * 0.6, h[2]];
  }
  // heavier weight stages push the arms out so the belly never swallows them
  if (e.vis > 0.01)
    for (const [sd, side] of [[1, 'L'], [-1, 'R']]) {
      const q = R.bones['arm' + side] || [0, 0, 0];
      R.bones['arm' + side] = [q[0] - e.vis * 0.35, q[1], q[2] + sd * e.vis * 0.75];
    }
    castApplyPose(M, R, dt, clip === 'bite' || clip === 'stompImpact' || clip === 'tailWhip' ? 30 : 10);
  // belly spring: footsteps and landings kick it
  const J = e.J,
    w = e.vis || 0,
    k = 110 - w * 55,
    cc = 6 - w * 2.5;
  if (clip === 'walk' || clip === 'heavyWalk') {
    const ph = e.wph * TAU * (clip === 'heavyWalk' ? 1 / 1.5 : 1 / 1.2) * 2;
    if (Math.floor(ph / TAU) !== Math.floor((ph - dt * 5) / TAU)) castKick(e, 0, -0.35 - w * 0.4, 0, 0.004);
  }
  const steps = Math.max(1, Math.ceil(dt / 0.01)),
    h = dt / steps;
  for (let i = 0; i < steps; i++) {
    J.vx += (-k * J.x - cc * J.vx) * h;
    J.vy += (-k * J.y - cc * J.vy) * h;
    J.vz += (-k * J.z - cc * J.vz) * h;
    J.x += J.vx * h;
    J.y += J.vy * h;
    J.z += J.vz * h;
  }
  J.x = clamp(J.x, -0.12, 0.12);
  J.y = clamp(J.y, -0.12, 0.12);
  J.z = clamp(J.z, -0.12, 0.12);
  e.rip = damp(e.rip, 0, 2, dt);
  const U = M.U;
  U.uW.value = w;
  U.uJig.value.set(J.x, J.y, J.z);
  U.uRip.value = e.rip;
  U.uT.value = G.time;
  U.uFlash.value = e.flash > 0 ? 0.55 : e.st.indexOf('Wind') > 0 && Math.floor(G.time * 14) % 2 === 0 ? 0.35 : 0;
  U.uFlashC.value.set(e.flash > 0 ? 0xffffff : 0xff3a1a);
  // eyelids: angry by default, blink, droop when staggered or dead
  e.blinkT -= dt;
  if (e.blinkT < 0) e.blinkT = rnd(2.5, 5);
  const lid = !e.alive || clip === 'stagger' ? 0.7 : e.blinkT < 0.12 ? 1.3 : e.type === 'heavyweight' ? 0.05 : -0.25;
  M.lids.forEach(l => {
    l.rotation.x += (lid - l.rotation.x) * Math.min(1, dt * 25);
    l.rotation.z = l.userData.s * (e.type === 'heavyweight' ? -0.15 : -0.35);
  });
}

/* ---------- Cloud Utopia: spawn each monster on its island (called by adventure.js every frame) ---------- */
function castAdvReset() {
  CAST.spawn = {};
  for (const t in DATA.cast) CAST.spawn[t] = { e: null, t: 0 };
}
function castAdvUpdate(dt) {
  if (!window.CAST_MODELS) return;
  for (const type in DATA.cast) {
    const c = DATA.cast[type],
      st = CAST.spawn[type] || (CAST.spawn[type] = { e: null, t: 0 }),
      I = LV.islands[c.island];
    if (!I) continue;
    if (st.e && !st.e.alive) {
      if (st.e.gone || st.e.dead) {
        st.t = c.respawn;
        st.e = null;
      }
      continue;
    }
    if (st.e) continue;
    st.t -= dt;
    if (st.t <= 0 && Math.hypot(P.x - I.x, P.z - I.z) < I.r + 34) {
      const e = spawnEnemy(type, c.at[0], c.at[1]);
      e.home = I;
      e.face = c.face || 0;
      st.e = e;
    }
  }
}
