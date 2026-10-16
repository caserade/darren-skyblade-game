// Difficulty check: a simple "average player" bot plays every story zone, boss and big monster for real (no cheats:
// it walks in, attacks with combos, jumps at fliers, backs off and dodges when an enemy winds up), and reports
// time, damage taken and deaths per fight. usage: node tests/balance.js [scenario ...]   (ch1 ch2 ch3 adv)
// Serve the repo on :8768 and build dist/test.html first.
const { chromium } = require('playwright-core');
const only = process.argv.slice(2);
const SC = only.length ? only : ['ch1', 'ch2', 'ch3', 'adv'];
const ADV = (process.env.ADV || 'skydrake,heavyweight,chomprex,titan').split(',');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  const URL = process.env.URL || 'http://localhost:8768/dist/test.html';
  const results = [];
  const boot = async (mode, chap) => {
    await p.goto(URL, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(5000);
    await p.evaluate(() => localStorage.clear());
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(5000);
    await p.click(`#modePick .mode[data-mode="${mode}"]`);
    if (chap) await p.click(`#chapPick button:nth-child(${chap})`);
    await p.evaluate(() => (window.__manual = true));
    await p.click('#startBtn');
    await p.waitForTimeout(800);
    await p.evaluate(BOTSRC);
    if (process.env.TRACE) await p.evaluate(() => (window.__trace = true));
  };
  // the bot and the fight runner live in the page
  const BOTSRC = () => {
    const g = window.__game, P = g.P;
    window.T_ = n => { for (let i = 0; i < n; i++) g.tick(1 / 60); };
    window.talkAll = () => { let k = 0; while (g.G.cine && k++ < 120) { g.advanceTalk(); g.advanceTalk(); window.T_(2); } };
    window.goto = (id, dx, dz) => { const I = g.LV.islands[id]; P.x = I.x + (dx || 0); P.z = I.z + (dz || 0); P.y = 0; P.onG = true; P.fly = false; P.vx = P.vz = P.vy = 0; g.cam.fx = P.x; g.cam.fz = P.z; };
    window.takeZone = id => { for (const pk of g.LV.pickups) if (pk.zone === id && !pk.taken && pk.g.visible) { P.x = pk.x; P.z = pk.z; P.y = 0; window.T_(4); window.talkAll(); window.T_(4); } };
    // label every hit Darren takes with its source (attack state, or the shockwave ring)
    window.HITS = {};
    const oH = window.hurtP, oD = window.damagePlayer;
    let via = null;
    window.hurtP = (e, dmg, fx, fz, heavy) => { via = e.type + ':' + e.st; const r = oH(e, dmg, fx, fz, heavy); via = null; return r; };
    window.damagePlayer = (dmg, fx, fz, heavy) => { const h0 = P.hp, r = oD(dmg, fx, fz, heavy); if (P.hp < h0) { const k = via || 'ring/other'; window.HITS[k] = Math.round((window.HITS[k] || 0) + h0 - P.hp); } return r; };
    const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
    const tap = a => { g.press(a); g.release(a); };
    const BOT = (window.BOT = { f: 0, dodgeAt: -1, threat: null });
    BOT.step = () => {
      BOT.f++;
      for (const k of keys) g.keys[k] = false;
      const foes = g.G.enemies.filter(e => e.alive && !e.d.static && !e.under && e.st !== 'spawn');
      if (!foes.length || P.st === 'dead') return foes.length;
      const near = foes.map(e => ({ e, d: Math.hypot(e.x - P.x, e.z - P.z) - e.r })).sort((a, b) => a.d - b.d);
      const winding = o => o.e.wind || /Wind/.test(o.e.st) || (o.e.d.boss && /W$/.test(o.e.st));
      const threat = near.find(o => winding(o) && o.d < 7);
      // react like a player: dash the moment a nearby wind-up turns into the attack
      for (const o of near) {
        const was = o.e.__wind;
        o.e.__wind = winding(o);
        if (was && !o.e.__wind && o.e.alive && o.d < 6 && P.stam >= 20 && BOT.f - (BOT.lastDash || -99) > 30) {
          g.cam.yaw = Math.atan2(o.e.x - P.x, o.e.z - P.z);
          for (const k of keys) g.keys[k] = false;
          g.keys.KeyS = true;
          tap('dash');
          BOT.lastDash = BOT.f;
          return foes.length;
        }
      }
      const t = (threat || near[0]).e, d = (threat || near[0]).d;
      g.cam.yaw = Math.atan2(t.x - P.x, t.z - P.z);
      if (threat) {
        BOT.threatF = (BOT.threatF || 0) + 1;
        // a reasonable player: back off from a wind-up, and dodge once just before it lands
        if (BOT.threat !== threat.e || BOT.f - BOT.seen > 120) { BOT.threat = threat.e; BOT.seen = BOT.f; }
        g.keys.KeyS = true;
        g.keys[BOT.f % 240 < 120 ? 'KeyA' : 'KeyD'] = true;
        return foes.length;
      }
      BOT.threat = null;
      // jump over a shockwave ring that is about to reach Darren
      for (const r of ringPool) if (r.on && r.dmg && !r.hit && P.onG && P.st !== 'down') { const dd = Math.hypot(P.x - r.x, P.z - r.z) - r.r; if (dd > 0 && dd < 2.4) { tap('jump'); break; } }
      // keep steering at the target while attacking (that is what turns Darren to face it)
      if (d > 1.6 || BOT.f % 9 < 3) g.keys.KeyW = true;
      if (d < 2.6) {
        if (t.y > 1.3 && P.onG) tap('jump');
        if (BOT.f % 9 === 0) { tap(BOT.f % 54 === 0 ? 'heavy' : 'light'); BOT.atk = (BOT.atk || 0) + 1; }
      }
      // lock on (Q) to big targets, like a player would
      if (((g.G.boss && g.G.boss.alive) || t.d.monster) && !P.lock && BOT.f % 60 === 0) tap('lock');
      return foes.length;
    };
    // run until no enemies (or the boss is down), counting damage taken and "deaths" (the bot is revived)
    window.fight = (maxS, done, focus) => {
      const out = { t: 0, hurt: 0, deaths: 0, minHp: P.hp };
      let last = P.hp;
      for (let i = 0; i < maxS * 60; i++) {
        if (g.G.cine) window.talkAll();
        // Cloud Utopia: fight only the monster under test (dens keep spawning around it) and keep it lean
        if (focus) {
          for (const o of g.G.enemies) if (o !== focus && o.alive && !o.d.static) { o.alive = false; o.gone = true; g.scene.remove(o.m.root); }
          if (focus.wt !== undefined) focus.wt = Math.min(focus.wt, focus.__wt0);
        }
        const n = BOT.step();
        const tgt = focus || g.G.boss, hp0 = tgt ? tgt.hp : 0;
        g.tick(1 / 60);
        if (tgt && window.__trace && i % 60 === 0 && i < 1800) (out.trace = out.trace || []).push([i / 60, P.st, P.atk && P.atk.name, +(Math.hypot(tgt.x - P.x, tgt.z - P.z) - tgt.r).toFixed(1), tgt.st, Math.round(tgt.hp), +P.y.toFixed(1), P.onG, !!P.lock].join(' '));
        if (tgt) {
          (out.st = out.st || {})[tgt.st] = (out.st[tgt.st] || 0) + 1;
          if (tgt.hp < hp0) (out.dealtIn = out.dealtIn || {})[tgt.st] = Math.round((out.dealtIn[tgt.st] || 0) + hp0 - tgt.hp);
          out.dist = (out.dist || 0) + Math.hypot(tgt.x - P.x, tgt.z - P.z) - tgt.r;
        }
        if (P.hp < last) {
          out.hurt += last - P.hp;
          const src = focus || g.G.boss || null;
          if (src) { const k = src.st + (src.clip ? '/' + src.clip : ''); (out.by = out.by || {})[k] = Math.round(((out.by || {})[k] || 0) + last - P.hp); }
        }
        out.minHp = Math.min(out.minHp, P.hp);
        if (P.st === 'dead') { out.deaths++; P.hp = g.TUNE.maxHp; P.st = 'move'; P.inv = 90; g.G.endT = 0; P.y = 0; P.vy = 0; P.onG = true; }
        last = P.hp;
        out.t = i / 60;
        if (done ? done() : n === 0 && i > 30) break;
      }
      for (const k of keys) g.keys[k] = false;
      out.t = +out.t.toFixed(1);
      out.hits = window.HITS; window.HITS = {};
      out.bot = { threat: +((BOT.threatF || 0) / 60).toFixed(1), attacks: BOT.atk || 0, pst: P.st };
      BOT.threatF = BOT.atk = 0;
      if (out.st) { for (const k in out.st) out.st[k] = +(out.st[k] / 60).toFixed(1); out.dist = +(out.dist / (out.t * 60 || 1)).toFixed(1); }
      out.hurt = Math.round(out.hurt);
      out.minHp = Math.round(out.minHp);
      const left = g.G.enemies.filter(e => e.alive && !e.d.static).map(e => e.type + ':' + Math.round(e.hp) + '@y' + e.y.toFixed(1));
      if (left.length) out.left = left;
      return out;
    };
  };
  const rec = (name, r) => { results.push(Object.assign({ name }, r)); console.log(name.padEnd(26), JSON.stringify(r)); };
  const story = async (chap, label) => {
    await boot('story', chap);
    const zones = await p.evaluate(() => window.__game.CH.zones.map(z => ({ id: z.id, island: z.island, boss: !!z.boss })));
    for (const z of zones) {
      if (z.id === 'home') continue;
      const r = await p.evaluate(z => {
        const g = window.__game;
        window.goto(z.island, z.boss ? 0 : -3, z.boss ? 10 : 2);
        window.T_(20);
        window.talkAll();
        window.T_(30);
        window.talkAll();
        const st = () => g.LV.zoneState[z.id] && g.LV.zoneState[z.id].state;
        const r = window.fight(z.boss ? 420 : 150, () => st() === 'cleared' || (z.boss && g.G.boss && !g.G.boss.alive));
        r.cleared = st() === 'cleared' || !!(z.boss && g.G.boss && !g.G.boss.alive);
        r.hpLeft = Math.round(g.P.hp);
        window.T_(90);
        window.talkAll();
        window.takeZone(z.id);
        window.talkAll();
        window.T_(60);
        window.talkAll();
        g.P.hp = Math.max(g.P.hp, 1);
        return r;
      }, z);
      rec(label + ' ' + z.id + (z.boss ? ' (boss)' : ''), r);
    }
  };
  if (SC.includes('ch1')) await story(1, 'ch1');
  if (SC.includes('ch2')) await story(2, 'ch2');
  if (SC.includes('ch3')) await story(3, 'ch3');
  if (SC.includes('adv')) {
    await boot('adventure');
    for (const [type, isle] of [['skydrake', 'spires'], ['heavyweight', 'mesa'], ['chomprex', 'wastes']].filter(x => ADV.includes(x[0]))) {
      const r = await p.evaluate(([type, isle]) => {
        const g = window.__game, I = g.LV.islands[isle];
        g.P.hp = g.TUNE.maxHp;
        // a fresh monster for each test: clear the others and reset the spawn timers
        for (const o of g.G.enemies) if (o.alive && o.d.monster) { o.alive = false; o.gone = true; g.scene.remove(o.m.root); }
        castAdvReset();
        window.goto(isle, -I.r * 0.5, 0);
        window.T_(90);
        window.talkAll();
        const e = g.G.enemies.find(x => x.type === type && x.alive);
        if (!e) return { error: 'did not spawn' };
        g.G.enemies.forEach(o => { if (o !== e && !o.d.static) { o.alive = false; o.gone = true; g.scene.remove(o.m.root); } });
        e.__wt0 = e.wt;
        const r = window.fight(360, () => !e.alive, e);
        r.stage = e.stage;
        r.cleared = !e.alive;
        r.monsterHp = e.max;
        return r;
      }, [type, isle]);
      rec('adv ' + type, r);
    }
    if (ADV.includes('titan')) {
    const r = await p.evaluate(() => {
      const g = window.__game, T = g.LV.islands.titan;
      g.P.hp = g.TUNE.maxHp;
      g.UNLOCKS.contracts.active = [];
      g.acceptContract('c_titan');
      window.goto('titan', -10, -12);
      window.T_(30);
      window.talkAll();
      window.T_(60);
      window.talkAll();
      const bb = g.G.boss;
      if (!bb) return { error: 'no titan' };
      const r = window.fight(480, () => !bb.alive);
      r.cleared = !bb.alive;
      r.bossHp = bb.max;
      return r;
    });
    rec('adv titan', r);
    }
  }
  require('fs').writeFileSync('tests/shots/balance.json', JSON.stringify(results, null, 1));
  console.log(errs.length ? errs.slice(0, 5).join('\n') : 'no errors');
  await b.close();
})();
