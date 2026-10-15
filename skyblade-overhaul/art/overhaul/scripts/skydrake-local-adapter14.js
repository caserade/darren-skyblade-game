/* Local SkyDrake candidate only. Original encounter and saves own gameplay. */
const SKY14={asset:null,loading:false,error:null,retryAt:0,attempts:0,token:0,timer:null};
const sky14OriginalBuild=buildSkyDrake,sky14OriginalAnimate=animateSkyDrake;
function disposeSky14(g){const geo=new Set(),mats=new Set(),tex=new Set(),skins=new Set();if(!g||!g.scene)return;g.scene.traverse(o=>{if(!o.isMesh)return;geo.add(o.geometry);if(o.skeleton)skins.add(o.skeleton);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);for(const t of Object.values(m))if(t&&t.isTexture)tex.add(t);}});for(const s of skins)s.dispose();for(const t of tex){if(t.image&&typeof t.image.close==='function')t.image.close();t.dispose();}for(const m of mats)m.dispose();for(const g of geo)g.dispose();}
function loadSky14(){
 if(SKY14.asset||SKY14.loading||Date.now()<SKY14.retryAt)return;SKY14.loading=true;SKY14.attempts++;const token=++SKY14.token;
 const fail=error=>{if(token!==SKY14.token||!SKY14.loading)return;clearTimeout(SKY14.timer);SKY14.loading=false;SKY14.error=String(error&&error.message||'Candidate unavailable');const delay=Math.min(30000,2000*2**(SKY14.attempts-1));SKY14.retryAt=Date.now()+delay;if(SKY14.attempts<4)SKY14.timer=setTimeout(loadSky14,delay);};
 SKY14.timer=setTimeout(()=>fail(Error('Candidate timed out')),20000);
 new T.GLTFLoader().load('/__skydrake-candidate.glb',g=>{if(token!==SKY14.token||!SKY14.loading){disposeSky14(g);return;}try{
 const required=['idle','walk','turn','hit','stagger','death','takeoff','flyIdle','attackWindup','attack','land','recover','tailWindup','tailWhip'];if(!g.scene||!required.every(n=>g.animations.some(a=>a.name===n&&a.duration>0)))throw Error('Incomplete SkyDrake actions');let skin=0;g.scene.traverse(o=>{if(o.isSkinnedMesh)skin++;if(o.isMesh){o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;}});if(!skin||!['head','jaw','tail6','wing3L','wing3R'].every(n=>g.scene.getObjectByName(n)))throw Error('Incomplete SkyDrake rig');SKY14.asset=g;SKY14.loading=false;SKY14.error=null;clearTimeout(SKY14.timer);
 }catch(error){disposeSky14(g);fail(error);}},undefined,fail);
}
function buildSky14(){loadSky14();if(!SKY14.asset)return sky14OriginalBuild();const old=SKYDRAKE.asset;let m;try{SKYDRAKE.asset=SKY14.asset;m=sky14OriginalBuild();}finally{SKYDRAKE.asset=old;}m.isSky14=true;m.floorPoints=[];m.floorSkins=new Set();m.rig.traverse(o=>{if(!o.isSkinnedMesh)return;const a=o.geometry.attributes;for(let i=0;i<a.position.count;i++){let foot=false;for(let k=0;k<4;k++)if(a.skinWeight.array[i*4+k]>.25&&/^(foot|toe|ankle)/.test(o.skeleton.bones[a.skinIndex.array[i*4+k]].name))foot=true;if(foot){m.floorPoints.push([o,i]);m.floorSkins.add(o.skeleton);}}});m.actions.idle.reset().play();m.mixer.update(0);m.clip='idle';m.rig.updateMatrixWorld(true);m.gait={phase:.25,active:false,last:null,legs:[],root:m.rig.getObjectByName('root')};m.gait.rootAnimated=m.gait.root.position.clone();
 for(const side of ['L','R']){const thigh=m.rig.getObjectByName('thigh'+side),shin=m.rig.getObjectByName('shin'+side),foot=m.rig.getObjectByName('ankle'+side),toe=m.rig.getObjectByName('toe'+side);m.gait.legs.push({side,thigh,shin,foot,toe,neutral:m.rig.worldToLocal(foot.getWorldPosition(new T.Vector3())),flat:foot.getWorldQuaternion(new T.Quaternion()),toeQ:toe.quaternion.clone(),plant:null,swing:null});}sky14SaveAnimation(m);return m;}
