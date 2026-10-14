# Darren: Skyblade Hunt — guide for AI helpers (ChatGPT, Claude) and for Michael

A 3D action game in the browser, in the style of Ragnarok Odyssey Ace with a Neopets look.
Darren the red Shoyru crosses floating islands with his dog fox Ruffy.
Two modes, picked on the title screen:
* **Story**: Chapter 1, "The Trail to Cloudroost Peak" (rescue Ruffy from Grumblepeak) and Chapter 2,
  "Firewood for Mom" (gather firewood in the snowy pines, beat Old Knotroot).
* **Adventure: Cloud Utopia**: an open sky world inspired by mech hunting games like Daemon X Machina: Titanic Scion.
  Fly between islands, hunt roaming enemies and mine crystals for **parts**, take **contracts**, forge **weapons
  and armor** at the Skyforge, light waystones for fast travel, and beat the Titanic Scion.

Everything Darren forges (weapons, armor) and his parts bag are shared by both modes.
A step-by-step guide for making new content with ChatGPT is in `docs/CHATGPT_GUIDE.md`.

**To play:** double-click `index.html` (Chrome or Edge). It needs internet the first time to load three.js.
**To share one file:** run `python tools/build_single.py`; the result is `dist/DarrenSkyblade.html`.

---

## Rules for any AI editing this project

1. **No build step, no modules.** Every file is a plain `<script>` loaded by `index.html` in a fixed order and
   shares one global scope. Do not add `import`/`export`, npm packages or bundlers.
2. **three.js r128** from cdnjs plus its `GLTFLoader` and post-processing files (r128 examples/js build, jsdelivr). Use the r128 API
   (`THREE.Geometry` no longer exists; use `BufferGeometry`). `T` is an alias for `THREE`.
3. **Change content in `data/game_data.js` first.** Story text, level layout, zones, enemy HP, move frame data,
   player speeds and music volume all live there. Only touch `src/` when the behaviour itself must change.
4. **Keep the load order** in `index.html`: `data/game_data.js`, `data/chapter2.js`, `data/forge.js`,
   `data/adventure.js`, assets, then `core`, `look`, `models`, `props`, `skin`, `weapons`, `forge`, `arms`, `combat`,
   `adventure`, `level`, `menu`. Later files may use anything defined in earlier ones.
   All files share one global scope, so two files must never declare the same `const` / `function` name.
5. **All walkable ground is at height 0.** Islands are flat discs; bridges and stones connect them. A gap between
   islands is open sky, so falling in sends Darren back to his last safe spot.
6. **Bone names are a contract.** The Blender rig (`blender/darren_rig3.py`) and `src/skin.js` both use:
   `root hips spine head arm_L arm_R hand_L hand_R leg_L leg_R foot_L foot_R wing_L wing_R wingtip_L wingtip_R tail_1..tail_5`.
7. Give back **whole changed files or exact find-and-replace edits**, and say which file each goes in.
8. After an edit, open `index.html` and check the browser console (F12) for red errors.

## File map

