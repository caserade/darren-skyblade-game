# Darren: Skyblade Hunt

Editable import of the user's Claude artifact. Keep its Chapters 1–2, Cloud Utopia,
Darren identity, combat and controller support. Preserve original save keys.
Do not edit the sibling Snowday project or synced sources/. Keep this Site private.

The Stormglass expansion is in dist/data/stormglass.js and dist/src/stormglass.js.
Models/animations live in stormglass-art.js; scenery lives in stormglass-world.js.
New mechanics must pause with the game and stop during dialogue. All hostile
area attacks need advance visual warnings. Preserve telegraph/dodge tests.
Concept art is visual development; do not describe procedural prototypes as final assets.

Run JavaScript syntax checks, then node serve.cjs and open /?qa=1 for browser
runtime regression checks. The QA route is local-only and must never ship in dist.
Do not rerun import.cjs or connect-expansion.cjs over edited files: they are provenance
utilities for the initial import. Do not rerun refine-v2.cjs either. Edit the extracted modules directly.
