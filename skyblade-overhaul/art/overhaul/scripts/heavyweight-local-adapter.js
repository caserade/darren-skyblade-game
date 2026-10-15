/* LOCAL CANDIDATE ONLY. No dist or live publication. */
/* Stormbelly mesh replacement. Encounter definitions, combat timing and saves stay
   in their existing modules. A pending or failed download uses the original model. */
const STORMBELLY={asset:null,loading:false,error:null,retryAt:0,attempts:0,token:0,timer:null};
const stormbellyOriginalBuild=EDEF.stormbelly.build;
const stormbellyOriginalAnimate=animateToonEnemy;
function disposeStormbellyAsset(g){
 const geometries=new Set(),materials=new Set(),textures=new Set(),skeletons=new Set();
 if(!g||!g.scene)return;
 g.scene.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);if(o.skeleton)skeletons.add(o.skeleton);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const value of Object.values(m))if(value&&value.isTexture)textures.add(value);}});
 for(const s of skeletons)s.dispose();for(const t of textures){if(t.image&&typeof t.image.close==='function')t.image.close();t.dispose();}for(const m of materials)m.dispose();for(const g of geometries)g.dispose();
}
function loadStormbelly(){
 if(STORMBELLY.asset||STORMBELLY.loading||Date.now()<STORMBELLY.retryAt)return;
 clearTimeout(STORMBELLY.timer);STORMBELLY.loading=true;STORMBELLY.attempts++;
 const token=++STORMBELLY.token;
 const fail=error=>{
  if(token!==STORMBELLY.token||!STORMBELLY.loading)return;
  clearTimeout(STORMBELLY.timer);STORMBELLY.loading=false;STORMBELLY.error=String(error&&error.message||'Creature model unavailable');
  const delay=Math.min(30000,2000*Math.pow(2,STORMBELLY.attempts-1));STORMBELLY.retryAt=Date.now()+delay;
  if(STORMBELLY.attempts<4)STORMBELLY.timer=setTimeout(loadStormbelly,delay);
 };
 STORMBELLY.timer=setTimeout(()=>fail(new Error('Creature model request timed out')),20000);
 try{new T.GLTFLoader().load('/__heavyweight-candidate.glb',g=>{
  if(token!==STORMBELLY.token||!STORMBELLY.loading){disposeStormbellyAsset(g);return;}
  try{
   const required=['idle','heavyWalk','stompWindup','stompImpact','stompRecovery','stagger','death'];
   if(!g.scene||!required.every(name=>g.animations.some(c=>c.name===name&&c.duration>0)))throw Error('Incomplete creature animation asset');
   let skins=0;g.scene.traverse(o=>{if(o.isSkinnedMesh)skins++;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
   const bones=['root','head','jaw','thighL','shinL','footL','toeL','thighR','shinR','footR','toeR'];
   if(!skins||!bones.every(name=>g.scene.getObjectByName(name)))throw Error('Incomplete creature skeleton');
   STORMBELLY.asset=g;STORMBELLY.loading=false;STORMBELLY.error=null;STORMBELLY.retryAt=0;clearTimeout(STORMBELLY.timer);
  }catch(error){disposeStormbellyAsset(g);fail(error);}
 },undefined,fail);}catch(error){fail(error);}
}
function buildStormbelly(){
 loadStormbelly();if(!STORMBELLY.asset)return stormbellyOriginalBuild();
 const root=new T.Group(),b=grp(root),rig=cloneSkyDrakeRig(STORMBELLY.asset.scene);b.add(rig);
 // Preserve the previous model's measured visual height, independent of hit volumes.
 rig.scale.setScalar(3.4938671960850307/4.613870137354194);root.name='Stormbelly';
 const mixer=new T.AnimationMixer(rig),actions={};
 for(const clip of STORMBELLY.asset.animations){const a=mixer.clipAction(clip);if(!['idle','walk','heavyWalk','turn'].includes(clip.name)){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;}actions[clip.name]=a;}
 const warning=new T.Group();root.add(warning);warning.position.y=.045;
 const geo=TOON.geo.stompRing||(TOON.geo.stompRing=new T.RingGeometry(3,3.3,48));
 const mat=TOON.warningMat||(TOON.warningMat=new T.MeshBasicMaterial({color:0xf5b655,transparent:true,opacity:.54,side:T.DoubleSide,depthWrite:false}));
 const mark=new T.Mesh(geo,mat);mark.rotation.x=-PI/2;warning.add(mark);warning.visible=false;
 const m={root,b,rig,mixer,actions,warning,shell:addShell(root,1.25,1.8),clip:null,isStormbellyRig:true,disposed:false};
 // A newly built instance can render before its first AI tick. Establish the
 // grounded idle pose immediately rather than briefly exposing the bind pose.
 actions.idle.reset().play();mixer.update(0);m.clip='idle';
 rig.updateMatrixWorld(true);m.gait={phase:.25,active:false,last:null,legs:[],root:rig.getObjectByName('root')};
 m.gait.idleRoot=m.gait.root.position.clone();
 for(const side of ['L','R']){const thigh=rig.getObjectByName('thigh'+side),shin=rig.getObjectByName('shin'+side),foot=rig.getObjectByName('foot'+side),toe=rig.getObjectByName('toe'+side);m.gait.legs.push({side,thigh,shin,foot,toe,neutral:rig.worldToLocal(foot.getWorldPosition(new T.Vector3())),flat:foot.getWorldQuaternion(new T.Quaternion()),toeQ:toe.quaternion.clone(),plant:null,swing:null});}
 stormbellySaveAnimation(m);
 m.dispose=()=>{if(m.disposed)return;m.disposed=true;mixer.stopAllAction();mixer.uncacheRoot(rig);const skeletons=new Set();rig.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});for(const sk of skeletons)sk.dispose();warning.visible=false;};
 return m;
}
EDEF.stormbelly.build=buildStormbelly;
function stormbellySaveAnimation(m){for(const l of m.gait.legs)for(const key of ['thigh','shin','foot','toe']){const saved=key+'Animated';if(l[saved])l[saved].copy(l[key].quaternion);else l[saved]=l[key].quaternion.clone();}}
// Visual foot placement only: the encounter continues to own position, speed,
// facing, collision and combat. All targets are instance-local, never saved.
function stormbellyPlaceFoot(m,leg,target,orientation){
 const v=()=>new T.Vector3(),q=()=>new T.Quaternion();m.root.updateMatrixWorld(true);
 const h=leg.thigh.getWorldPosition(v()),k=leg.shin.getWorldPosition(v()),a=leg.foot.getWorldPosition(v()),l1=h.distanceTo(k),l2=k.distanceTo(a),axis=target.clone().sub(h),distance=axis.length();axis.normalize();
 const length=Math.max(.001,Math.min(distance,l1+l2-.0001));
 let bend=new T.Vector3(0,0,1).applyQuaternion(m.root.getWorldQuaternion(q()));bend.addScaledVector(axis,-bend.dot(axis)).normalize();
 const cosine=Math.max(-1,Math.min(1,(l1*l1+length*length-l2*l2)/(2*l1*length))),knee=h.clone().addScaledVector(axis,cosine*l1).addScaledVector(bend,Math.sqrt(1-cosine*cosine)*l1);
 const rotate=(bone,from,to)=>{const world=bone.getWorldQuaternion(q()),parent=bone.parent.getWorldQuaternion(q()).invert();bone.quaternion.copy(parent.multiply(q().setFromUnitVectors(from.normalize(),to.normalize()).multiply(world)));m.root.updateMatrixWorld(true);};
 rotate(leg.thigh,k.clone().sub(h),knee.clone().sub(h));const kk=leg.shin.getWorldPosition(v()),aa=leg.foot.getWorldPosition(v());rotate(leg.shin,aa.sub(kk),target.clone().sub(kk));
 leg.foot.quaternion.copy(leg.foot.parent.getWorldQuaternion(q()).invert().multiply(orientation));leg.toe.quaternion.copy(leg.toeQ);m.root.updateMatrixWorld(true);
 leg.error=leg.foot.getWorldPosition(v()).distanceTo(target);
}
function stormbellyGait(e,dt,moving,distance,turn){
 const m=e.m,g=m.gait;
 const heading=m.root.getWorldQuaternion(new T.Quaternion());
 if(!moving){
  if(g.active){g.settle=.24;for(const l of g.legs){l.stop=l.lastTarget?l.lastTarget.clone():l.foot.getWorldPosition(new T.Vector3());l.order=l.plant?1:0;}g.active=false;}
  if(g.settle>0&&e.alive&&e.st==='chase'){
   g.settle=Math.max(0,g.settle-dt);const elapsed=.24-g.settle;if(g.settle===0)g.release=.1;
   for(const l of g.legs){const goal=m.rig.localToWorld(l.neutral.clone()),u=Math.max(0,Math.min(1,(elapsed-l.order*.12)/.12)),smooth=u*u*(3-2*u),target=l.stop.clone().lerp(goal,smooth);target.y=Math.max(goal.y,target.y)+Math.sin(u*PI)*.10;stormbellyPlaceFoot(m,l,target,heading.clone().multiply(l.flat));l.plant=null;}
  }else if(g.release>0&&e.alive&&e.st==='chase'){g.release=Math.max(0,g.release-dt);for(const l of g.legs)stormbellyPlaceFoot(m,l,m.rig.localToWorld(l.neutral.clone()),heading.clone().multiply(l.flat));}
  else{g.settle=0;g.release=0;for(const l of g.legs){l.plant=null;l.swing=null;}}
  return;
 }
 const starting=!g.active;
 if(starting){g.phase=.25;g.active=true;for(const l of g.legs){l.plant=null;l.swing=null;l.lastTarget=null;}}
 g.phase=(g.phase+(distance+Math.abs(turn)*.8)/1.485)%1;
 m.actions.heavyWalk.time=g.phase*1.5;m.actions.heavyWalk.setEffectiveTimeScale(0);m.mixer.update(0);stormbellySaveAnimation(m);m.root.updateMatrixWorld(true);
 const flat=heading.clone();g.settle=0;g.release=0;
 for(const l of g.legs){const u=(g.phase+(l.side==='R'?.5:0))%1,desired=flat.clone().multiply(l.flat);
  const ground=m.rig.localToWorld(l.neutral.clone()),strideRatio=distance/Math.max(.000001,distance+Math.abs(turn)*.8),landing=ground.clone().add(new T.Vector3(0,0,.37125*strideRatio).applyQuaternion(heading));
  if(u<.5){if(!l.plant){l.plant=l.lastTarget?l.lastTarget.clone():ground.clone();l.plant.y=ground.y;l.plantQ=desired;}l.swing=null;stormbellyPlaceFoot(m,l,l.plant,l.plantQ);l.lastTarget=l.plant.clone();}
  else{if(!l.swing){l.swing=l.lastTarget?l.lastTarget.clone():ground.clone();l.swingPhase=starting?u:.5;}l.plant=null;const t=(u-l.swingPhase)/(1-l.swingPhase),s=.5-.5*Math.cos(t*PI),target=l.swing.clone().lerp(landing,s);target.y=ground.y+Math.sin(t*PI)*.145;stormbellyPlaceFoot(m,l,target,desired);l.lastTarget=target.clone();}
 }
}
animateToonEnemy=function(e,dt){
 const m=e.m;if(!m.isStormbellyRig)return stormbellyOriginalAnimate(e,dt);if(m.disposed)return;
 // The skinned actions already carry recoil, crouch and collapse. Applying the
 // prototype's whole-body pitch/squash a second time drives the tail underground.
 m.b.rotation.set(0,0,0);m.b.position.y=0;m.b.scale.set(1,1,1);
 // Three skips unchanged animation properties. Restore the last authored pose
 // before mixing so a previous foot correction cannot leak into attack clips.
 for(const l of m.gait.legs)for(const key of ['thigh','shin','foot','toe'])l[key].quaternion.copy(l[key+'Animated']);
 const g=m.gait,last=g.last,distance=last?Math.hypot(e.x-last.x,e.z-last.z):0,turn=last?Math.atan2(Math.sin(e.face-last.face),Math.cos(e.face-last.face)):0;g.last={x:e.x,z:e.z,face:e.face};
 const moving=e.alive&&e.st==='chase'&&(distance>.00001||Math.abs(turn)>.0001)&&distance<1;
 let clip='idle',timeScale=1;
 if(!e.alive){clip='death';timeScale=2.2/(16/60);}else if(e.st==='wind')clip='stompWindup';else if(e.st==='atk'){clip='stompImpact';timeScale=.35/(18/60);}
 else if(e.st==='rec'){clip='stompRecovery';timeScale=1.9/(80/60);}
 else if(['stun','air','down'].includes(e.st))clip='stagger';else if(moving||(e.st==='chase'&&(g.active||g.settle>0))){clip='heavyWalk';timeScale=0;}
 if(m.clip!==clip){const next=m.actions[clip],old=m.actions[m.clip];next.reset().setEffectiveWeight(1).setEffectiveTimeScale(timeScale).play();if(old)next.crossFadeFrom(old,clip==='death'?.025:.08,false);g.transition=.1;m.clip=clip;}
 m.mixer.update(dt);stormbellySaveAnimation(m);stormbellyGait(e,dt,moving,distance,turn);m.warning.visible=e.alive&&e.st==='wind';m.warning.position.y=.045-e.y;
 if(g.transition>0){g.transition=Math.max(0,g.transition-dt);if(e.alive&&!moving&&!g.settle&&!g.release){m.root.updateMatrixWorld(true);const heading=m.root.getWorldQuaternion(new T.Quaternion());for(const l of g.legs){const target=l.foot.getWorldPosition(new T.Vector3()),ground=m.rig.localToWorld(l.neutral.clone());target.y=Math.max(target.y,ground.y);stormbellyPlaceFoot(m,l,target,heading.clone().multiply(l.flat));}}}
};
// Cache only. Completion never mutates an active encounter or a previously cleared level.
loadStormbelly();
