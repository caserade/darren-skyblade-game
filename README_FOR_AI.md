# Darren: Skyblade Hunt — guide for AI helpers (ChatGPT, Claude) and for Michael

A 3D action game in the browser, in the style of Ragnarok Odyssey Ace with a Neopets look.
Darren the red Shoyru crosses floating islands with his dog fox Ruffy.
Two modes, picked on the title screen:
* **Story**: Chapter 1, "The Trail to Cloudroost Peak" (rescue Ruffy from Grumblepeak), Chapter 2,
  "Firewood for Mom" (gather firewood in the snowy pines, beat Old Knotroot) and Chapter 3, "Stormglass Reach"
  (relight three sky beacons with updraft rings, Stormlings, Wardlings, a young Stormbelly and Chomp Rex, and the
  Tempest Warden).
* **Adventure: Cloud Utopia**: an open sky world inspired by mech hunting games like Daemon X Machina: Titanic Scion.
  Fly between islands, hunt roaming enemies and mine crystals for **parts**, take **contracts**, forge **weapons
  and armor** at the Skyforge, light waystones for fast travel, and beat the Titanic Scion.

Everything Darren forges (weapons, armor) and his parts bag are shared by both modes.
A step-by-step guide for making new content with ChatGPT is in `docs/CHATGPT_GUIDE.md`.

**To play on a PC:** double-click `Play Darren.cmd` (needs Node.js LTS; it serves this folder on
`http://127.0.0.1:4319/` and opens the browser; `Stop Darren.cmd` stops it). Or open `dist/DarrenSkyblade.html`.
three.js, its add-ons and the fonts are bundled (`vendor/`, `assets/fonts/`), so no internet is needed.
**To share one file:** run `python tools/build_single.py`; the result is `dist/DarrenSkyblade.html`.
**This is the main version.** On 15 October a "Merged PC" copy combined this game with a hosted Sites version;
its new content (Chapter 3, the field guide, input and save hardening, memory release, bundled libraries, the
launcher) is folded in here (1.5.0). Where the two disagreed, this version's look and ids were kept.

---

## Rules for any AI editing this project

1. **No build step, no modules.** Every file is a plain `<script>` loaded by `index.html` in a fixed order and
   shares one global scope. Do not add `import`/`export`, npm packages or bundlers.
2. **three.js r128** (bundled in `vendor/`: `three.min.js`, `GLTFLoader` and the post-processing files from the r128
   examples/js build; the claude.ai build swaps them for cdnjs/jsdelivr). Use the r128 API
   (`THREE.Geometry` no longer exists; use `BufferGeometry`). `T` is an alias for `THREE`.
3. **Change content in `data/game_data.js` first.** Story text, level layout, zones, enemy HP, move frame data,
   player speeds and music volume all live there. Only touch `src/` when the behaviour itself must change.
