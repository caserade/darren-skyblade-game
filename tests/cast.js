// Cloud Utopia big monsters in the real game: spawning, eating bushes (weight stages), attacks, stagger, death,
// drops and contracts. usage: node tests/cast.js [tag]   (serve the repo on :8768, build dist/test.html first)
const { chromium } = require('playwright-core');
const tag = process.argv[2] || 'cg';
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  p.on('console', m => m.type() === 'error' && !/net::|404/.test(m.text()) && errs.push('CONSOLE ' + m.text()));
  await p.goto(process.env.URL || 'http://localhost:8768/dist/test.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(3500);
  const ev = (f, a) => p.evaluate(f, a);
  const log = (k, v) => console.log(k + ':', JSON.stringify(v));
  await p.click('#modePick .mode[data-mode="adventure"]');
  await ev(() => (window.__manual = true));
  await p.click('#startBtn');
  await ev(() => {
    const g = window.__game;
    window.T_ = n => {
      for (let i = 0; i < n; i++) g.tick(1 / 60);
    };
    window.talkAll = () => {
      let k = 0;
      while (g.G.cine && k++ < 80) {
        g.advanceTalk();
        g.advanceTalk();
        T_(2);
      }
    };
    T_(20);
    talkAll();
    window.goIsle = (id, dx, dz) => {
      const I = g.LV.islands[id];
      g.P.x = I.x + (dx || 0);
      g.P.z = I.z + (dz || 0);
      g.P.y = 0;
      g.P.vy = 0;
      g.P.onG = true;
      g.P.fly = false;
      g.cam.fx = g.P.x;
      g.cam.fz = g.P.z;
      T_(2);
    };
    window.mon = type => g.G.enemies.find(e => e.type === type && e.alive);
    window.heal = () => {
      g.P.hp = g.TUNE.maxHp;
      g.P.inv = 0;
    };
    g.acceptContract('heavyweight');
  });
  for (const [type, isle] of [['heavyweight', 'mesa'], ['chomprex', 'wastes'], ['skydrake', 'spires']]) {
    // 1) arrive far side: it spawns; keep away so it eats a bush (Stormbellies)
    const r1 = await ev(
      a => {
        const g = window.__game,
          I = g.LV.islands[a[1]];
        g.P.x = I.x - I.r - 20;
        g.P.z = I.z;
        g.P.y = 30; // hovering high up out of reach so it stays calm
        g.P.fly = true;
        g.P.onG = false;
        T_(5);
        const e = mon(a[0]);
        if (!e) return { spawned: false };
        const w0 = e.wt,
          st = new Set();
        for (let i = 0; i < 60 * 14; i++) {
          g.P.y = 30;
          g.P.vy = 0;
          T_(1);
          st.add(e.st);
        }
        return { spawned: true, w0: +w0.toFixed(3), w1: +(e.wt || 0).toFixed(3), stage: e.stage, states: [...st], hp: e.hp, max: e.max };
      },
      [type, isle],
    );
    log(type + ' calm', r1);
    // 2) walk in: it fights; record states and Darren's damage
    const r2 = await ev(a => {
      const g = window.__game,
        e = mon(a);
      g.P.fly = false;
      g.P.x = e.x + 7;
      g.P.z = e.z + 2;
      g.P.y = 0;
      g.P.onG = true;
      T_(3);
      const st = new Set(),
        hp0 = g.P.hp;
      let hurt = 0;
      for (let i = 0; i < 60 * 16; i++) {
        if (g.P.hp < g.TUNE.maxHp * 0.5) {
          hurt += g.TUNE.maxHp - g.P.hp;
          heal();
        }
        T_(1);
        st.add(e.st);
      }
      return { states: [...st], hurt: Math.round(hurt + (hp0 - g.P.hp)), y: e.y.toFixed(1) };
    }, type);
    log(type + ' fight', r2);
    await ev(a => {
      const g = window.__game,
        e = mon(a);
      g.cam.yaw = Math.atan2(g.P.x - e.x, g.P.z - e.z) + 0.6;
      T_(2);
    }, type);
    await p.screenshot({ path: `tests/shots/${tag}_${type}_fight.png` });
    // 3) hit it a lot: stagger, then kill: drops and contract
    const r3 = await ev(a => {
      const g = window.__game,
        e = mon(a);
      const st = new Set();
      let staggered = false;
      for (let i = 0; i < 40 && e.alive; i++) {
        heal();
        g.P.x = e.x + Math.sin(e.face) * (e.r + 1.2);
        g.P.z = e.z + Math.cos(e.face) * (e.r + 1.2);
        g.P.y = e.y;
        g.P.face = Math.atan2(e.x - g.P.x, e.z - g.P.z);
        g.P.st = 'move';
        g.P.lock = e;
        window.__startAttack('H4');
        T_(30);
        if (e.st === 'stagger') staggered = true;
        st.add(e.st);
        if (i === 20 && e.alive) e.hp = 50;
      }
      T_(60 * 5);
      return { alive: e.alive, gone: !!e.gone, staggered, parts: Object.assign({}, g.UNLOCKS.parts), contracts: g.UNLOCKS.contracts.done };
    }, type);
    log(type + ' defeat', r3);
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
