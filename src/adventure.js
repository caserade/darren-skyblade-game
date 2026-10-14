/* ADVENTURE: Cloud Utopia (data/adventure.js) — roaming enemy dens that come back, resource crystals,
   waystones and fast travel, the Skyforge and Gearwing, contracts (missions) and the Titanic Scion.
   level.js calls advBuild() when the level is built, advReset() when play starts, advUpdate() every frame. */
const AD = { dens: {}, nodes: [], ways: {}, island: null, prompt: null, mood: -1, titanUp: false, forge: null };
const ADV = () => DATA.adventure;

/* ---------- props ---------- */
function buildWaystone() {
  const g = new T.Group(),
    st = flat(0xb8b2c8),
    off = new T.MeshStandardMaterial({ color: 0x8a8aa0, emissive: 0x334, emissiveIntensity: 0.3, flatShading: true }),
    on = new T.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x3fc8ff, emissiveIntensity: 0.9, flatShading: true });
  g.add(mk(GEO.lowCyl, st, 0, 0.15, 0, 0.9, 0.3, 0.9));
  g.add(mk(GEO.box, st, 0, 1.0, 0, 0.45, 1.6, 0.45));
  g.add(mk(GEO.lowCone, st, 0, 1.95, 0, 0.36, 0.3, 0.36));
  const gem = mk(GEO.octa, off, 0, 2.6, 0, 0.3, 0.45, 0.3);
  g.add(gem);
  const ringM = new T.MeshBasicMaterial({
      color: 0x7cd0ff,
      transparent: true,
      opacity: 0,
      side: T.DoubleSide,
      depthWrite: false,
    }),
    ring = new T.Mesh(new T.RingGeometry(1.1, 1.4, 32), ringM);
  ring.rotation.x = -PI / 2;
  ring.position.y = 0.06;
  g.add(ring);
  return { g, gem, on, off, ring };
}
function buildForgeStation() {
  const g = new T.Group(),
    iron = toy(0x4a4a58, { metalness: 0.5, roughness: 0.35 }),
    brick = flat(0xa0543a),
    fire = new T.MeshBasicMaterial({ color: 0xffa040 });
  // furnace
  g.add(mk(GEO.cyl, brick, -2.2, 1.2, -1.2, 1.3, 2.4, 1.3));
  g.add(mk(GEO.cylT, brick, -2.2, 2.9, -1.2, 0.5, 1.0, 0.5));
  const mouth = mk(GEO.box, fire, -2.2, 0.9, -0.05, 0.9, 0.7, 0.1);
  g.add(mouth);
  // anvil
  g.add(mk(GEO.box, iron, 0.4, 0.35, 0, 0.6, 0.7, 0.5));
  g.add(mk(GEO.box, iron, 0.4, 0.8, 0, 1.3, 0.25, 0.55));
  const horn = mk(GEO.cone, iron, 1.25, 0.8, 0, 0.2, 0.5, 0.2);
  horn.rotation.z = -PI / 2;
  g.add(horn);
  // weapon rack
  g.add(mk(GEO.box, PROP.woodD, 2.6, 0.9, -1.4, 0.15, 1.8, 0.15));
  g.add(mk(GEO.box, PROP.woodD, 4.0, 0.9, -1.4, 0.15, 1.8, 0.15));
  g.add(mk(GEO.box, PROP.wood, 3.3, 1.6, -1.4, 1.6, 0.12, 0.2));
  ['cloudcutter', 'emberblaster', 'galebow'].forEach((id, i) => {
    const w = buildWeapon(id);
    w.g.position.set(2.85 + i * 0.45, 1.75, -1.3);
    w.g.rotation.x = PI / 2;
    w.g.scale.setScalar(0.8);
    g.add(w.g);
  });
  // sign with hazard stripes
  const sign = mk(GEO.box, toy(0x1d2333), 0, 3.1, -1.6, 3.2, 0.7, 0.12);
  g.add(sign);
  for (let i = 0; i < 6; i++)
    g.add(mk(GEO.box, toy(i % 2 ? 0x1d2333 : 0xffc93c), -1.35 + i * 0.54, 2.7, -1.53, 0.54, 0.12, 0.04));
  g.add(mk(GEO.box, new T.MeshBasicMaterial({ color: 0x7cd0ff }), 0, 3.15, -1.53, 2.6, 0.12, 0.02));
  g.traverse(o => {
    if (o.isMesh) o.castShadow = true;
  });
  return { g, mouth };
}

