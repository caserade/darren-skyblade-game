# Checkpoint 13 — experimental shoulder retopology; not accepted

This is a safe work checkpoint, **not a replacement for checkpoint 12**. The new arm loops are closed, rigged and runtime-tested, but a fan-shaped armpit crease remains visible in ordinary walking and raised-arm attacks, including clay renders. The visual gate failed. Do not integrate or publish these exports.

Work began 2026-10-15 04:42 UTC. The PC transport failed once around 05:03; an image read recovered at 05:03:25 and a subsequent shell/file/Git read confirmed reconnection. Saved full/reduced Blender sources reopened successfully. No unsaved work loss was observed.

## Saved work

- Rollback: `4b80fab92c6060128509d9ba2e303290c0501162` (checkpoint 12). No tracked baseline files were changed by the experiment.
- Editable full and reduced sources: `skydrake13/source/skydrake-candidate.blend`, `skydrake-lod.blend`. Copies of checkpoint 12 sources are retained beside them.
- New ordered shoulder, upper-arm, elbow and forearm loops replace 1,544 left and 1,190 right source faces. The torso and wrist borders remain connected. The torso-side boundary has a local weight transition; imported custom normals are retained outside the affected region.
- The full rebuild retains all 39 bone names/bind matrices and all 1,638 authored tracks across the original 14 clips exactly. Protected full-mesh submesh positions, UVs and weights remain unchanged; normal roundtrip tolerance is 0.002.
- A 512px shoulder color transfer and separately evaluated 1024px reduced body bake are saved with PNG masters. The full model now has 45,291 triangles; reduced 25,815. Both use 12 draw primitives and three maps. This is an additional draw/material/map over checkpoint 12, not an accepted performance improvement.
- `review/SkyDrake-checkpoint-13-comparison.png` shows the supplied turnaround, matched walk/attack views, clay diagnostic and actual combat-camera views. `review/pose-comparison-13` and `review/pose-comparison-13-clay` each contain 24 matched captures.

## Verification and limits

The final exports passed 160 structural checks, 43 targeted rig/geometry checks, 112 encounter checks, 70 delayed/failed/interrupted loading checks, 162 gait checks, 24 controlled combat-flow checks, 10 actual localhost preview checks and two wing attachment diagnostics. Gait coverage includes seven 60Hz scenarios plus straight pursuit at 30/120Hz for full and reduced models. Six repeated encounter cleanup cycles per model kept resource counts stable at 81 geometries/15 textures.

The unchanged `serve.cjs /?qa=1` baseline returned 60/61 initially: “Committed charge moves forward and sideways dodge avoids bite” failed. A fresh repeat passed 61/61 with no browser errors. Both results are retained. This intermittent baseline assertion was not hidden or treated as a candidate fix.

Tests use isolated Chromium profiles and scripted update flows. No physical controller, phone or full playthrough coverage is claimed. The high-swoop camera still loses useful framing; the late swoop is visible, but that does not clear the whole flight cycle. Camera behavior is unchanged. Controlled combat uses a scene seed and per-frame seed so model UUID allocation cannot perturb gameplay random choices.

The full/reduced exports, scripts and reports are local only. Private live Site `appgprj_6acf0e7886908191820064ec6fa5afa0` was read again: active v7, custom audience with one owner, zero groups and zero external visitors. No source push, version save or deployment occurred.

## Remaining work

Rebuild the torso-to-socket transition with explicit front/back armpit support topology. The current wide boundary-to-ring bridge still forms a fan; tangent adjustment and local fairing did not clear it. Validate the untextured joint in walk, attack and recovery before another texture/LOD bake. Preserve the successful wing and spine geometry and checkpoint-12 fallback. Estimated further focused work: 45–60 minutes, followed by the same visual and runtime gates; this is an estimate, not a promise of acceptance.

The authoritative hashes and evidence currency checks are in `skydrake13/review/checkpoint-verification-13.json`. Its technical evidence result is separate from `visualGatePassed: false`. Full combat and gait capture sets remain on this PC; Git retains their reports plus representative combat views, all matched pose/clay views and the comparison sheet. Redundant Blender backup files also remain local and ignored.
