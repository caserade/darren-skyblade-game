"""Reference-led edit of the supplied SkyDrake mesh/rig. Local export only."""
import bpy,bmesh,math,json,tempfile,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
p=Path(__file__).resolve().parents[1]/'skydrake12';tempfile.tempdir='C:/Users/caser/AppData/Local/Temp'
bpy.ops.wm.open_mainfile(filepath=str(p/'source/supplied-skydrake-import.blend'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');arm.data.pose_position='REST';arm.animation_data.action=None
for action in bpy.data.actions:
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     for key in fc.keyframe_points:
      key.co.x=round(key.co.x*5);key.handle_left.x*=5;key.handle_right.x*=5
bpy.context.scene.render.fps=120
for tr in arm.animation_data.nla_tracks:tr.mute=True
bpy.context.view_layer.update();aw=arm.matrix_world.copy();arm.parent=None;arm.matrix_world=aw
def V(q):return Vector((q[0],-q[2],q[1]))
def game(v):return Vector((v.x,v.z,-v.y))
def smooth(x):x=max(0,min(1,x));return x*x*(3-2*x)
def warp(v):
 x,y,z=game(v);h=smooth((y-3.92)/.45);x*=1+.43*h
 # A fuller nose and cheek plane, with a continuous transition into the neck.
 x*=1+.10*h*smooth((z-.8)/.4)
 # Reference-led fuller rear haunches, narrower forward belly and broader feet.
 thigh=smooth((y-.45)/.3)*(1-smooth((y-1.65)/.35))*(1-smooth((z-.25)/.4))*smooth((abs(x)-.65)/.25)
 x*=1+.10*thigh
 belly=smooth((y-.65)/.3)*(1-smooth((y-2.25)/.4))*smooth((z-.4)/.4)
 x*=1-.07*belly
 foot=1-smooth((y-.30)/.26)
 if abs(x)>.3:
  center=.72*(1 if x>0 else -1);x=center+(x-center)*(1+.16*foot);z=-.3+(z+.3)*(1+.12*foot)
 if z<-1.5:z=-1.5+(z+1.5)*.78
 return V((x,y,z))
def rgb(h):
 vals=[int(h[i:i+2],16)/255 for i in (1,3,5)];return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)
def mat(name,h,rough=.8):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*rgb(h),1);bs.inputs['Roughness'].default_value=rough;return m
blue=mat('SkyDrake blue planes','#29499a');dark=mat('SkyDrake navy ribs','#182d65');gold=mat('SkyDrake gold horn','#d3a12f',.58);band=mat('SkyDrake horn bands','#ab7923',.68);wing=mat('SkyDrake cyan membrane','#55b9df',.88);pale=mat('SkyDrake jaw','#a2bad5');ivory=mat('SkyDrake ivory','#efe5d2',.52);white=mat('SkyDrake eyes','#f3eddc',.32);pupil=mat('SkyDrake pupils','#102038',.3)
kept=[]
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 if not o.data.materials:bpy.data.objects.remove(o,do_unlink=True);continue
 material=o.data.materials[0].name
 if material in ['Material_1','Material_2','Material_3','Material_4','Material_7','Material_8']:
  bpy.data.objects.remove(o,do_unlink=True);continue
 o.data=o.data.copy()
 parent=o;bone=None
 while parent:
  if parent.parent_type=='BONE':bone=parent.parent_bone;break
  parent=parent.parent
 world=o.matrix_world.copy()
 for v in o.data.vertices:v.co=warp(world@v.co)
 o.parent=None;o.matrix_world=Matrix.Identity(4)
 if bone:
  o.vertex_groups.clear();vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
 o.modifiers.clear();mod=o.modifiers.new('Original 39-bone rig','ARMATURE');mod.object=arm
 if material=='Material_5':
  o.data.materials[0]=dark
  # Restore a visible dorsal-spine cross-section without changing its side silhouette.
  if bone and bone in ['hips','spine','chest','neck1','neck2','neck3','neck4']:
   center=sum(v.co.x for v in o.data.vertices)/len(o.data.vertices)
   low=min(game(v.co).y for v in o.data.vertices);high=max(game(v.co).y for v in o.data.vertices)
   for v in o.data.vertices:
    t=max(0,min(1,(game(v.co).y-low)/(high-low)));v.co.x=center+(v.co.x-center)*(1+4*math.sin(math.pi*t)**.7)
 if material=='skydrake_skin':
  o.name='SkyDrake_SourceBody';bs=o.data.materials[0].node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.84
  for n in o.data.materials[0].node_tree.nodes:
   if n.type=='NORMAL_MAP':n.inputs['Strength'].default_value=.28
  # Smooth abrupt neighboring skin weights in the supplied fused body mesh.
  # This only blends existing weights along mesh edges, never across nearby disconnected surfaces.
  weights=np.zeros((len(o.data.vertices),len(o.vertex_groups)),dtype=np.float64)
  for v in o.data.vertices:
   for group in v.groups:weights[v.index,group.group]=group.weight
  edges=np.array([tuple(e.vertices) for e in o.data.edges]);a,b=edges[:,0],edges[:,1];counts=np.bincount(np.r_[a,b],minlength=len(weights));counts=np.maximum(counts,1)[:,None]
  # Treat coincident UV seam vertices as one neighborhood throughout smoothing.
  _,inverse=np.unique(np.round(np.array([tuple(v.co) for v in o.data.vertices]),5),axis=0,return_inverse=True)
  seam_counts=np.bincount(inverse)[:,None]
  def weld_weights(values):
   totals=np.zeros((int(inverse.max())+1,values.shape[1]));np.add.at(totals,inverse,values);return (totals/seam_counts)[inverse]
  weights=weld_weights(weights)
  for iteration in range(32):
   neighbor=np.zeros_like(weights);np.add.at(neighbor,a,weights[b]);np.add.at(neighbor,b,weights[a]);weights=weld_weights(.35*weights+.65*neighbor/counts)
  # Prevent close forearm/haunch surfaces from sharing distant leg influences.
  group_names=[g.name for g in o.vertex_groups]
  for i,v in enumerate(o.data.vertices):
   x,y,z=game(v.co);side='L' if x>0 else 'R';arm_ids=[group_names.index(n+side) for n in ['arm','forearm','hand']];strength=smooth((abs(x)-.65)/.28)*smooth((y-1.62)/.32)*(1-smooth((y-2.65)/.3))
   strength*=smooth((weights[i,arm_ids].sum()-.12)/.5)
   if strength>0:
    for k,n in enumerate(group_names):
     if n.startswith(('thigh','shin','ankle','toe')) or n in ['hips','belly']:weights[i,k]*=1-strength
    weights[i]/=max(weights[i].sum(),1e-8)
  weights=weld_weights(weights)
  # Anatomical redistribution: upper torso and arms must not inherit thigh lift.
  # Transfer removed influence to the central chain, preserving a smooth boundary.
  leg_ids=[i for i,n in enumerate(group_names) if n.startswith(('thigh','shin','ankle','toe'))]
  arm_ids=[i for i,n in enumerate(group_names) if n.startswith(('arm','forearm','hand'))]
  spine_id=group_names.index('spine');hips_id=group_names.index('hips')
  preserved_weights=weights.copy()
  for i,v in enumerate(o.data.vertices):
   x,y,z=game(v.co);upper=smooth((y-1.48)/.50);lower=(1-smooth((y-1.45)/.45))*(1-smooth((z-.25)/.3))
   removed=weights[i,leg_ids].sum()*upper;weights[i,leg_ids]*=1-upper;weights[i,spine_id]+=removed
   removed=weights[i,arm_ids].sum()*lower;weights[i,arm_ids]*=1-lower;weights[i,hips_id]+=removed
   # Keep the shoulder's central support in one bone so four-weight export does
   # not abruptly drop an arm influence when hips/belly/spine compete for slots.
   shoulder=smooth((y-1.6)/.45)*smooth((abs(x)-.55)/.3)*(1-smooth((z-.6)/.25))
   for central in ['hips','belly']:
    k=group_names.index(central);amount=weights[i,k]*shoulder;weights[i,k]-=amount;weights[i,spine_id]+=amount
  for iteration in range(12):
   neighbor=np.zeros_like(weights);np.add.at(neighbor,a,weights[b]);np.add.at(neighbor,b,weights[a]);weights=weld_weights(.5*weights+.5*neighbor/counts)
  for i,v in enumerate(o.data.vertices):
   blend=smooth((game(v.co).y-1.15)/.55);weights[i]=weights[i]*blend+preserved_weights[i]*(1-blend)
  weights=weld_weights(weights)
  for vg in o.vertex_groups:vg.remove(list(range(len(o.data.vertices))))
  for i,row in enumerate(weights):
   ids=np.argsort(row)[-4:];total=row[ids].sum()
   for k in ids:
    if row[k]>1e-6:o.vertex_groups[int(k)].add([i],float(row[k]/total),'REPLACE')
  # Remove the old high-frequency belly grooves in welded position space.
  # No displacement is sampled from per-chart UVs. Rebuild welded normals too:
  # imported split normals otherwise retain the old grooves after position edits.
  coords=np.array([tuple(v.co) for v in o.data.vertices]);original=coords.copy()
  xx=coords[:,0];yy=coords[:,2];zz=-coords[:,1]
  def ns(a,b,q):
   t=np.clip((q-a)/(b-a),0,1);return t*t*(3-2*t)
  neck=ns(2.8,3.05,yy)
  mask=ns(.4-.25*neck,.65-.25*neck,zz)*ns(.65,.9,yy)*(1-ns(4.05,4.25,yy))*(1-ns(.68,.95,abs(xx)))
  for iteration in range(16):
   neighbor=np.zeros_like(coords);np.add.at(neighbor,a,coords[b]);np.add.at(neighbor,b,coords[a]);candidate=coords+.4*(neighbor/counts-coords)*mask[:,None]
   coords=weld_weights(candidate)
  for v,q in zip(o.data.vertices,coords):v.co=q
  o.data.update();o.data.calc_loop_triangles();normals=np.zeros_like(coords)
  for tri in o.data.loop_triangles:
   ids=list(tri.vertices);cross=np.cross(coords[ids[1]]-coords[ids[0]],coords[ids[2]]-coords[ids[0]])
   for index in ids:normals[index]+=cross
  normals=weld_weights(normals);normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-12)
  o.data.normals_split_custom_set_from_vertices(normals.tolist())
  (p/'review/surface-geometry-12.json').write_text(json.dumps({'weldedSmoothingIterations':16,'maximumDisplacement':float(np.linalg.norm(coords-original,axis=1).max()),'changedVertices':int((np.linalg.norm(coords-original,axis=1)>1e-7).sum()),'method':'Welded vertex smoothing in continuous object space; welded area-weighted normals; no UV displacement.'},indent=2))
  # Repainted maps are produced by bake_skydrake_surface12.py from this exact
  # surface and original UV charts. The first build supplies the bake input.
  for node in o.data.materials[0].node_tree.nodes:
   if node.type!='TEX_IMAGE' or not node.image:continue
   name='skydrake-surface-normal.jpg' if node.image.colorspace_settings.name=='Non-Color' else 'skydrake-surface-color.jpg'
   target=p/'source'/name
   if target.exists():
    node.image=bpy.data.images.load(str(target),check_existing=False)
    node.image.colorspace_settings.name='Non-Color' if 'normal' in name else 'sRGB'
    node.image.pack()
  # The supplied atlas already carries color. Imported vertex colors multiplied it a second time.
  for attr in list(o.data.color_attributes):o.data.color_attributes.remove(attr)
  # Remove only the old flat diamond tip; a curved arrow replaces it below.
  bm=bmesh.new();bm.from_mesh(o.data);bad=[f for f in bm.faces if sum(game(v.co).z for v in f.verts)/len(f.verts)<-3.42];bmesh.ops.delete(bm,geom=bad,context='FACES');bm.to_mesh(o.data);bm.free()
 kept.append(o)
bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for b in arm.data.edit_bones:
 b.head=aw.inverted()@warp(aw@b.head);b.tail=aw.inverted()@warp(aw@b.tail)
for side,s in [('L',1),('R',-1)]:
 for name,pos in [('wing2',(s*.99,3.45,-.72)),('wing3',(s*1.48,4.02,-.87))]:
  b=arm.data.edit_bones[name+side];delta=b.tail-b.head;b.head=aw.inverted()@V(pos);b.tail=b.head+delta
bpy.ops.object.mode_set(mode='OBJECT');arm.select_set(False)
def mesh(name,verts,faces,material,weights):
 me=bpy.data.meshes.new(name);me.from_pydata([V(v) for v in verts],[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(material)
 for i,w in enumerate(weights):
  for bone,value in w.items():vg=o.vertex_groups.get(bone) or o.vertex_groups.new(name=bone);vg.add([i],value,'REPLACE')
 for f in me.polygons:f.use_smooth=True
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
 mod=o.modifiers.new('Original 39-bone rig','ARMATURE');mod.object=arm;kept.append(o);return o
def tube(name,pts,radii,material,bone,sides=12):
 vs=[];fs=[]
 for i,pt in enumerate(pts):
  p0=Vector(pt);axis=(Vector(pts[min(i+1,len(pts)-1)])-Vector(pts[max(0,i-1)])).normalized();ref=Vector((1,0,0)) if abs(axis.x)<.8 else Vector((0,0,1));u=(ref-axis*ref.dot(axis)).normalized();v=axis.cross(u)
  for j in range(sides):vs.append(tuple(p0+radii[i]*(u*math.cos(j*math.tau/sides)+v*math.sin(j*math.tau/sides))))
 for i in range(len(pts)-1):
  for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;fs.append((a,b,b+sides,a+sides))
 fs.extend([tuple(reversed(range(sides))),tuple((len(pts)-1)*sides+j for j in range(sides))]);return mesh(name,vs,fs,material,[{bone:1}]*len(vs))
def ellipsoid(name,center,radii,material,bone):
 vs=[];fs=[]
 for i in range(13):
  phi=math.pi*(i+.001)/12.002
  for j in range(24):t=j*math.tau/24;vs.append((center[0]+radii[0]*math.sin(phi)*math.cos(t),center[1]+radii[1]*math.cos(phi),center[2]+radii[2]*math.sin(phi)*math.sin(t)))
 for i in range(12):
  for j in range(24):a=i*24+j;b=i*24+(j+1)%24;fs.append((a,b,b+24,a+24))
 fs.extend([tuple(reversed(range(24))),tuple(12*24+j for j in range(24))]);return mesh(name,vs,fs,material,[{bone:1}]*len(vs))
for s,side in [(1,'L'),(-1,'R')]:
 horn=[(s*.23,4.72,.27),(s*.32,4.98,.15),(s*.40,5.12,.02),(s*.34,5.31,-.10),(s*.47,5.63,-.25)]
 horn=[(x,4.72+(y-4.72)*.85,z) for x,y,z in horn]
 tube('Segmented horn '+side,horn,[.135,.12,.11,.085,.002],gold,'head',16)
 for k in [1,2,3]:
  a=Vector(horn[k]);axis=(Vector(horn[k+1])-Vector(horn[k-1])).normalized();r=[.123,.113,.088][k-1];tube('Horn seam '+side+str(k),[a-axis*.012,a+axis*.012],[r,r],band,'head',16)
 ellipsoid('Eye white '+side,(s*.235,4.57,.775),(.095,.088,.055),white,'head')
 ellipsoid('Focused pupil '+side,(s*.22,4.555,.825),(.038,.05,.025),pupil,'head')
 ellipsoid('Eye glint '+side,(s*.208,4.579,.85),(.010,.014,.008),white,'head')
 tube('Angled brow '+side,[(s*.07,4.62,.77),(s*.19,4.69,.8),(s*.34,4.77,.70)],[.075,.082,.048],dark,'brow'+side,16)
 ellipsoid('Nostril opening '+side,(s*.13,4.447,1.402),(.027,.036,.009),dark,'head')
 tube('Main fang '+side,[(s*.22,4.335,1.04),(s*.24,4.23,1.10),(s*.23,4.09,1.16)],[.064,.048,.002],ivory,'head',14)
 for j in range(3):
  z=.55+j*.15;tube('Small tooth '+side+str(j),[(s*(.28-.025*j),4.31,z),(s*(.28-.025*j),4.245,z+.035)],[.026,.001],ivory,'head',10)
 # Three scalloped panels; membranes and ribs share the same skin weights.
 apex=(s*1.48,4.02,-.87);tips=[(s*2.62,2.47,-1.0),(s*2.08,2.35,-.91),(s*1.47,2.34,-.82),(s*.59,2.38,-.65)]
 def leading(t):
  a,b,c,d=map(Vector,[apex,(s*1.95,3.62,-.92),(s*2.38,2.85,-.97),tips[0]])
  return a*(1-t)**3+b*(3*(1-t)**2*t)+c*(3*(1-t)*t*t)+d*t**3
 def weights(q):
  blend=smooth((abs(q[0])-.5)/.9);return {'chest':1-blend,'wing3'+side:blend}
 for j in range(3):
  a,b=Vector(tips[j]),Vector(tips[j+1]);edge=[]
  for k in range(13):
   t=k/12;q=a.lerp(b,t);q.y+=.33*math.sin(t*math.pi);edge.append(tuple(q))
  vs=[apex]
  for radial in [k/6 for k in range(1,7)]:
   for k,end in enumerate(edge):
    q=Vector(apex).lerp(Vector(end),radial)
    if j==0:q+=(leading(radial)-Vector(apex).lerp(Vector(tips[0]),radial))*(1-k/12)
    q.z+=.08*math.sin(radial*math.pi)*math.sin(k/12*math.pi);vs.append(tuple(q))
  faces=[(0,k+1,k+2) for k in range(12)]
  for row in range(5):
   for k in range(12):a0=1+row*13+k;faces.append((a0,a0+1,a0+14,a0+13))
  mesh('Scalloped membrane '+side+str(j),vs,faces,wing,[weights(v) for v in vs])
  if j>0:
   rib=tube('Wing rib '+side+str(j),[apex,tuple(Vector(apex).lerp(a,.5)),tuple(a)],[.048,.033,.003],dark,'wing3'+side)
   rib.vertex_groups.clear()
   for v in rib.data.vertices:
    for bone,w in weights(game(v.co)).items():vg=rib.vertex_groups.get(bone) or rib.vertex_groups.new(name=bone);vg.add([v.index],w,'REPLACE')
 edge=tube('Wing leading edge '+side,[(s*.36,2.89,-.4),(s*.99,3.45,-.72)]+[tuple(leading(k/6)) for k in range(7)],[.08,.07]+[.06*(1-k/6)+.003*(k/6) for k in range(7)],dark,'wing3'+side)
 edge.vertex_groups.clear()
 for v in edge.data.vertices:
  for bone,w in weights(game(v.co)).items():vg=edge.vertex_groups.get(bone) or edge.vertex_groups.new(name=bone);vg.add([v.index],w,'REPLACE')
ellipsoid('Pale lower jaw',(0,4.245,.86),(.31,.095,.43),pale,'jaw')
tube('Hooked tail',[(1.2,.47,-3.35),(1.27,.51,-3.52),(1.32,.70,-3.67),(1.28,.96,-3.70)],[.07,.06,.045,.028],blue,'tail6')
# Volumetric arrowhead remains recognizable in profile as well as front/back.
arrow=mesh('Arrow tail tip',[(1.28,1.29,-3.70),(1.05,.92,-3.70),(1.28,.92,-3.86),(1.51,.92,-3.70),(1.28,.92,-3.54),(1.21,.98,-3.70),(1.28,.98,-3.74),(1.35,.98,-3.70),(1.28,.98,-3.66)],[(0,1,2),(0,2,3),(0,3,4),(0,4,1),(1,5,6,2),(2,6,7,3),(3,7,8,4),(4,8,5,1),(5,8,7,6)],dark,[{'tail6':1}]*9)
# One editable skinned object, retaining the source texture atlas and small-part materials.
bpy.ops.object.select_all(action='DESELECT')
for o in kept:o.select_set(True)
bpy.context.view_layer.objects.active=kept[0];bpy.ops.object.join();body=bpy.context.object;body.name='skydrake_body_mesh'
body.modifiers.clear();mod=body.modifiers.new('Original 39-bone rig','ARMATURE');mod.object=arm
world=body.matrix_world.copy();body.parent=arm;body.matrix_world=world
for o in list(bpy.data.objects):
 if o not in [arm,body]:bpy.data.objects.remove(o,do_unlink=True)
arm.name='SkyDrake_Rig';arm.data.pose_position='POSE';arm.animation_data.action=None
for b in arm.pose.bones:b.matrix_basis=Matrix.Identity(4)
bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
def clean_triangles():
 bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.triangulate(bm,faces=list(bm.faces));bad=[f for f in bm.faces if f.calc_area()<1e-10];bmesh.ops.delete(bm,geom=bad,context='FACES');bm.to_mesh(body.data);bm.free();body.data.update()
clean_triangles()
bpy.ops.wm.save_as_mainfile(filepath=str(p/'source/skydrake-candidate.blend'))
def export(name):
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);arm.select_set(True);bpy.context.view_layer.objects.active=arm
 bpy.ops.export_scene.gltf(filepath=str(p/'export'/name),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_influence_nb=4,export_all_influences=False,export_materials='EXPORT')
export('skydrake-candidate.glb')
bpy.context.view_layer.objects.active=body;dec=body.modifiers.new('Reduced mesh','DECIMATE');dec.ratio=.57;bpy.ops.object.modifier_apply(modifier=dec.name)
clean_triangles()
# Decimation changes the UV-to-surface correspondence. Use a bake evaluated on
# this reduced mesh, not the full mesh's plate lines.
for material in body.data.materials:
 if material.name!='skydrake_skin':continue
 for node in material.node_tree.nodes:
  if node.type!='TEX_IMAGE' or not node.image:continue
  normal=node.image.colorspace_settings.name=='Non-Color';name='skydrake-lod-surface-'+('normal' if normal else 'color')+'.jpg';target=p/'source'/name
  if target.exists():
   node.image=bpy.data.images.load(str(target),check_existing=False);node.image.colorspace_settings.name='Non-Color' if normal else 'sRGB';node.image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(p/'source/skydrake-lod.blend'));export('skydrake-lod.glb')
print(json.dumps({'bones':len(arm.data.bones),'actions':len(bpy.data.actions),'materials':len(body.data.materials)}))
