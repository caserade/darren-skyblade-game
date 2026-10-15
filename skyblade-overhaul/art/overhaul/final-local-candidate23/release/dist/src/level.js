/* =====================================================================
   LEVEL, STORY AND GAME FLOW
      Builds the current chapter's islands (CH.level), runs its zones (story beats, CH.zones),
   shows dialogue from CH.story, handles checkpoints, falling, music, HUD, Ruffy and the main loop.
   CH is one entry of DATA.chapters; loadChapter(id) switches chapters.
   ===================================================================== */
let CH = DATA.chapters[0]; // the chapter being played (DATA.chapters, see data/game_data.js and data/chapter2.js)
const flowTimers = [];
function cancelFlow() {
  flowTimers.length = 0;
  $('fade').classList.remove('on');
  TALK.q = [];
  TALK.i = TALK.shown = 0;
  TALK.line = TALK.done = null;
  G.cine = false;
  $('talk').hidden = true;
}
function scheduleFlow(done, milliseconds) {
  flowTimers.push({ done, remaining: milliseconds / 1000, chapter: CH });
}
function updateFlow(dt) {
  if (G.mode !== 'play' || G.paused) return;
  for (const timer of [...flowTimers]) {
    timer.remaining -= dt;
    if (timer.remaining > 0) continue;
    const i = flowTimers.indexOf(timer);
    if (i < 0) continue;
    flowTimers.splice(i, 1);
    if (timer.chapter === CH) timer.done();
  }
}
function chapterById(id) {
  if (DATA.adventure && id === DATA.adventure.id) return DATA.adventure;
  return DATA.chapters.find(c => c.id === id) || DATA.chapters[0];
}
const isAdventure = () => CH.mode === 'adventure';
const LV = {
  root: null, // every object of the current chapter's level lives under this group
  islands: {},
  links: [],
  colliders: [],
  paws: [],
  pickups: [],
  gates: [],
  zoneState: {},
  active: null,
  idx: 0,
  lastSafe: { x: 0, z: 0 },
};

/* ---------- geometry helpers ---------- */
function islandById(id) {
  return LV.islands[id];
}
function islandAt(x, z) {
  let best = null,
    bd = 1e9;
  for (const id in LV.islands) {
    const I = LV.islands[id],
      d = Math.hypot(x - I.x, z - I.z);
    if (d < I.r + 1 && d < bd) {
      bd = d;
      best = I;
    }
  }
  return best;
}
function segInfo(px, pz, A, B) {
  const dx = B.x - A.x,
    dz = B.z - A.z,
    L2 = dx * dx + dz * dz,
    t = clamp(((px - A.x) * dx + (pz - A.z) * dz) / L2, 0, 1);
  return { t, d: Math.hypot(px - (A.x + dx * t), pz - (A.z + dz * t)) };
}
/* is there walkable ground at (x, z)? (all ground is at height 0) */
function groundAt(x, z) {
  for (const id in LV.islands) {
    const I = LV.islands[id];
    if ((x - I.x) * (x - I.x) + (z - I.z) * (z - I.z) < I.r * I.r) return true;
  }
  for (const L of LV.links) {
    if (!L.open) continue;
    if (L.type === 'bridge') {
      const s = segInfo(x, z, L.A, L.B);
      if (s.d < L.w / 2) return true;
    } else for (const S of L.stones) if (S.up > 0.95 && Math.hypot(x - S.x, z - S.z) < S.r) return true;
  }
  return false;
}