/* ---------- build / reset ---------- */
function advBuild() {
  const A = ADV();
  AD.ways = {};
  for (const id in A.waystones) {
    const [x, z] = A.waystones[id],
      w = buildWaystone();
    w.g.position.set(x, 0, z);
    LV.root.add(w.g);
    LV.colliders.push({ x, z, r: 0.5 });
    AD.ways[id] = Object.assign(w, { id, x, z });
  }
  const F = A.forge,
    fs = buildForgeStation();
  fs.g.position.set(F.x, 0, F.z);
  fs.g.rotation.y = F.face || 0;
  LV.root.add(fs.g);
  AD.forge = Object.assign(fs, { x: F.x, z: F.z });
  fs.g.updateMatrixWorld(true);
  for (const [lx, lz, r] of [
    [-2.2, -1.2, 1.4],
    [0.4, 0, 0.8],
    [3.3, -1.4, 0.9],
  ]) {
    const v = fs.g.localToWorld(new T.Vector3(lx, 0, lz));
    LV.colliders.push({ x: v.x, z: v.z, r });
  }
  AD.gearAdded = false;
  dumpBuild();
}
function advReset(retry) {
  const A = ADV();
  AD.dens = {};
  for (const id in A.dens) AD.dens[id] = { list: [], t: 0, spawned: false };
  AD.nodes = A.nodes.map(n => ({ def: n, e: null, t: 0 }));
  AD.island = null;
  AD.mood = -1;
  AD.titanUp = false;
  for (const id in AD.ways) lightWay(id, UNLOCKS.way.indexOf(id) >= 0, true);
  if (UNLOCKS.advSeen) {
    const st = LV.zoneState.haven;
    st.state = 'cleared';
    st.seen = true;
    st.named = true;
  }
  // start at the last waystone used (or the Haven)
  const last = UNLOCKS.advWay && AD.ways[UNLOCKS.advWay];
  if (last && !retry) {
    P.x = last.x + 2;
    P.z = last.z + 2;
  }
  if (retry) {
    P.x = A.zones[0].checkpoint[0];
    P.z = A.zones[0].checkpoint[1];
  }
  LV.lastSafe = { x: P.x, z: P.z };
  cam.fx = P.x;
  cam.fz = P.z;
  if (LV.ruffyFollow) LV.ruffy.root.position.set(P.x - 1.4, 0, P.z - 1.4);
  dumpReset();
  castAdvReset();
  setObjective(contractObjective());
}
function lightWay(id, on, quiet) {
  const w = AD.ways[id];
  if (!w) return;
  w.lit = on;
  w.gem.material = on ? w.on : w.off;
  if (on && !quiet) {
    burst(sparks, w.x, 2.6, w.z, 30, 6, 0.7, 0x7cd0ff, 0.4);
    sfx('perfect');
    banner('Waystone lit', LV.islands[id].name + ' · fast travel from the Map (N)', 140);
  }
}

