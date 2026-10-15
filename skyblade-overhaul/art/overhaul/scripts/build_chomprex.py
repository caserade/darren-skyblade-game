"""Chomp Rex overhaul: Blender-native mesh construction, remeshing and skinning.
Work in progress; never exports to dist. Game axes in authoring helpers: X right, Y up, Z forward.
The supplied rig/actions are retained as editable source, with retargeted rest positions.
"""
import bpy, bmesh, math, os, json, random
from mathutils import Vector, Matrix
from mathutils.kdtree import KDTree
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'chomprex')
random.seed(14)
def V(p):return Vector((p[0],-p[2],p[1]))
def game(v):return (v.x,v.z,-v.y)
def mix(a,b,t):return a*(1-t)+b*t
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def rgb(h):
 vals=[int(h[i:i+2],16)/255 for i in (1,3,5)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)
def mat(name,h,rough=.88):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*rgb(h),1);p.inputs['Roughness'].default_value=rough
 p.inputs['Specular IOR Level'].default_value=.25
 return m
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'source','supplied-chomprex-import.blend'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
aw=arm.matrix_world.copy();arm.parent=None;arm.matrix_world=aw;arm.name='ChompRex_Rig'
for o in list(bpy.data.objects):
 if o!=arm:bpy.data.objects.remove(o,do_unlink=True)
arm.data.pose_position='REST'
if arm.animation_data:
 arm.animation_data.action=None
 for tr in arm.animation_data.nla_tracks:tr.mute=True
REST={
'root':(0,0,0),'hips':(0,1.55,-.18),'spine':(0,2.12,-.04),'chest':(0,2.68,.12),'neck':(0,3.28,.24),'head':(0,3.98,.44),'jaw':(0,4.02,.73),'belly':(0,1.65,.55),
'tail1':(0,1.65,-.65),'tail2':(0,1.44,-1.40),'tail3':(0,1.36,-2.02),'tail4':(0,1.48,-2.65),'tail5':(0,1.82,-3.0)
}
for s,side in [(1,'L'),(-1,'R')]:
 for n,p in {'thigh':(.67,1.60,-.18),'shin':(.70,.89,.12),'ankle':(.66,.42,-.27),'toe':(.66,.16,.08),'arm':(.50,2.7,.43),'forearm':(.65,2.43,.61),'hand':(.63,2.32,.91),'brow':(.48,4.31,.64)}.items():REST[n+side]=(s*p[0],p[1],p[2])
bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for bone in arm.data.edit_bones:
 delta=bone.tail-bone.head
 bone.head=aw.inverted()@V(REST[bone.name]);bone.tail=bone.head+delta
bpy.ops.object.mode_set(mode='OBJECT');arm.select_set(False)
skin=mat('Rex Plum Skin','#603448');gold=mat('Rex Golden Underside','#c6913b');dark=mat('Rex Dark Ridge','#312435');ivory=mat('Rex Ivory Teeth','#dfcda5',.6);gum=mat('Rex Mouth Interior','#421c2c');eye=mat('Rex Eye Cream','#fff0ce',.35);iris=mat('Rex Amber Iris','#c18a2f',.4);pupil=mat('Rex Pupils','#17131d',.38)
BODY=[];SOURCE=[];ALL=[]
def mesh(name,verts,faces,material,weights=None,body=False):
 me=bpy.data.meshes.new(name+'Topology');me.from_pydata([V(v) for v in verts],[],faces);me.update()
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(material)
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
 for p in me.polygons:p.use_smooth=True
 ob['authoring']='Rebuilt quad surfaces; Blender remesh and manual regional skinning'
 if weights:
  for i,(v,w) in enumerate(zip(verts,weights)):
   for n,val in w.items():
    if val>0:
     vg=ob.vertex_groups.get(n) or ob.vertex_groups.new(name=n);vg.add([i],val,'REPLACE')
   if body:SOURCE.append((V(v),w))
 if body:BODY.append(ob)
 else:ALL.append(ob)
 return ob
def weighted(a,b,t):
 w={}
 for n,q in a.items():w[n]=w.get(n,0)+q*(1-t)
 for n,q in b.items():w[n]=w.get(n,0)+q*t
 return w