/* ---------- build ---------- */
function buildLevel() {
  const D = CH.level,
    add = o => LV.root.add(o);
  for (const I of D.islands) {
    const g = buildIsland(I.r, true);
    g.position.set(I.x, 0, I.z);
    add(g);
    LV.islands[I.id] = Object.assign({}, I, { g, exits: [] });
  }
  for (const Ld of D.links) {
    const a = LV.islands[Ld.a],
      b = LV.islands[Ld.b],
      dx = b.x - a.x,
      dz = b.z - a.z,
      L = Math.hypot(dx, dz),
      ux = dx / L,
      uz = dz / L;
    const link = Object.assign({}, Ld, { open: !Ld.lockedBy, ux, uz });
    link.A = { x: a.x + ux * (a.r - 0.8), z: a.z + uz * (a.r - 0.8) };
    link.B = { x: b.x - ux * (b.r - 0.8), z: b.z - uz * (b.r - 0.8) };
    a.exits.push(Math.atan2(ux, uz));
    b.exits.push(Math.atan2(-ux, -uz));
    if (Ld.type === 'bridge') {
      link.g = buildBridge(link.A, link.B, Ld.w);
      add(link.g);
      if (!link.open) {
        const br = buildBarrier(Ld.w);
        br.position.set(link.A.x + ux * 1.4, 0, link.A.z + uz * 1.4);
        br.rotation.y = Math.atan2(ux, uz);
        add(br);
        link.barrier = br;
      }
    } else {
      link.stones = Ld.stones.map(([x, z, r]) => {
        const g = buildStone(r);
        g.position.set(x, link.open ? 0 : -9, z);
        add(g);
        return { x, z, r, g, up: link.open ? 1 : 0 };
      });
    }
    LV.links.push(link);
  }
  const hasHouse = I => I.id === 'home' && I.deco.indexOf('house') >= 0;
  // decoration per island (kept away from the paths and the middle where fights happen)
  for (const id in LV.islands) {
    const I = LV.islands[id],
      near = (x, z, pad) =>
        I.exits.some(a => {
          const ex = Math.sin(a),
            ez = Math.cos(a);
          const along = x * ex + z * ez,
            side = Math.abs(-x * ez + z * ex);
          return along > 0 && side < (pad || 3);
        });
    const ring = (n, r0, r1, make, col, tall) => {
      for (let i = 0; i < n; i++) {
        let x,
          z,
          k = 0;
        do {
          const a = rnd(TAU),
            r = rnd(r0, r1) * I.r;
          x = Math.cos(a) * r;
          z = Math.sin(a) * r;
          k++;
        } while (
          (near(x, z, 3.4) ||
            (hasHouse(I) &&
              (Math.hypot(x + 7, z + 3) < 6.8 || Math.hypot(x - 6, z + 6) < 2.6 || Math.hypot(x - 1, z - 1) < 4))) &&
          k < 20
        );
        if (k >= 20) continue;
        const o = make();
        o.position.set(I.x + x, 0, I.z + z);
        o.rotation.y = rnd(TAU);
        add(o);
        if (col) LV.colliders.push({ x: I.x + x, z: I.z + z, r: col });
        if (tall) LV.decos.push({ o, x: I.x + x, z: I.z + z });
      }
    };
    for (const d of I.deco) {
      if (d === 'trees') ring(Math.round(I.r * 0.55), 0.72, 0.92, () => buildTree(rnd(0.8, 1.3)), 0.7, true);
      if (d === 'pines') ring(Math.round(I.r * 0.6), 0.7, 0.93, () => buildPine(rnd(0.9, 1.4)), 0.7, true);
      if (d === 'logs') ring(Math.round(I.r * 0.25), 0.55, 0.85, buildLogPile, 0.9);
      if (d === 'snow') {
        const f = buildSnowPatches(Math.round(I.r * 1.2), I.r * 0.92);
        f.position.set(I.x, 0, I.z);
        add(f);
      }
      if (d === 'mushrooms') ring(Math.round(I.r * 0.4), 0.5, 0.9, buildMushroomRing, 0);
      if (d === 'rocks')
        ring(
          Math.round(I.r * 0.4),
          0.6,
          0.92,
          () => {
            const s = rnd(0.4, 1.1),
              m = mk(GEO.rock0, flat(0x9a948c), 0, s * 0.35, 0, s, s * rnd(0.6, 1), s);
            m.receiveShadow = true;
            const g = new T.Group();
            g.add(m);
            return g;
          },
          0.6,
        );
      if (d === 'crystals') ring(Math.round(I.r * 0.3), 0.55, 0.9, buildCrystalCluster, 0.5);
      if (d === 'ruins') ring(Math.round(I.r * 0.3), 0.6, 0.9, buildRuin, 0.5);
      if (d === 'flowers') {
        const f = buildFlowers(Math.round(I.r * I.r * 0.9), I.r * 0.95, (x, z) => near(x, z, 2));
        f.position.set(I.x, 0, I.z);
        add(f);
      }
    }
    // grass tufts
    const N = CH.id === 'ch3' ? 0 : Math.round(I.r * I.r * (COARSE ? 1.4 : 3)),
      inst = new T.InstancedMesh(
        new T.ConeGeometry(0.07, 0.34, 4),
        flat(I.deco.indexOf('snow') >= 0 ? 0x6fae5a : 0x4f9e3a),
        N,
      ),
      dd = new T.Object3D();
    for (let i = 0; i < N; i++) {
      const a = rnd(TAU),
        r = Math.sqrt(rnd(1)) * (I.r - 0.3);
      dd.position.set(I.x + Math.cos(a) * r, 0.15, I.z + Math.sin(a) * r);
      dd.rotation.set(rnd(-0.3, 0.3), rnd(TAU), rnd(-0.3, 0.3));
      dd.scale.set(rnd(0.8, 1.6), rnd(0.5, 1.1), rnd(0.8, 1.6));
      dd.updateMatrix();
      inst.setMatrixAt(i, dd.matrix);
    }
    add(inst);
  }
  // Mom's house (Mom and Ruffy themselves are built once and kept between chapters)
  const home = LV.islands.home;
  LV.chimney = null;
  if (home && hasHouse(home)) {
    const H = buildHouse();
    H.g.position.set(home.x - 7, 0, home.z - 3);
    H.g.rotation.y = PI / 2;
    add(H.g);
    H.g.updateMatrixWorld(true);
    LV.chimney = H.g.localToWorld(H.chimney.clone());
    H.dh.position.set(home.x + 6, 0, home.z - 6);
    H.dh.rotation.y = -0.8;
    add(H.dh);
    LV.colliders.push(
      { x: home.x - 7, z: home.z - 5.4, r: 2.7 },
      { x: home.x - 7, z: home.z - 3, r: 2.7 },
      { x: home.x - 7, z: home.z - 0.6, r: 2.7 },
      { x: home.x + 6, z: home.z - 6, r: 1 },
    );
    if (CH.woodpile) {
      // Mom's empty wood store by the cottage door; it fills up as firewood is brought home
      LV.woodStore = buildWoodStore();
      LV.woodStore.g.position.set(home.x - 4.3, 0, home.z - 7.6);
      LV.woodStore.g.rotation.y = PI / 2 - 0.35;
      add(LV.woodStore.g);
      LV.colliders.push({ x: home.x - 4.3, z: home.z - 7.6, r: 0.9 });
    }
  }
  // Ruffy's crystal cage at the back of the boss island
  LV.cage = null;
  if (CH.cage) {
    const peak = LV.islands[CH.cage];
    LV.cage = buildCage();
    LV.cage.g.position.set(peak.x, 0, peak.z + peak.r - 5);
    add(LV.cage.g);
    LV.colliders.push({ x: LV.cage.g.position.x, z: LV.cage.g.position.z, r: 1.7, cage: true });
  }
  // pickups: a zone's `pickup` (one) or `pickups` (a list) appear when the zone is cleared
  for (const Z of CH.zones) {
    const list = Z.pickups || (Z.pickup ? [Z.pickup] : []);
    list.forEach((pd, k) => {
      const p = buildPickup(pd.item, pd.weapon);
      p.g.position.set(pd.x, 0, pd.z);
      p.g.visible = false;
      add(p.g);
      LV.pickups.push(Object.assign({ zone: Z.id, id: Z.id + ':' + k, taken: false }, pd, p));
    });
  }
  if (D.pawPrints !== false) buildPawTrail();
}
/* switch to another chapter: throw away the old level and build the new one */
function loadChapter(id) {
  cancelFlow();
  resetInput();
  clearEnemies();
  CH = chapterById(id);
  if (LV.root) {releaseLevelGeometry(LV.root);scene.remove(LV.root);}
  LV.root = new T.Group();
  scene.add(LV.root);
  Object.assign(LV, {
    islands: {},
    links: [],
    colliders: [],
    decos: [],
    paws: [],
    pickups: [],
    zoneState: {},
    active: null,
    idx: 0,
    woodStore: null,
  });
  clearGems();
  clearShots();
  buildLevel();
  buildStormglass();
  polishChapter();
  if (isAdventure()) advBuild();
  for (const Z of CH.zones) LV.zoneState[Z.id] = { state: 'idle', seen: false, named: false };
  // hide backdrop islands that would sit too close to this chapter's islands, and centre the clouds on it
  let cx = 0,
    cz = 0;
  for (const I of CH.level.islands) {
    cx += I.x / CH.level.islands.length;
    cz += I.z / CH.level.islands.length;
  }
  for (const g of world.far)
    g.visible = !CH.level.islands.some(
      I => Math.hypot(g.position.x - I.x, g.position.z - I.z) < I.r + g.userData.r + 18,
    );
  for (const c of world.clouds) {
    c.position.z = c.userData.z + cz - 90;
    c.userData.dx = cx;
  }
  placeHome();
  P.x = CH.level.start.x;
  P.z = CH.level.start.z;
}
/* Mom by the cottage, Ruffy either in his cage or at home with Darren */
function placeHome() {
  const home = LV.islands.home;
  if (LV.mom) {
    LV.mom.root.visible = !!home;
    if (home) {
      LV.mom.root.position.set(home.x - 2.3, 0, home.z + 0.4);
      LV.mom.root.rotation.y = 1.2;
    }
  }
  const R = LV.ruffy;
  LV.ruffyRun = false;
  LV.crumbs = [];
  if (CH.ruffy === 'caged' && LV.cage) {
    R.root.position.copy(LV.cage.g.position);
    R.root.rotation.y = PI;
    LV.ruffyMode = 'sad';
    LV.ruffyFollow = false;
  } else {
    R.root.position.set(CH.level.start.x + 1.2, 0, CH.level.start.z - 1.2);
    R.root.rotation.y = 0;
    LV.ruffyMode = 'happy';
    LV.ruffyFollow = CH.ruffy === 'follow';
  }
  R.y = 0;
}
/* Ruffy's paw prints: across each island from where you arrive to where you leave, and along each link */
function buildPawTrail() {
  const pts = [],
    add = (x, z) => pts.push([x, z]);
  const order = CH.zones.map(z => z.island);
  for (let i = 0; i < order.length; i++) {
    const I = LV.islands[order[i]],
      inL = LV.links.find(l => l.b === I.id),
      outL = LV.links.find(l => l.a === I.id);
    const from = inL ? inL.B : { x: CH.level.start.x, z: CH.level.start.z },
      to = outL
        ? outL.type === 'bridge'
          ? outL.A
          : { x: outL.stones[0].x - outL.ux * 2.6, z: outL.stones[0].z - outL.uz * 2.6 }
        : null;
    if (to) {
      const n = Math.max(2, Math.round(Math.hypot(to.x - from.x, to.z - from.z) / 2.2));
      for (let k = 1; k < n; k++) add(lerp(from.x, to.x, k / n) + Math.sin(k * 1.7) * 0.5, lerp(from.z, to.z, k / n));
    }
    if (outL && outL.type === 'bridge') {
      const n = Math.round(Math.hypot(outL.B.x - outL.A.x, outL.B.z - outL.A.z) / 2.2);
      for (let k = 0; k <= n; k++) add(lerp(outL.A.x, outL.B.x, k / n), lerp(outL.A.z, outL.B.z, k / n));
    }
    if (outL && outL.type === 'stones') for (const S of outL.stones) add(S.x, S.z);
  }
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i],
      nx = pts[Math.min(i + 1, pts.length - 1)],
      px = pts[Math.max(i - 1, 0)],
      ang = Math.atan2(nx[0] - px[0], nx[1] - px[1]);
    const m = buildPaw(),
      side = i % 2 ? 0.18 : -0.18;
    m.position.set(x + Math.cos(ang) * side, 0.035, z - Math.sin(ang) * side);
    m.rotation.y = ang;
    LV.root.add(m);
    const link = LV.links.find(l => l.type === 'stones' && l.stones.some(S => Math.hypot(S.x - x, S.z - z) < 0.1));
    LV.paws.push({ m, link, i });
  }
}
/* ---------- zones ---------- */
function zoneData(id) {
  return CH.zones.find(z => z.id === id);
}
function setObjective(t) {
  $('objT').textContent = t || '';
  $('obj').hidden = !t;
}
function unlockLinks(zoneId) {
  for (const L of LV.links)
    if (L.lockedBy === zoneId && !L.open) {
      L.open = true;
      L.rising = L.type === 'stones';
      if (L.barrier) {
        const p = L.barrier.position;
        burst(sparks, p.x, 1.5, p.z, 40, 7, 0.8, 0xff7ab8, 0.45, { g: 4 });
        sfx('break');
        LV.root.remove(L.barrier);
        L.barrier = null;
      }
      if (L.rising) sfx('heart');
    }
}
function lockLinksFor(zoneId) {
  for (const L of LV.links)
    if (L.lockedBy === zoneId) {
      L.open = false;
      if (L.type === 'stones')
        L.stones.forEach(S => {
          S.up = 0;
          S.g.position.y = -9;
        });
      else if (!L.barrier) {
        const br = buildBarrier(L.w);
        br.position.set(L.A.x + L.ux * 1.4, 0, L.A.z + L.uz * 1.4);
        br.rotation.y = Math.atan2(L.ux, L.uz);
        LV.root.add(br);
        L.barrier = br;
      }
    }
}
function enterZone(i) {
  const Z = CH.zones[i],
    st = LV.zoneState[Z.id];
  LV.idx = Math.max(LV.idx, i);
  st.state = 'active';
  LV.active = Z.id;
  STY.zoneBest = STY.rank;
  checkpointAt(i);
  const I = LV.islands[Z.island];
  if (!st.named) {
    banner(I.name, Z.boss ? EDEF[bossType(Z)].name + ' stirs...' : '', 160);
    st.named = true;
  }
  setObjective(Z.objective);
  const go = () => {
    if (Z.giveWeapon && UNLOCKS.weapons.indexOf(Z.giveWeapon) < 0) unlockWeapon(Z.giveWeapon);
    const spawned = spawnZoneEnemies(Z);
    if (Z.boss) {
      Music.setMood(2);
    } else if (spawned) Music.setMood(1);
    if (!spawned && !Z.boss) clearZone(Z);
  };
  if (Z.enter && !st.seen) {
    st.seen = true;
    talk(Z.enter, go);
  } else go();
}
function bossType(Z) {
  return Z.boss === true ? 'boss' : Z.boss;
}
function spawnZoneEnemies(Z) {
  const I = LV.islands[Z.island];
  let n = 0;
  if (Z.boss) {
    const bp = Z.bossAt || [I.x, I.z + 4],
      b = spawnEnemy(bossType(Z), bp[0], bp[1]);
    b.face = Math.atan2(P.x - bp[0], P.z - bp[1]);
    b.zone = Z.id;
    b.home = I;
    n++;
    G.shake = 0.8;
    sfx('slam');
  }
  for (const [type, count, flag] of Z.enemies)
    for (let k = 0; k < count; k++) {
      let x,
        z,
        t = 0;
      do {
        const a = rnd(TAU),
          r = rnd(0.25, 0.75) * I.r;
        x = I.x + Math.cos(a) * r;
        z = I.z + Math.sin(a) * r;
        t++;
      } while (Math.hypot(x - P.x, z - P.z) < 5 && t < 20);
      const e = spawnEnemy(type, x, z, { elite: flag === 'elite' });
      e.zone = Z.id;
      e.home = I;
      n++;
    }
  return n;
}
function zonePickups(Z) {
  return LV.pickups.filter(p => p.zone === Z.id);
}
function clearZone(Z) {
  const st = LV.zoneState[Z.id];
  if (st.state === 'cleared') return;
  st.state = 'cleared';
  if (LV.active === Z.id) LV.active = null;
  Music.setMood(0);
  if (Z.enemies.length || Z.boss) {
    P.hp = Math.min(TUNE.maxHp, P.hp + TUNE.healOnClear);
    const r = SR[STY.zoneBest];
    if (Z.enemies.length)
      banner('Zone cleared', '+' + TUNE.healOnClear + ' HP · Style ' + r[0] + ' (' + r[1] + ')', 130);
  }
  if (Z.boss && LV.cage) {
    bossEnding();
    return;
  }
  const after = () => {
    const left = zonePickups(Z).filter(p => !p.taken);
    if (left.length) {
      left.forEach(p => {
        p.g.visible = true;
        burst(sparks, p.x, 1, p.z, 20, 4, 0.6, 0xfff1a8, 0.4);
      });
      setObjective(pickupObjective(Z));
      save();
    } else finishZone(Z);
  };
  if (Z.clear) talk(Z.clear, after);
  else after();
}
function pickupObjective(Z) {
  const all = zonePickups(Z),
    got = all.filter(p => p.taken).length;
  if (Z.collect) return Z.collect + ' (' + got + '/' + all.length + ')';
  return Z.objective2 || 'Pick up what is shining';
}
// everything in the zone is done: open the way on, or end the chapter
function finishZone(Z) {
  const st = LV.zoneState[Z.id];
  if (Z.done && !st.doneSeen) {
    // optional `done` dialogue once everything in the zone is finished
    st.doneSeen = true;
    talk(Z.done, () => finishZone(Z));
    return;
  }
  unlockLinks(Z.id);
  save();
  if (Z.finale) {
    setObjective('');
    finale();
    return;
  }
  setObjective(Z.afterObjective || (Z.enemies.length ? nextObjective(Z) : Z.objective));
}
function nextObjective(Z) {
  const i = CH.zones.indexOf(Z),
    n = CH.zones[i + 1];
  return n ? 'Head for ' + LV.islands[n.island].name : '';
}
function updateZones(s) {
  if (G.cine) return;
  // enter the next zone when standing well inside its island
  for (let i = 0; i < CH.zones.length; i++) {
    const Z = CH.zones[i],
      st = LV.zoneState[Z.id];
    if (st.state !== 'idle') continue;
    const I = LV.islands[Z.island];
    if (P.onG && Math.hypot(P.x - I.x, P.z - I.z) < I.r - 1.6) {
      enterZone(i);
      return;
    }
  }
  // active zone cleared?
  if (LV.active) {
    const Z = zoneData(LV.active);
    if (!Z.boss && !G.enemies.some(e => e.alive && e.zone === Z.id)) clearZone(Z);
  }
  // pickups
  for (const p of LV.pickups) {
    if (!p.g.visible || p.taken) continue;
    p.spin.rotation.y += s * 0.05;
    p.spin.position.y = 1 + Math.sin(G.time * 3 + p.x) * 0.15;
    p.ring.material.opacity = 0.35 + Math.sin(G.time * 4) * 0.15;
    if (Math.hypot(P.x - p.x, P.z - p.z) < 1.4 && P.y < 2) takePickup(p);
  }
}
function takePickup(p) {
  p.taken = true;
  sfx('pickup');
  burst(sparks, p.x, 1, p.z, 30, 5, 0.7, p.item === 'wood' ? 0xffc070 : 0x7cc6f2, 0.45);
  LV.root.remove(p.g);
  const Z = zoneData(p.zone);
  if (p.item === 'weapon') unlockWeapon(p.weapon);
  if (p.item === 'wood') {
    floatText(P.x, P.y + 2.2, P.z, '+1 ' + ((CH.counter && CH.counter.name) || 'Firewood'), 'say');
    styleAdd(20);
  }
  const done = () => {
    if (zonePickups(Z).every(q => q.taken)) finishZone(Z);
    else {
      setObjective(pickupObjective(Z));
      save();
    }
  };
  if (p.talk) talk(p.talk, done);
  else done();
}
function countItems(item) {
  const all = LV.pickups.filter(p => p.item === item);
  return [all.filter(p => p.taken).length, all.length];
}
/* keep Darren inside an active fight island, off locked bridges and out of solid props */
// story chapters: an island is closed to flying until a link into it opens (storm winds push Darren back)
function islandLocked(I) {
  return !isAdventure() && DATA.flight.storyLimit && LV.links.some(L => L.b === I.id && !L.open);
}
function levelConstrain() {
  if (!P.onG)
    for (const id in LV.islands) {
      const I = LV.islands[id];
      if (!islandLocked(I)) continue;
      const dx = P.x - I.x,
        dz = P.z - I.z,
        d = Math.hypot(dx, dz),
        m = I.r + 2;
      if (d < m && d > 0.01) {
        P.x = I.x + (dx / d) * m;
        P.z = I.z + (dz / d) * m;
        P.vx *= -0.3;
        P.vz *= -0.3;
        if (!LV.windT || G.time - LV.windT > 2) {
          LV.windT = G.time;
          floatText(P.x, P.y + 2, P.z, 'Storm winds! Clear the way first', 'say');
          burst(puffs, P.x, P.y + 1, P.z, 10, 4, 0.6, 0xdde8ff, 1, { a: 0.6 });
        }
      }
    }
  if (LV.active) {
    const I = LV.islands[zoneData(LV.active).island],
      dx = P.x - I.x,
      dz = P.z - I.z,
      d = Math.hypot(dx, dz),
      m = I.r - 0.5;
    if (d > m && d < I.r + 6) {
      P.x = I.x + (dx / d) * m;
      P.z = I.z + (dz / d) * m;
    }
  }
  for (const L of LV.links)
    if (!L.open && L.type === 'bridge') {
      const s = segInfo(P.x, P.z, L.A, L.B);
      if (s.d < L.w / 2 + 0.6 && s.t > 0) {
        const bx = L.A.x + L.ux * 0.9,
          bz = L.A.z + L.uz * 0.9,
          along = (P.x - bx) * L.ux + (P.z - bz) * L.uz;
        if (along > 0) {
          P.x -= L.ux * along;
          P.z -= L.uz * along;
        }
      }
    }
  for (const c of LV.colliders) {
    if (c.cage && LV.cage.broken) continue;
    const dx = P.x - c.x,
      dz = P.z - c.z,
      d = Math.hypot(dx, dz),
      m = c.r + 0.35;
    if (d < m && P.y < (c.height || 3)) {
      P.x = c.x + (d > 0.001 ? dx / d : 1) * m;
      P.z = c.z + (d > 0.001 ? dz / d : 0) * m;
    }
  }
}
function levelClampEnemy(e) {
  const I = e.home;
  if (!I) return;
  const dx = e.x - I.x,
    dz = e.z - I.z,
    d = Math.hypot(dx, dz),
    m = Math.max(1, I.r - e.r - 0.4);
  if (d > m) {
    e.x = I.x + (dx / d) * m;
    e.z = I.z + (dz / d) * m;
  }
}
function levelEnemyAtEdge(e) {
  const I = e.home;
  return I ? Math.hypot(e.x - I.x, e.z - I.z) > I.r - e.r - 1 : false;
}
function playerFell() {
  P.hp -= TUNE.fallDamage;
  flash('red', 10);
  sfx('hurt');
  const p = LV.lastSafe;
  P.x = p.x;
  P.z = p.z;
  P.y = 4;
  P.vx = P.vz = 0;
  P.vy = 0;
  P.onG = false;
  P.st = 'move';
  P.inv = 60;
  cam.fx = P.x;
  cam.fz = P.z;
  if (P.hp <= 0) {
    P.hp = 0;
    P.st = 'dead';
    P.f = 0;
    G.endT = 90;
  } else floatText(P.x, 3, P.z, '-' + TUNE.fallDamage, 'hurt');
}

