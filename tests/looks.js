// close-up screenshots of Darren's armor, both arm weapons, flight and Gearwing. usage: node tests/looks.js
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto((process.env.URL || 'http://localhost:8768/dist/test.html'));
  await p.waitForTimeout(3000);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(3000);
  await p.click('#modePick .mode[data-mode="adventure"]');
  await p.waitForTimeout(200);
  await p.evaluate(() => {
    window.__manual = true;
  });
  await p.click('#startBtn');
  await p.evaluate(() => {
    const g = window.__game;
    window.T_ = n => {
      for (let i = 0; i < n; i++) g.tick(1 / 60);
    };
    T_(20);
    let k = 0;
    while (g.G.cine && k++ < 80) {
      g.advanceTalk();
      g.advanceTalk();
      T_(2);
    }
    for (const id in g.DATA.parts) g.addPart(id, 40, true);
    for (const id in g.DATA.weapons) g.craft(id);
    for (const id in g.DATA.armor) g.craft(id);
    g.setStyle('twin');
    document.getElementById('hud').style.opacity = 0;
  });
  const look = async (name, setup) => {
    await p.evaluate(setup);
    await p.evaluate(() => {
      const g = window.__game;
      for (let i = 0; i < 30; i++) {
        g.tick(1 / 60);
        g.cam.dist = 3.6;
        g.cam.pitch = 0.12;
      }
    });
    await p.screenshot({ path: `tests/shots/look_${name}.png` });
  };
  const setArmor = set =>
    `(() => { const g = window.__game; for (const s of ['head','body','arms','legs']) g.setLoadout(s, '${set}_' + s); g.P.x = 2; g.P.z = 8; g.P.face = 0; g.cam.yaw = Math.PI; })()`;
  for (const set of ['thorn', 'titan', 'puff', 'gale']) await look(set, setArmor(set));
  await look('arms', () => {
    const g = window.__game;
    g.setLoadout('R', 'titanedge');
    g.setLoadout('L', 'emberblaster');
    g.P.face = 0;
    g.cam.yaw = Math.PI + 0.6;
  });
  await look('aimL', () => {
    const g = window.__game;
    g.press('heavy');
    window.T_(3);
    g.release('heavy');
    g.cam.yaw = Math.PI - 0.8;
  });
  await look('slashL', () => {
    const g = window.__game;
    window.T_(30);
    g.setLoadout('L', 'frostfang');
    g.press('heavy');
    window.T_(8);
    g.release('heavy');
    g.cam.yaw = Math.PI - 0.8;
  });
  await look('fly', () => {
    const g = window.__game;
    window.T_(40);
    g.press('fly');
    g.release('fly');
    g.keys.KeyW = true;
    window.T_(40);
    g.cam.yaw = g.P.face + 1.4;
  });
  await look('gear', () => {
    const g = window.__game,
      F = g.DATA.adventure.forge;
    g.keys.KeyW = false;
    g.P.fly = false;
    g.P.x = F.x + 3.6;
    g.P.z = F.z + 5;
    g.P.y = 0;
    g.P.onG = true;
    g.P.face = Math.atan2(F.x + 1.6 - g.P.x, F.z + 1.8 - g.P.z);
    g.cam.yaw = g.P.face;
  });
  await b.close();
})();
