const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await b.newContext({viewport:{width:1280,height:800}}),p=await ctx.newPage(),errors=[],checks=[],route=[];p.on('pageerror',e=>errors.push(e.message));
 await ctx.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0;});await p.goto('http://127.0.0.1:4318/');await p.waitForFunction(()=>window.__game&&P.m.skin&&SKYDRAKE.asset,null,{polling:50});
 const step=async n=>p.evaluate(n=>{const r=renderer.render;renderer.render=()=>{};try{for(let i=0;i<n;i++)tick(1/60);}finally{renderer.render=r;}},n);
 await p.locator('[data-mode="adventure"]').click();await p.locator('#startBtn').click();await step(1);
 for(let i=0;i<100&&await p.evaluate(()=>!!TALK.line);i++){await p.keyboard.press('Space');await step(1);}
 checks.push({name:'Fresh profile starts Adventure through the visible menu',pass:await p.evaluate(()=>CH.id==='adv'&&G.mode==='play'&&!G.cine)});
 await p.keyboard.press('KeyV');await step(2);await p.keyboard.down('Space');await step(30);await p.keyboard.up('Space');
 let held=new Set(),arrived=false,totalFrames=33;
 const dirs=[['KeyW',0,-1],['KeyS',0,1],['KeyA',-1,0],['KeyD',1,0],['KeyW,KeyA',-Math.SQRT1_2,-Math.SQRT1_2],['KeyW,KeyD',Math.SQRT1_2,-Math.SQRT1_2],['KeyS,KeyA',-Math.SQRT1_2,Math.SQRT1_2],['KeyS,KeyD',Math.SQRT1_2,Math.SQRT1_2]];
 for(let i=0;i<100;i++){
  const s=await p.evaluate(()=>({x:P.x,z:P.z,y:P.y,fe:P.fe,hp:P.hp,fly:P.fly,mode:G.mode,yaw:cam.yaw}));
  route.push(s);const dx=42-s.x,dz=34-s.z;if(Math.hypot(dx,dz)<7.5){arrived=true;break;}
  if(s.hp<=0||s.mode!=='play')break;
  const sy=Math.sin(s.yaw),cy=Math.cos(s.yaw);let best=dirs[0],score=-Infinity;
  for(const d of dirs){const wx=sy*-d[2]-cy*d[1],wz=cy*-d[2]+sy*d[1],v=dx*wx+dz*wz;if(v>score){score=v;best=d;}}
  const next=new Set(best[0].split(','));if(s.y<4)next.add('Space');
  for(const key of held)if(!next.has(key))await p.keyboard.up(key);for(const key of next)if(!held.has(key))await p.keyboard.down(key);held=next;
  await step(12);totalFrames+=12;
 }
 for(const k of held)await p.keyboard.up(k);
 checks.push({name:'Default flight reaches Gale Spires without teleporting or changing stats',pass:arrived});
 await p.keyboard.press('KeyV');await step(120);totalFrames+=120;
 const state=await p.evaluate(()=>{renderer.render(scene,camera);return {x:P.x,z:P.z,y:P.y,hp:P.hp,onGround:P.onG,mode:G.mode,drakes:G.enemies.filter(e=>e.type==='skydrake'&&e.alive).map(e=>({x:e.x,y:e.y,z:e.z,state:e.st})),den:AD.dens.spires.list.map(e=>e.type),way:UNLOCKS.way.slice(),camera:camera.position.toArray()};});
 checks.push({name:'Natural Gale Spires encounter contains exactly one live SkyDrake',pass:state.drakes.length===1&&state.den.filter(t=>t==='skydrake').length===1});
 checks.push({name:'Existing five Gustlings remain in the natural den',pass:state.den.filter(t=>t==='gust').length===5});
 checks.push({name:'Darren arrives alive with finite position and camera',pass:state.hp>0&&[state.x,state.y,state.z,...state.camera].every(Number.isFinite)});
 await p.screenshot({path:path.join(__dirname,'Skyblade-Hunt-natural-arrival.png')});
 const result={baseCommit:'76980ac58298cecd25c41eb3c1a2b43c13d57b40',testedSourceHashes:Object.fromEntries(['level.js','combat.js','skydrake.js'].map(n=>[n,require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../../dist/src',n))).digest('hex')])),passed:checks.filter(c=>c.pass).length,total:checks.length,checks,simulatedSeconds:totalFrames/60,state,route,errors,note:'Fresh isolated profile, real menu clicks and keyboard flight from Adventure start. No position, health, inventory, energy or enemy mutations; deterministic stepping. A short route check, not a full playthrough.'};
 fs.writeFileSync(path.join(__dirname,'Skyblade-Hunt-natural-arrival.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({...result,route:undefined}));if(result.passed!==result.total||errors.length)process.exitCode=1;
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
