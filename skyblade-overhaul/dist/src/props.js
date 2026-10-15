/* PROPS: Mom, Ruffy, the cottage, bridges, stones, the thorn barrier, the crystal cage, pickups and decorations. */
/* ---------- story characters and level props (medium poly, toy style) ---------- */
const PROP = {
  wood: flat(0x9a6a43),
  woodD: flat(0x6e4a2e),
  rope: flat(0xd9c49a),
  woodEnd: flat(0xe0c08a),
  cream: toy(0xfff1dc, { clearcoat: 0.2, roughness: 0.6 }),
  roof: flat(0xb5432f),
  roofD: flat(0x8f3424),
  window: new T.MeshBasicMaterial({ color: 0xffd98a }),
  door: flat(0x7a4a2a),
  blue: toy(0x3f8fe0),
  blueD: toy(0x2d6fb8),
  white: toy(0xf7fbff),
  nose: toy(0x141418),
  metal: toy(0xd8dde6, { metalness: 0.7, roughness: 0.25 }),
  crystal: new T.MeshStandardMaterial({
    color: 0x9fdcff,
    emissive: 0x3f9fff,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.78,
    roughness: 0.15,
    flatShading: true,
  }),
  thorn: flat(0x5b2a4a),
  vine: flat(0x3d6b34),
  glow: new T.MeshBasicMaterial({
    color: 0xff7ab8,
    transparent: true,
    opacity: 0.32,
    side: T.DoubleSide,
    depthWrite: false,
  }),
  paw: new T.MeshBasicMaterial({ color: 0x7cc6f2, transparent: true, opacity: 0.75, depthWrite: false }),
  ring: new T.MeshBasicMaterial({
    color: 0xfff1a8,
    transparent: true,
    opacity: 0.5,
    side: T.DoubleSide,
    depthWrite: false,
  }),
  stone: flat(0x9b958d),
  grass: flat(0x5aa840),
  apron: toy(0xfff8f0, { clearcoat: 0.3, roughness: 0.55 }),
  flower: toy(0xffd23a),
  pink: toy(0xff7ab8),
};

