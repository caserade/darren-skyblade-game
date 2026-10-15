/* LOCAL REVIEW ONLY: loaded by the test harness, never shipped in dist. */
window.__chompCandidateReady=new Promise((resolve,reject)=>{
 new T.GLTFLoader().load('/__chomp-candidate.glb',asset=>{
  asset.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  const originalAnimate=animateToonEnemy;
  EDEF.chomprex.build=()=>{
   const root=new T.Group(),b=grp(root),rig=cloneSkyDrakeRig(asset.scene);b.add(rig);rig.scale.setScalar(3.2/4.75);root.name='Chomp Rex candidate';
   const mixer=new T.AnimationMixer(rig),actions={};
   for(const clip of asset.animations){const a=mixer.clipAction(clip);if(!['idle','walk','turn','charge'].includes(clip.name)){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;}actions[clip.name]=a;}
   const warning=new T.Group();root.add(warning);warning.position.y=.045;
   const geo=toonShape('chargeArrow',[[-.8,0],[.8,0],[.8,3],[1.2,3],[0,4.4],[-1.2,3],[-.8,3]],.005);
   const mat=TOON.warningMat||(TOON.warningMat=new T.MeshBasicMaterial({color:0xf5b655,transparent:true,opacity:.54,side:T.DoubleSide,depthWrite:false}));
   const mark=new T.Mesh(geo,mat);mark.rotation.x=PI/2;warning.add(mark);warning.visible=false;
   const m={root,b,rig,mixer,actions,warning,shell:addShell(root,1.25,1.8),clip:null,isChompCandidate:true,disposed:false};
   m.dispose=()=>{if(m.disposed)return;m.disposed=true;mixer.stopAllAction();mixer.uncacheRoot(rig);const skeletons=new Set();rig.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton)});for(const sk of skeletons)sk.dispose();warning.visible=false;};
   return m;
  };
  animateToonEnemy=function(e,dt){
   const m=e.m;if(!m.isChompCandidate)return originalAnimate(e,dt);
   let clip='idle',timeScale=1;
   if(!e.alive)clip='death';else if(e.st==='wind')clip='chargeWindup';else if(e.st==='atk'){clip='charge';timeScale=.5/(25/60);}
   else if(e.st==='rec'){clip='recovery';timeScale=1.2/(65/60);}
   else if(['stun','air','down'].includes(e.st))clip='stagger';else if(e.st==='chase')clip='walk';
   if(m.clip!==clip){const next=m.actions[clip],old=m.actions[m.clip];next.reset().setEffectiveWeight(1).setEffectiveTimeScale(timeScale).play();if(old)next.crossFadeFrom(old,.08,false);m.clip=clip;}
   m.mixer.update(dt);m.warning.visible=e.alive&&e.st==='wind';m.warning.position.y=.045-e.y;
  };
  window.__chompCandidateAsset=asset;resolve(true);
 },undefined,reject);
});
