from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[3];out=root/'art/overhaul/stormbelly20';review=out/'review';release=root/'art/overhaul/final-local-candidate20/release'
report=json.loads((review/'final-verification-20.json').read_text());assert report['passed']
archive=root.parent/'Skyblade-Final-Local-Candidate20.zip'
launcher=(root/'art/overhaul/scripts/serve_final_candidate20.cjs').read_text().replace("'../final-local-candidate20/release/dist'","'dist'")
readme='''Darren: Skyblade Hunt — Final Local Candidate20
Chomp19 + Stormbelly20 + accepted SkyDrake15, on the existing RC16 application.
Publication held. The live Site does not contain this candidate.

Extract this ZIP, open a terminal in the extracted folder, and run:
node serve.cjs
Then open http://127.0.0.1:4327/ in a separate browser profile for isolated saves.
Node.js is required. The launcher binds only to this computer. Stop with Ctrl+C.
Do not open index.html directly.

Only dist/assets/stormbelly-rc15.glb differs from the Chomp19 app package.
No content, gameplay, save-schema, engine or audience changes.
Chomp19, Chomp18 and RC16 remain separate fallbacks.
See CHECKPOINT-20.md and stormbelly20/review for evidence and remaining gaps.
Editable Blender sources and recipes remain in the Git project; this is the
playable and review package. Reference likeness remains approximate.
'''
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(release.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(release).as_posix())
 z.writestr('README.txt',readme);z.writestr('serve.cjs',launcher)
 for name in ['CHECKPOINT-20.md','FINAL-LOCAL-CANDIDATE20.md']:z.write(root/'art/overhaul'/name,name)
 for p in sorted((review/'boards').iterdir()):
  if p.is_file():z.write(p,'stormbelly20/review/boards/'+p.name)
 for name in ['facial-scope-20.json','visual-review-20.json','mesh-audit-20.json','mesh-study-20.json','source-sync-20.json','release-package-tests-20.json','final-verification-20.json']:
  z.write(review/name,'stormbelly20/review/'+name)
 for name in ['attack-extremes/attack-extremes-review.json','horn-orbit/horn-orbit-review-20.json','motion/motion-audit-20.json','soak-final-20/soak-report.json','gameplay/gameplay-review-20.json','expression/expression-review.json']:
  z.write(review/name,'stormbelly20/review/'+name)
 for p in sorted((review/'gait-20').glob('*/gait-report.json')):z.write(p,'stormbelly20/review/'+p.relative_to(review).as_posix())
with zipfile.ZipFile(archive) as z:
 manifest=json.loads((release/'manifest.json').read_text());assert all(hashlib.sha256(z.read(p)).hexdigest()==h for p,h in manifest['files'].items())
 assert not any(n.endswith(('.blend','.blend1','.py')) for n in z.namelist());assert [n for n in z.namelist() if n.endswith('.cjs')]==['serve.cjs'];count=len(z.namelist())
receipt={'zip':str(archive),'zipSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'zipFiles':count,'manifestSha256':report['manifestSha256'],'fullSha256':report['details']['exportHashes']['candidate'],'reducedSha256':report['details']['exportHashes']['lod'],'publication':'held by instruction; no hosting or Library writes'}
(root.parent/'Skyblade-Final20-package-receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