/* ---------- every frame ---------- */
function advUpdate(s, dt) {
  const A = ADV();
  if (!UNLOCKS.advSeen && LV.zoneState.haven && LV.zoneState.haven.state === 'cleared') {
    UNLOCKS.advSeen = true;
    saveUnlocks();
  }
  // Gearwing at the forge (his model loads a moment after the level)
  if (NPCS.gear && !AD.gearAdded) {
    AD.gearAdded = true;
    const F = A.forge;
    NPCS.gear.root.position.set(F.x + 1.6, 0, F.z + 1.8);
    NPCS.gear.root.rotation.y = 0.6;
    LV.root.add(NPCS.gear.root);
    LV.colliders.push({ x: F.x + 1.6, z: F.z + 1.8, r: 0.6 });
  }
  if (NPCS.gear && AD.gearAdded) animMom(NPCS.gear, G.time + 2, G.cine && TALK.who === 'gear', dt);
  if (AD.forge) AD.forge.mouth.material.color.setHSL(0.07, 1, 0.55 + Math.sin(G.time * 9) * 0.08);
  // waystones
  for (const id in AD.ways) {
    const w = AD.ways[id];
    w.gem.position.y = 2.6 + Math.sin(G.time * 2 + w.x) * 0.12;
    w.gem.rotation.y += dt * (w.lit ? 2 : 0.5);
    w.ring.material.opacity = w.lit ? 0.35 + Math.sin(G.time * 3) * 0.15 : 0;
    if (!w.lit && P.y < 3 && Math.hypot(P.x - w.x, P.z - w.z) < 1.8) {
      UNLOCKS.way.push(id);
      saveUnlocks();
      lightWay(id, true);
      contractExplore(id);
    }
    if (w.lit && Math.hypot(P.x - w.x, P.z - w.z) < 1.8 && UNLOCKS.advWay !== id) {
      UNLOCKS.advWay = id;
      saveUnlocks();
    }
  }
  // the "press E" prompt at the forge
  const F = A.forge;
  AD.prompt = Math.hypot(P.x - F.x, P.z - F.z) < 4.2 && P.onG ? 'forge' : null;
  dumpUpdate(s, dt);
  castAdvUpdate(dt);
  if (!AD.prompt && dumpNear()) AD.prompt = 'dumpling';
  // island names as Darren arrives
  const I = P.onG ? islandAt(P.x, P.z) : null;
  if (I && I !== AD.island) {
    AD.island = I;
    const den = A.dens[I.id];
    banner(
      I.name,
      den ? den.enemies.map(([t, n, f]) => n + ' ' + (f ? 'Elite ' : '') + EDEF[t].name).join(' · ') : '',
      120,
    );
  }
  // roaming dens: spawn when Darren comes near, come back a while after they are beaten
  for (const id in AD.dens) {
    const st = AD.dens[id],
      I2 = LV.islands[id],
      near = Math.hypot(P.x - I2.x, P.z - I2.z) < I2.r + 26;
    if (st.spawned && !st.list.some(e => e.alive)) {
      st.spawned = false;
      st.t = A.dens[id].respawn * 60;
    }
    if (!st.spawned) {
      st.t -= s;
      if (st.t <= 0 && near) spawnDen(id);
    }
  }
  // resource crystals
  for (const n of AD.nodes) {
    if (n.e && n.e.alive) continue;
    if (n.e && !n.e.alive && n.t <= 0) n.t = A.nodeRespawn * 60;
    n.t -= s;
    if (n.t <= 0) {
      const d = n.def,
        e = spawnEnemy('node', d.x, d.z, { part: d.part });
      e.hp = e.max = d.hp;
      e.drops = [[d.part, d.count, 1]];
      e.st = 'idle';
      e.m.root.scale.setScalar(1);
      n.e = e;
      n.t = 0;
    }
  }
  // the Titanic Scion wakes when its contract is taken and Darren lands on Titan's Rest
  const TT = A.titan,
    TI = LV.islands[TT.island];
  if (!AD.titanUp && contractActive('titan') && P.onG && Math.hypot(P.x - TI.x, P.z - TI.z) < TI.r - 2) {
    AD.titanUp = true;
    const b = spawnEnemy(TT.type, TT.at[0], TT.at[1]);
    b.home = TI;
    b.face = Math.atan2(P.x - b.x, P.z - b.z);
    G.shake = 1;
    sfx('roar');
    talk('titan_intro');
  }
  // music follows the danger
  const boss = G.boss && G.boss.alive,
    fight = G.enemies.some(e => e.alive && !e.d.static && Math.hypot(e.x - P.x, e.z - P.z) < 18),
    mood = boss ? 2 : fight ? 1 : 0;
  if (mood !== AD.mood) {
    AD.mood = mood;
    Music.setMood(mood);
  }
}
function spawnDen(id) {
  const st = AD.dens[id],
    I = LV.islands[id];
  st.list = [];
  st.spawned = true;
  for (const [type, count, flag] of ADV().dens[id].enemies)
    for (let k = 0; k < count; k++) {
      let x,
        z,
        t = 0;
      do {
        const a = rnd(TAU),
          r = rnd(0.2, 0.75) * I.r;
        x = I.x + Math.cos(a) * r;
        z = I.z + Math.sin(a) * r;
      } while (Math.hypot(x - P.x, z - P.z) < 6 && ++t < 20);
      const e = spawnEnemy(type, x, z, { elite: flag === 'elite' });
      e.home = I;
      e.den = id;
      st.list.push(e);
    }
}
function advUse() {
  if (AD.prompt === 'forge') openHangar('forge');
  if (AD.prompt === 'dumpling') openHangar('dumpling');
}
function openMap() {
  openHangar('map');
}
function openHangar(tab) {
  if (G.mode === 'play' && !G.paused) togglePause();
  if (window.openPanel) openPanel(tab);
}

