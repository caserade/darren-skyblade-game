# Darren: Skyblade Hunt — repair and visual-fidelity pass

14 October 2026. Repair of the existing private Site, followed by the user's separately authorized addition of the missing SkyDrake. No other enemies, levels, story, equipment, or game systems were added. Three.js r128, existing game content and bundled assets, original save keys and the owner-only audience are retained.

## Source and rollback

Project: `appgprj_6acf0e7886908191820064ec6fa5afa0`.

Playable URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site

Verified starting version: **4**, source commit `7f18a6a9cc044897043ded4e0f4a47b2288dff9a`. Local rollback tag: `repair-baseline-2026-10-14`. The published repair's exact commit/version/deployment are recorded in the final handoff; this report is part of that committed source.

## Repairs

- Settings no longer lets Enter activate a hidden New Game button. Tab stays inside the open panel; Escape closes it while preserving pause. Controller D-pad, confirm/back and slider navigation operate on visible menu controls.
- Pause, focus loss, lost touch capture and controller disconnect clear stale input. Independent input devices retain their own held-action state. A held heavy charge cancels on focus loss/menu entry instead of firing on resume.
- Legacy saves keep their original keys. Malformed checkpoints, collections and settings are normalized safely; storage denial/quota errors do not crash play. The first overwritten existing value is retained verbatim under the original key plus `.recovery` when storage permits.
- Ending, fast-travel and Adventure victory callbacks use pausable game time and cancel on quit, retry or chapter changes. Interrupted dialogue and its completion callback are cleared on those resets. Hostile shockwaves and damage stop during dialogue.
- Exact-center gem collection and prop overlap no longer produce invalid positions or leave Darren inside a prop. Stormglass pillar collision uses the authored height. Camera obstruction checks retract before those pillars and large living enemy bodies, allowing the view to clear after an enemy is defeated.
- Re-equipping weapons reuses a bounded model per weapon and hand. Identical enemy accessories/materials are shared; independently animated boss weak-spot materials are released on encounter cleanup.

## Turnaround matching

Inspected actual pixels from the supplied local cast references in `C:\Users\caser\Downloads\Darren-Skyblade\Darren Skyblade Game\docs\art\cast`. Copied the two relevant turnarounds into `art/references` for provenance. The separate downloaded game's source was not used to replace the hosted game.

- **Stormbelly / Heavyweight:** broad blue spotted torso, pale segmented underside, heavy arms, stocky legs, dark claws, swept ochre horns, small dark bat wings, back ridge and curved spade tail.
- **Chomp Rex / Grin:** plum spotted skin, golden underside continuing along the tail, rounded wedge snout, curved toothy grin, short two-finger arms, larger haunches and shaped lower legs, dark claws and back/tail ridge.
- Front, side, back and three-quarter screenshots were inspected, along with finite idle/chase/windup/attack/recovery/stun transforms. Attack timing, damage, radii, drops and encounter placement were preserved.
- **SkyDrake:** absent from the original hosted roster and intentionally omitted from repair-only version 5. The user subsequently authorized this one creature. Its implementation and verification are described below. The existing Darren/Mom rig was retained; these cast sheets are not reference evidence for changing their identities. Stormling and the stone enemies were retained.

These are improved procedural approximations, not finished sculpted replicas of the turnarounds. Detailed face topology, seamless sculpting and full bespoke rigs remain outside this repair pass.

## Verification

Fresh isolated Chromium/Chrome profiles were used; the user's real browser saves were not accessed or modified.

The following measurements record the repair-only version 5 baseline. The complete relevant suite was then rerun with SkyDrake; the extension's final results follow below.

