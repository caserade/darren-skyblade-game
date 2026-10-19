'use strict';
// Builds the Windows desktop app: out/Darren-Skyblade-Windows/ (and a .zip of it when the
// zip command or PowerShell is available). Run from desktop-app/: npm install, then
// npm run build:win. Works on Linux, Mac or Windows; no Wine needed (packager writes the
// icon and file details into the .exe itself).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { assertBuildEnvironment, assertSafeTree, stageApp } = require('./package-security.cjs');

const here = __dirname;
const pkg = require('./package.json');
const out = path.join(here, 'out');
// DESKTOP_PLATFORM=linux builds the same app for Linux; only used to test the packaged
// layout where no Windows PC is available.
const platform = process.env.DESKTOP_PLATFORM || 'win32';
const folderName = platform === 'win32' ? 'Darren-Skyblade-Windows' : 'Darren-Skyblade-' + platform;
const exeName = 'Darren Skyblade';
const { copyGame } = require('../tools/game-files.cjs');
const { GAME_PATHS } = require('../tools/game-files.cjs');

// rename fails across drives (a checkout on D: with %TEMP% on C:), so copy instead there.
function move(from, to) {
  try {
    fs.renameSync(from, to);
  } catch (e) {
    if (e.code !== 'EXDEV') throw e;
    fs.cpSync(from, to, { recursive: true });
    fs.rmSync(from, { recursive: true, force: true });
  }
}

(async () => {
  assertBuildEnvironment();
  assertSafeTree(here, { skip: (rel) => /^(?:node_modules|out)(?:\/|$)/.test(rel) });
  for (const rel of GAME_PATHS) if (rel !== 'index.html') assertSafeTree(path.join(here, '..', rel));
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'skyblade-package-'));
  try {
    const appSource = path.join(staging, 'app');
    stageApp(here, appSource);
    const dest = path.join(staging, folderName);
    const zip = path.join(staging, folderName + '.zip');
    const { packager } = require('@electron/packager');
    const [built] = await packager({
      dir: appSource,
      out: path.join(staging, 'build'),
      name: exeName,
      executableName: exeName,
      platform,
      arch: 'x64',
      electronVersion: require('electron/package.json').version,
      asar: true,
      prune: false,
      overwrite: true,
      ignore: [
        /^\/out($|\/)/,
        /^\/node_modules($|\/)/,
        /^\/build-windows\.cjs$/,
        /^\/icon\.ico$/,
        /^\/README/,
      ],
      icon: path.join(here, 'icon.ico'),
      appVersion: pkg.version,
      appCopyright: 'Private game for Michael',
      win32metadata: {
        CompanyName: 'Michael (private)',
        FileDescription: pkg.productName,
        ProductName: pkg.productName,
        InternalName: exeName,
      },
    });
    fs.renameSync(built, dest);

    // The game itself (index.html, src, data, assets, vendor) beside the app as resources/game, with its
    // manifest (build number and every file's checksum) so the updater can tell what is new.
    copyGame(path.join(here, '..'), path.join(dest, 'resources', 'game'));
    const { gameManifest } = require('../tools/publish-game-update.cjs');
    fs.writeFileSync(path.join(dest, 'resources', 'game-manifest.json'), JSON.stringify(gameManifest(path.join(dest, 'resources', 'game'), 'claude')));
    fs.writeFileSync(
      path.join(dest, 'HOW-TO-PLAY.txt'),
      [
        'Darren: Skyblade Hunt for Windows',
        '',
        'Double-click "Darren Skyblade.exe" to play. Keep this whole folder together; the .exe needs',
        'the files beside it. Right-click the .exe and choose Send to > Desktop (create shortcut)',
        'to start it from the desktop.',
        '',
        'Windows may say "Windows protected your PC" the first time, because the app is not signed',
        'by a paid publisher certificate. Click "More info", then "Run anyway".',
        '',
        'Keyboard, mouse and controllers work as in the browser version. F11 is full screen,',
        'Ctrl+H goes back to the title screen.',
        '',
        'UPDATES: the app checks two channels when it starts and every hour after: Claude (the main',
        'game, from the GitHub repository) and ChatGPT (the chatgpt branch). When either has a game',
        'you do not have, the title screen says so and the Hangar gets an Update tab. Press Get this',
        'update: only the changed files download, then the game restarts on the title screen with',
        'your saves kept. Game > Check for updates in the menu bar does the same, and Game > Import',
        'a ChatGPT zip installs a zip ChatGPT handed back. Help > Use the game that came with the app',
        'goes back to the bundled game. No GitHub account or key is needed.',
        '',
        'If a new version of the app itself is out, the Update tab offers Get the new app: extract',
        'that zip to a new folder and run its .exe. Your saves live in',
        '%APPDATA%\\Darren Skyblade Hunt (Help > Open save folder) and are kept.',
        '',
      ].join('\r\n')
    );
    assertSafeTree(dest);
    try {
      if (process.platform === 'win32')
        execFileSync('powershell', [
          '-NoProfile',
          '-Command',
          "$ErrorActionPreference = 'Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; " +
            `[System.IO.Compression.ZipFile]::CreateFromDirectory('${dest.replace(/'/g, "''")}', '${zip.replace(/'/g, "''")}', [System.IO.Compression.CompressionLevel]::Optimal, $true)`,
        ]);
      else execFileSync('zip', ['-qry', zip, folderName], { cwd: staging });
    } catch {
      fs.rmSync(zip, { force: true });
      console.log('No zip tool available; the checked app folder can be zipped manually.');
    }
    // Only expose checked outputs. A failed guard leaves no new distributable behind.
    fs.mkdirSync(out, { recursive: true });
    fs.rmSync(path.join(out, folderName), { recursive: true, force: true });
    fs.rmSync(path.join(out, folderName + '.zip'), { force: true });
    move(dest, path.join(out, folderName));
    if (fs.existsSync(zip)) move(zip, path.join(out, folderName + '.zip'));
    console.log('Built ' + path.join(out, folderName));
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
