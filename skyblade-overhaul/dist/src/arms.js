/* ARMS: Twin Arms style (an independent weapon in each arm: R-arm on the Slash button, L-arm on Heavy),
   Darren's own projectiles (Ember Blaster, Gale Bow, Spore Mortar), boss part focus, and flight. */

/* ---------- Twin Arms ---------- */
const SHOT_MOVE = { gun: 'GUN', bow: 'BOW', mortar: 'MORT' };
function armAction(side) {
  const id = UNLOCKS.equip[side];
  if (!id) return false;
  const W = WEAPONS[id],
    kind = W.kind || 'blade',
    btn = side === 'R' ? 'light' : 'heavy';
  if (!can(btn)) return false;
  if (!P.onG && !P.fly && P.airWhiff >= 4 && kind === 'blade') return false;
  let n;
  if (kind === 'blade') {
    const first = side === 'R' ? 'RA1' : 'LA1',
      prev = P.armSide === side && (P.st === 'attack' || P.chainT > 0) && P.last && ATK[P.last];
    n = prev && prev.next && ATK[prev.next] && !!ATK[prev.next].left === (side === 'L') ? prev.next : first;
    if (P.perfect > 0 && side === 'R') {
      P.perfect = 0;
      n = 'FF';
    }
  } else n = SHOT_MOVE[kind];
  startAttack(n, id);
  P.armSide = side;
  P.armBtn = btn;
  if (kind !== 'blade' && side === 'L') P.atk = Object.assign({}, P.atk, { pose: 'aimL', left: true });
  if (!P.onG && kind === 'blade' && !P.fly) P.airWhiff++;
  return true;
}

/* ---------- Darren's projectiles ---------- */
const SHOT_A = { hs: 1, dmg: 0, arc: 360, rng: 1 },
  SHOT_HEAVY = { hs: 5, kd: true, dmg: 0, arc: 360, rng: 2 },
  SHOT_GEO = {
    gun: new T.SphereGeometry(1, 10, 8),
    bow: new T.CylinderGeometry(0.25, 0.25, 6, 6),
    mortar: new T.SphereGeometry(1, 14, 10),
  };
