# Checkpoint 10 — SkyDrake ground contact and reference proportions

Phase began 2026-10-15 03:15:25 UTC. Local, unpublished continuation of checkpoint 09. The commit containing this document is the checkpoint; its exact SHA is in the handoff. Rollback: `3fcb8457422b9212383b4dce3e452cec79620b91`. Stormbelly checkpoint 08, Chomp, checkpoint 09, `dist` and `.openai` remain unchanged. No new game content or engine migration.

## Verified repairs

- Replaced the candidate's sliding ground playback with travel-driven foot placement. The existing 39-bone rig uses planted ankle/toe targets, a short swing arc, shorter turning steps and sequential stop settling. Authored leg poses are restored before the mixer runs, so placement does not leak into flight, attacks or later instances.
- Smoothed the visual crouch through interruption and resumption. A detected tail dip when stagger returned to pursuit was repaired and retested. Gameplay position, collider, pursuit speed, turn speed, damage windows and save data remain owned by the existing game.
- Reduced distant leg/hip influence on arm geometry using a continuous weight mask with welded seam consistency. The worst attack edge stretch falls from 9.518x at checkpoint 09 to 8.430x; hit 6.567x to 4.570x; death 4.860x to 4.046x; turn 4.746x to 3.472x. This improves, but does not close, extreme deformation. Fly/land/tail-whip maxima are somewhat worse; see the open gates.
- Matched supplied concept proportions more closely with broader feet and haunches, a narrower forward belly, shorter segmented horns, curved wing panels with raised tips, and a volumetric tail arrow visible in profile. Both actual supplied images were inspected: `concept_skydrake.jpg` is the primary design authority; `skydrake_model_sheet.jpg` is the supplied secondary model sheet. These are measured-direction approximations, not final art approval.
- Retained the original color/normal atlas after rejecting a broad-belly-band experiment whose double grooves and patchiness worsened the render. Broad plates and scale style remain unfinished.

## Exact deliverables

Source: `C:/Users/caser/Documents/Codex/2026-10-14/task/skyblade-current`, branch `asset-overhaul-2026-10-14`. Editable Blender files, original supplied GLBs and generator copies: `skydrake10/source`. Original source in `C:/Users/caser/Downloads/Darren-Skyblade/Darren Skyblade Game` was not modified.

| Deliverable | SHA-256 | Size / geometry |
|---|---|---|
| `skydrake10/export/skydrake-candidate.glb` | `ab4715bb24458fd842e93387b9baf0a32b07c59b21dd28eca7d75ebd40cfe9da` | 3,285,236 bytes / 42,617 triangles |
| `skydrake10/export/skydrake-lod.glb` | `9848b6de5552900937201f619d6c0c2ce4ca8d152f71eb13595f5b1279d0a98d` | 2,687,120 bytes / 24,290 triangles |
| `scripts/skydrake-local-adapter10.js` | `be7b07febea2f858a80b60a83e0f4a79b9a1989989582b6a1e70c97f97374039` | Local in-memory integration |

Both sizes preserve 39 bones, 14 clip names and all original authored clip durations. Both render in 11 draw calls. Geometry increased slightly from checkpoint 09 (159 full / 89 reduced triangles); no across-device FPS improvement is claimed.

## Verification

**425 runtime assertions, 148 structural checks and 62 provenance/scope checks pass.** Reports in `skydrake10/review` bind to the exact export and adapter hashes above.

- 56 gameplay checks per size: 112. All actions, warning/hit/dodge timing, pause/dialogue, death cleanup, den respawn, chapter return, interrupted transitions and independent cloned skeletons. Six encounter/cleanup cycles per size remain at 80 geometries and 14 textures in the test scene.
- 70 delayed/failed/corrupt/incomplete/timed-out loading and save checks. Isolated browser profiles and save sentinels; reload/continue and recovery backups. Original visible model remains the fallback.
- 10 checks across actual 600-frame full/reduced encounter cycles; 10 through the real candidate localhost server; existing real `serve.cjs /?qa=1` 61/61.
- 162 gait assertions in 18 runs: seven three-second scenarios per size at 60 Hz (straight, turning, stop/resume, stationary turning, tail attack, stagger, takeoff), plus straight pursuit per size at 30 and 120 Hz. `pursuit-stomp` is a legacy diagnostic label for SkyDrake's existing tail attack, not new content.
- Straight travel remains 6.9 units in three seconds at every tested rate (2.3 units/second). Worst planted rigid-claw horizontal p95 is 0.00000160 units/second; worst planted height range 0.001115 units; sampled grounded mesh minimum +0.000953. Stop/resume settles to idle. This validates the sampled flat island floor, not arbitrary terrain IK.
- Full/reduced flight-to-land cycles have sampled grounded minimum +0.003 and maximum visual floor correction about 0.1683. Raw authored landing still needs correction; collider and damage windows are unchanged.
- 41 samples of all 14 clips per size contain no nonfinite geometry. 50 rendered motion views and same-camera front/side/back/three-quarter comparisons retained. Actual scene flight/landing and matched-time ground screenshots were visually inspected.
- Windows headless Chromium only. No physical controller, phone, full-playthrough or device FPS claim. Frame-rate tests are simulation-step checks, not display performance benchmarks.
- A short identical straight-pursuit update-cost probe measured checkpoint 09 full at 0.4 ms median / 0.7 ms p95, checkpoint 10 full at 0.5 / 1.0 ms, and checkpoint 10 reduced at 0.4 / 0.8 ms. These noisy local CPU samples exclude rendering and show the contact solver has a cost; they do not establish an FPS improvement. Twelve JavaScript and six Python files pass syntax checks.

## Visual evidence and remaining work

[Comparison](skydrake10/review/SkyDrake-checkpoint-10-comparison.png), [motion contact sheet](skydrake10/review/SkyDrake-checkpoint-10-motion.png), [visual gates](VISUAL-GATES-SKYDRAKE-10.md).

Comparison saved to Library: `SkyDrake-checkpoint-10-comparison.png`, **`libfile_03f22710d9a08191b466df27f07fbdc0`**, version **0**, file `file_00000000956081f8ae0d3e16c2313d95`. Library upload succeeded. Windows extended attributes are unsupported; the local receipt preserves the identity. Board shows supplied concept pixels, checkpoint 09 and checkpoint 10 full/reduced matching views, and actual game-scene evidence.

Open: shoulder/hip extreme skin deformation; broad clean belly plates and fine scale style; organic wing folds and rib endpoints; fuller dorsal-spine cross-sections; remaining neck/face/tail proportions. The unchanged 16-tick defeat removal window limits death readability. Final art and integrated cast review are still pending.

## Publication and local play

Read-only Site check at **03:35:34 UTC**: exact project `appgprj_6acf0e7886908191820064ec6fa5afa0`, active **version 7**, custom access, one owner, no groups, zero external visitors. [Playable live Site](https://darren-skyblade-reach.gosplekaiju.chatgpt.site) serves the unchanged live version, not this candidate.

Run `node art/overhaul/scripts/serve_skydrake10.cjs` and open `http://127.0.0.1:4320/` for reduced or `http://127.0.0.1:4320/?variant=full`. The adapter is injected in memory; the separate origin isolates local saves. Verification servers were stopped. No push, saved Site version or deployment was attempted, as requested pending integrated cast review. No approval block occurred.
