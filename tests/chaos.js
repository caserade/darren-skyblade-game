const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' | ' + (e.stack || '').split('\n')[1]));
  await p.goto((process.env.URL || 'http://localhost:8768/dist/test.html')); await p.waitForTimeout(3000);
  await p.click('#startBtn'); await p.waitForTimeout(500);
  // skip to meadow fight in real time
  await p.evaluate(() => { const g = window.__game; for (let i = 0; i < 40; i++) g.advanceTalk(); const I = g.LV.islands.meadow; g.P.x = I.x; g.P.z = I.z - 9; });
  await p.waitForTimeout(800); await p.evaluate(() => { const g = window.__game; for (let i = 0; i < 40; i++) g.advanceTalk(); });
  const ks = ['KeyJ', 'KeyJ', 'KeyJ', 'KeyK', 'Space', 'ShiftLeft', 'Digit1', 'Digit2', 'KeyF', 'KeyQ', 'KeyJ'], mv = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
  const t0 = Date.now(); let frames0 = await p.evaluate(() => window.__game.G.time);
  for (let i = 0; i < 260; i++) {
    if (i % 12 === 0) { for (const m of mv) await p.keyboard.up(m); await p.keyboard.down(mv[Math.floor(Math.random() * 4)]); }
    await p.keyboard.press(ks[Math.floor(Math.random() * ks.length)]); await p.waitForTimeout(60);
    if (i % 65 === 64) console.log(await p.evaluate(() => { const g = window.__game; return JSON.stringify({ mode: g.G.mode, hp: Math.round(g.P.hp), st: g.P.st, zone: g.LV.active, alive: g.G.enemies.filter(e => e.alive).length, y: g.P.y.toFixed(1), cine: g.G.cine }); }));
  }
  console.log('game seconds per real second', ((await p.evaluate(() => window.__game.G.time) - frames0) / ((Date.now() - t0) / 1000)).toFixed(2));
  console.log(errs.length ? errs.slice(0, 6).join('\n') : 'no errors'); await b.close();
})();
