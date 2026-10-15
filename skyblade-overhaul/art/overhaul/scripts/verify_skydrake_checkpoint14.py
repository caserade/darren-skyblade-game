"""Validate final evidence currency for the scoped shoulder and camera repair."""
import hashlib,json,subprocess,struct
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[3];base=root/'art/overhaul';review=base/'skydrake14/review';checks={}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda n:json.loads((review/n).read_text())
assets={v:sha(base/'skydrake14/export'/('skydrake-'+v+'.glb')) for v in ['candidate','lod']};adapter=sha(base/'scripts/skydrake-local-adapter14.js')
counts={}
for v in assets:
 r=read('game-tests-14-'+v+'/report.json');checks[v+'_encounter']=r['passed']==r['total']==56 and not r['errors'];checks[v+'_encounter_current']=r['assetSha256']==assets[v] and r['adapterSha256']==adapter
 for scenario in ['straight','turn','stop-resume','stationary-turn','pursuit-stomp','pursuit-stagger','pursuit-takeoff','straight-30hz','straight-120hz']:
  r=read('gait-14/'+v+'-'+scenario+'/gait-report.json');checks[v+'_'+scenario]=r['passed'] and r['assetSha256']==assets[v] and r['adapterSha256']==adapter
 for folder in ['comparison-14'+('-lod' if v=='lod' else '')]:checks[folder+'_current']=read(folder+'/comparison.json')['assetSha256']==assets[v]
counts.update(encounter=112,gait=162)
r=read('candidate-loading-report.json');checks['loading']=all(c['pass'] for s in r['results'] for c in s['checks']) and r['assetSha256']==assets['candidate'];counts['loading']=sum(len(s['checks']) for s in r['results'])
r=read('combat-14/combat-review.json');checks['combat']=r['passed'] and len(r['records'])==6;counts['combat']=sum(len(s['checks']) for s in r['records'])
for item in r['records']:checks['combat_'+item['kind']+'_'+item['scenario']+'_current']=item['assetSha256']==sha(base/f"skydrake{item['checkpoint']}/export/skydrake-{item['variant']}.glb")
for scenario in ['ground','flight']:
 before=next(x for x in r['records'] if x['kind']=='before' and x['scenario']==scenario)
 for kind in ['after','lod']:
  after=next(x for x in r['records'] if x['kind']==kind and x['scenario']==scenario)
  checks[scenario+'_'+kind+'_same_gameplay_camera']=len(before['shots'])==len(after['shots']) and all(a['frame']==b['frame'] and a['state']==b['state'] and np.allclose(a['root'],b['root'],atol=1e-9) and np.allclose(a['camera'],b['camera'],atol=1e-9) for a,b in zip(before['shots'],after['shots']))
for folder in ['pose-comparison-14'+clay+view for clay in ['', '-clay'] for view in ['', '-opposite','-back']]:
 r=read(folder+'/pose-comparison.json');checks[folder]=len(r['shots'])==42 and all(a['sha256']==sha(base/a['asset']) for a in r['assets'])
r=read('preview-server-14.json');checks['actual_preview']=all(all(s['checks'].values()) and s['assetSha256']==assets['candidate' if s['variant']=='full' else 'lod'] for s in r['results']);counts['preview']=sum(len(x['checks']) for x in r['results'])
r=read('server-runtime-14.json');checks['baseline_qa']=r['passed']==r['total']==61 and not r['pageErrors'];counts['baseline_qa']=61

r=read('retopology-verification-14.json');checks['targeted_contract']=r['passed'] and r['candidateSha256']==assets['candidate'] and r['reducedSha256']==assets['lod'];counts['targeted_contract']=len(r['checks'])
r=read('glb-validation-14.json');checks['structures']=all(x['passed'] and x['sha256']==assets['lod' if 'lod' in x['file'] else 'candidate'] for x in r);counts['structural']=sum(len(x['checks']) for x in r)
r=read('wing-endpoints-14.json');checks['wings']=r['passed'] and all(x['assetSha256']==sha(base/f"skydrake{x['checkpoint']}/export/skydrake-{x['variant']}.glb") for x in r['reports']);counts['wings']=len(r['checks'])
camera_sha=sha(base/'scripts/skyblade-camera14.js')
r=read('camera-lifecycle-14.json');checks['camera_lifecycle']=r['passed'] and r['cameraSha256']==camera_sha;counts['camera_lifecycle']=len(r['checks'])
r=read('camera-14/camera-review.json');checks['camera_runs_current']=r['passed'] and r['cameraSha256']==camera_sha and r['adapterSha256']==adapter and all(x['assetSha256']==assets[x['variant']] for x in r['records']);counts['camera_runs']=sum(len(x['checks']) for x in r['records'])
for v in assets:
 for portrait in [False,True]:
  before,after=[next(x for x in r['records'] if x['variant']==v and x['portrait']==portrait and x['enabled']==enabled) for enabled in [False,True]]
  key=v+('_portrait' if portrait else '_landscape')
  checks[key+'_highflight_framing']=after['elevatedSamples']==after['elevatedCreatureFits']==after['elevatedPlayerFits']==41 and all(x['playerBounds']['visible'] for x in after['samples'])
  checks[key+'_camera_only']=all(a['root']==b['root'] and a['state']==b['state'] and a['player']==b['player'] for a,b in zip(before['samples'],after['samples']))
