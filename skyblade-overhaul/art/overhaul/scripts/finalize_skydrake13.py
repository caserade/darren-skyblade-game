"""Embed the fresh patch and reduced-surface bakes without rebuilding geometry."""
import bpy
from pathlib import Path
from mathutils import Matrix
p=Path(__file__).resolve().parents[1]/'skydrake13'
for variant in ['candidate','lod']:
 bpy.ops.wm.open_mainfile(filepath=str(p/'source'/('skydrake-'+variant+'.blend')))
 arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');body=next(o for o in bpy.data.objects if o.type=='MESH')
 for mat in body.data.materials:
  for node in mat.node_tree.nodes:
   if node.type!='TEX_IMAGE' or not node.image:continue
   normal=node.image.colorspace_settings.name=='Non-Color'
   target=p/'source/shoulder-color.jpg' if mat.name=='SkyDrake shoulder retopology' else p/'source'/('skydrake-lod-surface-'+('normal' if normal else 'color')+'.jpg') if variant=='lod' and mat.name=='skydrake_skin' else None
   if target:
    node.image=bpy.data.images.load(str(target),check_existing=False);node.image.colorspace_settings.name='Non-Color' if normal else 'sRGB';node.image.pack()
 arm.data.pose_position='POSE';arm.animation_data.action=None
 for b in arm.pose.bones:b.matrix_basis=Matrix.Identity(4)
 bpy.context.scene.frame_set(0);bpy.context.view_layer.update();bpy.ops.wm.save_as_mainfile(filepath=str(p/'source'/('skydrake-'+variant+'.blend')))
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);arm.select_set(True);bpy.context.view_layer.objects.active=arm
 bpy.ops.export_scene.gltf(filepath=str(p/'export'/('skydrake-'+variant+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_influence_nb=4,export_all_influences=False,export_materials='EXPORT')
