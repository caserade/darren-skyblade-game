import bpy,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'skydrake15';reports=[]
for variant in ['candidate','lod']:
 p=root/'source'/('skydrake-'+variant+'.blend');bpy.ops.wm.open_mainfile(filepath=str(p))
 body=next(o for o in bpy.data.objects if o.type=='MESH');mapping=json.loads((root/'source'/('weights-'+variant+'.json')).read_text());bypos={tuple(round(v,5) for v in d['position']):d['weights'] for d in mapping};count=0;delta=0
 for v in body.data.vertices:
  key=tuple(round(x,5) for x in (v.co.x,v.co.z,-v.co.y))
  if key not in bypos:continue
  actual={body.vertex_groups[g.group].name:g.weight for g in v.groups};want=bypos[key];delta=max(delta,max(abs(actual.get(n,0)-want.get(n,0)) for n in set(actual)|set(want)));count+=1
 images=[{'name':im.name,'packed':bool(im.packed_file),'size':list(im.size)} for im in bpy.data.images if im.type=='IMAGE']
 reports.append({'variant':variant,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'matchedPositions':count,'expectedPositions':len(bypos),'maxWeightDelta':delta,'images':images,'bones':len(next(o for o in bpy.data.objects if o.type=='ARMATURE').data.bones),'passed':count==len(bypos) and delta<1e-6 and all(i['packed'] for i in images)})
(root/'review/blend-reopen-15.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports));assert all(r['passed'] for r in reports)
