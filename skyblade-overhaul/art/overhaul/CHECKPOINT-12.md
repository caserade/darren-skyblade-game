# Checkpoint 12 - SkyDrake surface repair and documented shoulder limit

Local continuation begun **2026-10-15 04:13:51 UTC** from checkpoint 11. The retained result improves the ventral plates and upper-haunch scales. **The shoulder correction is not resolved, and the scoped quality gate is not fully met.** No new content, runtime behavior, engine change or publication.

Rollback: `61d60cbb28989c5aa50b75582bcfc6b51a539b34`. The final handoff identifies the commit containing this report. Source: `C:/Users/caser/Documents/Codex/2026-10-14/task/skyblade-current`, branch `asset-overhaul-2026-10-14`. Previous checkpoints, other characters, `dist`, `.openai` and the original Downloads source remain unchanged.

## Retained surface work

- Removed the old narrow ventral grooves by smoothing shared vertex positions, then rebuilding shared area-weighted normals. The old imported normals retained groove shading after texture-only changes; that was a second cause of the doubled-line appearance.
- Repainted the ventral strip with broader, gently curved plates and a cubic outline, using the same object-space field across every UV chart. Removed the old pale fringe within the affected strip. No texture-derived displacement is used.
- Added restrained overlapping scale rows on the upper outer haunches, informed by the supplied concept. Other skin detail remains largely original. These rows are an approximation, not individually sculpted reference scales.
- Baked full and reduced meshes separately. Reusing the full bake after decimation produced wavy plate lines; evaluating the same design on the reduced UV-to-surface correspondence corrected that visible problem.

Both `art/references/concept_skydrake.jpg` and `skydrake_model_sheet.jpg` were inspected directly. The concept is the design authority; the model sheet includes older renders. No reference was missing or invented.

## Shoulder findings and rejected work

The supplied generator makes a smooth-union torso/chest/shoulder/upper-arm surface. Its broad bridge under the upper arm lacks a deliberately shaped armpit deformation region. Forearm influence extends into that junction, but a targeted proximal redistribution alone made too little visible improvement. A shallow rest-space recess with corresponding torso weights produced a pinched, dangling shape beneath the raised arm in the matched attack view. It was rejected.

**All full-mesh body weights and the posterolateral shoulder positions are restored to checkpoint 11.** The final attack maximum edge ratio remains `5.643x`; this checkpoint makes no claim of a shoulder stretch fix. Some other diagnostics change because the belly surface was smoothed, but lower numbers are not the visual acceptance criterion.

The next meaningful correction needs targeted shoulder/axilla retopology and pose-specific sculpt/weight validation while keeping the existing rig. That was not achieved within this bounded pass. See [rejected experiments](skydrake12/review/rejected-experiments-12.json), [rejected shoulder pose](skydrake12/review/rejected-shoulder-recess-attack.png), and [visual gates](VISUAL-GATES-SKYDRAKE-12.md). Repeating broad weight diffusion is not recommended as a substitute.

## Exact artifacts

| Artifact | SHA-256 | Bytes / triangles |
|---|---|---|
| Full GLB | `5271c3fc3717b9e394adf0312a4439a7af2d65791d3e9ed985c59b878e7781f9` | 3,589,788 / 43,057 |
| Reduced GLB | `5aeeb07f4bb1d98f8a88050ce78e1ed405332c81d112e52e3d239aa4ccc03cba` | 2,985,628 / 24,542 |
| Local adapter | `43b412abdd529dd2b66eb3da89bd2b2233d66eed08aab096225b1a206d013af2` | `scripts/skydrake-local-adapter12.js` |

Both variants retain 39 bones, 14 original clips and 11 draw primitives. Full geometry has the same triangle count; reduced adds one triangle relative to checkpoint 11. Files grow by 289,740 and 290,288 bytes respectively. Both still use two 1024px maps. No FPS improvement is claimed. Lossless PNG masters and quality-96, 4:4:4 JPEG delivery maps are retained beside the editable Blends.

