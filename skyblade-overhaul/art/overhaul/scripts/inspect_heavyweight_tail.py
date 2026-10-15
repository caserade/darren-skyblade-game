import bpy,os,json
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=os.path.join(root,'heavyweight');bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'source/heavyweight-runtime-candidate.blend'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');pb=arm.pose.bones['tail1'];result=[]
for action in bpy.data.actions:
 if action.name not in ['idle','stagger','stompRecovery']:continue
 arm.animation_data.action=action;arm.animation_data.action_slot=action.slots[0];bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
 curves=[]
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     if 'tail1' in fc.data_path:curves.append({'path':fc.data_path,'index':fc.array_index,'keys':len(fc.keyframe_points),'first':list(fc.keyframe_points[0].co)})
 result.append({'action':action.name,'mode':pb.rotation_mode,'quat':list(pb.rotation_quaternion),'euler':list(pb.rotation_euler),'location':list(pb.location),'scale':list(pb.scale),'curves':curves})
print(json.dumps(result));json.dump(result,open(os.path.join(out,'review/tail-animation-diagnostic.json'),'w'),indent=2)
