# Checkpoint 16 — required-script startup repair

Local-only follow-up to RC15. No publication, audience change, Library retry, new game content or asset edits. RC15 commit `2ebeccb146f674bdb5e4e0118460ba547581dcd6`, its ZIP and comparison boards remain preserved.

## Finding and causal evidence

The saved RC15 aggregate failure was real incomplete startup, followed by a test that assumed startup was healthy. It was not caused by creature deformation or a successful script loading out of order.

`skydrake15/review/aggregate-intermittent-collision-15.json` records two startup errors, then the missing pillar at `tests/repair.js:50`:

1. `data/stormglass.js:14` reads `D.chapters[1].ending`. If Chapter 2 did not initialize, that chapter is absent and execution stops before Chapter 3 is added.
2. `src/toon-enemies.js:211` reads the missing Chapter 3's zones and throws the second error.
3. `chapterById('ch3')` falls back to the first chapter. The old readiness predicate still succeeds because the game object and creature caches exist. The collider test subsequently searches a Chapter 1 level for a Chapter 3 pillar.

Controlled aborts and empty successful responses for `data/chapter2.js` reproduce **both exact startup messages and the same 46/47 repair-suite result** on the unmodified RC15 package. Before any QA code executes, the game contains only Chapter 1; a stored Chapter 3 selection displays Chapter 1, and Continue enters checkpoint 0/time 0 instead of saved checkpoint 1/time 125. The saved Chapter 3 bytes themselves remain intact. Normal and deliberately delayed successful script loads initialize all three chapters, restore Chapter 3/checkpoint 1/time 125 and pass the original repair suite 64/64.

The original failing run did not record resource failures, so its precise transport cause (abort, missing response, empty response or another reason Chapter 2 did not execute) cannot be recovered. This is a historical evidence limit. The confirmed partial-startup failure mode is now repaired rather than dismissed because a rerun passed.

Evidence: `skydrake16/review/startup-causal-reproduction-16.json`. An earlier diagnostic attempt ran the menu suite after a programmatic quit with the title container still hidden, producing an unrelated Tab assertion. Restoring the suite's visible-title precondition removes that assertion; the earlier diagnostic remains preserved.

## Repair

The new package changes only `index.html`, `src/boot16.js` and one frame-loop condition in `src/level.js`:

- Required scripts are preloaded in parallel and executed in their original order. Chapter data is validated before dependent gameplay modules run. Fresh-load diagnostics show one transfer per script, with no duplicate preload/download transfers.
- Missing scripts, empty chapter data, execution errors or a 20-second required-script timeout keep the game inert and show a keyboard/touch-accessible Retry control. Retry reloads the document, avoiding partial data re-execution or duplicate chapter entries. Bootstrap-file failure itself also exposes Retry.
- The frame loop cannot simulate the game until all required modules are ready. This also protects a failure after level initialization but before menu initialization.
- Creature GLBs keep their existing asynchronous loaders and fallbacks. Delayed model completion cannot revert a chapter change or create stale encounters.
- The loader never writes browser saves. Existing chapter selections, checkpoint bytes and unrelated storage keys survive failed startup and retry.

No creature meshes, textures, animation adapters, encounter definitions, camera behavior, portrait HUD styling or existing save keys change. Root `dist/`, `.openai/`, tests, reference art and RC15 are preserved. The complete candidate is under `skydrake16/release/`, using the same existing project ID.

## Verification and readiness

The final startup matrix covers **28 desktop/mobile-sized scenarios and 320 checks**: fresh starts; restored Story 1–3 checkpoints and Adventure selection; required-script and creature-model delays; network abort, empty200, execution error and timeout; keyboard/pointer Retry; interrupted document navigation; navigation while models load; and a real running frame-loop check during a late startup failure. It passes.

The initial interrupted-navigation test erroneously tried to seed localStorage in `about:blank`, where storage access is denied. The helper is now restricted to the game origin. Both affected cases pass on focused rerun; app/package bytes did not change. Final matrix provenance retains the initial report and the focused rerun rather than hiding this test correction.

The actual packaged build also passes **250/250 existing runtime/repair checks** at desktop and mobile sizes. No test changes were needed for these checks beyond waiting for the startup gate's ready state. The existing RC15 charge-fixture isolation remains in use; the original repair suite is unchanged.

The package manifest, original script order, three-file change boundary, unchanged asset bytes, JavaScript/Python syntax and committed bytes are verified separately. No physical phone/controller, hardware FPS or full-playthrough claim is added.

**Scoped release-readiness result:** the reproduced startup defect is repaired and its failure/recovery paths pass. There is no outstanding initialization blocker in the tested cases. The unlogged historical transport trigger remains unknown; this is not a claim that every possible network/browser failure has been tested. Publication remains deferred by instruction.

## Actual outstanding art and delivery limits

- Chomp: muzzle/forehead proportions, fine wrinkles and tooth spacing still approximate the supplied art.
- Stormbelly: muzzle, belly grooves and fine surface detail remain approximate.
- SkyDrake: extreme hip/tail creasing, remaining neck/chest stretch outside the repaired mask, and fine facial/surface likeness differences remain. RC15 improved, rather than eliminated, extreme deformation.
- Reduced trio texture decoding still estimates about 105 MiB before mipmaps/driver/world/fallback costs. Physical mobile GPU memory, frame rate and controller behavior remain unmeasured.
- Library's supported batch helper was unavailable in RC15. No retry or direct write was made in this follow-up. The three boards and RC15 ZIP remain local; RC16's portable bundle includes those same boards with their original provenance.

Run locally from the project root with `node art/overhaul/scripts/serve_release16.cjs`, then open `http://127.0.0.1:4324/`. The test server is stopped after verification. The live Site remains the previously verified private version 7 at https://darren-skyblade-reach.gosplekaiju.chatgpt.site ; this follow-up performs no hosting writes.
