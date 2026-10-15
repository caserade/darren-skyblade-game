"""Validate evidence currency for an explicitly unaccepted retopology experiment."""
import hashlib,json,subprocess,struct
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[3];base=root/'art/overhaul';review=base/'skydrake13/review';checks={}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda n:json.loads((review/n).read_text())
assets={v:sha(base/'skydrake13/export'/('skydrake-'+v+'.glb')) for v in ['candidate','lod']};adapter=sha(base/'scripts/skydrake-local-adapter13.js')
counts={}
for v in assets:
 r=read('game-tests-13-'+v+'/report.json');checks[v+'_encounter']=r['passed']==r['total']==56 and not r['errors'];checks[v+'_encounter_current']=r['assetSha256']==assets[v] and r['adapterSha256']==adapter
 for scenario in ['straight','turn','stop-resume','stationary-turn','pursuit-stomp','pursuit-stagger','pursuit-takeoff','straight-30hz','straight-120hz']:
  r=read('gait-13/'+v+'-'+scenario+'/gait-report.json');checks[v+'_'+scenario]=r['passed'] and r['assetSha256']==assets[v] and r['adapterSha256']==adapter
 for folder in ['comparison-13'+('-lod' if v=='lod' else '')]:checks[folder+'_current']=read(folder+'/comparison.json')['assetSha256']==assets[v]
counts.update(encounter=112,gait=162)
r=read('candidate-loading-report.json');checks['loading']=all(c['pass'] for s in r['results'] for c in s['checks']) and r['assetSha256']==assets['candidate'];counts['loading']=sum(len(s['checks']) for s in r['results'])
r=read('combat-13/combat-review.json');checks['combat']=r['passed'] and len(r['records'])==6;counts['combat']=sum(len(s['checks']) for s in r['records'])
for item in r['records']:checks['combat_'+item['kind']+'_'+item['scenario']+'_current']=item['assetSha256']==sha(base/f"skydrake{item['checkpoint']}/export/skydrake-{item['variant']}.glb")
for scenario in ['ground','flight']:
 before=next(x for x in r['records'] if x['kind']=='before' and x['scenario']==scenario)
 for kind in ['after','lod']:
  after=next(x for x in r['records'] if x['kind']==kind and x['scenario']==scenario)
  checks[scenario+'_'+kind+'_same_gameplay_camera']=len(before['shots'])==len(after['shots']) and all(a['frame']==b['frame'] and a['state']==b['state'] and np.allclose(a['root'],b['root'],atol=1e-9) and np.allclose(a['camera'],b['camera'],atol=1e-9) for a,b in zip(before['shots'],after['shots']))
for folder in ['pose-comparison-13','pose-comparison-13-clay']:
 r=read(folder+'/pose-comparison.json');checks[folder]=len(r['shots'])==24 and all(a['sha256']==sha(base/a['asset']) for a in r['assets'])
r=read('preview-server-13.json');checks['actual_preview']=all(all(s['checks'].values()) and s['assetSha256']==assets['candidate' if s['variant']=='full' else 'lod'] for s in r['results']);counts['preview']=10
r=read('server-runtime-13.json');checks['baseline_qa_repeat']=r['passed']==r['total']==61 and not r['pageErrors'];counts['baseline_qa_repeat']=61
first=read('server-runtime-13-attempt1.json');counts['baseline_qa_first_passed']=first['passed'];counts['baseline_qa_first_total']=first['total']
r=read('retopology-verification-13.json');checks['targeted_contract']=r['passed'] and r['candidateSha256']==assets['candidate'] and r['reducedSha256']==assets['lod'];counts['targeted_contract']=len(r['checks'])
r=read('glb-validation-13.json');checks['structures']=all(x['passed'] and x['sha256']==assets['lod' if 'lod' in x['file'] else 'candidate'] for x in r);counts['structural']=sum(len(x['checks']) for x in r)
r=read('wing-endpoints-13.json');checks['wings']=r['passed'] and all(x['assetSha256']==sha(base/f"skydrake{x['checkpoint']}/export/skydrake-{x['variant']}.glb") for x in r['reports']);counts['wings']=len(r['checks'])
old=(base/'scripts/skydrake-local-adapter12.js').read_text();new=(base/'scripts/skydrake-local-adapter13.js').read_text();checks['runtime_behavior_unchanged']=new.replace('SKY13','SKY12').replace('Sky13','Sky12').replace('sky13','sky12')==old
# Use the independently parsed final reduced geometry to verify its bake correspondence.
s=(base/'scripts/verify_skydrake_retopology13.py').read_text();ns={'__file__':str(base/'scripts/verify_skydrake_retopology13.py')};exec(s[:s.index('g0,a0,h0=')],ns);g,a,h=ns['load'](base/'skydrake13/export/skydrake-lod.glb');pr=g['meshes'][0]['primitives'][0];at=pr['attributes'];geo=a(at['POSITION']).tobytes()+a(pr['indices']).reshape(-1,3).astype('<u4').tobytes()+a(at['TEXCOORD_0']).tobytes();checks['reduced_bake_current']=hashlib.sha256(geo).hexdigest()==read('surface-bake-lod-13.json')['inputGeometrySha256']
baseline='4b80fab92c6060128509d9ba2e303290c0501162';git='C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe';changed=subprocess.check_output([git,'diff','--name-only',baseline],cwd=root,text=True).splitlines();checks['tracked_project_and_checkpoint12_unchanged']=all('13' in p and p.startswith('art/overhaul/') for p in changed)
provenance=[]
for rel in ['art/references/concept_skydrake.jpg','art/references/skydrake_model_sheet.jpg','art/overhaul/skydrake13/source/checkpoint12-candidate.blend','art/overhaul/skydrake13/source/checkpoint12-lod.blend','art/overhaul/skydrake13/source/skydrake-candidate.blend','art/overhaul/skydrake13/source/skydrake-lod.blend']:
 f=root/rel;provenance.append({'path':rel,'sha256':sha(f),'bytes':f.stat().st_size})
report={'status':'EXPERIMENTAL_NOT_ACCEPTED','visualGatePassed':False,'baselineCommit':baseline,'assets':assets,'adapterSha256':adapter,'counts':counts,'checks':checks,'technicalEvidencePassed':all(checks.values()),'provenance':provenance,'knownIssues':['Torso-to-arm fan crease in ordinary and raised-arm poses; candidate must not replace checkpoint12.','Existing high-swoop framing limitation.','Baseline QA charge/dodge failed on first run, passed on repeat; both reports retained.'],'interruption':'Transport closed once near05:03UTC. Image read recovered05:03:25; shell/file/git checks confirmed recovery. Saved sources reopened successfully; no observed lost work.'}
(review/'checkpoint-verification-13.json').write_text(json.dumps(report,indent=2));print(json.dumps({'technicalEvidencePassed':report['technicalEvidencePassed'],'visualGatePassed':False,'counts':counts,'failed':[k for k,v in checks.items() if not v]}));assert report['technicalEvidencePassed']
