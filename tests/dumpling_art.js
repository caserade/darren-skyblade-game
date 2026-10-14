// Renders Dumpling's concept-art views and Hangar portraits from the real in-game model.
// usage: node tests/dumpling_art.js   -> tests/shots/art_*.png  (then: python3 tools/make_dumpling_art.py)
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.URL || 'http://localhost:8768/dist/test.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(3500);
  await p.click('#modePick .mode[data-mode="adventure"]');
  await p.evaluate(() => (window.__manual = true));
  await p.click('#startBtn');
  await p.evaluate(() => {
    const g = window.__game,
      T = THREE;
    window.T_ = n => {
      for (let i = 0; i < n; i++) g.tick(1 / 60);
    };
    T_(20);
    while (g.G.cine) {
      g.advanceTalk();
      g.advanceTalk();
      T_(2);
    }
    const K = g.DATA.dumpling.bakery;
    g.P.x = K.x + 3;
    g.P.z = K.z + 3;
    T_(10);
    while (g.G.cine) {
      g.advanceTalk();
      g.advanceTalk();
      T_(2);
    }
    document.getElementById('hud').style.visibility = 'hidden';
    // studio exposure: a little darker than the open sky so colours read true
    if (g.POST && g.POST.grade) g.POST.grade.uniforms.uExposure.value = 0.86;
    if (g.POST && g.POST.bloom) g.POST.bloom.strength = 0.18;
    const D = g.DUMP;
    // studio: hide the level, keep the sky; a soft round floor under him
    g.LV.root.visible = false;
    g.scene.add(D.m.root);
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d'),
      gr = x.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, 'rgba(178,214,150,1)');
    gr.addColorStop(0.55, 'rgba(160,200,140,0.85)');
    gr.addColorStop(1, 'rgba(160,200,140,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 256, 256);
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    const floor = new T.Mesh(
      new T.CircleGeometry(4.5, 48),
      new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, depthWrite: false }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    g.scene.add(floor);
    window.FLOOR = floor;
    window.pose = o => {
      g.UNLOCKS.dumpling.hold = true;
      D.st = 'pose';
      D.x = 0;
      D.z = 0;
      D.y = o.y || 0;
      D.face = 0;
      D.w = o.w;
      D.vis = stageInfo(g.DATA.dumpling.weight.stages, o.w).size;
      D.stage = -1;
      D.full = o.full || 0;
      D.flop = null;
      D.eatT = 0;
      D.mood = 0;
      D.spicy = 0;
      for (const k in D.J) D.J[k] = 0;
      D.rip = 0;
      g.P.x = 0.01;
      g.P.z = 9;
      g.P.y = 0;
      g.P.m.root.visible = false;
      for (const gm of g.G.gems || []) gm.m.visible = false;
      for (const e of g.G.enemies) if (e.m && e.m.root) e.m.root.visible = false;
      for (const sn of D.snacks) sn.g.visible = false;
      if (g.LV.ruffy) g.LV.ruffy.root.visible = false;
      if (g.LV.mom) g.LV.mom.root.visible = false;
      FLOOR.position.set(0, 0.01, 0);
      T_(o.warm || 30);
      if (o.eat) D.eatT = 0.9;
      if (o.mood) D.mood = 1.4;
      if (o.flop) D.flop = { sx: 0, sz: 0, sy: 0, tx: 0, tz: 0, t: 0, dur: 1.2, h: 1.6, tg: null };
      if (o.kick) {
        D.J.vy = o.kick[1];
        D.J.vz = o.kick[2];
        D.J.vx = o.kick[0];
      }
      T_(o.after || 2);
      if (o.flop) D.flop.t = 0.55; // hold at the top of the hop
      D.y = o.y || D.y;
      T_(1);
      g.P.m.root.visible = false;
      const a = o.a || 0,
        grow = o.fixed ? 1 : 1 + o.w * 0.42 + (o.full || 0) * 0.22,
        d = (o.d || 6.4) * grow,
        h = o.h === undefined ? 1.5 : o.h,
        y = D.y;
      g.camera.position.set(Math.sin(a) * d, h + y, Math.cos(a) * d);
      g.camera.lookAt(0, (o.ty === undefined ? 1.2 : o.ty) + y * 0.9, 0);
      g.camera.fov = o.fov || 34;
      g.camera.updateProjectionMatrix();
      g.camera.updateMatrixWorld();
    };
  });
  const shots = [
    // turnaround (his starting weight)
    ['turn_front', { w: 0.35, a: 0 }],
    ['turn_34', { w: 0.35, a: 0.8 }],
    ['turn_side', { w: 0.35, a: 1.57, d: 7 }],
    ['turn_back', { w: 0.35, a: 3.14 }],
    // weight stages
    // the 7 weight stages (the last one is his limit) and a full belly at the limit
    ...[0, 0.15, 0.3, 0.46, 0.62, 0.78, 0.92].map((w, i) => ['w_' + i, { w, a: 0.55, d: 7.6, fixed: true, ty: 1.35 }]),
    ['w_stuffed', { w: 1, full: 1, a: 0.55, d: 7.6, fixed: true, ty: 1.35 }],
    // expressions and moves
    ['x_face', { w: 0.45, a: 0.3, d: 2.4, h: 2.15, ty: 1.95, fov: 30, fixed: true }],
    ['x_eat', { w: 0.5, full: 0.6, a: 0.4, d: 3.4, h: 2.0, ty: 1.7, eat: true, after: 6 }],
    ['x_giggle', { w: 0.6, a: -0.5, d: 5, h: 1.6, mood: true, kick: [0.6, -0.8, 1.2], after: 5 }],
    ['x_flop', { w: 0.8, a: 1.2, d: 5.6, h: 0.6, flop: true, ty: 1.3, after: 2 }],
    ['x_float', { w: 0.9, full: 0.4, a: 0.7, d: 5.4, y: 1.2, h: 0.9, warm: 40 }],
    // Hangar portraits
    ['p_trim', { w: 0.08, a: 0.45, d: 5.2, h: 1.8, ty: 1.3, fov: 40 }],
    ['p_plump', { w: 0.45, a: 0.45, d: 5.0, h: 1.8, ty: 1.3, fov: 40 }],
    ['p_round', { w: 0.95, full: 0.3, a: 0.45, d: 4.6, h: 1.8, ty: 1.3, fov: 40 }],
  ];
  for (const [n, o] of shots) {
    await p.evaluate(o => pose(o), o);
    await p.waitForTimeout(350);
    const sq = n.startsWith('p_') || n.startsWith('x_face');
    await p.screenshot({
      path: `tests/shots/art_${n}.png`,
      clip: sq ? { x: 225, y: 75, width: 750, height: 750 } : { x: 300, y: 60, width: 600, height: 780 },
    });
    console.log('shot', n);
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
