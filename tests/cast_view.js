// Studio renders of the Cloud Utopia monsters (turnarounds, weight stages, key poses) from the in-game models.
// usage: node tests/cast_view.js [tag] [type ...]   -> tests/shots/<tag>_<type>_<view>.png
const { chromium } = require('playwright-core');
const tag = process.argv[2] || 'cast';
const only = process.argv.slice(3);
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
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
    document.getElementById('hud').style.visibility = 'hidden';
    // studio exposure: a little darker than the open sky so colours read true
    if (g.POST && g.POST.grade) g.POST.grade.uniforms.uExposure.value = 0.86;
    if (g.POST && g.POST.bloom) g.POST.bloom.strength = 0.18;
    g.LV.root.visible = false;
    for (const o of [g.LV.ruffy, g.LV.mom, g.P.m]) if (o) o.root.visible = false;
    // hide every loose object in the scene except lights and the sky
    for (const o of g.scene.children) if (!o.isLight && !(o.material && o.material.isShaderMaterial && !/Plane/.test(o.geometry.type)) && o.type !== 'Sprite') o.visible = false;
    const floor = new T.Mesh(new T.CircleGeometry(9, 64), new T.MeshStandardMaterial({ color: 0x6f8a58, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.005;
    floor.receiveShadow = true;
    g.scene.add(floor);
    window.MODELS = {};
    window.show = (type, o) => {
      for (const k in MODELS) MODELS[k].root.visible = false;
      const D = MODELS[type] || (MODELS[type] = buildCastModel(type));
      if (!D.root.parent) g.scene.add(D.root);
      D.root.visible = true;
      g.P.x = 0;
      g.P.z = 30;
      T_(1);
      g.P.m.root.visible = false;
      D.U.uW.value = o.w || 0;
      D.U.uStuff.value = 0;
      const R = castPose(type, o.clip || 'idle', o.t || 0.6);
      castApplyPose(D, R);
      D.root.position.set(0, (o.y || 0), 0);
      D.root.rotation.y = 0;
      D.root.updateMatrixWorld(true);
      const a = o.a || 0,
        d = o.d,
        h = o.h;
      g.camera.position.set(Math.sin(a) * d, h, Math.cos(a) * d);
      g.camera.lookAt(0, o.ty, 0);
      g.camera.fov = 34;
      g.camera.updateProjectionMatrix();
      g.camera.updateMatrixWorld();
    };
  });
  const sizes = { skydrake: [13, 2.6, 2.3], heavyweight: [11, 2.0, 1.7], chomprex: [14, 2.6, 2.1] };
  const types = only.length ? only : ['skydrake', 'heavyweight', 'chomprex'];
  for (const type of types) {
    const [d, h, ty] = sizes[type];
    const views = [
      ['front', { a: 0 }],
      ['side', { a: Math.PI / 2 }],
      ['back', { a: Math.PI }],
      ['34', { a: 0.75 }],
    ];
    if (type !== 'chomprex') views.push(['stage4', { a: 0.75, w: 0.5 }], ['stage7', { a: 0.75, w: 1 }]);
    const clips = {
      skydrake: [['takeoff', 0.3], ['attackWindup', 0.8], ['tailWindup', 0.65]],
      heavyweight: [['stompWindup', 1.05], ['stompRecovery', 0.4], ['stagger', 0.4]],
      chomprex: [['chargeWindup', 0.4], ['biteWindup', 0.44], ['charge', 0.12]],
    }[type];
    for (const [c, t] of clips) views.push(['pose_' + c, { a: 0.9, clip: c, t }]);
    for (const [n, o] of views) {
      await p.evaluate(a => show(a[0], a[1]), [type, Object.assign({ d, h, ty }, o)]);
      await p.waitForTimeout(300);
      await p.screenshot({ path: `tests/shots/${tag}_${type}_${n}.png`, clip: { x: 250, y: 30, width: 900, height: 840 } });
      console.log('shot', type, n);
    }
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
