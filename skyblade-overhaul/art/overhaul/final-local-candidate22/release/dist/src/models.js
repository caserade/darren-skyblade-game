/* MODELS: shared geometry/materials, the placeholder toy Darren (also used for Mom), enemies, the boss,
   island pieces, trees and the sky/backdrop (buildSky). */
/* ---------- geometry + materials ---------- */
const UP = new T.Vector3(0, 1, 0);
const GEO = {
  hi: new T.SphereGeometry(1, 48, 32), // characters: high-poly smooth parts
  mid: new T.SphereGeometry(1, 28, 18),
  hemi: new T.SphereGeometry(1, 40, 18, 0, TAU, 0, PI / 2),
  cyl: new T.CylinderGeometry(1, 1, 1, 24),
  cylT: new T.CylinderGeometry(0.4, 1, 1, 24),
  cone: new T.ConeGeometry(1, 1, 32, 4),
  rock: new T.IcosahedronGeometry(1, 1), // world: medium-poly faceted
  rock0: new T.DodecahedronGeometry(1, 0),
  octa: new T.OctahedronGeometry(1, 0),
  box: new T.BoxGeometry(1, 1, 1),
  lowCone: new T.ConeGeometry(1, 1, 8),
  lowCyl: new T.CylinderGeometry(1, 1, 1, 8),
};
const TOYS = [];
function toy(color, o) {
  const m = new T.MeshPhysicalMaterial(
    Object.assign(
      { color, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.14, envMapIntensity: 0.55 },
      o || {},
    ),
  );
  TOYS.push(m);
  return m;
}
function flat(color, o) {
  return new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.92, flatShading: true }, o || {}));
}
const MAT = {
  red: toy(0xdc140c),
  pink: toy(0xff7f7a, { side: T.DoubleSide, roughness: 0.45 }),
  white: toy(0xffffff),
  black: toy(0x140808),
  dark: toy(0x5a0a0a),
  iris: toy(0x9a0f12),
  yellow: toy(0xffc928, { roughness: 0.55, clearcoat: 0.3 }),
  dot: toy(0xff6fa8),
  gold: toy(0xf5b301, { metalness: 0.6, roughness: 0.25 }),
  grip: toy(0x8a1a12, { roughness: 0.6, clearcoat: 0.2 }),
  blade: toy(0xff4a12, { emissive: 0xff2a00, emissiveIntensity: 0.18, roughness: 0.2 }),
  cream: toy(0xfff0d6),
  capRed: toy(0xd9342b),
  teal: toy(0x22b0a2),
  tealLt: toy(0xc9f5ee),
  bolt: toy(0xffd23a),
  orange: toy(0xff8a2a),
  shell: toy(0x1d5a2a),
  belly: toy(0xf2dc8a),
  green: toy(0x34883a),
  stone: flat(0x8d8a86),
  stoneD: flat(0x6a6764),
  moss: flat(0x5b9a4a),
  flashW: new T.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
    blending: T.AdditiveBlending,
    depthWrite: false,
  }),
  flashR: new T.MeshBasicMaterial({
    color: 0xff2a1a,
    transparent: true,
    opacity: 0.5,
    blending: T.AdditiveBlending,
    depthWrite: false,
  }),
};
function mk(geo, mat, x, y, z, sx, sy, sz) {
  const m = new T.Mesh(geo, mat);
  m.position.set(x || 0, y || 0, z || 0);
  if (sx !== undefined) m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
  m.castShadow = true;
  return m;
}
function grp(parent, x, y, z) {
  const g = new T.Group();
  g.position.set(x || 0, y || 0, z || 0);
  if (parent) parent.add(g);
  return g;
}
function limb(ax, ay, az, bx, by, bz, r, mat, taper) {
  const a = new T.Vector3(ax, ay, az),
    d = new T.Vector3(bx, by, bz).sub(a),
    len = d.length();
  const m = new T.Mesh(taper ? GEO.cylT : GEO.cyl, mat);
  m.scale.set(r, len, r);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  m.castShadow = true;
  return m;
}
function eyePair(parent, x, y, z, s, angry) {
  for (const sx of [1, -1]) {
    const e = grp(parent, sx * x, y, z);
    e.rotation.y = sx * 0.32;
    e.add(mk(GEO.mid, MAT.black, 0, 0, 0, s * 0.8, s, s * 0.5));
    e.add(mk(GEO.mid, MAT.white, sx * -s * 0.2, s * 0.35, s * 0.4, s * 0.25, s * 0.28, s * 0.15));
    if (angry) {
      const b = mk(GEO.mid, MAT.black, 0, s * 1.15, s * 0.2, s * 1.2, s * 0.28, s * 0.3);
      b.rotation.z = sx * 0.45;
      e.add(b);
    }
  }
}

