const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 640, height: 360 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8766/dist/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => { window.__manual = true; }); await p.click('#startBtn');
  console.log(await p.evaluate(() => {
    const g = window.__game, T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); };
    const talkAll = () => { let k = 0; while (g.G.cine && k++ < 60) { g.advanceTalk(); g.advanceTalk(); T_(2); } };
    T_(10); talkAll(); const I = g.LV.islands.meadow; g.P.x = I.x; g.P.z = I.z - 10; g.P.onG = true; T_(5); talkAll(); T_(30);
    const out = [];
    for (let trial = 0; trial < 3; trial++) {
      const e = g.G.enemies.find(e => e.alive); g.G.enemies.forEach(x => { x.cool = 1e9; if (x !== e) { x.x = I.x + 8; x.z = I.z + 8; } });
      g.P.x = I.x; g.P.z = I.z; g.P.face = 0; g.P.st = 'move'; g.P.vx = g.P.vz = 0; g.P.inv = 0; g.P.stam = 100;
      e.x = I.x; e.z = I.z + 1.7; e.face = Math.PI; e.st = 'wind'; e.t = 30; e.y = 0; e.air = false;
      T_(3 + trial); g.press('dash'); g.release('dash'); T_(10);
      out.push('trial' + trial + ' enemy st ' + e.st + ' perfect ' + (g.P.perfect > 0) + ' hp ' + g.P.hp + ' stat ' + g.G.stats.perfect);
      T_(60);
    }
    return out.join('\n');
  }));
  await b.close();
})();
