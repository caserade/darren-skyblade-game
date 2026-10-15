import hashlib,json,pathlib,subprocess,datetime
root=pathlib.Path(__file__).resolve().parents[3]
review=root/'art/overhaul/heavyweight/review'
def read(name): return json.loads((review/name).read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
audit=read('glb-validation.json')
full=audit[0]['sha256']; lod=audit[1]['sha256']
evidence=['game-integration-report.json','candidate-loading-report.json','candidate-three-report.json','deformation-candidate.json','comparison-06/comparison.json','motion-06/motion-review.json']
for name in evidence: assert read(name)['assetSha256']==full,name
for name in ['lod-review/candidate-three-report.json','deformation-lod.json']: assert read(name)['assetSha256']==lod,name
assert sha(root/'art/overhaul/heavyweight/export/heavyweight-candidate.glb')==full
assert sha(root/'art/overhaul/heavyweight/export/heavyweight-lod.glb')==lod
chomp=sha(root/'dist/assets/chomprex.glb')
assert chomp=='e7c073466cd1980e7a6a11eb17207874ab2ce9966d802a03cdb90f79655f6957'
game=read('game-integration-report.json'); loading=read('candidate-loading-report.json')
checks=[x for case in loading['results'] for x in case['checks']]
assert len(checks)==70 and all(x['pass'] for x in checks)
assert game['passed']==game['total']==18
assert game['existingRuntimeQA']['passed']==game['existingRuntimeQA']['total']==61
assert all(x['passed'] for x in audit)
git=r'C:\Users\caser\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
changed=subprocess.check_output([git,'diff','HEAD','--name-only','--','dist','.openai'],cwd=root,text=True).strip()
assert not changed
files={}
for p in (root/'art/overhaul/heavyweight').rglob('*'):
 if p.is_file() and p.suffix in ['.glb','.blend','.png','.json'] and 'turntable' not in p.parts and 'checkpoint-06-verification' not in p.name:
  files[p.relative_to(root).as_posix()]={'bytes':p.stat().st_size,'sha256':sha(p)}
for name in ['concept_heavyweight.jpg','heavyweight_model_sheet.jpg']:
 p=root/'art/references'/name; files[p.relative_to(root).as_posix()]={'bytes':p.stat().st_size,'sha256':sha(p)}
result={'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'parentCommit':subprocess.check_output([git,'rev-parse','HEAD'],cwd=root,text=True).strip(),'branch':'asset-overhaul-2026-10-14','fullSha256':full,'lodSha256':lod,'chompCheckpoint05Sha256':chomp,'distAndHostingUnchanged':True,'tests':{'integration':18,'runtime':61,'loading':70,'total':149,'allPassed':True},'matchingEvidence':evidence,'technicalGate':'pass within sampled local scope','visualMotionGate':'pending; see VISUAL-GATES-STORMBELLY.md','files':files}
(review/'checkpoint-06-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='files'},indent=2))
print('Hashed files:',len(files))
