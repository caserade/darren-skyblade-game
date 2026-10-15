from pathlib import Path
import json,hashlib,datetime
root=Path(__file__).resolve().parents[3];r=root/'art/overhaul/chomprex/review';a=root/'art/overhaul/chomprex'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
full=sha(a/'export/chomprex-candidate.glb');lod=sha(a/'export/chomprex-lod.glb')
g=read(r/'game-integration-report.json');l=read(r/'production-loading-report.json');q=read(r/'existing-runtime-qa.json');p=read(r/'candidate-three-report.json');lp=read(r/'lod-review/candidate-three-report.json');h=read(r/'root-cause-05/hinge-final.json');m=read(r/'motion-05/motion-review.json');audit=read(r/'glb-validation.json')
assert sha(root/'dist/assets/chomprex.glb')==full
assert all(x['assetSha256']==full for x in [g,l,p,h,m])
assert lp['assetSha256']==lod and audit[0]['sha256']==full and audit[1]['sha256']==lod
assert all(x['passed'] for x in audit)
checks=g['checks']+[x for s in l['results'] for x in s['checks']]+q['results']
assert all(x['pass'] for x in checks) and len(checks)==147
assert not g['errors'] and all(not s['errors'] for s in l['results']) and h['pass']
assert all(not x['pageErrors'] and x['webglError']==0 and all(c['nonfiniteSampledVertices']==0 for c in x['clips']) for x in [p,lp])
postuv=read(r/'root-cause-05/uv-island-after.json');assert postuv['narrow_under_2px']==0
result={'checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'Final exact-hash checkpoint verification passed; publication unchanged','full_sha256':full,'lod_sha256':lod,'reference_sha256':sha(root/'art/references/concept_chomprex.jpg'),'full_bytes':(a/'export/chomprex-candidate.glb').stat().st_size,'lod_bytes':(a/'export/chomprex-lod.glb').stat().st_size,'triangles':{'full':audit[0]['triangles'],'lod':audit[1]['triangles']},'runtime_checks':{'integration':len(g['checks']),'loading':sum(len(s['checks']) for s in l['results']),'existing':q['total'],'passed':147},'hinge_maximum_increase':h['maximumIncrease'],'atlas_coverage':{x['file']:x['atlas_coverage'] for x in audit},'uv_islands_narrow_under_2px':postuv['narrow_under_2px'],'visual_height':g['visualHeight'],'same_scene_draw_calls':{'before':g['baselineRenderInfo']['calls'],'after':g['candidateRenderInfo']['calls']},'same_scene_triangles':{'before':g['baselineRenderInfo']['triangles'],'after':g['candidateRenderInfo']['triangles']},'motion_screenshots':len(m['shots']),'sources':{n:sha(root/'art/overhaul/scripts'/n) for n in ['build_chomprex.py','bake_chomprex.py','uv_raster_safety.py','export_chomprex_lod.py']}}
(r/'checkpoint-05-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