/* ---------- Darren ---------- */
function buildSword() {
  const g = new T.Group();
  const grip = mk(GEO.cyl, MAT.grip, 0, 0, 0, 0.04, 0.22, 0.04);
  grip.rotation.x = PI / 2;
  g.add(grip);
  g.add(mk(GEO.mid, MAT.gold, 0, 0, -0.13, 0.055));
  g.add(mk(GEO.hi, MAT.gold, 0, 0, 0.13, 0.2, 0.06, 0.06));
  g.add(mk(GEO.mid, MAT.gold, 0.2, 0, 0.13, 0.05));
  g.add(mk(GEO.mid, MAT.gold, -0.2, 0, 0.13, 0.05));
  const s = new T.Shape();
  s.moveTo(-0.08, 0);
  s.quadraticCurveTo(-0.19, 0.2, -0.08, 0.4);
  s.quadraticCurveTo(-0.17, 0.6, -0.06, 0.78);
  s.quadraticCurveTo(-0.08, 0.96, 0, 1.1);
  s.quadraticCurveTo(0.11, 0.9, 0.07, 0.74);
  s.quadraticCurveTo(0.19, 0.56, 0.09, 0.37);
  s.quadraticCurveTo(0.18, 0.17, 0.08, 0);
  s.closePath();
  const bg = new T.ExtrudeGeometry(s, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 4,
    curveSegments: 20,
  });
  bg.translate(0, 0, -0.015);
  bg.rotateX(PI / 2);
  const bladeMat = MAT.blade.clone();
  const blade = new T.Mesh(bg, bladeMat);
  blade.position.z = 0.16;
  blade.castShadow = true;
  g.add(blade);
  const base = grp(g, 0, 0, 0.85),
    tip = grp(g, 0, 0, 1.26);
  return { g, base, tip, bladeMat };
}
function buildWing(parent, sx) {
  const outer = grp(parent, sx * 0.13, 0.44, -0.2),
    g = grp(outer);
  g.scale.x = sx;
  g.add(limb(0, 0, 0, 0.3, 0.52, 0, 0.05, MAT.red));
  g.add(mk(GEO.mid, MAT.red, 0.3, 0.52, 0, 0.06));
  g.add(limb(0.3, 0.52, 0, 1.08, 0.3, 0, 0.042, MAT.red, true));
  g.add(limb(0.3, 0.52, 0, 0.94, -0.24, 0, 0.038, MAT.red, true));
  g.add(limb(0.3, 0.52, 0, 0.52, -0.44, 0, 0.036, MAT.red, true));
  const claw = mk(GEO.cone, MAT.white, 0.32, 0.68, 0, 0.055, 0.26, 0.055);
  claw.rotation.z = -0.15;
  g.add(claw);
  const s = new T.Shape();
  s.moveTo(0.3, 0.52);
  s.lineTo(1.08, 0.3);
  s.quadraticCurveTo(0.82, 0.12, 0.94, -0.24);
  s.quadraticCurveTo(0.64, -0.16, 0.52, -0.44);
  s.quadraticCurveTo(0.3, -0.16, 0.06, -0.22);
  s.lineTo(0, 0);
  s.closePath();
  const m = new T.Mesh(new T.ShapeGeometry(s, 18), MAT.pink);
  m.castShadow = true;
  m.position.z = -0.005;
  g.add(m);
  return outer;
}
function buildDarren() {
  const root = new T.Group(),
    piv = grp(root, 0, 0.8, 0),
    rig = grp(piv, 0, -0.8, 0);
  const leg = sx => {
    const g = grp(rig, sx * 0.17, 0.38, 0);
    g.add(mk(GEO.hi, MAT.red, 0, -0.15, 0, 0.15, 0.21, 0.16));
    g.add(mk(GEO.hi, MAT.red, 0, -0.32, 0.07, 0.14, 0.075, 0.2));
    g.add(mk(GEO.mid, MAT.dark, 0, -0.335, 0.2, 0.1, 0.05, 0.075));
    return g;
  };
  const legL = leg(1),
    legR = leg(-1);
  const body = grp(rig, 0, 0.4, 0);
  body.add(mk(GEO.hi, MAT.red, 0, 0.2, 0, 0.27, 0.32, 0.24));
  body.add(mk(GEO.hi, MAT.red, 0, 0.1, 0.02, 0.3, 0.25, 0.27));
  // scarf
  const sc = new T.Mesh(new T.TorusGeometry(0.215, 0.075, 18, 44), MAT.yellow);
  sc.rotation.x = PI / 2;
  sc.position.set(0, 0.49, 0.01);
  sc.scale.set(1, 1, 0.8);
  sc.castShadow = true;
  body.add(sc);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.3;
    body.add(
      mk(GEO.mid, MAT.dot, Math.cos(a) * 0.285, 0.49 + Math.sin(i * 2.3) * 0.025, 0.01 + Math.sin(a) * 0.285, 0.026),
    );
  }
  const scarfT = grp(body, 0.12, 0.47, -0.24);
  const st1 = mk(GEO.box, MAT.yellow, 0, -0.16, 0, 0.13, 0.34, 0.03),
    st2 = mk(GEO.box, MAT.yellow, -0.1, -0.13, 0.02, 0.11, 0.28, 0.03);
  st2.rotation.z = -0.25;
  scarfT.add(st1, st2);
  scarfT.add(mk(GEO.mid, MAT.dot, 0, -0.2, -0.02, 0.025));
  scarfT.add(mk(GEO.mid, MAT.dot, 0.02, -0.08, -0.02, 0.022));
  // head
  const head = grp(body, 0, 0.5, 0);
  head.add(mk(GEO.hi, MAT.red, 0, 0.36, 0.03, 0.45, 0.41, 0.43));
  head.add(mk(GEO.hi, MAT.red, 0, 0.2, 0.34, 0.21, 0.14, 0.17));
  head.add(mk(GEO.mid, MAT.dark, 0.06, 0.27, 0.495, 0.017, 0.022, 0.012));
  head.add(mk(GEO.mid, MAT.dark, -0.06, 0.27, 0.495, 0.017, 0.022, 0.012));
  const arc = PI * 0.55,
    smile = new T.Mesh(new T.TorusGeometry(0.12, 0.011, 8, 24, arc), MAT.black);
  smile.position.set(0, 0.285, 0.485);
  smile.rotation.z = -PI / 2 - arc / 2;
  smile.rotation.x = 0.35;
  head.add(smile);
  for (const sx of [1, -1]) {
    const e = grp(head, sx * 0.2, 0.44, 0.375);
    e.rotation.y = sx * 0.4;
    e.rotation.x = -0.06;
    e.add(mk(GEO.hi, MAT.white, 0, 0, 0, 0.135, 0.175, 0.06));
    e.add(mk(GEO.hi, MAT.iris, -sx * 0.015, -0.02, 0.038, 0.092, 0.128, 0.032));
    e.add(mk(GEO.hi, MAT.black, -sx * 0.015, -0.02, 0.056, 0.058, 0.09, 0.02));
    e.add(mk(GEO.mid, MAT.white, sx * 0.025, 0.05, 0.072, 0.03, 0.036, 0.012));
    const b = mk(GEO.mid, MAT.black, sx * 0.2, 0.645, 0.31, 0.15, 0.036, 0.045);
    b.rotation.z = sx * 0.38;
    b.rotation.y = sx * 0.35;
    head.add(b);
  }
  const spike = mk(GEO.cone, MAT.red, 0, 0.96, -0.06, 0.13, 0.6, 0.13);
  spike.rotation.x = -0.14;
  head.add(spike);
  // arms
  const arm = sx => {
    const g = grp(body, sx * 0.27, 0.37, 0.02);
    g.add(mk(GEO.hi, MAT.red, 0, -0.15, 0, 0.085, 0.18, 0.085));
    g.add(mk(GEO.hi, MAT.red, 0, -0.31, 0, 0.095));
    return g;
  };
  const armL = arm(1),
    armR = arm(-1);
  const sw = buildSword();
  sw.g.position.set(0, -0.31, 0);
  armR.add(sw.g);
  const wingL = buildWing(body, 1),
    wingR = buildWing(body, -1);
  // tail
  const tail = [];
  let par = grp(body, 0, 0.06, -0.17),
    r = 0.17;
  for (let i = 0; i < 12; i++) {
    tail.push(par);
    par.add(mk(GEO.hi, MAT.red, 0, 0, 0, r, r, r * 1.2));
    const nx = grp(par, 0, 0, -r * 0.72);
    r *= 0.89;
    par = nx;
  }
  const tipc = mk(GEO.cone, MAT.red, 0, 0, -0.1, r * 1.1, 0.26, r * 1.1);
  tipc.rotation.x = -PI / 2;
  par.add(tipc);
  tail.push(par);
  root.traverse(o => {
    if (o.isMesh) o.frustumCulled = false;
  });
  return {
    root,
    piv,
    rig,
    body,
    head,
    armL,
    armR,
    legL,
    legR,
    wingL,
    wingR,
    tail,
    scarfT,
    sword: sw.g,
    sBase: sw.base,
    sTip: sw.tip,
    bladeMat: sw.bladeMat,
  };
}

