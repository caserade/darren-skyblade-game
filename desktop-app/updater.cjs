'use strict';
// Game updates for the desktop app. The game (index.html, src/, data/, assets/, vendor/) is what changes
// between versions; the app around it rarely does. The app watches two public channels on GitHub, each a
// branch rebuilt by .github/workflows/publish-game-update.yml:
//   Claude   -> game-updates     (from main, Claude's version: the main one)
//   ChatGPT  -> chatgpt-updates  (from the chatgpt branch, where ChatGPT's work is pushed)
// Each channel has a latest.json (build number = commit time, notes, every file's size and SHA-256) and a
// game/ folder. When a channel lists a game the app does not have, the player is told; installing downloads
// only the files whose checksum is missing locally, checks every byte, and switches over on the next page
// load. The game that came with the app (resources/game) is never touched, so a damaged update falls back
// to it. Saves live in browser storage tied to skyblade://game, not in these files, so they carry over.
//
// A ChatGPT zip (the kind ChatGPT hands back) can also be imported straight from disk: importZip() finds the
// game inside it, checks the file names and installs it like a downloaded update.
//
// Layout in the save folder: updates/<channel>-b<build>/ (a full game folder plus manifest.json),
// updates/current.json (which one to use) and updates/seen.json (the last game the player was told about).
// Plain Node, no Electron, so tests drive it directly.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildManifest, checkManifest, safePath } = require('./game-manifest.cjs');
const { readZip } = require('./unzip.cjs');

const PARALLEL = 4;
const MANIFEST_TIMEOUT = 15000;
const FILE_TIMEOUT = 120000;
const MAX_IMPORT_BYTES = 600e6;

function newerVersion(a, b) {
  const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
}
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}
function writeJsonAtomic(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1));
  fs.renameSync(tmp, file);
}
// Where a channel's files come from: a branch of the public repo, or any web folder (tests use a local one).
function makeSource({ repo, branch = 'game-updates', baseUrl } = {}) {
  const enc = (rel) => rel.split('/').map(encodeURIComponent).join('/');
  let base;
  if (baseUrl) base = String(baseUrl).replace(/\/+$/, '');
  else if (repo && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) base = `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}`;
  else return null;
  return { url: (rel, tag) => base + '/' + enc(rel) + (tag ? '?v=' + encodeURIComponent(tag) : '') };
}
// A download link must be an https page on GitHub: it is opened in the player's browser.
function safeLink(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && /(^|\.)github\.com$/.test(u.hostname) ? u.href : '';
  } catch {
    return '';
  }
}
const sha = (data) => crypto.createHash('sha256').update(data).digest('hex');

// Find the game inside a zip's entries: the shortest folder that holds index.html next to a src/ folder.
// A zip with only a single-file build (DarrenSkyblade.html) is accepted too.
function findGameRoot(entries) {
  const names = entries.map((e) => e.name.replace(/\\/g, '/'));
  const dirs = new Set(names.filter((n) => n.endsWith('/index.html')).map((n) => n.slice(0, -'index.html'.length)));
  if (names.includes('index.html')) dirs.add('');
  const roots = [...dirs].filter((d) => names.some((n) => n.startsWith(d + 'src/') && n.endsWith('.js'))).sort((a, b) => a.length - b.length);
  if (roots.length) return { root: roots[0], single: null };
  const singles = entries.filter((e) => /(?:^|\/)DarrenSkyblade[^/]*\.html$/i.test(e.name.replace(/\\/g, '/'))).sort((a, b) => b.size - a.size);
  if (singles.length) return { root: null, single: singles[0] };
  return null;
}

