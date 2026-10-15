const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve('dist'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),checks=[];
const check=(name,ok)=>{checks.push({name,pass:!!ok});if(!ok)process.exitCode=1;};
for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(m[1].startsWith('http'))continue;check('Local asset '+m[1],fs.existsSync(path.join(root,m[1])));}
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(root);for(const f of files.filter(x=>x.endsWith('.js')&&!x.includes('vendor'))){const r=cp.spawnSync(process.execPath,['--check',f]);check('Syntax '+path.relative(root,f),r.status===0);}
check('No local QA code shipped',!files.some(x=>x.includes('tests'))&&!html.includes('__manual')&&!html.includes('quality-results'));
check('Generated texture is bundled',fs.statSync(path.join(root,'assets/textures/weathered-limestone.webp')).size>10000);
console.log(JSON.stringify({passed:checks.filter(x=>x.pass).length,total:checks.length,failed:checks.filter(x=>!x.pass),outputMegabytes: +(files.reduce((s,f)=>s+fs.statSync(f).size,0)/1048576).toFixed(2)},null,2));
