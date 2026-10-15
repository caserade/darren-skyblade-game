"""Correct observed tail/floor penetration in existing actions without changing timing."""
import bpy,math
from mathutils import Matrix
def correct_tail_clearance(arm,body,scene,clips=('stagger','stompRecovery')):
 ids=[v.index for v in body.data.vertices if any(g.weight>.5 and body.vertex_groups[g.group].name.startswith('tail') for g in v.groups)]
 pb=arm.pose.bones['tail1'];reports=[]
 def minimum():
  bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();low=min((ev.matrix_world@me.vertices[i].co).z for i in ids);ev.to_mesh_clear();return low
 for action in bpy.data.actions:
  if action.name not in clips:continue
  arm.animation_data.action=action;arm.animation_data.action_slot=action.slots[0]
  start,end=action.frame_range;frames=sorted(set([float(i) for i in range(int(start),int(end)+1,4)]+[float(end)]));keys=[]
  for f in frames:
   scene.frame_set(int(f),subframe=f%1);bpy.context.view_layer.update();original=pb.matrix.copy();head=arm.matrix_world@pb.head;low_before=minimum()
   def rotate(angle):
    pb.matrix=arm.matrix_world.inverted()@Matrix.Translation(head)@Matrix.Rotation(angle,4,'X')@Matrix.Translation(-head)@arm.matrix_world@original
   angle=0
   if low_before<.03:
    lo=0;hi=.55
    for iteration in range(10):
     angle=(lo+hi)/2;rotate(angle)
     if minimum()<.03:lo=angle
     else:hi=angle
    angle=hi;rotate(angle)
   low_after=minimum();keys.append((f,pb.rotation_quaternion.copy(),angle,low_before,low_after));pb.matrix=original
  # Replace the sampled channel: leaving old 30Hz keys between corrected keys
  # made the exported tail dip back through the floor between authoring samples.
  for layer in action.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for fc in bag.fcurves:
      if fc.data_path=='pose.bones["tail1"].rotation_quaternion':fc.keyframe_points.clear()
  for f,q,*rest in keys:pb.rotation_quaternion=q;pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group='tail1')
  for layer in action.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for fc in bag.fcurves:
      if fc.data_path=='pose.bones["tail1"].rotation_quaternion':
       for key in fc.keyframe_points:key.interpolation='LINEAR'
  reports.append({'clip':action.name,'samples':len(keys),'max_elevation_degrees':math.degrees(max(k[2] for k in keys)),'minimum_before':min(k[3] for k in keys),'minimum_after':min(k[4] for k in keys)})
 return reports

def settle_death_tail(arm,body,scene):
 """Drape the existing death tail over four joints toward the actual floor."""
 from mathutils import Vector,Quaternion
 action=bpy.data.actions['death'];arm.animation_data.action=action;arm.animation_data.action_slot=action.slots[0]
 names=['tail2','tail3','tail4','tail5'];bones=[arm.pose.bones[n] for n in names]
 axes=[(b.bone.matrix_local.to_3x3().inverted()@Vector((1,0,0))).normalized() for b in bones]
 ids=[v.index for v in body.data.vertices if any(g.weight>.5 and body.vertex_groups[g.group].name in ['tail4','tail5'] for g in v.groups)]
 def minimum():
  bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();low=min((ev.matrix_world@me.vertices[i].co).z for i in ids);ev.to_mesh_clear();return low
 start,end=action.frame_range;frames=sorted(set([float(i) for i in range(int(start),int(end)+1,4)]+[float(end)]));keys=[]
 for f in frames:
  scene.frame_set(int(f),subframe=f%1);qs=[b.rotation_quaternion.copy() for b in bones];u=(f-start)/(end-start);k=max(0,min(1,(u-.40)/.35));k=k*k*(3-2*k);before=minimum();target=before*(1-k)+.045*k
  def apply(angle):
   for b,axis,q in zip(bones,axes,qs):b.rotation_quaternion=Quaternion(axis,angle)@q
  angle=0
  if before>target+.001:
   lo=-.45;hi=0;apply(lo)
   if minimum()<target:
    for i in range(12):
     angle=(lo+hi)/2;apply(angle)
     if minimum()<target:lo=angle
     else:hi=angle
    angle=hi
   else:angle=lo
   apply(angle)
  keys.append((f,[b.rotation_quaternion.copy() for b in bones],before,minimum(),angle))
  for b,q in zip(bones,qs):b.rotation_quaternion=q
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     if any(fc.data_path=='pose.bones["'+n+'"].rotation_quaternion' for n in names):fc.keyframe_points.clear()
 for f,qs,*rest in keys:
  for b,q in zip(bones,qs):b.rotation_quaternion=q;b.keyframe_insert(data_path='rotation_quaternion',frame=f,group=b.name)
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     if any(fc.data_path=='pose.bones["'+n+'"].rotation_quaternion' for n in names):
      for key in fc.keyframe_points:key.interpolation='LINEAR'
 return {'clip':'death','samples':len(keys),'end_tip_before':keys[-1][2],'end_tip_after':keys[-1][3],'maximum_extra_rotation_per_joint':max(abs(k[4]) for k in keys)}
