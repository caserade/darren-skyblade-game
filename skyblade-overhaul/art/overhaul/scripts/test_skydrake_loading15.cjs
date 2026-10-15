const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../../..'),out=path.join(root,'art/overhaul/skydrake15/review');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),results=[];
 try{for(const scenario of ['delayed','http-failure','corrupt','incomplete-rig','timeout']){
  const ctx=await browser.newContext(),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await ctx.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0;});
  if(scenario==='timeout')await p.clock.install();
  let mode=scenario,requests=0,release;
  await p.route('http://127.0.0.1:4318/**',async r=>{
   const pathname=decodeURIComponent(new URL(r.request().url()).pathname);
   if(pathname==='/__skydrake-candidate.glb'){
    requests++;
    if(mode==='delayed'||mode==='timeout')await new Promise(ok=>release=ok);
    if(mode==='http-failure')return r.fulfill({status:503,body:'Temporarily unavailable'});
    if(mode==='corrupt')return r.fulfill({body:Buffer.from('broken asset'),contentType:'model/gltf-binary'});
    if(mode==='incomplete-rig')return r.fulfill({body:JSON.stringify({asset:{version:'2.0'},scene:0,scenes:[{nodes:[]}]}),contentType:'model/gltf+json'});
   }
   if(pathname==='/__skydrake-candidate.glb')return r.fulfill({body:fs.readFileSync(path.join(root,'art/overhaul/skydrake15/export/skydrake-candidate.glb')),contentType:'model/gltf-binary'});
   if(pathname==='/__skydrake-adapter.js')return r.fulfill({body:fs.readFileSync(path.join(root,'art/overhaul/scripts/skydrake-local-adapter15.js')),contentType:'text/javascript'});
   const file=path.resolve(root,'dist','.'+(pathname==='/'?'/index.html':pathname));
   if(!file.startsWith(path.join(root,'dist')+path.sep))return r.fulfill({status:403,body:''});
   const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.glb':'model/gltf-binary'}[path.extname(file)]||'application/octet-stream';
   if(pathname==='/')return r.fulfill({body:fs.readFileSync(file,'utf8').replace('</body>','<script src="/__skydrake-adapter.js"></script></body>'),contentType:'text/html'});
   return fs.existsSync(file)?r.fulfill({body:fs.readFileSync(file),contentType:type}):r.fulfill({status:404,body:''});
  });
  await p.goto('http://127.0.0.1:4318/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__game&&P.m.skin&&SKYDRAKE.asset,null,{polling:50});
  if(scenario==='timeout')await p.clock.fastForward(20001);
  if(scenario!=='delayed')await p.waitForFunction(()=>SKY15.error,null,{polling:50});
  const before=await p.evaluate(()=>{
   clearTimeout(SKY15.timer);window.__checks=[];window.__check=(name,value)=>__checks.push({name,pass:!!value});
   loadChapter('ch3');const sv={cp:1,cleared:[CH.zones[0].id],taken:[],t:123};localStorage.setItem(CH.saveKey,JSON.stringify(sv));localStorage.setItem('qa.unrelated-sentinel','unchanged');
   window.__savedKey=CH.saveKey;startGame(true);for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk();}
   __check('Continue restores existing checkpoint while model unavailable',LV.cp===1&&loadSave().t===123);
   clearEnemies();const h=LV.islands.archive||Object.values(LV.islands)[0];const e=spawnEnemy('skydrake',h.x,h.z);window.__fallback=e;
   __check('Unavailable model builds original visible encounter',!e.m.isSky15&&e.m.root.children.length>0);
   e.st='wind';e.wind=true;e.skyAttack='tail';animateSkyDrake(e,0);__check('Fallback retains advance attack warning',e.m.warning.visible);
   for(let i=0;i<10;i++)loadSky15();
   window.__savedRaw=localStorage.getItem(__savedKey);clearEnemies();loadChapter('ch1');startGame(true);
   for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk();}
   return {count:G.enemies.length,attempts:SKY15.attempts};
  });
  const initialRequests=requests;mode='success';if(release)release();if(scenario!=='delayed')await p.evaluate(()=>{SKY15.retryAt=0;loadSky15();});
  await p.waitForFunction(()=>SKY15.asset,null,{polling:50,timeout:15000});
  await p.evaluate(before=>{
   __check('Repeated calls do not duplicate pending/cooldown requests',before.attempts===1);
   __check('Late completion does not respawn a cleared encounter',G.enemies.length===before.count&&G.enemies.every(e=>e.type!=='skydrake'));
   __check('Asset completion preserves saved bytes and unrelated storage',localStorage.getItem(__savedKey)===__savedRaw&&localStorage.getItem('qa.unrelated-sentinel')==='unchanged');
   __check('Fallback instance is never mutated after async completion',!__fallback.m.isSky15);
   loadChapter('ch3');startGame(true);for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk();}
   __check('Continue after interrupted chapter change restores checkpoint',LV.cp===1&&loadSave().t===123);
   const h=LV.islands.archive;clearEnemies();const e=spawnEnemy('skydrake',h.x,h.z);
   __check('New encounter uses recovered candidate mesh',e.m.isSky15&&e.m.actions.attackWindup&&SKY15.error===null);
   clearEnemies();const cp=loadSave().cp;startGame(false);__check('New game retains existing recovery backup semantics',localStorage.getItem(__savedKey+'.recovery')!==null&&JSON.parse(localStorage.getItem(__savedKey+'.recovery')).cp===cp);
   localStorage.setItem(__savedKey,__savedRaw);startGame(true);__check('Repeat continue remains available',LV.cp===1);
  },before);
  const checks=await p.evaluate(()=>__checks);checks.push({name:'One initial request despite repeated calls',pass:initialRequests===1},{name:'No JavaScript page errors',pass:errors.length===0});
  // Browser reload uses the same isolated profile and retained save; no game saves from the user are accessed.
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__game&&SKY15.asset&&P.m.skin,null,{polling:50});
  checks.push({name:'Browser reload and continue preserve checkpoint',pass:await p.evaluate(()=>{loadChapter('ch3');startGame(true);return LV.cp===1&&loadSave().t===123&&localStorage.getItem('qa.unrelated-sentinel')==='unchanged';})});
  results.push({scenario,requests,checks,errors});await ctx.close();
 }
 const assetSha256=require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'art/overhaul/skydrake15/export/skydrake-candidate.glb'))).digest('hex');
 fs.writeFileSync(path.join(out,'candidate-loading-report.json'),JSON.stringify({assetSha256,scope:'Isolated Chromium contexts; real local dist scripts and assets fulfilled from disk. No live save access.',results},null,2));
 const all=results.flatMap(r=>r.checks);console.log(JSON.stringify({passed:all.filter(c=>c.pass).length,total:all.length,failed:results.flatMap(r=>r.checks.filter(c=>!c.pass).map(c=>({scenario:r.scenario,...c})))}));if(all.some(c=>!c.pass))process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
