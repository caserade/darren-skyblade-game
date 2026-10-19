/* DESKTOP: the Windows app's Update tab and title-screen notice (only when the game runs inside the desktop app,
   which gives it window.skybladeDesktop through desktop-app/preload.cjs), plus Save data export / import,
   which works everywhere so progress can move between a browser and the app. Loaded last. */
const DESK = window.skybladeDesktop || null;
const SAVE_PREFIX = 'darrenSkyblade.';

/* ---------- save data export / import (browser and app) ---------- */
function saveDataJSON() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(SAVE_PREFIX) && !k.endsWith('.recovery')) data[k] = localStorage.getItem(k);
  }
  return { game: 'Darren: Skyblade Hunt', version: DATA.meta.version, saved: new Date().toISOString(), data };
}
function saveDataExport() {
  const blob = new Blob([JSON.stringify(saveDataJSON(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'darren-skyblade-save-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function saveDataImport(file, note) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      const keys = Object.keys((j && j.data) || {}).filter(k => k.startsWith(SAVE_PREFIX));
      if (!keys.length) throw new Error('no Darren save data in that file');
      for (const k of keys) localStorage.setItem(k, String(j.data[k]));
      note('Loaded ' + keys.length + ' saved items. Reloading...');
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      note('Could not load that file: ' + e.message + '.');
    }
  };
  r.readAsText(file);
}
function fillSaveData(box) {
  const s = section(box, 'Save data', 'Progress, unlocks and settings are saved in this browser (or in the app). Export them to a file to move them to another computer, a browser, or the Windows app.');
  const row = el('div', 'btns sub'),
    note = el('p', 'hint', '');
  const ex = el('button', 'go opt', 'Export save file');
  ex.type = 'button';
  ex.addEventListener('click', () => {
    saveDataExport();
    note.textContent = 'Saved a .json file in your downloads.';
  });
  const im = el('button', 'go opt', 'Import save file...');
  im.type = 'button';
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json,application/json';
  inp.hidden = true;
  inp.addEventListener('change', () => inp.files[0] && saveDataImport(inp.files[0], t => (note.textContent = t)));
  im.addEventListener('click', () => inp.click());
  row.append(ex, im, inp);
  s.append(row, note);
}

/* ---------- the Update tab (desktop app only) ---------- */
const UPD = { status: null, box: null, note: null };
function fmtBytes(n) {
  return n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.round(n / 1e3) + ' KB';
}
function fmtBuild(g) {
  if (!g || !g.build) return '';
  if (g.build < 1e9) return 'build ' + g.build; // not a commit time (a test build)
  const d = new Date(g.build * 1000);
  return (g.channel === 'import' ? 'imported ' : '') + d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (g.commit ? ' (' + g.commit.slice(0, 7) + ')' : '');
}
function fillUpdate(box) {
  UPD.box = box;
  const s = UPD.status;
  const top = section(box, 'Game updates', 'The app checks two channels on GitHub when it starts and every hour: Claude (the main game) and ChatGPT (the chatgpt branch). Nothing is sent anywhere and no account is needed.');
  if (!s) {
    top.appendChild(el('p', 'hint', 'Checking...'));
    DESK.updates.status().then(st => {
      UPD.status = st;
      if (panelTab === 'update' && !$('panel').hidden) openPanel('update');
    });
    return;
  }
  const cur = el('p', '', '');
  cur.innerHTML = '<b>Playing now:</b> ' + (s.bundled ? 'the game that came with the app' : (s.game.channel === 'import' ? 'an imported ChatGPT zip' : s.game.channel === 'chatgpt' ? "ChatGPT's game" : "Claude's game")) + ' · build ' + fmtBuild(s.game) + (s.game.notes ? '<br><span class="hint">' + s.game.notes.replace(/</g, '&lt;') + '</span>' : '') + '<br><span class="hint">App version ' + (s.appVersion || DESK.version) + ' · game version ' + DATA.meta.version + '</span>';
  top.appendChild(cur);
  if (s.pending) top.appendChild(el('p', 'hint', 'A new game is downloaded (' + fmtBuild(s.pending) + '). It starts the next time the game opens, or press Restart now.'));
  if (s.error) top.appendChild(el('p', 'hint', s.error));
  if (s.state === 'downloading' || s.state === 'importing') top.appendChild(el('p', 'hint', (s.state === 'importing' ? 'Importing' : 'Downloading') + '... ' + Math.round((s.progress || 0) * 100) + '%'));
  const grid = el('div', 'guide-grid');
  for (const c of s.channels) {
    const card = el('article', 'guide-card');
    card.appendChild(el('small', '', c.name + ' channel'));
    card.appendChild(el('h5', '', c.state === 'available' ? 'Update available' : c.state === 'current' ? 'Up to date' : c.state === 'checking' ? 'Checking...' : c.state === 'none' ? 'Nothing published yet' : c.state === 'needs-app' ? 'Needs the new app' : c.state === 'off' ? 'Off' : c.state === 'idle' ? 'Not checked yet' : 'Could not check'));
    const p = el('p', '', c.message || '');
    if (c.latest) p.appendChild(el('span', 'hint', ' Newest: ' + fmtBuild(c.latest) + (c.latest.notes ? ' · ' + c.latest.notes : '')));
    card.appendChild(p);
    if (c.state === 'available' && c.offer) {
      const b = el('button', 'go', 'Get this update (' + fmtBytes(c.offer.downloadBytes) + ')');
      b.type = 'button';
      b.disabled = !!s.pending || s.state === 'downloading' || s.state === 'importing';
      b.addEventListener('click', () => DESK.updates.install(c.id));
      card.appendChild(b);
    }
    grid.appendChild(card);
  }
  box.appendChild(grid);
  const row = el('div', 'btns sub');
  const mk = (label, fn, cls) => {
    const b = el('button', 'go ' + (cls || 'opt'), label);
    b.type = 'button';
    b.addEventListener('click', fn);
    row.appendChild(b);
    return b;
  };
  mk('Check now', () => DESK.updates.check());
  mk('Import a ChatGPT zip...', () => DESK.updates.importZip());
  if (s.pending) mk('Restart now', () => DESK.updates.restart(), '');
  if (!s.bundled) mk('Use the game that came with the app', () => DESK.updates.reset());
  if (s.app) mk('Get the new app (' + s.app.version + ')', () => DESK.updates.getApp(), '');
  box.appendChild(row);
  fillSaveData(box);
}

/* ---------- title screen notice ---------- */
function updateNotice(s) {
  let n = $('updNote');
  if (!n) {
    n = el('p', 'hint updnote', '');
    n.id = 'updNote';
    $('optBtn').parentElement.insertAdjacentElement('afterend', n);
  }
  const offers = s.channels.filter(c => c.state === 'available').map(c => c.name);
  let text = '';
  if (s.state === 'ready') text = 'A new game is downloaded. It starts next time, or open Hangar > Update and press Restart now.';
  else if (offers.length) text = 'Update available from ' + offers.join(' and ') + ': open Hangar > Update.';
  else if (s.justUpdated) {
    text = 'The game was updated (build ' + fmtBuild(s.game) + ').';
    DESK.updates.seen();
  } else if (s.app) text = 'A new version of the app is out: open Hangar > Update.';
  n.textContent = text;
  n.hidden = !text;
}

if (DESK) {
  TABS.push(['update', 'Update']);
  PANEL_FILL.update = fillUpdate;
  DESK.updates.onStatus(s => {
    UPD.status = s;
    updateNotice(s);
    if (panelTab === 'update' && !$('panel').hidden) openPanel('update');
  });
  DESK.updates.status().then(s => {
    UPD.status = s;
    updateNotice(s);
  });
  // the window already has a menu bar; F11 from the game's page toggles full screen too
  addEventListener('keydown', e => {
    if (e.code === 'F11') {
      e.preventDefault();
      DESK.fullScreen();
    }
  });
} else PANEL_FILL.settingsExtra = fillSaveData;
