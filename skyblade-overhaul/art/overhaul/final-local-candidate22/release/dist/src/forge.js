/* FORGE: the Skyforge systems — the parts bag, part drops (glowing gems that fly to Darren), crafting,
   armor (stats and the 3D pieces on Darren), the loadout (R-arm / L-arm weapons, armor slots) and the
   combat style (Classic combos or Twin Arms). All numbers and recipes are in data/forge.js. */
const PARTS = DATA.parts,
  ARMOR = DATA.armor,
  SETS = DATA.sets,
  SLOTS = ['head', 'body', 'arms', 'legs'];
const TUNE0 = Object.assign({}, TUNE); // the player's numbers before armor
const GEAR = { def: 0, power: 0, flight: 0, noChill: 0 };
// make sure the saved progress has every field (older saves don't)
const savedObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const savedIds = value => Array.isArray(value) ? [...new Set(value.filter(x => typeof x === 'string'))] : [];
UNLOCKS.parts = savedObject(UNLOCKS.parts);
for (const id in UNLOCKS.parts) {
  const n = UNLOCKS.parts[id];
  UNLOCKS.parts[id] = typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}
UNLOCKS.armor = savedIds(UNLOCKS.armor);
UNLOCKS.equip = Object.assign(
  { R: UNLOCKS.weapon || 'emberfang', L: null, head: null, body: null, arms: null, legs: null },
  savedObject(UNLOCKS.equip),
);
UNLOCKS.style = UNLOCKS.style === 'twin' ? 'twin' : 'classic';
UNLOCKS.way = savedIds(UNLOCKS.way);
UNLOCKS.contracts = Object.assign({ active: [], prog: {}, done: {} }, savedObject(UNLOCKS.contracts));
UNLOCKS.contracts.active = savedIds(UNLOCKS.contracts.active);
UNLOCKS.contracts.prog = savedObject(UNLOCKS.contracts.prog);
UNLOCKS.contracts.done = savedObject(UNLOCKS.contracts.done);
for (const field of ['prog', 'done']) for (const id in UNLOCKS.contracts[field]) {
  const n = UNLOCKS.contracts[field][id];
  UNLOCKS.contracts[field][id] = typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/* ---------- parts bag ---------- */
function partCount(id) {
  return UNLOCKS.parts[id] || 0;
}
function addPart(id, n, quiet) {
  if (!PARTS[id]) return;
  UNLOCKS.parts[id] = partCount(id) + n;
  saveUnlocks();
  if (!quiet) floatText(P.x, P.y + 2.1, P.z, '+' + n + ' ' + PARTS[id].name, 'part');
  if (window.advOnPart) advOnPart(id, n);
}
/* part gems: drop out of enemies and crystals, then fly into Darren when he is near */
const GEM_GEO = new T.OctahedronGeometry(0.16, 0),
  GEM_MAT = {};
function gemMat(id) {
  if (!GEM_MAT[id]) {
    const c = new T.Color(PARTS[id].color);
    GEM_MAT[id] = new T.MeshStandardMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      flatShading: true,
    });
  }
  return GEM_MAT[id];
}
function spawnGem(id, x, y, z) {
  const m = new T.Mesh(GEM_GEO, gemMat(id));
  m.position.set(x, y, z);
  scene.add(m);
  const a = rnd(TAU),
    v = rnd(1.5, 3.5);
  G.gems.push({ id, m, x, y, z, vx: Math.cos(a) * v, vy: rnd(5, 8), vz: Math.sin(a) * v, t: 0 });
}
function dropParts(list, x, y, z) {
  if (!list) return;
  for (const [id, n, chance] of list)
    if (Math.random() < (chance === undefined ? 1 : chance)) for (let k = 0; k < n; k++) spawnGem(id, x, y, z);
}
function updateGems(dt) {
  for (let i = G.gems.length - 1; i >= 0; i--) {
    const g = G.gems[i];
    g.t += dt;
    const dx = P.x - g.x,
      dy = P.y + 0.9 - g.y,
      dz = P.z - g.z,
      d = Math.hypot(dx, dy, dz);
    if (g.t > 0.5 && d < 7 && P.st !== 'dead') {
      // magnet
      const sp = 14 / Math.max(0.4, d);
      const safeD = Math.max(d, 0.001);
      g.vx = damp(g.vx, (dx / safeD) * sp, 10, dt);
      g.vy = damp(g.vy, (dy / safeD) * sp, 10, dt);
      g.vz = damp(g.vz, (dz / safeD) * sp, 10, dt);
    } else {
      g.vy -= 18 * dt;
      g.vx = damp(g.vx, 0, 1.5, dt);
      g.vz = damp(g.vz, 0, 1.5, dt);
    }
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.z += g.vz * dt;
    const floor = 0.35 + Math.sin(G.time * 4 + i) * 0.08; // gems float, even over open sky, so none are lost
    if (g.y < floor && g.t < 30) {
      g.y = floor;
      g.vy = Math.abs(g.vy) * 0.3;
    }
    g.m.position.set(g.x, g.y, g.z);
    g.m.rotation.y += dt * 4;
    if ((d < 1 && g.t > 0.3) || g.t > 45 || g.y < -20) {
      scene.remove(g.m);
      G.gems.splice(i, 1);
      if (d < 1) {
        addPart(g.id, 1);
        sfx('gem');
        burst(sparks, g.x, g.y, g.z, 6, 3, 0.3, new T.Color(PARTS[g.id].color).getHex(), 0.25);
      }
    }
  }
}
function clearGems() {
  G.gems.forEach(g => scene.remove(g.m));
  G.gems.length = 0;
}

