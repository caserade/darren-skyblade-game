/* Sky Drake A: the single authorized addition, distinct from Heavyweight B.
   Supplied 20,402-triangle rig and clips, refined against its approved concept.
   Lives in the existing Gale Spires den; uses existing resources and systems. */
const SKYDRAKE={asset:null,loading:false,error:null,retryAt:0,attempts:0};
function loadSkyDrake(){
 if(SKYDRAKE.asset||SKYDRAKE.loading||Date.now()<SKYDRAKE.retryAt)return;
 SKYDRAKE.loading=true;SKYDRAKE.attempts++;
 new T.GLTFLoader().load('assets/skydrake.glb',g=>{
  try{
   g.scene.updateMatrixWorld(true);const seen=new Set();
   g.scene.traverse(o=>{
    if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
    const mat=o.material;
    if(!seen.has(mat)){seen.add(mat);mat.roughness=Math.max(.78,mat.roughness);mat.envMapIntensity=.12;if(mat.normalScale)mat.normalScale.setScalar(.24);}
    if(o.isSkinnedMesh&&o.geometry.attributes.position.count<100&&o.geometry.attributes.color){
     o.castShadow=false;o.receiveShadow=false;
     mat.vertexColors=false;mat.color.set(0x49b6dd).convertSRGBToLinear();mat.transparent=false;mat.opacity=1;mat.roughness=.9;mat.needsUpdate=true;
    }else if(mat.metalness>.1||mat.userData.skyHorn){
     mat.userData.skyHorn=true;
     // Replace the export's lightning horns with the concept's stout angular gold horns.
     o.geometry.computeBoundingBox();const sign=Math.sign(o.geometry.boundingBox.max.x+o.geometry.boundingBox.min.x)||1;
     o.geometry=toonTube('skyHorn'+sign,[[0,0,0],[sign*.055,.22,-.07],[sign*.16,.32,-.14],[sign*.13,.46,-.23],[sign*.22,.7,-.32]],[.12,.11,.075,.005]);
     mat.color.set(0xd6a026).convertSRGBToLinear();mat.metalness=.08;mat.roughness=.68;
    }else if(!mat.map&&!o.isSkinnedMesh&&mat.color.r>.08&&mat.color.r<.15&&mat.color.b>.4){mat.color.set(0x253a7a).convertSRGBToLinear();}
   });
   refineSkyDrakeWings(g.scene);refineSkyDrakeTail(g.scene);refineSkyDrakeFace(g.scene);
   SKYDRAKE.asset=g;SKYDRAKE.loading=false;SKYDRAKE.error=null;
  }catch(error){skyDrakeLoadFailed(error);}
 },undefined,skyDrakeLoadFailed);
}
function skyDrakeLoadFailed(error){
 SKYDRAKE.loading=false;SKYDRAKE.error=String(error&&error.message||'Creature model unavailable');
 SKYDRAKE.retryAt=Date.now()+Math.min(30000,2000*Math.pow(2,SKYDRAKE.attempts-1));
 console.warn('Sky Drake model could not load; the encounter will retry.');
}
function skyDrakeReady(){loadSkyDrake();return !!SKYDRAKE.asset;}
function refineSkyDrakeWings(sceneRoot){
 const wings=[];sceneRoot.traverse(o=>{if(o.isSkinnedMesh&&o.geometry.attributes.position.count<100&&o.geometry.attributes.color)wings.push(o);});
 const frame=toonMat('skyWingFrame',0x263c7c);
 for(const mesh of wings){
  mesh.geometry.computeBoundingBox();const sign=Math.sign(mesh.geometry.boundingBox.max.x+mesh.geometry.boundingBox.min.x),side=sign>0?'L':'R';
  const bones=mesh.skeleton.bones,bi=n=>bones.findIndex(b=>b.name===n),bone=n=>bones[bi(n)];
  const setWorld=(b,p)=>{b.parent.updateMatrixWorld(true);b.position.copy(b.parent.worldToLocal(new T.Vector3(...p)));sceneRoot.updateMatrixWorld(true);};
  setWorld(bone('wing2'+side),[sign*.98,3.35,-.75]);setWorld(bone('wing3'+side),[sign*1.45,4.05,-.9]);
  for(const name of ['wing1','wing2','wing3']){const b=bone(name+side);for(const child of [...b.children])if(child.isMesh)b.remove(child);}
  const shape=new T.Shape();shape.moveTo(.55,2.7);shape.quadraticCurveTo(1.05,3.25,1.45,4.05);shape.quadraticCurveTo(2.25,3.5,2.68,2.08);shape.quadraticCurveTo(2.28,2.67,2.1,2.02);shape.quadraticCurveTo(1.68,2.58,1.42,1.97);shape.quadraticCurveTo(.96,2.46,.55,2.16);shape.closePath();
  const geo=new T.ShapeGeometry(shape,20),pos=geo.attributes.position,ix=[],weights=[];
  for(let i=0;i<pos.count;i++){
   const x=pos.getX(i),y=pos.getY(i);pos.setXYZ(i,sign*x,y,-.58-.16*x);
   const blend=clamp((x-.55)/.9,0,1);ix.push(bi('chest'),bi('wing3'+side),0,0);weights.push(1-blend,blend,0,0);
  }
  geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(ix,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geo.computeVertexNormals();mesh.geometry=geo;
  const addFrame=(key,parent,points,radii)=>{const pts=points.map(p=>parent.worldToLocal(new T.Vector3(sign*p[0],p[1],p[2])).toArray());toonMesh(parent,toonTube('skyWing-'+side+'-'+key,pts,radii),frame,0,0,0).castShadow=false;};
  const w1=bone('wing1'+side),w2=bone('wing2'+side),w3=bone('wing3'+side),start=w1.getWorldPosition(new T.Vector3());
  addFrame('arm',w1,[[Math.abs(start.x),start.y,start.z],[.98,3.35,-.75]],[.07,.055]);
  addFrame('wrist',w2,[[.98,3.35,-.75],[1.23,3.76,-.84],[1.45,4.05,-.9]],[.055,.04]);
  addFrame('edge',w3,[[1.45,4.05,-.9],[1.85,3.7,-.876],[2.28,2.98,-.945],[2.68,2.08,-1.009]],[.045,.03,.01]);
  for(const [i,p] of [[1,[2.1,2.02,-.916]],[2,[1.42,1.97,-.807]]])addFrame('finger'+i,w3,[[1.45,4.05,-.9],[(1.45+p[0])/2,3.05,(p[2]-.9)/2],p],[.036,.026,.008]);
 }
 sceneRoot.updateMatrixWorld(true);
 sceneRoot.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.calculateInverses();o.bind(o.skeleton,o.bindMatrix.clone());}});
}
function refineSkyDrakeTail(sceneRoot){
 const body=sceneRoot.getObjectByName('skydrake_body');if(!body)return;
 const geo=body.geometry,p=geo.attributes.position,keep=[];let x=0,y=0,n=0;
 for(let i=0;i<p.count;i++)if(p.getZ(i)<-3.8&&p.getZ(i)>-4){x+=p.getX(i);y+=p.getY(i);n++;}x/=n;y/=n;
 for(let i=0;i<(geo.index?geo.index.count:p.count);i+=3){const a=geo.index?geo.index.getX(i):i,b=geo.index?geo.index.getX(i+1):i+1,c=geo.index?geo.index.getX(i+2):i+2;if((p.getZ(a)+p.getZ(b)+p.getZ(c))/3>-3.97)keep.push(a,b,c);}geo.setIndex(keep);
 const tail=sceneRoot.getObjectByName('tail6'),points=[[x,y,-3.83],[x+.12,y-.02,-4.12],[x+.16,y+.16,-4.39],[x+.12,y+.48,-4.46]],local=tail.worldToLocal(new T.Vector3(...points[3]));
 toonMesh(tail,toonTube('skyTailCurl',points.map(v=>tail.worldToLocal(new T.Vector3(...v)).toArray()),[.17,.12,.08,.04]),toonMat('skyTailBlue',0x253783),0,0,0);
 const arrow=toonShape('skyArrowTip',[[0,.45],[-.21,.08],[-.07,.14],[0,-.06],[.07,.14],[.21,.08]],.065);
 toonMesh(tail,arrow,toonMat('skyArrow',0x23366d),local.x,local.y,local.z);
}
function refineSkyDrakeFace(sceneRoot){
 const head=sceneRoot.getObjectByName('head'),jaw=sceneRoot.getObjectByName('jaw'),eyes=[],fangs=[];
 sceneRoot.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh)return;const m=o.material;if(m.map)eyes.push(o);else if(m.color.r>.9&&m.color.g>.8&&m.color.b>.7)fangs.push(o);});
 const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');x.fillStyle='#fff7df';x.fillRect(0,0,128,64);x.fillStyle='#273449';x.beginPath();x.arc(32,32,11,0,TAU);x.fill();x.fillStyle='#101620';x.beginPath();x.arc(32,32,6.5,0,TAU);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(29,28,2.5,0,TAU);x.fill();
 const map=new T.CanvasTexture(c);map.encoding=T.sRGBEncoding;map.flipY=false;
 for(const eye of eyes){eye.material.map=map;eye.material.roughness=.45;eye.material.needsUpdate=true;eye.scale.setScalar(.95);const sign=Math.sign(eye.parent.position.x);for(const sibling of eye.parent.children)if(sibling!==eye&&sibling.isMesh)sibling.rotation.z=sign*.25;}
 for(const fang of fangs)fang.visible=false;
 const pale=toonMat('skyLowerJaw',0x91aecb),ivory=toonMat('skyFangs',0xfff0d2),dark=toonMat('skyNostrils',0x17254a);
 toonMesh(jaw,toonMuzzle(true),pale,0,-.045,.47,.43,.21,.73);
 for(const sign of [-1,1]){
  toonMesh(head,toonTube('skyFang'+sign,[[sign*.1,.03,.75],[sign*.15,-.01,.93],[sign*.17,-.11,1.1],[sign*.16,-.18,1.15]],[.045,.035,.018,.001]),ivory,0,0,0);
  toonMesh(head,GEO.mid,dark,sign*.13,.02,1.16,.033,.047,.018).rotation.x=.15;
 }
}
function cloneSkyDrakeRig(source){
 const copy=source.clone(true),mapping=new Map();
 function map(a,b){mapping.set(a,b);for(let i=0;i<a.children.length;i++)map(a.children[i],b.children[i]);}map(source,copy);
 source.traverse(o=>{if(o.isSkinnedMesh){const c=mapping.get(o);c.skeleton=o.skeleton.clone();c.skeleton.bones=o.skeleton.bones.map(b=>mapping.get(b));c.bind(c.skeleton,o.bindMatrix.clone());}});
 return copy;
}
function buildSkyDrake(){
 const root=new T.Group(),b=grp(root),rig=cloneSkyDrakeRig(SKYDRAKE.asset.scene);b.add(rig);root.name='Sky Drake';
 const mixer=new T.AnimationMixer(rig),actions={};
 for(const clip of SKYDRAKE.asset.animations){const a=mixer.clipAction(clip);if(!['idle','walk','turn','stagger','flyIdle'].includes(clip.name)){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;}actions[clip.name]=a;}
 const warning=new T.Mesh(TOON.geo.skySwoopRing||(TOON.geo.skySwoopRing=new T.RingGeometry(2.96,3.2,64)),TOON.mat.skyWarning||(TOON.mat.skyWarning=new T.MeshBasicMaterial({color:0xffb54c,side:T.DoubleSide,transparent:true,opacity:.7,depthWrite:false})));
 warning.rotation.x=-PI/2;warning.visible=false;root.add(warning);TOON.geo.skyTailRing ||= new T.RingGeometry(4.15,4.4,64);
 const m={root,b,rig,mixer,actions,warning,clip:null,shell:addShell(root,1.3,2.6),disposed:false};
 m.dispose=()=>{if(m.disposed)return;m.disposed=true;mixer.stopAllAction();mixer.uncacheRoot(rig);const skeletons=new Set();rig.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});for(const sk of skeletons)sk.dispose();warning.visible=false;};
 return m;
}
function animateSkyDrake(e,dt){
 const m=e.m;if(!e.alive){m.warning.visible=false;return;}
 let clip='idle';
 if(e.st==='takeoff')clip='takeoff';else if(e.st==='circle')clip='flyIdle';
 else if(e.st==='wind')clip=e.skyAttack==='tail'?'tailWindup':'attackWindup';
 else if(e.st==='atk')clip=e.skyAttack==='tail'?'tailWhip':'attack';
 else if(e.st==='land')clip='land';else if(e.st==='rec')clip='recover';
 else if(['stun','air','down'].includes(e.st))clip='stagger';else if(e.st==='chase'&&e.skyMoving)clip='walk';
 if(m.clip!==clip){const next=m.actions[clip],old=m.actions[m.clip];next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(old)next.crossFadeFrom(old,.12,false);m.clip=clip;}
 m.mixer.update(dt);m.warning.visible=e.st==='wind'&&e.wind;
 if(m.warning.visible){
  const tail=e.skyAttack==='tail',dx=(tail?e.x:e.skyTarget.x)-e.x,dz=(tail?e.z:e.skyTarget.z)-e.z,c=Math.cos(e.face),s=Math.sin(e.face);
  m.warning.geometry=tail?TOON.geo.skyTailRing:TOON.geo.skySwoopRing;
  m.warning.position.set((dx*c-dz*s)/e.sc,(.06-e.y)/e.sc,(dx*s+dz*c)/e.sc);
 }
}
function skyDrakeBrain(e,s,dt,dist,ang,hover,turn,pAlive){
 const home=e.home||islandAt(e.x,e.z),near=pAlive&&dist<22&&(!home||Math.hypot(P.x-home.x,P.z-home.z)<home.r+4);
 const change=st=>{e.st=st;e.t=0;};
 const bound=(x,z)=>{if(!home)return {x,z};const dx=x-home.x,dz=z-home.z,n=Math.hypot(dx,dz),r=Math.max(2,home.r-2);return n>r?{x:home.x+dx/n*r,z:home.z+dz/n*r}:{x,z};};
 e.skyMoving=false;
 if(e.st==='chase'){
  e.y=damp(e.y,0,8,dt);e.wind=false;e.skyGround=(e.skyGround||0)+s;
  if(!near){if(home&&Math.hypot(e.x-home.x,e.z-home.z)>2){const a=Math.atan2(home.x-e.x,home.z-e.z);e.face+=clamp(angDiff(e.face,a),-2*dt,2*dt);e.x+=Math.sin(e.face)*1.4*dt;e.z+=Math.cos(e.face)*1.4*dt;e.skyMoving=true;}return;}
  turn(2.2);if(e.skyGround>=420){change('takeoff');e.skyGround=0;return;}
  if(dist>3.5){e.x+=Math.sin(e.face)*2.3*dt;e.z+=Math.cos(e.face)*2.3*dt;e.skyMoving=true;}
  if(e.cool<=0&&dist<4.4*e.sc&&token(e)){e.skyAttack='tail';e.wind=true;e.hitP=false;change('wind');}
 }else if(e.st==='takeoff'){
  e.y=6.5*smooth(clamp(e.t/60,0,1));if(e.t>=60){change('circle');e.skyOrbit=Math.atan2(e.z-P.z,e.x-P.x);}
 }else if(e.st==='circle'){
  e.y=6.5+Math.sin(G.time*3+e.ph)*.18;e.skyOrbit+=dt*.8;
  const goal=bound((near?P.x:home?home.x:e.x)+Math.cos(e.skyOrbit)*6,(near?P.z:home?home.z:e.z)+Math.sin(e.skyOrbit)*6),dx=goal.x-e.x,dz=goal.z-e.z;
  e.face+=clamp(angDiff(e.face,Math.atan2(dx,dz)),-2.4*dt,2.4*dt);e.x=damp(e.x,goal.x,1.1,dt);e.z=damp(e.z,goal.z,1.1,dt);
  if(!near){e.skyStartY=e.y;change('land');}else if(e.t>=300&&token(e)){e.skyAttack='swoop';e.skyTarget=bound(P.x,P.z);e.wind=true;e.hitP=false;change('wind');}
 }else if(e.st==='wind'){
  if(e.skyAttack==='tail'){if(e.t<21)turn(2);if(e.t>=42){e.wind=false;change('atk');}}
  else{e.face=Math.atan2(e.skyTarget.x-e.x,e.skyTarget.z-e.z);if(e.t>=54){e.skyFrom={x:e.x,y:e.y,z:e.z};e.wind=false;change('atk');}}
 }else if(e.st==='atk'){
  if(e.skyAttack==='tail'){
   if(e.t>=12&&!e.hitP){e.hitP=true;ring(e.x,.12,e.z,.3,8,.3,0x7ed9f5);sfx('whoosh');if(dist<4.4*e.sc&&P.y<1.8)hurtP(e,24,e.x,e.z,false);}if(e.t>=30){e.cool=140;change('rec');}
  }else{
   const k=smooth(clamp(e.t/36,0,1));e.x=lerp(e.skyFrom.x,e.skyTarget.x,k);e.z=lerp(e.skyFrom.z,e.skyTarget.z,k);e.y=lerp(e.skyFrom.y,0,k);
   if(e.t>=36){if(!e.hitP){e.hitP=true;ring(e.x,.12,e.z,.3,12,.35,0x7ed9f5);dust(e.x,e.z,10);sfx('slam');if(Math.hypot(P.x-e.x,P.z-e.z)<3.2*e.sc&&P.y<2.2)hurtP(e,34,e.x,e.z,true);}e.skyStartY=0;change('land');}
  }
 }else if(e.st==='land'){
  e.y=(e.skyStartY||0)*(1-smooth(clamp(e.t/36,0,1)));if(e.t>=36){e.y=0;e.cool=180;e.skyGround=0;change('rec');}
 }else if(e.st==='rec'){e.y=damp(e.y,0,8,dt);if(e.t>=54)change('chase');}
}
EDEF.skydrake={name:'Sky Drake',hp:2400,r:1.25,h:5.5,w:3,sc:1,build:buildSkyDrake,ready:skyDrakeReady};
DATA.enemies.skydrake={name:'Sky Drake',hp:2400,poise:220};
DATA.drops.skydrake=[['feather',3],['cloud',1],['plate',1]];
DATA.adventure.dens.spires.enemies.push(['skydrake',1]);
loadSkyDrake();
