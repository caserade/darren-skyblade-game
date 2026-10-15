# SkyDrake checkpoint 12 visual gates

The supplied `concept_skydrake.jpg` is the design authority. Both it and `skydrake_model_sheet.jpg` were inspected directly during this pass. The latter includes earlier model renders and does not replace the concept.

| Gate | Outcome | Evidence / limit |
|---|---|---|
| Broad ventral plates | Improved, partial | Cleaner spacing and curved boundaries, less white wash, old doubled grooves removed. Lower-belly facets and some tonal unevenness remain. |
| Scale character | Improved, partial | Restrained overlapping curved rows on upper outer haunches. Still a procedural approximation; it does not reproduce the individually shaped, irregular concept scales. Other skin areas retain their original detail. |
| Shoulder deformation | Not resolved | The weight/recess trials did not produce an acceptable raised-arm shape. Rejected; checkpoint 11 weights and posterolateral shoulder geometry retained. |
| Ordinary ground combat view | Sampled, usable | Existing lock-on camera and actual ground-tail attack flow show the new surface at gameplay distance. This does not waive the close-up shoulder limit. |
| Swoop camera framing | Existing limitation | In both checkpoint 11 and 12, the high part of the swoop moves above the frame in the controlled lock-on scenario. Late-swoop frames show the raised-arm pose. No camera code changed. |
| Gait / wings / spines | Preserved | Exact full-mesh submesh, weights, lower-leg and animation comparisons plus full/reduced runtime checks. |
| Full/reduced surface consistency | Improved, sampled pass | Same design baked separately against each mesh's UV-to-surface correspondence. |
| Final concept fidelity | Not reached | Shoulder joint shape, organic dorsal-spine forms, lower-belly smoothness and individually sculpted scales remain partial. |

## Root cause and next meaningful step

`source/sculpt_cast.py` constructs the torso, chest, shoulder and upper arm as a smooth-union body. The resulting broad bridge is visible in rest and raised-arm views. Existing forearm influence extends into the junction; redistributing it alone does not create an anatomical armpit. A local recess without suitable edge flow pinched when the arm rose. Evidence is retained in `review/rejected-experiments-12.json` and its two marked screenshots.

The next shoulder correction should replace the local shoulder/axilla topology with a continuous, deliberate deformation surface, transfer the retained skin weights as a starting point, then validate raised arms, tail whip, hit and death alongside ordinary walk poses. Keep the 39-bone rig and existing clips. Further blind diffusion or accepting a lower maximum edge ratio is not an adequate completion criterion.

Publication remains on hold. The scoped quality gate is **not fully met**, and this checkpoint must not be presented as ready for a final integrated-cast sign-off.