/* ---------- checkpoints and saving ---------- */
function checkpointAt(i) {
  const Z = CH.zones[i];
  LV.cp = i;
  LV.lastSafe = { x: Z.checkpoint[0], z: Z.checkpoint[1] };
}
function save() {
  return saveJSON(CH.saveKey, {
        cp: LV.cp,
        cleared: CH.zones.filter(z => LV.zoneState[z.id].state === 'cleared').map(z => z.id),
        taken: LV.pickups.filter(p => p.taken).map(p => p.id),
        t: G.stats.t,
      });
}
function loadSave(ch) {
  try {
    const chapter = ch || CH;
    const value = JSON.parse(localStorage.getItem(chapter.saveKey) || 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return {
      ...value,
      cp: Number.isInteger(value.cp) ? clamp(value.cp, 0, chapter.zones.length - 1) : 0,
      cleared: Array.isArray(value.cleared) ? value.cleared.filter(id => chapter.zones.some(z => z.id === id)) : [],
      taken: Array.isArray(value.taken) ? value.taken.filter(id => typeof id === 'string') : [],
      t: typeof value.t === 'number' && Number.isFinite(value.t) ? Math.max(0, value.t) : 0,
    };
  } catch (_) {
    return null;
  }
}
function clearSave() {
  try {
    const previous = localStorage.getItem(CH.saveKey);
    if (previous !== null && !localStorage.getItem(CH.saveKey + '.recovery')) {
      try { localStorage.setItem(CH.saveKey + '.recovery', previous); } catch (_) {}
    }
    localStorage.removeItem(CH.saveKey);
  } catch (_) {}
}
/* ---------- dialogue ---------- */
const TALK = { q: [], i: 0, shown: 0, done: null, line: null };
function talk(id, done) {
  const lines = CH.story[id];
  if (!lines || !lines.length) {
    done && done();
    return;
  }
  TALK.q = lines;
  TALK.i = 0;
  TALK.done = done;
  G.cine = true;
  P.buf = null;
  In.q.length = 0;
  if (P.st !== 'dead') {
    P.st = 'move';
    P.atk = null;
    P.spin = P.flip = 0;
  }
  $('talk').hidden = false;
  showLine();
}
function showLine() {
  const [who, text] = TALK.q[TALK.i],
    S = DATA.speakers[who] || DATA.speakers.narrator;
  TALK.line = text;
  TALK.shown = 0;
  TALK.who = who;
  $('talkN').textContent = S.name;
  $('talkN').style.color = S.color;
  $('talkN').hidden = !S.name;
  $('talk').classList.toggle('narr', who === 'narrator');
  $('talkT').textContent = '';
  if (who === 'ruffy') sfx('pop');
}
function advanceTalk() {
  if (!G.cine || !TALK.line) return;
  if (TALK.shown < TALK.line.length) {
    TALK.shown = TALK.line.length;
    $('talkT').textContent = TALK.line;
    return;
  }
  TALK.i++;
  if (TALK.i < TALK.q.length) {
    showLine();
    return;
  }
  $('talk').hidden = true;
  TALK.line = null;
  G.cine = false;
  In.q.length = 0;
  P.buf = null;
  const d = TALK.done;
  TALK.done = null;
  d && d();
}
function updateTalk(rdt) {
  if (!TALK.line || TALK.shown >= TALK.line.length) {
    $('talkMore').classList.toggle('on', !!TALK.line);
    return;
  }
  TALK.shown = Math.min(TALK.line.length, TALK.shown + rdt * 48);
  $('talkT').textContent = TALK.line.slice(0, Math.floor(TALK.shown));
  $('talkMore').classList.remove('on');
}
function talkFocus() {
  const w = TALK.who;
  if (w === 'mom' && LV.mom && LV.mom.root.visible) return LV.mom.root.position;
  if ((w === 'grumble' || w === 'knot' || w === 'titan') && G.boss) return new T.Vector3(G.boss.x, 0, G.boss.z);
  if (w === 'gear' && NPCS.gear && NPCS.gear.root.parent) return NPCS.gear.root.position;
  if (w === 'ruffy' || w === 'grumble') return LV.ruffy.root.position;
  return null;
}
// during a conversation, a tap or click anywhere on the game moves to the next line
$('game').addEventListener(
  'pointerdown',
  e => {
    if (G.cine && G.mode === 'play' && !e.target.closest('button')) advanceTalk();
  },
  true,
);
$('talk').addEventListener('pointerdown', e => e.preventDefault());

/* ---------- music: Michael's Snowday choir loop + soft battle drums ---------- */
const Music = {
  on: true,
  mood: 0,
  src: null,
  gain: null,
  buf: null,
  next: 0,
  step: 0,
  start() {
    if (!Snd.ctx || this.gain) return;
    const c = Snd.ctx;
    this.gain = c.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(Snd.out);
    this.drum = c.createGain();
    this.drum.gain.value = 0;
    this.drum.connect(Snd.out);
    const b64 = window.DARREN_MUSIC_B64;
    if (!b64) return;
    try {
      const bin = atob(b64),
        u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      c.decodeAudioData(
        u.buffer,
        buf => {
          this.buf = buf;
          this.play();
        },
        () => {},
      );
    } catch (_) {}
  },
  play() {
    const c = Snd.ctx;
    if (!this.buf || this.src) return;
    const s = c.createBufferSource();
    s.buffer = this.buf;
    s.loop = true;
    s.connect(this.gain);
    s.start();
    this.src = s;
    this.fade();
  },
  setMood(m) {
    this.mood = m;
    this.fade();
  },
  fade() {
    if (!this.gain) return;
    const t = Snd.ctx.currentTime,
      v = this.on ? DATA.music.volume * (SETTINGS.music / 70) : 0;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setTargetAtTime(v * (this.mood === 2 ? 0.7 : this.mood === 1 ? 0.85 : 1), t, 0.8);
    this.drum.gain.cancelScheduledValues(t);
    this.drum.gain.setTargetAtTime(
      this.on && DATA.music.battleDrums
        ? (this.mood === 2 ? 0.5 : this.mood === 1 ? 0.32 : 0) * (SETTINGS.music / 70)
        : 0,
      t,
      0.6,
    );
  },
  toggle() {
    this.on = !this.on;
    this.fade();
    $('musBtn').textContent = this.on ? 'Music on' : 'Music off';
  },
  tick() {
    // tiny drum sequencer, scheduled ahead on the audio clock
    if (!this.drum || !this.mood) return;
    const c = Snd.ctx,
      spb = this.mood === 2 ? 0.15 : 0.2;
    if (this.next < c.currentTime) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.25) {
      const t = this.next,
        st = this.step % 16;
      if (st === 0 || st === 8 || (this.mood === 2 && (st === 6 || st === 11))) this.hit(t, 'kick');
      if (st === 4 || st === 12) this.hit(t, 'snare');
      if (st % 2 === 0) this.hit(t, 'hat');
      this.step++;
      this.next += spb;
    }
  },
  hit(t, kind) {
    const c = Snd.ctx,
      g = c.createGain();
    g.connect(this.drum);
    if (kind === 'kick') {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.25);
    } else {
      const s = c.createBufferSource(),
        f = c.createBiquadFilter();
      s.buffer = Snd.nb;
      f.type = kind === 'hat' ? 'highpass' : 'bandpass';
      f.frequency.value = kind === 'hat' ? 7000 : 1800;
      g.gain.setValueAtTime(kind === 'hat' ? 0.12 : 0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'hat' ? 0.04 : 0.14));
      s.connect(f);
      f.connect(g);
      s.start(t);
      s.stop(t + 0.2);
    }
  },
};
$('musBtn').addEventListener('click', e => {
  e.stopPropagation();
  Music.toggle();
});
addEventListener('keydown', e => {
  if (e.code === 'KeyM') Music.toggle();
});

