'use strict';
// Prepares a game update for the desktop app: node tools/publish-game-update.cjs <out-folder> [channel]
// writes <out>/latest.json (build number, channel, notes, every file's size and SHA-256, the newest app
// download) and <out>/game/ (the playable files). .github/workflows/publish-game-update.yml runs this on
// every push to main (channel claude -> branch game-updates) and to chatgpt (channel chatgpt -> branch
// chatgpt-updates), where the app looks for them.
// Build number: SKYBLADE_BUILD, else the last commit's time (seconds), so later games are always bigger.
// Notes: the newest CHANGELOG.md heading. MIN_APP: raise it when a game needs a newer app shell.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildManifest, checkManifest } = require('../desktop-app/game-manifest.cjs');
const { assertBuildEnvironment, assertSafeTree } = require('../desktop-app/package-security.cjs');
const { copyGame } = require('./game-files.cjs');

const repo = path.join(__dirname, '..');
const MIN_APP = '1.0.0';
const REPO = 'caserade/darren-skyblade-game';

function git(args) {
  return execFileSync('git', args, { cwd: repo, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}
function gitBuild() {
  if (process.env.SKYBLADE_BUILD) return Number(process.env.SKYBLADE_BUILD);
  try {
    return Number(git(['log', '-1', '--format=%ct']));
  } catch {
    return Math.floor(Date.now() / 1000);
  }
}
function gitCommit() {
  try {
    return git(['rev-parse', '--short', 'HEAD']);
  } catch {
    return '';
  }
}
function latestNotes() {
  try {
    const m = fs.readFileSync(path.join(repo, 'CHANGELOG.md'), 'utf8').match(/^## (.+)$/m);
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}
function appRelease() {
  const version = require('../desktop-app/package.json').version;
  return { version, url: `https://github.com/${REPO}/releases/tag/app-v${version}` };
}
function gameManifest(gameDir, channel = 'claude') {
  return { ...buildManifest(gameDir, { build: gitBuild(), commit: gitCommit(), notes: latestNotes(), minApp: MIN_APP }), channel, app: appRelease() };
}
module.exports = { gameManifest, gitBuild, latestNotes, appRelease, MIN_APP, REPO };

if (require.main === module) {
  const out = process.argv[2],
    channel = process.argv[3] || 'claude';
  if (!out || !/^(claude|chatgpt)$/.test(channel)) {
    console.error('usage: node tools/publish-game-update.cjs <out-folder> [claude|chatgpt]');
    process.exit(2);
  }
  assertBuildEnvironment();
  fs.mkdirSync(out, { recursive: true });
  copyGame(repo, path.join(out, 'game'));
  assertSafeTree(path.join(out, 'game'));
  const manifest = gameManifest(path.join(out, 'game'), channel);
  const bad = checkManifest(manifest);
  if (bad) {
    console.error('manifest problem: ' + bad);
    process.exit(1);
  }
  fs.writeFileSync(path.join(out, 'latest.json'), JSON.stringify(manifest, null, 1) + '\n');
  fs.writeFileSync(path.join(out, 'README.md'), `# Darren: Skyblade Hunt game updates (${channel} channel)\n\nWritten automatically by .github/workflows/publish-game-update.yml. The desktop app reads latest.json and downloads changed files from game/. Do not edit by hand.\n`);
  console.log(`${channel} game build ${manifest.build} (${manifest.commit}) · ${Object.keys(manifest.files).length} files · "${manifest.notes}"`);
}
