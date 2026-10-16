'use strict';
/* Make a boss model with the Meshy AI API, on your own PC (Node.js 18 or newer).

   Your API key stays on your PC: put it in a file called meshy_key.txt in the game folder (just the key, one line),
   or in the MESHY_API_KEY environment variable. This script only sends it to Meshy's API (never to the download
   links), and never prints, logs or saves it anywhere else. The game's local server (pc-server.cjs) never serves it.

   usage:
     node tools/meshy_make.cjs --name scion --prompt-file tools/meshy/scion.txt      (text to 3D: preview, then textures)
     node tools/meshy_make.cjs --name scion --image docs/art/scion_concept.png        (image to 3D)
   options:
     --faces 100000      triangle budget for Meshy's mesh (the game makes its own 30k / 10k versions later)
     --texture 2k        texture resolution: 2k | 4k
     --hd                higher-detail geometry (geometry_resolution 2k; costs more credits)
     --height 9          rough height in metres, for the auto-rig
     --no-rig            skip the automatic skeleton (Meshy rigs two-legged characters only)
     --dry-run           check the key file and the settings, send nothing
   Prompt file: the description, plus optional lines "texture: ..." (paint guidance) and "pose: a-pose|t-pose|none".
   Writes models/meshy/<name>/ : model.glb (textured), rigged.glb + walking.glb / running.glb (if rigged),
   the texture maps, a preview image and info.json. Then tell Claude it is done. */
const fs = require('node:fs'), path = require('node:path');
const API = process.env.MESHY_API_BASE || 'https://api.meshy.ai'; // the override is only for the offline test
const ROOT = path.resolve(__dirname, '..');