/* ---------- enemies ---------- */
function addShell(root, y, s) {
  const m = new T.Mesh(GEO.mid, MAT.flashW);
  m.position.y = y;
  m.scale.setScalar(s);
  m.visible = false;
  root.add(m);
  return m;
}
function buildPuffcap(capMat, spotMat, bodyMat) {
  const root = new T.Group(),
    b = grp(root);
  b.add(mk(GEO.hi, bodyMat || MAT.cream, 0, 0.42, 0, 0.38, 0.42, 0.38));
  const cap = grp(b, 0, 0.6, 0);
  cap.add(mk(GEO.hemi, capMat || MAT.capRed, 0, 0, 0, 0.66, 0.52, 0.66));
  const und = mk(GEO.cyl, MAT.cream, 0, -0.01, 0, 0.64, 0.03, 0.64);
  cap.add(und);
  [
    [0, 0.5, 0, 0.16],
    [0.36, 0.3, 0.2, 0.11],
    [-0.33, 0.32, 0.22, 0.1],
    [0.2, 0.33, -0.36, 0.11],
    [-0.25, 0.3, -0.34, 0.12],
    [0, 0.26, 0.5, 0.09],
  ].forEach(p => cap.add(mk(GEO.mid, spotMat || MAT.white, p[0], p[1], p[2], p[3], p[3] * 0.45, p[3])));
  eyePair(b, 0.13, 0.46, 0.33, 0.075, true);
  const fL = mk(GEO.mid, MAT.dark, 0.17, 0.07, 0.05, 0.13, 0.08, 0.17),
    fR = mk(GEO.mid, MAT.dark, -0.17, 0.07, 0.05, 0.13, 0.08, 0.17);
  root.add(fL, fR);
  return { root, b, cap, fL, fR, shell: addShell(root, 0.55, 0.8) };
}
function buildGustling() {
  const root = new T.Group(),
    b = grp(root, 0, 0.45, 0);
  b.add(mk(GEO.hi, MAT.teal, 0, 0, 0, 0.42));
  b.add(mk(GEO.hi, MAT.tealLt, 0, -0.08, 0.12, 0.33, 0.3, 0.33));
  eyePair(b, 0.16, 0.1, 0.36, 0.08, true);
  const wL = grp(b, 0.36, 0.1, -0.05),
    wR = grp(b, -0.36, 0.1, -0.05);
  wL.add(mk(GEO.hi, MAT.tealLt, 0.22, 0, 0, 0.28, 0.05, 0.17));
  wR.add(mk(GEO.hi, MAT.tealLt, -0.22, 0, 0, 0.28, 0.05, 0.17));
  const tl = new T.Mesh(GEO.gustTail || (GEO.gustTail = new T.TorusGeometry(0.2, 0.06, 12, 24, PI * 1.5)), MAT.teal);
  tl.position.set(0, -0.05, -0.5);
  tl.rotation.y = PI / 2;
  tl.castShadow = true;
  b.add(tl);
  return { root, b, wL, wR, shell: addShell(root, 0.45, 0.62) };
}
function buildBoltail() {
  const root = new T.Group(),
    b = grp(root);
  b.add(mk(GEO.hi, MAT.bolt, 0, 0.4, 0, 0.36, 0.34, 0.48));
  const hd = grp(b, 0, 0.66, 0.32);
  hd.add(mk(GEO.hi, MAT.bolt, 0, 0, 0, 0.3, 0.28, 0.3));
  hd.add(mk(GEO.mid, MAT.orange, 0.22, -0.06, 0.14, 0.07, 0.06, 0.05));
  hd.add(mk(GEO.mid, MAT.orange, -0.22, -0.06, 0.14, 0.07, 0.06, 0.05));
  eyePair(hd, 0.12, 0.05, 0.25, 0.06, true);
  hd.add(mk(GEO.cone, MAT.orange, 0.14, 0.3, -0.05, 0.06, 0.22, 0.06));
  hd.add(mk(GEO.cone, MAT.orange, -0.14, 0.3, -0.05, 0.06, 0.22, 0.06));
  const tl = grp(b, 0, 0.4, -0.42);
  tl.add(limb(0, 0, 0, 0.12, 0.25, -0.2, 0.07, MAT.orange));
  tl.add(limb(0.12, 0.25, -0.2, -0.1, 0.42, -0.34, 0.06, MAT.orange));
  tl.add(limb(-0.1, 0.42, -0.34, 0.06, 0.7, -0.48, 0.05, MAT.orange, true));
  for (const [x, z] of [
    [0.22, 0.25],
    [-0.22, 0.25],
    [0.22, -0.2],
    [-0.22, -0.2],
  ])
    root.add(mk(GEO.mid, MAT.orange, x, 0.07, z, 0.1, 0.08, 0.13));
  return { root, b, hd, tl, shell: addShell(root, 0.5, 0.75) };
}
function buildThornback() {
  const root = new T.Group(),
    b = grp(root);
  b.add(mk(GEO.hi, MAT.belly, 0, 1.0, 0.05, 0.75, 0.9, 0.68));
  const sh = grp(b, 0, 1.08, -0.28);
  sh.add(mk(GEO.hi, MAT.shell, 0, 0, 0, 0.92, 1.0, 0.74));
  const spikes = [];
  [
    [0, 0.9, -0.3],
    [0.5, 0.6, -0.5],
    [-0.5, 0.6, -0.5],
    [0, 0.3, -0.78],
    [0.6, 0, -0.6],
    [-0.6, 0, -0.6],
    [0, -0.4, -0.72],
    [0.45, 0.85, -0.1],
    [-0.45, 0.85, -0.1],
  ].forEach(p => {
    const c = mk(GEO.cone, MAT.cream, p[0], p[1], p[2], 0.14, 0.42, 0.14);
    c.quaternion.setFromUnitVectors(UP, new T.Vector3(p[0], p[1], p[2]).normalize());
    sh.add(c);
    spikes.push(c);
  });
  const hd = grp(b, 0, 1.78, 0.38);
  hd.add(mk(GEO.hi, MAT.green, 0, 0, 0, 0.42, 0.38, 0.42));
  eyePair(hd, 0.17, 0.05, 0.35, 0.075, true);
  hd.add(mk(GEO.cone, MAT.cream, 0.2, 0.36, 0, 0.07, 0.26, 0.07));
  hd.add(mk(GEO.cone, MAT.cream, -0.2, 0.36, 0, 0.07, 0.26, 0.07));
  const aL = grp(b, 0.82, 1.25, 0.2),
    aR = grp(b, -0.82, 1.25, 0.2);
  aL.add(mk(GEO.hi, MAT.green, 0.05, -0.35, 0, 0.28, 0.5, 0.28));
  aR.add(mk(GEO.hi, MAT.green, -0.05, -0.35, 0, 0.28, 0.5, 0.28));
  root.add(mk(GEO.hi, MAT.green, 0.4, 0.22, 0.05, 0.3, 0.26, 0.36));
  root.add(mk(GEO.hi, MAT.green, -0.4, 0.22, 0.05, 0.3, 0.26, 0.36));
  return { root, b, sh, spikes, hd, aL, aR, shell: addShell(root, 1.05, 1.35) };
}
function buildBoss() {
  const root = new T.Group(),
    b = grp(root);
  const cryMat = () =>
    new T.MeshStandardMaterial({
      color: 0xff8a1e,
      emissive: 0xff5a00,
      emissiveIntensity: 0.55,
      flatShading: false,
      roughness: 0.25,
    });
  const rk = (p, x, y, z, sx, sy, sz, m, ry) => {
    const o = mk(GEO.rock, m || MAT.stone, x, y, z, sx, sy, sz);
    o.rotation.y = ry || 0;
    p.add(o);
    return o;
  };
  rk(b, 0.95, 0.95, 0, 0.8, 1.15, 0.85, MAT.stoneD, 0.4);
  rk(b, -0.95, 0.95, 0, 0.8, 1.15, 0.85, MAT.stoneD, 1.2);
  rk(b, 0.95, 0.3, 0.3, 1.0, 0.45, 1.2, MAT.stone);
  rk(b, -0.95, 0.3, 0.3, 1.0, 0.45, 1.2, MAT.stone);
  rk(b, 0, 2.0, 0, 1.55, 1.0, 1.25, MAT.stone, 0.7);
  const torso = grp(b, 0, 2.4, 0);
  rk(torso, 0, 1.5, 0, 2.35, 1.85, 1.65, MAT.stone, 0.3);
  rk(torso, 0, 0.5, 0.1, 1.7, 1.0, 1.3, MAT.stoneD, 1.1);
  rk(torso, 1.9, 2.55, 0, 1.1, 0.55, 1.1, MAT.moss, 0.5);
  rk(torso, -1.9, 2.55, 0, 1.1, 0.55, 1.1, MAT.moss, 2);
  rk(torso, 0.6, 3.1, -0.5, 0.7, 0.4, 0.8, MAT.moss, 1);
  const head = grp(torso, 0, 3.0, 0.7);
  rk(head, 0, 0, 0, 0.85, 0.75, 0.85, MAT.stoneD, 0.9);
  const eyeM = MAT.bossEyes || (MAT.bossEyes = new T.MeshBasicMaterial({ color: 0xffb040 }));
  head.add(mk(GEO.mid, eyeM, 0.3, 0.05, 0.72, 0.12, 0.09, 0.08));
  head.add(mk(GEO.mid, eyeM, -0.3, 0.05, 0.72, 0.12, 0.09, 0.08));
  const parts = {};
  const backM = cryMat(),
    back = grp(torso, 0, 2.2, -1.5);
  const bc = mk(GEO.octa, backM, 0, 0, 0, 0.75, 1.45, 0.75);
  bc.rotation.x = -0.5;
  back.add(bc);
  const bc2 = mk(GEO.octa, backM, 0.7, -0.3, 0.1, 0.4, 0.8, 0.4);
  bc2.rotation.set(-0.4, 0, -0.5);
  back.add(bc2);
  parts.back = { node: back, mat: backM, hp: 700, alive: true, name: 'Back crystal' };
  const arm = (sx, key) => {
    const g = grp(torso, sx * 2.55, 2.3, 0);
    rk(g, 0, -0.9, 0, 0.75, 1.15, 0.75, MAT.stoneD, sx);
    rk(g, 0, -2.5, 0.1, 0.9, 1.25, 0.9, MAT.stone, sx * 2);
    rk(g, 0, -3.75, 0.2, 1.05, 0.95, 1.05, MAT.stoneD, sx * 0.6);
    const m = cryMat(),
      c = grp(g, sx * 0.85, -2.5, 0.35);
    const c1 = mk(GEO.octa, m, 0, 0, 0, 0.5, 1.0, 0.5);
    c1.rotation.z = -sx * 0.7;
    c.add(c1);
    const c2 = mk(GEO.octa, m, sx * 0.1, -0.7, 0.2, 0.32, 0.6, 0.32);
    c2.rotation.z = -sx * 1.0;
    c.add(c2);
    parts[key] = { node: c, mat: m, hp: 600, alive: true, name: sx > 0 ? 'Left arm crystal' : 'Right arm crystal' };
    return g;
  };
  const aL = arm(1, 'armL'),
    aR = arm(-1, 'armR');
  return { root, b, torso, head, aL, aR, parts, shell: addShell(root, 3.2, 3.6) };
}