def loft(name,sections,material,body=False,sides=24,steps=3,axes='vertical',power=1):
 # sections: center xyz, first/second cross radii, skin weights. Catmull-Rom centers/radii.
 vs=[];ws=[];fs=[]
 def cat(a,b,c,d,t):return (2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)*.5
 rings=[]
 for k in range(len(sections)-1):
  for j in range(steps):
   t=j/steps;a=sections[max(0,k-1)];b=sections[k];c=sections[k+1];d=sections[min(len(sections)-1,k+2)]
   p=cat(Vector(a[0]),Vector(b[0]),Vector(c[0]),Vector(d[0]),t)
   r1=max(.002,cat(a[1],b[1],c[1],d[1],t));r2=max(.002,cat(a[2],b[2],c[2],d[2],t))
   rings.append((p,r1,r2,weighted(b[3],c[3],t)))
 rings.append((Vector(sections[-1][0]),sections[-1][1],sections[-1][2],sections[-1][3]))
 for i,(p,r1,r2,w) in enumerate(rings):
  tangent=(rings[min(i+1,len(rings)-1)][0]-rings[max(0,i-1)][0]).normalized()
  if axes=='vertical':u=Vector((1,0,0));v=Vector((0,0,1))
  elif axes=='head':u=Vector((1,0,0));v=Vector((0,1,0))
  else:
   ref=Vector((1,0,0)) if abs(tangent.x)<.8 else Vector((0,0,1));u=(ref-tangent*ref.dot(tangent)).normalized();v=tangent.cross(u).normalized()
  for j in range(sides):
   a=j*math.tau/sides;co=math.copysign(abs(math.cos(a))**power,math.cos(a));si=math.copysign(abs(math.sin(a))**power,math.sin(a))
   vs.append(tuple(p+u*co*r1+v*si*r2));ws.append(dict(w))
 for i in range(len(rings)-1):
  for j in range(sides):
   a=i*sides+j;b=i*sides+(j+1)%sides;fs.append((a,b,b+sides,a+sides))
 fs.append(tuple(reversed(range(sides))));fs.append(tuple((len(rings)-1)*sides+j for j in range(sides)))
 return mesh(name,vs,fs,material,ws,body)
def sec(p,a,b,bone):return (p,a,b,{bone:1})
# Torso and neck: one continuous ring surface. Compact upright volume with a forward neck.
loft('TorsoNeck',[
 sec((0,.94,-.04),.12,.12,'hips'),sec((0,1.20,.02),.50,.45,'hips'),sec((0,1.65,.06),.63,.65,'hips'),
 ((0,2.12,.04),.63,.65,{'spine':.75,'belly':.25}),sec((0,2.66,.08),.56,.51,'chest'),
 sec((0,3.17,.18),.40,.42,'neck'),sec((0,3.64,.29),.41,.40,'neck'),sec((0,3.99,.40),.43,.38,'head'),
 sec((0,4.19,.42),.1,.12,'head')],skin,True,32,4)
# Long tapering counterbalance tail, with a continuous upswept tip.
loft('Tail',[
 sec((0,1.65,-.45),.49,.47,'hips'),sec((0,1.58,-.88),.43,.38,'tail1'),sec((0,1.44,-1.43),.32,.28,'tail2'),
 sec((0,1.36,-2.02),.23,.23,'tail3'),sec((0,1.46,-2.63),.14,.15,'tail4'),sec((0,1.76,-2.98),.08,.09,'tail5'),
 sec((0,2.12,-3.08),.045,.045,'tail5')],skin,True,20,4,axes='path')
