import bpy,json,os
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'skydrake11'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(p/'source/supplied-skydrake.glb'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
report={'armature':arm.name,'bones':{b.name:{'head':list(arm.matrix_world@b.head_local),'parent':b.parent.name if b.parent else None} for b in arm.data.bones},'actions':{a.name:list(a.frame_range) for a in bpy.data.actions},'fps':bpy.context.scene.render.fps,'objects':[{'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None,'parentType':o.parent_type,'parentBone':o.parent_bone,'vertices':len(o.data.vertices) if o.type=='MESH' else None,'materials':[m.name for m in o.data.materials] if o.type=='MESH' else []} for o in bpy.data.objects]}
(p/'review/supplied-import.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(p/'source/supplied-skydrake-import.blend'))
print(json.dumps(report))
