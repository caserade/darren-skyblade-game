# Changelog

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