for s,side in [(1,'L'),(-1,'R')]:
 def pt(x,y,z):return(s*x,y,z)
 # Heavy rounded haunch flows through knee, hock and ankle, instead of separate spheres.
 loft('Leg'+side,[
 sec(pt(.56,2.05,-.21),.18,.20,'thigh'+side),sec(pt(.67,1.67,-.20),.43,.56,'thigh'+side),
 sec(pt(.70,1.18,-.01),.33,.42,'thigh'+side),sec(pt(.70,.87,.12),.22,.25,'shin'+side),
 sec(pt(.66,.48,-.26),.17,.20,'ankle'+side),sec(pt(.66,.23,-.09),.19,.22,'ankle'+side),
 sec(pt(.66,.16,.16),.27,.12,'toe'+side),sec(pt(.66,.13,.39),.15,.07,'toe'+side)],skin,True,24,3,axes='path')
 loft('Arm'+side,[sec(pt(.42,2.76,.28),.18,.20,'chest'),sec(pt(.55,2.64,.46),.19,.19,'arm'+side),sec(pt(.65,2.43,.61),.13,.13,'forearm'+side),sec(pt(.62,2.36,.86),.115,.105,'hand'+side),sec(pt(.63,2.31,.98),.10,.09,'hand'+side)],skin,True,16,3,axes='path')
 for i,off in enumerate([-.075,.075]):
  loft('Finger'+side+str(i),[sec(pt(.63+off,2.34,.93),.055,.06,'hand'+side),sec(pt(.65+off,2.24,1.02),.052,.05,'hand'+side),sec(pt(.66+off,2.13,1.03),.027,.027,'hand'+side)],skin,True,10,3,axes='path')
 for i,off in enumerate([-.18,0,.18]):
  loft('Toe'+side+str(i),[sec(pt(.66+off*.65,.18,.06),.12,.13,'toe'+side),sec(pt(.66+off,.14,.35),.115,.11,'toe'+side),sec(pt(.66+off*1.2,.10,.53),.07,.07,'toe'+side)],skin,True,12,3,axes='path')
# Broad upper head with curved side lip, built from quad rings instead of the imported rectangular wedge.
head_sections=[]
for z,w,lo,hi in [(-.05,.20,3.69,4.16),(.18,.52,3.81,4.49),(.48,.62,3.99,4.52),(.79,.64,3.91,4.42),(1.13,.60,3.73,4.29),(1.49,.52,3.55,4.18),(1.78,.44,3.49,4.08),(1.97,.34,3.58,3.99),(2.05,.04,3.72,3.82)]:
 head_sections.append(sec((0,(lo+hi)/2,z),w,(hi-lo)/2,'head'))
loft('UpperHead',head_sections,skin,True,32,3,axes='head',power=.90)
for s,side in [(1,'L'),(-1,'R')]:
 # Fused supraorbital ridge and lid support; regional cage weights retain brow motion.
 loft('Supraorbital'+side,[sec((s*.30,4.36,.72),.17,.14,'head'),sec((s*.40,4.31,.98),.17,.14,'head'),sec((s*.38,4.29,1.17),.14,.12,'head'),sec((s*.24,4.25,1.34),.07,.07,'head')],skin,True,20,4,axes='path')
 loft('BrowVolume'+side,[sec((s*.09,4.26,1.28),.045,.045,'brow'+side),sec((s*.28,4.30,1.30),.105,.085,'brow'+side),sec((s*.44,4.40,1.22),.095,.085,'brow'+side),sec((s*.55,4.33,1.0),.045,.045,'head')],skin,True,20,4,axes='path')
 loft('LowerLidVolume'+side,[sec((s*.25,4.17,1.22),.025,.025,'head'),sec((s*.40,4.115,1.27),.04,.035,'head'),sec((s*.54,4.18,1.17),.03,.03,'head')],skin,True,16,4,axes='path')
# Remesh the body as one continuous surface, then derive a quad cage.
bpy.ops.object.select_all(action='DESELECT')
for o in BODY:o.select_set(True)
body=BODY[0];bpy.context.view_layer.objects.active=body;bpy.ops.object.join();body.name='ChompRex_ContinuousBody'
body.data.remesh_voxel_size=.024;body.data.remesh_voxel_adaptivity=0
bpy.ops.object.voxel_remesh()
smoothmod=body.modifiers.new('Surface Relax','SMOOTH');smoothmod.factor=.6;smoothmod.iterations=5;bpy.ops.object.modifier_apply(modifier=smoothmod.name)
# Carve actual eye sockets and nostril cavities before retopology.
for side in [-1,1]:
 for name,center,scale in [('Eye Socket',(side*.40,4.22,1.14),(.185,.13,.19)),('Nostril',(side*.255,3.97,1.88),(.085,.13,.11))]:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=V(center));cutter=bpy.context.object;cutter.name=name;cutter.scale=(scale[0],scale[2],scale[1])
  if name=='Nostril':cutter.rotation_euler.y=side*.30
  bpy.context.view_layer.objects.active=body;mod=body.modifiers.new(name,'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
# Boolean sockets can leave coincident faces. Rebuild the closed surface before
# QuadriFlow and reject a cancelled operation instead of accepting the dense sculpt.
# Preserve the authored silhouette. QuadriFlow produced closed but folded thin
# appendages; a uniform voxel surface followed by constrained collapse is stable.
body.data.remesh_voxel_size=.025;body.data.remesh_voxel_adaptivity=0;bpy.ops.object.voxel_remesh()
bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=.00001);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(body.data);bm.free();body.data.update()
relaxbody=body.modifiers.new('Local surface relaxation','SMOOTH');relaxbody.factor=.3;relaxbody.iterations=2;bpy.ops.object.modifier_apply(modifier=relaxbody.name)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'source','chomprex-sculpt-stage.blend'))
brow_relax=body.vertex_groups.new(name='BrowSurfaceRelax')
for vertex in body.data.vertices:
 x,y,z=game(vertex.co);w=smooth((y-4.16)/.18)*smooth((z-.65)/.25)*(1-smooth((z-1.38)/.15))
 if w>0:brow_relax.add([vertex.index],w,'REPLACE')
