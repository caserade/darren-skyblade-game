// Drives the real desktop app (Electron, from the desktop-app checkout) with Playwright: the game loads at
// skyblade://game/, the Hangar has an Update tab, both channels report, a published Claude update downloads and
// the game restarts on it, a ChatGPT update is offered next to it, and save export works.
// usage: xvfb-run -a node tests/desktop_app.js   (needs desktop-app/node_modules: cd desktop-app && npm install)
const { _electron: electron } = require('playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildManifest } = require('../desktop-app/game-manifest.cjs');
const { copyGame } = require('../tools/game-files.cjs');

let fails = 0;
const rec = (check, ok, note = '') => {
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', check, note);
};
const repo = path.join(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skyblade-app-'));
// "GitHub": a Claude update that changes one line of the title, and a ChatGPT game
const serverRoot = path.join(tmp, 'server');
function publish(channel, build, edit) {
  const dir = path.join(serverRoot, channel);
  copyGame(repo, path.join(dir, 'game'));
  edit(path.join(dir, 'game'));
  const m = { ...buildManifest(path.join(dir, 'game'), { build, notes: channel + ' test update' }), channel, app: { version: '1.0.0', url: 'https://github.com/caserade/darren-skyblade-game/releases' } };
  fs.writeFileSync(path.join(dir, 'latest.json'), JSON.stringify(m));
}
const srv = http.createServer((req, res) => {
  const file = path.join(serverRoot, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(serverRoot + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200);
  res.end(fs.readFileSync(file));
});

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const dataDir = path.join(tmp, 'userData');
  const app = await electron.launch({
    executablePath: path.join(repo, 'desktop-app', 'node_modules', 'electron', 'dist', 'electron'),
    args: [path.join(repo, 'desktop-app'), '--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    env: { ...process.env, SKYBLADE_UPDATE_URL: `http://127.0.0.1:${port}/claude`, SKYBLADE_CHATGPT_URL: `http://127.0.0.1:${port}/chatgpt`, SKYBLADE_BUNDLED_BUILD: '100', SKYBLADE_USER_DATA: dataDir },
  });
  await app.evaluate(({ app }) => app.getPath('userData')); // ready
  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await win.waitForTimeout(7000);
  const errs = [];
  win.on('pageerror', e => errs.push(e.message));
  rec('game page at skyblade://game/', (await win.url()) === 'skyblade://game/', await win.url());
  rec('title', (await win.title()) === 'Darren: Skyblade Hunt', await win.title());
  rec('three.js and the game loaded', await win.evaluate(() => typeof THREE !== 'undefined' && !!window.__game && !!window.skybladeDesktop));
  rec('fonts bundled', await win.evaluate(() => document.fonts.check('20px "Lilita One"')));
  let st = await win.evaluate(() => skybladeDesktop.updates.status());
  rec('bundled game in use, channels listed', st.bundled && st.channels.length === 2 && st.channels[0].id === 'claude' && st.channels[1].id === 'chatgpt');
  // nothing published yet
  st = await win.evaluate(() => skybladeDesktop.updates.check());
  rec('both channels: nothing published', st.channels.every(c => c.state === 'none'), JSON.stringify(st.channels.map(c => c.state)));
  rec('no notice on the title screen', await win.evaluate(() => { const n = document.getElementById('updNote'); return !n || n.hidden; }));
  // Hangar > Update tab
  await win.evaluate(() => document.getElementById('optBtn').click());
  await win.waitForTimeout(300);
  const tabs = await win.evaluate(() => [...document.querySelectorAll('#ptabs .ptab')].map(b => b.textContent));
  rec('Update tab present', tabs.includes('Update'), tabs.join(','));
  await win.evaluate(() => [...document.querySelectorAll('#ptabs .ptab')].find(b => b.textContent === 'Update').click());
  await win.waitForTimeout(500);
  let text = await win.evaluate(() => document.getElementById('pBody').innerText);
  rec('update page shows channels and save data', /Claude channel/i.test(text) && /ChatGPT channel/i.test(text) && /Export save file/i.test(text), text.replace(/\n+/g, ' | ').slice(0, 600));
  // publish updates on both channels
  publish('claude', 200, g => fs.writeFileSync(path.join(g, 'index.html'), fs.readFileSync(path.join(g, 'index.html'), 'utf8').replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="skyblade-test" content="updated">')));
  publish('chatgpt', 150, g => fs.writeFileSync(path.join(g, 'index.html'), fs.readFileSync(path.join(g, 'index.html'), 'utf8').replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="skyblade-test" content="chatgpt">')));
  st = await win.evaluate(() => skybladeDesktop.updates.check());
  rec('both channels offer updates', st.state === 'available' && st.channels.every(c => c.state === 'available' && c.offer && c.offer.files === 1), JSON.stringify(st.channels.map(c => [c.state, c.offer && c.offer.files])));
  await win.waitForTimeout(400);
  text = await win.evaluate(() => document.getElementById('pBody').innerText);
  rec('Get this update buttons shown', (text.match(/Get this update/g) || []).length === 2);
  await win.evaluate(() => document.getElementById('panelClose').click());
  await win.waitForTimeout(300);
  rec('title notice names both', await win.evaluate(() => document.getElementById('updNote').textContent), /Claude and ChatGPT/.test(await win.evaluate(() => document.getElementById('updNote').textContent)));
  // install Claude's update via the page API; the app reloads the page onto the new game
  await win.evaluate(() => skybladeDesktop.updates.install('claude'));
  await win.waitForTimeout(1500);
  st = await win.evaluate(() => skybladeDesktop.updates.status());
  rec('claude update downloaded (pending)', st.state === 'ready' && st.pending && st.pending.channel === 'claude', st.error || st.state);
  await win.evaluate(() => skybladeDesktop.updates.restart()).catch(() => {});
  await win.waitForTimeout(8000);
  const marker = () => win.evaluate(() => { const m = document.querySelector('meta[name="skyblade-test"]'); return m ? m.content : 'bundled'; });
  rec('restarted on the updated game', (await marker()) === 'updated', await marker());
  st = await win.evaluate(() => skybladeDesktop.updates.status());
  rec('playing claude build 200, justUpdated', !st.bundled && st.game.channel === 'claude' && st.game.build === 200);
  const note = await win.evaluate(() => document.getElementById('updNote') && document.getElementById('updNote').textContent);
  rec('notice: updated, or chatgpt still offered', /updated|ChatGPT/.test(note || ''), note);
  // saves survive: write a key, reload, read it
  await win.evaluate(() => localStorage.setItem('darrenSkyblade.testKey', 'kept'));
  await win.reload();
  await win.waitForTimeout(6000);
  rec('localStorage kept across reloads', (await win.evaluate(() => localStorage.getItem('darrenSkyblade.testKey'))) === 'kept');
  // save export gathers the game's keys
  const j = await win.evaluate(() => saveDataJSON());
  rec('save export has the game keys', j.data['darrenSkyblade.testKey'] === 'kept' && j.game === 'Darren: Skyblade Hunt');
  // reset to the bundled game
  await win.evaluate(() => skybladeDesktop.updates.reset()).catch(() => {});
  await win.reload();
  await win.waitForTimeout(6000);
  rec('reset -> bundled game', (await marker()) === 'bundled');
  rec('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  await app.close();
  srv.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fails ? fails + ' FAILED' : 'all desktop app checks passed');
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
