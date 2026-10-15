"""Guarantee rasterizable UV islands before atlas baking; no image recoloring."""
from collections import defaultdict
import numpy as np

def raster_safe_islands(mesh,resolution=2048,min_pixels=8):
 uv=mesh.uv_layers.active.data;edges=defaultdict(list)
 for p in mesh.polygons:
  ls=list(p.loop_indices)
  for a,b in zip(ls,ls[1:]+ls[:1]):
   key=tuple(sorted([(mesh.loops[a].vertex_index,tuple(round(float(x),6) for x in uv[a].uv)),(mesh.loops[b].vertex_index,tuple(round(float(x),6) for x in uv[b].uv))]))
   edges[key].append(p.index)
 adj=defaultdict(set)
 for ps in edges.values():
  for p in ps:adj[p].update(ps)
 seen=set();count=0;total=0;minimum=9999
 for p in mesh.polygons:
  if p.index in seen:continue
  stack=[p.index];seen.add(p.index);group=[]
  while stack:
   q=stack.pop();group.append(q)
   for n in adj[q]:
    if n not in seen:seen.add(n);stack.append(n)
  loops=[i for pi in group for i in mesh.polygons[pi].loop_indices]
  a=np.array([tuple(uv[i].uv) for i in loops]);center=a.mean(axis=0);a-=center
  _,axes=np.linalg.eigh(a.T@a);local=a@axes;span=np.ptp(local,axis=0)
  total+=1;minimum=min(minimum,float(min(span)*resolution))
  if min(span)*resolution>=min_pixels:continue
  scale=np.maximum(1,min_pixels/resolution/np.maximum(span,1e-10));fixed=(local*scale)@axes.T+center
  for i,v in zip(loops,fixed):uv[i].uv=tuple(v)
  count+=1
 return {'islands':total,'expanded':count,'minimum_before_pixels':minimum,'target_minor_axis_pixels':min_pixels}

