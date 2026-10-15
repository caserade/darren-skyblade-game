# Stormbelly checkpoint 08 — pursuit and interruption repair

Work resumed from checkpoint 07 (`9f05e88658d59d12be7ba7b8b65c251ecada176b`) at 02:11 UTC on 15 October 2026. This checkpoint remains local on `asset-overhaul-2026-10-14`. No new content, encounter logic, save format, engine, audience or publication change.

## Verified changes

- Rebuilt the existing heavyWalk lower-body keys around the unchanged 1.65 m/s pursuit speed. The source action remains 1.5 seconds; measured travel drives its phase at a nominal 0.9-second walking cycle. All 33 bones and 13 original action names/durations remain.
- Added instance-local visual foot placement to the candidate adapter. Planted feet retain world position and heading; swing steps shorten during turns. Starts, two pursuit turns, turning without translation, stops and resumes are exercised through the actual `updateEnemy` function. Stop settlement uses the existing walk pose, then returns to idle with feet supported.
- Lowered the walking stance to keep the longer step within the existing leg lengths. Corrected the resulting tail dip by rotating the existing tail base by at most 3.91 degrees in heavyWalk. No geometry, textures or rest silhouette were changed from checkpoint 07.
- Fixed duplicated recoil: the procedural prototype's whole-body pitch/squash was being applied on top of the skinned stagger action. In the new pursuit-to-stagger test it put the tail 1.43 m below the floor. The rig now owns its authored recoil; gameplay knockback, damage, state timing and collision remain unchanged.
- Restored the previous authored leg pose before each animation mix. Three.js skips unchanged property writes, so leaving the prior foot correction in place could contaminate constant attack channels. This caused a measured 7.38 cm foot dip during stompImpact; the repair removes it.
- Added brief supported-foot correction across action blends and validation for the lower-body bones required by foot placement. The existing fallback, retry, disposal and late-load behavior remains tested.

## Evidence and scope

`heavyweight/review/gait-08/` contains six 3-second scenarios for both full and reduced meshes: straight pursuit, stop/resume, two pursuit turns, stationary turns, pursuit into stomp, and pursuit into stagger. Each uses actual 60Hz game updates in a fresh isolated profile. Feet are sampled every tick; all vertices are checked every sixth tick. Reports bind both asset SHA-256 and adapter SHA-256.

- Straight travel is still 4.950 m in 3 seconds. Stop/resume travel is still 3.300 m; stationary turns travel 0 m.
- Straight planted toe/claw p95 speed is below 0.000002 m/s, compared with checkpoint 07's near-ground toe median of 1.363 m/s. These are deliberately distinguished metrics: the older report did not classify planted phases. The same near-ground diagnostic now has a near-zero median, but its p95 still includes moving swing samples within 4.5 cm of the floor; it is not claimed zero.
- Pursuit turns and stationary turns also keep planted toe/claw p95 speed below 0.000002 m/s. Maximum sampled planted speed is below 0.000003 m/s. Targets remain reachable; the largest transition target error is about 0.00010 m.
- No sampled foot or all-vertex floor penetration remains in the six full/reduced scenarios. Full-mesh minimum is about 0.01666 m; reduced-mesh minimum is about 0.01637 m. Sampling is not proof of every possible terrain/encounter combination.
- 22 integration checks, 61 existing runtime checks and 70 loading/interrupted-save checks pass. The 12 gait scenarios add 96 assertions. Actual `serve.cjs/?qa=1` separately passes 61/61 in a fresh Chromium profile.
- Local CPU microbenchmark (one full-mesh enemy, rendering excluded): median updateEnemy time increased from 0.00833 ms with the checkpoint-07 adapter to 0.03750 ms with this repair; p95 batch-average was 0.04833 ms. This is a measured animation CPU cost increase, not a GPU/hardware-FPS result. The same current mesh was used for both adapters.
- Byte-level scope audit against checkpoint 07 confirms identical geometry accessors, texture bytes, and all twelve other animation actions; only heavyWalk animation data changed.
- Both GLBs pass structural/texture/weight audits. All 13 clips pass 41 all-vertex samples per clip and a separate 21-time smoke review. Full/reduced triangles remain 56,852 /31,268; each has one draw primitive and three embedded 2048 textures.

Visual evidence: `Skyblade-Stormbelly-review-08.png` combines actual supplied turnaround pixels, private-v7 model, checkpoint 07/08 views, and game-motion comparisons. `Stormbelly-*-08.gif` are four 3-second replays at the simulated gameplay timing, captured at 10 fps. Full-resolution source frames remain locally available and reproducible; boards, GIFs, reports and selected interruption frames are versioned.

## Gate decision and remaining limits

**Scoped pursuit/contact/transition gate: PASS for the tested local candidate.** The measured checkpoint-07 foot glide and the newly exposed interruption defects are repaired. This is not an assertion of exact final reference art or universal animation correctness.

Fine neck/cheek folds, nostril shape, precise spot clusters, wing detail and idle tail orientation remain reference approximations. The static shape is unchanged from checkpoint 07: front width/height .7317 versus reference .6991, with projection differences. Residual extreme local edge deformation remains (death maximum 5.213x, p99 1.448x; authored heavyWalk maximum 4.375x, p99 1.543x). These limits are retained explicitly; they are not concealed by the contact pass.

No physical controller, phone, hardware FPS, full playthrough or continuous-terrain coverage is claimed. SkyDrake remains unstarted in this checkpoint. Chomp checkpoint-05 asset and all `dist`/hosting files are unchanged.

## Exact deliverable and rollback

- Full GLB SHA-256: `b8bcc310d618c5b21b8e3063c1746ceb0d25e105c9f1af4ba83bc62fa31a0121` (9,531,784 bytes).
- Reduced GLB SHA-256: `a1f6cf908af76a9fae755a60087d2744714e0b00ab6f1a2eed79c21a927f07fb` (8,161,560 bytes).
- Final adapter SHA-256: `4f83bf031bbdd37b1e9eb3f1898c4626811dfc3e26358d7b9bfba67526fee5a1`.
- Deterministic authoring input: `heavyweight/source/heavyweight-pre-gait.blend`, the checkpoint-07 source. Run `repair_heavyweight_gait.py`, then `export_heavyweight_lod.py`; do not run the old import/rebuild pipeline over this checkpoint.
- Previous local rollback: checkpoint-07 commit above. Live rollback tag: `asset-overhaul-baseline-v7` at `20da43808501ece80ef7a72a7966f7bd68c68ba2`.
- Site project: `appgprj_6acf0e7886908191820064ec6fa5afa0`. Verified active version 7, custom owner-only access, one owner, zero groups and zero external visitors. No push, version save, deployment or access mutation occurred.
- Playable live URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site (unchanged private v7; this Stormbelly candidate is not live).

The combined comparison was saved to Library as `Skyblade-Stormbelly-review-08.png`, Library ID `libfile_0a0061b8192c8191b092444daf7ce280`, file ID `file_000000009d4881f58f7737bbfed6a85e`, version 0. Windows does not support the helper's os.setxattr call; the upload succeeded and its identity is retained in checkpoint-08-library.json. The verification manifest and Library receipt accompany this checkpoint. Final commit identity is reported with the checkpoint handoff.
