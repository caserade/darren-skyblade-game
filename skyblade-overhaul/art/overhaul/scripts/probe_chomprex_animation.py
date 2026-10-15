"""Isolated animation/export probe. No deployed game files are written."""
import bpy,json,os,math
from mathutils import Vector
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=os.path.join(root,'chomprex')
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'source/chomprex-overhaul-work.blend'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');meshes=[o for o in bpy.data.objects if o.type=='MESH']
arm.data.pose_position='POSE';scene=bpy.context.scene
for tr in arm.animation_data.nla_tracks:tr.mute=True
report={'status':'probe only; visual deformation review and engine validation pending','actions':[],'skin':{}}
for ob in meshes:
 report['skin'][ob.name]={'vertices':len(ob.data.vertices),'unweighted':sum(not v.groups for v in ob.data.vertices),'max_influences':max((len(v.groups) for v in ob.data.vertices),default=0),'sum_error':max((abs(sum(g.weight for g in v.groups)-1) for v in ob.data.vertices),default=0)}
for action in bpy.data.actions:
 arm.animation_data.action=action
 if action.slots:arm.animation_data.action_slot=action.slots[0]
 samples=[]
 for t in [0,.25,.5,.75,1]:
  frame=action.frame_range[0]+t*(action.frame_range[1]-action.frame_range[0]);scene.frame_set(int(frame),subframe=frame%1)
  dg=bpy.context.evaluated_depsgraph_get();lo=[1e9]*3;hi=[-1e9]*3;invalid=0
  for ob in meshes:
   ev=ob.evaluated_get(dg);me=ev.to_mesh()
   for v in me.vertices:
    p=ev.matrix_world@v.co
    if not all(math.isfinite(x) for x in p):invalid+=1
    for i in range(3):lo[i]=min(lo[i],p[i]);hi[i]=max(hi[i],p[i])
   ev.to_mesh_clear()
  samples.append({'frame':frame,'min':lo,'max':hi,'nonfinite':invalid})
 report['actions'].append({'name':action.name,'frames':list(action.frame_range),'samples':samples})
arm.animation_data.action=None;scene.frame_set(0)
os.makedirs(os.path.join(out,'export'),exist_ok=True)
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
for ob in meshes:ob.select_set(True)
bpy.context.view_layer.objects.active=arm
result=bpy.ops.export_scene.gltf(filepath=os.path.join(out,'export/chomprex-probe.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_influence_nb=4,export_all_influences=False)
report['export_result']=sorted(result)
json.dump(report,open(os.path.join(out,'review/animation-probe.json'),'w'),indent=2)
print('PROBE_COMPLETE',len(report['actions']),result)