SHOT_GEO.bow.rotateX(PI / 2);
const SHOT_MAT = {};
function shotMat(color) {
  return SHOT_MAT[color] || (SHOT_MAT[color] = new T.MeshBasicMaterial({ color: new T.Color(color) }));
}
// where a shot should go: the focused boss part, the locked target, or the best enemy in front
function shotTarget() {
  const t = P.lock && P.lock.alive ? P.lock : findTarget(P.face, 26, 0.55);
  if (!t) return null;
  if (t.d.boss && P.focus && t.m.parts[P.focus] && t.m.parts[P.focus].alive) {
    bossPartPos(t, P.focus, V3);
    return { e: t, x: V3.x, y: V3.y, z: V3.z };
  }
  return { e: t, x: t.x, y: t.y + t.h * (t.d.boss ? 0.45 : 0.5), z: t.z };
}
function fireShot(W, left) {
  const S = W.shot,
    fx = Math.sin(P.face),
    fz = Math.cos(P.face),
    side = left ? 1 : -1,
    sx = P.x + fx * 0.7 + Math.cos(P.face) * 0.35 * side,
    sy = P.y + 1.0,
    sz = P.z + fz * 0.7 - Math.sin(P.face) * 0.35 * side;
  const tg = shotTarget(),
    kind = W.kind;
  if (tg) P.face = Math.atan2(tg.x - P.x, tg.z - P.z);
  const dmg = S.dmg * (W.power || 1) * (1 + GEAR.power) * (P.heartOn > 0 ? 1.15 : 1);
  let vx, vy, vz;
  if (kind === 'mortar') {
    const tx = tg ? tg.x : P.x + Math.sin(P.face) * 12,
      tz = tg ? tg.z : P.z + Math.cos(P.face) * 12,
      ty = tg ? Math.max(0, tg.e.y) : 0,
      dist = Math.hypot(tx - sx, tz - sz),
      T0 = clamp(dist / S.speed, 0.45, 1.3);
    vx = (tx - sx) / T0;
    vz = (tz - sz) / T0;
    vy = (ty - sy) / T0 + 0.5 * 20 * T0;
  } else {
    let dx = Math.sin(P.face),
      dy = 0,
      dz = Math.cos(P.face);
    if (tg) {
      dx = tg.x - sx;
      dy = tg.y - sy;
      dz = tg.z - sz;
      const l = Math.hypot(dx, dy, dz) || 1;
      dx /= l;
      dy /= l;
      dz /= l;
    }
    vx = dx * S.speed;
    vy = dy * S.speed;
    vz = dz * S.speed;
  }
  const m = new T.Mesh(SHOT_GEO[kind] || SHOT_GEO.gun, shotMat(W.color));
  m.scale.setScalar(S.size);
  m.position.set(sx, sy, sz);
  scene.add(m);
  G.pshots.push({
    x: sx,
    y: sy,
    z: sz,
    vx,
    vy,
    vz,
    m,
    dmg,
    kind,
    pierce: !!S.pierce,
    splash: S.splash || 0,
    home: S.home || 0,
    tg,
    life: 2.2,
    hit: new Set(),
    color: W.color,
    chill: !!W.chill,
  });
  TC.set(new T.Color(W.color).getHex());
  for (let i = 0; i < 5; i++)
    sparks.emit(
      sx,
      sy,
      sz,
      vx * 0.08 + rnd(-1, 1),
      vy * 0.08 + rnd(-1, 1),
      vz * 0.08 + rnd(-1, 1),
      0.15,
      TC,
      0.25,
      0,
      4,
    );
  sfx('shot', kind === 'gun' ? 0 : kind === 'bow' ? 1 : 2);
}
function shotBurst(p) {
  sfx('slam');
  G.shake = Math.max(G.shake, 0.3);
  ring(p.x, 0.15, p.z, 0.4, 10, 0.3, new T.Color(p.color).getHex());
  burst(puffs, p.x, Math.max(0.3, p.y), p.z, 14, 4, 0.6, new T.Color(p.color).getHex(), 1, { a: 0.7, up: 1 });
  for (const e of G.enemies) {
    if (!e.alive || e.under) continue;
    const d = Math.hypot(e.x - p.x, e.z - p.z);
    if (d > p.splash + e.r || Math.abs(e.y - p.y) > 3) continue;
    if (e.d.boss) {
      bossShotHit(e, p.x, Math.max(1, p.y), p.z, p.dmg * 0.7, true);
      continue;
    }
    SHOT_HEAVY.dmg = p.dmg;
    const r = enemyTakeHit(e, p.dmg, SHOT_HEAVY, (e.x - p.x) / (d || 1), (e.z - p.z) / (d || 1));
    hitFx(e.x, e.y + e.h * 0.5, e.z, r, SHOT_HEAVY, r === 0);
  }
}
// a shot (or splash) hits a boss: a crystal near the hit point takes it, otherwise the body (shots do less there)
function bossShotHit(b, x, y, z, dmg, any) {
  let best = null,
    bd = any ? 3 : 1.5;
  for (const k of ['armL', 'armR', 'back']) {
    const p = b.m.parts[k];
    if (!p.alive || (k === 'back' && b.phase < 3 && b.st !== 'kneel')) continue;
    bossPartPos(b, k, V2);
    const d = Math.hypot(V2.x - x, V2.y - y, V2.z - z);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  if (best) {
    const p = b.m.parts[best];
    p.hp -= dmg;
    b.hp -= dmg * (best === 'back' ? 2 : 0.6);
    p.mat.emissiveIntensity = 1.8;
    hitFx(x, y, z, dmg, SHOT_A, false);
    if (p.hp <= 0) breakCrystal(b, best);
  } else {
    if (Math.hypot(x - b.x, z - b.z) > b.r + 0.6 || y > b.h + 1) return false;
    b.hp -= dmg * 0.5;
    hitFx(x, y, z, dmg * 0.5, SHOT_A, false);
  }
  b.flash = 3;
  if (b.hp <= 0 && b.alive) bossDie(b);
  return true;
}
function updateShots(s) {
  const dt = s / 60;
  for (let i = G.pshots.length - 1; i >= 0; i--) {
    const p = G.pshots[i];
    p.life -= dt;
    if (p.home && p.tg && p.tg.e.alive) {
      // gentle homing toward the target
      const tx = p.tg.e.d.boss ? p.tg.x : p.tg.e.x,
        ty = p.tg.e.d.boss ? p.tg.y : p.tg.e.y + p.tg.e.h * 0.5,
        tz = p.tg.e.d.boss ? p.tg.z : p.tg.e.z,
        sp = Math.hypot(p.vx, p.vy, p.vz),
        dx = tx - p.x,
        dy = ty - p.y,
        dz = tz - p.z,
        l = Math.hypot(dx, dy, dz) || 1,
        k = Math.min(1, p.home * s);
      p.vx = lerp(p.vx, (dx / l) * sp, k);
      p.vy = lerp(p.vy, (dy / l) * sp, k);
      p.vz = lerp(p.vz, (dz / l) * sp, k);
    }
    if (p.kind === 'mortar') p.vy -= 20 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.m.position.set(p.x, p.y, p.z);
    if (p.kind === 'bow') p.m.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);
    if (Math.random() < 0.6)
      sparks.emit(
        p.x,
        p.y,
        p.z,
        0,
        0,
        0,
        0.18,
        TC.set(new T.Color(p.color).getHex()),
        p.kind === 'mortar' ? 0.5 : 0.28,
        0,
        0,
      );
    let gone = p.life <= 0 || p.y < -6;
    if (p.kind === 'mortar') {
      if (p.y <= 0.25 && groundAt(p.x, p.z)) {
        shotBurst(p);
        gone = true;
      }
    }
    if (!gone)
      for (const e of G.enemies) {
        if (!e.alive || e.under || p.hit.has(e)) continue;
        if (e.d.boss) {
          if (Math.hypot(e.x - p.x, e.z - p.z) < e.r + 2.5 && bossShotHit(e, p.x, p.y, p.z, p.dmg)) {
            if (p.kind === 'mortar') shotBurst(p);
            gone = !p.pierce;
            p.hit.add(e);
          }
        } else {
          const cy = e.y + e.h * 0.5,
            d = Math.hypot(e.x - p.x, (cy - p.y) * 0.8, e.z - p.z);
          if (d > e.r + 0.35 + (p.kind === 'gun' ? 0.1 : 0.2)) continue;
          p.hit.add(e);
          if (p.kind === 'mortar') {
            shotBurst(p);
            gone = true;
            break;
          }
          const n = Math.hypot(p.vx, p.vz) || 1,
            A = p.kind === 'bow' ? SHOT_HEAVY : SHOT_A;
          A.dmg = p.dmg;
          const r = enemyTakeHit(e, p.dmg, A, p.vx / n, p.vz / n);
          hitFx(p.x, p.y, p.z, r, A, r === 0);
          if (p.chill && r > 0) e.slowT = 150;
          if (!p.pierce) {
            gone = true;
            break;
          }
        }
      }
    if (gone) {
      scene.remove(p.m);
      G.pshots.splice(i, 1);
    }
  }
}
function clearShots() {
  G.pshots.forEach(p => scene.remove(p.m));
  G.pshots.length = 0;
}

