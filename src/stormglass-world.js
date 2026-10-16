/* Authored landmarks and animated props; all walkable floors keep the existing collision height. */
function sgStoneFloor(){
  if(SGA.floor)return SGA.floor;
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#485351';x.fillRect(0,0,512,512);
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    const v=(row*17+col*31)%23; x.fillStyle=`rgb(${103+v},${112+v},${111+v})`;x.fillRect(col*64+2,row*64+2,60,60);
    x.strokeStyle='#3f504b';x.lineWidth=1.5;if((row+col)%3===0){x.beginPath();x.moveTo(col*64+28,row*64+4);x.lineTo(col*64+35,row*64+22);x.lineTo(col*64+26,row*64+30);x.stroke();}
    if((row*3+col)%5===0){x.fillStyle='#647c58';x.fillRect(col*64+3,row*64+3,16,3);}
  }
  const map=new T.CanvasTexture(c);map.encoding=T.sRGBEncoding;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(4,4);map.anisotropy=4;
  return SGA.floor=new T.MeshStandardMaterial({map,roughness:0.96});
}
function sgBanner(parent,x,y,z,scale=1,angle=0){
  const m=stormMaterials(),g=grp(parent,x,y,z);g.rotation.y=angle;g.scale.setScalar(scale);
  sgMesh(g,GEO.lowCyl,m.gold,-0.64,0.1,0,0.055,2.4,0.055);sgMesh(g,GEO.box,m.gold,0,1.25,0,1.6,0.07,0.07);
  const geo=new T.PlaneGeometry(1.12,2,5,8);geo.translate(0,0.12,0);
  const flag=new T.Mesh(geo,new T.MeshStandardMaterial({color:0x205460,map:POLISH.textures.cloth,bumpMap:POLISH.textures.cloth,bumpScale:0.016,roughness:0.9,side:T.DoubleSide}));flag.position.set(0,0.15,0.02);g.add(flag);
  const seal=sgRing(g,0,0.23,0.045,0.21,0.025,m.gold);sgMesh(g,GEO.box,m.gold,0,0.23,0.065,0.02,0.77,0.02);
  SG.flags.push({g,flag,seal,base:Array.from(geo.attributes.position.array),phase:x+z});return g;
}
function sgArch(parent,x,z,width=4,height=5,angle=0,broken=false){
  const m=stormMaterials(),g=grp(parent,x,0,z);g.rotation.y=angle;
  for(const s of [-1,1]){
    const px=s*width*0.5;sgSlab(g,m.shade,px,0.2,0,0.72,0.4,0.68);
    for(let j=0;j<Math.floor(height/0.72);j++)sgMesh(g,GEO.box,j%2?m.stone:m.light,px,0.68+j*0.69,0,0.74,0.65,0.85);
    sgSlab(g,m.gold,px,height-0.15,0,0.53,0.16,0.54);
    const p=new T.Vector3(px,0,0);g.localToWorld(p); // parent matrices are updated below before collision conversion
    SG.solidProps.push({g,local:new T.Vector3(px,0,0),r:0.57,height});
  }
  for(let j=0;j<7;j++){
    if(broken&&j===2)continue;const a=(j+0.5)/7*PI,o=sgMesh(g,GEO.box,m.light,Math.cos(a)*width/2,height+Math.sin(a)*width/2,0,0.9,0.7,0.86);o.rotation.z=a-PI/2;
  }
  sgMoss(g,-width/2,height+0.15,0.15,1.8);return g;
}
function sgBeacon(parent,x,z){
  const m=stormMaterials(),g=grp(parent,x,0,z),dynamic=grp(SG.animated,x,0,z);
  for(let i=0;i<3;i++)sgSlab(g,i===2?m.gold:m.stone,0,0.17+i*0.3,0,1.18-i*0.18,0.3,1.18-i*0.18);
  for(let i=0;i<4;i++)sgSlab(g,i%2?m.light:m.stone,0,1.12+i*0.53,0,0.48,0.53,0.5,i*0.4);
  sgSlab(g,m.gold,0,3.22,0,0.82,0.16,0.82);
  for(let i=0;i<5;i++){const a=i*TAU/5,bar=sgMesh(g,GEO.lowCyl,m.gold,Math.sin(a)*0.55,3.82,Math.cos(a)*0.55,0.055,1.25,0.055);bar.rotation.z=Math.cos(a)*0.18;bar.rotation.x=Math.sin(a)*0.18;}
  sgSlab(g,m.gold,0,4.44,0,0.35,0.18,0.35);sgCrystal(g,m.gold,0,4.72,0,0.3,0.6,0.3);
  const lamp=sgMesh(dynamic,GEO.octa,m.glass.clone(),0,3.8,0,0.38,0.65,0.38);
  const beam=new T.Mesh(sgGeo('beacon-beam',()=>new T.CylinderGeometry(0.055,0.12,24,8)),new T.MeshBasicMaterial({color:0xffcb71,transparent:true,opacity:0.28,depthWrite:false}));beam.position.y=16;beam.visible=false;dynamic.add(beam);
  const halo=sgRing(dynamic,0,3.8,0,0.75,0.028,m.gold);halo.rotation.x=PI/2;
  sgBanner(SG.animated,x+0.7,1.64,z+0.2,0.48);
  SG.solidProps.push({g,local:new T.Vector3(),r:1.1,height:4.8});return {g:dynamic,lamp,beam,halo};
}
function sgBakeStatic(root){
  root.updateMatrixWorld(true);const groups=new Map();
  root.traverse(o=>{if(!o.isMesh)return;let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);
    let entry=groups.get(o.material);if(!entry){entry={p:[],n:[],u:[]};groups.set(o.material,entry);}
    for(const [key,name,size] of [['p','position',3],['n','normal',3],['u','uv',2]]){const attr=geo.attributes[name];if(attr){for(const v of attr.array)entry[key].push(v);}else for(let i=0;i<geo.attributes.position.count*size;i++)entry[key].push(0);}
    geo.dispose();
  });
  const baked=new T.Group();baked.name='Stormglass static scenery';
  for(const [mat,a] of groups){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(a.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(a.n,3));geo.setAttribute('uv',new T.Float32BufferAttribute(a.u,2));geo.computeBoundingSphere();const mesh=new T.Mesh(geo,mat);mesh.receiveShadow=true;mesh.castShadow=true;baked.add(mesh);SG.ownedGeometries.push(geo);}
  return baked;
}
function disposeStormScenery(){
  if(SG.animated)SG.animated.traverse(o=>{if(o.isMesh&&o.userData.owned){o.geometry.dispose();o.material.dispose();}});
  for(const flag of SG.flags||[]){flag.flag.geometry.dispose();flag.flag.material.dispose();}
  for(const beacon of SG.beacons||[]){beacon.lamp.material.dispose();if(beacon.beam)beacon.beam.material.dispose();}
  for(const geo of SG.ownedGeometries||[])geo.dispose();
  SG.ownedGeometries=[];SG.flags=[];SG.solidProps=[];SG.orrery=null;SG.bell=null;SG.animated=null;
}
function buildStormglassScenery(){
  const m=stormMaterials(),staticRoot=new T.Group();SG.animated=new T.Group();SG.animated.name='Stormglass animated props';LV.root.add(SG.animated);
  for(const I of Object.values(LV.islands)){
    I.g.children[0].material=[m.shade,sgStoneFloor(),m.shade];I.g.children[1].material=m.dark;
    // Broken masonry follows the perimeter, leaving the central fighting space and every exit open.
    for(let j=0;j<28;j++){
      const a=j/28*TAU;if(I.exits.some(e=>Math.abs(angDiff(a,e))<0.26))continue;
      const x=I.x+Math.sin(a)*(I.r-0.8),z=I.z+Math.cos(a)*(I.r-0.8);
      sgSlab(staticRoot,j%4?m.stone:m.light,x,0.16,z,0.85,0.34,0.7,a);
      if(j%4===0){sgMoss(staticRoot,x,0.4,z,1.7);sgSlab(staticRoot,m.shade,x,-1.9,z,0.7,2,0.5,a);}
    }
    const circle=sgRing(staticRoot,I.x,0.045,I.z,I.r*0.55,0.035,m.gold);circle.rotation.x=PI/2;
    for(let j=0;j<12;j++){const a=j*TAU/12;sgMesh(staticRoot,GEO.box,m.gold,I.x+Math.sin(a)*I.r*0.55,0.04,I.z+Math.cos(a)*I.r*0.55,0.1,0.045,0.55).rotation.y=a;}
  }
  // Lantern Landing: gateway and standards.
  sgArch(staticRoot,-4,-5,4.3,3.8,-0.35,true);sgBanner(SG.animated,-7,3,-5,0.95,-0.35);sgBanner(SG.animated,7,2.3,5,0.75,1.2);
  // Gale Gardens: broken colonnade and wind instruments.
  sgArch(staticRoot,38,-13,4.1,4.2,0.45,true);sgArch(staticRoot,27,-14,3.2,2.9,-0.3,true);
  // Observatory: a turning brass orrery above a low plinth on the outer side.
  sgSlab(staticRoot,m.shade,70,0.27,-42,1.65,0.54,1.65);SG.solidProps.push({g:staticRoot,local:new T.Vector3(70,0,-42),r:1.7});
  const orrery=grp(SG.animated,70,2.35,-42);sgMesh(orrery,GEO.octa,m.glass,0,0,0,0.38,0.62,0.38);const axes=[];
  for(let i=0;i<3;i++){const a=grp(orrery);a.rotation.x=i*0.8;sgRing(a,0,0,0,1.25+i*0.12,0.042,m.gold);sgMesh(a,GEO.octa,m.core,1.25+i*0.12,0,0,0.09,0.09,0.09);axes.push(a);}SG.orrery={g:orrery,axes};
  sgArch(staticRoot,58,-47,4.7,4.3,0.4,true);sgBanner(SG.animated,54,3,-41,0.95,-0.5);
  // Eye of the Storm: bell tower stands behind the battle arena, not across the entrance.
  const tower=sgArch(staticRoot,30,-95,6.2,7.2,0,false);sgArch(staticRoot,18,-88,3.6,4,0.65,true);sgArch(staticRoot,43,-88,3.8,4,-0.65,true);
  sgMesh(tower,GEO.box,m.shade,0,9.9,0,8,0.5,1.8);sgMoss(tower,-2.8,10.2,0,3);
  const bell=grp(SG.animated,30,7.3,-95);sgMesh(bell,GEO.lowCyl,m.gold,0,-0.15,0,0.05,1.1,0.05);
  const bellMesh=sgMesh(bell,sgGeo('bell',()=>new T.CylinderGeometry(0.4,0.92,1.6,16,1,true)),m.gold,0,-1.4,0);bellMesh.material=m.gold;
  const rim=sgRing(bell,0,-2.2,0,0.93,0.09,m.gold);rim.rotation.x=PI/2;sgMesh(bell,GEO.mid,m.dark,0,-2,0,0.15,0.24,0.15);SG.bell=bell;
  sgBanner(SG.animated,26,6.5,-94.4,1.2);sgBanner(SG.animated,34,6.5,-94.4,1.2);
  for(const id of ['gale','archive','eye']){const I=LV.islands[id],beacon=sgBeacon(staticRoot,I.x-I.r*0.48,I.z-I.r*0.5);SG.beacons.push({id,...beacon});}
  for(const d of CH.updrafts){
    const g=grp(SG.animated,d.x,0,d.z),rings=[],streams=[];
    const foot=sgRing(staticRoot,d.x,0.09,d.z,d.r,0.12,m.gold);foot.rotation.x=PI/2;
    for(let i=0;i<3;i++){const r=sgRing(g,0,0.4+i*1.8,0,d.r,0.08,m.gold);r.rotation.x=PI/2;rings.push(r);}
    for(let i=0;i<4;i++){const stream=sgMesh(g,GEO.octa,m.glassLight,0,0,0,0.06,0.25,0.06);streams.push(stream);}
    const crystal=sgMesh(g,GEO.octa,m.glass,0,1,0,0.22,0.62,0.22);SG.lifts.push({...d,g,rings,streams,crystal});
  }
  // Foreground rubble clusters live outside bridge exits and away from checkpoints.
  for(const I of Object.values(LV.islands))for(let j=0;j<9;j++){
    const a=j*2.399+0.45;if(I.exits.some(e=>Math.abs(angDiff(a,e))<0.35))continue;
    const x=I.x+Math.sin(a)*I.r*0.78,z=I.z+Math.cos(a)*I.r*0.78;
    sgSlab(staticRoot,m.stone,x,0.17,z,0.4,0.34,0.5,a);if(j%2===0)sgMoss(staticRoot,x,0.34,z,1.1);
  }
  staticRoot.updateMatrixWorld(true);
  for(const p of SG.solidProps){const v=p.g.localToWorld(p.local.clone());LV.colliders.push({x:v.x,z:v.z,r:p.r,height:p.height||3,camera:true});}
  LV.root.add(sgBakeStatic(staticRoot));
}
function animateStormScenery(dt){
  for(const f of SG.flags){const p=f.flag.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=f.base[i*3],y=f.base[i*3+1],weight=clamp((1.12-y)/2,0,1);p.setZ(i,Math.sin(G.time*2.6+x*2.2+f.phase-y*1.4)*0.16*weight);}p.needsUpdate=true;f.flag.geometry.computeVertexNormals();}
  if(SG.orrery)SG.orrery.axes.forEach((a,i)=>{a.rotation.y+=dt*(0.16+i*0.1);a.rotation.z+=dt*0.08;});
  if(SG.bell)SG.bell.rotation.z=Math.sin(G.time*0.85)*0.055;
  for(const b of SG.beacons){const lit=LV.zoneState[b.id]?.state==='cleared';b.lamp.material.color.setHex(lit?0xffca65:0x3296a7);b.lamp.material.emissive.setHex(lit?0xc77017:0x084351);b.lamp.rotation.y+=dt;b.lamp.scale.y=0.65+Math.sin(G.time*4)*0.04;b.beam.visible=lit;b.halo.rotation.z+=dt*0.35;}
  for(const lift of SG.lifts){lift.rings.forEach((r,i)=>r.position.y=0.7+i*1.8+Math.sin(G.time*1.5+i)*0.12);lift.streams.forEach((p,i)=>{const a=G.time*2+i*PI/2;p.position.set(Math.sin(a)*lift.r*0.64,(G.time*1.5+i*1.25)%5,Math.cos(a)*lift.r*0.64);});lift.crystal.rotation.y+=dt;lift.crystal.position.y=1.5+Math.sin(G.time*2)*0.12;}
}
