# Checkpoint 05 — Chomp root-cause repair and visual gate

Started 2026-10-15 00:30 UTC. Report generated 2026-10-15T01:00:51.076137+00:00.
Chomp only. Stormbelly and SkyDrake remain unstarted. The extended work deadline is October 15 at 13:00 UTC / 09:00 user-local.

## Decision

Chomp passes the scoped visual/runtime repair gate and is ready for the next roster phase. This is a reference-led runtime approximation, not a perfect reproduction or a claim of final hand-sculpted artwork. The remaining differences below are visible and explicitly retained; the blocking surface seams, jaw wedge, detached opening hinge and mouth-lining overlap are repaired.

## Root causes and concrete repairs

1. **Black slivers were empty UV coverage.** Raycasts at the eye, shoulder, jaw and hand sampled RGBA [0,0,0,0], while flat-white and normal-only views were clean. The checkpoint-04 audit found 343 UV islands narrower than two atlas pixels. Edge padding alone could not reach completely unbaked islands. The bake now expands narrow islands before repacking; final atlas coverage checks sample four barycentric positions per triangle. The final UV audit finds zero islands below two pixels in bounding-box width/height. The isolated UV-only before/after comparison uses identical mesh, camera and lights.
2. **Invalid eye-sphere pole topology.** Replaced coincident pole rings/degenerate quads with single pole vertices and triangle fans. The bake source validates without changes, and the prior invalid-mesh export warning is gone. Triangulation is fixed before UV baking.
3. **Angular cheek/underside and flat smile.** Raised the smile corners in the upper-head surface, graduated tooth size toward the rear, tucked rear crowns inward, and tapered the gold cheek into the chin. The jaw's lower rings previously scaled depth toward the rear hinge, folding the chin backward into a wedge; they now narrow across the jaw while retaining the lip's depth contour. A trial that added excessive cheek bulk was rejected after rear-view inspection.
4. **Opening jaw separated from the head.** The inherited retargeted jaw pivot was below the rebuilt smile corner. Moved the jaw rest pivot to the anatomical hinge, preserving the original animation curves and durations. Maximum increase in paired cheek/head surface-vertex distance fell from 0.3345 to 0.0245 model units across all 12 clips. This is a geometric diagnostic, not a claimed physical gap measurement.
5. **Mouth lining overlapped the revised jaw cap.** Aligned the lining with the inner jaw contour, raised it above that cap and corrected its face direction. Rechecked the wide-open bite/windup poses.
6. **No gameplay/content change.** dist changes only the Chomp GLB. Loader logic, combat data, engine, levels, save keys and audience remain unchanged in this checkpoint.

## Explicit gate assessment

| Criterion from VISUAL-GATES-CHOMP.md | Result | Evidence |
| --- | --- | --- |
| Fused brow | Pass | No detached pink strips or far-brow opening in reviewed four-view and bite/windup renders. |
| Cheek/jaw | Pass for scoped repair | Continuous gold cheek/chin, raised smile corners, no backward underside wedge or abrupt cheek cap, attached hinge through open-mouth poses. A few rear tooth edges remain visible in strict rear orthographic view; no exposed flat tooth-root ledge. |
| Neck proportions | Pass | Front width/height remains .469 versus reference .460. Width at 30% height is .171 versus reference .174. Runtime idle height 3.22220 is within 5% of the previous model. |
| Surface finish | Pass | Sampled empty texels corrected; no corresponding black slivers in the final close-up. Smoother anatomical gold mask, fine low-contrast relief, plum/gold/ivory palette retained. |
| No regression | Pass within tested scope | Final full and reduced exports validate, retained clips remain finite, repaired hinge stays within the regression bound, and all 147 runtime checks pass. |

**Likeness limits:** eye/nostril folds and small sculpted wrinkles remain simpler than the supplied image; spot placement and exact surface detail are approximate. A few rear tooth edges differ from the rear reference. The side width/height diagnostic remains 1.094 versus 1.015; reference pose/projection differs. Lighting differs, so sampled RGB medians are not a color-fidelity score. The supplied sheet does not show an open-mouth interior; the simple runtime lining is not claimed to match an unseen reference.

