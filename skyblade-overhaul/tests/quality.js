/* Local-only material, resource and performance scan. */
(async()=>{
window.__manual=true;G.paused=true;const results=[],metrics=[];
const check=(name,ok)=>results.push({name,pass:!!ok});
for(let i=0;i<120&&!POLISH.ready&&!POLISH.error;i++)await new Promise(r=>setTimeout(r,25));
check('Generated limestone texture loaded',POLISH.ready&&!POLISH.error);
check('Texture dimensions support mipmaps',POLISH.textures.stone.image.width===512&&POLISH.textures.bump.image.width===512);
check('Tone mapping and bounded exposure active',renderer.toneMapping===T.ACESFilmicToneMapping&&renderer.toneMappingExposure<1.3);
check('Stone uses both color and relief maps',stormMaterials().stone.map&&stormMaterials().stone.bumpMap);
check('Wood, cloth and metal use distinct textures',PROP.wood.map!==MAT.yellow.map&&stormMaterials().gold.map!==PROP.wood.map);
for(const id of ['ch1','ch2','adv','ch3']){
  loadChapter(id);G.paused=true;camera.position.set(P.x+15,20,P.z+23);camera.lookAt(P.x,0,P.z);renderer.render(scene,camera);
  const m={chapter:id,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures};metrics.push(m);
  check(id+' renders within geometry budget',m.calls<1600&&m.triangles<2500000);
  check(id+' uses detailed cliff materials',Object.values(LV.islands).every(i=>i.g.children[1].material===POLISH.cliff));
}
for(let i=0;i<240&&(!P.m.skin||!LV.mom.skin);i++)await new Promise(r=>setTimeout(r,25));
let matte=true;for(const model of [P.m,LV.mom])model.rig.traverse(o=>{if(o.isSkinnedMesh&&o.material.map&&o.material.roughness<0.9)matte=false;if(o.isSkinnedMesh&&o.material.clearcoat>0)matte=false;});
check('Darren and Mom have matte character materials',matte&&P.m.skin&&LV.mom.skin);
check('Apron uses woven cloth with a matte finish',buildClothApron.material.map===POLISH.textures.cloth&&buildClothApron.material.roughness===0.98);
for(let i=0;i<6;i++){renderer.render(scene,camera);await new Promise(r=>setTimeout(r,25));}
const before={textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries};
const frames=[];for(let i=0;i<45;i++){await new Promise(r=>setTimeout(r,25));const t=performance.now();renderer.render(scene,camera);frames.push(performance.now()-t);}
check('Steady rendering creates no extra GPU resources',before.textures===renderer.info.memory.textures&&before.geometries===renderer.info.memory.geometries);
metrics.push({resourceStart:before,resourceEnd:{textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries}});
frames.sort((a,b)=>a-b);metrics.push({renderSubmissionMedianMs:frames[22],renderSubmissionP95Ms:frames[42],note:'CPU render submission only; not a device FPS guarantee'});
const chapterResources=[];for(let i=0;i<4;i++){loadChapter('ch3');renderer.render(scene,camera);chapterResources.push(renderer.info.memory.geometries);}
check('Repeated Stormglass reloads release old geometry',Math.max(...chapterResources.slice(1))-Math.min(...chapterResources.slice(1))<=3);metrics.push({chapterReloadGeometries:chapterResources});
const pre=document.createElement('pre');pre.id='quality-results';pre.style='position:fixed;inset:0;z-index:100000;background:#15242d;color:#c7e6df;padding:20px;overflow:auto;white-space:pre-wrap';pre.textContent=JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,results,metrics},null,2);document.body.appendChild(pre);
})();