/* Mom: a grown-up red Shoyru built from the same toy parts as the old placeholder Darren */
function buildMom() {
  const D = buildDarren();
  D.sword.visible = false;
  D.root.scale.setScalar(1.22);
  const ap = buildClothApron();
  ap.position.set(0,0.16,0.19);
  D.body.add(ap);
  const fl = grp(D.head, 0.25, 0.72, 0.1);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    fl.add(mk(GEO.mid, PROP.pink, Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0, 0.05, 0.05, 0.025));
  }
  fl.add(mk(GEO.mid, PROP.flower, 0, 0, 0.01, 0.04, 0.04, 0.03));
  D.scarfT.visible = false;
  return D;
}
// Mom's pose numbers (same meaning as Darren's BASE pose in combat.js)
const MOM_BASE = {
  by: 0,
  bp: 0.04,
  byw: 0,
  br: 0,
  hp: 0,
  hy: 0,
  aRx: -0.25,
  aRy: 0,
  aRz: -0.32,
  aLx: -0.25,
  aLy: 0,
  aLz: 0.32,
  swx: 0,
  swy: 0,
  swz: 0,
  lL: 0,
  lR: 0,
  wing: 0.35,
  wf: 0,
  tail: 0.13,
  ty: 0,
};
function animMom(D, t, talking, rdt) {
  if (D.skin) {
    // the rigged model: idle sway, hands folded; while talking she gestures with her right hand
    const cp = D.cp || (D.cp = Object.assign({}, MOM_BASE)),
      tp = Object.assign({}, MOM_BASE);
    tp.by = Math.sin(t * 2.2) * 0.012;
    tp.byw = Math.sin(t * 0.8) * 0.06;
    tp.hy = Math.sin(t * 0.6) * 0.15;
    tp.hp = Math.sin(t * 1.3) * 0.04;
    tp.wf = Math.sin(t * 2) * 0.1;
    tp.ty = Math.sin(t * 1.4) * 0.3;
    tp.aRx = -0.55;
    tp.aRz = -0.15;
    tp.aLx = -0.55;
    tp.aLz = 0.15;
    if (talking) {
      tp.aRx = -1.15 + Math.sin(t * 5.5) * 0.3;
      tp.aRz = -0.55;
      tp.aRy = 0.3 + Math.sin(t * 3) * 0.2;
      tp.hp = 0.08 + Math.sin(t * 4) * 0.05;
      tp.hy = Math.sin(t * 1.7) * 0.2;
    }
    const k = 1 - Math.exp(-6 * (rdt || 0.016));
    for (const key in cp) cp[key] += (tp[key] - cp[key]) * k;
    applySkin(D, cp, t);
    return;
  }
  D.armR.rotation.set(talking ? -1.1 + Math.sin(t * 6) * 0.35 : -0.2, 0, talking ? -0.5 : -0.25);
  D.armL.rotation.set(-0.15, 0, 0.3);
  D.body.rotation.y = Math.sin(t * 0.8) * 0.06;
  D.head.rotation.z = Math.sin(t * 1.3) * 0.05;
  D.rig.position.y = -0.8 + Math.sin(t * 2.2) * 0.015;
  D.wingL.rotation.set(0, 0.5, Math.sin(t * 2) * 0.1);
  D.wingR.rotation.set(0, -0.5, -Math.sin(t * 2) * 0.1);
  for (let i = 0; i < D.tail.length; i++) {
    D.tail[i].rotation.x = i ? 0.12 : -0.5;
    D.tail[i].rotation.y = Math.sin(t * 2 - i * 0.6) * 0.06;
  }
}
/* Ruffy: Darren's blue and white dog fox */
function buildRuffy() {
  // round, fluffy and expressive: big eyes that blink, ears that perk up or droop, a tongue, a huge fluffy tail
  const root = new T.Group(),
    b = grp(root, 0, 0.42, 0),
    brow = toy(0x1d4f8a);
  b.add(mk(GEO.hi, PROP.blue, 0, 0, 0, 0.3, 0.28, 0.36));
  b.add(mk(GEO.hi, PROP.white, 0, -0.08, 0.06, 0.23, 0.19, 0.29));
  b.add(mk(GEO.hi, PROP.white, 0, 0.05, 0.27, 0.19, 0.18, 0.13)); // chest fluff
  const head = grp(b, 0, 0.3, 0.3);
  head.add(mk(GEO.hi, PROP.blue, 0, 0, 0, 0.3, 0.27, 0.27));
  head.add(mk(GEO.hi, PROP.white, 0, -0.09, 0.15, 0.17, 0.12, 0.15)); // muzzle
  for (const s of [1, -1]) head.add(mk(GEO.hi, PROP.white, s * 0.2, -0.09, 0.07, 0.12, 0.1, 0.1)); // cheek fluff
  head.add(mk(GEO.mid, PROP.nose, 0, -0.04, 0.3, 0.05, 0.04, 0.04));
  const eyes = [],
    brows = [],
    ears = [];
  for (const s of [1, -1]) {
    const e = grp(head, s * 0.12, 0.05, 0.22);
    e.add(mk(GEO.mid, PROP.nose, 0, 0, 0, 0.068, 0.085, 0.045));
    e.add(mk(GEO.mid, PROP.white, s * -0.02, 0.03, 0.035, 0.024));
    e.add(mk(GEO.mid, PROP.white, s * 0.02, -0.03, 0.038, 0.011));
    eyes.push(e);
    const bw = mk(GEO.box, brow, s * 0.12, 0.16, 0.23, 0.08, 0.018, 0.02);
    head.add(bw);
    brows.push({ m: bw, s });
    const ear = grp(head, s * 0.15, 0.2, -0.02);
    ear.rotation.z = -s * 0.35;
    ear.add(mk(GEO.cone, PROP.blue, 0, 0.16, 0, 0.11, 0.36, 0.06));
    ear.add(mk(GEO.cone, PROP.white, 0, 0.13, 0.025, 0.06, 0.24, 0.02));
    ears.push({ g: ear, s });
  }
  const mouth = grp(head, 0, -0.15, 0.24);
  const tongue = mk(GEO.mid, PROP.pink, 0, -0.03, 0.02, 0.05, 0.03, 0.06);
  mouth.add(tongue);
  mouth.add(mk(GEO.mid, PROP.nose, 0, 0, 0, 0.05, 0.02, 0.03));
  const legs = [];
  for (const [x, z] of [
    [0.15, 0.22],
    [-0.15, 0.22],
    [0.15, -0.22],
    [-0.15, -0.22],
  ]) {
    const l = grp(root, x, 0.3, z);
    l.add(mk(GEO.cyl, PROP.blue, 0, -0.12, 0, 0.065, 0.24, 0.065));
    l.add(mk(GEO.hi, PROP.white, 0, -0.26, 0.02, 0.08, 0.055, 0.095));
    legs.push(l);
  }
  const tail = [];
  let par = grp(b, 0, 0.1, -0.34),
    r = 0.13;
  for (let i = 0; i < 6; i++) {
    tail.push(par);
    par.add(mk(GEO.hi, i > 3 ? PROP.white : PROP.blue, 0, 0, 0, r, r, r * 1.3));
    par = grp(par, 0, 0, -r * 1.05);
    r *= i < 3 ? 1.14 : 0.8;
  }
  root.traverse(o => {
    if (o.isMesh) o.castShadow = true;
  });
  return {
    root,
    b,
    head,
    legs,
    tail,
    eyes,
    brows,
    ears,
    mouth,
    tongue,
    ex: { ear: 0, tongue: 0, sad: 0, sit: 0, open: 0 },
    blink: 2,
  };
}
// modes: 'sad' (caged), 'happy', 'run', 'sit', 'bark'
function animRuffy(R, t, mode, speed, rdt) {
  rdt = rdt || 0.016;
  const X = R.ex,
    k = 1 - Math.exp(-8 * rdt),
    go = (key, v) => (X[key] += (v - X[key]) * k);
  go('ear', mode === 'sad' ? 1 : mode === 'run' ? -0.6 : 0);
  go('tongue', mode === 'sad' ? 0 : 1);
  go('sad', mode === 'sad' ? 1 : 0);
  go('sit', mode === 'sit' ? 1 : 0);
  go('open', mode === 'bark' ? 0.5 + Math.sin(t * 16) * 0.5 : mode === 'happy' || mode === 'run' ? 0.25 : 0);
  const wag = mode === 'sad' ? 0.15 : mode === 'happy' || mode === 'bark' ? 0.9 : mode === 'sit' ? 0.7 : 0.45,
    rate = mode === 'happy' || mode === 'bark' ? 18 : mode === 'sit' ? 12 : 9;
  for (let i = 0; i < R.tail.length; i++) {
    R.tail[i].rotation.y = Math.sin(t * rate - i * 0.5) * wag * (0.4 + i * 0.15);
    R.tail[i].rotation.x = mode === 'sad' ? 0.25 : (-0.35 + i * 0.08) * (1 - X.sit * 0.8) + X.sit * 0.2;
  }
  const run = Math.min(1, (speed || 0) / 4);
  R.legs.forEach((l, i) => {
    l.rotation.x =
      Math.sin(t * 15 + (i % 2 ? PI : 0) + (i > 1 ? PI / 2 : 0)) * 0.75 * run + (i > 1 ? X.sit * 1.2 : X.sit * -0.2);
  });
  const hopB = mode === 'bark' ? Math.abs(Math.sin(t * 8)) * 0.1 : 0;
  R.b.position.y =
    0.42 - X.sit * 0.12 + hopB + Math.abs(Math.sin(t * (run ? 15 : 3))) * (run ? 0.07 : mode === 'happy' ? 0.06 : 0.01);
  R.b.rotation.x = -X.sit * 0.45 + (run ? Math.sin(t * 15) * 0.05 : 0);
  R.head.rotation.x = X.sad * 0.3 + X.sit * 0.35 - (mode === 'bark' ? 0.25 : 0.05);
  R.head.rotation.z = mode === 'sad' ? Math.sin(t * 0.7) * 0.1 : Math.sin(t * 1.6) * 0.14;
  R.head.rotation.y = mode === 'sit' ? Math.sin(t * 0.9) * 0.3 : 0;
  for (const e of R.ears) {
    e.g.rotation.z = -e.s * (0.35 + X.ear * 0.75);
    e.g.rotation.x = X.ear < 0 ? X.ear * 0.8 : X.ear * 0.4;
  }
  for (const w of R.brows) w.m.rotation.z = w.s * (X.sad * 0.45 - 0.08);
  // blinking, and happy squinting
  R.blink -= rdt;
  let ey = 1;
  if (R.blink < 0.12) ey = 0.12;
  if (R.blink <= 0) R.blink = rnd(1.8, 4.2);
  if (mode === 'bark') ey = Math.min(ey, 0.4);
  for (const e of R.eyes) e.scale.y = ey * (1 - X.sad * 0.25);
  R.mouth.rotation.x = X.open * 0.5;
  R.tongue.visible = X.tongue > 0.3;
  R.tongue.position.y = -0.03 - X.open * 0.04;
  R.tongue.position.z = 0.02 + X.tongue * 0.03;
}
/* Mom's cottage, Ruffy's doghouse and bowl */
function buildHouse() {
  const g = new T.Group();
  const walls = mk(GEO.box, PROP.cream, 0, 1.6, 0, 6, 3.2, 5);
  walls.receiveShadow = true;
  g.add(walls);
  const roof = new T.Mesh(new T.ConeGeometry(4.9, 2.6, 4, 1), PROP.roof);
  roof.position.y = 4.5;
  roof.rotation.y = PI / 4;
  roof.scale.set(1, 1, 0.86);
  roof.castShadow = true;
  g.add(roof);
  g.add(mk(GEO.box, PROP.roofD, 0, 3.25, 0, 6.4, 0.25, 5.4));
  g.add(mk(GEO.box, PROP.woodD, 1.8, 5.1, -0.8, 0.7, 1.6, 0.7));
  g.add(mk(GEO.box, PROP.door, 0, 1.05, 2.52, 1.2, 2.1, 0.1));
  g.add(mk(GEO.mid, PROP.metal, 0.4, 1.05, 2.6, 0.06));
  for (const x of [-2, 2]) {
    g.add(mk(GEO.box, PROP.window, x, 1.9, 2.52, 1, 0.9, 0.06));
    g.add(mk(GEO.box, PROP.woodD, x, 1.9, 2.56, 0.08, 0.95, 0.04));
    g.add(mk(GEO.box, PROP.woodD, x, 1.42, 2.6, 1.2, 0.1, 0.14));
  }
  g.add(mk(GEO.box, PROP.wood, 0, 0.08, 3.3, 4.5, 0.16, 1.6));
  for (const x of [-2.1, 2.1]) g.add(mk(GEO.lowCyl, PROP.woodD, x, 1.3, 3.95, 0.1, 2.6, 0.1));
  const awn = mk(GEO.box, PROP.roof, 0, 2.65, 3.4, 4.8, 0.14, 1.9);
  awn.rotation.x = 0.25;
  g.add(awn);
  const chimney = new T.Vector3(1.8, 6, -0.8);
  // doghouse (placed separately by the level)
  const dh = new T.Group();
  dh.add(mk(GEO.box, PROP.blueD, 0, 0.55, 0, 1.3, 1.1, 1.4));
  const dr = new T.Mesh(new T.ConeGeometry(1.1, 0.8, 4, 1), PROP.roof);
  dr.position.y = 1.5;
  dr.rotation.y = PI / 4;
  dr.castShadow = true;
  dh.add(dr);
  dh.add(mk(GEO.box, PROP.nose, 0, 0.45, 0.71, 0.55, 0.65, 0.04));
  const bowl = grp(dh, -1.3, 0, 1.2);
  bowl.add(mk(GEO.cylT, PROP.blue, 0, 0.1, 0, 0.3, 0.2, 0.3));
  bowl.add(mk(GEO.cyl, flat(0x9b6a3a), 0, 0.19, 0, 0.24, 0.02, 0.24));
  g.traverse(o => {
    if (o.isMesh) o.castShadow = true;
  });
  dh.traverse(o => {
    if (o.isMesh) o.castShadow = true;
  });
  return { g, chimney, dh };
}