These are nonblocking approximation limits for this scoped runtime repair, not reasons to keep making undirected shape changes. Final roster integration still needs its cross-character regression pass.

## Final exact asset and verification

Source branch: asset-overhaul-2026-10-14.
Checkpoint parent: 6e8054b7faaccb91b21d1a3bc64c1af6c0e625dc.
The containing commit is reported in the checkpoint response.

- Full GLB / dist asset SHA256: e7c073466cd1980e7a6a11eb17207874ab2ce9966d802a03cdb90f79655f6957
- Reduced GLB SHA256: 8cfb431ed3bb8b27e6d101abcf67b5ca3aec21cf4f7599cc1e0783d2b48f3b09
- Supplied reference SHA256: 2ce54cd1c0a0ef7170cd5e1f7f92edbc8b42938fb6f16bbd299c76a59403b918
- Full: 61,789 triangles; 8,551,204 bytes.
- Reduced: 33,983 triangles; 7,188,588 bytes. This is a prepared export, not a new runtime LOD system.
- Both retain 29 bones, all 12 original clips/durations, one draw primitive/material and three embedded 2048 textures.
- Both pass valid indices/weights/UVs, unit normals, no zero-area geometry/UV triangles and atlas coverage checks.
- All final report hashes match the tested export and dist asset; see checkpoint-05-verification.json.
- 16/16 integration checks; 70/70 loading/retry/interrupted-save checks; 61/61 existing runtime checks.
- All 12 clips sampled at 21 times in both exports. Thirty additional motion views cover bite, bite windup, charge windup, stagger and death; actual pixels were reviewed alongside four-view, close-up, reduced-export and same-arena images.
- Repeated encounter cleanup retained stable GPU resource counts. Same-scene calls: 288 to 199; triangles: 121,491 to 120,828. These are workload measurements, not an FPS benchmark.
- Source/data JavaScript syntax checks passed; local server started successfully and was stopped.

Tests used isolated Chromium contexts and actual local dist scripts/assets fulfilled from disk. They did not access live saves. No physical controller, phone, manual full playthrough or device-performance coverage is claimed.

**Tradeoff:** the full GLB is larger than checkpoint 04's 6,743,772 bytes because of the corrected atlas coverage and surface bake. GPU texture dimensions/count are unchanged. Slow/failing downloads retain the tested original-model fallback; actual network download speed was not benchmarked.

## Deliverables

- Skyblade-ChompRex-face-comparison-05.png: libfile_9c47a5e4b93c8191afa0670b848968b9 (file_00000000aea081f5a01734920ef6a683, version 0)
- Skyblade-ChompRex-seam-repair-05.png: libfile_1c106f3f4c148191a4b30f62af42cbac (file_000000006a6081f59e7ac4a5a7a6c31e, version 0)
- Skyblade-ChompRex-motion-review-05.png: libfile_25e7f3b743408191ab7de72a4962fb84 (file_0000000065e481f5adcc6432c1de20cf, version 0)

Library creation succeeded. Windows Python lacks os.setxattr; helper application failed, so complete Library identities and returned xattrs are retained in checkpoint-05-library.json.

Local comparison boards, final renders, motion images, turntable, editable Blender scenes, textures, full/reduced exports and tests are under art/overhaul/chomprex. The root-cause folder preserves the UV isolation experiment and pre-hinge/underside evidence. Its intermediate captures are diagnostic and are not substitutes for the final-hash verification manifest.

## Publication, rollback and next phase

Live Site remains private owner-only v7: https://darren-skyblade-reach.gosplekaiju.chatgpt.site
Exact project: appgprj_6acf0e7886908191820064ec6fa5afa0.
Access checked 00:42:55 UTC: custom mode, one owner, zero groups, zero external visitors.
No publication was attempted during this checkpoint. The playable URL still serves the earlier v7 build.

Rollback remains asset-overhaul-baseline-v7 at 20da43808501ece80ef7a72a7966f7bd68c68ba2; checkpoint 04 is also committed.
No approval or tooling blocker remains for Chomp's scoped repair. Next is Stormbelly, then SkyDrake, using their actual supplied references and the same source/privacy/test constraints. Do not modify the other Darren projects.
