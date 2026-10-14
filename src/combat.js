/* COMBAT: particles and effects, Darren's moves and state machine, damage, enemies and their AI, the boss.
   Move numbers come from DATA.moves; animation poses are the POSE table below. */
/* ---------- effects ---------- */
const V1 = new T.Vector3(),
  V2 = new T.Vector3(),
  V3 = new T.Vector3(),
  TC = new T.Color();
function makeParticles(n, additive) {
  const pos = new Float32Array(n * 3),
    col = new Float32Array(n * 4),
    size = new Float32Array(n);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new T.BufferAttribute(col, 4));
  geo.setAttribute('aSize', new T.BufferAttribute(size, 1));
  const mat = new T.ShaderMaterial({
    uniforms: { uScale: { value: 600 } },
    transparent: true,
    depthWrite: false,
    blending: additive ? T.AdditiveBlending : T.NormalBlending,
    vertexShader:
      'attribute vec4 aColor;attribute float aSize;varying vec4 vC;uniform float uScale;void main(){vC=aColor;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uScale/max(0.1,-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader:
      'varying vec4 vC;void main(){float d=length(gl_PointCoord-0.5);float a=smoothstep(0.5,0.12,d);gl_FragColor=vec4(vC.rgb,vC.a*a);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}',
  });
  const pts = new T.Points(geo, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  const d = [];
  for (let i = 0; i < n; i++) {
    d.push({ life: 0, max: 1, vx: 0, vy: 0, vz: 0, g: 0, dr: 0, s: 0, a: 1 });
    pos[i * 3 + 1] = -999;
  }
  let cur = 0;
  return {
    mat,
    emit(x, y, z, vx, vy, vz, life, c, s, g, dr, a) {
      const i = cur,
        p = d[i];
      cur = (cur + 1) % n;
      p.life = p.max = life;
      p.vx = vx;
      p.vy = vy;
      p.vz = vz;
      p.g = g || 0;
      p.dr = dr || 0;
      p.s = s;
      p.a = a === undefined ? 1 : a;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      col[i * 4] = c.r;
      col[i * 4 + 1] = c.g;
      col[i * 4 + 2] = c.b;
    },
    update(dt) {
      for (let i = 0; i < n; i++) {
        const p = d[i];
        if (p.life <= 0) continue;
        p.life -= dt;
        if (p.life <= 0) {
          pos[i * 3 + 1] = -999;
          size[i] = 0;
          continue;
        }
        p.vy -= p.g * dt;
        const k = Math.exp(-p.dr * dt);
        p.vx *= k;
        p.vy *= k;
        p.vz *= k;
        pos[i * 3] += p.vx * dt;
        pos[i * 3 + 1] += p.vy * dt;
        pos[i * 3 + 2] += p.vz * dt;
        const t = p.life / p.max;
        col[i * 4 + 3] = p.a * Math.min(1, t * 2.2);
        size[i] = p.s * (additive ? 0.4 + t * 0.6 : 1.6 - t * 0.7);
      }
      geo.attributes.position.needsUpdate = geo.attributes.aColor.needsUpdate = geo.attributes.aSize.needsUpdate = true;
    },
  };
}
const sparks = makeParticles(COARSE ? 500 : 900, true),
  puffs = makeParticles(COARSE ? 160 : 300, false);
function burst(sys, x, y, z, n, speed, life, color, size, o) {
  o = o || {};
  TC.set(color);
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU),
      u = rnd(-1, 1),
      q = Math.sqrt(1 - u * u),
      sp = speed * rnd(0.35, 1);
    sys.emit(
      x,
      y,
      z,
      Math.cos(a) * q * sp,
      u * sp * (o.flat ? 0.25 : 1) + (o.up || 0),
      Math.sin(a) * q * sp,
      life * rnd(0.55, 1),
      TC,
      size * rnd(0.6, 1.2),
      o.g || 0,
      o.dr === undefined ? 2.5 : o.dr,
      o.a,
    );
  }
}
function dust(x, z, n) {
  burst(puffs, x, 0.15, z, n, 3.2, 0.5, 0xf2ead8, 0.7, { flat: true, up: 0.6, a: 0.55, dr: 3 });
}

/* sword trail ribbon */
const TRAIL_N = 18;
const trail = (function () {
  const pos = new Float32Array(TRAIL_N * 6),
    col = new Float32Array(TRAIL_N * 6),
    idx = [];
  for (let i = 0; i < TRAIL_N - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  geo.setIndex(idx);
  const mesh = new T.Mesh(
    geo,
    new T.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: T.AdditiveBlending,
      side: T.DoubleSide,
      depthWrite: false,
    }),
  );
  mesh.frustumCulled = false;
  scene.add(mesh);
  const pts = []; // newest first: {b:Vector3,t:Vector3,life}
  return {
    push(b, t) {
      pts.unshift({ b: b.clone(), t: t.clone(), life: 1 });
      if (pts.length > TRAIL_N) pts.pop();
    },
    update(dt, heart) {
      for (let i = pts.length - 1; i >= 0; i--) {
        pts[i].life -= dt * 6.5;
        if (pts[i].life <= 0) pts.splice(i, 1);
      }
      for (let i = 0; i < TRAIL_N; i++) {
        const p = pts[Math.min(i, pts.length - 1)],
          o = i * 6;
        if (!p) {
          pos.fill(0);
          break;
        }
        pos[o] = p.b.x;
        pos[o + 1] = p.b.y;
        pos[o + 2] = p.b.z;
        pos[o + 3] = p.t.x;
        pos[o + 4] = p.t.y;
        pos[o + 5] = p.t.z;
        const k = i < pts.length ? p.life * p.life : 0;
        col[o] = k * 0.1;
        col[o + 1] = k * (heart ? 0.05 : 0.025);
        col[o + 2] = 0;
        col[o + 3] = k * 0.45;
        col[o + 4] = k * (heart ? 0.26 : 0.16);
        col[o + 5] = k * (heart ? 0.08 : 0.02);
      }
      mesh.visible = pts.length > 1;
      geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
    },
  };
})();

