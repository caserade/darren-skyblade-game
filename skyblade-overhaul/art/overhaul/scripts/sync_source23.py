import bpy,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]; dst=root/'skydrake23'
bpy.ops.wm.open_mainfile(filepath=str(root/'skydrake22/source/skydrake-lod.blend'))
body=next(o for o in bpy.data.objects if o.type=='MESH')
def weights():return [(v.index,[(g.group,g.weight) for g in v.groups]) for v in body.data.vertices]
before=weights(); replaced=[]
for mat in body.data.materials:
 name='skin-color.png' if mat.name=='skydrake_skin' else 'shoulder-color.png' if mat.name=='SkyDrake shoulder retopology' else None
 if not name:continue
 for node in mat.node_tree.nodes:
  if node.type=='TEX_IMAGE' and node.image and node.image.colorspace_settings.name!='Non-Color':
   node.image=bpy.data.images.load(str(dst/'source'/name),check_existing=False);node.image.colorspace_settings.name='sRGB';node.image.pack();replaced.append(name)
assert sorted(replaced)==['shoulder-color.png','skin-color.png']
bpy.ops.wm.save_as_mainfile(filepath=str(dst/'source/skydrake-lod.blend'))
bpy.ops.wm.open_mainfile(filepath=str(dst/'source/skydrake-lod.blend'))
body=next(o for o in bpy.data.objects if o.type=='MESH');assert before==weights()
for name in replaced:
 im=next(i for i in bpy.data.images if i.name==name);assert bytes(im.packed_file.data)==(dst/'source'/name).read_bytes()
(dst/'review/source-sync-23.json').write_text(json.dumps({'passed':True,'reopened':True,'packedImagesExact':replaced,'weightsUnchanged':True,'blender':bpy.app.version_string},indent=2))
