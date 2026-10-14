const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/_local_index.html'); await p.waitForTimeout(3500);
  console.log('file:// skinned', await p.evaluate(() => !!window.__skinned), 'music bytes', await p.evaluate(() => (window.DARREN_MUSIC_B64 || '').length));
  await p.click('#startBtn'); await p.waitForTimeout(3000);
  console.log('playing', await p.evaluate(() => window.__game.G.mode + ' cine=' + window.__game.G.cine + ' line=' + window.__game.TALK.line));
  await p.keyboard.press('KeyJ'); await p.waitForTimeout(400);
  console.log('after J line index', await p.evaluate(() => window.__game.TALK.i));
  await p.screenshot({ path: 'tests/shots/fileurl.png' });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
