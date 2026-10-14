// Adventure mode, Skyforge, Twin Arms, flight, contracts and the Titanic Scion. usage: node tests/adventure.js
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  p.on('pageerror', e =>
    errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')),
  );
  p.on('console', m => {
    if (m.type() === 'error' && !/net::|404/.test(m.text())) errs.push('CONSOLE ' + m.text());
  });
  await p.goto((process.env.URL || 'http://localhost:8768/dist/test.html'));
  await p.waitForTimeout(3500);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(3500);
  const ev = (fn, a) => p.evaluate(fn, a);
  const log = (k, v) => console.log(k + ':', typeof v === 'string' ? v : JSON.stringify(v));
  const shot = async n => {
    await ev(() => window.__game.tick(1 / 60)).catch(() => {});
    await p.screenshot({ path: `tests/shots/adv_${n}.png` }).catch(() => {});
  };
  await p.click('#modePick .mode[data-mode="adventure"]');
  await p.waitForTimeout(300);
  log(
    'title',
    await ev(() => ({
      ch: window.__game.CH.id,
      btn: document.getElementById('startBtn').textContent,
      chap: document.getElementById('mChap').textContent,
    })),
  );
  await shot('00_title');
  await ev(() => {
    window.__manual = true;
  });
  await p.click('#startBtn');
  await ev(() => {
    const g = window.__game;
    window.T_ = n => {
      for (let i = 0; i < n; i++) g.tick(1 / 60);
    };
    window.talkAll = () => {
      let k = 0;
      while (g.G.cine && k++ < 80) {
        g.advanceTalk();
        g.advanceTalk();
        window.T_(2);
      }
    };
    window.tap = (a, n) => {
      g.press(a);
      g.release(a);
      window.T_(n || 1);
    };
    window.go = (x, z) => {
      g.P.x = x;
      g.P.z = z;
      g.P.y = 0;
      g.P.onG = true;
      g.P.vx = g.P.vz = 0;
      g.P.fly = false;
      g.cam.fx = x;
      g.cam.fz = z;
      window.T_(3);
    };
    window.T_(40);
  });
  log(
    'intro',
    await ev(() => {
      const g = window.__game;
      return { line: g.TALK.line, who: g.TALK.who, gear: !!g.NPCS.gear };
    }),
  );
  await ev(() => window.T_(60));
  await shot('01_intro_gearwing');
  await ev(() => window.talkAll());
  // forge prompt and crafting
  log(
    'forge prompt',
    await ev(() => {
      const g = window.__game,
        F = g.DATA.adventure.forge;
      window.go(F.x + 1, F.z + 3);
      window.T_(5);
      return !document.getElementById('prompt').hidden;
    }),
  );
  await ev(() => {
    const g = window.__game;
    for (const k in g.DATA.parts) g.addPart(k, 30, true);
    g.press('use');
    g.release('use');
    window.T_(2);
  });
  log(
    'hangar open',
    await ev(() => ({
      panel: !document.getElementById('panel').hidden,
      paused: window.__game.G.paused,
      tab: document.querySelector('.ptab.on').textContent,
    })),
  );
  await shot('02_forge');
  const crafted = await ev(() => {
    const g = window.__game,
      out = [];
    for (const id of [
      'emberblaster',
      'galebow',
      'sporemortar',
      'frostfang',
      'titanedge',
      'thorn_head',
      'thorn_body',
      'thorn_arms',
      'thorn_legs',
      'gale_legs',
    ])
      out.push(id + ':' + g.craft(id));
    return out.join(' ');
  });
  log('craft', crafted);
  await p.click('.ptab:nth-child(1)');
  await ev(() => {
    const g = window.__game;
    g.setStyle('twin');
    g.setLoadout('R', 'frostfang');
    g.setLoadout('L', 'emberblaster');
    for (const s of ['head', 'body', 'arms', 'legs']) g.setLoadout(s, 'thorn_' + s);
  });
  await p.click('.ptab:nth-child(1)');
  await shot('03_loadout');
  log(
    'gear',
    await ev(() => {
      const g = window.__game;
      return {
        maxHp: g.TUNE.maxHp,
        def: g.GEAR.def,
        R: g.UNLOCKS.equip.R,
        L: g.UNLOCKS.equip.L,
        left: !!g.P.m.swordL,
        armor: Object.keys(g.P.m.armorG || {}).filter(k => g.P.m.armorG[k].length),
      };
    }),
  );
  await p.click('#panelClose');
  await p.keyboard.press('KeyP');
  await ev(() => {
    const g = window.__game;
    g.cam.yaw = Math.PI;
    g.cam.pitch = 0.2;
    window.T_(40);
  });
  await shot('04_armored');
  // Twin Arms fight in Puffcap Fields with a contract
  await ev(() => {
    window.__game.acceptContract('c_spores');
  });
  log(
    'fields',
    await ev(() => {
      const g = window.__game,
        I = g.LV.islands.fields;
      window.go(I.x, I.z - 9);
      window.T_(60);
      const den = g.G.enemies.filter(e => e.alive && e.den === 'fields');
      g.G.enemies.forEach(e => (e.cool = 1e9));
      g.P.inv = 1e9;
      const e = den.find(e => e.type === 'puff');
      const out = { den: den.length };
      // R-arm blade string
      e.x = g.P.x;
      e.z = g.P.z + 1.8;
      g.P.face = 0;
      const names = [];
      for (let i = 0; i < 3; i++) {
        window.tap('light', 14);
        names.push(g.P.name);
      }
      out.rString = names.join('>');
      window.T_(30);
      // hold L-arm: the blaster autofires at a locked target
      const t = den.find(x => x.alive && x !== e) || e;
      g.P.lock = t;
      const p0 = g.UNLOCKS.parts.spore;
      g.press('heavy');
      let shots = 0;
      for (let i = 0; i < 90; i++) {
        window.T_(1);
        shots = Math.max(shots, g.G.pshots.length);
      }
      g.release('heavy');
      out.shotsInFlight = shots;
      out.targetHp = Math.round(t.hp) + '/' + t.max;
      out.alive = t.alive;
      window.T_(120);
      return out;
    }),
  );
  await shot('05_twin_fight');
  log(
    'drops + contract',
    await ev(() => {
      const g = window.__game;
      let k = 0;
      while (g.G.enemies.some(e => e.alive && e.den === 'fields') && k++ < 30) {
        for (const e of g.G.enemies)
          if (e.alive && e.den === 'fields') {
            e.hp = 1;
            g.P.x = e.x;
            g.P.z = e.z - 1.6;
            g.P.face = 0;
            g.P.st = 'move';
            window.tap('light', 16);
          }
      }
      window.T_(120);
      return {
        gems: g.G.gems.length,
        spores: g.UNLOCKS.parts.spore,
        prog: g.UNLOCKS.contracts.prog.c_spores,
        tracker: document.getElementById('ctr').textContent,
      };
    }),
  );
  // flight to Skyreach Isle (no bridge)
  log(
    'flight',
    await ev(() => {
      const g = window.__game,
        F = g.LV.islands.fields,
        S = g.LV.islands.skyreach;
      window.go(F.x - 4, F.z + 8);
      g.P.inv = 0;
      g.press('fly');
      g.release('fly');
      window.T_(2);
      g.press('jump');
      window.T_(50);
      g.release('jump');
      const y0 = g.P.y,
        out = { fly: g.P.fly, y: y0.toFixed(1) };
      g.cam.yaw = Math.atan2(S.x - g.P.x, S.z - g.P.z);
      g.keys.KeyW = true;
      let i = 0;
      for (; i < 600; i++) {
        g.cam.yaw = Math.atan2(S.x - g.P.x, S.z - g.P.z);
        window.T_(1);
        if (Math.hypot(g.P.x - S.x, g.P.z - S.z) < 4) break;
      }
      g.keys.KeyW = false;
      out.energy = Math.round(g.P.fe);
      out.reached = Math.hypot(g.P.x - S.x, g.P.z - S.z) < 6;
      out.frames = i;
      return out;
    }),
  );
  await shot('06_flying');
  log(
    'landing + waystone',
    await ev(() => {
      const g = window.__game,
        w = g.DATA.adventure.waystones.skyreach;
      g.press('down');
      window.T_(120);
      g.release('down');
      window.go(w[0] + 1, w[1]);
      window.T_(10);
      return { onG: g.P.onG, lit: g.UNLOCKS.way, banner: document.getElementById('banB').textContent };
    }),
  );
  // resource crystal
  log(
    'node',
    await ev(() => {
      const g = window.__game,
        n = g.G.enemies.find(e => e.alive && e.d.static);
      if (!n) return 'none';
      const c0 = g.UNLOCKS.parts.cloud;
      n.hp = 1;
      g.P.x = n.x;
      g.P.z = n.z - 1.8;
      g.P.face = 0;
      g.P.st = 'move';
      window.tap('light', 16);
      window.T_(200);
      return { alive: n.alive, cloudGained: g.UNLOCKS.parts.cloud - c0 };
    }),
  );
  // map + fast travel
  await ev(() => {
    const g = window.__game;
    g.press('map');
    g.release('map');
    window.T_(2);
  });
  await p.waitForTimeout(300);
  await shot('07_map');
  log(
    'map',
    await ev(() => ({
      panel: !document.getElementById('panel').hidden,
      tab: document.querySelector('.ptab.on').textContent,
    })),
  );
  log(
    'fast travel',
    await ev(
      () =>
        new Promise(res => {
          const g = window.__game;
          document.getElementById('panelClose').click();
          if (g.G.paused) g.G.paused = false;
          g.AD.ways.haven.lit = true;
          g.fastTravel('haven');
          setTimeout(() => {
            window.T_(5);
            setTimeout(() => {
              window.T_(5);
              res({ x: g.P.x.toFixed(1), z: g.P.z.toFixed(1), paused: g.G.paused, cine: g.G.cine });
            }, 1000);
          }, 1000);
        }),
    ),
  );
  // Titanic Scion
  await ev(() => {
    const g = window.__game;
    g.UNLOCKS.contracts.active = [];
    g.acceptContract('c_titan');
    const T = g.LV.islands.titan;
    window.go(T.x - 10, T.z - 12);
    window.T_(10);
  });
  log(
    'titan',
    await ev(() => {
      const g = window.__game,
        bb = g.G.boss;
      return bb ? { name: bb.d.name, hp: bb.max, sc: bb.d.sc, line: g.TALK.line } : 'no titan';
    }),
  );
  await ev(() => {
    window.talkAll();
    window.T_(60);
  });
  await shot('08_titan');
  log(
    'focus',
    await ev(() => {
      const g = window.__game;
      g.P.lock = null;
      g.press('lock');
      g.release('lock');
      window.T_(2);
      const a = g.P.lock && g.P.lock.d.name;
      g.press('lock');
      g.release('lock');
      window.T_(2);
      return { lock: a, focus: g.P.focus };
    }),
  );
  log(
    'shoot crystal',
    await ev(() => {
      const g = window.__game,
        bb = g.G.boss,
        k = g.P.focus;
      bb.cool = 1e9;
      g.P.inv = 1e9;
      const h0 = bb.m.parts[k].hp;
      g.press('heavy');
      window.T_(120);
      g.release('heavy');
      window.T_(30);
      return { part: k, partHp: Math.round(h0) + '->' + Math.round(bb.m.parts[k].hp), bossHp: Math.round(bb.hp) };
    }),
  );
  log(
    'titan down',
    await ev(() => {
      const g = window.__game,
        bb = g.G.boss;
      bb.hp = 5;
      bb.phase = 3;
      g.P.x = bb.x;
      g.P.z = bb.z - 5;
      g.P.face = 0;
      g.P.st = 'move';
      g.P.lock = bb;
      g.press('heavy');
      window.T_(60);
      g.release('heavy');
      window.T_(200);
      window.talkAll();
      window.T_(200);
      return {
        alive: bb.alive,
        titan: g.UNLOCKS.parts.titan,
        done: g.UNLOCKS.contracts.done.c_titan,
        gems: g.G.gems.length,
      };
    }),
  );
  await shot('09_titan_down');
  // style toggle in play and Classic again
  log(
    'style',
    await ev(() => {
      const g = window.__game;
      g.P.st = 'move';
      g.press('style');
      g.release('style');
      window.T_(2);
      return { style: g.UNLOCKS.style, chip: document.getElementById('wpnN').textContent };
    }),
  );
  // story chapter: flying is blocked from locked islands
  await p.keyboard.press('KeyP');
  await p.click('#quitBtn');
  await p.click('#modePick .mode[data-mode="story"]');
  await ev(() => {
    window.__manual = true;
  });
  await p.click('#startBtn');
  log(
    'story wind',
    await ev(() => {
      const g = window.__game;
      window.T_(30);
      window.talkAll();
      const M = g.LV.islands.grove,
        F = g.LV.islands.meadow;
      g.P.x = F.x;
      g.P.z = F.z;
      g.P.y = 3;
      g.P.onG = false;
      g.P.fly = true;
      g.P.fe = 100;
      g.keys.KeyW = true;
      for (let i = 0; i < 300; i++) {
        g.cam.yaw = Math.atan2(M.x - g.P.x, M.z - g.P.z);
        window.T_(1);
      }
      g.keys.KeyW = false;
      return {
        x: g.P.x.toFixed(1),
        z: g.P.z.toFixed(1),
        distToGrove: Math.hypot(g.P.x - M.x, g.P.z - M.z).toFixed(1),
        groveR: M.r,
      };
    }),
  );
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})();