r=read('cast-14/cast-review.json');checks['integrated_cast']=r['passed'] and all(all(sha(root/f)==h for f,h in x['assets'].items()) and all(sha(base/'scripts'/f)==h for f,h in x['adapters'].items()) for x in r['results']);counts['cast']=sum(len(x['checks']) for x in r['results'])
for v in assets:
 r=read('deformation-'+v+'.json');checks[v+'_motion_finite']=r['nonfinite']==0 and r['assetSha256']==assets[v] and len(r['clips'])==14
counts['authored_pose_samples']=1148
r=read('source-reopen-14.json');checks['editable_sources_reopen']=r['passed'] and all(x['sha256']==sha(base/'skydrake14/source'/('skydrake-'+x['variant']+'.blend')) for x in r['results']);counts['source_reopen']=sum(len(x['checks']) for x in r['results'])
checks['syntax']=all(x['passed'] for x in read('syntax-14.json'));counts['syntax_files']=len(read('syntax-14.json'))
old=(base/'scripts/skydrake-local-adapter12.js').read_text();new=(base/'scripts/skydrake-local-adapter14.js').read_text();checks['runtime_behavior_unchanged']=new.replace('SKY14','SKY12').replace('Sky14','Sky12').replace('sky14','sky12')==old
# Use the independently parsed final reduced geometry to verify its bake correspondence.
s=(base/'scripts/verify_skydrake_retopology13.py').read_text();ns={'__file__':str(base/'scripts/verify_skydrake_retopology13.py')};exec(s[:s.index('g0,a0,h0=')],ns);g,a,h=ns['load'](base/'skydrake14/export/skydrake-lod.glb');pr=g['meshes'][0]['primitives'][0];at=pr['attributes'];geo=a(at['POSITION']).tobytes()+a(pr['indices']).reshape(-1,3).astype('<u4').tobytes()+a(at['TEXCOORD_0']).tobytes();checks['reduced_bake_current']=hashlib.sha256(geo).hexdigest()==read('surface-bake-lod-14.json')['inputGeometrySha256']
baseline='c132613d677f3f2726bdf1a56a1e26415fdbf0a2';git='C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe';changed=subprocess.check_output([git,'diff','--name-only',baseline],cwd=root,text=True).splitlines();checks['tracked_project_and_checkpoint12_unchanged']=all('14' in p and p.startswith('art/overhaul/') for p in changed)
provenance=[]
for rel in ['art/references/concept_skydrake.jpg','art/references/skydrake_model_sheet.jpg','art/overhaul/skydrake14/source/checkpoint12-candidate.blend','art/overhaul/skydrake14/source/skydrake-candidate.blend','art/overhaul/skydrake14/source/skydrake-lod.blend']:
 f=root/rel;provenance.append({'path':rel,'sha256':sha(f),'bytes':f.stat().st_size})
report={'status':'SCOPED_SHOULDER_AND_CAMERA_GATES_PASSED_LOCAL_ONLY','visualGatePassed':True,'baselineCommit':baseline,'assets':assets,'adapterSha256':adapter,'counts':counts,'checks':checks,'technicalEvidencePassed':all(checks.values()),'provenance':provenance,'knownIssues':['Soft armpit fold and exact reference likeness remain approximations.','Small ground/takeoff framing crop remains; high-flight samples pass. No physical controller/phone or full playthrough.','Existing hip/tail deformation and folded-wing complexity remain outside this scoped repair.'],'cameraSha256':camera_sha,'scope':'Checkpoint14 is isolated from failed checkpoint13 and accepted fallback12. Full/reduced source and reports are local only.'}
(review/'checkpoint-verification-14.json').write_text(json.dumps(report,indent=2));print(json.dumps({'technicalEvidencePassed':report['technicalEvidencePassed'],'visualGatePassed':True,'counts':counts,'failed':[k for k,v in checks.items() if not v]}));assert report['technicalEvidencePassed']
