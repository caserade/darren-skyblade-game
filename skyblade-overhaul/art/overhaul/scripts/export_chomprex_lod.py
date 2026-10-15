import bpy,os,json,tempfile
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=os.path.join(root,'chomprex');tempfile.tempdir=os.path.join(out,'temporary')
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'source/chomprex-runtime-candidate.blend'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');body=next(o for o in bpy.data.objects if o.type=='MESH');arm.data.pose_position='REST';bpy.context.view_layer.objects.active=body
before=sum(len(p.vertices)-2 for p in body.data.polygons);dec=body.modifiers.new('LOD geometry reduction','DECIMATE');dec.ratio=.55;dec.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=dec.name)
# Collapse interpolation can overshoot packed-atlas borders by a few millionths.
# Keep the intended border texel rather than allowing wraparound seams.
uv_clamped=0
for uv in body.data.uv_layers.active.data:
 for axis in range(2):
  value=uv.uv[axis]
  if value<0 or value>1:uv.uv[axis]=max(0,min(1,value));uv_clamped+=1
for v in body.data.vertices:
 groups=sorted([(g.group,g.weight) for g in v.groups],key=lambda q:-q[1])[:4];total=sum(q[1] for q in groups)
 for g in list(v.groups):body.vertex_groups[g.group].remove([v.index])
 for i,w in groups:body.vertex_groups[i].add([v.index],w/total,'REPLACE')
arm.data.pose_position='POSE';bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'source/chomprex-lod.blend'))
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'export/chomprex-lod.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_influence_nb=4,export_all_influences=False)
json.dump({'source_triangles':before,'lod_triangles':sum(len(p.vertices)-2 for p in body.data.polygons),'uv_border_coordinates_clamped':uv_clamped,'max_influences':max(len(v.groups) for v in body.data.vertices),'max_weight_error':max(abs(sum(g.weight for g in v.groups)-1) for v in body.data.vertices),'status':'Optional authoring LOD; not wired to a new runtime LOD system'},open(os.path.join(out,'review/lod-audit.json'),'w'),indent=2)
