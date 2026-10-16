'use strict';
/* Make a boss model with the Tripo 3D API, on your own PC (Node.js 18 or newer).

   Your API key stays on your PC: put it in a file called tripo_key.txt in the game folder (just the key, one line),
   or in the TRIPO_API_KEY environment variable. This script never prints, logs or saves the key anywhere else,
   and the game's local server (pc-server.cjs) never serves that file.

   usage:
     node tools/tripo_make.cjs --name scion --prompt-file tools/tripo/scion.txt      (text to 3D)
     node tools/tripo_make.cjs --name scion --image docs/art/scion_concept.png        (image to 3D)
   options:
     --faces 100000          triangle budget for Tripo's mesh (the game makes its own 30k / 10k versions later)
     --model v3.1-20260211   Tripo generation model (H series)
     --texture detailed      texture quality: standard | detailed
     --no-rig                skip the automatic skeleton (rig-check + rig)
     --dry-run               check the key file and the settings, send nothing
   Writes models/tripo/<name>/ : model.glb (textured), rigged.glb (if riggable), preview image, info.json.
   Then tell Claude it is done: Claude brings the files into the game (LODs, weak spots, the boss rig and moves). */
const fs = require('node:fs'), path = require('node:path');
const API = process.env.TRIPO_API_BASE || 'https://openapi.tripo3d.com/v3'; // the override is only for the offline test
const ROOT = path.resolve(__dirname, '..');

