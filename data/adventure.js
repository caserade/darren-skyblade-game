/*
  DARREN: SKYBLADE HUNT — ADVENTURE MODE: CLOUD UTOPIA
  ====================================================
  An open sky world to explore freely (no story locks). Fly between islands, hunt roaming enemies for parts,
  mine resource crystals, light up waystones for fast travel (Map: N key / Back button / Map tab), take
  contracts at the Skyforge, craft weapons and armor, and challenge the Titanic Grumblepeak.

  Same island / link format as a chapter (see game_data.js). Extra sections:
    dens       island id -> enemies that roam that island and come back `respawn` seconds after being beaten
    nodes      resource crystals: { island, x, z, part, count, hp } (break them with any attack)
    waystones  island id -> [x, z] of its waystone (touch it to unlock fast travel there)
    forge      where the Skyforge and Gearwing the forgemaster stand
    titan      the Titanic boss: { island, at: [x, z], type } — appears while its contract is accepted
    contracts  missions. type: 'hunt' (target = enemy type, 'elite' or 'any'), 'harvest' (target = part id),
               'explore' (target = island id, or 'any' to count waystones), 'titan'.
               reward: parts given when it is completed. repeat: can be taken again.
*/
window.DARREN_DATA.adventure = {
  id: 'adv',
  mode: 'adventure',
  name: 'Adventure: Cloud Utopia',
  short: 'Cloud Utopia',
  tagline:
    'An open sky of floating islands. Hunt for parts, forge new weapons and armor, fly where bridges cannot reach, and face the Titanic Scion.',
  saveKey: 'darrenSkyblade.adv',
  ruffy: 'follow',
  level: {
    start: { x: 3, z: 6, face: 0 },
    islands: [
      { id: 'haven', name: 'Skyforge Haven', x: 0, z: 0, r: 16, deco: ['flowers', 'ruins'] },
      { id: 'fields', name: 'Puffcap Fields', x: 0, z: 46, r: 14, deco: ['trees', 'flowers', 'mushrooms'] },
      { id: 'spires', name: 'Gale Spires', x: 42, z: 34, r: 12, deco: ['rocks', 'crystals'] },
      { id: 'mesa', name: 'Sparkstone Mesa', x: 46, z: -14, r: 13, deco: ['rocks', 'crystals', 'flowers'] },
      { id: 'wastes', name: 'Thorn Wastes', x: 12, z: -50, r: 14, deco: ['ruins', 'rocks'] },
      { id: 'frost', name: 'Frost Hollow', x: -40, z: -30, r: 13, deco: ['pines', 'snow', 'crystals'] },
      { id: 'barkwood', name: 'Barkwood', x: -48.17, z: 16.76, r: 13, deco: ['pines', 'logs', 'mushrooms'] },
      { id: 'skyreach', name: 'Skyreach Isle', x: -18, z: 92, r: 9, deco: ['crystals', 'flowers'] },
      { id: 'titan', name: "Titan's Rest", x: 70, z: 84, r: 22, deco: ['rocks', 'ruins', 'crystals'] },
    ],
    links: [
      { id: 'haven-fields', type: 'bridge', a: 'haven', b: 'fields', w: 4.2 },
      { id: 'haven-mesa', type: 'bridge', a: 'haven', b: 'mesa', w: 4.2 },
      { id: 'haven-frost', type: 'bridge', a: 'haven', b: 'frost', w: 4.2 },
      {
        id: 'haven-barkwood',
        type: 'stones',
        a: 'haven',
        b: 'barkwood',
        stones: [
          [-19.36, 6.74, 2.2],
          [-25.5, 8.87, 2.2],
          [-31.64, 11.01, 2.2],
        ],
      },
      { id: 'fields-spires', type: 'bridge', a: 'fields', b: 'spires', w: 4 },
      { id: 'mesa-wastes', type: 'bridge', a: 'mesa', b: 'wastes', w: 4 },
      { id: 'spires-titan', type: 'bridge', a: 'spires', b: 'titan', w: 4.6 },
      {
        id: 'frost-wastes',
        type: 'stones',
        a: 'frost',
        b: 'wastes',
        stones: [
          [-23.67, -36.28, 2.2],
          [-17.6, -38.62, 2.2],
          [-11.53, -40.95, 2.2],
          [-5.47, -43.28, 2.2],
        ],
      },
      {
        id: 'mesa-spires',
        type: 'stones',
        a: 'mesa',
        b: 'spires',
        stones: [
          [44.55, 3.44, 2.2],
          [44.01, 9.92, 2.2],
          [43.47, 16.39, 2.2],
        ],
      },
      // Skyreach Isle has no bridge: fly there (V / D-pad up / Fly button)
    ],
    pawPrints: false,
  },
  zones: [
    {
      id: 'haven',
      island: 'haven',
      enter: 'adv_intro',
      enemies: [],
      checkpoint: [3, 6],
      objective: 'Talk to Gearwing at the Skyforge (E), take a contract, then explore',
    },
  ],
  forge: { x: -6, z: -5, face: 0.9 },
  waystones: {
    haven: [5, -4],
    fields: [-6, 50],
    spires: [45, 39],
    mesa: [50, -18],
    wastes: [16, -55],
    frost: [-44, -34],
    barkwood: [-52, 21],
    skyreach: [-18, 95],
    titan: [62, 70],
  },
  dens: {
    fields: {
      enemies: [
        ['puff', 5],
        ['gust', 1],
      ],
      respawn: 45,
    },
    spires: {
      enemies: [
        ['gust', 4],
        ['gust', 1, 'elite'],
      ],
      respawn: 60,
    },
    mesa: {
      enemies: [
        ['bolt', 3],
        ['puff', 2],
      ],
      respawn: 50,
    },
    wastes: {
      enemies: [
        ['thorn', 1],
        ['puff', 3],
        ['bolt', 1, 'elite'],
      ],
      respawn: 70,
    },
    frost: {
      enemies: [
        ['snow', 3],
        ['bark', 2],
      ],
      respawn: 55,
    },
    barkwood: {
      enemies: [
        ['bark', 4],
        ['bark', 1, 'elite'],
      ],
      respawn: 60,
    },
    skyreach: { enemies: [['gust', 2, 'elite']], respawn: 90 },
  },
  nodes: [
    { island: 'mesa', x: 52, z: -8, part: 'ember', count: 2, hp: 60 },
    { island: 'mesa', x: 40, z: -20, part: 'ember', count: 2, hp: 60 },
    { island: 'wastes', x: 6, z: -44, part: 'ember', count: 2, hp: 60 },
    { island: 'spires', x: 36, z: 30, part: 'cloud', count: 1, hp: 70 },
    { island: 'frost', x: -46, z: -24, part: 'frost', count: 2, hp: 60 },
    { island: 'frost', x: -34, z: -36, part: 'frost', count: 2, hp: 60 },
    { island: 'skyreach', x: -22, z: 88, part: 'cloud', count: 3, hp: 80 },
    { island: 'skyreach', x: -13, z: 90, part: 'cloud', count: 3, hp: 80 },
    { island: 'titan', x: 82, z: 92, part: 'ember', count: 3, hp: 80 },
  ],
  nodeRespawn: 90,
  titan: { island: 'titan', at: [72, 90], type: 'titan' },
  contracts: [
    {
      id: 'c_spores',
      name: 'Spore Sweep',
      type: 'hunt',
      target: 'puff',
      count: 8,
      danger: 1,
      repeat: true,
      reward: { spore: 4, ember: 1 },
      text: 'The Puffcaps in Puffcap Fields are trampling the flowers again.',
    },
    {
      id: 'c_feathers',
      name: 'Feather Harvest',
      type: 'harvest',
      target: 'feather',
      count: 6,
      danger: 1,
      repeat: true,
      reward: { coil: 2, cloud: 1 },
      text: 'Gearwing needs Gale Feathers for wing harnesses. Gustlings in Gale Spires have plenty.',
    },
    {
      id: 'c_sparks',
      name: 'Spark Patrol',
      type: 'hunt',
      target: 'bolt',
      count: 5,
      danger: 2,
      repeat: true,
      reward: { coil: 4 },
      text: 'Boltails on Sparkstone Mesa keep zapping the bridge ropes.',
    },
    {
      id: 'c_explore',
      name: 'Light the Waystones',
      type: 'explore',
      target: 'any',
      count: 5,
      danger: 1,
      reward: { cloud: 3, ember: 2 },
      text: 'Find and touch five waystones so you can fast travel from the Map.',
    },
    {
      id: 'c_thorn',
      name: 'Thorn Breaker',
      type: 'hunt',
      target: 'thorn',
      count: 2,
      danger: 3,
      repeat: true,
      reward: { plate: 4, bark: 2 },
      text: 'Thornbacks guard the Thorn Wastes. Get behind them, or burn their shells.',
    },
    {
      id: 'c_frost',
      name: 'Frost Run',
      type: 'harvest',
      target: 'frost',
      count: 6,
      danger: 2,
      repeat: true,
      reward: { frost: 3, crown: 1 },
      text: 'Bring back Frost Shards from Frost Hollow. Mind the snowballs.',
    },
    {
      id: 'c_bark',
      name: 'Barkwood Cleanup',
      type: 'hunt',
      target: 'bark',
      count: 6,
      danger: 2,
      repeat: true,
      reward: { bark: 4, spore: 2 },
      text: 'Barklings are digging tunnels all over Barkwood.',
    },
    {
      id: 'c_elite',
      name: 'Crown Hunter',
      type: 'hunt',
      target: 'elite',
      count: 3,
      danger: 3,
      repeat: true,
      reward: { crown: 3 },
      text: 'Defeat three Elite enemies anywhere in Cloud Utopia.',
    },
    {
      id: 'c_skyreach',
      name: 'Wings over Skyreach',
      type: 'explore',
      target: 'skyreach',
      count: 1,
      danger: 2,
      reward: { cloud: 4, crown: 1 },
      text: 'No bridge reaches Skyreach Isle. Fly there and light its waystone.',
    },
    {
      id: 'c_titan',
      name: 'Titanic Scion',
      type: 'titan',
      target: 'titan',
      count: 1,
      danger: 5,
      repeat: true,
      reward: { titan: 3, grumble: 2 },
      text: "A Titanic Grumblepeak has woken on Titan's Rest. Break its crystals and bring back its Titan Core.",
    },
  ],
  story: {
    adv_intro: [
      ['narrator', 'Cloud Utopia. A sky full of islands, far beyond Cloudroost Bluff.'],
      ['gear', 'Ho there, little flame! Name is Gearwing. I run the Skyforge here in the Haven.'],
      [
        'gear',
        'Bring me parts from the critters out there and I will forge you weapons and armor. Real Skyforge gear!',
      ],
      ['darren', 'Can you make me something for my left hand too?'],
      [
        'gear',
        'Ha! Switch to Twin Arms style in the Hangar and you can carry a weapon in each arm. R-arm on Slash, L-arm on Heavy.',
      ],
      ['gear', 'And stretch those wings. Press V to fly. Some islands have no bridges at all.'],
      [
        'narrator',
        'Open the Hangar with P (or E at the forge) to take contracts, craft, and change your loadout. The Map (N) shows waystones you can travel to.',
      ],
    ],
    forge_hello: [['gear', 'Back again? Let us see what you brought me.']],
    contract_done: [['gear', 'Contract complete! Your reward is in the parts bag.']],
    titan_intro: [
      ['narrator', "The ground of Titan's Rest splits open. Something enormous rises, crusted with violet crystals."],
      ['titan', 'GRRROOOOOM... I AM... TITANIC...'],
      ['darren', "That's Grumblepeak's... great-great-grandpa?!"],
      [
        'narrator',
        'The Titanic Scion. Break its crystals for Titan Cores. Lock on (Q) and press Q again to focus a part.',
      ],
    ],
    titan_phase2: [
      ['titan', 'SMALL... FLAME... STINGS...'],
      ['narrator', 'It is stomping. Jump or fly over the shockwaves.'],
    ],
    titan_phase3: [
      ['titan', 'MY... CORE...'],
      ['darren', 'The crystal on its back! Hit it now!'],
    ],
    titan_down: [
      ['narrator', 'The Titanic Scion crumbles into a glittering pile. Titan Cores roll out of the rubble.'],
    ],
  },
  ending: { title: 'Cloud Utopia', text: 'Keep exploring.', next: '' },
};
window.DARREN_DATA.speakers.gear = { name: 'Gearwing', color: '#8fd8ff' };
window.DARREN_DATA.speakers.titan = { name: 'Titanic Scion', color: '#b49aff' };
window.DARREN_DATA.enemies.titan = { name: 'Titanic Grumblepeak', hp: 9000 };
window.DARREN_DATA.enemies.node = { name: 'Resource Crystal', hp: 60, poise: 999 };