/* Snowcap: a frosty Puffcap that throws snowballs */
const SNOWCAP_M = { cap: toy(0x7cc6f2), spot: toy(0xffffff), body: toy(0xeaf6ff), scarf: toy(0xff6a5c) };
function buildSnowcap() {
  const M = buildPuffcap(SNOWCAP_M.cap, SNOWCAP_M.spot, SNOWCAP_M.body);
  // a little scarf and a snowball in hand
  const sc = new T.Mesh(GEO.snowScarf || (GEO.snowScarf = new T.TorusGeometry(0.33, 0.07, 10, 24)), SNOWCAP_M.scarf);
  sc.rotation.x = PI / 2;
  sc.position.y = 0.6;
  M.b.add(sc);
  M.b.add(mk(GEO.mid, SNOWCAP_M.spot, 0.36, 0.42, 0.18, 0.13));
  // icicles on the cap rim
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU,
      ic = mk(GEO.cone, SNOWCAP_M.spot, Math.cos(a) * 0.6, -0.08, Math.sin(a) * 0.6, 0.04, 0.16, 0.04);
    ic.rotation.x = PI;
    M.cap.add(ic);
  }
  return M;
}
/* Barkling: a grumpy walking stump that burrows */
const BARK_M = {
  bark: toy(0x8a5a32, { roughness: 0.55, clearcoat: 0.3 }),
  ring: toy(0xd8b07a, { roughness: 0.5 }),
  leaf: toy(0x5fbf4a),
  dirt: flat(0x7a5a3c),
};
function buildBarkling() {
  const root = new T.Group(),
    b = grp(root);
  b.add(mk(GEO.cyl, BARK_M.bark, 0, 0.5, 0, 0.42, 0.85, 0.42));
  b.add(mk(GEO.cyl, BARK_M.ring, 0, 0.93, 0, 0.39, 0.03, 0.39));
  b.add(mk(GEO.cyl, BARK_M.bark, 0, 0.93, 0, 0.3, 0.035, 0.3));
  b.add(mk(GEO.cyl, BARK_M.ring, 0, 0.94, 0, 0.18, 0.035, 0.18));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3,
      r = mk(GEO.mid, BARK_M.bark, Math.cos(a) * 0.4, rnd(0.3, 0.8), Math.sin(a) * 0.4, 0.06, 0.28, 0.06);
    b.add(r);
  }
  eyePair(b, 0.15, 0.58, 0.38, 0.08, true);
  b.add(mk(GEO.mid, MAT.dark, 0, 0.36, 0.4, 0.12, 0.05, 0.05));
  const leaf = grp(b, 0.05, 0.95, 0);
  leaf.add(limb(0, 0, 0, 0.05, 0.25, 0, 0.025, BARK_M.leaf));
  leaf.add(mk(GEO.mid, BARK_M.leaf, 0.14, 0.28, 0, 0.13, 0.05, 0.07));
  leaf.add(mk(GEO.mid, BARK_M.leaf, -0.06, 0.24, 0, 0.1, 0.04, 0.06));
  const rL = grp(root, 0.22, 0.12, 0),
    rR = grp(root, -0.22, 0.12, 0);
  rL.add(mk(GEO.mid, BARK_M.bark, 0.05, -0.04, 0.08, 0.13, 0.08, 0.2));
  rR.add(mk(GEO.mid, BARK_M.bark, -0.05, -0.04, 0.08, 0.13, 0.08, 0.2));
  // dirt mound shown while it tunnels, and dizzy stars after it pops up
  const mound = mk(GEO.hemi, BARK_M.dirt, 0, 0, 0, 0.75, 0.45, 0.75);
  mound.visible = false;
  root.add(mound);
  const stars = grp(root, 0, 1.35, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    stars.add(mk(GEO.octa, MAT.yellow, Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35, 0.09));
  }
  stars.visible = false;
  return { root, b, leaf, rL, rR, mound, stars, shell: addShell(root, 0.55, 0.85) };
}
/* a gold crown for Elite enemies */
function buildCrown() {
  const g = new T.Group(),
    m = MAT.gold;
  const band = new T.Mesh(GEO.crownBand || (GEO.crownBand = new T.CylinderGeometry(0.2, 0.18, 0.1, 20, 1, true)), m);
  band.castShadow = true;
  g.add(band);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    g.add(mk(GEO.cone, m, Math.cos(a) * 0.19, 0.12, Math.sin(a) * 0.19, 0.045, 0.16, 0.045));
    g.add(mk(GEO.mid, MAT.dot, Math.cos(a) * 0.19, 0.22, Math.sin(a) * 0.19, 0.03));
  }
  return g;
}
/* Old Knotroot: the Chapter 2 boss, a giant grumpy tree stump. Same parts as Grumblepeak (torso, arms, three
   glowing weak spots called armL, armR and back) so the shared boss code can drive him. */