function args() {
  const a = process.argv.slice(2), o = { faces: 100000, model: 'v3.1-20260211', texture: 'detailed', rig: true };
  for (let i = 0; i < a.length; i++) {
    const k = a[i], v = a[i + 1];
    if (k === '--name') (o.name = v), i++;
    else if (k === '--prompt-file') (o.promptFile = v), i++;
    else if (k === '--prompt') (o.prompt = v), i++;
    else if (k === '--negative') (o.negative = v), i++;
    else if (k === '--image') (o.image = v), i++;
    else if (k === '--faces') (o.faces = parseInt(v, 10)), i++;
    else if (k === '--model') (o.model = v), i++;
    else if (k === '--texture') (o.texture = v), i++;
    else if (k === '--no-rig') o.rig = false;
    else if (k === '--dry-run') o.dry = true;
  }
  if (!o.name || !/^[a-z0-9_-]+$/i.test(o.name)) throw new Error('give a --name made of letters, numbers, - or _ (for example --name scion)');
  if (o.promptFile) {
    const t = fs.readFileSync(path.resolve(ROOT, o.promptFile), 'utf8').split(/\r?\n/);
    // prompt file: the prompt, then optionally a line "negative: ..." for things to avoid
    o.prompt = t.filter(l => l.trim() && !/^negative:/i.test(l)).join(' ').trim();
    const neg = t.find(l => /^negative:/i.test(l));
    if (neg && !o.negative) o.negative = neg.replace(/^negative:\s*/i, '').trim();
  }
  if (!o.prompt && !o.image) throw new Error('give --prompt-file, --prompt or --image');
  if (o.prompt && o.prompt.length > 1024) throw new Error('the prompt is longer than 1024 characters');
  if (o.negative && o.negative.length > 255) o.negative = o.negative.slice(0, 255);
  if (!(o.faces >= 1000 && o.faces <= 1500000)) throw new Error('--faces must be between 1000 and 1500000');
  return o;
}
function readKey() {
  let k = process.env.TRIPO_API_KEY || '';
  const f = path.join(ROOT, 'tripo_key.txt');
  if (!k && fs.existsSync(f)) k = fs.readFileSync(f, 'utf8').trim();
  if (!k) throw new Error('no API key: make a file called tripo_key.txt in the game folder with your Tripo key on one line');
  if (/\s/.test(k)) throw new Error('tripo_key.txt should contain only the key (no spaces or extra lines)');
  return k;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let KEY = '';
async function call(method, p, body, form) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API + p, {
      method,
      headers: Object.assign({ Authorization: 'Bearer ' + KEY }, form ? {} : { 'Content-Type': 'application/json' }),
      body: form || (body ? JSON.stringify(body) : undefined),
    });
    let j = null;
    try { j = await res.json(); } catch (_) {}
    if ((res.status === 429 || res.status >= 500) && attempt < 5) { await sleep(2000 * (attempt + 1)); continue; }
    if (!res.ok || !j || j.code !== 0) {
      const msg = j ? `code ${j.code}${j.message ? ': ' + j.message : ''}${j.suggestion ? ' (' + j.suggestion + ')' : ''}` : 'HTTP ' + res.status;
      if (res.status === 401) throw new Error('Tripo refused the key (401). Check tripo_key.txt.');
      if (res.status === 403) throw new Error('Tripo says the account has no access or not enough credits (403): ' + msg);
      throw new Error(`${method} ${p} failed: ${msg}`);
    }
    return j.data;
  }
}
async function poll(id, label) {
  let last = -1;
  for (;;) {
    const d = await call('GET', '/tasks/' + id);
    if (d.progress !== last) { process.stdout.write(`\r  ${label}: ${d.status} ${d.progress || 0}%   `); last = d.progress; }
    if (d.status === 'success') { process.stdout.write('\n'); return d; }
    if (d.status === 'failed' || d.status === 'cancelled') { process.stdout.write('\n'); throw new Error(`${label} ${d.status}: ${d.error_message || d.error_code || ''}`); }
    await sleep(3000);
  }
}
async function download(url, file) {
  const res = await fetch(url); // result links are signed and expire after about 5 minutes: fetch right away
  if (!res.ok) throw new Error('download failed: HTTP ' + res.status);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return fs.statSync(file).size;
}
(async () => {
  const o = args();
  if (typeof fetch !== 'function' || typeof FormData !== 'function') throw new Error('Node.js 18 or newer is needed (nodejs.org, LTS)');
  KEY = readKey();
  const out = path.join(ROOT, 'models', 'tripo', o.name);
  fs.mkdirSync(out, { recursive: true });
  const info = { name: o.name, started: new Date().toISOString(), settings: { model: o.model, faces: o.faces, texture: o.texture, rig: o.rig }, prompt: o.prompt || null, negative: o.negative || null, image: o.image || null, tasks: {}, credits: 0 };
  const gen = { model: o.model, face_limit: o.faces, texture: true, pbr: true, texture_quality: o.texture, geometry_quality: 'detailed' };
  console.log(`Tripo boss maker: ${o.name} (${o.image ? 'image to 3D' : 'text to 3D'}, ${o.faces} faces, ${o.texture} textures)`);
  if (o.dry) { console.log('dry run: key file found, settings OK, nothing sent'); return; }
  let task;
  if (o.image) {
    const file = path.resolve(ROOT, o.image), ext = path.extname(file).toLowerCase();
    const type = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[ext];
    if (!type) throw new Error('the image must be PNG, JPEG or WebP');
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(file)], { type }), path.basename(file));
    const up = await call('POST', '/files', null, form);
    console.log('  uploaded the image');
    task = await call('POST', '/generation/image-to-model', Object.assign({ input: up.file_token }, gen));
  } else {
    task = await call('POST', '/generation/text-to-model', Object.assign({ prompt: o.prompt }, o.negative ? { negative_prompt: o.negative } : {}, gen));
  }
  info.tasks.model = task.task_id;
  const done = await poll(task.task_id, 'model');
  info.credits += done.credits_consumed || 0;
  const mb = await download(done.output.model_url, path.join(out, 'model.glb'));
  console.log(`  saved model.glb (${(mb / 1e6).toFixed(1)} MB)`);
  if (done.output.rendered_image_url) {
    try { await download(done.output.rendered_image_url, path.join(out, 'preview' + (path.extname(new URL(done.output.rendered_image_url).pathname) || '.webp'))); } catch (_) {}
  }
  if (o.rig) {
    const chk = await call('POST', '/animations/rig-check', { input: task.task_id });
    const c = await poll(chk.task_id, 'rig check');
    info.tasks.rigCheck = chk.task_id;
    info.rigType = c.output && c.output.rig_type;
    info.riggable = !!(c.output && c.output.riggable);
    if (info.riggable) {
      const rig = await call('POST', '/animations/rig', info.rigType === 'biped' ? { input: task.task_id, rig_type: 'biped', spec: 'mixamo', model: 'v1.0-20240301' } : { input: task.task_id, rig_type: info.rigType, spec: 'tripo', model: 'v2.5-20260210' });
      info.tasks.rig = rig.task_id;
      const r = await poll(rig.task_id, 'rig');
      info.credits += r.credits_consumed || 0;
      const rb = await download(r.output.model_url, path.join(out, 'rigged.glb'));
      console.log(`  saved rigged.glb (${info.rigType}, ${(rb / 1e6).toFixed(1)} MB)`);
    } else console.log('  Tripo cannot rig this shape; Claude will rig it with the game\'s own boss skeleton');
  }
  info.finished = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'info.json'), JSON.stringify(info, null, 2));
  console.log(`Done. Credits used: ${info.credits}. Files are in models\\tripo\\${o.name}\\ - tell Claude it is ready.`);
})().catch(e => {
  console.error('\nStopped: ' + e.message);
  process.exitCode = 1;
});
