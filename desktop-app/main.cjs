'use strict';
// Darren: Skyblade Hunt desktop app (Electron). The game is served from one fixed address, skyblade://game/,
// so its browser saves (localStorage) stay in one place and survive restarts and updates.
//
// Updates: updater.cjs watches two public channels on GitHub, Claude's (branch game-updates, from main) and
// ChatGPT's (branch chatgpt-updates, from the chatgpt branch), and can import a ChatGPT zip from disk. The
// game gets an Update tab in its Hangar through preload.cjs (window.skybladeDesktop); the Game menu has the
// same. A downloaded game is used from the next page load, never mid-fight.
const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { createUpdater, makeSource } = require('./updater.cjs');
const { buildManifest } = require('./game-manifest.cjs');

const SCHEME = 'skyblade';
const HOST = 'game';
const ORIGIN = SCHEME + '://' + HOST;
const NAME = 'Darren: Skyblade Hunt';
const UPDATE_REPO = 'caserade/darren-skyblade-game';
const RECHECK_MS = 60 * 60 * 1000;
// Packaged builds serve their bundled game. A checkout copies the game's files (index.html, src, data, assets,
// vendor) out of the repo into the save folder at each start, so the repo's other folders never load.
let bundledRoot = app.isPackaged ? path.join(process.resourcesPath, 'game') : '';
let updater = null;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}
// For tests, SKYBLADE_UPDATE_URL / SKYBLADE_CHATGPT_URL point a channel at any web folder holding latest.json and
// game/; SKYBLADE_NO_UPDATES=1 switches updates off.
function channels() {
  if (process.env.SKYBLADE_NO_UPDATES === '1') return [];
  return [
    { id: 'claude', name: 'Claude', source: process.env.SKYBLADE_UPDATE_URL ? makeSource({ baseUrl: process.env.SKYBLADE_UPDATE_URL }) : makeSource({ repo: UPDATE_REPO, branch: 'game-updates' }) },
    { id: 'chatgpt', name: 'ChatGPT', source: process.env.SKYBLADE_CHATGPT_URL ? makeSource({ baseUrl: process.env.SKYBLADE_CHATGPT_URL }) : makeSource({ repo: UPDATE_REPO, branch: 'chatgpt-updates' }) },
  ];
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

app.setName("Darren Skyblade Hunt"); // no colon: this names the save folder in %APPDATA%
if (process.env.SKYBLADE_USER_DATA) app.setPath('userData', process.env.SKYBLADE_USER_DATA); // tests use a scratch save folder
protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

function resolveFile(pathname) {
  const root = updater.root();
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  } catch {
    return null;
  }
  return file;
}
function serve(request) {
  let url, pathname;
  try {
    url = new URL(request.url);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (url.host !== HOST) return new Response('Not found', { status: 404 });
  // The game page is starting: a downloaded update takes over now, before any of its files are read.
  if (pathname === '/' || pathname === '/index.html') updater.apply();
  const file = resolveFile(pathname);
  if (!file) return new Response('Not found', { status: 404 });
  return fs.promises.readFile(file).then(
    (data) => new Response(data, { headers: { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': String(data.length), 'Cache-Control': 'no-store' } }),
    () => new Response('Not found', { status: 404 })
  );
}

let win = null;
let lastState = '';
function onUpdateStatus(s) {
  if (!win) return;
  win.webContents.send('skyblade:update-status', s);
  const want = s.state === 'available' || s.state === 'ready' || s.state === 'needs-app' || !!s.app;
  win.setTitle(NAME + (want ? ' - update available' : ''));
  if (s.state !== lastState) {
    lastState = s.state;
    buildMenu();
  }
}
function finishInstall() {
  if (updater.apply() && win) win.webContents.reload();
}
async function restartPrompt() {
  const again = await dialog.showMessageBox(win, {
    type: 'info',
    title: 'Game updates',
    message: 'The new game is ready. Restart the game now?',
    detail: 'Your saves are kept. A fight in progress starts over. Choose Later to keep playing; the new game starts the next time the game opens.',
    buttons: ['Restart now', 'Later'],
    noLink: true,
  });
  if (again.response === 0) finishInstall();
}
async function menuCheck() {
  const s = await updater.check();
  const offers = s.channels.filter((c) => c.state === 'available');
  const buttons = ['OK'];
  for (const c of offers) buttons.unshift('Get the ' + c.name + ' update');
  if (s.app || s.state === 'needs-app') buttons.unshift('Get the new app');
  const lines = s.channels.map((c) => c.name + ': ' + c.message);
  const { response } = await dialog.showMessageBox(win, {
    type: 'info',
    title: 'Game updates',
    message: offers.length ? 'A newer game is out.' : s.state === 'ready' ? 'The new game is downloaded.' : 'Your game is up to date.',
    detail: lines.join('\n') + (s.app ? '\n\nA new version of the app (' + s.app.version + ') is out as well.' : ''),
    buttons,
    noLink: true,
  });
  const choice = buttons[response];
  if (choice === 'Get the new app') return openAppDownload();
  const c = offers.find((o) => choice === 'Get the ' + o.name + ' update');
  if (!c) return;
  const done = await updater.install(c.id);
  if (done.state !== 'ready') return dialog.showMessageBox(win, { type: 'warning', message: done.error || 'The update did not finish.', buttons: ['OK'] });
  await restartPrompt();
}
async function importZip() {
  const r = await dialog.showOpenDialog(win, { title: 'Import a ChatGPT zip of the game', filters: [{ name: 'Zip files', extensions: ['zip'] }], properties: ['openFile'] });
  if (r.canceled || !r.filePaths[0]) return null;
  const s = await updater.importZip(r.filePaths[0]);
  if (s.state !== 'ready') {
    await dialog.showMessageBox(win, { type: 'warning', message: s.error || 'Could not import that zip.', buttons: ['OK'] });
    return s;
  }
  await restartPrompt();
  return s;
}
function openAppDownload() {
  const s = updater.status();
  shell.openExternal((s.app && s.app.url) || 'https://github.com/' + UPDATE_REPO + '/releases/latest');
}
function buildMenu() {
  const toggleFull = () => win && win.setFullScreen(!win.isFullScreen());
  const st = updater.status();
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Game',
        submenu: [
          { label: 'Title screen', accelerator: 'CmdOrCtrl+H', click: () => win && win.loadURL(ORIGIN + '/') },
          { type: 'separator' },
          { label: st.state === 'available' ? 'Update the game now...' : 'Check for updates (Claude and ChatGPT)...', click: () => menuCheck() },
          { label: 'Import a ChatGPT zip...', click: () => importZip() },
          { type: 'separator' },
          { role: 'quit', label: 'Quit' },
        ],
      },
      {
        label: 'View',
        submenu: [{ label: 'Full screen', accelerator: 'F11', click: toggleFull }, { role: 'reload', label: 'Reload game' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }],
      },
      {
        label: 'Help',
        submenu: [
          { label: 'Open save folder', click: () => shell.openPath(app.getPath('userData')) },
          {
            label: 'Use the game that came with the app',
            click: () => {
              updater.reset();
              if (win) win.webContents.reload();
            },
          },
          { label: 'Game page on GitHub', click: () => shell.openExternal('https://github.com/' + UPDATE_REPO) },
          { type: 'separator' },
          { role: 'toggleDevTools', label: 'Developer tools' },
        ],
      },
    ])
  );
}
function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    backgroundColor: '#1b2a3a',
    title: NAME,
    icon: path.join(__dirname, 'home', 'icon.png'),
    autoHideMenuBar: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false, preload: path.join(__dirname, 'preload.cjs') },
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    else if (url.startsWith(ORIGIN + '/')) win.loadURL(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith(ORIGIN + '/')) return;
    e.preventDefault();
    if (/^https?:/i.test(url)) shell.openExternal(url);
  });
  win.on('closed', () => (win = null));
  win.loadURL(ORIGIN + '/');
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(() => {
    if (!app.isPackaged) {
      bundledRoot = path.join(app.getPath('userData'), 'dev-game');
      require('../tools/game-files.cjs').copyGame(path.join(__dirname, '..'), bundledRoot);
    }
    const manifest = (app.isPackaged && readJson(path.join(process.resourcesPath, 'game-manifest.json'))) || { ...buildManifest(bundledRoot, { build: Number(process.env.SKYBLADE_BUNDLED_BUILD) || 1 }), channel: 'claude' };
    updater = createUpdater({ bundledRoot, bundledManifest: manifest, dataDir: app.getPath('userData'), channels: channels(), appVersion: app.getVersion(), log: (m) => console.log('[updates] ' + m), onChange: onUpdateStatus });
    const fromGame = (e) => {
      const url = e.senderFrame && e.senderFrame.url;
      if (!url || !url.startsWith(ORIGIN + '/')) throw new Error('not allowed');
    };
    ipcMain.on('skyblade:version', (e) => (e.returnValue = app.getVersion()));
    ipcMain.handle('skyblade:update-status', (e) => (fromGame(e), updater.status()));
    ipcMain.handle('skyblade:update-check', (e) => (fromGame(e), updater.check()));
    ipcMain.handle('skyblade:update-install', async (e, id) => {
      fromGame(e);
      return updater.install(/^(claude|chatgpt)$/.test(id) ? id : 'claude');
    });
    ipcMain.handle('skyblade:update-import', (e) => (fromGame(e), importZip()));
    ipcMain.handle('skyblade:update-reset', (e) => (fromGame(e), updater.reset(), updater.status()));
    ipcMain.handle('skyblade:update-seen', (e) => (fromGame(e), updater.seenUpdate()));
    ipcMain.handle('skyblade:get-app', (e) => (fromGame(e), openAppDownload()));
    ipcMain.handle('skyblade:restart', (e) => (fromGame(e), setTimeout(finishInstall, 300)));
    ipcMain.handle('skyblade:fullscreen', (e) => (fromGame(e), win && win.setFullScreen(!win.isFullScreen())));
    protocol.handle(SCHEME, serve);
    buildMenu();
    createWindow();
    setTimeout(() => updater.check(), 4000);
    setInterval(() => updater.check(), RECHECK_MS);
  });
  app.on('window-all-closed', () => app.quit());
}
