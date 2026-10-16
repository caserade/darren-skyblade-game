/* Stormglass combat and traversal. Art lives in stormglass-art.js and stormglass-world.js. */
const SG = {lifts:[],beacons:[],hazards:[],flags:[],ownedGeometries:[],solidProps:[]};
EDEF.stormling={name:'Stormling',hp:100,r:0.65,h:1,w:1,sc:1.2,fly:true,build:buildStormling};
EDEF.wardling={name:'Wardling',hp:240,r:0.85,h:2,w:2,sc:1,ai:'thorn',build:buildWardling};
EDEF.tempest={...EDEF.boss,name:'Tempest Warden',hp:3600,build:buildTempest,cfg:{...EDEF.boss.cfg,summon:'stormling',talk:'warden',part:'STORM CRYSTAL BREAK',parts:'Storm crystals',kneel:'Fly behind him and strike the exposed storm core',p2:'Leave the violet circles before lightning strikes'}};

function stormlingBrain(e,s,dt,dist,ang,hover,turn,pAlive) {
  e.cool-=s;
  if(e.st==='chase') {
    // hovers at Gustling height (a jump attack reaches it) and only backs off when Darren is right under it
    turn(4);e.y=damp(e.y,hover-0.2,3,dt);
    const velocity=dist>9?2.5:dist<3.2?-1.1:0;e.x+=Math.sin(ang)*velocity*dt;e.z+=Math.cos(ang)*velocity*dt;
    if(e.cool<=0&&pAlive&&dist<16&&token(e)){e.st='wind';e.t=0;e.wind=true;}
  } else if(e.st==='wind') {
    if(e.t<28)turn(4);
    if(e.t>=48){
      const dy=P.y+0.8-e.y,vy=clamp(dy/Math.max(1,dist)*10,-6,6);
      for(const a of [-0.25,0,0.25]) spawnProj(e.x,e.y+0.4,e.z,Math.sin(e.face+a)*10,vy,Math.cos(e.face+a)*10,{r:0.23,dmg:9*e.dm,mat:'feather'});
      e.st='rec';e.t=0;e.wind=false;sfx('swing',1);
    }
  } else if(e.st==='rec'){
    // spent after the fan: it sinks low for a moment, the opening to punish it
    e.y=damp(e.y,1.1,4,dt);
    if(e.t>=80){e.st='chase';e.t=0;e.cool=140;}
  }
}
function buildStormglass() {
  disposeStormScenery();
  SG.lifts=[];SG.beacons=[];clearStormHazards();
  if(!SG.originalSky){SG.originalSky=scene.background;SG.originalFog=scene.fog.color.clone();}
  if(CH.id!=='ch3'){scene.background=SG.originalSky;scene.fog.color.copy(SG.originalFog);return;}
  if(!SG.sky){
    const canvas=document.createElement('canvas');canvas.width=8;canvas.height=256;
    const ctx=canvas.getContext('2d'),grad=ctx.createLinearGradient(0,0,0,256);
    grad.addColorStop(0,'#343351');grad.addColorStop(0.6,'#8f99bd');grad.addColorStop(1,'#f1dcbc');ctx.fillStyle=grad;ctx.fillRect(0,0,8,256);
    SG.sky=new T.CanvasTexture(canvas);SG.sky.encoding=T.sRGBEncoding;
  }
  scene.background=SG.sky;scene.fog.color.setHex(0xa1aec9);
  buildStormglassScenery();
}
function disposeStormHazard(h){scene.remove(h.g);h.g.geometry.dispose();h.g.material.dispose();if(h.bolt){scene.remove(h.bolt.g);h.bolt.geo.dispose();h.bolt.mat.dispose();}}
function clearStormHazards(){for(const h of SG.hazards)disposeStormHazard(h);SG.hazards=[];}
function updateStormglass(dt) {
  if(CH.id!=='ch3')return;
  animateStormScenery(dt);
  for(const lift of SG.lifts){
    if(P.st!=='dead'&&Math.hypot(P.x-lift.x,P.z-lift.z)<lift.r&&P.y>=-0.3&&P.y<6){
      P.fe=Math.min(flightMax(),(P.fe||0)+dt*36);P.vy=Math.max(P.vy,6);P.onG=false;
    }
  }
  const boss=G.boss;
  if(!boss||!boss.alive||boss.type!=='tempest'){clearStormHazards();return;}
  if(boss.phase>=2&&!['kneel','stagger','roar'].includes(boss.st)&&P.st!=='dead'){
    boss.lightningClock=(boss.lightningClock||0)+dt;
    if(boss.lightningClock>=5.5){
      boss.lightningClock=0;
      const mat=new T.MeshBasicMaterial({color:0xbe9dff,transparent:true,opacity:0.3,side:T.DoubleSide,depthWrite:false});
      const g=new T.Mesh(new T.RingGeometry(0.1,2.7,40),mat);g.rotation.x=-PI/2;g.position.set(P.x,0.09,P.z);scene.add(g);
      SG.hazards.push({g,x:P.x,z:P.z,t:1.3,fired:false,boss});
    }
  }
  for(let i=SG.hazards.length-1;i>=0;i--){
    const h=SG.hazards[i];h.t-=dt;
    h.g.material.opacity=0.35+0.25*Math.sin(G.time*20);
    if(h.t<=0&&!h.fired){h.fired=true;h.bolt=stormBolt(h.x,h.z);ring(h.x,0.2,h.z,0.3,10,0.35,0xbe9dff);burst(sparks,h.x,1,h.z,25,8,0.45,0xbe9dff,0.35);if(Math.hypot(P.x-h.x,P.z-h.z)<2.7)hurtP(h.boss,22,h.x,h.z,false);sfx('slam');}
    if(h.bolt)h.bolt.mat.opacity=Math.max(0,1+h.t/0.4);
    if(h.t< -0.4){disposeStormHazard(h);SG.hazards.splice(i,1);}
  }
}
