'use strict';
// The files that make up the playable game (what the desktop app bundles and the updater publishes):
// everything index.html loads. Tools, tests, docs, raw models and the single-file builds stay out.
const fs = require('node:fs');
const path = require('node:path');
const GAME_PATHS = ['index.html', 'src', 'data', 'assets', 'vendor'];
function copyGame(repo, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const rel of GAME_PATHS) fs.cpSync(path.join(repo, rel), path.join(dest, rel), { recursive: true });
}
module.exports = { GAME_PATHS, copyGame };
