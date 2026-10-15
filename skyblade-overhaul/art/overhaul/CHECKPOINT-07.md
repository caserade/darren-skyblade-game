# Checkpoint 07 — Stormbelly shape and death repair; gait gate remains open

Phase: 2026-10-15 01:39 UTC to approximately 02:10 UTC.
Branch asset-overhaul-2026-10-14; parent commit 47d06079a8c5450541e52c2e0ccfd0bbab307a39. The containing commit is reported in the handoff.

## Outcome

Closer proportions, refined face/underbite, less regular markings, visible collapse within the existing death window and a grounded first-frame pose are preserved. **Overall motion gate remains open:** actual pursuit reveals foot glide. This is the next concrete repair; SkyDrake remains unstarted. Chomp checkpoint05, dist, hosting, content and saves are unchanged.

## Reference-led changes

Actual pixels were re-inspected in concept_heavyweight.jpg and heavyweight_model_sheet.jpg. SHA256 values remain c5d7840e646a474895f84321a01b5d9b1a2d5ade559ddd69257aceac0e1fcb81 and c321cad129d6b127e57853a379c67f11b12fe2e9a0e74cea403ae5ef980c95ee. The upper turnaround is authoritative; historical models are not substitute references.

- Broadened lower haunches, adjusted lower belly sag/fold curvature and softened band shading. Narrowed upper waist and relaxed existing shoulder poses.
- Narrowed head and sideways horn span; reduced tusks and eye openings; added nasal hoods/brow crease and shaped the pale lower lip to cup the upper muzzle.
- Replaced regular dark round spots with smaller irregular, lower-contrast markings, subtle variation and a faded bib-edge transition.
- Raised/compressed existing wing panels behind the shoulders, preserving the wing bones/actions.

Front width/height improved .7575 to .7317 (reference .6991); head row .2669 to .2453 (reference .2359); haunch row .5567 to .6198 (reference .6103). These are diagnostics, not a calibrated fidelity score. Fine neck/cheek folds, nostril shape, exact spot clusters, wing detail and idle tail-tip orientation remain approximations. This is procedural reference-led Blender work, not a claim of final hand-sculpted art or unseen mouth-interior fidelity.

## Motion repairs and remaining issue

The existing death lifecycle removes an enemy after 16 ticks, so almost all of the 2.2s source action was previously invisible. The adapter now fits that same clip into the unchanged window at 8.25x, with a short transition. The new collapse is visible by tick eight, present through tick fifteen and cleaned at tick sixteen. Damage, drops, rewards and removal timing are unchanged.

The existing action now folds the legs, tips forward and settles with delayed wing/tail response. Early raised-tail/chin-supported iterations were rejected after pixel inspection. Final support is on the belly, with the tail tip near .045m above the floor. Recovery unfolds gradually and heavyWalk has subtle torso/head/belly/wing/tail phase offsets.

Broader haunches initially exposed a lower belly/shin weight seam. A narrower low-belly attachment, more topological smoothing and longitudinal tail-weight constraints reduced this. Final full stomp-impact edge stretch: max 3.747x, p99 1.397x; windup max 4.078x, p99 1.464x. Death retains a local max 5.213x, p99 1.448x; not all local strain is eliminated.

A fresh instance also exposed the unanimated bind pose before its first AI tick, briefly sinking feet. It now establishes grounded idle immediately. A new all-vertex initial-pose regression verifies the repair.

**Remaining blocking gait issue:** actual updateEnemy at 60Hz travels 2.475m during one 1.5s heavyWalk cycle at unchanged 1.65m/s chase speed. Toe forward excursion is only about .475m. Near-ground contact toe-joint speed remains median 1.363m/s, p95 2.620m/s. This is a slip diagnostic, not a physical contact solver; gameplay captures are in review/gait-07. Next work must match stance/stride to real movement while preserving speed, action count/durations and combat timings. The overall gate is explicitly OPEN in VISUAL-GATES-STORMBELLY.md.

## Exact deliverables and verification

Full heavyweight/export/heavyweight-candidate.glb:
- SHA256 ba3129e80e28b3de8ff7bdef8b0568e517e177cc061358569d3683084f3344e8
- 9,530,116 bytes; 56,852 triangles.

Reduced heavyweight/export/heavyweight-lod.glb:
- SHA256 11c1181e3279b1eaa83a8b01e84cf029b9b2bff62f1f5155ccdfe731f5c3d9db
- 8,159,888 bytes; 31,268 triangles. Prepared authoring export only; no runtime LOD system.

Both preserve 33 bones, all 13 actions and original durations, one primitive/material and three embedded 2048 textures. Indices/joints/weights/normals/UVs, zero-area geometry/UV and four-location-per-triangle atlas checks pass. All 972 UV islands exceed two pixels; four arm/torso sections retain three separate loops.

153/153 unique local checks pass: 22 integration, 61 runtime, 70 loading/save-interruption checks. Coverage includes initial pose, original stomp warning/damage/evasion/recovery, pause/dialogue/interrupt, death timing/cleanup, independent skeletons, Chomp preservation, repeated resource cleanup, delayed/failed/corrupt/incomplete/timeout/retried loads and isolated saved-byte preservation.

Both exports run all 13 clips at 21 smoke-test times without nonfinite transforms, WebGL or page errors. All-vertex deformation/floor audits use 41 samples per clip. Full lowest-support range .018222–.029347m; reduced .018535–.029206m. Thirty shadowed motion views, seven actual chase screenshots, four-view comparisons and gameplay attack/death captures were inspected. Sampling is not continuous collision proof.

Actual serve.cjs /?qa=1 separately passed 61/61 in a fresh browser profile. Initial sandbox localhost navigation was blocked; a scoped escalation succeeded and the test stopped its own server. No approval blocker remains.

Isolated existing-model workload: 91 calls/69,096 triangles versus 1 call/56,852 triangles. These are renderer counts, not FPS. The full export is about .53MB larger than checkpoint06 due to texture changes; actual device/network performance remains unmeasured.

No live saves, physical controller, phone, manual full playthrough or hardware FPS coverage is claimed. checkpoint-07-verification.json checks final evidence hashes and unchanged dist/hosting/Chomp. Chomp SHA256 remains e7c073466cd1980e7a6a11eb17207874ab2ce9966d802a03cdb90f79655f6957.

## Review and publication

Library comparison: libfile_e54f2b7701788191b8379256a415f696.
File file_0000000071a881f993bfc49c69f2e7b9, version 0.
Local: heavyweight/review/Skyblade-Stormbelly-comparison-07.png; actual supplied art, private-v7 model, checkpoint06 and checkpoint07 with identical game-model cameras/lights.
Motion: heavyweight/review/Skyblade-Stormbelly-motion-checkpoint-07.png.
Blender sources, textures, full/reduced exports and evidence remain under heavyweight.

Library upload succeeded; Windows could not apply local extended attributes, so the returned identity is retained separately. Earlier checkpoint manifests describe their historical commits; generic review files have advanced.

Live project appgprj_6acf0e7886908191820064ec6fa5afa0 remains active private v7:
https://darren-skyblade-reach.gosplekaiju.chatgpt.site
Checked 02:03:48 UTC: custom access, one owner, zero groups, zero external visitors. No push, deployment or access mutation. Candidate unpublished.

Rollback asset-overhaul-baseline-v7 remains 20da43808501ece80ef7a72a7966f7bd68c68ba2. Checkpoints05/06 remain recoverable. Other Darren projects were not modified.
