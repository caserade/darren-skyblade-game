# Checkpoint 18 — bounded Chomp Rex refinement

**Decision: keep this limited refinement as a separate local candidate.** The tightened grin reads better at normal gameplay distance, the upper thighs are closer to the supplied front silhouette, and the eye spacing moves modestly toward the reference. It is not an art-complete model. Sealed RC16 remains the safe fallback; nothing was published.

This pass began at 07:29 UTC on October 15, 2026. It works only on Chomp Rex, using the actual supplied `art/references/concept_chomprex.jpg` front, side and three-quarter pixels. The accepted rigs, clips, other characters and gameplay are preserved. Matching rendered views use the same cameras, lights, scale and animation time before/after; the supplied illustration has a different pose/projection, so measurements are diagnostic rather than a likeness score.

## What changed and what the evidence shows

- Narrowed the foremost muzzle relative to the grin, developed the cheek transition, raised the forward lower jaw slightly, broadened the upper tooth crowns modestly and kept the lower teeth inside the gold lip. The result reads more like a closed grin instead of the previous open mouth. Individual tooth shapes, the gum/lip connection and cheek curvature still differ from the art.
- Moved the outer eye region inward conservatively while preserving the dense inner brow crease. In the height-normalized front render, heuristic iris-center separation changes from **0.196 to 0.173**, toward the reference's **0.092**. The remaining gap is substantial; this is partial progress, not a matched face.
- Added modest upper-thigh and forward-belly volume. Front silhouette width/height changes from **0.470 to 0.488**, against **0.489** in the reference. Width at 60% of height from the top changes from **0.421 to 0.456**, against **0.451**. The lower-leg width at 85% remains **0.375**, versus reference **0.297**, and is an acknowledged remaining difference. Feet, total height and ground clearance were preserved.
- Existing colors, patterns, normal/roughness textures and UVs are unchanged. These are geometry refinements, not a new texture or content pass. Both variants keep their existing triangle counts: full **61,789**, reduced **33,983**, one primitive, 29 bones and 12 clips.

Inspect `chomp18/review/boards/Chomp18-face-comparison.png`, `Chomp18-body-comparison.png`, `Chomp18-gameplay-comparison.png` and `Chomp18-motion-contact.png`. The first two include actual supplied reference crops. Board provenance records original input hashes. The gameplay board shows sealed RC16 versus the exact isolated candidate with the existing HUD and normal gameplay camera. The tighter grin remains visible at desktop gameplay distance; fine face differences become much harder to distinguish in the small portrait view.

`reference-measurements-18.json` contains the silhouette/iris method and all measured rows. `grin-measurement-18.json` records a 9.5% reduction in dark burgundy pixels within a fixed mouth crop. That heuristic is sensitive to the wider lip and does not prove tooth contact or artistic likeness; the actual matched images are the primary grin evidence.

## Regression safety and rejected approaches

The final candidate changes only position/normal buffers and their position bounds. All other GLB buffer views and rig, animation, weight, UV, index, material and texture definitions remain identical to the accepted Chomp exports. Both meshes have finite unit normals, unchanged height/ground bounds and no collapsed or oppositely facing rest triangles under the comparison check.

An early thigh adjustment driven by uneven skin weights produced small surface folds; it was rejected and replaced by smooth spatial selection. An aggressive eye compression increased bite-windup peak edge stretch by roughly 25%; it was also rejected. The retained smaller outer-eye translation leaves the inner brow crease in place. Final bite-windup maximum stretch changes from **2.696 to 2.740** in the full mesh (+1.6%) and **2.443 to 2.461** in the reduced mesh (+0.7%). Sampled cheek-hinge gap increase is lower than before. These edge ratios are diagnostics, not a promise of zero self-intersection. Existing extreme animation stretch remains.

Verification on final hashes:

- **250/250** aggregate runtime/repair checks on the exact reduced-mesh package at desktop and mobile-sized touch emulation.
- **340/340** repeated-flow checks: two isolated profiles, ten cycles each, interrupted encounters, actual pause/dialogue, disposal, travel, movement/focus reset, save, reload and Continue. No user save was accessed. This is ten minutes of accelerated encounter simulation, not a full playthrough.
- All **12 unchanged clips at 25 sample times** for full/reduced before/after geometry: **1,200 sampled poses**, every skinned vertex checked for finiteness, and all indexed triangle edges measured. The 24 final representative pose renders and matched mouth close-ups were inspected.
- Six actual-package visual runs across desktop, portrait and landscape touch emulation, with matching deterministic scene/input setup. All reached warning, attack and recovery without runtime errors. Physical controller/phone behavior and hardware FPS remain unverified.
- Both updated Blender sources were saved and reopened. All **25,000 full / 13,678 reduced** mapped source positions match the final mesh positions. Their rig, action keyframes, weights, UVs and topology signatures are unchanged. The earlier source synchronization check used double-precision mapping values and falsely reported rounded-coordinate mismatches; mapping now uses the actual float32 exported positions, with zero missing positions. The rejected diagnostic is retained.

The original body/neck/lower-leg likeness, sculpted eye sockets and eyelids, curved cheek anatomy, nostril rims, tooth shapes and fine surface detail remain limitations. The landscape HUD is crowded in both before and after captures; this Chomp-only pass does not alter it. The model changes add no triangles, textures, draw calls or animation tracks. No new physical-device performance claim is made.

## Exact candidate and editing continuity

Base app commit: `af98739877d97a021e3afc7feda137f1ec5865bc` (sealed RC16).

| Artifact | SHA256 |
| --- | --- |
| Full Chomp GLB | `11947ed9f9840f471adbf3b51e5c5c9e06e19183c4cbf3e375f6e71bdceacb14` |
| Reduced Chomp GLB | `a43f529fe534dbcb105f62da9c72b907d5d82c816c174853eb10eef6404a0ec2` |
| Candidate package manifest | `a373e895bc4c9a9193eb06d81c50838795d9cb025288998b61fc8dc4a5b73d05` |

The isolated package is `chomp18/release/`. Its only changed app file relative to RC16 is **`dist/assets/chomprex.glb`**. No gameplay script, chapter data, camera, HUD, save key, loader, engine dependency, other creature asset or hosting ID changes. The project remains `appgprj_6acf0e7886908191820064ec6fa5afa0`.

Editable full/reduced sources: `chomp18/source/chomprex-candidate.blend` and `chomp18/source/chomprex-lod.blend`. Exports: `chomp18/export/chomprex-candidate.glb` and `chomp18/export/chomprex-lod.glb`. Exact source hashes are recorded in `source-sync-18.json`. The GLBs are authoritative for the tested runtime appearance; Blender source geometry is synchronized, but arbitrary re-export can change generated normals and serialized animation data, so validate any future export before substitution.

The reproducible scripts are `inspect_chomp_features18.py` (identify the existing tooth components), `refine_chomp18.py` (bounded position/normal transformation from the unchanged accepted exports), `sync_chomp_sources18.py` (apply float32 positions to copies of the accepted sources) and `build_chomp_release18.py` (derive a separate package from sealed RC16). These recipes deliberately start from accepted baseline files and will overwrite their own checkpoint 18 outputs. Do not run them over later hand edits without first creating a new candidate directory. Do not rerun the old import/build pipeline over accepted sources.

All reports, editable sources, exports, curated boards and their input reference views are versioned. Additional reproducible full-resolution captures remain local and are excluded from Git; they are not packaged as game assets.

## Play, fallback and next useful work

From the project root, run:

```powershell
node art/overhaul/scripts/serve_chomp18.cjs
```

Open **http://127.0.0.1:4325/**. The portable `../Skyblade-Chomp18-local.zip` can be extracted and served from its directory with `python -m http.server 4325 --bind 127.0.0.1 --directory dist`. Do not open the HTML directly. The test server is stopped after verification.

RC16's nested package, its original commit and `../Skyblade-RC16-local.zip` remain unchanged. Its ZIP SHA256 is `109e422ee8da7354b7f7206f7ce302d30c82689c95a194339870a76713e40a2b`; use `node art/overhaul/scripts/serve_release16.cjs` on port 4324 for that fallback. No publication or Library write occurred. The existing private Site URL remains https://darren-skyblade-reach.gosplekaiju.chatgpt.site ; unpublished checkpoint 18 is not on that URL.

**Further effort is justified only as targeted authored surface work:** reshape the eye sockets/lids and cheek/lip transition against the supplied three views, then validate brow/jaw deformation. Further broad coordinate squeezing is not justified by these experiments; it risks distortion for small likeness gains. A complete reference match would also need more faithful tooth crowns, lower-leg proportions and sculpt detail. This checkpoint keeps the visible, tested improvement without labeling it a finished art overhaul.