## Verification

- **469 runtime/motion assertions:** 112 gameplay, 70 loading/save, 10 flight-cycle, 10 actual preview, 61 existing local QA, 162 gait, 18 player-camera pursuit, 24 combat-camera and two wing-continuity assertions.
- **148 structural checks**, **23 targeted surface/rig checks**, and **78 hash/provenance/scope checks**.
- Syntax validation passes for 15 JavaScript and six Python scripts.
- The targeted comparison verifies all 1,638 authored animation tracks, bind matrices, bone names, full-body weights, 2,666 unique lower-leg vertices, and all ten non-skin primitives against checkpoint 11. Wings and dorsal spines are unchanged. Maximum separation of formerly coincident UV-seam corners is zero. Each bake matches the exact geometry of its final export.
- The adapter is identical to checkpoint 11 after namespace normalization. Gait tests cover seven scenarios for both sizes at 60 Hz and straight pursuit at 30/120 Hz. Straight pursuit remains 6.9 units over three seconds. These are simulation rates, not device FPS measurements.
- Repeated/interrupted flows cover the existing warning/damage/dodge windows, pause/dialogue, death cleanup, respawn, chapter return, reload/continue, failed/corrupt/incomplete/delayed/timed-out loads and save-recovery backups in isolated profiles. Six encounter/cleanup cycles per size remain at 80 geometries / 14 textures in the test scene.
- Actual `serve.cjs /?qa=1` and the candidate preview server both pass. The first localhost browser attempt was blocked by sandbox networking; the scoped escalation was approved and the real-server checks then completed. No publication approval was requested or attempted.
- Visual evidence includes four matching angles for each size, 24 matched close-up poses, 50 authored-motion views, and six actual game-camera combat runs with a fixed scenery seed. Baseline/full comparison frames have identical recorded enemy and camera transforms.

Coverage is Windows headless Chromium with isolated saves/profiles. No physical controller, phone, device performance or full-playthrough claim.

## Remaining visible limits

The shoulder bridge still pulls in raised-arm attack close-ups. Lower-belly facets/tonal unevenness, the regularity of the procedural scale rows and the existing organic shape approximations remain below final concept fidelity.

In the controlled ordinary lock-on combat flow, the high portion of the swoop moves above the frame in **both** checkpoint 11 and 12. Late-swoop frames expose the raised-arm pose. This is a separate existing camera-framing limit; no camera code was changed. Ground tail-attack views and late-swoop views are included in the comparison rather than claiming that an offscreen model was visually verified.

## Review and private Site

[Comparison sheet](skydrake12/review/SkyDrake-checkpoint-12-comparison.png) and [24-pose sheet](skydrake12/review/SkyDrake-checkpoint-12-poses.png). The comparison is saved in Library as `libfile_81d895baf8f48191bf60a05ceaced69f`, version `0`, filename `SkyDrake-checkpoint-12-comparison.png`. The receipt is retained in `skydrake12/review/library-receipt-12.json`. The Windows helper could not apply local extended attributes because `os.setxattr` is unavailable; that does not affect the successful Library upload.

At **04:27:30 UTC**, project `appgprj_6acf0e7886908191820064ec6fa5afa0` remained active **version 7**, custom access, one owner, no groups and zero external visitors. [Playable live Site](https://darren-skyblade-reach.gosplekaiju.chatgpt.site) remains unchanged. No push, saved Site version or deployment was attempted. Publication remains on hold for integrated cast review, and this report does not mark the shoulder gate complete.

Local preview: `node art/overhaul/scripts/serve_skydrake12.cjs`, then `http://127.0.0.1:4321/` or `?variant=full`. The preview injects the candidate adapter in memory, uses a separate storage origin and does not edit `dist`. Verification servers were stopped. Reproduction details are in [the candidate README](skydrake12/README.md).
