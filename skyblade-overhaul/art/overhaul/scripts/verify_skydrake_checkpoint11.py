import hashlib,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake11/review'
sha=lambda p:hashlib.sha256((root/p).read_bytes()).hexdigest()
adapter=sha(Path('art/overhaul/scripts/skydrake-local-adapter11.js'));checks={};records=[]
for variant in ['candidate','lod']:
 asset=sha(Path('art/overhaul/skydrake11/export/skydrake-'+variant+'.glb'))
 for name in ['game-tests-11-'+variant+'/report.json','game-motion-11-'+variant+'/report.json','deformation-'+variant+'.json',('comparison-11' if variant=='candidate' else 'comparison-11-lod')+'/comparison.json']:
  r=json.loads((review/name).read_text());checks[name+'_asset_current']=r['assetSha256']==asset
  if 'adapterSha256' in r:checks[name+'_adapter_current']=r['adapterSha256']==adapter
  if 'nonfinite' in r:checks[name+'_finite']=r['nonfinite']==0
  if isinstance(r.get('checks'),list):checks[name+'_passes']=all(c['pass'] for c in r['checks'])
  elif isinstance(r.get('checks'),dict):checks[name+'_passes']=all(r['checks'].values())
 records.append({'variant':variant,'sha256':asset})
for r in json.loads((review/'glb-validation-11.json').read_text()):checks[r['file']+'_structure']=r['passed'] and r['sha256']==sha(Path('art/overhaul/skydrake11/export')/r['file'])
loading=json.loads((review/'candidate-loading-report.json').read_text());checks['loading_current']=loading['assetSha256']==records[0]['sha256'];checks['loading_70_pass']=all(c['pass'] for s in loading['results'] for c in s['checks'])
preview=json.loads((review/'preview-server-11.json').read_text());checks['actual_preview_passes']=all(all(r['checks'].values()) and r['assetSha256']==records[i]['sha256'] for i,r in enumerate(preview['results']))
qa=json.loads((review/'server-runtime-11.json').read_text());checks['actual_baseline_qa_61_pass']=qa['passed']==qa['total']==61 and not qa['pageErrors']
motion=json.loads((review/'motion-11/motion-review.json').read_text());checks['50_motion_views_current']=motion['assetSha256']==records[0]['sha256'] and len(motion['shots'])==50
old_adapter=(root/'art/overhaul/scripts/skydrake-local-adapter10.js').read_text();new_adapter=(root/'art/overhaul/scripts/skydrake-local-adapter11.js').read_text()
checks['gait_and_runtime_behavior_unchanged']=new_adapter.replace('SKY11','SKY10').replace('Sky11','Sky10').replace('sky11','sky10')==old_adapter
old_maps=json.loads((root/'art/overhaul/skydrake10/review/glb-validation-10.json').read_text())[0]['images']
for item in json.loads((review/'glb-validation-11.json').read_text()):checks[item['file']+'_original_atlases']=sorted(i['sha256'] for i in item['images'])==sorted(i['sha256'] for i in old_maps)
wings=json.loads((review/'wing-endpoints-11.json').read_text());checks['wing_edge_and_tip_motion_pass']=wings['passed']
for item in wings['reports']:checks[f"wing_{item['checkpoint']}_{item['variant']}_current"]=item['assetSha256']==sha(Path(f"art/overhaul/skydrake{item['checkpoint']}/export/skydrake-{item['variant']}.glb"))
poses=json.loads((review/'pose-comparison-11/pose-comparison.json').read_text());checks['24_matched_pose_views']=len(poses['shots'])==24
for item in poses['assets']:checks[item['asset']+'_pose_current']=item['sha256']==sha(Path('art/overhaul')/item['asset'])
for variant in ['candidate','lod']:
 r=json.loads((review/f'player-camera-11/{variant}-straight/gait-report.json').read_text());checks[variant+'_player_camera_current']=r['assetSha256']==next(a['sha256'] for a in records if a['variant']==variant) and r['adapterSha256']==adapter;checks[variant+'_player_camera_pass']=r['passed']
for variant in ['candidate','lod']:
 asset=next(r['sha256'] for r in records if r['variant']==variant)
 for scenario in ['straight','turn','stop-resume','stationary-turn','pursuit-stomp','pursuit-stagger','pursuit-takeoff']:
  name='gait-11/'+variant+'-'+scenario+'/gait-report.json';r=json.loads((review/name).read_text());checks[name+'_current']=r['assetSha256']==asset and r['adapterSha256']==adapter;checks[name+'_passes']=r['passed']
 for fps in [30,120]:
  name=f'gait-11/{variant}-straight-{fps}hz/gait-report.json';r=json.loads((review/name).read_text());checks[name+'_current']=r['assetSha256']==asset and r['adapterSha256']==adapter;checks[name+'_passes']=r['passed'] and r['fps']==fps
git='C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe'
baseline='2a6814e97c07186bff7e23aaffbdf42e5f797ef6';protected=['art/overhaul/skydrake10','art/overhaul/scripts/*10*','art/overhaul/CHECKPOINT-10.md','art/overhaul/VISUAL-GATES-SKYDRAKE-10.md','art/overhaul/CHECKPOINT-09.md','art/overhaul/VISUAL-GATES-SKYDRAKE.md','art/overhaul/scripts/*09*','art/overhaul/skydrake','dist','.openai','art/overhaul/heavyweight','art/overhaul/chomprex','art/overhaul/scripts/heavyweight-local-adapter.js','art/overhaul/scripts/chomprex-local-adapter.js']
diff=subprocess.check_output([git,'diff','--name-only',baseline,'--',*protected],cwd=root,text=True);checks['checkpoint10_and_prior_and_live_files_unchanged']=not diff.strip()
provenance=[]
for rel in ['art/references/concept_skydrake.jpg','art/references/skydrake_model_sheet.jpg','art/overhaul/skydrake11/source/supplied-skydrake.glb','art/overhaul/skydrake11/source/supplied-skydrake-lod.glb','art/overhaul/skydrake11/source/sculpt_cast.py','art/overhaul/skydrake11/source/sculpt_lib.py','art/overhaul/skydrake11/source/skydrake-candidate.blend','art/overhaul/skydrake11/source/skydrake-lod.blend']:
 provenance.append({'path':rel,'sha256':sha(Path(rel)),'bytes':(root/rel).stat().st_size})
r={'baselineCommit':baseline,'adapterSha256':adapter,'assets':records,'provenance':provenance,'checks':checks,'passed':all(checks.values())};(review/'checkpoint-verification-11.json').write_text(json.dumps(r,indent=2));print(json.dumps({'passed':r['passed'],'checks':len(checks),'failed':[k for k,v in checks.items() if not v]}));assert r['passed']
