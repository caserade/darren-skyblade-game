/*
  DARREN: SKYBLADE HUNT — CHAPTER 2: FIREWOOD FOR MOM
  ===================================================
  The second chapter. Same format as a chapter in data/game_data.js (see the notes there and README_FOR_AI.md).
  It is added to the list of chapters, so the title screen offers it next to Chapter 1.

  Firewood: each zone's `pickups` appear when its enemies are beaten. Picking up all of a zone's pickups
  plays its `done` dialogue and opens the way on. `counter` shows the running total on screen.
  `ruffy: 'follow'` makes Ruffy trot along behind Darren (and bark at firewood he sniffs out).
*/
window.DARREN_DATA.chapters.push({
  id: 'ch2',
  name: 'Chapter 2: Firewood for Mom',
  short: 'Firewood for Mom',
  tagline:
    "The first snow of winter, and Mom's stove is cold. Darren and Ruffy head into the Whispering Pines to gather firewood.",
  saveKey: 'darrenSkyblade.ch2',
  ruffy: 'follow',
  snowfall: true,
  woodpile: true, // Mom's wood store by the cottage fills up at the end
  counter: { item: 'wood', name: 'Firewood' },
  endingTalk: 'ending',

  level: {
    start: { x: 1.0, z: 2.5, face: 1.4 },
    islands: [
      { id: 'home', name: "Mom's House", x: 0, z: 0, r: 13, deco: ['house', 'trees', 'flowers', 'snow'] },
      { id: 'thicket', name: 'Bramble Thicket', x: 36, z: -8, r: 12, deco: ['pines', 'logs', 'mushrooms', 'snow'] },
      { id: 'hollow', name: 'Mosslight Hollow', x: 70, z: -42, r: 12, deco: ['pines', 'rocks', 'mushrooms', 'snow'] },
      { id: 'creek', name: 'Frostfern Creek', x: 50, z: -80, r: 11, deco: ['pines', 'rocks', 'crystals', 'snow'] },
      {
        id: 'clearing',
        name: "Old Knotroot's Clearing",
        x: 14,
        z: -112,
        r: 20,
        deco: ['pines', 'logs', 'ruins', 'snow'],
      },
    ],
    links: [
      { id: 'home-thicket', type: 'bridge', a: 'home', b: 'thicket', w: 4.2 },
      {
        id: 'thicket-hollow',
        type: 'stones',
        a: 'thicket',
        b: 'hollow',
        lockedBy: 'thicket',
        stones: [
          [47.67, -19.67, 2.2],
          [52.27, -24.27, 2.2],
          [56.86, -28.86, 2.2],
        ],
      },
      { id: 'hollow-creek', type: 'bridge', a: 'hollow', b: 'creek', w: 4, lockedBy: 'hollow' },
      { id: 'creek-clearing', type: 'bridge', a: 'creek', b: 'clearing', w: 4.4, lockedBy: 'creek' },
    ],
    pawPrints: false, // Ruffy is with Darren this time
  },

  zones: [
    {
      id: 'home',
      island: 'home',
      enter: 'intro',
      enemies: [],
      checkpoint: [1.0, 2.5],
      giveWeapon: 'ladle',
      objective: 'Cross the bridge to Bramble Thicket',
    },
    {
      id: 'thicket',
      island: 'thicket',
      enter: 'thicket_enter',
      enemies: [
        ['bark', 3],
        ['puff', 2],
      ],
      clear: 'thicket_clear',
      done: 'thicket_done',
      checkpoint: [28.5, -6.3],
      pickups: [
        { item: 'wood', x: 40, z: -12.5 },
        { item: 'wood', x: 31, z: -13 },
        { item: 'wood', x: 40.5, z: -2.5 },
      ],
      collect: 'Pick up the firewood',
      objective: 'Stop the Barklings (step off the orange mark before they pop up)',
      afterObjective: 'Jump across the stones to Mosslight Hollow',
    },
    {
      id: 'hollow',
      island: 'hollow',
      enter: 'hollow_enter',
      enemies: [
        ['snow', 3],
        ['bark', 2],
        ['gust', 1],
        ['puff', 1, 'elite'],
      ],
      clear: 'hollow_clear',
      done: 'hollow_done',
      checkpoint: [63, -35],
      pickups: [
        { item: 'wood', x: 74.5, z: -46.5 },
        { item: 'wood', x: 65, z: -48 },
        { item: 'wood', x: 76, z: -38 },
      ],
      collect: 'Pick up the firewood',
      objective: 'Clear the hollow (snowballs land on the blue marks)',
      afterObjective: 'Cross the bridge to Frostfern Creek',
    },
    {
      id: 'creek',
      island: 'creek',
      enter: 'creek_enter',
      enemies: [
        ['bolt', 2],
        ['snow', 2],
        ['bark', 2],
        ['bark', 1, 'elite'],
      ],
      clear: 'creek_clear',
      done: 'creek_done',
      checkpoint: [53.6, -73.2],
      pickups: [
        { item: 'wood', x: 45.5, z: -84 },
        { item: 'wood', x: 55.5, z: -84.5 },
      ],
      collect: 'Pick up the firewood',
      objective: 'Clear Frostfern Creek',
      afterObjective: "Cross the bridge to Old Knotroot's Clearing",
    },
    {
      id: 'clearing',
      island: 'clearing',
      enter: 'knot_intro',
      boss: 'knot',
      bossAt: [10, -116],
      enemies: [],
      clear: 'knot_defeated',
      done: 'knot_done',
      finale: true, // after the last pickups here: back home for the ending
      checkpoint: [25.5, -101.8],
      pickups: [
        { item: 'wood', x: 8, z: -110 },
        { item: 'wood', x: 18, z: -119 },
      ],
      collect: "Pick up Old Knotroot's firewood",
      objective: 'Break the two glowing sap knots on his branches',
    },
  ],

  /* story: [speaker, text]. Speakers are in DATA.speakers (game_data.js). */
  story: {
    intro: [
      ['narrator', 'The next morning. The first snow of winter is falling on Cloudroost Bluff.'],
      ['mom', "Brrr! And the stove is stone cold. We burned the last log on last night's soup."],
      ['darren', "I said I'd get firewood, and I will!"],
      ['ruffy', 'Arf! Arf!'],
      ['mom', 'Ruffy wants to come too. You stay right next to Darren this time, mister.'],
      [
        'mom',
        'The good dry wood is out past Bramble Thicket. Old Knotroot lives out there... he has been grumpy for a hundred years.',
      ],
      ['mom', "Here. Take my old ladle. Don't laugh! I was quite the adventurer before I was a mom."],
      [
        'narrator',
        "You got Mom's Ladle! It is slow and short, but it hits like a frying pan, and its Soup Slam finisher heals you.",
      ],
      ['narrator', 'Switch weapons with R, or in the Pause menu under Weapons.'],
      ['darren', "We'll bring back enough wood for the whole winter."],
    ],
    thicket_enter: [
      ['darren', 'Those stumps are moving!'],
      ['ruffy', 'Grrrr...'],
      [
        'narrator',
        'Barklings dig under the ground and burst up beneath you. Step off the orange mark, then hit them while they are dizzy.',
      ],
    ],
    thicket_clear: [
      ['darren', 'Firewood! Ruffy, can you sniff out the bundles?'],
      ['ruffy', 'Arf!'],
      ['narrator', 'Ruffy runs to firewood nearby and barks. Pick up every bundle to open the way on.'],
    ],
    thicket_done: [['darren', 'Three bundles! And the stones are rising out of the clouds. Come on, Ruffy!']],
    hollow_enter: [
      ['darren', 'Snowcaps! Watch out, Ruffy, they throw snowballs!'],
      ['narrator', 'A snowball lands on its blue mark. If it hits you, you are chilly and slow for a moment.'],
      ['darren', 'And why is that Puffcap wearing a crown?'],
      ['narrator', 'Elite enemies are tougher and keep attacking through light hits. Heavy finishers stagger them.'],
    ],
    hollow_clear: [
      ['ruffy', 'Arf! Arf!'],
      ['darren', 'More wood under the moss. Good boy!'],
    ],
    hollow_done: [['darren', "Mom's going to be so warm. Let's keep going."]],
    creek_enter: [['darren', 'Frostfern Creek. Everything here is frozen solid... except these guys.']],
    creek_clear: [['darren', 'Almost enough wood. Just a little further.']],
    creek_done: [
      ['narrator', 'The roots across the last bridge pull back. Something huge is breathing in the clearing ahead.'],
    ],
    knot_intro: [
      ['knot', 'WHO... TAKES... FROM... MY... FOREST...'],
      ['darren', "We're not chopping anything! We're just picking up fallen branches for my Mom's stove."],
      ['knot', 'FALLEN... MY BRANCHES... MINE... GO HOME, LITTLE FLAME!'],
      ['ruffy', 'Grrr! Arf!'],
      ['narrator', 'Break the two glowing sap knots on his branches to bring Old Knotroot down.'],
    ],
    knot_phase2: [
      ['knot', 'ROOTS... RISE!'],
      ['narrator', 'Roots burst out of the ground along the red marks. Keep moving sideways.'],
    ],
    knot_phase3: [
      ['knot', 'MY HEART-KNOT... NO...'],
      ['darren', 'The knot on his back is glowing. Now!'],
    ],
    knot_defeated: [
      ['knot', '...oof. Little flame... is... strong.'],
      ['knot', 'My branches were so heavy with snow... you knocked it all off. I can stand up straight again.'],
      ['darren', "Oh! So that's why you were so cranky."],
      ['knot', "Take my fallen wood, little flame. Warm your mother's house. And visit an old tree sometime."],
      ['ruffy', 'Arf!'],
    ],
    knot_done: [['darren', "That's all of it. Let's go home, Ruffy!"]],
    ending: [
      ['mom', 'Darren! Ruffy! Look at all that wood!'],
      ['narrator', 'The wood store fills up, and the stove glows warm and orange.'],
      ['mom', 'You two are the best. Hot cocoa for the brave firewood hunters.'],
      ['ruffy', 'Arf! Arf!'],
      ['darren', 'Old Knotroot says hi, by the way.'],
      ['mom', "...I'm not even going to ask."],
    ],
  },
  ending: {
    title: 'Chapter 2 complete',
    text: "Mom's stove is warm and the wood store is full.",
    next: 'More adventures are on the way',
  },
});
