# Checkpoint 06 — Stormbelly reference-led source and technical repair

Work began 2026-10-15 01:03:18 UTC. Checkpoint prepared approximately 01:38 UTC.
Source branch: asset-overhaul-2026-10-14. Parent commit: 8daf67441da29c813a5d709f151dd9b33e63d266.
The containing checkpoint commit is reported in the handoff.

## Decision

Technical export and local runtime gates pass. **Visual/motion completion remains pending.** This is a substantive editable candidate, not a final production asset or a claim of perfect turnaround reproduction. Continue Stormbelly before SkyDrake. Chomp checkpoint 05 is preserved byte-for-byte; dist and hosting configuration have no changes in this phase.

## References and source

Inspected actual pixels in:
- art/references/concept_heavyweight.jpg — SHA256 c5d7840e646a474895f84321a01b5d9b1a2d5ade559ddd69257aceac0e1fcb81
- art/references/heavyweight_model_sheet.jpg — SHA256 c321cad129d6b127e57853a379c67f11b12fe2e9a0e74cea403ae5ef980c95ee

The upper supplied turnaround is authoritative. Prior model images lower in the sheet are historical comparison only. No required Stormbelly turnaround is missing. Open-mouth interior is not shown and is not claimed to have been reference-verified.

Imported supplied-heavyweight.glb from the existing Darren Skyblade Game folder under Downloads; preserved its 33 bones and all 13 existing actions. Editable work, UV bake source, runtime scene and reduced scene are under heavyweight/source. Geometry/material authoring uses reproducible Blender Python scripts and stored Blender scenes; it is not described as hand-sculpted final art.

## Concrete changes and diagnosed defects

- Built a fused body/head/neck/limb/tail surface with articulated jaw, tapered horns/tusks/claws, eyes, closed scalloped wings, dorsal plates and diamond tail spade. Palette follows supplied slate blue, pale belly, ochre horns and dark plates/claws. Refined eye hood, short neck, underbite and belly folds from the actual reference.
- Forearms originally touched the belly, creating stretched webbing during windup. Opened the gaps; four cross-sections now show separate left arm, torso and right arm loops below the shoulder union.
- Nearest skin-weight transfer created abrupt jumps. Topological smoothing reduced the worst sampled stomp edge stretch from 9.7237 to 3.8991 and the 99th percentile from 2.2948 to 1.5578. Idle maximum fell from 3.1376 to 1.3672. This does not mean every extreme edge is fixed; unused slamWindup retains a local 4.5188 maximum with p99 1.3217.
- Expanded narrow UV islands before packing/baking. Final 912 islands contain zero bounding boxes below two pixels. Four barycentric samples per triangle find zero blank atlas samples in either export. Used 16px bake padding; removed a geometric belly pinprick and replaced a jagged weight-based belly color boundary with a smooth anatomical field.
- Replaced coincident eye poles with single poles; recalculated normals and fixed triangulation. Stable transported loft frames remove horn bend discontinuities.
- Preserved all 13 original clip durations. Rounded export endpoints to exact frames, repairing a truncated 1.9-second recovery.
- Corrected inherited floor penetration in feet/death and tail recovery/stagger. The first tail correction failed because old 30Hz keys remained between new 24Hz keys; replacing the entire channel at original sample times fixed exported playback. Full/reduced all-vertex sampled minima are .018778/.019093 model metres.
- Relaxed existing idle/walk/heavyWalk/turn shoulder poses while retaining their durations. No new actions.
- Local adapter reuses existing game rig cloning, fallback/retry/disposal patterns and combat state. Original 66-tick windup, 18-tick impact and 80-tick recovery, warnings, damage and evasion remain unchanged. Adapter is test-only, not yet in dist.

## Final export and verification

Full heavyweight-candidate.glb:
- SHA256 d2604b97b74a8ba18b9f9f15d9ed11f58573332b6891b77590051e8b44b8e5c5
- 9,002,784 bytes; 56,852 triangles.

