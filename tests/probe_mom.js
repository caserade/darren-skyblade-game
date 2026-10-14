const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 700 } })).newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8766/dist/test.html'); await p.waitForTimeout(3500);
  const r = await p.evaluate(() => {
    const D = window.__game.LV.mom; if (!D.skin) return 'not skinned';
    let mesh; D.sc.traverse(o => { if (o.isSkinnedMesh && !mesh) mesh = o; });
    const pos = mesh.geometry.attributes.position, v = new THREE.Vector3(), out = {};
    // in the gltf scene's own space (sc) at rest
    const inv = new THREE.Matrix4().copy(D.sc.matrixWorld).invert(), M = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
    const bands = {};
    let minY = 1e9, maxY = -1e9;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(M); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
      const k = (Math.round(v.y * 10) / 10).toFixed(1); const bb = bands[k] || (bands[k] = { zmax: -9, zx: 0, xmin: 9, xmax: -9 }); if (Math.abs(v.x) < 0.15 && v.z > bb.zmax) { bb.zmax = v.z; } if (Math.abs(v.z) < 0.3) { bb.xmin = Math.min(bb.xmin, v.x); bb.xmax = Math.max(bb.xmax, v.x); } }
    out.minY = minY; out.maxY = maxY; out.bands = bands;
    const bw = {}; for (const n of ['hips', 'spine', 'head']) { const q = new THREE.Vector3(); D.bones[n].bone.getWorldPosition(q); q.applyMatrix4(new THREE.Matrix4().copy(D.root.matrixWorld).invert()); bw[n] = q.toArray().map(x => +x.toFixed(2)); }
    out.bones = bw; out.rootPos = D.root.position.toArray(); out.scale = D.root.scale.x;
    return out;
  });
  console.log(JSON.stringify(r, null, 0));
  await b.close();
})();
