# Changelog

## 1.6.0 — 2026-10-19 — Windows app with Claude and ChatGPT update channels

- **`Darren Skyblade.exe`** (`desktop-app/`, Electron): the game in its own window, nothing else to install.
  Download `Darren-Skyblade-Windows.zip` from the `app-v1.0.0` release, extract, run. F11 full screen.
- **Automatic updates from two channels.** The app checks GitHub when it starts and every hour: Claude's
  channel (the `game-updates` branch, rebuilt from `main` by a workflow on every push) and ChatGPT's channel
  (`chatgpt-updates`, rebuilt from the `chatgpt` branch). The title screen says when either has a game you
  do not have; Hangar > Update shows both channels, and Get this update downloads only the changed files,
  checks every byte and restarts the game with saves kept. A failed download never replaces the game.
- **Import a ChatGPT zip** (Game menu or the Update tab): installs a zip ChatGPT hands back, finding the game
  inside it; keys and `.git` folders in it are skipped.
- **Save data export / import** in Hangar > Settings (and the Update tab): move progress between a browser,
  the old PC launcher and the app.
- Workflow `.github/workflows/publish-game-update.yml`; tests `tests/desktop_update.js` (updater with a
  stand-in GitHub, 31 checks) and `tests/desktop_app.js` (the real app under a virtual screen).

## 1.5.2 — 2026-10-16 — Easier, fair difficulty (everything can be played through)

Tuned with a new playtest bot (`tests/balance.js`): a plain "average player" that walks in, mashes combos, jumps at
fliers and shockwaves and dodges when an attack starts. It never uses skills, flight or Dragon Heart. On Normal it
now clears every story zone, every boss and every Cloud Utopia monster. The bosses still bring it low.

| Fight (Normal) | Before | Now |
| --- | --- | --- |
| Grumblepeak (Ch 1) | 2 min 42 s, knocked out 3 times | 1 min 33 s, no knockouts (77 HP left) |
| Old Knotroot (Ch 2) | 1 min 32 s, knocked out once | 58 s, no knockouts |
| Gale Gardens / Observatory (Ch 3) | could not be cleared | 32 s / 46 s, no knockouts |
| Tempest Warden (Ch 3) | 2 min 19 s, knocked out 4 times | 1 min 22 s, no knockouts |
| Sky Drake / Heavyweight / Chomp Rex | knocked out 1-5 times | 41 s / 75 s / 55 s, no knockouts |
| Titanic Scion | 5 min, knocked out 7 times | 2 min 16 s, knocked out once (the toughest optional fight) |

- **Difficulty numbers:** Normal enemies hit 80% as hard with 90% health. Bosses, the Titan and the big monsters
  have their own numbers: 38% damage and 60% health on Normal, with weak spots scaled to match. Easy and Hard
  were adjusted to fit around it. Settings shows both pairs.
- **Fairer fights:**
  - A whiffed swing can be dodged or jumped out of once its active frames are over.
  - A knockdown never throws Darren off the island.
  - Fall damage follows the difficulty.
  - Heavyweight: softer stomp (28) and belly slam (18), a slightly longer slam wind-up, and a slower shockwave
    you can see coming and jump.
  - Chomp Rex: softer charge (30) and bite (20), with a slightly longer bite wind-up.
  - Titan: 6,500 health, with slightly softer swings.
- **Chapter 3 fixes:**
  - Stormlings hover low enough for a jump attack, only back away when Darren is right under them, and sink
    after firing so you can punish them. Their shards are softer and they fire less often.
  - A Wardling's front guard takes 25% of a hit instead of 12%, and front hits can now crack it, so they can
    always be beaten.
- **Bug fixes:**
  - Mashing attack in the air could carry Darren upward forever (he reached 49 m against Chomp Rex).
  - The Heavyweight's stomp shockwave ignored the difficulty setting.

## Tools — 2026-10-16 — Meshy AI boss maker

