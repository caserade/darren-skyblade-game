# SkyDrake22 — localized deformation checkpoint

This follow-up begins from Candidate21 commit `1e1975ffe83fb636dab097553ee662c00a324eff`. The isolated playable source is `final-local-candidate22/release/`, using existing project `appgprj_6acf0e7886908191820064ec6fa5afa0`. Only `dist/assets/skydrake-rc15.glb` differs from Candidate21. No engine, content, gameplay, HUD, controls, save-schema or hosting changes. Publication remains held; the live Site has not been updated by this pass.

## Diagnosis and accepted repair

The supplied `art/references/concept_skydrake.jpg` and `skydrake_model_sheet.jpg` were inspected as pixels. Existing close-up poses and deformation reports showed abrupt neighboring neck/chest weight changes, including arm influence entering the upper neck, plus steep shoulder-patch transitions. Three bounded weight-only trials were compared from the same accepted SkyDrake15 assets. No image generation, invented reference or animation replacement was used.

**Only reduced trial C is accepted into the playable package.** Localized diffusion across the existing skin/shoulder surface and tapered removal of upper-neck arm contamination smooth the visible neck-to-shoulder motion. On the reduced mesh, maximum attack-region edge stretch falls from 4.1773 to 1.9457; neck maximum falls from 2.8552 to 1.6713. All 14 clips improve regional maximum, neck maximum and regional P99 stretch. Peak counts of triangles below 10% rest area do not increase. Tail-whip peak compressed count falls from 12 to 6, and tail-windup from 9 to 2. This improves rather than eliminates deformation.

The raw GLB audit permits changes only to joint and weight accessor bytes in the body/shoulder mask. Rest positions, topology, normals, UVs, textures, material definitions, 39-bone rig and 14 clips remain byte-identical. Welded seams share identical weights. The accepted reduced editable Blender file reopens with packed images and weights matching the export within floating-point tolerance.

## Full-resolution experiments are not accepted

Full trial C improves neck stretch but introduces a compressed turn triangle and small local flight-region regressions. Full trial A avoids those particular issues but adds one compressed stagger triangle (peak 2 versus 1 baseline) and increases the tail-whip neck maximum by about 0.12%. Trial B spreads influence too far and is rejected. These are retained as clearly labeled experiments for reproducible diagnosis, **not accepted full-resolution art** and not included in the playable ZIP. The accepted full-resolution fallback remains SkyDrake15. `skydrake22/STATUS-22.txt` makes this distinction explicit.

The initial final-verification report that rejected the full-resolution candidate is preserved as `review/full-candidate-rejection-22.json`. The final verification checks the stricter no-regression criterion on the actual reduced package and explicitly checks that the full trial is not promoted. No production criterion was silently relaxed.

## Verification and visual evidence

- Exact Candidate22 package: 250 gameplay/repair checks, 340 repeated-flow checks, 320 startup/recovery checks across 28 scenarios, plus 8 normal-frame-loop keyboard/pause/resume checks. Fresh isolated profiles; existing user saves were not touched.
- Both diagnostic variants: 18 gait scenarios and 162 checks; six production-adapter combat runs and 24 checks, with 198 matched gameplay screenshots. Full-resolution results are experimental evidence, not approval of that asset.
- Final selected trials and their baselines: 2,296 sampled poses across all authored clips. The playable variant passes all regional peak/P99 and compressed-triangle comparison gates.
- Actual screenshots were inspected: three-angle 14-pose contact sheets, textured and clay close-ups, full-body reference views, controlled ground/flight gameplay and a normal-frame-loop full-page screenshot. Curated images and original reference hashes are recorded in `visual-review-22.json` and `boards/board-provenance-22.json`.
- Extracted ZIP startup runs through its own included launcher, reaches Chapter1 through the actual Start button, serves the expected SkyDrake hash, and reports finite player coordinates with no page execution errors.

No physical phone/controller, full playthrough or hardware FPS claim. Geometry/image/bone counts and runtime code are unchanged; this is not a measured mobile GPU benchmark.

## Remaining likeness and practical limit

SkyDrake still differs in protruding eye whites, eyelid/muzzle shaping, thin simplified wing membranes, tail profile, shoulder texture seams and extreme elbow/hip creasing. Chomp's broad muzzle/forehead, wrinkles and tooth spacing, and Stormbelly's eye expression, lower jaw/lip shaping and surface grooves remain approximate. Chomp19 and Stormbelly20 were preserved exactly, not edited again.

A useful next art step is a sculptor-led face/silhouette pass with deliberate joint topology and fresh color/normal bakes, assessed against all supplied views. Further broad weight diffusion is not a substitute: the rejected trials demonstrate the pose tradeoffs. No missing reference is claimed; the limit is the current mesh/bake approximation and the need for authored shape work. The existing accepted assets remain available for any future artist-led replacement review.

## Deliverables and identity

Portable ZIP beside the project: `Skyblade-Final-Local-Candidate22.zip`, 77 files, SHA-256 `2d108edbda82202c79920ec2b4074e0500aa9a088eb370a9121f1fc5c59e0ccc`.

Manifest SHA-256: `540393857aa94ff0aabb6d7cc8104bc50837845216cf43ae891337de0935606e` (46 files plus manifest). Accepted reduced SkyDrake SHA-256: `9fd180b983d07638dbbb224ccc18d1d42d1fd6ff4453f1c763b0ca841ace5c3e`.

`Skyblade-Candidate22-Report.pdf` beside the project contains the concise report and three boards: deformation, reference/silhouette, and gameplay. The exact final commit and post-commit byte audit are recorded in `Skyblade-checkpoint22-receipt.json`.

Extract ZIP into a new folder, run `node serve.cjs` with Node.js installed, and open `http://127.0.0.1:4329/` in a separate browser profile. Stop with Ctrl+C. Do not open index.html directly. Candidate21 ZIP and its source remain unchanged as the tested fallback.

Library was not retried without new capability evidence. The supported helper's last attempt at checkpoint21 failed before preparation: `Library prepare_uploads is not available`. No direct upload route or approval bypass was used. Publication is held by instruction, not an automatic approval rejection. Existing live URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site .
