# Checkpoint 20 — Stormbelly refinement and final local candidate

**Retain the conservative Stormbelly refinement locally. Publication remains held.** The final app combines accepted Chomp19, this Stormbelly20 mesh, and the accepted SkyDrake15 mesh on the RC16 startup-safe application. It adds no content or gameplay systems.

This bounded pass began at 08:58:15 UTC on October 15, 2026, from commit `7280c025bb821b4a97022b30e926653958585c86`. The external final receipt records completion and the resulting commit. Source: the existing `skyblade-current` project, branch `asset-overhaul-2026-10-14`. The exact existing hosting project remains `appgprj_6acf0e7886908191820064ec6fa5afa0`.

## Visual decision

The actual supplied pixels in `art/references/concept_heavyweight.jpg` were inspected. SHA-256: `c5d7840e646a474895f84321a01b5d9b1a2d5ade559ddd69257aceac0e1fcb81`. Front, profile and three-quarter comparisons use the same model camera, lighting, pose and color management before/after. The illustration has a different projection and lighting; these are visual comparisons, not a calibrated likeness score.

- Rounded and shortened the existing pale chin, fading the adjustment toward its anchored rear hinge. Existing tusks follow the local jaw change.
- Swept the distal horn portions backward and slightly downward, preserving their roots and topology. The difference is clearest in profile and three-quarter views.
- Applied a small local upper/lower eyelid adjustment and coherently reduced/recessed the existing eye components. This is a subtle coverage improvement, not a solved eye anatomy match.
- Rejected stronger eye rotations: they exposed a hollow gap below the eye. Rejected a coordinated socket rotation after the geometry audit detected folded/reversed brow triangles. Saved recipes and diagnostic reports remain under `stormbelly20/review/study-*`; none of those rejected GLBs enter the final package.

The final model still differs from the art in eye orientation and socket shape, brow/nostril anatomy, jaw-to-cheek joining, horn curvature/detail, body proportions and surface markings. The body was outside this pass. No new sculpted parts, textures, rig, clips, combat or save changes were introduced. Full and reduced meshes retain 33 bones, 13 clips, one primitive, and respectively 56,852 / 31,268 triangles. All non-position/normal buffer data are identical to checkpoint08. Body vertices below the face remain unchanged.

## Verification

- Both meshes pass finite/unit-normal, unchanged skin/animation/UV/index/material/texture bytes, and no collapsed/reversed rest-triangle checks. Minimum deformation Jacobian is positive (0.6964). The strongest local horn bend has a reduced-mesh minimum triangle area ratio of 0.3523; it was inspected visually, not treated as proof of universal intersection safety.
- 2,132 poses: all 13 clips at 41 samples, full/reduced, before/after. Every sampled skinned vertex is finite. Floor clearance, global peak/p99 edge stretch and measured jaw-hinge separation are unchanged. Changed facial edges have at most 0.0683% greater peak stretch and 0.0434% greater p99 stretch. Existing extreme deformation elsewhere remains.
- Twelve production-adapter gait scenarios, full/reduced: straight pursuit, stop/resume, turning, stationary turning, stomp interruption and stagger interruption. All 96 checks pass, including floor clearance, planted-foot stability, reachable targets and preserved pursuit speed.
- 250 runtime/repair checks and 340 repeated/interrupted-flow checks pass in fresh desktop and portrait touch-emulated profiles. These cover the existing runtime/repair suites, repeated encounters, pause/dialogue, travel, disposal, keyboard/blur, save/reload/Continue and a separate storage sentinel. Accelerated simulation is not a manual playthrough.
- 72 matching inspection renders, 72 expression-sequence captures, 72 additional slam/impact captures, 26 candidate clip poses, six gameplay runs with 42 captures, 60 gait captures, and 64 horn-orbit captures at eight yaw angles and two elevations. The full/reduced horn roots and swept tips show no new visible rupture in those reviewed views. The death expression camera follows the unchanged head-bone transform to keep the falling face visible; the transform is identical before/after.
- Editable Blender copies were saved and reopened. All 5,215 full / 2,399 reduced mapped source positions match, preserving bones, actions/keyframes, weights, UVs and topology. Optional thumbnail-cache writes outside the workspace failed; source save/reopen checks passed. The tested GLBs are the appearance authority, not an arbitrary later re-export.

No physical controller/phone, hardware FPS, full playthrough or continuous-collision coverage is claimed. The existing landscape HUD crowding is visible before and after and is deferred to a later functional pass. At the normal gameplay camera, facial differences are small, especially in portrait.

## Exact deliverable and rollback

The clearly named app is `final-local-candidate20/release/dist`. Its 45-file manifest differs from Chomp19 only at `dist/assets/stormbelly-rc15.glb`.

- Manifest SHA-256: `efad8f993d8e949cbecac0a00a4982d5982cd67069155f56e7640308b99c75c1`.
- Full Stormbelly GLB: `f24442408b38b84920e35185dfe75e5d9db7e851cab42f95f10ab6debc472dc4`.
- Runtime/reduced Stormbelly GLB: `bb3292e2a2c69ebbf4be7ff03e7b4bae9da73192c42b4461cdca16e84e855c05`.
- Chomp19, Chomp18 and sealed RC16 app trees and ZIPs remain unchanged fallbacks. Existing root `dist` is not this final candidate.

The portable deliverable is `Skyblade-Final-Local-Candidate20.zip` beside the project. Extract it and run `node serve.cjs`, then open `http://127.0.0.1:4327/` in a separate browser profile. The launcher binds only to loopback. Source recipes and editable Blender files remain in Git under `art/overhaul/stormbelly20` and `art/overhaul/scripts`; the ZIP contains the playable app and review evidence.

No publication or Library upload was attempted. The live URL remains `https://darren-skyblade-reach.gosplekaiju.chatgpt.site`, last verified as version7, custom owner-only, one owner and no external visitors. That earlier access observation was not rechecked during this local character pass. This candidate is not live. No approval block was bypassed; publication is held by instruction.
