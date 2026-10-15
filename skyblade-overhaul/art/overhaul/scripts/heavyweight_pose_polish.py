"""Retarget the existing relaxed arm posture to the turnaround's hanging arms."""
from mathutils import Vector,Quaternion
def relax_idle_arms(arm):
 report=[]
 for action in __import__('bpy').data.actions:
  if action.name not in ['idle','walk','heavyWalk','turn']:continue
  for side,sign in [('L',1),('R',-1)]:
   name='arm'+side;path='pose.bones["'+name+'"].rotation_quaternion';curves=[]
   for layer in action.layers:
    for strip in layer.strips:
     for bag in strip.channelbags:curves.extend(fc for fc in bag.fcurves if fc.data_path==path)
   if len(curves)!=4:raise RuntimeError('Expected quaternion curves for '+name)
   curves.sort(key=lambda fc:fc.array_index);times=sorted(set(float(k.co.x) for fc in curves for k in fc.keyframe_points))
   axis=(arm.data.bones[name].matrix_local.to_3x3().inverted()@Vector((0,sign,0))).normalized();delta=Quaternion(axis,.31)
   keys=[(t,(delta@Quaternion(tuple(fc.evaluate(t) for fc in curves))).normalized()) for t in times]
   for fc in curves:fc.keyframe_points.clear()
   for t,q in keys:
    for i,fc in enumerate(curves):fc.keyframe_points.insert(t,q[i],options={'FAST'}).interpolation='LINEAR'
   for fc in curves:fc.update()
  report.append({'clip':action.name,'shoulder_inward_offset_radians':.31,'original_key_times_preserved':True})
 return report

def refine_existing_actions(arm):
 """Edit only existing action channels: weight transfer, collapse and settling."""
 import bpy,math
 def smooth(x):
  x=max(0,min(1,x));return x*x*(3-2*x)
 def curves(action,name):
  path='pose.bones["'+name+'"].rotation_quaternion'
  return sorted([fc for layer in action.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves if fc.data_path==path],key=lambda f:f.array_index)
 report=[]
 for action in bpy.data.actions:
  if action.name not in ['death','stompRecovery','heavyWalk']:continue
  start,end=map(float,action.frame_range);duration=end-start
  names=['root','spine','neck','head','armL','armR','forearmL','forearmR','thighL','thighR','shinL','shinR','footL','footR','wing1L','wing1R','tail1','tail2','tail3','tail4','tail5','belly'] if action.name=='death' else ['spine','neck','head','belly','wing1L','wing1R','tail2']
  for name in names:
   fc=curves(action,name)
   if len(fc)!=4:continue
   ts=sorted(set([float(k.co.x) for f in fc for k in f.keyframe_points]+[start+i*4 for i in range(int(duration/4)+1)]+[end]));keys=[]
   axis=(arm.data.bones[name].matrix_local.to_3x3().inverted()@Vector((1,0,0))).normalized()
   for t in ts:
    u=(t-start)/duration;q=Quaternion(tuple(f.evaluate(t) for f in fc));angle=0
    if action.name=='death':
     lag=.018*int(name[-1]) if name.startswith('tail') else .025 if name.startswith('wing') else 0
     fall=smooth((u-.13-lag)/.47);settle=math.sin(max(0,u-.60)*math.pi*7)*math.exp(-max(0,u-.60)*13)*.06 if u>.60 else 0
     angle={'root':1.40,'spine':.12,'neck':-.18,'head':-.40,'armL':-.36,'armR':-.36,'forearmL':.42,'forearmR':.42,'thighL':.90,'thighR':.90,'shinL':-.80,'shinR':-.80,'footL':.20,'footR':.20,'wing1L':-.15,'wing1R':-.15,'tail1':-1.45,'tail2':-.20,'tail3':-.10,'tail4':-.05,'tail5':-.025,'belly':.06}.get(name,0)*fall
     if name in ['root','head','belly']:angle+=settle*(1 if name=='root' else -1)
    elif action.name=='stompRecovery':
     # Recover the folded torso by the end, with a damped breath after impact.
     target={'spine':-.15,'neck':-.07,'head':-.04,'belly':-.025,'wing1L':.025,'wing1R':.025,'tail2':-.04}[name]
     angle=target*smooth((u-.18)/.72)+math.sin(u*math.pi*4)*math.exp(-u*4)*.025
    else:
     lag={'spine':0,'neck':.35,'head':.55,'belly':.6,'wing1L':.8,'wing1R':.8,'tail2':1.0}[name]
     amp={'spine':.018,'neck':.018,'head':.012,'belly':.025,'wing1L':.018,'wing1R':.018,'tail2':.025}[name]
     angle=amp*(math.sin(u*math.tau*2-lag)-math.sin(-lag))
    keys.append((t,(Quaternion(axis,angle)@q).normalized()))
   for f in fc:f.keyframe_points.clear()
   for t,q in keys:
    for i,f in enumerate(fc):f.keyframe_points.insert(t,q[i],options={'FAST'}).interpolation='LINEAR'
   for f in fc:f.update()
  report.append({'clip':action.name,'original_duration_preserved':True,'changed_existing_bones':names,'root_death_forward_radians':1.40 if action.name=='death' else 0})
 return report
