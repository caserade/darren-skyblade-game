# Skyblade accepted overhaul through Candidate23

This branch saves the accepted game and editable art from local commit
`90dce67e9d0ac24f18eb0995d88be338365aeae7`. It adds this self-contained folder
without changing the existing repository game files or main branch.

## Play or edit the current version

With Node.js installed, run `node serve.cjs` from this folder and open
http://127.0.0.1:4330/ in a separate browser profile. `dist/` is the exact tested
Candidate23 application. `deliverables/Skyblade-Final-Local-Candidate23.zip` is
the unchanged portable download; the illustrated PDF is beside it. No build is
needed. Do not open index.html directly. Ctrl+C stops the local-only server.

All accepted repairs are consolidated here: runtime/save/startup and recovery
repairs, model refinements, responsive HUD/input repairs, Candidate22 neck and
shoulder weights, and Candidate23 shoulder-color correction. No content was
added by the repair pass. See the checkpoint reports for precise scope.

## Editable art and rollback

| Creature | Accepted full-resolution Blender | Accepted playable Blender |
|---|---|---|
| SkyDrake | art/overhaul/skydrake15/source/skydrake-candidate.blend | art/overhaul/skydrake23/source/skydrake-lod.blend |
| Chomp Rex | art/overhaul/chomp19/source/chomprex-candidate.blend | art/overhaul/chomp19/source/chomprex-lod.blend |
| Stormbelly | art/overhaul/stormbelly20/source/heavyweight-candidate.blend | art/overhaul/stormbelly20/source/heavyweight-lod.blend |

These Blender files include packed textures. Accepted GLBs are in adjacent
export folders. Original turnarounds are in `art/references/`. Candidate22's
accepted reduced Blender and GLB are also retained. Its unchanged portable ZIP,
illustrated report and exact release tree provide rollback without touching saves.
The rejected full-resolution Candidate22 trials are not accepted art and are
not included. The full-resolution SkyDrake15 source above is authoritative.

## Verification and known art limits

Candidate23 passed 274 fresh checks plus extracted-ZIP startup. Its 46-file
release manifest, exact final hashes, prior recovery/soak/deformation reports and
comparison boards are retained. No physical controller/phone or full-playthrough
claim. Eyes/muzzle, wing/tail silhouettes and extreme joint creases remain
approximate; see `art/overhaul/skydrake23/review/HANDOFF-23.txt` for the next art step.

`BACKUP-MANIFEST.json` lists exact SHA-256 values and provenance for every copied
file. `LOCAL-ONLY-INVENTORY.json` records omitted historical files rather than
silently losing them. Old/rejected model experiments, repeated prior releases,
bulk diagnostic frame sequences and local tool receipts stay in the original
local checkout. Historical scripts are preserved as reference; scripts for old
stages may require those local-only inputs. The accepted packed Blender sources,
current app, final deliverables and Candidate22 rollback are complete here.

This is a backup branch in the existing public GitHub repository. It does not
publish or change access to the separate owner-only Site. Publication remains
held. No workflow, Pages configuration, merge or visibility setting was changed.
