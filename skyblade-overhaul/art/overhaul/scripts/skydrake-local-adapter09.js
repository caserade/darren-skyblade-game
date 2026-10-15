/* Local SkyDrake candidate only. Original encounter and saves own gameplay. */
const SKY09={asset:null,loading:false,error:null,retryAt:0,attempts:0,token:0,timer:null};
const sky09OriginalBuild=buildSkyDrake,sky09OriginalAnimate=animateSkyDrake;
function disposeSky09(g){const geo=new Set(),mats=new Set(),tex=new Set(),skins=new Set();if(!g||!g.scene)return;g.scene.traverse(o=>{if(!o.isMesh)return;geo.add(o.geometry);if(o.skeleton)skins.add(o.skeleton);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);for(const t of Object.values(m))if(t&&t.isTexture)tex.add(t);}});for(const s of skins)s.dispose();for(const t of tex){if(t.image&&typeof t.image.close==='function')t.image.close();t.dispose();}for(const m of mats)m.dispose();for(const g of geo)g.dispose();}
function loadSky09(){
 if(SKY09.asset||SKY09.loading||Date.now()<SKY09.retryAt)return;SKY09.loading=true;SKY09.attempts++;const token=++SKY09.token;
 const fail=error=>{if(token!==SKY09.token||!SKY09.loading)return;clearTimeout(SKY09.timer);SKY09.loading=false;SKY09.error=String(error&&error.message||'Candidate unavailable');const delay=Math.min(30000,2000*2**(SKY09.attempts-1));SKY09.retryAt=Date.now()+delay;if(SKY09.attempts<4)SKY09.timer=setTimeout(loadSky09,delay);};
 SKY09.timer=setTimeout(()=>fail(Error('Candidate timed out')),20000);
 new T.GLTFLoader().load('/__skydrake-candidate.glb',g=>{if(token!==SKY09.token||!SKY09.loading){disposeSky09(g);return;}try{
 const required=['idle','walk','turn','hit','stagger','death','takeoff','flyIdle','attackWindup','attack','land','recover','tailWindup','tailWhip'];if(!g.scene||!required.every(n=>g.animations.some(a=>a.name===n&&a.duration>0)))throw Error('Incomplete SkyDrake actions');let skin=0;g.scene.traverse(o=>{if(o.isSkinnedMesh)skin++;if(o.isMesh){o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;}});if(!skin||!['head','jaw','tail6','wing3L','wing3R'].every(n=>g.scene.getObjectByName(n)))throw Error('Incomplete SkyDrake rig');SKY09.asset=g;SKY09.loading=false;SKY09.error=null;clearTimeout(SKY09.timer);
 }catch(error){disposeSky09(g);fail(error);}},undefined,fail);
}
function buildSky09(){loadSky09();if(!SKY09.asset)return sky09OriginalBuild();const old=SKYDRAKE.asset;let m;try{SKYDRAKE.asset=SKY09.asset;m=sky09OriginalBuild();}finally{SKYDRAKE.asset=old;}m.isSky09=true;m.floorPoints=[];m.floorSkins=new Set();m.rig.traverse(o=>{if(!o.isSkinnedMesh)return;const a=o.geometry.attributes;for(let i=0;i<a.position.count;i++){let foot=false;for(let k=0;k<4;k++)if(a.skinWeight.array[i*4+k]>.25&&/^(foot|toe|ankle)/.test(o.skeleton.bones[a.skinIndex.array[i*4+k]].name))foot=true;if(foot){m.floorPoints.push([o,i]);m.floorSkins.add(o.skeleton);}}});m.actions.idle.reset().play();m.mixer.update(0);m.clip='idle';return m;}
EDEF.skydrake.build=buildSky09;
animateSkyDrake=function(e,dt){const m=e.m;if(!m.isSky09)return sky09OriginalAnimate(e,dt);if(m.disposed)return;
 m.b.rotation.set(0,0,0);m.b.position.y=0;m.b.scale.set(1,1,1);
 if(!e.alive){m.warning.visible=false;if(m.clip!=='death'){const old=m.actions[m.clip],next=m.actions.death;next.reset().setEffectiveWeight(1).setEffectiveTimeScale(2.2/(16/60)).play();if(old)next.crossFadeFrom(old,.025,false);m.clip='death';}m.mixer.update(dt);return;}
 sky09OriginalAnimate(e,dt);if(e.st==='rec')m.actions.recover.setEffectiveTimeScale(.8/.9);
 // Grounded pose correction uses actual animated foot vertices; does not move the gameplay collider.
 m.rig.position.y=0;if(e.y<=.001){m.rig.updateMatrixWorld(true);const inv=new T.Matrix4().copy(m.rig.matrixWorld).invert(),v=new T.Vector3();let low=Infinity;for(const sk of m.floorSkins)sk.update();for(const [mesh,index] of m.floorPoints){v.fromBufferAttribute(mesh.geometry.attributes.position,index);mesh.boneTransform(index,v);v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);low=Math.min(low,v.y);}m.rig.position.y=Math.max(0,.003-low);}

};
const sky09OriginalUpdate=updateEnemy;
updateEnemy=function(e,s){if(e.m&&e.m.isSky09&&e.dead>0&&!e.m.disposed)animateSkyDrake(e,s/60);return sky09OriginalUpdate(e,s);};
loadSky09();