4. **Keep the load order** in `index.html`: `vendor/*`, `data/game_data.js`, `data/chapter2.js`, `data/forge.js`,
   `data/adventure.js`, `data/stormglass.js`, `data/dumpling.js`, `data/cast.js`, assets, then `core`, `look`,
   `models`, `props`, `skin`, `weapons`, `forge`, `arms`, `combat`, `adventure`, `stormglass-art`, `stormglass-world`,
   `stormglass`, `polish`, `weight`, `dumpling`, `cast`, `stormglass-cast`, `level`, `menu`, `fieldguide`.
   Later files may use anything defined in earlier ones.
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
| `data/stormglass.js` | **Chapter 3, Stormglass Reach**: islands, bridges, updrafts, zones, story, Stormling / Wardling / Tempest Warden numbers and drops, the Stormsaber recipe |
| `data/cast.js` | **Big monsters**: Sky Drake, Heavyweight, Chomp Rex: islands, health, poise, speed, attack timings and damage, weight stages, colours; their parts, drops, armor set, weapons, contracts and snack bushes |
| `data/dumpling.js` | **Dumpling the cloud drake**: weight and belly numbers, Belly Bounce and trampoline numbers, snacks, bake recipes, snack bushes, snack drops, dialogue |
| `assets/darren_model.js` | The rigged Darren model from Blender, as base64 (`window.DARREN_MODEL_B64`) |
| `assets/dumpling_model.js` | Dumpling's sculpted, skinned body mesh (made by `tools/sculpt_dumpling.py`; do not edit by hand) |
| `assets/cast_models.js` | The three monsters' sculpted, skinned bodies (made by `tools/sculpt_cast.py`) |
| `assets/dumpling_art.js` | Dumpling's Hangar portraits (small images, made by `tools/make_dumpling_art.py`) |
| `assets/music.js` | Michael's "Snowday Choir" loop, as base64 MP3 (`window.DARREN_MUSIC_B64`) |
| `src/style.css` | All styling. Colours are CSS variables at the top (`--ember`, `--gold`, ...) |
| `src/look.js` | Semi-realistic rendering: the low height fog between the islands (`LOWFOG`), procedural textures (grass, rock, stone, bark, planks, snow), sky dome, cloud sea, soft clouds, post-processing (bloom, filmic grade, vignette), contact shadows, ambience (wind, birds, footsteps), the Graphics setting |
| `src/core.js` | Renderer, scene, camera object, input (keyboard, mouse, touch, gamepad), sound effects |
| `src/models.js` | Shared materials, placeholder toy Darren, enemies (incl. Barkling, Snowcap, Elite crown), both bosses, islands, trees, sky |
| `src/props.js` | Mom's pose code, Ruffy (model and expressions), cottage, wood store, bridges, stones, barrier, cage, pickups, decorations |
| `src/skin.js` | Loads the rigged Darren (and a second copy that becomes Mom) and drives the bones from pose numbers |
| `src/weapons.js` | Weapon models (all blades and arm weapons), equipping, unlocking, per-weapon move numbers |
| `src/forge.js` | Parts bag, part gems that drop and fly to Darren, crafting, armor stats and 3D pieces, loadout, Classic / Twin Arms style |
| `src/arms.js` | Twin Arms attacks, Darren's projectiles, boss weak-spot focus, flight |
| `src/weight.js` | The 7 weight stages shared by Dumpling and the Stormbellies (`stageInfo`) |
| `src/cast.js` | Big monsters: model building (eyes, lids, horns, spines, skinned wing membranes, teeth), the pose functions for every animation clip (`castPose`, `CAST_CLIPS`), their AI, belly jiggle, eating bushes, spawning on their islands |
| `src/stormglass-art.js` | Chapter 3 enemy models: Stormling, Wardling, the Tempest Warden (crystals, cracks, moss, glowing cores) and their animation |
| `src/stormglass-world.js` | Chapter 3 scenery: stone floors, arches, banners, beacons, updraft rings |
| `src/stormglass.js` | Chapter 3 rules: updrafts refill flight, the Stormling's three-shot fan, the Warden's lightning circles, sky and fog |
| `src/stormglass-cast.js` | Chapter 3's young Stormbelly (`youngbelly`) and young Chomp Rex (`youngrex`): the sculpted Cloud Utopia models at a smaller scale, amber warnings, one telegraphed attack each |
| `src/polish.js` | Weathered stone, moss and gold textures for chapter 3 (cliffs, floor, lighting, mist), `applyGraphics()` for the three-way Graphics setting, `releaseLevelGeometry()` |
| `src/fieldguide.js` | The Hangar's Field guide tab (Stormglass concept sheet and notes on every new creature) |
| `src/dumpling.js` | Dumpling: builds his model (eyes, horns, fins, wings, cloud tufts, scarf), the belly / weight shader and jiggle spring, following and flying, feeding and digestion, Belly Bounce, trampoline, snack pickups and bushes, his oven, the HUD chip |
| `src/adventure.js` | Cloud Utopia: dens, crystals, waystones, Gearwing and the Skyforge, contracts, the Titan, the map and fast travel |
| `src/combat.js` | Effects (sparks, slash arcs, hit stars, warning marks, spikes), style rank, Darren's moves and state machine (`POSE`, `ATK`), damage, enemy AI with attack turns and poise, the shared boss AI |
| `src/level.js` | Chapters (`CH`, `loadChapter`), building a level, ground checks, zones/story flow, pickups, dialogue, checkpoints, music, HUD, camera, Ruffy following, main loop |
| `src/menu.js` | Title screen (Story / Adventure, chapter picker) and the Skyforge Hangar: Loadout, Forge, Parts, Contracts, Map, Moves, Settings |
| `docs/CHATGPT_GUIDE.md` | Copy-paste prompts and a data cheat sheet for adding armor, weapons, contracts, islands |
| `blender/darren_rig3.py` | Blender script that repairs, rigs, weights and animates Darren and exports `.blend/.fbx/.glb` |
| `tools/meshy_make.cjs`, `tools/meshy/*.txt`, `Make Titanic Scion.cmd` | Generates boss models with the Meshy AI API on Michael's PC (key in `meshy_key.txt`, never committed or served). Output: `models/meshy/<name>/` (git-ignored raw files) |
| `tools/build_single.py` | Inlines everything into one HTML file (`dist/`): scripts, CSS, fonts and images as data URIs |
| `pc-server.cjs`, `Play Darren.cmd`, `Stop Darren.cmd` | The PC launcher: a tiny Node.js server for this folder on 127.0.0.1:4319 (game folders only) |
| `vendor/` | three.js r128 and its add-ons (unchanged official files) |
| `docs/reference/` | The Sites version's earlier Sky Drake rig and loader, kept for comparison only (not loaded by the game) |
| `tools/sculpt_dumpling.py` | Sculpts Dumpling from smooth shapes and writes `assets/dumpling_model.js` (Python: numpy, scipy, scikit-image, pyfqmr) |
| `tools/sculpt_lib.py`, `tools/sculpt_cast.py` | Sculpt the three monsters from smooth shapes (edit the `Part`s and paint functions, then run it) |
| `tools/blender_import_cast.py` | Run in Blender on your PC: imports `models/*.glb` and saves editable `.blend` files |
| `tools/make_cast_sheets.py` | Model sheets in `docs/art/cast/` (concept next to the in-game model) |
| `models/*.glb` | Rigged, animated exports of the three monsters (glTF 2.0, +Y up, facing +Z, metres) and `cast_animations.json` (clip durations, loops, event times) |
| `tools/make_dumpling_art.py` | Builds the concept sheet `docs/art/dumpling_concept.png` and the portraits from `tests/dumpling_art.js` renders |
| `tools/pack_assets.py` | Re-packs a new `darren.glb` or music file into `assets/*.js` |
| `tests/*.js` | Automated tests (need Node and Playwright; optional): `story.js` and `story2.js` play each chapter, `flow.js`, `combat2.js`, `mobile2.js` check systems; `story3.js` plays Chapter 3; `dumpling.js` and `cast.js` test Dumpling and the big monsters; `cast_view.js` / `dumpling_art.js` render the art; `cast_export.js` writes and re-checks `models/*.glb`. Serve the repo with `python3 -m http.server 8768` and run `python tools/build_single.py --test` first |

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

