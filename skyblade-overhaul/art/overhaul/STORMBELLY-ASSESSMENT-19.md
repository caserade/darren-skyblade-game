# Stormbelly assessment after Chomp19

**Assessment only; no Stormbelly changes.** I inspected the actual supplied `art/references/concept_heavyweight.jpg` pixels, the checkpoint08 comparison/gait evidence, and 18 fresh renders of the exact accepted full/reduced exports. Fresh front, profile and three-quarter body/face boards are under `chomp19/review/boards/Stormbelly19-assessment-*.png`. The images use uniform scaling. The illustration is not a calibrated orthographic target.

## Next justified work

1. **Eye sockets and brow/lid transition.** The reference has small, deeply hooded amber eyes under a broad rounded brow. The current model exposes much more eye white, the pupils/irises protrude visually, and the lower socket is angular. This is the clearest local facial mismatch. Start with the existing socket/lid geometry and check eyelid coverage through idle, stomp windup, stagger and death before changing eye placement.
2. **Muzzle, pale jaw and tusk joining.** The reference's muzzle blends into broad rounded cheeks and a thick pale lower jaw. The current pale jaw reads as a pointed projecting cup, with a sharp upper edge and simple dark nostril openings. Match its front and side curve while preserving the existing articulated jaw and avoiding new tooth/cheek intersections. Tusk spacing and roots should follow the existing reference, with no added teeth.
3. **Horn bend and neck transition.** The reference horns sweep outward/back more; the current horns are upright with abrupt hooked tips. The neck-to-cheek transition is also simplified. A local shape study is justified, but it must preserve all existing bones, attachments, clips and colors.
4. **Body silhouette only after a separate motion check.** The current body reads more upright and tapered than the reference's broad egg-shaped mass and low sagging belly. The tail's animated rest curl also differs. Any belly/haunch/tail adjustment risks the accepted hand clearance, planted-foot behavior and supported death pose. Do not infer a safe change from width/height ratios alone or rerun the old build/import pipeline.

Fine belly-fold variation, spot clustering and wing ribs are lower priority than those forms. Lighting is not calibrated, so these boards do not establish a numeric color-match score.

## Preserve these exact starting points

- Full source: `heavyweight/source/heavyweight-runtime-candidate.blend`; reduced source: `heavyweight/source/heavyweight-lod.blend`.
- Full export SHA: `b8bcc310d618c5b21b8e3063c1746ceb0d25e105c9f1af4ba83bc62fa31a0121`.
- Reduced export SHA: `a1f6cf908af76a9fae755a60087d2744714e0b00ab6f1a2eed79c21a927f07fb`; the candidate app contains those bytes as `dist/assets/stormbelly-rc15.glb`.
- Preserve the checkpoint08 33-bone rig, 13 clip names/durations, repaired heavyWalk and production foot-placement/transition logic. The pre-gait source and old build/import scripts are historical inputs, not the current editing base.

Checkpoint08 documented repaired pursuit glide and interrupted stomp/stagger foot contact, with residual extreme local edge stretch. That historical result is not re-certified by the fresh standalone art renders: they show authored clips without production foot-placement correction. The Chomp19 exact-package regression/soak does exercise the unchanged three-creature game, but a Stormbelly mesh edit would still require its dedicated full/reduced pursuit, stop/resume, turning, stomp, stagger and floor-clearance cases.

Reference SHA: `c5d7840e646a474895f84321a01b5d9b1a2d5ade559ddd69257aceac0e1fcb81`. Capture hashes and scope are in `chomp19/review/stormbelly/stormbelly-assessment-captures-19.json`; board provenance is alongside the boards. The composite model sheet's historical runtime panels were not treated as additional turnaround art.
