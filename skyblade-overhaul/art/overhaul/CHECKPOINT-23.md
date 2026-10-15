# Candidate23 — accepted shoulder-color repair and final art assessment

Decision: accept the bounded texture repair and stop further automated art edits. Candidate22 commit `6b81733468018f58605379038f97a361a9180944` and its ZIP remain unchanged as rollback. Publication remains held. No Site or audience changes were attempted.

The pale shoulder patches persisted in unlit albedo but disappeared in a uniform clay render. An object-space feathered correction removes most of that contamination from the two existing color maps, preserving the chest plates. Actual matched idle/attack images from both sides and deterministic gameplay were inspected before acceptance. A soft shoulder transition remains; this is not a complete sculpt or likeness claim.

Only `dist/assets/skydrake-rc15.glb` changed in the isolated 46-file release. All 1,239 accessors, all 14 clips, and every non-color buffer view are byte-identical to Candidate22. No new content, geometry, normals, UVs, rig, weights, animation, controls, engine or saves changed. PNG encoding adds 819,076 bytes. Editable Blender source reopens with exact packed images and unchanged weights.

Fresh Candidate23 coverage: 250 gameplay/repair checks across isolated desktop and touch-emulated profiles, 16 checks across four deterministic ground/flight combat runs (132 captures), and 8 actual keyboard/normal-frame pause/resume checks. No physical controller/phone, complete playthrough or GPU/FPS claim. Candidate22's larger recovery/soak/deformation evidence is retained, not recounted as fresh coverage.

Accepted source: `skydrake23/source/skydrake-lod.blend`; accepted export: `skydrake23/export/skydrake-lod.glb`. Exact asset SHA-256: `f4e83252c3dd7fdaed5f0f81bf8e4b65ce0f71bb1c093d0b43a3a0d2e3cc188e`. Release: `final-local-candidate23/release`; manifest SHA-256: `6687a6f947c7bee3b4452b7517ab0232d637a669ff8076a05913e3a7ff03049e`.

Portable ZIP beside the project: `Skyblade-Final-Local-Candidate23.zip`, SHA-256 `81db9af107454023d8628f518333f6476cddc66bb191f8ba2c3a545ca1f080de`. Report: `Skyblade-Candidate23-Report.pdf`, SHA-256 `3af84312b474cde48fbb2a59b5575a7f2a103c6604d63f2de5e759242c3c5659`. Run the extracted `node serve.cjs` and open `http://127.0.0.1:4330/` in a separate browser profile. Current hosted URL remains https://darren-skyblade-reach.gosplekaiju.chatgpt.site ; project `appgprj_6acf0e7886908191820064ec6fa5afa0`. This package is not deployed.

## Decisive art handoff

`skydrake23/review/HANDOFF-23.txt` and the four-page report give exact editable sources, representative images and a concrete next session: manually reshape SkyDrake eye sockets/lids and muzzle against front/side reference views, accept those silhouettes early, then correct joint topology and rebake. The white eyes protrude, the muzzle/lids remain too rounded, wings remain thin planar surfaces, and the tail profile and extreme elbow/hip creases still differ. Chomp's muzzle/forehead, wrinkles and teeth, plus Stormbelly's expression, lower jaw/lip and grooves remain approximate. Blender is installed and sufficient; no missing references or tool capability is claimed. The remaining requirement is authored mesh quality and all-clip validation, not a new design decision. Do not promote rejected full-resolution Candidate22 trials or repeat broad weight diffusion. Accepted full-resolution fallback remains SkyDrake15.

## Library block

The current Library skill and all three current helpers were refreshed. Both prepared upload tools were advertised. A single attempt to run the required helper for the exact ZIP and PDF was rejected by automatic approval review **before execution**: it classified upload to Library as external/persistent disclosure and found no explicit upload authorization. The helper did not run, no upload outcome is uncertain, and no bypass or retry was attempted. This is an approval block, not proof that the current helper capability is unavailable. Explicit authorization to save these two artifacts to Library is needed before another attempt. Local deliverables and publication hold are unaffected.

The exact ZIP was extracted and launched using its included server. Fresh-profile actual Start reached play, the served model hash matched, player coordinates were finite and no page errors occurred. See review/portable-zip-smoke-23.json.