| File | What it holds |
| --- | --- |
| `index.html` | Page markup (HUD, dialogue box, menus, touch buttons) and script order |
| `data/game_data.js` | **Editable content**: meta, player tuning, moves (+ move list), skills, enemies, elites, weapons, difficulty, style rank, speakers, Chapter 1 (level, zones, story, ending), music |
| `data/chapter2.js` | Chapter 2, "Firewood for Mom": its level, zones, story and ending (pushed onto `DATA.chapters`) |
| `data/forge.js` | **Skyforge content**: parts, enemy drops, craftable weapons (blades, guns, bows, mortars), armor sets and pieces, recipes, Twin Arms moves, flight numbers |
| `data/adventure.js` | **Cloud Utopia**: islands, links, dens, resource crystals, waystones, the forge, the Titan, contracts, dialogue |
| `assets/darren_model.js` | The rigged Darren model from Blender, as base64 (`window.DARREN_MODEL_B64`) |
| `assets/music.js` | Michael's "Snowday Choir" loop, as base64 MP3 (`window.DARREN_MUSIC_B64`) |
| `src/style.css` | All styling. Colours are CSS variables at the top (`--ember`, `--gold`, ...) |
| `src/look.js` | Semi-realistic rendering: procedural textures (grass, rock, stone, bark, planks, snow), sky dome, cloud sea, soft clouds, post-processing (bloom, filmic grade, vignette), contact shadows, ambience (wind, birds, footsteps), the Graphics setting |
| `src/core.js` | Renderer, scene, camera object, input (keyboard, mouse, touch, gamepad), sound effects |
| `src/models.js` | Shared materials, placeholder toy Darren, enemies (incl. Barkling, Snowcap, Elite crown), both bosses, islands, trees, sky |
| `src/props.js` | Mom's pose code, Ruffy (model and expressions), cottage, wood store, bridges, stones, barrier, cage, pickups, decorations |
| `src/skin.js` | Loads the rigged Darren (and a second copy that becomes Mom) and drives the bones from pose numbers |
| `src/weapons.js` | Weapon models (all blades and arm weapons), equipping, unlocking, per-weapon move numbers |
| `src/forge.js` | Parts bag, part gems that drop and fly to Darren, crafting, armor stats and 3D pieces, loadout, Classic / Twin Arms style |
| `src/arms.js` | Twin Arms attacks, Darren's projectiles, boss weak-spot focus, flight |
| `src/adventure.js` | Cloud Utopia: dens, crystals, waystones, Gearwing and the Skyforge, contracts, the Titan, the map and fast travel |
| `src/combat.js` | Effects (sparks, slash arcs, hit stars, warning marks, spikes), style rank, Darren's moves and state machine (`POSE`, `ATK`), damage, enemy AI with attack turns and poise, the shared boss AI |
| `src/level.js` | Chapters (`CH`, `loadChapter`), building a level, ground checks, zones/story flow, pickups, dialogue, checkpoints, music, HUD, camera, Ruffy following, main loop |
| `src/menu.js` | Title screen (Story / Adventure, chapter picker) and the Skyforge Hangar: Loadout, Forge, Parts, Contracts, Map, Moves, Settings |
| `docs/CHATGPT_GUIDE.md` | Copy-paste prompts and a data cheat sheet for adding armor, weapons, contracts, islands |
| `blender/darren_rig3.py` | Blender script that repairs, rigs, weights and animates Darren and exports `.blend/.fbx/.glb` |
| `tools/build_single.py` | Inlines everything into one HTML file (`dist/`) |
| `tools/pack_assets.py` | Re-packs a new `darren.glb` or music file into `assets/*.js` |
| `tests/*.js` | Automated tests (need Node and Playwright; optional): `story.js` and `story2.js` play each chapter, `flow.js`, `combat2.js`, `mobile2.js` check systems |

## How the game runs

* **Chapters.** `DATA.chapters` is a list; each chapter has its own `level`, `zones`, `story`, `ending` and `saveKey`.
  `CH` is the chapter being played and `loadChapter(id)` throws the old level away and builds the new one.
* `level.js` builds islands from `CH.level.islands`, connects them with `CH.level.links`, places decorations,
  Mom's cottage, Ruffy's cage (if the chapter has `cage`) and the pickups.
* **Zones** (`CH.zones`) are the story beats, in order. Standing well inside a zone's island starts it:
  its `enter` dialogue plays, then its `enemies` spawn and Darren is fenced onto that island until they are
    beaten. Then the `clear` dialogue plays, HP is restored and its `pickup` (one) or `pickups` (a list) appear.
  Once every pickup is taken the optional `done` dialogue plays and the links it unlocks (`lockedBy: '<zone id>'`)
  open: bridges lose their thorn barrier and stones rise out of the clouds. `collect` is the HUD text while
  picking up (a count is added), `giveWeapon` hands Darren a weapon when the zone starts.
* A zone with `boss: true` spawns Grumblepeak, `boss: 'knot'` spawns Old Knotroot (`bossAt: [x, z]` places him).
  In Chapter 1 beating the boss breaks Ruffy's cage; in a zone with `finale: true` the finale runs after its
  pickups. The finale brings everyone home for the `ending` dialogue and the end card.
* **Boss phases.** At 60% and 25% health a boss roars, shoves Darren back and plays the story id
  `boss_phase2` / `boss_phase3` (Grumblepeak) or `knot_phase2` / `knot_phase3` (Knotroot), if it exists.
* **Checkpoints:** entering a zone sets its `checkpoint`; the browser remembers it (`localStorage`, key in
  `DATA.meta.saveKey`). The title screen then offers "Continue". Fainting offers "Try again from checkpoint".
* **Dialogue:** `talk(id, done)` plays `DATA.story[id]`. While talking, `G.cine` is true: enemies freeze and the
  attack buttons, Space, a click or a tap move to the next line.
* **Combat** is frame-based at 60 fps. Each move in `DATA.moves` has startup/active/recovery frames and a cancel
  frame `cx`; inputs are buffered for 10 frames. Darren's look per move comes from `POSE` in `combat.js`.
