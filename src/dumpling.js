/* DUMPLING: the chubby cloud drake who follows Darren around Cloud Utopia (numbers and text: data/dumpling.js).
   The body is a sculpted, skinned mesh (assets/dumpling_model.js, made by tools/sculpt_dumpling.py). A small
   vertex shader grows his belly and body with weight and fullness, and makes the belly wobble on a spring.
   adventure.js calls dumpBuild() when Cloud Utopia is built, dumpReset() when play starts and dumpUpdate()
   every frame. */
const DUMP = {
  m: null, on: false, follow: true, x: 0, y: 0, z: 0, face: 0, vy: 0, st: 'home', t: 0, ph: 0, sp: 0,
  w: 0.3, vis: 0.3, stage: -1, full: 0, spicy: 0, cd: 0, flop: null, air: false, saveT: 0, lastSay: 0, blinkT: 2, bounceT: 0,
  J: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }, rip: 0, snacks: [], bushes: [], squash: 0, ovx: 0, ovz: 0,
};
const DDATA = () => DATA.dumpling;
const SNACKS = () => DATA.dumpling.snacks;

/* ---------- save ---------- */
function dumpSave() {
  UNLOCKS.dumpling = Object.assign(UNLOCKS.dumpling || {}, {
    w: Math.round(DUMP.w * 10000) / 10000,
    full: Math.round(DUMP.full * 1000) / 1000,
    follow: DUMP.follow,
  });
  saveUnlocks();
}
function dumpState() {
  if (!UNLOCKS.dumpling)
    UNLOCKS.dumpling = { met: false, w: DDATA().weight.start, full: 0, hold: false, follow: true, fed: 0 };
  UNLOCKS.snacks = UNLOCKS.snacks || {};
  return UNLOCKS.dumpling;
}

