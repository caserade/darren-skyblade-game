/* Existing Stormbelly and Chomp Rex, refined against the supplied Heavyweight and Grin turnarounds.
   Geometry/materials are cached across encounters; attack radii and timings are unchanged. */
const TOON={geo:{},mat:{}};
function toonMat(name,color){return TOON.mat[name]||(TOON.mat[name]=new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness:0.92,metalness:0,envMapIntensity:0.12}));}
function toonShape(name,points,depth=0.08){return TOON.geo[name]||(TOON.geo[name]=(()=>{const s=new T.Shape();points.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:0.025,bevelThickness:0.02,bevelSegments:2,steps:1});g.translate(0,0,-depth/2);return g;})());}
function toonMesh(p,geo,m,x,y,z,sx=1,sy=sx,sz=sx){const o=mk(geo,m,x,y,z,sx,sy,sz);o.receiveShadow=true;p.add(o);return o;}
function toonTube(name,points,radii){
 if(TOON.geo[name])return TOON.geo[name];
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),steps=32,sides=10,frames=curve.computeFrenetFrames(steps,false),pos=[],indices=[];
 for(let i=0;i<=steps;i++){
  const u=i/steps,p=curve.getPointAt(u),f=u*(radii.length-1),k=Math.min(radii.length-2,Math.floor(f)),r=lerp(radii[k],radii[k+1],f-k);
  for(let j=0;j<=sides;j++){const a=j/sides*TAU,v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);pos.push(v.x,v.y,v.z);}
 }
 for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(indices);geo.computeVertexNormals();geo.userData.centerline=points;geo.userData.radii=radii;return TOON.geo[name]=geo;
}
function toonTailSpines(parent,geo,material){
 const curve=new T.CatmullRomCurve3(geo.userData.centerline.map(p=>new T.Vector3(...p))),radii=geo.userData.radii;
 for(const u of [.2,.5,.8]){
  const p=curve.getPointAt(u),f=u*(radii.length-1),k=Math.min(radii.length-2,Math.floor(f)),r=lerp(radii[k],radii[k+1],f-k),h=Math.min(.25,r*1.2);
  toonMesh(parent,GEO.cone,material,p.x,p.y+r+h*.3,p.z,h*.48,h,h*.5).rotation.x=-.5;
 }
}
function toonTailUnderside(parent,geo,material,key){
 if(!TOON.geo[key]){
  const g=geo.clone(),p=g.attributes.position,curve=new T.CatmullRomCurve3(geo.userData.centerline.map(v=>new T.Vector3(...v))),ix=[];
  for(let i=0;i<p.count;i++){
   const center=curve.getPointAt(Math.floor(i/11)/32);
   p.setXYZ(i,center.x+(p.getX(i)-center.x)*1.012,center.y+(p.getY(i)-center.y)*1.012,center.z+(p.getZ(i)-center.z)*1.012);
  }
  for(let i=0;i<g.index.count;i+=3){
   const a=g.index.getX(i),b=g.index.getX(i+1),c=g.index.getX(i+2),u=(Math.floor(a/11)+Math.floor(b/11)+Math.floor(c/11))/96;
   if((p.getY(a)+p.getY(b)+p.getY(c))/3<curve.getPointAt(u).y-.025)ix.push(a,b,c);
  }
  g.setIndex(ix);TOON.geo[key]=g;
 }
 toonMesh(parent,TOON.geo[key],material,0,0,0);
}
function toonTooth(){
 if(TOON.geo.tooth)return TOON.geo.tooth;
 const g=new T.SphereGeometry(1,12,8),p=g.attributes.position;
 for(let i=0;i<p.count;i++)for(const [get,set] of [['getX','setX'],['getY','setY'],['getZ','setZ']]){const v=p[get](i);p[set](i,Math.sign(v)*Math.pow(Math.abs(v),.55));}
 g.computeVertexNormals();return TOON.geo.tooth=g;
}
function toonSkin(dragon){
 const name=dragon?'heavyweightSkin':'grinSkin';if(TOON.mat[name])return TOON.mat[name];
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=dragon?'#3c6989':'#86516f';x.fillRect(0,0,256,256);
 let seed=31;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<160;i++){const u=random()*256,v=random()*256,r=1.2+random()*5;x.fillStyle=dragon?'rgba(28,60,94,.42)':'rgba(65,37,67,.45)';x.beginPath();x.ellipse(u,v,r,r*.7,random()*PI,0,TAU);x.fill();}
 for(let i=0;i<1600;i++){x.fillStyle=random()>.5?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)';x.fillRect(random()*256,random()*256,1,1);}
 const map=new T.CanvasTexture(c);map.encoding=T.sRGBEncoding;map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
 return TOON.mat[name]=new T.MeshStandardMaterial({map,roughness:.94,metalness:0,envMapIntensity:.1});
}
function toonMuzzle(dragon){
 const key=dragon?'heavyMuzzle':'rexMuzzle';if(TOON.geo[key])return TOON.geo[key];
 const g=new T.SphereGeometry(1,32,20),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  // Rounded wedge, wider at the jaw hinge, with a sloping upper nose plane.
  x=Math.sign(x)*Math.pow(Math.abs(x),.66)*(dragon?.65:.72)*(1-.13*z);
  y=Math.sign(y)*Math.pow(Math.abs(y),.72)*(dragon?.31:.36)-.08*z;
  z*=dragon?.63:.87;p.setXYZ(i,x,y,z);
 }
 g.computeVertexNormals();return TOON.geo[key]=g;
}
function toonBelly(body,dragon,mat){
 // A continuous fitted surface, with shallow horizontal plate seams.
 const key=dragon?'heavyBelly':'rexBelly';
 if(!TOON.geo[key]){
  const pos=[],uv=[],ix=[],colors=[],rows=64,cols=32;
  const baseColor=new T.Color(dragon?0xb9ced4:0xe6b65e).convertSRGBToLinear();
  for(let i=0;i<=rows;i++){
   const v=i/rows,y=-Math.cos(v*PI)*1.22,width=(dragon?1.04:.76)*Math.sin(v*PI),depth=(dragon?.79:.72)*Math.sin(v*PI);
   for(let j=0;j<=cols;j++){
    const a=(j/cols-.5)*PI,band=(y+1.22)/2.44*8+.15*Math.cos(a),seam=Math.pow(.5+.5*Math.cos(band*TAU),20),shade=1-seam*.22;
    pos.push(Math.sin(a)*width,y,.11+depth*Math.cos(a)-seam*.009);uv.push(j/cols,v);
    colors.push(baseColor.r*shade,baseColor.g*shade,baseColor.b*shade);
   }
  }
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;ix.push(a,a+1,b,b,a+1,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();TOON.geo[key]=g;
 }
 const material=TOON.mat[key]||(TOON.mat[key]=new T.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0}));
 return toonMesh(body,TOON.geo[key],material,0,-.02,dragon?.09:.12);
}
function buildRoundEnemy(dragon){
 const root=new T.Group(),b=grp(root),body=grp(b,0,dragon?1.65:1.8,0),head=grp(body,0,dragon?1.0:1.05,dragon?.19:.42),tail=grp(b,0,dragon?.95:1.25,-.55);
 const skin=toonSkin(dragon),plain=toonMat(dragon?'blueFace':'plumFace',dragon?0x416f8c:0x88506f),bellyMat=toonMat(dragon?'palePlates':'goldPlates',dragon?0xb9ced4:0xe6b65e),dark=toonMat('charcoal',0x29303b),spineMat=toonMat(dragon?'navySpines':'rexSpines',dragon?0x273e65:0x393240),cream=toonMat('warmIvory',0xf3e4c3),white=toonMat('eyeCream',0xfff0cc),iris=toonMat('amberEyes',0xc58d32);
 const torso=toonMesh(body,GEO.hi,skin,0,-.04,-.04,dragon?1.18:.91,dragon?1.35:1.12,dragon?.86:.77);
 const belly=toonBelly(body,dragon,bellyMat);
 toonMesh(body,GEO.mid,skin,0,.83,dragon?-.03:.18,dragon?.62:.48,.68,.48);
 toonMesh(body,GEO.mid,bellyMat,0,.87,.47,dragon?.43:.32,.52,.16);
 toonMesh(head,GEO.mid,skin,0,.05,-.18,dragon?.6:.65,.5,.56);
 toonMesh(head,toonMuzzle(dragon),plain,0,-.06,dragon?.37:.38);
 const jaw=grp(head,0,dragon?-.28:-.42,-.06);
 toonMesh(jaw,toonMuzzle(dragon),bellyMat,0,dragon?-.08:-.17,dragon?.42:.46,.92,dragon?.68:.48,.96);
 const mouthPoints=[];
 for(let j=0;j<=20;j++){const a=-PI*.56+j/20*PI*1.12;mouthPoints.push([Math.sin(a)*(dragon?.54:.66),(dragon?-.29:-.46)+Math.pow(Math.abs(Math.sin(a)),2)*.18,.34+Math.cos(a)*(dragon?.58:.81)]);}
 toonMesh(head,toonTube(dragon?'heavySmile':'rexGrin',mouthPoints,[.026,.026,.026]),dark,0,0,0);
 if(!dragon){
  for(let j=0;j<15;j++){
   const a=-1.53+j/14*3.06,x=Math.sin(a)*.66,z=.34+Math.cos(a)*.815,y=-.46+Math.pow(Math.abs(Math.sin(a)),2)*.18;
   const tooth=toonMesh(head,toonTooth(),cream,x,y-.015,z,.086,.12,.065);tooth.rotation.y=a;tooth.rotation.z=-Math.sin(a)*.25;
  }
 }
 for(const s of [-1,1]){
  toonMesh(head,GEO.mid,plain,s*.44,-.06,.07,.24,.29,.31);
  const nostril=toonMesh(head,GEO.mid,dark,s*.33,.04,dragon?.94:1.12,.047,.075,.025);nostril.rotation.z=s*.4;
  const eye=grp(head,s*(dragon?.31:.35),.29,dragon?.38:.38);eye.rotation.y=s*.15;
  toonMesh(eye,GEO.mid,white,0,0,0,.21,.19,.14);
  toonMesh(eye,GEO.mid,iris,-s*.025,-.015,.126,.107,.13,.038);
  toonMesh(eye,GEO.mid,dark,-s*.025,-.01,.16,.044,.105,.018);
  toonMesh(eye,GEO.mid,white,-s*.05,.037,.18,.024,.03,.008);
  const brow=toonMesh(eye,GEO.mid,plain,0,.115,.025,.26,.09,.2);brow.rotation.z=s*.3;
  if(dragon){
   toonMesh(jaw,TOON.geo.fang||(TOON.geo.fang=new T.ConeGeometry(.07,.23,12)),cream,s*.53,.14,.81);
   const horn=toonTube('sweptHorn',[[0,0,0],[.1,.2,-.05],[.22,.33,-.15],[.44,.3,-.24]],[.15,.12,.065,.005]);
   const h=toonMesh(head,horn,toonMat('hornOchre',0xb89b6b),s*.39,.43,-.28);h.scale.x=s;
  }
 }
 const legs=[],arms=[];
 for(const s of [-1,1]){
  const leg=grp(b,s*(dragon?.78:.66),dragon?.89:1.1,-.04);
  toonMesh(leg,GEO.mid,skin,0,dragon?0:.12,0,dragon?.47:.49,dragon?.64:.59,dragon?.49:.53);
  toonMesh(leg,GEO.mid,plain,0,-.48,dragon?.06:-.16,.26,dragon?.31:.4,.27);
  toonMesh(leg,GEO.mid,plain,0,dragon?-.7:-.9,.24,.36,.18,.52);
  for(let j=0;j<3;j++){
   const toe=grp(leg,(j-1)*.24,dragon?-.72:-.91,.58);
   toonMesh(toe,GEO.mid,plain,0,0,0,.135,.16,.23);
   const claw=toonMesh(toe,GEO.mid,dark,0,-.015,.19,.1,.13,.19);claw.rotation.x=-.25;
  }
  legs.push(leg);
  const arm=grp(body,s*(dragon?.92:.72),dragon?.49:.66,.22);arm.rotation.z=s*(dragon?.14:.3);
  toonMesh(arm,GEO.mid,skin,0,-.18,.01,dragon?.31:.17,dragon?.45:.28,dragon?.32:.18);
  toonMesh(arm,GEO.mid,plain,s*.03,dragon?-.58:-.33,.22,dragon?.25:.16,dragon?.28:.16,dragon?.25:.17);
  for(let j=0;j<(dragon?3:2);j++){
   const finger=toonMesh(arm,GEO.mid,plain,(j-(dragon?1:.5))*.13,dragon?-.77:-.45,.32,.075,.13,.09);finger.rotation.x=-.3;
   toonMesh(arm,GEO.cone,dark,(j-(dragon?1:.5))*.13,dragon?-.88:-.55,.37,.045,.15,.055).rotation.z=PI;
  }
  arms.push(arm);
 }
 const tail2=grp(tail,0,-.1,-1.0);
 toonMesh(tail2,GEO.mid,skin,0,0,0,.205,.205,.22);
 toonMesh(tail,toonTube(dragon?'heavyTailRoot':'rexTailRoot',[[0,0,0],[0,-.05,-.45],[0,-.1,-1.0]],[dragon?.43:.4,.3,.2]),skin,0,0,0);
 toonMesh(tail2,toonTube(dragon?'heavyTailTip':'rexTailTip',[[0,0,0],[0,dragon?-.15:.03,-.6],[0,dragon?-.1:.35,-1.15],[0,dragon?.03:.8,-1.43]],[.2,.15,.08,.005]),skin,0,0,0);
 toonTailUnderside(tail,TOON.geo[dragon?'heavyTailRoot':'rexTailRoot'],bellyMat,dragon?'heavyTailRootUnder':'rexTailRootUnder');
 toonTailUnderside(tail2,TOON.geo[dragon?'heavyTailTip':'rexTailTip'],bellyMat,dragon?'heavyTailTipUnder':'rexTailTipUnder');
 if(dragon){const spade=toonShape('heavySpade',[[0,.4],[-.27,.02],[-.18,-.13],[0,-.2],[.18,-.13],[.27,.02]],.1);const tip=toonMesh(tail2,spade,spineMat,0,.025,-1.43);tip.rotation.set(-.6,0,PI);}
 for(let j=0;j<9;j++){
  const y=1.12-j*.25,ry=dragon?1.35:1.12,rz=dragon?.86:.77,z=-.12-rz*Math.sqrt(Math.max(0,1-Math.pow((y+.04)/ry,2)));
  const spike=toonMesh(body,GEO.cone,spineMat,0,y,z,.16,.32,.15);spike.rotation.x=-1.0;
 }
 for(let j=0;j<2;j++)toonMesh(head,GEO.cone,spineMat,0,.53-j*.05,-.21-j*.23,.105,.21,.13).rotation.x=-.4;
 toonTailSpines(tail,TOON.geo[dragon?'heavyTailRoot':'rexTailRoot'],spineMat);
 toonTailSpines(tail2,TOON.geo[dragon?'heavyTailTip':'rexTailTip'],spineMat);
 const wings=[];
 if(dragon){
  if(!TOON.geo.batWing){
   const s=new T.Shape();s.moveTo(0,0);s.quadraticCurveTo(.12,.52,.33,.92);s.quadraticCurveTo(.85,.62,1.08,-.1);s.quadraticCurveTo(.7,.12,.68,-.2);s.quadraticCurveTo(.36,.06,.29,-.32);s.quadraticCurveTo(.14,-.02,0,0);
   const g=new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1,curveSegments:12});g.translate(0,0,-.0175);TOON.geo.batWing=g;
  }
  const membrane=toonMat('slateMembrane',0x36556e),frame=toonMat('wingFrame',0x203b54);
  for(const s of [-1,1]){
   const wing=grp(body,s*.73,.63,-.61);wing.scale.x=s;
   toonMesh(wing,TOON.geo.batWing,membrane,0,0,0);
   for(const [name,pts] of [['outer',[[0,0,0],[.18,.65,0],[.33,.92,0],[.76,.4,0],[1.08,-.1,0]]],['finger1',[[.33,.92,.025],[.54,.36,.025],[.68,-.2,.025]]],['finger2',[[.33,.92,.025],[.29,.25,.025],[.29,-.32,.025]]]])toonMesh(wing,toonTube('bat-'+name,pts,[.038,.03,.02]),frame,0,0,0);
   wings.push(wing);
  }
 }
 const warning=new T.Group();root.add(warning);warning.position.y=.045;
 const wm=TOON.warningMat||(TOON.warningMat=new T.MeshBasicMaterial({color:0xf5b655,transparent:true,opacity:.54,side:T.DoubleSide,depthWrite:false}));
 if(dragon){const geo=TOON.geo.stompRing||(TOON.geo.stompRing=new T.RingGeometry(3,3.3,48));const r=new T.Mesh(geo,wm);r.rotation.x=-PI/2;warning.add(r);}
 else{const arrow=toonShape('chargeArrow',[[-.8,0],[.8,0],[.8,3],[1.2,3],[0,4.4],[-1.2,3],[-.8,3]],.005);const r=new T.Mesh(arrow,wm);r.rotation.x=PI/2;warning.add(r);}
 warning.visible=false;root.name=dragon?'Stormbelly':'Chomp Rex';
 return {root,b,body,head,belly,jaw,legs,arms,tail,tail2,wings,warning,shell:addShell(root,1.25,1.8)};
}