/* ---------- contracts ---------- */
function contractDef(id) {
  return ADV().contracts.find(c => c.id === id);
}
function contractActive(type) {
  return UNLOCKS.contracts.active.some(id => (contractDef(id) || {}).type === type);
}
function contractAvailable(c) {
  return UNLOCKS.contracts.active.indexOf(c.id) < 0 && (c.repeat || !UNLOCKS.contracts.done[c.id]);
}
function acceptContract(id) {
  const C = UNLOCKS.contracts,
    c = contractDef(id);
  if (!c || C.active.length >= 3 || !contractAvailable(c)) return false;
  C.active.push(id);
  C.prog[id] = c.type === 'explore' && c.target === 'any' ? UNLOCKS.way.length : 0;
  saveUnlocks();
  if (G.mode === 'play') setObjective(contractObjective());
  checkContract(c);
  return true;
}
function abandonContract(id) {
  const C = UNLOCKS.contracts;
  C.active = C.active.filter(x => x !== id);
  saveUnlocks();
  if (G.mode === 'play') setObjective(contractObjective());
}
function bumpContracts(fn) {
  for (const id of UNLOCKS.contracts.active.slice()) {
    const c = contractDef(id);
    if (!c) continue;
    const add = fn(c);
    if (add) {
      UNLOCKS.contracts.prog[id] = (UNLOCKS.contracts.prog[id] || 0) + add;
      checkContract(c);
    }
  }
  saveUnlocks();
}
function checkContract(c) {
  const C = UNLOCKS.contracts;
  if ((C.prog[c.id] || 0) < c.count) return;
  C.active = C.active.filter(x => x !== c.id);
  C.done[c.id] = (C.done[c.id] || 0) + 1;
  C.prog[c.id] = 0;
  for (const p in c.reward) addPart(p, c.reward[p], true);
  saveUnlocks();
  sfx('win');
  banner(
    'Contract complete: ' + c.name,
    Object.keys(c.reward)
      .map(p => '+' + c.reward[p] + ' ' + PARTS[p].name)
      .join(' · '),
    220,
  );
  if (G.mode === 'play') setObjective(contractObjective());
}
function advOnKill(e) {
  if (!isAdventure() || e.d.static) return;
  dumpOnKill(e);
  bumpContracts(c =>
    c.type === 'hunt' && (c.target === e.type || c.target === 'any' || (c.target === 'elite' && e.elite)) ? 1 : 0,
  );
}
function advOnPart(id, n) {
  if (!isAdventure()) return;
  bumpContracts(c => (c.type === 'harvest' && c.target === id ? n : 0));
}
function contractExplore(id) {
  bumpContracts(c => (c.type === 'explore' && (c.target === id || c.target === 'any') ? 1 : 0));
}
function advBossDown(b) {
  bumpContracts(c => (c.type === 'titan' ? 1 : 0));
  AD.titanUp = false;
  setTimeout(() => talk('titan_down'), 1200);
}
function contractObjective() {
  const a = UNLOCKS.contracts.active;
  if (!a.length) return 'Take a contract at the Skyforge (E there, or Hangar > Contracts)';
  const c = contractDef(a[0]);
  return c ? c.name + ': ' + c.text : '';
}
function advHud() {
  const box = $('ctr');
  if (!isAdventure() || G.cine) {
    box.hidden = true;
    $('prompt').hidden = true;
    $('dumpHud').hidden = true;
    $('tBelly').hidden = true;
    return;
  }
  const a = UNLOCKS.contracts.active,
    txt = a
      .map(id => {
        const c = contractDef(id);
        return c ? c.name + '  ' + Math.min(c.count, UNLOCKS.contracts.prog[id] || 0) + '/' + c.count : '';
      })
      .join('\n');
  box.hidden = !a.length;
  if (box.textContent !== txt) box.textContent = txt;
  $('prompt').hidden = !AD.prompt;
  if (AD.prompt) {
    const t = AD.prompt === 'dumpling' ? 'Feed Dumpling' : 'Open the Skyforge';
    if ($('promptT').textContent !== t) $('promptT').textContent = t;
  }
  dumpHud();
}
$('prompt').addEventListener('click', () => advUse());

