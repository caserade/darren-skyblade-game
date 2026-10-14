const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/dist/test.html'); await p.waitForTimeout(2500);
  await p.click('#startBtn'); await p.waitForTimeout(6000);
  console.log(await p.evaluate(() => { const M = window.__game.Music; return { decoded: !!M.buf, seconds: M.buf && M.buf.duration.toFixed(1), playing: !!M.src, gain: M.gain && M.gain.gain.value.toFixed(2) }; }));
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
