"""Reference-led Stormbelly candidate. Existing skeleton/actions; no gameplay changes."""
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from heavyweight_helpers import *
# One pear torso with a continuous short neck; proportions traced from supplied front/side.
torso=loft('TorsoNeck',[
 sec((0,.36,.24),.10,.12,'hips'),sec((0,.62,.28),.51,.63,'hips'),
 sec((0,1.16,.24),.99,1.04,'hips'),((0,1.65,.20),1.02,1.18,{'hips':.45,'belly':.55}),
 ((0,2.10,.10),.96,1.04,{'spine':.7,'belly':.3}),sec((0,2.58,0),.83,.76,'chest'),
 sec((0,2.98,-.02),.60,.55,'neck'),sec((0,3.35,.03),.46,.46,'neck'),sec((0,3.78,.22),.40,.42,'head'),sec((0,3.99,.23),.08,.10,'head')],skin,True,48,12)
for v in torso.data.vertices:
 x,y,z=game(v.co);phase=y+.15*x*x+.025*math.sin(y*3.4);groove=(.5+.5*math.cos(phase*math.tau/.46))**10
 strength=smooth((z-.3)/.45)*smooth((y-.45)/.35)*(1-smooth((y-2.8)/.3))
 v.co.y+=.035*groove*strength
 v.co.z-=.045*strength*(1-min(1,abs(x)))
loft('Tail',[sec((0,1.24,-.50),.61,.53,'hips'),sec((0,1.02,-.93),.49,.42,'tail1'),sec((0,.72,-1.48),.33,.30,'tail2'),sec((0,.43,-2.03),.23,.22,'tail3'),sec((0,.25,-2.57),.14,.14,'tail4'),sec((0,.27,-2.97),.09,.09,'tail5'),sec((0,.34,-3.15),.025,.035,'tail5')],skin,True,24,5,axes='path')
for s,side in [(1,'L'),(-1,'R')]:
 def pt(x,y,z):return(s*x,y,z)
 loft('Leg'+side,[sec(pt(.74,1.65,-.15),.26,.26,'hips'),sec(pt(.95,1.14,-.12),.55,.56,'thigh'+side),sec(pt(.94,.73,-.03),.39,.38,'thigh'+side),sec(pt(.92,.45,.03),.25,.27,'shin'+side),sec(pt(.90,.21,.14),.29,.33,'foot'+side),sec(pt(.90,.16,.43),.34,.16,'toe'+side),sec(pt(.90,.13,.61),.23,.09,'toe'+side)],skin,True,28,4,axes='path')
 loft('Arm'+side,[sec(pt(.70,2.88,-.05),.22,.26,'chest'),sec(pt(.94,2.65,.04),.37,.38,'arm'+side),sec(pt(1.28,2.30,.10),.27,.28,'arm'+side),sec(pt(1.38,2.07,.15),.23,.23,'forearm'+side),sec(pt(1.48,1.78,.22),.25,.24,'forearm'+side),sec(pt(1.47,1.53,.28),.21,.21,'hand'+side),sec(pt(1.47,1.39,.36),.21,.16,'hand'+side)],skin,True,24,4,axes='path')
 for i,off in enumerate([-.13,0,.13]):
  loft('Finger'+side+str(i),[sec(pt(1.35+off,1.48,.37),.075,.085,'hand'+side),sec(pt(1.38+off,1.28,.42),.074,.075,'hand'+side),sec(pt(1.37+off,1.21,.49),.045,.045,'hand'+side)],skin,True,12,4,axes='path')
 loft('Thumb'+side,[sec(pt(1.20,1.56,.35),.10,.10,'hand'+side),sec(pt(1.14,1.41,.47),.085,.085,'hand'+side),sec(pt(1.18,1.31,.54),.045,.045,'hand'+side)],skin,True,12,4,axes='path')
 for i,off in enumerate([-.23,0,.23]):
  loft('Toe'+side+str(i),[sec(pt(.90+off*.8,.19,.40),.14,.15,'toe'+side),sec(pt(.90+off,.16,.65),.13,.12,'toe'+side),sec(pt(.90+off,.10,.80),.06,.06,'toe'+side)],skin,True,12,4,axes='path')