Reduced heavyweight-lod.glb:
- SHA256 8bd66fb007870f8191258fe2b162efd3dac61d30bd111075ad07de398a86cdc6
- 7,633,920 bytes; 31,268 triangles. Prepared export only; no runtime LOD system added.

Both: 33 bones, 13 original clips/durations, one primitive/material, three embedded 2048 textures. Valid indices/joints, normalized weights with at most four influences, unit normals, valid UVs, no zero-area geometry/UV triangles and no sampled empty atlas coverage.

149/149 checks passed: 18 integration, 61 existing runtime, 70 loading/save-interruption checks. These include Chomp rig/warning preservation, independent skeletons, shared immutable resources, original warning/damage/evasion behavior, pause/dialogue/interrupt, death cleanup and six stable resource cycles. Download scenarios cover delayed, failed, timeout, corrupt and incomplete assets, retries, late arrival after encounter clearing, repeated Continue/New Game/reload and isolated saved-byte preservation.

Both exports ran all 13 clips at 21 times with no nonfinite transforms, WebGL errors or page errors. Separate all-vertex deformation audits used nine samples per clip. Thirty motion screenshots cover six actions at five times. Final comparison, motion board, close views and reduced export pixels were inspected.

Actual isolated existing-model workload: 91 calls /69,096 triangles to 1 call /56,852 triangles. Final same-game-scene measurement: 283 calls /126,993 triangles to 192 calls /114,715 triangles. These are renderer workload counts, not hardware FPS measurements.

Tests used isolated Chromium contexts with local game scripts/assets. No live save access, physical controller, phone or manual full-playthrough coverage is claimed. The 9MB full asset and three 2048 textures increase download/texture cost relative to the procedural prototype; real-device and network performance remain unmeasured.

checkpoint-06-verification.json hashes the final assets, references and evidence and checks test totals, matching report hashes, unchanged Chomp asset, dist and hosting configuration.

## Visual limits and next work

The arm/waist silhouette is still broad while lower haunches are narrow; the belly too uniformly oval with even bands; face/nostril/brow/neck folds are simplified; spots too regular; wing details simplified. The death action reads as a braced standing slump and needs a convincing weight shift/collapse within its existing duration. Recovery and heavy-walk weight need further game-speed review. These are pending gates, not hidden approximation limits. See VISUAL-GATES-STORMBELLY.md for explicit criteria.

## Deliverables

Main four-view comparison uses actual supplied pixels, actual live-v7 procedural Stormbelly and the candidate under identical camera/lights:
heavyweight/review/Skyblade-Stormbelly-comparison-06.png

Library: libfile_03c01193f8c481918ad263a7dd8eaabc
File: file_00000000ea8081f59c80a1b996020e81
Version: 0

Upload succeeded. Immediate metadata-helper application failed because Windows Python has no os.setxattr. Complete identity/xattrs are preserved in checkpoint-06-library.json; this does not invalidate the uploaded image.

Local motion board: heavyweight/review/Skyblade-Stormbelly-motion-checkpoint-06.png.
Blender sources, textures, full/reduced exports, diagnostic iterations, screenshots and audit reports are retained under heavyweight. Intermediate diagnostic captures are labeled and are not substitutes for final-hash evidence.

## Live site, rollback and blockers

Playable URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site
Project: appgprj_6acf0e7886908191820064ec6fa5afa0
Still active v7. Checked 01:32:08 UTC: custom access, one owner, zero groups and zero external visitors. No push, deployment or access mutation attempted. Current local candidate is not served by this URL.

Rollback tag asset-overhaul-baseline-v7 points to 20da43808501ece80ef7a72a7966f7bd68c68ba2. Checkpoint 05 remains 8daf67441da29c813a5d709f151dd9b33e63d266.

No approval block occurred. Remaining blocker to Stormbelly completion is the visual/motion gate above. Continue focused art/motion repair, re-export and rerun affected checks before roster integration/publication. SkyDrake has not started. No other Darren project was modified.
