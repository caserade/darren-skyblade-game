// scripted playthrough of Chapter 1. usage: node tests/story.js
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto((process.env.URL || 'http://localhost:8768/dist/test.html')); await p.waitForTimeout(3500);
  const snap = async n => { await p.evaluate(() => { const g = window.__game; g.tick(1 / 60); }).catch(() => {}); try { await p.screenshot({ path: `tests/shots/${n}.png`, timeout: 15000 }); } catch (e) { console.log('snap fail', n); } };
  const ev = (fn, a) => p.evaluate(fn, a);
  console.log('skinned', await ev(() => !!window.__skinned));
  await snap('00_title');
  await ev(() => { window.__manual = true; });
  await p.click('#startBtn');
  await ev(() => {
    const g = window.__game; window.T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); };
    window.talkAll = () => { let k = 0; while (g.G.cine && k++ < 60) { g.advanceTalk(); g.advanceTalk(); window.T_(2); } return k; };
    window.goto = (id, dx, dz) => { const I = g.LV.islands[id]; g.P.x = I.x + (dx || 0); g.P.z = I.z + (dz || 0); g.P.y = 0; g.P.onG = true; g.P.vx = g.P.vz = 0; g.cam.fx = g.P.x; g.cam.fz = g.P.z; };
    window.takeZone = id => { for (const pk of g.LV.pickups) if (pk.zone === id && !pk.taken && pk.g.visible) { g.P.x = pk.x; g.P.z = pk.z; g.P.y = 0; window.T_(4); window.talkAll(); window.T_(4); } };
    window.killZone = () => { let k = 0; while (g.G.enemies.some(e => e.alive && e.type !== 'boss') && k++ < 400) { const e = g.G.enemies.find(e => e.alive && e.type !== 'boss'); e.hp = 1; e.broken = true; e.y = 0; e.air = false; e.st = 'chase'; e.face = Math.atan2(g.P.x - e.x, g.P.z - e.z); const I = e.home, dx = I.x - e.x, dz = I.z - e.z, dl = Math.hypot(dx, dz) || 1; g.P.x = e.x + dx / dl * 1.6; g.P.z = e.z + dz / dl * 1.6; g.P.y = 0; g.P.onG = true; g.P.face = Math.atan2(e.x - g.P.x, e.z - g.P.z); g.P.st = 'move'; g.press('light'); g.release('light'); window.T_(16); if (e.type === 'thorn' && e.alive) { e.face = g.P.face; } } return k; };
    T_(40);
  });
  let st = await ev(() => { const g = window.__game; return { cine: g.G.cine, line: g.TALK.line, obj: document.getElementById('objT').textContent }; });
  console.log('intro:', JSON.stringify(st));
  await ev(() => window.T_(120)); await snap('01_intro_mom');
  await ev(() => window.talkAll());
  st = await ev(() => { const g = window.__game; return { cine: g.G.cine, obj: document.getElementById('objT').textContent, home: g.LV.zoneState.home.state }; }); console.log('after intro:', JSON.stringify(st));
  // walk across the bridge for real: face +z and hold W
  await ev(() => { const g = window.__game; g.cam.yaw = 0; g.keys.KeyW = true; window.T_(150); });
  st = await ev(() => { const g = window.__game; return { z: g.P.z.toFixed(1), y: g.P.y.toFixed(2), onG: g.P.onG }; }); console.log('mid bridge:', JSON.stringify(st));
  await snap('02_bridge');
  await ev(() => { const g = window.__game; window.T_(150); g.keys.KeyW = false; window.T_(10); });
  st = await ev(() => { const g = window.__game; return { z: g.P.z.toFixed(1), cine: g.G.cine, line: g.TALK.line, meadow: g.LV.zoneState.meadow.state }; }); console.log('reach meadow:', JSON.stringify(st));
  await snap('03_meadow_talk');
  await ev(() => window.talkAll());
  st = await ev(() => { const g = window.__game; return { enemies: g.G.enemies.filter(e => e.alive).map(e => e.type), active: g.LV.active }; }); console.log('meadow fight:', JSON.stringify(st));
  await ev(() => window.T_(60)); await snap('04_meadow_fight');
  // try to walk off the island edge during the fight (fence)
  st = await ev(() => { const g = window.__game; g.P.x = 0; g.P.z = 36; g.G.enemies.forEach(e => e.cool = 1e9); g.cam.yaw = Math.PI / 2; g.keys.KeyW = true; window.T_(200); g.keys.KeyW = false; const d = Math.hypot(g.P.x, g.P.z - 36); return { dist: d.toFixed(2), y: g.P.y.toFixed(2) }; }); console.log('fence test (should stay < 12.5, y=0):', JSON.stringify(st));
  console.log('kills', await ev(() => window.killZone()));
  await ev(() => window.T_(30));
  st = await ev(() => { const g = window.__game; return { cine: g.G.cine, line: g.TALK.line, meadow: g.LV.zoneState.meadow.state }; }); console.log('meadow clear:', JSON.stringify(st));
  await ev(() => window.talkAll());
  st = await ev(() => { const g = window.__game; const pk = g.LV.pickups[0]; return { pickVisible: pk.g.visible, obj: document.getElementById('objT').textContent }; }); console.log('pickup:', JSON.stringify(st));
  await ev(() => { const g = window.__game; const pk = g.LV.pickups[0]; g.P.x = pk.x - 3; g.P.z = pk.z; window.T_(20); }); await snap('05_ball');
  await ev(() => { const g = window.__game; const pk = g.LV.pickups[0]; g.P.x = pk.x; g.P.z = pk.z; window.T_(4); });
  st = await ev(() => { const g = window.__game; return { cine: g.G.cine, line: g.TALK.line }; }); console.log('ball talk:', JSON.stringify(st));
  await ev(() => window.talkAll()); await ev(() => window.T_(120));
  st = await ev(() => { const g = window.__game; const L = g.LV.links.find(l => l.id === 'meadow-grove'); return { open: L.open, up: L.stones.map(s => s.up.toFixed(2)), obj: document.getElementById('objT').textContent }; }); console.log('stones:', JSON.stringify(st));
  await ev(() => { const g = window.__game; g.P.x = 6.4; g.P.z = 44.5; g.cam.yaw = Math.atan2(27 - 6.4, 72 - 44.5); g.cam.fx = g.P.x; g.cam.fz = g.P.z; window.T_(40); }); await snap('06_stones');
  // real jumps across the stones: walk toward grove, jump at each edge
  st = await ev(() => {
    const g = window.__game, log = []; g.cam.yaw = Math.atan2(27 - 6.4, 72 - 44.5); g.keys.KeyW = true;
    for (let i = 0; i < 260; i++) {
      if (g.P.onG) { const fx = Math.sin(g.cam.yaw), fz = Math.cos(g.cam.yaw); if (!g.groundAt(g.P.x + fx * .8, g.P.z + fz * .8)) { g.press('jump'); g.release('jump'); } }
      window.T_(1); if (g.P.y < -3) { log.push('fell at ' + g.P.x.toFixed(1) + ',' + g.P.z.toFixed(1)); break; }
    }
    g.keys.KeyW = false; return { x: g.P.x.toFixed(1), z: g.P.z.toFixed(1), y: g.P.y.toFixed(2), grove: g.LV.zoneState.grove.state, cine: g.G.cine, line: g.TALK.line, st: g.P.st, log };
  }); console.log('stones crossing:', JSON.stringify(st));
  await snap('07_grove');
  await ev(() => window.talkAll());
  console.log('grove kills', await ev(() => window.killZone())); await ev(() => window.T_(30)); await ev(() => window.talkAll());
  await ev(() => window.takeZone('grove'));
  st = await ev(() => { const g = window.__game; return { grove: g.LV.zoneState.grove.state, weapon: g.P.weapon, bridge: g.LV.links.find(l => l.id === 'grove-ridge').open, obj: document.getElementById('objT').textContent }; }); console.log('grove clear:', JSON.stringify(st));
  // ridge
  await ev(() => { window.goto('ridge', 2, -6); window.T_(4); }); await ev(() => window.T_(60)); await snap('08_ridge'); await ev(() => window.talkAll());
  console.log('ridge kills', await ev(() => window.killZone())); await ev(() => window.T_(30)); await ev(() => window.talkAll());
  await ev(() => { const g = window.__game; const pk = g.LV.pickups.find(p => p.zone === 'ridge'); g.P.x = pk.x; g.P.z = pk.z; window.T_(4); }); await snap('09_tag'); await ev(() => window.talkAll());
  // gate
  await ev(() => { window.goto('gate', 0, -6); window.T_(4); }); await ev(() => window.T_(60)); await snap('10_gate'); await ev(() => window.talkAll());
  console.log('gate kills', await ev(() => window.killZone())); await ev(() => window.T_(30)); await ev(() => window.talkAll());
  await ev(() => window.takeZone('gate'));
  st = await ev(() => { const g = window.__game; return { gate: g.LV.zoneState.gate.state, weapon: g.P.weapon, bridge: g.LV.links.find(l => l.id === 'gate-peak').open, obj: document.getElementById('objT').textContent }; }); console.log('gate clear:', JSON.stringify(st));
  // peak + boss
  await ev(() => { window.goto('peak', 0, -16); window.T_(4); }); await ev(() => window.T_(30)); await snap('11_boss_intro');
  st = await ev(() => { const g = window.__game; return { line: g.TALK.line }; }); console.log('boss intro:', JSON.stringify(st));
  await ev(() => window.talkAll()); await ev(() => window.T_(120)); await snap('12_boss_fight');
  st = await ev(() => { const g = window.__game; return { boss: !!g.G.boss, hp: g.G.boss && g.G.boss.hp, active: g.LV.active }; }); console.log('boss:', JSON.stringify(st));
  await ev(() => { const g = window.__game; const b = g.G.boss; b.hp = 5; b.phase = 3; b.cool = 1e9; g.P.x = b.x; g.P.z = b.z - 3.6; g.P.face = 0; g.P.st = 'move'; g.press('light'); g.release('light'); window.T_(30); });
  st = await ev(() => { const g = window.__game; return { bossAlive: g.G.boss.alive, cine: g.G.cine }; }); console.log('boss down:', JSON.stringify(st));
  await p.waitForTimeout(1700); await ev(() => window.T_(30)); await snap('13_cage_break');
  await p.waitForTimeout(1500); await ev(() => window.T_(60));
  st = await ev(() => { const g = window.__game; return { line: g.TALK.line, cage: g.LV.cage.broken }; }); console.log('reunion:', JSON.stringify(st));
  await ev(() => window.T_(90)); await snap('14_reunion');
  await ev(() => window.talkAll());
  await p.waitForTimeout(2200); await ev(() => window.T_(60));
  st = await ev(() => { const g = window.__game; return { line: g.TALK.line, x: g.P.x.toFixed(1), z: g.P.z.toFixed(1) }; }); console.log('ending:', JSON.stringify(st));
  await ev(() => window.T_(60)); await snap('15_ending_home');
  await ev(() => window.talkAll()); await p.waitForTimeout(900);
  st = await ev(() => { const g = window.__game; return { mode: g.G.mode, sub: document.getElementById('mSub').textContent, tag: document.getElementById('mTag').textContent, res: document.getElementById('result').textContent }; }); console.log('end card:', JSON.stringify(st));
  await ev(() => window.T_(5)); await snap('16_end_card');
  console.log(errs.length ? errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})();
