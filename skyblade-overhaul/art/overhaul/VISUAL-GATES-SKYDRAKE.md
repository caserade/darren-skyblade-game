# SkyDrake checkpoint 09 gates

This is a local review candidate, not final art or an approved publication. Keep Stormbelly checkpoint 08 and the live owner-only version 7 intact until the integrated review is complete.

| Gate | Result | Evidence / limitation |
|---|---|---|
| Supplied references inspected | Pass | Actual pixels of `art/references/concept_skydrake.jpg` and `skydrake_model_sheet.jpg`; concept turnaround is the design authority. |
| Recognizable silhouette and colors | Improved, partial | Wider head, segmented gold horns, dark brows/ribs, scalloped cyan membranes, shortened hooked tail. Removing duplicate vertex color multiplication restores the supplied blue/pale atlas. Four matched views of live v7, full candidate and reduced candidate are in the comparison board. |
| Fine reference fidelity | Open | Body still has narrow belly bands and noisy fine scales; neck/haunch/foot proportions and wing curvature remain approximations. Arrow tip is thin in profile. No invented replacement design or final-art claim. |
| Rig and source clips | Pass | Original 39 bones and all 14 named clips/durations retained; full and reduced exports validated. Editable Blender sources and original supplied GLBs/generator sources are retained. |
| Skin continuity | Pass for checked seams | Coincident body UV vertices receive identical normalized weights; close-up tail-sweep and attack renders inspected after correction. |
| Extreme deformation | Open | Neighboring weights were smoothed across welded seam neighborhoods. Edge-strain diagnostics and 50 sampled motion images remain in the review folder; local arm, hip and jaw distortion is still visible in extreme poses. Finite geometry does not establish final animation quality. |
| Grounded landing and interruption | Pass for tested flows | Actual updateEnemy cycle and four interruption scenarios per mesh size. Animated foot-vertex correction is visual-only and leaves the existing collider, movement and damage timing intact. |
| Planted ground gait | Open | Original walk remains; no distance-matched foot plant solver was added. Do not infer that the ground gait matches Stormbelly checkpoint 08. |
| Flight and combat readability | Functional pass; art partial | Existing takeoff, circle, locked swoop warning, impact, landing, recovery, tail dodge/hit timing, stagger and death cleanup verified. Death clip is compressed into the existing 16-tick removal window; it is not a two-second cinematic collapse. |
| Loading and repeated encounters | Pass | Delayed/HTTP-failed/corrupt/incomplete/timed-out loads; recovery, chapter interruption, save byte preservation and six repeated resource cycles. |
| Cost and mesh sizes | Measured | 68 to 11 rendered draw calls. Full 42,458 triangles; reduced 24,201 versus current live 30,599. Candidate files are larger than the original reduced source. These are not physical-device FPS results. |
| Integrated final cast / publication | Pending | Chomp and Stormbelly files are byte-preserved; this phase tests SkyDrake with the existing dist baseline. Combined candidate-cast review and final publication decision remain outstanding. |

The runtime fixes live in `scripts/skydrake-local-adapter09.js`. Importing the GLB alone does not include grounded clearance, loading recovery, death dispatch or removal of duplicate procedural body transforms. None of these files is included in `dist`.
