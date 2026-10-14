// Bakes the Cloud Utopia monsters into rigged, animated .glb files (models/<type>.glb) and an animation
// manifest (models/cast_animations.json), then loads each .glb back with GLTFLoader to check it.
// usage: node tests/cast_export.js     (serve the repo on :8768 and build dist/test.html first)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await (await b.newContext({ viewport: { width: 900, height: 700 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(process.env.URL || 'http://localhost:8768/dist/test.html');
  await p.waitForTimeout(3500);
  await p.addScriptTag({ path: path.join(ROOT, 'node_modules/three/examples/js/exporters/GLTFExporter.js') });
  fs.mkdirSync(path.join(ROOT, 'models'), { recursive: true });
  const manifest = { format: 'glTF 2.0 binary', up: '+Y', forward: '+Z (the creature faces +Z)', units: 'metres, scale 1', fps: 30, creatures: {} };
  for (const [type, lod] of ['skydrake', 'heavyweight', 'chomprex'].flatMap(t => [[t, 0], [t, 1]])) {
    const out = await p.evaluate(async ([type, lod]) => {
      const T = THREE,
        D = buildCastModel(type, { lod }),
        clips = [],
        info = {};
      D.root.name = type;
      D.body.name = 'body';
      // a plain, exportable copy of the body material (the game adds its weight/jiggle shader on top)
      const m0 = D.mesh.material;
      // wait for the baked textures to decode
      await new Promise(res => {
        const ok = () => !m0.map || (m0.map.image && m0.map.image.complete && m0.normalMap.image && m0.normalMap.image.complete);
        const chk = () => (ok() ? res() : setTimeout(chk, 50));
        chk();
      });
      const plain = new T.MeshStandardMaterial({ map: m0.map || null, normalMap: m0.normalMap || null, vertexColors: !m0.map, roughness: 0.68, metalness: 0, skinning: true, name: type + '_skin' });
      const g0 = D.mesh.geometry,
        g = new T.BufferGeometry();
      for (const a of ['position', 'normal', 'uv', 'tangent', 'color', 'skinIndex', 'skinWeight']) if (g0.attributes[a]) g.setAttribute(a, g0.attributes[a]);
      const bl = g0.attributes.aBelly,
        f = new Float32Array(bl.count);
      for (let i = 0; i < bl.count; i++) f[i] = bl.getX(i);
      g.setAttribute('_belly', new T.BufferAttribute(f, 1)); // belly mask for weight / jiggle (0..1)
      g.setIndex(g0.index);
      D.mesh.geometry = g;
      D.mesh.material = plain;
      const all = Object.assign({}, CAST_CLIPS.all, CAST_CLIPS[type]);
      const E = new T.Euler(),
        Qt = new T.Quaternion();
      for (const name in all) {
        const [dur, loop, events] = all[name],
          n = Math.max(2, Math.round(dur * 30) + 1),
          times = [],
          tracks = {},
          bodyP = [],
          bodyQ = [];
        for (let i = 0; i < n; i++) {
          const t = (i / (n - 1)) * dur;
          times.push(t);
          const R = castPose(type, name, t);
          for (const bn in D.B) {
            const q = R.bones[bn] || [0, 0, 0];
            E.set(q[0], q[1], q[2]);
            Qt.setFromEuler(E);
            (tracks[bn] = tracks[bn] || []).push(Qt.x, Qt.y, Qt.z, Qt.w);
          }
          bodyP.push(0, R.y, 0);
          E.set(R.pitch, 0, R.roll);
          Qt.setFromEuler(E);
          bodyQ.push(Qt.x, Qt.y, Qt.z, Qt.w);
        }
        const tr = [];
        for (const bn in tracks) tr.push(new T.QuaternionKeyframeTrack(bn + '.quaternion', times, tracks[bn]));
        tr.push(new T.VectorKeyframeTrack('body.position', times, bodyP));
        tr.push(new T.QuaternionKeyframeTrack('body.quaternion', times, bodyQ));
        clips.push(new T.AnimationClip(name, dur, tr));
        info[name] = { duration: dur, loop, events: events || {} };
      }
      const glb = await new Promise(res =>
        new T.GLTFExporter().parse(D.root, res, { binary: true, animations: clips, embedImages: true, onlyVisible: false }),
      );
      // check it: load it back and play a clip
      const gl = await new Promise((res, rej) => new T.GLTFLoader().parse(glb, '', res, rej));
      let meshes = 0,
        skinned = 0,
        bones = 0,
        tris = 0,
        maxInf = 0;
      gl.scene.traverse(o => {
        if (o.isMesh) {
          meshes++;
          tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
        }
        if (o.isSkinnedMesh) {
          skinned++;
          const w = o.geometry.attributes.skinWeight;
          for (let i = 0; i < w.count; i += 37) {
            let k = 0;
            for (const v of [w.getX(i), w.getY(i), w.getZ(i), w.getW(i)]) if (v > 0.001) k++;
            maxInf = Math.max(maxInf, k);
          }
        }
        if (o.isBone) bones++;
      });
      const mixer = new T.AnimationMixer(gl.scene);
      mixer.clipAction(gl.animations[0]).play();
      mixer.update(0.5);
      const bytes = new Uint8Array(glb);
      let s = '';
      for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
      return {
        b64: btoa(s),
        info,
        check: { meshes, skinned, bones, triangles: Math.round(tris), clips: gl.animations.map(a => a.name + ' ' + a.duration.toFixed(2) + 's'), maxInfluences: maxInf },
      };
    }, [type, lod]);
    const name = type + (lod ? '_lod1' : '');
    const file = path.join(ROOT, 'models', name + '.glb');
    fs.writeFileSync(file, Buffer.from(out.b64, 'base64'));
    if (!lod) manifest.creatures[type] = { file: 'models/' + type + '.glb', bytes: fs.statSync(file).size, clips: out.info, validation: out.check };
    else Object.assign(manifest.creatures[type], { lod1: { file: 'models/' + name + '.glb', bytes: fs.statSync(file).size, validation: out.check } });
    console.log(name, (fs.statSync(file).size / 1024).toFixed(0) + ' KB', JSON.stringify(out.check));
  }
  fs.writeFileSync(path.join(ROOT, 'models', 'cast_animations.json'), JSON.stringify(manifest, null, 2));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
