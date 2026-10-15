# Character overhaul checkpoint 01 — 2026-10-14 23:16 UTC

Work started about 22:56 UTC under the user's three-hour-or-longer authorization. This is a safe progress checkpoint for the parent thread, not task completion. Continue Chomp Rex until completed and validated before Stormbelly/Heavyweight, then SkyDrake. Initial three-hour window ends 2026-10-15 01:56 UTC.

## Source and protection

- Exact project: `appgprj_6acf0e7886908191820064ec6fa5afa0`.
- Checkout: `C:\Users\caser\Documents\Codex\2026-10-14\task\skyblade-current`.
- Working branch: `asset-overhaul-2026-10-14`.
- Baseline/rollback: tag `asset-overhaul-baseline-v7`, commit `20da43808501ece80ef7a72a7966f7bd68c68ba2`.
- Live Site remains version 7, owner-only/custom, one owner and zero external visitors as verified at task start. No publication or dist change during this checkpoint.
- URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site

## Real work and evidence

Blender 5.2.2 LTS is installed at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. Actual supplied Chomp concept and model-sheet pixels were inspected from the local Darren Skyblade Game folder. Reference copy is `art/references/concept_chomprex.jpg`; supplied model sheet is preserved in `chomprex/source`.

The old GLB was imported into an editable .blend and measured: 29 bones, 12 clips, 43,920 triangles. The new WIP uses authored ring surfaces, voxel union, carved sockets, quad remeshing and transferred regional weights. This is script-assisted Blender mesh authoring, not hand-sculpted final art. It is not a final reference-match claim.

- New upright body/head, long curved tail, two-finger hands, haunch/leg surfaces.
- Separate articulated lower jaw, surface-derived tooth roots, eye/nostril cavities, brows, dorsal plates and claws.
- Preserved 29-bone rig and 12 imported animation actions with retargeted rest positions.
- Repaired a failed QuadriFlow path. The builder now rejects a cancelled remesh, oversized body or nonmanifold result. Fine .024 voxel output triggered a QuadriFlow rejection despite manifold-edge checks; a .035 cleanup plus triangulation completed successfully.
- Current body: 12,180 quads / 12,182 vertices, zero nonmanifold edges.
- Complete character: 42,448 triangles, 88 Blender mesh objects, four maximum body influences, weight-sum error <= 4.48e-8, zero unweighted vertices in the exported set.
- Temporary vertex-painted plum/gold/spot materials remain unfinished; no texture atlas or normal-map bake yet.

Editable output: `chomprex/source/chomprex-overhaul-work.blend`.
Dense construction source: `chomprex/source/chomprex-sculpt-stage.blend`.
Isolated GLB probe: `chomprex/export/chomprex-probe.glb` (1,623,716 bytes). Not in dist and not production-ready.

## Checks performed and limits

Four actual Cycles geometry renders inspected; earlier iterations preserved. The current side render still exposes jaw/cheek shape and tooth-spacing issues. Eyebrows/eye direction need a stronger reference expression. Dorsal size/spacing, tail-tip shape, feet and the diffuse spot distribution need more work.

All 12 actions sampled at five times in Blender with no nonfinite deformed positions. Export contains one skin and all 12 named clips. Using the actual game-bundled Three.js r128 and GLTFLoader, the probe loads and renders, samples five times per clip (every seventh skin vertex), produces no page or WebGL errors. This is an isolated loader/animation smoke test; it is NOT gameplay, physical controller, phone, full-playthrough, visual-deformation approval or FPS coverage.

Renderer reports 89 draw calls, 42,448 triangles. Draw calls need consolidation. Export sampling shortened fractional-frame clips slightly (e.g. bite .30 -> .2916667 seconds, windup .45 -> .4166667). Correct export timing before game integration; do not change attack logic to hide this.

Reports: `chomprex/review/geometry-audit.json`, `animation-probe.json`, `export-probe-summary.json`, `three-probe.json`. Actual browser render: `three-probe.png`.

## Library visual checkpoint

`Skyblade-ChompRex-overhaul-checkpoint-01.png` saved successfully to Library:
- library_file_id: `libfile_a226b445f188819187d966066136a88f`
- file_id: `file_00000000e03481f590c9a82b4bd6a6e1`
- version: 0

Local receipt is `chomprex/review/checkpoint-01-library.json`. Windows Python cannot apply os.setxattr; the upload succeeded and its identity is retained in the JSON receipt. The board explicitly says WIP and compares actual concept pixels with actual current four-view renders.

## Next work

1. Continue Chomp: improve jaw closure/cheeks and eye/brow expression, plate rhythm, silhouette/feet; rerender exact same review views.
2. Finish deliberate UV/material/normal detail and LOD; replace temporary blurry vertex paint. Preserve editable sources.
3. Correct animation export timing, inspect deformation/contact at extrema and transitions, cleanup weights. Consolidate rigid/skinned materials to reduce draw calls without losing expressive parts.
4. Test final candidate in actual game locally with isolated saves and regression checks. Only then mark Chomp complete and advance Heavyweight/Stormbelly, then SkyDrake.
5. Preserve private Site and verify exact source/version/deployment if publishing after all requested work. Do not publish this WIP. Recheck remote concurrency before any push.

No user approval block encountered. Remaining limitations are unfinished quality and validation work. End this checkpoint turn so the parent can read it, then resume under the existing authorization; do not ask for new permission.
