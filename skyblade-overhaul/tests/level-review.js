/* Local-only authored scenery review. Does not play or save a campaign. */
window.__manual=true;loadChapter('ch3');G.paused=true;
document.querySelector('#game').querySelectorAll(':scope > :not(canvas)').forEach(n=>n.style.display='none');
const controls=document.createElement('div');controls.style='position:fixed;top:10px;left:10px;z-index:10000;display:flex;gap:8px';document.body.appendChild(controls);
let target=[0,0],distance=30;
for(const [label,x,z,d] of [['Landing',0,0,28],['Gardens',34,-6,30],['Observatory',63,-37,32],['Warden arena',30,-82,40]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{target=[x,z];distance=d;};controls.appendChild(b);}
function reviewFrame(){G.time+=1/60;animateStormScenery(1/60);P.m.root.visible=false;camera.position.set(target[0]+distance*0.6,distance*0.75,target[1]+distance);camera.lookAt(target[0],1,target[1]);renderer.render(scene,camera);requestAnimationFrame(reviewFrame);}
requestAnimationFrame(reviewFrame);