/* plank bridge from A to B (Vector2-like {x,z}) */
function buildBridge(A, B, w) {
  const g = new T.Group(),
    dx = B.x - A.x,
    dz = B.z - A.z,
    L = Math.hypot(dx, dz),
    ang = Math.atan2(dx, dz);
  g.position.set(A.x, 0, A.z);
  g.rotation.y = ang;
  const n = Math.max(2, Math.round(L / 0.62));
  for (let i = 0; i < n; i++) {
    const p = mk(
      GEO.box,
      i % 3 ? PROP.wood : PROP.woodD,
      rnd(-0.05, 0.05),
      -0.06 - Math.sin((i / (n - 1)) * PI) * 0.18,
      ((i + 0.5) * L) / n,
      w,
      0.14,
      (L / n) * 0.86,
    );
    p.rotation.y = rnd(-0.04, 0.04);
    p.receiveShadow = true;
    g.add(p);
  }
  const posts = Math.max(2, Math.round(L / 2.6) + 1);
  for (const s of [-1, 1]) {
    let prev = null;
    for (let i = 0; i < posts; i++) {
      const z = (i / (posts - 1)) * L,
        y0 = -Math.sin((i / (posts - 1)) * PI) * 0.18;
      g.add(mk(GEO.lowCyl, PROP.woodD, s * (w / 2 + 0.05), y0 + 0.45, z, 0.07, 1.0, 0.07));
      const top = new T.Vector3(s * (w / 2 + 0.05), y0 + 0.92, z);
      if (prev) {
        const r = limb(prev.x, prev.y, prev.z, top.x, top.y - 0.05, top.z, 0.025, PROP.rope);
        g.add(r);
      }
      prev = top;
    }
  }
  return g;
}
/* small floating stone platform */
function buildStone(r) {
  const g = new T.Group();
  const top = mk(GEO.lowCyl, PROP.grass, 0, -0.2, 0, r, 0.4, r);
  top.receiveShadow = true;
  g.add(top);
  const under = new T.Mesh(jitter(new T.ConeGeometry(r * 0.95, r * 1.6, 9, 2), r * 0.06), PROP.stone);
  under.rotation.x = PI;
  under.position.y = -0.4 - r * 0.8;
  under.castShadow = true;
  g.add(under);
  return g;
}
/* thorny barrier that blocks a locked bridge */
function buildBarrier(w) {
  const g = new T.Group();
  const wall = new T.Mesh(new T.PlaneGeometry(w + 1.2, 3.2), PROP.glow);
  wall.position.y = 1.6;
  g.add(wall);
  for (let i = 0; i < 9; i++) {
    const x = (i / 8 - 0.5) * (w + 0.6),
      h = rnd(1.4, 2.8);
    g.add(limb(x, 0, 0, x + rnd(-0.3, 0.3), h, rnd(-0.2, 0.2), 0.1, PROP.vine, true));
    for (let k = 0; k < 3; k++) {
      const c = mk(GEO.cone, PROP.thorn, x + rnd(-0.15, 0.15), rnd(0.4, h), rnd(-0.1, 0.1), 0.06, 0.3, 0.06);
      c.rotation.set(rnd(-1.5, 1.5), 0, rnd(-1.5, 1.5));
      g.add(c);
    }
  }
  return g;
}
/* crystal cage holding Ruffy */
function buildCage() {
  const g = new T.Group(),
    shards = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU,
      c = mk(GEO.octa, PROP.crystal, Math.cos(a) * 1.25, 1.3, Math.sin(a) * 1.25, 0.35, 1.5, 0.35);
    c.rotation.z = Math.cos(a) * 0.25;
    c.rotation.x = -Math.sin(a) * 0.25;
    g.add(c);
    shards.push(c);
  }
  const top = mk(GEO.octa, PROP.crystal, 0, 3.1, 0, 0.6, 0.9, 0.6);
  g.add(top);
  shards.push(top);
  g.add(mk(GEO.lowCyl, PROP.stone, 0, 0.08, 0, 1.6, 0.16, 1.6));
  return { g, shards };
}
/* one paw print decal (flat on the ground) */
const PAW_GEO = (function () {
  const parts = [
      [0, 0, 0.16],
      [-0.13, 0.17, 0.065],
      [-0.045, 0.23, 0.065],
      [0.045, 0.23, 0.065],
      [0.13, 0.17, 0.065],
    ],
    geos = [];
  for (const [x, z, r] of parts) {
    const c = new T.CircleGeometry(r, 14);
    c.rotateX(-PI / 2);
    c.translate(x, 0, z);
    geos.push(c);
  }
  const merged = new T.BufferGeometry();
  const pos = [];
  for (const g of geos) {
    const a = g.toNonIndexed().attributes.position.array;
    for (let i = 0; i < a.length; i++) pos.push(a[i]);
  }
  merged.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  return merged;
})();
function buildPaw() {
  const m = new T.Mesh(PAW_GEO, PROP.paw);
  m.position.y = 0.035;
  m.scale.setScalar(0.9);
  m.renderOrder = 2;
  return m;
}
/* pickups: Ruffy's ball and his collar tag */
function buildPickup(item, weapon) {
  const g = new T.Group(),
    spin = grp(g, 0, 1.0, 0);
  if (item === 'ball') {
    spin.add(mk(GEO.hi, PROP.blue, 0, 0, 0, 0.28));
    const band = new T.Mesh(new T.TorusGeometry(0.28, 0.05, 10, 32), PROP.white);
    band.castShadow = true;
    spin.add(band);
    const band2 = band.clone();
    band2.rotation.y = PI / 2;
    spin.add(band2);
  } else if (item === 'wood') {
    // a bundle of firewood tied with rope
    for (const [x, y, z] of [
      [-0.16, -0.1, 0],
      [0.16, -0.1, 0],
      [0, 0.15, 0],
      [0, -0.1, 0.02],
    ]) {
      const l = mk(GEO.cyl, PROP.wood, x, y, z, 0.13, 0.75, 0.13);
      l.rotation.x = PI / 2;
      spin.add(l);
      for (const e of [-1, 1]) {
        const c = mk(GEO.cyl, PROP.woodEnd, x, y, z + e * 0.376, 0.12, 0.01, 0.12);
        c.rotation.x = PI / 2;
        spin.add(c);
      }
    }
    for (const z of [-0.2, 0.2]) {
      const r = new T.Mesh(new T.TorusGeometry(0.29, 0.025, 6, 20), PROP.rope);
      r.position.z = z;
      r.scale.y = 0.85;
      spin.add(r);
    }
    spin.scale.setScalar(1.1);
  } else if (item === 'weapon') {
    // the weapon itself, floating point down and turning
    const w = buildWeapon(weapon);
    w.g.rotation.x = -PI / 2;
    w.g.position.y = -0.6;
    spin.add(w.g);
    spin.position.y = 1.2;
  } else {
    const tag = mk(GEO.cyl, PROP.metal, 0, 0, 0, 0.26, 0.05, 0.26);
    tag.rotation.x = PI / 2;
    spin.add(tag);
    const loop = new T.Mesh(new T.TorusGeometry(0.08, 0.02, 8, 16), PROP.metal);
    loop.position.y = 0.3;
    spin.add(loop);
    spin.add(mk(GEO.mid, PROP.blue, 0, 0, 0.03, 0.14, 0.14, 0.02));
  }
  const ring = new T.Mesh(new T.RingGeometry(0.5, 0.75, 32), PROP.ring);
  ring.rotation.x = -PI / 2;
  ring.position.y = 0.05;
  g.add(ring);
  return { g, spin, ring };
}
/* Mom's wood store by the door: empty at the start of Chapter 2, full at the end */
function buildWoodStore() {
  const g = new T.Group();
  g.add(mk(GEO.box, PROP.woodD, 0, 0.1, 0, 1.6, 0.2, 1.0));
  for (const x of [-0.75, 0.75]) g.add(mk(GEO.box, PROP.woodD, x, 0.7, 0, 0.1, 1.4, 0.9));
  const roof = mk(GEO.box, PROP.roof, 0, 1.45, 0, 1.9, 0.1, 1.2);
  roof.rotation.x = 0.15;
  g.add(roof);
  const logs = [];
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 4; i++) {
      const l = mk(GEO.cyl, PROP.wood, -0.48 + i * 0.32, 0.36 + row * 0.3, 0, 0.14, 0.8, 0.14);
      l.rotation.x = PI / 2;
      g.add(l);
      logs.push(l);
    }
  g.traverse(o => {
    if (o.isMesh) o.castShadow = true;
  });
  return {
    g,
    fill(k) {
      logs.forEach((l, i) => (l.visible = i < Math.round(k * logs.length)));
    },
  };
}
/* Chapter 2 decorations: snowy pines, log piles, snow patches, mushroom rings */
const PINE_M = [flat(0x2f7a4a), flat(0x3a8a52), flat(0x2a6e44)],
  SNOW_M = flat(0xf4fbff);
