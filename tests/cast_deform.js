// Deformation check for the monster rigs: poses each body through every animation clip and measures how much
// the skinned triangles stretch or squash compared with the rest pose (bad weights show up as big ratios).
// usage: node tests/cast_deform.js     (serve the repo on :8768 and build dist/test.html first)
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: 600, height: 400 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.URL || 'http://localhost:8768/dist/test.html');
  await p.waitForTimeout(3500);
  const out = await p.evaluate(() => {
    const T = THREE,
      res = {};
    for (const type of ['skydrake', 'heavyweight', 'chomprex']) {
      const D = buildCastModel(type, { lod: 0 }),
        mesh = D.mesh,
        g = mesh.geometry,
        idx = g.index.array,
        n = g.attributes.position.count,
        rest = new Float32Array(n * 3),
        cur = new Float32Array(n * 3),
        v = new T.Vector3();
      D.root.updateMatrixWorld(true);
      const skinAll = arr => {
        mesh.skeleton.update();
        for (let i = 0; i < n; i++) {
          v.fromBufferAttribute(g.attributes.position, i);
          mesh.boneTransform(i, v);
          arr[i * 3] = v.x;
          arr[i * 3 + 1] = v.y;
          arr[i * 3 + 2] = v.z;
        }
      };
      skinAll(rest);
      const edge = (a, i, j) => Math.hypot(a[i * 3] - a[j * 3], a[i * 3 + 1] - a[j * 3 + 1], a[i * 3 + 2] - a[j * 3 + 2]);
      const clips = Object.assign({}, CAST_CLIPS.all, CAST_CLIPS[type]),
        rep = {};
      let worst = 0;
      const hot = {};
      for (const c in clips) {
        const dur = clips[c][0];
        let maxR = 1,
          bad = 0,
          tot = 0;
        for (let k = 0; k <= 6; k++) {
          const R = castPose(type, c, (k / 6) * dur);
          castApplyPose(D, R);
          D.root.updateMatrixWorld(true);
          skinAll(cur);
          for (let t = 0; t < idx.length; t += 3) {
            for (const [i, j] of [[idx[t], idx[t + 1]], [idx[t + 1], idx[t + 2]], [idx[t + 2], idx[t]]]) {
              const r0 = edge(rest, i, j),
                r1 = edge(cur, i, j);
              if (r0 < 0.006) continue; // ignore sliver edges under 6 mm
              const r = Math.max(r1 / r0, r0 / Math.max(r1, 1e-5));
              tot++;
              if (r > maxR) maxR = r;
              if (r > 2) {
                bad++;
                // which bones the worst edges sit between
                const si = g.attributes.skinIndex,
                  key = mesh.skeleton.bones[si.getX(i)].name + '/' + mesh.skeleton.bones[si.getX(j)].name;
                hot[key] = (hot[key] || 0) + 1;
              }
            }
          }
        }
        rep[c] = { maxStretch: +maxR.toFixed(2), over2x: +((bad / tot) * 100).toFixed(3) + '%' };
        worst = Math.max(worst, maxR);
      }
      // reset
      castApplyPose(D, castPose(type, 'idle', 0));
      res[type] = { worst: +worst.toFixed(2), clips: rep, hot: Object.entries(hot).sort((a, b) => b[1] - a[1]).slice(0, 8) };
    }
    return res;
  });
  for (const t in out) {
    console.log(t, 'worst edge stretch', out[t].worst);
    for (const c in out[t].clips) console.log('   ', c.padEnd(14), JSON.stringify(out[t].clips[c]));
    console.log('    worst areas (main bone of each end):', JSON.stringify(out[t].hot));
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
