/* Local-only QA harness, injected by serve.cjs only at /?qa=1. Never deployed. */
(async()=>{
  window.__manual=true;
  const results=[],backup={};
  for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);backup[key]=localStorage.getItem(key);}
  const check=(name,fn)=>{try{if(!fn())throw Error('Assertion failed');results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.stack});}};
  const skip=()=>{for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk();}};
  try{
    check('All game scripts loaded',()=>DATA.chapters.length===3&&typeof buildTempest==='function');
    for(const id of ['ch1','ch2','adv','ch3']){
      loadChapter(id);startGame(false);skip();tick(1/60);skip();
      check(id+' initializes with walkable spawn',()=>groundAt(P.x,P.z)&&P.hp>0&&Object.keys(LV.islands).length>0);
    }
    check('Chapter 3 has four islands, five lifts and three beacons',()=>Object.keys(LV.islands).length===4&&SG.lifts.length===5&&SG.beacons.length===3);
    check('Future islands remain locked',()=>islandLocked(LV.islands.archive)&&islandLocked(LV.islands.eye));
    check('Bell tower, moving orrery and cloth banners are built',()=>SG.bell&&SG.orrery&&SG.flags.length>=7);
    check('Static scenery is batched into fewer than 18 draw meshes',()=>SG.ownedGeometries.length>0&&SG.ownedGeometries.length<18);
    check('Checkpoints remain clear of new landmark collisions',()=>CH.zones.every(z=>SG.solidProps.every(p=>{const v=p.g.localToWorld(p.local.clone());return Math.hypot(z.checkpoint[0]-v.x,z.checkpoint[1]-v.z)>p.r+0.55;})));
    const cloudTime=G.time,flagBefore=SG.flags[0].flag.geometry.attributes.position.array.slice(),orreryBefore=SG.orrery.axes[0].rotation.y;
    G.time+=0.2;animateStormScenery(0.2);
    check('Cloth and orrery animation changes rendered geometry',()=>SG.flags[0].flag.geometry.attributes.position.array.some((v,i)=>v!==flagBefore[i])&&SG.orrery.axes[0].rotation.y!==orreryBefore);
    G.paused=true;const pausedAngle=SG.orrery.axes[0].rotation.y;tick(0.1);
    check('Pause freezes added scenery animation',()=>SG.orrery.axes[0].rotation.y===pausedAngle);G.paused=false;
    talk('intro');const talkAngle=SG.orrery.axes[0].rotation.y;tick(0.01);
    check('Dialogue freezes added scenery animation',()=>SG.orrery.axes[0].rotation.y===talkAngle);skip();G.time=cloudTime;
    const atmosphereClock=POLISH.clock;G.paused=true;updatePolish(1);check('Pause freezes atmosphere',()=>POLISH.clock===atmosphereClock);G.paused=false;
    G.cine=true;updatePolish(1);check('Dialogue freezes atmosphere',()=>POLISH.clock===atmosphereClock);G.cine=false;
    updatePolish(0.1);check('Contact shadow pool stays bounded',()=>POLISH.contacts.length===26&&POLISH.mist.length===4);
    const graphicMode=SETTINGS.graphics;SETTINGS.graphics='smooth';applyGraphics();check('Performance mode disables heavy effects',()=>!renderer.shadowMap.enabled&&POLISH.mist.every(m=>!m.visible));
    SETTINGS.graphics='detail';applyGraphics();check('High detail restores shadows and atmosphere',()=>renderer.shadowMap.enabled&&POLISH.mist.every(m=>m.visible));SETTINGS.graphics=graphicMode;applyGraphics();
    P.x=8;P.z=-4;P.y=0;P.fe=10;P.st='move';P.vy=0;P.onG=true;updateStormglass(1/60);
    check('Updraft lifts Darren and restores flight energy',()=>P.vy>=6&&P.fe>10&&!P.onG);
    P.x=34;P.z=-6;P.y=0;enterZone(1);skip();
    check('Gale wave has three Stormlings and two Gustlings',()=>G.enemies.filter(e=>e.alive&&e.type==='stormling').length===3&&G.enemies.filter(e=>e.alive&&e.type==='gust').length===2);
    const belly=G.enemies.find(e=>e.alive&&e.type==='stormbelly');
    check('Selected Stormbelly spawns in Gale Gardens',()=>!!belly);
    belly.st='wind';belly.t=0;belly.y=0;P.x=belly.x+2;P.z=belly.z;P.y=0;P.inv=0;P.st='move';P.hp=TUNE.maxHp;
    updateEnemy(belly,1);const bellyHP=P.hp;
    check('Stomp warning precedes damage',()=>belly.m.warning.visible&&P.hp===bellyHP&&belly.st==='wind');
    const bellyTime=belly.t;G.paused=true;tick(0.1);check('Pause freezes selected enemy attack',()=>belly.t===bellyTime);G.paused=false;
    G.cine=true;tick(0.1);check('Dialogue freezes selected enemy attack',()=>belly.t===bellyTime);G.cine=false;
    P.y=1.2;belly.t=66;updateEnemy(belly,1);check('Jumping avoids Stormbelly stomp',()=>P.hp===bellyHP&&belly.st==='atk'&&!belly.m.warning.visible);
    P.y=0;P.inv=0;P.st='move';belly.st='wind';belly.t=66;updateEnemy(belly,1);check('Grounded player inside stomp takes damage',()=>P.hp<bellyHP);
    belly.t=18;updateEnemy(belly,1);check('Stomp exposes a recovery window',()=>belly.st==='rec');
    const storm=G.enemies.find(e=>e.type==='stormling');storm.st='wind';storm.t=48;storm.y=2.5;
    const wing=storm.m.wL.rotation.z;animateStormEnemy(storm,0.1);
    check('Stormling windup folds its articulated crescent wings',()=>storm.m.wL.rotation.z!==wing&&storm.m.tail.length===3&&storm.m.tips.length===2);
    let count=G.projs.length;updateEnemy(storm,1);
    check('Stormling fires three projectiles and recovers',()=>G.projs.length===count+3&&storm.st==='rec');
    for(const e of [...G.enemies])if(e.alive)killEnemy(e);updateZones(1);skip();
    check('Clearing Gale unlocks the Observatory bridge',()=>LV.links.find(l=>l.id==='gale-archive').open);
    P.x=63;P.z=-37;P.y=0;enterZone(2);skip();
    const rex=G.enemies.find(e=>e.alive&&e.type==='chomprex');check('Selected Chomp Rex spawns in Observatory',()=>!!rex);
    // Local RC15 fixture: test an unobstructed committed charge. Random nearby
    // wardlings otherwise push the rex backwards through valid separation logic.
    const chargePositions=G.enemies.map(e=>[e,e.x,e.z]);
    rex.x=LV.islands.archive.x;rex.z=LV.islands.archive.z;
    for(const o of G.enemies)if(o!==rex){o.x=rex.x+10;o.z=rex.z-6;}
    rex.st='wind';rex.t=0;rex.y=0;rex.face=0;P.x=rex.x;P.z=rex.z+2;P.y=0;P.hp=TUNE.maxHp;P.inv=0;P.st='move';updateEnemy(rex,1);const rexHP=P.hp;
    check('Rex arrow warns before charge damage',()=>rex.m.warning.visible&&P.hp===rexHP);
    rex.t=48;updateEnemy(rex,1);const rexStart=rex.z;P.x=rex.x+5;updateEnemy(rex,1);
    check('Committed charge moves forward and sideways dodge avoids bite',()=>rex.z>rexStart&&P.hp===rexHP&&!rex.m.warning.visible);
    P.x=rex.x;P.z=rex.z+1;P.inv=0;P.st='move';updateEnemy(rex,1);const afterBite=P.hp;
    P.inv=0;P.st='move';updateEnemy(rex,1);check('Rex bite damages at most once per charge',()=>afterBite<rexHP&&P.hp===afterBite);
    rex.t=25;updateEnemy(rex,1);check('Rex recovers after its short charge',()=>rex.st==='rec');
    for(const [e,x,z] of chargePositions){e.x=x;e.z=z;}
    check('Selected enemy poses remain finite',()=>{let good=true;for(const e of [belly,rex])for(const st of ['chase','wind','atk','rec','stun']){e.st=st;animateToonEnemy(e,0.02);e.m.root.traverse(o=>{if(![...o.position.toArray(),...o.scale.toArray(),o.rotation.x,o.rotation.y,o.rotation.z].every(Number.isFinite))good=false;});}return good;});
    rex.st='wind';killEnemy(rex);updateEnemy(rex,1);check('Defeated enemies hide their attack warnings',()=>!rex.m.warning.visible);
    const ward=G.enemies.find(e=>e.alive&&e.type==='wardling');ward.st='chase';ward.face=0;
    animateStormEnemy(ward,0.1);const walkingLeg=ward.m.legs[0].rotation.x;ward.st='wind';animateStormEnemy(ward,0.1);
    check('Wardling windup plants its legs and raises its shields',()=>walkingLeg!==ward.m.legs[0].rotation.x&&ward.m.aL.rotation.x<-0.9);ward.st='chase';
    let hp=ward.hp;enemyTakeHit(ward,40,{hs:3},0,-1);
    check('Wardling blocks frontal attacks',()=>Math.abs((hp-ward.hp)-4.8)<0.001);
    hp=ward.hp;enemyTakeHit(ward,40,{hs:3},0,1);
    check('Wardling takes full damage from the rear',()=>hp-ward.hp===40);
    ward.st='rec';hp=ward.hp;enemyTakeHit(ward,40,{hs:3},0,-1);
    check('Wardling is vulnerable during recovery',()=>hp-ward.hp===40);
    for(const e of [...G.enemies])if(e.alive)killEnemy(e);updateZones(1);skip();
    const saveData=loadSave();resetWorld(saveData);
    check('Checkpoint reload retains both cleared arenas',()=>LV.zoneState.gale.state==='cleared'&&LV.zoneState.archive.state==='cleared'&&LV.links.every(l=>l.open));
    P.x=30;P.z=-69;P.y=0;enterZone(3);skip();const boss=G.boss;
    check('Warden spawns with three breakable parts',()=>boss.type==='tempest'&&Object.keys(boss.m.parts).length===3);
    const haloAngle=boss.m.halo.rotation.z;animateStormEnemy(boss,0.2);
    check('Warden has an animated segmented halo and articulated legs',()=>boss.m.halo.rotation.z!==haloAngle&&boss.m.halo.children.length===10&&boss.m.legs.length===2);
    const models=[storm,ward,boss];
    check('All attack and recovery animation states keep finite transforms',()=>{for(const e of models){for(const st of ['chase','wind','atk','rec','stun','kneel','dead']){e.st=st;e.t=30;animateStormEnemy(e,0.02);let good=true;e.m.root.traverse(o=>{if(![o.position.x,o.position.y,o.position.z,o.rotation.x,o.rotation.y,o.rotation.z,o.scale.x,o.scale.y,o.scale.z].every(Number.isFinite))good=false;});if(!good)return false;}}boss.st='idle';return true;});
    boss.hp=boss.max*0.55;updateEnemy(boss,1);skip();
    check('Warden enters phase two below 60 percent',()=>boss.phase===2);
    boss.st='idle';boss.lightningClock=5.5;P.hp=TUNE.maxHp;P.inv=0;P.st='move';updateStormglass(0.01);
    check('Lightning warns before it deals damage',()=>SG.hazards.length===1&&P.hp===TUNE.maxHp&&!SG.hazards[0].fired);
    check('Lightning bolt is absent during warning',()=>!SG.hazards[0].bolt);
    hp=P.hp;P.x+=5;updateStormglass(1.31);
    check('Leaving the lightning circle avoids damage',()=>P.hp===hp);
    check('Lightning strike creates a visible finite bolt',()=>SG.hazards[0].bolt&&SG.hazards[0].bolt.geo.attributes.position.array.every(Number.isFinite));
    const boltNode=SG.hazards[0].bolt.g;clearStormHazards();check('Lightning cleanup removes bolt from scene',()=>!boltNode.parent&&SG.hazards.length===0);
    clearStormHazards();boss.lightningClock=5.5;P.st='move';P.inv=0;updateStormglass(0.01);P.y=5;updateStormglass(1.31);
    check('Lightning column damages an airborne player inside it',()=>P.hp<hp);
    clearStormHazards();boss.hp=boss.max*0.2;boss.st='idle';updateEnemy(boss,1);skip();
    check('Warden enters phase three below 25 percent',()=>boss.phase===3);
    breakCrystal(boss,'armL');breakCrystal(boss,'armR');
    check('Breaking both arm crystals makes the Warden kneel',()=>boss.st==='kneel'&&!boss.m.parts.armL.alive&&!boss.m.parts.armR.alive);
    animateStormEnemy(boss,0.1);check('Broken Warden crystals remain hidden while kneeling',()=>!boss.m.parts.armL.node.visible&&!boss.m.parts.armR.node.visible&&boss.m.legs[0].rotation.x===0.35);
    check('Crafting refuses insufficient resources',()=>{UNLOCKS.parts.stormglass=0;UNLOCKS.parts.tempest=0;UNLOCKS.weapons=UNLOCKS.weapons.filter(x=>x!=='stormsaber');return !craft('stormsaber');});
    UNLOCKS.parts.stormglass=12;UNLOCKS.parts.tempest=1;
    check('Stormsaber recipe consumes exact materials once',()=>craft('stormsaber')&&owned('stormsaber')&&partCount('stormglass')===0&&partCount('tempest')===0&&!craft('stormsaber'));
    bossDie(boss);skip();
    for(let i=0;i<60&&G.mode!=='win';i++){tick(0.15);await new Promise(r=>setTimeout(r,10));skip();}
    check('Defeating Warden completes and saves Chapter 3',()=>G.mode==='win'&&UNLOCKS.done.includes('ch3'));
    openPanel('guide');
    check('Field guide includes Sky Drake and all eight existing entries',()=>document.querySelector('.concept-sheet')&&document.querySelectorAll('.guide-card').length===9&&document.querySelector('.guide-grid').textContent.includes('Sky Drake'));closePanel();
    loadChapter('ch1');check('Leaving Chapter 3 restores original sky and clears hazards',()=>scene.background===SG.originalSky&&SG.hazards.length===0&&SG.lifts.length===0);
    check('Leaving Chapter 3 releases added scenery references',()=>SG.flags.length===0&&SG.ownedGeometries.length===0&&SG.orrery===null&&SG.bell===null);
  }catch(e){results.push({name:'Runtime exception',pass:false,error:e.stack});}
  finally{
    for(const key of Object.keys(localStorage))if(key.startsWith('darren'))localStorage.removeItem(key);
    for(const [key,value] of Object.entries(backup))localStorage.setItem(key,value);
    const pre=document.createElement('pre');pre.id='qa-results';pre.style='position:fixed;inset:0;z-index:100000;background:#10232b;color:#c9fff2;overflow:auto;padding:24px;white-space:pre-wrap;font:14px monospace';pre.textContent=JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,results},null,2);document.body.appendChild(pre);
  }
})();
