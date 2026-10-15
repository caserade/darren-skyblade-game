import bpy,bmesh,json,math,sys
from pathlib import Path
from mathutils import Vector
p=Path(__file__).resolve().parents[1]/'skydrake13';variant=sys.argv[-1] if sys.argv[-1] in ['candidate','lod'] else 'candidate';bpy.ops.wm.open_mainfile(filepath=str(p/'source'/('checkpoint12-'+variant+'.blend')))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');body=next(o for o in bpy.data.objects if o.type=='MESH');arm.data.pose_position='REST';arm.animation_data.action=None
for tr in arm.animation_data.nla_tracks:tr.mute=True
bpy.context.view_layer.update()
def game(q):return Vector((q.x,q.z,-q.y))
print('BODY',body.matrix_world);print('BONES',json.dumps({n:list(game(arm.matrix_world@arm.data.bones[n].head_local)) for n in ['chest','armL','forearmL','handL']}))
bm=bmesh.new();bm.from_mesh(body.data);skin=next(i for i,m in enumerate(body.data.materials) if m.name=='skydrake_skin');sv=set(v for f in bm.faces if f.material_index==skin for v in f.verts);bmesh.ops.remove_doubles(bm,verts=list(sv),dist=1e-5);bm.verts.ensure_lookup_table();bm.faces.ensure_lookup_table()
world=body.matrix_world
def pos(v):return game(world@v.co)
results=[]
for bound in [.45,.5,.55,.6]:
 for bottom in [1.72,1.8,1.9]:
  chosen=set()
  for f in bm.faces:
   if f.material_index!=skin:continue
   q=sum((pos(v) for v in f.verts),Vector())/len(f.verts);x,y,z=q
   if x>bound and bottom<y<2.96 and -.36<z<.56:chosen.add(f)
  edges=[e for e in bm.edges if sum(f in chosen for f in e.link_faces)==1 and len(e.link_faces)==2]
  remaining=set(edges);loops=[]
  while remaining:
   e=remaining.pop();chain=[e.verts[0],e.verts[1]];prev=e
   while chain[-1]!=chain[0]:
    nxt=[a for a in chain[-1].link_edges if a in remaining]
    if not nxt:break
    edge=nxt[0];remaining.remove(edge);chain.append(edge.other_vert(chain[-1]))
   loops.append({'closed':chain[0]==chain[-1],'count':len(chain)-1,'coords':[list(pos(v)) for v in chain[:-1]]})
  results.append({'bound':bound,'bottom':bottom,'faces':len(chosen),'loops':loops})
(p/'review'/('shoulder-boundaries-'+variant+'.json')).write_text(json.dumps(results,indent=2));print(json.dumps([{'bound':x['bound'],'bottom':x['bottom'],'faces':x['faces'],'loops':[(l['closed'],l['count']) for l in x['loops']]} for x in results]));bm.free()