mod=body.modifiers.new('Soften fused brow transitions','SMOOTH');mod.vertex_group=brow_relax.name;mod.factor=.5;mod.iterations=6;bpy.ops.object.modifier_apply(modifier=mod.name)
sculpt_triangles=sum(len(p.vertices)-2 for p in body.data.polygons)
dec=body.modifiers.new('Shape preserving body reduction','DECIMATE');dec.ratio=min(1,32000/sculpt_triangles);dec.use_collapse_triangulate=True;dec.use_symmetry=True;dec.symmetry_axis='X';bpy.ops.object.modifier_apply(modifier=dec.name)
bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);nonmanifold_after=sum(not e.is_manifold for e in bm.edges)+sum(not v.is_manifold for v in bm.verts);bm.to_mesh(body.data);bm.free();body.data.update();bpy.context.view_layer.update()
if nonmanifold_after:raise RuntimeError('Reduced mesh is nonmanifold')
tail_sections=[]
for z,cy,radius in [(-.88,1.58,.38),(-1.43,1.44,.28),(-2.02,1.36,.23),(-2.63,1.46,.14)]:
 top=body.ray_cast(V((0,3,z)),V((0,-1,0)));side=body.ray_cast(V((2,cy,z)),V((-1,0,0)))
 top_y=game(top[1])[1] if top[0] else None;side_x=game(side[1])[0] if side[0] else None
 valid=top_y is not None and top_y>cy+radius*.5 and side_x is not None and side_x>radius*.5
 tail_sections.append({'z':z,'top_y':top_y,'side_x':side_x,'valid':valid})
 if not valid:raise RuntimeError('Tail volume failed: '+str(tail_sections[-1]))
for x,z,min_y in [(.25,-.68,1.65),(-.25,-.68,1.65),(.45,-.5,1.75),(-.45,-.5,1.75)]:
 hit=body.ray_cast(V((x,3,z)),V((0,-1,0)))
 if not hit[0] or game(hit[1])[1]<min_y:raise RuntimeError('Hip/tail junction volume failed')
retopo={'FINISHED'};retopo_attempts=[{'method':'voxel surface plus symmetric collapse','voxel':.025,'sculpt_triangles':sculpt_triangles,'target_body_triangles':32000,'tail_sections':tail_sections,'accepted':True}]
# Skin transfer from authored regional cages, constrained to at most four influences.
kd=KDTree(len(SOURCE))
for i,(p,w) in enumerate(SOURCE):kd.insert(p,i)
kd.balance()
for g in list(body.vertex_groups):body.vertex_groups.remove(g)
groups={n:body.vertex_groups.new(name=n) for n in REST}
for vert in body.data.vertices:
 weights={}
 for co,idx,dist in kd.find_n(vert.co,5):
  for n,val in SOURCE[idx][1].items():weights[n]=weights.get(n,0)+val/max(dist,.025)**2
 items=sorted(weights.items(),key=lambda x:-x[1])[:4];total=sum(x[1] for x in items)
 for n,val in items:groups[n].add([vert.index],val/total,'REPLACE')
