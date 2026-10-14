// Dumpling the cloud drake: meeting him, feeding, weight, jiggle, Belly Bounce, trampoline, flight, the Hangar tab.
// usage: node tests/dumpling.js [tag]   (serve the repo on :8768 and build dist/test.html first)
const { chromium } = require('playwright-core');
const tag = process.argv[2] || 'dmp';
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  p.on('console', m => {
    if (m.type() === 'error' && !/net::|404/.test(m.text())) errs.push('CONSOLE ' + m.text());
  });
  await p.goto(process.env.URL || 'http://localhost:8768/dist/test.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(3500);
  const ev = (fn, a) => p.evaluate(fn, a);
  const log = (k, v) => console.log(k + ':', typeof v === 'string' ? v : JSON.stringify(v));
  const shot = async n => p.screenshot({ path: `tests/shots/${tag}_${n}.png` });
  await p.click('#modePick .mode[data-mode="adventure"]');
  await p.waitForTimeout(300);
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
        window.T_(2);
      }
    };
    window.tap = (a, n) => {
      g.press(a);
      g.release(a);
      window.T_(n || 1);
    };
    // close-up camera on Dumpling: angle a (0 = his front), distance d, height h
    window.look = (a, d, h, ty) => {
      const D = g.DUMP,
        f = D.face + a;
      g.camera.position.set(D.x + Math.sin(f) * d, D.y + h, D.z + Math.cos(f) * d);
      g.camera.lookAt(D.x, D.y + (ty === undefined ? 1.0 : ty), D.z);
      g.camera.updateMatrixWorld();
    };
    T_(30);
    talkAll();
    T_(30);
  });
  log('before', await ev(() => ({ on: __game.DUMP.on, st: __game.DUMP.st, model: !!__game.DUMP.m })));
  // walk up to the bakery: he introduces himself
  await ev(() => {
    const g = window.__game,
      K = g.DATA.dumpling.bakery;
    g.P.x = K.x + 4;
    g.P.z = K.z + 3;
    g.cam.fx = g.P.x;
    g.cam.fz = g.P.z;
    T_(20);
  });
  await shot('01_meet');
  log('met', await ev(() => ({ cine: __game.G.cine, who: __game.TALK.who, met: __game.UNLOCKS.dumpling.met, snacks: __game.UNLOCKS.snacks })));
  await ev(() => {
    talkAll();
    T_(90);
  });
  log('after talk', await ev(() => ({ st: __game.DUMP.st, x: __game.DUMP.x.toFixed(1), z: __game.DUMP.z.toFixed(1) })));
  await shot('02_follow');
  // model sheet: front, three-quarter, side, back
  await ev(() => (document.getElementById('hud').style.visibility = 'hidden'));
  const views = [
    ['03_front', 0, 4.6, 1.4],
    ['04_34', 0.75, 4.6, 1.5],
    ['05_side', 1.57, 4.8, 1.3],
    ['06_back', 3.14, 4.6, 1.6],
    ['07_face', 0.25, 1.9, 1.85, 1.6],
  ];
  await ev(() => {
    const g = window.__game;
    g.P.x += 30; // move Darren out of the way
    g.DUMP.st = 'home';
    T_(200);
  });
  for (const [n, a, d, h, ty] of views) {
    await ev(a => {
      T_(1);
      look(a[0], a[1], a[2], a[3]);
    }, [a, d, h, ty]);
    await p.waitForTimeout(250);
    await shot(n);
  }
  // weight stages
  for (const [n, w, full] of [
    ['10_w0', 0, 0],
    ['11_w35', 0.35, 0],
    ['12_w65', 0.65, 0],
    ['13_w100', 1, 0],
    ['14_stuffed', 0.65, 1],
  ]) {
    await ev(a => {
      const g = window.__game;
      g.UNLOCKS.dumpling.hold = true;
      g.DUMP.w = a[0];
      g.DUMP.vis = a[0];
      g.DUMP.full = a[1];
      T_(2);
      look(0.6, 5, 1.4);
    }, [w, full]);
    await p.waitForTimeout(250);
    await shot(n);
  }
  // jiggle: kick the belly and watch the spring
  const jig = await ev(() => {
    const g = window.__game,
      out = [];
    g.DUMP.w = 0.7;
    g.DUMP.full = 0.3;
    g.DUMP.J.vy = -1.5;
    g.DUMP.J.vz = 0.8;
    for (let i = 0; i < 40; i++) {
      T_(1);
      if (i % 4 === 0) out.push(+g.DUMP.J.y.toFixed(3));
    }
    return out;
  });
  log('jiggle y', jig);
  await ev(() => {
    __game.DUMP.J.vz = 1.6;
    __game.DUMP.J.vy = -1.2;
    T_(3);
    look(1.2, 4.5, 1.2);
  });
  await p.waitForTimeout(200);
  await shot('15_jiggle');
  await ev(() => (document.getElementById('hud').style.visibility = ''));
  // feeding through the API and the prompt
  log(
    'feed',
    await ev(() => {
      const g = window.__game,
        r = [];
      g.UNLOCKS.dumpling.hold = false;
      g.DUMP.w = 0.3;
      g.DUMP.full = 0;
      g.DUMP.st = 'follow';
      g.P.x = g.DUMP.x + 2;
      g.P.z = g.DUMP.z + 1;
      T_(10);
      const w0 = g.DUMP.w;
      r.push(g.feedDumpling('skyberry'), g.feedDumpling('skyberry'), g.feedDumpling('cloudbun'));
      const full = g.DUMP.full;
      g.addSnack('feastcake', 2, true);
      r.push(g.feedDumpling('feastcake'), g.feedDumpling('feastcake'));
      // digest for 60 seconds of game time
      T_(60 * 60);
      return { r, w0: w0.toFixed(3), full: full.toFixed(2), afterFull: g.DUMP.full.toFixed(2), w: g.DUMP.w.toFixed(3), left: g.UNLOCKS.snacks };
    }),
  );
  // Belly Bounce on a group of enemies
  log(
    'bounce',
    await ev(() => {
      const g = window.__game;
      g.DUMP.w = 0.8;
      g.P.x = 2;
      g.P.z = 6;
      g.DUMP.x = 0;
      g.DUMP.z = 3;
      const es = [g.spawnEnemy('puff', 3, 1), g.spawnEnemy('puff', 4.5, 1.5), g.spawnEnemy('gust', 2.5, -0.5)];
      T_(5);
      const hp0 = es.map(e => Math.round(e.hp));
      tap('buddy', 1);
      const fl = !!g.DUMP.flop;
      T_(70);
      return { fl, hp0, hp: es.map(e => Math.round(e.hp)), alive: es.map(e => e.alive), cd: g.DUMP.cd.toFixed(1) };
    }),
  );
  await ev(() => T_(4));
  await shot('20_bounce');
  // trampoline: drop Darren onto him
  log(
    'trampoline',
    await ev(() => {
      const g = window.__game;
      for (const e of g.G.enemies) e.alive = false;
      T_(30);
      const K = g.DATA.dumpling.bakery;
      g.DUMP.st = 'home';
      g.DUMP.x = K.x;
      g.DUMP.z = K.z;
      T_(1);
      g.P.x = g.DUMP.x;
      g.P.z = g.DUMP.z;
      g.P.y = 4;
      g.P.vy = -3;
      g.P.onG = false;
      let maxY = 0,
        bounced = false;
      for (let i = 0; i < 120; i++) {
        T_(1);
        if (g.P.vy > 10) bounced = true;
        maxY = Math.max(maxY, g.P.y);
      }
      return { bounced, maxY: maxY.toFixed(1) };
    }),
  );
  // flight: Darren flies off the island, Dumpling follows by air
  log(
    'flight',
    await ev(() => {
      const g = window.__game;
      g.DUMP.st = 'follow';
      g.DUMP.w = 0.4;
      g.P.x = 0;
      g.P.z = 10;
      g.P.y = 0;
      g.P.onG = true;
      T_(60);
      tap('fly', 2);
      const out = [];
      for (let i = 0; i < 240; i++) {
        g.In.held.jump = i < 60;
        g.P.vz = 8;
        T_(1);
        if (i % 60 === 0) out.push([g.P.y.toFixed(1), g.DUMP.y.toFixed(1), g.DUMP.air]);
      }
      g.In.held.jump = false;
      return out;
    }),
  );
  await shot('21_fly');
  // the Hangar tab
  await ev(() => {
    const g = window.__game;
    g.P.y = 0;
    g.P.x = 2;
    g.P.z = 2;
    g.P.fly = false;
    g.P.onG = true;
    g.DUMP.x = 0;
    g.DUMP.z = 0;
    g.DUMP.y = 0;
    T_(30);
  });
  await ev(() => window.openPanel('dumpling'));
  await p.waitForTimeout(400);
  await shot('30_tab');
  log('tab', await ev(() => document.getElementById('pBody').innerText.slice(0, 400)));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
