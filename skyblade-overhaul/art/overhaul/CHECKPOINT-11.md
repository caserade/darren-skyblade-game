# Checkpoint 11 — SkyDrake shoulder/hip weights and wing borders

Local, unpublished continuation of checkpoint 10, begun 2026-10-15 03:43:10 UTC. Rollback: `2a6814e97c07186bff7e23aaffbdf42e5f797ef6`. The exact commit containing this report is in the handoff. Checkpoint 10, Stormbelly, Chomp, live `dist` and `.openai` are unchanged. No new game content.

## Retained repairs

- Redirected inappropriate thigh/shin influence above the hips into the torso chain. Protected the forward hand region, consolidated competing central-bone weights at the shoulder, smoothed the transition across welded UV seams and retained checkpoint-10 lower-leg weights. This reduces pulling at the fused arm/haunch junction while preserving the corrected gait.
- Removed the duplicate straight outer wing ribs. The membrane edge now follows the curved leading border at matching sample positions, with tapered rib ends and consistent skin weights. The initial suspicion of separated tips was disproved: checkpoint-10 tips already coincided. The visible spur was caused by the duplicated/offset outer border, not a tip gap.
- Gave the existing dorsal spines a tapered cross-section. They are more legible from behind while preserving the side silhouette and bone attachments. Their stacked, angular appearance still approximates the fuller concept forms.
- Preserved all 39 bones and 14 original clip names/durations. The runtime adapter is behaviorally identical to checkpoint 10 after namespace renaming; no gait, AI, collider, damage window, save or controller changes.

Both supplied reference images were inspected directly. `art/references/concept_skydrake.jpg` remains the design authority; `skydrake_model_sheet.jpg` supplies the secondary model/pose context. This checkpoint does not claim a final match to the concept.

## Motion evidence and limits

Same-time authored-pose comparisons distinguish common idle/walk/flight clips from attack, hit, tail-whip and death extremes. Actual Gale Spires runs and controlled pursuit through the existing player update and lock-on camera supplement the close-ups. No gross new seam openings were observed in the sampled ordinary views; localized shoulder/hip pulling remains visible at extreme close-up poses.

| Full-mesh clip | Checkpoint 10 maximum edge stretch | Checkpoint 11 | Maximum per-frame p99, 10 → 11 |
|---|---:|---:|---:|
| Walk | 3.837x | 2.783x | 1.441 → 1.392 |
| Fly idle | 3.884x | 3.253x | 1.517 → 1.460 |
| Land | 3.180x | 2.554x | 1.359 → 1.321 |
| Attack | 8.430x | 5.643x | 2.137 → 2.027 |
| Tail whip | 6.423x | 3.855x | 1.370 → 1.546 |
| Death | 4.046x | 4.355x | 1.447 → 1.416 |

The worst attack ratio falls about 33%, but this is not an across-the-board improvement: death/idle/recovery maxima and some tail/turn p99 values rise modestly. These are edge-length diagnostics on edges longer than 0.015 units, not aesthetic scores. The extreme-deformation gate remains partial. Full and reduced audits sample 41 times across every clip; no nonfinite geometry occurs.

Wing measurements cover 14 clips at 41 times: six tip pairs plus ten curved-edge samples on the full candidate, six tip pairs on reduced. Maximum centroid discrepancy is below `1e-8` units full and `0.000558` reduced. This validates the sampled border continuity; organic membrane folding remains an art approximation.

## Rejected work

A broad-plate bake was tested twice. It exposed UV-seam displacement, patch boundaries and residual double lines. It was rejected rather than included as polish. **The final exports retain the exact original color and normal atlas bytes and original belly surface.** `skydrake11/review/rejected-plate-bake.png` is explicitly discarded evidence. Broad clean belly plates and the concept's fine scale style remain open.

## Exact deliverables

Project: `C:/Users/caser/Documents/Codex/2026-10-14/task/skyblade-current`; branch `asset-overhaul-2026-10-14`. Editable sources and supplied GLB/generator copies are under `art/overhaul/skydrake11/source`. Original source in `C:/Users/caser/Downloads/Darren-Skyblade/Darren Skyblade Game` was not modified.

