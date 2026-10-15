from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[3];out=root/'art/overhaul/chomp18';review=out/'review';release=out/'release';report=json.loads((review/'final-verification-18.json').read_text());assert report['passed']
archive=root.parent/'Skyblade-Chomp18-local.zip'
readme='Darren: Skyblade Hunt - Chomp18 local candidate\nPublication held; existing content only. RC16 is preserved separately.\n\nExtract this ZIP, open a terminal in the extracted directory, and run:\npython -m http.server 4325 --bind 127.0.0.1 --directory dist\n\nOpen http://127.0.0.1:4325/ . Do not open index.html directly.\nUse a separate browser profile for isolated review saves.\n\nThe only app file changed from RC16 is dist/assets/chomprex.glb.\nEditable Blender sources, full/reduced exports and recipes are retained in the Git project under art/overhaul/chomp18 and art/overhaul/scripts. This ZIP is the playable package, not the editing source archive.\nSee CHECKPOINT-18.md and review/final-verification-18.json for limitations and evidence.\n'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(release.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(release).as_posix())
 z.writestr('README.txt',readme);z.write(root/'art/overhaul/CHECKPOINT-18.md','CHECKPOINT-18.md')
 for p in sorted((review/'boards').iterdir()):
  if p.is_file():z.write(p,'review/'+p.name)
 for name in ['mesh-audit-18.json','source-sync-18.json','release-package-tests-18.json','reference-measurements-18.json','grin-measurement-18.json','final-verification-18.json']:
  z.write(review/name,'review/'+name)
 z.write(review/'motion/motion-audit-18.json','review/motion-audit-18.json');z.write(review/'soak-final-18/soak-report.json','review/soak-report-18.json');z.write(review/'gameplay/gameplay-review-18.json','review/gameplay-review-18.json')
with zipfile.ZipFile(archive) as z:
 manifest=json.loads((release/'manifest.json').read_text());assert all(hashlib.sha256(z.read(p)).hexdigest()==h for p,h in manifest['files'].items());assert not any(n.endswith(('.blend','.blend1','.cjs','.py')) for n in z.namelist());count=len(z.namelist())
receipt={'zip':str(archive),'zipSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'zipFiles':count,'manifestSha256':report['manifestSha256'],'fullSha256':report['details']['exportHashes']['candidate'],'reducedSha256':report['details']['exportHashes']['lod'],'publication':'held; no hosting writes'};(root.parent/'Skyblade-Chomp18-package-receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
