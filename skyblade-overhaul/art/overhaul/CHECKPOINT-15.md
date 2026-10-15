# Checkpoint 15 — integrated local release candidate

Phase started 2026-10-15 06:00 UTC, following accepted checkpoint 14. No new content, engine migration, save-key changes, audience changes or publication. The existing root `dist/` remains unchanged. The isolated complete candidate is `skydrake15/release/dist/`, retaining project `appgprj_6acf0e7886908191820064ec6fa5afa0` in its hosting manifest. No Site registration, remote push or deployment was attempted.

## Concrete changes

- Local SkyDrake hip/tail skin-weight diffusion removes the sharpest inherited weight discontinuities. The GLB JSON, rest geometry, normals, UVs, textures, 39-bone rig and 14 authored clips are byte-identical to checkpoint 14. Only body joint/weight accessor bytes change. Full: 1,876 welded positions; reduced: 1,009. Blender sources reopen with packed images and matching weights within 3e-8.
- Worst hip-region attack edge stretch falls from 4.703 to 3.378 on the full mesh and 4.594 to 3.093 on reduced. Windup, walk, takeoff, flight and landing also improve. This metric does not mean all deformation is solved: extreme creasing remains, with a larger remaining neck/chest stretch outside this repair mask. Reduced hit stretch changes slightly from 1.101 to 1.121.
- SkyDrake lock framing now includes grounded and takeoff poses, avoiding the former transition crop. Portrait touch framing also reserves space for the existing controls when locking Chomp or Stormbelly. Camera collision, orbit input and pause behavior remain active; projection resets on unlock, dialogue and landscape resize.
- Portrait HUD meters, target/boss bar and objective are separated without removing information or controls. Full-page screenshots include actual HUD updates and target bars; mesh-bound checks alone had missed UI occlusion.
- The reduced trio is integrated into an isolated complete static release package, with production asset paths. Accepted Chomp checkpoint 05 and Stormbelly checkpoint 08 assets are unchanged; SkyDrake 15 inherits the accepted shoulder repair from 14. The original content and fallback models remain available.

## Evidence and test scope

Final reports live under `skydrake15/review/`. Tests use fresh browser profiles and local files only.

- Aggregate: 500/500 runtime/repair checks, full/reduced × desktop/mobile-sized touch emulation.
- Actual complete release package: 250/250 checks, reduced trio at desktop and portrait sizes.
- Repeated flow soak: 680/680 checks, four profiles, 40 encounter/travel cycles and 40 same-profile save/reload/continue cycles. This is 20 minutes of accelerated encounter simulation, not a wall-clock playthrough. Attacks were interrupted twice per cycle; actual pause/dialogue ticks, waystone travel, keyboard movement, focus reset and saved progression were exercised.
- SkyDrake encounter/regression: 112/112; delayed, failed, corrupt, incomplete and timed-out loading: 70/70. Combined trio loading has a separate report.
- Gait: 18 scenarios/rates and 162 checks. Camera lifecycle: 13/13; portrait HUD/projection/rotation: 20/20.
- Gameplay review: 18 full/reduced character/viewport runs, 198 actual full-page screenshots. All 1,080 sampled creature bounds fit the viewport. This is a controlled lock encounter, not proof every free-camera position or occluded wall encounter fits.
- Matched front/side/back/three-quarter comparisons use actual supplied reference pixels and actual renders. Three curated boards include remaining likeness limits. Additional matched hip/clay and ordinary/transition pose screenshots document checkpoint 14→15 deformation.
- Root local-only `serve.cjs /?qa=1` remains separately verified 61/61. QA scripts are not packaged in release `dist`.

The original charge fixture intermittently assumed an unobstructed lane while a randomly placed Wardling legitimately separated the charging Rex. Seed 2 reproduces this on the unchanged baseline. `runtime-suite15.js` confines only that assertion to an unobstructed test lane and restores positions afterward; production combat and the original QA file are unchanged. Diagnostic and original failing results are retained.

One later aggregate attempt encountered incomplete chapter initialization (`ending`/`zones` errors, followed by a missing pillar fixture). The diagnostic rerun and actual release-package suites pass. The failed report is retained as `aggregate-intermittent-collision-15.json`; its initiating load failure has not been conclusively reproduced or repaired. Do not treat a fresh passing rerun as proof this intermittent issue is eliminated.

No physical phone/controller testing, hardware FPS certification or full playthrough is claimed. Resource counts fluctuate with loaded scenery and return to their starting counts by cycle 10; this is not a comprehensive leak proof. Isolated encounter clear/rebuild tests retain stable GPU counts.

## Asset and delivery limits

Reduced trio: 91,540 triangles and 18,425,668 GLB bytes, versus full 164,764 triangles and 21,823,164 bytes. Both variants estimate 110,100,480 bytes decoded RGBA texture storage before mipmaps, driver copies, world assets and fallback models; mobile GPU memory remains a risk to measure on actual hardware.

Supplied references are present for all three characters and were inspected as pixels. Broad silhouette/palette and identifying features are represented, but muzzle shape, wrinkles, tooth placement, surface detail and some extreme deformation remain approximations. Curated boards state these limits; they are not a claim of exact reproduction.

Library batch upload was attempted once with the current skill helper and all three ordered boards. It stopped before preparation with `Library prepare_uploads is not available` on this execution host. No Library upload was confirmed, and no alternate write path was used. The finished PNGs and provenance JSON are in `skydrake15/review/boards/`.

Live Site was rechecked at 06:39 UTC: version 7, active, custom audience containing one owner, no groups and zero external visitors. URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site . This URL still serves the previous published version.

## Run and rollback

From the project root: `node art/overhaul/scripts/serve_release15.cjs`, then `http://127.0.0.1:4323/`. The server is local-only and is stopped after verification. Root `dist/` is the preserved prior state. Checkpoint 14 rollback commit: `04ba416f819ef7f4da19113fc5cdea59e64f2d1c`; accepted checkpoint 12 fallback: `4b80fab92c6060128509d9ba2e303290c0501162`.

Release manifest, verification summary and exact asset hashes accompany this checkpoint. Publication remains deferred by instruction; Library saving and the unexplained initialization failure remain open items for the parent review.
