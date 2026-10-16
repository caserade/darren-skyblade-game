/* Stormglass art v2: reusable articulated models, concept-matched materials. */
const SGA = {geo:{},mat:null};
function stormMaterials() {
  if(SGA.mat)return SGA.mat;
  const matte=c=>new T.MeshStandardMaterial({color:c,roughness:0.92,flatShading:true});
  return SGA.mat={stone:matte(0x737b6f),light:matte(0x999683),shade:matte(0x515b52),dark:matte(0x202e30),moss:matte(0x3c572d),gold:new T.MeshStandardMaterial({color:0xaa7a32,metalness:0.48,roughness:0.43}),glass:new T.MeshStandardMaterial({color:0x25becf,emissive:0x0087ac,emissiveIntensity:0.45,roughness:0.25,metalness:0.12,flatShading:true}),glassLight:matte(0x6fdce3),core:new T.MeshBasicMaterial({color:0xa6ffff}),amber:new T.MeshBasicMaterial({color:0xffd079}),cloth:matte(0x235966),seam:matte(0x394744)};
}
function sgGeo(key,make){return SGA.geo[key]||(SGA.geo[key]=make());}
function sgMesh(parent,geo,mat,x,y,z,sx=1,sy=sx,sz=sx){const mesh=mk(geo,mat,x,y,z,sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function sgSlab(parent,mat,x,y,z,sx,sy,sz,angle=0){
  const geometry=sgGeo('slab',()=>{const shape=new T.Shape();shape.moveTo(-0.8,-0.5);shape.lineTo(0.71,-0.5);shape.lineTo(1,-0.26);shape.lineTo(0.9,0.29);shape.lineTo(0.64,0.5);shape.lineTo(-0.7,0.46);shape.lineTo(-1,0.18);shape.lineTo(-0.93,-0.29);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:1.7,bevelEnabled:true,bevelSegments:1,bevelThickness:0.12,bevelSize:0.07,steps:1});g.translate(0,0,-0.85);return g;});
  const mesh=sgMesh(parent,geometry,mat,x,y,z,sx,sy,sz);mesh.rotation.y=angle;return mesh;
}
function sgRing(parent,x,y,z,r,tube,mat,arc=TAU,start=0){
  const key='ring'+[r,tube,arc].join('/');const o=sgMesh(parent,sgGeo(key,()=>new T.TorusGeometry(r,tube,6,Math.max(12,Math.round(32*arc/TAU)),arc)),mat,x,y,z);o.rotation.z=start;return o;
}
function sgCrystal(parent,mat,x,y,z,sx,sy,sz,rz=0){const c=sgMesh(parent,sgGeo('crystal',()=>new T.CylinderGeometry(0,0.7,1,5,1)),mat,x,y,z,sx,sy,sz);c.rotation.z=rz;return c;}
function sgCrack(parent,x,y,z,s=1){const m=stormMaterials();for(let i=0;i<3;i++){const o=sgMesh(parent,GEO.box,m.seam,x+(i%2)*0.08*s,y-i*0.13*s,z,0.025*s,0.17*s,0.012*s);o.rotation.z=i%2?0.5:-0.35;}}
function sgMoss(parent,x,y,z,s=1){const m=stormMaterials();for(let i=0;i<3;i++){sgMesh(parent,GEO.rock0,m.moss,x+(i-1)*0.18*s,y+0.025*i*s,z,0.25*s,0.09*s,0.2*s);}}
function sgCore(parent,x,y,z,r,material){const m=stormMaterials();sgRing(parent,x,y,z,r,r*0.18,m.gold);sgMesh(parent,GEO.octa,material||m.core,x,y,z+0.04,r*0.74,r*0.86,r*0.3);}
function sgWingGeometry(){return sgGeo('crescent',()=>{
  const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(0.45,-0.2);shape.lineTo(0.95,-0.16);shape.lineTo(1.35,0.15);shape.lineTo(1.6,0.74);shape.lineTo(1.53,1.03);shape.lineTo(1.24,0.5);shape.lineTo(0.84,0.24);shape.lineTo(0.38,0.18);shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:0.1,bevelEnabled:true,bevelThickness:0.03,bevelSize:0.025,bevelSegments:1,steps:1});geo.computeVertexNormals();return geo;
});}
function buildStormling(){
  const m=stormMaterials(),root=new T.Group(),b=grp(root,0,0.35,0),body=grp(b);
  sgMesh(body,GEO.rock0,m.dark,0,0,0,0.39,0.32,0.48);
  for(const s of [-1,1]){sgSlab(body,m.light,s*0.22,0.08,0.14,0.2,0.55,0.42,s*0.45);sgMesh(body,GEO.box,m.gold,s*0.32,-0.03,0.32,0.055,0.43,0.07).rotation.z=-s*0.4;}
  sgCore(body,0,0,0.48,0.22);sgCrystal(body,m.glass,0,0.43,-0.05,0.23,0.6,0.28,-0.3);
  const wL=grp(b,0.32,0,-0.04),wR=grp(b,-0.32,0,-0.04),tips=[];
  for(const [wing,s] of [[wL,1],[wR,-1]]){
    const mount=grp(wing);mount.scale.x=s;
    sgRing(mount,0.12,0,0.04,0.13,0.045,m.gold);
    sgMesh(mount,sgWingGeometry(),m.glass,0.13,0,0,0.82,0.82,1);
    for(let j=0;j<3;j++){const line=sgMesh(mount,GEO.box,m.glassLight,0.45+j*0.24,0.02+j*0.13,0.14,0.018,0.36,0.016);line.rotation.z=-0.6-j*0.15;}
    const tip=grp(mount,1.17,0.42,0);sgCrystal(tip,m.glassLight,0,0.2,0,0.14,0.56,0.16,-0.35);tips.push(tip);
  }
  const tail=[];let joint=grp(b,0,0,-0.34);
  for(let i=0;i<3;i++){const t=grp(joint,0,0,-0.24);sgMesh(t,GEO.box,m.gold,0,0,-0.1,0.045,0.045,0.3);tail.push(t);joint=t;}
  sgMesh(joint,GEO.octa,m.glass,0,0,-0.27,0.14,0.08,0.32);
  const glow=sgMesh(body,GEO.octa,m.core,0,0,0.54,0.1,0.11,0.06);
  root.name='Stormling — crescent ray';return {root,b,body,wL,wR,tips,tail,glow,shell:addShell(root,0.75,0.65)};
}
function buildWardling(){
  const m=stormMaterials(),root=new T.Group(),b=grp(root),hips=grp(b,0,0.65,0),torso=grp(b,0,1.13,0);
  sgSlab(torso,m.dark,0,0,0,0.52,0.74,0.37);
  for(const s of [-1,1]){sgSlab(torso,m.light,s*0.26,0.05,0.12,0.29,0.7,0.35,s*0.3);sgSlab(torso,m.stone,s*0.56,0.36,-0.02,0.38,0.35,0.43,s*0.25);}
  sgCore(torso,0,0.04,0.49,0.19,m.stone);sgCrack(torso,-0.35,0.25,0.45,0.7);
  const hd=grp(torso,0,0.56,0.05);sgSlab(hd,m.dark,0,0,0,0.32,0.4,0.29);
  sgMesh(hd,GEO.box,m.amber,0,0.04,0.3,0.43,0.075,0.035);
  sgSlab(hd,m.light,0,0.23,0.04,0.44,0.18,0.4,-0.18);sgMoss(hd,-0.12,0.35,-0.02,0.6);
  const aL=grp(b,0.69,1.38,0),aR=grp(b,-0.69,1.38,0),shields=[],spikes=[];
  for(const [a,s] of [[aL,1],[aR,-1]]){
    sgMesh(a,GEO.rock0,m.dark,0,-0.14,0,0.18,0.28,0.2);
    const shield=grp(a,0,-0.35,0.23);sgSlab(shield,m.gold,0,-0.12,0.04,0.34,0.91,0.23,-0.16*s);sgSlab(shield,m.light,0,-0.12,0.1,0.29,0.8,0.22,-0.16*s);
    sgRing(shield,0,-0.1,0.33,0.17,0.025,m.gold);sgCrack(shield,-0.15,0.15,0.33,0.8);shields.push(shield);
    const seal=sgMesh(shield,GEO.octa,m.amber,0,-0.1,0.34,0.04,0.07,0.02);spikes.push(seal);
    sgSlab(a,m.shade,0,-0.88,0.1,0.25,0.24,0.27);
  }
  const legs=[];
  for(const s of [-1,1]){const leg=grp(hips,s*0.29,0,0);sgMesh(leg,GEO.rock0,m.dark,0,-0.12,0,0.16,0.25,0.17);sgSlab(leg,m.stone,0,-0.3,0.05,0.24,0.35,0.24);sgSlab(leg,m.light,0,-0.48,0.15,0.26,0.22,0.38);legs.push(leg);}
  root.name='Wardling — shield sentinel';return {root,b,torso,hd,hips,aL,aR,shields,legs,spikes,shell:addShell(root,1,1.2)};
}
function buildTempest(){
  const m=stormMaterials(),root=new T.Group(),b=grp(root),legs=[];
  for(const s of [-1,1]){
    const leg=grp(b,s*0.95,1.85,0);sgMesh(leg,GEO.rock,m.dark,0,-0.6,0,0.58,0.92,0.6);
    for(let i=0;i<3;i++)sgSlab(leg,i===1?m.light:m.stone,s*0.07,-0.35-i*0.43,0.2,0.71,0.56,0.63,0.4*s+i*0.2);
    sgSlab(leg,m.light,0,-1.58,0.36,0.84,0.45,0.97,-0.2*s);sgMoss(leg,s*0.3,-1.31,0.5,1.5);legs.push(leg);
  }
  sgSlab(b,m.shade,0,2,0,1.52,0.9,1.0);
  const torso=grp(b,0,2.4,0);sgMesh(torso,GEO.rock,m.dark,0,1.35,-0.15,1.7,1.6,1.2);
  for(const s of [-1,1]){
    for(let j=0;j<3;j++)sgSlab(torso,j%2?m.light:m.stone,s*(0.6+j*0.18),0.7+j*0.7,0.48,0.86,0.81,0.73,s*(0.32-j*0.15));
    sgSlab(torso,m.light,s*2.06,2.35,-0.08,1.09,0.8,0.92,s*0.45);sgSlab(torso,m.stone,s*2.17,2.75,-0.27,0.9,0.47,0.84,s*0.1);sgMoss(torso,s*1.85,3.02,0,2);
    sgCrack(torso,s*1.08,2.4,1.17,2.1);
  }
  sgCore(torso,0,1.42,1.13,0.44,m.stone);
  sgMesh(torso,GEO.box,m.gold,0,0.71,1.06,0.11,0.62,0.06);sgMesh(torso,GEO.box,m.gold,0,2.03,1.08,0.12,0.5,0.06);
  const head=grp(torso,0,3,0.7);sgMesh(head,GEO.rock0,m.dark,0,0.02,0,0.64,0.66,0.62);
  for(const s of [-1,1])sgSlab(head,m.light,s*0.41,0.1,0.17,0.25,0.89,0.47,-s*0.5);
  sgSlab(head,m.stone,0,0.66,-0.05,0.55,0.26,0.53,0.4);sgCore(head,0,0.02,0.64,0.4);
  const eye=sgMesh(head,GEO.octa,m.core,0,0.02,0.78,0.19,0.24,0.07),halo=grp(head,0,0.4,-0.8);
  for(let i=0;i<5;i++){
    sgRing(halo,0,0,0,1.38,0.115,m.gold,0.83,i*1.2);
    const a=i*1.2;sgMesh(halo,GEO.box,m.light,Math.cos(a)*1.38,Math.sin(a)*1.38,0,0.23,0.24,0.25).rotation.z=a;
  }
  const parts={},back=grp(torso,0,2.2,-1.55),backM=m.glass.clone();
  sgRing(back,0,0,0,0.74,0.12,m.gold);for(let j=0;j<3;j++)sgMesh(back,GEO.octa,backM,(j-1)*0.43,0,-0.16,0.32,1.05-Math.abs(j-1)*0.2,0.36);
  parts.back={node:back,mat:backM,hp:450,alive:true,name:'Storm core'};
  const arms=[];
  for(const [s,key] of [[1,'armL'],[-1,'armR']]){
    const arm=grp(torso,s*2.55,2.3,0);sgMesh(arm,GEO.rock,m.dark,0,-1.15,0,0.5,1.2,0.52);
    for(let j=0;j<3;j++)sgSlab(arm,j%2?m.shade:m.stone,0,-0.5-j*0.65,0.05,0.68,0.8,0.67,j*0.5);
    sgSlab(arm,m.light,0,-3,0.08,0.77,0.8,0.73);sgMoss(arm,0.1,-0.03,0.24,1.2);
    const crystal=grp(arm,s*0.57,-2.25,0.45),cm=m.glass.clone();
    for(let j=0;j<5;j++){
      const x=(j%3-1)*0.33,y=(j>2?-0.52:0.12),z=(j>2?0.18:0);
      sgMesh(crystal,GEO.octa,cm,x,y,z,0.34,0.78+(j%2)*0.3,0.35).rotation.z=-s*(0.13+j*0.09);
    }
    parts[key]={node:crystal,mat:cm,hp:320,alive:true,name:s>0?'Left storm crystal':'Right storm crystal'};arms.push(arm);
  }
  root.name='Tempest Warden — stone guardian';return {root,b,torso,head,eye,halo,legs,aL:arms[0],aR:arms[1],parts,shell:addShell(root,3.2,3.6)};
}
/* Secondary motion layers over existing authoritative attack poses. No hitboxes or timers change. */
function animateStormEnemy(e,dt){
  const m=e.m,t=(e.animTime=(e.animTime||0)+dt),wind=e.st==='wind',rec=e.st==='rec',move=e.st==='chase';
  if(e.type==='stormling'){
    const charge=wind?clamp(e.t/48,0,1):0,recoil=rec?Math.max(0,1-e.t/22):0;
    m.wL.rotation.z=damp(m.wL.rotation.z,0.12+Math.sin(t*5+e.ph)*0.18+charge*0.55,14,dt);m.wR.rotation.z=-m.wL.rotation.z;
    m.wL.rotation.y=-charge*0.35;m.wR.rotation.y=charge*0.35;
    m.body.rotation.x=-charge*0.22+recoil*0.4;m.body.position.z=-recoil*0.17;
    m.tips.forEach((p,i)=>p.rotation.z=Math.sin(t*6+i)*0.12);
    m.tail.forEach((p,i)=>{p.rotation.y=Math.sin(t*3-i*0.65)*0.22;p.rotation.x=charge*0.12;});
    m.glow.scale.setScalar(0.1*(1+charge*0.8));
    m.b.position.y=e.lie*0.35*e.h+0.35+Math.sin(t*3)*0.065;
  }else if(e.type==='wardling'){
    const atk=e.st==='atk',gait=move?Math.sin(t*7):atk?Math.sin(t*17):0;
    m.legs[0].rotation.x=gait*0.36;m.legs[1].rotation.x=-gait*0.36;
    m.hips.position.y=0.65-(wind?0.12:0);m.torso.position.y=1.13-(wind?0.14:0)+Math.abs(gait)*0.025;
    m.aL.rotation.x=m.aR.rotation.x=wind?-0.95:atk?-0.8:rec?0.22:-0.16;
    m.aL.rotation.z=wind?-0.15:0.1;m.aR.rotation.z=-m.aL.rotation.z;
    m.hd.rotation.x=wind?0.1:rec?0.25:Math.sin(t*1.2)*0.04;
    m.shields.forEach((p,i)=>p.rotation.y=(i?1:-1)*(wind?0.18:rec?0.6:0.08));
    if(e.st==='stun')m.hd.rotation.z=Math.sin(t*15)*0.1;else m.hd.rotation.z=0;
  }else if(e.type==='tempest'){
    for(const part of Object.values(m.parts))if(part.alive)part.mat.emissiveIntensity=0.25+(e.phase>=2?0.15:0)+Math.sin(t*3)*0.055;
    m.head.rotation.y=Math.sin(t*0.8)*0.035;
    const walking=e.st==='idle'&&Math.hypot(P.x-e.x,P.z-e.z)>5,gait=walking?Math.sin(t*3):0;
    m.legs[0].rotation.x=gait*0.15;m.legs[1].rotation.x=-gait*0.15;
    m.halo.rotation.z=t*(e.phase>=2?0.22:0.08);m.halo.rotation.y=Math.sin(t*1.3)*0.07;
    m.eye.scale.set(0.19,0.24,0.07).multiplyScalar(e.st==='dead'?Math.max(0,1-e.t/100):1+Math.sin(t*4)*0.09);
    if(e.st==='kneel'){m.legs[0].rotation.x=0.35;m.legs[1].rotation.x=0.35;m.halo.rotation.x=0.3;}
    else m.halo.rotation.x=e.st==='dead'?Math.min(1.2,e.t/140):0;
  }
}
