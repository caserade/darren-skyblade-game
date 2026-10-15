# Checkpoint 14 — shoulder support repair, cast review and high-flight camera

This local checkpoint passes the scoped shoulder-support and high-flight framing gates. It derives from checkpoint 12, not the failed checkpoint 13 mesh. Work began 2026-10-15 at 05:18 UTC. No publication is authorized or performed.

## Concrete changes

- Reoriented the shoulder collar sideways instead of along the downward arm axis. The old orientation pulled the lower transition into the torso. Added curved upper-arm support and smoothed the retained cut boundary with its adjacent support ring; the maximum retained-boundary displacement is 0.055863 model units. Refined chest/arm weights at the collar to remove the raised-arm socket notch.
- Validated clay and textured ordinary/extreme poses before LOD work. The prior sharp fan and armpit teeth are removed in the inspected views; a soft armpit fold remains. Final main, opposite and rear views each cover all 14 clip samples, with checkpoint 12, full 14 and reduced 14, in both clay and textured rendering: 252 captures.
- Transferred original surface color onto the new 512px shoulder patch. Rebuilt the reduced body bake against the final reduced geometry. Both exports have closed skin/patch edges and zero coincident-weight disagreement. Original rig names, bind matrices and all 1,638 tracks across 14 clips are retained exactly. Other protected full-mesh materials retain positions/UVs/weights; normal roundtrip tolerance is 0.002.
- Added a **local-only** camera overlay that frames Darren and an elevated locked SkyDrake together. It retains the original input, FOV and obstacle constraint, eases back on landing, and clears its state on unlock, death, dialogue or other targets. The production camera file is unchanged.
- Added an opt-in combined local preview for Chomp checkpoint 05, Stormbelly checkpoint 08, SkyDrake checkpoint 14 and the camera overlay. Chomp, Stormbelly and Darren source/assets are unchanged. No content, encounter placement, gameplay timing, save format, engine or audience changes.

## Verification

| Coverage | Result |
| --- | --- |
| Full/reduced encounter integration | 112/112 checks; six repeated cleanup cycles per variant remain at 81 geometries/15 textures |
| Delayed, failed, retry and interrupted loading | 70/70 |
| Gait | 162/162 across seven 60Hz scenarios and straight pursuit at 30/120Hz, both variants |
| Deterministic ground/flight combat comparison | 24/24; same gameplay and original-camera paths for checkpoint 12/full 14/LOD 14 |
| Actual localhost combined preview | 16/16; both variants load the correct three rigs and camera overlay |
| Actual unchanged `serve.cjs /?qa=1` | 61/61, no page errors |
| GLB structure and targeted preservation | 160 structural + 45 targeted checks pass |
| Editable Blender sources | Both reopen; all used textures packed; 10/10 checks |
| Wing attachment diagnostics | 2/2, through all 14 clips |
| Authored motion scan | 574 all-vertex samples per variant, all finite; quality limitations below |
| Camera | 32 run checks + 13 lifecycle checks; actual skinned screen bounds in eight deterministic runs |
| Integrated cast | 16/16; all three reach warning/attack/recovery in six-second runs, four recreate cycles stable |

For full and reduced assets, in landscape 1280×900 and simulated portrait 500×900, the new camera contains both full meshes in **41/41 sampled elevated-flight frames per run**. The original camera contains the entire SkyDrake in **0/41** of those frames. Darren stays in view. Same-seed before/after paths, states and player-health samples match. The synthetic obstacle test shortens camera distance from 16.20m to 9.17m. This is sampled, controlled coverage, not every arena/camera configuration.

Test-harness corrections are disclosed: initially copied probes referenced adapter13 and were invalid; affected probes were rerun with adapter14. The first camera-lifecycle harness supplied a fraction of a pixel while expecting a large mouse-orbit change; its failed report is retained, and the corrected 80px/35px input test passes. The lineup inspection camera initially used an absent island-height field; corrected finite camera coordinates were used for the retained screenshots. These were review-harness defects, not claimed game fixes.

## Evidence and limitations

- `skydrake14/review/SkyDrake-checkpoint-14-comparison.png`: actual supplied turnaround plus checkpoint 12/full 14/LOD 14 textured and clay comparisons.
- `skydrake14/review/Skyblade-camera-14-comparison.png`: high-flight camera before/after from actual game updates.
- `skydrake14/review/Skyblade-cast-14-comparison.png`: existing cast at existing scales; inspection camera clearly distinguished from gameplay camera.
- `skydrake14/review/checkpoint-verification-14.json`: hashes and evidence-currency checks. Complete replay captures remain on this PC; representative frames, all pose comparisons and reports are versioned.

The supplied SkyDrake, Chomp and Heavyweight turnaround pixels were inspected. No substitute designs were invented. Exact likeness, fine scales/wrinkles, soft underarm folds and extreme folded-wing appearance remain approximate. Full-mesh maximum edge stretch is 4.703x at the existing hip/tail blend, outside the repaired shoulder. Raw authored windup/landing poses dip below the origin; runtime elevation/foot support is checked separately. Pursuit-to-takeoff has a small 2.54mm sampled foot dip within the existing 5mm tolerance. Small ground/early-takeoff upper-screen cropping remains. No physical controller, phone, full playthrough, all-terrain or hardware-FPS claim.

The repair costs geometry/material budget: full 46,123 triangles and reduced 26,289, with 12 draw primitives and three embedded images (two 1024px maps plus one 512px patch). Full checkpoint 12 was 43,057 triangles/11 primitives. This is a visual repair with an explicit cost, not a performance improvement. Reduced is 43% fewer triangles than full. Existing resource cleanup remains stable. A local camera-only CPU microbenchmark (500 warmup updates, thirty batches of 300, rendering excluded) measured median update cost 0.0010ms baseline versus 0.00233ms with the overlay; enabled p95 batch mean was 0.00333ms. These tiny timings are browser measurements, not hardware-FPS guarantees.

## Exact deliverable and rollback

- Full GLB: `skydrake14/export/skydrake-candidate.glb`, 3,740,176 bytes, SHA-256 `053ec1536505dfd2d20cb8161c5b6457fb2c5009dd9af885b69beb210064001d`.
- Reduced GLB: `skydrake14/export/skydrake-lod.glb`, 3,075,520 bytes, SHA-256 `7303ca4f633505d113329eb13a616f96e9e9a5e64141771a93e0e44922a72f62`.
- Runtime adapter SHA-256: `a2827123962682ffb8b08bddc19718391f17552c3e4cbec2b5fb7d7bed3656d1`; behavior is identical to checkpoint 12 after namespace normalization.
- Camera overlay SHA-256: `6b595adadce0e7fbed136783f74f69fe6dd57a466197e1aa0af22625e8e92fee`.
- Accepted rollback: checkpoint 12 `4b80fab92c6060128509d9ba2e303290c0501162`.
- Failed13 is preserved separately at `c132613d677f3f2726bdf1a56a1e26415fdbf0a2` and is not used as the new source/default preview.
- Branch: `asset-overhaul-2026-10-14`; all checkpoint14 changes are under `art/overhaul/`. `dist` and `.openai/hosting.json` are unchanged.

Start `node art/overhaul/scripts/serve_skydrake14.cjs`, then open `http://127.0.0.1:4321/?cast=1&camera=1`; add `&variant=full` for full models. The review server uses a separate save origin and injects adapters in memory.

Live Site `appgprj_6acf0e7886908191820064ec6fa5afa0` remains active **version 7**, custom access with one owner, zero groups and zero external visitors. No source push, version save, deployment or access mutation occurred. Playable live URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site — unchanged private v7; this checkpoint is local only.
