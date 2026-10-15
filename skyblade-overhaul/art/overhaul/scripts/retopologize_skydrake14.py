"""Replace only the fused shoulder/arm patch with explicit deforming loops."""
import bpy,bmesh,math,json,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
import ast
p=Path(__file__).resolve().parents[1]/'skydrake14'
def game(q):return Vector((q.x,q.z,-q.y))
def V(q):return Vector((q[0],-q[2],q[1]))
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def norm(v):return v.normalized()
reports=[]
for variant in ['candidate']:
 bpy.ops.wm.open_mainfile(filepath=str(p/'source'/('checkpoint12-'+variant+'.blend')))
 arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');body=next(o for o in bpy.data.objects if o.type=='MESH');arm.data.pose_position='REST';arm.animation_data.action=None
 for tr in arm.animation_data.nla_tracks:tr.mute=True
 bpy.context.view_layer.update();skin=next(i for i,m in enumerate(body.data.materials) if m.name=='skydrake_skin')
 body.data.calc_loop_triangles();old_positions=[game(v.co) for v in body.data.vertices];old_faces=[];old_uvs=[]
 for tri in body.data.loop_triangles:
  if tri.material_index==skin:
   old_faces.append(tuple(tri.vertices));old_uvs.append([tuple(body.data.uv_layers.active.data[i].uv) for i in tri.loops])
 old_tree=BVHTree.FromPolygons(old_positions,old_faces,all_triangles=True);old_uvs=np.array(old_uvs)

 # Preserve imported shading on retained faces, even where UV vertices are welded.
 old_normals={};vertex_normals={}
 for poly in body.data.polygons:
  for li in poly.loop_indices:
   vi=body.data.loops[li].vertex_index;poskey=tuple(round(c,6) for c in body.data.vertices[vi].co);old_normals[(poly.index+1,poskey)]=body.data.corner_normals[li].vector.copy();vertex_normals.setdefault((poly.material_index,poskey),[]).append(body.data.corner_normals[li].vector.copy())
 bm=bmesh.new();bm.from_mesh(body.data);dl=bm.verts.layers.deform.verify();uv=bm.loops.layers.uv.verify();original=bm.faces.layers.int.new('checkpoint12_retained')
 normal_layers=[bm.loops.layers.float.new('source_normal_'+a) for a in 'xyz']
 for f in bm.faces:
  f[original]=f.index+1
  for l,li in zip(f.loops,body.data.polygons[f.index].loop_indices):
   for k,layer in enumerate(normal_layers):l[layer]=body.data.corner_normals[li].vector[k]
 sv=set(v for f in bm.faces if f.material_index==skin for v in f.verts);bmesh.ops.remove_doubles(bm,verts=list(sv),dist=1e-5)
 patch=bpy.data.materials.new('SkyDrake shoulder retopology');patch.use_nodes=True;bs=patch.node_tree.nodes.get('Principled BSDF');rgb=[.204,.278,.706];bs.inputs['Base Color'].default_value=tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb)+(1,);bs.inputs['Roughness'].default_value=.84
 target=p/'source/shoulder-color.jpg'
 if target.exists():
  tex=patch.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(target),check_existing=False);tex.image.pack();patch.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
 body.data.materials.append(patch);mi=len(body.data.materials)-1;groups={g.name:g.index for g in body.vertex_groups};newfaces=[];side_reports=[];transition_vertices=[];support_vertices=set()
 def weights(v):return dict(v[dl])
 def blend(a,b,t):return {k:a.get(k,0)*(1-t)+b.get(k,0)*t for k in a.keys()|b.keys() if a.get(k,0)*(1-t)+b.get(k,0)*t>1e-8}
 def make(q,w):
  v=bm.verts.new(V(q));ids=sorted(w,key=w.get)[-4:];total=sum(w[k] for k in ids)
  for k in ids:v[dl][k]=w[k]/total
  return v
 def face(vs,us):
  f=bm.faces.new(vs);f.material_index=mi;f.smooth=True;f[original]=0
  for loop,co in zip(f.loops,us):loop[uv].uv=co
  newfaces.append(f);return f
 def stitch(a,b,va,vb,offset):
  # Zip unequal rings by normalized arc index; every original boundary edge is used.
  i=j=0;na,nb=len(a),len(b)
  while i<na or j<nb:
   ta=(i+1)/na if i<na else 2;tb=(j+1)/nb if j<nb else 2
   U=lambda t:offset+t*.48
   if abs(ta-tb)<1e-8:
    face([a[i%na],a[(i+1)%na],b[(j+1)%nb],b[j%nb]],[(U(i/na),va),(U((i+1)/na),va),(U((j+1)/nb),vb),(U(j/nb),vb)]);i+=1;j+=1
   elif ta<tb:
    face([a[i%na],a[(i+1)%na],b[j%nb]],[(U(i/na),va),(U((i+1)/na),va),(U(j/nb),vb)]);i+=1
   else:
    face([a[i%na],b[(j+1)%nb],b[j%nb]],[(U(i/na),va),(U((j+1)/nb),vb),(U(j/nb),vb)]);j+=1
 def reorder(loop,center,u,v):
  # Select a consistent start while preserving the original boundary order.
  angles=[math.atan2((game(a.co)-center).dot(v),(game(a.co)-center).dot(u)) for a in loop]
  winding=sum(math.atan2(math.sin(angles[(i+1)%len(loop)]-angles[i]),math.cos(angles[(i+1)%len(loop)]-angles[i])) for i in range(len(loop)))
  if winding<0:loop=list(reversed(loop))
  start=min(range(len(loop)),key=lambda i:abs(math.atan2((game(loop[i].co)-center).dot(v),(game(loop[i].co)-center).dot(u))))
  return loop[start:]+loop[:start]
 def sample(loop,t):
  k=t*len(loop);i=int(k)%len(loop);f=k-int(k);a,b=loop[i],loop[(i+1)%len(loop)];return game(a.co).lerp(game(b.co),f),blend(weights(a),weights(b),f)
 for s,side in [(1,'L'),(-1,'R')]:
  selected=set()
  for f in bm.faces:
   if f.material_index!=skin:continue
   q=sum((game(v.co) for v in f.verts),Vector())/len(f.verts);x,y,z=q
   if s*x>.6 and 1.9<y<2.96 and -.36<z<.56:selected.add(f)
  edges=[e for e in bm.edges if sum(f in selected for f in e.link_faces)==1 and len(e.link_faces)==2];remaining=set(edges);loops=[]
  while remaining:
   e=remaining.pop();chain=[e.verts[0],e.verts[1]]
   while chain[-1]!=chain[0]:
    nxt=[a for a in chain[-1].link_edges if a in remaining]
    if len(nxt)!=1:raise RuntimeError('Patch boundary is not a simple closed loop')
    e=nxt[0];remaining.remove(e);chain.append(e.other_vert(chain[-1]))
   loops.append(chain[:-1])
  if len(loops)!=2:raise RuntimeError('Expected torso and wrist loops')
  outer=max(loops,key=len);wrist=min(loops,key=len);removed=len(selected)
  support_vertices.update(outer)
  support_vertices.update(e.other_vert(v) for v in outer for e in v.link_edges if any(f not in selected for f in e.link_faces))
  bmesh.ops.delete(bm,geom=list(selected),context='FACES_ONLY')
  # Remove orphan internal edges/vertices; preserve every boundary vertex.
  bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces and e not in edges],context='EDGES')
  bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_edges],context='VERTS')
  shoulder=game(arm.matrix_world@arm.data.bones['arm'+side].head_local);elbow=game(arm.matrix_world@arm.data.bones['forearm'+side].head_local);end=sum((game(v.co) for v in wrist),Vector())/len(wrist)
  axis=norm(elbow-shoulder);u=norm(Vector((0,0,1))-axis*axis.z);v=axis.cross(u).normalized();outer=reorder(outer,shoulder,u,v);loweraxis=norm(end-elbow);loweru=norm(u-loweraxis*u.dot(loweraxis));lowerv=loweraxis.cross(loweru).normalized();wrist=reorder(wrist,end,loweru,lowerv)
  # The old union carries arm weights into the torso-side cut. Remove that
  # contamination across three retained edge rings; keep the wrist loop intact.
  armgroups=[groups[n+side] for n in ['arm','forearm','hand']]
  seen=set(wrist);frontier=set(outer)
  for strength in [1.,.66,.33]:
   nextfront=set()
   for vert in frontier-seen:
    weight=weights(vert);moved=sum(weight.get(k,0)*strength for k in armgroups)
    for k in armgroups:
     if k in vert[dl]:vert[dl][k]*=1-strength
    vert[dl][groups['chest']]=weight.get(groups['chest'],0)+moved
    nextfront.update(e.other_vert(vert) for e in vert.link_edges)
   seen.update(frontier);frontier=nextfront-seen
  N=48;offset=.01 if side=='L' else .51;prior=outer;pv=.01
  root_center=shoulder+Vector((s*.30,0,0));axis=Vector((s,0,0));u=Vector((0,0,1));v=axis.cross(u);outer=reorder(outer,root_center,u,v);chest={groups['chest']:1}
  # Structured torso annulus: skin support stays on the central chain until
  # the new shoulder socket, instead of inheriting the distant elbow motion.
  for step,t in enumerate([.125,.25,.375,.5,.625,.75,.875,1.]):
   ring=[]
   for j in range(96):
    angle=math.tau*j/96;q,w=sample(outer,j/96);target=root_center+.225*(u*math.cos(angle)+v*math.sin(angle));delta=target-q;distance=delta.length
    ns=vertex_normals.get((skin,tuple(round(c,6) for c in outer[int(j/96*len(outer))].co)));normal=game(sum(ns,Vector()).normalized()) if ns else Vector((s,0,0));tangent=delta-normal*delta.dot(normal);tangent=tangent.normalized()*distance*.9;endtan=axis*distance*.25
    q=q*(2*t**3-3*t*t+1)+tangent*(t**3-2*t*t+t)+target*(-2*t**3+3*t*t)+endtan*(t**3-t*t)
    w=blend(w,chest,smooth(t));w=blend(w,{groups['arm'+side]:1},.5*smooth(t));ring.append(make(q,w))
   if t<1:transition_vertices.extend(ring)
   nv=.01+t*.26;stitch(prior,ring,pv,nv,offset);prior=ring;pv=nv
  # Ordered cross-sections through upper arm and elbow; retained wrist closes it.
  path=[]
  cp1=root_center+Vector((s*.18,0,0));cp2=elbow+Vector((0,.20,-.03))
  def armcurve(t):return root_center*(1-t)**3+cp1*(3*(1-t)**2*t)+cp2*(3*(1-t)*t*t)+elbow*t**3
  def armtangent(t):return norm((cp1-root_center)*(1-t)**2+(cp2-cp1)*(2*(1-t)*t)+(elbow-cp2)*t*t)
  for t in [.12,.28,.45,.62,.78]:
   w=blend(chest,{groups['arm'+side]:1},.5+.5*smooth(t/.5));path.append((armcurve(t),.225*(1-t)+.16*t,armtangent(t),w,0))
  aa=armcurve(.78);bb=elbow.lerp(end,.35)
  for t in [.2,.4,.6,.8,1.]:
   center=aa*(1-t)**2+elbow*(2*(1-t)*t)+bb*t*t;tangent=norm((elbow-aa)*(1-t)+(bb-elbow)*t);w=blend({groups['arm'+side]:1},{groups['forearm'+side]:1},smooth(t));path.append((center,.174*(1-t)+.146*t,tangent,w,0))
  for t in [.5,.7,.9]:path.append((elbow.lerp(end,t),.16*(1-t)+.12*t,loweraxis,{groups['forearm'+side]:1},smooth((t-.5)/.5)))
  for k,(center,radius,tangent,w,wristblend) in enumerate(path):
   uu=norm(u-tangent*u.dot(tangent));vv=tangent.cross(uu).normalized();ring=[]
   for j in range(N):
    angle=math.tau*j/N;q=center+radius*(uu*math.cos(angle)+vv*math.sin(angle));_,ww=sample(wrist,j/N);ring.append(make(q,blend(w,ww,wristblend)))
   nv=.27+(k+1)*.67/len(path);stitch(prior,ring,pv,nv,offset);prior=ring;pv=nv
  stitch(prior,wrist,pv,.99,offset);side_reports.append({'side':side,'removedFaces':removed,'torsoBoundary':len(outer),'wristBoundary':len(wrist),'ringVertices':N,'rings':len(path)+8})
 fair=set(transition_vertices)|support_vertices
 for _ in range(16):
  for amount in [.45,-.47]:bmesh.ops.smooth_vert(bm,verts=list(fair),factor=amount,use_axis_x=True,use_axis_y=True,use_axis_z=True)
 # Recompute only new patch shading; retain the original corner normals elsewhere.
 bmesh.ops.recalc_face_normals(bm,faces=list(newfaces));bm.normal_update();bmesh.ops.triangulate(bm,faces=list(newfaces));bm.normal_update()
 boundary_errors=[e for e in bm.edges if any(f.material_index==mi for f in e.link_faces) and len(e.link_faces)!=2]
 if boundary_errors:raise RuntimeError('New patch is not watertight: '+str(len(boundary_errors)))
 patchverts=set(v for f in bm.faces if f.material_index==mi for v in f.verts)
 normals=[]
 for f in bm.faces:
  for l in f.loops:
   if l.vert in patchverts or l.vert in support_vertices:n=l.vert.normal
   else:n=Vector(tuple(l[layer] for layer in normal_layers))
   normals.append(tuple(n))
 bm.to_mesh(body.data);bm.free();body.data.update();body.data.normals_split_custom_set(normals)
 arm.data.pose_position='POSE';arm.animation_data.action=None
 for bone in arm.pose.bones:bone.matrix_basis=Matrix.Identity(4)
 bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
 bpy.ops.wm.save_as_mainfile(filepath=str(p/'source'/('skydrake-'+variant+'.blend')))
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);arm.select_set(True);bpy.context.view_layer.objects.active=arm
 bpy.ops.export_scene.gltf(filepath=str(p/'export'/('skydrake-'+variant+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_influence_nb=4,export_all_influences=False,export_materials='EXPORT')
 reports.append({'variant':variant,'sides':side_reports,'patchWatertight':not boundary_errors,'bones':len(arm.data.bones),'actions':len(bpy.data.actions),'materials':len(body.data.materials)})
(p/'review/retopology-14.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports))
