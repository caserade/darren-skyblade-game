import bpy,os,json
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=os.path.join(root,'heavyweight')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(out,'source/supplied-heavyweight.glb'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
report={'bones':{b.name:list(arm.matrix_world@b.head_local) for b in arm.data.bones},'actions':{a.name:list(a.frame_range) for a in bpy.data.actions},'objects':[(o.name,o.type) for o in bpy.data.objects]}
json.dump(report,open(os.path.join(out,'review/supplied-import.json'),'w'),indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'source/supplied-heavyweight-import.blend'))
print(json.dumps(report))
