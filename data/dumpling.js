/*
  DARREN: SKYBLADE HUNT — DUMPLING, THE CHUBBY CLOUD DRAKE (Cloud Utopia companion)
  =================================================================================
  Plain data, like the other files in data/. ChatGPT (or you) can add snacks, bake recipes, snack bushes,
  dialogue and change every number here without touching the code (src/dumpling.js).

  Dumpling lives at the bakery in Skyforge Haven. After Darren meets him he follows Darren around Cloud Utopia.
  Feed him snacks (E next to him, or Hangar > Dumpling) and he gets rounder, one of 7 weight stages at a time
  (the 7th stage is the limit):
    full    how stuffed his belly is right now (0..1). Snacks fill it, it slowly digests.
    weight  how heavy he is (0..1). Digesting a full belly adds `weight.gainPerFull`. Walking and flying
            with Darren burns it off again (`weight.burnPerMetre`), unless "Hold his weight" is on.
  His weight changes how he plays:
    Belly Bounce (G key / Belly button / L3): he hops onto the enemies and belly-flops. Heavier = bigger hit,
            wider shockwave, knock-downs, but a longer wait between bounces. Lighter = quick, frequent hops
            that launch enemies into the air.
    Trampoline: land on Dumpling from above and he bounces Darren high. Heavier = higher.
    Flight: light Dumpling buzzes his tiny wings; from `weight.floatStage` he puffs up like a balloon and floats.
  His belly wobbles when he walks, lands, eats, laughs, or when Darren pokes him with a sword (it tickles).

  SNACKS   { name, color (fruit colour), full (belly fill), gain (extra weight straight away), where, text,
             spicy: seconds of Ember Belly (fire bounce), shape: 'berry' | 'bun' | 'melon' | 'pepper' |
             'cake' | 'puff' | 'comet' }
  BAKE     recipes that turn Skyforge parts into snacks at Dumpling's oven: { snack, makes, recipe: {part: n} }
  BUSHES   snack bushes on islands: { island, x, z, snack, count, regrow (seconds) }
           Walk into a ripe bush (or hit it) to shake the snacks out.
  DROPS    snacks enemies can drop in Cloud Utopia: enemy type -> [[snackId, count, chance], ...]
*/
window.DARREN_DATA.dumpling = {
  name: 'Dumpling',
  title: 'Cloud Drake Baker',
  bakery: { x: 8.5, z: -7.5, face: -0.7 }, // his oven in Skyforge Haven (he waits beside it before you meet)
  scale: 1.12,
  meetRange: 7,
  weight: {
    start: 0.35, // his weight the first time you meet him
    gainPerFull: 0.14, // weight gained for each full belly he digests
    digestSeconds: 70, // how long a completely full belly takes to digest
    burnPerMetre: 0.00016, // weight burned for each metre he walks or flies beside Darren
    floatStage: 5, // from this stage (0 = first) he floats like a balloon instead of flapping
    // 7 weight stages, the last one is his limit: he never grows past it (see src/weight.js).
    // at: weight points needed (0..1)   size: how round his body is drawn (0..1)   lbs: shown in the Hangar
    stages: [
      { name: 'Trim', at: 0, size: 0, lbs: 240 },
      { name: 'Chubby', at: 0.15, size: 0.16, lbs: 320 },
      { name: 'Plump', at: 0.3, size: 0.32, lbs: 420 },
      { name: 'Round', at: 0.46, size: 0.48, lbs: 540 },
      { name: 'Rotund', at: 0.62, size: 0.64, lbs: 680 },
      { name: 'Hefty', at: 0.78, size: 0.8, lbs: 850 },
      { name: 'Wobbly Wonder', at: 0.92, size: 1, lbs: 1050 },
    ],
    stuffedLimit: 0.5, // how much a full belly can add on top of his stage (less at the bigger stages)
  },
  bounce: {
    dmgLight: 26, // damage at the first stage
    dmgHeavy: 95, // damage at the last stage
    radiusLight: 2.4, // shockwave radius at weight 0 (metres)
    radiusHeavy: 5.6,
    waitLight: 6, // seconds between bounces at weight 0
    waitHeavy: 15,
    knockdownAt: 0.42, // at or above this weight the flop knocks enemies down; below it, it launches them up
    stuffedBonus: 0.25, // extra damage when his belly is completely full
    bossShare: 0.4, // fraction of the damage bosses take (it can chip a boss but never finish it)
  },
  trampoline: { light: 1.3, heavy: 2.25 }, // bounce height, times Darren's jump
  speed: { light: 7.8, heavy: 4.6 }, // walking speed (m/s); flying is a little faster

  snacks: {
    skyberry: { name: 'Sky Berry', color: '#5f8cff', shape: 'berry', full: 0.1, gain: 0, where: 'Snack bushes in Puffcap Fields, Puffcaps', text: 'Tart and juicy. His favourite little bite.' },
    puffpie: { name: 'Puffcap Pie', color: '#ff8a7a', shape: 'bun', full: 0.22, gain: 0.01, where: 'Bake at Dumpling (Puffcap Spores)', text: 'Flaky crust, pink mushroom filling.' },
    cloudbun: { name: 'Cloud Bun', color: '#fff4e2', shape: 'bun', full: 0.18, gain: 0.005, where: 'Gustlings, bake from Cloudsilk', text: 'Light as air. Somehow still very filling.' },
    honeycomet: { name: 'Honey Comet', color: '#ffc23a', shape: 'comet', full: 0.14, gain: 0.02, where: 'Boltails, snack bushes on Sparkstone Mesa', text: 'Crackles with sweet static.' },
    frostcream: { name: 'Frostcream Puff', color: '#c8ecff', shape: 'puff', full: 0.16, gain: 0.01, where: 'Snowcaps, snack bushes in Frost Hollow', text: 'Brain freeze. Worth it.' },
    thornmelon: { name: 'Thornmelon', color: '#7fcf5a', shape: 'melon', full: 0.38, gain: 0.015, where: 'Snack bushes in Thorn Wastes, Thornbacks', text: 'Spiky outside, a whole bellyful inside.' },
    emberpepper: { name: 'Ember Pepper', color: '#ff4a2a', shape: 'pepper', full: 0.06, gain: 0, spicy: 60, where: 'Snack bushes on Sparkstone Mesa', text: 'SPICY. His next Belly Bounces burst into flame for a minute.' },
    barkroll: { name: 'Barkwood Honeyroll', color: '#c98a4a', shape: 'bun', full: 0.24, gain: 0.012, where: 'Barklings, bake from Hard Bark', text: 'Cinnamon swirl, sticky honey glaze.' },
    feastcake: { name: 'Titan Feast Cake', color: '#b49aff', shape: 'cake', full: 0.9, gain: 0.12, where: 'Bake from a Titan Core', text: 'Seven layers. He has been dreaming about this one.' },
  },
  bake: [
    { snack: 'puffpie', makes: 1, recipe: { spore: 3 } },
    { snack: 'cloudbun', makes: 2, recipe: { cloud: 1 } },
    { snack: 'barkroll', makes: 1, recipe: { bark: 2, coil: 1 } },
    { snack: 'frostcream', makes: 2, recipe: { frost: 1, feather: 1 } },
    { snack: 'emberpepper', makes: 2, recipe: { ember: 1 } },
    { snack: 'feastcake', makes: 1, recipe: { titan: 1, spore: 2, cloud: 1 } },
  ],
  bushes: [
    { island: 'haven', x: 11.5, z: -3.5, snack: 'skyberry', count: 2, regrow: 45 },
    { island: 'fields', x: -6, z: 50, snack: 'skyberry', count: 3, regrow: 40 },
    { island: 'fields', x: 6.5, z: 41, snack: 'skyberry', count: 3, regrow: 40 },
    { island: 'mesa', x: 51, z: -10, snack: 'emberpepper', count: 2, regrow: 70 },
    { island: 'mesa', x: 41, z: -19, snack: 'honeycomet', count: 2, regrow: 60 },
    { island: 'frost', x: -44, z: -25, snack: 'frostcream', count: 2, regrow: 60 },
    { island: 'wastes', x: 17, z: -46, snack: 'thornmelon', count: 1, regrow: 80 },
    { island: 'barkwood', x: -52, z: 12, snack: 'skyberry', count: 3, regrow: 40 },
    { island: 'skyreach', x: -16, z: 95, snack: 'honeycomet', count: 4, regrow: 90 },
  ],
  drops: {
    puff: [['skyberry', 1, 0.3]],
    gust: [['cloudbun', 1, 0.25]],
    bolt: [['honeycomet', 1, 0.25]],
    snow: [['frostcream', 1, 0.3]],
    thorn: [['thornmelon', 1, 0.35]],
    bark: [['barkroll', 1, 0.25]],
  },
  start: { skyberry: 3, cloudbun: 1 }, // snacks Darren has the first time he meets Dumpling

  // what Dumpling says (speaker 'dumpling'). Lines picked at random when he eats or is poked.
  story: {
    dump_intro: [
      ['dumpling', 'Oh! A visitor! Mind the flour. I am Dumpling, the Haven baker. Well. Mostly the Haven taster.'],
      ['darren', 'You are... very round.'],
      ['dumpling', 'Thank you! I worked hard on it. Cloud drakes store sunshine in their bellies, you know.'],
      ['dumpling', 'Take me along? Feed me snacks and I will belly-bounce anything that bothers you. Press G!'],
      ['dumpling', 'And if you jump on me, I make an excellent trampoline. The rounder I am, the higher you go.'],
      ['narrator', 'Dumpling joins you. Feed him with E beside him, or in the Hangar under Dumpling.'],
    ],
  },
  say: {
    eat: ['Nom!', 'Mmmf!', 'So good!', 'More please!', 'Delicious!', '*happy chewing*'],
    full: ['Too full... maybe later', 'Oof. No room!', 'I need a little walk first'],
    poke: ['Hee hee!', 'That tickles!', 'Hey! Hee!', 'Boing!', '*wobble*'],
    bounce: ['BELLY BOUNCE!', 'Here I come!', 'Incoming!'],
    heavy: ['Phew... carrying a lot of sunshine', 'I am a big boy now!'],
  },
};
window.DARREN_DATA.speakers.dumpling = { name: 'Dumpling', color: '#7fe0c0' };
// his conversations play in Cloud Utopia
Object.assign(window.DARREN_DATA.adventure.story, window.DARREN_DATA.dumpling.story);
