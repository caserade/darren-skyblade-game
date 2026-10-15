const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../../..'),out=path.join(root,'art/overhaul/heavyweight/review');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await ctx.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0});
 await p.route('http://127.0.0.1:4318/**',r=>{
  const pathname=decodeURIComponent(new URL(r.request().url()).pathname),candidate=pathname==='/__heavyweight-candidate.glb';
  if(pathname==='/src/stormbelly-unused.js')return r.fulfill({body:'/* Baseline capture: inject production module after screenshot. */',contentType:'text/javascript'});
  const file=candidate?path.join(root,'art/overhaul/heavyweight/export/heavyweight-candidate.glb'):path.resolve(root,'dist','.'+(pathname==='/'?'/index.html':pathname));
  if(!candidate&&!file.startsWith(path.join(root,'dist')+path.sep))return r.fulfill({status:403,body:''});
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
  return fs.existsSync(file)?r.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'}):r.fulfill({status:404,body:''});
 });
 await p.goto('http://127.0.0.1:4318/');await p.waitForFunction(()=>window.__game&&P.m.skin,null,{polling:50});
 const baseline=await p.evaluate(()=>{
  loadChapter('ch3');startGame(false);for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk()};clearEnemies();
  const h=LV.islands.archive||Object.values(LV.islands)[0];window.__heavyweightHome=h;P.x=h.x;P.z=h.z+5;P.y=0;P.onG=true;P.inv=99999;G.cine=false;G.paused=false;G.mode='play';
  const e=spawnEnemy('stormbelly',h.x,h.z);e.st='idle';e.cool=999;e.m.root.scale.setScalar(e.sc);animateToonEnemy(e,0);e.face=0;e.m.root.rotation.y=0;window.__reviewEnemy=e;
  P.m.root.visible=false;camera.position.set(h.x+7,5,h.z+10);camera.lookAt(h.x,1.5,h.z);renderer.render(scene,camera);
  const dimensions=new T.Box3().setFromObject(e.m.b).getSize(new T.Vector3()).divideScalar(e.sc).toArray();
  return {renderInfo:{...renderer.info.render},modelDimensions:dimensions,definition:{hp:EDEF.stormbelly.hp,r:EDEF.stormbelly.r,h:EDEF.stormbelly.h,sc:EDEF.stormbelly.sc},data:JSON.stringify(DATA),saveKeys:Object.keys(localStorage)};
 });
 const capture=async name=>{const png=await p.evaluate(()=>{renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png').split(',')[1]});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png,'base64'))};
 await capture('game-before');await p.evaluate(()=>clearEnemies());
 await p.addScriptTag({path:path.join(root,'art/overhaul/scripts/heavyweight-local-adapter.js')});await p.waitForFunction(()=>STORMBELLY.asset&&CHOMPREX.asset,null,{polling:50});
 const report=await p.evaluate(baseline=>{
  const checks=[],check=(name,fn)=>{try{if(!fn())throw Error('Assertion failed');checks.push({name,pass:true})}catch(e){checks.push({name,pass:false,error:e.message})}};
  const home=__heavyweightHome;
  const reset=()=>{clearEnemies();P.x=home.x;P.z=home.z+2.9;P.y=0;P.inv=0;P.hp=TUNE.maxHp;P.onG=true;P.st='move';P.fly=false;G.mode='play';G.cine=false;G.paused=false;G.hitstop=0;};
  const make=()=>{reset();const e=spawnEnemy('stormbelly',home.x,home.z);e.st='chase';e.cool=0;e.face=0;e.home=home;e.m.root.scale.setScalar(e.sc);return e;};
  check('Stats, collisions, scaling and all content data unchanged',()=>JSON.stringify({hp:EDEF.stormbelly.hp,r:EDEF.stormbelly.r,h:EDEF.stormbelly.h,sc:EDEF.stormbelly.sc})===JSON.stringify(baseline.definition)&&JSON.stringify(DATA)===baseline.data);
  let e=make();e.m.root.updateMatrixWorld(true);let initialLow=Infinity;e.m.rig.traverse(o=>{if(!o.isSkinnedMesh)return;o.skeleton.update();const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i);o.boneTransform(i,v);v.applyMatrix4(o.matrixWorld);initialLow=Math.min(initialLow,v.y)}});check('Fresh instance is grounded before its first AI tick',()=>initialLow>=-.005&&initialLow<.06);
  const chomp=spawnEnemy('chomprex',home.x+5,home.z);chomp.st='wind';animateToonEnemy(chomp,.1);check('Stormbelly adapter preserves Chomp checkpoint05 rig and warning animation',()=>chomp.m.isChompRig&&chomp.m.clip==='chargeWindup'&&chomp.m.warning.visible);
  e=make();const second=spawnEnemy('stormbelly',home.x+5,home.z);const b1=e.m.rig.getObjectByName('jaw'),b2=second.m.rig.getObjectByName('jaw'),q=b2.quaternion.clone();e.m.actions.stompWindup.play();e.m.mixer.update(.15);
  check('Instances have independent animated skeletons',()=>b1!==b2&&b2.quaternion.equals(q)&&!b1.quaternion.equals(q));
  let mesh1,mesh2;e.m.rig.traverse(o=>{if(o.isSkinnedMesh)mesh1=o});second.m.rig.traverse(o=>{if(o.isSkinnedMesh)mesh2=o});
  check('Instances share immutable geometry, material and textures',()=>mesh1.geometry===mesh2.geometry&&mesh1.material===mesh2.material&&mesh1.material.map===mesh2.material.map);
  e=make();updateEnemy(e,1);check('Stomp begins with original ring and matching clip',()=>e.st==='wind'&&e.m.warning.visible&&e.m.clip==='stompWindup');
  const hp=P.hp;for(let i=0;i<65;i++)updateEnemy(e,1);check('Original 66-tick windup remains harmless',()=>e.st==='wind'&&P.hp===hp);updateEnemy(e,1);check('Impact starts after original warning and deals damage',()=>e.st==='atk'&&e.m.clip==='stompImpact'&&!e.m.warning.visible&&P.hp<hp);
  const hitHP=P.hp;for(let i=0;i<18;i++){P.inv=0;updateEnemy(e,1)}check('Stomp hits once and enters original recovery',()=>P.hp===hitHP&&e.st==='rec'&&e.m.clip==='stompRecovery');
  for(let i=0;i<80;i++)updateEnemy(e,1);check('Original 80-tick recovery returns to chase',()=>e.st==='chase');
  e=make();updateEnemy(e,1);P.y=1;for(let i=0;i<66;i++)updateEnemy(e,1);check('Jump still avoids stomp',()=>P.hp===TUNE.maxHp);
  e=make();updateEnemy(e,1);P.x=home.x+5;P.z=home.z+4;for(let i=0;i<66;i++)updateEnemy(e,1);check('Leaving ring still avoids stomp',()=>P.hp===TUNE.maxHp);
  e=make();updateEnemy(e,1);const before={t:e.t,mix:e.m.mixer.time,hp:P.hp};const render=renderer.render;renderer.render=()=>{};G.paused=true;for(let i=0;i<60;i++)tick(1/60);check('Pause freezes clip, combat timer and damage',()=>e.t===before.t&&e.m.mixer.time===before.mix&&P.hp===before.hp);G.paused=false;G.cine=true;for(let i=0;i<60;i++)tick(1/60);check('Dialogue freezes clip and timer',()=>e.t===before.t&&e.m.mixer.time===before.mix);G.cine=false;renderer.render=render;
  e=make();updateEnemy(e,1);enemyTakeHit(e,1,{hs:60},1,0);updateEnemy(e,1);check('Interrupt transitions to stagger and hides warning',()=>e.st==='stun'&&e.m.clip==='stagger'&&!e.m.warning.visible);
  e=make();updateEnemy(e,1);killEnemy(e);updateEnemy(e,1);check('Death starts its clip and removes warning',()=>e.m.clip==='death'&&!e.m.warning.visible);
  check('Death clip fits the original 16-tick removal window',()=>Math.abs(e.m.actions.death.getEffectiveTimeScale()-8.25)<1e-6);
  for(let i=0;i<7;i++)updateEnemy(e,1);
  check('Death reaches mid-collapse while the enemy is still visible',()=>!e.gone&&e.m.actions.death.time>1&&e.m.rig.getObjectByName('root').quaternion.angleTo(new T.Quaternion())>.5);
  for(let i=0;i<7;i++)updateEnemy(e,1);check('Death remains present through tick fifteen',()=>!e.gone&&!e.m.disposed);
  updateEnemy(e,1);check('Death cleans mixer and skeleton at original tick sixteen',()=>e.gone&&e.m.disposed);
  const cycles=[];for(let i=0;i<6;i++){e=make();updateEnemy(e,1);renderer.render(scene,camera);clearEnemies();renderer.render(scene,camera);cycles.push({...renderer.info.memory})}
  check('Repeated encounters retain stable GPU resource counts',()=>cycles.slice(2).every(c=>c.geometries===cycles[1].geometries&&c.textures===cycles[1].textures));
  e=make();e.st='idle';e.cool=999;P.inv=99999;P.m.root.visible=false;animateToonEnemy(e,0);e.m.root.rotation.y=0;window.__reviewEnemy=e;camera.position.set(home.x+7,5,home.z+10);camera.lookAt(home.x,1.5,home.z);renderer.render(scene,camera);
  e.m.root.updateMatrixWorld(true);const visualBox=new T.Box3();e.m.rig.traverse(o=>{if(!o.isSkinnedMesh)return;o.skeleton.update();const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++){const v=new T.Vector3().fromBufferAttribute(pos,i);o.boneTransform(i,v);visualBox.expandByPoint(v.applyMatrix4(o.matrixWorld));}});const visualHeight=visualBox.getSize(new T.Vector3()).y;check('Idle model height stays within five percent of previous model',()=>Math.abs(visualHeight/(baseline.modelDimensions[1]*e.sc)-1)<.05);
  return {visualHeight,checks,passed:checks.filter(c=>c.pass).length,total:checks.length,cycles,baselineRenderInfo:baseline.renderInfo,candidateRenderInfo:{...renderer.info.render},scope:'Fresh browser profile. Actual local game with local Stormbelly adapter and exported GLB. Live site unchanged.'};
 },baseline);
 await capture('game-after');
 for(const state of ['wind','atk','rec','stun']){await p.evaluate(state=>{const e=__reviewEnemy;e.st=state;e.wind=state==='wind';animateToonEnemy(e,.2);renderer.render(scene,camera)},state);await capture('game-'+state);}
 const deathFrames=[];
 await p.evaluate(()=>{const home=__heavyweightHome;clearEnemies();const e=spawnEnemy('stormbelly',home.x,home.z);e.st='idle';e.cool=999;e.face=0;e.m.root.scale.setScalar(e.sc);animateToonEnemy(e,0);window.__reviewEnemy=e;killEnemy(e)});
 for(let i=0;i<=16;i++){if(i)await p.evaluate(()=>updateEnemy(__reviewEnemy,1));if([0,4,8,12,15,16].includes(i)){await capture('game-death-tick-'+i);deathFrames.push(await p.evaluate(i=>({tick:i,gone:!!__reviewEnemy.gone,clipTime:__reviewEnemy.m.actions.death.time,scale:__reviewEnemy.m.root.scale.x}),i));}}
 report.deathFrames=deathFrames;
 await p.addScriptTag({path:path.join(root,'tests/runtime.js')});await p.waitForSelector('#qa-results',{state:'attached',timeout:60000});
 report.existingRuntimeQA=JSON.parse(await p.locator('#qa-results').textContent());
 fs.writeFileSync(path.join(out,'existing-runtime-qa.json'),JSON.stringify(report.existingRuntimeQA,null,2));
 report.assetSha256=require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'art/overhaul/heavyweight/export/heavyweight-candidate.glb'))).digest('hex');
 report.baselineModelDimensions=baseline.modelDimensions;report.errors=errors;fs.writeFileSync(path.join(out,'game-integration-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({baselineModelDimensions:baseline.modelDimensions,passed:report.passed,total:report.total,failed:report.checks.filter(c=>!c.pass),existingQA:{passed:report.existingRuntimeQA.passed,total:report.existingRuntimeQA.total,failed:report.existingRuntimeQA.results.filter(c=>!c.pass)},errors}));if(report.passed!==report.total||report.existingRuntimeQA.passed!==report.existingRuntimeQA.total||errors.length)process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