- `tools/meshy_make.cjs` and `Make Titanic Scion.cmd`: make a boss model with the Meshy AI API on your own PC
  (text or image to 3D, remeshed to 100,000 triangles, 2K PBR textures, then Meshy's auto-rig and walk / run
  clips when the shape is two-legged). The key stays in `meshy_key.txt` on the PC: it is only sent to Meshy's
  API, never to download links, and never printed, logged, committed or served. Tested end to end against a
  stand-in server; the first real run is Michael's. (Replaces the Tripo tool, which was removed.)

## 1.5.1 — 2026-10-16 — Low volumetric fog instead of eye-level clouds

- **Low fog between the islands.** A height fog now pools under and between the islands: thick below the island
  tops, thin at Darren's height. The drops between islands and the island undersides melt into soft white mist,
  while the view across an island stays clear. It is exponential height fog, worked out along each view ray in
  every fogged material (it replaces three.js's fog chunks), with a puffy texture where the ray meets the layer.
  Tuning lives in `LOWFOG` at the top of `src/look.js`.
- **No more clouds in the way.** The 26 billboard cloud groups that floated at eye level, and drifted into the
  play space, are now 16 high, far clouds (52-92 m up, 150-320 m out). They fade out as the camera gets close, so
  flying up never fills the screen with a cloud.
- The cloud sea far below is tinted to the same mist, so the fog and the sea read as one layer.

## 1.5.0 — 2026-10-15 — The merged edition (Claude version as the main game)

Folded in everything new from the 15 October "Merged PC" copy, which combined this game with the hosted
Sites version. Where the two disagreed, this version's look, ids and saves were kept.

**New from the merge**
- **Chapter 3: Stormglass Reach.** Lantern Landing, Gale Gardens, the Shattered Observatory and the Eye of the
  Storm. Cyan updraft rings lift Darren and refill flight. Stormlings fire a three-shard fan, Wardlings block
  from the front, and the Tempest Warden has arm crystals, lightning circles and an exposed back core. New
  parts (Stormglass, Tempest Core) and a new weapon, the **Stormsaber**.
- **Field guide** in the Hangar, with the Stormglass concept sheet.
- **Graphics: Automatic / High detail / Performance**, and a **Camera shake** slider.
- **Controller menus:** the D-pad and A/B move through and press menu buttons; Tab cycles inside the Hangar.
- **Sturdier saves and input:** damaged saves are repaired (with a one-time `.recovery` copy), keys can't get
  stuck when the window loses focus, a held charge is cancelled by menus, and story timers pause with the game.
- **Memory:** a monster's rig, textures and unique geometry are released when it dies, and a level's geometry
  when it is unloaded. Weapons and enemy materials are cached instead of rebuilt.
- **Camera:** it no longer pushes through Stormglass pillars or big enemies.
- **Offline play:** three.js r128, its add-ons and the fonts are bundled (`vendor/`, `assets/fonts/`). The
  single-file build inlines them, so `dist/DarrenSkyblade.html` works without internet.
- **PC launcher:** `Play Darren.cmd` / `Stop Darren.cmd` serve the game folder on `127.0.0.1:4319` (game
  folders only, never the network). It takes over from the old Merged PC launcher, and the save carries over.
- Mom's new woven apron.

**Kept from this version (where the merge had changed it)**
- Cloud Utopia's Chomp Rex is `chomprex` again (the merge renamed it `castrex`). Saves from the merged copy are
  converted automatically.
- Chapter 3's Stormbelly and Chomp Rex were simple primitive models that shared those names. They are now
  **young versions of the sculpted monsters** (`youngbelly`, `youngrex`), with the same amber warnings and timings.
- Satin skin on Darren, Mom, Ruffy and Gearwing (the merge made them fully matte), faceted boss crystals, and the
  original title-screen style.
- The weathered stone textures, mist and warmer light now apply to Chapter 3 only. Chapters 1-2 and Cloud Utopia
  keep their bright look, and the doubled contact shadows were removed.
- Automatic graphics means High on computers (the merge always used Low), with the frame-rate safety net.
  The distance LOD for the monsters stays on.

**Fixes found while merging**
- A resource crystal right behind Darren in Skyforge Haven blocked the whole view: it is now cut away whole.
- Mom no longer appears on Chapter 3's first island.
- Parts a chapter boss drops are now collected when the ending starts. Before, the ending cleared the gems
  still in the air, so the Tempest Core could vanish and the Stormsaber could not be forged. Parts dropped
  far from Darren after Grumblepeak and Old Knotroot were lost the same way.
- Garbled characters in the field guide. The concept-sheet link is hidden in the single-file build, where
  browsers block it.
- Removed calls to Sky Drake functions that only existed in the Sites version.
- New test: `tests/story3.js` plays Chapter 3 from start to finish.

## 1.4.3 — 2026-10-14 — Monster refinement pass

- **Chomp Rex:** a new grin. The teeth are now chunky cartoon teeth (broad root, rounded tapered tip, convex
  front) in ivory, shaded darker at the gum. There are fewer and bigger teeth (2 x 18 instead of 2 x 23), tucked behind the lip
  edge instead of sitting on it, with a wider gap between the lips so they read from across the island. It
  also gets heavier drumstick thighs, thicker shins, ankles and toes, a tail that curls up at the tip like the
  concept, and soft ventral plate lines across the belly and throat.
- **Sky Drake:** thicker upper arms with a bicep, a thicker forearm, bigger hands and fingers, rounder
  haunches, and darker navy wing bones.
- **Heavyweight:** darker wing bones.
- **Distance LOD:** each monster swaps to its 10,000-triangle mesh (with 512 px maps) when the camera is
  more than about 38 m away. It swaps back under 30 m, so it never flickers at the boundary. Low graphics
  stays on the light mesh.
- Deformation check: Chomp Rex's worst stretch during the charge dropped from 77 to 46.

## 1.4.2 — 2026-10-14 — Monster studio pass (UVs, baked textures, normal maps)

- **UV-unwrapped game meshes** (xatlas) with a **baked 1K colour atlas and 1K tangent-space normal map** per
  monster (512 px for the light LOD). The bake samples the true high-detail sculpt, so belly plates, folds,
  creases, lips and a layer of rounded scale clusters show up as real surface detail on a 30,000-triangle mesh.
  Colour includes ambient occlusion and scale cavities. Tangents match three.js exactly (no seams).
- **Thick swept-back fin spines** with rounded edges, **hooked claws**, wing membranes shaded dark at the arm
  and light at the trailing edge, darker lids, matte spines and glossy claws.
- Triangle budget: body 30,000 (light LOD 10,000) plus spines, claws, teeth, horns and eyes.
- The rigged `.glb` files in `models/` now carry the UVs, tangents and both textures.

## 1.4.1 — 2026-10-14 — Monster model pass (mesh, rig, weights)

- **Meshes:** sculpted on a grid about 2.5 times finer (19 mm instead of 26 mm), 36,000 triangles each, plus a
  light 11,000-triangle LOD that Low graphics uses. Feet stand exactly on the ground. Ambient occlusion is
  baked into the vertex colours.
- **Anatomy closer to the concept sheets:** Sky Drake gets a thicker S-neck with four neck bones, a split angry
  brow, knees, four toes and three fingers. Heavyweight gets deltoids, biceps, forearm bulk, a jutting underbite
  with tusks and deeper belly folds. Chomp Rex gets a new angular wedge head with flat lip planes and a
  clenched grin of 2 x 23 evenly spaced teeth.
- **Real claws** on every toe and finger, angular zigzag horns on the Sky Drake, and lids that match the skin.
- **Rig:** new brow bones (angry by default, furrowed on every wind-up), a belly bone for secondary motion, more
  tail bones (6 / 5 / 5), toe bones on the Heavyweight.
- **Weight paint:** found and fixed arms that were fused to the belly and thighs in the sculpt (an automatic
  clearance check now guards it). Weights are relaxed over the surface in the blend zones, pruned below 5% and
  capped at 4 per vertex, and the jaw gets an exact split along the mouth line so opening it never drags the
  upper lip. A new deformation check (`tests/cast_deform.js`) poses every clip and measures triangle stretch.
- Heavier weight stages push the Stormbellies' arms outward so the belly never swallows them (Dumpling too).
- `models/` now has both LODs as rigged, animated `.glb` files.

## 1.4.0 — 2026-10-14 — Dumpling, the big monsters of Cloud Utopia, and weight stages

### Dumpling, the chubby cloud drake

- **Seven weight stages with a hard limit** (`src/weight.js`), shared by every creature that gains weight. Each
  stage has a fixed body size; bodies ease between stages and never grow past stage 7. A full belly can only
  add a small, capped bulge on top. Dumpling: Trim, Chubby, Plump, Round, Rotund, Hefty, Wobbly Wonder.
- **Three big monsters from Michael's approved concept sheets**, each a sculpted, seamless, skinned body
  (34,000 triangles, 25 to 34 bones) with painted scales, eyes with angry lids, horns, back spines and teeth:
  - **Stormbelly Sky Drake** (Gale Spires): bat wings on a skinned membrane, takes off, circles and swoops
    onto a red ground marker; tail whip on the ground.
  - **Stormbelly Heavyweight** (Sparkstone Mesa): a 1.1 s telegraphed stomp with a jumpable shockwave ring, a
    long recovery to punish, and a close-range belly slam.
  - **Chomp Rex** (Thorn Wastes): a 0.8 s ground scrape, a straight charge and a bite with its toothy grin.
  - Poise: they only stagger when enough damage piles up. They come back four minutes after being beaten.
  - **The two Stormbellies eat snack bushes** on their islands while calm and climb the 7 weight stages
    (more health and damage, wider attacks, slower), then slowly slim down. Shake the bushes first.
  - New parts (Storm Scale, Gold Drake Horn, Belly Plate, Plum Rex Hide, Chomp Rex Fang), the Stormbelly armor
    set, the Chompfang blade, the Stormbelly Cannon and three repeatable contracts.
  - **Rigged .glb files with 12 to 14 named animation clips each** in `models/`, plus
    `models/cast_animations.json` (durations, loop flags, gameplay event times) and model sheets in
    `docs/art/cast/`.

- **New companion: Dumpling**, an original jade cloud drake baker who lives at an oven in Skyforge Haven and
  follows Darren around Cloud Utopia once met. A sculpted, seamless, skinned body (16 bones) with belly plates,
  freckled blushing cheeks, amber eyes with blinking lids, curled horns, sunset ear fins, comically tiny wings,
  cloud tufts on his head and tail, back nubs and a polka-dot neckerchief.
- **Weight and belly:** snacks fill his belly, digesting turns it into weight, and walking or flying with Darren
  burns it off (or hold his weight). Seven stages from Trim to Wobbly Wonder; his whole body, cheeks and belly grow,
  the belly sags as it gets heavy and his arms ride up on top of it.
- **Belly jiggle:** a spring-driven wobble with a ripple across the belly on every footstep, landing, bite,
  giggle, sword poke (it tickles) and trampoline bounce. Heavier means slower, floppier wobbles.
- **Weight changes how he plays:** Belly Bounce (G / Belly button / L3) hits harder and wider and knocks enemies
  down when he is heavy; it is quicker and launches enemies when he is light. Land on him for a trampoline
  bounce (higher the rounder he is). Light Dumpling buzzes his tiny wings; heavy Dumpling floats like a balloon.
- **Snacks:** nine snacks (Sky Berry to the Titan Feast Cake), snack bushes on the islands, snack drops from
  enemies, six bake recipes from Skyforge parts, and the spicy Ember Pepper for a minute of flaming bounces.
- **Hangar > Dumpling:** portrait, weight in lb and tier, belly meter, Belly Bounce numbers, feed and bake,
  follow / wait at the bakery, hold weight, pat his belly. A HUD chip shows his tier and the bounce timer.
- **Concept art:** `docs/art/dumpling_concept.png`, rendered from the in-game model.

## 1.3.0 — 2026-10-14 — Semi-realistic polish (two passes)

- **Rendering:** filmic (ACES) tone mapping, HDR bloom, colour grade and vignette; a sky dome with a sun and
  glow; a moving sea of clouds below the islands; soft billboard clouds kept out of the play space; fog matched
  to the horizon; a stronger warm sun with cool sky fill and reflections taken from the sky.
- **World materials:** procedural textures with normal maps for grass, layered rock cliffs, stone, bark, wooden
  planks and snow. Islands now have uneven outlines, a soil lip, rough undersides and hanging rocks.
- **Vegetation:** broadleaf trees with bark trunks, branches and soft leaf canopies; six-tier snowy pines;
  thousands of wind-swaying grass blades (three-blade clumps shaded from root to tip).
- **Props:** textured cottage walls and roof, ruins, bridges, stepping stones; smooth natural rocks; stone-skinned
  Grumblepeak.
- **Characters:** satin scaled skin with fine grain instead of plastic gloss on Darren, Mom and Gearwing; softer
  clearcoat on enemies and props; contact shadows under everyone.
- **Sound and feel:** wind ambience that rises with height and flight, birdsong on calm islands, footsteps with
  dust puffs, landing thuds and wing beats.
- **Settings > Graphics** (High / Low); automatic fallback to Low when the frame rate drops.

## 1.2.0 — 2026-10-14 — Skyforge update: Adventure mode, crafting, Twin Arms, flight

Inspired by mech hunting games like Daemon X Machina: Titanic Scion, mixed with everything already in the game.

- **Adventure: Cloud Utopia.** A new open mode on the title screen: nine floating islands to explore freely,
  roaming enemy dens that come back, resource crystals to mine, waystones to light for fast travel, a world
  Map (N / Tab / Back), ten contracts (hunt, harvest, explore, titan), Gearwing the forgemaster at the Skyforge,
  and the **Titanic Scion**, a huge violet-crystal Grumblepeak with Titan Cores to harvest.
- **Parts and the Skyforge.** Every enemy drops parts (Elites always drop a Crown Shard, boss weak spots drop
  boss cores) as glowing gems that fly to Darren. Forge 6 new weapons and 24 armor pieces in 6 sets from parts.
- **Armor.** Head, body, arms and legs with HP, block, speed, stamina, flight and damage stats and 4-piece set
  bonuses. The pieces appear on Darren's rigged model.
- **Twin Arms style.** A weapon in each arm: Slash = R-arm, Heavy = L-arm, each with its own string. New arm
  weapons: Ember Blaster (rapid homing shots, hold to fire), Gale Bow (piercing arrows), Spore Mortar (exploding
  shells). Switch between Classic combos and Twin Arms with T or in the Hangar.
- **Flight.** V takes off on Darren's wings; hold Jump to climb, C / LT to dive, flight energy refills on the
  ground. Attacks hover in the air. In story chapters storm winds stop Darren flying to islands he hasn't unlocked.
- **Weak-spot focus.** Lock on to a boss and press lock again to pick a crystal; shots home in on it.
- **New menus.** A Story / Adventure title screen with collapsible controls, a Quit to title option, and the
  **Skyforge Hangar** (Loadout, Forge, Parts, Contracts, Map, Moves, Settings).
- **ChatGPT-ready content.** All new content is data in `data/forge.js` and `data/adventure.js`;
  `docs/CHATGPT_GUIDE.md` has copy-paste prompts for new armor, weapons, contracts and islands.
- Fixes: Boltails aim at Darren's height, so flying is not a free escape; the objective box sits below the taller HUD plate.

## 1.1.0 — 2026-10-11 — Combo strings, weapons, smarter enemies, Chapter 2

- **Branching combo strings.** Heavy at each point of the Slash string gives a different move: Tail Sweep
  (after 1 slash), Skyward Flare launcher (after 2), Ground Wave shockwave (after 3) and the weapon's finisher
  (after 4). New Sky Spike (Heavy after an air slash), Comet Rise (Wing Dash, Heavy) and Wing Lunge now flows into
  the string. Every move is listed in the new Moves tab of the pause menu.
- **Style rank and hit juice.** D to S style meter that rewards varied moves, finishers, air hits and perfect
  dodges and drops a rank when Darren is hit; higher ranks fill Dragon Heart faster; the zone-clear banner and
  the end card show the best rank. Finishers punch the camera in and kick the view; slash arcs follow each swing;
  hit stars and spark streaks on impact.
- **Weapons.** Cloudcutter (long reach, Gale Cleave wind wave) in Windy Grove, Jellyblade (fast, Wobble Burst
  bounce) at Thornback Gate, Mom's Ladle (heavy hits, Soup Slam heals) from Mom in Chapter 2. Switch with R,
  D-pad right or the Weapons tab. Unlocks are remembered.
- **Smarter enemies.** Health bars over heads, attack turns (only a few attack at once, the rest circle),
  poise and real stagger, knockdowns that bounce and get-up animations, Elite variants with a crown and an extra
  trick. Grumblepeak gained a leaping stomp with three shockwaves and roars, shoves Darren back and talks at each
  phase change.
- **Mom and Ruffy.** Mom is now built from Darren's high-poly rigged model (bigger, rosier, apron and flower) and
  gestures while she talks. Ruffy is rounder with blinking eyes, ears that perk or droop, a tongue and a bigger
  tail; in Chapter 2 he trots beside Darren and barks at firewood he sniffs out.
- **Chapter 2: Firewood for Mom.** Four new snowy islands, falling snow, firewood to gather (10 bundles), two new
  enemies (Barkling burrows and bursts up under you; Snowcap lobs snowballs that chill you) and the boss
  Old Knotroot with root eruptions. Chapter picker on the title screen; each chapter has its own checkpoint save.
- **Settings.** Easy / Normal / Hard, camera sensitivity, invert camera, music and sound volume.
- **Fixes.** The "+HP" text no longer pops up at full health; the idle sword is held forward; trees right next to
  the camera hide instead of blocking the view; the HUD hides while paused.

## 1.0.0 — 2026-10-09 — Chapter 1: The Trail to Cloudroost Peak

- One complete story level: six floating islands from Mom's house to Cloudroost Peak, with dialogue,
  objectives, island name banners, Ruffy's paw-print trail, two keepsake pickups (ball, collar tag),
  rising stepping stones, thorn-barrier bridges, checkpoints with Continue, fainting and retry, falling
  and respawn, the Grumblepeak boss, a finale with Ruffy's rescue, the ending at home and an end card.
- New characters: Mom (red Shoyru) and Ruffy (blue and white dog fox).
- Music: Michael's "Snowday Choir" loop with soft battle drums; M toggles music.
- Darren model, three passes:
  1. Mesh repair: 2 sliver triangles removed, 29 fin edges split, 12 small holes filled (UVs copied from
     neighbours), 2 flipped faces fixed, glossy toy material instead of Tripo's matte 0.9 roughness.
  2. Weights rebuilt with per-part rules: wings follow only wing bones, eyes and brows ride the head rigidly,
     arms and legs cannot pull the wrong side, the crotch seam belongs to the hips, max 4 bones per vertex,
     all weights normalised.
  3. Deformation stress test over all 24 animations; shoulder and hip blends retuned and four extreme arm
     poses (overhead slam, launcher, Blaze Wheel, backhand) eased so the arms no longer pass through the head
     or wings. The same pose changes are in the game.
- Project made editable: all content in `data/game_data.js`, readable formatted source, `README_FOR_AI.md`,
  no build step needed.
