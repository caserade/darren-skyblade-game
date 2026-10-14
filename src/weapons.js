/* WEAPONS: the swords Darren can carry. Their numbers (speed, power, reach, finisher) are in DATA.weapons.
   Each model is built along +z from the grip (z = 0); `base` and `tip` mark where the sword trail is drawn. */
const WEAPONS = DATA.weapons;
function weaponBlade(shape, depth, mat, z) {
  const g = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 4,
    curveSegments: 20,
  });
  g.translate(0, 0, -depth / 2);
  g.rotateX(PI / 2);
  const m = new T.Mesh(g, mat);
  m.position.z = z;
  m.castShadow = true;
  return m;
}
function buildCloudcutter() {
  const g = new T.Group(),
    silver = toy(0xeef4ff, { metalness: 0.55, roughness: 0.22 }),
    grip = toy(0x2d6fb8, { roughness: 0.55, clearcoat: 0.2 });
  const gr = mk(GEO.cyl, grip, 0, 0, 0, 0.038, 0.26, 0.038);
  gr.rotation.x = PI / 2;
  g.add(gr);
  g.add(mk(GEO.mid, silver, 0, 0, -0.15, 0.05));
  // wing-shaped guard
  for (const s of [1, -1]) {
    const w = mk(GEO.hi, silver, s * 0.17, 0, 0.1, 0.2, 0.035, 0.07);
    w.rotation.y = s * 0.5;
    g.add(w);
    const w2 = mk(GEO.hi, silver, s * 0.28, 0, 0.02, 0.12, 0.03, 0.05);
    w2.rotation.y = s * 0.9;
    g.add(w2);
  }
  g.add(mk(GEO.mid, toy(0x7cc6f2, { emissive: 0x3fa0ff, emissiveIntensity: 0.6 }), 0, 0, 0.12, 0.055));
  const s = new T.Shape();
  s.moveTo(-0.06, 0);
  s.lineTo(-0.075, 1.2);
  s.quadraticCurveTo(-0.07, 1.42, 0.0, 1.56);
  s.quadraticCurveTo(0.04, 1.4, 0.075, 1.2);
  s.lineTo(0.06, 0);
  s.closePath();
  const bladeMat = toy(0x9fdcff, { emissive: 0x3f9fff, emissiveIntensity: 0.18, roughness: 0.15 });
  g.add(weaponBlade(s, 0.022, bladeMat, 0.16));
  // a thin bright edge line down the middle
  g.add(mk(GEO.box, toy(0xffffff, { emissive: 0xbfe6ff, emissiveIntensity: 0.4 }), 0, 0, 0.85, 0.018, 0.04, 1.2));
  return { g, base: grp(g, 0, 0, 1.05), tip: grp(g, 0, 0, 1.72), bladeMat };
}
function buildJellyblade() {
  const g = new T.Group(),
    grip = toy(0xb0306f, { roughness: 0.5, clearcoat: 0.3 });
  const gr = mk(GEO.cyl, grip, 0, 0, 0, 0.042, 0.22, 0.042);
  gr.rotation.x = PI / 2;
  g.add(gr);
  g.add(mk(GEO.mid, toy(0xffd23a), 0, 0, -0.13, 0.06));
  g.add(mk(GEO.hi, toy(0xffd23a), 0, 0, 0.13, 0.17, 0.07, 0.07));
  const bladeMat = new T.MeshPhysicalMaterial({
    color: 0xff8ad8,
    emissive: 0xff3aa8,
    emissiveIntensity: 0.18,
    roughness: 0.12,
    clearcoat: 1,
    transparent: true,
    opacity: 0.86,
    envMapIntensity: 0.8,
  });
  TOYS.push(bladeMat);
  const core = toy(0xd62a8a, { roughness: 0.3 }),
    blobs = [];
  for (let i = 0; i < 6; i++) {
    const z = 0.28 + i * 0.17,
      r = 0.13 - i * 0.012;
    const b = mk(GEO.hi, bladeMat, 0, 0, z, r * 1.25, r * 0.7, 0.14);
    g.add(b);
    blobs.push(b);
  }
  const tipB = mk(GEO.hi, bladeMat, 0, 0, 1.28, 0.07, 0.05, 0.12);
  g.add(tipB);
  blobs.push(tipB);
  const c = mk(GEO.cyl, core, 0, 0, 0.7, 0.025, 0.95, 0.025);
  c.rotation.x = PI / 2;
  g.add(c);
  // a few bubbles inside the jelly
  for (let i = 0; i < 5; i++)
    g.add(mk(GEO.mid, toy(0xffffff, { roughness: 0.1 }), rnd(-0.06, 0.06), rnd(-0.02, 0.02), rnd(0.3, 1.1), 0.02));
  return { g, base: grp(g, 0, 0, 0.8), tip: grp(g, 0, 0, 1.3), bladeMat, blobs };
}
function buildLadle() {
  const g = new T.Group(),
    steel = toy(0xd8dde6, { metalness: 0.75, roughness: 0.2 }),
    wood = toy(0x9a6a43, { roughness: 0.6, clearcoat: 0.2 });
  const gr = mk(GEO.cyl, wood, 0, 0, 0.02, 0.05, 0.36, 0.05);
  gr.rotation.x = PI / 2;
  g.add(gr);
  g.add(mk(GEO.mid, wood, 0, 0, -0.17, 0.06));
  const sh = mk(GEO.cyl, steel, 0, 0, 0.55, 0.03, 0.72, 0.03);
  sh.rotation.x = PI / 2;
  g.add(sh);
  // the bowl, opening toward +y
  const bowlG = new T.SphereGeometry(0.24, 32, 16, 0, TAU, PI / 2, PI / 2);
  const bladeMat = toy(0xe8edf5, { metalness: 0.7, roughness: 0.18, emissive: 0xffa030, emissiveIntensity: 0.12 });
  bladeMat.side = T.DoubleSide;
  const bowl = new T.Mesh(bowlG, bladeMat);
  bowl.scale.set(1, 0.75, 1.15);
  bowl.position.set(0, 0.14, 1.08);
  bowl.castShadow = true;
  g.add(bowl);
  const rim = new T.Mesh(new T.TorusGeometry(0.24, 0.02, 8, 32), steel);
  rim.rotation.x = PI / 2;
  rim.scale.set(1, 1.15, 1);
  rim.position.set(0, 0.14, 1.08);
  g.add(rim);
  // a little soup in the bowl
  const soup = mk(
    GEO.cyl,
    toy(0xffa94a, { roughness: 0.3, emissive: 0xff7a1a, emissiveIntensity: 0.25 }),
    0,
    0.1,
    1.08,
    0.2,
    0.02,
    0.23,
  );
  g.add(soup);
  return { g, base: grp(g, 0, 0, 0.85), tip: grp(g, 0, 0.1, 1.3), bladeMat };
}
function buildWeapon(id) {
  if (id === 'cloudcutter') return buildCloudcutter();
  if (id === 'jellyblade') return buildJellyblade();
  if (id === 'ladle') return buildLadle();
  if (id === 'frostfang') return buildRecolorBlade(0xbfe8ff, 0x7cc6f2, 1.05);
  if (id === 'thornbreaker') return buildCleaver();
  if (id === 'titanedge') return buildRecolorBlade(0xb49aff, 0x7a4cff, 1.3);
  if (id === 'emberblaster') return buildArmCannon(0xff8a1e, 0xffd23a);
  if (id === 'galebow') return buildBow();
  if (id === 'sporemortar') return buildMortar();
  return buildSword();
}
/* Emberfang's shape in another colour (Frostfang, Titan Edge) */
function buildRecolorBlade(col, glow, scale) {
  const w = buildSword(),
    m = toy(col, { emissive: glow, emissiveIntensity: 0.25, roughness: 0.15 });
  w.g.traverse(o => {
    if (o.isMesh && o.material === w.bladeMat) o.material = m;
  });
  w.g.scale.z = scale;
  return { g: w.g, base: w.base, tip: w.tip, bladeMat: m };
}
function buildCleaver() {
  const g = new T.Group(),
    metal = toy(0x8fa89a, { metalness: 0.5, roughness: 0.3 }),
    grip = toy(0x5a3820, { roughness: 0.6 });
  const gr = mk(GEO.cyl, grip, 0, 0, 0, 0.05, 0.4, 0.05);
  gr.rotation.x = PI / 2;
  g.add(gr);
  const bladeMat = toy(0x6fbf5a, { emissive: 0x2a6a20, emissiveIntensity: 0.15, roughness: 0.3 });
  g.add(mk(GEO.box, bladeMat, 0.05, 0, 0.85, 0.42, 0.06, 1.15));
  g.add(mk(GEO.box, metal, -0.15, 0, 0.85, 0.06, 0.08, 1.15));
  for (let i = 0; i < 4; i++) {
    const c = mk(GEO.cone, PROP.thorn, 0.28, 0, 0.45 + i * 0.28, 0.05, 0.2, 0.05);
    c.rotation.z = -PI / 2;
    g.add(c);
  }
  return { g, base: grp(g, 0, 0, 0.6), tip: grp(g, 0, 0, 1.45), bladeMat };
}
/* ranged arm weapons: they point along +z like the swords, so the aim pose points them at the target */
function buildArmCannon(col, glowCol) {
  const g = new T.Group(),
    body = toy(0x3a3a48, { metalness: 0.4, roughness: 0.3 }),
    bladeMat = toy(col, { emissive: glowCol, emissiveIntensity: 0.3 });
  const barrel = mk(GEO.cyl, body, 0, 0, 0.45, 0.11, 0.7, 0.11);
  barrel.rotation.x = PI / 2;
  g.add(barrel);
  const ring1 = new T.Mesh(new T.TorusGeometry(0.13, 0.03, 8, 20), bladeMat);
  ring1.position.z = 0.75;
  g.add(ring1);
  g.add(mk(GEO.hi, bladeMat, 0, 0, 0.15, 0.17, 0.15, 0.22));
  g.add(mk(GEO.mid, toy(glowCol, { emissive: glowCol, emissiveIntensity: 0.8 }), 0, 0, 0.82, 0.07));
  return { g, base: grp(g, 0, 0, 0.6), tip: grp(g, 0, 0, 0.85), bladeMat };
}
function buildBow() {
  const g = new T.Group(),
    wood = toy(0x6fe0cf, { roughness: 0.4 }),
    str = new T.MeshBasicMaterial({ color: 0xffffff });
  const arc = new T.Mesh(new T.TorusGeometry(0.55, 0.035, 8, 28, PI * 0.9), wood);
  arc.rotation.set(PI / 2, 0, PI / 2 + PI * 0.05);
  arc.position.z = 0.3;
  g.add(arc);
  const s = limb(0, -0.55, 0.3 - 0.02, 0, 0.55, 0.3 - 0.02, 0.008, str);
  g.add(s);
  for (const y of [-0.55, 0.55]) g.add(mk(GEO.mid, toy(0xffffff), 0, y * 0.98, 0.32, 0.05));
  return { g, base: grp(g, 0, 0, 0.3), tip: grp(g, 0, 0, 0.8), bladeMat: wood };
}
function buildMortar() {
  const g = new T.Group(),
    cap = toy(0xff8a7a),
    tube = toy(0xfff0d6, { roughness: 0.4 });
  const t = mk(GEO.cylT, tube, 0, 0, 0.35, 0.16, 0.6, 0.16);
  t.rotation.x = -PI / 2;
  g.add(t);
  g.add(mk(GEO.hemi, cap, 0, 0, 0.1, 0.26, 0.22, 0.26));
  for (let i = 0; i < 4; i++)
    g.add(mk(GEO.mid, toy(0xffffff), Math.cos(i * 1.6) * 0.16, Math.sin(i * 1.6) * 0.16, 0.2, 0.04));
  return { g, base: grp(g, 0, 0, 0.4), tip: grp(g, 0, 0, 0.7), bladeMat: cap };
}
// the weapon behind the current attack (Twin Arms may use the L-arm one), otherwise the one in Darren's right hand
function weaponData() {
  return (P.st === 'attack' && P.curW && WEAPONS[P.curW]) || WEAPONS[P.weapon] || WEAPONS.emberfang;
}
/* put weapon `id` in Darren's hand (both the rigged and the placeholder model keep it in D.sword) */
function equipWeapon(id, announce) {
  if (!WEAPONS[id] || UNLOCKS.weapons.indexOf(id) < 0) id = 'emberfang';
  P.weapon = id;
  UNLOCKS.weapon = id;
  saveUnlocks();
  const D = P.m;
  if (D && D.sword && D.sword.parent) {
    const old = D.sword,
      w = buildWeapon(id);
    w.g.position.copy(old.position);
    w.g.scale.copy(old.scale);
    old.parent.add(w.g);
    old.parent.remove(old);
    D.sword = w.g;
    D.sBase = w.base;
    D.sTip = w.tip;
    D.bladeMat = w.bladeMat;
    D.blobs = w.blobs || null;
    if (window.ENV_TEX)
      w.g.traverse(o => {
        if (o.isMesh && o.material && !o.material.envMap) {
          o.material.envMap = window.ENV_TEX;
          o.material.needsUpdate = true;
        }
      });
  }
  if (window.updateWeaponChip) updateWeaponChip();
  if (announce) {
    floatText(P.x, P.y + 2.3, P.z, WEAPONS[id].name, 'say');
    sfx('pickup');
  }
}
// R key: Classic cycles through your blades; Twin Arms cycles the R-arm weapon through everything you own
function cycleWeapon() {
  const twin = isTwin(),
    list = Object.keys(WEAPONS).filter(k => UNLOCKS.weapons.indexOf(k) >= 0 && (twin || weaponKind(k) === 'blade')),
    cur = twin ? UNLOCKS.equip.R : classicBlade();
  if (list.length < 2) {
    floatText(P.x, P.y + 2.3, P.z, 'Craft more weapons at the Skyforge', 'say');
    return;
  }
  const nx = list[(list.indexOf(cur) + 1) % list.length];
  UNLOCKS.equip.R = nx;
  if (twin && UNLOCKS.equip.L === nx) UNLOCKS.equip.L = null;
  saveUnlocks();
  refreshHands();
  floatText(P.x, P.y + 2.3, P.z, WEAPONS[nx].name, 'say');
  sfx('pickup');
}
function unlockWeapon(id) {
  if (!WEAPONS[id]) return;
  if (UNLOCKS.weapons.indexOf(id) < 0) UNLOCKS.weapons.push(id);
  if (weaponKind(id) === 'blade') UNLOCKS.equip.R = id;
  else if (!UNLOCKS.equip.L) UNLOCKS.equip.L = id;
  saveUnlocks();
  refreshHands();
  banner('New weapon: ' + WEAPONS[id].name, 'Finisher: ' + ((ATK[WEAPONS[id].finisher] || {}).label || ''), 170);
}
// moves adjusted for the equipped weapon (damage and reach), cached per weapon
let WMOVES = {};
function weaponMove(n, wid) {
  const base = ATK[n];
  if (!base || base.skill || (!base.dmg && !base.shot)) return base;
  const key = (wid || P.weapon) + ':' + n;
  if (WMOVES[key]) return WMOVES[key];
  const W = WEAPONS[wid || P.weapon] || WEAPONS.emberfang,
    A = Object.assign({}, base, { dmg: base.dmg * W.power, rng: base.rng * W.reach });
  if (W.heavyHits) A.hs = (A.hs || 3) + 2;
  if (W.bounce && (base.finisher || n === 'L3')) A.launch = A.launch || 7;
  if (base.shot && W.shot) {
    // fire rate comes from the weapon
    A.cx = W.shot.rate;
    A.rc = Math.max(base.rc, W.shot.rate - A.st - A.ac);
  }
  A.id = n;
  return (WMOVES[key] = A);
}