/* ---------- boss ending and finale ---------- */
function bossEnding() {
  setObjective('');
  G.cine = true;
  TALK.line = null;
  scheduleFlow(() => {
    const c = LV.cage;
    c.broken = true;
    c.shards.forEach(s => {
      burst(
        sparks,
        c.g.position.x + s.position.x,
        s.position.y,
        c.g.position.z + s.position.z,
        12,
        8,
        0.9,
        0x9fdcff,
        0.45,
        {
          g: 8,
        },
      );
      s.visible = false;
    });
    sfx('break');
    G.shake = 0.5;
    LV.ruffyMode = 'happy';
    LV.ruffyRun = true;
    scheduleFlow(() => talk('boss_defeated', finale), 1300);
  }, 1500);
}
function finale() {
  G.cine = true;
  fade(1, () => {
    const home = LV.islands.home;
    P.x = home.x + 0.2;
    P.z = home.z + 1.2;
    P.y = 0;
    P.vx = P.vz = 0;
    P.face = -1.9;
    P.st = 'move';
    P.heartOn = 0;
    LV.ruffy.root.position.set(home.x + 0.9, 0, home.z + 2.6);
    LV.ruffy.root.rotation.y = -2.2;
    LV.ruffy.y = 0;
    LV.ruffyRun = false;
    LV.ruffyFollow = false;
    LV.ruffyMode = 'happy';
    if (LV.woodStore) LV.woodStore.fill(1);
    clearEnemies();
    cam.fx = P.x;
    cam.fz = P.z;
    cam.yaw = -1.1;
    Music.setMood(0);
    fade(0, () => talk(CH.endingTalk || 'ending', () => scheduleFlow(endChapter, 600)));
  });
}
function fade(to, done) {
  const f = $('fade');
  f.classList.toggle('on', to > 0);
  scheduleFlow(done, 900);
}
function endChapter() {
  G.mode = 'win';
  G.cine = false;
  clearSave();
  if (UNLOCKS.done.indexOf(CH.id) < 0) UNLOCKS.done.push(CH.id);
  saveUnlocks();
  const st = G.stats,
    m = Math.floor(st.t / 60),
    sc = Math.floor(st.t % 60);
  $('mSub').textContent = CH.ending.title;
  $('mTag').textContent = CH.ending.text + ' ' + CH.ending.next + '.';
  $('result').hidden = false;
  $('result').textContent =
    `Time ${m}:${String(sc).padStart(2, '0')} · Best combo ${st.maxCombo} · Best style ${SR[STY.best][0]} · Perfect dodges ${st.perfect} · ` +
    `${LV.cage ? 'Crystals' : 'Weak spots'} broken ${st.breaks}`;
  $('startBtn').textContent = 'Play again';
  const nx = DATA.chapters[DATA.chapters.indexOf(CH) + 1];
  $('contBtn').hidden = !nx;
  if (nx) {
    $('contBtn').textContent = 'Play ' + nx.name.split(':')[0];
    $('contBtn').dataset.next = nx.id;
  }
  $('menu').hidden = false;
  $('hud').hidden = true;
  if (window.menuShown) menuShown();
  try {
    document.exitPointerLock && document.exitPointerLock();
  } catch (_) {}
}
/* ---------- flow ---------- */
function clearEnemies() {
  clearStormHazards();
  G.enemies.forEach(e => {
    scene.remove(e.m.root);
    if(e.m.dispose)e.m.dispose();
    // Weak-spot materials animate independently per boss and cannot be shared.
    for (const part of Object.values(e.m.parts || {})) part.mat.dispose();
  });
  G.enemies.length = 0;
  G.projs.forEach(p => scene.remove(p.m));
  G.projs.length = 0;
  ringPool.forEach(r => {
    r.on = false;
    r.m.visible = false;
  });
  decalC.visible = decalS.visible = decalB.visible = false;
  clearFx();
  clearShots();
  clearGems();
  G.boss = null;
}
function resetWorld(saveData) {
  clearEnemies();
  resetPlayer();
  styleReset();
  LV.active = null;
  LV.idx = 0;
  LV.cp = 0;
  const cleared = new Set(saveData ? saveData.cleared : []),
    taken = new Set(saveData ? saveData.taken : []);
  for (const Z of CH.zones) {
    LV.zoneState[Z.id] = { state: cleared.has(Z.id) ? 'cleared' : 'idle', seen: cleared.has(Z.id), named: false };
    lockLinksFor(Z.id);
  }
  for (const p of LV.pickups) {
    p.taken = taken.has(p.id) || (p.id.endsWith(':0') && taken.has(p.zone)); // (older saves stored the zone id)
    if (!p.g.parent) LV.root.add(p.g);
    p.g.visible = cleared.has(p.zone) && !p.taken;
    if (p.taken) LV.root.remove(p.g);
  }
  for (const Z of CH.zones) if (cleared.has(Z.id) && zonePickups(Z).every(p => p.taken)) unlockLinks(Z.id);
  for (const L of LV.links)
    if (L.open && L.type === 'stones')
      (L.stones.forEach(S => {
        S.up = 1;
        S.g.position.y = 0;
      }),
        (L.rising = false));
  // cage + Ruffy back in place
  const c = LV.cage;
  if (c) {
    c.broken = false;
    c.shards.forEach(s => (s.visible = true));
  }
  placeHome();
  if (LV.woodStore) LV.woodStore.fill(0);
  const cp = saveData ? saveData.cp : 0,
    Z = CH.zones[cp];
  checkpointAt(cp);
  LV.idx = cp;
  const s0 = cp === 0 ? CH.level.start : { x: Z.checkpoint[0], z: Z.checkpoint[1], face: 0 };
  P.x = s0.x;
  P.z = s0.z;
  P.face = s0.face || 0;
  if (LV.ruffyFollow) LV.ruffy.root.position.set(P.x - 1.4, 0, P.z - 1.4);
  G.stats.t = saveData ? saveData.t || 0 : 0;
  // aim the camera along the trail
  const next = CH.zones[Math.min(cp + 1, CH.zones.length - 1)],
    NI = LV.islands[next.island];
  cam.yaw = Math.atan2(NI.x - P.x, NI.z - P.z);
  cam.fx = P.x;
  cam.fz = P.z;
  P.face = cam.yaw;
  let obj = Z.objective;
  if (cleared.has(Z.id))
    obj = zonePickups(Z).some(p => !p.taken) ? pickupObjective(Z) : Z.afterObjective || nextObjective(Z);
  setObjective(obj);
}
function startGame(cont) {
  cancelFlow();
  resetInput();
  const sv = cont ? loadSave() : null;
  if (!cont) clearSave();
  G.mode = 'play';
  G.paused = false;
  G.cine = false;
  G.stats = { t: 0, maxCombo: 0, perfect: 0, breaks: 0 };
  G.endT = 0;
  G.hitstop = 0;
  G.slow = 0;
  STY.best = 0;
  resetWorld(sv);
  applyGear();
  refreshHands();
  P.hp = TUNE.maxHp;
  P.fe = flightMax();
  if (isAdventure()) advReset();
  In.q.length = 0;
  $('menu').hidden = true;
  $('hud').hidden = false;
  $('boss').hidden = true;
  $('result').hidden = true;
  $('fade').classList.remove('on');
  if (window.closePanel) closePanel();
  if (COARSE) enableTouch();
  canvas.focus();
  Music.start();
  Music.setMood(0);
}
function faint() {
  G.mode = 'over';
  Music.setMood(0);
  try {
    document.exitPointerLock && document.exitPointerLock();
  } catch (_) {}
  $('mSub').textContent = 'Darren fainted';
  $('mTag').textContent =
    "Mom's soup will fix that. Tip: Wing Dash through an attack at the last moment to slow time, then counter. Settings has an Easy mode too.";
  $('result').hidden = true;
  $('startBtn').textContent = 'Try again from checkpoint';
  $('contBtn').hidden = true;
  $('menu').hidden = false;
  $('hud').hidden = true;
  if (window.menuShown) menuShown();
}
function retry() {
  cancelFlow();
  resetInput();
  // remove the fight that was in progress and respawn at the checkpoint
  const cpZone = CH.zones[LV.cp];
  for (const Z of CH.zones) {
    const st = LV.zoneState[Z.id];
    if (st.state === 'active') st.state = 'idle';
  }
  clearEnemies();
  const keep = { t: G.stats.t };
  resetPlayer();
  styleReset();
  LV.active = null;
  P.x = cpZone.checkpoint[0];
  P.z = cpZone.checkpoint[1];
  LV.lastSafe = { x: P.x, z: P.z };
  if (LV.ruffyFollow) {
    LV.ruffy.root.position.set(P.x - 1.4, 0, P.z - 1.4);
    LV.crumbs = [];
  }
  const NI = LV.islands[cpZone.island];
  P.face = cam.yaw = Math.atan2(NI.x - P.x, NI.z - P.z);
  cam.fx = P.x;
  cam.fz = P.z;
  G.mode = 'play';
  G.paused = false;
  G.cine = false;
  G.endT = 0;
  G.stats.t = keep.t;
  $('menu').hidden = true;
  $('hud').hidden = false;
  if (window.closePanel) closePanel();
  canvas.focus();
  Music.setMood(0);
  P.hp = TUNE.maxHp;
  P.fe = flightMax();
  refreshHands();
  if (isAdventure()) {
    advReset(true);
    return;
  }
  const st = LV.zoneState[cpZone.id];
  setObjective(
    st.state === 'cleared' && zonePickups(cpZone).some(p => !p.taken) ? pickupObjective(cpZone) : cpZone.objective,
  );
}
function togglePause() {
  if (G.mode !== 'play') return;
  resetInput();
  G.paused = !G.paused;
  if (G.paused) {
    try {
      document.exitPointerLock && document.exitPointerLock();
    } catch (_) {}
    $('mSub').textContent = 'Paused';
    $('mTag').textContent = $('objT').textContent || CH.name;
    $('result').hidden = true;
    $('startBtn').textContent = 'Resume';
    $('contBtn').hidden = true;
    $('menu').hidden = false;
    $('hud').hidden = true;
    if (window.menuShown) menuShown();
  } else {
    $('menu').hidden = true;
    $('hud').hidden = false;
    if (window.closePanel) closePanel();
    canvas.focus();
    last = performance.now();
  }
}
function showTitle() {
  const sv = loadSave();
  G.mode = 'title';
  $('mSub').textContent = DATA.meta.subtitle;
  $('mChap').textContent = CH.name;
  $('mTag').textContent = CH.tagline;
  $('result').hidden = true;
  $('startBtn').textContent = isAdventure() ? 'Enter Cloud Utopia' : sv ? 'New game' : 'Start ' + CH.name.split(':')[0];
  $('contBtn').hidden = !sv || isAdventure();
  delete $('contBtn').dataset.next;
  if (sv && !isAdventure()) $('contBtn').textContent = 'Continue from ' + LV.islands[CH.zones[sv.cp].island].name;
  if (window.menuShown) menuShown();
}
/* pause menu: back to the title screen (progress, parts and gear are kept) */
function quitToTitle() {
  cancelFlow();
  resetInput();
  if (G.mode === 'play' && !isAdventure()) save();
  G.paused = false;
  G.cine = false;
  TALK.line = null;
  $('talk').hidden = true;
  clearEnemies();
  resetPlayer();
  setObjective('');
  P.x = CH.level.start.x;
  P.z = CH.level.start.z;
  P.y = 0;
  placeHome();
  Music.setMood(0);
  $('hud').hidden = true;
  if (window.closePanel) closePanel();
  showTitle();
}
$('quitBtn').addEventListener('click', quitToTitle);
$('startBtn').addEventListener('click', () => {
  Snd.init();
  if (G.mode === 'play' && G.paused) togglePause();
  else if (G.mode === 'over') retry();
  else startGame(false);
});
$('contBtn').addEventListener('click', () => {
  Snd.init();
  const nx = $('contBtn').dataset.next;
  if (nx) {
    // "Play Chapter 2" on the end card
    delete $('contBtn').dataset.next;
    loadChapter(nx);
    startGame(false);
    return;
  }
  startGame(true);
});
$('pauseBtn').addEventListener('click', togglePause);

