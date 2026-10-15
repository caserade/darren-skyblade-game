# Final bounded audit of RC16

**Result: the exact local RC16 package passes the requested final functional audit. No additional gameplay repair was demonstrated by this audit. Art fidelity remains incomplete. Publication stays held.** This checkpoint adds audit evidence and continuation instructions only; it does not alter the app, its assets, saves, content, engine, hosting or audience.

App revision: `af98739877d97a021e3afc7feda137f1ec5865bc`, on `asset-overhaul-2026-10-14` in `skyblade-current`. Audit commits after that revision do not change the app. The playable build is **`art/overhaul/skydrake16/release/dist`**, not root `dist/`.

## Exact delivery and validation

- Manifest SHA256: `7fea972be4e412486901e9400c6888bbc47e909bd95a778f8938a17f19e0b598`.
- Portable ZIP: `../Skyblade-RC16-local.zip` relative to the project root. SHA256: `109e422ee8da7354b7f7206f7ce302d30c82689c95a194339870a76713e40a2b`.
- All 45 manifested files, plus the manifest, match both disk and the exact app commit. The ZIP contains those same bytes plus only its expected README, checkpoint document and nine review files: 57 files total. No untracked/experimental asset, editable Blender file or test executable entered the package. The original SkyDrake GLB is an intentional existing fallback. The three active GLBs match the accepted reduced exports exactly.
- Fresh final aggregate run: **250/250** checks, covering the existing runtime and repair suites at desktop 1440x900 and mobile-sized 390x844 with touch emulation. An inherited report label incorrectly said full/reduced; the label was corrected to reduced-trio, matching all four recorded runs. No result or app code changed.
- Fresh repeated-flow run: **340/340** checks across 20 cycles in two isolated profiles. Each cycle uses a controlled 30-second three-creature encounter, two hit interruptions, actual pause/dialogue ticks, disposal, existing waystone travel, keyboard movement/focus reset, an actual Chapter 3 checkpoint/progression save, browser reload and Continue. Saved bytes and an unrelated storage sentinel survive. This totals ten minutes of accelerated encounter simulation and 20 reloads, not ten minutes of wall-clock play or a full playthrough.
- The RC16 startup recovery matrix remains the previously verified 28 scenarios / 320 checks. It was not rerun in this audit because the app is unchanged. Its causal evidence and test-fixture correction are disclosed in `CHECKPOINT-16.md`.
- Six accepted Blender sources were reopened read-only in Blender 5.2.2. Their 29/33/39-bone rigs, 12/13/14 named clip actions and packed images are present; source and export hashes match the app commit. No source was saved or exported during this audit.

Evidence: `skydrake17/review/final-audit-17.json`, `editable-sources-17.json`, `release-package-tests-17.json`, and `soak-final-17/soak-report.json`. Four new soak screenshots document first/last controlled encounters; those renderer captures do not establish HUD coverage. The curated boards contain the actual HUD views.

## Ranked remaining visual work

I inspected the supplied turnaround pixels and all three curated boards, with the SkyDrake extreme-pose close-up as motion evidence. Board/source hashes still match their provenance. The boards retain their RC15 labels because all art, adapters, camera and HUD bytes are unchanged in RC16. Their before images are the existing procedural Chomp/Stormbelly and original supplied SkyDrake GLB, not a claim that every before image represents live version 7.

| Priority | Remaining limitation | Visible impact and next justified work |
| --- | --- | --- |
| 1 — high in motion | SkyDrake hip/tail creasing and neck/chest deformation in extreme poses | The accepted local weight repair reduced hip stretching but did not remove the fold/pinch. Refine the affected deformation and inspect attack, hit, turn and tail extremes while preserving the accepted shoulder repair. Full-mesh maximum neck/chest stretch remains outside the repaired hip mask. |
| 2 — high for identity | Chomp Rex face, grin and body proportions | The supplied art has a more developed brow/cheek, broad characteristic grin and heavier body/leg relationship. The current muzzle/forehead is smoother, the teeth/mouth arrangement differs and the body reads leaner. Face and silhouette work has more value than adding tiny skin detail. Rest-pose mouth differences affect the comparison, so this is qualitative visual judgment, not a measured likeness score. |
| 3 — medium | SkyDrake resting silhouette and face | The current belly/hips read rounder and heavier; muzzle/head profile, tail carry and wing membrane scallops remain approximate. Match those forms to the supplied four views before treating the character as complete. |
| 4 — medium | Stormbelly body and head proportions | The reference's broad egg-shaped body, lower belly taper, horn curvature and muzzle/tusk spacing are not fully matched. The current model reads more upright and tapered. Preserve the accepted gait while refining these forms. |
| 5 — lower at gameplay distance | All three surface patterns and sculpt detail | Wrinkles, belly grooves, scale grain, spot placement and fine facial transitions differ. Lighting also affects apparent color; these screenshots do not establish a calibrated color-match metric. |

This ranking separates visible likeness from deformation and is not an assertion that any model perfectly matches its art. No turnaround is missing from the local review set. The two supplied composite model sheets also include previous runtime models; their lower panels are not treated as additional turnaround evidence.

Physical phone/controller behavior, hardware frame rate and mobile GPU memory remain unmeasured. The reduced trio still has roughly 105 MiB of estimated decoded textures before mipmaps, driver, world and fallback costs. Automated emulation cannot establish physical-device performance. These limits remain relevant before a broad release, though this project remains private.

