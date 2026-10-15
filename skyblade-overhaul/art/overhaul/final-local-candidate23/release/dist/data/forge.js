/*
  DARREN: SKYBLADE HUNT — SKYFORGE DATA (parts, drops, craftable weapons and armor)
  ===============================================================================
  Plain data, like game_data.js. ChatGPT (or you) can add new parts, weapons, armor pieces and recipes here
  without touching the code. See README_FOR_AI.md, "Skyforge" recipes, and docs/CHATGPT_GUIDE.md.

  PARTS     are materials. Enemies drop them (see `drops`), resource crystals drop them, and bosses drop
            rare ones when their crystals / knots break.
  WEAPONS   added here join DATA.weapons. kind: 'blade' (sword: combos and finishers), 'gun' (rapid shots),
            'bow' (piercing arrows), 'mortar' (exploding lobbed shells). Guns, bows and mortars are used in
            Twin Arms style (R-arm = Slash button, L-arm = Heavy button).
  ARMOR     four slots: head, body, arms, legs. Stats add up:
              hp     extra max health          def    fraction of damage blocked (0.05 = 5%)
              speed  extra run speed (0.05=5%)  stam   extra stamina regen (0.1 = 10%)
              flight extra flight energy        power  extra damage (0.05 = 5%)
            set: wearing all four pieces of a set gives its setBonus (see `sets`).
            look: shape of the 3D piece (see src/forge.js buildArmorPiece): head 'cap' | 'crest' | 'visor' | 'horns',
            body 'plate' | 'vest', arms 'pads' | 'spikes', legs 'greaves' | 'boots'.
  RECIPES   recipe: { partId: count, ... } — what the Skyforge needs to make it.
*/
(function () {
  const D = window.DARREN_DATA;

  D.parts = {
    spore: { name: 'Puffcap Spore', color: '#ff8a7a', rarity: 1, where: 'Puffcaps and Snowcaps' },
    feather: { name: 'Gale Feather', color: '#6fe0cf', rarity: 1, where: 'Gustlings' },
    coil: { name: 'Spark Coil', color: '#ffd23a', rarity: 1, where: 'Boltails' },
    plate: { name: 'Thorn Plate', color: '#4f9a5a', rarity: 2, where: 'Thornbacks (break the shell)' },
    bark: { name: 'Hard Bark', color: '#a5713f', rarity: 1, where: 'Barklings' },
    frost: { name: 'Frost Shard', color: '#bfe8ff', rarity: 2, where: 'Snowcaps and Frost crystals' },
    ember: { name: 'Ember Crystal', color: '#ff8a1e', rarity: 2, where: 'Ember crystals in Cloud Utopia, bosses' },
    cloud: { name: 'Cloudsilk', color: '#f4f0ff', rarity: 2, where: 'Cloudsilk crystals on high islands' },
    crown: { name: 'Elite Crown Shard', color: '#ffc93c', rarity: 3, where: 'Any Elite enemy' },
    grumble: { name: 'Grumble Core', color: '#ffa030', rarity: 4, where: "Grumblepeak's crystals" },
    heart: { name: 'Heartwood Knot', color: '#c8ff5a', rarity: 4, where: "Old Knotroot's sap knots" },
    titan: { name: 'Titan Core', color: '#9a7cff', rarity: 5, where: 'Titanic Grumblepeak (Cloud Utopia contract)' },
  };

  // what each enemy can drop: [partId, count, chance 0..1]. 'elite' is added on top for Elite enemies.
  D.drops = {
    puff: [['spore', 1, 0.8]],
    gust: [['feather', 1, 0.85]],
    bolt: [
      ['coil', 1, 0.85],
      ['ember', 1, 0.15],
    ],
    thorn: [
      ['plate', 2, 1],
      ['bark', 1, 0.5],
    ],
    bark: [['bark', 1, 0.85]],
    snow: [
      ['spore', 1, 0.5],
      ['frost', 1, 0.6],
    ],
    elite: [['crown', 1, 1]],
    // boss weak spots: each broken crystal / knot drops these
    boss: [
      ['grumble', 1, 1],
      ['ember', 2, 1],
    ],
    knot: [
      ['heart', 1, 1],
      ['bark', 3, 1],
    ],
    titan: [
      ['titan', 1, 1],
      ['ember', 3, 1],
    ],
    // resource crystals (Cloud Utopia): the node lists its own part
  };

  // ---- craftable weapons (merged into DATA.weapons) ----
  const W = D.weapons;
  Object.assign(W.emberfang, { kind: 'blade' });
  Object.assign(W.cloudcutter, { kind: 'blade', recipe: { feather: 6, coil: 2 } });
  Object.assign(W.jellyblade, { kind: 'blade', recipe: { spore: 6, frost: 2 } });
  Object.assign(W.ladle, { kind: 'blade', recipe: { bark: 4, plate: 2 } });
  Object.assign(W, {
    frostfang: {
      name: 'Frostfang',
      kind: 'blade',
      text: 'An icy blade. Every hit chills enemies so they move and attack slower.',
      speed: 1.05,
      power: 1.05,
      reach: 1.05,
      finisher: 'H4',
      color: '#bfe8ff',
      chill: true,
      recipe: { frost: 8, crown: 1 },
    },
    thornbreaker: {
      name: 'Thornbreaker',
      kind: 'blade',
      text: 'A huge spiked cleaver. Slow, but it smashes guards and sends out a ground wave.',
      speed: 0.85,
      power: 1.4,
      reach: 1.1,
      finisher: 'GC',
      color: '#6fbf5a',
      heavyHits: true,
      recipe: { plate: 6, bark: 6 },
    },
    titanedge: {
      name: 'Titan Edge',
      kind: 'blade',
      text: 'Forged from a Titan Core. Fast, enormous reach, and a finisher that splits the ground.',
      speed: 1.05,
      power: 1.45,
      reach: 1.25,
      finisher: 'TE',
      color: '#9a7cff',
      recipe: { titan: 3, grumble: 2, ember: 6 },
    },
    emberblaster: {
      name: 'Ember Blaster',
      kind: 'gun',
      text: 'A fire-crystal arm cannon. Hold the button for rapid shots that home in on your target.',
      speed: 1,
      power: 1,
      reach: 1,
      finisher: 'H4',
      color: '#ff8a1e',
      shot: { dmg: 6, speed: 34, rate: 7, size: 0.16, home: 0.12 },
      recipe: { coil: 6, ember: 2 },
    },
    galebow: {
      name: 'Gale Bow',
      kind: 'bow',
      text: 'Wind arrows that pierce through every enemy in a line. Great against flyers.',
      speed: 1,
      power: 1,
      reach: 1,
      finisher: 'H4',
      color: '#6fe0cf',
      shot: { dmg: 24, speed: 44, rate: 18, size: 0.12, pierce: true },
      recipe: { feather: 8, bark: 3 },
    },
    sporemortar: {
      name: 'Spore Mortar',
      kind: 'mortar',
      text: 'Lobs puffy spore shells that burst and knock down everything nearby.',
      speed: 1,
      power: 1,
      reach: 1,
      finisher: 'H4',
      color: '#ff8a7a',
      shot: { dmg: 30, speed: 16, rate: 30, size: 0.28, splash: 2.8 },
      recipe: { spore: 10, plate: 2 },
    },
  });

  // ---- armor ----
  D.sets = {
    puff: { name: 'Spore Plush', color: '#ff8a7a', trim: '#ffffff', setBonus: { hp: 60 }, bonusText: '+60 max HP' },
    gale: {
      name: 'Gale Rider',
      color: '#6fe0cf',
      trim: '#ffffff',
      setBonus: { flight: 60, speed: 0.05 },
      bonusText: '+60 flight, faster',
    },
    spark: {
      name: 'Spark Runner',
      color: '#ffd23a',
      trim: '#ff8a2a',
      setBonus: { stam: 0.4 },
      bonusText: '+40% stamina regen',
    },
    thorn: {
      name: 'Bramble Guard',
      color: '#4f9a5a',
      trim: '#fff0d6',
      setBonus: { def: 0.1 },
      bonusText: 'Block 10% more damage',
    },
    frost: {
      name: 'Frostwarden',
      color: '#bfe8ff',
      trim: '#7cc6f2',
      setBonus: { def: 0.05, noChill: 1 },
      bonusText: 'Never chilled, +5% block',
    },
    titan: {
      name: 'Titanic Scion',
      color: '#9a7cff',
      trim: '#ffc93c',
      setBonus: { power: 0.15, def: 0.05 },
      bonusText: '+15% damage, +5% block',
    },
  };
  D.armor = {
    puff_head: { name: 'Spore Cap', slot: 'head', set: 'puff', look: 'cap', hp: 20, recipe: { spore: 5 } },
    puff_body: { name: 'Spore Vest', slot: 'body', set: 'puff', look: 'vest', hp: 30, recipe: { spore: 7 } },
    puff_arms: { name: 'Spore Puffs', slot: 'arms', set: 'puff', look: 'pads', hp: 15, recipe: { spore: 4 } },
    puff_legs: { name: 'Spore Boots', slot: 'legs', set: 'puff', look: 'boots', hp: 15, recipe: { spore: 4 } },

    gale_head: { name: 'Gale Crest', slot: 'head', set: 'gale', look: 'crest', flight: 20, recipe: { feather: 5 } },
    gale_body: {
      name: 'Gale Harness',
      slot: 'body',
      set: 'gale',
      look: 'vest',
      flight: 25,
      speed: 0.03,
      recipe: { feather: 6, coil: 1 },
    },
    gale_arms: { name: 'Gale Bracers', slot: 'arms', set: 'gale', look: 'pads', speed: 0.03, recipe: { feather: 4 } },
    gale_legs: {
      name: 'Gale Greaves',
      slot: 'legs',
      set: 'gale',
      look: 'greaves',
      speed: 0.04,
      flight: 15,
      recipe: { feather: 4, cloud: 1 },
    },

    spark_head: { name: 'Spark Visor', slot: 'head', set: 'spark', look: 'visor', stam: 0.1, recipe: { coil: 5 } },
    spark_body: {
      name: 'Spark Coilplate',
      slot: 'body',
      set: 'spark',
      look: 'plate',
      stam: 0.15,
      def: 0.03,
      recipe: { coil: 6, ember: 1 },
    },
    spark_arms: {
      name: 'Spark Gauntlets',
      slot: 'arms',
      set: 'spark',
      look: 'spikes',
      power: 0.04,
      recipe: { coil: 4 },
    },
    spark_legs: {
      name: 'Spark Striders',
      slot: 'legs',
      set: 'spark',
      look: 'boots',
      speed: 0.04,
      stam: 0.1,
      recipe: { coil: 4 },
    },

    thorn_head: {
      name: 'Bramble Helm',
      slot: 'head',
      set: 'thorn',
      look: 'horns',
      def: 0.04,
      recipe: { plate: 2, bark: 3 },
    },
    thorn_body: {
      name: 'Bramble Shell',
      slot: 'body',
      set: 'thorn',
      look: 'plate',
      def: 0.08,
      hp: 20,
      recipe: { plate: 4, bark: 4 },
    },
    thorn_arms: {
      name: 'Bramble Spikes',
      slot: 'arms',
      set: 'thorn',
      look: 'spikes',
      def: 0.03,
      power: 0.03,
      recipe: { plate: 2, bark: 2 },
    },
    thorn_legs: {
      name: 'Bramble Greaves',
      slot: 'legs',
      set: 'thorn',
      look: 'greaves',
      def: 0.04,
      recipe: { plate: 2, bark: 2 },
    },

    frost_head: {
      name: 'Frost Crown',
      slot: 'head',
      set: 'frost',
      look: 'crest',
      def: 0.03,
      hp: 10,
      recipe: { frost: 4 },
    },
    frost_body: {
      name: 'Frost Mantle',
      slot: 'body',
      set: 'frost',
      look: 'vest',
      def: 0.05,
      hp: 20,
      recipe: { frost: 6, cloud: 1 },
    },
    frost_arms: { name: 'Frost Pauldrons', slot: 'arms', set: 'frost', look: 'pads', def: 0.03, recipe: { frost: 3 } },
    frost_legs: {
      name: 'Frost Treads',
      slot: 'legs',
      set: 'frost',
      look: 'boots',
      def: 0.03,
      speed: 0.02,
      recipe: { frost: 3 },
    },

    titan_head: {
      name: 'Scion Helm',
      slot: 'head',
      set: 'titan',
      look: 'horns',
      def: 0.05,
      hp: 30,
      power: 0.04,
      recipe: { titan: 1, crown: 2, ember: 3 },
    },
    titan_body: {
      name: 'Scion Core Plate',
      slot: 'body',
      set: 'titan',
      look: 'plate',
      def: 0.08,
      hp: 50,
      recipe: { titan: 2, grumble: 1, ember: 4 },
    },
    titan_arms: {
      name: 'Scion Arms',
      slot: 'arms',
      set: 'titan',
      look: 'spikes',
      power: 0.08,
      recipe: { titan: 1, crown: 2, coil: 4 },
    },
    titan_legs: {
      name: 'Scion Thrusters',
      slot: 'legs',
      set: 'titan',
      look: 'greaves',
      speed: 0.05,
      flight: 40,
      recipe: { titan: 1, cloud: 3, feather: 4 },
    },
  };

  // ---- Twin Arms moves (used when the style is Twin Arms; see the Hangar > Loadout) ----
  Object.assign(D.moves, {
    // right arm blade (Slash button)
    RA1: {
      st: 6,
      ac: 4,
      rc: 12,
      cx: 9,
      dmg: 13,
      rng: 2.6,
      arc: 160,
      step: 6,
      pose: 'slashR',
      next: 'RA2',
      hs: 3,
      label: 'R-Arm Slash',
      input: 'Slash (Twin Arms)',
    },
    RA2: {
      st: 6,
      ac: 4,
      rc: 14,
      cx: 10,
      dmg: 14,
      rng: 2.6,
      arc: 170,
      step: 6,
      pose: 'slashL',
      next: 'RA3',
      hs: 3,
      label: 'R-Arm Return',
      input: 'Slash, Slash',
    },
    RA3: {
      st: 8,
      ac: 6,
      rc: 20,
      cx: 16,
      dmg: 24,
      rng: 3.0,
      arc: 90,
      step: 0,
      lunge: 16,
      pose: 'thrust',
      hs: 7,
      kd: true,
      label: 'R-Arm Piercer',
      input: 'Slash x3',
    },
    // left arm blade (Heavy button)
    LA1: {
      st: 7,
      ac: 4,
      rc: 12,
      cx: 10,
      dmg: 14,
      rng: 2.6,
      arc: 160,
      step: 6,
      pose: 'lslashR',
      next: 'LA2',
      hs: 3,
      left: true,
      label: 'L-Arm Slash',
      input: 'Heavy (Twin Arms)',
    },
    LA2: {
      st: 7,
      ac: 4,
      rc: 14,
      cx: 11,
      dmg: 15,
      rng: 2.6,
      arc: 170,
      step: 6,
      pose: 'lslashL',
      next: 'LA3',
      hs: 3,
      left: true,
      label: 'L-Arm Return',
      input: 'Heavy, Heavy',
    },
    LA3: {
      st: 10,
      ac: 5,
      rc: 22,
      cx: 18,
      dmg: 26,
      rng: 2.9,
      arc: 220,
      step: 3,
      pose: 'lrise',
      hs: 7,
      launch: 12,
      vr: 2.4,
      left: true,
      label: 'L-Arm Uppercut',
      input: 'Heavy x3',
    },
    // ranged arm weapons (either arm). The weapon's `shot` decides damage, speed and fire rate.
    GUN: {
      st: 2,
      ac: 2,
      rc: 8,
      cx: 5,
      dmg: 0,
      rng: 0,
      arc: 0,
      step: 0,
      pose: 'aim',
      hs: 0,
      shot: true,
      label: 'Arm Cannon',
      input: 'Hold R or L arm button',
    },
    BOW: {
      st: 9,
      ac: 2,
      rc: 14,
      cx: 13,
      dmg: 0,
      rng: 0,
      arc: 0,
      step: 0,
      pose: 'aim',
      hs: 0,
      shot: true,
      label: 'Gale Arrow',
      input: 'R or L arm button',
    },
    MORT: {
      st: 10,
      ac: 2,
      rc: 20,
      cx: 18,
      dmg: 0,
      rng: 0,
      arc: 0,
      step: 0,
      pose: 'aim',
      hs: 0,
      shot: true,
      label: 'Spore Shell',
      input: 'R or L arm button',
    },
    // Titan Edge finisher
    TE: {
      st: 10,
      ac: 18,
      rc: 24,
      cx: 26,
      dmg: 16,
      rng: 4.2,
      arc: 360,
      step: 0,
      pose: 'wheel',
      hs: 4,
      multi: 4,
      spin: [6, 28, 2],
      wave: { len: 14, dmg: 30 },
      finisher: true,
      label: 'Titanfall Cleave',
      input: 'Slash x4, Heavy (Titan Edge)',
    },
  });
  D.moveList.push(['Twin Arms style', ['RA1', 'RA2', 'RA3', 'LA1', 'LA2', 'LA3', 'GUN', 'BOW', 'MORT']]);
  D.moveList.push(['Flight', ['FLY']]);

  // ---- flight (Darren's wings) ----
  D.flight = {
    energy: 100, // flight energy before armor
    drain: 9, // per second while hovering
    climbDrain: 16, // per second while climbing
    regen: 28, // per second on the ground
    speed: 9.5, // m/s
    climb: 7,
    maxHeight: 22,
    storyLimit: true, // in story chapters, storm winds stop Darren flying to islands he hasn't unlocked yet
  };
})();
