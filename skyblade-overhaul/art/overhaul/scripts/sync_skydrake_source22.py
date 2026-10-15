import bpy,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'skydrake22';reports=[]
for variant in ['candidate','lod']:
 bpy.ops.wm.open_mainfile(filepath=str(root/'skydrake15/source'/('skydrake-'+variant+'.blend')))
 body=next(o for o in bpy.data.objects if o.type=='MESH');mapping=json.loads((out/'source'/('weights-'+variant+'.json')).read_text());bypos={tuple(round(v,5) for v in d['position']):d['weights'] for d in mapping};count=0
 for v in body.data.vertices:
  key=tuple(round(x,5) for x in (v.co.x,v.co.z,-v.co.y))
  if key not in bypos:continue
  for group in list(v.groups):body.vertex_groups[group.group].remove([v.index])
  for name,w in bypos[key].items():body.vertex_groups[name].add([v.index],w,'REPLACE')
  count+=1
 target=out/'source'/('skydrake-'+variant+'.blend');bpy.ops.wm.save_as_mainfile(filepath=str(target));bpy.ops.wm.open_mainfile(filepath=str(target));body=next(o for o in bpy.data.objects if o.type=='MESH');delta=0;matched=set()
 for v in body.data.vertices:
  key=tuple(round(x,5) for x in (v.co.x,v.co.z,-v.co.y))
  if key not in bypos:continue
  actual={body.vertex_groups[g.group].name:g.weight for g in v.groups};want=bypos[key];delta=max(delta,max(abs(actual.get(n,0)-want.get(n,0)) for n in set(actual)|set(want)));matched.add(key)
 images=[{'name':im.name,'packed':bool(im.packed_file),'size':list(im.size)} for im in bpy.data.images if im.type=='IMAGE'];bones=len(next(o for o in bpy.data.objects if o.type=='ARMATURE').data.bones)
 reports.append({'variant':variant,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'matchedSourceVertices':count,'matchedPositions':len(matched),'expectedPositions':len(bypos),'maximumWeightDelta':delta,'bones':bones,'images':images,'passed':len(matched)==len(bypos) and delta<1e-6 and bones==39 and all(i['packed'] for i in images)})
(out/'review/source-sync-22.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports));assert all(r['passed'] for r in reports)