- `tests/evidence/release-final/report.json`: **64/64 repair**, **61/61 gameplay**, **17/17 rendering/resource** checks; zero page errors.
- `tests/evidence/keyboard-play/play.json`: **16/16** actual browser keyboard-event checks for dialogue, movement, light/heavy/charged attacks, jumping, dodge, flight, pause, focus navigation and lock-on. Simulation stepping was deterministic. Later encounters used fixtures; this was not a full manual playthrough.
- `tests/evidence/menu-cycles.json`: **48/48** repeated title/paused Hangar tab navigation and back checks across all eight existing tabs.
- `tests/evidence/release-flows/flows.json`: legacy inventory/progress, malformed saves/settings, unavailable storage, paused/interrupted/completed ending, repeated/interrupted fast travel, keyboard menus, 390×844 portrait and 844×390 landscape layout.
- `tests/evidence/encounters-baseline.json` versus `encounters-release.json`: four cycles of all 15 existing enemy types with elites/bosses. Baseline geometry count grew **92 → 164** and registered materials **123 → 135**. Repaired counts stay **91 geometries / 123 materials** after warmup; all **48** expected private boss-material disposals occurred. Added reference details account for the final fixed geometry budget.
- `tests/evidence/resources-before.json` versus `resources-release.json`: ten weapon cycles grew the baseline material registry to **906**; repaired repeated cycles stop at **141** after all weapons/hands have warmed. The pillar camera ray had one opaque intersection before and zero after.
- Static audit: **55/55**, approximately **3.84 MiB** deployed assets. No QA harnesses ship in `dist`. `git diff --check` passes. Game-data, vendor, original bundled-asset and hosting-manifest files remain unchanged.

Software rendering was used for browser automation. Resource counts and CPU submission checks are not a claim of real-device FPS. No physical controller, physical phone, Safari/Firefox, or full manual playthrough coverage is claimed. Touch/gamepad interruption and navigation were simulated.

## Deliverables

- `tests/evidence/Skyblade-Hunt-before-after.png`: labeled front/side before-after comparison with both supplied turnarounds.
- Library save confirmed: `libfile_7a2fd9a2704c8191a49cbaa252410250`; attachment file ID `file_000000005c7c81f8a1a5e31055a08e1e`.
- `tests/evidence/final-visual`: all four creature angles and material inspection.
- `tests/evidence/animation-review`: inspected windup, attack and recovery poses, with zero page errors.
- `tests/evidence/keyboard-play`: in-game screenshots. The later corrected camera screenshot shows Darren instead of the obstructing Rex body.

Library upload succeeded. Its current local metadata helper cannot apply extended attributes on Windows; `tests/evidence/library-deliverable.json` retains the confirmed identifiers. This does not affect the uploaded comparison image.

## Authorized SkyDrake extension

The user authorized only the missing SkyDrake and extended the work window to 23:00 UTC. It appears at **Adventure > Cloud Utopia > Gale Spires**, in the existing den alongside its five existing Gustlings. It uses existing feather, cloud and plate resources. Story encounters, save keys, quest data and progression systems are unchanged.

- Actual pixels inspected: `concept_skydrake.jpg` (front, side, back and three-quarter turnaround) and `skydrake_model_sheet.jpg`, from the same supplied local cast directory. Copies are retained in `art/references`.
- The supplied `models/skydrake_lod1.glb` is copied unchanged to `dist/assets/skydrake.glb` (1,516,860 bytes). Its 39-bone rig, three skinned meshes and 14 animation clips are retained. Runtime refinements bring the geometry budget to approximately 30,671 triangles.
- Turnaround-based refinements include stout gold horns, cyan scalloped bat wings and dark frames, pale lower jaw, white/dark eyes, attached curved fangs and an upward-curled arrow tail. The tall neck, indigo body, pale segmented belly and large haunches come from the supplied rig. Front, side, back, three-quarter, face and ten animation poses were rendered and inspected.
- The existing encounter system runs the ground tail attack, takeoff, circling flight, marked swoop, landing and recovery. Telegraphs track world positions, one attack deals damage only once, stagger cancels windup, and pause/dialogue stop its simulation. Warning meshes and per-instance skeleton resources are cleaned up on death or encounter reset.
- Delayed, invalid or failed asset loads cannot create invisible attackers. Loading retries use bounded backoff. A late load after quitting does not spawn an enemy; returning to the den creates exactly one SkyDrake.

The model is a stylized adaptation of the supplied art, not an exact sculpted replica or a newly authored bespoke rig. Facial planes, subtle anatomy and tail seams remain approximate. The comparison explicitly distinguishes the original supplied GLB from the original hosted roster: the imported GLB was not previously a playable hosted enemy.

### Final extension verification