# Rounded swept muzzle and substantial cheeks, not the old flattened jaw slab.
loft('UpperHead',[sec((0,3.65,-.08),.18,.22,'head'),sec((0,3.74,.20),.46,.35,'head'),sec((0,3.75,.48),.51,.31,'head'),sec((0,3.60,.77),.49,.25,'head'),sec((0,3.54,1.06),.42,.26,'head'),sec((0,3.56,1.25),.30,.21,'head'),sec((0,3.55,1.34),.02,.04,'head')],skin,True,32,4,axes='head',power=.92)
for s,side in [(1,'L'),(-1,'R')]:
 loft('BrowVolume'+side,[sec((s*.02,3.88,.76),.09,.10,'brow'+side),sec((s*.24,3.89,.82),.18,.15,'brow'+side),sec((s*.43,3.95,.67),.14,.13,'brow'+side),sec((s*.53,3.88,.43),.06,.07,'head')],skin,True,24,4,axes='path')
 loft('Cheek'+side,[sec((s*.41,3.73,.43),.15,.18,'head'),sec((s*.45,3.55,.58),.18,.20,'head'),sec((s*.40,3.40,.84),.12,.14,'head')],skin,True,24,4,axes='path')
 loft('NasalHood'+side,[sec((s*.19,3.64,1.06),.065,.09,'head'),sec((s*.23,3.70,1.18),.085,.09,'head'),sec((s*.27,3.67,1.26),.055,.06,'head')],skin,True,16,4,axes='path')
# Lift the arm mass to the high shoulder and hand positions in the turnaround.
for ob in BODY:
 if ob.name.startswith(('Arm','Finger','Thumb')):
  for v in ob.data.vertices:v.co.z+=.16
# Separate fingertips and palms from the torso while retaining the shoulder union.
for ob in BODY:
 if ob.name.startswith(('Finger','Thumb')):
  s=1 if 'L' in ob.name else -1
  for v in ob.data.vertices:v.co.x+=s*.12
SOURCE=[]
for ob in BODY:
 for v in ob.data.vertices:SOURCE.append((v.co.copy(),{ob.vertex_groups[g.group].name:g.weight for g in v.groups}))
