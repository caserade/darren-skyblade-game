const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const ctx=await b.newContext({viewport:{width:1280,height:800}}),p=await ctx.newPage(),errors=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));await ctx.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0;});
 await p.goto('http://127.0.0.1:4318/');await p.waitForFunction(()=>window.__game&&P.m.skin&&SKYDRAKE.asset,null,{polling:50});
 await p.evaluate(()=>{
  loadChapter('adv');startGame(false);TALK.line=null;G.cine=false;clearEnemies();clearGems();
  for(const id in AD.dens){AD.dens[id].spawned=false;AD.dens[id].t=999999;}
  UNLOCKS.parts={feather:10,cloud:2,plate:4,coil:0};UNLOCKS.rewardSentinel='retained';
  UNLOCKS.contracts={active:['c_feathers'],prog:{c_feathers:3},done:{}};
  saveUnlocks();window.rewardDrake=spawnEnemy('skydrake',42,34);rewardDrake.home=LV.islands.spires;
  rewardDrake.st='chase';rewardDrake.m.root.scale.setScalar(1);P.inv=999999;G.paused=false;
 });
 const step=async n=>p.evaluate(n=>{const r=renderer.render;renderer.render=()=>{};try{for(let i=0;i<n;i++)tick(1/60);}finally{renderer.render=r;}},n);
 let strikes=0;const samples=[];
 for(;strikes<220&&await p.evaluate(()=>rewardDrake.alive);strikes++){
  await p.evaluate(()=>{const e=rewardDrake;P.x=e.x;P.z=e.z-2.1;P.y=Math.max(0,e.y);P.vx=P.vy=P.vz=0;P.face=0;P.fly=e.y>1;P.onG=!P.fly;P.st='move';P.inv=999999;P.lock=e;});
  await p.keyboard.press('KeyJ');await step(70);
  if(strikes%20===0)samples.push(await p.evaluate(()=>({hp:rewardDrake.hp,state:rewardDrake.st,playerState:P.st})));
 }
 checks.push({name:'Unmodified 2400 HP SkyDrake is defeated through actual J-key damage',pass:await p.evaluate(()=>!rewardDrake.alive&&rewardDrake.max===2400),strikes});
 await p.evaluate(()=>{P.fly=false;P.onG=true;P.x=rewardDrake.x;P.z=rewardDrake.z;P.y=0;P.st='move';P.lock=null;P.inv=999999;});
 await step(300);
 const before=await p.evaluate(()=>({parts:{...UNLOCKS.parts},contracts:JSON.parse(JSON.stringify(UNLOCKS.contracts)),sentinel:UNLOCKS.rewardSentinel,gems:G.gems.length,disposed:rewardDrake.m.disposed,keys:Object.keys(localStorage),saveKey:DATA.meta.unlockKey,finite:[P.x,P.y,P.z].every(Number.isFinite)}));
 checks.push({name:'All five reward gems are collected',pass:before.gems===0});
 checks.push({name:'Existing feather/cloud/plate drops have the exact expected counts',pass:before.parts.feather===13&&before.parts.cloud===4&&before.parts.plate===5});
 checks.push({name:'Existing Feather Harvest contract completes and gives its normal reward',pass:before.contracts.done.c_feathers===1&&!before.contracts.active.includes('c_feathers')&&before.parts.coil===2});
 checks.push({name:'Defeated rig is disposed and player remains finite',pass:before.disposed&&before.finite});
 await p.evaluate(()=>renderer.render(scene,camera));await p.screenshot({path:path.join(__dirname,'Skyblade-Hunt-reward-check.png')});
 await p.reload();await p.waitForFunction(()=>window.__game&&P.m.skin&&SKYDRAKE.asset,null,{polling:50});
 const after=await p.evaluate(()=>({parts:{...UNLOCKS.parts},contracts:JSON.parse(JSON.stringify(UNLOCKS.contracts)),sentinel:UNLOCKS.rewardSentinel,keys:Object.keys(localStorage),saveKey:DATA.meta.unlockKey}));
 checks.push({name:'Reward inventory survives a complete page reload',pass:JSON.stringify(before.parts)===JSON.stringify(after.parts)});
 checks.push({name:'Completed contract survives reload without duplicate rewards',pass:JSON.stringify(before.contracts)===JSON.stringify(after.contracts)&&after.parts.coil===2});
 checks.push({name:'Unrecognized legacy save field is preserved',pass:after.sentinel==='retained'});
 checks.push({name:'No SkyDrake-specific save key was created',pass:after.saveKey===before.saveKey&&!after.keys.some(k=>/skydrake/i.test(k))});
 const result={baseCommit:'76980ac58298cecd25c41eb3c1a2b43c13d57b40',testedSourceHashes:Object.fromEntries(['level.js','combat.js','skydrake.js'].map(n=>[n,require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../../dist/src',n))).digest('hex')])),passed:checks.filter(c=>c.pass).length,total:checks.length,checks,strikes,samples,before,after,errors,note:'Isolated deterministic browser profile. Actual J-key attacks; fixture positions track the enemy and player invulnerability is enabled. This verifies damage, rewards and save integration, not combat balance or a manual playthrough.'};
 fs.writeFileSync(path.join(__dirname,'Skyblade-Hunt-final-reward-check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(result.passed!==result.total||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