function buildPine(s) {
  const g = new T.Group(),
    leaf = PINE_M[Math.floor(rnd(3))];
  g.add(mk(GEO.lowCyl, flat(0x6e4a2e), 0, 0.8 * s, 0, 0.25 * s, 1.6 * s, 0.25 * s));
  for (let i = 0; i < 4; i++) {
    const r = (1.6 - i * 0.33) * s,
      y = (1.6 + i * 0.95) * s,
      c = mk(GEO.lowCone, leaf, 0, y, 0, r, 1.5 * s, r);
    c.rotation.y = rnd(TAU);
    g.add(c);
    const sn = mk(GEO.lowCone, SNOW_M, 0, y + 0.42 * s, 0, r * 0.62, 0.7 * s, r * 0.62);
    sn.rotation.y = c.rotation.y;
    g.add(sn);
  }
  return g;
}
function buildLogPile() {
  const g = new T.Group();
  for (const [x, y] of [
    [-0.3, 0.2],
    [0.3, 0.2],
    [0, 0.55],
  ]) {
    const l = mk(GEO.cyl, PROP.wood, x, y, 0, 0.22, 1.6, 0.22);
    l.rotation.z = PI / 2;
    l.rotation.y = PI / 2;
    g.add(l);
  }
  g.add(mk(GEO.hemi, SNOW_M, 0, 0.72, 0, 0.35, 0.12, 0.7));
  return g;
}
function buildSnowPatches(n, R) {
  const g = new T.Group();
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU),
      r = Math.sqrt(rnd(0.05, 1)) * R,
      s = rnd(0.8, 2.2),
      m = mk(GEO.hemi, SNOW_M, Math.cos(a) * r, -0.02, Math.sin(a) * r, s, 0.06, s * rnd(0.6, 1));
    m.castShadow = false;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}
