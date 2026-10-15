/* Shared material library. Cached GPU textures; no per-frame texture allocation. */
const POLISH={textures:{},ready:false,error:null,clock:0};
function polishCanvas(kind,size=256){
  const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');
  let seed=4817;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const data=x.createImageData(size,size);
  for(let y=0;y<size;y++)for(let u=0;u<size;u++){
    const i=(y*size+u)*4,n=random(),grain=Math.sin(u*0.22+Math.sin(y*0.035)*2)+Math.sin(u*0.76+y*0.014)*0.3;
    let rgb=kind==='wood'?[151+grain*19+n*13,115+grain*15+n*10,78+grain*11+n*7]:kind==='grass'?[70+n*29,88+n*34,48+n*23]:kind==='cloth'?[180+(u%3===0?-24:0)+n*16,180+(y%3===0?-24:0)+n*16,177+n*12]:[165+n*35,163+n*33,153+n*26];
    for(let j=0;j<3;j++)data.data[i+j]=rgb[j];data.data[i+3]=255;
  }
  x.putImageData(data,0,0);return c;
}
function polishTexture(canvas,color=true,repeat=1){const t=new T.CanvasTexture(canvas);t.encoding=color?T.sRGBEncoding:T.LinearEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
for(const kind of ['wood','grass','cloth','metal'])POLISH.textures[kind]=polishTexture(polishCanvas(kind));
const placeholder=polishCanvas('metal',512);
POLISH.textures.stone=polishTexture(placeholder);
POLISH.textures.bump=polishTexture(placeholder,false);
const floorCanvas=document.createElement('canvas');floorCanvas.width=floorCanvas.height=1024;
POLISH.textures.floor=polishTexture(floorCanvas,true,3);
POLISH.textures.floorBump=polishTexture(floorCanvas,false,3);
function polishFloor(image){
  const x=floorCanvas.getContext('2d');x.fillStyle='#353c3b';x.fillRect(0,0,1024,1024);
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    x.save();x.translate(col*128+64,row*128+64);x.rotate(((row*3+col)%4)*PI/2);x.drawImage(image,-61,-61,122,122);
    x.fillStyle=`rgba(21,36,36,${0.18+((row*17+col*7)%9)*0.018})`;x.fillRect(-61,-61,122,122);
    x.strokeStyle='rgba(218,216,188,0.3)';x.lineWidth=2;x.strokeRect(-60,-60,120,120);x.restore();
  }
  POLISH.textures.floor.needsUpdate=POLISH.textures.floorBump.needsUpdate=true;
}
polishFloor(placeholder);
const stoneImage=new Image();stoneImage.onload=()=>{
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.drawImage(stoneImage,0,0,512,512);
  POLISH.textures.stone.image=c;POLISH.textures.stone.needsUpdate=true;
  const bump=document.createElement('canvas');bump.width=bump.height=512;const bx=bump.getContext('2d');bx.drawImage(c,0,0);const d=bx.getImageData(0,0,512,512);
  for(let i=0;i<d.data.length;i+=4){const v=(d.data[i]+d.data[i+1]+d.data[i+2])/3;d.data[i]=d.data[i+1]=d.data[i+2]=v;}bx.putImageData(d,0,0);
  POLISH.textures.bump.image=bump;POLISH.textures.bump.needsUpdate=true;polishFloor(c);POLISH.ready=true;
};stoneImage.onerror=()=>{POLISH.error='Stone texture unavailable; cached fallback active';};stoneImage.src='assets/textures/weathered-limestone.webp';
function polishMaterial(m,kind,bump=0.035){m.map=POLISH.textures[kind];m.bumpMap=kind==='stone'?POLISH.textures.bump:POLISH.textures[kind];m.bumpScale=bump;m.roughness=kind==='metal'?0.42:0.86;m.needsUpdate=true;}
for(const key of ['stone','stoneD'])polishMaterial(MAT[key],'stone');
polishMaterial(MAT.moss,'grass',0.06);polishMaterial(MAT.yellow,'cloth',0.014);polishMaterial(MAT.grip,'cloth',0.025);
for(const key of ['wood','woodD','woodEnd','door'])polishMaterial(PROP[key],'wood',0.055);
for(const key of ['stone','roof','roofD'])polishMaterial(PROP[key],'stone',0.045);
polishMaterial(PROP.grass,'grass',0.05);polishMaterial(PROP.apron,'cloth',0.01);
for(const m of TOYS){if(m.metalness<0.4){m.roughness=Math.max(m.roughness,0.52);m.clearcoat=Math.min(m.clearcoat,0.22);m.clearcoatRoughness=0.4;}m.envMapIntensity=0.38;}
const sm=stormMaterials();
for(const key of ['stone','light','shade','dark']){polishMaterial(sm[key],'stone',0.075);sm[key].color.multiplyScalar(1.2);}
polishMaterial(sm.moss,'grass',0.075);polishMaterial(sm.gold,'metal',0.018);sm.gold.metalness=0.72;
sm.glass.roughness=0.2;sm.glass.metalness=0.25;sm.glass.emissiveIntensity=0.23;
SGA.floor=new T.MeshStandardMaterial({map:POLISH.textures.floor,bumpMap:POLISH.textures.floorBump,bumpScale:0.1,roughness:0.89,color:0xc4cbd0});
const terrainGrass=POLISH.textures.grass.clone();terrainGrass.repeat.set(24,24);terrainGrass.needsUpdate=true;
buildIsland.grass=new T.MeshStandardMaterial({map:terrainGrass,bumpMap:terrainGrass,bumpScale:0.065,roughness:0.98,color:0xc2ceac});
POLISH.cliff=new T.MeshStandardMaterial({map:POLISH.textures.stone,bumpMap:POLISH.textures.bump,bumpScale:0.16,roughness:0.95,color:0x77786b});
function polishChapter(){
  for(const island of Object.values(LV.islands)){
    const top=island.g.children[0];top.material[0]=POLISH.cliff;top.material[2]=POLISH.cliff;island.g.children[1].material=POLISH.cliff;
  }
  if(window.ENV_TEX){scene.environment=window.ENV_TEX;for(const m of Object.values(sm))m.envMapIntensity=0.32;}
  world.sun.color.setHex(CH.id==='ch3'?0xffe4bd:0xffefcf);world.sun.intensity=1.12;
  world.hemi.intensity=0.48;world.hemi.groundColor.setHex(0x444e48);world.rim.intensity=0.3;
  buildPolishAtmosphere();applyGraphics();
}
function releaseLevelGeometry(root){
  const shared=new Set([...Object.values(GEO),...Object.values(SGA.geo)]),owned=new Set();
  if(POLISH.contactGeometry)shared.add(POLISH.contactGeometry);
  scene.traverse(o=>{let p=o;while(p&&p!==root)p=p.parent;if(!p&&o.geometry)shared.add(o.geometry);});
  root.traverse(o=>{if(o.geometry&&!shared.has(o.geometry))owned.add(o.geometry);});
  for(const geo of owned)geo.dispose();
}
function polishRadial(){
  if(POLISH.radial)return POLISH.radial;
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,0.85)');g.addColorStop(0.4,'rgba(255,255,255,0.4)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return POLISH.radial=new T.CanvasTexture(c);
}
function buildPolishAtmosphere(){
  POLISH.mist=[];POLISH.contacts=[];
  if(!POLISH.mistMaterial)POLISH.mistMaterial=new T.SpriteMaterial({map:polishRadial(),color:0xc6d5de,transparent:true,opacity:0.13,depthWrite:false});
  if(!POLISH.contactMaterial)POLISH.contactMaterial=new T.MeshBasicMaterial({map:polishRadial(),color:0x131f25,transparent:true,opacity:0.3,depthWrite:false});
  if(!POLISH.contactGeometry)POLISH.contactGeometry=new T.PlaneGeometry(1,1);
  for(const I of Object.values(LV.islands)){const cloud=new T.Sprite(POLISH.mistMaterial);cloud.position.set(I.x,-4.2,I.z);cloud.scale.set(I.r*2.6,6,1);cloud.userData.baseX=I.x;LV.root.add(cloud);POLISH.mist.push(cloud);}
  for(let i=0;i<26;i++){const shadow=new T.Mesh(POLISH.contactGeometry,POLISH.contactMaterial);shadow.rotation.x=-PI/2;shadow.visible=false;shadow.renderOrder=1;LV.root.add(shadow);POLISH.contacts.push(shadow);}
}
function applyGraphics(){
  const mode=SETTINGS.graphics||'auto';pixelRatio=Math.min(window.devicePixelRatio||1,mode==='smooth'?1:COARSE?1.5:2);
  renderer.shadowMap.enabled=mode!=='smooth';world.sun.castShadow=renderer.shadowMap.enabled;resize();
  for(const m of POLISH.mist||[])m.visible=mode!=='smooth';
}
function updatePolish(dt){
  if(G.paused||G.cine)return;POLISH.clock+=dt;
  for(let i=0;i<(POLISH.mist||[]).length;i++){const m=POLISH.mist[i];m.position.x=m.userData.baseX+Math.sin(POLISH.clock*0.1+i)*1.6;}
  const actors=[P,...G.enemies.filter(e=>e.alive&&!e.d.static)];
  for(let i=0;i<(POLISH.contacts||[]).length;i++){
    const shadow=POLISH.contacts[i],e=actors[i];shadow.visible=!!e&&e.y<9&&e.y> -0.3&&groundAt(e.x,e.z);
    if(!shadow.visible)continue;const r=i===0?1.25:e.d.boss?6:e.r*2.8;shadow.position.set(e.x,0.027,e.z);shadow.scale.setScalar(r*(1+Math.max(0,e.y)*0.05));
  }
}
function stormBolt(x,z){
  const g=new T.Group(),points=[];
  for(let i=0;i<=9;i++)points.push(new T.Vector3(x+(i===0?0:Math.sin(i*8.1+G.time)*0.48),i*1.6,z+(i===0?0:Math.cos(i*5.7)*0.38)));
  const geo=new T.BufferGeometry().setFromPoints(points),mat=new T.LineBasicMaterial({color:0xc5d9ff,transparent:true,opacity:0.95});g.add(new T.Line(geo,mat));scene.add(g);return {g,geo,mat};
}
