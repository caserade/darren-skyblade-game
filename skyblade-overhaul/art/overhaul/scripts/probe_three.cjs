const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../../..'),variant=process.argv[2]||'candidate',out=path.join(root,'art/overhaul/chomprex/review',variant==='lod'?'lod-review':'');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1000,height:1000}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://skyblade-probe.test/**',async route=>{
  const name=new URL(route.request().url()).pathname;
  if(name==='/')return route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><script src="/three.js"></script><script src="/loader.js"></script></body></html>'});
  const file=name==='/three.js'?path.join(root,'dist/vendor/three.min.js'):name==='/loader.js'?path.join(root,'dist/vendor/GLTFLoader.js'):path.join(root,'art/overhaul/chomprex/export/chomprex-'+variant+'.glb');
  return route.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.js')?'text/javascript':'model/gltf-binary'});
 });
 await page.goto('http://skyblade-probe.test/');
 const report=await page.evaluate(async()=>{
  const g=await new Promise((ok,fail)=>new THREE.GLTFLoader().load('/model.glb',ok,undefined,fail));
  const scene=new THREE.Scene();scene.background=new THREE.Color('#bbb4ab');scene.add(g.scene);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(1000,1000);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;document.body.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xfff7e3,0x514656,1.3));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,7,6);scene.add(light);
  const camera=new THREE.OrthographicCamera(-3.4,3.4,3.4,-3.4,.1,100);camera.position.set(-10,6,13);camera.lookAt(0,2.3,-.55);
  const meshes=[];g.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o)});
  const mixer=new THREE.AnimationMixer(g.scene),clips=[];
  for(const clip of g.animations){
   const a=mixer.clipAction(clip);a.reset().setLoop(THREE.LoopOnce,1).play();let invalid=0;const feet=[];
   for(const t of Array.from({length:21},(_,i)=>i/20)){
    mixer.setTime(clip.duration*t);g.scene.updateMatrixWorld(true);
    const low={L:1e9,R:1e9};
    for(const m of meshes){m.skeleton.update();const p=m.geometry.attributes.position;
     for(let i=0;i<p.count;i+=7){const v=new THREE.Vector3().fromBufferAttribute(p,i);m.boneTransform(i,v);if(![v.x,v.y,v.z].every(Number.isFinite))invalid++;}
     const sw=m.geometry.attributes.skinWeight,si=m.geometry.attributes.skinIndex;
     for(let i=0;i<p.count;i++)for(let j=0;j<4;j++){
      const w=sw.array[i*4+j]/(sw.normalized?(sw.array.BYTES_PER_ELEMENT===1?255:65535):1),name=m.skeleton.bones[si.array[i*4+j]].name;
      if(w>.5&&/^(toe|ankle)[LR]$/.test(name)){const v=new THREE.Vector3().fromBufferAttribute(p,i);m.boneTransform(i,v);v.applyMatrix4(m.matrixWorld);const side=name.slice(-1);low[side]=Math.min(low[side],v.y)}
     }
    }
    feet.push({t,leftMinY:low.L,rightMinY:low.R,lowest:Math.min(low.L,low.R)});
   }
   clips.push({name:clip.name,duration:clip.duration,nonfiniteSampledVertices:invalid,footContact:feet});a.stop();
  }
  mixer.stopAllAction();g.scene.updateMatrixWorld(true);renderer.render(scene,camera);window.__probe={g,mixer,scene,renderer,camera};
  return {threeRevision:THREE.REVISION,clips,skinnedMeshes:meshes.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,webglError:renderer.getContext().getError(),scope:'Isolated loader/render/animation smoke test using game bundled Three.js and GLTFLoader; no gameplay validation'};
 });
 await page.screenshot({path:path.join(out,'candidate-three-quarter.png')});
 for(const [name,pos] of [['front',[0,2.3,14]],['side',[14,2.3,-.55]],['back',[0,2.3,-14]]]){
  await page.evaluate(pos=>{const {camera,renderer,scene}=__probe;camera.position.set(...pos);camera.lookAt(0,2.3,-.55);renderer.render(scene,camera)},pos);
  await page.screenshot({path:path.join(out,'candidate-'+name+'.png')});
 }
 for(const [name,t] of [['bite',.6],['chargeWindup',.95],['charge',.5],['walk',.25],['stagger',.5],['death',.95]]){
  await page.evaluate(({name,t})=>{const {g,mixer,scene,renderer,camera}=__probe;mixer.stopAllAction();const clip=g.animations.find(c=>c.name===name),a=mixer.clipAction(clip);a.reset().setLoop(THREE.LoopOnce,1).play();mixer.setTime(clip.duration*t);camera.position.set(-10,6,13);camera.lookAt(0,2.3,-.55);renderer.render(scene,camera)},{name,t});
  await page.screenshot({path:path.join(out,'pose-'+name+'.png')});
 }
 const frames=path.join(out,'turntable');fs.mkdirSync(frames,{recursive:true});
 for(let i=0;i<16;i++){await page.evaluate(i=>{const {mixer,renderer,scene,camera}=__probe;mixer.stopAllAction();const a=i/16*Math.PI*2;camera.position.set(Math.sin(a)*14,4.8,Math.cos(a)*14-.55);camera.lookAt(0,2.3,-.55);renderer.render(scene,camera)},i);await page.screenshot({path:path.join(frames,`${String(i).padStart(2,'0')}.png`)});}
 report.assetSha256=require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'art/overhaul/chomprex/export/chomprex-'+variant+'.glb'))).digest('hex');
 report.pageErrors=errors;fs.writeFileSync(path.join(out,'candidate-three-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({threeRevision:report.threeRevision,clips:report.clips.map(c=>({name:c.name,duration:c.duration,nonfinite:c.nonfiniteSampledVertices,footRange:[Math.min(...c.footContact.map(f=>f.lowest)),Math.max(...c.footContact.map(f=>f.lowest))]})),drawCalls:report.drawCalls,triangles:report.triangles,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
