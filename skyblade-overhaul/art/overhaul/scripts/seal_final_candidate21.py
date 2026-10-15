from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[3]; review=root/'art/overhaul/hud21/review'; release=root/'art/overhaul/final-local-candidate21/release'
report=json.loads((review/'final-verification-21.json').read_text());assert report['passed']
archive=root.parent/'Skyblade-Final-Local-Candidate21.zip'
launcher=(root/'art/overhaul/scripts/serve_final_candidate21.cjs').read_text().replace("'../final-local-candidate21/release/dist'","'dist'")
readme='''Darren: Skyblade Hunt - Final Local Candidate21
Candidate20 accepted art + responsive HUD and input/menu repairs.
Publication held. The live Site does not contain this candidate.

Extract this ZIP into a new folder. With Node.js installed, open a terminal
in the extracted folder and run: node serve.cjs
Open http://127.0.0.1:4328/ in a separate browser profile for isolated saves.
The launcher binds only to this computer. Stop with Ctrl+C.
Do not open index.html directly. Existing saves were not used by testing.

Only index.html, responsive-ui21.css and src/core.js differ from Candidate20.
No new content, engine, save-schema or audience changes. Accepted art unchanged.
See Skyblade-Morning-Report21.pdf and review/ for evidence and limitations.
Editable model sources remain in the Git project. Reference likeness is approximate.
'''
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(release.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(release).as_posix())
 z.writestr('README.txt',readme);z.writestr('serve.cjs',launcher)
 z.write(root.parent/'Skyblade-Morning-Report21.pdf','Skyblade-Morning-Report21.pdf')
 for p in sorted((review/'boards').iterdir()):z.write(p,'review/boards/'+p.name)
 for name in ['final-verification-21.json','release-package-tests-21.json','interaction-tests-21.json','layout/layout-review-21.json','startup/startup-matrix-21.json','soak-final-21/soak-report.json']:z.write(review/name,'review/'+name)
with zipfile.ZipFile(archive) as z:
 manifest=json.loads((release/'manifest.json').read_text());assert all(hashlib.sha256(z.read(p)).hexdigest()==h for p,h in manifest['files'].items());assert [n for n in z.namelist() if n.endswith('.cjs')]==['serve.cjs']; count=len(z.namelist())
receipt={'zip':str(archive),'zipSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'zipFiles':count,'manifestSha256':report['manifestSha256'],'publication':'held by instruction'}
(root.parent/'Skyblade-Final21-package-receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
