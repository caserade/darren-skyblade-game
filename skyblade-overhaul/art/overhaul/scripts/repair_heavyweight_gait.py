"""Repair only the existing heavyWalk action with a planted straight-line gait.
Nominal game speed 1.65 m/s, cycle .9s; original 1.5s action duration is retained.
The local adapter phase-locks this action to measured travel and handles turns.
"""
import bpy,math,json,os,sys,tempfile
from mathutils import Vector,Matrix,Quaternion
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'heavyweight'
tempfile.tempdir='C:/Users/caser/AppData/Local/Temp'
sys.path.insert(0,str(Path(__file__).resolve().parent))
baseline=p/'source/heavyweight-pre-gait.blend'
bpy.ops.wm.open_mainfile(filepath=str(baseline))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');body=next(o for o in bpy.data.objects if o.type=='MESH');scene=bpy.context.scene
arm.animation_data.action=bpy.data.actions['idle'];arm.animation_data.action_slot=arm.animation_data.action.slots[0];scene.frame_set(0);bpy.context.view_layer.update()
idleRoot=arm.pose.bones['root'].location.copy();base={};idleq={}
for side in ['L','R']:
 for name in ['thigh','shin','foot','toe']:
  b=arm.pose.bones[name+side];idleq[name+side]=b.rotation_quaternion.copy()
 foot=arm.pose.bones['foot'+side];base[side]={'ankle':arm.matrix_world@foot.head,'orientation':(arm.matrix_world@foot.matrix).to_quaternion()}
action=bpy.data.actions['heavyWalk'];arm.animation_data.action=action;arm.animation_data.action_slot=action.slots[0]
start,end=map(float,action.frame_range);names=['thighL','shinL','footL','toeL','thighR','shinR','footR','toeR'];frames=sorted(set([float(i) for i in range(int(start),int(end)+1,3)]+[end]));samples=[];errors=[]
scale=3.4938671960850307/4.613870137354194;stroke=1.65*.9*.5/scale
def update():bpy.context.view_layer.update()
def head(b):return arm.matrix_world@b.head
def rotate(b,q):
 h=head(b);b.matrix=arm.matrix_world.inverted()@Matrix.Translation(h)@q.to_matrix().to_4x4()@Matrix.Translation(-h)@arm.matrix_world@b.matrix;update()
def solve(side,target):
 th=arm.pose.bones['thigh'+side];sh=arm.pose.bones['shin'+side];ft=arm.pose.bones['foot'+side]
 h=head(th);k=head(sh);a=head(ft);l1=(k-h).length;l2=(a-k).length;d=target-h;length=max(.001,min(d.length,l1+l2-.0001));axis=d.normalized()
 bend=Vector((0,-1,0));bend=(bend-axis*bend.dot(axis)).normalized()
 co=max(-1,min(1,(l1*l1+length*length-l2*l2)/(2*l1*length)));kt=h+axis*(co*l1)+bend*(math.sqrt(max(0,1-co*co))*l1)
 rotate(th,(k-h).normalized().rotation_difference((kt-h).normalized()));k=head(sh);a=head(ft)
 rotate(sh,(a-k).normalized().rotation_difference((target-k).normalized()))
 w=arm.matrix_world@ft.matrix;w=Matrix.LocRotScale(w.translation,base[side]['orientation'],w.to_scale());ft.matrix=arm.matrix_world.inverted()@w
 arm.pose.bones['toe'+side].rotation_quaternion=idleq['toe'+side];update()
 return (head(ft)-target).length
for f in frames:
 scene.frame_set(int(f),subframe=f%1);phase=(f-start)/(end-start)
 root=arm.pose.bones['root'];root.location=idleRoot+Vector((0,-.28+.015*(math.cos(phase*math.tau*2)-1),0))
 for n in names:arm.pose.bones[n].rotation_quaternion=idleq[n]
 update()
 for side,off in [('L',0),('R',.5)]:
  u=(phase+off)%1
  if u<.5:z=stroke*(.5-u*2);lift=0
  else:t=(u-.5)*2;z=stroke*(-.5+.5-.5*math.cos(t*math.pi));lift=.19*math.sin(t*math.pi)**1.2
  target=base[side]['ankle']+Vector((0,-z,lift));errors.append(solve(side,target))
 samples.append((f,root.location.copy(),{n:arm.pose.bones[n].rotation_quaternion.copy() for n in names}))
for layer in action.layers:
 for strip in layer.strips:
  for bag in strip.channelbags:
   for fc in bag.fcurves:
    if fc.data_path=='pose.bones["root"].location' or any(fc.data_path=='pose.bones["'+n+'"].rotation_quaternion' for n in names):fc.keyframe_points.clear()
previous={}
for f,loc,qs in samples:
 arm.pose.bones['root'].location=loc;arm.pose.bones['root'].keyframe_insert(data_path='location',frame=f,group='root')
 for n,q in qs.items():
  if n in previous and q.dot(previous[n])<0:q.negate()
  previous[n]=q.copy();arm.pose.bones[n].rotation_quaternion=q;arm.pose.bones[n].keyframe_insert(data_path='rotation_quaternion',frame=f,group=n)
for layer in action.layers:
 for strip in layer.strips:
  for bag in strip.channelbags:
   for fc in bag.fcurves:
    if fc.data_path=='pose.bones["root"].location' or any(fc.data_path=='pose.bones["'+n+'"].rotation_quaternion' for n in names):
     for key in fc.keyframe_points:key.interpolation='LINEAR'
from heavyweight_motion_clearance import correct_tail_clearance
tail_clearance=correct_tail_clearance(arm,body,scene,('heavyWalk',))
arm.animation_data.action=None
for pb in arm.pose.bones:pb.matrix_basis=Matrix.Identity(4)
scene.frame_set(0)
bpy.ops.wm.save_as_mainfile(filepath=str(p/'source/heavyweight-runtime-candidate.blend'))
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);arm.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(p/'export/heavyweight-candidate.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_influence_nb=4,export_all_influences=False)
report={'clip':'heavyWalk','original_duration':1.5,'nominal_game_cycle_seconds':.9,'nominal_game_speed':1.65,'stance_stroke_model_units':stroke,'root_drop_model_units':.28,'samples':len(samples),'maximum_ankle_target_error':max(errors),'scope':'Existing action only; 33 bones and 13 actions retained'}
report['tail_clearance']=tail_clearance
(p/'review/gait-authoring-08.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
