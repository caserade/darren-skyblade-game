/* Chomp Rex mesh replacement. Encounter definitions, combat timing and saves stay
   in their existing modules. A pending or failed download uses the original model. */
const CHOMPREX={asset:null,loading:false,error:null,retryAt:0,attempts:0,token:0,timer:null};
const chompOriginalBuild=EDEF.chomprex.build;
const chompOriginalAnimate=animateToonEnemy;
function disposeChompAsset(g){
 const geometries=new Set(),materials=new Set(),textures=new Set(),skeletons=new Set();
 if(!g||!g.scene)return;
 g.scene.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);if(o.skeleton)skeletons.add(o.skeleton);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const value of Object.values(m))if(value&&value.isTexture)textures.add(value);}});
 for(const s of skeletons)s.dispose();for(const t of textures){if(t.image&&typeof t.image.close==='function')t.image.close();t.dispose();}for(const m of materials)m.dispose();for(const g of geometries)g.dispose();
}
function loadChompRex(){
 if(CHOMPREX.asset||CHOMPREX.loading||Date.now()<CHOMPREX.retryAt)return;
 clearTimeout(CHOMPREX.timer);CHOMPREX.loading=true;CHOMPREX.attempts++;
 const token=++CHOMPREX.token;
 const fail=error=>{
  if(token!==CHOMPREX.token||!CHOMPREX.loading)return;
  clearTimeout(CHOMPREX.timer);CHOMPREX.loading=false;CHOMPREX.error=String(error&&error.message||'Creature model unavailable');
  const delay=Math.min(30000,2000*Math.pow(2,CHOMPREX.attempts-1));CHOMPREX.retryAt=Date.now()+delay;
  if(CHOMPREX.attempts<4)CHOMPREX.timer=setTimeout(loadChompRex,delay);
 };
 CHOMPREX.timer=setTimeout(()=>fail(new Error('Creature model request timed out')),20000);
 try{new T.GLTFLoader().load('assets/chomprex.glb',g=>{
  if(token!==CHOMPREX.token||!CHOMPREX.loading){disposeChompAsset(g);return;}
  try{
   const required=['idle','walk','chargeWindup','charge','recovery','stagger','death'];
   if(!g.scene||!required.every(name=>g.animations.some(c=>c.name===name&&c.duration>0)))throw Error('Incomplete creature animation asset');
   let skins=0;g.scene.traverse(o=>{if(o.isSkinnedMesh)skins++;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
   if(!skins||!g.scene.getObjectByName('head')||!g.scene.getObjectByName('jaw'))throw Error('Incomplete creature skeleton');
   CHOMPREX.asset=g;CHOMPREX.loading=false;CHOMPREX.error=null;CHOMPREX.retryAt=0;clearTimeout(CHOMPREX.timer);
  }catch(error){disposeChompAsset(g);fail(error);}
 },undefined,fail);}catch(error){fail(error);}
}
function buildChompRex(){
 loadChompRex();if(!CHOMPREX.asset)return chompOriginalBuild();
 const root=new T.Group(),b=grp(root),rig=cloneSkyDrakeRig(CHOMPREX.asset.scene);b.add(rig);
 // Preserve the previous model's measured visual height, independent of hit volumes.
 rig.scale.setScalar(3.5253011559511704/4.75);root.name='Chomp Rex';
 const mixer=new T.AnimationMixer(rig),actions={};
 for(const clip of CHOMPREX.asset.animations){const a=mixer.clipAction(clip);if(!['idle','walk','turn','charge'].includes(clip.name)){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;}actions[clip.name]=a;}
 const warning=new T.Group();root.add(warning);warning.position.y=.045;
 const geo=toonShape('chargeArrow',[[-.8,0],[.8,0],[.8,3],[1.2,3],[0,4.4],[-1.2,3],[-.8,3]],.005);
 const mat=TOON.warningMat||(TOON.warningMat=new T.MeshBasicMaterial({color:0xf5b655,transparent:true,opacity:.54,side:T.DoubleSide,depthWrite:false}));
 const mark=new T.Mesh(geo,mat);mark.rotation.x=PI/2;warning.add(mark);warning.visible=false;
 const m={root,b,rig,mixer,actions,warning,shell:addShell(root,1.25,1.8),clip:null,isChompRig:true,disposed:false};
 m.dispose=()=>{if(m.disposed)return;m.disposed=true;mixer.stopAllAction();mixer.uncacheRoot(rig);const skeletons=new Set();rig.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});for(const sk of skeletons)sk.dispose();warning.visible=false;};
 return m;
}
EDEF.chomprex.build=buildChompRex;
animateToonEnemy=function(e,dt){
 const m=e.m;if(!m.isChompRig)return chompOriginalAnimate(e,dt);if(m.disposed)return;
 let clip='idle',timeScale=1;
 if(!e.alive)clip='death';else if(e.st==='wind')clip='chargeWindup';else if(e.st==='atk'){clip='charge';timeScale=.5/(25/60);}
 else if(e.st==='rec'){clip='recovery';timeScale=1.2/(65/60);}
 else if(['stun','air','down'].includes(e.st))clip='stagger';else if(e.st==='chase')clip='walk';
 if(m.clip!==clip){const next=m.actions[clip],old=m.actions[m.clip];next.reset().setEffectiveWeight(1).setEffectiveTimeScale(timeScale).play();if(old)next.crossFadeFrom(old,.08,false);m.clip=clip;}
 m.mixer.update(dt);m.warning.visible=e.alive&&e.st==='wind';m.warning.position.y=.045-e.y;
};
// Cache only. Completion never mutates an active encounter or a previously cleared level.
loadChompRex();