/* ---------- boss part focus (lock on, then press lock again to pick a part) ---------- */
function cycleFocus() {
  const b = P.lock;
  const list = ['armL', 'armR', 'back'].filter(
    k => b.m.parts[k].alive && (k !== 'back' || b.phase >= 3 || b.st === 'kneel'),
  );
  const i = P.focus ? list.indexOf(P.focus) : -1;
  if (i + 1 >= list.length) {
    P.focus = null;
    P.lock = null;
    return;
  }
  P.focus = list[i + 1];
  floatText(P.x, P.y + 2.3, P.z, 'Focus: ' + b.m.parts[P.focus].name, 'say');
}

/* ---------- flight ---------- */
function tryFly() {
  if (P.st === 'dead' || P.st === 'down' || P.st === 'hit') return false;
  if (P.fly) {
    P.fly = false;
    floatText(P.x, P.y + 2, P.z, 'Glide', 'say');
    return true;
  }
  if (P.fe < 12) {
    floatText(P.x, P.y + 2, P.z, 'Wings tired!', 'say');
    return true;
  }
  P.fly = true;
  P.jumps = 2;
  if (P.onG) {
    P.vy = 9;
    P.onG = false;
    dust(P.x, P.z, 10);
  }
  if (P.st === 'charge') P.st = 'move';
  sfx('jump');
  burst(puffs, P.x, P.y + 0.8, P.z, 12, 4, 0.5, 0xffffff, 0.8, { a: 0.6 });
  return true;
}
// called every frame from updatePlayer: energy, and the climbing / hovering / sinking
function updateFlight(dt, wx, wz) {
  const F = DATA.flight,
    max = flightMax();
  if (P.onG) {
    P.fly = false;
    P.fe = Math.min(max, (P.fe === undefined ? max : P.fe) + F.regen * dt);
    return;
  }
  if (P.fe === undefined) P.fe = max;
  if (!P.fly) return;
  const climb = In.held.jump && !G.cine,
    sink = In.held.down;
  P.fe -= (climb ? F.climbDrain : F.drain) * dt;
  if (P.fe <= 0) {
    P.fe = 0;
    P.fly = false;
    floatText(P.x, P.y + 2, P.z, 'Wings tired!', 'say');
    return;
  }
  const want = climb ? F.climb : sink ? -F.climb * 1.3 : -0.5;
  P.vy = damp(P.vy, P.y > F.maxHeight && want > 0 ? 0 : want, 6, dt);
  if (P.st === 'move') {
    const sp = F.speed * (TUNE.runSpeed / TUNE0.runSpeed);
    P.vx = damp(P.vx, wx * sp, 6, dt);
    P.vz = damp(P.vz, wz * sp, 6, dt);
    if (Math.hypot(wx, wz) > 0.2) P.face += clamp(angDiff(P.face, Math.atan2(wx, wz)), -10 * dt, 10 * dt);
  }
  if (Math.random() < 0.3)
    puffs.emit(P.x + rnd(-0.6, 0.6), P.y + 0.6, P.z + rnd(-0.6, 0.6), 0, -1, 0, 0.4, TC.set(0xffffff), 0.5, 0, 0, 0.35);
}
