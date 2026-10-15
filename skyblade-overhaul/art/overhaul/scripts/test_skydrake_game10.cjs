const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');const root=process.cwd(),variant=process.argv[2]||'candidate';
(async()=>{
 const out='art/overhaul/skydrake10/review/game-tests-10-'+variant;fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await ctx.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0;});await p.route('http://127.0.0.1:4318/**',r=>{const n=new URL(r.request().url()).pathname,f=n==='/__skydrake-candidate.glb'?path.join(root,'art/overhaul/skydrake10/export/skydrake-'+variant+'.glb'):path.join(root,'dist',n==='/'?'index.html':n.slice(1));const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary'};return fs.existsSync(f)?r.fulfill({body:fs.readFileSync(f),contentType:types[path.extname(f)]||'application/octet-stream'}):r.fulfill({status:404,body:''})});await p.goto('http://127.0.0.1:4318/');
 await p.waitForFunction(()=>window.__game&&P.m.skin&&SKYDRAKE.asset,null,{polling:50,timeout:30000});
 await p.addScriptTag({path:path.join(root,'art/overhaul/scripts/skydrake-local-adapter10.js')});await p.waitForFunction(()=>SKY10.asset,null,{polling:50});const result=await p.evaluate(()=>{const firstSkin=rig=>{let skin;rig.traverse(o=>{if(o.isSkinnedMesh&&!skin)skin=o;});return skin;};
  const checks=[],check=(name,fn)=>{try{const detail=fn();if(!detail)throw Error('Assertion failed');checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.stack});}};
  const skip=()=>{for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk();}};
  loadChapter('adv');startGame(false);skip();clearEnemies();const home=LV.islands.spires;
  const resetP=()=>{P.x=home.x;P.z=home.z+3;P.y=0;P.st='move';P.inv=0;P.hp=TUNE.maxHp;P.fly=false;P.onG=true;G.mode='play';G.paused=false;G.cine=false;};
  const make=()=>{clearEnemies();resetP();const e=spawnEnemy('skydrake',home.x,home.z);e.home=home;e.st='chase';e.cool=0;e.m.root.scale.setScalar(e.sc);return e;};
  check('Existing roster definitions remain unchanged',()=>Object.keys(EDEF).length===16&&['stormbelly','chomprex','tempest','titan'].every(k=>EDEF[k]));
  check('One Sky Drake is placed only in the existing Gale Spires den',()=>ADV().dens.spires.enemies.filter(x=>x[0]==='skydrake').length===1&&ADV().dens.spires.enemies.filter(x=>x[0]==='gust').reduce((n,x)=>n+x[1],0)===5&&!DATA.chapters.some(ch=>ch.zones.some(z=>z.enemies.some(x=>x[0]==='skydrake'))));
  check('Sky Drake drops only existing resources',()=>DATA.drops.skydrake.every(([id])=>!!DATA.parts[id]));
  let e=make();check('Candidate retains 14 clips and 39 bones',()=>Object.keys(e.m.actions).length===14&&(()=>{let n=0;e.m.rig.traverse(o=>{if(o.isSkinnedMesh)n++;});return n>0&&firstSkin(e.m.rig).skeleton.bones.length===39;})());
  const second=spawnEnemy('skydrake',home.x+5,home.z);const firstBone=e.m.rig.getObjectByName('head'),otherBone=second.m.rig.getObjectByName('head');
  const q=otherBone.quaternion.clone();e.m.actions.attackWindup.play();e.m.mixer.update(.45);
  check('Multiple instances animate independent skeletons',()=>firstBone!==otherBone&&otherBone.quaternion.equals(q)&&!firstBone.quaternion.equals(q));
  check('Instances share cached geometry and materials',()=>firstSkin(e.m.rig).geometry===firstSkin(second.m.rig).geometry&&firstSkin(e.m.rig).material===firstSkin(second.m.rig).material);
  const clipBounds=[];
  for(const clip of SKYDRAKE.asset.animations){
   e.m.mixer.stopAllAction();const action=e.m.actions[clip.name];action.reset().play();let finite=true;const box=new T.Box3();
   for(const t of [0,.25,.5,.75,.999]){action.time=clip.duration*t;e.m.mixer.update(0);e.m.rig.updateMatrixWorld(true);e.m.rig.traverse(o=>{if(![...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()].every(Number.isFinite))finite=false;if(o.isSkinnedMesh){o.skeleton.update();for(let i=0;i<o.geometry.attributes.position.count;i+=43){const v=new T.Vector3().fromBufferAttribute(o.geometry.attributes.position,i);const sw=o.geometry.attributes.skinWeight,si=o.geometry.attributes.skinIndex,base=v.clone().applyMatrix4(o.bindMatrix),sum=new T.Vector3();for(let k=0;k<4;k++){let w=sw.array[i*4+k];if(sw.normalized)w/=sw.array.BYTES_PER_ELEMENT===1?255:65535;if(w){const j=si.array[i*4+k],m=new T.Matrix4().multiplyMatrices(o.skeleton.bones[j].matrixWorld,o.skeleton.boneInverses[j]);sum.addScaledVector(base.clone().applyMatrix4(m),w);}}v.copy(sum).applyMatrix4(o.bindMatrixInverse);if(!v.toArray().every(Number.isFinite))finite=false;box.expandByPoint(v);}}});}
   clipBounds.push({name:clip.name,min:box.min.toArray(),max:box.max.toArray()});check('Finite skinned deformation through '+clip.name,()=>finite&&box.getSize(new T.Vector3()).length()<30);
  }
  e=make();updateEnemy(e,1);check('Ground tail attack starts with a visible warning',()=>e.st==='wind'&&e.skyAttack==='tail'&&e.m.warning.visible);
  const hp=P.hp;for(let i=0;i<41;i++)updateEnemy(e,1);check('Tail warning lasts 0.7 seconds without early damage',()=>P.hp===hp&&e.st==='wind');updateEnemy(e,1);
  for(let i=0;i<11;i++)updateEnemy(e,1);check('Tail damage waits for its animation hit marker',()=>P.hp===hp);updateEnemy(e,1);const hitHP=P.hp;
  check('Tail sweep damages a grounded target at impact',()=>hitHP<hp);for(let i=0;i<25;i++){P.inv=0;updateEnemy(e,1);}check('Tail sweep hits at most once and enters recovery',()=>P.hp===hitHP&&e.st==='rec');
  e=make();e.st='atk';e.skyAttack='tail';P.y=2.1;for(let i=0;i<30;i++)updateEnemy(e,1);check('Jumping above the tail sweep avoids damage',()=>P.hp===TUNE.maxHp);
  e=make();e.skyGround=420;updateEnemy(e,1);check('Ground cycle starts takeoff',()=>e.st==='takeoff');for(let i=0;i<60;i++)updateEnemy(e,1);check('Takeoff reaches flight height and begins circling',()=>e.st==='circle'&&Math.abs(e.y-6.5)<.01);
  P.inv=9999;for(let i=0;i<300;i++){G.time+=1/60;updateEnemy(e,1);}check('Circling waits five seconds before its swoop warning',()=>e.st==='wind'&&e.skyAttack==='swoop'&&e.m.warning.visible);
  const target={...e.skyTarget};e.m.root.updateMatrixWorld(true);const mark=e.m.warning.getWorldPosition(new T.Vector3());check('Swoop marker matches the locked landing target on the ground',()=>Math.hypot(mark.x-target.x,mark.z-target.z)<.01&&Math.abs(mark.y-.06)<.01);
  P.x=home.x-7;P.z=home.z-7;for(let i=0;i<54;i++)updateEnemy(e,1);check('Swoop warning lasts 0.9 seconds and does not track a dodging player',()=>e.st==='atk'&&e.skyTarget.x===target.x&&e.skyTarget.z===target.z);
  const safeHP=P.hp;for(let i=0;i<36;i++)updateEnemy(e,1);check('Swoop reaches its marked target and misses a player outside it',()=>e.st==='land'&&P.hp===safeHP&&Math.hypot(e.x-target.x,e.z-target.z)<.01&&e.y===0);
  for(let i=0;i<90;i++)updateEnemy(e,1);check('Landing and recovery return to ground combat',()=>e.st==='chase'&&e.y===0);
  e=make();e.st='atk';e.skyAttack='swoop';e.skyFrom={x:home.x-4,y:6.5,z:home.z};e.skyTarget={x:P.x,z:P.z};for(let i=0;i<36;i++)updateEnemy(e,1);check('Swoop damages a grounded player at its landing circle',()=>P.hp<TUNE.maxHp&&e.hitP);const swoopHP=P.hp;for(let i=0;i<50;i++){P.inv=0;updateEnemy(e,1);}check('Landing never repeats the swoop hit',()=>P.hp===swoopHP);
  e=make();e.st='circle';e.skyOrbit=0;e.y=6.5;P.x=home.x+40;updateEnemy(e,1);for(let i=0;i<36;i++)updateEnemy(e,1);check('Leaving the island cancels circling into a safe landing',()=>e.st==='rec'&&e.y===0);
  e=make();e.st='wind';e.skyAttack='swoop';e.skyTarget={x:P.x,z:P.z};e.wind=true;e.y=6.5;updateEnemy(e,1);enemyTakeHit(e,1,{hs:6},1,0);updateEnemy(e,1);check('Heavy stagger cancels the swoop telegraph and begins descent',()=>e.st==='stun'&&!e.wind&&!e.m.warning.visible&&e.y<6.5);
  const transitions=[];
  for(const scenario of ['land-stagger','land-tail','walk-tail','takeoff-stagger']){
   e=make();e.cool=999;e.st=scenario.startsWith('land')?'land':scenario.startsWith('takeoff')?'takeoff':'chase';e.skyStartY=0;e.t=12;e.skyMoving=true;P.z=e.z+10;animateSkyDrake(e,.2);let low=Infinity,finite=true,maximumCorrection=0;
   for(let frame=0;frame<90;frame++){
    if(frame===5){if(scenario.endsWith('stagger'))enemyTakeHit(e,1,{hs:60},1,0);else{P.x=e.x;P.z=e.z+3;e.st='wind';e.t=0;e.skyAttack='tail';e.wind=true;}}
    updateEnemy(e,1);e.m.root.updateMatrixWorld(true);maximumCorrection=Math.max(maximumCorrection,e.m.rig.position.y);
    if(e.y<=.001){for(const sk of e.m.floorSkins)sk.update();const v=new T.Vector3();for(const [m,i] of e.m.floorPoints){v.fromBufferAttribute(m.geometry.attributes.position,i);m.boneTransform(i,v);v.applyMatrix4(m.matrixWorld);low=Math.min(low,v.y);finite=finite&&v.toArray().every(Number.isFinite);}}
   }
   transitions.push({scenario,minimumGroundedFootY:low,maximumCorrection});check('Interrupted '+scenario+' keeps grounded feet clear',()=>finite&&low>=-.005&&maximumCorrection<.4);check('Interrupted '+scenario+' keeps the candidate transform finite',()=>e.m.b.rotation.toArray().slice(0,3).every(v=>v===0)&&e.m.b.scale.equals(new T.Vector3(1,1,1)));
  }
  e=make();updateEnemy(e,1);const before={t:e.t,mix:e.m.mixer.time,hp:P.hp};G.paused=true;const render=renderer.render;renderer.render=()=>{};for(let i=0;i<60;i++)tick(1/60);renderer.render=render;
  check('Pause freezes attack timer, animation and damage',()=>e.t===before.t&&e.m.mixer.time===before.mix&&P.hp===before.hp);G.paused=false;G.cine=true;renderer.render=()=>{};for(let i=0;i<60;i++)tick(1/60);renderer.render=render;check('Dialogue freezes the Sky Drake encounter',()=>e.t===before.t&&P.hp===before.hp);G.cine=false;
  e=make();updateEnemy(e,1);killEnemy(e);check('Defeat immediately hides the attack warning',()=>!e.m.warning.visible&&!e.alive);updateEnemy(e,1);check('Candidate death action starts in the original removal window',()=>e.m.clip==='death'&&Math.abs(e.m.actions.death.getEffectiveTimeScale()-8.25)<1e-6);for(let k=0;k<7;k++)updateEnemy(e,1);check('Candidate death action advances before removal',()=>!e.gone&&e.m.actions.death.time>1);updateEnemy(e,12);check('Defeat cleans the cloned animation and skeleton resources',()=>e.gone&&e.m.disposed);
  const cycles=[];for(let cycle=0;cycle<6;cycle++){e=make();updateEnemy(e,1);camera.position.set(home.x+8,8,home.z+10);camera.lookAt(home.x,3,home.z);renderer.render(scene,camera);clearEnemies();renderer.render(scene,camera);cycles.push({...renderer.info.memory});}
  check('Repeated encounters leave a stable geometry and texture count',()=>cycles.slice(1).every(c=>c.geometries===cycles[1].geometries&&c.textures===cycles[1].textures));
  resetP();AD.dens.spires={list:[],t:0,spawned:false};spawnDen('spires');check('Gale Spires naturally spawns exactly one Sky Drake and five Gustlings',()=>AD.dens.spires.list.length===6&&AD.dens.spires.list.filter(e=>e.type==='skydrake').length===1);
  for(const enemy of AD.dens.spires.list)killEnemy(enemy);advUpdate(1,1/60);check('Existing den respawn waits after the whole encounter is defeated',()=>!AD.dens.spires.spawned&&AD.dens.spires.t>0);AD.dens.spires.t=0;advUpdate(1,1/60);check('Existing respawn brings back exactly one Sky Drake',()=>AD.dens.spires.spawned&&AD.dens.spires.list.filter(e=>e.type==='skydrake').length===1);
  clearEnemies();loadChapter('ch3');startGame(false);skip();check('Returning to Story keeps Sky Drake out of the chapter roster',()=>G.enemies.every(e=>e.type!=='skydrake')&&CH.id==='ch3');
  return {passed:checks.filter(c=>c.pass).length,total:checks.length,checks,clipBounds,cycles,transitions};
 });
 result.assetSha256=require('crypto').createHash('sha256').update(fs.readFileSync('art/overhaul/skydrake10/export/skydrake-'+variant+'.glb')).digest('hex');result.adapterSha256=require('crypto').createHash('sha256').update(fs.readFileSync('art/overhaul/scripts/skydrake-local-adapter10.js')).digest('hex');result.errors=errors;fs.writeFileSync(out+'/report.json',JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,total:result.total,failed:result.checks.filter(c=>!c.pass),errors,cycles:result.cycles}));if(result.passed!==result.total||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