/* ---------- HUD ---------- */
const EBARS = [];
for (let i = 0; i < 12; i++) {
  const d = document.createElement('div');
  d.className = 'eb';
  d.innerHTML = '<span></span><div class="bar sm"><i></i></div>';
  $('ebars').appendChild(d);
  EBARS.push({ d, n: d.firstChild, f: d.querySelector('i'), name: '' });
}
function updateHud() {
  $('hpF').style.transform = `scaleX(${P.hp / TUNE.maxHp})`;
  $('stF').style.transform = `scaleX(${P.stam / 100})`;
  $('dhF').style.transform = `scaleX(${P.heart / 100})`;
  $('dhB').classList.toggle('ready', P.heart >= 100 && P.heartOn <= 0);
  $('flF').style.transform = `scaleX(${clamp(P.fe === undefined ? 1 : P.fe / flightMax(), 0, 1)})`;
  $('flB').classList.toggle('on', !!P.fly);
  // contract tracker (Cloud Utopia) and the "press E" prompt
  if (window.advHud) advHud();
  else $('ctr').hidden = true;
  const c = $('combo');
  c.classList.toggle('on', P.combo > 1);
  if (P.combo > 1) $('comboN').textContent = P.combo;
  // style rank
  const sy = $('style'),
    on = STY.pts > 1 && !G.cine;
  sy.classList.toggle('on', on);
  if (on) {
    if (STY.shown !== STY.rank) {
      STY.shown = STY.rank;
      $('styR').textContent = SR[STY.rank][0];
      $('styN').textContent = SR[STY.rank][1];
      sy.dataset.r = SR[STY.rank][0];
    }
    const lo = SR[STY.rank][2],
      hi = STY.rank < SR.length - 1 ? SR[STY.rank + 1][2] : DATA.style.max;
    $('styF').style.transform = `scaleX(${clamp((STY.pts - lo) / (hi - lo), 0, 1)})`;
  }
  const c1 = P.cd1 / DATA.skills.blazeWheelCooldown,
    c2 = P.cd2 / DATA.skills.flameBreathCooldown;
  $('cd1').style.transform = `scaleX(${c1})`;
  $('cd2').style.transform = `scaleX(${c2})`;
  $('tcd1').style.transform = `scaleY(${c1})`;
  $('tcd2').style.transform = `scaleY(${c2})`;
  const b = G.boss;
  $('boss').hidden = !(b && b.alive) || G.cine;
  if (b && b.alive) {
    $('bossF').style.transform = `scaleX(${Math.max(0, b.hp / b.max)})`;
    const p = b.m.parts;
    $('cry').textContent = b.cfg.parts + ' ' + ['armL', 'armR', 'back'].map(k => (p[k].alive ? '◆' : '◇')).join(' ');
  }
  const t = G.tgt;
  if (G.tgtT > 0) G.tgtT--;
  const show = t && t.alive && G.tgtT > 0 && !(b && b.alive);
  $('tgt').hidden = !show;
  if (show) {
    $('tgtN').textContent = (t.elite ? 'Elite ' : '') + t.d.name;
    $('tgtF').style.transform = `scaleX(${Math.max(0, t.hp / t.max)})`;
  }
  // health bars over enemies' heads
  let n = 0;
  if (!G.cine)
    for (const e of G.enemies) {
      if (n >= EBARS.length) break;
      if (!e.alive || e.d.boss || e.under || e.st === 'spawn' || !(e.shown > 0 || e.elite || P.lock === e)) continue;
      V1.set(e.x, e.y + e.h + 0.45, e.z).project(camera);
      if (V1.z > 1 || Math.abs(V1.x) > 1.1 || Math.abs(V1.y) > 1.1) continue;
      const q = EBARS[n++],
        nm = e.elite ? 'Elite ' + e.d.name : '';
      q.d.style.display = '';
      q.d.style.left = (V1.x * 0.5 + 0.5) * 100 + '%';
      q.d.style.top = (-V1.y * 0.5 + 0.5) * 100 + '%';
      q.f.style.transform = `scaleX(${Math.max(0, e.hp / e.max)})`;
      if (q.name !== nm) {
        q.name = nm;
        q.n.textContent = nm;
        q.d.classList.toggle('el', !!e.elite);
      }
    }
  for (let i = n; i < EBARS.length; i++) EBARS[i].d.style.display = 'none';
  // collected items (Chapter 2 firewood)
  if (CH.counter) {
    const [got, all] = countItems(CH.counter.item);
    $('cnt').hidden = G.cine;
    $('cntT').textContent = $('objC').textContent = CH.counter.name + ' ' + got + ' / ' + all;
  } else {
    $('cnt').hidden = true;
    $('objC').textContent = '';
  }
  if (banT > 0) {
    banT--;
    if (banT <= 0) $('banner').classList.remove('on');
  }
  if (flashT > 0) {
    flashT--;
    if (flashT <= 0) $('flash').className = '';
  }
  const lk = P.lock && P.lock.alive;
  lockMark.visible = !!lk;
  if (lk && P.focus && P.lock.d.boss && P.lock.m.parts[P.focus].alive) {
    // focused weak spot
    bossPartPos(P.lock, P.focus, V1);
    lockMark.position.set(V1.x, V1.y + 1 + Math.sin(G.time * 6) * 0.12, V1.z);
    lockMark.rotation.y = G.time * 6;
  } else if (lk) {
    lockMark.position.set(P.lock.x, P.lock.y + P.lock.h + 0.7 + Math.sin(G.time * 6) * 0.12, P.lock.z);
    lockMark.rotation.y = G.time * 3;
  }
  $('hud').classList.toggle('cine', !!G.cine);
}
/* ---------- camera ---------- */
const cam = { yaw: 0, pitch: 0.3, dist: 5.2, fx: 0, fy: 1.2, fz: 0 };
function updateCamera(rdt) {
  let fx, fy, fz;
  if (G.mode !== 'play') {
    cam.yaw += rdt * 0.22;
    cam.pitch = damp(cam.pitch, 0.2, 3, rdt);
    cam.dist = damp(cam.dist, camera.aspect < 1 ? 6.4 : 5.2, 3, rdt);
  } else if (G.cine) {
    const f = talkFocus(),
      wantD = (G.boss && G.boss.alive ? 9 : 5.6) * (camera.aspect < 1 ? 1.25 : 1);
    cam.dist = damp(cam.dist, wantD, 2, rdt);
    cam.pitch = damp(cam.pitch, 0.22, 2, rdt);
    if (f) {
      const a = Math.atan2(f.x - P.x, f.z - P.z) + 0.9;
      cam.yaw += angDiff(cam.yaw, a) * Math.min(1, 1.5 * rdt);
    }
  } else {
    const manual = Math.abs(In.cdx) + Math.abs(In.cdy) > 0 || Math.abs(pad.cx) + Math.abs(pad.cy) > 0;
    const sens = SETTINGS.sens,
      inv = SETTINGS.invertY ? -1 : 1;
    cam.yaw -= (In.cdx * 0.0027 + pad.cx * 2.8 * rdt) * sens;
    cam.pitch = clamp(cam.pitch + (In.cdy * 0.0022 + pad.cy * 1.8 * rdt) * sens * inv, -0.12, 1.15);
    In.camIdle = manual ? 0 : In.camIdle + rdt;
    if (P.lock && P.lock.alive)
      cam.yaw += angDiff(cam.yaw, Math.atan2(P.lock.x - P.x, P.lock.z - P.z)) * Math.min(1, 5 * rdt);
    else if (In.camIdle > 1.2 && Math.hypot(P.vx, P.vz) > 2) {
      const d = angDiff(cam.yaw, Math.atan2(P.vx, P.vz));
      if (Math.abs(d) < 2.5) cam.yaw += d * Math.min(1, 0.9 * rdt);
    }
    const want = (G.boss && G.boss.alive ? 9.5 * (G.boss.d.sc || 1) : P.fly ? 8 : 6.6) * (camera.aspect < 1 ? 1.2 : 1);
    cam.dist = damp(cam.dist, want, 3, rdt);
    // finisher camera punch
    if (G.punch > 0) {
      cam.dist = damp(cam.dist, want - 1.6 * G.punch, 22, rdt);
      G.punch = Math.max(0, G.punch - rdt * 3.5);
    }
    if (!manual && !P.lock) cam.pitch = damp(cam.pitch, G.boss && G.boss.alive ? 0.3 : 0.34, 0.4, rdt);
  }
  In.cdx = In.cdy = 0;
  cam.fx = damp(cam.fx, P.x, 12, rdt);
  cam.fz = damp(cam.fz, P.z, 12, rdt);
  cam.fy = damp(cam.fy, Math.max(-3, P.y) * 0.75 + 1.25, 8, rdt);
  fx = cam.fx;
  fy = cam.fy;
  fz = cam.fz;
  if (G.mode === 'play' && G.cine) {
    const f = talkFocus();
    if (f) {
      fx = lerp(fx, f.x, 0.4);
      fz = lerp(fz, f.z, 0.4);
    }
  } else if (G.boss && G.boss.alive && G.mode === 'play') {
    fx = lerp(fx, G.boss.x, 0.18);
    fz = lerp(fz, G.boss.z, 0.18);
    fy += 0.8;
  }
  const cp = Math.cos(cam.pitch),
    sx = Math.sin(cam.yaw),
    cz = Math.cos(cam.yaw);
  const menuOff = G.mode !== 'play' && camera.aspect > 1.1 ? 1.5 : 0;
  camera.position.set(
    fx - sx * cam.dist * cp + cz * menuOff,
    Math.max(fy - 1.5 + 0.5, fy + Math.sin(cam.pitch) * cam.dist),
    fz - cz * cam.dist * cp - sx * menuOff,
  );
  // Pull in before stone pillars, harvest crystals and large enemy bodies. Height keeps flight
  // above them clear, without raycasting the entire animated scene each frame.
  if (G.mode === 'play') constrainCamera(fx, fy + 0.25, fz);
  G.shake = Math.max(0, G.shake - rdt * 1.8);
  // field-of-view kick on big hits
  const baseFov = camera.aspect < 1 ? 74 : 62;
  G.fovKick = Math.max(0, G.fovKick - rdt * 40);
  if (Math.abs(camera.fov - baseFov - G.fovKick) > 0.01) {
    camera.fov = baseFov + G.fovKick;
    camera.updateProjectionMatrix();
  }
  const sh = G.shake * G.shake * 0.9 * (SETTINGS.shake/100);
  camera.position.x += rnd(-sh, sh);
  camera.position.y += rnd(-sh, sh);
  camera.lookAt(fx + cz * menuOff, fy + 0.25, fz - sx * menuOff);
}

