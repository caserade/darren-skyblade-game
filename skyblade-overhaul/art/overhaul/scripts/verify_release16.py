from pathlib import Path
import json,hashlib,re,subprocess,py_compile,collections
root=Path(__file__).resolve().parents[3];base=root/'art/overhaul/skydrake15/release';release=root/'art/overhaul/skydrake16/release';review=release.parent/'review';scripts=root/'art/overhaul/scripts'
node='C:/Users/caser/AppData/Local/Programs/node-v24.21.0-win-x64/node.exe';git='C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text())
manifest=read(release/'manifest.json');mh=sha(release/'manifest.json');checks={};details={}
matrix=read(review/'startup-matrix-before-fixture-fix-16.json');focused=read(review/'startup-focused-interrupted-navigation.json')
assert matrix['manifestSha256']==focused['manifestSha256']==mh
replacement={(r['scenario'],r['mobile']):r for r in focused['results']};matrix['results']=[replacement.get((r['scenario'],r['mobile']),r) for r in matrix['results']];matrix['passed']=all(r['passed'] for r in matrix['results']);matrix['provenance']='26 passing scenarios from original matrix plus two focused interrupted-navigation reruns after restricting test storage seeding to the game origin. App/package bytes unchanged. Both earlier reports retained.'
(review/'startup-matrix-16.json').write_text(json.dumps(matrix,indent=2));checks['allStartupScenarios']=matrix['passed'];details['startupRuns']=len(matrix['results']);details['startupChecks']=sum(len(r['checks']) for r in matrix['results'])
original=read(root/'art/overhaul/skydrake15/review/aggregate-intermittent-collision-15.json');original_errors=next(r['errors'] for r in original['results'] if r['errors']);causal=read(review/'startup-causal-reproduction-16.json');bad=[r for r in causal['results'] if r['mode'] in ['chapter2-aborted','chapter2-empty']];good=[r for r in causal['results'] if r['mode'] in ['normal','chapter2-delayed']]
checks['originalErrorSignatureReproducedBeforeQA']=all(all(any(message in (error.get('message') or '') for error in r['initial']['scriptErrors']) for message in original_errors) for r in bad)
checks['badStartupSelectsWrongChapterBeforeQA']=all(r['initial']['chapters']==['ch1'] and r['initial']['selected']=='ch1' and r['direct']['selected']=='ch1' and r['direct']['pillars']==0 for r in bad)
checks['sameMissingPillarQAException']=all(any('reading \'x\'' in f.get('error','') and 'repair.js:50' in f['error'] for f in r['qa']['failed']) for r in bad)
checks['normalAndDelayedInitializationCorrect']=all(r['initial']['selected']=='ch3' and r['direct']['checkpoint']==1 and r['direct']['pillars']==14 and not r['errors'] for r in good)
checks['normalAndDelayedOriginalSuitePass']=all(r['qa']['passed']==r['qa']['total']==64 for r in good)
details['originalFailureReportSha256']=sha(root/'art/overhaul/skydrake15/review/aggregate-intermittent-collision-15.json');details['causalReportSha256']=sha(review/'startup-causal-reproduction-16.json')
aggregate=read(review/'release-package-tests-16.json');checks['packagedRegressions']=aggregate['passed'];details['packageChecks']=sum(r['total'] for r in aggregate['results'])
checks['manifestMatchesEveryFile']=all(sha(release/p)==h for p,h in manifest['files'].items());checks['projectIdPreserved']=manifest['project_id']=='appgprj_6acf0e7886908191820064ec6fa5afa0'
changed=[str(p.relative_to(release)).replace('\\','/') for p in release.rglob('*') if p.is_file() and p.name!='manifest.json' and (not (base/p.relative_to(release)).exists() or p.read_bytes()!=(base/p.relative_to(release)).read_bytes())];details['changedPackageFiles']=changed;checks['onlyThreePackageFilesChanged']=sorted(changed)==['dist/index.html','dist/src/boot16.js','dist/src/level.js']
old=(base/'dist/src/level.js').read_text();new=(release/'dist/src/level.js').read_text();checks['engineChangeOnlyStartupFrameGate']=old.replace('if (!window.__manual) tick(rdt);','if (!window.__manual && !window.__skybladeBoot?.pending) tick(rdt);')==new
checks['allAssetsByteIdentical']=all(p.read_bytes()==(release/p.relative_to(base)).read_bytes() for p in (base/'dist/assets').rglob('*') if p.is_file())
old_scripts=re.findall(r'<script src="([^"]+)"></script>',(base/'dist/index.html').read_text());html=(release/'dist/index.html').read_text();new_scripts=json.loads(re.search(r'<script id="startupModules16" type="application/json">(.*?)</script>',html).group(1));checks['originalExecutionOrderPreserved']=old_scripts==new_scripts
checks['noQaShipped']=not any(s in html for s in ['qa-results','repair-results','runtime-suite','tests/'])
duplicates={}
for r in matrix['results']:
 if r['scenario']=='fresh':
  counter=collections.Counter(x['file'] for x in r['network'] if x['event']=='response' and x['file'].endswith('.js'));duplicates['mobile' if r['mobile'] else 'desktop']={k:v for k,v in counter.items() if v!=1}
checks['preloadsAvoidDuplicateScriptTransfers']=not any(duplicates.values());details['duplicateScriptResponses']=duplicates
syntax=[]
for p in list((release/'dist').rglob('*.js'))+list(scripts.glob('*16.*')):
 if p.suffix in ['.js','.cjs']:subprocess.run([node,'--check',str(p)],check=True,capture_output=True);syntax.append(str(p.relative_to(root)))
 elif p.suffix=='.py':py_compile.compile(str(p),doraise=True);syntax.append(str(p.relative_to(root)))
checks['protectedRootFilesUnchanged']=not subprocess.check_output([git,'diff','--name-only','2ebeccb146f674bdb5e4e0118460ba547581dcd6','--','dist','.openai','tests','art/references','art/overhaul/skydrake15'],cwd=root,text=True).strip()
result={'status':'Scoped startup defect repaired and verified; unpublished local candidate','manifestSha256':mh,'checks':checks,'details':details,'syntaxFiles':syntax,'passed':all(checks.values()),'historicalLimit':'Original transport failure was not logged. Controlled aborted/empty Chapter2 responses exactly reproduce the saved cascade before QA; successful delays preserve correct order. The confirmed partial-startup failure mode is blocked by RC16.','art':'All RC15 meshes/textures/animation adapters/camera/UI bytes preserved. Existing extreme-pose creases, neck/chest stretch, muzzle/tooth/detail approximations and unmeasured physical-device GPU performance remain.','library':'No retry or alternate upload attempted; boards and RC15 ZIP retained locally.'}
(review/'verification-summary-16.json').write_text(json.dumps(result,indent=2));print(json.dumps({'passed':result['passed'],'checks':checks,'details':details,'syntaxFiles':len(syntax)}));assert result['passed']
