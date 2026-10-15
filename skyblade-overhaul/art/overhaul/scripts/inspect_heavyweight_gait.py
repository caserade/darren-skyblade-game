import bpy,json
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'heavyweight'
bpy.ops.wm.open_mainfile(filepath=str(p/'source/heavyweight-runtime-candidate.blend'))
a=next(o for o in bpy.data.objects if o.type=='ARMATURE')
a.animation_data.action=bpy.data.actions['idle'];a.animation_data.action_slot=a.animation_data.action.slots[0];bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
print('ARM_MATRIX',list(map(list,a.matrix_world)))
for n in ['root','hips','thighL','shinL','footL','toeL','thighR','shinR','footR','toeR']:
 b=a.pose.bones[n];print(n,'parent',b.parent.name if b.parent else None,'head',list(a.matrix_world@b.head),'tail',list(a.matrix_world@b.tail),'local',list(b.location),'rot',list(b.rotation_quaternion))
