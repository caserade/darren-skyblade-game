/* Local-only material, apron and selected enemy review. */
(async()=>{
window.__manual=true;G.paused=true;
for(let i=0;i<160&&(!P.m.skin||!LV.mom.skin);i++)await new Promise(r=>setTimeout(r,25));
document.querySelector('#game').querySelectorAll(':scope > :not(canvas)').forEach(n=>n.style.display='none');
scene.children.forEach(o=>{if(!o.isLight)o.visible=false;});scene.background=new T.Color(0x1b2b36);scene.fog=null;
const reviewRoot=new T.Group();scene.add(reviewRoot);
const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:0x465a63,roughness:1}));floor.rotation.x=-PI/2;floor.position.y=-0.02;reviewRoot.add(floor);
const toonMode=location.search.includes('toons');let models;
if(toonMode){models=[buildRoundEnemy(true),buildRoundEnemy(false)];models.forEach(m=>reviewRoot.add(m.root));}
else{models=[P.m,LV.mom];models.forEach(m=>{m.root.visible=true;});}
renderer.setPixelRatio(1);renderer.setSize(1400,900,false);canvas.style.objectFit='contain';
const controls=document.createElement('div');controls.style='position:fixed;top:10px;left:10px;z-index:10000;display:flex;gap:8px';document.body.appendChild(controls);
let angle=-0.25,pose='idle',tm=0;
window.__modelReview={models,setPose:state=>{pose=state;}};
for(const [label,fn] of [['Front',()=>angle=0],['Side',()=>angle=-1.25],['Back',()=>angle=Math.PI],['Three-quarter',()=>angle=-.65],['Animate',()=>pose=pose==='idle'?'wind':'idle'],['Save preview',save]]){const b=document.createElement('button');b.textContent=label;b.onclick=fn;controls.appendChild(b);}
function save(){renderer.render(scene,camera);const out=document.createElement('canvas');out.width=1400;out.height=960;const c=out.getContext('2d');c.fillStyle='#1b2b36';c.fillRect(0,0,1400,960);c.drawImage(canvas,0,0);c.fillStyle='#efdfba';c.font='25px sans-serif';c.fillText(toonMode?'STORMBELLY':'DARREN — MATTE TOON FINISH',100,925);c.fillText(toonMode?'CHOMP REX':'MOM — TAILORED CLOTH APRON',790,925);out.toBlob(async blob=>{const r=await fetch(toonMode?'/__toon-image':'/__character-image',{method:'POST',body:blob});controls.lastChild.textContent=await r.text();});}
function frame(){tm+=1/60;models.forEach((m,i)=>{
  m.root.position.set((i?1:-1)*(toonMode?2.1:0.95),0,0);m.root.rotation.y=angle;
  if(toonMode){animateToonEnemy({m,type:i?'chomprex':'stormbelly',st:pose,t:35,animTime:tm,alive:true,y:0},1/60);m.warning.visible=false;}
  else if(i===0)applySkin(m,BASE,tm);else animMom(m,tm,false,1/60);
});camera.position.set(0,toonMode?3:1.65,toonMode?10.5:5.5);camera.lookAt(0,toonMode?1.75:1,0);camera.fov=40;camera.aspect=14/9;camera.updateProjectionMatrix();world.sun.position.set(-3,8,5);world.sun.target.position.set(0,1,0);renderer.render(scene,camera);requestAnimationFrame(frame);}
frame();
})();