function createUpdater(opts) {
  const { bundledRoot, bundledManifest, dataDir, channels = [], appVersion = '0', fetch: fetchFn = globalThis.fetch, log = () => {}, onChange = () => {} } = opts;
  const dir = path.join(dataDir, 'updates');
  const bundled = { root: bundledRoot, manifest: bundledManifest, build: bundledManifest.build, channel: 'bundled', key: 'bundled' };
  let active = bundled;
  let pending = null; // downloaded or imported, used from the next page load (see apply)
  let installing = null;
  let checking = null;
  const CH = channels.map((c) => ({ id: c.id, name: c.name, source: c.source, state: c.source ? 'idle' : 'off', message: c.source ? '' : 'Switched off.', offer: null, latest: null, checkedAt: 0 }));
  const status = { progress: 0, justUpdated: false, app: null, busy: '', error: '' };
  const changed = () => {
    try {
      onChange(api.status());
    } catch (e) {
      log('status listener failed: ' + e.message);
    }
  };
  const keyOf = (channel, build) => channel + '-b' + build;

  // An installed game counts only if every file it lists is there at the right size.
  function loadInstalled(key) {
    if (!/^[a-z]+-b\d+$/.test(key)) return null;
    const root = path.join(dir, key);
    const manifest = readJson(path.join(root, 'manifest.json'));
    if (!manifest || checkManifest(manifest) || keyOf(manifest.channel || '', manifest.build) !== key) return null;
    for (const [rel, f] of Object.entries(manifest.files)) {
      try {
        if (fs.statSync(path.join(root, ...rel.split('/'))).size !== f.size) return null;
      } catch {
        return null;
      }
    }
    return { root, manifest, build: manifest.build, channel: manifest.channel, key };
  }
  function cleanup(keep) {
    let names = [];
    try {
      names = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (!/^[a-z]+-b\d+(\.partial)?$/.test(name) || keep.includes(name)) continue;
      fs.rmSync(path.join(dir, name), { recursive: true, force: true });
    }
  }
  function noteSeen() {
    const seen = readJson(path.join(dir, 'seen.json'));
    const before = seen && seen.key;
    if (before === active.key) return;
    if (before != null && active !== bundled) status.justUpdated = true;
    try {
      fs.mkdirSync(dir, { recursive: true });
      writeJsonAtomic(path.join(dir, 'seen.json'), { key: active.key });
    } catch (e) {
      log('could not record the game version: ' + e.message);
    }
  }
  (function start() {
    const current = readJson(path.join(dir, 'current.json'));
    if (current && current.key) {
      const inst = loadInstalled(current.key);
      if (inst) active = inst;
      else log('installed game ' + current.key + ' is incomplete; using the bundled game');
    }
    cleanup(active === bundled ? [] : [active.key]);
    noteSeen();
  })();

  async function get(ch, rel, timeout, tag) {
    const res = await fetchFn(ch.source.url(rel, tag), { signal: AbortSignal.timeout(timeout), cache: 'no-store' });
    if (!res.ok) throw Object.assign(new Error('HTTP ' + res.status + ' for ' + rel), { http: res.status });
    return Buffer.from(await res.arrayBuffer());
  }
  // Bytes still to download for a manifest: files whose content the game in use lacks.
  function missingBytes(manifest, from = active.manifest) {
    const have = new Set(Object.values(from.files || {}).map((f) => f.sha256));
    let bytes = 0,
      files = 0;
    for (const f of Object.values(manifest.files))
      if (!have.has(f.sha256)) {
        bytes += f.size;
        files++;
      }
    return { bytes, files };
  }
  function sameGame(manifest, as) {
    return missingBytes(manifest, as.manifest).files === 0 && Object.keys(manifest.files).length === Object.keys(as.manifest.files || {}).length;
  }
  function finishStage(stage, manifest, key) {
    fs.writeFileSync(path.join(stage, 'manifest.json'), JSON.stringify(manifest));
    const final = path.join(dir, key);
    fs.rmSync(final, { recursive: true, force: true });
    fs.renameSync(stage, final);
    writeJsonAtomic(path.join(dir, 'current.json'), { key });
    pending = { root: final, manifest, build: manifest.build, channel: manifest.channel, key };
    for (const c of CH) c.offer = null;
    cleanup([key, active === bundled ? '' : active.key]);
  }

  async function download(ch, manifest) {
    const key = keyOf(ch.id, manifest.build);
    const stage = path.join(dir, key + '.partial');
    fs.rmSync(stage, { recursive: true, force: true });
    fs.mkdirSync(stage, { recursive: true });
    const have = new Map();
    for (const src of [active, pending].filter(Boolean)) for (const [rel, f] of Object.entries(src.manifest.files || {})) have.set(f.sha256, path.join(src.root, ...rel.split('/')));
    const jobs = Object.entries(manifest.files);
    const total = missingBytes(manifest).bytes;
    let done = 0,
      downloaded = 0,
      lastShown = 0;
    const one = async ([rel, f]) => {
      const dest = path.join(stage, ...rel.split('/'));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const local = have.get(f.sha256);
      if (local) {
        try {
          const data = fs.readFileSync(local);
          if (data.length === f.size && sha(data) === f.sha256) {
            fs.writeFileSync(dest, data);
            return;
          }
        } catch {}
      }
      const data = await get(ch, 'game/' + rel, FILE_TIMEOUT, f.sha256.slice(0, 16));
      if (data.length !== f.size || sha(data) !== f.sha256) throw new Error(rel + ' did not match its checksum (the update may still be publishing)');
      fs.writeFileSync(dest, data);
      downloaded++;
      done += f.size;
      status.progress = total ? Math.min(1, done / total) : 1;
      if (status.progress - lastShown >= 0.02 || status.progress === 1) {
        lastShown = status.progress;
        changed();
      }
    };
    const queue = jobs.slice();
    let failure = null;
    await Promise.all(
      Array.from({ length: PARALLEL }, async () => {
        while (queue.length && !failure) await one(queue.shift()).catch((e) => (failure = failure || e));
      })
    );
    if (failure) throw failure;
    finishStage(stage, { ...manifest, channel: ch.id }, key);
    return { downloaded, bytes: total };
  }

  function noteApp(manifest) {
    const a = manifest && manifest.app;
    const url = a && safeLink(a.url);
    if (a && url && typeof a.version === 'string' && newerVersion(a.version, appVersion)) status.app = { version: a.version.slice(0, 20), url };
  }
  async function checkChannel(ch) {
    if (!ch.source) return;
    ch.state = 'checking';
    ch.message = 'Checking...';
    changed();
    let manifest;
    try {
      manifest = JSON.parse((await get(ch, 'latest.json', MANIFEST_TIMEOUT, String(Date.now()))).toString('utf8'));
    } catch (e) {
      ch.offer = null;
      ch.state = e.http === 404 ? 'none' : e.http ? 'error' : 'offline';
      ch.message = e.http === 404 ? 'Nothing published on this channel yet.' : e.http ? 'Could not check (' + e.message + ').' : 'Could not reach GitHub.';
      log(ch.id + ' check: ' + e.message);
      return;
    }
    ch.checkedAt = Date.now();
    const bad = checkManifest(manifest);
    if (bad) {
      ch.offer = null;
      ch.state = 'error';
      ch.message = 'The published game looks wrong (' + bad + '), so it was skipped.';
      return;
    }
    noteApp(manifest);
    ch.latest = describe(manifest);
    const newest = pending || active;
    if ((newest.channel === ch.id && manifest.build <= newest.build) || sameGame(manifest, newest)) {
      ch.offer = null;
      ch.state = 'current';
      ch.message = pending && pending.channel === ch.id ? 'Downloaded; it starts the next time a menu loads.' : 'You have this one.';
    } else if (manifest.minApp && newerVersion(manifest.minApp, appVersion)) {
      ch.offer = null;
      ch.state = 'needs-app';
      ch.message = 'A newer game is out, but it needs the new app (version ' + manifest.minApp + ').';
    } else {
      ch.offer = manifest;
      ch.state = 'available';
      ch.message = 'A different game is ready to download.';
    }
  }
  async function runCheck() {
    status.app = null;
    await Promise.all(CH.map(checkChannel));
    changed();
    return api.status();
  }
  async function runInstall(id) {
    if (checking) await checking;
    await runCheck();
    const ch = CH.find((c) => c.id === id && c.state === 'available' && c.offer);
    if (!ch) return api.status();
    const manifest = ch.offer;
    status.busy = ch.id;
    status.error = '';
    status.progress = 0;
    changed();
    try {
      fs.mkdirSync(dir, { recursive: true });
      const got = await download(ch, manifest);
      status.progress = 1;
      ch.state = 'current';
      ch.message = 'Downloaded; it starts the next time a menu loads.';
      log('downloaded ' + ch.id + ' b' + manifest.build + ': ' + got.downloaded + ' files, ' + got.bytes + ' bytes');
    } catch (e) {
      fs.rmSync(path.join(dir, keyOf(ch.id, manifest.build) + '.partial'), { recursive: true, force: true });
      status.error = 'The update did not finish, so your current game was kept. Try again in a few minutes.';
      log('update download failed: ' + e.message);
    }
    status.busy = '';
    changed();
    return api.status();
  }
  // Install a ChatGPT zip from disk (the kind ChatGPT hands back). Names are checked like downloaded ones.
  async function runImport(zipPath) {
    status.busy = 'import';
    status.error = '';
    status.progress = 0;
    changed();
    const build = Math.floor(Date.now() / 1000);
    const key = keyOf('import', build);
    const stage = path.join(dir, key + '.partial');
    try {
      const entries = readZip(fs.readFileSync(zipPath));
      const found = findGameRoot(entries);
      if (!found) throw new Error('this zip does not contain the game (no index.html with a src folder)');
      let total = 0;
      for (const e of entries) total += e.size;
      if (total > MAX_IMPORT_BYTES) throw new Error('the zip is too big to be the game');
      fs.rmSync(stage, { recursive: true, force: true });
      fs.mkdirSync(stage, { recursive: true });
      let n = 0;
      if (found.single) {
        fs.writeFileSync(path.join(stage, 'index.html'), found.single.read());
        n = 1;
      } else
        for (const e of entries) {
          const name = e.name.replace(/\\/g, '/');
          if (!name.startsWith(found.root)) continue;
          const rel = name.slice(found.root.length);
          if (!safePath(rel) || /(^|\/)\.git(\/|$)/.test(rel) || /_key\.txt$/.test(rel)) continue;
          const dest = path.join(stage, ...rel.split('/'));
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, e.read());
          n++;
          status.progress = n / entries.length;
        }
      const manifest = { ...buildManifest(stage, { build, notes: 'Imported from ' + path.basename(zipPath) }), channel: 'import' };
      const bad = checkManifest(manifest);
      if (bad) throw new Error(bad);
      finishStage(stage, manifest, key);
      status.progress = 1;
      log('imported ' + path.basename(zipPath) + ': ' + n + ' files');
    } catch (e) {
      fs.rmSync(stage, { recursive: true, force: true });
      status.error = 'Could not import that zip: ' + e.message + '.';
      log('import failed: ' + e.message);
    }
    status.busy = '';
    changed();
    return api.status();
  }

  const describe = (m) => ({ build: m.build, channel: m.channel || '', commit: String(m.commit || '').slice(0, 12), notes: String(m.notes || '').slice(0, 300) });
  const api = {
    root: () => active.root,
    build: () => active.build,
    // Switch to a downloaded game. Call only right before reloading the page, so one page never mixes files.
    apply() {
      if (!pending) return false;
      active = pending;
      pending = null;
      noteSeen();
      for (const c of CH) if (c.state === 'current' && c.id === active.channel) c.message = 'You have this one.';
      changed();
      return true;
    },
    check() {
      if (!CH.some((c) => c.source)) return Promise.resolve(api.status());
      if (installing) return installing;
      if (!checking) checking = runCheck().finally(() => (checking = null));
      return checking;
    },
    install(id) {
      if (pending || installing) return Promise.resolve(api.status());
      installing = runInstall(id).finally(() => (installing = null));
      return installing;
    },
    importZip(zipPath) {
      if (installing) return installing;
      installing = runImport(zipPath).finally(() => (installing = null));
      return installing;
    },
    seenUpdate() {
      status.justUpdated = false;
    },
    // Back to the game that came with the app.
    reset() {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}
      active = bundled;
      pending = null;
      for (const c of CH) {
        c.offer = null;
        if (c.source) {
          c.state = 'idle';
          c.message = '';
        }
      }
      status.justUpdated = false;
      status.error = '';
      noteSeen();
      changed();
    },
    status: () => {
      const available = CH.filter((c) => c.state === 'available');
      const state = status.busy ? (status.busy === 'import' ? 'importing' : 'downloading') : pending ? 'ready' : available.length ? 'available' : CH.some((c) => c.state === 'checking') ? 'checking' : CH.some((c) => c.state === 'needs-app') ? 'needs-app' : CH.every((c) => c.state === 'off') ? 'off' : 'current';
      return {
        state,
        progress: status.progress,
        error: status.error,
        justUpdated: status.justUpdated,
        appVersion,
        app: status.app,
        bundled: active === bundled,
        game: describe(active.manifest),
        pending: pending ? describe(pending.manifest) : null,
        channels: CH.map((c) => ({
          id: c.id,
          name: c.name,
          state: c.state,
          message: c.message,
          checkedAt: c.checkedAt,
          latest: c.latest,
          offer: c.offer ? { ...describe(c.offer), downloadBytes: missingBytes(c.offer).bytes, files: missingBytes(c.offer).files } : null,
        })),
      };
    },
  };
  return api;
}

module.exports = { createUpdater, makeSource, newerVersion, safeLink, findGameRoot };