/* ---------- crafting ---------- */
function itemDef(id) {
  return WEAPONS[id] || ARMOR[id];
}
function owned(id) {
  return WEAPONS[id] ? UNLOCKS.weapons.indexOf(id) >= 0 : UNLOCKS.armor.indexOf(id) >= 0;
}
function canCraft(id) {
  const r = (itemDef(id) || {}).recipe;
  if (!r || owned(id)) return false;
  for (const p in r) if (partCount(p) < r[p]) return false;
  return true;
}
function craft(id) {
  if (!canCraft(id)) return false;
  const r = itemDef(id).recipe;
  for (const p in r) UNLOCKS.parts[p] -= r[p];
  if (WEAPONS[id]) UNLOCKS.weapons.push(id);
  else UNLOCKS.armor.push(id);
  saveUnlocks();
  sfx('craft');
  return true;
}

/* ---------- armor stats ---------- */
function gearStats() {
  const st = { hp: 0, def: 0, speed: 0, stam: 0, flight: 0, power: 0, noChill: 0 },
    sets = {};
  for (const s of SLOTS) {
    const a = ARMOR[UNLOCKS.equip[s]];
    if (!a) continue;
    for (const k in st) st[k] += a[k] || 0;
    sets[a.set] = (sets[a.set] || 0) + 1;
  }
  st.bonus = [];
  for (const k in sets)
    if (sets[k] >= 4 && SETS[k]) {
      for (const b in SETS[k].setBonus) st[b] = (st[b] || 0) + SETS[k].setBonus[b];
      st.bonus.push(SETS[k].name + ': ' + SETS[k].bonusText);
    }
  st.def = Math.min(0.6, st.def);
  return st;
}
function applyGear() {
  const st = gearStats(),
    wasFull = P.hp >= TUNE.maxHp - 0.01;
  TUNE.maxHp = TUNE0.maxHp + st.hp;
  TUNE.runSpeed = TUNE0.runSpeed * (1 + st.speed);
  TUNE.heartRunSpeed = TUNE0.heartRunSpeed * (1 + st.speed);
  TUNE.staminaRegen = TUNE0.staminaRegen * (1 + st.stam);
  GEAR.def = st.def;
  GEAR.power = st.power;
  GEAR.flight = st.flight;
  GEAR.noChill = st.noChill;
  if (wasFull || P.hp > TUNE.maxHp) P.hp = TUNE.maxHp;
  attachArmor();
}
function flightMax() {
  return DATA.flight.energy + GEAR.flight;
}

