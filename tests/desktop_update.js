// Checks the desktop app's updater (desktop-app/updater.cjs): two channels served by a local web server that
// plays GitHub, partial downloads, checksum checks, offline, the zip import and the fallback to the bundled
// game. Plain Node, no Electron or network: node tests/desktop_update.js
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildManifest, checkManifest } = require('../desktop-app/game-manifest.cjs');
const { createUpdater, makeSource, newerVersion, findGameRoot } = require('../desktop-app/updater.cjs');
const { readZip } = require('../desktop-app/unzip.cjs');

let fails = 0;
const rec = (check, ok, note = '') => {
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', check, note);
};
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skyblade-update-'));
const write = (root, files) => {
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
};
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const bundledRoot = path.join(tmp, 'bundled');
const base = { 'index.html': '<h1>v1</h1>', 'src/core.js': 'console.log(1)', 'assets/big.js': 'x'.repeat(5000) };
write(bundledRoot, base);
const bundledManifest = { ...buildManifest(bundledRoot, { build: 100 }), channel: 'claude' };

// the "GitHub" side: one folder per channel
const serverRoot = path.join(tmp, 'server');
let requests = [];
let tamper = null;
let down = false;
function publish(channel, build, files, extra = {}) {
  const dir = path.join(serverRoot, channel);
  fs.rmSync(dir, { recursive: true, force: true });
  write(path.join(dir, 'game'), files);
  const m = { ...buildManifest(path.join(dir, 'game'), { build, notes: channel + ' ' + build }), channel, ...extra };
  fs.writeFileSync(path.join(dir, 'latest.json'), JSON.stringify(m));
  return m;
}
const srv = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  requests.push(url);
  if (down) return req.socket.destroy();
  const file = path.join(serverRoot, url);
  if (!file.startsWith(serverRoot + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  let data = fs.readFileSync(file);
  if (tamper && url.endsWith(tamper)) data = Buffer.from('tampered');
  res.writeHead(200);
  res.end(data);
});

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const dataDir = path.join(tmp, 'data');
  const channels = () => [
    { id: 'claude', name: 'Claude', source: makeSource({ baseUrl: `http://127.0.0.1:${port}/claude` }) },
    { id: 'chatgpt', name: 'ChatGPT', source: makeSource({ baseUrl: `http://127.0.0.1:${port}/chatgpt` }) },
  ];
  const events = [];
  const make = () => createUpdater({ bundledRoot, bundledManifest, dataDir, channels: channels(), appVersion: '1.0.0', onChange: s => events.push(s.state) });

  rec('newerVersion', newerVersion('1.10.0', '1.9.0') && !newerVersion('1.0.0', '1.0.0'));
  rec('makeSource repo url', makeSource({ repo: 'a/b', branch: 'chatgpt-updates' }).url('game/x y.js') === 'https://raw.githubusercontent.com/a/b/chatgpt-updates/game/x%20y.js');

  let u = make();
  let s = await u.check();
  rec('nothing published: both channels say none', s.channels.every(c => c.state === 'none') && s.state === 'current', JSON.stringify(s.channels.map(c => c.state)));

  // Claude publishes the same game again (a merge): no notice
  publish('claude', 101, base);
  s = await u.check();
  rec('same files = up to date', s.channels[0].state === 'current' && !s.channels[0].offer);

  // Claude publishes a real change; ChatGPT has nothing
  publish('claude', 200, { ...base, 'index.html': '<h1>v2</h1>', 'src/new.js': 'new' });
  s = await u.check();
  const off = s.channels[0].offer;
  rec('claude update offered, only changed files count', s.state === 'available' && off && off.files === 2 && off.downloadBytes === '<h1>v2</h1>'.length + 3, JSON.stringify(off));
  requests = [];
  s = await u.install('claude');
  rec('install -> ready', s.state === 'ready' && s.pending && s.pending.build === 200);
  rec('unchanged big file was not downloaded', !requests.some(r => r.endsWith('assets/big.js')), requests.join(' '));
  rec('game in use is still the bundled one until apply', u.root() === bundledRoot);
  rec('apply switches', u.apply() && read(u.root(), 'index.html') === '<h1>v2</h1>' && read(u.root(), 'assets/big.js').length === 5000);
  s = u.status();
  rec('status after apply', s.game.channel === 'claude' && s.game.build === 200 && !s.bundled && s.state === 'current' && s.justUpdated === true);

  // a restart finds the installed game and does not re-offer it
  u = make();
  rec('restart keeps installed game', u.root().endsWith('claude-b200') && u.status().justUpdated === false);
  u.seenUpdate();
  s = await u.check();
  rec('after restart claude is current', s.channels[0].state === 'current' && s.state === 'current');

  // ChatGPT publishes a different game
  publish('chatgpt', 150, { ...base, 'index.html': '<h1>gpt</h1>' });
  s = await u.check();
  rec('chatgpt channel offers its game even with an older build number', s.channels[1].state === 'available' && s.state === 'available');
  s = await u.install('chatgpt');
  rec('chatgpt install ready', s.state === 'ready' && s.pending.channel === 'chatgpt');
  u.apply();
  rec('now playing chatgpt game', read(u.root(), 'index.html') === '<h1>gpt</h1>' && u.status().game.channel === 'chatgpt');
  s = await u.check();
  rec('claude still offered while on chatgpt game', s.channels[0].state === 'available' && s.channels[1].state === 'current', JSON.stringify(s.channels.map(c => c.state)));

  // tampered download: nothing switches
  publish('claude', 300, { ...base, 'index.html': '<h1>v3</h1>' });
  tamper = 'index.html';
  s = await u.install('claude');
  rec('tampered file refused', s.state !== 'ready' && s.error && read(u.root(), 'index.html') === '<h1>gpt</h1>', s.error);
  rec('no partial folder left', !fs.existsSync(path.join(dataDir, 'updates', 'claude-b300.partial')));
  tamper = null;

  // minApp
  publish('claude', 400, { ...base, 'index.html': '<h1>v4</h1>' }, { minApp: '9.0.0', app: { version: '9.0.0', url: 'https://github.com/x/y/releases/tag/app-v9.0.0' } });
  s = await u.check();
  rec('needs-app', s.channels[0].state === 'needs-app' && s.app && s.app.version === '9.0.0');
  publish('claude', 400, { ...base, 'index.html': '<h1>v4</h1>' }, { app: { version: '9.0.0', url: 'http://evil.example/x' } });
  s = await u.check();
  rec('non-GitHub app link ignored', !s.app);

  // offline
  down = true;
  s = await u.check();
  rec('offline reported, game kept', s.channels.every(c => c.state === 'offline') && read(u.root(), 'index.html') === '<h1>gpt</h1>');
  down = false;

  // zip import: the game nested in a folder, with junk beside it
  const zdir = path.join(tmp, 'zipsrc');
  write(zdir, { 'Darren Skyblade/dist/index.html': '<h1>zip</h1>', 'Darren Skyblade/dist/src/core.js': 'z', 'Darren Skyblade/dist/.git/config': 'x', 'Darren Skyblade/dist/meshy_key.txt': 'secret', 'Darren Skyblade/README.txt': 'hi' });
  execFileSync('zip', ['-qr', path.join(tmp, 'gpt.zip'), 'Darren Skyblade'], { cwd: zdir });
  const found = findGameRoot(readZip(fs.readFileSync(path.join(tmp, 'gpt.zip'))));
  rec('zip game root found', found && found.root === 'Darren Skyblade/dist/', JSON.stringify(found));
  s = await u.importZip(path.join(tmp, 'gpt.zip'));
  rec('zip import ready', s.state === 'ready' && s.pending.channel === 'import', s.error);
  u.apply();
  rec('imported game in use, secrets and .git skipped', read(u.root(), 'index.html') === '<h1>zip</h1>' && !fs.existsSync(path.join(u.root(), 'meshy_key.txt')) && !fs.existsSync(path.join(u.root(), '.git')));
  fs.writeFileSync(path.join(tmp, 'junk.zip'), 'not a zip');
  s = await u.importZip(path.join(tmp, 'junk.zip'));
  rec('junk zip refused', s.state !== 'ready' && /Could not import/.test(s.error), s.error);
  write(zdir, { 'single/DarrenSkyblade.html': '<html>one file</html>' });
  execFileSync('zip', ['-qr', path.join(tmp, 'single.zip'), 'single'], { cwd: zdir });
  s = await u.importZip(path.join(tmp, 'single.zip'));
  u.apply();
  rec('single-file build imported as index.html', s.state === 'ready' && read(u.root(), 'index.html') === '<html>one file</html>');

  // damaged install falls back to the bundled game
  fs.rmSync(path.join(u.root(), 'index.html'));
  u = make();
  rec('damaged install -> bundled game', u.root() === bundledRoot && u.status().bundled);

  // reset
  u.reset();
  rec('reset clears updates folder', !fs.existsSync(path.join(dataDir, 'updates', 'claude-b200')) && u.status().bundled);

  // manifest checks
  rec('checkManifest rejects traversal', !!checkManifest({ format: 1, build: 1, files: { 'index.html': { size: 1, sha256: 'a'.repeat(64) }, '../x': { size: 1, sha256: 'a'.repeat(64) } } }));
  rec('events fired', events.includes('available') && events.includes('ready') && events.includes('downloading'));

  srv.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fails ? fails + ' FAILED' : 'all updater checks passed');
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
