/* Local regression coverage for the repair pass. Runs only in a fresh test profile. */
(async()=>{
window.__manual=true;
for(let i=0;i<240&&(!P.m.skin||!LV.mom.skin);i++)await new Promise(r=>setTimeout(r,25));
const results=[],check=(name,fn)=>{try{if(!fn())throw Error('Assertion failed');results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.stack});}};
const skip=()=>{for(let i=0;i<100&&TALK.line;i++){TALK.shown=TALK.line.length;advanceTalk();}};
const key=(code,type='keydown')=>(document.activeElement||document.body).dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));
try{
 G.mode='title';openPanel('settings');key('Enter');check('Enter in Settings does not start or reset the game',()=>G.mode==='title'&&!$('panel').hidden);
 const first=document.activeElement;key('Tab');check('Tab stays in the active panel and moves focus',()=>!$('panel').hidden&&document.activeElement!==first&&$('panel').contains(document.activeElement));
 closePanel();loadChapter('ch1');startGame(false);skip();
 press('heavy');In.tmx=1;In.tmy=-1;In.cdx=88;P.buf={a:'light',t:0};key('KeyW');dispatchEvent(new Event('blur'));
 check('Blur clears action queue, touch movement, camera deltas and buffered action',()=>!In.q.length&&!In.tmx&&!In.tmy&&!In.cdx&&!P.buf&&!keys.KeyW&&!In.held.heavy);
 const stick=$('stickZone');stick.dispatchEvent(new PointerEvent('pointerdown',{pointerId:42,clientX:100,clientY:100}));stick.dispatchEvent(new PointerEvent('pointermove',{pointerId:42,clientX:140,clientY:100}));
 check('Touch stick accepts movement',()=>In.tmx>.5);
 stick.dispatchEvent(new PointerEvent('lostpointercapture',{pointerId:42}));check('Lost touch capture releases movement',()=>In.tmx===0);
 press('heavy');In.tmx=.8;In.cdx=4;togglePause();check('Pause clears held and queued combat input',()=>G.paused&&!In.held.heavy&&!In.q.length&&!In.tmx&&!In.cdx);togglePause();
 press('dash','key:ShiftLeft');press('dash','pad:1');release('dash','pad:1');check('Releasing one device preserves another held action',()=>In.held.dash);release('dash','key:ShiftLeft');check('Last device release clears held action',()=>!In.held.dash);
 const oldPad=navigator.getGamepads;let buttons=Array.from({length:16},()=>({pressed:false}));
 Object.defineProperty(navigator,'getGamepads',{value:()=>[{connected:true,axes:[0,0,0,0],buttons}],configurable:true});buttons[2].pressed=true;pollPad();
 check('Simulated controller action is held',()=>In.held.light);
 Object.defineProperty(navigator,'getGamepads',{value:()=>[],configurable:true});pollPad();check('Controller disconnect releases held actions and edges',()=>!In.held.light&&padPrev.length===0);
 Object.defineProperty(navigator,'getGamepads',{value:oldPad,configurable:true});resetInput();
 togglePause();openPanel('settings');const focus=document.activeElement;navigatePadMenu(13);check('Controller D-pad navigates visible menu controls',()=>document.activeElement!==focus&&$('panel').contains(document.activeElement));
 const range=$('panel').querySelector('input[type=range]');range.focus();const value=Number(range.value);navigatePadMenu(15);check('Controller adjusts focused settings slider',()=>Number(range.value)>value);
 navigatePadMenu(1);check('Controller Back closes panel and preserves pause',()=>$('panel').hidden&&G.paused);navigatePadMenu(1);check('Controller Back resumes from pause',()=>!G.paused);
 togglePause();openPanel('settings');key('Escape');check('Escape closes Settings without unpausing combat',()=>$('panel').hidden&&G.paused);togglePause();
 const hp=P.hp;G.cine=true;P.inv=0;P.st='move';check('Direct damage is suppressed during dialogue',()=>!damagePlayer(20,P.x+1,P.z,false)&&P.hp===hp);
 const hazard=ring(P.x,P.y,P.z,.1,2,3,0xffffff,20),life=hazard.life;tick(.1);check('Hostile shockwaves freeze throughout dialogue',()=>hazard.life===life&&P.hp===hp);G.cine=false;clearEnemies();
 let fired=0;scheduleFlow(()=>fired++,200);togglePause();tick(.5);check('Ending/transition timer freezes while paused',()=>fired===0);togglePause();updateFlow(.21);check('Ending timer resumes exactly once',()=>fired===1);updateFlow(1);check('Completed transition is not repeated',()=>fired===1);
 scheduleFlow(()=>fired++,100);quitToTitle();G.mode='play';updateFlow(1);check('Quit cancels stale ending callbacks',()=>fired===1);scheduleFlow(()=>fired++,100);loadChapter('ch2');G.mode='play';updateFlow(1);check('Chapter switch cancels stale ending callbacks',()=>fired===1);
 loadChapter('ch1');const storageKey=CH.saveKey;
 for(const input of [{cp:999,cleared:'broken',taken:5,t:'oops'},{cp:-3,cleared:null,taken:null},{cp:1.4},[],null,'bad']){
  localStorage.setItem(storageKey,JSON.stringify(input));check('Malformed checkpoint handled: '+JSON.stringify(input),()=>{showTitle();const s=loadSave();return !s||(Number.isInteger(s.cp)&&s.cp>=0&&s.cp<CH.zones.length&&Array.isArray(s.cleared)&&Array.isArray(s.taken)&&Number.isFinite(s.t));});
 }
 localStorage.setItem(storageKey,'{broken');check('Invalid JSON checkpoint does not crash title',()=>{showTitle();return loadSave()===null;});
 localStorage.removeItem(storageKey+'.recovery');const original=JSON.stringify({cp:1,cleared:[CH.zones[0].id],taken:[],t:125});localStorage.setItem(storageKey,original);
 startGame(true);skip();check('Legacy checkpoint and elapsed time survive Continue',()=>LV.cp===1&&G.stats.t===125);
 save();check('Pre-repair save is preserved verbatim in recovery backup',()=>localStorage.getItem(storageKey+'.recovery')===original);save();check('Repeated saves retain the original recovery value',()=>localStorage.getItem(storageKey+'.recovery')===original);
 const previous=localStorage.getItem(storageKey),oldSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};
 check('Storage failure returns false without replacing the old checkpoint',()=>save()===false&&localStorage.getItem(storageKey)===previous);Storage.prototype.setItem=oldSet;
 startGame(false);skip();P.x=CH.level.start.x;P.z=CH.level.start.z;P.y=0;P.st='move';P.hp=TUNE.maxHp;LV.lastSafe={x:P.x,z:P.z};const safe={...LV.lastSafe};playerFell();check('Fall recovery returns to finite safe coordinates',()=>P.x===safe.x&&P.z===safe.z&&P.y===4&&P.hp===TUNE.maxHp-TUNE.fallDamage);
 for(let i=0;i<4;i++){faint();retry();skip();check('Repeated retry restores health and avoids duplicate hostiles '+i,()=>G.mode==='play'&&P.hp===TUNE.maxHp&&G.enemies.length===0);}
 const gemId=Object.keys(PARTS)[0];spawnGem(gemId,P.x,P.y+.9,P.z);G.gems[0].t=1;updateGems(1/60);check('Gem pickup at exact player center does not create NaN',()=>G.gems.length===0&&Number.isFinite(partCount(gemId)));
 const cache=[];
 for(let i=0;i<3;i++){for(const dragon of [true,false]){const m=buildRoundEnemy(dragon);for(const state of ['chase','wind','atk','rec','stun'])animateToonEnemy({m,alive:true,type:dragon?'stormbelly':'chomprex',st:state,animTime:0,y:0},.02);let finite=true;m.root.traverse(o=>{if(![...o.position.toArray(),...o.scale.toArray(),...o.quaternion.toArray()].every(Number.isFinite))finite=false;});check('Creature transforms finite '+i+' '+dragon,()=>finite);}cache.push(Object.keys(TOON.geo).length);}
 check('Repeated creature construction reuses geometry cache',()=>cache.every(n=>n===cache[0]));
 loadChapter('ch3');startGame(false);skip();LV.active=null;P.onG=true;
 const pillar=LV.colliders.find(c=>c.camera&&c.r===.57);
 P.x=pillar.x;P.z=pillar.z;P.y=0;levelConstrain();
 check('Exact-center prop overlap resolves to a finite exterior point',()=>Number.isFinite(P.x)&&Math.hypot(P.x-pillar.x,P.z-pillar.z)>=pillar.r+.349);
 P.x=pillar.x+.1;P.z=pillar.z;P.y=3.2;levelConstrain();
 check('Tall pillar collision extends to the visible stone height',()=>Math.hypot(P.x-pillar.x,P.z-pillar.z)>=pillar.r+.349);
 P.x=pillar.x;P.z=pillar.z;P.y=pillar.height+1;levelConstrain();
 check('Flight remains clear above the pillar',()=>P.x===pillar.x&&P.z===pillar.z);
 camera.position.set(pillar.x-5,2,pillar.z);constrainCamera(pillar.x+2,1.5,pillar.z);
 check('Camera retracts before obstructing stone',()=>camera.position.x>pillar.x+pillar.r);
 camera.position.set(pillar.x-5,pillar.height+3,pillar.z);constrainCamera(pillar.x+2,pillar.height+2,pillar.z);
 check('Camera stays at full distance above the obstruction',()=>camera.position.x===pillar.x-5);
 for(const id of Object.keys(WEAPONS))if(!UNLOCKS.weapons.includes(id))UNLOCKS.weapons.push(id);
 for(const id of Object.keys(WEAPONS)){equipWeapon(id);equipLeft(id);}
 const materialCount=TOYS.length;
 for(let i=0;i<4;i++)for(const id of Object.keys(WEAPONS)){equipWeapon(id);equipLeft(id);}
 check('Repeated equipment cycles allocate no additional materials',()=>TOYS.length===materialCount);
 equipWeapon('cloudcutter');const right=P.m.sword;equipWeapon('cloudcutter');
 check('Re-equipping a weapon preserves the existing model',()=>P.m.sword===right&&right.parent);
 equipLeft('cloudcutter');check('Twin hands own separate weapon instances',()=>P.m.swordL!==P.m.sword&&P.m.swordL.parent===P.m.sockL);
 equipLeft('not-a-weapon');check('Invalid left-hand equipment is safely empty',()=>P.weaponL===null&&P.m.swordL===null);
 loadChapter('adv');startGame(false);skip();advBossDown({});togglePause();updateFlow(3);
 check('Adventure victory dialogue waits while paused',()=>!G.cine&&flowTimers.length===1);
 togglePause();updateFlow(1.3);check('Adventure victory dialogue resumes after pause',()=>G.cine&&TALK.q===CH.story.titan_down);skip();
 advBossDown({});loadChapter('ch1');G.mode='play';G.cine=false;updateFlow(3);
 check('Chapter switch cancels Adventure victory dialogue',()=>!G.cine&&!flowTimers.length);
 let oldDialogue=0;talk('intro',()=>oldDialogue++);loadChapter('ch2');advanceTalk();
 check('Chapter switch clears interrupted dialogue and callback',()=>!TALK.line&&!TALK.done&&!G.cine&&$('talk').hidden&&oldDialogue===0);
 talk('intro',()=>oldDialogue++);startGame(false);advanceTalk();
 check('Restart clears interrupted dialogue without applying its callback',()=>!TALK.line&&!TALK.done&&!G.cine&&oldDialogue===0);
 clearEnemies();const cameraEnemy=spawnEnemy('chomprex',P.x,P.z-5,{});
 camera.position.set(P.x,2,P.z-7);constrainCamera(P.x,1.5,P.z);
 check('Camera retracts before a large enemy behind Darren',()=>camera.position.z>cameraEnemy.z+cameraEnemy.r);
 cameraEnemy.alive=false;camera.position.set(P.x,2,P.z-7);constrainCamera(P.x,1.5,P.z);
 check('Defeated enemy no longer obstructs camera',()=>camera.position.z===P.z-7);clearEnemies();
 P.st='charge';P.f=40;press('heavy');togglePause();togglePause();tick(1/60);
 check('Pause cancels a held charge without firing on resume',()=>P.st!=='attack'&&!In.held.heavy&&!In.q.length);
 P.st='charge';P.f=40;press('heavy');dispatchEvent(new Event('blur'));tick(1/60);
 check('Blur cancels a held charge without firing',()=>P.st!=='attack'&&!In.held.heavy&&!In.q.length);
}catch(e){results.push({name:'Regression exception',pass:false,error:e.stack});}
const pre=document.createElement('pre');pre.id='repair-results';pre.textContent=JSON.stringify({passed:results.filter(r=>r.pass).length,total:results.length,results},null,2);pre.style='position:fixed;inset:0;overflow:auto;z-index:100000;background:#123;color:white;padding:24px';document.body.appendChild(pre);
})();