/* ---------- armor pieces on Darren's rig ---------- */
const ARMOR_MAT = {};
function armorMat(color, glow) {
  const k = color + (glow ? 'g' : '');
  if (!ARMOR_MAT[k]) {
    ARMOR_MAT[k] = glow
      ? new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.2 })
      : toy(new T.Color(color).getHex(), { roughness: 0.28, metalness: 0.15 });
    if (window.ENV_TEX) ARMOR_MAT[k].envMap = window.ENV_TEX;
  }
  return ARMOR_MAT[k];
}
// one piece, built around its socket (x right, y up, z forward in the model's own space). side: 1 left, -1 right
function buildArmorPiece(a, side) {
  const S = SETS[a.set] || { color: '#cccccc', trim: '#ffffff' },
    m = armorMat(S.color),
    tm = armorMat(S.trim),
    gl = armorMat(S.trim, true),
    g = new T.Group();
  const add = (geo, mat, x, y, z, sx, sy, sz, rx, ry, rz) => {
    const o = mk(geo, mat, x, y, z, sx, sy, sz);
    o.rotation.set(rx || 0, ry || 0, rz || 0);
    g.add(o);
    return o;
  };
  switch (a.look) {
    case 'cap':
      add(GEO.hemi, m, 0, -0.05, 0, 0.5, 0.32, 0.46);
      for (let i = 0; i < 6; i++) {
        const t = (i / 6) * TAU;
        add(GEO.mid, tm, Math.cos(t) * 0.3, 0.12, Math.sin(t) * 0.28, 0.07, 0.03, 0.07);
      }
      break;
    case 'crest':
      for (let i = -1; i <= 1; i++)
        add(GEO.cone, m, 0, 0.12, i * 0.16 - 0.05, 0.05, 0.36 - Math.abs(i) * 0.1, 0.16, -0.5 - i * 0.2, 0, 0);
      add(GEO.mid, gl, 0, 0, 0.18, 0.07);
      break;
    case 'visor':
      add(GEO.box, m, 0, -0.36, 0.38, 0.62, 0.1, 0.08, -0.2);
      add(GEO.box, gl, 0, -0.36, 0.42, 0.52, 0.05, 0.03, -0.2);
      add(GEO.cone, tm, 0, 0.05, 0, 0.05, 0.25, 0.05);
      break;
    case 'horns':
      add(GEO.cyl, m, 0, -0.08, 0.02, 0.36, 0.08, 0.34);
      for (const s of [1, -1]) add(GEO.cone, tm, s * 0.26, 0.12, 0, 0.07, 0.4, 0.07, 0, 0, -s * 0.6);
      add(GEO.octa, gl, 0, -0.08, 0.34, 0.07);
      break;
    case 'plate':
      add(GEO.hemi, m, 0, 0, 0, 0.27, 0.28, 0.12, PI / 2 + 0.1);
      add(GEO.octa, gl, 0, 0.02, 0.12, 0.07);
      add(GEO.cyl, tm, 0, -0.17, -0.18, 0.32, 0.05, 0.3);
      break;
    case 'vest':
      add(GEO.hemi, m, 0, 0.02, -0.02, 0.29, 0.3, 0.14, PI / 2 + 0.05);
      add(GEO.cyl, tm, 0, 0.15, -0.2, 0.31, 0.04, 0.29);
      add(GEO.cyl, tm, 0, -0.15, -0.2, 0.3, 0.04, 0.28);
      break;
    case 'pads':
      add(GEO.hemi, m, 0, 0, 0, 0.15, 0.12, 0.15, 0, 0, side * 0.6);
      add(GEO.mid, tm, side * 0.08, 0.08, 0.06, 0.03);
      break;
    case 'spikes':
      add(GEO.hemi, m, 0, 0, 0, 0.15, 0.12, 0.15, 0, 0, side * 0.6);
      add(GEO.cone, tm, side * 0.06, 0.12, 0, 0.04, 0.2, 0.04, 0, 0, side * 0.5);
      add(GEO.cone, tm, side * 0.1, 0.06, -0.08, 0.035, 0.16, 0.035, 0, 0, side * 0.9);
      break;
    case 'greaves':
      add(GEO.hi, m, 0, 0, 0, 0.11, 0.15, 0.08);
      add(GEO.octa, gl, 0, 0.03, 0.07, 0.04);
      break;
    case 'boots':
      add(GEO.hemi, m, 0, -0.16, 0.02, 0.13, 0.1, 0.15);
      add(GEO.cyl, tm, 0, -0.08, 0, 0.11, 0.03, 0.11);
      break;
  }
  g.traverse(o => {
    if (o.isMesh) o.castShadow = true;
  });
  return g;
}
// where each slot's piece sits on the rig: [bone, x, y, z] in the model's rest space (see tests/probe_mom.js)
const ARMOR_SOCKETS = {
  head: [['head', 0, 1.7, 0.02, 0]],
  body: [['spine', 0, 0.6, 0.2, 0]],
  arms: [
    ['arm_L', 0.25, 0.9, 0.05, 1],
    ['arm_R', -0.25, 0.9, 0.05, -1],
  ],
  legs: [
    ['leg_L', 0.2, 0.27, 0.12, 1],
    ['leg_R', -0.2, 0.27, 0.12, -1],
  ],
};
function attachArmor() {
  const D = P.m;
  if (!D || !D.skin) return;
  D.armorG = D.armorG || {};
  for (const s of SLOTS) {
    (D.armorG[s] || []).forEach(o => o.parent && o.parent.remove(o));
    D.armorG[s] = [];
    const a = ARMOR[UNLOCKS.equip[s]];
    if (!a) continue;
    for (const [bn, x, y, z, side] of ARMOR_SOCKETS[s]) {
      const B = D.bones[bn];
      if (!B) continue;
      const sock = boneSocket(B, x, y, z);
      sock.add(buildArmorPiece(a, side));
      D.armorG[s].push(sock);
    }
  }
}