bpy.ops.object.select_all(action='DESELECT')
for ob in BODY:ob.select_set(True)
body=BODY[0];bpy.context.view_layer.objects.active=body;bpy.ops.object.join();body.name='Heavyweight_ContinuousBody'
body.data.remesh_voxel_size=.026;bpy.ops.object.voxel_remesh()
relax=body.modifiers.new('Surface relaxation','SMOOTH');relax.factor=.5;relax.iterations=5;bpy.ops.object.modifier_apply(modifier=relax.name)
for s in [-1,1]:
 for label,center,scale in [('Eye Socket',(s*.32,3.84,.81),(.18,.13,.17)),('Nostril',(s*.23,3.64,1.29),(.043,.066,.09))]:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=V(center));cut=bpy.context.object;cut.scale=(scale[0],scale[2],scale[1]);bpy.context.view_layer.objects.active=body
  mod=body.modifiers.new(label,'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
bpy.context.view_layer.objects.active=body;body.data.remesh_voxel_size=.023;bpy.ops.object.voxel_remesh()
mod=body.modifiers.new('Final surface relaxation','SMOOTH');mod.factor=.3;mod.iterations=2;bpy.ops.object.modifier_apply(modifier=mod.name)
sculpt_triangles=sum(len(p.vertices)-2 for p in body.data.polygons)
dec=body.modifiers.new('Body surface budget','DECIMATE');dec.ratio=min(1,36000/sculpt_triangles);dec.use_collapse_triangulate=True;dec.use_symmetry=True;bpy.ops.object.modifier_apply(modifier=dec.name)
bellyrelax=body.vertex_groups.new(name='BellySurfaceRelax')
for v in body.data.vertices:
 x,y,z=game(v.co);w=smooth((z-.5)/.45)*smooth((y-.5)/.4)*(1-smooth((y-2.8)/.25))
 if w>0:bellyrelax.add([v.index],w,'REPLACE')
mod=body.modifiers.new('Remove isolated belly pinching','SMOOTH');mod.vertex_group=bellyrelax.name;mod.factor=.55;mod.iterations=6;bpy.ops.object.modifier_apply(modifier=mod.name)
bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.to_mesh(body.data);bm.free()
assert nonmanifold==0
kd=KDTree(len(SOURCE))
for i,(pos,w) in enumerate(SOURCE):kd.insert(pos,i)
kd.balance()
for g in list(body.vertex_groups):body.vertex_groups.remove(g)
groups={n:body.vertex_groups.new(name=n) for n in REST}
for vertex in body.data.vertices:
 weights={}
 for co,idx,d in kd.find_n(vertex.co,5):
  for n,value in SOURCE[idx][1].items():weights[n]=weights.get(n,0)+value/max(d,.025)**2
 items=sorted(weights.items(),key=lambda q:-q[1])[:4];total=sum(v for n,v in items)
 for n,value in items:groups[n].add([vertex.index],value/total,'REPLACE')
# Smooth weights along connected topology, never across the open arm/belly gap.
# Nearest-cage assignment alone caused abrupt 40% weight jumps on 2cm edges.
import numpy as np
names=list(REST);weightfield=np.zeros((len(body.data.vertices),len(names)),dtype=np.float32)
for v in body.data.vertices:
 for g in v.groups:weightfield[v.index,names.index(body.vertex_groups[g.group].name)]=g.weight
edges=np.array([list(e.vertices) for e in body.data.edges]);degree=np.bincount(edges.ravel(),minlength=len(weightfield)).astype(np.float32)
for iteration in range(36):
 acc=np.zeros_like(weightfield);np.add.at(acc,edges[:,0],weightfield[edges[:,1]]);np.add.at(acc,edges[:,1],weightfield[edges[:,0]])
 weightfield=.35*weightfield+.65*acc/np.maximum(degree[:,None],1)
# Distal tail weights cannot bleed into the rump through nearest-surface transfer.
# Blend the existing proximal tail support into a continuous longitudinal field.
for v in body.data.vertices:
 x,y,z=game(v.co)
 if z>-.45:continue
 row=weightfield[v.index];tailidx=[names.index('tail'+str(i)) for i in range(1,6)]
 total=float(row[tailidx].sum())
 if total<1e-5:continue
 row[tailidx]=0
 t=max(0,min(4,(-z-.93)/.56));lo=int(t);hi=min(4,lo+1);f=smooth(t-lo)
 row[tailidx[lo]]=total*(1-f);row[tailidx[hi]]+=total*f
for g in body.vertex_groups:g.remove(list(range(len(body.data.vertices))))
for v in body.data.vertices:
 row=weightfield[v.index];indices=np.argsort(row)[-4:];total=float(row[indices].sum())
 for i in indices:
  if row[i]>1e-7:groups[names[i]].add([v.index],float(row[i])/total,'REPLACE')
for face in body.data.polygons:face.use_smooth=True
ALL.append(body)
claw=mat('Charcoal Claws','#292e30',.7)
# Pale jutting jaw; continuous rounded loft with narrow rear hinge.
jawob=loft('HeavyweightJaw',[sec((0,3.48,.35),.26,.16,'jaw'),sec((0,3.37,.60),.48,.27,'jaw'),sec((0,3.30,.91),.47,.31,'jaw'),sec((0,3.26,1.16),.37,.29,'jaw'),sec((0,3.29,1.34),.19,.17,'jaw'),sec((0,3.31,1.40),.015,.025,'jaw')],gold,False,32,5,axes='head')
# Reference lower lip cups the pointed upper muzzle; it is not a convex white cap.
for v in jawob.data.vertices:
 x,y,z=game(v.co);side=min(1,abs(x)/.48);front=smooth((z-.35)/.3)
 v.co.z+=front*(.12*side*side-.22*(1-side*side)*smooth((y-3.30)/.22))
for s,side in [(1,'L'),(-1,'R')]:
 ellipsoid('Eye'+side,(s*.32,3.85,.82),(.130,.060,.13),eye,'head',angle=s*.2)
 ellipsoid('Iris'+side,(s*.325,3.84,.941),(.063,.047,.022),iris,'head',angle=s*.2)
 ellipsoid('Pupil'+side,(s*.32,3.84,.958),(.027,.038,.012),pupil,'head',20,14)
 ellipsoid('Catchlight'+side,(s*.302,3.871,.969),(.012,.014,.006),eye,'head',12,8)
 ellipsoid('Nostril'+side,(s*.23,3.64,1.235),(.032,.048,.018),pupil,'head',16,12,angle=s*.38)
 loft('Tusk'+side,[sec((s*.40,3.46,1.03),.067,.07,'jaw'),sec((s*.41,3.57,1.06),.052,.055,'jaw'),sec((s*.40,3.69,1.03),.010,.014,'jaw')],ivory,False,16,4,axes='path')
 horn=mat('Horn'+side,'#80613e',.8)
 hornob=loft('Horn'+side,[sec((s*.34,4.00,.17),.17,.17,'head'),sec((s*.45,4.21,.09),.15,.15,'head'),sec((s*.53,4.34,.04),.125,.125,'head'),sec((s*.64,4.40,.02),.10,.10,'head'),sec((s*.77,4.36,.0),.055,.055,'head'),sec((s*.93,4.32,-.03),.006,.008,'head')],horn,False,24,5,axes='path')
 bands=hornob.data.color_attributes.new(name='HornBands',type='FLOAT_COLOR',domain='POINT')
 for v in hornob.data.vertices:
  shade=.88+.12*(.5+.5*math.cos((v.index//24)*math.pi*.8));bands.data[v.index].color=(*(c*shade for c in rgb('#80613e')),1)
 hn=horn.node_tree.nodes.new('ShaderNodeVertexColor');hn.layer_name='HornBands';horn.node_tree.links.new(hn.outputs['Color'],horn.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 loft('Ear'+side,[sec((s*.43,3.90,.16),.11,.06,'head'),sec((s*.63,3.88,.11),.07,.04,'head'),sec((s*.69,3.82,.08),.008,.012,'head')],skin,False,16,4,axes='path')
 for i,off in enumerate([-.23,0,.23]):
  loft('FootClaw'+side+str(i),[sec((s*(.9+off),.15,.70),.11,.11,'toe'+side),sec((s*(.9+off),.12,.88),.08,.075,'toe'+side),sec((s*(.9+off),.04,.96),.008,.012,'toe'+side)],claw,False,12,3,axes='path')
 for i,off in enumerate([-.13,0,.13]):
  loft('HandClaw'+side+str(i),[sec((s*(1.49+off),1.25,.47),.045,.045,'hand'+side),sec((s*(1.48+off),1.16,.53),.03,.035,'hand'+side),sec((s*(1.45+off),1.14,.58),.005,.007,'hand'+side)],claw,False,10,3,axes='path')
# Rounded navy dorsal scales seated on the actual back surface.
for i,(p,h,bone) in enumerate([((0,4.00,.15),.20,'head'),((0,3.83,-.05),.22,'head'),((0,3.55,-.24),.25,'neck'),((0,3.21,-.38),.27,'neck'),((0,2.83,-.55),.30,'chest'),((0,2.39,-.76),.31,'spine'),((0,1.94,-.92),.31,'spine'),((0,1.47,-.96),.29,'hips'),((0,1.2,-1.18),.26,'tail1'),((0,.95,-1.55),.22,'tail2'),((0,.69,-1.95),.18,'tail3'),((0,.48,-2.35),.14,'tail4'),((0,.40,-2.69),.10,'tail4')]):
 direction=Vector((0,1,0)) if i==0 or i>7 else Vector((0,.2,-1)).normalized()
 hit,co,normal,face=body.ray_cast(V(Vector(p)+direction*2),V(-direction));base=Vector(game(co)) if hit else Vector(p)
 loft('Dorsal%02d'%i,[sec(tuple(base-direction*.02),.09,.18,bone),sec(tuple(base+direction*h*.4),.10,.16,bone),sec(tuple(base+direction*h*.82),.06,.09,bone),sec(tuple(base+direction*h),.008,.015,bone)],dark,False,16,4,axes='path')
loft('Spade',[sec((0,.65,-3.06),.015,.025,'tail5'),sec((0,.47,-3.15),.20,.06,'tail5'),sec((0,.32,-3.23),.28,.07,'tail5'),sec((0,.15,-3.31),.14,.045,'tail5'),sec((0,.03,-3.38),.008,.012,'tail5')],dark,False,24,4,axes='vertical')
for ob in ALL:
 if ob.name.startswith('HandClaw'):
  for v in ob.data.vertices:v.co.z+=.16
for s,side in [(1,'L'),(-1,'R')]:
 loft('ThumbClaw'+side,[sec((s*1.30,1.48,.53),.04,.04,'hand'+side),sec((s*1.31,1.42,.60),.03,.03,'hand'+side),sec((s*1.34,1.42,.65),.005,.006,'hand'+side)],claw,False,10,3,axes='path')
# Small scalloped bat wings with closed, thin membrane and structural ribs.
wingmat=mat('Slate Wing Membrane','#3c596b');frame=mat('Wing Ribs','#18394d')
for s,side in [(1,'L'),(-1,'R')]:
 pts=[(.56,2.85,-.55),(.78,3.01,-.61),(1.12,3.42,-.66),(1.39,3.12,-.70),(1.64,2.78,-.72),(1.78,2.45,-.73),(1.55,2.53,-.70),(1.42,2.46,-.68),(1.32,2.37,-.65),(1.15,2.52,-.62),(.96,2.44,-.59),(.76,2.66,-.56)]
 pts=[(.56+(x-.56)*.98,3.0+(y-2.85)*.65,z-(x-.56)*.32) for x,y,z in pts]
 apex=Vector(pts[2]);verts=[];weights=[];faces=[]
 # Triangle fan panels are subdivided into radial rows for deformable membrane curvature.
 center=Vector((1.1088,3.0,-.8592));verts.append((s*center.x,center.y,center.z));weights.append({'wing1'+side:.3,'wing2'+side:.7})
 for p in pts:verts.append((s*p[0],p[1],p[2]));weights.append({'wing1'+side:max(0,min(1,(1.25-p[0])/.7)),'wing2'+side:1-max(0,min(1,(1.25-p[0])/.7))})
 for i in range(len(pts)):faces.append((0,i+1,(i+1)%len(pts)+1))
 ob=mesh('WingMembrane'+side,verts,faces,wingmat,weights)
 bpy.context.view_layer.objects.active=ob;solid=ob.modifiers.new('Membrane thickness','SOLIDIFY');solid.thickness=.025;bpy.ops.object.modifier_apply(modifier=solid.name)
 for label,indices in [('Outer',[0,1,2,3,4,5]),('FingerA',[2,6,8]),('FingerB',[2,9,10]),('Root',[0,11,10])]:
  rows=[]
  for k,idx in enumerate(indices):
   p=pts[idx];w=max(0,min(1,(1.25-p[0])/.7));rows.append(((s*p[0],p[1],p[2]+.018),.035 if k<len(indices)-1 else .018,.035 if k<len(indices)-1 else .018,{'wing1'+side:w,'wing2'+side:1-w}))
  loft('Wing'+label+side,rows,frame,False,12,4,axes='path')
# Match the narrower head and shorter sideways horn span in the supplied front view.
for ob in ALL:
 if ob==body:
  for v in ob.data.vertices:
   x,y,z=game(v.co);v.co.x*=1-.08*smooth((y-3.22)/.32)
   v.co.y+=.025*math.exp(-(x/.07)**2)*math.exp(-((y-3.96)/.14)**2)*smooth((z-.68)/.10)
 elif ob.name.startswith(('HeavyweightJaw','Eye','Iris','Pupil','Catchlight','Nostril','Tusk','Horn','Ear')):
  for v in ob.data.vertices:v.co.x*=.80 if ob.name.startswith('Horn') else .92
 ob.data.update()
# Anatomical paint fields, followed by the raster-safe baked atlas pipeline.
attr=body.data.color_attributes.new(name='RexPaint',type='FLOAT_COLOR',domain='POINT');pattern=body.data.color_attributes.new(name='RexPattern',type='FLOAT_COLOR',domain='POINT')
for v in body.data.vertices:
 x,y,z=game(v.co);n=v.normal
 weight=lambda names:sum(g.weight for g in v.groups if body.vertex_groups[g.group].name in names)
 limb=weight([n for n in REST if n.startswith(('arm','forearm','hand','thigh','shin','foot','toe'))]);head=weight(['head','browL','browR'])
 # Smooth front-facing bib from the reference silhouette, independent of noisy bone masks.
 width=.94*math.sqrt(max(0,1-((y-1.66)/1.34)**2)) if y<2.75 else .38*max(0,1-(y-2.75)/.90)+.12
 vent=(1-smooth((abs(x)-width+.05)/.11))*smooth((z-.18)/.17)*smooth((y-.34)/.16)*(1-smooth((y-3.49)/.10))*(1-smooth((limb-.55)/.35))*(1-head)

 under=smooth((-n.z-.15)/.65)*smooth((-z-.65)/.5)
 f=smooth((max(vent,under)-.22)/.38);col=Vector(rgb('#294a61')).lerp(Vector(rgb('#7d929a')),f)
 attr.data[v.index].color=(*col,f);lower=weight(['handL','handR','footL','footR','toeL','toeR']);pattern.data[v.index].color=((1-head*smooth((z-.4)/.5))*(1-lower),.5,0,1)
neighbors=[set() for v in body.data.vertices]
for edge in body.data.edges:a,b=edge.vertices;neighbors[a].add(b);neighbors[b].add(a)
field=[c.color[3] for c in attr.data]
for it in range(6):field=[f*.35+.65*sum(field[j] for j in neighbors[i])/len(neighbors[i]) if neighbors[i] else f for i,f in enumerate(field)]
for i,f in enumerate(field):c=list(attr.data[i].color);c[3]=f;attr.data[i].color=c
vc=skin.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='RexPaint';skin.node_tree.links.new(vc.outputs['Color'],skin.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
plain=mat('Heavyweight Plain Skin','#294a61')
for ob in ALL:
 if ob!=body and ob.data.materials[0]==skin:ob.data.materials[0]=plain
 mod=ob.modifiers.new('Heavyweight Skin Deform','ARMATURE');mod.object=arm;ob.parent=arm;ob.matrix_parent_inverse=arm.matrix_world.inverted()
bpy.context.view_layer.update();bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'source/heavyweight-overhaul-work.blend'))
audit={'body_nonmanifold_edges':nonmanifold,'body_triangles':sum(len(p.vertices)-2 for p in body.data.polygons),'sculpt_triangles':sculpt_triangles,'meshes':len(ALL),'bones':len(arm.data.bones),'actions':[a.name for a in bpy.data.actions],'triangles':sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in ALL),'max_body_influences':max(len(v.groups) for v in body.data.vertices)}
json.dump(audit,open(os.path.join(OUT,'review/geometry-audit.json'),'w'),indent=2);print('HEAVYWEIGHT_BUILD_COMPLETE',json.dumps(audit))
