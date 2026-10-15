# Checkpoint 19 - localized Chomp facial refinement

**Decision: retain this limited candidate locally. Publication remains held.** The supplied Chomp turnaround and matched front, profile and three-quarter renders show fuller forward tooth crowns, more lower-eyelid coverage and a rounder cheek transition. This is a modest facial improvement over Chomp18, not a finished reference match. The difference is clearest in close-ups and subtle at the normal gameplay camera, especially on the portrait viewport.

The pass began at **08:14:54 UTC on October 15, 2026**, from Chomp18 commit `f1245351718970aca44732cc284777070c91e65a`. The final receipt records completion time and the new commit. Both Chomp18 and sealed RC16 are preserved as fallbacks. No new content, gameplay, saves, rig, clips, other characters, engine or audience changes were made.

## Retained changes and rejected trials

- Lifted the existing lower-lid surface locally, thickened the middle of the existing dark upper-lid strand while anchoring its ends, and rounded the pink cheek and gold cheek transition. All eight eyeball/iris/pupil/catchlight components remain exactly unchanged. These are existing-mesh adjustments, not new facial parts.
- Broadened the rounded tips of the forward upper crowns and modestly developed the forward lower crowns. The blend fades toward the rear. **All 14 rear crowns remain exactly Chomp18**, with the original count of 30 teeth and unchanged topology.
- Rejected a whole-strand brow thickening because it exposed the outer tip. Rejected broad rear-crown enlargement after the open-mouth sequence revealed white tooth slivers through the gold cheek. The final maximum-windup front/three-quarter views remove those new slivers; fixed gold-cheek crops contain zero ivory pixels before and after. This is a targeted visual check, not proof against every intersection.
- Body vertices below the facial region are unchanged. No further broad head, torso, leg or eye-spacing warp was retained. Maximum changed-vertex displacement is approximately 0.03875 model units. Feet, height and ground clearance are unchanged.

Fixed idle eye crops show 5.7% less visible ivory eye-white area from the front, 12.1% from the side and 9.2% at three-quarter. These are coverage diagnostics under identical lighting, not likeness scores. The physical eye/iris locations did not move; any change in a pixel-derived iris centroid comes from occlusion. The fixed dark-mouth metric is unchanged from Chomp18, so this pass does **not** claim a further tightened jaw opening.

## Verification on the retained bytes

- Exact package: **45 app files**, with only `dist/assets/chomprex.glb` changed from Chomp18. The project ID remains `appgprj_6acf0e7886908191820064ec6fa5afa0`.
- **250/250** runtime/repair checks on fresh desktop and portrait touch-emulated profiles, plus **340/340** repeated-flow checks across 20 cycles. These include interruption, pause/dialogue, disposal, travel, keyboard/blur, checkpoint save, reload/Continue and a separate storage sentinel. The accelerated encounters total ten simulated minutes, not ten minutes of manual play.
- **1,200 sampled poses**: 12 preserved clips x 25 times x full/reduced x before/after. All skinned vertices are finite. Global peak edge stretch and measured jaw-hinge separation are unchanged. The largest peak-stretch increase on changed facial edges is **3.54%**; the largest facial p99 increase is **0.132%**. Existing extreme deformations elsewhere remain. Metrics aid review and do not establish universal intersection safety.
- Both exports preserve 29 bones, 12 clips, one primitive, all animation/skin/weight/UV/index/material/texture bytes and existing triangle counts: full **61,789**, reduced **33,983**. No collapsed or reversed rest triangles; normals remain finite and unit length.
- Both editable Blender copies were saved and reopened. All 5,081 full / 2,861 reduced mapped source positions match, with bones, actions/keyframes, weights, UVs and topology unchanged. Blender could not write optional thumbnail-cache images outside the workspace; source save/reopen checks passed. Tested GLBs remain the appearance authority; arbitrary Blender re-export is not claimed byte-identical.
- **72 matched inspection renders**, **72 matched expression-sequence frames**, **24 candidate clip poses**, and **six actual gameplay runs / 42 screenshots**. Gameplay uses the unchanged production camera/HUD at 1440x900, 390x844 and 844x390. Capture scenes use a deterministic seed and invulnerable player for comparison.

No physical phone/controller, hardware FPS, full playthrough or continuous-collision claim is made. Existing landscape HUD crowding remains. Eye/socket spacing, brow and nostril anatomy, jaw/gum joining, individual crown detail and fine surface markings still differ from the supplied art. Future work should address those deliberately, preserving the dense inner-brow deformation seam, rather than continuing broad proportion warps.

## Deliverable and rollback

- Playable package: `chomp19/release/dist`; manifest SHA-256 `93099ef280177eca2e34597bd3abcde7039c1f85ba18ae945f9423de7cd19d3e`.
- Full GLB: `chomp19/export/chomprex-candidate.glb`, SHA-256 `e6c35e6cf0a70a06c94aa3167e105ab4b4c093895ab90c827c4b7ad097c34b0d`.
- Reduced GLB: `chomp19/export/chomprex-lod.glb`, SHA-256 `871bfe22140b1740385cb9b1764919cd67ed964564f0bcf5135fa458b879f10e`.
- Editable copies: `chomp19/source/chomprex-candidate.blend` and `chomprex-lod.blend`. Recipes and validation scripts use the `19` suffix. Rejected studies are marked under `review/study-a`, `study-b` and `study-c`; they are not the shipped candidate.
- Launch from this project: `node art/overhaul/scripts/serve_chomp19.cjs`, then `http://127.0.0.1:4326/`. Use an isolated browser profile. Root `dist` is not this candidate.
- Portable delivery: sibling `Skyblade-Chomp19-local.zip`, with a local Node launcher, exact app manifest, reports and boards. Its exact SHA is in `Skyblade-Chomp19-package-receipt.json`. Editing sources remain in Git; the ZIP is the playable/review package.
- Chomp18 fallback commit: `f1245351718970aca44732cc284777070c91e65a`; ZIP SHA `7c12f4b79270364748dea6458c9bb3394e1b52857dda08e0cd9333bfc0ebc20a`.
- Sealed RC16 fallback commit: `af98739877d97a021e3afc7feda137f1ec5865bc`; ZIP SHA `109e422ee8da7354b7f7206f7ce302d30c82689c95a194339870a76713e40a2b`.

The actual supplied reference is `art/references/concept_chomprex.jpg` (SHA `2ce54cd1c0a0ef7170cd5e1f7f92edbc8b42938fb6f16bbd299c76a59403b918`). All boards retain source hashes. Curated boards, reports and selected captures are versioned; additional raw captures remain local and are reproducible with the scripts.

The live URL remains https://darren-skyblade-reach.gosplekaiju.chatgpt.site . This candidate is **not live**. The last saved hosting read, at 06:39 UTC, reported version 7, custom owner-only access, one owner and zero external visitors; no fresh hosting read or mutation occurred in this pass. Publication is held by instruction, not blocked by a new approval rejection. No Library upload was attempted.

A separate read-only Stormbelly assessment is in `STORMBELLY-ASSESSMENT-19.md`; no Stormbelly asset was edited.