function buildMushroomRing() {
  const g = new T.Group(),
    cap = toy(0xff7a5c),
    dot = toy(0xffffff);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU,
      s = rnd(0.12, 0.22),
      x = Math.cos(a) * 0.6,
      z = Math.sin(a) * 0.6;
    g.add(mk(GEO.cyl, PROP.cream, x, s * 0.8, z, s * 0.35, s * 1.6, s * 0.35));
    g.add(mk(GEO.hemi, cap, x, s * 1.6, z, s, s * 0.7, s));
    g.add(mk(GEO.mid, dot, x + s * 0.3, s * 2.05, z, s * 0.15));
  }
  return g;
}
/* island decorations */
function buildFlowers(n, R, avoid) {
  const geo = new T.SphereGeometry(0.09, 6, 4),
    mats = [toy(0xffffff, { clearcoat: 0.2 }), toy(0xffd23a, { clearcoat: 0.2 }), toy(0xff8fb0, { clearcoat: 0.2 })],
    g = new T.Group(),
    d = new T.Object3D();
  mats.forEach(m => {
    const inst = new T.InstancedMesh(geo, m, Math.floor(n / 3));
    for (let i = 0; i < inst.count; i++) {
      let x,
        z,
        k = 0;
      do {
        const a = rnd(TAU),
          r = Math.sqrt(rnd(1)) * R;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
        k++;
      } while (avoid && avoid(x, z) && k < 8);
      d.position.set(x, 0.12, z);
      d.scale.setScalar(rnd(0.7, 1.3));
      d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
    }
    g.add(inst);
  });
  return g;
}
function buildCrystalCluster() {
  const g = new T.Group();
  for (let i = 0; i < 4; i++) {
    const c = mk(
      GEO.octa,
      PROP.crystal,
      rnd(-0.4, 0.4),
      0.5,
      rnd(-0.4, 0.4),
      rnd(0.18, 0.3),
      rnd(0.5, 1.0),
      rnd(0.18, 0.3),
    );
    c.rotation.set(rnd(-0.4, 0.4), rnd(TAU), rnd(-0.4, 0.4));
    g.add(c);
  }
  return g;
}
function buildRuin() {
  const g = new T.Group(),
    h = rnd(1.4, 3.2);
  g.add(mk(GEO.lowCyl, PROP.stone, 0, h / 2, 0, 0.4, h, 0.4));
  g.add(mk(GEO.box, PROP.stone, 0, h + 0.12, 0, 1.0, 0.24, 1.0));
  if (Math.random() < 0.5) {
    const b = mk(GEO.lowCyl, PROP.stone, 0.9, 0.3, 0.2, 0.35, 1.2, 0.35);
    b.rotation.z = PI / 2 - 0.2;
    g.add(b);
  }
  return g;
}
