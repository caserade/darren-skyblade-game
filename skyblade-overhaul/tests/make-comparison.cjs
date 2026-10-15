const {chromium}=require('C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const image=p=>'data:image/'+(p.endsWith('.jpg')?'jpeg':'png')+';base64,'+fs.readFileSync(p).toString('base64');
(async()=>{
 const out=path.resolve('tests/evidence/Skyblade-Hunt-before-after.png');
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const p=await b.newPage({viewport:{width:1680,height:1200},deviceScaleFactor:1});
 const panel=(label,file)=>'<section><h2>'+label+'</h2><img src="'+image(file)+'"></section>';
 await p.setContent(`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:36px;background:#11232e;color:#eef4f5;font-family:Segoe UI,Arial,sans-serif}h1{font-size:35px;margin:0 0 8px}p{font-size:19px;line-height:1.45;color:#c4d6df;margin:0 0 25px}main{display:grid;grid-template-columns:1fr 1fr;gap:24px}section{background:#1b2b36;border:1px solid #3d5664;border-radius:9px;overflow:hidden}h2{font-size:22px;margin:0;padding:14px 20px}img{display:block;width:100%;height:auto}footer{margin-top:24px;font-size:18px;color:#c4d6df;line-height:1.5}</style><h1>Darren: Skyblade Hunt — visual repair comparison</h1><p>Stormbelly / Heavyweight and Chomp Rex / Grin • Existing characters, unchanged encounter content • 14 October 2026</p><main>`+
 panel('Before · current Site version 4 · front','tests/evidence/baseline/creatures-front.png')+
 panel('After · repaired procedural models · front','tests/evidence/final-visual/creatures-front.png')+
 panel('Before · current Site version 4 · side','tests/evidence/baseline/creatures-side.png')+
 panel('After · repaired procedural models · side','tests/evidence/final-visual/creatures-side.png')+
 panel('Supplied Stormbelly / Heavyweight turnaround','art/references/concept_heavyweight.jpg')+
 panel('Supplied Chomp Rex / Grin turnaround','art/references/concept_chomprex.jpg')+
 `</main><footer>Matched features: spotted blue/plum skin, pale/gold segmented undersides, body proportions, curved tails, black claws, Stormbelly’s horns and small bat wings, and Rex’s short arms and broad grin.<br>These remain procedural approximations of the supplied artwork, not finished sculpted replicas. The supplied SkyDrake is absent from the hosted roster and was not added.</footer>`);
 await p.locator('img').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));await p.screenshot({path:out,fullPage:true});console.log(JSON.stringify({path:out,bytes:fs.statSync(out).size}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
