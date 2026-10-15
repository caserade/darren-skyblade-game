from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[3];out=root/'art/overhaul/chomp19';review=out/'review';release=out/'release';report=json.loads((review/'final-verification-19.json').read_text());assert report['passed']
archive=root.parent/'Skyblade-Chomp19-local.zip';launcher=(root/'art/overhaul/scripts/serve_chomp19.cjs').read_text().replace("'../chomp19/release/dist'","'dist'").replace('Local SkyDrake release candidate','Local Skyblade Chomp19 candidate')
readme='''Darren: Skyblade Hunt - Chomp19 local candidate
Publication held. Chomp18 and sealed RC16 remain separate fallbacks.

Extract this ZIP, open a terminal in the extracted folder, and run:
node serve.cjs

Open http://127.0.0.1:4326/ . Do not open index.html directly.
Use a separate browser profile for isolated review saves.
The launcher binds only to this computer's loopback address. Stop with Ctrl+C.
Node.js must be installed; it is already available in the authoring environment.

Only dist/assets/chomprex.glb differs from the Chomp18 app package.
The root serve.cjs is a local delivery launcher, not a game system.
Editable Blender sources, full/reduced exports and recipes remain in the Git
project under art/overhaul/chomp19 and art/overhaul/scripts. This ZIP is the
playable/review package, not the editing-source archive.

See CHECKPOINT-19.md, STORMBELLY-ASSESSMENT-19.md and the review reports.
The live private Site does not contain this candidate. No upload was performed.
'''
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(release.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(release).as_posix())
 z.writestr('README.txt',readme);z.writestr('serve.cjs',launcher)
 for name in ['CHECKPOINT-19.md','STORMBELLY-ASSESSMENT-19.md']:z.write(root/'art/overhaul'/name,name)
 for p in sorted((review/'boards').iterdir()):
  if p.is_file():z.write(p,'review/'+p.name)
 for name in ['mesh-audit-19.json','mesh-study-19.json','facial-scope-19.json','source-sync-19.json','release-package-tests-19.json','reference-measurements-19.json','eye-coverage-19.json','grin-measurement-19.json','final-verification-19.json']:z.write(review/name,'review/'+name)
 for path,name in [('motion/motion-audit-19.json','motion-audit-19.json'),('soak-final-19/soak-report.json','soak-report-19.json'),('gameplay/gameplay-review-19.json','gameplay-review-19.json'),('expression/expression-review.json','expression-review-19.json'),('stormbelly/stormbelly-assessment-captures-19.json','stormbelly-assessment-captures-19.json')]:z.write(review/path,'review/'+name)
with zipfile.ZipFile(archive) as z:
 manifest=json.loads((release/'manifest.json').read_text());assert all(hashlib.sha256(z.read(p)).hexdigest()==h for p,h in manifest['files'].items());assert not any(n.endswith(('.blend','.blend1','.py')) for n in z.namelist());assert [n for n in z.namelist() if n.endswith('.cjs')]==['serve.cjs'];count=len(z.namelist())
receipt={'zip':str(archive),'zipSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'zipFiles':count,'manifestSha256':report['manifestSha256'],'fullSha256':report['details']['exportHashes']['candidate'],'reducedSha256':report['details']['exportHashes']['lod'],'publication':'held; no hosting or Library writes'};(root.parent/'Skyblade-Chomp19-package-receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
