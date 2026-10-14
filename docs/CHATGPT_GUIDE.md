# Making new content for Darren: Skyblade Hunt with ChatGPT

This game is built so that most new content is **data**, not code. ChatGPT can write new weapons, armor,
parts, recipes, enemies' drops, contracts, islands, story chapters and dialogue by editing the `data/` files.
Paste this guide plus `README_FOR_AI.md` and the data file you want changed, then ask for the change.

## The golden rules (tell ChatGPT these)

1. Plain browser JavaScript, three.js r128, no modules, no npm, no build step.
2. Content lives in `data/*.js`. Only touch `src/*.js` when a new *behaviour* is needed.
3. Keep the script order in `index.html`. Every file shares one global scope: never declare the same
   `const` / `function` name twice.
4. All walkable ground is at height 0. Islands are flat discs at `x, z` with radius `r`.
5. Return whole changed files, or exact find-and-replace edits with the file name.

## Copy-paste prompts

**New armor set**

> Here are README_FOR_AI.md, docs/CHATGPT_GUIDE.md and data/forge.js from my game Darren: Skyblade Hunt.
> Add a new armor set called "Ember Knight" (red and gold): add a `sets.ember` entry with a set bonus of
> +12% damage, and four pieces `ember_head`, `ember_body`, `ember_arms`, `ember_legs` in `armor`. Use looks from
> the list at the top of the file. Recipes should use Ember Crystals, Spark Coils and one Grumble Core for the body.
> Give me the complete updated data/forge.js.

**New weapon**

> ...add a gun called "Thunder Coil Cannon" to `weapons` in data/forge.js: kind 'gun', yellow, slower than the
> Ember Blaster but stronger (dmg 11, rate 11, speed 30, home 0.15), recipe 10 Spark Coils and 2 Elite Crown Shards.
> If it needs its own 3D model, also give me the new `buildX()` function and the line to add in `buildWeapon()`
> in src/weapons.js.

**New contract**

> ...add a contract to `contracts` in data/adventure.js: "Snowball Fight", hunt 10 Snowcaps (`snow`), danger 2,
> repeatable, reward 4 Frost Shards and 1 Cloudsilk.

**New island in Cloud Utopia**

> ...add an island "Crystal Lagoon" to Cloud Utopia at x -70, z 70, radius 12, with crystals and flowers, a
> waystone, a den of 3 Elite Gustlings, two Cloudsilk crystals, and no bridge (the player flies there).
> Keep at least 8 m of sky between it and every other island.

**New story chapter** — see "Add Chapter 3" in README_FOR_AI.md.

## Data cheat sheet

### Parts (`data/forge.js`, `D.parts`)
`id: { name, color: '#rrggbb', rarity: 1-5, where: 'text shown in the Parts bag' }`

### Drops (`D.drops`)
`enemyType: [[partId, count, chance], ...]` — `elite` is extra for Elites; `boss`, `knot`, `titan` drop when a
weak spot breaks and twice when the boss falls. Enemy types: `puff gust bolt thorn bark snow`.

### Weapons (`D.weapons` / `W`)
```
id: {
  name, text, color,
  kind: 'blade' | 'gun' | 'bow' | 'mortar',
  speed, power, reach,          // 1 = Emberfang
  finisher: 'H4' | 'GC' | 'WB' | 'SS' | 'TE',   // a move id from DATA.moves (Classic: Slash x4, Heavy)
  shot: { dmg, speed, rate, size, home?, pierce?, splash? },   // guns, bows and mortars
  chill?: true, heavyHits?: true, bounce?: true,
  recipe: { partId: count }
}
```
Models: blades without their own model look like Emberfang. To give one a look, add a `buildX()` in
`src/weapons.js` (grip at z = 0, blade along +z, return `{ g, base, tip, bladeMat }`) and a line in `buildWeapon()`.

### Armor (`D.armor`, `D.sets`)
```
id: { name, slot: 'head'|'body'|'arms'|'legs', set: setId, look, hp?, def?, speed?, stam?, flight?, power?, recipe }
setId: { name, color, trim, setBonus: { same stat names, noChill? }, bonusText }
```
Looks: head `cap crest visor horns` · body `plate vest` · arms `pads spikes` · legs `greaves boots`.
New looks need a new `case` in `buildArmorPiece()` in `src/forge.js`.

### Moves (`DATA.moves`)
Frame data at 60 fps: `st` startup, `ac` active, `rc` recovery, `cx` cancel frame, `dmg`, `rng`, `arc`, `pose`
(from `POSE` in src/combat.js: slashR slashL spin slam rise thrust wheel breath nova sweep spike lslashR lslashL
lrise aim aimL), `next` (Slash follow-up), `heavy` (Heavy branch), flags `kd launch finisher wave spike rise heal multi`.

### Contracts (`data/adventure.js`)
`{ id, name, type: 'hunt'|'harvest'|'explore'|'titan', target, count, danger 1-5, repeat?, reward: { partId: n }, text }`

## What lives where

| Want to change | File |
| --- | --- |
| Story text, chapter islands, fights | `data/game_data.js` (Chapter 1), `data/chapter2.js` |
| Parts, drops, weapons, armor, recipes, flight numbers | `data/forge.js` |
| Cloud Utopia islands, dens, crystals, waystones, contracts | `data/adventure.js` |
| Weapon 3D models | `src/weapons.js` |
| Armor 3D shapes, crafting, loadout | `src/forge.js` |
| Twin Arms, shots, flight, boss part focus | `src/arms.js` |
| Cloud Utopia behaviour, map | `src/adventure.js` |
| Hangar menu screens | `src/menu.js`, styles in `src/style.css` |
