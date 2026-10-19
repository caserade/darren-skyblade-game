# Windows desktop app

`Darren Skyblade.exe` runs the game in its own window with nothing else to install, and keeps it up to date
from GitHub on two channels: Claude (the main game, from `main`) and ChatGPT (from the `chatgpt` branch).

## Play

Download `Darren-Skyblade-Windows.zip` from the newest `app-v…` release on
https://github.com/caserade/darren-skyblade-game/releases, extract it into a new folder and double-click
`Darren Skyblade.exe`. Keep the folder together. The exe is unsigned, so Windows SmartScreen may warn the
first time (More info > Run anyway). F11 is full screen, Ctrl+H the title screen.

Saves, unlocks and settings live in `%APPDATA%\Darren Skyblade Hunt` (Help > Open save folder). They are tied
to `skyblade://game/`, so they survive updates. To bring progress over from a browser (or the old PC
launcher), open Hangar > Settings > Save data > Export save file there, then Hangar > Update > Import save
file in the app.

## Updates

Every push to `main` runs `.github/workflows/publish-game-update.yml`:

1. If `desktop-app/package.json` has a version with no release yet, it builds the Windows app and publishes
   it as the GitHub release `app-v<version>`.
2. `tools/publish-game-update.cjs` writes `latest.json` (build number = commit time, the newest CHANGELOG
   heading as notes, every file's size and SHA-256, the newest app release) and a copy of the game as
   `game/`, and the workflow force-pushes them as the one-commit `game-updates` branch.

Every push to `chatgpt` does step 2 into the `chatgpt-updates` branch. The app (`updater.cjs`) reads both
`latest.json` files a few seconds after it starts and every hour. The repository must be public; no key is
used or stored anywhere. When a channel lists a game the app does not have:

- the title screen says which channel, the window title says "update available", and the Hangar's Update
  tab shows each channel with a Get this update button;
- installing downloads only files whose checksum the current game lacks, checks every byte, writes the new
  game to `updates/<channel>-b<build>/` in the save folder, and restarts on the title screen;
- a failed download leaves the current game in use; a damaged install falls back to the bundled game at
  the next start. Help > Use the game that came with the app removes downloaded games.

Game > Import a ChatGPT zip installs a zip ChatGPT handed back (the game is found inside it, even nested in
a folder or as a single-file build); `.git` folders and key files inside it are skipped. A game that needs a
newer app sets `minApp` (`MIN_APP` in the publish tool); older apps then say a new app is needed.

The game page reaches the app only through `preload.cjs` (`window.skybladeDesktop`); the main process refuses
those calls from any page outside `skyblade://game/`. Browser versions of the game have no Update tab.

For tests, `SKYBLADE_UPDATE_URL` / `SKYBLADE_CHATGPT_URL` point a channel at any web folder holding
`latest.json` and `game/`; `SKYBLADE_NO_UPDATES=1` switches updates off; `SKYBLADE_USER_DATA` moves the save
folder. `node tests/desktop_update.js` checks the updater; `xvfb-run -a node tests/desktop_app.js` drives the
real app.

## Build

```
cd desktop-app
npm install
npm run build:win      # -> out/Darren-Skyblade-Windows/ and .zip (Linux, Mac or Windows; no Wine needed)
```