/* ---------- the model ---------- */
function b64Bytes(s) {
  const bin = atob(s),
    u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
const DUMP_U = {
  uW: { value: 0.3 },
  uStuff: { value: 0 },
  uJig: { value: new T.Vector3() },
  uRip: { value: 0 },
  uT: { value: 0 },
  uBreath: { value: 0 },
  uBump: { value: 0.0032 },
};
function dumpBodyMaterial() {
  const m = new T.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.45,
    skinning: true,
  });
  m.extensions = { derivatives: true };
  if (window.ENV_TEX) {
    m.envMap = window.ENV_TEX;
    m.envMapIntensity = 0.42;
  }
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, DUMP_U);
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float aBelly; attribute float aFat; attribute vec3 aFdir;
        uniform float uW; uniform float uStuff; uniform float uRip; uniform float uT; uniform float uBreath;
        uniform vec3 uJig;
        varying vec3 vObjP; varying float vBl;`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = vec3(position);
        float bl = aBelly, bj = bl * bl;
        // weight fattens the whole body, food and weight round out the belly, breathing moves it a little
        float grow = aFat * uW * 0.28 + bl * (uW * 0.62 + uStuff * 0.36 + uBreath * 0.016);
        transformed += aFdir * grow;
        // a heavy belly hangs a little lower
        transformed.y -= bj * (uW * 0.1 + uStuff * 0.03);
        // jiggle: the belly lags behind the body on a spring, plus a ripple across it
        transformed += uJig * bl * (1.0 + uW * 0.7);
        float rip = sin(dot(position, vec3(9.0, 13.0, 6.0)) - uT * 16.0);
        transformed += aFdir * rip * uRip * bj * 0.6;
        vObjP = position; vBl = bl;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uBump; varying vec3 vObjP; varying float vBl;
        float dScale(vec3 p) { p *= 38.0; return sin(p.x + sin(p.y * 0.7)) * sin(p.y * 1.15 + sin(p.z * 0.6)) * sin(p.z + sin(p.x * 0.8)); }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          // fine pebbly scales everywhere except the smooth belly plates
          float h = dScale(vObjP) * (1.0 - vBl * 0.9);
          vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
          vec2 dH = vec2(dFdx(h), dFdy(h));
          vec3 R1 = cross(sy, normal), R2 = cross(normal, sx);
          float det = dot(sx, R1);
          vec3 gr = sign(det) * (dH.x * R1 + dH.y * R2);
          normal = normalize(abs(det) * normal - gr * uBump);
        }`,
      )
      .replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
        // a touch of warm light through the thin edges (soft, plush look)
        {
          float rim = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
          reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(1.0, 0.75, 0.6) * rim * 0.35;
        }`,
      );
  };
  m.customProgramCacheKey = () => 'dumpling-body';
  return m;
}
function taperTube(pts, r0, r1, segs, rad, ridge) {
  const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))),
    g = new T.TubeGeometry(curve, segs, 1, rad, false),
    p = g.attributes.position,
    v = new T.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs,
      c = curve.getPointAt(t),
      r = (r0 + (r1 - r0) * t) * (1 + (ridge ? Math.sin(t * segs * 0.9) * ridge : 0));
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c);
      p.setXYZ(k, v.x, v.y, v.z);
    }
  }
  // cap the thin end
  g.computeVertexNormals();
  return g;
}
function finGeo(pts, colA, colB, span) {
  const s = new T.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  s.splineThru(pts.slice(1).map(p => new T.Vector2(p[0], p[1])));
  const g = new T.ShapeGeometry(s, 10),
    p = g.attributes.position,
    c = new Float32Array(p.count * 3),
    A = new T.Color(colA).convertSRGBToLinear(),
    B = new T.Color(colB).convertSRGBToLinear(),
    C = new T.Color();
  for (let i = 0; i < p.count; i++) {
    C.copy(A).lerp(B, Math.min(1, Math.max(0, p.getX(i) / span)));
    c.set([C.r, C.g, C.b], i * 3);
  }
  g.setAttribute('color', new T.BufferAttribute(c, 3));
  return g;
}
function cloudPuff(n, r, seed) {
  const g = new T.Group(),
    mat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, emissive: 0x2a3550, emissiveIntensity: 0.25 });
  let s = seed || 1;
  const rr = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rr() * 0.6,
      k = r * (0.55 + rr() * 0.5),
      m = new T.Mesh(GEO.hi || new T.SphereGeometry(1, 20, 14), mat);
    m.position.set(Math.cos(a) * r * 0.7 * rr(), rr() * r * 0.7, Math.sin(a) * r * 0.7 * rr());
    m.scale.setScalar(k);
    m.castShadow = true;
    g.add(m);
  }
  return g;
}
function eyeTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#fffaf1';
  x.fillRect(0, 0, 512, 256);
  const cx = 128,
    cy = 128,
    R = 58;
  let g = x.createRadialGradient(cx, cy, 6, cx, cy, R);
  g.addColorStop(0, '#ffe27a');
  g.addColorStop(0.45, '#ffb82e');
  g.addColorStop(0.85, '#d9741a');
  g.addColorStop(1, '#6a2f0a');
  x.fillStyle = g;
  x.beginPath();
  x.arc(cx, cy, R, 0, TAU);
  x.fill();
  // iris streaks
  x.strokeStyle = 'rgba(120,50,10,0.35)';
  x.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26);
    x.lineTo(cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4));
    x.stroke();
  }
  x.fillStyle = '#1b0f08';
  x.beginPath();
  x.ellipse(cx, cy, 25, 29, 0, 0, TAU);
  x.fill();
  x.fillStyle = '#ffffff';
  x.beginPath();
  x.arc(cx - 18, cy - 20, 13, 0, TAU);
  x.fill();
  x.beginPath();
  x.arc(cx + 16, cy + 18, 5, 0, TAU);
  x.fill();
  const t = new T.CanvasTexture(c);
  t.encoding = T.sRGBEncoding;
  t.anisotropy = 4;
  return t;
}
function scarfTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#3fa9f0';
  x.fillRect(0, 0, 256, 64);
  x.fillStyle = '#fff6e6';
  for (let i = 0; i < 16; i++)
    for (let j = 0; j < 3; j++) {
      x.beginPath();
      x.arc(i * 16 + (j % 2) * 8 + 4, j * 22 + 10, 3.4, 0, TAU);
      x.fill();
    }
  const t = new T.CanvasTexture(c);
  t.encoding = T.sRGBEncoding;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(3, 1);
  return t;
}
function buildDumpling() {
  const M = window.DUMPLING_MODEL;
  if (!M) return null;
  const n = M.count,
    q = new Uint16Array(b64Bytes(M.pos).buffer),
    pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < 3; k++) pos[i * 3 + k] = M.lo[k] + (q[i * 3 + k] / 65535) * (M.hi[k] - M.lo[k]);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const ib = b64Bytes(M.idx).buffer;
  geo.setIndex(new T.BufferAttribute(M.idx32 ? new Uint32Array(ib) : new Uint16Array(ib), 1));
  geo.setAttribute('color', new T.BufferAttribute(b64Bytes(M.col), 3, true));
  geo.setAttribute('skinIndex', new T.BufferAttribute(new Uint16Array(b64Bytes(M.skI)), 4));
  geo.setAttribute('skinWeight', new T.BufferAttribute(b64Bytes(M.skW), 4, true));
  geo.setAttribute('aBelly', new T.BufferAttribute(b64Bytes(M.belly), 1, true));
  geo.setAttribute('aFat', new T.BufferAttribute(b64Bytes(M.fat), 1, true));
  geo.setAttribute('aFdir', new T.BufferAttribute(new Int8Array(b64Bytes(M.fdir).buffer), 3, true));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  geo.boundingSphere.radius *= 1.6; // room for a very full belly
  // bones (bind pose has no rotation, so a bone's local position is the offset from its parent)
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
  const mesh = new T.SkinnedMesh(geo, dumpBodyMaterial());
  mesh.add(bones[0]);
  mesh.updateMatrixWorld(true);
  mesh.bind(new T.Skeleton(bones));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  const root = new T.Group(),
    body = new T.Group();
  body.add(mesh);
  root.add(body);
  const A = M.anchors,
    at = (bone, p) => {
      const g = new T.Group(),
        b = BW[bone];
      g.position.set(p[0] - b[0], p[1] - b[1], p[2] - b[2]);
      B[bone].add(g);
      return g;
    },
    D = { root, body, mesh, B, eyes: [], lids: [], wings: [], ears: [] };
  // eyes with eyelids (lids blink and squint)
  const eyeM = new T.MeshPhysicalMaterial({ map: eyeTexture(), roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
    lidM = new T.MeshPhysicalMaterial({ color: 0x36a68c, roughness: 0.5, clearcoat: 0.25, side: T.DoubleSide }),
    eyeG = new T.SphereGeometry(0.1, 32, 20),
    lidG = new T.SphereGeometry(0.107, 28, 12, 0, TAU, 0, PI * 0.5);
  for (const s of ['L', 'R']) {
    const g = at('head', A['eye' + s]),
      e = new T.Mesh(eyeG, eyeM);
    e.rotation.y = s === 'L' ? 0.16 : -0.16;
    g.add(e);
    const lid = new T.Mesh(lidG, lidM);
    lid.rotation.order = 'YXZ';
    lid.rotation.y = e.rotation.y;
    g.add(lid);
    const low = new T.Mesh(lidG, lidM); // lower lid: cheeks push it up when he smiles
    low.rotation.order = 'YXZ';
    low.rotation.y = e.rotation.y;
    low.rotation.x = PI + 0.95;
    g.add(low);
    D.eyes.push(e);
    D.lids.push([lid, low]);
  }
  // little curled horns
  const hornM = toy(0xf3ddb0, { roughness: 0.42, clearcoat: 0.3 });
  for (const s of ['L', 'R']) {
    const k = s === 'L' ? 1 : -1,
      g = at('head', A['horn' + s]);
    const h = new T.Mesh(
      taperTube(
        [
          [0, -0.03, 0],
          [k * 0.04, 0.09, -0.05],
          [k * 0.11, 0.15, -0.14],
          [k * 0.18, 0.1, -0.21],
          [k * 0.2, 0.0, -0.17],
          [k * 0.165, -0.035, -0.11],
        ],
        0.058,
        0.012,
        40,
        12,
        0.06,
      ),
      hornM,
    );
    h.castShadow = true;
    g.add(h);
  }
  // ear fins: jade at the root, sunset coral at the tips
  const finM = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, side: T.DoubleSide, clearcoat: 0.2 }),
    earG = finGeo(
      [[0, 0.07], [0.12, 0.13], [0.31, 0.2], [0.21, 0.085], [0.29, 0.03], [0.19, -0.015], [0.24, -0.1], [0.1, -0.06], [0, -0.06]],
      '#36a68c',
      '#ff7f4f',
      0.3,
    );
  for (const s of ['L', 'R']) {
    const k = s === 'L' ? 1 : -1,
      g = at('head', A['ear' + s]),
      f = new T.Mesh(earG, finM);
    f.rotation.order = 'YXZ';
    f.rotation.set(0, k > 0 ? PI / 2 - 0.55 : PI / 2 + 0.55, 0.3); // points back, splays out, tips up
    f.castShadow = true;
    const piv = new T.Group();
    piv.add(f);
    g.add(piv);
    D.ears.push(piv);
  }
  // tiny wings (comically small for him) on the back
  const wArm = toy(0x2f8f7c, { roughness: 0.5 }),
    wingG = finGeo(
      [[0, 0.04], [0.16, 0.2], [0.36, 0.3], [0.5, 0.33], [0.42, 0.2], [0.44, 0.12], [0.33, 0.06], [0.33, -0.02], [0.2, -0.02], [0.12, -0.08], [0, -0.04]],
      '#ffb08a',
      '#ff7a52',
      0.5,
    ),
    wingM = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.6, side: T.DoubleSide, transparent: true, opacity: 0.94 });
  for (const s of ['L', 'R']) {
    const k = s === 'L' ? 1 : -1,
      g = at('spine', A['wing' + s]),
      piv = new T.Group();
    g.add(piv);
    const w = new T.Mesh(wingG, wingM);
    w.scale.set(k, 1, 1);
    w.rotation.y = k * 0.0;
    piv.add(w);
    const arm = new T.Mesh(
      taperTube([[0, 0, 0], [k * 0.16, 0.2, 0], [k * 0.36, 0.3, 0], [k * 0.5, 0.33, 0]], 0.035, 0.012, 16, 8),
      wArm,
    );
    piv.add(arm);
    piv.rotation.set(0.25, k * 0.5, k * 0.25);
    piv.userData.k = k;
    w.castShadow = arm.castShadow = true;
    D.wings.push(piv);
  }
  // cloud tuft on the head and a cloud puff at the tail tip (cloud drakes are part cloud)
  const tuft = cloudPuff(7, 0.085, 7);
  at('head', A.tuft).add(tuft);
  tuft.position.y = 0.03;
  const tailP = cloudPuff(9, 0.12, 3);
  at('tail3', A.tailTip).add(tailP);
  D.tuft = tuft;
  D.tailPuff = tailP;
  // sky-blue polka-dot neckerchief (rides the spine and stretches as he gets rounder)
  const ring = A.scarf.map(p => {
      const dx = p[0],
        dz = p[2] - 0.05,
        l = Math.hypot(dx, dz) || 1;
      return [p[0] + (dx / l) * 0.03, p[1] - 0.01, p[2] + (dz / l) * 0.03];
    }),
    sc = BW.spine,
    scarfM = new T.MeshPhysicalMaterial({ map: scarfTexture(), roughness: 0.75, sheen: new T.Color(0x99ccff) }),
    curve = new T.CatmullRomCurve3(
      ring.map(p => new T.Vector3(p[0] - sc[0], p[1] - sc[1], p[2] - sc[2])),
      true,
    ),
    scarfG = new T.Group();
  scarfG.add(new T.Mesh(new T.TubeGeometry(curve, 64, 0.062, 12, true), scarfM));
  let front = ring[0];
  for (const p of ring) if (p[2] > front[2]) front = p;
  const knot = new T.Mesh(GEO.hi || new T.SphereGeometry(1, 16, 12), scarfM);
  knot.position.set(front[0] - sc[0], front[1] - sc[1] - 0.01, front[2] - sc[2] + 0.02);
  knot.scale.set(0.085, 0.07, 0.06);
  scarfG.add(knot);
  for (const s of [1, -1]) {
    const tail = new T.Mesh(new T.ConeGeometry(0.11, 0.26, 4), scarfM);
    tail.position.set(knot.position.x + s * 0.06, knot.position.y - 0.13, knot.position.z + 0.02);
    tail.rotation.set(0.25, PI / 4, PI + s * 0.35);
    tail.scale.set(1, 1, 0.25);
    scarfG.add(tail);
  }
  scarfG.traverse(o => o.isMesh && (o.castShadow = true));
  B.spine.add(scarfG);
  D.scarf = scarfG;
  // one cheeky little tooth poking out of his smile
  const tooth = new T.Mesh(new T.ConeGeometry(0.018, 0.045, 8), toy(0xfffaf0, { roughness: 0.3 }));
  tooth.rotation.x = PI;
  tooth.position.y = -0.012;
  at('head', A.tooth).add(tooth);
  root.scale.setScalar(DDATA().scale);
  return D;
}

/* ---------- belly physics ---------- */
// impulse in his local space (x: his left, y: up, z: his front)
function dumpKick(x, y, z, rip) {
  const J = DUMP.J;
  J.vx += x;
  J.vy += y;
  J.vz += z;
  DUMP.rip = Math.min(0.03, DUMP.rip + (rip || 0));
}
function dumpKickWorld(wx, wy, wz, rip) {
  const c = Math.cos(DUMP.face),
    s = Math.sin(DUMP.face);
  // world -> local (root is rotated by face around y)
  dumpKick(wx * c - wz * s, wy, wx * s + wz * c, rip);
}
function dumpJiggle(dt, ax, ay, az) {
  const J = DUMP.J,
    w = DUMP.w,
    k = 150 - w * 85, // heavier = slower, floppier wobble
    c = 7.5 - w * 3.5;
  const steps = Math.max(1, Math.ceil(dt / 0.008)),
    h = dt / steps;
  for (let i = 0; i < steps; i++) {
    J.vx += (-k * J.x - c * J.vx - ax) * h;
    J.vy += (-k * J.y - c * J.vy - ay) * h;
    J.vz += (-k * J.z - c * J.vz - az) * h;
    J.x += J.vx * h;
    J.y += J.vy * h;
    J.z += J.vz * h;
  }
  const lim = 0.09;
  J.x = clamp(J.x, -lim, lim);
  J.y = clamp(J.y, -lim, lim);
  J.z = clamp(J.z, -lim, lim);
  DUMP.rip = damp(DUMP.rip, 0, 2.2, dt);
}

/* ---------- snacks: pickups and bushes ---------- */
const SNACK_GEO = {};
function snackMesh(id) {
  const S = SNACKS()[id],
    col = new T.Color(S.color),
    m = toy(col.getHex(), { roughness: S.shape === 'bun' || S.shape === 'cake' ? 0.7 : 0.3, clearcoat: 0.5 }),
    g = new T.Group(),
    sph = GEO.hi || new T.SphereGeometry(1, 16, 12);
  switch (S.shape) {
    case 'bun':
      g.add(mk(sph, m, 0, 0.1, 0, 0.17, 0.11, 0.17));
      g.add(mk(sph, toy(0xffe9c8, { roughness: 0.8 }), 0, 0.03, 0, 0.18, 0.05, 0.18));
      break;
    case 'melon':
      g.add(mk(sph, m, 0, 0.17, 0, 0.21, 0.19, 0.21));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        g.add(mk(GEO.cone || new T.ConeGeometry(1, 1, 6), toy(0x3f8a32), Math.cos(a) * 0.19, 0.2, Math.sin(a) * 0.19, 0.03, 0.08, 0.03));
      }
      break;
    case 'pepper': {
      const p = mk(sph, m, 0, 0.15, 0, 0.08, 0.17, 0.08);
      p.rotation.z = 0.4;
      g.add(p);
      g.add(mk(GEO.cyl || new T.CylinderGeometry(1, 1, 1, 8), toy(0x3f8a32), -0.07, 0.3, 0, 0.025, 0.07, 0.025));
      break;
    }
    case 'cake':
      g.add(mk(GEO.cyl || new T.CylinderGeometry(1, 1, 1, 24), m, 0, 0.1, 0, 0.2, 0.2, 0.2));
      g.add(mk(GEO.cyl || new T.CylinderGeometry(1, 1, 1, 24), toy(0xfff4e8), 0, 0.22, 0, 0.21, 0.05, 0.21));
      g.add(mk(sph, toy(0xff5a6a), 0, 0.28, 0, 0.05, 0.05, 0.05));
      break;
    case 'puff':
      for (let i = 0; i < 4; i++) g.add(mk(sph, m, Math.cos(i * 1.6) * 0.07, 0.1 + (i % 2) * 0.05, Math.sin(i * 1.6) * 0.07, 0.1, 0.09, 0.1));
      break;
    case 'comet':
      g.add(mk(sph, new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, roughness: 0.3 }), 0, 0.14, 0, 0.12, 0.12, 0.12));
      g.add(mk(GEO.cone || new T.ConeGeometry(1, 1, 8), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5 }), 0, 0.14, -0.18, 0.09, 0.3, 0.09)).rotation.x = -PI / 2;
      break;
    default:
      g.add(mk(sph, m, 0, 0.12, 0, 0.12, 0.12, 0.12));
      g.add(mk(sph, toy(0x3f9a3a), 0.02, 0.24, 0, 0.06, 0.02, 0.035));
  }
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return g;
}
function spawnSnack(id, x, y, z) {
  if (!SNACKS()[id]) return;
  const g = snackMesh(id);
  g.position.set(x, y, z);
  scene.add(g);
  const a = rnd(TAU),
    v = rnd(1.4, 3.2);
  DUMP.snacks.push({ id, g, x, y, z, vx: Math.cos(a) * v, vy: rnd(4.5, 7), vz: Math.sin(a) * v, t: 0 });
}
function addSnack(id, n, quiet) {
  dumpState();
  UNLOCKS.snacks[id] = (UNLOCKS.snacks[id] || 0) + n;
  saveUnlocks();
  if (!quiet) floatText(P.x, P.y + 2.1, P.z, '+' + n + ' ' + SNACKS()[id].name, 'part');
}
function updateSnacks(dt) {
  for (let i = DUMP.snacks.length - 1; i >= 0; i--) {
    const s = DUMP.snacks[i];
    s.t += dt;
    const dx = P.x - s.x,
      dy = P.y + 0.9 - s.y,
      dz = P.z - s.z,
      d = Math.hypot(dx, dy, dz);
    if (s.t > 0.6 && d < 6 && P.st !== 'dead') {
      const sp = 12 / Math.max(0.4, d);
      s.vx = damp(s.vx, (dx / d) * sp, 9, dt);
      s.vy = damp(s.vy, (dy / d) * sp, 9, dt);
      s.vz = damp(s.vz, (dz / d) * sp, 9, dt);
    } else {
      s.vy -= 16 * dt;
      s.vx = damp(s.vx, 0, 1.5, dt);
      s.vz = damp(s.vz, 0, 1.5, dt);
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
    const floor = groundAt(s.x, s.z) ? 0 : 0.3;
    if (s.y < floor && s.vy < 0) {
      s.y = floor;
      s.vy *= -0.35;
    }
    s.g.position.set(s.x, s.y, s.z);
    s.g.rotation.y += dt * 2;
    if ((s.t > 0.5 && d < 0.8) || s.t > 40) {
      if (s.t <= 40) {
        addSnack(s.id, 1);
        sfx('pickup');
      }
      scene.remove(s.g);
      DUMP.snacks.splice(i, 1);
    }
  }
}
function buildBush(def) {
  const g = new T.Group(),
    leaf = toy(0x4f9a46, { roughness: 0.75 }),
    leafD = toy(0x3b7d3a, { roughness: 0.8 }),
    sph = GEO.hi || new T.SphereGeometry(1, 16, 12);
  const blobs = [
    [0, 0.45, 0, 0.62, 0.5, 0.6, leaf],
    [0.38, 0.32, 0.1, 0.4, 0.34, 0.4, leafD],
    [-0.35, 0.34, -0.12, 0.44, 0.36, 0.42, leafD],
    [0.05, 0.75, -0.1, 0.38, 0.3, 0.36, leaf],
  ];
  for (const [x, y, z, a, b, c, m] of blobs) g.add(mk(sph, m, x, y, z, a, b, c));
  const fruits = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3,
      f = snackMesh(def.snack);
    f.scale.setScalar(0.75);
    f.position.set(Math.cos(a) * 0.55, 0.3 + (i % 3) * 0.22, Math.sin(a) * 0.52);
    g.add(f);
    fruits.push(f);
  }
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return { g, fruits };
}

/* ---------- build / reset (called by adventure.js) ---------- */
function dumpBuild() {
  dumpState();
  if (!DUMP.m) DUMP.m = buildDumpling();
  DUMP.bushes = [];
  for (const def of DDATA().bushes) {
    const b = buildBush(def);
    b.g.position.set(def.x, 0, def.z);
    b.g.rotation.y = rnd(TAU);
    LV.root.add(b.g);
    DUMP.bushes.push(Object.assign(b, { def, ripe: true, t: 0, shake: 0 }));
  }
  // his oven: a round clay bread oven with a chimney, a table of buns and a sign
  const K = DDATA().bakery,
    oven = new T.Group(),
    clay = lookMat('stone', 0xd9a07a, 1.5),
    sph = GEO.hi || new T.SphereGeometry(1, 20, 14);
  oven.add(mk(sph, clay, 0, 0.55, 0, 1.15, 1.0, 1.15));
  oven.add(mk(GEO.cyl, clay, 0.55, 1.6, -0.45, 0.22, 0.9, 0.22));
  const mouth = mk(sph, new T.MeshBasicMaterial({ color: 0xffa040 }), 0, 0.42, 1.0, 0.42, 0.34, 0.2);
  oven.add(mouth);
  oven.add(mk(GEO.box, PROP.woodD, 2.2, 0.45, 0.2, 1.4, 0.08, 0.8));
  for (const [x, z] of [[1.6, -0.1], [2.8, -0.1], [1.6, 0.5], [2.8, 0.5]]) oven.add(mk(GEO.box, PROP.woodD, x, 0.22, z, 0.08, 0.45, 0.08));
  for (let i = 0; i < 5; i++) {
    const b = snackMesh(i % 2 ? 'cloudbun' : 'puffpie');
    b.position.set(1.7 + (i % 3) * 0.4, 0.5, 0.05 + Math.floor(i / 3) * 0.35);
    oven.add(b);
  }
  const sign = mk(GEO.box, PROP.wood, -1.4, 1.5, 0.6, 1.1, 0.5, 0.08);
  oven.add(sign);
  oven.add(mk(GEO.box, PROP.woodD, -1.4, 0.7, 0.6, 0.08, 1.4, 0.08));
  oven.traverse(o => o.isMesh && (o.castShadow = true));
  oven.position.set(K.x - Math.sin(K.face) * 2.2, 0, K.z - Math.cos(K.face) * 2.2);
  oven.rotation.y = K.face;
  LV.root.add(oven);
  LV.colliders.push({ x: oven.position.x, z: oven.position.z, r: 1.3 });
  DUMP.oven = { g: oven, mouth };
}
function dumpReset() {
  const S = dumpState(),
    K = DDATA().bakery;
  DUMP.w = clamp(S.w === undefined ? DDATA().weight.start : S.w, 0, 1);
  DUMP.vis = dumpStage().size;
  DUMP.stage = dumpStage().k;
  DUMP.full = clamp(S.full || 0, 0, 1);
  DUMP.follow = S.follow !== false;
  DUMP.st = S.met && DUMP.follow ? 'follow' : 'home';
  DUMP.flop = null;
  DUMP.cd = 0;
  DUMP.spicy = 0;
  for (const s of DUMP.snacks) scene.remove(s.g);
  DUMP.snacks = [];
  if (DUMP.st === 'follow') {
    DUMP.x = P.x - 3;
    DUMP.z = P.z - 2;
  } else {
    DUMP.x = K.x;
    DUMP.z = K.z;
  }
  DUMP.y = 0;
  DUMP.vy = 0;
  DUMP.face = K.face;
  for (const k in DUMP.J) DUMP.J[k] = 0;
  if (DUMP.m) {
    LV.root.add(DUMP.m.root);
    DUMP.on = true;
  }
}
function dumpHide() {
  DUMP.on = false;
  if (DUMP.m && DUMP.m.root.parent) DUMP.m.root.parent.remove(DUMP.m.root);
  for (const s of DUMP.snacks) scene.remove(s.g);
  DUMP.snacks = [];
}

/* ---------- weight ---------- */
function dumpStage(w) {
  return stageInfo(DDATA().weight.stages, w === undefined ? DUMP.w : w);
}
function dumpTier(w) {
  return dumpStage(w).name;
}
function dumpLbs(w) {
  return dumpStage(w).lbs;
}
// how much his belly bulges from food on top of his stage size (capped, and smaller at big stages)
function dumpStuff() {
  return DUMP.full * DDATA().weight.stuffedLimit * (1 - DUMP.vis * 0.5) * 2;
}
function dumpBounceStats(w, full) {
  const B = DDATA().bounce;
  return {
    dmg: (B.dmgLight + (B.dmgHeavy - B.dmgLight) * w) * (1 + (full || 0) * B.stuffedBonus),
    r: B.radiusLight + (B.radiusHeavy - B.radiusLight) * w,
    wait: B.waitLight + (B.waitHeavy - B.waitLight) * w,
    kd: w >= B.knockdownAt,
  };
}
function dumpFloats() {
  return dumpStage().k >= DDATA().weight.floatStage;
}
function feedDumpling(id) {
  const S = dumpState(),
    sn = SNACKS()[id];
  if (!sn || !S.met) return false;
  if ((UNLOCKS.snacks[id] || 0) <= 0) return false;
  if (DUMP.full >= 0.97) {
    dumpSay('full');
    dumpKick(0, -0.3, 0.4, 0.004);
    return false;
  }
  UNLOCKS.snacks[id]--;
  DUMP.full = Math.min(1, DUMP.full + sn.full);
  if (!S.hold) DUMP.w = Math.min(1, DUMP.w + (sn.gain || 0));
  if (sn.spicy) DUMP.spicy = Math.max(DUMP.spicy, sn.spicy);
  S.fed = (S.fed || 0) + 1;
  DUMP.st = DUMP.st === 'home' ? 'home' : DUMP.st;
  DUMP.eatT = 1.4;
  DUMP.mood = 1.5;
  dumpKick(0, 0.5, 0.9, 0.012);
  dumpSay('eat');
  dumpSound('chomp');
  if (DUMP.m) {
    const h = DUMP.m.B.head.getWorldPosition(new T.Vector3());
    burst(puffs, h.x, h.y + 0.1, h.z, 8, 2, 0.5, new T.Color(sn.color).getHex(), 0.35, { a: 0.8 });
  }
  dumpSave();
  return true;
}
function bake(i) {
  const R = DDATA().bake[i];
  if (!R) return false;
  for (const p in R.recipe) if (partCount(p) < R.recipe[p]) return false;
  for (const p in R.recipe) UNLOCKS.parts[p] -= R.recipe[p];
  addSnack(R.snack, R.makes, true);
  sfx('pickup');
  return true;
}
function dumpSay(kind, force) {
  if (!DUMP.m || (!force && G.time - DUMP.lastSay < 1.2)) return;
  const L = DDATA().say[kind];
  if (!L) return;
  DUMP.lastSay = G.time;
  floatText(DUMP.x, DUMP.y + 2.6 * DDATA().scale, DUMP.z, L[Math.floor(Math.random() * L.length)], 'say');
}
function dumpSound(n) {
  if (!Snd.ctx || !SETTINGS.sfx) return;
  switch (n) {
    case 'chomp':
      Snd.noise(0.08, 0.25, 900, 300, 1);
      setTimeout(() => Snd.noise(0.08, 0.22, 800, 260, 1), 160);
      setTimeout(() => Snd.tone(330, 0.14, 'sine', 0.12, 260), 330);
      break;
    case 'boing':
      Snd.tone(150, 0.32, 'sine', 0.3, 520);
      Snd.tone(300, 0.18, 'triangle', 0.08, 900);
      break;
    case 'giggle':
      for (let i = 0; i < 4; i++) setTimeout(() => Snd.tone(520 + i * 40 + Math.random() * 60, 0.07, 'sine', 0.1, 680), i * 85);
      break;
    case 'wobble':
      Snd.tone(110, 0.4, 'sine', 0.22, 70);
      break;
    case 'flap':
      Snd.noise(0.05, 0.08, 1400, 500, 1.4);
      break;
  }
}

/* ---------- Belly Bounce (G / Belly button / L3) ---------- */
function dumpCall() {
  if (!isAdventure() || !DUMP.on || !dumpState().met || DUMP.st === 'home') {
    floatText(P.x, P.y + 2, P.z, isAdventure() ? 'Dumpling is at his bakery' : 'Dumpling lives in Cloud Utopia', 'say');
    return;
  }
  if (DUMP.flop) return;
  if (DUMP.cd > 0) {
    floatText(DUMP.x, DUMP.y + 2.4, DUMP.z, 'Belly Bounce in ' + Math.ceil(DUMP.cd) + 's', 'say');
    return;
  }
  let tg = (P.lock && P.lock.alive && P.lock) || (G.tgt && G.tgt.alive && G.tgtT > 0 && G.tgt) || null,
    best = 18;
  if (!tg)
    for (const e of G.enemies) {
      if (!e.alive || e.under) continue;
      const d = Math.hypot(e.x - P.x, e.z - P.z);
      if (d < best) {
        best = d;
        tg = e;
      }
    }
  let tx, tz;
  if (tg) {
    tx = tg.x;
    tz = tg.z;
  } else {
    tx = P.x + Math.sin(P.face) * 3.2;
    tz = P.z + Math.cos(P.face) * 3.2;
  }
  if (!groundAt(tx, tz)) {
    tx = P.x;
    tz = P.z;
  }
  const w = DUMP.vis;
  DUMP.flop = { sx: DUMP.x, sz: DUMP.z, sy: DUMP.y, tx, tz, t: 0, dur: 0.75 + 0.4 * w, h: 3.4 + 1.2 * (1 - w), tg };
  DUMP.st = DUMP.st === 'home' ? 'follow' : DUMP.st;
  dumpSay('bounce', true);
  sfx('jump');
  dumpKick(0, -0.6, 0, 0.004);
}
function dumpFlopLand() {
  const F = DUMP.flop,
    w = DUMP.vis,
    st = dumpBounceStats(w, DUMP.full),
    x = DUMP.x,
    z = DUMP.z,
    hot = DUMP.spicy > 0;
  DUMP.flop = null;
  DUMP.cd = st.wait;
  DUMP.squash = 1;
  dumpKick(0, -1.6 - w, 0, 0.03);
  G.shake = Math.max(G.shake || 0, 0.35 + w * 0.6);
  sfx('slam');
  dumpSound('wobble');
  dust(x, z, 18 + Math.round(w * 20));
  ring(x, 0.1, z, 0.4, st.r * 3.2, 0.38, hot ? 0xff7a2a : 0xffe2b8, 0);
  if (hot) burst(sparks, x, 0.6, z, 40, 9, 0.6, 0xff6a1a, 0.5, { g: 4 });
  burst(puffs, x, 0.4, z, 14, 5, 0.8, 0xfff6e6, 1.2, { a: 0.7 });
  const dmg = st.dmg * (hot ? 1.4 : 1),
    A = { dmg, hs: 8, kd: st.kd, launch: st.kd ? 0 : 9, fire: hot, rng: st.r, arc: 360 };
  let hits = 0;
  for (const e of G.enemies) {
    if (!e.alive || e.under) continue;
    const dx = e.x - x,
      dz = e.z - z,
      d = Math.hypot(dx, dz);
    if (d - e.r > st.r || e.y > 2.5) continue;
    const n = d || 1;
    if (e.d.boss) {
      e.hp = Math.max(1, e.hp - dmg * DDATA().bounce.bossShare);
      e.flash = 5;
      e.shown = 300;
      floatText(e.x, e.y + 3, e.z, 'WOBBLE!', 'big');
    } else {
      const r = enemyTakeHit(e, dmg, A, dx / n, dz / n);
      if (r > 0) floatText(e.x, e.y + e.h + 0.4, e.z, String(Math.round(r)), '');
      if (hot && e.alive) e.burnT = 120;
    }
    hits++;
  }
  if (hits) {
    styleAdd(hits * 6);
    floatText(x, 2.8, z, hits > 2 ? 'MEGA BELLY BOUNCE!' : 'BELLY BOUNCE!', 'big');
  }
  // Darren standing in the shockwave gets popped up too (no damage) — a free launch
  if (Math.hypot(P.x - x, P.z - z) < st.r && P.onG && P.st === 'move') {
    P.vy = TUNE.jumpVel * 0.9;
    P.onG = false;
    P.jumps = 1;
  }
}

/* ---------- every frame ---------- */
function dumpNear() {
  return DUMP.on && dumpState().met && Math.hypot(P.x - DUMP.x, P.z - DUMP.z) < 3.6 && P.onG && !DUMP.flop;
}
function dumpUpdate(s, dt) {
  if (!DUMP.on || !DUMP.m) return;
  const S = dumpState(),
    K = DDATA().bakery,
    w = DUMP.vis,
    sc = DDATA().scale,
    ox = DUMP.x,
    oz = DUMP.z,
    ovx = DUMP.ovx,
    ovz = DUMP.ovz,
    oy = DUMP.y;
  DUMP.cd = Math.max(0, DUMP.cd - dt);
  DUMP.spicy = Math.max(0, DUMP.spicy - dt);
  DUMP.eatT = Math.max(0, (DUMP.eatT || 0) - dt);
  DUMP.mood = Math.max(0, (DUMP.mood || 0) - dt);
  // meet him: Darren walks up to the bakery
  if (!S.met && !G.cine && Math.hypot(P.x - DUMP.x, P.z - DUMP.z) < DDATA().meetRange && P.onG) {
    S.met = true;
    for (const id in DDATA().start) addSnack(id, DDATA().start[id], true);
    dumpSave();
    talk('dump_intro', () => {
      DUMP.st = DUMP.follow ? 'follow' : 'home';
    });
  }
  // digest: the belly slowly empties and turns into weight
  if (DUMP.full > 0) {
    const d = Math.min(DUMP.full, dt / DDATA().weight.digestSeconds);
    DUMP.full -= d;
    if (!S.hold) DUMP.w = Math.min(1, DUMP.w + d * DDATA().weight.gainPerFull);
  }
  // weight stages: his body eases to the size of his stage, and never past the last one
  const SI = dumpStage();
  DUMP.vis = damp(DUMP.vis, SI.size, 1.8, dt);
  if (DUMP.stage >= 0 && SI.k !== DUMP.stage && S.met) {
    const up = SI.k > DUMP.stage;
    banner(
      'Dumpling ' + (up ? 'grew' : 'slimmed down') + ' to ' + SI.name,
      'Weight stage ' + (SI.k + 1) + ' of ' + WEIGHT_STAGES + ' · ' + SI.lbs + ' lb' + (SI.max ? ' · his limit' : ''),
      150,
    );
    dumpKick(0, up ? -1.2 : 0.6, 0.4, 0.02);
    if (up) dumpSound('wobble');
  }
  DUMP.stage = SI.k;
  let goalX = DUMP.x,
    goalZ = DUMP.z,
    goalY = 0,
    sp = 0,
    flying = false;
  const Ws = DDATA().speed,
    walk = Ws.light + (Ws.heavy - Ws.light) * w;
  if (DUMP.flop) {
    const F = DUMP.flop;
    F.t += dt;
    if (F.tg && F.tg.alive) {
      F.tx = damp(F.tx, F.tg.x, 3, dt);
      F.tz = damp(F.tz, F.tg.z, 3, dt);
    }
    const k = Math.min(1, F.t / F.dur),
      e = k * k * (3 - 2 * k);
    DUMP.x = F.sx + (F.tx - F.sx) * e;
    DUMP.z = F.sz + (F.tz - F.sz) * e;
    DUMP.y = F.sy * (1 - k) + Math.sin(k * PI) * F.h;
    DUMP.face += angDiff(DUMP.face, Math.atan2(F.tx - F.sx, F.tz - F.sz)) * Math.min(1, dt * 8);
    if (k >= 1) {
      DUMP.y = groundAt(DUMP.x, DUMP.z) ? 0 : DUMP.y;
      dumpFlopLand();
    }
  } else if (DUMP.st === 'follow' && !G.cine) {
    const dP = Math.hypot(P.x - DUMP.x, P.z - DUMP.z),
      fight = !!LV.active || G.enemies.some(e => e.alive && !e.d.static && Math.hypot(e.x - P.x, e.z - P.z) < 12),
      keep = fight ? 5.5 : 3.2;
    if (dP > 55) {
      // much too far (fast travel, a long flight): pop in beside Darren in a puff of cloud
      burst(puffs, DUMP.x, DUMP.y + 1, DUMP.z, 14, 4, 0.7, 0xffffff, 1.4, { a: 0.7 });
      DUMP.x = P.x - Math.sin(P.face) * 3;
      DUMP.z = P.z - Math.cos(P.face) * 3;
      DUMP.y = Math.max(P.y, 0);
      burst(puffs, DUMP.x, DUMP.y + 1, DUMP.z, 14, 4, 0.7, 0xffffff, 1.4, { a: 0.7 });
    }
    // stand beside Darren, a little behind, on the side he is already on (keeps the camera clear)
    const rx = -Math.cos(cam.yaw),
      rz = Math.sin(cam.yaw),
      side = (DUMP.x - P.x) * rx + (DUMP.z - P.z) * rz >= 0 ? 1 : -1;
    let gx = P.x + rx * side * keep * 0.8 + Math.sin(cam.yaw) * 1.4,
      gz = P.z + rz * side * keep * 0.8 + Math.cos(cam.yaw) * 1.4;
    if (fight) {
      const a = Math.atan2(DUMP.x - P.x, DUMP.z - P.z);
      gx = P.x + Math.sin(a) * keep;
      gz = P.z + Math.cos(a) * keep;
    }
    const gd = Math.hypot(gx - DUMP.x, gz - DUMP.z);
    if (gd > 0.6 && (dP > keep * 0.7 || gd > 2)) {
      goalX = gx;
      goalZ = gz;
    }
    const airborne = !P.onG && P.y > 2.5;
    flying = airborne || !groundAt(goalX, goalZ) || !groundAt(DUMP.x, DUMP.z) || DUMP.y > 0.3;
    if (flying && P.onG && groundAt(DUMP.x, DUMP.z) && groundAt(goalX, goalZ) && DUMP.y < 1.2) flying = false;
    goalY = flying ? Math.max(1.2, (airborne ? P.y : 0) + (dumpFloats() ? 0.6 : 0.2)) : 0;
    const d = Math.hypot(goalX - DUMP.x, goalZ - DUMP.z);
    if (d > 0.05) {
      sp = Math.min((flying ? walk * 1.35 : walk) * (dP > 14 ? 1.6 : 1), d * 3);
      DUMP.x += ((goalX - DUMP.x) / d) * Math.min(d, sp * dt);
      DUMP.z += ((goalZ - DUMP.z) / d) * Math.min(d, sp * dt);
      DUMP.face += angDiff(DUMP.face, Math.atan2(goalX - ox, goalZ - oz)) * Math.min(1, dt * 5);
    } else DUMP.face += angDiff(DUMP.face, Math.atan2(P.x - DUMP.x, P.z - DUMP.z)) * Math.min(1, dt * 2.5);
    const ky = flying ? 2.2 : 9;
    DUMP.y = damp(DUMP.y, goalY + (flying ? Math.sin(G.time * (dumpFloats() ? 1.6 : 5)) * 0.15 : 0), ky, dt);
    if (!flying && DUMP.y < 0.02) DUMP.y = 0;
    // walking and flying with Darren burns a little weight
    if (!S.hold) DUMP.w = Math.max(0, DUMP.w - Math.hypot(DUMP.x - ox, DUMP.z - oz) * DDATA().weight.burnPerMetre);
  } else if (DUMP.st === 'home') {
    goalX = K.x;
    goalZ = K.z;
    const d = Math.hypot(goalX - DUMP.x, goalZ - DUMP.z);
    if (d > 0.3) {
      sp = Math.min(walk, d * 3);
      DUMP.x += ((goalX - DUMP.x) / d) * sp * dt;
      DUMP.z += ((goalZ - DUMP.z) / d) * sp * dt;
      DUMP.face += angDiff(DUMP.face, Math.atan2(goalX - ox, goalZ - oz)) * Math.min(1, dt * 5);
    } else {
      const look = Math.hypot(P.x - DUMP.x, P.z - DUMP.z) < 12 ? Math.atan2(P.x - DUMP.x, P.z - DUMP.z) : K.face;
      DUMP.face += angDiff(DUMP.face, look) * Math.min(1, dt * 2);
    }
    DUMP.y = damp(DUMP.y, 0, 6, dt);
  }
  DUMP.air = DUMP.y > 0.25;
  // body velocity -> acceleration drives the belly spring (it lags behind every start, stop and turn)
  const vx = (DUMP.x - ox) / Math.max(dt, 1e-4),
    vz = (DUMP.z - oz) / Math.max(dt, 1e-4),
    vy = (DUMP.y - oy) / Math.max(dt, 1e-4);
  if (dt > 0) {
    const ax = clamp((vx - ovx) / dt, -40, 40),
      az = clamp((vz - ovz) / dt, -40, 40),
      ay = clamp((vy - (DUMP.ovy || 0)) / dt, -60, 60),
      c = Math.cos(DUMP.face),
      sn = Math.sin(DUMP.face);
    dumpJiggle(dt, (ax * c - az * sn) * 0.012, ay * 0.008, (ax * sn + az * c) * 0.012);
    // landing from a hover
    if (oy > 0.25 && DUMP.y <= 0.02 && !DUMP.flop) {
      dumpKick(0, -0.9 - w, 0, 0.01);
      DUMP.squash = 0.6;
      dust(DUMP.x, DUMP.z, 8);
    }
  }
  DUMP.ovx = vx;
  DUMP.ovz = vz;
  DUMP.ovy = vy;
  DUMP.sp = Math.hypot(vx, vz);
  // Darren bumps into his belly (and is pushed out), or lands on top and bounces like on a trampoline
  const top = (1.95 + w * 0.25 + DUMP.full * 0.1) * sc + DUMP.y,
    dd = Math.hypot(P.x - DUMP.x, P.z - DUMP.z),
    br = (0.62 + w * 0.32 + DUMP.full * 0.12) * sc;
  DUMP.bounceT = Math.max(0, DUMP.bounceT - dt);
  if (!P.onG && P.vy < -1.5 && dd < br + 0.25 && P.y > top - 0.9 && P.y < top + 0.7 && DUMP.bounceT <= 0 && !DUMP.flop) {
    const Tr = DDATA().trampoline;
    P.vy = TUNE.jumpVel * (Tr.light + (Tr.heavy - Tr.light) * w);
    P.y = Math.max(P.y, top);
    P.jumps = 1;
    P.airDash = true;
    if (P.st === 'dive' || P.st === 'attack') P.st = 'move';
    DUMP.bounceT = 0.35;
    dumpKick(0, -1.4 - w * 0.8, 0, 0.02);
    DUMP.squash = 0.8;
    dumpSound('boing');
    floatText(DUMP.x, top + 0.5, DUMP.z, 'BOING!', 'big');
    styleAdd(3);
  } else if (dd < br + 0.35 && dd > 0.001 && P.y < top - 0.6) {
    const m = br + 0.35;
    P.x = DUMP.x + ((P.x - DUMP.x) / dd) * m;
    P.z = DUMP.z + ((P.z - DUMP.z) / dd) * m;
    if (Math.hypot(P.vx, P.vz) > 3 && G.time - (DUMP.bumpT || 0) > 0.5) {
      DUMP.bumpT = G.time;
      dumpKickWorld(-(P.x - DUMP.x) / dd * 0.6, 0.15, -(P.z - DUMP.z) / dd * 0.6, 0.006);
    }
  }
  // Darren's sword tickles: the belly wobbles and he giggles (no damage)
  if ((P.st === 'attack' || P.st === 'charge') && P.atk && !P.hitSet.has(DUMP) && dd < br + 1.6 && Math.abs(P.y - DUMP.y) < 2.2) {
    const facing = Math.abs(angDiff(P.face, Math.atan2(DUMP.x - P.x, DUMP.z - P.z))) < 1.1;
    if (facing && P.f > 4) {
      P.hitSet.add(DUMP);
      const n = dd || 1,
        k = P.atk.hs >= 6 ? 1.3 : 0.7;
      dumpKickWorld(((DUMP.x - P.x) / n) * k, 0.3 * k, ((DUMP.z - P.z) / n) * k, 0.015);
      DUMP.mood = 1.2;
      dumpSay('poke');
      dumpSound('giggle');
    }
  }
  // snack bushes: walk into a ripe one (or hit it) and the snacks fall out
  for (const b of DUMP.bushes) {
    if (!b.ripe) {
      b.t -= dt;
      if (b.t <= 0) {
        b.ripe = true;
        b.fruits.forEach(f => (f.visible = true));
      }
    } else if (Math.hypot(P.x - b.def.x, P.z - b.def.z) < 1.5 && P.y < 1.5) {
      b.ripe = false;
      b.t = b.def.regrow;
      b.shake = 1;
      b.fruits.forEach(f => (f.visible = false));
      for (let k = 0; k < b.def.count; k++) spawnSnack(b.def.snack, b.def.x, 1, b.def.z);
      sfx('dig');
    }
    if (b.shake > 0) {
      b.shake = Math.max(0, b.shake - dt * 2);
      b.g.rotation.z = Math.sin(G.time * 40) * 0.08 * b.shake;
    }
  }
  if (DUMP.oven) DUMP.oven.mouth.material.color.setHSL(0.07, 1, 0.5 + Math.sin(G.time * 7) * 0.06);
  updateSnacks(dt);
  // keep the save up to date every few seconds
  DUMP.saveT -= dt;
  if (DUMP.saveT <= 0) {
    DUMP.saveT = 5;
    dumpSave();
  }
}
function dumpOnKill(e) {
  if (!DUMP.on || !dumpState().met) return;
  const L = DDATA().drops[e.type];
  if (!L) return;
  for (const [id, n, ch] of L)
    if (Math.random() < (ch === undefined ? 1 : ch)) for (let k = 0; k < n; k++) spawnSnack(id, e.x, e.y + 1, e.z);
}

/* ---------- animation (every frame, also while paused for the Hangar preview) ---------- */
function animDumpling(rdt) {
  if (!DUMP.on || !DUMP.m) return;
  const D = DUMP.m,
    B = D.B,
    t = G.time,
    w = DUMP.vis,
    fl = DUMP.flop,
    flying = DUMP.air && !fl,
    floaty = flying && dumpFloats(),
    walking = !DUMP.air && DUMP.sp > 0.4,
    talking = G.cine && TALK.who === 'dumpling';
  D.root.position.set(DUMP.x, DUMP.y, DUMP.z);
  D.root.rotation.y = DUMP.face;
  // waddle: a wide, rocking walk, each footfall sends a bounce through the belly
  const stepRate = 2.2 + DUMP.sp * 0.55 - w * 0.4;
  if (walking) {
    const ph0 = DUMP.ph;
    DUMP.ph += rdt * stepRate * TAU * 0.5;
    if (Math.floor(ph0 / PI) !== Math.floor(DUMP.ph / PI)) {
      dumpKick(0, -0.45 - w * 0.5, 0.05, 0.004);
      const near = Math.hypot(P.x - DUMP.x, P.z - DUMP.z);
      if (Snd.ctx && near < 16) Snd.noise(0.09, (0.08 + w * 0.12) * (1 - near / 16), 520 - w * 200, 90, 0.8);
      if (w > 0.5) dust(DUMP.x, DUMP.z, 2);
    }
  } else DUMP.ph = damp(DUMP.ph, Math.round(DUMP.ph / PI) * PI, 6, rdt);
  const ph = DUMP.ph,
    amp = walking ? Math.min(1, DUMP.sp / 4) : 0,
    sway = Math.sin(ph) * (0.12 + w * 0.06) * amp;
  B.hips.rotation.z = sway;
  B.hips.rotation.x = 0;
  B.spine.rotation.z = -sway * 0.5;
  B.thighL.rotation.x = Math.sin(ph) * 0.55 * amp;
  B.thighR.rotation.x = -Math.sin(ph) * 0.55 * amp;
  B.thighL.rotation.z = 0.04 + w * 0.12;
  B.thighR.rotation.z = -0.04 - w * 0.12;
  B.footL.rotation.x = -Math.max(0, Math.sin(ph)) * 0.4 * amp;
  B.footR.rotation.x = -Math.max(0, -Math.sin(ph)) * 0.4 * amp;
  D.body.position.y = Math.abs(Math.sin(ph)) * 0.06 * amp;
  // arms rest on top of the belly: they ride further out and forward as he gets rounder
  const armOut = 0.08 + w * 0.7 + DUMP.full * 0.22,
    armFwd = -(w * 0.55 + DUMP.full * 0.22);
  let aSw = Math.sin(ph) * 0.25 * amp;
  B.armL.rotation.set(armFwd + aSw, 0, armOut);
  B.armR.rotation.set(armFwd - aSw, 0, -armOut);
  B.handL.rotation.set(0, 0, 0);
  B.handR.rotation.set(0, 0, 0);
  // tail: a lazy swish
  const tsw = Math.sin(t * 1.4) * 0.18 + Math.sin(ph) * 0.2 * amp;
  B.tail1.rotation.y = tsw;
  B.tail2.rotation.y = tsw * 0.8;
  B.tail3.rotation.y = tsw * 0.8 + Math.sin(t * 2.3) * 0.12;
  B.tail1.rotation.x = flying ? -0.35 : 0;
  // head: looks at Darren, nods while talking, chomps while eating
  const look = Math.atan2(P.x - DUMP.x, P.z - DUMP.z),
    yaw = clamp(angDiff(DUMP.face, look), -0.8, 0.8);
  B.neck.rotation.y = damp(B.neck.rotation.y, yaw * 0.4, 5, rdt);
  B.head.rotation.y = damp(B.head.rotation.y, yaw * 0.5, 5, rdt);
  let nod = Math.sin(t * 1.3) * 0.03;
  if (talking) nod += Math.sin(t * 9) * 0.06;
  if (DUMP.eatT > 0) nod += Math.abs(Math.sin(DUMP.eatT * 12)) * 0.22 - 0.05;
  if (DUMP.mood > 0 && DUMP.eatT <= 0) {
    // giggle shake
    B.spine.rotation.z += Math.sin(t * 28) * 0.05 * DUMP.mood;
    nod += Math.sin(t * 20) * 0.04 * DUMP.mood;
  }
  B.head.rotation.x = nod;
  B.head.rotation.z = Math.sin(t * 0.9) * 0.04;
  // ears flick, tuft and tail puff breathe
  D.ears.forEach((e, i) => (e.rotation.x = Math.sin(t * 2.1 + i) * 0.08 + (DUMP.mood > 0 ? Math.sin(t * 18) * 0.15 : 0)));
  D.tuft.scale.setScalar(1 + Math.sin(t * 2.2) * 0.05);
  D.tailPuff.scale.setScalar(1 + Math.sin(t * 1.7 + 1) * 0.06);
  // wings: tiny wings buzz like a bumblebee's when light; slow paddles while he floats like a balloon
  let flap = 0;
  if (fl) flap = Math.sin(t * 30) * 0.7;
  else if (floaty) flap = Math.sin(t * 5) * 0.45;
  else if (flying) flap = Math.sin(t * (32 - w * 10)) * 0.75;
  else flap = Math.sin(t * 1.2) * 0.06;
  D.wings.forEach(g => {
    const k = g.userData.k;
    g.rotation.set(0.25, k * (0.5 + flap * 0.3), k * (0.25 + flap));
  });
  if (flying && !floaty && Math.random() < rdt * 6) dumpSound('flap');
  // flying pose: legs dangle forward, belly leads; floating: the belly puffs up a bit more
  if (flying || fl) {
    B.thighL.rotation.x = -0.45 + Math.sin(t * 3) * 0.1;
    B.thighR.rotation.x = -0.45 - Math.sin(t * 3) * 0.1;
    B.hips.rotation.x = -0.08;
  }
  // eyelids: blink, squint happily when eating or giggling
  DUMP.blinkT -= rdt;
  let lid = -0.5;
  if (DUMP.blinkT < 0.12) lid = 1.35;
  if (DUMP.blinkT < 0) DUMP.blinkT = rnd(2, 5);
  if (DUMP.eatT > 0 || DUMP.mood > 0.3) lid = 0.55;
  D.lids.forEach(([up, low]) => {
    up.rotation.x = damp(up.rotation.x, lid, 30, rdt);
    low.rotation.x = PI + (DUMP.eatT > 0 || DUMP.mood > 0.3 ? 0.55 : 0.95);
  });
  D.eyes.forEach((e, i) => {
    e.rotation.x = clamp(-(P.y + 1 - (DUMP.y + 1.8)) * 0.05, -0.3, 0.3);
  });
  // squash and stretch on landings and trampolines
  DUMP.squash = Math.max(0, DUMP.squash - rdt * 3);
  const sq = Math.sin(DUMP.squash * PI) * 0.12 * DUMP.squash;
  const sc = DDATA().scale;
  D.root.scale.set(sc * (1 + sq), sc * (1 - sq), sc * (1 + sq));
  // scarf and the belly / weight shader
  const ss = 1 + w * 0.5 + DUMP.full * 0.06;
  D.scarf.scale.set(ss, 1, ss);
  D.scarf.position.set(0, w * 0.03, w * 0.06);
  DUMP_U.uW.value = w;
  DUMP_U.uStuff.value = dumpStuff() + (floaty ? 0.15 : 0);
  DUMP_U.uJig.value.set(DUMP.J.x, DUMP.J.y, DUMP.J.z);
  DUMP_U.uRip.value = DUMP.rip;
  DUMP_U.uT.value = t;
  DUMP_U.uBreath.value = Math.sin(t * (talking ? 3 : 1.7));
}

/* ---------- HUD chip: his tier and the Belly Bounce timer ---------- */
function dumpHud() {
  const box = $('dumpHud'),
    on = isAdventure() && DUMP.on && dumpState().met && !G.cine && DUMP.st !== 'home';
  box.hidden = !on;
  $('tBelly').hidden = !on;
  if (!on) return;
  const st = dumpBounceStats(DUMP.vis, DUMP.full),
    SI = dumpStage(),
    tier = SI.name + ' · ' + (SI.k + 1) + '/' + WEIGHT_STAGES,
    key = DUMP.cd > 0 ? 'Belly Bounce ' + Math.ceil(DUMP.cd) + 's' : (COARSE ? 'Belly' : 'G') + ' Belly Bounce';
  if ($('dhTier').textContent !== tier) $('dhTier').textContent = tier;
  if ($('dhKey').textContent !== key) $('dhKey').textContent = key;
  $('dhCdF').style.transform = 'scaleX(' + clamp(1 - DUMP.cd / st.wait, 0, 1) + ')';
  box.classList.toggle('ready', DUMP.cd <= 0);
  box.classList.toggle('hot', DUMP.spicy > 0);
}
