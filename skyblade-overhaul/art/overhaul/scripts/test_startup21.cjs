const fs=require('fs'),path=require('path'),crypto=require('crypto'),{chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../../..'),dist=path.join(root,'art/overhaul/final-local-candidate21/release/dist'),out=path.join(root,'art/overhaul/hud21/review/startup');
fs.mkdirSync(out,{recursive:true});
const cases=['fresh','restore-ch1','restore-ch2','restore-ch3','restore-adv','critical-delay','critical-abort','critical-empty','critical-throw','critical-timeout','interrupted-navigation','delayed-models','bootstrap-abort','menu-abort'];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];try{
for(const mobile of [false,true])for(const scenario of cases.filter(s=>!process.argv[2]||s===process.argv[2])){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),checks=[],errors=[],network=[],held=[],routeErrors=[];
 const check=(name,pass,detail)=>checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});let recover=false;const liveFrames=scenario==='menu-abort',chapter=scenario.startsWith('restore-')?scenario.slice(8):scenario==='fresh'?'ch1':'ch3';
 const saved=JSON.stringify({cp:1,cleared:[],taken:[],t:125}),saveKey='darrenSkyblade.'+chapter;let before,after,failure;
 page.on('pageerror',e=>errors.push(e.stack));page.on('requestfailed',r=>network.push({event:'failed',url:r.url(),reason:r.failure()}));page.on('response',r=>{if(r.url().startsWith('http://rc16.test/'))network.push({event:'response',file:new URL(r.url()).pathname,status:r.status()})});
 try{
 await page.addInitScript(({chapter,saved,saveKey,fresh,liveFrames})=>{
  if(location.origin!=='http://rc16.test')return;
  if(!liveFrames){window.__manual=true;window.requestAnimationFrame=()=>0}
  if(!localStorage.getItem('qa.startup16.sentinel')){localStorage.setItem('qa.startup16.sentinel','preserve');if(!fresh){localStorage.setItem('darrenSkyblade.unlocks',JSON.stringify({lastChapter:chapter}));localStorage.setItem(saveKey,saved)}}
  window.__tickCalls16=0;
  if(liveFrames){const hook=()=>{if(typeof tick==='function'){const original=tick;tick=function(...args){__tickCalls16++;return original(...args)}}else setTimeout(hook,10)};hook()}
 },{chapter,saved,saveKey,fresh:scenario==='fresh',liveFrames});
 if(scenario==='critical-timeout')await page.clock.install();
 await page.route('http://rc16.test/**',async route=>{
  const name=new URL(route.request().url()).pathname,file=path.join(dist,name==='/'?'index.html':name.slice(1));
  try{
   if(!recover){
    if(name==='/data/chapter2.js'){
     if(['critical-delay','critical-timeout','interrupted-navigation'].includes(scenario))await new Promise(ok=>held.push(ok));
     if(scenario==='critical-abort')return await route.abort('failed');
     if(scenario==='critical-empty')return await route.fulfill({body:'/* empty200 fixture */',contentType:'text/javascript'});
     if(scenario==='critical-throw')return await route.fulfill({body:'throw new Error("Injected chapter2 execution failure")',contentType:'text/javascript'});
    }
    if(scenario==='bootstrap-abort'&&name==='/src/boot16.js')return await route.abort('failed');
    if(scenario==='menu-abort'&&name==='/src/menu.js')return await route.abort('failed');
    if(scenario==='delayed-models'&&['/assets/chomprex.glb','/assets/stormbelly-rc15.glb','/assets/skydrake-rc15.glb'].includes(name))await new Promise(ok=>held.push(ok));
   }
   if(!fs.existsSync(file))return await route.fulfill({status:404,body:''});
   await route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});
  }catch(e){routeErrors.push({file:name,message:e.message})}
 });
 const release=()=>{recover=true;for(const resume of held.splice(0))resume()};
 await page.goto('http://rc16.test/',{waitUntil:'domcontentloaded'});
 if(['critical-delay','critical-timeout','interrupted-navigation'].includes(scenario)){
  await page.waitForFunction(()=>window.__skybladeBoot?.loaded.includes('data/game_data.js'),null,{polling:50});
  before=await page.evaluate(({saveKey,saved})=>({chapters:DARREN_DATA.chapters.map(c=>c.id),game:!!window.__game,inert:document.getElementById('game').inert,save:localStorage.getItem(saveKey),expected:saved,status:__skybladeBoot.status}),{saveKey,saved});
  check('Pending chapter script cannot start a partial game',!before.game&&before.inert&&before.status==='loading');check('Pending startup preserves saved bytes',before.save===saved);
  await page.keyboard.press('Enter');check('Keyboard cannot enter while startup is pending',await page.evaluate(()=>!window.__game));
  if(scenario==='critical-delay')release();
  if(scenario==='critical-timeout')await page.clock.fastForward(20050);
  if(scenario==='interrupted-navigation'){await page.goto('about:blank');release();await page.goto('http://rc16.test/',{waitUntil:'domcontentloaded'});check('Interrupted document is replaced',await page.evaluate(()=>location.hostname==='rc16.test'))}
 }
 if(['critical-abort','critical-empty','critical-throw','critical-timeout','bootstrap-abort','menu-abort'].includes(scenario)){
  await page.waitForFunction(()=>document.getElementById('startup16')?.dataset.state==='error',null,{polling:50});
  failure=await page.evaluate(({saveKey})=>({boot:window.__skybladeBoot||null,game:!!window.__game,inert:document.getElementById('game').inert,save:localStorage.getItem(saveKey),sentinel:localStorage.getItem('qa.startup16.sentinel'),retry:!document.getElementById('startupRetry16').hidden,ticks:__tickCalls16}),{saveKey});
  check('Failure keeps game blocked and Retry visible',failure.inert&&failure.retry);check('Failure preserves stored checkpoint and unrelated key',failure.save===saved&&failure.sentinel==='preserve');
  if(scenario.startsWith('critical-'))check('Failure stops before dependent game modules',!failure.game&&failure.boot.failed.file==='data/chapter2.js');
  if(liveFrames){await page.waitForTimeout(200);check('Frame loop does not simulate a partially initialized game',await page.evaluate(()=>__tickCalls16===0))}
  if(['critical-abort','menu-abort','bootstrap-abort'].includes(scenario))await page.screenshot({path:path.join(out,scenario+'-'+(mobile?'mobile':'desktop')+'.png')});
  release();
  // Exercise keyboard activation as well as pointer activation of the real Retry button.
  if(mobile)await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.locator('#startupRetry16').click()]);
  else{await page.locator('#startupRetry16').focus();await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.keyboard.press('Enter')])}
 }
 await page.waitForFunction(()=>window.__skybladeBoot?.status==='ready'&&window.__game&&P.m.skin,null,{polling:50,timeout:30000});
 after=await page.evaluate(({saveKey})=>({chapter:CH.id,chapters:DATA.chapters.map(c=>c.id),pillars:LV.colliders.filter(c=>c.r===.57).length,loaded:__skybladeBoot.loaded,inert:document.getElementById('game').inert,overlayHidden:document.getElementById('startup16').hidden,save:localStorage.getItem(saveKey),sentinel:localStorage.getItem('qa.startup16.sentinel'),mode:G.mode}),{saveKey});
 check('All required chapters initialized once',after.chapters.join(',')==='ch1,ch2,ch3');check('Selected chapter restored correctly',after.chapter===chapter);check('All31 scripts finish once in order',after.loaded.length===31&&new Set(after.loaded).size===31);check('Ready screen unblocks title',!after.inert&&after.overlayHidden&&after.mode==='title');check('Unrelated storage preserved',after.sentinel==='preserve');
 if(scenario!=='fresh')check('Startup and retry do not overwrite saved bytes',after.save===saved);
 if(chapter==='ch3')check('Chapter3 contains its actual14 pillar colliders',after.pillars===14);
 if(liveFrames)await page.waitForFunction(()=>__tickCalls16>0,null,{polling:50});
 if(scenario==='delayed-models'){
  const pending=await page.evaluate(()=>!CHOMPREX.asset&&!STORMBELLY.asset&&!SKY15.asset);check('Creature downloads do not block complete chapter startup',pending);
  await page.locator('#contBtn').click();check('Continue works before creature downloads finish',await page.evaluate(()=>CH.id==='ch3'&&LV.cp===1));
  await page.evaluate(()=>{for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk()}togglePause()});await page.locator('#quitBtn').click();await page.locator('#chapPick button').nth(1).click();
  const prior=await page.evaluate(()=>({chapter:CH.id,count:G.enemies.length,storage:JSON.stringify(localStorage)}));release();await page.waitForFunction(()=>CHOMPREX.asset&&STORMBELLY.asset&&SKY15.asset,null,{polling:50});
  check('Late models cannot revert navigation or spawn a stale encounter',await page.evaluate(prior=>CH.id===prior.chapter&&CH.id==='ch2'&&G.mode==='title'&&G.enemies.length===prior.count&&JSON.stringify(localStorage)===prior.storage,prior));
 }else if(chapter!=='adv'){
  await page.locator(scenario==='fresh'?'#startBtn':'#contBtn').click();const continued=await page.evaluate(()=>({chapter:CH.id,cp:LV.cp,time:G.stats.t,mode:G.mode}));check('Actual title button enters correct chapter and checkpoint',continued.chapter===chapter&&continued.mode==='play'&&continued.cp===(scenario==='fresh'?0:1));if(!liveFrames&&scenario!=='fresh')check('Continue restores elapsed time',continued.time===125);
 }else{await page.locator('#startBtn').click();check('Restored Adventure selection enters Cloud Utopia',await page.evaluate(()=>CH.id==='adv'&&G.mode==='play'))}
 check('No unexpected execution errors',errors.every(e=>scenario==='critical-throw'&&e.includes('Injected chapter2 execution failure')));
 }catch(error){check('Scenario completes without harness exception',false,error.stack)}finally{recover=true;for(const resume of held.splice(0))resume();await context.close()}
 const row={scenario,mobile,checks,before,after,failure,errors,network,routeErrors,passed:checks.every(c=>c.pass)};results.push(row);console.log(JSON.stringify({scenario,mobile,passed:row.passed,checks:checks.length,failed:checks.filter(c=>!c.pass)}));fs.writeFileSync(path.join(out,'startup-'+scenario+'-'+(mobile?'mobile':'desktop')+'.json'),JSON.stringify(row,null,2));
}
const report={scope:'Actual Candidate21 package in fresh isolated desktop/mobile-sized Chromium profiles. Restored Story1-3 saves and Adventure selection; controlled script failures/empty200/runtime error/timeout; script and model delays; keyboard/pointer Retry; interrupted document navigation; real frame-loop gate check. Preloaded resources remain parallel while execution order and chapter data are validated. No physical-device claim.',manifestSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,'../manifest.json'))).digest('hex'),results,passed:results.every(r=>r.passed)};fs.writeFileSync(path.join(out,process.argv[2]?'startup-focused-'+process.argv[2]+'.json':'startup-matrix-21.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,runs:results.length,checks:results.reduce((s,r)=>s+r.checks.length,0)}));if(!report.passed)process.exitCode=1;
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

