"""Stormbelly overhaul: Blender-native mesh construction, remeshing and skinning.
Work in progress; never exports to dist. Game axes in authoring helpers: X right, Y up, Z forward.
The supplied rig/actions are retained as editable source, with retargeted rest positions.
"""
import bpy, bmesh, math, os, json, random
from mathutils import Vector, Matrix
from mathutils.kdtree import KDTree
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'heavyweight')
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
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'source','supplied-heavyweight-import.blend'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
aw=arm.matrix_world.copy();arm.parent=None;arm.matrix_world=aw;arm.name='Heavyweight_Rig'
for o in list(bpy.data.objects):
 if o!=arm:bpy.data.objects.remove(o,do_unlink=True)
arm.data.pose_position='REST'
if arm.animation_data:
 arm.animation_data.action=None
 for tr in arm.animation_data.nla_tracks:tr.mute=True
REST={'root':(0,0,0),'hips':(0,1.35,-.15),'spine':(0,2.05,-.05),'chest':(0,2.75,.0),'neck':(0,3.22,.12),'head':(0,3.78,.32),'jaw':(0,3.57,.49),'belly':(0,1.65,.85),
'tail1':(0,1.05,-.72),'tail2':(0,.72,-1.45),'tail3':(0,.42,-2.03),'tail4':(0,.25,-2.6),'tail5':(0,.29,-3.05)}
for s,side in [(1,'L'),(-1,'R')]:
 for n,q in {'thigh':(.90,1.2,-.04),'shin':(.90,.6,.02),'foot':(.90,.22,.13),'toe':(.9,.14,.48),'arm':(.9,2.65,.04),'forearm':(1.38,2.07,.15),'hand':(1.47,1.53,.28),'brow':(.2484,3.91,.71),'wing1':(.56,3.0,-.55),'wing2':(1.1088,3.3705,-.8392)}.items():REST[n+side]=(s*q[0],q[1],q[2])
for n in list(REST):
 if n.startswith(('arm','forearm','hand')):
  x,y,z=REST[n];REST[n]=(x,y+.16,z)
bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for bone in arm.data.edit_bones:
 delta=bone.tail-bone.head
 bone.head=aw.inverted()@V(REST[bone.name]);bone.tail=bone.head+delta
bpy.ops.object.mode_set(mode='OBJECT');arm.select_set(False)
skin=mat('Rex Plum Skin','#294a61');gold=mat('Rex Golden Underside','#7d929a');dark=mat('Rex Dark Ridge','#192c4a');ivory=mat('Rex Ivory Teeth','#dfcda5',.6);gum=mat('Rex Mouth Interior','#421c2c');eye=mat('Rex Eye Cream','#c8b888',.35);iris=mat('Rex Amber Iris','#c18a2f',.4);pupil=mat('Rex Pupils','#17131d',.38)
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
 previous_u=None
 for i,(p,r1,r2,w) in enumerate(rings):
  tangent=(rings[min(i+1,len(rings)-1)][0]-rings[max(0,i-1)][0]).normalized()
  if axes=='vertical':u=Vector((1,0,0));v=Vector((0,0,1))
  elif axes=='head':u=Vector((1,0,0));v=Vector((0,1,0))
  else:
   ref=previous_u if previous_u is not None else (Vector((1,0,0)) if abs(tangent.x)<.8 else Vector((0,0,1)))
   u=(ref-tangent*ref.dot(tangent)).normalized();v=tangent.cross(u).normalized();previous_u=u.copy()
  for j in range(sides):
   a=j*math.tau/sides;co=math.copysign(abs(math.cos(a))**power,math.cos(a));si=math.copysign(abs(math.sin(a))**power,math.sin(a))
   vs.append(tuple(p+u*co*r1+v*si*r2));ws.append(dict(w))
 for i in range(len(rings)-1):
  for j in range(sides):
   a=i*sides+j;b=i*sides+(j+1)%sides;fs.append((a,b,b+sides,a+sides))
 fs.append(tuple(reversed(range(sides))));fs.append(tuple((len(rings)-1)*sides+j for j in range(sides)))
 return mesh(name,vs,fs,material,ws,body)
def sec(p,a,b,bone):return (p,a,b,{bone:1})
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
