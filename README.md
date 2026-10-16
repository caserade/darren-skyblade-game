# Darren: Skyblade Hunt

A 3D sword-action game in the browser starring **Darren the Shoyru**, in the spirit of Ragnarok Odyssey Ace with
a Neopets look, and a Skyforge update inspired by mech hunting games like Daemon X Machina: Titanic Scion.

## Play

* **On a PC:** double-click `Play Darren.cmd` (needs [Node.js LTS](https://nodejs.org)). It opens the game at
  `http://127.0.0.1:4319/`, which keeps your save in one place. `Stop Darren.cmd` stops it.
* **One file:** open `dist/DarrenSkyblade.html` in Chrome or Edge (everything inside, works offline).
* **GitHub Pages:** Settings → Pages → deploy from the `main` branch, root folder. The game is `index.html`.

three.js and the fonts are bundled, so no internet connection is needed.

## What's in it

* **Story mode:** Chapter 1, *The Trail to Cloudroost Peak*, Chapter 2, *Firewood for Mom*, and Chapter 3,
  *Stormglass Reach* (updraft rings, Stormlings, Wardlings, a young Stormbelly and Chomp Rex, and the Tempest Warden).
* **Adventure: Cloud Utopia:** an open sky of islands with roaming enemies, resource crystals, waystones and a
  map with fast travel, contracts, the Skyforge and the Titanic Scion.
* **Combat:** frame-based sword combos with Heavy branches, launchers, air strings, Wing Dash with perfect-dodge
  counters, Dragon Heart, style rank D to S.
* **Two combat styles:** *Classic Combos*, or *Twin Arms* with a weapon in each arm (R-arm on Slash, L-arm on
  Heavy): blades, the Ember Blaster, the Gale Bow and the Spore Mortar.
* **Skyforge crafting:** enemies and crystals drop parts; forge 10 weapons and 24 armor pieces in 6 sets.
* **Flight:** Darren's wings (V). Some islands can only be reached by flying.
* **Dumpling, the chubby cloud drake:** an original companion in Cloud Utopia. Feed him snacks and he gets
  rounder, one of 7 weight stages at a time (stage 7 is the limit), with a wobbling belly. Heavier means a bigger Belly Bounce (G) and a higher
  trampoline; lighter means faster bounces and buzzing flight. Bake snacks from parts at his oven.
* **Big monsters in Cloud Utopia:** the Stormbelly Sky Drake (swoops from the sky), the Stormbelly Heavyweight
  (stomp shockwaves) and Chomp Rex (charge and bite). The Stormbellies eat snack bushes and grow through 7
  weight stages. New parts, armor, weapons and contracts come from them.
* **Hangar menu:** Loadout, Forge, Parts, Contracts, Dumpling, Map, Moves, Field guide and Settings (difficulty,
  camera, camera shake, volume, Graphics: Automatic / High detail / Performance). Menus work with a controller.

## Making boss models with Meshy AI (optional)

The game can use [Meshy](https://docs.meshy.ai)'s text/image-to-3D API to make better boss models.
The calls run on your own PC, with your own key:

1. Put your Meshy API key in a file called `meshy_key.txt` in this folder (just the key, one line). It is never
   uploaded to GitHub (`.gitignore`) and the game's local server never serves it.
2. Double-click `Make Titanic Scion.cmd`. It sends the description in `tools/meshy/scion.txt` (shape, then
   PBR textures, then Meshy's auto-rig for two-legged characters) and saves everything in `models/meshy/scion/`:
   `model.glb`, the texture maps, `rigged.glb` with `walking.glb` / `running.glb` if it could be rigged, a preview
   picture and `info.json` (task ids and credits used).
3. Tell Claude it's done: the model is then brought into the game (game-size LODs, the boss's crystal weak spots,
   its skeleton and moves).

Other bosses: `node tools/meshy_make.cjs --name <boss> --prompt-file <file>` or `--image <concept.png>`
(add `--hd` for finer geometry, `--texture 4k` for sharper maps; both cost more credits).

## Controls

Keyboard: WASD move · mouse camera · J / click Slash (R-arm) · K / right-click Heavy (L-arm) · Space jump ·
V fly (hold Space to climb, C to dive) · G Belly Bounce (Dumpling) · Shift Wing Dash · Q lock on (again on a boss: focus a weak spot) ·
T Classic / Twin Arms · R switch weapon · 1, 2 skills · F Dragon Heart · E use · N map · P pause / Hangar · M music.
Controller and touch screens are supported too (see the in-game Controls list).

## Making new content

All content is plain data in `data/`. `README_FOR_AI.md` explains how the code fits together, and
`docs/CHATGPT_GUIDE.md` has copy-paste prompts for ChatGPT to add armor, weapons, parts, contracts, islands and
chapters. After changing the source, `python tools/build_single.py` rebuilds the one-file version in `dist/`.
