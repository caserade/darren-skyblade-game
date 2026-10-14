// visual scan: frame strips of each move + a real-time session with random play
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 640, height: 480 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/dist/test.html'); await p.waitForTimeout(3000);
  await p.evaluate(() => { window.__manual = true; }); await p.click('#startBtn');
  await p.evaluate(() => { const g = window.__game; window.T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); }; T_(10); let k = 0; while (g.G.cine && k++ < 60) { g.advanceTalk(); g.advanceTalk(); T_(2); } document.getElementById('hud').style.opacity = 0; });
  const strip = async (name, setup, frames, step) => {
    await p.evaluate(setup);
    for (let i = 0; i < frames; i++) {
      await p.evaluate(s => { const g = window.__game; for (let k = 0; k < s; k++) g.tick(1 / 60); g.cam.yaw = 2.3; g.cam.dist = 4.2; g.cam.pitch = .18; g.cam.fx = g.P.x; g.cam.fz = g.P.z; g.tick(.0005); }, step);
      await p.screenshot({ path: `tests/shots/scan_${name}_${String(i).padStart(2, '0')}.png`, clip: { x: 120, y: 60, width: 400, height: 400 } });
    }
  };
  await p.evaluate(() => { const g = window.__game; g.P.x = 1; g.P.z = 3; g.P.y = 0; g.P.st = 'move'; g.P.face = 0; g.P.onG = true; window.T_(30); g.P.x = 1; g.P.z = 3; });
  // drive the 4-hit string with buffered presses, sampling every 3 frames
  await p.evaluate(() => { const g = window.__game; g.P.x = 1; g.P.z = 3; g.press('light'); g.release('light'); });
  const presses = { 4: 1, 8: 1, 13: 1 };
  for (let i = 0; i < 26; i++) {
    if (presses[i]) await p.evaluate(() => { const g = window.__game; g.press('light'); g.release('light'); });
    await p.evaluate(() => { const g = window.__game; for (let k = 0; k < 3; k++) g.tick(1 / 60); g.cam.yaw = 2.3; g.cam.dist = 4.2; g.cam.pitch = .18; g.cam.fx = g.P.x; g.cam.fz = g.P.z; g.tick(.0005); });
    await p.screenshot({ path: `tests/shots/scan_c_${String(i).padStart(2, '0')}.png`, clip: { x: 120, y: 60, width: 400, height: 400 } });
  }
  console.log('combo end state', await p.evaluate(() => window.__game.P.name + ' combo ' + window.__game.P.combo));
  // launcher -> jump -> air string -> dive
  await p.evaluate(() => { const g = window.__game; g.P.x = 1; g.P.z = 3; g.P.st = 'move'; for (let k = 0; k < 40; k++) g.tick(1 / 60); g.press('heavy'); g.release('heavy'); });
  const air = { 6: 'jump', 9: 'light', 12: 'light', 15: 'light', 19: 'heavy' };
  for (let i = 0; i < 26; i++) {
    if (air[i]) await p.evaluate(a => { const g = window.__game; g.press(a); if (a !== 'jump') g.release(a); }, air[i]);
    if (i === 8) await p.evaluate(() => window.__game.release('jump'));
    await p.evaluate(() => { const g = window.__game; for (let k = 0; k < 3; k++) g.tick(1 / 60); g.cam.yaw = 2.3; g.cam.dist = 5; g.cam.pitch = .18; g.cam.fx = g.P.x; g.cam.fz = g.P.z; g.tick(.0005); });
    await p.screenshot({ path: `tests/shots/scan_a_${String(i).padStart(2, '0')}.png`, clip: { x: 120, y: 40, width: 400, height: 420 } });
  }
  // dash + idle/run blend
  await p.evaluate(() => { const g = window.__game; g.P.x = 1; g.P.z = 3; g.P.st = 'move'; for (let k = 0; k < 40; k++) g.tick(1 / 60); g.keys.KeyW = true; });
  for (let i = 0; i < 12; i++) {
    if (i === 6) await p.evaluate(() => { const g = window.__game; g.press('dash'); g.release('dash'); });
    await p.evaluate(() => { const g = window.__game; for (let k = 0; k < 3; k++) g.tick(1 / 60); g.cam.yaw = 2.3; g.cam.dist = 5; g.cam.pitch = .18; g.cam.fx = g.P.x; g.cam.fz = g.P.z; g.tick(.0005); });
    await p.screenshot({ path: `tests/shots/scan_r_${String(i).padStart(2, '0')}.png`, clip: { x: 120, y: 60, width: 400, height: 400 } });
  }
  await p.evaluate(() => { window.__game.keys.KeyW = false; });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