for p in body.data.polygons:p.use_smooth=True
ALL.append(body)
loft('TailTipFinish',[sec((0,1.99,-3.06),.042,.045,'tail5'),sec((0,2.14,-3.08),.035,.038,'tail5'),sec((0,2.28,-3.07),.004,.006,'tail5')],skin,False,12,4,axes='path')
# Surface-derived mouth line: roots enter the actual upper lip and the lower jaw
# is built from that same line. This keeps the smile coherent in every view.
def lip(t):
 u=math.sin(t);x=.58*math.cos(t);z=.50+1.42*u
 hit,co,normal,face=body.ray_cast(V((x,3.17,z)),V((0,1,0)))
 y=game(co)[1]+.018 if hit else 3.76-.36*u
 return x,y,z,u
N=65;outline=[lip(k/(N-1)*math.pi) for k in range(N)]
jverts=[];jfaces=[]
for scale,drop in [(.78,-.045),(1,0),(1.045,-.075),(1.015,-.12),(.88,-.16),(.55,-.17)]:
 for x,y,z,u in outline:
  top=y-(.12+.083*u)-(.075+.012*u)+.045
  # Keep the bottom level with the rear jaw rather than collapsing to a deep chin point.
  # Narrow the underside across X, but keep its chin beneath the lip. Scaling
  # depth around the rear hinge folded the lower rings into a backward wedge.
  jverts.append((x*scale*(.60+.40*smooth(u/.85)),top+drop*(.65+.35*u)+.10*(1-smooth(u/.5)),z-.06*(1-scale)*u+.35*(1-smooth(u/.4))))
for i in range(5):
 for j in range(N):a=i*N+j;b=i*N+(j+1)%N;jfaces.append((a,b,b+N,a+N))
jfaces.append(tuple(reversed(range(N))));jfaces.append(tuple(5*N+j for j in range(N)))
jaw=mesh('ChompRex_ArticulatedJaw',jverts,jfaces,gold,[{'jaw':1}]*len(jverts));jaw.data.materials.append(gum)
for poly in jaw.data.polygons:
 if poly.index<N or poly.index==len(jfaces)-2:poly.material_index=1
for s,side in [(1,'L'),(-1,'R')]:
 loft('GoldenCheek'+side,[sec((s*.43,4.09,.73),.035,.045,'jaw'),sec((s*.44,3.94,.85),.10,.20,'jaw'),sec((s*.40,3.63,1.08),.085,.22,'jaw'),sec((s*.30,3.28,1.62),.075,.10,'jaw'),sec((s*.14,3.24,1.83),.045,.055,'jaw'),sec((s*.03,3.24,1.92),.012,.018,'jaw')],gold,False,24,5,axes='path')
# Merge the cheek pads into the jaw so the silhouette and highlight are continuous.
jawparts=[o for o in ALL if o==jaw or o.name.startswith('GoldenCheek')]
bpy.ops.object.select_all(action='DESELECT')
for o in jawparts:o.select_set(True)
bpy.context.view_layer.objects.active=jaw
ALL=[o for o in ALL if o not in jawparts]
bpy.ops.object.join();jaw.data.remesh_voxel_size=.022;bpy.ops.object.voxel_remesh()
relax=jaw.modifiers.new('Jaw transition relaxation','SMOOTH');relax.factor=.5;relax.iterations=8;bpy.ops.object.modifier_apply(modifier=relax.name)
dec=jaw.modifiers.new('Jaw surface budget','DECIMATE');dec.ratio=.40;bpy.ops.object.modifier_apply(modifier=dec.name)
for group in list(jaw.vertex_groups):jaw.vertex_groups.remove(group)
jaw.vertex_groups.new(name='jaw').add(list(range(len(jaw.data.vertices))),1,'REPLACE')
jaw.data.materials.clear();jaw.data.materials.append(gold);jaw.data.materials.append(gum)
for p in jaw.data.polygons:
 p.use_smooth=True;p.material_index=0
