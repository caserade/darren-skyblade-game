/* Stormglass Reach (chapter 3): young Stormbelly and young Chomp Rex.
   They reuse the sculpted, skinned Cloud Utopia models (src/cast.js) at a smaller scale, with the chapter's
   simple fight pattern: amber warning, one telegraphed attack, a long recovery to punish.
   Ids are youngbelly / youngrex so they never clash with the Cloud Utopia monsters (heavyweight / chomprex). */
const YOUNG = {
  youngbelly: { cast: 'heavyweight', sc: 0.78, weight: 0.12, windTime: 66, range: 3.7, stop: 2.7, speed: 1.65 },
  youngrex: { cast: 'chomprex', sc: 0.7, weight: 0, windTime: 48, range: 6, stop: 3.8, speed: 2.3 },
};
const YOUNG_WARN = {};
function youngWarnMat() {
  return YOUNG_WARN.mat || (YOUNG_WARN.mat = new T.MeshBasicMaterial({ color: 0xf5b655, transparent: true, opacity: 0.54, side: T.DoubleSide, depthWrite: false }));
}
function buildYoungMonster(type) {
  const Y = YOUNG[type],
    D = buildCastModel(Y.cast);
  // combat.js pitches and squashes M.b; the sculpt's pose drives D.body inside it, so the two never fight
  const wrap = new T.Group();
  D.root.remove(D.body);
  wrap.add(D.body);
  D.root.add(wrap);
  D.b = wrap;
  // amber telegraph, sized in world metres to match the real hit area (the root is scaled by sc)
  const warning = new T.Group();
  if (type === 'youngbelly') {
    const g = YOUNG_WARN.ring || (YOUNG_WARN.ring = new T.RingGeometry(3.0, 3.3, 48)),
      r = new T.Mesh(g, youngWarnMat());
    r.rotation.x = -PI / 2;
    warning.add(r);
  } else {
    if (!YOUNG_WARN.arrow) {
      const s = new T.Shape();
      [[-0.8, 0], [0.8, 0], [0.8, 3], [1.2, 3], [0, 4.4], [-1.2, 3], [-0.8, 3]].forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
      s.closePath();
      YOUNG_WARN.arrow = new T.ShapeGeometry(s);
    }
    const r = new T.Mesh(YOUNG_WARN.arrow, youngWarnMat());
    r.rotation.x = PI / 2;
    r.scale.setScalar(0.92);
    warning.add(r);
  }
  warning.scale.setScalar(1 / Y.sc);
  warning.position.y = 0.045 / Y.sc;
  warning.visible = false;
  D.root.add(warning);
  D.warning = warning;
  const sharedDispose = D.dispose;
  D.dispose = () => {
    D.root.remove(warning); // the warning geometry and material are shared by every young monster
    if (sharedDispose) sharedDispose();
  };
  return D;
}
function youngBrain(e, s, dt, dist, ang, hover, turn, pAlive) {
  const Y = YOUNG[e.type],
    belly = e.type === 'youngbelly';
  const forward = sp => {
    e.x += Math.sin(e.face) * sp * dt;
    e.z += Math.cos(e.face) * sp * dt;
  };
  if (e.st === 'chase') {
    turn(2.4);
    if (dist > Y.stop) forward(Y.speed);
    if (e.cool <= 0 && pAlive && dist < Y.range && token(e)) {
      e.st = 'wind';
      e.t = 0;
      e.wind = true;
      e.hitP = false;
    }
  } else if (e.st === 'wind') {
    if (e.t < Y.windTime * 0.55) turn(2);
    if (e.t >= Y.windTime) {
      e.st = 'atk';
      e.t = 0;
      e.wind = false;
      if (belly) {
        ring(e.x, 0.1, e.z, 0.3, 13, 0.3, 0xb6d7ff);
        dust(e.x, e.z, 10);
        sfx('slam');
        G.shake = Math.max(G.shake, 0.35);
        if (dist < 3.3 && P.y < 0.8) {
          hurtP(e, 24, e.x, e.z, true);
          e.hitP = true;
        }
      }
    }
  } else if (e.st === 'atk') {
    if (!belly) {
      forward(7.6);
      if (!e.hitP && Math.hypot(P.x - e.x, P.z - e.z) < 1.85 && P.y < 2.3) {
        e.hitP = true;
        hurtP(e, 20, e.x, e.z, false);
        sfx('hit', 1);
      }
    }
    if (e.t >= (belly ? 18 : 25)) {
      e.st = 'rec';
      e.t = 0;
    }
  } else if (e.st === 'rec' && e.t >= (belly ? 80 : 65)) {
    e.st = 'chase';
    e.t = 0;
    e.cool = belly ? 150 : 115;
  }
}
function youngClip(e, dt) {
  const belly = e.type === 'youngbelly',
    st = e.st;
  if (!e.alive) return ['death', Math.min(2.2, (e.dead || 0) / 60)];
  const t = e.t / 60;
  if (st === 'wind') return [belly ? 'stompWindup' : 'chargeWindup', t]; // wind-up lengths match the clips (1.1 s / 0.8 s)
  if (st === 'atk') return belly ? ['stompImpact', t] : ['charge', t];
  if (st === 'rec') return [belly ? 'stompRecovery' : 'recovery', t];
  if (st === 'stun' || st === 'down') return ['stagger', t];
  if (st === 'chase') return [belly ? 'heavyWalk' : 'walk', (e.wph = (e.wph || 0) + dt * 1.15)];
  return ['idle', G.time];
}
function animateYoung(e, dt) {
  const M = e.m;
  castLod(M);
  const [clip, t] = youngClip(e, dt);
  const R = castPose(YOUNG[e.type].cast, clip, t);
  castApplyPose(M, R, dt, clip === 'stompImpact' || clip === 'charge' ? 30 : 12);
  const U = M.U;
  U.uW.value = YOUNG[e.type].weight;
  U.uT.value = G.time;
  U.uFlash.value = e.flash > 0 ? 0.55 : e.wind && Math.floor(G.time * 14) % 2 === 0 ? 0.35 : 0;
  U.uFlashC.value.set(e.flash > 0 ? 0xffffff : 0xff3a1a);
  e.blinkT = (e.blinkT === undefined ? rnd(2, 4) : e.blinkT) - dt;
  if (e.blinkT < 0) e.blinkT = rnd(2.5, 5);
  const lid = !e.alive || clip === 'stagger' ? 0.7 : e.blinkT < 0.12 ? 1.3 : e.type === 'youngbelly' ? 0.05 : -0.25;
  M.lids.forEach(l => {
    l.rotation.x += (lid - l.rotation.x) * Math.min(1, dt * 25);
    l.rotation.z = l.userData.s * (e.type === 'youngbelly' ? -0.15 : -0.35);
  });
  M.warning.visible = e.wind && e.alive;
  M.warning.position.y = (0.045 - e.y) / YOUNG[e.type].sc;
}
EDEF.youngbelly = { name: 'Young Stormbelly', hp: 360, r: 1.45, h: 3.5, w: 3, sc: YOUNG.youngbelly.sc, ai: 'young', build: () => buildYoungMonster('youngbelly') };
EDEF.youngrex = { name: 'Young Chomp Rex', hp: 260, r: 1.4, h: 4.2, w: 2.5, sc: YOUNG.youngrex.sc, ai: 'young', build: () => buildYoungMonster('youngrex') };
DATA.enemies.youngbelly = { name: 'Young Stormbelly', hp: 360, poise: 42 };
DATA.enemies.youngrex = { name: 'Young Chomp Rex', hp: 260, poise: 28 };
DATA.drops.youngbelly = [['stormglass', 3], ['plate', 1]];
DATA.drops.youngrex = [['stormglass', 2], ['feather', 1]];
(() => {
  const ch3 = DATA.chapters.find(c => c.id === 'ch3');
  if (!ch3) return;
  ch3.zones.find(z => z.id === 'gale').enemies.push(['youngbelly', 1]);
  ch3.zones.find(z => z.id === 'archive').enemies.push(['youngrex', 1]);
  ch3.story.gale_enter.push(['narrator', 'A young Stormbelly braces before a stomp. Leave the amber circle or jump over the impact.']);
  ch3.story.archive_enter.push(['narrator', 'A young Chomp Rex leans back before charging along its amber arrow. Dodge sideways, then punish its recovery.']);
})();