function buildKnotroot() {
  const root = new T.Group(),
    b = grp(root);
  const materials = buildKnotroot.materials || (buildKnotroot.materials = {
    bark: toy(0x7a4e2c, { roughness: 0.6, clearcoat: 0.2 }), barkD: flat(0x5a3820),
    moss: flat(0x5b9a4a), leafM: flat(0x4fae52), ring: toy(0xd8b07a, {roughness:0.5}),
    innerRing: toy(0xd8b07a), eyes: new T.MeshBasicMaterial({color:0xd8ff7a})
  });
  const {bark, barkD, moss, leafM} = materials;
  const sapMat = () =>
    new T.MeshStandardMaterial({
      color: 0xc8ff5a,
      emissive: 0x7ad020,
      emissiveIntensity: 0.55,
      flatShading: true,
      roughness: 0.25,
    });
  // roots spreading on the ground
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.2;
    const r = limb(0, 0.6, 0, Math.cos(a) * 2.6, 0.1, Math.sin(a) * 2.6, 0.32, bark, true);
    b.add(r);
  }
  b.add(mk(GEO.cylT, bark, 0, 1.2, 0, 1.9, 2.4, 1.9));
  const torso = grp(b, 0, 2.3, 0);
  const trunk = mk(GEO.cyl, bark, 0, 1.4, 0, 1.6, 2.9, 1.5);
  torso.add(trunk);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    torso.add(mk(GEO.box, barkD, Math.cos(a) * 1.55, 1.4 + rnd(-0.4, 0.4), Math.sin(a) * 1.45, 0.18, 2.4, 0.3));
  }
  // flat top with rings, moss and a crown of leaves
  torso.add(mk(GEO.cyl, materials.ring, 0, 2.86, 0, 1.5, 0.06, 1.4));
  torso.add(mk(GEO.cyl, barkD, 0, 2.9, 0, 1.0, 0.04, 0.95));
  torso.add(mk(GEO.cyl, materials.innerRing, 0, 2.93, 0, 0.5, 0.04, 0.48));
  const leaves = grp(torso, 0, 3.0, -0.3);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU,
      c = mk(GEO.lowCone, leafM, Math.cos(a) * 1.1, 0.5, Math.sin(a) * 1.0, 0.55, 1.3, 0.55);
    c.rotation.z = Math.cos(a) * 0.5;
    c.rotation.x = -Math.sin(a) * 0.5;
    leaves.add(c);
  }
  torso.add(mk(GEO.rock, moss, 1.1, 2.5, 0.6, 0.6, 0.3, 0.6));
  torso.add(mk(GEO.rock, moss, -1.2, 0.8, 0.5, 0.5, 0.3, 0.5));
  // face
  const head = grp(torso, 0, 1.8, 1.35);
  const eyeM = materials.eyes;
  for (const s of [1, -1]) {
    head.add(mk(GEO.mid, MAT.black, s * 0.5, 0, 0, 0.32, 0.26, 0.12));
    head.add(mk(GEO.mid, eyeM, s * 0.5, 0, 0.08, 0.15, 0.12, 0.06));
    const br = mk(GEO.box, barkD, s * 0.5, 0.33, 0.1, 0.55, 0.14, 0.18);
    br.rotation.z = s * 0.35;
    head.add(br);
  }
  head.add(mk(GEO.mid, MAT.black, 0, -0.75, 0.02, 0.6, 0.2, 0.12));
  head.add(mk(GEO.rock, bark, 0, -0.25, 0.15, 0.22, 0.3, 0.22));
  const parts = {};
  // heart-knot on the back
  const backM = sapMat(),
    back = grp(torso, 0, 1.6, -1.5);
  back.add(mk(GEO.octa, backM, 0, 0, 0, 0.6, 0.9, 0.5));
  back.add(mk(GEO.octa, backM, 0.35, -0.5, 0.05, 0.3, 0.45, 0.25));
  parts.back = { node: back, mat: backM, hp: 500, alive: true, name: 'Heart-knot' };
  const arm = (sx, key) => {
    const g = grp(torso, sx * 1.75, 2.0, 0);
    g.add(limb(0, 0, 0, sx * 0.6, -1.6, 0.2, 0.42, bark, true));
    g.add(limb(sx * 0.6, -1.6, 0.2, sx * 0.4, -3.3, 0.5, 0.36, bark, true));
    for (let i = 0; i < 3; i++)
      g.add(limb(sx * 0.4, -3.3, 0.5, sx * (0.4 + (i - 1) * 0.5), -4.1, 0.9 + rnd(-0.2, 0.2), 0.14, barkD, true));
    g.add(mk(GEO.lowCone, leafM, sx * 0.3, -0.6, -0.2, 0.3, 0.7, 0.3));
    const m = sapMat(),
      c = grp(g, sx * 0.85, -1.9, 0.45);
    c.add(mk(GEO.octa, m, 0, 0, 0, 0.42, 0.7, 0.42));
    c.add(mk(GEO.octa, m, sx * 0.1, -0.5, 0.15, 0.25, 0.4, 0.25));
    parts[key] = { node: c, mat: m, hp: 420, alive: true, name: sx > 0 ? 'Left sap knot' : 'Right sap knot' };
    return g;
  };
  const aL = arm(1, 'armL'),
    aR = arm(-1, 'armR');
  root.traverse(o => {
    if (o.isMesh) o.castShadow = true;
  });
  return { root, b, torso, head, aL, aR, parts, leaves, shell: addShell(root, 3.2, 3.4) };
}