## Continue editing from the accepted sources

All paths in this table are relative to `art/overhaul/`. Both full and reduced sources/exports remain in Git; the portable ZIP is a playable delivery, not a replacement for this editable project.

| Character | Accepted editable sources | Accepted exports / active package |
| --- | --- | --- |
| Chomp Rex, checkpoint 05 | `chomprex/source/chomprex-runtime-candidate.blend`, `chomprex/source/chomprex-lod.blend` | `chomprex/export/chomprex-candidate.glb`, `chomprex/export/chomprex-lod.glb`; reduced export ships as `dist/assets/chomprex.glb` |
| Stormbelly, checkpoint 08 gait | `heavyweight/source/heavyweight-runtime-candidate.blend`, `heavyweight/source/heavyweight-lod.blend` | `heavyweight/export/heavyweight-candidate.glb`, `heavyweight/export/heavyweight-lod.glb`; reduced export ships as `dist/assets/stormbelly-rc15.glb` |
| SkyDrake, checkpoint 14 shoulder + 15 hip weights | `skydrake15/source/skydrake-candidate.blend`, `skydrake15/source/skydrake-lod.blend` | `skydrake15/export/skydrake-candidate.glb`, `skydrake15/export/skydrake-lod.glb`; reduced export ships as `dist/assets/skydrake-rc15.glb` |

`editable-sources-17.json` gives exact source/export hashes, rigs, action names and packed-image inventory. The accepted full runtime source is the starting point for further mesh/animation edits. Earlier `overhaul-work`, import, UV/bake and pre-gait files remain provenance; blindly rerunning their pipelines can discard accepted later repairs. Chomp's work/sculpt sources remain available if a high-resolution sculpt revision is needed, but reconcile that revision with accepted animation and export sources.

SkyDrake's `skydrake15/source/weights-*.json`, `scripts/repair_skydrake_weights15.py` and `scripts/apply_skydrake_source_weights15.py` preserve the checkpoint 15 synchronization method. These are historical transformations from checkpoint 14, not a blanket command to rerun over new edits. Likewise, Stormbelly's `scripts/repair_heavyweight_gait.py` starts from the earlier pre-gait source. Preserve current named actions and validate both export variants after any future change. This audit proves editable continuity; it does not claim arbitrary Blender re-exports are byte-identical.

Runtime adapters are preserved in the package: `src/chomprex.js`, `src/stormbelly-rc15.js`, `src/skydrake-rc15.js`. Their source inputs are root `dist/src/chomprex.js`, `scripts/heavyweight-local-adapter.js` and `scripts/skydrake-local-adapter15.js`, respectively. RC16's required-script loader source is `scripts/boot16.js`; `scripts/build_release16.py` derives the candidate from preserved RC15 and injects the startup UI plus frame gate. It overwrites nested release files, so manual release edits alone are not durable rebuild inputs. Make future revisions in a new candidate path and keep this sealed release available.

Do not run `import.cjs`, `connect-expansion.cjs` or `refine-v2.cjs` over edited files. Preserve the same project ID, existing save keys and audience. QA scripts stay outside packaged `dist`.

## Launch and rollback

From `C:\Users\caser\Documents\Codex\2026-10-14\task\skyblade-current`:

```powershell
node art/overhaul/scripts/serve_release16.cjs
```

Open `http://127.0.0.1:4324/`. If Node is not on PATH, this machine's binary is `C:\Users\caser\AppData\Local\Programs\node-v24.21.0-win-x64\node.exe`. The audit stops its own server after testing; no background playable server is promised.

For the portable ZIP, extract it, open a terminal in the extracted directory and run:

```powershell
python -m http.server 4324 --bind 127.0.0.1 --directory dist
```

Open the same local URL. Do not open `index.html` directly. Use a separate browser profile for review if existing localhost saves must remain isolated.

Preserved rollback points: RC15 `2ebeccb146f674bdb5e4e0118460ba547581dcd6`; accepted checkpoint 14 `04ba416f819ef7f4da19113fc5cdea59e64f2d1c`; accepted checkpoint 12 `4b80fab92c6060128509d9ba2e303290c0501162`; live-v7 baseline `20da43808501ece80ef7a72a7966f7bd68c68ba2`. RC15's nested package and portable ZIP are retained. Inspect a rollback in a separate checkout or copy rather than resetting over current edits. RC15 retains the startup defect repaired in RC16, so it is a historical fallback, not the preferred playable candidate.

## Publication and Library status

No hosting write occurred. Existing project `appgprj_6acf0e7886908191820064ec6fa5afa0` remains the target. Last recorded live check, 06:39:11 UTC on October 15, showed version 7, custom access with one owner, no groups and zero external visitors. The existing URL is https://darren-skyblade-reach.gosplekaiju.chatgpt.site ; it does not contain unpublished RC16. This audit does not claim a fresh live read.

At 07:14:59 UTC, read-only discovery through the unchanged supported Library helper still could not resolve `prepare_uploads` or `finalize_uploads`. No upload, tool call mutation or alternate route was attempted. The action needed for Library delivery remains restoration of those helper capabilities; the boards remain local. This is a capability limitation, not an automatic approval denial. Publication remains held by instruction, not by a new permission request.