function constrainCamera(x, y, z) {
  const dx = camera.position.x - x, dy = camera.position.y - y, dz = camera.position.z - z;
  const a = dx * dx + dz * dz;
  if (a < 0.0001) return;
  let limit = 1;
  const clip = (cx, cz, radius, bottom, height, cutaway) => {
    const ox = x - cx, oz = z - cz, r = radius + 0.22;
    const b = 2 * (ox * dx + oz * dz), cc = ox * ox + oz * oz - r * r;
    const disc = b * b - 4 * a * cc;
    if (cutaway && cc <= 0 && y >= bottom - 0.2 && y <= bottom + height + 0.2) {
      cutaway.visible = false;
      return;
    }
    if (disc < 0 || cc <= 0) return;
    const t = (-b - Math.sqrt(disc)) / (2 * a), h = y + dy * t;
    if (t > 0 && t < limit && h >= bottom - 0.2 && h <= bottom + height + 0.2) {
      // A crystal immediately behind Darren cannot safely pull the camera into his face.
      // Temporarily cut away that foreground model, like the existing tree cutaway.
      if (cutaway && t * Math.hypot(dx, dy, dz) < 2.4) cutaway.visible = false;
      else limit = Math.max(0.05, t - 0.025);
    }
  };
  for (const c of LV.colliders) if (c.camera) clip(c.x, c.z, c.r, 0, c.height);
  for (const e of G.enemies) {
    if (e.d.static) e.m.b.visible = true;
    if (e.alive && (e.d.static || e.h > 2.5))
      clip(e.x, e.z, e.r * 1.15, e.y, Math.max(e.h, (e.d.cameraHeight || 0) * e.sc), e.d.static ? e.m.b : null);
  }
  if (limit < 1) camera.position.set(x + dx * limit, y + dy * limit, z + dz * limit);
}

