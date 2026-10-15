# Chomp Rex visual acceptance criteria

Reference authority: actual pixels in `art/references/concept_chomprex.jpg`, including front, side, back and three-quarter views. Height-aligned overlays are diagnostic; the artwork changes pose/projection between views. No exact pixel-perfect score is asserted.

This pass is limited to the named deviations from checkpoint 03. Stop broad redesign and evaluate these criteria explicitly:

1. **Brow:** one continuous skin ridge over each eye, an angry inward slope, and no detached pink strips, isolated forehead bars or visible gap through the far brow in front/side/three-quarter and windup/bite views. Dark lower brow band may be separate but must remain seated on the skin.
2. **Cheek/jaw:** a continuous gold curve from rear smile corner to chin. Gold stays inside or close to the plum head outline in the back view; no exposed white rear tooth-root ledge, abrupt shelf or floating cheek cap. Check bite and charge windup as well as rest.
3. **Neck:** a visibly narrower neck beneath the jaw, with a continuous transition into chest/shoulders. The upper neck must not read as a straight thick cylinder. Check the front reference and side neck/head relationship. Keep total front width/height near the current .469 versus reference .460, and preserve gameplay visual height within 5%.
4. **Surface:** clean gold/plum boundaries, fine low-contrast scale relief visible in close-ups, restrained plum/gold/ivory colors, and no stretched spots, hard bake seams or speckled black artifacts. Reference skin is softer and more detailed than a basic smooth material; do not claim exact lighting/color matching.
5. **No regression:** no collapsed tail/limbs, detached facial pieces, broken mouth, or new clipping in four views, turntable and retained poses. Preserve the original 29-bone rig and 12 clips, valid UV/weights, one runtime material, fallback/retry behavior, combat timings and save semantics. Run the affected structural, animation, integration and save tests on the final exact GLB hash.

Record pass/partial/fail for each criterion in checkpoint 04, with visible evidence and remaining deviations. Passing runtime checks alone cannot close the visual gate. A remaining material/shape deviation must have a concrete next action and bounded estimate, not an open-ended promise of polish.
