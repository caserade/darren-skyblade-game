import bpy,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'skydrake15';reports=[]
for variant in ['candidate','lod']:
 bpy.ops.wm.open_mainfile(filepath=str(root/'source'/('checkpoint14-'+variant+'.blend')))
 body=next(o for o in bpy.data.objects if o.type=='MESH');mapping=json.loads((root/'source'/('weights-'+variant+'.json')).read_text());bypos={tuple(round(v,5) for v in d['position']):d['weights'] for d in mapping};count=0
 for v in body.data.vertices:
  key=tuple(round(x,5) for x in (v.co.x,v.co.z,-v.co.y))
  if key not in bypos:continue
  for group in list(v.groups):body.vertex_groups[group.group].remove([v.index])
  for name,w in bypos[key].items():body.vertex_groups[name].add([v.index],w,'REPLACE')
  count+=1
 bpy.ops.wm.save_as_mainfile(filepath=str(root/'source'/('skydrake-'+variant+'.blend')));reports.append({'variant':variant,'matchedSourceVertices':count,'mappedExportPositions':len(mapping)})
(root/'review/source-weight-sync-15.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports));assert all(r['matchedSourceVertices']>=r['mappedExportPositions'] for r in reports)
