# Checkpoint 09 — SkyDrake local repair and visual review

SkyDrake-only phase began 2026-10-15 02:41:50 UTC. This checkpoint preserves Stormbelly checkpoint 08 (`08b9e67183f2cede3cdc161002092b56e99d954e`) and Chomp. No publication, engine migration or new game content. The commit containing this report is the reviewable checkpoint; the exact commit is reported in the handoff.

## Verified changes

- Removed duplicate vertex color multiplication of the supplied blue/pale texture atlas. The original atlas remains embedded; the candidate no longer renders with the excessive dark-blue tint.
- Widened the existing head, strengthened the brow/eye/fang shapes, rebuilt segmented gold horns and three scalloped wing panels with dark ribs, and shortened the existing tail with an upward hook and arrow tip. These are reference-led approximations, not a final match.
- Smoothed existing body weights across connected mesh edges and coincident UV-seam neighborhoods; seam duplicates retain identical weights. The before-weight candidate's worst per-frame 99th-percentile edge ratio falls from 3.337 to 2.154. The absolute worst edge remains about 9.5x; some individual clip maxima are worse. Extreme deformation remains an explicit open gate.
- Corrected grounded foot clearance through landing, recovery and interrupted blends using animated foot vertices. The tested full/reduced cycle has a minimum grounded mesh height of +0.003 game units, with at most 0.121 units of visual correction. Collider, AI, movement and damage timing are unchanged.
- Removed duplicate procedural tilt/squash from this skinned candidate, dispatched its existing death action inside the unchanged 16-tick removal window, and aligned recovery playback with the existing recovery window.
- Added candidate-only timeout/retry/late-completion cleanup with the original visible SkyDrake as fallback. Cache resources and independent cloned skeletons survive repeated encounters correctly.

## Exact deliverables

| File | SHA-256 | Size / geometry |
|---|---|---|
| Full GLB | `746c3dfda1f793c714f4e3db79fe9985f61840e4bff75a32d0a92b4b10774a6d` | 3,268,360 bytes; 42,458 triangles |
| Reduced GLB | `55e090eb10b0da5f05fc1b92e6a84e6cbfd2116d139b3d64179f0e9f053e554f` | 2,672,748 bytes; 24,201 triangles |
| Runtime adapter | `6e6dc53674a4791fa3d6d6e3b3b500ef913589e47f7d429c039e03d2d330a406` | `scripts/skydrake-local-adapter09.js` |

Both exports retain the original 39 bones and 14 clip names/durations. Editable full/reduced Blender sources, supplied source GLBs and generator files are under `skydrake/source`. Provenance hashes, including both actually inspected reference images, are in `skydrake/review/checkpoint-verification-09.json`.

The original source was found in `C:/Users/caser/Downloads/Darren-Skyblade/Darren Skyblade Game`; it was copied, not modified. Current project: `C:/Users/caser/Documents/Codex/2026-10-14/task/skyblade-current`, branch `asset-overhaul-2026-10-14`.

## Verification

- 56 gameplay checks per size: 112 passed. Includes warning/hit/dodge timing, independent skeletons, all clips, pause/dialogue, death cleanup, den respawn, chapter return and four interrupted transitions per size.
- 70 loading/save checks passed across delayed, failed, corrupt, incomplete and timed-out loads; isolated profiles, save byte sentinels, reload/continue and recovery backup behavior.
- 10 actual 600-frame cycle checks passed across full/reduced variants, plus 10 checks through the real local candidate preview server.
- Actual existing `serve.cjs /?qa=1`: 61/61 passed. Total functional/runtime assertions: **263**.
- 148 structural mesh/clip checks passed, 26 hash/scope checks passed, and 41 samples of every clip per size contained no nonfinite geometry. All reports bind to the exact final assets.
- 50 motion views, four same-camera comparison views per mesh, and actual Gale Spires flight/landing screenshots retained. Final close-up seam review inspected attack and tail-sweep poses.
- Six encounter/cleanup cycles per size retained a stable 80 geometries / 14 textures in the test scene.
- 10 new JavaScript files passed syntax checks. Windows headless Chromium only; no physical controller/phone, full-playthrough or physical-device FPS claim.

Rendered draw calls decrease from 68 to 11. The reduced mesh has 24,201 triangles versus live v7's 30,599; full has 42,458. Candidate downloads are larger than the original 1,516,860-byte reduced source. Do not describe this as a measured across-device FPS improvement.

## Visual evidence and open gates

[Comparison board](skydrake/review/SkyDrake-checkpoint-09-comparison.png) includes actual supplied concept pixels and current-v7/full/reduced renders. Saved to Library as `SkyDrake-checkpoint-09-comparison.png`, `libfile_34c14a27440881919b2252a06309eb1b`, version 0; file `file_000000005f408210b1b3009c2fed28d0`. Library save succeeded. Windows local extended attributes are unsupported; the receipt preserves identity.

[Visual gates](VISUAL-GATES-SKYDRAKE.md) remain partial for broad belly plates, fine scale style, neck/haunch/foot proportions, wing curvature, thin tail-arrow profile, extreme deformation and planted ground gait. The existing short defeat window limits death readability. Full/reduced functionality passes; final art and the combined candidate-cast review do not yet pass.

## Private Site and local play

Project ID remains `appgprj_6acf0e7886908191820064ec6fa5afa0`. Read-only verification at 02:58:44 UTC confirmed active version 7, custom access with one owner, no groups and zero external visitors. Live URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site — this URL serves the unchanged live version, not checkpoint 09.

For local candidate play, run `node art/overhaul/scripts/serve_skydrake09.cjs` from the project root and open `http://127.0.0.1:4319/` (reduced) or `?variant=full`. It injects the adapter only in memory and uses a separate storage origin. Test servers were stopped after verification. No source push, saved Site version or deployment was attempted. Combined cast review is the remaining prerequisite requested by the parent; no approval action is blocked.
