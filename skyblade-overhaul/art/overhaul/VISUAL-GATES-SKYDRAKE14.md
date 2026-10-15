# Checkpoint 14 scoped visual gates

Decision: **pass for the shoulder-support repair and sampled high-flight camera framing**. This is a local review candidate, not a claim of exact reference reproduction or authorization to publish.

The source is checkpoint 12. Failed checkpoint 13 is isolated and has not become a default candidate. Checkpoint 12 remains the accepted rollback. No Chomp, Stormbelly, Darren, `dist`, hosting, engine, encounter or saved-game files changed in this checkpoint.

| Gate | Evidence | Outcome |
| --- | --- | --- |
| Diagnose before bake/LOD | `skydrake14/review/early-support/` retains the early GLB, textured/clay captures and gate record. | Sideways collar, retained-boundary support smoothing and arm/chest weight transition remove the prior fan/notch. |
| Ordinary poses | Final idle, walk, turn and flyIdle comparisons; main/opposite/rear textured and clay captures. | Rounded shoulder volume remains; no prior sharp armpit teeth in inspected views. A softer crease remains. |
| Extreme/transition poses | Attack, attackWindup, tailWhip, tailWindup, hit, stagger, death, takeoff, land and recover sampled for full and reduced models. | Local shoulder join remains continuous in inspected views. Folded wings and hip/tail deformation remain approximate. |
| Reduced seam | Independent geometry audit of the final exported LOD. | Zero bad patch-edge counts; zero coincident skin/patch weight error in both exports. |
| Reference fidelity | Actual supplied SkyDrake turnaround pixels inspected; inherited blue body, pale belly, gold horns, navy spines and cyan membrane retained. | Local arm silhouette is closer to the rounded reference. Exact proportions, fine sculpted texture and crease placement remain approximate. |
| Integrated cast | Chomp 05, Stormbelly 08 and SkyDrake 14 full/reduced lineup at existing game scales, plus Darren; idle/walk/stagger screenshots. | No new visually obvious material/rig conflict in reviewed lineup. Six-second actual coexistence runs reach attack/recovery for all three. |
| High-flight camera | Same final full/LOD assets and deterministic 10-second flight cycle, landscape 1280x900 and portrait 500x900. Actual skinned vertices sampled every 10 frames. | In each of four enabled runs, both meshes fit in 41/41 samples with enemy height above2m; original camera fits full dragon in 0/41. |

Camera limits: early takeoff/ground can still crop a small upper portion; this pass targets elevated lock-on framing. Synthetic obstacle tests verify reuse of the existing constraint, not all terrain. No physical phone/controller, hardware FPS or full playthrough coverage.

The rig audit retains 39 bone names/bind matrices and all 1,638 authored tracks across 14 clips exactly. A 574-pose all-vertex scan per variant is finite; it is not a blanket deformation-quality pass. The largest full-mesh edge stretch is 4.703x in the pre-existing hip/tail blend, outside the shoulder join. Raw authored windup/land poses dip below the origin; actual game-height/foot support is tested separately. The pursuit-to-takeoff sample has a small 2.54mm foot dip within the existing 5mm tolerance; do not describe it as zero penetration.
