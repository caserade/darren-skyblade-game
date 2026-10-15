import hashlib,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake/review'
sha=lambda p:hashlib.sha256((root/p).read_bytes()).hexdigest()
adapter=sha(Path('art/overhaul/scripts/skydrake-local-adapter09.js'));checks={};records=[]
for variant in ['candidate','lod']:
 asset=sha(Path('art/overhaul/skydrake/export/skydrake-'+variant+'.glb'))
 for name in ['game-tests-09-'+variant+'/report.json','game-motion-09-'+variant+'/report.json','deformation-'+variant+'.json',('comparison-09' if variant=='candidate' else 'comparison-09-lod')+'/comparison.json']:
  r=json.loads((review/name).read_text());checks[name+'_asset_current']=r['assetSha256']==asset
  if 'adapterSha256' in r:checks[name+'_adapter_current']=r['adapterSha256']==adapter
  if 'nonfinite' in r:checks[name+'_finite']=r['nonfinite']==0
  if isinstance(r.get('checks'),list):checks[name+'_passes']=all(c['pass'] for c in r['checks'])
  elif isinstance(r.get('checks'),dict):checks[name+'_passes']=all(r['checks'].values())
 records.append({'variant':variant,'sha256':asset})
for r in json.loads((review/'glb-validation-09.json').read_text()):checks[r['file']+'_structure']=r['passed'] and r['sha256']==sha(Path('art/overhaul/skydrake/export')/r['file'])
loading=json.loads((review/'candidate-loading-report.json').read_text());checks['loading_current']=loading['assetSha256']==records[0]['sha256'];checks['loading_70_pass']=all(c['pass'] for s in loading['results'] for c in s['checks'])
preview=json.loads((review/'preview-server-09.json').read_text());checks['actual_preview_passes']=all(all(r['checks'].values()) and r['assetSha256']==records[i]['sha256'] for i,r in enumerate(preview['results']))
qa=json.loads((review/'server-runtime-09.json').read_text());checks['actual_baseline_qa_61_pass']=qa['passed']==qa['total']==61 and not qa['pageErrors']
motion=json.loads((review/'motion-09/motion-review.json').read_text());checks['50_motion_views_current']=motion['assetSha256']==records[0]['sha256'] and len(motion['shots'])==50
git='C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe'
baseline='08b9e67183f2cede3cdc161002092b56e99d954e';protected=['dist','.openai','art/overhaul/heavyweight','art/overhaul/chomprex','art/overhaul/scripts/heavyweight-local-adapter.js','art/overhaul/scripts/chomprex-local-adapter.js']
diff=subprocess.check_output([git,'diff','--name-only',baseline,'--',*protected],cwd=root,text=True);checks['checkpoint08_and_live_files_unchanged']=not diff.strip()
provenance=[]
for rel in ['art/references/concept_skydrake.jpg','art/references/skydrake_model_sheet.jpg','art/overhaul/skydrake/source/supplied-skydrake.glb','art/overhaul/skydrake/source/supplied-skydrake-lod.glb','art/overhaul/skydrake/source/sculpt_cast.py','art/overhaul/skydrake/source/sculpt_lib.py','art/overhaul/skydrake/source/skydrake-candidate.blend','art/overhaul/skydrake/source/skydrake-lod.blend']:
 provenance.append({'path':rel,'sha256':sha(Path(rel)),'bytes':(root/rel).stat().st_size})
r={'baselineCommit':baseline,'adapterSha256':adapter,'assets':records,'provenance':provenance,'checks':checks,'passed':all(checks.values())};(review/'checkpoint-verification-09.json').write_text(json.dumps(r,indent=2));print(json.dumps({'passed':r['passed'],'checks':len(checks),'failed':[k for k,v in checks.items() if not v]}));assert r['passed']
