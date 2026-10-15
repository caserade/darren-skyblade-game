const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const out=path.resolve('tests/evidence',process.argv[2]||'working');fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await b.newContext({viewport:{width:1400,height:900}}),p=await ctx.newPage(),errors=[],warnings=[];p.on('pageerror',e=>errors.push(e.stack));p.on('console',m=>{if(m.type()==='warning'||m.type()==='error')warnings.push(m.text());});
 await p.goto('http://127.0.0.1:4318/?toons=1');await p.waitForTimeout(3000);
 for(const v of ['Front','Side','Back','Three-quarter']){await p.getByRole('button',{name:v,exact:true}).click();await p.waitForTimeout(200);await p.screenshot({path:path.join(out,'creatures-'+v.toLowerCase()+'.png')});}
 await p.goto('http://127.0.0.1:4318/');await p.waitForTimeout(4000);
 const state=await p.evaluate(()=>{window.__manual=true;const materials=[];for(const [name,m] of [['Darren',P.m],['Mom',LV.mom]])m.root.traverse(o=>{if(o.isSkinnedMesh)materials.push({name,roughness:o.material.roughness,clearcoat:o.material.clearcoat,texture:!!o.material.map});});return {skin:!!P.m.skin,mom:!!LV.mom.skin,materials,chapter:CH.id};});
 fs.writeFileSync(path.join(out,'inspection.json'),JSON.stringify({state,errors,warnings},null,2));console.log(JSON.stringify({state,errors,warnings}));
 await b.close();
})().catch(e=>{console.error(e);process.exitCode=1});
