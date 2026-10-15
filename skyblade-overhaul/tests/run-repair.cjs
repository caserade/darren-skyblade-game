const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const label=process.argv[2]||'baseline',out=path.resolve('tests/evidence',label);fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1400,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));
 const reports={};
 for(const [route,id] of [['repair','repair-results'],['qa','qa-results'],['quality','quality-results']]){
  await page.goto('http://127.0.0.1:4318/?'+route+'=1');
  await page.waitForSelector('#'+id,{timeout:120000});
  reports[route]=JSON.parse(await page.locator('#'+id).textContent());
  console.log(route,reports[route].passed+'/'+reports[route].total,JSON.stringify(reports[route].results.filter(r=>!r.pass)));
 }
 await page.goto('http://127.0.0.1:4318/?toons=1');await page.waitForTimeout(2000);
 for(const view of ['Front','Side']){await page.getByRole('button',{name:view,exact:true}).click();await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'creatures-'+view.toLowerCase()+'.png')});}
 await page.goto('http://127.0.0.1:4318/');await page.waitForTimeout(1000);
 reports.probes=await page.evaluate(()=>{
  window.__manual=true;
  const result={};
  G.mode='title';openPanel('settings');dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',bubbles:true}));result.enterInSettings={mode:G.mode,panelHidden:$('panel').hidden};closePanel();
  G.mode='play';G.paused=false;In.q.length=0;press('heavy');In.tmx=1;In.cdx=99;dispatchEvent(new Event('blur'));result.blur={queue:[...In.q],touchX:In.tmx,cameraX:In.cdx};
  const old=navigator.getGamepads;Object.defineProperty(navigator,'getGamepads',{value:()=>[{connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===2}))}],configurable:true});pollPad();Object.defineProperty(navigator,'getGamepads',{value:()=>[],configurable:true});pollPad();result.disconnectedPadHeld=!!In.held.light;Object.defineProperty(navigator,'getGamepads',{value:old,configurable:true});
  return result;
 });
 reports.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log('probes',JSON.stringify(reports.probes),'page errors',errors.length);
 await context.close();await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