/* the Titanic Scion: Grumblepeak's build with violet crystals and darker, purple-grey stone */
function buildTitan() {
  const M = buildBoss();
  const {stone,stoneD,moss} = buildTitan.materials || (buildTitan.materials = {
    stone:flat(0x6f6880),stoneD:flat(0x4f4860),moss:flat(0x7a5aa8)
  });
  M.root.traverse(o => {
    if (!o.isMesh) return;
    if (o.material === MAT.stone) o.material = stone;
    else if (o.material === MAT.stoneD) o.material = stoneD;
    else if (o.material === MAT.moss) o.material = moss;
  });
  for (const k in M.parts) {
    M.parts[k].mat.color.setHex(0xb49aff);
    M.parts[k].mat.emissive.setHex(0x7a4cff);
    M.parts[k].hp *= 1.4;
  }
  // a crown of crystal spikes
  const cm = M.parts.back.mat;
  for (let i = 0; i < 5; i++) {
    const c = mk(
      GEO.octa,
      cm,
      (i - 2) * 0.55,
      3.9,
      0.2 - Math.abs(i - 2) * 0.15,
      0.22,
      0.6 - Math.abs(i - 2) * 0.12,
      0.22,
    );
    M.torso.add(c);
  }
  return M;
}
/* resource crystal (Cloud Utopia): break it for parts. o.part picks the colour */
function buildNode(o) {
  const col = new T.Color((DATA.parts[(o && o.part) || 'ember'] || { color: '#ff8a1e' }).color);
  const cache = buildNode.materials || (buildNode.materials = new Map());
  const m = cache.get(col.getHex()) || new T.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      flatShading: true,
    });
  cache.set(col.getHex(),m);
  const root = new T.Group(),
    b = grp(root);
  b.add(mk(GEO.rock0, MAT.stoneD, 0, 0.2, 0, 0.9, 0.4, 0.8));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU,
      h = rnd(0.7, 1.3),
      c = mk(GEO.octa, m, Math.cos(a) * 0.35, 0.4 + h * 0.5, Math.sin(a) * 0.35, 0.22, h, 0.22);
    c.rotation.set(Math.sin(a) * 0.4, rnd(TAU), -Math.cos(a) * 0.4);
    b.add(c);
  }
  b.add(mk(GEO.octa, m, 0, 1.0, 0, 0.3, 1.0, 0.3));
  return { root, b, shell: addShell(root, 0.8, 1.1), glow: col.getHex() };
}

