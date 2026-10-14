// visual review shots of key scenes. usage: node tests/visual.js <tag>
const { chromium } = require('playwright-core');
const tag = process.argv[2] || 'v';
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  const url = process.env.URL || 'http://localhost:8768/dist/test.html';
  await p.goto(url);
  await p.waitForTimeout(3500);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(3500);
  const shot = async n => {
    await p.screenshot({ path: `tests/shots/${tag}_${n}.png` });
  };
  const ev = f => p.evaluate(f);
  await shot('0title');
  await ev(() => {
    window.__manual = true;
  });
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
    T_(30);
    talkAll();
    g.cam.yaw = 0.5;
    T_(60);
  });
  await shot('1home');
  await ev(() => {
    const g = window.__game,
      I = g.LV.islands.meadow;
    g.P.x = I.x - 3;
    g.P.z = I.z - 8;
    g.P.onG = true;
    T_(5);
    talkAll();
    T_(70);
    g.G.enemies.forEach(e => (e.cool = 1e9));
    g.cam.yaw = 0.2;
    g.press('light');
    g.release('light');
    T_(9);
  });
  await shot('2fight');
  await ev(() => {
    const g = window.__game,
      I = g.LV.islands.peak;
    ['meadow', 'grove', 'ridge', 'gate'].forEach(z => (g.LV.zoneState[z].state = 'cleared'));
    g.LV.zoneState.peak.seen = true;
    g.G.enemies.forEach(e => {
      e.alive = false;
      e.gone = true;
      g.__x = 0;
    });
    g.P.x = I.x;
    g.P.z = I.z - 15;
    T_(5);
    T_(90);
    g.G.boss && (g.G.boss.cool = 1e9);
    g.cam.yaw = 0;
    g.cam.pitch = 0.25;
    T_(30);
  });
  await shot('3boss');
  await ev(() => {
    const g = window.__game;
    g.G.paused = false;
    g.loadChapter('ch2');
    g.startGame(false);
    T_(30);
    talkAll();
    g.cam.yaw = 1.4;
    T_(60);
  });
  await shot('4snow');
  await ev(() => {
    const g = window.__game;
    g.loadChapter('adv');
    g.startGame(false);
    T_(30);
    talkAll();
    g.cam.yaw = -2.2;
    g.cam.pitch = 0.3;
    T_(60);
  });
  await shot('5haven');
  await ev(() => {
    const g = window.__game,
      I = g.LV.islands.spires;
    g.P.x = I.x - 14;
    g.P.z = I.z - 16;
    g.P.y = 6;
    g.P.onG = false;
    g.P.fly = true;
    g.P.fe = 100;
    g.cam.yaw = Math.atan2(I.x - g.P.x, I.z - g.P.z);
    g.keys.KeyW = true;
    T_(40);
    g.keys.KeyW = false;
    T_(5);
  });
  await shot('6fly');
  await ev(() => {
    const g = window.__game;
    g.P.fly = false;
    g.P.x = 2;
    g.P.z = 6;
    g.P.y = 0;
    g.P.onG = true;
    T_(40);
    g.cam.dist = 3.4;
    g.cam.yaw = Math.PI;
    g.P.face = 0;
    g.cam.pitch = 0.1;
    for (let i = 0; i < 40; i++) {
      g.tick(1 / 60);
      g.cam.dist = 3.4;
    }
    document.getElementById('hud').style.opacity = 0;
  });
  await shot('7close');
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
