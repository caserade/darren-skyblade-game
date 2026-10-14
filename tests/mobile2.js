// phone layout check for the 1.1 UI (chapter picker, options panel, style meter, firewood counter, enemy bars)
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [w, h, n] of [[390, 780, 'port'], [844, 390, 'land']]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto((process.env.URL || 'http://localhost:8768/dist/test.html')); await p.waitForTimeout(2500);
    await p.evaluate(() => localStorage.clear());
    await p.tap('#chapPick button:nth-child(2)');
    await p.screenshot({ path: `tests/shots/m2_${n}_title.png` });
    await p.tap('#optBtn'); await p.tap('.ptab:nth-child(8)');
    await p.screenshot({ path: `tests/shots/m2_${n}_panel.png` });
    console.log(n, 'overflowX', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    await p.tap('#panelClose');
    await p.evaluate(() => { window.__manual = true; }); await p.tap('#startBtn');
    await p.evaluate(() => { const g = window.__game; const T = k => { for (let i = 0; i < k; i++) g.tick(1 / 60); }; T(30); let k = 0; while (g.G.cine && k++ < 60) { g.advanceTalk(); g.advanceTalk(); T(2); }
      const I = g.LV.islands.thicket; g.P.x = I.x - 6; g.P.z = I.z + 1; g.P.onG = true; T(5); k = 0; while (g.G.cine && k++ < 60) { g.advanceTalk(); g.advanceTalk(); T(2); } T(60);
      for (const e of g.G.enemies) { e.shown = 300; e.cool = 1e9; } g.STY.pts = 200; g.STY.rank = 2; T(20); });
    await p.screenshot({ path: `tests/shots/m2_${n}_play.png` });
    await c.close();
  }
  await b.close();
})();
