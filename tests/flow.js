const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await p.goto('http://localhost:8766/dist/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => { window.__manual = true; }); await p.click('#startBtn');
  const ev = (fn, a) => p.evaluate(fn, a);
  await ev(() => {
    const g = window.__game; window.T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); };
    window.talkAll = () => { let k = 0; while (g.G.cine && k++ < 60) { g.advanceTalk(); g.advanceTalk(); window.T_(2); } };
    window.goto = (id, dx, dz) => { const I = g.LV.islands[id]; g.P.x = I.x + (dx || 0); g.P.z = I.z + (dz || 0); g.P.y = 0; g.P.onG = true; g.P.vx = g.P.vz = 0; };
    window.tap = (a, n) => { g.press(a); g.release(a); window.T_(n || 1); };
    T_(20); talkAll();
  });
  // 1) fall off the home island edge by jumping out
  let r = await ev(() => { const g = window.__game; g.P.x = 0; g.P.z = -11.5; g.cam.yaw = Math.PI; g.keys.KeyS = false; g.keys.KeyW = true; window.tap('jump'); window.T_(150); g.keys.KeyW = false; window.T_(60); return { hp: g.P.hp, x: g.P.x.toFixed(1), z: g.P.z.toFixed(1), y: g.P.y.toFixed(1), onG: g.P.onG }; });
  console.log('fall + respawn (hp 275 expected, back on island):', JSON.stringify(r));
  // 2) combat regression in the meadow with real inputs
  await ev(() => { window.goto('meadow', 0, -10); window.T_(5); window.talkAll(); window.T_(30); });
  r = await ev(() => {
    const g = window.__game, out = []; const e = g.G.enemies.find(e => e.alive); g.G.enemies.forEach(x => { x.cool = 1e9; });
    e.hp = e.max = 900; g.P.x = e.x; g.P.z = e.z - 1.8; g.P.face = 0; e.x = g.P.x; e.z = g.P.z + 1.8;
    const h0 = e.hp; window.tap('light', 14); window.tap('light', 16); window.tap('light', 26); window.tap('light', 40); out.push('combo dmg ' + Math.round(h0 - e.hp) + ' combo ' + g.P.combo);
    window.T_(60); e.x = g.P.x; e.z = g.P.z + 1.8; e.st = 'chase'; e.air = false; e.y = 0;
    g.press('heavy'); g.release('heavy'); window.T_(3); g.press('jump'); window.T_(20); g.release('jump'); out.push('launch: enemy y ' + e.y.toFixed(1) + ' darren y ' + g.P.y.toFixed(1));
    for (let i = 0; i < 4; i++) window.tap('light', 11); out.push('air combo darren y ' + g.P.y.toFixed(1) + ' enemy hp ' + Math.round(e.hp));
    window.tap('heavy', 40); out.push('dive -> ' + g.P.name + ' y ' + g.P.y.toFixed(2));
    window.T_(60); e.x = g.P.x; e.z = g.P.z + 1.6; e.st = 'wind'; e.t = 30; e.face = Math.PI; e.cool = 0; window.T_(5); window.tap('dash', 8); out.push('perfect dodge ' + (g.P.perfect > 0) + ' stat ' + g.G.stats.perfect);
    window.T_(60); window.tap('s1', 40); window.T_(40); window.tap('s2', 50); g.P.heart = 100; window.T_(30); window.tap('heart', 5); out.push('heart on ' + (g.P.heartOn > 0));
    return out.join(' | ');
  });
  console.log('combat:', r);
  // 3) faint and retry from checkpoint
  r = await ev(() => { const g = window.__game; g.P.heartOn = 0; g.P.inv = 0; g.P.hp = 3; const e = g.G.enemies.find(e => e.alive); e.x = g.P.x; e.z = g.P.z + 1.2; e.face = Math.PI; e.st = 'wind'; e.t = 33; e.cool = 0; window.T_(40); const s1 = g.P.st; window.T_(200); return { st: s1, mode: g.G.mode, menu: document.getElementById('mSub').textContent, btn: document.getElementById('startBtn').textContent }; });
  console.log('faint:', JSON.stringify(r));
  await p.click('#startBtn');
  r = await ev(() => { const g = window.__game; window.T_(5); return { mode: g.G.mode, hp: g.P.hp, x: g.P.x.toFixed(1), z: g.P.z.toFixed(1), meadow: g.LV.zoneState.meadow.state, enemies: g.G.enemies.filter(e => e.alive).length, cine: g.G.cine }; });
  console.log('retry (meadow re-entered, 5 enemies, no repeat talk):', JSON.stringify(r));
  // 4) clear meadow + ball, then reload page and Continue
  await ev(() => { const g = window.__game; g.G.enemies.forEach(e => { if (e.alive) { e.hp = 0; } }); for (const e of g.G.enemies) if (e.alive) { e.alive = false; e.dead = .01; } window.T_(30); window.talkAll(); const pk = g.LV.pickups[0]; g.P.x = pk.x; g.P.z = pk.z; window.T_(4); window.talkAll(); window.T_(10); });
  r = await ev(() => localStorage.getItem('darrenSkyblade.ch1')); console.log('save:', r);
  await p.reload(); await p.waitForTimeout(2500);
  r = await ev(() => ({ cont: !document.getElementById('contBtn').hidden, text: document.getElementById('contBtn').textContent })); console.log('title after reload:', JSON.stringify(r));
  await ev(() => { window.__manual = true; }); await p.click('#contBtn');
  r = await ev(() => { const g = window.__game; for (let i = 0; i < 10; i++) g.tick(1 / 60); const L = g.LV.links.find(l => l.id === 'meadow-grove'); return { x: g.P.x.toFixed(1), z: g.P.z.toFixed(1), meadow: g.LV.zoneState.meadow.state, stonesOpen: L.open, stoneY: L.stones[0].g.position.y, ball: g.LV.pickups[0].taken, obj: document.getElementById('objT').textContent }; });
  console.log('continue:', JSON.stringify(r));
  // 5) boss mechanics on the peak
  await ev(() => { const g = window.__game; window.T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); }; ['meadow', 'grove', 'ridge', 'gate'].forEach(z => g.LV.zoneState[z].state = 'cleared'); g.LV.zoneState.peak.seen = true; const I = g.LV.islands.peak; g.P.x = I.x; g.P.z = I.z - 14; g.P.onG = true; window.T_(5); window.T_(60); });
  r = await ev(() => { const g = window.__game, b = g.G.boss; if (!b) return 'no boss'; b.cool = 1e9; g.P.inv = 1e9; const v = new THREE.Vector3();
    for (const k of ['armL', 'armR']) { b.m.parts[k].hp = 1; b.st = 'slamR'; b.t = 0; window.T_(5); b.m.parts[k].node.getWorldPosition(v); g.P.x = v.x; g.P.z = v.z - 1.5; g.P.y = 0; g.P.face = 0; g.P.st = 'move'; g.press('light'); g.release('light'); window.T_(30); }
    return { kneel: b.st, breaks: g.G.stats.breaks, phaseHpOk: b.hp > 0, insideIsland: Math.hypot(b.x - g.LV.islands.peak.x, b.z - g.LV.islands.peak.z) < 22 }; });
  console.log('boss crystals:', JSON.stringify(r));
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})();