function args() {
  const a = process.argv.slice(2), o = { faces: 100000, texture: '2k', hd: false, height: 9, rig: true, pose: 'a-pose' };
  for (let i = 0; i < a.length; i++) {
    const k = a[i], v = a[i + 1];
    if (k === '--name') (o.name = v), i++;
    else if (k === '--prompt-file') (o.promptFile = v), i++;
    else if (k === '--prompt') (o.prompt = v), i++;
    else if (k === '--image') (o.image = v), i++;
    else if (k === '--faces') (o.faces = parseInt(v, 10)), i++;
    else if (k === '--texture') (o.texture = v), i++;
    else if (k === '--height') (o.height = parseFloat(v)), i++;
    else if (k === '--hd') o.hd = true;
    else if (k === '--no-rig') o.rig = false;
    else if (k === '--dry-run') o.dry = true;
  }
  if (!o.name || !/^[a-z0-9_-]+$/i.test(o.name)) throw new Error('give a --name made of letters, numbers, - or _ (for example --name scion)');
  if (o.promptFile) {
    const lines = fs.readFileSync(path.resolve(ROOT, o.promptFile), 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const tag = t => lines.find(l => l.toLowerCase().startsWith(t + ':'));
    o.prompt = lines.filter(l => !/^(texture|pose):/i.test(l)).join(' ');
    if (tag('texture')) o.texturePrompt = tag('texture').slice(8).trim();
    if (tag('pose')) o.pose = tag('pose').slice(5).trim().toLowerCase();
  }
  if (o.pose === 'none') o.pose = '';
  if (!['a-pose', 't-pose', ''].includes(o.pose)) throw new Error('pose must be a-pose, t-pose or none');
  if (!o.prompt && !o.image) throw new Error('give --prompt-file, --prompt or --image');
  if (o.prompt && o.prompt.length > 800) throw new Error(`the prompt is ${o.prompt.length} characters; Meshy allows 800`);
  if (o.texturePrompt && o.texturePrompt.length > 800) o.texturePrompt = o.texturePrompt.slice(0, 800);
  if (!(o.faces >= 1000 && o.faces <= 300000)) throw new Error('--faces must be between 1000 and 300000');
  if (!['2k', '4k'].includes(o.texture)) throw new Error('--texture must be 2k or 4k');
  if (!(o.height > 0)) throw new Error('--height must be a positive number of metres');
  return o;
}
function readKey() {
  let k = process.env.MESHY_API_KEY || '';
  const f = path.join(ROOT, 'meshy_key.txt');
  if (!k && fs.existsSync(f)) k = fs.readFileSync(f, 'utf8').trim();
  if (!k) throw new Error('no API key: make a file called meshy_key.txt in the game folder with your Meshy key on one line');
  if (/\s/.test(k)) throw new Error('meshy_key.txt should contain only the key (no spaces or extra lines)');
  return k;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let KEY = '';
async function call(method, p, body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API + p, {
      method,
      headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    let j = null;
    try { j = await res.json(); } catch (_) {}
    if ((res.status === 429 || res.status >= 500) && attempt < 5) { await sleep(3000 * (attempt + 1)); continue; }
    if (!res.ok) {
      const msg = (j && (j.message || (j.task_error && j.task_error.message))) || 'HTTP ' + res.status;
      if (res.status === 401) throw new Error('Meshy refused the key (401). Check meshy_key.txt.');
      if (res.status === 402) throw new Error('Meshy says there are not enough credits (402).');
      throw new Error(`${method} ${p} failed (${res.status}): ${msg}`);
    }
    return j;
  }
}
async function wait(p, label) {
  let last = -1;
  for (;;) {
    const t = await call('GET', p);
    if (t.progress !== last) { process.stdout.write(`\r  ${label}: ${t.status} ${t.progress || 0}%   `); last = t.progress; }
    if (t.status === 'SUCCEEDED') { process.stdout.write('\n'); return t; }
    if (t.status === 'FAILED' || t.status === 'CANCELED') { process.stdout.write('\n'); throw new Error(`${label} ${t.status}: ${(t.task_error && t.task_error.message) || ''}`); }
    await sleep(4000);
  }
}
async function download(url, file) {
  const res = await fetch(url); // signed download links: no key is sent here
  if (!res.ok) throw new Error('download failed: HTTP ' + res.status);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return fs.statSync(file).size;
}
const mb = n => (n / 1e6).toFixed(1) + ' MB';
async function saveModel(t, out, info) {
  const n = await download(t.model_urls.glb, path.join(out, 'model.glb'));
  console.log(`  saved model.glb (${mb(n)})`);
  for (const [i, tex] of (t.texture_urls || []).entries())
    for (const kind of ['base_color', 'metallic', 'roughness', 'normal', 'emission'])
      if (tex[kind]) {
        try { await download(tex[kind], path.join(out, `${kind}${i ? '_' + i : ''}.png`)); } catch (_) {}
      }
  if (t.thumbnail_url) { try { await download(t.thumbnail_url, path.join(out, 'preview.png')); } catch (_) {} }
  info.credits += t.consumed_credits || 0;
}
(async () => {
  const o = args();
  if (typeof fetch !== 'function') throw new Error('Node.js 18 or newer is needed (nodejs.org, LTS)');
  KEY = readKey();
  const out = path.join(ROOT, 'models', 'meshy', o.name);
  const info = { name: o.name, started: new Date().toISOString(), settings: { faces: o.faces, texture: o.texture, hd: o.hd, pose: o.pose, rig: o.rig, height: o.height }, prompt: o.prompt || null, texturePrompt: o.texturePrompt || null, image: o.image || null, tasks: {}, credits: 0 };
  console.log(`Meshy boss maker: ${o.name} (${o.image ? 'image to 3D' : 'text to 3D'}, ${o.faces} faces, ${o.texture} PBR textures${o.hd ? ', HD geometry' : ''})`);
  if (o.dry) { console.log('dry run: key file found, settings OK, nothing sent'); return; }
  fs.mkdirSync(out, { recursive: true });
  const shape = { ai_model: 'latest', should_remesh: true, topology: 'triangle', target_polycount: o.faces, pose_mode: o.pose, target_formats: ['glb', 'fbx'] };
  if (o.hd) shape.geometry_resolution = '2k';
  let final, rigFrom;
  if (o.image) {
    const file = path.resolve(ROOT, o.image), ext = path.extname(file).toLowerCase();
    const type = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[ext];
    if (!type) throw new Error('the image must be PNG, JPEG or WebP');
    const data = fs.readFileSync(file);
    if (data.length > 20e6) throw new Error('the image is over 20 MB');
    const body = Object.assign({ image_url: `data:${type};base64,${data.toString('base64')}`, should_texture: true, enable_pbr: true, texture_resolution: o.texture }, shape);
    if (o.texturePrompt) body.texture_prompt = o.texturePrompt;
    const id = (await call('POST', '/openapi/v1/image-to-3d', body)).result;
    info.tasks.model = id;
    final = await wait('/openapi/v1/image-to-3d/' + id, 'model');
    rigFrom = id;
  } else {
    const pid = (await call('POST', '/openapi/v2/text-to-3d', Object.assign({ mode: 'preview', prompt: o.prompt }, shape))).result;
    info.tasks.preview = pid;
    const pre = await wait('/openapi/v2/text-to-3d/' + pid, 'shape');
    info.credits += pre.consumed_credits || 0;
    const ref = { mode: 'refine', preview_task_id: pid, enable_pbr: true, texture_resolution: o.texture, target_formats: ['glb', 'fbx'] };
    if (o.texturePrompt) ref.texture_prompt = o.texturePrompt;
    const rid = (await call('POST', '/openapi/v2/text-to-3d', ref)).result;
    info.tasks.refine = rid;
    final = await wait('/openapi/v2/text-to-3d/' + rid, 'textures');
    rigFrom = rid;
  }
  await saveModel(final, out, info);
  if (o.rig) {
    try {
      const gid = (await call('POST', '/openapi/v1/rigging', { input_task_id: rigFrom, height_meters: o.height })).result;
      info.tasks.rig = gid;
      const r = await wait('/openapi/v1/rigging/' + gid, 'rig');
      info.credits += r.consumed_credits || 0;
      const res = r.result || {};
      if (res.rigged_character_glb_url) console.log(`  saved rigged.glb (${mb(await download(res.rigged_character_glb_url, path.join(out, 'rigged.glb')))})`);
      const A = res.basic_animations || {};
      for (const k of ['walking', 'running'])
        if (A[k + '_glb_url']) { try { await download(A[k + '_glb_url'], path.join(out, k + '.glb')); } catch (_) {} }
      info.rigged = true;
    } catch (e) {
      // Meshy's auto-rig is for two-legged characters; the model itself is already saved
      console.log('  Meshy could not rig this shape (' + e.message + '). Claude will rig it with the game\'s boss skeleton.');
      info.rigged = false;
    }
  }
  info.finished = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'info.json'), JSON.stringify(info, null, 2));
  console.log(`Done. Credits used: ${info.credits}. Files are in models\\meshy\\${o.name}\\ - tell Claude it is ready.`);
})().catch(e => {
  console.error('\nStopped: ' + e.message);
  process.exitCode = 1;
});