| Deliverable | SHA-256 | Bytes / geometry |
|---|---|---|
| Full GLB | `5ea2ae3a32031b714f884d23ef5341da05ec6bbb7241e5521c78e44f1ab8e291` | 3,300,048 / 43,057 triangles |
| Reduced GLB | `f704a105b19b4de694401e60a2c00fac4750fcfa9839a63ee237cf426b7c3d1d` | 2,695,340 / 24,541 triangles |
| Local adapter | `e941ebbf1d198f1ec13af85d2cf15f751650785caa0bf38ac9078c995a054d4a` | `scripts/skydrake-local-adapter11.js` |

Both variants remain at 11 draw calls. Relative to checkpoint 10, the full mesh adds 440 triangles / 14,812 bytes; reduced adds 251 triangles / 8,220 bytes. No FPS improvement is claimed.

## Verification

- 425 regression assertions pass: 112 full/reduced gameplay checks, 70 loading/save checks, 10 flight-cycle checks, 10 real local-preview checks, existing real `serve.cjs /?qa=1` 61/61, and 162 gait assertions across 18 runs.
- Another 18 assertions pass in two controlled player-camera pursuit captures; two wing-border continuity checks pass.
- 148 structural checks and 77 hash/provenance/scope checks pass. They verify exact exports, original atlas retention, unchanged adapter behavior, prior checkpoints and the other characters.
- Syntax validation passes for 15 JavaScript and six Python scripts.
- Gait covers straight pursuit, turns, stop/resume, stationary turning, tail attack, stagger and takeoff at 60 Hz, plus straight pursuit at 30/120 Hz, for both sizes. Straight pursuit remains 6.9 units over three seconds; planted contact measurements match checkpoint 10. These are simulation rates, not device FPS claims.
- Repeated/interrupted flows include warning/hit/dodge timing, pause/dialogue, den respawn, chapter return, death cleanup, failed/corrupt/incomplete/delayed/timed-out loads, reload/continue and save-recovery backups in isolated profiles. Six encounter/cleanup cycles per size remain at 80 geometries / 14 textures in the test scene.
- 50 motion views, 24 matched close-up poses, four matching angles per variant and actual game-scene captures retained. Windows headless Chromium only; no physical controller, phone or full-playthrough claim.

## Review and publication

[Comparison](skydrake11/review/SkyDrake-checkpoint-11-comparison.png), [24-pose contact sheet](skydrake11/review/SkyDrake-checkpoint-11-poses.png), [visual gates](VISUAL-GATES-SKYDRAKE-11.md). The comparison is saved in Library as `libfile_486765a6c2f8819185232a8a9091450c`, version `0`, filename `SkyDrake-checkpoint-11-comparison.png`. The successful upload receipt is retained in `skydrake11/review/library-receipt-11.json`. Windows does not support the helper's `os.setxattr`; the local attribute attempt failed without affecting the saved Library file.

Scoped outcome: ordinary motion/contact and wing-border continuity pass the sampled review; extreme deformation and final reference-art fidelity remain partial. The next art work should focus on a cleaner arm/torso deformation region and a properly rebaked belly/scale surface, rather than treating more regression checks as an art fix.

At **04:05:00 UTC**, the existing Site was active **version 7**, custom access with one owner, no groups and zero external visitors. Project remains `appgprj_6acf0e7886908191820064ec6fa5afa0`. [Playable live Site](https://darren-skyblade-reach.gosplekaiju.chatgpt.site) serves unchanged version 7.

Local candidate: run `node art/overhaul/scripts/serve_skydrake11.cjs`, then `http://127.0.0.1:4321/` (reduced) or `?variant=full`. Separate storage origin; in-memory adapter only. Verification servers were stopped. No push, saved Site version or deployment was attempted. Publication remains on hold for integrated cast review; no approval block occurred.
