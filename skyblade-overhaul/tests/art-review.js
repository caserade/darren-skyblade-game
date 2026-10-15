/* Local-only visual review of actual production models, with downloadable rendered proof. */
window.__manual=true;G.paused=true;document.body.style.background='#16242e';
document.querySelector('#game').querySelectorAll(':scope > :not(canvas)').forEach(n=>n.style.display='none');
for(const obj of scene.children)if(!obj.isLight)obj.visible=false;
scene.background=new T.Color(0x16242e);scene.fog=null;
const group=new T.Group();scene.add(group);
const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:0x263b44,roughness:1}));floor.rotation.x=-PI/2;floor.position.y=-0.15;group.add(floor);
const models=[buildStormling(),buildWardling(),buildTempest()];
const positions=[-6,-2.5,4];models.forEach((m,i)=>{m.root.position.set(positions[i],i===0?2:0,0);m.root.rotation.y=-0.3;m.root.scale.setScalar(i===0?1.8:i===1?1.8:1);group.add(m.root);});
camera.position.set(12,9.6,25);camera.lookAt(0,2.8,0);camera.fov=42;camera.aspect=16/9;camera.updateProjectionMatrix();renderer.setPixelRatio(1);renderer.setSize(1600,900,false);canvas.style.width='100%';canvas.style.height='100%';canvas.style.objectFit='contain';
world.sun.position.set(0,14,12);world.sun.target.position.set(0,2,0);world.sun.intensity=0.9;
let pose='idle',artTime=0;
const controls=document.createElement('div');controls.style='position:fixed;top:10px;left:10px;z-index:10000;display:flex;gap:8px';document.body.appendChild(controls);
for(const state of ['idle','windup','recovery','kneel']){const b=document.createElement('button');b.textContent=state;b.onclick=()=>{pose=state;artTime=0;};controls.appendChild(b);}
const download=document.createElement('button');download.textContent='Save model review';controls.appendChild(download);
function drawReview(now){
  artTime+=1/60;
  P.m.root.visible=false;
  camera.position.set(6,7.3,20);camera.lookAt(0,2.9,0);camera.fov=38;camera.aspect=16/9;camera.updateProjectionMatrix();
  models.forEach((m,i)=>{
    const st=pose==='windup'?(i===2?'slamW':'wind'):pose==='recovery'?'rec':pose==='kneel'&&i===2?'kneel':i===2?'idle':'chase';
    const e={m,type:['stormling','wardling','tempest'][i],st,t:pose==='windup'?35:15,ph:0,phase:2,lie:0,h:1,x:4,z:0,animTime:artTime,alive:true};
    animateStormEnemy(e,1/60);
    if(i===2){m.aL.rotation.x=m.aR.rotation.x=pose==='windup'?-2.6:pose==='kneel'?-0.75:0;m.torso.rotation.x=pose==='kneel'?0.55:pose==='windup'?-0.22:0;m.root.position.y=pose==='kneel'?-0.7:0;}
  });
  renderer.render(scene,camera);requestAnimationFrame(drawReview);
}
download.addEventListener('click',()=>{
  renderer.render(scene,camera);
  const out=document.createElement('canvas');out.width=1600;out.height=1000;const ctx=out.getContext('2d');ctx.fillStyle='#16242e';ctx.fillRect(0,0,1600,1000);ctx.drawImage(canvas,0,70,1600,900);
  ctx.fillStyle='#e6e1cd';ctx.font='32px sans-serif';ctx.fillText('STORMGLASS REACH  /  IN-GAME MODEL STUDY',48,49);
  ctx.font='20px sans-serif';ctx.fillStyle='#88dbdc';ctx.fillText('Crescent Stormling',80,963);ctx.fillText('Shield Wardling',540,963);ctx.fillText('Tempest Warden',1080,963);
  out.toBlob(async blob=>{const response=await fetch('/__review-image',{method:'POST',body:blob});download.textContent=await response.text();},'image/png');
});
requestAnimationFrame(drawReview);