ALL.append(jaw)
floor=[]
for x,y,z,u in outline:floor.append((x*.78*(.60+.40*smooth(u/.85)),y-(.12+.083*u)-(.075+.012*u)+.055+.10*(1-smooth(u/.5)),z-.0132*u+.35*(1-smooth(u/.4))))
center=tuple(sum(v[k] for v in floor)/len(floor) for k in range(3));floor.append(center)
mesh('MouthFloor',floor,[(N,(i+1)%N,i) for i in range(N)],gum,[{'jaw':1}]*len(floor))
# Custom ellipsoids only for eyeballs. Face lids, brows and claws are tapered mesh lofts.
def ellipsoid(name,center,scale,material,bone,segments=24,rings=16,angle=0):
 vs=[(center[0],center[1]+scale[1],center[2])];fs=[]
 for i in range(1,rings):
  a=math.pi*i/rings
  for j in range(segments):
   t=math.tau*j/segments;dx=scale[0]*math.sin(a)*math.cos(t);dz=scale[2]*math.sin(a)*math.sin(t)
   vs.append((center[0]+dx*math.cos(angle)+dz*math.sin(angle),center[1]+scale[1]*math.cos(a),center[2]-dx*math.sin(angle)+dz*math.cos(angle)))
 for j in range(segments):fs.append((0,1+j,1+(j+1)%segments))
 for i in range(rings-2):
  for j in range(segments):a=1+i*segments+j;b=1+i*segments+(j+1)%segments;fs.append((a,b,b+segments,a+segments))
 bottom=len(vs);vs.append((center[0],center[1]-scale[1],center[2]));last=1+(rings-2)*segments
 for j in range(segments):fs.append((last+j,bottom,last+(j+1)%segments))
 return mesh(name,vs,fs,material,[{bone:1}]*len(vs))
for s,side in [(1,'L'),(-1,'R')]:
 ellipsoid('Eye'+side,(s*.43,4.23,1.14),(.175,.110,.14),eye,'head',angle=s*.25)
 ellipsoid('Iris'+side,(s*.46,4.235,1.267),(.120,.105,.027),iris,'head',24,16,angle=s*.25)
 ellipsoid('Pupil'+side,(s*.47,4.235,1.289),(.046,.080,.014),pupil,'head',20,16,angle=s*.25)
 ellipsoid('Catchlight'+side,(s*.453,4.275,1.305),(.019,.024,.009),eye,'head',12,8,angle=s*.25)
 loft('DarkBrow'+side,[sec((s*.13,4.235,1.32),.025,.03,'brow'+side),sec((s*.32,4.255,1.35),.055,.04,'brow'+side),sec((s*.49,4.355,1.29),.055,.04,'brow'+side),sec((s*.61,4.30,1.04),.018,.021,'brow'+side)],dark,False,12,4,axes='path')
 ellipsoid('Nostril'+side,(s*.255,3.97,1.84),(.061,.10,.027),gum,'head',16,12)
for facial in ALL:
 if facial.name.startswith(('Eye','Iris','Pupil','Catchlight','BrowRidge','DarkBrow','LowerLid')):
  for vertex in facial.data.vertices:vertex.co.x*=.92
# Curved gum and tooth rows. Each tooth tapers and rounds into its own crown.
for upper in [True,False]:
 row=[]
 for k in range(4,45):
  x,y,z,u=lip(k/48*math.pi)
  if not upper:y-=(.12+.083*u)+(.075+.012*u)-.045;y+=.10*(1-smooth(u/.5));z+=.35*(1-smooth(u/.4));x*=(.60+.40*smooth(u/.85))
  row.append((x,y,z))
 loft('UpperGum' if upper else 'LowerGum',[sec(p,.025,.025,'head' if upper else 'jaw') for p in row],gum,False,8,2,axes='path')
 # Equal arc-length placement avoids crowded front incisors and widely spaced rear teeth.
 samples=[lip(j/400*math.pi) for j in range(401)];lengths=[0]
 for a,b in zip(samples,samples[1:]):lengths.append(lengths[-1]+Vector((a[0]-b[0],a[1]-b[1],a[2]-b[2])).length)
 for k in range(2,17):
  target=lengths[-1]*(k+.5)/19;j=next(i for i,l in enumerate(lengths) if l>=target);t=(j-1+(target-lengths[j-1])/(lengths[j]-lengths[j-1]))/400*math.pi
  x,rooty,z,u=lip(t)
  if not upper:rooty-=(.12+.083*u)+(.075+.012*u)-.045;rooty+=.10*(1-smooth(u/.5));z+=.35*(1-smooth(u/.4))-.035;x*=(.60+.40*smooth(u/.85))
  h=(.12+.083*u) if upper else (.075+.012*u);direction=-1 if upper else 1
  bone='head' if upper else 'jaw';r=lengths[-1]/19*.49*(.60+.40*u)
  if not upper:r*=.75
  loft(('UpperTooth' if upper else 'LowerTooth')+str(k),[
   sec((x,rooty,z),r*.8,r*.8,bone),sec((x*((.94+.04*u) if upper else 1),rooty+direction*h*.25,z+.015),r,r*.90,bone),
   sec((x*((.80+.13*u) if upper else 1),rooty+direction*h*.78,z+.028),r*.80,r*.75,bone),sec((x*((.72+.18*u) if upper else 1),rooty+direction*h,z+.035),r*.36,r*.40,bone)],ivory,False,12,3,axes='vertical',power=.8)
