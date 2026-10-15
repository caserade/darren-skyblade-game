# Stormbelly / Heavyweight gate - checkpoint 08

**Scoped pursuit/contact/transition gate: PASS in the tested local scope.** The checkpoint-07 glide is repaired at the unchanged 1.65 m/s speed. Stops, resumes, pursuit turns, stationary turns, stomp transitions and stagger interruptions pass on full and reduced meshes. See CHECKPOINT-08.md and checkpoint-08-verification.json for exact coverage and hashes.

Planted toe and rigid-claw p95 speed stays below 0.000002 m/s in the motion cases. The near-ground swing diagnostic is reported separately and is not claimed zero. No sampled game foot or all-vertex floor penetration remains. Existing combat timing, saves, death window, Chomp asset and private live v7 are preserved.

This closes the measured locomotion repair, not exact-art approval. Fine facial folds, nostrils, spot clusters, wing detail and idle tail orientation remain approximations; static geometry/textures are unchanged from checkpoint 07. Residual extreme local edge deformation remains documented (death 5.213x maximum; authored heavyWalk 4.375x maximum). No full playthrough/controller/phone/FPS claim. SkyDrake is still unstarted in this checkpoint.

## Archived checkpoint 07 assessment

# Stormbelly / Heavyweight gate — checkpoint 07

**Overall gate: OPEN.** Technical/export/save behavior and death-window repairs pass locally. Pursuit foot glide is the next blocking motion repair. Keep SkyDrake unstarted.

- Silhouette: improved from .7575 to .7317 front width/height; supplied reference .6991. Head-row .2453 versus .2359, shoulder-row .5710 versus .5675, waist/arm-row .7030 versus .6718, haunch-row .6198 versus .6103. Diagnostic ratios only; art projection is not calibrated.
- Face/surface: narrower head/horns, smaller hooded eyes/tusks, nasal hoods, brow crease, cupped lower lip, broader haunches, softer irregular belly folds and markings. Fine cheek/neck folds, nostril shape, exact spot density and wing detail remain approximations.
- Topology/UV: pass. Manifold fused body, four normalized influences maximum, valid indices/normals/UVs, zero blank atlas samples and zero sub-two-pixel islands among 972 islands.
- Deformation/floor: full and reduced exports stay above floor across 41 samples per each of 13 clips. Full lowest-support range .01822–.02935m. Death ends supported by the belly with tail tip near .045m. Local death edge strain remains: maximum 5.213x, p99 1.448x; not claimed eliminated.
- Death: pass for the existing short gameplay window. Existing 2.2s action plays at 8.25x within unchanged 16-tick shrink/removal. Collapse visible by tick eight; removal/cleanup at tick sixteen. No claim that a normal-speed 2.2s settle is visible.
- Initial pose: pass. Grounded idle is established before first AI tick, eliminating transient bind-pose foot sinking.
- Pursuit weight: **FAIL / next repair.** Actual travel 2.475m per 1.5s heavyWalk cycle versus about .475m toe forward excursion. Near-ground contact toe speed median 1.363m/s, p95 2.620m/s indicates glide. Repair stance/stride and phase matching without changing 1.65m/s chase speed or combat timings.
- Regression: 22 integration +61 runtime +70 loading/interruption checks pass (153 unique). Actual serve.cjs QA separately passes 61/61. No physical controller/phone/full-playthrough/FPS claim.

The next pass stays on Stormbelly. Match foot stance to actual movement, review at game speed and distance, preserve death/initial-contact repairs, then rerun affected full/reduced animation and interrupted-flow checks.

## Archived checkpoint 06 assessment

Status: **PENDING**. Technical export/runtime checks pass; this candidate is not approved as final character art or integrated into dist.

Actual supplied pixels were reviewed in concept_heavyweight.jpg and heavyweight_model_sheet.jpg. The upper turnaround is the design authority; historical model renders in the sheet are not a replacement reference.

| Gate | Assessment and next concrete work |
| --- | --- |
| Overall silhouette | Improved from the live procedural prototype. Front width/height diagnostic .7575 versus reference .6991 and old model 1.0563. Arms/waist remain broad, lower haunches too narrow. Broaden lower haunches and reduce outward arm silhouette without restoring forearm/belly contact. Reference projection differs; measurements are diagnostics, not a fidelity score. |
| Face and expression | Pending. Sleepy amber eyes, hooded brow, ochre horns, pale underbite and short neck are represented, but nostrils remain round/simple, muzzle too plain and cheek/neck fold forms insufficient. Refine those surfaces from front and side reference pixels. |
| Belly and surface | Pending. Pale folded belly and slate-blue spotted body are present, but belly is too uniformly oval, bands too even and spots too regular/dark. Introduce reference-led sag/fold variation and less regular mottling. Do not invent unseen mouth interior. |
| Wings / dorsal plates / tail | Small scalloped wings, navy plates and diamond spade are represented; wing ribs/scallops remain simplified. Animated idle tail curls/tilts more than the reference rest silhouette. Recheck after pose refinement. |
| Topology / atlas / rig | Pass within audit scope. Manifold fused body, max four normalized influences, valid indices/unit normals, no zero-area geometry or UV triangles, zero blank atlas samples, zero sub-two-pixel islands. Separate articulated jaw preserved. |
| Deformation | Improved but not perfect. Forearm/belly bridges removed; topological weight smoothing reduced sampled stomp stretch. Residual extreme local edge stretch remains in unused slamWindup; retain it as an inspection item. |
| Foot / tail floor clearance | Pass at sampled times in full and reduced exports. All-vertex minimum full .018778 m, reduced .019093 m. Tail recovery/stagger floor dips corrected in exported animation keys. Sampling is not continuous collision proof. |
| Death / recovery / heavy walk | Pending artistic gate. Death reads as a braced standing slump rather than convincing collapse; recovery is a held hunch. Refine existing actions without changing combat timing or clip durations. Review motion at game speed and all critical poses. |
| Runtime / save safety | Pass in local isolated tests: 18 integration +61 existing runtime +70 loading/interruption checks. No full playthrough, physical controller, phone or hardware FPS claim. |

Next phase stays on Stormbelly. Do not start SkyDrake or replace the live build merely because technical checks pass. Preserve checkpoint 05 Chomp, existing actions, combat timings, saves and private audience.
