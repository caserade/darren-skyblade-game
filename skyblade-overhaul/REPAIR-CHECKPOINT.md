# Skyblade Hunt repair checkpoint — 2026-10-14 21:43 UTC

Work began about 21:15 UTC. Target remains approximately 22:15 UTC. This is an interim checkpoint requested by the parent, not completion or cancellation. Nothing published yet.

## Identity and rollback

- Exact current source opened through supported Sites helper: `appgprj_6acf0e7886908191820064ec6fa5afa0`.
- Existing private Site: https://darren-skyblade-reach.gosplekaiju.chatgpt.site — last verified version 4, owner-only/custom, no external visitors.
- Checkout: `C:\Users\caser\Documents\Codex\2026-10-14\task\skyblade-current`.
- Baseline HEAD: `7f18a6a9cc044897043ded4e0f4a47b2288dff9a`; rollback tag `repair-baseline-2026-10-14`.
- `.openai/hosting.json` retains exact project ID and static `dist` directory. Edits are uncommitted and preserved.
- No engine/content/roster changes or sibling-project edits.

## References inspected

Actual pixels of supplied Heavyweight/Stormbelly and Chomp Rex/Grin turnarounds found under `C:\Users\caser\Downloads\Darren-Skyblade\Darren Skyblade Game\docs\art\cast` and copied into `art/references/concept_heavyweight.jpg` and `concept_chomprex.jpg` here. The separate downloaded game's source was not substituted for the hosted source. SkyDrake turnaround was also inspected, but that creature is absent from this hosted roster, so was not added.

Procedural Stormbelly and Chomp Rex now have reference-based silhouettes, spotted blue/plum colors, pale/golden segmented bellies, curved tails, horns/wings for Stormbelly, short arms and toothy grin for Rex. Models remain procedural approximations, not exact sculpted turnaround replicas. Front/side before-and-after and additional back/three-quarter screenshots are in `tests/evidence`.

## Implemented and verified before latest resource edits

- Prevent Enter in Settings from starting a new game; keyboard focus traversal and controller menu navigation; correct Escape behavior.
- Clear held/queued/stick/camera input on pause, blur, lost touch capture and controller disconnect; preserve independent simultaneous device holds.
- Validate malformed settings, inventory and checkpoints; retain original save keys and a first `.recovery` raw value before overwriting; handle denied/full storage.
- Pause and cancel ending, travel and Adventure victory callbacks across quit/retry/chapter changes; freeze hostile rings and damage during dialogue.
- Safe exact-center gem pickup and prop collision; remove old enemies on chapter change.
- Retract camera before authored Stormglass pillars; respect pillar height while allowing flight above it.
- Cache each existing weapon separately per hand. Measured material registry after 10 weapon cycles: 906 before, 140 after; after cache warmup no additional growth. Camera obstruction probe: one opaque intersection before, zero after.
- Latest full completed suite `tests/evidence/regression4/report.json`: 58/58 repair, 61/61 gameplay, 17/17 rendering/resource checks, zero page errors.
- `tests/evidence/flows1/flows.json`: legacy and malformed save profiles, denied storage, interrupted/completed chapter ending, repeated/interrupted fast travel, actual browser keyboard events, portrait and landscape menu layout. All scenarios succeeded without page errors.
- Latest static audit: 55/55, dist 3.84 MiB; local QA scripts excluded from dist.

## Latest edits still needing browser regression

Rear ridge/tail-spade/leg refinements have been screenshot-inspected (`silhouette-final`). Additional repeated-enemy resource caches in models.js/combat.js and boss private-material disposal in level.js passed syntax/static checks but await runtime regression. Encounter soak initially timed out because the test disabled requestAnimationFrame while Playwright's waitForFunction default polling depended on it; encounter harness now explicitly polls every 50 ms. Similar explicit polling should be applied to resource-repair.cjs and flow-repair.cjs where they disable RAF.

## Resume work

1. Run encounter resource soak and compare repeated cycles, including elite and boss rebuild/disposal; repair any real failures.
2. Run actual keyboard play and gameplay screenshots; final complete regression after latest changes. Verify animation states and all four reference angles.
3. Review diff and prepare concise final report with actual coverage and remaining limitations. No physical controller/phone or full manual playthrough has been performed.
4. Refresh Site access/version; use fresh source credential and supported helper to commit/push/package exact existing project, then `save_version_and_deploy_private`. Verify deployment and access. No approval block has occurred. Never recreate Site or broaden access.

Local preview server is running in tool session 53286 at http://127.0.0.1:4318. A failed early resource probe may have left session 74225 alive; clean up only owned test processes when finishing.

Sites plugin root: `C:\Users\caser\.codex\plugins\cache\openai-curated-remote\sites\1.0.0`. Use site-workflow.mjs with tty and credential via hidden stdin only. On Windows, terminating the JSON input with `\r` worked. Opening result to preserve: `{project_id: "appgprj_6acf0e7886908191820064ec6fa5afa0", checkout_path: "C:\\Users\\caser\\Documents\\Codex\\2026-10-14\\task\\skyblade-current", commit_sha: "7f18a6a9cc044897043ded4e0f4a47b2288dff9a"}`.
