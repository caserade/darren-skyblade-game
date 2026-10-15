/* Local review only: frame Darren and an elevated locked SkyDrake together.
   The existing camera still owns input, collision, dialogue, FOV and shake. */
const SKY_CAM15={enabled:true,offset:new T.Vector3(),extraDistance:0,active:false,last:null};
const skyCamera15Original=updateCamera;
updateCamera=function(rdt){
 camera.updateProjectionMatrix();
 skyCamera15Original(rdt);
 const c=SKY_CAM15,e=P.lock,portraitTouch=COARSE&&camera.aspect<.75;
 if(!c.enabled||G.mode!=='play'||G.cine||!e||!e.alive||!(e.type==='skydrake'||portraitTouch&&['chomprex','stormbelly'].includes(e.type))){
  c.offset.set(0,0,0);c.extraDistance=0;c.active=false;c.last=null;return;
 }
 const elevation=e.y-P.y,blend=1,dt=G.paused?0:rdt;
 const base=new T.Vector3(cam.fx,cam.fy+.25,cam.fz),back=camera.position.clone().sub(base),baseDistance=back.length();back.normalize();
 const radius=Math.max(e.r,2.8*e.sc),bottom=Math.min(P.y,e.y),top=Math.max(P.y+2.4,e.y+e.h+.35);
 const minX=Math.min(P.x-.6,e.x-radius),maxX=Math.max(P.x+.6,e.x+radius),minZ=Math.min(P.z-.6,e.z-radius),maxZ=Math.max(P.z+.6,e.z+radius);
 const center=new T.Vector3((minX+maxX)*.5,(bottom+top)*.5,(minZ+maxZ)*.5),wantOffset=center.sub(base).multiplyScalar(blend);
 c.offset.lerp(wantOffset,1-Math.exp(-6*dt));const target=base.clone().add(c.offset);
 camera.updateMatrixWorld(true);const right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
 const tanV=Math.tan(camera.fov*Math.PI/360)*(portraitTouch?.5:.86),tanH=tanV*camera.aspect;let needed=baseDistance;
 for(const x of [minX,maxX])for(const y of [bottom,top])for(const z of [minZ,maxZ]){
  const q=new T.Vector3(x,y,z).sub(target),depth=q.dot(back);needed=Math.max(needed,depth+Math.abs(q.dot(up))/tanV,depth+Math.abs(q.dot(right))/tanH);
 }
 const wantExtra=Math.max(0,Math.min(portraitTouch?32:24,needed)-baseDistance)*blend;
 if(dt>0)c.extraDistance=Math.max(wantExtra,damp(c.extraDistance,wantExtra,4,dt));
 c.active=blend>0||c.offset.lengthSq()>1e-6||c.extraDistance>.001;
 if(c.active){camera.position.copy(target).addScaledVector(back,baseDistance+c.extraDistance);constrainCamera(target.x,target.y,target.z);camera.lookAt(target);}
 if(portraitTouch){camera.projectionMatrix.elements[9]=-.12;camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();}
 c.last={portraitTouch,elevation,blend,baseDistance,extraDistance:c.extraDistance,target:target.toArray(),camera:camera.position.toArray()};
};
