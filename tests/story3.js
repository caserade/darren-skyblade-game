// scripted playthrough of Chapter 3 (Stormglass Reach): updrafts, Stormlings, the young Stormbelly and Chomp Rex,
// Wardlings, the Tempest Warden's phases and lightning, the ending and memory release. usage: node tests/story3.js
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|404/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto(process.env.URL || 'http://localhost:8768/dist/test.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(5000);
  const ev = (fn, a) => p.evaluate(fn, a);
  const log = (k, v) => console.log(k + ':', typeof v === 'string' ? v : JSON.stringify(v));
  const snap = async n => { await ev(() => window.__game.renderFrame()); await p.screenshot({ path: `tests/shots/c3_${n}.png` }); };
  await ev(() => localStorage.clear());
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(5000);
  await p.click('#modePick .mode[data-mode="story"]');
  await p.click('#chapPick button:nth-child(3)');
  log('title', await ev(() => ({ ch: window.__game.CH.id, chap: document.getElementById('mChap').textContent })));
  await ev(() => (window.__manual = true));
  await p.click('#startBtn');
  await ev(() => {
    const g = window.__game;
    window.T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); };
    window.talkAll = () => { let k = 0; while (g.G.cine && k++ < 80) { g.advanceTalk(); g.advanceTalk(); window.T_(2); } return k; };
    window.goto = (id, dx, dz) => { const I = g.LV.islands[id]; g.P.x = I.x + (dx || 0); g.P.z = I.z + (dz || 0); g.P.y = 0; g.P.onG = true; g.P.vx = g.P.vz = 0; g.cam.fx = g.P.x; g.cam.fz = g.P.z; };
    window.killZone = () => { let k = 0; while (g.G.enemies.some(e => e.alive && !e.d.boss) && k++ < 500) { const e = g.G.enemies.find(e => e.alive && !e.d.boss); e.hp = 1; e.broken = true; e.y = 0; e.air = false; e.under = false; e.st = 'chase'; const I = e.home || g.LV.islands.home, dx = I.x - e.x, dz = I.z - e.z, dl = Math.hypot(dx, dz) || 1; g.P.x = e.x + dx / dl * 1.6; g.P.z = e.z + dz / dl * 1.6; g.P.y = 0; g.P.onG = true; g.P.face = Math.atan2(e.x - g.P.x, e.z - g.P.z); g.P.st = 'move'; g.P.inv = 30; g.press('light'); g.release('light'); window.T_(16); } return k; };
    window.T_(40);
    window.talkAll();
  });
  log('start', await ev(() => { const g = window.__game; return { mom: g.LV.mom.root.visible, ruffy: !!g.LV.ruffy, obj: document.getElementById('objT').textContent }; }));
  await snap('01_landing');
  // updraft: stand in the first ring, flight energy refills and Darren rises
  log('updraft', await ev(() => {
    const g = window.__game; g.P.x = 8; g.P.z = -4; g.P.y = 0; g.P.fe = 0; window.T_(40);
    return { fe: Math.round(g.P.fe), y: +g.P.y.toFixed(2) };
  }));
  // Gale Gardens: Stormlings, Gusts and a young Stormbelly
  await ev(() => { window.goto('gale', -6, 0); window.T_(30); window.talkAll(); window.T_(30); });
  log('gale', await ev(() => { const g = window.__game; return g.G.enemies.filter(e => e.alive).map(e => e.type); }));
  log('young stormbelly', await ev(() => {
    const g = window.__game, e = g.G.enemies.find(e => e.type === 'youngbelly');
    if (!e) return 'missing';
    g.G.enemies.forEach(o => { if (o !== e) { o.cool = 1e9; o.st = 'idle'; } });
    g.P.inv = 1e9; g.P.x = e.x + 2.5; g.P.z = e.z; g.P.y = 0; e.cool = 0; e.st = 'chase';
    const seen = []; let warn = false;
    for (let i = 0; i < 260; i++) { window.T_(1); if (seen[seen.length - 1] !== e.st) seen.push(e.st); if (e.st === 'wind' && e.t > 40 && !window.__w1) { window.__w1 = 1; warn = e.m.warning.visible; g.cam.yaw = Math.atan2(e.x - g.P.x, e.z - g.P.z) + 0.5; g.cam.fx = g.P.x; g.cam.fz = g.P.z; window.T_(1); window.__shotBelly = 1; break; } }
    return { states: seen, warning: warn, scale: +e.m.root.scale.x.toFixed(2), lod: e.m.lod, tris: e.m.mesh.geometry.index.count / 3 };
  }));
  await snap('02_young_stormbelly_windup');
  await ev(() => { const g = window.__game, e = g.G.enemies.find(e => e.type === 'youngbelly'); for (let i = 0; i < 40; i++) window.T_(1); g.P.inv = 0; });
  log('gale kills', await ev(() => window.killZone()));
  await ev(() => { window.T_(60); window.talkAll(); window.T_(60); });
  log('gale cleared', await ev(() => { const g = window.__game; return { gale: g.LV.zoneState.gale.state, link: g.LV.links.find(l => l.id === 'gale-archive').open, obj: document.getElementById('objT').textContent }; }));
  // Shattered Observatory: Wardlings, Stormlings and a young Chomp Rex
  await ev(() => { window.goto('archive', -6, 4); window.T_(30); window.talkAll(); window.T_(30); });
  log('archive', await ev(() => { const g = window.__game; return g.G.enemies.filter(e => e.alive).map(e => e.type); }));
  log('young chomp rex', await ev(() => {
    const g = window.__game, e = g.G.enemies.find(e => e.type === 'youngrex');
    if (!e) return 'missing';
    g.G.enemies.forEach(o => { if (o !== e) { o.cool = 1e9; o.st = 'idle'; } });
    g.P.inv = 1e9; g.P.x = e.x + 4.5; g.P.z = e.z; g.P.y = 0; e.cool = 0; e.st = 'chase';
    const seen = []; let warn = false;
    for (let i = 0; i < 260; i++) { window.T_(1); if (seen[seen.length - 1] !== e.st) seen.push(e.st); if (e.st === 'wind' && e.t > 30 && !window.__w2) { window.__w2 = 1; warn = e.m.warning.visible; g.cam.yaw = Math.atan2(e.x - g.P.x, e.z - g.P.z) - 0.6; g.cam.fx = g.P.x; g.cam.fz = g.P.z; window.T_(1); break; } }
    return { states: seen, warning: warn, scale: +e.m.root.scale.x.toFixed(2) };
  }));
  await snap('03_young_rex_windup');
  log('rex charge', await ev(() => { const g = window.__game, e = g.G.enemies.find(e => e.type === 'youngrex'); const seen = []; for (let i = 0; i < 200; i++) { window.T_(1); if (seen[seen.length - 1] !== e.st) seen.push(e.st); } g.P.inv = 0; return seen; }));
  log('archive kills', await ev(() => window.killZone()));
  await ev(() => { window.T_(60); window.talkAll(); window.T_(60); });
  log('archive cleared', await ev(() => { const g = window.__game; return { archive: g.LV.zoneState.archive.state, link: g.LV.links.find(l => l.id === 'archive-eye').open }; }));
  // Eye of the Storm: the Tempest Warden
  await ev(() => { window.goto('eye', 4, 14); window.T_(40); window.talkAll(); window.T_(60); });
  log('warden', await ev(() => { const g = window.__game, b = g.G.boss; return b ? { type: b.type, hp: b.hp, phase: b.phase, bossN: document.getElementById('bossN').textContent } : 'none'; }));
  await ev(() => { const g = window.__game, b = g.G.boss; g.cam.yaw = Math.atan2(b.x - g.P.x, b.z - g.P.z); window.T_(30); });
  await snap('04_warden');
  log('phase 2 lightning', await ev(() => {
    const g = window.__game, b = g.G.boss; g.P.inv = 1e9;
    b.hp = b.max * 0.55; window.T_(3); window.talkAll(); b.st = 'idle'; b.cool = 1e9; let rings = 0, bolts = 0;
    for (let i = 0; i < 60 * 8; i++) { window.T_(1); const h = SG.hazards; rings = Math.max(rings, h.length); bolts += h.filter(x => x.bolt).length ? 1 : 0; }
    return { phase: b.phase, maxRings: rings, boltFrames: bolts };
  }));
  await snap('05_lightning');
  log('defeat', await ev(() => {
    const g = window.__game, b = g.G.boss; b.hp = 5; b.phase = 3; b.st = 'kneel'; b.t = 0;
    for (let k = 0; k < 20 && b.alive; k++) { g.P.x = b.x; g.P.z = b.z - 3.4; g.P.y = 0; g.P.face = 0; g.P.st = 'move'; g.press('light'); g.release('light'); window.T_(20); }
    window.__gemsAtDeath = g.G.gems.length;
    window.T_(120); window.talkAll(); window.T_(200); window.talkAll(); window.T_(200);
    return { gemsInAir: window.__gemsAtDeath, alive: b.alive, mode: g.G.mode, ending: document.getElementById('menu') && !document.getElementById('menu').hidden, parts: g.UNLOCKS.parts };
  }));
  await snap('06_end');
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
