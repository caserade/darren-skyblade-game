# Darren: Skyblade Hunt

A 3D sword-action game in the browser starring **Darren the Shoyru**, in the spirit of Ragnarok Odyssey Ace with
a Neopets look, and a Skyforge update inspired by mech hunting games like Daemon X Machina: Titanic Scion.

## Play

* **Easiest:** open `dist/DarrenSkyblade.html` in Chrome or Edge (one file, everything inside).
* **From the source:** open `index.html` (it loads the files in `data/`, `assets/` and `src/`).
* **GitHub Pages:** Settings → Pages → deploy from the `main` branch, root folder. The game is `index.html`.

An internet connection is needed the first time, for the three.js library.

## What's in it

* **Story mode:** Chapter 1, *The Trail to Cloudroost Peak*, and Chapter 2, *Firewood for Mom*.
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
* **Hangar menu:** Loadout, Forge, Parts, Contracts, Dumpling, Map, Moves and Settings (difficulty, camera, volume).

## Controls

Keyboard: WASD move · mouse camera · J / click Slash (R-arm) · K / right-click Heavy (L-arm) · Space jump ·
V fly (hold Space to climb, C to dive) · G Belly Bounce (Dumpling) · Shift Wing Dash · Q lock on (again on a boss: focus a weak spot) ·
T Classic / Twin Arms · R switch weapon · 1, 2 skills · F Dragon Heart · E use · N map · P pause / Hangar · M music.
Controller and touch screens are supported too (see the in-game Controls list).

## Making new content

All content is plain data in `data/`. `README_FOR_AI.md` explains how the code fits together, and
`docs/CHATGPT_GUIDE.md` has copy-paste prompts for ChatGPT to add armor, weapons, parts, contracts, islands and
chapters. After changing the source, `python tools/build_single.py` rebuilds the one-file version in `dist/`.
