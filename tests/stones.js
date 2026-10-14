const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 640, height: 360 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8766/dist/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => { window.__manual = true; }); await p.click('#startBtn');
  const out = await p.evaluate(() => {
    const g = window.__game, T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); };
    T_(10); let k = 0; while (g.G.cine && k++ < 60) { g.advanceTalk(); g.advanceTalk(); T_(2); }
    // mark meadow cleared & open stones
    g.LV.zoneState.home.state = 'cleared'; g.LV.zoneState.meadow.state = 'cleared'; g.LV.zoneState.meadow.seen = true;
    const L = g.LV.links.find(l => l.id === 'meadow-grove'); L.open = true; L.stones.forEach(s => { s.up = 1; s.g.position.y = 0; });
    g.P.x = 6.4; g.P.z = 44.5; g.P.y = 0; g.P.onG = true; g.cam.yaw = Math.atan2(27 - 6.4, 72 - 44.5); g.keys.KeyW = true;
    const log = []; let jumped = 0;
    for (let i = 0; i < 300; i++) {
      const fx = Math.sin(g.cam.yaw), fz = Math.cos(g.cam.yaw);
      if (g.P.onG && !g.groundAt(g.P.x + fx * .8, g.P.z + fz * .8)) { g.press('jump'); g.release('jump'); jumped++; log.push('JUMP f' + i); }
      T_(1);
      if (i % 3 === 0 || !g.P.onG) log.push(i + ' x' + g.P.x.toFixed(2) + ' z' + g.P.z.toFixed(2) + ' y' + g.P.y.toFixed(2) + ' vy' + g.P.vy.toFixed(1) + ' v' + Math.hypot(g.P.vx, g.P.vz).toFixed(1) + ' g' + (g.groundAt(g.P.x, g.P.z) ? 1 : 0) + ' onG' + (g.P.onG ? 1 : 0) + ' st' + g.P.st + ' j' + g.P.jumps);
      if (g.P.y < -3) break;
    }
    return log.join('\n');
  });
  console.log(out.split('\n').slice(0, 140).join('\n'));
  await b.close();
})();