/* ---------- world (medium poly) ---------- */
function jitter(geo, amt) {
  const p = geo.attributes.position,
    seen = {};
  for (let i = 0; i < p.count; i++) {
    const k = p.getX(i).toFixed(2) + ',' + p.getY(i).toFixed(2) + ',' + p.getZ(i).toFixed(2);
    let o = seen[k];
    if (!o) o = seen[k] = [rnd(-amt, amt), rnd(-amt, amt), rnd(-amt, amt)];
    p.setXYZ(i, p.getX(i) + o[0], p.getY(i) + o[1], p.getZ(i) + o[2]);
  }
  geo.computeVertexNormals();
  return geo;
}
function grassTexture(ring) {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const x = c.getContext('2d');
  x.fillStyle = '#5aa840';
  x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = ['#519a3a', '#66b548', '#4a9036', '#70bd50'][i % 4];
    x.globalAlpha = 0.35;
    x.beginPath();
    x.arc(rnd(1024), rnd(1024), rnd(8, 46), 0, TAU);
    x.fill();
  }
  if (ring) {
    x.globalAlpha = 0.5;
    x.strokeStyle = '#d8c48a';
    x.lineWidth = 34;
    x.beginPath();
    x.arc(512, 512, 250, 0, TAU);
    x.stroke();
    x.globalAlpha = 0.35;
    x.lineWidth = 60;
    x.strokeStyle = '#e4d39d';
    x.beginPath();
    x.moveTo(512, 512 + 250);
    x.lineTo(512, 1024);
    x.stroke();
  }
  x.globalAlpha = 1;
  for (let i = 0; i < 200; i++) {
    const a = rnd(TAU),
      r = rnd(40, 500);
    x.fillStyle = ['#fff', '#ffd94a', '#ff9ab0'][i % 3];
    x.beginPath();
    x.arc(512 + Math.cos(a) * r, 512 + Math.sin(a) * r, rnd(1, 2.2), 0, TAU);
    x.fill();
  }
  const t = new T.CanvasTexture(c);
  t.encoding = T.sRGBEncoding;
  t.anisotropy = 4;
  return t;
}
function buildIsland(R, withTex) {
  const g = new T.Group();
  const top = new T.Mesh(new T.CylinderGeometry(R, R * 0.96, 2.4, 56, 1), [
    flat(0x7a6a55),
    withTex
      ? buildIsland.grass ||
        (buildIsland.grass = new T.MeshStandardMaterial({ map: grassTexture(false), roughness: 0.95 }))
      : flat(0x6fbf4a),
    flat(0x7a6a55),
  ]);
  top.position.y = -1.2;
  top.receiveShadow = true;
  g.add(top);
  const under = new T.Mesh(jitter(new T.ConeGeometry(R * 0.96, R * 0.7, 14, 3), R * 0.035), flat(0x8a7862));
  under.rotation.x = PI;
  under.position.y = -2.4 - R * 0.35;
  g.add(under);
  return g;
}
function buildTree(s) {
  const g = new T.Group(),
    leaf = flat([0x3f9a4a, 0x4fae52, 0x358a44][Math.floor(rnd(3))]);
  g.add(mk(GEO.lowCyl, flat(0x7a5236), 0, 1 * s, 0, 0.28 * s, 2 * s, 0.28 * s));
  for (let i = 0; i < 3; i++) {
    const c = mk(GEO.lowCone, leaf, 0, (2.2 + i * 1.15) * s, 0, (1.9 - i * 0.45) * s, 2 * s, (1.9 - i * 0.45) * s);
    c.rotation.y = rnd(TAU);
    g.add(c);
  }
  return g;
}
function buildSky() {
  // sky, fog, lights, reflections, distant islands, clouds (the playable islands are built in level.js)
  const sky = document.createElement('canvas');
  sky.width = 8;
  sky.height = 256;
  const sx = sky.getContext('2d');
  const gr = sx.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#3f8fe0');
  gr.addColorStop(0.55, '#8fd0f5');
  gr.addColorStop(1, '#fbe9d2');
  sx.fillStyle = gr;
  sx.fillRect(0, 0, 8, 256);
  const st = new T.CanvasTexture(sky);
  st.encoding = T.sRGBEncoding;
  scene.background = st;
  scene.fog = new T.Fog(0xbfe2f5, 110, 460);
  const hemi = new T.HemisphereLight(0xd8eeff, 0x86b070, 0.62);
  scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff1d8, 0.88);
  sun.castShadow = true;
  const ms = COARSE ? 1024 : 2048;
  sun.shadow.mapSize.set(ms, ms);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -24;
  sc.right = sc.top = 24;
  sc.near = 1;
  sc.far = 90;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const rim = new T.DirectionalLight(0x9fd0ff, 0.45);
  rim.position.set(-10, 8, -14);
  scene.add(rim);
  // environment map for glossy toy reflections
  try {
    const es = new T.Scene(),
      eg = new T.SphereGeometry(50, 24, 16),
      col = [];
    const p = eg.attributes.position,
      c1 = new T.Color(0x5aa6ee),
      c2 = new T.Color(0xfff2dc),
      c3 = new T.Color(0x6fa85a),
      cc = new T.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 50;
      if (y > 0) cc.copy(c2).lerp(c1, Math.pow(y, 0.6));
      else cc.copy(c2).lerp(c3, Math.min(1, -y * 3));
      col.push(cc.r, cc.g, cc.b);
    }
    eg.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    es.add(new T.Mesh(eg, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const hl = new T.Mesh(new T.SphereGeometry(7, 12, 8), new T.MeshBasicMaterial({ color: 0xffffff }));
    hl.position.set(20, 34, 14);
    es.add(hl);
    const pm = new T.PMREMGenerator(renderer),
      env = pm.fromScene(es, 0.03).texture;
    pm.dispose();
    window.ENV_TEX = env;
    TOYS.forEach(m => {
      m.envMap = env;
      m.needsUpdate = true;
    });
  } catch (_) {}
  // distant islands + clouds
  const far = [];
  [
    [70, -14, 40, 13],
    [-80, 8, 70, 17],
    [-60, -22, -40, 11],
    [90, 18, 150, 20],
    [-90, 2, 200, 15],
    [60, -6, 250, 12],
    [-120, 14, 130, 18],
    [110, -10, 90, 10],
  ].forEach(v => {
    const g = buildIsland(v[3], false);
    g.position.set(v[0], v[1], v[2]);
    g.userData.r = v[3];
    for (let i = 0; i < 4; i++) {
      const t = buildTree(rnd(1, 1.8));
      const a = rnd(TAU),
        r = rnd(v[3] * 0.7);
      t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      g.add(t);
    }
    scene.add(g);
    far.push(g);
  });
  const cm = new T.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
      roughness: 1,
      emissive: 0xffffff,
      emissiveIntensity: 0.18,
    }),
    clouds = [];
  for (let i = 0; i < 22; i++) {
    const g = new T.Group(),
      n = 3 + Math.floor(rnd(3));
    for (let j = 0; j < n; j++) {
      const s = rnd(4, 8);
      const m = new T.Mesh(buildSky.cloudGeometry||(buildSky.cloudGeometry=new T.SphereGeometry(1,12,8)), cm);
      m.position.set(j * 5 - n * 2.5, rnd(-1, 1), rnd(-2, 2));
      m.scale.set(s, s * 0.6, s * 0.8);
      g.add(m);
    }
    const a = rnd(TAU),
      r = rnd(70, 230);
    g.position.set(Math.cos(a) * r, rnd(-30, 45), 90 + Math.sin(a) * r);
    g.userData.z = g.position.z;
    scene.add(g);
    clouds.push(g);
  }
  return { sun, hemi, rim, far, clouds };
}
