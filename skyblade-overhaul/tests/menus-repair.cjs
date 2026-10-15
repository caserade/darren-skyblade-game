const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const p=await b.newPage({viewport:{width:960,height:640}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.__manual=true;window.requestAnimationFrame=()=>0;});await p.goto('http://127.0.0.1:4318/');await p.waitForFunction(()=>window.__game&&P.m.skin,null,{polling:50});
 const result=await p.evaluate(()=>{
  const checks=[];for(const mode of ['title','pause']){
   if(mode==='pause'){startGame(false);togglePause();}
   for(let cycle=0;cycle<3;cycle++)for(const [id] of TABS){
    openPanel(id);const controls=menuControls();navigatePadMenu(13);navigatePadMenu(12);
    const good=controls.length>0&&!$('panel').hidden&&$('panel').contains(document.activeElement)&&panelTab===id;
    navigatePadMenu(1);checks.push({name:mode+' '+id+' cycle '+cycle,pass:good&&$('panel').hidden&&(mode!=='pause'||G.paused)});
   }
  }
  return {passed:checks.filter(c=>c.pass).length,total:checks.length,checks};
 });result.errors=errors;fs.writeFileSync(path.resolve('tests/evidence/menu-cycles.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,total:result.total,failed:result.checks.filter(c=>!c.pass),errors}));if(result.passed!==result.total||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