/* shockwave rings */
const ringPool = [];
(function () {
  const g = new T.RingGeometry(0.86, 1, 56);
  g.rotateX(-PI / 2);
  for (let i = 0; i < 10; i++) {
    const m = new T.Mesh(
      g,
      new T.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: T.AdditiveBlending,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    m.visible = false;
    m.frustumCulled = false;
    scene.add(m);
    ringPool.push({ m, on: false });
  }
})();
function ring(x, y, z, r0, vr, life, color, dmg) {
  const r = ringPool.find(q => !q.on) || ringPool[0];
  r.on = true;
  r.x = x;
  r.z = z;
  r.r = r0;
  r.vr = vr;
  r.life = r.max = life;
  r.dmg = dmg || 0;
  r.hit = false;
  r.m.material.color.set(color);
  r.m.position.set(x, y, z);
  r.m.visible = true;
  return r;
}
/* ground telegraph decals */
function fanGeo(half) {
  const p = [0, 0, 0],
    n = 28,
    idx = [];
  for (let i = 0; i <= n; i++) {
    const a = -half + (2 * half * i) / n;
    p.push(Math.sin(a), 0, Math.cos(a));
    if (i < n) idx.push(0, i + 1, i + 2);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setIndex(idx);
  return g;
}
const decM = () =>
  new T.MeshBasicMaterial({ color: 0xff1408, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide });
const decalC = new T.Mesh(fanGeo(PI), decM()),
  decalS = new T.Mesh(fanGeo(1.4), decM()),
  decalB = new T.Mesh(fanGeo(PI), decM());
[decalC, decalS, decalB].forEach(m => {
  m.position.y = 0.06;
  m.visible = false;
  scene.add(m);
});
const lockMark = mk(GEO.lowCone, new T.MeshBasicMaterial({ color: 0xffc93c }), 0, 0, 0, 0.22, 0.45, 0.22);
lockMark.rotation.x = PI;
lockMark.castShadow = false;
lockMark.visible = false;
scene.add(lockMark);

/* slash arcs: a bright crescent drawn along each swing */
function arcGeo(full) {
  const n = full ? 48 : 26,
    a0 = full ? 0 : -PI / 2 - 1.15,
    a1 = full ? TAU : -PI / 2 + 1.15,
    pos = [],
    col = [],
    idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      a = lerp(a0, a1, t),
      w = full ? 0.16 : 0.08 + 0.2 * Math.sin(t * PI),
      k = full ? 0.75 : Math.pow(t, 1.6);
    pos.push(Math.cos(a) * (1 - w), 0, -Math.sin(a) * (1 - w), Math.cos(a), 0, -Math.sin(a));
    col.push(k * 0.5, k * 0.5, k * 0.5, k, k, k);
    if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}
const ARC_G = arcGeo(false),
  ARC_GF = arcGeo(true),
  ARCS = [];
for (let i = 0; i < 6; i++) {
  const m = new T.Mesh(
    ARC_G,
    new T.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide,
    }),
  );
  m.rotation.order = 'YXZ';
  m.visible = false;
  m.frustumCulled = false;
  scene.add(m);
  ARCS.push({ m, life: 0 });
}
// how each pose's arc is tilted: [height, tilt x, tilt z, mirror, full circle]
const ARC_STYLE = {
  slashR: [1.0, 0, 0.32, 1],
  slashL: [1.0, 0, -0.3, -1],
  spin: [0.95, 0, 0.08, 1, true],
  wheel: [1.0, 0, 0, 1, true],
  sweep: [0.35, 0, 0, 1, true],
  slam: [0.9, 0, PI / 2, -1],
  rise: [0.9, 0, PI / 2, 1],
  spike: [1.1, 0, PI / 2 - 0.3, -1],
  nova: [1.0, 0, 0, 1, true],
  lslashR: [1.0, 0, -0.32, -1],
  lslashL: [1.0, 0, 0.3, 1],
  lrise: [0.9, 0, PI / 2, 1],
};
function spawnArc(A, color) {
  const st = ARC_STYLE[A.pose];
  if (!st) return;
  const a = ARCS.find(q => q.life <= 0) || ARCS[0];
  a.m.geometry = st[4] ? ARC_GF : ARC_G;
  a.m.material.color.set(color);
  a.m.position.set(P.x, P.y + st[0], P.z);
  a.m.rotation.set(st[1], P.face, st[2]);
  a.r = (A.rng || 2.5) * 0.92;
  a.mir = st[3];
  a.life = a.max = st[4] ? 0.24 : 0.17;
  a.m.visible = true;
}
/* hit stars: a quick bright flash where a hit lands */
const STAR_TEX = (function () {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d'),
    g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,240,200,0.8)');
  g.addColorStop(1, 'rgba(255,200,120,0)');
  x.fillStyle = g;
  x.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU,
      r = i % 2 ? 18 : 64;
    x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
  }
  x.fill();
  const t = new T.CanvasTexture(c);
  return t;
})();
const STARS = [];
for (let i = 0; i < 8; i++) {
  const s = new T.Sprite(
    new T.SpriteMaterial({
      map: STAR_TEX,
      transparent: true,
      blending: T.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
  );
  s.visible = false;
  scene.add(s);
  STARS.push({ s, life: 0 });
}
function hitStar(x, y, z, size, color) {
  const q = STARS.find(o => o.life <= 0) || STARS[0];
  q.s.position.set(x, y, z);
  q.s.material.color.set(color || 0xffffff);
  q.s.material.rotation = rnd(TAU);
  q.size = size;
  q.life = q.max = 0.13;
  q.s.visible = true;
}
/* ground marks: red warning circles where an attack is about to land */
const MARK_G = new T.RingGeometry(0.72, 1, 40),
  MARKS = [];
MARK_G.rotateX(-PI / 2);
const MARK_DG = new T.CircleGeometry(1, 32);
MARK_DG.rotateX(-PI / 2);
for (let i = 0; i < 12; i++) {
  const g = new T.Group(),
    rm = new T.MeshBasicMaterial({ color: 0xff2a10, transparent: true, opacity: 0, depthWrite: false }),
    dm = new T.MeshBasicMaterial({ color: 0xff2a10, transparent: true, opacity: 0, depthWrite: false });
  g.add(new T.Mesh(MARK_G, rm), new T.Mesh(MARK_DG, dm));
  g.visible = false;
  g.renderOrder = 3;
  scene.add(g);
  MARKS.push({ g, rm, dm, life: 0 });
}
function mark(x, z, r, frames, color) {
  const q = MARKS.find(o => o.life <= 0) || MARKS[0];
  q.g.position.set(x, 0.07, z);
  q.g.scale.setScalar(r);
  q.rm.color.set(color || 0xff2a10);
  q.dm.color.set(color || 0xff2a10);
  q.life = q.max = frames;
  q.g.visible = true;
  return q;
}
/* spikes: rock or root spikes that burst out of the ground (Ground Wave, Old Knotroot's roots) */
const SPIKE_M = { rock: flat(0xb3a48e), root: flat(0x6e4a2e), ice: toy(0xd8f2ff, { roughness: 0.2 }) },
  SPIKES = [];
for (let i = 0; i < 18; i++) {
  const m = new T.Mesh(GEO.lowCone, SPIKE_M.rock);
  m.visible = false;
  m.castShadow = true;
  scene.add(m);
  SPIKES.push({ m, life: 0 });
}
function spike(x, z, h, kind) {
  const q = SPIKES.find(o => o.life <= 0) || SPIKES[0];
  q.m.material = SPIKE_M[kind] || SPIKE_M.rock;
  q.m.position.set(x, -h, z);
  q.m.rotation.set(rnd(-0.25, 0.25), rnd(TAU), rnd(-0.25, 0.25));
  q.h = h;
  q.w = h * 0.32;
  q.life = q.max = 0.7;
  q.m.visible = true;
}
function updateFx(dt) {
  for (const a of ARCS) {
    if (a.life <= 0) continue;
    a.life -= dt;
    const k = Math.max(0, a.life / a.max),
      sc = a.r * (1.12 - k * 0.22);
    a.m.scale.set(sc * a.mir, sc, sc);
    a.m.material.opacity = k;
    a.m.material.color.multiplyScalar(0.86);
    if (a.life <= 0) a.m.visible = false;
  }
  for (const q of STARS) {
    if (q.life <= 0) continue;
    q.life -= dt;
    const k = Math.max(0, q.life / q.max);
    q.s.scale.setScalar(q.size * (1.3 - k * 0.7));
    q.s.material.opacity = k;
    if (q.life <= 0) q.s.visible = false;
  }
  for (const q of MARKS) {
    if (q.life <= 0) continue;
    q.life -= dt * 60;
    const k = 1 - Math.max(0, q.life / q.max);
    q.rm.opacity = 0.35 + 0.55 * k * (0.75 + 0.25 * Math.sin(G.time * 30));
    q.dm.opacity = 0.12 + 0.25 * k;
    if (q.life <= 0) q.g.visible = false;
  }
  for (const q of SPIKES) {
    if (q.life <= 0) continue;
    q.life -= dt;
    const t = 1 - q.life / q.max,
      up = t < 0.15 ? smooth(t / 0.15) : t > 0.7 ? 1 - smooth((t - 0.7) / 0.3) : 1;
    q.m.scale.set(q.w, q.h, q.w);
    q.m.position.y = -q.h * 0.5 + q.h * up;
    if (q.life <= 0) q.m.visible = false;
  }
}
function clearFx() {
  for (const a of ARCS) ((a.life = 0), (a.m.visible = false));
  for (const q of STARS) ((q.life = 0), (q.s.visible = false));
  for (const q of MARKS) ((q.life = 0), (q.g.visible = false));
  for (const q of SPIKES) ((q.life = 0), (q.m.visible = false));
  G.waves.length = 0;
}

/* ---------- style rank (D to S) ---------- */
const SR = DATA.style.ranks;
const STY = { pts: 0, rank: 0, recent: [], idle: 9, best: 0, zoneBest: 0, shown: -1 };
function styleReset() {
  STY.pts = 0;
  STY.rank = 0;
  STY.recent.length = 0;
  STY.idle = 9;
}
function styleRankOf(p) {
  let r = 0;
  for (let i = 0; i < SR.length; i++) if (p >= SR[i][2]) r = i;
  return r;
}
function styleAdd(v) {
  STY.pts = Math.min(DATA.style.max, STY.pts + v);
  STY.idle = 0;
  const r = styleRankOf(STY.pts);
  if (r > STY.rank) {
    STY.rank = r;
    sfx('rank', r);
    const el = $('style');
    if (el) {
      el.classList.remove('up');
      void el.offsetWidth;
      el.classList.add('up');
    }
  }
  STY.rank = r;
  STY.best = Math.max(STY.best, r);
  STY.zoneBest = Math.max(STY.zoneBest, r);
}
// variety: the same move used again and again is worth less
function styleVariety(name) {
  let n = 0;
  for (const m of STY.recent) if (m === name) n++;
  return 1 / (1 + n * 0.7);
}
function styleUse(name) {
  STY.recent.push(name);
  if (STY.recent.length > 6) STY.recent.shift();
}
function styleDrop() {
  STY.rank = Math.max(0, STY.rank - 1);
  STY.pts = Math.min(STY.pts, SR[STY.rank][2] + (STY.rank ? 10 : 0));
}
function styleUpdate(dt) {
  STY.idle += dt;
  const k = DATA.style.decay * (1 + STY.rank * 0.5) * (STY.idle > 2 ? 3 : 1);
  STY.pts = Math.max(0, STY.pts - k * dt);
  STY.rank = styleRankOf(STY.pts);
}

/* HUD helpers */
const numEls = [];
for (let i = 0; i < 22; i++) {
  const s = document.createElement('span');
  $('nums').appendChild(s);
  numEls.push(s);
}
let numI = 0;
function floatText(x, y, z, text, cls) {
  V1.set(x, y, z).project(camera);
  if (V1.z > 1) return;
  const el = numEls[numI];
  numI = (numI + 1) % numEls.length;
  el.textContent = text;
  el.style.left = (V1.x * 0.5 + 0.5) * 100 + rnd(-2, 2) + '%';
  el.style.top = (-V1.y * 0.5 + 0.5) * 100 + '%';
  el.className = '';
  void el.offsetWidth;
  el.className = 'fly ' + (cls || '');
}
let banT = 0;
function banner(big, small, frames) {
  $('banB').textContent = big;
  $('banS').textContent = small || '';
  $('banner').classList.add('on');
  banT = frames || 150;
}
let flashT = 0;
function flash(c, frames) {
  $('flash').className = c;
  flashT = frames || 8;
}

/* ---------- player ---------- */
const BASE = {
  by: 0,
  bp: 0,
  byw: 0,
  br: 0,
  hp: 0,
  hy: 0,
  aRx: -0.35,
  aRy: 0,
  aRz: -0.28,
  aLx: 0.1,
  aLy: 0,
  aLz: 0.3,
  swx: 0.55,
  swy: 0,
  swz: 0,
  swxL: 0.55,
  lL: 0,
  lR: 0,
  wing: 0.55,
  wf: 0,
  tail: 0.13,
  ty: 0,
};
const POSE = {
  slashR: [
    { aRx: -0.5, aRy: -0.9, aRz: -1.8, swx: 1.0, byw: -0.6, bp: -0.05 },
    { aRx: 0.15, aRy: 1.5, aRz: -1.1, swx: 1.3, byw: 0.85, bp: 0.18, wing: 0.9 },
    { aRx: 0.1, aRy: 1.6, aRz: -0.9, swx: 1.2, byw: 0.6, bp: 0.1 },
  ],
  slashL: [
    { aRy: 1.5, aRz: -1.2, aRx: 0, swx: 1.2, byw: 0.85 },
    { aRy: -0.9, aRz: -1.55, aRx: 0, swx: 1.35, byw: -0.7, bp: 0.15, wing: 0.9 },
    { aRy: -0.8, aRz: -1.4, aRx: 0, swx: 1.2, byw: -0.6 },
  ],
  spin: [
    { aRz: -1.5, aRy: 0.4, aRx: 0, swx: 1.4, aLz: 1.4, wing: 0.1, by: 0.06 },
    { aRz: -1.5, aRy: 0.4, aRx: 0, swx: 1.45, aLz: 1.4, wing: 0.05, by: 0.08 },
    { aRz: -1.1, aRy: 0.7, aRx: 0, swx: 1.2, aLz: 0.8 },
  ],
  slam: [
    {
      by: 0.55,
      aRx: -2.3,
      aRz: -0.35,
      aLx: -2.2,
      aLz: 0.35,
      swx: 0.9,
      bp: -0.3,
      wing: 0,
      wf: 0.9,
      lL: -0.5,
      lR: -0.5,
      tail: 0.35,
    },
    { by: -0.1, aRx: -0.95, aLx: -0.9, aRz: -0.1, swx: 1.45, bp: 0.6, wing: 0.8, wf: -0.4 },
    { by: -0.08, aRx: -0.8, aLx: -0.6, aRz: -0.1, swx: 1.4, bp: 0.45 },
  ],
  rise: [
    { by: -0.2, bp: 0.4, aRx: 0.7, aRz: -0.4, swx: 1.3, lL: 0.3, lR: 0.3 },
    { by: 0.3, bp: -0.35, aRx: -2.3, aRz: -0.45, swx: 1.2, wing: 0, wf: 0.9 },
    { by: 0.15, bp: -0.2, aRx: -2.15, aRz: -0.45, swx: 1.1, wing: 0.2 },
  ],
  thrust: [
    { byw: -0.8, aRx: -0.3, aRz: -0.9, aRy: -0.7, swx: 1.5, bp: 0.2, by: -0.1 },
    { byw: 0.35, aRx: -1.5, aRz: 0, aRy: 0, swx: 1.55, bp: 0.5, wing: 1.0, lL: 0.6, lR: -0.3 },
    { byw: 0.2, aRx: -1.3, aRz: 0, swx: 1.5, bp: 0.3 },
  ],
  wheel: [
    { by: 0.25, aRx: -2.25, aLx: -2.25, aRz: -0.4, aLz: 0.4, swx: 1.4, lL: -1, lR: -1, wing: 1.1 },
    { by: 0.25, aRx: -2.25, aLx: -2.25, aRz: -0.4, aLz: 0.4, swx: 1.4, lL: -1, lR: -1, wing: 1.1 },
    { by: 0, aRx: -0.8, swx: 1.2 },
  ],
  breath: [
    { bp: -0.3, hp: -0.35, aRx: 0.5, aLx: 0.5, wing: 0, wf: 0.8 },
    { bp: 0.3, hp: 0.12, aRx: 0.6, aLx: 0.6, wing: 0.2, wf: 0.2, by: -0.05 },
    {},
  ],
  nova: [
    { by: 0.4, aRz: -1.5, aRy: 0.4, aRx: 0, swx: 1.45, aLz: 1.5, wing: 0, wf: 0.5 },
    { by: 0.7, aRz: -1.5, aRy: 0.4, aRx: 0, swx: 1.45, aLz: 1.5, wing: 0, wf: 0.5 },
    { by: 0 },
  ],
  land: [
    {},
    { by: -0.2, bp: 0.5, aRx: -0.9, swx: 1.45, lL: -0.4, lR: -0.4 },
    { by: -0.12, bp: 0.3, aRx: -0.7, swx: 1.3 },
  ],
  // low crouching tail sweep
  sweep: [
    { by: -0.32, bp: 0.45, aRz: -1.2, aRy: -0.6, aRx: 0.2, swx: 1.3, lL: 0.7, lR: -0.6, tail: 0.02, wing: 0.9 },
    {
      by: -0.36,
      bp: 0.5,
      aRz: -1.45,
      aRy: 0.6,
      aRx: 0.25,
      swx: 1.45,
      lL: 0.8,
      lR: -0.7,
      tail: 0.0,
      ty: 1.2,
      wing: 1.1,
    },
    { by: -0.2, bp: 0.3, aRz: -1.1, aRy: 0.5, swx: 1.2, lL: 0.4, lR: -0.3 },
  ],
  // overhead chop that drives an airborne enemy down
  spike: [
    { by: 0.1, bp: -0.35, aRx: -2.3, aRz: -0.3, aLx: -1.2, swx: 1.0, wing: 0, wf: 0.9, lL: 0.6, lR: 0.4 },
    {
      by: -0.05,
      bp: 0.75,
      aRx: -0.5,
      aRz: -0.15,
      aLx: 0.4,
      swx: 1.55,
      wing: 1.1,
      wf: -0.3,
      lL: 0.9,
      lR: 0.7,
      hp: -0.3,
    },
    { bp: 0.5, aRx: -0.6, swx: 1.45, wing: 0.6 },
  ],
};
// frames at 60 fps: st startup, ac active, rc recovery, cx first frame the next action may interrupt
// left-arm versions of the right-arm swings (Twin Arms), made by mirroring the pose numbers
function mirrorPose(list) {
  const neg = { byw: 1, br: 1, ty: 1, hy: 1 },
    swap = { aRx: 'aLx', aRy: 'aLy', aRz: 'aLz', aLx: 'aRx', aLy: 'aRy', aLz: 'aRz', swx: 'swxL', swxL: 'swx' },
    flip = { aRy: 1, aRz: 1, aLy: 1, aLz: 1 };
  return list.map(ph => {
    const o = {};
    for (const k in ph) {
      const nk = swap[k] || k;
      o[nk] = flip[k] || neg[k] ? -ph[k] : ph[k];
    }
    return o;
  });
}
POSE.lslashR = mirrorPose(POSE.slashR);
POSE.lslashL = mirrorPose(POSE.slashL);
POSE.lrise = mirrorPose(POSE.rise);
// arm weapons pointed straight at the target
POSE.aim = [
  { aRx: -1.45, aRy: 0.15, aRz: -0.1, swx: 1.57, byw: 0.25, bp: 0.05 },
  { aRx: -1.6, aRy: 0.1, aRz: -0.1, swx: 1.57, byw: 0.3, bp: -0.05, by: 0.02 },
  { aRx: -1.4, aRy: 0.15, aRz: -0.1, swx: 1.57, byw: 0.25 },
];
POSE.aimL = mirrorPose(POSE.aim);
const ATK_DEFAULTS = {
  L1: { st: 6, ac: 4, rc: 14, cx: 10, dmg: 14, rng: 2.5, arc: 150, step: 6, pose: 'slashR', next: 'L2', hs: 3 },
  L2: { st: 7, ac: 4, rc: 16, cx: 11, dmg: 15, rng: 2.6, arc: 170, step: 6, pose: 'slashL', next: 'L3', hs: 3 },
  L3: {
    st: 8,
    ac: 8,
    rc: 18,
    cx: 16,
    dmg: 12,
    rng: 2.9,
    arc: 360,
    step: 4.5,
    pose: 'spin',
    next: 'L4',
    hs: 3,
    multi: 4,
    spin: [6, 20, 2],
  },
  L4: {
    st: 12,
    ac: 5,
    rc: 26,
    cx: 17,
    dmg: 32,
    rng: 3.1,
    arc: 220,
    step: 3.5,
    pose: 'slam',
    hs: 9,
    kd: true,
    dodgeOnly: true,
    quake: true,
    spin: [0, 11, 1],
  },
  LA: { st: 10, ac: 5, rc: 22, cx: 15, dmg: 22, rng: 2.7, arc: 150, step: 4, pose: 'rise', hs: 6, launch: 13, vr: 2.4 },
  DF: {
    st: 3,
    ac: 6,
    rc: 28,
    cx: 20,
    dmg: 58,
    rng: 3.4,
    arc: 80,
    step: 0,
    lunge: 24,
    pose: 'thrust',
    hs: 9,
    kd: true,
    pierce: true,
  },
  A1: { st: 5, ac: 4, rc: 10, cx: 8, dmg: 13, rng: 2.6, arc: 180, step: 2, pose: 'slashR', hs: 3, air: true, vr: 2.2 },
  A2: { st: 5, ac: 4, rc: 10, cx: 8, dmg: 13, rng: 2.6, arc: 180, step: 2, pose: 'slashL', hs: 3, air: true, vr: 2.2 },
  A3: {
    st: 5,
    ac: 6,
    rc: 10,
    cx: 9,
    dmg: 16,
    rng: 2.8,
    arc: 360,
    step: 2,
    pose: 'spin',
    hs: 4,
    air: true,
    vr: 2.2,
    spin: [3, 13, 1],
  },
  DVL: { st: 0, ac: 1, rc: 20, cx: 10, dmg: 0, rng: 0, arc: 0, step: 0, pose: 'land', hs: 0 },
  WL: { st: 6, ac: 6, rc: 16, cx: 14, dmg: 22, rng: 3.0, arc: 90, step: 0, lunge: 17, pose: 'thrust', hs: 5 },
  FF: {
    st: 4,
    ac: 5,
    rc: 14,
    cx: 10,
    dmg: 44,
    rng: 3.2,
    arc: 200,
    step: 9,
    pose: 'slashR',
    hs: 8,
    kd: true,
    pierce: true,
  },
  BW: {
    st: 8,
    ac: 20,
    rc: 18,
    cx: 28,
    dmg: 10,
    rng: 2.4,
    arc: 360,
    step: 0,
    lunge: 11,
    pose: 'wheel',
    hs: 2,
    multi: 5,
    flip: [6, 30, 3],
    fire: true,
    skill: true,
  },
  FB: {
    st: 12,
    ac: 30,
    rc: 20,
    cx: 42,
    dmg: 8,
    rng: 6.2,
    arc: 56,
    step: 0,
    pose: 'breath',
    hs: 0,
    multi: 6,
    fire: true,
    breath: true,
    pierce: true,
    skill: true,
    vr: 2.2,
  },
  SN: {
    st: 10,
    ac: 40,
    rc: 24,
    cx: 50,
    dmg: 24,
    rng: 5.6,
    arc: 360,
    step: 0,
    pose: 'nova',
    hs: 3,
    multi: 5,
    spin: [4, 54, 6],
    fire: true,
    skill: true,
    vr: 4,
    pierce: true,
  },
};
const ATK = Object.assign({}, ATK_DEFAULTS, DATA.moves || {}); // move numbers come from data/game_data.js
const P = { m: null, cp: Object.assign({}, BASE), tp: {} };
function resetPlayer() {
  Object.assign(P, {
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    face: 0,
    onG: true,
    jumps: 0,
    airDash: true,
    airI: 0,
    airWhiff: 0,
    st: 'move',
    f: 0,
    atk: null,
    name: '',
    last: null,
    hitSet: new Set(),
    hitConfirm: false,
    follow: false,
    tgt: null,
    hp: TUNE.maxHp,
    stam: 100,
    stamDelay: 0,
    heart: 0,
    heartOn: 0,
    inv: 0,
    perfect: 0,
    combo: 0,
    comboT: 0,
    buf: null,
    chainT: 0,
    cd1: 0,
    cd2: 0,
    runPh: 0,
    spin: 0,
    flip: 0,
    lock: null,
    trail: false,
    perfDone: false,
    chill: 0,
    fly: false,
    fe: undefined,
    focus: null,
    curW: null,
    armSide: 'R',
  });
  if (!P.weapon) P.weapon = UNLOCKS.weapon || 'emberfang';
}
function moveDir() {
  // camera-relative stick -> world
  const sy = Math.sin(cam.yaw),
    cy = Math.cos(cam.yaw);
  return [sy * -In.my - cy * In.mx, cy * -In.my + sy * In.mx];
}
function findTarget(dir, range, cone) {
  if (P.lock && P.lock.alive && Math.hypot(P.lock.x - P.x, P.lock.z - P.z) < range + 3) return P.lock;
  let best = null,
    bs = 1e9;
  for (const e of G.enemies) {
    if (!e.alive || e.under || e.d.static) continue;
    const dx = e.x - P.x,
      dz = e.z - P.z,
      d = Math.hypot(dx, dz) - e.r;
    if (d > range) continue;
    const a = Math.abs(angDiff(dir, Math.atan2(dx, dz)));
    if (a > cone && d > 0.8) continue;
    if (P.onG && e.y > 3.2 && !e.d.boss) continue;
    const sc = d + a * 2.2;
    if (sc < bs) {
      bs = sc;
      best = e;
    }
  }
  return best;
}
function startAttack(n, wid) {
  if (n === 'FIN') n = weaponData().finisher;
  P.curW = wid || P.weapon;
  P.armSide = 'R';
  const A = weaponMove(n, P.curW) || ATK[n];
  P.atk = A;
  P.name = n;
  P.last = n;
  P.st = 'attack';
  P.f = 0;
  P.hitSet.clear();
  P.hitConfirm = false;
  P.follow = false;
  P.spin = P.flip = 0;
  const [wx, wz] = moveDir(),
    ml = Math.hypot(wx, wz);
  let dir = ml > 0.25 && G.mode === 'play' ? Math.atan2(wx, wz) : P.face;
  // target magnetism: turn toward the nearest enemy in front (up to 60 degrees off the chosen direction)
  const t = G.mode === 'play' ? findTarget(dir, A.breath ? 9 : 6.5, 1.05) : null;
  P.tgt = t;
  if (t) {
    dir = Math.atan2(t.x - P.x, t.z - P.z);
    if (!P.onG && !t.d.boss && Math.abs(t.y - P.y) < 3.5) P.y = lerp(P.y, Math.max(0, t.y - 0.1), 0.4);
  }
  P.face = dir;
  if (A.air) {
    P.vy = Math.max(P.vy, P.airWhiff < 3 ? 2.6 : -2);
  }
  if (n === 'BW') P.cd1 = DATA.skills.blazeWheelCooldown;
  if (n === 'FB') P.cd2 = DATA.skills.flameBreathCooldown;
  sfx(A.fire ? 'fire' : 'swing', n === 'L2' ? 1 : n === 'L3' ? 2 : n === 'L4' || A.finisher ? 3 : 0);
  P.arcDone = false;
}
function can(k) {
  const st = P.st;
  if (st === 'move') return true;
  if (st === 'charge') return k === 'dash' || k === 'jump';
  if (st === 'attack') {
    const A = P.atk,
      end = A.st + A.ac + A.rc;
    if ((k === 'dash' || k === 'jump') && P.hitConfirm && P.f >= A.st && !A.skill) return true;
    if (A.dodgeOnly) return k === 'dash' || (k === 'heavy' && A.heavy) ? P.f >= A.cx : P.f >= end - 6;
    return P.f >= A.cx;
  }
  if (st === 'dash') return k === 'light' || k === 'heavy' ? P.f >= 6 || P.perfect > 0 : P.f >= 18;
  if (st === 'hit') return k === 'dash' && P.f >= 18;
  return false;
}
function tryAction(a) {
  if (P.st === 'dead' || P.st === 'down') return false;
  switch (a) {
    case 'lock':
      toggleLock();
      return true;
    case 'light':
      if (isTwin()) return armAction('R');
      if (!can('light')) return false;
      if (!P.onG) {
        if (P.airWhiff >= 4 && !P.fly) return false;
        startAttack(['A1', 'A2', 'A3'][P.airI++ % 3]);
        return true;
      }
      if (P.perfect > 0) {
        P.perfect = 0;
        startAttack('FF');
        return true;
      }
      if (P.st === 'dash') {
        startAttack('WL');
        return true;
      }
      startAttack(
        (P.st === 'attack' || P.chainT > 0) && P.last && ATK[P.last] && ATK[P.last].next ? ATK[P.last].next : 'L1',
      );
      return true;
    case 'heavy': {
      if (isTwin() && UNLOCKS.equip.L) return armAction('L');
      if (!can('heavy')) return false;
      const inString = P.st === 'attack' || P.chainT > 0;
      if (!P.onG) {
        // Sky Spike out of an air string, otherwise Meteor Dive
        if (inString && P.last && /^A[123]$/.test(P.last) && P.name !== 'AH') {
          startAttack('AH');
          return true;
        }
        P.st = 'dive';
        P.fly = false;
        P.f = 0;
        P.hitSet.clear();
        sfx('swing', 3);
        return true;
      }
      if (P.st === 'dash') {
        P.perfect = 0;
        startAttack('DH');
        return true;
      }
      // Heavy during a Slash string branches into that hit's finisher
      const br = inString && P.last && ATK[P.last] && ATK[P.last].heavy;
      if (br) {
        startAttack(br);
        return true;
      }
      P.st = 'charge';
      P.f = 0;
      return true;
    }
    case 'swap':
      if (P.st === 'move' || P.st === 'charge') cycleWeapon();
      return true;
    case 'style':
      if (P.st !== 'move') return false;
      setStyle(isTwin() ? 'classic' : 'twin', true);
      return true;
    case 'fly':
      return tryFly();
    case 'down':
      return true;
    case 'use':
      if (window.advUse) advUse();
      return true;
    case 'buddy':
      if (window.dumpCall) dumpCall();
      return true;
    case 'map':
      if (window.openMap) openMap();
      return true;
    case 'jump':
      if (P.fly) return true; // while flying, holding jump climbs
      if (!can('jump')) return false;
      if (P.onG) {
        P.vy = TUNE.jumpVel;
        P.onG = false;
        P.jumps = 1;
        P.st = 'move';
        sfx('jump');
        dust(P.x, P.z, 5);
        return true;
      }
      if (P.jumps < 2) {
        P.vy = TUNE.doubleJumpVel;
        P.jumps = 2;
        P.st = 'move';
        sfx('jump');
        burst(puffs, P.x, P.y + 0.6, P.z, 8, 3, 0.4, 0xffffff, 0.6, { a: 0.5 });
        return true;
      }
      return false;
    case 'dash': {
      if (!can('dash')) return false;
      const free = P.heartOn > 0;
      if (!free && P.stam < TUNE.dashCost) return false;
      if (!P.onG && !P.airDash) return false;
      if (!free) {
        P.stam -= TUNE.dashCost;
        P.stamDelay = 36;
      }
      if (!P.onG) P.airDash = false;
      const [wx, wz] = moveDir();
      if (Math.hypot(wx, wz) > 0.25) P.face = Math.atan2(wx, wz);
      P.st = 'dash';
      P.f = 0;
      P.vy = 0;
      P.perfDone = false;
      sfx('dash');
      burst(puffs, P.x, P.y + 0.5, P.z, 6, 2, 0.35, 0xffffff, 0.6, { a: 0.45 });
      return true;
    }
    case 's1':
      if (!can('skill') || P.cd1 > 0 || !P.onG) return false;
      startAttack('BW');
      return true;
    case 's2':
      if (!can('skill') || P.cd2 > 0 || !P.onG) return false;
      startAttack('FB');
      return true;
    case 'heart':
      if (P.heartOn > 0) {
        if (!can('skill')) return false;
        P.heartOn = 60;
        P.y = Math.max(P.y, 0.01);
        startAttack('SN');
        P.inv = 80;
        return true;
      }
      if (P.heart < 100) return false;
      P.heartOn = DATA.skills.dragonHeartFrames;
      P.inv = 50;
      sfx('heart');
      flash('gold', 14);
      G.shake = 0.5;
      G.slow = 14;
      ring(P.x, 0.3, P.z, 0.5, 16, 0.5, 0xffc93c);
      burst(sparks, P.x, P.y + 0.8, P.z, 60, 9, 0.7, 0xffb030, 0.5);
      for (const e of G.enemies)
        if (e.alive && !e.d.boss && Math.hypot(e.x - P.x, e.z - P.z) < 6) {
          e.st = 'stun';
          e.t = 0;
          const d = Math.hypot(e.x - P.x, e.z - P.z) || 1;
          e.vx = ((e.x - P.x) / d) * 9;
          e.vz = ((e.z - P.z) / d) * 9;
        }
      floatText(P.x, P.y + 2.2, P.z, 'DRAGON HEART', 'big');
      return true;
  }
  return false;
}
function toggleLock() {
  if (P.lock && P.lock.alive && P.lock.d.boss) {
    // on a boss: each press focuses the next weak spot (shots home in on it), then lets go
    cycleFocus();
    return;
  }
  P.focus = null;
  if (P.lock) {
    P.lock = null;
    return;
  }
  let best = null,
    bs = 1e9;
  for (const e of G.enemies) {
    if (!e.alive || e.d.static) continue;
    const d = Math.hypot(e.x - P.x, e.z - P.z),
      a = Math.abs(angDiff(cam.yaw, Math.atan2(e.x - P.x, e.z - P.z)));
    const sc = d + a * 6;
    if (d < 30 && sc < bs) {
      bs = sc;
      best = e;
    }
  }
  P.lock = best;
}
function hitFx(x, y, z, dmg, A, blocked) {
  if (blocked) {
    sfx('clang');
    burst(sparks, x, y, z, 8, 5, 0.25, 0xdfe8ff, 0.25);
    floatText(x, y + 0.5, z, 'GUARD', 'say');
    G.hitstop = Math.max(G.hitstop, 3);
    return;
  }
  const heavy = A.hs >= 6,
    W = weaponData(),
    col = A.fire || P.heartOn > 0 ? 0xff8a20 : P.weapon === 'emberfang' ? 0xffe9a0 : new T.Color(W.color).getHex();
  burst(sparks, x, y, z, heavy ? 22 : 11, heavy ? 9 : 6, 0.32, col, heavy ? 0.42 : 0.32, { g: 6 });
  burst(sparks, x, y, z, 3, 1, 0.14, 0xffffff, heavy ? 1.6 : 1.1);
  // streaks flying along the swing
  const fx = Math.sin(P.face),
    fz = Math.cos(P.face);
  TC.set(0xffffff);
  for (let i = 0; i < (heavy ? 8 : 4); i++) {
    const v = rnd(9, 16);
    sparks.emit(x, y, z, fx * v + rnd(-3, 3), rnd(-2, 4), fz * v + rnd(-3, 3), 0.16, TC, rnd(0.12, 0.22), 10, 6);
  }
  hitStar(x, y, z, heavy ? 2.0 : 1.3, A.fire ? 0xffb060 : 0xffffff);
  floatText(x, y + 0.6, z, String(Math.round(dmg)), heavy ? 'big' : '');
  G.hitstop = Math.max(G.hitstop, A.hs * (1 / 60));
  G.shake = Math.max(G.shake, heavy ? 0.32 : 0.1);
  sfx(heavy ? 'heavy' : 'hit', P.combo % 5);
  // style points: varied moves, finishers and air hits are worth more
  const first = !P.hitConfirm,
    name = P.name || 'x';
  if (first) styleUse(name);
  const vf = styleVariety(name);
  styleAdd(DATA.style.hit * vf + (P.onG ? 0 : DATA.style.air));
  if (first && A.finisher) {
    styleAdd(DATA.style.finisher * vf);
    camPunch(A.hs >= 9 ? 1.2 : 1);
  }
  if (A.heal && P.hp < TUNE.maxHp) {
    P.hp = Math.min(TUNE.maxHp, P.hp + A.heal);
    if (first) floatText(P.x, P.y + 2, P.z, '+' + A.heal, 'say');
  }
  P.hitConfirm = true;
  P.combo++;
  P.comboT = 150;
  G.stats.maxCombo = Math.max(G.stats.maxCombo, P.combo);
  $('combo').classList.remove('pop');
  void $('combo').offsetWidth;
  $('combo').classList.add('pop');
  if (P.heartOn <= 0) P.heart = Math.min(100, P.heart + (A.skill ? 1.2 : 2.6) * (1 + STY.rank * 0.15));
  if (!P.onG) {
    P.airDash = true;
    P.airWhiff = 0;
  }
}
/* finisher impact: the camera lunges in and the view kicks */
function camPunch(k) {
  G.punch = Math.max(G.punch, k);
  G.fovKick = Math.max(G.fovKick, 6 * k);
  G.slow = Math.max(G.slow, 7);
  flash('white', 4);
}
function doHits(A) {
  for (const e of G.enemies) {
    if (!e.alive || P.hitSet.has(e) || e.under) continue;
    if (e.d.boss) {
      if (bossHitTest(e, A)) P.hitSet.add(e);
      continue;
    }
    const dx = e.x - P.x,
      dz = e.z - P.z,
      d = Math.hypot(dx, dz);
    if (d - e.r > A.rng) continue;
    if (A.arc < 360 && d > e.r + 0.6 && Math.abs(angDiff(P.face, Math.atan2(dx, dz))) > (A.arc * PI) / 360) continue;
    if (Math.abs(e.y + e.h * 0.5 - (P.y + 0.8)) > (A.vr || 1.7) + e.h * 0.5) continue;
    P.hitSet.add(e);
    const dmg = A.dmg * (P.heartOn > 0 ? 1.15 : 1) * (1 + GEAR.power) * rnd(0.92, 1.08),
      n = d || 1;
    const r = enemyTakeHit(e, dmg, A, dx / n, dz / n);
    if (r > 0 && weaponData().chill) e.slowT = 150;
    hitFx(e.x - (dx / n) * e.r * 0.6, e.y + e.h * 0.55, e.z - (dz / n) * e.r * 0.6, r, A, r === 0);
    if (r > 0 && A.launch && e.air && (In.held.jump || A.rise)) P.follow = true;
    if (r > 0 && A.spike) P.vy = Math.max(P.vy, 5);
  }
}
function perfectDodge() {
  P.perfDone = true;
  P.perfect = 34;
  G.slow = 26;
  P.stam = Math.min(100, P.stam + 20);
  G.stats.perfect++;
  styleAdd(DATA.style.perfect);
  flash('blue', 22);
  sfx('perfect');
  floatText(P.x, P.y + 2.2, P.z, 'PERFECT', 'say');
  burst(sparks, P.x, P.y + 0.8, P.z, 24, 5, 0.5, 0x7cd0ff, 0.4);
}
function damagePlayer(dmg, fx, fz, heavy) {
  if (G.mode !== 'play' || P.st === 'dead') return false;
  if (P.st === 'dash' && P.f >= 2 && P.f <= 14) {
    if (!P.perfDone && P.f <= 11.5) perfectDodge();
    return false;
  }
  if (P.inv > 0 || P.st === 'down') return false;
  dmg *= 1 - GEAR.def;
  if (heavy || P.hp - dmg <= 0) P.fly = false;
  P.hp -= dmg;
  P.combo = 0;
  styleDrop();
  flash('red', 10);
  sfx('hurt');
  G.shake = Math.max(G.shake, heavy ? 0.5 : 0.25);
  G.hitstop = Math.max(G.hitstop, 0.06);
  floatText(P.x, P.y + 1.9, P.z, '-' + Math.round(dmg), 'hurt');
  burst(sparks, P.x, P.y + 0.9, P.z, 10, 5, 0.3, 0xff6a5c, 0.35);
  const dx = P.x - fx,
    dz = P.z - fz,
    d = Math.hypot(dx, dz) || 1;
  if (P.hp <= 0) {
    P.hp = 0;
    P.st = 'dead';
    P.f = 0;
    P.vx = (dx / d) * 2;
    P.vz = (dz / d) * 2;
    P.vy = 7;
    P.onG = false;
    G.endT = 130;
    G.slow = 40;
    return true;
  }
  if (P.st === 'charge' && !heavy) {
    P.inv = 12;
    return true;
  } // armour while charging
  P.atk = null;
  P.trail = false;
  P.spin = P.flip = 0;
  if (heavy) {
    P.st = 'down';
    P.f = 0;
    P.vx = (dx / d) * 8;
    P.vz = (dz / d) * 8;
    P.vy = 7.5;
    P.onG = false;
  } else {
    P.st = 'hit';
    P.f = 0;
    P.vx = (dx / d) * 5;
    P.vz = (dz / d) * 5;
  }
  P.inv = heavy ? 70 : 34;
  return true;
}
function diveLand() {
  G.hitstop = Math.max(G.hitstop, 0.1);
  G.shake = 0.5;
  sfx('slam');
  dust(P.x, P.z, 16);
  ring(P.x, 0.15, P.z, 0.4, 14, 0.32, P.heartOn > 0 ? 0xff9a30 : 0xfff0c0);
  const A = { dmg: 34, hs: 6, kd: true, rng: 3.6, pierce: true };
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const dx = e.x - P.x,
      dz = e.z - P.z,
      d = Math.hypot(dx, dz);
    if (d - e.r > 3.6 || e.y > 2.5) continue;
    if (e.d.boss) {
      bossHitTest(e, Object.assign({ arc: 360 }, A));
      continue;
    }
    const r = enemyTakeHit(e, A.dmg * rnd(0.95, 1.05), A, dx / (d || 1), dz / (d || 1));
    hitFx(e.x, e.y + e.h * 0.5, e.z, r, A, r === 0);
  }
  startAttack('DVL');
}
/* Ground Wave / Gale Cleave: a shockwave that runs along the ground and hits everything in its path */
const WAVE_A = { hs: 5, kd: true, dmg: 0, arc: 360, rng: 1.6 };
function updateWaves(s) {
  const dt = s / 60;
  for (let i = G.waves.length - 1; i >= 0; i--) {
    const w = G.waves[i],
      step = 21 * dt;
    w.d += step;
    w.x += w.dx * step;
    w.z += w.dz * step;
    if (w.d >= w.nextSpike) {
      w.nextSpike += 0.9;
      if (w.wind) {
        burst(puffs, w.x, 0.4, w.z, 3, 3, 0.5, 0xffffff, 0.8, { a: 0.6, up: 2 });
        burst(sparks, w.x, 0.6, w.z, 3, 4, 0.3, 0x9fdcff, 0.3);
      } else {
        spike(w.x + rnd(-0.3, 0.3), w.z + rnd(-0.3, 0.3), rnd(0.8, 1.3), 'rock');
        dust(w.x, w.z, 2);
      }
    }
    for (const e of G.enemies) {
      if (!e.alive || w.hit.has(e) || e.under) continue;
      const d = Math.hypot(e.x - w.x, e.z - w.z);
      if (e.d.boss) {
        if (d < e.r + 1) {
          w.hit.add(e);
          e.hp -= w.dmg * 0.6;
          e.flash = 3;
          hitFx(w.x, 1.2, w.z, w.dmg * 0.6, WAVE_A, false);
          if (e.hp <= 0 && e.alive) bossDie(e);
        }
        continue;
      }
      if (d > e.r + 1.3 || e.y > 2.6) continue;
      w.hit.add(e);
      WAVE_A.dmg = w.dmg;
      const r = enemyTakeHit(e, w.dmg, WAVE_A, w.dx, w.dz);
      hitFx(e.x, e.y + e.h * 0.5, e.z, r, WAVE_A, r === 0);
    }
    if (w.d >= w.len || !groundAt(w.x, w.z)) G.waves.splice(i, 1);
  }
}
function updatePlayer(s) {
  const dt = s / 60,
    play = G.mode === 'play' && !G.cine;
  P.inv = Math.max(0, P.inv - s);
  P.perfect = Math.max(0, P.perfect - s);
  P.cd1 = Math.max(0, P.cd1 - s);
  P.cd2 = Math.max(0, P.cd2 - s);
  P.chill = Math.max(0, P.chill - s);
  if (P.chill > 0 && Math.random() < 0.3)
    puffs.emit(
      P.x + rnd(-0.4, 0.4),
      P.y + rnd(0.3, 1.6),
      P.z + rnd(-0.4, 0.4),
      0,
      -0.4,
      0,
      0.6,
      TC.set(0xe8f6ff),
      0.25,
      0,
      0,
      0.8,
    );
  if (P.chainT > 0) {
    P.chainT -= s;
    if (P.chainT <= 0 && P.st !== 'attack') P.last = null;
  }
  if (P.heartOn > 0) {
    P.heartOn -= s;
    if (P.heartOn <= 0) {
      P.heartOn = 0;
      P.heart = 0;
    } else P.heart = Math.min(100, P.heartOn / (DATA.skills.dragonHeartFrames / 100));
  }
  if (P.comboT > 0) {
    P.comboT -= s;
    if (P.comboT <= 0) P.combo = 0;
  }
  if (P.stamDelay > 0) P.stamDelay -= s;
  else P.stam = Math.min(100, P.stam + TUNE.staminaRegen * dt);
  if (P.lock && !P.lock.alive) P.lock = null;
  const [wx, wz] = play ? moveDir() : [0, 0],
    ml = Math.hypot(wx, wz),
    fx = Math.sin(P.face),
    fz = Math.cos(P.face);
  P.trail = false;
  switch (P.st) {
    case 'move': {
      const sp = (P.heartOn > 0 ? TUNE.heartRunSpeed : TUNE.runSpeed) * (P.chill > 0 ? 0.7 : 1),
        k = P.onG ? 16 : 5;
      P.vx = damp(P.vx, wx * sp, k, dt);
      P.vz = damp(P.vz, wz * sp, k, dt);
      if (ml > 0.2) P.face += clamp(angDiff(P.face, Math.atan2(wx, wz)), -16 * dt, 16 * dt);
      break;
    }
    case 'charge':
      P.f += s;
      P.vx = damp(P.vx, 0, 14, dt);
      P.vz = damp(P.vz, 0, 14, dt);
      if (ml > 0.2) P.face += clamp(angDiff(P.face, Math.atan2(wx, wz)), -8 * dt, 8 * dt);
      if (P.f > 26) {
        const a = rnd(TAU);
        sparks.emit(
          P.x + Math.cos(a) * 1.3,
          P.y + rnd(0.2, 1.6),
          P.z + Math.sin(a) * 1.3,
          -Math.cos(a) * 4,
          0,
          -Math.sin(a) * 4,
          0.3,
          TC.set(0xffb030),
          0.35,
          0,
          0,
        );
      }
      if (!In.held.heavy || P.f >= 60 || !play) startAttack(P.f >= 28 ? 'DF' : 'LA');
      break;
    case 'attack': {
      const A = P.atk,
        f0 = P.f,
        end = A.st + A.ac + A.rc;
      P.f += s * (P.heartOn > 0 ? 1.25 : 1) * (A.skill ? 1 : weaponData().speed);
      let sp = 0;
      if (P.f < A.st + A.ac) {
        sp = A.step;
        if (A.lunge && P.f >= A.st) sp = A.lunge;
      }
      if (P.tgt && P.tgt.alive && !A.pierce) {
        const d = Math.hypot(P.tgt.x - P.x, P.tgt.z - P.z) - P.tgt.r;
        if (d < 1.1) sp = 0;
        else sp = Math.min(sp + 3, Math.max(sp, d * 4));
        if (P.f > A.st + A.ac) sp = 0;
      }
      if (P.name === 'BW') {
        if (ml > 0.2) P.face += clamp(angDiff(P.face, Math.atan2(wx, wz)), -3 * dt, 3 * dt);
      }
      const k = sp > 0 ? 30 : 12;
      P.vx = damp(P.vx, Math.sin(P.face) * sp, k, dt);
      P.vz = damp(P.vz, Math.cos(P.face) * sp, k, dt);
      const act = P.f >= A.st && f0 < A.st + A.ac;
      if (act && !P.arcDone) {
        // the swing's light arc, and the travelling shockwave of Ground Wave / Gale Cleave
        P.arcDone = true;
        const W = weaponData();
        if (A.shot) fireShot(W, A.left);
        else spawnArc(A, A.fire || P.heartOn > 0 ? 0xffa040 : W.color);
        if (A.wave)
          G.waves.push({
            x: P.x + fx * 1.2,
            z: P.z + fz * 1.2,
            dx: fx,
            dz: fz,
            d: 0,
            len: A.wave.len * (W.reach || 1),
            dmg: A.wave.dmg * (W.power || 1),
            wind: !!A.wave.wind,
            hit: new Set(),
            nextSpike: 0,
          });
      }
      if (act) {
        P.trail = !A.breath && !A.shot;
        if (A.multi && Math.floor((P.f - A.st) / A.multi) !== Math.floor((f0 - A.st) / A.multi)) P.hitSet.clear();
        if (A.dmg) doHits(A);
        if (A.breath)
          for (let i = 0; i < 2; i++) {
            const a = P.face + rnd(-0.4, 0.4),
              v = rnd(9, 15);
            sparks.emit(
              P.x + fx * 0.7,
              P.y + 1.15,
              P.z + fz * 0.7,
              Math.sin(a) * v,
              rnd(-1, 1.5),
              Math.cos(a) * v,
              0.42,
              TC.set(Math.random() < 0.5 ? 0xff5a10 : 0xffa020),
              rnd(0.3, 0.7),
              -2,
              1.2,
              0.7,
            );
          }
        if (A.fire && !A.breath && Math.random() < 0.8)
          sparks.emit(
            P.x + rnd(-0.8, 0.8),
            P.y + rnd(0.2, 1.6),
            P.z + rnd(-0.8, 0.8),
            rnd(-1, 1),
            rnd(1, 4),
            rnd(-1, 1),
            0.4,
            TC.set(0xff7a18),
            0.5,
            -2,
            1,
          );
      }
      if (A.quake && f0 < A.st && P.f >= A.st) {
        ring(P.x + fx * 1.4, 0.12, P.z + fz * 1.4, 0.3, 11, 0.28, 0xfff0c0);
        dust(P.x + fx * 1.4, P.z + fz * 1.4, 10);
        G.shake = Math.max(G.shake, 0.25);
      }
      if (A.spin) P.spin = TAU * A.spin[2] * smooth((P.f - A.spin[0]) / (A.spin[1] - A.spin[0]));
      else P.spin = 0;
      if (A.flip) P.flip = TAU * A.flip[2] * smooth((P.f - A.flip[0]) / (A.flip[1] - A.flip[0]));
      else P.flip = 0;
      if (P.follow && P.f >= A.st + A.ac) {
        P.follow = false;
        P.vy = 14;
        P.onG = false;
        P.jumps = 1;
        P.st = 'move';
        P.chainT = 0;
        P.spin = 0;
        sfx('jump');
        break;
      }
      // arm cannons keep firing while the button is held
      if (A.shot && P.f >= A.cx && play && In.held[P.armBtn] && armAction(P.armSide)) break;
      if (P.f >= end || (ml > 0.3 && P.f >= A.st + A.ac + A.rc * 0.66 && !A.dodgeOnly)) {
        if (A.air && !P.hitConfirm) P.airWhiff++;
        P.st = 'move';
        P.chainT = 22;
        P.spin = P.flip = 0;
      }
      break;
    }
    case 'dash': {
      const f0 = P.f;
      P.f += s;
      const v = 24.6 * Math.max(0, 1 - P.f / 22);
      P.vx = fx * v;
      P.vz = fz * v;
      P.vy = 0;
      if (Math.floor(P.f / 2) !== Math.floor(f0 / 2))
        puffs.emit(P.x, P.y + 0.7, P.z, 0, 0.3, 0, 0.3, TC.set(P.heartOn > 0 ? 0xffc060 : 0xffffff), 0.8, 0, 0, 0.4);
      if (P.f >= 22) {
        P.st = 'move';
      }
      break;
    }
    case 'dive':
      P.f += s;
      P.trail = P.f > 6;
      if (P.f < 8) {
        P.vx = damp(P.vx, 0, 12, dt);
        P.vz = damp(P.vz, 0, 12, dt);
        P.vy = 1.5;
      } else {
        P.vy = -38;
        P.vx = fx * 5;
        P.vz = fz * 5;
        for (const e of G.enemies)
          if (
            e.alive &&
            e.air &&
            !e.d.boss &&
            !P.hitSet.has(e) &&
            Math.hypot(e.x - P.x, e.z - P.z) < 2 &&
            Math.abs(e.y - P.y) < 2.2
          ) {
            P.hitSet.add(e);
            e.vy = -32;
            e.slam = true;
            e.hp -= 12;
            hitFx(e.x, e.y + 0.5, e.z, 12, { hs: 4, dmg: 12 }, false);
          }
      }
      break;
    case 'hit':
      P.f += s;
      P.vx = damp(P.vx, 0, 6, dt);
      P.vz = damp(P.vz, 0, 6, dt);
      if (P.f >= 24) P.st = 'move';
      break;
    case 'down':
      P.f += s;
      if (P.onG) {
        P.vx = damp(P.vx, 0, 8, dt);
        P.vz = damp(P.vz, 0, 8, dt);
      }
      if (P.f >= 52 && P.onG) {
        P.st = 'move';
        P.inv = Math.max(P.inv, 30);
      }
      break;
    case 'dead':
      P.f += s;
      if (P.onG) {
        P.vx = damp(P.vx, 0, 6, dt);
        P.vz = damp(P.vz, 0, 6, dt);
      }
      break;
  }
  updateFlight(dt, wx, wz);
  if (!P.onG && P.st !== 'dash' && P.st !== 'dive' && !P.fly) {
    P.vy -= (P.st === 'attack' ? 9 : TUNE.gravity) * dt;
    if (P.st === 'move' && In.held.jump && P.vy < -TUNE.glideFallSpeed && !G.cine) P.vy = -TUNE.glideFallSpeed;
    if (P.st === 'attack' && P.vy < -3) P.vy = -3;
  }
  const ox = P.x,
    oz = P.z;
  P.x += P.vx * dt;
  P.y += P.vy * dt;
  P.z += P.vz * dt;
  const onGround = groundAt(P.x, P.z);
  if (P.onG && !onGround && P.y <= 0.01) {
    // never walk off an edge: slide along it instead
    if (groundAt(P.x, oz)) P.z = oz;
    else if (groundAt(ox, P.z)) P.x = ox;
    else {
      P.x = ox;
      P.z = oz;
    }
  }
  if (P.y <= 0 && P.y > -1.2 && groundAt(P.x, P.z)) {
    // a little landing forgiveness on ledges
    P.y = 0;
    if (!P.onG) {
      P.onG = true;
      P.jumps = 0;
      P.airDash = true;
      P.airI = 0;
      P.airWhiff = 0;
      P.fly = false;
      dust(P.x, P.z, 6);
      if (Snd.ctx) Snd.noise(0.12, 0.12, 700, 120, 0.9); // landing thud
      if (P.st === 'dive') diveLand();
      else if (P.st === 'attack' && P.atk.air) {
        P.st = 'move';
        P.spin = 0;
      }
    }
    if (P.vy < 0) P.vy = 0;
  } else if (P.onG && P.y <= 0 && !groundAt(P.x, P.z)) P.onG = false;
  else if (P.y > 0.01) P.onG = false;
  // push out of enemies, keep inside arena
  if (P.st !== 'dash' && P.st !== 'dead')
    for (const e of G.enemies) {
      if (!e.alive || e.air || (Math.abs(e.y - P.y) > 1.2 && !e.d.boss)) continue;
      if (e.d.boss && P.y > 5.5) continue;
      const dx = P.x - e.x,
        dz = P.z - e.z,
        d = Math.hypot(dx, dz),
        m = e.r * (e.d.boss ? 0.85 : 0.8) + 0.35;
      if (d < m && d > 0.001) {
        const k = e.d.boss ? 1 : 0.5;
        P.x += (dx / d) * (m - d) * k;
        P.z += (dz / d) * (m - d) * k;
      }
    }
  levelConstrain();
  if (P.onG && P.y <= 0.01 && !groundAt(P.x, P.z)) {
    P.x = ox;
    P.z = oz;
  }
}
function animDarren(dt, rdt) {
  const D = P.m,
    tp = P.tp,
    cp = P.cp,
    t = G.time;
  Object.assign(tp, BASE);
  let k = 12;
  const spd = Math.hypot(P.vx, P.vz),
    air = !P.onG;
  let lie = 0;
  switch (P.st) {
    case 'move':
      if (!air) {
        if (spd > 0.9) {
          P.runPh += spd * dt * 2.25;
          footstep(P.runPh, spd);
          const sn = Math.sin(P.runPh);
          tp.lL = sn * 0.95;
          tp.lR = -sn * 0.95;
          tp.by = Math.abs(Math.cos(P.runPh)) * 0.08;
          tp.bp = 0.24;
          tp.aLx = -sn * 0.75;
          tp.aRx = -0.55 + sn * 0.3;
          tp.wing = 0.95;
          tp.wf = Math.sin(P.runPh * 2) * 0.18;
          tp.tail = 0.1;
          tp.ty = sn * 0.22;
          tp.br = sn * 0.05;
          k = 20;
        } else {
          tp.by = Math.sin(t * 2.2) * 0.018;
          tp.wf = Math.sin(t * 2.2) * 0.14;
          tp.ty = Math.sin(t * 1.5) * 0.28;
          tp.hy = Math.sin(t * 0.7) * 0.12;
          tp.hp = Math.sin(t * 1.1) * 0.04;
        }
      } else {
        const gl = In.held.jump && P.vy < 0 && G.mode === 'play';
        tp.lL = 0.55;
        tp.lR = -0.35;
        tp.aLz = 0.9;
        tp.aRz = -0.9;
        tp.aRx = -0.5;
        tp.tail = 0.05;
        if (P.fly) {
          // flying: big slow wing beats, body leaning into the direction of travel
          const fs = Math.min(1, spd / 9);
          tp.wing = 0.1;
          const wr = In.held.jump ? 16 : 11;
          tp.wf = Math.sin(t * wr) * 0.85;
          if (Math.floor((t * wr) / TAU) !== P.wingN) {
            P.wingN = Math.floor((t * wr) / TAU);
            wingBeat();
          }
          tp.bp = 0.15 + fs * 0.7;
          tp.lL = 0.5 + fs * 0.6;
          tp.lR = 0.4 + fs * 0.6;
          tp.hp = -fs * 0.45;
          tp.tail = 0.02;
          tp.aLz = 0.6;
          tp.aRz = -0.6;
        } else if (gl) {
          tp.wing = 0;
          tp.wf = 0.22 + Math.sin(t * 5) * 0.06;
          tp.bp = 0.55;
          tp.lL = 0.8;
          tp.lR = 0.7;
        } else {
          tp.wing = 0.2;
          tp.wf = Math.sin(t * 30) * 0.75;
          tp.bp = P.vy > 0 ? -0.12 : 0.2;
        }
        k = 16;
      }
      break;
    case 'charge':
      Object.assign(tp, {
        by: -0.2,
        bp: 0.3,
        byw: -0.8,
        aRz: -1.0,
        aRy: -1.0,
        aRx: -0.1,
        swx: 1.5,
        lL: 0.3,
        lR: -0.3,
        wing: 0.2,
        wf: 0.3 + Math.sin(t * 40) * 0.05,
      });
      tp.br = Math.sin(t * 50) * 0.02 * Math.min(1, P.f / 28);
      k = 16;
      break;
    case 'attack': {
      const A = P.atk,
        ph = P.f < A.st ? 0 : P.f < A.st + A.ac ? 1 : 2;
      Object.assign(tp, POSE[A.pose][ph]);
      k = ph === 0 ? 26 : ph === 1 ? 48 : 13;
      if (A.pose === 'breath' && ph === 1) tp.hy = Math.sin(t * 22) * 0.25;
      if (air) {
        tp.lL = 0.7;
        tp.lR = 0.35;
        tp.wing = 0.15;
        tp.wf = Math.sin(t * 30) * 0.6;
      }
      break;
    }
    case 'dash':
      Object.assign(tp, {
        bp: 0.85,
        wing: 1.25,
        wf: -0.1,
        aRx: 0.7,
        aLx: 0.7,
        aRz: -0.3,
        lL: 0.9,
        lR: 0.7,
        tail: 0.02,
        by: -0.1,
        hp: -0.5,
        swx: 1.3,
      });
      k = 40;
      break;
    case 'dive':
      Object.assign(tp, {
        bp: 1.25,
        aRx: -1.75,
        aRz: 0,
        swx: 1.57,
        aLx: 0.6,
        wing: 1.2,
        lL: 0.9,
        lR: 0.9,
        tail: 0.02,
        hp: -0.6,
      });
      k = 34;
      break;
    case 'hit':
      Object.assign(tp, { bp: -0.5, hp: -0.35, aRx: -1.3, aLx: -1.3, aLz: 0.7, wing: 0.1, by: -0.05 });
      k = 30;
      break;
    case 'down':
    case 'dead':
      Object.assign(tp, { aRx: -1.6, aLx: -1.6, aLz: 0.8, aRz: -0.8, wing: 0, lL: -0.4, lR: 0.3 });
      lie = P.onG ? -1.45 : -0.8 - P.f * 0.05;
      k = 20;
      break;
  }
  for (const key in cp) cp[key] = damp(cp[key], tp[key], k, dt);
  D.root.position.set(P.x, P.y, P.z);
  D.root.rotation.y = P.face + P.spin;
  D.root.visible = !(
    P.inv > 0 &&
    P.st !== 'dead' &&
    P.heartOn <= 0 &&
    Math.floor(G.time * 22) % 2 === 0 &&
    P.st !== 'attack'
  );
  P.lie = damp(P.lie || 0, lie, 14, rdt);
  D.piv.rotation.x = P.flip + P.lie;
  D.piv.position.y = 0.8 + (P.lie ? P.lie * 0.28 : 0);
  D.rig.position.y = -0.8 + cp.by;
  D.sword.rotation.set(cp.swx, cp.swy, cp.swz);
  if (D.swordL) D.swordL.rotation.set(cp.swxL, 0, 0);
  if (D.skin) applySkin(D, cp, t);
  else {
    D.body.rotation.set(cp.bp, cp.byw, cp.br);
    D.head.rotation.set(cp.hp - cp.bp * 0.45, cp.hy - cp.byw * 0.5, 0);
    D.armR.rotation.set(cp.aRx, cp.aRy, cp.aRz);
    D.armL.rotation.set(cp.aLx, cp.aLy, cp.aLz);
    D.legL.rotation.x = cp.lL;
    D.legR.rotation.x = cp.lR;
    D.wingL.rotation.set(0, cp.wing, cp.wf);
    D.wingR.rotation.set(0, -cp.wing, -cp.wf);
    for (let i = 0; i < D.tail.length; i++) {
      const sg = D.tail[i];
      sg.rotation.x = i === 0 ? -0.55 + cp.bp * 0.3 : cp.tail * (1 + i * 0.1) + Math.sin(t * 3 - i * 0.7) * 0.03;
      sg.rotation.y = cp.ty * 0.34 + Math.sin(t * 2.4 - i * 0.6) * 0.04;
    }
    D.scarfT.rotation.x = -0.5 - Math.min(1.1, spd * 0.09) + Math.sin(t * 9) * 0.08 * (1 + spd * 0.2);
    D.scarfT.rotation.z = Math.sin(t * 7) * 0.1;
  }
  if (D.blobs)
    D.blobs.forEach((b, i) => {
      const w = 1 + Math.sin(t * 9 + i * 0.9) * 0.08 + (P.trail ? Math.sin(t * 30 + i) * 0.1 : 0);
      b.scale.x = b.userData.sx || (b.userData.sx = b.scale.x);
      b.scale.x = b.userData.sx * w;
      b.scale.y = (b.userData.sy || (b.userData.sy = b.scale.y)) / Math.sqrt(w);
    });
  const hot =
    P.heartOn > 0 ? 1.0 + Math.sin(t * 18) * 0.25 : P.st === 'charge' && P.f > 28 ? 1.0 : P.trail ? 0.6 : 0.18;
  D.bladeMat.emissiveIntensity = damp(D.bladeMat.emissiveIntensity, hot, 14, rdt);
  if (P.heartOn > 0 && Math.random() < 0.6) {
    D.sTip.getWorldPosition(V1);
    D.sBase.getWorldPosition(V2);
    V1.lerp(V2, Math.random());
    sparks.emit(V1.x, V1.y, V1.z, rnd(-0.5, 0.5), rnd(1, 3), rnd(-0.5, 0.5), 0.35, TC.set(0xff8a20), 0.45, -1, 1);
  }
  if (P.trail) {
    D.root.updateWorldMatrix(true, true);
    const left = P.atk && P.atk.left && D.sBaseL;
    (left ? D.sBaseL : D.sBase).getWorldPosition(V1);
    (left ? D.sTipL : D.sTip).getWorldPosition(V2);
    trail.push(V1, V2);
  }
  trail.update(rdt, P.heartOn > 0);
}

/* ---------- enemies ---------- */
// r radius, h height, w weight (2+ = heavy, ignores light hits), sc model scale. Bosses share updateBoss() and differ by cfg.
const EDEF = {
  puff: { name: 'Puffcap', hp: 60, r: 0.5, h: 1.0, w: 1, build: () => buildPuffcap(), sc: 1.15 },
  gust: { name: 'Gustling', hp: 45, r: 0.45, h: 0.9, w: 1, build: buildGustling, sc: 1.2, fly: true },
  bolt: { name: 'Boltail', hp: 80, r: 0.5, h: 1.0, w: 1, build: buildBoltail, sc: 1.2 },
  thorn: { name: 'Thornback', hp: 300, r: 1.0, h: 2.1, w: 2, build: buildThornback, sc: 1 },
  bark: { name: 'Barkling', hp: 90, r: 0.55, h: 1.1, w: 1, build: buildBarkling, sc: 1.1 },
  snow: { name: 'Snowcap', hp: 55, r: 0.5, h: 1.0, w: 1, build: buildSnowcap, sc: 1.1 },
  boss: {
    name: 'Grumblepeak',
    hp: 4500,
    r: 2.6,
    h: 6,
    w: 9,
    build: buildBoss,
    sc: 1,
    boss: true,
    cfg: {
      throwKind: 'boulder',
      special: 'stomp',
      summon: 'puff',
      talk: 'boss',
      part: 'CRYSTAL BREAK',
      parts: 'Crystals',
      kneel: 'Fly up and strike while he is down',
      p2: 'Boulders and shockwaves incoming. Break both arm crystals',
    },
  },
  knot: {
    name: 'Old Knotroot',
    hp: 2800,
    r: 2.4,
    h: 5.5,
    w: 9,
    build: buildKnotroot,
    sc: 1,
    boss: true,
    cfg: {
      throwKind: 'acorn',
      special: 'roots',
      summon: 'bark',
      talk: 'knot',
      part: 'KNOT BREAK',
      parts: 'Sap knots',
      kneel: 'Strike the glowing heart-knot on his back',
      p2: 'Roots will burst from the ground. Watch for the red marks',
    },
  },
};
// the Titanic Scion (Cloud Utopia): a bigger, tougher Grumblepeak with violet crystals
EDEF.titan = Object.assign({}, EDEF.boss, {
  name: 'Titanic Grumblepeak',
  hp: 9000,
  sc: 1.35,
  build: buildTitan,
  cfg: Object.assign({}, EDEF.boss.cfg, {
    summon: 'gust',
    talk: 'titan',
    part: 'TITAN CRYSTAL BREAK',
    p2: 'It stomps! Jump or fly over the shockwaves',
  }),
});
// resource crystals: they never move or attack; break them for parts
EDEF.node = { name: 'Resource Crystal', hp: 60, r: 0.8, h: 1.5, w: 9, build: buildNode, sc: 1, static: true };
for (const k in EDEF) if (DATA.enemies[k] && DATA.enemies[k].name) EDEF[k].name = DATA.enemies[k].name;
const ATTACKING = { wind: 1, atk: 1, dig: 1, mark: 1 }; // states that hold an attack turn
const PMAT = {
  snow: toy(0xf2fbff, { roughness: 0.5, clearcoat: 0.2 }),
  acorn: toy(0x8a5a2c, { roughness: 0.5 }),
  feather: new T.MeshBasicMaterial({ color: 0x9ff2e4 }),
};
function spawnEnemy(type, x, z, o) {
  o = o || {};
  const d = EDEF[type],
    dd = DATA.enemies[type] || {},
    EL = DATA.elite,
    elite = !!o.elite && !d.boss,
    hp0 = Math.round((dd.hp || d.hp) * DIFF().hp * (elite ? EL.hp : 1)),
    sc = d.sc * (elite ? EL.size : 1),
    e = {
      type,
      d,
      x,
      y: 0,
      z,
      home: islandAt(x, z),
      vx: 0,
      vy: 0,
      vz: 0,
      hp: hp0,
      max: hp0,
      sc,
      r: d.r * sc,
      h: d.h * sc,
      elite,
      dm: DIFF().damage * (elite ? EL.damage : 1),
      poise: (dd.poise || 0) + (elite ? EL.poise : 0),
      st: 'spawn',
      t: 0,
      face: Math.atan2(P.x - x, P.z - z),
      air: false,
      flash: 0,
      wind: false,
      alive: true,
      dead: 0,
      cool: rnd(30, 110),
      slam: false,
      m: d.build(o),
      ph: rnd(TAU),
      broken: false,
      shots: 0,
      tumble: 0,
      lie: 0,
      flinch: 0,
      tok: false,
      rep: 0,
      under: false,
      shown: 0,
    };
  e.poiseV = e.poise;
  if (elite) {
    const c = buildCrown();
    c.position.y = d.h * (type === 'gust' ? 0.95 : 1.0) + 0.02;
    (e.m.b || e.m.root).add(c);
    e.m.crown = c;
    const ring = new T.Mesh(
      new T.RingGeometry(0.7, 0.95, 32),
      new T.MeshBasicMaterial({ color: 0xffc93c, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    ring.rotation.x = -PI / 2;
    ring.position.y = 0.04;
    e.m.root.add(ring);
    e.m.eliteRing = ring;
  }
  e.m.root.scale.setScalar(0.01);
  e.m.root.position.set(x, 0, z);
  scene.add(e.m.root);
  G.enemies.push(e);
  burst(puffs, x, 0.6, z, 10, 3, 0.5, elite ? 0xffe08a : 0xffffff, 0.9, { a: 0.6 });
  sfx('pop');
  if (d.boss) {
    G.boss = e;
    e.cfg = d.cfg;
    e.pose = { aL: 0, aR: 0, aLz: 0, aRz: 0, tp: 0, ty: 0, y: 0 };
    e.phase = 1;
    e.kneel = 0;
    e.summonT = 0;
    e.chain = 0;
    e.st = 'idle';
    e.cool = 90;
    e.m.root.scale.setScalar(d.sc || 1);
    $('bossN').textContent = d.name;
  }
  return e;
}
// enemy hits Darren (scaled by difficulty and by Elite)
function hurtP(e, dmg, fx, fz, heavy) {
  return damagePlayer(dmg * (e.dm || 1), fx, fz, heavy);
}
// attack turns: only a few enemies may wind up at once (Settings > difficulty), the rest circle and wait
function canToken(e) {
  if (e.tok) return true;
  let n = 0;
  for (const o of G.enemies) if (o.alive && o.tok) n++;
  return n < DIFF().attackers + (e.elite ? 1 : 0);
}
function token(e) {
  if (!canToken(e)) return false;
  e.tok = true;
  return true;
}
function killEnemy(e) {
  e.alive = false;
  e.tok = false;
  e.under = false;
  e.dead = 0.01;
  sfx('pop');
  burst(puffs, e.x, e.y + e.h * 0.5, e.z, 14, 4, 0.55, 0xffffff, 1, { a: 0.7 });
  burst(sparks, e.x, e.y + e.h * 0.5, e.z, e.elite ? 40 : 16, 7, 0.5, 0xffe08a, 0.4, { g: 8 });
  if (P.lock === e) P.lock = null;
  if (G.mode !== 'play') return;
  // parts for the Skyforge
  dropParts(e.drops || DATA.drops[e.type], e.x, e.y + e.h * 0.6, e.z);
  if (e.elite) dropParts(DATA.drops.elite, e.x, e.y + e.h * 0.6, e.z);
  if (window.advOnKill) advOnKill(e);
  if (e.d.static) {
    sfx('break');
    return;
  }
  styleAdd(DATA.style.kill * (e.elite ? 3 : 1));
  const heal = e.elite ? 40 : Math.random() < 0.28 ? 14 : 0;
  if (heal && P.hp < TUNE.maxHp) {
    const h = Math.min(heal, TUNE.maxHp - P.hp);
    P.hp += h;
    floatText(e.x, e.y + 1.6, e.z, '+' + Math.round(h), 'say');
  }
}
function enemyTakeHit(e, dmg, A, nx, nz) {
  const d = e.d;
  if (e.type === 'thorn' && !e.broken && e.st !== 'rec' && e.st !== 'stun' && e.st !== 'down') {
    const front = Math.abs(angDiff(e.face, Math.atan2(-nx, -nz))) < 1.25;
    if (front && !A.breath) {
      e.hp = Math.max(1, e.hp - dmg * 0.12);
      e.flash = 3;
      return 0;
    }
  }
  e.hp -= dmg;
  e.flash = 5;
  e.shown = 300;
  G.tgt = e;
  G.tgtT = 200;
  if (e.type === 'thorn' && !e.broken && (e.hp < e.max * 0.5 || (A.breath && e.hp < e.max * 0.8))) {
    e.broken = true;
    e.m.spikes.forEach(s => (s.visible = false));
    burst(sparks, e.x, 1.6, e.z, 26, 8, 0.6, 0xfff0d6, 0.5, { g: 10 });
    sfx('break');
    floatText(e.x, 2.8, e.z, 'SHELL BREAK', 'big');
    e.st = 'stun';
    e.t = -50;
  }
  if (e.hp <= 0) {
    killEnemy(e);
    return dmg;
  }
  if (d.monster) return castHit(e, dmg, A, nx, nz); // big Cloud Utopia monsters (src/cast.js)
  if (d.w >= 2) {
    if (A.hs >= 6 || e.broken) {
      if (e.st !== 'stun') {
        e.st = 'stun';
        e.t = 0;
      }
      e.vx = nx * 3;
      e.vz = nz * 3;
      e.flinch = 1;
    }
    return dmg;
  }
  // poise: light hits only make tougher enemies flinch once enough damage has piled up; Elites keep attacking through them
  const strong = A.hs >= 6 || A.kd || A.launch || A.spike;
  e.poiseV -= dmg;
  const armour = e.elite && ATTACKING[e.st] && !strong;
  if (!strong && (armour || e.poiseV > 0)) {
    e.flinch = Math.min(1, e.flinch + 0.55);
    if (!ATTACKING[e.st]) {
      e.x += nx * 0.18;
      e.z += nz * 0.18;
    }
    return dmg;
  }
  if (e.poise > 0 && !strong) floatText(e.x, e.y + e.h + 0.5, e.z, 'STAGGER', 'say');
  e.poiseV = e.poise;
  e.flinch = 1;
  e.wind = false;
  e.under = false;
  e.rep = 9;
  if (A.spike && (e.air || e.y > 0.4)) {
    e.st = 'air';
    e.air = true;
    e.vy = -30;
    e.vx = nx;
    e.vz = nz;
    e.slam = true;
    e.bounced = false;
  } else if (A.launch) {
    e.vy = A.launch;
    e.air = true;
    e.st = 'air';
    e.vx = nx * 1.2;
    e.vz = nz * 1.2;
    e.slam = false;
    e.bounced = false;
  } else if (e.air) {
    e.vy = 4.6;
    e.vx = nx * 1.4;
    e.vz = nz * 1.4;
  } else if (A.kd || A.spike) {
    e.st = 'air';
    e.air = true;
    e.vy = 6.5;
    e.vx = nx * 8;
    e.vz = nz * 8;
    e.slam = false;
    e.bounced = false;
  } else {
    e.st = 'stun';
    e.t = 0;
    e.vx = nx * 3.4;
    e.vz = nz * 3.4;
    if (d.fly && e.y > 1) {
      e.st = 'air';
      e.air = true;
      e.vy = 2;
      e.bounced = true;
    }
  }
  return dmg;
}
const projMat = new T.MeshBasicMaterial({ color: 0xffe14a });
function spawnProj(x, y, z, vx, vy, vz, o) {
  const big = o.boulder || o.lob;
  const m = new T.Mesh(
    big ? (o.mat ? GEO.mid : GEO.rock) : GEO.mid,
    o.mat ? PMAT[o.mat] : o.boulder ? MAT.stone : projMat,
  );
  m.scale.setScalar(o.r);
  if (o.mat === 'acorn') m.scale.set(o.r * 0.85, o.r, o.r * 0.85);
  m.position.set(x, y, z);
  m.castShadow = !!big;
  scene.add(m);
  G.projs.push(Object.assign({ x, y, z, vx, vy, vz, m, life: 240, g: 0 }, o));
}
function updateProjs(s) {
  const dt = s / 60;
  for (let i = G.projs.length - 1; i >= 0; i--) {
    const p = G.projs[i];
    p.life -= s;
    p.vy -= p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.m.position.set(p.x, p.y, p.z);
    let gone = p.life <= 0;
    if (p.boulder || p.lob) {
      // thrown things fly in an arc and burst where the red mark is
      p.m.rotation.x += 4 * dt;
      p.m.rotation.z += 3 * dt;
      if (p.chill && Math.random() < 0.5) puffs.emit(p.x, p.y, p.z, 0, 0, 0, 0.4, TC.set(0xffffff), 0.5, 0, 0, 0.6);
      if (p.y <= (p.boulder ? 0.8 : 0.3)) {
        gone = true;
        if (p.chill) {
          sfx('snow');
          burst(puffs, p.x, 0.3, p.z, 16, 4, 0.6, 0xffffff, 0.9, { a: 0.8, up: 1 });
          burst(sparks, p.x, 0.4, p.z, 10, 5, 0.4, 0xbfe8ff, 0.3, { g: 10 });
        } else {
          sfx('slam');
          G.shake = Math.max(G.shake, 0.35);
          dust(p.x, p.z, 18);
          ring(p.x, 0.15, p.z, 0.5, 9, 0.35, 0xffb060);
          burst(sparks, p.x, 0.6, p.z, 14, 8, 0.6, p.mat === 'acorn' ? 0x8a5a2c : 0xb0a89c, 0.5, { g: 16 });
        }
        if (
          Math.hypot(P.x - p.x, P.z - p.z) < (p.splash || 3.1) &&
          P.y < 2.2 &&
          damagePlayer(p.dmg, p.x, p.z, !!p.boulder) &&
          p.chill
        ) {
          if (!GEAR.noChill) {
            P.chill = 150;
            floatText(P.x, P.y + 2.1, P.z, 'Chilly!', 'say');
          }
        }
      }
    } else {
      if (Math.random() < 0.5)
        sparks.emit(
          p.x,
          p.y,
          p.z,
          rnd(-1, 1),
          rnd(-1, 1),
          rnd(-1, 1),
          0.25,
          TC.set(p.mat === 'feather' ? 0x9ff2e4 : 0xffe14a),
          0.35,
          0,
          1,
        );
      if (Math.hypot(P.x - p.x, P.z - p.z) < p.r + 0.45 && Math.abs(P.y + 0.8 - p.y) < 1.1) {
        if (damagePlayer(p.dmg, p.x - p.vx, p.z - p.vz, false)) gone = true;
        else if (P.st === 'dash') p.passed = true;
      }
      if (Math.hypot(p.x - P.x, p.z - P.z) > 40) gone = true;
    }
    if (gone) {
      scene.remove(p.m);
      G.projs.splice(i, 1);
    }
  }
}
function updateEnemy(e, s) {
  const dt = s / 60,
    M = e.m;
  e.t += s;
  if (e.flash > 0) e.flash -= s;
  if (e.shown > 0) e.shown -= s;
  M.shell.visible = !e.d.boss && e.y > -0.4 && (e.flash > 0 || (e.wind && Math.floor(G.time * 14) % 2 === 0));
  M.shell.material = e.flash > 0 ? MAT.flashW : MAT.flashR;
  if (e.d.monster) {
    castUpdate(e, s); // src/cast.js: its own AI, animation and death
    return;
  }
  if (e.dead > 0) {
    e.dead += s;
    const k = Math.max(0, 1 - e.dead / 16);
    M.root.scale.setScalar(e.sc * k * (1 + (1 - k) * 0.6));
    if (e.dead > 16) {
      scene.remove(M.root);
      e.gone = true;
    }
    return;
  }
  if (e.d.boss) {
    updateBoss(e, s);
    return;
  }
  if (e.d.static) {
    // resource crystal: just sparkle, wobble when hit
    e.flinch = damp(e.flinch, 0, 8, dt);
    M.root.scale.setScalar(e.sc * (1 + e.flinch * 0.12));
    M.root.position.set(e.x, 0, e.z);
    if (Math.random() < 0.05)
      sparks.emit(e.x + rnd(-0.6, 0.6), rnd(0.5, 1.8), e.z + rnd(-0.6, 0.6), 0, 1, 0, 0.6, TC.set(M.glow), 0.3, 0, 1);
    return;
  }
  if (e.slowT > 0) {
    // chilled (Frostfang): everything it does runs slower
    e.slowT -= s;
    s *= 0.55;
    if (Math.random() < 0.2)
      puffs.emit(
        e.x + rnd(-0.4, 0.4),
        e.y + rnd(0.2, e.h),
        e.z + rnd(-0.4, 0.4),
        0,
        0.4,
        0,
        0.5,
        TC.set(0xd8f2ff),
        0.3,
        0,
        0,
        0.7,
      );
  }
  const dx = P.x - e.x,
    dz = P.z - e.z,
    dist = Math.hypot(dx, dz) || 0.001,
    ang = Math.atan2(dx, dz),
    d = e.d;
  const hover = d.fly ? 2.2 + Math.sin(G.time * 2 + e.ph) * 0.25 : 0;
  let sq = 1,
    pitch = 0,
    lie = 0;
  const turn = r => {
    e.face += clamp(angDiff(e.face, ang), -r * dt, r * dt);
  };
  const pAlive = P.st !== 'dead' && G.mode === 'play';
  switch (e.st) {
    case 'spawn':
      sq = smooth(e.t / 22);
      M.root.scale.setScalar(e.sc * Math.max(0.01, sq));
      if (d.fly) e.y = damp(e.y, hover, 3, dt);
      if (e.t >= 22) {
        e.st = 'chase';
        e.t = 0;
        M.root.scale.setScalar(e.sc);
      }
      sq = 1;
      break;
    case 'air':
      e.vy -= 22 * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.z += e.vz * dt;
      e.tumble += dt * 9;
      pitch = e.tumble;
      if (e.y <= 0 && e.vy < 0) {
        e.y = 0;
        dust(e.x, e.z, 6);
        if (e.slam) {
          // spiked or dived into the ground
          e.slam = false;
          e.slamDown = true;
          e.hp -= 18;
          floatText(e.x, 1.2, e.z, '18');
          ring(e.x, 0.12, e.z, 0.3, 8, 0.25, 0xfff0c0);
          G.shake = Math.max(G.shake, 0.2);
          if (e.hp <= 0) {
            killEnemy(e);
            return;
          }
        }
        if (!e.bounced && e.vy < -7) {
          // one little bounce when knocked down hard
          e.bounced = true;
          e.vy = Math.min(5, -e.vy * 0.3);
          e.y = 0.01;
          e.vx *= 0.5;
          e.vz *= 0.5;
        } else {
          e.air = false;
          e.st = 'down';
          e.t = 0;
          e.tumble = 0;
        }
      }
      break;
    case 'down': {
      const dur = e.slamDown ? 60 : 40;
      lie = e.t > dur - 12 ? Math.max(0, (dur - e.t) / 12) : 1;
      e.vx = damp(e.vx, 0, 8, dt);
      e.vz = damp(e.vz, 0, 8, dt);
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      if (e.t >= dur) {
        e.st = 'chase';
        e.t = 0;
        e.slamDown = false;
        e.cool = rnd(30, 70);
        e.rep = 0;
      }
      break;
    }
    case 'stun':
      e.under = false;
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      e.vx = damp(e.vx, 0, 7, dt);
      e.vz = damp(e.vz, 0, 7, dt);
      pitch = -0.35;
      if (e.y < 0) e.y = damp(e.y, 0, 10, dt);
      if (d.fly) e.y = damp(e.y, hover, 2, dt);
      if (e.t >= 24) {
        e.st = 'chase';
        e.t = 0;
        e.cool = Math.max(e.cool, 25);
        e.rep = 0;
      }
      break;
    default:
      enemyBrain(e, s, dt, dist, ang, hover, turn, pAlive);
      if (e.st === 'wind' && e.type !== 'bark') sq = 1 - Math.min(0.28, e.t * 0.008);
      if (e.st === 'atk' && e.type === 'thorn') pitch = e.t * 0.35;
  }
  if (e.tok && !ATTACKING[e.st]) e.tok = false;
  e.flinch = damp(e.flinch, 0, 8, dt);
  // separation
  if (!e.under)
    for (const o of G.enemies) {
      if (o === e || !o.alive || o.air || e.air || o.under || o.d.boss) continue;
      const ox = e.x - o.x,
        oz = e.z - o.z,
        od = Math.hypot(ox, oz),
        m = (e.r + o.r) * 0.9;
      if (od < m && od > 0.001) {
        const k = (m - od) * 0.5 * (o.d.w > e.d.w ? 1.6 : 1);
        e.x += (ox / od) * k;
        e.z += (oz / od) * k;
      }
    }
  levelClampEnemy(e);
  e.lie = damp(e.lie, lie, 14, dt);
  M.root.position.set(e.x, e.y, e.z);
  M.root.rotation.y = e.face;
  M.b.rotation.x = pitch + e.lie * -1.4 - e.flinch * 0.55;
  M.b.position.y = e.lie * 0.35 * e.h;
  sq *= 1 - e.flinch * 0.12;
  M.b.scale.set(1 + (1 - sq) * 0.6, sq, 1 + (1 - sq) * 0.6);
  if (M.eliteRing) {
    M.eliteRing.position.y = 0.04 - e.y;
    M.eliteRing.material.opacity = 0.35 + Math.sin(G.time * 5) * 0.15;
    if (M.crown) M.crown.rotation.y = G.time * 1.5;
  }
  const tt = G.time * 8 + e.ph,
    mv = e.st === 'chase';
  if (e.type === 'puff' || e.type === 'snow') {
    M.fL.position.z = 0.05 + (mv ? Math.sin(tt) * 0.14 : 0);
    M.fR.position.z = 0.05 - (mv ? Math.sin(tt) * 0.14 : 0);
    M.b.rotation.z = mv ? Math.sin(tt) * 0.09 : 0;
    M.cap.rotation.x = e.st === 'atk' ? 0.5 : e.type === 'snow' && e.st === 'wind' ? -0.4 : 0;
  } else if (e.type === 'gust') {
    const fl = Math.sin(G.time * 22 + e.ph) * 0.7;
    M.wL.rotation.z = fl;
    M.wR.rotation.z = -fl;
  } else if (e.type === 'bolt') {
    M.tl.rotation.y = Math.sin(tt * 0.6) * 0.4;
    M.hd.rotation.x = e.st === 'wind' ? -0.4 : 0;
  } else if (e.type === 'thorn') {
    const sw = mv ? Math.sin(tt * 0.5) * 0.4 : 0;
    M.aL.rotation.x = sw;
    M.aR.rotation.x = -sw;
  } else if (e.type === 'bark') {
    M.mound.visible = e.y < -0.3;
    M.mound.position.y = -e.y;
    M.mound.scale.y = 0.6 + Math.sin(G.time * 18) * 0.1;
    M.stars.visible = e.st === 'rec';
    M.stars.rotation.y = G.time * 5;
    const sw = mv ? Math.sin(tt) * 0.5 : 0;
    M.rL.rotation.x = sw;
    M.rR.rotation.x = -sw;
    M.leaf.rotation.z = Math.sin(G.time * 3 + e.ph) * 0.2;
  }
}
function enemyBrain(e, s, dt, dist, ang, hover, turn, pAlive) {
  e.cool -= s;
  const fw = sp => {
    e.x += Math.sin(e.face) * sp * dt;
    e.z += Math.cos(e.face) * sp * dt;
  };
  const strafe = sp => {
    const sa = e.face + PI / 2,
      k = Math.sin(G.time * 0.9 + e.ph);
    e.x += Math.sin(sa) * k * sp * dt;
    e.z += Math.cos(sa) * k * sp * dt;
  };
  const ready = e.cool <= 0 && pAlive;
  switch (e.type) {
    case 'puff':
      if (e.st === 'chase') {
        turn(6);
        // wait at a polite distance until it is this Puffcap's turn
        const want = ready && canToken(e) ? 1.5 : 3.4;
        if (dist > want + 0.3) fw(2.9);
        else if (dist < want - 0.7) fw(-1.8);
        if (dist < 5) strafe(1.4);
        if (ready && dist < 2.1 && token(e)) {
          e.st = 'wind';
          e.t = 0;
          e.wind = true;
        }
      } else if (e.st === 'wind') {
        turn(3);
        if (e.t >= (e.rep ? 16 : 34)) {
          e.st = 'atk';
          e.t = 0;
          e.wind = false;
          e.hitP = false;
        }
      } else if (e.st === 'atk') {
        fw(9.5);
        if (!e.hitP && dist < 1.25 * e.sc && P.y < 1.3) {
          e.hitP = true;
          hurtP(e, 14, e.x, e.z, false);
        }
        if (e.t >= 11) {
          e.t = 0;
          if (e.elite && e.rep < 2) {
            e.rep++;
            e.st = 'wind';
            e.wind = true;
          } else e.st = 'rec';
        }
      } else if (e.st === 'rec') {
        if (e.t >= 42) {
          e.st = 'chase';
          e.t = 0;
          e.rep = 0;
          e.cool = rnd(40, 110);
        }
      }
      break;
    case 'gust':
      if (e.st === 'chase') {
        e.y = damp(e.y, hover, 2.5, dt);
        turn(5);
        const want = 6.5,
          ta = ang + PI + Math.sin(G.time * 0.5 + e.ph) * 1.2,
          tx = P.x + Math.sin(ta) * want,
          tz = P.z + Math.cos(ta) * want;
        e.x = damp(e.x, tx, 0.9, dt);
        e.z = damp(e.z, tz, 0.9, dt);
        if (ready && dist < 11 && e.y > 1.5 && token(e)) {
          e.st = 'wind';
          e.t = 0;
          e.wind = true;
          e.shots = 0;
        }
      } else if (e.st === 'wind') {
        turn(8);
        e.y = damp(e.y, hover + 0.5, 3, dt);
        if (e.elite && e.t >= 16 && e.shots < 3 && e.t >= 16 + e.shots * 6) {
          // Elite Gustlings throw feathers before they swoop
          e.shots++;
          const tgY = P.y + 0.8,
            a = ang + (e.shots - 2) * 0.2,
            n = Math.hypot(dist, tgY - e.y) || 1,
            v = 11;
          spawnProj(e.x, e.y, e.z, (Math.sin(a) * dist * v) / n, ((tgY - e.y) * v) / n, (Math.cos(a) * dist * v) / n, {
            r: 0.18,
            dmg: 9 * e.dm,
            mat: 'feather',
          });
          sfx('swing', 1);
        }
        if (e.t >= 40) {
          e.st = 'atk';
          e.t = 0;
          e.wind = false;
          e.hitP = false;
          const tgY = P.y + 0.7,
            n = Math.hypot(P.x - e.x, tgY - e.y, P.z - e.z) || 1;
          e.dx = (P.x - e.x) / n;
          e.dy = (tgY - e.y) / n;
          e.dz = (P.z - e.z) / n;
        }
      } else if (e.st === 'atk') {
        e.x += e.dx * 15 * dt;
        e.z += e.dz * 15 * dt;
        e.y = Math.max(0.5, e.y + e.dy * 15 * dt);
        if (!e.hitP && Math.hypot(P.x - e.x, P.y + 0.7 - e.y, P.z - e.z) < 1.2) {
          e.hitP = true;
          hurtP(e, 13, e.x - e.dx, e.z - e.dz, false);
        }
        if (e.t >= 44) {
          e.st = 'rec';
          e.t = 0;
        }
      } else if (e.st === 'rec') {
        e.y = damp(e.y, hover, 2, dt);
        if (e.t >= 50) {
          e.st = 'chase';
          e.t = 0;
          e.cool = rnd(110, 220);
        }
      }
      break;
    case 'bolt':
    case 'snow':
      if (e.st === 'chase') {
        turn(5);
        // keep a safe distance and sidestep
        fw(dist < 7 ? -2.6 : dist > 12 ? 2.6 : 0);
        strafe(1.2);
        if (ready && dist < (e.type === 'snow' ? 15 : 16) && token(e)) {
          e.st = 'wind';
          e.t = 0;
          e.wind = true;
        }
      } else if (e.st === 'wind') {
        turn(6);
        if (e.t >= 30) {
          e.st = 'atk';
          e.t = 0;
          e.wind = false;
          e.shots = 0;
        }
      } else if (e.st === 'atk') {
        turn(4);
        if (e.type === 'bolt') {
          const n = e.elite ? 5 : 3,
            gap = e.elite ? 9 : 13;
          if (e.t >= e.shots * gap && e.shots < n) {
            e.shots++;
            const a = e.face + (e.shots - (n + 1) / 2) * 0.12,
              vy = clamp(((P.y + 0.8 - 0.95) / Math.max(1, dist)) * 8.5, -6, 8); // aim at Darren's height, even when he flies
            spawnProj(
              e.x + Math.sin(e.face) * 0.7,
              0.95,
              e.z + Math.cos(e.face) * 0.7,
              Math.sin(a) * 8.5,
              vy,
              Math.cos(a) * 8.5,
              {
                r: 0.3,
                dmg: 13 * e.dm,
              },
            );
            sfx('pop');
          }
          if (e.t >= n * gap + 8) {
            e.st = 'chase';
            e.t = 0;
            e.cool = rnd(130, 210);
          }
        } else {
          // Snowcap: lob snowballs where Darren is heading; each lands on a red mark
          const n = e.elite ? 3 : 1;
          if (e.t >= e.shots * 14 && e.shots < n) {
            e.shots++;
            const T0 = 0.95,
              spread = e.shots > 1 ? 1.8 : 0,
              tx = P.x + P.vx * 0.45 + rnd(-spread, spread),
              tz = P.z + P.vz * 0.45 + rnd(-spread, spread),
              sx = e.x,
              sy = 1.3,
              sz = e.z;
            mark(tx, tz, 1.6, T0 * 60, 0x6fc8ff);
            spawnProj(sx, sy, sz, (tx - sx) / T0, (0.3 - sy) / T0 + 0.5 * 20 * T0, (tz - sz) / T0, {
              r: 0.32,
              dmg: 14 * e.dm,
              lob: true,
              splash: 1.6,
              g: 20,
              chill: true,
              mat: 'snow',
            });
            sfx('swing', 0);
          }
          if (e.t >= n * 14 + 20) {
            e.st = 'rec';
            e.t = 0;
          }
        }
      } else if (e.st === 'rec') {
        if (e.t >= 40) {
          e.st = 'chase';
          e.t = 0;
          e.cool = rnd(120, 200);
        }
      }
      break;
    case 'thorn':
      if (e.st === 'chase') {
        turn(2.4);
        if (dist > 2.4) fw(2.0);
        if (ready && dist < 9 && token(e)) {
          e.st = 'wind';
          e.t = 0;
          e.wind = true;
        }
      } else if (e.st === 'wind') {
        turn(4);
        if (e.t >= (e.rep ? 26 : 48)) {
          e.st = 'atk';
          e.t = 0;
          e.wind = false;
          e.hitP = false;
        }
      } else if (e.st === 'atk') {
        fw(13);
        if (Math.random() < 0.5) dust(e.x, e.z, 1);
        if (!e.hitP && dist < 1.9 && P.y < 1.8) {
          e.hitP = true;
          hurtP(e, 30, e.x, e.z, true);
        }
        if (e.t >= 48 || levelEnemyAtEdge(e)) {
          e.t = 0;
          if (e.elite && !e.rep) {
            e.rep = 1;
            e.st = 'wind';
            e.wind = true;
          } else e.st = 'rec';
        }
      } else if (e.st === 'rec') {
        if (e.t >= 80) {
          e.st = 'chase';
          e.t = 0;
          e.rep = 0;
          e.cool = rnd(90, 160);
        }
      }
      break;
    case 'bark':
      // Barkling: burrows, tunnels under Darren, then bursts up beneath him (dodge the red mark)
      if (e.st === 'chase') {
        turn(4);
        if (dist > 2.2) fw(2.3);
        if (ready && dist < 13 && token(e)) {
          e.st = 'wind';
          e.t = 0;
          e.wind = true;
          sfx('dig');
        }
      } else if (e.st === 'wind') {
        e.y = -1.15 * smooth(e.t / 24);
        if (e.t > 10) e.under = true;
        if (Math.random() < 0.4) dust(e.x, e.z, 1);
        if (e.t >= 24) {
          e.st = 'dig';
          e.t = 0;
          e.wind = false;
        }
      } else if (e.st === 'dig') {
        e.under = true;
        e.y = -1.15;
        turn(9);
        fw(Math.min(6.5, dist * 4));
        if (Math.random() < 0.6) dust(e.x, e.z, 1);
        if (dist < 0.6 || e.t >= 80) {
          e.st = 'mark';
          e.t = 0;
          mark(e.x, e.z, 1.5, 28, 0xff7a2a);
          sfx('dig');
        }
      } else if (e.st === 'mark') {
        if (Math.random() < 0.6) dust(e.x + rnd(-0.6, 0.6), e.z + rnd(-0.6, 0.6), 1);
        if (e.t >= 28) {
          e.st = 'atk';
          e.t = 0;
          e.under = false;
          e.hitP = false;
          sfx('slam');
          for (let i = 0; i < 3; i++) spike(e.x + rnd(-0.8, 0.8), e.z + rnd(-0.8, 0.8), rnd(0.8, 1.3), 'root');
          dust(e.x, e.z, 10);
        }
      } else if (e.st === 'atk') {
        e.y = Math.sin(clamp(e.t / 14, 0, 1) * PI) * 1.3;
        if (!e.hitP && e.t >= 1) {
          e.hitP = true;
          if (Math.hypot(P.x - e.x, P.z - e.z) < 1.55 && P.y < 1.8) hurtP(e, 16, e.x, e.z, false);
        }
        if (e.t >= 14) {
          e.y = 0;
          e.t = 0;
          if (e.elite && e.rep < 1) {
            e.rep++;
            e.st = 'wind';
            e.wind = true;
          } else e.st = 'rec';
        }
      } else if (e.st === 'rec') {
        // dazed: free hits
        if (e.t >= 70) {
          e.st = 'chase';
          e.t = 0;
          e.rep = 0;
          e.cool = rnd(90, 170);
        }
      }
      break;
  }
}

/* ---------- bosses: Grumblepeak (Chapter 1) and Old Knotroot (Chapter 2) ---------- */
function bossPartPos(b, key, out) {
  b.m.parts[key].node.getWorldPosition(out);
  return out;
}
function bossHitTest(b, A) {
  const fx = Math.sin(P.face),
    fz = Math.cos(P.face),
    reach = 1.6 + (A.rng || 2.5) * 0.45;
  const sx = P.x + fx * 1.2,
    sy = P.y + 0.9,
    sz = P.z + fz * 1.2;
  let best = null,
    bd = reach;
  for (const k of ['armL', 'armR', 'back']) {
    const p = b.m.parts[k];
    if (!p.alive) continue;
    if (k === 'back' && b.phase < 3 && b.st !== 'kneel') continue;
    bossPartPos(b, k, V3);
    const d = Math.hypot(V3.x - sx, (V3.y - sy) * 0.8, V3.z - sz);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  const dx = b.x - P.x,
    dz = b.z - P.z,
    d = Math.hypot(dx, dz);
  let dmg = A.dmg * (P.heartOn > 0 ? 1.15 : 1) * (1 + GEAR.power) * rnd(0.92, 1.08);
  if (best) {
    const p = b.m.parts[best];
    bossPartPos(b, best, V3);
    p.hp -= dmg;
    const mul = best === 'back' ? 2 : 0.6;
    b.hp -= dmg * mul;
    b.flash = 3;
    p.mat.emissiveIntensity = 1.8;
    hitFx(
      V3.x,
      V3.y,
      V3.z,
      dmg * (best === 'back' ? 2 : 1),
      Object.assign({}, A, { hs: Math.max(A.hs || 3, 4) }),
      false,
    );
    burst(sparks, V3.x, V3.y, V3.z, 6, 6, 0.4, 0xffa030, 0.35, { g: 8 });
    if (p.hp <= 0) breakCrystal(b, best);
  } else {
    if (d - b.r > (A.rng || 2.5) || P.y > 6) return false;
    if (A.arc < 360 && Math.abs(angDiff(P.face, Math.atan2(dx, dz))) > (A.arc * PI) / 360 + 0.5) return false;
    if (b.st === 'kneel') dmg *= 1.5;
    b.hp -= dmg;
    b.flash = 3;
    hitFx(b.x - (dx / d) * b.r * 0.8, Math.min(5, P.y + 1.1), b.z - (dz / d) * b.r * 0.8, dmg, A, false);
  }
  G.tgt = null;
  if (b.hp <= 0 && b.alive) bossDie(b);
  return true;
}
function breakCrystal(b, k) {
  const p = b.m.parts[k];
  p.alive = false;
  p.node.visible = false;
  bossPartPos(b, k, V3);
  G.stats.breaks++;
  styleAdd(80);
  burst(sparks, V3.x, V3.y, V3.z, 50, 11, 0.9, 0xffa030, 0.5, { g: 12 });
  sfx('break');
  G.hitstop = 0.16;
  G.shake = 0.6;
  flash('gold', 10);
  camPunch(1);
  floatText(V3.x, V3.y + 1, V3.z, b.cfg.part, 'big');
  dropParts(DATA.drops[b.type], V3.x, V3.y, V3.z);
  P.hp = Math.min(TUNE.maxHp, P.hp + 40);
  if (P.heartOn <= 0) P.heart = Math.min(100, P.heart + 30);
  const arms = !b.m.parts.armL.alive && !b.m.parts.armR.alive;
  if (k !== 'back' && arms && b.alive) {
    b.st = 'kneel';
    b.t = 0;
    b.wind = false;
    banner(b.d.name + ' kneels', b.cfg.kneel, 150);
  } else if (b.alive) {
    b.st = 'stagger';
    b.t = 0;
    b.wind = false;
  }
}
function bossDie(b) {
  b.alive = false;
  b.hp = 0;
  b.st = 'dead';
  b.t = 0;
  b.wind = false;
  G.slow = 70;
  G.shake = 0.9;
  sfx('slam');
  sfx('win');
  styleAdd(150);
  if (P.lock === b) P.lock = null;
  for (let i = 0; i < 6; i++)
    burst(sparks, b.x + rnd(-2, 2), rnd(1, 5), b.z + rnd(-2, 2), 30, 12, 1.2, i % 2 ? 0xffa030 : 0xfff0c0, 0.6, {
      g: 8,
    });
  for (const e of G.enemies) if (e.alive && e !== b) killEnemy(e);
  G.projs.forEach(p => scene.remove(p.m));
  G.projs.length = 0;
  banner(b.d.name + ' falls', '', 200);
  dropParts(DATA.drops[b.type], b.x, 3, b.z);
  dropParts(DATA.drops[b.type], b.x, 3, b.z);
  const Z = b.zone && zoneData(b.zone);
  if (Z) clearZone(Z);
  else if (window.advBossDown) advBossDown(b);
}
function updateBoss(b, s) {
  const dt = s / 60,
    M = b.m,
    ps = b.pose,
    C = b.cfg,
    N = b.d.name,
    SC = b.d.sc || 1;
  const tg = { aL: 0, aR: 0, aLz: 0, aRz: 0, tp: 0, ty: 0, y: 0 };
  let k = 6;
  const dx = P.x - b.x,
    dz = P.z - b.z,
    dist = Math.hypot(dx, dz) || 0.001,
    ang = Math.atan2(dx, dz);
  const spd = b.phase >= 3 ? 1.22 : 1,
    fwx = Math.sin(b.face),
    fwz = Math.cos(b.face);
  const turn = r => {
    b.face += clamp(angDiff(b.face, ang), -r * dt, r * dt);
  };
  const pAlive = P.st !== 'dead' && G.mode === 'play';
  const ph = b.hp > b.max * 0.6 ? 1 : b.hp > b.max * 0.25 ? 2 : 3;
  if (ph > b.phase && b.alive && b.st !== 'kneel' && b.st !== 'stagger') {
    // phase change: he roars, shoves Darren back, and says something (story id '<talk>_phase2' / '_phase3')
    b.phase = ph;
    b.st = 'roar';
    b.t = 0;
    b.roared = false;
    b.chain = 0;
    decalC.visible = decalS.visible = decalB.visible = false;
    banner(ph === 2 ? N + ' is furious' : N + ' rages', ph === 2 ? C.p2 : 'The weak spot on his back is open', 170);
    const id = C.talk + '_phase' + ph;
    if (CH.story[id]) talk(id);
  }
  if (b.st !== 'kneel' && b.st !== 'dead' && b.st !== 'roar') b.t += s * (spd - 1);
  decalC.visible = decalS.visible = false;
  b.wind = false;
  const glow = v => {
    for (const key in M.parts) {
      const p = M.parts[key];
      p.mat.emissiveIntensity = damp(p.mat.emissiveIntensity, v, 8, dt || 0.016);
    }
  };
  const impact = dmg => {
    const ix = b.x + fwx * 3.4 * SC,
      iz = b.z + fwz * 3.4 * SC;
    sfx('slam');
    G.shake = Math.max(G.shake, 0.7);
    dust(ix, iz, 22);
    burst(sparks, ix, 0.5, iz, 18, 9, 0.6, 0xb0a89c, 0.5, { g: 16 });
    ring(ix, 0.15, iz, 1, 13.5, 1.5, 0xffb060, 26 * b.dm);
    if (Math.hypot(P.x - ix, P.z - iz) < 3.3 * SC && P.y < 2.2) hurtP(b, dmg, ix, iz, true);
  };
  const stompImpact = i => {
    sfx('slam');
    G.shake = Math.max(G.shake, i ? 0.35 : 0.8);
    dust(b.x, b.z, i ? 10 : 26);
    ring(b.x, 0.15, b.z, b.r * 0.9, 9.5, 1.5, 0xffd080, 22 * b.dm);
    if (!i && dist < b.r + 1.6 && P.y < 2) hurtP(b, 30, b.x, b.z, true);
  };
  switch (b.st) {
    case 'idle':
      turn(1.5);
      glow(0.55);
      if (dist > 5) {
        b.x += fwx * 1.7 * spd * dt;
        b.z += fwz * 1.7 * spd * dt;
        tg.aL = Math.sin(G.time * 3) * 0.25;
        tg.aR = -tg.aL;
        tg.y = Math.abs(Math.sin(G.time * 3)) * 0.15;
      }
      b.cool -= s * spd;
      if (b.phase >= 3) {
        b.summonT += s;
        if (b.summonT > 1500) {
          b.summonT = 0;
          for (let i = 0; i < 3; i++) {
            const a = rnd(TAU),
              e = spawnEnemy(C.summon, b.x + Math.cos(a) * 6, b.z + Math.sin(a) * 6);
            e.home = b.home;
            e.zone = b.zone;
            levelClampEnemy(e);
          }
        }
      }
      if (b.cool <= 0 && pAlive) {
        const r = Math.random();
        b.t = 0;
        const special = C.special === 'roots' ? 'rootsW' : 'stompW',
          useSpecial = dist < 16 && (b.phase >= 2 ? r < 0.32 : C.special === 'roots' && r < 0.22);
        if (useSpecial) b.st = special;
        else if (dist < 6.5) b.st = r < 0.55 ? 'sweepW' : 'slamW';
        else if (dist < 13) {
          if (b.phase >= 2 && r < 0.6) {
            b.st = 'slamW';
            b.chain = 2;
          } else b.st = r < 0.85 ? 'slamW' : 'sweepW';
        } else b.st = b.phase >= 2 || C.throwKind === 'acorn' ? 'throwW' : 'slamW';
      }
      break;
    case 'roar':
      tg.aL = tg.aR = -2.7;
      tg.aLz = 0.5;
      tg.aRz = -0.5;
      tg.tp = -0.45;
      k = 8;
      glow(1.6 + Math.sin(G.time * 24) * 0.6);
      if (b.t >= 10 && !b.roared) {
        b.roared = true;
        sfx('roar');
        G.shake = 0.9;
        flash('gold', 8);
        ring(b.x, 0.25, b.z, 1, 24, 0.7, 0xffd080);
        burst(sparks, b.x, 4, b.z, 40, 12, 0.9, 0xffb040, 0.5, { g: 6 });
        if (dist < 11) {
          P.vx = (dx / dist) * 13;
          P.vz = (dz / dist) * 13;
          P.vy = 6;
          P.onG = false;
          if (P.st !== 'dead') P.st = 'move';
        }
      }
      if (b.t >= 70) {
        b.st = 'idle';
        b.t = 0;
        b.cool = 30;
      }
      break;
    case 'slamW': {
      const W = b.chain > 0 && b.chainGo ? 34 : 54;
      if (b.t < W * 0.6) turn(1.8);
      tg.aL = tg.aR = -2.9;
      tg.tp = -0.28;
      k = 7;
      b.wind = true;
      glow(1.1 + Math.sin(G.time * 20) * 0.6);
      decalC.visible = true;
      decalC.position.set(b.x + fwx * 3.4 * SC, 0.06, b.z + fwz * 3.4 * SC);
      decalC.scale.setScalar(3.3 * SC);
      decalC.material.opacity = 0.22 + 0.38 * (b.t / W);
      if (b.t >= W) {
        b.st = 'slamR';
        b.t = 0;
        impact(42);
      }
      break;
    }
    case 'slamR':
      tg.aL = tg.aR = -1.12;
      tg.tp = 0.78;
      k = 30;
      glow(0.6);
      if (b.chain > 0 && b.t >= 26) {
        b.chain--;
        b.chainGo = true;
        b.st = 'slamW';
        b.t = 0;
      } else if (b.t >= 70) {
        b.st = 'idle';
        b.t = 0;
        b.chainGo = false;
        b.cool = rnd(50, 110);
      }
      break;
    case 'sweepW':
      if (b.t < 26) turn(2);
      tg.tp = 0.5;
      tg.ty = -1.15;
      tg.aRz = -0.95;
      tg.aR = -0.5;
      tg.aLz = 0.3;
      k = 7;
      b.wind = true;
      glow(1.1 + Math.sin(G.time * 20) * 0.6);
      decalS.visible = true;
      decalS.position.set(b.x, 0.06, b.z);
      decalS.rotation.y = b.face;
      decalS.scale.setScalar(8.6 * SC);
      decalS.material.opacity = 0.2 + 0.36 * (b.t / 42);
      if (b.t >= 42) {
        b.st = 'sweep';
        b.t = 0;
        b.hitP = false;
        sfx('swing', 0);
      }
      break;
    case 'sweep':
      tg.tp = 0.55;
      tg.ty = 1.2;
      tg.aRz = -0.95;
      tg.aR = -0.5;
      k = 22;
      if (!b.hitP && dist < 8.6 * SC && Math.abs(angDiff(b.face, ang)) < 1.4 && P.y < 2.6) {
        b.hitP = hurtP(b, 36, b.x, b.z, true) || P.st === 'dash';
      }
      if (b.t >= 12) {
        b.st = 'sweepR';
        b.t = 0;
      }
      break;
    case 'sweepR':
      tg.tp = 0.45;
      tg.ty = 1.0;
      tg.aRz = -0.6;
      k = 5;
      if (b.t >= 48) {
        b.st = 'idle';
        b.t = 0;
        b.cool = rnd(50, 110);
      }
      break;
    case 'throwW':
      turn(2.2);
      tg.aR = -2.75;
      tg.tp = -0.2;
      tg.ty = -0.3;
      k = 7;
      b.wind = true;
      glow(1.4);
      if (b.t < 2 || !b.aim) b.aim = [P.x, P.z];
      b.aim[0] = damp(b.aim[0], P.x, 4, dt);
      b.aim[1] = damp(b.aim[1], P.z, 4, dt);
      decalB.visible = true;
      decalB.position.set(b.aim[0], 0.06, b.aim[1]);
      decalB.scale.setScalar(3);
      decalB.material.opacity = 0.22 + 0.38 * (b.t / 50);
      if (b.t >= 50) {
        b.st = 'throwR';
        b.t = 0;
        const T0 = 1.05,
          sx = b.x - Math.cos(b.face) * -2.5,
          sy = 8.5,
          sz = b.z + Math.sin(b.face) * -2.5,
          acorn = C.throwKind === 'acorn';
        spawnProj(sx, sy, sz, (b.aim[0] - sx) / T0, (0.8 - sy) / T0 + 0.5 * 20 * T0, (b.aim[1] - sz) / T0, {
          r: acorn ? 1.0 : 1.3,
          dmg: 32 * b.dm,
          boulder: true,
          splash: 3.1,
          g: 20,
          mat: acorn ? 'acorn' : null,
        });
        sfx('swing', 0);
      }
      break;
    case 'throwR':
      tg.aR = -0.8;
      tg.tp = 0.35;
      tg.ty = 0.3;
      k = 16;
      decalB.visible = G.projs.some(p => p.boulder);
      if (b.t >= 46) {
        b.st = 'idle';
        b.t = 0;
        b.cool = rnd(40, 90);
        decalB.visible = false;
      }
      break;
    case 'stompW':
      // crouch... then leap and land with three shockwaves (jump over them, or dash through)
      turn(1.2);
      tg.y = -0.55;
      tg.aL = tg.aR = -1.9;
      tg.tp = 0.35;
      k = 8;
      b.wind = true;
      glow(1.2 + Math.sin(G.time * 20) * 0.5);
      decalC.visible = true;
      decalC.position.set(b.x, 0.06, b.z);
      decalC.scale.setScalar(b.r + 1.8);
      decalC.material.opacity = 0.15 + 0.35 * (b.t / 34);
      if (b.t >= 34) {
        b.st = 'stompA';
        b.t = 0;
        sfx('jump');
        dust(b.x, b.z, 14);
      }
      break;
    case 'stompA': {
      const up = b.t < 22;
      tg.y = up ? 4.2 : 0;
      k = up ? 9 : 18;
      tg.aL = tg.aR = up ? -2.8 : -0.6;
      tg.tp = up ? -0.3 : 0.6;
      if (b.t < 30 && dist > b.r + 1) {
        b.x += (dx / dist) * Math.min(dist - b.r, 7) * dt * 1.1;
        b.z += (dz / dist) * Math.min(dist - b.r, 7) * dt * 1.1;
      }
      decalC.visible = true;
      decalC.position.set(b.x, 0.06, b.z);
      decalC.scale.setScalar(b.r + 1.8);
      decalC.material.opacity = 0.5;
      if (b.t >= 36) {
        b.st = 'stompR';
        b.t = 0;
        stompImpact(0);
        b.rings = 1;
      }
      break;
    }
    case 'stompR':
      tg.y = -0.3;
      tg.tp = 0.5;
      k = 10;
      glow(0.6);
      if (b.rings < 3 && b.t >= b.rings * 16) {
        stompImpact(b.rings);
        b.rings++;
      }
      if (b.t >= 90) {
        b.st = 'idle';
        b.t = 0;
        b.cool = rnd(60, 110);
      }
      break;
    case 'rootsW':
      // Old Knotroot: lines of roots burst out of the ground toward Darren, each spot marked red first
      turn(2.5);
      tg.aL = tg.aR = -2.4;
      tg.tp = -0.25;
      tg.y = -0.3;
      k = 8;
      b.wind = true;
      glow(1.2 + Math.sin(G.time * 20) * 0.5);
      if (!b.line) {
        b.line = [];
        const lines = b.phase >= 3 ? [0, -0.55, 0.55] : b.phase >= 2 ? [-0.3, 0.3] : [0];
        for (const off of lines) {
          const a = ang + off;
          for (let i = 0; i < 8; i++) {
            const d0 = b.r + 1.2 + i * 2.1,
              px = b.x + Math.sin(a) * d0,
              pz = b.z + Math.cos(a) * d0;
            if (!groundAt(px, pz)) break;
            b.line.push({ x: px, z: pz, i });
            mark(px, pz, 1.25, 40 + i * 5, 0xff5a1a);
          }
        }
        b.li = 0;
      }
      if (b.t >= 40) {
        b.st = 'roots';
        b.t = 0;
      }
      break;
    case 'roots':
      tg.aL = tg.aR = -0.4;
      tg.tp = 0.7;
      tg.y = -0.4;
      k = 16;
      for (const q of b.line) {
        if (q.done || b.t < q.i * 5) continue;
        q.done = true;
        spike(q.x, q.z, 2.3, 'root');
        spike(q.x + rnd(-0.5, 0.5), q.z + rnd(-0.5, 0.5), 1.4, 'root');
        dust(q.x, q.z, 5);
        G.shake = Math.max(G.shake, 0.25);
        if (Math.hypot(P.x - q.x, P.z - q.z) < 1.35 && P.y < 1.6)
          hurtP(b, 26, q.x - (P.x - q.x), q.z - (P.z - q.z), true);
      }
      if (b.t >= 8 * 5 + 40) {
        b.st = 'idle';
        b.t = 0;
        b.line = null;
        b.cool = rnd(50, 100);
        sfx('dig');
      }
      break;
    case 'stagger':
      tg.tp = -0.35;
      tg.aL = -0.5;
      tg.aR = -0.5;
      k = 10;
      glow(0.3);
      if (b.t >= 110) {
        b.st = 'idle';
        b.t = 0;
        b.cool = 40;
      }
      break;
    case 'kneel':
      tg.y = -1.15;
      tg.tp = 0.7;
      tg.aL = tg.aR = -0.75;
      k = 5;
      glow(0.3 + Math.sin(G.time * 6) * 0.2);
      if (b.t >= 480) {
        b.st = 'idle';
        b.t = 0;
        b.cool = 60;
        banner(N + ' rises', '', 100);
      }
      break;
    case 'dead':
      tg.y = -2.2 - Math.min(4, b.t * 0.02);
      tg.tp = 1.1;
      tg.aL = tg.aR = 0.3;
      k = 2;
      glow(0);
      decalB.visible = false;
      if (Math.random() < 0.4)
        burst(puffs, b.x + rnd(-2.5, 2.5), rnd(0.3, 3), b.z + rnd(-2.5, 2.5), 1, 2, 0.8, 0xd8d0c4, 1.4, { a: 0.6 });
      break;
  }
  if (b.st === 'roots' || b.st === 'rootsW') b.wind = b.st === 'rootsW';
  else b.line = null;
  for (const key in ps) ps[key] = damp(ps[key], tg[key], k, dt);
  levelClampEnemy(b);
  M.root.position.set(b.x, ps.y, b.z);
  M.root.rotation.y = b.face;
  M.torso.rotation.set(ps.tp, ps.ty, 0);
  M.aL.rotation.set(ps.aL, 0, ps.aLz);
  M.aR.rotation.set(ps.aR, 0, ps.aRz);
  M.head.rotation.x = -ps.tp * 0.5;
  if (M.leaves) M.leaves.rotation.z = Math.sin(G.time * 1.3) * 0.05;
  if (b.gone === undefined && b.st === 'dead' && b.t > 260) {
    scene.remove(M.root);
    b.gone = true;
  }
}