* **Combo strings.** Slash follows each move's `next`; Heavy during a string follows that move's `heavy`
  (`'FIN'` means the equipped weapon's `finisher`). In the air, Heavy after an air slash is Sky Spike, otherwise
  Meteor Dive. Wing Dash then Slash is Wing Lunge (continues the string at L2); Wing Dash then Heavy is Comet Rise.
  Move flags: `finisher` (camera punch, extra style), `wave` (ground shockwave), `spike`, `rise`, `heal`.
* **Weapons** (`DATA.weapons`) scale every non-skill move's damage (`power`), range (`reach`) and speed, and pick
  the finisher. Unlocks and the equipped weapon are remembered in the browser (`DATA.meta.unlockKey`).
* **Style rank** (`DATA.style`): hits add points (less for repeating the same move), rank D to S; higher ranks fill
  Dragon Heart faster; taking a hit drops a rank. The best rank of a zone shows when it is cleared.
* **Enemies** take turns: only `DATA.difficulty.<level>.attackers` may wind up at once, the rest circle and wait.
  `poise` decides how many light hits it takes to make an enemy flinch; heavy hits, launches and knockdowns always
  work. Elites (`['puff', 1, 'elite']`) are bigger, tougher, wear a crown and get an extra trick.
* **Settings** (difficulty, camera sensitivity, invert, music and sound volume) live in `SETTINGS` (core.js),
  saved under `DATA.meta.settingsKey`.
* **Progress that carries over** (weapons, armor, parts, loadout, style, waystones, contracts) is `UNLOCKS`
  (core.js, saved under `DATA.meta.unlockKey`).
* **Parts and crafting.** `killEnemy()` drops `DATA.drops[type]` as glowing gems (plus `elite` for Elites);
  boss weak spots drop `DATA.drops[bossType]`. Gems fly into Darren and go into `UNLOCKS.parts`. `craft(id)`
  spends a recipe and adds the weapon or armor piece to `UNLOCKS`.
* **Armor** stats are summed by `gearStats()` and applied by `applyGear()` (max HP, block, speed, stamina, flight,
  damage). Pieces are attached to the rig by `attachArmor()` at the points in `ARMOR_SOCKETS` (src/forge.js).
* **Combat styles.** Classic: the strings above with the R-arm blade. Twin Arms (`UNLOCKS.style = 'twin'`):
  Slash uses the R-arm weapon and Heavy the L-arm weapon, each with its own string (RA1-3 / LA1-3) or shots
  (GUN / BOW / MORT, numbers from the weapon's `shot`). T toggles the style in play.
* **Flight** (`DATA.flight`): V takes off, hold Jump to climb, C / LT to dive; flight energy refills on the
  ground. In story chapters, islands whose way in is still locked push Darren back ("storm winds").
* **Boss weak-spot focus.** Lock on to a boss (Q), press Q again to cycle its weak spots; shots home in on it.
* **Cloud Utopia** (`CH.mode === 'adventure'`): `advBuild()` adds waystones and the forge to the level,
  `advReset()` starts play, `advUpdate()` runs dens, crystals, waystones, the Titan and the music each frame.

## Recipes

**Change or add dialogue.** Edit the chapter's `story`. Each line is `['speaker', 'text']`; speakers are listed in
`DATA.speakers` (add one there with a `name` and `color` if needed).

**Make a fight harder or easier.** Change a zone's `enemies`, e.g. `[['puff', 8], ['gust', 3], ['bolt', 1, 'elite']]`,
or an enemy's `hp` / `poise` in `DATA.enemies`. Types: `puff`, `gust`, `bolt`, `thorn`, `bark` (Barkling),
`snow` (Snowcap). Bosses: `boss` (Grumblepeak), `knot` (Old Knotroot). Whole-game difficulty: `DATA.difficulty`.

**Add a combo branch.** Give a move a `heavy: '<move id>'` (or a `next`) and add that move to `DATA.moves`
with a `pose` from the `POSE` table, a `label` and an `input` text. Add its id to `DATA.moveList` so it shows in
the pause menu.

**Add a weapon.** Add an entry to `DATA.weapons` (name, text, speed, power, reach, finisher, color), build its
model in `buildWeapon()` in `src/weapons.js` (grip at z = 0, blade along +z, return `base` and `tip`), and give
it to the player with a pickup `{ item: 'weapon', weapon: '<id>', x, z, talk: '<story id>' }` or a zone's
`giveWeapon`.

**Tune a move.** Edit `DATA.moves.<id>`. For example, for a faster first slash lower `L1.st`, and for an earlier
combo follow-up lower `L1.cx`. Keep `cx <= st + ac + rc`.

**Add an island and a zone.**
1. Add to the chapter's `level.islands` (Chapter 1 is in `game_data.js`, Chapter 2 in `chapter2.js`): `{ id: 'lake', name: 'Mirror Lake', x: 40, z: 130, r: 12, deco: ['trees', 'flowers'] }`.
   Keep at least 5 m of sky between island edges and don't overlap other islands.
2. Connect it in the chapter's `level.links`: `{ id: 'ridge-lake', type: 'bridge', a: 'ridge', b: 'lake', w: 4, lockedBy: 'ridge' }`.
   For a stone path use `type: 'stones'` with `stones: [[x, z, 2.2], ...]` spaced about one jump apart
   (6 m centre to centre, radius 2.2).
3. Add a zone in the right place in the chapter's `zones` with `island: 'lake'`, a `checkpoint` inside the island,
   `enemies`, `objective`, and optional `enter` / `clear` dialogue ids that exist in `DATA.story`.

**Add Chapter 3.** Copy `data/chapter2.js` to `data/chapter3.js`, change `id`, `name`, `saveKey`, the islands
(keep `home` at 0, 0 if Mom's house should be there), links, zones, story and ending, and add
`<script src="data/chapter3.js"></script>` right after `chapter2.js` in `index.html`. It appears on the title
screen automatically. Chapter options: `ruffy` ('caged' or 'follow'), `cage` (island id), `snowfall`,
`woodpile`, `counter` ({ item, name }), `endingTalk`.

**Add a new enemy type.** Write a `buildX()` model in `models.js` (return `root`, `b` body group and
`shell: addShell(...)`), add an entry to `EDEF` in `combat.js`, and add its behaviour as a new `case` in
`enemyBrain()`. Ask for an attack turn with `token(e)` before winding up and hurt Darren with `hurtP(e, dmg, ...)`.
Then give it HP, poise and a name in `DATA.enemies`.

**Swap the music.** Put an MP3 somewhere and run `python tools/pack_assets.py - path/to/song.mp3`.
Volume is `DATA.music.volume`; the soft battle drums can be turned off with `battleDrums: false`.

**Update Darren's model or animations.** Open `darren game asset.blend` in Blender, open the Python Console and run
`exec(open(r"<path>\blender\darren_rig3.py").read()); run(extra_dir=r"<folder for darren.glb>", log_path=r"<folder>\rig3_log.txt")`.
It rebuilds the game mesh from the hidden source object `dragon 3d model`, re-rigs it and exports. Then run
`python tools/pack_assets.py path/to/darren.glb`.

## A prompt that works well with ChatGPT

> I'm working on my browser game "Darren: Skyblade Hunt". Here is README_FOR_AI.md and the file(s) involved:
> [paste README_FOR_AI.md] [paste data/game_data.js and/or the src file]. Please [change]. Follow the rules in the
> README: no modules, three.js r128, keep the script load order, all ground at height 0. Give me the complete
> updated file(s), or exact find-and-replace edits with the file name for each.

## Controls (for reference)

Keyboard: WASD move, mouse camera, J or click Slash / R-arm, K or right-click Heavy / L-arm (hold to charge in Classic),
Space jump (again for double jump, hold to glide), V fly (hold Space to climb, C to dive), Shift Wing Dash, Q lock-on
(again on a boss: focus a weak spot), T Classic / Twin Arms, R switch weapon, 1 Blaze Wheel, 2 Flame Breath,
F Dragon Heart, E use (Skyforge), N or Tab map, P pause / Hangar, M music.
Controller: X slash, Y heavy, A jump, B dash, D-pad up fly, LT dive, D-pad left style, D-pad right weapon, D-pad down
use, Back map, LB+X / LB+Y skills, LB+RB Dragon Heart, R3 lock-on, Start pause.
Touch: on-screen stick and buttons (Fly and Style buttons included); the Hangar is in the pause menu.

## Skyforge recipes (for ChatGPT)

**Add an armor piece or set.** In `data/forge.js` add a set to `D.sets` and pieces to `D.armor` (slot, set, look,
stats, recipe). It shows up in Hangar > Forge > Armor automatically. New looks: a new `case` in
`buildArmorPiece()` in `src/forge.js`.

**Add a craftable weapon.** Add it to `W` in `data/forge.js` with `kind`, stats, `finisher`, `recipe` and, for
guns / bows / mortars, `shot`. Optional model: a `buildX()` in `src/weapons.js` plus a line in `buildWeapon()`.

**Add a part.** Add it to `D.parts`, then make something drop it (`D.drops`, a crystal in `data/adventure.js`
`nodes`, or a contract `reward`).

**Add a contract / island / den in Cloud Utopia.** Edit `data/adventure.js` (see the notes at the top of it).

## Look and feel (semi-realistic rendering)

* Textures are generated in code by `lookTex(kind)` in `src/look.js` (no image files): `grass`, `rock`, `stone`,
  `bark`, `plank`, `snow`, `fine`. Use `lookMat(kind, tintColor, repeat, extraOptions)` for a textured material.
* Sky colours and sun direction: `SKY` in `src/look.js`. Fog and lights: `buildSky()` in `src/models.js`.
* Colour grade (exposure, saturation, warmth, vignette): `GradeShader` uniforms in `src/look.js`; bloom strength
  and threshold in `setupPost()`.
* Settings > Graphics: `high` (bloom, filmic grade, dense grass) or `low` (direct ACES render, for phones).
  The game drops to `low` by itself when the frame rate stays low.
