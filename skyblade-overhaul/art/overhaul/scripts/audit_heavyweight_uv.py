import bpy,json,os,math,sys
from collections import defaultdict
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=os.path.join(root,'heavyweight')
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'source/heavyweight-uv-bake-source.blend'))
o=bpy.data.objects['Heavyweight_RuntimeMesh'];me=o.data;uv=me.uv_layers.active.data
edges=defaultdict(list)
for p in me.polygons:
 for a,b in zip(p.loop_indices,list(p.loop_indices[1:])+[p.loop_indices[0]]):
  va,vb=me.loops[a].vertex_index,me.loops[b].vertex_index
  key=tuple(sorted([(va,tuple(round(float(x),6) for x in uv[a].uv)),(vb,tuple(round(float(x),6) for x in uv[b].uv))]))
  edges[key].append(p.index)
adj=defaultdict(set)
for ps in edges.values():
 for p in ps:adj[p].update(ps)
seen=set();islands=[]
for p in me.polygons:
 if p.index in seen:continue
 stack=[p.index];seen.add(p.index);group=[]
 while stack:
  q=stack.pop();group.append(q)
  for n in adj[q]:
   if n not in seen:seen.add(n);stack.append(n)
 loops=[i for pi in group for i in me.polygons[pi].loop_indices]
 us=[uv[i].uv.x for i in loops];vs=[uv[i].uv.y for i in loops]
 islands.append({'faces':len(group),'width_px':(max(us)-min(us))*2048,'height_px':(max(vs)-min(vs))*2048,'polygons':group})
result={'islands':len(islands),'narrow_under_2px':sum(min(i['width_px'],i['height_px'])<2 for i in islands),'single_faces':sum(i['faces']==1 for i in islands),'smallest':sorted(islands,key=lambda i:min(i['width_px'],i['height_px']))[:30]}
suffix=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'audit'
json.dump(result,open(os.path.join(out,'review/root-cause-07/uv-island-'+suffix+'.json'),'w'),indent=2)
print(json.dumps(result)[:6000])
