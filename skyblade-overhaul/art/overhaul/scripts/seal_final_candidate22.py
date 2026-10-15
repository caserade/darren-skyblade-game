from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake22/review';release=root/'art/overhaul/final-local-candidate22/release';v=json.loads((review/'final-verification-22.json').read_text());assert v['passed'];archive=root.parent/'Skyblade-Final-Local-Candidate22.zip'
launcher=(root/'art/overhaul/scripts/serve_final_candidate22.cjs').read_text().replace("'../final-local-candidate22/release/dist'","'dist'")
readme='''Darren: Skyblade Hunt - Final Local Candidate22
Candidate21 application and accepted Chomp/Stormbelly + SkyDrake22 reduced weight repair.
Publication held. This package is not deployed to the live Site.

Extract into a new folder. With Node.js installed, open a terminal there and run:
node serve.cjs
Open http://127.0.0.1:4329/ in a separate browser profile for isolated saves.
Stop with Ctrl+C. The server binds only to this computer. Do not open index.html directly.

Only dist/assets/skydrake-rc15.glb differs from Candidate21.
No new content, engine, rig, clip, save-schema, HUD or control changes.
Candidate21 remains the tested rollback. Art likeness remains approximate.
Read Skyblade-Candidate22-Report.pdf for the comparison boards and practical limits.
The full-resolution SkyDrake22 experiments are not accepted and are not included.
Accepted full-resolution fallback remains SkyDrake15 in the Git project.
Editable reduced Blender source and the repair recipe remain in the Git project.
'''
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(release.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(release).as_posix())
 z.writestr('README.txt',readme);z.writestr('serve.cjs',launcher);z.write(root.parent/'Skyblade-Candidate22-Report.pdf','Skyblade-Candidate22-Report.pdf')
 for p in sorted((review/'boards').glob('SkyDrake22-*.png')):z.write(p,'review/boards/'+p.name)
 for name in ['visual-review-22.json','boards/board-provenance-22.json','final-verification-22.json','weight-contract-22.json','source-sync-22.json','trial-selection-22.json','full-candidate-rejection-22.json','release-package-tests-22.json','startup/startup-matrix-22.json','soak-final-22/soak-report.json','realtime-smoke-22.json','combat-22/combat-review.json','reference/reference-review-22.json','motion/before-lod.json','motion/c-lod.json']:
  z.write(review/name,'review/'+name)
 for p in sorted((review/'gait-22').glob('lod-*/gait-report.json')):z.write(p,'review/'+p.relative_to(review).as_posix())
with zipfile.ZipFile(archive) as z:
 m=json.loads((release/'manifest.json').read_text());assert all(hashlib.sha256(z.read(p)).hexdigest()==h for p,h in m['files'].items());assert [n for n in z.namelist() if n.endswith('.cjs')]==['serve.cjs'];assert not any('skydrake-candidate.glb' in n or n.endswith('.blend') for n in z.namelist());count=len(z.namelist())
r={'zip':str(archive),'zipSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'zipFiles':count,'manifestSha256':v['manifestSha256'],'reducedAssetSha256':v['assetHashes']['lod'],'publication':'held; no deployment'};(root.parent/'Skyblade-Final22-package-receipt.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