/* ---------- the map ---------- */
let mapHit = [];
function drawMap(cv) {
  const A = ADV(),
    ctx = cv.getContext('2d'),
    W = (cv.width = cv.clientWidth * (devicePixelRatio || 1)),
    H = (cv.height = cv.clientHeight * (devicePixelRatio || 1)),
    isl = A.level.islands;
  let x0 = 1e9,
    x1 = -1e9,
    z0 = 1e9,
    z1 = -1e9;
  for (const I of isl) {
    x0 = Math.min(x0, I.x - I.r);
    x1 = Math.max(x1, I.x + I.r);
    z0 = Math.min(z0, I.z - I.r);
    z1 = Math.max(z1, I.z + I.r);
  }
  const pad = 30 * (devicePixelRatio || 1),
    sc = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (z1 - z0)),
    // north (+z) is up; x is mirrored so the map matches the camera's default view
    mx = x => W / 2 - (x - (x0 + x1) / 2) * sc,
    my = z => H / 2 - (z - (z0 + z1) / 2) * sc,
    dpr = devicePixelRatio || 1;
  ctx.clearRect(0, 0, W, H);
  // sky grid
  ctx.strokeStyle = 'rgba(124,208,255,0.08)';
  ctx.lineWidth = 1;
  for (let g = 0; g < W; g += 40 * dpr) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, H);
    ctx.stroke();
  }
  for (let g = 0; g < H; g += 40 * dpr) {
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(W, g);
    ctx.stroke();
  }
  // links
  ctx.setLineDash([6 * dpr, 6 * dpr]);
  ctx.strokeStyle = 'rgba(255,240,214,0.55)';
  ctx.lineWidth = 3 * dpr;
  for (const L of A.level.links) {
    const a = isl.find(i => i.id === L.a),
      b = isl.find(i => i.id === L.b);
    ctx.beginPath();
    ctx.moveTo(mx(a.x), my(a.z));
    ctx.lineTo(mx(b.x), my(b.z));
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // islands
  mapHit = [];
  const targets = new Set();
  for (const id of UNLOCKS.contracts.active) {
    const c = contractDef(id);
    if (!c) continue;
    if (c.type === 'titan') targets.add(A.titan.island);
    if (c.type === 'explore' && c.target !== 'any') targets.add(c.target);
    if (c.type === 'hunt' || c.type === 'harvest')
      for (const iid in A.dens)
        if (A.dens[iid].enemies.some(([t]) => t === c.target || (c.target === 'elite' && false))) targets.add(iid);
    if (c.type === 'harvest') for (const n of A.nodes) if (n.part === c.target) targets.add(n.island);
    if (c.type === 'harvest')
      for (const iid in A.dens)
        if (A.dens[iid].enemies.some(([t]) => (DATA.drops[t] || []).some(d => d[0] === c.target))) targets.add(iid);
  }
  for (const I of isl) {
    const x = mx(I.x),
      y = my(I.z),
      r = I.r * sc;
    ctx.fillStyle = I.id === 'titan' ? '#3a2e5a' : I.id === 'haven' ? '#2e4a5a' : '#2f4a38';
    ctx.strokeStyle = targets.has(I.id) ? '#ffc93c' : 'rgba(255,244,232,0.5)';
    ctx.lineWidth = (targets.has(I.id) ? 4 : 2) * dpr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (targets.has(I.id)) {
      ctx.strokeStyle = 'rgba(255,201,60,' + (0.4 + Math.sin(performance.now() / 200) * 0.3) + ')';
      ctx.beginPath();
      ctx.arc(x, y, r + 6 * dpr, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff4e8';
    ctx.font = `700 ${12 * dpr}px "Chakra Petch", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(I.name.toUpperCase(), x, y - r - 6 * dpr);
    // waystone
    const w = A.waystones[I.id];
    if (w) {
      const lit = UNLOCKS.way.indexOf(I.id) >= 0,
        wx = mx(w[0]),
        wy = my(w[1]);
      ctx.fillStyle = lit ? '#7cd0ff' : '#5a5a70';
      ctx.beginPath();
      ctx.moveTo(wx, wy - 8 * dpr);
      ctx.lineTo(wx + 6 * dpr, wy);
      ctx.lineTo(wx, wy + 8 * dpr);
      ctx.lineTo(wx - 6 * dpr, wy);
      ctx.fill();
      if (lit) mapHit.push({ id: I.id, x: x / dpr, y: y / dpr, r: Math.max(r / dpr, 18) });
    }
    if (I.id === A.titan.island) {
      ctx.fillStyle = '#b49aff';
      ctx.font = `700 ${11 * dpr}px "Chakra Petch", sans-serif`;
      ctx.fillText('TITAN', x, y + 4 * dpr);
    }
    if (I.id === 'haven') {
      ctx.fillStyle = '#ffc93c';
      ctx.font = `700 ${11 * dpr}px "Chakra Petch", sans-serif`;
      ctx.fillText('SKYFORGE', x, y + 18 * dpr);
    }
  }
  // Darren
  if (isAdventure()) {
    const px = mx(P.x),
      py = my(P.z),
      a = -P.face + PI;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a);
    ctx.fillStyle = '#ff6a5c';
    ctx.strokeStyle = '#241012';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, -10 * dpr);
    ctx.lineTo(7 * dpr, 8 * dpr);
    ctx.lineTo(-7 * dpr, 8 * dpr);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
function mapClick(cv, ev) {
  const r = cv.getBoundingClientRect(),
    x = ev.clientX - r.left,
    y = ev.clientY - r.top;
  for (const h of mapHit) if (Math.hypot(h.x - x, h.y - y) < h.r) return h.id;
  return null;
}
function fastTravel(id) {
  if (!isAdventure() || G.mode !== 'play') return false;
  if (G.boss && G.boss.alive) {
    floatText(P.x, P.y + 2, P.z, 'Not during a Titan fight!', 'say');
    return false;
  }
  const w = AD.ways[id];
  if (!w || !w.lit) return false;
  if (window.closePanel) closePanel();
  if (G.paused) togglePause();
  G.cine = true;
  fade(1, () => {
    P.x = w.x + 2;
    P.z = w.z + 2;
    P.y = 0;
    P.vx = P.vy = P.vz = 0;
    P.onG = true;
    P.fly = false;
    P.st = 'move';
    LV.lastSafe = { x: P.x, z: P.z };
    cam.fx = P.x;
    cam.fz = P.z;
    LV.ruffy.root.position.set(P.x - 1.4, 0, P.z - 1.4);
    LV.crumbs = [];
    UNLOCKS.advWay = id;
    saveUnlocks();
    fade(0, () => {
      G.cine = false;
    });
  });
  return true;
}