/* ---------- loadout and combat style ---------- */
function isTwin() {
  return UNLOCKS.style === 'twin';
}
function weaponKind(id) {
  return (WEAPONS[id] && WEAPONS[id].kind) || 'blade';
}
// Classic style swings a blade: the R-arm weapon if it is one, otherwise the L-arm one, otherwise Emberfang
function classicBlade() {
  const E = UNLOCKS.equip;
  if (E.R && weaponKind(E.R) === 'blade') return E.R;
  if (E.L && weaponKind(E.L) === 'blade') return E.L;
  return 'emberfang';
}
function refreshHands() {
  const E = UNLOCKS.equip;
  if (!E.R || UNLOCKS.weapons.indexOf(E.R) < 0) E.R = 'emberfang';
  if (E.L && UNLOCKS.weapons.indexOf(E.L) < 0) E.L = null;
  equipWeapon(isTwin() ? E.R : classicBlade());
  equipLeft(isTwin() ? E.L : null);
  updateWeaponChip();
}
function setLoadout(slot, id) {
  UNLOCKS.equip[slot] = id || null;
  if (slot === 'R' && !id) UNLOCKS.equip.R = 'emberfang';
  saveUnlocks();
  if (SLOTS.indexOf(slot) >= 0) applyGear();
  else refreshHands();
}
function setStyle(s, announce) {
  UNLOCKS.style = s;
  saveUnlocks();
  refreshHands();
  if (announce) {
    banner(
      s === 'twin' ? 'Twin Arms' : 'Classic Combos',
      s === 'twin' ? 'Slash = R-arm weapon · Heavy = L-arm weapon' : 'Slash strings with Heavy branches',
      110,
    );
    sfx('rank', 2);
  }
}
function updateWeaponChip() {
  const E = UNLOCKS.equip,
    n = id => (WEAPONS[id] ? WEAPONS[id].name : '—');
  if ($('wpnN'))
    $('wpnN').textContent = isTwin() ? 'Twin Arms · R ' + n(E.R) + ' · L ' + n(E.L) : 'Classic · ' + n(classicBlade());
}
/* the L-arm weapon (Twin Arms): built into the left-hand socket of the rigged model */
function equipLeft(id) {
  if (id && (!WEAPONS[id] || !UNLOCKS.weapons.includes(id))) id = null;
  P.weaponL = id || null;
  const D = P.m;
  if (!D || !D.sockL) return;
  if (D.swordL) D.sockL.remove(D.swordL);
  D.swordL = null;
  D.sBaseL = D.sTipL = null;
  if (!id) return;
  const cache = D.leftWeaponCache || (D.leftWeaponCache = new Map());
  const w = cache.get(id) || buildWeapon(id);
  cache.set(id, w);
  D.sockL.add(w.g);
  D.swordL = w.g;
  D.sBaseL = w.base;
  D.sTipL = w.tip;
  D.bladeMatL = w.bladeMat;
}
