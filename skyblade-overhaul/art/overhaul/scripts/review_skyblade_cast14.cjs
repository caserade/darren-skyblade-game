const fs=require('fs'),path=require('path'),crypto=require('crypto'),{chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'art/overhaul/skydrake14/review/cast-14');fs.mkdirSync(out,{recursive:true});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const results=[];try{
for(const variant of ['candidate','lod']){
 const ctx=await b.newContext({viewport:{width:1600,height:1000}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0;let seed=1414;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}});
 const files={'/__skydrake-candidate.glb':`art/overhaul/skydrake14/export/skydrake-${variant}.glb`,'/__heavyweight-candidate.glb':`art/overhaul/heavyweight/export/heavyweight-${variant}.glb`};
 await p.route('http://cast.test/**',r=>{const n=new URL(r.request().url()).pathname,f=path.join(root,files[n]||'dist/'+(n==='/'?'index.html':n.slice(1)));return fs.existsSync(f)?r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary'})[path.extname(f)]||'application/octet-stream'}):r.fulfill({status:404,body:''})});
 await p.goto('http://cast.test/');await p.waitForFunction(()=>window.__game&&P.m.skin&&CHOMPREX.asset,null,{polling:50});
 for(const f of ['heavyweight-local-adapter.js','skydrake-local-adapter14.js','skyblade-camera14.js'])await p.addScriptTag({path:path.join(__dirname,f)});
 await p.waitForFunction(()=>STORMBELLY.asset&&SKY14.asset,null,{polling:50});
 const report=await p.evaluate(()=>{
  loadChapter('adv');startGame(false);for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk()};clearEnemies();G.mode='play';G.cine=false;G.paused=false;G.time=0;
  const h=LV.islands.spires;P.x=h.x;P.z=h.z+7;P.y=0;P.face=Math.PI;P.onG=true;P.inv=0;P.lock=null;window.CAST=['chomprex','stormbelly','skydrake'].map((type,i)=>{const e=spawnEnemy(type,h.x+(i-1)*6,h.z);e.home=h;e.st='idle';e.cool=999;e.face=0;e.m.root.scale.setScalar(e.sc);return e});
  for(const e of CAST)updateEnemy(e,0);animDarren(0,0);
  window.castReviewCamera=()=>{camera.position.set(h.x-1,9,h.z+23);camera.lookAt(h.x,2.5,h.z+1);camera.fov=55;camera.updateProjectionMatrix()};castReviewCamera();
  return {flags:CAST.map(e=>({type:e.type,chomp:!!e.m.isChompRig,storm:!!e.m.isStormbellyRig,sky:!!e.m.isSky14,scale:e.sc,actions:Object.keys(e.m.actions)})),roster:Object.keys(EDEF).length,initialSave:JSON.stringify(localStorage),sharedRig:CAST[0].m.rig===CAST[1].m.rig};
 });
 const shots=[];for(const pose of ['idle','walk','stagger']){
  await p.evaluate(pose=>{for(const e of CAST){e.m.mixer.stopAllAction();const name=e.type==='stormbelly'&&pose==='walk'?'heavyWalk':pose;const a=e.m.actions[name];a.reset().play();e.m.mixer.update(a.getClip().duration*.4);}animDarren(0,0);castReviewCamera();renderer.render(scene,camera)},pose);
  const file=`${variant}-${pose}.png`;await p.locator('canvas').first().screenshot({path:path.join(out,file)});shots.push(file);
 }
 const runtime=await p.evaluate(()=>{
  const states={};for(const e of CAST){e.m.clip=null;e.st='chase';e.cool=0;states[e.type]=new Set();}P.inv=9999;
  for(let i=0;i<360;i++){G.time+=1/60;for(const e of CAST){updateEnemy(e,1);states[e.type].add(e.st);}updatePlayer(1);animDarren(1/60,1/60);P.lock=CAST[2];updateCamera(1/60);}
  const finite=CAST.every(e=>[e.x,e.y,e.z,...e.m.root.matrixWorld.elements].every(Number.isFinite));const independent=new Set(CAST.map(e=>e.m.mixer)).size===3;
  const saveAfter=JSON.stringify(localStorage);const loaded=CAST.every(e=>e.m.rig&&e.m.actions);const resources=[];for(let k=0;k<4;k++){clearEnemies();for(const type of ['chomprex','stormbelly','skydrake'])spawnEnemy(type,P.x+5,P.z-5);renderer.render(scene,camera);resources.push({...renderer.info.memory});}
  clearEnemies();return {states:Object.fromEntries(Object.entries(states).map(([k,v])=>[k,[...v]])),finite,independent,loaded,saveAfter,resources};
 });
 const checks={threeCorrectRigs:report.flags[0].chomp&&report.flags[1].storm&&report.flags[2].sky,rosterUnchanged:report.roster===16,independentMixers:runtime.independent,finite:runtime.finite,allLoaded:runtime.loaded,storageUnchanged:runtime.saveAfter===report.initialSave,noErrors:errors.length===0,resourceStable:runtime.resources.slice(1).every(x=>x.geometries===runtime.resources[0].geometries&&x.textures===runtime.resources[0].textures)};
 results.push({variant,scope:'Existing game scene and authored game scales. Idle/walk/stagger lineup uses an explicit inspection camera; six-second coexistence run uses actual enemy/player/camera updates. Four recreate cycles. Isolated profile; no production placement or saved state changes.',assets:Object.fromEntries([...Object.values(files),'dist/assets/chomprex.glb'].map(f=>[f,hash(f)])),adapters:Object.fromEntries(['heavyweight-local-adapter.js','skydrake-local-adapter14.js','skyblade-camera14.js'].map(f=>[f,hash('art/overhaul/scripts/'+f)])),report,runtime,shots,checks,errors});await ctx.close();
}
const result={results,passed:results.every(x=>Object.values(x.checks).every(Boolean))};fs.writeFileSync(path.join(out,'cast-review.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,results:results.map(x=>({variant:x.variant,checks:x.checks,states:x.runtime.states}))}));if(!result.passed)process.exitCode=1;
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
