"""Create reduced topology only after the full shoulder's early visual gate."""
import bpy
from pathlib import Path
from mathutils import Matrix
p=Path(__file__).resolve().parents[1]/'skydrake14'
bpy.ops.wm.open_mainfile(filepath=str(p/'source/skydrake-candidate.blend'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');body=next(o for o in bpy.data.objects if o.type=='MESH')
arm.data.pose_position='REST';arm.animation_data.action=None
for tr in arm.animation_data.nla_tracks:tr.mute=True
for b in arm.pose.bones:b.matrix_basis=Matrix.Identity(4)
bpy.context.view_layer.update();bpy.context.view_layer.objects.active=body
dec=body.modifiers.new('Reduced connected shoulder topology','DECIMATE');dec.ratio=.57;bpy.ops.object.modifier_apply(modifier=dec.name)
arm.data.pose_position='POSE';bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(p/'source/skydrake-lod.blend'))
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);arm.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(p/'export/skydrake-lod.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_influence_nb=4,export_all_influences=False,export_materials='EXPORT')