**Add a new chapter (Chapter 4).** Chapter 3 is `data/stormglass.js`. Copy `data/chapter2.js` to `data/chapter4.js`,
change `id`, `name`, `saveKey`, the islands (keep `home` at 0, 0 if Mom's house should be there), links, zones,
story and ending, and add `<script src="data/chapter4.js"></script>` right after `stormglass.js` in `index.html`.
It appears on the title screen automatically. Chapter options: `ruffy` ('caged' or 'follow'), `cage` (island id),
`snowfall`, `woodpile`, `counter` ({ item, name }), `endingTalk`, `mom` (false keeps Mom at home), `updrafts`.

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
F Dragon Heart, E use (Skyforge, feed Dumpling), G Belly Bounce (Dumpling), N or Tab map, P pause / Hangar, M music.
Controller: X slash, Y heavy, A jump, B dash, D-pad up fly, LT dive, D-pad left style, D-pad right weapon, D-pad down
use, Back map, L3 Belly Bounce, LB+X / LB+Y skills, LB+RB Dragon Heart, R3 lock-on, Start pause.
Touch: on-screen stick and buttons (Fly, Style and Belly buttons included); the Hangar is in the pause menu.

## Skyforge recipes (for ChatGPT)

**Add an armor piece or set.** In `data/forge.js` add a set to `D.sets` and pieces to `D.armor` (slot, set, look,
stats, recipe). It shows up in Hangar > Forge > Armor automatically. New looks: a new `case` in
`buildArmorPiece()` in `src/forge.js`.

**Add a craftable weapon.** Add it to `W` in `data/forge.js` with `kind`, stats, `finisher`, `recipe` and, for
guns / bows / mortars, `shot`. Optional model: a `buildX()` in `src/weapons.js` plus a line in `buildWeapon()`.

**Add a part.** Add it to `D.parts`, then make something drop it (`D.drops`, a crystal in `data/adventure.js`
`nodes`, or a contract `reward`).

**Add a contract / island / den in Cloud Utopia.** Edit `data/adventure.js` (see the notes at the top of it).

## Dumpling, the chubby cloud drake (Cloud Utopia companion)

* All numbers, snacks, recipes, bushes and lines are in `data/dumpling.js` (notes at the top of the file).
* He has 7 weight stages (`weight.stages`); `weight.stuffedLimit` caps how much a full belly adds on top.
* **Weight** (`DUMP.w`, 0..1) and **belly fullness** (`DUMP.full`, 0..1) are saved in `UNLOCKS.dumpling`; the
  snack bag is `UNLOCKS.snacks`. Snacks fill the belly; digesting turns fullness into weight; walking and flying
  burn weight unless "Hold his weight" is on.
* **How the body grows:** the mesh carries per-vertex masks. `aFat` (whole body) and `aBelly` (the belly) push
  vertices along `aFdir` in the vertex shader in `dumpBodyMaterial()`: `grow = aFat * w * 0.3 + aBelly * (w * 0.5
  + full * 0.3)`. Change those numbers to make him grow more or less.
* **Jiggle:** `dumpJiggle()` is a damped spring (stiffer when light, floppier when heavy) driven by his own
  accelerations; `dumpKick(x, y, z, ripple)` adds a wobble (footsteps, landings, eating, giggles, trampolines).
* **Change his shape or colours:** edit `S`, `TAIL` and the paint colours in `tools/sculpt_dumpling.py`, run
  `python3 tools/sculpt_dumpling.py`, then rebuild. Small parts (eyes, horns, ear fins, wings, cloud tufts, scarf,
  tooth) are built in `buildDumpling()` in `src/dumpling.js` at anchor points the script finds.
* **New snack:** add it to `snacks` in `data/dumpling.js` (shape: berry, bun, melon, pepper, cake, puff, comet),
  then give it a source: a `bake` recipe, a `bushes` entry or a `drops` entry.

## Big monsters (Cloud Utopia)

* Numbers live in `data/cast.js`. Each monster has a home `island` and spot `at`, `hp`, `poise` (damage needed
  to stagger it), `speed`, `aggro` range, `respawn` seconds and `attacks` (wind-up seconds, damage, radius).
* **Weight stages** (Sky Drake, Heavyweight): `weight.stages` (7, from `src/weight.js`), `perBush` (weight per
  snack bush eaten), `slimPerMinute`, and `perStage` multipliers (hp, damage, speed, radius per stage).
* Animation: `castPose(type, clip, t)` in `src/cast.js` returns bone rotations for any clip at time t. The game
  blends between them; `tests/cast_export.js` bakes the same functions into the `.glb` files. To add a clip,
  add it to `CAST_CLIPS` and a `case` in `castPose`.
* AI: `castUpdate()` in `src/cast.js` (a state machine per monster: idle, eat, chase, the attack states,
  recover, stagger, dead). Hits go through `castHit()` (poise), so they do not get stun-locked.
* Rig per monster: root, hips, spine, chest, neck chain, head, jaw, browL/R, belly, tail chain, leg chains to the
  toes, arm chains to the hands, wing chains. `tests/cast_deform.js` poses every clip and reports skin stretch;
  `clearance()` in `tools/sculpt_lib.py` checks that arms and hands are not fused to the body.
* Textures: `tools/sculpt_cast.py` UV-unwraps each mesh (xatlas) and bakes a colour atlas and a normal map from the
  sculpt (`bake()` in `tools/sculpt_lib.py`; scale size per monster is `SCALES`, texture sizes `TEX`).
* LOD: each monster has a 30,000-triangle mesh and a 10,000-triangle `lod1`. `castLod()` in `src/cast.js` swaps
  to lod1 past 38 m and back under 30 m. Low graphics always uses lod1.
* Chomp Rex's teeth are separate meshes (`castToothGeo()`), placed on the lip edges from `grin_teeth()` in
  `tools/sculpt_cast.py`, which sets the count, size and inset.
* To change a body: edit its function in `tools/sculpt_cast.py`, run `python3 tools/sculpt_cast.py <type>`,
  then `node tests/cast_export.js` to refresh the `.glb`.

## Chapter 3: Stormglass Reach

* Content is `data/stormglass.js` (pushed onto `DATA.chapters` like Chapter 2). It sets `mom: false`, so Mom stays
  at home, and `updrafts`: cyan ring columns that lift Darren and refill flight (`updateStormglass()`).
* Enemies: `stormling` (flies, flashes, fires three shards), `wardling` (front guard like a Thornback, breaks below
  half health), `youngbelly` and `youngrex` (`src/stormglass-cast.js`), and the boss `tempest` (arm crystals, then
  lightning circles below 60%, back core below 25%).
* The young monsters use `buildCastModel()` with a wrapper group (`D.b`) so the shared enemy code can tilt and squash
  them while `castPose()` drives the skeleton. Their ids are new on purpose: `heavyweight` and `chomprex` are the
  Cloud Utopia monsters and their contracts.

## Graphics setting

* `SETTINGS.graphics`: `auto` (High on computers, Low on phones, and drops itself if frames run slow), `detail`
  (High: bloom, filmic grade, dense grass, 30,000-triangle monsters close up) or `smooth` (Performance: no shadows,
  pixel ratio 1, 10,000-triangle monsters). `gfxFor()` in `core.js` turns it into `SETTINGS.gfx` (`high` / `low`).
* Saves from 1.4 that chose Low on a computer become Performance.

## Weight stages (all creatures)

* `src/weight.js`: `stageInfo(stages, weight)` gives the stage index, name, size, lbs and progress. A creature's
  weight is 0..1 and never more; its body is drawn at its stage's `size`, so stage 7 is the size limit.

## Look and feel (semi-realistic rendering)

* Textures are generated in code by `lookTex(kind)` in `src/look.js` (no image files): `grass`, `rock`, `stone`,
  `bark`, `plank`, `snow`, `fine`. Use `lookMat(kind, tintColor, repeat, extraOptions)` for a textured material.
* Sky colours and sun direction: `SKY` in `src/look.js`. Fog and lights: `buildSky()` in `src/models.js`.
* Colour grade (exposure, saturation, warmth, vignette): `GradeShader` uniforms in `src/look.js`; bloom strength
  and threshold in `setupPost()`.
* Settings > Graphics: `high` (bloom, filmic grade, dense grass) or `low` (direct ACES render, for phones).
  The game drops to `low` by itself when the frame rate stays low.
