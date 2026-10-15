"""Bake a single UV atlas and preserve animation timing in an isolated runtime copy."""
import bpy,os,json,math,tempfile,sys
import numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from uv_raster_safety import raster_safe_islands
from mathutils import Vector,Matrix
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=os.path.join(root,'chomprex');tex=os.path.join(out,'textures');os.makedirs(tex,exist_ok=True)
tempfile.tempdir=os.path.join(out,'temporary');os.makedirs(tempfile.tempdir,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'source/chomprex-overhaul-work.blend'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');arm.data.pose_position='REST'
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.bake.margin=8;scene.render.bake.margin_type='EXTEND'
skin=bpy.data.materials['Rex Plum Skin'];nodes=skin.node_tree.nodes;links=skin.node_tree.links;bs=nodes.get('Principled BSDF');vc=next(n for n in nodes if n.type=='VERTEX_COLOR')
def linear_hex(h):
 values=[int(h[i:i+2],16)/255 for i in (1,3,5)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in values)+(1,)
paintmask=nodes.new('ShaderNodeMapRange');paintmask.clamp=True;paintmask.interpolation_type='SMOOTHSTEP';paintmask.inputs['From Min'].default_value=.46;paintmask.inputs['From Max'].default_value=.54;links.new(vc.outputs['Alpha'],paintmask.inputs['Value'])
cleanpaint=nodes.new('ShaderNodeMixRGB');links.new(paintmask.outputs['Result'],cleanpaint.inputs[0]);cleanpaint.inputs[1].default_value=linear_hex('#603448');cleanpaint.inputs[2].default_value=linear_hex('#c6913b')
geo=nodes.new('ShaderNodeNewGeometry')
vor=nodes.new('ShaderNodeTexVoronoi');vor.inputs['Scale'].default_value=6.8;vor.inputs['Randomness'].default_value=.95;links.new(geo.outputs['Position'],vor.inputs['Vector'])
pattern=nodes.new('ShaderNodeVertexColor');pattern.layer_name='RexPattern';sep=nodes.new('ShaderNodeSeparateColor');links.new(pattern.outputs['Color'],sep.inputs['Color'])
vor.inputs['Scale'].default_value=7.2
large=nodes.new('ShaderNodeTexVoronoi');large.inputs['Scale'].default_value=3.3;large.inputs['Randomness'].default_value=.95;links.new(geo.outputs['Position'],large.inputs['Vector'])
blend=nodes.new('ShaderNodeMapRange');blend.inputs['From Min'].default_value=.72;blend.inputs['From Max'].default_value=.33;links.new(sep.outputs['Green'],blend.inputs['Value'])
distance=nodes.new('ShaderNodeMixRGB');links.new(blend.outputs['Result'],distance.inputs[0]);links.new(vor.outputs['Distance'],distance.inputs[1]);links.new(large.outputs['Distance'],distance.inputs[2])
noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=23;noise.inputs['Detail'].default_value=3;links.new(geo.outputs['Position'],noise.inputs['Vector'])
def mathnode(op,a=None,b=None):
 n=nodes.new('ShaderNodeMath');n.operation=op
 if a is not None:n.inputs[0].default_value=a
 if b is not None:n.inputs[1].default_value=b
 return n
warp=mathnode('MULTIPLY',b=.12);links.new(noise.outputs['Fac'],warp.inputs[0]);add=mathnode('ADD');links.new(distance.outputs[0],add.inputs[0]);links.new(warp.outputs[0],add.inputs[1])
ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.32;ramp.color_ramp.elements[0].color=(1,1,1,1);ramp.color_ramp.elements[1].position=.36;ramp.color_ramp.elements[1].color=(0,0,0,1);links.new(add.outputs[0],ramp.inputs[0])
inv=mathnode('SUBTRACT',a=1);links.new(paintmask.outputs['Result'],inv.inputs[1]);mask=mathnode('MULTIPLY');links.new(inv.outputs[0],mask.inputs[0]);links.new(ramp.outputs[0],mask.inputs[1])
regionmask=mathnode('MULTIPLY');links.new(mask.outputs[0],regionmask.inputs[0]);links.new(sep.outputs['Red'],regionmask.inputs[1])
mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';links.new(regionmask.outputs[0],mix.inputs[0]);links.new(cleanpaint.outputs[0],mix.inputs[1]);mix.inputs[2].default_value=(.050,.021,.040,1);links.new(mix.outputs[0],bs.inputs['Base Color'])
xyz=nodes.new('ShaderNodeSeparateXYZ');links.new(geo.outputs['Position'],xyz.inputs[0]);slant=mathnode('MULTIPLY',b=.15);links.new(xyz.outputs['Y'],slant.inputs[0]);height=mathnode('ADD');links.new(xyz.outputs['Z'],height.inputs[0]);links.new(slant.outputs[0],height.inputs[1]);frequency=mathnode('MULTIPLY',b=math.tau/.32);links.new(height.outputs[0],frequency.inputs[0]);wave=mathnode('COSINE');links.new(frequency.outputs[0],wave.inputs[0]);line=nodes.new('ShaderNodeMapRange');line.clamp=True;line.inputs['From Min'].default_value=.92;line.inputs['From Max'].default_value=1;links.new(wave.outputs[0],line.inputs['Value']);groove=mathnode('MULTIPLY');links.new(line.outputs['Result'],groove.inputs[0]);links.new(paintmask.outputs['Result'],groove.inputs[1]);shade=nodes.new('ShaderNodeMixRGB');shade.blend_type='MULTIPLY';links.new(groove.outputs[0],shade.inputs[0]);links.new(mix.outputs[0],shade.inputs[1]);shade.inputs[2].default_value=(.78,.78,.78,1);links.new(shade.outputs[0],bs.inputs['Base Color'])
fine=nodes.new('ShaderNodeTexVoronoi');fine.feature='DISTANCE_TO_EDGE';fine.inputs['Scale'].default_value=55;links.new(geo.outputs['Position'],fine.inputs['Vector'])
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.20;bump.inputs['Distance'].default_value=.012;links.new(fine.outputs['Distance'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
softgold=mathnode('MULTIPLY',b=.8);links.new(paintmask.outputs['Result'],softgold.inputs[0]);skinrelief=mathnode('SUBTRACT',a=1);links.new(softgold.outputs[0],skinrelief.inputs[1]);reliefstrength=mathnode('MULTIPLY',b=.20);links.new(skinrelief.outputs[0],reliefstrength.inputs[0]);links.new(reliefstrength.outputs[0],bump.inputs['Strength'])
# Consolidate all pieces into one skinned mesh; preserve all vertex groups and source materials for baking.
meshes=[o for o in bpy.data.objects if o.type=='MESH'];bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
body=bpy.data.objects['ChompRex_ContinuousBody'];bpy.context.view_layer.objects.active=body;bpy.ops.object.join();body.name='ChompRex_RuntimeMesh'
for slot in body.material_slots:
 if slot.material is None:slot.material=skin
bpy.ops.object.material_slot_remove_unused()
validation_changed=body.data.validate(verbose=True,clean_customdata=False)
triangulate=body.modifiers.new('Stable bake triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=triangulate.name)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.015,area_weight=.6,correct_aspect=True,scale_to_bounds=True);bpy.ops.uv.pack_islands(rotate=True,margin=.01,margin_method='FRACTION');bpy.ops.object.mode_set(mode='OBJECT')
uv_safety=raster_safe_islands(body.data,2048,8)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.pack_islands(rotate=True,margin=.004,margin_method='FRACTION');bpy.ops.object.mode_set(mode='OBJECT')
images={};padding_report=[];bake_coverage=None
for key,kind in [('basecolor','DIFFUSE'),('normal','NORMAL'),('roughness','ROUGHNESS')]:
 image=bpy.data.images.new('ChompRex_'+key,width=2048,height=2048,alpha=True);image.colorspace_settings.name='sRGB' if key=='basecolor' else 'Non-Color'
 for mat in body.data.materials:
  n=mat.node_tree.nodes.new('ShaderNodeTexImage');n.image=image;mat.node_tree.nodes.active=n
 scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True
 bpy.ops.object.bake(type=kind,use_clear=True)
 # Fill unbaked subpixel chart slivers using neighboring atlas texels. Alpha
 # identifies blank bake pixels, so legitimate dark markings are never replaced.
 pixels=np.empty(2048*2048*4,dtype=np.float32);image.pixels.foreach_get(pixels);pixels=pixels.reshape((2048,2048,4));valid=pixels[:,:,3]>.5
 if key=='basecolor':bake_coverage=valid.copy()
 else:valid=bake_coverage.copy()
 pixels[:,:,3]=valid.astype(np.float32);blank_before=int((~valid).sum())
 for iteration in range(16):
  acc=np.zeros_like(pixels[:,:,:3]);count=np.zeros((2048,2048),dtype=np.float32)
  for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
   mask=np.roll(valid,(dy,dx),(0,1));color=np.roll(pixels[:,:,:3],(dy,dx),(0,1))
   if dy==1:mask[0,:]=False
   if dy==-1:mask[-1,:]=False
   if dx==1:mask[:,0]=False
   if dx==-1:mask[:,-1]=False
   acc+=color*mask[:,:,None];count+=mask
  fill=(~valid)&(count>0)
  if not fill.any():break
  pixels[fill,:3]=acc[fill]/count[fill,None];pixels[fill,3]=1;valid[fill]=True
 image.pixels.foreach_set(pixels.ravel());image.update();padding_report.append({'texture':key,'blank_before':blank_before,'padded_pixels':blank_before-int((~valid).sum()),'iterations':iteration+1})
 image.filepath_raw=os.path.join(tex,'chomprex-'+key+'.png');image.file_format='PNG';image.save();images[key]=image
# Retain the editable multi-material bake source as a separate .blend.
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'source/chomprex-uv-bake-source.blend'))
mat=bpy.data.materials.new('ChompRex_BakedAtlas');mat.use_nodes=True;n=mat.node_tree.nodes;l=mat.node_tree.links;p=n.get('Principled BSDF');p.inputs['Specular IOR Level'].default_value=.25
for key in images:
 t=n.new('ShaderNodeTexImage');t.image=images[key]
 if key=='normal':normal=n.new('ShaderNodeNormalMap');l.new(t.outputs['Color'],normal.inputs['Color']);l.new(normal.outputs['Normal'],p.inputs['Normal'])
 else:l.new(t.outputs['Color'],p.inputs['Base Color' if key=='basecolor' else 'Roughness'])
body.data.materials.clear();body.data.materials.append(mat)
for p in body.data.polygons:p.material_index=0
# Imported fractional 24-fps endpoints become exact integer 120-fps endpoints.
# Scale key time only; values and interpolation remain unchanged.
duration_report=[]
for a in bpy.data.actions:
 before=list(a.frame_range);fcurves=[]
 for layer in a.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:fcurves.extend(bag.fcurves)
 for fc in fcurves:
  for key in fc.keyframe_points:
   key.co.x=round(key.co.x*5,5);key.handle_left.x=round(key.handle_left.x*5,5);key.handle_right.x=round(key.handle_right.x*5,5)
  fc.update()
 duration_report.append({'name':a.name,'source_seconds':(before[1]-before[0])/24,'export_seconds':(a.frame_range[1]-a.frame_range[0])/120,'curves':len(fcurves)})
scene.render.fps=120;scene.render.fps_base=1;arm.animation_data.action=None;arm.data.pose_position='POSE';scene.frame_set(0)
# Preserve authored limb rotations while correcting measured ground penetration
# and whole-character floating introduced by the changed limb proportions.
feet=[v.index for v in body.data.vertices if any(g.weight>.5 and body.vertex_groups[g.group].name in ['toeL','toeR','ankleL','ankleR'] for g in v.groups)]
grounding=[];rootbone=arm.pose.bones['root'];world_to_root=(arm.matrix_world.to_3x3()@rootbone.bone.matrix_local.to_3x3()).inverted()
for action in bpy.data.actions:
 if action.name not in ['walk','turn','charge','chargeWindup','stagger']:continue
 arm.animation_data.action=action;arm.animation_data.action_slot=action.slots[0]
 start,end=action.frame_range;frames=sorted(set([float(i) for i in range(int(start),int(end)+1,5)]+[float(end)]));corrections=[]
 for frame in frames:
  scene.frame_set(int(frame),subframe=frame%1);ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh()
  low=min((ev.matrix_world@me.vertices[i].co).z for i in feet);ev.to_mesh_clear()
  delta=.02718355-low;corrections.append((frame,rootbone.location.copy()+world_to_root@Vector((0,0,delta)),delta))
 for frame,location,delta in corrections:
  rootbone.location=location;rootbone.keyframe_insert(data_path='location',frame=frame,group='root')
 grounding.append({'clip':action.name,'samples':len(corrections),'minimum_vertical_correction':min(c[2] for c in corrections),'maximum_vertical_correction':max(c[2] for c in corrections)})
arm.animation_data.action=None
for posebone in arm.pose.bones:posebone.matrix_basis=Matrix.Identity(4)
scene.frame_set(0)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'source/chomprex-runtime-candidate.blend'))
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);arm.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'export/chomprex-candidate.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_influence_nb=4,export_all_influences=False)
json.dump({'status':'candidate; see explicit visual gates and runtime reports','mesh_validation_changed':validation_changed,'uv_raster_safety':uv_safety,'atlas_padding':padding_report,'uv_pack_margin_fraction':.004,'bake_margin_pixels':8,'uv_layers':len(body.data.uv_layers),'runtime_meshes':1,'runtime_materials':1,'texture_size':2048,'durations':duration_report,'grounding':grounding},open(os.path.join(out,'review/bake-audit.json'),'w'),indent=2)
print('BAKE_CANDIDATE_COMPLETE')
