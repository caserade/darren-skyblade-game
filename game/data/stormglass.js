/* Stormglass Reach expansion. Distances: metres; combat time: 60fps frames. */
(() => {
  const D = window.DARREN_DATA;
  D.speakers.warden = {name:'Tempest Warden',color:'#83f3e6'};
  D.enemies.stormling = {name:'Stormling',hp:100,poise:18};
  D.enemies.wardling = {name:'Wardling',hp:240,poise:50};
  D.enemies.tempest = {name:'Tempest Warden',hp:3600};
  D.parts.stormglass = {name:'Stormglass',color:'#78eee1',rarity:3,where:'Stormlings, Wardlings and the Tempest Warden in Chapter 3'};
  D.parts.tempest = {name:'Tempest Core',color:'#e4ba68',rarity:4,where:'Tempest Warden weak spots and victory'};
  D.drops.stormling = [['stormglass',2],['feather',1,0.6]];
  D.drops.wardling = [['stormglass',3],['plate',1]];
  D.drops.tempest = [['tempest',1],['stormglass',4]];
  D.weapons.stormsaber = {name:'Stormsaber',kind:'blade',text:'A swift crystal saber. Its sweeping finisher rewards staying mobile.',speed:1.18,power:1.15,reach:1.15,finisher:'H4',color:'#78eee1',recipe:{stormglass:12,tempest:1}};
  D.chapters[1].ending.next = 'Chapter 3: Stormglass Reach is ready to play';
  D.chapters.push({
    id:'ch3',name:'Chapter 3: Stormglass Reach',short:'Stormglass Reach',
    tagline:'The sky beacons have gone dark. Ride the updrafts, cross the shattered observatory, and free its guardian from the storm.',
    saveKey:'darrenSkyblade.ch3',ruffy:'follow',mom:false,endingTalk:'ending',
    level:{start:{x:1,z:3,face:1.4},pawPrints:false,
      islands:[
        {id:'home',name:'Lantern Landing',x:0,z:0,r:13,deco:[]},
        {id:'gale',name:'Gale Gardens',x:34,z:-6,r:14,deco:[]},
        {id:'archive',name:'Shattered Observatory',x:63,z:-37,r:15,deco:[]},
        {id:'eye',name:'Eye of the Storm',x:30,z:-78,r:23,deco:[]}
      ],
      links:[
        {id:'landing-gale',type:'bridge',a:'home',b:'gale',w:4.5},
        {id:'gale-archive',type:'bridge',a:'gale',b:'archive',w:4,lockedBy:'gale'},
        {id:'archive-eye',type:'bridge',a:'archive',b:'eye',w:4.5,lockedBy:'archive'}
      ]},
    updrafts:[{x:8,z:-4,r:2.1},{x:31,z:-10,r:2.3},{x:65,z:-41,r:2.3},{x:18,z:-74,r:2.5},{x:42,z:-82,r:2.5}],
    zones:[
      {id:'home',island:'home',enter:'intro',enemies:[],checkpoint:[1,3],objective:'Cross the bridge to Gale Gardens. Cyan rings refill flight energy.'},
      {id:'gale',island:'gale',enter:'gale_enter',enemies:[['stormling',3],['gust',2]],clear:'gale_clear',checkpoint:[25,-4],objective:'Defeat the Stormlings. Sidestep their three-shot crystal fan.',afterObjective:'Cross to the Shattered Observatory'},
      {id:'archive',island:'archive',enter:'archive_enter',enemies:[['wardling',2],['stormling',2]],clear:'archive_clear',checkpoint:[56,-29],objective:'Flank Wardlings, or strike while they recover from a charge.',afterObjective:'Reach the Eye of the Storm'},
      {id:'eye',island:'eye',enter:'warden_intro',enemies:[],boss:'tempest',bossAt:[30,-84],clear:'warden_clear',finale:true,checkpoint:[38,-65],objective:'Break the two arm crystals, then attack the exposed back core.'}
    ],
    story:{
      intro:[['narrator','Beyond Cloudroost, three sky beacons have fallen silent.'],['darren','Ruffy, those ruins are holding up half the sky. We have to get the lights back on.'],['narrator','Cyan rings mark updrafts. Step inside to rise and refill your flight energy. Press V to fly; hold Space to climb.']],
      gale_enter:[['darren','Those crystal wings are charging!'],['narrator','Stormlings flash before firing a fan of three shards. Move sideways, then close in during their recovery.']],
      gale_clear:[['narrator','The first beacon ignites. Its warm light reveals a path to the observatory.']],
      archive_enter:[['narrator','Wardlings guard the archive. Their front plates shrug off hits; circle behind them or wait for their charge to end.']],
      archive_clear:[['darren','Two lights. One guardian left.'],['narrator','Gather the Stormglass they drop. The Skyforge can shape it into a new saber.']],
      warden_intro:[['warden','BEACONS LOST. SKY UNSTABLE. ALL VISITORS: TURN BACK.'],['darren','We came to fix the lights, big guy!'],['narrator','Break both arm crystals to stagger the Warden. Press Q repeatedly to focus a weak spot.']],
      warden_phase2:[['warden','STORM OVERLOAD. SEEK CLEAR GROUND.'],['narrator','A violet circle marks the next lightning strike. Leave it before it flashes. Flying inside the column will not protect you.']],
      warden_phase3:[['darren','His back core is exposed!'],['narrator','Keep clear of the lightning, then fly behind him and strike.']],
      warden_clear:[['warden','STORM CLEARED. LITTLE FLAME... THANK YOU.'],['narrator','The final beacon lights. The floating islands settle into a gentle orbit.']],
      ending:[['darren','The sky has its lights back. And we have a story for Mom.'],['ruffy','Arf!'],['narrator','Use Stormglass and a Tempest Core in the Hangar Forge to craft the Stormsaber.']]
    },
    ending:{title:'Stormglass Reach restored',text:'All three beacons shine again.',next:'Forge the Stormsaber or return to Cloud Utopia'}
  });
})();