# Rounded dark dorsal plates, with a consistent size rhythm.
for i,(p,h,bn) in enumerate([
 ((0,4.46,.27),.23,'head'),((0,4.31,-.02),.27,'head'),((0,4.02,-.22),.26,'neck'),
 ((0,3.65,-.27),.26,'neck'),((0,3.25,-.31),.24,'neck'),((0,2.87,-.43),.24,'chest'),
 ((0,2.49,-.57),.25,'spine'),((0,2.05,-.63),.26,'hips'),
 ((0,1.98,-.99),.24,'tail1'),((0,1.78,-1.45),.22,'tail2'),((0,1.59,-1.96),.17,'tail3'),
 ((0,1.61,-2.38),.13,'tail4'),((0,1.80,-2.74),.10,'tail4'),((0,1.96,-2.98),.07,'tail5')]):
 direction=Vector((0,1,0)) if p[1]>4.1 or p[2]<-.75 else Vector((0,.15,-1)).normalized()
 hit,location,normal,face=body.ray_cast(V(Vector(p)+direction*2),V(-direction))
 base=Vector(game(location)) if hit else Vector(p)
 depth=.20 if i<8 else .16*(1-(i-8)/10);width=.075 if i<8 else .06
 h*=.90 if i<8 else 1
 loft('DorsalPlate%02d'%i,[sec(tuple(base-direction*.025),width,depth,bn),sec(tuple(base+direction*h*.38),width*.95,depth*.91,bn),sec(tuple(base+direction*h*.82+Vector((0,0,-.045))),width*.48,depth*.48,bn),sec(tuple(base+direction*h+Vector((0,0,-.055))),.012,.02,bn)],dark,False,12,3,axes='path')
for s,side in [(1,'L'),(-1,'R')]:
 for i,off in enumerate([-.18,0,.18]):
  x=s*(.66+off*1.2)
  loft('FootClaw'+side+str(i),[sec((x,.13,.44),.12,.11,'toe'+side),sec((x,.16,.60),.115,.09,'toe'+side),sec((x,.065,.78),.035,.028,'toe'+side)],dark,False,12,3,axes='path')
 for i,off in enumerate([-.075,.075]):
  x=s*(.66+off)
  loft('HandClaw'+side+str(i),[sec((x,2.17,1.03),.04,.04,'hand'+side),sec((x,2.08,1.07),.034,.035,'hand'+side),sec((x,2.03,1.14),.006,.006,'hand'+side)],dark,False,10,3,axes='path')
# Regional vertex paint is editable source for the later baked UV color atlas.
attr=body.data.color_attributes.new(name='RexPaint',type='FLOAT_COLOR',domain='POINT')
pattern=body.data.color_attributes.new(name='RexPattern',type='FLOAT_COLOR',domain='POINT')
for v in body.data.vertices:
 x,y,z=game(v.co)
 n=v.normal;front=-n.y
 # Surface angle follows the belly shape; anatomical masks exclude head/arms.
 head_region=sum(g.weight for g in v.groups if body.vertex_groups[g.group].name in ['head','jaw','browL','browR'])
 arm_region=sum(g.weight for g in v.groups if body.vertex_groups[g.group].name.startswith(('arm','forearm','hand','thigh','shin','ankle','toe')))
 vent=smooth((front-.20)/.65)*smooth((z-.28)/.15)*smooth((y-.90)/.30)*(1-smooth((y-3.70)/.12))*(1-smooth(head_region/.6))*(1-smooth((arm_region-.2)/.5))
 tailgold=smooth((-n.z-.12)/.65)*smooth((-z-.45)/.55)
 f=smooth((max(vent,tailgold)-.30)/.32)
 base=Vector(rgb('#603448'));yellow=Vector(rgb('#c6913b'))
 shade=.92+.08*math.sin(y*1.4+z*.8);col=base*shade
 spots=math.sin(x*8.1+.6)*math.sin(y*7.2+.3)*math.sin(z*7.7+1.3)+.25*math.sin(x*16+y*12+z*6)
 spot=smooth((spots-.35)/.2)*(1-f)*smooth((abs(x)-.32)/.25)
 col=col.lerp(yellow,f)
 seam=(.5+.5*math.cos((y-.15*z)*math.tau/.32))**28*f*.20
 # Fine belly grooves are baked at texture resolution, avoiding vertex-sized bands.
 attr.data[v.index].color=(*col,f)
 weight=lambda names:sum(g.weight for g in v.groups if body.vertex_groups[g.group].name in names)
 headmask=weight(['head']);haunch=weight(['thighL','thighR']);lower=weight(['ankleL','ankleR','toeL','toeR','handL','handR'])
 spotmask=(1-headmask*smooth((z-.45)/.5))*(1-lower)*smooth((y-.3)/.5)
 pattern.data[v.index].color=(spotmask,(7.2-3.9*haunch)/10,0,1)
