const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const dir=path.resolve('tests/evidence',process.argv[2]||'flows');fs.mkdirSync(dir,{recursive:true});
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const reports=[];
 async function scenario(name,seed,run,viewport={width:960,height:640}){
  const ctx=await b.newContext({viewport}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0;});
  if(seed)await p.addInitScript(seed);
  await p.goto('http://127.0.0.1:4318/');await p.waitForFunction(()=>window.__game&&P.m.skin&&LV.mom.skin,null,{polling:50,timeout:20000});
  const result=await run(p);reports.push({name,result,errors});console.log(name,JSON.stringify(result),JSON.stringify(errors));await ctx.close();
 }
 await scenario('legacy inventory',()=>{localStorage.setItem('darrenSkyblade.unlocks',JSON.stringify({weapons:['emberfang','cloudcutter'],weapon:'cloudcutter',done:['ch1'],parts:{feather:22,plate:7},armor:[],equip:{R:'cloudcutter',L:'emberfang'},style:'twin',futureField:'preserve-me'}));},async p=>p.evaluate(()=>({unlockKey:DATA.meta.unlockKey,weapons:UNLOCKS.weapons,done:UNLOCKS.done,parts:UNLOCKS.parts,style:UNLOCKS.style,weapon:P.weapon,futureField:UNLOCKS.futureField,recovery:!!localStorage.getItem(DATA.meta.unlockKey+'.recovery')})));
 await scenario('malformed inventory/settings',()=>{localStorage.setItem('darrenSkyblade.unlocks',JSON.stringify({weapons:{},done:null,parts:'bad',armor:9,equip:[],contracts:{active:'bad',prog:[],done:1},style:'wrong'}));localStorage.setItem('darrenSkyblade.settings',JSON.stringify({sens:'bad',music:-100,sfx:1000,shake:null,difficulty:'unknown',graphics:'wrong'}));},async p=>p.evaluate(()=>{startGame(false);const vals=[SETTINGS.sens,SETTINGS.music,SETTINGS.sfx,SETTINGS.shake,P.x,P.z];return {finite:vals.every(Number.isFinite),values:vals,weapons:Array.isArray(UNLOCKS.weapons),contracts:Array.isArray(UNLOCKS.contracts.active),settings:SETTINGS};}));
 await scenario('storage unavailable',()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Unavailable','SecurityError')}}),async p=>p.evaluate(()=>{startGame(false);return {mode:G.mode,saveFailed:save()===false,finite:[P.x,P.z,P.hp].every(Number.isFinite)};}));
 await scenario('interrupted and completed endings',null,async p=>p.evaluate(()=>{
  const skip=()=>{for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk();}};
  const out=[];
  loadChapter('ch1');startGame(false);skip();bossEnding();tick(.5);togglePause();const count=flowTimers.length;for(let i=0;i<20;i++)updateFlow(.1);out.push({pauseKeepsCage:!LV.cage.broken,timersRetained:flowTimers.length===count});togglePause();quitToTitle();loadChapter('ch2');startGame(false);skip();save();const saved=localStorage.getItem(CH.saveKey);for(let i=0;i<60;i++)updateFlow(.1);out.push({cancelled:flowTimers.length===0,chapter:CH.id,saveUnchanged:localStorage.getItem(CH.saveKey)===saved});
  loadChapter('ch1');startGame(false);skip();bossEnding();for(let i=0;i<150&&G.mode!=='win';i++){updateFlow(.1);skip();}out.push({completed:G.mode==='win',unlocked:UNLOCKS.done.includes('ch1'),timers:flowTimers.length});
  return out;
 }));
 await scenario('fast travel repeated and interrupted',null,async p=>p.evaluate(()=>{
  loadChapter('adv');startGame(false);TALK.line=null;G.cine=false;const ids=Object.keys(AD.ways);for(const w of Object.values(AD.ways))w.lit=true;
  const out=[];for(const id of ids.slice(0,3)){const accepted=fastTravel(id);updateFlow(1);updateFlow(1);out.push({id,accepted,ended:!G.cine,finite:[P.x,P.y,P.z,cam.fx,cam.fz].every(Number.isFinite),savedWay:UNLOCKS.advWay===id});}
  fastTravel(ids[0]);quitToTitle();loadChapter('ch3');startGame(false);const x=P.x,z=P.z;updateFlow(5);out.push({cancelled:CH.id==='ch3'&&P.x===x&&P.z===z&&flowTimers.length===0});return out;
 }));
 await scenario('keyboard/menu actual events',null,async p=>{
  await p.click('#optBtn');await p.keyboard.press('Enter');let settings=await p.evaluate(()=>({title:G.mode==='title',panel:!$('panel').hidden}));await p.keyboard.press('Tab');const tab=await p.evaluate(()=>$('panel').contains(document.activeElement));await p.keyboard.press('Escape');await p.click('#startBtn');await p.evaluate(()=>{while(TALK.line){TALK.shown=TALK.line.length;advanceTalk();}});await p.keyboard.press('KeyP');await p.click('#optBtn');await p.keyboard.press('Escape');let paused=await p.evaluate(()=>G.paused&&$('panel').hidden);return {settings,tab,escapeKeepsPause:paused};
 });
 for(const [name,viewport] of [['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]])await scenario(name,null,async p=>{
  await p.click('#optBtn');await p.getByRole('tab',{name:'Settings',exact:true}).click();await p.screenshot({path:path.join(dir,name+'-settings.png')});
  return p.evaluate(()=>({horizontalOverflow:document.documentElement.scrollWidth>innerWidth,panelWidth:$('panel').getBoundingClientRect().width,windowWidth:innerWidth,closeVisible:$('panelClose').getBoundingClientRect().right<=innerWidth}));
 },viewport);
 fs.writeFileSync(path.join(dir,'flows.json'),JSON.stringify(reports,null,2));await b.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