function animateToonEnemy(e,dt){
 const m=e.m,t=(e.animTime=(e.animTime||0)+dt),moving=e.st==='chase'||e.st==='atk',wind=e.st==='wind',attack=e.st==='atk',dead=!e.alive;
 const gait=moving?Math.sin(t*(attack?13:5)):0;
 m.legs.forEach((l,i)=>l.rotation.x=(i?-1:1)*gait*0.28);m.arms.forEach((a,i)=>a.rotation.x=wind?-0.9:attack?-0.6:(i?-1:1)*gait*0.18);
 m.body.rotation.z=gait*0.035;m.body.scale.y=1+Math.sin(t*2.5)*0.015;
 m.head.rotation.x=wind?-0.18:attack?0.17:Math.sin(t*1.7)*0.025;m.jaw.rotation.x=damp(m.jaw.rotation.x,wind?0.09:attack?0.32:0,16,dt);
 m.tail.rotation.y=Math.sin(t*2)*0.13;m.tail2.rotation.y=Math.sin(t*2-0.8)*0.18;
 m.wings.forEach((w,i)=>{w.rotation.y=(i?-1:1)*(0.22+Math.sin(t*3)*0.15+(wind?0.25:0));});
 m.warning.visible=wind&&!dead;m.warning.position.y=0.045-e.y;
}
function roundEnemyBrain(e,s,dt,dist,ang,hover,turn,pAlive){
 const dragon=e.type==='stormbelly',windTime=dragon?66:48;
 const forward=sp=>{e.x+=Math.sin(e.face)*sp*dt;e.z+=Math.cos(e.face)*sp*dt;};
 if(e.st==='chase'){
   turn(2.4);const range=dragon?3.7:6;
   if(dist>(dragon?2.7:3.8))forward(dragon?1.65:2.3);
   if(e.cool<=0&&pAlive&&dist<range&&token(e)){e.st='wind';e.t=0;e.wind=true;e.hitP=false;}
 }else if(e.st==='wind'){
   if(e.t<windTime*0.55)turn(2);
   if(e.t>=windTime){e.st='atk';e.t=0;e.wind=false;
     if(dragon){ring(e.x,0.1,e.z,0.3,13,0.3,0xb6d7ff);dust(e.x,e.z,10);sfx('slam');if(dist<3.3&&P.y<0.8){hurtP(e,24,e.x,e.z,true);e.hitP=true;}}
   }
 }else if(e.st==='atk'){
   if(!dragon){forward(7.6);if(!e.hitP&&Math.hypot(P.x-e.x,P.z-e.z)<1.85&&P.y<2.3){e.hitP=true;hurtP(e,20,e.x,e.z,false);sfx('hit',1);}}
   if(e.t>=(dragon?18:25)){e.st='rec';e.t=0;}
 }else if(e.st==='rec'&&e.t>=(dragon?80:65)){e.st='chase';e.t=0;e.cool=dragon?150:115;}
}
EDEF.stormbelly={name:'Stormbelly',hp:360,r:1.15,h:3.6,w:3,sc:1,build:()=>buildRoundEnemy(true)};
EDEF.chomprex={name:'Chomp Rex',hp:260,r:1.05,h:3.2,w:2.5,sc:0.92,build:()=>buildRoundEnemy(false)};
DATA.enemies.stormbelly={name:'Stormbelly',hp:360,poise:42};DATA.enemies.chomprex={name:'Chomp Rex',hp:260,poise:28};
DATA.drops.stormbelly=[['stormglass',3],['plate',1]];DATA.drops.chomprex=[['stormglass',2],['feather',1]];
const toonChapter=DATA.chapters.find(c=>c.id==='ch3');
toonChapter.zones.find(z=>z.id==='gale').enemies.push(['stormbelly',1]);
toonChapter.zones.find(z=>z.id==='archive').enemies.push(['chomprex',1]);
toonChapter.story.gale_enter.push(['narrator','Stormbelly braces before a stomp. Leave the amber circle or jump over the impact.']);
toonChapter.story.archive_enter.push(['narrator','Chomp Rex leans back before charging along its amber arrow. Dodge sideways, then punish its recovery.']);

