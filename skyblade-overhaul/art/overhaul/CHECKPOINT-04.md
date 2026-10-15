# Checkpoint 04 — Chomp Rex focused likeness pass

2026-10-15, approximately 00:01–00:30 UTC. Review candidate only; not published. Work is limited to Chomp. Stormbelly and SkyDrake have not begun.

## Result

Chomp does not yet meet the complete visual gate. Geometry transitions and proportions improved, and all affected runtime checks pass, but the surface finish and cheek expression still need specific correction. Do not advance to the next creature on the strength of the runtime results.

Actual reference pixels were inspected in art/references/concept_chomprex.jpg. The face comparison includes the supplied four views, committed checkpoint 03 renders, and the final checkpoint 04 renders. Different artwork projection, pose and lighting prevent an exact pixel similarity claim.

## Concrete changes

- Fused pink brow volumes into the head surface; removed detached frown/lid strips. Reduced eye socket and cream opening to remove the visible far-brow opening in rest and bite.
- Slimmed and tapered the gold lower jaw, folded its rear upward/forward, moved the cheek forward, and removed the exposed rear tooth-root ledges.
- Brought shoulders, hands and corresponding bones inward. Raised jaw clearance exposes the neck without shrinking its already appropriate minimum width.
- Replaced unstable QuadriFlow output with voxel remeshing plus symmetric simplification and localized brow smoothing. Closed surface checks and tail volume guards now accompany the build.
- Darkened the plum palette, restrained normal relief, sharpened the gold paint mask, enlarged UV spacing and padded unbaked texels. These improve the surface, but the final padding did not eliminate all dark slivers: no claim of full seam repair.
- Preserved the production loader, game scripts, combat data, save format, engine and content. Only the Chomp GLB changed under dist in this checkpoint.

## Scoped visual gates

| Criterion | Result | Evidence / deviation |
| --- | --- | --- |
| Fused brow geometry | Pass for the scoped separation defect | Four-view and bite/windup renders no longer show detached pink strips or the previous far-brow opening. Expression remains less sculpted than the supplied art; small dark eye-edge artifacts are tracked under surface. |
| Cheek/jaw | Partial | Rear fork, white root ledge and broad rear gold overhang removed. Gold curve is continuous, but the smile is flatter and the cheek-to-neck junction more angular than the artwork. Front teeth remain oversized and more uniform than reference. |
| Neck proportions | Pass for the scoped width/clearance adjustment | Neck reads beneath the jaw; total front width/height remains .469 versus reference .460. Front width at 30% height improved .268 to .193 (reference .174), and at 42% .321 to .294 (reference .282). Lower shoulder transition still broader and less soft than art. These are diagnostic measurements, not a likeness score. |
| Surface finish | Fail / open | Subtle relief and plum/gold palette improved. Small black slivers persist at eyes, shoulder, jaw and fingers; gold border remains jagged in close-up. The atlas-padding attempt is insufficient. |
| Runtime/no regression | Runtime pass; visual acceptance remains open | Full/LOD geometry and sampled clips valid; no collapsed tail or detached brow observed in reviewed views. Existing loading, combat and save tests pass. Surface defects above prevent overall visual sign-off. |

## Verification on the final exact asset

Full GLB SHA256: c602636e522a1986911e9734f3834b087c188ed997727ab670af690310c3f46f.
LOD SHA256: 728cd0cc9ee88a7935b6861ffad4bdd12ceeadfbeddbb32fa40b66c873c8b8df.
The full hash matches dist/assets/chomprex.glb, candidate-three-report, game-integration-report and production-loading-report. LOD probe matches the structural audit.

- 16/16 Chomp integration checks.
- 70/70 loading/retry/interrupted-save checks across five isolated contexts: delayed, failed HTTP, corrupt, incomplete and timed-out asset paths.
- 61/61 existing runtime QA checks.
- Full and reduced exports: 29 bones, all 12 original clips and durations, one draw primitive/material, valid indices, UVs and normalized weights, three embedded 2048 textures.
- Actual game-bundled Three.js r128 sampled 21 points per clip in both exports; zero nonfinite sampled vertices or browser errors.
- Full: 57,290 triangles, 6,743,772 bytes. LOD: 31,508 triangles, 5,469,116 bytes. LOD remains a prepared review export, not a new runtime LOD system.
- Same arena/camera idle comparison: draw calls 281 to 192; rendered triangles 120,315 to 115,153. This is draw workload evidence, not an FPS benchmark.
- Current idle visual height 3.22217 versus baseline 3.24328, within the 5% gate.
- Source/data JavaScript syntax checks passed. Temporary local server stopped.
- Reviewed final four-view comparison, close-up surface diagnostic, bite pose, reduced-export three-quarter and same-game-camera result.

Tests used disposable Chromium contexts and fulfilled local files because loopback access is restricted. They did not access the live user's save. No physical controller, phone, manual full playthrough or hardware FPS coverage is claimed.

## Deliverables and access

Comparison Library ID: libfile_41022fbf2df08191909c6e690703a0ad
File ID: file_0000000023e081f98bf3a6063b48ff80, version 0.
Name: Skyblade-ChompRex-face-comparison-04.png.
Library creation succeeded. Windows Python lacks os.setxattr, so helper application failed; the complete Library identity and xattrs are retained in checkpoint-04-library.json.

Full board: chomprex/review/Skyblade-ChompRex-overhaul-checkpoint-04.png.
Sources, baked maps, full/reduced GLBs, turntable and machine-readable reports remain in art/overhaul/chomprex.

Live Site remains v7, project appgprj_6acf0e7886908191820064ec6fa5afa0, custom access with exactly one owner, zero groups and zero external visitors, checked 00:24 UTC. No publish was attempted.
Playable existing build: https://darren-skyblade-reach.gosplekaiju.chatgpt.site
Rollback: tag asset-overhaul-baseline-v7 at 20da43808501ece80ef7a72a7966f7bd68c68ba2; previous checkpoint 820dab792329040b63314bd6de47021b80e18a5e.

## Bounded next work

Do not resume broad redesign. First isolate one eye/shoulder dark sliver with flat-color and unlit materials against the exact UV triangles, then correct its source (projection/overlap or atlas coverage) and repeat close-ups. Smooth the gold cheek-neck join and curve the upper smile/teeth placement toward the side/front reference without changing animation timing. Re-run the same final-hash checks after a successful correction.

Estimated next Chomp pass: 20–30 minutes for diagnosis and targeted repair, then 10–15 minutes for export/review/regression. This is an estimate, not a promise that the gate will pass. Remaining Stormbelly and SkyDrake work likely needs another 90–150 minutes plus 20–30 minutes of final roster verification. At the present quality bar the total work is likely to extend beyond the original 01:56 UTC window. No approval blocker; the remaining blocker is the visual quality gate.

