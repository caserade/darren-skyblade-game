"""Reopen final editable sources without modifying or exporting them."""
import bpy,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'skydrake14';results=[]
for variant in ['candidate','lod']:
 p=root/'source'/('skydrake-'+variant+'.blend');before=hashlib.sha256(p.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(p))
 arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');meshes=[o for o in bpy.data.objects if o.type=='MESH'];used=[]
 for o in meshes:
  for m in o.data.materials:
   if m and m.use_nodes:
    for n in m.node_tree.nodes:
     if n.type=='TEX_IMAGE' and n.image:used.append(n.image)
 images=[{'name':i.name,'packed':bool(i.packed_file),'size':list(i.size),'externalExists':Path(bpy.path.abspath(i.filepath)).is_file()} for i in set(used)]
 checks={'bones':len(arm.data.bones)==39,'actions':len(bpy.data.actions)==14,'meshes':bool(meshes),'texturesAvailable':all(i['packed'] or i['externalExists'] for i in images),'sourceUnchanged':before==hashlib.sha256(p.read_bytes()).hexdigest()}
 results.append({'variant':variant,'sha256':before,'images':images,'checks':checks})
report={'results':results,'passed':all(all(x['checks'].values()) for x in results),'scope':'Blender 5.2 reopens both final editable sources. No save/export mutation.'};(root/'review/source-reopen-14.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));assert report['passed']
