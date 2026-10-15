"""Verify that the remeshed forearms remain separate from the belly below the axilla."""
import bpy,os,json
from collections import defaultdict
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=os.path.join(root,'heavyweight')
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'source/heavyweight-overhaul-work.blend'))
ob=bpy.data.objects['Heavyweight_ContinuousBody'];me=ob.data;reports=[]
for height in [1.65,1.85,2.05,2.20]:
 adj=defaultdict(set)
 for face in me.polygons:
  v=[me.vertices[i].co for i in face.vertices];points=[]
  for a,b in zip(v,v[1:]+v[:1]):
   if (a.z-height)*(b.z-height)<0:
    q=a+(b-a)*((height-a.z)/(b.z-a.z));points.append((round(q.x,5),round(q.y,5)))
  if len(points)==2 and points[0]!=points[1]:adj[points[0]].add(points[1]);adj[points[1]].add(points[0])
 seen=set();groups=[]
 for vertex in adj:
  if vertex in seen:continue
  stack=[vertex];seen.add(vertex);group=[]
  while stack:
   v=stack.pop();group.append(v)
   for n in adj[v]:
    if n not in seen:seen.add(n);stack.append(n)
  groups.append({'vertices':len(group),'x_range':[min(v[0] for v in group),max(v[0] for v in group)],'z_range':[-max(v[1] for v in group),-min(v[1] for v in group)]})
 groups=sorted(groups,key=lambda g:g['x_range'][0]);reports.append({'height':height,'loops':len(groups),'groups':groups,'separate_arms':len(groups)==3})
result={'checks':reports,'pass':all(r['separate_arms'] for r in reports if r['height']<=2.05),'scope':'Three closed cross-section components = left arm, torso, right arm; shoulder union above axilla is intentional.'}
json.dump(result,open(os.path.join(out,'review/arm-clearance.json'),'w'),indent=2);print(json.dumps(result));assert result['pass']
