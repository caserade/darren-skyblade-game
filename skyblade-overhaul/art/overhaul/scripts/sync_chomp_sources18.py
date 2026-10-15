"""Apply accepted mesh study positions to copies of accepted editable sources."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
root=Path(__file__).resolve().parents[1];out=root/'chomp18';reports=[]
def signature(arm,body):
 actions=[]
 for a in bpy.data.actions:
  channels=[]
  for layer in a.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for fc in bag.fcurves:channels.append([fc.data_path,fc.array_index,[[list(k.co),k.interpolation,list(k.handle_left),list(k.handle_right)] for k in fc.keyframe_points]])
  actions.append([a.name,channels])
 return {'actions':actions,'bones':[[b.name,list(b.head_local),list(b.tail_local),[list(r) for r in b.matrix_local]] for b in arm.data.bones], 'weights':[[[g.group,g.weight] for g in v.groups] for v in body.data.vertices], 'uv':[[list(d.uv) for d in layer.data] for layer in body.data.uv_layers], 'polygons':[list(p.vertices) for p in body.data.polygons]}
for variant in ['candidate','lod']:
 src=root/'chomprex/source'/('chomprex-runtime-candidate.blend' if variant=='candidate' else 'chomprex-lod.blend');srcsha=hashlib.sha256(src.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(src));arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');body=next(o for o in bpy.data.objects if o.type=='MESH');before=signature(arm,body)
 mapping=json.loads((out/'source'/('positions-'+variant+'.json')).read_text());unique={tuple(round(v,5) for v in m['before']):m for m in mapping};maps=list(unique.values());kd=KDTree(len(maps))
 for i,m in enumerate(maps):kd.insert(Vector(m['before']),i)
 kd.balance();matched=0;maxdistance=0
 for v in body.data.vertices:
  p=Vector((v.co.x,v.co.z,-v.co.y));co,i,d=kd.find(p)
  if d>2e-5:continue
  q=maps[i]['after'];v.co=(q[0],-q[2],q[1]);matched+=1;maxdistance=max(maxdistance,d)
 body.data.update();after=signature(arm,body);target=out/'source'/('chomprex-'+variant+'.blend');bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(target));bpy.ops.wm.open_mainfile(filepath=str(target));savedbody=next(o for o in bpy.data.objects if o.type=='MESH');savedarm=next(o for o in bpy.data.objects if o.type=='ARMATURE');saved=signature(savedarm,savedbody)
 expected={tuple(round(v,5) for v in m['after']) for m in maps};actual={tuple(round(x,5) for x in (v.co.x,v.co.z,-v.co.y)) for v in savedbody.data.vertices};missing=len(expected-actual)
 report={'variant':variant,'source':str(src.relative_to(root)),'sourceSha256':srcsha,'output':str(target.relative_to(root)),'outputSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'matchedVertices':matched,'mappedPositions':len(maps),'missingSavedPositions':missing,'maximumMatchDistance':maxdistance,'rigClipsWeightsUvTopologyUnchanged':before==after==saved,'acceptedSourceUnchanged':srcsha==hashlib.sha256(src.read_bytes()).hexdigest()};report['passed']=not missing and report['rigClipsWeightsUvTopologyUnchanged'] and report['acceptedSourceUnchanged'];reports.append(report);print(json.dumps(report))
(out/'review/source-sync-18.json').write_text(json.dumps(reports,indent=2));assert all(r['passed'] for r in reports)
