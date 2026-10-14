const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 640, height: 360 } });
  for (let run = 0; run < 3; run++) {
    await p.goto((process.env.URL || 'http://localhost:8768/dist/test.html')); await p.waitForTimeout(2000);
    console.log(await p.evaluate(() => {
      const g = window.__game, out = [];
      for (const c of g.LV.colliders) { const d = Math.hypot(c.x - 7.7, c.z - 45.9); if (d < 4) out.push('collider ' + c.x.toFixed(1) + ',' + c.z.toFixed(1) + ' r' + c.r + ' d' + d.toFixed(1)); }
      // any collider within 2.5 m of the straight route meadow->stones->grove?
      const A = { x: 0, z: 36 }, B = { x: 27, z: 72 }; let worst = 99;
      for (const c of g.LV.colliders) { const dx = B.x - A.x, dz = B.z - A.z, L2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((c.x - A.x) * dx + (c.z - A.z) * dz) / L2)); const d = Math.hypot(c.x - (A.x + dx * t), c.z - (A.z + dz * t)); if (d < worst) worst = d; }
      return 'run: ' + (out.join('; ') || 'no colliders near edge') + ' | closest collider to route ' + worst.toFixed(2);
    }));
  }
  await b.close();
})();
