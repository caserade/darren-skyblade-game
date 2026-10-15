const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),cp=require('child_process');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:640,height:480}}),page=await context.newPage();
 if(process.argv.includes('--baseline'))await page.route('**/src/*.js',route=>{
  const name=new URL(route.request().url()).pathname.slice(1);
  const source=cp.execFileSync('git',['show','7f18a6a9cc044897043ded4e0f4a47b2288dff9a:dist/'+name],{encoding:'utf8'});
  return route.fulfill({status:200,contentType:'text/javascript',body:source});
 });
 await page.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0;});await page.goto('http://127.0.0.1:4318/');await page.waitForFunction(()=>window.__game&&P.m.skin&&LV.mom.skin&&(typeof SKYDRAKE==='undefined'||SKYDRAKE.asset),null,{polling:50,timeout:30000});
 const result=await page.evaluate(()=>{
  SETTINGS.graphics='smooth';applyGraphics();loadChapter('adv');startGame(false);TALK.line=null;G.cine=false;clearEnemies();
  const result=[],types=Object.keys(EDEF);let disposed=0;
  camera.position.set(P.x+8,6,P.z+10);camera.lookAt(P.x,1,P.z);
  for(let cycle=0;cycle<4;cycle++){
   for(const type of types){const e=spawnEnemy(type,P.x+2,P.z,{part:'ember',elite:true});e.st=EDEF[type].boss?'idle':'chase';for(const part of Object.values(e.m.parts||{}))part.mat.addEventListener('dispose',()=>disposed++);updateEnemy(e,1);renderer.render(scene,camera);clearEnemies();}
   renderer.render(scene,camera);result.push({cycle,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,materials:TOYS.length,sceneChildren:scene.children.length,disposedBossMaterials:disposed});
  }
  return {types,cycles:result};
 });const out=path.resolve('tests/evidence',process.argv[2]||'encounter-resources.json');fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