/* ---------- per-frame world animation ---------- */
function updateWorld(rdt, dt) {
  const t = G.time;
  animMom(LV.mom, t, G.cine && TALK.who === 'mom', rdt);
  updateRuffy(rdt, t);
  for (const L of LV.links)
    if (L.rising) {
      let done = true;
      L.stones.forEach((S, i) => {
        S.up = Math.min(1, S.up + rdt * (0.7 - i * 0.1));
        S.g.position.y = -9 * (1 - smooth(S.up));
        if (S.up < 1) done = false;
      });
      if (done) L.rising = false;
    }
  for (const pw of LV.paws) pw.m.visible = !pw.link || (pw.link.open && pw.link.stones.every(S => S.up > 0.95));
  if (Math.random() < rdt * 3 && LV.chimney)
    puffs.emit(
      LV.chimney.x + rnd(-0.2, 0.2),
      LV.chimney.y,
      LV.chimney.z,
      rnd(-0.2, 0.2),
      1.2,
      rnd(-0.2, 0.2),
      2.5,
      TC.set(0xeeeeee),
      1.2,
      -0.1,
      0.3,
      0.5,
    );
  if (LV.cage && !LV.cage.broken)
    LV.cage.shards.forEach((s, i) => {
      s.material.emissiveIntensity = 0.5 + Math.sin(t * 2 + i) * 0.2;
    });
  if (CH.snowfall) updateSnow(rdt);
  // trees right next to the camera, between it and Darren, are hidden so they never block the view
  const cx = camera.position.x,
    cz = camera.position.z,
    pd = Math.hypot(P.x - cx, P.z - cz);
  for (const d of LV.decos) {
    const dc = Math.hypot(d.x - cx, d.z - cz);
    d.o.visible = !(dc < 3.4 && Math.hypot(d.x - P.x, d.z - P.z) < pd + 1);
  }
}
/* gentle snowfall around Darren (chapters with snowfall: true) */
const snowP = makeParticles(COARSE ? 200 : 420, false);
function updateSnow(rdt) {
  const n = rdt * (COARSE ? 30 : 60) + Math.random();
  TC.set(0xffffff);
  for (let i = 0; i < n - 1; i++) {
    const x = P.x + rnd(-16, 16),
      z = P.z + rnd(-16, 16);
    if (Math.hypot(x - camera.position.x, z - camera.position.z) < 5) continue;
    snowP.emit(x, rnd(6, 12), z, rnd(-0.4, 0.4), -1.3, rnd(-0.4, 0.4), 6, TC, 0.1, 0, 0, 0.9);
  }
}
/* Ruffy: sad in his cage, running to Darren after the rescue, or trotting along behind him (Chapter 2) */
function updateRuffy(rdt, t) {
  const R = LV.ruffy,
    rp = R.root.position;
  if (LV.ruffyRun) {
    // run to Darren after the cage breaks
    const dx = P.x - rp.x,
      dz = P.z - rp.z,
      d = Math.hypot(dx, dz);
    if (d > 1.4) {
      const sp = Math.min(6, d * 2);
      rp.x += (dx / d) * sp * rdt;
      rp.z += (dz / d) * sp * rdt;
      R.root.rotation.y = Math.atan2(dx, dz);
      animRuffy(R, t, 'happy', sp, rdt);
    } else animRuffy(R, t, 'happy', 0, rdt);
    return;
  }
  if (!LV.ruffyFollow || G.mode !== 'play') {
    animRuffy(R, t, LV.ruffyMode, 0, rdt);
    return;
  }
  // breadcrumbs: Ruffy follows the exact path Darren walked, so he never runs off an edge
  const cr = LV.crumbs,
    lastC = cr[cr.length - 1];
  if (P.onG && P.st !== 'dead' && (!lastC || Math.hypot(P.x - lastC[0], P.z - lastC[1]) > 0.7)) {
    cr.push([P.x, P.z]);
    if (cr.length > 80) cr.shift();
  }
  const dP = Math.hypot(P.x - rp.x, P.z - rp.z);
  if (dP > 26 && cr.length > 4) {
    // too far behind (Darren fell or used a checkpoint): catch up
    const c = cr[cr.length - 4];
    rp.set(c[0], 0, c[1]);
    cr.splice(0, cr.length - 4);
  }
  let mode = 'happy',
    sp = 0,
    goal = null;
  // sniff out shining pickups nearby when no fight is on
  const pk =
    !LV.active && !G.cine && LV.pickups.find(p => p.g.visible && !p.taken && Math.hypot(p.x - P.x, p.z - P.z) < 14);
  if (pk && islandAt(pk.x, pk.z) === islandAt(rp.x, rp.z)) {
    goal = [pk.x + 0.9, pk.z + 0.9];
    if (Math.hypot(goal[0] - rp.x, goal[1] - rp.z) < 0.6) {
      mode = 'bark';
      R.root.rotation.y += angDiff(R.root.rotation.y, Math.atan2(P.x - rp.x, P.z - rp.z)) * Math.min(1, rdt * 6);
      LV.barkT = (LV.barkT || 0) - rdt;
      if (LV.barkT <= 0) {
        LV.barkT = 2.2;
        sfx('bark');
        floatText(rp.x, 1.3, rp.z, 'Arf!', 'say');
      }
    }
  } else {
    // close by: trot beside Darren (not behind him, where he would block the camera); further away: follow his path
    const keep = LV.active ? 4.5 : 2.2;
    while (cr.length > 1 && Math.hypot(cr[0][0] - rp.x, cr[0][1] - rp.z) < 0.5) cr.shift();
    if (dP > keep && cr.length) goal = cr[0];
    if (!LV.active && dP < 7) {
      const rx = -Math.cos(cam.yaw),
        rz = Math.sin(cam.yaw),
        side = (rp.x - P.x) * rx + (rp.z - P.z) * rz >= 0 ? 1 : -1,
        sx = P.x + rx * side * 1.7 + Math.sin(cam.yaw) * 0.4,
        sz = P.z + rz * side * 1.7 + Math.cos(cam.yaw) * 0.4;
      if (groundAt(sx, sz)) goal = Math.hypot(sx - rp.x, sz - rp.z) > 0.35 ? [sx, sz] : null;
    }
    if (LV.active && dP < 3) {
      // fights: keep clear of Darren's sword
      goal = [rp.x - (P.x - rp.x), rp.z - (P.z - rp.z)];
      if (!groundAt(goal[0], goal[1])) goal = null;
    }
  }
  if (goal) {
    const dx = goal[0] - rp.x,
      dz = goal[1] - rp.z,
      d = Math.hypot(dx, dz);
    if (d > 0.05) {
      sp = Math.min(dP > 6 ? 9 : 7.2, d * 6);
      rp.x += (dx / d) * Math.min(d, sp * rdt);
      rp.z += (dz / d) * Math.min(d, sp * rdt);
      R.root.rotation.y += angDiff(R.root.rotation.y, Math.atan2(dx, dz)) * Math.min(1, rdt * 10);
    }
  } else if (mode !== 'bark') {
    R.root.rotation.y += angDiff(R.root.rotation.y, Math.atan2(P.x - rp.x, P.z - rp.z)) * Math.min(1, rdt * 3);
    mode = Math.hypot(P.vx, P.vz) < 0.5 && dP < 4 ? 'sit' : 'happy';
  }
  // little hop over gaps between stones
  const hop = groundAt(rp.x, rp.z) ? 0 : 0.9;
  R.y = damp(R.y || 0, hop, 14, rdt);
  rp.y = R.y;
  animRuffy(R, t, sp > 0.5 ? 'run' : mode, sp, rdt);
}
/* ---------- main loop ---------- */
const world = buildSky();
// Mom and Ruffy are built once; each chapter places them
LV.mom = buildMom();
scene.add(LV.mom.root);
LV.ruffy = buildRuffy();
scene.add(LV.ruffy.root);
P.m = buildDarren();
scene.add(P.m.root);
resetPlayer();
resize();
loadChapter(loadJSON(DATA.meta.unlockKey).lastChapter || DATA.chapters[0].id);
equipWeapon(UNLOCKS.weapon);
loadDarrenGLB();
showTitle();
let last = performance.now(),
  slowAcc = 0,
  slowN = 0,
  demoT = 120,
  demoI = 0,
  safeT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const rdt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  if (!window.__manual && !window.__skybladeBoot?.pending) tick(rdt);
  else renderer.render(scene, camera);
}
function tick(rdt) {
  pollPad();
  readMove();
  if (G.paused) {
    In.q.length = 0;
    renderer.render(scene, camera);
    return;
  }
  updateFlow(rdt);
  let scale = 1;
  if (G.hitstop > 0) {
    G.hitstop -= rdt;
    scale = 0;
  } else if (G.slow > 0) {
    G.slow -= rdt * 60;
    scale = 0.3;
  }
  const dt = rdt * scale,
    s = dt * 60;
  G.time += dt;
  if (G.mode === 'play') {
    if (!G.cine) G.stats.t += rdt;
    if (G.cine) {
      for (const a of In.q) if (a === 'light' || a === 'jump' || a === 'heavy' || a === 'dash') advanceTalk();
      In.q.length = 0;
    } else {
      for (const a of In.q) P.buf = { a, t: 0 };
      In.q.length = 0;
    }
    if (P.buf && !G.cine) {
      if (tryAction(P.buf.a)) P.buf = null;
      else if ((P.buf.t += rdt * 60) > 10) P.buf = null;
    }
    if (s > 0) {
      updatePlayer(s);
      if (P.y < -14 && P.st !== 'dead') playerFell();
      if (P.onG && !G.cine) {
        safeT += rdt;
        if (safeT > 0.4) {
          safeT = 0;
          const I = islandAt(P.x, P.z);
          if (I && Math.hypot(P.x - I.x, P.z - I.z) < I.r - 2) LV.lastSafe = { x: P.x, z: P.z };
        }
      }
      if (!G.cine) {
        styleUpdate(dt);
        for (const e of G.enemies) updateEnemy(e, s);
        updateWaves(s);
        updateShots(s);
        updateGems(dt);
        if (isAdventure()) advUpdate(s, dt);
        for (let i = G.enemies.length - 1; i >= 0; i--) if (G.enemies[i].gone) G.enemies.splice(i, 1);
        updateProjs(s);
        updateStormglass(dt);
      } else for (const e of G.enemies) if (e.d.boss && !e.alive) updateEnemy(e, s);
      for (const r of ringPool) {
        if (!r.on) continue;
        if (G.cine && r.dmg) continue;
        r.life -= dt;
        r.r += r.vr * dt;
        r.m.scale.setScalar(r.r);
        r.m.material.opacity = Math.max(0, r.life / r.max) * 0.9;
        if (r.dmg && !r.hit && Math.abs(Math.hypot(P.x - r.x, P.z - r.z) - r.r) < 0.75 && P.y < 0.75) {
          r.hit = damagePlayer(r.dmg, r.x, r.z, false) || P.st === 'dash';
        }
        if (r.life <= 0) {
          r.on = false;
          r.m.visible = false;
        }
      }
      updateZones(s);
      if (G.endT > 0) {
        G.endT -= s;
        if (G.endT <= 0) faint();
      }
    }
    updateTalk(rdt);
  } else {
    In.q.length = 0;
    demoT -= s;
    if (demoT <= 0 && P.st === 'move') {
      const seq = ['L1', 'L2', 'L3', 'LA', 'L1', 'L2', 'L3', 'L4'];
      startAttack(seq[demoI++ % seq.length]);
      demoT = demoI % 4 === 0 ? 150 : 14;
    }
    if (G.mode === 'title') {
      updatePlayer(s);
      P.vx = P.vz = 0;
      P.x = damp(P.x, CH.level.start.x, 4, rdt);
      P.z = damp(P.z, CH.level.start.z, 4, rdt);
    }
    for (const r of ringPool) {
      if (!r.on) continue;
      r.life -= dt;
      r.r += r.vr * dt;
      r.m.scale.setScalar(r.r);
      r.m.material.opacity = Math.max(0, r.life / r.max) * 0.9;
      if (r.life <= 0) {
        r.on = false;
        r.m.visible = false;
      }
    }
  }
  if (Snd.ctx) Music.tick();
  updateWorld(rdt, dt);
  updatePolish(dt);
  animDarren(dt, rdt);
  updateFx(dt);
  snowP.update(rdt);
  sparks.update(dt);
  puffs.update(dt);
  updateCamera(rdt);
  const us = renderer.domElement.height / (2 * Math.tan((camera.fov * PI) / 360));
  sparks.mat.uniforms.uScale.value = puffs.mat.uniforms.uScale.value = snowP.mat.uniforms.uScale.value = us;
  world.sun.position.set(P.x + 12, 24, P.z + 9);
  world.sun.target.position.set(P.x, 0, P.z);
  for (const c of world.clouds) {
    c.position.x += rdt * 0.6;
    if (c.position.x > 240 + (c.userData.dx || 0)) c.position.x -= 480;
  }
  if (G.mode === 'play') updateHud();
  if (!window.__manual) renderer.render(scene, camera);
  slowAcc += rdt;
  slowN++;
  if (slowN >= 90) {
    const avg = slowAcc / slowN;
    slowAcc = slowN = 0;
    if (avg > 0.03 && (SETTINGS.graphics||'auto')==='auto') {
      if (pixelRatio > 1) {
        pixelRatio = Math.max(1, pixelRatio - 0.5);
        resize();
      } else if (renderer.shadowMap.enabled) {
        renderer.shadowMap.enabled = false;
        world.sun.castShadow = false;
      }
    }
  }
}
window.__startAttack = n => startAttack(n);
window.__game = {
  Music,
  G,
  P,
  In,
  LV,
  cam,
  press,
  release,
  startGame,
  retry,
  spawnEnemy,
  ATK,
  tick,
  keys,
  advanceTalk,
  TALK,
  groundAt,
  DATA,
  get CH() {
    return CH;
  },
  loadChapter,
  STY,
  equipWeapon,
  unlockWeapon,
  UNLOCKS,
  SETTINGS,
  EDEF,
  takePickup,
  showTitle,
  NPCS,
  addPart,
  craft,
  setStyle,
  setLoadout,
  TUNE,
  GEAR,
  acceptContract,
  fastTravel,
  AD,
};
function boot() {
  requestAnimationFrame(frame);
}
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot);
else boot();
