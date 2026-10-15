const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const p=await b.newPage({viewport:{width:1400,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4318/?toons=1');await p.waitForFunction(()=>window.__modelReview);
 const dir=path.resolve('tests/evidence/animation-review');fs.mkdirSync(dir,{recursive:true});
 for(const [pose,view] of [['wind','Front'],['atk','Side'],['rec','Three-quarter']]){
  await p.getByRole('button',{name:view,exact:true}).click();await p.evaluate(pose=>__modelReview.setPose(pose),pose);await p.waitForTimeout(500);await p.screenshot({path:path.join(dir,pose+'.png')});
 }
 console.log(JSON.stringify({captures:3,errors}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