- `tests/evidence/release-skydrake/report.json`: **64/64 repair + 61/61 gameplay + 17/17 rendering/resource** checks, zero page errors.
- Actual keyboard suite **16/16**, repeated menu navigation **48/48**; save recovery, unavailable storage, ending/travel interruption and completion, and portrait/landscape flow scenarios rerun successfully (`tests/evidence/flows/flows.json`).
- `tests/evidence/skydrake-tests/report.json`: **46/46** creature checks, including all 14 clips with finite GPU-equivalent skin deformation, independent skeletons, shared geometry, both attacks, warning positions, target locking, dodge/jump avoidance, stagger, pause/dialogue, death cleanup, den respawn and story-roster isolation.
- `tests/evidence/skydrake-loading.json`: **18/18** delayed/network-failed/invalid-GLB checks, zero page errors, bounded requests and no duplicate den members.
- `tests/evidence/skydrake-long.json`: **20/20** checks. Two simulated encounter minutes on each of Easy, Normal and Hard (six minutes total), with both attacks and every flight phase reached naturally, finite positions, home bounds, and actual keyboard events for lock-on, flight, attack, pause and resume. Fixtures place Darren near the encounter; this is not a full manual journey or playthrough.
- Total counted automated checks across these suites: **290/290**. Static audit separately passes **57/57**, approximately **5.3 MiB** deployed assets. No QA harnesses ship in `dist`.
- Four repeated cycles of all **16** enemy types hold at **127 geometries / 16 textures / 123 registered materials / 100 scene children** after warmup. All **48** expected private boss-material disposals occur (`tests/evidence/encounters-skydrake-release.json`). Six focused SkyDrake cycles separately remain stable at 106 geometries / 15 textures in that smaller fixture.

The software-rendering and physical-device limitations above still apply. No real-device frame-rate, physical controller/phone, Safari/Firefox or full manual playthrough coverage is claimed.

### Final visual deliverable

- `tests/evidence/Skyblade-Hunt-SkyDrake-reference-comparison.png`: actual supplied four-view reference, original imported model, final four views and flight pose.
- Library ID: `libfile_73f8379d38c88191a2e780681673e08d`; attachment file ID: `file_00000000958081f8bca5f8ee638d185c`.
- Upload succeeded; the Windows extended-attribute helper remains unavailable. Confirmed identifiers are retained in `tests/evidence/skydrake-library-deliverable.json`.

## Final camera and integration checks

A fresh-save keyboard flight to Gale Spires exposed a foreground harvest crystal blocking Darren. Crystal camera bounds now cover the visible model. A close crystal temporarily cuts away rather than pushing the camera into Darren's face, and restores immediately when the camera clears it; farther crystals retract the camera normally. Mining health, hitbox, rewards and collision remain unchanged. Small moving enemies can still occupy the foreground in a crowded encounter; this is not a claim that every possible view is unobstructed.

- `tests/evidence/crystal-camera/report.json`: **8/8**, including actual mesh-ray obstruction before/after, twenty cutaway/restoration crossings, flight clearance, distant clipping, mined-crystal cleanup, finite inside-focus behavior and unchanged harvest stats. Before/after screenshots were inspected.
- `tests/evidence/release-final-camera/report.json`: **64/64 repair, 61/61 gameplay and 17/17 rendering/resource** checks rerun after the final camera change, with zero page errors. The actual keyboard suite remains **16/16**, longer creature suite **20/20**, and static audit **57/57**.
- `tests/final-integration/Skyblade-Hunt-natural-arrival.json`: **5/5**. A fresh isolated profile enters Adventure through the visible menu and flies to Gale Spires using real keyboard events, without teleporting or changing health, energy, inventory or enemy state. The natural encounter has exactly one SkyDrake and five Gustlings. This short route took 8.35 simulated seconds; it is not a full playthrough.
- `tests/final-integration/Skyblade-Hunt-final-reward-check.json`: **9/9**. The unchanged 2,400-HP creature was defeated with 172 actual single-light-attack key presses. This separate fixture follows the target and enables player invulnerability, so it verifies damage/reward/save integration rather than balance. All five part gems were collected, the existing Feather Harvest contract completed, exact inventory and completion state survived reload, the legacy sentinel field remained intact, and no creature-specific save key was introduced.
- The integration reports retain SHA-256 hashes of the tested `level.js`, `combat.js` and `skydrake.js`. Their `baseCommit` identifies version 6 before the final camera patch, not a claim that version 6 contained that patch.

Final counted coverage is **312/312 automated checks**, plus **57/57 static checks** and the previously described flow scenarios. The original rig, creature appearance and Library comparison remain unchanged by the final camera repair.
