const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const out=path.resolve('tests/evidence/keyboard-play');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:4318/');await page.waitForFunction(()=>window.__game&&P.m.skin&&LV.mom.skin,null,{polling:50});
 const step=async n=>page.evaluate(n=>{const render=renderer.render;try{renderer.render=()=>{};for(let i=0;i<n;i++)tick(1/60);}finally{renderer.render=render;}renderer.render(scene,camera);},n);
 const check=async(name,fn)=>checks.push({name,pass:!!await page.evaluate(fn)});
 const key=async(code,n=1)=>{await page.keyboard.down(code);await step(n);await page.keyboard.up(code);};
 const dialogue=async()=>{for(let i=0;i<100&&await page.evaluate(()=>!!TALK.line);i++)await key('Space');};
 await page.click('#startBtn');await step(1);await dialogue();await check('Start and dialogue advance through actual browser keyboard events',()=>G.mode==='play'&&!G.cine);
 await page.evaluate(()=>{window.playStart={x:P.x,z:P.z};});await key('KeyW',18);
 await check('W moves Darren',()=>Math.hypot(P.x-playStart.x,P.z-playStart.z)>.3);
 await key('KeyJ',5);await check('J starts a light attack',()=>P.st==='attack');await step(70);
 await page.keyboard.down('KeyK');await step(5);await check('Holding K enters the heavy charge pose',()=>P.st==='charge');await page.keyboard.up('KeyK');await step(2);await check('Releasing K starts the heavy attack',()=>P.st==='attack');await step(90);
 await page.keyboard.down('KeyK');await step(35);await page.keyboard.up('KeyK');await step(2);await check('Long K hold releases the charged finisher',()=>P.st==='attack'&&P.name==='DF');await step(90);
 await key('Space',10);await check('Space jumps',()=>P.y>.2&&!P.onG);await step(100);
 await key('ShiftLeft',5);await check('Shift starts a dodge',()=>P.st==='dash');await step(60);
 await key('KeyV',10);await check('V toggles flight',()=>P.fly&&P.y>0);await key('KeyV');await step(100);
 await key('KeyP');await check('P pauses play',()=>G.paused);await page.click('#optBtn');await page.getByRole('tab',{name:'Settings',exact:true}).click();
 await page.keyboard.press('Tab');await check('Tab focus remains inside Settings',()=>$('panel').contains(document.activeElement));
 await page.keyboard.press('Escape');await check('Escape closes Settings while preserving pause',()=>G.paused&&$('panel').hidden);
 await page.screenshot({path:path.join(out,'paused-game.png')});await page.keyboard.press('Escape');await check('Second Escape resumes play',()=>!G.paused);
 await step(1);await page.screenshot({path:path.join(out,'chapter1-play.png')});
 // Existing later encounters are set up as isolated fixtures; this is not a manual playthrough.
 await page.evaluate(()=>{loadChapter('ch3');startGame(false);while(TALK.line){TALK.shown=TALK.line.length;advanceTalk();}P.x=34;P.z=-6;P.y=0;enterZone(1);while(TALK.line){TALK.shown=TALK.line.length;advanceTalk();}const e=G.enemies.find(e=>e.type==='stormbelly');P.x=e.x;P.z=e.z+5;P.y=0;cam.fx=P.x;cam.fz=P.z;cam.yaw=0;cam.pitch=.26;P.inv=999;});
 await step(30);await key('KeyQ');await check('Q locks an existing encounter target',()=>!!P.lock&&P.lock.alive);await key('KeyJ',10);await check('Combat input works after chapter transition',()=>P.st==='attack');
 await step(20);await page.screenshot({path:path.join(out,'stormbelly-encounter.png')});
 await page.evaluate(()=>{for(const e of [...G.enemies])if(e.alive)killEnemy(e);updateZones(1);while(TALK.line){TALK.shown=TALK.line.length;advanceTalk();}P.x=63;P.z=-37;P.y=0;enterZone(2);while(TALK.line){TALK.shown=TALK.line.length;advanceTalk();}const e=G.enemies.find(e=>e.type==='chomprex');P.x=e.x;P.z=e.z+5;cam.fx=P.x;cam.fz=P.z;cam.yaw=0;cam.pitch=.26;P.inv=999;});
 await step(30);await page.screenshot({path:path.join(out,'chomprex-encounter.png')});
 await check('Later encounter remains finite',()=>[P.x,P.y,P.z,camera.position.x,camera.position.y,camera.position.z].every(Number.isFinite));
 const result={passed:checks.filter(c=>c.pass).length,total:checks.length,checks,errors,note:'Playwright keyboard events with deterministic game stepping; later encounters use isolated fixtures. No physical controller, phone, or full manual playthrough.'};
 fs.writeFileSync(path.join(out,'play.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(result.passed!==result.total||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
