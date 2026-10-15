from pathlib import Path
import json,hashlib,subprocess,py_compile
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake15/review';scripts=root/'art/overhaul/scripts'
node='C:/Users/caser/AppData/Local/Programs/node-v24.21.0-win-x64/node.exe';git='C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe'
def read(p):return json.loads((review/p).read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
syntax=[]
for p in sorted(scripts.glob('*15.*')):
 if p.suffix in ['.js','.cjs']:subprocess.run([node,'--check',str(p)],check=True,capture_output=True);syntax.append(str(p.relative_to(root)))
 elif p.suffix=='.py':py_compile.compile(str(p),doraise=True);syntax.append(str(p.relative_to(root)))
for p in (root/'art/overhaul/skydrake15/release/dist').rglob('*.js'):subprocess.run([node,'--check',str(p)],check=True,capture_output=True);syntax.append(str(p.relative_to(root)))
reports={}
for name in ['aggregate-15.json','release-package-tests-15.json','soak-15/soak-report.json','candidate-loading-report.json','cast-loading-15.json','camera-lifecycle-15.json','portrait-layout-15.json','gameplay-cast-15/gameplay-cast-review.json']:
 r=read(name);passed=r.get('passed')
 if name=='candidate-loading-report.json':passed=all(c['pass'] for row in r['results'] for c in row['checks']) and all(not row['errors'] for row in r['results'])
 reports[name]={'sha256':sha(review/name),'passed':passed}
for name in ['weight-contract-15.json','blend-reopen-15.json','glb-validation-15.json']:
 r=read(name);reports[name]={'sha256':sha(review/name),'passed':all(x['passed'] for x in r)}
for variant in ['candidate','lod']:
 name=f'game-tests-15-{variant}/report.json';r=read(name);reports[name]={'sha256':sha(review/name),'passed':r['passed']==r['total'] and not r['errors']}
gaits=[]
for p in sorted((review/'gait-15').rglob('*.json')):
 r=json.loads(p.read_text())
 if 'passed' in r:gaits.append({'file':str(p.relative_to(review)),'passed':r['passed'],'checks':len(r.get('checks',{})),'sha256':sha(p)})
manifest=json.loads((root/'art/overhaul/skydrake15/release/manifest.json').read_text());release=root/'art/overhaul/skydrake15/release'
manifest_ok=all(sha(release/p)==h for p,h in manifest['files'].items())
protected=subprocess.check_output([git,'diff','--name-only','HEAD','--','dist','.openai','tests','AGENTS.md','art/references'],cwd=root,text=True).strip()
game=read('gameplay-cast-15/gameplay-cast-review.json');cam_hash=sha(scripts/'skyblade-camera15.js');camera_bound=game['cameraSha256']==cam_hash==read('camera-lifecycle-15.json')['cameraSha256']==read('portrait-layout-15.json')['cameraSha256']
scope={'protectedTrackedFilesUnchanged':not protected,'releaseManifestExact':manifest_ok,'cameraEvidenceMatchesFinalCode':camera_bound,'hostingIdPreserved':manifest['project_id']=='appgprj_6acf0e7886908191820064ec6fa5afa0'}
result={'checkpoint':15,'status':'Local candidate; not published; Library delivery blocked','rollbackCommit':'04ba416f819ef7f4da19113fc5cdea59e64f2d1c','reports':reports,'gaits':gaits,'syntaxChecked':syntax,'scopeChecks':scope,'assets':read('asset-budgets-15.json'),'unresolved':['One previous aggregate attempt had incomplete chapter initialization; exact initiating load failure remains unexplained. Retained failing report; later instrumented aggregate and actual-package checks pass.','Library current batch helper reported Library prepare_uploads is not available before preparation; no upload confirmed.','Remaining extreme-pose deformation, fine likeness differences and physical-device GPU/input testing.'],'passedFinalChecks':all(x['passed'] is True for x in reports.values()) and all(x['passed'] for x in gaits) and all(scope.values())}
(review/'verification-summary-15.json').write_text(json.dumps(result,indent=2));print(json.dumps({'passedFinalChecks':result['passedFinalChecks'],'reports':reports,'gaitRuns':len(gaits),'gaitChecks':sum(x['checks'] for x in gaits),'syntaxFiles':len(syntax),'scope':scope}));assert result['passedFinalChecks']