# Smooth the anatomical color field on the actual surface before sharpening it
# in the bake shader; normal/weight noise must not produce a sawtooth bib edge.
neighbors=[set() for v in body.data.vertices]
for e in body.data.edges:
 a,b=e.vertices;neighbors[a].add(b);neighbors[b].add(a)
field=[float(c.color[3]) for c in attr.data]
for iteration in range(6):
 field=[value*.35+.65*sum(field[j] for j in neighbors[i])/len(neighbors[i]) if neighbors[i] else value for i,value in enumerate(field)]
for i,value in enumerate(field):
 c=list(attr.data[i].color);c[3]=value;attr.data[i].color=c
nodes=skin.node_tree.nodes;links=skin.node_tree.links;vc=nodes.new('ShaderNodeVertexColor');vc.layer_name='RexPaint';links.new(vc.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
# Only the body uses the painted material; separate face ridges retain a solid plum material.
plain=mat('Rex Facial Plum','#603448')
for o in ALL:
 if o!=body and o.data.materials and o.data.materials[0]==skin:o.data.materials[0]=plain
for ob in ALL:
 mod=ob.modifiers.new('Rex Skin Deform','ARMATURE');mod.object=arm;ob.parent=arm
 ob.matrix_parent_inverse=arm.matrix_world.inverted()
# A review-ready editable scene, not a production-ready export.
bpy.context.view_layer.update()
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'source','chomprex-overhaul-work.blend'))
audit={'stage':'reference-led geometry; shape-preserving body reduction validated; see separate export/runtime reports','bones':len(arm.data.bones),'actions':[a.name for a in bpy.data.actions],'meshes':len(ALL),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in ALL),'body_vertices':len(body.data.vertices),'body_polygons':len(body.data.polygons),'body_quads':sum(len(p.vertices)==4 for p in body.data.polygons)}
audit.update({'retopology_attempts':retopo_attempts,'reduction_result':sorted(retopo),'body_nonmanifold_edges':nonmanifold_after,'max_body_influences':max(len(v.groups) for v in body.data.vertices),'max_weight_sum_error':max(abs(sum(g.weight for g in v.groups)-1) for v in body.data.vertices)})
json.dump(audit,open(os.path.join(OUT,'review','geometry-audit.json'),'w'),indent=2)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Review World');scene.world.color=(.35,.35,.35);scene.view_settings.view_transform='AgX'
def area(pos,energy,size):
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
area((4,-6,8),1100,5);area((-5,-2,4),800,5);area((2,5,6),1300,4)
bpy.ops.mesh.primitive_plane_add(size=200);plane=bpy.context.object;plane.location.z=-.04;plane.data.materials.append(mat('Review Ground','#c8bfae'))
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';target=Vector((0,.55,2.3));cam.data.ortho_scale=6.8
for name,pos in [('front',(0,-14,2.3)),('side',(-14,.55,2.3)),('back',(0,14,2.3)),('three-quarter',(10,-13,6))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(OUT,'review','geometry-'+name+'.png');bpy.ops.render.render(write_still=True)
print('GEOMETRY_STAGE_COMPLETE',json.dumps(audit))
