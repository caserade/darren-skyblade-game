/*
  DARREN: SKYBLADE HUNT — CLOUD UTOPIA BIG MONSTERS (the approved cast: A, B and C)
  =================================================================================
  Plain data, like the other files in data/. ChatGPT (or you) can change every number here without touching
  the code (src/cast.js). The 3D bodies come from tools/sculpt_cast.py (assets/cast_models.js).

  Each monster roams one island of Cloud Utopia, wakes when Darren comes near (aggro), and comes back
  `respawn` seconds after it is beaten. Each has a contract (data at the bottom) and drops new parts.

    skydrake     Stormbelly / Sky Drake    Gale Spires. Takes off, circles, then swoops down onto Darren
                                           (the red ring on the ground shows where). Tail whip on the ground.
    heavyweight  Stormbelly / Heavyweight  Sparkstone Mesa. Telegraphed STOMP (1.1 s wind-up) that sends a
                                           shockwave ring (jump or fly over it), then a long recovery: hit it then!
    chomprex     Chomp Rex / Grin          Thorn Wastes. Scrapes the ground (0.8 s), CHARGES in a straight line,
                                           then BITES. Sidestep or Wing Dash through the charge.

  WEIGHT (the two Stormbellies): 7 stages (src/weight.js), the 7th is the limit. While nobody is fighting them they
  waddle to ripe snack bushes on their island and eat them: each bush is `perBush` weight. They slowly slim
  down again (`slimPerMinute`). Every stage up gives them more health and damage, a wider stomp / swoop, but
  makes them slower. Shake the bushes yourself first to keep them small!

  attacks: wind = wind-up seconds, dmg = damage to Darren, r = radius / reach (metres), rec = recovery seconds.
*/
(function () {
  const D = window.DARREN_DATA;
  const stages = (names, lbs) =>
    names.map((name, i) => ({ name, at: [0, 0.15, 0.3, 0.46, 0.62, 0.78, 0.92][i], size: i / 6, lbs: lbs[i] }));

  D.cast = {
    skydrake: {
      name: 'Stormbelly Sky Drake',
      island: 'spires',
      at: [44, 37],
      face: 3.6,
      hp: 2400,
      poise: 220,
      r: 1.25,
      h: 4.7,
      scale: 1,
      aggro: 22,
      speed: 3.4,
      flyHeight: 6.5,
      respawn: 240,
      colors: { body: '#3447b4', lid: '#24318c', eye: '#ffd23a', horn: '#e0a92a', wing: '#5cc8f0', bone: '#1d2a74', spine: '#1f2a6b', fang: '#fff6e6' },
      attacks: {
        swoop: { wind: 0.9, dmg: 34, r: 3.2 },
        tail: { wind: 0.7, dmg: 24, r: 4.4, rec: 0.9 },
        flyTime: 5, // seconds circling before the swoop
        groundTime: 7, // seconds on the ground between flights
      },
      weight: {
        start: 0.15,
        perBush: 0.17,
        slimPerMinute: 0.08,
        perStage: { hp: 0.12, damage: 0.1, speed: -0.07, radius: 0.1 },
        stages: stages(['Lean', 'Well-fed', 'Stout', 'Bulging', 'Rotund', 'Gorged', 'Colossal'], [2400, 2900, 3500, 4200, 5000, 5900, 7000]),
      },
    },
    heavyweight: {
      name: 'Stormbelly Heavyweight',
      island: 'mesa',
      at: [47, -15],
      face: -1.2,
      hp: 3200,
      poise: 400,
      r: 1.6,
      h: 3.5,
      scale: 1,
      aggro: 20,
      speed: 2.3,
      respawn: 240,
      colors: { body: '#2e6694', lid: '#1f4a72', eye: '#ffc23a', horn: '#c99a4a', wing: '#4f86b4', bone: '#1b3c5e', spine: '#1d3260', fang: '#fff3dc' },
      attacks: {
        stomp: { wind: 1.1, dmg: 38, r: 3.2, ring: 26, rec: 1.9 },
        slam: { wind: 0.6, dmg: 28, r: 2.6, rec: 1.1 }, // close-range belly slam
      },
      weight: {
        start: 0.3,
        perBush: 0.17,
        slimPerMinute: 0.06,
        perStage: { hp: 0.14, damage: 0.1, speed: -0.06, radius: 0.12 },
        stages: stages(['Heavy', 'Heavier', 'Hulking', 'Massive', 'Mountainous', 'Titanic', 'Absolute Unit'], [5200, 6100, 7100, 8200, 9400, 10700, 12000]),
      },
    },
    chomprex: {
      name: 'Chomp Rex',
      island: 'wastes',
      at: [11, -52],
      face: 0.4,
      hp: 2800,
      poise: 260,
      r: 1.3,
      h: 4.2,
      scale: 1,
      aggro: 22,
      speed: 4.2,
      respawn: 240,
      colors: { body: '#6b3560', lid: '#4a2244', eye: '#f2c84a', spine: '#2a1f2a', tooth: '#fff6e0' },
      attacks: {
        charge: { wind: 0.8, dmg: 36, speed: 15, time: 1.0, rec: 1.2 },
        bite: { wind: 0.45, dmg: 30, r: 3.4, rec: 0.8 },
      },
    },
  };

  // snack bushes the Stormbellies eat (joined to Dumpling's bushes, data/dumpling.js)
  D.dumpling.bushes.push(
    { island: 'spires', x: 38, z: 31, snack: 'skyberry', count: 3, regrow: 70 },
    { island: 'spires', x: 47, z: 40, snack: 'honeycomet', count: 2, regrow: 80 },
    { island: 'mesa', x: 50, z: -19, snack: 'thornmelon', count: 1, regrow: 80 },
  );

  // parts they drop, and what you can forge from them (data/forge.js has the format)
  Object.assign(D.parts, {
    stormscale: { name: 'Storm Scale', color: '#4f7fd8', rarity: 3, where: 'Stormbelly Sky Drake and Heavyweight' },
    drakehorn: { name: 'Gold Drake Horn', color: '#e0a92a', rarity: 4, where: 'Stormbelly Sky Drake' },
    bellyplate: { name: 'Belly Plate', color: '#c4d4e0', rarity: 3, where: 'Stormbelly Heavyweight' },
    rexhide: { name: 'Plum Rex Hide', color: '#8a3f7a', rarity: 3, where: 'Chomp Rex' },
    rexfang: { name: 'Chomp Rex Fang', color: '#fff3d6', rarity: 4, where: 'Chomp Rex' },
  });
  Object.assign(D.drops, {
    skydrake: [['stormscale', 3, 1], ['drakehorn', 1, 0.7], ['cloud', 1, 0.5]],
    heavyweight: [['stormscale', 2, 1], ['bellyplate', 2, 1], ['ember', 1, 0.5]],
    chomprex: [['rexhide', 3, 1], ['rexfang', 1, 0.7], ['plate', 1, 0.5]],
  });
  Object.assign(D.weapons, {
    chompfang: {
      name: 'Chompfang',
      kind: 'blade',
      text: 'A cleaver lined with Chomp Rex teeth. Heavy hits that smash guards.',
      speed: 0.92,
      power: 1.35,
      reach: 1.15,
      finisher: 'GC',
      color: '#f3e6c8',
      heavyHits: true,
      recipe: { rexfang: 2, rexhide: 4, plate: 2 },
    },
    stormcannon: {
      name: 'Stormbelly Cannon',
      kind: 'gun',
      text: 'An arm cannon with a storm in its belly. Heavy, homing thunder shots.',
      speed: 1,
      power: 1,
      reach: 1,
      finisher: 'H4',
      color: '#5cc8f0',
      shot: { dmg: 10, speed: 30, rate: 10, size: 0.2, home: 0.16 },
      recipe: { stormscale: 6, drakehorn: 1, coil: 4 },
    },
  });
  D.sets.storm = {
    name: 'Stormbelly',
    color: '#3b78a8',
    trim: '#e0a92a',
    setBonus: { hp: 80, def: 0.06 },
    bonusText: '+80 max HP, +6% block',
  };
  Object.assign(D.armor, {
    storm_head: { name: 'Drakehorn Crest', slot: 'head', set: 'storm', look: 'horns', hp: 25, def: 0.02, recipe: { drakehorn: 1, stormscale: 2 } },
    storm_body: { name: 'Belly Plate Mail', slot: 'body', set: 'storm', look: 'plate', hp: 45, def: 0.04, recipe: { bellyplate: 3, stormscale: 2 } },
    storm_arms: { name: 'Storm Scale Pads', slot: 'arms', set: 'storm', look: 'spikes', hp: 20, power: 0.04, recipe: { stormscale: 3 } },
    storm_legs: { name: 'Heavyweight Greaves', slot: 'legs', set: 'storm', look: 'greaves', hp: 25, def: 0.02, recipe: { bellyplate: 2, stormscale: 2 } },
  });
  D.adventure.contracts.push(
    { id: 'skydrake', name: 'Storm Over the Spires', type: 'hunt', target: 'skydrake', count: 1, danger: 4, repeat: true, reward: { stormscale: 2, drakehorn: 1 }, text: 'A Stormbelly Sky Drake nests on Gale Spires. Watch the ground for its swoop.' },
    { id: 'heavyweight', name: 'The Heavyweight Bout', type: 'hunt', target: 'heavyweight', count: 1, danger: 4, repeat: true, reward: { bellyplate: 2, stormscale: 2 }, text: 'A Stormbelly Heavyweight is eating Sparkstone Mesa bare. Jump its stomp, then hit it while it recovers.' },
    { id: 'chomprex', name: 'Grin and Bear It', type: 'hunt', target: 'chomprex', count: 1, danger: 4, repeat: true, reward: { rexfang: 1, rexhide: 2 }, text: 'Chomp Rex charges anything on Thorn Wastes. Sidestep the charge and strike its tail.' },
  );
})();
