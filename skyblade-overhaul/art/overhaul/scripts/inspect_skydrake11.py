import bpy,json
from pathlib import Path
from mathutils import Vector
p=Path(__file__).resolve().parents[1]/'skydrake11';bpy.ops.wm.open_mainfile(filepath=str(p/'source/supplied-skydrake-import.blend'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');arm.data.pose_position='REST';arm.animation_data.action=None
for tr in arm.animation_data.nla_tracks:tr.mute=True
bpy.context.view_layer.update();objs=[]
for o in bpy.data.objects:
 if o.type!='MESH' or not o.data.materials:continue
 parent=o;bone=None
 while parent:
  if parent.parent_type=='BONE':bone=parent.parent_bone;break
  parent=parent.parent
 vs=[o.matrix_world@v.co for v in o.data.vertices];lo=[min(v[k] for v in vs) for k in range(3)];hi=[max(v[k] for v in vs) for k in range(3)]
 objs.append({'name':o.name,'material':o.data.materials[0].name,'bone':bone,'min':lo,'max':hi})
mats=[]
for m in bpy.data.materials:
 if not m.use_nodes:continue
 bs=m.node_tree.nodes.get('Principled BSDF');mats.append({'name':m.name,'color':list(bs.inputs['Base Color'].default_value) if bs else None,'images':[n.image.name for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image]})
r={'objects':objs,'materials':mats};(p/'review/source-parts.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
