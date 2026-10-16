// scripted playthrough of Chapter 2 (Firewood for Mom), with screenshots. usage: node tests/story2.js
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL|net::|404/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto((process.env.URL || 'http://localhost:8768/dist/test.html'));
  await p.waitForTimeout(3500);
  const snap = async n => { await p.evaluate(() => window.__game.tick(1 / 60)).catch(() => {}); try { await p.screenshot({ path: `tests/shots/c2_${n}.png`, timeout: 15000 }); } catch (e) { console.log('snap fail', n); } };
  const ev = (fn, a) => p.evaluate(fn, a);
  const log = (k, v) => console.log(k + ':', typeof v === 'string' ? v : JSON.stringify(v));
  await ev(() => localStorage.clear());
  // chapter picker
  await p.click('#chapPick button:nth-child(2)');
  log('title', await ev(() => ({ ch: window.__game.CH.id, chap: document.getElementById('mChap').textContent, btn: document.getElementById('startBtn').textContent })));
  await snap('00_title');
  await ev(() => { window.__manual = true; });
  await p.click('#startBtn');
  await ev(() => {
    const g = window.__game;
    window.T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); };
    window.talkAll = () => { let k = 0; while (g.G.cine && k++ < 80) { g.advanceTalk(); g.advanceTalk(); window.T_(2); } return k; };
    window.goto = (id, dx, dz) => { const I = g.LV.islands[id]; g.P.x = I.x + (dx || 0); g.P.z = I.z + (dz || 0); g.P.y = 0; g.P.onG = true; g.P.vx = g.P.vz = 0; g.cam.fx = g.P.x; g.cam.fz = g.P.z; };
    window.takeZone = id => { let n = 0; for (const pk of g.LV.pickups) if (pk.zone === id && !pk.taken && pk.g.visible) { g.P.x = pk.x; g.P.z = pk.z; g.P.y = 0; window.T_(4); window.talkAll(); window.T_(4); n++; } return n; };
    window.killZone = () => { let k = 0; while (g.G.enemies.some(e => e.alive && !e.d.boss) && k++ < 500) { const e = g.G.enemies.find(e => e.alive && !e.d.boss); e.hp = 1; e.y = 0; e.air = false; e.under = false; e.st = 'chase'; const I = e.home, dx = I.x - e.x, dz = I.z - e.z, dl = Math.hypot(dx, dz) || 1; g.P.x = e.x + dx / dl * 1.6; g.P.z = e.z + dz / dl * 1.6; g.P.y = 0; g.P.onG = true; g.P.face = Math.atan2(e.x - g.P.x, e.z - g.P.z); g.P.st = 'move'; g.P.inv = 30; g.press('light'); g.release('light'); window.T_(16); } return k; };
    window.T_(40);
  });
  log('intro', await ev(() => { const g = window.__game; return { cine: g.G.cine, line: g.TALK.line, ruffyFollow: g.LV.ruffyFollow }; }));
  await ev(() => window.T_(60)); await snap('01_intro');
  await ev(() => window.talkAll());
  log('after intro', await ev(() => { const g = window.__game; return { weapon: g.P.weapon, unlocked: g.UNLOCKS.weapons, obj: document.getElementById('objT').textContent, cnt: document.getElementById('cntT').textContent }; }));
  // walk toward the thicket bridge for real and let Ruffy follow
  await ev(() => { const g = window.__game, I = g.LV.islands.thicket; g.cam.yaw = Math.atan2(I.x - g.P.x, I.z - g.P.z); g.keys.KeyW = true; window.T_(150); });
  log('on bridge', await ev(() => { const g = window.__game, r = g.LV.ruffy.root.position; return { x: g.P.x.toFixed(1), z: g.P.z.toFixed(1), y: g.P.y.toFixed(2), ruffy: [r.x.toFixed(1), r.z.toFixed(1)], ruffyBehind: Math.hypot(r.x - g.P.x, r.z - g.P.z).toFixed(1) }; }));
  await snap('02_bridge_ruffy');
  await ev(() => { const g = window.__game; window.T_(120); g.keys.KeyW = false; window.T_(10); });
  log('thicket', await ev(() => { const g = window.__game; return { active: g.LV.active, line: g.TALK.line }; }));
  await ev(() => window.talkAll()); await ev(() => window.T_(60));
  // watch a Barkling burrow and pop up
  log('barkling', await ev(() => {
    const g = window.__game, e = g.G.enemies.find(e => e.type === 'bark'); g.G.enemies.forEach(o => (o.cool = 1e9)); g.P.inv = 1e9;
    e.cool = 0; e.st = 'chase'; window.T_(2); const seen = [];
    for (let i = 0; i < 200; i++) { window.T_(1); if (seen[seen.length - 1] !== e.st) seen.push(e.st); if (e.st === 'mark' && e.t > 14 && !window.__marked) { window.__marked = 1; break; } }
    return { states: seen, under: e.under, y: e.y.toFixed(2) };
  }));
  await snap('03_barkling_mark');
  await ev(() => window.T_(20)); await snap('04_barkling_pop');
  await ev(() => { window.__game.P.inv = 0; });
  log('thicket kills', await ev(() => window.killZone()));
  await ev(() => window.T_(30)); await ev(() => window.talkAll());
  log('wood visible', await ev(() => { const g = window.__game; return { obj: document.getElementById('objT').textContent, vis: g.LV.pickups.filter(p => p.zone === 'thicket' && p.g.visible).length }; }));
  // Ruffy runs to a bundle and barks
  await ev(() => { const g = window.__game, pk = g.LV.pickups.find(p => p.zone === 'thicket'); g.P.x = pk.x - 4; g.P.z = pk.z + 1; window.T_(150); });
  log('ruffy at wood', await ev(() => { const g = window.__game, r = g.LV.ruffy.root.position, pk = g.LV.pickups.find(p => p.zone === 'thicket'); return Math.hypot(r.x - pk.x, r.z - pk.z).toFixed(2); }));
  await snap('05_ruffy_wood');
  log('took', await ev(() => window.takeZone('thicket')));
  await ev(() => { window.talkAll(); window.T_(150); });
  log('stones', await ev(() => { const g = window.__game, L = g.LV.links.find(l => l.id === 'thicket-hollow'); return { open: L.open, up: L.stones.map(s => s.up.toFixed(2)), obj: document.getElementById('objT').textContent, cnt: document.getElementById('cntT').textContent }; }));
  // cross the stones with real jumps
  log('stones crossing', await ev(() => {
    const g = window.__game, I = g.LV.islands.thicket, H = g.LV.islands.hollow, out = [];
    g.P.x = I.x + 6; g.P.z = I.z - 6; g.P.y = 0; g.P.onG = true; window.T_(5);
    g.keys.KeyW = true;
    for (let i = 0; i < 420; i++) {
      // steer from stone to stone toward the hollow
      const L = g.LV.links.find(l => l.id === 'thicket-hollow'); let tx = H.x, tz = H.z;
      for (const S of L.stones) if (Math.hypot(S.x - H.x, S.z - H.z) < Math.hypot(g.P.x - H.x, g.P.z - H.z) - 0.5) { tx = S.x; tz = S.z; break; }
      g.cam.yaw = Math.atan2(tx - g.P.x, tz - g.P.z);
      if (g.P.onG) { const fx = Math.sin(g.cam.yaw), fz = Math.cos(g.cam.yaw); if (!g.groundAt(g.P.x + fx * 0.8, g.P.z + fz * 0.8)) { g.press('jump'); g.release('jump'); } }
      window.T_(1);
      if (g.P.y < -3) { out.push('fell at ' + g.P.x.toFixed(1) + ',' + g.P.z.toFixed(1)); break; }
      if (g.G.cine) break;
    }
    g.keys.KeyW = false;
    const r = g.LV.ruffy.root.position;
    return { x: g.P.x.toFixed(1), z: g.P.z.toFixed(1), hollow: g.LV.zoneState.hollow.state, line: g.TALK.line, out, ruffy: [r.x.toFixed(1), r.z.toFixed(1)] };
  }));
  await snap('06_hollow_enter');
  await ev(() => window.talkAll()); await ev(() => window.T_(80));
  // a Snowcap lobs a snowball at Darren
  log('snowcap', await ev(() => {
    const g = window.__game, e = g.G.enemies.find(e => e.type === 'snow'); g.G.enemies.forEach(o => (o.cool = 1e9)); g.P.inv = 0; g.P.hp = 300;
    e.cool = 0; e.st = 'chase'; e.tok = false; g.G.enemies.forEach(o => (o.tok = false)); const out = [];
    for (let i = 0; i < 120; i++) { window.T_(1); if (g.G.projs.length && !out.length) out.push('ball thrown at frame ' + i); if (out.length && i % 10 === 0 && window.__snowSnapped !== 1 && g.G.projs.length) { window.__snowSnapped = 1; break; } }
    return out;
  }));
  await snap('07_snowball');
  log('snow hit', await ev(() => { const g = window.__game; window.T_(70); return { hp: g.P.hp, chill: g.P.chill > 0 }; }));
  log('elite', await ev(() => { const g = window.__game, e = g.G.enemies.find(e => e.elite); return e ? { type: e.type, hp: e.hp, max: e.max, sc: e.sc.toFixed(2), poise: e.poise } : null; }));
  await ev(() => { const g = window.__game, e = g.G.enemies.find(e => e.elite); e.shown = 300; g.P.x = e.x - 3; g.P.z = e.z - 3; g.P.face = Math.atan2(e.x - g.P.x, e.z - g.P.z); g.cam.yaw = g.P.face; g.cam.fx = g.P.x; g.cam.fz = g.P.z; window.T_(30); });
  await snap('08_elite');
  log('hollow kills', await ev(() => window.killZone()));
  await ev(() => { window.T_(30); window.talkAll(); window.takeZone('hollow'); window.talkAll(); window.T_(60); });
  log('hollow done', await ev(() => { const g = window.__game; return { bridge: g.LV.links.find(l => l.id === 'hollow-creek').open, cnt: document.getElementById('cntT').textContent }; }));
  // creek
  await ev(() => { window.goto('creek', 3, 6); window.T_(5); window.T_(40); window.talkAll(); window.T_(40); });
  await snap('09_creek');
  log('creek kills', await ev(() => window.killZone()));
  await ev(() => { window.T_(30); window.talkAll(); window.takeZone('creek'); window.talkAll(); window.T_(60); });
  log('creek done', await ev(() => { const g = window.__game; return { bridge: g.LV.links.find(l => l.id === 'creek-clearing').open, cnt: document.getElementById('cntT').textContent }; }));
  // Old Knotroot
  await ev(() => { window.goto('clearing', 11, 10); window.T_(5); window.T_(40); });
  log('knot intro', await ev(() => { const g = window.__game; return { line: g.TALK.line, who: g.TALK.who }; }));
  await snap('10_knot_intro');
  await ev(() => { window.talkAll(); window.T_(90); });
  log('knot', await ev(() => { const g = window.__game, b = g.G.boss; return b ? { name: b.d.name, hp: b.hp, st: b.st, bossN: document.getElementById('bossN').textContent } : 'none'; }));
  await snap('11_knot_fight');
  // roots attack
  log('roots', await ev(() => {
    const g = window.__game, b = g.G.boss; g.P.inv = 1e9; b.cool = 0; b.st = 'rootsW'; b.t = 0; b.line = null; const seen = [];
    for (let i = 0; i < 60; i++) { window.T_(1); if (seen[seen.length - 1] !== b.st) seen.push(b.st); }
    return { seen, n: b.line ? b.line.length : 0 };
  }));
  await snap('12_roots');
  // phase 2 scene
  log('phase 2', await ev(() => { const g = window.__game, b = g.G.boss; window.T_(60); b.st = 'idle'; b.cool = 1e9; b.hp = b.max * 0.55; window.T_(3); return { phase: b.phase, st: b.st, cine: g.G.cine, line: g.TALK.line }; }));
  await snap('13_phase2');
  await ev(() => { window.talkAll(); window.T_(30); });
  await snap('14_roar');
  // break both sap knots, then finish him
  log('knots', await ev(() => {
    const g = window.__game, b = g.G.boss, v = new THREE.Vector3(); b.cool = 1e9; window.T_(60);
    for (const k of ['armL', 'armR']) { b.m.parts[k].hp = 1; b.st = 'slamR'; b.t = 0; window.T_(5); b.m.parts[k].node.getWorldPosition(v); g.P.x = v.x; g.P.z = v.z - 1.5; g.P.y = 0; g.P.face = Math.atan2(b.x - g.P.x, b.z - g.P.z); g.P.st = 'move'; g.press('light'); g.release('light'); window.T_(30); }
    return { st: b.st, breaks: g.G.stats.breaks };
  }));
  await snap('15_kneel');
  await ev(() => { const g = window.__game, b = g.G.boss; b.hp = 5; b.phase = 3; g.P.x = b.x; g.P.z = b.z - 3.4; g.P.face = 0; g.P.st = 'move'; g.press('light'); g.release('light'); window.T_(40); });
  log('knot down', await ev(() => { const g = window.__game; return { alive: g.G.boss && g.G.boss.alive, line: g.TALK.line }; }));
  await snap('16_knot_down');
  await ev(() => { window.talkAll(); window.T_(30); });
  log('final wood', await ev(() => { const g = window.__game; return { obj: document.getElementById('objT').textContent, vis: g.LV.pickups.filter(p => p.zone === 'clearing' && p.g.visible).length }; }));
  await ev(() => { window.takeZone('clearing'); window.talkAll(); });
  await p.waitForTimeout(2200);
  await ev(() => window.T_(60));
  log('ending', await ev(() => { const g = window.__game; return { line: g.TALK.line, x: g.P.x.toFixed(1), z: g.P.z.toFixed(1), cnt: document.getElementById('cntT').textContent }; }));
  await ev(() => window.T_(60)); await snap('17_ending');
  await ev(() => window.talkAll()); await p.waitForTimeout(900); await ev(() => window.T_(60)); // story flow timers run on game time (1.5)
  log('end card', await ev(() => { const g = window.__game; return { mode: g.G.mode, sub: document.getElementById('mSub').textContent, res: document.getElementById('result').textContent, done: g.UNLOCKS.done }; }));
  await ev(() => window.T_(5)); await snap('18_end_card');
  console.log(errs.length ? errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})();
