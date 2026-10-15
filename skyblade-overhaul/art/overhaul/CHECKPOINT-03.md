# Chomp Rex checkpoint 03 — October 14, 2026, approximately 23:59 UTC

Phase began 23:38 UTC. This is a safe continuation checkpoint, not final character approval. **Stay on Chomp Rex. Do not advance to Heavyweight/Stormbelly or SkyDrake yet.** The original three-hour overhaul window began about 22:56 UTC and ends October 15 at 01:56 UTC; the user authorized longer if needed. No new content or engine migration.

## Implemented and verified

- Refined the actual Blender mesh against the supplied Chomp turnaround pixels: narrower belly, hips, lower legs and neck; raised/shortened tail; thicker claws; smaller dorsal plates; a rounder muzzle, higher smile corners and larger gold cheek; inward eye placement, stronger brows and continuous forehead support. Adjusted authored plum/gold/ivory materials and rebuilt the three 2048-square texture atlases.
- Added `dist/src/chomprex.js` and `dist/assets/chomprex.glb`, with a single script inclusion after `skydrake.js`. This is local production integration only. Original definitions, damage, collision dimensions, timing, content data and save keys are unchanged.
- Loader validates the rig and required clips, caches one template, uses the original procedural model on pending/failed loads, handles 20-second timeouts and exponential retry, disposes rejected or late assets, and never replaces an existing encounter asynchronously. Automatic retries stop after four attempts; a later encounter can try again after cooldown. Clones share immutable mesh/material resources but own their skeletons and mixers.
- Measured idle visual height is 3.22113 world units versus the prior model's 3.24328 at the same enemy scale, within 0.7%. The comparison now uses both models' idle pose, the same arena and camera.
- Same-scene rendering in the final run: 290 to 201 draw calls, 121,827 to 116,992 triangles. These are renderer counters, not FPS or physical-device benchmarks. Resource counts remain stable across repeated encounter cleanup.
- Added a geometry guard for tail volume. QuadriFlow can return a watertight but collapsed appendage. This was caught in rendered pixels, rejected, and repaired. The final build rejected cancelled or collapsed results at .035/.0375/.040 and accepted .0425 after tail top/side-volume checks. Final body cage has 13,506 quads, no nonmanifold edges or vertices, at most four weights per vertex.

## Exact assets and source

Working branch: `asset-overhaul-2026-10-14`. The checkpoint commit contains this document. Prior checkpoint: `16dbfb8df151d417511fddb12f4be1d3fb7ab1b5`. Rollback tag `asset-overhaul-baseline-v7` remains `20da43808501ece80ef7a72a7966f7bd68c68ba2`.

- Full GLB: `art/overhaul/chomprex/export/chomprex-candidate.glb`, identical to `dist/assets/chomprex.glb`; 6,461,308 bytes, 57,617 triangles, 29 bones, 12 clips, one material/draw primitive. SHA-256 `cc31aa7d07f9ac562c2ad903f0bc4f24aa432d58a5dcf5bb752258cfa211ae48`.
- Optional authoring LOD: `art/overhaul/chomprex/export/chomprex-lod.glb`; 5,183,688 bytes, 31,689 triangles. SHA-256 `cef44f90ccb31ae8633a8deea8913eb051ebee46439542a3a682d431d0ddfa3b`. No new runtime LOD system.
- Editable Blender sources: `chomprex-overhaul-work.blend`, `chomprex-uv-bake-source.blend`, `chomprex-runtime-candidate.blend`, `chomprex-lod.blend`, under `art/overhaul/chomprex/source/`. Dense sculpt and original imported rig remain available there.
- Actual reference: `art/references/concept_chomprex.jpg`; original source at `C:\Users\caser\Downloads\Darren-Skyblade\Darren Skyblade Game`. No invented or unseen reference was substituted.

## Verification on this exact revision

- **16/16** focused production integration checks: unchanged definitions/content; independent skeletons; shared resources; original 48-tick warning, single-hit charge and recovery; evasion; pause/dialogue freezing; stagger/death cleanup; six repeated resource cycles; visual height.
- **70/70** production loading/save checks across delayed, HTTP failure, corrupt bytes, incomplete rig and timeout scenarios. Covers fallback warnings, deduplicated loads, successful retry, no stale encounter resurrection, preserved saved bytes/unrelated storage, interrupted chapter change, repeat continue, new-game recovery backup and browser reload/continue.
- **61/61** existing runtime regression checks pass, including original chapter/adventure progression, natural Chomp spawn and combat flows. Fresh isolated browser contexts only.
- Full and LOD each load/render through the game's bundled Three.js r128. All 12 clips sampled at 21 points, with finite sampled skinning and no page/WebGL errors. Original clip durations retained within 1e-6 seconds. All GLB structural checks pass: indices, UVs, normalized weights, valid joints, decoded embedded textures.
- Full/LOD game and probe reports include asset SHA-256. `glb-validation.json`, `game-integration-report.json`, `production-loading-report.json`, `existing-runtime-qa.json`, `candidate-three-report.json` and `lod-review/candidate-three-report.json` hold evidence.
- Final full-mesh foot-contact extrema include walk .01298–.02937, charge -.00135–.04185, windup -.00198–.03636 model units. Tiny contact excursions are recorded, not concealed; death motion remains intentional.
- JavaScript syntax checked. `node serve.cjs` started successfully. Browser harness fulfilled actual local files from disk because loopback network access is restricted. No physical controller, phone, sustained FPS benchmark or full manual playthrough coverage is claimed.

## Visual evidence and open gate

`review/Skyblade-ChompRex-overhaul-checkpoint-03.png` contains actual supplied art, four actual exported views, and before/after local gameplay captures. Updated turntable GIF and six pose captures are also present. Full and LOD three-quarter views, full front/back/side and windup/bite poses were inspected.

Library comparison saved successfully:
- `libfile_8381a08d0db88191ae7233b1b13c405f`
- `file_000000005a4881f5a5004443baec8548`, version 0
- `/Skyblade-ChompRex-overhaul-checkpoint-03.png`

Windows has no `os.setxattr`; the upload succeeded and its identity is preserved in `review/checkpoint-03-library.json`.

`review/reference-overlay-current.png` and its metrics use uniform height scaling and foot alignment, not nonuniform fitting. Front total width/height is now .469 versus reference .460 (checkpoint 02 was .540). Side is 1.094 versus 1.015 (checkpoint 02 was 1.169). Reference poses/projection differ, so these measurements are diagnostic rather than a likeness score.

**Likeness gate is still open.** The brow/forehead transitions remain too visibly constructed, the cheek/jaw backs show abrupt transitions in the rear view, and surface/tonal treatment still differs from the reference's softer sculpt. The neck/head relationship and lower-leg spacing also remain visibly different despite the improved total silhouette. Continue focused facial/transition/material refinement and rerun affected visual/rig checks. Do not call this an artist-final sculpt or advance simply because runtime tests pass.

## Live Site and boundaries

Rechecked around 23:52 UTC: exact project `appgprj_6acf0e7886908191820064ec6fa5afa0`, live version **7**, custom access, one owner, zero groups, zero external visitors. No remote commit, new Site version or deployment was made in this phase. Live URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site . `.openai/hosting.json` remains unchanged. Preserve v7 until a verified replacement is ready. No authorization or publication approval block occurred.

Unrelated Darren Dynasty Warriors, Snowday Search and FAU were not modified. Stormbelly/Heavyweight and SkyDrake authoring has not begun in this continuation phase.
