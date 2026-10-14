// checks for the 1.1 combat features: branches, finishers per weapon, air spike, dash rise, style rank,
// attack turns, poise, difficulty, the options panel, and Grumblepeak's stomp. usage: node tests/combat2.js
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await p.goto('http://localhost:8766/dist/test.html');
  await p.waitForTimeout(3000);
  const ev = (fn, a) => p.evaluate(fn, a);
  const log = (k, v) => console.log(k + ':', typeof v === 'string' ? v : JSON.stringify(v));
  const shot = n => p.screenshot({ path: `tests/shots/cb_${n}.png` }).catch(() => {});
  await ev(() => localStorage.clear());
  // options panel from the title screen
  await p.click('#optBtn');
  await p.waitForTimeout(200);
  await shot('panel_loadout');
  await p.click('.ptab:nth-child(6)');
  log('moves tab', await ev(() => document.querySelectorAll('#pBody .mv').length + ' moves listed'));
  await shot('panel_moves');
  await p.click('.ptab:nth-child(2)');
  await shot('panel_forge');
  await p.click('.ptab:nth-child(7)');
  await shot('panel_settings');
  await p.click('.seg button:nth-child(3)');
  log('difficulty after click', await ev(() => window.__game.SETTINGS.difficulty));
  await p.click('.seg button:nth-child(2)');
  await p.click('#panelClose');
  log('panel closed', await ev(() => document.getElementById('panel').hidden));
  await ev(() => { window.__manual = true; });
  await p.click('#startBtn');
  await ev(() => {
    const g = window.__game;
    window.T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); };
    window.talkAll = () => { let k = 0; while (g.G.cine && k++ < 80) { g.advanceTalk(); g.advanceTalk(); window.T_(2); } };
    window.tap = (a, n) => { g.press(a); g.release(a); window.T_(n || 1); };
    window.T_(30); window.talkAll();
    // a quiet test spot: the home island, with one sturdy target dummy
    window.dummy = (type, o) => { g.G.enemies.forEach(e => { e.alive = false; e.gone = true; g.__scene && 0; }); const e = g.spawnEnemy(type || 'puff', g.P.x, g.P.z + 1.8, o); e.hp = e.max = 5000; e.cool = 1e9; e.st = 'chase'; e.t = 0; e.m.root.scale.setScalar(e.sc); g.P.face = 0; return e; };
    window.reset = () => { g.P.st = 'move'; g.P.atk = null; g.P.last = null; g.P.chainT = 0; g.P.y = 0; g.P.vy = 0; g.P.onG = true; g.P.x = 0; g.P.z = 0; g.P.face = 0; g.cam.yaw = 0; window.T_(30); };
  });
  // branches
  log('branches', await ev(() => {
    const g = window.__game, out = {};
    const run = seq => { window.reset(); const e = window.dummy(); const names = []; for (const [a, n] of seq) { window.tap(a, n); names.push(g.P.name); } window.T_(50); return names.join('>') + (e.st === 'air' || e.air ? ' (enemy airborne)' : ''); };
    out.L1H = run([['light', 12], ['heavy', 10]]);
    out.L2H = run([['light', 12], ['light', 13], ['heavy', 10]]);
    out.L3H = run([['light', 12], ['light', 13], ['light', 20], ['heavy', 4]]) + ' waves ' + g.G.waves.length;
    out.L4H = run([['light', 12], ['light', 13], ['light', 20], ['light', 22], ['heavy', 6]]) + ' punch ' + (g.G.punch > 0 || g.G.fovKick > 0);
    return out;
  }));
  // ground wave reaches a far enemy
  log('wave', await ev(() => {
    const g = window.__game; window.reset(); const e = window.dummy(); e.z = g.P.z + 8; const h0 = e.hp;
    window.tap('light', 12); window.tap('light', 13); window.tap('light', 20); window.tap('heavy', 60);
    return { hitFar: e.hp < h0, dmg: Math.round(h0 - e.hp) };
  }));
  // finisher per weapon
  log('finishers', await ev(() => {
    const g = window.__game, out = {};
    for (const w of ['cloudcutter', 'jellyblade', 'ladle', 'emberfang']) {
      g.unlockWeapon(w); window.reset(); const e = window.dummy(); g.P.hp = 200;
      window.tap('light', 14); window.tap('light', 15); window.tap('light', 22); window.tap('light', 26); window.tap('heavy', 8); out[w] = g.P.name + ' hp ' + g.P.hp; window.T_(60);
    }
    return out;
  }));
  await ev(() => { const g = window.__game; window.reset(); window.dummy(); window.tap('light', 12); window.tap('light', 13); window.tap('light', 20); window.tap('light', 22); window.tap('heavy', 14); });
  await shot('finisher_arc');
  // air spike and dash rise
  log('air', await ev(() => {
    const g = window.__game; window.reset(); const e = window.dummy('gust'); e.y = 2.4; e.st = 'chase';
    g.press('jump'); window.T_(14); g.release('jump'); window.tap('light', 9); const a = g.P.name; window.tap('heavy', 4); const n = g.P.name; window.T_(8);
    const ev1 = { first: a, then: n, enemyVy: e.vy.toFixed(1), slam: e.slam };
    window.T_(80);
    window.reset(); const e2 = window.dummy(); e2.z = g.P.z + 3.5; window.tap('dash', 7); window.tap('heavy', 1); const tr = [];
    for (let i = 0; i < 24; i++) { window.T_(1); tr.push(g.P.st[0] + g.P.f.toFixed(0) + (g.P.follow ? '!' : '') + ':' + g.P.y.toFixed(1)); }
    return Object.assign(ev1, { dash: g.P.name, darrenY: g.P.y.toFixed(1), enemyAir: e2.air, enemyY: e2.y.toFixed(1), tr: tr.join(' ') });
  }));
  // style rank: varied strings beat spamming one move
  log('style', await ev(() => {
    const g = window.__game, S = g.STY;
    window.reset(); window.dummy(); S.pts = 0; S.recent.length = 0;
    for (let i = 0; i < 6; i++) { window.tap('light', 12); window.T_(30); }
    const spam = S.pts;
    window.reset(); window.dummy(); S.pts = 0; S.recent.length = 0;
    window.tap('light', 12); window.tap('heavy', 30); window.tap('light', 12); window.tap('light', 13); window.tap('heavy', 30); window.tap('light', 12); window.tap('light', 13); window.tap('light', 20); window.tap('heavy', 30);
    return { spam6: Math.round(spam), varied: Math.round(S.pts), rank: S.rank };
  }));
  await shot('style_rank');
  // attack turns: many Puffcaps, never more than 2 winding up at once on Normal
  log('turns', await ev(() => {
    const g = window.__game; window.reset(); g.G.enemies.forEach(e => (e.alive = false)); g.P.inv = 1e9;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, e = g.spawnEnemy('puff', Math.cos(a) * 3, Math.sin(a) * 3); e.cool = 0; }
    let mx = 0, waits = 0;
    for (let i = 0; i < 600; i++) { window.T_(1); const n = g.G.enemies.filter(e => e.alive && e.tok).length; mx = Math.max(mx, n); }
    const d = g.G.enemies.filter(e => e.alive).map(e => Math.hypot(e.x - g.P.x, e.z - g.P.z).toFixed(1));
    g.P.inv = 0;
    return { maxAttackers: mx, distances: d };
  }));
  await shot('turns_circle');
  // poise and elites
  log('poise', await ev(() => {
    const g = window.__game, out = {};
    window.reset(); let e = window.dummy('bolt'); window.tap('light', 9); out.boltAfterLight = e.st;
    window.reset(); e = window.dummy('puff', { elite: true }); e.st = 'wind'; e.t = 0; e.tok = true; window.tap('light', 6); out.eliteWindAfterLight = e.st;
    window.reset(); e = window.dummy('puff', { elite: true }); e.st = 'wind'; e.t = 0; window.tap('light', 12); window.tap('heavy', 14); out.eliteAfterHeavy = e.st;
    out.eliteHpScale = (e.max / 5000).toFixed(2);
    return out;
  }));
  // difficulty scales new enemies
  log('difficulty', await ev(() => {
    const g = window.__game, r = {};
    for (const d of ['easy', 'normal', 'hard']) { g.SETTINGS.difficulty = d; const e = g.spawnEnemy('puff', 5, 5); r[d] = { hp: e.max, dm: e.dm }; e.alive = false; }
    g.SETTINGS.difficulty = 'normal';
    return r;
  }));
  // R switches weapons
  log('swap', await ev(() => { const g = window.__game; window.reset(); const a = g.P.weapon; g.press('swap'); g.release('swap'); window.T_(2); return a + ' -> ' + g.P.weapon; }));
  // Grumblepeak: stomp shockwaves and the phase scene
  log('stomp', await ev(() => {
    const g = window.__game; g.G.enemies.forEach(e => (e.alive = false)); window.T_(2);
    const b = g.spawnEnemy('boss', 0, 6); b.home = g.LV.islands.home; b.zone = 'home'; b.cool = 1e9; g.P.inv = 1e9;
    b.st = 'stompW'; b.t = 0; const seen = []; let rings = 0;
    for (let i = 0; i < 140; i++) { window.T_(1); if (seen[seen.length - 1] !== b.st) seen.push(b.st); }
    return { seen };
  }));
  await shot('stomp');
  log('phase scene', await ev(() => { const g = window.__game, b = g.G.boss; b.st = 'idle'; b.hp = b.max * 0.5; window.T_(3); return { st: b.st, cine: g.G.cine, line: g.TALK.line }; }));
  await ev(() => { window.talkAll(); window.T_(12); });
  await shot('roar');
  // pause panel during play
  await ev(() => { window.__game.G.boss.alive = false; window.__game.G.boss.gone = true; });
  await p.keyboard.press('KeyP');
  await p.click('#optBtn');
  await p.click('.ptab:nth-child(6)');
  await shot('pause_moves');
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})();
