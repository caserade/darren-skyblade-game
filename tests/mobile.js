const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [w, h, n] of [[390, 780, 'port'], [800, 380, 'land']]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto('http://localhost:8766/dist/test.html'); await p.waitForTimeout(2500);
    await p.screenshot({ path: `tests/shots/m_${n}_title.png` });
    console.log(n, 'overflowX', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    await p.evaluate(() => { window.__manual = true; }); await p.tap('#startBtn');
    await p.evaluate(() => { const g = window.__game; for (let i = 0; i < 160; i++) g.tick(1 / 60); g.advanceTalk(); g.advanceTalk(); for (let i = 0; i < 90; i++) g.tick(1 / 60); });
    await p.screenshot({ path: `tests/shots/m_${n}_talk.png` });
    const i0 = await p.evaluate(() => window.__game.TALK.i); await p.tap('#talk'); await p.waitForTimeout(100); await p.evaluate(() => { const g = window.__game; g.TALK.shown = 999; }); await p.tap('#c', { position: { x: 200, y: 200 } }).catch(() => {}); await p.tap('#talk'); console.log(n, 'line index before', i0);
    console.log(n, 'talk line after taps', await p.evaluate(() => window.__game.TALK.i));
    await c.close();
  }
  await b.close();
})();
