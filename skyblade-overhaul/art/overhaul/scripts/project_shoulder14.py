import bpy,numpy as np,ast
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
p=Path(__file__).resolve().parents[1]/'skydrake14'
def game(q):return Vector((q.x,q.z,-q.y))
bpy.ops.wm.open_mainfile(filepath=str(p/'source/checkpoint12-candidate.blend'))
body=next(o for o in bpy.data.objects if o.type=='MESH');skin=next(i for i,m in enumerate(body.data.materials) if m.name=='skydrake_skin');body.data.calc_loop_triangles();old_positions=[game(v.co) for v in body.data.vertices];old_faces=[];old_uvs=[]
for tri in body.data.loop_triangles:
 if tri.material_index==skin:old_faces.append(tuple(tri.vertices));old_uvs.append([tuple(body.data.uv_layers.active.data[i].uv) for i in tri.loops])
old_tree=BVHTree.FromPolygons(old_positions,old_faces,all_triangles=True);old_uvs=np.array(old_uvs)
bpy.ops.wm.open_mainfile(filepath=str(p/'source/skydrake-candidate.blend'));body=next(o for o in bpy.data.objects if o.type=='MESH');mi=next(i for i,m in enumerate(body.data.materials) if m.name=='SkyDrake shoulder retopology')
# Bake projection maps only from the final rebuilt full surface.
body.data.calc_loop_triangles();pv=[];pu=[]
for tri in body.data.loop_triangles:
 if tri.material_index==mi:
  for vi,li in zip(tri.vertices,tri.loops):pv.append(tuple(game(body.data.vertices[vi].co)));pu.append(tuple(body.data.uv_layers.active.data[li].uv))
pv=np.array(pv);pu=np.array(pu);pf=np.arange(len(pv)).reshape(-1,3)
lib=(p.parent/'skydrake12/source/sculpt_lib.py').read_text();tree=ast.parse(lib)
for fn in tree.body:
 if isinstance(fn,ast.FunctionDef) and fn.name=='raster':exec(ast.get_source_segment(lib,fn),globals())
tid,bary=raster(pf,pu,512);mask=tid>=0;points=(pv[pf[tid[mask]]]*bary[mask][...,None]).sum(1);sampleuv=[];distances=[]
for pt in points:
 hit,normal,index,distance=old_tree.find_nearest(Vector(pt));ids=old_faces[index];a,b,c=[old_positions[i] for i in ids];v0=b-a;v1=c-a;v2=hit-a;d00=v0.dot(v0);d01=v0.dot(v1);d11=v1.dot(v1);d20=v2.dot(v0);d21=v2.dot(v1);den=max(d00*d11-d01*d01,1e-12);wb=(d11*d20-d01*d21)/den;wc=(d00*d21-d01*d20)/den;sampleuv.append(old_uvs[index,0]*(1-wb-wc)+old_uvs[index,1]*wb+old_uvs[index,2]*wc);distances.append(distance)
np.savez_compressed(p/'source/shoulder-projection.npz',mask=mask,source_uv=np.array(sampleuv),distance=np.array(distances),positions=pv,uv=pu)
print("Projection saved")