function sky14SaveAnimation(m){for(const l of m.gait.legs)for(const key of ['thigh','shin','foot','toe']){const saved=key+'Animated';if(l[saved])l[saved].copy(l[key].quaternion);else l[saved]=l[key].quaternion.clone();}}
// Visual foot placement only: the encounter continues to own position, speed,
// facing, collision and combat. All targets are instance-local, never saved.
function sky14PlaceFoot(m,leg,target,orientation){
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
function sky14Gait(e,dt,moving,distance,turn){
 const m=e.m,g=m.gait;
 const heading=m.root.getWorldQuaternion(new T.Quaternion());
 if(!moving){
  if(g.active){g.settle=.24;for(const l of g.legs){l.stop=l.lastTarget?l.lastTarget.clone():l.foot.getWorldPosition(new T.Vector3());l.order=l.plant?1:0;}g.active=false;}
  if(g.settle>0&&e.alive&&e.st==='chase'){
   g.settle=Math.max(0,g.settle-dt);const elapsed=.24-g.settle;if(g.settle===0)g.release=.1;
   for(const l of g.legs){const goal=m.rig.localToWorld(l.neutral.clone()),u=Math.max(0,Math.min(1,(elapsed-l.order*.12)/.12)),smooth=u*u*(3-2*u),target=l.stop.clone().lerp(goal,smooth);target.y=Math.max(goal.y,target.y)+Math.sin(u*PI)*.10;sky14PlaceFoot(m,l,target,heading.clone().multiply(l.flat));l.plant=null;}
  }else if(g.release>0&&e.alive&&e.st==='chase'){g.release=Math.max(0,g.release-dt);for(const l of g.legs)sky14PlaceFoot(m,l,m.rig.localToWorld(l.neutral.clone()),heading.clone().multiply(l.flat));}
  else{g.settle=0;g.release=0;for(const l of g.legs){l.plant=null;l.swing=null;}}
  return;
 }
 const starting=!g.active;
 if(starting){g.phase=.25;g.active=true;for(const l of g.legs){l.plant=null;l.swing=null;l.lastTarget=null;}}
 g.phase=(g.phase+(distance+Math.abs(turn)*1.2)/1.495)%1;
 g.root.position.copy(g.rootAnimated);m.actions.walk.time=g.phase*1.2;m.actions.walk.setEffectiveTimeScale(0);m.mixer.update(0);sky14SaveAnimation(m);g.rootAnimated.copy(g.root.position);m.root.updateMatrixWorld(true);const lowered=g.root.getWorldPosition(new T.Vector3());lowered.y-=g.crouch*e.sc;g.root.position.copy(g.root.parent.worldToLocal(lowered));m.root.updateMatrixWorld(true);
 const flat=heading.clone();g.settle=0;g.release=0;
 for(const l of g.legs){const u=(g.phase+(l.side==='R'?.5:0))%1,desired=flat.clone().multiply(l.flat);
  const ground=m.rig.localToWorld(l.neutral.clone()),strideRatio=distance/Math.max(.000001,distance+Math.abs(turn)*1.2),landing=ground.clone().add(new T.Vector3(0,0,.37375*strideRatio).applyQuaternion(heading));
  if(u<.5){if(!l.plant){l.plant=l.lastTarget?l.lastTarget.clone():ground.clone();l.plant.y=ground.y;l.plantQ=desired;}l.swing=null;sky14PlaceFoot(m,l,l.plant,l.plantQ);l.lastTarget=l.plant.clone();}
  else{if(!l.swing){l.swing=l.lastTarget?l.lastTarget.clone():ground.clone();l.swingPhase=starting?u:.5;}l.plant=null;const t=(u-l.swingPhase)/(1-l.swingPhase),s=.5-.5*Math.cos(t*PI),target=l.swing.clone().lerp(landing,s);target.y=ground.y+Math.sin(t*PI)*.145;sky14PlaceFoot(m,l,target,desired);l.lastTarget=target.clone();}
 }
}

EDEF.skydrake.build=buildSky14;
animateSkyDrake=function(e,dt){const m=e.m;if(!m.isSky14)return sky14OriginalAnimate(e,dt);if(m.disposed)return;
 for(const l of m.gait.legs)for(const key of ['thigh','shin','foot','toe'])l[key].quaternion.copy(l[key+'Animated']);m.gait.root.position.copy(m.gait.rootAnimated);m.rig.position.y=0;
 m.b.rotation.set(0,0,0);m.b.position.y=0;m.b.scale.set(1,1,1);
 if(!e.alive){m.warning.visible=false;if(m.clip!=='death'){const old=m.actions[m.clip],next=m.actions.death;next.reset().setEffectiveWeight(1).setEffectiveTimeScale(2.2/(16/60)).play();if(old)next.crossFadeFrom(old,.025,false);m.clip='death';}m.mixer.update(dt);sky14SaveAnimation(m);m.gait.rootAnimated.copy(m.gait.root.position);return;}
 const g=m.gait,last=g.last,distance=last?Math.hypot(e.x-last.x,e.z-last.z):0,turn=last?Math.atan2(Math.sin(e.face-last.face),Math.cos(e.face-last.face)):0;g.last={x:e.x,z:e.z,face:e.face};const moving=e.alive&&e.st==='chase'&&e.y<=.001&&(distance>.00001||Math.abs(turn)>.0001)&&distance<1;
 const wasMoving=e.skyMoving;e.skyMoving=moving||(e.st==='chase'&&(g.active||g.settle>0));sky14OriginalAnimate(e,dt);e.skyMoving=wasMoving;sky14SaveAnimation(m);g.rootAnimated.copy(g.root.position);
 g.crouch=(g.crouch||0)+((moving?.16:0)-(g.crouch||0))*(1-Math.exp(-20*dt));if(!moving){m.root.updateMatrixWorld(true);const pos=g.root.getWorldPosition(new T.Vector3());pos.y-=g.crouch*e.sc;g.root.position.copy(g.root.parent.worldToLocal(pos));m.root.updateMatrixWorld(true);}
 sky14Gait(e,dt,moving,distance,turn);if(e.st==='rec')m.actions.recover.setEffectiveTimeScale(.8/.9);
 // Grounded pose correction uses actual animated foot vertices; does not move the gameplay collider.
 m.rig.position.y=0;if(e.y<=.001){m.rig.updateMatrixWorld(true);const inv=new T.Matrix4().copy(m.rig.matrixWorld).invert(),v=new T.Vector3();let low=Infinity;for(const sk of m.floorSkins)sk.update();for(const [mesh,index] of m.floorPoints){v.fromBufferAttribute(mesh.geometry.attributes.position,index);mesh.boneTransform(index,v);v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);low=Math.min(low,v.y);}m.rig.position.y=Math.max(0,.003-low);}

};
const sky14OriginalUpdate=updateEnemy;
updateEnemy=function(e,s){if(e.m&&e.m.isSky14&&e.dead>0&&!e.m.disposed)animateSkyDrake(e,s/60);return sky14OriginalUpdate(e,s);};
loadSky14();
